import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applyCharacterXpGain } from './characterXp';
import { commitTalkStageAfterTurn, runArcDirectorBeforeGm } from './arcDirector';
import { compileChoices, updateChoiceFingerprints } from './choiceCompiler';
import { calculateDiscoveryXp, discoveryXpAmount } from './discoveryXpLedger';
import { contractsForState } from './beatContract';

describe('playtest28a — ArcDirector + pacing', () => {
  it('New Game LitRPG defaults to 150 XP to level 2', () => {
    const state = createInitialState(undefined, 'litrpg');
    expect(state.character.xpToNext).toBe(150);
    const leveled = applyCharacterXpGain(state.character, 150);
    expect(leveled.levelsGained).toBe(1);
    expect(leveled.character.level).toBe(2);
  });

  it('ArcDirector commits Circle\'s Price stage on talk at T6+', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.campaignBibleId = 'summoned-pact';
    state.turn = 6;
    state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
    state.quests = [
      {
        id: 'sp-quest-1',
        name: "The Circle's Price",
        description: 'test',
        status: 'active',
        type: 'main',
        revealed: true,
        objectives: [
          { id: 'o1', description: 'bearings', completed: false },
          { id: 'o2', description: 'hear reason', completed: false },
          { id: 'o3', description: 'choose', completed: false },
        ],
      },
    ];
    state.arcDirector = { committedBeatIds: ['sp-beat-orient'] };
    state.openingEstablishment = { ...state.openingEstablishment!, pickedHook: 'A handler steps in with a shaking ledger.' };
    state.sceneFacts = { ...state.sceneFacts!, present: ['the handler'] };
    const arc = runArcDirectorBeforeGm(state, 'Ask who summoned me and why');
    // s74 M — the player's line alone commits nothing; the stage commits after the turn on the giver's speech.
    expect(arc.beatCommitted).toBe(false);
    // 28a — the Arc Director no longer pays XP; the quest step pays post-text in sandboxXp.
    expect(arc.xpAwards.length).toBe(0);
    expect(arc.state.quests?.find((x) => x.id === 'sp-quest-1')?.objectives?.some((o) => o.completed)).toBe(false);
    const heard = commitTalkStageAfterTurn(
      arc.state,
      [{ speakerId: 'role:handler', speaker: 'the handler', words: 'The rite was meant for someone else.' }],
      7
    );
    const q = heard.state.quests?.find((x) => x.id === 'sp-quest-1');
    expect(q?.objectives?.[1]?.completed).toBe(true);
    expect(heard.state.stateTxLog?.some((t) => t.kind === 'beat_commit')).toBe(true);
  });

  it('inspect awards XP once per evidence-id only', () => {
    const state = createInitialState();
    state.currentLocation = 'Ruin Hall';
    const ledger = new Map();
    const first = calculateDiscoveryXp('Inspect the cracked wall', state, ledger);
    expect(first?.amount).toBeGreaterThan(0);
    expect(first?.amount).toBe(discoveryXpAmount(state, 'object'));
    const updated = new Map([
      [
        first!.discoveryKey!,
        {
          key: first!.discoveryKey!,
          target: 'cracked wall',
          type: 'object' as const,
          context: 'ruin hall',
          turn: 1,
          xpAwarded: 5,
          inspectionCount: 1,
        },
      ],
    ]);
    const second = calculateDiscoveryXp('Inspect the cracked wall', state, updated);
    expect(second).toBeNull();
  });

  it('ChoiceCompiler cooldowns walk-away family after repeated use', () => {
    const state = createInitialState();
    state.turn = 20;
    state.arcDirector = {
      choiceFingerprints: updateChoiceFingerprints(
        ['Walk away', 'Walk away', 'Walk away'],
        19,
        []
      ),
    };
    const { choices, notes } = compileChoices(state, [
      'Walk away',
      'Ask a direct question',
      'Inspect the gate',
    ]);
    expect(choices.some((c) => /walk away/i.test(c))).toBe(false);
    expect(notes.some((n) => /Cooldown family/i.test(n))).toBe(true);
  });

  it('summoned-pact has at least 3 beat contracts', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.campaignBibleId = 'summoned-pact';
    expect(contractsForState(state).length).toBeGreaterThanOrEqual(3);
  });
});
