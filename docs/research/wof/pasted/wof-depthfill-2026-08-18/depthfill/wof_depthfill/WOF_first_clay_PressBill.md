# WOF First Clay: Bespoke Press Bill

## Store identity

**One-line pitch.** Original river, hill, and star cultures in mythic antiquity.

First Clay begins at **Clay Harbor**, where **First Clay: Name a Working Promise** asks the player to make a practical choice before anything grand occurs. The **River Measure** kit sees that problem from a specific working angle, while the route toward **The Star Kiln Accord** introduces a private 2–5 session that is clear about its stakes and its limits. The store page sells a buy-and-own text world for solo/private co-op, not an MMO. Its included **First Clay Theme Kit** changes presentation without changing outcomes. Gold is **Clay Shells**; cosmetic tokens are **Star Tesserae**. Neither currency buys power, a better roll, a catch, a clear, or a lockout bypass.

| Field | Release specification |
| --- | --- |
| Maturity | teen |
| Content descriptor | Local stakes, clear safety controls, and world-specific non-graphic tension where applicable. |
| Included | World entitlement, all authored text data, and Theme Kit. |
| DLC boundary | Future cosmetic plates only; no content advantage. |
| Demand row | original river, hill, and star cultures in mythic antiquity serves the original setting and social/private-co-op demand lane. |

## Code and content remaining

| Item | Status | World-specific requirement |
| --- | --- | --- |
| Rule integration | CODE | `hp_check` ledger and `first_clay_eval_01` through `first_clay_eval_15`. |
| Data load | SPEC / CODE | `first_clay_places`, kits, NPC trees, quest DAG, drops, vendor, dungeon, interior, talents, and Theme Kit. |
| First hour | SPEC | First Clay: Name a Working Promise at `first_clay_place_01`, then the mid-join `first_clay_place_04`. |
| Instance | SPEC / CODE | `The Star Kiln Accord` through `first_clay_place_06`. |
| Big night | SPEC / CODE | `Caravan Fold Assembly`, 2–5 players, three phases, cosmetic-only record. |
| Kill switches | CODE | disable `first_clay` store listing, starts, instance, big night, Theme Kit apply, or canned talk without affecting other worlds. |

## Legal and trust

It is an original WOF setting and not a licensed, historical, or platform-derived recreation. Canned hub lines are authored and not stranger LLM chat. Report, mute, and block are required support flows. Hashed telemetry only; TTS reads chrome and prose; font scaling and non-colour danger indicators are mandatory. Kid Mode, when eligible, limits play to ten text turns per day and disables public DM, trade, and voice.

## Twenty-five click tests

| id | Action | Actual placeId | Expected |
| --- | --- | --- | --- |
| first_clay_click_01 | open store identity | first_clay_place_01 | Expected: open store identity completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_02 | select age lane | first_clay_place_02 | Expected: select age lane completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_03 | start kit | first_clay_place_03 | Expected: start kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_04 | read opening stake | first_clay_place_04 | Expected: read opening stake completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_05 | open Ledger | first_clay_place_05 | Expected: open Ledger completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_06 | travel route | first_clay_place_06 | Expected: travel route completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_07 | meet NPC | first_clay_place_07 | Expected: meet NPC completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_08 | accept quest | first_clay_place_08 | Expected: accept quest completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_09 | complete objective | first_clay_place_01 | Expected: complete objective completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_10 | open vendor | first_clay_place_02 | Expected: open vendor completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_11 | check gold wallet | first_clay_place_03 | Expected: check gold wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_12 | check cosmetic wallet | first_clay_place_04 | Expected: check cosmetic wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_13 | apply Theme Kit | first_clay_place_05 | Expected: apply Theme Kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_14 | enter instance door | first_clay_place_06 | Expected: enter instance door completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_15 | read room-first text | first_clay_place_07 | Expected: read room-first text completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_16 | complete trash step | first_clay_place_08 | Expected: complete trash step completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_17 | activate checkpoint | first_clay_place_01 | Expected: activate checkpoint completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_18 | wipe safely | first_clay_place_02 | Expected: wipe safely completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_19 | claim personal loot | first_clay_place_03 | Expected: claim personal loot completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_20 | run a talent node | first_clay_place_04 | Expected: run a talent node completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_21 | open home interior | first_clay_place_05 | Expected: open home interior completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_22 | run a daily contract | first_clay_place_06 | Expected: run a daily contract completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_23 | open big-night record | first_clay_place_07 | Expected: open big-night record completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_24 | use report/mute/block | first_clay_place_08 | Expected: use report/mute/block completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| first_clay_click_25 | trigger world kill switch | first_clay_place_01 | Expected: trigger world kill switch completes without a public-MMO claim, power sale, or uncommitted ledger prose. |


## CI ban strings

| # | Must reject |
| --- | --- |
| 1 | Ancient Greece named place |
| 2 | Ancient Egypt hero silhouette |
| 3 | Rome logo geometry |
| 4 | Assassins Creed Origins catchphrase |
| 5 | Percy Jackson signature costume |
| 6 | Hades game proprietary creature |
| 7 | Troy film map layout |
| 8 | Mummy film faction title |
| 9 | Mesopotamia reconstruction weapon profile |
| 10 | Silk Road history UI chrome |
| 11 | Ancient Greece quest premise |
| 12 | Ancient Egypt title typography |
| 13 | Rome color-coded insignia |
| 14 | Assassins Creed Origins music motif |
| 15 | Percy Jackson vehicle or mount profile |


## SPEC LLM budget

| Measure | SPEC |
| --- | --- |
| Visible prose per committed turn | 700 target / 1,200 hard ceiling tokens |
| 95th-percentile post-commit narration | under 3.0 seconds, measured before release claim |
| Retained narrative context | 18,000 tokens, refreshed from committed ledger events only |
| Safety sample | 100% store and key-art prompts; 20% canned talk per release candidate |

## Press blurb

First Clay is a WOF text world about original river, hill, and star cultures in mythic antiquity. It begins at Clay Harbor with First Clay: Name a Working Promise, a small commitment that makes the local texture immediately useful. Choose one of four distinct kits—including the River Measure—then follow clear, committed choices through a private solo or 2–5 player co-op session. The named five-room instance, The Star Kiln Accord, uses room-first description and personal loot; the closing Caravan Fold Assembly gives friends a cosmetic-focused big night rather than a scaled raid claim. A complete First Clay Theme Kit is included with the world. Gold, Clay Shells, and cosmetic tokens, Star Tesserae, remain separate. No gacha, outcome sale, lockout skip, or paid power item is offered. It is not described as an MMO until that capability is proven.

## FAQ

| Question | Answer |
| --- | --- |
| Is First Clay an MMO? | No. It is described as solo/private co-op until multiplayer is proven. |
| What comes with the purchase? | The world and its complete Theme Kit. |
| Can I buy a better outcome? | No; outcome sales, power, clears, lockout skips, catch changes, gacha, and loot boxes are prohibited. |
| What happens after a wipe? | Return to the named checkpoint; retain personal loot and completed progress. |
| How is social play kept safe? | Friends-first private co-op, canned hub lines, and report/mute/block; no global chat or public DMs. |

## Not ready / still CODE

Entitlement restoration, exact ledger calls, deterministic instance seeding, feature flags, kill-switch monitoring, report pipeline, accessibility acceptance, device performance test, and final legal/ratings review remain CODE or approval work. This bill does not represent them as already live.
