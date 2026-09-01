# SYNTHESIS — Why Gemini still ~1 after Batch S (2026-09-01)

**Run:** `2026-09-01T14-58-39-037Z_summoned-pact_cold-system_s42` (seed 42) · HUD `2026-08-31s` · commit `b858a0f`  
**Paste:** `scripts/fate-autoplay/runs/gemini-paste-2026-09-01-t50-batch-s/`  
**Pre-S contrast:** `gemini-story-t50-reply.md` / `gemini-game-t50-reply.md` (They/One/Press, Scattered Scale, `crowd here here`, Sergeant treadmill)

## Spot-check (quotes are real)

| Gemini quote | Where on tape |
|---|---|
| `figure 1 priests` / silhouette of `figure 1` | T2, T3 |
| `1. Ascend figure 1 ramparts.` | T3 end |
| `the Ahead half-hidden` / `tarnished the Ahead` / `fortifications of the Ahead` | T8, T20, T44 |
| `the two people heres` | T18 |
| `Ahead shifts weight in Lowmarket…` | T17 (= `stitchCommitDelta`) |
| `The cracked street… is done yielding` / `The crate… is empty` | T37, T38 (= stitch bank) |
| `You reach The Sevenfold Circle under bombardment` + real hub leave/reach | T2–4, T11, T15, T23, T27–28, T31–32, T38–39, T42, T44 |
| Rain / Skirmisher nod null-delta | T16–22 |
| `The crowd here, hunched and bestial` | T47 |
| Travel yo-yo Lowmarket ↔ West Wall | T31+ options |

**Absent on this tape (Batch S actually hit):** quoted `"They"` / `"One"` / `"Press"` as NPCs; Scattered Scale loot/sketch/lunge shapeshift; literal `crowd here here` double token; Wall Sergeant Talk-to case miss binding to Scattered Scale.

## Owner map (Batch S claim → true owner → class)

| Finding | S claimed? | True owner | Class |
|---|---|---|---|
| They / One / Press as NPCs | **yes** | `chromeAuthority.isChoicePadPersonToken` + harvest + `scrubChoicePadPersonNames` | Fixed |
| Scattered Scale shapeshift | **yes** | `isFactionOrOrgToken` + faction-as-loot scrub | Fixed |
| `crowd here here` double-apply | **yes** | `normalizeCrowdRewriteArtifacts` | Fixed (narrow) |
| Sergeant treadmill (Talk-to case) | **yes** | `npcTopicFsm` case-fix + pad interrupt | Fixed / partial (dialogue still soft-recycles later) |
| `figure 1` as noun | **no** | Opening / pointer occupancy leftover; Batch E only banned `figure N is still here` stall (`beatCommitGate.isVerbatimStallStub`) — not entity use | **New adjacent** |
| `the Ahead` as person/place/loot | **no** | Deixis word promoted into `present[]` / pads; `stitchCommitDelta` uses `present[0]` (`beatCommitGate.ts`) — pad deny covers They/One/Press only | **New adjacent** |
| `people heres` / `the crowd here` personified | **partial** | `crowdAuthority.canonicalCrowdPhrase` injects `the … people/crowd here`; normalize kills double-`here` only, not `heres` or using the phrase as a monster | **Incomplete / adjacent** |
| Numbered chips in body (`1. Ascend…`, `1. Draw…`) | **no** (older Batch E/m) | `stripChoiceList` / `CHOICE_OFFER_VERBS` miss Ascend/Draw/Intervene/Peer/Give/Maintain | Incomplete |
| Diegetic stitch as “system log” (T17/37/38) | intentional Path A | `stitchCommitDelta` when commit gate rejects — diegetic *to us*, unreadable *to Gemini* | Side-effect of recovery |
| Sevenfold `You reach…` spam | **yes (P1)** | `scrubFalseArrivalWhenHere` still leaves prefixes on this tape (timing / incomplete strip vs GM invent) | Incomplete |
| Rain / Ready / Wait null-delta T16–22 | **no** | Flash Lite ignore BEAT DELTA + `choiceCompiler` keep offering Wait/Ready/crate + commit gate stitches instead of forcing progress | **New / worsened feel** |
| Travel yo-yo under live stakes | **no** | `choiceCompiler` keeps Travel pads; no encounter travel lock | Residual |

## Why score stays 1 (not “S didn’t ship”)

Batch S shipped and removed the **previous** Gemini P0 cluster. The new tape fails a **different** unreadability stack by **T3** (placeholders + chip leak). Gemini grades readability first; Free-hook is NO at T3 before rain stall or yo-yo matter. Scores cannot rise while placeholder nouns, chip leaks, and null-delta stitches remain the committed story body.
