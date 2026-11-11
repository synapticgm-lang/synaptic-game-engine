/**
 * Live opening-call samples against OpenRouter deepseek/deepseek-v4.1-flash.
 * Does not deploy or merge. Writes /workspace/live-ai-opening-pr30-rereview-20261111.md
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { getCampaignBibleById } from '../src/data/campaigns';
import { seedStateFromCampaignBible } from '../src/game/campaignSeed';
import { createInitialState } from '../src/game/defaults';
import {
  normalizeOpeningHookCard,
  openingHookDeck,
  resolveOpeningHookPick,
} from '../src/game/openingEstablishment';
import { attachOpeningInstance, snapshotFromPickedHook } from '../src/game/openingInstance';
import {
  openingChoiceCount,
  writeLiveOpening,
} from '../src/game/liveOpening';
import { formatOpeningCardChrome } from '../src/game/openingPointerCard';
import { OPENING_PAGE_JSON_SCHEMA } from '../src/game/openingWriterNotes';
import { buildMasterPrompt } from '../src/game/masterPrompt';
import { OPENROUTER_DEEPSEEK_V41_FLASH } from '../src/game/modelIds';
import {
  openRouterChatBody,
  openRouterChatHeaders,
  readChatCompletion,
  readChatUsage,
} from '../src/game/openRouterChat';
import type { EngineMode, GameState, Settings } from '../src/game/types';

/** Load gitignored dotenv files into process.env without overwriting a value already set. Never log values. */
function hydrateEnv(): void {
  const files = [
    '/workspace/sgm-live-opening/.env.local',
    '/workspace/sgm-live-opening/.env',
    '/workspace/sgm-live-opening/scripts/.env',
    '/workspace/.env.local',
    '/workspace/.env',
    '/home/box/.env.local',
    '/home/box/.env',
    '/home/box/.config/openrouter.env',
    '/home/box/.config/synapticgm.env',
  ];
  if (process.env.OPENROUTER_ENV_FILE) files.unshift(process.env.OPENROUTER_ENV_FILE);
  for (const file of files) {
    if (!file || !existsSync(file)) continue;
    let text = '';
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const body = line.startsWith('export ') ? line.slice(7).trim() : line;
      const eq = body.indexOf('=');
      if (eq <= 0) continue;
      const key = body.slice(0, eq).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
      if (process.env[key]) continue;
      let val = body.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

hydrateEnv();

const KEY_NAMED = process.env.OPENROUTER_API_KEY_SYNAPTICGM ?? '';
const KEY_RUN = process.env.OPENROUTER_API_KEY_SYNAPTICGM_RUN ?? '';
// The named SYNAPTICGM var on this box is a management/provisioning key (chat returns 401).
// Inference uses the sibling RUN key, which is the SynapticGM OpenRouter runtime key.
const KEY = KEY_RUN || KEY_NAMED;

const MODEL = OPENROUTER_DEEPSEEK_V41_FLASH;
const OUT = '/workspace/live-ai-opening-pr30-rereview-20261111.md';
const MAX_CALLS = 5;
const MAX_TOKENS = 1600;

const settings = {
  contentMode: 'adult',
  maturityTier: 'mature',
  perspective: 'second',
} as Settings;

function ukNow(): { iso: string; label: string } {
  const d = new Date();
  const label = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    dateStyle: 'medium',
    timeStyle: 'medium',
    hour12: false,
  }).format(d) + ' UK (Europe/London)';
  return { iso: d.toISOString(), label };
}

async function creditSnapshot(): Promise<string> {
  const headers = { Authorization: `Bearer ${KEY}` };
  const [keyRes, credRes] = await Promise.all([
    fetch('https://openrouter.ai/api/v1/key', { headers }),
    fetch('https://openrouter.ai/api/v1/credits', { headers }),
  ]);
  const keyJson = await keyRes.json();
  const credJson = await credRes.json();
  const k = keyJson?.data ?? keyJson;
  const c = credJson?.data ?? credJson;
  const total = Number(c?.total_credits);
  const used = Number(c?.total_usage);
  const remaining = Number.isFinite(total) && Number.isFinite(used) ? total - used : undefined;
  return [
    `account credits total=${total} used=${used} remaining=${remaining}`,
    `this key usage=${k?.usage} monthly=${k?.usage_monthly} daily=${k?.usage_daily}`,
  ].join('; ');
}

