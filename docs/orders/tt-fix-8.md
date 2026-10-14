# tt-fix-8 — report

Order: `docs/orders/tt-fix-8-order.md`. Commit `8a55f995`, stamp **2026-10-14t** (after live `2026-10-14s`). Pushed to `main`. Edge synced (`questPlay.ts`, `types.ts` changed on edge) and `gm-turn` deployed; it boots (OPTIONS 200, empty POST 400 `state is required`). Live `https://www.synapticgm.com/version.json` reads `{"hud":"2026-10-14t","build":"2026-10-14t"}`. Deletions logged in `docs/orders/tt-cut-log.md` under "tt-fix-8" (restore from `e8c0e072`).

This is a play change (stamp bumped, client and edge deployed).

## 1. Step chips cut at a comma

**Cause.** A step chip was built by trimming the step sentence: `choiceRanking.objectiveChip` cut at the first comma (`OBJECTIVE_TAIL` began `/,|…`), so "Haul up the ruined, heavy bucket to examine…" became "Haul up the ruined". `objectiveStepChip` then cut long steps at a phrase word list (`OBJECTIVE_PHRASE_BREAK`, a `new RegExp`).

**Fix.** The step record carries its action. `src/data/quests/tabletopMainSpines.ts:51` `StepAction { verb, object }`, `:62` every spine has `steps` (24 spines × 2), `:650` the anchor copies them onto the step. `src/game/types.ts:418` `QuestObjective.verb` / `object`. `src/game/questPlay.ts:18` anchor type, `:820` `anchorFields` copies every set anchor field onto the quest step. `src/game/choiceRanking.ts:419` `stepChip` joins verb and object (falls back to `objectiveChip` for a step without them, e.g. an old save). Callers: `choiceRanking.ts:392`, `tabletopQuestProgress.ts:172` and `:221`, `arcDirector.ts:1331`, `sandboxXp.ts:359`. Removed: `objectiveStepChip`, `OBJECTIVE_PHRASE_BREAK`, the comma in `OBJECTIVE_TAIL` (`choiceRanking.ts:403`).

## 2. Talk turns get no answer

**Cause.** `writerTurn.repairMissingAnswer` returned the turn unchanged when nobody here had a backed line (`skipped: no backed line for anyone here`). Generated townsfolk (Rosel Coyne, Edda Merrow) have a sheet (job, place) but no lore or quest lines, so `backedAnswerFacts` was empty and the talk got silence.

**Fix.** `src/game/npcSheet.ts:214` `sheetAnswerLine` builds the person's answer from their own sheet (job and where they are — the sheet `backedAnswerFacts` reads), not repeating a line already said. `src/game/writerTurn.ts:418` the no-backed-line branch now lands that line (no writer request); `:457` `landAnswer` is the shared insert used by both paths. A failed writer repair with backed lines is unchanged (the bank pins that).

## 3. turnCheck flags legal play

**Cause.** `turnCheck.checkActionFollowed` re-read every action from its words, engine chips included: "Investigate the sludge trail" told with other verbs was `verb-swapped`; "Take a short rest" / "Walk on" were `action-object-missing` unless prose matched a motion-word regex (`MOTION_TOLD`) or, for "Check the exits", a special exits case.

**Fix.** `src/game/turnCheck.ts:143` `engineResolvedChip`: the action was on the offered menu and the engine committed it as this turn's `completedEvent.playerAction`. `:282` the word block (object-missing and verb-swapped) skips such a chip; `:440` `checkPlayerTurn` passes the offered menu. Typed lines are still read as words. Removed: `MOTION_TOLD`, the "never moves them" path, the exits special case, the `MOTION_VERB` / `handedExits` imports.

## 4. "Help them" never resolves a plea

**Cause.** On the road, "Help them" fell through `travelJourney.commitTravelStep` to the final `unchanged` return; nothing closed the plea (`roadMeetingOver` checks engaged / escaped / lost), so it stayed on STATUS and the chip came back (lap-11 run F T15–T17).

**Fix.** `src/game/travelJourney.ts:410` `answersPlea` (an open plea and its own first pad, `FIXED_ENCOUNTER_PADS.plea[0]`); `:1678` marks it `engaged` with `closedTurn` on that turn; `:920` STATUS reads "helped someone in need". The plea pads leave the menu because the meeting is over.

## 5. Main-menu Settings

**Cause.** With no save loaded, `App.tsx` passed `engineMode={'litrpg'}` to `SettingsModal`, so LitRPG-only sections (Combat pacing, Strict Encumbrance) showed as if they applied to everything and tabletop sections (Dice, Three Pillars, table rules) were hidden.

**Fix.** `App.tsx` no longer passes a mode on the main menu; `SettingsModal` `engineMode` is optional. `src/game/rules/modeProfile.ts:46` `settingScope`: with a story loaded, a mode-bound section shows only for that mode; with no save, it shows with the modes it applies to, read from the mode profiles (`label` added to each profile). Used at `SettingsModal.tsx:104-105` (Dice display · Tabletop; Combat pacing · LitRPG / Story RPG) and `CampaignSettings.tsx:23`, `:178-179` (Three Pillars and table rules · Tabletop; Strict Encumbrance · LitRPG / Story RPG / Pick Your Own Adventure). Story-only parts hide with no save: Story / Save Name and Illustrated Book Export.

## ruleCount (`node scripts/ruleCount.mjs`)

| | lines | regex | new RegExp | lists |
|---|---|---|---|---|
| before | 8618 | 866 | 90 | 23 (292) |
| after | 8618 | 865 | 90 | 23 (292) |

No total rose. Per file: `turnCheck` 740 → 739 lines, 63 → 62 regex; `writerTurn` 691 → 692 lines; `tabletopQuestProgress` unchanged. (`choiceRanking`, which lost a `new RegExp`, is not in the scanned set.)

## Tests

- New `src/game/ttFix8.test.ts` (8 tests, one block per item): midnight-well chip is "Haul up the heavy bucket" and every tabletop step has a verb and object; Rosel Coyne answers from her sheet with no writer request; an engine chip it resolved is not word-checked while the typed line still flags; "Help them" closes the plea, STATUS says helped, plea pads leave; `settingScope` labels with no save and filters with one.
- Updated to the new rule: `playtest29z4TesterTruth` (Walk on is an engine chip), `seed94RepairGaps` (dropped the motion assertion), `ttCut1` (Check the exits as an engine chip; typed still flags).
- Full vitest: 77 failing vs baseline 80, no new deterministic failures. One fix run plus one confirming rerun. The first full run had two failures not in the baseline (`phantomFight` turn back, `seed94OpeningHealthPresence` stack trace); both pass alone and passed on the rerun (that first run shared the machine with the bank, tsc and build). The rerun showed `playtest30iFogOfWar` "detects locations mentioned in narrative": it picks a random world outline and passes 2 of 4 runs on identical code (`locationDiscovery`, not touched) — a flake.
- Replay bank: 64 failing (baseline 64, same names).
- tsc: 552 (ceiling 552; none in changed code).
- Build: green.

## Leftover

- An old tabletop save whose quest steps predate `verb` / `object` still uses `objectiveChip` (now without the comma cut); a very long step with no clause break there gets no chip.
- Story RPG steps still use `objectiveChip` (out of scope: tabletop only).

TT_DONE
