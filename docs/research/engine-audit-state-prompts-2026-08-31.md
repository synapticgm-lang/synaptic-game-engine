# Engine audit — state, prompts, narrative control (2026-08-31)

**Scope:** Read-only architecture audit. No implementation, no stamp bump, no commit/push, no WOF.  
**Mid writer:** **OFF** (`writerPolicy.STAGNATION_MID_WRITER_ENABLED = false`). Intentional.  
**Working-tree stamps at audit:** HUD `2026-08-31k` / BUILD `2026-08-31d` (31k is ops/Vercel `autoplayWriter` restore). Last *quality* ship in playtest-notes: critic Batch C+D **31j** (HUD `2026-08-31j` / BUILD `2026-08-31c`).  
**Question:** How well do we prevent hallucination, keep inventory/stats/world memory honest, and control narrative flow — and what should we do next without repeating 27w?

---

## Alias map (this repo)

There is no `GameManager.ts` / `StateStore.ts` / `SystemPrompts.ts` / `LLMService.ts`. Equivalents:

| Alias | Live owner |
|---|---|
| State / turn loop | `src/game/useGame.ts` (`sendAction`, New Game, Continue); `GameState` in `src/game/types.ts` (not a `src/store` package); `saveMigration` / `applyErrorRepairs`; `sceneFacts`; `worldLedger` (factions, clock, caravans) |
| Prompts | `masterPrompt.ts` (hosted assembler) + edge twin; older `systemPrompt.ts` (`buildContextPrompt` still live); `situationPacket.ts` (SNAPSHOT); `fluidProseRails.ts`; `gmVoiceProfile.ts`; `craftBookCompiler.ts` (≤2 `CRAFT:` lines); `callOpeningGm` / `aiService.ts` / `gmProxy.ts` |
| Governance | `qualityGovernance.ts` (integration); `arcDirector.ts`; `choiceCompiler.ts`; `sealedManifest.ts`; `semanticLoopDetector.ts`; `crowdAuthority.ts`; `chromeAuthority.ts`; `hookLock.ts`; `pcNameAuthority.ts`; `encounterTerminalFsm.ts`; `proseWarden.ts`; `intentContract.ts`; `openingEstablishment.ts` |
| Test / play | Josie Pact `docs/bugs/playtest-2026-08-30-josie/` (esp. `WHY-DRIFT.md`); John `6d8e0b1f` `docs/bugs/playtest-2026-08-30-john-here/` + thumbs `docs/bugs/playtest-2026-08-31-thumbs-review/REVIEW.md`; `docs/research/enforcement-crossref-2026-08-31.md`; opening stack + hero-summon tropes; Path A gap-close / critic A–D; Gemini sample under `docs/bugs/gemini-reviews-2026-08-27/`; fate-autoplay `scripts/fate-autoplay/`; playtest-notes `.cursor/rules/playtest-notes.mdc` |

Modes: **LitRPG**, **tabletop (`dnd`)**, **story RPG (`rpg`)**, **PYOA**.

---

## 1. Executive summary (one page)

SynapticGM is **mid-Path A**: code now *commits* many world facts before the writer (ArcDirector, BeatContract, ChoiceCompiler, hook/crowd/chrome/name/combat terminals, sealed manifest). That is the right architecture. 27w proved the opposite — ten mandate modules *around* a planner GM — and Gemini 28c proved receipts without terminals still score ~1/10 on readable play.

**What works (HARD).** Inventory, HP/XP/gold, kit sheet, quest stage, encounter spawn/clear, hook-why, crowd *after first harvest*, chrome-not-a-person, deny-list PC names, clone/collage/atmosphere-reprint, combat last-kill, pad-from-intent / PYOA lock / inspect-exhaust (31h), vignette lock (31j). Code XP + STATUS strip of invented XP. Mid writer stays OFF. Continuity Warden stays classifier-only.

**What still fails in real play.** Josie (`22a4f976`, HUD **30S**) and John (`6d8e0b1f`, 10/10 thumbs down) are short sessions (T8 / T12), not T200 rot. They fail because the **packet lied or left invent axes unlocked**, then **post-GM scrubs mutated nouns** (official → blue panel), then the next SNAPSHOT taught the lie. Specific open axes:

1. **Opening POINTER CARD is authored and stored, never injected** into `callOpeningGm` → live page 1 is place-name + generic isekai + VALUE FLOOR atmosphere. Stitch fallback is *more* card-faithful than the live GM. Hero-summon tropes: deck ~6/10, live sharpness ~1–2/10.
2. **Crowd present without `crowdCount`** at T0 — first page still invents few/group/two (30X locks *after* harvest).
3. **LitRPG CORE IDENTITY = “Modern Integration Earth”** on an isekai bible — cross-bible default fights Guide Book LOCATION LANGUAGE.
4. **VALUE FLOOR 100–180 + PROSE LICENSE “atmosphere is free”** — John thumbs 3/5/9/10 are smell/light essays with no delta. 31e recycle is HARD *after* a same-room reprint; it does not stop page-1 padding.
5. **Wardens vs packet lies** — 30Y/31b closed Place/panel-as-person *when Presence is honest*. Josie’s raw `aiTraffic` shows the writer followed a Presence list that already contained `blue panel` + `Place`. Scrubs made the book worse.
6. **Travel / camera / map L/R** — Josie mosaic → indoor Entry with no leave/reach (31c `cameraLock` owns *new* snaps). John thumb: prose “left”, floor-plan “right”. No owner.
7. **Combat lastKill residual** — 31f/31h closed beast-body + deny-kill + spawn preface. Auto-fight is still **LLM-narrated**; System XP/loot stay STATUS-only; pile/chest can drop. Drought can still attach after a beat that never showed the foe (preface covers the paragraph, not the *feel*).
8. **XP / registration** — look-around skip exists; “study / windows / thoroughly” still paid mini XP. ArcDirector hear-reason on contradicted why is closed (31c/31h). Registration is still STATUS wallpaper, not a ledger stage. P1-3/P1-5 from critic FIX-PLAN still Waiting.

