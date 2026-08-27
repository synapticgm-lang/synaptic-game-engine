# WOF World Pack: Crew Score

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `crew_score` |
| Display name | Crew Score |
| One-line pitch | Plan precise, low-casualty robberies in a rainlit city where reputation is a heat meter and every job has an exit price. |
| Maturity | Teen |
| `rulesModuleId` | `heat_wanted` |
| Theme Kit | `velvet_static` |
| Genre pattern and fence | Original cooperative heist drama with preparation, disguise, pursuit, and consequence; this is **not** a licensed crime franchise, a copied ensemble, or a real-world criminal simulator. |

All cultures, crews, districts, objects, and slogans below are original. The fantasy is theatrical and non-graphic: no torture, sexual content, drug use, or gore-as-spectacle.

**Genre-specific ban-list.** Do not use or generate: Grand Theft Auto, Los Santos, Liberty City, Vice City, Rockstar, Payday, Bain, Dallas, Chains, Hoxton, Wolf, Jacket, Hotline Miami, Heat, Neil McCauley, Ocean's Eleven, Danny Ocean, Rusty Ryan, The Italian Job, Charlie Croker, Point Break, John Wick, Continental, Winston Scott, Hitman, Agent 47, Codename 47, Thief, Garrett, Dishonored, Corvo Attano, Sly Cooper, Carmen Sandiego, Lupin, Arsène Lupin, Money Heist, La Casa de Papel, Professor, Tokyo, Berlin, The Town, Baby Driver, Bonnie and Clyde, Bonnie Parker, Clyde Barrow, The Dark Knight, Joker, Catwoman, Mission: Impossible, Ethan Hunt, James Bond, 007, Casino Royale, Kingsman, Ocean's, The Wire, Breaking Bad, Narcos, Saints Row, Sleeping Dogs, Watch Dogs, and any direct likeness of their characters, locations, logos, slogans, signature gadgets, or beat-for-beat plots.

## 1) Rules module: `heat_wanted`

The ledger owns `hp`, `heat`, `wanted_tier`, `alarm_state`, `crew_role`, `job_phase`, `loot_value`, `evidence_count`, `checkpoint_id`, `cooldown_until`, `score`, `inventory`, and `divergence_record`. A job is a private 2–5 player instance; the overworld contains shared hubs and instanced encounters, never contested open-world PvP. Lockstep rounds commit movement, stealth, talk, tool, and fight actions before narration. Wipe returns the crew to its last checkpoint; a boss has a weekly per-character lockout, while failed jobs may be retried after a short cooldown. Personal loot is rolled after state commit.

Prose may not invent damage, successful theft, evidence removal, heat reduction, loot identity, alarms, or a cleared job. It may describe intent, sensory detail, and the committed result. It may not claim a match, job, floor, or objective is complete without a ledger event.

### Diegetic chrome templates

```text
[JOB CARD] {jobName} | PAYOUT {gold} | HEAT CEILING {wantedTier} | EXIT {exitPlaceId}
[HEAT] {currentHeat}/100 | CITY WATCH: {wantedTier} | EVIDENCE: {evidenceCount}
[ROUND COMMITTED] {crewName} chose {actionLabel}. Awaiting consequence record.
[LOOT SEALED] {itemName} | PERSONAL CLAIM | GOLD VALUE {goldValue}
[CHECKPOINT] {checkpointId} secured. A wipe returns the crew here; committed evidence remains.
[EXIT WINDOW] {placeId} open for {roundsRemaining} rounds.
```

## 2) Identity kits

| `kitId` | Look and values | Taboo and speech tell | Starter clothes / weapon | Start and first-hour quest | Ability flag | Why original |
|---|---|---|---|---|---|---|
| `kit_surveyor` | Ink-stained route reader; values preparation and consent. | Never falsifies a map; says “mark the margin.” | Slate vest, soft shoes / folding baton. | `start_ledger` at `cinder_quay`; `quest_surveyor_margin`. | `can_read_patrol_loops` | A civic mapmaker kit, not a licensed thief archetype. |
| `kit_maskwright` | Quiet maker of reversible masks; values empathy and clean exits. | Will not impersonate a living person; repeats “faces are borrowed.” | Waxed apron, scarf / resin flash-pellet. | `old_lantern_ward`; `quest_maskwright_return`. | `can_prepare_disguise` | An original craft-and-ethics identity kit. |
| `kit_switchhand` | Agile courier with mismatched gloves; values timing and mutual aid. | Never abandons a partner; uses clipped “on my count.” | Messenger coat, handwraps / spring hook. | `brass_market`; `quest_switchhand_count`. | `can_chain_movement` | A timing-focused courier, not a copied action hero. |
| `kit_accountant` | Calm tally keeper; values fair shares and recorded promises. | Never pockets an unlisted share; says “show the column.” | Grey waistcoat, brass spectacles / weighted coin-roll. | `rain_archive`; `quest_accountant_column`. | `can_audit_payout` | A social-economy role with original stakes. |

