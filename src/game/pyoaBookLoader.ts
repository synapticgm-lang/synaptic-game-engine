/**
 * Multi-book PYOA loader.
 * Adapters:
 *   - Umbra spine shape (startId, bibleId, stake, endingId, variants)
 *   - Pick books (start, slug, kind doom/ending)
 *   - Dice books (dice/rules, check/recovery/reward)
 * Loads from bundled content/pyoa (and src/data/pyoa/umbraBook.json).
 * Validates at load; fails loudly when strict (default in tests/dev).
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import umbraBook from '@/data/pyoa/umbraBook.json';
import { getPyoaBookCatalogEntry, type PyoaBookCatalogEntry } from './pyoaBookCatalog';
import type {
  CompiledPyoaBook,
  PyoaBookExit,
  PyoaBookId,
  PyoaBookNode,
  PyoaDiceRules,
} from './pyoaBookTypes';
import { assertValidPyoaBook, validatePyoaBook } from './pyoaBookValidate';

type RawExit = {
  id?: string;
  label?: string;
  to?: string;
  intent?: string;
  when?: PyoaBookExit['when'];
  setFlags?: Record<string, string | boolean>;
  result?: 'full' | 'mixed' | 'miss';
  cost?: boolean;
  stat?: string;
  target?: number;
  action?: string;
};

type RawNode = {
  id?: string;
  kind?: string;
  page?: string;
  brief?: string;
  title?: string;
  place?: string;
  stake?: string;
  variants?: PyoaBookNode['variants'];
  endingId?: string | null;
  endingKey?: string;
  endingTitle?: string;
  ending?: boolean;
  role?: string;
  check?: PyoaBookNode['check'];
  grant?: string;
  exits?: RawExit[];
};

type RawBook = {
  bibleId?: string;
  title?: string;
  slug?: string;
  startId?: string;
  start?: string;
  dice?: string;
  rules?: PyoaDiceRules;
  nodes?: RawNode[];
  nodeCount?: number;
};

const cache = new Map<string, CompiledPyoaBook>();

function repoRootFromHere(): string {
  // src/game → repo root
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    return resolve(here, '../..');
  } catch {
    return process.cwd();
  }
}

function contentBookPath(folder: string): string {
  const root = repoRootFromHere();
  if (folder === 'umbra') {
    const built = join(root, 'content/pyoa/umbra/book.built.json');
    if (existsSync(built)) return built;
    return join(root, 'src/data/pyoa/umbraBook.json');
  }
  return join(root, 'content/pyoa', folder, 'book.json');
}

function readRawJson(path: string): RawBook {
  const text = readFileSync(path, 'utf8');
  return JSON.parse(text) as RawBook;
}

function exitId(e: RawExit, index: number, nodeId: string): string {
  const raw = (e.id || e.label || e.intent || `x${index}`).toString().trim();
  return raw || `${nodeId}-x${index}`;
}

function exitLabel(e: RawExit): string {
  return (e.label || e.intent || e.id || 'Continue').toString().trim() || 'Continue';
}

function adaptExits(raw: RawExit[] | undefined, nodeId: string): PyoaBookExit[] {
  const out: PyoaBookExit[] = [];
  for (let i = 0; i < (raw?.length ?? 0); i++) {
    const e = raw![i];
    const to = (e.to ?? '').toString().trim();
    if (!to) continue;
    out.push({
      id: exitId(e, i, nodeId),
      label: exitLabel(e),
      to,
      when: e.when,
      setFlags: e.setFlags,
      result: e.result,
      cost: e.cost,
      stat: e.stat,
      target: e.target,
    });
  }
  return out;
}

function isDoomKind(kind: string | undefined, endingId: string | null | undefined): boolean {
  if (kind === 'doom') return true;
  if (endingId && /^doom/i.test(endingId)) return true;
  return false;
}

function isEndingKind(
  kind: string | undefined,
  endingId: string | null | undefined,
  endingFlag?: boolean
): boolean {
  if (endingFlag) return true;
  if (kind === 'ending' || kind === 'ending-part' || kind === 'endingpart') {
    // ending-part chains continue; only terminal ending / Umbra leaf count as ending leaves for UI
    return kind === 'ending' || (!!endingId && kind !== 'ending-part' && kind !== 'endingpart');
  }
  if (endingId && !isDoomKind(kind, endingId)) return true;
  return false;
}

function adaptNode(raw: RawNode, bookType: CompiledPyoaBook['type']): PyoaBookNode | null {
  const id = (raw.id ?? '').toString().trim();
  if (!id) return null;
  const kind = raw.kind;
  const endingIdRaw = raw.endingId ?? null;
  const death =
    isDoomKind(kind, endingIdRaw) || (bookType === 'pick' && kind === 'doom')
      ? endingIdRaw || id
      : null;
  const ending =
    !death && isEndingKind(kind, endingIdRaw, raw.ending)
      ? endingIdRaw || (raw.ending ? id : kind === 'ending' ? id : null)
      : null;

  // Umbra: endingId set, exits empty → ending leaf
  const umbraEnding = !kind && endingIdRaw && !(raw.exits?.length) ? endingIdRaw : null;

  const page =
    (typeof raw.page === 'string' && raw.page.trim() ? raw.page : '') ||
    (typeof raw.brief === 'string' ? raw.brief : '') ||
    (typeof raw.stake === 'string' ? raw.stake : '') ||
    '';

  return {
    id,
    page,
    exits: adaptExits(raw.exits, id),
    kind,
    title: raw.title,
    place: raw.place,
    stake: raw.stake,
    variants: Array.isArray(raw.variants) && raw.variants.length ? raw.variants : undefined,
    endingId: death ? null : ending || umbraEnding,
    deathId: death,
    check: raw.check,
    grant: raw.grant,
    role: raw.role,
    endingKey: raw.endingKey,
    endingTitle: raw.endingTitle,
  };
}

function collectTerminals(nodes: PyoaBookNode[]): { endings: string[]; deaths: string[] } {
  const endings: string[] = [];
  const deaths: string[] = [];
  for (const n of nodes) {
    if (n.deathId) deaths.push(n.id);
    else if (n.endingId) endings.push(n.id);
    else if (n.kind === 'ending' && !n.exits.length) endings.push(n.id);
  }
  return { endings, deaths };
}

export function adaptRawBook(
  raw: RawBook,
  entry: PyoaBookCatalogEntry
): CompiledPyoaBook {
  const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const nodeList: PyoaBookNode[] = [];
  for (const r of rawNodes) {
    const n = adaptNode(r, entry.type);
    if (n) nodeList.push(n);
  }
  const nodes = new Map(nodeList.map((n) => [n.id, n]));
  const { endings, deaths } = collectTerminals(nodeList);

  const startId =
    (raw.startId || raw.start || '').toString().trim() ||
    nodeList[0]?.id ||
    '';

  const title =
    (raw.title && String(raw.title).trim()) ||
    entry.title;

  let diceRules: PyoaDiceRules | undefined;
  if (entry.type === 'dice') {
    const r = raw.rules;
    diceRules = {
      system: '2d6',
      version: r?.version ?? 1,
      stats: r?.stats?.length ? [...r.stats] : ['A', 'B', 'C', 'D'],
      statSpread: r?.statSpread?.length ? [...r.statSpread] : [2, 1, 1, 0],
      stamina: r?.stamina ?? 10,
      luck: r?.luck ?? 3,
      luckMax: r?.luckMax ?? 5,
      targets: (r?.targets as [number, number]) ?? [7, 10],
    };
  }

  return {
    id: entry.id,
    title,
    type: entry.type,
    startId,
    nodes,
    nodeList,
    endings,
    deaths,
    diceRules,
  };
}

function loadUmbraRaw(): RawBook {
  return umbraBook as unknown as RawBook;
}

/** Load raw JSON for a catalog entry (node / vitest). */
export function loadRawPyoaBook(bookId: string): RawBook {
  const entry = getPyoaBookCatalogEntry(bookId);
  if (!entry) throw new Error(`Unknown PYOA book id: ${bookId}`);
  if (entry.id === 'umbra-protocol') {
    // Prefer bundled import (always present in app + tests).
    return loadUmbraRaw();
  }
  const path = contentBookPath(entry.folder);
  if (!existsSync(path)) {
    throw new Error(`PYOA book file missing for ${entry.id}: ${path}`);
  }
  return readRawJson(path);
}

