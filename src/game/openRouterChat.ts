/**
 * OpenRouter / Fireworks / OpenAI-compat chat helpers.
 * DeepSeek V4 Flash often fills reasoning_* and leaves message.content empty —
 * that used to 502 gm-turn as "no content".
 */

type ChatPart = { text?: unknown } | string;

/** Fireworks OpenAI-compat inference (same pipe as synaptic-engine Free). */
export const FIREWORKS_INFERENCE_BASE = 'https://api.fireworks.ai/inference/v1';

/** Live Free hosted writer. Do not use retired `deepseek-v3p1` (404). */
export const FREE_WRITER_FIREWORKS_MODEL = 'accounts/fireworks/models/deepseek-v4-flash-0731';

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

export function fireworksChatBody(model: string, systemPrompt: string, prompt: string, maxTokens: number) {
  return {
    model: normalizeFireworksWriterModel(model) || FREE_WRITER_FIREWORKS_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.9,
    max_tokens: maxTokens,
  };
}

/**
 * Non-Latin script the Free writer must not commit.
 * 02f: CJK Unified Ideographs (Han).
 * 02o: Hangul + Thai — RPG s42 T10 committed Hangul+log dump because 02f only matched Han.
 */
export function hasHanScript(text: string): boolean {
  return /[\u4e00-\u9fff\uac00-\ud7af\u0e00-\u0e7f]/.test(text ?? '');
}

export function extractChatCompletionText(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const choice = (data as { choices?: unknown[] }).choices?.[0];
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
  const candidates: unknown[] = [msg.content, rec.text];
  for (const raw of candidates) {
    const text = flattenChatContent(raw);
    if (text) return hasHanScript(text) ? '' : text;
  }
  // Last resort: some DeepSeek routes only populate reasoning. Do not prefer it.
  const fallback = flattenChatContent(msg.reasoning) || flattenChatContent(msg.reasoning_content);
  return hasHanScript(fallback) ? '' : fallback;
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

export function openRouterChatBody(model: string, systemPrompt: string, prompt: string, maxTokens: number) {
  return {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.9,
    max_tokens: maxTokens,
    // Keep completion tokens in content — thinking-only replies 502'd hosted Free.
    reasoning: { effort: 'low', exclude: true },
    provider: { allow_fallbacks: true, sort: 'latency' },
  };
}
