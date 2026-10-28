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
import { ensureNpcSheet, npcSheetWriterLine, pickNpcSheet, sheetPlaceFor, type SheetPlace } from './npcSheet';
import { createHashRng } from './seededRng';
import { recordStanceFromAction } from './npcStance';
import { recordPersonaFromAction, personaStanceWriterLine, decayPlaceMoods } from './npcPersona';
import { resolveActiveCampaignBible } from './campaignSeed';
import { nameWords, pickPersonName } from './personNames';
import { ensureNpcAgenda } from './npcMemory';
import { applyCompanionOwnActions } from './companionAgency';
import { peopleHere } from './chipLegality';

const PEOPLE_PER_PLACE: Record<SheetPlace, number> = { cell: 1, dungeon: 0, road: 1, camp: 2, inn: 2, town: 2 };

function placeKey(place: string): string {
  return place.replace(/\s+/g, ' ').trim().toLowerCase();
}

function takenNames(state: GameState): Set<string> {
  const out = nameWords([
    ...(state.npcMemories ?? []).flatMap((m) => [m.npcName, ...(m.aliases ?? [])]),
    state.character?.name,
  ]);
  // The bible's own cast keeps its names: no townsperson shares a word of them.
  for (const npc of resolveActiveCampaignBible(state)?.keyNPCs ?? []) {
    for (const w of (npc.name ?? '').toLowerCase().split(/\s+/)) if (w.length >= 3) out.add(w);
  }
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
  // A dungeon's rooms hold its foes and loot, not townsfolk.
  if (state.activeDungeon || PEOPLE_PER_PLACE[place] === 0) return { ...state, townsfolkPlaces: [...done, key] };
  const rng = createHashRng('townsfolk', state.campaignBibleId ?? '', key);
  const taken = takenNames(state);
  const people: NpcMemory[] = [];
  for (let i = 0; i < PEOPLE_PER_PLACE[place]; i++) {
    const name = pickPersonName(rng, taken);
    if (!name) continue;
    const sheet = pickNpcSheet(name, place, { campaignId: state.campaignBibleId });
    people.push(
      ensureNpcAgenda({
        npcId: `town-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        npcName: name,
        disposition: 'unknown',
        facts: [],
        lastSeenTurn: state.turn,
        met: false,
        location: here,
        sheet,
        goal: sheet.goal,
        need: sheet.need,
        offer: sheet.offer,
        attitude: sheet.attitude,
        traits: sheet.traits,
        speechRegister: sheet.speechRegister,
      }),
    );
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

/** M5 persona manner lines for everyone here, each led by their REF ENUM token. */
export function stanceLinesHere(state: GameState, refs: LedgerRef[]): string[] {
  const out: string[] = [];
  for (const m of presentNpcRecords(state)) {
    if (!m.persona && !m.stance) continue;
    const line = personaStanceWriterLine(state, m);
    const ref = line ? refs.find((r) => r.klass !== 'place' && r.display.toLowerCase() === m.npcName.toLowerCase()) : undefined;
    if (ref) out.push(`@${ref.tok} ${line}`);
  }
  return out;
}

/**
 * The pre-writer step with the place's townsfolk seeded, this turn's stance + persona event
 * recorded, and their sheets and stances on the packet.
 */
export function prepareWriterInputWithTownsfolk(
  state: GameState,
  playerInput: string,
  extras?: PacketBuildExtras,
): { state: GameState; packet: CompletedEventPacket; writerFacing: string } {
  const seeded = decayPlaceMoods(seedTownsfolkHere(state));
  // T10AA — road walkers / harvested companions get a sheet so spoken answers have motive content
  // (seedTownsfolkHere skips journeys; harvest alone left Hale/Wenna without lines).
  let sheeted = seeded;
  for (const name of peopleHere(seeded)) {
    sheeted = ensureNpcSheet(sheeted, name, seeded.currentLocation);
  }
  const withStance = recordStanceFromAction(sheeted, playerInput, { engineResult: extras?.engineResult });
  const peopled = recordPersonaFromAction(withStance, playerInput, { engineResult: extras?.engineResult });
  // M7: companions decide own acts (refuse / disagree / act-alone) from persona + wants.
  const withCompanionActs = applyCompanionOwnActions(peopled, playerInput);
  const actEngine = (withCompanionActs.companionOwnActs ?? []).map((a) => a.detail).join(' ');
  const prepared = prepareRetrospectiveWriterInput(withCompanionActs, playerInput, {
    ...extras,
    engineResult: [extras?.engineResult, actEngine].filter(Boolean).join(' ') || extras?.engineResult,
    readerStepResults: [
      ...(extras?.readerStepResults ?? []),
      ...(withCompanionActs.companionOwnActs ?? []).map((a) => ({
        tried: playerInput,
        done: false,
        reason: a.detail,
      })),
    ],
  });
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
