/**
 * tt-fix-8 — one test per item:
 * 1. a step chip is the step's own verb and object, never a sentence cut at a comma;
 * 2. a person with no backed lines still answers, from their own sheet;
 * 3. an engine chip the engine resolved is trusted by structure, not re-read from its words;
 * 4. "Help them" resolves the plea meeting;
 * 5. with no save loaded, a mode-bound setting is named with the modes it applies to.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { TABLETOP_MAIN_SPINES, tabletopSpineToStarterQuest } from '@/data/quests/tabletopMainSpines';
import { stepChip } from './choiceRanking';
import { repairMissingAnswer, type WriterTurnResult } from './writerTurn';
import { parsePlayerIntent } from './intentParser';
import { checkActionFollowed } from './turnCheck';
import { commitTravel, journeyPads } from './travelJourney';
import { settingScope } from './rules/modeProfile';
import type { CompletedEventPacket } from './completedEventPacket';

function ck(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 12,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    activeEncounter: null,
    ...over,
  } as GameState;
}

describe('1 — step chips come from the step record', () => {
  it('the midnight-well step chip is its verb and object, not the sentence up to a comma', () => {
    const spine = TABLETOP_MAIN_SPINES.find((s) => s.spineId === 'ck-spine-midnight-well')!;
    const seed = tabletopSpineToStarterQuest(spine);
    const first = { description: seed.objectives[0]!, ...seed.objectiveAnchors![0]! };
    expect(first.description).toMatch(/^Haul up the ruined, heavy bucket/);
    expect(stepChip(first)).toBe('Haul up the heavy bucket');
  });

  it('every tabletop spine step carries a verb and an object', () => {
    for (const spine of TABLETOP_MAIN_SPINES) {
      for (const anchor of tabletopSpineToStarterQuest(spine).objectiveAnchors ?? []) {
        expect(anchor?.verb && anchor.object).toBeTruthy();
      }
    }
  });
});

describe('2 — a person with no backed lines still answers', () => {
  it('Rosel Coyne answers from her own sheet, and nothing is asked of the writer', async () => {
    const rosel = { npcId: 'rosel', npcName: 'Rosel Coyne', disposition: 'neutral', facts: [], lastSeenTurn: 0, aliases: [], location: 'Greyhollow Church', sheet: { job: 'artisan' } };
    const state = ck({ currentLocation: 'Greyhollow Church', npcMemories: [rosel] as unknown as GameState['npcMemories'] });
    const packet = { refEnum: [{ id: 'r1', klass: 'person', display: 'Rosel Coyne' }] } as unknown as CompletedEventPacket;
    const playerInput = 'Talk to Rosel Coyne';
    const prose = 'The church was cold. Candles guttered by the door.';
    const asked: string[] = [];
    const turn = { prose, path: 'json-partial', outcome: 'accepted', problems: [], remaining: [], firstDraft: prose } as unknown as WriterTurnResult;
    const out = await repairMissingAnswer(turn, {
      packet,
      check: { state, playerInput, intent: parsePlayerIntent(playerInput, state), engineFact: '', previousGm: '' },
      repair: async (req) => {
        asked.push(req);
        return '';
      },
    });
    expect(asked).toEqual([]);
    expect(out.prose).toContain(`"I'm the artisan here at Greyhollow Church," Rosel Coyne said.`);
  });
});

describe('3 — an engine chip the engine resolved is trusted', () => {
  const before = ck({ currentLocation: 'Midnight Well' });
  const after = ck({ currentLocation: 'Midnight Well', completedEvent: { playerAction: 'Investigate the sludge trail' } as GameState['completedEvent'] });
  const prose = 'Jax crouched beside the well and kicked at the black muck on the stones.';
  const kinds = (offered: string[]) => checkActionFollowed(before, after, 'Investigate the sludge trail', prose, offered).down.map((f) => f.kind);

  it('picked from the menu and resolved: no word guessing', () => {
    expect(kinds(['Investigate the sludge trail', 'Walk on'])).toEqual([]);
  });

  it('typed: the words are still read', () => {
    expect(kinds([])).toContain('action-object-missing');
  });
});

describe('4 — "Help them" resolves the plea', () => {
  it('the plea is dealt with, STATUS says so, and the plea chips leave the menu', () => {
    const s = ck({
      currentLocation: 'On the road between places',
      journey: {
        from: 'Midnight Well',
        to: 'Greyhollow Inn',
        legsDone: 1,
        legsTotal: 2,
        ground: 'Back streets',
        encounter: { kind: 'plea', level: 1, stretch: 1, dangerous: false, want: 'a farmer begs help with a stuck cart' },
      } as GameState['journey'],
    });
    const out = commitTravel(s, 'Help them');
    expect(out.handled).toBe(true);
    expect(out.state.journey?.encounter?.engaged).toBe(true);
    expect(out.receipt).toMatch(/helped/);
    const pads = journeyPads({ ...out.state, turn: s.turn + 1 } as GameState);
    expect(pads).not.toContain('Help them');
    expect(pads).not.toContain('Pass them by');
  });
});

describe('5 — Settings with no save loaded', () => {
  it('names the modes a mode-bound section applies to', () => {
    expect(settingScope(undefined, (p) => p.mode === 'dnd')).toEqual({ show: true, modes: 'Tabletop' });
    expect(settingScope(undefined, (p) => p.autoFight).modes).toBe('LitRPG / Story RPG');
  });

  it('with a story loaded, shows only what its mode uses, unlabelled', () => {
    expect(settingScope('litrpg', (p) => p.mode === 'dnd')).toEqual({ show: false, modes: '' });
    expect(settingScope('dnd', (p) => p.mode === 'dnd')).toEqual({ show: true, modes: '' });
  });
});
