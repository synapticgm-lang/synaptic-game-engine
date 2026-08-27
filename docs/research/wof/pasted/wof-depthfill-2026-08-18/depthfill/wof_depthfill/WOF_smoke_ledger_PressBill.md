# WOF Smoke Ledger: Bespoke Press Bill

## Store identity

**One-line pitch.** Period-flavored noir cases and moral debts.

Smoke Ledger begins at **Cinder Station**, where **Smoke Ledger: Name a Working Promise** asks the player to make a practical choice before anything grand occurs. The **Debt Enumerator** kit sees that problem from a specific working angle, while the route toward **The Fog Dock Account** introduces a private 2–5 session that is clear about its stakes and its limits. The store page sells a buy-and-own text world for solo/private co-op, not an MMO. Its included **Smoke Ledger Theme Kit** changes presentation without changing outcomes. Gold is **Ledger Notes**; cosmetic tokens are **Smoke Rosettes**. Neither currency buys power, a better roll, a catch, a clear, or a lockout bypass.

| Field | Release specification |
| --- | --- |
| Maturity | teen |
| Content descriptor | Local stakes, clear safety controls, and world-specific non-graphic tension where applicable. |
| Included | World entitlement, all authored text data, and Theme Kit. |
| DLC boundary | Future cosmetic plates only; no content advantage. |
| Demand row | period-flavored noir cases and moral debts serves the original setting and social/private-co-op demand lane. |

## Code and content remaining

| Item | Status | World-specific requirement |
| --- | --- | --- |
| Rule integration | CODE | `hp_check` ledger and `smoke_ledger_eval_01` through `smoke_ledger_eval_15`. |
| Data load | SPEC / CODE | `smoke_ledger_places`, kits, NPC trees, quest DAG, drops, vendor, dungeon, interior, talents, and Theme Kit. |
| First hour | SPEC | Smoke Ledger: Name a Working Promise at `smoke_ledger_place_01`, then the mid-join `smoke_ledger_place_04`. |
| Instance | SPEC / CODE | `The Fog Dock Account` through `smoke_ledger_place_06`. |
| Big night | SPEC / CODE | `Cinder Station After-Hours`, 2–5 players, three phases, cosmetic-only record. |
| Kill switches | CODE | disable `smoke_ledger` store listing, starts, instance, big night, Theme Kit apply, or canned talk without affecting other worlds. |

## Legal and trust

It is an original WOF setting and not a licensed, historical, or platform-derived recreation. Canned hub lines are authored and not stranger LLM chat. Report, mute, and block are required support flows. Hashed telemetry only; TTS reads chrome and prose; font scaling and non-colour danger indicators are mandatory. Kid Mode, when eligible, limits play to ten text turns per day and disables public DM, trade, and voice.

## Twenty-five click tests

