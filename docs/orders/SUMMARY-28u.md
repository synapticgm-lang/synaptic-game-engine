# SUMMARY 28u

## JOB 28u1 (commit aacfc4d, stamp 2026-09-29u1)
Each fix is engine-side and applies across the game (live `useGame` and Fate both go through the same owners).

- **(1) Thornferry main path gave no XP.** Milestone XP (`applySandboxXpAwards`) only paid for named outdoor hubs, quest-journal ticks, encounters and significant people. The spine walk *is* Thornferry's main quest, but it is none of those, so XP stopped after meeting Wren (50 XP, L1 in every 28s run). The same function now pays from the spine state, and each award pays once (idempotent keys): the first arrival at each spine place (significant place, 25), each major fork decided (quest step, 50), and reaching an ending (quest complete, 100). This covers any spine bible, not only Thornferry. A full Thornferry walk now pays about 400 XP.
- **(2) Place names and character lines repeated.** `runWriterTurn` flagged a recycled draft and asked for one revision, but a revision that still recycled was committed anyway, and the revision note never said *which* lines were reused. Three changes in the shared writer turn:
  - The revision note now quotes up to 3 reused sentences.
  - New `finishCommittedProse` runs on the beat that commits. It drops sentences already told in the last 8 GM beats, including a spoken line said again (`trimRecycledSentences`), as long as at least 2 sentences stay. A beat that is entirely reprint stays as written.
  - New `mentionVariety.ts`: within one beat, a full ledger label is named once and later mentions take its short form. "The Quiet Bell chapel" becomes "the chapel" and "Wren Holt" becomes "Wren". Titled names ("Magistrate Pell"), proper-name places ("West Wall") and shared first names stay whole. It works from the ledger refs only, with no word lists of story content.
- **(3) Proactive fix: article glue around painted labels.** `repairLabelArticles` fixes "the mud-rutted The road east" → "the mud-rutted road east", "the Wren Holt's" → "Wren Holt's" (for person/companion refs) and "Holt 's" → "Holt's".
- Vitest playtest28u1XpRepeats (5). No edge-shared files changed (gm-turn redeployed per the gate).
- Gates: the first run failed on one new vitest fail, the `countPlayerIntentStreak` `< 50ms` wall-clock check in playtest02dHangDebug. That code was not touched and the test passes when run alone, so it was timing under full-suite load. The fix run (unchanged rerun) passed: tsc=601, vitest fails=128 new=0, build 0, deno 52, T10 P0=0 runs=3. Push and deploy OK.

## T50 test (stamp 2026-09-29u1)
- 6 runs × 50 turns: hosted Free writer through `gm-turn`, Fate pick mode, seed 58, loop auto-stop on. autoThumbs (model-free) ran on each finished run. Modes are the harness `--ai-agent-mode` values. Thornferry plays as pyoa, summoned-pact as litrpg. Logs: docs/orders/t50-28u-logs/. Metrics script: docs/orders/t50-metrics.ps1.
- Stitched/fallback turns: 0 in all 6 runs (E_fallback 0).
- "Recycle flags" = readability-gate `recycle-painted` + `verbatim-repeat` hits (28s seed 56 in brackets).

| Run | Turns | Mean turn ms | No-progress | Thumbs up/down/unclear | Places | Level | Recycle flags |
|---|---|---|---|---|---|---|---|
| Thornferry maxlevel | 14 (ending accepted) | 4478 | 50% | 5/3/4 | 6 | L3 (was L1) | 1 (1) |
| Thornferry storyfollower | 9 (ending accepted) | 4691 | 33% | 6/1/1 | 5 | L3 (was L1) | 1 (4) |
| Thornferry completionist | 14 (ending accepted) | 3241 | 57% | 6/2/3 | 5 | L3 (was L1) | 1 (3) |
| SP s58 maxlevel | 50 | 5172 | 54% | 15/5/6 | 9 | L3 | 3 (7) |
| SP s58 storyfollower | 50 | 6027 | 52% | 16/6/9 | 10 | L4 | 5 (13) |
| SP s58 completionist | 50 | 5482 | 56% | 14/7/8 | 8 | L3 | 2 (10) |

Seeds differ from 28s (58 vs 56), so the brackets are a trend, not a matched A/B.

Notes:
- **Thornferry (all 3):** standout: XP now lands on every spine step. For example, maxlevel: T4 streets, T5 road east plus a fork, T6 mill hamlet, T7 ford, T10 Highmark gate plus a fork, T11 fork plus the ending. That reaches L3 (400 XP) in all three. Each run ends cleanly on the accepted ending at T9–T14 (the 28t1 stop), and no-progress is down from 76–83% to 33–57%.
- **Thornferry maxlevel (wrong):** T6 reprints the T4 loft beat almost word for word. Every sentence matched, so the trim left it whole by design, and the writer ignored the named-lines revision. Article glue that the repair missed: "the Wren Holt's trade" (T12; Wren was not in that turn's ref list), "where The road east" (T5; label-initial "The" after a word that is not an article), and "No the two people here" (T14). The spine label "mill loft before Wren finds you" reads as a place.
- **SP (all 3):** standout: Brother Tam's repeated "seventh ring dumped you into bread-steam" line (a verbatim repeat in all 3 of the 28s runs) is gone. The recycle flags left are mostly "You leave X and reach Y" arrival beats on repeat trips (the arrival stamp is added after the writer turn, so the trim never sees it) and bell-tower scenery reused on return visits. storyfollower reached L4, with 5 combat receipts per run.

Leftover (not fixed, the one fix run is used): the article repair only knows this turn's refs (not npcMemories/companions outside the ref list), and misses label-initial "The" after prepositions and "No the …" glue. The travel-arrival stamp is not covered by the recycle trim. An all-reprint beat still commits when the revision also reprints.

ALL DONE
