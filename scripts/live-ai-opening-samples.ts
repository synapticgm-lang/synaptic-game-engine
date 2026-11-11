/**
 * Live opening-call samples against OpenRouter deepseek/deepseek-v4.1-flash.
 * Does not deploy or merge. Writes /workspace/live-ai-opening-samples-20261111.md
 */
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
  deriveOpeningJournal,
  openingChoiceCount,
  shapeOpeningPads,
  validateLiveOpeningProse,
  formatOpeningWriterNotes,
} from '../src/game/liveOpening';
import { formatOpeningCardChrome } from '../src/game/openingPointerCard';
import { formatLaterTurnNameRail } from '../src/game/openingWriterNotes';
import { buildMasterPrompt } from '../src/game/masterPrompt';
import { OPENROUTER_DEEPSEEK_V41_FLASH } from '../src/game/modelIds';
import {
  openRouterChatBody,
  openRouterChatHeaders,
  readChatCompletion,
  readChatUsage,
} from '../src/game/openRouterChat';
import type { EngineMode, GameState, Settings } from '../src/game/types';
import { writeFileSync } from 'node:fs';

const KEY_NAMED = process.env.OPENROUTER_API_KEY_SYNAPTICGM ?? '';
const KEY_RUN = process.env.OPENROUTER_API_KEY_SYNAPTICGM_RUN ?? '';
// The named SYNAPTICGM var on this box is a management/provisioning key (chat returns 401).
// Inference uses the sibling RUN key, which is the SynapticGM OpenRouter runtime key.
const KEY = KEY_RUN || KEY_NAMED;

const MODEL = OPENROUTER_DEEPSEEK_V41_FLASH;
const OUT = '/workspace/live-ai-opening-pr30-followup-20261111.md';
const MAX_CALLS = 5;
const MAX_TOKENS = 1200;

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

function findGreyhollowInnHook() {
  const bible = getCampaignBibleById('cursed-keep')!;
  const hit = openingHookDeck(bible)
    .map((c) => normalizeOpeningHookCard(c))
    .find((c) => /greyhollow/i.test(`${c.location ?? ''} ${c.text ?? ''}`) && /inn/i.test(`${c.location ?? ''} ${c.text ?? ''}`));
  if (!hit) throw new Error('Greyhollow inn hook not found on cursed-keep');
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
  cast: string[];
  offerChips: string[];
  journalTitle?: string;
  chrome?: string;
  laterRail?: string;
  retired?: string[];
  usage?: { prompt?: number; completion?: number; total?: number };
};

let callCount = 0;

async function oneCall(state: GameState, retryErrors?: string[]): Promise<{ text: string; usage?: Sample['usage'] }> {
  if (callCount >= MAX_CALLS) throw new Error(`call cap ${MAX_CALLS} reached`);
  callCount += 1;
  const system = buildMasterPrompt(state, settings);
  const user = formatOpeningWriterNotes(state, retryErrors);
  const body = openRouterChatBody(MODEL, system, user, MAX_TOKENS);
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
  const usageRaw = read.usage ?? readChatUsage(json);
  const usage = usageRaw
    ? {
        prompt: usageRaw.tokensIn ?? undefined,
        completion: usageRaw.tokensOut ?? undefined,
        total:
          usageRaw.tokensIn != null && usageRaw.tokensOut != null
            ? (usageRaw.tokensIn ?? 0) + (usageRaw.tokensOut ?? 0)
            : undefined,
      }
    : undefined;
  if (read.issue) console.warn('writer issue', read.issue, 'served', read.servedModel);
  return { text: String(read.text ?? '').trim(), usage };
}

async function writeOpening(id: string, state: GameState, hookLabel: string): Promise<Sample> {
  const inst = state.openingEstablishment?.instance;
  const base = {
    id,
    bibleId: state.campaignBibleId ?? '',
    engineMode: state.engineMode,
    seed: state.seed ?? '',
    hookLabel,
    place: inst?.placeName ?? '',
    cast: inst?.cast.map((c) => c.name) ?? [],
    offerChips: inst?.offerChips.map((c) => c.label) ?? [],
  };
  let retried = false;
  let first = await oneCall(state);
  let errors = validateLiveOpeningProse(state, first.text);
  let prose = first.text;
  let usage = first.usage;
  if (errors.length && callCount < MAX_CALLS) {
    retried = true;
    const second = await oneCall(state, errors);
    prose = second.text;
    usage = second.usage;
    errors = validateLiveOpeningProse(state, prose);
  }
  const pads = shapeOpeningPads(state, prose);
  const journal = deriveOpeningJournal(state, prose);
  return {
    ...base,
    calls: retried ? 2 : 1,
    retried,
    ok: errors.length === 0 && !!prose,
    errors,
    prose,
    pads,
    journalTitle: journal.title,
    chrome: formatOpeningCardChrome(state),
    retired: inst?.retiredNames ?? [],
    usage,
  };
}

