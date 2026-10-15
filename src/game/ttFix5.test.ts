/**
 * tt-fix-5 — lap 6 engine items (N1–N8) and the writer's kit paste and PC agency.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { compileOpeningCard, openingCastNote } from './openingEstablishment';
import { buildCompletedEventPacket, classifyVerb, compileRefEnum } from './completedEventPacket';
import { applyTabletopQuestTurn, placeTabletopStepPeople, tabletopStepChip } from './tabletopQuestProgress';
import { peopleHere } from './chipLegality';
import { TABLETOP_MAIN_SPINES, tabletopSpineGiver, tabletopSpineToStarterQuest } from '../data/quests/tabletopMainSpines';
import { openDungeonCard, advanceDungeonCard } from './dungeonCard';
import { seedTownsfolkHere } from './townsfolk';
import { maskPlaceNames } from './narrativeHarvest';
import { wrongExitCountProblem } from './exitCount';
import { isStaleLocationBleed } from './sceneContextTail';
import { isSlotGlueViolation } from './slotGlue';
import { repairRejectedSentences, type DraftCheck, type WriterTurnResult } from './writerTurn';
import { formatWriterInfoLayer } from './writerInfoLayer';
import { agencyProblem, PC_AGENCY } from './engineFactGate';
import { parsePlayerIntent } from './intentParser';
import type { GameState, Quest } from './types';

function tabletop(extra: Partial<GameState> = {}): GameState {
  const s0 = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s0,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 6,
    activeEncounter: null,
    openingEstablishment: { pending: [], answers: {}, ...(s0.openingEstablishment ?? {}), complete: true },
    character: { ...s0.character, name: 'Jax' },
    currentLocation: 'Keep Gate',
    log: [{ id: 'g1', role: 'gm', content: 'Jax stood before the barred oak doors as the wind rose.' }],
    ...extra,
  } as unknown as GameState;
}

const quest = (id: string, objectives: Quest['objectives'], extra: Partial<Quest> = {}): Quest =>
  ({ id, name: 'The Woodcutter’s Plea', revealed: true, status: 'active', type: 'main', description: '', objectives, ...extra }) as unknown as Quest;

const withHook = (who: string) =>
  tabletop({
    openingEstablishment: {
      pending: [], answers: {}, complete: true,
      pickedHook: `Place: Keep Gate\nWho is here: ${who}\nWhy: the keep took a child`,
    },
  } as Partial<GameState>);

describe('tt-fix-5 N6 the steward behind the door is heard, not present', () => {
  it('a lead behind a shut way is one cast name with a heard-not-seen note', () => {
    const card = compileOpeningCard('cursed-keep', 'Place: Keep Gate\nWho is here: a steward behind the oak\nWhy: the keep took a child');
    expect(card?.castNames ?? []).not.toContain('a steward behind the oak');
    expect(openingCastNote(withHook('a steward behind the oak'))).toMatch(/behind the oak: heard, not seen/);
  });
});

describe('tt-fix-5 N8 a group lead is several people, never one speaker', () => {
  it('a plural lead gets the several-people note; one person gets none', () => {
    expect(openingCastNote(withHook('exhausted faces on the porch'))).toMatch(/several people, not one/);
    expect(openingCastNote(withHook('an old woodcutter'))).toBeUndefined();
  });
});

describe('tt-fix-5 N5 the spine giver is placed for non-talk steps', () => {
  it('Silas is the Lost Survey giver, anchored to its steps, and lives at the inn', () => {
    const spine = TABLETOP_MAIN_SPINES.find((s) => s.spineId === 'ck-spine-scholars-folly')!;
    expect(tabletopSpineGiver(spine)).toBe('Silas Thorne');
    const seed = tabletopSpineToStarterQuest(spine);
    expect(seed.objectiveAnchors?.some((a) => a?.people?.includes('Silas Thorne'))).toBe(true);
    const s = tabletop({
      currentLocation: 'Greyhollow Inn',
      quests: [quest('ck-spine-scholars-folly', seed.objectives.map((d, i) => ({ id: `o${i}`, description: d, completed: false, ...(seed.objectiveAnchors?.[i] ?? {}) })), { giver: 'Silas Thorne', location: 'Greyhollow Inn' })],
    });
    expect(peopleHere(placeTabletopStepPeople(s)).some((n) => /Silas/.test(n))).toBe(true);
  });
});

describe('tt-fix-5 N4 a step inside the keep does not tick from outside the gate', () => {
  const steps = (where: string) =>
    tabletop({
      currentLocation: where,
      quests: [quest('ck-quest-1', [
        { id: 'o1', description: "Search the keep's ground floor for signs of Lina", completed: false, place: 'Keep Gate', room: 'inside' },
        { id: 'o2', description: 'Discover the sealed crack in the great hall floor', completed: false, place: 'Keep Gate', room: 'hall' },
      ])],
    });
  it('outside the gate the ground-floor step is the way in and does not tick; inside it ticks (tt-fix-11)', () => {
    expect(tabletopStepChip(steps('Keep Gate'))).toMatch(/ground floor/);
    const chip = tabletopStepChip(steps('Keep Gate'))!;
    expect(applyTabletopQuestTurn(steps('Keep Gate'), chip, 'Keep Gate').state.quests![0]!.objectives![0]!.completed).toBe(false);
    expect(tabletopStepChip(steps('Keep Gate — Broken Gate'))).toMatch(/ground floor/);
  });
});

describe('tt-fix-5 N1 escaping a room fight leaves the room', () => {
  it('the PC falls back out of the foe room; the foe stays', () => {
    const opened = openDungeonCard(tabletop(), 'Keep Gate');
    const d = opened.activeDungeon!;
    const entry = d.currentNodeId;
    const foeRoom = d.nodes.find((n) => n.id !== entry && (n.hidden?.mobs ?? []).some((m) => !m.defeated));
    expect(foeRoom).toBeTruthy();
    const foe = foeRoom!.hidden!.mobs.find((m) => !m.defeated)!;
    const inRoom: GameState = {
      ...opened,
      currentLocation: `Keep Gate — ${foeRoom!.name}`,
      activeDungeon: { ...d, currentNodeId: foeRoom!.id, visitedNodeIds: [entry, foeRoom!.id] },
    };
    const out = advanceDungeonCard(inRoom, 'Flee', [`Encounter cleared: ${foe.name} — escaped`]);
    expect(out.receipts.join(' ')).toMatch(new RegExp(`(?:fell back|got out)[^.]*; ${foe.name} stayed in ${foeRoom!.name}`));
    expect(out.state.activeDungeon?.currentNodeId).not.toBe(foeRoom!.id);
  });
});

describe('tt-fix-5 N2 no townsfolk in dungeon rooms', () => {
  it('a dungeon room seeds nobody', () => {
    const opened = openDungeonCard(tabletop(), 'Keep Gate');
    const before = (opened.npcMemories ?? []).length;
    expect((seedTownsfolkHere(opened).npcMemories ?? []).length).toBe(before);
  });
});

describe('tt-fix-5 N7 a place name is not a person', () => {
  it("Mira's Apothecary is masked before the people harvest", () => {
    expect(maskPlaceNames(tabletop(), "Jax set off toward Mira's Apothecary at dusk.")).not.toMatch(/Mira/);
  });
});

describe('tt-fix-5 N3 the gate keeps correct sentences', () => {
  const exits = tabletop({
    completedEvent: { engineResult: "Exits: the ways out of Keep Gate lead to Greyhollow Inn, Greyhollow Church, Greyhollow Graveyard, Mira's Apothecary." },
  } as Partial<GameState>);

  it('"one …, one …" is a list, not a count of one', () => {
    expect(wrongExitCountProblem(exits, "One path runs to Greyhollow Inn, one to Greyhollow Church, one to Greyhollow Graveyard, and one to Mira's Apothecary.")).toBeNull();
    expect(wrongExitCountProblem(exits, 'Only one way out remained.')).toMatch(/wrong number/);
  });

  it('a left place named as a way to somewhere is not stale', () => {
    const moved = tabletop({
      currentLocation: 'Keep Gate',
      previousLocationSheet: { name: 'Greyhollow Inn' },
      sceneFacts: { cameraLock: { lockedTurn: 6 } },
    } as unknown as Partial<GameState>);
    expect(isStaleLocationBleed(moved, 'A lantern swung along the road to Greyhollow Inn.')).toBe(false);
  });

  it('a name followed by its verb and object is the subject, not glue', () => {
    expect(isSlotGlueViolation('Jax watched as the Road Bandit swung a scimitar back and missed.', ['Road Bandit'])).toBe(false);
    expect(isSlotGlueViolation('Jax tried to push the Wren Holt.', ['Wren Holt'])).toBe(true);
  });

  it('a repair that hands the sentence back unchanged leaves it off the page (tt-fix-15)', async () => {
    const fact = "Exits: the ways out of Keep Gate lead to Greyhollow Inn, Greyhollow Church, Greyhollow Graveyard, Mira's Apothecary.";
    const s0 = tabletop();
    const s = { ...s0, completedEvent: buildCompletedEventPacket(s0, 'Check the exits', { engineResult: fact }) } as GameState;
    const bad = 'Two roads led out of Keep Gate.';
    const prose = `Jax looked along the wall. ${bad}`;
    const check: DraftCheck = { state: s, playerInput: 'Check the exits', intent: parsePlayerIntent('Check the exits', s), engineFact: '', previousGm: '' };
    const out = await repairRejectedSentences({ prose } as unknown as WriterTurnResult, {
      packet: s.completedEvent as never,
      check,
      repair: async () => bad,
    });
    expect(out.prose).not.toContain(bad);
    expect(out.repairs?.[0]?.bug).toMatch(/unchanged/);
  });
});

describe('tt-fix-5 kit: worn kit reaches the writer only on a turn that uses it', () => {
  const kitted = tabletop({
    inventory: [
      { id: 'k1', name: 'Chain Mail', rarity: 'Common', quantity: 1, equipped: true, slot: 'Body' },
      { id: 'k2', name: 'Travelling Clothes', rarity: 'Common', quantity: 1, equipped: true, slot: 'Legs' },
    ],
  } as unknown as Partial<GameState>);

  it('REF ENUM and facts drop kit on a look; keep it when the line names it', () => {
    expect(compileRefEnum(kitted, [], { action: 'Look around' }).some((r) => r.klass === 'kit')).toBe(false);
    expect(compileRefEnum(kitted, [], { action: 'Tighten the straps of my chain mail' }).some((r) => r.display === 'chain mail')).toBe(true);
    expect(formatWriterInfoLayer(kitted, [], 'Look around')).not.toMatch(/chain mail|travelling clothes/i);
    expect(formatWriterInfoLayer(kitted, [], 'Tighten my chain mail')).toMatch(/chain mail/);
  });
});

describe('tt-fix-5 PC agency: the writer does not play the PC', () => {
  it('a wait is a wait, not an inspection', () => {
    expect(classifyVerb('Wait and watch')).toBe('waited');
  });

  it('the PC gets no words on a pick that is not speech', () => {
    const s = tabletop();
    expect(agencyProblem(s, 'Jax spoke a sharp warning to the bats.', 'Dodge')).toBe(PC_AGENCY);
    expect(agencyProblem(s, 'Jax warned the bats away.', 'Warn the bats off')).toBeNull();
    expect(agencyProblem(s, 'Jax said, "Back off."', 'Tell them to back off')).toBeNull();
  });
});
