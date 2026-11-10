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
- Companion run coordinates are filled in `companionsOwnNpcs.bank.ts`:
  `2026-11-08T23-52-11-338Z_summoned-pact_chilled-gm_s36`, turns order 3 / split 2 / said 4 / recall 13,
  A `Mara Vell`, B `Innkeep Mara`. The tape is private. Restore only `turns.jsonl` (249428 bytes,
  sha256 `639e17cf15fd06e9719d24c5fcd1f943ac85413a9d056125a248176a7e76f6d0`) and `meta.json`
  (3199 bytes, sha256 `1e7af7ba21fc9ce185ce4050e9b58b87dc368b7734624731a2c7b23463c0cbfe`) under
  `scripts/fate-autoplay/runs/<that folder>/`. A missing or different file fails the bank. That pass
  is engine state only: A's stored trust goes from no row to 10, and B has no stored row so the
  check reads 0. 21 of 22 committed pages are the engine line after the writer gate, and the tape's
  readability gate is false (7 P0). It is not a prose pass and not a green full bank.
- 1 check run: a failure, the same retry word for word, a new angle, and one injected writer failure on a check turn.

Missing runs fail loudly; they never skip. Fix only `ORDER-NAMED` or `check name` imports and fields, and never
weaken an assertion. Nothing here touches XP.
