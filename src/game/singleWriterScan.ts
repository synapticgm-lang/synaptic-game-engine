/**
 * AST single-writer scan (T10SM1). Ports scripts/audit-writers.cjs for vitest.
 * A writer of field F is: (a) `x.F = …` / compound assign, or (b) property F inside
 * an object literal that also has a spread (a state patch).
 *
 * Pure copies are not writers: `F: expr.F` / `F: expr?.F` (same name on the RHS).
 *
 * Ignores: `*.test.ts(x)`, `*.d.ts`, `src/game/__fixtures__/**`.
 * Does NOT ignore fateAutoplay.ts (T10SM1 Stage 0 — harness stays in the allow-list until routed).
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export type WriterHit = { file: string; line: number; kind: 'assign' | 'patch'; field: string };

const ROOTS = ['src'];

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

function expressionRootName(expr: ts.Expression): string | null {
  let e: ts.Expression = expr;
  for (;;) {
    if (ts.isAsExpression(e) || ts.isSatisfiesExpression(e) || ts.isParenthesizedExpression(e) || ts.isNonNullExpression(e)) {
      e = e.expression;
      continue;
    }
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

function isPureFieldCopy(field: string, init: ts.Expression | undefined): boolean {
  if (!init) return false;
  let expr: ts.Expression = init;
  while (ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr) || ts.isParenthesizedExpression(expr) || ts.isNonNullExpression(expr)) {
    expr = expr.expression;
  }
  const lastName =
    ts.isPropertyAccessExpression(expr) || (ts.isPropertyAccessChain(expr) && ts.isIdentifier(expr.name))
      ? expr.name.text
      : null;
  if (lastName !== field) return false;
  const root = expressionRootName(expr);
  return !!root && STATEISH_ROOT.test(root);
}

function scanFile(file: string, fields: Set<string>): WriterHit[] {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const hits: WriterHit[] = [];
  const rel = file.replace(/\\/g, '/');

  const rec = (name: string, node: ts.Node, kind: 'assign' | 'patch') => {
    if (!fields.has(name)) return;
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    hits.push({ file: rel, line: line + 1, kind, field: name });
  };

  const visit = (n: ts.Node) => {
    if (ts.isBinaryExpression(n)) {
      const op = n.operatorToken.kind;
      const isAssign =
        op === ts.SyntaxKind.EqualsToken ||
        (op >= ts.SyntaxKind.PlusEqualsToken && op <= ts.SyntaxKind.CaretEqualsToken);
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

/** Scan src/ for writers of the given field names. Deterministic; sorted. */
export function scanWriters(fieldNames: string[]): WriterHit[] {
  const fields = new Set(fieldNames);
  const files: string[] = [];
  for (const root of ROOTS) {
    if (fs.existsSync(root)) walkFiles(root, files);
  }
  files.sort();
  const all: WriterHit[] = [];
  for (const f of files) all.push(...scanFile(f, fields));
  all.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.field.localeCompare(b.field));
  return all;
}

/** Unique writer files for a field (posix paths). */
export function writerFilesFor(hits: WriterHit[], field: string): string[] {
  return [...new Set(hits.filter((h) => h.field === field).map((h) => h.file))].sort();
}
