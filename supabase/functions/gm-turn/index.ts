import { buildFactLeafSystemPrompt, buildContextPrompt } from '../_shared/gm/masterPrompt.ts';
import { freeWriterModelId, isPrivilegedPlayRequest } from '../_shared/playPrivileges.ts';
import { resolvePerspective, sentenceRepairSystemPrompt } from '../_shared/gm/narrativePov.ts';
import { readCheckPayload, readRepairPayload, renderCheckRequest, renderRepairRequest } from '../_shared/gm/gmSideRequests.ts';
import {
  checkGmTurnCaller,
  checkOrigin,
  corsHeadersFor,
  preAuthRateKey,
  rateLimitRetryAfter,
  readBodyCapped,
} from '../_shared/gmTurnAccess.ts';
import { CLAUSE_CHECK_SYS } from '../_shared/gm/clauseCheckPrompt.ts';
import {
  FREE_WRITER_OPENROUTER_MODEL,
  hasHanScript,
  isCutOffFinish,
  NO_REASONING_HINT,
  openRouterChatBody,
  openRouterChatHeaders,
  readChatCompletion,
  readChatUsage,
  rejectFireworksServed,
  stripReasoningBlocks,
  sumWriterUsage,
  WRITER_REASK_MAX_TOKENS,
  type ChatCompletionRead,
} from '../_shared/gm/openRouterChat.ts';
import { pinnedModel } from '../_shared/gm/modelIds.ts';
import { isUnwrittenLiveOpening, OPENING_PAGE_JSON_SCHEMA } from '../_shared/gm/openingWriterNotes.ts';

const AI_MAX_OUTPUT_TOKENS = 4096;
/**
 * Phase 0 — the server decides the upstream. Every model call goes to this URL; nothing in the
 * request can change it, so the server's OpenRouter key is only ever sent to OpenRouter.
 */
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/** auto-fight (a free caller prompt) has no client caller and is refused. */
type GmMode = 'turn' | 'repair' | 'check';

interface GmRequestBody {
  mode?: GmMode;
  playerInput?: string;
  state?: Record<string, unknown>;
  loreCards?: unknown[];
  settings?: Record<string, unknown>;
  clientApiKey?: string;
  /** The turn's strict Token Prose schema, built by the client from the REF ENUM. */
  tokenSchema?: Record<string, unknown>;
  /** Phase 0 — mode 'repair' / 'check': typed data only; the prompt is built here. */
  repair?: unknown;
  check?: unknown;
  // Phase 0 — trainLog / baseUrl / aiProvider fields from older clients are ignored.
}

/** A client schema is forwarded only when it is a plain object of sane size; otherwise the static schema stands. */
const TOKEN_SCHEMA_MAX_CHARS = 64_000;
function readTokenSchema(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  return JSON.stringify(raw).length <= TOKEN_SCHEMA_MAX_CHARS ? (raw as Record<string, unknown>) : undefined;
}

function isOpeningPageSchema(schema: Record<string, unknown> | undefined): boolean {
  const req = schema?.required;
  return Array.isArray(req) && req.includes('journalTitle') && req.includes('options') && req.includes('prose');
}

function schemaForTurn(state: Record<string, unknown> | undefined, rawSchema: unknown): Record<string, unknown> | undefined {
  if (state && isUnwrittenLiveOpening(state as { engineMode?: string; openingEstablishment?: { instance?: unknown; sceneWritten?: boolean } | null })) {
    return OPENING_PAGE_JSON_SCHEMA;
  }
  return readTokenSchema(rawSchema);
}

function jsonResponse(req: Request, body: Record<string, unknown>, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeadersFor(req),
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
  let systemPrompt = buildFactLeafSystemPrompt(state as any, settings as any, loreCards as any);
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
  // q50-MAP2 — structured places only; never invent geography from prose. Always include newPlaces (use []).
  systemPrompt +=
    `\n\n[NEW PLACES]\nWhen you introduce a new reachable place this turn, put it in JSON field newPlaces: [{name, kind, exitsTo}] with exitsTo naming only known hubs. If none, newPlaces: []. Never rely on prose alone to register a place.`;
  return systemPrompt;
}

