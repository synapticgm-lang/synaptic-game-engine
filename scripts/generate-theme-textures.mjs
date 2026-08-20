#!/usr/bin/env node
/**
 * Generate theme material bitmaps via the same OpenRouter path as hosted
 * generate-image (images/generations → chat modalities fallback).
 *
 * Usage (from repo root):
 *   node scripts/generate-theme-textures.mjs
 *   node scripts/generate-theme-textures.mjs --only vampire-nocturne
 *   node scripts/generate-theme-textures.mjs --skip-existing
 *   node scripts/generate-theme-textures.mjs --list
 *
 * Reads .env / .env.local for VITE_OPENROUTER_API_KEY (or OPENROUTER_API_KEY).
 * Optionally posts through generate-image when VITE_SUPABASE_URL + anon key exist
 * and --proxy is passed.
 *
 * Skips basic/plain kits (integration-blue). Kid-safe: abstract materials only.
 * Does NOT commit secrets.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OPENROUTER_IMAGES = 'https://openrouter.ai/api/v1/images/generations';
const OPENROUTER_CHAT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'black-forest-labs/flux.2-klein-4b';
const FALLBACKS = [DEFAULT_MODEL, 'google/gemini-2.5-flash-image'];
const REMAINING_LOG = join(ROOT, 'docs/research/theme-texture-remaining-prompts-2026-08-20.md');

const KID_SAFE =
  'Abstract seamless material texture only. No people, no faces, no skulls as heroes, no gore, no blood, no weapons, no text, no logos, no sexualized forms. Flat orthographic tile, low contrast, UI-safe. Original SynapticGM material — public-domain visual tropes only.';

/** @param {string} themeKey @param {{ panel: string, frame: string, atmosphere: string, panelFile?: string }} prompts */
function kit(themeKey, prompts) {
  const panelFile = prompts.panelFile ?? 'panel.png';
  return {
    outDir: `public/themes/${themeKey}`,
    assets: [
      { file: panelFile, prompt: `${KID_SAFE} ${prompts.panel}` },
      {
        file: 'frame-filigree.png',
        prompt: `${KID_SAFE} ${prompts.frame}`,
      },
      {
        file: 'atmosphere.png',
        prompt: `${KID_SAFE} ${prompts.atmosphere}`,
      },
    ],
  };
}

/**
 * Non-basic material kits only. Skip: theme.integration-blue / plain free defaults.
 * @type {Record<string, { outDir: string, assets: { file: string, prompt: string }[] }>}
 */
