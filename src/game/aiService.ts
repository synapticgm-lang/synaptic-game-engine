import { buildSystemPrompt, buildContextPrompt } from './systemPrompt';
import type { GameState, Settings, LoreCard } from './types';
import { logger } from './logger';

export interface GmResult {
  text: string;
  imagePrompt: string[] | null;
  rolls: string[];
  systemLog: string[];
}

export class RateLimitError extends Error {
  retryAfterMs?: number;
  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 10000;
const BACKOFF_DELAYS_MS = [5000, 15000, 30000, 60000];
const AI_REQUEST_TIMEOUT_MS = 25_000;
const AI_MAX_OUTPUT_TOKENS = 2_048;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  providerLabel: string,
  timeoutMs = AI_REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`${providerLabel} request timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function logRequest(provider: string, url: string, model: string, systemPromptLen: number, promptLen: number) {
  logger.info('ai-request', `${provider} request`, { url, model, systemPromptLen, promptLen });
}

function logResponse(provider: string, status: number, ok: boolean, durationMs: number, bodyPreview?: string) {
  const level = ok ? 'info' : 'error';
  logger[level]('ai-response', `${provider} response ${status} ${ok ? 'OK' : 'ERROR'} (${durationMs}ms)`, { status, ok, durationMs, bodyPreview });
}

function logError(provider: string, err: unknown) {
  logger.error('ai-network', `${provider} network error`, err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number, delayMs: number) => void
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) logger.info('ai-retry', `retry attempt ${attempt}/${MAX_RETRIES}`);
      return await fn();
    } catch (e) {
      lastError = e;
      const isRateLimit =
        e instanceof RateLimitError ||
        (e instanceof Error && (e.message.includes('429') || e.message.toLowerCase().includes('rate limit')));
      if (!isRateLimit || attempt === MAX_RETRIES) {
        logger.error('ai-retry', `retries exhausted or non-retryable`, e instanceof Error ? { name: e.name, message: e.message } : e);
        throw e;
      }
      const serverDelay = e instanceof RateLimitError && e.retryAfterMs ? e.retryAfterMs : undefined;
      const delay = serverDelay ?? BACKOFF_DELAYS_MS[attempt] ?? BASE_DELAY_MS * Math.pow(2, attempt);
      logger.warn('ai-retry', `retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${MAX_RETRIES})`, { delayMs: delay });
      onRetry?.(attempt + 1, delay);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

function extractImagePrompt(text: string): string[] | null {
  const regex = /\[ ?CINEMATIC SCENE PROMPT ?\]([\s\S]*?)(?=\n\[|\nWhat do you do|\n$|$)/gi;
  const matches = [...text.matchAll(regex)];
  
  const regex2 = /---\s*CINEMATIC SCENE PROMPT\s*---([\s\S]*?)(?=---|$)/gi;
  const matches2 = [...text.matchAll(regex2)];

  const allMatches = [...matches, ...matches2];
  if (allMatches.length === 0) return null;

  const prompts = allMatches.map(m => {
    const descMatch = m[1].match(/Description:\s*([\s\S]+?)(?=\n[A-Z]|\n\n|$)/i);
    return (descMatch ? descMatch[1].trim() : m[1].trim()) || null;
  }).filter(Boolean) as string[];

  return prompts.length > 0 ? prompts : null;
}

function stripImageBlock(text: string): string {
  return text
    .replace(/\n?\[\s*CINEMATIC SCENE PROMPT\s*\][\s\S]*?(?=\n\[|\nWhat do you do\?|$)/gi, '')
    .replace(/\n?---+\s*CINEMATIC SCENE PROMPT\s*---+[\s\S]*?(?=---+|$)/gi, '')
    .trim();
}

function extractRolls(text: string): string[] {
  const rolls: string[] = [];
  const re = /\[ ?SYSTEM ROLL:[\s\S]*?Outcome: ?[^\]]+\]/gi;
  let m;
  while ((m = re.exec(text)) !== null) rolls.push(m[0]);
  return rolls;
}

function extractSystemLog(text: string): string[] {
  const m = text.match(/<system-log>([\s\S]*?)<\/system-log>/i);
  if (!m) return [];
  return m[1].split('\n').map((l) => l.trim()).filter(Boolean);
}

function stripSystemLog(text: string): string {
  return text.replace(/\n?<system-log>[\s\S]*?<\/system-log>/gi, '').trim();
}

export async function callGmAutoFight(
  state: GameState,
  autoFightPrompt: string,
  settings: Settings,
  onRetry?: (attempt: number, delayMs: number) => void
): Promise<string> {
  const systemPrompt = 'You are a LitRPG Game Master. Write visceral, fast-paced combat narration. Output only the narrative paragraph — no tags, no headers, no meta commentary.';

  let provider = settings.aiProvider ?? 'gemini';
  let apiKey = provider === 'openrouter' ? settings.openrouterApiKey : settings.geminiApiKey;
  if ((provider === 'gemini' || !apiKey) && settings.openrouterApiKey) {
    provider = 'openrouter';
    apiKey = settings.openrouterApiKey;
  }
  let model = settings.customModelId || undefined;
  if (provider === 'openrouter' && !model) model = 'deepseek/deepseek-chat';

  if (!apiKey) throw new Error('No API key configured. Open API Settings to add a key.');

  let text: string;
  if (provider === 'gemini') {
    text = await withRetry(() => callGoogle(autoFightPrompt, systemPrompt, apiKey, model), onRetry);
  } else if (provider === 'openrouter') {
    text = await withRetry(() => callOpenRouter(autoFightPrompt, systemPrompt, apiKey, model, settings.baseUrl), onRetry);
  } else if (provider === 'anthropic') {
    text = await withRetry(() => callAnthropic(autoFightPrompt, systemPrompt, apiKey, model), onRetry);
  } else if (provider === 'openai' || provider === 'groq' || provider === 'ollama') {
    text = await withRetry(() => callOpenAICompatible(autoFightPrompt, systemPrompt, apiKey, model, provider, settings.baseUrl), onRetry);
  } else {
    text = await withRetry(() => callOpenRouter(autoFightPrompt, systemPrompt, apiKey, model, settings.baseUrl), onRetry);
  }

  if (!text) throw new Error('The AI provider returned no content for auto-fight summary.');
  return text.trim();
}

export async function callGm(
  state: GameState,
  playerInput: string,
  settings: Settings,
  activeLoreCards: LoreCard[] = [],
  onRetry?: (attempt: number, delayMs: number) => void
): Promise<GmResult> {
  let systemPrompt = buildSystemPrompt(state, settings, activeLoreCards);

  // Inject Map Trigger Mode System Directives
  if (settings.mapTriggerMode === 'immersive') {
    systemPrompt += `\n\n[MAP SYSTEM MODE: IMMERSIVE]\n- Focus on narrative immersion.\n- Output XML map tags (<dungeon-load>, <hex-move>, <map-floor-change>) ONLY when entering brand new regions, major landmarks, or changing floors. Avoid tag output for micro-steps within the same room.`;
  } else {
    systemPrompt += `\n\n[MAP SYSTEM MODE: TACTICAL]\n- Output precise XML map tags (<hex-move>, <map-floor-change>, <dungeon-load>) whenever physical coordinates or active room nodes change.`;
  }

  // Inject Visual Anchors for Image Consistency
  const activeAnchors = activeLoreCards.filter(c => c.visualAnchor).map(c => `${c.name}: ${c.visualAnchor}`);
  if (activeAnchors.length > 0) {
    systemPrompt += `\n\n[IMAGE GENERATION RULE]\nWhen creating a [CINEMATIC SCENE PROMPT], if any of the following entities are in the scene, you MUST append their exact visual description to the prompt:\n${activeAnchors.join('\n')}`;
  }

  const prompt = buildContextPrompt(state, playerInput);

  // ROBUST PROVIDER NORMALIZATION & DEEPSEEK/OPENROUTER FALLBACK
  let provider = settings.aiProvider ?? 'gemini';
  let apiKey = provider === 'openrouter' ? settings.openrouterApiKey : settings.geminiApiKey;

  // Auto-fallback: if provider is gemini but gemini key is missing and openrouter key exists, switch to openrouter
  if ((provider === 'gemini' || !apiKey) && settings.openrouterApiKey) {
    provider = 'openrouter';
    apiKey = settings.openrouterApiKey;
  }

  // Default OpenRouter model to DeepSeek V3 if custom model ID is blank
  let model = settings.customModelId || undefined;
  if (provider === 'openrouter' && !model) {
    model = 'deepseek/deepseek-chat';
  }

  logger.info('ai-dispatch', `callGm — normalized provider: "${provider}", model: "${model ?? 'default'}", hasKey: ${!!apiKey}`);

  if (!apiKey) throw new Error('No API key configured. Open API Settings to add a key.');

  let text: string;
  if (provider === 'gemini') {
    text = await withRetry(() => callGoogle(prompt, systemPrompt, apiKey, model), onRetry);
  } else if (provider === 'openrouter') {
    text = await withRetry(() => callOpenRouter(prompt, systemPrompt, apiKey, model, settings.baseUrl), onRetry);
  } else if (provider === 'anthropic') {
    text = await withRetry(() => callAnthropic(prompt, systemPrompt, apiKey, model), onRetry);
  } else if (provider === 'openai' || provider === 'groq' || provider === 'ollama') {
    text = await withRetry(() => callOpenAICompatible(prompt, systemPrompt, apiKey, model, provider, settings.baseUrl), onRetry);
  } else {
    text = await withRetry(() => callOpenRouter(prompt, systemPrompt, apiKey, model, settings.baseUrl), onRetry);
  }

  if (!text) throw new Error('The AI provider returned no content.');

  const imagePrompt = extractImagePrompt(text);
  let cleanText = imagePrompt ? stripImageBlock(text) : text;
  const systemLog = extractSystemLog(cleanText);
  cleanText = stripSystemLog(cleanText);

  return {
    text: cleanText,
    imagePrompt,
    rolls: extractRolls(cleanText),
    systemLog,
  };
}

async function callGoogle(prompt: string, systemPrompt: string, apiKey: string, model?: string): Promise<string> {
  const modelName = model || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  logRequest('Google', url.replace(/key=[^&]+/, 'key=***'), modelName, systemPrompt.length, prompt.length);
  const start = performance.now();
  let res: Response;
  try {
    res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: AI_MAX_OUTPUT_TOKENS },
      }),
    }, 'Google');
  } catch (e) {
    logError('Google', e);
    throw e;
  }
  const elapsed = Math.round(performance.now() - start);
  logger.info('ai-response', `Google response status: ${res.status} ${res.ok ? 'OK' : 'ERROR'} (${elapsed}ms)`);
  if (res.status === 429) {
    const retryAfterSec = Number(res.headers.get('Retry-After') ?? res.headers.get('retry-after') ?? 0);
    const retryAfterMs = retryAfterSec > 0 ? retryAfterSec * 1000 : undefined;
    const body = await res.json().catch(() => ({}));
    const serverMsg: string = body?.error?.message ?? '';
    const dynMatch = serverMsg.match(/(\d+) second/i);
    const dynMs = dynMatch ? Number(dynMatch[1]) * 1000 : undefined;
    logger.warn('ai-rate-limit', `Google 429 rate-limit`, { retryAfterSec, serverMsg, chosenDelay: retryAfterMs ?? dynMs ?? 60000 });
    throw new RateLimitError('Rate limit exceeded (429).', retryAfterMs ?? dynMs ?? 60000);
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = errBody?.error;
    logResponse('Google', res.status, false, elapsed, JSON.stringify(errBody));
    throw new Error(err?.message ?? `AI service error ${res.status}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  logResponse('Google', res.status, true, elapsed, text);
  return text;
}

