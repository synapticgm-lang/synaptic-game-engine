> **README:** Paste **Section 1–10** (below the horizontal rule) into Gemini Pro as one message. Optional attachment: latest fate-autoplay paste pack — `scripts/fate-autoplay/runs/gemini-paste-2026-09-01-t50-batch-w/` or newest `*_summoned-pact_cold-system_s42` run after Batch X re-score. Appendix is reference only; do not paste unless Gemini asks for file-level detail.

---

# SynapticGM — Full RRR Meta-Prompt (Path A 28a → Batch X)

**Prepared:** 2026-09-01 · **Author:** John (founder) · **Audience:** Gemini Pro (architecture / systems design)  
**Scope:** All Path A / RRR / fine-tuning batches since **2026-08-28a** through **2026-08-31x Batch X**, plus Manus BIG CHANGES context and Gemini T50 score trajectory.

---

## 1. Role & mission

You are **Gemini Pro** advising on **SynapticGM** architecture — a browser LitRPG / tabletop / story-RPG / PYOA narrative game with a hosted **Gemini 2.5 Flash Lite** Free writer.

**Mission:** After **~20 Path A batches** and **six RRR fine-tuning cycles (S→X)** on the same eval cell, Gemini T50 scores remain **~1–3/10**. We need **stronger fixes than incremental scrubs, deny-lists, and post-hoc wardens**. Propose ranked **structural interventions** that change **who is authoritative** in the turn pipeline — compare to our implementer hypothesis (Section 7), critique our whack-a-mole pattern (Section 6), and give a honest **2-week plan** under hard constraints (Section 9).

Be direct. Prefer "your scrub strategy cannot fix X" over polite validation.

---

## 2. Product context

### What the engine does

Each turn: client + Supabase edge (`gm-turn`) build a **situation packet** (compact SNAPSHOT: location, crowd, presence, inventory, arc pressure) → call GM (Flash Lite on Free) → **wardens** + **commit gate** + **choice compiler** → player sees story + chips. Players type or tap chips. **Fate autoplay** (headless harness) **randomly picks among offered chips** — same code path as live play minus React UI.

**Eval cell (regression anchor):** Summoned Pact premade · Cold Registrar system voice · **seed 42 · 50 turns · Flash Lite**.

### Path A — ledger-first goal (Manus BIG CHANGES)

Shipped to invert authority: GM should **render** committed world state, not **plan** it.

| Module | Role today |
|---|---|
| `arcDirector` | Pre-GM: quest stage commits, drought skirmish, liveness mandates, STATUS receipts |
| `beatCommitGate` | Post-GM: reject atmosphere-only / recycle / stitch fingerprints; fallback → `codedSceneMove` |
| `choiceCompiler` | Pad refill from scene + legal edges; travel starve; encounter lock; semantic fingerprint cooldown |
| `encounterTerminalFsm` | Flee/parley/clear caps; `caught` on flee fail; travel block under live encounter |
| `narrativeHarvest` | Scrape GM prose → `present[]`, props, lorebook — **feeds SNAPSHOT next turn** |
| `proseWarden` | Regex scrub: entity mad-libs, false arrival, crowd grammar, chrome speaker tags |
| `codedSceneMove` | Deterministic diegetic fallback when commit gate rejects GM output |
| `readabilityGate` | Post-run automated scan → `summary.json` (Batch U+) |
| `fate-autoplay` | Matrix runs, paste packs, manifest + replay hash |

**Mid writer:** OFF (locked). **Continuity-Warden LLM:** rejected — classifier-only.

### Honest score ceiling (Manus T12 + observed RRR)

| Horizon | Band | Meaning |
|---|---:|---|
| One architectural batch (authority inversion done right) | **4.5–6.5/10** | Stationary failure broken; one vertical slice works |
| Three disciplined batches | **7.0–8.5/10** | Exhaustion, voice, retention mature |
| Scrub-only incremental batches | **~1–3/10 plateau** | Current reality |
| 9–10 | Not committed | Content + human retention |

