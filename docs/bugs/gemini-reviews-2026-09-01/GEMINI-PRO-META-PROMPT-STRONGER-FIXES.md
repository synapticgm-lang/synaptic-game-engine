> **README:** Paste entire file into Gemini Pro; optional attach latest fate-autoplay paste pack transcript (`scripts/fate-autoplay/runs/gemini-paste-*-t50-batch-*/` or newest `*_summoned-pact_cold-system_s42` run).

---

# SynapticGM — Request for Stronger Architectural Fixes (not more scrubs)

**Prepared:** 2026-09-01 · **Author context:** John (founder) · **Audience:** Gemini Pro (architecture / systems design)  
**Purpose:** After six RRR fine-tuning batches (S→X) on the same Fate autoplay cell, scores remain ~1–3/10. We need **ranked structural interventions** to compare against our incremental Path A scrub/deny-list approach.

---

## A) Context block

### What SynapticGM is

SynapticGM is a browser LitRPG / tabletop / story-RPG / PYOA narrative game. A hosted **Gemini 2.5 Flash Lite** writer (`google/gemini-2.5-flash-lite` on Free tier) produces GM prose each turn. The client + Supabase edge (`gm-turn`) assemble a **situation packet** (compact SNAPSHOT of location, crowd, presence, inventory, arc pressure) and post-process every beat through **wardens**, a **commit gate**, and a **choice compiler** before the player sees story + option chips.

Players can type freely or tap chips. **Fate autoplay** (headless harness) stress-tests quality by **randomly picking among offered chips** each turn — same code path as live play minus React UI. Eval cell: **Summoned Pact** premade, **Cold Registrar** system voice, **seed 42**, **50 turns**, writer Flash Lite.

### Path A — ledger-first goal

We shipped **Path A** (Manus BIG CHANGES Wave 1–2) to invert authority: the GM should **render** committed world state, not **plan** it.

| Module | Role today |
|---|---|
| **`arcDirector`** | Pre-GM: quest stage commits, drought skirmish pressure, liveness mandates, STATUS receipts |
| **`beatCommitGate`** | Post-GM: reject atmosphere-only / recycle / stitch fingerprints / combat purgatory; fallback → `codedSceneMove` |
| **`choiceCompiler`** | Pad refill from scene + legal edges; travel starve; encounter lock; semantic fingerprint cooldown |
| **`encounterTerminalFsm`** | Flee/parley/clear caps; `caught` on flee fail; travel block under live encounter |
| **`narrativeHarvest`** | Scrape GM prose → `present[]`, props, lorebook — **feeds SNAPSHOT next turn** |
| **`proseWarden`** | Regex scrub: entity mad-libs, false arrival, crowd grammar, chrome speaker tags |
| **`codedSceneMove`** | Deterministic diegetic fallback when commit gate rejects GM output |
| **`readabilityGate`** | Post-run automated scan → `summary.json` (no Gemini needed) |
| **`fate-autoplay`** | Matrix runs, paste packs for your review, manifest + replay hash |

**Mid writer:** OFF (locked). **Continuity-Warden LLM:** explicitly rejected — classifier-only.

### Honest score ceiling (internal model)

From Manus T12 + observed RRR results:

| Horizon | Credible band | Notes |
|---|---:|---|
| One architectural batch (authority inversion done right) | **4.5–6.5/10** | Stationary failure broken; one mode slice works |
| Three disciplined batches | **7.0–8.5/10** | Exhaustion, voice, retention mature |
| Scrub-only incremental batches | **~1–3/10 plateau** | What we are living now |
| Aspirational 9–10 | Not committed | Content + human retention + long-tail |

**Current reality:** Gemini Pro T50 reviews on seed 42 still report **story 1–3**, **vibe 1–4**, **pace 1–3**, **Free hook NO** after batches S→X. Opening T0–2 is often praised; collapse follows by **T3–T15**.

---

## B) What we tried — batches S→X

All batches: Class D / Path A, **Mid writer OFF**, HUD stamps `2026-08-31s` … `2026-08-31x`. Each batch = Gemini T50 findings on prior stamp → targeted P0 fixes → re-run (when pasted).

