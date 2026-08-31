/**
 * 2026-08-31l — Opening authority: stitch-first pointer card, packet honesty,
 * VALUE FLOOR, bible-split LitRPG DNA, autofight template, invent budget.
 * Stamp: HUD 2026-08-31l / BUILD 2026-08-31e. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import {
  buildOpeningGmPlayerInput,
  classifyOpeningContinue,
  compileLitrpgCoreIdentity,
  compilePointerCardSlots,
  formatOpeningCardChrome,
  formatPointerCardForSnapshot,
  inferWhoCountFromHook,
  openingInventBudgetZero,
  stripOpeningInventQuota,
} from './openingPointerCard';
import { buildOpeningSceneMandate } from './openingEstablishment';
import { seedOpeningSceneFacts } from './sceneFacts';
import { formatSceneSnapshotForPrompt } from './situationPacket';
import { formatCampaignContractForPrompt, freezeCampaignContract } from './campaignContract';
import { scrubOfficialPlaceholder } from './narrativeScrub';
import { narrateAutoFightTemplate, commitAutoFightLedger, isHumanoidEnemyName } from './combatAuthority';
import { formatFluidProseRailsForPrompt } from './fluidProseRails';
import { buildMasterPrompt } from './masterPrompt';
import { stitchOpeningScene } from './openingStitch';
import { applyCraftLearning, consumeThumbsDownSignal, noteThumbsDownFeedback } from './craftBookCompiler';

function summonedState(): GameState {
  const state = createInitialState(undefined, 'litrpg');
  state.campaignBibleId = 'summoned-pact';
  state.campaignArchetype = 'isekai';
  state.campaignPremise = 'They meant to summon a hero. Earth clothes. Pellane.';
  state.currentLocation = 'The Sevenfold Circle under Valespire Cathedral';
  state.openingEstablishment = {
    pending: [],
    answers: {},
    complete: false,
    sceneWritten: false,
    aloneArrival: false,
    pickedHook:
      'Location: The Sevenfold Circle under Valespire Cathedral\nWho is here / who summoned: High Chanter Orel Vane and Crown handlers of Pellane\nWhy this happened: They paid for a Pactborn champion to end the Ash Court war.\n- You are on your back inside a seven-ring circle.\n- A blue panel hangs at eye level.',
    pickedHookId: 'the-sevenfold-circle-under-valespire-cathedral',
    pickedHookFallback:
      'Light, then cold stone. You are on your back inside a seven-ring summoning circle. Robed figures freeze mid-chant.',
  };
  return state;
}

describe('playtest31lOpeningAuthority', () => {
  it('stamp is 2026-08-31l / 31e and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-31e').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31l').toBe(true);
  });

  it('pointer card slots reach the opening packet and GM input', () => {
    const state = summonedState();
    const slots = compilePointerCardSlots(state);
    expect(slots?.where).toMatch(/Sevenfold Circle/i);
    expect(slots?.who).toMatch(/Orel Vane/i);
    expect(slots?.why).toMatch(/Pactborn/i);
    expect(slots?.forbid.join(' ')).not.toMatch(/ordinary street first/i);

    const input = buildOpeningGmPlayerInput(state, '');
    expect(input).toMatch(/Establish this card|Continue this card/i);
    expect(input).toMatch(/WHERE:/);
    expect(input).toMatch(/WHO_COUNT:/);
    expect(input).toMatch(/WHY:/);
    expect(input).not.toMatch(/^\(opening\)$/);

    const snap = formatSceneSnapshotForPrompt(state);
    expect(snap).toMatch(/POINTER CARD/);
    expect(snap).toMatch(/WHO_COUNT:/);
    expect(snap).toMatch(/OPENING INVENT BUDGET: 0/);

    const mandate = buildOpeningSceneMandate(state);
    expect(mandate).toMatch(/WHERE:/);
    expect(mandate).not.toMatch(/ordinary street first/i);
  });

  it('player-visible Chapter One chrome comes from the card', () => {
    const chrome = formatOpeningCardChrome(summonedState());
    expect(chrome).toMatch(/^Chapter One —/);
    expect(chrome).toMatch(/Sevenfold Circle/i);
    expect(chrome).not.toMatch(/eval|POINTER|FORBID/i);
  });

  it('stitch-first then continue uses locked scene, not a blank (opening)', () => {
    const state = summonedState();
    const stitch = stitchOpeningScene(state);
    expect(stitch.length).toBeGreaterThan(40);
    const locked: GameState = {
      ...state,
      openingEstablishment: { ...state.openingEstablishment!, sceneWritten: true },
      log: [
        {
          id: 'g0',
          turn: 0,
          role: 'gm',
          content: stitch,
          timestamp: 1,
        },
      ],
    };
    const input = buildOpeningGmPlayerInput(locked, '(opening)');
    expect(input).toMatch(/Continue this card|LOCKED SCENE/i);
    expect(input).toContain(stitch.slice(0, 40));
    expect(input).not.toBe('(opening)');
  });

  it('official / King / figure never become the blue panel', () => {
    const empty = summonedState();
    empty.sceneFacts = {
      crowd: 'present',
      noise: 'voices',
      present: [],
      props: ['blue panel'],
      lastBeat: 'A panel hangs.',
      updatedTurn: 1,
      crowdCount: 2,
    };
    const dropped = scrubOfficialPlaceholder(
      'The official, Place, remains. The King believes. A figure waits.',
      empty
    );
    expect(dropped.toLowerCase()).not.toMatch(/blue panel/);
    expect(dropped.toLowerCase()).not.toMatch(/the official/);

    const withPerson = {
      ...empty,
      sceneFacts: { ...empty.sceneFacts!, present: ['Mira'] },
    };
    const swapped = scrubOfficialPlaceholder('Approach the official.', withPerson);
    expect(swapped).toMatch(/Mira/i);
    expect(swapped.toLowerCase()).not.toMatch(/blue panel/);
  });

  it('crowdCount is seeded from the pointer card at T0', () => {
    const state = summonedState();
    const seeded = seedOpeningSceneFacts(state);
    expect(seeded.crowdCount).toBeGreaterThan(0);
    expect(seeded.lastBeat).not.toMatch(/^People are present\.?$/i);
    expect(inferWhoCountFromHook('', '', [], true)).toBe(0);

    const alone = summonedState();
    alone.openingEstablishment = { ...alone.openingEstablishment!, aloneArrival: true, pickedHook: 'Location: a burnt husk\nWhy this happened: leftover.' };
    const aloneSeed = seedOpeningSceneFacts(alone);
    expect(aloneSeed.crowdCount).toBe(0);
    expect(aloneSeed.crowd).toBe('none');
  });

  it('summoned-pact LitRPG DNA is not Modern Integration Earth', () => {
    const dna = compileLitrpgCoreIdentity(summonedState());
    expect(dna).not.toMatch(/Modern Integration Earth/i);
    expect(dna).toMatch(/summon|HERE/i);

    const si = createInitialState(undefined, 'litrpg');
    si.campaignBibleId = 'system-integration';
    si.campaignPremise = 'Every human on Earth hears the Integration protocol.';
    expect(compileLitrpgCoreIdentity(si)).toMatch(/Modern Integration Earth/i);

    const prompt = buildMasterPrompt(summonedState(), { contentMode: 'adult' } as never);
    expect(prompt).not.toMatch(/Modern Integration Earth/);
    expect(prompt).toMatch(/Other-world summon|arrived HERE/i);
  });

  it('autofight template commits lastKill without beast-deny', () => {
    expect(isHumanoidEnemyName('Pact-Hunter Skirmisher')).toBe(true);
    const prose = narrateAutoFightTemplate('Pact-Hunter Skirmisher', { victory: true });
    expect(prose).toMatch(/Pact-Hunter/);
    expect(prose.toLowerCase()).not.toMatch(/\bbeast\b/);
    expect(prose).toMatch(/body stays on the floor/i);

    let state = summonedState();
    state.activeEncounter = {
      name: 'Pact-Hunter Skirmisher',
      hp: 1,
      maxHp: 12,
      level: 1,
    } as GameState['activeEncounter'];
    state.turn = 10;
    state = commitAutoFightLedger(state, { victory: true, finalPlayerHp: 8 });
    expect(state.sceneFacts?.lastKill?.name).toMatch(/Pact-Hunter/);
    expect(state.sceneFacts?.lastKill?.remains).toBe(true);
  });

  it('invent budget strips extra names on first GM-continue', () => {
    const state = summonedState();
    expect(openingInventBudgetZero(state)).toBe(true);
    const bloated =
      'Orel Vane watches. Then Mayor Gribble of Westport and Lady Fen walk in from Earth Mall.';
    const stripped = stripOpeningInventQuota(state, bloated, 0);
    expect(stripped).not.toMatch(/Westport/);
    expect(stripped).not.toMatch(/Gribble/);

    const street = classifyOpeningContinue(
      state,
      'You wake on an ordinary street. The mall lights flicker.'
    );
    expect(street.accept).toBe(false);
  });

  it('VALUE FLOOR is one new concrete, not a 100–180 word essay', () => {
    const rails = formatFluidProseRailsForPrompt('litrpg');
    expect(rails).toMatch(/VALUE FLOOR/i);
    expect(rails).toMatch(/one new concrete/i);
    expect(rails).not.toMatch(/100–180 words/);
  });

  it('campaign contract includes pickedHookId', () => {
    const state = summonedState();
    state.campaignContract = freezeCampaignContract(state);
    const block = formatCampaignContractForPrompt(state);
    expect(block).toMatch(/Pointer card:/);
  });

  it('thumbs-down notes a cheap CRAFT boost', () => {
    noteThumbsDownFeedback(4);
    expect(consumeThumbsDownSignal(5)).toBe(true);
    const learned = applyCraftLearning(undefined, ['thumbs_down'], 'litrpg', ['litrpg-collage-cut']);
    expect(learned.lastSignals).toContain('thumbs_down');
  });

  it('snapshot packet lists pointer card for summoned-pact', () => {
    const block = formatPointerCardForSnapshot(summonedState());
    expect(block).toMatch(/POINTER CARD/);
    expect(block).toMatch(/FORBID/);
  });
});
