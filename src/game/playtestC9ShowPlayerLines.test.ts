/**
 * C9 — Show/hide player typed lines in the story feed (UI only).
 */
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createDefaultSettings } from './defaults';
import {
  ShowPlayerLinesTipModal,
  isShowPlayerLinesTipDismissed,
  setShowPlayerLinesTipDismissed,
} from '../components/ShowPlayerLinesTipModal';

const settingsModal = readFileSync(resolve(__dirname, '../components/SettingsModal.tsx'), 'utf8');
const centerPanel = readFileSync(resolve(__dirname, '../components/CenterPanel.tsx'), 'utf8');
const narrativeView = readFileSync(resolve(__dirname, '../components/NarrativeView.tsx'), 'utf8');
const comicGrid = readFileSync(resolve(__dirname, '../components/comic/ComicGrid.tsx'), 'utf8');
const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

describe('playtestC9 — show/hide player typed lines', () => {
  it('defaults OFF (player lines hidden) and persists via Settings', () => {
    expect(createDefaultSettings().showPlayerLines).toBe(false);
    expect(settingsModal).toContain("label=\"Show my typed lines\"");
    expect(settingsModal).toContain("update('showPlayerLines', v)");
  });

  it('classic, narrative, and comic feeds gate player bubbles on showPlayerLines', () => {
    expect(centerPanel).toContain('showPlayerLines = false');
    expect(centerPanel).toContain("(!showPlayerLines && entry.role === 'player')");
    expect(narrativeView).toContain('showPlayerLines = false');
    expect(narrativeView).toContain("(!showPlayerLines && entry.role === 'player')");
    expect(comicGrid).toContain('showPlayerLines = false');
    expect(comicGrid).toContain("!showPlayerLines && entry.role === 'player'");
  });

  it('first-turn tip uses the existing tip modal pattern and can enable the setting', () => {
    expect(app).toContain('ShowPlayerLinesTipModal');
    expect(app).toContain('isShowPlayerLinesTipDismissed');
    expect(app).toContain('(game.state.turn ?? 0) < 1');

    const html = renderToStaticMarkup(
      createElement(ShowPlayerLinesTipModal, {
        showPlayerLines: false,
        onEnableShow: () => {},
        onDismiss: () => {},
      }),
    );
    expect(html).toContain('Your lines stay off the feed');
    expect(html).toContain('Settings');
    expect(html).toMatch(/data-dismiss/);
    expect(html).toContain('Show my lines');
    expect(html).toContain('Got it');
  });

  it('tip dismiss helpers write the one-time localStorage flag', () => {
    const key = 'synapticgm-show-player-lines-tip-dismissed';
    try {
      localStorage.removeItem(key);
    } catch {
      /* jsdom may lack storage in some runners — skip write assert then */
    }
    if (typeof localStorage === 'undefined') return;
    expect(isShowPlayerLinesTipDismissed()).toBe(false);
    setShowPlayerLinesTipDismissed();
    expect(isShowPlayerLinesTipDismissed()).toBe(true);
    localStorage.removeItem(key);
  });
});