function buildState(opts: {
  bibleId: string;
  engineMode: EngineMode;
  seed: string;
  hook?: ReturnType<typeof normalizeOpeningHookCard>;
}): GameState {
  const bible = getCampaignBibleById(opts.bibleId)!;
  const picked = opts.hook ?? resolveOpeningHookPick(bible, opts.seed);
  const seeded = seedStateFromCampaignBible(
    { ...createInitialState(bible.title, opts.engineMode), seed: opts.seed, campaignBibleId: bible.id },
    bible
  );
  const withEst: GameState = {
    ...seeded,
    currentLocation: picked?.location || seeded.currentLocation,
    openingEstablishment: {
      pending: [],
      answers: {},
      complete: true,
      sceneWritten: false,
      pickedHook: picked?.text,
      castNpcIds: picked?.castNpcIds ?? [],
      ...(picked?.card ? { card: picked.card } : {}),
    },
  };
  return attachOpeningInstance(withEst, snapshotFromPickedHook(picked), picked?.text);
}

function findCinderwakeHook() {
  const bible = getCampaignBibleById('summoned-pact')!;
  const hit = openingHookDeck(bible)
    .map((c) => normalizeOpeningHookCard(c))
    .find((c) => /cinderwake/i.test(`${c.page1 ?? ''} ${c.location ?? ''} ${c.text ?? ''}`));
  if (!hit) throw new Error('Cinderwake hook not found on summoned-pact');
  return hit;
}

function findSaltWarehouseHook() {
  const bible = getCampaignBibleById('salt-road-heist')!;
  const hit = openingHookDeck(bible)
    .map((c) => normalizeOpeningHookCard(c))
    .find((c) => /first move is yours/i.test(`${c.page1 ?? ''} ${c.pressing ?? ''} ${c.pressingNeed ?? ''} ${c.text ?? ''}`)
      || /warehouse loft/i.test(`${c.location ?? ''} ${c.text ?? ''}`));
  if (!hit) throw new Error('Salt warehouse / First move is yours hook not found');
  return hit;
}

function findGlassHarborHook() {
  const bible = getCampaignBibleById('glass-harbor-letters')!;
  const hit = openingHookDeck(bible)
    .map((c) => normalizeOpeningHookCard(c))
    .find((c) => /glass harbor/i.test(`${c.location ?? ''} ${c.text ?? ''}`));
  if (!hit) throw new Error('Glass Harbor hook not found on glass-harbor-letters');
  return hit;
}

function excerpt(prose: string, n = 520): string {
  const t = prose.replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n).trim() + '…';
}

type Sample = {
  id: string;
  bibleId: string;
  engineMode: EngineMode;
  seed: string;
  hookLabel: string;
  calls: number;
  retried: boolean;
  ok: boolean;
  errors: string[];
  prose: string;
  pads: string[];
  place: string;
  nearbyLandmark?: string;
  cast: string[];
  offerChips: string[];
  journalTitle?: string;
  chrome?: string;
  retired?: string[];
  usage?: { prompt?: number; completion?: number; total?: number };
};

let callCount = 0;

async function apiWriter(state: GameState, input: string, _settings: Settings): Promise<string> {
  if (callCount >= MAX_CALLS) throw new Error(`call cap ${MAX_CALLS} reached`);
  callCount += 1;
  const system = buildMasterPrompt(state, settings);
  const body = openRouterChatBody(MODEL, system, input, MAX_TOKENS, {
    tokenProse: true,
    n: 1,
    schema: OPENING_PAGE_JSON_SCHEMA,
    schemaName: 'opening_page',
    attachNewPlaces: false,
  });
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: openRouterChatHeaders(KEY),
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
  }
  const read = readChatCompletion(json);
  if (read.issue) console.warn('writer issue', read.issue, 'served', read.servedModel);
  lastUsage = read.usage ?? readChatUsage(json);
  return String(read.text ?? '').trim();
}

let lastUsage: ReturnType<typeof readChatUsage> | undefined;

async function writeOpening(id: string, state: GameState, hookLabel: string): Promise<Sample> {
  const inst = state.openingEstablishment?.instance;
  const callsBefore = callCount;
  lastUsage = undefined;
  const result = await writeLiveOpening(state, settings, { writer: apiWriter });
  const usageRaw = lastUsage;
  return {
    id,
    bibleId: state.campaignBibleId ?? '',
    engineMode: state.engineMode,
    seed: state.seed ?? '',
    hookLabel,
    place: inst?.placeName ?? '',
    nearbyLandmark: inst?.nearbyLandmark,
    cast: inst?.cast.map((c) => c.name) ?? [],
    offerChips: inst?.offerChips.map((c) => c.label) ?? [],
    calls: callCount - callsBefore,
    retried: result.ok ? result.retried : callCount - callsBefore > 1,
    ok: result.ok,
    errors: result.ok ? [] : [result.error],
    prose: result.ok ? result.prose : '',
    pads: result.ok ? result.pads : result.pads,
    journalTitle: result.ok ? result.journal.title : undefined,
    chrome: formatOpeningCardChrome(state),
    retired: inst?.retiredNames ?? [],
    usage: usageRaw
      ? {
          prompt: usageRaw.tokensIn ?? undefined,
          completion: usageRaw.tokensOut ?? undefined,
          total:
            usageRaw.tokensIn != null && usageRaw.tokensOut != null
              ? (usageRaw.tokensIn ?? 0) + (usageRaw.tokensOut ?? 0)
              : undefined,
        }
      : undefined,
  };
}

