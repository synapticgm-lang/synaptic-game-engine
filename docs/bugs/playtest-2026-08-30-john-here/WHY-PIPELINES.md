# Why the fail-safes missed John `6d8e0b1f`

HUD on this save’s export: **BUILD `2026-08-30w` / HUD `2026-08-31d`**. This is **not** Josie’s stale 30S tab. The pipelines ran. They had the wrong owner or the wrong predicate.

| Tape issue | System that should have stopped it | Why it didn’t |
|---|---|---|
| Character name **Here** before any name ask | `extractGivenName` + OpeningContract harvest | **Wrong owner / too greedy.** `I'm X` treated “why I’m here” as a name give. `NAME_STOP` had you/wait/look but not here/place/system. `characterNameIsGeneric` only matched Adventurer/Survivor/Hero. **Not** a stale-client miss. |
| Admin / transcript shows Here | `cloudSync` slot + `playTranscript` header | **No display filter.** They echoed `character.name`. Map-pin deny existed for **places**, not PC names. |
| Canned “still waiting for a name” after `i. Here` | 30T inspect-defer + 31c demand≠name | **Predicate too narrow.** Only look-around and send-me-back skipped `parseFail`. A “nothing of use / move rooms” line was treated as a failed name cover. |
| Inspect → more atmosphere, not a name-ask | 30T `isLookAroundAction` defer | **Did run.** T2 inspect correctly deferred. Residual: later scout verbs did not. |
| T0/T2/T11/T12 smell-light essays | 30S MODE AUTHORITY + NO RECYCLE + 30Z leading collage + 27w semantic loop | **Mandate-only + too late / wrong similarity.** AUTHORITY is prompt rail (Flash Lite ignored it). 30Z needs sentence Jaccard ≥0.68 — T12 rephrased the same room so it missed. 30R whole-beat ≥0.85 missed “new weather words.” Semantic loop counts **player** inspect repeats (escalation mandate), it does not reject GM atmosphere reprints. |
| T11 reprints T5 dust-mote threshold after combat | 30Z prefix collage | **Should have hit** (near-identical first sentence) if T5 was still in the last-8 GM window. Either the tail (“no kill to loot”) counted as new content so the prefix was kept after a weak strip, or the loot retry (`collageReject: false`) recommitted the essay. Atmosphere-delta now owns the same-room case. |
| Numbered `1.` in opening prose | `stripChoiceList` (31c) | **Too late / opening path.** 31c strips singleton Scan lists; T0 still leaked `1. Carefully examine…` on this stamp. Residual. |
| Reason-heard +45 / daily +20 on “study the space” | ArcDirector + 30S unearned look-around XP skip | **Wrong owner.** `isLookAroundAction` skips bearings XP; “study the space for any sign of who was here” was treated as a landmark/quest tick + freeT12 hook. Residual. |
| Skirmisher on a wood-pile search | ArcDirector hub skirmish / B043 | **Did run (by design).** Combat drought force, not a name/atmosphere bug. |
| Choice pads recycle Examine / Wait / doorway-to-essay-title | ChoiceCompiler + 30R stall recycle | **Partial.** Stall filter drops last-pad waits; “Examine the room” came back T11→T12. Residual. |
| Chrome / crowd / hookLock | 30Y / 30X / 31a | **Not on this tape.** Alone ruin; no Place-as-NPC; no why-flip. |

## What 31e locked

1. **`pcNameAuthority`** — site-wide deny list (here / there / place / now / wait / look / system / panel / registration / circle / you / player / unknown / n/a + map-pin deny: Eye Level, Your Palm, …). `extractGivenName`, harvest, small-model answers, and `applyKindToState` will not lock those. Play lines that are not an explicit name-give **defer to play** (no canned name-ask).
2. **Continue repair rev 6** — if `character.name` (or `answers.name`) is deny-listed, revert to `Unknown Survivor` and drop the answer.
3. **Admin / slot / transcript** — `displayAdventurerName` never shows a deny-list token.
4. **Atmosphere reprint** — same-room smell/light essay with no new NPC tactic / fact / travel / cost is `rejectClone` (all modes). After look/wait, SNAPSHOT adds one **BEAT DELTA** line.

Mid writer stays OFF. No Continuity-Warden LLM.
