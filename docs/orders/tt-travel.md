# tt-travel — the travel day (gm-travel-practice gaps 1–5)

Order: `docs/orders/tt-build-order.md`, the section John approved (14 Oct, 11:17), with its reuse list. Tabletop follows SRD 5.2.1 as written (the 12:45 rule and tt-fix-6).

## Result: stopped, not shipped

The build is complete in the working tree. The engine, the wiring, the tests and the stamp bump to `2026-10-14l` are all in place. Nothing is committed or pushed, the edge is not synced, and `gm-turn` is not deployed. Live stays on `2026-10-14k`.

**Why it stopped:** the replay bank has 37 new failures against clean HEAD. I had already used the one allowed fix run on two vitest failures, so I did not touch these.

**What causes them:** one thing. These tapes were recorded under the old meeting roll:
- a chance on every stretch;
- a guaranteed meeting after 2 quiet stretches;
- the old kind pool.

Their cases pin a particular meeting on a particular turn, for example thugs on s79 T14, s72 T11 and m2s140 T15, and the camp mini-boss on mode3 g5-150 T7. The new roll replays these turns differently: a d6 per 4-hour watch, about 1 in 3 meetings hostile, and the new kinds `signs`, `plea` and `lair`. The replays now meet nothing or a different kind, so the fights those cases are built on never happen. Everything that comes after a fight fails with them:
- loot (Fine Longsword) and the XP paid on the fight turn;
- the First Kill achievement and the Bronze box (modeGap5);
- Col Thatch's fight (modeGap6);
- the titles in modeGap2 and modeGap3;
- crit and armor-training fight lines (tt5, tt6b);
- parley (mode4 and m9).

No case failed on a rules line itself. I did not see a broken travel rule in any of the 37.

**John to decide, one of:**
- **(a)** Re-pin those cases to what the replays meet now, or move them onto turns that still hold a fight.
- **(b)** Have replays of old tapes keep the encounter that is recorded on the tape (a replay-only seam), so new rolls only affect new play.
- **(c)** Re-record the affected tapes under the new roll.

## What landed (in tree)

### The shared engine, `src/game/rules/travelDay.ts` (new, with the SRD CC-BY header)

- **Terrain:** the SRD Travel Terrain table (`SRD_TRAVEL_TERRAIN`) and Good Roads. Pace is clamped by `maxTravelPace` / `paceOnGround`, and `travelPace.travelPaceOf` uses this clamp for tabletop.
- **Extended Travel:** `TRAVEL_DAY_HOURS`, `extendedTravelDc`.
- **Meetings:** encounter distance from the SRD dice (`encounterDistanceFt`), and the meeting check (`meetingOn`, `WATCH_HOURS`, `CAMP_WATCHES`).
- **Weather:** `weatherFor`, `WEATHER_RULE` (heavy rain and fog: Lightly Obscured, Perception Disadvantage; strong wind: ranged weapon attacks Disadvantage), and `needsNavigation`.
- **Travel jobs:** `TRAVEL_JOB`, with guide, look-out and forager rolled against the SRD Navigation, Search and Foraging DCs. Job chips are `JOB_CHIP`, and `travelEngineChip` recognises the engine's chips.
- **Meeting intent:** `MEETING_WANT`, shown before any fight.
- **Named stops:** `makeRouteStops` and `routeKey`. Names are original and contain no WOF names.
- **Rations:** `eatRation`.
- **Exhaustion:** `exhaustionD20`, `exhaustionSpeed`, `gainExhaustion`, `STARVE_DAYS`, `EXHAUSTION_DEATH`.

### `src/game/travelJourney.ts`

- **Meeting check:** `rollRoadEncounter` is the d6 check. `pickMeetingKind` picks hostile or not by `hostileShare`, then the kind within that group by the pillar sliders.
- **Each meeting:** `meetingCheck` sets what the meeting wants, how far off it is (in feet), and whether it surprises the party (when no one keeps that watch). `roadMeetingFact` gives the writer the intent first.
- **The day roll:** `rollDay` rolls the weather (a d20) and each job's check once a day. A failed guide gets lost and the trip runs one stretch longer. A successful forager feeds the party for the day.
- **Chips:** `takeJob` handles the job chips.
- **Pushing on:** `marchHours` makes the SRD Constitution saves for each hour past 8. A failed save adds one Exhaustion level.
- **Camp:** `makeCamp` runs the watch order, then a meeting check each watch; a hostile meeting breaks the camp. Then come rations or Malnutrition, the SRD rest (`recoveryRules.applyCampRest`), and companion talk by the fire (`companions.settleCampTalk`).
- **Travel on:** `travelOn` walks stretch after stretch and stops only on arrival, a meeting, getting lost, a find, or the day being spent.
- **Stops and finds:** `withRouteStops` / `passStop` place the named stops. A find needs the look-out's success. A cache rolls `chestBronze` loot. Discovery XP is 0 in tabletop, where XP comes from CR only.
- **Arrival:** `arrive` adds a first sight (first visit only) and a hook (a quest at the destination).
- **Writer facts:** `withBeat` / `travelBeatFact`.
- **Pads:** `journeyPads` offers Walk on, Travel on (when 2 or more stretches are left), and one job chip. When the day is spent it offers Make camp and Push on through the night.

### Rules wiring

