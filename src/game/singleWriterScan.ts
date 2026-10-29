/**
 * AST single-writer scan (T10SM1). Ports scripts/audit-writers.cjs for vitest.
 * A writer of field F is: (a) `x.F = …` / compound assign, or (b) property F inside
 * an object literal that also has a spread (a state patch).
 *
 * Pure copies are not writers: `F: expr.F` / `F: expr?.F` (same name on the RHS).
 * Also ignored: `F: expr.F ?? []` / `F: expr?.F ?? fallback` when the left of ?? is a
 * same-field stateish read (read-only copy into a derived shape).
 *
 * Process-level cache: each file is parse+visit at most once per mtime/size; hits for
 * ALL guarded fields are stored, then filtered by the requested field set.
 *
 * Ignores: `*.test.ts(x)`, `*.d.ts`, `src/game/__fixtures__/**`.
 * Does NOT ignore fateAutoplay.ts (T10SM1 Stage 0 — harness stays in the allow-list until routed).
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { GUARDED_FIELDS } from './singleWriterAllow';

export type WriterHit = { file: string; line: number; kind: 'assign' | 'patch'; field: string };

const ROOTS = ['src'];

/** Per-file writer hits for every guarded field (cache value). */
type FileScan = { mtimeMs: number; size: number; hits: WriterHit[] };

const fileCache = new Map<string, FileScan>();
let fileListCache: { key: string; files: string[] } | null = null;

function walkFiles(dir: string, out: string[]): void {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (/node_modules|__tests__|__fixtures__/.test(p.replace(/\\/g, '/'))) continue;
      walkFiles(p, out);
    } else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$|\.d\.ts$/.test(e.name)) {
      out.push(p);
    }
  }
}

function listSourceFiles(): string[] {
  const roots = ROOTS.filter((r) => fs.existsSync(r));
  const key = roots
    .map((r) => {
      try {
        const st = fs.statSync(r);
        return `${r}:${st.mtimeMs}:${st.size}`;
      } catch {
        return r;
      }
    })
    .join('|');
  if (fileListCache?.key === key) return fileListCache.files;
  const files: string[] = [];
  for (const root of roots) walkFiles(root, files);
  files.sort();
  fileListCache = { key, files };
  return files;
}

function propName(name: ts.PropertyName | undefined): string | null {
  if (!name) return null;
  if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return null;
}

/**
 * RHS is a read of the same field from prior state (not a computed helper).
 * E.g. `{ ...facts, present: prev.present }` — NOT `{ playPhase: phase.playPhase }`.
 */
const STATEISH_ROOT =
  /^(prev|state|next|base|facts|sf|existing|current|input|before|after|from|old|src|s|st|mem|memory|rec|record|snap|copy|orig|original|prior|saved|draft)$/i;

function unwrap(expr: ts.Expression): ts.Expression {
  let e = expr;
  while (
    ts.isAsExpression(e)
    || ts.isSatisfiesExpression(e)
    || ts.isParenthesizedExpression(e)
    || ts.isNonNullExpression(e)
  ) {
    e = e.expression;
  }
  return e;
}

function expressionRootName(expr: ts.Expression): string | null {
  let e: ts.Expression = expr;
  for (;;) {
    e = unwrap(e);
    if (ts.isPropertyAccessExpression(e) || ts.isPropertyAccessChain(e)) {
      e = e.expression;
      continue;
    }
    if (ts.isElementAccessExpression(e) || ts.isElementAccessChain(e)) {
      e = e.expression;
      continue;
    }
    if (ts.isCallExpression(e) || ts.isCallChain(e)) return null;
    if (ts.isIdentifier(e)) return e.text;
    return null;
  }
}

/** Last identifier in a property chain (`state.sceneFacts.present` → `present`). */
function lastPropertyName(expr: ts.Expression): string | null {
  const e = unwrap(expr);
  if (ts.isPropertyAccessExpression(e) || (ts.isPropertyAccessChain(e) && e.name && ts.isIdentifier(e.name))) {
    return e.name.text;
  }
  return null;
}

