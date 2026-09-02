/**
 * Client-side GM path (BYOK). Only loaded when the server proxy is disabled —
 * production builds with VITE_ALLOW_CLIENT_GM !== 'true' tree-shake this module out.
 */
// Master Prompt v2.0 - Hierarchical architecture (docs/MASTER-PROMPT-ARCHITECTURE.md)
import { buildSystemPrompt, buildContextPrompt } from './masterPrompt';
import type { GameState, Settings, LoreCard } from './types';
import { logger } from './logger';
import type { GmResult } from './aiServiceShared';
import { RateLimitError, withRetry, processGmCompletion } from './aiServiceShared';
import { resolveWriterModel } from './subscriptionTiers';
import { effectiveWriterTier, isTestLabEnabled } from './testLab';
import { getAutoplayWriterOverride } from './autoplayWriter';
import {
  extractChatCompletionText,
  openRouterChatBody,
  openRouterChatHeaders,
} from './openRouterChat';

const AI_REQUEST_TIMEOUT_MS = 45_000;
const AI_MAX_OUTPUT_TOKENS = 4_096;

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
  logger[level]('ai-response', `${provider} response ${status} ${ok ? 'OK' : 'ERROR'} (${durationMs}ms)`, {
    status,
    ok,
    durationMs,
    bodyPreview: import.meta.env.PROD ? undefined : bodyPreview,
  });
}

function logError(provider: string, err: unknown) {
  logger.error(
    'ai-network',
    `${provider} network error`,
    err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err
  );
}

function normalizeProvider(settings: Settings): { provider: string; apiKey: string; model?: string } {
  const autoplay = getAutoplayWriterOverride();
  const apiKey = (
    autoplay?.apiKey ||
    settings.openrouterApiKey ||
    settings.geminiApiKey ||
    ''
  ).trim();
  if (settings.subscriptionTier === 'admin' && settings.contentMode !== 'kid' && !apiKey) {
    throw new Error('Admin BYOK needs an OpenRouter text key in Settings. Hosted AI is not included on this tier.');
  }
  const customModelId =
    autoplay?.model ||
    (isTestLabEnabled() && !autoplay ? null : settings.customModelId);
  const model = resolveWriterModel({
    aiProvider: 'openrouter',
    customModelId,
    tier: effectiveWriterTier(settings.subscriptionTier),
  });
  return { provider: 'openrouter', apiKey, model: autoplay?.model || model };
}