/**
 * Phase 0 — the server picks the provider and the URL. The caller's aiProvider / baseUrl are ignored.
 * OpenRouter always (a player's own key, else the server key); the server Gemini key is only a
 * fallback when the server has no OpenRouter key and the player sent none.
 */
function resolveCredentials(body: GmRequestBody): {
  provider: 'openrouter' | 'gemini';
  apiKey: string;
  model?: string;
} {
  const settings = body.settings ?? {};
  const clientKey = typeof body.clientApiKey === 'string' ? body.clientApiKey.trim() : '';
  const serverOpenRouter = Deno.env.get('OPENROUTER_API_KEY')?.trim() || '';
  const serverGemini = Deno.env.get('GEMINI_API_KEY')?.trim() || '';

  const tier = String(settings.subscriptionTier ?? '').toLowerCase();
  const kidMode = String(settings.contentMode ?? '') === 'kid';
  const byokNoHosted = tier === 'admin' && !kidMode;

  let model =
    typeof settings.customModelId === 'string' && settings.customModelId.trim()
      ? settings.customModelId.trim()
      : undefined;
  // Old recorded Fireworks slugs must never place a call — remap to the Free OpenRouter DeepSeek.
  if (model && /^accounts\/fireworks\/|^fireworks\//i.test(model)) model = FREE_WRITER_OPENROUTER_MODEL;
  if (!model && (tier === 'free' || !tier)) model = FREE_WRITER_OPENROUTER_MODEL;

  if (clientKey) return { provider: 'openrouter', apiKey: clientKey, model: pinnedModel('openrouter', model) };
  if (byokNoHosted) return { provider: 'openrouter', apiKey: '', model };
  if (serverOpenRouter) return { provider: 'openrouter', apiKey: serverOpenRouter, model: pinnedModel('openrouter', model) };
  if (serverGemini) return { provider: 'gemini', apiKey: serverGemini, model: undefined };
  return { provider: 'openrouter', apiKey: '', model };
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
  // Key in a header, never in the URL (URLs end up in logs).
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
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
    await res.body?.cancel();
    throw new Error(`AI service error ${res.status}`);
  }
  const data = await res.json();
  const cand = data.candidates?.[0];
  const parts = (cand?.content?.parts ?? []) as Array<{ text?: string; thought?: boolean }>;
  const story = parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('');
  const usage = readChatUsage(data);
  const read = readPlainReply(story, cand?.finishReason);
  if (!read.text && parts.some((p) => p.thought)) return { text: '', issue: 'reasoning-only', usage };
  return { ...read, usage };
}

/** OpenRouter chat call. The URL is the server constant above — never from the request. */
async function callOpenRouter(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  model: string,
  opts: { tokenProse?: boolean; tokenSchema?: Record<string, unknown>; maxTokens: number }
): Promise<ChatCompletionRead> {
  const maxTokens = opts.maxTokens;
  const tokenProse = !!opts?.tokenProse;
  const post = (withSchema: boolean) =>
    fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: openRouterChatHeaders(apiKey),
      body: JSON.stringify(
        openRouterChatBody(
          model,
          systemPrompt,
          prompt,
          maxTokens,
          withSchema
            ? {
                tokenProse: true,
                n: isOpeningPageSchema(opts.tokenSchema) ? 1 : 2,
                schema: opts.tokenSchema,
                schemaName: isOpeningPageSchema(opts.tokenSchema) ? 'opening_page' : 'token_prose',
                attachNewPlaces: !isOpeningPageSchema(opts.tokenSchema),
              }
            : undefined
        )
      ),
    });
  let res = await post(tokenProse);
  if (!res.ok && tokenProse && res.status !== 429) {
    res = await post(false);
  }
  if (res.status === 429) {
    const err = new Error('Rate limit exceeded (429).');
    (err as Error & { status: number }).status = 429;
    throw err;
  }
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`OpenRouter error ${res.status}`);
  }
  // Hard reject if OpenRouter somehow served via Fireworks (provider.ignore should prevent this).
  return rejectFireworksServed(readChatCompletion(await res.json()));
}

