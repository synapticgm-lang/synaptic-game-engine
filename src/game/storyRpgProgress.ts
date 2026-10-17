/**
 * Mode lap 3 — Story RPG runs on people and deeds, not on LitRPG progression.
 *
 * Before the writer, a Story RPG turn commits two things the engine can see:
 * - Standing: helping or refusing a named person here moves how they stand with the player
 *   (npcMemories disposition), and the change is a world fact the writer must carry.
 * - Quest step: the main quest's next open step ticks when the player is at the step's explicit
 *   placeId (OPT-4; no word-match). A placeless decision ("Pick an approach") with routes expands
 *   those routes as OPT-1 affordances (TT-G1); without routes it is still offered as its own chip
 *   (RC-QT1) and never ticks from the chip label alone — the tick needs an engine outcome
 *   (place, check, contact favour, route success). Beat timing, travel and talk never tick it.
 * - They'll remember: a standing change schedules a delayed consequence (scheduleDelayedConsequence). The
 *   arcDirector delivery pays it off on the first due turn that person is present again: a hidden trust shift
 *   on their relationship record and a "Remembered" beat. The choice itself gets a "will remember that" cue.
 * - Ending: once a main quest is finished the shared ending gates (pyoaEndingGates + rpgEndings) offer
 *   RPG_ENDING_CHIP; taking it commits the best eligible ending and the run ends.
 * - Two ways through each main step: the step itself (be at its place), or call on a person
 *   here who stands with you to see to it. Calling on them spends goodwill (a hidden trust cost on their record).
 * - Origin (rules/rpgOrigin) and romance (a Loyal companion, only when romance subplots are on).
 * - Every committed choice goes into the journal of choices (choiceJournal).
 * Other modes are untouched.
 */
import type { GameState, NpcMemory, Quest, QuestObjective, Settings } from './types';
import { recordChoice } from './choiceJournal';
import { settleOrigin } from './rules/rpgOrigin';
import { approvalBand, recruitedCompanions } from './rules/companions';
import { shiftStoredRelationship } from './npcRelationships';
import { detectStanceTreatment } from './factionStandings';
import { recordNpcTreatmentFromAction } from './npcMemory';
import { presentNpcNames } from './npcRelationships';
import { mainSpineQuest } from './questPlay';
import { objectiveChip } from './choiceRanking';
import { scheduleDelayedConsequence } from './pyoaDelayedConsequences';
import { commitEnding, selectBestEnding } from './pyoaEndingGates';
import { RPG_ENDING_CHIP } from './rpgEndings';
import { isPlayInputLocked } from './playPhase';
import type { BibleId } from './pyoaTypes';
import { applyQuestRouteOutcome, openRouteView, placeIdForStep } from './questRoutes';

export type StoryRpgTurn = { state: GameState; receipts: string[] };

/**
 * Explicit placeId on the objective (OPT-4). Word-match + STEP_STOP deleted (tt-cut-log q38-G1a).
 * `step` may be the objective, or a legacy description string (returns null — no word match).
 */
export function placeForStep(_state: GameState, step: QuestObjective | string): string | null {
  if (typeof step === 'string') return null;
  return placeIdForStep(step);
}

function atPlace(state: GameState, place: string): boolean {
  const here = (state.currentLocation ?? '').trim().toLowerCase();
  const p = place.toLowerCase();
  return !!here && (here === p || here.endsWith(` in ${p}`) || here.includes(p));
}

function tickNextStep(quests: Quest[], questId: string): { quests: Quest[]; step: string } | null {
  const quest = quests.find((q) => q.id === questId);
  const steps = quest?.objectives ?? [];
  const idx = steps.findIndex((o) => !o.completed);
  if (!quest || idx < 0) return null;
  const objectives = steps.map((o, i) => (i === idx ? { ...o, completed: true } : o));
  const done = objectives.every((o) => o.completed);
  return {
    quests: quests.map((q) => (q.id === questId ? { ...q, objectives, ...(done ? { status: 'completed' as const } : {}) } : q)),
    step: steps[idx]!.description,
  };
}

