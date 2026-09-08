/**
 * Dual critic briefs for Fate autoplay exports.
 * Two lenses (standalone story vs game vibe/pace) — not a single mushy 1–10 card.
 */

import { buildPlayerCapacityContext } from './geminiCriticPrompt';

export type CriticLens = 'story-standalone' | 'game-vibe-pace';

/** One-line Free hook bar for story-standalone packs (full table lives on the game-vibe lens). */
const STORY_FREE_HOOK_BAR =
  '**Free hook bar:** first **8–12** turns are the critical hook; day-1 window **~20** (8 story-start + 12 daily). Judge page-turns against that, not the 50-turn tape.';

/** 08c Option 2 — Free is modern text-MUD, not Wandering Inn prose. */
const FREE_MUD_OPTION2_RUBRIC = [
  '## Free aesthetic lock (Option 2 — MUD-modern)',
  '',
  'This Free tape is **code receipt + optional 1-sentence flavor quote**, not a continuous novel.',
  '- **Score as a modern text-MUD / Fable-lite session:** receipt honesty, pad completeness/reactivity, zero invent, flavor quote quality.',
  '- **Do NOT penalize** monospace/RECEIPT lines, short quotes, or missing novel paragraphs.',
  '- **DO penalize** invented kit/people/places/outcomes, living corpses, pad dead-ends, and receipt lies (XP/loot/HERE that contradict STATUS).',
  '- Narration-only pastes may show only the italic quote — judge invent there; use the game-lens paste for pads + receipts.',
  '',
].join('\n');

const SHARED_RULES = [
  '## Shared rules (both lenses)',
  '',
  '1. Use **only** facts in the attached transcript + meta. Do not invent missing ledger events, IP, or player intent.',
  '2. Every P0/P1 finding needs a **verbatim quote** + **Turn N**.',
  '3. Prefer ticket shape over axis mush: severity, title, turns, quote, why it breaks the read, owner hint (`choicePad` | `arcDirector` | `proseWarden` | `craft` | `opening`).',
  '4. Score **Fate/random pad play** as a legitimate player path — the book must still work when every turn is a Fate pick.',
  '5. Window the read: **T1–20 hook**, mid band, late durability. Do not average away an opening collapse.',
  '6. YES/NO craft gates (answer each; cite turns on NO):',
  '   - No unrequested recycle',
  '   - Turn delta exists (or honest exhaustion)',
  '   - Distinct choice outcomes',
  '   - Continuation creates novelty',
  '   - No unsupported invent (kit / presence / place)',
  '',
].join('\n');

