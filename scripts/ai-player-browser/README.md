# Browser AI-player (watched tester)

Drives a **visible Chrome tab** (CDP `:9222`) through the real React `sendAction` a human gets. Does **not** call `fateAutoplay.callGm`.

**Do not run a quality T10 on Flash. Flash is not the judge. Never default to Flash.**

Default player-brain: OpenRouter **`deepseek/deepseek-v4-pro`** (`player_licence: open`).  
Documented alternative: **`qwen/qwen3-235b-a22b-2507`**.  
Override with `AI_PLAYER_MODEL`. Provider prefixes `anthropic/` / `openai/` / `google/` / `x-ai/` are **restricted** → run is `testerOnly` and never admitted to training.

```
npm run ai-player-ensure-tester
npm run ai-player-smoke
npm run ai-player-t10
node scripts/ai-player-browser/run.mjs --persona dungeon-diver --goal "max out dungeon levels"
node scripts/ai-player-browser/run.mjs --persona tradesman --goal "take up a trade and open a shop"
```

Do not close Chrome / do not kill `chrome.exe` when a run ends.

## Persona + life-goal

`--persona <id>` loads `personas/<id>.json`. `--goal '<text>'` overrides the file goal. The player prompt carries persona, goal, and the last actions. The model returns `{ action, kind: 'chip'|'free', thumb, reason }`.

## Thumbs + verify

After each judged GM beat the harness presses the real UI thumb with the player's one-line `reason` as the comment (`submitThumb`), then reads `gm_response_feedback` back with the **tester session** (anon key + `ai-player@synapticgm.com` login — never the service role). Logs `verified=true|false` per turn.

## Tags

- Tester account: `ai-player@synapticgm.com`
- Harness save ids: `aitest-…`
- Every turns.jsonl / feedback meta: `{ source: 'ai-tester:<model>', input_author: 'ai-player', player_model, player_licence }`

## Play log

Each run folder gets `play-log.md`: per turn, 2–3 short sentences (wanted / did / happened) plus thumb and reason.

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

Auto Fight when the toolbar `title="Auto-resolve combat"` is live.

## Stop after 2 consecutive repeats

If the on-screen GM story matches the previous beat twice in a row, or the tester / hard floor flags **loop / identical / last-resort reprint** on two consecutive beats, the run **aborts**. It writes `REVIEW.md` in that run folder, does **not** start another T10, and leaves Chrome open.

## Env (gitignored)

`AI_PLAYER_EMAIL` / `AI_PLAYER_PASSWORD` / `OPENROUTER_API_KEY`  
`AI_PLAYER_HOST` · `AI_PLAYER_CDP` · `AI_PLAYER_MODEL` (default `deepseek/deepseek-v4-pro`)  
`VITE_SUPABASE_URL` · `VITE_SUPABASE_ANON_KEY` (feedback read-back; never service role at runtime)
