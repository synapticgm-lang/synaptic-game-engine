/**
 * T10TABFIGHT — safer first tabletop fight: one telegraph + Back off / Talk / Fight.
 *
 * SRD 5.2.1 Encounter Building — XP Budget per Character (Wizards of the Coast LLC, CC BY 4.0):
 * Level 1 Low / Moderate / High bands are 50 / 75 / 100 XP. Easy maps to Low, Medium to Moderate.
 * A solo level-1 character's first fight picks a foe whose challenge fits Easy/Medium (≤ Moderate),
 * preferring a Low (Easy) CR from the SRD blocks already in the game — no new stat blocks, no XP rule change.
 *
 * One choice set owned here; consumers take a prefix via choiceCountLimitOf (default 3) — never a second list.
 */
import type { ActiveEncounter, GameState } from '../types';
import { applyPresenceFacts, seat } from '../presentAuthority';
import { choiceCountLimitOf } from './houseRules';
import { crToXp, encounterXpBudget } from '../xpRules';
import { SRD_MONSTERS, statBlockForEncounter, type StatBlock } from './srdMonsters';

export const BACK_OFF_CHIP = 'Back off';
export const FIRST_FIGHT_TALK_CHIP = 'Talk';
export const FIGHT_CHIP = 'Fight';

/** Canonical order; pad takes a prefix via choiceCountLimitOf. */
export const FIRST_FIGHT_OPTIONS = [BACK_OFF_CHIP, FIRST_FIGHT_TALK_CHIP, FIGHT_CHIP] as const;

export const FIRST_FIGHT_WARNING =
  'Danger is close — something that can hurt you is near. You can back off, try to talk, or fight.';

export type FirstFightIntent = 'back off' | 'talk' | 'fight';

export interface FirstFightChoiceSet {
  active: boolean;
  options: string[];
  facts: string[];
  warning: string;
  encounter: ActiveEncounter | null;
}

/** Solo: no living party/beast companion beside the PC. */
export function isSoloCharacter(state: Pick<GameState, 'companions'>): boolean {
  return !(state.companions ?? []).some(
    (c) => (c.type === 'party' || c.type === 'beast') && (c.hp ?? 0) > 0
  );
}

/** Level-1 tabletop solo with no fight cleared yet (weaker foe still applies through the fight). */
export function isFirstTabletopFight(state: GameState): boolean {
  if (state.engineMode !== 'dnd') return false;
  if ((state.character?.level ?? 1) > 1) return false;
  if (!isSoloCharacter(state)) return false;
  if ((state.arcDirector?.encounterClearedReceipts ?? []).length > 0) return false;
  return true;
}

/** Triad gate still owed (not yet answered with Talk/Fight). */
export function needsFirstFightSafety(state: GameState): boolean {
  return isFirstTabletopFight(state) && !state.firstFightGateDone;
}

/** Gate is showing (pending first-fight choice parked). */
export function firstFightGateActive(state: GameState): boolean {
  return needsFirstFightSafety(state) && !!state.pendingFirstFight?.encounter;
}

/**
 * Soften the first foe to an Easy/Medium SRD challenge for one level-1 character.
 * Prefers Low (Easy) CR 1/8 blocks already in SRD_MONSTERS; later fights unchanged.
 */
export function firstFightStatBlock(enc: ActiveEncounter, state: GameState): StatBlock {
  const party = 1 + (state.companions ?? []).filter(
    (c) => (c.type === 'party' || c.type === 'beast') && (c.hp ?? 0) > 0
  ).length;
  const easyXp = encounterXpBudget(state.character?.level || 1, party, 0);
  const mediumXp = encounterXpBudget(state.character?.level || 1, party, 1);
  const base = statBlockForEncounter(enc);
  const xp = crToXp(base.cr);
  if (xp <= easyXp && xp <= 25) return base;
  // Prefer beast → giant-rat, else bandit/cultist (all CR 1/8 = 25 XP ≤ Easy 50).
  const preferId = base.kind === 'beast' ? 'giant-rat' : 'bandit';
  const soft =
    SRD_MONSTERS.find((m) => m.id === preferId)
    ?? SRD_MONSTERS.find((m) => m.id === 'cultist')
    ?? SRD_MONSTERS.find((m) => crToXp(m.cr) <= easyXp && crToXp(m.cr) > 0);
  if (soft && crToXp(soft.cr) <= mediumXp) {
    const { match: _m, ...block } = soft as StatBlock & { match?: RegExp };
    return block;
  }
  return base;
}

/** Rename a first-fight foe so the SRD match is the softened block (picker, not a new block). */
export function softenFirstFightEncounter(enc: ActiveEncounter, state: GameState): ActiveEncounter {
  if (!isFirstTabletopFight(state)) return enc;
  const soft = firstFightStatBlock(enc, state);
  const base = statBlockForEncounter(enc);
  if (soft.id === base.id || soft.cr === base.cr) return enc;
  // Keep a plain SRD-matching name so later match still hits the soft block.
  const name =
    soft.id === 'giant-rat'
      ? (/\brat\b/i.test(enc.name) ? enc.name : 'Giant Rat')
      : soft.id === 'bandit'
        ? (/\bbandit\b/i.test(enc.name) ? enc.name : 'Bandit')
        : soft.id === 'cultist'
          ? (/\bcult/i.test(enc.name) ? enc.name : 'Cultist')
          : enc.name;
  return {
    ...enc,
    name,
    cr: soft.cr,
    hp: soft.hp,
    maxHp: soft.hp,
    armorClass: soft.ac,
  };
}

