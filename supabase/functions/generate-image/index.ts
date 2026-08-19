/**
 * Hosted memorable / comic image proxy — uses server OPENROUTER_API_KEY
 * so Free players are not told to paste a key in Settings.
 *
 * Deploy (from repo root). config.toml already has verify_jwt = false so guests match gm-turn:
 *   npx supabase functions deploy generate-image
 * If the dashboard still verifies JWT, deploy with:
 *   npx supabase functions deploy generate-image --no-verify-jwt
 *   npx supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...
 *
 * Hosted Free players never send an OpenRouter key; this function reads the edge secret.
 * The browser sends the same session/anon JWT pattern as gm-turn and retries 401 with the anon key.
 *
 * CORS: echo Origin (not `*`) so Authorization + apikey preflights succeed from
 * synaptic-game-engine.vercel.app and synapticgm.com.
 */
const ALLOWED_ORIGINS = new Set([
  'https://synaptic-game-engine.vercel.app',
  'https://www.synapticgm.com',
  'https://synapticgm.com',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
]);

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    if (host.endsWith('.vercel.app')) return true;
    if (host === 'localhost' || host === '127.0.0.1') return true;
  } catch {
    /* ignore */
  }
  return false;
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin')?.trim() || '';
  // Echo a concrete Origin when present — `*` + Authorization fails some browsers.
  // Unknown preview hosts still echo (anon key is already in the web client).
  const allowOrigin = origin && (isAllowedOrigin(origin) || origin.startsWith('http'))
    ? origin
    : '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

const OPENROUTER_CHAT = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_IMAGES = 'https://openrouter.ai/api/v1/images/generations';
const DEFAULT_MODEL = 'black-forest-labs/flux.2-klein-4b';
const MODEL_ALIASES: Record<string, string> = {
  'black-forest-labs/flux-schnell': 'black-forest-labs/flux.2-klein-4b',
  'black-forest-labs/flux.2-flex': 'black-forest-labs/flux.2-klein-4b',
  'black-forest-labs/flux.2-klein-9b': 'black-forest-labs/flux.2-klein-4b',
  'black-forest-labs/flux-dev': 'black-forest-labs/flux.2-pro',
};
const FALLBACK_MODELS = [
  'black-forest-labs/flux.2-klein-4b',
  'google/gemini-2.5-flash-image',
];

function resolveModel(raw: string): string {
  const id = raw.trim() || DEFAULT_MODEL;
  return MODEL_ALIASES[id] ?? id;
}

function modelQueue(requested: string): string[] {
  const first = resolveModel(requested);
  return [...new Set([first, ...FALLBACK_MODELS])];
}

function extractImageUrl(data: Record<string, unknown>): string | null {
  const blob = data as Record<string, any>;
  const fromImages = blob.data;
  if (Array.isArray(fromImages)) {
    for (const row of fromImages) {
      if (typeof row?.url === 'string') return row.url;
      if (typeof row?.b64_json === 'string') return `data:image/png;base64,${row.b64_json}`;
    }
  }
  const message = blob.choices?.[0]?.message;
  const images = message?.images ?? message?.content;
  if (Array.isArray(images)) {
    for (const part of images) {
      if (typeof part?.image_url?.url === 'string') return part.image_url.url;
      if (typeof part?.url === 'string') return part.url;
      if (part?.type === 'image_url' && typeof part?.image_url === 'string') return part.image_url;
      if (typeof part === 'string' && part.startsWith('data:image')) return part;
    }
  }
  if (typeof message?.content === 'string' && message.content.startsWith('data:image')) {
    return message.content;
  }
  return null;
}

async function requestImage(
  apiKey: string,
  model: string,
  prompt: string
): Promise<{ url: string | null; error?: string; status: number }> {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://www.synapticgm.com',
    'X-Title': 'SynapticGM',
  };
  const imageRes = await fetch(OPENROUTER_IMAGES, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, prompt }),
  });
  const imageData = (await imageRes.json().catch(() => ({}))) as Record<string, unknown>;
  if (imageRes.ok) {
    const url = extractImageUrl(imageData);
    if (url) return { url, status: 200 };
  }
  const chatRes = await fetch(OPENROUTER_CHAT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      modalities: ['image', 'text'],
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const chatData = (await chatRes.json().catch(() => ({}))) as Record<string, unknown>;
  if (chatRes.ok) {
    const url = extractImageUrl(chatData);
    if (url) return { url, status: 200 };
    return { url: null, error: 'Image API returned no extractable image URL.', status: 502 };
  }
  const msg =
    typeof (imageData?.error as { message?: string } | undefined)?.message === 'string'
      ? (imageData.error as { message: string }).message
      : typeof (chatData?.error as { message?: string } | undefined)?.message === 'string'
        ? (chatData.error as { message: string }).message
        : `Image API error ${chatRes.status}`;
  return { url: null, error: msg, status: chatRes.status >= 400 ? chatRes.status : 502 };
}

function jsonResponse(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const requested =
      typeof body?.model === 'string' && body.model.trim()
        ? body.model.trim()
        : DEFAULT_MODEL;
    const clientKey = typeof body?.clientApiKey === 'string' ? body.clientApiKey.trim() : '';
    const serverKey = Deno.env.get('OPENROUTER_API_KEY')?.trim() || '';
    const apiKey = clientKey || serverKey;

    if (!prompt) return jsonResponse(req, { error: 'Missing prompt' }, 400);
    if (!apiKey) {
      return jsonResponse(req, { error: 'Hosted image service is unavailable.' }, 503);
    }

    let lastError = 'Image API returned no extractable image URL.';
    let lastStatus = 502;
    for (const model of modelQueue(requested)) {
      const result = await requestImage(apiKey, model, prompt);
      if (result.url) return jsonResponse(req, { url: result.url });
      lastError = result.error || lastError;
      lastStatus = result.status;
      if (!/not a valid model ID/i.test(lastError)) break;
    }
    return jsonResponse(req, { error: lastError }, lastStatus >= 400 ? lastStatus : 502);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse(req, { error: msg }, 500);
  }
});