**Current reality:** Gemini T50 on seed 42 reports **story 1–3**, **vibe 1–4**, **pace 1–3**, **Free hook NO** after batches through X. Opening T0–2 often praised; collapse by **T3–T15**.

### Manus verdict (2026-08-27)

27w quality modules **governed around the GM** instead of committing world change **before** narration. Partial wins (them ↓31%, L2 on some runs) prove deterministic ledgers work for **bounded** domains. Catastrophic failures unchanged: **180–260 pad hits/run**, **streakMax 2–4**, zero combat/crisis receipts in 300t (pre-28a). Recommended bundle: **ArcDirector authoritative commits + BeatContract registry + graph-derived ChoiceCompiler** (Manus T7 options 1+2+3).

---

## 3. Full chronology table (RRR start → Batch X)

One-line **shipped** + one-line **residual** per named batch. HUD stamps shown where relevant.

| Batch | Stamp | Shipped (1 line) | Residual (1 line) |
|---|---|---|---|
| **28a Path A** | 28a | `runManifest`, `beatContract` registry, `arcDirector` pre-GM commits, `choiceCompiler`, `npcTopicFsm`, LitRPG pacing 200 XP L1→L2 | Pre-commit exists but not sealed; harvest still mutates authority |
| **28b Manus slice** | 28b | T12 hook → STATUS; beat StateTx; B045 daily milestone; discovery/hub exhaustion; receipt liveness in fate summary | Wave 3 sealed fallback deferred |
| **28c Manus complete** | 28c | Sealed manifest + fallback B026–28; eval harness B029–33; choiceEdge B018–21; ArcDirector liveness gates; NPC topic + PYOA branch ledger | Gemini ~1/10 despite receipt liveness — terminal semantics missing |
| **29a score boost** | 29a | `encounterTerminalFsm`; combat pad lock; entity scrub allowlist; PYOA branch lock; eval gates clear@T50 | Combat spawns but purgatory persists |
| **29b optimise** | 29b | Combat HP ledger; encounter clear XP; `freeT12Hook` in ArcDirector; flee authority; hard streak≥5 pad interrupt | STATUS leak residual; edge prose sync gaps |
| **29c Free-hook recovery** | 29c | Kit→pronoun scrub kill; loiter force; drought bible; PYOA branch lock; opening NPC pin | Alt-cells 4×300 re-score gate pending |
| **29d Gemini-calibrated** | 29d | Prompt diet; PROSE LICENSE; stranger≠merchant; Free Flash Lite→Llama failover | Flash Lite may ignore PROSE LICENSE |
| **29e world map** | 29e | Premade settlements; WORLD MAP AUTHORITY; invent-lock geography; NPC harvest→lorebook | Hub banks merge with atlas; harvest Title-Case heuristic |
| **29f hide/show + stitch** | 29f | Hide text/options semantics; stitch opener banks | New Game still stitches on GM empty/timeout |
| **29g hide chrome** | 29g | Hide text = input box; Hide options = chips only | Opening with no chips looks broken |
| **30a Wave 2** | 30a | B023 NPC role obligations; B024 hub beat caps; B025 PYOA branch convergence | Obligations mandate-only; no hard NPC exit commit |
| **30b Wave 3 prep** | 30b | Tests + wiring toward sealed manifest (vitest `playtest30bWave3`) | — |
| **30c opening GM** | 30c | `callOpeningGm`; turn-fail classify; Continue keeps debug session | New Game stitch fallback on empty/timeout |
| **30d Wave 3 manifests** | 30d | `buildSealedManifest`; `validateProseAgainstManifest`; one-repair policy B028 | Manifest validates post-hoc; GM still plans cast |
| **30R anti-repeat** | 30R | Clone reject; stall-pad recycle drop; Download play transcript | Near-clone retry burns extra Free call |
| **30S mode craft** | 30S | Four mode AUTHORITY sentences; anti-repeat; unearned look-around XP skip | Live saves lack per-turn SNAPSHOT in export |
| **30T thumbs + inspect** | 30T | Thumbs on GM bubbles; inspect no name-ask leak | Admin Feedback page unmounted |
| **30U/V home scroll** | 30V | Mobile scroll fix; HUD set name popover | Not verified on physical Android |
| **30X crowd authority** | 30X | `crowdAuthority`: SNAPSHOT crowd + `sceneFacts.crowdCount` bind | Opening GM can invent size before first harvest |
| **30Y chrome ≠ person** | 30Y | Chrome/cover never in `present[]`; warden rewrites chrome+slot pronouns | Writer can name dummy before harvest |
| **30Z collage prefix** | 30Z | Strip recycled sentence prefix when tail has new content | Short shared phrases ignored |
| **31a hook lock** | 31a | `hookLock`: summon-why persists on sceneFacts + SNAPSHOT | NPC lies not modeled |
| **31b chrome never speaks** | 31b | `rewriteChromeSpeakerTags`: panel cannot dialogue | Inspect-panel pads remain |
| **31c Josie holes** | 31c | cameraLock; pad follows intent; thumbs everywhere | Opening crowd size pre-harvest |
| **31d force-latest** | 31d | Stale tab hard-reload vs deployed BUILD | CDN mixed chunks need hard refresh |
| **31e name ≠ here** | 31e | `pcNameAuthority` deny-list; atmosphere recycle = no delta | Numbered chips closed in 31h |
| **31f map essay + autofight** | 31f | `isAtmospherePlaceName`; auto-fight `lastKill` + encounterTerminalFsm | Drought-without-foe → 31h |
| **31g craft book** | 31g | `craftBookCompiler`: ≤2 CRAFT lines/mode pre-GM | Flash Lite ignores CRAFT |
| **31h gap close** | 31h | Drought preface; ChoiceCompiler encounter/intent/PYOA pads; IntentContract demand | Map L/R skipped; Free retention gap |
| **31i critic A+B** | 31i | No sealed-manifest HUD stubs as story; Fate 429 backoff; Engage=live encounter only | Recovery prose thin |
| **31j critic C+D** | 31j | Lowmarket vignette lock; Gemini narration-only exporter; dual-location scrub | XP audit still Waiting |
| **31l opening authority** | 31l | Stitch-first page 1; POINTER CARD; classifier commit gate; invent budget 0 | Flash Lite ignores two CRAFT lines |
| **31m next batch** | 31m | Map L/R from floor-plan; harder commit gate; drought pendingEncounter park | GM prose can still say left/right |
| **31n memory widen** | 31n | Raw recent log 4×500 chars in context prompt | Extra lines = atmosphere glue risk |
| **31p Batch E** | 31p | Prompt-bleed strip; stall treadmill interrupt; location amnesia scrub | Closed by F for CRAFT/same-room |
| **31q Batch F** | 31q | Same-room essay HARD; drought invent scrub; parley success ledger | CK/Salt Gemini awaited |
| **31r Batch G + PYOA** | 31r | Combat pad lock; idle FSM no XP farm; Thornferry PYOA spine v1 (12 nodes) | Other PYOA bibles not densified |
| **31s Batch S** | 31s | They/One/Press deny; Scattered Scale scrub; crowd here; Sergeant fix | **New stack by T3:** figure N, Ahead, chip leaks |
| **31t Batch T** | 31t | Deixis ban in present[]; crowd heres; scene-move commit gate; travel yo-yo lock | Stitch/arrival/entity mad-libs remain |
| **31u Batch U** | 31u | `codedSceneMove`; stitch reject; real arrival only; **`readabilityGate.ts`** | Rasped/They harvest collapse; rain soft |
| **31v Batch V** | 31v | Dialogue-verb harvest deny; combat purgatory hard; hub travel starve | Stall contact mad-libs; UI bleed |
| **31w Batch W** | 31w | Role/contact deny; flee→caught; encounterBlocksTravel; abstract pad starve | Fence compounds; spawn in body |
| **31x Batch X** | 31x | Hub role compound deny; quest/spawn→STATUS; caught pad lock; ban abstract pads under fight | Free hook unproven; novel compounds |

