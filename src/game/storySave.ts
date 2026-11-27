/**
 * Optional checkpoints at a story beat. Each point stores a save-file snapshot.
 * Loading one restores that whole game and drops every later turn.
 * PYOA does not use these points.
 *
 * Also owns one-time campaign-name encoding repair: Windows-1252 mojibake of UTF-8
 * (for example â€" → —) and moving a baked-in start date onto storyStartedAt.
 */
import type { GameState, StorySavePoint } from './types';
import { saveFileProblem } from './schemas';

export const LOAD_LOSES_LATER = 'Loading this save drops every turn after it.';
const SNAPSHOT_CAP = 48_000;
const POINT_CAP = 3;

/**
 * Unicode code points that Windows-1252 maps onto bytes 0x80–0x9F.
 * Used only to reverse a mojibake re-encode (UTF-8 bytes read as Windows-1252).
 */
const WIN1252_REVERSE = new Map<number, number>([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

function win1252Byte(codePoint: number): number | null {
  if (codePoint <= 0xff) return codePoint;
  return WIN1252_REVERSE.get(codePoint) ?? null;
}

/**
 * Re-decode text that was UTF-8 bytes misread as Windows-1252 (or latin1 for ASCII/C1).
 * Returns null when the string is not a full Windows-1252 code-unit sequence or the
 * byte sequence is not valid UTF-8 — callers keep the original.
 */
export function redecodeWin1252AsUtf8(input: string): string | null {
  if (!input) return null;
  const bytes: number[] = [];
  for (const ch of input) {
    const cp = ch.codePointAt(0);
    if (cp == null) return null;
    const b = win1252Byte(cp);
    if (b == null) return null;
    bytes.push(b);
  }
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes));
    return decoded === input ? null : decoded;
  } catch {
    return null;
  }
}

/** Split "Title — 17 Oct 2026" into title + optional start ms (em dash or en dash). */
export function splitStoryNameAndDate(raw: string): { title: string; startedAt?: number } {
  const trimmed = raw.trim();
  const m = trimmed.match(/^(.*)\s+[—–]\s+(.+)$/u);
  if (!m) return { title: trimmed };
  const title = m[1]!.trim();
  const datePart = m[2]!.trim();
  const parsed = Date.parse(datePart);
  if (!title || !Number.isFinite(parsed)) return { title: trimmed };
  return { title, startedAt: parsed };
}

/**
 * One-time repair for old saves: re-decode mojibake in storyName, move a baked-in
 * start date onto storyStartedAt, and leave a clean title in storyName.
 */
export function repairCampaignStoryName(state: GameState): GameState {
  const raw = state.storyName ?? '';
  const decoded = redecodeWin1252AsUtf8(raw) ?? raw;
  const { title, startedAt: fromName } = splitStoryNameAndDate(decoded);
  const storyStartedAt = state.storyStartedAt ?? fromName ?? state.lastUpdated;
  if (title === raw && storyStartedAt === state.storyStartedAt) return state;
  return {
    ...state,
    storyName: title || raw,
    storyStartedAt,
  };
}

function slim(state: GameState): GameState {
  const { storySavePoints: _points, ...rest } = state;
  return {
    ...rest,
    log: (state.log ?? []).slice(-12).map((row) => ({ ...row, content: (row.content ?? '').slice(0, 180) })),
    stateTxLog: (state.stateTxLog ?? []).slice(-12),
  };
}

/** The same shape saveGame stores: character and log, small enough to sit beside an autosave. */
export function storySnapshot(state: GameState): string {
  const full = slim(state);
  const raw = JSON.stringify(full);
  if (!saveFileProblem(full) && raw.length <= SNAPSHOT_CAP) return raw;
  const tighter: GameState = { ...full, log: (full.log ?? []).slice(-4) };
  const again = JSON.stringify(tighter);
  if (!saveFileProblem(tighter) && again.length <= SNAPSHOT_CAP) return again;
  return '';
}

export function markStorySavePoint(state: GameState, beat: string): GameState {
  if (state.engineMode === 'pyoa') return state;
  const snapshot = storySnapshot(state);
  if (!snapshot) return state;
  const point: StorySavePoint = {
    id: `save-${state.turn ?? 0}-${(beat || 'beat').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
    beat: beat.slice(0, 80),
    turn: state.turn ?? 0,
    snapshot,
  };
  return { ...state, storySavePoints: [...(state.storySavePoints ?? []), point].slice(-POINT_CAP) };
}

export function loadStorySavePoint(state: GameState, id: string): { state: GameState; warning: string } {
  const point = (state.storySavePoints ?? []).find((p) => p.id === id);
  if (!point || state.engineMode === 'pyoa') return { state, warning: '' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(point.snapshot);
  } catch {
    return { state, warning: '' };
  }
  if (saveFileProblem(parsed)) return { state, warning: '' };
  return { warning: LOAD_LOSES_LATER, state: parsed as GameState };
}
