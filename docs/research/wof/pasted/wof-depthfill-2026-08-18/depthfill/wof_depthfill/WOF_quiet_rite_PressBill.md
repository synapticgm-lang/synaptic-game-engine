# WOF Quiet Rite: Bespoke Press Bill

## Store identity

**One-line pitch.** Household haunt care and original ritekeeping.

Quiet Rite begins at **Rite House**, where **Quiet Rite: Name a Working Promise** asks the player to make a practical choice before anything grand occurs. The **Rite Listener** kit sees that problem from a specific working angle, while the route toward **The Bell Cellar Listening** introduces a private 2–5 session that is clear about its stakes and its limits. The store page sells a buy-and-own text world for solo/private co-op, not an MMO. Its included **Quiet Rite Theme Kit** changes presentation without changing outcomes. Gold is **Rite Pennies**; cosmetic tokens are **Bell Threads**. Neither currency buys power, a better roll, a catch, a clear, or a lockout bypass.

| Field | Release specification |
| --- | --- |
| Maturity | teen |
| Content descriptor | Local stakes, clear safety controls, and world-specific non-graphic tension where applicable. |
| Included | World entitlement, all authored text data, and Theme Kit. |
| DLC boundary | Future cosmetic plates only; no content advantage. |
| Demand row | household haunt care and original ritekeeping serves the original setting and social/private-co-op demand lane. |

## Code and content remaining

| Item | Status | World-specific requirement |
| --- | --- | --- |
| Rule integration | CODE | `steadfast` ledger and `quiet_rite_eval_01` through `quiet_rite_eval_15`. |
| Data load | SPEC / CODE | `quiet_rite_places`, kits, NPC trees, quest DAG, drops, vendor, dungeon, interior, talents, and Theme Kit. |
| First hour | SPEC | Quiet Rite: Name a Working Promise at `quiet_rite_place_01`, then the mid-join `quiet_rite_place_04`. |
| Instance | SPEC / CODE | `The Bell Cellar Listening` through `quiet_rite_place_06`. |
| Big night | SPEC / CODE | `Candle Street Homecoming`, 2–5 players, three phases, cosmetic-only record. |
| Kill switches | CODE | disable `quiet_rite` store listing, starts, instance, big night, Theme Kit apply, or canned talk without affecting other worlds. |

## Legal and trust

It is an original WOF setting and not a licensed, historical, or platform-derived recreation. Canned hub lines are authored and not stranger LLM chat. Report, mute, and block are required support flows. Hashed telemetry only; TTS reads chrome and prose; font scaling and non-colour danger indicators are mandatory. Kid Mode, when eligible, limits play to ten text turns per day and disables public DM, trade, and voice.

## Twenty-five click tests

| id | Action | Actual placeId | Expected |
| --- | --- | --- | --- |
| quiet_rite_click_01 | open store identity | quiet_rite_place_01 | Expected: open store identity completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_02 | select age lane | quiet_rite_place_02 | Expected: select age lane completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_03 | start kit | quiet_rite_place_03 | Expected: start kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_04 | read opening stake | quiet_rite_place_04 | Expected: read opening stake completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_05 | open Ledger | quiet_rite_place_05 | Expected: open Ledger completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_06 | travel route | quiet_rite_place_06 | Expected: travel route completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_07 | meet NPC | quiet_rite_place_07 | Expected: meet NPC completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_08 | accept quest | quiet_rite_place_08 | Expected: accept quest completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_09 | complete objective | quiet_rite_place_01 | Expected: complete objective completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_10 | open vendor | quiet_rite_place_02 | Expected: open vendor completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_11 | check gold wallet | quiet_rite_place_03 | Expected: check gold wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_12 | check cosmetic wallet | quiet_rite_place_04 | Expected: check cosmetic wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_13 | apply Theme Kit | quiet_rite_place_05 | Expected: apply Theme Kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_14 | enter instance door | quiet_rite_place_06 | Expected: enter instance door completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_15 | read room-first text | quiet_rite_place_07 | Expected: read room-first text completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_16 | complete trash step | quiet_rite_place_08 | Expected: complete trash step completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_17 | activate checkpoint | quiet_rite_place_01 | Expected: activate checkpoint completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_18 | wipe safely | quiet_rite_place_02 | Expected: wipe safely completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_19 | claim personal loot | quiet_rite_place_03 | Expected: claim personal loot completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_20 | run a talent node | quiet_rite_place_04 | Expected: run a talent node completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_21 | open home interior | quiet_rite_place_05 | Expected: open home interior completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_22 | run a daily contract | quiet_rite_place_06 | Expected: run a daily contract completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_23 | open big-night record | quiet_rite_place_07 | Expected: open big-night record completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_24 | use report/mute/block | quiet_rite_place_08 | Expected: use report/mute/block completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| quiet_rite_click_25 | trigger world kill switch | quiet_rite_place_01 | Expected: trigger world kill switch completes without a public-MMO claim, power sale, or uncommitted ledger prose. |


