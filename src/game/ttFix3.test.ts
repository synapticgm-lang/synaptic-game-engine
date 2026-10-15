/**
 * tt-fix-3 — the sentence checks that missed lap 4's writer errors, the repeats lap 4 still showed, and the new
 * engine errors (escape wording, tabletop level skills, guessed CR XP, hidden trap roll).
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { sentenceGateProblems } from './beatCommitGate';
import { createInitialState } from './defaults';
import { PC_AGENCY, POSES_CHOICE, RECORD_READOUT, ROLL_CONTRADICTION } from './engineFactGate';
import { fightRolls } from './engineFactPatterns';
import type { CompletedEventPacket } from './completedEventPacket';
import { capBeatWords, repairRejectedSentences, type DraftCheck, type WriterTurnResult } from './writerTurn';
import { parsePlayerIntent } from './intentParser';
import { checkActionFollowed } from './turnCheck';
import { dropTypedNameAfterToken } from './tokenProse';
import { dropTimeOfDay, openingPlaceRecord } from './placeNames';
import { objectiveOpensInterior } from './enterInterior';
import { PREGENS, applyTabletopSheet, resolveSheet, scoresForMethod } from './tabletop/characterBuild';
import { kitRefDisplay } from './inventory';
import { beatCarriesTerminalFight } from './engineResult';
import { grantLevelSkills } from './skillGates';
import { NO_CR_XP_REASON, milestoneXp } from './xpRules';
import { realEncounterCr } from './rules/srdMonsters';
import { payEncounterXp } from './engineFight';
import { rollLines } from './dungeonCard';
import { filterSystemLogForEngine } from './systemLog';
import type { ActiveEncounter, GameState, Item } from './types';

const DEATH_SAVE_FACT =
  'You lie unconscious on the ground at 0 HP and cannot move, speak or act. You slip further; your breath falters. Dungeon room: Corridor, inside Keep Gate. Cave Spider is here.';
const TRAVEL_FACT = 'Travel: back streets to Keep Gate — +30 min, now dusk.';
const QUEST = { name: "The Woodcutter's Plea", step: "Find the woodcutter's daughter in Keep Gate" };

function tabletop(engineResult: string, extra: Partial<GameState> = {}): GameState {
  const s0 = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s0,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 10,
    activeEncounter: null,
    openingEstablishment: { pending: [], answers: {}, ...(s0.openingEstablishment ?? {}), complete: true },
    character: { ...s0.character, name: 'Jax' },
    quests: [{
      id: 'q1', name: QUEST.name, revealed: true, status: 'active', description: '',
      objectives: [{ id: 'o1', description: QUEST.step, completed: false }],
    }],
    log: [],
    completedEvent: { engineResult, loot: [], refs: [] },
    ...extra,
  } as unknown as GameState;
}

describe('tt-fix-3 checker gap: shared sentence patterns', () => {
  it('a travel record read-out fails the gate', () => {
    const s = tabletop(TRAVEL_FACT);
    expect(sentenceGateProblems(s, 'The first leg of the journey took half an hour through the back streets.')).toContain(RECORD_READOUT);
    expect(sentenceGateProblems(s, 'The back streets narrowed as the light went.')).not.toContain(RECORD_READOUT);
  });

  it('a quest step said as a task still waiting fails the gate; the quest title named in narration fails too', () => {
    const s = tabletop('Dungeon room: Corridor, inside Keep Gate.');
    expect(sentenceGateProblems(s, "The woodcutter's daughter still waits to be found somewhere in Keep Gate.")).toContain(RECORD_READOUT);
    expect(sentenceGateProblems(s, "The Woodcutter's Plea weighed on Jax as the gate loomed.")).toContain(RECORD_READOUT);
  });

  it('a posed choice and a decided feeling fail the gate', () => {
    const s = tabletop('Dungeon room: Corridor, inside Keep Gate.');
    expect(sentenceGateProblems(s, 'Jax had to decide whether to climb the wall or wait for dark.')).toContain(POSES_CHOICE);
    expect(sentenceGateProblems(s, 'The choice of which way to go waited for Jax.')).toContain(POSES_CHOICE);
    expect(sentenceGateProblems(s, 'Jax decided the gate was not worth the risk.')).toContain(PC_AGENCY);
    expect(sentenceGateProblems(s, 'Jax felt certain the spider was watching.')).toContain(PC_AGENCY);
  });

  it('a death-save turn that swings a sword fails the gate (B T14 / T16)', () => {
    const s = tabletop(DEATH_SAVE_FACT);
    expect(fightRolls(DEATH_SAVE_FACT).pcCannotAct).toBe(true);
    expect(sentenceGateProblems(s, "Jax swung their Shortsword, but the Cave Spider's venom struck Jax hard.")).toContain(ROLL_CONTRADICTION);
    const dead = tabletop('Your breath stops. You are dead. Dungeon room: Corridor, inside Keep Gate.');
    expect(sentenceGateProblems(dead, "Jax's Shortsword struck true, but a sudden, sharp pain bloomed in their chest.")).toContain(ROLL_CONTRADICTION);
    expect(sentenceGateProblems(s, 'Jax lay still on the cold stone, breath shallow.')).not.toContain(ROLL_CONTRADICTION);
  });

  it('the fact checker reads the em-dash quest packet and flags the same kinds the gate fails', async () => {
    const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
      checkTurn: (row: unknown, packet: string, page?: string) => Array<{ kind: string; quote: string }>;
    };
    const packet = `The player character is Jax.\n- quest ${QUEST.name} — step: ${QUEST.step}\n`;
    const row = (gmText: string, engineFact = TRAVEL_FACT) => ({ turn: 5, gmText, engineFact, playerInput: 'Walk on' });
    const flagged = (gmText: string, engineFact?: string) => mod.checkTurn(row(gmText, engineFact), packet, '').length > 0;
    expect(flagged('The first leg of the journey took half an hour through the back streets.')).toBe(true);
    expect(flagged("The woodcutter's daughter still waits to be found somewhere in Keep Gate.")).toBe(true);
    expect(flagged('Jax had to decide whether to climb the wall or wait for dark.')).toBe(true);
    expect(flagged('Jax decided the gate was not worth the risk.')).toBe(true);
    expect(flagged("Jax swung their Shortsword, but the Cave Spider's venom struck Jax hard.", DEATH_SAVE_FACT)).toBe(true);
    expect(flagged('The back streets narrowed as the light went.')).toBe(false);
  });

  it('one repair request covers every failing sentence, not only the first reason', async () => {
    const s = tabletop(TRAVEL_FACT, { currentLocation: 'Keep Gate' });
    const prose = [
      'Jax reached Keep Gate as the light went.',
      'The first leg of the journey took half an hour through the back streets.',
      'Jax had to decide whether to climb the wall or wait for dark.',
    ].join(' ');
    const check: DraftCheck = { state: s, playerInput: 'Walk on', intent: parsePlayerIntent('Walk on', s), engineFact: TRAVEL_FACT, previousGm: '' };
    let asked = '';
    const out = await repairRejectedSentences({ prose } as unknown as WriterTurnResult, {
      packet: s.completedEvent as unknown as CompletedEventPacket,
      check,
      repair: async (req) => { asked = req; return ''; },
    });
    expect(asked).toContain('first leg');
    expect(asked).toContain('decide whether');
    expect(out.repairs?.map((r) => r.flag)).toEqual(expect.arrayContaining([RECORD_READOUT, POSES_CHOICE]));
    expect(out.prose).toContain('Jax reached Keep Gate');
    expect(out.prose).not.toContain('decide whether');
  });

  it('a record read-out that cannot be rewritten leaves the page, even as the only sentence naming the destination (tt-fix-15)', async () => {
    const s = tabletop(TRAVEL_FACT, { currentLocation: 'Keep Gate' });
    const only = 'The first leg of the journey to Keep Gate took half an hour.';
    const check: DraftCheck = { state: s, playerInput: 'Walk on', intent: parsePlayerIntent('Walk on', s), engineFact: TRAVEL_FACT, previousGm: '' };
    const out = await repairRejectedSentences({ prose: `${only} The light went grey.` } as unknown as WriterTurnResult, {
      packet: s.completedEvent as unknown as CompletedEventPacket,
      check,
      repair: async () => '',
    });
    expect(out.prose).not.toContain(only);
  });
});

describe('tt-fix-3 repeats', () => {
  it('a downed PC owes no blow: the attack chip on a death-save turn is not an ignored action', () => {
    const enc = { name: 'Cave Spider', hp: 5, maxHp: 10 } as unknown as ActiveEncounter;
    const before = tabletop(DEATH_SAVE_FACT, { activeEncounter: enc });
    const downed = { ...before, character: { ...before.character, hp: 0 } } as GameState;
    const { p0 } = checkActionFollowed(downed, downed, 'Attack the Cave Spider', 'Jax lay still on the cold stone.');
    expect(p0.filter((f) => /attacked/.test(f.detail))).toEqual([]);
  });

  it('a token followed by its own surname or place tail paints once', () => {
    const show = (map: Record<string, string>) => (tok: string) => map[tok];
    expect(dropTypedNameAfterToken('@t6 Merrow nodded.', show({ t6: 'Edda Merrow' }))).toBe('@t6 nodded.');
    expect(dropTypedNameAfterToken('Jax reached @t1, the Broken Gate.', show({ t1: 'the Broken Gate in Keep Gate' }))).toBe('Jax reached @t1.');
    expect(dropTypedNameAfterToken('@t6 met Merrow.', show({ t6: 'Edda Merrow' }))).toBe('@t6 met Merrow.');
  });

  it('the hour on an opening card is never part of the place name', () => {
    expect(dropTimeOfDay('Greyhollow mill lane at dusk')).toBe('Greyhollow mill lane');
    expect(openingPlaceRecord('cursed-keep', 'the ruined keep gate at nightfall').place).not.toMatch(/nightfall/);
    expect(dropTimeOfDay('the Dawn Gate')).toBe('the Dawn Gate');
  });

  it('examining the site does not open its dungeon; going in does', () => {
    const s = tabletop('', { currentLocation: 'the dungeon under Keep Gate', activeDungeon: null } as Partial<GameState>);
    expect(objectiveOpensInterior(s, 'Examine the dungeon entrance')).toBe(false);
    expect(objectiveOpensInterior(s, 'Enter the dungeon')).toBe(true);
  });

  it('a dressed PC gets no second set of kit clothes; sentence-case kit names read lowercase', () => {
    const s0 = tabletop('');
    const clothes = { id: 'c1', name: 'Travelling clothes', itemType: 'armor', slot: 'Chest', quantity: 1 } as unknown as Item;
    const s = { ...s0, inventory: [clothes] } as GameState;
    const pre = PREGENS[1]!.picks;
    const sheet = resolveSheet({
      classId: pre.classId!, speciesId: pre.speciesId!, backgroundId: pre.backgroundId!,
      method: 'standard-array', ...scoresForMethod('standard-array', pre.classId!, () => 0.5), kitId: 'A',
    });
    const after = applyTabletopSheet(s, sheet);
    expect((after.inventory ?? []).filter((i) => /\bclothes\b/i.test(i.name))).toHaveLength(1);
    expect(kitRefDisplay('Travelling clothes')).toBe('travelling clothes');
    expect(kitRefDisplay('Chain Mail')).toBe('Chain Mail');
  });

  it('a tabletop beat is capped at 100 words, keeping the spoken line and the destination', () => {
    const s = tabletop('', { currentLocation: 'Keep Gate' });
    const filler = Array.from({ length: 12 }, (_, i) => `The wind moved the dry grass in long pale waves number ${i}.`).join(' ');
    const prose = `Jax walked on. The road bent. ${filler} "Stop there," the guard said. Jax reached Keep Gate at last.`;
    const capped = capBeatWords(prose, 100, s);
    expect((capped.match(/[A-Za-z0-9][\w'’-]*/g) ?? []).length).toBeLessThanOrEqual(100);
    expect(capped).toContain('"Stop there," the guard said.');
    expect(capped).toContain('Jax reached Keep Gate at last.');
    expect(capped.startsWith('Jax walked on. The road bent.')).toBe(true);
  });
});

