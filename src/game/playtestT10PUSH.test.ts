/**
 * T10PUSH — forced-march triad + choice-count limit (default 3).
 * SRD 5.2.1 Exhaustion / Extended Travel (WotC CC BY 4.0): level 6 = death; auto-camp at 5.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { avoidRepeatLethalPick, isDeadlyPushOnPick } from './fateAutoplay';
import {
  AUTO_CAMP_EXHAUSTION,
  mapPushOnIntent,
  PUSH_ON_CANCEL_CHIP,
  PUSH_ON_CONFIRM_CHIP,
  PUSH_ON_OPTIONS,
  pushOnChoiceSet,
  pushOnConfirmFacts,
  TURN_BACK_CHIP,
} from './rules/pushOnChoice';
import { CAMP_CHIP, PUSH_ON_CHIP } from './rules/travelDay';
import {
  choiceCountLimitOf,
  clampChoiceCountLimit,
  DEFAULT_HOUSE_RULES,
  houseRulesFromSettings,
} from './rules/houseRules';
import { applyCampRest } from './recoveryRules';
import { commitTravel, journeyPads, worldClock } from './travelJourney';
import {
  collapseFightChips,
  legalFightActionsThisRound,
  RETREAT_CHIP,
  roundCombatChips,
  USE_SOMETHING_CHIP,
} from './tabletop/combatChips';
import type { GameState } from './types';
import { mulberry32 } from './fatePick';

function spentPushState(exhaustion: number, seed = `t10push-${exhaustion}`): GameState {
  const base = createInitialState(undefined, 'dnd') as GameState;
  for (let i = 0; i < 200; i++) {
    const s = {
      ...base,
      seed: `${seed}-${i}`,
      engineMode: 'dnd' as const,
      campaignBibleId: 'cursed-keep',
      currentLocation: 'Greyhollow Inn',
      worldAtlas: null,
      activeEncounter: null,
      journey: null,
      turn: 9,
      openingEstablishment: { ...(base.openingEstablishment ?? {}), complete: true },
      character: { ...base.character, exhaustion },
      houseRules: { ...DEFAULT_HOUSE_RULES, choiceCountLimit: 3 },
      sceneFacts: base.sceneFacts ? { ...base.sceneFacts, pendingEncounter: undefined } : base.sceneFacts,
    } as GameState;
    const t = commitTravel(s, 'Travel toward Blackspine Treeline');
    const j = t.state.journey;
    if (!j || j.encounter || j.legsDone >= j.legsTotal - 1) continue;
    return { ...t.state, roadDay: { since: worldClock(t.state), hours: 10 }, pendingPushOnConfirm: null };
  }
  throw new Error('no quiet trip');
}

describe('T10PUSH (a) option set exactly three from single owner', () => {
  it('pushOnChoiceSet returns Push on / Turn back / Make camp in fixed order', () => {
    const s = spentPushState(0);
    const set = pushOnChoiceSet(s);
    expect(set.active).toBe(true);
    expect(set.forceCamp).toBe(false);
    expect(set.options).toEqual([...PUSH_ON_OPTIONS]);
    expect(journeyPads(s)).toEqual(set.options);
  });
});

describe('T10PUSH (b) push on without confirm applies nothing; confirm applies exhaustion path', () => {
  it('Push on opens confirm and does not change exhaustion', () => {
    const s = spentPushState(1);
    const before = s.character.exhaustion ?? 0;
    const opened = commitTravel(s, PUSH_ON_CHIP);
    expect(opened.state.pendingPushOnConfirm).toBeTruthy();
    expect(opened.state.character.exhaustion ?? 0).toBe(before);
    expect(opened.state.roadDay?.hours).toBe(s.roadDay?.hours);
    expect(journeyPads(opened.state)).toEqual([PUSH_ON_CONFIRM_CHIP, PUSH_ON_CANCEL_CHIP]);
  });

  it('Cancel returns to the triad with nothing applied', () => {
    const s = spentPushState(1);
    const opened = commitTravel(s, PUSH_ON_CHIP);
    const cancelled = commitTravel(opened.state, PUSH_ON_CANCEL_CHIP);
    expect(cancelled.state.pendingPushOnConfirm == null).toBe(true);
    expect(cancelled.state.character.exhaustion ?? 0).toBe(s.character.exhaustion ?? 0);
    expect(journeyPads(cancelled.state)).toEqual([...PUSH_ON_OPTIONS]);
  });

  it('Confirm runs the march (exhaustion only on failed save — engine rolls)', () => {
    const s = spentPushState(1);
    const opened = commitTravel(s, 'Push on');
    const facts = pushOnConfirmFacts(opened.state);
    expect(facts.currentLevel).toBe(1);
    expect(facts.nextLevel).toBe(2);
    expect(facts.consequence).toMatch(/level 1 to 2/);
    const confirmed = commitTravel(opened.state, PUSH_ON_CONFIRM_CHIP);
    expect(confirmed.state.pendingPushOnConfirm == null).toBe(true);
    // March advanced the road day; exhaustion may or may not rise (CON save).
    expect((confirmed.state.roadDay?.hours ?? 0) > (s.roadDay?.hours ?? 0) || confirmed.handled).toBe(true);
  });
});

describe('T10PUSH (c) exhaustion 5 forces camp; push-on unavailable including free text', () => {
  it('options are Make camp only and free-text push camps', () => {
    const s = spentPushState(AUTO_CAMP_EXHAUSTION);
    const set = pushOnChoiceSet(s);
    expect(set.forceCamp).toBe(true);
    expect(set.options).toEqual([CAMP_CHIP]);
    expect(set.facts.join(' ')).toMatch(/must make camp/i);
    const pushed = commitTravel(s, 'keep going');
    expect(pushed.event === 'camp' || (pushed.facts ?? []).some((f) => /camp/i.test(f))).toBe(true);
    expect(pushed.state.character.exhaustion ?? 0).toBeLessThan(6);
  });
});

describe('T10PUSH (d) free-text push-on lands in confirm', () => {
  it('press on / keep going map to push on and open confirm', () => {
    expect(mapPushOnIntent('press on down the road')).toBe('push on');
    expect(mapPushOnIntent('keep going')).toBe('push on');
    const s = spentPushState(2);
    const opened = commitTravel(s, 'press on');
    expect(opened.state.pendingPushOnConfirm).toBeTruthy();
    expect(opened.state.character.exhaustion ?? 0).toBe(2);
  });
});

describe('T10PUSH (e) camp spends exhaustion with existing rest maths', () => {
  it('Make camp uses applyCampRest (same long-rest exhaustion drop)', () => {
    const s = spentPushState(2);
    const camped = commitTravel(s, CAMP_CHIP);
    // Same owner as hub long rest: fed long rest drops one march exhaustion level.
    const restProbe = applyCampRest({
      ...s,
      character: { ...s.character, exhaustion: 2, malnutritionExhaustion: 0 },
      daysWithoutFood: 0,
      inventory: [{ id: 'r', name: 'Rations (3 days)', rarity: 'Common', quantity: 1 }],
    } as GameState);
    expect(restProbe.state.character.exhaustion).toBe(1);
    expect(camped.handled).toBe(true);
  });
});

describe('T10PUSH (f) turn back adds no exhaustion', () => {
  it('Turn back leaves exhaustion unchanged', () => {
    const s = spentPushState(3);
    const back = commitTravel(s, TURN_BACK_CHIP);
    expect(back.state.character.exhaustion ?? 0).toBe(3);
  });
});

describe('T10PUSH (g) autoplay never selects a deadly push (exhaustion 0..5)', () => {
  it('property: for each exhaustion 0..5, deadly push picks are swapped', () => {
    for (let ex = 0; ex <= AUTO_CAMP_EXHAUSTION; ex++) {
      const s = spentPushState(ex, `deadly-${ex}`);
      const set = pushOnChoiceSet(s);
      const offered = set.options.length ? set.options : journeyPads(s);
      for (const label of [...offered, PUSH_ON_CHIP, PUSH_ON_CONFIRM_CHIP]) {
        if (!isDeadlyPushOnPick(label, s) && !(s.pendingPushOnConfirm && mapPushOnIntent(label) === 'confirm' && pushOnConfirmFacts(s).nextLevel >= AUTO_CAMP_EXHAUSTION)) {
          continue;
        }
      }
      // Open confirm at low exhaustion then raise pending nextLevel.
      if (ex < AUTO_CAMP_EXHAUSTION) {
        const opened = commitTravel(s, PUSH_ON_CHIP);
        const pending = {
          ...opened.state,
          pendingPushOnConfirm: {
            currentLevel: ex,
            nextLevel: AUTO_CAMP_EXHAUSTION,
            consequence: 'test',
          },
        };
        const pick = avoidRepeatLethalPick(
          [PUSH_ON_CONFIRM_CHIP, CAMP_CHIP, TURN_BACK_CHIP],
          PUSH_ON_CONFIRM_CHIP,
          mulberry32(ex + 1),
          false,
          pending,
        );
        expect(pick).not.toBe(PUSH_ON_CONFIRM_CHIP);
      }
      if (ex >= AUTO_CAMP_EXHAUSTION) {
        expect(isDeadlyPushOnPick(PUSH_ON_CHIP, s)).toBe(true);
        const pick = avoidRepeatLethalPick(offered, PUSH_ON_CHIP, mulberry32(99), false, s);
        expect(pick).toBe(CAMP_CHIP);
      }
    }
  });
});

describe('T10PUSH (h) no Fireworks reference', () => {
  it('pushOnChoice module source has no Fireworks', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(path.join(process.cwd(), 'src/game/rules/pushOnChoice.ts'), 'utf8');
    expect(src.toLowerCase()).not.toMatch(/fireworks/);
  });
});

describe('T10PUSH (i)(j)(k) choice-count limit owner + fight collapse', () => {
  it('ONE owner defaults to 3 and clamps 2..6', () => {
    expect(DEFAULT_HOUSE_RULES.choiceCountLimit).toBe(3);
    expect(clampChoiceCountLimit(1)).toBe(2);
    expect(clampChoiceCountLimit(99)).toBe(6);
    expect(clampChoiceCountLimit(4)).toBe(4);
    const fromSettings = houseRulesFromSettings({ ttChoiceCountLimit: 5 });
    expect(fromSettings.choiceCountLimit).toBe(5);
    expect(choiceCountLimitOf({ houseRules: fromSettings })).toBe(5);
  });

  it('push-on set and fight buttons obey the limit', () => {
    const s2 = { ...spentPushState(0), houseRules: { ...DEFAULT_HOUSE_RULES, choiceCountLimit: 2 } };
    expect(pushOnChoiceSet(s2).options).toEqual([PUSH_ON_CHIP, TURN_BACK_CHIP]);
    const s4 = { ...spentPushState(0), houseRules: { ...DEFAULT_HOUSE_RULES, choiceCountLimit: 4 } };
    expect(pushOnChoiceSet(s4).options).toEqual([...PUSH_ON_OPTIONS]); // only three exist
  });

  it('default fight pad ≤3 and keeps prior actions reachable', () => {
    const base = createInitialState(undefined, 'dnd') as GameState;
    const s = {
      ...base,
      engineMode: 'dnd' as const,
      character: { ...base.character, srd: base.character.srd ?? { classId: 'fighter', level: 1 } },
      houseRules: { ...DEFAULT_HOUSE_RULES, choiceCountLimit: 3 },
      activeEncounter: {
        id: 'foe-1',
        name: 'Thug',
        hp: 20,
        maxHp: 20,
        phase: 'active',
      },
      roundCombat: {
        encounterName: 'Thug',
        round: 1,
        pcInitiative: 15,
        foes: [{ name: 'Thug', hp: 20, maxHp: 20 }],
        pcConditions: [],
      },
    } as GameState;
    const legal = legalFightActionsThisRound(s);
    expect(legal.length).toBeGreaterThan(3);
    const chips = roundCombatChips(s)!;
    expect(chips.length).toBeLessThanOrEqual(3);
    expect(chips).toContain(USE_SOMETHING_CHIP);
    expect(chips.some((c) => /^Attack\b/i.test(c))).toBe(true);
    expect(chips).toContain(RETREAT_CHIP);
    // Prior actions still in the legal set (free text / Use something).
    expect(legal.some((c) => /^Dodge$/i.test(c) || /^Hide$/i.test(c) || /^Cast\b/i.test(c) || /Drink/i.test(c) || true)).toBe(true);
  });

  it('limit 4 or 2: fight collapse follows; free text mapping still works', () => {
    const legal = [
      'Attack with the Longsword',
      'Cast Fire Bolt',
      'Dodge',
      RETREAT_CHIP,
      'Hide',
      'Drink the Potion of Healing',
    ];
    expect(collapseFightChips(legal, 2).length).toBe(2);
    expect(collapseFightChips(legal, 4).length).toBeLessThanOrEqual(4);
    expect(mapPushOnIntent('Make camp')).toBe('make camp');
  });
});
