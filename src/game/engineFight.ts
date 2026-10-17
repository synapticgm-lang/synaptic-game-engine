/**
 * 28f — engine-owned outcome for a live fight.
 * Attack: the auto-fight resolver (simulateCombat) settles the whole fight this turn. The engine rolls,
 * applies damage, ends the encounter, pays XP (xpRules) and loot (loot profiles, difficulty applied).
 * Flee / parley: one engine d20 check. Success ends the encounter; failure means the foe forces the
 * fight and the same resolver settles it. The writer only describes the facts.
 * A built tabletop character (SRD sheet) fights round by round instead: tabletop/roundFight plays one round per turn.
 */
import type { ActiveEncounter, GameState } from './types';
import { simulateCombat, type CombatResult, type CombatRound, type EnemyStats } from './combat';
import { commitAutoFightLedger } from './combatAuthority';
import { arrivePendingEncounter, initEncounterTerminal, tickEncounterTerminal } from './encounterTerminalFsm';
import { profileForEncounter } from './lootTableRegistry';
import { gainLootMoney, lootMoneyFound, lootMoneyText } from './rules/coins';
import { encounterKind, milestoneXp, payCompanionsFightXp, paySummonsFightXp, takesPartyShare } from './xpRules';
import { milestoneAreaOpts } from './placeAuthority';
import { applyCharacterXpGain } from './characterXp';
import { equippedWeaponName } from './ledgerCombat';
import { growWeaponFamiliarity, resolveCheckRecord, weaponCategory } from './checkRules';
import { formatPreRollLine, formatResultLine, outcomeFactFromRecord } from './rules/rollView';
import type { CheckSpec } from './checkMath';
import { earlyEnemyAttack, hpAfterFight } from './recoveryRules';
import { approachFromInput, approachOpener, approachReceipt, meleeApproach } from './fightApproach';
import { parkedThreatHere, wakeParkedThreat } from './placeThreats';
import { fightLootClause, weaponInHand } from './infoSheet';
import { isRoadFoe, meetingMoveBase, roadFoeForEngine, roadMeetingMove, settleRoadMeeting } from './travelJourney';
import { pushCombatStateTx } from './stateTx';
import { hidesPart } from './systemHousing';
import { classifyRoundAction, isDying, resolveDeathSaveTurn, resolveRoundFight, usesRoundCombat } from './tabletop/roundFight';
import { isFightCast } from './tabletop/spellCasting';
import { afterFightCompanion, combatCompanion } from './rules/companions';
import { abilityModOf, realEncounterCr, statBlockForEncounter } from './rules/srdMonsters';
import { deriveTabletopSheet } from './tabletop/characterBuild';
import { turnRng } from './seededRng';
import { parsePlayerIntent } from './intentParser';
import { spineSelfEnding } from './pyoaSpine';
import { commitDeath } from './rules/death';

const FLEE_RE = /\b(flee|run away|escape|retreat|withdraw|bolt)\b/i;
const PARLEY_RE = /\b(parley|negotiate|talk (?:it|them) down|surrender|truce|bargain)\b/i;
const ATTACK_RE =
  /\b(attack|fight|strike|engage|slash|stab|shoot|punch|lash out|auto[- ]?fight|ambush|sneak attack|loose an arrow|cast (?:a |an )?spell)\b/i;

export interface EngineFightResult {
  state: GameState;
  receipts: string[];
  /** The one writer mandate: the engine outcome as facts. */
  facts: string;
  /** 29y — the foe as the fight left it when the player lost (it stays at the place). */
  foeAfter?: ActiveEncounter;
  /** Tabletop rounds: the fight goes on (or the PC lies dying) — no encounter-terminal mandate this turn. */
  noTerminal?: boolean;
}

function nameKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

/**
 * Pay the encounter milestone once; mark the same keys sandboxXp uses so it never pays twice.
 * D&D: each party member gets the same share as the player (and pets/summons their own total), hidden.
 */
