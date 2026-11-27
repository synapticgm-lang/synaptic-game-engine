# SynapticGM fix history: do not repeat this

Written 27 November 2026 (Europe/London) by Synapticgm for John's rule: the project only moves forward. **Every Cursor chat reads this file before the brief.**

## Lessons that are now rules

1. **A fix is only done when a person has read the prose in a live game** and counted the options (exactly 4 for LitRPG and RPG, exactly 3 for tabletop). Green tests, replay-bank scores, gate counts, fact-check pass rates and long autoplay runs that finish without errors have all been counted as proof before, and every time the prose was still broken when John played (H4).
2. **Delete the wrong layer; don't add a guard on top of it.** Most repeats came from adding a new filter, cap, sanitiser, validator or "warden" over output that a lower layer had already got wrong. The old layer then came back or fought the new one (H1, H5, H9, H10).
3. **No English word lists, phrase regexes, name lists or seed-specific special cases.** Each one fixed the case in front of it and broke the next game (H2, H7, H8).
4. **No hidden retries, re-asks, fallback prose or stitched text.** They were removed at least three times and came back each time (H5, H6).
5. **A removal must stay removed.** The PR proves it with an `rg` search that returns nothing, and later briefs must not re-add it under a new name. For example, proseWarden was retired on 27 Oct, then "Warden v2" was added on 31 Oct (H10).
6. **Fix the turn once, not three times.** The turn logic lives in `useGame`, `fateAutoplay` and `liveDrive`, with edge twins under `supabase/functions/_shared/gm/`. Fixes made in one copy went missing in the others (H11).
7. **One brief, one PR, one review, one merge.** The October merge waves had 26 merge reverts in four days (17–20 Oct). Autonomous fix loops (the 2–3 Nov FOURSLOT watch, gate-fix retries) burnt Cursor credit and left the prose unchanged (H12).
8. **If a problem matches a ledger entry that has already failed twice, stop and report.** Don't try the same approach a third time.
9. **Tests that pin one seed's symptom are not evidence.** `src/game/` holds 549 test files, and 276 of them are named `playtest*`. Many pin one seed's old output.

## How this ledger was built (and its limits)

- **Sources:**
  - all 49 PRs on synapticgm-lang/synaptic-game-engine (titles and bodies);
  - the 1,978 commit subjects on `main` (8 Aug to 24 Nov 2026);
  - Synapticgm's memory and journal entries;
  - the "John's SynapticGM requests audit", "turn pipeline fine-tuning review" and "FOURSLOT6 turn audit" Pages, and the 8 Nov completion plan.
- **Commit counts are keyword matches on subjects**, so they're approximate and only show how much churn each theme had. They don't count distinct attempts.
- **Limits:**
  - I read commit subjects, not diffs, for most of the history before November.
  - Old chat transcripts weren't searchable from this run, so John's own words are taken from memory, not the chats.
  - The 27 Nov plan Page was not re-read line by line.
- Where the evidence is thin, the entry says so.

## Ledger

### H1. Option count (4 / 4 / 3)
- **Churn:** about 170 option, chip, pad or slot commits (Aug 13, Sep 31, Oct 102, Nov 25).
- **Attempts:**
  - 27–29 Sep (27c "payload-only chips… pad targets", 29z3 "chips follow the scene"): verified by T10 laps.
  - 17 Oct OPT-1 to OPT-6 and G-H2 (build z7): option groups shipped live, verified by laps and fixtures.
  - 27 Oct M6 "fight options cap 4".
  - 2 Nov XP-D1 OPEN3–9: filler caps, filler streak caps, "filler Search/Read starve".
  - 2–3 Nov FOURSLOT 1–6 (ff45961f to 43d83c8d): "engine-built four-slot chips for every non-origin scene", then "always assemble four slots", then "fill short pads", "cap filler streak", "family streak <=2", gateFix9 and gateFix10. Verified by an autonomous T50 gate whose baseline already had 113–118 failing tests and about 551 type errors. The FOURSLOT T50 ended MISS: one tabletop game was DEFEAT and never had 4 chips, and FOURSLOT2 stopped on a travel loop.
  - 10 Nov PR #28 (option audit script).
  - 11 Nov PR #31 (options fell through to "classic filler" when the opening retry failed).
  - 13 Nov PR #37 ("4 pads" while the offer is open).
  - 14 Nov PR #43 (question-only pads capped at 4).