function md(samples: Sample[], before: { at: string; info: string }, after: { at: string; info: string }): string {
  const lines: string[] = [];
  lines.push('# Live AI opening samples — PR30 re-review — 11 Nov 2026');
  lines.push('');
  lines.push('Model: `deepseek/deepseek-v4.1-flash` via OpenRouter (same id gm-turn uses).');
  lines.push('Key: box env `OPENROUTER_API_KEY_SYNAPTICGM` is a management/provisioning key (chat 401). Live calls used sibling `OPENROUTER_API_KEY_SYNAPTICGM_RUN` (the SynapticGM inference key). No Fireworks, no Gemini. Training capture not sent.');
  lines.push('Prompts: `buildMasterPrompt` plus the opening page-1 rail. The call uses `response_format` json_schema `opening_page` (`prose`, `options`, `journalTitle`). Validation, one retry, and deterministic fallback run through `writeLiveOpening`.');
  lines.push('');
  lines.push(`- Credits before: ${before.at} — ${before.info}`);
  lines.push(`- Credits after: ${after.at} — ${after.info}`);
  lines.push(`- API calls made: ${callCount} (cap ${MAX_CALLS})`);
  lines.push('');
  for (const s of samples) {
    lines.push(`## ${s.id}`);
    lines.push('');
    lines.push(`- Campaign: \`${s.bibleId}\` (${s.engineMode})`);
    lines.push(`- Seed: \`${s.seed}\``);
    lines.push(`- Hook: ${s.hookLabel}`);
    lines.push(`- Locked place: **${s.place}**`);
    if (s.nearbyLandmark) lines.push(`- Nearby landmark (still on the map): **${s.nearbyLandmark}**`);
    lines.push(`- Locked cast: ${s.cast.length ? s.cast.map((n) => `**${n}**`).join(', ') : 'alone / none'}`);
    lines.push(`- Planned offer chips: ${s.offerChips.map((c) => `\`${c}\``).join('; ') || '—'}`);
    if (s.journalTitle) lines.push(`- Journal title: **${s.journalTitle}**`);
    if (s.chrome) lines.push(`- Chapter One chrome: ${s.chrome}`);
    if (s.retired?.length) lines.push(`- Retired names: ${s.retired.map((n) => `\`${n}\``).join(', ')}`);
    lines.push(`- Calls: ${s.calls}${s.retried ? ' (retried once after validation)' : ''}`);
    lines.push(`- Validation: ${s.ok ? 'passed' : `failed — ${s.errors.join('; ') || 'empty prose'}`}`);
    const need = openingChoiceCount({ engineMode: s.engineMode } as GameState);
    if (s.pads.length) lines.push(`- Opening pads (${s.pads.length}, need ${need}): ${s.pads.map((c) => `\`${c}\``).join('; ') || '—'}`);
    if (s.usage) lines.push(`- Tokens (this last call): prompt ${s.usage.prompt ?? '?'}, completion ${s.usage.completion ?? '?'}, total ${s.usage.total ?? '?'}`);
    lines.push('');
    lines.push('### Excerpt');
    lines.push('');
    lines.push('> ' + excerpt(s.prose, 700).replace(/\n/g, '\n> '));
    lines.push('');
  }
  lines.push('## Cross-sample checks');
  lines.push('');
  const places = samples.map((s) => s.place);
  const casts = samples.flatMap((s) => s.cast);
  lines.push(`- Places minted: ${[...new Set(places)].map((p) => `\`${p}\``).join(', ')}`);
  lines.push(`- Unique place count: ${new Set(places).size} of ${places.length}`);
  lines.push(`- Cast names: ${[...new Set(casts)].map((p) => `\`${p}\``).join(', ')}`);
  lines.push('- Page 1 must not lock to the hook catalog hub (Cinderwake Trail, Greyhollow Inn, Salt Road Waystation) or leak retired catalog people (Brother Oren, Kessa Cinder, Orel Vane, High Chanter) or the hook faction Pellane.');
  const leakRe = /Brother Oren|Kessa Cinder|Orel Vane|High Chanter|Cinderwake Trail|Greyhollow Inn|Salt Road Waystation|\bPellane\b/i;
  for (const s of samples) {
    const blob = `${s.prose} ${s.pads.join(' ')} ${s.journalTitle ?? ''} ${s.place}`;
    const hit = blob.match(leakRe);
    lines.push(`  - ${s.id}: ${hit ? `YES — ${hit[0]}` : 'no catalog-hub/person leak in place, prose, pads, or title'}`);
    const inspect = s.pads.filter((p) => /^(look|study|inspect|examine|search|scout)\b/i.test(p));
    lines.push(`  - ${s.id} inspect-family pads: ${inspect.length ? inspect.map((p) => `\`${p}\``).join('; ') : 'none'} (${inspect.length > 1 ? 'POSSIBLE near-duplicate' : 'ok'})`);
    const pronounPad = s.pads.find((p) => /\b(?:he's|she's|what he|what she)\b/i.test(p));
    lines.push(`  - ${s.id} gendered pronoun pad: ${pronounPad ? `\`${pronounPad}\`` : 'none'}`);
  }
  return lines.join('\n') + '\n';
}

async function main() {
  if (!KEY_RUN && !KEY_NAMED) throw new Error('OPENROUTER_API_KEY_SYNAPTICGM_RUN missing from the environment (and no dotenv file provided one)');
  if (!KEY_RUN && KEY_NAMED) {
    console.warn('OPENROUTER_API_KEY_SYNAPTICGM_RUN is missing; falling back to OPENROUTER_API_KEY_SYNAPTICGM (this key 401s on chat if it is the management key)');
  }
  const beforeAt = ukNow();
  let beforeInfo = '';
  try {
    beforeInfo = await creditSnapshot();
  } catch (e) {
    beforeInfo = `credit snapshot failed (${e})`;
  }
  console.log('credits before', beforeAt.label, beforeInfo);

  const cinder = findCinderwakeHook();
  const warehouse = findSaltWarehouseHook();
  const glass = findGlassHarborHook();
  const samples: Sample[] = [];

  const jobs: Array<{
    id: string;
    bibleId: string;
    mode: EngineMode;
    seed: string;
    hook?: typeof cinder;
    hookLabel: string;
  }> = [
    { id: 'litrpg-cinderwake', bibleId: 'summoned-pact', mode: 'litrpg', seed: 'pr30-cinder-20261111c', hook: cinder, hookLabel: 'Cinderwake Trail summoned-pact hook (page 1 remints the place; hub stays on the map for later turns)' },
    { id: 'story-rpg-salt-warehouse', bibleId: 'salt-road-heist', mode: 'rpg', seed: 'pr30-salt-wh-20261111c', hook: warehouse, hookLabel: 'Salt Road warehouse loft — "First move is yours"' },
    { id: 'story-rpg-glass-harbor', bibleId: 'glass-harbor-letters', mode: 'rpg', seed: 'pr30-glass-20261111c', hook: glass, hookLabel: 'Glass Harbor Letters hook (page 1 remints the opening place)' },
    { id: 'tabletop-cursed-keep', bibleId: 'cursed-keep', mode: 'dnd', seed: 'pr30-keep-20261111c', hookLabel: 'Tabletop — Cursed Keep, seed-picked hook' },
  ];

  for (const job of jobs) {
    if (callCount >= MAX_CALLS) break;
    const state = buildState({ bibleId: job.bibleId, engineMode: job.mode, seed: job.seed, hook: job.hook });
    console.log('calling', job.id, 'place', state.openingEstablishment?.instance?.placeName, 'near', state.openingEstablishment?.instance?.nearbyLandmark, 'calls so far', callCount);
    const sample = await writeOpening(job.id, state, job.hookLabel);
    samples.push(sample);
    console.log('  ok', sample.ok, 'retried', sample.retried, 'journal', sample.journalTitle, 'pads', sample.pads, 'chrome', sample.chrome);
  }

  const afterAt = ukNow();
  let afterInfo = '';
  try {
    afterInfo = await creditSnapshot();
  } catch (e) {
    afterInfo = `credit snapshot failed (${e})`;
  }
  console.log('credits after', afterAt.label, afterInfo);

  const text = md(
    samples,
    { at: beforeAt.label, info: beforeInfo },
    { at: afterAt.label, info: afterInfo }
  );
  writeFileSync(OUT, text);
  console.log('wrote', OUT, 'calls', callCount);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
