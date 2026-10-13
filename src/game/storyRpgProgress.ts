/**
 * Mode lap 3 — Story RPG runs on people and deeds, not on LitRPG progression.
 *
 * Before the writer, a Story RPG turn commits two things the engine can see:
 * - Standing: helping or refusing a named person here moves how they stand with the player
 *   (npcMemories disposition), and the change is a world fact the writer must carry.
 * - Quest step: the main quest's next open step ticks when the player is at the place that step
 *   names ("Scout the caravan" at Consul Caravan Camp), or, for a step that names no place, when the
 *   player makes a decision (a stance toward a named person) or a Story RPG arc decision beat commits.
 * Other modes are untouched.
 */
import type { GameState, NpcMemory, Quest } from './types';
import { detectStanceTreatment } from './factionStandings';
import { recordNpcTreatmentFromAction } from './npcMemory';
import { presentNpcNames } from './npcRelationships';
import { mainSpineQuest } from './questPlay';
import { contractById } from './beatContract';

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

export function applyStoryRpgTurn(
  state: GameState,
  playerInput: string,
  opts: { committedBeatsBefore?: readonly string[] } = {}
): StoryRpgTurn {
  if (state.engineMode !== 'rpg' || !state.openingEstablishment?.complete) return { state, receipts: [] };
  const action = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  const receipts: string[] = [];
  let next = state;

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
    }
  }

  const quest = mainSpineQuest(next);
  const open = quest?.objectives?.find((o) => !o.completed)?.description ?? '';
  if (quest && open) {
    const place = placeForStep(next, open);
    const beforeBeats = new Set(opts.committedBeatsBefore ?? []);
    const decisionBeat = (next.arcDirector?.committedBeatIds ?? []).some(
      (id) => !beforeBeats.has(id) && contractById(id)?.biblePrefix === 'cape-district-vigil' && contractById(id)?.kind === 'quest_stage'
    );
    const done = place ? atPlace(next, place) : !!target || decisionBeat;
    const ticked = done ? tickNextStep(next.quests ?? [], quest.id) : null;
    if (ticked) {
      next = { ...next, quests: ticked.quests };
      receipts.push(`Quest stage: ${quest.name} — ${ticked.step}${place ? ` (at ${place})` : ''}`);
    }
  }
  return { state: next, receipts };
}
