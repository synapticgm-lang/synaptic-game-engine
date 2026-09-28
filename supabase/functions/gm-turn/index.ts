import { buildSystemPrompt, buildContextPrompt } from '../_shared/gm/masterPrompt.ts';
import { freeWriterModelId, isPrivilegedPlayRequest } from '../_shared/playPrivileges.ts';
import { formatPerspectiveRule, pcPov, resolvePerspective } from '../_shared/gm/narrativePov.ts';
import {
  FIREWORKS_INFERENCE_BASE,
  fireworksChatBody,
  fireworksChatHeaders,
  FREE_WRITER_FIREWORKS_MODEL,
  hasHanScript,
  isCutOffFinish,
  isFireworksWriterModel,
  normalizeFireworksWriterModel,
  NO_REASONING_HINT,
  openRouterChatBody,
  openRouterChatHeaders,
  readChatCompletion,
  stripReasoningBlocks,
  WRITER_REASK_MAX_TOKENS,
  type ChatCompletionRead,
  type FireworksReasoningLevel,
} from '../_shared/gm/openRouterChat.ts';

const AI_MAX_OUTPUT_TOKENS = 4096;
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type GmMode = 'turn' | 'auto-fight';

interface GmRequestBody {
  mode?: GmMode;
  playerInput?: string;
  state?: Record<string, unknown>;
  loreCards?: unknown[];
  settings?: Record<string, unknown>;
  clientApiKey?: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function assembleSystemPrompt(
  state: Record<string, unknown>,
  settings: Record<string, unknown>,
  loreCards: unknown[]
): string {
  // deno-lint-ignore no-explicit-any
  let systemPrompt = buildSystemPrompt(state as any, settings as any, loreCards as any);
  const mapMode = settings.mapTriggerMode === 'immersive' ? 'immersive' : 'tactical';
  if (mapMode === 'immersive') {
    systemPrompt += `\n\n[MAP SYSTEM MODE: IMMERSIVE]\n- Focus on narrative immersion.\n- Output XML map tags (<dungeon-load>, <hex-move>, <map-floor-change>) ONLY when entering brand new regions, major landmarks, or changing floors. Avoid tag output for micro-steps within the same room.`;
  } else {
    systemPrompt += `\n\n[MAP SYSTEM MODE: TACTICAL]\n- Output precise XML map tags (<hex-move>, <map-floor-change>, <dungeon-load>) whenever physical coordinates or active room nodes change.`;
  }

  const anchors = (loreCards as Array<{ name?: string; visualAnchor?: string }>)
    .filter((c) => c?.visualAnchor)
    .map((c) => `${c.name}: ${c.visualAnchor}`);
  if (anchors.length > 0) {
    systemPrompt += `\n\n[IMAGE GENERATION RULE]\nWhen creating a [CINEMATIC SCENE PROMPT], if any of the following entities are in the scene, you MUST append their exact visual description to the prompt:\n${anchors.join('\n')}`;
  }
  return systemPrompt;
}

function resolveCredentials(body: GmRequestBody): {
  provider: string;
  apiKey: string;
  model?: string;
  baseUrl?: string;
} {
  const settings = body.settings ?? {};
  let provider = String(settings.aiProvider ?? 'openrouter');
  const clientKey = typeof body.clientApiKey === 'string' ? body.clientApiKey.trim() : '';
  const serverOpenRouter = Deno.env.get('OPENROUTER_API_KEY')?.trim() || '';
  const serverGemini = Deno.env.get('GEMINI_API_KEY')?.trim() || '';
  const serverFireworks = Deno.env.get('FIREWORKS_API_KEY')?.trim() || '';

  const tier = String(settings.subscriptionTier ?? '').toLowerCase();
  const kidMode = String(settings.contentMode ?? '') === 'kid';
  const byokNoHosted = tier === 'admin' && !kidMode;

  let model = typeof settings.customModelId === 'string' && settings.customModelId.trim()
    ? normalizeFireworksWriterModel(settings.customModelId.trim())
    : undefined;

  // Default Free hosted path is Fireworks — never send the Fireworks slug to OpenRouter.
  const fireworksRequested =
    provider === 'fireworks' ||
    isFireworksWriterModel(model) ||
    (!model && (tier === 'free' || !tier));

  if (fireworksRequested && !clientKey && !byokNoHosted) {
    if (!model) model = FREE_WRITER_FIREWORKS_MODEL;
    return {
      provider: 'fireworks',
      apiKey: serverFireworks,
      model,
      baseUrl: FIREWORKS_INFERENCE_BASE,
    };
  }

  let apiKey = clientKey;
  if (!apiKey && !byokNoHosted) {
    if (provider === 'gemini' && serverGemini) apiKey = serverGemini;
    else if (serverOpenRouter) {
      provider = 'openrouter';
      apiKey = serverOpenRouter;
    } else if (serverGemini) {
      provider = 'gemini';
      apiKey = serverGemini;
    }
  } else if (!byokNoHosted && (provider === 'gemini' || !apiKey) && !clientKey && serverOpenRouter) {
    provider = 'openrouter';
    apiKey = serverOpenRouter;
  }

  // Prefer OpenRouter when client sent an OR key but provider still says gemini
  if (provider === 'gemini' && clientKey.startsWith('sk-or-')) {
    provider = 'openrouter';
  }

  if (provider === 'openrouter' && !model) model = 'deepseek/deepseek-chat';
  if (provider === 'fireworks' && !model) model = FREE_WRITER_FIREWORKS_MODEL;

  return {
    provider,
    apiKey,
    model,
    baseUrl: typeof settings.baseUrl === 'string' ? settings.baseUrl : undefined,
  };
}

/** Plain-text reply (Google / Anthropic) → story text with thinking stripped, plus the raw issue. */
function readPlainReply(raw: string, finish: unknown): ChatCompletionRead {
  const stripped = stripReasoningBlocks(raw ?? '');
  const text = hasHanScript(stripped) ? '' : stripped;
  if (!text) return { text: '', issue: /<(?:think|thinking|reasoning)\b/i.test(raw ?? '') ? 'reasoning-only' : 'empty' };
  return { text, issue: isCutOffFinish(finish) ? 'cut-off' : null };
}

async function callGoogle(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  model: string | undefined,
  maxTokens: number
): Promise<ChatCompletionRead> {
  const modelName = model || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: maxTokens },
    }),
  });
  if (res.status === 429) {
    const err = new Error('Rate limit exceeded (429).');
    (err as Error & { status: number }).status = 429;
    throw err;
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message ?? `AI service error ${res.status}`);
  }
  const data = await res.json();
  const cand = data.candidates?.[0];
  const parts = (cand?.content?.parts ?? []) as Array<{ text?: string; thought?: boolean }>;
  const story = parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('');
  const read = readPlainReply(story, cand?.finishReason);
  if (!read.text && parts.some((p) => p.thought)) return { text: '', issue: 'reasoning-only' };
  return read;
}

