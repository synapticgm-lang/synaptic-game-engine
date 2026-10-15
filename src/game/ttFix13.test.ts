/**
 * tt-fix-13 — one block per item:
 * 1. a fight the player lost or fled reads "ended" on STATUS, not "cleared" (the foe is still there);
 * 2. the rooms of the dungeon here are places, not people present;
 * 3. the tabletop step the player took reaches the writer's engine result with its own words.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest } from './types';
import { formatEncounterClearedStatus, type EncounterClearedReceipt } from './encounterTerminalFsm';
import { formatArcStatusReceipts, type ArcDirectorResult } from './arcDirector';
import { filterSystemLogForEngine, statusLinesForVerbosity } from './systemLog';
import { harvestNarrativePeople, maskPlaceNames } from './narrativeHarvest';
import { applyTabletopQuestTurn, tabletopStepChip } from './tabletopQuestProgress';
import { maybeEnterInteriorDungeon } from './enterInterior';
import { engineResultFact } from './engineResult';
import { TABLETOP_MAIN_SPINES, tabletopSpineToStarterQuest } from '@/data/quests/tabletopMainSpines';

function ck(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 11,
    character: { ...s.character, name: 'Jax' },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    activeEncounter: null,
    ...over,
  } as GameState;
}

function spineQuest(spineId: string, done = 0): Quest {
  const seed = tabletopSpineToStarterQuest(TABLETOP_MAIN_SPINES.find((x) => x.spineId === spineId)!);
  return {
    id: seed.id,
    name: seed.title,
    status: 'active',
    revealed: true,
    type: 'main',
    location: seed.location,
    objectives: seed.objectives.map((d, i) => {
      const { people, ...rest } = seed.objectiveAnchors?.[i] ?? {};
      return { id: `${seed.id}-obj-${i + 1}`, description: d, completed: i < done, ...rest, ...(people?.length ? { people } : {}) };
    }),
  } as Quest;
}

const receipt = (outcome: EncounterClearedReceipt['outcome']) =>
  formatEncounterClearedStatus({
    encounterId: 'e1', outcome, turn: 17, resolutionReason: 'test',
    engagedTurnCount: 1, failedFleeCount: 0, failedParleyCount: 0, name: 'Cave Rat',
  } as EncounterClearedReceipt);

describe('1 — a lost or fled fight is not a cleared one', () => {
  it('a loss and an escape read "ended"; a win still reads "cleared" (lap 17 B T17)', () => {
    expect(receipt('defeat')).toBe('Encounter ended: Cave Rat — lost');
    expect(receipt('escape')).toBe('Encounter ended: Cave Rat — escaped');
    expect(receipt('victory')).toBe('Encounter cleared: Cave Rat — victory');
  });

  it('STATUS shows the ended line once, in core verbosity too', () => {
    const s = ck();
    const lines = filterSystemLogForEngine(
      formatArcStatusReceipts({ state: s, systemReceipts: ['Encounter cleared: Cave Rat (defeat)', receipt('defeat')] } as unknown as ArcDirectorResult),
      'dnd'
    );
    expect(lines.filter((l) => /^Encounter/.test(l))).toEqual(['Encounter ended: Cave Rat — lost']);
    expect(statusLinesForVerbosity(lines, 'core')).toContain('Encounter ended: Cave Rat — lost');
  });
});

describe('2 — a dungeon room is a place, not a person', () => {
  function insideKeep(): GameState {
    const s = ck({ quests: [spineQuest('ck-spine-barred-oak', 2)], currentLocation: 'Keep Gate' } as Partial<GameState>);
    return maybeEnterInteriorDungeon(s, tabletopStepChip(s)!);
  }

  it('the exits the room record names stay out of present[] (lap 17 D T15)', () => {
    const s = insideKeep();
    const rooms = (s.activeDungeon?.nodes ?? []).map((n) => n.name).filter((n) => n.split(' ').length >= 2);
    expect(rooms.length).toBeGreaterThan(1);
    const [a, b] = rooms;
    const prose = `Jax searched the hall and found nothing. The exits ${a} and ${b} remain.`;
    expect(maskPlaceNames(s, prose)).not.toContain(a);
    const out = harvestNarrativePeople(s, prose, 15);
    expect(out.people).toEqual([]);
    expect(out.state.sceneFacts?.present ?? []).not.toContain(a);
    expect(out.state.sceneFacts?.present ?? []).not.toContain(b);
  });
});

describe('3 — the step taken is the writer\'s fact', () => {
  it('checking the mud hands the writer the cart tracks it is for (lap 17 E T19)', () => {
    const quest = spineQuest('ck-spine-mayor-problem');
    const step = quest.objectives!.findIndex((o) => /cart tracks/i.test(o.description) && !/^follow/i.test(o.description));
    expect(step).toBeGreaterThanOrEqual(0);
    const q = { ...quest, objectives: quest.objectives!.map((o, i) => ({ ...o, completed: i < step })) };
    const s = ck({ quests: [q], currentLocation: 'Greyhollow Graveyard' } as Partial<GameState>);
    const chip = tabletopStepChip(s);
    expect(chip).toBeTruthy();
    const turn = applyTabletopQuestTurn(s, chip!, 'Greyhollow Graveyard');
    expect(turn.receipts[0]).toMatch(/^Quest stage:/);
    const fact = engineResultFact([...turn.receipts, ...(turn.facts ?? [])], 'dnd');
    expect(fact).toMatch(/^You check the mud .*cart tracks leading uphill\.$/i);
    expect(fact).not.toMatch(/Quest stage/);
  });

  it('no step taken hands no fact', () => {
    const s = ck({ quests: [spineQuest('ck-spine-mayor-problem')], currentLocation: 'Greyhollow Graveyard' } as Partial<GameState>);
    expect(applyTabletopQuestTurn(s, 'Wait', 'Greyhollow Graveyard').facts ?? []).toEqual([]);
  });
});
