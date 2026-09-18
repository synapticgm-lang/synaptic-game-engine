# Browser AI-player (watched tester)

Drives a **visible Chrome tab** (CDP `:9222`) through the real React `sendAction` a human gets. Does **not** call `fateAutoplay.callGm`.

**Do not run a quality T10 on Flash. Flash is not the judge.**

Default player-brain: OpenRouter **`google/gemini-2.5-pro`**. Never default to Flash. Set `AI_PLAYER_ALLOW_FLASH=1` only for a throwaway smoke — quality T10 must stay on Pro.

```
npm run ai-player-ensure-tester
npm run ai-player-smoke
npm run ai-player-t10
```

Do not close Chrome / do not kill `chrome.exe` when a run ends.

## Human judge (hard floor)

Code + prompt MUST vote DOWN if the GM beat is:

- telegram / ledger speak (`They have the name Jax.`, `The room waited.`)
- looping stitch / same paragraph as last GM / Fen-Reed already-told reprint
- combat resolving inside a talk/dialogue beat
- STATUS / XP / Quest Unlocked chrome with no story paragraph
- a wordy padded essay / purple pile a human would skim
- dull empty filler with no concrete HERE / action / spoken want

UP only when it reads like a **short interesting chapter beat**: clear, spoken, one new thing, not a paragraph dump.

If Who / Want was already answered this scene, the harness **ignores those chips** and types a new line.

**Natural play (why we pay for Pro):** the player is a person in the room, not a chip walker. Do not prefer a chip just because it exists. After one Inspect the panel / the same look, **type**. Temperature is ~0.85. The packet includes the last actions so it cannot “forget” a mash.

Auto Fight when the toolbar `title="Auto-resolve combat"` is live.

## Stop after 2 consecutive repeats

If the on-screen GM story matches the previous beat twice in a row, or the tester / hard floor flags **loop / identical / last-resort reprint** on two consecutive beats, the run **aborts**. It writes `REVIEW.md` in that run folder (what repeated, turns, pads, lastGm), does **not** start another T10, and leaves Chrome open. Review before `npm run ai-player-t10` again.

## Env (gitignored)

`AI_PLAYER_EMAIL` / `AI_PLAYER_PASSWORD` / `OPENROUTER_API_KEY`  
`AI_PLAYER_HOST` · `AI_PLAYER_CDP` · `AI_PLAYER_MODEL` (default `google/gemini-2.5-pro`)
