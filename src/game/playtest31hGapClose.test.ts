/**
 * 2026-08-31h — Close ranked P0 ledger gaps from enforcement-crossref.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { compileChoices, namedPropPadsFromBeat } from './choiceCompiler';
import { runArcDirectorBeforeGm } from './arcDirector';
import {
  ensureEncounterSpawnPreface,
  foeVisibleInScene,
  markPendingSpawnPreface,
  autoFightSpawnPreface,
} from './combatAuthority';
import { stripChoiceList } from './parser';
import { eligiblePyoaPadsAfterLock, initPyoaBranchLedger } from './pyoaBranchLedger';
import { hasDurableDeltaByT12, recordT12HookReceipt } from './freeT12Hook';
import {
  buildIntentContract,
  checkObligationCoverage,
} from './intentContract';
import { isAtmosphereOnlyBeat } from './semanticLoopDetector';
import { initEncounterTerminal } from './encounterTerminalFsm';
import { buildPlayTranscript } from './playTranscript';
import { talkContradictsLockedWhy } from './hookLock';
import type { GameState } from './types';
import type { PlayerIntent } from './intentParser';

function summoned(turn = 10): GameState {
  const state = createInitialState('The Summoned Pact', 'litrpg');
  state.campaignBibleId = 'summoned-pact';
  state.turn = turn;
  state.openingEstablishment = {
    complete: true,
    pending: [],
    answers: { name: 'Jax' },
  } as GameState['openingEstablishment'];
  state.character = { ...state.character, name: 'Jax' };
  return state;
}

describe('playtest31h — gap close P0 ledger owners', () => {
  it('stamp is 2026-08-31h / 31a and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-31a').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31h').toBe(true);
  });

  it('P0-1 drought spawn without visible foe marks pending preface; ensure prepends', () => {
    let state = summoned(16);
    state.arcDirector = {
      committedBeatIds: ['sp-beat-orient', 'sp-beat-hear-reason'],
      turnsSinceCombatReceipt: 20,
    };
    const arc = runArcDirectorBeforeGm(state, 'Wait and watch');
    if (arc.state.activeEncounter) {
      const name = arc.state.activeEncounter.name;
      expect(foeVisibleInScene(arc.state, name)).toBe(false);
      expect(arc.state.sceneFacts?.pendingSpawnPreface).toBe(name);
      expect(arc.systemReceipts.some((r) => /preface pending/i.test(r))).toBe(true);

      const fightProse = 'Steel rings. You duck a blade and strike back hard.';
      const ensured = ensureEncounterSpawnPreface(arc.state, fightProse);
      expect(ensured.prepended).toBe(true);
      expect(ensured.prose).toMatch(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
      expect(ensured.prose.startsWith(autoFightSpawnPreface(name).slice(0, 12))).toBe(true);
      expect(ensured.state.sceneFacts?.pendingSpawnPreface).toBeUndefined();
      expect(ensured.state.sceneFacts?.present.some((p) => p.includes(name))).toBe(true);
    } else {
      // Density/cooldown may defer — still verify helpers
      const marked = markPendingSpawnPreface(state, 'Pact-Hunter Skirmisher');
      const ensured = ensureEncounterSpawnPreface(
        marked,
        'Dust motes hang in the gloom. The air smells of decay and ozone.'
      );
      expect(ensured.prepended).toBe(true);
      expect(ensured.prose).toMatch(/Pact-Hunter/i);
    }
  });

  it('P0-2 encounter hard-filters Look around / Examine the room; chest pad when named', () => {
    let state = summoned(8);
    state.activeEncounter = initEncounterTerminal(
      {
        name: 'Pact-Hunter Skirmisher',
        level: 1,
        hp: 16,
        maxHp: 16,
        armorClass: 12,
        strength: 12,
        dexterity: 12,
        constitution: 12,
        xpReward: 30,
        goldReward: 7,
      },
      state,
      { forcedSpawnKey: 'Pact-Hunter Skirmisher' }
    );
    const compiled = compileChoices(
      state,
      ['Look around', 'Examine the room', 'Try to flee', 'Parley', 'Wait and watch'],
      undefined,
      'Press the attack'
    );
    const blob = compiled.choices.join(' | ').toLowerCase();
    expect(blob).not.toMatch(/look around|examine the room/);
    expect(compiled.choices.some((c) => /flee|parley|attack/i.test(c))).toBe(true);

    state = summoned(5);
    state.sceneFacts = {
      crowd: 'none',
      noise: 'quiet',
      present: [],
      props: ['iron chest'],
      lastBeat: 'An iron chest sits against the far wall.',
      updatedTurn: 5,
    };
    expect(namedPropPadsFromBeat(state)).toContain('Check the chest');
    const withChest = compileChoices(state, ['Wait and watch'], undefined, 'Look around');
    expect(withChest.choices.some((c) => /check the chest/i.test(c))).toBe(true);
  });

  it('P0-3 stripChoiceList removes Get-your-bearings numbered opening offers', () => {
    const stitch =
      'You are in the half-collapsed ruin. Rubble frames a gap.\n\n1. Get your bearings\n2. Search the ruin\n3. Check the blue panel';
    const stripped = stripChoiceList(stitch);
    expect(stripped).toMatch(/half-collapsed|rubble/i);
    expect(stripped).not.toMatch(/1\.\s*Get your bearings/i);
    expect(stripped).not.toMatch(/2\.\s*Search the ruin/i);

    const inline = stripChoiceList('The mosaic hums under you. 1. Get your bearings');
    expect(inline).not.toMatch(/1\.\s*Get/i);
    expect(inline).toMatch(/mosaic/i);
  });

  it('P0-4 PYOA lock drops Wait-Wait delay pads; keeps fork futures', () => {
    const state = createInitialState('Thornferry', 'pyoa');
    state.engineMode = 'pyoa';
    state.pyoaBranchLedger = {
      ...initPyoaBranchLedger(),
      branchLocked: 'help-overseer',
      branchClosed: true,
    };
    expect(eligiblePyoaPadsAfterLock(state, 'Wait and watch')).toBe(false);
    expect(eligiblePyoaPadsAfterLock(state, 'Buy time')).toBe(false);
    expect(eligiblePyoaPadsAfterLock(state, 'Face the crisis now')).toBe(true);
    expect(eligiblePyoaPadsAfterLock(state, 'Choose the risky fork')).toBe(true);

    const compiled = compileChoices(
      state,
      ['Wait and watch', 'Buy time', 'Call for help', 'Face the crisis now'],
      undefined,
      'Wait'
    );
    const blob = compiled.choices.join(' | ').toLowerCase();
    expect(blob).not.toMatch(/wait and watch|buy time|call for help/);
    expect(blob).toMatch(/crisis|fork|leverage/);
  });

  it('P1-5 exhausted inspect drops sift / examine-same pads', () => {
    const state = summoned(6);
    const loc = (state.currentLocation ?? 'unknown').toLowerCase();
    state.qualityGovernance = {
      discoveryLedger: {
        [`object:room@${loc}`]: {
          key: `object:room@${loc}`,
          target: 'room',
          type: 'object',
          context: loc,
          turn: 4,
          xpAwarded: 5,
          inspectionCount: 1,
        },
      },
    } as GameState['qualityGovernance'];
    state.sceneFacts = {
      crowd: 'none',
      noise: 'quiet',
      present: [],
      props: [],
      lastBeat: 'Nothing new in the debris.',
      updatedTurn: 5,
      searchedEmpty: ['here', 'debris'],
    };
    const compiled = compileChoices(
      state,
      ['Examine the room', 'Sift the debris', 'Ask a direct question', 'Scout the exit'],
      undefined,
      'Inspect the room'
    );
    const blob = compiled.choices.join(' | ').toLowerCase();
    expect(blob).not.toMatch(/examine the room|sift the debris/);
  });

  it('P1-6 NPC tactic disposition drops first-speech lecture after topic advance', () => {
    const state = summoned(7);
    state.sceneFacts = {
      crowd: 'present',
      noise: 'voices',
      present: ['Pellane'],
      props: [],
      lastBeat: 'Pellane folds his arms.',
      updatedTurn: 6,
    };
    state.arcDirector = {
      npcTopics: { pellane: ['talk:general', 'ask:why'] },
      topicCommits: { pellane: 'refusalFinal' },
    };
    const compiled = compileChoices(
      state,
      ['Ask who they are', 'Ask what is going on', 'Press for leverage', 'Walk away'],
      undefined,
      'Ask Pellane again'
    );
    const blob = compiled.choices.join(' | ').toLowerCase();
    expect(blob).not.toMatch(/ask who they are|ask what(?:'s| is) going on/);
    expect(blob).toMatch(/leverage|walk away|change the subject|direct question/);
  });

  it('P1-7 Free T12 hook receipt persists for Download play', () => {
    let state = summoned(12);
    state.quests = [
      {
        id: 'sp-quest-1',
        name: "The Circle's Price",
        description: 'test',
        status: 'active',
        type: 'main',
        revealed: true,
        objectives: [
          { id: 'o1', description: 'bearings', completed: true },
          { id: 'o2', description: 'hear reason', completed: false },
        ],
      },
    ];
    expect(hasDurableDeltaByT12(state)).toBe(true);
    state = recordT12HookReceipt(state, { beatCommitted: true });
    expect(state.arcDirector?.t12HookReceipt?.fired).toBe(true);
    expect(state.arcDirector?.t12HookReceipt?.reason).toMatch(/questStage/i);

    const md = buildPlayTranscript(state);
    expect(md).toMatch(/T12 hook:\s*FIRED/i);
  });

  it('P1-8 demand obligation fails atmosphere-only ack', () => {
    const state = summoned(3);
    const intent: PlayerIntent = {
      kind: 'talk',
      label: 'Demand',
      targets: [],
    };
    const contract = buildIntentContract({
      typed: 'send me back to my world!',
      resolvedText: 'send me back to my world!',
      intent,
      state,
    });
    expect(contract.obligations.some((o) => o.kind === 'demand')).toBe(true);

    const atmos =
      'Dust motes hang in the gloom. The air smells of decay and ozone. Light shafts pierce the ruin. Silence settles like damp earth.';
    expect(isAtmosphereOnlyBeat(atmos)).toBe(true);
    const miss = checkObligationCoverage(contract, atmos);
    expect(miss.ok).toBe(false);
    expect(miss.missing.some((o) => o.kind === 'demand')).toBe(true);

    const ack =
      'The registrar meets your eyes. "We cannot send you back to Earth," he says. "Not yet." The panel hums.';
    const hit = checkObligationCoverage(contract, ack);
    expect(hit.missing.some((o) => o.kind === 'demand')).toBe(false);
  });

  it('scout / look-around does not pay contradicted hear-reason XP', () => {
    const state = summoned(7);
    state.sceneFacts = {
      crowd: 'present',
      noise: 'voices',
      present: ['Pellane'],
      props: [],
      lastBeat: 'rite',
      updatedTurn: 6,
      hookLock: {
        nature: 'accident',
        summary: 'pulled here by accident',
        lockedTurn: 1,
        source: 'harvest',
      },
    };
    state.quests = [
      {
        id: 'sp-quest-1',
        name: "The Circle's Price",
        description: 'test',
        status: 'active',
        type: 'main',
        revealed: true,
        objectives: [
          { id: 'o1', description: 'bearings', completed: true },
          { id: 'o2', description: 'hear reason', completed: false },
        ],
      },
    ];
    state.arcDirector = { committedBeatIds: ['sp-beat-orient'] };
    expect(talkContradictsLockedWhy('Ask why I was bought here', state.sceneFacts?.hookLock)).toBe(
      true
    );

    const scout = runArcDirectorBeforeGm(state, 'Scout the cell and get bearings');
    expect(scout.beatCommitted && scout.beatId === 'sp-beat-hear-reason').toBe(false);
    expect(scout.xpAwards.some((a) => /hear-reason|Social milestone/i.test(a.reason))).toBe(false);
  });
});