/**
 * True when init is a same-field stateish read, optionally with `?? fallback`
 * (read-only copy into a derived/temporary object — not a state write).
 */
function isPureFieldCopy(field: string, init: ts.Expression | undefined): boolean {
  if (!init) return false;
  let expr = unwrap(init);
  // `state.sceneFacts?.present ?? []` — still a copy of the field when left of ?? matches.
  if (ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
    expr = unwrap(expr.left);
  }
  if (lastPropertyName(expr) !== field) return false;
  const root = expressionRootName(expr);
  return !!root && STATEISH_ROOT.test(root);
}

const ALL_GUARDED = new Set<string>(GUARDED_FIELDS as readonly string[]);

function toPosixRel(file: string): string {
  const abs = path.resolve(file);
  const rel = path.relative(process.cwd(), abs);
  return rel.replace(/\\/g, '/');
}

function scanFileRaw(absPath: string): WriterHit[] {
  const text = fs.readFileSync(absPath, 'utf8');
  // Per-file createSourceFile only — never ts.createProgram (no typecheck).
  const sf = ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, true);
  const hits: WriterHit[] = [];
  const rel = toPosixRel(absPath);

  const rec = (name: string, node: ts.Node, kind: 'assign' | 'patch') => {
    if (!ALL_GUARDED.has(name)) return;
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    hits.push({ file: rel, line: line + 1, kind, field: name });
  };

  const visit = (n: ts.Node) => {
    if (ts.isBinaryExpression(n)) {
      const op = n.operatorToken.kind;
      const isAssign =
        op === ts.SyntaxKind.EqualsToken
        || (op >= ts.SyntaxKind.PlusEqualsToken && op <= ts.SyntaxKind.CaretEqualsToken);
      if (isAssign) {
        const l = n.left;
        if (ts.isPropertyAccessExpression(l)) rec(l.name.text, n, 'assign');
        else if (ts.isElementAccessExpression(l) && ts.isStringLiteral(l.argumentExpression)) {
          rec(l.argumentExpression.text, n, 'assign');
        }
      }
    }
    if (ts.isObjectLiteralExpression(n)) {
      const hasSpread = n.properties.some((p) => ts.isSpreadAssignment(p));
      if (hasSpread) {
        for (const p of n.properties) {
          if (ts.isSpreadAssignment(p)) continue;
          const nm = propName(
            ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p) || ts.isMethodDeclaration(p)
              ? p.name
              : undefined
          );
          if (!nm) continue;
          if (ts.isShorthandPropertyAssignment(p)) {
            // shorthand `present` in a spread object is a write of whatever local `present` is —
            // treat as writer (may be a new value). Pure same-field copies use `present: x.present`.
            rec(nm, p, 'patch');
          } else if (ts.isPropertyAssignment(p)) {
            if (isPureFieldCopy(nm, p.initializer)) continue;
            rec(nm, p, 'patch');
          }
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return hits;
}

function cachedFileHits(file: string): WriterHit[] {
  const abs = path.resolve(file);
  const st = fs.statSync(abs);
  const prev = fileCache.get(abs);
  if (prev && prev.mtimeMs === st.mtimeMs && prev.size === st.size) return prev.hits;
  const hits = scanFileRaw(abs);
  fileCache.set(abs, { mtimeMs: st.mtimeMs, size: st.size, hits });
  return hits;
}

/** Scan src/ for writers of the given field names. Deterministic; sorted. Uses process cache. */
export function scanWriters(fieldNames: string[]): WriterHit[] {
  const fields = new Set(fieldNames);
  const files = listSourceFiles();
  const all: WriterHit[] = [];
  for (const f of files) {
    for (const h of cachedFileHits(f)) {
      if (fields.has(h.field)) all.push(h);
    }
  }
  all.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.field.localeCompare(b.field));
  return all;
}

/** Unique writer files for a field (posix paths). */
export function writerFilesFor(hits: WriterHit[], field: string): string[] {
  return [...new Set(hits.filter((h) => h.field === field).map((h) => h.file))].sort();
}

/** Test helper: drop the process cache (not used by production). */
export function clearWriterScanCacheForTests(): void {
  fileCache.clear();
  fileListCache = null;
}
