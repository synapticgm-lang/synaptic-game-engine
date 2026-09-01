# FIX-PLAN — Gemini Summoned Pact T300 (post Batch F) → Batch G

**Date:** 2026-09-01  
**Source:** `scripts/fate-autoplay/runs/morning-review-2026-09-01/gemini-replies/summoned-pact-T300__story-and-game__gemini-pro-reply.md`  
**Run:** `2026-09-01T09-17-25-216Z_summoned-pact_cold-system_s102` (BUILD `2026-08-31i` / HUD `2026-08-31q`)  
**Scores:** story **1** · vibe **1** · pace **1** · Free hook **NO** · pass **false**  
**Policy:** Root owners = ChoiceCompiler / encounter FSM / stub bans / inventory exhaustion. **Not** more CRAFT / prose rule piles. Mid writer **OFF**. No overnight restart.

**Product bar:** Fate-pick every turn for 300 turns must still read as a book *and* feel like a game (stakes, exhaustion, combat you cannot ignore). Novel score rises when the pad only offers real next beats and committed prose never contains director chrome.

---

## Score vs prior SP Gemini

| Gate | Morning T50 (s105, pre E/F) | Post–Batch F T300 (s102) |
|------|-----------------------------|---------------------------|
| Story | 1 | **1** (flat) |
| Vibe | 2 | **1** (worse) |
| Pace | 1 | **1** (flat) |
| Free hook | NO | **NO** |
| Pass | false | **false** |

Batch E/F closed *named* T50 symptoms (verbatim “moment has not moved on”, location amnesia phrasing, drought “already on you”, same-room essay HARD, CRAFT-ignore stitch, parley success ledger). T300 still fails because the **engines that feed those symptoms** stayed broken: director strings commit as story, combat pad lock has holes + FSM auto-victory on idle, crate is not an exhausted container, and the “replacement” stall stitch is itself unreadable.

---

## Why E/F still failed at T300 (do not re-patch the same layer)

| What E/F tried | Why T300 still failed |
|----------------|------------------------|
| **E** `stripChoiceList` continue/duck/orphan `4.` / “What do you do? touch” | Mid-paragraph `1. Attempt to examine…` still lands; Flash Lite keeps emitting menus. Stripping is necessary but not the root — pad should not teach the writer that options live in prose. |
| **E** ban verbatim stall + restititch | Replaced chrome with `stitchCommitDelta` → **“X holds the beat in Y — a glance, a breath…”** which Gemini now cites as the dominant stub (T2, T14, T20–21, T33–36…). Ban list never included this template. |
| **E** inspect/wait/scout treadmill ≥3 interrupt | Scout returns after interrupt; under combat Scout/Open-crate still legal; interrupt does not exhaust **crate** as a container. |
| **F** same-room essay HARD + CRAFT-ignore stitch | When gate rejects, repair path *commits* the holds-the-beat stitch → Fate farm of stubs. CRAFT lines in SNAPSHOT also echo (“telegraph…”, director notes) when writer copies rails. |
| **F** drought invent scrub + preface | `autoFightSpawnPreface` **is** the leak: “no debris, no prior cast” / “telegraph first, then steel” are committed narration (`combatAuthority.ts`). Scrubbing debris invent does not remove director English. |
| **29a/31h combat pad lock** | Blocks travel/look-around/generic inspect — **not** `Open the crate` / `Scout for danger`. Chest/crate even sit in the combat *allow* exception list. |
| **26p empty-search** | `normalizeSearchTarget` maps bag/debris/here — **not** `crate`/`chest`. `namedPropPadsFromBeat` keeps offering Open the crate whenever props/lastBeat mention crates. Loot `<item-gain>` bird/locket never records `emptyContainers`. |
| **29a `maxEngagedTurns` (8)** | Every non-attack turn still increments `engagedTurnCount`; at cap `resolveForcedOutcome(..., 'max_engaged')` → **victory + XP**. Idle Open-crate / Scout farms clear the threat. |

---

## Batch G P0s — root owners + structural fixes

### G1 — Director chrome never commits as story  
**Root owner:** `openingHooks` / `openingPointerCard` + `combatAuthority.autoFightSpawnPreface` (+ hard reject in `beatCommitGate` / sealed-manifest stub ban)  
**Not:** more CRAFT lines telling the writer “don’t leak.”

**Structural fix (1–3):**
1. Move writer-facing alone beats out of narratable `beats[]` (e.g. `summonedPact.ts` “Do not invent a welcoming NPC…”) into `forbid` / internal rails only — never stitch or SNAPSHOT as prose.
2. Rewrite drought preface to **diegetic only** (footsteps, silhouette, scrape) — drop “no debris, no prior cast” and “telegraph first, then steel.”
3. Hard-ban commit of director fingerprints (`Do not invent`, `telegraph first`, `no prior cast`, `FORBID:`, `CRAFT:`, `AUTHORITY:`) → one diegetic recover or FAIL empty (Class A pattern), never leave the string in the book.

**Fate / novel / vibe:** Opening page 1 reads as fiction; drought still *shows* the foe without sounding like a design doc. Game vibe kept because the threat still enters on a ledger turn.

**Batch:** **G**

---

