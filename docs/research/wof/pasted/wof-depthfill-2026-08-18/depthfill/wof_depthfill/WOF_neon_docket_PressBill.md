# WOF Neon Docket: Bespoke Press Bill

## Store identity

**One-line pitch.** Restitution-focused city case crews.

Neon Docket begins at **Docket Row**, where **Neon Docket: Name a Working Promise** asks the player to make a practical choice before anything grand occurs. The **Restitution Broker** kit sees that problem from a specific working angle, while the route toward **The Closed Account** introduces a private 2–5 session that is clear about its stakes and its limits. The store page sells a buy-and-own text world for solo/private co-op, not an MMO. Its included **Neon Docket Theme Kit** changes presentation without changing outcomes. Gold is **Docket Cash**; cosmetic tokens are **Neon Tabs**. Neither currency buys power, a better roll, a catch, a clear, or a lockout bypass.

| Field | Release specification |
| --- | --- |
| Maturity | teen+ |
| Content descriptor | Local stakes, clear safety controls, and world-specific non-graphic tension where applicable. |
| Included | World entitlement, all authored text data, and Theme Kit. |
| DLC boundary | Future cosmetic plates only; no content advantage. |
| Demand row | restitution-focused city case crews serves the original setting and social/private-co-op demand lane. |

## Code and content remaining

| Item | Status | World-specific requirement |
| --- | --- | --- |
| Rule integration | CODE | `heat_wanted` ledger and `neon_docket_eval_01` through `neon_docket_eval_15`. |
| Data load | SPEC / CODE | `neon_docket_places`, kits, NPC trees, quest DAG, drops, vendor, dungeon, interior, talents, and Theme Kit. |
| First hour | SPEC | Neon Docket: Name a Working Promise at `neon_docket_place_01`, then the mid-join `neon_docket_place_04`. |
| Instance | SPEC / CODE | `The Closed Account` through `neon_docket_place_06`. |
| Big night | SPEC / CODE | `Casefile Court Night Session`, 2–5 players, three phases, cosmetic-only record. |
| Kill switches | CODE | disable `neon_docket` store listing, starts, instance, big night, Theme Kit apply, or canned talk without affecting other worlds. |

## Legal and trust

It is an original WOF setting and not a licensed, historical, or platform-derived recreation. Canned hub lines are authored and not stranger LLM chat. Report, mute, and block are required support flows. Hashed telemetry only; TTS reads chrome and prose; font scaling and non-colour danger indicators are mandatory. Kid Mode, when eligible, limits play to ten text turns per day and disables public DM, trade, and voice.

## Twenty-five click tests

| id | Action | Actual placeId | Expected |
| --- | --- | --- | --- |
| neon_docket_click_01 | open store identity | neon_docket_place_01 | Expected: open store identity completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_02 | select age lane | neon_docket_place_02 | Expected: select age lane completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_03 | start kit | neon_docket_place_03 | Expected: start kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_04 | read opening stake | neon_docket_place_04 | Expected: read opening stake completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_05 | open Ledger | neon_docket_place_05 | Expected: open Ledger completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_06 | travel route | neon_docket_place_06 | Expected: travel route completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_07 | meet NPC | neon_docket_place_07 | Expected: meet NPC completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_08 | accept quest | neon_docket_place_08 | Expected: accept quest completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_09 | complete objective | neon_docket_place_01 | Expected: complete objective completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_10 | open vendor | neon_docket_place_02 | Expected: open vendor completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_11 | check gold wallet | neon_docket_place_03 | Expected: check gold wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_12 | check cosmetic wallet | neon_docket_place_04 | Expected: check cosmetic wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_13 | apply Theme Kit | neon_docket_place_05 | Expected: apply Theme Kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_14 | enter instance door | neon_docket_place_06 | Expected: enter instance door completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_15 | read room-first text | neon_docket_place_07 | Expected: read room-first text completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_16 | complete trash step | neon_docket_place_08 | Expected: complete trash step completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_17 | activate checkpoint | neon_docket_place_01 | Expected: activate checkpoint completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_18 | wipe safely | neon_docket_place_02 | Expected: wipe safely completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_19 | claim personal loot | neon_docket_place_03 | Expected: claim personal loot completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_20 | run a talent node | neon_docket_place_04 | Expected: run a talent node completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_21 | open home interior | neon_docket_place_05 | Expected: open home interior completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_22 | run a daily contract | neon_docket_place_06 | Expected: run a daily contract completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_23 | open big-night record | neon_docket_place_07 | Expected: open big-night record completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_24 | use report/mute/block | neon_docket_place_08 | Expected: use report/mute/block completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| neon_docket_click_25 | trigger world kill switch | neon_docket_place_01 | Expected: trigger world kill switch completes without a public-MMO claim, power sale, or uncommitted ledger prose. |


## CI ban strings

| # | Must reject |
| --- | --- |
| 1 | Grand Theft Auto named place |
| 2 | Saints Row hero silhouette |
| 3 | Payday logo geometry |
| 4 | Yakuza catchphrase |
| 5 | Mafia game signature costume |
| 6 | Sleeping Dogs proprietary creature |
| 7 | Watch Dogs map layout |
| 8 | The Wire police likeness faction title |
| 9 | CSI weapon profile |
| 10 | Ocean’s Eleven UI chrome |
| 11 | Grand Theft Auto quest premise |
| 12 | Saints Row title typography |
| 13 | Payday color-coded insignia |
| 14 | Yakuza music motif |
| 15 | Mafia game vehicle or mount profile |


## SPEC LLM budget

| Measure | SPEC |
| --- | --- |
| Visible prose per committed turn | 700 target / 1,200 hard ceiling tokens |
| 95th-percentile post-commit narration | under 3.0 seconds, measured before release claim |
| Retained narrative context | 18,000 tokens, refreshed from committed ledger events only |
| Safety sample | 100% store and key-art prompts; 20% canned talk per release candidate |

## Press blurb

Neon Docket is a WOF text world about restitution-focused city case crews. It begins at Docket Row with Neon Docket: Name a Working Promise, a small commitment that makes the local texture immediately useful. Choose one of four distinct kits—including the Restitution Broker—then follow clear, committed choices through a private solo or 2–5 player co-op session. The named five-room instance, The Closed Account, uses room-first description and personal loot; the closing Casefile Court Night Session gives friends a cosmetic-focused big night rather than a scaled raid claim. A complete Neon Docket Theme Kit is included with the world. Gold, Docket Cash, and cosmetic tokens, Neon Tabs, remain separate. No gacha, outcome sale, lockout skip, or paid power item is offered. It is not described as an MMO until that capability is proven.

## FAQ

| Question | Answer |
| --- | --- |
| Is Neon Docket an MMO? | No. It is described as solo/private co-op until multiplayer is proven. |
| What comes with the purchase? | The world and its complete Theme Kit. |
| Can I buy a better outcome? | No; outcome sales, power, clears, lockout skips, catch changes, gacha, and loot boxes are prohibited. |
| What happens after a wipe? | Return to the named checkpoint; retain personal loot and completed progress. |
| How is social play kept safe? | Friends-first private co-op, canned hub lines, and report/mute/block; no global chat or public DMs. |

## Not ready / still CODE

Entitlement restoration, exact ledger calls, deterministic instance seeding, feature flags, kill-switch monitoring, report pipeline, accessibility acceptance, device performance test, and final legal/ratings review remain CODE or approval work. This bill does not represent them as already live.
