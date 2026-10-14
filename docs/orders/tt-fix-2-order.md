# Tabletop fix step 2 (John approved 14 Oct, 9:01 AM)
1. Read docs/orders/mode-tt-lap-3.md (its fix order and evidence) and docs/orders/tt-fix-1.md. Check existing code before adding anything.
2. Fix, in order:
   (1) Give quest steps a place or person the quest tracker (tabletopQuestProgress.ts) can read, including the cursed-keep alternative.
   (2) fateAutoplay ends play on PC death like the live game. Death saves and fight rounds count as progress.
   (3) Right-size encounters for a solo level-1 PC, using the SRD 5.2.1 encounter budget already in xpRules.ts.
   (4) Stop writers reading out the travel and quest records, or dropping or contradicting dice results. Use the existing repair and scrub layers.
   (5) Fix display names, opening place strings and doubled receipts.
   (6) The fact checker scored 100 while 36 real writer errors got through. Add checks for the main error kinds found by hand in lap 3, in the EXISTING fact checker. Do not write a new one.
3. Add a test per item. Run the tests in the shell and pass back only failures. Do at most ONE fix run. Stop and write TT_STOP if the same failure comes back twice, there is no progress, or there is a login or usage error. Do not retry. The full vitest must be no worse than the baseline, apart from the known flakes (seed94InfestationClear, playtest29uTravelGap, playtest30iFogOfWar, playtest27aRepair1).
4. If clean, ship the usual way: the next stamp after the current live one (check public/version.json and live; never go backwards). Commit only this step's files, not humanJudge.mjs or other unrelated edits. Push. If edge code changed, run the sync and deploy gm-turn. Poll https://www.synapticgm.com/version.json until it shows the stamp.
5. No laps or autoplay runs. Write docs/orders/tt-fix-2.md covering each item (what changed, with file:line, or skipped and why), the tests, the commit, the gm-turn deploy, and the live stamp. The last line is exactly TT_DONE or TT_STOP.
