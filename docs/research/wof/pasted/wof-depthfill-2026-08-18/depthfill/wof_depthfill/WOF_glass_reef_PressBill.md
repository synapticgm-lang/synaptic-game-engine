# WOF Glass Reef: Bespoke Press Bill

## Store identity

**One-line pitch.** A luminous underwater city where tidecraft workers mend reef lattices, read currents, and solve pressure-safe civic problems before the living coral loses its memory.

Glass Reef begins at **Lumen Quay**, where **Glass Reef: Name a Working Promise** asks the player to make a practical choice before anything grand occurs. The **Tide Weaver** kit sees that problem from a specific working angle, while the route toward **The Hushglass Siphon** introduces a private 2–5 session that is clear about its stakes and its limits. The store page sells a buy-and-own text world for solo/private co-op, not an MMO. Its included **Glass Reef Theme Kit** changes presentation without changing outcomes. Gold is **Tide Shells**; cosmetic tokens are **Lumen Glints**. Neither currency buys power, a better roll, a catch, a clear, or a lockout bypass.

| Field | Release specification |
| --- | --- |
| Maturity | all-ages |
| Content descriptor | Local stakes, clear safety controls, and world-specific non-graphic tension where applicable. |
| Included | World entitlement, all authored text data, and Theme Kit. |
| DLC boundary | Future cosmetic plates only; no content advantage. |
| Demand row | underwater civic repair fantasy serves the original setting and social/private-co-op demand lane. |

## Code and content remaining

| Item | Status | World-specific requirement |
| --- | --- | --- |
| Rule integration | CODE | `depth_gauge` ledger and `glass_reef_eval_01` through `glass_reef_eval_15`. |
| Data load | SPEC / CODE | `glass_reef_places`, kits, NPC trees, quest DAG, drops, vendor, dungeon, interior, talents, and Theme Kit. |
| First hour | SPEC | Glass Reef: Name a Working Promise at `glass_reef_place_01`, then the mid-join `glass_reef_place_04`. |
| Instance | SPEC / CODE | `The Hushglass Siphon` through `glass_reef_place_06`. |
| Big night | SPEC / CODE | `Pearlward Driftlight`, 2–5 players, three phases, cosmetic-only record. |
| Kill switches | CODE | disable `glass_reef` store listing, starts, instance, big night, Theme Kit apply, or canned talk without affecting other worlds. |

## Legal and trust

It is not a branded ocean kingdom, a mermaid copy, or a lost-continent reconstruction. Canned hub lines are authored and not stranger LLM chat. Report, mute, and block are required support flows. Hashed telemetry only; TTS reads chrome and prose; font scaling and non-colour danger indicators are mandatory. Kid Mode, when eligible, limits play to ten text turns per day and disables public DM, trade, and voice.

## Twenty-five click tests

| id | Action | Actual placeId | Expected |
| --- | --- | --- | --- |
| glass_reef_click_01 | open store identity | glass_reef_place_01 | Expected: open store identity completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_02 | select age lane | glass_reef_place_02 | Expected: select age lane completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_03 | start kit | glass_reef_place_03 | Expected: start kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_04 | read opening stake | glass_reef_place_04 | Expected: read opening stake completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_05 | open Ledger | glass_reef_place_05 | Expected: open Ledger completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_06 | travel route | glass_reef_place_06 | Expected: travel route completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_07 | meet NPC | glass_reef_place_07 | Expected: meet NPC completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_08 | accept quest | glass_reef_place_08 | Expected: accept quest completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_09 | complete objective | glass_reef_place_01 | Expected: complete objective completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_10 | open vendor | glass_reef_place_02 | Expected: open vendor completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_11 | check gold wallet | glass_reef_place_03 | Expected: check gold wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_12 | check cosmetic wallet | glass_reef_place_04 | Expected: check cosmetic wallet completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_13 | apply Theme Kit | glass_reef_place_05 | Expected: apply Theme Kit completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_14 | enter instance door | glass_reef_place_06 | Expected: enter instance door completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_15 | read room-first text | glass_reef_place_07 | Expected: read room-first text completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_16 | complete trash step | glass_reef_place_08 | Expected: complete trash step completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_17 | activate checkpoint | glass_reef_place_01 | Expected: activate checkpoint completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_18 | wipe safely | glass_reef_place_02 | Expected: wipe safely completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_19 | claim personal loot | glass_reef_place_03 | Expected: claim personal loot completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_20 | run a talent node | glass_reef_place_04 | Expected: run a talent node completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_21 | open home interior | glass_reef_place_05 | Expected: open home interior completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_22 | run a daily contract | glass_reef_place_06 | Expected: run a daily contract completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_23 | open big-night record | glass_reef_place_07 | Expected: open big-night record completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_24 | use report/mute/block | glass_reef_place_08 | Expected: use report/mute/block completes without a public-MMO claim, power sale, or uncommitted ledger prose. |
| glass_reef_click_25 | trigger world kill switch | glass_reef_place_01 | Expected: trigger world kill switch completes without a public-MMO claim, power sale, or uncommitted ledger prose. |


