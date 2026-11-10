/**
 * Engine-only playtest fixes (2026-11-10). Each case is a rule the dry-run transcripts broke.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { hpAfterFight } from './recoveryRules';
import { applyCharacterXpGain } from './characterXp';
import { applyPlayPhaseAfterHp } from './playPhase';
import { describeIntentStep } from './intentParser';
import { buildClauseWriterFact } from './writerCueLines';
import { resolveCheckContext } from './checkMath';
import { formatTabletopSheet } from './tabletop/characterBuild';
import { buildNewGameState } from './fateAutoplay';
import { selectCatalogEncounter } from './encounterBible';
import { shapePlayerOptions } from './playerOptions';
import type { GameState } from './types';

function lit(hp = 24, max = 24): GameState {
  const s = createInitialState('Jax', 'litrpg');
  return { ...s, character: { ...s.character, hp, maxHp: max, level: 1, xp: 0, xpToNext: 150 } };
}

describe('engine40 defeat HP', () => {
  it('a defeat never raises HP above the HP the fight started at', () => {
    const state = lit(1, 31);
    expect(hpAfterFight(state, false, 8)).toBeLessThanOrEqual(1);
    expect(hpAfterFight(state, false, 0)).toBe(0);
    expect(hpAfterFight(lit(22, 24), false, 20)).toBe(20);
  });

  it('0 HP applies the lifeline: Weakened, gold loss, and a lifeline receipt', () => {
    const state = { ...lit(0, 31), gold: 100, turn: 4 };
    const out = applyPlayPhaseAfterHp(state, 0, 4);
    expect(out.character.conditions ?? []).toContain('Weakened');
    expect(out.gold ?? 0).toBeLessThan(100);
    expect(out.lifelineReceipts?.some((l) => /Lifeline/.test(l))).toBe(true);
    expect(out.character.hp).toBeGreaterThan(0);
  });
});

describe('engine40 level-up HP is stated', () => {
  it('the level-up note names the HP change', () => {
    const base = lit().character;
    const out = applyCharacterXpGain({ ...base, xp: 140, xpToNext: 150, hp: 20, maxHp: 24 }, 20, 'litrpg');
    expect(out.levelsGained).toBe(1);
    expect(out.notes.join(' ')).toMatch(/HP \d+ → \d+/);
  });
});

describe('engine40 talk lines and checks', () => {
  it('does not repeat the same name as target and addressee', () => {
    const line = describeIntentStep({
      action: 'other',
      clause: 'Answer Silas Thorne',
      target: 'Silas Thorne',
      addressee: 'Silas Thorne',
    });
    expect(line).not.toMatch(/Silas Thorne to Silas Thorne/);
  });

  it('a search does not open a speech event', () => {
    const fact = buildClauseWriterFact('Search the area', false, { presentHere: ['the innkeep'] });
    expect(fact).not.toMatch(/Speech event/i);
  });

  it('who-are-you uses Charisma, not the STR save', () => {
    const state = lit();
    const ctx = resolveCheckContext(state, { kind: 'other', label: 'Who are you', targets: [] }, 'Who are you');
    expect(ctx.attr).toBe('CHA');
    expect(ctx.label).not.toBe('General check');
  });
});

describe('engine40 opening sheet and cleared foes', () => {
  it('the tabletop sheet lists every item in the bag', () => {
    const { state } = buildNewGameState({
      bibleId: 'cursed-keep',
      characterName: 'Jax',
      seed: 884211,
      personality: 'chilled-gm',
      engineMode: 'dnd',
      tabletopCreation: true,
    });
    state.inventory = [
      ...(state.inventory ?? []),
      { id: 'hw', name: 'Holy Water (Flask)', rarity: 'Common', quantity: 1, itemType: 'consumable', provenance: 'Kit' },
    ];
    const sheet = formatTabletopSheet(state).join('\n');
    expect(sheet).toMatch(/Holy Water/);
  });

  it('drops Follow up thread chips and keeps a dying pad to the death-save actions', () => {
    const { state } = buildNewGameState({
      bibleId: 'cursed-keep',
      characterName: 'Jax',
      seed: 884211,
      personality: 'chilled-gm',
      engineMode: 'dnd',
      tabletopCreation: true,
    });
    const social = shapePlayerOptions(state, [
      'Follow up: The Lost Survey',
      'Look around',
      'Wait and listen',
      'Search the area',
    ]);
    expect(social.some((c) => /^Follow up:/i.test(c))).toBe(false);
    expect(social.some((c) => /^Search the area$/i.test(c))).toBe(false);
    expect(social).toEqual(expect.arrayContaining(['Look around', 'Wait and listen']));

    state.journey = {
      ...(state.journey ?? { from: state.currentLocation ?? 'Greyhollow Inn', to: 'Keep Gate', legsTotal: 2, legsDone: 0, startedTurn: state.turn ?? 1 }),
      to: 'Keep Gate',
      legsTotal: 2,
      legsDone: 0,
    } as GameState['journey'];
    const unvisited = shapePlayerOptions(state, ['Walk on', 'Look around', 'Wait and listen']);
    expect(unvisited.some((c) => /^Skip ahead to Keep Gate$/i.test(c))).toBe(false);

    state.character = { ...state.character, hp: 0 };
    state.deathSaves = { successes: 1, failures: 0 };
    const dying = shapePlayerOptions(state, ['Follow up: The Lost Survey', 'Look around', 'Face the threat']);
    const declared = dying.filter((c) => !/^(?:say something|do something else)\b/i.test(c));
    expect(declared.length).toBeGreaterThan(0);
    expect(declared.every((c) => /fight for breath|stabilise|drink the/i.test(c))).toBe(true);
    expect(declared.some((c) => /follow up|look around/i.test(c))).toBe(false);
  });

  it('a cleared foe name is not picked again', () => {
    const state = lit();
    state.arcDirector = { clearedFoeNames: ['Ashknife Cell-Blade'] };
    const picked = selectCatalogEncounter(state);
    expect(picked?.foeName ?? '').not.toBe('Ashknife Cell-Blade');
  });
});
