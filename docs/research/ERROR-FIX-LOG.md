# SynapticGM Error Fix Log (agent reference)

**Purpose.** Stop re-patching the same symptom. Every recurring playtest failure maps to a **failure class** with one **lasting owner**. Update this file when a class gets a structural fix, not for every HUD stamp.

**Living code:** `src/game/errorRepairWarden.ts` (auto-repair on load/continue) · existing `runWarden` / `proseWarden` (post-GM prose) · `applySaveRepair` (schema) · Continuity Warden MVP is *classifier-only* — see `docs/research/continuity-warden-mvp-spec-2026-08-18.md`.

**Sources:** git history (Aug 2026), `.cursor/rules/playtest-notes.mdc` Done/Open, live event logs.

---

## Failure classes (recurrence → lasting owner)

| Class | How it keeps coming back | Lasting owner | Status |
|---|---|---|---|
| **B. Opening contract** | Alone vs crowd copy; Earth-origin always asked; templated covers; turn meter confusion | `openingStitch.applyOpeningContract` + card decks | **Shipped 20f–20l** — Earth deferred; seed-varied asks; instant stitch; continue grounds room; Circle Blessing unequipped |
| **A. Turn / proxy** | Timeout → “still compiling”; empty GM; Free path dies on first post-open turn | `classifyTurnFailure` + `gmProxy` + `useGame` transport retry | **Shipped 20p + 26a** — auto-retry (2×) + longer first-post-open budget; `"no content"` → empty |
| **C. Quest / journal** | Wave/First Blood leak before open complete; wrong starter text for alone; unlock on journal open | `questPlay` + save repair + `questJournalEnrich` / STATUS dedupe | Partial — alone quest adapt; generic provenance hidden (20l); Focus/Unlocked/Ledger echo collapsed; 26a no-op Perception STATUS noise |
| **D. Continuity / prose** | Nearby-building tautology; perspective slips; canned stubs; invented kit; talk to absent NPCs; prose≠buttons; empty-search→loot; combat invent weapon; atmosphere-as-room; auto-fight deny-kill; mode-craft ignore | `runWarden` + `proseWarden` + `searchContinuity` + `combatAuthority` + `questPlay` place harvest + `craftBookCompiler` + `closedScenePerson` + `sceneContextTail` | **02r** — last-4 tail is this camera / this fight; stale old-room or post-clear steel is fact-close. **02p** role occupancy; **31g** CRAFT compile; **31f** lastKill; **26p** weapons |
| **E. Chrome / HUD** | Stamp vs bug chip; HP/MP squash on ~384px; theme frame over name | `HudLayout` contract + viewport tests | Weak — cosmetic stamps keep “fixing” without layout ownership |
| **F. Hosted art** | Model ID churn; Free blamed for missing key; Milestone fail slab; CORS | `generate-image` + memorable policy | Better; still fragile when OpenRouter renames models |
| **G. Save schema drift** | New fields break old Continue | `repairSaveSchema` / revision bump | Good pattern — extend, don’t fork |
| **H. Deploy / ops** | Build syntax; edge not redeployed; HUD stamp vs CDN / stale tab (Josie 30S) | Checklist + `forceLatest` boot gate (31d) | **Shipped 31d** — one-shot reload vs deployed `sgm-build` / `version.json`; SW + caches cleared, saves kept |

---

## Chronology (condensed — structural fixes only)

### Turn / proxy (Class A)