## CI ban strings

| # | Must reject |
| --- | --- |
| 1 | Atlantis Disney named place |
| 2 | The Little Mermaid hero silhouette |
| 3 | Aquaman logo geometry |
| 4 | Bioshock Rapture catchphrase |
| 5 | Subnautica signature costume |
| 6 | Finding Nemo proprietary creature |
| 7 | SeaQuest map layout |
| 8 | Avatar Way of Water faction title |
| 9 | SpongeBob weapon profile |
| 10 | Ariel silhouette UI chrome |
| 11 | Atlantis Disney quest premise |
| 12 | The Little Mermaid title typography |
| 13 | Aquaman color-coded insignia |
| 14 | Bioshock Rapture music motif |
| 15 | Subnautica vehicle or mount profile |


## SPEC LLM budget

| Measure | SPEC |
| --- | --- |
| Visible prose per committed turn | 700 target / 1,200 hard ceiling tokens |
| 95th-percentile post-commit narration | under 3.0 seconds, measured before release claim |
| Retained narrative context | 18,000 tokens, refreshed from committed ledger events only |
| Safety sample | 100% store and key-art prompts; 20% canned talk per release candidate |

## Press blurb

Glass Reef is a WOF text world about a luminous underwater city where tidecraft workers mend reef lattices, read currents, and solve pressure-safe civic problems before the living coral loses its memory. It begins at Lumen Quay with Glass Reef: Name a Working Promise, a small commitment that makes the local texture immediately useful. Choose one of four distinct kits—including the Tide Weaver—then follow clear, committed choices through a private solo or 2–5 player co-op session. The named five-room instance, The Hushglass Siphon, uses room-first description and personal loot; the closing Pearlward Driftlight gives friends a cosmetic-focused big night rather than a scaled raid claim. A complete Glass Reef Theme Kit is included with the world. Gold, Tide Shells, and cosmetic tokens, Lumen Glints, remain separate. No gacha, outcome sale, lockout skip, or paid power item is offered. It is not described as an MMO until that capability is proven.

## FAQ

| Question | Answer |
| --- | --- |
| Is Glass Reef an MMO? | No. It is described as solo/private co-op until multiplayer is proven. |
| What comes with the purchase? | The world and its complete Theme Kit. |
| Can I buy a better outcome? | No; outcome sales, power, clears, lockout skips, catch changes, gacha, and loot boxes are prohibited. |
| What happens after a wipe? | Return to the named checkpoint; retain personal loot and completed progress. |
| How is social play kept safe? | Friends-first private co-op, canned hub lines, and report/mute/block; no global chat or public DMs. |

## Not ready / still CODE

Entitlement restoration, exact ledger calls, deterministic instance seeding, feature flags, kill-switch monitoring, report pipeline, accessibility acceptance, device performance test, and final legal/ratings review remain CODE or approval work. This bill does not represent them as already live.