export function buildStoryStandaloneCriticPrompt(meta: {
  bibleTitle?: string;
  engineMode?: string;
  turns?: number;
  writerModel?: string;
  agent?: string;
}): string {
  return [
    '# Critic lens A — Free MUD / session coherence (Option 2)',
    '',
    'You are judging whether this Fate autoplay Free tape works as a **modern text-MUD session** (receipt + pads + rare flavor), NOT as a coherent short novel.',
    'The attached body may be Narration-only (flavor quotes). Receipts/Options may be omitted — do not fail the tape for missing novel prose.',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Premade | ${meta.bibleTitle ?? '(unknown)'} |`,
    `| Engine mode | ${meta.engineMode ?? '(unknown)'} |`,
    `| Turns | ${meta.turns ?? '(unknown)'} |`,
    `| Writer model | ${meta.writerModel ?? '(unknown)'} |`,
    `| Autoplay agent | ${meta.agent ?? 'fate/default'} |`,
    '',
    STORY_FREE_HOOK_BAR,
    '',
    FREE_MUD_OPTION2_RUBRIC,
    SHARED_RULES,
    '## Lens focus',
    '',
    '- Causality of **game events** (did the next beat follow the last act?) — not chapter essay quality.',
    '- Continuity of names/places/stakes when mentioned in flavor quotes.',
    '- Would a Free player keep tapping pads at T20 / T50?',
    '- `[engine fallback ×N]` / empty flavor with honest receipt = OK. Invented novel paragraphs = P0.',
    '',
    '## Required output',
    '',
    '1. **Verdict** — Keep playing? / Stop early? (one sentence + turn if any)',
    '2. **MUD score** — 1–10 for Free MUD-modern quality (one number + one sentence). Do **not** score as Wandering Inn prose.',
    '3. **Findings** — P0/P1/P2 tickets with quotes (invent first)',
    '4. **YES/NO gates** — the five shared craft gates',
    '5. **Best stretch** — 1–3 turns where receipt + pad + quote felt sharp',
    '',
  ].join('\n');
}

export function buildGameVibePaceCriticPrompt(meta: {
  bibleTitle?: string;
  engineMode?: string;
  turns?: number;
  writerModel?: string;
  agent?: string;
}): string {
  const mode = (meta.engineMode ?? '').toLowerCase();
  const modeExpect =
    mode === 'litrpg'
      ? 'LitRPG: story-before-System; earned XP/quest pressure; registration/hook should feel like a game.'
      : mode === 'dnd'
        ? 'Tabletop: fair rulings, risk from fiction, investigation/position — not pad spam.'
        : mode === 'pyoa'
          ? 'PYOA: forks lock, crisis moves, no endless buy-time pads.'
          : mode === 'rpg'
            ? 'Story RPG: relational consequence, leverage, moral pressure — not combat-default mush.'
            : 'Match the stated engine mode expectations.';

  return [
    '# Critic lens B — Game vibe & pace (Free MUD Option 2)',
    '',
    'You are a playtester judging whether this Fate autoplay feels like a **great interactive Free session** (hook, pads, receipts, mode DNA) — not pretty novel prose.',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Premade | ${meta.bibleTitle ?? '(unknown)'} |`,
    `| Engine mode | ${meta.engineMode ?? '(unknown)'} |`,
    `| Turns | ${meta.turns ?? '(unknown)'} |`,
    `| Writer model | ${meta.writerModel ?? '(unknown)'} |`,
    `| Autoplay agent | ${meta.agent ?? 'fate/default'} |`,
    '',
    buildPlayerCapacityContext().trim(),
    '',
    FREE_MUD_OPTION2_RUBRIC,
    SHARED_RULES,
    '## Mode expectation',
    '',
    modeExpect,
    '',
    '## Lens focus',
    '',
    '- **Hook (T1–12):** Would a Free player come back tomorrow? First **8–12** turns are the critical band; day-1 window **~20**.',
    '- **Receipt honesty:** HERE / ACT / OUTCOME / XP / CLEAR lines match what pads imply.',
    '- **Pad completeness:** pad-only play must feel complete; Tag & Trigger pads (e.g. Claim Lowmarket bounty) should react when tagged.',
    '- **T12 durable delta:** quest stage / fight resolved / branch lock / level tick — did it land?',
    '- **Day 2+ wall:** only **12** daily turns. Do not treat a 50-turn tape as one Free session.',
    '- **Pace:** stalls, inspect/wait loops, combat purgatory, dialogue treadmill.',
    '- **Agency:** do offered options imply different futures?',
    '- **Vibe:** modern text-MUD / Fable-lite — not continuous novel.',
    '',
    '## Required output',
    '',
    '1. **Verdict** — Fun Free session? / Drop by turn? (one sentence)',
    '2. **Vibe score** + **Pace score** — each 1–10 + one sentence (MUD aesthetic, not novel)',
    '3. **Findings** — P0/P1/P2 tickets with quotes (loops, dead pads, invent, receipt lies)',
    '4. **YES/NO gates** — the five shared craft gates',
    '5. **Free hook call** — YES/MAYBE/NO would a Free player return tomorrow (day-1 ~20 turns; T12 durable delta yes/no)',
    '',
  ].join('\n');
}