**RRR pattern (S→X):** Each batch closes prior Gemini P0 cluster and opens an **adjacent unreadability cluster**. Fixes are overwhelmingly post-hoc scrub, deny-list, commit reject, pad starve — not "GM never allowed to invent entities."

---

## 4. Persistent failure taxonomy (10 classes)

Group by **system mechanism**, not individual bad sentences. Evidence spans 28c worst-cells through Batch X T50.

### F1 — Recovery text becomes story
`beatCommitGate` reject → `repairRejectedBeat` → `codedSceneMove` commits engine prose (`invite a real move`, `ash still sifts`, stake prompts). Reads as System UI to Gemini. Reject→fallback **replaces** null-delta GM with **different** null-delta engine text still in the book.  
**Owners:** `beatCommitGate.ts`, `codedSceneMove`, commit pipeline.

### F2 — Harvest promotes tokens to `present[]`
`narrativeHarvest` + Title-Case scrape + `syncPresentToCount` promote: pad tokens (They, One, Press), dialogue verbs (Rasped), deixis (Ahead, figure N), role labels (stall contact, Lowmarket Fence), factions (Scattered Scale), crowd artifacts (`the crowd here`). SNAPSHOT binds them; next GM treats as cast; wardens scrub symptoms but ledger re-seeds.  
**Owners:** `narrativeHarvest` → `sceneFacts.present` → SNAPSHOT.

