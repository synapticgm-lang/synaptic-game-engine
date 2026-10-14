# tt-library (14 Oct, from tt-build-order.md "Library jobs (15:40)")

Shipped. Commit `247f4545` (step), plus `tt-library: edge sync` for the four synced edge files. Stamp `2026-10-14n`. `gm-turn` is deployed and boots. Live `https://www.synapticgm.com/version.json` reads `{"hud":"2026-10-14n","build":"2026-10-14n"}`.

Howler.js was not added: the order says it waits until the game has sound.

## Job 3: one seed home, no Math.random in game rolls

- `seededRng.ts` is the one home for seeds and dice:
  - `hashSeed` (FNV-1a), `hashUnit`, `keyedRng`, `mulberry32`, `createHashRng`, `sinHashUnit`
  - `turnRng(state, ...salt)` gives the dice for one turn of a save
  - `diceRng(...parts)` gives keyed dice when there is no turn in hand
  - `pinDice` is the test seam
- Six copies of the same FNV-1a hash now import `hashSeed`, so their output is byte-identical:
  - the three main-spine banks
  - `openingStitch`, `openingEstablishment` (`hashOpenerSeed`)
  - `mysteryCulprit`, `systemHousing`
  - `settlementQuestCards` (`hashString`)
  - `comicEligibility.hashUnitInterval`
  - `tabletop/characterBuild.seedNumber`
- Other local rngs moved to the shared file:
  - `worldSim.weekRng` now uses `createHashRng`.
  - `travelJourney`'s local `hashUnit` and `seededRng` are now the shared `hashUnit` and `keyedRng`, with the same output.
  - `lootTableRegistry.seededRandom` is now `sinHashUnit`, so loot pins do not move.
  - `fatePick.mulberry32` is re-exported from the shared file.
- `Math.random` rolls replaced in game logic:
  - `combat.ts`: `rollD20`, `rollDamage` and `simulateCombat` use `turnRng(state, 'fight', foe)`; the `rollLoot` drop chance uses `diceRng`.
  - `engineFight.ts`: the flee and parley rolls, including `srdBreakAwayCheck`.
  - `checkMath.ts`: every skill check (`resolveCheckRecord` gets `turnRng(state, 'check', label)`).
  - `dungeonCard.ts`: the trap and secret-search rolls.
  - `recoveryRules.ts`: the short-rest Hit Die.
  - `tabletop/roundFight.ts`: the round and death-save rolls.
  - Defaults now use the shared rngs in `tabletop/downtimeTurn.ts`, `tabletop/spellCasting.ts` and `rules/advancement.srdLevelUp` (the Hit Die, via `diceRng`).
  - `combatResolution.rollCombatOutcome` and `gameEngine.simulateMerchantTurn` had no callers, but both are seeded now.
- Left on `Math.random` on purpose:
  - ids and new-save seeds, because they are entropy, not rolls
  - `fatePick`'s default, because Fate's Pick plays the player's side
  - the `checkRules.rollD20WithAdv` default, a stateless helper whose callers pass an rng
  - `socialSkills.rollD20`, which keeps its sine pseudo-roll
- **Re-pin:** the first run had 27 new bank failures and 7 new vitest failures. Each one pinned dice with `vi.spyOn(Math, 'random')` or the replay harness's seeded `Math.random`, which the game no longer reads. `src/test/pinDice.setup.ts` (a vitest `setupFiles` entry, which the bank and writer-quality configs inherit) points `pinDice` at `Math.random`. That way every existing dice pin and replay tape drives the engine dice again, and no expected value changed. Play never sets `pinDice`: there, a save's dice come from its seed, turn and roll name.

## Job 1: fuse.js for typed names

- `typedNameMatch.ts` has four functions:
  - `exactTypedName`: a whole-word match always wins
  - `fuzzyTypedName`: any word in a sentence
  - `fuzzyTypedPhrase`: every word of the phrase must land on the same candidate
  - `matchTypedName`: the exact match, then the fuzzy one
