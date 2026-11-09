/**
 * Every generated place the player can stand in has a way out, and the exits
 * on the sheet are the travel buttons that actually move them.
 * Port Crescent and the Static House kitchen are the 9 Nov 2026 repros.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { buildDungeonCard } from './dungeonCard';
import { buildInteriorFloorPlan, type MapNode } from './mapEngine';
import { exitPlaceNames } from './placeNames';
import { placeScale } from './placeAuthority';
import { resolvePlace } from './places';
import { ensurePlaceOnMap, placeExits } from './placeRegistry';
import { recordedTravelDestinations, wayOutMovesPlayer } from './sceneAffordances';
import type { GameState } from './types';

const SEEDS = [1, 7, 42, 100, 8202, 20632];

function modeFor(mode?: string): GameState['engineMode'] {
  if (mode === 'litrpg' || mode === 'dnd' || mode === 'rpg' || mode === 'pyoa') return mode;
  return 'rpg';
}

function openAt(bibleId: string, seed: number): GameState {
  const bible = ALL_CAMPAIGN_BIBLES.find((b) => b.id === bibleId);
  const mode = modeFor(bible?.engineMode);
  const { state } = buildNewGameState({
    bibleId,
    characterName: 'Jax',
    seed,
    personality: mode === 'litrpg' ? 'cold-system' : mode === 'dnd' ? 'chilled-gm' : 'friendly-guide',
    engineMode: mode,
  });
  return stampOpening(state);
}

function stand(state: GameState, name: string, from?: string): GameState {
  return ensurePlaceOnMap({ ...state, currentLocation: name }, name, from ?? state.currentLocation);
}

function movingButtons(state: GameState): string[] {
  const out: string[] = [];
  for (const row of recordedTravelDestinations(state)) {
    const label = (row.label ?? '').trim();
    if (!label || !wayOutMovesPlayer(state, `Travel toward ${label}`)) continue;
    if (!out.some((n) => n.toLowerCase() === label.toLowerCase())) out.push(label);
  }
  return out;
}

function sameNames(a: string[], b: string[]): boolean {
  const left = [...new Set(a.map((n) => n.toLowerCase()))].sort();
  const right = [...new Set(b.map((n) => n.toLowerCase()))].sort();
  return left.join('\n') === right.join('\n');
}

function wayOutProblem(state: GameState): string {
  const shown = exitPlaceNames(state);
  const buttons = movingButtons(state);
  const place = resolvePlace(state.places, state.currentLocation);
  if (place?.closed || place?.arcStatus === 'closed') return 'closed-underfoot';
  if (!buttons.length) return `no-travel shown=[${shown.join('|')}]`;
  if (!sameNames(shown, buttons)) return `mismatch shown=[${shown.join('|')}] buttons=[${buttons.join('|')}]`;
  return '';
}

function openConnected(nodes: MapNode[]): string[] {
  const open = nodes.filter((n) => !n.isSecret);
  if (open.length <= 1) return [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const entry = open.find((n) => n.tags?.includes('here') || n.tags?.includes('entry') || n.id === 'r0' || n.id === 'entry') ?? open[0]!;
  if (!(entry.connections ?? []).some((id) => byId.has(id))) return [entry.name || entry.id];
  const seen = new Set<string>([entry.id]);
  const q = [entry.id];
  while (q.length) {
    const id = q.pop()!;
    for (const next of byId.get(id)?.connections ?? []) {
      if (!byId.has(next) || seen.has(next)) continue;
      seen.add(next);
      q.push(next);
    }
  }
  return open.filter((n) => seen.has(n.id) && !(n.connections ?? []).length).map((n) => n.name || n.id);
}

describe('every reachable place has a way out', () => {
  it('Port Crescent has travel buttons for the exits it shows', () => {
    const opened = openAt('summoned-pact', 42);
    const here = stand(opened, 'Port Crescent');
    expect(resolvePlace(here.places, 'Port Crescent')?.closed, 'stays open').not.toBe(true);
    expect(placeExits(here, 'Port Crescent').length, 'registered exits').toBeGreaterThan(0);
    expect(wayOutProblem(here), wayOutProblem(here) || 'ok').toBe('');
    expect(movingButtons(here).map((n) => n.toLowerCase())).not.toContain('port crescent');
  });

  it('Static House seed 8202 kitchen opening has a way out', () => {
    const opened = openAt('static-house', 8202);
    expect(opened.currentLocation).toMatch(/kitchen/i);
    expect(wayOutProblem(opened), wayOutProblem(opened) || 'ok').toBe('');
    expect(movingButtons(opened).map((n) => n.toLowerCase())).not.toContain((opened.currentLocation ?? '').toLowerCase());
  });

  it('many seeds, every genre, openings, hubs, and interiors', () => {
    const holes: string[] = [];
    let seeds = 0;
    let places = 0;
    for (const bible of ALL_CAMPAIGN_BIBLES) {
      if (bible.id.startsWith('blank-canvas')) continue;
      for (const seed of SEEDS) {
        let opened: GameState;
        try {
          opened = openAt(bible.id, seed);
        } catch (err) {
          holes.push(`${bible.id}@${seed}:open:${(err as Error).message}`);
          continue;
        }
        seeds += 1;
        const seen = new Set<string>();
        const queue: Array<{ name: string; from?: string }> = [];
        if (opened.currentLocation) queue.push({ name: opened.currentLocation });
        while (queue.length) {
          const step = queue.shift()!;
          const key = step.name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          const before = resolvePlace(opened.places, step.name);
          if (before && (before.closed || before.arcStatus === 'closed') && step.name !== opened.currentLocation) continue;
          places += 1;
          const here = stand(opened, step.name, step.from);
          const problem = wayOutProblem(here);
          if (problem) {
            holes.push(`${bible.id}@${seed}:${step.name}:${problem}`);
            continue;
          }
          if (placeScale(step.name) === 'indoor') {
            const plan = buildInteriorFloorPlan(step.name, [], undefined, `${bible.id}:${seed}:${step.name}`);
            const stuck = openConnected(plan.nodes);
            if (stuck.length) holes.push(`${bible.id}@${seed}:interior:${step.name}:${stuck.join('|')}`);
          }
          const row = resolvePlace(here.places, step.name);
          if (row?.allowsDungeon && row.arcStatus !== 'closed' && !row.closed) {
            const card = buildDungeonCard(here, step.name);
            const stuck = openConnected(card.nodes);
            if (stuck.length) holes.push(`${bible.id}@${seed}:dungeon:${step.name}:${stuck.join('|')}`);
          }
          for (const dest of movingButtons(here)) {
            if (!seen.has(dest.toLowerCase())) queue.push({ name: dest, from: step.name });
          }
        }
      }
    }
    expect(seeds, 'seeds opened').toBeGreaterThan(100);
    expect(places, 'places walked').toBeGreaterThan(200);
    expect(holes, `seeds=${seeds} places=${places}\n${holes.slice(0, 30).join('\n')}`).toEqual([]);
    console.log(`way-out property: seeds=${seeds} places=${places}`);
  }, 180000);
});
