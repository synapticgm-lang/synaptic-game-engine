/**
 * T10F — player's quoted words stay whole (apostrophe ≠ closer), and NPC-attributed
 * copies of that quote are flagged (reject, not rewrite).
 */
import { describe, expect, it } from 'vitest';
import {
  extractPlayerQuotedSay,
  npcHoldsPcQuote,
  parsePlayerSteps,
  sheetContextFromState,
} from './intentParser';
import { buildClauseWriterFact, pcSaysExactlyCue } from './writerCueLines';
import { checkPlayCrimes } from './turnCheck';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { plainLineFactProblem } from './tokenProse';

const CASES: { line: string; say: string }[] = [
  {
    line: "I call out, 'Whoever is following me, show yourself or I'll skip this off your head.'",
    say: "Whoever is following me, show yourself or I'll skip this off your head.",
  },
  {
    line: "I tip an imaginary hat to the splintered coffins and say, 'Gentlemen, up and at 'em, the priest has questions for you.'",
    say: "Gentlemen, up and at 'em, the priest has questions for you.",
  },
  {
    line: "I say, 'Call me Jax, and tell the Lord of Padlocks I came to talk.'",
    say: 'Call me Jax, and tell the Lord of Padlocks I came to talk.',
  },
  {
    line: "I slide the crew token across the table to Vessa and say, 'Nobody sent me but you, with that pouch. Now tell me who pays Yara.'",
    say: 'Nobody sent me but you, with that pouch. Now tell me who pays Yara.',
  },
  {
    line: "I say to the empty street, 'Best show in Valespire, no ticket needed.'",
    say: 'Best show in Valespire, no ticket needed.',
  },
];

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState('t10f', 'litrpg') as GameState;
  return {
    ...s,
    ...over,
    character: { ...s.character, name: 'Jax', ...(over.character ?? {}) },
    openingEstablishment: { complete: true, sceneWritten: true, ...(over.openingEstablishment as object) },
  } as GameState;
}

describe('T10F quoted speech spans', () => {
  for (const { line, say } of CASES) {
    it(`parse + cue keep full quote: ${say.slice(0, 28)}…`, () => {
      expect(extractPlayerQuotedSay(line)).toBe(say);
      const read = parsePlayerSteps(line, sheetContextFromState(base()));
      const stepSay = read.steps.map((st) => st.say).find((s) => s && s.includes(say.slice(0, 12)));
      expect(stepSay).toBe(say);
      const cue = buildClauseWriterFact(line, true, { said: stepSay ?? '' });
      expect(cue).toContain(pcSaysExactlyCue(say));
    });
  }

  it('flags NPC-attributed copies of the PC quote (reject, not repair)', () => {
    const line =
      "I tip an imaginary hat to the splintered coffins and say, 'Gentlemen, up and at 'em, the priest has questions for you.'";
    const stolen =
      'Father Aldous said, "Gentlemen, up." Mayor Helga Brask said, "Em, the priest has questions for you."';
    expect(npcHoldsPcQuote(stolen, line, 'Jax')).toBe(true);
    const s = base({ engineMode: 'dnd' });
    const crimes = checkPlayCrimes(s, s, line, stolen);
    expect(crimes.p0.some((f) => f.kind === 'plays-player' && /NPC speaks the player's quoted words/i.test(f.detail))).toBe(
      true,
    );
    expect(
      plainLineFactProblem(stolen, s, { playerAction: line } as never),
    ).toBe("the player's quoted words in an NPC's mouth");
  });

  it('does not flag an NPC reply that is not the PC quote', () => {
    const line = "I say, 'Call me Jax, and tell the Lord of Padlocks I came to talk.'";
    const prose = 'Vessa said, "Sit down and keep your voice low."';
    expect(npcHoldsPcQuote(prose, line, 'Jax')).toBe(false);
  });
});
