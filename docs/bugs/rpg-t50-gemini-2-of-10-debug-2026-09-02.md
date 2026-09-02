# RPG T50 Gemini 2/10 Debug Report
**Date:** 2026-09-02  
**Run:** `gemini-paste-2026-09-01-t50-complete-yz-rpg` (Salt Road Heist, RPG mode)  
**Score:** 2/10 (catastrophic failure)  
**Code Baseline:** 2026-08-31n  
**Writer:** google/gemini-2.5-flash-lite  

## Executive Summary

The RPG T50 run scored 2/10 with multiple P0 failures across template injection, pronoun corruption, system leaks, and idle spam. **Critical finding:** This run used code baseline `2026-08-31n`, but Batch X fixes (which specifically address hub-role mad-libs, quest/spawn UI bleed, and entity scrubbing) were deployed on **2026-09-01 at 20:01:08** — AFTER this run completed.

Many of the P0 failures observed here are **already fixed in Batch X** (commit `a884eafb`), but this run predates that deployment.

---

## P0-1: Template Injection — "Tavern" as Character/Verb/Direction

### Evidence

**T9:**
> "Rain drums the awning while **Tavern** watches you from the stall — waiting for your next word in a Salt Road tavern hire."

**T11:**
> "The path leading away from here is muddy and indistinct underfoot, disappearing into the gloom that swallows the Salt Road **Tavern**."

**T14:**
> "The path towards the way ahead street lies beyond... **Tavern**, the passage is poorly lit"

**T25:**
> "You were intending to make your way toward the **Tavern**, but the path east is little more than a boggy track"

**T34:**
> "The caravan... they stick to the main salt road, naturally. It's the most direct path to the **Tavern**"

**T41, T43, T49, T50:** Additional "Tavern" mad-lib uses

### Root Cause

**Flash Lite is confusing "tavern" (a generic building type) with location tokens and using it as:**
1. A character watching the player (T9)
2. A directional destination (T11, T25, T34)
3. A clause separator/mad-lib token (T14)

**Entity Registry Context:**
- `CURSED_KEEP_HUBS` defines `'Greyhollow Tavern'` as a legitimate location (alias for Greyhollow Inn)
- `COMMON_NPCS` includes `'tavernkeeper'` as a valid NPC role
- **Salt Road Heist bible has NO tavern location** — the legitimate hubs are:
  - Salt Road Waystation
  - Consul Caravan Camp
  - Safehouse Alley
  - Harbor Fence
  - Bribe Market
  - Checkpoint Rise

**Scrubber Status:**
- `scrubEntityMadLibs()` in `proseWarden.ts` (lines 511-590) handles known mad-libs:
  - Scattered Scale (faction → direction)
  - Lowmarket Fence (hub+role compound)
  - Wall Sergeant (hub+role compound)
  - Pact-Hunter Skirmisher (enemy+role)
- **"Tavern" is NOT in the mad-lib scrubber** despite being a high-risk generic noun

**Edge Sync Status:** ✅ Client and edge proseWarden are in sync (both at commit `a884eafb`, 2026-09-01 20:01:08)

### Owner

**`proseWarden`** — needs expansion

### Recommended Fix

Add "Tavern" to `scrubEntityMadLibs()` with context-aware scrubbing:

```typescript
// In scrubEntityMadLibs() after line 589:

// Tavern mad-lib — generic building type used as character/destination
next = next.replace(
  /\b(?:the\s+)?Tavern\s+(?:watches|looks|waits|stands|sits)\b/gi,
  'the tavernkeeper watches'
);
next = next.replace(
  /\btoward(?:s)?\s+the\s+Tavern(?!\s+(?:door|window|entrance|keeper))\b/gi,
  'toward the waystation'
);
next = next.replace(
  /\bthat swallows the Salt Road\s+Tavern\b/gi,
  'that swallows the waystation'
);
next = next.replace(
  /\b(?:Tavern),\s+the\s+passage\b/gi,
  'Further along, the passage'
);
```

**Alternative:** Strengthen entity registry validation in `situationPacket` — if the bible has no tavern location, block "Tavern" from location-name slots entirely.