| Batch | Stamp | Trigger | Primary fixes | Residual after ship |
|---|---|---|---|---|
| **S** | 31s | Pre-S T50: They/One/Press as NPCs, Scattered Scale shapeshift, `crowd here here`, Sergeant treadmill | `chromeAuthority` pad-token deny; faction-as-loot scrub; crowd normalize; `npcTopicFsm` case fix; false Sevenfold P1; SOCIAL CRISIS suppress | **New failure stack:** `figure N`, `the Ahead`, chip leaks by T3; rain null-delta T16–22; travel yo-yo |
| **T** | 31t | Post-S T50 still ~1 | Ban deixis/occupancy in `present[]`/harvest; crowd `heres`; extended `stripChoiceList`; commit gate scene-move; Sevenfold scrub; travel yo-yo under encounter | Stitch bank strings still committed; false arrival; numbered chips; entity mad-libs; travel ping-pong |
| **U** | 31u | Post-T T50: story 3→still broken on stitch/arrival | `codedSceneMove` diegetic banks; stitch fingerprint + scrub + reject; real location-change arrival only; choice-leak reject; travel starve; `scrubEntityMadLibs`; **`readabilityGate.ts`** wired to fate summary | **Rasped/They harvest collapse**; combat purgatory; meta "Nothing shifts…" lines; rain/Ready soft |
| **V** | 31v | Post-U T50: catastrophic "Rasped" token soup | Dialogue-verb harvest deny; vignette cast guard; combat HP receipts + purgatory hard detect; travel starve on hub treadmill; unearned shard block; leave item-use skip | Stall contact / Scattered Scale mad-libs; UI bleed (`invite a real move`); flee→travel clear XP |
| **W** | 31w | Post-V T50: stop T4 story / drop T15 game | Role/contact label deny; extended mad-lib scrub; diegetic codedSceneMove banks; flee fail→`caught`; `encounterBlocksTravel`; abstract pad starve + scene-grounded refill; readabilityGate entity/ui | Lowmarket Fence compounds; quest stage in prose; spawn log in body; caught pad leak; abstract pads still dominate |
| **X** | 31x | Post-W synthesis (T50 paste pending) | Hub role compound deny; Turn-to strip; quest tracker leak; spawn→STATUS receipt; caught pad lock; ban Press/Ask/Listen/Leave under live NPC/fight | Novel hub compounds need list growth; Free hook unproven; Check Status soft |

**Pattern:** Each batch **closes the previous Gemini P0 cluster** and **opens a adjacent unreadability cluster**. Fixes are overwhelmingly **post-hoc scrub, deny-list, commit reject, pad starve** — not "GM never allowed to invent entities."

---

## C) Persistent failure taxonomy (root causes, not turn quotes)

Group these by **system mechanism**, not individual bad sentences.

### 1. Recovery text becomes story
When `classifyBeatCommit` rejects GM output, `repairRejectedBeat` → `codedSceneMove` commits **engine-authored** prose. Even "diegetic" banks (`invite a real move`, `ash still sifts`, stake prompts) read as **System UI** to Gemini. Reject→fallback→commit loop **replaces** null-delta GM with **different** null-delta engine text that still lands in the book.

**Owner chain:** `beatCommitGate` → `codedSceneMove` → commit pipeline.

### 2. Harvest promotes tokens to `present[]`
`narrativeHarvest` + vignette Title-Case scrape + `syncPresentToCount` promote:
- Choice-pad tokens (They, One, Press)
- Dialogue verbs (Rasped)
- Deixis (Ahead, figure N)
- Role labels (stall contact, Lowmarket Fence)
- Faction names (Scattered Scale)
- Crowd rewrite artifacts (`the crowd here`)

Once in `present[]`, SNAPSHOT **binds** them; next GM turn treats them as real people/places; wardens **scrub symptoms** but ledger **re-seeds** errors.

**Owner chain:** `narrativeHarvest` → `sceneFacts.present` → SNAPSHOT → GM prompt.

### 3. GM planner not bound by sealed ledger
Flash Lite still **plans** encounters, cast, travel, and item grants in prose. Pre-GM `arcDirector` commits some receipts (quest stage, skirmish pressure) but **does not seal** a `SceneManifest` the GM cannot override. GM can:
- Invent capitalized verbs → harvest → cast
- Narrate flee success while FSM says caught
- Grant items player refused
- Emit numbered choice menus inside body

Wardens catch **known** patterns; novel mutations slip until next deny-list batch.

### 4. Flash Lite ignores CRAFT / BEAT DELTA rails
`craftBookCompiler` injects ≤2 mode-specific CRAFT lines per turn. Flash Lite often ignores them. Rain/Ready/Wait loops (T4–22 in multiple tapes) persist because **prompt mandates are non-authoritative**.

### 5. Choice compiler ≠ consequence compiler
Pads are **labels** over similar basins (Ask/Press/Listen, Travel/Walk/Leave). Fate random pick exposes that **edges do not materially change state**. Travel starve/caught lock help but do not give **distinct outcome classes** per edge.

