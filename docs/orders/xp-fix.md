# XP fix (order: docs/orders/xp-fix-order.md, 14 Oct 2026)

Work: the "Cursor fix prompt" in docs/design/litrpg-xp-review.md, items 1-8. Engine-only. LitRPG and story RPG; tabletop amounts unchanged; level curve unchanged.

## Leaks

1. **First Steps for surviving 5 turns.** The `opts.turn >= 5` path is gone. First Steps pays only on the first quest step or quest completion. `src/game/sandboxXp.ts:417`.
2. **Free person XP.** The opening-cast loop is deleted, so the opening cast pays nothing. A roster or opening-card person pays only when the turn's rolled (not skipped) CHA check passed, they are here, and the line names them. `src/game/sandboxXp.ts:330`. The flag comes from `src/game/useGame.ts:4434` (`socialCheckSucceeded`, plus `discoveryCheckSucceeded` for item 3). Casual talk that skips the roll pays 0. fateAutoplay passes no check, so the harness pays no person XP.
3. **Place XP for travel.** A hub or spine place pays only when an open quest objective names it, or when a rolled INT/WIS check passed this turn (`placeEarned`). `src/game/sandboxXp.ts:267` (rule), `:276` (hub), `:410` (spine place, only the node the player is on).
4. **Spine fork pays for choosing.** The `spine-fork` pay is removed (0). `src/game/sandboxXp.ts:407`.
5. **Daily milestone.** Removed from `src/game/useGame.ts:4441` and `src/game/fateAutoplay.ts:1866`/`:1907`. The callers and imports are gone. `DAILY_QUEST_MILESTONE_XP` is 0 at `src/game/dailyMilestoneLedger.ts:10`, and it was already switched off by `DAILY_XP_RETIRED`.
6. **Arc beat double pay.** Proven: `runArcDirectorBeforeGm` declares `xpAwards` and never pushes to it, so `arcXp` in useGame and fateAutoplay is always 0 and only labels the writer packet. Character XP for fights and quests is paid once, by sandboxXp. The constraint is noted at `src/game/arcDirector.ts:741`, and existing tests already assert an empty `xpAwards`. `FAST_XP_AWARDS` now reads `LITRPG_MILESTONE_XP` (encounter 40 / miniBoss 80 / boss 150 / place 25 / person 25 / step 50 / complete 100), and the drip keys (landmarkInspect, questAccept, dailyFirstTick) are 0. `src/game/xpPolicy.ts:11`. Encounter seed `xpReward` values and beat-registry ranges follow the same table.
7. **Low-level foes.** In LitRPG and story RPG, a fight where the foe is 3+ levels below the player pays 25% (`LOW_FOE_GAP`/`LOW_FOE_SHARE` at `src/game/xpRules.ts:223-224`; applied at `:255`). sandboxXp passes the ended encounter's `level` at `src/game/sandboxXp.ts:317`. D&D still pays CR XP.
8. **Small award cap.** Person and place awards (the 25 XP kinds) pay at most 3 per in-game day (`worldLedger.clock.day`). Past the cap, the award key is spent and pays 0. `src/game/sandboxXp.ts:63` (`SMALL_XP_PER_DAY`), `:247`.

Tests: new `src/game/xpFix14a.test.ts`, one test per item (8 pass). Six older tests were pinned to the free-XP rules and now pin the new ones: `act3Sandbox`, `openingCardCompile` (both now pass a discovery check), `playtest02acSystemsFirst` (one table; accept 0), `playtest28aXpMilestone` (the hub arrival is quest-linked), `playtest28u1XpRepeats` (the place pays only when earned; the fork pays 0), and `rootGSystemOneAuthor` (no turn-5 First Steps; starts at 125 XP, and the receipt is First Kill).

## Test result

- First full vitest run: 85 failed. 10 were new against the mg4 baseline (77): 9 pinned old-rule tests, plus one real bug, a leftover `dailyMilestone` reference in fateAutoplay.
- One fix run, then full vitest: **76 failed / 2444 passed**, below the 77 baseline. None of the 10 came back.
- The only test that differed from the baseline was `seed94InfestationClear` "pays 50 XP". It is flaky and not from this change: it passed in the baseline run, in the first run, and in 4 of 4 reruns alone. It sets no System housing, so when the default state picks a housing that hides experience, the XP note is hidden. It is left as is.
- tsc (`tsconfig.app.json`): 567, the same as the baseline, with the same errors.
- Build: green.
- Stamp-pinned tests after the bump: 111 tests, 0 failed.

## Ship

- Commit: `003540e6` (pushed to main; Vercel builds from git).
- Stamp: `2026-10-14a` (index.html, public/version.json, Hud.tsx, runManifest.ts, plus the stamp-pinned tests).
- gm-turn: not deployed. No XP file is in the edge shared code.
- Not started: mode-gap 5-8, test laps, autoplay runs.

XP_DONE
