# WOF Civic Mile: Bespoke Press Bill

## Store identity

**One-line pitch.** A walkable present-day neighborhood where residents trade favors, repair small civic frictions, host friends, work gentle shifts, and make apartment life feel inhabited.

Civic Mile begins at **Juniper Station**, where **Civic Mile: Name a Working Promise** asks the player to make a practical choice before anything grand occurs. The **Block Host** kit sees that problem from a specific working angle, while the route toward **The Rainy-Day Open House** introduces a private 2–5 session that is clear about its stakes and its limits. The store page sells a buy-and-own text world for solo/private co-op, not an MMO. Its included **Civic Mile Theme Kit** changes presentation without changing outcomes. Gold is **Mile Cash**; cosmetic tokens are **Porch Pins**. Neither currency buys power, a better roll, a catch, a clear, or a lockout bypass.

| Field | Release specification |
| --- | --- |
| Maturity | all-ages |
| Content descriptor | Local stakes, clear safety controls, and world-specific non-graphic tension where applicable. |
| Included | World entitlement, all authored text data, and Theme Kit. |
| DLC boundary | Future cosmetic plates only; no content advantage. |
| Demand row | slice-of-life city friendship world serves the original setting and social/private-co-op demand lane. |

## Code and content remaining

| Item | Status | World-specific requirement |
| --- | --- | --- |
| Rule integration | CODE | `civic_rep` ledger and `civic_mile_eval_01` through `civic_mile_eval_15`. |
| Data load | SPEC / CODE | `civic_mile_places`, kits, NPC trees, quest DAG, drops, vendor, dungeon, interior, talents, and Theme Kit. |
| First hour | SPEC | Civic Mile: Name a Working Promise at `civic_mile_place_01`, then the mid-join `civic_mile_place_04`. |
| Instance | SPEC / CODE | `The Rainy-Day Open House` through `civic_mile_place_06`. |
| Big night | SPEC / CODE | `Riverwalk Potluck`, 2–5 players, three phases, cosmetic-only record. |
| Kill switches | CODE | disable `civic_mile` store listing, starts, instance, big night, Theme Kit apply, or canned talk without affecting other worlds. |

## Legal and trust

It is not a cyberpunk district, a real city map, or a copied television apartment set. Canned hub lines are authored and not stranger LLM chat. Report, mute, and block are required support flows. Hashed telemetry only; TTS reads chrome and prose; font scaling and non-colour danger indicators are mandatory. Kid Mode, when eligible, limits play to ten text turns per day and disables public DM, trade, and voice.

## Twenty-five click tests

| id | Action | Actual placeId | Expected |
| --- | --- | --- | --- |
| civic_mile_click_01 | open store identity | civic_mile_place_01 | Expected: open store identity completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_02 | select age lane | civic_mile_place_02 | Expected: select age lane completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_03 | start kit | civic_mile_place_03 | Expected: start kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_04 | read opening stake | civic_mile_place_04 | Expected: read opening stake completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_05 | open Ledger | civic_mile_place_05 | Expected: open Ledger completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_06 | travel route | civic_mile_place_06 | Expected: travel route completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_07 | meet NPC | civic_mile_place_07 | Expected: meet NPC completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_08 | accept quest | civic_mile_place_08 | Expected: accept quest completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_09 | complete objective | civic_mile_place_01 | Expected: complete objective completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_10 | open vendor | civic_mile_place_02 | Expected: open vendor completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_11 | check gold wallet | civic_mile_place_03 | Expected: check gold wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_12 | check cosmetic wallet | civic_mile_place_04 | Expected: check cosmetic wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_13 | apply Theme Kit | civic_mile_place_05 | Expected: apply Theme Kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_14 | enter instance door | civic_mile_place_06 | Expected: enter instance door completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_15 | read room-first text | civic_mile_place_07 | Expected: read room-first text completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_16 | complete trash step | civic_mile_place_08 | Expected: complete trash step completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_17 | activate checkpoint | civic_mile_place_01 | Expected: activate checkpoint completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_18 | wipe safely | civic_mile_place_02 | Expected: wipe safely completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_19 | claim personal loot | civic_mile_place_03 | Expected: claim personal loot completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_20 | run a talent node | civic_mile_place_04 | Expected: run a talent node completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_21 | open home interior | civic_mile_place_05 | Expected: open home interior completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_22 | run a daily contract | civic_mile_place_06 | Expected: run a daily contract completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_23 | open big-night record | civic_mile_place_07 | Expected: open big-night record completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_24 | use report/mute/block | civic_mile_place_08 | Expected: use report/mute/block completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| civic_mile_click_25 | trigger world kill switch | civic_mile_place_01 | Expected: trigger world kill switch completes without a public-MMO claim, power sale, or uncommitted ledger prose. |


## CI ban strings

| # | Must reject |
| --- | --- |
| 1 | Animal Crossing named place |
| 2 | The Sims hero silhouette |
| 3 | Palia logo geometry |
| 4 | Stardew Valley catchphrase |
| 5 | Friends Central Perk signature costume |
| 6 | Seinfeld apartment proprietary creature |
| 7 | Habbo Hotel map layout |
| 8 | IMVU faction title |
| 9 | Second Life weapon profile |
| 10 | GTA city UI chrome |
| 11 | Animal Crossing quest premise |
| 12 | The Sims title typography |
| 13 | Palia color-coded insignia |
| 14 | Stardew Valley music motif |
| 15 | Friends Central Perk vehicle or mount profile |


## SPEC LLM budget

| Measure | SPEC |
| --- | --- |
| Visible prose per committed turn | 700 target / 1,200 hard ceiling tokens |
| 95th-percentile post-commit narration | under 3.0 seconds, measured before release claim |
| Retained narrative context | 18,000 tokens, refreshed from committed ledger events only |
| Safety sample | 100% store and key-art prompts; 20% canned talk per release candidate |

## Press blurb

Civic Mile is a WOF text world about a walkable present-day neighborhood where residents trade favors, repair small civic frictions, host friends, work gentle shifts, and make apartment life feel inhabited. It begins at Juniper Station with Civic Mile: Name a Working Promise, a small commitment that makes the local texture immediately useful. Choose one of four distinct kits—including the Block Host—then follow clear, committed choices through a private solo or 2–5 player co-op session. The named five-room instance, The Rainy-Day Open House, uses room-first description and personal loot; the closing Riverwalk Potluck gives friends a cosmetic-focused big night rather than a scaled raid claim. A complete Civic Mile Theme Kit is included with the world. Gold, Mile Cash, and cosmetic tokens, Porch Pins, remain separate. No gacha, outcome sale, lockout skip, or paid power item is offered. It is not described as an MMO until that capability is proven.

## FAQ

| Question | Answer |
| --- | --- |
| Is Civic Mile an MMO? | No. It is described as solo/private co-op until multiplayer is proven. |
| What comes with the purchase? | The world and its complete Theme Kit. |
| Can I buy a better outcome? | No; outcome sales, power, clears, lockout skips, catch changes, gacha, and loot boxes are prohibited. |
| What happens after a wipe? | Return to the named checkpoint; retain personal loot and completed progress. |
| How is social play kept safe? | Friends-first private co-op, canned hub lines, and report/mute/block; no global chat or public DMs. |

## Not ready / still CODE

Entitlement restoration, exact ledger calls, deterministic instance seeding, feature flags, kill-switch monitoring, report pipeline, accessibility acceptance, device performance test, and final legal/ratings review remain CODE or approval work. This bill does not represent them as already live.
