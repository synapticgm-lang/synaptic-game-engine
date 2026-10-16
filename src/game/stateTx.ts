/**
 * StateTx — append-only ledger of high-impact world changes.
 * Authority: accepted transactions beat draft invention; HUD/prose should reconcile to this log.
 */

import type { GameState, Item, Quest } from './types';
import { grantEarnedInspiration } from './rules/houseRules';
import { checkCommitments, recordTurnCommitments } from './commitments';

export type StateTxKind =
  | 'inventory_gain'
  | 'inventory_lose'
  | 'inventory_equip'
  | 'hp'
  | 'mp'
  | 'condition'
  | 'inspiration'
  | 'presence'
  | 'location'
  | 'quest_reveal'
  | 'quest_complete'
  | 'quest_fail'
  | 'quest_stage'
  | 'beat_commit'
  | 'combat'
  | 'open_ask'
  | 'correction'
  | 'social_crisis_commit'
  | 'leverage_consumed'
  | 'other';

export interface BeatStateTxExtras {
  beatId: string;
  eventSeq: number;
  why: string;
  questStage?: string;
  /** A foe that went live this commit. */
  encounterName?: string;
  /** A foe parked off-page: not a fight until the story shows it. */
  threatName?: string;
}

export interface StateTx {
  id: string;
  rev: number;
  turn: number;
  kind: StateTxKind;
  /** Short player-facing receipt. */
  summary: string;
  /** Entity name/id when relevant. */
  entity?: string;
  /** Why this is true (provenance for Simple Why?). */
  why?: string;
  createdAt: number;
}

const MAX_TX = 80;

export function emptyStateTxLog(): StateTx[] {
  return [];
}

function uid(): string {
  return crypto.randomUUID();
}

function pushTx(log: StateTx[], tx: Omit<StateTx, 'id' | 'createdAt'>): StateTx[] {
  return [
    ...log,
    { ...tx, id: uid(), createdAt: Date.now() },
  ].slice(-MAX_TX);
}

function itemKey(i: Item): string {
  return `${i.id}|${i.name}|${i.quantity}|${i.equipped ? 1 : 0}`;
}

function questSig(q: Quest): string {
  return `${q.id}|${q.status}|${q.revealed ? 1 : 0}|${(q.objectives ?? []).map((o) => (o.completed ? 1 : 0)).join('')}`;
}

/**
 * Diff previous → next and append StateTx rows for inventory / HP / presence / quests / combat.
 */