### G2 — Option bleed: strip is backup; pad is authority  
**Root owner:** `choiceCompiler` / ChoiceEdge (offer only) + `stripChoiceList` as last firewall  
**Not:** another CRAFT “never number options.”

**Structural fix:**
1. Keep/harden `stripChoiceList` for mid-body `1. Verb…` (already partially there) — treat as **firewall**, not the product.
2. Ensure ActionBar / fate pad never echoes last GM numbered lines back as chips that re-teach the menu format.
3. Optional: if prose still contains a numbered offer after strip, treat as commit-gate reject once (same as sealed stub), not a soft keep.

**Fate / novel / vibe:** Book text stays chapter prose; agency lives on chips. Game vibe unchanged — chips remain the interact layer.

**Batch:** **G**

---

### G3 — Ban / diversify `holds the beat` stitch (stub ban)  
**Root owner:** `beatCommitGate.stitchCommitDelta` + `isVerbatimStallStub` / sealed-manifest  
**Not:** CRAFT anti-stall sentences.

**Structural fix:**
1. Add `holds the beat` / `a glance, a breath, a cost still unpaid` to **verbatim stall ban** (same path as Batch E’s moment-has-not-moved-on).
2. Replace stitch bank with **rotating diegetic deltas** tied to ledger: exit name, prop once, present person once, or honest exhaustion (“the crate is empty”) — never mad-lib `{present} holds the beat in {loc}` with `bystanders` / `It`.
3. Cap consecutive engine stitches: after N stubs in a row, ChoiceCompiler **must** force travel/talk/quest pad (and Fate will pick a real beat).

**Fate / novel / vibe:** Failures become one concrete next move instead of a template chorus — book score climbs without Mid writer.

**Batch:** **G**

---

### G4 — Infinite crate loot → container exhaustion + inventory conservation  
**Root owner:** `searchContinuity` / `choiceCompiler.namedPropPadsFromBeat` / inventory conservation on `<item-gain>`  
**Not:** prose “don’t find the bird again.”

**Structural fix:**
1. Extend `normalizeSearchTarget` / open-container intents: `crate`, `chest`, `box`, `barrel` → stable keys; on first open (loot or empty), `recordEmptySearch` / `emptyContainers`.
2. Drop `Open the crate` from pad when that key is exhausted (`inspectTargetExhausted` already almost does this — wire crate open to the ledger).
3. Block duplicate bird/locket grants: same container + same item name within location → scrub `<item-gain>` / refuse second award (inventory conservation).

**Fate / novel / vibe:** Fate cannot farm an economy break; scarcity returns. Game vibe *improves* (loot matters again).

**Batch:** **G**

---

### G5 — Ignorable combat / auto-clear while Open crate  
**Root owner:** `choiceCompiler` combat pad lock + `encounterTerminalFsm.tickEncounterTerminal`  
**Not:** CRAFT “stay in the fight.”

**Structural fix:**
1. **Pad lock:** while `isEncounterEngaged`, allow only fight / flee / parley / position / grounded threat inspect — **drop** Open crate, Scout, Wait, travel, merchant. (Fix the regression hole that left crate/scout legal.)
2. **FSM:** idle / loot / scout intents must **not** count toward `maxEngagedTurns` victory; only attack (and maybe successful flee/parley) advance the clear clock. Cap idle under threat → foe pressure receipt or forced fight pad, **not** free XP victory.
3. `max_engaged` forced outcome should not award full clear XP for “opened crates until the timer expired.”

**Fate / novel / vibe:** Fate under threat produces combat chapters; stakes return. LitRPG vibe requires that ignoring a Void-Touched Scavenger is dangerous, not a loot AFK.

**Batch:** **G**

---

### G6 — Wait/Scout stall (P1, same batch if cheap)  
**Root owner:** `choiceCompiler` + discovery/loiter exhaustion (already partially E)  
**Structural fix:** After interrupt, **remove** Scout/Wait from legal edge until location or intent changes; pair with G3 so rejected scout beats cannot re-emit holds-the-beat.

**Batch:** **G** (ship with G3–G5)

---

## Out of scope this batch (do not sneak in)

- Mid writer ON / overnight curriculum restart  
- More `craftBookCompiler` rules or SNAPSHOT CRAFT volume  
- CK / Salt / Thornferry Gemini (still separate; can share G1/G3/G5 owners once SP passes)  
- Admin Feedback mount  

---

## Suggested ship order (single Batch G)

1. **G5** combat pad + FSM idle (biggest game-vibe / Free-hook lever)  
2. **G4** crate/container exhaustion  
3. **G3** holds-the-beat stub ban + stitch bank  
4. **G1** director preface + bible beat hygiene  
5. **G2** strip/commit firewall residual  

Vitest: new `playtest31rBatchG` (or next letter) covering: engaged pad drops Open crate; idle ticks do not auto-victory with XP; crate empty after one open; stitch never emits “holds the beat”; preface has no “telegraph first” / “no prior cast”; opening alone card does not narrate “Do not invent…”.

Redeploy when shipping: client + `sync-gm-edge-shared` + `gm-turn` (SNAPSHOT/preface paths).

---

## Ask John

**Ship Batch G?** Plan only until you say go. No push.
