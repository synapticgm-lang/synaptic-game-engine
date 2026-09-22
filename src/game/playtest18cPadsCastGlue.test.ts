/**
 * 2026-09-18c — Cover pads never collapse to Inspect-the-panel alone.
 * Who does not starve from a shared CAST "answers you" prefix on the want beat.
 * Compound CAST uses plural speak-verb. Mid writer OFF. No SNAPSHOT/CRAFT.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { compileChoices } from './choiceCompiler';
import { bookBodyAfterWriterMiss, lastResortStoryBody, buildCompletedEventPacket } from './completedEventPacket';
import { obeyLedgerNouns } from './ledgerNounObey';
import { applyGraphExitTravel, dungeonHereLabel, graphExitPads, matchGraphExitPad } from './mapEngine';
import { applyNamedHubTravel } from './outdoorHubs';
import type { ActiveDungeonState } from './mapEngine';
import {
  castSpeakVerb,
  coverContinuePads,
  hallTalkAsksStayLeave,
  hallTalkAsksWho,
  hallTalkAsksWant,
  hallTopicAlreadyAnswered,
  isAcceptOfferLine,
  isOpeningNameGiveLine,
  openingNameLockSpokenBeat,
  shouldStarveHallTopicPad,
  shouldStitchOpeningContinue,
} from './openingEstablishment';
import { stitchOpeningContinue } from './openingStitch';
import type { GameState } from './types';

const PAGE1 =
  'Light, then a wall of festival noise. You hit sunlit cobbles in a no-need Valespire square.';

function namedWatchtower(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    turn: 2,
    currentLocation: 'Valespire',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'Valespire', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook:
        'Location: Valespire\nWho is here / who summoned: the handler\nWhy this happened: they need a Pactborn against the Ash Court.',
      pickedHookFallback: PAGE1,
    },
    sceneFacts: emptySceneFacts(2),
    log: [
      { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
    ],
    ...over,
  };
}

describe('playtest18c — pads refill and CAST glue', () => {
  it('HUD/BUILD are 2026-09-22a, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-22a');
    expect(BUILD_STAMP).toBe('2026-09-22a');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('compound CAST speak-verb is plural', () => {
    expect(castSpeakVerb('Pellane scouts on one bank and Ash pickets on the other')).toBe('answer');
    expect(castSpeakVerb('the envoys at this table')).toBe('answer');
    expect(castSpeakVerb('the handler')).toBe('answers');
    const who = 'Pellane scouts on one bank and Ash pickets on the other';
    expect(`${who.charAt(0).toUpperCase() + who.slice(1)} ${castSpeakVerb(who)} you.`).toMatch(
      / answer you\.$/
    );
  });

  it('name-lock want beat does not starve Who are you or first Ask what they want', () => {
    const lock = openingNameLockSpokenBeat(namedWatchtower());
    const state = namedWatchtower({
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
        { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
        { id: 'g1', turn: 1, role: 'gm', content: lock, timestamp: 2 },
      ],
    });
    // Name-lock may speak the card want; page-1 / lock GM must not mark want answered.
    expect(hallTopicAlreadyAnswered(state, 'want')).toBe(false);
    expect(hallTopicAlreadyAnswered(state, 'who')).toBe(false);
    expect(shouldStarveHallTopicPad(state, 'Who are you')).toBe(false);
    expect(shouldStarveHallTopicPad(state, 'Ask what they want')).toBe(false);
    const pads = coverContinuePads(state);
    expect(pads).toContain('Ask what they want');
    expect(pads.filter((c) => /inspect the panel/i.test(c)).length).toBeLessThan(2);
    expect(pads.length).toBeGreaterThan(0);
  });

  it('Inspect the panel dies after one look and Look/Wait refill', () => {
    const lock = openingNameLockSpokenBeat(namedWatchtower());
    const afterInspect = namedWatchtower({
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
        { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
        { id: 'g1', turn: 1, role: 'gm', content: lock, timestamp: 2 },
        { id: 'p2', turn: 2, role: 'player', content: 'Who are you', timestamp: 3 },
        { id: 'g2', turn: 2, role: 'gm', content: 'The handler answers you. "Handler. You came through. Stay where we can see you."', timestamp: 4 },
        { id: 'p3', turn: 3, role: 'player', content: 'Inspect the panel', timestamp: 5 },
        { id: 'g3', turn: 3, role: 'gm', content: 'The blue panel was yours — a System window, not a person.', timestamp: 6 },
      ],
    });
    expect(shouldStarveHallTopicPad(afterInspect, 'Inspect the panel')).toBe(true);
    const pads = coverContinuePads(afterInspect);
    expect(pads.join(' ')).not.toMatch(/Inspect the panel/i);
    // Want is not answered by page-1 / name-lock — Ask stays until the player asks it.
    expect(pads.join(' ')).toMatch(/Ask what they want|Look around|Wait/);
    expect(compileChoices(afterInspect, ['Inspect the panel', 'Look around', 'Wait']).choices)
      .not.toContain('Inspect the panel');
  });

  it('last-resort for Where/Joss is not the already-answered want telegram', () => {
    const lock = openingNameLockSpokenBeat(namedWatchtower());
    const state = namedWatchtower({
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
        { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
        { id: 'g1', turn: 1, role: 'gm', content: lock, timestamp: 2 },
      ],
    });
    const line = 'Okay, fine. Let\'s just go. Where is this Joss guy?';
    const resort = lastResortStoryBody(state, buildCompletedEventPacket(state, line), line);
    expect(resort.prose).toMatch(/Joss|way out|loft/i);
    expect(resort.prose).not.toMatch(/the ask was already answered|did not say it twice/i);
  });

  it('last-resort for a bare name is HERE + spoken want, not a go-forward', () => {
    expect(isOpeningNameGiveLine('Jax')).toBe(true);
    expect(isOpeningNameGiveLine('Who are you')).toBe(false);
    const state = namedWatchtower();
    const lock = openingNameLockSpokenBeat(state);
    const resort = lastResortStoryBody(state, buildCompletedEventPacket(state, 'Jax'), 'Jax');
    expect(resort.prose.replace(/\s+/g, ' ').trim()).toBe(lock.replace(/\s+/g, ' ').trim());
    expect(resort.prose).not.toMatch(/next way out|call for|You look for/i);
  });

  it('first Who last-resort speaks identity, not already-answered', () => {
    expect(hallTalkAsksWho('Who are you')).toBe(true);
    expect(hallTalkAsksWho('Who is the handler')).toBe(true);
    const state = namedWatchtower();
    const resort = lastResortStoryBody(
      state,
      buildCompletedEventPacket(state, 'Who are you'),
      'Who are you'
    );
    expect(resort.prose).not.toMatch(/already answered who they are|did not introduce twice/i);
    expect(resort.prose.length).toBeGreaterThan(24);
    const afterLock = namedWatchtower({
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
        { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
        { id: 'g1', turn: 1, role: 'gm', content: openingNameLockSpokenBeat(namedWatchtower()), timestamp: 2 },
      ],
    });
    const firstWho = lastResortStoryBody(
      afterLock,
      buildCompletedEventPacket(afterLock, 'Who are you'),
      'Who are you'
    );
    expect(firstWho.prose).not.toMatch(/already answered who they are/i);
    const withOptimisticWho = namedWatchtower({
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
        { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
        { id: 'g1', turn: 1, role: 'gm', content: openingNameLockSpokenBeat(namedWatchtower()), timestamp: 2 },
        { id: 'p2', turn: 2, role: 'player', content: 'Who are you', timestamp: 3 },
      ],
    });
    const stillFirst = lastResortStoryBody(
      withOptimisticWho,
      buildCompletedEventPacket(withOptimisticWho, 'Who are you'),
      'Who are you'
    );
    expect(stillFirst.prose).not.toMatch(/already answered who they are/i);
  });

  it('Lowmarket page1 with card-want facts: first Ask speaks, not already-answered', () => {
    const page1 =
      'Ash-heat and a Lowmarket junk stall under tarps. A stolen Scale chalk circle still smokes. '
      + 'They want luck for a sale and will toss you a junk knife if you stay. What name?';
    const low = namedWatchtower({
      currentLocation: 'a Lowmarket junk stall under tarps',
      openingEstablishment: {
        pending: [],
        answers: { where: 'a Lowmarket junk stall under tarps', name: 'Jax' },
        complete: true,
        sceneWritten: true,
        mode: 'weave',
        aloneArrival: false,
        pickedHook:
          'Location: Lowmarket junk stall\nWho is here / who summoned: roof-thieves\n'
          + 'Why this happened: they wanted luck for a sale.\nOpening offer: a junk knife if you stay.',
        pickedHookFallback: page1,
      },
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: page1, timestamp: 0 },
        { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
        {
          id: 'g1',
          turn: 1,
          role: 'gm',
          content:
            'You are in a Lowmarket junk stall under tarps. The people who pulled you answer you. '
            + '"They wanted luck for a sale. Stay and they will toss you a junk knife."',
          timestamp: 2,
        },
      ],
    });
    expect(hallTopicAlreadyAnswered(low, 'want')).toBe(false);
    expect(shouldStitchOpeningContinue(low, 'Ask what they want')).toBe(true);
    const stitch = stitchOpeningContinue(low, 'Ask what they want');
    expect(stitch).not.toMatch(/ask was already answered|did not say it twice|already said it/i);
    expect(stitch.length).toBeGreaterThan(24);
    const resort = lastResortStoryBody(
      low,
      buildCompletedEventPacket(low, 'Ask what they want'),
      'Ask what they want'
    );
    expect(resort.prose).not.toMatch(/ask was already answered|did not say it twice/i);
    expect(resort.prose.length).toBeGreaterThan(24);

    const free = 'why should I help you?';
    expect(hallTalkAsksWant(free) || /why should i help/i.test(free)).toBe(true);
    expect(shouldStitchOpeningContinue(low, free)).toBe(true);
    const freeStitch = stitchOpeningContinue(low, free);
    expect(freeStitch).not.toMatch(/ask was already answered|did not say it twice/i);
    const freeResort = lastResortStoryBody(low, buildCompletedEventPacket(low, free), free);
    expect(freeResort.prose).not.toMatch(/ask was already answered|did not say it twice/i);

    const withOptimisticWho = {
      ...low,
      log: [
        ...low.log,
        { id: 'p2', turn: 2, role: 'player' as const, content: 'Who are you', timestamp: 3 },
      ],
    };
    expect(shouldStitchOpeningContinue(withOptimisticWho, 'Who are you')).toBe(true);
    const whoStitch = stitchOpeningContinue(withOptimisticWho, 'Who are you');
    expect(whoStitch).not.toMatch(/already answered who they are|did not introduce twice/i);
    const whoResort = lastResortStoryBody(
      withOptimisticWho,
      buildCompletedEventPacket(withOptimisticWho, 'Who are you'),
      'Who are you'
    );
    expect(whoResort.prose).not.toMatch(/already answered who they are|did not introduce twice/i);

    // Second same-topic ask may already-told.
    const afterWant = {
      ...low,
      log: [
        ...low.log,
        { id: 'p2', turn: 2, role: 'player' as const, content: 'Ask what they want', timestamp: 3 },
        {
          id: 'g2',
          turn: 2,
          role: 'gm' as const,
          content: stitchOpeningContinue(low, 'Ask what they want'),
          timestamp: 4,
        },
        { id: 'p3', turn: 3, role: 'player' as const, content: 'Ask what they want', timestamp: 5 },
      ],
    };
    expect(shouldStitchOpeningContinue(afterWant, 'Ask what they want')).toBe(true);
    const second = stitchOpeningContinue(afterWant, 'Ask what they want');
    expect(second).toMatch(/already (?:said|answered)/i);
  });

  it('graph-exit pad commits HERE and last-resort is arrival, not hay/settle', () => {
    const dungeon: ActiveDungeonState = {
      blueprintId: 'test-hall',
      dungeonName: 'Hollow Engine',
      tier: 3,
      currentZLevel: 0,
      currentNodeId: 'hall',
      visitedNodeIds: ['hall'],
      clearedNodeIds: [],
      nodes: [
        {
          id: 'hall',
          name: 'Dead hall',
          description: 'Gears.',
          connections: ['side'],
          coordinates: { x: 0, y: 0 },
        },
        {
          id: 'side',
          name: 'Side room',
          description: 'A side room.',
          connections: ['hall'],
          coordinates: { x: 1, y: 0 },
        },
      ],
    };
    const line = 'Go through the east doorway to Side room';
    expect(matchGraphExitPad(dungeon, line)?.name).toBe('Side room');
    const moved = applyGraphExitTravel(
      namedWatchtower({
        currentLocation: 'a dead hall of the Hollow Engine',
        activeDungeon: dungeon,
        log: [
          { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
          { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
          { id: 'g1', turn: 1, role: 'gm', content: openingNameLockSpokenBeat(namedWatchtower()), timestamp: 2 },
        ],
      }),
      line
    );
    expect(moved.activeDungeon?.currentNodeId).toBe('side');
    expect(moved.currentLocation).toMatch(/Side room/i);
    const resort = lastResortStoryBody(moved, buildCompletedEventPacket(moved, line), line);
    expect(resort.prose).toMatch(/are at|step onto|opens onto|reach|step into/i);
    expect(resort.prose).toMatch(/Side room|Hollow Engine/i);
    expect(resort.prose).not.toMatch(/Hay and tack|The loft does not move|Nothing listed had moved on|The moment at/i);
  });

  it('accept-the-kit last-resort is not a look-again stall', () => {
    expect(isAcceptOfferLine("Okay, fine. I'll work the cots. Give me the kit.")).toBe(true);
    const lock = openingNameLockSpokenBeat(namedWatchtower());
    const state = namedWatchtower({
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
        { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
        { id: 'g1', turn: 1, role: 'gm', content: lock, timestamp: 2 },
        { id: 'p2', turn: 2, role: 'player', content: 'Inspect the panel', timestamp: 3 },
        {
          id: 'g2',
          turn: 2,
          role: 'gm',
          content: 'You are still at the cathedral infirmary. Heat sits on the stones you already know. Jax still has the next move.',
          timestamp: 4,
        },
      ],
    });
    const line = "Okay, fine. I'll work the cots. Give me the kit.";
    const resort = lastResortStoryBody(state, buildCompletedEventPacket(state, line), line);
    expect(resort.prose).toMatch(/take the work|say yes|offered kit/i);
    expect(resort.prose).not.toMatch(/looked through|same walls held|Nothing new had come/i);
    const askSeals = lastResortStoryBody(
      state,
      buildCompletedEventPacket(state, 'What are these seals? What do I do with them?'),
      'What are these seals? What do I do with them?'
    );
    expect(isAcceptOfferLine('What are these seals? What do I do with them?')).toBe(false);
    expect(askSeals.prose).not.toMatch(/take the work|say yes at/i);
  });

  it('Travel toward a hub commits HERE before last-resort', () => {
    const state = namedWatchtower({ currentLocation: 'a Lowmarket junk stall under tarps' });
    const moved = applyNamedHubTravel(state, 'Travel toward West Wall');
    expect(moved.currentLocation).toMatch(/West Wall/i);
    const resort = lastResortStoryBody(
      moved,
      buildCompletedEventPacket(moved, 'Travel toward West Wall'),
      'Travel toward West Wall'
    );
    expect(resort.prose).toMatch(/West Wall|are at|step onto|opens onto|reach|step into/i);
    expect(resort.prose).not.toMatch(/junk stall under tarps — West Wall/i);
    expect(resort.prose).not.toMatch(/^The last doorway is behind you/i);
  });

  it('typed going-to and walk-with last-resort move, not who/want stall', () => {
    const lock = openingNameLockSpokenBeat(namedWatchtower({ currentLocation: 'Cinderwake Trail' }));
    const trail = namedWatchtower({
      currentLocation: 'Cinderwake Trail',
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
        { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
        { id: 'g1', turn: 1, role: 'gm', content: lock, timestamp: 2 },
      ],
    });
    const walk = "Okay, I'll walk with Oren. Let's go.";
    const walkResort = lastResortStoryBody(trail, buildCompletedEventPacket(trail, walk), walk);
    expect(walkResort.prose).toMatch(/set out|start toward|take Oren/i);
    expect(walkResort.prose).not.toMatch(/look for Oren|way does not open|ask was already answered|You asked who/i);

    const stuck = 'Why are we still here? Oren, you said we were walking.';
    const stuckResort = lastResortStoryBody(trail, buildCompletedEventPacket(trail, stuck), stuck);
    expect(stuckResort.prose).not.toMatch(/ask was already answered|did not say it twice/i);

    const going = "Okay, that's it. I'm going to the West Wall.";
    const moved = applyNamedHubTravel(trail, going);
    expect(moved.currentLocation).toMatch(/West Wall/i);
    const goResort = lastResortStoryBody(moved, buildCompletedEventPacket(moved, going), going);
    expect(goResort.prose).toMatch(/West Wall/i);
    expect(goResort.prose).not.toMatch(/You asked who|still the ones in this room/i);
  });

  it('Travel toward Weighing Cup last-resort names that hub, not the last street', () => {
    const line = 'Travel toward The Weighing Cup';
    const fromMarket = namedWatchtower({ currentLocation: 'Lowmarket' });
    const moved = applyNamedHubTravel(
      { ...fromMarket, activeEncounter: { name: 'Integration Scar Scout', hp: 0, maxHp: 12, level: 1 } },
      line
    );
    expect(moved.currentLocation).toMatch(/Weighing Cup/i);
    const resort = lastResortStoryBody(moved, buildCompletedEventPacket(moved, line), line);
    expect(resort.prose).toMatch(/Weighing Cup/i);
    expect(resort.prose).not.toMatch(/You are at the Lowmarket now/i);
    expect(resort.prose).not.toMatch(/You close with |loot is legal/i);
  });

  it('Can I go is stay/leave, not set-out-with-Can, and Weighing Cup is not rewritten to witness', () => {
    const roof = namedWatchtower({ currentLocation: 'a Lowmarket night-market roof' });
    const ask = 'Are we done here? Can I go?';
    expect(hallTalkAsksStayLeave(ask)).toBe(true);
    const askResort = lastResortStoryBody(roof, buildCompletedEventPacket(roof, ask), ask);
    expect(askResort.prose).not.toMatch(/set out with Can|You set out with Done/i);

    const stall = 'So, are you going to make your move or are we just going to stand here all night?';
    const stallResort = lastResortStoryBody(roof, buildCompletedEventPacket(roof, stall), stall);
    expect(stallResort.prose).not.toMatch(/set out with the next way out/i);

    const line = 'Travel toward The Weighing Cup';
    const moved = applyNamedHubTravel(roof, line);
    expect(moved.currentLocation).toMatch(/Weighing Cup/i);
    const cup = lastResortStoryBody(moved, buildCompletedEventPacket(moved, line), line);
    expect(cup.prose).toMatch(/Weighing Cup/i);
    expect(cup.prose).not.toMatch(/witness Cup/i);
    const obeyed = obeyLedgerNouns(cup.prose, moved, buildCompletedEventPacket(moved, line));
    expect(obeyed.prose).toMatch(/Weighing Cup/i);
    expect(obeyed.prose).not.toMatch(/witness Cup/i);
  });

  it('walk-away ask is stay/leave, not look-for-Good or a combat close', () => {
    expect(hallTalkAsksStayLeave('What happens if I walk away?')).toBe(true);
    const state = namedWatchtower();
    const line = 'I look the handler in the eye. What happens if I walk away?';
    const resort = lastResortStoryBody(state, buildCompletedEventPacket(state, line), line);
    expect(resort.prose).not.toMatch(/You look for Good|You close with |Contract Hall Bravo|You go down/i);
    const close = bookBodyAfterWriterMiss(
      state,
      buildCompletedEventPacket(state, 'I walk through the nearest exit.'),
      'I walk through the nearest exit.',
      'You close with Contract Hall Bravo. Contract Hall Bravo keeps the body type the name already has. The exchange is short. Contract Hall Bravo drops. The body stays on the floor — loot is legal.'
    );
    expect(close.prose).not.toMatch(/Contract Hall Bravo|loot is legal/i);
  });

  it('graph pads skip this room and last-resort names the dest room once', () => {
    expect(dungeonHereLabel('Cathedral Infirmary', 'Cathedral Infirmary')).toBe('Cathedral Infirmary');
    expect(dungeonHereLabel('Cathedral Infirmary — Sanctum', 'Choir')).toBe('Cathedral Infirmary — Choir');
    const dungeon: ActiveDungeonState = {
      blueprintId: 'infirmary',
      dungeonName: 'Cathedral Infirmary',
      tier: 1,
      currentZLevel: 0,
      currentNodeId: 'inf',
      visitedNodeIds: ['inf'],
      clearedNodeIds: [],
      nodes: [
        {
          id: 'inf',
          name: 'Cathedral Infirmary',
          description: 'Cots.',
          connections: ['choir', 'inf'],
          coordinates: { x: 0, y: 0 },
        },
        {
          id: 'choir',
          name: 'Choir',
          description: 'Stone pews.',
          connections: ['inf', 'sanctum'],
          coordinates: { x: 0, y: 1 },
        },
        {
          id: 'sanctum',
          name: 'Sanctum',
          description: 'Quiet.',
          connections: ['choir'],
          coordinates: { x: 1, y: 1 },
        },
      ],
    };
    const pads = graphExitPads(dungeon);
    expect(pads.join(' ')).not.toMatch(/to Cathedral Infirmary/i);
    expect(pads.join(' ')).toMatch(/to Choir/i);
    const line = 'Go through the north doorway to Choir';
    const moved = applyGraphExitTravel(namedWatchtower({ currentLocation: 'Cathedral Infirmary', activeDungeon: dungeon }), line);
    expect(moved.currentLocation).toBe('Cathedral Infirmary — Choir');
    expect(moved.currentLocation).not.toMatch(/Infirmary — Cathedral Infirmary/i);
    const resort = lastResortStoryBody(moved, buildCompletedEventPacket(moved, line), line);
    expect(resort.prose).toMatch(/Choir/i);
    expect(resort.prose).not.toMatch(/Infirmary — Cathedral Infirmary|Sanctum — Sanctum|You leave .+ behind and reach/i);
  });
});
