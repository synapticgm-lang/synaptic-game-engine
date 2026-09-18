# Gemini AI-tester verdict — process note (2026-09-18)

Accepted verdict (verbatim paste): `docs/research/pasted/gemini-ai-tester-verdict-2026-09-18.md`.

Applied as batch **2026-09-18a**. No T10 in this batch. Mid writer OFF. No SNAPSHOT/CRAFT pile. No Continuity-Warden LLM.

## Corrections to Gemini's writeup

- Player models used were OpenRouter **`google/gemini-2.5-pro`** then cost-cut **`google/gemini-2.5-flash`**, **not** Gemini 1.5. Tester default is **`google/gemini-2.5-pro`** (not 1.5 Pro).
- Process fault is **Cursor's**: John asked for cheaper automation; we switched the **judge** to Flash. Do not write "John's fault" into playtest notes.
- Game writer on synapticgm.com is hosted **Free / DeepSeek-class** via `gm-turn`, not Gemini. The player AI only picks chips / types / thumbs.

## What failed (human floor)

- **Fake Flash thumbs:** Flash treated parseable JSON as a pass and thumbed UP telegrams and Fen/Reed reprints.
- **Who/Want mash:** Dead chips stayed on screen; the tester mashed them to T10.
- **Name telegram:** Name-lock committed `They have the name Jax.` / `The name Jax already stood. The room waited.`
- **Chrome-as-story:** Quest Unlocked / XP STATUS painted as if it were the book.
- **Word floor:** Prose given to players must be **interesting and simple, not too wordy**. UP only for a short chapter beat (clear, spoken, one new thing). DOWN for telegram, loop, STATUS-only, purple pile, or dull filler with no HERE / action / spoken want.

## Owners this batch

Tester: `scripts/ai-player-browser/` — Pro default; Flash is not the judge.
Game: `openingEstablishment` / `openingStitch` / `choiceCompiler` / `turnAsk` / `completedEventPacket` / `useGame` + Fate parity.