async function callOpenRouter(prompt: string, systemPrompt: string, apiKey: string, model?: string, baseUrl?: string): Promise<string> {
  const base = baseUrl?.trim() || 'https://openrouter.ai/api/v1';
  const url = `${base}/chat/completions`;
  const modelName = model || 'deepseek/deepseek-chat';
  logRequest('OpenRouter', url, modelName, systemPrompt.length, prompt.length);
  const start = performance.now();
  let res: Response;
  try {
    res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_tokens: AI_MAX_OUTPUT_TOKENS,
      }),
    }, 'OpenRouter');
  } catch (e) {
    logError('OpenRouter', e);
    throw e;
  }
  const elapsed = Math.round(performance.now() - start);
  logger.info('ai-response', `OpenRouter response status: ${res.status} ${res.ok ? 'OK' : 'ERROR'} (${elapsed}ms)`);
  if (res.status === 429) {
    const retryAfterSec = Number(res.headers.get('Retry-After') ?? res.headers.get('retry-after') ?? 0);
    logger.warn('ai-rate-limit', `OpenRouter 429 rate-limit`, { retryAfterSec });
    throw new RateLimitError('Rate limit exceeded (429).', retryAfterSec > 0 ? retryAfterSec * 1000 : 60000);
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = errBody?.error;
    logResponse('OpenRouter', res.status, false, elapsed, JSON.stringify(errBody));
    throw new Error(err?.message ?? `OpenRouter error ${res.status}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  logResponse('OpenRouter', res.status, true, elapsed, text);
  return text;
}

async function callAnthropic(prompt: string, systemPrompt: string, apiKey: string, model?: string): Promise<string> {
  const url = 'https://api.anthropic.com/v1/messages';
  const modelName = model || 'claude-3-5-sonnet-latest';
  logRequest('Anthropic', url, modelName, systemPrompt.length, prompt.length);
  const start = performance.now();
  let res: Response;
  try {
    res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelName,
        system: systemPrompt,
        max_tokens: AI_MAX_OUTPUT_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      }),
    }, 'Anthropic');
  } catch (e) {
    logError('Anthropic', e);
    throw e;
  }
  const elapsed = Math.round(performance.now() - start);
  logger.info('ai-response', `Anthropic response status: ${res.status} ${res.ok ? 'OK' : 'ERROR'} (${elapsed}ms)`);
  if (res.status === 429) {
    const retryAfterSec = Number(res.headers.get('Retry-After') ?? res.headers.get('retry-after') ?? 0);
    logger.warn('ai-rate-limit', `Anthropic 429 rate-limit`, { retryAfterSec });
    throw new RateLimitError('Rate limit exceeded (429).', retryAfterSec > 0 ? retryAfterSec * 1000 : 60000);
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = errBody?.error;
    logResponse('Anthropic', res.status, false, elapsed, JSON.stringify(errBody));
    throw new Error(err?.message ?? `Anthropic error ${res.status}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text ?? '';
  logResponse('Anthropic', res.status, true, elapsed, text);
  return text;
}

async function callOpenAICompatible(prompt: string, systemPrompt: string, apiKey: string, model: string | undefined, provider: string, baseUrl?: string): Promise<string> {
  const defaultBase = provider === 'groq' ? 'https://api.groq.com/openai/v1' : provider === 'ollama' ? 'http://localhost:11434/v1' : 'https://api.openai.com/v1';
  const base = baseUrl?.trim() || defaultBase;
  const url = `${base}/chat/completions`;
  const defaultModel = provider === 'groq' ? 'llama-3.3-70b-versatile' : provider === 'ollama' ? 'llama3.1' : 'gpt-4o-mini';
  const modelName = model || defaultModel;
  logRequest(`OpenAI-compat (${provider})`, url, modelName, systemPrompt.length, prompt.length);
  const start = performance.now();
  let res: Response;
  try {
    res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_tokens: AI_MAX_OUTPUT_TOKENS,
      }),
    }, `OpenAI-compatible ${provider}`);
  } catch (e) {
    logError(`OpenAI-compat (${provider})`, e);
    throw e;
  }
  const elapsed = Math.round(performance.now() - start);
  logger.info('ai-response', `OpenAI-compat (${provider}) response status: ${res.status} ${res.ok ? 'OK' : 'ERROR'} (${elapsed}ms)`);
  if (res.status === 429) {
    const retryAfterSec = Number(res.headers.get('Retry-After') ?? res.headers.get('retry-after') ?? 0);
    logger.warn('ai-rate-limit', `OpenAI-compat (${provider}) 429 rate-limit`, { retryAfterSec });
    throw new RateLimitError('Rate limit exceeded (429).', retryAfterSec > 0 ? retryAfterSec * 1000 : 60000);
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = errBody?.error;
    logResponse(`OpenAI-compat (${provider})`, res.status, false, elapsed, JSON.stringify(errBody));
    throw new Error(err?.message ?? `API error ${res.status}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  logResponse(`OpenAI-compat (${provider})`, res.status, true, elapsed, text);
  return text;
}
