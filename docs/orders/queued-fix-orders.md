# Queued Cursor fix orders (written 15 Oct 2026, ~12:05 BST, by Grok Bot for John)

All orders are ready to run but **not started**. Run them after queue30 and one at a time, **in the order of the Dependencies list below**.

**House rules for every order:**
- Follow SRD 5.2.1 as written (CC BY 4.0, https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf).
- Fix the cause, not the test.
- Rewrite a test's expectation only when a later decision deliberately changed the behaviour. Name that decision in the commit.
- Finish each order with: the named bank files green, `npx vitest run src/__tests__/replayBank` with no new failures, tsc showing no new errors, and a stamp.

The root causes come from `docs/design/replay-open-rootcauses.md`, now traced through the code. Each order says whether its cause was **confirmed** or **changed**.

---

## Audit and Dependencies *(15 Oct 12:30, checked against John's decisions, `mode-rules-matrix.md` and `wellbeing-safety-guide.md`)*

**Merges (one mechanism, one order):**
- **Order D -> P-5.** Both are the name/REF gate (`lineNameReason`, REF ENUM). D's expectation checks run as P-5's first step.
- **L5 -> P-5(b).** Player-voice is a gate fix (`pc-voice`), not a prompt rule. L5's "add to the never list" is dropped (root causes only).
- **L6 -> Order M step 4 + Wire-in H.** The motive-line repeat is caught by the ledger's `said` in the repeat gate. R4 tests both.
- **L3 -> Order E.3** (CR for bible foes, solo budget check).
- **P-2, P-3 and P-5 share ONE handed-ref list:** REF ENUM rows + labels + Order M's `present`. P-2 builds it as a helper (e.g. `handedRefs(state, packet)`); factCheck (P-3) and P-5 import it. No second list.
- **Order S step 3 (mercy branch) is superseded** by the best fit 1 (tabletop knockout at 1 HP) and design update A (LitRPG lifeline / Story RPG charm).

**Conflicts fixed:**
- **Order M scene exit vs "dungeons stay open":** M's exit now means *leaving* the dungeon. It condenses the ledger only and never calls `closeDungeon`.
- **L5 vs "root causes only":** resolved by the merge above.
- **Order S (tabletop) knockout at 1 HP** is a deliberate exception to SRD-as-written, by John's self-death rule (11:38). It's recorded as such in the mode matrix. Normal danger deaths stay SRD.

