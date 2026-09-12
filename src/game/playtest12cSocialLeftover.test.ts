/**
 * Batch 12c — leftover social ledger on existing npcMemories[].
 * Merchant purchase memory, quest-giver force-exit, disposition pads.
 * Does not touch Phase 4 hooks / New Game preview. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { compileChoices } from './choiceCompiler';
import { compileGraphChoiceLabels } from './graphChoices';
import {
  applySocialLedgerTurn,
  isBuyPlayerAction,
  seedBibleNpcRoster,
} from './npcMemory';
import { summonedPact } from '@/data/campaigns/summonedPact';
import type { GameState, Quest } from './types';

function openedPact(partial: Partial<GameState> = {}): GameState {
  const state = createInitialState(undefined, 'litrpg');
  return {
    ...state,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    turn: 8,
    currentLocation: 'The Argent Ledger',
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax', where: 'The Argent Ledger' },
      complete: true,
      aloneArrival: false,
    },
    character: { ...state.character, name: 'Jax' },
    sceneFacts: emptySceneFacts(8),
    ...partial,
  };
}

function liveQuest(id: string, status: Quest['status'] = 'active'): Quest {
  return {
    id,
    name: id,
    description: 'test',
    status,
    type: 'side',
    revealed: true,
  };
}

describe('playtest12c — social leftover', () => {
  it('HUD/BUILD are 12c, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-12c');
    expect(BUILD_STAMP).toBe('2026-09-12c');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('merchant purchase is remembered and same-item Buy pads starve', () => {
    const seeded = seedBibleNpcRoster(openedPact({ npcMemories: [] }), summonedPact);
    const withNemi = {
      ...seeded,
      sceneFacts: {
        ...emptySceneFacts(8),
        present: ['Nemi Salt'],
      },
    };
    expect(isBuyPlayerAction('Buy the iron stamp from Nemi')).toBe(true);
    const next = applySocialLedgerTurn({
      state: withNemi,
      playerAction: 'Buy the iron stamp from Nemi',
      gainedItemNames: ['iron stamp'],
      turn: 9,
    });
    const nemi = next.npcMemories?.find((m) => /nemi/i.test(m.npcName));
    expect(nemi?.purchases?.some((p) => /iron stamp/i.test(p))).toBe(true);
    expect(nemi?.facts.some((f) => /Bought: iron stamp/i.test(f))).toBe(true);

    const compiled = compileChoices(next, [
      'Buy the iron stamp',
      'Ask about the mission board',
    ]);
    expect(compiled.choices.some((c) => /buy the iron stamp/i.test(c))).toBe(false);
    expect(compiled.choices.some((c) => /mission board/i.test(c))).toBe(true);
    expect(compiled.notes.some((n) => /Purchase memory drop/i.test(n))).toBe(true);
  });

  it('quest-giver exits CAST and Talk pads after accept', () => {
    const seeded = seedBibleNpcRoster(openedPact({ npcMemories: [] }), summonedPact);
    const withYara: GameState = {
      ...seeded,
      quests: [],
      sceneFacts: {
        ...emptySceneFacts(8),
        present: ['Yara Quill', 'Nemi Salt'],
      },
    };
    const next = applySocialLedgerTurn({
      state: withYara,
      playerAction: 'I accept the contract',
      questsBefore: [],
      questsAfter: [liveQuest('sp-quest-argent-license')],
      turn: 10,
    });
    const yara = next.npcMemories?.find((m) => /yara/i.test(m.npcName));
    expect(yara?.shouldExit).toBe(true);
    expect(yara?.exitReason).toBe('quest-accepted');
    expect(next.sceneFacts?.present).not.toContain('Yara Quill');
    expect(next.sceneFacts?.present).toContain('Nemi Salt');

    const stillPresent = {
      ...next,
      sceneFacts: { ...emptySceneFacts(10), present: ['Yara Quill'] },
    };
    const compiled = compileChoices(stillPresent, [
      'Talk to Yara Quill',
      'Wait and watch',
    ]);
    expect(compiled.choices.some((c) => /talk to yara/i.test(c))).toBe(false);
    expect(compileGraphChoiceLabels(stillPresent).some((c) => /talk to yara/i.test(c))).toBe(
      false
    );
  });

  it('hostile CAST starves kind pads; friendly CAST starves attack pads', () => {
    const hostile = openedPact({
      npcMemories: [
        {
          npcId: 'kessa',
          npcName: 'Kessa Cinder',
          disposition: 'hostile',
          facts: ['Bible roster: bounty-target'],
          lastSeenTurn: 8,
          roleHint: 'bounty-target',
        },
      ],
      sceneFacts: { ...emptySceneFacts(8), present: ['Kessa Cinder'] },
    });
    const kind = compileChoices(hostile, [
      'Offer help',
      'Leave the scene',
    ]);
    expect(kind.choices.some((c) => /offer help/i.test(c))).toBe(false);

    const friendly = openedPact({
      npcMemories: [
        {
          npcId: 'nemi',
          npcName: 'Nemi Salt',
          disposition: 'friendly',
          facts: ['Bible roster: merchant'],
          lastSeenTurn: 8,
          roleHint: 'merchant',
        },
      ],
      sceneFacts: { ...emptySceneFacts(8), present: ['Nemi Salt'] },
    });
    const hard = compileChoices(friendly, [
      'Attack Nemi Salt',
      'Ask about the mission board',
    ]);
    expect(hard.choices.some((c) => /attack nemi/i.test(c))).toBe(false);
    expect(hard.choices.some((c) => /mission board/i.test(c))).toBe(true);
  });

  it('does not fire during unfinished covers', () => {
    const state = openedPact({
      openingEstablishment: {
        pending: [{ id: 'who', kind: 'name', question: 'What may we call you?' }],
        answers: {},
        complete: false,
        aloneArrival: false,
      },
      npcMemories: [
        {
          npcId: 'yara',
          npcName: 'Yara Quill',
          disposition: 'neutral',
          facts: ['Bible roster: quest-patron'],
          lastSeenTurn: 0,
          roleHint: 'quest-patron',
        },
      ],
      sceneFacts: { ...emptySceneFacts(1), present: ['Yara Quill'] },
    });
    const next = applySocialLedgerTurn({
      state,
      playerAction: 'I accept the contract',
      questsBefore: [],
      questsAfter: [liveQuest('sp-quest-argent-license')],
      turn: 1,
    });
    expect(next.npcMemories?.[0]?.shouldExit).not.toBe(true);
    expect(next.sceneFacts?.present).toContain('Yara Quill');
  });
});