export function firstFightChoiceSet(state: GameState): FirstFightChoiceSet {
  const pending = state.pendingFirstFight;
  if (!firstFightGateActive(state) || !pending?.encounter) {
    return { active: false, options: [], facts: [], warning: '', encounter: null };
  }
  const limit = choiceCountLimitOf(state);
  const warning = pending.warning || FIRST_FIGHT_WARNING;
  const foe = (pending.encounter.name ?? 'the threat').trim() || 'the threat';
  // FOURSLOT3 — named Talk so presence + spoken-answer owners bind the pending foe (bare "Talk" missed).
  const talk = `Talk to ${foe}`;
  const options = [BACK_OFF_CHIP, talk, FIGHT_CHIP].slice(0, limit);
  return {
    active: true,
    options,
    facts: [warning, `Threat: ${foe}.`],
    warning,
    encounter: pending.encounter,
  };
}

/** Free text maps onto the same three intents; never rejected. */
export function mapFirstFightIntent(raw: string): FirstFightIntent | null {
  const t = (raw ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!t) return null;
  if (
    t === BACK_OFF_CHIP.toLowerCase()
    || /^(?:back off|retreat|withdraw|run away|flee|leave|get out|walk away)\b/.test(t)
  ) {
    return 'back off';
  }
  if (
    t === FIRST_FIGHT_TALK_CHIP.toLowerCase()
    || /^talk to\b/.test(t)
    || /^(?:talk|speak|parley|negotiate|call out|greet|ask)\b/.test(t)
  ) {
    return 'talk';
  }
  if (
    t === FIGHT_CHIP.toLowerCase()
    || /^(?:fight|attack|strike|engage|press the attack|draw|charge)\b/.test(t)
  ) {
    return 'fight';
  }
  return null;
}

/** Park the first-fight triad instead of going live. */
export function openFirstFightGate(
  state: GameState,
  encounter: ActiveEncounter
): GameState {
  const softened = softenFirstFightEncounter(encounter, state);
  // T10SM1 — pendingEncounter via presentAuthority; never patch present[] here.
  return {
    ...applyPresenceFacts(state, { pendingEncounter: softened }),
    pendingFirstFight: {
      encounter: softened,
      warning: FIRST_FIGHT_WARNING,
    },
    activeEncounter: null,
  };
}

export interface FirstFightResolveResult {
  state: GameState;
  handled: boolean;
  receipts: string[];
  facts: string[];
}

/**
 * Apply Back off / Talk / Fight. Fight starts the parked foe; Back off clears without a fight
 * (existing flee/retreat leave); Talk keeps the foe present for the normal talk flow.
 */
export function resolveFirstFightChoice(state: GameState, raw: string): FirstFightResolveResult {
  const set = firstFightChoiceSet(state);
  if (!set.active || !set.encounter) {
    return { state, handled: false, receipts: [], facts: [] };
  }
  const intent = mapFirstFightIntent(raw);
  if (!intent) {
    // Free text that does not map still is never rejected — leave the gate up.
    return { state, handled: false, receipts: [], facts: [] };
  }
  const enc = set.encounter;
  if (intent === 'fight') {
    const live = { ...enc, phase: 'engaged' as const, startedTurn: state.turn };
    const { parkedTurn: _p, arrivalTurn: _a, ...rest } = live;
    return {
      state: {
        ...applyPresenceFacts(state, { pendingEncounter: undefined }),
        firstFightGateDone: true,
        pendingFirstFight: null,
        activeEncounter: { ...rest, phase: 'engaged', startedTurn: state.turn },
      },
      handled: true,
      receipts: [`Encounter: ${enc.name}`, FIRST_FIGHT_WARNING.replace(/You can.*/, 'You chose to fight.')],
      facts: [`You stand your ground against ${enc.name}.`],
    };
  }
  if (intent === 'back off') {
    return {
      state: {
        ...applyPresenceFacts(state, { pendingEncounter: undefined }),
        // Backing off is not a fight — gate may show again on the next threat.
        pendingFirstFight: null,
        activeEncounter: null,
      },
      handled: true,
      receipts: [`You backed off from ${enc.name}. No fight.`],
      facts: [`You backed off. ${enc.name} was not engaged.`],
    };
  }
  // Talk: seat the foe for the normal talk path; do not start the fight.
  // T10SM1 — present[] only via presentAuthority.seat.
  // FOURSLOT3 — spoken quote so checkActionFollowed / ensureSpokenAnswer see an answer.
  const cleared = applyPresenceFacts(state, { pendingEncounter: undefined });
  const foe = (enc.name ?? 'the threat').trim() || 'the threat';
  return {
    state: {
      ...seat(cleared, foe),
      firstFightGateDone: true,
      pendingFirstFight: null,
      activeEncounter: null,
    },
    handled: true,
    receipts: [`You try to talk with ${foe}.`],
    facts: [
      `You speak instead of drawing steel. ${foe} is still here.`,
      `${foe} answers you. "Hold — we can talk before this gets worse."`,
    ],
  };
}
