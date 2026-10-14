/**
 * mode-gap step 6: a named NPC joins the player (story RPG and LitRPG), approval on that NPC's relationship record
 * (npcRelationships), shown as bands only, two warnings then leaving, and the companion fighting in the engine fight
 * with the tabletop sidekick numbers. Real tapes: salt-road-heist ds150 (Vessa at T3–T4, the T6 "Face the thugs"
 * fight, Hobb Dunmore and Sefa Crane at T16), summoned-pact s150 (Col Thatch at T9, the T13 fight) and cursed-keep
 * ds151 (Brannoc Hask at T17: tabletop has no recruit path).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { formatArcStatusReceipts, runArcDirectorBeforeGm } from '../../game/arcDirector';
import { resolveEngineFight } from '../../game/engineFight';
import { validateActionHard } from '../../game/actionValidation';
import { mediatePlayerInput } from '../../game/inputMediation';
import { shiftStoredRelationship, storedRelationshipFor } from '../../game/npcRelationships';
import {
  APPROVAL_SHIFT,
  approvalBand,
  partyHeading,
  recruitChip,
  recruitPad,
  recruitedCompanions,
  settleCompanions,
} from '../../game/rules/companions';
import { presentSystemNotices } from '../../game/systemNotice';
import { buildLitrpgSystemWindow, shouldAttachLitrpgSystemWindow, SYSTEM_WINDOW_MAX_LINES } from '../../game/litrpgSystemWindow';
import type { GameState } from '../../game/types';

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

function turn(s: GameState, input: string) {
  const arc = runArcDirectorBeforeGm(s, input);
  return { arc, state: { ...arc.state, turn: (arc.state.turn ?? 0) + 1 }, status: formatArcStatusReceipts(arc) };
}

/** Carry the party and the relationship records from a recruit onto a later real state of the same tape. */
function carry(from: GameState, onto: GameState): GameState {
  return {
    ...onto,
    companions: [...(onto.companions ?? []), ...recruitedCompanions(from)],
    arcDirector: {
      ...(onto.arcDirector ?? {}),
      npcRelationships: [...(onto.arcDirector?.npcRelationships ?? []), ...(from.arcDirector?.npcRelationships ?? [])],
    },
  };
}

const allStatus = (r: Replay) => r.turns().map((n) => (r.at(n).telemetry.systemLog ?? []).join('\n')).join('\n');

function recruitVessa(): ReturnType<typeof turn> {
  expect(R.input(3)).toBe('Talk to Vessa');
  return turn(R.after(3), recruitChip('Vessa'));
}

