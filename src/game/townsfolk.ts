/**
 * Engine-made townsfolk: the first time the player reaches a place after the opening, code puts
 * 1–2 people there (name, job, sheet) and saves them with that location. They come back on a
 * revisit, count as present through their location, and so enter the REF ENUM like anyone here.
 * The opening place is the card's: it is never filled.
 */
import type { GameState, NpcMemory } from './types';
import type { CompletedEventPacket, LedgerRef, PacketBuildExtras } from './completedEventPacket';
import { formatWriterFacingEvent, prepareRetrospectiveWriterInput } from './completedEventPacket';
import { buildTalkEnvelope } from './talkEnvelope';
import { presentNpcRecords } from './npcRecords';
import { ensureNpcSheet, npcSheetWriterLine, pickNpcSheet, sheetPlaceFor, type SheetPlace } from './npcSheet';
import { createHashRng } from './seededRng';
import { recordStanceFromAction } from './npcStance';
import { commitRescueAction, seatRescueDwellers } from './dungeonRescue';
import { recordPersonaFromAction, personaStanceWriterLine, decayPlaceMoods } from './npcPersona';
import { resolveActiveCampaignBible } from './campaignSeed';
import { nameWords, pickPersonName } from './personNames';
import { ensureNpcAgenda } from './npcMemory';
import { applyCompanionOwnActions } from './companionAgency';
import { peopleHere } from './chipLegality';

/** How many generated people a place can hold. Tuning, not a measured balance pass. A camp, inn, or town keeps at least one person; a cell or road may be empty. */
export const PLACE_POPULATION: Record<SheetPlace, { min: number; max: number }> = {
  cell: { min: 0, max: 1 },
  dungeon: { min: 0, max: 0 },
  road: { min: 0, max: 1 },
  camp: { min: 1, max: 2 },
  inn: { min: 1, max: 3 },
  town: { min: 1, max: 3 },
};

export function populationFor(place: SheetPlace, rng: () => number): number {
  const band = PLACE_POPULATION[place];
  const span = band.max - band.min + 1;
  return band.min + Math.floor(rng() * span);
}

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
  const rng = createHashRng('townsfolk', state.campaignBibleId ?? '', key);
  const count = populationFor(place, rng);
  // A dungeon's rooms hold its foes and loot, not townsfolk. An empty roll adds nobody.
  if (state.activeDungeon || count === 0) return { ...state, townsfolkPlaces: [...done, key] };
  const taken = takenNames(state);
  const people: NpcMemory[] = [];
  for (let i = 0; i < count; i++) {
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
  const seeded = decayPlaceMoods(seedTownsfolkHere(seatRescueDwellers(commitRescueAction(state, playerInput).state)));
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
  let packet: CompletedEventPacket = {
    ...prepared.packet,
    ...(townsfolk.length ? { townsfolk } : {}),
    ...(stances.length ? { stances } : {}),
  };
  const spoke = packet.outcome === 'spoke' || packet.verb === 'spoke';
  if (spoke && !packet.talkContext) {
    packet = { ...packet, talkContext: buildTalkEnvelope(prepared.state, packet.playerAction, packet) };
  }
  return { state: { ...prepared.state, completedEvent: packet }, packet, writerFacing: formatWriterFacingEvent(packet) };
}
