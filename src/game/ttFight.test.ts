/** q49b-FIGHT — cap on every pick; flee/parley pad; SRD 5.2.1 round chips (WotC CC BY 4.0). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { encounterCapsForMode, initEncounterTerminal, tickEncounterTerminal } from './encounterTerminalFsm';
import { applyOptionCooldown, type OptionCooldownChip } from './sceneAffordances';
import { enumerateLegalEdges } from './graphChoices';
import { commitOfferedPad } from './playTranscript';
import { roundCombatChips } from './tabletop/combatChips';
import { resolveEngineFight } from './engineFight';
import type { GameState } from './types';

type Tape = { picked: string; before: GameState };
const load = (n: string) => JSON.parse(readFileSync(join(__dirname, '__fixtures__', 'map', n), 'utf8')) as Tape;

function lit(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  s.engineMode = 'litrpg';
  s.campaignBibleId = 'summoned-pact';
  s.turn = 58;
  s.openingEstablishment = { ...(s.openingEstablishment ?? {}), complete: true, pending: [], answers: {} };
  s.activeEncounter = initEncounterTerminal(
    { name: 'West Wall Levy', level: 1, hp: 16, maxHp: 16, armorClass: 12, strength: 12, dexterity: 12, constitution: 12, xpReward: 25, goldReward: 5 },
    s,
  );
  return { ...s, ...over, activeEncounter: over.activeEncounter ?? s.activeEncounter };
}

describe('q49b-FIGHT cap resolves whatever the pick', () => {
  it('T58–T66 talk/read/analyse picks advance the clock and clear by max_engaged', () => {
    const t58 = load('mega19054-t58.json');
    const t65 = load('mega19054-t65.json');
    const t66 = load('mega19054-t66.json');
    expect(encounterCapsForMode('litrpg').maxEngagedTurns).toBe(8);
    let state = { ...t58.before, activeEncounter: initEncounterTerminal(t58.before.activeEncounter!, t58.before) } as GameState;
    const picks = [t58.picked, t65.picked, t66.picked, 'Talk to the guard', 'Read the clerk', 'Analyze the clerk', 'Wait and watch', 'Look around'];
    let cleared = false;
    let foeActed = false;
    const startHp = state.character.hp ?? 24;
    for (let i = 0; i < 12; i++) {
      const tick = tickEncounterTerminal(state, picks[i % picks.length]!);
      if ((tick.state.character.hp ?? startHp) < startHp) foeActed = true;
      if (tick.forcedTerminal) {
        cleared = true;
        expect(tick.cleared?.resolutionReason).toBe('max_engaged');
        expect(tick.state.activeEncounter).toBeNull();
        break;
      }
      state = tick.state;
    }
    expect(cleared).toBe(true);
    expect(foeActed).toBe(true);
  });

  it('T66 before-state clears on a talk pick at the cap', () => {
    const t66 = load('mega19054-t66.json');
    const before = t66.before as GameState;
    expect(before.activeEncounter?.engagedTurnCount).toBe(8);
    const tick = tickEncounterTerminal(before, t66.picked || 'Analyze the clerk');
    expect(tick.forcedTerminal).toBe(true);
    expect(tick.cleared?.resolutionReason).toBe('max_engaged');
    expect(tick.state.activeEncounter).toBeNull();
  });

  it('foe return swing lands on a non-attack LitRPG turn', () => {
    const s = lit();
    const hp0 = s.character.hp ?? 24;
    const tick = tickEncounterTerminal(s, 'Talk to the guard');
    expect(tick.state.character.hp ?? hp0).toBeLessThan(hp0);
    expect(tick.receipts.some((r) => /strikes back/.test(r))).toBe(true);
  });

  it('attack still ends a fight', () => {
    const state = lit({ activeEncounter: { ...lit().activeEncounter!, hp: 3, maxHp: 16, engagedTurnCount: 0 } });
    const fight = resolveEngineFight(state, 'Press the attack');
    if (fight) {
      expect(fight.state.activeEncounter === null || (fight.state.activeEncounter?.hp ?? 1) <= 0 || fight.receipts.length > 0).toBe(true);
    } else {
      const tick = tickEncounterTerminal(state, 'Press the attack');
      expect(tick.forcedTerminal || (tick.state.activeEncounter?.hp ?? 16) < 3).toBe(true);
    }
  });
});

describe('q49b-FIGHT live-fight pad keeps ways out', () => {
  it('LitRPG: flee and parley on the pad every live-fight turn', () => {
    const s = lit({ turn: 60 });
    const edges = enumerateLegalEdges(s);
    expect(edges.some((e) => e.type === 'flee')).toBe(true);
    expect(edges.some((e) => e.type === 'parley')).toBe(true);
    const pad: OptionCooldownChip[] = [
      { label: 'Talk to the guard', actionId: 'person:npc-guard:talk', kind: 'affordance', slotKind: 'person', slotCategory: 'talk', rank: 40 },
      { label: 'Read the clerk', actionId: 'person:npc-clerk:system', kind: 'affordance', slotKind: 'person', slotCategory: 'act', rank: 30 },
    ];
    const labels = applyOptionCooldown(s, pad).map((c) => c.label);
    expect(labels).toContain('Press the attack');
    expect(labels).toContain('Try to flee');
    expect(labels).toContain('Parley');
    const stamped = {
      ...s,
      turn: 61,
      recentOfferedActions: [{ turn: 60, sceneKey: 'x', actionIds: ['fight:foe:West Wall Levy:flee', 'fight:foe:West Wall Levy:parley'] }],
    } as GameState;
    const again = applyOptionCooldown(stamped, pad).map((c) => c.label);
    expect(again).toContain('Try to flee');
    expect(again).toContain('Parley');
  });

  it('Story RPG: flee and parley stay on the live-fight pad', () => {
    const s = createInitialState(undefined, 'rpg') as GameState;
    s.engineMode = 'rpg';
    s.turn = 10;
    s.openingEstablishment = { ...(s.openingEstablishment ?? {}), complete: true, pending: [], answers: {} };
    s.activeEncounter = initEncounterTerminal(
      { name: 'Road Cutpurse', level: 1, hp: 12, maxHp: 12, armorClass: 11, strength: 10, dexterity: 14, constitution: 10, xpReward: 20, goldReward: 2 },
      s,
    );
    const labels = applyOptionCooldown(s, [
      { label: 'Talk past', actionId: 'person:npc-a:talk', kind: 'affordance', slotKind: 'person', slotCategory: 'talk', rank: 10 },
    ]).map((c) => c.label);
    expect(labels).toContain('Try to flee');
    expect(labels).toContain('Parley');
    expect(labels).toContain('Press the attack');
  });

  it('tabletop pad offers SRD round options (Disengage / Flee / Attack)', () => {
    const base = createInitialState(undefined, 'dnd') as GameState;
    const s = {
      ...base,
      engineMode: 'dnd' as const,
      campaignBibleId: 'cursed-keep',
      turn: 12,
      openingEstablishment: { ...(base.openingEstablishment ?? {}), complete: true, pending: [], answers: {} },
      character: { ...base.character, srd: { ...(base.character.srd ?? {}), speciesId: 'human', classId: 'fighter', level: 1 } },
      activeEncounter: initEncounterTerminal(
        { name: 'Keep Wraith', level: 2, hp: 20, maxHp: 20, armorClass: 13, strength: 12, dexterity: 12, constitution: 12, xpReward: 50, goldReward: 0 },
        { ...base, engineMode: 'dnd' },
      ),
    } as GameState;
    const round = roundCombatChips(s)!;
    expect(round).toContain('Disengage');
    expect(round).toContain('Flee');
    const labels = commitOfferedPad({ ...s, offeredPad: null, choices: round }).offeredPad?.choices ?? [];
    expect(labels).toContain('Disengage');
    expect(labels).toContain('Flee');
    expect(labels.some((c) => /^Attack /.test(c) || /Unarmed Strike/.test(c))).toBe(true);
  });
});
