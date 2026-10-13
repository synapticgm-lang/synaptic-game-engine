/**
 * tt-build-4 — house rules and settings through the shared engine, from the real cursed-keep ds151 tape.
 *
 * T10 "Face the thugs" (two bandits) and T13 "Face the dead" (three zombies) are the recorded turns.
 * Each case takes the real state before that turn, gives it a ready-made sheet (tt-build-1), stamps the
 * house rules the way a turn does (withHouseRules from Settings), and plays the same arc director and
 * chip pad a player gets. Dice are pinned with a fixed Math.random.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { buildNewGameState } from '../../game/fateAutoplay';
import { runArcDirectorBeforeGm, formatArcStatusReceipts, shouldSpawnCombat } from '../../game/arcDirector';
import { commitOfferedPad } from '../../game/playTranscript';
import { deriveTabletopSheet } from '../../game/tabletop/characterBuild';
import { beginTabletopCreation, stepTabletopCreation } from '../../game/tabletop/creationFlow';
import { pcWeaponName } from '../../game/tabletop/combatChips';
import { applyStructuralEvents } from '../../game/structuralEvents';
import { rollRoadEncounter, type StretchContext } from '../../game/travelJourney';
import { withHouseRules, houseRulesOf, DEFAULT_HOUSE_RULES } from '../../game/rules/houseRules';
import { carriedWeightLb, carryLine } from '../../game/rules/encumbrance';
import { buildMasterPrompt } from '../../game/masterPrompt';
import { formatCustomTabletopRulesForPrompt } from '../../game/customTabletopRules';
import { createDefaultSettings } from '../../game/defaults';
import type { GameState, Settings } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';

let T: Replay;
beforeAll(async () => {
  T = new Replay(await replayWhole(TT_DS151));
}, 900_000);

afterEach(() => vi.restoreAllMocks());

const walk = (s: GameState, picks: string[]) => picks.reduce(stepTabletopCreation, s);
const pregen = (n: number, pick: string) => walk(beginTabletopCreation(T.before(n)), [`Ready-made: ${pick}`, 'Begin play']);
const dice = (v: number) => vi.spyOn(Math, 'random').mockReturnValue(v);
const settings = (over: Partial<Settings> = {}): Settings => ({ ...createDefaultSettings(), ...over });
const ruled = (s: GameState, over: Partial<Settings> = {}) => withHouseRules(s, settings(over));

function turn(s: GameState, input: string) {
  const arc = runArcDirectorBeforeGm(s, input);
  const status = formatArcStatusReceipts(arc);
  const engineLine = arc.mandate.split('\n').find((m) => /^ENGINE (OUTCOME|RESULT)/.test(m)) ?? '';
  return { state: commitOfferedPad(arc.state), status, engineLine };
}

const words = (line: string) => line.replace(/^[^:]*:/, '');
const round = (status: string[], n: number) => status.find((l) => l.startsWith(`Round ${n} — `)) ?? '';

describe('replay bank tt-build-4 (house rules and settings)', () => {
  it('[tabletop ds151 T10 | tt-build-4] Flanking on: two bandits on the fighter attack with advantage, shown on STATUS; off, they do not', () => {
    const s = pregen(10, 'Human Fighter (Soldier)');
    dice(0.01); // every d20 is a 1: nobody falls, both bandits stay on the fighter
    const on = turn(ruled(s, { flankingAdvantage: true }), T.input(10));
    const r1 = round(on.status, 1);
    expect(r1).toMatch(/Bandit 1 Scimitar \(flanking\) d20 \(adv: 1, 1\) 1/);
    expect(r1).toMatch(/Bandit 2 Scimitar \(flanking\) d20 \(adv: 1, 1\) 1/);
    // The fighter has no ally beside him: his own swing gets no flanking.
    expect(r1).not.toMatch(/you Greatsword \(flanking\)/);
    expect(words(on.engineLine)).not.toMatch(/\d|flank/i);
    vi.restoreAllMocks();
    dice(0.01);
    const off = turn(ruled(s), T.input(10));
    expect(round(off.status, 1)).not.toContain('(flanking)');
    expect(round(off.status, 1)).toMatch(/Bandit 1 Scimitar d20 1 /);
  });

  it('[tabletop ds151 T13 | tt-build-4] Cleave on: a critical greatsword blow that drops a zombie carries its leftover damage into the next', () => {
    const s = pregen(13, 'Human Fighter (Soldier)');
    dice(0.99); // every d20 is 20, every die its top face
    const r = turn(ruled(s, { cleaveMechanics: true }), T.input(13));
    const r1 = round(r.status, 1);
    // 4d6 + STR on a crit: 24 + mod against a 15 HP zombie leaves the rest for the next one.
    expect(r1).toMatch(/you Greatsword d20 20 \+ \d+ = \d+ vs AC 8: critical hit, 4d6 \(6, 6, 6, 6\) \+ \d+ = \d+ slashing = \d+; Zombie 1 HP 15 → 0/);
    expect(r1).toMatch(/cleave: \d+ also beats Zombie 2 AC 8, \d+ leftover slashing damage; Zombie 2 HP 15 → \d+/);
    const left = Number(r1.match(/(\d+) leftover/)![1]);
    const dealt = Number(r1.match(/slashing = (\d+); Zombie 1/)![1]);
    expect(left).toBe(dealt - 15);
    expect(r.engineLine).toContain('Your blow carries on into the second zombie');
    expect(words(r.engineLine)).not.toMatch(/\d/);
    vi.restoreAllMocks();
    dice(0.99);
    const off = turn(ruled(s), T.input(13));
    expect(round(off.status, 1)).not.toContain('cleave:');
  });

  it('[tabletop ds151 T10 | tt-build-4] Secret Death Saves: a dying fighter’s save rolls hidden; waking or dying still shows', () => {
    const s0 = pregen(10, 'Human Fighter (Soldier)');
    const dying: GameState = {
      ...s0,
      character: { ...s0.character, hp: 0, conditions: ['Unconscious'] },
      deathSaves: { successes: 0, failures: 0 },
    };
    dice(0.5); // d20 11: a success
    const hidden = turn(ruled(dying, { secretDeathSaves: true }), 'Fight for breath');
    expect(hidden.status).toContain('Death save: rolled in secret');
    expect(hidden.status.join(' ')).not.toMatch(/d20|success|failure/);
    expect(hidden.state.deathSaves).toEqual({ successes: 1, failures: 0 });
    expect(hidden.engineLine).toContain('neither waking nor slipping away');
    vi.restoreAllMocks();
    dice(0.99); // natural 20
    const woke = turn(ruled(dying, { secretDeathSaves: true }), 'Fight for breath');
    expect(woke.status).toContain('Death save: you regain 1 HP');
    expect(woke.state.character.hp).toBe(1);
    vi.restoreAllMocks();
    dice(0.5);
    const open = turn(ruled(dying), 'Fight for breath');
    expect(open.status).toContain('Death save: d20 11 — success (1 success, 0 failures)');
  });

  it('[tabletop ds151 T10 | tt-build-4] Strict Encumbrance: each bow shot spends an arrow; with none left the rogue fights with a blade', () => {
    const r0 = pregen(10, 'Halfling Rogue (Criminal)');
    const inv = (r0.inventory ?? []).map((i) =>
      i.name === 'Shortbow' ? { ...i, equipped: true, slot: 'mainHand' } : /Dagger|Shortsword/.test(i.name) ? { ...i, equipped: false } : i
    );
    const rogue: GameState = { ...r0, inventory: inv };
    expect(rogue.inventory!.find((i) => i.name === 'Arrows')?.quantity).toBe(20);
    expect(pcWeaponName(ruled(rogue, { strictEncumbrance: true }))).toBe('Shortbow');
    dice(0.5);
    const shot = turn(ruled(rogue, { strictEncumbrance: true }), T.input(10));
    expect(round(shot.status, 1)).toMatch(/you Shortbow d20/);
    expect(shot.status).toContain('Arrows: 1 used, 19 left');
    expect(shot.state.inventory!.find((i) => i.name === 'Arrows')?.quantity).toBe(19);
    // Off: arrows are not counted.
    vi.restoreAllMocks();
    dice(0.5);
    const free = turn(ruled(rogue), T.input(10));
    expect(free.status.some((l) => l.startsWith('Arrows:'))).toBe(false);
    expect(free.state.inventory!.find((i) => i.name === 'Arrows')?.quantity).toBe(20);
    // Out of arrows: the bow is not the weapon under the strict rule.
    const empty: GameState = { ...rogue, inventory: rogue.inventory!.filter((i) => i.name !== 'Arrows') };
    expect(pcWeaponName(ruled(empty, { strictEncumbrance: true }))).not.toBe('Shortbow');
    expect(pcWeaponName(ruled(empty))).toBe('Shortbow');
  });

  it('[tabletop ds151 T10 | tt-build-4] Strict Encumbrance: carry limit is Strength × 15 lb; a find that would go over stays behind', () => {
    const s0 = ruled(pregen(10, 'Human Fighter (Soldier)'), { strictEncumbrance: true });
    const str = deriveTabletopSheet(s0)!.scores.STR;
    expect(carryLine(s0.inventory, str)).toBe(`Carrying ${carriedWeightLb(s0.inventory)} lb of ${str * 15} lb`);
    // Load the pack to within 10 lb of the limit with stone, then find a chain shirt (20 lb).
    const room = str * 15 - carriedWeightLb(s0.inventory) - 10;
    const full: GameState = { ...s0, inventory: [...(s0.inventory ?? []), { id: 'stone', name: 'Stone Block', quantity: room, rarity: 'Common', type: 'misc' } as never] };
    const gain = [{ type: 'item-gain', name: 'Chain Shirt', rarity: 'Common', qty: 1, lootSource: 'story' }] as never;
    const blocked = applyStructuralEvents(full, gain, { strictEncumbrance: true });
    expect(blocked.gainedItems).toHaveLength(0);
    expect(blocked.notes.some((n) => n.startsWith('Too heavy to carry: Chain Shirt'))).toBe(true);
    // Off, or with room: it goes in the pack.
    expect(applyStructuralEvents(full, gain, { strictEncumbrance: false }).gainedItems).toHaveLength(1);
  });

  it('[tabletop ds151 T13 | tt-build-4] Combat Frequency moves the drought fight cadence; Social / Exploration weight road meetings', () => {
    const s0 = pregen(13, 'Human Fighter (Soldier)');
    // The first recorded quiet turn where nothing but the cadence holds a drought fight back.
    const since = (s: GameState, n: number) => ({ ...s, arcDirector: { ...(s.arcDirector ?? {}), turnsSinceCombatReceipt: n } }) as GameState;
    const reached = (t: number) => {
      try {
        return T.before(t);
      } catch {
        return null;
      }
    };
    const n = Array.from({ length: 23 }, (_, i) => i + 2).find((t) => {
      const b = reached(t);
      return !!b && shouldSpawnCombat(since(b, 999));
    })!;
    expect(n).toBeGreaterThan(0);
    const base = T.before(n);
    expect(base.engineMode).toBe('dnd');
    const quiet = since(base, 6);
    expect(shouldSpawnCombat(ruled(quiet))).toBe(false);
    expect(shouldSpawnCombat(ruled(quiet, { combatFrequency: 100 }))).toBe(true);
    const twelve = since(base, 12);
    expect(shouldSpawnCombat(ruled(twelve))).toBe(true);
    expect(shouldSpawnCombat(twelve)).toBe(true);
    expect(shouldSpawnCombat(ruled(twelve, { combatFrequency: 0 }))).toBe(false);

    const ctx: StretchContext = { terrain: 'road', haunted: false, areaTier: 4, stretch: 1, legsTotal: 3, quietStretches: 0 };
    const rolls = Array.from({ length: 40 }, (_, i) => (i + 0.5) / 40);
    // 50 / 50 / 50 picks exactly what the unweighted pool picks.
    for (const k of rolls) {
      expect(rollRoadEncounter(ctx, 3, 0, k, 1, houseRulesOf(ruled(s0)))).toEqual(rollRoadEncounter(ctx, 3, 0, k, 1));
    }
    const talky = houseRulesOf(ruled(s0, { combatFrequency: 0, socialRoleplay: 100, worldBuilding: 0 }));
    const kinds = rolls.map((k) => rollRoadEncounter(ctx, 3, 0, k, 1, talky)?.kind);
    expect(kinds.every((k) => k === 'traveler' || k === 'meeting')).toBe(true);
  });

  it('[tt-build-4] the tabletop writer prompt matches what the engine runs: no dice lines, no <system-log>, never asks for a roll', () => {
    const s = pregen(10, 'Human Fighter (Soldier)');
    const p = buildMasterPrompt(s, settings());
    expect(p).not.toMatch(/d20\(\d+\)|Insight Check|Strength Check/);
    expect(p).toContain('3. MECHANICS LOG: none in tabletop — never write a <system-log>.');
    expect(p).not.toContain('use <system-log> for checks');
    expect(p).toContain('Ask the player to roll or call for a check');
    expect(p).toContain('Attack, Cast a spell, Dodge, Disengage, Help, Hide, drink a potion, or Flee');
    expect(p).not.toMatch(/how you call checks/);
    expect(formatCustomTabletopRulesForPrompt('Crits deal max damage.', false)).toMatch(/^PLAYER-SUPPLIED TABLETOP RULES \(GUIDANCE/);
    expect(formatCustomTabletopRulesForPrompt('Crits deal max damage.', false)).not.toMatch(/BINDING|wins on conflict with SynapticGM/);
  });

  it('[tt-build-4 guard] LitRPG and story RPG ignore house rules: no stamp, same cadence, same prompt structure', () => {
    for (const bibleId of ['summoned-pact', 'salt-road-heist']) {
      const st = buildNewGameState({ bibleId, characterName: 'Jax', seed: 150, personality: 'chilled-gm' }).state;
      const loud = settings({ combatFrequency: 100, socialRoleplay: 0, worldBuilding: 0, cleaveMechanics: true, flankingAdvantage: true, secretDeathSaves: true });
      const stamped = withHouseRules(st, loud);
      expect(stamped).toBe(st);
      expect(houseRulesOf(stamped)).toEqual(DEFAULT_HOUSE_RULES);
      for (const n of [6, 8, 12, 15, 20]) {
        const q = { ...st, turn: 13, arcDirector: { ...(st.arcDirector ?? {}), turnsSinceCombatReceipt: n } } as GameState;
        expect(shouldSpawnCombat(withHouseRules(q, loud))).toBe(shouldSpawnCombat(q));
      }
      const p = buildMasterPrompt(st, settings());
      expect(p).toContain('3. MECHANICS LOG (after prose, mode-specific format)');
      expect(p).toContain('• D&D: none here (use <system-log> for checks)');
    }
  });
});
