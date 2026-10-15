/**
 * tt-build-camps (John, 15 Oct, build 2b) — a road camp is a place, not a passing roll. The first camp rolled on a
 * route stretch is placed once on the save like a dungeon: the dungeon card generator builds its rooms (one per tent),
 * a person in each room, the leader in the leader's tent and its chests (the loot). Every later pass of that stretch,
 * either way, meets the same camp, and the camp remembers what the player did there.
 */
import type { GameState, PlaceRecord, RoadCampOutcome, RoadCampRecord, RoadEncounter } from './types';
import { buildDungeonCard } from './dungeonCard';
import { placeIdFromName } from './places';
import { createHashRng } from './seededRng';
import { nameWords, pickPersonName } from './personNames';

/** The camp placed on this route leg, if any. */
export function campAt(state: Pick<GameState, 'places'>, route: string, leg: number): PlaceRecord | undefined {
  return (state.places ?? []).find((p) => p.roadCamp?.route === route && p.roadCamp.leg === leg);
}

/** Every person already living in a placed camp (a new name never shares a word with them). */
export function campPeople(state: Pick<GameState, 'places'>): string[] {
  return (state.places ?? []).flatMap((p) => p.roadCamp?.people ?? []);
}

/** The meeting for a placed camp on this pass; null once the camp is cleared (nobody is left to meet). */
export function campEncounter(place: PlaceRecord, at: Pick<RoadEncounter, 'stretch' | 'dangerous'> & Partial<RoadEncounter>): RoadEncounter | null {
  const c = place.roadCamp;
  if (!c || c.outcome === 'cleared') return null;
  return {
    kind: 'camp',
    level: c.level,
    stretch: at.stretch,
    dangerous: at.dangerous,
    name: c.leader,
    ...(c.miniBoss ? { miniBoss: true } : {}),
    ...(c.about ? { about: c.about } : {}),
    ...(c.want ? { want: c.want } : {}),
    ...(at.distanceFt ? { distanceFt: at.distanceFt } : {}),
    camp: { placeId: place.id, headcount: c.people.length, ...(c.outcome ? { memory: c.outcome } : {}) },
  };
}

/**
 * Place a freshly rolled camp on its route leg: name it after its leader, build its card with the dungeon generator,
 * and put one engine-named person in each room the card gave a foe (the leader in the boss room).
 */
export function placeRoadCamp(
  state: GameState,
  route: string,
  leg: number,
  enc: RoadEncounter
): { state: GameState; encounter: RoadEncounter } {
  const rng = createHashRng('road-camp', `${state.seed ?? ''}|${route}|${leg}`);
  const taken = nameWords([
    ...(state.npcMemories ?? []).flatMap((m) => [m.npcName, ...(m.aliases ?? [])]),
    ...campPeople(state),
    state.character?.name,
    enc.name,
  ]);
  const leader = enc.name || pickPersonName(rng, taken) || 'the camp keeper';
  const name = `${leader}'s camp`;
  const card = buildDungeonCard(state, name);
  const people = [leader];
  const nodes = card.nodes.map((n) => {
    if (!n.hidden?.mobs.length) return n;
    const mobs = n.hidden.mobs.map((m) => {
      if (m.role === 'miniBoss') return { ...m, name: leader };
      const who = pickPersonName(rng, taken);
      if (!who) return m;
      people.push(who);
      return { ...m, name: who };
    });
    return { ...n, hidden: { ...n.hidden, mobs } };
  });
  const roadCamp: RoadCampRecord = {
    route,
    leg,
    leader,
    people,
    miniBoss: !!enc.miniBoss,
    level: enc.level,
    ...(enc.about ? { about: enc.about } : {}),
    ...(enc.want ? { want: enc.want } : {}),
  };
  const place: PlaceRecord = {
    id: placeIdFromName(name),
    name,
    allowsDungeon: true,
    dungeonRef: card.dungeonName,
    dungeonCard: { ...card, nodes },
    arcStatus: 'open',
    mapScale: 'street',
    lastVisitedTurn: state.turn,
    ...(state.worldAtlas?.currentRegionId ? { regionId: state.worldAtlas.currentRegionId } : {}),
    roadCamp,
  };
  return {
    state: { ...state, places: [...(state.places ?? []), place] },
    encounter: { ...enc, name: leader, camp: { placeId: place.id, headcount: people.length } },
  };
}

/** Remember what the player did at the camp. Cleared is final: its people are down on the card and nobody is met again. */
export function recordCampOutcome(state: GameState, placeId: string, outcome: RoadCampOutcome): GameState {
  const place = (state.places ?? []).find((p) => p.id === placeId);
  const c = place?.roadCamp;
  if (!place || !c || c.outcome === 'cleared') return state;
  const card = outcome === 'cleared' && place.dungeonCard
    ? {
        ...place.dungeonCard,
        nodes: place.dungeonCard.nodes.map((n) =>
          n.hidden ? { ...n, hidden: { ...n.hidden, mobs: n.hidden.mobs.map((m) => ({ ...m, defeated: true, hpRemaining: null })) } } : n
        ),
      }
    : place.dungeonCard;
  const next: PlaceRecord = {
    ...place,
    roadCamp: { ...c, outcome, outcomeTurn: state.turn },
    arcStatus: outcome === 'cleared' ? 'cleared' : 'visited',
    lastVisitedTurn: state.turn,
    ...(card ? { dungeonCard: card } : {}),
  };
  return { ...state, places: (state.places ?? []).map((p) => (p.id === placeId ? next : p)) };
}

const HEADCOUNT_WORD = ['no one', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

/** "a camp of six" — the engine's headcount as the writer and STATUS print it. */
export function campHeadcount(e: RoadEncounter): string {
  const n = e.camp?.headcount;
  return n ? ` of ${HEADCOUNT_WORD[n] ?? n}` : '';
}

const MEMORY_FACT: Record<RoadCampOutcome, string> = {
  cleared: '',
  parleyed: 'This is the camp the player talked with before, and its people remember it.',
  robbed: 'This is the camp the player robbed before, and its people remember it.',
  fled: 'This is the camp the player got away from before, and its people remember it.',
};

/** What a returning camp remembers, as one writer sentence ('' on a first meeting). */
export function campMemoryFact(e: RoadEncounter): string {
  const m = e.camp?.memory;
  return m ? MEMORY_FACT[m] : '';
}
