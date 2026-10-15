/**
 * q31-SK4 — check resolution per mode (SK-4 acceptance).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { LONG_SHOT_ODDS, TIER_TARGET, runPlayerCheck, type SkillTierName } from './checkMath';
import { applyTabletopSheet, resolveSheet } from './tabletop/characterBuild';
import type { GameState, PlayerIntent } from './types';

const PICK: PlayerIntent = { kind: 'search', label: 'Pick', targets: ['lock'] };

function litrpg(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'sk4',
    engineMode: 'litrpg',
    turn: 3,
    character: { ...s.character, name: 'Rook', level: 1, skills: {}, skillsGrantedThrough: 1 },
    inventory: [...(s.inventory ?? [])],
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
  };
}

function tabletopLock(): GameState {
  const s0 = createInitialState(undefined, 'dnd') as GameState;
  const sheet = resolveSheet({
    classId: 'rogue',
    speciesId: 'human',
    backgroundId: 'criminal',
    method: 'point-buy',
    baseScores: { STR: 8, DEX: 15, CON: 14, INT: 10, WIS: 12, CHA: 10 },
    kitId: 'A',
    source: 'build',
  });
  let s = applyTabletopSheet({ ...s0, seed: 'sk4-tt', engineMode: 'dnd', turn: 3 }, sheet);
  s = {
    ...s,
    character: {
      ...s.character,
      attributes: { ...s.character.attributes, DEX: 16 },
      level: 1,
    },
  };
  if (!(s.inventory ?? []).some((i) => /thieves'? tools/i.test(i.name))) {
    s = {
      ...s,
      inventory: [
        ...(s.inventory ?? []),
        { id: 'tt-tools', name: "Thieves' Tools", rarity: 'Common', quantity: 1, itemType: 'misc', itemLevel: 1, description: 'picks', provenance: 'test' },
      ],
    };
  }
  return s;
}

describe('SK-4: check resolution per mode', () => {
  it('SK4-a TT: Dex 16 + Thieves Tools PB, d20 10 vs DC 15 succeeds', () => {
    const s = tabletopLock();
    expect(s.character.attributes.DEX).toBe(16);
    const r = runPlayerCheck(s, PICK, 'pick the lock', 10);
    expect(r.isSuccess).toBe(true);
    expect(r.d20).toBe(10);
    expect(r.modifier).toBe(5);
    expect(r.dc).toBe(15);
    expect(r.totalScore).toBe(15);
    expect(r.codeResolutionText).toMatch(/d20 10 \+ 5 = 15 vs DC 15/);
  });

  it('SK4-b TT: d20 9 fails; retry allowed (no auto-breakage)', () => {
    const s = tabletopLock();
    const fail = runPlayerCheck(s, PICK, 'pick the lock', 9);
    expect(fail.isSuccess).toBe(false);
    expect(fail.d20).toBe(9);
    expect(fail.totalScore).toBe(14);
    expect(runPlayerCheck(s, PICK, 'pick the lock', 10).isSuccess).toBe(true);
    expect(fail.codeResolutionText).not.toMatch(/snap|break|broken/i);
  });

  it('SK4-c LR: trained Journeyman 2 vs Journeyman — single d20 vs tier target, no long-shot', () => {
    const s = litrpg({
      character: { ...litrpg().character, skills: { thievery: 22 } },
      locationSheet: { name: 'Shaft', threatTier: 3 } as GameState['locationSheet'],
    });
    const r = runPlayerCheck(s, PICK, 'pick the lock', 10);
    expect(r.dc).toBe(TIER_TARGET.Journeyman);
    expect(r.codeResolutionText).not.toMatch(/long-shot/);
    expect(runPlayerCheck(s, PICK, 'pick the lock', 20).codeResolutionText).not.toMatch(/long-shot/);
  });

  it('SK4-d LR: untrained Journeyman — nat 20 then 1/1000; non-20 fails with no second roll', () => {
    const s = litrpg({
      character: { ...litrpg().character, skills: { thievery: 0 } },
      locationSheet: { name: 'Vault', threatTier: 3 } as GameState['locationSheet'],
    });
    expect(LONG_SHOT_ODDS.Expert).toBe(5000);
    const miss = runPlayerCheck(s, PICK, 'pick the lock', 19);
    expect(miss.isSuccess).toBe(false);
    expect(miss.codeResolutionText).toMatch(/long-shot needs natural 20/);
    expect(runPlayerCheck(s, PICK, 'pick the lock', 20, 2).isSuccess).toBe(false);
    expect(runPlayerCheck(s, PICK, 'pick the lock', 20, 2).codeResolutionText).toMatch(/long-shot 1 in 1000 — failure/);
    expect(runPlayerCheck(s, PICK, 'pick the lock', 20, 1).isSuccess).toBe(true);
    expect(runPlayerCheck(s, PICK, 'pick the lock', 20, 1).codeResolutionText).toMatch(/long-shot 1 in 1000 — success/);
  });

  it('SK4-d2 LR: untrained vs Apprentice — d20 vs T+5, no long-shot', () => {
    const s = litrpg({ character: { ...litrpg().character, skills: { thievery: 0 } } });
    const r = runPlayerCheck(s, PICK, 'pick the lock', 15);
    expect(r.dc).toBe(TIER_TARGET.Apprentice + 5);
    expect(r.codeResolutionText).not.toMatch(/long-shot/);
    expect(LONG_SHOT_ODDS.Novice).toBeNull();
    expect(LONG_SHOT_ODDS.Apprentice).toBeNull();
  });

  it('SK4-e long-shot odds table', () => {
    const expectOdds: Record<SkillTierName, number | null> = {
      Novice: null,
      Apprentice: null,
      Journeyman: 1000,
      Expert: 5000,
      Master: 10000,
    };
    for (const tier of Object.keys(expectOdds) as SkillTierName[]) {
      expect(LONG_SHOT_ODDS[tier]).toBe(expectOdds[tier]);
    }
  });
});
