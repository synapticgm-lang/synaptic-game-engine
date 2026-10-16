/**
 * mode-gap step 7: story RPG choices schedule a delayed consequence (scheduleDelayedConsequence) that the existing
 * arcDirector delivery pays off when that person is present again, a "they'll remember" cue at the choice, and
 * story RPG endings through the shared ending gates (pyoaEndingGates). Real tapes: salt-road-heist ds150 (Vessa at
 * the Waystation T3, Sefa Crane and Hobb Dunmore in Safehouse Alley T16, "Pick an approach" and "Commit to the heist
 * night" still open after T21), summoned-pact s150 and cursed-keep ds151 (no change in either).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { formatArcStatusReceipts, runArcDirectorBeforeGm } from '../../game/arcDirector';
import {
  applyStoryRpgTurn,
  pendingRemembered,
  REMEMBER_AFTER_TURNS,
  REMEMBER_TRUST,
  rpgEndingChip,
  storyRpgDecisionChip,
} from '../../game/storyRpgProgress';
import { getEligibleEndings, getEndingsForBible, isEndingEligible } from '../../game/pyoaEndingGates';
import { RPG_ENDING_CHIP, finishedMainQuest, standingNet } from '../../game/rpgEndings';
import { engineResultFact } from '../../game/engineResult';
import { storedRelationshipFor, presentNpcNames } from '../../game/npcRelationships';
import { recruitChip, recruitedCompanions } from '../../game/rules/companions';
import { isPlayInputLocked } from '../../game/playPhase';
import { mediatePlayerInput } from '../../game/inputMediation';
import { validateActionHard } from '../../game/actionValidation';
import { rememberCueText, filterSystemLogForEngine, statusLinesForVerbosity } from '../../game/systemLog';
import type { GameState } from '../../game/types';
import type { BibleId } from '../../game/pyoaTypes';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const LIT150 = '2026-10-12T17-05-53-021Z_summoned-pact_cold-system_s150';
const RPG_DS150 = '2026-10-13T14-15-18-792Z_salt-road-heist_chilled-gm_s150';
const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';

let L: Replay;
let R: Replay;
let T: Replay;
beforeAll(async () => {
  [L, R, T] = [
    new Replay(await replayWhole(LIT150)),
    new Replay(await replayWhole(RPG_DS150)),
    new Replay(await replayWhole(TT_DS151)),
  ];
}, 900_000);

/** One engine turn the way useGame and fate-autoplay run it: arcDirector, then the story RPG turn, then the turn count. */
function turn(s: GameState, input: string) {
  const arc = runArcDirectorBeforeGm(s, input);
  const story = applyStoryRpgTurn(arc.state, input);
  const status = [...formatArcStatusReceipts(arc), ...story.receipts];
  const fact = engineResultFact([...arc.systemReceipts, ...story.receipts], s.engineMode);
  return { state: { ...story.state, turn: (story.state.turn ?? 0) + 1 }, status, fact, story };
}

/** Put a pending consequence from one real state onto another real state of the same tape. */
function carry(from: GameState, onto: GameState, turnNo = onto.turn): GameState {
  return {
    ...onto,
    turn: turnNo,
    arcDirector: { ...(onto.arcDirector ?? {}), pyoaDelayedConsequences: from.arcDirector?.pyoaDelayedConsequences ?? [] },
  };
}

const REFUSE = 'Refuse Vessa and keep your own counsel';
const allStatus = (r: Replay) => r.turns().map((n) => (r.at(n).telemetry.systemLog ?? []).join('\n')).join('\n');

/**
 * Ds150 after T21 with remaining decision steps closed for ending tests.
 * RC-QT1: picking "Pick an approach" / "Commit…" no longer ticks — contact favour or a place/check does.
 * Ending coverage finishes the main quest on the state (engine outcome), not the chip label.
 */