**Context rot.** Memory is already “compact”: last **4** turn summaries + **keyword** retrieve of 4 snippets + one arc line + pins/consequences (`campaignMemory.formatCampaignMemoryForPrompt`). `retrieveMemoriesSmartly` (embeddings) is **defined and unused**. `calculateMemoryBudget` assumes 128k / 8k system — the live master prompt is larger, and SNAPSHOT + rails are **outside** the prune. State is **triplicated** (ground-truth ledger + SNAPSHOT + `buildContextPrompt` Tier 1). Enc. I (T50–200 eviction) is PARTIAL. **Josie/John rot is packet contradiction, not window eviction.** Gemini 300t rot is pad/combat purgatory + scrub collateral, not “forgot the inn.”

**SOFT vs HARD (honest).** Factual continuity is **PARTIAL→HARD**. “Feels like a good book” (story-first, interiority, spotlight, VALUE FLOOR quality) is **SOFT CRAFT** on Flash Lite. CRAFT is the right thinning (≤2 lines, 27w lesson). Flash Lite can still ignore two lines.

**Task 2 in one line.** Next leverage is **closing invent axes the ledger never locked** (wire POINTER CARD; seed crowdCount; bible-split LitRPG DNA; travel/camera remaining; registration stage; persist the packet in `aiTraffic`) — **not** more mandates, not CoVe/step-back, not GM-emitted JSON state, not Mid writer, not a second critic LLM.

**Honest ceiling (unchanged from Manus T6, calibrated to 31j):** one disciplined owner-close batch **4.5–6.5/10** readable play; three batches **7.0–8.5**. 9–10 is not schedulable on Free Flash Lite + no Mid writer.

---

## 2. Task 1 — findings (measures → evidence → verdict)

Status key matches `enforcement-crossref-2026-08-31.md`: **HARD** = ledger/scrub/gate that can reject, rewrite, or commit without trusting Flash Lite. **SOFT** = SNAPSHOT / CRAFT / AUTHORITY / fluid rail. **PARTIAL** = some HARD, residual documented. **MISSING** = no owner.

### 2.1 Ledger-first vs prompt-mandate (Path A / Manus BIG CHANGES)

| Measure | What it is | Evidence | Verdict |
|---|---|---|---|
| 27w ten modules | SNAPSHOT mandates + post-GM scrub | Gemini-09 LitRPG s18: them↓ but 0 combat, gate-queue 95, inspect drip L2 @ T265; Manus T3: GM remained planner | **Superseded.** Do not re-tune as the fix. |
| Path A 28a–28c | ArcDirector pre-GM commit; BeatContract; ChoiceCompiler; eval liveness | Gemini 28c synthesis: combat/crisis *receipts* appear; scores stay ~1/10 — spawn without terminal, pad-blind, branch receipt without lock | **Liveness YES, terminals incomplete** as of 28c. |
| 29a–31j terminals + authority | `encounterTerminalFsm`, sealedManifest, hook/crowd/chrome/name, collage, lastKill, gap-close pads, vignette | Josie WHY-DRIFT (30S): packet lied; 30X–31c owners would have closed most of *her* holes. John thumbs (31d tape): atmosphere, list leak, auto-fight, pad, map L/R — several closed 31e–31j, several still open | **Correct direction. Residuals are uncommitted facts, not missing NEVER-LINES.** |

**Verdict:** Authority inversion is real and should stay the north star. The failure mode is no longer “no ArcDirector.” It is **ArcDirector/packet committing the wrong fact, or committing nothing while SNAPSHOT invites invent.**

### 2.2 SNAPSHOT AUTHORITY / PROSE LICENSE / CRAFT (≤2 lines)

Live shape (`situationPacket.formatSceneSnapshotForPrompt`): compact fact list (location, crowd, presence, exits, props, inventory, encounter, quests, last kill, vignette, weapon) + binding lines (crowd, hook, chrome, camera, vignette) + optional **BEAT DELTA** (look/wait only) + one **AUTHORITY** + **≤2 CRAFT** (or MODE AUTHORITY fallback) + **PROSE LICENSE**.

| Layer | Kind | Honest effect |
|---|---|---|
| Fact bullets | HARD *if* ledger is true | Writer obeys Presence/Crowd when they are specific. Josie: Presence listed panel + Place → writer wrote a person. |
| AUTHORITY | SOFT | 29d diet correctly killed duplicate STAGNATION essays. Flash Lite still ignored recycle on T1 reprint (Josie) and T12 atmosphere (John) until 30Z/31e HARD detectors. |
| CRAFT ≤2 | SOFT + learning boost | Right 27w thinning (`craftBookCompiler`, 48 rules, 12/mode). Boosts from collage/atmosphere/name/pad/hook. Residual: Flash Lite can ignore two lines (playtest-notes 31g/31h). |
| PROSE LICENSE + VALUE FLOOR | SOFT / **anti-owner** on openings | “Atmosphere is free” + 100–180 words *requires* smell/light when the pointer card never arrived. John’s T0/T2/T12. |
| Stagnation HARD @ ≥5 | SOFT mandate in SNAPSHOT | 27w streakMax 2–4; interrupt is prompt-rail unless ArcDirector also commits. |

