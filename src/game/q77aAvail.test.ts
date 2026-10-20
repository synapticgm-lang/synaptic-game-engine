/**
 * q77a-AVAIL — one availability helper for pad builders / fallbacks / typed honour.
 * SRD 5.2.1 Death Saving Throws / 0 HP (Wizards of the Coast, CC BY 4.0).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, LogEntry } from './types';
import {
  actionAvailability,
  closedUniverseFallbacks,
  filterPadsByAvailability,
  travelPadBlocked,
} from './padUniverse';
import { blockedActionRefusal, validateActionHard } from './actionValidation';
import { engineChips, padChoicesToCount, sceneSafeFallbacks } from './choicePipeline';
import { compileChoices } from './choiceCompiler';
import { commitOfferedPad, resolveOfferedChoices } from './playTranscript';
import { chipProblem } from './chipLegality';
import { initEncounterTerminal } from './encounterTerminalFsm';
import { journeyPads } from './travelJourney';
import { wayOutMovesPlayer } from './sceneAffordances';

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 20,
    currentLocation: 'Greyhollow Inn',
    character: {
      ...s.character,
      name: 'Jax',
      hp: 12,
      maxHp: 12,
      srd: {
        ...(s.character.srd ?? {}),
        classId: 'fighter',
        skillProfs: s.character.srd?.skillProfs ?? [],
        expertise: s.character.srd?.expertise ?? [],
      } as GameState['character']['srd'],
    },
    openingEstablishment: {
      ...(s.openingEstablishment ?? {}),
      complete: true,
      pending: [],
      answers: { name: 'Jax' },
      sceneWritten: true,
    },
    worldHour: 10,
    worldDay: 1,
    sceneFacts: {
      ...(s.sceneFacts ?? {}),
      present: ['Nell'],
      props: [],
      crowd: 'few',
      noise: 'quiet',
      lastBeat: '',
      updatedTurn: 20,
    },
    ...over,
  } as GameState;
}

function withFight(s: GameState): GameState {
  const enc = initEncounterTerminal(
    {
      name: 'the thugs',
      level: 1,
      hp: 20,
      maxHp: 20,
      armorClass: 12,
      strength: 12,
      dexterity: 10,
      constitution: 12,
      xpReward: 10,
      goldReward: 0,
    },
    s
  );
  return { ...s, activeEncounter: enc };
}

function withDying(s: GameState): GameState {
  return {
    ...s,
    character: { ...s.character, hp: 0, maxHp: 12, conditions: ['Unconscious'] },
    deathSaves: { successes: 0, failures: 0 },
  };
}

function withLane(s: GameState): GameState {
  return {
    ...s,
    currentLocation: 'On the road between places',
    journey: {
      from: 'Greyhollow Inn',
      to: 'Greyhollow Church',
      legsDone: 0,
      legsTotal: 2,
      ground: 'Back streets',
      terrain: 'road',
      encounter: { kind: 'thugs', level: 1, stretch: 0, dangerous: false },
    } as GameState['journey'],
  };
}

const TRAVEL_SAMPLE = 'Travel toward Greyhollow Church';
const TALK_SAMPLE = 'Talk to Nell';

describe('q77a-AVAIL actionAvailability', () => {
  it('fight / dying / lane block travel; dying+fight block talk', () => {
    expect(actionAvailability(base()).travel.ok).toBe(true);
    expect(travelPadBlocked(withFight(base()))).toBe(true);
    expect(actionAvailability(withDying(base())).talk.ok).toBe(false);
    expect(travelPadBlocked(withLane(base()))).toBe(true);
    expect(actionAvailability(withLane(base())).talk.ok).toBe(true);
  });

  it('each block × builders/fallbacks never offer travel (or talk when blocked)', () => {
    const blocks: Array<{ name: string; state: GameState; talkBlocked: boolean }> = [
      { name: 'fight', state: withFight(base()), talkBlocked: true },
      { name: 'dying', state: withDying(base()), talkBlocked: true },
      { name: 'lane', state: withLane(base()), talkBlocked: false },
    ];
    for (const b of blocks) {
      const s = b.state;
      const engine = engineChips(s, 'The lane holds.').map((c) => c.label);
      const compiled = compileChoices(s, [TRAVEL_SAMPLE, TALK_SAMPLE, 'Look around']).choices;
      const offered = resolveOfferedChoices({ ...s, choices: [TRAVEL_SAMPLE, TALK_SAMPLE, 'Look around'], offeredPad: null });
      const fallbacks = sceneSafeFallbacks(s, 'The lane holds.', 'Wait');
      const padded = padChoicesToCount([TRAVEL_SAMPLE, TALK_SAMPLE], s, 'The lane holds.', 3);
      const closed = closedUniverseFallbacks(s);
      const journey = journeyPads(s);
      for (const [name, pads] of [
        ['engineChips', engine],
        ['compileChoices', compiled],
        ['resolveOfferedChoices', offered],
        ['sceneSafeFallbacks', fallbacks],
        ['padChoicesToCount', padded],
        ['closedUniverseFallbacks', closed],
        ['journeyPads', journey],
      ] as const) {
        expect(pads.some((p) => /travel toward/i.test(p)), `${b.name}/${name} travel`).toBe(false);
        if (b.talkBlocked) {
          expect(pads.some((p) => /^talk to\s+/i.test(p)), `${b.name}/${name} talk`).toBe(false);
        }
      }
      expect(filterPadsByAvailability([TRAVEL_SAMPLE, TALK_SAMPLE, 'Look around'], s)).toContain('Look around');
      expect(filterPadsByAvailability([TRAVEL_SAMPLE], s)).not.toContain(TRAVEL_SAMPLE);
    }
  });

  it('picked blocked chip and typed travel/talk give a visible refusal', () => {
    const fight = withFight(base());
    const chip = chipProblem(fight, TRAVEL_SAMPLE);
    expect(chip?.kind).toBe('impossible-chip');
    expect(chip?.detail ?? '').toMatch(/fight|travel/i);
    expect((chip?.detail ?? '').length).toBeGreaterThanOrEqual(8);

    const typedTravel = validateActionHard(TRAVEL_SAMPLE, fight, 'Steel rings.');
    expect(typedTravel.valid).toBe(false);
    expect(typedTravel.refusalBody ?? '').toMatch(/fight/i);
    expect((typedTravel.refusalBody ?? '').length).toBeGreaterThanOrEqual(8);

    const typedTalk = validateActionHard(TALK_SAMPLE, fight, 'Steel rings.');
    expect(typedTalk.valid).toBe(false);
    expect(typedTalk.refusalBody ?? '').toMatch(/fight|talk/i);

    const dying = withDying(base());
    const dyingRefuse = blockedActionRefusal(dying, TRAVEL_SAMPLE);
    expect(dyingRefuse ?? '').toMatch(/unconscious|0 HP|death/i);

    const lane = withLane(base());
    expect(blockedActionRefusal(lane, 'Walk on') ?? '').toMatch(/blocked|meeting|road/i);
    expect(blockedActionRefusal(lane, TALK_SAMPLE)).toBeNull();
  });

  it('engineChips and resolveOfferedChoices share the same set for fixed blocked states', () => {
    for (const s of [withFight(base()), withDying(base()), withLane(base())]) {
      const engine = new Set(
        engineChips(s, 'Fixed prose.').map((c) => c.label.trim().toLowerCase()).filter(Boolean)
      );
      const offered = new Set(
        resolveOfferedChoices({ ...s, choices: [], offeredPad: null })
          .map((c) => c.trim().toLowerCase())
          .filter(Boolean)
      );
      // Offered is a subset of the cooled engine registry — no drift outside it.
      for (const label of offered) {
        expect(engine.has(label) || label === 'look around' || label === 'wait and listen' || label === 'wait and listen carefully', `offered "${label}" missing from engine`).toBe(true);
      }
      expect([...offered].some((l) => l.includes('travel toward'))).toBe(false);
    }
  });

  it('q77a2: lane block drops Walk on / Travel toward but keeps Turn back as MOVE and Face as scene', () => {
    const s = withLane({
      ...base(),
      currentLocation: 'the lane between Greyhollow Inn and Greyhollow Church',
      choices: [
        'Walk on',
        'Face the thugs',
        'Talk your way past the thugs',
        'Turn back toward Greyhollow Inn',
      ],
      log: [
        {
          id: 'gm-road',
          role: 'gm',
          turn: 20,
          content: 'Three rough men stepped off a doorstep and spread across the lane.',
          timestamp: 1,
        } as LogEntry,
      ],
    });
    expect(actionAvailability(s).travelScope).toBe('forward');
    expect(blockedActionRefusal(s, 'Turn back toward Greyhollow Inn')).toBeNull();
    expect(blockedActionRefusal(s, 'Walk on') ?? '').toMatch(/blocked|meeting|road/i);
    const next = commitOfferedPad(s, 'gm-road');
    const chips = next.offeredPad?.chips ?? [];
    const labels = chips.map((c) => c.label);
    expect(labels.some((l) => /^walk on$/i.test(l))).toBe(false);
    expect(labels.some((l) => /travel toward/i.test(l))).toBe(false);
    const face = chips.find((c) => c.label === 'Face the thugs');
    expect(face?.slotCategory).toBe('scene');
    expect(chips.some((c) => c.slotCategory === 'move' && wayOutMovesPlayer(s, c.label))).toBe(true);
  });
});
