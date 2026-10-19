import { describe, expect, it } from 'vitest';
// @ts-expect-error untyped .mjs
import {
  isSetupStep,
  noteRepeat,
  planSetupAction,
  settleHarnessTurn,
  setupAdvanced,
  setupStuck,
} from '../../scripts/ai-player-browser/setupStep.mjs';

const OFFERED = ['Quick start', 'Ready-made: Mara', 'Build my own'];

describe('ai-player setup steps', () => {
  it('detects a setup step and picks an offered chip, never a typed line', () => {
    expect(isSetupStep({ setupSignal: true, chips: OFFERED })).toBe(true);
    expect(isSetupStep({ setupSignal: false, chips: OFFERED })).toBe(false);

    const named = planSetupAction({ action: 'Build my own', chips: OFFERED });
    expect(named).toEqual({ kind: 'chip', action: 'Build my own', typed: false });

    const typed = planSetupAction({ action: 'I walk out the door and ask who they are', chips: OFFERED });
    expect(typed.typed).toBe(false);
    expect(typed.kind).toBe('chip');
    expect(OFFERED).toContain(typed.action);
    expect(typed.action).toBe(OFFERED[0]);

    const progress = setupAdvanced(
      { setupSignal: true, systemRowCount: 1, chips: OFFERED },
      { setupSignal: true, systemRowCount: 2, chips: OFFERED },
    );
    expect(progress).toBe(true);
    expect(setupAdvanced(
      { setupSignal: true, systemRowCount: 2, chips: OFFERED },
      { setupSignal: true, systemRowCount: 2, chips: ['Fighter', 'Rogue'] },
    )).toBe(true);
  });

  it('a smoke turn with no GM reply fails the run', () => {
    const fail = settleHarnessTurn({
      smoke: true,
      setupTurn: false,
      newGmReply: false,
      turn: 4,
      gmReplies: 0,
      setupClicks: 2,
    });
    expect(fail.ok).toBe(false);
    expect(fail.exitCode).toBe(1);
    expect(fail.reason).toBe('smoke_no_gm_reply T4');
    expect(fail.stop).toBe(true);
  });

  it('setup turns do not count as smoke GM replies or as repeat strikes', () => {
    let gmReplies = 0;
    let setupClicks = 0;
    let repeats = 0;
    for (let turn = 1; turn <= 4; turn++) {
      repeats = noteRepeat(repeats, { setupTurn: true, repeatHit: true });
      const step = settleHarnessTurn({
        smoke: true,
        setupTurn: true,
        newGmReply: false,
        turn,
        gmReplies,
        setupClicks,
      });
      gmReplies = step.gmReplies;
      setupClicks = step.setupClicks;
      expect(step.countsAsGm).toBe(false);
      expect(step.countRepeat).toBe(false);
      expect(step.ok).toBe(true);
    }
    expect(gmReplies).toBe(0);
    expect(setupClicks).toBe(4);
    expect(repeats).toBe(0);

    const reply = settleHarnessTurn({
      smoke: true,
      setupTurn: false,
      newGmReply: true,
      turn: 5,
      gmReplies,
      setupClicks,
    });
    expect(reply.gmReplies).toBe(1);
    expect(reply.setupClicks).toBe(4);
    expect(reply.stop).toBe(false);

    const done = settleHarnessTurn({
      smoke: true,
      setupTurn: false,
      newGmReply: true,
      turn: 6,
      gmReplies: reply.gmReplies,
      setupClicks,
    });
    expect(done.gmReplies).toBe(2);
    expect(done.ok).toBe(true);
    expect(done.stop).toBe(true);

    expect(setupStuck({ smoke: true, setup: true, setupClicks: 12 })).toMatchObject({
      stop: true,
      ok: false,
      exitCode: 1,
      reason: 'smoke_setup_stuck',
    });
    expect(noteRepeat(1, { setupTurn: true, repeatHit: true })).toBe(1);
  });
});