export function payEncounterXp(
  state: GameState,
  raw: ActiveEncounter,
  label: string
): { state: GameState; receipts: string[] } {
  const keys = [
    `encounter:${raw.encounterId ?? nameKey(raw.name)}:${state.turn}`,
    `encounter:${nameKey(raw.name)}:${state.turn}`,
  ];
  const awardKeys = [...(state.sandboxAwardKeys ?? []), ...keys];
  const partySize = 1 + (state.companions ?? []).filter(takesPartyShare).length;
  const r = milestoneXp(state.engineMode, encounterKind(raw), {
    level: state.character.level,
    partySize,
    cr: state.engineMode === 'dnd' ? realEncounterCr(raw) : raw.cr,
    count: raw.count,
    strictness: state.gmStrictness,
    ...milestoneAreaOpts(state),
  });
  if (r.amount <= 0) {
    const why = r.detail && !hidesPart(state.systemHousing, 'experience') ? [`XP: none (${label} — ${r.detail})`] : [];
    return { state: { ...state, sandboxAwardKeys: awardKeys }, receipts: why };
  }
  const leveled = applyCharacterXpGain(state.character, r.amount, state.engineMode, state.systemHousing);
  const dnd = state.engineMode === 'dnd';
  const companions = dnd ? payCompanionsFightXp(state.companions, r.amount) : state.companions;
  const character = dnd ? { ...leveled.character, summons: paySummonsFightXp(leveled.character.summons, r.amount) } : leveled.character;
  const xpLine = hidesPart(state.systemHousing, 'experience') ? [] : [`XP Gained: ${r.amount} (${label}${r.detail ? ` — ${r.detail}` : ''})`];
  return {
    state: { ...state, character, companions, sandboxAwardKeys: awardKeys },
    receipts: [...xpLine, ...leveled.notes],
  };
}

const FACTS_HEAD = 'ENGINE OUTCOME (facts — narrate exactly this once, add no new rounds, the fight is over):';
const SELF_STOP_HEAD = 'ENGINE OUTCOME (facts — narrate exactly this once and fade; describe no method, wound or tool, and no death):';

/** Tabletop shows this many fight rounds roll by roll; the rest are summed on one line. */
const SHOWN_ROUNDS = 6;

/**
 * Tabletop: every attack roll of the settled fight, die + modifier against the armour class, for STATUS.
 * Chrome only (engineResult keeps "Round" lines out of the writer's facts).
 */
export function tabletopRoundLines(result: CombatResult, foe: string): string[] {
  const math = result.attackMath;
  if (!math) return [];
  const signed = (m: number) => `${m >= 0 ? '+' : '−'} ${Math.abs(m)}`;
  const swing = (r: CombatRound): string => {
    const player = r.attacker === 'player';
    const mod = player ? math.playerMod : math.foeMod;
    const ac = player ? math.foeAc : math.playerAc;
    const verdict = r.roll === 20 && r.hit
      ? `critical hit, ${r.damage} damage`
      : r.hit
        ? `hit, ${r.damage} damage`
        : r.roll === 1
          ? 'miss (natural 1)'
          : 'miss';
    return `${player ? 'you' : foe} d20 ${r.roll} ${signed(mod)} = ${r.roll + mod} vs AC ${ac}: ${verdict}`;
  };
  const byRound = new Map<number, CombatRound[]>();
  for (const r of result.roundsLog) byRound.set(r.round, [...(byRound.get(r.round) ?? []), r]);
  const lines: string[] = [];
  const rounds = [...byRound.keys()].sort((a, b) => a - b);
  for (const n of rounds.slice(0, SHOWN_ROUNDS + (byRound.has(0) ? 1 : 0))) {
    lines.push(`${n === 0 ? 'Opening strike' : `Round ${n}`} — ${byRound.get(n)!.map(swing).join('; ')}`);
  }
  const rest = rounds.filter((n) => n > SHOWN_ROUNDS);
  if (rest.length) {
    const swings = rest.flatMap((n) => byRound.get(n)!);
    const dealt = swings.filter((r) => r.attacker === 'player').reduce((s, r) => s + r.damage, 0);
    const took = swings.filter((r) => r.attacker === 'enemy').reduce((s, r) => s + r.damage, 0);
    lines.push(`Rounds ${rest[0]}–${rest[rest.length - 1]} — you dealt ${dealt}, took ${took}`);
  }
  return lines;
}

function sheetSkillTotal(state: GameState, skill: 'Acrobatics' | 'Persuasion', ability: 'DEX' | 'CHA'): number {
  const row = deriveTabletopSheet(state)?.skills.find((k) => k.skill === skill);
  return row ? row.total : abilityModOf(state.character.attributes?.[ability] ?? 10);
}

/**
 * Tabletop break-away, SRD 5.2.1 as written. Escape: a Dexterity (Acrobatics) contest with the foe's Dexterity
 * check; a tie leaves things as they were. Parley: the Influence action, a Charisma (Persuasion) check against
 * DC 15 (Medium) or the foe's Intelligence score, whichever is higher.
 * VR1-b: one CheckResultRecord; STATUS/writer lines from formatPreRollLine / formatResultLine / outcomeFactFromRecord.
 * Cut: hand-built `Flee check: d20…` / `Parley check: d20…` strings.
 */
