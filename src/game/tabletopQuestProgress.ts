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
import { objectiveStepChip } from './choiceRanking';
import { peopleHere } from './chipLegality';
import { isGiverName, talkStepPerson } from './questGiver';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { resolveNpcRecord } from './npcRecords';

export type TabletopQuestTurn = { state: GameState; receipts: string[] };

const chipKey = (s: string) => (s ?? '').replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim().toLowerCase();
const bare = (s: string) => chipKey(s).replace(/^the\s+/, '');

/**
 * The known place a step names by its whole name or a hub's own alias ("Examine the keep gate" → Keep Gate,
 * "at the Greyhollow Tavern" → Greyhollow Inn), if any.
 */
export function tabletopStepPlace(state: GameState, step: string): string | null {
  const text = ` ${chipKey(step).replace(/[^a-z0-9' ]+/g, ' ')} `;
  const names: Array<[string, string]> = [
    ...hubsForBibleId(state.campaignBibleId).flatMap((h) =>
      [h.name, ...(h.aliases ?? [])].map((n): [string, string] => [n, h.name])
    ),
    ...(state.places ?? []).map((p): [string, string] => [p.name, p.name]),
  ]
    .filter(([n]) => bare(n ?? '').length >= 4)
    .sort((a, b) => b[0].length - a[0].length);
  return names.find(([n]) => text.includes(` ${bare(n)} `))?.[1] ?? null;
}

/**
 * Tabletop: the person a main-quest talk step is heard from lives at the place the step names
 * ("Speak with Oskar at the Greyhollow Tavern"). Their record is put there, so arriving there finds them.
 */
export function placeTabletopStepPeople(state: GameState): GameState {
  if (state.engineMode !== 'dnd') return state;
  const quest = mainSpineQuest(state);
  if (!quest) return state;
  let memories = state.npcMemories ?? [];
  let changed = false;
  for (const o of quest.objectives ?? []) {
    if (o.completed) continue;
    const person = talkStepPerson(o.description);
    const place = person ? o.place ?? tabletopStepPlace(state, o.description) : null;
    if (!person || !place) continue;
    const hit = resolveNpcRecord({ ...state, npcMemories: memories }, person);
    if (hit) {
      if (!hit.location) {
        memories = memories.map((m) => (m.npcId === hit.npcId ? { ...m, location: place } : m));
        changed = true;
      }
      continue;
    }
    memories = [
      {
        npcId: `step-${person.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`,
        npcName: person,
        disposition: 'neutral',
        facts: [`Quest step: ${quest.name}`],
        lastSeenTurn: 0,
        roleHint: 'quest-patron',
        aliases: [],
        met: false,
        present: false,
        location: place,
      },
      ...memories,
    ];
    changed = true;
  }
  return changed ? { ...state, npcMemories: memories } : state;
}

/** Where a step is taken: its own anchor, else a place its wording names, else a one-step quest's own place. */
export function tabletopStepAnchor(
  state: GameState,
  quest: Quest,
  idx: number
): { place: string | null; people: string[] } {
  const o = quest.objectives?.[idx];
  if (!o) return { place: null, people: [] };
  const person = talkStepPerson(o.description);
  const people = o.people?.length ? o.people : person ? [person] : [];
  if (people.length) return { place: null, people };
  const single = (quest.objectives ?? []).length === 1 ? quest.location ?? null : null;
  return { place: o.place ?? tabletopStepPlace(state, o.description) ?? single, people: [] };
}

function atPlace(state: GameState, place: string): boolean {
  const hubs = hubsForBibleId(state.campaignBibleId);
  const name = (s: string) => bare(matchHub(hubs, s)?.name ?? s);
  const here = name(state.currentLocation ?? '');
  const p = name(place);
  return !!here && !!p && (here === p || here.includes(p));
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
    const chip = objectiveStepChip(o.description);
    if (!chip) return;
    const anchor = tabletopStepAnchor(state, quest, idx);
    if (anchor.people.length) {
      const person = anchor.people.find((p) => here.some((n) => isGiverName(n, p)));
      if (person) out.push({ idx, chip, person });
      return;
    }
    if (anchor.place && atPlace(state, anchor.place)) out.push({ idx, chip, person: null });
  });
  return out;
}

/** Tabletop: the chip for the quest step the player can take here, or null. */
export function tabletopStepChip(state: GameState): string | null {
  return takeableSteps(state)[0]?.chip ?? null;
}

const TALK_VERB = /\b(?:talk|speak|ask|tell|greet|approach|question|listen)\b/i;

export function applyTabletopQuestTurn(input: GameState, playerInput: string): TabletopQuestTurn {
  const state = placeTabletopStepPeople(input);
  const quest = playOpen(state);
  if (!quest) return { state, receipts: [] };
  const action = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  const said = chipKey(action);
  const taken = takeableSteps(state).find(
    (s) =>
      said === chipKey(s.chip)
      || (!!s.person
        && TALK_VERB.test(action)
        && (said.includes(bare(s.person)) || peopleHere(state).some((n) => isGiverName(n, s.person!) && said.includes(bare(n)))))
  );
  if (!taken) return { state, receipts: [] };
  const objectives = (quest.objectives ?? []).map((o, i) => (i === taken.idx ? { ...o, completed: true } : o));
  const done = objectives.every((o) => o.completed || o.optional);
  const quests = (state.quests ?? []).map((q) =>
    q.id === quest.id ? { ...q, objectives, ...(done ? { status: 'completed' as const } : {}) } : q
  );
  return { state: { ...state, quests }, receipts: [`Quest stage: ${quest.name} — ${taken.chip}`] };
}