## CI ban strings

| # | Must reject |
| --- | --- |
| 1 | Ghostbusters named place |
| 2 | The Conjuring hero silhouette |
| 3 | Insidious logo geometry |
| 4 | Supernatural TV catchphrase |
| 5 | Jujutsu Kaisen signature costume |
| 6 | Bleach proprietary creature |
| 7 | Phasmophobia map layout |
| 8 | Poltergeist faction title |
| 9 | The Exorcist weapon profile |
| 10 | Casper UI chrome |
| 11 | Ghostbusters quest premise |
| 12 | The Conjuring title typography |
| 13 | Insidious color-coded insignia |
| 14 | Supernatural TV music motif |
| 15 | Jujutsu Kaisen vehicle or mount profile |


## SPEC LLM budget

| Measure | SPEC |
| --- | --- |
| Visible prose per committed turn | 700 target / 1,200 hard ceiling tokens |
| 95th-percentile post-commit narration | under 3.0 seconds, measured before release claim |
| Retained narrative context | 18,000 tokens, refreshed from committed ledger events only |
| Safety sample | 100% store and key-art prompts; 20% canned talk per release candidate |

## Press blurb

Quiet Rite is a WOF text world about household haunt care and original ritekeeping. It begins at Rite House with Quiet Rite: Name a Working Promise, a small commitment that makes the local texture immediately useful. Choose one of four distinct kits—including the Rite Listener—then follow clear, committed choices through a private solo or 2–5 player co-op session. The named five-room instance, The Bell Cellar Listening, uses room-first description and personal loot; the closing Candle Street Homecoming gives friends a cosmetic-focused big night rather than a scaled raid claim. A complete Quiet Rite Theme Kit is included with the world. Gold, Rite Pennies, and cosmetic tokens, Bell Threads, remain separate. No gacha, outcome sale, lockout skip, or paid power item is offered. It is not described as an MMO until that capability is proven.

## FAQ

| Question | Answer |
| --- | --- |
| Is Quiet Rite an MMO? | No. It is described as solo/private co-op until multiplayer is proven. |
| What comes with the purchase? | The world and its complete Theme Kit. |
| Can I buy a better outcome? | No; outcome sales, power, clears, lockout skips, catch changes, gacha, and loot boxes are prohibited. |
| What happens after a wipe? | Return to the named checkpoint; retain personal loot and completed progress. |
| How is social play kept safe? | Friends-first private co-op, canned hub lines, and report/mute/block; no global chat or public DMs. |

## Not ready / still CODE

Entitlement restoration, exact ledger calls, deterministic instance seeding, feature flags, kill-switch monitoring, report pipeline, accessibility acceptance, device performance test, and final legal/ratings review remain CODE or approval work. This bill does not represent them as already live.
