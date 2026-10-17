/**
 * q42-OPT4m — OPT-4 LitRPG / Story RPG data pass (acceptance-tests-new-orders.md OPT-4).
 * Schema/runtime: q38-G1a. Tabletop data: q38-G1b. Never PYOA.
 *
 * Outside sources: The Alexandrian — Three Clue Rule / Rolling to Failure (Justin Alexander;
 * pattern only). SRD 5.2.1 Study is tabletop-only (withModeQuestRoutes mode 'dnd').
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import {
  LITRPG_MAIN_SPINES,
  spineToStarterQuest,
} from '@/data/quests/litrpgMainSpines';
import {
  STORY_RPG_MAIN_SPINES,
  storyRpgSpineToStarterQuest,
} from '@/data/quests/storyRpgMainSpines';
import { createInitialState } from './defaults';
import {
  openRouteView,
  placeIdForStep,
  validateModeQuestData,
  validateQuestStepRoutes,
} from './questRoutes';
import { collectSceneAffordances } from './sceneAffordances';
import { applyStoryRpgTurn, placeForStep, storyRpgDecisionChip } from './storyRpgProgress';
import type { GameState, Quest, QuestObjective } from './types';

/** Play-shape quest from enriched bible starter (routes already on anchors). */
function seedFromBible(bibleId: string, questId?: string): Quest {
  const bible = ALL_CAMPAIGN_BIBLES.find((b) => b.id === bibleId)!;
  const seed = questId
    ? bible.starterQuests.find((q) => q.id === questId) ?? bible.starterQuests[0]!
    : bible.starterQuests[0]!;
  const objectives: QuestObjective[] = seed.objectives.map((desc, i) => {
    const a = seed.objectiveAnchors?.[i];
    const placeId = a?.placeId !== undefined ? a.placeId : a?.place ?? null;
    return {
      id: `${seed.id}-obj-${i + 1}`,
      description: desc,
      completed: false,
      placeId: placeId ?? null,
      ...(a?.people?.length ? { people: [...a.people] } : {}),
      ...(a?.routes?.length ? { routes: a.routes.map((r) => ({ ...r })) } : {}),
    };
  });
  return {
    id: seed.id,
    name: seed.title,
    description: seed.description,
    status: 'active',
    revealed: true,
    type: 'main',
    objectives,
  } as Quest;
}

function saltBase(quest: Quest): GameState {
  const s = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    turn: 3,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    activeEncounter: null,
    currentLocation: 'Waystation',
    places: [{ name: 'Waystation' }, { name: 'Consul Caravan Camp' }, { name: "Olenna's Warehouse" }],
    npcMemories: [],
    quests: [quest],
  } as unknown as GameState;
}

