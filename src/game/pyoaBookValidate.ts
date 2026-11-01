/**
 * Loud validation for authored PYOA books: unknown links, missing sections,
 * unreachable endings/deaths. Dev/tests fail when ok is false.
 */

import type {
  CompiledPyoaBook,
  PyoaBookNode,
  PyoaBookValidationIssue,
  PyoaBookValidationResult,
} from './pyoaBookTypes';
import { pyoaCondHolds } from './pyoaCond';

function walkReachable(book: CompiledPyoaBook): Set<string> {
  const seen = new Set<string>();
  const queue: string[] = [book.startId];
  while (queue.length) {
    const id = queue.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const node = book.nodes.get(id);
    if (!node) continue;
    for (const e of node.exits) {
      if (e.to && !seen.has(e.to)) queue.push(e.to);
    }
  }
  return seen;
}

function validateCheckNode(node: PyoaBookNode, issues: PyoaBookValidationIssue[]): void {
  if (node.kind !== 'check' && !node.check) return;
  if (!node.check) {
    issues.push({
      code: 'bad_check',
      message: `Check section ${node.id} missing check block`,
      nodeId: node.id,
    });
    return;
  }
  const { stat, target } = node.check;
  if (!stat || typeof target !== 'number' || target < 7 || target > 10) {
    issues.push({
      code: 'bad_check',
      message: `Check ${node.id} has invalid stat/target`,
      nodeId: node.id,
    });
  }
  const results = node.exits.map((e) => e.result);
  if (
    node.exits.length !== 3 ||
    results[0] !== 'full' ||
    results[1] !== 'mixed' ||
    results[2] !== 'miss'
  ) {
    issues.push({
      code: 'bad_check',
      message: `Check ${node.id} must have exactly three exits full/mixed/miss`,
      nodeId: node.id,
    });
  }
}

/**
 * Validate a compiled book. Does not throw — callers in tests/dev assert `ok`.
 */
export function validatePyoaBook(book: CompiledPyoaBook): PyoaBookValidationResult {
  const issues: PyoaBookValidationIssue[] = [];

  if (!book.nodeList.length) {
    issues.push({ code: 'empty_book', message: `Book ${book.id} has no sections` });
  }
  if (!book.startId || !book.nodes.has(book.startId)) {
    issues.push({
      code: 'missing_start',
      message: `Book ${book.id} start "${book.startId}" is missing`,
      nodeId: book.startId,
    });
  }

  if (book.type === 'dice') {
    if (!book.diceRules || book.diceRules.system !== '2d6') {
      issues.push({ code: 'bad_meta', message: `Dice book ${book.id} missing 2d6 rules block` });
    }
  }

  for (const node of book.nodeList) {
    validateCheckNode(node, issues);
    for (const e of node.exits) {
      if (!e.to) {
        issues.push({
          code: 'unknown_link',
          message: `Section ${node.id} has exit with empty target`,
          nodeId: node.id,
        });
        continue;
      }
      if (!book.nodes.has(e.to)) {
        issues.push({
          code: 'unknown_link',
          message: `Section ${node.id} links to missing "${e.to}"`,
          nodeId: node.id,
          to: e.to,
        });
      }
    }
  }

  const reachable = book.nodes.has(book.startId) ? walkReachable(book) : new Set<string>();

  // Every node id referenced should exist (already checked). Flag orphans that
  // look like endings/deaths but cannot be reached from start.
  const unreachableEndingIds: string[] = [];
  const unreachableDeathIds: string[] = [];
  for (const id of book.endings) {
    if (!book.nodes.has(id)) {
      issues.push({
        code: 'missing_section',
        message: `Ending id "${id}" has no section`,
        nodeId: id,
      });
    } else if (!reachable.has(id)) {
      unreachableEndingIds.push(id);
      issues.push({
        code: 'unreachable_ending',
        message: `Ending "${id}" is unreachable from start`,
        nodeId: id,
      });
    }
  }
  for (const id of book.deaths) {
    if (!book.nodes.has(id)) {
      issues.push({
        code: 'missing_section',
        message: `Death id "${id}" has no section`,
        nodeId: id,
      });
    } else if (!reachable.has(id)) {
      unreachableDeathIds.push(id);
      issues.push({
        code: 'unreachable_death',
        message: `Death "${id}" is unreachable from start`,
        nodeId: id,
      });
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    sectionCount: book.nodeList.length,
    endingCount: book.endings.length,
    deathCount: book.deaths.length,
    unreachableEndingIds,
    unreachableDeathIds,
  };
}

/** Throw with a compact message — for loaders in strict/dev mode. */
export function assertValidPyoaBook(book: CompiledPyoaBook, label = book.id): void {
  const result = validatePyoaBook(book);
  if (result.ok) return;
  const head = result.issues
    .slice(0, 8)
    .map((i) => i.message)
    .join('; ');
  throw new Error(
    `PYOA book "${label}" failed validation (${result.issues.length} issue(s)): ${head}`
  );
}

/** Smoke: at least one ending is reachable under empty flags (ungated path or any exit). */
export function bookHasReachableEnding(book: CompiledPyoaBook): boolean {
  const reachable = walkReachable(book);
  return book.endings.some((id) => reachable.has(id));
}

/** Legal player-facing exits for a node given flags (skips check-* lanes). */
export function playerFacingExits(
  node: PyoaBookNode | undefined,
  flags: Record<string, string | boolean>
): PyoaBookNode['exits'] {
  if (!node) return [];
  if (node.endingId || node.deathId) return [];
  if (node.check) return []; // dice engine owns the three result lanes
  const gated = node.exits.filter((e) => !e.result && pyoaCondHolds(e.when, flags));
  if (gated.length) return gated;
  const ungated = node.exits.filter((e) => !e.result && !e.when);
  if (ungated.length) return ungated;
  return node.exits.filter((e) => !e.result);
}
