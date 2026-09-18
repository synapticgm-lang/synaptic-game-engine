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

If Who / Want was already answered this scene, the harness **ignores those chips** and picks a new chip or types a new line.

Auto Fight when the toolbar `title="Auto-resolve combat"` is live.

## Env (gitignored)

`AI_PLAYER_EMAIL` / `AI_PLAYER_PASSWORD` / `OPENROUTER_API_KEY`  
`AI_PLAYER_HOST` · `AI_PLAYER_CDP` · `AI_PLAYER_MODEL` (default `google/gemini-2.5-pro`)
