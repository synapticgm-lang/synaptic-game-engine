# 26 — Speech and quotes carry speaker and quote ids

**Phase:** Phase 6, part B  
**Depends on:** 25  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md` and `docs/cursor-tasks/HISTORY.md` first. Its global rules apply here and win over anything in this brief.

## Goal
Speech is a typed beat with a speaker id; quote recall uses quote ids, not first-four-words matching.

## Background
Audit 23 (sceneBlock.ts ~200, quote recall by 8 turns plus first four words), 37b (intentParser.ts ~712-736, 85% word-overlap echo filter), and `stripUnauthorizedNpcSpeech`.

**Previous attempts:** see HISTORY.md H10. proseWarden was retired on 27 Oct and 'Warden v2' re-added a final-prose repeat guard on 31 Oct. An 85% echo filter followed on 13 Nov. Don't add any new post-filter or warden. Speaker and quote ids replace them. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/sceneBlock.ts
- src/game/intentParser.ts
- src/game/writerTurn.ts
- src/game/spokenAnswer.ts
- src/game/factGate.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/sceneBlock.ts
- src/game/intentParser.ts
- src/game/writerTurn.ts
- src/game/spokenAnswer.ts
- related tests
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- Quotes are recalled by id.
- No word-overlap echo filter.
- Unauthorised speech is caught by speaker id.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 20 dialogue-heavy turns: no echoed lines, quotes recalled correctly.

## Forbidden
- Word-overlap or phrase heuristics.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/26-p6-speech-and-quote-ids` from the latest `main`.
- PR title: `[26] Speech and quotes carry speaker and quote ids`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