---

## P0-2: Pronoun Corruption — "you stool" instead of "your stool"

### Evidence

**T2:**
> "Vessa, a woman whose weathered face speaks of countless leagues and hard bargains, remains perched on **you stool**, her gaze fixed somewhere beyond your shoulder."

**T4:**
> "Vessa remains a statue of coiled tension on **you stool**, her gaze fixed on some point past your shoulder, unreadable."

**T6:**
> "She slowly draws a finger across the worn wood of the bar, a small, deliberate motion that signals her awareness of your intent."

### Root Cause

**Flash Lite is dropping possessive determiners** — writing "you stool" (subject pronoun + noun) instead of "your stool" (possessive determiner + noun).

**Pattern:**
- "on you stool" (should be "on your stool")
- "perched on you stool" (should be "perched on your stool")

This is a **grammar error**, not a perspective error. The perspective warden correctly handles "your eyes" NPC slips (see `scrubPronounSubjectSlips` line 913), but **does NOT handle possessive determiner corruption**.

**Scrubber Status:**
- `scrubPronounSubjectSlips()` (line 913) handles:
  - Mid-sentence lowercase "your eyes" → "Their eyes"
  - NPC agent + your body kit (e.g., "He ... your head" → "He ... his head")
- **No scrubber for "you + noun" → "your + noun" possessive determiner errors**

### Owner

**`proseWarden`** — missing possessive determiner repair

### Recommended Fix

Add possessive determiner scrubbing to `scrubPronounSubjectSlips()`:

```typescript
// In scrubPronounSubjectSlips() after line 923:

// Possessive determiner drops: "you stool" → "your stool"
next = next.replace(
  /\b(on|at|in|near|beside|behind|toward|towards|from|over|under|with|holding)\s+you\s+(stool|chair|bench|mug|table|bag|pack|knife|sword|weapon|shoulder|side)\b/gi,
  '$1 your $2'
);
next = next.replace(
  /\bperched on you\s+(stool|chair|bench)\b/gi,
  'perched on your $1'
);
```

**Note:** This is a cheap regex fix. A more robust solution would be a full grammar check pass (LanguageTool), but that adds ~50-100ms latency.

---

## P0-3: System Leaks — Choice Options Bleeding into Narration Export

### Evidence

**T11:**
> "...The path leading away from this roadside stop, towards the Salt Road Waystation, is visible, but the choice to leave or stay, to speak or remain silent, rests entirely with you. \"What's the play, Jax? \" Vessa finally breaks the silence, her voice low but carrying the weight of expectation. \"You wanted to talk. I'm here, but my patience ain't infinite. This caravan ain't gonna rob itself, and if we linger too long, opportunities get scarcer than a cool breeze in this desert. \" **1. \"I need to know if you've secured us a buyer for the ledger. \"**"

**T39:**
> "...As you pause, straining your ears, you catch snippets of conversation carried on the damp air – the murmur of guards discussing supply routes, the faint clinking of something metallic from one of the wagons, and Vessa's low, urgent tone as she speaks with someone near the main awning. There's a general hum of activity, the sounds of a camp settling in for the night, but no single word or distinct noise stands out as particularly telling. **Here's what you can do:**"

**T49:**
> "...Inside, you found a jumble of mundane items: a few lengths of tarnished copper wire, a handful of oddly shaped ceramic shards, and a small, tightly rolled piece of parchment tied with a faded blue ribbon. As you sorted through the meager contents, a sudden, sharp cry cut through the din of the market. From the alleyway to your Lowmarket Fence, the Lowmarket Fence in drab, patched leather armor emerged, brandishing a wicked-looking serrated knife. Behind them, two more figures, similarly armed, advanced with predatory intent. Their eyes, reflecting the dim light, fixed on you and the opened chest. **inquiry. \"**"

### Root Cause

**The Narration-only export filter is bypassed in some turns.**

**Expected Behavior:**
- `ensureTurnProse()` in `narrativeSanitize.ts` (line 120) calls `stripChoiceList()` to remove numbered options
- `stripChoiceList()` in `parser.ts` (line 182) should strip:
  - Numbered choice lines (e.g., "1. Do X")
  - "What do you do?" closers
  - Choice header lines

