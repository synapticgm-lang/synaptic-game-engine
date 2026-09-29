/**
 * OpenRouter / Fireworks / OpenAI-compat chat helpers.
 * DeepSeek V4 Flash often fills reasoning_* and leaves message.content empty —
 * that used to 502 gm-turn as "no content".
 */

type ChatPart = { text?: unknown } | string;

/** Fireworks OpenAI-compat inference (same pipe as synaptic-engine Free). */
export const FIREWORKS_INFERENCE_BASE = 'https://api.fireworks.ai/inference/v1';

/** Live Free hosted writer. Do not use retired `deepseek-v3p1` (404). */
export const FREE_WRITER_FIREWORKS_MODEL = 'accounts/fireworks/models/deepseek-v4p1-flash';

export function isFireworksWriterModel(modelId: string | null | undefined): boolean {
  const id = (modelId ?? '').trim().toLowerCase();
  return id.startsWith('accounts/fireworks/models/') || id.startsWith('fireworks/');
}

/** Retired Fireworks slug 404s — remap to the live V4 Flash id. */
export function normalizeFireworksWriterModel(modelId: string | null | undefined): string {
  const id = (modelId ?? '').trim();
  if (/deepseek-v3p1/i.test(id)) return FREE_WRITER_FIREWORKS_MODEL;
  return id;
}

/** Hosted chat target from model id. OpenRouter ids stay on OpenRouter. */
export function hostedWriterProvider(modelId: string | null | undefined): 'fireworks' | 'openrouter' {
  return isFireworksWriterModel(normalizeFireworksWriterModel(modelId)) ? 'fireworks' : 'openrouter';
}

export function fireworksChatHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

/**
 * 28l — the writer's thinking pass took 1.3–3.5k tokens (11–30 s) and often left `content` empty.
 * Reasoning off where the provider supports it; `stripReasoningBlocks` covers every other model.
 */
export type FireworksReasoningLevel = 'none' | 'low' | null;

export function fireworksChatBody(
  model: string,
  systemPrompt: string,
  prompt: string,
  maxTokens: number,
  reasoning: FireworksReasoningLevel = null
) {
  return {
    model: normalizeFireworksWriterModel(model) || FREE_WRITER_FIREWORKS_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.9,
    max_tokens: maxTokens,
    ...(reasoning ? { reasoning_effort: reasoning } : {}),
  };
}

/** Raw writer reply problems, logged per turn for training (never a reason to fail the turn). */
export type WriterRawIssue = 'empty' | 'reasoning-only' | 'cut-off';

/** Appended to the system prompt on the single re-ask after an empty / cut-off reply. */
export const NO_REASONING_HINT =
  'Reply with the story itself right away. Do not think out loud, plan, or write reasoning; no <think> blocks.';

/** Output allowance for the single re-ask (first ask uses the normal budget). */
export const WRITER_REASK_MAX_TOKENS = 8192;

const REASONING_TAGS = 'think|thinking|reasoning|reflection|thought|scratchpad';

/**
 * Any provider: drop thinking blocks from reply text. An opened block that never closes means the reply
 * was all reasoning (cut off mid-thought) — nothing after it is story. A lone closing tag means the
 * provider ate the opener; only the text after it is story.
 */
export function stripReasoningBlocks(text: string): string {
  let out = String(text ?? '');
  out = out.replace(new RegExp(`<(${REASONING_TAGS})\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>`, 'gi'), ' ');
  out = out.replace(/<\|begin_of_thought\|>[\s\S]*?<\|end_of_thought\|>/gi, ' ');
  const open = out.search(new RegExp(`<(?:${REASONING_TAGS})\\b[^>]*>|<\\|begin_of_thought\\|>`, 'i'));
  if (open >= 0) out = out.slice(0, open);
  const close = [...out.matchAll(new RegExp(`<\\/(?:${REASONING_TAGS})\\s*>|<\\|end_of_thought\\|>`, 'gi'))].pop();
  if (close?.index != null) out = out.slice(close.index + close[0].length);
  return out.trim();
}

/** Stop reasons that mean the reply ran out of output allowance. */
export function isCutOffFinish(reason: unknown): boolean {
  return /^(?:length|max_tokens|MAX_TOKENS)$/.test(String(reason ?? ''));
}

