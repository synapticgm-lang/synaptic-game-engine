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
  openingChoiceCount,
  shapeOpeningPads,
  validateLiveOpeningProse,
  formatOpeningWriterNotes,
} from '../src/game/liveOpening';
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
const OUT = '/workspace/live-ai-opening-review-fixes-20261111.md';
const MAX_CALLS = 6;
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
  return {
    ...base,
    calls: retried ? 2 : 1,
    retried,
    ok: errors.length === 0 && !!prose,
    errors,
    prose,
    pads,
    usage,
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
    lines.push(`- Calls: ${s.calls}${s.retried ? ' (retried once after validation)' : ''}`);
    lines.push(`- Validation: ${s.ok ? 'passed' : `failed — ${s.errors.join('; ') || 'empty prose'}`}`);
    lines.push(`- Shaped pads (${s.pads.length}, need ${openingChoiceCount({ engineMode: s.engineMode } as GameState)}): ${s.pads.map((c) => `\`${c}\``).join('; ') || '—'}`);
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
  lines.push(`- Any catalog leak in prose (Cinderwake, Brother Oren, Kessa Cinder, Pellane, Orel Vane, Greyhollow)?`);
  const leakRe = /Cinderwake|Brother Oren|Kessa Cinder|Pellane|Orel Vane|Greyhollow/i;
  for (const s of samples) {
    const hit = s.prose.match(leakRe);
    lines.push(`  - ${s.id}: ${hit ? `YES — ${hit[0]}` : 'no'}`);
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
  const samples: Sample[] = [];

  const jobs: Array<{ id: string; bibleId: string; mode: EngineMode; seed: string; hook?: typeof cinder; hookLabel: string }> = [
    { id: 'litrpg-cinderwake', bibleId: 'summoned-pact', mode: 'litrpg', seed: 'review-cinder-20261111', hook: cinder, hookLabel: 'Cinderwake-like summoned-pact hook (explicit card)' },
    { id: 'story-rpg-salt-road', bibleId: 'salt-road-heist', mode: 'rpg', seed: 'review-salt-20261111', hookLabel: 'Story RPG — Salt Road Heist, seed-picked hook' },
    { id: 'story-rpg-harbor', bibleId: 'glass-harbor-letters', mode: 'rpg', seed: 'review-harbor-20261111', hookLabel: 'Story RPG — Glass Harbor Letters (harbor hook)' },
    { id: 'tabletop-cursed-keep', bibleId: 'cursed-keep', mode: 'dnd', seed: 'review-keep-20261111', hookLabel: 'Tabletop — Cursed Keep, seed-picked hook' },
  ];

  for (const job of jobs) {
    if (callCount >= MAX_CALLS) break;
    const state = buildState({ bibleId: job.bibleId, engineMode: job.mode, seed: job.seed, hook: job.hook });
    console.log('calling', job.id, 'place', state.openingEstablishment?.instance?.placeName, 'calls so far', callCount);
    const sample = await writeOpening(job.id, state, job.hookLabel);
    samples.push(sample);
    console.log('  ok', sample.ok, 'retried', sample.retried, 'pads', sample.pads.length, sample.pads);
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