| When | Symptom | Patch that landed | Why it recurred |
|---|---|---|---|
| 16a / earlier | Cancel/timeout ate player line | Keep bubble + restore draft | Timeout still opaque |
| 16e / 17 | Hung turn / 30s abort | Cancel after 15s; persist last commit | Message still “compiling” |
| 17 playtest | Empty/abort burned capacity | Refund text turns | First post-open still dies |
| 19ak | `forceFreeModel` missing import | Import fix | Model swaps without compile gate |
| 20a | Free → DeepSeek | Catalog change | First real turn after open: compile timeout (20e log) |
| 20e open | “Where am I” / connection drop | Classify toast only | No auto-retry / 30s budget |
| **20p** | Connection drop / first-post-open timeout | Auto-retry ×2 + 75s/55s budgets + exhausted toast | — |
| **26c** | Mid-game Free still timing out at 30s | Default 55s / Free hosted 60s / busy retry copy | DeepSeek cold starts |
| **26i** | Free/DeepSeek cold-start latency | Free writer → `google/gemini-2.5-flash-lite` (John-approved) | Rare Google cold starts remain |
| **29g live** | First chip after name: “That turn did not land” ×2; dump empty | Opening `freeCallRef` ReferenceError + silent stitch; Continue wiped log. `callOpeningGm` + last-session buffer | |

### Opening (Class B)

| When | Symptom | Patch | Why it recurred |
|---|---|---|---|
| Many | Name/clothes mixups | Parsers + tests | Per-bible prompts still static |
| 15y–19w | Same registrar feel | Hook decks / bible openings | Covers still same three questions |
| 19s | Earth city after apartment named | Skip leftover chips | Still always asks Earth by default |
| 20b–20e | Alone + “someone in the scene” | Alone covers + quest adapt | Earth ask + template stack still open |
| 20e open | Copy-paste covers + turn feel | *Noted* | No OpeningContract |
| 20f | Instant stitch | Banks + cards | Continue still used bible `startingLocation` |
| 20k | War camp → cathedral after covers; bag glued to clothes | `resolveLockedOpeningPlace` + kit not concat onto appearance | Class B place lock |
| **30T** | Inspect surroundings → canned “They are still waiting for a name you will own.” | `applyOpeningAnswer` defers look-around to play; pad drops name/origin/kit chips | Cover parse treated inspect as a failed name |

### Quest / journal (Class C)

| When | Symptom | Patch |
|---|---|---|
| 15f–16a era | First Blood / Wave leak | Lock until opening complete; retire leaked saves |
| 20e | Alone still “hear Pellane” | `adaptStarterQuestsForArrival` |
| 20e open | Continue of pre-20e alone save | Soft repair via Error Repair Warden rev bump |
| **26o/30f** | Explore-cell + bearings paid +12 quest-tick and +20 daily | `isLookAroundAction` + bearings-style skip in `sandboxXp` / `dailyMilestoneLedger` |

### Continuity (Class D)

| When | Owner growth |
|---|---|
| Pack 11 / 17 / 19 | IntentContract, claim scrub, prose warden, folk voice, fluid chat rails |
| **26a** | NPC body-part perspective scope; PC-name/chore choice filter; Free English + sleeper rail |
| **26p** | `sceneFacts.searchedEmpty` / emptyContainers + SNAPSHOT/binding; invent-loot scrub on re-search; auto-fight + prose `scrubInventedWeapons` (PC-attributed; sealed kit stays unarmed) |
| **30X** | `crowdAuthority` locks headcount (present people + companions + encounter). Warden rewrites any size-class mismatch (pair ↔ group ↔ few ↔ large), not only hundreds. Harvest writes occupancy; enter/leave required to change. |
| **30Y** | `chromeAuthority` — UI chrome / cover slots (blue panel, Place, Registration, Eye Level) are not people. Strip from `present[]` / pins / harvest; warden rewrites chrome+slot+body-pronoun clauses; talk-to-Place pads drop. |
| **30Z** | Leading-sentence collage: first N sentences / ~40–80 words vs last K GM beats. Strip recycled prefix when tail is a new beat; retry once if no tail. 30R whole-beat ≥0.85 still stands. |
| **31a** | `hookLock` — first committed why-you’re-here (accident / intended / bargain / pawn) persists. SNAPSHOT BINDING + warden + sealedManifest block silent reversals (accident ↛ pawn) unless player/ledger revises. |
| **31b** | `rewriteChromeSpeakerTags` — chrome may hum; never `states`/`says`/`their voice`/`has need`. Reattribute to named person or “the handler” role; `handlers` is not a name slot. |

### Chrome (Class E)

