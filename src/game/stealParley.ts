/**
 * M6 — STEAL and PARLEY as real engine actions on the turn spine.
 *
 * SRD 5.2.1 — Ability Checks / Dexterity (Sleight of Hand) (Wizards of the Coast LLC, CC BY 4.0):
 * "Dexterity Checks. A Dexterity check can model any attempt to move nimbly, quickly, or quietly,
 * or to keep from falling on tricky footing. The Athletics, Acrobatics, Sleight of Hand, and Stealth
 * skills reflect aptitude in certain kinds of Dexterity checks."
 * Passive Perception = 10 + Wisdom (Perception) modifier — the DC for unnoticed theft.
 *
 * SRD 5.2.1 — Charisma (Persuasion / Intimidation / Deception) social Influence checks; DC compared
 * to the total. M5 relationship shifts that DC −5..+5; socialLeverage adds named mods.
 *
 * Free text is never rejected. Engine rolls; results land in stateTx, FactSheet beat.steps, TurnLog.
 * Idea only from docs/orders/merge/proto/engine.mjs — not a code copy.
 */
import type { GameState, Item, NpcMemory } from './types';
import { resolveCheckRecord, type CheckMod, type CheckResultRecord } from './checkRules';
import { abilityModOf, statBlockForEncounter } from './rules/srdMonsters';
import { deriveTabletopSheet } from './tabletop/characterBuild';
import { turnRng } from './seededRng';
import { socialLeverageMods } from './socialLeverage';
import { ensurePersona, nudgePersona, socialShift } from './npcPersona';
import { tickEncounterTerminal } from './encounterTerminalFsm';
import { formatBreakAwayStatus, outcomeFactFromRecord } from './rules/rollView';
import type { IntentStep, IntentTone } from './intentParser';

export type StealOutcome = {
  taken: boolean;
  noticed: boolean;
  /** Guarded quest item with living guardian — attempt resolved, item not granted. */
  guardedHold: boolean;
  record: CheckResultRecord;
  facts: string[];
  receipts: string[];
  state: GameState;
};

export type ParleyOutcome = {
  success: boolean;
  endedFight: boolean;
  skill: 'persuasion' | 'intimidation' | 'deception';
  record: CheckResultRecord;
  facts: string[];
  receipts: string[];
  state: GameState;
};

