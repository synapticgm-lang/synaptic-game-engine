/**
 * Order S part 2 (R8-R16, wellbeing guide §9) — seeded inputs injected into the real cursed-keep ds151 state before
 * T10. The game rule (commitDeath 'self') and the player's wellbeing gauge run side by side and never trigger each
 * other; the card is the only output, and the gauge is times on the device, never text, never in the prompt.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { runArcDirectorBeforeGm } from '../../game/arcDirector';
import { mediatePlayerInput } from '../../game/inputMediation';
import { gaugeCheckIn, readWellbeing, type WellbeingGauge } from '../../game/wellbeing';
import { plainLineFactProblem } from '../../game/tokenProse';
import { buildMasterPrompt } from '../../game/masterPrompt';
import { createDefaultSettings } from '../../game/defaults';
import { turnProvenance } from '../../game/fateAutoplay';
import { beginTabletopCreation, stepTabletopCreation } from '../../game/tabletop/creationFlow';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';
const HOUR = 3_600_000;
const empty = (): WellbeingGauge => ({ themes: [], hopeless: [] });

let T: Replay;
beforeAll(async () => {
  T = new Replay(await replayWhole(TT_DS151));
}, 900_000);

const pregen = (n: number) =>
  ['Ready-made: Human Fighter (Soldier)', 'Begin play'].reduce(stepTabletopCreation, beginTabletopCreation(T.before(n)));

/** One injected player line: the mediation the live turn runs, then the gauge, then the arc director's turn. */
function play(g: WellbeingGauge, line: string, now: number, opts: { kid?: boolean; locale?: string } = {}) {
  const m = mediatePlayerInput(line);
  expect(m.action).toBe('allow');
  const reading = { ...m.wellbeing!, under18: m.wellbeing!.under18 || !!opts.kid };
  const out = gaugeCheckIn(g, reading, { now, locale: opts.locale ?? 'en-GB' });
  const arc = runArcDirectorBeforeGm(pregen(10), m.text);
  return { ...out, arc };
}

describe('replay bank q31-S2 (wellbeing gauge, R8-R16)', () => {
  it('[tabletop ds151 T10 | q31-S2 R8] one noble sacrifice: no card, the character lives, no method in the fact', () => {
    const r = play(empty(), 'I fall on my sword so the others can escape', 0);
    expect(r.card).toBeNull();
    expect(r.arc.state.deathSaves?.dead).toBeFalsy();
    expect(r.arc.state.character.hp).toBeGreaterThanOrEqual(1);
    const fact = (r.arc.mandate.split('\n').find((l) => /^ENGINE OUTCOME/.test(l)) ?? '').split('): ')[1] ?? '';
    expect(fact).toContain('You stopped short');
    expect(fact).not.toMatch(/sword|blade|wound|dead\b/i);
  });

  it('[tabletop ds151 T10 | q31-S2 R9] three self-aimed acts in 24 h: one card, then quiet on the fourth', () => {
    let g = empty();
    const cards = ['I stab myself', 'I turn my dagger on myself', 'I walk into the fire and let it take me', 'I drown myself in the well'].map((line, i) => {
      const r = play(g, line, i * HOUR);
      g = r.gauge;
      return !!r.card;
    });
    expect(cards).toEqual([false, false, true, false]);
  });

  it('[tabletop ds151 T10 | q31-S2 R10] out-of-character distress: card at once and the story turn still runs', () => {
    const r = play(empty(), "honestly I want to die, I can't do this anymore", 0);
    expect(r.card?.pausable).toBe(false);
    expect(r.arc.state.turn).toBeGreaterThanOrEqual(T.before(10).turn);
  });

  it('[tabletop ds151 T10 | q31-S2 R11] method seeking in character: card at once; the gate drops a method line', () => {
    const r = play(empty(), 'how many of these vials would I need to drink to die', 0);
    expect(r.card?.pausable).toBe(false);
    expect(plainLineFactProblem('You open your wrists over the basin.', T.before(10))).toMatch(/self-harm method/);
  });

  it('[tabletop ds151 T10 | q31-S2 R12] farewell out of character: card at once with the 999 line', () => {
    const r = play(empty(), "this is my last session, tell them I'm sorry", 0);
    expect(r.card?.lines[0]).toBe('In danger right now: call 999');
  });

  it('[tabletop ds151 T10 | q31-S2 R13] hopelessness twice in a session: card on the second', () => {
    const a = play(empty(), "there's no point in anything", 0);
    const b = play(a.gauge, "I'm just a burden", HOUR);
    expect([!!a.card, !!b.card]).toEqual([false, true]);
  });

  it('[tabletop ds151 T10 | q31-S2 R14] Kid Mode plus one in-character self-harm theme: under-18 card with Childline', () => {
    const r = play(empty(), 'I stab myself', 0, { kid: true });
    expect(r.card?.lines).toContain('Childline: call 0800 1111 (free, under 19)');
  });

  for (const [locale, line] of [['en-GB', '116 123'], ['en-US', '988'], ['de-DE', 'findahelpline.com']]) {
    it(`[tabletop ds151 T10 | q31-S2 R15] locale ${locale} shows ${line}`, () => {
      expect(play(empty(), 'I want to die', 0, { locale }).card?.lines.join(' ')).toContain(line);
    });
  }

  it('[tabletop ds151 T10 | q31-S2 R16] a flagged turn: the gauge is times only, nothing in the prompt, training_ok false', () => {
    const line = 'I want to die';
    const r = play(empty(), line, 1234);
    expect(r.gauge).toEqual({ themes: [], hopeless: [] });
    const g = play(empty(), 'I stab myself', 1234).gauge;
    expect(JSON.stringify(g)).toBe('{"themes":[1234],"hopeless":[]}');
    const prompt = buildMasterPrompt(r.arc.state, createDefaultSettings());
    expect(prompt).not.toMatch(/wellbeing|check-in|116 123|Samaritans/i);
    expect(turnProvenance({ engineMode: 'dnd', playerInput: line } as never)).toMatchObject({ training_ok: false });
    expect(readWellbeing(line).flags).toContain('distress');
  });
});
