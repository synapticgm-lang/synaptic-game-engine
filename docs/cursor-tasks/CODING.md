# How to code in this repo (read at the start of every brief)

Condensed from John's own working method for Cursor, which can't load those skill files itself. Read this, `HISTORY.md` and `DUPLICATION.md` before the brief. If this file and a brief disagree, this file and `00-README.md` win.

## Governing rules: Tidy, logical coding (no chaos)

Word for word from John's house rules:

### Tidy, logical coding (no chaos)

All code work, by any bot or any Cursor session it briefs, must be logical and tidy:
- Plan first: state the goal, the exact files to touch, and how you will test it before changing anything.
- One small, focused change at a time, each with one clear purpose. No sprawling multi-feature edits.
- Follow the project's existing structure, naming, and patterns. Extend what is there; do not invent a parallel system.
- Never leave duplicate or competing versions of a file, script, scene, or feature (no `_v2`, `_new`, `_old`, `copy` files). Replace or remove the old one.
- Clean up as you go: delete dead code, temp files, debug logs, and unused assets you created.
- Keep one source of truth for config and data; do not hard-code the same value in several places.
- Small commits with clear messages saying what and why.
- Build and test before moving on; fix a failure before starting the next change.
- Note any structural decision in the project's `FACTS.md` so later sessions stay consistent.
- When briefing Cursor, include these rules and name the exact files and folders it may change.

If the same step fails twice, stop and report.

**Where `FACTS.md` lives for this project:** the repo has no `FACTS.md` (checked on main `9ab6b311`). The project's FACTS file is on the Synapticgm box at `/home/box/shared/synapticgm/FACTS.md`, which Cursor can't reach. **Don't create a FACTS.md in the repo.** That would be a second copy. Put any structural decision in the PR body under a **"Structural decisions"** heading, and Synapticgm copies it into the box FACTS.md when the PR merges.

**"Include these rules in every brief":** every brief has a `Method: follow CODING.md` line, which points here.

## House rules for Cursor

From John's house rules, with the wording kept close to the original. Only the rules that bear on Cursor's work are here. The tidy-coding rules are in full above.

**Honesty**
- Never lie or bluff. If you don't know, or something failed, say so.
- Verify end-to-end before calling work done, and show the evidence (section 3).

**Check what is already in place first**
- Before you add a tool, helper, asset, module or pattern, check what the project already has: existing modules (`DUPLICATION.md`, `docs/CODEMAP.md`), past attempts (`HISTORY.md`) and what is already decided (`00-README.md`). Don't redo past work, rebuild something that exists, or bring back something already decided against.

**Token efficiency and loops**
- Read the pack's rules first (this file, `00-README.md`, `HISTORY.md`, `DUPLICATION.md`). The project's `FACTS.md` lives on the Synapticgm box, not in the repo; the facts Cursor needs are copied into this pack. Don't go digging through old chats or re-reading large files.
- Take the smallest path that finishes the job. Keep searches, file reads and replies tight. Search by symbol name with ripgrep, and don't open whole large files (`useGame.ts`, `fateAutoplay.ts`, `openingEstablishment.ts`, `srd521.json`) when a search will do.
- Use the cheapest route that works. Use Auto or a cheaper model for routine edits, and the top model only to plan or when the same error comes back (00-README, Model).
- Never load long reference files unless the task actually needs them.
- If the same step fails twice, stop and report rather than retrying the same way a third time. No polling, no watch loops, and no "run until green".

