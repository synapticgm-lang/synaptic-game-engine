import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  initEncounterTerminal,
  tickEncounterTerminal,
  fleeAvailable,
  parleyAvailable,
} from './encounterTerminalFsm';
import { compileChoices } from './choiceCompiler';
import { enumerateLegalEdges } from './choiceEdge';
import { applyStatusFirewall, hasStatusLeak, scrubProseControlTags } from './statusFirewall';
import { rewriteInvalidReferences, validateEntityReferences, extractEntityContext } from './typedEntityValidator';
import { buildProtectedEntityNames } from './narrativeScrub';
import { runArcDirectorBeforeGm } from './arcDirector';
import { recordPyoaBranchChoice, isPyoaBranchLocked, exhaustDelayPads } from './pyoaBranchLedger';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { filterSystemLogForEngine } from './systemLog';
import { applyRenderFallback, buildSealedManifest } from './sealedManifest';

describe('playtest29a — Manus score boost terminal authority', () => {
  it('stamp is 2026-08-29a and Mid writer stays OFF', () => {
    expect(BUILD_STAMP).toBe('2026-08-29a');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('Encounter Terminal FSM clears after flee cap', () => {
    let state = createInitialState(undefined, 'litrpg');
    state.turn = 10;
    state.activeEncounter = initEncounterTerminal(
      {
        name: 'Pact-Hunter Skirmisher',
        level: 1,
        hp: 20,
        maxHp: 20,
        armorClass: 12,
        strength: 12,
        dexterity: 12,
        constitution: 12,
        xpReward: 30,
        goldReward: 5,
      },
      state,
      { forcedSpawnKey: 'Pact-Hunter Skirmisher' }
    );
    expect(fleeAvailable(state.activeEncounter)).toBe(true);

    let tick = tickEncounterTerminal(state, 'Try to flee');
    state = tick.state;
    expect(state.activeEncounter).toBeTruthy();
    expect(state.activeEncounter!.failedFleeCount).toBe(1);

    tick = tickEncounterTerminal(state, 'Flee again');
    state = tick.state;
    expect(state.activeEncounter).toBeNull();
    expect(tick.cleared?.outcome).toBe('escape');
    expect(state.arcDirector?.encounterClearedReceipts?.length).toBe(1);
  });

  it('Encounter Terminal FSM clears at max engaged turns', () => {
    let state = createInitialState(undefined, 'dnd');
    state.turn = 20;
    state.activeEncounter = initEncounterTerminal(
      {
        name: 'Keep Wraith',
        level: 2,
        hp: 40,
        maxHp: 40,
        armorClass: 14,
        strength: 14,
        dexterity: 12,
        constitution: 14,
        xpReward: 40,
        goldReward: 8,
        engagedTurnCount: 9,
        maxEngagedTurns: 10,
      },
      state
    );
    const tick = tickEncounterTerminal(state, 'Wait and watch');
    expect(tick.state.activeEncounter).toBeNull();
    expect(tick.forcedTerminal).toBe(true);
    expect(tick.cleared).toBeTruthy();
  });

  it('Combat pad lock drops travel / Earth junk while engaged', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.campaignBibleId = 'summoned-pact';
    state.turn = 12;
    state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
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
        goldReward: 5,
      },
      state
    );
    const edges = enumerateLegalEdges(state);
    expect(edges.every((e) => e.kind === 'combat' || e.kind === 'talk')).toBe(true);
    expect(edges.some((e) => /travel/i.test(e.label))).toBe(false);

    const { choices, notes } = compileChoices(state, [
      'Travel toward Lowmarket',
      'Browse Earth junk',
      'Inspect the wall',
      'Press the attack',
    ]);
    expect(choices.some((c) => /Travel toward/i.test(c))).toBe(false);
    expect(choices.some((c) => /Earth junk/i.test(c))).toBe(false);
    expect(choices.some((c) => /Press the attack/i.test(c))).toBe(true);
    expect(notes.some((n) => /Encounter lock/i.test(n))).toBe(true);
  });

  it('Parley removed after cap (LitRPG maxFailedParley=1)', () => {
    let state = createInitialState(undefined, 'litrpg');
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
        goldReward: 5,
      },
      state
    );
    expect(parleyAvailable(state.activeEncounter)).toBe(true);
    const tick = tickEncounterTerminal(state, 'Parley with the hunter');
    expect(tick.state.activeEncounter).toBeNull();
    expect(tick.cleared?.resolutionReason).toBe('parley_cap');
  });

  it('STATUS firewall strips GM_VOICE / PYOA / RenderFallback tags', () => {
    const lines = [
      'XP Gained: 25 (combat)',
      '[GM_VOICE_PROFILE] Cold Registrar',
      '[PYOA] fork hint',
      'Quest: Circle stage',
      '[RenderFallbackUsed: timeout]',
    ];
    const { lines: out, stripped } = applyStatusFirewall(lines);
    expect(stripped).toBeGreaterThan(0);
    expect(out.join('\n')).not.toMatch(/GM_VOICE|\[PYOA\]|RenderFallbackUsed/i);
    expect(hasStatusLeak('[GM_VOICE] x')).toBe(true);
    expect(scrubProseControlTags('Hello [RenderFallbackUsed: x] world')).not.toMatch(/RenderFallback/);

    const filtered = filterSystemLogForEngine(lines, 'litrpg');
    expect(filtered.join('\n')).not.toMatch(/GM_VOICE|RenderFallbackUsed/i);
  });

  it('Entity scrub allowlist preserves encounter / inventory / location names', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.activeEncounter = {
      name: 'Pact-Hunter Skirmisher',
      level: 1,
      hp: 10,
      maxHp: 10,
      armorClass: 12,
      strength: 12,
      dexterity: 12,
      constitution: 12,
      xpReward: 10,
      goldReward: 1,
    };
    state.currentLocation = 'Harbor Quay';
    state.inventory = [
      {
        id: 'millstone',
        name: 'Millstone Charter',
        type: 'misc',
        quantity: 1,
        description: 'quest',
      } as never,
    ];
    const protectedNames = buildProtectedEntityNames(state);
    expect([...protectedNames].some((n) => n.includes('pact-hunter'))).toBe(true);
    expect([...protectedNames].some((n) => n.includes('millstone'))).toBe(true);
    expect([...protectedNames].some((n) => n.includes('harbor'))).toBe(true);

    const prose =
      'The Pact-Hunter Skirmisher lunges. You clutch the Millstone Charter at Harbor Quay.';
    const ctx = extractEntityContext(state);
    const report = validateEntityReferences(prose, ctx);
    const rewritten = rewriteInvalidReferences(prose, ctx, report);
    expect(rewritten).toMatch(/Pact-Hunter/i);
    expect(rewritten).toMatch(/Millstone Charter/i);
    const mush = rewriteInvalidReferences(
      'You face the mark near a nearby building by the panel.',
      ctx,
      { themCount: 0, thisPlaceCount: 0, strangerCount: 0, brokenChoiceCount: 0, references: [], shouldRegenerate: false }
    );
    expect(mush.toLowerCase()).not.toMatch(/\bthe mark\b/);
    expect(mush.toLowerCase()).not.toMatch(/nearby building/);
    expect(mush.toLowerCase()).not.toMatch(/\bthe panel\b/);
  });

  it('Sealed fallback prose has no RenderFallbackUsed tag', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.campaignBibleId = 'summoned-pact';
    state.turn = 10;
    state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
    const arc = runArcDirectorBeforeGm(state, 'Ask who summoned me');
    const manifest = buildSealedManifest(arc.state, 'Ask who', arc);
    const fallback = applyRenderFallback(manifest, arc.state, 'timeout');
    expect(fallback.prose).not.toMatch(/RenderFallbackUsed/i);
    expect(fallback.prose).toMatch(/beat recovered|timeout/i);
  });

  it('PYOA charter use locks branch; delay pads exhaust to lock', () => {
    let state = createInitialState(undefined, 'pyoa');
    state.campaignBibleId = 'thornferry-road';
    state.turn = 8;
    state = recordPyoaBranchChoice(state, 'Use the Millstone Charter');
    expect(isPyoaBranchLocked(state)).toBe(true);

    state = createInitialState(undefined, 'pyoa');
    state.turn = 5;
    state = exhaustDelayPads(state, 'Buy time');
    state = exhaustDelayPads(state, 'Call for help');
    state = exhaustDelayPads(state, 'Buy time again');
    expect(isPyoaBranchLocked(state)).toBe(true);
  });

  it('ArcDirector tick clears long combat purgatory under flee spam', () => {
    let state = createInitialState(undefined, 'dnd');
    state.campaignBibleId = 'cursed-keep';
    state.turn = 17;
    state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
    state.activeEncounter = initEncounterTerminal(
      {
        name: 'Keep Wraith',
        level: 2,
        hp: 30,
        maxHp: 30,
        armorClass: 13,
        strength: 14,
        dexterity: 12,
        constitution: 14,
        xpReward: 40,
        goldReward: 5,
        failedFleeCount: 1,
        maxFailedFlee: 2,
      },
      state,
      { forcedSpawnKey: 'Keep Wraith' }
    );
    const arc = runArcDirectorBeforeGm(state, 'Try to flee from the wraith');
    expect(arc.state.activeEncounter).toBeNull();
    expect(arc.systemReceipts.some((r) => /Encounter cleared/i.test(r))).toBe(true);
  });
});
