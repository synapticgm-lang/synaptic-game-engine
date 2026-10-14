# tt-fix-6 — receipt

Order: `docs/orders/tt-fix-6-order.md` (approved 14 Oct, 1:52 PM). Source: `docs/orders/tt-diagnose-7.md`, "Next fix round" items 1 and 3–9, plus the gm-turn warning. No laps run.

## Item 1 — tabletop follows SRD 5.2.1 as written (with the item 2 ruling)

- **XP from monster CR only.**
  - `src/game/xpRules.ts:312`: after the CR block, tabletop milestone kinds pay 0.
  - `src/game/xpRules.ts:91`: `deedXp` pays 0 outside LitRPG.
  - Milestone and deed branches were removed from `dungeonCard.ts`, `sandboxXp.ts`, `engineFight.ts`, `fateAutoplay.ts` and `useGame.ts`.
- **Item 2: levelling by SRD XP only.**
  - `src/game/rules/houseRules.ts:21,52`: `progression` is always `'xp'`. `milestoneLevelling` and `xpUnderRules` are gone.
  - `src/components/CampaignSettings.tsx`: the ttProgression row is removed.
- **Disengage only prevents opportunity attacks.** `src/game/rules/roundCombat.ts:1089`: Disengage no longer sets `escaped`.
- **Escape and parley use SRD checks, with no house DCs.** `src/game/engineFight.ts:152` `srdBreakAwayCheck`:
  - Escape is a Dexterity (Acrobatics) contest against the foe's Dexterity check. A tie keeps the status quo.
  - Parley is Influence: Charisma (Persuasion) against DC 15 or the foe's INT, whichever is higher.
  - The `isEngineCheckLine` check in `systemLog.ts` reads the contest line.
- **Treasure per the SRD, with no house formula.**
  - `src/game/rules/srdMonsters.ts:51…` adds stat-block `gear`.
  - `src/game/lootTableRegistry.ts:635`: a defeated foe drops its SRD Gear (`foeName`, passed from `combat.ts`).
  - `src/game/lootTableRegistry.ts:496`: a cache holds a Potion of Healing, an SRD Common magic item worth 50 GP as a consumable.
  - **Note for John:** the SRD has no treasure tables, so tabletop fights now pay 0 gold.
- **No social-track numbers on tabletop STATUS.** `src/game/arcDirector.ts:951`: the "Social track:" receipt is dropped when `engineMode` is dnd.
- LitRPG and story RPG are unchanged.
- **Test:** `ttFix6.test.ts`, "item 1" (2 tests).

## Item 3 — the line gate reads what the writer was handed; the clock owns time

- `src/game/completedEventPacket.ts:1041`: new `handedWriterText`. It joins WORLD FACTS (`formatWriterInfoLayer`, including [NPC] lore rows), the info sheet, the engine result, ledger changes, the player line and the allowlist.
- `src/game/tokenProse.ts`:
  - Line 421: `handedCountText` uses it.
  - Line 569: a line naming the engine result's find passes.
  - Lines 1168 and 1177: `handedProperNames` adds the mid-sentence capitals from the handed text.
  - `lineHasWrongTimeOfDay` accepts the clock's "now …" slot.
- `src/game/sceneFacts.ts:340`: when `worldHour` runs, prose words do not change `timeOfDay`.
- **Test:** "item 3" (2 tests).

## Item 4 — the quest step's verb decides what ticks it

- `src/game/tabletopQuestProgress.ts:102`: new `tabletopStepKind` (talk, move or look).
- `src/game/tabletopQuestProgress.ts:113`: `tabletopStepAnchor` gets the kind, the destination and the starting point.
  - A talk step needs its person.
  - A look step needs its place and its people.
  - A move step has no chip.
- `src/game/tabletopQuestProgress.ts:183`: new `arrivedMoveStep`. A move step ticks when travel arrives at its destination; escort-type steps need the person along.
- Callers pass `hereBeforeMove`: `useGame.ts` and `fateAutoplay.ts`.
- **Test:** "item 4".

## Item 5 — a missed fight fact is added and the writer's beat is kept

- `src/game/engineResult.ts:121,140`: `terminalOutcomeSentence`, `forcedAttemptSentence` and `foeHitSentence`. `terminalFightBeat` reuses them.
- `src/game/beatCommitGate.ts:231`: new `withMissingFightFacts`.
- `src/game/writerTurn.ts:214`: after a failed rewrite, the writer's beat is kept and the missing facts are added (`fightRetry: 'added'`). The last resort paints only when there is no prose. The rewrite draft is returned as `fightDraft`.
- The last resort says "on" the road while a journey is underway (`lastResortStoryBody`).
- **Test:** "item 5".

## Item 6 — offer chips need an open ask; props come from the engine

