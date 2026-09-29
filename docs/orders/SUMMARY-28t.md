# SUMMARY 28t

## JOB 28t1 (commit 46997cb, stamp 2026-09-29t1)
- The client already stopped: `sendAction` refuses input and the ActionBar is hidden once `playPhase` is 'ended'. Fate did not. The 28s Thornferry snapshot had `playPhase: ended` + `endingAccepted: 1` at T20, yet the loop kept playing T21–T25 on "Choose the risky fork" / "Face the crisis now".
- Fix: the Fate loop checks `playPhase === 'ended'` before each turn and stops (`PLAY ENDED` in meta `fatal`; a resumed ended save also stops at once). `resolveOfferedChoices`, the one place every pad goes through (ActionBar, the GM log `offeredChoices`, Fate's pick), returns no pads once play has ended, so leftover crisis/spine/fallback pads close. Deleted the compiler's post-ending "Look around" refill, which could no longer be reached.
- Vitest playtest28t1PlayEnded (3). No edge-shared files changed (gm-turn redeployed per the gate). Gate thresholds set to tsc ≤ 601 / deno ≤ 52.
- Gates: tsc=601, vitest fails=128 new=0, build 0, deno 52, T10 P0=0 runs=3; push + deploy OK on the first run (no fix run used).