**Verdict:** SNAPSHOT is the right *shape*. It is no longer “compact” in token terms — governance + binding + CRAFT + license have accreted — but the 29d diet was correct. **Do not add a third AUTHORITY paragraph.** Make the fact bullets true; keep CRAFT at ≤2.

### 2.3 Opening stack (POINTER CARD, crowd, VALUE FLOOR, CORE IDENTITY, name)

Full compile: `docs/research/opening-prompt-stack-litrpg-summon-2026-08-31.md`. Tropes: `docs/research/hero-summon-tropes-vs-synaptic-2026-08-31.md`.

| Axis | Measure | Evidence | Status |
|---|---|---|---|
| POINTER CARD | `buildOpeningSceneMandate` in `openingEstablishment.ts` | **Grep: definition only.** `callOpeningGm` → `callGm` with `(opening)`. `formatCampaignContractForPrompt` omits `pickedHookId`. Stitch *does* use `pickedHookFallback`. | **MISSING wire (P0).** Deck exists (20 SP cards). Live GM never sees it. |
| Crowd without headcount | Seed `crowd: 'present'`, `present: []`, lastBeat “People are present.” | Josie T0 “scattered few” → T1 “group” → T3 “two figures.” 30X locks after harvest. | **PARTIAL.** Opening invent still open. |
| VALUE FLOOR atmosphere | Fluid rails ~100–180 words; “Atmosphere is free.” | John T0/T2/T12; thumbs 3, 5, 9, 10. 31e BEAT DELTA only after look/wait, not opening. | **SOFT.** Encourages essay when card is absent. |
| CORE IDENTITY Earth | `masterPrompt` `MODE_LITRPG`: “Modern Integration Earth…” | SP is isekai. Guide Book LOCATION LANGUAGE fights this. SI bible would want it. | **SOFT / wrong default.** Cross-bible bleed. |
| Name harvest | Covers + `pcNameAuthority` + 31e deny-list + defer play lines | Josie: demand → canned name-ask (30S). John: scout → name-ask; `I'm here` → **Here**. 31c demand-is-play; 31e deny `here`. | **HARD after 31e** for those two bugs. Dummy name before first harvest still possible. |
| Alone invent-crowd | `aloneArrival` + Crowd=none | John’s alone ruin: gate **worked** (no handlers). Name-ask “someone waiting” still fired (cover parser, not crowd). | **HARD** for crowd. Cover path separate. |
| Kit | Sealed Bag; no kit questionnaire | Both saves: clothes + Bag. No invented sword on sheet. | **HARD.** |
| Numbered `1.` in prose | Prompt still asks 3–4 choices; `stripChoiceList` | Josie T0 `1. Scan…`; John thumbs 1, 2, 5, 6. 31c/31h/31j expanded verbs + mid-body + Slip. | **PARTIAL→HARD.** Novel menu shapes may remain. |

**Verdict:** Opening is **over-open on invent axes the ledger does not lock**, and **under-delivers the one artifact meant to constrain page 1**. That is not a product philosophy; it is a wire gap.

### 2.4 Wardens vs packet lies (Place / blue panel)

Josie WHY-DRIFT §3–5 is the canonical case.

| System | Ran? | Outcome |
|---|---|---|
| `extractNamesFromHookText` + pin | Yes | Hook label `Place:` harvested **Place** as NPC. OPENING PIN told the writer Place stays. |
| SNAPSHOT Presence | Yes | `blue panel, handlers, bystanders, Place, Scattered Scale` — chrome + slot as people. |
| FACTION MATRIX | Yes | “They paid for a Pactborn” vs book accident. |
| Raw writer | Followed the packet | “The official, Place… his posture”; “The King’s men”; “The King believes.” |
| `scrubOfficialPlaceholder` / typedEntity | Yes, **won** | official/King/figure → **blue panel**. Book worse than draft. |
| IntentContract retry | Yes | Same planner, another pass. Did not restore demand/flee/why. |
| 30Y chromeAuthority | Not live on her HUD | Chrome never enters `present[]` / talk pads / art PRESENCE. |
| 31b speaker tags | Not live | “states / has need” no longer stay on chrome. |
| 31c faction notes | Not live | `alignFactionNotesToHook`. |

**Verdict:** Wardens are **correct as slip-repair, fatal as planners.** When the packet lies, a stronger scrub makes a *worse* book. Path A rule: **one owner per fact, committed before `callGm`.** Do not add a Continuity-Warden LLM to “catch” this — the packet is the bug.

### 2.5 Anti-repeat / collage / atmosphere-delta