describe('replay bank mode-gap 6 (companions and approval)', () => {
  it('[story rpg ds150 T3 | mode-gap 6] "Ask Vessa to join you" passes the gates and Vessa joins before the writer', () => {
    const s = R.after(3);
    const chip = recruitChip('Vessa');
    expect(mediatePlayerInput(chip)).toMatchObject({ action: expect.not.stringMatching(/^block$/), text: chip });
    const lastGm = [...s.log].reverse().find((e) => e.role === 'gm')?.content ?? '';
    const hard = validateActionHard(chip, s, lastGm);
    expect(hard.valid).toBe(true);
    expect(hard.rewritten ?? chip).toBe(chip);
    const r = recruitVessa();
    const vessa = recruitedCompanions(r.state);
    expect(vessa).toHaveLength(1);
    expect(vessa[0]).toMatchObject({ name: 'Vessa', type: 'party', recruited: true, sidekick: 'expert', approvalWarnings: 0 });
    expect(r.status).toContain('Companion: Vessa joined you (Neutral).');
    expect(r.arc.mandate).toMatch(/ENGINE RESULT \(required fact — state it plainly\): Vessa agreed to travel with the player/);
    const rec = storedRelationshipFor(r.state, 'Vessa')!;
    expect(rec.trust).toBe(APPROVAL_SHIFT.join.trust);
    expect(rec.milestones?.map((m) => m.type)).toContain('alliance');
    expect(partyHeading(r.state)).toBe('With you: Vessa (Neutral)');
    // Asking again does nothing new: Vessa is already with you.
    expect(turn(r.state, chip).status.filter((l) => l.startsWith('Companion:'))).toEqual([]);
  });

  it('[story rpg ds150 T6 | mode-gap 6] Vessa fights beside you in the tape\'s own fight with the sidekick numbers', () => {
    const r = recruitVessa();
    expect(R.input(6)).toBe('Face the thugs');
    const before = carry(r.state, R.before(6));
    const fight = resolveEngineFight(before, 'Face the thugs')!;
    expect(fight).not.toBeNull();
    const line = fight.receipts.find((l) => l.startsWith('Companion:'));
    expect(line).toMatch(/^Companion: Vessa fought beside you \(dealt \d+, took \d+\)\.$/);
    expect(fight.facts).toMatch(/Vessa fought at your side\./);
    const after = recruitedCompanions(fight.state)[0]!;
    expect(after.hp).toBeGreaterThanOrEqual(1);
    expect(after.hp).toBeLessThanOrEqual(after.maxHp);
    // The same state with nobody recruited fights alone, as before.
    const alone = resolveEngineFight(R.before(6), 'Face the thugs')!;
    expect(alone.receipts.some((l) => l.startsWith('Companion:'))).toBe(false);
    expect(alone.facts).not.toMatch(/at your side/);
  });

  it('[story rpg ds150 T6 | mode-gap 6] a fight won together nudges approval; the STATUS line passes through', () => {
    const r = recruitVessa();
    const before = carry(r.state, R.before(6));
    const t = turn(before, 'Face the thugs');
    expect(t.status.some((l) => /^Companion: Vessa fought beside you/.test(l))).toBe(true);
    const won = t.status.some((l) => l.startsWith('Fight: VICTORY'));
    const trust = storedRelationshipFor(t.state, 'Vessa')!.trust;
    expect(trust).toBe(APPROVAL_SHIFT.join.trust + (won ? APPROVAL_SHIFT.foughtTogether.trust : 0));
  });

  it('[story rpg ds150 T16 | mode-gap 6] harm Vessa sees: disapproval, a first and a last warning, then she leaves — bands, never numbers', () => {
    const r = recruitVessa();
    expect(R.input(16)).toBe('Talk to Sefa Crane');
    let s = carry(r.state, R.after(16));
    const lines: string[] = [];
    const facts: string[] = [];
    let left = -1;
    for (let i = 0; i < 8 && left < 0; i++) {
      const done = settleCompanions({ ...s, turn: (s.turn ?? 0) + i }, 'Threaten Hobb Dunmore');
      s = done.state;
      lines.push(...done.receipts);
      facts.push(...done.facts);
      if (!recruitedCompanions(s).length) left = i;
    }
    expect(lines.filter((l) => l === 'Companion: Vessa disapproves.' || l.startsWith('Companion: Vessa disapproves (now ')).length).toBeGreaterThan(0);
    const first = lines.indexOf('Companion: Vessa warns you — first warning.');
    const last = lines.indexOf('Companion: Vessa warns you — last warning.');
    const gone = lines.indexOf('Companion: Vessa left your party.');
    expect(first).toBeGreaterThanOrEqual(0);
    expect(last).toBeGreaterThan(first);
    expect(gone).toBeGreaterThan(last);
    expect(left).toBeGreaterThan(0);
    expect(lines.join('\n'), 'approval shows as bands, never numbers').not.toMatch(/\d/);
    expect(lines).toContain('Companion: Vessa disapproves (now Wary).');
    expect(facts.some((f) => /Vessa left the player's company/.test(f))).toBe(true);
    expect(storedRelationshipFor(s, 'Vessa')!.trust).toBeLessThanOrEqual(-50);
    expect(partyHeading(s)).toBeNull();
  });

  it('[story rpg ds150 T16 | mode-gap 6] one big drop gives one warning a turn — she never leaves without both', () => {
    const r = recruitVessa();
    let s = carry(r.state, R.after(16));
    const seen: string[][] = [];
    for (let i = 0; i < 4; i++) {
      const done = settleCompanions({ ...s, turn: (s.turn ?? 0) + i }, 'Insult Vessa');
      s = done.state;
      seen.push(done.receipts);
    }
    expect(seen[1]).toContain('Companion: Vessa warns you — first warning.');
    expect(seen[2]).toContain('Companion: Vessa warns you — last warning.');
    expect(seen[2]).not.toContain('Companion: Vessa left your party.');
    expect(seen[3]).toContain('Companion: Vessa left your party.');
  });

  it('[story rpg ds150 T16 | mode-gap 6] kindness she sees raises approval; ordinary tape lines move nothing', () => {
    const r = recruitVessa();
    const s = carry(r.state, R.after(16));
    const kind = settleCompanions(s, 'Thank Sefa Crane for the help');
    expect(storedRelationshipFor(kind.state, 'Vessa')!.trust).toBe(APPROVAL_SHIFT.join.trust + APPROVAL_SHIFT.kindOther.trust);
    expect(kind.receipts).toEqual(['Companion: Vessa approves.']);
    for (const n of [17, 18, 20, 21]) {
      const quiet = settleCompanions(carry(r.state, R.before(n)), R.input(n));
      expect(quiet.receipts, `T${n} "${R.input(n)}"`).toEqual([]);
    }
  });

  it('[story rpg ds150 T16 | mode-gap 6] a Wary NPC refuses; a full party turns the next one away; the chip needs Friendly', () => {
    const base = R.after(16);
    expect(recruitPad(base)).toBeNull();
    const wary = {
      ...base,
      arcDirector: { ...(base.arcDirector ?? {}), npcRelationships: [{ npcName: 'Hobb Dunmore', trust: -20, familiarity: 10 }] },
    } as GameState;
    expect(approvalBand(wary, 'Hobb Dunmore')).toBe('wary');
    const no = settleCompanions(wary, recruitChip('Hobb Dunmore'));
    expect(no.receipts).toEqual(['Companion: Hobb Dunmore will not join you (Wary).']);
    expect(recruitedCompanions(no.state)).toEqual([]);
    const friendly = {
      ...base,
      arcDirector: {
        ...(base.arcDirector ?? {}),
        npcRelationships: [{ npcName: 'Sefa Crane', trust: 25, familiarity: 25, milestones: [{ type: 'first_meet', turn: 15, summary: '' }, { type: 'favor_granted', turn: 16, summary: '' }] }],
      },
    } as GameState;
    expect(recruitPad(friendly)).toEqual([recruitChip('Sefa Crane')]);
    const withVessa = carry(recruitVessa().state, friendly);
    expect(recruitPad(withVessa)).toBeNull();
    expect(settleCompanions(withVessa, recruitChip('Sefa Crane')).receipts).toEqual(['Companion: Sefa Crane cannot join — your party is full.']);
    // Lowercase crowds on the tapes are never recruitable.
    expect(settleCompanions(R.after(3), 'Ask bystanders to join you').receipts).toEqual([]);
  });

  it('[npcRelationships | mode-gap 6] a long absence fades familiarity before the event (applyLongAbsence)', () => {
    const r = shiftStoredRelationship([{ npcName: 'Vessa', trust: 5, familiarity: 20, lastTurn: 1 }], 'Vessa', { trust: 0 }, 301);
    expect(r.before.familiarity).toBe(14);
    expect(r.list[0]).toMatchObject({ npcName: 'Vessa', lastTurn: 301, familiarity: 14 });
    const near = shiftStoredRelationship([{ npcName: 'Vessa', trust: 5, familiarity: 20, lastTurn: 280 }], 'Vessa', { trust: 0 }, 301);
    expect(near.before.familiarity).toBe(20);
  });

  it('[litrpg s150 T9/T13 | mode-gap 6] Col Thatch joins as a System party notice and window line, then fights the T13 thugs', () => {
    expect(L.input(9)).toBe('Talk to Col Thatch');
    const r = turn(L.after(9), recruitChip('Col Thatch'));
    expect(r.status).toContain('Companion: Col Thatch joined you (Neutral).');
    expect(presentSystemNotices(r.status, 'litrpg')).toContain('Party — Col Thatch joined you (Neutral).');
    expect(shouldAttachLitrpgSystemWindow({ state: r.state, systemLog: r.status })).toBe(true);
    const win = buildLitrpgSystemWindow(r.state)!;
    expect(win.lines).toContain('Party: Col Thatch — Neutral');
    expect(win.lines.length).toBeLessThanOrEqual(SYSTEM_WINDOW_MAX_LINES);
    expect(partyHeading(r.state)).toBe('System — party: Col Thatch (Neutral)');
    expect(L.input(13)).toBe('Face the thugs');
    const fight = resolveEngineFight(carry(r.state, L.before(13)), 'Face the thugs')!;
    expect(fight.receipts.some((l) => /^Companion: Col Thatch fought beside you \(dealt \d+, took \d+\)\.$/.test(l))).toBe(true);
  });

  it('[tabletop ds151 T17 | mode-gap 6] tabletop has no recruit path; its fights and chips are unchanged', () => {
    expect(T.input(17)).toBe('Talk to Brannoc Hask');
    const s = T.after(17);
    const r = turn(s, recruitChip('Brannoc Hask'));
    expect(recruitedCompanions(r.state)).toEqual([]);
    expect(r.status.some((l) => l.startsWith('Companion:'))).toBe(false);
    expect(recruitPad(s)).toBeNull();
    expect(partyHeading(s)).toBeNull();
  });

  it('[all three tapes | mode-gap 6] nobody recruits on the tapes, so no companion line appears anywhere', () => {
    for (const r of [L, R, T]) {
      expect(allStatus(r)).not.toMatch(/^Companion:/m);
      expect(recruitedCompanions(r.after(r.turns()[r.turns().length - 1]!))).toEqual([]);
    }
  });
});
