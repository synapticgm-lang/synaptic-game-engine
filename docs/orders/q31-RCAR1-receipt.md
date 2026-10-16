**RC-AR1 shipped.** Sheeted townsfolk are backed for answer repair; no more "nothing on record" while people are present.

**Cause:** `npcSheet.ts` `motiveLinesOf` required a saved `motiveLines` copy that `townsfolk.ts` never wrote; presence (sheet) and backing diverged.

**Fix:** `motiveLinesOf` derives from `memory.sheet`; deleted copy-on-create / load sheet patch; bug renamed to `no backed line for <names>`.

**Tests:** `ttRcAr1.test.ts` (AR1-a..d); `ttBuildNpcMotive` updated.

**ruleCount TOTAL:** before 163096 / 6932 / 11778 -> after 163095 / 6932 / 11778 (did not rise).

**Stamp:** `2026-10-16i`. No `gm-turn` (client npcSheet / writerTurn bug label only; neither in edge sync list).

**NEXT:** optional bank AR1-c; OP-1 / m48 stranger still needs John.

TT_DONE
