/**
 * q65v2-DOWNLOCK — Package A: LitRPG/RPG never permanently die at 0 HP.
 * Seeded, no AI. Tabletop SRD death saves unchanged.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../game/defaults';
import { applyPlayPhaseAfterHp, isPlayInputLocked } from '../game/playPhase';
import {
  clearWeakened,
  commitDeath,
  isWeakened,
  stampLastSafeHub,
  tryRecoverDeathCoinCache,
} from '../game/rules/death';
import { recoveryConfig } from '../game/rules/recoveryConfig';
import { shouldSpawnCombat } from '../game/arcDirector';
import { resolveOfferedChoices } from '../game/playTranscript';
import { awayRestBlock } from '../game/rules/awayRest';
import { applyRestHeal, TABLETOP_LONG_REST_CHIP } from '../game/recoveryRules';
import { withHouseRules } from '../game/rules/houseRules';
import { createDefaultSettings } from '../game/defaults';
import type { ActiveEncounter, EngineMode, GameState } from '../game/types';

const rng = () => 0.5;

const foe = (over: Partial<ActiveEncounter> = {}): ActiveEncounter => ({
  name: 'Scavenger',
  level: 1,
  hp: 3,
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
  const s = createInitialState('downlock', 'litrpg');
  return {
    ...s,
    seed: 'downlock-seed',
    turn: 10,
    gold: 100,
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Ash Ruin',
    lastSafeHub: 'Lowmarket',
    openingEstablishment: { pending: [], answers: {}, complete: true },
    character: { ...s.character, hp: 0, maxHp: 24, lifeline: 'System lifeline' },
    activeEncounter: foe(),
    ...over,
  };
}

function rpg(over: Partial<GameState> = {}): GameState {
  const s = createInitialState('downlock', 'rpg');
  return {
    ...s,
    seed: 'downlock-seed',
    turn: 10,
    gold: 100,
    campaignBibleId: 'salt-road-heist',
    currentLocation: 'Roadside ditch',
    lastSafeHub: 'Millstone Ford',
    openingEstablishment: { pending: [], answers: {}, complete: true },
    character: { ...s.character, hp: 0, maxHp: 20, lifeline: 'an old oath that will not let you go' },
    activeEncounter: foe({ name: 'Blade' }),
    ...over,
  };
}

function dnd(over: Partial<GameState> = {}): GameState {
  const s = createInitialState('downlock', 'dnd');
  return withHouseRules(
    {
      ...s,
      turn: 10,
      character: { ...s.character, hp: 0, maxHp: 10 },
      deathSaves: { successes: 0, failures: 3, dead: true },
      ...over,
    },
    { ...createDefaultSettings(), ttDeathRule: 'srd' }
  );
}

describe('q65v2-DOWNLOCK Package A', () => {
  it('A: litrpg hp→0 via combat defeat never ends with 0 affordances', () => {
    const next = applyPlayPhaseAfterHp(lit(), 0, 10);
    expect(next.playPhase).toBe('live');
    expect(next.character.hp).toBeGreaterThan(0);
    expect(isPlayInputLocked(next)).toBe(false);
    const chips = resolveOfferedChoices(next);
    expect(chips.length).toBeGreaterThan(0);
  });

  it('B: after recovery, input is live with hp>0 (no locked recovering state)', () => {
    const next = applyPlayPhaseAfterHp(lit(), 0, 11);
    expect(next.playPhase).toBe('live');
    expect(next.character.hp).toBe(12); // 50% of 24
    expect(isPlayInputLocked(next)).toBe(false);
    expect(next.lifelineReceipts?.some((r) => /^Lifeline:/.test(r))).toBe(true);
  });

  it('C: recovery is idempotent per turn; consequence receipt exactly once', () => {
    const first = applyPlayPhaseAfterHp(lit({ gold: 100 }), 0, 12);
    const goldAfter = first.gold;
    const second = applyPlayPhaseAfterHp(first, 0, 12);
    expect(second.gold).toBe(goldAfter);
    expect(second.character.hp).toBe(first.character.hp);
    const dropLines = (first.lifelineReceipts ?? []).filter((r) => r.startsWith('Coin dropped:'));
    expect(dropLines.length).toBe(1);
  });

  it('D: awayRest — litrpg live after lifeline is not tabletop-blocked as ended; tabletop ended refuses', () => {
    const recovered = applyPlayPhaseAfterHp(lit(), 0, 13);
    expect(awayRestBlock(recovered)).toBe('not a tabletop sheet');
    const ended = {
      ...dnd(),
      playPhase: 'ended' as const,
      character: { ...dnd().character, srd: { classId: 'fighter', speciesId: 'human' } as GameState['character']['srd'] },
    };
    expect(awayRestBlock(ended)).toBe('play is over');
  });

  it('E: invariant — every playPhase except tabletop ended accepts input or has ≥1 affordance', () => {
    const samples: GameState[] = [
      applyPlayPhaseAfterHp(lit(), 0, 14),
      applyPlayPhaseAfterHp(rpg(), 0, 14),
      { ...lit({ character: { ...lit().character, hp: 10 } }), playPhase: 'live' },
      { ...dnd({ character: { ...dnd().character, hp: 5 }, deathSaves: null }), playPhase: 'live' },
    ];
    for (const s of samples) {
      if (s.engineMode === 'dnd' && s.playPhase === 'ended') continue;
      const locked = isPlayInputLocked(s);
      const chips = resolveOfferedChoices(s);
      expect(!locked || chips.length > 0, `${s.engineMode}/${s.playPhase}`).toBe(true);
    }
  });

  it('F: L6-shaped defeat (hp 0 + live foe) reaches live GM-ready state at next turn', () => {
    const before = lit({ turn: 328, character: { ...lit().character, hp: 0, maxHp: 24 } });
    const t329 = applyPlayPhaseAfterHp(before, 0, 329);
    expect(t329.playPhase).toBe('live');
    expect(t329.character.hp).toBeGreaterThan(0);
    expect(t329.currentLocation).toBe('Lowmarket');
    expect(t329.activeEncounter).toBeFalsy();
    expect(isPlayInputLocked(t329)).toBe(false);
  });

  it('G: dnd death saves and ended unchanged', () => {
    const dying = {
      ...dnd({ deathSaves: { successes: 0, failures: 2, dead: false } }),
      character: { ...dnd().character, hp: 0 },
    };
    expect(applyPlayPhaseAfterHp(dying, 0, 7).playPhase).not.toBe('ended');
    const dead = applyPlayPhaseAfterHp(dnd(), 0, 7);
    expect(dead.playPhase).toBe('ended');
    const srd = commitDeath(dnd({ character: { ...dnd().character, hp: 0 } }), 'danger', rng);
    expect(srd.dead).toBe(true);
  });

  it('H: property — danger/self over litrpg+rpg → dead false, live, lifeline receipt', () => {
    for (const mode of ['litrpg', 'rpg'] as EngineMode[]) {
      const base = mode === 'litrpg' ? lit() : rpg();
      for (const cause of ['danger', 'self'] as const) {
        const end = commitDeath({ ...base, character: { ...base.character, hp: 0 } }, cause, rng);
        expect(end.dead, `${mode}/${cause}`).toBe(false);
        expect(end.state.character.hp, `${mode}/${cause}`).toBeGreaterThan(0);
        expect(end.receipts.some((r) => /Lifeline:/.test(r)), `${mode}/${cause}`).toBe(true);
        if (cause === 'danger') {
          const phased = applyPlayPhaseAfterHp(base, 0, base.turn);
          expect(phased.playPhase).toBe('live');
          expect(phased.deathSaves?.dead).toBeFalsy();
        }
      }
    }
  });

  it('I: prompt/lore — no permadeath phrases in LitRPG archetypes / named campaign lore', () => {
    const roots = [
      path.join('src', 'game', 'archetypes.ts'),
      path.join('src', 'data', 'campaigns', 'systemIntegration.ts'),
      path.join('src', 'data', 'campaigns', 'voidAudience.ts'),
    ];
    const banned = [/permadeath/i, /permanent death/i, /no respawns/i, /no fourth death/i];
    for (const file of roots) {
      const text = fs.readFileSync(file, 'utf8');
      for (const re of banned) {
        expect(re.test(text), `${file} matches ${re}`).toBe(false);
      }
    }
  });

  it('J: tabletop revive/mercy house rules unchanged', () => {
    const mercy = commitDeath(
      withHouseRules(dnd({ character: { ...dnd().character, hp: 0 }, gold: 40 }), {
        ...createDefaultSettings(),
        ttDeathRule: 'mercy',
      }),
      'danger',
      rng
    );
    expect(mercy.dead).toBe(false);
    expect(mercy.state.character.hp).toBe(1);
    const revive = commitDeath(
      withHouseRules(dnd({ character: { ...dnd().character, hp: 0 }, gold: 400 }), {
        ...createDefaultSettings(),
        ttDeathRule: 'revive',
      }),
      'danger',
      rng
    );
    expect(revive.dead).toBe(false);
    expect(revive.state.character.hp).toBe(1);
  });

  it('Package A: wakes at lastSafeHub away from the killer', () => {
    const next = applyPlayPhaseAfterHp(lit({ currentLocation: 'Ash Ruin', lastSafeHub: 'Lowmarket' }), 0, 20);
    expect(next.currentLocation).toBe('Lowmarket');
    expect(next.currentLocation).not.toBe('Ash Ruin');
    expect(next.activeEncounter).toBeFalsy();
    const key = 'ash ruin';
    expect(next.placeThreats?.[key]?.encounter.hp).toBe(12);
  });

  it('Package A: no instant re-kill (grace + leash)', () => {
    const next = applyPlayPhaseAfterHp(lit({ turn: 40 }), 0, 40);
    expect(next.ambushGraceUntilTurn).toBe(40 + recoveryConfig('litrpg')!.ambushGraceTurns);
    expect(shouldSpawnCombat(next, 'Look around')).toBe(false);
    expect(next.activeEncounter).toBeFalsy();
  });

  it('Package A: coin cache recovers once only within 50 turns', () => {
    const next = applyPlayPhaseAfterHp(lit({ gold: 100, currentLocation: 'Ash Ruin' }), 0, 50);
    expect(next.gold).toBe(90);
    expect(next.deathCoinCache?.amount).toBe(10);
    expect(next.deathCoinCache?.place).toBe('Ash Ruin');
    const atSpot = { ...next, currentLocation: 'Ash Ruin', turn: 60 };
    const once = tryRecoverDeathCoinCache(atSpot);
    expect(once.state.gold).toBe(100);
    expect(once.state.deathCoinCache?.recovered).toBe(true);
    const twice = tryRecoverDeathCoinCache(once.state);
    expect(twice.state.gold).toBe(100);
    expect(twice.receipts.length).toBe(0);
  });

  it('Package A: Weakened expires after 30 turns and on long rest', () => {
    const next = applyPlayPhaseAfterHp(lit({ turn: 1 }), 0, 1);
    expect(isWeakened(next)).toBe(true);
    const later = applyPlayPhaseAfterHp(
      { ...next, turn: 1 + recoveryConfig('litrpg')!.weakenedTurns, character: { ...next.character, hp: 12 } },
      12,
      1 + recoveryConfig('litrpg')!.weakenedTurns
    );
    expect(isWeakened(later)).toBe(false);
    const rested = clearWeakened(next);
    expect(isWeakened(rested)).toBe(false);
    // Long rest path clears Weakened when at a safe hub.
    const hubbed = stampLastSafeHub({
      ...next,
      currentLocation: 'Lowmarket',
      activeEncounter: null,
      sceneFacts: { ...(next.sceneFacts ?? {}), pendingEncounter: undefined } as GameState['sceneFacts'],
      character: { ...next.character, hp: 1 },
    });
    const long = applyRestHeal(hubbed, TABLETOP_LONG_REST_CHIP);
    if (long.receipt) {
      expect(isWeakened(long.state)).toBe(false);
    }
  });

  it('recoveryConfig holds Package A numbers for litrpg and rpg', () => {
    for (const mode of ['litrpg', 'rpg'] as EngineMode[]) {
      const c = recoveryConfig(mode)!;
      expect(c.recoveryHpFraction).toBe(0.5);
      expect(c.clockHours).toBe(8);
      expect(c.weakenedPenaltyPct).toBe(10);
      expect(c.weakenedTurns).toBe(30);
      expect(c.coinDropPct).toBe(10);
      expect(c.coinCacheTurns).toBe(50);
      expect(c.ambushGraceTurns).toBe(5);
    }
    expect(recoveryConfig('dnd')).toBeNull();
  });
});