### F3 — GM planner not bound by sealed ledger
Flash Lite plans encounters, cast, travel, item grants. Pre-GM `arcDirector` commits some receipts but does **not seal** a SceneManifest GM cannot override. Novel capitalized verbs → harvest → cast; flee success while FSM says caught; numbered menus in body.  
**Owners:** `situationPacket`, `arcDirector`, `buildSealedManifest` (validates post-hoc only).

### F4 — Flash Lite ignores CRAFT / BEAT DELTA rails
`craftBookCompiler` injects ≤2 mode-specific lines; often ignored. Rain/Ready/Wait null-delta loops (T4–22) persist — prompt mandates non-authoritative.  
**Owners:** `craftBookCompiler`, SNAPSHOT rails.

### F5 — Choice compiler ≠ consequence compiler
Pads are labels over similar basins (Ask/Press/Listen, Travel/Walk/Leave). Fate random pick exposes edges that **do not materially change state**. Travel starve/caught help but lack distinct outcome classes.  
**Owners:** `choiceCompiler`, `choiceEdge`, `encounterTerminalFsm`.

### F6 — Combat/state decoupled from narration
Attack loops without HP delta; flee fail → travel clear + XP; parley → standoff. FSM partially owns state; GM prose commits between receipt and FSM tick.  
**Owners:** `encounterTerminalFsm`, `arcDirector`, combat authority modules.

### F7 — Combat/crisis purgatory (spawn without terminal)
28c liveness fixed **receipt existence** (combat/crisis by T8–20) but not **resolution**. LitRPG T9–300 in encounter; DnD flee/parley 40–60×; PYOA crisis receipts without branch lock.  
**Owners:** `encounterTerminalFsm`, BeatContract registry (thin).

### F8 — Scrub collateral / entity validator blind spots
`proseWarden` fixes one pattern, breaks grammar (Salt Road "Crew Token", "Directly's"). Deny-lists grow; novel hub compounds (Lowmarket Fence verb/object) slip until next batch.  
**Owners:** `proseWarden`, `typedEntityValidator`, `scrubEntityMadLibs`.

### F9 — Opening authority vs mid-game entropy
T0–2 vault hook scores well. Pointer card / opening harvest establish canon that **mid-game harvest corrupts** by T3–15. Architecture protects opening better than turn 10+.  
**Owners:** opening contract vs `narrativeHarvest` post-open.

### F10 — Telemetry vs readability scoreboard mismatch
Eval harness passes liveness gates while Gemini scores ~1/10 — two scoreboards. `readabilityGate` catches known fingerprints only; not null-delta, purgatory, Free-hook.  
**Owners:** `readabilityGate.ts`, eval harness, Gemini paste protocol.

---

## 5. Gemini score trajectory (T50 and key 300t reviews)

