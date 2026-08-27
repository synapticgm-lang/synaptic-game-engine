# WOF Brasswake: Bespoke Press Bill

## Store identity

**One-line pitch.** A smoke-bright chain of rail moorings where mail-riggers, boiler hands, lift engineers, and signal printers keep sky islands connected without letting profit cut loose the people below.

Brasswake begins at **Cinder Dock**, where **Brasswake: Name a Working Promise** asks the player to make a practical choice before anything grand occurs. The **Mail-Rigger** kit sees that problem from a specific working angle, while the route toward **The Misfiled Elevator** introduces a private 2–5 session that is clear about its stakes and its limits. The store page sells a buy-and-own text world for solo/private co-op, not an MMO. Its included **Brasswake Theme Kit** changes presentation without changing outcomes. Gold is **Cinder Crowns**; cosmetic tokens are **Cloud Ribbons**. Neither currency buys power, a better roll, a catch, a clear, or a lockout bypass.

| Field | Release specification |
| --- | --- |
| Maturity | teen |
| Content descriptor | Local stakes, clear safety controls, and world-specific non-graphic tension where applicable. |
| Included | World entitlement, all authored text data, and Theme Kit. |
| DLC boundary | Future cosmetic plates only; no content advantage. |
| Demand row | clockwork airship and rail adventure serves the original setting and social/private-co-op demand lane. |

## Code and content remaining

| Item | Status | World-specific requirement |
| --- | --- | --- |
| Rule integration | CODE | `hp_check` ledger and `brasswake_eval_01` through `brasswake_eval_15`. |
| Data load | SPEC / CODE | `brasswake_places`, kits, NPC trees, quest DAG, drops, vendor, dungeon, interior, talents, and Theme Kit. |
| First hour | SPEC | Brasswake: Name a Working Promise at `brasswake_place_01`, then the mid-join `brasswake_place_04`. |
| Instance | SPEC / CODE | `The Misfiled Elevator` through `brasswake_place_06`. |
| Big night | SPEC / CODE | `Sky-Patch Supper`, 2–5 players, three phases, cosmetic-only record. |
| Kill switches | CODE | disable `brasswake` store listing, starts, instance, big night, Theme Kit apply, or canned talk without affecting other worlds. |

## Legal and trust

It is not a borrowed Victorian city, a known floating academy, or a familiar steampunk revolution. Canned hub lines are authored and not stranger LLM chat. Report, mute, and block are required support flows. Hashed telemetry only; TTS reads chrome and prose; font scaling and non-colour danger indicators are mandatory. Kid Mode, when eligible, limits play to ten text turns per day and disables public DM, trade, and voice.

## Twenty-five click tests

| id | Action | Actual placeId | Expected |
| --- | --- | --- | --- |
| brasswake_click_01 | open store identity | brasswake_place_01 | Expected: open store identity completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_02 | select age lane | brasswake_place_02 | Expected: select age lane completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_03 | start kit | brasswake_place_03 | Expected: start kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_04 | read opening stake | brasswake_place_04 | Expected: read opening stake completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_05 | open Ledger | brasswake_place_05 | Expected: open Ledger completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_06 | travel route | brasswake_place_06 | Expected: travel route completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_07 | meet NPC | brasswake_place_07 | Expected: meet NPC completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_08 | accept quest | brasswake_place_08 | Expected: accept quest completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_09 | complete objective | brasswake_place_01 | Expected: complete objective completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_10 | open vendor | brasswake_place_02 | Expected: open vendor completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_11 | check gold wallet | brasswake_place_03 | Expected: check gold wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_12 | check cosmetic wallet | brasswake_place_04 | Expected: check cosmetic wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_13 | apply Theme Kit | brasswake_place_05 | Expected: apply Theme Kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_14 | enter instance door | brasswake_place_06 | Expected: enter instance door completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_15 | read room-first text | brasswake_place_07 | Expected: read room-first text completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_16 | complete trash step | brasswake_place_08 | Expected: complete trash step completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_17 | activate checkpoint | brasswake_place_01 | Expected: activate checkpoint completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_18 | wipe safely | brasswake_place_02 | Expected: wipe safely completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_19 | claim personal loot | brasswake_place_03 | Expected: claim personal loot completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_20 | run a talent node | brasswake_place_04 | Expected: run a talent node completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_21 | open home interior | brasswake_place_05 | Expected: open home interior completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_22 | run a daily contract | brasswake_place_06 | Expected: run a daily contract completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_23 | open big-night record | brasswake_place_07 | Expected: open big-night record completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_24 | use report/mute/block | brasswake_place_08 | Expected: use report/mute/block completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| brasswake_click_25 | trigger world kill switch | brasswake_place_01 | Expected: trigger world kill switch completes without a public-MMO claim, power sale, or uncommitted ledger prose. |


## CI ban strings

| # | Must reject |
| --- | --- |
| 1 | Bioshock Infinite named place |
| 2 | Dishonored hero silhouette |
| 3 | Arcane logo geometry |
| 4 | Mortal Engines catchphrase |
| 5 | Final Fantasy airship signature costume |
| 6 | Steamboy proprietary creature |
| 7 | The Order 1886 map layout |
| 8 | League of Extraordinary Gentlemen faction title |
| 9 | Skies of Arcadia weapon profile |
| 10 | Sunless Skies UI chrome |
| 11 | Bioshock Infinite quest premise |
| 12 | Dishonored title typography |
| 13 | Arcane color-coded insignia |
| 14 | Mortal Engines music motif |
| 15 | Final Fantasy airship vehicle or mount profile |


## SPEC LLM budget

| Measure | SPEC |
| --- | --- |
| Visible prose per committed turn | 700 target / 1,200 hard ceiling tokens |
| 95th-percentile post-commit narration | under 3.0 seconds, measured before release claim |
| Retained narrative context | 18,000 tokens, refreshed from committed ledger events only |
| Safety sample | 100% store and key-art prompts; 20% canned talk per release candidate |

## Press blurb

Brasswake is a WOF text world about a smoke-bright chain of rail moorings where mail-riggers, boiler hands, lift engineers, and signal printers keep sky islands connected without letting profit cut loose the people below. It begins at Cinder Dock with Brasswake: Name a Working Promise, a small commitment that makes the local texture immediately useful. Choose one of four distinct kits—including the Mail-Rigger—then follow clear, committed choices through a private solo or 2–5 player co-op session. The named five-room instance, The Misfiled Elevator, uses room-first description and personal loot; the closing Sky-Patch Supper gives friends a cosmetic-focused big night rather than a scaled raid claim. A complete Brasswake Theme Kit is included with the world. Gold, Cinder Crowns, and cosmetic tokens, Cloud Ribbons, remain separate. No gacha, outcome sale, lockout skip, or paid power item is offered. It is not described as an MMO until that capability is proven.

## FAQ

| Question | Answer |
| --- | --- |
| Is Brasswake an MMO? | No. It is described as solo/private co-op until multiplayer is proven. |
| What comes with the purchase? | The world and its complete Theme Kit. |
| Can I buy a better outcome? | No; outcome sales, power, clears, lockout skips, catch changes, gacha, and loot boxes are prohibited. |
| What happens after a wipe? | Return to the named checkpoint; retain personal loot and completed progress. |
| How is social play kept safe? | Friends-first private co-op, canned hub lines, and report/mute/block; no global chat or public DMs. |

## Not ready / still CODE

Entitlement restoration, exact ledger calls, deterministic instance seeding, feature flags, kill-switch monitoring, report pipeline, accessibility acceptance, device performance test, and final legal/ratings review remain CODE or approval work. This bill does not represent them as already live.
