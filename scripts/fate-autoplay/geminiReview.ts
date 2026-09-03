/**
 * Overnight Gemini Pro critic for Fate RRR paste packs.
 * Default: OpenRouter `google/gemini-2.5-pro` (same OPENROUTER_API_KEY as the game).
 * Optional: `--provider google` + GEMINI_API_KEY keeps the AI Studio path.
 * Critic only: writes reply markdown. Does not repair or edit game code.
 * Does not change the game writer (DeepSeek Free / --writer default).
 *
 *   npm run fate-gemini-review -- --dir scripts/fate-autoplay/runs/gemini-paste-2026-09-02f-smoke
 *   npm run fate-gemini-review -- --file <pack.md> --stamp 02f
 *   npm run fate-gemini-review -- --dir <paste-dir> --flex
 *   npm run fate-gemini-review -- --dir <paste-dir> --provider google
 *
 * Env (dotenv `.env` / process.env only — never CLI, never logged):
 *   OPENROUTER_API_KEY          required for default OpenRouter path
 *   GEMINI_REVIEW_MODEL         default google/gemini-2.5-pro
 *   GEMINI_REVIEW_SERVICE_TIER  optional `flex` (overnight cheaper; documented OpenRouter param)
 *   GEMINI_API_KEY              only if --provider google
 *
 * Override model: `--model <id>`. Never put a key on argv.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPlayerCapacityContext } from '../../src/game/geminiCriticPrompt';
import { extractChatCompletionText, openRouterChatHeaders } from '../../src/game/openRouterChat';
import { loadDotEnv } from './loadDotEnv';

/** OpenRouter default — harsh story critic. Not Flash. Not DeepSeek. */
export const DEFAULT_GEMINI_REVIEW_MODEL = 'google/gemini-2.5-pro';

export const DEFAULT_REVIEW_PROVIDER = 'openrouter' as const;

export const OPENROUTER_REVIEW_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Bare AI Studio ids that must become OpenRouter Gemini 2.5 Pro (not 3.1, not Flash). */
const STUDIO_IDS_TO_OPENROUTER_PRO = new Set(['gemini-2.5-pro', 'gemini-3.1-pro-preview']);

export type ReviewProvider = 'openrouter' | 'google';

export type ReviewServiceTier = 'flex' | 'priority';

/** Story-quality rubric John already pastes (GROK-GUIDE-RRR-WORKFLOW-2026-09-02). */
export const STORY_QUALITY_REVIEW_PROMPT = [
  buildPlayerCapacityContext().trim(),
  '',
  '### Overnight Free-hook questions (do not replace the 1–10 scores below)',
  '',
  '- **T12** must show a **durable delta** (quest stage / fight resolved / branch lock / level tick). Say whether it landed.',
  '- **Would a Free player come back tomorrow?** Answer **YES / MAYBE / NO** in one sentence.',
  '- Day-1 window is **~20 turns** (8 story-start + 12 daily); first **8–12** are the critical hook band.',
  '- Day 2+ wall is **12 turns** only. Do not treat a 50-turn autoplay as the Free session.',
  '',
  'You are reviewing an AI-generated text RPG transcript for story quality, narrative coherence, and game feel.',
  '',
  'Rate the transcript out of 10 for:',
  '1. Readability (grammar, flow, word choice)',
  '2. Continuity (character/location consistency)',
  '3. Engagement (player agency, meaningful choices)',
  '',
  'For each major issue, provide:',
  '- Turn number where it occurs',
  '- Severity (P0 = stop-early blocker, P1 = degradation)',
  '- Root cause hypothesis',
  '- Code owner (if identifiable)',
  '',
  'Stop reading early if the story becomes unreadable.',
  '',
  '## Required output (ingest)',
  '',
  '1. **Verdict** — Keep reading? / Stop early? (one sentence + turn where you would stop if any)',
  '2. **Book score** — 1–10 for standalone story quality (one number + one sentence)',
  '3. **Free hook** — YES / MAYBE / NO a Free player comes back tomorrow (one sentence; T12 durable delta yes/no)',
  '4. **Findings** — P0/P1/P2 tickets with turn numbers and verbatim quotes',
  '5. End with: `REVIEW_COMPLETE`.',
].join('\n');

