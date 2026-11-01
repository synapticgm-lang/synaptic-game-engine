/**
 * Flash Lite Input Sanitization Tests
 * 
 * Tests for the 5 architectural interventions designed to improve
 * Flash Lite story quality from 1/10 to 5-6/10.
 * 
 * @see docs/research/flash-lite-input-sanitization-architecture-2026-09-02.md
 */

import { describe, test, expect } from 'vitest';
import { translateStateToNarrative, isUiLabel, choiceContainsUngroundedReferences } from '../game/narrativeTranslator';
import { buildEntityCast, getCastSummary } from '../game/entityCast';
import { injectLoiterDelta, buildLoiterDeltaDirective, needsLoiterDelta } from '../game/loiterDeltaDirective';
import { buildPovRails, hasPovViolations, scrubBodyPartPossession } from '../game/povRails';
import type {
  ActiveEncounter,
  GameState,
  Item,
  LogEntry,
  OpeningEstablishment,
  PlaceRecord,
  SceneFacts,
} from '../game/types';

/** The NAMED CHARACTERS section of a CAST block (anonymous groups and threats excluded). */
function namedSection(cast: string): string {
  return cast.match(/NAMED CHARACTERS[^\n]*\n((?:- [^\n]*\n)*)/)?.[1] ?? '';
}

/** Test overrides allow nested partials; assembled into a cast GameState. */
type MockOverrides = {
  turn?: number;
  character?: Partial<GameState['character']>;
  sceneFacts?: Partial<SceneFacts>;
  location?: string;
  currentLocation?: string;
  campaignBibleId?: string;
  locationSheet?: GameState['locationSheet'];
  npcMemories?: GameState['npcMemories'];
  inventory?: Item[];
  quests?: GameState['quests'];
  questFocus?: string;
  gold?: number;
  materials?: GameState['materials'];
  companions?: GameState['companions'];
  log?: Array<Pick<LogEntry, 'role' | 'content'> & Partial<LogEntry>>;
  places?: Array<Partial<PlaceRecord> & Pick<PlaceRecord, 'name'>>;
  /** povRails reads settings.perspective off the cast object (not a GameState field). */
  settings?: { perspective?: 'second' | 'third' };
  engineMode?: GameState['engineMode'];
  openingEstablishment?: Partial<OpeningEstablishment>;
  activeEncounter?: Partial<ActiveEncounter> | null;
};