const DISPOSITION_WORD: Record<NpcMemory['disposition'], string> = {
  hostile: 'hostile',
  neutral: 'neutral',
  friendly: 'friendly',
  allied: 'an ally',
  romanced: 'close',
  unknown: 'a stranger',
};

/** The named person this line is aimed at: named in the line, else the one person here. */
function stanceTarget(state: GameState, action: string): string | null {
  const present = presentNpcNames(state);
  const low = action.toLowerCase();
  return present.find((n) => low.includes(n.toLowerCase())) ?? (present.length === 1 ? present[0] : null);
}

const chipKey = (s: string) => s.replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim().toLowerCase();

/** Story RPG: placeless open step without routes — single decision chip (RC-QT1). With routes, affordances own the chips. */
export function storyRpgDecisionChip(state: GameState): string | null {
  if (state.engineMode !== 'rpg' || !state.openingEstablishment?.complete || state.activeEncounter) return null;
  const quest = mainSpineQuest(state);
  const openObj = quest?.objectives?.find((o) => !o.completed);
  if (!openObj) return null;
  if ((openObj.routes?.length ?? 0) > 0) return null;
  if (placeForStep(state, openObj)) return null;
  return objectiveChip(openObj.description);
}

/** Turns before a remembered choice can come back, and the hidden trust it moves when it does. */
export const REMEMBER_AFTER_TURNS = 3;
export const REMEMBER_TRUST = { helped: 8, refused: -8 } as const;

/** The pending "they remember" consequence for this person, if any. */
export function pendingRemembered(state: GameState, npc: string) {
  const key = npc.trim().toLowerCase();
  return (state.arcDirector?.pyoaDelayedConsequences ?? []).find(
    (c) => c.status === 'pending' && c.payload.awaitsNpc?.trim().toLowerCase() === key,
  );
}

/** Schedule the payoff of helping or refusing this person; a newer choice replaces their older pending one. */
function scheduleRemembered(state: GameState, npc: string, helped: boolean): GameState {
  const key = npc.trim().toLowerCase();
  const kept = (state.arcDirector?.pyoaDelayedConsequences ?? []).map((c) =>
    c.status === 'pending' && c.payload.awaitsNpc?.trim().toLowerCase() === key ? { ...c, status: 'cancelled' as const } : c,
  );
  const base: GameState = { ...state, arcDirector: { ...state.arcDirector, pyoaDelayedConsequences: kept } };
  const deed = helped ? 'helped' : 'refused';
  return scheduleDelayedConsequence(base, {
    sourceCrisisId: 'rpg-standing',
    sourceForkId: `${key.replace(/[^a-z0-9]+/g, '-')}-${deed}`,
    dueAtTurn: state.turn + REMEMBER_AFTER_TURNS,
    type: 'relationship_shift',
    payload: {
      relationshipDeltas: [{ npcId: npc, aspect: 'trust', delta: REMEMBER_TRUST[deed], reason: `remembers you ${deed}` }],
      narrativeBeat: `${npc} remembers your ${helped ? 'help' : 'refusal'}.`,
      journalHint: `${npc} will remember that you ${deed}.`,
      awaitsNpc: npc,
    },
  });
}

const STANDS_WITH_YOU: ReadonlySet<NpcMemory['disposition']> = new Set(['friendly', 'allied', 'romanced']);

/** Hidden trust a contact spends when the player calls on them to see to a step. */
export const CONTACT_FAVOUR_TRUST = -4;

function openMainStep(state: GameState): { quest: Quest; step: string } | null {
  const quest = mainSpineQuest(state);
  const step = quest?.objectives?.find((o) => !o.completed)?.description ?? '';
  return quest && step ? { quest, step } : null;
}

/** People here who would see to a step for the player: a companion, or someone Friendly or closer. */
function contactsHere(state: GameState): string[] {
  const companions = new Set(recruitedCompanions(state).map((c) => c.name.toLowerCase()));
  const memory = new Map((state.npcMemories ?? []).map((m) => [m.npcName.toLowerCase(), m.disposition]));
  return presentNpcNames(state).filter((n) => {
    const k = n.toLowerCase();
    return /^[A-Z]/.test(n) && (companions.has(k) || STANDS_WITH_YOU.has(memory.get(k) ?? 'unknown'));
  });
}

