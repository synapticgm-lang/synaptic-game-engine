/**
 * Tabletop fix 2 (mode-tt lap 3) — one test per item:
 * 1. quest steps carry a place / person the step reader can use (spines and the Woodcutter's Plea);
 * 2. the autoplay harness ends play on death like live play; fight rounds and death saves are progress;
 * 3. encounters fit the SRD 5.2.1 budget for a solo L1 PC;
 * 4. the writer may not read out the travel / quest record, pose the choice, or tell a roll wrong;
 * 5. display names, opening place strings and doubled receipts;
 * 6. the existing fact checker flags the lap-3 kinds.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest } from './types';
import { revealLocalStarterQuest } from './questPlay';
import { tabletopStepAnchor, tabletopStepChip, applyTabletopQuestTurn } from './tabletopQuestProgress';
import { storyChip, turnProgress } from './choiceRanking';
import { applyPlayPhaseAfterHp } from './playPhase';
import { encounterXpBudget, foesWithinBudget, crToXp } from './xpRules';
import { blockWithinXp, statBlockForEncounter } from './rules/srdMonsters';
import { sentenceGateProblems, ignoresTerminalFight } from './beatCommitGate';
import { dropsFightRoll, RECORD_READOUT, POSES_CHOICE, ROLL_CONTRADICTION } from './engineFactGate';
import { collapseEchoedLabel, dropTypedNameAfterToken } from './tokenProse';
import { varyRepeatMentions } from './mentionVariety';
import { filterSystemLogForEngine } from './systemLog';
import { openingPlaceRecord } from './placeNames';
import { cursedKeep } from '../data/campaigns/cursedKeep';
import { TABLETOP_MAIN_SPINES, tabletopSpineToStarterQuest } from '../data/quests/tabletopMainSpines';
// @ts-expect-error plain .mjs script
import { checkTurn } from '../../scripts/factCheck.mjs';

function ck(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 6,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    currentLocation: 'Greyhollow Inn',
    activeEncounter: null,
    character: { ...s.character, name: 'Jax', hp: 10, maxHp: 10, level: 1 } as GameState['character'],
    ...over,
  } as GameState;
}

describe('item 1 — quest steps a reader can place', () => {
  it('every cursed-keep spine step carries its map pin', () => {
    for (const spine of TABLETOP_MAIN_SPINES.filter((s) => s.spineId.startsWith('ck-spine-'))) {
      const [q] = revealLocalStarterQuest([], [tabletopSpineToStarterQuest(spine)]);
      expect(q!.objectives![0]!.place).toBe(spine.mapPin);
      expect(tabletopStepChip(ck({ quests: [q!], currentLocation: spine.mapPin }))).toBeTruthy();
    }
  });

  it('the churchyard spine step is taken at the graveyard', () => {
    const spine = TABLETOP_MAIN_SPINES.find((s) => s.spineId === 'ck-spine-mayor-problem')!;
    const [q] = revealLocalStarterQuest([], [tabletopSpineToStarterQuest(spine)]);
    const s = ck({ quests: [q!], currentLocation: 'Greyhollow Graveyard' });
    const chip = tabletopStepChip(s)!;
    const out = applyTabletopQuestTurn(s, chip);
    expect(out.state.quests![0]!.objectives![0]!.completed).toBe(true);
  });

  it("the Woodcutter's Plea later steps are anchored (keep gate, the people to report to)", () => {
    const seed = cursedKeep.starterQuests!.find((q) => q.id === 'ck-quest-1')!;
    const [q] = revealLocalStarterQuest([], [seed]) as Quest[];
    expect(tabletopStepAnchor(ck(), q!, 2).place).toBe('Keep Gate');
    expect(tabletopStepAnchor(ck(), q!, 3).place).toBe('Keep Gate');
    expect(tabletopStepAnchor(ck(), q!, 4).people).toContain('Father Aldous');
  });

  it('the story chip follows the main spine quest, not the first active quest', () => {
    const spine = TABLETOP_MAIN_SPINES.find((s) => s.spineId === 'ck-spine-midnight-well')!;
    const [main] = revealLocalStarterQuest([], [tabletopSpineToStarterQuest(spine)]);
    const side = { id: 'ck-quest-9', name: 'Side', status: 'active', revealed: true, type: 'side', objectives: [{ id: 'x', description: 'Examine the keep gate', completed: false }] } as unknown as Quest;
    const chip = storyChip(ck({ quests: [side, main!] }));
    expect(chip ?? '').not.toMatch(/keep gate/i);
  });
});

describe('item 2 — death ends the run; fight rounds are progress', () => {
  it('the harness applies the live end-of-run rule', () => {
    const src = readFileSync('src/game/fateAutoplay.ts', 'utf8');
    expect(src).toMatch(/applyPlayPhaseAfterHp\(governed, hp, nextTurn\)/);
    const dead = applyPlayPhaseAfterHp(ck({ deathSaves: { successes: 0, failures: 3, stable: false, dead: true } } as Partial<GameState>), 0, 7);
    expect(dead.playPhase).toBe('ended');
  });

  it('a fight round with HP lost, and a death save, count as progress', () => {
    const enc = { name: 'Bandit', hp: 11, maxHp: 11, count: 1 } as GameState['activeEncounter'];
    const before = ck({ activeEncounter: enc });
    const hurt = ck({ activeEncounter: { ...enc!, hp: 5 }, character: { ...before.character, hp: 6 } as GameState['character'] });
    expect(turnProgress(before, hurt).reasons).toContain('fight');
    const down = ck({ character: { ...before.character, hp: 0 } as GameState['character'], deathSaves: { successes: 0, failures: 0, stable: false, dead: false } } as Partial<GameState>);
    const saved = { ...down, deathSaves: { successes: 1, failures: 0, stable: false, dead: false } } as GameState;
    expect(turnProgress(down, saved).reasons).toContain('fight');
  });
});

describe('item 3 — SRD 5.2.1 budget for a solo L1 PC', () => {
  it('a Giant Spider at L1 fights as a block that fits the Moderate budget', () => {
    const budget = encounterXpBudget(1, 1, 1);
    expect(budget).toBe(75);
    const spider = statBlockForEncounter({ name: 'Giant Spider' } as GameState['activeEncounter'] & object);
    const fit = blockWithinXp(spider, budget);
    expect(crToXp(fit.cr)).toBeLessThanOrEqual(budget);
    expect(fit.srd).toBe(false);
    expect(fit.hp).toBeLessThan(spider.hp);
    expect(fit.attack.rider).toBeUndefined();
  });

  it('four bandits for one L1 PC become three', () => {
    expect(foesWithinBudget('1/8', 4, encounterXpBudget(1, 1, 1))).toBe(3);
    expect(foesWithinBudget('1/8', 2, encounterXpBudget(1, 1, 1))).toBe(2);
    expect(foesWithinBudget('1', 3, 75)).toBe(1);
  });
});

describe('item 4 — the writer tells the engine fact', () => {
  const fight = (engineResult: string) =>
    ck({
      activeEncounter: { name: 'Bandit', hp: 11, maxHp: 11, count: 1 } as GameState['activeEncounter'],
      completedEvent: { engineResult, loot: [], refs: [], outcome: 'hit', combatLive: true } as unknown as GameState['completedEvent'],
    } as Partial<GameState>);

  it('flags a travel record read out and a choice posed', () => {
    const s = ck();
    expect(sentenceGateProblems(s, 'They traveled for thirty minutes on leg one toward Greyhollow Church.')).toContain(RECORD_READOUT);
    expect(sentenceGateProblems(s, 'Now Jax had to decide whether to press about the Keep Gate or wait.')).toContain(POSES_CHOICE);
    expect(sentenceGateProblems(s, 'Rain ran off the church roof.')).not.toContain(RECORD_READOUT);
  });

  it('flags an open quest step given away before the page showed it', () => {
    const seed = cursedKeep.starterQuests!.find((q) => q.id === 'ck-quest-1')!;
    const quests = revealLocalStarterQuest([], [seed]);
    expect(sentenceGateProblems(ck({ quests }), 'Somewhere below lay a sealed crack in the great hall floor.')).toContain(RECORD_READOUT);
  });

  it('flags a blow the engine never landed and a miss on a hit', () => {
    const s = fight('Fight: You attack the Bandit and miss. The Bandit attacks you and hits you for 4.');
    expect(sentenceGateProblems(s, 'Jax struck the bandit across the arm.')).toContain(ROLL_CONTRADICTION);
    expect(sentenceGateProblems(s, 'The blade missed Jax by an inch.')).toContain(ROLL_CONTRADICTION);
    expect(sentenceGateProblems(s, 'Jax struck the ground as they fell.')).not.toContain(ROLL_CONTRADICTION);
  });

  it('a beat that drops the foe hits goes back for the fight rewrite', () => {
    const s = fight('Fight: You attack the Bandit and miss. The Bandit attacks you and hits you for 4.');
    expect(dropsFightRoll(s, 'Jax circled the bandit in the rain.')).toBe(true);
    expect(dropsFightRoll(s, 'The bandit cut Jax across the ribs.')).toBe(false);
    expect(ignoresTerminalFight(s, 'Jax circled the bandit in the rain.')).toBe(true);
  });
});

describe('item 5 — names, places, receipts', () => {
  it('an echoed title or label is one mention', () => {
    expect(collapseEchoedLabel('Father Father Aldous nodded.', 'Father Aldous')).toBe('Father Aldous nodded.');
    expect(collapseEchoedLabel('Jax tightened their chain shirt Chain Shirt.', 'Chain Shirt')).toBe('Jax tightened their Chain Shirt.');
    expect(dropTypedNameAfterToken('@t5, Tilde, smiled.', () => 'Tilde')).toBe('@t5, smiled.');
  });

  it('a foe kind has no short form', () => {
    const refs = [{ id: 'npc:cave-spider', klass: 'person', display: 'Cave Spider' }] as never;
    const out = varyRepeatMentions('The Cave Spider lunged. The Cave Spider fell back.', refs, ['Cave Spider']);
    expect(out).toBe('The Cave Spider lunged. The Cave Spider fell back.');
  });

  it('a room of an indoor hub opens as that hub', () => {
    expect(openingPlaceRecord('cursed-keep', 'Greyhollow tavern common room').place).toBe('Greyhollow Inn');
  });

  it('one cleared receipt per fight', () => {
    const out = filterSystemLogForEngine(
      ['Encounter cleared: Bandit (victory)', 'Encounter cleared: Bandit — defeated', 'Encounter cleared: Bandit — defeated'],
      'dnd'
    );
    expect(out.filter((l) => /^Encounter cleared/.test(l))).toEqual(['Encounter cleared: Bandit — defeated']);
  });
});

describe('item 6 — the fact checker flags the lap-3 kinds', () => {
  const packet = [
    'ENGINE RESULT (required fact): Fight: You attack the Bandit and miss. The Bandit attacks you and hits you for 4.',
    'READER: plain',
    'The player character is Jax: write that name plainly.',
    'OPEN:',
    '- quest The Woodcutter\'s Plea - step: Discover the sealed crack in the great hall floor (the sealed fireplace)',
  ].join('\n');
  const kinds = (prose: string) => (checkTurn({ turn: 4, gmText: prose }, packet, '') as Array<{ kind: string }>).map((f) => f.kind);

  it('flags record-read, player-choice, roll and agency', () => {
    const k = kinds(
      'They traveled for thirty minutes toward the keep. Now Jax had to decide whether to fight or run. Jax struck the bandit hard. The blade missed Jax. Somewhere lay a sealed crack in the great hall floor. It made the task feel dangerous.'
    );
    for (const kind of ['record-read', 'player-choice', 'roll', 'agency']) expect(k).toContain(kind);
  });
});