const THEMES = {
  // --- 15 race / archetype packs ---
  'wood-elf-grove': kit('wood-elf-grove', {
    panel:
      'Seamless dark forest-floor panel tile: damp moss grain, soft leaf-shadow silhouettes, near-black green (#0a1008), sparse leaf-gold flecks — not neon green, not cartoon foliage wallpaper.',
    frame:
      'UI frame ornament strip on dark ground: living vine corner filigree, thin leaf-gold rim, moss shadow — decorative border piece for game UI.',
    atmosphere:
      'Full-bleed canopy atmosphere background: soft moss vignette, cool leaf-shadow from above, deep charcoal-green (#050805), subtle linen grain — HUD wallpaper, quiet woodland.',
  }),
  'dark-elf-umbrance': kit('dark-elf-umbrance', {
    panel:
      'Seamless dusk velvet weave panel: blue-black textile (#0a0810), sparse violet thread glints, matte flock — not purple wash, no sparkle noise.',
    frame:
      'UI frame ornament: dark-glass filigree corners, pale-violet inlay hairlines, obsidian rim — decorative border for game UI.',
    atmosphere:
      'Full-bleed under-realm atmosphere: soft violet vignette at edges, deep charcoal-violet (#05040a), quiet dusk haze — HUD wallpaper.',
  }),
  'high-elf-spire': kit('high-elf-spire', {
    panel:
      'Seamless ivory stone panel: warm off-white mineral veins on deep slate (#10141c), silver hairline veins, cool shadow wells — not sky-blue chrome, no gold glitter fields.',
    frame:
      'UI frame ornament: tall stepped ivory arch corners, aged-gold thin rim, silver hairline — decorative border for game UI.',
    atmosphere:
      'Full-bleed spire atmosphere: cool moonlight on ivory stone haze, deep blue-slate (#080a10), soft silver dust — HUD wallpaper, lofty and calm.',
  }),
  'dwarf-forgehall': kit('dwarf-forgehall', {
    panel:
      'Seamless soot stone panel: charcoal mineral dust, faint brass spark flecks, stone-grid suggestion (#12100e) — no orange lava wash, not brown-orange metal fill.',
    frame:
      'UI frame ornament: hammered brass rune corners, soot shadow, warm forge spark rim — decorative border for game UI.',
    atmosphere:
      'Full-bleed forgehall atmosphere: soft brass glow at one corner only, deep soot charcoal (#0a0908), mineral dust — HUD wallpaper, mountain hold quiet.',
  }),
  'orc-warcamp': kit('orc-warcamp', {
    panel:
      'Seamless weathered canvas panel: warp/weft weave, dry mud stain, iron-stud hint (#0e100c), sparse ochre-iron flecks — matte camp fabric, no cartoon green, no violence, no weapons.',
    frame:
      'UI frame ornament: rough iron spike studs at corners, weathered canvas edge, rust-iron rim — decorative border for game UI.',
    atmosphere:
      'Full-bleed camp atmosphere: dusty canvas haze, low iron-rust vignette, deep olive-charcoal (#080a06) — HUD wallpaper, camp banners quiet.',
  }),
  'dragon-hoard': kit('dragon-hoard', {
    panel:
      'Seamless enamel scale panel: offset arc rows sparse, aged gold edge glint only, deep green base (#0a120c) — not tiled loudly, not wallpaper scales.',
    frame:
      'UI frame ornament: stacked scale rim corners, molten-gold thin edge, deep enamel shadow — decorative border for game UI.',
    atmosphere:
      'Full-bleed hoard atmosphere: soft gold dust vignette at bottom, deep green-charcoal (#050806), quiet opulence — HUD wallpaper.',
  }),
  'phoenix-ashrise': kit('phoenix-ashrise', {
    panel:
      'Seamless ash paper panel: charcoal rock, one narrow rose-gold fissure, soot vignette (#120a08) — no full-panel fire, not generic fire red.',
    frame:
      'UI frame ornament: feather-flame corner silhouettes, rose-gold ember rim, ash shadow — decorative border for game UI.',
    atmosphere:
      'Full-bleed ashrise atmosphere: soft rose-gold glow at horizon edge only, deep ash charcoal (#080404), quiet rebirth haze — HUD wallpaper.',
  }),
  'cyborg-chassis': kit('cyborg-chassis', {
    panel:
      'Seamless brushed gunmetal panel: graphite chassis, orthogonal optic trace lines, one clipped sky-optic line, amber hazard corner only (#0a0b0d) — not Integration cyan flood.',
    frame:
      'UI frame ornament: circuit bezel corners, optic-cyan hairline, amber hazard tick — decorative HUD border, not neon spam.',
    atmosphere:
      'Full-bleed chassis atmosphere: soft optic haze, deep graphite (#050506), one amber corner glow — HUD wallpaper, clinical chrome.',
  }),
  'angelic-radiance': kit('angelic-radiance', {
    panel:
      'Seamless pearl marble panel: opaque pale reading field on warm stone (#141210), soft vein, warm halo rim outside center — high legibility, not washed-out white.',
    frame:
      'UI frame ornament: soft halo arch corners, warm pearl-gold rim, marble shadow — decorative border for game UI.',
    atmosphere:
      'Full-bleed radiance atmosphere: diffuse warm halo from above, deep warm stone (#0a0908), soft pearl dust — HUD wallpaper, celestial calm.',
  }),
  'infernal-pact': kit('infernal-pact', {
    panel:
      'Seamless charred parchment panel: dry contract ash (#120808), localized sulfur-amber hotspot, wax-seal heat suggestion — not broad maroon, not velvet night.',
    frame:
      'UI frame ornament: wax-seal corner silhouette, sulfur-amber rim, charred parchment edge — decorative border for game UI.',
    atmosphere:
      'Full-bleed pact atmosphere: soft sulfur glow at one corner, deep char red-black (#080404), dry heat haze — HUD wallpaper, sealed contract quiet.',
  }),
  'undead-ossuary': kit('undead-ossuary', {
    panelFile: 'panel-ash.png',
    panel:
      'Seamless dark ossuary panel tile: bone dust, ash linen weave, cold moonlight flecks, hairline mineral cracks, near-black ground (#0c0a09), ivory bone flecks sparse, matte crypt stone — NOT teal, NOT velvet, NOT gore.',
    frame:
      'UI frame ornament strip on transparent-feeling dark ground: knuckle-bone corner filigree, ivory bone silhouette stacked knuckles, pale moonlight rim, sparse ash shadow — decorative border piece for game UI, not a photo of remains.',
    atmosphere:
      'Full-bleed dark crypt atmosphere background: soft ash vignette, cold moonlight from above, bone-dust motes, deep charcoal (#080706), subtle linen grain — wallpaper for a game HUD, quiet and solemn.',
  }),
  'fae-glamour': kit('fae-glamour', {
    panel:
      'Seamless twilight veil panel: muted pink-teal prism shift at low saturation (#0c0814), soft bloom, no rainbow noise — court mischief material.',
    frame:
      'UI frame ornament: twilight filigree corners, muted iridescent rim, soft bloom shadow — decorative border for game UI.',
    atmosphere:
      'Full-bleed glamour atmosphere: soft twilight bloom vignette, deep violet-charcoal (#06040c), restrained prism haze — HUD wallpaper.',
  }),
  'goblin-scrapheap': kit('goblin-scrapheap', {
    panel:
      'Seamless dry scrap plates panel: mismatched seams, rivet dots, oil-free grit, yellow scrap accent sparse (#12140c) — workshop chaos, not orc green recolor.',
    frame:
      'UI frame ornament: bolt-head rivet corners, welded scrap edge, scrap-yellow rim — decorative border for game UI.',
    atmosphere:
      'Full-bleed scrapheap atmosphere: dusty grit haze, deep olive-charcoal (#0a0b06), sparse yellow flecks — HUD wallpaper, workshop quiet.',
  }),
  'merfolk-abyss': kit('merfolk-abyss', {
    panel:
      'Seamless deep tide panel: blue-black depth (#061412), low-amplitude caustic rings, pearl rim glints — not animated waves, not Integration cyan.',
    frame:
      'UI frame ornament: pearl tide corners, tide-glass rim, soft pearl glint — decorative border for game UI.',
    atmosphere:
      'Full-bleed abyss atmosphere: soft pressure vignette, deep blue-black (#030a08), pearl dust motes — HUD wallpaper, deep water quiet.',
  }),
  'vampire-nocturne': kit('vampire-nocturne', {
    panel:
      'Seamless flocked near-black plum panel: wine edge glint only, cool moonlit rim dust (#171018), velvet flock weave — no flat maroon fill.',
    frame:
      'UI frame ornament: tapered gothic arch corners, moonlit pale rim, thin wine edge — decorative night-court border for game UI.',
    atmosphere:
      'Full-bleed nocturne atmosphere: cool moonlight vignette from above, near-black plum (#0e0a10), soft flock haze — HUD wallpaper, night-court quiet.',
  }),

  // --- Mid/high material shop themes (not plain Integration) ---
  'neon-protocol': kit('neon-protocol', {
    panel:
      'Seamless night-city chrome panel: deep violet-black (#05010a), sparse magenta and cyan neon hairlines, matte glitch grain — not flat purple fill.',
    frame:
      'UI frame ornament: glitch-edge corners, magenta/cyan hairline rim — decorative cyber border for game UI.',
    atmosphere:
      'Full-bleed neon atmosphere: soft magenta vignette, deep protocol black (#05010a), sparse cyan dust — HUD wallpaper.',
  }),
  'parchment-ledger': kit('parchment-ledger', {
    panel:
      'Seamless warm parchment panel: soft paper fiber (#1c1410), faint ink rule lines, soft gold flecks sparse — journal material, not yellow paper photo.',
    frame:
      'UI frame ornament: ink-rule corner brackets, soft gold rim, parchment edge — decorative ledger border for game UI.',
    atmosphere:
      'Full-bleed ledger atmosphere: warm paper vignette, deep brown-charcoal (#1c1410), soft ink dust — HUD wallpaper.',
  }),
  'bone-reliquary': kit('bone-reliquary', {
    panel:
      'Seamless grimdark ash-bone panel: bone white flecks on near-black (#0c0a09), dried-rose accent sparse, mineral cracks — NOT Undead Ossuary moonlight copy, NOT gore.',
    frame:
      'UI frame ornament: reliquary corner brackets, bone-white rim, ash shadow — decorative grimdark border for game UI.',
    atmosphere:
      'Full-bleed reliquary atmosphere: soft ash vignette, deep stone black (#0c0a09), quiet grim haze — HUD wallpaper.',
  }),
  'phosphor-terminal': kit('phosphor-terminal', {
    panel:
      'Seamless CRT phosphor panel: green phosphor grain on pure black (#000000), faint scanline suggestion, low glow — terminal fantasy, not flat green fill.',
    frame:
      'UI frame ornament: phosphor-green corner ticks, CRT bezel rim — decorative terminal border for game UI.',
    atmosphere:
      'Full-bleed phosphor atmosphere: soft green phosphor vignette, pure black ground, scanline haze — HUD wallpaper.',
  }),
  'noir-crimson': kit('noir-crimson', {
    panel:
      'Seamless matte charcoal case-file panel: pulp paper grain (#050505), one thin crimson interruption line only — not wine velvet, not maroon wash.',
    frame:
      'UI frame ornament: case-file corner brackets, thin crimson tick, charcoal rim — decorative pulp border for game UI.',
    atmosphere:
      'Full-bleed noir atmosphere: matte charcoal vignette, sparse crimson dust at one edge, pure black ground — HUD wallpaper.',
  }),
  'glass-spire': kit('glass-spire', {
    panel:
      'Seamless frosted glass panel: soft lilac and silver frost (#0f0a1a), translucent grain, cool highlight — premium clean, not purple neon.',
    frame:
      'UI frame ornament: frosted glass corner facets, soft lilac-silver rim — decorative border for game UI.',
    atmosphere:
      'Full-bleed glass atmosphere: soft lilac frost vignette, deep indigo (#0f0a1a), silver dust — HUD wallpaper.',
  }),
  'ember-depths': kit('ember-depths', {
    panel:
      'Seamless volcanic charcoal panel: deep stone (#0c0a09), sparse ember-orange fissure, heat vignette — dungeon heat material, not full-panel lava.',
    frame:
      'UI frame ornament: ember-orange corner cracks, charcoal rim, heat glow — decorative volcanic border for game UI.',
    atmosphere:
      'Full-bleed ember atmosphere: soft orange glow at bottom edge only, deep charcoal (#0c0a09), heat haze — HUD wallpaper.',
  }),
};