describe('q42-OPT4m LitRPG/RPG quest route data (OPT-4)', () => {
  it('OPT4-1: validator fails thin steps in all three modes; PYOA data not read', () => {
    const thin: QuestObjective = {
      id: 'thin',
      description: 'Find it',
      completed: false,
      routes: [{ id: 'a', kind: 'person', label: 'Ask' }],
    };
    expect(validateQuestStepRoutes(thin, 'dnd').some((e) => /fewer than 3/.test(e))).toBe(true);
    expect(validateQuestStepRoutes(thin, 'litrpg').length).toBeGreaterThan(0);
    expect(validateQuestStepRoutes(thin, 'rpg').length).toBeGreaterThan(0);
    expect(validateQuestStepRoutes(thin, 'pyoa')).toEqual([]);
    expect(validateModeQuestData('pyoa', ALL_CAMPAIGN_BIBLES)).toEqual([]);
    const pyoaIds = new Set(ALL_CAMPAIGN_BIBLES.filter((b) => b.engineMode === 'pyoa').map((b) => b.id));
    for (const mode of ['dnd', 'litrpg', 'rpg'] as const) {
      const errs = validateModeQuestData(
        mode,
        ALL_CAMPAIGN_BIBLES.filter((b) => b.engineMode === mode),
      );
      for (const e of errs) expect(pyoaIds.has(e.split('/')[0]!)).toBe(false);
    }
  });

  it('OPT4-1: every LitRPG and Story RPG bible (and spines) passes; PYOA untouched', () => {
    const litrpg = ALL_CAMPAIGN_BIBLES.filter((b) => b.engineMode === 'litrpg');
    const rpg = ALL_CAMPAIGN_BIBLES.filter((b) => b.engineMode === 'rpg');
    expect(litrpg.length).toBeGreaterThan(0);
    expect(rpg.length).toBeGreaterThan(0);
    expect(validateModeQuestData('litrpg', litrpg)).toEqual([]);
    expect(validateModeQuestData('rpg', rpg)).toEqual([]);

    const salt = ALL_CAMPAIGN_BIBLES.find((b) => b.id === 'salt-road-heist')!;
    expect(salt.engineMode).toBe('rpg');
    expect(validateModeQuestData('rpg', [salt])).toEqual([]);

    const sp = ALL_CAMPAIGN_BIBLES.find((b) => b.id === 'summoned-pact')!;
    expect(validateModeQuestData('litrpg', [sp])).toEqual([]);

    const litSpines = LITRPG_MAIN_SPINES.map((s) => spineToStarterQuest(s));
    expect(validateModeQuestData('litrpg', [], litSpines)).toEqual([]);
    const rpgSpines = STORY_RPG_MAIN_SPINES.map((s) => storyRpgSpineToStarterQuest(s));
    expect(validateModeQuestData('rpg', [], rpgSpines)).toEqual([]);

    // PYOA bibles are never enriched — validator still skips the mode entirely.
    const pyoa = ALL_CAMPAIGN_BIBLES.filter((b) => b.engineMode === 'pyoa');
    expect(pyoa.some((b) => (b.starterQuests[0]?.objectiveAnchors?.[0]?.routes?.length ?? 0) >= 3)).toBe(
      false,
    );
  });

  it('OPT4-2: salt-road Pick an approach with no Friendly contact offers routes; pick ticks on outcome', () => {
    const q = seedFromBible('salt-road-heist');
    const steps = q.objectives ?? [];
    // Scout done → open step is Pick an approach.
    steps[0]!.completed = true;
    const approach = steps.find((o) => /pick an approach/i.test(o.description))!;
    expect((approach.routes?.length ?? 0) >= 3).toBe(true);
    expect(approach.placeId ?? null).toBeNull();

    const s = saltBase(q);
    expect(storyRpgDecisionChip(s)).toBeNull(); // routes own the chips
    const labels = openRouteView(s)!.rows.map((r) => r.label);
    expect(labels).toContain('Ask Vessa which approach fits the crew');
    expect(labels).toContain('Scout the caravan camp fence line');
    expect(labels).toContain('Call on a standing contact for the approach');

    const chips = collectSceneAffordances(s)
      .filter((a) => a.slotKind === 'quest')
      .map((a) => a.label);
    expect(chips).toEqual(expect.arrayContaining(labels));

    const miss = applyStoryRpgTurn(s, 'Call on a standing contact for the approach');
    expect(miss.state.quests![0]!.objectives!.find((o) => /pick an approach/i.test(o.description))!.completed).toBe(
      false,
    );
    expect(
      miss.state.quests![0]!.objectives!.find((o) => /pick an approach/i.test(o.description))!.routes!.find(
        (r) => r.id === 'salt-approach-contact',
      )!.failed,
    ).toBe(true);

    const hit = applyStoryRpgTurn(miss.state, 'Ask Vessa which approach fits the crew');
    expect(hit.state.quests![0]!.objectives!.find((o) => /pick an approach/i.test(o.description))!.completed).toBe(
      true,
    );
    expect(hit.receipts.join('\n')).toMatch(/Ask Vessa/);
  });

  it('OPT4-3: placeForStep word match / STEP_STOP stay gone; placeId explicit or none', () => {
    const s = saltBase(seedFromBible('salt-road-heist'));
    expect(placeForStep(s, 'Scout the caravan at Consul Caravan Camp')).toBeNull();
    expect(placeIdForStep({ placeId: 'Consul Caravan Camp' })).toBe('Consul Caravan Camp');
    expect(placeIdForStep({ placeId: null })).toBeNull();
  });

  it('OPT4-4: from Pick an approach open, main quest advances past it within 10 turns', () => {
    const q = seedFromBible('salt-road-heist');
    (q.objectives ?? [])[0]!.completed = true;
    let state = saltBase(q);
    let advanced = false;
    for (let t = 0; t < 10; t++) {
      const open = openRouteView(state);
      if (!open || !/pick an approach/i.test(open.step.description)) {
        advanced = true;
        break;
      }
      const person = open.rows.find((r) => /Ask Vessa which approach/i.test(r.label)) ?? open.rows[0];
      if (!person) break;
      state = { ...applyStoryRpgTurn(state, person.label).state, turn: (state.turn ?? 0) + 1 };
    }
    expect(advanced || state.quests![0]!.objectives!.find((o) => /pick an approach/i.test(o.description))!.completed).toBe(
      true,
    );
    const approachDone = state.quests![0]!.objectives!.find((o) => /pick an approach/i.test(o.description))!.completed;
    expect(approachDone).toBe(true);
  });
});
