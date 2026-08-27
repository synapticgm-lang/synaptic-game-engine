/**
 * Full Gemini critic brief embedded in story-for-gemini.md exports.
 * Session-specific facts are filled from the run meta.
 *
 * Includes anti-false-positive rails so critics don't mis-blame
 * "UI template parsers" or claim "no LitRPG chrome" when STATUS lines exist.
 */

export type GeminiCriticSessionMeta = {
  bibleTitle?: string;
  personalityId?: string;
  personalityLabel?: string;
  aiAgentMode?: string;
  turns?: number;
  level?: number | string;
  xpLine?: string;
  errorNote?: string;
  seed?: number | string;
  /** e.g. pre-26u overnight / 2026-08-26u client */
  codeBaseline?: string;
  engineMode?: string;
};

function personalityLabel(id?: string): string {
  switch (id) {
    case 'dry-wit':
      return 'Sarcastic Patch / Dry Wit';
    case 'cold-system':
      return 'Cold Registrar';
    case 'army-brief':
      return 'Army Quartermaster / Mission Lead';
    case 'chilled-gm':
      return 'Friendly System / Friendly Guide';
    case 'cozy-brutal':
      return 'Cozy Brutal';
    default:
      return id || '(default)';
  }
}

function agentExplain(mode?: string): string {
  switch (mode) {
    case 'maxlevel':
      return 'goal-oriented toward XP/levels/combat when options allow';
    case 'storyfollower':
      return 'goal-oriented toward story/NPC/quest options; often avoids risk';
    case 'completionist':
      return 'goal-oriented toward quests/hubs/checklist coverage';
    case 'default':
    case 'fate':
      return 'Fate/random among offered pads (not human taste)';
    default:
      return mode ? `autoplay mode "${mode}"` : 'autoplay';
  }
}

function engineModeLabel(mode?: string): { id: string; label: string; genreExpect: string } {
  switch (mode) {
    case 'dnd':
      return {
        id: 'dnd',
        label: 'Tabletop Fantasy',
        genreExpect: 'investigation, party/position play, dice-honest stakes — not LitRPG panels',
      };
    case 'rpg':
      return {
        id: 'rpg',
        label: 'Story RPG',
        genreExpect: 'character leverage, diplomatic/moral choices, sandbox hubs — soft systems',
      };
    case 'pyoa':
      return {
        id: 'pyoa',
        label: 'Pick Your Own Adventure',
        genreExpect: 'branching crisis choices, ending honesty, physical/tool/cautious verbs',
      };
    case 'litrpg':
    default:
      return {
        id: mode || 'litrpg',
        label: 'LitRPG',
        genreExpect:
          'STATUS/XP/level feel, registration/System chrome, quest spine, combat or danger pressure over long runs',
      };
  }
}