## 3) Map / places

The city of **Morrowglass** is a vertical port of bridges, tram roofs, archive basements, and rain courts. Street maps show pins and outline only unvisited blocks; indoor spaces use a floor-plan and reveal rooms only after a door is opened. Instance doors are place records, never magical portals.

| Start zone / hub | POIs (`placeId`, public name, scale, danger, outdoor, exits, NPCs, optional instance) |
|---|---|
| `cinder_quay` / `dockside_union` | `quay_steps` Cinder Steps, street, safe, yes, `dockside_union`,`lamp_court`, `npcs_quay`; `ropewalk_lane` Ropewalk Lane, street, low, yes, `quay_steps`,`tally_house`, `npcs_quay`; `tally_house` Tally House, dungeon, low, no, `ropewalk_lane`,`ledger_vault_door`, `npcs_quay`, `instance_tally_vault`; `lamp_court` Lamp Court, street, safe, yes, `quay_steps`,`dockside_union`, `npcs_quay`; `ledger_vault_door` Tally Vault door, dungeon, medium, no, `tally_house`, `instance_tally_vault`, `npcs_quay`. |
| `old_lantern_ward` / `blue_shutter` | `shutter_square` Blue Shutter Square, street, safe, yes, `blue_shutter`,`glassblower_row`, `npcs_lantern`; `glassblower_row` Glassblower Row, street, low, yes, `shutter_square`,`tram_cut`, `npcs_lantern`; `tram_cut` Tram Cut, street, medium, yes, `glassblower_row`,`watch_post`, `npcs_lantern`; `watch_post` Watch Post 7, dungeon, medium, no, `tram_cut`,`signal_room`, `npcs_lantern`; `signal_room` Signal Room, dungeon, medium, no, `watch_post`, `instance_signal_house`, `npcs_lantern`. |
| `brass_market` / `nine_awning` | `awning_gate` Nine Awning Gate, street, safe, yes, `nine_awning`,`coin_arcade`, `npcs_market`; `coin_arcade` Coin Arcade, street, low, yes, `awning_gate`,`spice_walk`, `npcs_market`; `spice_walk` Spice Walk, street, low, yes, `coin_arcade`,`auction_cellar`, `npcs_market`; `auction_cellar` Auction Cellar, dungeon, medium, no, `spice_walk`,`lot_room`, `npcs_market`; `lot_room` Lot Room, dungeon, medium, no, `auction_cellar`, `instance_lot_cellar`, `npcs_market`. |
| `rain_archive` / `paperbridge` | `archive_front` Rain Archive front, street, safe, yes, `paperbridge`,`index_hall`, `npcs_archive`; `index_hall` Index Hall, dungeon, low, no, `archive_front`,`map_stack`, `npcs_archive`; `map_stack` Map Stack, dungeon, medium, no, `index_hall`,`bell_gallery`, `npcs_archive`; `bell_gallery` Bell Gallery, dungeon, medium, no, `map_stack`,`roof_exits`, `npcs_archive`; `roof_exits` Archive roofs, street, medium, yes, `bell_gallery`,`paperbridge`, `npcs_archive`. |

`paperbridge` connects to the mid-world join `crosswire_square`, which branches to the two end-of-start capitals `civic_exchange` and `night_depot`. The faction-neutral capital is Civic Exchange; the clandestine capital is Night Depot. Travel graph: each start hub → `crosswire_square` → `civic_exchange` or `night_depot`; no teleport. Job doors are `ledger_vault_door`, `signal_room`, `lot_room`, and `night_depot_jobboard`.

## 4) Durable NPCs

