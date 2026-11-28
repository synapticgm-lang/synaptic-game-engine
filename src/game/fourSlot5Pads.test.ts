/**
 * FOURSLOT5 — T50 leftover root fixes (LitRPG short pads, floor-plan FP, travel dest name,
 * Talk answered, hurt Rest, filler streak, Make camp / Rest checker FPs).
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { buildNewGameState, stampOpening, preferHurtRecoveryPick } from './fateAutoplay';
import { commitOfferedPad } from './playTranscript';
import {
  assembleFourSlotPads,
  consecutiveFillerFamilyPicks,
  FILLER_STREAK_CAP,
  fourSlotEngineLabels,
  isFourSlotLegal,
  pickFromFourSlots,
  shouldSkipFourSlot,
} from './fourSlotPads';
import { previewDungeonCard } from './dungeonCard';
import { drawnPlanIssues, openingRestatesPlayerAct } from './turnCheck';
import { ensureCrowdOrRoleTalkAnswered, sealPostWriterProse, withMoveDestination } from './writerTurn';
import { hasNumberedChoiceLeak } from './parser';
import { chipProblem } from './chipLegality';
import { emptySceneFacts } from './sceneFacts';
import { settleOrigin, ORIGIN_QUICK_START_CHIP } from './rules/rpgOrigin';
import { OUTDOOR_REST_CHIP } from './rules/wildlifeConfig';
import { INTERIOR_MAP_BLUEPRINT, isInteriorMap } from './placeAuthority';
import type { EngineMode, GameState } from './types';

const SWEEP_MS = 90_000;
const SIM_MS = 120_000;

function playReady(state: GameState): GameState {
  let s: GameState = {
    ...state,
    openingEstablishment: {
      ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
      pending: [],
      complete: true,
      sceneWritten: true,
    },
  };
  if (s.engineMode === 'rpg') {
    if (!s.character?.origin) {
      const settled = settleOrigin(s, ORIGIN_QUICK_START_CHIP);
      s = settled.state;
    }
    if (!s.character?.origin) {
      s = { ...s, character: { ...s.character!, origin: 'sage' } };
    }
  }
  return s;
}

function withPlayerLog(state: GameState, picks: string[]): GameState {
  const baseTurn = state.turn ?? 20;
  const log = [
    ...(state.log ?? []),
    ...picks.map((content, i) => ({
      id: `fs5-${i}`,
      role: 'player' as const,
      content,
      turn: baseTurn - picks.length + i,
      timestamp: i + 1,
    })),
  ];
  return { ...state, log };
}

function hollowJourney(seed = 8001): GameState {
  const built = buildNewGameState({
    bibleId: 'hollow-core',
    characterName: 'Jax',
    seed,
    personality: 'cold-system',
    engineMode: 'litrpg',
  });
  const opened = playReady(stampOpening(built.state));
  return {
    ...opened,
    turn: 10,
    currentLocation: 'On the road between First Tunnel Spur and Core Chamber',
    journey: {
      from: 'First Tunnel Spur',
      to: 'Core Chamber',
      legsDone: 1,
      legsTotal: 3,
      hoursPerLeg: 1,
      terrain: 'road',
      ground: 'road',
      encounter: null,
      quietStretches: 0,
    } as GameState['journey'],
    character: { ...opened.character!, hp: 23, maxHp: 31 },
    sceneFacts: { ...emptySceneFacts(10), indoor: false, present: [] },
    firstFightGateDone: true,
    activeEncounter: null,
  };
}

describe('FOURSLOT5 LitRPG short pads (1a)', () => {
  it('replay FAIL shape: non-hurt journey used to skip four-slot — now fills 4 with Walk on lead', () => {
    const state = hollowJourney();
    expect(shouldSkipFourSlot(state)).toBe(false);
    const raw = ['Walk on', 'Hunt the wildlife nearby', 'Gather herbs and resources nearby'];
    // Without assemble (old exclusive path) this is the T10 short pad.
    expect(raw).toHaveLength(3);
    const pads = assembleFourSlotPads(state, raw);
    const eng = fourSlotEngineLabels(pads);
    expect(eng).toHaveLength(4);
    expect(eng[0]).toMatch(/^Walk on\b/i);
    expect(new Set(eng.map((c) => c.toLowerCase())).size).toBe(4);
    expect(pads.some((c) => /say something|do something else/i.test(c))).toBe(true);
  });

  it('open-box + Walk on tops up to four legal chips', () => {
    const state = hollowJourney(8013);
    const pads = assembleFourSlotPads(state, ['Walk on', 'Open the bronze reward box']);
    expect(fourSlotEngineLabels(pads)).toHaveLength(4);
    expect(pads).toContain('Walk on');
    expect(pads.some((c) => /open the bronze/i.test(c))).toBe(true);
  });

  it('litrpg short-pad sweep: every non-origin non-forced pad has 4 distinct legal slots', () => {
    const litrpg = ALL_CAMPAIGN_BIBLES.filter(
      (b) =>
        !/blank/i.test(b.id)
        && (b.engineMode === 'litrpg'
          || (b as { mode?: string }).mode === 'litrpg'
          || /hollow|summoned|hero|inkbound|void|gatebreak|ascending|fabled|system|dungeon|integration/i.test(b.id))
    );
    const bibles = litrpg.length ? litrpg : [];
    const holes: string[] = [];
    for (const bible of bibles.slice(0, 24)) {
      const built = buildNewGameState({
        bibleId: bible.id,
        characterName: 'Jax',
        seed: 8001,
        personality: 'cold-system',
        engineMode: 'litrpg',
      });
      const opened = playReady(stampOpening(built.state));
      if (shouldSkipFourSlot(opened)) continue;
      const committed = commitOfferedPad({ ...opened, offeredPad: null });
      const labels = fourSlotEngineLabels(committed.offeredPad?.choices ?? committed.choices ?? []);
      if (labels.length !== 4 || new Set(labels.map((c) => c.toLowerCase())).size !== 4) {
        holes.push(`${bible.id}:open=${labels.length}:${labels.join('|')}`);
      }
      const road: GameState = {
        ...opened,
        turn: 12,
        journey: {
          from: opened.currentLocation || 'Hub',
          to: 'Far Place',
          legsDone: 1,
          legsTotal: 3,
          hoursPerLeg: 1,
          terrain: 'road',
          ground: 'road',
          encounter: null,
          quietStretches: 0,
        } as GameState['journey'],
        currentLocation: `On the road between ${(opened.currentLocation || 'Hub')} and Far Place`,
        character: { ...opened.character!, hp: opened.character?.maxHp ?? 31, maxHp: opened.character?.maxHp ?? 31 },
        sceneFacts: { ...emptySceneFacts(12), indoor: false, present: [] },
        activeEncounter: null,
      };
      if (shouldSkipFourSlot(road)) {
        holes.push(`${bible.id}:journey-still-exclusive`);
        continue;
      }
      const roadPads = assembleFourSlotPads(road, [
        'Walk on',
        'Hunt the wildlife nearby',
        'Gather herbs and resources nearby',
      ]);
      const eng = fourSlotEngineLabels(roadPads);
      if (eng.length !== 4) holes.push(`${bible.id}:journey=${eng.length}:${eng.join('|')}`);
    }
    expect(holes, holes.join('\n')).toEqual([]);
  }, SWEEP_MS);
});

describe('FOURSLOT5 floor-plan connectivity (1b)', () => {
  it('replay: First Tunnel Spur preview is interior-plan; underground skips building FP', () => {
    const built = buildNewGameState({
      bibleId: 'hollow-core',
      characterName: 'Jax',
      seed: 8001,
      personality: 'cold-system',
      engineMode: 'litrpg',
    });
    const opened = playReady(stampOpening(built.state));
    const preview = previewDungeonCard(opened, 'First Tunnel Spur');
    expect(preview.blueprintId).toBe(INTERIOR_MAP_BLUEPRINT);
    expect(isInteriorMap(preview)).toBe(true);
    expect(preview.nodes.some((n) => (n.tags ?? []).includes('underground'))).toBe(true);
    const withPreview: GameState = {
      ...opened,
      currentLocation: 'First Tunnel Spur',
      places: (opened.places ?? []).map((p) =>
        /tunnel spur|first tunnel/i.test(p.name)
          ? { ...p, dungeonCard: preview }
          : p
      ),
    };
    const hasSpur = (withPreview.places ?? []).some((p) => /tunnel spur/i.test(p.name));
    const state = hasSpur
      ? withPreview
      : {
          ...withPreview,
          places: [
            ...(withPreview.places ?? []),
            {
              id: 'place_first-tunnel-spur',
              name: 'First Tunnel Spur',
              allowsDungeon: true,
              dungeonRef: preview.dungeonName,
              dungeonCard: preview,
              arcStatus: 'open' as const,
              mapScale: 'street' as const,
            },
          ],
        };
    const issues = drawnPlanIssues({ ...state, currentLocation: 'First Tunnel Spur' });
    expect(issues.filter((i) => /floating-room/i.test(i))).toEqual([]);
  });

  it('floor-plan connectivity sweep over litrpg premades (underground not building)', () => {
    const litrpg = ALL_CAMPAIGN_BIBLES.filter((b) =>
      /hollow|summoned|hero|inkbound|void|gatebreak|ascending|fabled|system|dungeon|integration/i.test(b.id)
    );
    const holes: string[] = [];
    for (const bible of litrpg) {
      const built = buildNewGameState({
        bibleId: bible.id,
        characterName: 'Jax',
        seed: 42,
        personality: 'cold-system',
        engineMode: 'litrpg',
      });
      const opened = playReady(stampOpening(built.state));
      const hubs = (opened.places ?? []).filter((p) => p.allowsDungeon || p.dungeonCard);
      for (const hub of hubs.slice(0, 4)) {
        const preview = previewDungeonCard(opened, hub.name);
        if (preview.blueprintId !== INTERIOR_MAP_BLUEPRINT) {
          holes.push(`${bible.id}:${hub.name}:blueprint=${preview.blueprintId}`);
        }
        const issues = drawnPlanIssues({
          ...opened,
          currentLocation: hub.name,
          places: [
            ...(opened.places ?? []).filter((p) => p.name !== hub.name),
            { ...hub, dungeonCard: preview, allowsDungeon: true },
          ],
        });
        const floating = issues.filter((i) => /floating-room/i.test(i));
        if (floating.length) holes.push(`${bible.id}:${hub.name}:${floating.join('|')}`);
      }
    }
    expect(holes, holes.join('\n')).toEqual([]);
  }, SWEEP_MS);
});

describe('FOURSLOT5 travel arrival names destination (2a)', () => {
  it('replay: long Travel chip must not strip dest from arrival prose', () => {
    const dest = 'Shadow Behind the High Table';
    const act = `Travel toward ${dest}`;
    expect(act.length).toBeGreaterThan(40);
    const arrival = `Jax reached ${dest}. The feast noise fell away.`;
    expect(openingRestatesPlayerAct(arrival, act)).toBe(false);
    const state: GameState = {
      ...hollowJourney(8002),
      engineMode: 'rpg',
      campaignBibleId: 'embercourt-oath',
      turn: 21,
      currentLocation: dest,
      circling: {
        stale: {},
        lastProgressTurn: 20,
        movedTurn: 21,
        lastLocation: dest,
        prevPlace: 'Embercourt feast',
      },
      journey: null,
      character: { name: 'Jax', hp: 20, maxHp: 31 } as GameState['character'],
    };
    const sealed = sealPostWriterProse(state, arrival, act);
    expect(sealed.prose.toLowerCase()).toContain(dest.toLowerCase());
  });

  it('withMoveDestination re-stamps after echo strip', () => {
    const dest = 'Chapel of the Side Door';
    const state: GameState = {
      ...hollowJourney(),
      turn: 35,
      currentLocation: dest,
      circling: { stale: {}, lastProgressTurn: 34, movedTurn: 35, lastLocation: dest },
      journey: null,
      character: { name: 'Jax', hp: 20, maxHp: 31 } as GameState['character'],
    };
    const bare = 'The corridor smelled of wax.';
    expect(withMoveDestination(state, bare).toLowerCase()).toContain(dest.toLowerCase());
  });

  it('rpg arrival-names-destination sweep', () => {
    const rpg = ALL_CAMPAIGN_BIBLES.filter((b) =>
      /embercourt|salt|cape|thornferry|greyhollow|rose|onyx|crimson|resin|umbra|vesper|giltwood|null-parameter|erebus/i.test(
        b.id
      )
    );
    const holes: string[] = [];
    for (const bible of rpg.slice(0, 16)) {
      const built = buildNewGameState({
        bibleId: bible.id,
        characterName: 'Jax',
        seed: 8002,
        personality: 'chilled-gm',
        engineMode: 'rpg',
      });
      const opened = playReady(stampOpening(built.state));
      const dest = 'Test Arrival Hall';
      const act = `Travel toward ${dest}`;
      const state: GameState = {
        ...opened,
        turn: 10,
        currentLocation: dest,
        circling: {
          ...(opened.circling ?? { stale: {}, lastProgressTurn: 9 }),
          movedTurn: 10,
          lastLocation: dest,
          prevPlace: opened.currentLocation || 'Start',
        },
        journey: null,
      };
      const sealed = sealPostWriterProse(state, 'The room waited.', act);
      if (!sealed.prose.toLowerCase().includes(dest.toLowerCase())) {
        holes.push(`${bible.id}:missing-dest`);
      }
    }
    expect(holes, holes.join('\n')).toEqual([]);
  }, SWEEP_MS);
});

describe('FOURSLOT5 Talk answered (2b/3a)', () => {
  it('replay: innkeep silent prose gets a spoken answer', () => {
    const state: GameState = {
      ...hollowJourney(8003),
      engineMode: 'dnd',
      campaignBibleId: 'millstone-road',
      turn: 29,
      currentLocation: 'Roadside Tavern',
      journey: null,
      sceneFacts: {
        ...emptySceneFacts(29),
        indoor: true,
        present: ['the innkeep', 'Innkeep Mara'],
      },
      character: { name: 'Jax', hp: 8, maxHp: 10 } as GameState['character'],
    };
    const silent =
      'Jax waited for the innkeep to answer, and the answer never came. The taproom stayed still.';
    const fixed = ensureCrowdOrRoleTalkAnswered(silent, state, 'Talk to the innkeep');
    expect(fixed).toMatch(/["\u201c]/);
    expect(fixed).not.toMatch(/answer never came/i);
  });

  it('replay: witness pointer Talk gets a quote or gate-ok absence', () => {
    const state: GameState = {
      ...hollowJourney(8002),
      engineMode: 'rpg',
      campaignBibleId: 'embercourt-oath',
      turn: 39,
      currentLocation: 'Embercourt feast',
      journey: null,
      sceneFacts: {
        ...emptySceneFacts(39),
        indoor: true,
        present: ['Lady Sereth Ashveil', 'a witness who knows the lead'],
      },
      character: { name: 'Jax', hp: 20, maxHp: 31 } as GameState['character'],
    };
    const empty = 'The feast tables stretched on. Nobody spoke.';
    const fixed = ensureCrowdOrRoleTalkAnswered(
      empty,
      state,
      'Talk to a witness who knows the lead'
    );
    expect(
      /["\u201c]/.test(fixed) || /Nobody here can answer/i.test(fixed) || /answered/i.test(fixed)
    ).toBe(true);
  });
});

describe('FOURSLOT5 hurt Rest over Leave (2e)', () => {
  it('replay T45 shape: hurt pad offers Rest; Leave does not beat Rest when Rest is legal', () => {
    const built = buildNewGameState({
      bibleId: 'embercourt-oath',
      characterName: 'Jax',
      seed: 8002,
      personality: 'chilled-gm',
      engineMode: 'rpg',
    });
    const opened = playReady(stampOpening(built.state));
    const state: GameState = {
      ...opened,
      turn: 45,
      currentLocation: 'Stone Doors of the Side Chapel',
      character: { ...opened.character!, hp: 15, maxHp: 31 },
      sceneFacts: {
        ...emptySceneFacts(45),
        indoor: true,
        present: ['Lady Sereth Ashveil'],
      },
      activeEncounter: null,
      journey: null,
    };
    const pads = assembleFourSlotPads(state, [
      'Travel toward Embercourt feast',
      'Talk to Lady Sereth Ashveil',
      'Leave the scene',
      'Wait',
    ]);
    expect(pads.some((c) => /rest/i.test(c))).toBe(true);
    const pick = preferHurtRecoveryPick(pads, 'Leave the scene', state);
    expect(pick).toMatch(/rest/i);
  });

  it('hurt-no-fight Rest-offered sweep over premades x modes', () => {
    const modes: EngineMode[] = ['litrpg', 'rpg', 'dnd'];
    const holes: string[] = [];
    for (const mode of modes) {
      const bibles = ALL_CAMPAIGN_BIBLES.filter((b) => {
        if (mode === 'litrpg') return /hollow|summoned|hero|inkbound/i.test(b.id);
        if (mode === 'rpg') return /embercourt|salt|cape/i.test(b.id);
        return /millstone|cursed|stillroot|verdant|shattered|broken/i.test(b.id);
      }).slice(0, 4);
      for (const bible of bibles) {
        const built = buildNewGameState({
          bibleId: bible.id,
          characterName: 'Jax',
          seed: 45,
          personality: mode === 'litrpg' ? 'cold-system' : 'chilled-gm',
          engineMode: mode,
        });
        const opened = playReady(stampOpening(built.state));
        if (shouldSkipFourSlot(opened)) continue;
        const hurt: GameState = {
          ...opened,
          turn: 20,
          character: {
            ...opened.character!,
            hp: Math.max(1, Math.floor((opened.character?.maxHp ?? 20) * 0.4)),
            maxHp: opened.character?.maxHp ?? 20,
          },
          activeEncounter: null,
          sceneFacts: {
            ...emptySceneFacts(20),
            indoor: true,
            present: opened.sceneFacts?.present?.length
              ? opened.sceneFacts.present
              : ['a quiet attendant'],
          },
        };
        const pads = assembleFourSlotPads(hurt, [
          'Look around',
          'Wait',
          'Leave the scene',
          'Talk to a quiet attendant',
        ]);
        const hasRest = pads.some(
          (c) => /rest|make camp|bind .* wounds/i.test(c)
        );
        const restLegal = pads.some((c) => isFourSlotLegal(hurt, c) && /rest|make camp/i.test(c));
        if (!hasRest && !restLegal && mode !== 'dnd') {
          // litrpg/rpg outdoor short rest should almost always be legal when hurt
          holes.push(`${mode}:${bible.id}:no-rest:${pads.join('|')}`);
        }
      }
    }
    expect(holes, holes.join('\n')).toEqual([]);
  }, SWEEP_MS);
});

describe('FOURSLOT5 filler streak (3b)', () => {
  it('replay: after 2 filler picks, Look/Wait/Read are illegal; slot 1 is a real lead', () => {
    const built = buildNewGameState({
      bibleId: 'millstone-road',
      characterName: 'Jax',
      seed: 8003,
      personality: 'chilled-gm',
      engineMode: 'dnd',
    });
    const opened = playReady(stampOpening(built.state));
    const atTavern = withPlayerLog(
      {
        ...opened,
        turn: 34,
        currentLocation: 'Roadside Tavern',
        character: { ...opened.character!, hp: 8, maxHp: 10 },
        sceneFacts: {
          ...emptySceneFacts(34),
          indoor: true,
          present: ['the innkeep', 'Lessa'],
        },
        activeEncounter: null,
        journey: null,
      },
      ['Look around', 'Wait']
    );
    expect(consecutiveFillerFamilyPicks(atTavern)).toBeGreaterThanOrEqual(FILLER_STREAK_CAP);
    expect(isFourSlotLegal(atTavern, 'Look around')).toBe(false);
    expect(isFourSlotLegal(atTavern, 'Wait')).toBe(false);
    const pads = assembleFourSlotPads(atTavern, [
      'Look around',
      'Wait',
      'Read the board',
      'Talk to the innkeep',
      'Travel toward Millstone Ford',
    ]);
    const eng = fourSlotEngineLabels(pads);
    expect(eng).toHaveLength(4);
    expect(eng[0]).not.toMatch(/^(?:look around|wait|read)\b/i);
    const pick = pickFromFourSlots(atTavern, pads, () => 0.1);
    expect(pick).not.toMatch(/^(?:look around|wait|read)\b/i);
  });

  it('tabletop filler-streak cap simulation (always-filler / always-slot-1 / always-Travel)', () => {
    const dnd = ALL_CAMPAIGN_BIBLES.filter((b) =>
      /millstone|cursed|stillroot|verdant|shattered|broken/i.test(b.id)
    );
    const holes: string[] = [];
    for (const bible of dnd) {
      for (const profile of ['always-filler', 'always-slot-1', 'always-Travel'] as const) {
        const built = buildNewGameState({
          bibleId: bible.id,
          characterName: 'Jax',
          seed: 8003,
          personality: 'chilled-gm',
          engineMode: 'dnd',
        });
        let state = playReady(stampOpening(built.state));
        state = {
          ...state,
          turn: 5,
          firstFightGateDone: true,
          pendingFirstFight: null,
          activeEncounter: null,
          sceneFacts: {
            ...emptySceneFacts(5),
            indoor: true,
            present: ['the innkeep', 'a patron'],
          },
        };
        let fillerStreak = 0;
        let travelStreak = 0;
        for (let t = 0; t < 64; t++) {
          if (shouldSkipFourSlot(state)) break;
          const pads = assembleFourSlotPads(state, [
            'Look around',
            'Wait',
            'Read the notice board',
            'Talk to the innkeep',
            'Travel toward Millstone Ford',
            'Travel toward the Village Moot',
            OUTDOOR_REST_CHIP,
          ]);
          const eng = fourSlotEngineLabels(pads);
          if (eng.length !== 4) {
            holes.push(`${bible.id}:${profile}:t${t}:n=${eng.length}`);
            break;
          }
          let pick = eng[0]!;
          if (profile === 'always-filler') {
            pick =
              eng.find((c) => /^(?:look around|wait|read)\b/i.test(c))
              ?? eng.find((c) => !/^(?:travel|leave)\b/i.test(c))
              ?? eng[0]!;
          } else if (profile === 'always-Travel') {
            pick = eng.find((c) => /^travel\b/i.test(c)) ?? eng[0]!;
          }
          if (/^(?:look around|wait|read|inspect|search)\b/i.test(pick)) fillerStreak += 1;
          else fillerStreak = 0;
          if (/^travel\b|^leave\b/i.test(pick)) travelStreak += 1;
          else travelStreak = 0;
          if (fillerStreak > FILLER_STREAK_CAP) {
            holes.push(`${bible.id}:${profile}:filler-streak=${fillerStreak}@t${t}`);
            break;
          }
          if (travelStreak > 2) {
            holes.push(`${bible.id}:${profile}:travel-streak=${travelStreak}@t${t}`);
            break;
          }
          state = withPlayerLog(
            { ...state, turn: (state.turn ?? 5) + 1 },
            [pick]
          );
        }
      }
    }
    expect(holes, holes.join('\n')).toEqual([]);
  }, SIM_MS);
});

describe('FOURSLOT5 checker classifications (2c/2d/3c)', () => {
  it('Materials: Peacebloom x1. is not a numbered choice-leak', () => {
    const body =
      'Jax gathered what the roadside offered. Materials: Peacebloom x1. The pouch settled.';
    expect(hasNumberedChoiceLeak(body)).toBe(false);
  });

  it('Take a short rest is not an unrelated take-object chip', () => {
    const built = buildNewGameState({
      bibleId: 'embercourt-oath',
      characterName: 'Jax',
      seed: 46,
      personality: 'chilled-gm',
      engineMode: 'rpg',
    });
    const opened = playReady(stampOpening(built.state));
    const state: GameState = {
      ...opened,
      character: { ...opened.character!, hp: 15, maxHp: 31 },
      sceneFacts: { ...emptySceneFacts(46), indoor: true, present: [] },
    };
    expect(chipProblem(state, 'Take a short rest', 'The chapel was quiet.')).toBeNull();
    expect(chipProblem(state, OUTDOOR_REST_CHIP, 'The chapel was quiet.')).toBeNull();
  });

  it('Make camp at a hub with no journey is not an impossible road chip', () => {
    const built = buildNewGameState({
      bibleId: 'millstone-road',
      characterName: 'Jax',
      seed: 26,
      personality: 'chilled-gm',
      engineMode: 'dnd',
    });
    const opened = playReady(stampOpening(built.state));
    const state: GameState = {
      ...opened,
      currentLocation: 'Roadside Tavern',
      journey: null,
      character: { ...opened.character!, hp: 5, maxHp: 10 },
      sceneFacts: { ...emptySceneFacts(26), indoor: true, present: ['the innkeep'] },
    };
    const problem = chipProblem(state, 'Make camp', 'The tavern hearth glowed.');
    expect(problem?.kind === 'impossible-chip' && /no journey/i.test(problem.detail)).toBe(false);
  });
});
