/**
 * RC-J1 — blind paired judge: two order-swapped asks; keep a label only on agreement;
 * disagreement never yields a thumb; training_ok needs agreement ≥ PAIR_AGREEMENT_FLOOR.
 */
import { describe, expect, it } from 'vitest';
// @ts-ignore — plain .mjs script module, no types
import { PAIR_AGREEMENT_FLOOR, agreePairedMarks, buildPairedJudgePrompt, pairAgreementRate, trainingOkFromAgreement } from '../../scripts/fate-autoplay/judgeNotes.mjs';

describe('RC-J1 blind paired judge', () => {
  it('paired prompt hides seat names and shows Draft X / Draft Y', () => {
    const prompt = buildPairedJudgePrompt(
      [
        {
          turn: 3,
          input: 'Walk on',
          present: ['Edda Merrow'],
          chips: ['Ask Edda', 'Leave'],
          proseX: 'Jax walked the wet road toward the keep.',
          proseY: 'The road took Jax east under a grey sky.',
        },
      ],
      { swapped: false }
    );
    expect(prompt).toContain('DRAFT X:');
    expect(prompt).toContain('DRAFT Y:');
    expect(prompt).toContain('Jax walked the wet road');
    expect(prompt).toContain('The road took Jax east');
    expect(prompt).not.toMatch(/deepseek|glm|flash-lite/i);
    expect(prompt).toContain('Seats and model names are hidden');
  });

  it('swapped prompt flips which prose is Draft X', () => {
    const row = {
      turn: 1,
      input: 'Look',
      present: [],
      chips: [],
      proseX: 'SIDE_ZERO_PROSE',
      proseY: 'SIDE_ONE_PROSE',
    };
    const a = buildPairedJudgePrompt([row], { swapped: false });
    const b = buildPairedJudgePrompt([row], { swapped: true });
    expect(a.indexOf('SIDE_ZERO_PROSE')).toBeLessThan(a.indexOf('SIDE_ONE_PROSE'));
    expect(b.indexOf('SIDE_ONE_PROSE')).toBeLessThan(b.indexOf('SIDE_ZERO_PROSE'));
  });

  it('same pair with seats swapped keeps labels only when both asks agree; disagreement is unmarked', () => {
    const ask1 = { turn: 5, x: 'up', y: 'down', why_x: 'sharp detail', why_y: 'plays the player' };
    const ask2Agree = { turn: 5, x: 'down', y: 'up', why_x: 'plays the player', why_y: 'sharp detail' };
    const ok = agreePairedMarks(ask1, ask2Agree);
    expect(ok.seat0).toBe('up');
    expect(ok.seat1).toBe('down');
    expect(ok.agreed0).toBe(true);
    expect(ok.agreed1).toBe(true);

    const ask2Disagree = { turn: 5, x: 'up', y: 'down', why_x: 'flipped', why_y: 'flipped' };
    const bad = agreePairedMarks(ask1, ask2Disagree);
    expect(bad.seat0).toBe('unmarked');
    expect(bad.seat1).toBe('unmarked');
    expect(bad.agreed0).toBe(false);
    expect(bad.agreed1).toBe(false);
    expect(bad.why0).toBe('pair asks disagreed');
  });

  it('agreement rate and training floor', () => {
    expect(PAIR_AGREEMENT_FLOOR).toBe(0.7);
    const full = [
      { agreed0: true, agreed1: true },
      { agreed0: true, agreed1: true },
    ];
    expect(pairAgreementRate(full)).toBe(1);
    expect(trainingOkFromAgreement(1)).toBe(true);

    const low = [
      { agreed0: true, agreed1: false },
      { agreed0: false, agreed1: false },
      { agreed0: true, agreed1: false },
      { agreed0: false, agreed1: false },
      { agreed0: true, agreed1: false },
    ];
    // 3/10 = 0.3
    expect(pairAgreementRate(low)).toBe(0.3);
    expect(trainingOkFromAgreement(0.3)).toBe(false);
    expect(trainingOkFromAgreement(0.7)).toBe(true);
    expect(trainingOkFromAgreement(0.69)).toBe(false);
  });
});