export type GeminiReviewArgs = {
  dir: string;
  file: string;
  out: string;
  beside: boolean;
  stamp: string;
  model: string;
  provider: string;
  flex: boolean | undefined;
  allLenses: boolean;
  dryRun: boolean;
  maxChars: number;
};

export function parseGeminiReviewArgs(argv: string[]): GeminiReviewArgs {
  let dir = '';
  let file = '';
  let out = '';
  let beside = false;
  let stamp = '';
  let model = '';
  let provider = '';
  let flex: boolean | undefined;
  let allLenses = false;
  let dryRun = false;
  let maxChars = 200_000;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') dir = argv[++i] ?? '';
    else if (a === '--file') file = argv[++i] ?? '';
    else if (a === '--out') out = argv[++i] ?? '';
    else if (a === '--beside') beside = true;
    else if (a === '--stamp') stamp = argv[++i] ?? '';
    else if (a === '--model') model = argv[++i] ?? '';
    else if (a === '--provider') provider = argv[++i] ?? '';
    else if (a === '--flex') flex = true;
    else if (a === '--no-flex') flex = false;
    else if (a === '--all-lenses') allLenses = true;
    else if (a === '--dry-run') dryRun = true;
    else if (a === '--max-chars') maxChars = Math.max(20_000, Number(argv[++i]) || 200_000);
  }
  return { dir, file, out, beside, stamp, model, provider, flex, allLenses, dryRun, maxChars };
}

export function isOpenRouterModelId(id: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9./:_-]*$/i.test(id.trim());
}

export function resolveReviewProvider(raw?: string): ReviewProvider {
  const v = (raw ?? process.env.GEMINI_REVIEW_PROVIDER ?? DEFAULT_REVIEW_PROVIDER).trim().toLowerCase();
  if (v === 'google' || v === 'ai-studio' || v === 'aistudio' || v === 'studio') return 'google';
  return 'openrouter';
}

export function resolveReviewServiceTier(flexFlag?: boolean): ReviewServiceTier | undefined {
  if (flexFlag === false) return undefined;
  if (flexFlag === true) return 'flex';
  const env = (process.env.GEMINI_REVIEW_SERVICE_TIER ?? '').trim().toLowerCase();
  if (env === 'flex') return 'flex';
  if (env === 'priority' || env === 'fast') return 'priority';
  return undefined;
}

/**
 * OpenRouter ids (`google/...`) stay as-is.
 * Bare `gemini-2.5-pro` / `gemini-3.1-pro-preview` map to `google/gemini-2.5-pro`.
 * `--provider google` strips the vendor prefix for AI Studio.
 */
export function resolveReviewModel(raw?: string, provider?: ReviewProvider): string {
  const m =
    (raw ?? process.env.GEMINI_REVIEW_MODEL ?? DEFAULT_GEMINI_REVIEW_MODEL).trim() ||
    DEFAULT_GEMINI_REVIEW_MODEL;
  const stripped = m.replace(/^models\//, '');
  const prov = provider ?? resolveReviewProvider();
  if (prov === 'google') {
    return stripped.replace(/^google\//, '');
  }
  if (isOpenRouterModelId(stripped)) return stripped;
  if (STUDIO_IDS_TO_OPENROUTER_PRO.has(stripped)) return DEFAULT_GEMINI_REVIEW_MODEL;
  if (/^gemini-/i.test(stripped)) return `google/${stripped}`;
  return stripped;
}

/**
 * True when this file is the CLI entry (node / vite-node / npm run fate-gemini-review).
 * vite-node often leaves argv[1] as the runner and omits `geminiReview.ts` — do not
 * require that path on argv. False when Vitest imports this module.
 */
export function isGeminiReviewEntry(
  argv: readonly string[] = process.argv,
  metaUrl: string = import.meta.url
): boolean {
  if (argv === process.argv && (process.env.VITEST || process.env.VITEST_WORKER_ID)) {
    return false;
  }
  const slots = argv.map((a) => String(a).replace(/\\/g, '/'));
  if (slots.some((a) => /(?:^|\/)vitest(?:\/|\.mjs|\.js|$)|playtestGeminiReview/i.test(a))) {
    return false;
  }

  let self = metaUrl.replace(/\\/g, '/');
  try {
    self = fileURLToPath(metaUrl).replace(/\\/g, '/');
  } catch {
    /* keep href form */
  }
  const selfBase = (self.split('/').pop() ?? '').replace(/\?.*$/, '');
  if (!/^geminiReview\.(ts|js|mjs)$/i.test(selfBase)) return false;

  const entry = slots[1] ?? '';
  if (entry) {
    try {
      if (resolve(entry).replace(/\\/g, '/') === self) return true;
    } catch {
      /* ignore */
    }
    if (/geminiReview/i.test(entry)) return true;
  }

  // npm run fate-gemini-review → vite-node.mjs on argv[1], script path omitted
  if (slots.some((a) => /vite-node/i.test(a))) return true;

  return slots.some((a) => /geminiReview/i.test(a));
}

export function requireOpenRouterApiKey(): string {
  const key = (
    process.env.OPENROUTER_API_KEY ??
    process.env.VITE_OPENROUTER_API_KEY ??
    process.env.AUTOPLAY_OPENROUTER_API_KEY ??
    ''
  ).trim();
  if (!key) {
    throw new Error(
      'OPENROUTER_API_KEY is missing. Add it to local .env (gitignored; same key as the game). Do not pass the key on the command line.'
    );
  }
  return key;
}

export function requireGeminiApiKey(): string {
  const key = (process.env.GEMINI_API_KEY ?? '').trim();
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY is missing. Add it to local .env (gitignored). Needed only with --provider google. Do not pass the key on the command line.'
    );
  }
  return key;
}