/**
 * 28w — provider-reported token use for one model call. `tokensIn` is the whole prompt (cached included),
 * `tokensCached` the cached part of it. A field the provider did not report is null — never estimated.
 */
export type WriterUsage = {
  tokensIn: number | null;
  tokensOut: number | null;
  tokensCached: number | null;
};

/** 28w — token use summed over every model call of one turn (re-asks included). */
export type TurnWriterUsage = WriterUsage & {
  modelCalls: number | null;
  modelId: string | null;
};

export type ChatCompletionRead = {
  /** Story text (reasoning stripped; n-candidate packs joined as `{candidates}` JSON). */
  text: string;
  issue: WriterRawIssue | null;
  /** 28w — absent / null when the provider sent no usage block. */
  usage?: WriterUsage | null;
};

function usageCount(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function addCounts(...parts: Array<number | null>): number | null {
  const known = parts.filter((p): p is number => p != null);
  return known.length ? known.reduce((a, b) => a + b, 0) : null;
}

/**
 * 28w — read the usage block of any provider reply: OpenAI-compatible (OpenRouter / Fireworks / DeepSeek),
 * Google `usageMetadata`, Anthropic `usage`. Returns null when there is no usage block at all.
 */
export function readChatUsage(data: unknown): WriterUsage | null {
  if (!data || typeof data !== 'object') return null;
  const rec = data as Record<string, unknown>;
  const google = rec.usageMetadata as Record<string, unknown> | undefined;
  if (google && typeof google === 'object') {
    const out = usageCount(google.candidatesTokenCount);
    const thoughts = usageCount(google.thoughtsTokenCount);
    return {
      tokensIn: usageCount(google.promptTokenCount),
      tokensOut: out == null && thoughts == null ? null : addCounts(out, thoughts),
      tokensCached: usageCount(google.cachedContentTokenCount),
    };
  }
  const u = rec.usage as Record<string, unknown> | undefined;
  if (!u || typeof u !== 'object') return null;
  if ('input_tokens' in u || 'output_tokens' in u) {
    // Anthropic input_tokens excludes cache reads/writes; tokensIn is the whole prompt.
    const read = usageCount(u.cache_read_input_tokens);
    const write = usageCount(u.cache_creation_input_tokens);
    const input = usageCount(u.input_tokens);
    return {
      tokensIn: input == null ? null : addCounts(input, read, write),
      tokensOut: usageCount(u.output_tokens),
      tokensCached: read,
    };
  }
  const details = u.prompt_tokens_details as Record<string, unknown> | undefined;
  return {
    tokensIn: usageCount(u.prompt_tokens),
    tokensOut: usageCount(u.completion_tokens),
    tokensCached: usageCount(details?.cached_tokens) ?? usageCount(u.prompt_cache_hit_tokens),
  };
}

/**
 * 28w — sum per-call usage for one turn. A token field is null if any call left it unreported (a partial sum
 * would under-count); `modelCalls` is null if any call's usage is unknown. No calls → null.
 */
export function sumWriterUsage(
  calls: ReadonlyArray<(Partial<TurnWriterUsage> & { modelCalls?: number | null }) | null | undefined>
): TurnWriterUsage | null {
  if (!calls.length) return null;
  const field = (k: 'tokensIn' | 'tokensOut' | 'tokensCached' | 'modelCalls'): number | null => {
    let total = 0;
    for (const c of calls) {
      const v = c?.[k];
      if (typeof v !== 'number' || !Number.isFinite(v)) return null;
      total += v;
    }
    return total;
  };
  const modelId = [...calls].reverse().find((c) => typeof c?.modelId === 'string' && c.modelId)?.modelId ?? null;
  return {
    tokensIn: field('tokensIn'),
    tokensOut: field('tokensOut'),
    tokensCached: field('tokensCached'),
    modelCalls: field('modelCalls'),
    modelId,
  };
}

/** Read an OpenAI-compatible completion: story text only, plus what went wrong with the raw reply. */
export function readChatCompletion(data: unknown): ChatCompletionRead {
  const choices = (data && typeof data === 'object' ? (data as { choices?: unknown[] }).choices : undefined) ?? [];
  const first = (choices[0] ?? {}) as {
    finish_reason?: unknown;
    message?: { content?: unknown; reasoning?: unknown; reasoning_content?: unknown };
    text?: unknown;
  };
  const text = packGmCandidateTexts(extractChatCompletionTexts(data));
  const rawContent = flattenChatContent(first.message?.content) || flattenChatContent(first.text);
  const hadReasoning =
    !!flattenChatContent(first.message?.reasoning)
    || !!flattenChatContent(first.message?.reasoning_content)
    || new RegExp(`<(?:${REASONING_TAGS})\\b`, 'i').test(rawContent);
  let issue: WriterRawIssue | null = null;
  if (!text) issue = hadReasoning ? 'reasoning-only' : 'empty';
  else if (isCutOffFinish(first.finish_reason)) issue = 'cut-off';
  const usage = readChatUsage(data);
  return usage ? { text, issue, usage } : { text, issue };
}

/**
 * Non-Latin script the Free writer must not commit.
 * 02f: CJK Unified Ideographs (Han).
 * 02o: Hangul + Thai — RPG s42 T10 committed Hangul+log dump because 02f only matched Han.
 */
export function hasHanScript(text: string): boolean {
  return /[\u4e00-\u9fff\uac00-\ud7af\u0e00-\u0e7f]/.test(text ?? '');
}

function extractOneChoice(choice: unknown): string {
  if (!choice || typeof choice !== 'object') return '';
  const rec = choice as {
    text?: unknown;
    message?: {
      content?: unknown;
      reasoning?: unknown;
      reasoning_content?: unknown;
    };
  };
  const msg = rec.message ?? {};
  // Reasoning fields are the model thinking, never the story.
  const candidates: unknown[] = [msg.content, rec.text];
  for (const raw of candidates) {
    const text = stripReasoningBlocks(flattenChatContent(raw));
    if (text) return hasHanScript(text) ? '' : text;
  }
  return '';
}

export function extractChatCompletionText(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const choice = (data as { choices?: unknown[] }).choices?.[0];
  return extractOneChoice(choice);
}

/** 14a — n:2 candidates. Empty / Han rows dropped. */
export function extractChatCompletionTexts(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const choices = (data as { choices?: unknown[] }).choices;
  if (!Array.isArray(choices) || !choices.length) {
    const one = extractChatCompletionText(data);
    return one ? [one] : [];
  }
  return choices.map(extractOneChoice).filter((t) => t.trim());
}

export function packGmCandidateTexts(texts: string[]): string {
  const clean = texts.map((t) => t.trim()).filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? '';
  return JSON.stringify({ candidates: clean });
}

function flattenChatContent(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim();
  if (!Array.isArray(raw)) return '';
  const joined = (raw as ChatPart[])
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part === 'object' && typeof part.text === 'string') return part.text;
      return '';
    })
    .join('')
    .trim();
  return joined;
}

