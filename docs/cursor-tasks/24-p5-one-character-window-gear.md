# 24 — One character window with equip and unequip in all three modes

**Phase:** Phase 5, part D (can start any time)  
**Depends on:** None  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md` first. Its global rules apply here and win over anything in this brief.

## Goal
Gear changes by tapping in one character window in every mode; Status, Progress, Adventurer and Show stats agree.

## Background
Gear changes only by typing; the character views are read-only. UI review Q8 (one `visibleAttributes` selector) and Q18 (one wornGear display mapper so 'Body' and 'Chest' cannot drift).

## Files you may read
- src/components/CharacterWindow.tsx
- src/components/CharacterSheetView.tsx
- src/components/TabletopSheetLayout.tsx
- src/components/LitrpgSystemWindow.tsx
- src/game/rules/equipLevel.ts
- src/game/rules/encumbrance.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/components/CharacterWindow.tsx
- src/components/CharacterSheetView.tsx
- src/components/TabletopSheetLayout.tsx
- new: src/game/visibleAttributes.ts
- new: src/game/wornGearDisplay.ts
- component tests

Nothing else, and no new files except those listed.

## Acceptance criteria
- Equip and unequip by tap in LitRPG, RPG and tabletop.
- One selector and one slot mapper used by every view.
- No third inventory list.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: in each mode, swap weapon and armour by tapping, then play the next turn: the prose uses the new gear.

## Forbidden
- Narrating gear the sheet doesn't hold.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/24-p5-one-character-window-gear` from the latest `main`.
- PR title: `[24] One character window with equip and unequip in all three modes`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
