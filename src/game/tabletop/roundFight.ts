/**
 * Tabletop round-by-round fight: the glue between the game state and the shared round engine (rules/roundCombat).
 * One player choice per round, initiative order, SRD stat blocks, every roll on STATUS, death saves at 0 HP.
 * Only for a built tabletop character (engineMode 'dnd' with a SRD sheet); every other mode keeps the
 * one-turn auto-resolve in engineFight.
 */
import type { ActiveEncounter, CombatCondition, GameState, RoundCombatState } from '../types';
import { commitAutoFightLedger } from '../combatAuthority';
import { rollVictoryLoot } from '../combat';
import { profileForEncounter } from '../lootTableRegistry';
import { growWeaponFamiliarity, weaponCategory } from '../checkRules';
import { pushCombatStateTx } from '../stateTx';
import { fightLootClause, weaponInHand } from '../infoSheet';
import { tickEncounterTerminal } from '../encounterTerminalFsm';
import { isRoadFoe, settleRoadMeeting } from '../travelJourney';
import { abilityMod, ARMOR_TABLE, deriveTabletopSheet, hasClassFeature, sneakAttackDice, tabletopArmorClass, WEAPON_DICE, weaponProficient } from './characterBuild';
import type { Rng } from '../rules/dice';
import { statBlockForEncounter, type StatBlock } from '../rules/srdMonsters';
import { playRound, rollDeathSave, rollInitiative, type PcProfile, type PcSpell, type RoundAction, type RoundResult } from '../rules/roundCombat';
import { spellInInput, spendSlot, SPELLS } from '../rules/spells';
import { casterKit, resolveCastRequest, slotsLine } from './spellCasting';
import { combatFacts, deathSaveLine, presentCombatStatus } from '../rules/combatPresenter';
import { payEncounterXp } from '../engineFight';
import { fightAlly, healingPotion, pcCantripName, pcWeaponName } from './combatChips';

export interface RoundFightResult {
  state: GameState;
  receipts: string[];
  facts: string;
  foeAfter?: ActiveEncounter;
  /** No encounter-terminal mandate this turn (the fight goes on, or the PC lies dying with nothing new to settle). */
  noTerminal?: boolean;
}

const ONGOING_HEAD = 'ENGINE OUTCOME (facts — narrate this one round exactly once; the fight is NOT over, end with the foe still fighting):';
const OVER_HEAD = 'ENGINE OUTCOME (facts — narrate exactly this once, add no new rounds, the fight is over):';
const DYING_HEAD = 'ENGINE OUTCOME (facts — narrate exactly this once; you are on the ground at 0 HP, nobody is fighting you now):';

/** A built tabletop character fights round by round. */
export function usesRoundCombat(state: Pick<GameState, 'engineMode' | 'character'>): boolean {
  return state.engineMode === 'dnd' && !!state.character?.srd;
}

/** At 0 HP and still making death saves. */
export function isDying(state: Pick<GameState, 'engineMode' | 'deathSaves'>): boolean {
  const ds = state.deathSaves;
  return state.engineMode === 'dnd' && !!ds && !ds.dead && !ds.stable;
}

const FLEE = /\b(flee|run(?: away| for it)?|escape|retreat|withdraw|bolt)\b/i;
const ATTACK = /\b(attack|fight|strike|engage|slash|stab|shoot|punch|swing|hit|thrust|cut|charge|lash out|loose an arrow)\b/i;