- **`checkMath.skillCheckMods`:** exhaustion applies −2 per level to checks. Weather notes and Perception Disadvantage apply in every mode. `resolveCheckContext` passes travel-engine chips through with no second check.
- **`tabletop/roundFight.withExhaustion`:** applies −2 per level to initiative, saves, stealth and every to-hit roll, and −5 ft Speed per level. Strong wind sets `strongWind`.
- **`rules/roundCombat`:** strong wind gives Disadvantage on ranged weapon attacks, the PC's and the foes'.
- **`engineFight`:** an unwatched hostile meeting surprises the party.
- **`recoveryRules`:**
  - A Long Rest removes one Exhaustion level, except while starving.
  - `applyCampRest` is the camp's rest. Under the gritty variant it is a short rest.
  - `applyRestHeal` now goes through the same per-mode `presentRest` step.
- **`modeProfile.travelSurvival`:** true for tabletop only.
- **Types (`types.ts`):** new fields on `TravelJourney` and `RoadEncounter`, `Character.exhaustion`, and `GameState.routeStops` / `travelBeat`.

### Turn paths

- `completedEventPacket.movementFact` appends `travelBeatFact`.
- `useGame` and `fateAutoplay` push `travelCommit.extra` onto STATUS.
- The writer is told what happened. It is never asked for a roll, and no options list is added.

## What each mode shows

- **Tabletop (dnd):**
  - STATUS: the weather with its SRD rule, the dice lines for each job, Lost, the Extended Travel saves, and the Exhaustion levels.
  - Camp: the watch order, Rations, Malnutrition, the SRD rest line, and a "Travel on: N stretches, +Xh" summary.
  - Rations, forced march and exhaustion are tabletop only (`travelSurvival`).
- **LitRPG:** the weather without the rule text, the job dice lines, the short rest line and the summary. No rations, forced march or exhaustion.
- **Story RPG and PYOA:** no dice lines and no weather line. Companions take the jobs on their own, with no job chip. Only the writer facts change.

## Numbers: SRD versus GM calls

- **SRD 5.2.1 as written:**
  - the Travel Terrain table: maximum pace, distance dice, and the Foraging, Navigation and Search DCs;
  - Good Roads;
  - Extended Travel: DC 10 + 1 per hour past 8;
  - Exhaustion: −2 per level on D20 Tests, −5 ft Speed per level, death at level 6, a Long Rest removes 1;
  - Malnutrition: a level at the end of day 5 without food and one each day after, not removed until the creature eats;
  - Rations;
  - Heavy Precipitation and Strong Wind;
  - the Long Rest watch allowance.
- **GM calls, where the SRD leaves it to the GM, the same in every mode:**
  - a d6 meeting check per 4-hour watch: a meeting on 1, or on 1–2 on dangerous or haunted ground;
  - hostile share `hw/(hw+2·ow)`, which is 1/3 at the default sliders;
  - the d20 weather table;
  - what each meeting wants;
  - a companion's job modifier is PB + 1;
  - 1–2 named stops per route, half with a find;
  - streets are not a travel day;
  - a solo PC keeps the first watch, and the second goes unwatched.

## Reuse

- **Used:** `rules/exploration.ts` (light, through `checkMath`), `travelJourney.ts`, `travelPace.ts`, `encounterBiomeMatrix.ts` (the existing pool path), `recoveryRules` (the SRD rest), `lootTableRegistry.rollLoot`, and `companions` (approval).
- **WOF route-lantern pack:** used for the stops model only. Nothing is imported from `wof/`, and there are no WOF names in live code.
- **Skill families 29 (gathering) and 31 (survival and navigation):** not delivered yet. `TRAVEL_JOB.*.libraryFamily` is the hook; until they land, the jobs roll the SRD skill.
- **`WOF_Travel_Taxi_Ferry.yaml`:** does not exist in the repo, so nothing was taken from it.

## Tests

- **New:**
  - `src/game/ttTravel.test.ts`: 20 tests, all passing.
  - `src/__tests__/replayBank/ttTravel.bank.ts`: 4 cases from the real cursed-keep ds151 tape (T19 forest path out of Mira's Apothecary, T7 back streets), all passing.
- **Updated to the new rule:**
  - `playtest29wRoadEncounters` and `playtest29xRareCampStall` (meeting rate, hostile share, job and Travel on chips);
  - `roadFightOutcome`: the fixture keeps the way, because the case is about the flee;
  - `s85Roots`: any person on the road who speaks.
- **typecheck (`tsconfig.app.json`):** 572. Clean HEAD is also 572, so this adds 0. HEAD was already 2 over the 570 cap before this step.
- **build:** green.
- **vitest:** 79 failing against 78 at HEAD after the fix run. The extra one is `playtest27aRepair1` "27b Repair 2 S3", which flips: it passed in my run and failed at HEAD, and it fails at HEAD without these changes.
- **writer-quality:** 11 failing, the same 11 as HEAD.
- **replay-bank:** 101 failing against 64 at HEAD; the 37 new ones are described above.
- **Already failing at HEAD, not from this step:** the ds151 tape now opens at Barred Oak Gate, not Keep Gate (the tabletop spine). Because of that, tt4 and tt6a fail 5 cases on clean HEAD too, and tt6a's T7 case is no longer a road.

## Leftovers

- **Sheet speed:** exhaustion lowers Speed in the fight profile and at each roll, but not on the sheet UI.
- **Death saves:** they do not take the exhaustion penalty yet.
- **Malnutrition:** the "less than half rations: DC 10 Constitution save" case is not modelled. A day is fed or not.
- **Waterborne:** travel has no waterborne ground. The table row is unused.

TT_STOP
