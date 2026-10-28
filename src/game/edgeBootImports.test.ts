/**
 * T10AJ-fix — permanent guard: every named import reachable from edge entry
 * points must resolve to a real export in supabase/functions/_shared (no Deno
 * required for the static pass). Optional Deno boot when `deno` is on PATH.
 *
 * Catches the class of BOOT_ERROR where a hand-stub lacks exports that a
 * newly synced module (e.g. scenePresence → travelJourney) imports.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.join(__dirname, '..', '..');
const SHARED = path.join(ROOT, 'supabase', 'functions', '_shared');
const ENTRY_POINTS = [
  'supabase/functions/gm-turn/index.ts',
  'supabase/functions/_shared/playPrivileges.ts',
  'supabase/functions/generate-image/index.ts',
];

function collectSpecs(text: string): string[] {
  const out: string[] = [];
  const re = /(?:import|export)\s+(?:type\s+)?(?:[^'"\n]*?\s+from\s+)?['"](\.[^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[1]!);
  return out;
}

/** Named value imports only (skip `import type { … }` and side-effect imports). */
function namedValueImports(text: string): { names: string[]; from: string }[] {
  const out: { names: string[]; from: string }[] = [];
  const re =
    /(?:^|\n)import\s+(?!type\b)(?:type\s+)?\{([^}]+)\}\s+from\s+['"](\.[^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const block = m[1]!;
    const from = m[2]!;
    // Drop pure type-only members (`type Foo`) — Deno boot cares about values.
    const names = block
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const cleaned = p.replace(/^type\s+/, '').trim();
        const as = cleaned.split(/\s+as\s+/i);
        return (as[0] ?? '').trim();
      })
      .filter((n) => n && n !== 'type');
    if (names.length) out.push({ names, from });
  }
  return out;
}

function resolveImport(fromFile: string, spec: string): string | null {
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base,
    base.endsWith('.ts') ? base : `${base}.ts`,
    path.join(base, 'index.ts'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

/** Exported binding names (functions/consts/classes + export { … } lists). */
function exportedNames(text: string): Set<string> {
  const names = new Set<string>();
  for (const re of [
    /\bexport\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /\bexport\s+(?:const|let|var|class|enum)\s+([A-Za-z_$][\w$]*)/g,
    /\bexport\s+type\s+([A-Za-z_$][\w$]*)/g,
    /\bexport\s+interface\s+([A-Za-z_$][\w$]*)/g,
  ]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) names.add(m[1]!);
  }
  const listRe = /\bexport\s+(?:type\s+)?\{([^}]+)\}/g;
  let lm: RegExpExecArray | null;
  while ((lm = listRe.exec(text))) {
    for (const part of lm[1]!.split(',')) {
      const cleaned = part.trim().replace(/^type\s+/, '');
      if (!cleaned) continue;
      const bits = cleaned.split(/\s+as\s+/i);
      // `export { foo as bar }` → consumers import `bar`.
      const exported = (bits[1] ?? bits[0] ?? '').trim();
      if (exported) names.add(exported);
    }
  }
  return names;
}

function walkReachable(): string[] {
  const queue = ENTRY_POINTS.map((p) => path.join(ROOT, p));
  const seen = new Set<string>();
  while (queue.length) {
    const abs = queue.shift()!;
    if (seen.has(abs) || !fs.existsSync(abs)) continue;
    seen.add(abs);
    const text = fs.readFileSync(abs, 'utf8');
    for (const spec of collectSpecs(text)) {
      if (!spec.startsWith('.')) continue;
      const resolved = resolveImport(abs, spec);
      if (!resolved) continue;
      const rel = path.relative(SHARED, resolved).replace(/\\/g, '/');
      // Stay inside _shared (and gm-turn / generate-image siblings that pull _shared).
      if (rel.startsWith('..') && !resolved.replace(/\\/g, '/').includes('/supabase/functions/')) {
        continue;
      }
      if (resolved.replace(/\\/g, '/').includes('/supabase/functions/')) queue.push(resolved);
    }
  }
  return [...seen];
}

function findMissingExports(): string[] {
  const problems: string[] = [];
  for (const file of walkReachable()) {
    const text = fs.readFileSync(file, 'utf8');
    for (const { names, from } of namedValueImports(text)) {
      const target = resolveImport(file, from);
      if (!target) {
        problems.push(`${path.relative(ROOT, file)} → missing module ${from}`);
        continue;
      }
      if (!target.replace(/\\/g, '/').includes('/supabase/functions/_shared/')) continue;
      const exports = exportedNames(fs.readFileSync(target, 'utf8'));
      for (const n of names) {
        if (!exports.has(n)) {
          problems.push(
            `${path.relative(ROOT, file).replace(/\\/g, '/')} imports ${n} from ${from} but ${path.relative(ROOT, target).replace(/\\/g, '/')} does not export it`,
          );
        }
      }
    }
  }
  return problems;
}

function denoOnPath(): string | null {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  const res = spawnSync(cmd, ['deno'], { encoding: 'utf8' });
  if (res.status !== 0) return null;
  const line = (res.stdout ?? '').split(/\r?\n/).map((s) => s.trim()).find(Boolean);
  return line || null;
}

describe('edgeBootImports', () => {
  it('every named import in the edge closure resolves to a real _shared export', () => {
    const missing = findMissingExports();
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it(
    'deno gm-turn boot loads without module SyntaxError/TypeError (when deno on PATH)',
    async () => {
      const deno = denoOnPath();
      if (!deno) return; // static check above is the required gate
      const cwd = path.join(ROOT, 'supabase', 'functions', 'gm-turn');
      const out = await new Promise<string>((resolve) => {
        let buf = '';
        const child = spawn(deno, ['run', '--no-check', '--no-lock', '-A', 'index.ts'], {
          cwd,
          env: {
            ...process.env,
            SUPABASE_URL: 'http://x',
            SUPABASE_ANON_KEY: 'x',
            SUPABASE_SERVICE_ROLE_KEY: 'x',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        const finish = () => {
          try {
            child.kill('SIGTERM');
          } catch {
            /* already gone */
          }
          resolve(buf);
        };
        const timer = setTimeout(finish, 25_000);
        const onChunk = (chunk: Buffer | string) => {
          buf += String(chunk);
          // Module graph loaded (serve started) OR a load-time throw — stop early.
          if (
            /Listening on|SyntaxError:|TypeError:.*does not provide an export|Uncaught SyntaxError/i.test(
              buf,
            )
          ) {
            clearTimeout(timer);
            finish();
          }
        };
        child.stdout?.on('data', onChunk);
        child.stderr?.on('data', onChunk);
        child.on('error', (err) => {
          buf += err.message;
          clearTimeout(timer);
          finish();
        });
        child.on('exit', () => {
          clearTimeout(timer);
          resolve(buf);
        });
      });
      // Module-load failures are BOOT_ERROR class.
      expect(out, out).not.toMatch(/SyntaxError:/);
      expect(out, out).not.toMatch(/TypeError:.*does not provide an export/);
      expect(out, out).not.toMatch(/Uncaught SyntaxError/);
      // Missing env / port bind / listen noise is OK — not a failure.
    },
    30_000,
  );
});
