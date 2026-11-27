# 35 — One toast stack, Themes Save bar, one currency formatter, honest merchant header

**Phase:** Interface quick repairs  
**Depends on:** 34  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
Toasts and the save indicator share one stack; the Themes Save bar does not cover tiles; prices use one currency formatter; the merchant header and Salvage buttons follow real state.

## Background
UI review Q9 (honesty), Q10, Q11, Q12 (display), Q15, Q17. A glossary (R8) is a display source only, never a filter.

**Previous attempts:** none found in HISTORY.md.

## Duplication to remove
DUPLICATION.md D19: one toast stack and one currency formatter. Delete the copies.

## Files you may read
- src/components/ToastStack.tsx
- src/components/AutoSaveIndicator.tsx
- src/components/MerchantWindow.tsx
- src/components/CapacityPackShop.tsx
- src/components/SettingsModal.tsx (Themes tab)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/components/ToastStack.tsx
- src/components/AutoSaveIndicator.tsx
- src/components/MerchantWindow.tsx
- new: src/lib/formatCurrency.ts (only if no formatter exists)
- src/components/SettingsModal.tsx (Themes tab only)

Nothing else, and no new files except those listed.

## Acceptance criteria
- Toasts readable, no overlap.
- The Save bar never covers tiles.
- One currency shown.
- No dead Salvage buttons.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: a person clicks through the live site.

## Forbidden
- Hard-coded copy that disagrees with behaviour.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/35-ui-toasts-themes-currency` from the latest `main`.
- PR title: `[35] One toast stack, Themes Save bar, one currency formatter, honest merchant header`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol, or "none" and why), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
