/**
 * Mode lap 4 — tabletop and Story RPG roots from mode-result-3, replayed from lap 3's runs.
 * Fix 1 (Story RPG): a road meeting's own chips settle through the engine checks (face = fight, talk past =
 * parley, slip = flee), so "Face the thugs" is no longer ignored (rpg ds150 T6–T8). Story RPG loot reaches the
 * writer with no rarity tag (rpg fl150 T2 "Loot: [Common] Worn Hand Axe" → "a common Worn Hand Axe").
 * Fix 2 (Story RPG): a quest step that names no place is a decision; it is offered as its own chip and ticks
 * only when the player takes it, never on travel, talk or beat timing (rpg ds151 T6 / T12).
 * Fix 3 (tabletop): waiting or readying is not a rest. A short rest is 1 hour and one Hit Die (shown), a long
 * rest is 8 hours and all HP (tt ds151 T18 "Ready yourself and watch" healed 14 → 24 with no time passing).
 * LitRPG behaviour is unchanged (guards at the end).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { engineResultFact } from '../../game/engineResult';
import { applyStoryRpgTurn, storyRpgDecisionChip } from '../../game/storyRpgProgress';
import { applyRestHeal, restChip } from '../../game/recoveryRules';
import { roadFoeForEngine } from '../../game/travelJourney';
import { storyChip } from '../../game/choiceRanking';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RPG_DS150 = '2026-10-13T14-15-18-792Z_salt-road-heist_chilled-gm_s150';
const RPG_DS151 = '2026-10-13T14-15-22-760Z_salt-road-heist_chilled-gm_s151';
const RPG_FL150 = '2026-10-13T14-15-26-859Z_salt-road-heist_chilled-gm_s150';
const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';

let A: Replay;
let B: Replay;
let F: Replay;
let T: Replay;
beforeAll(async () => {
  A = new Replay(await replayWhole(RPG_DS150));
  B = new Replay(await replayWhole(RPG_DS151));
  F = new Replay(await replayWhole(RPG_FL150));
  T = new Replay(await replayWhole(TT_DS151));
}, 900_000);

const status = (r: Replay, n: number) => (r.at(n).telemetry.systemLog ?? []).join('\n');
const fact = (r: Replay, n: number) => r.after(n).completedEvent?.engineResult ?? '';
const steps = (s: GameState) => (s.quests ?? []).find((q) => q.id === 'salt-road-heist-quest-1')?.objectives ?? [];
const done = (s: GameState, step: string) => !!steps(s).find((o) => o.description === step)?.completed;

describe('replay bank mode4 (mode lap 4)', () => {
  it('[story rpg ds150 T6 | mode4 fix 1] "Face the thugs" runs the fight and closes the meeting', () => {
    expect(A.input(6)).toBe('Face the thugs');
    expect(status(A, 6)).toMatch(/^Fight: (VICTORY|DEFEAT) vs the thugs in \d+ rounds?/m);
    expect(A.after(6).character.hp).toBeLessThan(A.before(6).character.hp);
    expect(fact(A, 6)).toMatch(/Fight: (VICTORY|DEFEAT) vs the thugs/);
    expect(fact(A, 6)).not.toMatch(/\bRound \d|\blevel \d/i);
    const enc = A.after(6).journey?.encounter;
    expect(!!enc && (enc.engaged || enc.lost || enc.escaped)).toBe(true);
    expect(A.chipsAfter(6)).not.toContain('Face the thugs');
  });

  it('[story rpg ds151 T20 | mode4 fix 1] "Talk your way past the thugs" runs the parley check', () => {
    expect(B.input(20)).toBe('Talk your way past the thugs');
    const engine = (B.at(20).telemetry.arcStatusReceipts ?? []).join('\n');
    expect(engine).toMatch(/^Parley check: d20 \d+ [+−] \d+ vs DC 13 — (success|failure)$/m);
    expect(fact(B, 20)).toMatch(/Parley check: d20/);
    expect(B.chipsAfter(20)).not.toContain('Talk your way past the thugs');
  });

  it('[story rpg fl150 T2 | mode4 fix 1] Story RPG loot reaches the writer with no rarity tag', () => {
    expect(F.input(2)).toBe('Search the area');
    expect(fact(F, 2)).toMatch(/Loot: Worn Hand Axe/);
    expect(fact(F, 2)).not.toMatch(/\[(Common|Uncommon|Rare|Epic|Legendary)\]/);
  });

  it('[story rpg ds151 T6 + T12 | mode4 fix 2] travel and talk never tick the decision steps', () => {
    expect(done(B.after(2), 'Scout the caravan')).toBe(true);
    expect(B.input(6)).toBe('Turn back toward Consul Caravan Camp');
    expect(B.input(12)).toBe('Ask about the caravan route');
    for (const n of B.turns()) expect(status(B, n), `T${n}`).not.toMatch(/Quest stage: Case the Caravan — (Pick an approach|Commit to the heist night)/);
    expect(done(B.after(21), 'Pick an approach')).toBe(false);
  });

  it('[story rpg ds151 T3 | mode4 fix 2] the open decision step is offered as its own chip, and taking it ticks it', () => {
    const s = B.after(2);
    expect(storyRpgDecisionChip(s)).toBe('Pick an approach');
    expect(storyChip(s)).toBe('Pick an approach');
    for (const n of [3, 11, 17]) expect(B.chipsAfter(n), `after T${n}`).toContain('Pick an approach');
    const took = applyStoryRpgTurn(s, 'Pick an approach');
    expect(took.receipts).toContain('Quest stage: Case the Caravan — Pick an approach');
    expect(done(took.state, 'Pick an approach')).toBe(true);
    expect(storyRpgDecisionChip(took.state)).toBe('Commit to the heist night');
    expect(applyStoryRpgTurn(s, 'Refuse Vessa and keep your own counsel').receipts.join('\n')).not.toMatch(/Quest stage/);
  });

  it('[story rpg ds150 | mode4 fix 2] only the place step ticks on a run that never takes a decision', () => {
    const last = A.after(A.turns()[A.turns().length - 1]!);
    expect(done(last, 'Scout the caravan')).toBe(true);
    expect(done(last, 'Pick an approach')).toBe(false);
  });

  /** Lap 3 recorded 14 / 24 HP before T18 (the T13 fight); the replay's fight rolls differ, so the hurt is restored. */
  const hurtAt18 = (): GameState => {
    const s = T.before(18);
    return { ...s, character: { ...s.character, hp: 14 } };
  };

  it('[tabletop ds151 T18 | mode4 fix 3] "Ready yourself and watch" is not a rest: no heal, no clock', () => {
    expect(T.input(18)).toBe('Ready yourself and watch');
    expect(T.after(18).currentLocation).toBe("Mira's Apothecary");
    for (const n of T.turns()) expect(status(T, n), `T${n}`).not.toMatch(/^Rest:/m);
    const s = hurtAt18();
    const watch = applyRestHeal(s, 'Ready yourself and watch');
    expect(watch.receipt).toBeNull();
    expect(watch.state).toBe(s);
    expect(applyRestHeal(s, 'Wait and watch').receipt).toBeNull();
  });

  it('[tabletop ds151 T18 | mode4 fix 3] a short rest is 1 hour and one shown Hit Die; a long rest is 8 hours and full HP', () => {
    const s = hurtAt18();
    const max = s.character.maxHp;
    expect(restChip(s)).toMatch(/^(Take a short rest|Rest for the night)$/);
    const short = applyRestHeal(s, 'Take a short rest');
    expect(short.dieLine).toMatch(/^Hit Die: d8 \d [+−] \d+ = \d+$/);
    expect(short.receipt).toMatch(/^Rest: short rest, 1 hour — HP \d+ → \d+ \(\+1h, now \w+\)$/);
    const gain = Number(short.dieLine!.match(/= (\d+)$/)![1]);
    expect(short.state.character.hp).toBe(Math.min(max, s.character.hp + gain));
    expect(short.state.hitDiceSpent).toBe(1);
    expect(engineResultFact([short.dieLine!, short.receipt!], 'dnd')).not.toMatch(/Hit Die|d8/);
    const hurtAgain = { ...short.state, character: { ...short.state.character, hp: 5 } };
    expect(restChip(hurtAgain)).toBe('Rest for the night');
    const spent = applyRestHeal(hurtAgain, 'Take a short rest');
    expect(spent.receipt).toMatch(/no Hit Dice left, HP stays 5/);
    const long = applyRestHeal(hurtAgain, 'Rest for the night');
    expect(long.receipt).toMatch(/^Rest: long rest, 8 hours — HP \d+ → \d+ \(\+8h, now \w+\)$/);
    expect(long.state.character.hp).toBe(max);
    expect(long.state.hitDiceSpent).toBe(0);
  });

  it('[mode4 guard] LitRPG keeps its short rest line, rarity tags, quest and road meetings; rests use the shared rules (tt-build-7)', () => {
    const s = hurtAt18();
    const lit = { ...s, engineMode: 'litrpg' } as GameState;
    // Waiting is not a rest in any mode; the rest chip is the same one tabletop offers.
    expect(applyRestHeal(lit, 'Ready yourself and watch').receipt).toBeNull();
    expect(restChip(lit)).toBe(restChip(s));
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const heal = applyRestHeal(lit, 'Take a short rest');
    const table = applyRestHeal(s, 'Take a short rest');
    vi.restoreAllMocks();
    expect(heal.state.character.hp).toBe(table.state.character.hp);
    expect(heal.state.character.hp).toBeGreaterThan(s.character.hp);
    expect(heal.receipt).toMatch(/^Rest: HP \d+ → \d+$/);
    expect(heal.dieLine).toBeUndefined();
    expect(engineResultFact(['Loot: [Common] Worn Hand Axe'], 'litrpg')).toBe('Loot: [Common] Worn Hand Axe.');
    expect(engineResultFact(['Loot: [Common] Worn Hand Axe'], 'dnd')).toBe('Loot: [Common] Worn Hand Axe.');
    expect(storyRpgDecisionChip({ ...B.after(2), engineMode: 'litrpg' } as GameState)).toBeNull();
    const road = A.before(6);
    expect(roadFoeForEngine({ ...road, engineMode: 'pyoa' } as GameState, 'Face the thugs')).toBeNull();
    expect(roadFoeForEngine({ ...road, engineMode: 'litrpg' } as GameState, 'Face the thugs')).not.toBeNull();
  });
});