| Measure | Evidence | Status |
|---|---|---|
| 26u/30R whole-beat ≥0.85 clone | Josie T1 = opening paragraph + new ritual — **under the bar**. Novelty tracked `blue` ×8 and did not block. | HARD for near-clones; missed prefix. |
| 30Z leading-sentence collage | Josie T7 = T5 door + T6 ozone + new guard. John T11 reprints T5 dust-mote essay. | **HARD** (strip prefix; retry once if no tail). Short shared phrases ignored. |
| 31e atmosphere reprint | John T12 same-room smell/light, no delta. Thumbs 3, 5, 9, 10. | **HARD** recycle + SNAPSHOT BEAT DELTA after look/wait. |
| CRAFT collage/atmosphere boost | Next-turn ≤2 lines | SOFT. |
| Stall-pad recycle + ChoiceCompiler fingerprints | Josie T8 re-offered T0 chips after recycle ran — legal-edge/hub put them back. 31c/31h pad-from-intent. | **PARTIAL→HARD.** Thin legal-edge banks still re-offer Examine / leftover covers. |

**Verdict:** Anti-repeat is a success story *after* 30Z/31e. Residual is **pad re-injection** and **VALUE FLOOR inviting a first essay** that later detectors then fight.

### 2.6 Combat FSM / auto-fight lastKill

| Measure | John `6d8e0b1f` | After 31f/31h/31i |
|---|---|---|
| Drought spawn on search, no foe in prose | T9 chest/locket → Encounter: Pact-Hunter. Pad Flee/Parley, no fight chip. | Preface `pendingSpawnPreface` + `ensureEncounterSpawnPreface`. Density may still defer. |
| Auto-fight LLM-narrates a beast | T10 “fur and teeth… the beast.” Pact-Hunter is humanoid. | BODY AUTHORITY + `scrubBeastifiedHumanoid`. Still LLM-narrated. |
| FSM not ticked | `runAutoFight` nulled encounter; no `encounterClearedReceipts`. | `commitAutoFightLedger` + `lastKill`. |
| T11 “no kill to loot” | SNAPSHOT Encounter none; no LAST KILL. | `scrubDeniedKill` + Last kill line. |
| STATUS-only XP/loot | Thumb 8: no System kill line in story. | Still STATUS-first (LitRPG story-first is SOFT CRAFT). |
| Chest/locket dropped | Props not harvested that turn. | Harvest into `sceneFacts.props`; old save needs Continue. |
| Engage without encounter | Critic Batch B | 31i: no Engage/Change without live encounter. |

**Verdict:** Terminal **HARD** for spawn/clear/deny-kill/body. **PARTIAL** for “felt like a fight that existed in the room” and System-in-prose. Auto-fight as a second LLM call is an architecture smell (two writers, one ledger) — do not add a third.

### 2.7 Hook lock, chrome, crowd

| Owner | Josie / John | Now |
|---|---|---|
| `hookLock` | Josie T1 accident → T7 pawn; she typed “bought”; ArcDirector paid +45 and sealed pawn. Manifest did not own why. | **HARD** first why wins; 31c skip hear-reason on contradicted why; faction notes align. Modeled NPC *lie* not shipped. |
| `chromeAuthority` | Place / panel person + speaker | **HARD** Presence + speaker + polity-as-person (31i Pellane). Residuals: inspect-panel pads; handlers grammar; writer may still invent “the Pellane” in prose (scrub heals). |
| `crowdAuthority` | few → group → two | **HARD** after first lock. Opening invent remains. |
| `pcNameAuthority` | John **Here** | **HARD** deny-list + display name. |
| `vignetteLock` (31j) | Critic Lowmarket treadmill (not Josie/John) | **HARD** cast/props until hub leave. Writer can still invent a name before harvest. |

**Verdict:** These three (hook/chrome/crowd) are the best Path A proofs in the repo. Keep extending *this* pattern; do not re-prompt them.

### 2.8 HARD vs SOFT vs MISSING (enforcement-crossref, post-31j)

Cross-ref §5 P0-1…P1-8 **shipped in 31h**. Critic A–D shipped 31i/31j. Remaining board:

| Theme | Status after 31j | Residual |
|---|---|---|
| A Names/places/kit/roster | PARTIAL | Opening crowd invent; Title-Case harvest heuristic; ambient weapon (26p) |
| B Ignore input / invent people | PARTIAL | Intent honor still mostly SOFT; demand HARD thin (31h) |
| C Premise / hook spine | PARTIAL | hookLock HARD; CampaignContract thin; POINTER unwired |
| D Samey openings / thin replies | PARTIAL | HARD clone/collage; thin-reply SOFT expand; Mid OFF |
| E Free wall before attachment | PARTIAL | Honeymoon capacity HARD; Gemini Free-hook historically NO; T12 receipt exists (31h); retention bands MISSING |
| F Meta / STATUS leaks | PARTIAL | Known tags HARD strip; novel scaffold possible |
| G Combat/loot/quest vs prose | PARTIAL | Terminals HARD; auto-fight feel + System-in-story SOFT |
| H Custom worlds | PARTIAL | Expert exists; sparse-world compiler MISSING |
| I T50–200 degradation | PARTIAL | Compact SNAPSHOT + keyword retrieve; no full StateTx invalidation |
| J Kid / voice sticky | PARTIAL | Rails SOFT; never-line bank not in proseWarden |
| PYOA theater forks | PARTIAL | Lock→pad HARD (31h); endings unproven |
| NPC first-speech | PARTIAL | Topic/pad HARD; prose tactic SOFT |
| Inspect drip | PARTIAL | Pad drop HARD; Flash may still essay |
| Map essay rooms | PARTIAL | `isAtmospherePlaceName` HARD; L/R camera MISSING |
| Numbered lists | PARTIAL | 31j Slip/bullets; novel shapes |
| Mid writer default | HARD OFF | Intentional |
| Second Continuity-Warden LLM | HARD forbidden | Honored |
| POINTER CARD in live GM | **MISSING** | Highest-leverage opening owner |
| Persist SNAPSHOT in `aiTraffic` | **MISSING** | Josie/John packets reconstructed after the fact |
| Registration as ledger stage | **MISSING** (Waiting P1-5) | STATUS wallpaper |
| Map L/R vs prose | **MISSING** (31h skipped) | John thumb 6 |
| XP audit (study/windows) | **MISSING** (Waiting P1-3) | John thumbs 3, 6 |
| Free retention telemetry by turn band | **MISSING** | Product, not a warden |

