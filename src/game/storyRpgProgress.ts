/**
 * Mode lap 3 — Story RPG runs on people and deeds, not on LitRPG progression.
 *
 * Before the writer, a Story RPG turn commits two things the engine can see:
 * - Standing: helping or refusing a named person here moves how they stand with the player
 *   (npcMemories disposition), and the change is a world fact the writer must carry.
 * - Quest step: the main quest's next open step ticks when the player is at the place that step
 *   names ("Scout the caravan" at Consul Caravan Camp). A step that names no place is a decision
 *   ("Pick an approach"): it is offered as its own chip and ticks only when the player takes it.
 *   Beat timing, travel and talk never tick it.
 * - They'll remember: a standing change schedules a delayed consequence (scheduleDelayedConsequence). The
 *   arcDirector delivery pays it off on the first due turn that person is present again: a hidden trust shift
 *   on their relationship record and a "Remembered" beat. The choice itself gets a "will remember that" cue.
 * - Ending: once a main quest is finished the shared ending gates (pyoaEndingGates + rpgEndings) offer
 *   RPG_ENDING_CHIP; taking it commits the best eligible ending and the run ends.
 * Other modes are untouched.
 */
import type { GameState, NpcMemory, Quest } from './types';
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

export type StoryRpgTurn = { state: GameState; receipts: string[] };

const STEP_STOP = new Set(['about', 'after', 'again', 'their', 'there', 'where', 'which', 'while', 'before', 'night', 'score']);

function contentWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]{5,}/g) ?? []).filter((w) => !STEP_STOP.has(w));
}

/** The known place a quest step names by a shared word ("Scout the caravan" → Consul Caravan Camp), if any. */
export function placeForStep(state: GameState, step: string): string | null {
  const words = contentWords(step);
  if (!words.length) return null;
  for (const p of state.places ?? []) {
    const name = (p.name ?? '').trim();
    const nameWords = new Set(contentWords(name));
    if (name && words.some((w) => nameWords.has(w))) return name;
  }
  return null;
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

/** Story RPG: the main quest's open decision step (one that names no place) as the chip that takes it. */
export function storyRpgDecisionChip(state: GameState): string | null {
  if (state.engineMode !== 'rpg' || !state.openingEstablishment?.complete || state.activeEncounter) return null;
  const quest = mainSpineQuest(state);
  const open = quest?.objectives?.find((o) => !o.completed)?.description ?? '';
  if (!open || placeForStep(state, open)) return null;
  return objectiveChip(open);
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

/** Story RPG: the ending chip, offered once the shared ending gates have an eligible ending. */
export function rpgEndingChip(state: GameState): string | null {
  if (state.engineMode !== 'rpg' || !state.openingEstablishment?.complete || state.activeEncounter || isPlayInputLocked(state)) return null;
  return selectBestEnding((state.campaignBibleId ?? '') as BibleId, state) ? RPG_ENDING_CHIP : null;
}

export function applyStoryRpgTurn(state: GameState, playerInput: string): StoryRpgTurn {
  if (state.engineMode !== 'rpg' || !state.openingEstablishment?.complete) return { state, receipts: [] };
  const action = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  const receipts: string[] = [];
  let next = state;

  if (chipKey(action) === chipKey(RPG_ENDING_CHIP) && rpgEndingChip(state)) {
    const ending = selectBestEnding((state.campaignBibleId ?? '') as BibleId, state)!;
    const done = commitEnding(ending, state);
    return { state: done.state, receipts: [`Ending: ${ending.name} — ${ending.terminalText}`] };
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
      receipts.push(`Remember: ${target} will remember that.`);
    }
  }

  const quest = mainSpineQuest(next);
  const open = quest?.objectives?.find((o) => !o.completed)?.description ?? '';
  if (quest && open) {
    const place = placeForStep(next, open);
    const decision = place ? null : storyRpgDecisionChip(state);
    const done = place ? atPlace(next, place) : !!decision && chipKey(action) === chipKey(decision);
    const ticked = done ? tickNextStep(next.quests ?? [], quest.id) : null;
    if (ticked) {
      next = { ...next, quests: ticked.quests };
      receipts.push(`Quest stage: ${quest.name} — ${ticked.step}${place ? ` (at ${place})` : ''}`);
    }
  }
  return { state: next, receipts };
}