**What Happened:**
1. **T11:** A quoted dialogue chip (`1. "I need to know..."`) was NOT stripped by `stripChoiceList()`. The regex at line 220 should handle quoted chips, but may have failed due to multi-line formatting.
2. **T39:** "Here's what you can do:" is a choice header that should be caught by `CHOICE_HEADER_REGEX`, but was not.
3. **T49:** A trailing `inquiry. "` fragment suggests incomplete choice stripping.

**Code Status:**
- Batch U (line 219-223) added quoted dialogue chip stripping: `/(?:^|[.!?]\s+)\d+[.)]\s+["""][^"""\n]{4,160}["""]\s*/g`
- Batch T extended choice strip verbs (line 217: "slip|head|return|enter|...")

**But:** This run used baseline `2026-08-31n`, which predates Batch U/T/X fixes.

### Owner

**`narrativeSanitize` / `parser.stripChoiceList`** — export filter bypass

### Recommended Fix

**Already partially fixed in Batch X** (commit `a884eafb`), but additional hardening needed:

1. **Extend `CHOICE_HEADER_REGEX` to catch "Here's what you can do:":**

```typescript
// In parser.ts, update CHOICE_HEADER_REGEX (around line ~180):
const CHOICE_HEADER_REGEX = /^.*\b(?:what do you do\??|here'?s? what you can do|options?|choices?|you can):\s*$/im;
```

2. **Harden multi-line quoted chip stripping:**

```typescript
// In stripChoiceList() after line 223:
result = result.replace(
  /(?:^|\.\s+)\d+[.)]\s+["""][^\n]+$/gm,
  (full) => full.match(/^\./)?.[0] ?? ''
);
```

3. **Add export-time safety check:**

```typescript
// In narrativeSanitize.ts, add to ensureTurnProse():
if (/\d+[.)]\s+["""]/g.test(withoutChoices) || /here'?s what you can do/i.test(withoutChoices)) {
  // Re-run stripChoiceList with more aggressive mode
  return stripChoiceList(withoutChoices).trim() || cleanText;
}
```

---

## P0-4: Idle Spam — T7-10 Atmosphere-Only Beats with Zero Narrative Delta

### Evidence

**T7:**
> "A vendor under a patched tarp meets your glance in a Salt Road tavern hire, then looks away — the moment is yours to break."

**T8:**
> "Copper and wet stone smell thick in a Salt Road tavern hire. Someone nearby shifts, expecting you to act."

**T9:**
> "Rain drums the awning while Tavern watches you from the stall — waiting for your next word in a Salt Road tavern hire."

**T10:**
> "Grit stings your eyes on a Salt Road tavern hire. The road toward Salt Road Waystation lies open if you mean to leave."

### Root Cause

**Fate autoplay picked idle/loiter actions (Wait, Listen, Look Around) 4 turns in a row, and the writer produced atmosphere-only beats with no story delta.**

**Why This Happened:**

1. **Location Corruption:** "a Salt Road tavern hire" is NOT a real location (see P0-1). This is a mad-lib corruption of "Salt Road Waystation" or "tavern" generics.

2. **Atmosphere Banks:** These beats are valid **diegetic stitch bank** content from `openingStitch.ts` / `codedSceneMove.ts`:
   - "Copper and wet stone smell thick"
   - "Someone nearby shifts, expecting you to act"
   - "Rain drums the awning"
   
   These are **INTENDED** for scene-setting when no other beat exists, but they should NOT repeat 4 times.

3. **Choice Pad Filter:** The pad should have starved idle actions after 2-3 consecutive loiter turns (see Batch G: `≥3 loiter → exit/talk/travel pads`), but did not fire.

**Code Status:**
- Batch E (31p) added loiter treadmill interrupt: `≥3 loiter → exit/talk/travel pads`
- Batch G (31r) hardened combat pad lock + turn job pads
- **This run predates those fixes** (baseline 2026-08-31n)