| `npcId` | Name | Place | Role | Character function |
|---|---|---|---|---|
| `npc_mara_vell` | Mara Vell | `dockside_union` | quest/hub | Retired ferry clerk who protects first-timers. |
| `npc_orin_quill` | Orin Quill | `tally_house` | profession/merchant | Teaches honest accounting and sells lock tools. |
| `npc_sable_reed` | Sable Reed | `blue_shutter` | quest/hub | Maskwright who sees disguise as a promise. |
| `npc_bram_fole` | Bram Fole | `watch_post` | local/quest | A watch constable willing to trade rumors for restraint. |
| `npc_vesa_nine` | Vesa Nine | `nine_awning` | merchant/quest | Auctioneer who marks lots by memory, not labels. |
| `npc_jo_cairn` | Jo Cairn | `paperbridge` | profession/merchant | Archive runner with a strict chain-of-custody ethic. |
| `npc_ren_docket` | Ren Docket | `civic_exchange` | hub/quest | Mediates payout disputes. |
| `npc_kest_morrow` | Kest Morrow | `night_depot` | quest/merchant | Job broker whose missing sibling drives the campaign. |
| `npc_ada_latch` | Ada Latch | `crosswire_square` | local | Street performer who spots patrol changes. |
| `npc_pell_serein` | Pell Serein | `rain_archive` | profession/quest | Keeper of erased neighborhood ledgers. |

**Premade talk trees.** Every listed quest-giver and merchant uses the following authored tree; `quest_offer`, `quest_progress`, and `quest_turnin` vary by current quest, while the refusal line is shared per NPC. No improvisation is required.

| NPC | greet | quest_offer | quest_progress | quest_turnin | gossip (three lines) | refusal / player-rude |
|---|---|---|---|---|---|---|
| Mara | “Rain makes honest footprints.” | “Carry this sealed route to the union.” | “The seal is dry; you are close.” | “You brought it without opening it. Good.” | “The ferries count tides.” / “A clean exit is a kindness.” / “Never brag near brass.” | “I will not help someone who threatens my runners.” |
| Orin | “Show the column.” | “Reconcile three missing crate marks.” | “Two marks agree; find the third.” | “Numbers now point to a person, not a rumor.” | “Locks have moods.” / “Shares prevent grudges.” / “A tool is only as good as its return.” | “No service while your hands are reaching for my shelves.” |
| Sable | “Faces are borrowed.” | “Return my blank mask before it takes a name.” | “The resin is warm; hurry carefully.” | “You kept the face empty. That matters.” | “A disguise changes posture.” / “Blue glass reflects badly.” / “Never copy a mourner.” | “Leave the mask on the peg and leave with it.” |
| Bram | “Keep your hands where rain can see them.” | “Find who is ringing the false alarm bell.” | “The bell rhythm changed; the culprit is near.” | “You stopped a panic without making one.” | “Not every guard wants a chase.” / “Paper trails get people hurt.” / “A quiet street is still a street.” | “Rudeness is evidence. I am recording it.” |
| Vesa | “Every lot has a story.” | “Verify three marks on a disputed lot.” | “The buyer’s mark is counterfeit.” | “The lot returns to its maker.” | “Auction bells travel.” / “Memory beats ink in a crowd.” / “Never bid against your own shadow.” | “No bid, no bargain, no conversation.” |
| Jo | “Archive dust is a patient witness.” | “Deliver an index strip to the roof exit.” | “The strip is in order; the last shelf remains.” | “A chain of custody is a kind of shelter.” | “Maps remember stairs.” / “Ink fades slower than rumor.” / “I run because shelves cannot.” | “I do not hand records to a bully.” |
| Ren | “Every promise gets a receipt.” | “Settle a three-way split before sundown.” | “Two shares are logged; one is contested.” | “No one leaves cheated.” | “The square hears everything.” / “Gold is not applause.” / “A crew is a verb.” | “Threats void the table.” |
| Kest | “You want a job or a legend?” | “Recover my sibling’s brass whistle.” | “The whistle has crossed the ward line.” | “You returned a person’s keepsake, not a trophy.” | “Big jobs begin small.” / “Watch the exits.” / “A broker is only useful when transparent.” | “I do not hire people who confuse cruelty with nerve.” |
| Ada | “The crowd moved three minutes early.” | “Count the changed street signals.” | “You found the pattern.” | “Now the city has one fewer blind corner.” | “Songs carry warnings.” / “Red umbrellas mean witnesses.” / “A dropped coin can be a message.” | “Performers do not owe hecklers a clue.” |
| Pell | “Some names were rubbed out.” | “Restore a neighborhood index from three scraps.” | “The old address is becoming legible.” | “The erased family has a place again.” | “Paper is not harmless.” / “Every district has a first door.” / “Rain reveals bad glue.” | “I will not restore the record for someone who plans to exploit it.” |

