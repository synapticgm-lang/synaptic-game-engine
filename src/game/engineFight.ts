/**
 * 28f — engine-owned outcome for a live fight.
 * Attack: the auto-fight resolver (simulateCombat) settles the whole fight this turn. The engine rolls,
 * applies damage, ends the encounter, pays XP (xpRules) and loot (loot profiles, difficulty applied).
 * Flee / parley: one engine d20 check. Success ends the encounter; failure means the foe forces the
 * fight and the same resolver settles it. Never a round-by-round loop. The writer only describes the facts.
 */
import type { ActiveEncounter, GameState } from './types';
import { simulateCombat, type EnemyStats } from './combat';
import { commitAutoFightLedger } from './combatAuthority';
import { initEncounterTerminal, tickEncounterTerminal } from './encounterTerminalFsm';
import { profileForEncounter } from './lootTableRegistry';
import { milestoneXp, type MilestoneKind } from './xpRules';
import { applyCharacterXpGain } from './characterXp';
import { equippedWeaponName } from './ledgerCombat';
import { growWeaponFamiliarity, weaponCategory } from './checkRules';

const FLEE_RE = /\b(flee|run away|escape|retreat|withdraw|bolt)\b/i;
const PARLEY_RE = /\b(parley|negotiate|talk (?:it|them) down|surrender|truce|bargain)\b/i;
const ATTACK_RE = /\b(attack|fight|strike|engage|slash|stab|shoot|punch|lash out|auto[- ]?fight)\b/i;

export interface EngineFightResult {
  state: GameState;
  receipts: string[];
  /** The one writer mandate: the engine outcome as facts. */
  facts: string;
}

function nameKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

function encounterKind(enc: ActiveEncounter): MilestoneKind {
  const src = `${enc.source ?? ''} ${enc.name ?? ''}`;
  if (/mini[- ]?boss|\belite\b/i.test(src)) return 'miniBoss';
  if (/\bboss\b/i.test(src)) return 'boss';
  return 'encounter';
}

/** Pay the encounter milestone once; mark the same keys sandboxXp uses so it never pays twice. */
function payEncounterXp(
  state: GameState,
  raw: ActiveEncounter,
  label: string
): { state: GameState; receipts: string[] } {
  const keys = [
    `encounter:${raw.encounterId ?? nameKey(raw.name)}:${state.turn}`,
    `encounter:${nameKey(raw.name)}:${state.turn}`,
  ];
  const awardKeys = [...(state.sandboxAwardKeys ?? []), ...keys];
  const partySize = 1 + (state.companions ?? []).filter((c) => c.type === 'party').length;
  const r = milestoneXp(state.engineMode, encounterKind(raw), {
    level: state.character.level,
    partySize,
    cr: raw.cr,
    strictness: state.gmStrictness,
  });
  if (r.amount <= 0) return { state: { ...state, sandboxAwardKeys: awardKeys }, receipts: [] };
  const leveled = applyCharacterXpGain(state.character, r.amount, state.engineMode);
  return {
    state: { ...state, character: leveled.character, sandboxAwardKeys: awardKeys },
    receipts: [`XP Gained: ${r.amount} (${label}${r.detail ? ` — ${r.detail}` : ''})`, ...leveled.notes],
  };
}

const FACTS_HEAD = 'ENGINE OUTCOME (facts — narrate exactly this once, add no new rounds, the fight is over):';