const STEAL_RE =
  /\b(steal|pickpocket|filch|swipe|palm|lift\s+(?:the|a|an|his|her|their)\b|take\s+(?:the|a|an)\s+\w[\w\s'-]{0,24}\s+from)\b/i;
const PARLEY_RE =
  /\b(parley|negotiate|talk\s+(?:it|them)\s+down|surrender|truce|bargain|calm\s+(?:them|him|her|the)\b|talk\s+(?:past|your\s+way))\b/i;
/** Consumption / sample — "take a sip from the cup" is not theft of an object named "sip". */
const CONSUME_TAKE_RE =
  /\btake\s+(?:a|an|the|my|your)\s+(?:sip|drink|swig|gulp|bite|taste|puff|drag|whiff|breath)\b/i;

export function looksLikeSteal(text: string, step?: IntentStep | null): boolean {
  const clause = step?.clause ?? text;
  // T10S — verb-noun consumption is not a take/gain of an item.
  if (CONSUME_TAKE_RE.test(clause) || CONSUME_TAKE_RE.test(text)) return false;
  if (step?.action === 'take' && STEAL_RE.test(clause)) return true;
  if (step?.action === 'take' && /\bfrom\b/i.test(clause) && !CONSUME_TAKE_RE.test(clause)) return true;
  return STEAL_RE.test(text);
}

export function looksLikeParley(text: string, step?: IntentStep | null): boolean {
  const act = step?.action;
  if (act === 'persuade' || act === 'intimidate' || act === 'deceive') return true;
  return PARLEY_RE.test(text);
}

/** Tone / step action → SRD social skill. */
export function socialSkillFromTone(
  tone: IntentTone | null | undefined,
  action?: string | null,
): 'persuasion' | 'intimidation' | 'deception' {
  if (action === 'intimidate' || tone === 'threatening') return 'intimidation';
  if (action === 'deceive') return 'deception';
  if (action === 'persuade' || tone === 'friendly' || tone === 'flattering') return 'persuasion';
  if (tone === 'rude') return 'intimidation';
  return 'persuasion';
}

function sheetSkill(
  state: GameState,
  skill: 'Sleight of Hand' | 'Persuasion' | 'Intimidation' | 'Deception' | 'Acrobatics',
  ability: 'DEX' | 'CHA',
): number {
  const fallback = abilityModOf(state.character?.attributes?.[ability] ?? 10);
  try {
    if (!state.character?.srd?.speciesId || !state.character?.srd?.classId) return fallback;
    const row = deriveTabletopSheet(state)?.skills.find((k) => k.skill === skill);
    if (row) return row.total;
  } catch {
    /* Incomplete sheet — ability mod only. */
  }
  return fallback;
}

/** Passive Wisdom (Perception) for a named watcher / encounter foe. */
export function passivePerceptionOf(state: GameState, who?: string | null): number {
  const enc = state.activeEncounter;
  if (enc) return statBlockForEncounter(enc).passivePerception;
  const mem = findMemory(state, who);
  // Sheet Insight/Perception totals are not stored on NpcMemory — SRD baseline 10.
  void mem;
  void who;
  return 10;
}

function findMemory(state: GameState, who?: string | null): NpcMemory | undefined {
  const n = (who ?? '').trim().toLowerCase();
  if (!n) return undefined;
  return (state.npcMemories ?? []).find((m) => (m.npcName ?? '').toLowerCase().includes(n) || n.includes((m.npcName ?? '').toLowerCase()));
}

function pushOtherTx(state: GameState, summary: string, entity: string, why: string): GameState {
  const rev = Math.max(0, state.ledgerRevision ?? 0);
  const turn = state.turn ?? 0;
  const log = [
    ...(state.stateTxLog ?? []),
    {
      id: `m6-${rev}-${turn}-${(summary || 'tx').slice(0, 12)}`,
      rev,
      turn,
      kind: 'other' as const,
      summary: summary.slice(0, 160),
      entity,
      why,
      createdAt: Date.now(),
    },
  ].slice(-80);
  return { ...state, stateTxLog: log, ledgerRevision: rev + 1 };
}

/** Quest / prop item the living encounter (or named guardian role) still holds. */
export function isGuardedQuestItem(state: GameState, item: string): boolean {
  const needle = (item ?? '').trim().toLowerCase();
  if (!needle) return false;
  const enc = state.activeEncounter;
  const guardianLives = !!(enc && enc.hp > 0 && enc.phase !== 'terminal');
  const guardRole = (state.npcMemories ?? []).some((m) =>
    /guardian|keeper/i.test(`${m.roleHint ?? ''} ${m.npcName ?? ''}`),
  );
  if (!guardianLives && !guardRole) return false;
  const props = (state.sceneFacts?.props ?? []).map((p) => p.toLowerCase());
  if (props.some((p) => p.includes(needle) || needle.includes(p))) return true;
  for (const q of state.quests ?? []) {
    if (q.status === 'completed' || q.status === 'failed') continue;
    const blob = `${q.name ?? ''} ${q.description ?? ''} ${(q.objectives ?? []).map((o) => o.description).join(' ')}`.toLowerCase();
    if (blob.includes(needle)) return true;
  }
  return false;
}

function extractStealItem(text: string, step?: IntentStep | null): string {
  if (CONSUME_TAKE_RE.test(text)) return '';
  if (step?.target?.trim()) {
    const t = step.target.trim();
    // Target that is only a consumption measure (sip/drink) is not loot.
    if (/^(?:sip|drink|swig|gulp|bite|taste|puff|drag|whiff|breath)$/i.test(t)) return '';
    return t;
  }
  const m =
    text.match(/\b(?:steal|filch|swipe|palm|pickpocket|lift|take)\s+(?:the|a|an)\s+([^,.!?]{2,40}?)(?:\s+from\b|$)/i)
    ?? text.match(/\b(?:the|a|an)\s+([a-z][\w'-]*(?:\s+[a-z][\w'-]*){0,3})\s+from\b/i);
  const item = (m?.[1] ?? 'purse').replace(/\s+/g, ' ').trim();
  if (/^(?:sip|drink|swig|gulp|bite|taste|puff|drag|whiff|breath)$/i.test(item)) return '';
  return item;
}

function extractWatcher(text: string, step?: IntentStep | null, state?: GameState): string {
  if (step?.addressee?.trim()) return step.addressee.trim();
  if (step?.target?.trim() && state?.activeEncounter?.name) return state.activeEncounter.name;
  const from = text.match(/\bfrom\s+([A-Z][\w'-]*(?:\s+[A-Z][\w'-]*){0,2})/);
  if (from?.[1]) return from[1];
  return state?.activeEncounter?.name ?? state?.sceneFacts?.present?.[0] ?? 'someone here';
}

