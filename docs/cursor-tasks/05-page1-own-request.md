# 05 — Page 1 gets its own writer request; honest Try again, no hidden retry

**Phase:** Phase 2 (opening slices: live AI page 1)  
**Depends on:** 01–03  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md` and `docs/cursor-tasks/HISTORY.md` first. Its global rules apply here and win over anything in this brief.

## Goal
Every game start is live AI prose written from a dedicated opening request that never says the player already acted. On a miss, show an honest Try again instead of a silent automatic retry.

## Background
Page 1 goes through the ordinary turn packet (`buildCompletedEventPacket`), so the writer is told the player already acted. Audit 31b (automatic retry of any failed first draft, liveOpening.ts ~908-929) and 33 (`mentionsRequiredPlace`, `PAD_ITEM_NOUNS`, `TITLE_FUNCTION_WORDS`). Absorbs 'SI page 1 omits the name'. Still John's decision: second person ('you') or third person — do not change it here; keep what the save setting says. Page-1 housing rule (11 Oct): show the rule through the scene, not a stated rules line.

**Previous attempts:** see HISTORY.md H7, H6, H4. #31 found every live first draft needed the hidden retry. #33 then loosened the validators instead of fixing why drafts failed. Don't tune validator strictness as the fix: fix the packet framing (page 1 sent as a completed turn) and remove the retry. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/liveOpening.ts
- src/game/completedEventPacket.ts (only to see what page 1 must not call)
- src/game/systemPrompt.ts
- src/game/openingWriterNotes.ts
- src/game/writerTurn.ts
- src/game/useGame.ts (opening call site only)
- supabase/functions/gm-turn/index.ts (mode switch only)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/liveOpening.ts
- new: src/game/openingRequest.ts (the opening packet builder)
- src/game/useGame.ts (opening call site only)
- src/components/NarrativeView.tsx (Try again control only, if not already there)
- tests for the opening request
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- Page 1 never calls `buildCompletedEventPacket`.
- The opening request carries the PC name, place and cast ids and voice rules, with no 'player already acted' framing.
- No automatic retry; one honest Try again on a miss.
- Opening checks use refs and ids, not name strings (row 33 removed).
- Setup or origin buttons are never mixed with scene buttons.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 10 openings across LitRPG, RPG and tabletop: name present, no reply to an unsaid line, no [SYSTEM] or STATUS leak, voice holds, 4/4/3 options.

## Forbidden
- Fixed player-facing text.
- A prompt rule aimed at one bad sentence.
- A hidden retry.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit.

## Branch and PR
- Branch: `cursor/05-page1-own-request` from the latest `main`.
- PR title: `[05] Page 1 gets its own writer request; honest Try again, no hidden retry`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
