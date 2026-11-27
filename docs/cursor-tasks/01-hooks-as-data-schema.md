# 01 — Hook cards as typed data: cast, place, offer, rite, beat order

**Phase:** Phase 1 (opening slices, part A)  
**Depends on:** None  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md` first. Its global rules apply here and win over anything in this brief.

## Goal
Give every opening hook card a typed data shape so code never reads meaning out of the card's English. This is the foundation for the four opening slices (live AI page 1, concrete offer chips, scene quests, per-game names).

## Background
Hook cards, offers and rites are English sentences that code takes apart with about 20 word lists and regexes, then renames by search-and-replace. PRs #29–#45 were mostly patches of this one cause. Audit rows 15, 29, 30d–f, 31, 32, 33b–c, 38–43. This PR only adds the data shape and migrates the cards; the parsers are deleted in briefs 02–04.

## Files you may read
- src/data/campaigns/types.ts
- src/data/campaigns/ (the hook / opening card files only)
- src/game/types.ts (opening and cast types only)
- src/game/openingInstance.ts
- src/game/liveOpening.ts
- src/game/openingRite.ts
- src/game/openingEstablishment.ts (offer and rite sections only)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/data/campaigns/types.ts (add the hook data types)
- src/data/campaigns/ hook / opening card data files (migrate to the new shape)
- src/game/openingInstance.ts (minting fills ids from data, not text)
- new: src/game/openingHookData.test.ts (data-shape tests only)

Nothing else, and no new files except those listed.

## Acceptance criteria
- Each hook has: cast[] (id, role, pronouns, durability), place (id, kind), offer items[] (id, label, carryable), rite steps[] and beat order[].
- Minting a new game fills ids and per-game names from data; no search-and-replace over card text.
- No new regex over English, word list, or name list. No campaign- or NPC-specific branch.
- Old fields kept only until briefs 02–04 delete their readers; no `_v2` or duplicate type.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: start 5 new games across two campaigns. A person reads page 1 and the journal: names differ between games, pronouns are right, no card sentence appears word for word.

## Forbidden
- Reading meaning out of hook, offer or rite English.
- Adding any name or word to a list.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model for the first message (plan the data shape and list the cards), then Auto for the edits.

## Branch and PR
- Branch: `cursor/01-hooks-as-data-schema` from the latest `main`.
- PR title: `[01] Hook cards as typed data: cast, place, offer, rite, beat order`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