const FIREWORKS_REASONING_LEVELS: FireworksReasoningLevel[] = ['none', 'low', null];
let fireworksReasoningLevel: FireworksReasoningLevel = 'none';

async function callOpenAICompat(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  model: string,
  baseUrl: string,
  opts: { tokenProse?: boolean; maxTokens: number }
): Promise<ChatCompletionRead> {
  const maxTokens = opts.maxTokens;
  const fireworks = /fireworks\.ai/i.test(baseUrl);
  const openRouter = /openrouter\.ai/i.test(baseUrl);
  const tokenProse = !!opts?.tokenProse && openRouter && !fireworks;
  const post = (withSchema: boolean, reasoning: FireworksReasoningLevel = null) =>
    fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: fireworks
        ? fireworksChatHeaders(apiKey)
        : openRouter
          ? openRouterChatHeaders(apiKey)
          : {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
      body: JSON.stringify(
        fireworks
          ? fireworksChatBody(model, systemPrompt, prompt, maxTokens, reasoning)
          : openRouter
            ? openRouterChatBody(
                model,
                systemPrompt,
                prompt,
                maxTokens,
                withSchema ? { tokenProse: true, n: 2 } : undefined
              )
            : {
                model,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: prompt },
                ],
                temperature: 0.9,
                max_tokens: maxTokens,
              }
      ),
    });
  let res: Response;
  if (fireworks) {
    // 28l — reasoning off; step down once per level if Fireworks rejects the parameter (it answers 400 or
    // 404 "Model not found"), and keep the level that worked for this warm instance.
    const levels = FIREWORKS_REASONING_LEVELS.slice(FIREWORKS_REASONING_LEVELS.indexOf(fireworksReasoningLevel));
    res = await post(false, levels[0] ?? null);
    for (const next of levels.slice(1)) {
      if (res.ok || res.status < 400 || res.status >= 500 || [401, 403, 429].includes(res.status)) break;
      fireworksReasoningLevel = next;
      res = await post(false, next);
    }
  } else {
    res = await post(tokenProse);
    if (!res.ok && tokenProse && res.status !== 429) {
      res = await post(false);
    }
  }
  if (res.status === 429) {
    const err = new Error('Rate limit exceeded (429).');
    (err as Error & { status: number }).status = 429;
    throw err;
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message ?? `OpenAI-compat error ${res.status}`);
  }
  return readChatCompletion(await res.json());
}

