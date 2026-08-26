import { describe, expect, it } from 'vitest';
import { applyCharacterXpGain } from './characterXp';
import { createInitialState } from './defaults';
import { applySandboxXpAwards, isLookAroundAction, SANDBOX_XP } from './sandboxXp';
import { getCampaignBibleById } from '@/data/campaigns';

describe('26t character XP level-ups', () => {
  it('cascades level when XP crosses xpToNext', () => {
    const base = createInitialState('Jax', 'litrpg').character;
    const c = { ...base, xp: 290, xpToNext: 300, level: 1, maxHp: 20, hp: 20 };
    const out = applyCharacterXpGain(c, 20);
    expect(out.levelsGained).toBe(1);
    expect(out.character.level).toBe(2);
    expect(out.character.xp).toBe(10);
    expect(out.character.xpToNext).toBe(450);
    expect(out.notes.some((n) => /Level Up! Now level 2/.test(n))).toBe(true);
  });
});

describe('26t sandbox XP FO3 drip', () => {
  const bible = getCampaignBibleById('summoned-pact')!;

  it('narrows look-around so named examine is not suppressed', () => {
    expect(isLookAroundAction('Look around')).toBe(true);
    expect(isLookAroundAction('Inspect the immediate surroundings')).toBe(true);
    expect(isLookAroundAction('Examine the notice slate')).toBe(false);
    expect(isLookAroundAction('Ask about Earth junk prices')).toBe(false);
    expect(isLookAroundAction('Travel toward Lowmarket')).toBe(false);
  });

  it('awards NPC meet and vendor browse once', () => {
    const state = {
      ...createInitialState('Jax', 'litrpg'),
      campaignBibleId: 'summoned-pact',
      currentLocation: 'Lowmarket',
      sceneFacts: {
        props: [],
        present: ['Mira'],
        crowd: 'present' as const,
        noise: 'voices' as const,
        lastBeat: '',
        updatedTurn: 2,
      },
      sandboxAwardKeys: [] as string[],
      places: [],
      quests: [],
    };
    const meet = applySandboxXpAwards(state, {
      playerAction: 'Ask Mira about Earth junk prices',
      locationName: 'Lowmarket',
      previousLocationName: 'West Wall',
      questsBefore: [],
      questsAfter: [],
      events: [],
      turn: 5,
    });
    expect(meet.xp).toBeGreaterThanOrEqual(SANDBOX_XP.npcMeet);
    expect(meet.notes.some((n) => /met Mira/.test(n))).toBe(true);

    const browse = applySandboxXpAwards(
      { ...state, sandboxAwardKeys: meet.awardKeys, places: meet.places },
      {
        playerAction: 'Browse the nearest stall',
        locationName: 'Lowmarket',
        previousLocationName: 'Lowmarket',
        questsBefore: [],
        questsAfter: [],
        events: [],
        turn: 6,
      }
    );
    expect(browse.notes.some((n) => /wares/.test(n))).toBe(true);
    expect(bible.id).toBe('summoned-pact');
  });

  it('awards landmark inspect XP once per target', () => {
    const state = {
      ...createInitialState('Jax', 'litrpg'),
      campaignBibleId: 'summoned-pact',
      currentLocation: 'West Wall',
      sandboxAwardKeys: [] as string[],
      places: [],
      quests: [],
    };
    const first = applySandboxXpAwards(state, {
      playerAction: 'Examine the notice slate',
      locationName: 'West Wall',
      questsBefore: [],
      questsAfter: [],
      events: [],
      turn: 4,
    });
    expect(first.xp).toBe(SANDBOX_XP.landmarkInspect);
    const second = applySandboxXpAwards(
      { ...state, sandboxAwardKeys: first.awardKeys },
      {
        playerAction: 'Examine the notice slate',
        locationName: 'West Wall',
        questsBefore: [],
        questsAfter: [],
        events: [],
        turn: 5,
      }
    );
    expect(second.xp).toBe(0);
  });
});
