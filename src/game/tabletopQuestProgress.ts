/**
 * Tabletop fix 1 — the tabletop main quest moves on from play, the way Story RPG's does (storyRpgProgress):
 * - The step's verb decides what ticks it (`tabletopStepKind`).
 * - A talk step ("Speak with Oskar at the Greyhollow Tavern") ticks only when the player talks to that person
 *   while they are here.
 * - A look step ("Examine the keep gate", "Review the map Silas spreads") is offered as its own chip at its
 *   place, with its people there, and ticks when the player takes it there.
 * - A move step ("Follow the cart tracks toward the keep", "Escort him up the hill path") ticks only when travel
 *   arrives where it goes, with the person it takes along travelling with the player.
 * Any open talk or look step can be taken: doing the gate first does not pay for a talk never had. A move step
 * ticks only once every required step before it is done. A tabletop step ticks as story only and pays no XP
 * (SRD XP is monster CR). Other modes are untouched.
 */
import type { GameState, Quest } from './types';
import { mainSpineQuest } from './questPlay';
import { stepChip } from './choiceRanking';
import { peopleHere } from './chipLegality';
import { isGiverName, talkStepPerson } from './questGiver';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { resolveNpcRecord } from './npcRecords';
import { isJourneyUnderway } from './travelJourney';

export type TabletopQuestTurn = { state: GameState; receipts: string[]; /** The step taken, as the writer's world fact. */ facts?: string[] };

const chipKey = (s: string) => (s ?? '').replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim().toLowerCase();
const bare = (s: string) => chipKey(s).replace(/^the\s+/, '');

/**
 * The known place a step names by its whole name or a hub's own alias ("Examine the keep gate" → Keep Gate,
 * "at the Greyhollow Tavern" → Greyhollow Inn), if any.
 */
