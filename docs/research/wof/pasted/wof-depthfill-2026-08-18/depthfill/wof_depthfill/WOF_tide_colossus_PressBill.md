# WOF Tide Colossus: Bespoke Press Bill

## Store identity

**One-line pitch.** Shore-titan hunt and coastal defense.

Tide Colossus begins at **Breakwater Camp**, where **Tide Colossus: Name a Working Promise** asks the player to make a practical choice before anything grand occurs. The **Part Surveyor** kit sees that problem from a specific working angle, while the route toward **The Hollow-Shelled Bell** introduces a private 2–5 session that is clear about its stakes and its limits. The store page sells a buy-and-own text world for solo/private co-op, not an MMO. Its included **Tide Colossus Theme Kit** changes presentation without changing outcomes. Gold is **Anchor Crowns**; cosmetic tokens are **Foam Pennants**. Neither currency buys power, a better roll, a catch, a clear, or a lockout bypass.

| Field | Release specification |
| --- | --- |
| Maturity | teen |
| Content descriptor | Local stakes, clear safety controls, and world-specific non-graphic tension where applicable. |
| Included | World entitlement, all authored text data, and Theme Kit. |
| DLC boundary | Future cosmetic plates only; no content advantage. |
| Demand row | shore-titan hunt and coastal defense serves the original setting and social/private-co-op demand lane. |

## Code and content remaining

| Item | Status | World-specific requirement |
| --- | --- | --- |
| Rule integration | CODE | `colossus_part` ledger and `tide_colossus_eval_01` through `tide_colossus_eval_15`. |
| Data load | SPEC / CODE | `tide_colossus_places`, kits, NPC trees, quest DAG, drops, vendor, dungeon, interior, talents, and Theme Kit. |
| First hour | SPEC | Tide Colossus: Name a Working Promise at `tide_colossus_place_01`, then the mid-join `tide_colossus_place_04`. |
| Instance | SPEC / CODE | `The Hollow-Shelled Bell` through `tide_colossus_place_06`. |
| Big night | SPEC / CODE | `Soundbreaker Vigil`, 2–5 players, three phases, cosmetic-only record. |
| Kill switches | CODE | disable `tide_colossus` store listing, starts, instance, big night, Theme Kit apply, or canned talk without affecting other worlds. |

## Legal and trust

It is an original WOF setting and not a licensed, historical, or platform-derived recreation. Canned hub lines are authored and not stranger LLM chat. Report, mute, and block are required support flows. Hashed telemetry only; TTS reads chrome and prose; font scaling and non-colour danger indicators are mandatory. Kid Mode, when eligible, limits play to ten text turns per day and disables public DM, trade, and voice.

## Twenty-five click tests

| id | Action | Actual placeId | Expected |
| --- | --- | --- | --- |
| tide_colossus_click_01 | open store identity | tide_colossus_place_01 | Expected: open store identity completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_02 | select age lane | tide_colossus_place_02 | Expected: select age lane completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_03 | start kit | tide_colossus_place_03 | Expected: start kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_04 | read opening stake | tide_colossus_place_04 | Expected: read opening stake completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_05 | open Ledger | tide_colossus_place_05 | Expected: open Ledger completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_06 | travel route | tide_colossus_place_06 | Expected: travel route completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_07 | meet NPC | tide_colossus_place_07 | Expected: meet NPC completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_08 | accept quest | tide_colossus_place_08 | Expected: accept quest completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_09 | complete objective | tide_colossus_place_01 | Expected: complete objective completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_10 | open vendor | tide_colossus_place_02 | Expected: open vendor completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_11 | check gold wallet | tide_colossus_place_03 | Expected: check gold wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_12 | check cosmetic wallet | tide_colossus_place_04 | Expected: check cosmetic wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_13 | apply Theme Kit | tide_colossus_place_05 | Expected: apply Theme Kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_14 | enter instance door | tide_colossus_place_06 | Expected: enter instance door completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_15 | read room-first text | tide_colossus_place_07 | Expected: read room-first text completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_16 | complete trash step | tide_colossus_place_08 | Expected: complete trash step completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_17 | activate checkpoint | tide_colossus_place_01 | Expected: activate checkpoint completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_18 | wipe safely | tide_colossus_place_02 | Expected: wipe safely completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_19 | claim personal loot | tide_colossus_place_03 | Expected: claim personal loot completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_20 | run a talent node | tide_colossus_place_04 | Expected: run a talent node completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_21 | open home interior | tide_colossus_place_05 | Expected: open home interior completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_22 | run a daily contract | tide_colossus_place_06 | Expected: run a daily contract completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_23 | open big-night record | tide_colossus_place_07 | Expected: open big-night record completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_24 | use report/mute/block | tide_colossus_place_08 | Expected: use report/mute/block completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| tide_colossus_click_25 | trigger world kill switch | tide_colossus_place_01 | Expected: trigger world kill switch completes without a public-MMO claim, power sale, or uncommitted ledger prose. |


