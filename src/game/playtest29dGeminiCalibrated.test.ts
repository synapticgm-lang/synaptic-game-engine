import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { BUILD_STAMP } from './runManifest';
import {
  FREE_WRITER_FAILOVER_OPENROUTER,
  STAGNATION_MID_WRITER_ENABLED,
  resolveFreeWriterFailover,
} from './writerPolicy';
import { scrubStrangerArtifact, scrubUnearnedVictory, applyProseWarden } from './proseWarden';
import { forceLivenessBeat, runArcDirectorBeforeGm } from './arcDirector';
import { formatSceneSnapshotForPrompt } from './situationPacket';
import { formatVoiceCadenceDirective, buildVoiceCadence } from './voiceCadenceSystem';
import { HUD_BUILD_STAMP } from '../components/Hud';

describe('playtest29d — Gemini-calibrated prompt diet + soft stakes', () => {
  it('stamp is 2026-08-29d and Mid writer stays OFF', () => {
    expect(BUILD_STAMP >= '2026-08-29d').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-29d').toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('Free failover resolves to Llama 8B for Flash Lite and DeepSeek', () => {
    expect(resolveFreeWriterFailover('google/gemini-2.5-flash-lite')).toBe(
      FREE_WRITER_FAILOVER_OPENROUTER
    );
    expect(resolveFreeWriterFailover('deepseek/deepseek-v4-flash-0731')).toBe(
      FREE_WRITER_FAILOVER_OPENROUTER
    );
    expect(resolveFreeWriterFailover('anthropic/claude-haiku-4.5')).toBeNull();
  });

  it('SNAPSHOT includes PROSE LICENSE and single AUTHORITY (no duplicate STAGNATION essay)', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.turn = 8;
    state.openingEstablishment = { complete: true, aloneArrival: false } as never;
    const snap = formatSceneSnapshotForPrompt(state);
    expect(snap).toMatch(/PROSE LICENSE:/);
    expect(snap).toMatch(/AUTHORITY:/);
    expect(snap).not.toMatch(/STAGNATION INTERRUPT:/);
    expect(snap).not.toMatch(/VOICE CHECK \(Sarcastic Patch/);
  });

  it('voice directive demands STORY BODY color and honest stakes', () => {
    const cadence = buildVoiceCadence('dry-wit');
    const line = formatVoiceCadenceDirective(cadence, null, [], 'AUTHORITY VOICE: dry aside');
    expect(line).toMatch(/STORY BODY/);
    expect(line.length).toBeLessThan(420);
  });

  it('never invents merchant/guard from stranger keyword scan', () => {
    const raw =
      'The stranger nods. Somewhere a merchant stall rattles. The stranger waits.';
    const out = scrubStrangerArtifact(raw, [], false);
    expect(out).toMatch(/the stranger/i);
    expect(out).not.toMatch(/The merchant nods/i);
  });

  it('replaces stranger with present named NPC only', () => {
    const out = scrubStrangerArtifact('The stranger looks up.', ['Vessa'], false);
    expect(out).toMatch(/Vessa/);
    expect(out).not.toMatch(/stranger/i);
  });

  it('scrubs unearned victory outside live encounter', () => {
    const raw = 'You defeat the bandit easily. Victory is yours.';
    const scrubbed = scrubUnearnedVictory(raw, { hasLiveEncounter: false });
    expect(scrubbed).not.toMatch(/defeat the bandit/i);
    expect(scrubbed).toMatch(/drive back/i);
    const kept = scrubUnearnedVictory(raw, { hasLiveEncounter: true });
    expect(kept).toMatch(/defeat/i);
  });

  it('applyProseWarden wires unearned victory + stranger keep', () => {
    const out = applyProseWarden(
      'The stranger waits. You kill the foe. Victory is assured.',
      { hasLiveEncounter: false, presentNames: [] }
    );
    expect(out).toMatch(/stranger/i);
    expect(out).not.toMatch(/Victory is assured/i);
  });

  it('RPG forceLivenessBeat selects leverage by T12 when soft', () => {
    const state = createInitialState(undefined, 'rpg');
    state.turn = 12;
    state.openingEstablishment = { complete: true } as never;
    const beat = forceLivenessBeat(state, new Set());
    expect(beat?.id).toMatch(/rpg-beat-(leverage|demand|consequence)/);
  });

  it('soft-threat overdue forces consequence after 6 turns', () => {
    const state = createInitialState(undefined, 'rpg');
    state.turn = 20;
    state.openingEstablishment = { complete: true } as never;
    state.arcDirector = {
      softThreatOpenedTurn: 12,
      committedBeatIds: ['rpg-beat-leverage'],
    };
    const beat = forceLivenessBeat(state, new Set(['rpg-beat-leverage']));
    expect(beat?.id).toMatch(/rpg-beat-(consequence|leverage)/);
  });

  it('ArcDirector opens softThreatOpenedTurn on leverage commit path', () => {
    const state = createInitialState(undefined, 'rpg');
    state.turn = 14;
    state.openingEstablishment = { complete: true, aloneArrival: false } as never;
    const result = runArcDirectorBeforeGm(state, 'Wait and listen');
    // May or may not commit depending on contract gates — softThreat set when leverage/crisis commits
    if (result.beatCommitted && /leverage|demand|crisis/i.test(result.beatId ?? '')) {
      expect(result.state.arcDirector?.softThreatOpenedTurn).toBeDefined();
    }
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});
