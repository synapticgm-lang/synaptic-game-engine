# SynapticGM Cursor task pack

Written 27 November 2026 (Europe/London) by Synapticgm from the living plan, "SynapticGM plan to get the game running" (Grok Bot Page f581bcfa). Main was `9ab6b311` when this pack was written. Line numbers in the briefs come from the 16 Nov patch audit and may have moved, so find code by its name, not its line number.

## Read CODING.md, HISTORY.md and DUPLICATION.md first (John, 27 Nov)

At the start of **every** brief, every Cursor chat reads these three files before the brief:
- **`CODING.md`**: how to code here. It has John's **House rules for Cursor** (tidy coding, token efficiency and loops, approval gates, money and secrets, the never-touch path, wording), then root cause first, test first, verify before "done", and the one-source rule. Every brief has a `Method: follow CODING.md` line.
- **`HISTORY.md`**: every earlier attempt at each recurring problem and why it came back. Only move forward.
- **`DUPLICATION.md`**: every known duplicate (logic, data, rules, facts, counts), its single source, and the brief that removes it.

From HISTORY.md:
- In the plan (the 3–6 lines before editing), name the ledger entries the brief touches.
- **The PR body must have a "How this differs from earlier attempts" section.** Name each matching ledger entry and say in one or two lines why this change won't repeat it.
- **Never reintroduce removed code.** That includes proseWarden or any final-prose "warden", stitch banks, fallback prose, hidden retries or re-asks, option cooldowns, streak caps, filler pools and phrase recognisers, under any name. If the fix seems to need one of them back, stop and report.
- **Two strikes:** if the brief's problem matches a ledger entry whose approach has already failed twice, and your plan is the same approach, stop and report. Don't retry it.
- **No loops:** one fix attempt per failing check. If the same check fails again, stop. Never run an autoplay, gate or watch loop to "keep fixing until green".

## How to use this pack

1. **One fresh Cursor chat per brief.** Never carry on with a second brief in the same chat.
2. In the new chat, @-mention this README, CODING.md, HISTORY.md, DUPLICATION.md and the brief, for example `@docs/cursor-tasks/00-README.md @docs/cursor-tasks/CODING.md @docs/cursor-tasks/HISTORY.md @docs/cursor-tasks/DUPLICATION.md @docs/cursor-tasks/01-hooks-as-data-schema.md`, and say "Do this brief."
3. **Model:**
   - Use **Auto** (or a cheaper model) for routine edits, searches, renames, deletions and test rewrites.
   - Use the **top model** only to plan a change (the first message of a brief marked "Top model to plan"), or when the same error comes back after a fix. Then switch back to Auto.
4. **Read and change only the files the brief names.** `.cursorignore` on main keeps build output, `node_modules`, assets, large data and logs out of context. Respect it, and don't @-mention ignored folders.
5. Before you edit, Cursor states its plan in 3–6 lines: the goal, the exact files, and how it will check the work.
6. Finish with **one PR for this brief**, named as the brief says. **Never merge and never deploy.** Synapticgm reviews and merges one PR at a time. A gm-turn deploy needs John's yes.
7. Tick the box in the checklist below in the same PR (`[ ]` → `[x]` means the PR is open, not merged). Synapticgm marks it merged.

### Stop and report (don't push on) when:
- the problem matches a HISTORY.md entry whose approach has failed twice, and your plan is that approach again;
- your fix would bring back something HISTORY.md says was removed;
- the brief needs a file it doesn't list (name the file and the reason);
- the same error comes back after one fix (switch to the top model once; if it comes back again, stop);
- the only way to pass looks like a word list, phrase regex, name list, special case, timer or canned text;
- the change would add a second copy of logic, data, rules or facts, or a hand-written edge twin (see DUPLICATION.md);
- a secret, API key, OpenRouter call, payment, live game or deploy seems needed;
- the change would touch PYOA prose, or would grow past roughly 600 changed lines (propose a split instead);
- a brief's background turns out to be wrong about the code (report what you found).

## Global rules (every brief inherits these, and they win over the brief)

**House rules.** John's house rules for Cursor are in `CODING.md` ("House rules for Cursor"), and they apply to every brief alongside the rules below.