- **Why it came back:**
  - The count is still set in at least five places (see brief 13).
  - FOURSLOT added a sixth layer on top instead of deleting the others.
  - Every short pad was "fixed" with filler, streak caps or starving rules, which are themselves counters (H3), and filler chips were sometimes dead (invented targets, absent people).
  - The proof was a script and a gate, never a person counting and reading.

### H2. Option quality and recognising clicks by phrase
- **Attempts:**
  - 15 Oct q31-RC3: "engine chips recognised by their builder and resolved action, not their label".
  - 17 Oct q37-C1b: "actionId repeat suppression".
  - 29 Sep 29z3: chips follow the scene.
  - 11 Nov PR #34: re-added phrase recognition for offer chips (`isAcceptOfferLine`, verbs "walk with / take / join / follow…").
  - 13 Nov PR #38 / #39: accept chip dropped because a noun wasn't repeated in the prose.
- **Why it came back:** an action id was added beside the label matching, but the phrase recognisers were never deleted. New features (opening offers) then went back to phrase matching because it was quicker. Briefs 12 and 14 must build on the existing `actionId`, not create a second id, and must delete the recognisers.

### H3. Repeated options and the cooldown
- **Attempts:**
  - 17 Oct John asked for a cooldown.
  - G-OCD failed twice and was reverted.
  - G-OCD2: 5-turn cooldown "applied once to the final pad", shipped as build z8.
  - G-OCD3: merged five times over 17–18 Oct.
  - 30 Oct T10RC7fix2: agenda cooldown.
  - 2 Nov OPEN7: death-farm cooldown.
  - FOURSLOT: streak caps.
- **Why it came back:** the cooldown removed legal options, so pads went short and needed filler (H1), which then repeated.
- **John's decision (27 Nov):** repeats stay on screen and are ranked lower. Brief 19 removes the cooldown. Never re-add a cooldown, streak cap or starve rule.

