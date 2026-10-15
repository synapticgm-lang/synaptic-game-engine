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
import { engineChipLabels, isLegalEnginePad, choiceNamesUnnarratedObject } from './choicePipeline';
import { resolveOfferedChoices } from './playTranscript';
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
    // Lock B: a hub-role compound in present[] is not CAST-named; it enters only as a hub arrival contact.
    expect(resolveHubArrival(state, 'Lowmarket')?.beat.contactName).toBeUndefined();
    expect(cast).not.toContain('Lowmarket Fence');
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

  it('runArcDirectorBeforeGm + resolveOfferedChoices finish quickly', () => {
    const state = hubCastState();
    const t0 = Date.now();
    const arc = runArcDirectorBeforeGm(state, 'Ask a direct question');
    expect(arc.state).toBeTruthy();
    const pads = resolveOfferedChoices(arc.state);
    expect(pads.length).toBeGreaterThanOrEqual(1);
    expect(Date.now() - t0).toBeLessThan(500);
  });

  it('legal engine pads are bound builder chips; crystals stay unbound (RC-K1)', () => {
    // RC-K1: a chip is offered only when a builder made it (or a writer label binds to that
    // action + target). No inferIntent-alone path. "Ask a direct question" is unbound here.
    const state = hubCastState();
    const story = state.log[state.log.length - 1]!.content;
    expect(isLegalEnginePad('Inspect the area')).toBe(false);
    expect(isLegalEnginePad('Wait quietly and listen')).toBe(false);
    expect(isLegalEnginePad('Check Status', state, story)).toBe(true);
    const built = [...engineChipLabels(state, story)];
    expect(built.length).toBeGreaterThan(0);
    for (const chip of built) expect(isLegalEnginePad(chip, state, story)).toBe(true);
    expect(isLegalEnginePad('Wait quietly', state, story)).toBe(true);
    expect(isLegalEnginePad('Inspect the crystals breaking the street', state, story)).toBe(false);

    expect(choiceNamesUnnarratedObject('Wait quietly', story, state)).toBe(false);
    expect(choiceNamesUnnarratedObject('Inspect the crystals breaking the street', story, state)).toBe(true);

    const filtered = filterInventedContextChoices(state.choices, state);
    expect(filtered).toContain('Check Status');
    expect(filtered).not.toContain('Inspect the crystals breaking the street');
    expect(filtered).not.toContain('Ask a direct question');
  });
});