**Canned hub lines for each starting zone.** Cinder Quay: “Mind the wet rope.” “Ferry bell in two.” “No running on the steps.” “A blue crate means fragile.” “Keep the lane clear.” “Rain is cover, not permission.” “The union closes at dusk.” “Watch the tide marks.” “Someone left a clean umbrella.” “Quiet crews tip well.” Old Lantern Ward: “Blue shutters open at noon.” “Glass carries sound.” “Tram sparks are normal.” “Do not touch the signal wire.” “Mask straps on the left.” “The ward remembers faces.” “Rain gutters are not shortcuts.” “Watch Post 7 is awake.” “A bell can lie.” “Leave the lantern brighter.” Brass Market: “Nine awnings, three exits.” “Keep receipts visible.” “The bell means lot change.” “No squeezing past the velvet rope.” “A seller watches your shoes.” “Coins roll downhill.” “The market closes in rain.” “Ask before touching.” “A good bargain leaves both parties.” “Do not make a scene.” Rain Archive: “Dry your sleeves.” “Shelves are not ladders.” “The roof path is open.” “Index strips stay flat.” “A bell marks a returned book.” “No shouting in the stacks.” “Maps face north here.” “Ink is still wet.” “The archive lends trust.” “Leave the bridge unblocked.”

## 5) Premade choices / first hour

Each kit receives five beats: establish look and kit; choose a reason for joining; accept a stake; observe a consequence; record `identity_confirmed`, `first_choice`, and `observed_consequence`. The stake is explicit: accept Mara’s route and risk being marked as a trespasser, or refuse and lose the first safe job until the next in-game day.

| POI | Choice buttons (requirements; intent) |
|---|---|
| `quay_steps` | “Read tide marks” (none; inspect), “Ask Mara for a route” (`talk_to_npc:npc_mara_vell`; talk), “Hide crate tag” (`item:chalk_stub`; tool), “Cross openly” (none; move), “Wait for ferry bell” (none; observe), “Leave a clean note” (`item:blank_card`; talk). |
| `tally_house` | “Compare ledgers” (`ability:can_audit_payout`; inspect), “Deliver sealed route” (`item:sealed_route`; deliver), “Distract the clerk” (`quest:start_ledger`; talk), “Take the marked stair” (`quest:route_read`; move), “Withdraw” (none; exit), “Ask Orin about shares” (`talk_to_npc:npc_orin_quill`; talk). |
| `shutter_square` | “Fit a blank mask” (`ability:can_prepare_disguise`; tool), “Ask Sable for a face rule” (`talk_to_npc:npc_sable_reed`; talk), “Follow blue glass” (none; inspect), “Report the false bell” (`quest:false_bell`; talk), “Use the tram cut” (`place:tram_cut`; move), “Keep your own face” (none; stance). |
| `nine_awning` | “Verify a lot mark” (`item:chalk_stub`; inspect), “Ask Vesa for a quiet bid” (`talk_to_npc:npc_vesa_nine`; talk), “Count umbrellas” (none; observe), “Return a dropped receipt” (`item:lot_receipt`; deliver), “Take the public lane” (none; move), “Refuse the tempting shortcut” (none; stance). |
| `archive_front` | “Dry the index strip” (`item:index_strip`; tool), “Ask Jo about chain of custody” (`talk_to_npc:npc_jo_cairn`; talk), “Climb to roof exit” (`place:roof_exits`; move), “Read erased ink” (`ability:can_read_patrol_loops`; inspect), “Wait under paperbridge” (none; observe), “Leave the archive intact” (none; stance). |

