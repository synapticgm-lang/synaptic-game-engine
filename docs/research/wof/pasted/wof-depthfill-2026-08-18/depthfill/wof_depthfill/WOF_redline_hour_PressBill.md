# WOF Redline Hour: Bespoke Press Bill

## Store identity

**One-line pitch.** Closed-course time trials and clean racing.

Redline Hour begins at **Starter Bay**, where **Redline Hour: Name a Working Promise** asks the player to make a practical choice before anything grand occurs. The **Apex Caller** kit sees that problem from a specific working angle, while the route toward **The Copper Loop Relay** introduces a private 2–5 session that is clear about its stakes and its limits. The store page sells a buy-and-own text world for solo/private co-op, not an MMO. Its included **Redline Hour Theme Kit** changes presentation without changing outcomes. Gold is **Lap Credits**; cosmetic tokens are **Flag Stitches**. Neither currency buys power, a better roll, a catch, a clear, or a lockout bypass.

| Field | Release specification |
| --- | --- |
| Maturity | all-ages |
| Content descriptor | Local stakes, clear safety controls, and world-specific non-graphic tension where applicable. |
| Included | World entitlement, all authored text data, and Theme Kit. |
| DLC boundary | Future cosmetic plates only; no content advantage. |
| Demand row | closed-course time trials and clean racing serves the original setting and social/private-co-op demand lane. |

## Code and content remaining

| Item | Status | World-specific requirement |
| --- | --- | --- |
| Rule integration | CODE | `lap_time` ledger and `redline_hour_eval_01` through `redline_hour_eval_15`. |
| Data load | SPEC / CODE | `redline_hour_places`, kits, NPC trees, quest DAG, drops, vendor, dungeon, interior, talents, and Theme Kit. |
| First hour | SPEC | Redline Hour: Name a Working Promise at `redline_hour_place_01`, then the mid-join `redline_hour_place_04`. |
| Instance | SPEC / CODE | `The Copper Loop Relay` through `redline_hour_place_06`. |
| Big night | SPEC / CODE | `Hourglass Night Run`, 2–5 players, three phases, cosmetic-only record. |
| Kill switches | CODE | disable `redline_hour` store listing, starts, instance, big night, Theme Kit apply, or canned talk without affecting other worlds. |

## Legal and trust

It is an original WOF setting and not a licensed, historical, or platform-derived recreation. Canned hub lines are authored and not stranger LLM chat. Report, mute, and block are required support flows. Hashed telemetry only; TTS reads chrome and prose; font scaling and non-colour danger indicators are mandatory. Kid Mode, when eligible, limits play to ten text turns per day and disables public DM, trade, and voice.

## Twenty-five click tests

| id | Action | Actual placeId | Expected |
| --- | --- | --- | --- |
| redline_hour_click_01 | open store identity | redline_hour_place_01 | Expected: open store identity completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_02 | select age lane | redline_hour_place_02 | Expected: select age lane completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_03 | start kit | redline_hour_place_03 | Expected: start kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_04 | read opening stake | redline_hour_place_04 | Expected: read opening stake completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_05 | open Ledger | redline_hour_place_05 | Expected: open Ledger completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_06 | travel route | redline_hour_place_06 | Expected: travel route completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_07 | meet NPC | redline_hour_place_07 | Expected: meet NPC completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_08 | accept quest | redline_hour_place_08 | Expected: accept quest completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_09 | complete objective | redline_hour_place_01 | Expected: complete objective completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_10 | open vendor | redline_hour_place_02 | Expected: open vendor completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_11 | check gold wallet | redline_hour_place_03 | Expected: check gold wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_12 | check cosmetic wallet | redline_hour_place_04 | Expected: check cosmetic wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_13 | apply Theme Kit | redline_hour_place_05 | Expected: apply Theme Kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_14 | enter instance door | redline_hour_place_06 | Expected: enter instance door completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_15 | read room-first text | redline_hour_place_07 | Expected: read room-first text completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_16 | complete trash step | redline_hour_place_08 | Expected: complete trash step completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_17 | activate checkpoint | redline_hour_place_01 | Expected: activate checkpoint completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_18 | wipe safely | redline_hour_place_02 | Expected: wipe safely completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_19 | claim personal loot | redline_hour_place_03 | Expected: claim personal loot completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_20 | run a talent node | redline_hour_place_04 | Expected: run a talent node completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_21 | open home interior | redline_hour_place_05 | Expected: open home interior completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_22 | run a daily contract | redline_hour_place_06 | Expected: run a daily contract completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_23 | open big-night record | redline_hour_place_07 | Expected: open big-night record completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_24 | use report/mute/block | redline_hour_place_08 | Expected: use report/mute/block completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| redline_hour_click_25 | trigger world kill switch | redline_hour_place_01 | Expected: trigger world kill switch completes without a public-MMO claim, power sale, or uncommitted ledger prose. |


## CI ban strings

| # | Must reject |
| --- | --- |
| 1 | Mario Kart named place |
| 2 | Need for Speed hero silhouette |
| 3 | Forza logo geometry |
| 4 | Gran Turismo catchphrase |
| 5 | Cars Pixar signature costume |
| 6 | F1 proprietary creature |
| 7 | Initial D map layout |
| 8 | Fast and Furious faction title |
| 9 | Trackmania weapon profile |
| 10 | Wipeout UI chrome |
| 11 | Mario Kart quest premise |
| 12 | Need for Speed title typography |
| 13 | Forza color-coded insignia |
| 14 | Gran Turismo music motif |
| 15 | Cars Pixar vehicle or mount profile |


## SPEC LLM budget

| Measure | SPEC |
| --- | --- |
| Visible prose per committed turn | 700 target / 1,200 hard ceiling tokens |
| 95th-percentile post-commit narration | under 3.0 seconds, measured before release claim |
| Retained narrative context | 18,000 tokens, refreshed from committed ledger events only |
| Safety sample | 100% store and key-art prompts; 20% canned talk per release candidate |

## Press blurb

Redline Hour is a WOF text world about closed-course time trials and clean racing. It begins at Starter Bay with Redline Hour: Name a Working Promise, a small commitment that makes the local texture immediately useful. Choose one of four distinct kits—including the Apex Caller—then follow clear, committed choices through a private solo or 2–5 player co-op session. The named five-room instance, The Copper Loop Relay, uses room-first description and personal loot; the closing Hourglass Night Run gives friends a cosmetic-focused big night rather than a scaled raid claim. A complete Redline Hour Theme Kit is included with the world. Gold, Lap Credits, and cosmetic tokens, Flag Stitches, remain separate. No gacha, outcome sale, lockout skip, or paid power item is offered. It is not described as an MMO until that capability is proven.

## FAQ

| Question | Answer |
| --- | --- |
| Is Redline Hour an MMO? | No. It is described as solo/private co-op until multiplayer is proven. |
| What comes with the purchase? | The world and its complete Theme Kit. |
| Can I buy a better outcome? | No; outcome sales, power, clears, lockout skips, catch changes, gacha, and loot boxes are prohibited. |
| What happens after a wipe? | Return to the named checkpoint; retain personal loot and completed progress. |
| How is social play kept safe? | Friends-first private co-op, canned hub lines, and report/mute/block; no global chat or public DMs. |

## Not ready / still CODE

Entitlement restoration, exact ledger calls, deterministic instance seeding, feature flags, kill-switch monitoring, report pipeline, accessibility acceptance, device performance test, and final legal/ratings review remain CODE or approval work. This bill does not represent them as already live.
