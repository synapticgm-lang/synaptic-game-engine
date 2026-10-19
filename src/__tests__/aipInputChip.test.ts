/**
 * Free-input chips open the action box and do not send a turn.
 * The harness decides from before/after page snapshots, never from chip labels.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

async function load(rel: string) {
  return import(/* @vite-ignore */ pathToFileURL(resolve(rel)).href);
}

const idle = {
  busy: false,
  turnInFlight: false,
  playerLines: ['Jax'],
  gmStoryCount: 1,
  inputFocused: false,
  inputVisible: true,
  inputEnabled: true,
};

describe('aip input chip: page state after a chip click', () => {
  it('returns input_opened when the box became focused or visible and no turn was sent', async () => {
    const { classifyChipClick } = await load('scripts/ai-player-browser/inputChip.mjs');
    expect(classifyChipClick({
      before: idle,
      after: { ...idle, inputFocused: true },
    })).toBe('input_opened');
    expect(classifyChipClick({
      before: { ...idle, inputVisible: false },
      after: { ...idle, inputVisible: true },
    })).toBe('input_opened');
    expect(classifyChipClick({
      before: idle,
      after: { ...idle }, // free-input chip: game only sets pendingFreeInput; box stays visible + enabled, no turn
    })).toBe('input_opened');
  });

  it('returns turn_sent when a busy flag or a new player or GM row appeared', async () => {
    const { classifyChipClick } = await load('scripts/ai-player-browser/inputChip.mjs');
    expect(classifyChipClick({
      before: idle,
      after: { ...idle, busy: true, inputFocused: true },
    })).toBe('turn_sent');
    expect(classifyChipClick({
      before: idle,
      after: { ...idle, turnInFlight: true },
    })).toBe('turn_sent');
    expect(classifyChipClick({
      before: idle,
      after: { ...idle, playerLines: ['Jax', 'I look around.'] },
    })).toBe('turn_sent');
    expect(classifyChipClick({
      before: idle,
      after: { ...idle, gmStoryCount: 2 },
    })).toBe('turn_sent');
  });

  it('returns nothing when the click neither sent a turn nor opened the input', async () => {
    const { classifyChipClick } = await load('scripts/ai-player-browser/inputChip.mjs');
    expect(classifyChipClick({ before: idle, after: { ...idle, inputEnabled: false } })).toBe('nothing');
    expect(classifyChipClick({
      before: { ...idle, inputVisible: false },
      after: { ...idle, inputVisible: false },
    })).toBe('nothing');
  });

  it('run.mjs types in the same turn after an input_opened chip', () => {
    const src = readFileSync(resolve('scripts/ai-player-browser/run.mjs'), 'utf8');
    const opened = src.indexOf("chipEffect === 'input_opened'");
    const typed = src.indexOf('typePlayerAction(gamePage, line)', opened);
    const marked = src.indexOf("kind = 'chip_then_type'", opened);
    const waited = src.indexOf('waitNewGmBeat(', opened);
    expect(opened).toBeGreaterThan(0);
    expect(typed).toBeGreaterThan(opened);
    expect(marked).toBeGreaterThan(typed);
    expect(waited).toBeGreaterThan(marked);
    expect(src.slice(opened, typed)).toContain('naturalTypedFallback');
    expect(src.slice(opened, typed)).toContain('modelLineIfDistinct');
  });
});
