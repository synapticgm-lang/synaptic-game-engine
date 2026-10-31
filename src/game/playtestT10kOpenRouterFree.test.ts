/**
 * T10K — Free writer is OpenRouter DeepSeek; Fireworks is retired from every call path.
 */
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPENROUTER_DEEPSEEK_V41_FLASH } from './modelIds';
import { openRouterChatBody, openRouterProviderRouting, FREE_WRITER_OPENROUTER_MODEL } from './openRouterChat';
import { SUBSCRIPTION_TIERS } from './subscriptionTiers';

const root = resolve(__dirname, '../..');
const playPrivileges = readFileSync(resolve(root, 'supabase/functions/_shared/playPrivileges.ts'), 'utf8');
const gmTurn = readFileSync(resolve(root, 'supabase/functions/gm-turn/index.ts'), 'utf8');
const edgeOpenRouter = readFileSync(resolve(root, 'supabase/functions/_shared/gm/openRouterChat.ts'), 'utf8');

const BANNED = /api\.fireworks\.ai|FIREWORKS_API_KEY|FIREWORKS_INFERENCE/;
/** Skip test fixtures, build junk, and scripts — production call-path sources only. */
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '__snapshots__',
  '__tests__',
  'scripts',
  'coverage',
  '.vite',
  'test',
]);

/**
 * Walk real non-test source once by extension.
 * Sync FS under OneDrive + full parallel vitest cannot be interrupted by the
 * default 5s timeout, so keep the file set small (no banks / scripts / snapshots).
 */
function walkSources(dir: string, out: string[] = [], seen: Set<string> = new Set()): string[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walkSources(p, out, seen);
      continue;
    }
    if (!/\.(ts|tsx|js|mjs|cjs)$/.test(name)) continue;
    if (/\.(test|spec)\./.test(name)) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

function scanForBanned(dirs: string[]): string[] {
  const seen = new Set<string>();
  const files: string[] = [];
  for (const d of dirs) walkSources(d, files, seen);
  const hits: string[] = [];
  for (const f of files) {
    let text: string;
    try {
      text = readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    if (BANNED.test(text)) hits.push(relative(root, f).replace(/\\/g, '/'));
  }
  return hits;
}

describe('T10K — Free OpenRouter DeepSeek + no Fireworks call path', () => {
  it('(a) Free resolves to DeepSeek OpenRouter slug on client and edge', () => {
    expect(SUBSCRIPTION_TIERS.free.writerOpenRouterId).toBe(OPENROUTER_DEEPSEEK_V41_FLASH);
    expect(FREE_WRITER_OPENROUTER_MODEL).toBe(OPENROUTER_DEEPSEEK_V41_FLASH);
    expect(playPrivileges).toContain('FREE_WRITER_OPENROUTER_MODEL');
    expect(playPrivileges).not.toContain('FREE_WRITER_FIREWORKS_MODEL');
    expect(edgeOpenRouter).toContain('FREE_WRITER_OPENROUTER_MODEL');
    expect(gmTurn).toContain('FREE_WRITER_OPENROUTER_MODEL');
    expect(gmTurn).toContain("provider = 'openrouter'");
    expect(gmTurn).toMatch(/OPENROUTER_API_KEY/);
  });

  it('(b) every OpenRouter writer body carries provider.ignore containing Fireworks', () => {
    const body = openRouterChatBody(OPENROUTER_DEEPSEEK_V41_FLASH, 's', 'p', 64) as {
      provider: { ignore: string[] };
    };
    expect(body.provider.ignore).toContain('Fireworks');
    expect(openRouterProviderRouting({ require_parameters: true }).ignore).toContain('Fireworks');
    expect(edgeOpenRouter).toContain("ignore: ['Fireworks']");
  });

  it('(c) no Fireworks endpoint or key name under src (non-test) or supabase/functions', () => {
    const hits = scanForBanned([join(root, 'src'), join(root, 'supabase', 'functions')]);
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('(c-neg) scan detects planted Fireworks strings in a temp non-test tree', () => {
    const tmp = mkdtempSync(join(tmpdir(), 't10k-fw-'));
    try {
      const nest = join(tmp, 'src', 'game');
      mkdirSync(nest, { recursive: true });
      writeFileSync(join(nest, 'planted.ts'), 'const u = "https://api.fireworks.ai/x";\n', 'utf8');
      writeFileSync(join(nest, 'ok.ts'), 'export const x = 1;\n', 'utf8');
      writeFileSync(join(nest, 'planted.test.ts'), 'FIREWORKS_API_KEY\n', 'utf8');
      mkdirSync(join(tmp, 'src', '__tests__'), { recursive: true });
      writeFileSync(join(tmp, 'src', '__tests__', 'bank.ts'), 'FIREWORKS_INFERENCE\n', 'utf8');
      const hits = scanForBanned([join(tmp, 'src')]);
      expect(hits.some((h) => h.endsWith('planted.ts') || h.includes('planted.ts'))).toBe(true);
      expect(hits.every((h) => !h.includes('planted.test') && !h.includes('__tests__'))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