async function callGoogle(prompt: string, systemPrompt: string, apiKey: string, model?: string): Promise<string> {
  const modelName = model || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  logRequest('Google', url.replace(/key=[^&]+/, 'key=***'), modelName, systemPrompt.length, prompt.length);
  const start = performance.now();
  let res: Response;
  try {
    res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: AI_MAX_OUTPUT_TOKENS },
        }),
      },
      'Google'
    );
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
    throw new RateLimitError('Rate limit exceeded (429).', retryAfterMs ?? dynMs ?? 60000);
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    logResponse('Google', res.status, false, elapsed, JSON.stringify(errBody));
    throw new Error(errBody?.error?.message ?? `AI service error ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callOpenRouter(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  model?: string,
  baseUrl?: string
): Promise<string> {
  const base = baseUrl?.trim() || 'https://openrouter.ai/api/v1';
  const url = `${base}/chat/completions`;
  const modelName = model || 'deepseek/deepseek-chat';
  logRequest('OpenRouter', url, modelName, systemPrompt.length, prompt.length);
  const start = performance.now();
  let res: Response;
  try {
    res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: openRouterChatHeaders(apiKey),
        body: JSON.stringify(openRouterChatBody(modelName, systemPrompt, prompt, AI_MAX_OUTPUT_TOKENS)),
      },
      'OpenRouter'
    );
  } catch (e) {
    logError('OpenRouter', e);
    throw e;
  }
  const elapsed = Math.round(performance.now() - start);
  if (res.status === 429) {
    const retryAfterSec = Number(res.headers.get('Retry-After') ?? res.headers.get('retry-after') ?? 0);
    throw new RateLimitError('Rate limit exceeded (429).', retryAfterSec > 0 ? retryAfterSec * 1000 : 60000);
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    logResponse('OpenRouter', res.status, false, elapsed, JSON.stringify(errBody));
    throw new Error(errBody?.error?.message ?? `OpenRouter error ${res.status}`);
  }
  const data = await res.json();
  return extractChatCompletionText(data);
}

async function callAnthropic(prompt: string, systemPrompt: string, apiKey: string, model?: string): Promise<string> {
  const url = 'https://api.anthropic.com/v1/messages';
  const modelName = model || 'claude-3-5-sonnet-latest';
  logRequest('Anthropic', url, modelName, systemPrompt.length, prompt.length);
  const start = performance.now();
  let res: Response;
  try {
    res = await fetchWithTimeout(
      url,
      {
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
      },
      'Anthropic'
    );
  } catch (e) {
    logError('Anthropic', e);
    throw e;
  }
  const elapsed = Math.round(performance.now() - start);
  if (res.status === 429) {
    const retryAfterSec = Number(res.headers.get('Retry-After') ?? res.headers.get('retry-after') ?? 0);
    throw new RateLimitError('Rate limit exceeded (429).', retryAfterSec > 0 ? retryAfterSec * 1000 : 60000);
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    logResponse('Anthropic', res.status, false, elapsed, JSON.stringify(errBody));
    throw new Error(errBody?.error?.message ?? `Anthropic error ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

async function callOpenAICompatible(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  model: string | undefined,
  provider: string,
  baseUrl?: string
): Promise<string> {
  const defaultBase =
    provider === 'groq'
      ? 'https://api.groq.com/openai/v1'
      : provider === 'ollama'
        ? 'http://localhost:11434/v1'
        : 'https://api.openai.com/v1';
  const base = baseUrl?.trim() || defaultBase;
  const url = `${base}/chat/completions`;
  const defaultModel =
    provider === 'groq' ? 'llama-3.3-70b-versatile' : provider === 'ollama' ? 'llama3.1' : 'gpt-4o-mini';
  const modelName = model || defaultModel;
  logRequest(`OpenAI-compat (${provider})`, url, modelName, systemPrompt.length, prompt.length);
  const start = performance.now();
  let res: Response;
  try {
    res = await fetchWithTimeout(
      url,
      {
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
      },
      `OpenAI-compatible ${provider}`
    );
  } catch (e) {
    logError(`OpenAI-compat (${provider})`, e);
    throw e;
  }
  const elapsed = Math.round(performance.now() - start);
  if (res.status === 429) {
    const retryAfterSec = Number(res.headers.get('Retry-After') ?? res.headers.get('retry-after') ?? 0);
    throw new RateLimitError('Rate limit exceeded (429).', retryAfterSec > 0 ? retryAfterSec * 1000 : 60000);
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    logResponse(`OpenAI-compat (${provider})`, res.status, false, elapsed, JSON.stringify(errBody));
    throw new Error(errBody?.error?.message ?? `API error ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function dispatchLlm(
  prompt: string,
  systemPrompt: string,
  settings: Settings,
  onRetry?: (attempt: number, delayMs: number) => void
): Promise<string> {
  const { provider, apiKey, model } = normalizeProvider(settings);
  logger.info('ai-dispatch', `direct GM — provider: "${provider}", model: "${model ?? 'default'}", hasKey: ${!!apiKey}`);
  if (!apiKey) throw new Error('No API key configured. Open API Settings to add a key.');

  if (provider === 'gemini') {
    return withRetry(() => callGoogle(prompt, systemPrompt, apiKey, model), onRetry);
  }
  if (provider === 'openrouter') {
    // Re-read override each attempt so 429 rotation (m3-free ↔ m2.7-free) takes effect.
    return withRetry(() => {
      const autoplay = getAutoplayWriterOverride();
      const key = autoplay?.apiKey || apiKey;
      const m = autoplay?.model || model;
      const base = autoplay?.baseUrl || settings.baseUrl;
      return callOpenRouter(prompt, systemPrompt, key, m, base);
    }, onRetry);
  }
  if (provider === 'anthropic') {
    return withRetry(() => callAnthropic(prompt, systemPrompt, apiKey, model), onRetry);
  }
  if (provider === 'openai' || provider === 'groq' || provider === 'ollama') {
    return withRetry(
      () => callOpenAICompatible(prompt, systemPrompt, apiKey, model, provider, settings.baseUrl),
      onRetry
    );
  }
  return withRetry(() => callOpenRouter(prompt, systemPrompt, apiKey, model, settings.baseUrl), onRetry);
}

function assembleSystemPrompt(state: GameState, settings: Settings, activeLoreCards: LoreCard[]): string {
  let systemPrompt = buildSystemPrompt(state, settings, activeLoreCards);
  if (settings.mapTriggerMode === 'immersive') {
    systemPrompt += `\n\n[MAP SYSTEM MODE: IMMERSIVE]\n- Focus on narrative immersion.\n- Output XML map tags (<dungeon-load>, <hex-move>, <map-floor-change>) ONLY when entering brand new regions, major landmarks, or changing floors. Avoid tag output for micro-steps within the same room.`;
  } else {
    systemPrompt += `\n\n[MAP SYSTEM MODE: TACTICAL]\n- Output precise XML map tags (<hex-move>, <map-floor-change>, <dungeon-load>) whenever physical coordinates or active room nodes change.`;
  }
  const activeAnchors = activeLoreCards.filter((c) => c.visualAnchor).map((c) => `${c.name}: ${c.visualAnchor}`);
  if (activeAnchors.length > 0) {
    systemPrompt += `\n\n[IMAGE GENERATION RULE]\nWhen creating a [CINEMATIC SCENE PROMPT], if any of the following entities are in the scene, you MUST append their exact visual description to the prompt:\n${activeAnchors.join('\n')}`;
  }
  return systemPrompt;
}

export async function callGmDirect(
  state: GameState,
  playerInput: string,
  settings: Settings,
  activeLoreCards: LoreCard[] = [],
  onRetry?: (attempt: number, delayMs: number) => void
): Promise<GmResult> {
  const systemPrompt = assembleSystemPrompt(state, settings, activeLoreCards);
  const prompt = buildContextPrompt(state, playerInput, activeLoreCards);
  const text = await dispatchLlm(prompt, systemPrompt, settings, onRetry);
  if (!text) throw new Error('The AI provider returned no content.');
  return processGmCompletion(text, state.engineMode);
}

export async function callGmAutoFightDirect(
  state: GameState,
  autoFightPrompt: string,
  settings: Settings,
  onRetry?: (attempt: number, delayMs: number) => void
): Promise<string> {
  const systemPrompt =
    'You are a LitRPG Game Master. Write visceral, fast-paced combat narration. Output only the narrative paragraph — no tags, no headers, no meta commentary.';
  const text = await dispatchLlm(autoFightPrompt, systemPrompt, settings, onRetry);
  if (!text) throw new Error('The AI provider returned no content for auto-fight summary.');
  return text.trim();
}
