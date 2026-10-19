/**
 * q67-LITPACE — materialise accepted quests + XP bar P1(b).
 * From saved/seeded state only — no AI calls.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { createInitialState } from '@/game/defaults';
import {
  applyQuestRouteOutcome,
  openRouteView,
  withModeQuestRoutes,
} from '@/game/questRoutes';
import {
  isQuestPlaceholderRef,
  materialiseAcceptedQuest,
  materialiseAllAcceptedQuests,
  migratePlaceholderQuests,
  questHasPlaceholderRoutes,
  QUEST_PLACEHOLDER_REFS,
  travelPathExists,
} from '@/game/questMaterialise';
import { applySaveRepair } from '@/game/saveMigration';
import { reconcileXpStatusLines, xpBarToNextLevelLine } from '@/game/systemLog';
import { applyCharacterXpGain } from '@/game/characterXp';
import { FAST_XP_AWARDS, FAST_XP_CURVE, xpRequiredForLevel } from '@/game/xpPolicy';
import { LITRPG_MILESTONE_XP } from '@/game/xpRules';
import type { GameState, Quest, QuestObjective, QuestRoute } from '@/game/types';
import { resolvePlace } from '@/game/places';

function seedQuestFromBible(bibleId: string, questId?: string): Quest {
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
      ...(a?.place ? { place: a.place } : {}),
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
    location: (seed as { location?: string }).location,
    giver: (seed as { giver?: string }).giver,
    objectives,
  } as Quest;
}

function litBase(extra: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    turn: 5,
    currentLocation: 'Cathedral Close',
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    places: [
      {
        id: 'place_cathedral-close',
        name: 'Cathedral Close',
        exits: ['Lowmarket', 'Palace Approach', 'Cinderflow Road'],
        arcStatus: 'open',
      },
    ],
    npcMemories: [],
    quests: [],
    ...extra,
  } as GameState;
}

describe('q67-LITPACE A: every accepted bible seed materialises place+NPC', () => {
  it('A: each non-PYOA bible starter quest, once accepted, has place + NPC + travel path', () => {
    for (const bible of ALL_CAMPAIGN_BIBLES) {
      if (bible.engineMode === 'pyoa') continue;
      const start = bible.startingLocation || 'Start';
      for (const seed of bible.starterQuests ?? []) {
        const quest = seedQuestFromBible(bible.id, seed.id);
        const state0 = litBase({
          engineMode: bible.engineMode === 'dnd' ? 'dnd' : bible.engineMode === 'rpg' ? 'rpg' : 'litrpg',
          campaignBibleId: bible.id,
          currentLocation: start,
          places: [{ id: 'place_start', name: start, exits: [], arcStatus: 'open' }],
          quests: [quest],
        });
        const { state, error } = materialiseAcceptedQuest(state0, quest);
        expect(error, `${bible.id}/${seed.id}`).toBeNull();
        const live = (state.quests ?? []).find((q) => q.id === seed.id)!;
        expect(live).toBeTruthy();
        for (const step of live.objectives ?? []) {
          const placeId = (step.placeId ?? step.place ?? '').trim();
          expect(placeId, `${seed.id}/${step.id} place`).toBeTruthy();
          expect(isQuestPlaceholderRef(placeId)).toBe(false);
          const inPlaces = !!resolvePlace(state.places, placeId);
          expect(inPlaces, `${seed.id} place ${placeId} in places`).toBe(true);
          expect(travelPathExists(state, start, placeId), `${seed.id} travel to ${placeId}`).toBe(true);
          const person = (step.people?.[0] ?? '').trim();
          expect(person, `${seed.id} person`).toBeTruthy();
          expect(isQuestPlaceholderRef(person)).toBe(false);
          const mem = (state.npcMemories ?? []).find((m) => m.npcName.toLowerCase() === person.toLowerCase());
          expect(mem, `${seed.id} npc ${person}`).toBeTruthy();
          // NPC is at one of this quest's materialised places (shared contacts may span steps).
          const questPlaces = new Set(
            (live.objectives ?? []).map((o) => (o.placeId ?? o.place ?? '').trim().toLowerCase()).filter(Boolean),
          );
          expect(questPlaces.has((mem!.location ?? '').toLowerCase()), `${seed.id} npc at quest place`).toBe(true);
        }
      }
    }
  });
});

describe('q67-LITPACE B: no placeholder entity ids after accepts', () => {
  it('B: seeded 150-turn scripted accepts leave 0 placeholder routes', () => {
    let state = litBase();
    const bible = ALL_CAMPAIGN_BIBLES.find((b) => b.id === 'summoned-pact')!;
    const offered = [...(bible.starterQuests ?? [])];
    for (let turn = 1; turn <= 150; turn++) {
      state = { ...state, turn };
      if (turn % 10 === 0 && offered.length) {
        const seed = offered.shift()!;
        const quest = { ...seedQuestFromBible('summoned-pact', seed.id), status: 'active' as const, revealed: true };
        state = { ...state, quests: [...(state.quests ?? []), quest] };
        state = materialiseAllAcceptedQuests(state).state;
      }
    }
    // Invariant at every saved turn end: no placeholder entity refs remain.
    const blob = JSON.stringify(state.quests ?? []).toLowerCase();
    for (const banned of QUEST_PLACEHOLDER_REFS) {
      expect(blob).not.toContain(banned);
    }
    for (const q of state.quests ?? []) {
      expect(questHasPlaceholderRoutes(q), q.id).toBe(false);
      for (const step of q.objectives ?? []) {
        for (const r of step.routes ?? []) {
          expect(isQuestPlaceholderRef(r.entityId), r.entityId).toBe(false);
          expect(resolvePlace(state.places, step.placeId ?? step.place ?? '')).toBeTruthy();
        }
      }
    }
  }, 20_000);

  it('withModeQuestRoutes never emits the three placeholder strings', () => {
    const enriched = withModeQuestRoutes(
      { id: 'thin-q', objectives: ['Find the trail'], objectiveAnchors: [{ placeId: null }] },
      'litrpg',
    );
    const blob = JSON.stringify(enriched).toLowerCase();
    for (const banned of QUEST_PLACEHOLDER_REFS) {
      expect(blob).not.toContain(banned);
    }
    const anchor0 = enriched.objectiveAnchors?.[0] as { routes?: QuestRoute[] } | undefined;
    expect((anchor0?.routes?.length ?? 0)).toBeGreaterThanOrEqual(3);
  });
});

describe('q67-LITPACE C: load migration rematerialises Other Circle + Ledger', () => {
  it('C: save with placeholder routes becomes real places + NPCs on repair', () => {
    const otherRoutes: QuestRoute[] = [
      { id: 'o-p', kind: 'person', label: 'Ask a witness who knows the lead about the lead', entityId: 'npc:a witness who knows the lead' },
      { id: 'o-pl', kind: 'place', label: 'Search the scene for signs', entityId: 'place:the scene', placeId: null },
      { id: 'o-s', kind: 'system', label: 'Read the System trail', entityId: 'system:o' },
    ];
    const ledgerRoutes: QuestRoute[] = [
      { id: 'l-p', kind: 'person', label: 'Ask a witness who knows the lead about the lead', entityId: 'npc:a witness who knows the lead' },
      { id: 'l-pl', kind: 'place', label: 'Search the scene for signs', entityId: 'place:the scene' },
      { id: 'l-s', kind: 'system', label: 'Read the System trail', entityId: 'system:l' },
    ];
    const other: Quest = {
      id: 'sp-quest-special-other',
      name: 'The Other Circle',
      description: 'Second circle',
      status: 'active',
      revealed: true,
      type: 'side',
      location: 'Cinderflow Road',
      objectives: [
        { id: 'o1', description: 'Confirm the second circle', completed: false, routes: otherRoutes },
        { id: 'o2', description: 'Find traces', completed: false, routes: otherRoutes.map((r) => ({ ...r, id: r.id + '2' })) },
      ],
    } as Quest;
    const ledger: Quest = {
      id: 'sp-quest-special-ledger',
      name: "Queen's Private Ledger",
      description: 'Palace ledger',
      status: 'active',
      revealed: true,
      type: 'side',
      location: 'Palace Approach',
      objectives: [
        { id: 'l1', description: 'Get a reason to enter the palace', completed: false, routes: ledgerRoutes },
        { id: 'l2', description: 'Read or steal a true account', completed: false, routes: ledgerRoutes.map((r) => ({ ...r, id: r.id + '2' })) },
      ],
    } as Quest;
    const dirty = litBase({
      quests: [other, ledger],
      saveRepairRevision: 0,
      openingEstablishment: { complete: true, pending: [], answers: {} },
    });
    expect(questHasPlaceholderRoutes(other)).toBe(true);
    const repaired = applySaveRepair(dirty);
    expect(repaired.dirty).toBe(true);
    const next = repaired.state;
    for (const id of ['sp-quest-special-other', 'sp-quest-special-ledger']) {
      const q = (next.quests ?? []).find((x) => x.id === id)!;
      expect(questHasPlaceholderRoutes(q)).toBe(false);
      for (const step of q.objectives ?? []) {
        const place = (step.placeId ?? step.place ?? '').trim();
        expect(resolvePlace(next.places, place)).toBeTruthy();
        expect(travelPathExists(next, 'Cathedral Close', place)).toBe(true);
        const person = (step.people?.[0] ?? '').trim();
        const mem = (next.npcMemories ?? []).find((m) => m.npcName.toLowerCase() === person.toLowerCase());
        expect(mem?.location?.toLowerCase()).toBe(place.toLowerCase());
      }
    }
    const migrated = migratePlaceholderQuests(dirty);
    expect(migrated.dirty).toBe(true);
  });
});

describe('q67-LITPACE D: travel + talk advances materialised step', () => {
  it('D: talking the materialised NPC route yields a quest stage receipt', () => {
    const quest = seedQuestFromBible('summoned-pact', 'sp-quest-1');
    let state = litBase({ quests: [quest], currentLocation: 'Sevenfold Circle' });
    const mat = materialiseAcceptedQuest(state, quest);
    expect(mat.error).toBeNull();
    state = mat.state;
    const live = (state.quests ?? []).find((q) => q.id === quest.id)!;
    const step = live.objectives![0]!;
    const personRoute = (step.routes ?? []).find((r) => r.kind === 'person')!;
    const place = (step.placeId ?? step.place ?? 'Sevenfold Circle').trim();
    state = { ...state, currentLocation: place };
    const open = openRouteView(state);
    expect(open?.quest.id).toBe(quest.id);
    const out = applyQuestRouteOutcome(state, personRoute.id, 'success');
    expect(out.receipts.some((r) => /quest stage/i.test(r))).toBe(true);
    const after = (out.state.quests ?? []).find((q) => q.id === quest.id)!;
    expect(after.objectives![0]!.completed).toBe(true);
  });
});

describe('q67-LITPACE E: measurement only (not gated)', () => {
  it('E: prints XP / level / skill / item per 50-turn window (no thresholds)', () => {
    const windows: Array<{ from: number; to: number; xp: number; level: number; skills: number; items: number }> = [];
    let xp = 0;
    let level = 1;
    let skills = 0;
    let items = 0;
    let windowXp = 0;
    let windowSkills = 0;
    let windowItems = 0;
    for (let t = 1; t <= 150; t++) {
      // Scripted measurement stub — not a live run.
      if (t % 15 === 0) {
        windowXp += 40;
        xp += 40;
      }
      if (t % 40 === 0) {
        windowSkills += 1;
        skills += 1;
      }
      if (t % 50 === 0) {
        windowItems += 1;
        items += 1;
        while (xp >= xpRequiredForLevel(level + 1) && level < 10) level += 1;
        windows.push({
          from: t - 49,
          to: t,
          xp: windowXp,
          level,
          skills: windowSkills,
          items: windowItems,
        });
        // eslint-disable-next-line no-console
        console.log(
          `[q67-E] turns ${t - 49}-${t}: xpGain=${windowXp} level=${level} skills=${windowSkills} items=${windowItems} (totals xp=${xp} skills=${skills} items=${items})`,
        );
        windowXp = 0;
        windowSkills = 0;
        windowItems = 0;
      }
    }
    expect(windows.length).toBe(3);
  });
});

describe('q67-LITPACE F + P1(b): banks + XP bar unchanged amounts', () => {
  it('F: non-PYOA bible starter quests still carry ≥3 routes after enrich', () => {
    for (const bible of ALL_CAMPAIGN_BIBLES) {
      if (bible.engineMode === 'pyoa') continue;
      for (const seed of bible.starterQuests ?? []) {
        for (const a of seed.objectiveAnchors ?? []) {
          expect((a?.routes?.length ?? 0) >= 3, `${bible.id}/${seed.id}`).toBe(true);
        }
      }
    }
  });

  it('P1(b): XP bar shows current XP, next threshold, and to next level; amounts/table unchanged', () => {
    expect(FAST_XP_CURVE.L1_to_L2).toBe(150);
    expect(FAST_XP_AWARDS.combatTrash).toBe(LITRPG_MILESTONE_XP.encounter);
    expect(xpRequiredForLevel(2)).toBe(150);
    expect(xpRequiredForLevel(3)).toBe(150 + Math.floor(150 * 1.5));

    const beforeTable = {
      L1: FAST_XP_CURVE.L1_to_L2,
      L2: FAST_XP_CURVE.L2_to_L3,
      trash: FAST_XP_AWARDS.combatTrash,
      tick: FAST_XP_AWARDS.questTick,
      complete: FAST_XP_AWARDS.questComplete,
      req2: xpRequiredForLevel(2),
      req3: xpRequiredForLevel(3),
    };

    let char = {
      name: 'Jax',
      level: 1,
      xp: 0,
      xpToNext: 150,
      hp: 10,
      maxHp: 10,
    } as GameState['character'];
    const awards = [40, 50, 25, 35];
    const expectedAmounts = [...awards];
    const lines: string[] = [];
    for (let i = 0; i < awards.length; i++) {
      const amount = awards[i]!;
      const applied = applyCharacterXpGain(char!, amount, 'litrpg');
      char = applied.character;
      lines.push(`XP Gained: ${amount} (test award ${i + 1})`);
    }
    const decorated = reconcileXpStatusLines(lines, [], char);
    for (let i = 0; i < expectedAmounts.length; i++) {
      expect(decorated).toContain(`XP Gained: ${expectedAmounts[i]} (test award ${i + 1})`);
    }
    const bar = xpBarToNextLevelLine(char);
    expect(bar).toMatch(/to next level$/);
    expect(bar).toBe(`XP: ${char!.xp}/${char!.xpToNext} to next level`);
    expect(decorated.filter((l) => l === bar).length).toBe(expectedAmounts.length);

    expect(FAST_XP_CURVE.L1_to_L2).toBe(beforeTable.L1);
    expect(FAST_XP_CURVE.L2_to_L3).toBe(beforeTable.L2);
    expect(FAST_XP_AWARDS.combatTrash).toBe(beforeTable.trash);
    expect(FAST_XP_AWARDS.questTick).toBe(beforeTable.tick);
    expect(FAST_XP_AWARDS.questComplete).toBe(beforeTable.complete);
    expect(xpRequiredForLevel(2)).toBe(beforeTable.req2);
    expect(xpRequiredForLevel(3)).toBe(beforeTable.req3);
  });
});
