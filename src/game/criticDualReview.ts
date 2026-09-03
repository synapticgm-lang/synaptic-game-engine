/**
 * Dual critic briefs for Fate autoplay exports.
 * Two lenses (standalone story vs game vibe/pace) — not a single mushy 1–10 card.
 */

import { buildPlayerCapacityContext } from './geminiCriticPrompt';

export type CriticLens = 'story-standalone' | 'game-vibe-pace';

/** One-line Free hook bar for story-standalone packs (full table lives on the game-vibe lens). */
const STORY_FREE_HOOK_BAR =
  '**Free hook bar:** first **8–12** turns are the critical hook; day-1 window **~20** (8 story-start + 12 daily). Judge page-turns against that, not the 50-turn tape.';

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
    '# Critic lens A — Standalone story / book quality',
    '',
    'You are an editor judging whether this Fate autoplay transcript reads as a **coherent short novel / novella chapter sequence**, independent of HUD chrome.',
    'The attached story body is **Narration-only** — Options chips and STATUS are omitted on purpose. Never treat choice labels as book prose.',
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
    SHARED_RULES,
    '## Lens focus',
    '',
    '- Causality: does each beat follow from the last?',
    '- Character / world continuity (names, places, stakes).',
    '- Chapter shape: escalation, payoff, not atmosphere essays with no change.',
    '- Would a reader turn the page at T20 / T50 / end?',
    '- Ignore Options/STATUS if they leak into the paste — judge **narration prose** only. `[engine fallback ×N]` = collapsed stubs, not chapters.',
    '',
    '## Required output',
    '',
    '1. **Verdict** — Keep reading? / Stop early? (one sentence + turn where you would stop if any)',
    '2. **Book score** — 1–10 for standalone story quality (one number + one sentence)',
    '3. **Findings** — P0/P1/P2 tickets with quotes',
    '4. **YES/NO gates** — the five shared craft gates',
    '5. **Best stretch** — 1–3 turns that worked as fiction',
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
    '# Critic lens B — Game vibe & pace',
    '',
    'You are a playtester judging whether this Fate autoplay feels like a **great interactive game session** (hook, pace, agency, mode DNA) — not only pretty prose.',
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
    SHARED_RULES,
    '## Mode expectation',
    '',
    modeExpect,
    '',
    '## Lens focus',
    '',
    '- **Hook (T1–12):** Would a Free player come back tomorrow? First **8–12** turns are the critical band; day-1 window **~20**.',
    '- **T12 durable delta:** quest stage / fight resolved / branch lock / level tick — did it land?',
    '- **Day 2+ wall:** only **12** daily turns. Do not treat a 50-turn tape as one Free session.',
    '- **Pace:** stalls, inspect/wait loops, combat purgatory, dialogue treadmill.',
    '- **Agency:** do offered options imply different futures?',
    '- **Progression feel:** quest/combat/social movement a player can feel.',
    '- **Vibe:** does it feel like the marketed mode (LitRPG / tabletop / story RPG / PYOA)?',
    '',
    '## Required output',
    '',
    '1. **Verdict** — Fun session? / Drop by turn? (one sentence)',
    '2. **Vibe score** + **Pace score** — each 1–10 + one sentence',
    '3. **Findings** — P0/P1/P2 tickets with quotes (loops, dead pads, mode bleed)',
    '4. **YES/NO gates** — the five shared craft gates',
    '5. **Free hook call** — YES/MAYBE/NO would a Free player return tomorrow (day-1 ~20 turns; T12 durable delta yes/no)',
    '',
  ].join('\n');
}