function finishedMain() {
  const s = R.after(21);
  expect(storyRpgDecisionChip(s)).toBe('Pick an approach');
  expect(turn(s, 'Pick an approach').status.join('\n')).not.toMatch(/Quest stage/);
  const quests = (s.quests ?? []).map((q) => {
    if (q.type !== 'main' || q.name !== 'Case the Caravan') return q;
    const objectives = (q.objectives ?? []).map((o) => ({ ...o, completed: true }));
    return { ...q, objectives, status: 'completed' as const };
  });
  const state = { ...s, quests } as GameState;
  expect(rpgEndingChip(state)).toBe(RPG_ENDING_CHIP);
  return { state, status: [`Quest stage: Case the Caravan — Commit to the heist night`], fact: '', story: { state, receipts: [] } };
}

describe('replay bank mode-gap 7 (story RPG consequences and endings)', () => {
  it('[story rpg ds150 T3 | mode-gap 7] refusing Vessa moves her standing, schedules a delayed consequence and gives the "will remember" cue', () => {
    expect(R.input(3)).toBe('Talk to Vessa');
    const s = R.after(3);
    expect(presentNpcNames(s)).toContain('Vessa');
    const r = turn(s, REFUSE);
    expect(r.status.some((l) => /^Standing: Vessa turned .+ after you refused$/.test(l))).toBe(true);
    expect(r.status).toContain('Remember: Vessa will remember that.');
    const pending = pendingRemembered(r.state, 'Vessa')!;
    expect(pending).toMatchObject({
      id: `dc-rpg-standing-vessa-refused-${s.turn}`,
      status: 'pending',
      type: 'relationship_shift',
      committedAtTurn: s.turn,
      dueAtTurn: s.turn + REMEMBER_AFTER_TURNS,
      payload: { awaitsNpc: 'Vessa', narrativeBeat: 'Vessa remembers your refusal.' },
    });
    expect(pending.payload.relationshipDeltas).toEqual([{ npcId: 'Vessa', aspect: 'trust', delta: REMEMBER_TRUST.refused, reason: 'remembers you refused' }]);
    // The prose cue: the writer's required ENGINE RESULT carries it.
    expect(r.fact).toMatch(/Vessa will remember that\./);
    // Nothing moves on her stored record yet: the hidden score waits for the payoff.
    expect(storedRelationshipFor(r.state, 'Vessa')?.trust ?? 0).toBe(storedRelationshipFor(s, 'Vessa')?.trust ?? 0);
  });

  it('[story rpg ds150 T3 | mode-gap 7] the existing arcDirector delivery pays it off when due and Vessa is here — no number shown', () => {
    const chose = turn(R.after(3), REFUSE).state;
    const due = chose.arcDirector!.pyoaDelayedConsequences![0]!.dueAtTurn;
    const early = turn({ ...chose, turn: due - 1 }, 'Wait and watch');
    expect(early.status.some((l) => l.startsWith('Remembered:'))).toBe(false);
    expect(pendingRemembered(early.state, 'Vessa')).toBeDefined();
    const paid = turn({ ...chose, turn: due }, 'Wait and watch');
    expect(paid.status).toContain('Remembered: Vessa remembers your refusal.');
    expect(paid.fact).toMatch(/Vessa remembers your refusal\./);
    expect(paid.status.filter((l) => /remember/i.test(l)).join('\n')).not.toMatch(/\d/);
    expect(storedRelationshipFor(paid.state, 'Vessa')!.trust).toBe((storedRelationshipFor(chose, 'Vessa')?.trust ?? 0) + REMEMBER_TRUST.refused);
    expect(pendingRemembered(paid.state, 'Vessa')).toBeUndefined();
    expect(paid.state.arcDirector!.pyoaDelayedConsequences![0]!.status).toBe('delivered');
    // Delivered once: the next turn is quiet.
    expect(turn(paid.state, 'Wait and watch').status.some((l) => l.startsWith('Remembered:'))).toBe(false);
  });

  it('[story rpg ds150 T16 | mode-gap 7] a due consequence waits while Vessa is away and fires when she is present', () => {
    const chose = turn(R.after(3), REFUSE).state;
    const due = chose.arcDirector!.pyoaDelayedConsequences![0]!.dueAtTurn;
    expect(R.input(16)).toBe('Talk to Sefa Crane');
    const alley = carry(chose, R.after(16), Math.max(due, R.after(16).turn));
    expect(presentNpcNames(alley)).not.toContain('Vessa');
    const away = turn(alley, 'Wait and watch');
    expect(away.status.some((l) => l.startsWith('Remembered:'))).toBe(false);
    expect(pendingRemembered(away.state, 'Vessa')).toBeDefined();
  });

  it('[story rpg ds150 T3 | mode-gap 7] helping pays off as help; a newer choice about the same person replaces the older one', () => {
    const s = R.after(3);
    const refused = turn(s, REFUSE).state;
    const helped = turn(refused, 'Help Vessa with her trouble');
    expect(helped.status.some((l) => /^Standing: Vessa turned .+ after you helped$/.test(l))).toBe(true);
    expect(helped.status).toContain('Remember: Vessa will remember that.');
    const list = helped.state.arcDirector!.pyoaDelayedConsequences!;
    expect(list.filter((c) => c.status === 'pending')).toHaveLength(1);
    expect(list.find((c) => c.status === 'cancelled')!.payload.narrativeBeat).toBe('Vessa remembers your refusal.');
    const p = pendingRemembered(helped.state, 'Vessa')!;
    expect(p.payload.narrativeBeat).toBe('Vessa remembers your help.');
    const paid = turn({ ...helped.state, turn: p.dueAtTurn }, 'Wait and watch');
    expect(paid.status).toContain('Remembered: Vessa remembers your help.');
    expect(storedRelationshipFor(paid.state, 'Vessa')!.trust).toBe((storedRelationshipFor(s, 'Vessa')?.trust ?? 0) + REMEMBER_TRUST.helped);
  });

  it('[story rpg ds150 | mode-gap 7] ordinary tape lines schedule nothing; the cue shows with its mark in STATUS', () => {
    for (const n of [3, 4, 16, 17, 21]) {
      const quiet = turn(R.before(n), R.input(n));
      expect(quiet.status.filter((l) => /^Remember/.test(l)), `T${n} "${R.input(n)}"`).toEqual([]);
      expect(quiet.state.arcDirector?.pyoaDelayedConsequences ?? []).toEqual(R.before(n).arcDirector?.pyoaDelayedConsequences ?? []);
    }
    const lines = statusLinesForVerbosity(filterSystemLogForEngine(['Remember: Vessa will remember that.', 'Remembered: Vessa remembers your refusal.'], 'rpg'), 'core');
    expect(lines).toHaveLength(2);
    expect(lines.map(rememberCueText)).toEqual(['Vessa will remember that.', 'Vessa remembers your refusal.']);
    expect(rememberCueText('Standing: Vessa turned hostile (was neutral) after you refused')).toBeNull();
  });

  it('[story rpg ds150 T21 | mode-gap 7] no ending until the main quest is finished; then the shared gates offer it', () => {
    const s = R.after(21);
    expect(finishedMainQuest(s)).toBeNull();
    expect(rpgEndingChip(s)).toBeNull();
    expect(getEligibleEndings((s.campaignBibleId ?? '') as BibleId, s)).toEqual([]);
    const r = finishedMain();
    expect(finishedMainQuest(r.state)?.name).toBe('Case the Caravan');
    expect(rpgEndingChip(r.state)).toBe(RPG_ENDING_CHIP);
    const eligible = getEligibleEndings('salt-road-heist' as BibleId, r.state);
    const net = standingNet(r.state);
    expect(eligible[0]!.name).toBe(net >= 1 ? 'Well Regarded' : net <= -1 ? 'Hard Won' : 'The Job Done');
    expect(eligible.map((e) => e.priority)).toEqual([...eligible.map((e) => e.priority)].sort((a, b) => b - a));
    expect(isPlayInputLocked(r.state)).toBe(false);
  });

  it('[story rpg ds150 T21 | mode-gap 7] taking the ending commits it through commitEnding, tells the writer, and ends the run', () => {
    const r = finishedMain();
    const chip = RPG_ENDING_CHIP;
    expect(mediatePlayerInput(chip)).toMatchObject({ action: expect.not.stringMatching(/^block$/), text: chip });
    const lastGm = [...r.state.log].reverse().find((e) => e.role === 'gm')?.content ?? '';
    const hard = validateActionHard(chip, r.state, lastGm);
    expect(hard.valid).toBe(true);
    expect(hard.rewritten ?? chip).toBe(chip);
    const best = getEligibleEndings('salt-road-heist' as BibleId, r.state)[0]!;
    const end = turn(r.state, chip);
    expect(end.status).toContain(`Ending: ${best.name} — ${best.terminalText}`);
    expect(best.terminalText).toMatch(/^You saw Case the Caravan through/);
    expect(end.fact).toContain(best.terminalText);
    expect(end.state.playPhase).toBe('ended');
    expect(isPlayInputLocked(end.state)).toBe(true);
    expect(end.state.pyoaBranchLedger?.committedPaths).toContain(`ending:${best.id}`);
    expect(isEndingEligible(best, end.state, end.state.turn)).toMatchObject({ eligible: false, reason: 'Run already has an ending' });
    expect(rpgEndingChip(end.state)).toBeNull();
  });

  it('[story rpg ds150 T3+T21 | mode-gap 7] the ending reads the run: Vessa still with you, or more enemies than friends', () => {
    const joined = turn(R.after(3), recruitChip('Vessa')).state;
    const done = finishedMain().state;
    const withVessa = { ...done, companions: [...(done.companions ?? []), ...recruitedCompanions(joined)] } as GameState;
    expect(getEligibleEndings('salt-road-heist' as BibleId, withVessa)[0]).toMatchObject({
      name: 'With Company',
      terminalText: 'You saw Case the Caravan through, and Vessa was still with you at the end.',
    });
    const crossed = {
      ...done,
      npcMemories: [
        ...(done.npcMemories ?? []).map((m) => ({ ...m, disposition: 'neutral' as const })),
        { npcId: 'hobb dunmore', npcName: 'Hobb Dunmore', disposition: 'hostile' as const, facts: [], lastSeenTurn: done.turn },
      ],
    } as GameState;
    expect(standingNet(crossed)).toBe(-1);
    expect(getEligibleEndings('salt-road-heist' as BibleId, crossed)[0]!.name).toBe('Hard Won');
  });

  it('[litrpg s150 + tabletop ds151 | mode-gap 7] no remember cue, no delayed consequence, no ending offer outside story RPG', () => {
    for (const r of [L, T]) {
      const last = r.turns()[r.turns().length - 1]!;
      const s = r.after(last);
      const mainDone = {
        ...s,
        quests: (s.quests ?? []).map((q) => (q.type === 'main' ? { ...q, status: 'completed' as const } : q)),
      } as GameState;
      expect(rpgEndingChip(mainDone)).toBeNull();
      expect(applyStoryRpgTurn(mainDone, RPG_ENDING_CHIP)).toEqual({ state: mainDone, receipts: [] });
      expect(getEndingsForBible((s.campaignBibleId ?? '') as BibleId, mainDone)).toEqual([]);
    }
    // PYOA keeps its own catalog.
    expect(getEndingsForBible('thornferry-road')).toHaveLength(6);
  });

  it('[all three tapes | mode-gap 7] the tapes as played schedule nothing and offer no ending', () => {
    for (const r of [L, R, T]) {
      expect(allStatus(r)).not.toMatch(/^(?:Remember|Remembered|Ending):/m);
      const last = r.after(r.turns()[r.turns().length - 1]!);
      expect(last.arcDirector?.pyoaDelayedConsequences ?? []).toEqual([]);
      expect(last.playPhase).not.toBe('ended');
    }
  });
});