/**
 * Resolve a steal attempt: Dexterity (Sleight of Hand) vs Passive Wisdom (Perception).
 * Success → taken unnoticed (unless a living guardian still holds a quest item).
 * Failure → not taken, noticed → M5 persona nudge `cheated`.
 */
export function resolveStealAttempt(
  state: GameState,
  text: string,
  step?: IntentStep | null,
  rng: () => number = turnRng(state, 'steal'),
): StealOutcome {
  const item = extractStealItem(text, step);
  // No object (e.g. consumption "sip") → not a steal commit.
  if (!item) {
    const empty = resolveCheckRecord({
      label: 'Sleight of Hand',
      mods: [],
      dc: 10,
      auto: 'unwilling',
    });
    return {
      taken: false,
      noticed: false,
      guardedHold: false,
      record: empty,
      facts: [],
      receipts: [],
      state,
    };
  }
  const watcher = extractWatcher(text, step, state);
  const dc = passivePerceptionOf(state, watcher);
  const mod = sheetSkill(state, 'Sleight of Hand', 'DEX');
  const rec = resolveCheckRecord({
    label: 'Sleight of Hand',
    mods: [{ label: 'DEX', value: mod }],
    dc,
    rng,
  });
  // SRD 5.2.1: Passive Perception is 10 + Wisdom (Perception) modifier — used as the DC here.
  rec.spec = { kind: 'skill', ability: 'DEX', skill: 'sleight of hand', dc, dcShown: true, adv: 'normal' };

  const success = rec.outcome === 'success';
  const guardedHold = success && isGuardedQuestItem(state, item);
  const taken = success && !guardedHold;
  const noticed = !success;

  const facts: string[] = [];
  const receipts: string[] = [
    `Steal check: d20 ${rec.kept} ${mod >= 0 ? '+' : ''}${mod} = ${rec.total} vs Passive Perception ${dc} — ${success ? 'success' : 'failure'}`,
    outcomeFactFromRecord(rec),
  ];

  let next = state;
  if (taken) {
    const inv: Item[] = [...(next.inventory ?? [])];
    const id = `steal-${(next.turn ?? 0)}-${item.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`;
    inv.push({ id, name: item, quantity: 1, equipped: false, rarity: 'Common' });
    next = { ...next, inventory: inv };
    facts.push(`Took the ${item} unnoticed.`);
    next = pushOtherTx(next, `Stole ${item}`, item, `Sleight of Hand ${rec.total} vs Passive Perception ${dc}`);
    const given = new Set([...(next.sceneFacts?.givenAway ?? [])]);
    // Item left the scene props when taken.
    const props = (next.sceneFacts?.props ?? []).filter((p) => p.toLowerCase() !== item.toLowerCase());
    next = {
      ...next,
      sceneFacts: next.sceneFacts
        ? { ...next.sceneFacts, props, givenAway: [...given] }
        : next.sceneFacts,
    };
  } else if (guardedHold) {
    facts.push(
      `Sleight of Hand beat Passive Perception ${dc}, but the guardian still holds the ${item}; it was not taken.`,
    );
    next = pushOtherTx(
      next,
      `Steal attempt on guarded ${item}`,
      item,
      `Guardian lives — attempt resolved, item not granted`,
    );
  } else {
    facts.push(`Failed to take the ${item}; ${watcher} noticed.`);
    next = pushOtherTx(next, `Caught stealing ${item}`, watcher, `Sleight of Hand ${rec.total} < Passive Perception ${dc}`);
  }

  if (noticed) {
    // M5 persona event — being noticed is cheated (existing nudge), not new maths.
    const mem = findMemory(next, watcher);
    if (mem) {
      const nudged = nudgePersona(next, mem, 'cheated', `caught stealing ${item}`);
      next = nudged.state;
      const memories = (next.npcMemories ?? []).map((m) =>
        (m.npcName ?? '') === (nudged.memory.npcName ?? '') ? nudged.memory : m,
      );
      if (!(next.npcMemories ?? []).some((m) => (m.npcName ?? '') === (nudged.memory.npcName ?? ''))) {
        memories.push(nudged.memory);
      }
      next = {
        ...next,
        npcMemories: memories,
        personaNudges: [...(next.personaNudges ?? []), ...(nudged.nudge ? [nudged.nudge] : [])],
      };
    }
  }

  return { taken, noticed, guardedHold, record: rec, facts, receipts, state: next };
}