- `src/game/questGiver.ts:50`: new `hasOpenAsk`. A person has one if they spoke a want or offer, or are giving an active quest, and have not exited.
- `src/game/stanceDensity.ts:167`: help and refuse stances use it.
- `src/game/chipLegality.ts`: `chipProblem` drops an offer-answer chip when nobody has an open ask.
- `src/game/sceneFacts.ts` `extractSceneFacts`: the prose-word props (panel, street, chest, locket) are removed. Props come only from previous facts and the seed.
- **Test:** "item 6" (2 tests).

## Item 7 — STATUS chrome

- `src/game/arcDirector.ts:649`: STATUS names only a step that really ticked, in the quest's own words (`Quest stage: <quest> — <step>`). The beat summary stays internal.
- `src/game/encounterTerminalFsm.ts:386`: a defeat reads "lost".
- `src/game/systemLog.ts:215`: "Encounter cleared:" stays in core STATUS.
- `src/game/completedEventPacket.ts:2180`: new `lastResortPov`. The topic-advance last resort is in past tense and follows the PC's point of view. "kept" is gone.
- **Test:** "item 7".

## Item 8 — tool fixes

- `src/game/turnCheck.ts:485`: fight round chips and the death save are not counted as repeats (`fightRoundChips`). The row's own `previousPick` comes first.
- `fateAutoplay.ts` and `replayRun.ts` pass `previousPick`.
- `src/game/fateAutoplay.ts:1372`: the stage trace now records `fight-rewrite`.
- `scripts/factCheck.mjs:197`: present people's names are allowed, and wagon and cart were dropped from the meeting words.
- **Test:** "item 8".

## Item 9 — answer facts from lore and quest text

- `src/game/writerTurn.ts:296` `backedAnswerFacts` now also reads:
  - the person's bible NPC lore card (by name or alias);
  - the description and open steps of active quests they give or take part in.
- The raw `wants <motive>` line is removed.
- **Test:** "item 9".

## gm-turn warning

- `supabase/functions/gm-turn/index.ts:369`: a turn call without `state.completedEvent` logs `console.warn` before the edge rebuilds the packet.

## Pins updated to the SRD rule or the new behaviour

1. `s82RootATerminalFight.test.ts`: a second miss now keeps the writer's beat and adds the outcome (`'added'`), instead of painting over it (item 5).
2. `aloneStartQuest.test.ts` ×3: STATUS shows `Quest stage: <quest> — <step>`, not the beat summary "bearings established" (item 7).
3. `roadFightOutcome.test.ts` ×2: escape is a contest. A flat 0.99 is a 20–20 tie, so the mock now rolls PC 20 and foe 1 (item 1).
4. `seed93WriterFacts.test.ts`: SRD gear now drops. The pin checks that the in-hand weapon is the PC's and is not one of the looted items (item 1).
5. `ttFix1.test.ts`: Tilde's backing comes from a lore card, not the raw "wants …" motive (item 9).
6. `playtest28dLoot.test.ts` ×3:
   - The house coin purse and cache are replaced by SRD gear and a Potion of Healing, with 0 gold.
   - Tabletop deed XP is 0.
   - Auto-fight in tabletop pays no coin formula (item 1).
7. `playtest29xRareCampStall.test.ts`: a tabletop rare spawn drops SRD gear and 0 gold (item 1).
8. `playtest29rPlaceTemplatesXp.test.ts` ×2: a tabletop settlement card pays 0 XP (item 1).
9. `playtest29z1AchievementCircling.test.ts`: tabletop deeds pay 0 XP (item 1).
10. `rules/roundCombat.test.ts`: Disengage stays `ongoing` even when faster than the foe (item 1).
11. Stamp pins moved from 2026-10-14j to 2026-10-14k (20 files).

## Tests

- **New:** `src/game/ttFix6.test.ts`, 13 tests, all passing.
- **First full run:** 85 failing.
  - 14 were new versus clean `HEAD` (checked in a temporary HEAD worktree). All 14 encoded old house rules or old behaviour and were updated as listed above.
- **One fix run:** the 32 touched and stamp-pin files gave 324 passed, 0 failed.
- **Full confirmation run:** 78 failing.
  - Seven of those (in `playtest02z`, `08b`, `09c` and `10d`) fail identically on clean `HEAD`. They are baseline failures that did not show up in the first run's list.
  - One more is the known flake `seed94InfestationClear`.
  - No new failures.
- **tsc:** 570 errors (cap 570).
- **Build:** green.

## Commit, deploy, stamp

- **Commits:** `ecbce130` (code, tests, stamp, gm-turn warning) and `63304d1c` (synced edge copies), both on `main` and pushed.
- Left uncommitted: `humanJudge.mjs`, `.cursor/rules/playtest-notes.mdc`, `.gitignore`, the other docs/orders edits and the `.tmp*` files.
- **Edge:** ran `node scripts/sync-gm-edge-shared.mjs`, then `npx supabase functions deploy gm-turn`; the deploy reported "Deployed Functions."
- **Stamp:** 2026-10-14k. https://www.synapticgm.com/version.json returns `{"hud":"2026-10-14k","build":"2026-10-14k"}`.

TT_DONE
