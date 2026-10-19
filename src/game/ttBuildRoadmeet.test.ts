/**
 * tt-build-roadmeet — (1) the writer model on fate-autoplay records is the id gm-turn reported; (2a) a rolled road
 * meeting gets a seeded name and a one-line description, reaches the writer as an EVENT in the ENGINE RESULT.
 * q72r4 — while the meeting runs they are PRESENT (voice allowlist); they are not harvested into sceneFacts.present
 * as a lasting place person, and on arrival the meeting ENDS (stays on the road).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket } from './completedEventPacket';
import { servedWriterModel } from './fateAutoplay';
import { harvestNarrativePeople } from './narrativeHarvest';
import { formatSceneBlock } from './sceneBlock';
import { peopleHere } from './chipLegality';
import { presentNpcRecords } from './npcRecords';
import { writerDraftProblems, type DraftCheck } from './writerTurn';
import { parsePlayerIntent } from './intentParser';
import { commitTravel, roadMeetingFact, roadMeetingRef } from './travelJourney';
import { PLEA_HELP } from './rules/travelDay';
import { checkPlayCrimes } from './turnCheck';
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

  it('the meeting is EVENT+PRESENT while live; ends on arrival; voice rejected, mention allowed', () => {
    let s = tripWith('rm-packet', ['traveler', 'meeting']);
    const name = s.journey!.encounter!.name!;
    const packet = buildCompletedEventPacket(s, 'Wait and watch', { engineResult: 'Travel: on the forest path.' });
    expect(packet.engineResult ?? '').toMatch(/^Travel: on the forest path\.\nEvent on this stretch: the road brings /);
    expect(packet.refEnum?.find((r) => r.display === name)?.klass).toBe('meeting');
    expect(roadMeetingRef(s)?.display).toBe(name);
    expect(s.sceneFacts?.present ?? []).not.toContain(name);
    expect(presentNpcRecords(s).some((m) => m.npcName === name) && peopleHere(s).includes(name)).toBe(true);
    const scene = formatSceneBlock(s);
    expect(scene).toContain(`EVENT: ${name} (meeting on the road)`);
    expect(scene).toContain('Only PRESENT people and the live road EVENT may speak');
    expect(scene.match(/^PRESENT:.*$/m)?.[0] ?? '').not.toContain(name);
    const dest = s.journey!.to;
    for (let i = 0; i < 8 && s.journey; i++) s = commitTravel(s, 'Walk on').state;
    expect(s.currentLocation === dest && !presentNpcRecords(s).some((m) => m.npcName === name)).toBe(true);
    const voiced = `${name} said, "Fair road." The hall was quiet.`;
    const mentioned = `${name} was still on the road behind. The hall was quiet.`;
    expect(checkPlayCrimes(s, s, 'Walk on', voiced).p0.some((f) => f.kind === 'absent-speaker')).toBe(true);
    expect(checkPlayCrimes(s, s, 'Walk on', mentioned).p0.some((f) => f.kind === 'absent-speaker')).toBe(false);
    const check: DraftCheck = { state: s, playerInput: 'Walk on', intent: parsePlayerIntent('Walk on', s), engineFact: `Arrived at ${dest}.`, previousGm: '' };
    expect(writerDraftProblems(voiced, check).some((p) => p.startsWith('Absent speaker:'))).toBe(true);
    expect(writerDraftProblems(mentioned, check).some((p) => p.startsWith('Absent speaker:'))).toBe(false);
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
