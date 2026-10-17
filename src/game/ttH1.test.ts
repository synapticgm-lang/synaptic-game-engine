/**
 * TT-H1 Heroic Inspiration (SRD 5.2.1, Wizards of the Coast LLC, CC BY 4.0).
 * Tabletop only. Chip label stays plain; kind/resolver live on EngineChip.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { resolveCheckRecord } from './checkRules';
import { engineChips, type ChipKind } from './choicePipeline';
import { CHIP_RESOLVERS } from './chipCheck';
import {
  awardHeroicInspiration,
  HEROIC_INSPIRATION_REROLL_CHIP,
  INSPIRATION_AWARD_GAP_TURNS,
  inspirationRerollPads,
  resolveInspirationReroll,
  stampLastCheckResult,
} from './rules/houseRules';
import { applyRestHeal } from './recoveryRules';
import { pinDice } from './seededRng';
import type { GameState } from './types';

function humanTt(extra?: Partial<GameState>): GameState {
  const s = createInitialState('Jax', 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow Inn',
    turn: 4,
    houseRules: { ...(s.houseRules ?? {}), heroicInspiration: true, rulesVersion: 'srd-5.2.1' },
    character: {
      ...s.character,
      heroicInspiration: false,
      srd: { ...(s.character.srd ?? {}), speciesId: 'human', classId: 'fighter' } as GameState['character']['srd'],
      hp: 4,
      maxHp: 12,
    },
    inspirationKeys: [],
    ...extra,
  } as GameState;
}

describe('TT-H1 Heroic Inspiration', () => {
  afterEach(() => pinDice(null));

  it('H1-1: a Human gains it on finishing a Long Rest; it does not stack', () => {
    const rested = applyRestHeal(humanTt(), 'Rest for the night');
    expect(rested.after).toContain('Heroic Inspiration: yours (Human, Resourceful)');
    expect(rested.state.character.heroicInspiration).toBe(true);
    const again = applyRestHeal(
      { ...rested.state, lastLongRestAt: (rested.state.lastLongRestAt ?? 0) - 24, character: { ...rested.state.character, hp: 3 } },
      'Rest for the night',
    );
    expect(again.state.character.heroicInspiration).toBe(true);
    expect(again.after ?? []).not.toContain('Heroic Inspiration: yours (Human, Resourceful)');
  });

  it('H1-2: reroll after a failed check; the new roll stands and inspiration is spent', () => {
    const failed = resolveCheckRecord({
      label: 'Persuasion',
      mods: [{ label: 'CHA', value: 1 }],
      dc: 15,
      d20s: [3],
    });
    expect(failed.outcome).toBe('failure');
    let state = stampLastCheckResult(
      humanTt({ character: { ...humanTt().character, heroicInspiration: true } }),
      failed,
    );
    expect(inspirationRerollPads(state)).toEqual([HEROIC_INSPIRATION_REROLL_CHIP]);
    const chips = engineChips(state);
    const chip = chips.find((c) => c.label === HEROIC_INSPIRATION_REROLL_CHIP);
    expect(chip?.kind).toBe('inspiration-reroll' satisfies ChipKind);
    expect(CHIP_RESOLVERS['inspiration-reroll']).toMatch(/resolveInspirationReroll/);
    expect(state.character.heroicInspiration).toBe(true);

    // Pin d20 = 18 so total 19 vs DC 15 succeeds; the new roll stands.
    pinDice(() => 0.85);
    const out = resolveInspirationReroll(state, HEROIC_INSPIRATION_REROLL_CHIP);
    expect(out).not.toBeNull();
    expect(out!.state.character.heroicInspiration).toBe(false);
    expect(out!.state.lastCheckResult?.kept).toBe(18);
    expect(out!.state.lastCheckResult?.outcome).toBe('success');
    expect(out!.receipts[0]).toBe('Heroic Inspiration: spent — rerolled d20 3 → 18 (success)');
    expect(inspirationRerollPads(out!.state)).toEqual([]);
  });

  it('H1-3: an engine-recorded heroic act grants it at most once per about 20 turns', () => {
    const base = humanTt({ turn: 10 });
    const first = awardHeroicInspiration(base, 'heroic-act:shield-ally');
    expect(first.line).toBe('Heroic Inspiration: yours (heroic act)');
    expect(first.state.character.heroicInspiration).toBe(true);
    expect(first.state.lastInspirationAwardTurn).toBe(10);

    const spent = { ...first.state, character: { ...first.state.character, heroicInspiration: false }, turn: 15 };
    const tooSoon = awardHeroicInspiration(spent, 'heroic-act:second');
    expect(tooSoon.line).toBeUndefined();
    expect(tooSoon.state.character.heroicInspiration).toBe(false);

    const later = awardHeroicInspiration({ ...spent, turn: 10 + INSPIRATION_AWARD_GAP_TURNS }, 'heroic-act:second');
    expect(later.line).toBe('Heroic Inspiration: yours (heroic act)');
    expect(later.state.character.heroicInspiration).toBe(true);
  });
});
