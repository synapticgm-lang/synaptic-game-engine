/**
 * 2026-09-10d — Ash hall: hall questions stay on the card stitch.
 * Silent settle stubs and quest XP must not fire on name-lock talk.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  canHarvestAsNamedPerson,
} from './entityRegistry';
import { isPolityFactionOrPlaceToken } from './chromeAuthority';
import {
  extractNamesFromHookText,
  resolveOpeningPinnedNames,
} from './openingPin';
import {
  isOpeningHallTalkTurn,
  openingCastLabel,
} from './openingEstablishment';
import { resolveOfferedChoices } from './playTranscript';
import { stitchOpeningContinue } from './openingStitch';
import {
  assemblePacketStitch,
  buildCompletedEventPacket,
} from './completedEventPacket';
import { runArcDirectorBeforeGm } from './arcDirector';
import type { GameState } from './types';

const useGame = readFileSync(resolve(__dirname, './useGame.ts'), 'utf8');

const ASH_PAGE1 =
  'The air smells of burnt iron. You wake on your back in a jagged circle of iron dust, red light in the cracks, nowhere near Pellane’s brass. A blue panel hangs in the gloom — private, yours. Ash Court priests in soot-stained robes stand over you; one iron mask tilts down. A wrapped ember-blade sits on a stone side table — a deal, not yours yet. The lead priest’s voice comes rough through the mask: show the Mark, or give a name they can write on a tally.';

function ashHall(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    seed: 'ash-hall-10d',
    currentLocation: 'an Ash-adjacent ritual hall',
    character: { ...base.character, name: 'Unknown Survivor' },
    openingEstablishment: {
      pending: [
        {
          id: 'name',
          kind: 'name',
          question: 'They need a name before they will say what they want. What is yours?',
        },
      ],
      answers: { where: 'an Ash-adjacent ritual hall' },
      complete: false,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHookFallback: ASH_PAGE1,
    },
    sceneFacts: { ...emptySceneFacts(1), present: [] },
    log: [
      {
        id: 't0',
        turn: 0,
        role: 'gm',
        content: ASH_PAGE1,
        timestamp: 1,
      },
    ],
    ...over,
  };
}

function namedJax(over: Partial<GameState> = {}): GameState {
  const hall = ashHall();
  return ashHall({
    turn: 3,
    character: { ...hall.character, name: 'Jax' },
    openingEstablishment: {
      ...hall.openingEstablishment!,
      answers: { ...hall.openingEstablishment!.answers, name: 'Jax' },
      pending: [],
      complete: true,
    },
    ...over,
  });
}

describe('playtest10d — ash hall Silent break', () => {
  it('HUD/BUILD stay on the 10 line, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-10/);
    expect(BUILD_STAMP).toMatch(/^2026-09-10/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('useGame stitches covers and hall talk locally — never callOpeningGm', () => {
    expect(useGame).toContain('shouldStitchOpeningContinue');
    expect(useGame).toContain('stitchOpeningContinue(openingState, contentSanitized)');
    expect(useGame).not.toMatch(/await callOpeningGm\(/);
  });

  it('where + who + panel answers all three from this card', () => {
    const text = stitchOpeningContinue(
      ashHall(),
      "Where am I? Who is it that asks for my name? What's the blue screen i can see?"
    );
    expect(text).toMatch(/Ash-adjacent ritual hall/i);
    expect(text).toMatch(/lead priest|iron mask|priest/i);
    expect(text).toMatch(/panel/i);
    expect(text).toMatch(/System window|not a person/i);
    expect(text).not.toMatch(/The moment at|Dust hung|waited without a speech/i);
    expect(text).not.toMatch(/burnt iron|ember-blade/i);
  });

  it('name + what’s yours names the priest, not only Jax', () => {
    const text = stitchOpeningContinue(namedJax(), 'My name is Jax whats yours then');
    expect(text).toMatch(/Jax/);
    expect(text).toMatch(/lead priest|iron mask|priest/i);
    expect(openingCastLabel(namedJax())).toMatch(/lead priest|iron mask/i);
  });

  it('after name lock, where/who stay hall-talk pads — no Corridor doors', () => {
    const asked = namedJax({
      turn: 5,
      log: [
        ...ashHall().log,
        { id: 'p', turn: 5, role: 'player', content: 'Where am i', timestamp: 5 },
      ],
      activeDungeon: {
        id: 'interior-plan',
        name: 'hall',
        nodes: [
          { id: 'here', name: 'Hall', x: 0, y: 0 },
          { id: 'c', name: 'Corridor', x: 1, y: 0 },
        ],
        edges: [{ from: 'here', to: 'c', kind: 'door' }],
        currentNodeId: 'here',
      } as GameState['activeDungeon'],
    });
    expect(isOpeningHallTalkTurn(asked, 'Where am i')).toBe(true);
    const pads = resolveOfferedChoices(asked);
    expect(pads.join(' ')).not.toMatch(/Corridor|Side room|Passage|doorway/i);
    expect(pads.join(' ')).not.toMatch(/Lowmarket|West Wall/i);
  });

  it('Silent packet stitch answers where — never settle stubs', () => {
    const packet = buildCompletedEventPacket(namedJax({ turn: 5 }), 'Where am i');
    expect(packet.verb).toBe('spoke');
    const stitch = assemblePacketStitch(packet);
    expect(stitch).toMatch(/Ash-adjacent ritual hall/i);
    expect(stitch).not.toMatch(/The moment at|You still had the next move|Dust hung|waited without a speech/i);
  });

  it('Ash / Ash Court never harvest as people', () => {
    expect(canHarvestAsNamedPerson('Ash', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Ash Court', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Ash Court priests', 'summoned-pact')).toBe(false);
    expect(isPolityFactionOrPlaceToken('Ash Court')).toBe(true);
    expect(isPolityFactionOrPlaceToken('Ash')).toBe(true);
    const fromHook = extractNamesFromHookText(ASH_PAGE1);
    expect(fromHook.join(' ')).not.toMatch(/\bAsh\b/);
    const pinned = resolveOpeningPinnedNames(ashHall());
    expect(pinned.join(' ')).not.toMatch(/\bAsh\b|Ash Court/i);
  });

  it('ArcDirector does not pay bearings or hear-reason on name-lock talk', () => {
    const state = namedJax({
      turn: 4,
      quests: [
        {
          id: 'sp-quest-1',
          name: "The Circle's Price",
          description: 'test',
          status: 'active',
          type: 'main',
          revealed: true,
          objectives: [
            { id: 'o1', description: 'bearings', completed: false },
            { id: 'o2', description: 'hear reason', completed: false },
          ],
        },
      ],
    });
    const nameLock = runArcDirectorBeforeGm(state, 'My name is Jax whats yours then');
    expect(nameLock.beatCommitted).toBe(false);
    expect(nameLock.xpAwards.some((a) => a.amount >= 15)).toBe(false);

    const where = runArcDirectorBeforeGm(state, 'Where am i');
    expect(where.beatCommitted && where.beatId === 'sp-beat-hear-reason').toBe(false);

    const earned = runArcDirectorBeforeGm(
      { ...state, arcDirector: { committedBeatIds: ['sp-beat-orient'] } },
      'Ask who summoned me and why'
    );
    expect(earned.beatId).toBe('sp-beat-hear-reason');
  });
});
