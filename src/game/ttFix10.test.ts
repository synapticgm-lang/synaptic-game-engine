/**
 * tt-fix-10 — one block per item:
 * 1. a repeated habit is the narrator's own content run, not a grammar frame or a person's quoted words;
 * 2. factCheck reads who is here and what is held from the engine's records (lap 13 A T9 traveller, F T19 axe);
 * 3. a road meeting's own chip takes on that meeting, even with a director spawn waiting (lap 13 A T21 skirt);
 * 4. a record's own outcomes all settle it: a meeting passed by, a foe escaped from, an escorted person who goes
 *    along, the answer to the person the player spoke to;
 * 5. the cursed-keep quests lead into the keep: the trip there, then a step taken inside it.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createInitialState } from './defaults';
import type { GameState, Quest } from './types';
import { checkPlayCrimes } from './turnCheck';
import { resolveEngineFight } from './engineFight';
import { commitTravel } from './travelJourney';
import { tickEncounterTerminal } from './encounterTerminalFsm';
import { applyTabletopQuestTurn } from './tabletopQuestProgress';
import { storyChip } from './choiceRanking';
import { maybeEnterInteriorDungeon, objectiveOpensInterior } from './enterInterior';
import { tokenLineVerdicts } from './tokenProse';
import type { CompletedEventPacket } from './completedEventPacket';
import { TABLETOP_MAIN_SPINES, tabletopSpineToStarterQuest } from '@/data/quests/tabletopMainSpines';

function ck(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 9,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    activeEncounter: null,
    ...over,
  } as GameState;
}

const gm = (content: string) => ({ id: `g${content.length}`, role: 'gm', content, timestamp: 0 }) as GameState['log'][number];

describe('1 — a repeated habit is the narrator\'s content run', () => {
  const flags = (earlier: string, now: string) => {
    const before = ck({ log: [gm(earlier)] });
    return checkPlayCrimes(before, before, 'Look around', now).down.filter((f) => f.kind === 'repeated-habit');
  };

  it('a grammar frame ("and stopped in front of") is not a habit (lap 13 A T16)', () => {
    expect(flags('Jax crossed the yard and stopped in front of the well.', 'The cart rolled on and stopped in front of the chapel.')).toEqual([]);
  });

  it('a person saying their words again is not the narrator\'s habit (lap 13 D T16)', () => {
    expect(
      flags('"Mind the graves along the north wall," Agna said.', '"I told you, the graves along the north wall are open," Agna said.'),
    ).toEqual([]);
  });

  it('the narrator reusing a content run still is', () => {
    expect(
      flags('Cold mist curled around broken headstones near the gate.', 'Again the cold mist curled around broken headstones by the wall.'),
    ).toHaveLength(1);
  });
});

describe('2 — factCheck reads the engine\'s records', () => {
  const RUNS = resolve('scripts/fate-autoplay/runs');
  const A = '2026-10-14T20-41-34-390Z_cursed-keep_chilled-gm_s875';
  const F = '2026-10-14T20-41-54-522Z_cursed-keep_chilled-gm_s943';
  const flagsAt = async (run: string, turn: number) => {
    const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
      checkTurn: (row: unknown, packet: string, page?: string) => Array<{ kind: string; quote: string }>;
      pageOne: (dir: string) => string;
    };
    const dir = join(RUNS, run);
    const rows = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { turn: number; gmText?: string });
    const pf = join(dir, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`);
    const page = [mod.pageOne(dir), ...rows.filter((r) => r.turn < turn).map((r) => r.gmText ?? '')].join('\n');
    return mod.checkTurn(rows.find((r) => r.turn === turn), existsSync(pf) ? readFileSync(pf, 'utf8') : '', page);
  };
  const have = existsSync(join(RUNS, A)) && existsSync(join(RUNS, F));

  it.skipIf(!have)('a lone traveller the HERE record does not hold is caught (packet "may be about" prose is not a record)', async () => {
    const flags = await flagsAt(A, 9);
    expect(flags.some((f) => f.kind === 'person' && /single traveler/.test(f.quote))).toBe(true);
  });

  it.skipIf(!have)('"their axe" is the greataxe the item record holds', async () => {
    expect(await flagsAt(F, 19)).toEqual([]);
  });
});

describe('3 — a road meeting\'s own chip takes on that meeting', () => {
  const camp = {
    from: 'Keep Gate', to: 'Blackspine Treeline', legsDone: 2, legsTotal: 3, ground: 'Forest path', terrain: 'forest',
    encounter: { kind: 'camp', level: 2, stretch: 2, dangerous: true, miniBoss: true, want: 'to know if you are trouble', distanceFt: 20 },
  };
  const spawn = {
    name: 'Lantern Pilgrim', hp: 14, maxHp: 14, level: 2, phase: 'pending', source: 'DND-ELITE-010',
  };
  const chip = 'Skirt around the camp, but fail and they attack';

  it('"Skirt around the camp" rolls the slip past, not an attack on the waiting spawn (lap 13 A T21)', () => {
    const base = ck({ turn: 21, currentLocation: 'On the road between places', journey: camp } as unknown as Partial<GameState>);
    const withSpawn = { ...base, sceneFacts: { ...(base.sceneFacts ?? {}), pendingEncounter: spawn } } as unknown as GameState;
    const checkOf = (r: ReturnType<typeof resolveEngineFight>) =>
      (r?.receipts ?? []).find((l) => /check:/i.test(l))?.replace(/d20 .*$/, '') ?? '';
    const busy = resolveEngineFight(withSpawn, chip);
    expect(checkOf(busy)).toBe(checkOf(resolveEngineFight(base, chip)));
    expect(checkOf(busy)).toMatch(/^Flee check/);
    expect(JSON.stringify(busy?.receipts ?? [])).not.toMatch(/Lantern Pilgrim|Attack/);
  });
});

describe('4 — a record\'s own outcomes all settle it', () => {
  it('"Pass them by" settles the plea: passed by, no help chip left (lap 13)', () => {
    const s = ck({
      turn: 12,
      currentLocation: 'On the road between places',
      journey: {
        from: 'Greyhollow Inn', to: 'Keep Gate', legsDone: 1, legsTotal: 3, ground: 'Hill path', terrain: 'road',
        encounter: { kind: 'plea', level: 1, stretch: 1, dangerous: false, want: 'a lost child' },
      },
    } as unknown as Partial<GameState>);
    const out = commitTravel(s, 'Pass them by');
    expect(out.state.journey?.encounter).toMatchObject({ escaped: true, closedTurn: 12 });
    expect(out.receipt).toMatch(/passed by/);
    const help = commitTravel(s, 'Help them');
    expect(help.state.journey?.encounter).toMatchObject({ engaged: true });
  });

  it('a foe the player escaped from leaves the scene; a beaten one leaves with lastKill (lap 13 E T19-20)', () => {
    const foe = { name: 'Shadow Cutthroat', hp: 9, maxHp: 11, level: 2, phase: 'engaged' };
    const s = ck({
      activeEncounter: foe,
      sceneFacts: { crowd: 'few', noise: 'quiet', present: ['Shadow Cutthroat', 'Father Aldous'], props: [], lastBeat: '', updatedTurn: 9 },
    } as unknown as Partial<GameState>);
    const fled = tickEncounterTerminal(s, 'Flee', { fleeSucceeded: true }).state;
    expect(fled.activeEncounter).toBeNull();
    expect(fled.sceneFacts?.present).toEqual(['Father Aldous']);
    expect(fled.sceneFacts?.lastKill).toBeUndefined();
    const won = tickEncounterTerminal(s, 'Attack', { enemyDead: true }).state;
    expect(won.sceneFacts?.present).toEqual(['Father Aldous']);
    expect(won.sceneFacts?.lastKill?.name).toBe('Shadow Cutthroat');
  });

  it('the person the player spoke to answers an untagged line when two speakers are declared (lap 13 B T7)', () => {
    const raw = JSON.stringify({
      refs: [
        { tok: 't1', id: 'place:greyhollow-graveyard', use: 'place' },
        { tok: 't6', id: 'cast:father-aldous', use: 'speaker' },
        { tok: 't7', id: 'present:mayor-helga-brask', use: 'speaker' },
      ],
      lines: [
        { fn: 'action', text: 'Jax turned from inspecting the damp earth to address Mayor Helga Brask directly.' },
        { fn: 'speech', text: 'Still poking around the graves, Jax? The dead are best left undisturbed, you know.' },
        { fn: 'hook', text: 'Father Aldous watched them both with a weary, knowing look.' },
      ],
    });
    const refEnum = [
      { tok: 't1', id: 'place:greyhollow-graveyard', klass: 'place', display: 'Greyhollow Graveyard' },
      { tok: 't6', id: 'cast:father-aldous', klass: 'person', display: 'Father Aldous' },
      { tok: 't7', id: 'present:mayor-helga-brask', klass: 'person', display: 'Mayor Helga Brask' },
    ];
    const s = ck({ character: { ...ck().character, name: 'Jax' } });
    const packet = (action: string) => ({ refEnum, playerAction: action }) as unknown as CompletedEventPacket;
    expect(tokenLineVerdicts(raw, s, packet('Talk to Mayor Helga Brask'))).toContain('speech:ok');
    expect(tokenLineVerdicts(raw, s, packet('Look around'))).toContain('speech:speech-no-speaker');
  });
});

function spineQuest(spineId: string, done: number): Quest {
  const seed = tabletopSpineToStarterQuest(TABLETOP_MAIN_SPINES.find((x) => x.spineId === spineId)!);
  return {
    id: seed.id,
    name: seed.title,
    description: seed.description,
    status: 'active',
    revealed: true,
    type: 'main',
    location: seed.location,
    ...(seed.giver ? { giver: seed.giver } : {}),
    objectives: seed.objectives.map((d, i) => {
      const { people, ...rest } = seed.objectiveAnchors?.[i] ?? {};
      return { id: `${seed.id}-obj-${i + 1}`, description: d, completed: i < done, ...rest, ...(people?.length ? { people } : {}) };
    }),
  } as Quest;
}

const silas = { npcId: 'silas', npcName: 'Silas Thorne', disposition: 'neutral', facts: [], lastSeenTurn: 3, aliases: [], location: 'Greyhollow Inn' } as unknown as NonNullable<GameState['npcMemories']>[number];

describe('4 — the escorted person goes along', () => {
  it('the escort goes to the keep with Silas along; it ticks when he is met there, never on arrival (lap 13 E T7, tt-build-questtargets)', () => {
    const at = (over: Partial<GameState>) =>
      ck({ quests: [spineQuest('ck-spine-scholars-folly', 1)], currentLocation: 'Greyhollow Inn', npcMemories: [silas], ...over } as Partial<GameState>);
    expect(storyChip(at({}))).toBe('Travel toward Keep Gate');
    // Taking the chip at the inn does not tick the escort: nobody has gone anywhere.
    expect(applyTabletopQuestTurn(at({}), 'Escort Silas up the hill path', 'Greyhollow Inn').state.quests![0]!.objectives![1]!.completed).toBe(false);
    const arrived = applyTabletopQuestTurn(at({ currentLocation: 'Keep Gate' }), 'Travel toward Keep Gate', 'Greyhollow Inn').state;
    expect(arrived.quests![0]!.objectives![1]!.completed).toBe(false);
    expect(arrived.npcMemories!.find((m) => m.npcId === 'silas')?.location).toBe('Keep Gate');
    expect(applyTabletopQuestTurn(arrived, 'Escort Silas up the hill path', 'Keep Gate').state.quests![0]!.objectives![1]!.completed).toBe(true);
    const elsewhere = { ...silas, location: 'Midnight Well' };
    const alone = applyTabletopQuestTurn(at({ currentLocation: 'Keep Gate', npcMemories: [elsewhere] }), 'Travel toward Keep Gate', 'Greyhollow Inn').state;
    expect(applyTabletopQuestTurn(alone, 'Escort Silas up the hill path', 'Keep Gate').state.quests![0]!.objectives![1]!.completed).toBe(false);
  });
});

describe('5 — the cursed-keep quests lead into the keep', () => {
  const ckSpines = TABLETOP_MAIN_SPINES.filter((x) => x.bibleId === 'cursed-keep');

  it('every cursed-keep spine ends on a step taken inside Keep Gate', () => {
    expect(ckSpines.length).toBeGreaterThan(0);
    for (const sp of ckSpines) {
      const seed = tabletopSpineToStarterQuest(sp);
      expect(seed.objectiveAnchors?.[seed.objectiveAnchors.length - 1], sp.spineId).toMatchObject({ place: 'Keep Gate', room: 'inside' });
      expect(seed.objectiveAnchors?.[1]?.place, sp.spineId).toBe('Keep Gate');
    }
  });

  it('at the gate the inside step is offered and taking it opens the keep; it ticks when taken inside (tt-fix-11)', () => {
    const s = ck({ quests: [spineQuest('ck-spine-scholars-folly', 2)], currentLocation: 'Keep Gate', npcMemories: [{ ...silas, location: 'Keep Gate' }] } as Partial<GameState>);
    const chip = storyChip(s);
    expect(chip).toBe('Recover the lost survey journals');
    expect(objectiveOpensInterior(s, chip!)).toBe(true);
    const inside = maybeEnterInteriorDungeon(s, chip!);
    expect(inside.activeDungeon).toBeTruthy();
    expect(inside.currentLocation).toMatch(/^Keep Gate [—–] /);
    const walkedIn = applyTabletopQuestTurn(inside, chip!, 'Keep Gate').state;
    expect(walkedIn.quests![0]!.status).toBe('active');
    // tt-build-questtargets — the journals lie in their own room; taking the step there finds them.
    const room = walkedIn.quests![0]!.objectives![2]!.target!.nodeId!;
    const there = { ...walkedIn, activeDungeon: { ...walkedIn.activeDungeon!, currentNodeId: room } };
    const turn = applyTabletopQuestTurn(there, chip!, there.currentLocation);
    expect(turn.state.quests![0]!.status).toBe('completed');
  });
});