### Owner

**`choicePad` / `arcDirector`** — loiter treadmill interrupt + beat delta enforcement

### Recommended Fix

**Already partially fixed in Batch E/G**, but additional hardening needed:

1. **Strengthen loiter interrupt:**

```typescript
// In choiceCompiler.ts, harden loiter streak detection:
const loiterStreak = last5Intents.filter(i => 
  ['wait', 'listen', 'look_around', 'inspect'].includes(i)
).length;

if (loiterStreak >= 2 && !hasLiveEncounter) {
  // Hard-starve wait/listen/inspect pads
  legalEdges = legalEdges.filter(e => 
    !['wait', 'listen', 'look_around', 'inspect'].includes(e.intent)
  );
  // Force exit/talk/travel
  if (!legalEdges.find(e => ['exit', 'talk', 'travel'].includes(e.intent))) {
    legalEdges.push(syntheticExitPad());
  }
}
```

2. **Beat Delta Enforcement (Arc Director):**

```typescript
// In arcDirector.ts, pre-GM check:
if (loiterStreak >= 2 && !hasQuestPressure && !hasEncounter) {
  // Inject a turn job or force encounter
  return {
    forcedOutcome: 'turn_job',
    reason: 'Loiter streak exceeds acceptable idle threshold'
  };
}
```

3. **Scrub Diegetic Stitch Reuse:**

```typescript
// In proseWarden.ts, add to runWarden():
if (ctx?.lastGmProse) {
  const lastSentences = ctx.lastGmProse.split(/[.!?]/).slice(-3);
  const currentSentences = next.split(/[.!?]/).slice(0, 3);
  const overlap = lastSentences.filter(s => 
    currentSentences.some(c => c.includes(s.trim()))
  );
  if (overlap.length >= 2) {
    // Reject atmosphere-only repeat
    throw new Error('ATMOSPHERE_ONLY_REPEAT');
  }
}
```

---

## Additional Observations

### "a Salt Road tavern hire" — Phantom Location

This phrase appears 4 times (T7-T10) but is **NOT a valid location** in the Salt Road Heist bible. It appears to be a corruption of:
- "Salt Road Waystation" (the actual starting location)
- Generic "tavern" noun
- "hire" (possibly from "caravan hire" or similar)

**Possible LLM Hallucination:** Flash Lite may be inventing a location name by combining tokens from the scene.

**Recommended Fix:** Add to entity registry validator — if a location name contains 3+ unrelated tokens, reject it.

---

## Critical Timeline

1. **2026-08-31 or earlier:** RPG T50 run executed using code baseline `2026-08-31n`
2. **2026-09-01 20:01:08:** Batch X deployed (`a884eafb`) with hub-role mad-lib fixes, choice leak hardening, and entity scrubbing
3. **2026-09-01 21:02:13:** Paste pack exported (run already complete)
4. **2026-09-02:** Gemini Pro scored the run at 2/10

**Conclusion:** Many of the P0 failures observed here were **already addressed in Batch X**, but this run predates that deployment.

---

## Recommended Next Steps

1. **Re-run RPG T50 with current code** (post-Batch X) to validate fixes
2. **Add "Tavern" mad-lib scrubbing** to proseWarden (see P0-1)
3. **Add possessive determiner repair** to scrubPronounSubjectSlips (see P0-2)
4. **Harden choice export filter** with additional regex patterns (see P0-3)
5. **Strengthen loiter treadmill** with 2-turn hard interrupt (see P0-4)
6. **Add phantom location validator** to entity registry

---

## Evidence Preservation

Original paste file: `scripts/fate-autoplay/runs/gemini-paste-2026-09-01-t50-complete-yz-rpg/story-standalone__gemini-pro-PASTE.md`

Salt Road Heist bible hubs: `src/game/outdoorHubs.ts:159-166`

Prose warden: `src/game/proseWarden.ts` + `supabase/functions/_shared/gm/proseWarden.ts` (both in sync at `a884eafb`)

Batch X commit: `a884eafb054d7253ed5a07be8dd95049067c443b` (2026-09-01 20:01:08)