/** Resolve fight / flee / parley on a live (or pending) encounter. Null when the input is not a fight action. */
export function resolveEngineFight(state: GameState, playerInput: string): EngineFightResult | null {
  const input = (playerInput ?? '').trim();
  const pending = state.activeEncounter ? null : state.sceneFacts?.pendingEncounter ?? null;
  const raw = state.activeEncounter ?? pending;
  if (!raw || !input) return null;
  const flee = FLEE_RE.test(input);
  const parley = !flee && PARLEY_RE.test(input);
  const attack = !flee && !parley && ATTACK_RE.test(input);
  if (!flee && !parley && !attack) return null;

  let working: GameState = state;
  if (pending && state.sceneFacts) {
    working = { ...state, sceneFacts: { ...state.sceneFacts, pendingEncounter: undefined } };
  }
  const enc = initEncounterTerminal(raw, working);
  working = { ...working, activeEncounter: enc };
  const receipts: string[] = [];

  if (flee || parley) {
    const attrs = working.character.attributes;
    const score = flee ? attrs?.DEX ?? 12 : attrs?.CHA ?? 10;
    const mod = Math.floor((score - 10) / 2);
    const dc = flee ? 12 : 13;
    const roll = Math.floor(Math.random() * 20) + 1;
    const ok = roll + mod >= dc;
    receipts.push(
      `${flee ? 'Flee' : 'Parley'} check: d20 ${roll} ${mod >= 0 ? '+' : '−'} ${Math.abs(mod)} vs DC ${dc} — ${ok ? 'success' : 'failure'}`
    );
    if (ok) {
      const tick = tickEncounterTerminal(working, input, flee ? { fleeSucceeded: true } : { parleySucceeded: true });
      let next = tick.state;
      receipts.push(...tick.receipts);
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
    receipts.push(`Fight: ${enc.name} forces the fight`);
  }

  const enemy: EnemyStats = {
    name: enc.name,
    level: enc.level,
    hp: enc.hp,
    maxHp: enc.maxHp,
    attack: Math.max(1, Math.floor(enc.strength / 2)),
    defense: Math.max(0, Math.floor(enc.constitution / 4)),
    armorClass: enc.armorClass,
    xpReward: enc.xpReward,
    goldReward: enc.goldReward,
    lootProfile: profileForEncounter(enc),
    cr: enc.cr,
  };
  const result = simulateCombat(working, enemy);
  const hpBefore = working.character.hp;
  const hpAfter = Math.max(1, result.finalPlayerHp);
  let next = commitAutoFightLedger(working, { victory: result.victory, finalPlayerHp: result.finalPlayerHp });
  next = {
    ...next,
    character: { ...next.character, hp: hpAfter, mp: result.finalPlayerMp },
    inventory: [...(next.inventory ?? []), ...result.loot],
    gold: (next.gold ?? 0) + result.goldGained,
    lootPity: result.lootPity
      ? { byTier: { ...(next.lootPity?.byTier ?? {}), [result.lootPity.tier]: result.lootPity.next } }
      : next.lootPity,
  };
  next = growWeaponFamiliarity(next, weaponCategory(equippedWeaponName(next)));
  receipts.push(
    `Fight: ${result.victory ? 'VICTORY' : 'DEFEAT'} vs ${enc.name} in ${result.rounds} round${result.rounds === 1 ? '' : 's'} — dealt ${result.damageDealt}, took ${result.damageReceived} (HP ${hpBefore} → ${hpAfter})`,
    `Encounter cleared: ${enc.name} (${result.victory ? 'victory' : 'defeat'})`
  );
  let found = '';
  if (result.victory) {
    const paid = payEncounterXp(next, raw, `defeated ${enc.name}`);
    next = paid.state;
    receipts.push(...paid.receipts);
    if (result.goldGained > 0) receipts.push(`Gold Gained: ${result.goldGained}`);
    if (result.loot.length) receipts.push(`Loot: ${result.loot.map((l) => `[${l.rarity}] ${l.name}`).join(', ')}`);
    receipts.push(...(result.lootLines ?? []));
    const bits = [
      ...result.loot.map((l) => l.name),
      ...(result.goldGained > 0 ? [`${result.goldGained} gold`] : []),
    ];
    if (bits.length) found = ` On the body: ${bits.join(', ')}.`;
  }
  const what = result.victory
    ? `You fought ${enc.name} for ${result.rounds} round${result.rounds === 1 ? '' : 's'}, dealt ${result.damageDealt} damage and took ${result.damageReceived}. ${enc.name} went down and stayed down.${found}`
    : `You fought ${enc.name} for ${result.rounds} round${result.rounds === 1 ? '' : 's'} and lost. You went down; ${enc.name} left you there, alive at ${hpAfter} HP.`;
  return { state: next, receipts, facts: `${FACTS_HEAD} ${what}` };
}
