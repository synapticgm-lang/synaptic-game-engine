import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  initEncounterTerminal,
  tickEncounterTerminal,
  isEncounterOnCooldown,
  ENCOUNTER_REENGAGE_COOLDOWN,
} from './encounterTerminalFsm';
import { eventsToEncounterUpdate } from './parser';
import { runArcDirectorBeforeGm, formatArcStatusReceipts } from './arcDirector';
import { compileChoices } from './choiceCompiler';
import { applyStatusFirewall, hasStatusLeak } from './statusFirewall';
import { scrubInventedLocationChange } from './proseWarden';
import { detectSocialMilestone, applySocialMilestone } from './socialMilestoneLedger';
import { hasDurableDeltaByT12, forceFreeT12DurableDelta } from './freeT12Hook';
import { pickStatusVoiceLine } from './voiceCadenceSystem';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { checkReceiptLivenessGates } from './evalHarness';
import type { GameEvent } from './types';

describe('playtest29b — optimise after terminal authority', () => {
  it('stamp is 2026-08-29c and Mid writer stays OFF', () => {
    expect(BUILD_STAMP >= '2026-08-29b').toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('combat HP ledger: GM enemy-appear cannot heal live foe', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.turn = 12;
    state.activeEncounter = initEncounterTerminal(
      {
        name: 'Pact-Hunter Skirmisher',
        level: 1,
        hp: 10,
        maxHp: 16,
        armorClass: 12,
        strength: 12,
        dexterity: 12,
        constitution: 12,
        xpReward: 30,
        goldReward: 5,
        encounterId: 'enc-test',
        engagedTurnCount: 3,
        failedFleeCount: 1,
      },
      state,
      { forcedSpawnKey: 'Pact-Hunter Skirmisher' }
    );
    const events: GameEvent[] = [
      {
        type: 'enemy-appear',
        enemyName: 'Pact-Hunter Skirmisher',
        enemyHp: 16,
        enemyMaxHp: 16,
        enemyLevel: 1,
        enemyAc: 12,
        enemyXp: 30,
        enemyGold: 5,
      },
    ];
    const next = eventsToEncounterUpdate(events, state.activeEncounter);
    expect(next?.hp).toBe(10);
    expect(next?.maxHp).toBe(16);
    expect(next?.encounterId).toBe('enc-test');
    expect(next?.failedFleeCount).toBe(1);
    expect(next?.engagedTurnCount).toBe(3);
  });

  it('encounter clear awards XP + STATUS + re-engage cooldown', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.turn = 15;
    state.activeEncounter = initEncounterTerminal(
      {
        name: 'Pact-Hunter Skirmisher',
        level: 1,
        hp: 4,
        maxHp: 16,
        armorClass: 12,
        strength: 12,
        dexterity: 12,
        constitution: 12,
        xpReward: 40,
        goldReward: 5,
        engagedTurnCount: 7,
        maxEngagedTurns: 8,
      },
      state,
      { forcedSpawnKey: 'Pact-Hunter Skirmisher' }
    );
    const tick = tickEncounterTerminal(state, 'Press the attack');
    expect(tick.cleared?.outcome).toBe('victory');
    expect(tick.xpAward?.amount).toBe(40);
    expect(tick.receipts.some((r) => /Encounter cleared/i.test(r))).toBe(true);
    expect(tick.receipts.some((r) => /Arc XP: \+40/i.test(r))).toBe(true);
    expect(tick.state.arcDirector?.lastEncounterClearedTurn).toBe(15);
    expect(isEncounterOnCooldown(tick.state, 'Pact-Hunter Skirmisher')).toBe(true);
    expect(tick.state.arcDirector?.encounterCooldownUntil?.['Pact-Hunter Skirmisher']).toBe(
      15 + ENCOUNTER_REENGAGE_COOLDOWN
    );

    const arc = runArcDirectorBeforeGm(
      { ...tick.state, turn: 16, openingEstablishment: { ...tick.state.openingEstablishment!, complete: true } },
      'Look around'
    );
    // Should not immediately re-spawn same skirmish while cooling down
    expect(arc.state.activeEncounter).toBeNull();
    const status = formatArcStatusReceipts({
      ...arc,
      systemReceipts: tick.receipts,
      xpAwards: tick.xpAward ? [tick.xpAward] : [],
    });
    expect(status.some((l) => /Encounter cleared/i.test(l))).toBe(true);
  });

  it('Free T12 durable delta is enforced in ArcDirector (not eval-only)', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.campaignBibleId = 'summoned-pact';
    state.turn = 12;
    state.openingEstablishment = { pending: [], answers: {}, complete: true };
    state.quests = [
      {
        id: 'sp-quest-1',
        name: "Circle's Price",
        description: 'Find why you were summoned',
        type: 'main',
        status: 'active',
        revealed: true,
        objectives: [
          { id: 'o1', description: 'Get bearings', completed: false },
          { id: 'o2', description: 'Hear the reason', completed: false },
        ],
      },
    ];
    expect(hasDurableDeltaByT12(state)).toBe(false);
    const forced = forceFreeT12DurableDelta(state, new Set());
    expect(forced).toBeTruthy();

    const arc = runArcDirectorBeforeGm(state, 'Ask what they want');
    expect(arc.beatCommitted || arc.mandate.includes('FREE T12') || hasDurableDeltaByT12(arc.state)).toBe(
      true
    );
    const gates = checkReceiptLivenessGates(arc.state);
    // After force, either delta landed or freeT12Forced is set for next commit path
    expect(arc.state.arcDirector?.freeT12Forced === true || gates.freeT12DurableDelta === true).toBe(true);
  });

  it('voice cadence emits STATUS line for Cold Registrar / Dry Wit', () => {
    const lit = createInitialState(undefined, 'litrpg');
    lit.systemPersonality = 'cold-registrar';
    lit.gmPersonality = 'cold-registrar';
    lit.turn = 8;
    const line = pickStatusVoiceLine(lit, 'xp_gain');
    expect(line?.line).toBeTruthy();
    expect(line!.line.length).toBeGreaterThan(5);

    const dnd = createInitialState(undefined, 'dnd');
    dnd.gmPersonality = 'dry-wit';
    dnd.turn = 8;
    const dry = pickStatusVoiceLine(dnd, 'hub_change');
    expect(dry?.line).toMatch(/scenic|hope|safer|notes|progress|happened/i);
  });

  it('spatial continuity: exitNarrated skips outdoor scrub; outdoor blocks snap-back', () => {
    const indoorSnap = scrubInventedLocationChange(
      'You step outside into the street.',
      true,
      true,
      false
    );
    expect(indoorSnap).toMatch(/move forward/i);

    const exitOk = scrubInventedLocationChange(
      'You step outside into the street.',
      true,
      true,
      true
    );
    expect(exitOk).toMatch(/step outside/i);

    const snapBack = scrubInventedLocationChange(
      'You step inside the hall.',
      false,
      true,
      false
    );
    expect(snapBack).toMatch(/continue/i);
  });

  it('hard streak interrupt drops wait/walk_away/inspect pads', () => {
    const state = createInitialState(undefined, 'rpg');
    state.turn = 40;
    state.log = [
      { role: 'player', content: 'Walk away', timestamp: 1 },
      { role: 'gm', content: 'You leave.', timestamp: 2 },
      { role: 'player', content: 'Walk away', timestamp: 3 },
      { role: 'gm', content: 'Again.', timestamp: 4 },
      { role: 'player', content: 'Walk away', timestamp: 5 },
      { role: 'gm', content: 'Still.', timestamp: 6 },
      { role: 'player', content: 'Walk away', timestamp: 7 },
      { role: 'gm', content: 'Yes.', timestamp: 8 },
      { role: 'player', content: 'Walk away', timestamp: 9 },
    ];
    const compiled = compileChoices(state, [
      'Walk away',
      'Wait and watch',
      'Inspect the desk',
      'Ask a direct question',
      'Press for leverage',
    ]);
    expect(compiled.notes.some((n) => /streak/i.test(n))).toBe(true);
    expect(compiled.choices.some((c) => /^Walk away$/i.test(c))).toBe(false);
    expect(compiled.choices.some((c) => /^Wait and watch$/i.test(c))).toBe(false);
    expect(compiled.choices.some((c) => /^Inspect the desk$/i.test(c))).toBe(false);
  });

  it('social talk XP is once-per-node across talk/listen kinds', () => {
    let state = createInitialState(undefined, 'litrpg');
    state.currentLocation = 'Harbor Quay';
    const first = detectSocialMilestone('Talk to the registrar', state);
    expect(first).toBeTruthy();
    state = applySocialMilestone(state, first!);
    const second = detectSocialMilestone('Listen to the registrar', state);
    expect(second).toBeNull();
  });

  it('STATUS firewall strips residual AUTHORITY / ARC DIRECTOR / GM_VOICE leaks', () => {
    const out = applyStatusFirewall([
      'GM_VOICE_PROFILE Cold Registrar',
      'AUTHORITY VOICE: seal gist here',
      '--- ARC DIRECTOR (AUTHORITY — COMMITTED BEFORE PROSE) ---',
      'XP Gained: 25 (arc)',
    ]);
    expect(out.lines.join('\n')).not.toMatch(/GM_VOICE|AUTHORITY VOICE|ARC DIRECTOR/i);
    expect(out.lines.some((l) => /XP Gained/i.test(l))).toBe(true);
    expect(hasStatusLeak('AUTHORITY VOICE: x')).toBe(true);
  });
});