### 2.9 Long-campaign context — does “context rot” still happen?

**What the model sees (hosted path):**

1. `buildMasterPrompt` — Critical + **one** MODE DNA block + turn structure + voice + fluid rails + folk + safety + `buildGroundTruthLedger` + `formatFullMemoryBlock`.
2. Memory block: Guide Book rails + `formatCampaignMemoryForPrompt` (summary, personality, **full SNAPSHOT/situation**, last **4** turn summaries, **keyword** retrieve ×4, one arc line, pins ×8, consequences ×5, NPC relationship ×5) + timeline ×12.
3. User `buildContextPrompt`: Tier 1 ground-truth **again** (name/HP/XP/inv/quests), lore cards, last **2** chat beats (500 chars), timeline ×20, `PLAYER ACTION`.
4. Budget: `calculateMemoryBudget(128000, 8000, 200, 4096)` → clamp 2k–32k tokens; prune retrieved then NPC if over `budget*4` chars. **SNAPSHOT and master rails are not in that prune.**
5. `retrieveMemoriesSmartly` (embeddings) — **dead code**. Prompt path is keyword (`word length > 3`).

**Does rot happen?**

- **Yes, but two different rots.**  
  - **Packet rot (T0–T20):** SNAPSHOT contradicts itself or the book. Josie T8, John T12. Window size is irrelevant.  
  - **Eviction rot (T50–200, Gemini 300t):** keyword retrieve returns atmosphere/hub synonyms; pins don’t invalidate; faction/quest gist can drift; pad compilers re-offer exhausted verbs; combat/dialogue stall. Enc. I is real. Hierarchical StateTx + invalidation is **not** live.
- **Duplication is the live token tax**, not “we need a bigger window.” Ledger + SNAPSHOT + Tier 1 + timeline twice + MODE DNA + fluid rails + CRAFT + AUTHORITY + LICENSE.
- **“Dynamic context window” already exists as a number** and does not adapt to Flash Lite’s *effective* attention (it attends to contradictory Presence more than to a 32k retrieve).

**Verdict:** Do not buy context. **Deduplicate and stop lying.** Optional later: wire embeddings retrieve *or* pin-invalidation — after POINTER + crowdCount + packet persist.

### 2.10 Mid writer

`STAGNATION_MID_WRITER_ENABLED = false`. Free = Gemini 2.5 Flash Lite; failover Llama 8B on empty/timeout only; never Haiku. Manus T7 Option 10 = Mid **only after** P0 gates and John cost cap. WHY-DRIFT: a more expensive writer on a lying Presence list still plans the lie.

**Verdict:** Keep OFF as default. List as **optional later**, not this batch.

### 2.11 Per-mode (sample, not a Gemini dump)

| Mode | Live DNA | Gemini / play signal | What Path A owns | Residual |
|---|---|---|---|---|
| **LitRPG** | Story then System; inspect delta; hook-why; Direct/Diplomatic/Solitary pads | 27w s18 inspect farm, 0 combat; 28c combat purgatory T9–300; Josie/John opening/atmosphere/auto-fight | Arc chunks, drought, terminals, XP strip, sandbox floor, craft `litrpg-*` | POINTER + Integration Earth DNA; System-in-prose SOFT; pacing (L2 target) still Waiting INPUT |
| **Tabletop (`dnd`)** | Fair ruling; boxed-text cut; tactics; spotlight SOFT | 27w Aldous/Oskar 300×; 28c Wraith loop + nearby-building scrub | NPC topic FSM; combat terminal; STATUS chrome up | Spotlight/success-stands SOFT; licensed-lore invent SOFT |
| **Story RPG** | Leverage / moral cost; tactic change | Cape 28c Listen/Wait basin; Salt Road 29b Crew Token as NPC (~188 hits); gemini-17 **misfile** (do not use) | Social milestone; topic FSM; vignette lock | Leverage → stage commit PARTIAL; interiority SOFT |
| **PYOA** | Fork lock; no Wait-Wait; crisis delta | 27w Millstone 288×; 28c Buy-time/Call-for-help; receipts without lock | `pyoaBranchLedger` + `eligiblePyoaPadsAfterLock` (31h) | Endings unproven; Flash delay paraphrases |

Fate-autoplay (`scripts/fate-autoplay/`) is Ship A (callGm + wardens + ChoiceCompiler) — **not** a full React `sendAction` clone. Eval gates measure receipts. Gemini measures readable books. **Both scoreboards stay.**

---