async function callAnthropic(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  model: string | undefined,
  maxTokens: number
): Promise<ChatCompletionRead> {
  const modelName = model || 'claude-3-5-sonnet-latest';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelName,
      system: systemPrompt,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (res.status === 429) {
    const err = new Error('Rate limit exceeded (429).');
    (err as Error & { status: number }).status = 429;
    throw err;
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message ?? `Anthropic error ${res.status}`);
  }
  const data = await res.json();
  const blocks = (data.content ?? []) as Array<{ type?: string; text?: string }>;
  const story = blocks.filter((b) => b.type === 'text' || (!b.type && b.text)).map((b) => b.text ?? '').join('');
  const read = readPlainReply(story, data.stop_reason);
  if (!read.text && blocks.some((b) => b.type === 'thinking')) return { text: '', issue: 'reasoning-only' };
  return read;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body: GmRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const mode: GmMode = body.mode === 'auto-fight' ? 'auto-fight' : 'turn';
  // Opening page / cover-continue may send '' or '(opening)'. Blank used to 400
  // ("playerInput is required") and force the stitch fallback.
  const playerInput = (typeof body.playerInput === 'string' ? body.playerInput : '').trim()
    || '(opening)';
  if (!body.state || typeof body.state !== 'object') {
    return jsonResponse({ error: 'state is required' }, 400);
  }

  const settings = body.settings ?? {};
  const loreCards = Array.isArray(body.loreCards) ? body.loreCards : [];
  const privileged = await isPrivilegedPlayRequest(req);
  if (!privileged) {
    settings.subscriptionTier = 'free';
    settings.customModelId = freeWriterModelId();
    body.settings = settings;
  }
  const { provider, apiKey, model, baseUrl } = resolveCredentials(body);
  if (!apiKey) {
    return jsonResponse(
      {
        error:
          String(settings.subscriptionTier ?? '').toLowerCase() === 'admin'
            && String(settings.contentMode ?? '') !== 'kid'
            ? 'Admin BYOK needs an OpenRouter text key. Hosted AI is not included on this tier.'
            : 'No API key available. Pass clientApiKey or set FIREWORKS_API_KEY (Free) / OPENROUTER_API_KEY (Mid/High) on the edge function.',
      },
      400
    );
  }

  let systemPrompt: string;
  let userPrompt: string;
  if (mode === 'auto-fight') {
    // deno-lint-ignore no-explicit-any
    const pov = pcPov((body.state as any).character, settings.perspective);
    systemPrompt =
      `You are a LitRPG Game Master. Write visceral, fast-paced combat narration. Output only the narrative paragraph — no tags, no headers, no meta commentary.\n\n${formatPerspectiveRule(pov)}`;
    userPrompt = playerInput;
  } else {
    systemPrompt = assembleSystemPrompt(body.state, settings, loreCards);
    userPrompt = buildContextPrompt(
      // deno-lint-ignore no-explicit-any
      body.state as any,
      playerInput,
      // deno-lint-ignore no-explicit-any
      loreCards as any,
      // deno-lint-ignore no-explicit-any
      resolvePerspective(settings.perspective) as any
    );
  }

  try {
    const runOnce = async (sys: string, maxTokens: number): Promise<ChatCompletionRead> => {
      if (provider === 'gemini') {
        return callGoogle(userPrompt, sys, apiKey, model, maxTokens);
      }
      if (provider === 'anthropic') {
        return callAnthropic(userPrompt, sys, apiKey, model, maxTokens);
      }
      const fireworks = provider === 'fireworks' || isFireworksWriterModel(model);
      const base = fireworks
        ? FIREWORKS_INFERENCE_BASE
        : provider === 'openrouter'
          ? baseUrl?.trim() || 'https://openrouter.ai/api/v1'
          : provider === 'groq'
            ? 'https://api.groq.com/openai/v1'
            : provider === 'ollama'
              ? 'http://localhost:11434/v1'
              : baseUrl?.trim() || 'https://api.openai.com/v1';
      const modelName =
        model ||
        (fireworks
          ? FREE_WRITER_FIREWORKS_MODEL
          : provider === 'openrouter'
            ? 'deepseek/deepseek-chat'
            : provider === 'groq'
              ? 'llama-3.3-70b-versatile'
              : 'gpt-4o-mini');
      return callOpenAICompat(userPrompt, sys, apiKey, modelName, base, {
        tokenProse: mode === 'turn',
        maxTokens,
      });
    };

    // Any model: a thrown provider error (not 429) is the same case as an empty reply.
    let providerError = '';
    const tryCall = async (sys: string, maxTokens: number): Promise<ChatCompletionRead> => {
      try {
        return await runOnce(sys, maxTokens);
      } catch (err) {
        if ((err as { status?: number })?.status === 429) throw err;
        providerError = err instanceof Error ? err.message : String(err);
        return { text: '', issue: 'empty' };
      }
    };

    // 28l — empty / reasoning-only / cut-off is a normal case: re-ask the SAME model once with a larger
    // output allowance and a no-reasoning hint. Never switch model.
    const first = await tryCall(systemPrompt, AI_MAX_OUTPUT_TOKENS);
    let best = first;
    if (first.issue) {
      const again = await tryCall(`${systemPrompt}\n\n${NO_REASONING_HINT}`, WRITER_REASK_MAX_TOKENS);
      const complete = (r: ChatCompletionRead) => !!r.text && r.issue !== 'cut-off';
      if (complete(again) || (!complete(first) && again.text.length > first.text.length)) best = again;
    }
    const rawIssue = first.issue ?? undefined;

    if (!best.text) {
      return jsonResponse(
        { error: providerError || 'The AI provider returned no content.', rawIssue: rawIssue ?? 'empty' },
        502
      );
    }

    // Scrubbed response — never return prompts, keys, or pipeline diagnostics.
    return jsonResponse(rawIssue ? { text: best.text, rawIssue } : { text: best.text });
  } catch (err) {
    const status = (err as { status?: number })?.status === 429 ? 429 : 502;
    const message = err instanceof Error ? err.message : 'GM proxy failure';
    return jsonResponse(
      { error: message },
      status,
      status === 429 ? { 'Retry-After': '60' } : undefined
    );
  }
});
