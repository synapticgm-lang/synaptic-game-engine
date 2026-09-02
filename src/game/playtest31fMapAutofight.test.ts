/**
 * John 6d8e0b1f — atmosphere room pins + auto-fight last-kill / body lock.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { applyErrorRepairs, CURRENT_ERROR_REPAIR_REVISION } from './errorRepairWarden';
import { extractNamedPlaces, isAtmospherePlaceName, isGenericMapPlace } from './questPlay';
import { resolvePlayAreaMap, shortRoomLabel } from './mapEngine';
import { INTERIOR_MAP_BLUEPRINT } from './placeAuthority';
import { compileChoices } from './choiceCompiler';
import { formatSceneSnapshotForPrompt } from './situationPacket';
import { applyProseWarden } from './proseWarden';
import { buildAutoFightPrompt } from './combat';
import {
  commitAutoFightLedger,
  lastKillFromAutoFightLog,
  scrubBeastifiedHumanoid,
  scrubDeniedKill,
} from './combatAuthority';
import { initEncounterTerminal } from './encounterTerminalFsm';
import type { GameState, LogEntry } from './types';

const ALONE_RUIN = 'alone in a building with serious damage somewhere off the Valespire roads';
const ESSAY_ROOM = 'This Chamber Hangs Heavy';
const BEAST_FIGHT =
  'A blur of fur and teeth, the Pact-Hunter Skirmisher lunged, its claws raking across your chest. With a guttural roar you silenced the beast forever.';
const DENIED_LOOT =
  'You note no "kill" to loot, just the ambient silence.';

describe('playtest31f — map essay rooms + autofight last-kill', () => {
  it('stamp is 2026-08-31f / 30y and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-30y').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31f').toBe(true);
    expect(CURRENT_ERROR_REPAIR_REVISION).toBeGreaterThanOrEqual(7);
  });

  it('does not harvest “This Chamber Hangs Heavy” from atmosphere prose', () => {
    const prose =
      'The air in this chamber hangs heavy, thick with the scent of dust and the phantom echo of decay.';
    expect(isAtmospherePlaceName(ESSAY_ROOM)).toBe(true);
    expect(isGenericMapPlace(ESSAY_ROOM)).toBe(true);
    expect(extractNamedPlaces(prose).some((p) => /hangs heavy/i.test(p))).toBe(false);
    expect(shortRoomLabel(ESSAY_ROOM)).toBe('Chamber');
  });

  it('interior floor plan will not pin an atmosphere title', () => {
    const map = resolvePlayAreaMap(null, ALONE_RUIN, [ESSAY_ROOM], undefined, 'john-31f');
    expect(map?.blueprintId).toBe(INTERIOR_MAP_BLUEPRINT);
    const names = (map?.nodes ?? []).map((n) => n.name);
    expect(names.some((n) => /hangs heavy/i.test(n))).toBe(false);
  });

  it('choice pad drops doorway-to-essay-title', () => {
    const state = createInitialState('The Summoned Pact', 'litrpg');
    const compiled = compileChoices(state, [
      'Approach the doorway to This Chamber Hangs Heavy',
      'Search the ruin carefully',
      'Wait and watch',
    ]);
    expect(compiled.choices.join(' ')).not.toMatch(/hangs heavy/i);
  });

  it('combat pad drops look-around while a skirmisher is live', () => {
    const state = createInitialState('The Summoned Pact', 'litrpg');
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
    const compiled = compileChoices(state, [
      'Look around the immediate area again for anything else',
      'Whats going on where am I',
      'Try to flee',
      'Parley',
    ]);
    expect(compiled.choices.join(' ')).not.toMatch(/look around/i);
    expect(compiled.choices.join(' ')).not.toMatch(/whats going on/i);
    expect(compiled.choices.some((c) => /flee|parley|attack/i.test(c))).toBe(true);
  });

  it('auto-fight ledger writes lastKill so SNAPSHOT cannot deny the corpse', () => {
    let state = createInitialState('The Summoned Pact', 'litrpg');
    state.turn = 10;
    state.currentLocation = ALONE_RUIN;
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
    state = commitAutoFightLedger(state, { victory: true, finalPlayerHp: 9 });
    expect(state.activeEncounter).toBeNull();
    expect(state.sceneFacts?.lastKill?.name).toMatch(/Pact-Hunter/i);
    expect(state.sceneFacts?.lastKill?.remains).toBe(true);
    expect(state.arcDirector?.encounterClearedReceipts?.length).toBeGreaterThan(0);
    const snap = formatSceneSnapshotForPrompt(state);
    expect(snap).toMatch(/Last kill: Pact-Hunter/i);
    expect(snap).toMatch(/Do not deny the kill/i);
  });

  it('rewrites beast body and denied-loot when the foe is a hunter', () => {
    const body = scrubBeastifiedHumanoid(BEAST_FIGHT, 'Pact-Hunter Skirmisher');
    expect(body).not.toMatch(/fur and teeth/i);
    expect(body).not.toMatch(/\bthe beast\b/i);
    expect(body).toMatch(/Pact-Hunter|steel|blade|strike/i);

    const denied = scrubDeniedKill(DENIED_LOOT, {
      name: 'Pact-Hunter Skirmisher',
      outcome: 'victory',
      turn: 10,
      remains: true,
    });
    expect(denied).not.toMatch(/no ["“]?kill["”]? to loot/i);
    expect(denied).toMatch(/Pact-Hunter|loot is legal|still on the floor/i);

    const warded = applyProseWarden(BEAST_FIGHT + ' ' + DENIED_LOOT, {
      enemyName: 'Pact-Hunter Skirmisher',
      lastKill: {
        name: 'Pact-Hunter Skirmisher',
        outcome: 'victory',
        turn: 10,
        remains: true,
      },
      recentlyClearedEncounter: true,
    });
    expect(warded).not.toMatch(/fur and teeth/i);
    expect(warded).not.toMatch(/no ["“]?kill["”]? to loot/i);
  });

  it('auto-fight prompt locks humanoid body type', () => {
    const state = createInitialState('The Summoned Pact', 'litrpg');
    const prompt = buildAutoFightPrompt(
      state,
      {
        name: 'Pact-Hunter Skirmisher',
        level: 1,
        hp: 16,
        maxHp: 16,
        attack: 6,
        defense: 2,
        armorClass: 12,
        xpReward: 30,
        goldReward: 7,
      },
      {
        victory: true,
        rounds: 3,
        damageDealt: 18,
        damageReceived: 15,
        finalPlayerHp: 9,
        finalPlayerMp: 12,
        finalEnemyHp: 0,
        xpGained: 30,
        goldGained: 7,
        loot: [],
        roundsLog: [],
        summary: 'won',
      }
    );
    expect(prompt).toMatch(/BODY AUTHORITY/i);
    expect(prompt).toMatch(/humanoid/i);
    expect(prompt).toMatch(/never fur/i);
  });

  it('Continue repair rev 7 rewrites atmosphere pins and backfills lastKill', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const map = resolvePlayAreaMap(null, ALONE_RUIN, ['Antechamber'], undefined, 'repair-31f')!;
    const dirty = {
      ...map,
      nodes: map.nodes.map((n, i) => (i === 1 ? { ...n, name: ESSAY_ROOM } : n)),
    };
    const log: LogEntry[] = [
      {
        id: 'p',
        turn: 10,
        role: 'player',
        content: '[Auto-Fight] Engaging Pact-Hunter Skirmisher...',
        timestamp: 1,
      },
      {
        id: 'g',
        turn: 10,
        role: 'gm',
        content: 'A fight.',
        timestamp: 2,
        systemLog: ['Auto-Resolve Combat: VICTORY'],
      },
    ];
    const dirtyState = {
      ...base,
      errorRepairRevision: 6,
      activeDungeon: dirty,
      log,
    } as GameState;
    const repaired = applyErrorRepairs(dirtyState);
    expect(repaired.dirty).toBe(true);
    expect(repaired.state.activeDungeon?.nodes.some((n) => /hangs heavy/i.test(n.name))).toBe(false);
    expect(repaired.state.sceneFacts?.lastKill?.name).toMatch(/Pact-Hunter/i);
    expect(lastKillFromAutoFightLog(dirtyState)?.name).toMatch(/Pact-Hunter/i);
  });
});
