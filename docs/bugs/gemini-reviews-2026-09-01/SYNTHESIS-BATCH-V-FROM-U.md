# SYNTHESIS — Batch V from post–Batch-U Gemini T50 (seed 42)

**Authorized:** John · **Ship stamp:** HUD `2026-08-31v` / BUILD `2026-08-31n` · **Vitest:** `playtest31vBatchV` · **Mid writer:** OFF

## What Batch U fixed (still kept)

- `codedSceneMove` diegetic combat moves; stitch fingerprint + scrub (partial)
- False Sevenfold arrival on real travel only
- Numbered choice strip + commit reject
- Travel starve under live/pending encounter (≥2 travel in 5T)
- Entity mad-libs for Pact-Hunter / Scattered Scale slots

## What Batch U missed (Batch V owners)

| ID | Symptom | Root cause | Batch V fix |
|---|---|---|---|
| **P0-A** | "Rasped" as direction/monster/preposition/cast | GM dialogue verb capitalized (`"…" Rasped, their voice`); `vignetteLock.extractCastFromProse` Title-Case scrape promoted it into cast→`present[]`; SNAPSHOT + `rewriteInvalidReferences` (mark/panel→speaker) amplified collapse | `isDialogueVerbPersonToken`; vignette harvest requires person cue + verb deny; scrub tape patterns; **stop mark/panel→speaker rewrite** |
| **P0-B** | "Rasped and They" as cast | Same harvest path; `They` already pad-denied but vignette `uniqNames` skipped pad/verb checks | `isNonPersonNameToken` in vignette + harvest + `filterChromeFromPresent` |
| **P0-C** | Combat purgatory / little true effect | Attack HP soft-tick existed but NaN-safe incomplete; no STATUS receipt every hit; identical null-delta prose still committed | Harder attack dmg + HP receipt; `detectCombatPurgatoryHard` → commit recycle → `codedSceneMove` with HP |
| **P0-D** | "Nothing in West Wall shifts until…" + travel treadmill | Batch U `codedSceneMove` still emitted meta stake line; truncated `exitHint` recycled opening vault; travel starve only under live stakes | New diegetic banks; fingerprint + scrub meta; travel starve on ≥3 travel/walk in 6T + stake pad refill |
| **P1** | Unearned Tarnished Metal Shard | `<item-gain>` on Check Status / walk-away | `shouldBlockUnearnedOfferGain` + pocket scrub |
| **P1** | "item not in inventory" on Leave | Spurious `<item-use>` / inventory gate on exit pad | Skip item-use + inventory gate on leave/travel |
| **P1** | "the crowd here strength" | Crowd rewrite salad | `scrubEntityMadLibs` |
| **P1** | Truncated "Vault under fire… through t." | `exitHint.slice(0,48)` in codedSceneMove | Removed exitHint embedding |

## Residual

- Flash Lite can still invent capitalized dialogue verbs in raw prose before scrub (scrub catches Rasped family; novel verbs need list growth)
- Free hook still product/content gap until next T50 scores uplift
- Admin Feedback still unmounted
- Fence dialogue treadmill / CK-Salt densify still later

## Next gate

John: re-run T50 seed 42 fate-autoplay + Gemini paste when ready (`npm run fate-autoplay -- --bible summoned-pact --turns 50 --seed 42`).
