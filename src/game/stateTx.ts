/**
 * StateTx — append-only ledger of high-impact world changes.
 * Authority: accepted transactions beat draft invention; HUD/prose should reconcile to this log.
 */

import type { GameState, Item, Quest } from './types';

export type StateTxKind =
  | 'inventory_gain'
  | 'inventory_lose'
  | 'inventory_equip'
  | 'hp'
  | 'mp'
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
  | 'other';

export interface BeatStateTxExtras {
  beatId: string;
  eventSeq: number;
  why: string;
  questStage?: string;
  encounterName?: string;
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
