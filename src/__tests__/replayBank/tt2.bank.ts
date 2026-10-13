/**
 * tt-build-2 — tabletop turn-based combat, from the real cursed-keep ds151 tape.
 *
 * T10 "Face the thugs" (two bandits on the road) and T13 "Face the dead" (three zombies) are the
 * recorded fights. Each case takes the real state before that turn, gives it a ready-made sheet
 * (tt-build-1), and plays the fight round by round through the same arc director and chip pad
 * a player gets. Dice are pinned with a fixed Math.random so every roll can be checked.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { buildNewGameState } from '../../game/fateAutoplay';
import { runArcDirectorBeforeGm, formatArcStatusReceipts } from '../../game/arcDirector';
import { commitOfferedPad, resolveOfferedChoices } from '../../game/playTranscript';
import { resolveEngineFight } from '../../game/engineFight';
import { engineResultFact, terminalFightOutcome } from '../../game/engineResult';
import { applyPlayPhaseAfterHp } from '../../game/playPhase';
import { abilityMod, deriveTabletopSheet } from '../../game/tabletop/characterBuild';
import { beginTabletopCreation, stepTabletopCreation } from '../../game/tabletop/creationFlow';
import { roundCombatChips } from '../../game/tabletop/combatChips';
import { usesRoundCombat } from '../../game/tabletop/roundFight';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';

let T: Replay;
beforeAll(async () => {
  T = new Replay(await replayWhole(TT_DS151));
}, 900_000);

afterEach(() => vi.restoreAllMocks());

const walk = (s: GameState, picks: string[]) => picks.reduce(stepTabletopCreation, s);
const pregen = (n: number, pick: string) => walk(beginTabletopCreation(T.before(n)), [`Ready-made: ${pick}`, 'Begin play']);
/** Every d20 lands on 1 + floor(v × 20); every d6 on 1 + floor(v × 6). */
const dice = (v: number) => vi.spyOn(Math, 'random').mockReturnValue(v);

/** One player turn: the engine settles before the writer, then the chip pad is compiled from the result. */
function turn(s: GameState, input: string) {
  const arc = runArcDirectorBeforeGm(s, input);
  const status = formatArcStatusReceipts(arc);
  const engineLine = arc.mandate.split('\n').find((m) => m.startsWith('ENGINE OUTCOME')) ?? '';
  const after = commitOfferedPad(arc.state);
  return { state: after, status, engineLine, mandate: arc.mandate, chips: resolveOfferedChoices(after) };
}

function toHit(s: GameState): number {
  const d = deriveTabletopSheet(s)!;
  return abilityMod(s.character.attributes.STR) + d.pb;
}