/** Full critic instructions — paste-ready; transcript follows in the same file. */
export function buildGeminiCriticPrompt(meta: GeminiCriticSessionMeta = {}): string {
  const bible = meta.bibleTitle?.trim() || 'this campaign';
  const voiceId = meta.personalityId || '(default)';
  const voice = meta.personalityLabel || personalityLabel(meta.personalityId);
  const agent = meta.aiAgentMode || 'autoplay';
  const agentBlurb = agentExplain(meta.aiAgentMode);
  const turns = meta.turns ?? '?';
  const level = meta.level ?? '?';
  const xp = meta.xpLine ?? 'see Meta header';
  const errors = meta.errorNote?.trim() || 'see Meta / summary if present';
  const seed = meta.seed ?? 'n/a';
  const baseline =
    meta.codeBaseline?.trim() || 'see Meta (if missing, assume unknown — do not invent a stamp)';
  const engine = engineModeLabel(meta.engineMode);
  const isLitrpg = engine.id === 'litrpg';

  return `You are a ruthless but **accurate** product critic for **SynapticGM**, an AI interactive-story game. Judge whether this autoplay transcript would make a paying Mid-tier player prefer SynapticGM over AI Dungeon, NovelAI adventure, ChatGPT "be my GM", Choice of Games-style branching, classic genre novels, and open-world RPG vibes like Fallout 3 / Fable.

Be harsh on real failures. Do **not** invent architecture. Prefer evidence over vibes.

## How to read this file (critical — avoid false fails)

1. **Meta** (above) is ground truth for end Level/XP when present.
2. **Transcript** is chronological. Each beat:
   - Narration (GM prose)
   - **Options:** exact choices offered that turn (this is the playthrough choice pad)
   - **Player:** what the autoplay agent picked (NOT a human)
   - **STATUS / System:** (when present) code-owned XP / quest / loot / level lines — **this IS system chrome**. Count these before claiming "zero System".
3. Warden debug lines are usually omitted from this export on purpose. Absence of "Warden:" is not a product bug.
4. Sample early / mid / late / last 50. Cite **turn numbers**. If unclear: "insufficient evidence." Do not invent missing plot.

## Game mode (do not ignore — score against THIS mode)

| Field | Value |
|---|---|
| **Game / engine mode** | **${engine.label}** (\`${engine.id}\`) |
| **Genre expectations** | ${engine.genreExpect} |
| **Premade / bible** | **${bible}** (original IP — do not compare to named licensed series) |
| **System / narrator voice** | **${voice}** (\`${voiceId}\`) |
| **Autoplay agent mode** | **${agent}** — ${agentBlurb} |
| **Length / seed** | **${turns}** turns · seed **${seed}** |
| **End state** | Level **${level}** · XP **${xp}** |
| **Errors / recovery** | ${errors} |
| **Code baseline** | **${baseline}** |

Voice may appear as STATUS wording, brief asides, or prompt rails — not only as \`[SYSTEM]\` tags in prose. Separate **agent pathology** (safe loops, risk avoidance) from **GM/engine failure** (passivity, mush, no interrupts).

${
  isLitrpg
    ? 'This run is **LitRPG** — score XP/STATUS/level drip and System voice seriously.'
    : `This run is **${engine.label}** — do **not** fail it for "missing LitRPG XP bars." Judge progression in ${engine.label} terms.`
}

## Anti-misdiagnosis rules (read before scoring)

These mistakes appeared in prior reviews — do **not** repeat them:

1. **"UI template / \`[Location.Name]\` failed"** — Wrong default. SynapticGM does **not** use player-visible Mustache tokens like \`[Location.Name]\`. Phrases like "them", "this place", "your them", "the imposing this place" are usually: (a) LLM mush, (b) post-hoc scrub replacing ungrounded nouns, or (c) broken choice-label assembly. Prefer owners: **prose warden / narrative scrub / choice pad / prompt SNAPSHOT** — not "frontend template parser" unless you literally see unresolved \`{{...}}\` or \`[Location.Name]\` tokens in the text.
2. **"No system / no STATUS / no XP"** — First **search the transcript for \`STATUS / System:\` and \`XP Gained\`**. If Meta shows Level/XP > start values, chrome existed even if sparse in prose. Score "visibility & frequency" separately from "ledger exists".
3. **"Personality never wired"** — Cold Registrar / Sarcastic Patch are often STATUS diction + rails, not comedy every beat. Score: (a) presence of any diegetic System/narrator voice, (b) consistency with the selected id, (c) whether numbers stay honest.
4. **"Fix by disabling regex"** — Scrubs exist to stop worse invents. Prefer: tighten scrub, reject broken options, novelty/stagnation interrupts — not "delete all post-processing".
5. **Blame only the agent** — If the player repeats "Walk the battlement" 30× and the GM never interrupts, that is **also** an engine pacing failure.
6. **Wrong genre bar** — Do not judge a ${engine.label} run with a different mode's scorecard (e.g. failing PYOA for missing XP panels).
7. **One seed ≠ all modes** — This file is one bible × one voice × one agent × one engine mode. Say what generalizes vs what might be agent-specific.

## Competitive bar

Score **1–10** (10 = clearly better than typical AI-GM apps; 5 = average chatbot GM; 1 = unplayable). For every score: 2–4 evidence bullets with turn # → why win/lose vs competitors → **one concrete fix** with owner hint from: \`prompt\` | \`proseWarden\` | \`choicePad\` | \`xpCode\` | \`situationSnapshot\` | \`agentPolicy\` | \`bibleContent\` | \`uiChrome\` (avoid "frontend template parser" unless proven).

## Scorecard (required)

1. Opening hook & stakes
2. Pace (include **same-action** loops AND paragraph clones)
3. Flow / scene transitions
4. Option quality (use **Options:** lists; count top recycled labels)
5. Agency & consequence (include whether meta/adversarial player lines are acknowledged)
6. Progression (quests / goals) — for mode **${engine.label}**
7. ${
    isLitrpg
      ? 'XP / level / LitRPG feel (**count STATUS XP lines**; reconcile with Meta Level/XP)'
      : `Progression systems feel for **${engine.label}** (not LitRPG XP bars unless STATUS appears)`
  }
8. Combat / danger
9. Exploration & sandbox
10. NPC / dialogue
11. Voice consistency for **${voice}**
12. Continuity / consistency
13. Hallucinations / mush (\`them\`, \`this place\`, orphan tags)
14. Invented items / kit lies / inventory string corruption (\`[Uncommon] them\`)
15. Invented presence (gate queue / crowds when alone)
16. English / polish (broken option grammar)
17. STATUS / System honesty & **frequency** (mode-appropriate)
18. Long-session durability
19. Would you keep playing? (Mid-tier paying player)
20. Competitive win/loss (one paragraph)

## Deep dives (required)

### A. Progression autopsy
- Timeline of meaningful beats (turn ranges).
- ${
    isLitrpg
      ? 'List every `XP Gained` / level line found under **STATUS / System:** (turn # + text). If none, say none **after searching**.'
      : 'Note any system/quest chrome. Do not demand LitRPG XP unless present.'
  }
- Interpret Meta end Level/XP vs agent mode (${agent}) and engine **${engine.label}**.
- What players of this mode miss by turn 100 / mid / end.

### B. Hallucination & invent ledger
Table (markdown):

| Turn | Type | Evidence quote | Likely owner (from allowed list) | Severity P0–P3 | Suggested gate |

At least 15 rows if present; else say exhausted. **Do not** label rows as \`[Location.Name]\` template failures without literal tokens.

### C. Loop / recycle report
- Top recycled **option** labels with approximate counts.
- Top paragraph clones (turn ranges).
- Same-action loops (e.g. battlement / door / Earth junk) with turn ranges.
- Travel ping-pong hubs.

### D. Best 10 & worst 10 turns
Turn # + one-line why.

### E. Priority fix board
Exactly **12** fixes P0→P2. Each: problem → owner hint (allowed list) → acceptance test in one sentence. Prefer fixes that would still matter on a **human** playthrough, not only headless.

### F. Keep / cut / rewrite for **${voice}**
3 keep, 3 cut, 3 rewrite (quote snippets).

### G. Confidence & blind spots (required)
- What you could not see in this export (UI panels, map, dice, live STATUS if absent).
- What might improve on a newer code baseline than **${baseline}**.
- Agent vs engine: % blame split (rough).
- Confirm you scored against **${engine.label}** (\`${engine.id}\`), not a different game mode.

## Output format

1. Executive verdict (≤5 sentences). Name the **game mode** in sentence 1.
2. Scorecard table (area | score | one-line).
3. Sections A–G.
4. **"Must-fix before claiming better than other apps"** — top 5 only.
5. End with: \`REVIEW_COMPLETE\`.`;
}
