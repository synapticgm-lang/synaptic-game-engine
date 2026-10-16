# q31-mergesttn

Merged `sttn-manual` (`aefb3259`, tag manual-STT-N) into `main` with `git merge --no-ff sttn-manual`. Main was already checked out. No checkout, rebase, reset, stash, or force. Uncommitted edits in `choiceCompiler.ts`, `qualityGovernance.ts`, `pyoaSpine.ts`, and the playtest tests were not staged. The merge did not need those files, so it was not aborted.

This is a play change (the microphone shows a privacy notice once per device before speech recognition starts). Stamp `2026-10-16z12` (was `2026-10-16z11`). No edge file changed against main, so `gm-turn` was not deployed.

`docs/orders/q31-STTN.md` is not on the branch. The branch report is the commit message:

`aefb3259` manual-STT-N: speech-to-text privacy notice before first mic use. Recognition is gated in `useVoice.startListening` on a stored `sttNoticeAccepted` flag (one place it starts). CenterPanel shows the notice once per device (Use voice / Type instead focuses the input). The privacy draft gains a Voice input paragraph. Source: MDN SpeechRecognition / Web Speech API. Order STT-N, done manually (John 16 Oct 07:33).

That commit does not touch `docs/orders/tt-cut-log.md`. Main's cut log stays. This merge deleted nothing, so no new cut-log entry.

## Cause

Speech recognition started from the mic with no notice. `startListening` in `src/game/useVoice.ts` called `rec.start()` as soon as the browser supported it (`src/game/useVoice.ts:393` after the merge). The notice and the gate now share `sttNoticeAccepted` in `src/game/sttNotice.ts:24`.

## Conflicts

1. **`src/game/useVoice.ts` imports.** Main (acc-1) imports `effectiveTtsRate` and `effectiveTtsVolume` from `accessibility`. `sttn-manual` imports `sttNoticeAccepted` from `sttNotice`. Both stay. Read-aloud rate and volume still come from accessibility. Recognition still refuses to start until the notice is accepted.

`src/components/CenterPanel.tsx` auto-merged. The notice card, `onMicStart`, and the input ref sit on main's current mic button and text box. `docs/legal/privacy-policy-draft.md` took the Voice input paragraph with no conflict.

## Fix

One flag on this device (`sttNoticeAccepted` in local storage). The mic shows the card until the player chooses Use voice. Type instead focuses the action box and does not start recognition. `startListening` checks the same flag, so a later call cannot skip the notice.

## Tests

`src/game/sttNotice.test.ts` (4) passed inside the full vitest run. None of those tests failed.

## ruleCount TOTAL

Clean HEAD before the merge (worktree `.tmp-wt-mergesttn`, removed after): files 492, lines 163502, regex 6920, newRegExp 380, lists 1187 (6246), fns 11813.

The same worktree plus only `sttNotice.ts` and the merged `useVoice.ts`: files 493, lines 163544, regex 6920, newRegExp 380, lists 1187 (6246), fns 11816.

regex, newRegExp, and lists match. Files, lines, and functions rise by `sttNotice.ts` (three functions). No deletion from main.

## Gates

| Gate | Result |
|---|---|
| vitest | 107 failing / 2902 passed / 1 pending. mergeacc1 was 108 failing / 2897 passed. No `sttNotice` failure. `seed94InfestationClear` did not fail. |
| replay bank | 62 failing / 565 passed / 28 skipped (limit 64). Same failing count as mergeacc1. |
| tsc (`tsconfig.app.json`) | 552 (limit 552). None of the errors are in `useVoice.ts`, `sttNotice.ts`, or `CenterPanel.tsx`. |
| build | green |

## Replay staging (R1–R16)

None of R1–R16 is the speech notice. They stay out of this merge.

- R1 is a road-meeting brief.
- R2–R4 are dungeon-card and motive-line cases.
- R5 stays blocked: no camp tape.
- R6 stays blocked in `replay-case-staging.md` (shop price tape).
- R7 is the self-kill guard.
- R8–R16 are wellbeing flags.

## NEXT

None for this merge.

## Ship

Stamp `2026-10-16z12`.
