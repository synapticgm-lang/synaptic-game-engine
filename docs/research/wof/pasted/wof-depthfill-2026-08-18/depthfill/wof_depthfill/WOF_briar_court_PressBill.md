# WOF Briar Court: Bespoke Press Bill

## Store identity

**One-line pitch.** Dark fairy bargains and remembered promises.

Briar Court begins at **Briar Gate**, where **Briar Court: Name a Working Promise** asks the player to make a practical choice before anything grand occurs. The **Bargain Gardener** kit sees that problem from a specific working angle, while the route toward **The Hollow Mirror Wake** introduces a private 2–5 session that is clear about its stakes and its limits. The store page sells a buy-and-own text world for solo/private co-op, not an MMO. Its included **Briar Court Theme Kit** changes presentation without changing outcomes. Gold is **Briar Pennies**; cosmetic tokens are **Veil Petals**. Neither currency buys power, a better roll, a catch, a clear, or a lockout bypass.

| Field | Release specification |
| --- | --- |
| Maturity | teen |
| Content descriptor | Local stakes, clear safety controls, and world-specific non-graphic tension where applicable. |
| Included | World entitlement, all authored text data, and Theme Kit. |
| DLC boundary | Future cosmetic plates only; no content advantage. |
| Demand row | dark fairy bargains and remembered promises serves the original setting and social/private-co-op demand lane. |

## Code and content remaining

| Item | Status | World-specific requirement |
| --- | --- | --- |
| Rule integration | CODE | `veil_glamour` ledger and `briar_court_eval_01` through `briar_court_eval_15`. |
| Data load | SPEC / CODE | `briar_court_places`, kits, NPC trees, quest DAG, drops, vendor, dungeon, interior, talents, and Theme Kit. |
| First hour | SPEC | Briar Court: Name a Working Promise at `briar_court_place_01`, then the mid-join `briar_court_place_04`. |
| Instance | SPEC / CODE | `The Hollow Mirror Wake` through `briar_court_place_06`. |
| Big night | SPEC / CODE | `Thorn Choir Masque`, 2–5 players, three phases, cosmetic-only record. |
| Kill switches | CODE | disable `briar_court` store listing, starts, instance, big night, Theme Kit apply, or canned talk without affecting other worlds. |

## Legal and trust

It is an original WOF setting and not a licensed, historical, or platform-derived recreation. Canned hub lines are authored and not stranger LLM chat. Report, mute, and block are required support flows. Hashed telemetry only; TTS reads chrome and prose; font scaling and non-colour danger indicators are mandatory. Kid Mode, when eligible, limits play to ten text turns per day and disables public DM, trade, and voice.

## Twenty-five click tests

| id | Action | Actual placeId | Expected |
| --- | --- | --- | --- |
| briar_court_click_01 | open store identity | briar_court_place_01 | Expected: open store identity completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_02 | select age lane | briar_court_place_02 | Expected: select age lane completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_03 | start kit | briar_court_place_03 | Expected: start kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_04 | read opening stake | briar_court_place_04 | Expected: read opening stake completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_05 | open Ledger | briar_court_place_05 | Expected: open Ledger completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_06 | travel route | briar_court_place_06 | Expected: travel route completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_07 | meet NPC | briar_court_place_07 | Expected: meet NPC completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_08 | accept quest | briar_court_place_08 | Expected: accept quest completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_09 | complete objective | briar_court_place_01 | Expected: complete objective completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_10 | open vendor | briar_court_place_02 | Expected: open vendor completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_11 | check gold wallet | briar_court_place_03 | Expected: check gold wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_12 | check cosmetic wallet | briar_court_place_04 | Expected: check cosmetic wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_13 | apply Theme Kit | briar_court_place_05 | Expected: apply Theme Kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_14 | enter instance door | briar_court_place_06 | Expected: enter instance door completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_15 | read room-first text | briar_court_place_07 | Expected: read room-first text completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_16 | complete trash step | briar_court_place_08 | Expected: complete trash step completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_17 | activate checkpoint | briar_court_place_01 | Expected: activate checkpoint completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_18 | wipe safely | briar_court_place_02 | Expected: wipe safely completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_19 | claim personal loot | briar_court_place_03 | Expected: claim personal loot completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_20 | run a talent node | briar_court_place_04 | Expected: run a talent node completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_21 | open home interior | briar_court_place_05 | Expected: open home interior completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_22 | run a daily contract | briar_court_place_06 | Expected: run a daily contract completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_23 | open big-night record | briar_court_place_07 | Expected: open big-night record completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_24 | use report/mute/block | briar_court_place_08 | Expected: use report/mute/block completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| briar_court_click_25 | trigger world kill switch | briar_court_place_01 | Expected: trigger world kill switch completes without a public-MMO claim, power sale, or uncommitted ledger prose. |


## CI ban strings

| # | Must reject |
| --- | --- |
| 1 | Fable named place |
| 2 | The Witcher hero silhouette |
| 3 | A Court of Thorns and Roses logo geometry |
| 4 | Disney fairy catchphrase |
| 5 | Maleficent signature costume |
| 6 | Labyrinth proprietary creature |
| 7 | Pan’s Labyrinth map layout |
| 8 | Faerie Queene faction title |
| 9 | Neverland weapon profile |
| 10 | Grimm adaptation UI chrome |
| 11 | Fable quest premise |
| 12 | The Witcher title typography |
| 13 | A Court of Thorns and Roses color-coded insignia |
| 14 | Disney fairy music motif |
| 15 | Maleficent vehicle or mount profile |


## SPEC LLM budget

| Measure | SPEC |
| --- | --- |
| Visible prose per committed turn | 700 target / 1,200 hard ceiling tokens |
| 95th-percentile post-commit narration | under 3.0 seconds, measured before release claim |
| Retained narrative context | 18,000 tokens, refreshed from committed ledger events only |
| Safety sample | 100% store and key-art prompts; 20% canned talk per release candidate |

## Press blurb

Briar Court is a WOF text world about dark fairy bargains and remembered promises. It begins at Briar Gate with Briar Court: Name a Working Promise, a small commitment that makes the local texture immediately useful. Choose one of four distinct kits—including the Bargain Gardener—then follow clear, committed choices through a private solo or 2–5 player co-op session. The named five-room instance, The Hollow Mirror Wake, uses room-first description and personal loot; the closing Thorn Choir Masque gives friends a cosmetic-focused big night rather than a scaled raid claim. A complete Briar Court Theme Kit is included with the world. Gold, Briar Pennies, and cosmetic tokens, Veil Petals, remain separate. No gacha, outcome sale, lockout skip, or paid power item is offered. It is not described as an MMO until that capability is proven.

## FAQ

| Question | Answer |
| --- | --- |
| Is Briar Court an MMO? | No. It is described as solo/private co-op until multiplayer is proven. |
| What comes with the purchase? | The world and its complete Theme Kit. |
| Can I buy a better outcome? | No; outcome sales, power, clears, lockout skips, catch changes, gacha, and loot boxes are prohibited. |
| What happens after a wipe? | Return to the named checkpoint; retain personal loot and completed progress. |
| How is social play kept safe? | Friends-first private co-op, canned hub lines, and report/mute/block; no global chat or public DMs. |

## Not ready / still CODE

Entitlement restoration, exact ledger calls, deterministic instance seeding, feature flags, kill-switch monitoring, report pipeline, accessibility acceptance, device performance test, and final legal/ratings review remain CODE or approval work. This bill does not represent them as already live.
