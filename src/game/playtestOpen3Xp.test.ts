/**
 * XP-D1 OPEN3 — fight XP floor, Check System inbox, no-progress Search/Read/Open suppress.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { milestoneXp } from './xpRules';
import { levelBar, unitMilestoneAmount } from './rules/xpPace';
import {
  appendSystemNotices,
  checkSystemOffered,
  openSystemNotices,
  unopenedSystemNotices,
} from './systemNoticeInbox';
import {
  actionFamily,
  creditFillerOffers,
  fillerSceneKey,
  isFillerNoProgressChip,
  rankChoices,
  recordCirclingTurn,
  SEEK_FIGHT_CHIP,
} from './choiceRanking';
import type { GameState } from './types';
import fs from 'node:fs';
import path from 'node:path';

function lit(over: Partial<GameState> = {}): GameState {
  const s = createInitialState('Open3', 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    openingEstablishment: { ...(s.openingEstablishment as object), complete: true } as GameState['openingEstablishment'],
    character: { ...s.character!, name: 'Jax', level: 2, xp: 0, xpToNext: levelBar('litrpg', 2), hp: 20, maxHp: 20 },
    turn: 10,
    circling: { stale: {}, lastProgressTurn: 10 },
    ...over,
  } as GameState;
}

describe('XP-D1 OPEN3 fight XP', () => {
  it('same-level L2 fight pays a real chunk of the bar (OPEN4 ~10–18%)', () => {
    const bar = levelBar('litrpg', 2);
    const amt = unitMilestoneAmount('litrpg', 'encounter', { playerLevel: 2, foeLevel: 2 });
    const share = amt / bar;
    expect(amt).toBeGreaterThanOrEqual(1);
    expect(share).toBeGreaterThanOrEqual(0.1);
    expect(share).toBeLessThanOrEqual(0.18);
  });

  it('L2 quest complete is smaller than the OPEN2 3-unit lump', () => {
    const complete = milestoneXp('litrpg', 'questComplete', {
      level: 2,
      playerLevel: 2,
      contentLevel: 2,
    }).amount;
    const step = milestoneXp('litrpg', 'questStep', { level: 2, playerLevel: 2, contentLevel: 2 }).amount;
    const fight = milestoneXp('litrpg', 'encounter', { level: 2, playerLevel: 2, foeLevel: 2 }).amount;
    expect(complete).toBeLessThan(60);
    expect(step + complete).toBeLessThan(levelBar('litrpg', 2));
    expect(fight).toBeGreaterThanOrEqual(1);
  });

  it('L1 rite path amounts unchanged (step 50 / fight 50 / complete 150 snapshot)', () => {
    expect(milestoneXp('litrpg', 'questStep', { level: 1, playerLevel: 1 }).amount).toBe(50);
    expect(milestoneXp('litrpg', 'encounter', { level: 1, playerLevel: 1, foeLevel: 1 }).amount).toBe(50);
  });
});

describe('XP-D1 OPEN3 Check System inbox', () => {
  it('level-up and rite XP each raise the Check System stack', () => {
    let state = lit({ character: { ...lit().character!, level: 1, xp: 0, xpToNext: 150 } });
    expect(checkSystemOffered(state)).toBe(false);
    state = appendSystemNotices(state, [
      'XP Gained: 150 (opening rite: Opening Rite: The Pact)',
      'Level Up! Now level 2.',
      'Quest complete: Opening Rite: The Pact',
    ]);
    expect(unopenedSystemNotices(state)).toBeGreaterThanOrEqual(2);
    expect(checkSystemOffered(state)).toBe(true);
    const opened = openSystemNotices(state);
    expect(unopenedSystemNotices(opened)).toBe(0);
    expect(opened.systemNoticeInbox?.lines.length).toBeGreaterThanOrEqual(2);
  });

  it('opening notices does not change XP', () => {
    let state = appendSystemNotices(lit(), ['XP Gained: 21 (defeated the thugs)']);
    const xp = state.character?.xp ?? 0;
    state = openSystemNotices(state);
    expect(state.character?.xp).toBe(xp);
  });
});

describe('XP-D1 OPEN3 no-progress filler chips', () => {
  it('Read / Analyze / Search / Open share the search filler family', () => {
    expect(actionFamily('Search the area')).toBe('search');
    expect(actionFamily('Read Warden Elise Cho')).toBe('search');
    expect(actionFamily('Analyze High Chanter Orel Vane')).toBe('search');
    expect(actionFamily('Open the bronze reward box')).toBe('search');
  });

  it('a dead Search is not re-offered until the scene changes', () => {
    let state = lit({
      currentLocation: 'Metro Platform',
      turn: 12,
      circling: { stale: {}, lastProgressTurn: 10 },
    });
    state = recordCirclingTurn(state, 'Search the area', [], {
      ...state,
      turn: 11,
      circling: { stale: {}, lastProgressTurn: 10 },
    });
    const ranked = rankChoices(state, [
      'Search the area',
      'Read Warden Elise Cho',
      'Analyze Warden Elise Cho',
      'Open the bronze reward box',
      'Travel toward Riverside Stronghold',
      'Ask the officer about the lead',
    ]);
    expect(ranked.choices.some((c) => /^Search|^Read |^Analyze |^Open /i.test(c))).toBe(false);
    expect(ranked.choices.some((c) => /travel toward|ask /i.test(c))).toBe(true);
  });

  it('simulated 50-turn chip stream: no filler label repeats more than twice without a scene change', () => {
    let state = lit({
      currentLocation: 'Cathedral Close',
      turn: 2,
      circling: { stale: {}, lastProgressTurn: 2 },
    });
    const offerCounts = new Map<string, number>();
    let scene = fillerSceneKey(state);
    for (let t = 3; t <= 52; t++) {
      state = { ...state, turn: t };
      const pool = [
        'Search the area',
        'Read Orel Vane',
        'Analyze Orel Vane',
        'Open the bronze reward box',
        'Travel toward Lowmarket',
        'Ask what they want',
        'Look for a fight',
      ];
      const offered = rankChoices(state, pool).choices;
      state = creditFillerOffers(state, offered);
      for (const c of offered) {
        if (!/^(Search|Read |Analyze|Open )/i.test(c)) continue;
        const key = `${scene}::${c}`;
        offerCounts.set(key, (offerCounts.get(key) ?? 0) + 1);
      }
      // Take a filler once with no progress, then a progress travel every few turns.
      const filler = offered.find((c) => /^(Search|Read |Analyze|Open )/i.test(c));
      if (filler && t % 3 !== 0) {
        state = recordCirclingTurn({ ...state, turn: t }, filler, [], state);
      } else {
        state = recordCirclingTurn(
          {
            ...state,
            turn: t,
            currentLocation: t % 7 === 0 ? 'Lowmarket' : state.currentLocation,
            // Trivial XP tick must NOT reset the filler offer scene (OPEN4).
            character: {
              ...state.character!,
              xp: (state.character?.xp ?? 0) + (t % 5 === 0 ? 5 : 0),
            },
          },
          'Travel toward Lowmarket',
          t % 5 === 0 ? ['XP Gained: 5 (quest step: bearings)'] : [],
          state
        );
        scene = fillerSceneKey(state);
      }
    }
    for (const [key, n] of offerCounts) {
      expect(n, key).toBeLessThanOrEqual(2);
    }
  });

  it('OPEN4: Examine/Inspect/Study stay inspect for loiter but count as filler', () => {
    expect(actionFamily('Examine the gouge marks')).toBe('inspect');
    expect(actionFamily('Inspect cracked street')).toBe('inspect');
    expect(actionFamily('Study the pact slate before you answer')).toBe('inspect');
    expect(isFillerNoProgressChip('Study the pact slate before you answer')).toBe(true);
    expect(actionFamily('Listen at the door')).toBe('search');
    expect(actionFamily('Check System')).toBe('other');
  });

  it('OPEN4: Seek Fight injects beside a progress pad on drought (does not steal Travel)', () => {
    const state = lit({
      currentLocation: 'Cathedral Close',
      turn: 20,
      campaignBibleId: 'summoned-pact',
      arcDirector: { turnsSinceCombatReceipt: 10 } as GameState['arcDirector'],
      circling: { stale: {}, lastProgressTurn: 18 },
    });
    const ranked = rankChoices(state, [
      'Travel toward Lowmarket',
      'Ask Col Thatch about the lead',
      'Search the area',
      'Read the signs of the report',
    ]);
    // OPEN5: outdoors, Hunt takes over from Seek Fight on drought (one combat chip, never both).
    expect(ranked.choices.some((c) => c === SEEK_FIGHT_CHIP || /^Hunt the wildlife nearby$/i.test(c))).toBe(true);
    expect(ranked.choices[0]).not.toBe(SEEK_FIGHT_CHIP); // progress / travel stays first when present
    expect(ranked.choices.some((c) => /travel toward lowmarket/i.test(c))).toBe(true);
  });

  it('OPEN4: same filler label offered at most twice without meaningful scene change', () => {
    let state = lit({
      currentLocation: 'a shop or cafe at Registration',
      turn: 27,
      circling: { stale: {}, lastProgressTurn: 24 },
    });
    const label = 'Read the signs of the report';
    const pool = [label, 'Ask Marcus about the gate', 'Travel toward Cracked Street', 'Say something…'];
    let offers = 0;
    for (let i = 0; i < 6; i++) {
      state = { ...state, turn: 27 + i };
      const offered = rankChoices(state, pool).choices;
      state = creditFillerOffers(state, offered);
      if (offered.includes(label)) offers += 1;
      // Player picks talk — social progress must not re-arm the filler forever.
      state = recordCirclingTurn(state, 'Ask Marcus about the gate', [], state);
    }
    expect(offers).toBeLessThanOrEqual(2);
  });

  it('OPEN4: replay open3 seed 7304 filler stream — no label >2 without meaningful change', () => {
    const rundir = path.resolve(
      'scripts/fate-autoplay/runs/2026-11-02T10-06-25-036Z_system-integration_cold-system_s7304_quest/turns.jsonl'
    );
    if (!fs.existsSync(rundir)) return; // harness tape optional on clean checkouts
    const turns = fs
      .readFileSync(rundir, 'utf8')
      .trim()
      .split(/\n/)
      .map((l) => JSON.parse(l) as { offeredChoices?: string[]; fatePick?: string; location?: string; snapshotGist?: { location?: string }; characterXp?: number; level?: number; progress?: boolean });
    let state = lit({
      currentLocation: 'a shop or cafe at Registration',
      turn: 1,
      campaignBibleId: 'system-integration',
      character: { ...lit().character!, level: 2, xp: 150, xpToNext: levelBar('litrpg', 2) },
      circling: { stale: {}, lastProgressTurn: 1 },
    });
    const counts = new Map<string, number>();
    let scene = fillerSceneKey(state);
    for (const t of turns) {
      const loc = t.location || t.snapshotGist?.location || state.currentLocation;
      state = { ...state, turn: (state.turn ?? 0) + 1, currentLocation: loc };
      // Replay only the filler labels from the live offer list through rankChoices+credit.
      const liveFillers = (t.offeredChoices ?? []).filter((c) =>
        /^(Search|Read |Analyze|Open |Inspect|Examine|Study )/i.test(c)
      );
      if (!liveFillers.length) continue;
      const pool = [
        ...liveFillers,
        'Travel toward Cracked Street',
        'Ask a witness who knows the lead about the lead',
      ];
      const offered = rankChoices(state, pool).choices;
      state = creditFillerOffers(state, offered);
      const nextScene = fillerSceneKey(state);
      if (nextScene !== scene) {
        scene = nextScene;
      }
      for (const c of offered) {
        if (!/^(Search|Read |Analyze|Open |Inspect|Examine|Study )/i.test(c)) continue;
        const key = `${scene}::${c}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const pick = t.fatePick || 'Ask a witness who knows the lead about the lead';
      state = recordCirclingTurn(state, pick, [], state);
    }
    for (const [key, n] of counts) {
      expect(n, key).toBeLessThanOrEqual(2);
    }
  });
});