Deno.serve(async (req) => {
  const respond = (body: Record<string, unknown>, status = 200, extra?: Record<string, string>) =>
    jsonResponse(req, body, status, extra);
  if (req.method === 'OPTIONS') {
    // Preflight: allowed Origin → 204 with CORS; no or foreign Origin → bare 403.
    const cors = corsHeadersFor(req);
    return cors['Access-Control-Allow-Origin']
      ? new Response(null, { status: 204, headers: cors })
      : new Response(null, { status: 403, headers: { Vary: 'Origin' } });
  }
  if (req.method !== 'POST') {
    return respond({ error: 'Method not allowed' }, 405);
  }

  // Phase 0 — who may call, cheapest checks first so junk callers cost no outgoing calls:
  // Origin (no network) → per-IP limit (no network) → project key → verified user → per-user limit.
  const origin = checkOrigin(req);
  if (!origin.ok) return respond({ error: origin.error }, origin.status);
  const tooSoon = (keys: string[]) => {
    const wait = rateLimitRetryAfter(keys);
    return wait > 0 ? respond({ error: 'Rate limit exceeded (429).' }, 429, { 'Retry-After': String(wait) }) : null;
  };
  const ipLimited = tooSoon([await preAuthRateKey(req)]);
  if (ipLimited) return ipLimited;
  const caller = await checkGmTurnCaller(req, origin.hasOrigin);
  if (!caller.ok) return respond({ error: caller.error }, caller.status);
  // A call with no Origin is not the game in a browser: founder / staff JWT only (same user lookup, cached).
  const privileged = await isPrivilegedPlayRequest(req);
  if (!caller.hasOrigin && !privileged) {
    return respond({ error: 'Origin required.' }, 403);
  }
  if (caller.userId) {
    const userLimited = tooSoon([`user:${caller.userId}`]);
    if (userLimited) return userLimited;
  }

  let body: GmRequestBody;
  const rawBody = await readBodyCapped(req);
  if (rawBody == null) return respond({ error: 'Request body too large.' }, 413);
  try {
    body = JSON.parse(rawBody);
  } catch {
    return respond({ error: 'Invalid JSON body' }, 400);
  }
  if (!body || typeof body !== 'object') return respond({ error: 'Invalid JSON body' }, 400);

  if (body.mode !== undefined && body.mode !== 'turn' && body.mode !== 'repair' && body.mode !== 'check') {
    return respond({ error: 'Unsupported mode.' }, 400);
  }
  const mode: GmMode = body.mode ?? 'turn';
  // Opening page / cover-continue may send '' or '(opening)'. Blank used to 400
  // ("playerInput is required") and force the stitch fallback.
  const playerInput = (typeof body.playerInput === 'string' ? body.playerInput : '').trim()
    || '(opening)';
  if (!body.state || typeof body.state !== 'object') {
    return respond({ error: 'state is required' }, 400);
  }

  const settings = body.settings ?? {};
  const loreCards = Array.isArray(body.loreCards) ? body.loreCards : [];
  if (!privileged) {
    settings.subscriptionTier = 'free';
    settings.customModelId = freeWriterModelId();
    body.settings = settings;
  }
  const { provider, apiKey, model } = resolveCredentials(body);
  if (!apiKey) {
    return respond(
      {
        error:
          String(settings.subscriptionTier ?? '').toLowerCase() === 'admin'
            && String(settings.contentMode ?? '') !== 'kid'
            ? 'Admin BYOK needs an OpenRouter text key. Hosted AI is not included on this tier.'
            : 'No API key available.',
      },
      400
    );
  }

  let systemPrompt: string;
  let userPrompt: string;
  if (mode === 'repair') {
    // Phase 0 — typed repair data only; the request text is built here, never taken from the caller.
    const payload = readRepairPayload(body.repair);
    if (!payload) return respond({ error: 'repair payload is required' }, 400);
    // deno-lint-ignore no-explicit-any
    systemPrompt = sentenceRepairSystemPrompt((body.state as any).character, settings.perspective);
    userPrompt = renderRepairRequest(payload);
  } else if (mode === 'check') {
    // Phase 0 — typed fact-check data only; the request text is built here.
    const payload = readCheckPayload(body.check);
    if (!payload) return respond({ error: 'check payload is required' }, 400);
    systemPrompt = CLAUSE_CHECK_SYS;
    userPrompt = renderCheckRequest(payload);
  } else {
    // deno-lint-ignore no-explicit-any
    if (!(body.state as any).completedEvent) {
      console.warn(
        '[gm-turn] state.completedEvent missing on a turn call — packet rebuilt on the edge'
      );
    }
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

  // 28w — every model call that answered this turn, for per-turn token logging.
  let calledModel: string | null = null;
  let servedProvider: string | null = null;
  let servedModel: string | null = null;
  const callUsage: Array<{
    tokensIn: number | null;
    tokensOut: number | null;
    tokensCached: number | null;
    modelCalls: number;
    servedProvider?: string | null;
    servedModel?: string | null;
  }> = [];
  const turnUsage = () =>
    callUsage.length
      ? {
          ...sumWriterUsage(callUsage),
          modelId: calledModel,
          ...(servedProvider ? { servedProvider } : {}),
          ...(servedModel ? { servedModel } : {}),
        }
      : undefined;

  try {
    const runOnce = async (sys: string, maxTokens: number): Promise<ChatCompletionRead> => {
      if (provider === 'gemini') {
        calledModel = model || 'gemini-2.0-flash';
        return callGoogle(userPrompt, sys, apiKey, model, maxTokens);
      }
      const modelName = model || pinnedModel('openrouter');
      calledModel = modelName;
      return callOpenRouter(userPrompt, sys, apiKey, modelName, {
        tokenProse: mode === 'turn',
        tokenSchema: mode === 'turn' ? schemaForTurn(body.state, body.tokenSchema) : undefined,
        maxTokens,
      });
    };

    // Any model: a thrown provider error (not 429) is the same case as an empty reply.
    let providerError = '';
    const tryCall = async (sys: string, maxTokens: number): Promise<ChatCompletionRead> => {
      try {
        const read = await runOnce(sys, maxTokens);
        if (read.servedModel) {
          calledModel = read.servedModel;
          servedModel = read.servedModel;
        }
        if (read.servedProvider) servedProvider = read.servedProvider;
        callUsage.push({
          tokensIn: read.usage?.tokensIn ?? null,
          tokensOut: read.usage?.tokensOut ?? null,
          tokensCached: read.usage?.tokensCached ?? null,
          modelCalls: 1,
          servedProvider: read.servedProvider ?? null,
          servedModel: read.servedModel ?? null,
        });
        return read;
      } catch (err) {
        if ((err as { status?: number })?.status === 429) throw err;
        providerError = 'The AI provider request failed.';
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

    const usage = turnUsage();
    if (!best.text) {
      return respond(
        {
          error: providerError || 'The AI provider returned no content.',
          rawIssue: rawIssue ?? 'empty',
          ...(usage ? { usage } : {}),
        },
        502
      );
    }

    // Scrubbed response — never return prompts, keys, call logs, or pipeline diagnostics.
    // q50-MAP2 — pass structured newPlaces through when the writer JSON includes them.
    let newPlaces: unknown;
    try {
      const parsed = JSON.parse(best.text) as { newPlaces?: unknown };
      if (Array.isArray(parsed?.newPlaces)) newPlaces = parsed.newPlaces;
    } catch {
      /* freeform prose — no structured places */
    }
    return respond({
      text: best.text,
      ...(rawIssue ? { rawIssue } : {}),
      ...(usage ? { usage } : {}),
      ...(newPlaces ? { newPlaces } : {}),
    });
  } catch (err) {
    const status = (err as { status?: number })?.status === 429 ? 429 : 502;
    const message = status === 429 ? 'Rate limit exceeded (429).' : 'GM proxy failure';
    return respond(
      { error: message },
      status,
      status === 429 ? { 'Retry-After': '60' } : undefined
    );
  }
});
