# Training-data audit (provenance backfill)

Written 15 Oct 2026 for `docs/orders/training-setup-order.md` step 3. Counts come from `scripts/backfillProvenance.mjs`, run once over the repo and the StoryForge repo. A second run changed nothing and gave the same totals.

Every saved writer row now carries `training_ok`, `teacher_model`, `provider`, `judge_model` and `mode`. Some rows also carry a `training_note` that says why they are not `true`. New rows get these fields when they are written: in `fateAutoplay` (turns.jsonl, meta.json), `autoThumbs` (thumbs.json) and `writerDataset` (dataset rows and rejections). They come from one module, `src/game/modelIds.ts`.

## Rules used

| Row | training_ok | Why |
|---|---|---|
| Claude / GPT / Gemini / Llama writer | `false` | Provider terms forbid training a competing model on the outputs |
| Fireworks `accounts/fireworks/models/deepseek-v4p1-flash` | `true` | DeepSeek V4.1 Flash weights are MIT; the id is kept as recorded |
| New seats (DeepSeek V4.1 Flash, Qwen3-235B-2507, GLM-5.3 Flash on OpenRouter) | `true` | MIT / Apache-2.0 / MIT |
| Hosted Free rows from before 15 Oct (`default` / `(hosted free via gm-turn)`) and any other deepseek id | `"pending"` | Relabelled OpenRouter DeepSeek; the exact slug is not confirmed (open item 1) |
| `deepseek/deepseek-chat` / `deepseek-v3` | `false` | DeepSeek-V3 (Dec 2024) model licence restricts use; not MIT |
| MiniMax M2.7 / M3 (free + paid) | `false` | Licence not checked for this step, so default is no |
| `stub/scan` (offline scan runs, provider `none`) | `false` | No model wrote these |
| No writer recorded and not a hosted run | `false` | Unknown teacher |
| HER-Dataset (`community_mega`, ChengyuDu0123, Manus #35) | `false` | "copyrighted novel chapters"; the dataset builders refuse this source by id |

## Licence per model

| Model id | Licence | training_ok |
|---|---|---|
| `accounts/fireworks/models/deepseek-v4p1-flash` | MIT (deepseek-ai/DeepSeek-V4.1-Flash) | true |
| `deepseek/deepseek-v4.1-flash` | MIT | true |
| `qwen/qwen3-235b-a22b-2507` | Apache-2.0 (Qwen/Qwen3-235B-A22B-Instruct-2507) | true |
| `z-ai/glm-5.3-flash` | MIT (zai-org/GLM-5.3-Flash) | true |
| `deepseek/deepseek-chat` | DeepSeek model licence (V3, restricted) | false |
| `google/gemini-2.5-flash-lite`, `gemini-2.5-pro` | Gemini API terms | false |
| `openai/gpt-5-mini`, `openai/gpt-5.4-mini` | OpenAI terms | false |
| `anthropic/claude-haiku-5.5` | Anthropic terms | false |
| `minimax/minimax-m2.7-free`, `minimax-m3-free`, `minimax-m3` | not checked | false |
| HER-Dataset rows | copyrighted novel chapters | false |

## Totals

| Store | Rows | true | false | pending |
|---|---|---|---|---|
| Lap tapes `turns.jsonl` (3,669 run folders) | 113,069 | 8,335 | 87,299 | 17,435 |
| Lap `meta.json` | 3,586 | 7 | 2,747 | 832 |
| Lap `thumbs.json` turns | 54,298 | 8,177 | 45,234 | 887 |
| `data/writer-dataset/turns.jsonl` | 10,640 | 0 | 7,100 | 3,540 |
| `data/writer-dataset/rejections.jsonl` | 317 | 0 | 224 | 93 |
| `data/writer-dataset/writer-quality.jsonl` | 18 | 0 | 0 | 18 |
| StoryForge `manus-high-quality-mega-dataset.jsonl` (HER) | 10,438 | 0 | 10,438 | 0 |
| StoryForge `storyforge-unified-sft-dataset.jsonl` (HER rows) | 10,438 | 0 | 10,438 | 0 |
| StoryForge `storyforge-weighted-student-epoch.jsonl` (HER rows) | 3,227 | 0 | 3,227 | 0 |
| StoryForge `runs/synapticgm-fate/ok_turns.jsonl` | 19,396 | 0 | 19,396 | 0 |
| StoryForge `runs/synapticgm-fate-v2/ok_turns.jsonl` | 52,326 | 0 | 52,326 | 0 |
| StoryForge `runs/synapticgm-fate-v3/ok_turns.jsonl` | 52,326 | 0 | 52,326 | 0 |

The writer dataset has no `true` rows yet. All 10,640 rows came from Gemini Flash Lite, GPT-5-mini or hosted-pending runs. The 8,335 Fireworks lap turns have not been built into it yet.

The StoryForge `ok_turns` rows (August laps) have no writer id and no run id, so they cannot be joined back to a tape. They are `false` with the note "no writer model recorded; cannot be joined to a lap tape". Some of them may be hosted DeepSeek. If the August slug is confirmed (open item 1), they still cannot be told apart from Gemini rows.

## Open items for John

1. **Pre-15-Oct DeepSeek slug (pending rows).** 17,435 lap turns, 832 run metas, 887 thumbs rows and 3,651 dataset rows are `"pending"`. They were written by hosted Free through `gm-turn`, which until today fell back to `deepseek/deepseek-chat` (DeepSeek-V3, restricted licence) when the client sent no model. The same path sometimes sent `deepseek-v4-flash` (MIT). The row does not say which one ran. **To confirm:** export the OpenRouter activity log for the lap dates, or read the `gm-turn` usage logs, and match the slug per day. If it was `deepseek-chat`, those rows become `false`. If it was V4/V4.1 Flash, they become `true`. Until then nothing trains on them.
2. **MiniMax licence.** 2,614 lap turns are `false` only because the licence was not checked. Say if you want them looked at.
3. **HER taint in earlier adapters.** The StoryForge v3-continue adapters were trained on mixes that included `community_mega`. The builders now refuse it, but adapters that already exist may carry it. Retrain from a clean mix before shipping any of them.
4. **Not backfilled:** the AM4GM `synaptic-engine` rows (separate repo) and `data/writer-lessons.jsonl` (lesson notes, not writer rows).
5. **StoryForge edits are uncommitted.** `excluded_sources.py`, the refusals in `train_unified.py` / `train_student.py`, and both configs with `community_mega` removed are in that repo's working tree.

## Breakdown by model, provider and mode

`(none recorded)` with provider `openrouter` means hosted Free rows, which are pending. `(none recorded)` with no provider means no writer was saved, so the row is false.

### lap-tapes (113069 rows: true 8335, false 87299, pending 17435)

| teacher_model | provider | mode | rows | true | false | pending | licence |
|---|---|---|---|---|---|---|---|
| stub/scan | none | dnd | 35015 | 0 | 35015 | 0 | unknown |
| (none recorded) | - | litrpg | 10039 | 0 | 10039 | 0 | - |
| (none recorded) | - | rpg | 6802 | 0 | 6802 | 0 | - |
| (none recorded) | - | pyoa | 6620 | 0 | 6620 | 0 | - |
| (none recorded) | - | dnd | 6612 | 0 | 6612 | 0 | - |
| google/gemini-2.5-flash-lite | openrouter | litrpg | 6386 | 0 | 6386 | 0 | Gemini API terms |
| (none recorded) | openrouter | litrpg | 5840 | 0 | 0 | 5840 | - |
| accounts/fireworks/models/deepseek-v4p1-flash | fireworks | litrpg | 5650 | 5650 | 0 | 0 | MIT |
| google/gemini-2.5-flash-lite | openrouter | dnd | 4653 | 0 | 4653 | 0 | Gemini API terms |
| (none recorded) | openrouter | dnd | 4168 | 0 | 0 | 4168 | - |
| (none recorded) | openrouter | pyoa | 3746 | 0 | 0 | 3746 | - |
| (none recorded) | openrouter | rpg | 3681 | 0 | 0 | 3681 | - |
| openai/gpt-5-mini | openrouter | litrpg | 3603 | 0 | 3603 | 0 | OpenAI terms |
| google/gemini-2.5-flash-lite | openrouter | rpg | 2130 | 0 | 2130 | 0 | Gemini API terms |
| accounts/fireworks/models/deepseek-v4p1-flash | fireworks | dnd | 1856 | 1856 | 0 | 0 | MIT |
| openai/gpt-5-mini | openrouter | dnd | 1184 | 0 | 1184 | 0 | OpenAI terms |
| google/gemini-2.5-flash-lite | openrouter | pyoa | 1180 | 0 | 1180 | 0 | Gemini API terms |
| accounts/fireworks/models/deepseek-v4p1-flash | fireworks | rpg | 829 | 829 | 0 | 0 | MIT |
| minimax/minimax-m3-free | openrouter | rpg | 600 | 0 | 600 | 0 | unknown |
| minimax/minimax-m3-free | openrouter | litrpg | 522 | 0 | 522 | 0 | unknown |
| minimax/minimax-m3-free | openrouter | pyoa | 450 | 0 | 450 | 0 | unknown |
| minimax/minimax-m2.7-free | openrouter | litrpg | 400 | 0 | 400 | 0 | unknown |
| minimax/minimax-m3-free | openrouter | dnd | 350 | 0 | 350 | 0 | unknown |
| (none recorded) | - | - | 291 | 0 | 291 | 0 | - |
| openai/gpt-5-mini | openrouter | rpg | 160 | 0 | 160 | 0 | OpenAI terms |
| minimax/minimax-m2.7-free | openrouter | rpg | 120 | 0 | 120 | 0 | unknown |
| minimax/minimax-m3 | openrouter | litrpg | 102 | 0 | 102 | 0 | unknown |
| minimax/minimax-m2.7-free | openrouter | pyoa | 70 | 0 | 70 | 0 | unknown |
| anthropic/claude-haiku-5.5 | openrouter | litrpg | 5 | 0 | 5 | 0 | Anthropic terms |
| openai/gpt-5.4-mini | openrouter | litrpg | 5 | 0 | 5 | 0 | OpenAI terms |

### meta.json (3586 rows: true 7, false 2747, pending 832)

| teacher_model | provider | mode | rows | true | false | pending | licence |
|---|---|---|---|---|---|---|---|
| stub/scan | none | dnd | 1807 | 0 | 1807 | 0 | unknown |
| (none recorded) | openrouter | litrpg | 459 | 0 | 0 | 459 | - |
| google/gemini-2.5-flash-lite | openrouter | litrpg | 241 | 0 | 241 | 0 | Gemini API terms |
| (none recorded) | openrouter | dnd | 202 | 0 | 0 | 202 | - |
| openai/gpt-5-mini | openrouter | litrpg | 181 | 0 | 181 | 0 | OpenAI terms |
| (none recorded) | openrouter | rpg | 102 | 0 | 0 | 102 | - |
| google/gemini-2.5-flash-lite | openrouter | dnd | 98 | 0 | 98 | 0 | Gemini API terms |
| (none recorded) | openrouter | pyoa | 69 | 0 | 0 | 69 | - |
| (none recorded) | - | litrpg | 67 | 0 | 67 | 0 | - |
| openai/gpt-5-mini | openrouter | dnd | 60 | 0 | 60 | 0 | OpenAI terms |
| (none recorded) | - | dnd | 58 | 0 | 58 | 0 | - |
| (none recorded) | - | rpg | 58 | 0 | 58 | 0 | - |
| (none recorded) | - | pyoa | 58 | 0 | 58 | 0 | - |
| google/gemini-2.5-flash-lite | openrouter | rpg | 38 | 0 | 38 | 0 | Gemini API terms |
| google/gemini-2.5-flash-lite | openrouter | pyoa | 17 | 0 | 17 | 0 | Gemini API terms |
| minimax/minimax-m3-free | openrouter | litrpg | 12 | 0 | 12 | 0 | unknown |
| minimax/minimax-m3-free | openrouter | rpg | 12 | 0 | 12 | 0 | unknown |
| minimax/minimax-m3-free | openrouter | pyoa | 9 | 0 | 9 | 0 | unknown |
| openai/gpt-5-mini | openrouter | rpg | 8 | 0 | 8 | 0 | OpenAI terms |
| accounts/fireworks/models/deepseek-v4p1-flash | fireworks | dnd | 7 | 7 | 0 | 0 | MIT |
| minimax/minimax-m3-free | openrouter | dnd | 7 | 0 | 7 | 0 | unknown |
| minimax/minimax-m2.7-free | openrouter | litrpg | 6 | 0 | 6 | 0 | unknown |
| minimax/minimax-m3 | openrouter | litrpg | 3 | 0 | 3 | 0 | unknown |
| minimax/minimax-m2.7-free | openrouter | rpg | 3 | 0 | 3 | 0 | unknown |
| minimax/minimax-m2.7-free | openrouter | pyoa | 2 | 0 | 2 | 0 | unknown |
| anthropic/claude-haiku-5.5 | openrouter | litrpg | 1 | 0 | 1 | 0 | Anthropic terms |
| openai/gpt-5.4-mini | openrouter | litrpg | 1 | 0 | 1 | 0 | OpenAI terms |

### storyforge/manus-high-quality-mega-dataset.jsonl (10438 rows: true 0, false 10438, pending 0)

| teacher_model | provider | mode | rows | true | false | pending | licence |
|---|---|---|---|---|---|---|---|
| (none recorded) | her-dataset | - | 10438 | 0 | 10438 | 0 | - |

### storyforge/storyforge-unified-sft-dataset.jsonl (10438 rows: true 0, false 10438, pending 0)

| teacher_model | provider | mode | rows | true | false | pending | licence |
|---|---|---|---|---|---|---|---|
| (none recorded) | her-dataset | - | 10438 | 0 | 10438 | 0 | - |

### storyforge/storyforge-weighted-student-epoch.jsonl (3227 rows: true 0, false 3227, pending 0)

| teacher_model | provider | mode | rows | true | false | pending | licence |
|---|---|---|---|---|---|---|---|
| (none recorded) | her-dataset | - | 3227 | 0 | 3227 | 0 | - |

### thumbs.json (54298 rows: true 8177, false 45234, pending 887)

| teacher_model | provider | mode | rows | true | false | pending | licence |
|---|---|---|---|---|---|---|---|
| stub/scan | none | dnd | 35015 | 0 | 35015 | 0 | unknown |
| accounts/fireworks/models/deepseek-v4p1-flash | fireworks | litrpg | 5571 | 5571 | 0 | 0 | MIT |
| google/gemini-2.5-flash-lite | openrouter | litrpg | 3889 | 0 | 3889 | 0 | Gemini API terms |
| openai/gpt-5-mini | openrouter | litrpg | 3603 | 0 | 3603 | 0 | OpenAI terms |
| accounts/fireworks/models/deepseek-v4p1-flash | fireworks | dnd | 1809 | 1809 | 0 | 0 | MIT |
| google/gemini-2.5-flash-lite | openrouter | dnd | 1213 | 0 | 1213 | 0 | Gemini API terms |
| openai/gpt-5-mini | openrouter | dnd | 1184 | 0 | 1184 | 0 | OpenAI terms |
| accounts/fireworks/models/deepseek-v4p1-flash | fireworks | rpg | 797 | 797 | 0 | 0 | MIT |
| (none recorded) | openrouter | litrpg | 570 | 0 | 0 | 570 | - |
| (none recorded) | openrouter | pyoa | 186 | 0 | 0 | 186 | - |
| google/gemini-2.5-flash-lite | openrouter | rpg | 160 | 0 | 160 | 0 | Gemini API terms |
| openai/gpt-5-mini | openrouter | rpg | 160 | 0 | 160 | 0 | OpenAI terms |
| (none recorded) | openrouter | dnd | 78 | 0 | 0 | 78 | - |
| (none recorded) | openrouter | rpg | 53 | 0 | 0 | 53 | - |
| anthropic/claude-haiku-5.5 | openrouter | litrpg | 5 | 0 | 5 | 0 | Anthropic terms |
| openai/gpt-5.4-mini | openrouter | litrpg | 5 | 0 | 5 | 0 | OpenAI terms |

### writer-dataset/rejections.jsonl (317 rows: true 0, false 224, pending 93)

| teacher_model | provider | mode | rows | true | false | pending | licence |
|---|---|---|---|---|---|---|---|
| google/gemini-2.5-flash-lite | openrouter | - | 113 | 0 | 113 | 0 | Gemini API terms |
| openai/gpt-5-mini | openrouter | - | 111 | 0 | 111 | 0 | OpenAI terms |
| (none recorded) | openrouter | - | 93 | 0 | 0 | 93 | - |

### writer-dataset/turns.jsonl (10640 rows: true 0, false 7100, pending 3540)

| teacher_model | provider | mode | rows | true | false | pending | licence |
|---|---|---|---|---|---|---|---|
| google/gemini-2.5-flash-lite | openrouter | litrpg | 3560 | 0 | 3560 | 0 | Gemini API terms |
| (none recorded) | openrouter | litrpg | 3540 | 0 | 0 | 3540 | - |
| openai/gpt-5-mini | openrouter | litrpg | 3540 | 0 | 3540 | 0 | OpenAI terms |

### writer-dataset/writer-quality.jsonl (18 rows: true 0, false 0, pending 18)

| teacher_model | provider | mode | rows | true | false | pending | licence |
|---|---|---|---|---|---|---|---|
| (none recorded) | openrouter | litrpg | 18 | 0 | 0 | 18 | - |