/** The round action a chip or typed line asks for. Anything else still spends the turn (the foes act). */
export function classifyRoundAction(input: string): RoundAction {
  const s = (input ?? '').toLowerCase();
  if (/\b(drink|quaff|potion)\b|\buse (?:an? |the |my )?(?:item|potion)\b/.test(s)) return 'item';
  if (/\bdisengage\b|\bstep (?:back|away) (?:carefully|out of reach)\b/.test(s)) return 'disengage';
  if (/\bdodge\b|\bfight defensively\b|\bdefensive\b/.test(s)) return 'dodge';
  if (/\bhide\b|\bslip out of sight\b|\bstealth\b/.test(s)) return 'hide';
  if (/\bhelp\b|\bdistract\b|\bassist\b/.test(s)) return 'help';
  if (/\bcast\b|\bfire bolt\b|\bsacred flame\b|\bspell\b/.test(s) || /\s/.test(spellInInput(s) ?? '')) return 'cast';
  if (FLEE.test(s)) return 'flee';
  if (ATTACK.test(s)) return 'attack';
  return 'other';
}

/** Every number the PC fights with, from the derived sheet (one source with the character sheet). */
export function pcCombatProfile(state: GameState, extraConditions: string[] = []): PcProfile | null {
  const sheet = deriveTabletopSheet(state);
  const srd = state.character.srd;
  if (!sheet || !srd) return null;
  const sc = sheet.scores;
  const pb = sheet.pb;
  const weaponName = pcWeaponName(state);
  const w = WEAPON_DICE[weaponName];
  const str = abilityMod(sc.STR);
  const dex = abilityMod(sc.DEX);
  const atkMod = !w ? str : w.ranged ? dex : w.finesse ? Math.max(str, dex) : str;
  const prof = !w || weaponProficient(srd.classId, weaponName);
  const cantrip = pcCantripName(state);
  const kit = casterKit(state);
  const castMod = kit?.mod ?? (srd.classId === 'wizard' ? abilityMod(sc.INT) : abilityMod(sc.WIS));
  const spells: PcSpell[] = kit
    ? [...kit.cantrips.filter((n) => n !== cantrip), ...kit.prepared]
        .map((n) => SPELLS[n]!)
        .filter((d) => d.combat)
        .map((def) => ({ name: def.name, def, toHit: kit.attack, dc: kit.dc, mod: kit.mod }))
    : [];
  const armored = (state.inventory ?? []).some((i) => i.equipped && ARMOR_TABLE[i.name]);
  const ally = fightAlly(state);
  const potion = healingPotion(state);
  const saves = Object.fromEntries(sheet.saves.map((s) => [s.key, s.total])) as PcProfile['saves'];
  return {
    name: state.character.name || 'you',
    ac: sheet.ac,
    hp: state.character.hp,
    maxHp: sheet.maxHp,
    speed: sheet.speed,
    initiativeMod: sheet.initiative,
    saves,
    stealth: sheet.skills.find((k) => k.skill === 'Stealth')?.total ?? dex,
    species: srd.speciesId,
    weapon: {
      name: weaponName,
      toHit: atkMod + (prof ? pb : 0),
      dice: w?.dice ?? '1d1',
      mod: atkMod,
      type: w?.type ?? 'bludgeoning',
      ranged: !!w?.ranged,
      finesse: !!w?.finesse,
      ...(srd.classId === 'rogue' ? { sneakAttack: sneakAttackDice(state.character.level || 1) } : {}),
    },
    ...(kit ? { spells, slots: kit.left } : {}),
    ...(kit && !armored ? { mageArmorAc: tabletopArmorClass(sc.DEX, state.inventory ?? [], true).ac } : {}),
    ...(hasClassFeature(state.character, /Improved Critical/) ? { improvedCritical: true } : {}),
    ...(hasClassFeature(state.character, /Potent Cantrip/) ? { potentCantrip: true } : {}),
    ...(hasClassFeature(state.character, /Disciple of Life/) ? { discipleOfLife: true } : {}),
    ...(cantrip
      ? {
          cantrip:
            cantrip === 'Fire Bolt'
              ? { name: cantrip, kind: 'attack' as const, toHit: castMod + pb, dc: 8 + castMod + pb, dice: '1d10', type: 'fire' }
              : { name: cantrip, kind: 'save' as const, toHit: castMod + pb, dc: 8 + castMod + pb, save: 'DEX' as const, dice: '1d8', type: 'radiant' },
        }
      : {}),
    ...(potion ? { potion: { name: potion.name, heal: '2d4+2' } } : {}),
    // Provisional ally numbers until companions get stat blocks: +PB+2 to hit, 1d6+2.
    ...(ally ? { ally: { name: ally.name, toHit: pb + 2, dice: '1d6+2', type: 'slashing' } } : {}),
    conditions: [...(state.character.conditions ?? []), ...extraConditions].filter((c) => !/^unconscious$/i.test(c)),
  };
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];