## 3. Failure points / context bleeding / pacing

### 3.1 Failure points (ranked by play damage)

1. **Uncommitted invent axes on page 1** — POINTER missing, crowd unlocked, VALUE FLOOR on, wrong MODE DNA. Flash Lite fills with atmosphere and a crowd size. Everything downstream harvests the invent.
2. **Packet lies** — Presence/pin/faction/camera disagree with the book. Writer + warden + ArcDirector *seal* the lie (Josie pawn +45 XP).
3. **Post-GM noun swap as planner** — official→panel. Class D residual whenever allowlists are chrome.
4. **Two writers on one fight** — beat GM + `callGmAutoFight`. Ledger can clear; story can deny or beastify.
5. **ChoiceCompiler as supplement-after-filter** — recycle drops a chip; hub/legal-edge puts a cousin back (Examine the room, T0 Ask what is going on).
6. **Cover parser as turn eater** — demand/scout classified as name-cover (closed for those two; other parseFail paths remain).
7. **XP misalignment** — inspect/study drip vs talk/fight; hear-reason on scout (closed if why contradicted); registration incomplete forever.
8. **Map harvest Title-Case** — atmosphere sentence → room pin → pad. 31f deny helps; L/R camera still missing.
9. **Long-run pad/combat basins** — Gemini 300t. Terminals + vignette + lock→pad reduced the *classes*; Free hook still historically NO.

### 3.2 Context bleeding (not “the window is too small”)

| Bleed | From → into | Why |
|---|---|---|
| Integration Earth DNA | LitRPG MODE → SP isekai opening | One MODE block for all LitRPG bibles |
| Chrome slots | Hook `Place:` / Registration → `present[]` / pin | Harvest + pin before 30Y/31c |
| Faction “paid” | Bible note → FACTION MATRIX → pawn prose | No owner until 31c `alignFactionNotesToHook` |
| Outdoor string vs indoor graph | `currentLocation` Circle vs dungeon Entry | Name-cover re-called opening GM; writer followed floor plan (31c cameraLock) |
| Atmosphere → map | “This chamber hangs heavy” → doorway pin | Title-Case + INTERIOR_ROOM_PIN (31f deny) |
| Kit noun → person | Salt Road Crew Token ~188 hits (gemini-19) | Scrub/pronoun class; 29c killed kit→they; token-as-NPC residual |
| Cross-mode critic | gemini-17 cape + HA bleed scored as Salt Road | Eval/paste hygiene; 31j narration-only exporter helps |
| Timeline ×2 + ledger ×2 | Master memory + user context | Assembler accretion, not a feature |
| Keyword retrieve | “here / panel / dust” → old essays | Bag-of-words >3 chars |

### 3.3 Pacing

| Track | Code | Play / Gemini | Honest |
|---|---|---|---|
| LitRPG L1→L2 | 200 XP (28a; was 300). Arc +45 stage-2. Inspect once-per-evidence. Daily +20 (B045). Look-around skip (30S). | 27w storyfollower L2 @ T265 inspect drip; maxlevel never L2/300t; Free ~20t no level. Josie 0 XP through T6 then **80** on contradicted why. John 162/200 by T12 (combat +45 + study pile). | **Curve moved; reward still misfires on study.** John INPUT on L2-by-T15–25 still Waiting (`litrpg-level-pacing-and-free-hook-2026-08-27.md`). |
| Free T12 hook | ArcDirector + STATUS + `t12HookReceipt` (31h) | Gemini cells historically **Free hook NO** (stall or purgatory at T12) | Receipt ≠ attachment. Measure before adding turns. |
| Combat drought | T8/T15 gates; 31h preface | 27w zero combat; 28c spawn-then-purgatory; John surprise beast | Spawn HARD; *readable fight* PARTIAL |
| PYOA crisis | Branch ledger + wait exhaustion | Delay paraphrase basin | Lock HARD; ending SOFT |
| RPG social clock | Topic FSM + milestone; wait-clock SOFT | Listen/Wait basin | Need leverage → stage commit |
| VALUE FLOOR | 100–180 words every paid turn | John: long empty essays | Pacing *of prose* fights inspect-exhaust |

---

## 4. Task 2 — prioritized recommendations (no code)

Principles: **ledger-first owners over prompt text**; do not dump mandates (27w); no new Continuity-Warden LLM; no Mid writer unless optional later; no WOF; judge trendy techniques against *this* stack.

### P0 — do these; they close invent axes we already authored

