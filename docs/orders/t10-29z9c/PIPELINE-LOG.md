# Post-writer pipeline log — seed 71, 10 turns × cursed-keep / salt-road-heist / summoned-pact

A cut is a final line that drops or changes words the writer wrote in a line the gate passed, or a quote cut in half.
Checker: `node docs/orders/t10-29z9c/checkDrafts.cjs <folder>` (lists CUT with the step that lost the words, HALF-QUOTE, and GATE drops to read by hand).
Tester change (no game behaviour): `fateAutoplay` now writes `writerRaw` (full reply) and `stageTrace` (text after each post-writer step) to `turns.jsonl`.

## Check 0 — baseline (`2026-10-01T06-12-*`, before this log)

5 cuts + 1 half-quote. cursed-keep 15/18, salt-road 23/24, summoned-pact 20/20 clean lines whole.

## Fixes before check 1

| # | What broke (live line) | File | Change |
|---|---|---|---|
| 1 | cursed-keep T3 13c salvage dropped `"Name's Wenna.` and kept `Kept this house … is."` (half quote) | `src/game/ledgerNounObey.ts` | sentence drop uses the quote-aware `splitProseSentences` |
| 2 | cursed-keep T2/T3 "…asked the innkeep straight…" / "The innkeep glanced…" failed `unbound-animate` though `cast:the-innkeep` was in the refs | `src/game/tokenProse.ts` | unbound-role test runs after masking ref displays and known names, same as the capital test |
| 5 | salt-road T9 "…with the Crew Token riding in their pocket…" failed `capital` | `src/game/tokenProse.ts` (`knownProperNames`), `src/game/ledgerNounObey.ts` | the player's inventory names count as held names in the line gate and the ledger-name check |
| 3, 4 | cursed-keep T6/T10/T11 kit lines and salt-road T6 travel line passed the gate and vanished | — | owner unknown (old runs had no stage trace); check 1 names the step |

Tests: `src/game/postWriterKeepsDraft.test.ts` › `29z9d — seed-71 check lines`.

## Check 1 — `check-1/` (06:28 set; an identical 06:27 set also ran by mistake, kept in `check-1-dup-0627/`)

No half-quote (fix 1 held). Innkeep and Crew Token lines passed the gate (fixes 2, 5 held).
**Still cut: 6** (cursed-keep 3, summoned-pact 3), plus 6 sentences dropped as repeats of the last three beats.
The checker now counts a line as a repeat (not a cut) only when the recycled-sentence trim dropped the whole sentence
and it overlaps a sentence from the previous three beats by ≥60% of its words; every one was read by hand (near-verbatim restatements).
The 06:27 set had 9 more cuts from the same owners below.

## Fixes before check 2

| What broke (live line) | File | Change |
|---|---|---|
| cursed-keep T4/T10 "…the pommel of the Worn Iron Shortsword…" deleted (owner 3) | `src/game/factLocks.ts` | the invented-sword lock tested `/\bsword\b/` on item names, so a held Shortsword read as no sword; it now asks whether any held item is a sword |
| salt-road T5 "reading each way out ~~before committing~~ to one"; summoned-pact T10 same | `src/game/proseWarden.ts` `scrubSaferSceneMeta` | removed the bare `before committing` / `if none is present` deletes; the full canned scan-chip phrases are still removed |
| summoned-pact T7 killing blow and T8 Idra Fenwick's nod replaced by "The fallen the thugs lies where you left them." | `src/game/combatAuthority.ts` `matchesLastKillName`; `src/game/proseWarden.ts` `scrubDeadFoeReengage`; callers in `warden.ts`, `fateAutoplay.ts`, `useGame.ts` | a token matches the kill only as whole name words (the old `name.includes(token)` matched "the"); the rewrite skips the turn the engine committed the kill (`currentTurn`); quote-aware split |
| salt-road T5/T6/T9 "The Salt Road Waystation still lay ahead…", "The Back streets ran narrow…" deleted (owner 4) | `src/game/ledgerNounObey.ts` `inventedPersonNamesNotOnAllowlist` | held names are masked before the First-Last scan; a grammar word ("The") never starts a person name (scan resumes at the next word, so "The Orel Vane" is still caught) |
| cursed-keep T2 "from ~~the stranger~~ the innkeep", T3 "~~this place~~ Greyhollow Inn"; summoned-pact T11 "~~a figure~~ Wall Sergeant" | `src/game/qualityGovernance.ts` `applyGovernanceToProse` | on writer turns (`keepWriterProse`) the stranger / this-place reference rewrite is a note only — matches the existing 28l rule |
| summoned-pact T9 "~~The back~~ The streets gave…", "toward ~~The~~ Weighing Cup" | `src/game/mentionVariety.ts` | short-form repeats match the label as the ledger spells it (paint), not the writer's lowercase words; the `the … The` glue repair skips a gap that holds a preposition |