## CI ban strings

| # | Must reject |
| --- | --- |
| 1 | Attack on Titan named place |
| 2 | Monster Hunter hero silhouette |
| 3 | Godzilla logo geometry |
| 4 | Pacific Rim catchphrase |
| 5 | Shadow of the Colossus signature costume |
| 6 | Dauntless proprietary creature |
| 7 | Kaiju No 8 map layout |
| 8 | ARK faction title |
| 9 | Horizon machines weapon profile |
| 10 | Troll Hunter UI chrome |
| 11 | Attack on Titan quest premise |
| 12 | Monster Hunter title typography |
| 13 | Godzilla color-coded insignia |
| 14 | Pacific Rim music motif |
| 15 | Shadow of the Colossus vehicle or mount profile |


## SPEC LLM budget

| Measure | SPEC |
| --- | --- |
| Visible prose per committed turn | 700 target / 1,200 hard ceiling tokens |
| 95th-percentile post-commit narration | under 3.0 seconds, measured before release claim |
| Retained narrative context | 18,000 tokens, refreshed from committed ledger events only |
| Safety sample | 100% store and key-art prompts; 20% canned talk per release candidate |

## Press blurb

Tide Colossus is a WOF text world about shore-titan hunt and coastal defense. It begins at Breakwater Camp with Tide Colossus: Name a Working Promise, a small commitment that makes the local texture immediately useful. Choose one of four distinct kits—including the Part Surveyor—then follow clear, committed choices through a private solo or 2–5 player co-op session. The named five-room instance, The Hollow-Shelled Bell, uses room-first description and personal loot; the closing Soundbreaker Vigil gives friends a cosmetic-focused big night rather than a scaled raid claim. A complete Tide Colossus Theme Kit is included with the world. Gold, Anchor Crowns, and cosmetic tokens, Foam Pennants, remain separate. No gacha, outcome sale, lockout skip, or paid power item is offered. It is not described as an MMO until that capability is proven.

## FAQ

| Question | Answer |
| --- | --- |
| Is Tide Colossus an MMO? | No. It is described as solo/private co-op until multiplayer is proven. |
| What comes with the purchase? | The world and its complete Theme Kit. |
| Can I buy a better outcome? | No; outcome sales, power, clears, lockout skips, catch changes, gacha, and loot boxes are prohibited. |
| What happens after a wipe? | Return to the named checkpoint; retain personal loot and completed progress. |
| How is social play kept safe? | Friends-first private co-op, canned hub lines, and report/mute/block; no global chat or public DMs. |

## Not ready / still CODE

Entitlement restoration, exact ledger calls, deterministic instance seeding, feature flags, kill-switch monitoring, report pipeline, accessibility acceptance, device performance test, and final legal/ratings review remain CODE or approval work. This bill does not represent them as already live.
