import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { compileChoices } from './choiceCompiler';
import { padChoicesToCount } from './choicePipeline';
import { affordancesCoverGenerics } from './sceneAffordances';
import { HUNT_WILDS_CHIP } from './choiceRanking';
import type { GameState } from './types';

const REL = 'scripts/fate-autoplay/runs/2026-11-02T14-14-29-289Z_summoned-pact_cold-system_s7301/snapshot.json';

function open6SnapshotPath(): string {
  for (const root of [process.cwd(), resolve(__dirname, '../..')]) {
    const p = resolve(root, REL);
    if (existsSync(p)) return p;
  }
  throw new Error(`OPEN6 snapshot is not in the untracked runs directory (${REL})`);
}

describe('OPEN6 root cause proof', () => {
  const snap = JSON.parse(readFileSync(open6SnapshotPath(), 'utf8')).state as GameState;
  const state = {
    ...snap,
    currentLocation: 'Kitchen Saint Alley',
    openingEstablishment: { ...(snap.openingEstablishment as object), complete: true },
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    offeredPad: null,
    choices: ['Look around', 'Wait', 'Ask what they want', 'Travel toward Contract Hall', 'Say something…'],
  } as GameState;

  it('OPEN5 miss gate: affordancesCoverGenerics is true on the crowded alley', () => {
    expect(affordancesCoverGenerics(state)).toBe(true);
  });

  it('OPEN6 fix: padChoicesToCount keeps Hunt when affordances cover', () => {
    const compiled = compileChoices(state, state.choices!);
    expect(compiled.choices.includes(HUNT_WILDS_CHIP)).toBe(true);
    const padded = padChoicesToCount(compiled.choices, state, 'Jax stood in the alley.', 3, 'Look around');
    expect(padded.includes(HUNT_WILDS_CHIP), `padded=${JSON.stringify(padded.slice(0, 12))}`).toBe(true);
  });
});
