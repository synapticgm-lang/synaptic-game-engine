/**
 * Order K: promises, deals and agreements as one commitment (the widened PromiseRecord), taken from the
 * turn record (stateTx rows the engine wrote this turn), never from the beat's prose.
 *
 * K1: record + sourcing. A quest the player takes on from a named giver is a promise to that giver; a world deal
 * is a deal with its partner. A condition is set only when it maps onto an engine-tracked thing (the quest, the
 * deal), so the engine can later decide kept or broken.
 */
import type { Commitment, GameState } from './types';
import { shiftStoredRelationship } from './npcRelationships';

/** Trust moved when a commitment is kept or broken (the existing PromiseRecord deltas). */
export const COMMITMENT_TRUST = { keep: 5, break: -8 } as const;

const low = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

export function openCommitments(state: GameState): Commitment[] {
  return (state.commitments ?? []).filter((c) => c.status === 'open');
}

/** Open commitments owed to anyone in `people` (by name). */
export function openCommitmentsFor(state: GameState, people: readonly string[]): Commitment[] {
  const names = new Set(people.map(low).filter(Boolean));
  return openCommitments(state).filter((c) => !!c.to && names.has(low(c.to)));
}

/** One ledger line for a commitment ("Promise to Joe Bloggs: Clear the cellar"). */
export function commitmentLine(c: Commitment): string {
  const kind = c.kind === 'deal' ? 'Deal' : c.kind === 'agreement' ? 'Agreement' : 'Promise';
  return `${kind} to ${c.to ?? 'someone'}: ${c.description}`;
}

function base(id: string, turn: number, to: string, description: string): Commitment {
  return {
    promiseId: id,
    madeTurn: turn,
    description,
    status: 'open',
    trustDeltaOnKeep: COMMITMENT_TRUST.keep,
    trustDeltaOnBreak: COMMITMENT_TRUST.break,
    beneficiaries: [to],
    witnesses: [],
    by: 'player',
    to,
  };
}

/**
 * Record this turn's commitments from the turn record: each quest_reveal row for a quest with a giver, and each
 * active world deal that has no commitment yet (the deal then points at its commitment by id).
 */
export function recordTurnCommitments(state: GameState): GameState {
  const turn = state.turn ?? 0;
  const list = [...(state.commitments ?? [])];
  const have = new Set(list.map((c) => c.promiseId));
  let changed = false;
  for (const tx of state.stateTxLog ?? []) {
    if (tx.turn !== turn || tx.kind !== 'quest_reveal') continue;
    const quest = (state.quests ?? []).find((q) => q.name === tx.entity);
    const giver = (quest?.giver ?? '').trim();
    if (!quest || !giver) continue;
    const id = `quest:${quest.id}`;
    if (have.has(id)) continue;
    have.add(id);
    list.push({ ...base(id, turn, giver, quest.name), kind: 'promise', condition: { type: 'quest-complete', questId: quest.id } });
    changed = true;
  }
  const ledger = state.worldLedger;
  let deals = ledger?.deals;
  if (ledger && deals?.some((d) => d.active && !d.commitmentId)) {
    deals = deals.map((d) => {
      if (!d.active || d.commitmentId) return d;
      const id = `deal:${d.id}`;
      if (!have.has(id)) {
        have.add(id);
        list.push({ ...base(id, turn, d.partnerName, d.name), kind: 'deal', condition: { type: 'deal-runs', dealId: d.id } });
      }
      return { ...d, commitmentId: id };
    });
    changed = true;
  }
  if (!changed) return state;
  return { ...state, commitments: list, ...(ledger && deals !== ledger.deals ? { worldLedger: { ...ledger, deals: deals! } } : {}) };
}

// ---------------------------------------------------------------------------------------------------------------
// K2: the engine check. It runs every COMMITMENT_CHECK_EVERY turns and on any turn whose record holds an event
// (quest complete/fail, combat, an item change, travel). The engine decides; prose never moves a commitment.

export const COMMITMENT_CHECK_EVERY = 3;

const EVENT_KINDS: ReadonlySet<string> = new Set([
  'quest_complete',
  'quest_fail',
  'combat',
  'inventory_gain',
  'inventory_loss',
  'location',
]);

type Verdict = 'kept' | 'broken' | 'impossible' | 'expired' | null;

function verdict(state: GameState, c: Commitment, turn: number): Verdict {
  const cond = c.condition;
  if (cond?.type === 'quest-complete') {
    const q = (state.quests ?? []).find((x) => x.id === cond.questId);
    if (q?.status === 'completed') return 'kept';
    if (q?.status === 'failed') return 'broken';
    if (!q) return 'impossible';
  }
  if (c.dueTurn != null && turn > c.dueTurn) return 'expired';
  return null;
}

/** The status line for a settled commitment ("Promise kept: You have fulfilled your promise to Joe Bloggs."). */
export function commitmentStatusLine(c: Commitment, status: Exclude<Verdict, null>): string {
  const kind = c.kind === 'deal' ? 'Deal' : c.kind === 'agreement' ? 'Agreement' : 'Promise';
  const noun = kind.toLowerCase();
  const to = c.to ?? 'them';
  if (status === 'kept') return `${kind} kept: You have fulfilled your ${noun} to ${to}.`;
  if (status === 'expired') return `${kind} expired: Your ${noun} to ${to} ran out of time.`;
  if (status === 'impossible') return `${kind} broken: Your ${noun} to ${to} can no longer be kept.`;
  return `${kind} broken: You have broken your ${noun} to ${to}.`;
}

/** Check open commitments against the state; settle the ones the engine can decide, move trust, write status lines. */
export function checkCommitments(state: GameState): { state: GameState; lines: string[] } {
  const open = openCommitments(state);
  if (!open.length) return { state, lines: [] };
  const turn = state.turn ?? 0;
  const event = (state.stateTxLog ?? []).some((t) => t.turn === turn && EVENT_KINDS.has(t.kind));
  const lines: string[] = [];
  let rels = state.arcDirector?.npcRelationships;
  let changed = false;
  const list = (state.commitments ?? []).map((c) => {
    if (c.status !== 'open') return c;
    const due = turn - (c.checkedTurn ?? c.madeTurn) >= COMMITMENT_CHECK_EVERY;
    if (!event && !due) return c;
    changed = true;
    const v = verdict(state, c, turn);
    if (!v) return { ...c, checkedTurn: turn };
    lines.push(commitmentStatusLine(c, v));
    const delta = v === 'kept' ? c.trustDeltaOnKeep : v === 'broken' || v === 'expired' ? c.trustDeltaOnBreak : 0;
    if (delta && c.to && c.to !== 'player' && state.arcDirector) {
      rels = shiftStoredRelationship(rels, c.to, { trust: delta }, turn, v === 'kept' ? 'favor' : 'betrayal').list;
    }
    return { ...c, status: v, checkedTurn: turn };
  });
  if (!changed) return { state, lines };
  const arc = state.arcDirector && rels !== state.arcDirector.npcRelationships ? { arcDirector: { ...state.arcDirector, npcRelationships: rels } } : {};
  return { state: { ...state, commitments: list, ...arc }, lines };
}
