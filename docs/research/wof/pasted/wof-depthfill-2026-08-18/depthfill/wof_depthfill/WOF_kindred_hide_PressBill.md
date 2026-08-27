# WOF Kindred Hide: Bespoke Press Bill

## Store identity

**One-line pitch.** An original folk social world of studios, quiet dens, and consentful visits where people define their own presentation, boundaries, and club life through canned, safe social play.

Kindred Hide begins at **Welcome Burrow**, where **Kindred Hide: Name a Working Promise** asks the player to make a practical choice before anything grand occurs. The **Velvet Morrow** kit sees that problem from a specific working angle, while the route toward **The Closed-Curtain Rehearsal** introduces a private 2–5 session that is clear about its stakes and its limits. The store page sells a buy-and-own text world for solo/private co-op, not an MMO. Its included **Kindred Hide Theme Kit** changes presentation without changing outcomes. Gold is **Hide Buttons**; cosmetic tokens are **Moss Charms**. Neither currency buys power, a better roll, a catch, a clear, or a lockout bypass.

| Field | Release specification |
| --- | --- |
| Maturity | all-ages |
| Content descriptor | Local stakes, clear safety controls, and world-specific non-graphic tension where applicable. |
| Included | World entitlement, all authored text data, and Theme Kit. |
| DLC boundary | Future cosmetic plates only; no content advantage. |
| Demand row | anthro identity and hangout world serves the original setting and social/private-co-op demand lane. |

## Code and content remaining

| Item | Status | World-specific requirement |
| --- | --- | --- |
| Rule integration | CODE | `hide_voice` ledger and `kindred_hide_eval_01` through `kindred_hide_eval_15`. |
| Data load | SPEC / CODE | `kindred_hide_places`, kits, NPC trees, quest DAG, drops, vendor, dungeon, interior, talents, and Theme Kit. |
| First hour | SPEC | Kindred Hide: Name a Working Promise at `kindred_hide_place_01`, then the mid-join `kindred_hide_place_04`. |
| Instance | SPEC / CODE | `The Closed-Curtain Rehearsal` through `kindred_hide_place_06`. |
| Big night | SPEC / CODE | `Bridge Bloom Showcase`, 2–5 players, three phases, cosmetic-only record. |
| Kill switches | CODE | disable `kindred_hide` store listing, starts, instance, big night, Theme Kit apply, or canned talk without affecting other worlds. |

## Legal and trust

It is not a pony town, cat-clan copy, furry trademark venue, or open-chat platform. Canned hub lines are authored and not stranger LLM chat. Report, mute, and block are required support flows. Hashed telemetry only; TTS reads chrome and prose; font scaling and non-colour danger indicators are mandatory. Kid Mode, when eligible, limits play to ten text turns per day and disables public DM, trade, and voice.

## Twenty-five click tests

| id | Action | Actual placeId | Expected |
| --- | --- | --- | --- |
| kindred_hide_click_01 | open store identity | kindred_hide_place_01 | Expected: open store identity completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_02 | select age lane | kindred_hide_place_02 | Expected: select age lane completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_03 | start kit | kindred_hide_place_03 | Expected: start kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_04 | read opening stake | kindred_hide_place_04 | Expected: read opening stake completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_05 | open Ledger | kindred_hide_place_05 | Expected: open Ledger completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_06 | travel route | kindred_hide_place_06 | Expected: travel route completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_07 | meet NPC | kindred_hide_place_07 | Expected: meet NPC completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_08 | accept quest | kindred_hide_place_08 | Expected: accept quest completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_09 | complete objective | kindred_hide_place_01 | Expected: complete objective completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_10 | open vendor | kindred_hide_place_02 | Expected: open vendor completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_11 | check gold wallet | kindred_hide_place_03 | Expected: check gold wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_12 | check cosmetic wallet | kindred_hide_place_04 | Expected: check cosmetic wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_13 | apply Theme Kit | kindred_hide_place_05 | Expected: apply Theme Kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_14 | enter instance door | kindred_hide_place_06 | Expected: enter instance door completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_15 | read room-first text | kindred_hide_place_07 | Expected: read room-first text completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_16 | complete trash step | kindred_hide_place_08 | Expected: complete trash step completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_17 | activate checkpoint | kindred_hide_place_01 | Expected: activate checkpoint completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_18 | wipe safely | kindred_hide_place_02 | Expected: wipe safely completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_19 | claim personal loot | kindred_hide_place_03 | Expected: claim personal loot completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_20 | run a talent node | kindred_hide_place_04 | Expected: run a talent node completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_21 | open home interior | kindred_hide_place_05 | Expected: open home interior completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_22 | run a daily contract | kindred_hide_place_06 | Expected: run a daily contract completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_23 | open big-night record | kindred_hide_place_07 | Expected: open big-night record completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_24 | use report/mute/block | kindred_hide_place_08 | Expected: use report/mute/block completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| kindred_hide_click_25 | trigger world kill switch | kindred_hide_place_01 | Expected: trigger world kill switch completes without a public-MMO claim, power sale, or uncommitted ledger prose. |


