import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, onTestFinished } from 'vitest';
import { createHashRng, diceRng, hashSeed, hashUnit, keyedRng, mulberry32, pinDice, turnRng } from './seededRng';
import { mulberry32 as fateMulberry } from './fatePick';
import { exactTypedName, fuzzyTypedName, fuzzyTypedPhrase, matchTypedName } from './typedNameMatch';
import { parseGmTurnResponse, parseSkillEntries, saveFileProblem } from './schemas';
import { CREDIT_SECTIONS } from '@/legal/credits';

function oldFnv(raw: string): number {
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

describe('tt-library: one seed home', () => {
  it('hashSeed is the FNV-1a every old copy used', () => {
    for (const s of ['', 'seed', 'summoned-pact|42', 'Silas Vane:7']) expect(hashSeed(s)).toBe(oldFnv(s));
    expect(hashUnit('x')).toBe(oldFnv('x') / 0x100000000);
  });

  it('turn rolls repeat for the same save, turn and salt and differ by salt', () => {
    pinDice(null);
    onTestFinished(() => pinDice(() => Math.random()));
    const state = { seed: 'abc', turn: 4 };
    const a = turnRng(state, 'fight', 'Goblin');
    const b = turnRng(state, 'fight', 'Goblin');
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(turnRng(state, 'flee')()).not.toBe(turnRng(state, 'parley')());
    expect(turnRng({ ...state, turn: 5 }, 'fight', 'Goblin')()).not.toBe(turnRng(state, 'fight', 'Goblin')());
    expect(diceRng('level-up', 'Jax', 2)()).toBe(diceRng('level-up', 'Jax', 2)());
  });

  it('a pinned source drives every dice roll', () => {
    onTestFinished(() => pinDice(() => Math.random()));
    pinDice(() => 0.5);
    expect(turnRng({ seed: 'abc', turn: 1 }, 'fight')()).toBe(0.5);
    expect(diceRng('loot')()).toBe(0.5);
  });

  it('keyed, hash and mulberry rngs stay in [0, 1) and fatePick shares mulberry32', () => {
    for (const r of [keyedRng('k'), createHashRng('a', 1), mulberry32(9)]) {
      for (let i = 0; i < 50; i++) {
        const v = r();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    }
    expect(fateMulberry).toBe(mulberry32);
  });
});

describe('tt-library: typed names (fuse.js)', () => {
  const people = ['Silas Vane', 'Wren Holt', 'Tala'];

  it('forgives a typo in a typed name', () => {
    expect(fuzzyTypedName('ask silus about the key', people)).toBe('Silas Vane');
    expect(matchTypedName('talk to Wren', people)).toBe('Wren Holt');
    expect(fuzzyTypedPhrase('Lowmarkt', ['Lowmarket', 'West Wall'])).toBe('Lowmarket');
    expect(fuzzyTypedPhrase('rusty dager', ['Rusty Dagger'])).toBe('Rusty Dagger');
  });

  it('never turns short words, chip verbs or a different item into a match', () => {
    expect(matchTypedName('a', people)).toBeNull();
    expect(matchTypedName('i look around', people)).toBeNull();
    expect(fuzzyTypedName('talk to the guard', people)).toBeNull();
    expect(fuzzyTypedPhrase('rusty sword', ['Rusty Dagger'])).toBeNull();
    expect(exactTypedName('ask silus', people)).toBeNull();
  });
});

describe('tt-library: zod at the edges', () => {
  it('gm-turn reply keeps good fields and drops a bad one alone', () => {
    expect(parseGmTurnResponse({ text: 'Rain.', rawIssue: 'empty' })).toMatchObject({ text: 'Rain.', rawIssue: 'empty' });
    expect(parseGmTurnResponse({ text: 'Rain.', error: { code: 1 } })).toMatchObject({ text: 'Rain.', error: undefined });
    expect(parseGmTurnResponse(null)).toEqual({});
    expect(parseGmTurnResponse('nope')).toEqual({});
  });

  it('save file problems keep the player wording', () => {
    expect(saveFileProblem(null)).toBe('Invalid save file: not an object');
    expect(saveFileProblem({ log: [] })).toBe('Invalid save file: missing character data');
    expect(saveFileProblem({ character: {} })).toBe('Invalid save file: missing narrative log');
    expect(saveFileProblem({ character: { name: 'Jax' }, log: [], extra: 1 })).toBeNull();
  });

  it('every skills library entry matches the v3 schema', () => {
    const dir = resolve(__dirname, '../../docs/library/skills/data');
    const all = [1, 2, 3, 4, 5].flatMap((n) =>
      parseSkillEntries(JSON.parse(readFileSync(resolve(dir, `batch${n}-entries.json`), 'utf8'))),
    );
    expect(all.length).toBe(146);
    expect(new Set(all.map((e) => e.identity.id)).size).toBe(all.length);
  });
});

describe('tt-library: credits', () => {
  it('credits Fuse.js and Zod', () => {
    const libs = CREDIT_SECTIONS.find((s) => s.id === 'libraries');
    const text = JSON.stringify(libs);
    expect(text).toContain('Fuse.js');
    expect(text).toContain('Apache-2.0');
    expect(text).toContain('Zod');
  });
});