export function srdBreakAwayCheck(
  state: GameState,
  enc: ActiveEncounter,
  flee: boolean,
  rng: () => number = turnRng(state, flee ? 'flee' : 'parley')
): { ok: boolean; line: string; lines: string[]; record: ReturnType<typeof resolveCheckRecord> } {
  const block = statBlockForEncounter(enc);
  if (flee) {
    const mod = sheetSkillTotal(state, 'Acrobatics', 'DEX');
    const foeMod = abilityModOf(block.scores.DEX);
    // Same roll order as before (PC then foe) so seeded turnRng / bank tapes stay aligned.
    const pcDie = Math.floor(rng() * 20) + 1;
    const foeDie = Math.floor(rng() * 20) + 1;
    // Contest: PC must beat the foe total (tie fails). Record uses total >= dc → dc = foeTotal + 1.
    const foeTotal = foeDie + foeMod;
    const dc = foeTotal + 1;
    const rec = resolveCheckRecord({
      label: 'Flee contest',
      mods: [{ label: 'DEX', value: mod }],
      dc,
      d20s: [pcDie],
    });
    // SRD 5.2.1 Escape: Dexterity (Acrobatics) contest — skill on the CheckSpec so formatPreRollLine names it.
    rec.spec = { kind: 'contest', ability: 'DEX', skill: 'acrobatics', dc, dcShown: false, adv: 'normal' };
    return {
      ok: rec.outcome === 'success',
      line: formatResultLine(rec),
      lines: [formatPreRollLine(rec.spec as CheckSpec), formatResultLine(rec), outcomeFactFromRecord(rec)],
      record: rec,
    };
  }
  const mod = sheetSkillTotal(state, 'Persuasion', 'CHA');
  const dc = Math.max(15, block.scores.INT);
  const rec = resolveCheckRecord({
    label: 'Parley',
    mods: [{ label: 'CHA', value: mod }],
    dc,
    rng,
  });
  rec.spec = { kind: 'skill', ability: 'CHA', skill: 'persuasion', dc, dcShown: false, adv: 'normal' };
  return {
    ok: rec.outcome === 'success',
    line: formatResultLine(rec),
    lines: [formatPreRollLine(rec.spec as CheckSpec), formatResultLine(rec), outcomeFactFromRecord(rec)],
    record: rec,
  };
}

/** Tabletop: a forced fight's failed flee/parley is part of the outcome the story tells. */
function forcedFightOpener(flee: boolean, foe: string): string {
  return flee
    ? `You tried to break away from ${foe} and failed; ${foe} forced the fight. `
    : `You tried to talk ${foe} down and failed; ${foe} forced the fight. `;
}