describe('replay bank tt-build-2 (tabletop turn-based combat)', () => {
  it('[tabletop ds151 T10 | tt-build-2] facing the thugs rolls initiative and plays one round, every roll in STATUS', () => {
    const s = pregen(10, 'Human Fighter (Soldier)');
    expect(T.input(10)).toBe('Face the thugs');
    dice(0.5);
    const r = turn(s, T.input(10));
    const init = r.status.find((l) => l.startsWith('Initiative — '))!;
    // Two bandits share one initiative roll.
    expect(init).toMatch(/^Initiative — you d20 11 [+−] \d = \d+; Bandit ×2 d20 11 \+ 1 = 12$/);
    const round = r.status.find((l) => l.startsWith('Round 1 — '))!;
    // Attack = d20 + STR + proficiency, read from the same sheet the player sees; damage is the weapon's dice.
    const hit = toHit(s);
    expect(round).toContain(`you Greatsword d20 11 + ${hit} = ${11 + hit} vs AC 12: hit, 2d6 (4, 4) + ${abilityMod(s.character.attributes.STR)}`);
    expect(round).toContain('Bandit 1 drops to 0 HP');
    expect(round).toMatch(/Bandit 2 Scimitar d20 11 \+ 3 = 14 vs AC \d+: (hit|miss)/);
    expect(r.status).toContain('Fight: round 1 vs the thugs — the fight goes on');
    // The fight state waits on round 2.
    expect(r.state.roundCombat?.round).toBe(2);
    expect(r.state.activeEncounter).toBeTruthy();
    // The writer gets words, never a number, and is told the fight is not over.
    expect(r.engineLine).toMatch(/the fight is NOT over/);
    expect(r.engineLine.replace(/^[^:]*:/, '')).not.toMatch(/\d/);
    expect(r.engineLine).toContain('You hit the first bandit with your greatsword; it goes down.');
    expect(engineResultFact(r.status)).not.toMatch(/Initiative —|Round 1 —|HP: /);
    // The next turn's choice is one round's action.
    expect(r.chips).toEqual(['Attack with the Greatsword', 'Dodge', 'Disengage', 'Hide', 'Flee']);
    expect(r.chips).toEqual(roundCombatChips(r.state));
  });

  it('[tabletop ds151 T10 | tt-build-2] the second round ends it: victory, XP, gold, and the encounter clears', () => {
    dice(0.5);
    const r1 = turn(pregen(10, 'Human Fighter (Soldier)'), T.input(10));
    const r2 = turn(r1.state, 'Attack with the Greatsword');
    expect(r2.status.find((l) => l.startsWith('Round 2 — '))).toContain('Bandit 2 drops to 0 HP');
    expect(r2.status).toContain('Fight: VICTORY vs the thugs in 2 rounds. The fight is over: the thugs are down and cannot fight on.');
    expect(r2.status.some((l) => /^XP Gained: \d+ \(defeated the thugs — CR 1\/8/.test(l))).toBe(true);
    expect(terminalFightOutcome(engineResultFact(r2.status))).toMatchObject({ outcome: 'victory', foe: 'the thugs', rounds: '2 rounds' });
    expect(r2.state.activeEncounter).toBeFalsy();
    expect(r2.state.roundCombat).toBeNull();
    expect(roundCombatChips(r2.state)).toBeNull();
    expect(r2.chips).not.toContain('Dodge');
  });

  it('[tabletop ds151 T10 | tt-build-2] dropping to 0 HP is death saves, not the end; three successes leave you stable', () => {
    const s = pregen(10, 'Human Fighter (Soldier)');
    const hurt = { ...s, character: { ...s.character, hp: 1 } };
    dice(0.9);
    const down = turn(hurt, T.input(10));
    expect(down.status.find((l) => l.startsWith('Round 1 — '))).toContain('you drop to 0 HP: Unconscious, making death saves');
    expect(down.status).toContain('Fight: DEFEAT vs the thugs in 1 round. The fight is over: you lost it.');
    expect(down.state.character.hp).toBe(0);
    expect(down.state.character.conditions).toContain('Unconscious');
    expect(down.state.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(down.mandate).toMatch(/ENCOUNTER HELD: the thugs/);
    expect(applyPlayPhaseAfterHp(down.state, 0, down.state.turn).playPhase).not.toBe('ended');
    expect(down.chips).toEqual(['Fight for breath']);

    vi.restoreAllMocks();
    dice(0.5);
    let s2 = down.state;
    const lines: string[] = [];
    for (let i = 0; i < 3; i++) {
      const t = turn(s2, 'Fight for breath');
      lines.push(...t.status.filter((l) => l.startsWith('Death save:')));
      expect(t.engineLine.replace(/^[^:]*:/, '')).not.toMatch(/\d/);
      s2 = t.state;
    }
    expect(lines).toEqual([
      'Death save: d20 11 — success (1 success, 0 failures)',
      'Death save: d20 11 — success (2 successes, 0 failures)',
      'Death save: d20 11 — success (3 successes, 0 failures) — stable; you wake with 1 HP after 1d4 (3) hours',
    ]);
    expect(s2.deathSaves ?? null).toBeNull();
    expect(s2.character.hp).toBe(1);
    expect(s2.character.conditions ?? []).not.toContain('Unconscious');
    expect(resolveOfferedChoices(s2)).not.toContain('Fight for breath');
  });

  it('[tabletop ds151 T10 | tt-build-2] a natural 1 is two failures, and the third failure ends the run', () => {
    const s = pregen(10, 'Human Fighter (Soldier)');
    dice(0.9);
    const down = turn({ ...s, character: { ...s.character, hp: 1 } }, T.input(10));
    vi.restoreAllMocks();
    dice(0);
    const a = turn(down.state, 'Fight for breath');
    // tt-build-5: a Human starts with Heroic Inspiration (SRD 5.2.1 Resourceful); it rerolls the first failed save.
    expect(a.status).toContain('Death save: d20 1 (Heroic Inspiration: rerolled 1) — two failures (0 successes, 2 failures)');
    expect(a.status).toContain('Heroic Inspiration: spent');
    expect(applyPlayPhaseAfterHp(a.state, 0, a.state.turn).playPhase).not.toBe('ended');
    const b = turn(a.state, 'Fight for breath');
    expect(b.status.find((l) => l.startsWith('Death save:'))).toMatch(/dead/i);
    expect(b.state.deathSaves?.dead).toBe(true);
    expect(applyPlayPhaseAfterHp(b.state, 0, b.state.turn).playPhase).toBe('ended');
  });

  it('[tabletop ds151 T10 | tt-build-2] Flee is a Dash: each bandit still in reach gets an opportunity attack, then you are clear', () => {
    dice(0.5);
    const r1 = turn(pregen(10, 'Human Fighter (Soldier)'), T.input(10));
    const r2 = turn(r1.state, 'Flee');
    const round = r2.status.find((l) => l.startsWith('Round 2 — '))!;
    expect(round).toMatch(/you: flee — you Dash out of reach/);
    expect(round).toMatch(/Bandit 2 opportunity attack, Scimitar d20 11 \+ 3 = 14 vs AC \d+/);
    expect(r2.status).toContain('Fight: ESCAPED from the thugs after 2 rounds');
    expect(terminalFightOutcome(engineResultFact(r2.status))).toMatchObject({ outcome: 'escaped', foe: 'the thugs' });
    expect(r2.state.roundCombat).toBeNull();
    expect(r2.state.activeEncounter).toBeFalsy();
  });

  it('[tabletop ds151 T13 | tt-build-2] the dead: zombies from the SRD block, a wizard casts Fire Bolt off INT + proficiency', () => {
    const s = pregen(13, 'Elf Wizard (Sage)');
    expect(T.input(13)).toBe('Face the dead');
    // d20 7: the zombies' slams miss the wizard's AC.
    dice(0.3);
    const r1 = turn(s, T.input(13));
    expect(r1.status.find((l) => l.startsWith('Initiative — '))).toMatch(/Zombie ×3 d20 7 − 2 = 5$/);
    expect(r1.state.roundCombat!.foes.map((f) => [f.name, f.blockId, f.maxHp])).toEqual([
      ['Zombie 1', 'zombie', 15],
      ['Zombie 2', 'zombie', 15],
      ['Zombie 3', 'zombie', 15],
    ]);
    expect(r1.chips).toContain('Cast Fire Bolt');
    const r2 = turn(r1.state, 'Cast Fire Bolt');
    const d = deriveTabletopSheet(s)!;
    const spell = abilityMod(s.character.attributes.INT) + d.pb;
    expect(r2.status.find((l) => l.startsWith('Round 2 — '))).toContain(`you Fire Bolt d20 7 + ${spell} = ${7 + spell} vs AC 8: hit, 1d10 (4) `);
  });

  it('[tabletop ds151 T13 | tt-build-2] a cleric’s Sacred Flame is a DEX save against the sheet’s spell DC', () => {
    const s = pregen(13, 'Dwarf Cleric (Acolyte)');
    dice(0.5);
    const r1 = turn(s, T.input(13));
    expect(r1.chips).toContain('Cast Sacred Flame');
    const r2 = turn(r1.state, 'Cast Sacred Flame');
    const dc = 8 + abilityMod(s.character.attributes.WIS) + deriveTabletopSheet(s)!.pb;
    expect(r2.status.find((l) => l.startsWith('Round 2 — '))).toContain(`Zombie 1 DEX save against Sacred Flame d20 11 − 2 = 9 vs DC ${dc}`);
  });

  it('[tt-build-2 guard] recorded pre-creation runs keep the one-shot fight; LitRPG and story RPG never get rounds', () => {
    const recorded = T.before(10);
    expect(recorded.character.srd).toBeUndefined();
    expect(usesRoundCombat(recorded)).toBe(false);
    const fight = resolveEngineFight(recorded, T.input(10))!;
    expect(fight.receipts.some((r) => /^Fight: (VICTORY|DEFEAT) vs /.test(r))).toBe(true);
    expect(fight.receipts.some((r) => /^Initiative —|^Death save:/.test(r))).toBe(false);
    expect(fight.state.roundCombat ?? null).toBeNull();
    expect(fight.state.deathSaves ?? null).toBeNull();
    for (const bibleId of ['summoned-pact', 'salt-road-heist']) {
      const st = buildNewGameState({ bibleId, characterName: 'Jax', seed: 150, personality: 'chilled-gm', tabletopCreation: true }).state;
      const withFoe = { ...st, activeEncounter: recorded.activeEncounter ?? { ...(T.after(10).activeEncounter ?? {}) } } as GameState;
      expect(usesRoundCombat(withFoe)).toBe(false);
      expect(roundCombatChips(withFoe)).toBeNull();
    }
  });
});
