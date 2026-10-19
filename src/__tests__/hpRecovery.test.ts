/**
 * q70-HPRECOVERY — LitRPG / RPG HP recovery (seeded, no AI).
 * Tabletop SRD rest / death saves unchanged.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../game/defaults';
import {
  applyHealingPotionUse,
  applyHpRecoveryRest,
  applyHpRecoveryStarterKit,
  applyLowHpWarning,
  applyOutOfCombatRegen,
  fleeDifficultyFor,
  healingPotionItem,
  HP_INN_REST_CHIP,
  HP_REST_CHIP,
  isLowHp,
  lowHpWarningLine,
  recoveryRouteChips,
  restKindHere,
} from '../game/hpRecovery';
import { hpRecoveryConfig } from '../game/rules/hpRecoveryConfig';
import { applyRestHeal, TABLETOP_LONG_REST_CHIP, TABLETOP_SHORT_REST_CHIP } from '../game/recoveryRules';
import { withHouseRules } from '../game/rules/houseRules';
import { createDefaultSettings } from '../game/defaults';
import { resolveLedgerFlee } from '../game/ledgerCombat';
import { runPlayerCheck } from '../game/checkMath';
import { shouldSpawnCombat } from '../game/arcDirector';
import { resolveOfferedChoices } from '../game/playTranscript';
import { buyItem } from '../game/merchant';
import { rollLoot } from '../game/lootTableRegistry';
import type { ActiveEncounter, GameState } from '../game/types';
import type { PlayerIntent } from '../game/intentParser';
import { createHashRng } from '../game/seededRng';

const foe = (over: Partial<ActiveEncounter> = {}): ActiveEncounter => ({
  name: 'Void-Touched Scavenger',
  level: 1,
  hp: 12,
  maxHp: 12,
  armorClass: 12,
  strength: 12,
  dexterity: 12,
  constitution: 12,
  xpReward: 25,
  goldReward: 0,
  phase: 'engaged',
  ...over,
});

function lit(over: Partial<GameState> = {}): GameState {
  const s = createInitialState('hprecov', 'litrpg');
  return {
    ...s,
    seed: 'hprecov-seed',
    turn: 20,
    gold: 50,
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Lowmarket',
    openingEstablishment: { pending: [], answers: {}, complete: true },
    character: { ...s.character, hp: 10, maxHp: 38 },
    ...over,
  };
}

function rpg(over: Partial<GameState> = {}): GameState {
  const s = createInitialState('hprecov', 'rpg');
  return {
    ...s,
    seed: 'hprecov-seed',
    turn: 20,
    gold: 50,
    campaignBibleId: 'salt-road-heist',
    currentLocation: 'Safehouse Alley',
    openingEstablishment: { pending: [], answers: {}, complete: true },
    character: { ...s.character, hp: 8, maxHp: 24 },
    ...over,
  };
}

function dnd(over: Partial<GameState> = {}): GameState {
  const s = createInitialState('hprecov', 'dnd');
  return withHouseRules(
    {
      ...s,
      turn: 10,
      campaignBibleId: 'cursed-keep',
      currentLocation: 'Greyhollow Inn',
      character: { ...s.character, hp: 4, maxHp: 10 },
      ...over,
    },
    { ...createDefaultSettings(), ttDeathRule: 'srd' }
  );
}

describe('q70-HPRECOVERY', () => {
  it('after a fight leaving HP < 50%, a recovery route is offered and works from saved state', () => {
    const afterFight = lit({
      character: { ...lit().character, hp: 12, maxHp: 38 },
      activeEncounter: null,
      currentLocation: 'Lowmarket',
    });
    expect(afterFight.character.hp * 2).toBeLessThan(afterFight.character.maxHp);
    expect(restKindHere(afterFight)).toBe('safe');
    const routes = recoveryRouteChips(afterFight);
    expect(routes).toContain(HP_REST_CHIP);
    const chips = resolveOfferedChoices(afterFight);
    expect(chips.some((c) => c === HP_REST_CHIP || c === HP_INN_REST_CHIP)).toBe(true);

    const rested = applyHpRecoveryRest(afterFight, HP_REST_CHIP);
    expect(rested.receipt).toMatch(/^Rest:/);
    expect(rested.state.character.hp).toBeGreaterThan(afterFight.character.hp);
  });

  it('50 non-combat turns raise HP via out-of-combat regen', () => {
    const cfg = hpRecoveryConfig('litrpg')!;
    let s = lit({ character: { ...lit().character, hp: 5, maxHp: 38 }, activeEncounter: null });
    const start = s.character.hp;
    for (let i = 0; i < 50; i++) {
      const tick = applyOutOfCombatRegen(s);
      s = { ...tick.state, turn: (s.turn ?? 0) + 1 };
    }
    const expectedTicks = Math.floor(50 / cfg.regenEveryNonCombatTurns);
    expect(s.character.hp).toBe(Math.min(38, start + expectedTicks * cfg.regenHpPerTick));
    expect(s.character.hp).toBeGreaterThan(start);
  });

  it('resting at an inn costs coin and heals', () => {
    const cfg = hpRecoveryConfig('litrpg')!;
    const before = lit({
      currentLocation: 'The Weighing Cup',
      gold: 40,
      character: { ...lit().character, hp: 8, maxHp: 38 },
    });
    expect(restKindHere(before)).toBe('inn');
    const rested = applyHpRecoveryRest(before, HP_INN_REST_CHIP);
    expect(rested.receipt).toMatch(/inn/);
    expect(rested.state.gold).toBe(40 - cfg.innPriceGp);
    expect(rested.state.character.hp).toBe(38);
    expect(rested.after?.some((l) => l.startsWith('Inn:'))).toBe(true);
  });

  it('a potion heals and is consumed', () => {
    const cfg = hpRecoveryConfig('litrpg')!;
    const potion = healingPotionItem('litrpg', 'p1', 1)!;
    const before = lit({
      inventory: [potion],
      character: { ...lit().character, hp: 10, maxHp: 38 },
    });
    const used = applyHealingPotionUse(before, `Use ${cfg.potionName}`);
    expect(used.receipts[0]).toMatch(/^Potion:/);
    expect(used.state.character.hp).toBe(Math.min(38, 10 + cfg.potionHealHp));
    expect(used.state.inventory.some((i) => i.name === cfg.potionName)).toBe(false);
  });

  it('potion is buyable from existing merchants with config price and healHp stamp', () => {
    const cfg = hpRecoveryConfig('litrpg')!;
    const bought = buyItem(lit({ gold: 100 }), cfg.potionName, 1);
    expect(bought.ok).toBe(true);
    const row = bought.newState!.inventory.find((i) => i.name === cfg.potionName);
    expect(row?.healHp).toBe(cfg.potionHealHp);
    expect(bought.newState!.gold).toBe(100 - cfg.potionPriceGp);
  });

  it('flee can fail and can succeed over seeds', () => {
    const cfg = hpRecoveryConfig('litrpg')!;
    expect(fleeDifficultyFor(lit())).toBe(cfg.fleeDifficulty);

    const base = lit({
      character: { ...lit().character, hp: 7, maxHp: 38 },
      activeEncounter: foe(),
    });
    const fleeIntent = { kind: 'flee', label: 'Try to flee' } as unknown as PlayerIntent;

    // Forced low roll → fail (fight continues).
    const failCheck = runPlayerCheck(base, fleeIntent, 'Try to flee', 1);
    expect(failCheck.isSuccess).toBe(false);
    const failed = resolveLedgerFlee(base, failCheck);
    expect(failed?.round.fled).toBe(false);
    expect(failed?.state.activeEncounter).toBeTruthy();

    // Forced high roll → success (leaves encounter).
    const okCheck = runPlayerCheck(base, fleeIntent, 'Try to flee', 20);
    expect(okCheck.isSuccess).toBe(true);
    const fled = resolveLedgerFlee(base, okCheck);
    expect(fled?.round.fled).toBe(true);
    expect(fled?.state.activeEncounter).toBeNull();
  });

  it('ambush still spawns at low HP (not suppressed) and offers flee', () => {
    const low = lit({
      character: { ...lit().character, hp: 5, maxHp: 38 },
      activeEncounter: null,
      turn: 40,
      openingEstablishment: { pending: [], answers: {}, complete: true },
    });
    expect(isLowHp(low)).toBe(true);
    // Ambushes are NOT suppressed at low HP (John: no babysitting).
    const decision = shouldSpawnCombat(low, 'Look around');
    // May or may not spawn this turn (drought timing); the gate must not refuse solely for low HP.
    expect(decision).not.toEqual(expect.objectContaining({ reason: expect.stringMatching(/low.?hp|hp.?threshold/i) }));

    const ambush = { ...low, activeEncounter: foe({ phase: 'engaged' }) };
    const chips = resolveOfferedChoices(ambush);
    expect(chips.some((c) => /flee/i.test(c))).toBe(true);
  });

  it('low-HP warning appears under the threshold', () => {
    const low = lit({ character: { ...lit().character, hp: 5, maxHp: 38 } });
    expect(isLowHp(low)).toBe(true);
    const line = lowHpWarningLine(low);
    expect(line).toMatch(/^System: HP critical/);
    const warned = applyLowHpWarning(low);
    expect(warned.receipts[0]).toMatch(/^System: HP critical/);
    expect(warned.state.lowHpWarningActive).toBe(true);
    // Idempotent while still low.
    expect(applyLowHpWarning(warned.state).receipts).toEqual([]);
  });

  it('starter kit only when the world data marks it', () => {
    const cfg = hpRecoveryConfig('litrpg')!;
    const bare = applyHpRecoveryStarterKit(lit({ inventory: [] }), { hpRecoveryStarterKit: false });
    expect(bare.inventory.some((i) => i.name === cfg.potionName)).toBe(false);

    const marked = applyHpRecoveryStarterKit(lit({ inventory: [] }), { hpRecoveryStarterKit: true });
    const potion = marked.inventory.find((i) => i.name === cfg.potionName);
    expect(potion?.quantity).toBe(cfg.starterKitPotionCount);
    expect(potion?.healHp).toBe(cfg.potionHealHp);
  });

  it('loot path can drop the healing potion (existing rollLoot)', () => {
    const cfg = hpRecoveryConfig('litrpg')!;
    let found = false;
    for (let i = 0; i < 40; i++) {
      const roll = rollLoot({
        profile: 'mob',
        state: lit(),
        seed: `potion-loot-${i}`,
        rng: createHashRng(`potion-loot-${i}`, 'loot', 'mob'),
      });
      if (roll.items.some((it) => it.name === cfg.potionName && it.healHp === cfg.potionHealHp)) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('replay of L6 T96 (save 7ab32b7b fixture if present): HP recovers before T328', () => {
    const fixture = path.join(__dirname, '../game/__fixtures__/7ab32b7b-t96.json');
    if (!fs.existsSync(fixture)) {
      // Synthetic stand-in: start at T96 with 7/38 HP; regen + rest recovers before T328.
      let s = lit({
        turn: 96,
        character: { ...lit().character, hp: 7, maxHp: 38 },
        currentLocation: 'Lowmarket',
        activeEncounter: null,
      });
      for (let t = 96; t < 328; t++) {
        const tick = applyOutOfCombatRegen(s);
        s = { ...tick.state, turn: t + 1 };
        if (s.character.hp < s.character.maxHp && restKindHere(s)) {
          const rest = applyHpRecoveryRest(s, HP_REST_CHIP);
          if (rest.receipt) s = rest.state;
        }
        if (s.character.hp > 7) break;
      }
      expect(s.character.hp).toBeGreaterThan(7);
      expect(s.turn).toBeLessThan(328);
      return;
    }
    const saved = JSON.parse(fs.readFileSync(fixture, 'utf8')) as GameState;
    let s: GameState = { ...saved, activeEncounter: null };
    const startHp = s.character.hp;
    for (let t = s.turn ?? 96; t < 328; t++) {
      const tick = applyOutOfCombatRegen(s);
      s = { ...tick.state, turn: t + 1 };
      if (restKindHere(s) && s.character.hp < (s.character.maxHp || 0)) {
        const rest = applyHpRecoveryRest(s, restKindHere(s) === 'inn' ? HP_INN_REST_CHIP : HP_REST_CHIP);
        if (rest.receipt) s = rest.state;
      }
      if (s.character.hp > startHp) break;
    }
    expect(s.character.hp).toBeGreaterThan(startHp);
  });

  it('tabletop rest/death saves banks unchanged (SRD chips still apply)', () => {
    expect(hpRecoveryConfig('dnd')).toBeNull();
    const sheet = dnd();
    // Safe hub + Hurt Die path still uses tabletop chip labels.
    const short = applyRestHeal(sheet, TABLETOP_SHORT_REST_CHIP);
    const long = applyRestHeal(sheet, TABLETOP_LONG_REST_CHIP);
    // At least one of the SRD rest paths still produces a rest receipt (Hit Dice / long rest).
    expect(!!short.receipt || !!long.receipt).toBe(true);
    // Mode rest chips must not hijack tabletop.
    expect(applyHpRecoveryRest(sheet, HP_REST_CHIP).receipt).toBeNull();
  });

  it('rpg path mirrors litrpg (rest + potion + regen)', () => {
    const cfg = hpRecoveryConfig('rpg')!;
    const atSafe = rpg({ character: { ...rpg().character, hp: 6, maxHp: 24 } });
    expect(restKindHere(atSafe)).toBe('safe');
    const rested = applyHpRecoveryRest(atSafe, HP_REST_CHIP);
    expect(rested.state.character.hp).toBeGreaterThan(6);

    const withPotion = rpg({
      inventory: [healingPotionItem('rpg', 's1')!],
      character: { ...rpg().character, hp: 6, maxHp: 24 },
    });
    const used = applyHealingPotionUse(withPotion, `Use ${cfg.potionName}`);
    expect(used.state.character.hp).toBe(Math.min(24, 6 + cfg.potionHealHp));
  });
});
