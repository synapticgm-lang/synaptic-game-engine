# tt-fix-3 — report (14 Oct)

## Why the sentence checks missed lap 4

The checks were wired correctly. The writer turn runs in the browser for live play (`useGame.ts:3058`) and in autoplay (`fateAutoplay.ts:1345`), both through `runWriterTurnWithFightRetry` → `repairRejectedSentences` → `sentenceGateProblems` (`beatCommitGate.ts:179`) → `engineFactProblems`. Hosted `gm-turn` only carries the model call, so it was never the gap. Lap 4 also logged 4 repairs, which shows the gate ran.

The misses had four causes:

1. **The patterns were too narrow.** A travel leg only matched "first leg of the journey", and a posed choice only matched "had to decide whether". Nothing caught "the choice waited", "the decision loomed", "Jax decided / felt certain…" (the writer settling the PC's mind), or a quest step said as "still waits for someone to…". The roll check also did not count a death-save turn ("You are dead", "your breath falters") as a turn where the PC cannot act. So a sword swing on that turn was not flagged.
2. **Only one kind of problem was repaired per draft.** `repairRejectedSentences` sent only the sentences that matched the draft's first problem. Sentences with a second kind of problem stayed on the page.
3. **The game and the checker each had their own copy of the patterns.** `scripts/factCheck.mjs` kept hand-copied versions that had already drifted from the game's.
4. **The checker never saw a quest step.** The packet writes `- quest Title — step: …` with an em dash, but the checker's regex wanted a hyphen. Every step-leak and quest-title check read an empty list.

**The fix:** one import-free pattern module, `src/game/engineFactPatterns.ts`. The game gate (`engineFactGate.ts`) and the checker (`factCheck.mjs:18`, loaded directly by Node) both import it, so a fix to a pattern applies in play, in autoplay and in the review tool together. The checker's quest regex now accepts an em dash. The repair step now sends every failing sentence in its one request.

**Replay of lap 4's 41 writer errors** (A–F, s341–s354), through the gate and through the checker:

| | Gate | Checker |
|---|---|---|
| Before | **1 / 41** | **2 / 41** (C10, F8) |
| After | **26 / 41** | **26 / 41** |

The gate count was measured before one pattern was restored (see Tests below). That restore only adds matches; the checker, which uses the same patterns, re-measured 26/41 after it.

Still missed (15): A1 and A3 are whole-beat problems that `turnCheck` already raises as P0. B2 and E8 are doubled names, fixed at paint time (repeat item 2). The other 11 (C1, C8, D3, D6, E1, E2, E3, E7, F2, F5, F6) are invented details, contradictions, broken wording or unquoted speech. These are outside the engine-fact checks.

On all 6 lap-4 runs, the checker raised 16 more flags of the new kinds beyond the 41. I read them all; each is a real record read-out or posed choice. I found no false positives.

## 1. Sentence checks: one pattern source, every problem repaired

- `src/game/engineFactPatterns.ts` (new) holds the shared patterns:
  - travel record (`:18–35`, including "leg one" and "travelled for N minutes")
  - posed choice (`:39`)
  - PC agency (`:52`)
  - fight rolls, now counting death-save and dead turns (`:64`)
  - roll contradiction (`:81`)
  - quest step leak, including obligation wording like "still waits / must" (`:124`)
  - quest title named in narration (`:143`)
- `src/game/engineFactGate.ts:26,63,84`: a new `PC_AGENCY` problem; `engineFactProblems` = record, choice, agency, roll.
- `scripts/factCheck.mjs:18,226–235`: imports the shared patterns; the quest-step regex accepts an em dash.
- `src/game/writerTurn.ts:411`: every sentence failing any of the draft's problems goes in the one repair request. `:454`: a record read-out that cannot be rewritten stays when it is the only sentence naming where the player went.
- `src/game/completedEventPacket.ts:1353`: the hook slot asks for something seen or heard now — never a choice, a decision, a task still to do, or time passing.

## 2. Repeats

- **Sword swings on death-save turns:** the shared `fightRolls` (`engineFactPatterns.ts:64`) treats "You are dead / breath stops / breath falters" as a turn where the PC cannot act, so a swing fails with `ROLL_CONTRADICTION`.
- **Death-save false positive:** `turnCheck.ts:268` — a downed or dead PC owes no blow, so an attack chip on a death-save turn is not an ignored action.
- **Doubled names ("Edda Merrow Merrow", "@t1, the Broken Gate"):** `tokenProse.ts:1074` `typedNameHead` drops a typed surname or place tail that belongs to the token's own display name.
- **Opening place strings becoming places:** `placeNames.ts:50` `dropTimeOfDay` is applied in `openingPlaceRecord` (`:126`) and in the `shortPlaceName` fallback (`:111`). "Greyhollow mill lane at dusk" becomes "Greyhollow mill lane".
- **Dungeon opening through the barred Keep Gate:** `enterInterior.ts:39` — an examine chip never opens the interior; only going in does.
- **Doubled kit clothes / "Travelling clothes" as a name:** `tabletop/characterBuild.ts:942` drops the kit's clothes when the PC is already dressed. `inventory.ts:37` makes sentence-case kit names read lowercase in prose; Title Case names keep their capitals.
- **DeepSeek beats over 100 words:** `completedEventPacket.ts:274,1360` puts the 100-word cap in the tabletop packet. `writerTurn.ts:207,217` `capBeatWords` enforces it after repair: whole trailing sentences drop, while the first two sentences, any spoken line and the destination sentence stay.

## 3. New engine errors

- **Escape "lost the trail":** `engineResult.ts:90–91` — the `escaped` wording accepts "lost the trail / track / scent", "lost track of…" and "left them behind".
- **Tabletop level skills:** `skillGates.ts:164` — a tabletop level-up records the level and grants no skill rank and no LitRPG "you can now" line (class features come from the sheet).
- **XP from a guessed CR:** fight XP no longer falls back to CR 1/4.
  - `xpRules.ts:103,304`: no real CR means 0 XP, with the reason `NO_CR_XP_REASON`.
  - `rules/srdMonsters.ts:149` `realEncounterCr`: the card's CR, else the name-matched SRD block's CR, else none.
  - Used at `engineFight.ts:77` (which writes `XP: none (… — reason)` to STATUS), `sandboxXp.ts:250,323` and `useGame.ts:5663`.
  - Road thugs now pay from the SRD Bandit block: CR 1/8, 25 XP each.
  - `DND_DEFAULT_CR` remains only for engine stat-block numbers, never for XP.
- **Trap roll hidden from STATUS:** the old receipt, `Dungeon: trap check — d20 … vs DC …`, did not match the engine check line format, so `systemLog.isNoisySystemLogLine` (`:61`, `d20 … dc`) dropped it. `dungeonCard.ts:489` `rollLines` now writes `Trap check: d20 2 + 1 vs DC 13 — failure` (the format STATUS keeps), then the result line, then `HP: 10 → 5` (`:771`). Dungeon searches use the same lines. LitRPG and story RPG still show results only.

## Tests

- `src/game/ttFix3.test.ts`: 17 tests, one or more per item — shared patterns, gate/checker parity on an em-dash packet, multi-problem repair, the record read-out keep, death-save gate and `turnCheck` false positive, doubled names, time-of-day place, examine vs enter, clothes dedupe and `kitRefDisplay`, `capBeatWords`, "lost the trail", tabletop `grantLevelSkills`, real-CR XP and the no-CR reason, and trap STATUS.
- `src/__tests__/replayBank/mode2.bank.ts:87`: the thugs pin now expects CR 1/8 = 50 XP; no "default" CR line anywhere.
- First full vitest run: 78 failed. Against the tt-fix-2c run, 3 were new: the known flakes `playtest30iFogOfWar` and `seed94InfestationClear`, plus `ttFix2` item 4. That last one broke because the shared travel pattern had lost "travelled for thirty minutes" and "leg one".
- **One fix run:** restored that pattern (`engineFactPatterns.ts:19,23`).
- Final full vitest: **76 failed of 2574**. The only new name against baseline is the known flake `playtest30iFogOfWar`; the `openingEstablishment` flake passed this time.
- tsc (`tsconfig.app.json`): **570**. Build: green. The 24 stamp-pin suites pass on `2026-10-14h`.

## Ship

- Stamp: **2026-10-14h**. Live was 2026-10-14g.
- Commit: `7a48828d` (49 files; not `humanJudge.mjs`, `playtest-notes.mdc`, `.gitignore`, the other doc edits or `.tmp*`). Pushed to `origin/main`.
- Edge sync: `node scripts/sync-gm-edge-shared.mjs` changed `_shared/gm/completedEventPacket.ts`, `engineResult.ts` and `inventory.ts`. Committed with this report.
- Deploy: `npx supabase functions deploy gm-turn` — "Deployed Functions."
- Live: `https://www.synapticgm.com/version.json` showed `{"hud":"2026-10-14h","build":"2026-10-14h"}` 60 s after the push.
- No laps run.

TT_DONE
