# Training call log (`calls.jsonl`)

q71-TRAINLOG. Logging only: no extra AI calls, no gameplay / prompt / XP change.

## Where the file lives

Fate autoplay creates `<run>/calls.jsonl` (UTF-8, no BOM, one JSON object per line, flush per row). **Owner:** `fateAutoplay.ts` (creates/truncates at run start). Hosted-Free `gm-turn` rows arrive in the response as `callLog` and the client appends them through the same owner. After the run, `autoThumbs.mjs --notes` appends `job:"judge"` rows and merges `judge_scores` onto the matching writer row in that same file.

## Job tags

| `job` | Call site |
|---|---|
| `writer` | `callGm` / `callGmDirect` / gm-turn `mode:turn` (and auto-fight) |
| `rewrite` | Writer-turn rewrite callback (`withTrainLogJob('rewrite')`) |
| `repair` | `callGmRepair` / gm-turn `mode:repair` |
| `check` | Clause-check (`callGmCheck` / `callCheckDirect` / gm-turn `mode:check`) — user prompt opens `FACTS:` + WORLD FACTS |
| `interpret` | `interpretPlayerUtterance` → `callSmallModel(..., 'interpret')` |
| `chip_gapfill` | Choice regeneration → `callSmallModel(..., 'chip_gapfill')` |
| `judge` | `autoThumbs.mjs --notes` / dual-review judge HTTP call (not during plain autoplay) |
| `untagged` | Call completed without a tag (tests fail if this appears on required paths) |

`recordCompletedChatCall` requires a `job` argument at compile time (client + edge mirror). Call sites pass the tag or `currentTrainLogJob()` inside `withTrainLogJob`.

## Judge rows (when they appear)

Plain fate-autoplay (including the 4-turn tabletop verify on free/anon) does **not** run a judge — no `job:"judge"` rows and no `judge_scores` on writer rows. Judge calls run only when:

- `autoThumbs.mjs --notes` (and optional `--pair`) after a run — each HTTP judge call is logged as `job:"judge"`, then scores merge onto the matching writer row; or
- a dual-review / Gemini paste harness that separately scores transcripts.

When those judge call sites run, they use the same `calls.jsonl` recorder (`job:"judge"`).

## Row shape (essentials)

```json
{
  "id": "uuid",
  "created_at": "ISO-8601",
  "job": "writer",
  "messages": [
    { "role": "system", "content": "…" },
    { "role": "user", "content": "…" },
    { "role": "assistant", "content": "…" }
  ],
  "teacher_model": "deepseek/deepseek-v4.1-flash",
  "provider": "openrouter",
  "tokens_in": 100,
  "tokens_out": 40,
  "tokens_cached": 0,
  "cost": 0.0001,
  "latency_ms": 1200,
  "finish_reason": "stop",
  "truncated": false,
  "lap_id": null,
  "run_id": "…",
  "save_id": "…",
  "turn_no": 3,
  "mode": "litrpg",
  "genre": "summoned-pact",
  "build_stamp": "2026-11-02c",
  "engine_facts": {
    "location": "…",
    "npcs": [{ "id": null, "name": "…" }],
    "hp": { "current": 10, "max": 10 },
    "inventory": ["Bag"],
    "options": ["Look around"],
    "dice": { "check": "Stealth", "roll": 14, "dc": 12, "result": "success" },
    "quest_flags": ["q1:active"]
  }
}
```

Keys, Authorization headers, and emails must never appear in a row.

## Repair pairs

A `job:"repair"` (and rewrite) row carries:

- `parent_id` — id of the **same turn's** writer row (scoped by `run_id` + `turn_no`; never a stale last-writer from another turn). Hosted Free: client sends `trainParentId` + turn context on the repair request; `appendTrainLogRows` re-binds to the client map. Missing same-turn writer → `parent_id: null` (reported; never silent stale).
- `draft` — flagged sentence
- `flagged_error` — why it failed
- `correct_fact` — engine fact given to the repair
- `repaired_reply` — model reply (also in `messages` as the assistant)
- `repair_pass` — usually `1`

Reconstruct from `calls.jsonl` alone: find the repair row, then the writer row whose `id === parent_id`.

## Judge scores

1. During the run: writer (and repair/rewrite/check) rows are appended.
2. `autoThumbs --notes`: each judge HTTP call appends `job:"judge"`, then merges `{ criterion: score, …, overall }` onto the writer row for that `turn_no`.

## Real players (OFF)

Browser/server `ai_traffic` with `payload.label = 'model_call'` is gated by **one setting**: `TrainLogSession.aiTrafficEnabled` (default **false**). Real players' messages are personal data; John has not approved storing them. Autoplay leaves this false unless explicitly enabled for tester traffic. Hosted `gm-turn` returns `callLog` **only** when the request body has `trainLog: true` (set only by `isAutoplayTestLabSession()` in `gmProxy`).

## Recorder

One emitter: `recordModelCall` / `recordCompletedChatCall` in `src/game/trainLog.ts` + `openRouterChat.ts`. Call sites tag the job; they do not each invent their own log format.
