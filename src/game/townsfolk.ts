/**
 * Engine-made townsfolk: the first time the player reaches a place after the opening, code puts
 * 1–2 people there (name, job, sheet) and saves them with that location. They come back on a
 * revisit, count as present through their location, and so enter the REF ENUM like anyone here.
 * The opening place is the card's: it is never filled.
 */
import type { GameState, NpcMemory } from './types';
import type { CompletedEventPacket, LedgerRef, PacketBuildExtras } from './completedEventPacket';
import { formatWriterFacingEvent, prepareRetrospectiveWriterInput } from './completedEventPacket';
import { presentNpcRecords } from './npcRecords';
import { npcSheetWriterLine, pickNpcSheet, sheetPlaceFor, type SheetPlace } from './npcSheet';
import { createHashRng } from './seededRng';
import { recordStanceFromAction, stanceWriterLine } from './npcStance';

const GIVEN = [
  'Wat', 'Hobb', 'Edda', 'Maud', 'Piers', 'Tilde', 'Osric', 'Nell', 'Bertil', 'Agna', 'Col', 'Ysolde',
  'Garth', 'Rosel', 'Dunn', 'Idra', 'Hale', 'Merrit', 'Sefa', 'Brannoc', 'Oda', 'Lisle', 'Wenna', 'Cutha',
];
const FAMILY = [
  'Pike', 'Thatch', 'Crane', 'Barrow', 'Dunmore', 'Hask', 'Wyle', 'Fenwick', 'Marl', 'Sallow', 'Cotter',
  'Rudd', 'Brack', 'Hollin', 'Tew', 'Aske', 'Merrow', 'Coyne',
];

const PEOPLE_PER_PLACE: Record<SheetPlace, number> = { cell: 1, dungeon: 1, road: 1, camp: 2, inn: 2, town: 2 };

function placeKey(place: string): string {
  return place.replace(/\s+/g, ' ').trim().toLowerCase();
}

function takenNames(state: GameState): Set<string> {
  const out = new Set<string>();
  for (const m of state.npcMemories ?? []) {
    for (const n of [m.npcName, ...(m.aliases ?? [])]) {
      const words = n.toLowerCase().split(/\s+/);
      for (const w of words) out.add(w);
      out.add(n.toLowerCase());
    }
  }
  const pc = state.character?.name?.trim().toLowerCase();
  if (pc) out.add(pc);
  return out;
}

/**
 * First visit to a place after the opening: add its townsfolk and remember the place.
 * The first place ever seen is recorded empty — the opening card owns it.
 */
export function seedTownsfolkHere(state: GameState): GameState {
  const here = (state.currentLocation ?? '').trim();
  if (!here) return state;
  const key = placeKey(here);
  const done = state.townsfolkPlaces;
  if (!done) return { ...state, townsfolkPlaces: [key] };
  if (done.includes(key)) return state;
  // A fight or a walk between places has its own people; fill the place when the player is settled there.
  if (state.activeEncounter) return state;
  const j = state.journey;
  if (j && j.legsDone < j.legsTotal) return state;

  const place = sheetPlaceFor(here);
  const rng = createHashRng('townsfolk', state.campaignBibleId ?? '', key);
  const taken = takenNames(state);
  const people: NpcMemory[] = [];
  for (let i = 0; i < PEOPLE_PER_PLACE[place]; i++) {
    let name = '';
    for (let tries = 0; tries < 12 && !name; tries++) {
      const given = GIVEN[Math.floor(rng() * GIVEN.length)];
      const family = FAMILY[Math.floor(rng() * FAMILY.length)];
      if (taken.has(given.toLowerCase()) || taken.has(family.toLowerCase())) continue;
      name = `${given} ${family}`;
    }
    if (!name) continue;
    taken.add(name.split(' ')[0].toLowerCase());
    taken.add(name.split(' ')[1].toLowerCase());
    const sheet = pickNpcSheet(name, place, { campaignId: state.campaignBibleId });
    people.push({
      npcId: `town-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      npcName: name,
      disposition: 'unknown',
      facts: [],
      lastSeenTurn: state.turn,
      met: false,
      location: here,
      sheet,
    });
  }
  return {
    ...state,
    townsfolkPlaces: [...done, key],
    npcMemories: [...(state.npcMemories ?? []), ...people],
  };
}

/** Sheet lines for the engine-made people here, each led by the REF ENUM token the writer must use. */
export function townsfolkWriterLines(state: GameState, refs: LedgerRef[]): string[] {
  const out: string[] = [];
  for (const m of presentNpcRecords(state)) {
    if (!m.sheet) continue;
    const ref = refs.find((r) => r.klass === 'person' && r.display.toLowerCase() === m.npcName.toLowerCase());
    const line = ref ? npcSheetWriterLine(m.npcName, m.sheet) : '';
    if (line) out.push(`@${ref!.tok} ${line}`);
  }
  return out;
}

/** Stance lines for everyone here whose stance an engine event moved, each led by their REF ENUM token. */
export function stanceLinesHere(state: GameState, refs: LedgerRef[]): string[] {
  const out: string[] = [];
  for (const m of presentNpcRecords(state)) {
    const line = stanceWriterLine(m);
    const ref = line ? refs.find((r) => r.klass !== 'place' && r.display.toLowerCase() === m.npcName.toLowerCase()) : undefined;
    if (ref) out.push(`@${ref.tok} ${line}`);
  }
  return out;
}

/**
 * The pre-writer step with the place's townsfolk seeded, this turn's stance event recorded, and
 * their sheets and stances on the packet.
 */
export function prepareWriterInputWithTownsfolk(
  state: GameState,
  playerInput: string,
  extras?: PacketBuildExtras,
): { state: GameState; packet: CompletedEventPacket; writerFacing: string } {
  const peopled = recordStanceFromAction(seedTownsfolkHere(state), playerInput, { engineResult: extras?.engineResult });
  const prepared = prepareRetrospectiveWriterInput(peopled, playerInput, extras);
  const refs = prepared.packet.refEnum ?? [];
  const townsfolk = townsfolkWriterLines(prepared.state, refs);
  const stances = stanceLinesHere(prepared.state, refs);
  if (!townsfolk.length && !stances.length) return prepared;
  const packet = {
    ...prepared.packet,
    ...(townsfolk.length ? { townsfolk } : {}),
    ...(stances.length ? { stances } : {}),
  };
  return { state: { ...prepared.state, completedEvent: packet }, packet, writerFacing: formatWriterFacingEvent(packet) };
}