Tutorial forced path: `start_ledger` → visit `quay_steps` → talk to `npc_mara_vell` → collect `chalk_stub` → visit `tally_house` → choose a nonviolent entry → commit `checkpoint_quay` → exit to `dockside_union`. Alternate characters may skip after one completed job. Retry fingerprints: (1) goal route proof, tactic observation, obstacle rain, revelation patrol gap, consequence delayed exit; (2) goal blank mask, tactic barter, obstacle missing resin, revelation Sable’s trust, consequence disguise unavailable; (3) goal fair payout, tactic audit, obstacle false mark, revelation duplicate ledger, consequence heat +6; (4) goal quiet alarm, tactic bell rhythm, obstacle crowd, revelation wrong bell, consequence witness token; (5) goal archive strip, tactic roof route, obstacle locked stair, revelation side latch, consequence time cost; (6) goal whistle, tactic courier inquiry, obstacle ward line, revelation blue thread, consequence safe travel; (7) goal sibling clue, tactic return ledger, obstacle mistrust, revelation shared initials, consequence divergence option; (8) goal clean exit, tactic crew split, obstacle rain surge, revelation second bridge, consequence checkpoint choice.

## 6) Quests: code-completeable DAG

### Primary start: Cinder Quay (`cinder_quay`)

| `questId` | Title | Family / hidden | Unlock | Objectives | Gold | XP |
|---|---|---|---|---|---:|---:|
| `quest_surveyor_margin` | Mark the Margin | identity / no | — | `visit_place:quay_steps:1`; `talk_to_npc:npc_mara_vell:1` | 12 | 40 |
| `quest_switchhand_count` | On My Count | identity / no | `quest_surveyor_margin` | `collect_item:chalk_stub:1`; `visit_place:ropewalk_lane:1` | 14 | 45 |
| `quest_start_ledger` | The First Column | identity / no | `quest_switchhand_count` | `visit_place:tally_house:1`; `talk_to_npc:npc_orin_quill:1` | 18 | 60 |
| `quest_quay_sealed_route` | Sealed Route | zone_story / no | `quest_start_ledger` | `deliver_item:sealed_route:dockside_union:1`; `visit_place:lamp_court:1` | 22 | 75 |
| `quest_quay_tide_marks` | Tide Marks | zone_story / no | `quest_start_ledger` | `collect_item:tide_mark_rubbing:3`; `visit_place:quay_steps:1` | 20 | 70 |
| `quest_quay_crate_echo` | Crate Echo | side / no | `quest_surveyor_margin` | `collect_item:blue_crate_tag:2`; `talk_to_npc:npc_mara_vell:1` | 16 | 55 |
| `quest_quay_reconcile` | Reconcile Three | profession / no | `quest_start_ledger` | `collect_item:crate_mark:3`; `talk_to_npc:npc_orin_quill:1` | 24 | 80 |
| `quest_quay_lock_oil` | Lock Oil | profession / no | `quest_quay_reconcile` | `deliver_item:clear_oil:tally_house:2`; `collect_item:oil_vial:2` | 28 | 90 |
| `quest_quay_watchful_ferry` | Watchful Ferry | zone_story / no | `quest_quay_sealed_route` | `visit_place:ropewalk_lane:1`; `ledger_kill:quay_screecher:3` | 30 | 100 |
| `quest_quay_clean_witness` | Clean Witness | side / no | `quest_quay_tide_marks` | `talk_to_npc:npc_ada_latch:1`; `collect_item:unopened_umbrella:1` | 26 | 85 |
| `quest_quay_vault_breadcrumb` | A Door Below | dungeon / no | `quest_quay_reconcile` | `visit_place:ledger_vault_door:1`; `collect_item:brass_key_fragment:1` | 32 | 110 |
| `quest_quay_vault_entry` | Tally Vault Entry | zone_story / no | `quest_quay_vault_breadcrumb` | `visit_place:ledger_vault_door:1`; `ledger_kill:inkmoth:4` | 38 | 130 |
| `quest_quay_hidden_trust` | No Names on Paper | trust / yes | `quest_quay_clean_witness` | `talk_to_npc:npc_mara_vell:1`; `deliver_item:blank_card:dockside_union:1` | 35 | 120 |
| `quest_quay_daily_route` | Daily: Dry Crossing | daily / no | `quest_quay_sealed_route` | `visit_place:quay_steps:1`; `collect_item:dry_rope:4` | 10 | 25 |
| `quest_quay_daily_route_2` | Daily: Quiet Crates | daily / no | `quest_quay_daily_route` | `collect_item:blue_crate_tag:3`; `deliver_item:crate_tag:dockside_union:1` | 10 | 25 |
| `quest_quay_exit_window` | Window in Rain | zone_story / no | `quest_quay_vault_entry` | `visit_place:ledger_vault_door:1`; `deliver_item:sealed_route:crosswire_square:1` | 45 | 160 |
| `quest_quay_job_offer` | The Job Has a Price | campaign / no | `quest_quay_exit_window` | `talk_to_npc:npc_kest_morrow:1`; `visit_place:crosswire_square:1` | 50 | 180 |
| `quest_quay_walkaway` | Record the Refusal | divergence / no | `quest_quay_job_offer` | `talk_to_npc:npc_kest_morrow:1`; `deliver_item:refusal_record:rain_archive:1` | 20 | 60 |

