/**
 * tt-fix-9 — one block per item:
 * 1. every engine grant reaches STATUS from the record (stateTx.commitTurnRecord): a finished quest, the Heroic
 *    Inspiration it earns, items and conditions — said once even when a feature line already names it;
 * 2. the sheet answer answers what was asked: a want gets the want, "who" gets the name, the engine role is never
 *    spoken, and a road-meeting stranger says the meeting's own want with an article.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest } from './types';
import { commitTurnRecord } from './stateTx';
import { motiveAnswer, motiveLinesFor } from './npcSheet';

function ck(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 4,
    houseRules: { ...(s.houseRules ?? {}), heroicInspiration: true } as GameState['houseRules'],
    character: { ...s.character, srd: { classId: 'rogue' } as unknown as GameState['character']['srd'], heroicInspiration: false, conditions: [] },
    inspirationKeys: [],
    sandboxAwardKeys: [],
    ...over,
  } as GameState;
}

const well = (done: boolean): Quest =>
  ({
    id: 'ck-spine-midnight-well',
    name: 'The Tainted Waters',
    status: done ? 'completed' : 'active',
    revealed: true,
    objectives: [
      { id: 'o1', description: 'Haul up the heavy bucket', completed: true },
      { id: 'o2', description: 'Investigate the sludge trail', completed: done },
    ],
  }) as unknown as Quest;

describe('1 — engine grants reach STATUS from the record', () => {
  const before = ck({ quests: [well(false)] });
  const finished = (over: Partial<GameState> = {}) =>
    ck({ turn: 5, quests: [well(true)], sandboxAwardKeys: ['quest-complete:ck-spine-midnight-well'], ...over });
  const stage = ['Quest stage: The Tainted Waters — Investigate the sludge trail'];

  it('a finished quest and the Heroic Inspiration it earns are both on STATUS the turn it finishes', () => {
    const out = commitTurnRecord(before, finished(), stage);
    expect(out.lines).toEqual(['Quest complete: The Tainted Waters', 'Heroic Inspiration: yours (quest complete)']);
    expect(out.state.character.heroicInspiration).toBe(true);
    expect(out.state.inspirationKeys).toContain('quest-complete:ck-spine-midnight-well');
  });

  it('one already held (one at a time) is still reported, as already held', () => {
    const held = { ...before, character: { ...before.character, heroicInspiration: true } };
    const out = commitTurnRecord(held, finished({ character: held.character }), stage);
    expect(out.lines).toContain('Heroic Inspiration: already held (quest complete)');
  });

  it('the next turn does not grant or report it again', () => {
    const first = commitTurnRecord(before, finished(), stage).state;
    const again = commitTurnRecord(first, { ...first, turn: 6 }, []);
    expect(again.lines).toEqual([]);
  });

  it('items and conditions the engine granted are reported; one a feature line already names is not said twice', () => {
    const potion = { id: 'p1', name: 'Potion of Healing', quantity: 1 } as unknown as GameState['inventory'][number];
    const after = ck({ turn: 5, inventory: [...before.inventory, potion], character: { ...before.character, conditions: ['Poisoned'] } });
    expect(commitTurnRecord(before, after, []).lines).toEqual(['Condition: Poisoned', 'Gained Potion of Healing']);
    expect(commitTurnRecord(before, after, ['Loot: Potion of Healing (cache)', 'HP: 9 → 0, Poisoned']).lines).toEqual([]);
  });

  it('a step line that names the quest does not hide its completion', () => {
    expect(commitTurnRecord(before, finished(), stage).lines[0]).toBe('Quest complete: The Tainted Waters');
  });
});

describe('2 — the engine answer is a spoken motive line (tt-build-npcmotive replaced sheetAnswerLine)', () => {
  const oda = {
    npcId: 'oda',
    npcName: 'Oda Thatch',
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 0,
    aliases: [],
    location: 'Greyhollow Church',
    sheet: { job: 'quest patron', motive: 'Protect the last family asset', fear: '', speech: '', secret: '', place: 'town' },
    motiveLines: motiveLinesFor('Protect the last family asset'),
  };
  const state = ck({ npcMemories: [oda] as unknown as GameState['npcMemories'] });

  it('speaks the sheet motive as a line, never the note or the engine role', () => {
    const line = motiveAnswer(state, ['Oda Thatch'])!.line;
    expect(line).toBe('"What little my house still owns, I will not let slip away," Oda Thatch said.');
    expect(line).not.toMatch(/quest patron|protect the last family asset/i);
  });

  it('a road-meeting stranger says the meeting want, with an article', () => {
    const road = ck({
      journey: {
        encounter: { kind: 'meeting', level: 1, stretch: 1, dangerous: false, want: 'word of someone gone missing', distanceFt: 40 },
      } as unknown as GameState['journey'],
    });
    expect(motiveAnswer(road, ['stranger'])!.line).toBe('"I want word of someone gone missing," the stranger said.');
  });
});
