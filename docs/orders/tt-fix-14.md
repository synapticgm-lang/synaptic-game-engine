# tt-fix-14 - overnight root-cause round (lap 18)

Read: `mode-tt-lap-18.md`, lap 17 report, `tt-fix-13.md`. Tabletop (cursed-keep) taped; fixes sit at shared points (all three tested modes).

## Items picked and why

1. **N5: road nudge from "someone nearby" with nobody here.** The generic hub nudge always invented a speaker. Playability: the player is told a person is talking on an empty road.
2. **N11: a finished kill rewritten.** Lap 18 A T14: the first draft "the blade struck the @t6, killing it" was flagged as missing the fight's outcome. The retry then gave a vaguer "three quick strikes". Of the 18 fight retries in recent runs, 10 were false positives of this kind (killing / dying / lying still) and 8 were true positives.
3. **N10: the writer's speech flattened to `X said, "…"`.** Every narrated speech line ("Look there," Tilde said softly, and pointed at the third grave…) was repainted as a bare `Tilde Rudd said, "Look there."`. The gesture and the said-tag were lost, so every beat read the same.

Skipped as repeats, written to `needs-john.md` with evidence and both attempts:
- N1 (fifth lap) together with N4 (the "someone in need" label);
- N2 (step completes without its object);
- N9 (answer repairs paste text).

Not picked: N3, N6 (dropped token lines get no repair; too much counted-file code for this budget), R1, N8.

## Cause and fix

### 1. A nudge needs someone here to say it (N5)
- **Cause:** `src/game/choiceRanking.ts:312` hard-coded "someone nearby mentions <hub>" no matter who was present.
- **Fix:** `choiceRanking.ts:311-312`. The speaker is the first present NPC record (`presentNpcRecords`). With nobody here, the hub source gives no nudge and the rotation moves on.

### 2. "killing it" / "lying still" are the fight's outcome (N11)
- **Cause:** `src/game/engineResult.ts:83,86`. `WENT_DOWN` / `TERMINAL_WORDS.victory` knew "killed" but not "killing" / "dying", and "lies still" but not "lying still". So `beatCarriesTerminalFight` missed a finished kill, and `ignoresTerminalFight` sent a good draft back to the writer.
- **Fix:** the same regex alternatives now include `lying still` and `dying|killed|killing`. No new rule; the edge copy was synced.

### 3. The writer's own speech sentence paints when it passes the checks (N10)
- **Cause:** `src/game/tokenProse.ts:893`. `renderTokenBeat` always rebuilt a speech line as `@tN said, "<words>"`, throwing away the writer's tag and narration even when they were clean.
- **Fix:**
  - `readSpeechLine` (`tokenProse.ts:202-203,217`) keeps the whole sentence as `written` when the tag is the speaker's own and real narration follows the said-verb.
  - The render paints `written` (`:893`).
  - `acceptTokenOrLedgerStory` (`:1234`) clears `written` when that sentence fails `classifyTokenLine`, so the quote still paints alone.
  - The words stay the line's `text` for the said-lines and repeat checks.
- **Fix run 1 found** that painting the sentence unchecked dropped s79 T5 "You came back." (`speech:unbound-animate` on a simile). The fallback above closed it.

### Offset (keep ruleCount level)
- `src/game/writerTurn.ts` deleted its own `sentenceCount` (same body as `tokenProse.storySentences`, now exported). Line 127 uses `storySentences`. Logged in `tt-cut-log.md`.

## ruleCount (`node scripts/ruleCount.mjs`)

| | lines | regex | newRegExp | lists (entries) | fns |
|---|---|---|---|---|---|
| before | 8506 | 862 | 90 | 20 (274) | 1045 |
| after | 8506 | 860 | 90 | 20 (274) | 1045 |

## Tests

- New `src/game/ttFix14.test.ts` (6):
  - empty-road nudge, and the nudge with a present NPC;
  - "killing it" / "lying still" carry the victory; a draft with no outcome still asks for a retry;
  - the narrated speech line paints as written; a bare tag and a typed speaker still paint `X said, "…"`.
  - 4 failed on the old code; all pass now.
- `ttCut1.test.ts` (c): the nudge now pins a present person (it used to pin "someone nearby").
- Fix run 2 (the last):
  - **Vitest:** 78 failing of 2722, the same names as the tt-fix-13 baseline, plus `playtest30iFogOfWar` "detects locations mentioned in narrative". That test is seed-random: on the same tree it failed 2 of 4 solo runs. It seeds a random world atlas and none of the changed files are involved.
  - **Replay bank:** 64 failing of 628, no new names.
  - **tsc** (`-p tsconfig.app.json`): 552.
  - **Build:** green.
  - Stamp-pinned tests: 254 pass.

## Ship

- Commit `a724dfaa`, pushed to main. Stamp `2026-10-15a` (HUD / BUILD / index.html / version.json / runManifest / pinned tests).
- `humanJudge.mjs`, `needs-john.md` (untracked, as in earlier rounds) and `.tmp-*` files were not committed.
- Edge: `sync-gm-edge-shared` synced `engineResult.ts`, and `--check` says the copies match. `gm-turn` is deployed; OPTIONS returns 200.
- https://www.synapticgm.com/version.json → `{"hud":"2026-10-15a","build":"2026-10-15a"}`.
- No laps.

TT_DONE