### Summoned Pact · seed 42 · T50 · Cold Registrar (primary RRR cell)

| Review point | Stamp | Story | Vibe | Pace | Stop / drop | Free hook | Notes |
|---|---|---:|---:|---:|---|---|---|
| Pre-S baseline | ~31r | 1 | 2 | 1 | T20–22 | NO | They/One/Press; Scattered Scale; crowd here here |
| Post-S | 31s | 1 | 1 | 1 | **T3** | NO | figure N; Ahead; chip leaks |
| Post-T | 31t | 3 | 4 | 3 | T12–15 | NO | Brief uplift; stitch/arrival remain |
| Post-U | 31u | 1 | 3 | 1 | T6 / T11 | NO | "Rasped" token soup; readabilityGate shipped |
| Post-V | 31v | 2 | 3 | 2 | T4 / T15 game | NO | Stall contact; UI bleed; flee→travel XP |
| Post-W | 31w | 2 (synth) | 3 | 2 | T4 story / T15 game | NO | Synthesis only; entity/UI collapse |
| Post-X | 31x | **awaiting paste** | — | — | — | — | Fence/quest/spawn fixes shipped |

**Observations:** Stop turn never past mid-session. Best transient uplift Batch T (story 3) before U harvest regression. **Free hook: NO on every pasted T50 review.** Opening T0–2 repeatedly "best stretch."

### Worst-cell 300t · 28c vs 27w (four modes, Manus regression)

| Mode | Cell | Gemini ~27w → 28c | Free hook | Telemetry win | Readability |
|---|---|---:|---|---|---|
| LitRPG | SP s18 | ~1 → ~1 | NO → NO | them 28→9; combat receipt 1 | Combat purgatory T9–300 |
| DnD | CK s69 | ~1 → ~1–2 | NO → NO | L2; STATUS 2→6/10 axis | Wraith loop; scrub collateral |
| RPG | Cape s137 | ~1 → ~1 | NO → NO | them **regression** 26→52 | Leverage/Listen pad basin |
| PYOA | Thornferry s188 | ~1 → ~1 | NO → NO | crisis receipts 3 | Branch receipt without lock |

**Manus lesson:** Receipt liveness **necessary, not sufficient**. ArcDirector can spawn; cannot terminate or bind entities through 300t of GM prose.

### 29b alt-premades (selected)

Salt Road s120: mush/scrub **1/10** English; Free hook NO @ T17. Vesper-Glass PYOA: **300-turn single-hallway clone loop**; Free hook NO. Mislabeled cells (gemini-17/20) excluded from mode scores.

### Free-hook product gap (research)

27w Summoned Pact 300t: maxlevel never L2 on talk path; storyfollower L2 @ T265; ~90% inspect drip; Free day-1 ~20t no level tick. **Retention band unproven** — awaiting John pacing targets + T50 uplift.

---

## 6. What incremental Path A cannot fix

Explicit critique of **whack-a-mole**:

```
Gemini T50 → P0 quote → deny-list / scrub / pad starve / commit reject
→ vitest → ship → NEW P0 cluster adjacent to the fix
```

**Why this asymptotes at ~1–3/10:**

1. **Symptom graph is infinite.** Flash Lite generates novel capitalizations, compounds, and deixis faster than regex packs. Each batch closes **one cluster** (They/One → figure N → Rasped → stall contact → Lowmarket Fence) while harvest **re-seeds** errors from prose every turn.

2. **Post-hoc authority is backwards.** Wardens and commit gates run **after** GM plans the world. Fixing "Scattered Scale in present[]" does not stop GM from inventing the **next** entity class. Harvest **writes** SNAPSHOT from unverified prose — scrubbing downstream cannot restore authority upstream.

3. **`codedSceneMove` poisons readability.** Diegetic fallback still commits **engine menu text** as GM story. Gemini scores **Stop T4** on UI bleed. Reject loops swap bad GM for bad engine — both land in the book.

4. **Pads without state edges = Fate-exposed.** Random chip pick reveals that Ask/Press/Travel often return to the **same basin**. Starving pads helps; does not create **committed consequences** per edge.