interface FoeSetup {
  combat: RoundCombatState;
  blocks: Record<string, StatBlock>;
  labels: Record<string, string>;
  lead: Parameters<typeof playRound>[0]['lead'];
}

function foeIdentity(enc: ActiveEncounter, block: StatBlock, count: number) {
  const ids = Array.from({ length: count }, (_, i) => `f${i + 1}`);
  const statusName = (i: number) => (count === 1 ? enc.name : `${block.srd ? block.name : enc.name} ${i + 1}`);
  const writerName = (i: number) => (count === 1 ? enc.name : block.srd ? `the ${ORDINAL[i] ?? `${i + 1}th`} ${block.name.toLowerCase()}` : `one of ${enc.name}`);
  return { ids, statusName, writerName };
}

function startCombat(enc: ActiveEncounter, pc: PcProfile, rng: Rng, surprised: 'foes' | 'pc' | null): FoeSetup {
  const block = statBlockForEncounter(enc);
  const count = Math.max(1, Math.min(8, enc.count ?? 1));
  const { ids, statusName, writerName } = foeIdentity(enc, block, count);
  // A parked foe comes back as hurt as it was left.
  const share = enc.maxHp > 0 && enc.hp < enc.maxHp ? Math.max(0, enc.hp) / enc.maxHp : 1;
  const foes = ids.map((id, i) => ({ id, name: statusName(i), block }));
  const init = rollInitiative(pc, foes, rng, surprised);
  const blocks = Object.fromEntries(ids.map((id) => [id, block]));
  const labels = Object.fromEntries(ids.map((id, i) => [statusName(i), writerName(i)]));
  const combat: RoundCombatState = {
    encounterName: enc.name,
    round: 1,
    pcInitiative: init.pcInitiative,
    foes: foes.map((f) => {
      const hp = Math.max(1, Math.round(block.hp * share));
      return { id: f.id, name: f.name, blockId: block.id, hp, maxHp: block.hp, initiative: init.foeInitiative[f.id]!, conditions: [] };
    }),
    pcConditions: [],
  };
  return { combat, blocks, labels, lead: init.events };
}

function resumeCombat(enc: ActiveEncounter, combat: RoundCombatState): FoeSetup {
  const block = statBlockForEncounter(enc);
  const blocks = Object.fromEntries(combat.foes.map((f) => [f.id, block.id === f.blockId ? block : { ...block, id: f.blockId }]));
  const count = combat.foes.length;
  const { writerName } = foeIdentity(enc, block, count);
  const labels = Object.fromEntries(combat.foes.map((f, i) => [f.name, writerName(i)]));
  return { combat, blocks, labels, lead: [] };
}

function relabel(facts: string[], labels: Record<string, string>): string[] {
  const names = Object.keys(labels).sort((a, b) => b.length - a.length);
  return facts.map((f) => {
    let out = f;
    for (const n of names) out = out.split(n).join(labels[n]!);
    return out.charAt(0).toUpperCase() + out.slice(1);
  });
}

const roundConditionNames = (c: RoundCombatState | null | undefined) => new Set((c?.pcConditions ?? []).map((x) => x.name));

/** The character's own conditions plus the fight's (what the sheet shows mid-fight). */
function withFightConditions(base: string[], fight: CombatCondition[]): string[] {
  return [...new Set([...base, ...fight.map((c) => c.name)])];
}