| id | Action | Actual placeId | Expected |
| --- | --- | --- | --- |
| smoke_ledger_click_01 | open store identity | smoke_ledger_place_01 | Expected: open store identity completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_02 | select age lane | smoke_ledger_place_02 | Expected: select age lane completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_03 | start kit | smoke_ledger_place_03 | Expected: start kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_04 | read opening stake | smoke_ledger_place_04 | Expected: read opening stake completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_05 | open Ledger | smoke_ledger_place_05 | Expected: open Ledger completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_06 | travel route | smoke_ledger_place_06 | Expected: travel route completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_07 | meet NPC | smoke_ledger_place_07 | Expected: meet NPC completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_08 | accept quest | smoke_ledger_place_08 | Expected: accept quest completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_09 | complete objective | smoke_ledger_place_01 | Expected: complete objective completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_10 | open vendor | smoke_ledger_place_02 | Expected: open vendor completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_11 | check gold wallet | smoke_ledger_place_03 | Expected: check gold wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_12 | check cosmetic wallet | smoke_ledger_place_04 | Expected: check cosmetic wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_13 | apply Theme Kit | smoke_ledger_place_05 | Expected: apply Theme Kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_14 | enter instance door | smoke_ledger_place_06 | Expected: enter instance door completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_15 | read room-first text | smoke_ledger_place_07 | Expected: read room-first text completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_16 | complete trash step | smoke_ledger_place_08 | Expected: complete trash step completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_17 | activate checkpoint | smoke_ledger_place_01 | Expected: activate checkpoint completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_18 | wipe safely | smoke_ledger_place_02 | Expected: wipe safely completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_19 | claim personal loot | smoke_ledger_place_03 | Expected: claim personal loot completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_20 | run a talent node | smoke_ledger_place_04 | Expected: run a talent node completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_21 | open home interior | smoke_ledger_place_05 | Expected: open home interior completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_22 | run a daily contract | smoke_ledger_place_06 | Expected: run a daily contract completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_23 | open big-night record | smoke_ledger_place_07 | Expected: open big-night record completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_24 | use report/mute/block | smoke_ledger_place_08 | Expected: use report/mute/block completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| smoke_ledger_click_25 | trigger world kill switch | smoke_ledger_place_01 | Expected: trigger world kill switch completes without a public-MMO claim, power sale, or uncommitted ledger prose. |


## CI ban strings

| # | Must reject |
| --- | --- |
| 1 | LA Noire named place |
| 2 | Mafia game hero silhouette |
| 3 | Bioshock logo geometry |
| 4 | The Untouchables catchphrase |
| 5 | Boardwalk Empire signature costume |
| 6 | Peaky Blinders proprietary creature |
| 7 | Chinatown film map layout |
| 8 | Dick Tracy faction title |
| 9 | Batman noir weapon profile |
| 10 | real 1920s politician UI chrome |
| 11 | LA Noire quest premise |
| 12 | Mafia game title typography |
| 13 | Bioshock color-coded insignia |
| 14 | The Untouchables music motif |
| 15 | Boardwalk Empire vehicle or mount profile |


## SPEC LLM budget

| Measure | SPEC |
| --- | --- |
| Visible prose per committed turn | 700 target / 1,200 hard ceiling tokens |
| 95th-percentile post-commit narration | under 3.0 seconds, measured before release claim |
| Retained narrative context | 18,000 tokens, refreshed from committed ledger events only |
| Safety sample | 100% store and key-art prompts; 20% canned talk per release candidate |

## Press blurb

Smoke Ledger is a WOF text world about period-flavored noir cases and moral debts. It begins at Cinder Station with Smoke Ledger: Name a Working Promise, a small commitment that makes the local texture immediately useful. Choose one of four distinct kits—including the Debt Enumerator—then follow clear, committed choices through a private solo or 2–5 player co-op session. The named five-room instance, The Fog Dock Account, uses room-first description and personal loot; the closing Cinder Station After-Hours gives friends a cosmetic-focused big night rather than a scaled raid claim. A complete Smoke Ledger Theme Kit is included with the world. Gold, Ledger Notes, and cosmetic tokens, Smoke Rosettes, remain separate. No gacha, outcome sale, lockout skip, or paid power item is offered. It is not described as an MMO until that capability is proven.

## FAQ

| Question | Answer |
| --- | --- |
| Is Smoke Ledger an MMO? | No. It is described as solo/private co-op until multiplayer is proven. |
| What comes with the purchase? | The world and its complete Theme Kit. |
| Can I buy a better outcome? | No; outcome sales, power, clears, lockout skips, catch changes, gacha, and loot boxes are prohibited. |
| What happens after a wipe? | Return to the named checkpoint; retain personal loot and completed progress. |
| How is social play kept safe? | Friends-first private co-op, canned hub lines, and report/mute/block; no global chat or public DMs. |

## Not ready / still CODE

Entitlement restoration, exact ledger calls, deterministic instance seeding, feature flags, kill-switch monitoring, report pipeline, accessibility acceptance, device performance test, and final legal/ratings review remain CODE or approval work. This bill does not represent them as already live.