### 6. Combat/state decoupled from narration
Attack loops without HP delta, flee fail → travel clear + XP, parley/hide → same standoff — **encounterTerminalFsm** and **arcDirector** partially own this but GM prose can still commit between receipt and FSM tick.

### 7. Seed variance masks regressions
Same seed 42 is our regression anchor, but **writer sampling** + repair path timing means batch-to-batch comparison is noisy. Automated `readabilityGate` helps but only covers **known** fingerprints.

### 8. Opening authority vs mid-game entropy
T0–2 vault hook repeatedly scores well. Pointer card / opening harvest / first travel snap establish **high-quality canon** that **mid-game harvest corrupts**. Architecture protects opening better than turn 10+.

---

## D) Score trajectory (Gemini Pro T50, seed 42, Summoned Pact)

| Review point | Stamp | Story | Vibe | Pace | Stop / drop turn | Free hook | Readability gate |
|---|---|---:|---:|---:|---|---|---|
| Pre-S baseline | ~31r | 1 | 2 | 1 | T20–22 | NO | — |
| Post-S | 31s | 1 | 1 | 1 | **T3** | NO | — |
| Post-T | 31t | 3 | 4 | 3 | T12–15 | NO | — |
| Post-U | 31u | 1 | 3 | 1 | T6 / T11 | NO | module shipped |
| Post-V | 31v | 2 | 3 | 2 | T4 / T15 | NO | — |
| Post-W | 31w | *(synthesis only)* | — | — | T4 story / T15 game cited | NO | entity/ui checks added |
| Post-X | 31x | **awaiting paste** | — | — | — | — | fence/quest/spawn checks |

**Observations:**
- **Stop turn moved** T3 (S) → T12 (T brief uplift) → T6 (U) → T4 (V) → T15 (V game) — never past mid-session.
- **Best transient uplift:** Batch T (story 3 / vibe 4) before U's harvest regression — suggests fixes can help until a **new corruption path** dominates.
- **Free hook:** NO on every pasted review.
- **Readability gate:** Automated P0 scan (stitch-leak, false-arrival, choice-leak, entity-madlib, ui-bleed, quest-tracker, spawn-log; travel-streak is P1). Does **not** yet gate on null-delta/recycle/combat purgatory — those remain Gemini-only.

**Gemini's recurring P0 labels across batches:** placeholder entity substitution · UI/stitch bleed in narration · choice chips in body · combat/travel purgatory · false Sevenfold arrival · dialogue treadmill.

---

## E) Constraints for your proposals

Hard constraints — proposals must respect these:

1. **Mid writer OFF** for now (no second LLM pass on every turn).
2. **No WOF** (separate future project; out of scope).
3. **Fate autoplay / random chip pick** must remain valid — pads cannot assume human curation.
4. **$0 / cheap inference** on Free: Flash Lite primary; Mid Haiku / repair only if explicitly budgeted later.
5. **Client + edge deploy** — solution must work in browser + `gm-turn` sync path.
6. **No Continuity-Warden critic LLM** — deterministic gates only.
7. **Mobile playtest reality** — latency budgets (~55–60s mid-game Free) already tight.
8. **Incremental deploy preferred** — 2-week slices shippable without full rewrite.

Soft preferences:
- Keep **opening GM** quality (T0–2 hook is an asset).
- Preserve **STATUS chrome** as separate channel from story body.
- Vitest + fate-autoplay + readability gate as CI truth.

---

## F) The ask — propose 3–5 stronger solution paths (ranked)

We want **architectural** options that change **who is authoritative**, not another 20-pattern regex pack.

For **each** proposal, provide:

1. **Name** (short)
2. **Mechanism** — what commits, when, with what data structures
3. **What it replaces** — specifically which of: harvest→present[], beatCommitGate reject loop, pad freefill, GM situation packet planning, warden scrubs
4. **Risk** — failure modes, migration pain, Flash Lite compatibility
5. **Estimated uplift** — honest story/vibe/pace band for seed-42 T50 after one 2-week slice
6. **2-week implementability** — concrete files/modules touched; what vertical slice proves it

**Seed ideas** (you may reorder, merge, or replace):

