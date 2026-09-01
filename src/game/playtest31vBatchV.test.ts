/**
 * Batch V — post–Batch-U Gemini T50 P0s (seed 42 tape).
 * Rasped verb→noun collapse, They cast, combat purgatory, stitch meta, travel starve,
 * unearned shard, leave inventory fail, crowd-here salad.
 * Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  applyProseWarden,
  scrubDialogueVerbAsNoun,
  scrubStitchBankLeaks,
  scrubEntityMadLibs,
  scrubUnearnedPocketLoot,
} from './proseWarden';
import {
  codedSceneMove,
  isStitchBankFingerprint,
  repairRejectedBeat,
  classifyBeatCommit,
} from './beatCommitGate';
import {
  isDialogueVerbPersonToken,
  isChoicePadPersonToken,
  filterChromeFromPresent,
  realPresentPeople,
} from './chromeAuthority';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { harvestVignetteIntoSceneFacts } from './vignetteLock';
import { emptySceneFacts } from './sceneFacts';
import { tickEncounterTerminal } from './encounterTerminalFsm';
import { compileChoices } from './choiceCompiler';
import { applyStructuralEvents } from './structuralEvents';
import { detectCombatPurgatoryHard } from './semanticLoopDetector';
import { rewriteInvalidReferences, extractEntityContext, validateEntityReferences } from './typedEntityValidator';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import type { GameState } from './types';

describe('playtest31vBatchV', () => {
  it('stamp is 2026-08-31v / 31n and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(HUD_BUILD_STAMP).toBe('2026-08-31v');
    expect(BUILD_STAMP).toBe('2026-08-31n');
  });

  describe('P0-A/B — Rasped / They never become cast', () => {
    it('blocks dialogue verbs and They from person tokens', () => {
      expect(isDialogueVerbPersonToken('Rasped')).toBe(true);
      expect(isDialogueVerbPersonToken('Whispered')).toBe(true);
      expect(isChoicePadPersonToken('They')).toBe(true);
      expect(filterChromeFromPresent(['Rasped', 'They', 'Wall Sergeant'])).toEqual([
        'Wall Sergeant',
      ]);
      expect(realPresentPeople(['Rasped', 'They', 'One', 'Press', 'Wall Sergeant'])).toEqual([
        'Wall Sergeant',
      ]);
    });

    it('vignette Title-Case harvest does not promote Rasped into present', () => {
      const prose =
        '"You want to know what\'s going on? " Rasped, their voice like grit shifting underfoot. The other figures present, Rasped and They, remained where they were.';
      const facts = harvestVignetteIntoSceneFacts(
        {
          ...emptySceneFacts(5),
          openVignette: {
            id: 'arg:lowmarket:t5',
            hubId: 'lowmarket',
            hubName: 'Lowmarket',
            kind: 'argument',
            cast: ['Lowmarket Fence'],
            props: [],
            openedTurn: 5,
            status: 'open',
          },
          present: ['Lowmarket Fence'],
        },
        prose,
        5,
        { id: 'lowmarket', name: 'Lowmarket' }
      );
      expect(facts.present ?? []).not.toContain('Rasped');
      expect(facts.present ?? []).not.toContain('They');
      expect(facts.openVignette?.cast ?? []).not.toContain('Rasped');
    });

    it('narrative harvest never locks Rasped', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = harvestNarrativeIntoLedger(
        state,
        'The stall owner, Rasped, their voice a gravelly rasp, leaned in. Rasped says hello.',
        6
      );
      expect(state.sceneFacts?.present ?? []).not.toContain('Rasped');
    });

    it('scrubs tape quotes: direction / monster / cast / fists', () => {
      const foe = 'Void-Touched Scavenger';
      expect(scrubDialogueVerbAsNoun('To your Rasped, a stall is shuttered.', foe)).toMatch(
        /to your left/i
      );
      expect(
        scrubDialogueVerbAsNoun('The snarling creature, a Rasped, lunged from the rubble.', foe)
      ).not.toMatch(/\ba Rasped\b/i);
      expect(
        scrubDialogueVerbAsNoun(
          'The other figures present, Rasped and They, remained where they were.',
          foe
        )
      ).not.toMatch(/Rasped and They/i);
      expect(scrubDialogueVerbAsNoun('You bring your fists Rasped, aiming for its limbs.', foe)).toMatch(
        /fists forward/i
      );
      const cleaned = applyProseWarden(
        'You twisted sharply to your Rasped. The stall owner, Rasped, watched. Rasped and They remained.',
        { enemyName: foe, presentNames: ['Rasped', 'They'] }
      );
      expect(cleaned).not.toMatch(/\bRasped\b/);
    });

    it('rewriteInvalidReferences never maps the mark/panel onto Rasped', () => {
      const ctx = extractEntityContext({
        ...createInitialState(undefined, 'litrpg'),
        sceneFacts: {
          ...emptySceneFacts(12),
          present: ['Rasped'],
        },
      } as GameState);
      const report = validateEntityReferences('the mark burns. the panel hums. a figure waits.', ctx);
      const out = rewriteInvalidReferences(
        'the mark burns. the panel hums. a figure waits.',
        ctx,
        report
      );
      expect(out).not.toMatch(/\bRasped\b/i);
      expect(out).toMatch(/the mark/i);
      expect(out).toMatch(/the panel/i);
    });
  });

  describe('P0-C — combat purgatory interrupts', () => {
    it('attack intent always commits HP damage + receipt', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        turn: 50,
        activeEncounter: {
          name: 'Void-Touched Scavenger',
          hp: 16,
          maxHp: 16,
          phase: 'engaged',
          encounterId: 'enc-v',
          engagedTurnCount: 2,
          failedFleeCount: 0,
          failedParleyCount: 0,
          maxEngagedTurns: 8,
        },
      } as GameState;
      const tick = tickEncounterTerminal(state, 'Press the attack');
      expect(tick.state.activeEncounter?.hp).toBeLessThan(16);
      expect(tick.receipts.some((r) => /HP:/i.test(r))).toBe(true);
    });

    it('detects identical little-true-effect combat recycle', () => {
      const beat =
        'Your fist connects with the creature\'s warped, unnatural form... the blow seems to have little true effect.';
      expect(
        detectCombatPurgatoryHard(beat, [beat], 'Press the attack')
      ).toBe(true);
      const state = {
        ...createInitialState(undefined, 'litrpg'),
        turn: 50,
        openingEstablishment: { pending: [], answers: {}, complete: true },
        activeEncounter: {
          name: 'Void-Touched Scavenger',
          hp: 8,
          maxHp: 16,
          phase: 'engaged',
        },
        log: [
          { id: '1', role: 'gm', content: beat, timestamp: 1 },
          { id: '2', role: 'player', content: 'Press the attack', timestamp: 2 },
        ],
      } as GameState;
      const gate = classifyBeatCommit(state, beat, 'Press the attack');
      expect(gate.accept).toBe(false);
      const repaired = repairRejectedBeat(state, beat, ['recycle-without-delta']);
      expect(repaired.prose).toMatch(/HP|press the attack|parley|skirmish/i);
      expect(repaired.prose).not.toMatch(/little true effect/i);
    });
  });

  describe('P0-D — stitch meta never commits + travel starve on hub treadmill', () => {
    it('flags and replaces Nothing-in-X-shifts meta + truncated vault hook', () => {
      const meta = 'Nothing in West Wall shifts until you leave, speak, or commit to a stake.';
      const truncated =
        'A way out still waits in West Wall — Vault under fire. Dust and ash falling through t.';
      expect(isStitchBankFingerprint(meta)).toBe(true);
      expect(isStitchBankFingerprint(truncated)).toBe(true);
      expect(scrubStitchBankLeaks(meta)).not.toMatch(/commit to a stake/i);
      expect(scrubStitchBankLeaks(truncated)).not.toMatch(/Vault under fire/i);

      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        openingEstablishment: { pending: [], answers: {}, complete: true },
        currentLocation: 'West Wall',
        campaignBibleId: 'summoned-pact',
        turn: 44,
        sceneFacts: { ...emptySceneFacts(44), present: [] },
      } as GameState;
      const move = codedSceneMove(state);
      expect(isStitchBankFingerprint(move)).toBe(false);
      expect(move).not.toMatch(/commit to a stake/i);
      expect(move).not.toMatch(/Vault under fire/i);
      expect(move).not.toMatch(/offers nothing new/i);
    });

    it('starves travel after hub walk/travel treadmill without live combat', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
        currentLocation: 'West Wall',
        campaignBibleId: 'summoned-pact',
        turn: 43,
        log: [
          { id: 'a', role: 'player', content: 'Travel toward Lowmarket', timestamp: 1 },
          { id: 'b', role: 'gm', content: 'You reach Lowmarket.', timestamp: 2 },
          { id: 'c', role: 'player', content: 'Travel toward West Wall', timestamp: 3 },
          { id: 'd', role: 'gm', content: 'You reach West Wall.', timestamp: 4 },
          { id: 'e', role: 'player', content: 'Walk away with consequence', timestamp: 5 },
          { id: 'f', role: 'gm', content: 'You linger.', timestamp: 6 },
        ],
        sceneFacts: { ...emptySceneFacts(43), present: ['Wall Sergeant'] },
      } as GameState;
      const compiled = compileChoices(
        state,
        [
          'Walk away with consequence',
          'Leave through the nearest exit',
          'Travel toward Lowmarket',
          'Walk the battlement',
        ],
        undefined,
        'Walk away with consequence'
      );
      expect(compiled.choices.filter((c) => /^Travel toward/i.test(c)).length).toBe(0);
      expect(
        compiled.choices.some((c) => /\b(ask|talk|press|quest|sergeant|stake|listen)\b/i.test(c))
      ).toBe(true);
    });
  });

  describe('P1 — unearned shard / leave inventory / crowd here', () => {
    it('blocks item-gain when player Check Status / walks away from offer', () => {
      const state = createInitialState(undefined, 'litrpg');
      const blocked = applyStructuralEvents(
        state,
        [{ type: 'item-gain', name: 'Tarnished Metal Shard', qty: 1 }],
        { playerInput: 'Check Status' }
      );
      expect(blocked.gainedItems).toHaveLength(0);
      expect(blocked.notes.some((n) => /unearned offer/i.test(n))).toBe(true);

      const taken = applyStructuralEvents(
        state,
        [{ type: 'item-gain', name: 'Tarnished Metal Shard', qty: 1 }],
        { playerInput: 'Take the offered shard' }
      );
      expect(taken.gainedItems.some((i) => /Shard/i.test(i.name))).toBe(true);
    });

    it('skips item-use fail on Leave exit pad', () => {
      const state = createInitialState(undefined, 'litrpg');
      const out = applyStructuralEvents(
        state,
        [{ type: 'item-use', name: 'nearest exit', qty: 1 }],
        { playerInput: 'Leave through the nearest exit' }
      );
      expect(out.notes.some((n) => /Skipped item-use on leave/i.test(n))).toBe(true);
      expect(out.notes.some((n) => /not found|not in inventory/i.test(n))).toBe(false);
    });

    it('scrubs phantom pocket shard + crowd here strength salad', () => {
      expect(
        scrubUnearnedPocketLoot(
          'You briefly touch the Tarnished Metal Shard in your pocket as you walk.',
          []
        )
      ).not.toMatch(/in your pocket/i);
      expect(
        scrubEntityMadLibs(
          'its form begins to writhe, the swirling malice within it the crowd here strength once more.'
        )
      ).not.toMatch(/crowd here strength/i);
    });
  });
});