Other starting zones use authored 18-beat arcs with different verbs and local stakes: Old Lantern Ward focuses on false bell signals (`quest_lantern_signal_01` through `quest_lantern_signal_18`), Brass Market on a disputed inheritance lot (`quest_market_lot_01` through `quest_market_lot_18`), and Rain Archive on erased addresses (`quest_archive_index_01` through `quest_archive_index_18`). Each arc contains 4 identity, 4 profession, 5 local-story, 2 side, 1 instance breadcrumb, 1 hidden trust, and 1 capped daily beat; every objective is one of `visit_place`, `ledger_kill`, `deliver_item`, `talk_to_npc`, or `collect_item`. Their three local threats are respectively a watch signal loop, a coercive auction broker, and a roof leak that destroys tenant records—not a city-ending conspiracy.

Campaign spine: `quest_crosswire_invitation` (visit `crosswire_square`), `quest_choose_safehouse` (talk Ren or Kest), `quest_audit_broker` (collect three broker slips), `quest_first_job_brief` (talk Kest), `quest_case_the_lot` (visit `lot_room`), `quest_place_exit_marks` (collect two chalk marks), `quest_split_roles` (talk three crew-role NPCs), `quest_secure_checkpoint` (visit `checkpoint_job`), `quest_take_the_lot` (collect `blueglass_casket`), `quest_control_heat` (deliver `evidence_bundle`), `quest_return_share` (talk Ren), `quest_night_depot` (visit `night_depot`), `quest_broker_truth` (talk Kest), `quest_sibling_route` (collect `brass_whistle`), `quest_big_score_contract` (deliver `contract_seal:civic_exchange`), and `quest_morrowglass_finale` (visit `night_depot_jobboard`). Rewards are 55–140 gold and 180–420 XP in ledger records. A player may walk away after the safehouse, refuse the disputed lot, or return the casket; each writes `divergence_record` values `safehouse_refused`, `lot_declined`, or `casket_returned` and changes later dialogue rather than silently forgetting the promise.

## 7) Species / opponents / collectibles

Combat skins are non-graphic urban obstacles. Each start has the following 16 species; the same catalog is region-tagged rather than cloned across maps: `rain_mite` common, `crate_skulker` common, `bell_thief` common, `inkmoth` common, `wire_rat` common, `gutter_owl` common, `sour_watchman` uncommon, `false_bell_runner` uncommon, `glassback_hound` uncommon, `ledger_warden` uncommon, `brass_masker` rare, `roofline_sentinel` rare, `quiet_fox` rare, `lot_custodian` epic, `red_stamp_enforcer` epic, `morrowglass_ringleader` epic. Each entry has habitat tags (`quay`, `ward`, `market`, `archive`), base HP 18/24/30/38 by rarity, base attack 3/5/7/10, and AC 9/11/13/15. The `quiet_fox` is a collectible companion skin, not a creature from any franchise. Collectibles include `blueglass_casket`, `brass_whistle`, `sealed_route`, `blank_card`, `evidence_bundle`, `lot_receipt`, `index_strip`, and `refusal_record`.

## 8) Loot / economy

| Template | Examples | Function |
|---|---|---|
| Starter | `softshoe_pair`, `folding_baton`, `route_slate`, `resin_pellet` | Cosmetic or entry utility; no random power packs. |
| Profession | `clear_oil`, `blank_mask`, `dry_rope`, `ledger_strip` | Crafting and authored quest delivery. |
| Job drop | `blueglass_casket`, `brass_key_fragment`, `quiet_gloves`, `rainproof_satchel` | Personal loot with fixed room tables. |
| Cosmetic | `velvet_collar`, `brass_earpiece`, `inkline_coat`, `amber_umbrella` | Visual only; purchased with cosmetic tokens or earned. |

