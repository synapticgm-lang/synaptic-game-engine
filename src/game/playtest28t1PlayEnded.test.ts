/** 28t1 — an accepted spine ending ends play: no pads, and Fate stops offering turns. */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { advancePyoaSpine, ensurePyoaSpine } from './pyoaSpine';
import { resolveOfferedChoices } from './playTranscript';
import { buildNewGameState, runFateAutoplay, stampOpening } from './fateAutoplay';
import type { GameState } from './types';

function acceptedThornferry(): GameState {
  let state: GameState = {
    ...createInitialState(),
    engineMode: 'pyoa',
    campaignBibleId: 'thornferry-road',
    playPhase: 'live',
  };
  state = ensurePyoaSpine(state);
  state = {
    ...state,
    pyoaSpine: {
      ...state.pyoaSpine!,
      endingId: 'thornferry:mill-kept',
      currentNodeId: 'tf-end-mill-wren',
      flags: { ...(state.pyoaSpine?.flags ?? {}), resolution: 'mill' },
    },
    choices: ['Choose the risky fork', 'Face the crisis now', 'Inspect the immediate surroundings'],
  };
  return advancePyoaSpine(state, 'Accept the ending that follows');
}

describe('28t1 — accepted spine ending ends play', () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  it('accepting the ending sets playPhase ended', () => {
    expect(acceptedThornferry().playPhase).toBe('ended');
  });

  it('leftover crisis pads close once play has ended', () => {
    const ended = acceptedThornferry();
    expect(resolveOfferedChoices(ended)).toEqual([]);
  });

  it('Fate stops before taking a turn on an ended run', async () => {
    const g = globalThis as { localStorage?: Storage };
    if (!g.localStorage) {
      const store = new Map<string, string>();
      g.localStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, String(v)),
        removeItem: (k: string) => void store.delete(k),
        clear: () => store.clear(),
        key: (i: number) => [...store.keys()][i] ?? null,
        get length() {
          return store.size;
        },
      };
    }
    const { state: raw } = buildNewGameState({
      bibleId: 'thornferry-road',
      characterName: 'Jax',
      seed: 57,
      personality: 'cold-system',
    });
    const opened = stampOpening(raw);
    const ended: GameState = { ...opened, playPhase: 'ended' };
    const resumeDir = mkdtempSync(join(tmpdir(), 'sgm28t1-'));
    const outRoot = mkdtempSync(join(tmpdir(), 'sgm28t1-out-'));
    dirs.push(resumeDir, outRoot);
    writeFileSync(join(resumeDir, 'snapshot.json'), JSON.stringify({ loopIndex: 3, state: ended }));
    const summary = await runFateAutoplay({
      turns: 10,
      seed: 57,
      bibleId: 'thornferry-road',
      personality: 'cold-system',
      aiTier: 'free',
      mode: 'fate',
      dryRun: true,
      outRoot,
      characterName: 'Jax',
      resumeFrom: resumeDir,
    });
    expect(summary.completedTurns).toBe(0);
  }, 60_000);
});