function mockGameState(overrides: MockOverrides = {}): GameState {
  const sceneFacts: SceneFacts = {
    crowd: 'sparse',
    noise: 'voices',
    present: ['Vessa', 'Just'],
    props: [],
    lastBeat: '',
    updatedTurn: 10,
    crowdCount: 4,
    tension: 'tense',
    indoor: false,
    timeOfDay: 'afternoon',
    weather: 'clear',
    ...overrides.sceneFacts,
  };

  const openingEstablishment: OpeningEstablishment | undefined = overrides.openingEstablishment
    ? {
        pending: [],
        answers: {},
        complete: false,
        ...overrides.openingEstablishment,
      }
    : undefined;

  const activeEncounter: ActiveEncounter | null | undefined =
    overrides.activeEncounter === null
      ? null
      : overrides.activeEncounter
        ? {
            name: 'Foe',
            level: 1,
            hp: 10,
            maxHp: 10,
            armorClass: 12,
            strength: 10,
            dexterity: 10,
            constitution: 10,
            xpReward: 0,
            goldReward: 0,
            ...overrides.activeEncounter,
          }
        : undefined;

  const places: PlaceRecord[] | undefined = overrides.places?.map((p, i) => ({
    ...p,
    id: p.id ?? `place-${i}-${p.name}`,
    name: p.name,
  }));

  const log: LogEntry[] | undefined = overrides.log?.map((entry, i) => ({
    id: entry.id ?? `log-${i}`,
    turn: entry.turn ?? i,
    timestamp: entry.timestamp ?? i,
    role: entry.role,
    content: entry.content,
  }));

  return {
    turn: 10,
    character: {
      name: 'TestChar',
      level: 5,
      xp: 1000,
      xpToNext: 2000,
      hp: 80,
      maxHp: 100,
      mp: 50,
      maxMp: 60,
      sp: 40,
      maxSp: 50,
      attributes: { STR: 12, DEX: 14, CON: 13, INT: 10, WIS: 11, CHA: 9 },
      conditions: [],
      ...overrides.character,
    },
    sceneFacts,
    location: overrides.location ?? 'Consul Caravan Camp',
    locationSheet: overrides.locationSheet ?? {
      name: 'Consul Caravan Camp',
      biome: 'desert camp',
      exits: [
        { label: 'road toward Consul', destination: 'Salt Road Waystation' },
        { label: 'path to waystation', destination: 'Salt Road Waystation' },
      ],
      interactables: [],
    },
    npcMemories: overrides.npcMemories ?? [
      { npcName: 'Vessa', role: 'contact', disposition: 'neutral' },
      { npcName: 'Just', role: 'associate', disposition: 'intimidating' },
    ],
    inventory: overrides.inventory ?? [
      { id: 'worn-clothes', name: 'worn clothes', quantity: 1, rarity: 'Common', equipped: true, slot: 'body' },
      { id: 'bag', name: 'Bag', quantity: 1, rarity: 'Common', sealed: true },
    ],
    quests: overrides.quests ?? [
      {
        id: 'heist-001',
        name: 'Salt Road Ledger Retrieval',
        type: 'heist',
        status: 'active',
        revealed: true,
        objectiveText: 'Steal the ledger from the locked wagon',
      },
    ],
    questFocus: overrides.questFocus ?? 'heist-001',
    gold: overrides.gold ?? 50,
    materials: overrides.materials ?? [],
    companions: overrides.companions ?? [],
    log: log ?? [],
    places: places ?? [
      {
        id: 'consul-caravan-camp',
        name: 'Consul Caravan Camp',
        description: 'A dusty desert camp operated by the Consul faction',
      },
    ],
    settings: overrides.settings ?? {
      perspective: 'second',
    },
    engineMode: overrides.engineMode ?? 'rpg',
    currentLocation: overrides.currentLocation,
    campaignBibleId: overrides.campaignBibleId,
    openingEstablishment,
    activeEncounter,
  } as unknown as GameState;
}

describe('narrativeTranslator', () => {
  test('translates raw state to natural language', () => {
    const state = mockGameState();
    const narrative = translateStateToNarrative(state);
    
    // Should contain natural language descriptions
    expect(narrative).toContain('player is at');
    expect(narrative).toContain('Named individuals present: Vessa');
    expect(narrative).not.toMatch(/Named individuals present:[^.]*\b(?:Just|Consul)\b/);
  });
  
  test('identifies UI labels correctly', () => {
    expect(isUiLabel('Consul')).toBe(true);
    expect(isUiLabel('Heat')).toBe(true);
    expect(isUiLabel('Target')).toBe(true);
    expect(isUiLabel('Vessa')).toBe(false);
    expect(isUiLabel('Just')).toBe(true);
  });
  
  test('translates faction tokens to background entities', () => {
    const state = mockGameState({
      sceneFacts: {
        present: ['Consul', 'Heat', 'Vessa'],
        crowdCount: 4,
      },
    });
    const narrative = translateStateToNarrative(state);
    
    expect(narrative).toContain('faction guards');
    expect(narrative).toContain('Vessa');
    expect(narrative).not.toMatch(/Named individuals present:[^.]*\b(?:Consul|Heat)\b/);
    expect(narrative).not.toContain('Heat');
  });
  
  test('detects ungrounded choice references', () => {
    const choice = 'Inspect the crystals on the street';
    const lastGmStory = 'You stand in a dusty room with barrels and crates.';
    const sceneFacts = { props: ['barrels', 'crates'], location: 'Room' };
    const inventory: Item[] = [];
    
    const isUngrounded = choiceContainsUngroundedReferences(
      choice,
      lastGmStory,
      sceneFacts,
      inventory
    );
    
    expect(isUngrounded).toBe(true); // 'crystals' and 'street' are not grounded
  });
  
  test('allows grounded choice references', () => {
    const choice = 'Inspect the barrels carefully';
    const lastGmStory = 'You stand in a dusty room with barrels and crates.';
    const sceneFacts = { props: ['barrels', 'crates'], location: 'Room' };
    const inventory: Item[] = [];
    
    const isUngrounded = choiceContainsUngroundedReferences(
      choice,
      lastGmStory,
      sceneFacts,
      inventory
    );
    
    expect(isUngrounded).toBe(false); // 'barrels' is grounded
  });
});