export function contactChip(name: string, step: string): string {
  return `Call on ${name}: ${objectiveChip(step)}`;
}

/** Story RPG: the second way through the main quest's open step — one chip per contact here. */
export function storyRpgContactPad(state: GameState): string[] | null {
  if (state.engineMode !== 'rpg' || !state.openingEstablishment?.complete || state.activeEncounter || isPlayInputLocked(state)) return null;
  const open = openMainStep(state);
  if (!open) return null;
  const chips = contactsHere(state).map((n) => contactChip(n, open.step));
  return chips.length ? chips : null;
}

function contactFromInput(state: GameState, action: string): string | null {
  const open = openMainStep(state);
  if (!open) return null;
  const k = chipKey(action);
  return contactsHere(state).find((n) => chipKey(contactChip(n, open.step)) === k) ?? null;
}

/** Romance needs the romance subplots setting and never runs in Kid Mode. */
export function romanceAllowed(settings: Pick<Settings, 'romanceSubplots' | 'contentMode'> | null | undefined): boolean {
  return !!settings?.romanceSubplots && settings.contentMode !== 'kid';
}

export function romanceChip(name: string): string {
  return `Tell ${name} how you feel`;
}

/** Story RPG romance: only with romance subplots on, only for a companion whose approval is Loyal. */
export function romancePad(state: GameState, romanceOn: boolean): string[] | null {
  if (!romanceOn || state.engineMode !== 'rpg' || state.activeEncounter || isPlayInputLocked(state)) return null;
  const close = new Set((state.npcMemories ?? []).filter((m) => m.disposition === 'romanced').map((m) => m.npcName.toLowerCase()));
  const names = recruitedCompanions(state)
    .map((c) => c.name)
    .filter((n) => !close.has(n.toLowerCase()) && approvalBand(state, n) === 'loyal');
  return names.length ? names.map(romanceChip) : null;
}

/** Story RPG: the ending chip, offered once the shared ending gates have an eligible ending. */
export function rpgEndingChip(state: GameState): string | null {
  if (state.engineMode !== 'rpg' || !state.openingEstablishment?.complete || state.activeEncounter || isPlayInputLocked(state)) return null;
  return selectBestEnding((state.campaignBibleId ?? '') as BibleId, state) ? RPG_ENDING_CHIP : null;
}

/** Commit the best eligible ending and write it in the journal (the ending chip and "Finish" both come here). */
export function commitRpgEnding(state: GameState): StoryRpgTurn | null {
  const ending = selectBestEnding((state.campaignBibleId ?? '') as BibleId, state);
  if (!ending) return null;
  const done = commitEnding(ending, state);
  return {
    state: recordChoice(done.state, { kind: 'ending', text: `Ended the story: ${ending.name}.` }),
    receipts: [`Ending: ${ending.name} — ${ending.terminalText}`],
  };
}

