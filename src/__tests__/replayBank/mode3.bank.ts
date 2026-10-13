/**
 * Mode lap 3 — tabletop and Story RPG roots from mode-result-2, replayed from lap 2's runs.
 * Fix 1 (tabletop + Story RPG): the engine's encounter level never reaches the writer facts, so prose cannot
 * paste it (g5-150 T7 "a camp with a mini-boss at level two"; g5-151 T9 repair "level 1 and on their own errand").
 * Fix 2 (cursed-keep + salt-road-heist): the character starts in a clothes row (boots, belt, coat), so worn
 * clothes are on the sheet; the three packed tabletop starter items are still all there.
 * Fix 3 (Story RPG): helping or refusing a named person moves their standing, on STATUS and in the writer
 * facts; the main quest's next step ticks at the place it names, or on a decision when it names no place.
 * LitRPG behaviour is unchanged (guards at the end).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { engineResultFact } from '../../game/engineResult';
import { applyStoryRpgTurn } from '../../game/storyRpgProgress';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const TT_G5_150 = '2026-10-13T13-37-50-453Z_cursed-keep_chilled-gm_s150';
const TT_G5_151 = '2026-10-13T13-52-59-864Z_cursed-keep_chilled-gm_s151';
const TT_DS150 = '2026-10-13T13-37-50-473Z_cursed-keep_chilled-gm_s150';
const RPG_DS150 = '2026-10-13T13-37-50-454Z_salt-road-heist_chilled-gm_s150';

let G0: Replay;
let G1: Replay;
let D: Replay;
let R: Replay;
beforeAll(async () => {
  G0 = new Replay(await replayWhole(TT_G5_150));
  G1 = new Replay(await replayWhole(TT_G5_151));
  D = new Replay(await replayWhole(TT_DS150));
  R = new Replay(await replayWhole(RPG_DS150));
}, 900_000);

const status = (r: Replay, n: number) => (r.at(n).telemetry.systemLog ?? []).join('\n');
const fact = (r: Replay, n: number) => r.after(n).completedEvent?.engineResult ?? '';
const lastTurn = (r: Replay) => r.turns()[r.turns().length - 1]!;
const worn = (s: GameState, name: string) => (s.inventory ?? []).find((i) => i.name === name && i.equipped);

describe('replay bank mode3 (mode lap 3)', () => {
  it('[tabletop g5-150 T7 | mode3 fix 1] the camp meeting reaches the writer with no encounter level', () => {
    expect(G0.input(7)).toBe('Travel toward Keep Gate');
    expect(fact(G0, 7)).toMatch(/chance meeting: a camp with a mini-boss/);
    expect(fact(G0, 7)).not.toMatch(/\blevel \d/i);
  });

  it('[tabletop g5-150 + g5-151 | mode3 fix 1] no turn hands the writer an engine level', () => {
    for (const r of [G0, G1]) {
      for (const n of r.turns()) expect(fact(r, n), `T${n}`).not.toMatch(/\(level \d+|[—-] level \d+/i);
    }
  });

  it('[tabletop ds150 | mode3 fix 2] cursed-keep starts in worn travelling clothes and keeps its three packed items', () => {
    const s = D.after(2);
    expect(worn(s, 'Travelling clothes')?.description).toMatch(/boots/);
    for (const name of ['Chain Shirt', 'Holy Water (Flask)', 'Tavern Lodging Token']) {
      expect((s.inventory ?? []).some((i) => i.name === name), name).toBe(true);
    }
  });

  it('[story rpg ds150 | mode3 fix 2] salt-road-heist starts in worn road clothes beside the crew token', () => {
    const s = R.after(2);
    expect(worn(s, 'Road clothes')?.description).toMatch(/boots.*belt.*coat/);
    expect((s.inventory ?? []).some((i) => i.name === 'Crew Token')).toBe(true);
  });

  it('[story rpg ds150 T5 | mode3 fix 3] refusing Vessa moves her standing, on STATUS and in the writer facts', () => {
    expect(R.input(5)).toBe('Refuse Vessa and keep your own counsel');
    expect(status(R, 5)).toMatch(/^Standing: Vessa turned hostile \(was friendly\) after you refused$/m);
    expect(fact(R, 5)).toMatch(/Standing: Vessa turned hostile/);
    expect(R.after(5).npcMemories?.find((m) => m.npcName === 'Vessa')?.disposition).toBe('hostile');
  });

  it('[story rpg ds150 | mode3 fix 3] the quest step that names the caravan ticks at Consul Caravan Camp', () => {
    const n = R.turns().find((t) => /Quest stage: Case the Caravan — Scout the caravan \(at Consul Caravan Camp\)/.test(status(R, t)));
    expect(n).toBeDefined();
    expect(R.after(n!).currentLocation).toBe('Consul Caravan Camp');
    expect(status(R, n!)).toMatch(/XP Gained: 50 \(quest step: /);
    // Mode lap 4: the decision steps tick only when the player takes them; this run never does.
    const steps = R.after(lastTurn(R)).quests?.find((q) => q.id === 'salt-road-heist-quest-1')?.objectives ?? [];
    expect(steps.filter((o) => o.completed).map((o) => o.description)).toEqual(['Scout the caravan']);
  });

  it('[mode3 guard] LitRPG keeps the encounter level in the writer facts and gets no Story RPG turn', () => {
    const r = 'Travel: open road between A and B — leg 1 of 2 — +2h, now midday; B still ahead; chance meeting: thugs (level 2), three of them, working this stretch';
    expect(engineResultFact([r], 'litrpg')).toMatch(/\(level 2\)/);
    expect(engineResultFact([r], 'dnd')).not.toMatch(/level/);
    const s = R.after(4);
    const lit = { ...s, engineMode: 'litrpg' } as GameState;
    expect(applyStoryRpgTurn(lit, 'Refuse Vessa and keep your own counsel')).toEqual({ state: lit, receipts: [] });
    const tt = { ...s, engineMode: 'dnd' } as GameState;
    expect(applyStoryRpgTurn(tt, 'Refuse Vessa and keep your own counsel').receipts).toEqual([]);
  });
});
