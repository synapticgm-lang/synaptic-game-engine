/**
 * 29z1 — deed pay by mode (LitRPG flat kinds / tabletop half-Low / story RPG item only), and one progress
 * meaning for circling (bounce is not movement, a real talk is progress, auto player stays on an
 * unanswered talk). No live GM call. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { LITRPG_MILESTONE_XP, deedXp, milestoneXp } from './xpRules';
import {
  DEED_FIGHTS_CAPSTONE,
  DEED_FIGHTS_COUNT,
  DEED_FIRST_KILL,
  applySandboxXpAwards,
  fightsWon,
} from './sandboxXp';
import {
  applyAutoPlayerStallRules,
  creditCommittedProgress,
  movedOn,
  nudgeIfStuck,
  recordCirclingTurn,
  turnProgress,
} from './choiceRanking';
import { movementFact } from './completedEventPacket';
import type { EngineMode, GameState } from './types';

function base(mode: EngineMode, over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, mode) as GameState;
  return {
    ...s,
    seed: 'z1',
    engineMode: mode,
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow Inn',
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

/** Away from any hub, First Steps already paid, a kill on the ledger. */
const killed = (mode: EngineMode, over: Partial<GameState> = {}): GameState =>
  base(mode, {
    currentLocation: 'Quiet Den',
    ...over,
    sandboxAwardKeys: ['achv:first-steps', ...(over.sandboxAwardKeys ?? [])],
    sceneFacts: {
      ...(createInitialState(undefined, mode) as GameState).sceneFacts!,
      lastKill: { name: 'Ash Wolf', outcome: 'victory', turn: 7, remains: true },
    },
  });

const winKeys = (n: number) => Array.from({ length: n }, (_, i) => `encounter:wolf-${i}:${i + 1}`);

function award(s: GameState) {
  return applySandboxXpAwards(s, {
    playerAction: 'Search the den',
    locationName: s.currentLocation,
    previousLocationName: s.currentLocation,
    questsBefore: [],
    questsAfter: [],
    events: [],
    turn: (s.turn ?? 0) + 1,
  });
}