- The fuzzy pass only forgives a typo in a word of 4 or more letters, with the same first letter, a length within 2, and no stopwords. So "a", "i" or "talk" can never become a person.
- People:
  - `spokenAnswer.addressee`: "ask silus…" goes to Silas Vane.
  - `npcTopicFsm.extractNpcFromInput`: a misspelt captured name maps to the person here; an exact name keeps the old behaviour.
  - `actionValidation`: a misspelt talk name is no longer rejected as "isn't present".
- Items: `actionValidation` no longer reports "You don't have: rusty dager" when the Rusty Dagger is carried, or is a prop or an interactable.
- Places: `travelJourney.typedHub`. "travel to Lowmarkt" reaches Lowmarket, both on and off the road. `outdoorHubs` (edge-synced) is untouched.
- Fuse.js is credited under Apache-2.0, with its notice, in `legal/credits.ts`.

## Job 2: zod at the edges

- `schemas.ts`:
  - `GmTurnResponseSchema` / `parseGmTurnResponse`: unknown keys pass through, a field of the wrong type drops on its own, and a body that is not an object reads as empty.
  - `SaveFileSchema` / `saveFileProblem`: keeps the three player messages word for word.
  - `SkillEntrySchema` / `parseSkillEntries`: follows `library-entry-schema-v3`. Identity and bookkeeping are checked field by field.
- `gmProxy.ts`: the gm-turn reply goes through `parseGmTurnResponse`, which replaced the hand-written `typeof` checks.
- `db.ts`: `importSave`'s three hand checks are replaced by `saveFileProblem`. `loadGame` treats a stored save that fails the schema as no save.
- The skills JSON is not used by the game yet, so its edge is the schema plus a test against all 146 entries.
- Zod is credited under MIT. Older checks elsewhere stay as they are and move over gradually, as the order says.
- No zod or fuse.js import reaches an edge-synced file.

## What the player sees

- A typo in a typed name, item or place now finds what they meant, instead of a "not here" or "you don't have" block.
- Fight, flee, parley, check, trap, rest, spell and level-up results repeat for the same save and turn. Reloading and retrying the same turn rolls the same dice.
- An imported save file that is broken shows the same messages as before.
- Credits list Fuse.js and Zod.

## Tests

- **New:** `src/game/ttLibrary.test.ts`, 10 tests, all passing. They cover:
  - `hashSeed` equals the old FNV-1a
  - `turnRng` and `diceRng` repeat, and differ by salt and turn
  - a pinned source drives every roll
  - `fatePick` shares `mulberry32`
  - fuse matches typos and refuses short words, chip verbs and a different item
  - the zod gm-turn and save schemas
  - all 146 skill entries pass
  - the credits rows exist
- **typecheck:** 570, which is the ceiling. There are no new errors in the touched code.
- **vitest:** 78 failing, against the baseline of 80 (77 plus 3 flakes). There are no new failures.
  - Two names beyond the baseline list are flakes. `seed94InfestationClear` passes when run alone. `playtest30iFogOfWar` builds its atlas from a random new-save seed and passed 3 of 4 runs alone.
- **replay bank:** 64 failing, the same 64 as the baseline.
  - The first bank run lost 22 suites to a Windows temp-file rename error in the Vite SSR cache. The rerun was clean.
- **writer-quality:** the same 11 known failures (s78–s84).
- **Build:** green.
- **Stamp-pinned tests after the bump:** 24 files, 255 tests, all passing.
- Fix runs: one (the `pinDice` seam).

## Ship

- The stamp went from `2026-10-14m` to `2026-10-14n`, in the same files the last ship bumped.
- Commit `247f4545` holds this step's files only. `humanJudge.mjs`, `.gitignore`, `playtest-notes.mdc`, the other order docs and the `.tmp` files were left out. It is pushed.
- Edge code changed, so I ran `npm run sync:gm-edge`. It updated `seededRng.ts`, `checkMath.ts`, `mysteryCulprit.ts` and `systemHousing.ts` under `_shared/gm`. That sync was committed, pushed and deployed with `npx supabase functions deploy gm-turn`.
- The boot check passed: OPTIONS returned 200, and an empty POST returned 400 (the function's own rejection, not a 503 boot error).
- `version.json` read `2026-10-14n` after 30 seconds.
- There were no laps.

TT_DONE