| When | Symptom | Patch |
|---|---|---|
| Many stamps | “Which build am I on?” | HUD + meta stamp |
| 19d / 20e | Frame over name; stamp on bug | CSS hide / icon-only |
| 20e open | HP/MP overlap @ 384px | *Still open* — needs layout owner |
| **26f** | Debug open → “realm fractured” after deploy | Stale Vite `lazy()` chunk (`DebugModal-*.js` 404). `safeLazy` one-shot reload + modal `LazyChunkBoundary` |
| **26l** | Hide text shows title art; Hide toggles undo after remount | `invisible` punched static bg through story panel; 25f clear-ref reset on remount. Opaque flex spacer + sessionStorage cleared-for saveId |
| **29e live** | Hide text = black void; Hide options no-op at opening; saveId flip re-clears | `userSetHideRef`; never key `'opening'` then flip to saveId |
| **29f live** | Hide text hid story; Hide options hid TURN_ASK | Hide text = bottom action box; Hide options = choice chips only |
| **30U live** | Home cannot scroll; Active Save clipped; title floats on art | `html/#root` `overflow:hidden` + `MainMenu` `min-h-screen overflow-hidden`. `.sgm-home` `min-h-0 overflow-y-auto`; opaque `.sgm-home-title-panel` |
| **30V live** | Site-wide no-scroll; HUD “Dark Elf Umb…” dead truncate | Same `#root overflow:hidden`; modal `flex-1` without `min-h-0`. `.sgm-scroll-page` + `.sgm-modal-body`; HUD two-row + tap popover for equipped set |

### Quest / STATUS (Class C)

| When | Symptom | Patch |
|---|---|---|
| 20r / 19c / 26a | No-op Location/Quest Focus / Perception SUCCESS | `suppressNoOpStatusEcho` + filter |
| **26f** | Empty STATUS “No XP or loot changes this turn” | `isEmptyStatusNoiseLine` — omit STATUS chrome when filter empties |

### Art (Class F)

| When | Theme |
|---|---|
| 16g–20c | Cap policy, hosted proxy, fail-visible story, Pro on Mid/High, Free gray |

### Save repair (Class G)

| When | What |
|---|---|
| 19ae | `repairSaveSchema` + revision + toast |
| 20e+ | Error Repair Warden extends revision for alone quest / arrival stamp |

---

## Error Repair Warden — contract

**Not** the Continuity Warden (no LLM classify). This is **deterministic auto-repair + turn recovery**.

1. **On load / import / Continue** — `applyErrorRepairs(state)` after schema repair:
   - Stamp `aloneArrival` from hook if missing
   - Rewrite alone-mismatched starter quest copy
   - Normalize opening gate (`pending` empty ⇒ complete)
2. **On turn fail** — single path:
   - Classify: `timeout` | `network` | `empty` | `rate_limit` | `auth` | `client_bug`
   - Always: refund capacity, restore draft, clear in-flight
   - Up to 2×: auto-retry on `timeout`/`network`/`empty` (backoff; longer proxy budget for first post-open / honeymoon)
   - Toast: human class on fail; “retrying…” during transport retry; exhausted copy if retries die
3. **On New Game** — OpeningContract decides covers (no ad-hoc string patches in `useGame`)
4. **Logging** — `debugLogger` + event-log codes `ERR_*` so playtest exports map to class

When a playtest ticket looks like a prior Done item, **extend the class owner** instead of a new one-off stamp.

---

## Open tickets (as of 2026-08-20e playtest) → class

| Open note | Class |
|---|---|
| HUD still squashed | E |
| Skip Earth-origin at start | B (deferred by 20f; confirm in play) |
| Covers copy-pasted + burn turns | B (mostly shipped 20f+) |
| No response after opening / connection drop | A — **shipped 20p** |

---

## How agents should use this

1. Read Open playtest notes.
2. Map each to a **class** above.
3. Prefer fixing the **lasting owner** (warden / contract / layout).
4. Append a row here only when the class gains structural capability or a new class appears.