export function requireReviewApiKey(provider: ReviewProvider): string {
  return provider === 'google' ? requireGeminiApiKey() : requireOpenRouterApiKey();
}

export function sanitizeForLog(text: string, secret?: string): string {
  let out = String(text ?? '');
  const key = (secret ?? '').trim();
  if (key.length > 0) out = out.split(key).join('[redacted]');
  out = out.replace(/key=[^&\s]+/gi, 'key=[redacted]');
  out = out.replace(/x-goog-api-key:\s*\S+/gi, 'x-goog-api-key: [redacted]');
  out = out.replace(/authorization:\s*bearer\s+\S+/gi, 'authorization: Bearer [redacted]');
  out = out.replace(/Bearer\s+\S+/g, 'Bearer [redacted]');
  out = out.replace(/AIza[0-9A-Za-z_\-]{10,}/g, '[redacted]');
  out = out.replace(/sk-or-v1-[A-Za-z0-9_-]+/g, '[redacted]');
  return out;
}

export function inferModeFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('litrpg')) return 'litrpg';
  if (n.includes('pyoa')) return 'pyoa';
  if (/\bdnd\b/.test(n) || n.includes('tabletop') || n.includes('-dnd') || n.includes('__dnd')) {
    return 'dnd';
  }
  if (n.includes('02-dnd') || n.includes('02-d&d')) return 'dnd';
  if (/\brpg\b/.test(n) || n.includes('-rpg') || n.includes('__rpg')) return 'rpg';
  return 'unknown';
}

export function inferLensFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('game-vibe') || n.includes('game_vibe')) return 'game';
  if (n.includes('both')) return 'both';
  return 'story';
}

export function inferSeqFromName(name: string): string {
  const m = basename(name).match(/^(\d{2})[-_]/);
  return m?.[1] ?? '01';
}

/** `2026-09-02f` → `02f`; `02f` stays `02f`. */
export function shortStamp(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  const dated = s.match(/(\d{4}-\d{2}-\d{2}[a-z])/i);
  if (dated) return dated[1].slice(-3).toLowerCase();
  const letter = s.match(/(\d{2}[a-z])$/i);
  if (letter) return letter[1].toLowerCase();
  return s.toLowerCase();
}

export function inferStampFromPath(sourcePath: string, content?: string, flag?: string): string {
  if (flag?.trim()) return shortStamp(flag);
  const fromPath = sourcePath.match(/(\d{4}-\d{2}-\d{2}[a-z])/i);
  if (fromPath) return shortStamp(fromPath[1]);
  const fromContent = content?.match(/Code baseline:\s*(\d{4}-\d{2}-\d{2}[a-z])/i);
  if (fromContent) return shortStamp(fromContent[1]);
  return 'reply';
}

