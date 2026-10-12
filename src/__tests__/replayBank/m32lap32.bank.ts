/**
 * Multi lap 32 — the starter quest fits the frozen housing (no panel on a worn device) and its rewards are
 * item names; a speech line that says again what that person already said fails the line gate; a person
 * left behind acts here only when one sentence names them and gives them a here-verb outside quotes, and
 * someone the presence ledger has here was not left behind.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { seedLocalStarterQuest, revealLocalStarterQuest } from '../../game/questPlay';
import { summonedPact } from '../../data/campaigns/summonedPact';
import { alreadySaidLines, classifyTokenLine, type TokenBeat } from '../../game/tokenProse';
import { isLeftBehindActingHere } from '../../game/sceneContextTail';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const G5_150 = '2026-10-12T12-44-52-858Z_summoned-pact_cold-system_s150';
const DS150 = '2026-10-12T12-44-54-666Z_summoned-pact_cold-system_s150';
const NELL_T20 = 'They want coin, not mercy';

let G: Replay;
let D: Replay;
beforeAll(async () => {
  G = new Replay(await replayWhole(G5_150));
  D = new Replay(await replayWhole(DS150));
}, 1_800_000);

const starter = (arrival: Parameters<typeof seedLocalStarterQuest>[2]) =>
  seedLocalStarterQuest([], summonedPact.starterQuests ?? [], arrival).find((q) => q.id === 'sp-quest-1')!;

describe('replay bank multi lap 32', () => {
  it('[m32 s78 #5,#6 | lap 32 starter fits the housing] the alone starter names the housing\'s thing and its rewards are items', () => {
    const device = starter({ alone: true, housing: 'worn_device' });
    const first = (q: ReturnType<typeof starter>) => q.objectives?.[0]?.description ?? '';
    expect((device.objectives ?? []).map((o) => o.description).join(' ')).not.toMatch(/panel/i);
    expect(first(device)).toMatch(/what the device shows/);
    expect(first(starter({ alone: true, housing: 'private_window' }))).toMatch(/the window in your head/);
    expect(first(starter({ alone: true })), 'no housing keeps the panel').toMatch(/the panel/);
    expect(device.rewards?.items).toEqual(['Circle Blessing']);
    const listed = revealLocalStarterQuest([], [{ id: 'x-quest-1', title: 'X', description: 'x', objectives: ['a'], rewards: 'Floor Key 1, Safe Room access; 50 gp' }]);
    expect(listed.find((q) => q.id === 'x-quest-1')?.rewards?.items).toEqual(['Floor Key 1', 'Safe Room access', '50 gp']);
  });

  it('[m32 g5-150 T21 | lap 32 a quote said again] the second talk with Nell does not reprint her T20 words', () => {
    expect(G.input(21)).toBe('Talk with Nell Rudd');
    expect(G.prose(20), 'Nell said it on T20').toContain(NELL_T20);
    expect(G.prose(21)).not.toContain(NELL_T20);
    expect((G.turnCheck(21)?.p0 ?? []).map((f) => f.detail).join('\n')).not.toMatch(/restates an earlier beat/);

    const st = G.before(21);
    const said = alreadySaidLines(st, { playerAction: 'Talk with Nell Rudd' } as never);
    const enumRefs = [{ tok: 't7', id: 'present:nell-rudd', klass: 'person', display: 'Nell Rudd' }] as never;
    const beat = { refs: [{ tok: 't7', use: 'speaker', id: 'present:nell-rudd' }], lines: [] } as unknown as TokenBeat;
    const line = (text: string) => ({ fn: 'speech', speaker_tok: 't7', spoken: true, text }) as never;
    expect(classifyTokenLine(line('They want coin, not mercy; the workers need protection.'), beat, enumRefs, [], undefined, said).reason).toBe('said-again');
    expect(classifyTokenLine(line('Ask the keeper who took the grain ledger last week.'), beat, enumRefs, [], undefined, said).ok, 'new words pass').toBe(true);
    const again = alreadySaidLines(st, { playerAction: 'Ask Nell to say that again' } as never);
    expect(classifyTokenLine(line('They want coin, not mercy; the workers need protection.'), beat, enumRefs, [], undefined, again).ok, 'asked to repeat').toBe(true);
  });

  it('[m32 ds150 T9 | lap 32 left behind acts here] Nell, here now, is not left behind; a quoted "ask" is not an act', () => {
    expect(D.input(9)).toBe('Talk to Nell Rudd');
    const st = D.before(9);
    expect(st.sceneFacts?.present ?? [], 'Nell is here').toContain('Nell Rudd');
    expect(isLeftBehindActingHere(st, D.prose(9))).toBe(false);
    expect(JSON.stringify((D.at(9).telemetry as { sentenceRepairs?: unknown }).sentenceRepairs ?? [])).not.toMatch(/unlocated/);

    const thugs = { ...st, sceneFacts: { ...st.sceneFacts, leftBehind: ['Thugs'] } } as GameState;
    expect(isLeftBehindActingHere(thugs, 'The courtyard was busy. Thugs step out from the gate.'), 'a left-behind name acting in its own sentence still flags').toBe(true);
    expect(isLeftBehindActingHere(thugs, 'Thugs were far behind now. Col said, "You ask too much."'), 'name and quoted verb in different sentences').toBe(false);
  });
});
