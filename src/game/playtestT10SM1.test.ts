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
import { ALLOW_LISTS } from './singleWriterAllow';
import { scanWriters, writerFilesFor } from './singleWriterScan';
import { withHouseRules } from './rules/houseRules';
import { createDefaultSettings } from './defaults';

const rng = () => 0.5;

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

  it('commitDeath srd is the only path that stamps deathSaves.dead on the PC', () => {
    let s = createInitialState('t', 'dnd');
    s = withHouseRules(
      { ...s, character: { ...s.character, hp: 0 } },
      { ...createDefaultSettings(), ttDeathRule: 'srd' }
    );
    const out = commitDeath(s, 'danger', rng);
    expect(out.dead).toBe(true);
    expect(isDead(out.state)).toBe(true);
    expect(writerFilesFor(scanWriters(['deathSaves']), 'deathSaves')).toEqual([
      ...ALLOW_LISTS.deathSaves,
    ]);
    expect(writerFilesFor(scanWriters(['dead']), 'dead')).toEqual([]);
    expect(writerFilesFor(scanWriters(['playPhase']), 'playPhase')).toEqual([
      ...ALLOW_LISTS.playPhase,
    ]);
  });

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
