/**
 * Engine timeline rows come from state the engine already holds.
 * Narrator tags, warden notes, and the scene beat are not facts and do not add people.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameEvent } from './parser';
import { formatSceneBlock } from './sceneBlock';
import { applyCollectedFacts, collectTurnTimelineFacts } from './timeline';
import { formatTimelineForPrompt } from './timelineFormat';
import type { GameState } from './types';

function state(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    turn: 4,
    currentLocation: 'Grey Yard',
    character: { ...s.character, name: 'Brin', hp: 10, maxHp: 12 },
    npcMemories: [],
    activeEncounter: null,
    activeDungeon: null,
    quests: [],
    timeline: [],
    placeVisitLog: null,
    ...over,
  };
}

function collect(
  before: GameState,
  after: Partial<GameState>,
  events: GameEvent[],
  extra: { wardenNotes?: string[]; sceneBeat?: string; newItemNames?: string[] } = {}
) {
  return collectTurnTimelineFacts({
    turn: 4,
    playerAction: 'Look',
    stateBefore: before,
    stateAfter: {
      currentLocation: after.currentLocation ?? before.currentLocation,
      activeEncounter: after.activeEncounter === undefined ? before.activeEncounter : after.activeEncounter,
      activeDungeon: after.activeDungeon === undefined ? before.activeDungeon : after.activeDungeon,
      character: after.character ?? before.character,
      quests: after.quests ?? before.quests,
    },
    events,
    systemLog: [],
    newItemNames: extra.newItemNames ?? [],
    wardenNotes: extra.wardenNotes,
    sceneBeat: extra.sceneBeat,
  });
}

const proseEvents: GameEvent[] = [
  { type: 'damage', amount: 99 },
  { type: 'heal', amount: 20 },
  { type: 'dungeon-exit' },
  { type: 'lore-card', name: 'Mara Voss', cardType: 'npc', summary: 'She waits in the fog with a secret.' },
  { type: 'world-deal', name: 'Salt Run' },
  { type: 'world-holding', name: 'Pier Shed' },
  { type: 'world-order', name: 'Pier Shed', order: 'profit' },
  { type: 'world-clock', name: 'Red Sails' },
  { type: 'world-actor', name: 'Mara Voss' },
  { type: 'time-pass', amount: 2 },
];

describe('engine-tagged timeline facts', () => {
  it('does not record narrator prose, warden notes, or unsupported tags', () => {
    const before = state();
    const facts = collect(before, {}, proseEvents, {
      wardenNotes: ['Writer words kept: Brin asked Mara Voss about the glass'],
      sceneBeat: 'Mara Voss stepped out of the fog and spoke.',
    });
    const blob = facts.map((f) => `${f.kind} ${f.text}`).join('\n');
    expect(blob).not.toMatch(/Player took|Player healed|Exited dungeon|Lore noted|Deal sealed|Holding claimed|Standing order|Rival clock|Off-screen actor|Time passed|Warden:|fog|secret|Mara/);
    expect(facts.some((f) => f.kind === 'person' || f.kind === 'said' || f.kind === 'scene' || f.kind === 'world' || f.kind === 'discovery')).toBe(false);
    const applied = applyCollectedFacts(before, facts);
    expect(applied.npcMemories ?? []).toEqual([]);
    expect(applied.sceneFacts?.present ?? []).not.toContain('Mara Voss');
  });

  it('records the engine HP change and a named dungeon leave, not the tag amounts', () => {
    const crypt = { blueprintId: 'dungeon-card', dungeonName: 'Grey Crypt' } as GameState['activeDungeon'];
    const before = state({ activeDungeon: crypt });
    const facts = collect(
      before,
      { character: { ...before.character, hp: 6 }, activeDungeon: null },
      [{ type: 'damage', amount: 99 }, { type: 'dungeon-exit' }, { type: 'dungeon-exit' }]
    );
    const damage = facts.filter((f) => f.kind === 'damage');
    expect(damage).toHaveLength(1);
    expect(damage[0]).toMatchObject({ name: 'Brin', detail: '4' });
    expect(damage[0]!.verb).toBeUndefined();
    expect(damage[0]!.text).toBe('Brin, 4');
    expect(damage[0]!.text).not.toMatch(/99|Player/);
    const left = facts.filter((f) => f.verb === 'left' && f.kind === 'place');
    expect(left).toHaveLength(1);
    expect(left[0]!.name).toBe('Grey Crypt');
    const applied = applyCollectedFacts(before, facts);
    expect(applied.timeline?.filter((f) => f.verb === 'left' && f.name === 'Grey Crypt')).toHaveLength(1);
    expect(applyCollectedFacts(applied, facts).timeline?.filter((f) => f.verb === 'left' && f.name === 'Grey Crypt')).toHaveLength(1);
    expect(applied.npcMemories ?? []).toEqual([]);
    const scene = formatSceneBlock(applied);
    expect(scene).toMatch(/damage: Brin, 4/);
    expect(scene).toMatch(/left: Grey Crypt/);
    expect(scene).not.toMatch(/Mara|Player took|Exited dungeon/);
    expect(formatTimelineForPrompt(applied.timeline)).toMatch(/\[damage\] Brin, 4/);
  });

  it('records a heal from the HP rise and skips a rise with no character name', () => {
    const before = state();
    const healed = collect(before, { character: { ...before.character, hp: 12 } }, [{ type: 'heal', amount: 20 }]);
    expect(healed.filter((f) => f.kind === 'heal')).toEqual([
      expect.objectContaining({ name: 'Brin', detail: '2', text: 'Brin, 2' }),
    ]);
    expect(healed.some((f) => /20|Player/.test(f.text))).toBe(false);
    const unnamed = state({ character: { ...before.character, name: '' } });
    const skipped = collect(unnamed, { character: { ...unnamed.character, hp: 12 } }, [{ type: 'heal', amount: 20 }]);
    expect(skipped.some((f) => f.kind === 'heal' || f.kind === 'damage')).toBe(false);
  });

  it('keeps arrive, quest, HP, leave, and item in that order', () => {
    const crypt = { blueprintId: 'dungeon-card', dungeonName: 'Grey Crypt' } as GameState['activeDungeon'];
    const before = state({ activeDungeon: crypt, quests: [] });
    const facts = collect(
      before,
      {
        currentLocation: 'Saltford',
        character: { ...before.character, hp: 9 },
        activeDungeon: null,
        quests: [{ id: 'q1', name: 'Salt Debt', type: 'side', description: '', objectives: [], status: 'active' } as never],
      },
      [
        { type: 'quest-add', id: 'q1', name: 'Salt Debt' },
        { type: 'damage', amount: 1 },
        { type: 'dungeon-exit' },
      ],
      { newItemNames: ['iron key'] }
    );
    expect(facts.map((f) => `${f.verb ?? f.kind}:${f.name}`)).toEqual([
      'arrived:Saltford',
      'accepted:Salt Debt',
      'damage:Brin',
      'left:Grey Crypt',
      'gained:iron key',
    ]);
  });

  it('records a leave and an HP drop from state when the narrator sent no such tag', () => {
    const crypt = { blueprintId: 'dungeon-card', dungeonName: 'Grey Crypt' } as GameState['activeDungeon'];
    const before = state({ activeDungeon: crypt });
    const facts = collect(before, { character: { ...before.character, hp: 8 }, activeDungeon: null }, []);
    expect(facts.map((f) => `${f.verb ?? f.kind}:${f.name}:${f.detail ?? ''}`)).toEqual([
      'damage:Brin:2',
      'left:Grey Crypt:',
    ]);
  });
});