| ID | Recommendation | Closes | Why P0 | Why not a prompt |
|---|---|---|---|---|
| **P0-1** | **Wire opening POINTER CARD** into the live GM path (`buildOpeningSceneMandate` or a *thin* SNAPSHOT “HOOK CARD” block: Location / Who / Why / Offer / 2–3 beats). One injection site: `callOpeningGm` / situation packet. Do not paste the whole mandate’s mixed “ordinary street first” LitRPG line as-is — that line is SI, not isekai. | Vague atmosphere summons; trope sharpness 1–2/10; Josie mosaic-without-rite; stitch vs GM fidelity gap | Deck already exists; stitch already honors it; live path is the hole | A new NEVER-LINE “write the card” without the card is 27w |
| **P0-2** | **Seed `crowdCount` (or Crowd=none) from the pointer card / pinned names / alone flag at T0** — lock *before* first GM, not after harvest. Alone already does this. Crowded cards should lock “few (handlers+N)” or “pair”, not “present.” | Josie few→group→two; opening invent residual in 30X | First page is the only page without a harvest | Binding line after invent is too late |
| **P0-3** | **Bible-split LitRPG CORE IDENTITY** — isekai/summon vs Integration Earth vs in-world Wake. One sentence in MODE block from bible family, not a global Earth default. | Cross-bible bleed; SI clothes on Pellane | Cheap HARD DNA; Guide Book already fights this | Another LOCATION LANGUAGE paragraph will lose to MODE |
| **P0-4** | **Persist SNAPSHOT (or a hash + Presence/Crowd/hook/camera gist) on `aiTraffic`** | WHY-DRIFT reconstruction; critic contamination; “what did we tell Flash?” | Debug/eval, not player-facing | Not a mandate |
| **P0-5** | **Travel / camera remaining holes** — 31c `cameraLock` owns indoor snap without travel. Still open vs John: **map L/R vs prose**, pin update on room change, “I said go next room” stay-and-essay (Intent `demand` covers send-back more than *move*). Extend travelAuthority / interior heading, not WORLD MAP AUTHORITY prose. | John thumb 6; Josie class of camera lie | Agency + map trust | Prompt “honor left/right” will be ignored |

### P1 — close half-owners and measurement

| ID | Recommendation | Closes | Why P1 |
|---|---|---|---|
| **P1-1** | **Registration as a ledger stage** (Waiting critic P1-5) — stamp/gift/Appraisal are StateTx, not STATUS wallpaper. Chrome already cannot be a person (31c). | “Registration incomplete” forever; Josie 0-XP feel | Product spine, not a warden |
| **P1-2** | **XP audit** (Waiting P1-3) — treat study/windows/thoroughly as look-around family; keep combat/quest/talk once-per-node. Do not flatten all XP to inspect drip. | John thumbs 3, 6; 27w L2-via-study | Pacing INPUT still needed for L2-by-T15 target |
| **P1-3** | **Auto-fight provenance in the *same* beat** — preface is shipped; still need a visible fight chip *or* a committed spawn line the player sees *before* `[Auto-Fight]`, plus lastKill in story (not only STATUS). Keep one writer for the resolve beat if possible. | Thumbs 8–9 | Don’t add a third LLM |
| **P1-4** | **ChoiceCompiler: grounded-prop pad** (chest/locket in lastBeat/props must appear) and **stop re-injecting exhausted Examine** after filter. 31h dropped many; John T8 had no chest chip. | Option relevance | Ledger already has props |
| **P1-5** | **Packet hygiene / dedupe** — one ground-truth block (SNAPSHOT *or* Tier 1, not both + ledger). Drop unused `retrieveMemoriesSmartly` or wire it; keyword retrieve stays until then. Shrink master MODE box if CORE IDENTITY is bible-split. | Token tax; Flash attending to the wrong copy | This *is* “dynamic context” done honestly |
| **P1-6** | **Free HookArc telemetry by turn band** + keep `t12HookReceipt` in eval. Do not add honeymoon turns until bands say attachment failed. | Enc. E; Gemini Free-hook NO | Measurement |
| **P1-7** | **RPG leverage → stage commit** (extend `npcTopicFsm` / social ledger). Gemini Listen/Wait basin. | Story RPG stall | Already a half-owner |
| **P1-8** | **PYOA ending honesty** — when central question is answered, lock `campaign-ending`; prove in human + eval. Ledger exists; play unproven. | Theater endings | After lock→pad (done) |

### P2 — later / optional / research-only

