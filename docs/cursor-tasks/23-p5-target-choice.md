# 23 — Tabletop target choice in fights

**Phase:** Phase 5, part C  
**Depends on:** 13, 22  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md` first. Its global rules apply here and win over anything in this brief.

## Goal
With more than one enemy, the player chooses the target, inside the 3-option rule.

## Background
There is no target choice. Targets attach to the attack action (a target id), not a new option count.

## Files you may read
- src/game/engineFight.ts
- src/game/finalOptions.ts
- src/components/EnemyTargetFrame.tsx
- src/game/rules/combatPresenter.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/engineFight.ts
- src/components/EnemyTargetFrame.tsx
- tests for targeting

Nothing else, and no new files except those listed.

## Acceptance criteria
- An attack carries a target id.
- Tabletop still shows exactly 3 options.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: a tabletop fight with 2 or more enemies: the right enemy is hit and named in the prose.

## Forbidden
- A second option count.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/23-p5-target-choice` from the latest `main`.
- PR title: `[23] Tabletop target choice in fights`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
