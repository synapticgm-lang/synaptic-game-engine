# SUMMARY 29u — travel is a journey, not a stitch

Stamp `2026-09-29u1`.

## What changed

- New owner `src/game/travelJourney.ts` (client only, not edge-copied). Before the writer, `commitTravel` runs on every exit, in live `useGame` and in Fate. It replaces the old `applyNamedHubTravel` there.
- **Distance comes from the map that already exists.** First the atlas region graph: settlements a region apart are 2 moves, further is one more per hop, up to 4. With no hop, a trip is 2 moves when the far place is a different named place (a hub, settlement or region) or when either end lies outside a settlement (threat tier 3+, a fort/landmark/ruin/shore, or a road/trail/marsh/forest blurb). A move with no named far place (for example out to the street) is 1 move and arrives this turn.
- **More than one move puts HERE on the ground between the two places.** `currentLocation` becomes the ground label and `GameState.journey` holds the trip. The label is picked from the map text of the regions or ends: Forest path, Marsh track, Mountain pass, Coast road, Open road, or Back streets. It never uses a hub or bible place name, so `matchHub` can't mistake it for an arrival.
- **Time moves with distance.** `GameState.worldHour` advances per move: 15 min for a step, 30 min per street leg, 2h road or coast, 3h forest or marsh, 4h mountain. `sceneFacts.timeOfDay` follows the hour and is pinned again after the writer on travel turns, so prose can't rewind it. The STATUS receipt shows it, for example `Travel: forest path between Greyhollow Inn and Blackspine Treeline — leg 1 of 1 — +3h, now afternoon; Blackspine Treeline still ahead`.
- **The same receipt goes to the writer** as the ENGINE RESULT fact (`Travel` was added to the engine-fact filter in both paths). The writer narrates every leg. Code writes no travel sentence.
- **The ground has its own chips.** While a trip is underway and no fight is live, `compileChoices` (the one owner for both the governance filter and the ActionBar) returns: `Walk on`, a talk chip for someone met there (a traveler on a road, whoever is on a forest path, and so on), a chip for what lives there (the animal in the trees on a forest, what moves in the reeds on a marsh, and so on), and `Turn back toward {from}`. Pressing Walk on is enough to cross. Any other action keeps HERE on the ground and adds no time. A named far place starts a new trip from the ground. A live fight keeps its own chips.
- **Leave from a named place** goes to another named place, not back into the room you came out of. This is the 100-turn tape where leaving Lowmarket reopened the grain-ship hold.
- **The leave-and-reach stitch is gone.** `ensureTravelArrivalProse` (`outdoorHubs.ts`) and `stampTravelArrivalIfSafe` (`oneCameraFight.ts`) are deleted. `enforceCameraOnProse` (`travelAuthority.ts`) returns the writer's prose unchanged on a travel turn. The post-writer stamp and location override in `useGame` and Fate now take HERE from the committed travel. Hub arrival (quest reveals, arrival beat) fires only when the trip actually arrives. The old scrubs for leftover leave/reach lines stay in place.
- `types.ts` gains `journey`, `worldHour`, `TravelJourney` and `JourneyTerrain`. `choicePipeline.isLegalEnginePad` accepts `Walk on` and `Turn back toward …`.
- Tests that asserted the stamp were updated to the new rule: `playtest28sSpineTravelKit`, `02f`, `02g`, `02s`, `31p`, `31u`, `26r`. `playtest28v1ArrivalTrim.test.ts` was removed because it only tested the deleted stamp.
- Stamp `2026-09-29t1` → `2026-09-29u1` in `Hud.tsx`, `runManifest.ts`, `index.html`, `public/version.json`, and the playtest stamp checks.

## Check

New `src/game/playtest29uTravelGap.test.ts` (8 tests, all pass):
- Saltmar → Brinewatch (shatter-coast atlas, one region apart) does not arrive on the first turn. HERE is the ground and `enforceCameraOnProse` leaves the body unchanged, with no "You leave". Walk on arrives on the next turn.
- The clock moves, and the receipt shows `+Nh, now <time>`. A street step costs less time than the Greyhollow Inn → Blackspine Treeline forest gap.
- On the ground, the chips include Walk on and a talk chip, and none of them say arrive, reach, or travel toward.
- The forest gap offers an animal chip. Turn back returns to where you came from.

## Gates

- tsc (`tsconfig.app.json`): 601, the same set as the baseline (compared with line numbers stripped, and with the "… N more …" field counts normalized, since `GameState` gained two fields).
- Vitest: 1928 tests, 128 failed, same as baseline. No new failure names.
- Build: exit 0.
- Edge: `sync-gm-edge-shared` ran. Only `types.ts`, `outdoorHubs.ts`, `oneCameraFight.ts` and `travelAuthority.ts` are kept. The edge `outdoorHubs.ts` and `types.ts` also carry the 29q `hubLinkedQuestCount` and quest-card types, which are self-contained. The sync also rewrote `mapEngine.ts`, `placeAuthority.ts` and `worldMapAuthority.ts` from 29q/29r leftovers. Those were restored, because the synced `worldMapAuthority.ts` imports `settlementQuestCards.ts`, which is not on the edge and would break gm-turn at boot. `gm-turn` deployed; OPTIONS returns 200. Deno is not installed here, so there was no `deno check`.
- No T10, no T100.

Leftover: travel inside an interior dungeon still uses the room graph (unchanged). Trips on the old tape's Summoned Pact hubs all sit in one atlas region, so they read as 2-move Back streets trips (about 1h), not as long road gaps.

ALL DONE
