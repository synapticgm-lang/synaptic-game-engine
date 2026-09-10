# Live play — treaty tent one-line lock (2026-09-10)

Save `e118837d-91d6-4121-9d0e-3374dbf48caf` · LitRPG summoned-pact · Jax · treaty tent on the Cinderflow road · John.

| Thumb | Turn | Comment |
|---|---|---|
| − | T0 | On my back / panel at chin height vs table (camera; playable) |
| + | T1 | Thin; missed “where am.” and weak “whats going on” |
| − | T3 | “Minimal response” — Who are you |
| − | T5 | “Not responding at all. Game over” — Ask what they want |

## Transcript

**T0** authored page 1 (canvas, panel at chin height, Pellane plate / Ash cloaks). Chips: Give/Refuse.

**T1** typed: `My name is Jax where am.whats going on`
Stitch: `They have the name Jax. They summoned a soul to sign a pause in the war.`
Where missed (`where am` without `i`). Want was first sentence only.

**T2** chip: `Ask what they want`
Silent: `You asked at a treaty tent on the Cinderflow road. Silence held the question.`
Pads: Press for leverage / Ask a direct question / Inspect the panel / Walk away.

**T3** `Who are you`
Stitch: `the people who pulled you is the one asking.`
Faction string was 56+ chars so CAST fell through. Singular “is”.

**T5** `Ask what they want` again
Silent: `You spoke at a treaty tent on the Cinderflow road. No one listed on the ledger answered.`
`present[]` was `bystanders` — Silent CAST empty.

## Why it keeps happening

Two locks, not a missed prompt:

1. **Silent Engine (`SILENT_ENGINE=true`)** — after covers, Free skips `callGm` and prints `assemblePacketStitch` receipts. Talk with empty CAST is “No one listed…”. That is the one-line “game over”.
2. **Perpetual hall-talk stitch** — 10d sent where/who/want to `stitchOpeningContinue` forever after page 1. Even a “good” stitch is a telegram. Widening the regex (Ask what they want) only keeps more lines on the telegram.

08c micro-flavor is also one sentence. Flipping Silent off without leaving the mud path still cannot be playtested as a story.

## Owners (10f)

| Class | What failed | Owner |
|---|---|---|
| D | After covers, talk/ask is Silent receipt | `shouldUseSilentMudTurn` — talk/ask/who/where/want → `callGm`; Look/Wait/combat/travel stay Silent |
| B | Hall questions stayed on stitch after name lock | `shouldStitchOpeningContinue` = cover/pending only |
| B | `Ask what they want` missed hall-talk regex | `hallTalkAsksWant` |
| B | Treaty CAST / want telegram | `openingCastLabel` envoys; `openingWantLine` full intent + offer |

Do not paste Gemini rewrites. Do not re-enable flavor on Look/Wait every turn.