**Approval gates.** Do none of these, ever, from a Cursor chat. Stop and report instead:
- send or post a message, email, Slack or similar in John's name;
- delete mail;
- spend money, bid or buy (that includes paid model calls, paid APIs, paid test runs and new paid services);
- start a Cloud Agent;
- merge a PR or deploy (Synapticgm merges, and a gm-turn deploy needs John's yes).

**Money and secrets**
- Use the OpenRouter key only when John directly asks. Cursor never does, and never runs anything that calls it.
- Never print keys. Never echo, log, paste or commit a secret either. Use env vars only.
- No code moves money. Card numbers and security codes never go in code, tests, fixtures or logs.

**Hard limits**
- Do not touch the SynapticGM checkout on LokiLaptop: `C:\Users\littl\OneDrive\Documents\synapticgm\game\project`. Work only in the fresh copy outside OneDrive (`C:\Users\littl\synapticgm-work`) on the brief's branch.
- Backups go to Google Drive, not OneDrive. Don't add or change backup code or settings that write to OneDrive.

**Shared project folders**
- Reusable research and assets belong to the project, not a scratch folder. Don't add research dumps, scratch files or stray assets to the repo. If you find something reusable, name it in the PR and Synapticgm files it.

**Time and wording**
- John is in Europe/London. Give any times in PR text in UK time and label them.
- Write PR text, comments and docs in plain UK English. Keep them short and factual, and claim only what was checked. (The house-rules file has no written UK English rule. This line comes from John's 27 Nov ask.)
- Never use the phrase "Dungeons & Dragons" in the product (00-README, Game rules).

## One source, no duplication

- Never add a second copy of logic, data, rules, facts, constants, prompt text or a validator. Find the single source (see `DUPLICATION.md`) and extend it.
- If a copy is truly unavoidable (for example the Deno edge runtime can't import from `src/`), it must be **generated** from the source by a script, and a check must fail when they drift. Hand copies are never allowed. The PR must say why the copy can't be avoided.
- Every PR has a **"Duplication removed"** section listing each copy it deleted (file:symbol), or "none" with a reason. A PR that adds a copy fails review.
- When you touch a file listed in `DUPLICATION.md`, delete the copies the brief covers. Don't leave the old one "for safety".

## 1. Debug: find the root cause before any fix

No fix without a root-cause investigation first. A symptom fix is a failure. Finish step 1 before you propose any change.
1. **Root cause.** Read the error or the bad transcript in full. Reproduce it (an offline test or a stored transcript is fine to reproduce with). Check recent commits and `HISTORY.md`. Gather evidence at each boundary: screen, client turn, network request, edge function, model output, state commit. Name the layer that owns the wrong fact before guessing.
2. **Pattern.** Find a case that works, compare it with the broken one, and list every difference.
3. **One hypothesis at a time.** State one theory and test it with the smallest change. Don't stack fixes. If you don't understand something, say so.
4. **Fix.** Write a failing test where you can (section 2), make one root-cause fix, then verify it (section 3).
- **Stop rules:** if the same step fails twice, stop and report. If three fixes in total have failed, stop and question the design in the PR. Never try a fourth. "Quick fix for now", "just try changing X" or "one more fix" after two failures means go back to step 1.
- Never fix by adding a word list, phrase regex, name check, timer, retry or canned text (00-README, Fix the root cause).

## 2. Test first: red, green, refactor

1. **Red.** Write one small failing test for one behaviour.
2. **Check red.** Run it. It must fail for the right reason (missing behaviour, not a typo). If it passes, it's testing behaviour you already had.
3. **Green.** Write the least code that makes it pass. No extra features.
4. **Check green.** Run that test, plus `npm run typecheck`, `npm run lint` and the targeted tests for every file you changed. Name every failure in the PR, including ones you didn't cause.
5. **Refactor.** Tidy up while staying green, and add no new behaviour.
- If a test is hard to write, the design is too tangled. Simplify the interface or report it.
- Tests use real code, with mocks only when unavoidable. Tests that pin a broken rule (canned text, counts, word lists) get deleted, not kept green.
- Pure moves and deletions (for example briefs 15–16 and the de-dup briefs) still need a test that shows behaviour is unchanged, for example the same input giving the same state before and after.

**In this pack, tests are a sanity check only.** They never prove a fix (HISTORY.md H4). Real acceptance is a short live game on www.synapticgm.com or the PR's preview, where a person reads the prose of every checked turn and counts the options (4 in LitRPG and RPG, 3 in tabletop). Synapticgm or John runs it after review, and Cursor never does.

## 3. Verify before you say "done"

No claim of done, fixed or passing without fresh evidence from this session.
1. Identify which command proves the claim.
2. Run it in full, fresh.
3. Read all the output: the exit code and the number of failures.
4. Check that the output actually supports the claim.
5. Only then make the claim, and paste the evidence (the command and the result lines) in the PR body.

| Claim | Needs | Not enough |
|---|---|---|
| Tests pass | test output with 0 failures, from this run | an earlier run, "should pass" |
| Type check / lint clean | `npm run typecheck` / `npm run lint` exit 0 | one of them standing in for the other |
| Twins in sync | `npm run check:gm-edge` printing "edge copies match" | "I ran sync" |
| Bug fixed | the original symptom reproduced, then gone | code changed, so assumed fixed |
| Copy removed | `rg` showing the old symptom name gone | "deleted it" |
| Fix works in the game | the person-read live game (not Cursor) | any of the above |

Red flags: "should", "probably", "seems to", or claiming success before running the check. Say plainly what you did not check.