export function inferReviewDate(sourcePath: string): string {
  const m = sourcePath.match(/(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? new Date().toISOString().slice(0, 10);
}

export function inferReplyFilename(packPath: string, stamp: string): string {
  const base = basename(packPath);
  const seq = inferSeqFromName(base);
  const mode = inferModeFromName(base);
  const lens = inferLensFromName(base);
  const st = shortStamp(stamp) || 'reply';
  return `gemini-${seq}-${mode}-${lens}-${st}-reply.md`;
}

export function defaultOutDir(sourcePath: string): string {
  return join(process.cwd(), 'docs', 'bugs', `gemini-reviews-${inferReviewDate(sourcePath)}`);
}

export function isPastePackName(name: string, allLenses: boolean): boolean {
  if (!name.toLowerCase().endsWith('.md')) return false;
  if (/how-to-paste|readme|index/i.test(name)) return false;
  if (!allLenses && /BOTH|game-vibe/i.test(name)) return false;
  if (/story-standalone/i.test(name)) return true;
  if (/^0[1-4][-_].*gemini-pro-PASTE/i.test(name)) return true;
  if (allLenses && /gemini-pro-PASTE/i.test(name)) return true;
  return false;
}

export function collectPasteFiles(dir: string, allLenses = false): string[] {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  const names = readdirSync(dir);
  return names
    .filter((n) => isPastePackName(n, allLenses))
    .sort()
    .map((n) => join(dir, n));
}

export function resolveInputFiles(opts: { dir?: string; file?: string; allLenses?: boolean }): string[] {
  if (opts.file?.trim()) {
    const p = resolve(opts.file);
    if (!existsSync(p) || !statSync(p).isFile()) {
      throw new Error(`Paste file not found: ${opts.file}`);
    }
    return [p];
  }
  if (opts.dir?.trim()) {
    const d = resolve(opts.dir);
    if (!existsSync(d) || !statSync(d).isDirectory()) {
      throw new Error(`Paste dir not found: ${opts.dir}`);
    }
    const files = collectPasteFiles(d, opts.allLenses === true);
    if (!files.length) {
      throw new Error(
        `No story paste packs in ${opts.dir} (want *story-standalone*PASTE*.md or 01-04 *gemini-pro-PASTE*.md)`
      );
    }
    return files;
  }
  throw new Error('Usage: npm run fate-gemini-review -- --dir <paste-dir>  OR  --file <pack.md> [--stamp 02f]');
}

export function truncatePack(body: string, maxChars: number): string {
  if (body.length <= maxChars) return body;
  return (
    body.slice(0, Math.floor(maxChars * 0.55)) +
    '\n\n…[truncated middle for length]…\n\n' +
    body.slice(-Math.floor(maxChars * 0.4))
  );
}

export function extractGeminiGenerateText(payload: unknown): string {
  const root = payload as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
      finishReason?: string;
    }>;
    error?: { message?: string };
    promptFeedback?: { blockReason?: string };
  };
  if (root.error?.message) {
    throw new Error(`Gemini API error: ${sanitizeForLog(root.error.message)}`);
  }
  if (root.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked: ${root.promptFeedback.blockReason}`);
  }
  const parts = root.candidates?.[0]?.content?.parts ?? [];
  const visible = parts
    .filter((p) => p.text && !p.thought)
    .map((p) => p.text)
    .join('\n')
    .trim();
  const anyText = parts
    .filter((p) => p.text)
    .map((p) => p.text)
    .join('\n')
    .trim();
  const text = visible || anyText;
  if (!text) throw new Error('Gemini returned empty text');
  return text;
}

export function extractOpenRouterReviewText(payload: unknown): string {
  const root = payload as { error?: { message?: string } };
  if (root.error?.message) {
    throw new Error(`OpenRouter API error: ${sanitizeForLog(root.error.message)}`);
  }
  const text = extractChatCompletionText(payload);
  if (!text) throw new Error('OpenRouter returned empty text');
  return text;
}

export function geminiGenerateUrl(model: string): string {
  const id = resolveReviewModel(model, 'google');
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(id)}:generateContent`;
}

export function openRouterReviewBody(opts: {
  model: string;
  system: string;
  user: string;
  serviceTier?: ReviewServiceTier;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: resolveReviewModel(opts.model, 'openrouter'),
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
    temperature: 0.2,
    max_tokens: 16384,
    // Gemini 2.5 Pro otherwise fills reasoning and the extractor falls back to thinking traces.
    reasoning: { effort: 'low', exclude: true },
  };
  if (opts.serviceTier) body.service_tier = opts.serviceTier;
  return body;
}

export async function generateGeminiReview(opts: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  timeoutMs?: number;
  maxAttempts?: number;
  fetchImpl?: typeof fetch;
}): Promise<string> {
  const key = opts.apiKey.trim();
  if (!key) throw new Error('GEMINI_API_KEY is missing.');
  const url = geminiGenerateUrl(opts.model);
  const fetchImpl = opts.fetchImpl ?? fetch;
  const maxAttempts = Math.max(1, Math.min(5, opts.maxAttempts ?? 3));
  let lastErr: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 600_000);
    try {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents: [{ role: 'user', parts: [{ text: opts.user }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 16384,
          },
        }),
      });
      const raw = await res.text();
      if (!res.ok) {
        const retryable = res.status === 429 || res.status === 503 || res.status >= 500;
        const err = new Error(`Gemini HTTP ${res.status}: ${sanitizeForLog(raw.slice(0, 400), key)}`);
        if (retryable && attempt < maxAttempts) {
          const waitMs = 15_000 * attempt * attempt;
          console.warn(
            `[gemini-review] HTTP ${res.status} attempt ${attempt}/${maxAttempts} — backoff ${waitMs}ms`
          );
          await sleep(waitMs);
          lastErr = err;
          continue;
        }
        throw err;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw) as unknown;
      } catch {
        throw new Error('Gemini response was not JSON');
      }
      return extractGeminiGenerateText(parsed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const safe = new Error(sanitizeForLog(msg, key));
      const retryable = /abort|HTTP 429|HTTP 503|HTTP 5/i.test(msg);
      if (retryable && attempt < maxAttempts) {
        lastErr = safe;
        await sleep(8_000);
        continue;
      }
      throw safe;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr ?? new Error('Gemini review failed');
}

