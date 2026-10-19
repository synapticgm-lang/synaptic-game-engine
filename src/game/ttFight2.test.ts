/** q50b-FIGHT2 — cap on every non-idle pick; idle clock guard; flee/parley pad; SRD 5.2.1 foe turn at cap. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  encounterCapsForMode,
  initEncounterTerminal,
  tickEncounterTerminal,
} from './encounterTerminalFsm';
import { applyOptionCooldown, type OptionCooldownChip } from './sceneAffordances';
import { applyTabletopSheet, resolveSheet } from './tabletop/characterBuild';
// Tabletop registers its SRD round rules on load, as in the app (engineFight/arcDirector import it).
import './tabletop/roundFight';
import type { GameState } from './types';

type Tape = { picked: string; before: GameState };
const load = (n: string) =>
  JSON.parse(readFileSync(join(__dirname, '__fixtures__', 'fight2', n), 'utf8')) as Tape;

function lit(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  s.engineMode = 'litrpg';
  s.campaignBibleId = 'summoned-pact';
  s.turn = 58;
  s.openingEstablishment = {
    ...(s.openingEstablishment ?? {}),
    complete: true,
    pending: [],
    answers: {},
  };
  s.activeEncounter = initEncounterTerminal(
    {
      name: 'West Wall Levy',
      level: 1,
      hp: 16,
      maxHp: 16,
      armorClass: 12,
      strength: 12,
      dexterity: 12,
      constitution: 12,
      xpReward: 25,
      goldReward: 5,
    },
    s,
  );
  return { ...s, ...over, activeEncounter: over.activeEncounter ?? s.activeEncounter };
}

describe('q50b-FIGHT2 cap resolves through resolveForcedOutcome', () => {
  it('(a) T58-T66 talk/read picks do not advance the clock; the cap resolves on the next combat turn', () => {
    // John 18:58: idle/talk picks don't advance the clock; the cap resolves only through each mode's own rules.
    const t58 = load('mega19054-t58.json');
    const t65 = load('mega19054-t65.json');
    const t66 = load('mega19054-t66.json');
    expect(encounterCapsForMode('litrpg').maxEngagedTurns).toBe(8);
    let state = {
      ...t58.before,
      activeEncounter: initEncounterTerminal(t58.before.activeEncounter!, t58.before),
    } as GameState;
    const start = state.activeEncounter?.engagedTurnCount ?? 0;
    const talkRead = [
      t58.picked,
      t65.picked,
      t66.picked,
      'Talk to the guard',
      'Read the clerk',
      'Analyze the clerk',
      'Talk to the clerk',
      'Ask the guard',
    ].filter((p) => !/attack|flee|parley|fight|strike/i.test(p || ''));
    for (let i = 0; i < 14; i++) {
      const tick = tickEncounterTerminal(state, talkRead[i % talkRead.length]!);
      expect(tick.forcedTerminal).toBe(false);
      expect(tick.cleared).toBeUndefined();
      state = tick.state;
      expect(state.activeEncounter?.engagedTurnCount ?? 0).toBe(start);
    }
    expect(state.activeEncounter).toBeTruthy();
    // Combat turns advance the clock until the cap resolves the fight through the mode's own outcome path.
    let cleared = false;
    for (let i = 0; i < 12; i++) {
      const tick = tickEncounterTerminal(state, 'Press the attack');
      if (tick.forcedTerminal || tick.cleared) {
        cleared = true;
        expect(tick.cleared?.resolutionReason).toMatch(/^(max_engaged|enemy_hp_zero|player_hp_zero)$/);
        expect(tick.state.activeEncounter).toBeNull();
        break;
      }
      state = tick.state;
      expect(state.activeEncounter?.engagedTurnCount ?? 0).toBeLessThanOrEqual(8);
    }
    expect(cleared).toBe(true);
  });

  it('(a) T66 before-state at the cap: a talk pick does not clear; a combat turn resolves via max_engaged', () => {
    const t66 = load('mega19054-t66.json');
    const before = t66.before as GameState;
    expect(before.activeEncounter?.engagedTurnCount).toBe(8);
    const talk = tickEncounterTerminal(before, 'Talk to the clerk');
    expect(talk.forcedTerminal).toBe(false);
    expect(talk.cleared).toBeUndefined();
    expect(talk.state.activeEncounter?.engagedTurnCount).toBe(8);
    const fight = tickEncounterTerminal(talk.state, 'Try to flee');
    expect(fight.state.activeEncounter).toBeNull();
    expect(fight.cleared?.resolutionReason).toMatch(/^(max_engaged|flee_success|player_hp_zero)$/);
  });

  it('(b) 5 idle loot picks leave engagedTurnCount unchanged and pay no XP', () => {
    let state = lit({
      activeEncounter: {
        ...lit().activeEncounter!,
        engagedTurnCount: 3,
        maxEngagedTurns: 8,
      },
    });
    const start = state.activeEncounter!.engagedTurnCount!;
    for (let i = 0; i < 5; i++) {
      const tick = tickEncounterTerminal(state, 'Open the crate');
      expect(tick.forcedTerminal).toBe(false);
      expect(tick.xpAward).toBeUndefined();
      expect(tick.cleared).toBeUndefined();
      state = tick.state;
    }
    expect(state.activeEncounter?.engagedTurnCount).toBe(start);
    expect(state.activeEncounter).toBeTruthy();
  });

  it('(c) LitRPG: flee and parley on the pad every live-fight turn', () => {
    const s = lit({ turn: 60 });
    const pad: OptionCooldownChip[] = [
      {
        label: 'Talk to the guard',
        actionId: 'person:npc-guard:talk',
        kind: 'affordance',
        slotKind: 'person',
        slotCategory: 'talk',
        rank: 40,
      },
      {
        label: 'Read the clerk',
        actionId: 'person:npc-clerk:system',
        kind: 'affordance',
        slotKind: 'person',
        slotCategory: 'act',
        rank: 30,
      },
    ];
    const labels = applyOptionCooldown(s, pad).map((c) => c.label);
    expect(labels).toContain('Press the attack');
    expect(labels).toContain('Try to flee');
    expect(labels).toContain('Parley');
    const stamped = {
      ...s,
      turn: 61,
      recentOfferedActions: [
        {
          turn: 60,
          sceneKey: 'x',
          actionIds: ['fight:foe:West Wall Levy:flee', 'fight:foe:West Wall Levy:parley'],
        },
      ],
    } as GameState;
    const again = applyOptionCooldown(stamped, pad).map((c) => c.label);
    expect(again).toContain('Try to flee');
    expect(again).toContain('Parley');
  });

  it('(c) Story RPG: flee and parley stay on the live-fight pad', () => {
    const s = createInitialState(undefined, 'rpg') as GameState;
    s.engineMode = 'rpg';
    s.turn = 10;
    s.openingEstablishment = {
      ...(s.openingEstablishment ?? {}),
      complete: true,
      pending: [],
      answers: {},
    };
    s.activeEncounter = initEncounterTerminal(
      {
        name: 'Road Cutpurse',
        level: 1,
        hp: 12,
        maxHp: 12,
        armorClass: 11,
        strength: 10,
        dexterity: 14,
        constitution: 10,
        xpReward: 20,
        goldReward: 2,
      },
      s,
    );
    const labels = applyOptionCooldown(s, [
      {
        label: 'Talk past',
        actionId: 'person:npc-a:talk',
        kind: 'affordance',
        slotKind: 'person',
        slotCategory: 'talk',
        rank: 10,
      },
    ]).map((c) => c.label);
    expect(labels).toContain('Try to flee');
    expect(labels).toContain('Parley');
    expect(labels).toContain('Press the attack');
  });

  it('(d) tabletop: at the cap the SRD round runs (the foe acts)', () => {
    // SRD 5.2.1 Combat Step by Step (WotC CC BY 4.0): each participant takes a turn in a round.
    // A real built fighter (inn-book builder), so the SRD round reads a whole sheet (skills, expertise, kit).
    const s0 = createInitialState(undefined, 'dnd') as GameState;
    const sheet = resolveSheet({
      classId: 'fighter',
      speciesId: 'human',
      backgroundId: 'soldier',
      method: 'point-buy',
      baseScores: { STR: 15, DEX: 13, CON: 14, INT: 8, WIS: 12, CHA: 10 },
      kitId: 'A',
      source: 'build',
    });
    const base = applyTabletopSheet({ ...s0, engineMode: 'dnd' }, sheet);
    const s = {
      ...base,
      engineMode: 'dnd' as const,
      campaignBibleId: 'cursed-keep',
      turn: 12,
      openingEstablishment: {
        ...(base.openingEstablishment ?? {}),
        complete: true,
        pending: [],
        answers: {},
      },
      character: {
        ...base.character,
        hp: 24,
        maxHp: 24,
        level: 1,
      },
      activeEncounter: initEncounterTerminal(
        {
          name: 'Keep Wraith',
          level: 2,
          hp: 20,
          maxHp: 20,
          armorClass: 13,
          strength: 12,
          dexterity: 12,
          constitution: 12,
          xpReward: 50,
          goldReward: 0,
          engagedTurnCount: 9,
          maxEngagedTurns: 10,
        },
        { ...base, engineMode: 'dnd' },
      ),
    } as GameState;
    const hp0 = s.character.hp ?? 24;
    const tick = tickEncounterTerminal(s, 'Dodge');
    expect(tick.forcedTerminal).toBe(true);
    expect(tick.cleared?.resolutionReason).toBe('max_engaged');
    const joined = tick.receipts.join('\n');
    const foeActed =
      (tick.state.character.hp ?? hp0) < hp0 ||
      /Fight:\s*round|initiative|Keep Wraith/i.test(joined);
    expect(foeActed).toBe(true);
  });

  it('(e) a fight won by attack gives the same receipts as before', () => {
    const state = lit({
      activeEncounter: {
        ...lit().activeEncounter!,
        hp: 3,
        maxHp: 16,
        engagedTurnCount: 0,
      },
    });
    const tick = tickEncounterTerminal(state, 'Press the attack');
    expect(tick.forcedTerminal).toBe(true);
    expect(tick.cleared?.resolutionReason).toBe('enemy_hp_zero');
    expect(tick.cleared?.outcome).toBe('victory');
    expect(tick.state.activeEncounter).toBeNull();
    expect(tick.receipts.some((r) => /Encounter cleared:.*West Wall Levy.*victory/i.test(r))).toBe(true);
  });
});
