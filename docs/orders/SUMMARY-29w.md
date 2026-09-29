# SUMMARY 29w — chance encounters on the road

Stamp `2026-09-29w1`. 29u was not redone. This order builds on its journey owner.

## What changed

- **Each stretch rolls once, in `src/game/travelJourney.ts`.** The roll happens when a trip starts and on each Walk on or Turn back that does not arrive. It is seed-stable per save, trip and leg (`state.seed` + from + to + start turn + leg), so a reload does not reroll it. The result is stored on `journey.encounter`: `null` means a quiet stretch.
- **Not every step, not too rare.** The base chance is 40%. Each quiet stretch in a row adds 25%, and after two quiet stretches the next one always has a meeting. So the longest trip (3 stretches) always meets something. Over 200 seeds on the inn-to-treeline trip, between 20% and 70% of stretches have a meeting.
- **The kind fits the ground** (`encounterPool`):
  - Forest, marsh or mountain: wildlife. A camp can appear on the first or last stretch (the edge of the wilds), but not on a mountain.
  - Road or coast: a traveler, someone on the way, thugs, or a camp.
  - Back streets: a traveler, someone on the way, or thugs.
  - A ruin, graveyard, crypt, tomb, barrow or battlefield at either end or on a region along the way marks the trip as haunted, which adds undead to the pool with a heavy weight.
  - Monsters and villains only appear at area tier 3 or higher. A tier-1 village path never has one. Wildlife at tier 3 or higher is flagged dangerous, so a high wild does not give only a harmless animal.
- **The level follows the area by the treasure rule.** The area tier is the higher threat tier of the two ends (hub or place record, with ruins, forts, landmarks and shores counted as tier 2). If neither end has one, it falls back to the zone's `resolveThreatTier`. `roadEncounterLevel` runs that tier through `resolveLocalAreaLevel`, the same function treasure uses (tier to level, clamped to the party level ±3).
- **The writer names it.** The travel receipt (STATUS line and ENGINE RESULT fact) ends with either `; quiet stretch` or `; chance meeting: thugs (level 4)`. There is no canned prose and no story names in code. The "still on the ground" receipt repeats the meeting while the player deals with it.
- **Chips.** On a quiet stretch the chips are only `Walk on` and `Turn back toward {from}`. With a meeting, the chips for that kind go between those two: the 29u animal or talk chip for wildlife or a traveler, `Greet whoever is coming`, `Face the thugs` / `Talk your way past the thugs`, `Approach the camp` / `Skirt around the camp`, `Face the dead` / `Slip past the dead`, `Face the creature` / `Hide from the creature`, and `Face whoever blocks the way` / `Talk to whoever blocks the way`. Any encounter chip keeps HERE on the ground and adds no time. Walk on then continues the road and rolls the next stretch.
- `types.ts`: `TravelJourney` gains `areaTier`, `haunted`, `encounter` and `quietStretches`. New `RoadEncounter` and `RoadEncounterKind`. No wiring change in `useGame` or Fate: they already carry `journey` and the receipt.

## Check

New `src/game/playtest29wRoadEncounters.test.ts` (9 tests, all pass):
- A stretch with no encounter shows exactly Walk on and Turn back, and its receipt says quiet stretch.
- The meeting rate is within 20–70%, and two quiet stretches force a meeting.
- A forest chance is wildlife (no thugs or travelers in that pool) and offers the animal chip.
- The inn-to-graveyard trip is haunted, and a seed gives undead with `Face the dead`.
- A road pool has traveler, meeting, thugs and camp. A camp only appears at the edge of the wilds.
- No monster or villain at tier 1. Both appear at tier 3. High-tier wildlife is flagged dangerous.
- The encounter level equals the treasure level for the same tier, and tier 2 is higher than tier 1.
- An encounter chip stays on the ground. Walk on arrives.

`playtest29uTravelGap.test.ts`: the two chip tests no longer expect a talk and an animal chip on every stretch. They now check Walk on and Turn back, and that the animal chip appears only when the roll is wildlife.

## Gates

- tsc (`tsconfig.app.json`): 601 errors, the same set as the baseline (compared with line numbers stripped).
- Vitest: 1937 tests, 128 failed. The failure names are the same as the baseline, with none new.
- Build: exit 0.
- Edge: no edge file changed, so gm-turn was not deployed.
- No T10, no T100.

Stamp `2026-09-29u1` → `2026-09-29w1` in `Hud.tsx`, `runManifest.ts`, `index.html`, `public/version.json`, and the playtest stamp checks.

Leftover: an encounter is prose plus chips only. Thugs, undead or monsters do not open a live `activeEncounter` fight, so any fight on the road is written, not resolved by the combat engine.

ALL DONE
