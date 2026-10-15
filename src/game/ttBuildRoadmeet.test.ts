/**
 * tt-build-roadmeet — (1) the writer model on fate-autoplay records is the id gm-turn reported; (2a) a rolled road
 * meeting gets a seeded name and a one-line description, reaches the writer as an EVENT in the ENGINE RESULT, and is
 * never a person present (not in sceneFacts.present, not a REF ENUM person row, not harvested).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket } from './completedEventPacket';
import { servedWriterModel } from './fateAutoplay';
import { harvestNarrativePeople } from './narrativeHarvest';
import { formatInfoSheet } from './infoSheet';
import { commitTravel, roadMeetingFact, roadMeetingRef } from './travelJourney';
import { PLEA_HELP } from './rules/travelDay';
import type { GameState, RoadEncounter } from './types';

function keepState(seed: string): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    seed,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow Inn',
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
  };
}

/** The first started trip (from seed `${tag}-i`) whose live meeting is of one of these kinds. */
function tripWith(tag: string, kinds: RoadEncounter['kind'][]): GameState {
  for (let i = 0; i < 1000; i++) {
    const s = commitTravel(keepState(`${tag}-${i}`), 'Travel toward Keep Gate').state;
    const j = s.journey;
    if (j?.encounter && kinds.includes(j.encounter.kind) && j.legsDone < j.legsTotal) return s;
  }
  throw new Error(`no ${kinds.join('/')} meeting in 1000 seeds`);
}

describe('tt-build-roadmeet item 1: served writer model', () => {
  it('records the model id the server returned, in first-seen order; null when none came back', () => {
    const id = 'accounts/fireworks/models/deepseek-v4p1-flash';
    expect(servedWriterModel([{ writerUsage: { modelId: id } }, { writerUsage: { modelId: id } }] as never)).toBe(id);
    expect(servedWriterModel([{ writerUsage: { modelId: 'a' } }, {}, { writerUsage: { modelId: 'b' } }] as never)).toBe('a, b');
    expect(servedWriterModel([{}, { writerUsage: {} }] as never)).toBeNull();
  });
});

describe('tt-build-roadmeet 2a: road meetings are named events', () => {
  it('a people meeting gets a seeded name and look, the same for the same trip', () => {
    const a = tripWith('rm-named', ['traveler', 'meeting', 'thugs', 'villain', 'camp']);
    const e = a.journey!.encounter!;
    expect(e.name).toMatch(/^[A-Z][a-z'’-]+ [A-Z][a-z'’-]+$/);
    expect(e.about ?? '').not.toBe('');
    const again = commitTravel(keepState(a.seed!), 'Travel toward Keep Gate').state.journey!.encounter!;
    expect(again.name).toBe(e.name);
    expect(again.about).toBe(e.about);
  });

  it('a plea person is named and described from their own plea', () => {
    const s = tripWith('rm-plea', ['plea']);
    const e = s.journey!.encounter!;
    const who = PLEA_HELP[e.want ?? '']?.who;
    expect(who).toBeTruthy();
    expect(e.name).toBeTruthy();
    expect(e.about).toBe(`${who}, who ${e.want!.slice(who!.length + 1)}`);
    expect(roadMeetingFact(s.journey)).toContain(`the road brings ${e.name}, ${who}, who `);
  });

  it('the meeting is an event in the ENGINE RESULT and a meeting row, never a person present', () => {
    const s = tripWith('rm-packet', ['traveler', 'meeting', 'thugs', 'villain', 'plea']);
    const name = s.journey!.encounter!.name!;
    const packet = buildCompletedEventPacket(s, 'Wait and watch', { engineResult: 'Travel: on the forest path.' });
    expect(packet.engineResult ?? '').toMatch(/^Travel: on the forest path\.\nEvent on this stretch: the road brings /);
    expect(packet.engineResult ?? '').toContain(name);
    expect(packet.movement ?? '').not.toMatch(/Event on this stretch|road brings/);
    const rows = packet.refEnum ?? [];
    expect(rows.find((r) => r.display === name)?.klass).toBe('meeting');
    expect(rows.some((r) => r.klass === 'person' && r.display === name)).toBe(false);
    expect(roadMeetingRef(s)?.display).toBe(name);
    expect(s.sceneFacts?.present ?? []).not.toContain(name);
    expect(formatInfoSheet(s)).toMatch(/a meeting on the road/);
    expect(formatInfoSheet(s)).not.toMatch(new RegExp(`^- ${name}`, 'm'));
  });

  it('a page that names the meeting does not make them someone present', () => {
    const s = tripWith('rm-harvest', ['traveler', 'meeting', 'villain', 'plea']);
    const name = s.journey!.encounter!.name!;
    const packet = buildCompletedEventPacket(s, 'Wait and watch');
    const row = (packet.refEnum ?? []).find((r) => r.display === name)!;
    const prose = `${name} raised a hand from the verge. "Fair road," ${name} said.`;
    const out = harvestNarrativePeople(s, prose, s.turn ?? 1, { refs: [{ tok: row.tok, id: row.id, use: 'speaker' }], refEnum: packet.refEnum });
    expect(out.people).not.toContain(name);
    expect(out.state.sceneFacts?.present ?? []).not.toContain(name);
  });
});