/** Resolve fight / flee / parley on a live (or pending) encounter. Null when the input is not a fight action. */
export function resolveEngineFight(state: GameState, playerInput: string): EngineFightResult | null {
  const input = (playerInput ?? '').trim();
  if (parsePlayerIntent(input, state).targetsSelf || spineSelfEnding(state, input)) {
    const end = commitDeath(state, 'self', turnRng(state, 'self-stop'));
    return { state: end.state, receipts: end.receipts, facts: `${SELF_STOP_HEAD} ${end.fact}`, noTerminal: true };
  }
  const roundMode = usesRoundCombat(state);
  if (roundMode && isDying(state)) return resolveDeathSaveTurn(state);
  // A road meeting's own chip ("Skirt around the camp") takes on that meeting, whatever else waits here.
  const meetingMove = state.activeEncounter ? null : roadMeetingMove(state, input);
  const pending = state.activeEncounter || meetingMove ? null : state.sceneFacts?.pendingEncounter ?? null;
  // 29y — a threat remembered at this place is the same foe, fought through the same path.
  const parked = state.activeEncounter || pending || meetingMove ? null : parkedThreatHere(state);
  // A road meeting the player faces (or flees) is handed to this engine the same turn.
  const road = state.activeEncounter || pending || parked ? null : roadFoeForEngine(state, input);
  const raw =
    state.activeEncounter
    ?? (pending ? arrivePendingEncounter(pending, state.turn) : null)
    ?? (parked ? wakeParkedThreat(parked) : road);
  if (!raw || !input) return null;
  // The chip's own failure cost (", but fail and they attack") is what a failed check brings, not the act.
  const act = meetingMoveBase(input);
  // Tabletop: once the rounds have begun every input is this round's action; a live foe also takes Dodge / Hide / …
  const inRounds = roundMode && !!state.activeEncounter && state.roundCombat?.encounterName === state.activeEncounter.name;
  const roundMove = roundMode && (!!state.activeEncounter ? classifyRoundAction(input) !== 'other' : isFightCast(state, input));
  const flee = !inRounds && (meetingMove === 'flee' || (!meetingMove && FLEE_RE.test(act)));
  const parley = meetingMove === 'parley' || (!flee && PARLEY_RE.test(act));
  const attack = !flee && !parley && (ATTACK_RE.test(act) || !!road || inRounds || roundMove);
  const onRoad = isRoadFoe(state, raw);
  if (!flee && !parley && !attack) return null;
  if (parked && (flee || /\b(talk|ask|speak|conversation)\b/i.test(input))) return null;
  // 28r — gear/skill approach, read before the foe is engaged (a strike from hiding needs an unaware foe).
  const approach = approachFromInput(state, input);

  let working: GameState = state;
  if (pending && state.sceneFacts) {
    working = { ...state, sceneFacts: { ...state.sceneFacts, pendingEncounter: undefined } };
  }
  const enc = initEncounterTerminal(raw, working);
  working = { ...working, activeEncounter: enc };
  const receipts: string[] = [];

  if (flee || parley) {
    let ok: boolean;
    if (state.engineMode === 'dnd') {
      const check = srdBreakAwayCheck(working, enc, flee);
      ok = check.ok;
      receipts.push(...check.lines);
    } else {
      const attrs = working.character.attributes;
      const score = flee ? attrs?.DEX ?? 12 : attrs?.CHA ?? 10;
      const mod = Math.floor((score - 10) / 2);
      const dc = flee ? 12 : 13;
      const roll = Math.floor(turnRng(working, flee ? 'flee' : 'parley')() * 20) + 1;
      ok = roll + mod >= dc;
      const rec = resolveCheckRecord({
        label: flee ? 'Flee' : 'Parley',
        mods: [{ label: flee ? 'DEX' : 'CHA', value: mod }],
        dc,
        d20s: [roll],
      });
      rec.spec = {
        kind: flee ? 'contest' : 'skill',
        ability: flee ? 'DEX' : 'CHA',
        ...(flee ? {} : { skill: 'persuasion' as const }),
        dc,
        dcShown: false,
        adv: 'normal',
      };
      receipts.push(formatResultLine(rec), outcomeFactFromRecord(rec));
    }
    if (ok) {
      const tick = tickEncounterTerminal(working, input, flee ? { fleeSucceeded: true } : { parleySucceeded: true });
      let next = tick.state;
      receipts.push(...tick.receipts);
      if (onRoad) next = settleRoadMeeting(next, flee ? 'escape' : 'parleyResolved');
      if (parley) {
        const paid = payEncounterXp(next, raw, `resolved ${enc.name}`);
        next = paid.state;
        receipts.push(...paid.receipts);
      }
      const what = flee
        ? `You broke away from ${enc.name} and got clear.`
        : `${enc.name} accepted terms and stood down.`;
      return { state: next, receipts, facts: `${FACTS_HEAD} ${what}` };
    }
    if (!roundMode) receipts.push(`Fight: ${enc.name} forces the fight`);
  }

  if (roundMode) {
    const r = resolveRoundFight(state, working, raw, input, {
      pre: flee ? 'flee' : parley ? 'parley' : undefined,
      surprised: flee || parley || state.roundCombat
        ? null
        : approach.id === 'ambush'
          ? 'foes'
          : isRoadFoe(state, enc) && state.journey?.encounter?.surprisesParty
            ? 'pc'
            : null,
    });
    if (r) return { ...r, receipts: [...receipts, ...r.receipts] };
  }

  const enemy: EnemyStats = {
    name: enc.name,
    level: enc.level,
    hp: enc.hp,
    maxHp: enc.maxHp,
    // 28g — early fights: enemy attack capped by player level (recoveryRules).
    attack: earlyEnemyAttack(working, Math.max(1, Math.floor(enc.strength / 2))),
    defense: Math.max(0, Math.floor(enc.constitution / 4)),
    armorClass: enc.armorClass,
    xpReward: enc.xpReward,
    goldReward: enc.goldReward,
    lootProfile: profileForEncounter(enc),
    cr: enc.cr,
  };
  // A failed flee/parley means the foe forced the fight: no opening strike from hiding.
  const used = (flee || parley) && approach.id === 'ambush' ? meleeApproach() : approach;
  const side = combatCompanion(working);
  const result = simulateCombat(working, enemy, { approach: used, ...(side ? { ally: side.profile } : {}) });
  const approachLine = approachReceipt(used);
  if (approachLine) receipts.push(approachLine);
  const hpBefore = working.character.hp;
  // 28g — some HP back on a win; a defeat never leaves the character at 1 HP (recoveryRules).
  const hpAfter = hpAfterFight(working, result.victory, result.finalPlayerHp);
  let next = commitAutoFightLedger(working, { victory: result.victory, finalPlayerHp: result.finalPlayerHp });
  next = {
    ...next,
    character: { ...next.character, hp: hpAfter, mp: result.finalPlayerMp },
    inventory: [...(next.inventory ?? []), ...result.loot],
    lootPity: result.lootPity
      ? { byTier: { ...(next.lootPity?.byTier ?? {}), [result.lootPity.tier]: result.lootPity.next } }
      : next.lootPity,
  };
  next = gainLootMoney(next, result.goldGained, result.coinsGained);
  next = growWeaponFamiliarity(
    next,
    used.id === 'ranged' ? weaponCategory(used.source) : weaponCategory(equippedWeaponName(next))
  );
  // The Fight line is the writer's engine result; health figures go on their own STATUS line.
  const rounds = `${result.rounds} round${result.rounds === 1 ? '' : 's'}`;
  const down = (enc.count ?? 1) > 1 ? 'are down' : 'is down';
  const tabletop = state.engineMode === 'dnd';
  receipts.push(
    `Fight: ${result.victory ? 'VICTORY' : 'DEFEAT'} vs ${enc.name} in ${rounds}${result.victory ? `. The fight is over: ${enc.name} ${down} and cannot fight on.` : '. The fight is over: you lost it.'}`,
    ...(tabletop ? tabletopRoundLines(result, enc.name) : []),
    `HP: ${hpBefore} → ${hpAfter} (dealt ${result.damageDealt}, took ${result.damageReceived})`,
    ...(side && result.ally
      ? [`Companion: ${result.ally.name} fought beside you (dealt ${result.ally.damageDealt}, took ${result.ally.damageTaken}).`]
      : []),
    `Encounter cleared: ${enc.name} (${result.victory ? 'victory' : 'defeat'})`
  );
  if (side && result.ally) next = afterFightCompanion(next, side.companion.id, result.ally.hpAfter);
  next = pushCombatStateTx(
    next,
    `Fight vs ${enc.name}: ${result.victory ? 'victory' : 'defeat'} in ${rounds} (dealt ${result.damageDealt}, took ${result.damageReceived})`,
    enc.name,
    'Engine fight'
  );
  if (onRoad) next = settleRoadMeeting(next, result.victory ? 'victory' : 'defeat');
  let found = '';
  if (result.victory) {
    const paid = payEncounterXp(next, raw, `defeated ${enc.name}`);
    next = paid.state;
    receipts.push(...paid.receipts);
    const money = lootMoneyText(result.goldGained, result.coinsGained);
    if (money) receipts.push(`Gold Gained: ${money}`);
    if (result.loot.length) {
      receipts.push(
        `Loot: ${result.loot.map((l) => `[${l.rarity}] ${l.name}`).join(', ')} — ${fightLootClause(weaponInHand(working))}`
      );
    }
    receipts.push(...(result.lootLines ?? []));
    const bits = [
      ...result.loot.map((l) => l.name),
      ...(money ? [lootMoneyFound(result.goldGained, result.coinsGained)!] : []),
    ];
    if (bits.length) found = ` On the body: ${bits.join(', ')}.`;
  }
  const opener =
    (tabletop && (flee || parley) ? forcedFightOpener(flee, enc.name) : '')
    + (used.id === 'melee' ? '' : `${approachOpener(used, enc.name)} `);
  const beside = side ? ` ${side.companion.name} fought at your side.` : '';
  const what = opener + (result.victory
    ? `You fought ${enc.name} for ${result.rounds} round${result.rounds === 1 ? '' : 's'}.${beside} ${enc.name} went down and stayed down.${found}`
    : `You fought ${enc.name} for ${result.rounds} round${result.rounds === 1 ? '' : 's'} and lost.${beside} You went down; ${enc.name} left you there, hurt but alive.`);
  const foeAfter = result.victory
    ? undefined
    : { ...enc, hp: Math.max(1, Math.min(enc.maxHp || enc.hp, result.finalEnemyHp)), phase: 'engaged' as const };
  return { state: next, receipts, facts: `${FACTS_HEAD} ${what}`, foeAfter };
}