function finishFight(state: GameState): GameState {
  const strip = roundConditionNames(state.roundCombat);
  const conditions = (state.character.conditions ?? []).filter((c) => !strip.has(c));
  return { ...state, roundCombat: null, character: { ...state.character, conditions } };
}

function hpLine(before: number, after: number): string {
  return `HP: ${before} → ${after}`;
}

/**
 * Play the next round of the fight with `raw` (the live, pending, parked or road foe).
 * `pre` carries a failed flee/parley check this turn (the foe forces the fight; the PC's action is spent).
 */
export function resolveRoundFight(
  state: GameState,
  working: GameState,
  raw: ActiveEncounter,
  input: string,
  opts: { pre?: 'flee' | 'parley'; surprised?: 'foes' | 'pc' | null; rng?: Rng } = {}
): RoundFightResult | null {
  const rng = opts.rng ?? Math.random;
  const enc = working.activeEncounter ?? raw;
  const live = working.roundCombat && working.roundCombat.encounterName === enc.name ? working.roundCombat : null;
  const baseConditions = (working.character.conditions ?? []).filter((c) => !roundConditionNames(live).has(c));
  const pc = pcCombatProfile({ ...working, character: { ...working.character, conditions: baseConditions } });
  if (!pc) return null;
  const setup = live ? resumeCombat(enc, live) : startCombat(enc, pc, rng, opts.surprised ?? null);
  const asked = classifyRoundAction(input);
  // Facing a foe ("Face the thugs", a road meeting's fight chip) opens the fight with an attack.
  let action: RoundAction = opts.pre ? 'other' : asked === 'other' && !live ? 'attack' : asked;
  const receipts: string[] = [];
  const lead: string[] = [];
  let spell: string | undefined;
  let slotLevel: number | undefined;
  if (action === 'cast') {
    const req = resolveCastRequest(working, input, 'fight');
    if (req?.ok) {
      spell = req.def.name;
      slotLevel = req.slot ?? undefined;
    } else if (req) {
      // A spell the engine cannot cast spends nothing; the round goes to a weapon attack instead.
      receipts.push(`Spell: ${req.def.name} — not cast (${req.problem}); no slot spent`);
      lead.push(`You reach for ${req.def.name}, but ${req.problem}, so you attack instead.`);
      action = 'attack';
    }
  }
  const res: RoundResult = playRound({ pc, combat: setup.combat, blocks: setup.blocks, action, rng, lead: setup.lead, spell, slotLevel });
  if (opts.pre) receipts.unshift(`Fight: ${enc.name} forces the fight`);
  receipts.push(...presentCombatStatus('dnd', res.events, pc.name));
  if (res.pcHp !== pc.hp) receipts.push(hpLine(pc.hp, res.pcHp));
  const facts = [...lead, ...relabel(combatFacts(res.events, pc.name), setup.labels)];
  if (opts.pre === 'flee') facts.unshift(`You tried to break away from ${enc.name} and failed; ${enc.name} forced the fight.`);
  if (opts.pre === 'parley') facts.unshift(`You tried to talk ${enc.name} down and failed; ${enc.name} forced the fight.`);

  const liveFoes = res.combat.foes.filter((f) => f.hp > 0);
  const foeHp = liveFoes.reduce((s, f) => s + f.hp, 0);
  const foeMax = liveFoes.reduce((s, f) => s + f.maxHp, 0);
  const block = setup.blocks[res.combat.foes[0]!.id]!;
  // The whole fight reads one ledger: the encounter's HP is the live foes' HP.
  const encNow: ActiveEncounter = { ...enc, hp: foeHp, maxHp: Math.max(foeMax, 1), count: Math.max(1, liveFoes.length), cr: block.srd ? block.cr : enc.cr };
  let potionInv = working.inventory ?? [];
  if (res.potionUsed) {
    const p = healingPotion(working);
    potionInv = potionInv
      .map((i) => (i.id === p?.id ? { ...i, quantity: (i.quantity ?? 1) - 1 } : i))
      .filter((i) => (i.quantity ?? 1) > 0);
  }
  let next: GameState = {
    ...working,
    inventory: potionInv,
    activeEncounter: encNow,
    roundCombat: res.combat,
    character: {
      ...working.character,
      hp: res.pcHp,
      conditions: withFightConditions(baseConditions, res.combat.pcConditions),
    },
  };
  if (res.slotSpent || res.mageArmor) {
    let casting = res.slotSpent ? spendSlot(next.character.casting, res.slotSpent) : next.character.casting ?? { slotsUsed: [] };
    if (res.mageArmor) casting = { ...casting, mageArmor: true };
    next = { ...next, character: { ...next.character, casting } };
    if (res.mageArmor) next = { ...next, character: { ...next.character, armorClass: deriveTabletopSheet(next)?.ac ?? next.character.armorClass } };
    if (res.slotSpent) receipts.push(slotsLine(next)!);
  }
  const onRoad = isRoadFoe(state, raw);
  const roundsSoFar = res.round;
  const roundsText = `${roundsSoFar} round${roundsSoFar === 1 ? '' : 's'}`;

  if (res.outcome === 'ongoing') {
    receipts.push(`Fight: round ${res.round} vs ${enc.name} — the fight goes on`);
    return { state: next, receipts, facts: `${ONGOING_HEAD} ${facts.join(' ')}`, noTerminal: true };
  }

  next = finishFight(next);
  next = growWeaponFamiliarity(next, weaponCategory(pc.weapon.name));
  if (res.outcome === 'victory') {
    const down = res.combat.foes.length > 1 ? 'are down' : 'is down';
    next = commitAutoFightLedger(next, { victory: true, finalPlayerHp: res.pcHp });
    const won = rollVictoryLoot(working, { name: enc.name, goldReward: enc.goldReward, lootProfile: profileForEncounter(enc), cr: encNow.cr });
    next = {
      ...next,
      inventory: [...(next.inventory ?? []), ...won.loot],
      gold: (next.gold ?? 0) + won.goldGained,
      lootPity: won.lootPity ? { byTier: { ...(next.lootPity?.byTier ?? {}), [won.lootPity.tier]: won.lootPity.next } } : next.lootPity,
    };
    receipts.push(`Fight: VICTORY vs ${enc.name} in ${roundsText}. The fight is over: ${enc.name} ${down} and cannot fight on.`, `Encounter cleared: ${enc.name} (victory)`);
    next = pushCombatStateTx(next, `Fight vs ${enc.name}: victory in ${roundsText}`, enc.name, 'Engine fight');
    if (onRoad) next = settleRoadMeeting(next, 'victory');
    const xpRaw: ActiveEncounter = { ...raw, cr: block.srd ? block.cr : raw.cr, count: raw.count ?? setup.combat.foes.length };
    const paid = payEncounterXp(next, xpRaw, `defeated ${enc.name}`);
    next = paid.state;
    receipts.push(...paid.receipts);
    if (won.goldGained > 0) receipts.push(`Gold Gained: ${won.goldGained}`);
    if (won.loot.length) receipts.push(`Loot: ${won.loot.map((l) => `[${l.rarity}] ${l.name}`).join(', ')} — ${fightLootClause(weaponInHand(working))}`);
    receipts.push(...(won.lootLines ?? []));
    // The amount is on STATUS (Gold Gained); the writer only hears that there was coin.
    const bits = [...won.loot.map((l) => l.name), ...(won.goldGained > 0 ? ['some coin'] : [])];
    facts.push(`${cap(enc.name)} ${(raw.count ?? 1) > 1 ? 'are all down' : 'went down and stayed down'}.${bits.length ? ` On the body: ${bits.join(', ')}.` : ''}`);
    return { state: next, receipts, facts: `${OVER_HEAD} ${facts.join(' ')}` };
  }

  if (res.outcome === 'escaped') {
    const tick = tickEncounterTerminal(next, input, { fleeSucceeded: true });
    next = { ...tick.state, roundCombat: null };
    receipts.push(`Fight: ESCAPED from ${enc.name} after ${roundsText}`, ...tick.receipts);
    if (!tick.receipts.some((r) => /^Encounter cleared:/.test(r))) receipts.push(`Encounter cleared: ${enc.name} (escape)`);
    next = pushCombatStateTx(next, `Fight vs ${enc.name}: escaped after ${roundsText}`, enc.name, 'Engine fight');
    if (onRoad) next = settleRoadMeeting(next, 'escape');
    facts.push(`You got clear of ${enc.name}. Nothing was won or looted.`);
    return { state: next, receipts, facts: `${OVER_HEAD} ${facts.join(' ')}` };
  }

  // Down (death saves) or killed outright.
  const dead = res.outcome === 'dead';
  // The foes leave a downed PC: the encounter ends here and the foe stays at the place (placeThreats).
  const lost = tickEncounterTerminal(next, input, { playerDead: true });
  next = {
    ...lost.state,
    roundCombat: null,
    character: { ...next.character, hp: 0, conditions: [...new Set([...(next.character.conditions ?? []), 'Unconscious'])] },
    deathSaves: dead ? { successes: 0, failures: 3, dead: true } : { successes: 0, failures: 0 },
  };
  receipts.push(`Fight: DEFEAT vs ${enc.name} in ${roundsText}. The fight is over: you lost it.`, ...lost.receipts);
  next = pushCombatStateTx(next, `Fight vs ${enc.name}: defeat in ${roundsText}`, enc.name, 'Engine fight');
  if (onRoad) next = settleRoadMeeting(next, 'defeat');
  facts.push(dead ? 'You are dead.' : `${cap(enc.name)} left you where you fell. You are dying and must fight for breath.`);
  return { state: next, receipts, facts: `${OVER_HEAD} ${facts.join(' ')}`, foeAfter: { ...encNow, phase: 'engaged' } };
}