export function applyStoryRpgTurn(state: GameState, playerInput: string, opts: { romance?: boolean } = {}): StoryRpgTurn {
  if (state.engineMode !== 'rpg' || !state.openingEstablishment?.complete) return { state, receipts: [] };
  const action = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  const receipts: string[] = [];
  let next = state;

  if (chipKey(action) === chipKey(RPG_ENDING_CHIP) && rpgEndingChip(state)) return commitRpgEnding(state)!;

  const origin = settleOrigin(state, action);
  if (origin.receipts.length) {
    return { state: recordChoice(origin.state, { kind: 'origin', text: origin.text! }), receipts: origin.receipts };
  }

  const beloved = romancePad(state, !!opts.romance)?.find((c) => chipKey(c) === chipKey(action));
  if (beloved) {
    const name = beloved.replace(/^Tell /, '').replace(/ how you feel$/, '');
    const k = name.toLowerCase();
    const npcMemories = (state.npcMemories ?? []).some((m) => m.npcName.toLowerCase() === k)
      ? (state.npcMemories ?? []).map((m) => (m.npcName.toLowerCase() === k ? { ...m, disposition: 'romanced' as const, lastSeenTurn: state.turn } : m))
      : [...(state.npcMemories ?? []), { npcId: k, npcName: name, disposition: 'romanced' as const, facts: [], lastSeenTurn: state.turn }];
    return {
      state: recordChoice({ ...state, npcMemories }, { kind: 'romance', npc: name, text: `You told ${name} how you feel, and ${name} feels the same.` }),
      receipts: [`Romance: ${name} returns your feelings.`],
    };
  }

  const route = openRouteView(state, action)?.routeByLabel ?? null;
  if (route) {
    // Chip alone is not the tick (RC-QT1): contact/place/check routes need their engine outcome.
    // Approach / person / standing / skill / system / study / check: success is the committed pick when
    // the route does not demand a separate place or Friendly contact gate.
    if (route.kind === 'place' || route.kind === 'object') {
      const need = (route.placeId ?? '').trim();
      if (need && !atPlace(state, need)) {
        return applyQuestRouteOutcome(state, route.id, 'failure');
      }
    }
    if (route.kind === 'contact') {
      if (!contactsHere(state).length) {
        return applyQuestRouteOutcome(state, route.id, 'failure');
      }
    }
    const hit = applyQuestRouteOutcome(state, route.id, 'success');
    return {
      state: recordChoice(hit.state, {
        kind: 'decision',
        text: `${openMainStep(state)?.quest.name ?? 'Quest'}: ${route.label}`,
      }),
      receipts: hit.receipts,
    };
  }

  const contact = contactFromInput(state, action);
  if (contact) {
    const open = openMainStep(state)!;
    const ticked = tickNextStep(state.quests ?? [], open.quest.id)!;
    const r = shiftStoredRelationship(state.arcDirector?.npcRelationships, contact, { trust: CONTACT_FAVOUR_TRUST, familiarity: 1 }, state.turn ?? 0, 'favor');
    next = { ...state, quests: ticked.quests, arcDirector: { ...(state.arcDirector ?? {}), npcRelationships: r.list } } as GameState;
    next = recordChoice(next, { kind: 'decision', npc: contact, text: `${open.quest.name}: ${ticked.step} — you called on ${contact}.` });
    return { state: next, receipts: [`Quest stage: ${open.quest.name} — ${ticked.step} (through ${contact})`] };
  }

  const stance = detectStanceTreatment(action);
  const target = stance === 'kind' || stance === 'hard' ? stanceTarget(state, action) : null;
  if (target) {
    const key = target.toLowerCase();
    const before = (state.npcMemories ?? []).find((m) => m.npcName.toLowerCase() === key)?.disposition ?? 'unknown';
    const pool = (state.npcMemories ?? []).some((m) => m.npcName.toLowerCase() === key)
      ? state.npcMemories ?? []
      : [...(state.npcMemories ?? []), { npcId: key, npcName: target, disposition: 'unknown' as const, facts: [], lastSeenTurn: state.turn }];
    const npcMemories = recordNpcTreatmentFromAction(pool, `${action} ${target}`, state.turn + 1, [target]);
    const after = npcMemories.find((m) => m.npcName.toLowerCase() === key)?.disposition ?? before;
    next = { ...next, npcMemories };
    if (after !== before) {
      receipts.push(`Standing: ${target} turned ${DISPOSITION_WORD[after]} (was ${DISPOSITION_WORD[before]}) after you ${stance === 'hard' ? 'refused' : 'helped'}`);
      next = scheduleRemembered(next, target, stance === 'kind');
      next = recordChoice(next, { kind: 'deed', npc: target, text: `You ${stance === 'hard' ? 'refused' : 'helped'} ${target}.` });
      receipts.push(`Remember: ${target} will remember that.`);
    }
  }

  const quest = mainSpineQuest(next);
  const openObj = quest?.objectives?.find((o) => !o.completed);
  if (quest && openObj) {
    const place = placeForStep(next, openObj);
    // RC-QT1: placeId steps tick at that place; placeless decision chips never tick on label alone.
    const ticked = place && atPlace(next, place) ? tickNextStep(next.quests ?? [], quest.id) : null;
    if (ticked) {
      next = { ...next, quests: ticked.quests };
      receipts.push(`Quest stage: ${quest.name} — ${ticked.step} (at ${place})`);
    }
  }
  return { state: next, receipts };
}
