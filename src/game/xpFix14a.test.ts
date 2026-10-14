/**
 * 2026-10-14d — earned XP only (docs/design/litrpg-xp-review.md, items 1–8). LitRPG and story RPG;
 * tabletop amounts unchanged. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { clampSystemHousing, type SystemPartId } from './systemHousing';
import { SMALL_XP_PER_DAY, applySandboxXpAwards } from './sandboxXp';
import { hubsForBibleId } from './outdoorHubs';
import { LITRPG_MILESTONE_XP, LOW_FOE_SHARE, milestoneXp } from './xpRules';
import { FAST_XP_AWARDS } from './xpPolicy';
import { DAILY_QUEST_MILESTONE_XP, applyDailyQuestMilestone } from './dailyMilestoneLedger';
import type { ActiveEncounter, EngineMode, GameState, NpcMemory, Quest } from './types';

function base(mode: EngineMode = 'litrpg', over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, mode) as GameState;
  return {
    ...s,
    seed: 'xp14a',
    ...(mode === 'litrpg'
      ? { systemHousing: clampSystemHousing({ housing: 'private_window', parts: {} as Record<SystemPartId, boolean> }) }
      : {}),
    engineMode: mode,
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Quiet Den',
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    quests: [],
    places: [],
    npcMemories: [],
    sandboxAwardKeys: [],
    turn: 8,
    ...over,
  };
}

type Opts = Parameters<typeof applySandboxXpAwards>[1];
function award(s: GameState, over: Partial<Opts> = {}) {
  return applySandboxXpAwards(s, {
    playerAction: 'Wait',
    locationName: s.currentLocation,
    previousLocationName: s.currentLocation,
    questsBefore: [],
    questsAfter: [],
    events: [],
    turn: (s.turn ?? 0) + 1,
    ...over,
  });
}

const roster = (name: string, id = name.toLowerCase()): NpcMemory =>
  ({ npcId: id, npcName: name, present: true, facts: ['Bible roster: yes'] }) as unknown as NpcMemory;

const quest = (desc: string, done = false): Quest =>
  ({ id: 'q1', name: 'Errand', status: 'active', objectives: [{ id: 'o1', description: desc, completed: done }] }) as unknown as Quest;

describe('xp fix 2026-10-14d', () => {
  it('1) First Steps pays only on the first quest step, never for surviving turns', () => {
    const late = award(base('litrpg', { turn: 20 }), { turn: 21 });
    expect(late.awardKeys).not.toContain('achv:first-steps');
    expect(late.xp).toBe(0);
    const step = award(base('litrpg'), {
      playerAction: 'Hand over the ledger',
      questsBefore: [quest('Deliver the ledger')],
      questsAfter: [quest('Deliver the ledger', true)],
    });
    expect(step.awardKeys).toContain('achv:first-steps');
  });

  it('2) opening cast pays nothing; talk pays only after a passed social check', () => {
    const cast = base('litrpg', {
      npcMemories: [roster('Vessa')],
      openingEstablishment: { ...(base().openingEstablishment ?? {}), castNpcIds: ['vessa'] } as GameState['openingEstablishment'],
    });
    expect(award(cast).xp).toBe(0);
    const talk = { playerAction: 'Talk to Vessa about the pact' };
    expect(award(cast, talk).xp).toBe(0);
    expect(award(cast, { ...talk, socialCheckSucceeded: false }).xp).toBe(0);
    expect(award(cast, { ...talk, socialCheckSucceeded: true }).xp).toBe(LITRPG_MILESTONE_XP.significantPerson);
  });

  it('3) a hub pays only via a quest objective or a passed discovery check', () => {
    const hub = hubsForBibleId('summoned-pact')[0]!;
    const s = base('litrpg', { currentLocation: hub.name });
    const travel = { previousLocationName: 'Quiet Den', playerAction: `Travel toward ${hub.name}` };
    expect(award(s, travel).awardKeys.some((k) => k.startsWith('discover-hub:'))).toBe(false);
    expect(award(s, { ...travel, discoveryCheckSucceeded: true }).xp).toBe(LITRPG_MILESTONE_XP.significantPlace);
    const q = [quest(`Find the contact at ${hub.name}`)];
    expect(award(s, { ...travel, questsBefore: q, questsAfter: q }).xp).toBe(LITRPG_MILESTONE_XP.significantPlace);
  });

  it('4) choosing a spine fork pays nothing', () => {
    const s = base('litrpg', {
      pyoaSpine: { visited: ['tf-n01', 'tf-n02', 'tf-n03'] } as unknown as GameState['pyoaSpine'],
    });
    expect(award(s).awardKeys.some((k) => k.startsWith('spine-fork:'))).toBe(false);
  });

  it('5) the daily milestone pays nothing', () => {
    expect(DAILY_QUEST_MILESTONE_XP).toBe(0);
    expect(FAST_XP_AWARDS.dailyFirstTick).toBe(0);
    const r = applyDailyQuestMilestone(base('litrpg'), {
      questsBefore: [quest('Deliver the ledger')],
      questsAfter: [quest('Deliver the ledger', true)],
    });
    expect(r).toBeNull();
  });

  it('6) FAST_XP_AWARDS reads the one LitRPG table; drip keys are 0', () => {
    expect(FAST_XP_AWARDS.combatTrash).toBe(LITRPG_MILESTONE_XP.encounter);
    expect(FAST_XP_AWARDS.combatElite).toBe(LITRPG_MILESTONE_XP.miniBoss);
    expect(FAST_XP_AWARDS.combatBoss).toBe(LITRPG_MILESTONE_XP.boss);
    expect(FAST_XP_AWARDS.questTick).toBe(LITRPG_MILESTONE_XP.questStep);
    expect(FAST_XP_AWARDS.questComplete).toBe(LITRPG_MILESTONE_XP.questComplete);
    expect(FAST_XP_AWARDS.landmarkInspect).toBe(0);
    expect(FAST_XP_AWARDS.questAccept).toBe(0);
  });

  it('7) a foe 3+ levels below pays 25% (LitRPG and story RPG; tabletop unchanged)', () => {
    const full = LITRPG_MILESTONE_XP.encounter;
    expect(milestoneXp('litrpg', 'encounter', { level: 4, foeLevel: 2 }).amount).toBe(full);
    expect(milestoneXp('litrpg', 'encounter', { level: 4, foeLevel: 1 }).amount).toBe(Math.round(full * LOW_FOE_SHARE));
    expect(milestoneXp('rpg', 'boss', { level: 5, foeLevel: 1 }).amount).toBe(Math.round(LITRPG_MILESTONE_XP.boss * LOW_FOE_SHARE));
    expect(milestoneXp('dnd', 'encounter', { level: 5, foeLevel: 1, cr: '1' }).amount).toBe(200);

    const foe = { name: 'Rat', level: 1, hp: 0, maxHp: 4, encounterId: 'rat' } as ActiveEncounter;
    const s = base('litrpg', {
      character: { ...base().character, level: 4 },
      sandboxAwardKeys: ['achv:first-kill'],
    });
    const r = award(s, { endedEncounter: foe, encounterCleared: true, enemyKilled: true });
    expect(r.notes.some((n) => n.includes(`XP Gained: ${Math.round(full * LOW_FOE_SHARE)} (defeated Rat`))).toBe(true);
  });

  it('8) small first-time awards cap at 3 per in-game day', () => {
    const names = ['Ana', 'Bram', 'Cole', 'Dara'];
    let s = base('litrpg', { npcMemories: names.map((n) => roster(n)) });
    let paid = 0;
    for (const n of names) {
      const r = award(s, { playerAction: `Talk to ${n}`, socialCheckSucceeded: true });
      paid += r.xp > 0 ? 1 : 0;
      s = { ...s, sandboxAwardKeys: r.awardKeys };
    }
    expect(paid).toBe(SMALL_XP_PER_DAY);
    const nextDay = {
      ...s,
      npcMemories: [...(s.npcMemories ?? []), roster('Esk')],
      worldLedger: { ...(s.worldLedger ?? {}), clock: { ...(s.worldLedger?.clock ?? {}), day: (s.worldLedger?.clock?.day ?? 0) + 1 } },
    } as GameState;
    expect(award(nextDay, { playerAction: 'Talk to Esk', socialCheckSucceeded: true }).xp).toBe(
      LITRPG_MILESTONE_XP.significantPerson
    );
  });
});
