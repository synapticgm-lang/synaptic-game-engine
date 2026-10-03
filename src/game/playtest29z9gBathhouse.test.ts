/**
 * 2026-10-01 — John's live bathhouse playthrough on 29z9f: talk chips with nobody here, the panel
 * as a prop, "the a ruined bathhouse", a street map indoors, a cut-off quest chip.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { resolveOfferedChoices } from './playTranscript';
import { compileRefEnum, formatRefEnumForWriter, type LedgerRef } from './completedEventPacket';
import { renderTokenBeat, type TokenBeat } from './tokenProse';
import { cameraAllowsInteriorMap, harvestCameraIntoSceneFacts } from './travelAuthority';
import { objectiveChip } from './choiceRanking';
import { matchLitRpgMainSpine } from '@/data/quests/litrpgMainSpines';
import type { GameState } from './types';

const HERE = 'alone in a ruined bathhouse off the Valespire roads';

const PAGE1 =
  'Cold rain hits your face through a jagged crack in a ceramic dome. You are lying on wet tiles in a ruined bathhouse off the Valespire roads. Water pools around a fading chalk circle and soaks through your Earth clothes. A blue panel hangs in the draft, dry while you shiver. The cedar door bangs its hinges against the stone. Nobody stayed. If anything useful is left in the alcoves, you will have to take it.';

const PANEL_TURN =
  'Jax crossed the wet tiles and stopped in front of the blue panel, close enough to feel no heat coming off it. The words came slow and flat, and Jax read them twice while rain dripped off his jaw.';

const TURN4 =
  'He worked through the rubble along the eastern wall, shifting rotted bench slats and slabs of fallen ceiling to see what the floor underneath was hiding. Under a drift of tile shards near the deep pool he found a seam in the cracked street that ran too straight to be damage.';

function bathhouse(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    currentLocation: HERE,
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: HERE, name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: true,
      pickedHookFallback: PAGE1,
    },
    sceneFacts: { ...emptySceneFacts(0), props: ['blue panel'] },
    log: [{ id: 't0', turn: 0, role: 'gm', content: PAGE1, timestamp: 1 }],
    ...over,
  };
}

describe('29z9g bathhouse — opening chips look at who is here and what was just done', () => {
  it('page 1 alone offers no "Ask what they want"', () => {
    const chips = resolveOfferedChoices(bathhouse());
    expect(chips.some((c) => /ask what they want/i.test(c))).toBe(false);
    expect(chips.length).toBeGreaterThan(0);
  });

  it('after the typed investigate, no "Who are you" and no "Inspect the panel"', () => {
    const state = bathhouse({
      turn: 2,
      log: [
        { id: 't0', turn: 0, role: 'gm', content: PAGE1, timestamp: 1 },
        {
          id: 'p1',
          turn: 1,
          role: 'player',
          content: "Investigate the blue panel what is it what can it tell me about what's going on",
          timestamp: 2,
        },
        { id: 'g1', turn: 1, role: 'gm', content: PANEL_TURN, timestamp: 3 },
      ],
    });
    const chips = resolveOfferedChoices(state);
    expect(chips.some((c) => /^who are you/i.test(c))).toBe(false);
    expect(chips.some((c) => /inspect the panel/i.test(c))).toBe(false);
    expect(chips.length).toBeGreaterThan(0);
  });
});

describe('29z9g bathhouse — the System window is not a prop', () => {
  it('the writer gets the panel as a window only Jax sees', () => {
    const refs = compileRefEnum(bathhouse({ systemHousing: undefined }));
    const panel = refs.find((r) => r.display === 'blue panel');
    expect(panel?.klass).toBe('window');
    const line = formatRefEnumForWriter(refs);
    expect(line).toMatch(/only Jax sees it; nobody can touch it/);
  });
});

describe('29z9g bathhouse — the name-paste step does not double the article', () => {
  it('"onto the @t1" with display "a ruined bathhouse…" paints once', () => {
    const refs: LedgerRef[] = [
      { tok: 't1', id: 'here', display: 'a ruined bathhouse off the Valespire roads', klass: 'place' },
    ];
    const beat: TokenBeat = {
      refs: [{ tok: '@t1', id: 'here', use: 'place' }],
      lines: [{ text: 'Jax read them twice while rain dripped off his jaw onto the @t1.' }],
    } as TokenBeat;
    const out = renderTokenBeat(beat, refs);
    expect(out).toContain('onto the ruined bathhouse off the Valespire roads');
    expect(out).not.toMatch(/\bthe a\b/);
  });

  it('a bare preposition keeps the display article', () => {
    const refs: LedgerRef[] = [
      { tok: 't1', id: 'here', display: 'a ruined bathhouse off the Valespire roads', klass: 'place' },
    ];
    const beat = {
      refs: [{ tok: '@t1', id: 'here', use: 'place' }],
      lines: [{ text: 'You woke in @t1.' }],
    } as TokenBeat;
    expect(renderTokenBeat(beat, refs)).toContain('in a ruined bathhouse');
  });
});

describe('29z9g bathhouse — indoor or outdoor comes from the place', () => {
  it('"a seam in the cracked street" inside the bathhouse locks indoor', () => {
    const facts = harvestCameraIntoSceneFacts(emptySceneFacts(3), TURN4, 4, 'Search the rubble along the eastern wall', HERE);
    expect(facts.cameraLock?.scale).toBe('indoor');
  });

  it('a save already locked outdoor by prose opens the bathhouse floor plan', () => {
    const state = bathhouse({
      sceneFacts: {
        ...emptySceneFacts(4),
        cameraLock: { scale: 'outdoor', label: HERE, lockedTurn: 4 },
      },
    });
    expect(cameraAllowsInteriorMap(state)).toBe(true);
  });
});

describe('29z9g bathhouse — quest chips and the Echoes spine', () => {
  it('a long first step becomes its verb and object, never a cut-off line', () => {
    const chip = objectiveChip("Find the mage's hidden vault key amidst the rubble of their destroyed sanctum.");
    expect(chip).toBe("Find the mage's hidden vault key");
  });

  it('"Echoes of a Dead Summoner" stays on a collapsed mage tower', () => {
    expect(matchLitRpgMainSpine('summoned-pact', PAGE1, HERE)?.spineId).not.toBe('alone-ruin-tether');
    expect(
      matchLitRpgMainSpine('summoned-pact', 'You wake alone in a collapsed mage tower.', 'a collapsed mage tower')?.spineId
    ).toBe('alone-ruin-tether');
  });
});
