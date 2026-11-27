/**
 * Chips must use the same turnUiBlocked gate as the free-text input.
 * During streaming reveal, busy is already false; chips that only key on busy
 * stay clickable and sendAction toasts then drops the pick (PR #66 finding).
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActionBar } from './ActionBar';
import { createInitialState } from '@/game/defaults';
import { isTurnUiBlocked } from '@/game/streamReveal';
import type { GameState } from '@/game/types';

function stateWithLookChip(): GameState {
  const state = createInitialState('Reveal chip gate', 'litrpg', undefined, 'reveal-chip');
  state.turn = 5;
  state.openingEstablishment = {
    ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
    complete: true,
    sceneWritten: true,
  };
  state.offeredPad = {
    turn: 5,
    choices: ['Look around', 'Wait', 'Ask what they want', 'Inspect the room'],
  };
  return state;
}

function choiceButtons(html: string): { label: string; disabled: boolean }[] {
  const out: { label: string; disabled: boolean }[] = [];
  const re = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    const label = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!label || /Fate/i.test(label)) continue;
    // Real HTML disabled attr only — not Tailwind `disabled:opacity-40` class names.
    const disabled = /(?:^|\s)disabled(?:=["'][^"']*["'])?(?=\s|>|$)/.test(attrs);
    out.push({ label, disabled });
  }
  return out;
}

describe('ActionBar chips during reveal', () => {
  it('turnUiBlocked is true mid-reveal even when busy is false', () => {
    const reveal = {
      entryId: 'gm-1',
      fullText: 'You reach the West Wall. Wind cuts the stone.',
      visibleText: 'You reach the West Wall.',
      done: false,
    };
    expect(isTurnUiBlocked(false, 'revealing', reveal)).toBe(true);
    expect(isTurnUiBlocked(false, 'idle', null)).toBe(false);
  });

  it('Look around chip disables when parent passes turnUiBlocked, stays open on busy-only false', () => {
    const state = stateWithLookChip();
    const reveal = {
      entryId: 'gm-1',
      fullText: 'You reach the West Wall. Wind cuts the stone.',
      visibleText: 'You reach the West Wall.',
      done: false,
    };
    const turnUiBlocked = isTurnUiBlocked(false, 'revealing', reveal);

    const openHtml = renderToStaticMarkup(
      createElement(ActionBar, { state, busy: false, onAction: () => {}, engineMode: 'litrpg' }),
    );
    const lookOpen = choiceButtons(openHtml).find((b) => b.label === 'Look around');
    expect(lookOpen, 'chip present when idle').toBeTruthy();
    expect(lookOpen!.disabled).toBe(false);

    const blockedHtml = renderToStaticMarkup(
      createElement(ActionBar, {
        state,
        busy: turnUiBlocked,
        onAction: () => {},
        engineMode: 'litrpg',
      }),
    );
    const lookBlocked = choiceButtons(blockedHtml).find((b) => b.label === 'Look around');
    expect(lookBlocked, 'chip present when blocked').toBeTruthy();
    expect(lookBlocked!.disabled).toBe(true);
  });
});
