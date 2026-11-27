# 22 — Keep the whole pasted sheet; features, spells and XP to SRD 5.2 as written

**Phase:** Phase 5, part B  
**Depends on:** 21  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
A pasted sheet keeps everything; level features, spells above level 1 and XP follow SRD 5.2 as written.

## Background
A pasted sheet keeps 6 picks; rules stop around level 4–5; only level-1 spells exist; tabletop XP is unfinished. Absorbs 'Tabletop XP' and 'Tabletop reference comparison'. SRD data: src/data/srd/srd521.json. Kobold Press is left out (John, 27 Nov). The free CC-BY/CC0/ORC library is on the bot box, not in the repo; do not add it here.

**Previous attempts:** see HISTORY.md H15. Your PR must say how this approach differs from those attempts.

## Duplication to remove
DUPLICATION.md D8, D15. `defaults.ts:~98` hard-codes `dnd ? 300 : 150`, a copy of `xpRules.ts:DND_LEVEL_THRESHOLDS[1]` and `xpPace.ts:L1_BAR`. Make it call `dndXpToNext` / `levelBar` instead (`src/game/defaults.ts` and `src/game/rules/xpPace.ts` may be read and changed for this only). Spells and level features come from `srd521.json` only: don't add a second spell or feature table.

## Files you may read
- src/data/srd/srd521.json (search by key; do not read the whole file)
- src/game/rules/spells.ts
- src/game/rules/advancement.ts
- src/game/rules/classFeatures.ts
- src/game/characterXp.ts
- src/game/customExpertDraft.ts
- src/components/ExpertCustomPanel.tsx

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/rules/spells.ts
- src/game/rules/advancement.ts
- src/game/rules/classFeatures.ts
- src/game/characterXp.ts
- src/game/customExpertDraft.ts (keep all picks)
- tests that compare level tables with the SRD data

Nothing else, and no new files except those listed.

## Acceptance criteria
- A pasted level-3 rogue keeps Expertise and every pick.
- Level tables 1–20 and spell lists match the SRD data.
- XP follows SRD (no quest-step XP house rule).

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: paste a level-3 rogue and play to level 5: features and prose reflect the sheet.

## Forbidden
- House rules John hasn't approved.
- Kobold Press or other OGL 1.0a content.
- The phrase 'Dungeons & Dragons'.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit. Split by class group if large.

## Branch and PR
- Branch: `cursor/22-p5-full-sheet-srd-xp-spells` from the latest `main`.
- PR title: `[22] Keep the whole pasted sheet; features, spells and XP to SRD 5.2 as written`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol, or "none" and why), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
