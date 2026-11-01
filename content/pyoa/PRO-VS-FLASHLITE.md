# Gemini Pro vs Flash-Lite — PYOA patch pass (28 Oct 2026)

Compare how well Gemini **Pro** (John's Gemini app on CDP `:9222`, via `tools/pyoa-gemini/pro-pass.mjs`) improves Flash-Lite / unverified draft prose on:

1. **Saltglass** — pure-choice PYOA (`content/pyoa/saltglass/`). Flash-Lite **verified** per call in `flashlite-sections.json`.
2. **Dice / Tide** — dice book (`content/pyoa/dice/book.json`). Logged as **model-unverified** under `dice-tide` in `flashlite-sections.json` (may be partly Pro already — treat as a weaker baseline for “Flash-Lite only”).

Umbra was left out. No OpenRouter / Fireworks. One Pro call at a time. Saltglass Flash-Lite driver stayed paused until `PRO-PASS-DONE`.

This was a **matched sample**, not a full-book rewrite: Pro calls are slow (often 1–12 minutes with thinking), and empty/soft-refuse replies are common. Driver is resumable (`*-progress.json` + `reviewedIds`).

## Method

- Merge saltglass prose → `book.json`, then Pro-review only nodes that already have `page`.
- Batches of 3–4 sections with exits / checks / grants in context.
- Ask for a strict JSON array of small patches (`section`, `field`, `old`, `new`, `kind`, `reason`).
- Reject rewrites (kept-ratio / length heuristics). Apply → lint (`lint-salt.mjs` / `lint-dice.mjs`) → revert batch on lint errors.
- Log every suggestion to `content/pyoa/pro-pass/<book>-log.jsonl`.

## Counts

| | Saltglass (choice) | Dice (checks) |
|---|---|---|
| Sections with prose in book | 901 / 1000 | 1000 / 1000 |
| Reviewed this pass | 83 | 48 |
| Gemini calls (logged) | 16 | 11 |
| Suggested | 25 | 21 |
| Accepted | 25 | 21 |
| Rejected (patch-level) | 0 (all parseable suggestions accepted) | 0 |
| Batch failures (unparseable / soft-refuse / noreply skip) | unparseable 7, gemini-stop 3, batch-skip 1 | gemini-stop 9, batch-skip 4, unparseable 2, soft-refuse 1 |
| Kinds accepted | prose 18, choice 7 | prose 16, choice 5 |
| Lint before | 0 errors / 4 warnings | 0 errors / 3 warnings |
| Lint after | 0 errors / 4 warnings | 0 errors / 3 warnings |

Accept rate on **parsed** suggestions was high for both (~100%). Yield per call was better on saltglass once batches were small; dice burned more wall-clock on noreply / soft-refuse before landing patches.

## Judgement (sample before → after)

**Saltglass** — Pro mostly tightened British spelling and choice punctuation, plus a few stake clarifications (e.g. “coming flood” → “coming drought” where the Seedkey beat is about drought). Choice labels that trailed with a full stop were cleaned. Useful copy-edit pass; not a deep structural rewrite (by design).

**Dice** — Same shape of edits: sharper adjectives, British spelling, exit-label polish. Check/recovery/reward fields rarely needed `payoff` patches in this sample. When Pro answered, quality matched saltglass; the gap was **reliability**, not craft.

Neither book’s lint floor moved (already clean). Warnings (meta wording / engine mark gap) were untouched — Pro was not asked to invent mark-setting machinery.

## Where Pro struggled

1. **Empty / noreply after long “thinking”** — especially dice early batches (10–12 minutes then no usable `model-response` text). `gem.mjs` now strips Thought chrome and rejects empty bodies; `pro-pass.mjs` retries once.
2. **Soft-refuse** — “I'm having a hard time fulfilling your request” / “Sorry, something went wrong” on larger batches or after several calls. Shrinking to 3–4 sections and a shorter proofread prompt recovered yield.
3. **Unparseable replies** — thoughts or prose around JSON; balanced-`[` extractor + “JSON only” retry.
4. **Rewrites** — rewrite detector rejected none in this sample (Pro stayed phrase-level when it complied).
5. **Lint breaks** — none; no batch reverted for lint.
6. **Chrome navigation** — one dice run died on puppeteer “Execution context was destroyed”; treated as retryable nav stop.
7. **Limits** — no hard Pro usage-limit page this session (`LIMITED` not set).

## Caveats

- Dice baseline is **unverified** model history — some pages may already be Pro-ish; uplift vs true Flash-Lite is overstated if so.
- Saltglass still missing 99 prose sections; Pro only saw written ones.
- Full-book Pro review would be hundreds of calls; resume with `node tools/pyoa-gemini/pro-pass.mjs saltglass|dice`.

## Verdict

Pro is a solid **phrase-level editor** for both formats when the call returns JSON. On pure-choice saltglass it was more dependable per wall-clock hour. On the dice book it produced similar patch quality but **struggled harder to answer at all** (noreply / soft-refuse), so Flash-Lite → Pro “fix pass” is less efficient for dice until batches stay tiny and retries are expected.