export function tabletopStepPlace(state: GameState, step: string): string | null {
  // A possessive names its place: "the inn's cellar" is at the inn.
  const text = ` ${chipKey(step).replace(/['’]s\b/g, '').replace(/[^a-z0-9' ]+/g, ' ')} `;
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
  // Anyone a step is taken with (a talk step's person, a step's own people) and the quest's giver live at its place.
  const wanted: Array<[string, string | null]> = [];
  for (const o of quest.objectives ?? []) {
    if (o.completed) continue;
    const talk = talkStepPerson(o.description);
    if (talk) wanted.push([talk, o.place ?? tabletopStepPlace(state, o.description)]);
    // Someone a move takes along ("Escort Silas…") starts where the quest starts, not where the move goes.
    const from = WITH_PERSON_VERB.test(o.description) ? quest.location ?? o.place : o.place;
    if (from) for (const p of o.people ?? []) wanted.push([p, from]);
  }
  if (quest.giver) wanted.push([quest.giver, quest.location ?? null]);
  for (const [person, place] of wanted) {
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

export type TabletopStepKind = 'talk' | 'look' | 'move';

const TALK_STEP_VERB = /^\s*(?:speak|talk|report|ask|tell|warn|question|convince|persuade|meet)\b/i;
const MOVE_STEP_VERB =
  /^\s*(?:follow|escort|lead|guide|travel|go|head|return|journey|bring|take|track|trail|cross|climb|make your way)\b|\btoward(?:s)?\b/i;
/** tt-fix-7 — a step whose purpose is a move ("Investigate the sludge to track its trail up the hill") goes somewhere. */
const MOVE_STEP_PURPOSE =
  /\bto (?:follow|track|trail|reach|climb|cross)\b|\b(?:up|down|along|across) (?:the|a) (?:[\w-]+,? ){0,2}(?:hill|path|road|trail|slope|ridge|stairs?)\b/i;
/** A move that takes someone along ("Escort him…", "Lead the survivors…"): the step's person must come too. */
const WITH_PERSON_VERB = /^\s*(?:escort|lead|guide|bring|take)\b/i;

/** The step's verb decides what ticks it: talking to its person, its own look at its place, or arriving where it goes. */
export function tabletopStepKind(step: string): TabletopStepKind {
  if (talkStepPerson(step) || TALK_STEP_VERB.test(step ?? '')) return 'talk';
  if (MOVE_STEP_VERB.test(step ?? '') || MOVE_STEP_PURPOSE.test(step ?? '')) return 'move';
  return 'look';
}

/**
 * Where a step is taken. A talk step is taken with its person, wherever they are. A look step is taken at its
 * own anchor (else a place its wording names, else a one-step quest's own place), with its people there. A move
 * step is taken where it goes: the known place its wording names, else its own anchor when that is not where the
 * quest starts. A move with nowhere else to arrive is taken as a look step at its own pin, else the quest's place.
 */
export function tabletopStepAnchor(
  state: GameState,
  quest: Quest,
  idx: number
): { kind: TabletopStepKind; place: string | null; people: string[]; room?: string } {
  const o = quest.objectives?.[idx];
  if (!o) return { kind: 'look', place: null, people: [] };
  const kind = tabletopStepKind(o.description);
  const person = talkStepPerson(o.description);
  const people = o.people?.length ? o.people : person ? [person] : [];
  if (kind === 'talk' && people.length) return { kind, place: null, people };
  const named = tabletopStepPlace(state, o.description);
  const goes = named ?? (o.place && o.place !== quest.location ? o.place : null);
  if (kind === 'move' && goes) return { kind, place: goes, people };
  const single = (quest.objectives ?? []).length === 1 || kind === 'move' ? quest.location ?? null : null;
  return {
    kind: 'look',
    place: o.place ?? named ?? single,
    people,
    ...(o.room ? { room: o.room } : {}),
  };
}

function atPlace(state: GameState, place: string): boolean {
  const hubs = hubsForBibleId(state.campaignBibleId);
  const name = (s: string) => bare(matchHub(hubs, s)?.name ?? s);
  const here = name(state.currentLocation ?? '');
  const p = name(place);
  return !!here && !!p && (here === p || here.includes(p));
}

/**
 * At the step's place. A step inside it ("the keep's ground floor", "the great hall floor") is taken in a room
 * of that place ("Keep Gate — Ruined hall"), in the room its anchor names. Outside its door it is 'door': the
 * same chip is the way in, and taking it opens the place without ticking the step.
 */
function atStepPlace(state: GameState, place: string, room?: string): boolean | 'door' {
  if (!room) return atPlace(state, place);
  const [outer, inner] = (state.currentLocation ?? '').split(/\s+[—–]\s+/);
  if (!inner) return atPlace(state, place) && 'door';
  if (!outer || !atPlace({ ...state, currentLocation: outer }, place)) return false;
  return room === 'inside' || ` ${bare(inner)} `.includes(` ${room.toLowerCase()} `);
}

function playOpen(state: GameState): Quest | null {
  if (state.engineMode !== 'dnd' || !state.openingEstablishment?.complete || state.activeEncounter) return null;
  return mainSpineQuest(state);
}

type TakeableStep = { idx: number; chip: string; person: string | null; door?: boolean };

/** The open step a person here or this place lets the player take now, with its chip (`door`: it opens the place). */
function takeableSteps(state: GameState): TakeableStep[] {
  const quest = playOpen(state);
  if (!quest) return [];
  const here = peopleHere(state);
  const out: TakeableStep[] = [];
  (quest.objectives ?? []).forEach((o, idx) => {
    if (o.completed) return;
    const chip = stepChip(o);
    if (!chip) return;
    const anchor = tabletopStepAnchor(state, quest, idx);
    // A move step has no chip of its own; travel arriving where it goes ticks it.
    if (anchor.kind === 'move') return;
    const person = anchor.people.find((p) => here.some((n) => isGiverName(n, p))) ?? null;
    if (anchor.kind === 'talk') {
      if (person) out.push({ idx, chip, person });
      return;
    }
    if (anchor.people.length && !person) return;
    const at = anchor.place ? atStepPlace(state, anchor.place, anchor.room) : !!person;
    if (at) out.push({ idx, chip, person: null, door: at === 'door' });
  });
  return out;
}

/** The open move step this turn's travel completed: it arrived where the step goes, with the step's person if it takes one along. */
function arrivedMoveStep(state: GameState, quest: Quest, hereBefore: string | undefined): number {
  const here = state.currentLocation ?? '';
  if (hereBefore === undefined || !here || here === hereBefore || isJourneyUnderway(state)) return -1;
  const people = peopleHere(state);
  return (quest.objectives ?? []).findIndex((o, idx) => {
    if (o.completed || quest.objectives!.slice(0, idx).some((p) => !p.completed && !p.optional)) return false;
    const anchor = tabletopStepAnchor(state, quest, idx);
    if (anchor.kind !== 'move' || !anchor.place || !atPlace(state, anchor.place)) return false;
    if (WITH_PERSON_VERB.test(o.description) && anchor.people.length) {
      return anchor.people.some((p) => people.some((n) => isGiverName(n, p)));
    }
    return true;
  });
}

/** The person the open step takes along ("Escort Silas…") and who stood where the player left goes with the player. */
function takeAlong(state: GameState, quest: Quest, hereBefore: string | undefined): GameState {
  const here = state.currentLocation ?? '';
  const idx = (quest.objectives ?? []).findIndex((o) => !o.completed && !o.optional);
  const step = quest.objectives?.[idx];
  if (!hereBefore || !here || here === hereBefore || !step || !WITH_PERSON_VERB.test(step.description)) return state;
  const people = tabletopStepAnchor(state, quest, idx).people;
  const before = { ...state, currentLocation: hereBefore };
  let moved = false;
  const npcMemories = (state.npcMemories ?? []).map((m) => {
    if (!m.location || !atPlace(before, m.location) || !people.some((p) => isGiverName(m.npcName, p))) return m;
    moved = true;
    return { ...m, location: here, present: true };
  });
  return moved ? { ...state, npcMemories } : state;
}

/** Tabletop: the chip for the quest step the player can take here, or null. */
export function tabletopStepChip(state: GameState): string | null {
  return takeableSteps(state)[0]?.chip ?? null;
}

/** The chip is a step taken inside this place and the player stands outside its door. */
export function tabletopStepIsDoor(state: GameState, chip: string): boolean {
  return takeableSteps(state).some((s) => s.door && chipKey(s.chip) === chipKey(chip));
}

const TALK_VERB = /\b(?:talk|speak|ask|tell|greet|approach|question|listen)\b/i;

/** `hereBefore` is where the player stood before this turn's move, so a move step can tick on arrival. */
export function applyTabletopQuestTurn(input: GameState, playerInput: string, hereBefore?: string): TabletopQuestTurn {
  const placed = placeTabletopStepPeople(input);
  const quest = playOpen(placed);
  if (!quest) return { state: placed, receipts: [] };
  const state = takeAlong(placed, quest, hereBefore);
  const action = (playerInput ?? '').replace(/\s+/g, ' ').trim();
  const said = chipKey(action);
  const moved = arrivedMoveStep(state, quest, hereBefore);
  // A step inside a place is taken from inside it: the turn that walks in through its door does not tick it.
  const doorBefore = hereBefore === undefined ? [] : takeableSteps({ ...state, currentLocation: hereBefore });
  const taken =
    moved >= 0
      ? { idx: moved, chip: stepChip(quest.objectives![moved]!) ?? quest.objectives![moved]!.description }
      : takeableSteps(state).find(
          (s) =>
            (!s.door && !doorBefore.some((b) => b.door && b.idx === s.idx) && said === chipKey(s.chip))
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
  return { state: { ...state, quests }, receipts: [`Quest stage: ${quest.name} — ${taken.chip}`], facts: [`You ${objectives[taken.idx]!.description.trim().charAt(0).toLowerCase()}${objectives[taken.idx]!.description.trim().slice(1)}`] };
}
