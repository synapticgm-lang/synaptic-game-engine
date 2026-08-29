/**
 * Site-wide hook / summon-why lock — accident ↛ pawn (and reverse).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applyProseWarden } from './proseWarden';
import {
  classifyHookNature,
  detectHookContradiction,
  harvestHookIntoSceneFacts,
  lockHookFromText,
  playerMayReviseHook,
  scrubBoughtHereSlip,
  scrubHookReversals,
  seedHookLockFromPickedHook,
} from './hookLock';
import { applyCommittedNarrative } from './sceneFacts';
import { formatSceneSnapshotForPrompt } from './situationPacket';
import { buildSealedManifest, validateProseAgainstManifest } from './sealedManifest';
import { applyErrorRepairs } from './errorRepairWarden';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import type { GameState } from './types';

const JOSIE_PAWN =
  "You were bought here,' he states flatly, his voice rough, 'as a piece. A pawn for Pellane's game against the court.";

const ACCIDENT_LINE =
  'The ritual has gone awry. You have been pulled through from elsewhere — the wrong person, not the intended hero.';

function withLock(state: GameState, nature: 'accident' | 'pawn'): GameState {
  const lock = {
    nature,
    summary:
      nature === 'accident'
        ? 'pulled here by accident, not as a chosen piece'
        : 'brought here as a piece in their game',
    lockedTurn: 1,
    source: 'harvest' as const,
  };
  return {
    ...state,
    openingEstablishment: {
      pending: [],
      answers: {},
      complete: true,
      hookLock: lock,
    },
    sceneFacts: {
      crowd: 'present',
      noise: 'voices',
      present: ['a Warden'],
      props: [],
      lastBeat: '',
      updatedTurn: 1,
      hookLock: lock,
    },
  };
}

describe('playtest31a — site-wide hook why lock', () => {
  it('stamp is 2026-08-31a / 30t and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-30t').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31a').toBe(true);
  });

  it('classifies accident vs pawn from committed prose', () => {
    expect(classifyHookNature(ACCIDENT_LINE)).toBe('accident');
    expect(classifyHookNature(JOSIE_PAWN)).toBe('pawn');
    expect(classifyHookNature('You look at the cracked tiles.')).toBeNull();
  });

  it('lock accident → pawn reversal is detected and rewritten', () => {
    const lock = lockHookFromText(ACCIDENT_LINE, 1, 'harvest')!;
    expect(lock.nature).toBe('accident');
    expect(detectHookContradiction(JOSIE_PAWN, lock)).toMatch(/pawn/i);

    const rewritten = scrubHookReversals(JOSIE_PAWN, lock);
    expect(rewritten).not.toMatch(/bought here/i);
    expect(rewritten).not.toMatch(/\bas a piece\b/i);
    expect(rewritten).not.toMatch(/pawn for/i);
    expect(rewritten).toMatch(/accident|pulled here/i);

    const viaWarden = applyProseWarden(JOSIE_PAWN, { hookLock: lock });
    expect(viaWarden).not.toMatch(/pawn for Pellane/i);
    expect(viaWarden).toMatch(/pulled here by accident/i);
  });

  it('lock pawn → wrong-person-by-accident is rewritten', () => {
    const lock = lockHookFromText(JOSIE_PAWN, 1, 'harvest')!;
    expect(lock.nature).toBe('pawn');
    const accidentFlip =
      'They grabbed the wrong person by accident instead of the intended hero.';
    expect(detectHookContradiction(accidentFlip, lock)).toMatch(/accident/i);

    const rewritten = scrubHookReversals(accidentFlip, lock);
    expect(rewritten).not.toMatch(/wrong person/i);
    expect(rewritten).not.toMatch(/by accident/i);
    expect(rewritten).toMatch(/piece in their game/i);

    const viaWarden = applyProseWarden(accidentFlip, { hookLock: lock });
    expect(viaWarden).not.toMatch(/wrong person by accident/i);
  });

  it('first harvest lock wins; later pawn claim does not flip the ledger', () => {
    const first = harvestHookIntoSceneFacts(undefined, ACCIDENT_LINE, 1);
    expect(first.hookLock?.nature).toBe('accident');
    const second = harvestHookIntoSceneFacts(first, JOSIE_PAWN, 2);
    expect(second.hookLock?.nature).toBe('accident');
  });

  it('player input can revise a locked why', () => {
    expect(playerMayReviseHook('I sold myself as their pawn.')).toBe('pawn');
    const locked = harvestHookIntoSceneFacts(undefined, ACCIDENT_LINE, 1);
    const revised = harvestHookIntoSceneFacts(locked, JOSIE_PAWN, 3, 'I sold myself as their pawn.');
    expect(revised.hookLock?.nature).toBe('pawn');
    expect(revised.hookLock?.source).toBe('player');
  });

  it('applyCommittedNarrative persists hookLock; SNAPSHOT + manifest bind it', () => {
    const state = withLock(createInitialState(undefined, 'litrpg'), 'accident');
    const committed = applyCommittedNarrative(state, JOSIE_PAWN, 2);
    expect(committed.hookLock?.nature).toBe('accident');

    const snap = formatSceneSnapshotForPrompt(state);
    expect(snap).toMatch(/HOOK WHY \(BINDING\).*accident/i);

    const manifest = buildSealedManifest(state, 'Ask why I am here');
    expect(manifest.requiredFacts.some((f) => /Hook why: accident/i.test(f))).toBe(true);
    expect(manifest.forbiddenReversals.some((f) => /locked hook why \(accident\)/i.test(f))).toBe(
      true
    );
    const check = validateProseAgainstManifest(JOSIE_PAWN, manifest, state);
    expect(check.contradictions.some((c) => /pawn/i.test(c))).toBe(true);
  });

  it('festival-style hook card seeds accident; bought-here slip is optional grammar', () => {
    const card = seedHookLockFromPickedHook(
      'Why this happened: You were in the crowd. You were not the name on the rite.',
      'You were not the name on the rite — you were in the crowd. One whisper: “Wrong catch.”',
      0
    );
    expect(card?.nature).toBe('accident');
    expect(card?.source).toBe('hook-card');
    expect(scrubBoughtHereSlip('You were bought here as cargo.')).toMatch(/brought here/i);
  });

  it('Continue backfills accident from earlier GM log before a later pawn beat', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.openingEstablishment = {
      pending: [],
      answers: {},
      complete: true,
      pickedHook: 'Location: The Sevenfold Circle under bombardment\nWhy this happened: They finished the rite while the city was hit.',
    };
    state.log = [
      { id: 'g1', turn: 1, role: 'gm', content: ACCIDENT_LINE, timestamp: 1 },
      { id: 'g2', turn: 6, role: 'gm', content: JOSIE_PAWN, timestamp: 2 },
    ];
    const repaired = applyErrorRepairs(state);
    expect(repaired.state.sceneFacts?.hookLock?.nature).toBe('accident');
    expect(repaired.state.openingEstablishment?.hookLock?.nature).toBe('accident');
  });

  it('works on rpg / dnd / pyoa states, not only LitRPG', () => {
    for (const mode of ['rpg', 'dnd', 'pyoa'] as const) {
      const state = withLock(createInitialState(undefined, mode), 'accident');
      const out = applyProseWarden(JOSIE_PAWN, { hookLock: state.sceneFacts!.hookLock });
      expect(out).not.toMatch(/pawn for Pellane/i);
    }
  });
});
