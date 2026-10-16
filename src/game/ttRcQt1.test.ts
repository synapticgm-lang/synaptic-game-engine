/**
 * RC-QT1: picking a chip named like a quest step does not tick it.
 * Tick needs the engine outcome (place / find / meet / contact favour).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { actionMatchesObjective, findQuestTargets, targetSpot } from './questTargets';
import { applyStoryRpgTurn, storyRpgDecisionChip } from './storyRpgProgress';
import { stepChip } from './choiceRanking';
import type { GameState, Quest, QuestObjective } from './types';

const base = (): GameState => {
  const s = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    turn: 5,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    activeEncounter: null,
    currentLocation: 'Waystation',
    places: [{ name: 'Waystation' }, { name: 'Consul Caravan Camp' }, { name: "Olenna's Warehouse" }],
  } as GameState;
};

describe('RC-QT1 chip label alone never ticks a quest step', () => {
  it('Story RPG: Pick an approach / Commit chips stay open; picking them does not tick', () => {
    const quest: Quest = {
      id: 'sr-case',
      name: 'Case the Caravan',
      description: 'Case it.',
      status: 'active',
      revealed: true,
      type: 'main',
      objectives: [
        { id: 'o0', description: 'Scout the caravan', completed: true },
        { id: 'o1', description: 'Pick an approach', completed: false },
        { id: 'o2', description: 'Commit to the heist night', completed: false },
      ],
    } as Quest;
    const s = { ...base(), quests: [quest] } as GameState;
    expect(storyRpgDecisionChip(s)).toBe('Pick an approach');
    const took = applyStoryRpgTurn(s, 'Pick an approach');
    expect(took.receipts.join('\n')).not.toMatch(/Quest stage/);
    expect(took.state.quests![0]!.objectives![1]!.completed).toBe(false);
    expect(storyRpgDecisionChip(took.state)).toBe('Pick an approach');
  });

  it('warehouse tripwire chip away from the warehouse ticks nothing; find at the place does', () => {
    const step: QuestObjective = {
      id: 'trip',
      description: "Disable the warehouse's internal tripwires from the catwalks without breaking the expensive glass goods.",
      completed: false,
      verb: 'Disable',
      object: "the warehouse's internal tripwires",
      target: { kind: 'item', name: "the warehouse's internal tripwires", place: "Olenna's Warehouse" },
    };
    const chip = stepChip(step)!;
    expect(chip.toLowerCase()).toContain('tripwire');
    // Matcher may still recognise the named object in the chip text — the tick gate is targetSpot.
    expect(actionMatchesObjective(step, chip)).toBe(true);
    const away = { ...base(), currentLocation: 'Waystation', quests: [{ id: 'fake', name: 'The Fake Cargo', status: 'active', revealed: true, type: 'main', description: '', objectives: [step] } as Quest] };
    const miss = findQuestTargets(away, chip);
    expect(miss.state.quests![0]!.objectives![0]!.completed).toBe(false);
    expect(miss.receipts).toEqual([]);
    const at = { ...away, currentLocation: "Olenna's Warehouse" };
    const hit = findQuestTargets(at, 'Search the catwalks for tripwires');
    expect(hit.state.quests![0]!.objectives![0]!.completed).toBe(true);
    expect(hit.receipts[0]).toMatch(/Disable|tripwire/i);
  });

  it('door step: standing outside with the step chip never ticks (spot is door, not the room)', () => {
    const step: QuestObjective = {
      id: 'lina',
      description: 'Recover Lina from the keep',
      completed: false,
      verb: 'Recover',
      object: 'Lina',
      room: 'hall',
      target: { kind: 'person', name: 'Lina', place: 'Keep Gate', nodeId: 'keep_hall' },
    };
    const chip = stepChip(step)!;
    const s = {
      ...base(),
      engineMode: 'dnd' as const,
      campaignBibleId: 'cursed-keep',
      currentLocation: 'Keep Gate',
      activeDungeon: null,
      quests: [{ id: 'plea', name: "The Woodcutter's Plea", status: 'active', revealed: true, type: 'main', description: '', objectives: [step] } as Quest],
    } as GameState;
    expect(targetSpot(s, step)).toBe('door');
    const miss = findQuestTargets(s, chip);
    expect(miss.receipts).toEqual([]);
    expect(miss.state.quests![0]!.objectives![0]!.completed).toBe(false);
  });
});