/** Basic / free plain kits — never generate AI bitmaps (price ladder). */
export const SKIP_BASIC_THEME_KEYS = new Set(['integration-blue']);

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
  return {
    ...loadEnvFile('.env'),
    ...loadEnvFile('.env.local'),
    ...process.env,
  };
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
  return { error: msg, status: chatRes.status || imageRes.status };
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
  const skipExisting = argv.includes('--skip-existing');
  const listOnly = argv.includes('--list');
  return { only, useProxy, skipExisting, listOnly };
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
    if (result.status === 429 || /rate.?limit/i.test(lastError)) {
      throw new Error(`RATE_LIMITED: ${lastError}`);
    }
    if (!/not a valid model ID/i.test(lastError)) break;
  }
  throw new Error(lastError);
}

function logRemaining(failures) {
  if (failures.length === 0) return;
  const lines = [
    '# Theme texture remaining prompts — 2026-08-20',
    '',
    'Generation stopped or failed for these assets. Re-run:',
    '',
    '```bash',
    'node scripts/generate-theme-textures.mjs --skip-existing',
    '```',
    '',
    ...failures.map((f) => `## ${f.id}/${f.file}\n\n- Error: ${f.error}\n- Prompt:\n\n\`\`\`\n${f.prompt}\n\`\`\`\n`),
  ];
  mkdirSync(dirname(REMAINING_LOG), { recursive: true });
  writeFileSync(REMAINING_LOG, lines.join('\n'), 'utf8');
  console.log(`Wrote remaining prompts → ${REMAINING_LOG}`);
}

