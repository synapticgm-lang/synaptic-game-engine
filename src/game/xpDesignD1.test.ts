/**
 * XP-D1 acceptance: unit pay, grey rule, quest identity, AI XP ignore, skill cap, tabletop/PYOA unchanged.
 */
import { describe, expect, it } from 'vitest';
import { applySandboxXpAwards } from './sandboxXp';
import { applyCharacterXpGain } from './characterXp';
import { contentScale, greyGap, levelBar, questIdentity, skillLevelCap, xpUnit } from './rules/xpPace';
import { LITRPG_MILESTONE_XP, MODE_XP, crToXp, deedXp, milestoneXp } from './xpRules';
import { settleSkillUse } from './rules/skillGrowth';
import type { ActiveEncounter, Character, GameState, Quest } from './types';

function baseChar(over: Partial<Character> = {}): Character {
  return {
    name: 'Jax',
    level: 1,
    xp: 0,
    xpToNext: 150,
    hp: 20,
    maxHp: 20,
    ...over,
  } as Character;
}

function baseState(over: Partial<GameState> = {}): GameState {
  return {
    seed: 'xp-d1',
    turn: 5,
    engineMode: 'litrpg',
    character: baseChar(),
    quests: [],
    sandboxAwardKeys: [],
    currentLocation: 'Lowmarket',
    ...over,
  } as GameState;
}

