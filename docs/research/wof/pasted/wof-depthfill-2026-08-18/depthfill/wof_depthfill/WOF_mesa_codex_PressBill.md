# WOF Mesa Codex: Bespoke Press Bill

## Store identity

**One-line pitch.** Original highland calendar-city stewardship.

Mesa Codex begins at **Stone Calendar**, where **Mesa Codex: Name a Working Promise** asks the player to make a practical choice before anything grand occurs. The **Calendar Keeper** kit sees that problem from a specific working angle, while the route toward **The Rain Archive Door** introduces a private 2–5 session that is clear about its stakes and its limits. The store page sells a buy-and-own text world for solo/private co-op, not an MMO. Its included **Mesa Codex Theme Kit** changes presentation without changing outcomes. Gold is **Mesa Shells**; cosmetic tokens are **Calendar Ribbons**. Neither currency buys power, a better roll, a catch, a clear, or a lockout bypass.

| Field | Release specification |
| --- | --- |
| Maturity | all-ages |
| Content descriptor | Local stakes, clear safety controls, and world-specific non-graphic tension where applicable. |
| Included | World entitlement, all authored text data, and Theme Kit. |
| DLC boundary | Future cosmetic plates only; no content advantage. |
| Demand row | original highland calendar-city stewardship serves the original setting and social/private-co-op demand lane. |

## Code and content remaining

| Item | Status | World-specific requirement |
| --- | --- | --- |
| Rule integration | CODE | `hp_check` ledger and `mesa_codex_eval_01` through `mesa_codex_eval_15`. |
| Data load | SPEC / CODE | `mesa_codex_places`, kits, NPC trees, quest DAG, drops, vendor, dungeon, interior, talents, and Theme Kit. |
| First hour | SPEC | Mesa Codex: Name a Working Promise at `mesa_codex_place_01`, then the mid-join `mesa_codex_place_04`. |
| Instance | SPEC / CODE | `The Rain Archive Door` through `mesa_codex_place_06`. |
| Big night | SPEC / CODE | `Dawn Mesa Countday`, 2–5 players, three phases, cosmetic-only record. |
| Kill switches | CODE | disable `mesa_codex` store listing, starts, instance, big night, Theme Kit apply, or canned talk without affecting other worlds. |

## Legal and trust

It is an original WOF setting and not a licensed, historical, or platform-derived recreation. Canned hub lines are authored and not stranger LLM chat. Report, mute, and block are required support flows. Hashed telemetry only; TTS reads chrome and prose; font scaling and non-colour danger indicators are mandatory. Kid Mode, when eligible, limits play to ten text turns per day and disables public DM, trade, and voice.

## Twenty-five click tests

| id | Action | Actual placeId | Expected |
| --- | --- | --- | --- |
| mesa_codex_click_01 | open store identity | mesa_codex_place_01 | Expected: open store identity completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_02 | select age lane | mesa_codex_place_02 | Expected: select age lane completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_03 | start kit | mesa_codex_place_03 | Expected: start kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_04 | read opening stake | mesa_codex_place_04 | Expected: read opening stake completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_05 | open Ledger | mesa_codex_place_05 | Expected: open Ledger completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_06 | travel route | mesa_codex_place_06 | Expected: travel route completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_07 | meet NPC | mesa_codex_place_07 | Expected: meet NPC completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_08 | accept quest | mesa_codex_place_08 | Expected: accept quest completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_09 | complete objective | mesa_codex_place_01 | Expected: complete objective completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_10 | open vendor | mesa_codex_place_02 | Expected: open vendor completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_11 | check gold wallet | mesa_codex_place_03 | Expected: check gold wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_12 | check cosmetic wallet | mesa_codex_place_04 | Expected: check cosmetic wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_13 | apply Theme Kit | mesa_codex_place_05 | Expected: apply Theme Kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_14 | enter instance door | mesa_codex_place_06 | Expected: enter instance door completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_15 | read room-first text | mesa_codex_place_07 | Expected: read room-first text completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_16 | complete trash step | mesa_codex_place_08 | Expected: complete trash step completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_17 | activate checkpoint | mesa_codex_place_01 | Expected: activate checkpoint completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_18 | wipe safely | mesa_codex_place_02 | Expected: wipe safely completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_19 | claim personal loot | mesa_codex_place_03 | Expected: claim personal loot completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_20 | run a talent node | mesa_codex_place_04 | Expected: run a talent node completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_21 | open home interior | mesa_codex_place_05 | Expected: open home interior completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_22 | run a daily contract | mesa_codex_place_06 | Expected: run a daily contract completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_23 | open big-night record | mesa_codex_place_07 | Expected: open big-night record completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_24 | use report/mute/block | mesa_codex_place_08 | Expected: use report/mute/block completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| mesa_codex_click_25 | trigger world kill switch | mesa_codex_place_01 | Expected: trigger world kill switch completes without a public-MMO claim, power sale, or uncommitted ledger prose. |


## CI ban strings

| # | Must reject |
| --- | --- |
| 1 | Mesoamerican temple reconstruction named place |
| 2 | Maya calendar hero silhouette |
| 3 | Aztec glyph logo geometry |
| 4 | Inca road catchphrase |
| 5 | El Dorado signature costume |
| 6 | Indiana Jones proprietary creature |
| 7 | Apocalypto map layout |
| 8 | Coco faction title |
| 9 | real sacred ceremony weapon profile |
| 10 | colonial explorer UI chrome |
| 11 | Mesoamerican temple reconstruction quest premise |
| 12 | Maya calendar title typography |
| 13 | Aztec glyph color-coded insignia |
| 14 | Inca road music motif |
| 15 | El Dorado vehicle or mount profile |


## SPEC LLM budget

| Measure | SPEC |
| --- | --- |
| Visible prose per committed turn | 700 target / 1,200 hard ceiling tokens |
| 95th-percentile post-commit narration | under 3.0 seconds, measured before release claim |
| Retained narrative context | 18,000 tokens, refreshed from committed ledger events only |
| Safety sample | 100% store and key-art prompts; 20% canned talk per release candidate |

## Press blurb

Mesa Codex is a WOF text world about original highland calendar-city stewardship. It begins at Stone Calendar with Mesa Codex: Name a Working Promise, a small commitment that makes the local texture immediately useful. Choose one of four distinct kits—including the Calendar Keeper—then follow clear, committed choices through a private solo or 2–5 player co-op session. The named five-room instance, The Rain Archive Door, uses room-first description and personal loot; the closing Dawn Mesa Countday gives friends a cosmetic-focused big night rather than a scaled raid claim. A complete Mesa Codex Theme Kit is included with the world. Gold, Mesa Shells, and cosmetic tokens, Calendar Ribbons, remain separate. No gacha, outcome sale, lockout skip, or paid power item is offered. It is not described as an MMO until that capability is proven.

## FAQ

| Question | Answer |
| --- | --- |
| Is Mesa Codex an MMO? | No. It is described as solo/private co-op until multiplayer is proven. |
| What comes with the purchase? | The world and its complete Theme Kit. |
| Can I buy a better outcome? | No; outcome sales, power, clears, lockout skips, catch changes, gacha, and loot boxes are prohibited. |
| What happens after a wipe? | Return to the named checkpoint; retain personal loot and completed progress. |
| How is social play kept safe? | Friends-first private co-op, canned hub lines, and report/mute/block; no global chat or public DMs. |

## Not ready / still CODE

Entitlement restoration, exact ledger calls, deterministic instance seeding, feature flags, kill-switch monitoring, report pipeline, accessibility acceptance, device performance test, and final legal/ratings review remain CODE or approval work. This bill does not represent them as already live.