const HOURS_LATER: Record<number, string> = { 1: 'An hour', 2: 'Two hours', 3: 'Three hours', 4: 'Four hours' };

/** At 0 HP every turn is one death save until three successes, three failures, or a natural 20. */
export function resolveDeathSaveTurn(state: GameState, rng: Rng = Math.random): RoundFightResult | null {
  if (!isDying(state)) return null;
  const r = rollDeathSave(state.deathSaves!, rng);
  const receipts = [deathSaveLine(r)];
  let next: GameState = { ...state, deathSaves: r.state };
  const conditions = (state.character.conditions ?? []).filter((c) => !/^unconscious$/i.test(c));
  let fact: string;
  if (r.result === 'revived') {
    next = { ...next, deathSaves: null, character: { ...state.character, hp: 1, conditions } };
    receipts.push(hpLine(0, 1));
    fact = 'You surge back to consciousness with a gasp and get up, barely on your feet.';
  } else if (r.state.dead) {
    fact = 'Your breath stops. You are dead.';
  } else if (r.state.stable) {
    next = { ...next, deathSaves: null, character: { ...state.character, hp: 1, conditions } };
    receipts.push(hpLine(0, 1));
    fact = `Your breathing steadies; you are stable. ${HOURS_LATER[r.hoursToWake ?? 0] ?? 'Hours'} later you wake, weak but alive.`;
  } else {
    fact = r.result === 'success' ? 'You cling to life; your breathing holds.' : 'You slip further; your breath falters.';
  }
  return { state: next, receipts, facts: `${DYING_HEAD} ${fact}`, noTerminal: true };
}