Room drop tables: Quay rooms yield `dry_rope` 45%, `crate_mark` 35%, `brass_key_fragment` 20%; ward rooms yield `resin_chip` 50%, `bell_pin` 35%, `blue_shutter_dye` 15%; market rooms yield `lot_receipt` 50%, `coin_rubbing` 35%, `velvet_collar` 15%; archive rooms yield `index_strip` 45%, `ink_sponge` 40%, `map_thread` 15%. Species drops are personal and deterministic within a seeded table. Vendors sell tools, maps, repair kits, and cosmetics; `repairCostPerPoint=2` gold, with a 100-gold daily repair subsidy from hub contracts. Gold faucets are quest rewards, job payouts, and capped dailies; sinks are repairs, tool restocking, map copying, and authored bribes. Daily gold from repeatables caps at 180. Gold cannot purchase cosmetic tokens; premium cannot purchase outcomes, heat removal, loot rolls, job clears, or lockout skips. Collection log entries track place, item, species, NPC trust, and completed job without revealing hidden quests.

## 9) Instances

### Soloable 5-man equivalent: Tally Vault (`instance_tally_vault`)

The instance is soloable with a companion loadout or playable by 2–5; each room is described before any creature appears.

| Room | Description and encounter | Exits / checkpoint |
|---|---|---|
| `vault_room_01` | A flooded receiving room with floating tally boards; encounter `rain_mite` ×4. | `vault_room_02`; exit to `tally_house`. |
| `vault_room_02` | A narrow shelf corridor where brass drawers click in sequence; `inkmoth` ×5. | `vault_room_03`. |
| `vault_room_03` | A dry clerk’s office with one lit desk; elite `ledger_warden` ×1. | Checkpoint `checkpoint_vault_office`; `vault_room_04`. |
| `vault_room_04` | A circular counting room with four locked doors; `crate_skulker` ×3 and `false_bell_runner` ×1. | `vault_room_05`. |
| `vault_room_05` | The roof cistern chamber, rain hammering the glass; boss `lot_custodian` ×1. | Exit `vault_exit_roof`; `crosswire_square`. |

### Big instance: The Seven-Receipt Job (`instance_seven_receipt_job`)

A 10-player optional MMO-combat skin is staged as three phases, with personal loot and weekly per-character boss lockout. Phase one is **The Public Face**, rooms `job_lobby`, `public_stairs`, and `receipt_gallery`, where crews control witnesses and face `sour_watchman` ×6. Phase two is **The Moving Vault**, rooms `tram_bridge`, `counterweight_deck`, and `rain_engine`, where the `red_stamp_enforcer` appears as an elite and evidence rises through timed ledger events. Phase three is **The Exit That Moves**, rooms `shifting_roof`, `civic_clock`, and `last_window`, ending with `morrowglass_ringleader`; wipe returns to the latest checkpoint. The job’s win condition is `collect_item:seven_receipts:7` and `visit_place:last_window:1`, not prose acclaim.

## 10) Progression

| Node | Cost | Requires | Effect flag |
|---|---:|---|---|
| `talent_quiet_step` | 1 | — | `heat_gain_minus_2_move` |
| `talent_margin_read` | 1 | — | `can_read_patrol_loops` |
| `talent_clean_share` | 2 | `talent_margin_read` | `payout_audit_plus_5` |
| `talent_soft_entry` | 2 | `talent_quiet_step` | `first_alarm_delay_1` |
| `talent_signal_memory` | 2 | `talent_margin_read` | `bell_pattern_reveal` |
| `talent_mask_care` | 2 | `talent_soft_entry` | `disguise_durability_plus_1` |
| `talent_exit_mark` | 3 | `talent_clean_share` | `extra_exit_pin` |
| `talent_partner_count` | 3 | `talent_quiet_step` | `assist_chain_plus_1` |
| `talent_rain_route` | 3 | `talent_signal_memory` | `quay_travel_heat_minus_3` |
| `talent_false_column` | 4 | `talent_clean_share`,`talent_signal_memory` | `evidence_decay_once` |
| `talent_calm_room` | 4 | `talent_partner_count` | `room_alarm_check_plus_1` |
| `talent_last_window` | 5 | `talent_exit_mark`,`talent_false_column` | `final_exit_round_plus_1` |