export function appendStateTxDiff(
  previous: GameState,
  next: GameState,
  extras?: { combatSummary?: string; why?: string }
): GameState {
  const rev = Math.max(0, next.ledgerRevision ?? previous.ledgerRevision ?? 0);
  const turn = next.turn;
  let log = [...(next.stateTxLog ?? previous.stateTxLog ?? [])];
  const whyBase = extras?.why ?? `Accepted turn ${turn}`;

  // HP
  const hpPrev = previous.character?.hp ?? 0;
  const hpNext = next.character?.hp ?? 0;
  if (hpNext !== hpPrev) {
    const d = hpNext - hpPrev;
    log = pushTx(log, {
      rev,
      turn,
      kind: 'hp',
      summary: d < 0 ? `HP ${d}` : `HP +${d}`,
      entity: 'player',
      why: extras?.combatSummary || whyBase,
    });
  }

  const mpPrev = previous.character?.mp ?? 0;
  const mpNext = next.character?.mp ?? 0;
  if (mpNext !== mpPrev) {
    const d = mpNext - mpPrev;
    log = pushTx(log, {
      rev,
      turn,
      kind: 'mp',
      summary: d < 0 ? `MP ${d}` : `MP +${d}`,
      entity: 'player',
      why: whyBase,
    });
  }

  // Conditions the character gained.
  const condPrev = new Set((previous.character?.conditions ?? []).map((c) => c.toLowerCase()));
  for (const c of next.character?.conditions ?? []) {
    if (condPrev.has(c.toLowerCase())) continue;
    log = pushTx(log, { rev, turn, kind: 'condition', summary: `Condition: ${c}`, entity: c, why: extras?.combatSummary || whyBase });
  }

  // Inventory
  const prevMap = new Map((previous.inventory ?? []).map((i) => [i.id, i]));
  const nextMap = new Map((next.inventory ?? []).map((i) => [i.id, i]));
  for (const [id, item] of nextMap) {
    const before = prevMap.get(id);
    if (!before) {
      log = pushTx(log, {
        rev,
        turn,
        kind: 'inventory_gain',
        summary: `Gained ${item.name}`,
        entity: item.name,
        why: item.provenance || whyBase,
      });
    } else if (itemKey(before) !== itemKey(item)) {
      if (!!before.equipped !== !!item.equipped) {
        log = pushTx(log, {
          rev,
          turn,
          kind: 'inventory_equip',
          summary: item.equipped ? `Equipped ${item.name}` : `Unequipped ${item.name}`,
          entity: item.name,
          why: whyBase,
        });
      }
      if ((before.quantity ?? 1) > (item.quantity ?? 1)) {
        log = pushTx(log, {
          rev,
          turn,
          kind: 'inventory_lose',
          summary: `Used/lost ${item.name}`,
          entity: item.name,
          why: whyBase,
        });
      }
    }
  }
  for (const [id, item] of prevMap) {
    if (!nextMap.has(id)) {
      log = pushTx(log, {
        rev,
        turn,
        kind: 'inventory_lose',
        summary: `Lost ${item.name}`,
        entity: item.name,
        why: whyBase,
      });
    }
  }

  // Location
  const locPrev = (previous.currentLocation ?? '').trim();
  const locNext = (next.currentLocation ?? '').trim();
  if (locNext && locNext !== locPrev) {
    log = pushTx(log, {
      rev,
      turn,
      kind: 'location',
      summary: `Moved to ${locNext}`,
      entity: locNext,
      why: whyBase,
    });
  }

  // Presence (sceneFacts.present)
  const presentPrev = new Set((previous.sceneFacts?.present ?? []).map((p) => p.trim().toLowerCase()));
  for (const who of next.sceneFacts?.present ?? []) {
    const key = who.trim().toLowerCase();
    if (key && !presentPrev.has(key)) {
      log = pushTx(log, {
        rev,
        turn,
        kind: 'presence',
        summary: `${who} is present`,
        entity: who,
        why: whyBase,
      });
    }
  }

  // Quests
  const qPrev = new Map((previous.quests ?? []).map((q) => [q.id, q]));
  for (const q of next.quests ?? []) {
    const before = qPrev.get(q.id);
    if (!before) {
      if (q.revealed && q.status !== 'hidden') {
        log = pushTx(log, {
          rev,
          turn,
          kind: 'quest_reveal',
          summary: `Quest unlocked: ${q.name}`,
          entity: q.name,
          why: q.provenance || whyBase,
        });
      }
      continue;
    }
    if (questSig(before) === questSig(q)) continue;
    if (!before.revealed && q.revealed) {
      log = pushTx(log, {
        rev,
        turn,
        kind: 'quest_reveal',
        summary: `Quest unlocked: ${q.name}`,
        entity: q.name,
        why: q.provenance || whyBase,
      });
    }
    if (before.status !== 'completed' && q.status === 'completed') {
      log = pushTx(log, {
        rev,
        turn,
        kind: 'quest_complete',
        summary: `Quest complete: ${q.name}`,
        entity: q.name,
        why: whyBase,
      });
    }
    if (before.status !== 'failed' && q.status === 'failed') {
      log = pushTx(log, {
        rev,
        turn,
        kind: 'quest_fail',
        summary: `Quest failed: ${q.name}`,
        entity: q.name,
        why: whyBase,
      });
    }
  }

  // Heroic Inspiration: the sheet gaining it, or a milestone that earned it while one is already held.
  const freshKeys = previous.inspirationKeys
    ? (next.inspirationKeys ?? []).filter((k) => !previous.inspirationKeys!.includes(k))
    : [];
  const gainedInspiration = !previous.character?.heroicInspiration && !!next.character?.heroicInspiration;
  if (next.character?.heroicInspiration && (gainedInspiration || freshKeys.length)) {
    const held = gainedInspiration ? 'yours' : 'already held';
    const why = [...new Set(freshKeys.map((k) => INSPIRATION_REASON[k.split(':')[0]!]).filter(Boolean))].join(', ');
    log = pushTx(log, {
      rev,
      turn,
      kind: 'inspiration',
      summary: `Heroic Inspiration: ${held}${why ? ` (${why})` : ''}`,
      entity: `Heroic Inspiration: ${held}`,
      why: freshKeys.join(', ') || whyBase,
    });
  }

  if (extras?.combatSummary) {
    log = pushTx(log, {
      rev,
      turn,
      kind: 'combat',
      summary: extras.combatSummary.slice(0, 160),
      why: whyBase,
    });
  }

  return { ...next, stateTxLog: log };
}

/** What earned a Heroic Inspiration, by milestone key prefix (rules/houseRules INSPIRING). */
const INSPIRATION_REASON: Record<string, string> = { 'quest-complete': 'quest complete', 'spine-ending': 'ending reached' };

/** Record rows that are something the engine granted or settled for the player. */
const GRANT_KINDS: ReadonlySet<StateTxKind> = new Set<StateTxKind>([
  'quest_reveal',
  'quest_complete',
  'quest_fail',
  'inventory_gain',
  'condition',
  'inspiration',
]);