/** Roll only — tone skill + socialLeverage + M5 DC shift. No fight clear. */
export function rollParleyCheck(
  state: GameState,
  text: string,
  step?: IntentStep | null,
  rng: () => number = turnRng(state, 'parley'),
): { skill: 'persuasion' | 'intimidation' | 'deception'; record: CheckResultRecord; who: string } {
  const skillKey = socialSkillFromTone(step?.tone, step?.action);
  const skillName =
    skillKey === 'intimidation' ? 'Intimidation' : skillKey === 'deception' ? 'Deception' : 'Persuasion';
  const mod = sheetSkill(state, skillName, 'CHA');
  const enc = state.activeEncounter;
  const block = enc ? statBlockForEncounter(enc) : null;
  let dc = Math.max(15, block?.scores.INT ?? 15);

  const who = step?.addressee?.trim() || enc?.name || extractWatcher(text, step, state);
  const mem = findMemory(state, who);
  const shift = mem ? socialShift(state, ensurePersona(state, mem)) : 0;
  if (shift !== 0) dc = Math.max(1, dc + shift);

  const mods: CheckMod[] = [{ label: 'CHA', value: mod }];
  const leverage = socialLeverageMods(state, text, who);
  for (const m of leverage) mods.push({ label: m.label, value: m.value });

  const rec = resolveCheckRecord({
    label: `Parley (${skillName})`,
    mods,
    dc,
    rng,
  });
  rec.spec = {
    kind: 'skill',
    ability: 'CHA',
    skill: skillKey,
    dc,
    dcShown: true,
    adv: 'normal',
  };
  return { skill: skillKey, record: rec, who };
}

/**
 * Resolve a parley / calm-hostile social check.
 * Skill from M2 tone; DC = max(15, foe INT) + M5 socialShift; mods include socialLeverage.
 * Success can end a live fight via the encounter terminal.
 */
export function resolveParleyAttempt(
  state: GameState,
  text: string,
  step?: IntentStep | null,
  rng: () => number = turnRng(state, 'parley'),
): ParleyOutcome {
  const { skill: skillKey, record: rec, who } = rollParleyCheck(state, text, step, rng);
  const skillName =
    skillKey === 'intimidation' ? 'Intimidation' : skillKey === 'deception' ? 'Deception' : 'Persuasion';
  const enc = state.activeEncounter;
  const success = rec.outcome === 'success';
  const status = formatBreakAwayStatus('parley', rec);
  const receipts = [status, outcomeFactFromRecord(rec)];
  const facts: string[] = [];
  let next = state;
  let endedFight = false;
  const mem = findMemory(state, who);

  if (success) {
    facts.push(enc ? `${enc.name} accepted terms and stood down.` : `${who} stands down.`);
    if (enc) {
      const tick = tickEncounterTerminal(next, text, { parleySucceeded: true });
      next = tick.state;
      receipts.push(...tick.receipts);
      endedFight = !next.activeEncounter || next.activeEncounter.phase === 'terminal';
    }
    next = pushOtherTx(next, `Parley success with ${who}`, who, `${skillName} ${rec.total} vs DC ${rec.dc}`);
  } else {
    facts.push(enc ? `${enc.name} refused terms; the fight continues.` : `${who} is not convinced.`);
    next = pushOtherTx(next, `Parley failed with ${who}`, who, `${skillName} ${rec.total} < DC ${rec.dc}`);
    if (skillKey === 'deception' && mem) {
      const nudged = nudgePersona(next, mem, 'lied_caught', 'deception seen through');
      next = nudged.state;
      const memories = (next.npcMemories ?? []).map((m) =>
        (m.npcName ?? '') === (nudged.memory.npcName ?? '') ? nudged.memory : m,
      );
      next = {
        ...next,
        npcMemories: memories,
        personaNudges: [...(next.personaNudges ?? []), ...(nudged.nudge ? [nudged.nudge] : [])],
      };
    }
  }

  return { success, endedFight, skill: skillKey, record: rec, facts, receipts, state: next };
}
