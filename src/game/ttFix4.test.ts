/**
 * tt-fix-4 — lap 5 leftovers: the dropped quest-step chip, what the writer is handed about travel and the
 * quest record, backed-only answer repairs, plain kit words, check chips that say what failure costs, the
 * Oskar step and one-look spines, route names in the habit check, and tabletop XP by challenge rating only.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { tabletopStepChip, tabletopStepPlace, placeTabletopStepPeople, applyTabletopQuestTurn } from './tabletopQuestProgress';
import { filterInventedContextChoices } from './choiceWarden';
import { chipProblem, peopleHere } from './chipLegality';
import { journeyPads, isJourneyPad, meetingMoveBase, writerEngineResult, writerTravelFact } from './travelJourney';
import { buildInfoSheet } from './infoSheet';
import { backedAnswerFacts, quoteHeldToFacts } from './writerTurn';
import { kitRefDisplay } from './inventory';
import { TABLETOP_MAIN_SPINES, tabletopSpineToStarterQuest } from '../data/quests/tabletopMainSpines';
import { checkPlayCrimes } from './turnCheck';
import { applySandboxXpAwards } from './sandboxXp';
import type { ActiveEncounter, GameState, Quest } from './types';

const GOUGE = 'Examine the deep gouge marks on the outside of the oak doors to determine what took the guard.';
const LEG = 'Travel: back streets between Greyhollow Inn and Keep Gate — leg 1 of 2 — +30 min, now afternoon; Keep Gate still ahead; chance meeting: a traveler, on their own errand';

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
  ({ id, name: 'Blood on the Timber', revealed: true, status: 'active', type: 'main', description: '', objectives, ...extra }) as unknown as Quest;

describe('tt-fix-4 (1) the quest-step chip stays on the menu', () => {
  it('a step chip whose object the beat never named is not dropped as invented', () => {
    const s = tabletop({ quests: [quest('ck-spine-barred-oak', [{ id: 'o1', description: GOUGE, completed: false, place: 'Keep Gate' }])] });
    const chip = tabletopStepChip(s);
    expect(chip).toBeTruthy();
    expect(filterInventedContextChoices([chip!, 'Look around'], s)).toContain(chip);
    expect(chipProblem(s, chip!)).toBeNull();
  });
});

describe('tt-fix-4 (2) the writer is handed the destination and plain time, not the travel record', () => {
  it('a raw travel receipt becomes a plain arrival / underway fact', () => {
    const plain = writerEngineResult(`${LEG}. Dungeon room: none.`);
    expect(plain).not.toMatch(/leg 1 of 2|\+30 min|chance meeting|Travel:/);
    expect(plain).toMatch(/Keep Gate/);
    expect(writerTravelFact('Travel: back streets to Keep Gate — +30 min, now dusk.')).toMatch(/^Arrived at Keep Gate\./);
  });

  it('tabletop INFO SHEET carries no quest record and no raw receipt', () => {
    const s = tabletop({
      quests: [quest('ck-spine-barred-oak', [{ id: 'o1', description: GOUGE, completed: false, place: 'Keep Gate' }])],
      log: [
        { id: 'p1', role: 'player', content: 'Walk on' },
        { id: 'g1', role: 'gm', content: 'Jax walked the back streets.', systemLog: [LEG] },
      ],
    } as Partial<GameState>);
    const text = JSON.stringify(buildInfoSheet(s));
    expect(text).not.toMatch(/Blood on the Timber|gouge marks|leg 1 of 2|\+30 min/);
  });
});

describe('tt-fix-4 (3) answer repairs quote only a backed line', () => {
  it('nobody on record has no backed line; a quote must carry a backed fact', () => {
    const s = tabletop();
    expect(backedAnswerFacts(s, 'a passing stranger')).toEqual([]);
    expect(quoteHeldToFacts('The keep took my daughter, Lina', ['wants his daughter Lina found before the keep takes her'])).toBe(true);
    expect(quoteHeldToFacts('The miller owes me forty crowns', ['wants his daughter Lina found before the keep takes her'])).toBe(false);
  });
});

describe('tt-fix-4 (4) kit words handed to the writer are plain lowercase', () => {
  it('tabletop labels lose title case, rarity tags and notes; other modes keep their names', () => {
    expect(kitRefDisplay('Chain Mail', true)).toBe('chain mail');
    expect(kitRefDisplay('[Uncommon] Iron Shield (worn)', true)).toBe('iron shield');
    expect(kitRefDisplay("Thieves' Tools", true)).toBe("thieves' tools");
    expect(kitRefDisplay('Tide Lantern')).toBe('Tide Lantern');
  });
});

describe('tt-fix-4 (5) a check chip says what failure costs', () => {
  it('meeting checks carry the cost; the base form still reads as the same move', () => {
    const s = {
      currentLocation: 'Back streets',
      places: [],
      journey: {
        from: 'Greyhollow Inn', to: 'Keep Gate', ground: 'Back streets', terrain: 'streets',
        legsTotal: 2, legsDone: 1, hoursPerLeg: 0.5, startedTurn: 3,
        encounter: { kind: 'thugs' },
      },
    } as unknown as GameState;
    const pads = journeyPads(s);
    const talk = pads.find((p) => /^Talk your way past the thugs/.test(p));
    expect(talk).toBe('Talk your way past the thugs, but fail and they attack');
    expect(pads).toContain('Face the thugs');
    expect(meetingMoveBase(talk!)).toBe('Talk your way past the thugs');
    expect(isJourneyPad(s, talk!)).toBe(true);
    expect(isJourneyPad(s, 'Talk your way past the thugs')).toBe(true);
    expect(isJourneyPad({ ...s, journey: { ...s.journey!, encounter: null } }, 'Talk your way past the thugs')).toBe(false);
  });
});

describe('tt-fix-4 (6) the Oskar step is reachable; a spine is more than one look', () => {
  it('a talk step names its place by a hub alias, and its person lives there', () => {
    const step = 'Speak with Oskar at the Greyhollow Tavern';
    const s = tabletop({
      currentLocation: 'Greyhollow Inn',
      quests: [quest('ck-quest-1', [{ id: 'o1', description: step, completed: false }, { id: 'o2', description: 'Examine the keep gate', completed: false }])],
    });
    expect(tabletopStepPlace(s, step)).toBe('Greyhollow Inn');
    const placed = placeTabletopStepPeople(s);
    expect(peopleHere(placed).some((n) => /Oskar/.test(n))).toBe(true);
    const turn = applyTabletopQuestTurn(s, 'Talk to Oskar');
    expect(turn.receipts.join(' ')).toMatch(/Quest stage/);
    expect(turn.state.quests![0]!.status).toBe('active');
  });

  it('every tabletop spine starts with two steps at its pin, or leads from its pin into its site (tt-fix-10)', () => {
    for (const spine of TABLETOP_MAIN_SPINES) {
      const seed = tabletopSpineToStarterQuest(spine);
      expect(seed.objectives.length).toBe(spine.site ? 3 : 2);
      expect(seed.objectiveAnchors?.[0]?.place).toBe(spine.mapPin);
      expect(seed.objectiveAnchors?.slice(1).every((a) => a?.place === (spine.site?.place ?? spine.mapPin))).toBe(true);
    }
  });
});

describe('tt-fix-4 (7) a route name is not a repeated habit', () => {
  it('the back streets named again across travel beats raise no down flag', () => {
    const journey = {
      from: 'Greyhollow Inn', to: 'Keep Gate', ground: 'Back streets', terrain: 'streets',
      legsTotal: 2, legsDone: 1, hoursPerLeg: 0.5, startedTurn: 3,
    };
    const before = tabletop({
      currentLocation: 'Back streets',
      journey,
      log: [{ id: 'g1', role: 'gm', content: 'Jax walked through the narrow back streets of the town as rain fell.' }],
    } as Partial<GameState>);
    const { down } = checkPlayCrimes(before, before, 'Walk on', 'Jax hurried on through the narrow back streets of the town toward the hill.');
    expect(down.filter((f) => f.kind === 'repeated-habit')).toEqual([]);
  });
});

describe('tt-fix-4 (8) tabletop pays challenge-rating XP only', () => {
  it('a first kill pays its CR and no deed', () => {
    const r = applySandboxXpAwards({ ...tabletop(), sandboxAwardKeys: [], places: [] }, {
      playerAction: 'Attack',
      locationName: 'Keep Gate',
      previousLocationName: 'Keep Gate',
      questsBefore: [],
      questsAfter: [],
      events: [],
      encounterCleared: true,
      enemyKilled: true,
      endedEncounter: { name: 'Goblin', cr: '1/4', hp: 0, maxHp: 7 } as unknown as ActiveEncounter,
      turn: 4,
    });
    expect(r.xp).toBe(50);
    expect(r.notes.join(' ')).not.toMatch(/Achievement/);
  });
});