/** A quest row is named by its whole line; an item, condition or inspiration row by what was granted. */
function grantStatusKey(t: StateTx): string {
  return (t.kind.startsWith('quest_') ? t.summary : t.entity ?? t.summary).toLowerCase();
}

/**
 * tt-fix-9 — the end-of-turn commit both play paths share (live `useGame`, headless `fateAutoplay`). Heroic
 * Inspiration a milestone earned this turn is granted now (tabletop), the turn is diffed onto the record, and
 * every grant the record holds for this turn becomes a STATUS line. A grant a line already shown this turn
 * names is not said twice.
 */
export function commitTurnRecord(
  previous: GameState,
  next: GameState,
  shown: string[],
  extras?: { combatSummary?: string; why?: string }
): { state: GameState; lines: string[] } {
  const earned = next.engineMode === 'dnd' ? grantEarnedInspiration(next) : next;
  // Order K: this turn's commitments come from the rows just written (the turn record), not from prose.
  const recorded = recordTurnCommitments(appendStateTxDiff(previous, earned, extras));
  // Order K2: the engine settles commitments (every 3 turns and on events); its status lines join this turn's.
  const checked = checkCommitments(recorded);
  const state = checked.state;
  const said = shown.join('\n').toLowerCase();
  const lines = (state.stateTxLog ?? [])
    .filter((t) => t.turn === state.turn && GRANT_KINDS.has(t.kind) && !said.includes(grantStatusKey(t)))
    .map((t) => t.summary);
  return { state, lines: [...new Set([...lines, ...checked.lines])] };
}

/** Append authoritative beat commit before GM prose (ArcDirector). */
export function pushBeatStateTx(
  state: GameState,
  summary: string,
  extras: BeatStateTxExtras,
  /** GM response turn (defaults to state.turn + 1 when arc runs pre-commit). */
  turnOverride?: number
): GameState {
  const rev = Math.max(0, state.ledgerRevision ?? 0);
  const turn = turnOverride ?? state.turn + 1;
  let log = [...(state.stateTxLog ?? [])];
  log = pushTx(log, {
    rev,
    turn,
    kind: 'beat_commit',
    summary: summary.slice(0, 160),
    entity: extras.beatId,
    why: `${extras.why} (seq ${extras.eventSeq})`,
  });
  if (extras.questStage) {
    log = pushTx(log, {
      rev,
      turn,
      kind: 'quest_stage',
      summary: extras.questStage.slice(0, 160),
      entity: extras.beatId,
      why: extras.why,
    });
  }
  if (extras.encounterName) {
    log = pushTx(log, {
      rev,
      turn,
      kind: 'combat',
      summary: `Encounter started: ${extras.encounterName}`,
      entity: extras.encounterName,
      why: extras.why,
    });
  }
  if (extras.threatName) {
    log = pushTx(log, {
      rev,
      turn,
      kind: 'other',
      summary: `Threat building: ${extras.threatName}`,
      entity: extras.threatName,
      why: extras.why,
    });
  }
  return { ...state, stateTxLog: log };
}

/** A fight round the engine rolled before GM prose (lands on the GM response turn, like a beat commit). */
export function pushCombatStateTx(state: GameState, summary: string, entity: string, why: string): GameState {
  const log = pushTx([...(state.stateTxLog ?? [])], {
    rev: Math.max(0, state.ledgerRevision ?? 0),
    turn: state.turn + 1,
    kind: 'combat',
    summary: summary.slice(0, 160),
    entity,
    why,
  });
  return { ...state, stateTxLog: log };
}

/** Latest few player-facing receipts (for HUD / TurnConfirmBar). */
export function recentStateTxReceipts(state: GameState, limit = 4): string[] {
  return (state.stateTxLog ?? [])
    .slice(-limit)
    .map((t) => t.summary)
    .filter(Boolean);
}

/** Simple Why? — explain the most recent fact matching a name, or last tx. */
export function explainWhy(state: GameState, query?: string): string {
  const log = state.stateTxLog ?? [];
  if (!log.length) return 'No ledger changes recorded yet.';
  const q = query?.trim().toLowerCase();
  if (q) {
    const hit = [...log].reverse().find(
      (t) =>
        t.entity?.toLowerCase().includes(q)
        || t.summary.toLowerCase().includes(q)
    );
    if (hit) {
      return hit.why
        ? `${hit.summary} — ${hit.why}`
        : `${hit.summary} (accepted on turn ${hit.turn}, revision ${hit.rev}).`;
    }
  }
  const last = log[log.length - 1];
  return last.why
    ? `${last.summary} — ${last.why}`
    : `${last.summary} (turn ${last.turn}).`;
}
