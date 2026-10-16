/** tt-build-camps / CR-1 — road camp is a placed dungeon card; stash uses LK-1 guarded lock + alarm. */
import type { GameState, PlaceRecord, RoadCampOutcome, RoadCampRecord, RoadEncounter } from './types';
import type { ActiveDungeonState, MapNode, SkillGate } from './mapEngine';
import { buildDungeonCard } from './dungeonCard';
import { placeIdFromName } from './places';
import { createHashRng } from './seededRng';
import { nameWords, pickPersonName } from './personNames';

const CAMP_STASH_LOCK: SkillGate = {
  skill: 'thievery', rank: 1, kind: 'guarded', dc: 18, tier: 'Journeyman',
  alarm: { spotDc: 14, disarmDc: 15, sounds: true }, tryHours: 0.2,
};

export function campAt(state: Pick<GameState, 'places'>, route: string, leg: number): PlaceRecord | undefined {
  const places = state.places ?? [];
  for (let i = 0; i < places.length; i++) {
    const p = places[i]!;
    if (p.roadCamp?.route === route && p.roadCamp.leg === leg) return p;
  }
  return undefined;
}

export function campPeople(state: Pick<GameState, 'places'>): string[] {
  const out: string[] = [];
  const places = state.places ?? [];
  for (let i = 0; i < places.length; i++) {
    const people = places[i]!.roadCamp?.people;
    if (!people) continue;
    for (let j = 0; j < people.length; j++) out.push(people[j]!);
  }
  return out;
}

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

export function stampCampStash(nodes: MapNode[]): MapNode[] {
  let best: { ni: number; li: number; grade: number } | null = null;
  for (let ni = 0; ni < nodes.length; ni++) {
    const loot = nodes[ni]!.hidden?.lootables;
    if (!loot) continue;
    for (let li = 0; li < loot.length; li++) {
      const g = loot[li]!.loot?.grade ?? 0;
      if (!best || g > best.grade) best = { ni, li, grade: g };
    }
  }
  if (!best) {
    for (let ni = 0; ni < nodes.length; ni++) {
      const mobs = nodes[ni]!.hidden?.mobs;
      if (!mobs) continue;
      for (let mi = 0; mi < mobs.length; mi++) {
        if (mobs[mi]!.role === 'miniBoss') {
          const h = nodes[ni]!.hidden!;
          const lootables = [...(h.lootables ?? [])];
          lootables.push({
            id: `${nodes[ni]!.id}_stash`,
            label: 'camp stash',
            opened: false,
            loot: { rarity: 'Common', qty: 2, grade: 2 },
            lock: { ...CAMP_STASH_LOCK },
          });
          const next = [...nodes];
          next[ni] = { ...nodes[ni]!, hidden: { ...h, lootables } };
          return next;
        }
      }
    }
    return nodes;
  }
  const next = [...nodes];
  const node = nodes[best.ni]!;
  const h = node.hidden!;
  const lootables = [...h.lootables];
  const chest = lootables[best.li]!;
  lootables[best.li] = {
    ...chest,
    label: chest.label.toLowerCase().includes('stash') ? chest.label : `camp stash (${chest.label})`,
    lock: chest.lock?.alarm ? chest.lock : { ...CAMP_STASH_LOCK, ...(chest.lock ?? {}) },
  };
  next[best.ni] = { ...node, hidden: { ...h, lootables } };
  return next;
}

export function placeRoadCamp(
  state: GameState,
  route: string,
  leg: number,
  enc: RoadEncounter
): { state: GameState; encounter: RoadEncounter } {
  const rng = createHashRng('road-camp', `${state.seed ?? ''}|${route}|${leg}`);
  const nameParts: string[] = [];
  const mems = state.npcMemories ?? [];
  for (let i = 0; i < mems.length; i++) {
    nameParts.push(mems[i]!.npcName);
    const aliases = mems[i]!.aliases ?? [];
    for (let a = 0; a < aliases.length; a++) nameParts.push(aliases[a]!);
  }
  const already = campPeople(state);
  for (let i = 0; i < already.length; i++) nameParts.push(already[i]!);
  if (state.character?.name) nameParts.push(state.character.name);
  if (enc.name) nameParts.push(enc.name);
  const taken = nameWords(nameParts);
  const leader = enc.name || pickPersonName(rng, taken) || 'the camp keeper';
  const name = `${leader}'s camp`;
  const card = buildDungeonCard(state, name);
  const people = [leader];
  const named: MapNode[] = [];
  for (let i = 0; i < card.nodes.length; i++) {
    const n = card.nodes[i]!;
    if (!n.hidden?.mobs.length) {
      named.push(n);
      continue;
    }
    const mobs = [];
    for (let m = 0; m < n.hidden.mobs.length; m++) {
      const mob = n.hidden.mobs[m]!;
      if (mob.role === 'miniBoss') {
        mobs.push({ ...mob, name: leader });
        continue;
      }
      const who = pickPersonName(rng, taken);
      if (!who) {
        mobs.push(mob);
        continue;
      }
      people.push(who);
      mobs.push({ ...mob, name: who });
    }
    named.push({ ...n, hidden: { ...n.hidden, mobs } });
  }
  const nodes = stampCampStash(named);
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
    dungeonCard: { ...card, nodes } as ActiveDungeonState,
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

export function recordCampOutcome(state: GameState, placeId: string, outcome: RoadCampOutcome): GameState {
  const places = state.places ?? [];
  let place: PlaceRecord | undefined;
  for (let i = 0; i < places.length; i++) {
    if (places[i]!.id === placeId) {
      place = places[i];
      break;
    }
  }
  const c = place?.roadCamp;
  if (!place || !c || c.outcome === 'cleared') return state;
  let card = place.dungeonCard;
  if (outcome === 'cleared' && card) {
    const nodes: MapNode[] = [];
    for (let i = 0; i < card.nodes.length; i++) {
      const n = card.nodes[i]!;
      if (!n.hidden) {
        nodes.push(n);
        continue;
      }
      const mobs = [];
      for (let m = 0; m < n.hidden.mobs.length; m++) {
        mobs.push({ ...n.hidden.mobs[m]!, defeated: true, hpRemaining: null });
      }
      nodes.push({ ...n, hidden: { ...n.hidden, mobs } });
    }
    card = { ...card, nodes };
  }
  const next: PlaceRecord = {
    ...place,
    roadCamp: { ...c, outcome, outcomeTurn: state.turn },
    arcStatus: outcome === 'cleared' ? 'cleared' : 'visited',
    lastVisitedTurn: state.turn,
    ...(card ? { dungeonCard: card } : {}),
  };
  const out: PlaceRecord[] = [];
  for (let i = 0; i < places.length; i++) {
    out.push(places[i]!.id === placeId ? next : places[i]!);
  }
  return { ...state, places: out };
}

const HEADCOUNT_WORD = ['no one', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

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

export function campMemoryFact(e: RoadEncounter): string {
  const m = e.camp?.memory;
  return m ? MEMORY_FACT[m] : '';
}
