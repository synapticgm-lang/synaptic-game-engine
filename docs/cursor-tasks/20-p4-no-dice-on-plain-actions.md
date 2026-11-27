# 20 — Look, wait, rest, refuse and plain travel never roll

**Phase:** Phase 4, part C  
**Depends on:** 14  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md` first. Its global rules apply here and win over anything in this brief.

## Goal
Plain actions resolve without a roll; only actions with real risk call for a check.

## Background
Plain actions fall through to a DC 15 roll. The file that sets that default is not pinned down: search `rg -n "15" src/game/rules/dice.ts src/game/intentParser.ts src/game/rules/exploration.ts` and name it in the PR. Tabletop follows SRD 5.2 as written.

## Files you may read
- src/game/rules/dice.ts
- src/game/rules/exploration.ts
- src/game/intentParser.ts
- src/game/resolveTurn.ts (rules stage)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- the file that sets the DC 15 default (name it in the PR)
- src/game/resolveTurn.ts (rules stage only, if needed)
- the tests for that default

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- Whether to roll comes from the action id's risk, not its wording.
- No DC 15 fall-through.
- Tabletop checks still follow SRD.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 20 turns per mode: no rolls on look, wait, rest, refuse or travel, and rolls still appear for risky actions.

## Forbidden
- A verb list of 'safe' actions.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/20-p4-no-dice-on-plain-actions` from the latest `main`.
- PR title: `[20] Look, wait, rest, refuse and plain travel never roll`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
