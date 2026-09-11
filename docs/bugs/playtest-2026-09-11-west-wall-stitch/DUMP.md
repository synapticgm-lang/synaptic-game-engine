# 2026-09-11 — West wall stitch (not NPC, not GM)

Save `f98708ec` · session `a10c387f` · device `0d4efcbc` · HUD live after 10i · LitRPG Summoned Pact · Jax · west wall ruined circle.

## Thumbs

- T0: start still asks a name after Usual Self; System window feels pointless
- T2: repeating the last response (`You ask why should I join you? What do you want from me`)
- T5: This isn't responding properly (`Where am i`)
- T7: Where's auto attack? Game isn't working (`Attack the people`)

## Turns (what landed)

| T | Player | GM (actual) | Path |
|---|---|---|---|
| 0 | — | Authored page 1: scavenger + two militia bark for a name. Chrome: “You are alone.” Chip: Ask what they want. | stitch page 1 |
| 1 | My name is Jax. Whats going on where am I? | They have the name Jax. You are in a ruined empty circle… The rite already failed… patrol will issue an armband… | `stitchOpeningContinue` |
| 2 | You ask why should I join you? What do you want from me | Same card dump again (They already have the name Jax + leftover rite + armband) | stitch (hall want) |
| 3 | Who are you | **The panel is the one asking.** | stitch; CAST = panel because `aloneArrival: true` |
| 4 | Inspect the panel | The panel holds the name Jax. It is a System window… | stitch panel |
| 5 | Where am i | You are in a ruined empty circle… They already have the name Jax. | stitch where |
| 6 | Attack the people | Steel rang… The strike found the foe. They still held their ground. | Silent receipt (`callGm ok in 1ms`); `present[]` empty |

## Owners

- Hall who/where/why stay on `shouldStitchOpeningContinue` forever. That path is a **ledger narrator**, not NPC speech and not a writer.
- `isAloneArrivalPick` matches `no priests` on this card’s page 1, so `aloneArrival` is true while scavenger + militia are in the prose. `openingCastLabel` then returns **the panel**.
- Page 1 still *barks for a name* after Jax is locked (`dropCoverNameAsk` only strips a trailing “What name…?”).
- Attack/Look stay Silent Engine receipts. No Auto Fight chrome. No people on `present[]`.

## 10j ship

Occupancy beats `no priests`. CAST is the militia. Who/want are spoken lines. A second want-ask is “already answered.” Continue clears a false `aloneArrival`. Silent Attack leftover.

## Voice check

- Not a table GM (no writer, no dice-as-story).
- Not a scene narrator talking to you as a character in the room.
- Questions are **not** answered by the militia/scavenger. They are answered by the stitch.