**One source, no duplication (John, 27 Nov)**
- Never add a second copy of logic, data, rules, facts, constants, prompt text or a validator, under any name. Find the single source in `DUPLICATION.md` and extend it.
- If a copy is truly unavoidable (the Deno edge runtime can't import `src/`), it must be generated from the source by a script, with a check that fails on drift. No hand copies. The PR must justify it.
- Every PR has a **"Duplication removed"** section listing each copy it deleted (file:symbol), or "none" with a reason. A PR that adds a copy fails review.
- When a brief touches a file listed in `DUPLICATION.md`, it deletes the copies listed for that brief.

**Fix the root cause**
- Root-cause fixes only. Name the failing layer (screen, network, AI output, database, or the code that owns the wrong fact) before changing anything.
- Phrase- or case-specific patterns fail review. That covers a new regex over English words, a word, name or verb list, a check for one NPC, quest or campaign, fixed player-facing text, a turn threshold, or a hidden retry. Removing these is always welcome.
- Tests that pin a broken rule get deleted, not kept green.
- Follow the existing structure and naming. Leave no `_v2`, `_new`, `_old` or copy files. Delete dead code, debug logs and temp files you created. Keep one source of truth for config and data. Make small commits that say what changed and why.

**Game rules**
- Every game start is live AI prose. No fixed opening pages and no fallback text.
- Quests adapt to the story, and names and places change between games.
- LitRPG and RPG get exactly 4 options and tabletop gets exactly 3. One function owns the count.
- Origin and setup are their own step before turn 1. Setup buttons never mix with scene buttons.
- No safety timers, backstops, turn thresholds, streak caps, or cooldowns that remove an option. Repeated options stay on screen and are only ranked lower (John, 27 Nov). There is no 5-turn cooldown.
- Free text always works, including speech in fights.
- Tabletop follows SRD 5.2 as written, with no house rules John hasn't approved.
- Never use the phrase "Dungeons & Dragons" (or a D&D mark) in the product.
- No pixel art. CC0 assets are fine.
- Kobold Press / OGL 1.0a content stays out (John, 27 Nov). The game uses the free CC-BY, CC0 and ORC library already collected.

**Models, money and secrets**
- No Fireworks. No Gemini.
- Use OpenRouter only when John says so. Cursor never runs a script, autoplay, live-drive or test that calls a paid model.
- Never print, echo, log or commit a secret. Use env vars only, and don't rotate the OpenRouter key.
- Spend nothing. John is on a tight budget.
- No Cursor cloud agents.

**Data and training**
- Training capture is opt-in and defaults to OFF for other players. Strip credentials, personal information and provider reasoning.
- Leave PYOA prose untouched without John's go. PYOA is excluded from training.
- Never touch `C:\Users\littl\OneDrive\Documents\synapticgm\game\project`. If that's the folder open in Cursor, only make the brief's edits on its branch, and never move, delete, clean (`git clean`, `reset --hard`) or back up that folder. Backups go to Google Drive, never OneDrive.
- Bought assets (for example the GameDev Market UI kits) need the no-extraction line in the terms (brief 11), and are never exposed as a download.

**Proof**
- Offline tests, unit builds and scripts are a sanity check only. They never prove a fix.
- The real check is a short live game on www.synapticgm.com (or the PR's Vercel preview, if one exists), focused on prose and read by a person. Synapticgm or John runs it after review. It costs about a penny per 20 turns.
- The paid 40-turn run in all 3 modes happens once, after phases 1–4 (and R9) are merged, and only with John's yes (brief 38).
- **Acceptance needs a person-read live game.** A person (Synapticgm or John) plays it and reads the prose of every turn checked, and counts the options on every turn: exactly 4 in LitRPG and RPG, exactly 3 in tabletop. Tests, replay banks, gate counts, fact-check pass rates and autoplay runs never count as acceptance on their own (HISTORY.md H4). A brief is not ticked as merged until that read is written up.
- Never claim more than was checked.

**Edge twins**
- Many `src/game/` files have generated copies under `supabase/functions/_shared/gm/` (157 files on `9ab6b311`, 16 of them hand-written stubs that brief 39 removes). Never hand-edit those copies, and never add a new hand stub. Run `npm run sync:gm-edge` and check with `npm run check:gm-edge`. A PR that changes `supabase/functions/` needs a gm-turn deploy, and that needs John's yes.

**Sanity commands** (allowed, but not proof): `npm run typecheck`, `npm run lint`, `npx vitest run <files>`, `npm run check:gm-edge`.

## Naming
- Branch: `cursor/<NN>-<slug>`, taken from the latest `main`.
- PR title: `[NN] <brief title>`.
- PR body: a "How this differs from earlier attempts" section (HISTORY.md entries), a "Duplication removed" section (DUPLICATION.md), "Structural decisions" if any (Synapticgm copies them into the project FACTS.md on the box, so don't create a FACTS.md in the repo), evidence pasted from fresh sanity runs (CODING.md section 3), the root cause and failing layer, the files changed, what was deleted, the sanity results, what the live check should look at, and "gm-turn deploy needed" when `supabase/functions/` changed.

## Order and checklist

Work top to bottom, and only start a brief once its dependencies are merged. The de-dup briefs 39–46 (27 Nov) are placed in order below, so the list is not in number order. The R9 briefs (15–17) are their own phase alongside phase 3 (John, 27 Nov). Interface quick repairs (34–35) and gear swap (24) can slot in any time they don't share files with an open brief. Gated briefs wait for John's yes.

- [ ] **01** [Hook cards as typed data: cast, place, offer, rite, beat order](01-hooks-as-data-schema.md) — Phase 1 (opening slices, part A)
- [x] **02** [Offers and rites read from data; delete the offer and rite parsers](02-offers-and-rites-as-data.md) — Phase 1 (opening slices, part B: concrete offer chips)
- [x] **03** [Per-game names and pronouns from cast data; delete the renamer and name guards](03-cast-names-pronouns-as-data.md) — Phase 1 (opening slices, part C: per-game names)
- [x] **04** [Opening scene quests come from the hook's beats, not text](04-scene-quests-from-hook-data.md) — Phase 1 (opening slices, part D: scene quests)
- [x] **05** [Page 1 gets its own writer request; honest Try again, no hidden retry](05-page1-own-request.md) — Phase 2 (opening slices: live AI page 1) — *gated: John's yes*
- [x] **06** [Delete canned fallback prose; speech rendered once as a typed beat](06-remove-canned-opening-text.md) — Phase 2 (no canned text) — *gated: John's yes* — *slices 1–2 open*
- [x] **07** [Campaign-name mojibake: fix the encoding at the source and stop storing the date in the save name](07-campaign-name-mojibake.md) — Small fix (Interface Q1)
- [ ] **08** ['Rogue,.' display bug: find the real cause, then fix it there](08-rogue-comma-display.md) — Small fix (diagnose first)
- [ ] **09** [Credits page lists every source, including Transformers.js](09-credits-page-complete.md) — Side track (credits)
- [ ] **10** [Close draft PR #27 without merging](10-close-draft-pr-27.md) — Housekeeping (GitHub step, not Cursor) — *not Cursor*
- [ ] **11** [Terms: no-extraction line for bought assets](11-terms-no-extraction-line.md) — Legal copy (small) — *gated: John's yes*
- [ ] **12** [Options carry a legal engine action id; the writer words them](12-p3-options-on-action-ids.md) — Phase 3, part A — *gated: John's yes*
- [ ] **13** [One final function returns exactly 4 / 4 / 3 options](13-p3-one-433-function.md) — Phase 3, part B — *gated: John's yes*
- [ ] **14** [Clicks and typed text resolve to action and item ids, not phrases](14-p3-clicks-and-typed-text-to-ids.md) — Phase 3, part C — *gated: John's yes*
- [ ] **15** [Extract one resolveTurn with typed stages; live play calls it](15-r9-resolveturn-live.md) — R9 (own phase, alongside Phase 3), part A
- [ ] **16** [Autoplay and live-drive call the same resolveTurn](16-r9-autoplay-livedrive-share-turn.md) — R9, part B
- [ ] **17** [Client sends gm-turn a small typed writer request, not the whole save](17-r9-small-writer-request.md) — R9, part C — *gated: John's yes*
- [ ] **39** [Edge twins: generated only, no hand stubs, drift fails the build](39-dedup-edge-twins-generated-only.md) — De-dup (after R9 part C) — *gated: John's yes*
- [ ] **18** [Delete count-based forced events](18-p4-remove-turn-timers.md) — Phase 4, part A
- [ ] **19** [Repeated options stay on screen, ranked lower; remove the 5-turn cooldown and streak caps](19-p4-repeats-ranked-lower-no-cooldown.md) — Phase 4, part B (John's 27 Nov decision)
- [ ] **41** [Mode rules live in the mode profile, not in inline mode checks](41-dedup-mode-profile-one-source.md) — De-dup (after Phase 4)
- [ ] **20** [Look, wait, rest, refuse and plain travel never roll](20-p4-no-dice-on-plain-actions.md) — Phase 4, part C
- [ ] **21** [Tabletop: build or import the character before page 1](21-p5-tabletop-character-first.md) — Phase 5, part A
- [ ] **22** [Keep the whole pasted sheet; features, spells and XP to SRD 5.2 as written](22-p5-full-sheet-srd-xp-spells.md) — Phase 5, part B
- [ ] **23** [Tabletop target choice in fights](23-p5-target-choice.md) — Phase 5, part C
- [ ] **24** [One character window with equip and unequip in all three modes](24-p5-one-character-window-gear.md) — Phase 5, part D (can start any time)
- [ ] **25** [Fact checker compares what the writer bound with what the engine committed](25-p6-fact-check-by-ids.md) — Phase 6, part A — *gated: John's yes*
- [ ] **26** [Speech and quotes carry speaker and quote ids](26-p6-speech-and-quote-ids.md) — Phase 6, part B — *gated: John's yes*
- [ ] **40** [One writer packet built once per turn from committed state](40-dedup-one-writer-packet.md) — De-dup (after Phase 6) — *gated: John's yes*
- [ ] **42** [One people store keyed by NPC id](42-dedup-one-people-store.md) — De-dup (after brief 40) — *gated: John's yes*
- [ ] **43** [One place store keyed by place id](43-dedup-one-place-store.md) — De-dup (before brief 31) — *gated: John's yes*
- [ ] **27** [Paid balances, purchases and the free earn path on the server](27-p7-server-balances.md) — Phase 7 — *gated: John's yes*
- [ ] **28** [One writer output contract and one validator](28-p8-one-output-contract.md) — Phase 8, part A — *gated: John's yes*
- [ ] **44** [Delete leftover prose guards and dead validators](44-dedup-delete-leftover-guards.md) — De-dup (after Phase 8 part A) — *gated: John's yes*
- [ ] **45** [One system-prompt builder and one writer call path](45-dedup-one-prompt-one-writer-path.md) — De-dup (after Phase 8 part A) — *gated: John's yes*
- [ ] **29** [Model profiles, a per-save language setting, and a 30-scenario conformance set](29-p8-model-profiles-language.md) — Phase 8, part B — *gated: John's yes*
- [ ] **30** [Writer quest proposals reach the game; hubs offer several side jobs](30-p9-typed-proposals-hub-jobs.md) — Phase 9, part A — *gated: John's yes*
- [ ] **31** [Places carry a kind and role; map template by kind; shops, recruiting and dungeons reachable](31-p9-places-by-kind-reach.md) — Phase 9, part B
- [ ] **32** [One Character Setup page before turn 1 in every mode](32-p10-character-setup-page.md) — Phase 10, part A
- [ ] **33** [Remove setup-in-chat: stitched hall talk and name harvesting](33-p10-remove-chat-setup.md) — Phase 10, part B
- [ ] **34** [Shared modal hook, tab strips that fit, staff chrome behind the staff check](34-ui-shared-modal-and-tabs.md) — Interface quick repairs (any time; avoid files in active briefs)
- [ ] **35** [One toast stack, Themes Save bar, one currency formatter, honest merchant header](35-ui-toasts-themes-currency.md) — Interface quick repairs
- [ ] **46** [One script per job; archive docs that restate replaced systems](46-dedup-dev-scripts-and-stale-docs.md) — De-dup housekeeping (any time; avoid files in active briefs)
- [ ] **36** [Player opt-in screen for training capture, default OFF](36-player-opt-in-screen.md) — Before other players (training) — *gated: John's yes*
- [ ] **37** [Phase 0 leftovers: server Gemini fallback, database metering, IP headers](37-phase0-leftovers.md) — Phase 0 leftovers — *gated: John's yes*
- [ ] **38** [Paid 40-turn live AI-prose run in all three modes](38-paid-40x3-prose-run.md) — Leftover: verification (not Cursor) — *not Cursor* — *gated: John's yes*

### Not briefed yet
- Phase 11 (nightly real-site playthrough) and Phase 12 (comic mode). Their cost is unknown and they need John's go.
- Interface larger redesigns R1 and R3–R7 (one Modal/Tabs system, Settings split, quieter in-game layout, one Map window, title-menu saves, mobile bar). These get briefed after 34–35.
- Later ideas 13–18 and the backlog on the plan Page.
- John-only items: the Play trader declaration (by 1 Feb 2027), the product name and logo, the legal-page placeholders, the key rotation, the second-person question, the 4/4/3 exceptions list, single versus several saves, a System store or NPC merchant, and guest play.
