# tt-coin-credits (14 Oct, from tt-build-order.md "John decision (15:05)" + the 15:20 note)

Shipped. Commit `68b3c585`, stamp `2026-10-14m`. Live `https://www.synapticgm.com/version.json` reads `{"hud":"2026-10-14m","build":"2026-10-14m"}`.

## The 15:23 leftovers

- `src/game/rules/coinTables.ts` (untracked) was kept as it was. It holds our own individual and hoard tables, scaled in four CR bands (0–4, 5–10, 11–16, 17+). Each band rolls a d8 for the row, and every die is shown. Both tables are marked `source: 'in-house'`. Nothing was copied from the DMG or Basic Fantasy.
- The `lootTableRegistry.ts` edit was kept, with one bug fixed. Bronze and silver chests roll on the individual table, but the edit only rolled coins for "a creature carrying a purse", so a chest never held any coin. Now a chest or hoard always rolls, scaled by the area level when no creature owns it. A humanoid foe (or an unmatched one, which counts as humanoid) rolls on its CR. A beast drops no coins, and neither does a bare ground search.

## What landed (file: function)

- `rules/coinTables.ts`: `INDIVIDUAL_COINS`, `HOARD_COINS`, `crNumber`, `coinBandFor`, `rollCoinTable`. These are the in-house tables.
- `lootTableRegistry.ts`: `DND_COINS` and `rollLoot`. Tabletop rolls coins per profile. The result carries `coins` (the exact denominations) and `gold` (the whole GP they are worth), and the coin dice lines are on `displayLines`. LitRPG, story RPG and PYOA are unchanged and roll no coins.
- `rules/coins.ts`: `gainLootMoney`, `lootMoneyText`, `lootMoneyFound`. These form one path for loot money into the ledger. A tabletop sheet character banks the exact coins rolled through the existing `gainCoins`. Every other case adds the whole GP as before. Without this, silver and copper drops would have been lost, because consumers only added whole GP.
- `combat.ts`: `rollVictoryLoot` and `simulateCombat`. `CombatResult.coinsGained` is new.
- These loot consumers now use `gainLootMoney`:
  - `engineFight.ts`: the fight resolve
  - `tabletop/roundFight.ts`: victory
  - `useGame.ts`: auto-fight
  - `travelJourney.ts`: the road cache find
  - `dungeonCard.ts`: the chest and the secret search
  - `looseItems.ts`: opening a lootable, and searching
- `legal/credits.ts`:
  - `SRD_5_2_1_NOTICE` is the exact CC BY 4.0 text.
  - The old Rules row ("not a licensed rulebook") is replaced by an SRD 5.2.1 row (Wizards of the Coast LLC, CC BY 4.0, with the notice), a "SynapticGM coin tables" row (Original), and a "LitRPG and story RPG presentation" row (Original).
  - Two libraries were added: Transformers.js `@xenova/transformers` (Apache-2.0) and `languagetool-api` (BSD-2-Clause).
  - Last updated is now 14 October 2026.
- `components/CreditsPage.tsx`: the existing page, updated rather than rebuilt. It renders a row's `notice` word for word, and the intro names the SRD 5.2.1 under CC BY 4.0.
- `components/MainMenu.tsx`: a "Credits" menu button under GM Library opens `/credits`. The small footer link stays.

## What the player sees

- **Tabletop:** after a win over a humanoid, or after opening a chest, cache or hoard, STATUS shows `Gold Gained: 3 GP, 7 SP` and a line such as `Coins (SynapticGM individual table, CR 0–4): d8 = 4; 2d6 = 7 SP [3, 4]`. The coins land in the purse as those coins. The writer still only hears "some coin" in a round fight.
- **LitRPG and story RPG:** nothing changes.
- **Main menu:** a Credits button. The Credits page shows the SRD 5.2.1 notice in a box under the Rules entry.

## Unclear licences (left for John, as `credits-sources.md` says)

- The all-MiniLM-L6-v2 embedding model: the upstream licence is said to be Apache-2.0, but that is not confirmed.
- The LanguageTool public API terms. Only the npm package is credited.
- FLUX output attribution terms.
- The art in `public/`: 69 png, 2 jpg and 10 svg (theme packs, backgrounds, maps), whose origin is not recorded.
- Bangers, which `credits-sources.md` lists under fonts but which is not in `credits.ts`. It was not added, because its use is not confirmed.

## Tests

- **New:** `src/game/ttCoinCredits.test.ts`, 8 tests, all passing. They cover:
  - the tables are in-house and each band covers the whole d8
  - CR bands and fraction parsing
  - a seeded roll shows every die, and gold equals the coin worth
  - a higher CR pays more on average
  - a bandit drops coins, a rat does not, and a bronze chest does
  - the purse banks the exact coins, plain gold is used elsewhere, and LitRPG rolls no coins
  - the Credits notice is word for word
  - the two libraries and the coin-table row are listed, with no D&D branding
- **Updated to John's ruling:** `playtest28dLoot.test.ts`. The D&D case pinned "no house coin formula" and now pins the in-house coins.
- **typecheck (`tsconfig.app.json`):** 570, which is the ceiling. There are no new errors in the touched code.
- **vitest:** 77 failing of 2642, against the baseline of 80 (77 plus 3 known flakes). There are no new failures. None of the failing files touch loot, coins or credits.
- **replay bank:** 64 failing of 628, which equals the baseline. The tt6c "magic items drop from the SRD table" case pins an older d20 item table that HEAD had already replaced, so it is a baseline failure.
- **Build:** green.
- **Stamp-pinned tests after the bump:** 25 files, all passing.

## Ship

- The stamp went from `2026-10-14l` to `2026-10-14m`, in the same files the last ship bumped.
- Commit `68b3c585` holds this step's files only. `humanJudge.mjs`, `.gitignore`, `playtest-notes.mdc` and the other order docs were left out. It is pushed.
- No edge code changed. None of these files are in the edge sync list, and the edge `travelJourney.ts` stub has no loot code. So there was no sync and no `gm-turn` deploy.
- There were no laps.

TT_DONE
