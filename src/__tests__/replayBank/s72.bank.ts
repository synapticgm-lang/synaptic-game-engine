import { beforeAll, describe, expect, it, vi } from 'vitest';
import { filterInventedContextChoices } from '../../game/choiceWarden';
import { validateEvalRun } from '../../game/evalHarness';
import { Replay, npc } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUN = '2026-10-06T18-54-31-238Z_summoned-pact_cold-system_s72';
let R: Replay;
beforeAll(async () => {
  R = new Replay(await replayWhole(RUN));
}, 300_000);

const outcome = (n: number) => R.packet(n).match(/Outcome: ([^.\n]+)/)?.[1] ?? '';
const cardExits = (n: number, place: string) =>
  ((R.after(n).places ?? []).find((p) => p.name === place) as { exits?: string[] } | undefined)?.exits;

describe('replay bank s72', () => {
  it('[s72 T9 | s72 Root E] travel chips agree with the place card exits', () => {
    const here = R.after(9).currentLocation ?? '';
    expect(here, 'replay arrives at Contract Hall on T9').toBe('Contract Hall');
    const exits = cardExits(9, here);
    expect(exits, `place card for ${here}`).toBeTruthy();
    for (const c of R.chips(10)) {
      const m = c.match(/^(?:Travel toward|Return to) (.+)$/);
      if (m) expect(exits, `chip "${c}"`).toContain(m[1]);
    }
  });

  it('[s72 T13 | s72 Root E] the Cathedral Undercroft card gets more than one exit', () => {
    const exits = cardExits(13, 'Cathedral Undercroft');
    expect(exits, 'Undercroft card').toBeTruthy();
    expect(exits!.length).toBeGreaterThan(1);
  });

  it('[s72 T13 | s72 Root E] no "Enter X" chip for the place the player is already in', () => {
    const here = R.after(13).currentLocation ?? '';
    expect(R.chipsAfter(13)).not.toContain(`Enter ${here}`);
  });

  it('[s72 T7 | s72 Root E] a quiet stretch is not re-padded with travel, return or help chips', () => {
    const t = R.turns().find((n) => R.before(n).journey && !R.before(n).journey!.encounter);
    expect(t, 'replay has a quiet journey stretch').toBeTruthy();
    for (const c of R.chips(t!)) expect(c).not.toMatch(/^(Travel toward|Return to|Offer help)/);
  });

  it('[s72 T18 | s72 Root E] chips the invented-context filter removes are not added back', () => {
    for (const t of [15, 16, 17, 18]) {
      const chips = R.chipsAfter(t);
      expect(filterInventedContextChoices(chips, R.after(t)), `after T${t}`).toEqual(chips);
    }
  });

  it('[s72 T15 | s72 Root F] narration after "said" is not stored as Garth\'s spoken line', () => {
    const said = (npc(R.after(15), 'Garth Barrow')?.said ?? []).map((s) => s.line);
    expect(said.join('\n')).not.toMatch(/Jax's name like/);
  });

  it('[s72 T19 | s72 Root F] Garth\'s quoted "Back already" is recorded under his short name', () => {
    const t = R.turns().find((n) => /Garth said, "Back already/.test(R.prose(n)));
    expect(t, 'replay has Garth saying "Back already" (recorded T19, replay T21)').toBeTruthy();
    const said = (npc(R.after(t!), 'Garth Barrow')?.said ?? []).map((s) => s.line);
    expect(said.join('\n')).toMatch(/Back already/);
  });

  it('[s72 T11 | s72 Root G] a fight just opened is not "Outcome: resolved"', () => {
    const opened = R.turns().filter((n) => !R.before(n).activeEncounter && R.after(n).activeEncounter);
    expect(opened.length, 'replay opens a fight that stays live (recorded T11; on main "Face" now ends it in one turn)').toBeGreaterThan(0);
    for (const t of opened) expect(outcome(t), `T${t}`).not.toMatch(/^resolved/);
  });

  it('[s72 T18 | s72 Root G] a blocked, unchanged move is not "Outcome: resolved"', () => {
    const b = R.before(18).journey;
    const a = R.after(18).journey;
    expect(b && a && b.legsDone === a.legsDone && b.to === a.to, 'replay is still blocked on the same leg').toBe(true);
    expect(outcome(18)).not.toMatch(/^resolved/);
  });

  const fleeTurns = () => R.turns().filter((n) => /Flee check:.*success/.test(R.receiptText(n)));

  it('[s72 T12 | s72 Root G] a successful flee is not reported as the thugs dealt with', () => {
    const turns = fleeTurns();
    expect(turns.length, 'replay has a successful flee (recorded T12; on main "Face" now ends the fight first)').toBeGreaterThan(0);
    for (const t of turns) expect(R.receiptText(t), `T${t}`).not.toMatch(/dealt with/);
  });

  it('[s72 T12 | s72 Root G] an escape is not counted as a cleared encounter', () => {
    const turns = fleeTurns();
    expect(turns.length, 'replay has a successful flee (recorded T12; on main "Face" now ends the fight first)').toBeGreaterThan(0);
    for (const t of turns) {
      expect(R.receiptText(t), `T${t}`).not.toMatch(/Encounter cleared:.*escap/i);
      const hook = (R.after(t).arcDirector as { t12HookReceipt?: { fired?: boolean; reason?: string } } | undefined)?.t12HookReceipt;
      expect(hook?.fired && hook.reason === 'encounterCleared' && hook && (R.before(t).arcDirector as { t12HookReceipt?: { fired?: boolean } } | undefined)?.t12HookReceipt?.fired !== true).toBeFalsy();
    }
  });

  it('[s72 T11 | s72 Root G] facing a road meeting rolls a round and writes a combat receipt', () => {
    expect(R.input(11)).toMatch(/^Face /);
    expect(R.receiptText(11)).toMatch(/^Fight:/m);
  });

  it('[s72 whole run | s72 Root G] the eval combat gate counts the road fight', () => {
    const last = R.turns()[R.turns().length - 1];
    const fought = R.turns().some((t) => /^Fight:/m.test(R.receiptText(t)));
    expect(fought, 'replay has a fight').toBe(true);
    expect(validateEvalRun(R.after(last), {}, []).livenessGates.combatByT8).toBe(true);
  });
});