Tests: same file, 7 more cases from these lines. vitest full run before check 2: 1 new failure (`playtest28v3ArticleRepair` two-adjective glue) from the first glue change — fixed by the preposition rule, now passing.

## Check 2 — `check-2/`

**Cut: 1** (was 6). Every check-1 cut held. Repeats dropped: 6.
Remaining cut, new owner: salt-road T7 "Whatever Brannoc wanted, he had not yet decided whether Jax was worth the asking." deleted at `applyProseWarden`.

## Fix before check 3

| What broke (live line) | File | Change |
|---|---|---|
| mention polish shortened "Brannoc Rudd" to "Brannoc"; the invented-name scan then read "Whatever Brannoc" as a new First Last name and deleted the sentence | `src/game/ledgerNounObey.ts` `inventedPersonNamesNotOnAllowlist` | every capitalized word of a held name is held too (the pipeline itself writes those short forms); an unheld name next to it is still caught |

Test: `salt-road T7 check 2: the short form of a held name is not an invented person`.

tsc (app config) 601, baseline 601. vitest 116 failed; new vs `vitest.json` 0, new vs `vitest-29z9b.json` 0.

## Check 3 — `check-3/`

**Cut: 1** (same count as check 2, different line). The check-2 Brannoc cut held. Repeats dropped: 3.
Remaining cut: salt-road T10, writer line `Jax came off the @t2 run of crooked streets and into @t1…` where `@t2` is the actor ref Hobb Dunmore.
The writer put a person token in a place slot; the gate passed it (`place:ok`). Mention polish (`repairLabelArticles`) then dropped "the" before the person name:
"came off ~~the~~ Hobb Dunmore run of crooked streets". The draft line was already wrong before the pipeline; the article drop changes one writer word without fixing it.
John's call: the gate owns it.

## Fix before check 4

| What broke (live line) | File | Change |
|---|---|---|
| salt-road T10 "the @t2 run of crooked streets" (`@t2` = Hobb Dunmore) passed the gate, then polish dropped "the" | `src/game/tokenProse.ts` `classifyTokenLine` | a writer article right before a person token whose name is capitalized fails the line (`article-person`); roles ("the innkeep") and a bare name still pass. The line is a GATE drop, not a post-writer edit |

Test: `salt-road T10 check 3: a named person token after an article fails the gate`.

## Check 4 — `check-4/`