| ID | Recommendation | Judgment |
|---|---|---|
| **P2-1 Dynamic context window** | Already a budget function with a wrong system-size estimate. **Do not** add a second memory LLM or “always-on 128k dump.” Do **P1-5** first. If still needed: invalidate pins on StateTx; retrieve by *fact id* not keywords. | Honest “dynamic window” = **less duplicate + true facts**, not more tokens. |
| **P2-2 Chain-of-Verification** | Second model pass that checks claims. | **Reject as live path.** Equals Continuity-Warden LLM (T10 #4; ERROR-FIX-LOG). Offline Gemini packs / D9 critic remain research. |
| **P2-3 Step-back prompting** | Extra “what is the principle?” prefix. | **Reject.** Flash Lite already ignores AUTHORITY + two CRAFT lines. Step-back is another mandate. |
| **P2-4 Strict JSON schema for GM state updates** | Ask the writer to emit `{"hp":…,"present":…}`. | **Reject as the source of truth.** That *re-makes the GM the planner* (27w). Tags (`<item-gain>`) already exist and get stripped when they invent. **Do** keep/extend **code-side** StateTx + sealedManifest schemas (machine-checkable receipts). Optional: a *validator* JSON the *client* writes after commit — not the writer. |
| **P2-5 Embeddings retrieve** | `retrieveMemoriesSmartly` exists unused. | Optional after P1-5. Do not block openings on it. |
| **P2-6 Mid writer on stagnation** | Manus Option 10. | **Optional later**, after P0 gates + John cost cap. Never Free default. |
| **P2-7 Full D2 / D9 live critic** | Manus story-craft constitution. | Stay research-only. CRAFT compiler is the live thinning. |
| **P2-8 Expert sparse-world compiler / “why this scene knows this”** | Enc. H. | After flagship modes read as books. |
| **P2-9 Deck gaps vs Google tropes** | Trash-exile, wilds dump, minion bind, etc. | **After POINTER is wired.** New cards will not show up live until P0-1. |
| **P2-10 Admin Feedback mount** | Unmounted. | Ops/chrome, not engine. |
| **P2-11 Free MiniMax Gateway throttle** | Residual 31i/31j. | Ops, not narrative architecture. |

### Ranked reasoning (why this order)

1. **P0-1 POINTER** is the single highest-leverage change because we already paid for the deck and the mandate function. Every opening playtest is scoring “Flash Lite invents a summon,” not “our tropes.”
2. **P0-2 crowdCount** is the cheapest HARD lock that 30X cannot do until harvest — and harvest is too late for page 1.
3. **P0-3 MODE DNA** stops a *system* instruction from fighting the bible. One sentence, bible-keyed.
4. **P0-4 packet persist** makes the next Josie dump *evidence* instead of reconstruction — required to trust any later prompt claim.
5. **P0-5 camera/map** is the remaining agency hole with a thumb and a WHY-DRIFT class; 31c closed the worst snap.
6. P1 items are half-owned or Waiting from critic FIX-PLAN — finish them before new constitutions.
7. Trendy prompt techniques (CoVe, step-back, GM JSON) fail the 27w / T10 tests on *this* stack.

---

## 5. What we should NOT do

| Do not | Why |
|---|---|
| **Mandate pile / 27w sequel** | Ten modules governed around the GM. Flash Lite ignored them. Josie packet already had AUTHORITY + PIN + LICENSE and still drifted. |
| **Mid writer as Free default** | Cost + T10 #5. A better writer on a lying Presence list still plans the lie. Optional later only. |
| **Second Continuity-Warden / CoVe LLM** | Classifier-only Continuity is a project rule. Second critic = eval contamination + spend. Offline Gemini stays offline. |
| **Step-back / “think about the principle” prefixes** | Another SOFT layer. CRAFT already thins to ≤2. |
| **GM-emitted JSON as world authority** | Inverts Path A. Code commits StateTx; writer dramatizes the token. |
| **More NEVER-LINES for Place / panel / Here / beast** | Those classes have owners. Regex theater is how official→panel happened. |
| **New encounter bible expansion before terminal/pad proofs** | T10 #3/#6/#10. 31f–31j are the proofs; finish residuals first. |
| **Embedding-only semantic governance** | Detector without actuator (27w `semanticLoopDetector` lesson). |
| **WOF content in live paths** | Isolated later project. |
| **Treat gemini-17 as Salt Road 29b** | Misfile. Prefer gemini-19 / gemini-23 for RPG. |
| **Claim 8/10** from receipt telemetry | Gemini 28c: liveness ≠ readable book. Honest ceiling 4.5–6.5 one batch. |
| **Wire POINTER by pasting the current mandate verbatim** | Mandate still says LitRPG = “ordinary street first.” Inject the **card**, not the mixed genre lecture. |
| **Start implementation from this file** | Report only. Ship when John asks. |

---

## 6. Bottom line

**Factual continuity is PARTIAL→HARD and should stay ledger-first.**  
**Craft quality is SOFT and should stay ≤2 CRAFT lines.**  
**The opening is the largest remaining authority hole — a card we wrote and did not send.**  
**Context rot in week-1 playtests is packet contradiction, not a small window.**  
**Mid writer OFF. No second critic LLM. No WOF.**

**Chat-ready ask for John:** authorize a P0 owner batch (POINTER wire + T0 crowd lock + bible-split LitRPG DNA + packet persist + leftover camera/map) — not a prompt constitution, not Mid, not CoVe.

---

## Sources (worked, not dumped)

- Play: `docs/bugs/playtest-2026-08-30-josie/WHY-DRIFT.md`, `INGEST.md`; `docs/bugs/playtest-2026-08-30-john-here/INGEST.md`, `MAP-AND-AUTOFIGHT.md`; `docs/bugs/playtest-2026-08-31-thumbs-review/REVIEW.md`
- Research: `enforcement-crossref-2026-08-31.md`; `opening-prompt-stack-litrpg-summon-2026-08-31.md`; `hero-summon-tropes-vs-synaptic-2026-08-31.md`; `path-a-gap-close-2026-08-31.md`; `path-a-critic-batch-ab-2026-08-31.md`; `path-a-critic-batch-cd-2026-08-31.md`; `path-a-josie-authority-2026-08-31.md`; `manus-big-changes-ingest-2026-08-27.md`; `litrpg-level-pacing-and-free-hook-2026-08-27.md`
- Gemini sample: `GEMINI-28C-VS-27W-SYNTHESIS.md`; `gemini-09-litrpg-storyfollower-27w-300t.md`; `gemini-19-rpg-salt-road-29b-300t.md` (not gemini-17 misfile)
- Live: `useGame.ts`, `masterPrompt.ts`, `systemPrompt.ts`, `situationPacket.ts`, `campaignMemory.ts`, `craftBookCompiler.ts`, `qualityGovernance.ts`, `writerPolicy.ts`, `openingEstablishment.ts` (`buildOpeningSceneMandate` unused), `aiService.callOpeningGm`, playtest-notes Open section
- Fate: `scripts/fate-autoplay/README.md`

*No game code changed. Mid writer remains OFF. Do not commit from this audit.*
