# Replay bank: new rules (box prep, 24 Oct 2026)

Same format as the repo's replay bank (`src/__tests__/replayBank/*.bank.ts`, run with
`npx vitest -c vitest.replayBank.config.ts`): rebuild a saved fate-autoplay run through `replayWhole`, writer mocked
with `mockAiService`, then assert on packets, state and receipts via `Replay` (bank.ts). No field set by hand; only
the engine rolls dice.

| File | Order | Rule |
|---|---|---|
| playStyleEveryTurn.bank.ts | 6b (and 6 presets) | Style label + 3 slider numbers + premise rail (<= ~400 chars) in every writer packet; six presets and Custom; sliders win; one source |
| companionsOwnNpcs.bank.ts | 8 | Companions disagree, have own wants, remember what was said |
| failedChecksCost.bank.ts | 7/8 (DECIDED 127) | Failure costs time/alarm/approach; same retry not re-rolled; new angle checked; game errors cost nothing |

These need runs that don't exist yet. After the order lands, record them with the usual fate-autoplay script and
writer (never OpenRouter), then fill the `// ORDER-NAMED` constants (run dirs, beat turns, names, block headers):
- 7 runs, >= 12 turns: one per preset plus Custom. The Balanced Tale run moves one slider mid-run.
- 1 companion run, >= 20 turns, two companions, with these scripted beats: an order against an agenda, a split
  choice, a line said, and a callback to it 8+ turns later.
- 1 check run: a failure, the same retry word for word, a new angle, and one injected writer failure on a check turn.

Missing runs fail loudly; they never skip. Fix only `ORDER-NAMED` or `check name` imports and fields, and never
weaken an assertion. Nothing here touches XP.