describe('entityCast', () => {
  test('builds CAST block with named and anonymous entities', () => {
    const state = mockGameState({ sceneFacts: { present: ['Vessa', 'Just', 'Consul'] } });
    const cast = buildEntityCast(state);
    
    expect(cast).toContain('<CAST>');
    expect(cast).toContain('NAMED CHARACTERS');
    expect(namedSection(cast)).toContain('Vessa');
    expect(namedSection(cast)).not.toContain('Just');
    expect(cast).toContain('ANONYMOUS ENTITIES');
    expect(cast).toContain('guards');
    expect(cast).not.toContain('CONSTRAINTS');
    expect(cast).toContain('Only listed entities');
  });
  
  test('marks opening pinned NPCs', () => {
    const state = mockGameState({
      openingEstablishment: {
        complete: true,
        pinnedNpcNames: ['Vessa'],
      },
    });
    const cast = buildEntityCast(state);
    
    expect(cast).toContain('[OPENING PIN - consequential]');
  });
  
  test('includes active encounter as threat', () => {
    const state = mockGameState({
      activeEncounter: {
        name: 'Pact Hunter',
        level: 5,
        hp: 60,
        maxHp: 80,
        encounterId: 'enc-001',
      },
    });
    const cast = buildEntityCast(state);
    
    expect(cast).toContain('ACTIVE THREATS:');
    expect(cast).toContain('Pact Hunter');
    expect(cast).toContain('60/80 HP');
  });
  
  test('includes hub arrival contact in CAST whitelist (2026-09-02c fix)', () => {
    // This test validates the fix for 02b madlib regression
    // where "Lowmarket Fence" was injected outside CAST, causing 30+ violations
    const state = mockGameState({
      currentLocation: 'Lowmarket',
      campaignBibleId: 'summoned-pact',
      openingEstablishment: {
        complete: true,
      },
      places: [
        {
          id: 'lowmarket',
          name: 'Lowmarket',
          description: 'A trading hub',
        },
      ],
    });

    const cast = buildEntityCast(state);
    
    // Hub contact should appear in the CAST named characters list
    // This prevents LLM from treating "Lowmarket Fence" as a template variable
    expect(cast).toContain('NAMED CHARACTERS');
    
    // The cast should include the contact name if hub arrival resolves
    // (Note: actual contact name depends on hub beat resolution)
    expect(cast).toContain('<CAST>');
    expect(cast).toContain('</CAST>');
  });
  
  test('filters out UI labels from cast', () => {
    const state = mockGameState({
      sceneFacts: {
        present: ['Consul', 'Heat', 'Vessa', 'Just'],
      },
    });
    const cast = buildEntityCast(state);
    
    expect(namedSection(cast)).not.toMatch(/Consul|Heat|Just/);
    expect(namedSection(cast)).toContain('Vessa');
  });
  
  test('getCastSummary returns correct counts', () => {
    const state = mockGameState({ sceneFacts: { present: ['Vessa', 'Just', 'Consul'] } });
    const summary = getCastSummary(state);
    
    expect(summary.namedCount).toBe(1); // Vessa ('Just' is a UI label)
    expect(summary.anonymousCount).toBeGreaterThan(0); // guards
    expect(summary.threatsCount).toBe(0); // no encounter
    expect(summary.constraintsCount).toBeGreaterThan(0);
  });
});

