# 29 — Model profiles, a per-save language setting, and a 30-scenario conformance set

**Phase:** Phase 8, part B  
**Depends on:** 28  
**Who does it:** Cursor, in a fresh chat  
**Gate:** The 5-model live check spends OpenRouter credit: John's go and a price first.  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
Each supported model has a profile (reasoning, budget, schema support). Replies are no longer emptied for containing another script; a per-save language setting decides. A 30-scenario conformance set is defined, to run before a model is marked supported.

## Background
Audit G5 (`hasHanScript` empties the reply, openRouterChat.ts ~238), G6 (silent re-ask with `NO_REASONING_HINT`, gm-turn/index.ts ~554). No Fireworks or Gemini profiles. Removing the server Gemini fallback is brief 37 and needs John's go.

**Previous attempts:** see HISTORY.md H6. A silent re-ask was added on 28 Sep (28l). Retries hid the cause each time (H6), and a broken deploy's retries cost money on 28 Oct. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/openRouterChat.ts
- supabase/functions/gm-turn/index.ts
- src/components/OpenRouterModelPicker.tsx
- src/game/writerContract.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- new: src/game/modelProfiles.ts
- src/game/openRouterChat.ts
- supabase/functions/gm-turn/index.ts
- src/components/OpenRouterModelPicker.tsx
- new: scripts/conformance/ (scenario definitions only; do not run them)
- the 2 hasHanScript tests (rewrite)
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- No script-detection filter.
- No silent re-ask; reasoning-only replies handled by the profile.
- Language is a save setting.
- No Fireworks or Gemini profile.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: with John's go only: 5 models from different makers, 10 turns each, read by a person.

## Forbidden
- Running the conformance set from Cursor.
- Using an OpenRouter key.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit.

## Branch and PR
- Branch: `cursor/29-p8-model-profiles-language` from the latest `main`.
- PR title: `[29] Model profiles, a per-save language setting, and a 30-scenario conformance set`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol, or "none" and why), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
