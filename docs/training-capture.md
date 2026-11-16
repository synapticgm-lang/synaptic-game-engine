# Training capture (gm-turn) — format and export design

Status: **capture is built; export is design only (no export has been run).**
Table: `public.gm_turn_captures` (migration `025_gm_turn_captures.sql`). Schema version: `1`.

## 1. What gets captured, and when

* **Server-side only.** `gm-turn` writes the row after the response is built, in the background
  (`EdgeRuntime.waitUntil`). A capture failure logs `capture insert failed: HTTP <status>` (no content) and never
  changes, slows or fails the turn.
* **One row per model call.** `call_kind`:
  * `writer` — the gameplay turn (the first `mode: 'turn'` call of a player action). **Only these count as turns.**
  * `rewrite` — a later `mode: 'turn'` call in the same action (client re-run); `parent_call_id` = the writer call.
  * `repair` / `check` — sentence repair and clause check; `parent_call_id` = the writer call.
  * All calls of one player action share `root_turn_id`. The server's own re-ask (empty / reasoning-only /
    cut-off) is not a separate row: it is attempt 2 of the same call (`attempt_count`, `output_reask`).
* **Who (consent).** Decided on the server per request, never from the client:

  | basis     | who                                                                            |
  |-----------|--------------------------------------------------------------------------------|
  | `founder` | verified JWT email in `FOUNDER_EMAILS` (synapticgm@gmail.com)                  |
  | `staff`   | `public.is_staff_email` true                                                    |
  | `test`    | verified email in optional env `TRAINING_CAPTURE_TEST_EMAILS` (automated runs)  |
  | `opt_in`  | any other signed-in player with `profiles.training_capture_opt_in = true` **and** the switch at `players` |

  Anonymous / project-key-only calls are never captured (no verified user id).
* **Switch `PLAYER_CAPTURE_ENABLED`** (edge secret):

  | value                         | effect                                              |
  |-------------------------------|-----------------------------------------------------|
  | unset, or `founders` (default) | founder / staff / test accounts only               |
  | `true` / `players`            | also players who opted in                           |
  | `false` / `off`               | nothing is captured                                 |

  (The client constant `PLAYER_CAPTURE_ENABLED=false` in `src/game/playerTurnAdmission.ts` is a different,
  older client gate and is unchanged.)
* **Player opt-in** — `profiles.training_capture_opt_in boolean not null default false`
  (+ `training_capture_opt_in_at`). A trigger lets only the player themself change it; there is no UI yet.

## 2. Row fields

| field | meaning |
|---|---|
| `call_id`, `call_kind`, `parent_call_id`, `root_turn_id`, `attempt_count` | identity / family |
| `user_id`, `capture_basis` | who and why (no emails stored) |
| `session_id`, `save_id`, `campaign_id` (story name), `world_id` (campaign bible id), `engine_mode`, `turn_no` | where |
| `build_stamp`, `git_sha` | client build that made the call |
| `request_messages` | **array of attempts**, each the exact ordered `messages` sent upstream |
| `inference_settings` | array of attempts: the exact request body minus `messages` (model, provider routing, response_format / schema, n, max_tokens, sampling). No headers, no key |
| `key_source` | `server` or `player` (player BYOK key — never stored) |
| `requested_model` | model asked for |
| `served_provider`, `served_model`, `generation_ids` | from the OpenRouter completion (`provider`, `model`, `id`), not the request |
| `route_fallback` | true when any answering attempt was served by a host outside `[deepseek, wafer]`, or no host is known |
| `rights` | from `src/game/trainingRights.ts` (one host → rights table); the weakest across answering attempts |
| `finish_reason`, `completion_status` (`ok` / `empty` / `error` / `rate_limited`), `usage` | completion facts |
| `output_initial`, `output_reask`, `output_final` | first attempt text, re-ask text, text gm-turn returned |
| `player_input` | `{text, source: typed/choice/automated, choice?: {label, actionId, kind, index}}` |
| `resolved_action` | the engine-resolved action line the writer narrated |
| `engine_facts` | `state.completedEvent` (the engine packet), capped at 400k chars, else `{omitted, chars}` |
| `status` | always `candidate` on insert |

Never stored: API keys, auth headers, emails, `clientApiKey`, provider reasoning (stripped before the text is
read), the full client `state` (only the packet).

Rights table (`HOST_TRAINING_RIGHTS`), for `deepseek/deepseek-v4.1-flash` only (any other served model → `unknown`):

| served host | rights | basis |
|---|---|---|
| DeepSeek | allowed | DeepSeek terms 4.2 |
| Wafer | conditional | the **user retains ownership** of completions; may not be used to build a competing inference/hosting service |
| InferenceNet | excluded | ToS 2.2(c) |
| Z.ai | excluded | API terms restrict training other models |
| Venice | unknown | commercial scope unresolved (quarantined) |
| anything else / missing | unknown | never `allowed` |

## 3. Export format (design — matches AI Bot's contract; not run)

Output: **JSONL**, one training example per line, chat format, **ending in the accepted assistant target**:

```json
{"messages":[{"role":"system","content":"…"},{"role":"user","content":"…"},{"role":"assistant","content":"<accepted target>"}],
 "meta":{"root_turn_id":"…","call_id":"…","family":["call ids…"],"call_kind":"writer","rights":"allowed",
         "served_provider":"DeepSeek","served_model":"deepseek/deepseek-v4.1-flash","build_stamp":"…","git_sha":"…",
         "schema_version":1,"split":"train"}}
```

Rules:

1. **Admission filter** (all must hold): `status = 'accepted'` (set by later review — candidates are never
   exported); `rights in ('allowed', 'conditional')` with conditional rows only when the conditional terms are
   met for the intended use; `route_fallback = false`; `completion_status = 'ok'`; `finish_reason` not a cut-off;
   `capture_basis` still consented at export time (re-read `profiles.training_capture_opt_in` for `opt_in` rows).
2. **Messages** = the attempt that produced the accepted text: `request_messages[i]` exactly as sent, then one
   `assistant` message with the accepted target. For token-prose JSON turns the target is the accepted
   candidate's JSON (unpack `{candidates}` to the one accepted); never the reasoning.
3. **Repair families stay together.** Group by `root_turn_id`; the writer row and its `rewrite` / `repair` /
   `check` children (`parent_call_id`) go to the **same split** and appear in the file adjacently. A repaired
   writer turn may be exported either as the writer prompt → final repaired text, or as separate repair
   examples, but never split across train/eval.
4. **Deduplicate** on `sha256(normalised messages + target)`; keep the earliest row; also drop exact duplicate
   `generation_ids`. Near-duplicate removal (same prompt, different target) keeps the accepted one.
5. **Splits** by `hash(root_turn_id)` (or by `save_id` for whole-campaign hold-outs) so a family never leaks.
6. Every exported line carries `meta` with ids, rights, served host/model, build stamp and schema version so a
   later rights change can drop lines by `call_id`.