5. **CRAFT/prompt rails on a non-compliant model.** Flash Lite ignores BEAT DELTA and CRAFT. Mandate-heavy 27w proved detectors ≠ actuators. More prompt without pre-commit seals = same null-delta rain loops.

6. **Two scoreboards hide stagnation.** Telemetry liveness (combat receipt exists) improved 28c while Gemini stayed ~1/10. Teams can ship "green eval" without readable transcripts.

**Fundamentally unfixable with scrub-only while harvest+GM remain planners:** F2 entity promotion, F3 GM override, F5 pad basins, F7 spawn-without-terminal, F9 mid-game entropy. Scrub can **reduce frequency** of known patterns; cannot **guarantee** readable 50-turn sessions.

**Minimum architectural slice to break plateau (implementer view):** **Freeze harvest into present[] after opening** + **pre-GM sealed SceneManifest** + **one BeatContract vertical slice** (hub travel OR combat terminal) where GM prose **cannot** change committed cast/HP/location. Estimated jump: story **3–5/10** on seed 42 if fallback prose stops committing as GM.

**Path A already real vs pretends ledger-first:**

| Real authority | Still pretends |
|---|---|
| `encounterTerminalFsm` flee/parley/clear caps | GM narrates around FSM |
| `arcDirector` quest stage + skirmish spawn | GM invents cast/items freely |
| PYOA spine v1 (Thornferry 12 nodes) | GM harvest overrides branch cast |
| Sealed manifest validate (30d) | Post-hoc; GM never sees seal pre-call |
| `readabilityGate` known fingerprints | Most failure classes Gemini-only |

---

## 7. Implementer hypothesis (ranked — for your comparison)

Our agent's ranked solution **specific to this codebase**. Please compare, reorder, or reject.

### #1 — Harvest freeze + typed entity events (2-week slice A)

**Mechanism:** After `openingEstablishment.complete`, **`present[]` mutations only via typed events** (`EntityEnter`, `EntityLeave`, `EntityKill`, `NpcSpawnReceipt`) committed in `arcDirector` / `encounterTerminalFsm`. `narrativeHarvest` may append **lorebook** and **props** but **cannot add person tokens** to `present[]`. Title-Case scrape → suggest queue → human/auto reject unless event fired.

**Replaces:** F2 harvest promotion; half of F8 scrub growth; `syncPresentToCount` figure-N padding.

**Files:** `narrativeHarvest.ts`, `arcDirector.ts`, `sceneFacts` schema, `situationPacket.ts`, `typedEntityValidator.ts`.

**Risk:** Under-populated scenes if spawn receipts miss; needs spawn preface → STATUS only (Batch X partial).

**Est. uplift:** story 3–4 / vibe 3–4 / pace 2–3 / Free hook still NO until pacing slice.

### #2 — Sealed SceneManifest pre-GM (Manus I01 + 30d extend)

**Mechanism:** Before `callGm`, `arcDirector` + BeatContract select legal beat → **seal manifest**: `{ location, crowdCount, presentIds[], encounterPhase, questStage, legalExits[], forbiddenInventions[] }`. SNAPSHOT BINDING: GM may describe only manifest entities. Post-GM: `validateProseAgainstManifest` **hard reject** (not scrub) on novel proper nouns / HP contradictions. Max **one** retry with tighter manifest; **no `codedSceneMove` in story bubble** — STATUS-only delta + forced retry or template slot-fill.

**Replaces:** F3 GM planner; F1 recovery-as-story (if fallback removed from bubble); partial F6 decoupling.

**Files:** `arcDirector.ts`, `buildSealedManifest`, `beatCommitGate.ts`, `useGame.ts`, edge `gm-turn`.