async function main() {
  const { only, useProxy, skipExisting, listOnly } = parseArgs(process.argv.slice(2));
  if (listOnly) {
    for (const id of Object.keys(THEMES)) {
      console.log(id);
    }
    console.log(`\n(${Object.keys(THEMES).length} non-basic kits; skip: integration-blue)`);
    return;
  }

  const envMap = env();
  const apiKey =
    envMap.OPENROUTER_API_KEY ||
    envMap.VITE_OPENROUTER_API_KEY ||
    '';
  if (!apiKey && !useProxy) {
    console.error('No OPENROUTER_API_KEY / VITE_OPENROUTER_API_KEY — SVG/CSS fallbacks remain.');
    process.exit(2);
  }

  const themeIds = only ? [only] : Object.keys(THEMES);
  const failures = [];
  let rateLimited = false;

  for (const id of themeIds) {
    if (SKIP_BASIC_THEME_KEYS.has(id)) {
      console.log(`Skip basic: ${id}`);
      continue;
    }
    const theme = THEMES[id];
    if (!theme) {
      console.error(`Unknown theme: ${id}`);
      process.exit(1);
    }
    const outAbs = join(ROOT, theme.outDir);
    mkdirSync(outAbs, { recursive: true });
    for (const asset of theme.assets) {
      if (rateLimited) {
        failures.push({ id, file: asset.file, error: 'skipped after rate limit', prompt: asset.prompt });
        continue;
      }
      const dest = join(outAbs, asset.file);
      if (skipExisting && existsSync(dest)) {
        console.log(`Skip existing ${id}/${asset.file}`);
        continue;
      }
      process.stdout.write(`Generating ${id}/${asset.file}… `);
      try {
        const url = await generateOne(apiKey, asset.prompt, useProxy, envMap);
        await writeImage(url, dest);
        console.log(`ok (${dest})`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`FAILED: ${msg}`);
        failures.push({ id, file: asset.file, error: msg, prompt: asset.prompt });
        if (/RATE_LIMITED/i.test(msg)) rateLimited = true;
      }
      // Brief pause to reduce burst rate-limits
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  logRemaining(failures);
  if (failures.length) {
    console.log(`Done with ${failures.length} failure(s).`);
    process.exit(failures.some((f) => !/skipped after rate limit/i.test(f.error)) ? 1 : 0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
