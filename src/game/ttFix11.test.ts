/**
 * tt-fix-11 — one block per item:
 * 1. the step ledger: steps are taken in order, the step tracker is the one producer of the step chip (so the
 *    inside step is offered at the gate and survives the chip filter), and the inside step ticks inside, not at the door;
 * 2. a meeting chip names a fail cost only when the meeting can force a fight;
 * 3. a route stop the beat names is a place, never a person present;
 * 4. no fallback chip offers an act the engine cannot resolve ("Force a path forward").
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest } from './types';
import { applyTabletopQuestTurn, tabletopStepChip } from './tabletopQuestProgress';
import { storyChip } from './choiceRanking';
import { maybeEnterInteriorDungeon } from './enterInterior';
import { filterInventedContextChoices } from './choiceWarden';
import { journeyPads } from './travelJourney';
import { harvestNarrativePeople } from './narrativeHarvest';
import { sceneSafeFallbacks } from './choicePipeline';
import { TABLETOP_MAIN_SPINES, tabletopSpineToStarterQuest } from '@/data/quests/tabletopMainSpines';

function ck(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 9,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    activeEncounter: null,
    ...over,
  } as GameState;
}

function spineQuest(spineId: string, done: number[]): Quest {
  const seed = tabletopSpineToStarterQuest(TABLETOP_MAIN_SPINES.find((x) => x.spineId === spineId)!);
  return {
    id: seed.id,
    name: seed.title,
    description: seed.description,
    status: 'active',
    revealed: true,
    type: 'main',
    location: seed.location,
    ...(seed.giver ? { giver: seed.giver } : {}),
    objectives: seed.objectives.map((d, i) => {
      const { people, ...rest } = seed.objectiveAnchors?.[i] ?? {};
      return { id: `${seed.id}-obj-${i + 1}`, description: d, completed: done.includes(i), ...rest, ...(people?.length ? { people } : {}) };
    }),
  } as Quest;
}

const gm = (content: string) => ({ id: `g${content.length}`, role: 'gm', content, timestamp: 0 }) as GameState['log'][number];

describe('1 — the step ledger', () => {
  it('a move step never ticks on arrival; it ticks when taken at its place in order (lap 15 A T12, tt-build-questtargets)', () => {
    const s = ck({ quests: [spineQuest('ck-spine-mayor-problem', [])], currentLocation: 'Keep Gate' } as Partial<GameState>);
    const out = applyTabletopQuestTurn(s, 'Walk on', 'On the road between places').state.quests![0]!;
    expect(out.objectives!.map((o) => o.completed)).toEqual([false, false, false]);
    const done = ck({ quests: [spineQuest('ck-spine-mayor-problem', [0])], currentLocation: 'Keep Gate' } as Partial<GameState>);
    const arrived = applyTabletopQuestTurn(done, 'Walk on', 'On the road between places').state;
    expect(arrived.quests![0]!.objectives![1]!.completed).toBe(false);
    const chip = tabletopStepChip(arrived)!;
    expect(chip).toBeTruthy();
    expect(applyTabletopQuestTurn(arrived, chip, 'Keep Gate').state.quests![0]!.objectives![1]!.completed).toBe(true);
  });

  it('the inside step is the tracker\'s chip at the gate and survives the chip filter (lap 15 B T10, C T11, F T14)', () => {
    const s = ck({
      quests: [spineQuest('ck-spine-barred-oak', [0, 1])],
      currentLocation: 'Keep Gate',
      log: [gm('Jax arrived at the Keep Gate as the afternoon sun beat down.')],
    } as Partial<GameState>);
    const chip = tabletopStepChip(s);
    expect(chip).toBeTruthy();
    expect(storyChip(s)).toBe(chip);
    expect(filterInventedContextChoices([chip!, 'Wait and watch'], s)).toContain(chip);
  });

  it('the turn that walks in does not tick the inside step; taking it inside does (lap 14 C T8)', () => {
    const s = ck({ quests: [spineQuest('ck-spine-barred-oak', [0, 1])], currentLocation: 'Keep Gate' } as Partial<GameState>);
    const chip = tabletopStepChip(s)!;
    const inside = maybeEnterInteriorDungeon(s, chip);
    expect(inside.currentLocation).toMatch(/^Keep Gate [—–] /);
    const walkedIn = applyTabletopQuestTurn(inside, chip, 'Keep Gate').state;
    expect(walkedIn.quests![0]!.status).toBe('active');
    // tt-build-questtargets — the target sits in its own room; the step is offered and ticks there.
    const room = walkedIn.quests![0]!.objectives![2]!.target!.nodeId!;
    const there = { ...walkedIn, activeDungeon: { ...walkedIn.activeDungeon!, currentNodeId: room } };
    expect(tabletopStepChip(there)).toBe(chip);
    expect(applyTabletopQuestTurn(there, chip, there.currentLocation).state.quests![0]!.status).toBe('completed');
  });
});

describe('2 — a fail cost only where a fight can be forced', () => {
  const at = (encounter: Record<string, unknown>) =>
    ck({
      currentLocation: 'On the road between places',
      journey: { from: 'Blackspine Treeline', to: 'Greyhollow Graveyard', legsDone: 1, legsTotal: 3, ground: 'Forest path', terrain: 'forest', encounter },
    } as unknown as Partial<GameState>);

  it('a peaceful camp is skirted with no fail promised (lap 15 A T19)', () => {
    const pads = journeyPads(at({ kind: 'camp', level: 2, stretch: 1, dangerous: false, want: 'to know if you are trouble', distanceFt: 120 }));
    expect(pads).toContain('Skirt around the camp');
    expect(pads.some((p) => /but fail/.test(p))).toBe(false);
  });

  it('a camp with a champion and the dead keep the cost', () => {
    const champ = journeyPads(at({ kind: 'camp', level: 2, stretch: 1, dangerous: true, miniBoss: true, want: 'to know if you are trouble', distanceFt: 20 }));
    expect(champ).toContain('Skirt around the camp, but fail and they attack');
    const dead = journeyPads(at({ kind: 'undead', level: 1, stretch: 1, dangerous: true, want: 'the living off their ground', distanceFt: 30 }));
    expect(dead).toContain('Slip past the dead, but fail and they attack');
  });
});

describe('3 — a route stop is a place', () => {
  it('"the path passes the Mossy Stair" puts nobody in the scene (lap 15 D T10)', () => {
    const s = ck({
      currentLocation: 'On the road between places',
      routeStops: { 'blackspine treeline ~ keep gate': [{ name: 'the Mossy Stair', leg: 1, find: 'shrine' }] },
    } as Partial<GameState>);
    const out = harvestNarrativePeople(s, 'The trees stood close. Ahead, the path passes the Mossy Stair, and the afternoon is nearly spent.', 10);
    expect(out.people).toEqual([]);
    expect(out.state.sceneFacts?.present ?? []).not.toContain('Mossy Stair');
  });
});

describe('4 — no fallback chip the engine cannot resolve', () => {
  it('a gate or path in the beat does not offer "Force a path forward" (lap 15 F T4)', () => {
    const s = ck({ currentLocation: 'Barred Oak Gate' });
    expect(sceneSafeFallbacks(s, 'A heavy crossbeam lay across the gate. The path ran on past it.')).not.toContain('Force a path forward');
  });
});
