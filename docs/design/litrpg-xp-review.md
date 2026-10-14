# LitRPG XP review (14 Oct 2026, read-only)

Rule check: the AI never decides XP (xpRules.ts:2). Character XP comes from `applySandboxXpAwards` (sandboxXp.ts), paid once per award key. Small XP for little things (inspect, vendor browse) was set to 0 in 28a (sandboxXp.ts:41-42). tt-build-7 (da99e653) did not change LitRPG amounts or the curve. It changed level-up HP to Hit Die + CON and kept the x1.5 curve from 150, "held for John".

## Current sources
| Source | File:line | Trigger | LitRPG | Story RPG | Tabletop | Free? |
|---|---|---|---|---|---|---|
| Fight won | sandboxXp.ts:269-290, xpRules.ts:57-59 | Victory or parley (escape pays 0) | 40 / mini-boss 80 / boss 150 | same | SRD CR table | No |
| Dungeon cleared | sandboxXp.ts:290 | arcStatus cleared | 100 | 100 | budget | No |
| Quest step | sandboxXp.ts:323 | Objective ticked | 50 | 50 | budget | Mostly earned |
| Quest complete | sandboxXp.ts:326 | Quest done | 100 | 100 | budget | No |
| Main-path fork / ending | sandboxXp.ts:382,385 | Picking a road / reaching an ending | 50 / 100 | same | | **Fork = choosing a chip** |
| Place reached | sandboxXp.ts:243, 378 | First arrival at a named hub or spine place | 25 each | 0 | | **Travel only** |
| Person met (opening cast) | sandboxXp.ts:296-297 | NPC is in the opening cast | 25 each | 25 | | **Free: no action needed** |
| Person met (talk) | sandboxXp.ts:300-308 | Verb like greet/ask + NPC name, NPC present | 25 each | 25 | | **Talking for nothing** |
| First Steps achievement | sandboxXp.ts:391 | First quest step **or turn >= 5** | 75 | 0 | | **Free: just survive 5 turns** |
| Fight deeds (first kill, 3, 10 wins) | sandboxXp.ts:412-418, xpRules.ts:87-96 | Counted fight wins | place/step/complete amounts | 0 | half Low budget | Earned, but stacks on top of fight XP |
| Daily milestone | dailyMilestoneLedger.ts:9; useGame.ts:4440-4447; fateAutoplay.ts:1873 | First quest tick each UTC day | +20 | +20 | | **Retention bonus, not effort** |
| Arc beat XP | arcDirector.ts:596-609 (FAST_XP_AWARDS 25/35/50, quest 15/20/50) | Arc contract beats | paid as arc xpAwards (useGame.ts:2752, fateAutoplay.ts:1183) | | | **Possible double pay** next to sandbox fight and quest XP; needs a check |
| Arc encounter default | arcDirector.ts:429 | No seed reward | 25 + 5 x level | | | Second number table |
| Social track | arcDirector.ts:895-908, socialProgression.ts:213-224 | Novel social event | social track only (10-50), no repeats | | | Not character XP; OK |
| gm-turn edge | supabase/functions/gm-turn | Nothing found granting XP | | | | OK |

Dead or duplicate tables: FAST_XP_AWARDS (xpPolicy.ts:9-19) still lists landmarkInspect 5, npcMeet 8, questAccept 15 and is used by arcDirector and beatRegistry. LITRPG_MILESTONE_XP (xpRules.ts:56-69) is a second table with different amounts (40/80/150 against 25/35/50).

## What the books do (summary from common knowledge of the series)
- **Dungeon Crawler Carl:** XP from kills, scaled by the monster's level, plus big achievement rewards for first-time or notable feats. Boxes and loot come from achievements. Walking around pays nothing.
- **He Who Fights With Monsters:** no XP bar. Abilities rank up through use and through absorbing quintessence or shards from kills. Growth is earned in danger.
- **Primal Hunter:** kills give levels, scaled by the gap between your level and the target's (weak kills give almost nothing). Skills and professions level separately through use and crafting. There are first-time titles.
- **Defiance of the Fall:** kills scale with the enemy's level. Quests and dungeon or incursion completions pay big. Titles come from firsts. Low-level kills soon pay nothing.
- **Cradle:** no XP. Advancement is a breakthrough earned through training, resources and trials.
- **The Wandering Inn:** levels arrive while sleeping, after meaningful work, danger or growth in your class. Repeating trivial acts stalls.
Common pattern: reward threat scaled to your level, first-time feats, quests and real discoveries. Skills improve through use, separate from character XP. Idle acts, travel and small talk pay nothing, and repeats fade.

## Recommended earned-XP policy
1. Use one table. LITRPG_MILESTONE_XP is the LitRPG mode setting on the shared engine; FAST_XP_AWARDS becomes an alias or is removed. Keep the x1.5 curve from 150 as LitRPG's faster curve.
2. Fights pay by threat against level. If the foe is 3+ levels below you, pay a quarter or nothing. Escapes and repeats pay 0.
3. Small XP (10-25) only for real first-time, effortful acts: a check passed under stakes, a hidden place found by a check, an NPC won over by a real social success. One per key, capped at 3 per in-game day.
4. No XP for travel, arriving, looking, greeting, picking a chip, surviving N turns, or daily logins. Places and people pay only when a check or a quest is tied to them.
5. Skill use raises skill ranks or uses, not character XP. Achievements pay once and never stack on top of the fight that earned them in the same turn.

## Cursor fix prompt (NOT RUN)
```
Read docs/design/litrpg-xp-review.md. Engine-only XP change, LitRPG and story RPG (tabletop unchanged):
1) sandboxXp.ts:391 drop the `opts.turn >= 5` path; First Steps pays only on the first quest step.
2) sandboxXp.ts:296-297 opening cast pays nothing; sandboxXp.ts:300-308 pays significantPerson only when the turn's social check succeeded.
3) sandboxXp.ts:243/378 place XP only when reached via a quest objective or a passed discovery check; else 0.
4) sandboxXp.ts:382 spine fork pays 0 (choosing is not effort).
5) Remove daily milestone XP (dailyMilestoneLedger, useGame.ts:4440-4447, fateAutoplay.ts:1873) or make it 0.
6) Prove arc beat xpAwards (arcDirector.ts:596-609) do not also pay character XP for the same fight or quest sandbox pays; if they do, keep sandbox only. Merge FAST_XP_AWARDS into LITRPG_MILESTONE_XP.
7) Fight XP: foe 3+ levels below the player pays 25%.
8) Cap small first-time awards at 3 per in-game day. Add tests for each. Do not change the curve. Run tests, then stop before ship.
End with MODE_DONE or MODE_STOP.
```
