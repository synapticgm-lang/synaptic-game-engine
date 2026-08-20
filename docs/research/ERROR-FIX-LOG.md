# SynapticGM Error Fix Log (agent reference)

**Purpose.** Stop re-patching the same symptom. Every recurring playtest failure maps to a **failure class** with one **lasting owner**. Update this file when a class gets a structural fix, not for every HUD stamp.

**Living code:** `src/game/errorRepairWarden.ts` (auto-repair on load/continue) · existing `runWarden` / `proseWarden` (post-GM prose) · `applySaveRepair` (schema) · Continuity Warden MVP is *classifier-only* — see `docs/research/continuity-warden-mvp-spec-2026-08-18.md`.

**Sources:** git history (Aug 2026), `.cursor/rules/playtest-notes.mdc` Done/Open, live event logs.

---

## Failure classes (recurrence → lasting owner)

| Class | How it keeps coming back | Lasting owner | Status |
|---|---|---|---|
| **B. Opening contract** | Alone vs crowd copy; Earth-origin always asked; templated covers; turn meter confusion | `openingStitch.applyOpeningContract` + card decks | **Shipped 20f** — Earth deferred; seed-varied asks; instant stitch |
| **A. Turn / proxy** | Timeout → “still compiling”; empty GM; Free path dies on first post-open turn | `TurnRecovery` + `gmProxy` | Partial (classify toast). Need auto-retry |
| **C. Quest / journal** | Wave/First Blood leak before open complete; wrong starter text for alone; unlock on journal open | `questPlay` + save repair rules | Partial (lock during opening, alone quest adapt). Need: auto-repair mismatched starter on Continue |
| **D. Continuity / prose** | Nearby-building tautology; perspective slips; canned stubs; invented kit; talk to absent NPCs | `runWarden` + `proseWarden` + ledger | Active; keep extending detectors, not one-off prompt lines |
| **E. Chrome / HUD** | Stamp vs bug chip; HP/MP squash on ~384px; theme frame over name | `HudLayout` contract + viewport tests | Weak — cosmetic stamps keep “fixing” without layout ownership |
| **F. Hosted art** | Model ID churn; Free blamed for missing key; Milestone fail slab; CORS | `generate-image` + memorable policy | Better; still fragile when OpenRouter renames models |
| **G. Save schema drift** | New fields break old Continue | `repairSaveSchema` / revision bump | Good pattern — extend, don’t fork |
| **H. Deploy / ops** | Build syntax; edge not redeployed; HUD stamp vs CDN cache | Checklist + stamp discipline | Process, not warden |

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
| 20e open | “Where am I” no reply | *Noted* | Class A not owned |

### Opening (Class B)

| When | Symptom | Patch | Why it recurred |
|---|---|---|---|
| Many | Name/clothes mixups | Parsers + tests | Per-bible prompts still static |
| 15y–19w | Same registrar feel | Hook decks / bible openings | Covers still same three questions |
| 19s | Earth city after apartment named | Skip leftover chips | Still always asks Earth by default |
| 20b–20e | Alone + “someone in the scene” | Alone covers + quest adapt | Earth ask + template stack still open |
| 20e open | Copy-paste covers + turn feel | *Noted* | No OpeningContract |

### Quest / journal (Class C)

| When | Symptom | Patch |
|---|---|---|
| 15f–16a era | First Blood / Wave leak | Lock until opening complete; retire leaked saves |
| 20e | Alone still “hear Pellane” | `adaptStarterQuestsForArrival` |
| 20e open | Continue of pre-20e alone save | Soft repair via Error Repair Warden rev bump |

### Continuity (Class D)

| When | Owner growth |
|---|---|
| Pack 11 / 17 / 19 | IntentContract, claim scrub, prose warden, folk voice, fluid chat rails |

### Chrome (Class E)

| When | Symptom | Patch |
|---|---|---|
| Many stamps | “Which build am I on?” | HUD + meta stamp |
| 19d / 20e | Frame over name; stamp on bug | CSS hide / icon-only |
| 20e open | HP/MP overlap @ 384px | *Still open* — needs layout owner |

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
2. **On turn fail** — single path (to implement fully next ship):
   - Classify: `timeout` | `network` | `empty` | `rate_limit` | `auth` | `client_bug`
   - Always: refund capacity, restore draft, clear in-flight
   - Once: auto-retry on `timeout`/`network` (backoff)
   - Toast: human class, not “still compiling”
3. **On New Game** — OpeningContract decides covers (no ad-hoc string patches in `useGame`)
4. **Logging** — `debugLogger` + event-log codes `ERR_*` so playtest exports map to class

When a playtest ticket looks like a prior Done item, **extend the class owner** instead of a new one-off stamp.

---

## Open tickets (as of 2026-08-20e playtest) → class

| Open note | Class |
|---|---|
| HUD still squashed | E |
| Skip Earth-origin at start | B |
| Covers copy-pasted + burn turns | B (+ A UI for meter) |
| No response after opening | A |

---

## How agents should use this

1. Read Open playtest notes.
2. Map each to a **class** above.
3. Prefer fixing the **lasting owner** (warden / contract / layout).
4. Append a row here only when the class gains structural capability or a new class appears.
