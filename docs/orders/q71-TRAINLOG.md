# q71-TRAINLOG: log every model call as a training row (logging only)
Status: READY. Logging only: no extra AI calls, no XP or gameplay change, no prompt or text change.
Queue: after AIPSETUP and before the tabletop smoke ONLY if it does not delay the mega run; otherwise queue it after the mega.

## Why
AI's Bot (training owner) needs per-call rows. Today's rows (data/writer-dataset/turns.jsonl) lack: id, created_at, job, a messages list (system prompt is not stored at all; prompt is one writerPacket string), judge_scores (only `good` + judge_model), engine_facts beyond location, and interpret / chip_gapfill / repair calls as rows. Root cause: the call sites (aiService.direct.ts callGm / gm-turn edge function, writerTurn.ts rewrite/repair, fateAutoplay.ts) log the reply and packet but not the request body actually sent.

## Change (one logging point, not per call site patches)
1. Add one recorder at the chat-body layer (`openRouterChat.ts` `openRouterChatBody` / `fireworksChatBody` callers, mirrored in `supabase/functions/_shared/gm/openRouterChat.ts`): every completed model call emits a row with
   - `id` (uuid), `created_at` (ISO), `job`: `writer | repair | rewrite | interpret | chip_gapfill | judge` (passed by the caller as a required tag; untagged calls log `job:"untagged"` and fail a test),
   - `messages`: the exact array sent (system + user) plus `{role:"assistant", content:<raw reply>}`; keys/headers never included,
   - `teacher_model` (resolved id as sent), `provider`, `tokens_in/out/cached`, `cost` (provider-reported), `latency_ms`, `finish_reason`, `truncated` (cut-off finish),
   - `lap_id`/`run_id`/`save_id`, `turn_no`, `mode`, `genre` (bible id), `build_stamp`.
2. `engine_facts` on writer/repair rows, from engine state already in hand at the call (no new computation of game rules): location, NPCs present (ids + names), PC HP/max, inventory names, options offered (chip labels), dice rolled this turn (check, roll, DC, result), quest flags.
3. Judge rows: where a judge already runs (autoplay judge / dual review), store per-criterion scores and overall as `judge_scores: {criterion: score, ..., overall}` on the judged writer row and log the judge call itself as `job:"judge"`.
4. Repair rows: `parent_id` = the id of the original writer call row (the original packet), plus `draft`, `flagged_error`, `correct_fact`, `repaired_reply`, `repair_pass`.
5. interpret and chip_gapfill calls: their own rows with their own prompts (same recorder; job tag at the call).
6. Sinks: autoplay -> `<run>/calls.jsonl`; browser/server -> ai_traffic `payload.label = 'model_call'` (staff-read only, same as writer_turn). dataset-topup reads them later (separate order).

## Tests
A. One writer turn in autoplay writes exactly one `job:writer` row whose `messages[0].content` equals the system prompt string passed to the chat body (byte-equal) and `messages[1]` the user prompt.
B. A repair writes a `job:repair` row with `parent_id` = the writer row id.
C. interpret and chip_gapfill calls each write their own row with their job tag; no row has `job:"untagged"`.
D. No row contains an API key, Authorization header, or the user's email (regex scan in the test).
E. engine_facts has location, npcs, hp, inventory, options, dice keys on writer rows (null allowed only when the engine has no value).
F. Model call count per turn is unchanged versus main (recorder adds no calls); gameplay snapshot hash of a seeded 10-turn run unchanged.
G. Truncated finish sets `truncated:true`.

## Out of scope
Prompt wording, XP, gameplay, dataset import (topup reads calls.jsonl in a later order).
