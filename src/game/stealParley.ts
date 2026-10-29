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
import { isAggregatePersonToken, isCrowdFillerToken } from './chromeAuthority';
import { isOutOfTalkingRange } from './hereSpot';
import { applyPresenceFacts, seat, unseat, withMemoryPresentFlag } from './presentAuthority';

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

/**
 * People / crowd fillers / present groups are never loot (T10X "Gained bystanders"; T10S sip class).
 * A Gained line must come from a real item grant only.
 */
export function isNonLootableTakeTarget(target: string | null | undefined, state?: GameState): boolean {
  const raw = (target ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return false;
  const bare = raw.replace(/^(?:the|a|an)\s+/i, '').trim();
  if (isCrowdFillerToken(raw) || isCrowdFillerToken(bare)) return true;
  if (isAggregatePersonToken(raw) || isAggregatePersonToken(bare)) return true;
  if (!state) return false;
  const names = [
    ...(state.sceneFacts?.present ?? []),
    ...(state.npcMemories ?? []).map((m) => m.npcName),
    state.activeEncounter?.name,
  ]
    .map((n) => (n ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const key = bare.toLowerCase();
  return names.some((n) => {
    const nk = n.replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase();
    return nk === key || nk.includes(key) || key.includes(nk);
  });
}

export function looksLikeSteal(text: string, step?: IntentStep | null, state?: GameState): boolean {
  const clause = step?.clause ?? text;
  // T10S — verb-noun consumption is not a take/gain of an item.
  if (CONSUME_TAKE_RE.test(clause) || CONSUME_TAKE_RE.test(text)) return false;
  // T10X — grabbing a present person / crowd noun is an act, not loot.
  if (step?.action === 'take' && isNonLootableTakeTarget(step.target, state)) return false;
  if (step?.action === 'take' && STEAL_RE.test(clause)) {
    return !isNonLootableTakeTarget(step.target, state);
  }
  if (step?.action === 'take' && /\bfrom\b/i.test(clause) && !CONSUME_TAKE_RE.test(clause)) {
    if (isNonLootableTakeTarget(step.target, state)) return false;
    return true;
  }
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

function extractStealItem(text: string, step?: IntentStep | null, state?: GameState): string {
  if (CONSUME_TAKE_RE.test(text)) return '';
  if (step?.target?.trim()) {
    const t = step.target.trim();
    // Target that is only a consumption measure (sip/drink) is not loot.
    if (/^(?:sip|drink|swig|gulp|bite|taste|puff|drag|whiff|breath)$/i.test(t)) return '';
    // T10X — person / crowd / present group is never an inventory item.
    if (isNonLootableTakeTarget(t, state)) return '';
    return t;
  }
  const m =
    text.match(/\b(?:steal|filch|swipe|palm|pickpocket|lift|take)\s+(?:the|a|an)\s+([^,.!?]{2,40}?)(?:\s+from\b|$)/i)
    ?? text.match(/\b(?:the|a|an)\s+([a-z][\w'-]*(?:\s+[a-z][\w'-]*){0,3})\s+from\b/i);
  const item = (m?.[1] ?? 'purse').replace(/\s+/g, ' ').trim();
  if (/^(?:sip|drink|swig|gulp|bite|taste|puff|drag|whiff|breath)$/i.test(item)) return '';
  if (isNonLootableTakeTarget(item, state)) return '';
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
  const item = extractStealItem(text, step, state);
  // No object (e.g. consumption "sip" / person grab) → not a steal commit.
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
 * T10AB / T10RC1 — grab / collar / blade-threat against a present person (not yet a live fight).
 * SRD 5.2.1 Grappling: Strength (Athletics) contested check; success → grappled.
 * SRD 5.2.1 — Influence (Charisma / Intimidation): attitude shifts; a failed hard threat commits
 * refuse+leave (or fight), never an open speech reaction slot for the writer to bargain.
 * Never rejects free text. Seat via presentAuthority before attitude/leave (incl. road names).
 */
export function resolvePersonThreatAttempt(
  state: GameState,
  text: string,
  step?: IntentStep | null,
  rng: () => number = turnRng(state, 'person-threat'),
): ParleyOutcome {
  const who =
    step?.addressee?.trim()
    || step?.target?.trim()
    || extractWatcher(text, step, state);
  const grab =
    /\b(grab|grapple|collar|drag|haul|pin|seize|throat|blade|dagger)\b/i.test(text)
    || step?.action === 'take'
    || step?.action === 'intimidate';
  const facts: string[] = [];
  const receipts: string[] = [];
  let next = state;
  let success = false;

  // T10RC1 — same talking-range gate as presence (hereSpot.awayFrom / road distanceFt).
  if (who && isOutOfTalkingRange(state, who)) {
    const ft = state.journey?.encounter?.distanceFt;
    const range = typeof ft === 'number' ? `${ft} ft off` : 'out of talking range';
    facts.push(
      `Must narrate: ${who} is still ${range}; close the distance before a grab or blade threat can land.`,
    );
    receipts.push(`Threat out of reach: ${who} (${range})`);
    return {
      success: false,
      endedFight: false,
      skill: 'intimidation',
      record: {
        label: 'Intimidation (out of range)',
        d20s: [0],
        kept: 0,
        advState: 'normal',
        total: 0,
        dc: 0,
        outcome: 'failure',
        mods: [],
      },
      facts,
      receipts,
      state: next,
    };
  }

  // Seat the target before attitude / leave (road encounter.name included).
  if (who) next = seat(next, who);

  if (grab) {
    // SRD 5.2.1 — Grappling: "You make a Strength (Athletics) check contested by the target's
    // Strength (Athletics) or Dexterity (Acrobatics) check." Engine uses Athletics vs DC 12 baseline.
    const ath = abilityModOf(state.character?.attributes?.STR ?? 10);
    const dc = 12;
    const rec = resolveCheckRecord({
      label: 'Athletics (grapple)',
      mods: [{ label: 'STR', value: ath }],
      dc,
      rng,
    });
    rec.spec = { kind: 'skill', ability: 'STR', skill: 'athletics', dc, dcShown: true, adv: 'normal' };
    receipts.push(
      `Grapple: d20 ${rec.kept} ${ath >= 0 ? '+' : ''}${ath} = ${rec.total} vs DC ${dc} — ${rec.outcome}`,
      outcomeFactFromRecord(rec),
    );
    success = rec.outcome === 'success';
    if (success) {
      facts.push(`Grappled ${who} (Athletics ${rec.total} vs DC ${dc}).`);
      next = pushOtherTx(next, `Grappled ${who}`, who, `Athletics ${rec.total} vs DC ${dc}`);
    } else {
      facts.push(`${who} slipped the grab (Athletics ${rec.total} < DC ${dc}).`);
      next = pushOtherTx(next, `Failed grapple on ${who}`, who, `Athletics ${rec.total} < DC ${dc}`);
    }
  }

  const social = rollParleyCheck(
    next,
    text,
    { ...(step ?? { action: 'intimidate', clause: text, target: who, addressee: who, topic: null, say: null, destination: null, tone: 'threatening', deal: null }), action: 'intimidate', tone: 'threatening' as IntentTone },
    rng,
  );
  const skillName = 'Intimidation';
  receipts.push(outcomeFactFromRecord(social.record));
  const intimOk = social.record.outcome === 'success';
  if (intimOk) {
    facts.push(`${who} flinches under the threat (${skillName} ${social.record.total} vs DC ${social.record.dc}).`);
    facts.push(`Must narrate: ${who} yields under the threat and stays hostile.`);
    success = true;
  } else {
    facts.push(`${who} does not yield (${skillName} ${social.record.total} < DC ${social.record.dc}).`);
    // T10RC1 — failed Influence commits refuse + leave (not an open speech bargain slot).
    facts.push(`Must narrate: ${who} refuses the threat and leaves.`);
  }
  next = pushOtherTx(
    next,
    intimOk ? `Intimidated ${who}` : `Intimidation failed vs ${who}`,
    who,
    `${skillName} ${social.record.total} vs DC ${social.record.dc}`,
  );

  // Shift disposition hostile; seat first, then leave on failed intimidation.
  const mem = findMemory(next, who) ?? (who
    ? ({
        npcId: `threat:${who.toLowerCase().replace(/\s+/g, '-')}`,
        npcName: who,
        disposition: 'hostile' as const,
        attitude: 'hostile' as const,
        facts: [],
        lastSeenTurn: next.turn ?? 0,
        location: next.currentLocation,
        present: true,
      } satisfies NpcMemory)
    : null);
  if (mem) {
    const nudged = nudgePersona(
      next,
      withMemoryPresentFlag(
        {
          ...mem,
          disposition: mem.disposition === 'allied' || mem.disposition === 'friendly' ? 'neutral' : 'hostile',
          attitude: 'hostile',
          location: next.currentLocation ?? mem.location,
        },
        true
      ),
      'threatened',
      grab ? 'grabbed and threatened' : 'threatened',
    );
    next = nudged.state;
    const memories = (next.npcMemories ?? []).map((m) =>
      (m.npcName ?? '') === (nudged.memory.npcName ?? '')
        ? withMemoryPresentFlag(
            { ...nudged.memory, disposition: 'hostile' as const, attitude: 'hostile' as const },
            true
          )
        : m,
    );
    if (!(next.npcMemories ?? []).some((m) => (m.npcName ?? '') === (nudged.memory.npcName ?? ''))) {
      memories.push(
        withMemoryPresentFlag(
          { ...nudged.memory, disposition: 'hostile', attitude: 'hostile' },
          true
        )
      );
    }
    next = applyPresenceFacts(
      {
        ...next,
        npcMemories: memories,
        personaNudges: [...(next.personaNudges ?? []), ...(nudged.nudge ? [nudged.nudge] : [])],
      },
      next.sceneFacts
        ? { present: [...new Set([...(next.sceneFacts.present ?? []), who])] }
        : {
            crowd: 'sparse',
            noise: 'voices',
            present: [who],
            props: [],
            lastBeat: '',
            updatedTurn: next.turn ?? 0,
          }
    );
    if (!intimOk && who) {
      next = unseat(next, who, 'engine');
      receipts.push(`${who} pulls away and will not stay to be handled.`);
    }
  }

  return {
    success,
    endedFight: false,
    skill: 'intimidation',
    record: social.record,
    facts,
    receipts,
    state: next,
  };
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