| # | Direction | Sketch |
|---|---|---|
| A | **Full authority inversion (Manus T7 path 1+2+3)** | ArcDirector selects BeatContract → StateTx commits HP/XP/quest/encounter **before** GM; GM receives sealed SceneManifest; ChoiceCompiler emits legal edges only |
| B | **Template beats for combat/travel/social** | High-frequency intents (attack, flee, travel hub, talk stage N) render from **typed templates** + slot fill; GM only for low-frequency novelty |
| C | **Structured GM output (JSON beats)** | GM returns `{ "story": "...", "entities": [] }`; story commits only if entities ⊆ manifest; no harvest from prose for core cast |
| D | **Pre-commit GM never sees stitch** | On reject, **do not commit** fallback prose as GM; instead replay turn with tighter manifest OR show STATUS-only delta + force new GM call once |
| E | **Separate narration channel** | Story bubble = renderer only; all mechanics/quests/spawns/HP live in STATUS + ledger UI; GM physically cannot write spawn logs or quest stages |
| F | **Harvest freeze / allowlist** | After opening, `present[]` mutations require **typed events** (enter/leave/kill), not regex harvest; prose mentions ignored for cast |
| G | **Beat graph exhaustion** | Hub/combat/social as finite state graph; each edge consumed once until refresh condition; Fate cannot infinite-loop same edge |

Rank by **expected Gemini T50 uplift per engineering week**, not elegance alone.

---

## G) Compare to our approach — explicit critique request

We have shipped **six incremental batches** (~60–80 targeted fixes) in the pattern:

```
Gemini T50 → P0 quote → deny-list / scrub / pad starve / commit reject → vitest → ship → new P0 cluster
```

**Please critique:**

1. Why does this pattern **asymptote at ~1–3/10** despite fixing each reported P0?
2. Which failures are **fundamentally unfixable** with post-hoc scrub while harvest+GM remain planners?
3. What is the **minimum architectural slice** that would break the plateau (smallest bet with largest score jump)?
4. Where did Path A **already ship** useful authority (arcDirector, encounterTerminalFsm, PYOA spine) vs where it **still pretends** to be ledger-first?
5. Is **`codedSceneMove` fallback** helping or harming readability scores?

Be direct. We prefer honest "your scrub strategy is wrong for X" over polite validation.

---

## H) Required output format

Structure your response exactly as:

### 1. Executive summary (≤200 words)

### 2. Ranked interventions (3–5)

For each:
- Rank #, name
- Mechanism (bullet list)
- Replaces (bullet list)
- Risk
- Est. uplift (story / vibe / pace / free-hook YES-NO)
- 2-week slice (checklist)

### 3. Anti-patterns to STOP immediately

List engine behaviors we should **cease**, not patch (e.g. "commit repair prose as GM story").

### 4. If you only fix ONE thing

Single recommendation with rationale tied to seed-42 failure taxonomy.

### 5. Comparison table

| Approach | 2-week cost | Uplift | Fits constraints | Keeps Flash Lite |
|---|---|---|---|---|

Rows: **Continue scrub batches** vs your top 3 proposals.

### 6. Optional: migration sequence

If adopting your #1 recommendation, ordered steps across weeks 1–2 without breaking live testers.

---

## Appendix A — Readability gate (automated, Batch U+)

Module: `src/game/readabilityGate.ts` · Wired: `fate-autoplay` → `summary.json` → `readabilityGate: { pass, p0Count, violations }`

| Kind | What it detects |
|---|---|
| `stitch-leak` | `isStitchBankFingerprint` — meta director / stake bank strings |
| `false-arrival` | `You reach The Sevenfold Circle…` when not there; `scrubFalseArrivalWhenHere` mismatch |
| `choice-leak` | `hasNumberedChoiceLeak` — numbered chips in GM body |
| `entity-madlib` | Scattered Scale / stall contact / hub role compounds / `detectHubRoleMadlib` |
| `ui-bleed` | `invite a real move`, `A question hangs`, wind/cobblestone stitch phrases |
| `quest-tracker` | `hasQuestTrackerLeak` — journal stage text in story |
| `spawn-log` | `hasCombatSpawnLogInBody` — encounter spawn preface in GM body |
| `travel-streak` | 4+ consecutive Travel picks (P1, not P0) |

**Pass rule:** P0 kinds must be zero. Does **not** detect: combat purgatory, dialogue treadmill, null-delta rain loops, Free-hook quality.

---

## Appendix B — Architecture turn order (current vs target)

**Current (simplified):**

```
Player intent → arcDirector (partial pre-commit) → build SNAPSHOT → call GM (Flash Lite)
→ runWarden/proseWarden scrubs → classifyBeatCommit → maybe codedSceneMove fallback → commit
→ narrativeHarvest → present[] → choiceCompiler pads → next turn
```

**Manus target (T12):**