**Missing items (new, need John's OK):**
- **O1, dungeons stay open:** `maybeAutoCloseDungeon` still runs every turn (`useGame.ts:3871`, `fateAutoplay.ts:1662`). `shouldAutoCloseDungeon` (`dungeonLifecycle.ts:133`) closes a dungeon when all its foes are dead, which may contradict the decision. *Check, not traced:* if "stay open" means after clearing too, drop the auto-close and keep `arcStatus: 'cleared'` without closing (R2/R3 test it).
- **O2, PYOA and the self-death rule:** the matrix says "the lifeline fiction applies", but no order covers PYOA. PYOA endings are pre-written, so a story branch that is a self-killing ending must route through `commitDeath(cause:'self')` (fade, then return to the last choice). Fold into Order S.
- **O3, camps:** no order and no tape (R5 blocked). Needs a seeded ttTravel lap with camps forced on before any camp fix.
- **O4, PYOA replay coverage:** distill-1 has **no PYOA tapes** (0 of 69). 109 older PYOA tapes exist (to 29 Sep), and seeds are now in `docs/test-data/pyoa/pyoa-replay-seeds.json`, so E's PYOA no-XP rule, K's PYOA switch and O2 have unit tests only. Add PYOA seats to the next distill lap.

**Dependencies (run order after queue30; one order at a time):**
0. **LT-off** (independent; any slot, ideally next).
1. **B + F** (replay seam and clock). Every replay-based test below relies on it.
2. **P-1, P-3** (scripts only; safe even during queue30). Then rerun distillCollect for the true pass rate.
3. **S** (+ O2, gaps 1-7). Safety first; independent of the writer orders. Its token-gate class `selfHarmMethod` must land before P-5 edits the same gate, or be rebased.
4. **A, C + H, G, X**: independent fixes. H before M (the said/motive lines feed the ledger).
5. **E (+ L3), then RC-2 + L1** (quest ticks; RC-2 is the likely L1 cause). K reuses this objective matching. **RC-1** and **RC-3** run anywhere after B (independent).
6. **P-2**: builds the shared handed-ref list.
7. **M** (merges P-4 + L6): needs P-2's list and H.
8. **P-5** (merges D + L5): needs M's `present` and P-2's list.
9. **K**: needs M (pinned commitments) and L1 (objective matching).
10. **N** (after B), **L2, L4, O1**: L2 with the dungeon-card chest state; L4 after F and M (travel is its own scene); O1 after John confirms.
11. **I** runs with tt-build-shop (R6). **chipcheck** after G + RC-3. **RC-0** any time (script).

---
## Order LT-off: remove LanguageTool for good *(John, 12:47; independent, so run early)*
> **Brief:**
> - Delete `src/game/grammarCheck.ts`.
> - `src/game/proseWarden.ts`: drop the grammar branch :1665-1679 (`quickGrammarCheck` import :1675) and `enableGrammarCheck` in the ctx type :67-69. Fix the stale comment :780.
> - **Server copy:** `supabase/functions/_shared/gm/proseWarden.ts` has the same lines (:67-69, :1665-1679) and imports `./grammarCheck`, which **doesn't exist on the edge**. That's an existing dead import, silently caught today. Remove it the same way.
> - `src/game/warden.ts`: drop `enableGrammarCheck` (:67 comment, :243-244, :279, :308 `polishedBase` branch). Keep the sync prose path as the only path; if the async wrapper then has no purpose, fold it back, but keep the callers' signatures unless all callers are updated in the same commit.
> - `package.json:44` `languagetool-api`, plus `package-lock.json` (`npm uninstall languagetool-api`).
> - `src/legal/credits.ts:190-194`: remove the row. `src/game/ttCoinCredits.test.ts:104`: drop the languagetool assertion (cite John 12:47).
> - **Gates:** as normal (bank files green, replayBank with no new failures, tsc showing no new errors, stamp). `git grep -i -E "languagetool|grammarCheck" -- src supabase scripts package.json` returns nothing.
> - **Check:** the next lap shows no prose regressions versus the last lap (readability gate count, judge "broken" and "stiff" P0s, factCheck flags per mode). Note the comparison in the report.
## Order A: SRD monster names in the combat log *(cause changed)*
- **Trace:**
  - `src/game/rules/roundCombat.ts:226` uses the SRD block name (`Zombie ×3`) only when there is **more than one** foe. With one foe it uses `f.name`, the road label `FOE_NAME.undead = 'the restless dead'` (`travelJourney.ts:722`).
  - The ds151 tape now gets one zombie, not three. `sizeMeeting()` (`travelJourney.ts:872`, tt-fix-2 SRD encounter budget) cuts the group to the SRD 5.2.1 XP budget for a level-1 solo character.
  - So the headcount drop is correct SRD. The **real bug** is that a lone SRD foe is logged under its road label instead of its stat-block name. Every `who: foe.name` in roundCombat (saves, acts, checks) does the same.
- **Fix:** when `foe.block.srd` is true, log the foe as the block name everywhere in the combat events: `Zombie` for one, `Zombie 1`/`Zombie 2` for several. The writer-facing fact can keep the road label. Put this in one helper in roundCombat (for example `logName(foe)`) and use it at every `who:`.
- **Tests:**
  - tt2 (three tests), tt3 (two), tt4 (Cleave), tt6c (Cleave, class features, Reckless).
  - For each tape whose expected headcount was three, set it to what the SRD budget now gives, and cite tt-fix-2.
  - mode2 "Flee check": the engine now runs the SRD escape **contest** ("vs Bandit d20 …", from tt-fix-6). Rewrite the stale `vs DC` expectation as the contest line, and cite tt-fix-6.
  - mode2 T8 "Writer empty after retries" (`completedEventPacket.ts:2405`) is separate. Check whether the engine lines still reach STATUS when the writer is empty. Fix that if they don't.

## Order B: old tapes reach a different scene *(cause changed)*
- **Trace:** the road rolls are **keyed** (`keyedRng` and `hashUnit` with keys of the form `trip|leg|…`), not one shared sequence, so my earlier "shared random sequence" idea was wrong. The replay seam `setReplayRecordedMeetings` (`travelJourney.ts:663–675`, used by `replayBank/replayRun.ts`) keeps recorded meetings. It does **not** cover the new world steps:
  - `sizeMeeting` with the budget, which runs inside the seam at line 838.
  - camps placed as places (tt-build-camps; the seam skips only the camp watches, line 1699).
  - quest targets placed when the quest is made (tt-build-questtargets).
  - the one world clock (tt-fix-15).
- **Fix:**
  - In replay mode, keep the tape's recorded headcount, camp and quest-target placement, using the save fields on the tape when they exist.
  - When a tape predates a feature, the seam leaves that feature off for the replay.
  - Add one `replayPreFeature(stamp)` check in replayRun.ts. Don't spread checks around.
- **Tests:** m28, tt6a travel pace, mode4 "Face the thugs", m8, s80, m42 crowd, s72, m50 ×2. Confirm the scene and turn match before judging any other assertion.

## Order C: answer-repair and repair-prompt context *(confirmed, made more precise)*
> **Brief (pre-scout 12:45):**
> - Files: `src/game/writerTurn.ts`: `backedAnswerFacts` :316; answer repair :400-418 (`backed` map :414, `'nothing on record for anyone here'` :416); merged repair request :470-486; unchanged-repair bug :573. `npcSheet.ts` `motiveLinesOf` :234. `travelJourney.ts` `writerEngineResult` :1016 (Exits filter).
> - Now: a person with no backed fact or motive line gets no answer repair; the place-behind note is gone from the merged request; `Exits:` facts are filtered out in `writerEngineResult`.
> - Change points: :416 (falls back to H's group lines once H lands, so no new branch); add a one-line place-behind note inside :470-486, built from the existing stale-place check; let `Exits:` through at :1016.
> - Tests: `playtest28lWriterTurn.test.ts`. Banks: m10, m11 C, m13, m34, m38 ×2, m50, m56, m59 fix 2. Replay R4.
> - Runs after H (m38/m48/m56 depend on group lines).
- **Trace:**
  - The "place behind" note ("This happens on the back streets from … a place the player already left …") appears nowhere in `src` now. It was dropped when tt-fix-15 merged the token-gate repairs into one request. The repair prompt is `writerTurn.ts:470–486`.
  - The answer repair (`writerTurn.ts:400–418`) only quotes `backedAnswerFacts` plus `motiveLinesOf`. A person with neither gets `'nothing on record for anyone here'` (line 416) and **no repair**. This is m38, m48 and m56.
  - The m13 "repair returned the sentence unchanged" comes from `writerTurn.ts:573`.
- **Fix:**
  - Put the place-behind note back as one line in the merged repair request when a flagged sentence names a place behind. Build it from the existing stale-place check; don't write a new scanner.
  - Once Order H lands, groups and road meetings get motive lines, so they stop being "nothing on record".
  - Engine-fact lines that tests expect, such as `Exits:`, must survive `writerEngineResult()`. Check why m59's Exits fact is filtered out.
- **Tests:** m10, m11 C, m13 repair, m34, m38 ×2, m50 (Wenna), m56, m59 fix 2.

## Order D: name and REF checker *(likely, not traced line by line; **merged into P-5**, run as its first step)*
- **Trace:** the failures fit tt-library-2 (the strict REF ENUM, where each declared ref binds to one row) and tt-fix-15 ("person words read by their role in the sentence"). Here `Oda Dunmore` comes back as `ref unknown` instead of `action:capital`, and engine labels are no longer flagged.
- **Fix:** for each failing case, find which of the two changes reclassified it.
  - If the new reading is more correct, update the expectation and cite the commit.
  - If not, restore the old class at the single reading point.
- **Tests:** m11 B, m14, m16, m18, m22, m25, m27, m39, m42 (Garth), m49, m59 fix 1 ×2.

## Order E: levelling per mode on ONE XP engine *(revised 15 Oct 12:20, from the existing research, per John 11:46)*
> **Brief (pre-scout 12:45):**
> - Files: `src/game/xpRules.ts` `milestoneXp` :260 (mode checks :268, :272, :284, :298; `LOW_FOE_GAP/SHARE` :243-244; `OVER_LEVEL_GAP/SHARE` :212-213), `milestoneXpBase`; `difficultyRules.ts:58` `xpScale: 1.25`; `houseRules.ts` `progression`; `srdMonsters.ts` (CR mapping).
> - Now: tabletop gets ×1.25 Hard and the over-level cut; PYOA falls into the LitRPG table (:298 `mode !== 'dnd'`).
> - Change point: one per-mode row `{ difficulty, overLevel, lowFoe, xp: boolean }` next to the tables; `milestoneXp` reads it in place of the four `mode === 'dnd'` checks; pyoa returns 0, and `applyCharacterXpGain` is a no-op for pyoa.
> - Tests: new `xpRules.test.ts` per mode; `xpFix14a` green; retire the tt5 (×2) and tt6b milestone asserts (cite tt-fix-6 / SRD); mode2 fix 2; modeGap6; tt6c vs `srd521.json`. Replays R17, R19, R21.
**Existing research and decisions used (no new rules):**
- `docs/design/litrpg-xp-review.md` (14 Oct): genre survey (DCC, HWFWM, Primal Hunter, Defiance of the Fall, Cradle, Wandering Inn), the earned-XP policy, and its Cursor fix prompt.
- `docs/orders/xp-fix.md`: that prompt shipped as `003540e6` (stamp 2026-10-14a).
- `docs/research/from-grokbot/2026-09-loot/LOOT-RESEARCH-2026-09-28.md` §A5: the difficulty table.
- `docs/orders/SUMMARY-29r.md`: the over-level cut.
- `docs/orders/SUMMARY-29z1.md`: Story RPG deeds pay an item, not XP.
- `docs/research/from-grokbot/2026-10-litrpg/litrpg-top20-report.md`: reader expectations.

**Where the two multipliers came from, and which modes they apply to:**

| Multiplier | Origin | Backed by research? | Applied in (`xpRules.ts milestoneXp`) |
|---|---|---|---|
| **×1.25 XP on Hard** | 28c `difficultyRules.ts:58`, "one shared difficulty table". It's the *Hard difficulty setting* (`gmStrictness: hardcore`), not a bonus for a hard fight | **Yes**, LOOT-RESEARCH §A5 (Diablo 3 and 4: harder tiers pay more XP; BG3 Explorer and Tactician for the to-hit side) | Every mode, tabletop included |
| **Over-level cut to 5%** (player 6+ levels above the area) | 29r "over-level 5% cut in every mode" (SUMMARY-29r Part B) | **Partly.** The order cites no research directly, but it matches the litrpg-xp-review pattern "low-level kills soon pay nothing" (Primal Hunter, Defiance of the Fall) | Every mode, tabletop included (tabletop shows it in its maths line) |
| Low-foe share 25% (foe 3+ levels below) | xp-fix item 7 (`LOW_FOE_GAP`/`LOW_FOE_SHARE`) | **Yes**, litrpg-xp-review policy 2 | LitRPG and Story RPG only (`mode !== 'dnd'`) |

**How progression differs, according to that research and the shipped decisions:**
- **LitRPG:**
  - XP is visible on a faster curve: ×1.5 from 150 ("keep the x1.5 curve from 150 as LitRPG's faster curve").
  - It pays for threat measured against your level, first-time effortful feats (capped at 3 small awards per in-game day), quests, and achievements (once each, never stacked on the fight that earned them).
  - Nothing is paid for travel, looking, greeting, chips, surviving turns, or daily logins.
  - Skills grow through use, separate from character XP.
- **Story RPG:**
  - The same engine and curve, with numbers hidden.
  - Places, dungeon entry and achievements pay 0 (`STORY_RPG_MILESTONE_XP`).
  - Deeds pay **an item, not XP** (29z1). Growth is shown in prose.
  - *Correction:* my 11:50 draft proposed "story milestones" for Story RPG. The existing research doesn't back that, so it's withdrawn.
- **Tabletop:** SRD 5.2.1 as written. Only the CR XP of foes overcome, divided by the party, on the SRD thresholds. No milestone levelling, since the SRD has none.
- **Pick Your Own Adventure:** **no levels and no XP. It is a pre-written story only** (John, 11:50). Today it falls through to the LitRPG table, which this order removes.

**Feasibility: one shared XP engine with per-mode multipliers.** Yes, and it's small.
- `milestoneXp` (`xpRules.ts`) is already the one engine. Every payer goes through it: sandboxXp, engineFight, dungeonCard and the useGame auto-fight (SUMMARY-29r).
- The modes differ only in `milestoneXpBase`'s table and three multipliers.

**Fix:**
1. Add a per-mode multiplier row next to the tables in `xpRules.ts`. The values are the researched ones:
   - `dnd`: `{ difficulty: false, overLevel: false, lowFoe: false }`, so every multiplier is 1.
   - `litrpg` and `rpg`: `{ difficulty: true, overLevel: true, lowFoe: true }`.
   - `pyoa`: no XP and no levels (John 11:50). `milestoneXpBase` returns 0, `applyCharacterXpGain` does nothing, and no level or XP line shows on STATUS.
   - `milestoneXp` reads this row instead of its scattered `mode === 'dnd'` / `mode !== 'dnd'` checks.
   - Difficulty still changes tabletop's *checks and to-hit* (BG3 style), just not its XP.
2. Tabletop shows only the SRD maths line (`CR x = n XP ÷ party`). The "×1.25 (Hard)" and "5% over-level" parts are removed.
3. Bible foes with no CR still pay "XP: none" in tabletop (lap L3). Give every bible foe card a CR, or an SRD block match (`srdMonsters.ts`).
4. Keep `progression: 'xp'` (`houseRules.ts`). Retire the tt5 (×2) and tt6b milestone assertions, citing tt-fix-6 and SRD 5.2.1.
5. LitRPG lap L1 (0 quest steps, every run at level 1) is a quest-tick bug, not a curve problem. Fix L1, then rerun a lap before changing any amount (the review says "do not change the curve").

**Tests:**
- In `xpRules.test.ts`, per mode: tabletop Hard and over-level give the plain CR XP. LitRPG and Story RPG still get ×1.25 on Hard, the 5% over-level cut and the 25% low-foe share. Pick Your Own Adventure gets 0 XP and never levels.
- `xpFix14a` stays green.
- mode2 fix 2 uses the pinned CRs.
- modeGap6 and the mode4 guard: fix them in code if the features are still wanted.
- tt6c: compare against `srd521.json`.

## Order F: clock and light *(confirmed by commit, not line-traced)*
> **Brief (pre-scout 12:50):** `travelJourney.ts` `worldClock` :351, `advanceClock` :383 (B's file: F rides on the B seam); replay `src/__tests__/replayBank/replayRun.ts` (`replayWhole` :89, plus B's `replayPreFeature`).
> - Now: replays start the one world clock (tt-fix-15) from the default, so tt6a reaches night at T9-T10.
> - Change point: in `replayRun.ts`, seed the clock from the tape's recorded hour (`snapshot.json` clock / `meta.json`) through B's seam. No rule change (dawn = Dim Light is SRD).
> - Tests: tt6a dawn, tt6a darkness ×2, m52 ("half an hour" comes from the clock record). Replay R18.
- **Trace:** tt-fix-15 brought in one world clock (a road day across journeys, a long rest once per 24 hours, camp length from the clock). The tt6a tape now reaches T9–T10 at night, not dawn. SRD 5.2.1 counts dawn as Dim Light (Rules Glossary, "Dim Light"), so the rule code is right and the clock input moved.
- **Fix:** in replay, start the clock at the tape's recorded hour (part of the Order B seam). In the m52 case, the narrated "half an hour" must come from the clock record.
- **Tests:** tt6a dawn, tt6a darkness ×2, m52.

## Order G: chips after the road-meeting change *(confirmed by commit)*
> **Brief (pre-scout 12:45):**
> - Files: `src/game/travelJourney.ts` `FIXED_ENCOUNTER_PADS` :425 (used :442, :485, :548), `withJourneyPads` :1980, `roadMeetingOnBeat` :1033. Same file as B's seam (:663-675, :838, :1699), so **run G after B is merged**.
> - Now: meeting pads come from `FIXED_ENCOUNTER_PADS[kind]`. Talk chips and answers that needed a person present (s79, m37, m48, m57) lost their source when meetings became ENGINE RESULT events.
> - Change point: the chip source reads `roadMeetingOnBeat(state)` (class plus label) and offers talk/face for thugs and camps and help for pleas, via the tt-fix-17 engine-chip path. Don't add a person present.
> - Tests: `ttFix17.test.ts`, `ttBuildRoadmeet.test.ts`. Banks: s79, m37, m48, m57, m38 format. Replay R1, R22.
- **Trace:** tt-build-roadmeet sends a meeting as an ENGINE RESULT event ("never a person present"). Chips and talk answers that relied on a person being present (s79 thugs chip, m37 talk answer, m48 label, m57 talk chip) lost their source.
- **Fix:** chips read the meeting event's class, offering talk and face for thugs and camps, and help for pleas. Use the existing engine-chip path from tt-fix-17. Don't add a person present.
- **Tests:** s79, m37, m48, m57, m38 format. Fold this into the option-check queue if it's open.

## Order X: Extended Travel (the forced march) *(no change: the code is correct)*
- **Correction:** I said earlier that SRD 5.2.1 has no forced march. That was wrong. SRD 5.2.1 p.192 (Gameplay Toolbox), **Extended Travel**: "At the end of each additional hour of travel beyond 8 hours, each character must succeed on a Constitution saving throw or gain 1 Exhaustion level. The DC is 10 plus 1 for each hour past 8 hours."
- `travelJourney.ts:1550–1572` does exactly this (label `Extended Travel: Constitution save`). Death at Exhaustion 6 is also SRD.
- **Disabling it in tabletop mode would break the SRD-as-written rule, so I have not written a disable order.**
- **Only change (optional):** rename the player-facing fact text "The forced march wore you down" to "Extended travel wore you down". This is wording only, at lines 1570 and 1572. Update any test that pins the old wording.
- The checklist is already corrected (`docs/design/tabletop-gm-checklist.md` lines 57 and 67).

---

## Wire-in H: `npc-motive-variants.json` and group lines into `motiveLinesFor()`
> **Brief (pre-scout 12:45):**
> - Files: `src/game/npcSheet.ts` `motiveLinesFor` :219, `motiveLinesOf` :234; `travelJourney.ts` `roadMeetingLabel` :913 and `roadMeetingWant` :944 (read only, outside B's seam). Data: `docs/library/npc-motive-variants.json` and `npc-group-motive-lines.json` -> `src/data/`.
> - Now: one motive line per archetype; groups and road meetings return nothing, so C's repair says "nothing on record".
> - Change points: `motiveLinesFor` returns the motive's own 3 lines first; `motiveLinesOf` gains a group-label branch (thugs/camp lines, undead `[]`), picked by `keyedRng` from the meeting seed.
> - Tests: `ttBuildNpcMotive.test.ts`, `npcSheet.test.ts` (+ group/undead cases). Banks: m38, m48, m56. Replays R1 (motive part) and R4.
- **Data:**
  - `docs/library/npc-motive-variants.json`: archetype id → motivation → three lines, the first being the shipped line.
  - `docs/library/npc-group-motive-lines.json`: groups → thugs and camp lines. Undead are mute, per the SRD.
- **Steps:**
  1. Move the variants into `src/data/npcMotiveVariants.json`, or merge them into `npcMotiveLines.json` with the shape `id → string[][]`, one list per motivation.
  2. In `src/game/npcSheet.ts:219`, `motiveLinesFor(motive)` should return the motivation's own three lines first, then the others. Keep the current fallback for an archetype with no variants.
  3. In `motiveLinesOf()` (`npcSheet.ts`, after `roadMeetingWant`), when the name is a group meeting label (`roadMeetingLabel(kind)` for thugs or camp), return that group's lines, picked by a key from the meeting seed. Undead return `[]`, and the answer repair must not quote them.
  4. Pick lines by seed (`keyedRng`), not at random, so replays stay fixed.
- **Tests:** a unit test that each archetype gives three lines with the motive's own line first; that a thugs meeting answers from the group lines; and that undead never get quoted. Rerun m38, m48 and m56 from Order C.
- **Licence:** training_ok stays undecided until John decides.

## Wire-in I: `shop-price-data.json` for tt-build-shop
> **Brief (pre-scout 12:50; with `docs/orders/tt-build-shop-order.md`, gold only, John decision 4):** data -> `src/data/srd/srdShopGear.json`; one `shopPriceCp(name)` that reads `srdGear.ts` (`srdGearCostCp`) first; coins via `rules/coins.ts` (`addCoins` :42, `coinCount` :33; spending as the shop order names). Record one shop transaction through the commitTurnRecord grant feed, never prose. Chips `Buy X for N gp` / `Sell X` are legal only with the merchant present and the player able to pay.
> - Never touch the real-money shop, payments or ads.
> - Tests: about 10 prices (Rope 1 GP, Rations 5 SP, Longsword 15 GP from srdGear); half-price sale; full value for gems; no duplicate weapon rows. Replay R6.
- **Data:** `docs/design/shop-price-data.json`, 183 SRD 5.2.1 items priced in cp, with the half-price selling rule (p.89). The note is in `docs/design/shop-price-data.md`.
- **Steps (append to `docs/orders/tt-build-shop-order.md` or run with it):**
  1. Copy it to `src/data/srd/srdShopGear.json` and add the SRD credit line to the Credits list.
  2. One price lookup, `shopPriceCp(name)`. It looks in `srdGear.ts` (`srdGearCostCp`, weapons and armour) first, then in the new file. Magic items stay in `srd521.json`. Coins and change go through `rules/coins.ts`. Don't add a second coin maths.
  3. Selling pays `floor(cp / 2)` for equipment and full value for trade goods, gems and art (SRD p.89).
  4. A merchant stocks by category: a hub sells tools, gear and food; a stable sells mounts and tack; a port sells ships. Don't show spellcasting services unless a temple is present.
- **Tests:** a table test of about ten known prices (for example Rope 1 GP, Rations 5 SP), the half-price sale, and that weapons still come from srdGear (no duplicate entries).


---

## Lap findings since 10:05 (distill-1, build 2026-10-15i, 51 finished runs: 17 each of Tabletop, LitRPG and Story RPG; reviewed 11:55)
- **Totals:**
  - 0 transport errors.
  - 11 runs ended short: 9 Story RPG runs at 16–19/20 turns, and 2 Tabletop runs at 7–8/20 (character death).
  - 9 failed the readability gate.
  - 31 of 51 had no fight by T8.
- **P0s (judge):** stiff line 165, ignored action 56, abstract 45, broken 24, redundant 9.
  - By mode: Story RPG 54, Tabletop 120, LitRPG 129.

### L1: LitRPG quest steps never tick *(new, high)*
> **Brief (pre-scout 12:45; runs with RC-2):**
> - Files: `src/game/questTargets.ts` `SEARCH_VERB`/`TALK_VERB` :23-24, `targetSpot` :59, the tick test :80-81, `findQuestTargets` :85; payer `sandboxXp.ts:360` (`quest-tick`); `intentParser.ts` `parsePlayerIntent` :221 (`PlayerIntent.kind: IntentKind`, `targets`).
> - Now: a step ticks only if the typed action matches the two verb lists (or a person target has a place). LitRPG System quests' wording misses them, giving 0 ticks (L1).
> - Change point: :80-81 test `parsePlayerIntent(action).kind` (search/inspect vs talk classes) and `targets` against the step target; delete :23-24. Check the LitRPG quest kinds have a target placed (`placeQuestTarget` :39).
> - Tests: `ttBuildQuestTargets.test.ts` (+ unlisted verb such as "examine the altar"). Replays R2, R3, R19; tape `summoned-pact s5001` (L1).
- Across 17 LitRPG runs: 0 quest steps, every run ended at level 1, and the XP came from fights and First Kill only.
- Compare Story RPG: 50 steps, most runs reached level 2.
- **Check:** does the step-tick rule from tt-build-questtargets ("a step ticks only on the engine's find or meet at the target") ever fire for LitRPG quest kinds? For example, the System quests in system-integration and summoned-pact.
- **Tapes:** any `distill-1/*litrpg*` run, for example `2026-10-15T09-29-02-039Z_summoned-pact_cold-system_s5001`.

### L2: LitRPG "Bronze Reward Box" can be farmed *(new, high)*
> **Brief (pre-scout 12:50; with O1):** `rules/achievements.ts` `boxForLine` :183, `settleRewardBox` :193 (removes the box by id :200, so the farm comes from the box being **re-granted or re-found**, not from opening it; trace the grant site of `${tier} Reward Box` :69); `dungeonSeed.ts` `markLootablesOpenedOnGain` :561 (chest state to reuse).
> - Change point: the grant (achievement/floor) records `granted: boxId` once on the save; `boxForLine` only matches an unopened box in the inventory.
> - **O1 (dungeons stay open):** `dungeonLifecycle.ts` `shouldAutoCloseDungeon` :133 / `maybeAutoCloseDungeon` :150, called at `useGame.ts:3871` and `fateAutoplay.ts:1662`. If John confirms, the cleared state sets `arcStatus: 'cleared'` and the dungeon stays enterable.
> - Tests: L2 tape (summoned-pact LitRPG, T8-T21): the box opens once. R2/R3 for O1.
- One run looted a [Common] Worn Jerkin from the same Bronze Reward Box on 12 turns in a row (T8–T21). The box is mentioned 18 times across the LitRPG reports.
- **Fix:** a looted container is marked empty on the save, and its chip drops once it's empty. Reuse the dungeon-card chest state from tt-build-camps.

### L3: Tabletop solo level 1 loses most fights *(check; **folded into Order E.3**)*
- 11 fights: most were DEFEAT (Road Bandit, Fog-Bank Cutter), with 2 deaths and 2 XP awards of 25.
- Group sizes follow the SRD budget, but bible foes with **no CR** pay "XP: none" (Order E.1).
- **Check:** does a solo character get the SRD 5.2.1 encounter budget for a party of one? Are bible foes mapped to SRD blocks?

### L4: "Push on into the night" written as "arrived in the morning" *(ignored action)*
> **Brief (pre-scout 12:50):** `travelJourney.ts` Extended Travel :1547 (save label), push-on pad :509 and :1585-1586, `writerEngineResult` :1016, `advanceClock` :383 (B's file, outside the seam). Writer packet `completedEventPacket.ts` engineResult.
> - Now: cursed-keep s5002 T5 took "push on", but the prose said "arrived in the morning". Check whether the save lines and the clock hours reach `writerEngineResult` (it may filter `Extended Travel:` like m59's `Exits:`; see C).
> - Change point: `writerEngineResult` keeps the save lines and a `now <slot>` clock fact; the token gate's time-of-day check (`lineHasWrongTimeOfDay`) then drops "morning".
> - Tests: R18 (T5 told as night); ttTravel.
- cursed-keep s5002 T5: the Extended Travel chip was taken, but the prose skipped the night.
- The writer must get the Extended Travel save lines and the clock's hours as the engine result. Check that `travelJourney.ts:1550` facts reach `writerEngineResult`.

### L5: The writer narrates the player's speech and outcome *(ignored action, 56; **merged into P-5(b)**: a gate fix, not a prompt rule)*
- For example, salt-road-heist s5003 T9 ("the name is Jax"), and system-integration T7 ("all of them were down").
- This is a writer-prompt rule: stop after the world reacts. It belongs to the existing writer-lesson set, not a code fix. Add it to the token-prose prompt's "never" list if it isn't there.

### L6: The same motive line repeats in two turns *(no-repeat; **merged into Order M step 4 + Wire-in H**)*
- broken-crown-keep s5109: Jarek Finn says the same quoted line at T9 ("Talk to Jarek Finn") and T10 ("Wait and watch").
- `alreadySaidLines` exists in `writerTurn.ts`. The answer repair should drop lines already said; it looks like the writer's own quote isn't filtered.
- Replay case R4 is in `docs/orders/replay-case-staging.md`.


---

## Order S: deliberate self-killing can never end a character permanently *(John, 11:38; all modes; root-cause fix)*
> **Brief (pre-scout 12:50; includes O2 and gaps 1-7):** death writes: `tabletop/roundFight.ts:515` (+ `cheatDeath` :581, used :520, :622), `travelJourney.ts:1515` and :1561 (B's file, outside the seam; run after B). New `commitDeath(state, cause, rng)` in `stateTx.ts` or `rules/death.ts`. `intentParser.ts` `parsePlayerIntent` :221 gets `targetsSelf`. `inputMediation.ts` `mediatePlayerInput` :55 (lists :22-27, 988 text :116-124) -> new `wellbeing.ts`. `customTabletopRules.ts` `formatSessionZeroForPrompt` :83 (default Line for every mode). `universalHardRails.ts:15` (+ edge mirror). The LitRPG/Story RPG `lifeline` trait goes in `defaults.ts`. PYOA (O2): a spine self-death ending routes through `commitDeath('self')`.
> - Tests: new `selfKillGuard.test.ts` and `wellbeing.test.ts` (one per mode + paraphrases + the grep test for `dead: true`); R7, R8-R16; PYOA seed `pyoa-selfkill-1`. Card wording: guide §5a (DRAFT, expert review gate).
- **Rule:** death from danger follows each mode's rules. A death the player causes **on purpose to themselves** can never end the character for good. Prevent it, or revive.
- **How it works now (traced):**
  1. `inputMediation.ts:22–27,113–135`: one word list (`GAME_PERM_SELF_KILL`, `REAL_SELF_HARM`) checks the typed text before the turn.
     - Paraphrases get through: "I open my wrists", "I walk into the fire and let it take me", "I turn my sword on myself", "drink the vial so it all ends".
     - It never sees chip choices or tool actions.
     - `ctx.hasRevivePath` is never passed by either caller (`useGame.ts:2057`, `fateAutoplay.ts:1098`).
  2. `universalHardRails.ts:15` tells the writer not to end the game this way. That's a prompt rule, and the engine doesn't enforce it.
  3. Death is written in several places with no cause recorded:
     - `tabletop/roundFight.ts:514` (it goes through `cheatDeath()` at 581, which reads the `deathRule` setting);
     - `travelJourney.ts:1524` and `1570` (they set `dead: true` directly and skip `cheatDeath`).
     - Nothing knows whether a death was self-inflicted, so nothing can stop it at the moment it happens.
- **Root cause:** the rule is enforced on the **words** going in, not on the **death** coming out.
- **Fix:**
  1. **One death point.** Add `commitDeath(state, cause, rng)` in `stateTx.ts` (or `rules/death.ts`), with `cause: 'danger' | 'self'`. Every place that sets `deathSaves.dead = true` calls it: roundFight 514, travelJourney 1524 and 1570, and any LitRPG or Story RPG defeat path. Add a grep test that fails if `dead: true` is written anywhere else.
  2. `commitDeath` with `cause === 'danger'` applies the mode's rule. For tabletop that's the existing `cheatDeath` (`srd` / `revive` / `mercy`), so road deaths now respect the setting too.
  3. *(Mercy-branch outcome superseded by the best fit 1 and design update A below.)* `commitDeath` with `cause === 'self'` never leaves `dead: true`, in any mode or setting.
     - If there's a revive path, use the revive. Otherwise use the mercy outcome: wake at 1 HP. **Reuse the `cheatDeath` mercy branch**, without the coin loss, so the player isn't punished for a safety rule.
     - The STATUS and the writer fact say the character pulled back or was saved. Never write death prose for it.
  4. **Where the cause comes from:** `parsePlayerIntent` (`intentParser.ts:221`) gets a `targetsSelf` field. It's set when the action's target is the player character: attack, cast, drink, jump or burn aimed at oneself.
     - Use the parser's structure for this (verb, target and object), not a second word list.
     - The engine passes `cause: 'self'` to anything that hurts the player in that turn. A chip or tool action with `targetsSelf` is handled the same way.
  5. Keep `inputMediation` as the **real-person** safety layer only. When text reads as real distress, crisis resources are shown.
     - John is in the UK, and `inputMediation.ts:121` only shows 988 (US). Add the UK Samaritans line (116 123), or pick the line from the player's locale.
     - That block stays; it isn't the game rule.
     - Pass `hasRevivePath` from the state, or remove the parameter once `commitDeath` owns the decision.
  6. The writer rail (`universalHardRails.ts:15`) stays as a backstop, mirrored to `supabase/functions/_shared/gm/` as before.
- **Tests (new `selfKillGuard.test.ts`, one per mode):**
  - A self-aimed attack, spell, potion or jump at 1 HP ends at HP ≥ 1 and not dead, under every `deathRule`.
  - A normal fight death under `srd` still dies.
  - A road death under `mercy` now wakes at 1 HP.
  - The grep test from step 1.
  - Add a few paraphrases: the outcome must be "not dead" even when the word list misses them.

### Order S addendum: how other games handle this, and the best fit *(researched 15 Oct 12:05)*
- **AI Dungeon:** private single-player input isn't moderated. Safety settings (Safe, Moderate, Mature) filter the AI's **output**. Content about self-harm or suicide methods is blocked from publishing, and it points to a crisis line (988 US, plus international numbers).
  - Sources: help.aidungeon.com/faq/how-does-content-moderation-work; /faq/what-are-the-ai-safety-settings; /faq/voyage-community-guidelines.
  - NovelAI: no public policy on this was found in the search.
- **CRPGs:** characters the story needs are "essential". In Skyrim and Oblivion they are knocked down and then get back up instead of dying. Morrowind lets them die but warns that "a thread of fate" is severed. Baldur's Gate 3 has no suicide action; a downed character is rescued or revived.
  - Sources: reddit.com/r/gamedesign/comments/1pbju4i; gamedev.net/forums/topic/475817; reddit.com/r/BaldursGate3/comments/19diwks.
- **MMOs:** death means respawning, with no permanent loss. This is general genre knowledge; no source was fetched.
- **Tabletop safety tools:**
  - Lines and Veils (Ron Edwards): a line is never in the game; a veil happens off-screen, with a fade to black.
  - X-Card (John Stavropoulos): stop or skip the scene, no reason needed.
  - The common advice is to treat self-harm as a Line by default.
  - Sources: linesandveils.com/about; TTRPG Safety Toolkit v2.5 (herefor.games/con/wp-content/uploads/2023/03/TTRPGSafetyToolkitGuidev2.5.pdf); a5e.tools/rules/safety-tools.

**Best fit, folded into Order S:**
1. **The character is "essential" to themselves (the Skyrim model).** A self-caused death in `commitDeath(cause:'self')` becomes a fall to 1 HP: knocked out, then waking up. There's no game over and no penalty. This replaces the mercy-branch idea in step 3. It's still prevention or revive, with no coin loss.
2. **The method is a Line, the moment is a Veil.** The writer gets an engine fact with no method detail ("Jax stopped short / came to later"). The prose fades instead of describing the act. Add `self-harm method` to the default Lines in the existing session-zero lines and veils, which already reach the writer (`customTabletopRules.ts:63-83`, `formatSessionZeroForPrompt`). Today that is tabletop-only, so add the default Line for every mode in that one function. Don't build a second list.
3. **An X-Card-style step.** After a self-caused stop, the next chips include a scene change ("Step away / Change scene"). Reuse the existing scene-change and move chips; don't add a new mechanic.
4. **Keep the real-person layer separate (the AI Dungeon model).** A real-distress check shows a helpline from the player's locale (UK: Samaritans 116 123; US: 988; otherwise findahelpline.com) and never ends or blocks the story beyond that turn. It must not be the game rule.
5. **No warnings mid-story.** The Morrowind-style "thread severed" message isn't used, because the game rule makes it unnecessary.
- **Tests (added to `selfKillGuard.test.ts`):**
  - The writer fact after a self-caused stop has no method words.
  - The next chip set contains a scene change.
  - A Line for self-harm methods is present in a new save's session zero.


### Order S design update *(John 11:46; replaces the "knocked out, not dead" step for LitRPG and Story RPG; tabletop stays as above)*
**A. Built-in protection in the fiction (LitRPG and Story RPG).** Every character has one built-in, world-fitting trait that turns a self-caused death into survival. It isn't an item to lose or sell, and it never runs out for self-harm:
- **LitRPG:** a System lifeline. One System window line, for example `[Lifeline engaged: self-termination denied. HP set to 1.]`. It fits the genre's System voice (`docs/research/from-grokbot/2026-10-litrpg/litrpg-system-screens.md`).
- **Story RPG:** a world-fitting fate charm, chosen per bible from its tone (a saint's token, an old oath, a bond with a companion). It's described once in the opening card, and when it triggers it reads as a turn of fate, not a game rule.
- **How it works:** a `lifeline` trait on the character, created with the character (`defaults.ts`), shown in the sheet or STATUS for that mode. `commitDeath(cause:'self')` checks it first. Tabletop keeps step 1 of the best fit (knocked out at 1 HP, SRD-neutral), because the SRD has no such trait and tabletop must not invent one.

**B. Roleplay is separate from welfare.** The game rule (A, and `commitDeath`) acts on the *character's action*. The welfare check (C) only looks at the *player*. They share no thresholds and never trigger each other.
- A single noble or dramatic in-fiction act ("I fall on my sword so the others can escape", a heroic last stand) is **roleplay**. The lifeline or knockout handles the death. **It isn't flagged or counted.**

**C. A lightweight wellbeing gauge, per player (never punitive, never breaks the game).**
- **What counts:**
  1. **Out-of-character, first-person distress.** The player speaking as themselves about real life ("I", "me", "my life", present tense, not framed as the character). This uses the existing `REAL_SELF_HARM` check and the in-character-framing test in `inputMediation.ts`, upgraded from a phrase list to the intent parser's speaker and target reading (the same `targetsSelf` and framing fields as step 4). Not a new word list.
  2. **Repeated self-harm themes.** Self-aimed `commitDeath` attempts, or self-harm themes in the player's own input, **3 or more within 24 hours of real time**. A single act never counts. The window and the threshold are settings, so John can tune them.
- **What it does:**
  - **Out-of-character distress:** shows the check-in at once, outside the story, as a small card. The turn carries on, and the story isn't blocked or rewritten.
  - **Repeated theme:** shows the same card once, then stays quiet for 24 hours.
  - **Card wording** (Samaritans: concise, empathetic, no assumptions, no therapy): "Just checking in: you've had a few heavy moments here. If any of this is real for you right now, you don't have to handle it alone. Samaritans (UK) 116 123, free and open 24/7, or talk to someone you trust." Buttons: [Keep playing] [See more support] [Don't show this again for 24 hours].
  - **Country helpline:** UK Samaritans 116 123 (24/7, free). US 988 (call or text). Elsewhere, findahelpline.com, or Safe In Our World's Find Help. Picked from the device locale or the user's settings country. Two or three options at most, in more than one format (call, text, web).
  - **No penalty, ever:** no account flag, no lockout, no XP or loot change, and nothing the writer sees.
  - The card says plainly that this is a game and not a crisis service.
- **Privacy (minimal data, no diagnosis):**
  - Store only a counter and the timestamps of the last 24 hours, per player, on the device, in the save meta.
  - Never store the text.
  - Nothing is sent to analytics, the writer prompt, training data (`training_ok` is forced false for those turns' player input), or support staff.
  - No risk score and no labels. The card is the only output.
  - The settings show "Wellbeing check-ins: on/off". It's on by default, and the real-distress card (C.1) can't be turned off.
  - Per 8fold/MHRA guidance, keep it to signposting only, so the feature doesn't become a medical-device function.
- **Root-cause placement:**
  - One module, `wellbeing.ts`, called from `mediatePlayerInput` (out-of-character input) and from `commitDeath` (self cause).
  - It replaces the current one-off 988 message in `inputMediation.ts:116–124`.
  - The universal hard rail and the lines and veils default (above) stay.
- **Tests (in `selfKillGuard.test.ts` / `wellbeing.test.ts`):**
  - One noble sacrifice: no card, and the lifeline fires.
  - Three self-aimed attempts in 24 hours: the card shows once. A fourth: no second card.
  - Out-of-character first-person distress: the card shows at once and the story turn still runs.
  - Locale GB shows 116 123.
  - The save holds only counts and timestamps, never text.
  - The writer prompt contains nothing from the gauge.
- **Sources:**
  - Samaritans industry guidelines: *Communicating with users in distress*, *Supporting user wellbeing*, *Reducing access to harmful content* (samaritans.org/about-samaritans/research-policy/internet-suicide/guidelines-tech-industry/).
  - Safe In Our World: games signposting, and its Four Billion Gamers campaign (safeinourworld.org; gamespress.com).
  - 8fold Governance: crisis signposting, AI limits and MHRA (8foldgovernance.com/expert-insights-crisis-signposting-in-digital-mental-health/).
  - Digital Thriving Playbook: supporting players in crisis (digitalthrivingplaybook.org).
  - Messages should be reviewed with a subject-matter expert before shipping, as Samaritans advises.


### Order S gaps from `docs/design/wellbeing-safety-guide.md` *(15 Oct 12:35)*
1. **Flags F3–F6** were missing from the gauge:
   - method seeking (card at once, plus a writer refusal);
   - farewell language (card at once, with the 999 line);
   - hopelessness (two per session);
   - age signals (lower thresholds, under-18 wording, Childline 0800 1111).
   - All of these use the intent parser's speaker, target and framing fields. Don't add new phrase lists.
2. **Output check:** add a `selfHarmMethod` class to the existing token-prose gate. A failing line is dropped and repaired as usual. Add the six never-output rules (§4) to `universalHardRails.ts` and mirror them to the edge.
3. **Helplines:** UK Samaritans 116 123, SHOUT 85258, Childline 0800 1111, 999 for danger; US 988; otherwise findahelpline.com. Replaces the US-only 988 message at `inputMediation.ts:116–124`.
4. **Data:** flagged turns get `training_ok:false` and are left out of lap and distill uploads. The gauge stays on the device only (UK GDPR Art. 9; ICO Children's Code).
5. **No risk scores or labels anywhere** (NICE NG225). No reporting.
6. **Expert review gate:** the card wording and flags need a specialist review before release (guide §8).
7. **Tests:** R8–R16 (guide §9).
8. **Legal, outside Order S. Needs John and a solicitor:**
   - (a) If comic or image mode can produce pornographic images, OSA Part 5 requires highly effective age assurance. The current self-declared "Opt-in 18+" isn't enough. Keep explicit content text-only until that's resolved.
   - (b) Any sharing, gallery, group play or user-made character feature brings SynapticGM into OSA Part 3. Do a risk assessment before it ships.


---

## P-orders: distill batch 1 failures (10:33–11:55 BST, 15 Oct; analysed 12:20)
- **Data:**
  - `scripts/fate-autoplay/runs/distill-1/*` (thumbs.json, factcheck.json, turns.jsonl). The gates were recomputed exactly as `scripts/distillCollect.mjs:80–90` does.
  - `.tmp-distill1-drive.txt`: 10 waves, 1,214 attempted, 556 passed, **658 failed**.
  - The judge for every seat is Qwen3-235B-2507.

| Seat (writer) | Attempted | Passed | **Pass rate** | Turns with a judge "down" | Turns with a judge P0 | Turns with a factCheck flag |
|---|---|---|---|---|---|---|
| **GLM-5.3 Flash** (`z-ai/glm-5.3-flash`) | 409 | 223 | **55%** (best) | 119 | 88 | 28 |
| DeepSeek V4.1 Flash | 413 | 191 | 46% | 128 | 90 | 38 |
| Qwen3-235B-2507 | 392 | 142 | **36%** (worst) | 183 | 161 | 10 |

**Failure reasons** (a turn can have several): local down 616; judge down 430; judge P0 339; factCheck 76; turnCheck P0 19.

**Inside "local down" (618 turns):**
- judge notes 354
- `repeated-habit` 188 (the only reason on 83 turns)
- judge stiff lines 317 in total
- ignored action 82
- run-pacing flags: "XP stall 15 turns" 47 and "same place N turns, no progress" 66 (the only reason on 74 turns)
- autoThumbs `repeated line` 32

**What the judge notes say:**
- repetition 197 (Qwen 102)
- invented person or thing 100 (GLM 42, Qwen 45)
- the writer plays the player 38

**Writer errors vs checker misreads:**
- **Writer errors, real (most):**
  - repetition across turns, worst on Qwen;
  - stiff, abstract or broken lines;
  - invented people or things;
  - the writer speaking or acting for the player.
- **Checker misreads:** 166 failed turns (GLM 54, DeepSeek 65, Qwen 47) failed **only** on run-pacing flags, `repeated-habit`, or factCheck person/name flags. That's an upper bound, since a few person flags are real. Fixing P-1 to P-3 would put the pass rate at about **59%** overall (722/1,214). Recompute it to confirm.
- **Best seat:** GLM-5.3 Flash passes best by 9 points over DeepSeek and 19 over Qwen. For both pass rate and cost, prefer GLM as the default distill seat. Keep DeepSeek second and drop Qwen as a writer seat. Qwen remains the judge, so this doesn't involve self-judging.

### P-1: run-pacing flags reject writer turns *(checker misread; 74 turns had this as their only reason)*
- **Cause:** `scripts/fate-autoplay/autoThumbs.mjs:136–139` pushes `same place N turns, no progress` and `XP stall N turns` into the **per-turn** `down` list, which sets `verdict:'down'`. `distillCollect.mjs` rejects on `local down`. These measure the engine's and the autoplay's pacing, not the writer's prose.
- **Fix:** move both into the run-level `circling` block that thumbs.json already has (`circling` key). They stay in report.md and are never a per-turn verdict. In `distillCollect.mjs`, base `local down` only on writer-quality kinds: an allowlist of the turnCheck and autoThumbs kinds that describe the prose. Don't add another denylist.
- **Tests:** an autoThumbs unit test where 15 turns without XP mark no turn down and add the stall to `circling`. Run distillCollect on distill-1 and the pass count rises by about 74.

### P-2: `repeated-habit` counts handed labels as habits *(checker misread; 188 turns, 83 with this as the only reason)*
> **Brief (pre-scout 12:45):**
> - Files: `src/game/turnCheck.ts` hand-made `masks` :658-672, the `repeated-habit` push :673; `completedEventPacket.ts` `compileRefEnum` :641 / `compileNounAllowlist` :552; `tokenProse.ts` `handedProperNames` :1067.
> - Now: masks cover place, character, NPC memories, hubs and routes, but not the turn's handed refs (group and meeting labels, props).
> - Change point: new exported `handedRefs(state, packet)` (REF ENUM displays + labels), placed next to `compileRefEnum`; :658 uses it in place of the array. This is the shared list for P-3, P-5 and M.
> - Tests: new turnCheck case (group label twice is not flagged; an unhanded repeat is). Replay `cursed-keep s5111` (novices). Edge: `completedEventPacket` has a `_shared/gm` copy, so mirror the helper.
- **Cause:** `src/game/turnCheck.ts:660–673` masks the place, character, NPC memories, hubs and routes before comparing 5-grams with the last three beats. It **doesn't mask the turn's handed refs**: present-person and group labels ("the two drowned rite novices"), road-meeting labels, items and props. A writer that correctly names who is still here is flagged as repeating itself.
- **Fix:** build the mask from the **same handed-ref list the writer gets** (the REF ENUM rows and labels in `completedEventPacket` and `tokenProse`), so there's one list. Reuse it here; don't extend the hand-made `masks` array. Keep the 5-gram rule for unhanded text.
- **Tests:** a turnCheck test where a present group named by its label in two beats in a row isn't flagged, and a repeated unhanded description is. Replay tape `2026-10-15T09-40-34-367Z_cursed-keep…`, which has the novices.
- **Note:** `turnCheck.ts` is game code. Run this after queue30, and check it doesn't overlap the token-gate work.

### P-3: factCheck person/name misreads *(checker misread; most of the 54 person and 3 name flags)*
> **Brief (pre-scout 12:50):** `scripts/factCheck.mjs` (appositive ~:420, `personHere` excludes `encounter:` ~:424, capitals regex with `'` :351). Uses P-2's `handedRefs` list (export it, or a JSON dump the script reads; the script can't import TS directly, so check how factCheck gets refs today).
> - Change points: :424 count `encounter:` refs and labels as here; ~:420 accept "<noun phrase>, <Handed Name>" in one clause; :351 strip outer quotes before the lookup.
> - Tests: factCheck cases s5003 T12 "stranger", s5106 T5 "Piers Dunmore", summoned-pact T15 "'Cathedral Undercroft'" (all clean); s5003 T9 "sailor" stays flagged. Scripts only, so it's safe during queue30.
- **Causes (`scripts/factCheck.mjs`):**
  1. Line ~420: a person word whose referent is handed by **apposition** ("a man in a stained apron, Piers Dunmore") is flagged. Only `called/named/known as` is understood.
  2. Line ~424: `personHere` excludes `encounter:` refs, so a road meeting's handed label ("a stranger", from `ENCOUNTER_LABEL`) doesn't count as someone here. Every "the stranger" is then flagged.
  3. Line 351: the capitals regex includes `'`, so a quoted sign ("reads 'Cathedral Undercroft'") yields `Undercroft'`, which never matches the handed place.
- **Fix:**
  1. Match a person word against **every handed person ref and its label**, meeting refs included, using the same ref list as P-2.
  2. Accept an appositive name within the same clause as naming that person.
  3. Strip the outer quote characters from a name before the lookup. Don't add more word lists.
- **Tests:** factCheck cases on the three distill quotes: salt-road-heist s5003 T12 "stranger"; gatebreak-ward s5106 T5 "man … Piers Dunmore"; summoned-pact s514x T15 "'Cathedral Undercroft'". Each should come back clean. "sailor" at s5003 T9 stays flagged, because it's a real invention.

### Order M (merges P-4): one scene ledger, generalised from the dungeon card *(root cause: long scenes lose track after 2 turns)*
> **Brief (pre-scout 12:50; 3 parts, one ledger):**
> - **Part 1, ledger + writer view:** new shared file next to `infoSheet.ts` (both `src/game` and `_shared/gm`). The type sits on `PlaceRecord` (`types.ts`). It's filled from `recordSpokenTopics` (`npcMemory.ts:763`), `extractPromisesFromProse` (`campaignMemory.ts:146`) or K's tracker, `extractSceneFacts` (`sceneFacts.ts:90`), and `hereSpotFact` (`completedEventPacket.ts:1089`). It renders as a SCENE block in `formatInfoSheet` (caps `INFO_SHEET_CHAR_CAP` :32) and replaces `pageOpeners` (:831) in the prompt (:1382-1406).
> - **Part 2, repeat gate:** `tokenProse.ts` `alreadySaidLines` :644 and `repeatsSaid` :805 read ledger `said` + Current `described`; `writerTurn.ts:415` repairs.
> - **Part 3, leapfrog + exit:** boundaries `sceneContextTail.ts` `placesDiffer` :69, encounter clear, talk end, dungeon leave (never `closeDungeon`). Current -> Previous (≤ ~200 chars, pinned items); old Previous -> `collectTurnTimelineFacts` (`timeline.ts:28`, kind 'scene').
> - Tests: new `sceneLedger.test.ts`; 12-turn talk replay; A -> road -> B leapfrog; R18, R20, R22; rainglass s5148. Dungeon tests stay green.
- **Root cause:** the writer's only memory of the current scene is the diary (`infoSheet.ts`: LAST_CAP=3, `lastLines` :127 = input + receipt only; PEOPLE shows 3 `said` lines per person, :165) and ALREADY ON THE PAGE (opening sentence of 2 beats, `completedEventPacket.ts` :831, :1382-1406). Anything said or described 3+ turns ago in the same scene is gone. P-4's repetition is a symptom of the same gap.
- **What already exists (reuse, do not duplicate):**
  - **Dungeon card** (`dungeonCard.ts`, header :1-9): an engine-owned record stored on the place record, flags flipped by the engine (`visitedNodeIds`, `opened`, `revealed`, `disarmed`), rendered to the writer each turn as one compact line by `dungeonRoomFacts` (:611; used :929). On exit, `closeDungeon` (`dungeonLifecycle.ts:97`) condenses to `PlaceRecord.arcStatus/arcSummary`, and `timeline.ts:93-100` logs enter/move/exit. **This is the pattern to generalise.**
  - **Said record (Gap 1):** `npcMemory.ts` `recordSpokenTopics` :763, `REPORTED_SPEECH` :692, `reportedClause` :749, stored as `NpcMemory.said` (`types.ts:1568`, MAX_SAID_PER_NPC=12).
  - **Position in place (Gap 2):** `hereSpot.ts` (`withinPlaceSpot` :34, `activeHereSpot`, `isOutOfTalkingRange`), fed via `hereSpotFact` (`completedEventPacket.ts:1089`).
  - **Promises / open asks:** `campaignMemory.ts` `extractPromisesFromProse` :146, `pinOpenPlayerAsk` :107, `extractSilencedSpeechFromProse` :176 (not currently in the writer packet).
  - **Scene facts:** `sceneFacts.ts` `extractSceneFacts` :90 / `mergeSceneFacts` :171. **Scene boundary:** `sceneContextTail.ts` (`placesDiffer` :69; filters after travel/clear).
  - **Timeline:** `timeline.ts` `collectTurnTimelineFacts` :28 (kind 'scene' :140), `mergeTimeline` :147 (MAX_TIMELINE_FACTS cap), `timelineFormat.ts`.
- **Repair (generalise, no new parallel system):**
  1. Lift the dungeon card's shape into a **scene ledger** on the same place record (`PlaceRecord`): `{ openedTurn, said[], promises[], threats[], clues[], asked[] (q + answered?), present[], described[], spot }`. The dungeon card becomes the dungeon case of it (its room facts fill `present`/`clues`); not a second store.
  2. **Engine-written only**, each turn, from what already runs: `recordSpokenTopics` + reported speech -> `said`; `extractPromisesFromProse` / `pinOpenPlayerAsk` -> `promises` / `asked`; `extractSceneFacts` + present NPC records -> `present`; `hereSpot` -> `spot`; the accepted beat's narration sentences (P-2 mask) -> `described` (key nouns plus the sentence, deduped). No model summary.
  3. **Writer view:** one SCENE block in the info sheet (`infoSheet.ts`), rendered like `dungeonRoomFacts`: compact lines, fixed token budget (suggest ~600 chars inside the existing INFO_SHEET_CHAR_CAP, raising it to ~2,000). Oldest `described` entries drop first; promises, threats, open questions and names are pinned (promises/deals = open commitments from Order K). This replaces ALREADY ON THE PAGE's openers-only list (`pageOpeners` :831).
  4. **Gate:** `alreadySaidLines` :644 / `repeatsSaid` :805 read the ledger's `said` **and** `described`, so repeated narration fails too (this is P-4's gate fix); existing single repair in `writerTurn.ts:415`.
  5. **Scene end** = the existing boundaries (`placesDiffer`, encounter clear, talk end, leaving a dungeon; leaving never calls `closeDungeon`, because dungeons stay open). On exit the ledger condenses in the same way `closeDungeon` writes `arcSummary` (the pattern only; the dungeon itself stays open): open promises, unanswered questions, names learned and clues go to the timeline as kind 'scene' facts (`collectTurnTimelineFacts`), plus a one-line `arcSummary`; `described`/`said` detail is dropped. Returning to the place reopens with the condensed lines only.
  6. **Leapfrogging memory (John 12:23):** the ledger keeps two slots. **Current** is the scene in full. **Previous** is compact and holds the last place plus the journey from it. Travel is its own scene: leaving A makes the road current and A previous. On arriving at B, the road and A merge into one compact Previous ("A + road to B"), and B becomes current. So in B the writer sees B, the road and A. On the next scene entry, the old Previous condenses to the timeline (step 5), Current becomes Previous, and the new scene becomes Current. Budget: Previous gets at most ~1/3 of the SCENE block (~200 of ~600 chars), holding pinned items only: open promises, threats, unanswered questions, names and clues, not `described`. Repeat gating uses Current's `described` only.
- **Both paths:** edit `src/game/*` and the mirrors in `supabase/functions/_shared/gm/` (infoSheet, completedEventPacket, npcMemory, hereSpot, campaignMemory and sceneFacts already have edge copies; **dungeonCard, dungeonLifecycle and timeline do not**). The ledger shape and renderer must live in a shared file both sides import. Check how the edge gets dungeon facts today before moving them.
- **Tests:** leapfrog replay: village A (an NPC promises something), then the road (its own scene), then village B. In B, the packet holds B in full plus a compact Previous carrying A's open promise and the road. One more scene later, A's promise is on the timeline only and is still not lost. Also a 12-turn single-scene talk replay: a name, a promise and a clue from turn 2 are still in the turn-12 packet, and a repeated description from turn 3 is dropped. Scene exit leaves only condensed timeline facts. Dungeon card tests stay green. Replay rainglass s5148.

### P-5 (repair): the name whitelist and player-voice rule have holes *(writer error)*
> **Brief (pre-scout 12:50; merges D + L5):** `tokenProse.ts` `lineNameReason` :692, `UNBOUND_ANIMATE` :73 / `lineHasUnboundAnimate` :526, `classifyTokenLine` (speaker check :795), `plainLineFactProblem` :724, `acceptTokenOrLedgerStory` :1206; `writerTurn.ts:363` repair.
> - Change points: (a) replace the `UNBOUND_ANIMATE` role-noun test with "not bound to a handed person" (P-2 `handedRefs` + M `present`); add an unhanded-object check reusing `lineHasUnhandedCarriedThing/Find`. (b) A new `pc-voice` reason in both `classifyTokenLine` and `plainLineFactProblem`. (c) D: per failing bank, find which of tt-library-2 / tt-fix-15 reclassified it.
> - Tests: D's banks (m11 B, m14, m16, m18, m22, m25, m27, m39, m42, m49, m59 fix 1 ×2); s5003 T9/T18; `pc-voice` on both paths; unhanded "papers". Mirror nothing (`tokenProse` is an edge stub).
- **Existing mechanism:** REF ENUM `compileRefEnum` (`completedEventPacket.ts:641`, rows from `compileNounAllowlist` :552), prompt "use no other names" (:1382-1406). Gate `lineNameReason` (`tokenProse.ts:692`): capitals not handed -> 'capital'; role nouns via `UNBOUND_ANIMATE` (:73, `lineHasUnboundAnimate` :526) -> 'unbound-animate'; used in `classifyTokenLine` and `plainLineFactProblem` (:724). Speaker check: speaker must be a REF ENUM person (`tokenProse.ts:795`, 'speaker-class'); repair asks never use the PC as speaker (`writerTurn.ts:363`).
- **Why it leaked:** (a) whitelist is name/role-noun only: a lowercase noun outside `ROLE_NOUNS` ("sailor" if not listed) or any invented *object* ("papers") passes: there is no object check. (b) The player guard only blocks the PC as `speaker_tok`; quoted player words inside a narration line, or "you say..." narration, are never checked, and the plain/ledger path (`acceptTokenOrLedgerStory` :1206 -> `plainLineFactProblem`) has no speech check at all.
- **Repair:** (a) replace the `UNBOUND_ANIMATE` / `ROLE_NOUNS` word-list test with a check against the handed present-people list (REF ENUM person rows + `presentNpcRecords` / Order M `present`): a person-like noun phrase not bound to a handed person fails, with no word lists; add an unhanded-object check to `plainLineFactProblem` / `classifyTokenLine` reusing `lineHasUnhandedCarriedThing`/`Find` against `handedCountText`. (b) In `classifyTokenLine` and `plainLineFactProblem`: fail a non-speech line holding a quote attributed to the PC/"you" (reason 'pc-voice'), unless the words are the player's own input; repair through the existing single request. Mirror to `_shared/gm`. No new schema slot.
- **Tests:** salt-road-heist s5003 T9 and T18 replays; unit tests for 'pc-voice' on both token and plain paths, and an unhanded "papers".

### Order K: promises, deals and agreements as one commitment, checked by the engine *(John 12:25)*
> **Brief (pre-scout 12:50; 2 parts):**
> - **Part 1, commitment record + sourcing:** widen `PromiseRecord` (`npcRelationships.ts:50`, stored :97, `upsertPromise` :225; has a `_shared/gm` copy, so mirror it). `WorldDeal` (`types.ts:553`) gets a `commitmentId`. Sourcing: `extractPromisesFromProse` (`campaignMemory.ts:146`) emits a candidate bound via the said record.
> - **Part 2, engine check + notice:** a new shared check called beside `tickWorld` (`worldSim.ts:325`; no edge copy, so find the edge caller), every 3 turns plus on events. Condition tests reuse RC-2/L1 objective matching (`questTargets.ts:80-81` after RC-2). Status lines `Promise kept|broken|expired: …` and three RULES in `systemNotice.ts:17-33` (shown via `CenterPanel.tsx:742`, `NarrativeView.tsx:204`). PYOA is gated on the story flag.
> - Tests: new `commitments.test.ts`; the Joe Bloggs replay plus variants; systemNotice rule tests; R22.
- **What exists (reuse):**
  - **Commitment record:** `PromiseRecord` (`npcRelationships.ts:50`): `madeTurn`, `dueTurn`, `description`, `status: open|kept|broken|waived|impossible`, trust deltas, beneficiaries, witnesses. Stored per NPC relationship (:97), written via the relationship event `promise` (:129, `upsertPromise` :225), and open ones are kept on summary (:299). **Nothing ever sets kept or broken today** (no code assigns either).
  - **World tracker:** `worldSim.ts` `WorldDeal` (`types.ts:553`, business deals), `applyWorldEvents` :356 (the `world-deal` event), and `tickWorld` :325 (resolves per in-game week, with `lastWeekSummary` notes). This is the periodic check.
  - **Source:** `campaignMemory.ts` `extractPromisesFromProse` :146 (PROMISE_PATTERNS :~138). Today it only adds a free-text "Open thread" consequence. Plus `pinOpenPlayerAsk` :107.
  - **Engine objective ticks:** quest-step completion pays at `sandboxXp.ts:360` (`quest-tick`). Fulfilment tests reuse its objective matching.
  - **Notices:** status lines -> `presentSystemNotices` (`systemNotice.ts:44`, LitRPG format rules :17-33; other modes show the line as-is), rendered in `CenterPanel.tsx:742` / `NarrativeView.tsx:204`.
- **Plan (one type, no parallel system):**
  1. Widen `PromiseRecord` into a **Commitment**: add `kind: 'promise'|'deal'|'agreement'`, `by: 'player'|npcId`, `to: npcId|'player'`, `condition` (an engine-checkable test: kill or defeat X, bring item Y, be at place Z, pay N gold, by day D), `checkedTurn`. Keep the existing fields and statuses (kept = fulfilled). `WorldDeal` points at its commitment by id (kind `deal`); its weekly resolution stays.
  2. **Sourcing:** `extractPromisesFromProse` emits a candidate commitment, not just an "Open thread" line, bound to the speaker and listener from the said record (Gap 1 / `recordSpokenTopics`). A condition is set only when the words map onto an engine-known target (handed NPC, item, place, foe). Otherwise the commitment stays open with no auto-check and simply expires at `dueTurn`.
  3. **Engine decides, never the writer:** a commitment check runs every N turns (suggest N=3, plus on any combat-clear, quest-tick, item-change or travel event) next to `tickWorld`'s caller. It tests `condition` against state and events (e.g. "hunt down the man who wronged Joe Bloggs" -> the bound NPC is dead or defeated). It sets kept / broken (the target is dead by another hand, or the promised item was given away) / impossible / expired (`dueTurn` passed), applies the existing trust deltas, and writes a status line.
  4. **Notice:** status lines `Promise kept: You have fulfilled your promise to Joe Bloggs.` / `Promise broken: …` / `Promise expired: …` (same for Deal and Agreement). Add three rules to `systemNotice.ts` RULES for the LitRPG format; other modes get the plain line. Not a quest notice, and no XP unless an existing rule already pays.
  5. **Modes:** on in dnd, litrpg and rpg. In PYOA only when the story/module declares commitments (a flag on the PYOA story data); otherwise extraction is skipped.
  6. **Link to Order M:** the scene ledger's pinned `promises` are this tracker's open commitments for the people present (and in Previous), not a separate list. On scene exit, open ones stay in the tracker; only a one-line timeline fact is written.
- **Both paths:** `npcRelationships` and `campaignMemory` have `_shared/gm` copies. **`worldSim` and `systemNotice` do not.** Put the commitment check in a shared file both paths import, and confirm where the edge path calls the world tick.
- **Tests:** replay: in village A, Joe Bloggs is wronged by an NPC and the player says "I'll hunt down the man who wronged you". The commitment is recorded (kind promise, to Joe, condition: that NPC defeated). Travel to B; the promise is still pinned (Order M). Defeat the NPC; within N turns the status line "You have fulfilled your promise to Joe Bloggs" appears and trust rises. Variants: the NPC killed by someone else -> broken/impossible noted; `dueTurn` passed -> expired noted; the writer prose claiming "you kept your word" changes nothing. Unit tests for the systemNotice rules and the PYOA off switch.
## Root-cause orders from the daily diff review *(15 Oct 12:40; `docs/design/daily-diff-review-2026-10-15.md`)*
### RC-1: fight outcome read from prose words
> **Brief (pre-scout 12:45; cause corrected):**
> - Files: `src/game/engineResult.ts` `terminalFightOutcome` :58 (outcome **from the engine fact**, which is correct); `WENT_DOWN` :82, `TERMINAL_WORDS` :85-87, `beatCarriesTerminalFight` :93; `terminalOutcomeSentence` :119. Users: `beatCommitGate.ts:222` (outcome missing -> append :241), `turnCheck.ts:220`.
> - Corrected cause: the outcome is already engine-decided. The word list only checks whether the **prose told it**, and each lap's new phrasing adds words.
> - Change point: at `beatCommitGate.ts:222/241`, always let the engine sentence (`terminalOutcomeSentence`) carry the outcome. The writer's words are no longer tested for it, so `beatCarriesTerminalFight` shrinks to a contradiction check only (prose says alive/won against the engine). Freeze `WENT_DOWN`.
> - Tests: `s77RootCEngineResult.test.ts`; tt-fix-14 tapes; a kill told with unlisted words is not doubled or rewritten.
- **Patch:** `engineResult.ts:83-86` `WENT_DOWN` / `TERMINAL_WORDS` (extended in tt-fix-14 a724dfaa) checks whether the writer's prose *told* the engine's outcome by matching kill words (the outcome itself is engine-decided; see Brief).
- **Root cause and fix:** the outcome already exists in engine state (encounter phase, foe HP/defeated, `encounterClearedReceipts`). Decide "finished fight" from that state. Use the word list only as a writer-contradiction check (prose says dead while the engine says alive -> drop and repair), and don't grow it further.
- **Tests:** tt-fix-14 tapes; a kill told as "the thing lay quiet" (no listed word) is still recognised.
### RC-2: quest-step verbs as word lists *(likely cause of L1)*
- **Patch:** `questTargets.ts:23-24` `SEARCH_VERB` / `TALK_VERB`, used at :80-81.
- **Fix:** use the intent parser's action class (`parsePlayerIntent`, `intentParser.ts:221`: search/look, talk/ask, etc.) and the chip's engine kind. Delete both lists.
- **Tests:** LitRPG tape `summoned-pact s5001` steps tick; a step with "examine the altar" ticks without a new word.
### RC-3: generic chips recognised by their label text *(confirmed 12:45: chips carry no kind)*
> **Brief (pre-scout 12:45; check settled):** chips do **not** carry an engine kind. `choices` is `string[]` (`types.ts:779`, `:1847`), and every builder returns `string[]` (`fightApproachChips` `fightApproach.ts:231`, `hubArrivalChoicePads` `hubEncounters.ts:582`, `graphExitPads` `mapEngine.ts:1251`, `openingOfferPads` `openingEstablishment.ts:1811`, `withJourneyPads` `travelJourney.ts:1980`, `seededLootChips` `looseItems.ts:80`). So the label regexes are the only way to know a pad is the engine's: `PURE_GENERIC_PAD` `choicePipeline.ts:361-362` and `isLegalEnginePad` :369-390 (used :423 and `choiceWarden.ts:244`).
> - Change point: the turn's engine pads are recorded when built. One `enginePadsThisTurn: string[]` is set where the choice list is assembled (choicePipeline result :980). `isLegalEnginePad` becomes membership in it, plus the existing `travel to/talk to` shapes. Delete the long regex. Don't change the `string[]` chip type (too wide).
> - Tests: banks s79, m37, m57; a reworded engine pad is still legal; an invented "Inspect the crystals" still is not.
- **Patch:** `choicePipeline.ts:372-373` label regex (`wait and watch|look around|ask a direct question|…`).
- **Fix:** tag chips with their engine kind when they are built (chipRules / tt-fix-17 engine-chip path) and test the kind, not the text.
- **Tests:** existing chip banks (s79, m37, m57) green; a reworded generic chip is still classed.
### Order N: malnutrition hold covers only malnutrition levels *(SRD 5.2.1 p.185, p.181; tt-fix-17 check)*
> **Brief:** `recoveryRules.ts` `exhaustionAfterLongRest` :158-167 (hold :165); `rules/travelDay.ts` `STARVE_DAYS` :330, `gainExhaustion`; starvation tick `travelJourney.ts:~1733` (**B's file: run after B**, outside the seam lines).
> - Now: while `daysWithoutFood >= 5`, every level is held, including Extended Travel levels.
> - Change point: count malnutrition levels separately (`character.malnutritionExhaustion`, +1 at the tick :1733, reset to 0 on a full day's food). A Long Rest removes 1 level only if `exhaustion > malnutritionExhaustion`. No new word lists.
> - Tests: `ttFix17.test.ts` (+ a mixed case: 1 travel level and 1 malnutrition level -> a Long Rest leaves 1; after eating a full day, the next rest removes it). Replay R18.
### tt-build-chipcheck (queued separately in `docs/orders/tt-build-chipcheck-order.md`; **merges RC-3**)
> **Brief (pre-scout 12:50):** the order needs "chip id/kind -> a registered resolver", but chips have **no kind today** (RC-3: `types.ts:779` `choices?: string[]`; every builder returns `string[]`). So step 0 is RC-3's per-turn engine-pad record (`enginePadsThisTurn`, set where `choicePipeline` assembles the result :980), extended to `{ text, kind }` for the turn only. Then (a) `dead-chip` = an offered chip with no kind/resolver; (b) `missing-chip-kind` = exits (`graphExitPads` `mapEngine.ts:1251`, place exits), talk per present person (`presentNpcRecords`), fight when a foe is live, the quest step (`questTargets.ts` `targetSpot` :59). Both become turnCheck flags plus fate-autoplay rows. Remove the word-based guesses (`isLegalEnginePad` :369-390, `PURE_GENERIC_PAD` :361) and log them in the tt-cut log.
> - Tests: per-flag unit tests; banks s79, m37, m57; a lap's turn rows show both flags. Runs after G and RC-3 (same chip paths).

### RC-0: widen the rule scanner *(daily diff review; script only)*
> **Brief (pre-scout 12:50):** `scripts/ruleCount.mjs` `files` list :5-20. Add `src/game/engineResult.ts`, `questTargets.ts`, `choicePipeline.ts`, `choiceWarden.ts`, `systemLog.ts`, `arcDirector.ts`, `intentParser.ts`, `inputMediation.ts`, and `scripts/fate-autoplay/autoThumbs.mjs`. Print the old 14-file TOTAL as well, so the trend line continues. No game code; safe any time.
> - Test: run it; the report shows both totals. Record the new baseline in the next stamp.
> - **Done by q31-scanner (stamp 2026-10-15l), wider than this brief:** `ruleCount.mjs` now scans every source file under `src/game` and `supabase/functions/_shared/gm` (tests and `.d.ts` excluded) and prints `OLD14` beside `TOTAL`. **Baseline for later orders (main `82cb32b4`): TOTAL files 495 / lines 167601 / regex 7366 / newRegExp 422 / lists 1194 (6317) / fns 12073.** OLD14 (13 files, `fullProseGate.ts` gone): lines 8470 / regex 847 / newRegExp 90 / lists 19 (271) / fns 1031. "ruleCount TOTAL must not rise" compares the `TOTAL` line. Scripts (`factCheck.mjs`, `autoThumbs.mjs`) are only in OLD14, not TOTAL. See `docs/orders/q31-scanner.md`.
**Order of work:** see **Audit and Dependencies** at the top (replaces the old P-1 to P-5 list). After P-1 to P-3, rerun distillCollect on distill-1 to get the true writer pass rate per seat.
