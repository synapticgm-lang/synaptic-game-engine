/**
 * Hosted memorable / comic image proxy — uses server OPENROUTER_API_KEY
 * so Free players are not told to paste a key in Settings.
 */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'black-forest-labs/flux-schnell';

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const model =
      typeof body?.model === 'string' && body.model.trim()
        ? body.model.trim()
        : DEFAULT_MODEL;
    const clientKey = typeof body?.clientApiKey === 'string' ? body.clientApiKey.trim() : '';
    const serverKey = Deno.env.get('OPENROUTER_API_KEY')?.trim() || '';
    const apiKey = clientKey || serverKey;

    if (!prompt) return jsonResponse({ error: 'Missing prompt' }, 400);
    if (!apiKey) {
      return jsonResponse({ error: 'No OpenRouter API key configured for image generation.' }, 503);
    }

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.synapticgm.com',
        'X-Title': 'SynapticGM',
      },
      body: JSON.stringify({
        model,
        modalities: ['image', 'text'],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        typeof data?.error?.message === 'string'
          ? data.error.message
          : `Image API error ${res.status}`;
      return jsonResponse({ error: msg }, res.status >= 400 ? res.status : 502);
    }

    const message = data?.choices?.[0]?.message;
    const images = message?.images ?? message?.content;
    let url: string | null = null;

    if (Array.isArray(images)) {
      for (const part of images) {
        if (typeof part?.image_url?.url === 'string') {
          url = part.image_url.url;
          break;
        }
        if (typeof part?.url === 'string') {
          url = part.url;
          break;
        }
        if (part?.type === 'image_url' && typeof part?.image_url === 'string') {
          url = part.image_url;
          break;
        }
        if (typeof part === 'string' && part.startsWith('data:image')) {
          url = part;
          break;
        }
      }
    }
    if (!url && typeof message?.content === 'string' && message.content.startsWith('data:image')) {
      url = message.content;
    }

    if (!url) {
      return jsonResponse({ error: 'Image API returned no extractable image URL.' }, 502);
    }
    return jsonResponse({ url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: msg }, 500);
  }
});
