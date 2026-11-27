# 42 — One people store keyed by NPC id

**Phase:** De-dup (after brief 40)  
**Depends on:** 03, 40  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
Everything the game knows about a person (identity, role, sheet, memories, mood, whether they're pinned to the cast) lives in one store keyed by NPC id. The other stores become readers of it or are deleted.

## Background
DUPLICATION.md D9. Today: `state.npcMemories`, which has two entry shapes according to the `npcMemoryLedger.ts` header; `npcRecords.ts`; `npcSheet.ts`; `npcRoleRegistry.ts` (1,700 lines); `entityRegistry.ts` (an immutable name registry); `state.personaMood`; `castNpcIds` and `pinnedNpcNames`; and `memorableMoments.ts`. The same person can have a different name, role or memory in different stores, which is one source of wrong-speaker and re-introduction bugs (HISTORY H8, H10).

**Previous attempts:** see HISTORY.md H8, H10. Name guards and renamers were the old fix. Brief 03 moves names to cast data. This brief makes one store own the person, so no guard is needed. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/types.ts (NPC-related state types)
- src/game/npcMemory.ts
- src/game/npcMemoryLedger.ts
- src/game/npcRecords.ts
- src/game/npcSheet.ts
- src/game/entityRegistry.ts
- src/game/npcRoleRegistry.ts (search by export; don't read it whole)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/npcRecords.ts or src/game/npcMemory.ts becomes the store (pick the one most code already reads; no new parallel file)
- the other files above (delete, or reduce to readers)
- src/game/types.ts (one NPC entry type; delete the second memory shape)
- a save migration in the existing save-load path if old saves carry the old shapes (name the file in your plan; stop if there is none)
- their tests
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Acceptance criteria
- One NPC entry type, keyed by id.
- `npcMemoryLedger`'s second shape is gone.
- Old saves load (migration test).
- The PR lists every deleted store under "Duplication removed".
- Type check and lint pass. `npm run check:gm-edge` prints "edge copies match".

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, `npm run check:gm-edge`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a 20-turn game with at least three named people. A person checks that names, roles and what each person remembers stay consistent, and that nobody is introduced twice.

## Forbidden
- Leaving the old copy next to the new single source, or adding any new copy.
- Running any script, autoplay or live-drive that calls a model.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit.

## Branch and PR
- Branch: `cursor/42-dedup-one-people-store` from the latest `main`.
- PR title: `[42] One people store keyed by NPC id`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
