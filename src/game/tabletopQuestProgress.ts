/**
 * Tabletop fix 1 — the tabletop main quest moves on from play, the way Story RPG's does (storyRpgProgress).
 * tt-build-questtargets — each step's target (the item or person it is about) is put in the world when the
 * quest is made (`questTargets`), where its anchor says the step is taken:
 * - A talk step ("Speak with Oskar at the Greyhollow Tavern") is met by talking to that person while they are here.
 * - A look step ("Examine the keep gate", "Review the map Silas spreads") finds its thing at its place, with its
 *   people there.
 * - A move step ("Follow the cart tracks toward the keep", "Escort him up the hill path") finds its thing, or
 *   meets the person it takes along, where it goes. Arriving there ticks nothing.
 * - A step inside a place is in a room of that place's dungeon card.
 * A step ticks only when the engine records the find or the meeting. A tabletop step ticks as story only and pays
 * no XP (SRD XP is monster CR).
 * q31-L1: LitRPG uses the same place + find/meet path (sandboxXp then pays quest-tick). Story RPG keeps its own
 * progress module. Matching is `actionMatchesObjective` in questTargets (RC-2).
 */
import type { GameState, Quest, QuestTarget } from './types';
import { mainSpineQuest } from './questPlay';
import { stepChip } from './choiceRanking';
import { isGiverName, talkStepPerson } from './questGiver';
import { hubsForBibleId } from './outdoorHubs';
import { resolveNpcRecord } from './npcRecords';
import { atPlace, findQuestTargets, placeQuestTarget, targetSpot } from './questTargets';
import { applyQuestRouteOutcome, openRouteView } from './questRoutes';
import { withMemoryPresentFlag } from './presentAuthority';

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

/** The step's verb decides where it is taken: with its person, at its own place, or where it goes. */
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

/**
 * The step's target, where the step is taken: the person a talk step is held with or its object names
 * ("Escort Silas up the hill path"), else the thing it acts on ("the heavy bucket").
 */
function stepTarget(state: GameState, quest: Quest, idx: number): QuestTarget | null {
  const o = quest.objectives![idx]!;
  const anchor = tabletopStepAnchor(state, quest, idx);
  const what = o.object ?? (stepChip(o) ?? o.description).replace(/^\S+\s+/, '');
  const person = anchor.kind === 'talk'
    ? anchor.people[0]
    : anchor.people.find((p) => p.split(' ').some((w) => w.length >= 4 && ` ${chipKey(what)} `.includes(` ${w.toLowerCase()} `)));
  const place = anchor.kind === 'talk' ? null : anchor.place ?? quest.location ?? null;
  if (!person && !place) return null;
  return { kind: person ? 'person' : 'item', name: person ?? what, ...(place ? { place } : {}) };
}

/** Modes whose main spine ticks by placed targets + find/meet (not Story RPG's arrival path). */
function usesTargetTicks(state: GameState): boolean {
  return state.engineMode === 'dnd' || state.engineMode === 'litrpg';
}

/** Put the targets of every open quest's open steps in the world, once, when the quest is first seen. */
export function placeTabletopQuestTargets(state: GameState): GameState {
  if (!usesTargetTicks(state)) return state;
  let next = state;
  let changed = false;
  const quests = (state.quests ?? []).map((q) => {
    if (q.status === 'completed' || q.status === 'failed' || !(q.objectives ?? []).some((o) => !o.completed && !o.target)) return q;
    const objectives = q.objectives!.map((o, idx) => {
      const target = o.completed || o.target ? null : stepTarget(next, q, idx);
      if (!target) return o;
      const placed = placeQuestTarget(next, q, o, target);
      next = placed.state;
      changed = true;
      return { ...o, target: placed.target };
    });
    return { ...q, objectives };
  });
  return changed ? { ...next, quests } : state;
}

/** Tabletop only: chip / door pads. LitRPG places and ticks without offering these chips (talk stages keep storyChip). */
function playOpen(state: GameState): Quest | null {
  if (state.engineMode !== 'dnd' || !state.openingEstablishment?.complete || state.activeEncounter) return null;
  return mainSpineQuest(state);
}

type TakeableStep = { idx: number; chip: string; door: boolean };

/**
 * The open steps whose target is here (`door`: it is in a room of this place, and the chip opens the place).
 * A quest revealed after this turn's placement is read by the target its step will be given.
 */
function takeableSteps(state: GameState): TakeableStep[] {
  const quest = playOpen(state);
  if (!quest) return [];
  return (quest.objectives ?? []).flatMap((o, idx) => {
    const chip = o.completed ? null : stepChip(o);
    const target = chip ? o.target ?? stepTarget(state, quest, idx) : null;
    const at = target ? targetSpot(state, { ...o, target }) : false;
    return chip && at ? [{ idx, chip, door: at === 'door' }] : [];
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
    return withMemoryPresentFlag({ ...m, location: here }, true);
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

/** `hereBefore` is where the player stood before this turn's move, so the person a move takes along comes too. */
export function applyTabletopQuestTurn(input: GameState, playerInput: string, hereBefore?: string): TabletopQuestTurn {
  const placed = placeTabletopQuestTargets(placeTabletopStepPeople(input));
  if (!usesTargetTicks(placed) || !placed.openingEstablishment?.complete || placed.activeEncounter) {
    return { state: placed, receipts: [] };
  }
  let forFind = placed;
  if (placed.engineMode === 'dnd') {
    const quest = playOpen(placed);
    if (!quest) return { state: placed, receipts: [] };
    forFind = takeAlong(placed, quest, hereBefore);
  }
  // T10I: person/study/contact route chips complete via the route — writer fact is the ask/chip,
  // never the place-step essay ("You check the mud…") that findQuestTargets used to attach.
  const route = openRouteView(forFind, playerInput)?.routeByLabel ?? null;
  if (
    route
    && (route.kind === 'person' || route.kind === 'study' || route.kind === 'contact' || route.kind === 'system')
  ) {
    const hit = applyQuestRouteOutcome(forFind, route.id, 'success');
    return { state: hit.state, receipts: hit.receipts };
  }
  const found = findQuestTargets(forFind, playerInput);
  return { state: found.state, receipts: found.receipts, ...(found.facts.length ? { facts: found.facts } : {}) };
}
