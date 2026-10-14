# tt-fix-2 — receipt (14 Oct 2026)

Order: `docs/orders/tt-fix-2-order.md`. Read first: `mode-tt-lap-3.md`, `tt-fix-1.md`, standing brief.

**Result: stopped before ship.** The one allowed fix run hit the order's stop rule: `openingCardCompile` failed the same way in both full vitest runs. Nothing was committed or pushed. `gm-turn` was not deployed. The stamp was not bumped. Live is still `2026-10-14f`.

## What changed (in tree, uncommitted)

### 1. Quest steps carry a place or person the step reader can use
- `QuestObjective.place` / `people` — `src/game/types.ts:169`. Bible `StarterQuest.objectiveAnchors` — `src/data/campaigns/types.ts:40`; the seed type is in `src/game/questPlay.ts:17`.
- Anchors are copied onto objectives in `asSeededQuest` and `revealLocalStarterQuest` (`src/game/questPlay.ts:808`, `:1007`).
- Every tabletop spine step is anchored at its map pin (`src/data/quests/tabletopMainSpines.ts:607`). The Mayor Problem pin was "Violated Churchyard", which matches no hub; it is now `Greyhollow Graveyard` (`:160`), and the graveyard hub has churchyard aliases (`src/game/outdoorHubs.ts:163`).
- The Woodcutter's Plea anchors the keep steps at Keep Gate and the report step to Father Aldous or Mayor Helga Brask (`src/data/campaigns/cursedKeep.ts:209`).
- `tabletopStepAnchor` reads an anchor, then a place the wording names, then a one-step quest's own place (`src/game/tabletopQuestProgress.ts:32`). `atPlace` resolves hub aliases (`:46`). A talk step also matches a person here by their full name (`:97`).
- Spine steps had no chip at all: `objectiveChip` returns null for a long step with no early clause break ("Check the mud around the opened graves for heavy cart tracks…"). There is a new `objectiveStepChip` that cuts the longest verb-and-object at a phrase boundary (`src/game/choiceRanking.ts:420`). It is used only for tabletop step chips (`tabletopQuestProgress.ts:67`); XP labels still use `objectiveChip`.
- The story chip follows `mainSpineQuest`, not the first active quest. This removes the dead "Examine the keep gate" chip (`choiceRanking.ts:368`).

### 2. Death ends autoplay; fight rounds and death saves are progress
- `fateAutoplay` applies the same end-of-run rule as live play: `applyPlayPhaseAfterHp`, plus the death quest receipt (`src/game/fateAutoplay.ts:2054`). The run loop already stops on `playPhase: ended`.
- `turnProgress` adds a `fight` reason when PC HP, the foe's HP or count, or the death-save tally changes during a fight (`choiceRanking.ts:120`).

### 3. Encounters fit a solo L1 PC (SRD 5.2.1 budget)
- `encounterXpBudget`, `highestCrWithin`, `foesWithinBudget` are in `src/game/xpRules.ts:116–129`.
- `blockWithinXp`: an over-budget creature fights as itself at the highest CR that fits. HP is scaled, and it gets one plain attack with no extra dice or riders (`src/game/rules/srdMonsters.ts:118`).
- `startCombat` and `resumeCombat` fit both the block and the foe count to the budget, using band by difficulty and party = PC + ally. They store `budgetXp`, and XP is paid on the fitted CR and count (`src/game/tabletop/roundFight.ts:217–231`, `:386`).
- Road groups are capped by the same budget (`src/game/travelJourney.ts:388–391`). The quiet-stretch fact now says nobody was met (`:454`).

### 4. Writers may not read out the record or drop or contradict dice
- New `src/game/engineFactGate.ts` provides sentence checks for: a travel record read out (legs, trip time); an open quest step given away before the page shows it; the player's choice posed; a PC blow the engine never landed; a miss on the PC when every foe attack hit. Quoted speech is not checked.
- These checks feed the existing sentence repair through `sentenceGateProblems` (`src/game/beatCommitGate.ts:191`): one rewrite against the fact, otherwise the sentence is dropped.
- A beat that shows none of the foe's hits goes to the existing fight rewrite (`beatCommitGate.ts:211` → `writerTurn.ts:445`, with the reason line at `writerTurn.ts:35`).

### 5. Display names, opening places, doubled receipts
- `collapseEchoedLabel` fixes a whole label typed before itself ("their chain shirt Chain Shirt") and a doubled title ("Father Father Aldous") (`src/game/tokenProse.ts:1025`). `dropTypedNameAfterToken` handles the appositive echo ("@t5, Tilde") (`:1061`).
- `varyRepeatMentions` never shortens a foe kind ("Cave Spider" → "the Cave") (`src/game/mentionVariety.ts:96`).
- In `placeNames`: spine pins are listed before hubs; "Greyhollow, at the inn" folds to Greyhollow Inn (`src/game/placeNames.ts:49`); an unmatched description stays whole (`:104`); a room of an indoor hub opens as that hub (`:137`).
- Duplicate "Encounter cleared" receipts are removed: the machine form is dropped when the readable form is present, and identical lines are deduped (`src/game/systemLog.ts:219`, `:252`).