```
Player intent → arcDirector selects BeatContract → StateTx commits effects
→ seal SceneManifest → GM renders only → one repair max → choiceCompiler from legal edges
→ harvest does not override committed cast
```

Gap: we are **between** these — pre-commit exists but is not **sealed**; harvest still **mutates authority** after render.

---

## Appendix C — Batch fix inventory (abbreviated)

### Batch S (31s)
- P0-A/B/C/D: They/One/Press deny; Scattered Scale faction lock; crowd here normalize; Sergeant npcTopicFsm
- P1: Sevenfold false arrival scrub; SOCIAL CRISIS suppress

### Batch T (31t)
- P0-1: deixis/figure N ban in present/harvest/pads
- P0-2: crowd heres + de-personify
- P0-3: commit gate scene-move requirement
- P0-4: stripChoiceList Ascend/Draw/Intervene/Peer/Give/Maintain
- P0-5: Sevenfold harden + travel yo-yo lock

### Batch U (31u)
- P0-1: codedSceneMove; stitch fingerprint/scrub/reject
- P0-2: arrival on real location change only
- P0-3: quoted chips + Descend/Meet strip; choice-leak reject
- P0-4: travel starve ≥2 in 5T + live encounter
- P0-1b: scrubEntityMadLibs
- **readabilityGate.ts** + fate summary wiring

### Batch V (31v)
- P0-A/B: dialogue verb harvest deny; vignette cast guard; stop mark/panel→speaker rewrite
- P0-C: combat HP receipts; detectCombatPurgatoryHard
- P0-D: diegetic codedSceneMove banks; hub travel starve; stake pad refill
- P1: unearned shard; leave item-use skip; crowd-here salad

### Batch W (31w)
- P0-1: isRoleContactLabel; harvest/vignette deny; readabilityGate entity/ui
- P0-2: diegetic banks; stitch reject; stripChoiceList Plunge
- P0-3: caught on flee fail; encounterBlocksTravel; travel snap block
- P0-4: abstract pad starve; sceneGroundedPads
- P1: Sergeant press streak; dual-location scrub; NPC face pronoun

### Batch X (31x)
- P0-1: isHubRoleCompoundToken; detectHubRoleMadlib; typedEntityValidator
- P0-2: Turn-to strip; quest stage scrub; spawn→STATUS; scrubCombatSpawnLog
- P0-3: caught pad lock; max_engaged terminal intents only
- P0-4: ban abstract Press/Ask/Listen/Leave under live NPC/fight

---

## Appendix D — Representative Gemini quotes (evidence chain)

**Pre-S (31r):** `"Scattered Scale known as 'They'"` · `"the crowd here here"` · Sergeant T43–50 treadmill

**Post-S (31s):** `"figure 1 priests"` · `"the Ahead half-hidden"` · `"1. Ascend figure 1 ramparts."` · `"The crate in West Wall is empty. The room asks for an exit"`

**Post-T (31t):** `"the beat needs an exit, a spoken commit, or a stake"` · `"You reach The Sevenfold Circle under bombardment"` (while in Lowmarket) · `"activity Scattered Scale"`

**Post-U (31u):** `"Rasped and They, remained where they were"` · `"Nothing in West Wall shifts until you leave, speak, or commit to a stake."` · combat `"little true effect"` loop

**Post-V (31v):** `"you just Scattered Scale"` · `"the stall contact decree"` · `"invite a real move — talk, trade, or travel."` · flee fail T11 → travel clear XP T15

**Post-W/X (synthesis):** `"lunged Lowmarket Fence"` · `"1. Turn to the Lowmarket Fence"` · spawn push log in story · caught T11–13 then inspect stall

---

## Appendix E — Key file paths (for your 2-week slice planning)

```
src/game/arcDirector.ts
src/game/beatCommitGate.ts
src/game/choiceCompiler.ts
src/game/encounterTerminalFsm.ts
src/game/narrativeHarvest.ts
src/game/proseWarden.ts
src/game/readabilityGate.ts
src/game/craftBookCompiler.ts
src/hooks/useGame.ts
scripts/fate-autoplay/
supabase/functions/gm-turn/
docs/bugs/gemini-reviews-2026-09-01/SYNTHESIS-*.md
docs/research/pasted/manus-big-changes-2026-08-27/T12*.md
```

---

## Appendix F — Evaluation commands

```bash
npm run fate-autoplay -- --bible summoned-pact --turns 50 --seed 42
# Paste pack → Gemini Pro story + game lenses
# Check summary.json → readabilityGate.pass
```

---

*End of prompt — thank you for proposals that change authority, not regex surface area.*
