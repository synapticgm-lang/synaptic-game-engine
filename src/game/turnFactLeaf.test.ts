/**
 * Frozen repair facts, writer-leaf repeats, and post-check XP order.
 * Model calls are stubs. No paid inference.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { buildClauseCheckUser, checkAndRepairProse } from './clauseCheck';
import { formatWriterFacingEvent } from './completedEventPacket';
import { formatWriterFacingEvent as edgeFormatWriterFacingEvent } from '../../supabase/functions/_shared/gm/completedEventPacket';
import { hashFactSheet } from './factSheet';
import { formatInfoSheet } from './infoSheet';
import { harvestNarrativePeople } from './narrativeHarvest';
import { applySandboxXpAwards } from './sandboxXp';
import { formatSceneBlock } from './sceneBlock';
import { buildContextPrompt } from './systemPrompt';
import { formatTalkWriterFacing } from './talkEnvelope';
import { prepareWriterInputWithTownsfolk } from './townsfolk';
import { captureTurnEngineFacts, engineFactsForTrainRow, engineFactsFromState } from './trainLog';
import { sentenceRepairRequest } from './writerTurn';
import type { GameState, NpcMemory } from './types';

const SECRET = 'VAULT-SECRET-9f3c';

function baseState(): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    seed: 'turn-fact-leaf',
    currentLocation: 'Harbor hold',
    character: { ...base.character, name: 'Jax', hp: 8, maxHp: 12, xp: 40 },
    turn: 4,
    gold: 3,
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax', where: 'Harbor hold' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
    },
    sceneFacts: { ...emptySceneFacts(4), present: ['Mira'] },
    timeline: [
      { turn: 3, verb: 'said', name: 'Mira', detail: 'The lamp stays lit.', text: 'Mira said the lamp stays lit.', kind: 'said' },
      { turn: 2, verb: 'arrived', name: 'Harbor hold', detail: 'from the street', text: 'arrived Harbor hold', kind: 'arrived' },
    ] as GameState['timeline'],
    log: [
      { role: 'player', turn: 3, content: 'Ask about the lamp' },
      { role: 'gm', turn: 3, content: 'Mira said the lamp stays lit.' },
    ] as GameState['log'],
    npcMemories: [
      {
        npcId: 'mira',
        npcName: 'Mira',
        met: true,
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 4,
        location: 'Harbor hold',
        said: [{ topic: 'lamp', turn: 3, line: 'The lamp stays lit.' }],
        sheet: { job: 'apothecary', motive: 'keep the lamp', fear: 'the dark', speech: 'short', secret: SECRET },
      } as unknown as NpcMemory,
    ],
    locationSheet: { exits: [{ label: 'Lowmarket' }, { label: 'West Wall' }] } as GameState['locationSheet'],
  };
}

function prepared() {
  return prepareWriterInputWithTownsfolk(baseState(), 'Tell Mira the lamp is out', {
    xp: 0,
    engineResult: 'Mira heard you. The lamp stayed lit.',
  });
}

function callIndex(src: string, name: string): number {
  const re = new RegExp(`${name}\\(`);
  let offset = 0;
  for (const line of src.split('\n')) {
    if (!line.trimStart().startsWith('import') && re.test(line)) return offset + line.search(re);
    offset += line.length + 1;
  }
  return -1;
}

describe('repair train facts stay on the packet snapshot', () => {
  it('a mutation after the packet does not change the logged or checked facts', () => {
    const turn = prepared();
    const frozen = captureTurnEngineFacts(turn.state);
    const sheet = turn.packet.factSheet!;
    const sheetHash = hashFactSheet(sheet);
    turn.state.character = { ...turn.state.character, hp: 1, xp: 999 };
    turn.state.sceneFacts = { ...turn.state.sceneFacts!, present: ['MUTANT_AFTER_PACKET'] };
    const live = engineFactsFromState(turn.state);
    expect(frozen?.hp.current).toBe(8);
    expect(live?.hp.current).toBe(1);
    expect(frozen?.npcs.map((n) => n.name)).toEqual(['Mira']);
    expect(live?.npcs.map((n) => n.name)).toContain('MUTANT_AFTER_PACKET');
    expect(hashFactSheet(turn.packet.factSheet!)).toBe(sheetHash);
    expect(turn.packet.factSheet!.present.some((p) => p.name === 'MUTANT_AFTER_PACKET')).toBe(false);
    const checked = buildClauseCheckUser({
      factSheet: turn.packet.factSheet!,
      prose: 'Mira keeps the lamp lit.',
      player: { typed: 'Tell Mira the lamp is out', claimsNotTrue: [] },
    });
    expect(checked).toContain('Mira');
    expect(checked).not.toContain('MUTANT_AFTER_PACKET');
    const repair = sentenceRepairRequest(
      [{ sentence: 'Mira keeps the lamp lit.', flag: 'unsupported' }],
      sheet.beat.engineResult ?? ''
    );
    expect(repair).toContain('Engine fact: Mira heard you. The lamp stayed lit.');
    expect(repair).not.toContain('MUTANT_AFTER_PACKET');
    const liveSrc = readFileSync(resolve(__dirname, './useGame.ts'), 'utf8');
    const fateSrc = readFileSync(resolve(__dirname, './fateAutoplay.ts'), 'utf8');
    expect(liveSrc).toContain('const frozenEngineFacts = captureTurnEngineFacts(liveCurrent)');
    expect(fateSrc).toContain('const frozenEngineFacts = captureTurnEngineFacts(arcState)');
    expect(liveSrc).not.toContain('engineFactsFromState(liveCurrent)');
    expect(fateSrc).not.toContain('engineFactsFromState(arcState)');
    expect(liveSrc).toContain('engine_facts: frozenEngineFacts');
    expect(fateSrc).toContain('engine_facts: frozenEngineFacts');
    const packetLog = engineFactsForTrainRow(frozen, turn.state);
    expect(packetLog.engine_facts_provenance).toBe('packet');
    expect(packetLog.engine_facts).toEqual(frozen);
    const oldCaller = engineFactsForTrainRow(undefined, turn.state);
    expect(oldCaller.engine_facts_provenance).toBe('request_state');
    expect(oldCaller.engine_facts?.hp.current).toBe(1);
    expect(oldCaller.engine_facts).not.toEqual(frozen);
    const badPayload = engineFactsForTrainRow({ hp: 1 }, turn.state);
    expect(badPayload.engine_facts_provenance).toBe('absent');
    expect(badPayload.engine_facts).toBeNull();
    const arrayHp = engineFactsForTrainRow({ hp: [], npcs: [] }, turn.state);
    expect(arrayHp.engine_facts_provenance).toBe('absent');
    expect(arrayHp.engine_facts).toBeNull();
    expect(liveSrc).toContain("engine_facts_provenance: 'packet'");
    expect(fateSrc).toContain("engine_facts_provenance: 'packet'");
    const proxy = readFileSync(resolve(__dirname, './gmProxy.ts'), 'utf8');
    const edgeTurn = readFileSync(resolve(__dirname, '../../supabase/functions/gm-turn/index.ts'), 'utf8');
    expect(edgeTurn).toContain('engine_facts_provenance');
    expect(proxy).toContain('trainEngineFacts: trainMeta.engine_facts');
    expect(edgeTurn).toContain('engineFactsForTrainRow(body.trainEngineFacts, body.state)');
    expect(edgeTurn).not.toContain('engineFactsFromState(body.state)');
  });
});

describe('writer leaf drops only a repeated fact', () => {
  it('client, edge, and the hosted formatter agree, and a repeated place, exit, person, or said-line is not printed twice', () => {
    const turn = prepared();
    const client = formatTalkWriterFacing(turn.packet, turn.state);
    const hosted = buildContextPrompt(turn.state, turn.packet.playerAction);
    const edge = edgeFormatWriterFacingEvent(turn.packet);
    expect(hosted).toBe(client);
    expect(edge).toBe(client);
    expect(client).not.toContain(SECRET);
    expect(client).toContain('PLAYER SAID: Tell Mira the lamp is out');
    expect(client).toContain('ADDRESSEE: Mira');
    expect(client.match(/PLAYER SAID:/g)?.length).toBe(1);
    expect(client).toContain('ENGINE RESULT');
    expect(client).toContain('Mira heard you. The lamp stayed lit.');
    expect(client).toContain('Place: Harbor hold · outdoor.');
    expect(client).toContain('Roads/exits: Lowmarket; West Wall.');
    expect(client).toContain('Mira · apothecary · manner wary, curt, plain-spoken');
    expect(client).toContain('Recent timeline:');
    expect(client).toContain('Mira: The lamp stays lit.');
    expect(client).not.toMatch(/^Location: Harbor hold\.$/m);
    expect(client).not.toMatch(/^PLACES:/m);
    expect(client).not.toMatch(/^PRESENT:/m);
    expect(client).not.toMatch(/^EXITS:/m);
    expect(client).not.toContain('NOW: T4 · Harbor hold · outdoor');
    expect(client).toContain('NOW: T4 · with 1 here · LitRPG');
    expect(client).toContain('Mira already said (lamp, T3): "The lamp stays lit."');
    expect(client).not.toContain('SAID: Mira already said (lamp, T3): "The lamp stays lit."; Mira: The lamp stays lit.');
    expect(client).toContain('Witnesses: Mira.');
    expect(client).toContain('Only PRESENT people may speak');
    expect(client).toContain('T3 Ask about the lamp');
    expect(client).toContain('RECENT: T3 said: Mira | T2 arrived: Harbor hold, from the street');
    expect(formatInfoSheet(turn.state)).toContain('PLACES: Harbor hold · exits: Lowmarket, West Wall');
    expect(formatInfoSheet(turn.state)).toContain('NOW: T4 · Harbor hold · outdoor · with 1 here · LitRPG');
    expect(formatSceneBlock(turn.state)).toMatch(/^PRESENT: Mira \(person\)$/m);
    expect(formatSceneBlock(turn.state)).toMatch(/^EXITS: Lowmarket \(road\), West Wall \(road\)$/m);
  });

  it('keeps a place, exit, person, scale, or said-line the fact sheet does not already state', () => {
    const turn = prepared();
    const otherPlace = formatWriterFacingEvent({ ...turn.packet, location: 'The cellar under the hold' });
    expect(otherPlace).toContain('Location: The cellar under the hold.');
    const extraExit = formatWriterFacingEvent({
      ...turn.packet,
      infoSheet: turn.packet.infoSheet!.replace('West Wall', 'West Wall, Hidden Stair'),
    });
    expect(extraExit).toContain('PLACES: Harbor hold · exits: Lowmarket, West Wall, Hidden Stair');
    const otherScale = formatWriterFacingEvent({
      ...turn.packet,
      infoSheet: turn.packet.infoSheet!.replace('· outdoor ·', '· cellar-scale ·'),
    });
    expect(otherScale).toContain('cellar-scale');
    const extraPerson = formatWriterFacingEvent({
      ...turn.packet,
      sceneBlock: turn.packet.sceneBlock!.replace('PRESENT: Mira (person)', 'PRESENT: Mira (person), Sela (out of range)'),
    });
    expect(extraPerson).toContain('PRESENT: Mira (person), Sela (out of range)');
    const leaf = formatTalkWriterFacing(turn.packet, turn.state);
    expect(leaf).toContain('Mira: The lamp stays lit.');
    expect(leaf).toContain('RECENT: T3 said: Mira');
  });
});

describe('post-check XP and harvest stay where they are', () => {
  it('sandbox XP and narrative harvest run after the clause check and do not rewrite the checked sheet', () => {
    const turn = prepared();
    const hash = hashFactSheet(turn.packet.factSheet!);
    const xp = applySandboxXpAwards(turn.state, {
      playerAction: 'Look around',
      questsBefore: turn.state.quests ?? [],
      questsAfter: turn.state.quests ?? [],
      events: [],
      turn: turn.state.turn,
    });
    const harvested = harvestNarrativePeople(turn.state, 'Mira nods by the lamp.', turn.state.turn + 1);
    expect(xp.awardKeys).toBeTruthy();
    expect(hashFactSheet(turn.packet.factSheet!)).toBe(hash);
    expect(harvested.state.completedEvent?.factSheet ? hashFactSheet(harvested.state.completedEvent.factSheet) : hash).toBe(hash);
    for (const file of ['./useGame.ts', './fateAutoplay.ts']) {
      const src = readFileSync(resolve(__dirname, file), 'utf8');
      const check = callIndex(src, 'checkAndRepairProse');
      const harvest = callIndex(src, 'harvestNarrativePeople');
      const award = callIndex(src, 'applySandboxXpAwards');
      expect(check).toBeGreaterThan(0);
      expect(harvest).toBeGreaterThan(check);
      expect(award).toBeGreaterThan(harvest);
    }
  });
});

describe('short dialogue coverage', () => {
  it('covers a sentence that is exactly the claim, and still withholds a fragment or a dot', async () => {
    const sheet = prepared().packet.factSheet!;
    const player = { typed: 'nod', claimsNotTrue: [] as string[] };
    const nods = await checkAndRepairProse({
      factSheet: sheet,
      prose: 'She nods.',
      player,
      chat: async () => ({ claims: [{ c: 'She nods.', kind: 'colour' as const, support: '' }] }),
    });
    expect(nods.withheld).toBe(false);
    expect(nods.prose).toContain('She nods');
    const yes = await checkAndRepairProse({
      factSheet: sheet,
      prose: 'Yes.',
      player,
      chat: async () => ({ claims: [{ c: 'Yes', kind: 'colour' as const, support: '' }] }),
    });
    expect(yes.withheld).toBe(false);
    expect(yes.prose).toContain('Yes');
    const longer = await checkAndRepairProse({
      factSheet: sheet,
      prose: 'She nods at the lamp.',
      player,
      chat: async () => ({ claims: [{ c: 'She nods.', kind: 'colour' as const, support: '' }] }),
    });
    expect(longer.withheld).toBe(true);
    expect(longer.prose).not.toContain('lamp');
    const dot = await checkAndRepairProse({
      factSheet: sheet,
      prose: 'Mira answers you by the lamp.',
      player,
      chat: async () => ({ claims: [{ c: '.', kind: 'colour' as const, support: '' }] }),
    });
    expect(dot.withheld).toBe(true);
    expect(dot.prose).not.toContain('Mira answers');
  });
});
