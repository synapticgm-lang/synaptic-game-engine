/**
 * T10Q4 — Face the thugs / Face the threat auto-resolve must narrate the engine round log
 * (not a one-sentence "fight was already over"), and same-turn DEFEAT counts as turnProgress.
 * Evidence: rpg s9601 T206 Face the thugs; Gemini problem 2; RC6 same-turn Face/DEFEAT LOOP STOP gap.
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { createInitialState } from './defaults';
import type { ActiveEncounter, GameState } from './types';
import { resolveEngineFight, autoResolveFightFacts } from './engineFight';
import { runArcDirectorBeforeGm } from './arcDirector';
import { engineResultFact } from './engineResult';
import { turnProgress } from './choiceRanking';
import { emptySceneFacts } from './sceneFacts';
import { simulateCombat, type EnemyStats } from './combat';
import { mulberry32 } from './fatePick';

afterEach(() => {
  vi.restoreAllMocks();
});

function foe(over: Partial<ActiveEncounter> = {}): ActiveEncounter {
  return {
    name: 'the thugs',
    level: 4,
    hp: 24,
    maxHp: 24,
    strength: 12,
    constitution: 12,
    armorClass: 12,
    xpReward: 40,
    goldReward: 10,
    count: 3,
    phase: 'engaged',
    ...over,
  } as ActiveEncounter;
}

function rpg(over: Partial<GameState> = {}): GameState {
  const base = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...base,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    character: { ...base.character, name: 'Jax', level: 3, hp: 28, maxHp: 28 },
    turn: 206,
    currentLocation: 'Salt Road Waystation',
    activeEncounter: foe(),
    sceneFacts: { ...emptySceneFacts(206), present: ['the thugs'], crowdCount: 3 },
    openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    ...over,
  } as GameState;
}

function litrpg(over: Partial<GameState> = {}): GameState {
  const base = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...base,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    character: { ...base.character, name: 'Jax', level: 2, hp: 22, maxHp: 22 },
    turn: 40,
    currentLocation: 'Lowmarket',
    activeEncounter: foe({ name: 'Pact-Hunter Skirmisher', count: 1, hp: 18, maxHp: 18 }),
    sceneFacts: { ...emptySceneFacts(40), present: ['Pact-Hunter Skirmisher'], crowdCount: 1 },
    openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    ...over,
  } as GameState;
}

describe('T10Q4 auto-resolve round log + Face progress', () => {
  it('autoResolveFightFacts lists who hit whom from roundsLog (not a round-count telegram)', () => {
    const enemy: EnemyStats = {
      name: 'the thugs',
      level: 4,
      hp: 24,
      maxHp: 24,
      attack: 6,
      defense: 2,
      armorClass: 12,
      xpReward: 40,
      goldReward: 10,
    };
    vi.spyOn(Math, 'random').mockImplementation(mulberry32(206));
    const result = simulateCombat(rpg(), enemy);
    const facts = autoResolveFightFacts(result, 'the thugs');
    expect(facts.length).toBeGreaterThan(20);
    expect(facts).toMatch(/\b(You hit|You miss|hits you|misses you|strike first)\b/);
    expect(facts).not.toMatch(/^You fought .+ for \d+ rounds/i);
    expect(facts).not.toMatch(/^Round \d+ —/);
  });

  it('Face the thugs (rpg) ENGINE OUTCOME includes hit/miss swings, not only round count', () => {
    vi.spyOn(Math, 'random').mockImplementation(mulberry32(9601));
    const fought = resolveEngineFight(rpg(), 'Face the thugs');
    expect(fought).not.toBeNull();
    expect(fought!.facts).toMatch(/^ENGINE OUTCOME/);
    expect(fought!.facts).toMatch(/\b(You hit|You miss|hits you|misses you|strike first)\b/);
    expect(fought!.facts).toMatch(/went down and stayed down|left you there/i);
    expect(fought!.facts).not.toMatch(/You fought the thugs for \d+ rounds/i);
    expect(fought!.receipts.some((r) => /^Fight: (?:VICTORY|DEFEAT)/.test(r))).toBe(true);
  });

  it('Face the threat (litrpg) fightFacts reach the writer via arcDirector + engineResultFact', () => {
    vi.spyOn(Math, 'random').mockImplementation(mulberry32(9711));
    const before = litrpg({
      activeEncounter: null,
      sceneFacts: {
        ...emptySceneFacts(40),
        pendingEncounter: foe({ name: 'Pact-Hunter Skirmisher', count: 1, hp: 18, maxHp: 18 }),
      },
    });
    const arc = runArcDirectorBeforeGm(before, 'Face the threat');
    expect(arc.fightFacts ?? '').toMatch(/\b(You hit|You miss|hits you|misses you|strike first)\b/);
    const fact = engineResultFact([...(arc.systemReceipts ?? []), ...(arc.fightFacts ? [arc.fightFacts] : [])], 'litrpg');
    expect(fact).toMatch(/\b(You hit|You miss|hits you|misses you|strike first)\b/);
    expect(fact).not.toMatch(/You fought .+ for \d+ rounds/i);
  });

  it('same-turn Face DEFEAT (no XP) is turnProgress via Fight: DEFEAT receipt', () => {
    // Force a loss: PC at 1 HP, tough foe — or use receipt-only path matching RC6 LOOP STOP gap.
    const before = rpg({ activeEncounter: null, character: { ...rpg().character, hp: 28 } });
    const after = rpg({
      activeEncounter: null,
      character: { ...rpg().character, hp: 4 },
    });
    const defeatReceipts = [
      'Fight: DEFEAT vs the thugs in 3 rounds. The fight is over: you lost it.',
      'Encounter cleared: the thugs (defeat)',
      'HP: 28 → 4 (dealt 10, took 24)',
    ];
    // Pre-fix gap: VICTORY receipt counted, DEFEAT did not; same-turn clear has no inFight before/after.
    expect(turnProgress(before, after, []).progressed).toBe(false);
    const p = turnProgress(before, after, defeatReceipts);
    expect(p.progressed).toBe(true);
    expect(p.reasons).toContain('receipt');
    expect(turnProgress(before, after, ['Fight: VICTORY vs the thugs in 3 rounds.']).reasons).toContain('receipt');
  });
});