## CI ban strings

| # | Must reject |
| --- | --- |
| 1 | My Little Pony named place |
| 2 | Pony Town hero silhouette |
| 3 | Warrior Cats logo geometry |
| 4 | Furcadia catchphrase |
| 5 | Zootopia signature costume |
| 6 | Redwall proprietary creature |
| 7 | Sonic map layout |
| 8 | Disney fox faction title |
| 9 | Neopets weapon profile |
| 10 | Furry Fandom trademark UI chrome |
| 11 | My Little Pony quest premise |
| 12 | Pony Town title typography |
| 13 | Warrior Cats color-coded insignia |
| 14 | Furcadia music motif |
| 15 | Zootopia vehicle or mount profile |


## SPEC LLM budget

| Measure | SPEC |
| --- | --- |
| Visible prose per committed turn | 700 target / 1,200 hard ceiling tokens |
| 95th-percentile post-commit narration | under 3.0 seconds, measured before release claim |
| Retained narrative context | 18,000 tokens, refreshed from committed ledger events only |
| Safety sample | 100% store and key-art prompts; 20% canned talk per release candidate |

## Press blurb

Kindred Hide is a WOF text world about an original folk social world of studios, quiet dens, and consentful visits where people define their own presentation, boundaries, and club life through canned, safe social play. It begins at Welcome Burrow with Kindred Hide: Name a Working Promise, a small commitment that makes the local texture immediately useful. Choose one of four distinct kits—including the Velvet Morrow—then follow clear, committed choices through a private solo or 2–5 player co-op session. The named five-room instance, The Closed-Curtain Rehearsal, uses room-first description and personal loot; the closing Bridge Bloom Showcase gives friends a cosmetic-focused big night rather than a scaled raid claim. A complete Kindred Hide Theme Kit is included with the world. Gold, Hide Buttons, and cosmetic tokens, Moss Charms, remain separate. No gacha, outcome sale, lockout skip, or paid power item is offered. It is not described as an MMO until that capability is proven.

## FAQ

| Question | Answer |
| --- | --- |
| Is Kindred Hide an MMO? | No. It is described as solo/private co-op until multiplayer is proven. |
| What comes with the purchase? | The world and its complete Theme Kit. |
| Can I buy a better outcome? | No; outcome sales, power, clears, lockout skips, catch changes, gacha, and loot boxes are prohibited. |
| What happens after a wipe? | Return to the named checkpoint; retain personal loot and completed progress. |
| How is social play kept safe? | Friends-first private co-op, canned hub lines, and report/mute/block; no global chat or public DMs. |

## Not ready / still CODE

Entitlement restoration, exact ledger calls, deterministic instance seeding, feature flags, kill-switch monitoring, report pipeline, accessibility acceptance, device performance test, and final legal/ratings review remain CODE or approval work. This bill does not represent them as already live.
