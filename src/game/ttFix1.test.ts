/**
 * Tabletop fix 1 (mode-tt lap 2 §8) — one test per root:
 * 1. a step heard from a person never ticks on a beat timer; tabletop steps tick from play and get a chip;
 * 2. STATUS shows the fight's rounds; the writer's fact carries the round and the dying state;
 * 3. a trip line naming its destination is not the place left; "the only way out is through" is no exit
 *    count; the answer repair asks the person the player spoke to;
 * 4. "Go back to X" travels;
 * 5. no fight spawns on a line spoken to someone here; spawn wording follows the place.
 * 6. a stable death save moves the clock; no quest nudge while dying.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest } from './types';
import { talkStepPerson } from './questGiver';
import { applyTabletopQuestTurn, tabletopStepChip } from './tabletopQuestProgress';
import { objectiveChip, nudgeIfStuck } from './choiceRanking';
import { runArcDirectorBeforeGm, shouldSpawnCombat } from './arcDirector';
import { filterSystemLogForEngine } from './systemLog';
import { resolveDeathSaveTurn } from './tabletop/roundFight';
import { isStaleLocationBleed } from './sceneContextTail';
import { wrongExitCountProblem } from './exitCount';
import { repairMissingAnswer, type WriterTurnResult } from './writerTurn';
import { parsePlayerIntent } from './intentParser';
import { parseTravelDestination } from './outdoorHubs';
import { playerCommittedArrivalTravel } from './travelAuthority';
import { autoFightSpawnPreface, scrubCombatSpawnLog } from './combatAuthority';
import type { CompletedEventPacket } from './completedEventPacket';

const ckQuest = (done: boolean[] = []): Quest =>
  ({
    id: 'ck-quest-1',
    name: "The Woodcutter's Plea",
    description: 'Find Lina.',
    status: 'active',
    type: 'main',
    revealed: true,
    objectives: [
      'Speak with Oskar at the Greyhollow Tavern',
      'Examine the keep gate (the chain has been broken by Oskar already)',
      "Search the keep's ground floor for signs of Lina (Perception/Investigation checks)",
    ].map((description, i) => ({ id: `o${i}`, description, completed: !!done[i] })),
  }) as unknown as Quest;

function ck(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 6,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    quests: [ckQuest()],
    currentLocation: 'Greyhollow Inn',
    activeEncounter: null,
    ...over,
  } as GameState;
}

describe('root 1 — tabletop quest steps', () => {
  it('reads the person a talk step is heard from', () => {
    expect(talkStepPerson('Speak with Oskar at the Greyhollow Tavern')).toBe('Oskar');
    expect(talkStepPerson('Examine the keep gate')).toBeNull();
  });

  it('the director never ticks "Speak with Oskar" on its own', () => {
    const s = ck({ turn: 3, currentLocation: 'Keep Gate' });
    const out = runArcDirectorBeforeGm(s, 'Look around');
    const q = (out.state.quests ?? []).find((x) => x.id === 'ck-quest-1');
    expect(q?.objectives?.[0]?.completed).toBe(false);
  });

  it('keeps a long step whole when its aside is dropped', () => {
    expect(objectiveChip('Examine the keep gate (the chain has been broken by Oskar already)')).toBe('Examine the keep gate');
  });

  it('offers and ticks the gate step at Keep Gate without paying for the talk', () => {
    const s = ck({ currentLocation: 'Keep Gate' });
    expect(tabletopStepChip(s)).toBe('Examine the keep gate');
    const out = applyTabletopQuestTurn(s, 'Examine the keep gate');
    const obj = out.state.quests![0]!.objectives!;
    expect(obj[1]!.completed).toBe(true);
    expect(obj[0]!.completed).toBe(false);
    expect(out.receipts.join(' ')).toMatch(/^Quest stage: The Woodcutter's Plea — Examine the keep gate/);
  });

  it('does not tick the gate step anywhere else', () => {
    const s = ck({ currentLocation: 'Greyhollow Inn' });
    expect(applyTabletopQuestTurn(s, 'Examine the keep gate').receipts).toEqual([]);
  });
});

describe('root 2 — the fight on STATUS and in the fact', () => {
  it('keeps tabletop round lines with their rolls on STATUS', () => {
    const round = 'Round 2 — you hit the Shadow Cutthroat (d20 14 + 5 vs AC 13, 7 damage); Dex save d20 8 + 1 vs DC 12 — failure';
    const lines = filterSystemLogForEngine([round, 'Death save: d20 12 — success (1 of 3)'], 'dnd');
    expect(lines).toContain(round);
    expect(lines.some((l) => l.startsWith('Death save:'))).toBe(true);
  });

  it('tells the writer the PC is unconscious while making death saves', () => {
    const s = ck({ character: { ...ck().character, hp: 0, conditions: ['Unconscious'] }, deathSaves: { successes: 0, failures: 0 } });
    const r = resolveDeathSaveTurn(s, () => 0.5)!;
    expect(r.facts).toMatch(/unconscious on the ground and cannot move, speak or act/);
    expect(r.facts).not.toMatch(/\bHP\b/);
  });
});

describe('root 3 — repairs that drop or miss the right line', () => {
  it('a trip line naming its destination is not the place left', () => {
    const s = ck({
      turn: 9,
      currentLocation: 'On the road between places',
      previousLocationSheet: { name: 'Greyhollow Graveyard' } as GameState['previousLocationSheet'],
      journey: { from: 'Greyhollow Graveyard', to: 'Greyhollow Inn', legsDone: 0, legsTotal: 2, ground: 'Back streets' } as GameState['journey'],
      log: [{ id: 'p9', role: 'player', content: 'Travel toward Greyhollow Inn', turn: 9 }] as GameState['log'],
    });
    expect(isStaleLocationBleed(s, 'They continued on the back streets, heading toward the Greyhollow Inn as night settled deeper.')).toBe(false);
    expect(isStaleLocationBleed(s, 'They stood in Greyhollow Graveyard again.')).toBe(true);
  });

  it('"the only way out now was through it" is not a count of exits', () => {
    const s = ck({ currentLocation: 'Keep Gate', completedEvent: { engineResult: 'Exits: the ways out lead to Greyhollow Inn, Keep Courtyard.' } as GameState['completedEvent'] });
    expect(wrongExitCountProblem(s, 'The foe blocked the gate, and the only way out now was through it.')).toBeNull();
    expect(wrongExitCountProblem(s, 'The only way out was the road to the inn.')).not.toBeNull();
  });

  async function repairFor(prose: string, backed = true) {
    const tilde = { npcId: 'tilde', npcName: 'Tilde', disposition: 'neutral', facts: [], lastSeenTurn: 0, aliases: [], sheet: { motive: 'Keep the inn quiet tonight' } };
    const lore = { id: 'lore-tilde', name: 'Tilde', type: 'npc', keywords: ['Tilde'], summary: 'Tilde keeps the inn quiet after dark.' };
    const state = ck(
      backed
        ? { npcMemories: [tilde] as unknown as GameState['npcMemories'], lorebook: [lore] as GameState['lorebook'] }
        : { npcMemories: [tilde] as unknown as GameState['npcMemories'] }
    );
    const packet = { refEnum: [{ id: 't1', klass: 'person', display: 'Tilde' }, { id: 't2', klass: 'person', display: 'Edda' }] } as unknown as CompletedEventPacket;
    const playerInput = 'Talk to Tilde';
    const asked: string[] = [];
    const turn = { prose, path: 'json-partial', outcome: 'accepted', problems: [], remaining: [], firstDraft: prose } as unknown as WriterTurnResult;
    await repairMissingAnswer(turn, {
      packet,
      check: { state, playerInput, intent: parsePlayerIntent(playerInput, state), engineFact: '', previousGm: '' },
      repair: async (req) => {
        asked.push(req);
        return '';
      },
    });
    return asked;
  }

  it('asks Tilde, not Edda, when only Edda answered the player who spoke to Tilde', async () => {
    const asked = await repairFor('Edda looked up from the bar. "We close at midnight," Edda said.');
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain('People here: Tilde');
    expect(asked[0]).not.toContain('Edda;');
    expect(asked[0]).toContain('Known to say: Tilde: Tilde keeps the inn quiet after dark.');
    expect(asked[0]).not.toMatch(/wants keep the inn/);
  });

  it('tt-fix-4: with no backed line for Tilde, nothing is asked (the skip path)', async () => {
    expect(await repairFor('Edda looked up from the bar. "We close at midnight," Edda said.', false)).toEqual([]);
  });

  it('leaves the beat alone when Tilde answered', async () => {
    expect(await repairFor('Tilde looked up. "Not tonight," she said.')).toEqual([]);
  });
});

describe('root 4 — "Go back to X"', () => {
  it('travels to the named place', () => {
    expect(parseTravelDestination('Go back to Greyhollow Inn', 'cursed-keep')?.name).toBe('Greyhollow Inn');
    expect(playerCommittedArrivalTravel('Go back to Greyhollow Inn')).toBe(true);
  });
});

describe('root 5 — spawns', () => {
  it('no drought fight on a line spoken to someone here', () => {
    const s = ck({
      turn: 17,
      currentLocation: 'Greyhollow Graveyard',
      arcDirector: { turnsSinceCombatReceipt: 30 } as GameState['arcDirector'],
      sceneFacts: { ...(ck().sceneFacts ?? {}), present: ['Agna Hollin'], lastBeat: '', props: [], crowd: 'unknown', noise: 'unknown', updatedTurn: 16 } as GameState['sceneFacts'],
    });
    expect(shouldSpawnCombat(s, 'Talk to Agna Hollin')).toBe(false);
    expect(shouldSpawnCombat(s, 'Look around')).toBe(true);
  });

  it('a room only indoors, and the line still leaves the story body', () => {
    expect(autoFightSpawnPreface('Shadow Cutthroat', 'Market Square', undefined, 'outdoor')).toBe(
      'Shadow Cutthroat pushes into Market Square from the edge of the open ground and commits toward you.'
    );
    const neutral = autoFightSpawnPreface('Shadow Cutthroat', 'Greyhollow Graveyard', undefined, null);
    expect(neutral).toBe('Shadow Cutthroat pushes into Greyhollow Graveyard and commits toward you.');
    expect(autoFightSpawnPreface('Shadow Cutthroat', 'Cellar')).toMatch(/edge of the room/);
    expect(scrubCombatSpawnLog(`${neutral} Rain fell.`)).toBe('Rain fell.');
  });
});

describe('item 6 — dying', () => {
  it('a stable death save moves the clock to when the PC wakes', () => {
    const s = ck({ character: { ...ck().character, hp: 0, conditions: ['Unconscious'] }, deathSaves: { successes: 2, failures: 0 } });
    const r = resolveDeathSaveTurn(s, () => 0.5)!;
    expect(r.state.character.hp).toBe(1);
    expect(r.receipts.some((l) => l.startsWith('Time: '))).toBe(true);
  });

  it('no quest nudge while the PC lies dying', () => {
    const s = ck({
      turn: 20,
      character: { ...ck().character, hp: 0 },
      deathSaves: { successes: 0, failures: 1 },
      circling: { since: 1, lastNudgeTurn: 0 } as unknown as GameState['circling'],
    });
    expect(nudgeIfStuck(s).receipts).toEqual([]);
  });
});
