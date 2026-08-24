import { describe, expect, it } from 'vitest';
import { createInitialState, createDefaultSettings } from './defaults';
import { emptyWorldLedger } from './worldSim';
import { repairSaveSchema } from './saveMigration';
import { CURRENT_SAVE_REPAIR_REVISION } from './dungeonMobLedger';
import { formatSituationForPrompt } from './situationPacket';
import { padChoicesToCount, inventsPresenceOnEmptyScene } from './choicePipeline';
import { applyPathDensity, classifyPath } from './stanceDensity';
import { formatChoiceTierModeDna } from './choiceTierRules';
import { formatFluidProseRailsForPrompt } from './fluidProseRails';
import { buildSystemPrompt } from './masterPrompt';
import type { GameState } from './types';

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState('Sim', 'litrpg'),
    saveRepairRevision: 0,
    ...overrides,
  };
}

describe('Simulationist Sandbox', () => {
  it('emptyWorldLedger includes factionStandings: []', () => {
    const ledger = emptyWorldLedger();
    expect(ledger.factionStandings).toEqual([]);
  });

  it('repairSaveSchema hydrates powerScaling to balanced', () => {
    const base = createInitialState('Sim', 'litrpg');
    const { state, dirty } = repairSaveSchema({
      ...base,
      powerScaling: undefined,
      saveRepairRevision: 0,
      worldLedger: {
        clock: { day: 0, week: 0 },
        caravans: [],
        deals: [],
        holdings: [],
        hostiles: [],
        actors: [],
        pendingHiddenEvents: [],
      },
    });
    expect(dirty).toBe(true);
    expect(state.powerScaling).toBe('balanced');
    expect(state.worldLedger?.factionStandings).toEqual([]);
    expect(state.saveRepairRevision).toBe(CURRENT_SAVE_REPAIR_REVISION);
  });

  it('formatSituationForPrompt includes ZONE THREAT / FACTION / POWER SCALING when set', () => {
    const base = createInitialState('Sim', 'litrpg');
    const state = baseState({
      powerScaling: 'gritty',
      character: { ...base.character, level: 3 },
      locationSheet: {
        name: 'Ashwall',
        threatTier: 5,
        interactables: [],
        exits: [],
        presentNpcIds: [],
      },
      worldLedger: {
        ...emptyWorldLedger(),
        factionStandings: [
          {
            id: 'ember-guild',
            name: 'Ember Guild',
            standing: 'friendly',
            notes: 'owes a favor',
          },
          {
            id: 'ash-court',
            name: 'Ash Compact',
            standing: 'hostile',
          },
        ],
      },
    });
    const text = formatSituationForPrompt(state);
    expect(text).toMatch(/### SCENE STATE/);
    expect(text).toMatch(/Zone Threat: Tier 5 vs Player Level 3/);
    expect(text).toMatch(/\[ZONE THREAT: Tier 5 vs Player Level 3\]/);
    expect(text).toMatch(/\[FACTION MATRIX:.*Ember Guild=friendly/);
    expect(text).toMatch(/Ash Compact=hostile/);
    expect(text).toMatch(/\[POWER SCALING: gritty\]/);
    expect(text).toMatch(/Power Scaling: gritty/);
  });

  it('formatSituation always includes effective POWER SCALING (default balanced)', () => {
    const state = baseState({ powerScaling: undefined });
    const text = formatSituationForPrompt(state);
    expect(text).toMatch(/\[POWER SCALING: balanced\]/);
  });

  it('padChoices alone still blocks invent-crowd diplomatic pads', () => {
    const state = baseState({
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: true,
        sceneWritten: true,
        aloneArrival: true,
      },
      sceneFacts: {
        crowd: 'none',
        noise: 'quiet',
        props: [],
        present: [],
        lastBeat: 'empty ruin',
        updatedTurn: 1,
      },
      companions: [],
    });
    const story = 'Dust hangs in the broken light. Nothing moves.';
    const padded = padChoicesToCount(['Search the rubble'], state, story, 3);
    expect(padded.length).toBeGreaterThanOrEqual(3);
    for (const c of padded) {
      expect(inventsPresenceOnEmptyScene(c, state, story)).toBe(false);
      expect(c).not.toMatch(/crowd|bystander|call out to|people who saw|ask the locals/i);
    }
    const paths = new Set(padded.map(classifyPath));
    expect(paths.has('direct') || paths.has('solitary')).toBe(true);
  });

  it('stance path buckets when not alone cover Direct / Diplomatic / Solitary', () => {
    const state = baseState({
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: true,
        sceneWritten: true,
        aloneArrival: false,
      },
      companions: [
        {
          id: 'c1',
          name: 'Rook',
          type: 'party',
          role: 'scout',
          hp: 10,
          maxHp: 10,
          maintenanceCost: '',
          assignment: '',
          notes: '',
        },
      ],
      npcMemories: [
        {
          npcId: 'n1',
          npcName: 'Mira',
          disposition: 'neutral',
          facts: [],
          lastSeenTurn: 1,
        },
      ],
      turn: 2,
      sceneFacts: {
        crowd: 'present',
        noise: 'busy',
        props: [],
        present: ['Mira'],
        lastBeat: 'market stall',
        updatedTurn: 2,
      },
    });
    const padded = applyPathDensity(['Look around'], state, 'Mira watches from the stall.');
    const paths = new Set(padded.map(classifyPath));
    expect(paths.has('direct')).toBe(true);
    expect(paths.has('diplomatic')).toBe(true);
    expect(paths.has('solitary')).toBe(true);
    expect(padded.some((c) => /Rook|Mira|Ask what/i.test(c))).toBe(true);
  });
});

describe('Engine Mode DNA', () => {
  it('choice DNA differs per engineMode', () => {
    expect(formatChoiceTierModeDna('litrpg')).toMatch(/Direct \/ Physical/);
    expect(formatChoiceTierModeDna('dnd')).toMatch(/Investigate/);
    expect(formatChoiceTierModeDna('rpg')).toMatch(/Moral \/ Faction/);
    expect(formatChoiceTierModeDna('pyoa')).toMatch(/Tool \/ Inventory/);
  });

  it('fluid prose diction differs per engineMode', () => {
    expect(formatFluidProseRailsForPrompt('litrpg')).toMatch(/impartial physics/i);
    expect(formatFluidProseRailsForPrompt('dnd')).toMatch(/fail forward/i);
    expect(formatFluidProseRailsForPrompt('rpg')).toMatch(/moral leverage/i);
    expect(formatFluidProseRailsForPrompt('pyoa')).toMatch(/gamebook narrator/i);
  });

  it('buildSystemPrompt injects mode DNA for each engine', () => {
    const settings = createDefaultSettings();
    for (const mode of ['litrpg', 'dnd', 'rpg', 'pyoa'] as const) {
      const prompt = buildSystemPrompt(createInitialState('DNA', mode), settings, []);
      expect(prompt).toMatch(/ENGINE MODE DNA/);
      expect(prompt).toMatch(/ENGINE CHOICE DNA/);
    }
    expect(buildSystemPrompt(createInitialState('A', 'litrpg'), settings, [])).toMatch(/Impartial physics/);
    expect(buildSystemPrompt(createInitialState('B', 'dnd'), settings, [])).toMatch(/Fail forward/);
    expect(buildSystemPrompt(createInitialState('C', 'rpg'), settings, [])).toMatch(/Moral leverage/);
    expect(buildSystemPrompt(createInitialState('D', 'pyoa'), settings, [])).toMatch(/Inventory gating/);
  });
});
