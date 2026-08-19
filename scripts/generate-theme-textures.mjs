#!/usr/bin/env node
/**
 * Generate theme material bitmaps via the same OpenRouter path as hosted
 * generate-image (images/generations → chat modalities fallback).
 *
 * Usage (from repo root):
 *   node scripts/generate-theme-textures.mjs
 *   node scripts/generate-theme-textures.mjs --only undead-ossuary
 *
 * Reads .env / .env.local for VITE_OPENROUTER_API_KEY (or OPENROUTER_API_KEY).
 * Optionally posts through generate-image when VITE_SUPABASE_URL + anon key exist
 * and --proxy is passed.
 *
 * Does NOT commit secrets. Kid-safe: abstract materials only.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OPENROUTER_IMAGES = 'https://openrouter.ai/api/v1/images/generations';
const OPENROUTER_CHAT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'black-forest-labs/flux.2-klein-4b';
const FALLBACKS = [DEFAULT_MODEL, 'google/gemini-2.5-flash-image'];

const KID_SAFE =
  'Abstract seamless material texture only. No people, no faces, no skulls as heroes, no gore, no blood, no weapons, no text, no logos, no sexualized forms. Flat orthographic tile, low contrast, UI-safe.';

/** @type {Record<string, { outDir: string, assets: { file: string, prompt: string }[] }>} */
const THEMES = {
  'undead-ossuary': {
    outDir: 'public/themes/undead-ossuary',
    assets: [
      {
        file: 'panel-ash.png',
        prompt: `${KID_SAFE} Seamless dark ossuary panel tile: bone dust, ash linen weave, cold moonlight flecks, hairline mineral cracks, near-black ground (#0c0a09), ivory bone flecks sparse, matte crypt stone — NOT teal, NOT velvet, NOT gore.`,
      },
      {
        file: 'frame-filigree.png',
        prompt: `${KID_SAFE} UI frame ornament strip on transparent-feeling dark ground: knuckle-bone corner filigree, ivory bone silhouette stacked knuckles, pale moonlight rim, sparse ash shadow — decorative border piece for game UI, not a photo of remains.`,
      },
      {
        file: 'atmosphere.png',
        prompt: `${KID_SAFE} Full-bleed dark crypt atmosphere background: soft ash vignette, cold moonlight from above, bone-dust motes, deep charcoal (#080706), subtle linen grain — wallpaper for a game HUD, quiet and solemn.`,
      },
    ],
  },
};

function loadEnvFile(name) {
  const path = join(ROOT, name);
  if (!existsSync(path)) return {};
  const out = {};
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function env() {
  const merged = {
    ...loadEnvFile('.env'),
    ...loadEnvFile('.env.local'),
    ...process.env,
  };
  return merged;
}

function extractImageUrl(data) {
  const fromImages = data?.data;
  if (Array.isArray(fromImages)) {
    for (const row of fromImages) {
      if (typeof row?.url === 'string') return row.url;
      if (typeof row?.b64_json === 'string') return `data:image/png;base64,${row.b64_json}`;
    }
  }
  const message = data?.choices?.[0]?.message;
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

async function requestImage(apiKey, model, prompt) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://www.synapticgm.com',
    'X-Title': 'SynapticGM-theme-textures',
  };
  const imageRes = await fetch(OPENROUTER_IMAGES, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, prompt }),
  });
  const imageData = await imageRes.json().catch(() => ({}));
  if (imageRes.ok) {
    const url = extractImageUrl(imageData);
    if (url) return { url };
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
  const chatData = await chatRes.json().catch(() => ({}));
  if (chatRes.ok) {
    const url = extractImageUrl(chatData);
    if (url) return { url };
    return { error: 'Image API returned no extractable image URL.' };
  }
  const msg =
    imageData?.error?.message ||
    chatData?.error?.message ||
    `Image API error ${chatRes.status}`;
  return { error: msg };
}

async function requestViaProxy(envMap, prompt, clientApiKey) {
  const base = (envMap.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const anon = envMap.VITE_SUPABASE_ANON_KEY || '';
  if (!base || !anon) throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY for --proxy');
  const res = await fetch(`${base}/functions/v1/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify({
      prompt,
      model: DEFAULT_MODEL,
      clientApiKey: clientApiKey || undefined,
    }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.error || `generate-image ${res.status}`);
  if (typeof payload?.url !== 'string' || !payload.url) throw new Error('Proxy returned no url');
  return payload.url;
}

async function writeImage(url, destPath) {
  if (url.startsWith('data:image')) {
    const b64 = url.replace(/^data:image\/\w+;base64,/, '');
    writeFileSync(destPath, Buffer.from(b64, 'base64'));
    return;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
}

function parseArgs(argv) {
  const onlyIdx = argv.indexOf('--only');
  const only = onlyIdx >= 0 ? argv[onlyIdx + 1] : null;
  const useProxy = argv.includes('--proxy');
  return { only, useProxy };
}

async function generateOne(apiKey, prompt, useProxy, envMap) {
  if (useProxy) {
    return requestViaProxy(envMap, prompt, apiKey);
  }
  let lastError = 'no image';
  for (const model of FALLBACKS) {
    const result = await requestImage(apiKey, model, prompt);
    if (result.url) return result.url;
    lastError = result.error || lastError;
    if (!/not a valid model ID/i.test(lastError)) break;
  }
  throw new Error(lastError);
}

async function main() {
  const { only, useProxy } = parseArgs(process.argv.slice(2));
  const envMap = env();
  const apiKey =
    envMap.OPENROUTER_API_KEY ||
    envMap.VITE_OPENROUTER_API_KEY ||
    '';
  if (!apiKey && !useProxy) {
    console.error('No OPENROUTER_API_KEY / VITE_OPENROUTER_API_KEY — SVG fallbacks remain.');
    process.exit(2);
  }

  const themeIds = only ? [only] : Object.keys(THEMES);
  for (const id of themeIds) {
    const theme = THEMES[id];
    if (!theme) {
      console.error(`Unknown theme: ${id}`);
      process.exit(1);
    }
    const outAbs = join(ROOT, theme.outDir);
    mkdirSync(outAbs, { recursive: true });
    for (const asset of theme.assets) {
      const dest = join(outAbs, asset.file);
      process.stdout.write(`Generating ${id}/${asset.file}… `);
      try {
        const url = await generateOne(apiKey, asset.prompt, useProxy, envMap);
        await writeImage(url, dest);
        console.log(`ok (${dest})`);
      } catch (err) {
        console.log(`FAILED: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