describe('tt-fix-3 engine errors', () => {
  it('"lost the trail" tells an escape', () => {
    const fight = { outcome: 'escaped', foe: 'the restless dead', rounds: '', forced: false } as Parameters<typeof beatCarriesTerminalFight>[1];
    expect(beatCarriesTerminalFight('Behind Jax, the dead lost the trail and faded into the fog.', fight)).toBe(true);
    expect(beatCarriesTerminalFight('The dead shuffled closer.', fight)).toBe(false);
  });

  it('a tabletop level grants no LitRPG skill rank or "you can now" line', () => {
    const s0 = tabletop('');
    const s = { ...s0, character: { ...s0.character, level: 2, skillsGrantedThrough: 1 } } as GameState;
    const r = grantLevelSkills(s, 1);
    expect(r.receipts).toEqual([]);
    expect(r.state.character.skills ?? {}).toEqual(s.character.skills ?? {});
    expect(r.state.character.skillsGrantedThrough).toBe(2);
  });

  it('fight XP pays from the real CR, never a guessed one, and says why when there is none', () => {
    expect(milestoneXp('dnd', 'encounter', { cr: null }).amount).toBe(0);
    expect(milestoneXp('dnd', 'encounter', { cr: null }).detail).toBe(NO_CR_XP_REASON);
    expect(realEncounterCr({ name: 'the thugs' })).toBe('1/8');
    expect(realEncounterCr({ name: 'a nameless thing' })).toBeNull();
    const s = tabletop('');
    const thugs = payEncounterXp(s, { name: 'the thugs', count: 2 } as ActiveEncounter, 'defeated the thugs');
    expect(thugs.receipts.join('\n')).toMatch(/XP Gained: 50 \(defeated the thugs — CR 1\/8 = 25 XP × 2 = 50 XP/);
    const odd = payEncounterXp(s, { name: 'a nameless thing' } as ActiveEncounter, 'defeated a nameless thing');
    expect(odd.receipts.join('\n')).toMatch(/XP: none \(defeated a nameless thing — no XP: the foe has no challenge rating/);
    expect(odd.state.character.xp ?? 0).toBe(s.character.xp ?? 0);
  });

  it('a trap roll and its damage reach tabletop STATUS', () => {
    const s = tabletop('');
    const lines = [...rollLines(s, 'Trap', 'trap', 2, 1, 13, false, 'a trap went off; you took 5 damage.'), 'HP: 10 → 5'];
    const shown = filterSystemLogForEngine(lines, 'dnd');
    expect(shown).toContain('Trap check: d20 2 + 1 vs DC 13 — failure');
    expect(shown).toContain('Dungeon: trap — a trap went off; you took 5 damage.');
    expect(shown).toContain('HP: 10 → 5');
    const story = { ...s, engineMode: 'rpg' } as GameState;
    expect(filterSystemLogForEngine(rollLines(story, 'Trap', 'trap', 2, 1, 13, false, 'a trap went off.'), 'rpg').join(' ')).not.toMatch(/d20/);
  });
});
