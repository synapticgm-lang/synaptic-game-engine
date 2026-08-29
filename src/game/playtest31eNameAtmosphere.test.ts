/**
 * Deny-list PC names + same-room atmosphere reprint (John 6d8e0b1f).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applyOpeningAnswer, extractGivenName } from './openingEstablishment';
import { applyErrorRepairs, CURRENT_ERROR_REPAIR_REVISION } from './errorRepairWarden';
import { applyGovernanceToProse } from './qualityGovernance';
import { displayAdventurerName, isDeniedPcName, isLockablePcName } from './pcNameAuthority';
import { detectAtmosphereReprint, isAtmosphereOnlyBeat } from './semanticLoopDetector';
import { formatSceneSnapshotForPrompt } from './situationPacket';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import type { GameState, LogEntry, OpeningEstablishment } from './types';
import type { OpeningPrompt } from '@/data/campaigns/types';

const NAME_COVER: OpeningPrompt[] = [
  { id: 'name', kind: 'name', question: 'A name. What do we call you?' },
];

const BEAT_T11 =
  'The dust motes dance in the slivers of light that pierce the gloom as you step forward, crossing the threshold into the next chamber. Your eyes scan the debris-strewn floor, the scattered remnants of what might have been furniture or perhaps just more rubble from the building\'s collapse. The air hangs heavy with the scent of damp earth and decay, a familiar perfume in this damaged world. There\'s no glint of treasure, no obvious signs of recent activity, just the quiet, mournful testament to destruction. You note no "kill" to loot, just the ambient silence.';

const BEAT_T12 =
  'The air in the room is thick with the scent of damp earth and decay, a cloying perfume that clings to your clothes. Dust motes dance in the thin shafts of light that pierce the gloom from unseen cracks above, illuminating scattered debris across the floor. What might have once been furniture or structural support lies in broken heaps, testament to the building\'s catastrophic state. As you survey the scene, the silence presses in, broken only by the faint, distant groan of stressed timbers. There\'s no immediate glint of treasure, no obvious signs of disturbance beyond the general ruin.';

function summonedNameCover(): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    character: { ...base.character, name: 'Unknown Survivor' },
    openingEstablishment: {
      pending: NAME_COVER,
      answers: {},
      complete: false,
      registrar: { voice: 'inworld', label: 'THE CIRCLE', startLine: 'Light, then stone.' },
      sceneWritten: true,
      mode: 'weave',
    } as OpeningEstablishment,
  };
}

function gm(id: string, turn: number, content: string): LogEntry {
  return { id, turn, role: 'gm', content, timestamp: turn };
}

describe('playtest31e — deny-list names + atmosphere delta', () => {
  it('stamp is 2026-08-31e / 30x and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-30x').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31e').toBe(true);
    expect(CURRENT_ERROR_REPAIR_REVISION).toBeGreaterThanOrEqual(6);
  });

  it.each(['here', 'Here', 'Place', 'you', 'You', 'wait', 'system', 'panel', 'n/a'])(
    'rejects %s as a PC name',
    (token) => {
      expect(isDeniedPcName(token)).toBe(true);
      expect(isLockablePcName(token)).toBe(false);
      expect(extractGivenName(token)).toBeNull();
      expect(extractGivenName(`why I'm ${token}`)).toBeNull();
      expect(displayAdventurerName(token)).toBe('Unknown Survivor');
    }
  );

  it('still locks a real given name', () => {
    expect(extractGivenName('my name is Jax')).toBe('Jax');
    expect(extractGivenName('Josie')).toBe('Josie');
    expect(isLockablePcName('Josie')).toBe(true);
    expect(displayAdventurerName('Josie')).toBe('Josie');
  });

  it('does not harvest Here from “why I\'m here”', async () => {
    const result = await applyOpeningAnswer(
      summonedNameCover(),
      'If there is nothing else in this room that I can make use of then move to the next room and investigate that room as well looking again for anything of use or information about why I\'m here or where I am'
    );
    expect(result.deferToPlay).toBe(true);
    expect(result.state.character.name).toBe('Unknown Survivor');
    expect(result.state.openingEstablishment?.pending[0]?.kind).toBe('name');
    const gmLine = [...result.state.log].reverse().find((e) => e.role === 'gm')?.content ?? '';
    expect(gmLine).not.toMatch(/They are still waiting for a name you will own/i);
  });

  it('does not lock i. Here as a name cover', async () => {
    const result = await applyOpeningAnswer(summonedNameCover(), 'If there nothing of use i. Here');
    expect(result.deferToPlay).toBe(true);
    expect(result.state.character.name).toBe('Unknown Survivor');
  });

  it('Continue repair clears a deny-list character.name', () => {
    const state = summonedNameCover();
    state.character = { ...state.character, name: 'Here' };
    state.openingEstablishment = {
      ...state.openingEstablishment!,
      answers: { name: 'Here' },
    };
    const repaired = applyErrorRepairs(state);
    expect(repaired.dirty).toBe(true);
    expect(repaired.state.character.name).toBe('Unknown Survivor');
    expect(repaired.state.openingEstablishment?.answers?.name).toBeUndefined();
    expect(repaired.notes.some((n) => n.code === 'ERR_DENIED_PC_NAME')).toBe(true);
  });

  it('treats atmosphere-only second look-around as recycle', () => {
    expect(isAtmosphereOnlyBeat(BEAT_T12)).toBe(true);
    expect(detectAtmosphereReprint(BEAT_T12, [BEAT_T11])).toBe(true);
    const state = createInitialState('Pact', 'litrpg');
    state.turn = 12;
    state.log = [gm('g11', 11, BEAT_T11)];
    const { rejectClone, notes } = applyGovernanceToProse(state, BEAT_T12, 'Examine the room');
    expect(rejectClone).toBe(true);
    expect(notes.some((n) => /atmosphere reprint/i.test(n))).toBe(true);
  });

  it('SNAPSHOT asks for a beat delta after look-around', () => {
    const state = createInitialState('Pact', 'litrpg');
    state.log = [{ id: 'p', turn: 11, role: 'player', content: 'Examine the room', timestamp: 1 }];
    const snap = formatSceneSnapshotForPrompt(state);
    expect(snap).toMatch(/BEAT DELTA:/);
    expect(snap).toMatch(/smell\/light essay/i);
  });
});
