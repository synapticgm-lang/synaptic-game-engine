/**
 * Comic image job identity — revision-scoped idempotency.
 * Key shape: gameId + turnId + beatRevision + panelIndex + attemptClass
 */

export type ComicAttemptClass = 'initial' | 'transport-retry' | 'semantic-repair';

export interface ComicJobIdentity {
  gameId: string;
  turnId: string;
  beatRevision: number;
  panelIndex: number;
  attemptClass: ComicAttemptClass;
}

export function buildComicJobKey(id: ComicJobIdentity): string {
  return [
    id.gameId.trim() || 'unknown',
    id.turnId.trim() || 'unknown',
    String(Math.max(0, Math.floor(id.beatRevision))),
    String(Math.max(0, Math.floor(id.panelIndex))),
    id.attemptClass,
  ].join('|');
}

export function parseComicJobKey(key: string): ComicJobIdentity | null {
  const parts = key.split('|');
  if (parts.length !== 5) return null;
  const beatRevision = Number(parts[2]);
  const panelIndex = Number(parts[3]);
  if (!Number.isFinite(beatRevision) || !Number.isFinite(panelIndex)) return null;
  const attemptClass = parts[4] as ComicAttemptClass;
  if (
    attemptClass !== 'initial'
    && attemptClass !== 'transport-retry'
    && attemptClass !== 'semantic-repair'
  ) {
    return null;
  }
  return {
    gameId: parts[0],
    turnId: parts[1],
    beatRevision,
    panelIndex,
    attemptClass,
  };
}

/** Late/stale results must never attach when the beat revision moved on. */
export function shouldAttachComicResult(opts: {
  jobBeatRevision: number;
  currentBeatRevision: number;
}): boolean {
  return opts.jobBeatRevision === opts.currentBeatRevision;
}

/** In-session reservation map — prevents double debit for the same logical job key. */
const reservedKeys = new Map<string, { reservedAt: number; spent: boolean }>();

export function reserveComicJobKey(key: string): { ok: boolean; alreadyReserved: boolean } {
  const existing = reservedKeys.get(key);
  if (existing) {
    return { ok: false, alreadyReserved: true };
  }
  reservedKeys.set(key, { reservedAt: Date.now(), spent: false });
  return { ok: true, alreadyReserved: false };
}

export function markComicJobSpent(key: string): void {
  const existing = reservedKeys.get(key);
  if (existing) {
    reservedKeys.set(key, { ...existing, spent: true });
  } else {
    reservedKeys.set(key, { reservedAt: Date.now(), spent: true });
  }
}

export function releaseComicJobKey(key: string): void {
  reservedKeys.delete(key);
}

export function isComicJobSpent(key: string): boolean {
  return reservedKeys.get(key)?.spent === true;
}

/** Test-only reset. */
export function __resetComicJobReservationsForTests(): void {
  reservedKeys.clear();
}
