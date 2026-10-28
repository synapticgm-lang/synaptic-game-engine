/**
 * T10K — Free writer is OpenRouter DeepSeek; Fireworks is retired from every call path.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPENROUTER_DEEPSEEK_V41_FLASH } from './modelIds';
import { openRouterChatBody, openRouterProviderRouting, FREE_WRITER_OPENROUTER_MODEL } from './openRouterChat';
import { SUBSCRIPTION_TIERS } from './subscriptionTiers';

const root = resolve(__dirname, '../..');
const playPrivileges = readFileSync(resolve(root, 'supabase/functions/_shared/playPrivileges.ts'), 'utf8');
const gmTurn = readFileSync(resolve(root, 'supabase/functions/gm-turn/index.ts'), 'utf8');
const edgeOpenRouter = readFileSync(resolve(root, 'supabase/functions/_shared/gm/openRouterChat.ts'), 'utf8');

/** Walk source files under a dir; skip *.test.* / *.spec.* and node_modules. */
function walkSources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkSources(p, out);
    else if (/\.(ts|tsx|js|mjs)$/.test(name) && !/\.(test|spec)\./.test(name)) out.push(p);
  }
  return out;
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
    const banned = /api\.fireworks\.ai|FIREWORKS_API_KEY|FIREWORKS_INFERENCE/;
    const files = [
      ...walkSources(join(root, 'src')),
      ...walkSources(join(root, 'supabase', 'functions')),
    ];
    const hits: string[] = [];
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      if (banned.test(text)) hits.push(f.replace(root + '\\', '').replace(root + '/', ''));
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });
});
