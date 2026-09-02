/**
 * 2026-09-02d — Fate hang / CAST state-shape debug.
 * Proves: countPlayerIntentStreak is not the hang; 02c CAST does not stuff
 * objects into log/present; legal engine pads survive invented-context filter.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  coerceLogContent,
  countPlayerIntentStreak,
  countLoiterFamilyStreak,
} from './beatFingerprint';
import { buildEntityCast } from './entityCast';
import { formatHubArrivalForPrompt, resolveHubArrival } from './hubEncounters';
import { runArcDirectorBeforeGm } from './arcDirector';
import { filterInventedContextChoices } from './choiceWarden';
import { isLegalEnginePad, choiceNamesUnnarratedObject } from './choicePipeline';
import { resolveOfferedChoices } from './playTranscript';
import { formatSceneSnapshotForPrompt } from './situationPacket';
import type { GameState, LogEntry } from './types';

function findCycles(obj: unknown, path = 'root', stack = new Set<object>()): string[] {
  if (obj === null || typeof obj !== 'object') return [];
  if (stack.has(obj)) return [path];
  stack.add(obj);
  const hits: string[] = [];
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => hits.push(...findCycles(v, `${path}[${i}]`, stack)));
  } else {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      hits.push(...findCycles(v, `${path}.${k}`, stack));
    }
  }
  stack.delete(obj);
  return hits;
}

function hubCastState(): GameState {
  const state = createInitialState('The Summoned Pact', 'litrpg');
  state.campaignBibleId = 'summoned-pact';
  state.currentLocation = 'Lowmarket';
  state.openingEstablishment = {
    ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
    complete: true,
    pending: [],
  };
  state.sceneFacts = {
    crowd: 'present',
    noise: 'voices',
    present: ['Lowmarket Fence'],
    props: ['stall', 'awning'],
    lastBeat: 'fence signals from a side stall',
    updatedTurn: 4,
    indoor: false,
  };
  state.turn = 4;
  const log: LogEntry[] = [];
  for (let t = 1; t <= 4; t++) {
    log.push({
      id: `p${t}`,
      turn: t,
      role: 'player',
      content: t % 2 ? 'Look around' : 'Ask a direct question',
      timestamp: t,
    });
    log.push({
      id: `g${t}`,
      turn: t,
      role: 'gm',
      content: 'Stalls, scales, and Earth junk under awnings. A fence watches the alley.',
      timestamp: t,
    });
  }
  state.log = log;
  state.choices = [
    'Ask a direct question',
    'Travel toward The Weighing Cup',
    'Check Status',
    'Call out to a bystander',
    'Press the attack',
    'Leave through the nearest exit',
    'Inspect the crystals breaking the street',
  ];
  return state;
}

describe('playtest02d hang debug — CAST / log / choice pad', () => {
  it('02c CAST is prompt-only: no objects in present[] or log, no cycles', () => {
    const state = hubCastState();
    const cast = buildEntityCast(state);
    expect(cast).toContain('<CAST>');
    // Hub-role compounds in present[] must be CAST-named (not only when the arrival beat is social).
    expect(cast).toContain('Lowmarket Fence');
    expect(cast).toContain('</CAST>');

    const arrival = resolveHubArrival(state, 'Lowmarket');
    expect(arrival?.hub.name).toMatch(/Lowmarket/i);
    const rail = formatHubArrivalForPrompt(state);
    expect(rail).toMatch(/see CAST for identity|HUB VIGNETTE|HUB ARRIVAL/);
    expect(rail).not.toMatch(/Contact=Lowmarket Fence/);

    expect(state.sceneFacts?.present?.every((p) => typeof p === 'string')).toBe(true);
    expect(state.log.every((e) => typeof e.content === 'string')).toBe(true);
    expect(findCycles(state)).toEqual([]);
    expect(() => JSON.stringify({ log: state.log, present: state.sceneFacts?.present, cast })).not.toThrow();
  });

  it('countPlayerIntentStreak is O(n) and ignores non-string log content', () => {
    const state = hubCastState();
    const t0 = Date.now();
    const streak = countPlayerIntentStreak(state);
    expect(Date.now() - t0).toBeLessThan(50);
    expect(streak.count).toBeGreaterThanOrEqual(1);

    const poisoned = {
      log: [
        { role: 'player', content: { leak: state } as unknown as string },
        { role: 'gm', content: 'ok' },
        { role: 'player', content: 'Wait and watch' },
      ],
    };
    expect(coerceLogContent(poisoned.log[0].content)).toBe('');
    const poisonedStreak = countPlayerIntentStreak(poisoned);
    expect(poisonedStreak.key).toBe('wait_watch');
    expect(poisonedStreak.count).toBe(1);
    expect(countLoiterFamilyStreak(poisoned).count).toBe(1);
  });

  it('runArcDirectorBeforeGm + snapshot + resolveOfferedChoices finish quickly', () => {
    const state = hubCastState();
    const t0 = Date.now();
    const arc = runArcDirectorBeforeGm(state, 'Ask a direct question');
    expect(arc.state).toBeTruthy();
    const snap = formatSceneSnapshotForPrompt(arc.state);
    expect(snap).toContain('<CAST>');
    expect(snap).toContain('Lowmarket Fence');
    const pads = resolveOfferedChoices(arc.state);
    expect(pads.length).toBeGreaterThanOrEqual(1);
    expect(Date.now() - t0).toBeLessThan(500);
  });

  it('legal engine pads are not invented-context; crystals still are', () => {
    const state = hubCastState();
    expect(isLegalEnginePad('Ask a direct question')).toBe(true);
    expect(isLegalEnginePad('Travel toward The Weighing Cup')).toBe(true);
    expect(isLegalEnginePad('Check Status')).toBe(true);
    expect(isLegalEnginePad('Inspect the crystals breaking the street')).toBe(false);

    const story = state.log[state.log.length - 1]!.content;
    expect(choiceNamesUnnarratedObject('Ask a direct question', story, state)).toBe(false);
    expect(choiceNamesUnnarratedObject('Travel toward The Weighing Cup', story, state)).toBe(false);
    expect(choiceNamesUnnarratedObject('Inspect the crystals breaking the street', story, state)).toBe(true);

    const filtered = filterInventedContextChoices(state.choices, state);
    expect(filtered).toContain('Ask a direct question');
    expect(filtered).toContain('Travel toward The Weighing Cup');
    expect(filtered).toContain('Check Status');
    expect(filtered).not.toContain('Inspect the crystals breaking the street');
  });
});
