/**
 * Order S part 1: one death point; a self-aimed act never ends the character in any mode or table rule.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { commitDeath } from './rules/death';
import { aimsAtSelf, parsePlayerIntent } from './intentParser';
import { resolveEngineFight } from './engineFight';
import { formatArcStatusReceipts, runArcDirectorBeforeGm } from './arcDirector';
import { plainLineFactProblem } from './tokenProse';
import { withHouseRules } from './rules/houseRules';
import { createDefaultSettings } from './defaults';
import type { EngineMode, GameState, HouseRules } from './types';
import { ALLOW_LISTS } from './singleWriterAllow';
import { scanWriters, writerFilesFor } from './singleWriterScan';

const rng = () => 0.5;
const at = (mode: EngineMode, hp = 1, rule: HouseRules['deathRule'] = 'srd'): GameState => {
  const s = createInitialState('t', mode);
  return withHouseRules({ ...s, gold: 40, character: { ...s.character, hp } }, { ...createDefaultSettings(), ttDeathRule: rule });
};

const PARAPHRASES = [
  'I turn my sword on myself',
  'I walk into the fire and let it take me',
  'I open my wrists',
  'drink the vial so it all ends',
  'I stab myself in the heart',
];

describe('selfKillGuard', () => {
  it('reads the self-aimed act from verb and object, not from care acts', () => {
    for (const p of PARAPHRASES) expect(parsePlayerIntent(p).targetsSelf, p).toBe(true);
    for (const p of ['cast Cure Wounds on myself', 'I steady myself', 'I cut myself free of the net', 'I point at myself and give my name', 'I attack the bandit']) {
      expect(parsePlayerIntent(p).targetsSelf, p).toBeFalsy();
    }
  });

  for (const mode of ['dnd', 'litrpg', 'rpg'] as EngineMode[]) {
    for (const rule of ['srd', 'revive', 'mercy'] as HouseRules['deathRule'][]) {
      it(`${mode} / ${rule}: every paraphrase at 1 HP ends at HP ≥ 1, not dead, no coin lost`, () => {
        for (const p of PARAPHRASES) {
          const r = resolveEngineFight(at(mode, 1, rule), p)!;
          expect(r, p).toBeTruthy();
          expect(r.state.deathSaves?.dead, p).toBeFalsy();
          expect(r.state.character.hp, p).toBeGreaterThanOrEqual(1);
          expect(r.state.gold, p).toBe(40);
          expect(r.facts, p).not.toMatch(/sword|fire|wrist|vial|heart|you are dead/i);
        }
      });
    }
  }

  it('LitRPG uses the System lifeline; Story RPG the fate charm; tabletop is knocked out (no trait)', () => {
    expect(createInitialState('t', 'litrpg').character.lifeline).toBeTruthy();
    expect(createInitialState('t', 'rpg').character.lifeline).toBeTruthy();
    expect(createInitialState('t', 'dnd').character.lifeline).toBeUndefined();
    expect(commitDeath(at('litrpg'), 'self', rng).receipts[0]).toBe('Lifeline: engaged — self-termination denied. HP set to 1.');
    expect(commitDeath(at('rpg'), 'self', rng).receipts[0]).toMatch(/^Lifeline: /);
    expect(commitDeath(at('dnd'), 'self', rng).receipts[0]).toMatch(/^Death rule \(self\): knocked out/);
    for (const mode of ['litrpg', 'rpg', 'dnd'] as EngineMode[]) {
      const arc = runArcDirectorBeforeGm(at(mode), 'I turn my sword on myself');
      expect(formatArcStatusReceipts(arc).join('\n'), mode).toMatch(/Lifeline: |Death rule \(self\)/);
    }
  });

  it('a danger death under srd still dies; under mercy it wakes at 1 HP', () => {
    const srd = commitDeath(at('dnd', 0, 'srd'), 'danger', rng);
    expect(srd.dead).toBe(true);
    expect(srd.state.deathSaves?.dead).toBe(true);
    const mercy = commitDeath(at('dnd', 0, 'mercy'), 'danger', rng);
    expect(mercy.dead).toBe(false);
    expect(mercy.state.character.hp).toBe(1);
  });

  it('the writer gate drops a line that describes a self-harm method', () => {
    const s = at('dnd');
    expect(plainLineFactProblem('You turn the blade on yourself.', s)).toMatch(/self-harm method/);
    expect(aimsAtSelf('You open your wrists over the basin.')).toBe(true);
    expect(aimsAtSelf('You stopped short, and the world went dark.')).toBe(false);
  });

  it('nothing outside rules/death.ts writes dead: true', () => {
    // T10SM1: AST (not text) so `state.dead = true` counts. Allow-list ratchets toward death.ts only.
    const hits = scanWriters(['dead']);
    const actual = writerFilesFor(hits, 'dead');
    const allowed = [...ALLOW_LISTS.dead].sort();
    expect(actual, hits.map((h) => `${h.file}:${h.line}`).join('\n')).toEqual(allowed);
  });
});
