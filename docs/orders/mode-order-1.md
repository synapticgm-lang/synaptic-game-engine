# Mode test runs 1 (Synapticgm, 13 Oct). Stage 2: the pipeline targets are met.
No code fixes, commits or ships in this order.
1. On main (build 2026-10-13l), run fate-autoplay T20 for --game-mode rpg and --game-mode tabletop, seeds 150 and 151, with the same 3 writers as multi-order.md (DeepSeek default; google/gemini-2.5-flash-lite and openai/gpt-5-mini via --writer openrouter --writer-model). That's 12 runs. Use the matching bible for each mode if summoned-pact is LitRPG-only; note which bible you used.
2. Fact-check every run, and count all flags and real writer errors separately (multi-order.md rule).
   A place, person or item counts as invented only when it is absent from that turn's writer prompt (`writer-prompts/turn-NN.txt`) and absent from an earlier page. "Nobody met" means no encounter; the road can still have a place. Quote the prompt line when calling something invented. The factCheck exit-place and name flags are the first source.
3. Score the tabletop runs against the checks in docs/design/synapticgm_tabletop_mode_research_v1_1.md. For each check, mark pass, fail or not exercised, with turn evidence. For RPG, list where it plays the same as LitRPG and where it should differ.
4. Rank the top roots per mode (layer, owner file, smallest fix), but do not implement them.
5. Record the cost per mode and per writer, and the OpenRouter balance. STOP rules as multi-order.md (usage or login error, a mode run crashing twice the same way, balance under 1 USD).
Write docs/orders/mode-result-1.md. Last line exactly MODE_DONE or MODE_STOP.

## Writer seats for build-time laps (John, 15 Oct, 09:54; training-setup-order.md step 1). This OVERRIDES every older seat list below and in multi-order.md.
Laps use ONLY open-licence "training" writers through OpenRouter (John approved OPENROUTER_API_KEY for this). The Fireworks DeepSeek, gemini-2.5-flash-lite and gpt-5-mini seats are DROPPED.
- The 3 seats (ids pinned in `src/game/modelIds.ts` `TRAINING_SEATS`; run with `fate-autoplay --seat <key>`):

| `--seat` | OpenRouter id | Model | Licence | Price per 1M tokens (in / out), 15 Oct |
|---|---|---|---|---|
| `deepseek` | `deepseek/deepseek-v4.1-flash` | DeepSeek V4.1 Flash | MIT | $0.024 / $0.72 |
| `qwen` | `qwen/qwen3-235b-a22b-2507` | Qwen3-235B-A22B-Instruct-2507 | Apache-2.0 | $0.09 / $0.55 |
| `glm` | `z-ai/glm-5.3-flash` | GLM-5.3-Flash | MIT | $0.15 / $0.50 |

- Still 6 runs: 2 per seat, one with a random ready-made card start and one with a full build start.
- Record the model id OpenRouter returns (`teacher_model` on every row), not the seat key.
- Judge for training-data filtering (autoThumbs `--notes`): `qwen/qwen3-235b-a22b-2507` (Apache-2.0), from `TRAINING_JUDGE_MODEL`. Gemini is no longer the judge.
- HARD CAPS: **1 USD per lap** (all runs and judge calls together); **STOP if the OpenRouter balance is under 10 USD** (check before the lap and after each run). Either one is a lap stop.
- Per-model writer error tables have the columns DeepSeek V4.1 Flash, Qwen3-235B and GLM-5.3-Flash. Keep older laps' numbers as history, marked "Fireworks DeepSeek / flash-lite / gpt-5-mini (dropped 15 Oct, 09:54)".

## Writer seats for tabletop laps (John, 15 Oct, 07:17; SUPERSEDED at 09:54 by the section above, kept as history)
- The 3 seats are: (1) Fireworks free tier through the live gm-turn function: `fate-autoplay --writer default --ai-tier free` (the key stays server-side; no key is needed on the laptop); (2) google/gemini-2.5-flash-lite; (3) openai/gpt-5-mini. The OpenRouter DeepSeek seat is DROPPED.
- Still 6 runs: 2 per seat, one with a random ready-made card start and one with a full build start.
- Record Fireworks' model as the actual server model id gm-turn returns (accounts/fireworks/models/deepseek-v4p1-flash), not "default". If meta.json or turns.jsonl still say "default", read the id from the gm-turn response and note the gap (laps are record-only).
- If Fireworks is blocked (weekly cap, anonymous limit, 401/403/429), record it, append it to docs/orders/needs-john.md, run those 2 runs on flash-lite instead, and carry on. That is not a lap stop.
- Per-model writer error tables have the columns Fireworks, flash-lite and gpt-5-mini. Keep the older laps' DeepSeek numbers as history, marked "OpenRouter DeepSeek (dropped 15 Oct)".