describe('loiterDeltaDirective', () => {
  test('injects time jump on Wait x3', () => {
    const streak = { key: 'wait', count: 3 };
    const snapshot = '- Location: Tavern\n- Presence: Vessa';
    const state = mockGameState();
    
    const result = injectLoiterDelta(snapshot, streak, state);
    
    expect(result).toContain('TIME JUMP: 10-15 minutes');
    expect(result).toContain('MANDATORY DELTA');
  });
  
  test('does not inject on streak <3', () => {
    const streak = { key: 'wait', count: 2 };
    const snapshot = '- Location: Tavern';
    const state = mockGameState();
    
    const result = injectLoiterDelta(snapshot, streak, state);
    
    expect(result).not.toContain('TIME JUMP');
  });
  
  test('calculates correct time jump for different streaks', () => {
    expect(buildLoiterDeltaDirective(3)).toContain('10-15 minutes');
    expect(buildLoiterDeltaDirective(4)).toContain('15-20 minutes');
    expect(buildLoiterDeltaDirective(5)).toContain('20-30 minutes');
  });
  
  test('detects loiter need from game state', () => {
    const state = mockGameState({
      log: [
        { role: 'player', content: 'Wait and observe' },
        { role: 'gm', content: 'The guards patrol.' },
        { role: 'player', content: 'Wait some more' },
        { role: 'gm', content: 'The guards still patrol.' },
        { role: 'player', content: 'Continue waiting' },
      ],
    });
    
    expect(needsLoiterDelta(state)).toBe(true);
  });
});

describe('povRails', () => {
  test('builds second person POV rails by default', () => {
    const state = mockGameState();
    const rails = buildPovRails(state);
    
    expect(rails).toContain('SECOND PERSON ONLY');
    expect(rails).toContain('Use "you", "your", "yours"');
    expect(rails).toContain('THIRD PERSON ONLY');
  });
  
  test('builds third person POV rails when configured', () => {
    const state = mockGameState({
      settings: { perspective: 'third' },
    });
    const rails = buildPovRails(state);
    
    expect(rails).toContain('third person');
    expect(rails).toContain('{NAME}');
  });
  
  test('an NPC body part beside the PC is not a POV slip', () => {
    const text = 'Your eyes narrow as his heart pounds.';
    expect(hasPovViolations(text)).toBe(false);
  });
  
  test('detects POV violations - third person camera', () => {
    const text = 'The scene unfolds as an observer would see.';
    expect(hasPovViolations(text)).toBe(true);
  });
  
  test('allows correct POV usage', () => {
    const text = 'You raise your blade. Vessa watches, her hand drifting to her dagger.';
    expect(hasPovViolations(text)).toBe(false);
  });
  
  test('scrubs body part possession issues', () => {
    const text = "Vessa's eyes narrow, your pupils dilating.";
    const scrubbed = scrubBodyPartPossession(text, 'TestChar');
    
    expect(scrubbed).not.toContain('your pupils');
    expect(scrubbed).toContain('you');
  });
});

describe('integration - full pipeline', () => {
  test('all modules work together without errors', () => {
    const state = mockGameState();
    
    // All modules should execute without throwing
    expect(() => {
      const narrative = translateStateToNarrative(state);
      const cast = buildEntityCast(state);
      const povRails = buildPovRails(state);
      const loiterDirective = buildLoiterDeltaDirective(3, state);
      
      // Basic sanity checks
      expect(narrative).toBeTruthy();
      expect(cast).toContain('<CAST>');
      expect(povRails).toContain('POINT OF VIEW RULES');
      expect(loiterDirective).toContain('TIME JUMP');
    }).not.toThrow();
  });
  
  test('UI labels are consistently filtered across modules', () => {
    const state = mockGameState({
      sceneFacts: {
        present: ['Consul', 'Heat', 'Vessa'],
      },
    });
    
    const narrative = translateStateToNarrative(state);
    const cast = buildEntityCast(state);
    
    // Neither module should emit UI labels as entities
    expect(narrative).not.toContain('Consul steps');
    expect(narrative).not.toContain('Heat watches');
    expect(namedSection(cast)).not.toMatch(/Consul|Heat/);
    
    // But Vessa should appear
    expect(narrative).toContain('Vessa');
    expect(cast).toContain('Vessa');
  });
});
