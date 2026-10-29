/**
 * T10SM1 — behaviour pins: death has one writer; (Stage 2) seat/unseat keep memory+scene agreed.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  applyDeathSaveResult,
  clearDeathSaves,
  commitDeath,
  isDead,
  reviveAt,
  runEnded,
  startDying,
} from './rules/death';
import { rollDeathSave } from './rules/roundCombat';
import { setPlayPhase } from './playPhase';
import { roadDeathBookProse } from './roadDeath';
import { ALLOW_LISTS, PRESENCE_FIELDS } from './singleWriterAllow';
import { scanWriters, writerFilesFor } from './singleWriterScan';
import { withHouseRules } from './rules/houseRules';
import { createDefaultSettings } from './defaults';
import { exitNpc, seat, unseat } from './presentAuthority';
import type { NpcMemory } from './types';

const rng = () => 0.5;

function withMemory(state: ReturnType<typeof createInitialState>, name: string): ReturnType<typeof createInitialState> {
  const row: NpcMemory = {
    npcId: name.toLowerCase().replace(/\s+/g, '-'),
    npcName: name,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 0,
    present: false,
  };
  return { ...state, npcMemories: [...(state.npcMemories ?? []), row] };
}

describe('playtestT10SM1 death one writer', () => {
  it('isDead / runEnded selectors and mutators agree', () => {
    let s = createInitialState('t', 'dnd');
    s = withHouseRules(s, { ...createDefaultSettings(), ttDeathRule: 'srd' });
    expect(isDead(s)).toBe(false);
    expect(runEnded(s)).toBe(false);
    s = startDying(s);
    expect(s.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(isDead(s)).toBe(false);
    const roll = rollDeathSave(s.deathSaves!, () => 0.0); // fail path varies; force via apply
    s = applyDeathSaveResult(s, { successes: 0, failures: 3, dead: true });
    expect(isDead(s)).toBe(true);
    void roll;
    s = clearDeathSaves(s);
    expect(isDead(s)).toBe(false);
    s = reviveAt(startDying(s), 1, []);
    expect(s.deathSaves).toBeNull();
    expect(s.character.hp).toBe(1);
    const ended = setPlayPhase(s, 'ended');
    expect(runEnded(ended)).toBe(true);
    expect(isDead(ended)).toBe(false);
  });

  it(
    'commitDeath srd is the only path that stamps deathSaves.dead on the PC',
    () => {
      let s = createInitialState('t', 'dnd');
      s = withHouseRules(
        { ...s, character: { ...s.character, hp: 0 } },
        { ...createDefaultSettings(), ttDeathRule: 'srd' }
      );
      const out = commitDeath(s, 'danger', rng);
      expect(out.dead).toBe(true);
      expect(isDead(out.state)).toBe(true);
      // One scan for all death fields (process cache; warm under ~50ms).
      const hits = scanWriters(['deathSaves', 'dead', 'playPhase']);
      expect(writerFilesFor(hits, 'deathSaves')).toEqual([...ALLOW_LISTS.deathSaves]);
      expect(writerFilesFor(hits, 'dead')).toEqual([]);
      expect(writerFilesFor(hits, 'playPhase')).toEqual([...ALLOW_LISTS.playPhase]);
    },
    60_000
  );

  it('roadDeathBookProse is the one death-page producer', () => {
    const live = createInitialState('t', 'dnd');
    expect(roadDeathBookProse(live)).toBeNull();
    const dead = {
      ...live,
      deathSaves: { successes: 0, failures: 3, dead: true as const },
      travelBeat: { turn: live.turn ?? 0, facts: ['You are dead.'] },
    };
    const page = roadDeathBookProse(dead);
    expect(page).toMatch(/You are dead\./);
  });
});

describe('playtestT10SM1 presence one owner', () => {
  it(
    'presence fields write only in presentAuthority',
    () => {
      const hits = scanWriters([...PRESENCE_FIELDS]);
      for (const field of PRESENCE_FIELDS) {
        expect(writerFilesFor(hits, field)).toEqual([...ALLOW_LISTS[field]]);
      }
    },
    60_000
  );

  it('seat / unseat / exitNpc keep memory and scene in agreement', () => {
    let s = withMemory(createInitialState('t', 'dnd'), 'Vessa');
    s = seat(s, 'Vessa');
    expect(s.sceneFacts?.present).toContain('Vessa');
    expect(s.npcMemories?.find((m) => m.npcName === 'Vessa')?.present).toBe(true);

    s = unseat(s, 'Vessa', 'engine');
    expect(s.sceneFacts?.present ?? []).not.toContain('Vessa');
    expect(s.npcMemories?.find((m) => m.npcName === 'Vessa')?.present).toBe(false);

    s = seat(s, 'Vessa');
    s = exitNpc(s, 'Vessa', 'quest-accepted');
    const mem = s.npcMemories?.find((m) => m.npcName === 'Vessa');
    expect(s.sceneFacts?.present ?? []).not.toContain('Vessa');
    expect(mem?.present).toBe(false);
    expect(mem?.shouldExit).toBe(true);
    expect(mem?.exitReason).toBe('quest-accepted');
  });
});