describe('XP-D1 design', () => {
  it('levelBar / xpUnit / contentScale matrix', () => {
    expect(levelBar('litrpg', 1)).toBe(150);
    expect(xpUnit('litrpg', 1)).toBe(50);
    for (const L of [1, 10, 24]) {
      expect(contentScale(L, L)).toBe(1);
      expect(contentScale(L, Math.max(1, L - 2))).toBe(1);
      if (L > 3) expect(contentScale(L, L - 3)).toBeLessThan(1);
      expect(contentScale(L, Math.max(1, L - greyGap(L)))).toBe(L - greyGap(L) >= 1 ? 0.05 : 1);
      if (L - greyGap(L) - 3 >= 1) expect(contentScale(L, L - greyGap(L) - 3)).toBe(0.05);
    }
  });

  it('MODE_XP litrpg/rpg drop LOW_FOE and OVER_LEVEL; dnd/pyoa unchanged', () => {
    expect(MODE_XP.litrpg.lowFoe).toBe(false);
    expect(MODE_XP.litrpg.overLevel).toBe(false);
    expect(MODE_XP.rpg.lowFoe).toBe(false);
    expect(MODE_XP.rpg.overLevel).toBe(false);
    expect(MODE_XP.dnd.lowFoe).toBe(false);
    expect(MODE_XP.dnd.overLevel).toBe(false);
    expect(MODE_XP.dnd.table).toBe('srd');
    expect(MODE_XP.pyoa.xp).toBe(false);
  });

  it('tabletop CR XP and PYOA zero snapshot (byte-stable vs SRD)', () => {
    expect(crToXp('1/4')).toBe(50);
    expect(crToXp('1')).toBe(200);
    expect(milestoneXp('dnd', 'encounter', { cr: '1/4' }).amount).toBe(50);
    expect(milestoneXp('dnd', 'questComplete', { level: 5 }).amount).toBe(0);
    expect(milestoneXp('pyoa', 'encounter').amount).toBe(0);
    expect(milestoneXp('pyoa', 'questComplete').amount).toBe(0);
  });

  it('fight pay scales with foe level — no flat 80', () => {
    const onLevel = milestoneXp('rpg', 'encounter', { level: 1, playerLevel: 1, foeLevel: 1 }).amount;
    const mini = milestoneXp('rpg', 'miniBoss', { level: 1, playerLevel: 1, foeLevel: 1 }).amount;
    expect(onLevel).toBe(50);
    expect(mini).toBe(100);
    expect(onLevel).not.toBe(80);
    const high = milestoneXp('litrpg', 'encounter', { level: 5, playerLevel: 5, foeLevel: 5 }).amount;
    const low = milestoneXp('litrpg', 'encounter', { level: 5, playerLevel: 5, foeLevel: 1 }).amount;
    expect(high).toBeGreaterThan(low);
  });

  it('same task different giver pays full twice; same giver ladders 100/50/25/10', () => {
    const makeQuest = (id: string, giver: string): Quest =>
      ({
        id,
        name: 'Gather wood',
        description: 'gather wood for the fire',
        status: 'completed',
        type: 'side',
        giver,
        objectives: [{ id: 'o1', description: 'gather wood', completed: true }],
      }) as Quest;

    const mira1 = makeQuest('q-mira-1', 'Mira');
    const tomas = makeQuest('q-tomas-1', 'Tomas');
    expect(questIdentity(mira1)).not.toBe(questIdentity(tomas));

    let state = baseState({ sandboxAwardKeys: ['achv:first-steps'] });
    const before = [makeQuest('q-mira-1', 'Mira')];
    before[0]!.status = 'active';
    before[0]!.objectives![0]!.completed = true;
    const after = [makeQuest('q-mira-1', 'Mira')];
    let r = applySandboxXpAwards(state, {
      playerAction: 'turn in the wood',
      questsBefore: before,
      questsAfter: after,
      events: [],
      turn: 5,
    });
    const first = r.xp;
    expect(first).toBe(LITRPG_MILESTONE_XP.questComplete);

    state = { ...state, sandboxAwardKeys: r.awardKeys };
    const before2 = [makeQuest('q-mira-2', 'Mira')];
    before2[0]!.status = 'active';
    before2[0]!.objectives![0]!.completed = true;
    const after2 = [makeQuest('q-mira-2', 'Mira')];
    r = applySandboxXpAwards(state, {
      playerAction: 'turn in the wood again',
      questsBefore: before2,
      questsAfter: after2,
      events: [],
      turn: 6,
    });
    expect(r.xp).toBe(Math.max(1, Math.round(first * 0.5)));

    state = { ...state, sandboxAwardKeys: r.awardKeys };
    // Different giver, same task — full pay again.
    const beforeT = [makeQuest('q-tomas-1', 'Tomas')];
    beforeT[0]!.status = 'active';
    beforeT[0]!.objectives![0]!.completed = true;
    const afterT = [makeQuest('q-tomas-1', 'Tomas')];
    r = applySandboxXpAwards(state, {
      playerAction: 'turn in Tomas wood',
      questsBefore: beforeT,
      questsAfter: afterT,
      events: [],
      turn: 7,
    });
    expect(r.xp).toBe(first);
  });

  it('resource-style quest keeps identical items on repeats; only XP ladders', () => {
    // Shared reward path: finishSettlementQuestCard / sandbox complete — items from deedItem-style rolls
    // are keyed by quest id, not by repeat index of XP. Fixture: two completes of same identity.
    const q = (id: string): Quest =>
      ({
        id,
        name: 'Gather nightshade',
        description: 'gather nightshade plants',
        status: 'completed',
        type: 'side',
        giver: 'Apothecary',
        objectives: [{ id: 'o1', description: 'gather nightshade', completed: true }],
        rewards: { items: ['health-tonic', 'health-tonic'], xp: 99999 },
      }) as Quest;

    // Objective already done before this turn — only the complete status flip pays (no step / First Steps).
    const before = [q('res-1')];
    before[0]!.status = 'active';
    before[0]!.objectives![0]!.completed = true;
    const after = [q('res-1')];
    const r1 = applySandboxXpAwards(baseState({ sandboxAwardKeys: ['achv:first-steps'] }), {
      playerAction: 'hand over the plants',
      questsBefore: before,
      questsAfter: after,
      events: [],
      turn: 3,
    });
    // Engine ignores rewards.xp = 99999
    const engineComplete = milestoneXp('litrpg', 'questComplete', { level: 1, playerLevel: 1, contentLevel: 1 }).amount;
    expect(r1.xp).toBe(engineComplete);
    expect(r1.xp).toBeLessThan(1000);
    expect(after[0]!.rewards!.items).toEqual(['health-tonic', 'health-tonic']);

    const before2 = [q('res-2')];
    before2[0]!.status = 'active';
    before2[0]!.objectives![0]!.completed = true;
    const after2 = [q('res-2')];
    const r2 = applySandboxXpAwards(
      { ...baseState(), sandboxAwardKeys: r1.awardKeys },
      {
        playerAction: 'hand over more plants',
        questsBefore: before2,
        questsAfter: after2,
        events: [],
        turn: 4,
      }
    );
    expect(r2.xp).toBe(Math.max(1, Math.round(r1.xp * 0.5)));
    expect(after2[0]!.rewards!.items).toEqual(['health-tonic', 'health-tonic']);
  });

  it('AI rewards.xp = 99999 is ignored', () => {
    const q = {
      id: 'ai-fat',
      name: 'Do the thing',
      description: 'do the thing',
      status: 'completed' as const,
      type: 'side' as const,
      giver: 'Handler',
      objectives: [{ id: 'o1', description: 'do the thing', completed: true }],
      rewards: { xp: 99999 },
    };
    const before = [{ ...q, status: 'active' as const, objectives: [{ id: 'o1', description: 'do the thing', completed: true }] }];
    const r = applySandboxXpAwards(
      baseState({ sandboxAwardKeys: ['achv:first-steps'] }),
      {
        playerAction: 'done',
        questsBefore: before,
        questsAfter: [q],
        events: [],
        turn: 2,
      }
    );
    expect(r.xp).toBe(LITRPG_MILESTONE_XP.questComplete);
    expect(r.xp).not.toBe(99999);
  });

  it('skill soft cap blocks practice; per-use gains silent (rank-up only)', () => {
    expect(skillLevelCap(1)).toBe(5);
    // Cap a Searching skill that settleSkillUse matches for "Search the area".
    const s = baseState({
      character: baseChar({
        level: 1,
        namedSkills: [{ id: 'searching', level: 5, xp: 0, rank: 1, uses: 10 }],
      }),
    });
    const r = settleSkillUse(s, 'Search the area', { success: true, taskLevel: 5 });
    const skill = r.state.character?.namedSkills?.find((n) => n.id === 'searching' || (n.level ?? 0) >= 5);
    expect(skill?.level).toBe(5);
    expect(r.receipts.every((line) => !/\+\d+\s*XP/i.test(line))).toBe(true);
    // At soft cap, no rank-up notice.
    expect(r.receipts).toEqual([]);
  });

  it('characterXp uses levelBar ×1.25 after first level-up; old xpToNext kept until then', () => {
    const oldBar = applyCharacterXpGain(baseChar({ xpToNext: 225 }), 225, 'litrpg');
    expect(oldBar.levelsGained).toBe(1);
    expect(oldBar.character.level).toBe(2);
    expect(oldBar.character.xpToNext).toBe(levelBar('litrpg', 2));
  });

  it('LitRPG deeds still pay units; Story RPG deed XP stays 0', () => {
    expect(deedXp('litrpg', 'first', { level: 1, playerLevel: 1 }).amount).toBe(25);
    expect(deedXp('rpg', 'first', { level: 1, playerLevel: 1 }).amount).toBe(0);
  });

  it('Hard difficulty still scales after the table', () => {
    const plain = milestoneXp('litrpg', 'encounter', { level: 1, playerLevel: 1, foeLevel: 1 }).amount;
    const hard = milestoneXp('litrpg', 'encounter', {
      level: 1,
      playerLevel: 1,
      foeLevel: 1,
      strictness: 'hardcore',
    }).amount;
    expect(hard).toBe(Math.round(plain * 1.25));
  });
});