export async function generateOpenRouterReview(opts: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  serviceTier?: ReviewServiceTier;
  timeoutMs?: number;
  maxAttempts?: number;
  fetchImpl?: typeof fetch;
}): Promise<string> {
  const key = opts.apiKey.trim();
  if (!key) throw new Error('OPENROUTER_API_KEY is missing.');
  const fetchImpl = opts.fetchImpl ?? fetch;
  const maxAttempts = Math.max(1, Math.min(5, opts.maxAttempts ?? 3));
  let lastErr: Error | null = null;
  const body = openRouterReviewBody({
    model: opts.model,
    system: opts.system,
    user: opts.user,
    serviceTier: opts.serviceTier,
  });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 600_000);
    try {
      const res = await fetchImpl(OPENROUTER_REVIEW_URL, {
        method: 'POST',
        headers: openRouterChatHeaders(key),
        signal: controller.signal,
        body: JSON.stringify(body),
      });
      const raw = await res.text();
      if (!res.ok) {
        const retryable = res.status === 429 || res.status === 503 || res.status >= 500;
        const err = new Error(
          `OpenRouter HTTP ${res.status}: ${sanitizeForLog(raw.slice(0, 400), key)}`
        );
        if (retryable && attempt < maxAttempts) {
          const waitMs = 15_000 * attempt * attempt;
          console.warn(
            `[gemini-review] HTTP ${res.status} attempt ${attempt}/${maxAttempts} — backoff ${waitMs}ms`
          );
          await sleep(waitMs);
          lastErr = err;
          continue;
        }
        throw err;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw) as unknown;
      } catch {
        throw new Error('OpenRouter response was not JSON');
      }
      return extractOpenRouterReviewText(parsed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const safe = new Error(sanitizeForLog(msg, key));
      const retryable = /abort|HTTP 429|HTTP 503|HTTP 5/i.test(msg);
      if (retryable && attempt < maxAttempts) {
        lastErr = safe;
        await sleep(8_000);
        continue;
      }
      throw safe;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr ?? new Error('OpenRouter review failed');
}

