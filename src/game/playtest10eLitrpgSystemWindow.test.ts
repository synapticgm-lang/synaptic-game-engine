/**
 * 2026-09-10e — LitRPG System window when the blue panel is in play.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { createInitialState } from './defaults';
import {
  buildLitrpgSystemWindow,
  playerAskedAboutSystemPanel,
  playerLockedNameThisLine,
  shouldAttachLitrpgSystemWindow,
  storyMentionsSystemPanel,
  withLitrpgSystemWindow,
} from './litrpgSystemWindow';
import { BUILD_STAMP } from './runManifest';
import { emptySceneFacts } from './sceneFacts';
import type { GameState, LogEntry } from './types';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';

const useGame = readFileSync(resolve(__dirname, './useGame.ts'), 'utf8');
const center = readFileSync(resolve(__dirname, '../components/CenterPanel.tsx'), 'utf8');
const narrative = readFileSync(resolve(__dirname, '../components/NarrativeView.tsx'), 'utf8');

function summoned(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    character: { ...base.character, name: 'Unknown Survivor', hp: 20, maxHp: 20, mp: 10, maxMp: 10, level: 1 },
    openingEstablishment: {
      pending: [{ id: 'name', kind: 'name', question: 'What is yours?' }],
      answers: { where: 'a ritual hall' },
      complete: false,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
    },
    sceneFacts: emptySceneFacts(0),
    log: [],
    ...over,
  };
}

const PAGE1 =
  'You wake on stone. A blue panel hangs at eye level — private, yours. Priests wait.';

function gm(over: Partial<LogEntry> = {}): LogEntry {
  return {
    id: 'g1',
    turn: 0,
    role: 'gm',
    content: PAGE1,
    timestamp: 1,
    systemLog: ['Registration incomplete', 'Stamp: Pactborn / Calamity Mark — unresolved'],
    ...over,
  };
}

describe('playtest10e — LitRPG System window', () => {
  it('HUD/BUILD stay on the 10 line, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-10/);
    expect(BUILD_STAMP).toMatch(/^2026-09-10/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('detects panel mention, inspect, and name-lock', () => {
    expect(storyMentionsSystemPanel(PAGE1)).toBe(true);
    expect(playerAskedAboutSystemPanel("What's the blue screen i can see?")).toBe(true);
    expect(playerAskedAboutSystemPanel('Inspect the System panel')).toBe(true);
    expect(playerAskedAboutSystemPanel('Where am I?')).toBe(false);
    expect(playerLockedNameThisLine('My name is Jax whats yours then')).toBe(true);
    expect(playerLockedNameThisLine('Where am I?')).toBe(false);
  });

  it('first LitRPG page builds an unregistered SYSTEM plate', () => {
    const win = buildLitrpgSystemWindow(summoned());
    expect(win?.heading).toBe('SYSTEM');
    expect(win?.lines.some((l) => /^Name: —$/.test(l))).toBe(true);
    expect(win?.lines.some((l) => /Registration: incomplete/.test(l))).toBe(true);
    expect(win?.lines.some((l) => /Pactborn/.test(l))).toBe(true);
    expect(win?.lines.some((l) => /HP 20 \/ 20/.test(l))).toBe(true);
  });

  it('name-lock writes the designation and does not show on tabletop', () => {
    const named = summoned({
      character: { ...summoned().character, name: 'Jax' },
      openingEstablishment: {
        ...summoned().openingEstablishment!,
        answers: { where: 'a ritual hall', name: 'Jax' },
        pending: [],
        complete: true,
      },
    });
    const win = buildLitrpgSystemWindow(named);
    expect(win?.lines.some((l) => l === 'Name: Jax')).toBe(true);
    expect(win?.lines.some((l) => /designation locked/.test(l))).toBe(true);

    const tabletop = summoned({ engineMode: 'dnd' });
    expect(buildLitrpgSystemWindow(tabletop)).toBeNull();
    expect(shouldAttachLitrpgSystemWindow({ state: tabletop, story: PAGE1 })).toBe(false);
  });

  it('attaches on first page and panel ask, not on later where-only', () => {
    const fresh = summoned();
    expect(shouldAttachLitrpgSystemWindow({ state: fresh, story: PAGE1 })).toBe(true);

    const mid = summoned({
      log: [gm()],
    });
    expect(shouldAttachLitrpgSystemWindow({ state: mid, playerInput: 'Where am I?' })).toBe(false);
    expect(
      shouldAttachLitrpgSystemWindow({
        state: mid,
        playerInput: "What's the blue screen i can see?",
      })
    ).toBe(true);
    expect(
      shouldAttachLitrpgSystemWindow({
        state: mid,
        systemLog: ['Level Up! You are now Level 2'],
      })
    ).toBe(true);
  });

  it('moves opening ping out of STATUS when the window attaches', () => {
    const attached = withLitrpgSystemWindow(gm(), summoned());
    expect(attached.systemWindow?.heading).toBe('SYSTEM');
    expect(attached.systemLog ?? []).not.toContain('Registration incomplete');
  });

  it('useGame and both story views own the window', () => {
    expect(useGame).toContain('withLitrpgSystemWindow');
    expect(center).toContain('LitrpgSystemWindowPanel');
    expect(narrative).toContain('LitrpgSystemWindowPanel');
  });
});
