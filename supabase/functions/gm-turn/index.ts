import { buildSystemPrompt, buildContextPrompt } from '../_shared/gm/masterPrompt.ts';
import { freeWriterModelId, isPrivilegedPlayRequest } from '../_shared/playPrivileges.ts';

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

  const tier = String(settings.subscriptionTier ?? '').toLowerCase();
  const kidMode = String(settings.contentMode ?? '') === 'kid';
  const byokNoHosted = tier === 'admin' && !kidMode;

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

  let model = typeof settings.customModelId === 'string' && settings.customModelId.trim()
    ? settings.customModelId.trim()
    : undefined;
  if (provider === 'openrouter' && !model) model = 'deepseek/deepseek-chat';

  return {
    provider,
    apiKey,
    model,
    baseUrl: typeof settings.baseUrl === 'string' ? settings.baseUrl : undefined,
  };
}

async function callGoogle(prompt: string, systemPrompt: string, apiKey: string, model?: string): Promise<string> {
  const modelName = model || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: AI_MAX_OUTPUT_TOKENS },
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
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callOpenAICompat(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  model: string,
  baseUrl: string
): Promise<string> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.9,
      max_tokens: AI_MAX_OUTPUT_TOKENS,
    }),
  });
  if (res.status === 429) {
    const err = new Error('Rate limit exceeded (429).');
    (err as Error & { status: number }).status = 429;
    throw err;
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message ?? `OpenAI-compat error ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callAnthropic(prompt: string, systemPrompt: string, apiKey: string, model?: string): Promise<string> {
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
      max_tokens: AI_MAX_OUTPUT_TOKENS,
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
  return data.content?.[0]?.text ?? '';
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
            : 'No API key available. Pass clientApiKey or set OPENROUTER_API_KEY on the edge function.',
      },
      400
    );
  }

  let systemPrompt: string;
  let userPrompt: string;
  if (mode === 'auto-fight') {
    systemPrompt =
      'You are a LitRPG Game Master. Write visceral, fast-paced combat narration. Output only the narrative paragraph — no tags, no headers, no meta commentary.';
    userPrompt = playerInput;
  } else {
    systemPrompt = assembleSystemPrompt(body.state, settings, loreCards);
    // deno-lint-ignore no-explicit-any
    userPrompt = buildContextPrompt(body.state as any, playerInput, loreCards as any);
  }

  try {
    let text = '';
    if (provider === 'gemini') {
      text = await callGoogle(userPrompt, systemPrompt, apiKey, model);
    } else if (provider === 'anthropic') {
      text = await callAnthropic(userPrompt, systemPrompt, apiKey, model);
    } else {
      const base =
        provider === 'openrouter'
          ? baseUrl?.trim() || 'https://openrouter.ai/api/v1'
          : provider === 'groq'
            ? 'https://api.groq.com/openai/v1'
            : provider === 'ollama'
              ? 'http://localhost:11434/v1'
              : baseUrl?.trim() || 'https://api.openai.com/v1';
      const modelName =
        model ||
        (provider === 'openrouter'
          ? 'deepseek/deepseek-chat'
          : provider === 'groq'
            ? 'llama-3.3-70b-versatile'
            : 'gpt-4o-mini');
      text = await callOpenAICompat(userPrompt, systemPrompt, apiKey, modelName, base);
    }

    if (!text) {
      return jsonResponse({ error: 'The AI provider returned no content.' }, 502);
    }

    // Scrubbed response — never return prompts, keys, or pipeline diagnostics.
    return jsonResponse({ text });
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