**Risk:** Flash Lite may produce thin/empty prose → need template renderer (#3) as backstop.

**Est. uplift:** story 4–5 / vibe 4–5 / pace 3–4 / Free hook MAYBE on hook turns only.

### #3 — Template beats for high-frequency intents (combat/travel/stall)

**Mechanism:** Classify player intent pre-GM. For **attack, flee, travel-hub, wait-in-rain, talk-stage-N**: render from **typed templates** + slot fill (manifest entities, location label, HP delta receipt). GM Flash Lite only for **low-frequency novelty** (opening, parley twist, quest reveal). Templates owned by BeatContract registry per bible.

**Replaces:** F4 CRAFT ignore for mechanical beats; F6 combat decoupling; F7 partial terminal semantics.

**Files:** new `beatRenderer.ts`, `beatContract` registry, `encounterTerminalFsm`, `choiceCompiler`.

**Risk:** Prose sameness; needs slot variety banks; bigger content authoring.

**Est. uplift:** story 4–6 / vibe 5–6 / pace 5–6 on combat/travel-heavy runs.

### #4 — Structured GM output (JSON beat) — phased

**Mechanism:** GM returns `{ "prose": "...", "entitiesMentioned": ["id1"], "beatDelta": "move|talk|fight|none" }`. Commit prose only if `entitiesMentioned ⊆ manifest.presentIds`. **No harvest of persons from prose.** Phase 1: parse optional JSON block; strip and validate; fallback to #3 template if invalid.

**Replaces:** F2 entirely for cast; reduces F8 scrub surface.

**Risk:** Flash Lite JSON reliability; parse failures; latency.

**Est. uplift:** story 5–6 if JSON compliance ≥80%; else 2–3.

### #5 — Beat graph exhaustion (hub/combat/social FSM)

**Mechanism:** Finite state graph per hub/encounter; each **edge consumed once** until refresh (rest, travel away, encounter clear). `choiceCompiler` emits only **non-exhausted** edges. Fate cannot infinite-loop same Ask/Press edge.

**Replaces:** F5 pad basins; 28c pad spam (180–260 hits).

**Files:** `choiceCompiler.ts`, `choiceEdge`, hub beat records (30a B024 extend).

**Risk:** Dead-end if refresh conditions too strict; content graph authoring.

**Est. uplift:** pace 4–5 / vibe +1; story limited unless paired with #2/#3.

**Recommended 2-week bundle:** **#1 + #2 + slice of #3** (combat attack/flee/clear + hub travel only) on Summoned Pact seed 42 vertical. **Stop committing `codedSceneMove` as GM story** — STATUS + retry or template.

---

## 8. Ask Gemini Pro

Using everything above:

1. **Compare** to Section 7 — agree/disagree per rank; what are we underestimating?
2. **Propose 3–5 stronger paths** (may merge/replace ours). For each: mechanism, replaces, risk, est. uplift, 2-week slice checklist with **file paths**.
3. **Rank** by expected T50 uplift per engineering week (not elegance).
4. **If one thing only** — single recommendation tied to seed-42 failure taxonomy (F1–F10).
5. **Anti-patterns to STOP** — engine behaviors to cease, not patch (e.g. "commit repair prose as GM story", "harvest Title-Case → present[]").
6. **2-week plan** — ordered steps that keep Fate random pick, Flash Lite, Mid writer OFF, client+gm-turn deploy, vitest + readabilityGate green.

### Required output format

**1. Executive summary** (≤200 words)

**2. Ranked interventions (3–5)** — each with: rank, name, mechanism bullets, replaces bullets, risk, est. uplift (story/vibe/pace/free-hook), 2-week slice checklist

**3. Anti-patterns to STOP immediately**

**4. If you only fix ONE thing**

**5. Comparison table**

| Approach | 2-week cost | Uplift | Fits constraints | Keeps Flash Lite |

Rows: **Continue scrub batches (Y)** vs your top 3.

**6. Migration sequence** — weeks 1–2 without breaking live testers

---

## 9. Constraints

**Hard (must respect):**

1. **Mid writer OFF** — no second LLM pass every turn.
2. **No WOF** — separate future project; out of scope.
3. **Fate autoplay / random chip pick** remains valid eval path.
4. **$0 / cheap inference on Free** — Flash Lite primary (`google/gemini-2.5-flash-lite`); Mid Haiku only if explicitly budgeted later.
5. **Client + edge deploy** — browser + `gm-turn` sync path.
6. **No Continuity-Warden critic LLM** — deterministic gates only.
7. **Mobile latency** — ~55–60s mid-game Free budgets tight.
8. **Incremental deploy preferred** — 2-week shippable slices.

**Soft preferences:** Keep opening GM quality (T0–2 asset). STATUS chrome separate from story body. Vitest + `npm run fate-autoplay` + `readabilityGate` → `summary.json` as CI truth.

**Eval commands:**

```bash
npm run fate-autoplay -- --bible summoned-pact --turns 50 --seed 42
# Paste pack → Gemini story + game lenses
# Check summary.json → readabilityGate.pass
```

**Readability gate (Batch U+):** `src/game/readabilityGate.ts` — P0 kinds: stitch-leak, false-arrival, choice-leak, entity-madlib, ui-bleed, quest-tracker, spawn-log. Pass = zero P0. Does **not** detect: combat purgatory, null-delta rain, Free-hook, dialogue treadmill.

---

## 10. Optional attachment note

If John attaches a transcript, prefer the latest:

- `scripts/fate-autoplay/runs/gemini-paste-2026-09-01-t50-batch-w/` (post-V, pre-X fixes)
- Or newest `*_summoned-pact_cold-system_s42` after Batch X re-score (HUD `2026-08-31x`)

Attachment should include: GM story + Options + STATUS + turn numbers. Meta line: Game mode LitRPG, agent cold-system, seed 42, stamp, `[engine fallback ×N]` if present.

**Supporting docs (not required to paste):**

- `docs/bugs/gemini-reviews-2026-09-01/SYNTHESIS-BATCH-*.md`
- `docs/bugs/gemini-reviews-2026-08-27/GEMINI-28C-VS-27W-SYNTHESIS.md`
- `docs/research/manus-big-changes-ingest-2026-08-27.md`
- `.cursor/rules/playtest-notes.mdc`

---

*End of paste block (Sections 1–10).*

---

## Appendix A — Architecture turn order

**Current:**

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

**Gap:** Pre-commit exists but is not **sealed**; harvest **mutates authority** after render.

---

## Appendix B — RRR batch fix inventory (S→X abbreviated)

See `GEMINI-PRO-META-PROMPT-STRONGER-FIXES.md` Appendix C for S→X P0 detail. Key quote chain:

- **Pre-S:** `"Scattered Scale known as 'They'"` · `"the crowd here here"`
- **Post-S:** `"figure 1 priests"` · `"the Ahead"` · numbered Ascend chips
- **Post-T:** `"You reach The Sevenfold Circle under bombardment"` (Lowmarket)
- **Post-U:** `"Rasped and They, remained"` · `"Nothing in West Wall shifts until…"`
- **Post-V/W:** `"you just Scattered Scale"` · `"invite a real move"` · flee fail → travel clear XP
- **Post-X targets:** `"lunged Lowmarket Fence"` · spawn log in body · caught then inspect stall

---

## Appendix C — Key file paths

```
src/game/arcDirector.ts
src/game/beatCommitGate.ts
src/game/beatContract.ts
src/game/choiceCompiler.ts
src/game/encounterTerminalFsm.ts
src/game/narrativeHarvest.ts
src/game/proseWarden.ts
src/game/readabilityGate.ts
src/game/craftBookCompiler.ts
src/game/chromeAuthority.ts
src/hooks/useGame.ts
scripts/fate-autoplay/
supabase/functions/gm-turn/
docs/bugs/gemini-reviews-2026-09-01/
docs/research/pasted/manus-big-changes-2026-08-27/
```

---

## Appendix D — 28a–31x vitest harness names (regression anchors)

`playtest28aArcDirector` · `playtest28bManusSlice` · `playtest28cManusComplete` · `playtest29aScoreBoost` … `playtest31xBatchX` · `playtest31uBatchU` (readabilityGate)

---

*Document version: FULL-RRR-A-TO-X · supersedes STRONGER-FIXES.md for scope; that file remains valid for S→X-only paste.*