**Cut: 4** (worse than 1; the writer's drafts differ every run, and these are owners the earlier drafts did not touch). Salt-road clean 39/39; the T10 article line did not recur.
- cursed-keep T6 "the two hours passed" → "the two moments later" at `runWarden`.
- summoned-pact T7 "theirs an hour ago" → "theirs an moments later" at `runWarden`.
- summoned-pact T7 "The last thug swung wild, … put him down with two hard strikes to the ribs." deleted at `applyProseWarden` (kill turn). Not the check-1 dead-foe owner: a probe of `scrubDeadFoeReengage` with the same kill keeps it. Owner depends on run state; not yet named.
- summoned-pact T3 "Neither the Pellane scouts … nor the Ash pickets … turned their heads at the voice…" deleted at `finishCommittedProse` but not classed as a repeat. Owner not yet named.

## Fixes before check 5

| What broke (live line) | File | Change |
|---|---|---|
| morning clock constraint swapped "hours passed" / "an hour ago" for "moments later" in writer prose | `src/game/warden.ts` `runWarden` (+ callers `fateAutoplay.ts`, `useGame.ts`) | new `keepWriterProse` option, set on writer turns the same way as governance: constraint hits are notes, words stay |
| tester could not see which warden scrub deleted the T7 line | `src/game/proseWarden.ts`, `fateAutoplay.ts` | tester-only `trace` callback after each scrub; recorded as `applyProseWarden:<scrub>` in `stageTrace` |

Test: `cursed-keep T6 / summoned-pact T7 check 4: the morning clock is a note on a writer turn, not a word swap`.

## Check 5 — `check-5/`

**Cut: 1.** Salt-road 35/35 and summoned-pact 35/35 kept every clean line. The check-4 time swaps did not recur; the T3/T7 drops did not recur (owners still unnamed).
Remaining cut: cursed-keep T8 "glanced once at Jax's ~~sword~~ fists" at `runWarden`.
Owner: `src/game/warden.ts` builds the prose-warden context with `groundedWeapons: undefined`, so `scrubInventedWeapons` (`searchContinuity.ts`) treats the held Worn Iron Shortsword as invented.
Same class as owner 3 (the player's own gear), in a second file. Not fixed — stop rule reached.

## Stop

Checks 3, 4 and 5 did not beat check 2's single cut (1, 4, 1). Stopped per the order. Cut counts: check 0: 5 + 1 half-quote → check 1: 6 → check 2: 1 → check 3: 1 → check 4: 4 → check 5: 1.
tsc (app config) 601, baseline 601. vitest 116 failed; new vs `vitest.json` 0, new vs `vitest-29z9b.json` 0.

## Fix after the stop (John, 08:01): check-5 owner only

| What broke (live line) | File | Change |
|---|---|---|
| cursed-keep T8 "glanced once at Jax's ~~sword~~ fists" | `src/game/warden.ts`; `src/game/searchContinuity.ts` `groundedWeaponNames` | `runWarden` passes `groundedWeaponNames(state)` instead of `undefined`; a held item with `itemType: 'weapon'` counts as a weapon (the name test `\bsword\b` missed "Shortsword") |

Test: `cursed-keep T8 check 5: the player's held shortsword is not rewritten to fists` (unarmed control still scrubs).
The tester-only per-scrub trace was removed from `proseWarden.ts` and `fateAutoplay.ts`.

## Check 6 — `check-6/` (one check, then stop)

**Check-5 cut gone:** no line rewritten to fists; "the Worn Iron Shortsword at their hip" kept in cursed-keep T6 and T8.
The two unnamed check-4 drops did not show up. Other cuts this run (4), left as ordered:
- cursed-keep T7 "The chain on Keep Gate was thick and old, and no one here had yet said what they wanted…" deleted at `applyFactLocks`.
- summoned-pact T8 "Tilde Crane added that the gate crews had gone quiet an hour ago…" deleted at `applyFactLocks`.
- salt-road T10 "past ~~the last crate~~ the area into Safehouse Alley" at `runWarden`.
- summoned-pact T10 "marked ~~The~~ Weighing Cup" at `finishCommittedProse` (mention polish).

tsc (app config) 601. vitest 116 failed; 0 new vs both baselines. Not committed, not deployed.

## Fixes after check 6 (John, 08:24): the four named cuts only

| What broke (live line) | File | Change |
|---|---|---|
| cursed-keep T7 "…no one here had yet said what they wanted…" (empty-street lock); summoned-pact T8 "…gone quiet an hour ago…" (clock lock) deleted | `src/game/factLocks.ts` `applyFactLocks` (+ callers `fateAutoplay.ts`, `useGame.ts` ×2) | `keepWriterProse` on writer turns: no sentence is deleted; the warden already logs each hit as a `Fact lock:` note (`detectFactLockViolations`). System-block clothing sanitize still runs |
| salt-road T10 "past ~~the last crate~~ the area into Safehouse Alley" | `src/game/proseWarden.ts` (`ProseWardenContext.keepWriterProse`), `warden.ts`, `fateAutoplay.ts`, `useGame.ts` | `scrubInventedContainers` does not run on writer turns — a crate the writer sets in the scene is scenery, not a search claim |
| summoned-pact T10 "a leaning sign marked ~~The~~ Weighing Cup" | `src/game/mentionVariety.ts` `repairLabelArticles` | article glue is only an article, a comma list of modifiers, then the label's "The" ("the cold, gray The road", "the mud-rutted The road"); a run of plain words with a noun and verb ("leaning sign marked") is not glue |

Tests: `cursed-keep T7 / summoned-pact T8 check 6…`, `salt-road T10 check 6…`, `summoned-pact T10 check 6…` (each with the old behaviour as a control).

## Check 7 — `check-7/` (one check)

**Cut: 0.** Clean draft lines kept whole: cursed-keep 36/38, salt-road 32/33, summoned-pact 39/39 (the rest dropped as repeats). No new cut. Gate drops only (writer lines the gate fails, incl. two `article-person`).
tsc (app config) 601. vitest 116 failed; 0 new vs `vitest.json`, 0 new vs `vitest-29z9b.json`. Not committed.