export function openRouterChatHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'HTTP-Referer': 'https://synapticgm.app',
    'X-Title': 'SynapticGM',
  };
}

export function openRouterChatBody(
  model: string,
  systemPrompt: string,
  prompt: string,
  maxTokens: number,
  opts?: { tokenProse?: boolean; n?: number }
) {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.9,
    max_tokens: maxTokens,
    // Keep completion tokens in content — thinking-only replies 502'd hosted Free.
    // 28l — DeepSeek writes the beat without a thinking pass (thinking cost 11–30 s per call).
    reasoning: /deepseek/i.test(model) ? { enabled: false } : { effort: 'low', exclude: true },
    provider: { allow_fallbacks: true, sort: 'latency' },
  };
  if (opts?.tokenProse) {
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'token_prose',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            refs: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  tok: { type: 'string' },
                  id: { type: 'string' },
                  use: {
                    type: 'string',
                    enum: ['speaker', 'actor', 'addressed', 'corpse', 'prop_used', 'worn', 'place'],
                  },
                },
                required: ['tok', 'id', 'use'],
              },
            },
            lines: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  fn: { type: 'string', enum: ['place', 'action', 'speech', 'react', 'hook'] },
                  text: { type: 'string' },
                  speaker_tok: { type: 'string' },
                },
                required: ['fn', 'text'],
              },
            },
          },
          required: ['refs', 'lines'],
        },
      },
    };
    if (opts.n && opts.n > 1) body.n = opts.n;
  }
  return body;
}
