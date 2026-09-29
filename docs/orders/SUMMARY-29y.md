# SUMMARY 29y — remembered danger and readable playback

Stamp `2026-09-29y1`. 29x travel, chance encounters, rare spawns and camp bosses were not redone.

## Why the seed 63 church threat vanished

The tape (`2026-09-29T14-46-51-119Z_cursed-keep_chilled-gm_s63`) shows it at T69. The parley check rolled `d20 1 … failure`. The engine then forced the whole fight (`Fight: DEFEAT vs Sleepless Bell-Warden`) and wrote `Encounter cleared: Sleepless Bell-Warden (defeat)`. A lost fight cleared the encounter, so nothing kept the foe. The writer never narrated the loss, so the prose only said something came down the aisle, and on the way back the aisle was quiet.

## What changed

- **The threat is remembered at its place** (new `src/game/placeThreats.ts`, `GameState.placeThreats`). At the end of `runArcDirectorBeforeGm`, `syncPlaceThreat` keeps the ledger in step:
  - A live or pending encounter at a place (the fight chip is on the card) is stored on that place. A refused parley is counted (`parleyRefused`).
  - Won, escaped or parley accepted: the threat is gone.
  - Lost (defeat or capture): the threat stays on the place with the HP the engine left it (`foeAfter` from `resolveEngineFight`). The writer is told `ENCOUNTER HELD: … still holds this place` instead of "threat cleared".
  - A live threat that went away with no fight result stays on the place.
  - Road meetings stay on the journey (29w/29x). Nothing is stored while a journey is underway.
- **Leaving and coming back finds it.** A stored threat never wakes on its own, so a quiet stretch stays quiet. At its place, with no fight live, `compileChoices` puts the existing `Press the attack` chip at the front of the card. Pressing it (or any attack line) runs the same `resolveEngineFight` on the same foe. There is no second combat system. Flee and talk lines do not wake it. While a threat is remembered there, a drought or beat spawn does not add a second foe at that place.
- **Auto player only** (`applyRememberedThreatPick`, applied after the 29x stall rules in `fateAutoplay.ts`). With a remembered threat here and a fight chip on the card, a look, wait or inspect pick, or a parley the threat already refused, becomes the fight chip. Travel and other picks are left alone. A person can still tap any chip.
- **Playback reads as one visit.**
  - The writer packet has a movement line from the engine (`movementFact`, placed right after `Location:`). It is one of three: `Moved this turn: from A to B. Narrate one arrival at B`, `No move this turn: at B before and after. Do not narrate leaving, travelling or arriving`, or, on the road, `still on <ground> between A and B`. `CirclingMemory` gains `movedTurn` and `openingPlace`.
  - Token painting binds a declared ref by its **id**, not by the writer's own numbering. On the tape the writer wrote `{"tok":"t3","id":"kit:worn-iron-shortsword"}` while REF ENUM t3 was `innkeep`, so a sword printed as "innkeep". The tok decides only when there is no id, or when the id is itself a token (`"t6"`). An id the ledger does not hold binds to nothing, and a line that uses it is dropped instead of being painted with another label. The same applies to the salvage path.
  - A card role label with no NPC record ("the innkeep", "the envoys at this table") is offered as a cast ref only at the opening place. Elsewhere it is not in REF ENUM, the allowlist, the hall-talk extras or the who-answers line, so it cannot stand in for a priest, a weapon, a trap or a chest. Named NPC records are unchanged. The writer still writes the sentences and names people. There is no canned prose, no story names in code and no word-block filter.

## Check

New `src/game/playtest29yRememberedDanger.test.ts` (12 tests, all pass):
- Stamps are `2026-09-29y1`, Mid writer OFF.
- A refused parley (d20 1) that loses the forced fight keeps the Bell-Warden on the church with HP left and `parleyRefused` 1. A threat still live after a refused parley is stored with the refusal counted. Victory, escape and parley accepted end it. A loss keeps it with the engine's leftover HP.
- Away from the church the card has no fight chip. Back at the church `Press the attack` is first. That chip re-engages the same foe through `resolveEngineFight`. Flee does not wake it, and the chip does nothing at another place.
- The auto player swaps look, wait, inspect and a re-parley for the fight chip. It keeps travel, and keeps a parley that was never refused.
- A quiet place gains no threat, no fight chip, and no fight from the chip.
- Painting follows the id (`t2` declared as the sword paints the sword, not the innkeep). An unknown id drops its line and never paints another label, in both render and salvage.
- Cast role refs appear at the opening place and not after a move.
- The movement line reads "No move" and "Moved … from Inn to Church", and it is in the writer-facing text.

## Gates

- tsc (`tsconfig.app.json`): 601, the same set as the baseline taken on the unedited code (compared with line numbers stripped). The only text change is the `... N more ...` count inside a few type dumps, because `GameState` has one more field.
- Vitest: 1960 tests, 128 failed. The failure names match the baseline (1948 tests / 128 failed), with none new.
- Build: exit 0.
- Edge: no file under `supabase/` changed, so gm-turn was not deployed.
- No T10, no T100.

Stamp `2026-09-29x1` → `2026-09-29y1` in `Hud.tsx`, `runManifest.ts`, `index.html`, `public/version.json`, and the playtest stamp checks.

Leftover: the engine still settles a whole fight in one resolve (28f), so a lost fight is one beat and the threat waits for the next press. The movement line tells the writer what moved. It does not check afterwards that the prose obeyed, because a regex over the prose would be the word-block filter this order rules out.

ALL DONE