export async function generateReview(opts: {
  provider: ReviewProvider;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  serviceTier?: ReviewServiceTier;
  timeoutMs?: number;
  maxAttempts?: number;
  fetchImpl?: typeof fetch;
}): Promise<string> {
  if (opts.provider === 'google') {
    return generateGeminiReview(opts);
  }
  return generateOpenRouterReview(opts);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function formatReplyMarkdown(opts: {
  packPath: string;
  stamp: string;
  model: string;
  body: string;
}): string {
  const mode = inferModeFromName(basename(opts.packPath));
  const lens = inferLensFromName(basename(opts.packPath));
  const st = shortStamp(opts.stamp) || inferStampFromPath(opts.packPath);
  return [
    `# Gemini Pro — ${lens} standalone (${st} T50 ${mode})`,
    '',
    `**Source:** overnight fate-gemini-review (unattended) | **Lens:** ${lens} | **Model:** ${opts.model} | **Pack:** \`${basename(opts.packPath)}\``,
    '',
    'Critic only — this file is a review. It does not change game code.',
    '',
    '---',
    '',
    opts.body.trim(),
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  loadDotEnv();
  const args = parseGeminiReviewArgs(process.argv.slice(2));
  if (args.dir && args.file) {
    console.error('Pass --dir or --file, not both.');
    process.exit(2);
  }

  let files: string[];
  try {
    files = resolveInputFiles({ dir: args.dir, file: args.file, allLenses: args.allLenses });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(2);
    return;
  }

  const sourceHint = args.dir || args.file || files[0] || '';
  const stamp = inferStampFromPath(sourceHint, undefined, args.stamp);
  const provider = resolveReviewProvider(args.provider || undefined);
  const model = resolveReviewModel(args.model || undefined, provider);
  const serviceTier = provider === 'openrouter' ? resolveReviewServiceTier(args.flex) : undefined;
  const outDir = args.beside
    ? dirname(files[0]!)
    : args.out
      ? resolve(args.out)
      : defaultOutDir(sourceHint);

  let apiKey = '';
  try {
    apiKey = requireReviewApiKey(provider);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(2);
    return;
  }

  const keyName = provider === 'google' ? 'GEMINI_API_KEY' : 'OPENROUTER_API_KEY';
  const tierNote = serviceTier ? ` tier=${serviceTier}` : '';
  console.log(
    `[gemini-review] ${files.length} pack(s) → ${outDir} provider=${provider} model=${model}${tierNote} stamp=${stamp}${args.dryRun ? ' (dry-run)' : ''}`
  );

  if (args.dryRun) {
    for (const pack of files) {
      console.log(`  ${basename(pack)} → ${inferReplyFilename(pack, stamp)}`);
    }
    console.log(`[gemini-review] dry-run: ${keyName} present; no API call.`);
    return;
  }

  mkdirSync(outDir, { recursive: true });
  const index: Array<Record<string, string>> = [];

  for (let i = 0; i < files.length; i++) {
    const pack = files[i]!;
    const replyName = inferReplyFilename(pack, stamp);
    const dest = join(outDir, replyName);
    console.log(`[gemini-review] ${i + 1}/${files.length} ${basename(pack)} → ${replyName}`);
    try {
      const user = truncatePack(readFileSync(pack, 'utf8'), args.maxChars);
      const body = await generateReview({
        provider,
        apiKey,
        model,
        system: STORY_QUALITY_REVIEW_PROMPT,
        user,
        serviceTier,
      });
      writeFileSync(dest, formatReplyMarkdown({ packPath: pack, stamp, model, body }), 'utf8');
      index.push({ pack: basename(pack), reply: replyName, status: 'ok' });
    } catch (err) {
      const msg = sanitizeForLog(err instanceof Error ? err.message : String(err), apiKey);
      const failPath = dest.replace(/\.md$/i, '-FAILED.md');
      writeFileSync(
        failPath,
        `# Gemini review failed\n\n${msg}\n\nPack: \`${basename(pack)}\`\n`,
        'utf8'
      );
      index.push({ pack: basename(pack), reply: basename(failPath), status: 'failed', error: msg.slice(0, 400) });
      console.error(`[gemini-review] failed ${basename(pack)}: ${msg}`);
    }
  }

  writeFileSync(
    join(outDir, 'INDEX-gemini-review.json'),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        provider,
        model,
        serviceTier: serviceTier ?? 'default',
        stamp,
        source: isAbsolute(sourceHint) ? sourceHint : resolve(sourceHint),
        outDir,
        files: index,
        note: 'Critic only — did not change game code. Key never written.',
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  const ok = index.filter((r) => r.status === 'ok').length;
  const fail = index.length - ok;
  console.log(`[gemini-review] done ${ok} ok / ${fail} failed → ${outDir}`);
  if (fail > 0 && ok === 0) process.exit(1);
}

if (isGeminiReviewEntry()) {
  main().catch((err) => {
    console.error(sanitizeForLog(err instanceof Error ? err.message : String(err)));
    process.exit(1);
  });
}
