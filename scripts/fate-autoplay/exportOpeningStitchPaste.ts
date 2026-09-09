/**
 * Export live New Game page-1 stitches for Gemini Pro to rate.
 * No network / no Fireworks — page 1 is local stitch, same as the client after 09a.
 *
 *   npm run opening-stitch-paste
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCampaignBibleById } from '../../src/data/campaigns';
import type { CampaignBible, OpeningHookCard } from '../../src/data/campaigns/types';
import { seedStateFromCampaignBible } from '../../src/game/campaignSeed';
import { createInitialState } from '../../src/game/defaults';
import {
  isAloneArrivalPick,
  normalizeOpeningHookCard,
  openingHookDeck,
  pendingRequiredCovers,
  resolveOpeningMode,
  resolveOpeningPrompts,
  seedCoverAnswers,
} from '../../src/game/openingEstablishment';
import {
  applyOpeningContract,
  ensureStarterLookCharacter,
  stitchOpeningScene,
} from '../../src/game/openingStitch';
import type { EngineMode, GameState } from '../../src/game/types';

type Cell = {
  mode: EngineMode;
  bibleId: string;
  label: string;
  fileSlug: string;
};

const CELLS: Cell[] = [
  { mode: 'litrpg', bibleId: 'summoned-pact', label: 'LitRPG — The Summoned Pact', fileSlug: '01-LITRPG-summoned-pact' },
  { mode: 'dnd', bibleId: 'cursed-keep', label: 'Tabletop — Cursed Keep', fileSlug: '02-DND-cursed-keep' },
  { mode: 'rpg', bibleId: 'salt-road-heist', label: 'Story RPG — Salt Road Heist', fileSlug: '03-RPG-salt-road' },
  { mode: 'pyoa', bibleId: 'thornferry-road', label: 'PYOA — Thornferry Road', fileSlug: '04-PYOA-thornferry' },
];

const OUT_DIR = join(
  process.cwd(),
  'scripts/fate-autoplay/runs/gemini-paste-2026-09-09b-openings'
);

function installNodeShims(): void {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  const g = globalThis as typeof globalThis & {
    localStorage?: typeof localStorage;
    window?: { localStorage: typeof localStorage };
  };
  if (!g.localStorage) g.localStorage = localStorage;
  if (!g.window) g.window = { localStorage };
}

function criticBrief(): string {
  return [
    '# Opening stitch pack — Gemini Pro (page 1 only)',
    '',
    'You are rating **New Game page 1** as a playable RPG intro. These are the texts a Free player sees after tap New Game on HUD `2026-09-09b`.',
    '',
    '## What this is (do not mis-score)',
    '',
    '- Local **authored stitch** (`page1` + optional cover ask). No leftover beats, no shared sensory/pressure glue. **Not** a live Fireworks/DeepSeek rewrite.',
    '- Simple narrators (Cold Registrar / Dry Wit / Friendly Guide / etc.) **do not change page 1**. Do not ask for personality variants.',
    '- HUD already shows HP/MP/XP. Do **not** ask for `[ SYSTEM ]` blocks, HP bars, or numbered choice lists in the story.',
    '- A name/cover question at the end is legal weave-mode chrome. PYOA/story-RPG scene mode may have no ask.',
    '',
    '## Quality bar (page 1)',
    '',
    'A good intro: you know **where you are**, **what just happened**, **who or what is in the room**, and **one thing you can do**. Geometry holds. English is a sentence. The blue panel is an object, not a speaker. No word salad, no first-person smash, no Earth street as HERE when the card is a cathedral / keep / mill / road.',
    '',
    'A bad intro: fractured syntax, invented Title-Case people, living corpses, instruction voice, “someone here” glue, or a postcard with no play.',
    '',
    '## How to score',
    '',
    'For **each** opening:',
    '',
    '1. **Score 1–10** as a playable RPG first page (one number + one sentence).',
    '2. **YES/NO:** spatial HERE clear · actionable hook · English intact · no invent.',
    '3. If the score is **below 7**, write **one better intro** (120–180 words) that keeps the same Location / Who / Why from the card notes. Do not invent a new campaign. Do not add System chrome.',
    '',
    'Then a short **mode verdict** (LitRPG / Tabletop / Story RPG / PYOA): mean score, worst card, one shared fix if any.',
    '',
    'End with:',
    '',
    '```json',
    '{"means":{"litrpg":0,"dnd":0,"rpg":0,"pyoa":0},"worst":[{"id":"L01","score":0,"why":""}],"rewrites":[{"id":"L01","keep":"location/who/why"}]}',
    '```',
    '',
  ].join('\n');
}

function cardWhere(card: OpeningHookCard, picked: ReturnType<typeof normalizeOpeningHookCard>): string {
  if (typeof card !== 'string' && card.location?.trim()) return card.location.trim();
  return (picked.location || '').trim() || 'unlabeled hook';
}

function cardNotes(card: OpeningHookCard, picked: ReturnType<typeof normalizeOpeningHookCard>): string {
  if (typeof card === 'string') return `_Card:_ ${card.slice(0, 160)}`;
  const bits = [
    card.location && `HERE: ${card.location}`,
    card.faction && `CAST: ${card.faction}`,
    card.summonIntent && `WHY: ${card.summonIntent}`,
  ].filter(Boolean);
  return bits.length ? `_Card lock (keep on rewrite):_ ${bits.join(' · ')}` : `_Fallback:_ ${picked.fallback ?? picked.text}`;
}

function buildStitchState(bible: CampaignBible, mode: EngineMode, card: OpeningHookCard, index: number): GameState {
  const seed = `opening-paste|${bible.id}|${index}`;
  const picked = normalizeOpeningHookCard(card);
  const aloneArrival = isAloneArrivalPick(picked);
  let state = createInitialState(bible.title, mode, bible.archetype);
  state = seedStateFromCampaignBible(
    { ...state, seed, campaignBibleId: bible.id },
    bible
  );
  const character = ensureStarterLookCharacter(state.character);
  const openingMode = resolveOpeningMode(bible, mode);
  const openingPromptsRaw = resolveOpeningPrompts(bible, mode, bible.archetype);
  const openingPrompts = applyOpeningContract(openingPromptsRaw, bible, aloneArrival, seed);
  const coverAnswers = seedCoverAnswers(bible, character, picked.location);
  const pendingCovers = pendingRequiredCovers(openingPrompts, character, openingMode);
  return {
    ...state,
    character,
    seed,
    currentLocation: picked.location || coverAnswers.where || bible.startingLocation || state.currentLocation,
    openingEstablishment: {
      pending: pendingCovers,
      answers: coverAnswers,
      complete: pendingCovers.length === 0,
      sceneWritten: true,
      mode: openingMode,
      pickedHook: picked.text,
      pickedHookFallback: picked.page1 || picked.fallback,
      aloneArrival,
    },
  };
}

type OpeningRow = {
  id: string;
  mode: EngineMode;
  label: string;
  where: string;
  notes: string;
  prose: string;
};

function collectOpenings(): OpeningRow[] {
  const rows: OpeningRow[] = [];
  for (const cell of CELLS) {
    const bible = getCampaignBibleById(cell.bibleId);
    if (!bible) throw new Error(`Missing bible ${cell.bibleId}`);
    const deck = openingHookDeck(bible);
    if (deck.length === 0) throw new Error(`Empty hook deck for ${cell.bibleId}`);
    const prefix = cell.mode === 'litrpg' ? 'L' : cell.mode === 'dnd' ? 'D' : cell.mode === 'rpg' ? 'R' : 'P';
    deck.forEach((card, i) => {
      const picked = normalizeOpeningHookCard(card);
      const state = buildStitchState(bible, cell.mode, card, i);
      const prose = stitchOpeningScene(state).trim();
      rows.push({
        id: `${prefix}${String(i + 1).padStart(2, '0')}`,
        mode: cell.mode,
        label: cell.label,
        where: cardWhere(card, picked),
        notes: cardNotes(card, picked),
        prose,
      });
    });
  }
  return rows;
}

function renderSection(rows: OpeningRow[]): string {
  return rows
    .map((row) =>
      [
        `## ${row.id} — ${row.label}`,
        '',
        `**HERE:** ${row.where}`,
        '',
        row.notes,
        '',
        '### Page 1 (player-visible)',
        '',
        row.prose,
        '',
      ].join('\n')
    )
    .join('\n---\n\n');
}

function renderPack(title: string, rows: OpeningRow[]): string {
  const counts = CELLS.map((c) => {
    const n = rows.filter((r) => r.mode === c.mode).length;
    return `- ${c.label}: **${n}** openings`;
  }).join('\n');
  return [
    criticBrief(),
    `---`,
    '',
    `# ${title}`,
    '',
    `HUD / BUILD \`2026-09-09b\`. Generated ${new Date().toISOString()}. ${rows.length} page-1 stitches.`,
    '',
    counts,
    '',
    '---',
    '',
    renderSection(rows),
    '',
  ].join('\n');
}

function renderReadme(rows: OpeningRow[]): string {
  const index = rows
    .map((r) => `- \`${r.id}\` ${r.label} — ${r.where}`)
    .join('\n');
  return [
    '# Opening stitch Gemini pastes (2026-09-09b)',
    '',
    'These are the **real New Game page 1** texts (local stitch). Paste one file into Gemini Pro.',
    '',
    'Start with `ALL-MODES__gemini-pro-PASTE.md` for the full mood sweep. Use the per-mode files if you want a shorter paste.',
    '',
    'Narrator personality does not change page 1. Do not New-Game-loop for Cold Registrar vs Dry Wit.',
    '',
    '## Index',
    '',
    index,
    '',
  ].join('\n');
}

function main(): void {
  installNodeShims();
  mkdirSync(OUT_DIR, { recursive: true });
  const rows = collectOpenings();
  writeFileSync(join(OUT_DIR, '00-README.md'), renderReadme(rows), 'utf8');
  writeFileSync(
    join(OUT_DIR, 'ALL-MODES__gemini-pro-PASTE.md'),
    renderPack('All moods — page 1 stitch', rows),
    'utf8'
  );
  for (const cell of CELLS) {
    const slice = rows.filter((r) => r.mode === cell.mode);
    writeFileSync(
      join(OUT_DIR, `${cell.fileSlug}__gemini-pro-PASTE.md`),
      renderPack(cell.label, slice),
      'utf8'
    );
  }
  const byMode = CELLS.map((c) => `${c.mode}:${rows.filter((r) => r.mode === c.mode).length}`).join(' ');
  console.log(`Wrote ${rows.length} openings (${byMode}) → ${OUT_DIR}`);
}

main();
