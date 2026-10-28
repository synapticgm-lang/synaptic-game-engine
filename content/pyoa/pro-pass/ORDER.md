# PRO-PASS order (28 Oct 2026, from John's scheduled routine)

Worktree: this folder (wt\PYOA), branch pyoa/books. Leave Umbra (content/pyoa/umbra) out completely. No push, no deploy, no OpenRouter, no Fireworks, no other paid AI. Gemini only through John's Gemini app in the laptop Chrome on CDP port 9222, via tools/pyoa-gemini/gem.mjs `ask(prompt, { model: 'Pro' })` (ensureModel checks the picker says Pro before EVERY call; modes.mjs shows the picker). Never close Chrome. One Gemini call at a time. tools/pyoa-gemini/pro-ping.mjs already confirmed Pro works at 13:00 UK.

Goal: compare how well Gemini Pro fixes Flash Lite output on a dice book versus a pure-choice PYOA book.

The saltglass Flash Lite driver (gen-salt.mjs prose, already running, PID 39912) is PAUSED with no call in flight; do not kill it and do not touch its Chrome use window. It resumes when content/pyoa/PRO-PASS-DONE exists, so create that file ONLY at the very end.

Steps:
1. Saltglass (content/pyoa/saltglass/): run `node scripts/pyoa/gen-salt.mjs merge` on the written sections, then review ONLY sections that have prose.
2. Dice book: content/pyoa/dice/book.json. It is logged as model-unverified in content/pyoa/flashlite-sections.json (may be partly Pro already) - note that caveat in the comparison.
3. For each book, send Pro batches of sections (with enough context: choices/targets, dice checks, payoffs) and ask for targeted tweaks to prose, choice logic and payoffs in a strict machine-readable format (section id, field, old text, new text, kind, reason). Apply SMALL patches only, never rewrites (reject any patch that replaces most of a section). Keep a patch only if the book still passes lint (`node scripts/pyoa/lint-salt.mjs` for saltglass, `node scripts/pyoa/lint-dice.mjs` for dice); revert ones that break lint. Log every suggestion with accepted/rejected/reason to content/pyoa/pro-pass/<book>-log.jsonl. Write a small script for this under tools/pyoa-gemini/ (e.g. pro-pass.mjs) and keep it resumable.
4. Commit per book (one commit for saltglass fixes, one for dice fixes).
5. Write content/pyoa/PRO-VS-FLASHLITE.md comparing the two books: number of fixes (suggested vs applied), their kinds, how much each book improved (lint before/after, your judgement on sample before/after), where Pro struggled (bad formats, rewrites, lint breaks, limits, timeouts). Commit it.
6. If Gemini shows a usage limit / Pro unavailable mid-pass: stop calling Gemini, write what you have, do NOT create PRO-PASS-RELEASE, write PRO-PASS-STATUS: LIMITED in the report, and end with ORDER_STOP.
7. On success: create content/pyoa/PRO-PASS-DONE (empty file) last.

Report: content/pyoa/pro-pass/REPORT.md with a 5-line short comparison at the top. Last line exactly ORDER_DONE or ORDER_STOP.