### 6. The existing fact checker flags the lap-3 kinds
- `scripts/factCheck.mjs:450` adds new kinds `record-read`, `player-choice`, `roll`, `meeting`, `echo` and `agency`. It uses the same reading as `engineFactGate` (`:480`, `:503`). No new checker was written.
- I ran it once on the six existing lap-3 cursed-keep runs (not a new lap). It flagged the hand-found errors, for example "Now Jax had to decide whether…", "traveled for thirty minutes on leg one", and "made the task feel dangerous".

### Skipped
N5, N6, N7, N11 and N14 from lap 3 are not in this order's six items. Road meetings that vanish (second half of N10) were not traced. Only the fact wording for quiet stretches changed.

## Tests
- New `src/game/ttFix2.test.ts`: 17 tests, at least one per item. All 17 pass.
- tsc (`tsconfig.app.json`): **570** errors (tt-fix-1 measured 570; baseline 601). Build: green.
- Full vitest, baseline 75 failed of 2539. After the fix run: 79 failed of 2556. The new failures against baseline:
  - `playtest29uTravelGap`, `playtest30iFogOfWar` — known flakes.
  - **`openingCardCompile` › "no card whose location only mentions a hub collapses to that hub"** — failed in both runs, which triggers the stop. Cause: the new indoor-hub room rule in `openingPlaceRecord` (`placeNames.ts:137`). "a barred undercroft cell beneath Valespire Cathedral" matches the hub alias "undercroft" in its core, so it collapses to Cathedral Undercroft. Proposed fix, not run: apply the room rule only when the description has no trailing clause naming the hub again.
  - **`questFalsePay` › "a long objective is labelled whole"** — fails in the full run in both runs, but passes when run on its own. In the second run no `quest step:` XP note was paid at all. The cause was not traced; it may depend on which tests run first.
  - The first run's `openingEstablishment` kit-cover failure passed alone and did not repeat.

## Ship
- Commit: none. Push: none.
- Edge sync and `gm-turn` deploy: not run. They will be needed on ship, because `types.ts`, `questPlay.ts` and `outdoorHubs.ts` are synced files.
- Live stamp: `2026-10-14f` (unchanged). The next ship would be `2026-10-14g`.

## Finish (9:28)

Order: `docs/orders/tt-fix-2b-order.md`. **Result: stopped before ship.** The full vitest came in above the bar, and `openingCardCompile` failed again.

### openingCardCompile
- Fix applied as the order said, in `src/game/placeNames.ts:135`. The indoor-hub room rule now shortens to the hub only when the trailing clause does not name the hub again. The clause is checked against every word of the hub's name and aliases. "a barred undercroft cell beneath Valespire Cathedral" now keeps its own words.
- The same test then fails on the next card: "the Contract Hall notice board" still becomes Contract Hall. That description has no trailing clause, so the fix in the order cannot reach it. In the first run this card was hidden, because the test stops at the first failing card. Making it pass would mean narrowing the room rule further, for example to room nouns only. The order did not ask for that, and it would be a word list. Not done.

### questFalsePay "a long objective is labelled whole"
- Cause (clear, and not caused by test order): `createInitialState` rolls `systemHousing` from a random seed (`defaults.ts:80–81`). Some housings hide the `experience` part, and then `applySandboxXpAwards` returns no XP notes (`sandboxXp.ts:471`). The fixture's later `seed: 's75'` does not re-roll the housing. Confirmed: rolling from `s75` hides experience, and the test then failed every time.
- Fix: the fixture `inTheHold` sets `systemHousing: undefined` (`src/game/questFalsePay.test.ts:50`). This is a test-only change. The test passes alone and in the full run. It is not marked flaky.

### Tests
- Targeted: `questFalsePay` 5/5, `ttFix2` 17/17, `openingCardCompile` 6/7 (the Contract Hall card).
- Full vitest (one run): **79 failed of 2556**. Bar: 75 plus the known flakes. Of those flakes, `playtest30iFogOfWar` and `playtest27aRepair1` failed this time; `seed94InfestationClear` and `playtest29uTravelGap` passed. That makes the bar 77 for this run. The two failures over the bar:
  - `openingCardCompile` › "no card whose location only mentions a hub collapses to that hub". Repeated, so the stop rule applies.
  - `openingEstablishment` › "seals kit cover instead of blocking with a questionnaire". tt-fix-2's first run had it too; it passed alone then. Not traced.
- tsc and build were not re-run.

### Ship
- Commit: none. Push: none. Edge sync and `gm-turn` deploy: not run. Stamp is not bumped; live is still `2026-10-14f`.
- The `placeNames.ts` and `questFalsePay.test.ts` edits are in the tree, uncommitted, alongside the rest of tt-fix-2.
- Full vitest output: `.tmp-ttfix2b-vitest.json` / `.tmp-ttfix2b-vitest.txt`.

TT_STOP