### H4. Prose quality was never judged by a person reading it
- **Attempts:**
  - 27 Sep: plan "push live after it passes T10s".
  - 30 Sep: John and Synapticgm found the tester "only catches broken play, not whether a turn is good".
  - 4 Oct seed 69: 50 turns, no errors, but 8 turns repeat earlier prose, Orel Vane introduces himself again, and turn 45 writes the player's line.
  - 11 Oct laps 6–12: replay bank 152/225 → 201/266, "no regressions", scored only by the fact checker. The prose review was deferred.
  - 17 Oct: 500-turn mega games.
  - 3 Nov: FOURSLOT T50.
  - 10 Nov: engine-only 40-turn run (PR #27).
  - 22 Nov PYOA scan: "exhaustion != qualitative pass".
- **Why it came back:** every round measured something a script could count, the counts went up, and John found nonsense when he played. A person reading the prose was never the acceptance gate.

### H5. Fallback, canned and stitched text
- **Attempts:**
  - 28 Sep 28g: "near-zero fallbacks".
  - 29 Sep 29u: "stitch removal".
  - 16 Oct q31-RCN3: "blocking drafts get one rewrite, else engine-fact fallback".
  - 28 Oct T10P, T10R and T10AH: fallback narration fixes.
  - 7 Nov: "Name the live foe in fallback prose".
  - 11 Nov PR #29: page 1 no longer uses authored text, and the UI shows Try again instead.
- **Why it came back:** removals were partial, and fallback paths were kept "just in case" and then patched to read better.
- **Still on main:** `openingStitch.ts`, `STITCH_BANKS`, `cardPageParagraph`, `BANNED_FALLBACK_STUB`, and about 19 tests that pin canned text (briefs 06 and 33).

### H6. Hidden retries and silent re-asks
- **Attempts:**
  - 28 Sep 28l: "one same-model re-ask on empty/cut-off".
  - 16 Oct q31-RCN3: one rewrite.
  - 28 Oct: a broken gm-turn deploy retried failed writer calls, which cost money (OpenRouter balance note).
  - 11 Nov PR #31: every live opening draft needed the automatic retry.
  - 11 Nov PR #33: loosened the validators so fewer drafts were rejected.
- **Why it came back:** a retry hides why the first draft failed (packet framing, a validator false positive), so the root cause was never fixed. John's 11 Oct rule allows one targeted repair that names only the flagged error and is logged. A blind retry is not allowed.

### H7. Openings (page 1 and the opening offer)
- **Churn:** about 246 opening, origin or rite commits since August, for example:
  - 17 Aug: free opening;
  - 20 Aug: Summoned Pact openings vary from beat cards;
  - 11 Sep: cast speaks hall answers so the card paragraph isn't reprinted;
  - 7 Oct: opening card compile.
- **The November run** was 16 PRs in four days, each fixing the last:
  - #29: live AI openings, all four slices;
  - #30: rite, names, chrome;
  - #31: tags, genders, titles, retries;
  - #32: offer accept used catalog names and treated the offer as the main quest;
  - #33: validators false-rejecting good prose;
  - #34: offer chips by phrase;
  - #35: Yalekirk, "rite backstop";
  - #37: opening cast;
  - #38: accept chip disappears;
  - #39: offer labels;
  - #40: accept granted chip notes as loot;
  - #41: carryable items;
  - #42: offer residuals;
  - #43: answered covers;
  - #44: rite kit too early, ungendered PC;
  - #45: name bank.
- **Verification:** unit tests plus short live checks of one or two games.
- **Why it came back:** hook cards are English sentences that code parses with about 20 word lists and regexes, then renames by search-and-replace. Each live game hit a new sentence shape. PR #35 also added a "rite backstop", which breaks the no-backstop rule.
- **What's different now:** the hooks become typed data (briefs 01–04), so parsers are deleted rather than patched.
- **Note:** the "four opening slices" were already claimed as built in #29. Briefs 01–06 rebuild their foundations, not the features from scratch.

### H8. Names, catalog leaks and pronouns
- **Attempts:**
  - 20 Sep brief: "one strict name check, do not add more sanitizers".
  - 4 Oct: Orel Vane introduced again.
  - 6 Oct seed 71: a name-shortening step swapped Cinderflow ford for Cinderflow Road.
  - #30: `extractTitleNames`, Walk → Brack.
  - #31: genders.
  - #35: catalog priests Orel Vane and Sera Quill on page 1.
  - #44: ungendered PC.
  - #45: per-race name bank. Kept, because it's real data.
- **Why it came back:** names are minted by replacing words in card text and checked with stop-word and title lists, so every new word shape slips through or gets mangled. Brief 03 replaces this with cast ids.

### H9. The fact checker and fact gate
- **Churn:** about 200 commits.
- **Attempts:**
  - 1 Oct 29z9e: one writer-words guard replaced four flags.
  - 27 Oct M4: clause check replaced proseWarden.
  - 9 Nov: unified fact gate spec (#8) and hybrid gate (#10).
  - 10 Nov #22: code verdicts decide every span.
  - 9 Nov #14 / #17: room props and legends filed via checker tags.
- **Verification:** offline span counts on stored tapes, the replay bank and tests.
- **Why it came back:** each consolidation still judges sentences with English word sets (`PLACED_VERBS`, the `sells|offers` regex). Doubt deletes good lines ("She opened the shutters slowly" is cut), and new guards grow back around it. Brief 25 compares ids, not words.

### H10. Prose repeats, echoes, re-introductions and speech
- **Attempts:**
  - 4 Oct seed 69: repeat owners.
  - 6 Oct seed 73: speech saved under the wrong speaker, and "met before" became "you came back".
  - 27 Oct: proseWarden retired.
  - 30 Oct T10RC7: player act marked as already shown.
  - 31 Oct T10ECHO: stopped handing the player's act wording to the writer.
  - 31 Oct T10WARDEN2: "Warden v2 final-prose guard for repeats, quote stubs, fight absence". This re-added a removed layer four days later.
  - 2 Nov OPEN7B: strip act-echo openings.
  - 7 Nov: drop repeated writer-leaf lines.
  - 10 Nov #23: quote recall by 8 turns plus first four words.
  - 13 Nov #37: 85% word-overlap echo filter.
- **Why it came back:** the writer packet doesn't carry speaker ids, quote ids or what has already been said, so post-filters guessed by word overlap.
- **Open question for brief 12:** T10ECHO blanked the player's typed words from the packet, which may be why replies don't answer what the player said. Report what you find. Don't silently undo it.

### H11. Three copies of the turn, plus edge twins
- **Evidence:**
  - `maxTurns: 6` is in three files.
  - The runner had a double fight resolve (PR #27/#28 leftover).
  - 27 Oct build: gm-turn BOOT_ERROR because the edge copy of `stateTx.ts` was old, and it was rolled back.
  - About 130 twin files.
- **Why it came back:** fixes were made in the copy the failing test used. Briefs 15–17 own this. Never hand-edit twins.

### H12. Merge waves, reverts and autonomous loops
- **Evidence:**
  - 17–20 Oct: 26 `Revert "w4…/w5…-merge"` commits, some reverting a re-apply of a revert (G-TAGS reverted five times).
  - 2–3 Nov: the FOURSLOT watch relaunched gate runs and gate-fix attempts by itself.
  - October had 1,023 commits.
- **Why it came back:** too much merged at once without review, and a loop that retries until a gate passes. That burnt credit and left the prose unchanged.
- **Rule:** one brief, one PR, no loops, stop after one repeat of the same error.

### H13. Travel, places and exits (evidence thin, subjects only)
- **Churn:** about 133 travel or exit commits.
- **Examples:**
  - 29 Sep 29u: journey owner.
  - 6 Oct: "On the road between places" stored as a location.
  - 3 Nov FOURSLOT 2–4: travel bounce and treadmill loops.
  - 9 Nov #12 / #18: real exits.
- **Pattern:** place kind and exits inferred from names. Brief 31 makes kind a field.

### H14. Timers and forced events (evidence thin)
- **Examples:**
  - 7 Oct seed 76: a "4 turns remaining" timer leaked into the story.
  - Fights every 8/12/15/20 turns, class after 3 turns, and a hub exit by turn 50 are still in the code (audit P1–P3).
- **No earlier attempt to remove them was found.** Brief 18 is the first.

### H15. Tabletop setup and SRD (evidence thin)
- **Examples:**
  - 19 Oct AIPSETUP: tabletop creation became a chips-only setup step. One of the reverted merges was `g-aipsetup`.
  - The pasted sheet keeps only 6 picks.
  - Tabletop XP is unfinished.
- **Pattern:** setup was mixed into the story loop. Briefs 21, 22, 32 and 33 move it first.

### H16. Quests (evidence thin)
- **Examples:**
  - 29 Sep: quest versus prose contradiction on turn 1.
  - 7 Oct seed 76: "no live quest every turn" and a false XP line.
  - 9 Nov #20: mid-visit quests.
  - Side quests on a fixed 8-turn rotation are still in the code.
- **Pattern:** quests derived from text and turn counts. Briefs 04 and 30 change this.

## Brief to ledger map

| Brief | Ledger entries |
|---|---|
| 01–04 | H7, H8, H16 |
| 05 | H7, H6, H4 |
| 06 | H5, H10 |
| 07, 08, 09, 11, 20, 24, 27, 34, 35, 36, 37 | none found |
| 10 | H4 |
| 12 | H1, H2, H10 |
| 13 | H1, H3 |
| 14 | H2 |
| 15–17 | H11 |
| 18 | H14 |
| 19 | H3, H1 |
| 21–23 | H15 |
| 25 | H9, H10 |
| 26 | H10 |
| 28 | H5, H6, H10 |
| 29 | H6 |
| 30 | H16 |
| 31 | H13 |
| 32–33 | H15, H5, H7 |
| 38 | H4, H12 |

"None found" means none found in the sources above, not that it has never been tried.