async function writeLaterTurn(id: string, state: GameState, hookLabel: string): Promise<Sample> {
  const written: GameState = {
    ...state,
    turn: 4,
    currentLocation: state.openingEstablishment?.instance?.placeName || 'Greyhollow Inn',
    openingEstablishment: state.openingEstablishment
      ? { ...state.openingEstablishment, complete: true, sceneWritten: true }
      : state.openingEstablishment,
  };
  const inst = written.openingEstablishment?.instance;
  const rail = formatLaterTurnNameRail(written);
  if (callCount >= MAX_CALLS) throw new Error(`call cap ${MAX_CALLS} reached`);
  callCount += 1;
  const system = buildMasterPrompt(written, settings);
  const user = [
    `PLAYER ACTION: Look around.`,
    `LOCATION: ${written.currentLocation}.`,
    'Write the next short beat (80-140 words, past tense). Stay with locked names already in play. Do not invent a new town.',
  ].join('\n');
  const body = openRouterChatBody(MODEL, system, user, MAX_TOKENS);
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: openRouterChatHeaders(KEY),
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
  const read = readChatCompletion(json);
  const usageRaw = read.usage ?? readChatUsage(json);
  const prose = String(read.text ?? '').trim();
  return {
    id,
    bibleId: written.campaignBibleId ?? '',
    engineMode: written.engineMode,
    seed: written.seed ?? '',
    hookLabel,
    place: inst?.placeName ?? written.currentLocation ?? '',
    cast: inst?.cast.map((c) => c.name) ?? [],
    offerChips: [],
    calls: 1,
    retried: false,
    ok: !!prose,
    errors: prose ? [] : ['empty prose'],
    prose,
    pads: [],
    laterRail: rail,
    retired: inst?.retiredNames ?? [],
    chrome: formatOpeningCardChrome(written),
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
  lines.push('# Live AI opening samples — 11 Nov 2026');
  lines.push('');
  lines.push('Model: `deepseek/deepseek-v4.1-flash` via OpenRouter (same id gm-turn uses).');
  lines.push('Key: box env `OPENROUTER_API_KEY_SYNAPTICGM` is a management/provisioning key (chat 401). Live calls used sibling `OPENROUTER_API_KEY_SYNAPTICGM_RUN` (the SynapticGM inference key). No Fireworks, no Gemini. Training capture not sent.');
  lines.push('Prompts: `buildMasterPrompt` (includes the existing GM/gamebook writing guide plus the new opening rail) and `formatOpeningWriterNotes` (locked names, offer, private situation).');
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
    lines.push(`- Locked cast: ${s.cast.length ? s.cast.map((n) => `**${n}**`).join(', ') : 'alone / none'}`);
    lines.push(`- Planned offer chips: ${s.offerChips.map((c) => `\`${c}\``).join('; ') || '—'}`);
    if (s.journalTitle) lines.push(`- Journal title: **${s.journalTitle}**`);
    if (s.chrome) lines.push(`- Chapter One chrome: ${s.chrome}`);
    if (s.retired?.length) lines.push(`- Retired names: ${s.retired.map((n) => `\`${n}\``).join(', ')}`);
    if (s.laterRail) lines.push(`- Later-turn name rail:\n\n\`\`\`\n${s.laterRail}\n\`\`\``);
    lines.push(`- Calls: ${s.calls}${s.retried ? ' (retried once after validation)' : ''}`);
    lines.push(`- Validation: ${s.ok ? 'passed' : `failed — ${s.errors.join('; ') || 'empty prose'}`}`);
    if (s.pads.length) lines.push(`- Shaped pads (${s.pads.length}, need ${openingChoiceCount({ engineMode: s.engineMode } as GameState)}): ${s.pads.map((c) => `\`${c}\``).join('; ') || '—'}`);
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
  lines.push('- Unexpected catalog-person leaks in prose (Brother Oren, Kessa Cinder, Orel Vane). Campaign hubs (Cinderwake, Greyhollow, Pellane, Valespire) may appear when they are still on the map.');
  const leakRe = /Brother Oren|Kessa Cinder|Orel Vane|High Chanter/i;
  for (const s of samples) {
    const hit = s.prose.match(leakRe);
    lines.push(`  - ${s.id}: ${hit ? `YES — ${hit[0]}` : 'no'}`);
    if (s.laterRail) {
      const bansHub = /Do not use retired catalog names:[^\n]*(Greyhollow|Valespire|Cinderflow|Cinderwake)/i.test(s.laterRail);
      lines.push(`  - ${s.id} later-turn rail bans a campaign hub: ${bansHub ? 'YES' : 'no'}`);
    }
  }
  return lines.join('\n') + '\n';
}

async function main() {
  if (!KEY) throw new Error('OPENROUTER_API_KEY_SYNAPTICGM missing');
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
  const inn = findGreyhollowInnHook();
  const samples: Sample[] = [];

  const jobs: Array<{
    id: string;
    bibleId: string;
    mode: EngineMode;
    seed: string;
    hook?: typeof cinder;
    hookLabel: string;
    laterTurn?: boolean;
  }> = [
    { id: 'litrpg-cinderwake', bibleId: 'summoned-pact', mode: 'litrpg', seed: 'pr30-cinder-20261111b', hook: cinder, hookLabel: 'Cinderwake Trail summoned-pact hook (hub stays; cast reminted)' },
    { id: 'story-rpg-salt-warehouse', bibleId: 'salt-road-heist', mode: 'rpg', seed: 'pr30-salt-wh-20261111b', hook: warehouse, hookLabel: 'Salt Road warehouse loft — "First move is yours"' },
    { id: 'tabletop-cursed-keep', bibleId: 'cursed-keep', mode: 'dnd', seed: 'pr30-keep-20261111b', hookLabel: 'Tabletop — Cursed Keep, seed-picked hook' },
    { id: 'later-turn-greyhollow', bibleId: 'cursed-keep', mode: 'dnd', seed: 'pr30-later-gh-20261111b', hook: inn, hookLabel: 'Later turn at Greyhollow Inn (scene already written)', laterTurn: true },
  ];

  for (const job of jobs) {
    if (callCount >= MAX_CALLS) break;
    const state = buildState({ bibleId: job.bibleId, engineMode: job.mode, seed: job.seed, hook: job.hook });
    console.log('calling', job.id, 'later', !!job.laterTurn, 'place', state.openingEstablishment?.instance?.placeName, 'calls so far', callCount);
    const sample = job.laterTurn
      ? await writeLaterTurn(job.id, state, job.hookLabel)
      : await writeOpening(job.id, state, job.hookLabel);
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