export interface LoadPyoaBookOptions {
  /** When true (default), throw on validation failure. */
  strict?: boolean;
  /** Bypass cache (tests). */
  fresh?: boolean;
  /** Inject raw JSON (unit tests / adapters). */
  raw?: RawBook;
}

/**
 * Load and normalize any of the six authored books.
 * Validates graph (unknown links, missing start, unreachable endings/deaths).
 */
export function loadPyoaBook(
  bookId: string,
  opts: LoadPyoaBookOptions = {}
): CompiledPyoaBook {
  const strict = opts.strict !== false;
  const entry = getPyoaBookCatalogEntry(bookId);
  if (!entry) throw new Error(`Unknown PYOA book id: ${bookId}`);

  if (!opts.fresh && !opts.raw && cache.has(entry.id)) {
    return cache.get(entry.id)!;
  }

  const raw = opts.raw ?? loadRawPyoaBook(entry.id);
  const book = adaptRawBook(raw, entry);

  if (strict) {
    assertValidPyoaBook(book, entry.id);
  } else {
    const v = validatePyoaBook(book);
    if (!v.ok && typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      // Loud in dev without hard-throw when caller set strict:false
      console.error(`[pyoaBookLoader] ${entry.id} validation issues:`, v.issues.slice(0, 12));
    }
  }

  if (!opts.raw) cache.set(entry.id, book);
  return book;
}

/** Clear loader cache (tests). */
export function clearPyoaBookCache(): void {
  cache.clear();
}

export function getCachedPyoaBook(bookId: string): CompiledPyoaBook | undefined {
  const entry = getPyoaBookCatalogEntry(bookId);
  return entry ? cache.get(entry.id) : undefined;
}

export type { PyoaBookId };