describe('29z1 — stamp', () => {
  it('HUD/BUILD are 2026-10-10a, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-10-10a');
    expect(BUILD_STAMP).toBe('2026-10-10a');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('29z1 — deed pay by mode', () => {
  it('LitRPG: first 25, count 50, capstone 100; First Steps stays the flat 75', () => {
    expect(deedXp('litrpg', 'first').amount).toBe(LITRPG_MILESTONE_XP.significantPlace);
    expect(deedXp('litrpg', 'count').amount).toBe(LITRPG_MILESTONE_XP.questStep);
    expect(deedXp('litrpg', 'capstone').amount).toBe(LITRPG_MILESTONE_XP.questComplete);
    expect(deedXp('litrpg', 'first').amount).toBe(25);
    expect(milestoneXp('litrpg', 'achievement').amount).toBe(75);
    expect(milestoneXp('dnd', 'achievement').amount).toBe(0);
  });

  it('tabletop: half the level Low budget (level 1 = 25), hardcore and over-level still apply', () => {
    for (const step of ['first', 'count', 'capstone'] as const) expect(deedXp('dnd', step, { level: 1 }).amount).toBe(25);
    expect(deedXp('dnd', 'first', { level: 5 }).amount).toBe(250);
    expect(deedXp('dnd', 'first', { level: 1, strictness: 'hardcore' }).amount).toBeGreaterThan(25);
    expect(deedXp('dnd', 'first', { level: 1, playerLevel: 8, areaLevel: 1 }).amount).toBe(1);
  });

  it('story RPG: 0 XP', () => {
    for (const step of ['first', 'count', 'capstone'] as const) expect(deedXp('rpg', step).amount).toBe(0);
    expect(deedXp('pyoa', 'first').amount).toBe(0);
  });

  it('fights won counts one per fight, not the two keys engineFight writes', () => {
    expect(fightsWon(['encounter:wolf:4', 'encounter:ash-wolf:4', 'encounter:thug:9', 'npc-meet:mira'])).toBe(2);
  });

  it('LitRPG pays first kill once through milestoneXp keys', () => {
    const r = award(killed('litrpg'));
    expect(r.awardKeys).toContain(DEED_FIRST_KILL);
    expect(r.notes.some((n) => /^XP Gained: 25 \(Achievement: First Kill/.test(n))).toBe(true);
    const again = award(killed('litrpg', { sandboxAwardKeys: r.awardKeys }));
    expect(again.notes.some((n) => /First Kill/.test(n))).toBe(false);
  });

  it('LitRPG 3 then 10 fights won: 50 then 100, and one grade-1 item only on the 100 step', () => {
    const three = award(killed('litrpg', { sandboxAwardKeys: [DEED_FIRST_KILL, ...winKeys(3)] }));
    expect(three.awardKeys).toContain(DEED_FIGHTS_COUNT);
    expect(three.xp).toBe(50);
    expect(three.items).toHaveLength(0);
    const ten = award(killed('litrpg', { sandboxAwardKeys: [...three.awardKeys, ...winKeys(10)] }));
    expect(ten.awardKeys).toContain(DEED_FIGHTS_CAPSTONE);
    expect(ten.xp).toBe(100);
    expect(ten.items).toHaveLength(1);
    const later = award(killed('litrpg', { sandboxAwardKeys: [...ten.awardKeys, ...winKeys(12)] }));
    expect(later.xp).toBe(0);
    expect(later.items).toHaveLength(0);
  });

  it('LitRPG capstone item prefers a better weapon of the kind already owned', () => {
    const s = killed('litrpg', {
      sandboxAwardKeys: [DEED_FIRST_KILL, DEED_FIGHTS_COUNT, ...winKeys(10)],
      inventory: [{ id: 'w', name: 'Worn Longsword', rarity: 'Common', quantity: 1, slot: 'mainHand', equipped: true } as GameState['inventory'][number]],
    });
    const item = award(s).items[0]!;
    expect(item).toBeTruthy();
    expect(item.name).not.toBe('Worn Longsword');
  });

  it('tabletop pays 25 per deed at level 1 and never an item', () => {
    const r = award(killed('dnd', { sandboxAwardKeys: winKeys(10) }));
    expect(r.xp).toBe(75);
    expect(r.items).toHaveLength(0);
  });

  it('story RPG pays no XP and grants one grade-1 item once, on the first kill', () => {
    const r = award(killed('rpg', { sandboxAwardKeys: winKeys(10) }));
    expect(r.xp).toBe(0);
    expect(r.items).toHaveLength(1);
    expect(r.lootNotes[0]).toMatch(/^Loot: \[\w+\] .+ \(Achievement: First Kill\)$/);
    const again = award(killed('rpg', { sandboxAwardKeys: [...r.awardKeys, ...winKeys(14)] }));
    expect(again.items).toHaveLength(0);
  });
});

describe('29z1 — one progress meaning', () => {
  const at = (loc: string, recent: string[], over: Partial<GameState> = {}) =>
    base('litrpg', {
      currentLocation: loc,
      circling: { stale: {}, lastProgressTurn: 0, lastLocation: loc, recentPlaces: recent },
      ...over,
    });

  it('a new place is movement; bouncing back (road included) is not', () => {
    expect(movedOn(at('Greyhollow Inn', ['greyhollow inn']), at('Keep Gate', []))).toBe(true);
    const back = at('Keep Gate', ['greyhollow inn', 'road', 'keep gate']);
    expect(movedOn(back, at('Greyhollow Inn', []))).toBe(false);
    const road = at('Road', [], {
      journey: { from: 'Keep Gate', to: 'Greyhollow Inn', ground: 'Road', legsDone: 1, legsTotal: 3 } as GameState['journey'],
    });
    expect(movedOn(back, road)).toBe(false);
    expect(turnProgress(back, road).progressed).toBe(false);
  });

  it('five bounce turns with no other change never count as progress', () => {
    let s = at('Greyhollow Inn', ['greyhollow inn', 'keep gate']);
    let stalled = 0;
    for (let i = 0; i < 5; i++) {
      const next = at(i % 2 ? 'Greyhollow Inn' : 'Keep Gate', s.circling!.recentPlaces!);
      if (!turnProgress(s, next).progressed) stalled++;
      s = next;
    }
    expect(stalled).toBe(5);
  });

  it('a talk that commits a new fact is progress; a new chip label alone is not', () => {
    const mira = { npcId: 'mira', npcName: 'Mira', disposition: 'neutral' as const, facts: [], lastSeenTurn: 1, met: true };
    const before = at('Greyhollow Inn', ['greyhollow inn'], { npcMemories: [mira], choices: ['Talk to Mira'] });
    const answered = { ...before, npcMemories: [{ ...mira, facts: ['The mill burned last spring'] }] };
    expect(turnProgress(before, answered)).toEqual({ progressed: true, reasons: ['social'] });
    const chipOnly = { ...before, choices: ['Talk to Mira', 'Ask Mira about the mill'] };
    expect(turnProgress(before, chipOnly).progressed).toBe(false);
    const warmer = { ...before, npcMemories: [{ ...mira, disposition: 'friendly' as const }] };
    expect(turnProgress(before, warmer).progressed).toBe(true);
  });

  it('a real talk in place does not trip the stuck count, and no nudge fires on it', () => {
    const mira = { npcId: 'mira', npcName: 'Mira', disposition: 'neutral' as const, facts: [] as string[], lastSeenTurn: 1, met: true };
    let s = at('Greyhollow Inn', ['greyhollow inn'], { turn: 3, npcMemories: [mira] });
    for (let t = 4; t <= 9; t++) {
      const start: GameState = { ...s, turn: t };
      const withFact = { ...start, npcMemories: [{ ...mira, facts: Array.from({ length: t }, (_, i) => `fact ${i}`) }] };
      s = recordCirclingTurn(withFact, 'Ask Mira about the mill', [], start);
      expect(nudgeIfStuck(s).receipts).toEqual([]);
    }
    expect(s.circling!.lastProgressTurn).toBe(9);
  });

  it('a fact the writer commits after circling recorded the turn still counts', () => {
    const mira = { npcId: 'mira', npcName: 'Mira', disposition: 'neutral' as const, facts: [] as string[], lastSeenTurn: 1, met: true };
    const start = at('Greyhollow Inn', ['greyhollow inn'], { turn: 6, npcMemories: [mira] });
    const recorded = recordCirclingTurn(start, 'Ask Mira about the mill', [], start);
    expect(recorded.circling!.tried!['greyhollow inn']!['ask mira about the mill']).toBe(6);
    const after = { ...recorded, turn: 7, npcMemories: [{ ...mira, facts: ['The mill burned'] }] };
    const credited = creditCommittedProgress(recorded, after, 'Ask Mira about the mill');
    expect(credited.circling!.lastProgressTurn).toBe(6);
    expect(credited.circling!.tried!['greyhollow inn']!['ask mira about the mill']).toBeUndefined();
  });
});

describe('29z1 — auto player stays on an unanswered talk', () => {
  const EXIT = 'Travel toward Blackspine Treeline';
  const mira = { npcId: 'mira', npcName: 'Mira', disposition: 'neutral' as const, facts: [], lastSeenTurn: 1, met: true, location: 'Greyhollow Inn' };

  it('met person, last picks were look: the talk stays', () => {
    const s = base('dnd', {
      npcMemories: [mira],
      circling: { stale: {}, lastProgressTurn: 0, recentFamilies: ['look', 'look', 'wait'] },
    });
    expect(applyAutoPlayerStallRules(s, ['Talk to Mira', EXIT, 'Look around'], 'Talk to Mira')).toEqual({ pick: 'Talk to Mira', rule: null });
  });

  it('the same ask already answered here: the auto player moves on', () => {
    const s = base('dnd', {
      npcMemories: [mira],
      turn: 6,
      circling: { stale: {}, lastProgressTurn: 0, tried: { 'greyhollow inn': { 'talk to mira': 5 } } },
    });
    expect(applyAutoPlayerStallRules(s, ['Talk to Mira', EXIT], 'Talk to Mira').rule).toBe('heard-talk');
  });
});

describe('29z1 — writer fact on a talk with no move', () => {
  it('says talking in place is valid play on a talk turn only', () => {
    const s = base('litrpg', { circling: { stale: {}, lastProgressTurn: 0, lastLocation: 'Greyhollow Inn' } });
    expect(movementFact(s, 'Ask Mira about the mill')).toMatch(
      /^No move this turn: at Greyhollow Inn before and after\..* A talk, ask or offer with no move is valid play: answer it in dialogue here and do not travel\.$/
    );
    expect(movementFact(s, 'Look around')).not.toMatch(/valid play/);
  });
});
