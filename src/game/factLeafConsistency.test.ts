/**
 * Fact-leaf writer prompt and writer-fact chrome.
 * No paid inference. Default and legacy prompts stay on their own contracts.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { DUNGEON_CARD_BLUEPRINT, dungeonRoomFacts } from './dungeonCard';
import { engineResultFact, isChromeReceipt } from './engineResult';
import { buildFactSheet, formatFactSheetForWriter } from './factSheet';
import { buildCompletedEventPacket } from './completedEventPacket';
import { buildFactLeafSystemPrompt, buildMasterPrompt } from './masterPrompt';
import { buildDelayedConsequencesSituationSection, deliverConsequence } from './pyoaDelayedConsequences';
import { buildSystemPrompt as legacySystemPrompt } from './systemPrompt';
import { prepareWriterInputWithTownsfolk } from './townsfolk';
import type { DelayedConsequence } from './pyoaTypes';
import type { GameState, NpcMemory } from './types';
import { emptySceneFacts } from './sceneFacts';

function settings() {
  return { contentMode: 'adult' as const, perspective: 'third-person' as const };
}

function consequence(payload: DelayedConsequence['payload'], type: DelayedConsequence['type'] = 'ending_unlock'): DelayedConsequence {
  return {
    id: 'dc-test',
    sourceCrisisId: 'crisis',
    sourceForkId: 'fork',
    committedAtTurn: 4,
    dueAtTurn: 8,
    status: 'pending',
    type,
    payload,
  };
}

describe('fact-leaf system prompt', () => {
  it('drops numbered choices, the mechanics log, and state tags on the JSON leaf only', () => {
    const leaf = buildFactLeafSystemPrompt(createInitialState('The Summoned Pact', 'litrpg'), settings());
    expect(leaf).not.toContain('5. CHOICES (LAST');
    expect(leaf).not.toContain('3. MECHANICS LOG (after prose');
    expect(leaf).not.toContain('<item-gain name=');
    expect(leaf).not.toContain('<system-log>');
    expect(leaf).not.toContain('<system>Level Up');
    expect(leaf).not.toContain('1. Force the damaged door');
    expect(leaf).not.toContain('Always emit 3 or 4 options');
    expect(leaf).toContain('NEVER auto-complete');
    expect(leaf).toContain('Do not invent items');

    const table = buildFactLeafSystemPrompt(createInitialState('Salt Road', 'dnd'), settings());
    expect(table).toContain('Ask the player to roll or call for a check');
    expect(table).not.toContain('5. CHOICES (LAST');

    const pyoa = buildFactLeafSystemPrompt(createInitialState('Spine', 'pyoa'), settings());
    expect(pyoa).toContain('<campaign-ending />');
    expect(pyoa).not.toContain('5. CHOICES (LAST');

    const legacyMaster = buildMasterPrompt(createInitialState('Salt Road', 'dnd'), settings());
    expect(legacyMaster).toContain('3. MECHANICS LOG: none in tabletop — never write a <system-log>.');
    const legacyTags = legacySystemPrompt(createInitialState('The Summoned Pact', 'litrpg'), settings());
    expect(legacyTags).toContain('<item-gain');

    const hosted = readFileSync(resolve(__dirname, '../../supabase/functions/gm-turn/index.ts'), 'utf8');
    const direct = readFileSync(resolve(__dirname, './aiService.direct.ts'), 'utf8');
    expect(hosted).toContain('buildFactLeafSystemPrompt');
    expect(direct).toContain('buildFactLeafSystemPrompt');
    expect(hosted).toContain('<dungeon-load>');
    expect(hosted).toContain('newPlaces');
  });
});

describe('writer engine facts', () => {
  it('drops raw id receipts and keeps the player-facing beat, room line, and fight', () => {
    const fact = engineResultFact([
      'Fight: VICTORY vs the lurker in 2 rounds.',
      'Remembered: The gate stays shut.',
      'Fact: gate=shut',
      'Crisis unlocked: riot-id',
      'Ending unlocked: pyoa-end',
      'Dungeon room: Crypt, inside Keep. Ways on: Well.',
    ]);
    expect(fact).toContain('Fight: VICTORY');
    expect(fact).toContain('Remembered: The gate stays shut.');
    expect(fact).toContain('Dungeon room: Crypt');
    expect(fact).not.toMatch(/Fact:|Crisis unlocked:|Ending unlocked:/);
    expect(isChromeReceipt('Fact: gate=shut')).toBe(true);
    expect(isChromeReceipt('Remembered: The gate stays shut.')).toBe(false);
    expect(isChromeReceipt('Dungeon room: Crypt.')).toBe(false);
  });

  it('uses the stored narrative beat, and a blank beat uses the title the save already holds', () => {
    const state = { turn: 8, arcDirector: {} } as GameState;
    const told = deliverConsequence(
      consequence({
        unlockEndingId: 'pyoa-end' as DelayedConsequence['payload']['unlockEndingId'],
        narrativeBeat: 'The gate stays shut.',
        journalHint: 'gate',
      }),
      state
    );
    expect(told.receipts.some((line) => line.includes('The gate stays shut'))).toBe(true);
    expect(engineResultFact(told.receipts)).not.toMatch(/Ending unlocked:/);
    expect(engineResultFact(told.receipts)).toContain('The gate stays shut');

    const titled = {
      ...state,
      quests: [{ id: 'riot-id', name: 'The weigh-house riot', description: 'Held on the save.', status: 'active' as const, type: 'side' as const }],
    };
    const blank = deliverConsequence(
      consequence({
        unlockCrisisId: 'riot-id' as DelayedConsequence['payload']['unlockCrisisId'],
        narrativeBeat: '   ',
        journalHint: '',
      }, 'crisis_unlock'),
      titled
    );
    expect(blank.receipts.some((line) => line.startsWith('Crisis unlocked:'))).toBe(true);
    expect(blank.receipts.filter((line) => line.startsWith('Remembered:'))).toEqual(['Remembered: The weigh-house riot.']);
    expect(engineResultFact(blank.receipts)).toBe('Remembered: The weigh-house riot.');
    expect(engineResultFact(blank.receipts)).not.toMatch(/Crisis unlocked:/);
    expect(blank.receipts.some((line) => /the cold|remembered a/i.test(line))).toBe(false);

    const ending = deliverConsequence(
      consequence({
        unlockEndingId: 'pyoa-end' as DelayedConsequence['payload']['unlockEndingId'],
        narrativeBeat: '   ',
        journalHint: '',
      }),
      {
        ...state,
        quests: [{ id: 'pyoa-end', name: 'The quiet ending', description: 'Held on the save.', status: 'active' as const, type: 'main' as const }],
      }
    );
    expect(ending.receipts.filter((line) => line.startsWith('Remembered:'))).toEqual(['Remembered: The quiet ending.']);
    expect(engineResultFact(ending.receipts)).toContain('Remembered: The quiet ending.');
    expect(engineResultFact(ending.receipts)).not.toMatch(/Ending unlocked:/);

    const untitled = deliverConsequence(
      consequence({
        unlockCrisisId: 'riot-id' as DelayedConsequence['payload']['unlockCrisisId'],
        narrativeBeat: '   ',
        journalHint: '',
      }, 'crisis_unlock'),
      state
    );
    expect(engineResultFact(untitled.receipts)).toBe('');
    expect(untitled.receipts.some((line) => line.startsWith('Remembered:'))).toBe(false);

    const section = buildDelayedConsequencesSituationSection({
      turn: 8,
      arcDirector: { pyoaDelayedConsequences: [consequence({ narrativeBeat: '   ', journalHint: '' }, 'crisis_unlock')] },
    } as GameState);
    expect(section).toContain('crisis_unlock');
    expect(section).not.toMatch(/crisis_unlock:\s+\.\.\./);
    expect(section).not.toMatch(/the cold|the gate/i);
  });

  it('stores a relationship when the beat is blank and does not publish an empty Remembered line', () => {
    const state = { ...createInitialState('The Summoned Pact', 'pyoa'), turn: 8, arcDirector: {} };
    const blank = deliverConsequence(
      consequence(
        {
          relationshipDeltas: [{ npcId: 'Mira', aspect: 'trust', delta: 4, reason: 'kept their word' }],
          narrativeBeat: '   ',
          journalHint: '',
        },
        'relationship_shift'
      ),
      state
    );
    expect(blank.receipts.some((line) => line.startsWith('Remembered:'))).toBe(false);
    expect(engineResultFact(blank.receipts)).toBe('');
    expect(blank.state.arcDirector?.npcRelationships).toEqual(
      expect.arrayContaining([expect.objectContaining({ npcName: 'Mira', trust: 4 })])
    );

    const told = deliverConsequence(
      consequence(
        {
          relationshipDeltas: [{ npcId: 'Mira', aspect: 'trust', delta: 4, reason: 'kept their word' }],
          narrativeBeat: 'Mira remembers your help.',
          journalHint: 'Mira',
        },
        'relationship_shift'
      ),
      state
    );
    expect(told.receipts.filter((line) => line.startsWith('Remembered:'))).toEqual(['Remembered: Mira remembers your help.']);
    expect(engineResultFact(told.receipts)).toContain('Mira remembers your help.');
    expect(engineResultFact(told.receipts)).not.toMatch(/\btrust\b|\+4/i);
  });

  it('applies a health consequence to character hp and keeps the figure off the writer fact', () => {
    const base = createInitialState('The Summoned Pact', 'pyoa');
    const state = { ...base, turn: 8, character: { ...base.character, hp: 12 }, arcDirector: {} };
    const told = deliverConsequence(
      consequence(
        {
          resourceDeltas: [{ resourceId: 'health', delta: -3, reason: 'the old cut opens' }],
          narrativeBeat: 'The old cut opens.',
          journalHint: 'cut',
        },
        'penalty'
      ),
      state
    );
    expect(told.state.character.hp).toBe(9);
    expect(told.state.character).not.toHaveProperty('hitPoints');
    expect(told.receipts.some((line) => line.startsWith('HP:'))).toBe(true);
    expect(isChromeReceipt(told.receipts.find((line) => line.startsWith('HP:'))!)).toBe(true);
    expect(engineResultFact(told.receipts)).toContain('The old cut opens');
    expect(engineResultFact(told.receipts)).not.toMatch(/health:|HP:/i);

    const floored = deliverConsequence(
      consequence(
        {
          resourceDeltas: [{ resourceId: 'hp', delta: -5, reason: 'the cut' }],
          narrativeBeat: '   ',
          journalHint: '',
        },
        'penalty'
      ),
      { ...state, character: { ...state.character, hp: 2 } }
    );
    expect(floored.state.character.hp).toBe(0);
    expect(engineResultFact(floored.receipts)).toBe('');
  });
});

describe('sheets the writer already has', () => {
  it('shows motive and speech, hides the secret, and hides a tabletop quest step', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const secret = 'VAULT-SECRET-9f3c';
    const state: GameState = {
      ...base,
      currentLocation: 'Harbor hold',
      turn: 4,
      openingEstablishment: {
        pending: [],
        answers: { name: 'Jax', where: 'Harbor hold' },
        complete: true,
        sceneWritten: true,
        mode: 'weave',
        aloneArrival: false,
      },
      sceneFacts: { ...emptySceneFacts(4), present: ['Mira'] },
      npcMemories: [
        {
          npcId: 'mira',
          npcName: 'Mira',
          met: true,
          disposition: 'neutral',
          facts: [],
          lastSeenTurn: 4,
          location: 'Harbor hold',
          sheet: { job: 'apothecary', motive: 'keep the lamp', fear: 'the dark', speech: 'short', secret },
        } as unknown as NpcMemory,
      ],
      quests: [
        {
          id: 'lamp',
          name: 'The Lamp',
          status: 'active',
          revealed: true,
          objectives: [
            { description: 'OLD_STEP_9f', completed: true },
            { description: 'NEW_STEP_9f', completed: false },
          ],
        },
      ] as GameState['quests'],
    };
    const talk = prepareWriterInputWithTownsfolk(state, 'Tell Mira the lamp is out', {
      xp: 0,
      engineResult: 'Mira heard you.',
    });
    expect(talk.writerFacing).toContain('wants: keep the lamp');
    expect(talk.writerFacing).toContain('speaks: short');
    expect(talk.writerFacing).not.toContain(secret);
    const shown = formatFactSheetForWriter(buildFactSheet(state, buildCompletedEventPacket(state, 'Look around')));
    expect(shown).toContain('NEW_STEP_9f');
    expect(shown).not.toContain('OLD_STEP_9f');
    const tabletop = formatFactSheetForWriter(
      buildFactSheet({ ...state, engineMode: 'dnd' }, buildCompletedEventPacket({ ...state, engineMode: 'dnd' }, 'Look around'))
    );
    expect(tabletop).not.toContain('NEW_STEP_9f');
    expect(tabletop).not.toContain('The Lamp');
  });

  it('gives the writer revealed dungeon clues only', () => {
    const text = dungeonRoomFacts({
      activeDungeon: {
        blueprintId: DUNGEON_CARD_BLUEPRINT,
        dungeonName: 'Keep',
        currentNodeId: 'a',
        visitedNodeIds: ['a'],
        nodes: [
          {
            id: 'a',
            name: 'Crypt',
            connections: ['b'],
            hidden: {
              mobs: [],
              lootables: [],
              traps: [],
              secrets: [
                { id: 's1', clue: 'UNREVEALED_CLUE_9f', revealed: false },
                { id: 's2', clue: 'REVEALED_CLUE_9f', revealed: true },
              ],
            },
          },
          { id: 'b', name: 'Well', connections: ['a'], hidden: { mobs: [], lootables: [], traps: [], secrets: [] } },
        ],
      },
    } as unknown as GameState);
    expect(text).toContain('Dungeon room: Crypt');
    expect(text).toContain('Found: REVEALED_CLUE_9f');
    expect(text).toContain('Ways on: Well');
    expect(text).not.toContain('UNREVEALED_CLUE_9f');
  });
});
