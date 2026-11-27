# 41 — Mode rules live in the mode profile, not in inline mode checks

**Phase:** De-dup (after Phase 4)  
**Depends on:** 13, 16, 19  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
Mode-dependent numbers and switches (option count, XP table, starting XP bar, dice shown, fight style) are fields on `rules/modeProfile.ts`, and the files in this brief read the profile instead of testing `engineMode` inline.

## Background
DUPLICATION.md D7 and D8. `modeProfile.ts` says "a profile only decides how those numbers reach the player", but there are 956 `engineMode` references in 194 files, and many decide behaviour inline. Examples: `defaults.ts:~98` hard-codes `dnd ? 300 : 150`, `xpRules.ts:MODE_XP` is a second mode table, and `openingEstablishment` (14 direct checks), `gmVoiceProfile` (9), `systemPrompt` (8) and `choiceRanking` (8) branch on mode themselves. Brief 13 already makes one function own the option count. Here the count's number moves into the profile.

**Previous attempts:** see HISTORY.md H1 (count set in many places). Do it as a pure move with no behaviour change, file by file. Don't add a second profile or a mode-helper module beside `modeProfile.ts`. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/rules/modeProfile.ts
- src/game/finalOptions.ts (from brief 13)
- src/game/xpRules.ts (MODE_XP only)
- src/game/rules/xpPace.ts (levelBar only)
- src/game/defaults.ts
- src/game/characterXp.ts
- src/game/choiceRanking.ts (search `engineMode`)
- src/game/gmVoiceProfile.ts (search `engineMode`)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/rules/modeProfile.ts (new fields)
- src/game/finalOptions.ts (read the count from the profile)
- src/game/xpRules.ts (fold `MODE_XP` into the profile and delete it)
- src/game/defaults.ts (read the starting bar from xpRules/xpPace via the profile)
- src/game/characterXp.ts
- src/game/choiceRanking.ts
- src/game/gmVoiceProfile.ts
- their tests
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Acceptance criteria
- `rg "'dnd' \? 3 : 4|dnd' \? 300 : 150"` finds nothing.
- `MODE_XP` is gone, and the profile holds those switches.
- The PR reports the `engineMode` reference count before and after, and lists the remaining inline checks by file as follow-up candidates. Don't fix them here.
- No behaviour change: the same seed gives the same state before and after (test).
- Type check and lint pass. `npm run check:gm-edge` prints "edge copies match".

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, `npm run check:gm-edge`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): one 15-turn game per mode: option counts exact, XP bar right at level 1 and after the first level-up, and the prose unchanged in tone.

## Forbidden
- Leaving the old copy next to the new single source, or adding any new copy.
- Running any script, autoplay or live-drive that calls a model.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/41-dedup-mode-profile-one-source` from the latest `main`.
- PR title: `[41] Mode rules live in the mode profile, not in inline mode checks`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