Daily/weekly contracts, all capped: `contract_dry_crossing` (visit two quay places; 18 gold), `contract_marked_lot` (collect three lot marks; 22 gold), `contract_bell_watch` (talk Bram and visit signal room; 20 gold), `contract_archive_runner` (deliver index strip; 20 gold), and `contract_receipt_seven` (complete one phase of the big job; 35 gold, weekly). No contract pays power directly and none can be bought with premium currency.

## 11) Theme Kit + copy

`velvet_static` uses charcoal paper, tarnished brass, rain-blue glass, and a single ember-red alert mark. Dice are matte black resin with brass pips; the voice is intimate, quick, and observant, with percussion made from coins, shutters, and distant tram wheels. The ambient loop is **“Rain on the Counting Roof”**, a 68-second instrumental loop of brushed frame drum, muted glass taps, and low electric hum. Default fashion is practical layered coats, soft shoes, reversible scarves, and one personal accent; the System/chrome name is **The Ledgerlight**.

**UI labels:** `Inventory` → “Your Kit”; `Journal` → “The Ledger”; `Map` → “City Marks”; `Party` → “Crew”; `Quest Complete` → “Receipt Closed”; `Heat` → “Street Heat”; `Wanted` → “Watch Notice”; `Dungeon` → “Job Door”; `Loot` → “Personal Claim”; `Gold` → “City Gold”; `Cosmetic Tokens` → “Gleam”; `Skills` → “Practices”; `Talents` → “Edges”; `Repair` → “Mend Gear”; `Daily Quests` → “Small Jobs”; `Weekly Quest` → “Long Account”; `Checkpoint` → “Safe Mark”; `Exit` → “Window”; `Evidence` → “Trace”; `Settings` → “Backroom Rules”; `Friends` → “Known Faces”.

**New Game hook cards:** “A rain-slick route is worth more than a loud promise.” “Choose the crew that will remember your name.” “Every locked door has a public side.” “The first score is small; the consequence is not.” “Morrowglass counts footsteps.” “A clean exit is something you build.” “Someone has hidden a receipt inside your old life.” “The watch is looking for a story, not just a culprit.” “Take the job, refuse it, or write the reason down.” “No legend survives a missing ledger.”

## 12) Failures + John’s calls

| Call | Clone risk and avoidance |
|---|---|
| 1 | If success is only a loud vault break, the world becomes a familiar crime-action clone; jobs therefore reward route reading, witness care, fair shares, and exit discipline. |
| 2 | If the crew is a set of interchangeable criminals, it feels derivative; each kit has a distinct civic trade, taboo, and noncombat value. |
| 3 | If heat is merely a wanted-star ornament, it lacks identity; heat records evidence type, neighborhood trust, and which exits remain available. |
| 4 | If NPCs are disposable quest mouths, the city loses its promise; ten durable NPCs retain authored talk trees and react to divergence records. |
| 5 | Speculative default: the seven-receipt job is the first large instance; validate its pacing with a 2-player and 5-player test before adding any larger combat scale. |

## Integrity checklist

1. `worldId` is the stable snake_case ID `crew_score`.
2. Display name is Crew Score.
3. Rules module is `heat_wanted`.
4. Genre is an original heist drama.
5. The genre ban-list contains more than 40 forbidden lookalikes.
6. No forbidden franchise name is used as canon content.
7. No dump-error title is used.
8. No live service, source, save, or database is referenced.
9. Four starting zones are present.
10. Each start has a non-capital hub.
11. The graph includes `crosswire_square` and two capitals.
12. Street and indoor map semantics are stated.
13. Ten durable NPCs have IDs and roles.
14. Each NPC has premade dialogue fields.
15. Four identity kits have stakes and flags.
16. The primary start has 18 quest beats.
17. Quest objectives use code-owned verbs.
18. Quest rewards are numeric.
19. A soloable five-room five-man equivalent is described before encounters.
20. A three-phase big instance is described.
21. Progression contains 12 nodes with costs and requirements.
22. Economy separates gold and cosmetic currency.
23. Premium cannot buy power, catches, outcomes, or clears.
24. UI labels and ten opening hooks are included.
25. Clone-risk calls and a speculative decision are included.

No external references were used; this is an original quarantined content pack.
