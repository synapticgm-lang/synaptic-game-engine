/**
 * Tabletop fix 1 — the tabletop main quest moves on from play, the way Story RPG's does (storyRpgProgress):
 * - A step heard from a named person ("Speak with Oskar at the Greyhollow Tavern") ticks only when the
 *   player talks to that person while they are here.
 * - A step that names a known place ("Examine the keep gate") is offered as its own chip at that place and
 *   ticks when the player takes it there.
 * Any open step can be taken: doing the gate first does not pay for a talk never had. Quest XP then pays on
 * the objective diff (sandboxXp), as for any step. Other modes are untouched.
 */
import type { GameState, Quest } from './types';
import { mainSpineQuest } from './questPlay';
import { objectiveChip } from './choiceRanking';
import { peopleHere } from './chipLegality';
import { isGiverName, talkStepPerson } from './questGiver';
import { hubsForBibleId } from './outdoorHubs';

export type TabletopQuestTurn = { state: GameState; receipts: string[] };

const chipKey = (s: string) => (s ?? '').replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim().toLowerCase();
const bare = (s: string) => chipKey(s).replace(/^the\s+/, '');

/** The known place a step names by its whole name ("Examine the keep gate" → Keep Gate), if any. */
export function tabletopStepPlace(state: GameState, step: string): string | null {
  const text = ` ${chipKey(step).replace(/[^a-z0-9' ]+/g, ' ')} `;
  const names = [...hubsForBibleId(state.campaignBibleId).map((h) => h.name), ...(state.places ?? []).map((p) => p.name)]
    .filter((n) => bare(n ?? '').length >= 4)
    .sort((a, b) => b.length - a.length);
  return names.find((n) => text.includes(` ${bare(n)} `)) ?? null;
}

function atPlace(state: GameState, place: string): boolean {
  const here = bare(state.currentLocation ?? '');
  const p = bare(place);
  return !!here && (here === p || here.includes(p));
}

function playOpen(state: GameState): Quest | null {
  if (state.engineMode !== 'dnd' || !state.openingEstablishment?.complete || state.activeEncounter) return null;
  return mainSpineQuest(state);
}

/** The open step a person here or this place lets the player take now, with its chip. */
function takeableSteps(state: GameState): Array<{ idx: number; chip: string; person: string | null }> {
  const quest = playOpen(state);
  if (!quest) return [];
  const here = peopleHere(state);
  const out: Array<{ idx: number; chip: string; person: string | null }> = [];
  (quest.objectives ?? []).forEach((o, idx) => {
    if (o.completed) return;
    const chip = objectiveChip(o.description);
    if (!chip) return;
    const person = talkStepPerson(o.description);
    if (person) {
      if (here.some((n) => isGiverName(n, person))) out.push({ idx, chip, person });
      return;
    }
    const place = tabletopStepPlace(state, o.description);
    if (place && atPlace(state, place)) out.push({ idx, chip, person: null });
  });
  return out;
}

/** Tabletop: the chip for the quest step the player can take here, or null. */
export function tabletopStepChip(state: GameState): string | null {
  return takeableSteps(state)[0]?.chip ?? null;
}

const TALK_VERB = /\b(?:talk|speak|ask|tell|greet|approach|question|listen)\b/i;

export function applyTabletopQuestTurn(state: GameState, playerInput: string): TabletopQuestTurn {
  const quest = playOpen(state);
  if (!quest) return { state, receipts: [] };
  const action = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  const said = chipKey(action);
  const taken = takeableSteps(state).find(
    (s) => said === chipKey(s.chip) || (!!s.person && TALK_VERB.test(action) && said.includes(bare(s.person)))
  );
  if (!taken) return { state, receipts: [] };
  const objectives = (quest.objectives ?? []).map((o, i) => (i === taken.idx ? { ...o, completed: true } : o));
  const done = objectives.every((o) => o.completed || o.optional);
  const quests = (state.quests ?? []).map((q) =>
    q.id === quest.id ? { ...q, objectives, ...(done ? { status: 'completed' as const } : {}) } : q
  );
  return { state: { ...state, quests }, receipts: [`Quest stage: ${quest.name} — ${taken.chip}`] };
}
