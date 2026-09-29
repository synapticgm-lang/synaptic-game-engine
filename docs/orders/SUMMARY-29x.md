# SUMMARY 29x — rare spawns, camp mini-boss, stall fixes

Stamp `2026-09-29x1`. 29u and 29w were not redone. This order builds on the 29w roll in `src/game/travelJourney.ts`.

## What changed

- **Rare spawn.** The same seeded stretch roll now has a third roll. A hostile meeting (thugs, undead, monster, villain) is a rare spawn 12% of the time (`RARE_SPAWN_CHANCE`). Wildlife, travelers, meetings and camps are never rare. The receipt reads `chance meeting: rare spawn, thugs (level 2), working this stretch`. The writer names it.
- **Rare loot is slightly better, still scaled.** New loot profile `rareSpawn` in `lootTableRegistry.ts`: one roll on the same area-tier curve as a mob, but it never drops nothing and has an Uncommon floor. A new `ceilingAboveTier` field caps every item one rarity step above the area tier, so a tier-1 path tops out at Rare and never drops Epic or Legendary, even if pity triggers. In D&D it is one coin purse plus one Uncommon-or-better item. `profileForEncounter` maps a `rare-spawn` source to it.
- **Camp mini-boss.** Half of camps hold a mini-boss (`CAMP_MINI_BOSS_CHANCE`). That camp's chips are `Approach the camp`, `Face the camp's champion`, `Skirt around the camp`. A camp with no mini-boss keeps the 29w chips and no fight.
- **Facing a hostile meeting opens a real fight.** This also closes the 29w leftover. `Face the thugs` / `Face the dead` / `Face the creature` / `Face whoever blocks the way` / `Face the camp's champion` (or a typed face / fight / attack line) sets `activeEncounter` in `commitTravel`. The existing path then takes over: the fight pads (`Press the attack`, flee, parley), then `resolveEngineFight` with XP and loot. HERE stays on the ground. Walk on is blocked while the fight is live. After the fight (win, loss or escape) the meeting is marked `engaged`, its chips go away, and the receipt says `a camp dealt with`. Fights open only where the mode allows combat (LitRPG and tabletop). Story RPG and PYOA keep the meeting in prose, as before.
- **Foe stats (`roadFoe`) are at the area level.** An ordinary road foe is the encounter level. A rare spawn is the same level with about 1.25× HP, +1 AC and Strength, and more gold. The camp mini-boss is one level higher, with 2.2× HP, +2 AC, +3 Strength and Constitution, double XP and gold, and the `miniBoss` loot profile and XP milestone. Names are roles only (`the thugs`, `the camp's champion`). The writer names who or what they are.
- **Loot and XP on the ground follow the road.** `resolveThreatTier` (`placeAuthority.ts`) returns the trip's `areaTier` while a journey is underway, so treasure and the over-level XP cut use the country being crossed, not the last place's sheet. `roadEncounterLevel` clears the journey before it reads the tier.
- **Living world, bounded.** Each meeting receipt now says what it was already doing (`camped here for its own reason`, `on their own errand`, `working this stretch`, and so on). The still-on-the-ground receipt shows the clock's time of day. There is no new simulation and there are no story names.
- **Stall rules, auto player only** (`applyAutoPlayerStallRules` in `choiceRanking.ts`, applied to the Fate pick in `fateAutoplay.ts`). The chip pad is not changed, so a person can still tap anything.
  - If the pick is talking to someone whose answer was already heard (a met NPC named in the chip, or that talk already tried here with no progress), and an untried job or unused exit is offered, the auto player takes the job first, else the exit.
  - If the last auto picks (`circling.recentFamilies`, 2–3 entries) were all look, wait or inspect, and an untried quest step, job or unused exit is offered, the auto player takes it.
  - A job is the quest step or an accept / take-the-job chip (talk chips excluded). An unused exit is travel to an unvisited place, `Walk on`, `Enter` or the next unexplored room, not already tried here.
- `types.ts`: `RoadEncounter` gains `rare`, `miniBoss` and `engaged`.

## Check

New `src/game/playtest29xRareCampStall.test.ts` (11 tests, all pass):
- Rare spawn: only hostile kinds under the rare roll. Over 400 graveyard trips it appears but stays under 30% of undead meetings. The receipt says rare spawn. Facing it opens a live fight at the encounter level, with more HP than the ordinary foe and the `rareSpawn` profile.
- Rare loot: over 300 seeds on a tier-1 path it never drops nothing, and every item is Uncommon or Rare (no Epic or Legendary). The mob profile does drop nothing sometimes. The D&D purse gives gold plus one Uncommon+ item.
- Camp: a mini-boss camp offers the champion chip, and a plain camp does not and opens no fight. The mini-boss is a level higher, has at least 2× HP and more AC and XP, and uses the mini-boss profile. A tier-1 mini-boss is below a tier-3 ordinary foe. With the same seeded dice it takes more rounds than the ordinary foe (at least 2) through `resolveEngineFight`, clears, and leaves only Walk on and Turn back. Story RPG mode opens no fight.
- Stall rules: a heard NPC talk pick becomes the job, else the exit. Talk stays when there is no way on or the NPC has not answered yet. Look/wait/inspect-only picks become the exit or the quest step. Mixed picks are left alone.

`playtest29wRoadEncounters.test.ts`: the "encounter chip stays on the ground" test now presses a non-fight chip, because a face chip now opens a fight.

## Gates

- tsc (`tsconfig.app.json`): 601, the same set as the baseline taken before the edits (compared with line numbers stripped).
- Vitest: 1948 tests, 128 failed. The failure names match the baseline, with none new.
- Build: exit 0.
- Edge: no file under `supabase/` changed, so gm-turn was not deployed.
- No T10, no T100.

Stamp `2026-09-29w1` → `2026-09-29x1` in `Hud.tsx`, `runManifest.ts`, `index.html`, `public/version.json`, and the playtest stamp checks.

Leftover: the engine still settles a whole fight in one resolve (28f). The mini-boss is a challenge because of its stats (more rounds, more damage taken, a real chance to lose), not because of a round-by-round loop. Wildlife is never a rare spawn and never opens a fight, because its chip is "deal with", not "face".

ALL DONE
