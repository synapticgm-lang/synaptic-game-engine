# WOF World Pack: Isekai Gate

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `isekai_gate` |
| Display name | Isekai Gate |
| One-line pitch | Stranded travelers climb a layered realm whose rules can be negotiated, but never ignored. |
| Maturity | Teen |
| `rulesModuleId` | `hp_check_floor_flags` |
| Theme Kit | `threshold_lacquer` |
| Genre pattern and fence | Trapped-world progression fantasy with authored floor contracts; **this is not a licensed trapped-game franchise, not a death-game imitation, and not a copy of any existing virtual-world plot.** |

### Ban-list

The following genre-specific names, motifs, and lookalikes are prohibited in content: Aincrad, NerveGear, Kirito, Asuna, Kayaba, Sword Art Online, The System, Log Horizon, Elder Tale, Accel World, Overlord, Solo Leveling, Sung Jin-Woo, SAO, Alfheim, Yggdrasil, Nazarick, Swordland, Beater, Laughing Coffin, floor-clearing death timer, red-player guild, dual-wield prodigy, black-coat swordsman, floating castle, VR headset, headset coma, real-world hospital reveal, trapped MMO, game-master murder plot, numbered safe-zone tower, familiar anime guild emblems, franchise monster mascots, Poké Ball, Pokémon, Palworld, Warcraft, Azeroth, Tolkien, Mordor, Harry Potter, Hogwarts, Genshin, Teyvat, Warhammer, Tamriel, Dungeons & Dragons, Final Fantasy, Star Wars, Naruto, One Piece, My Hero Academia, Vampire: The Masquerade, Call of Cthulhu, Baldur’s Gate, Faerûn, Beholder, Stormwind, Orgrimmar.

All cultures, places, creatures, contracts, and chrome in this file are original. The title is a working-world label, not a reference to any licensed property.

## 1) Rules module: `hp_check_floor_flags`

The deterministic ledger owns current and maximum HP, stamina, armor class, threat state, floor number, layer flags, contract status, checkpoint ID, room completion, quest objectives, item quantities, gold, cosmetic tokens, personal loot rolls, weekly boss lockout, and divergence records. Prose may describe sensation and consequence only after these fields commit.

| Rule | Resolution |
|---|---|
| Party | 1–5 players; solo scaling applies to encounters, not rewards. |
| Combat | Lockstep rounds; code resolves attack, damage, defense, defeat, and revive windows. |
| Wipe | Party returns to the latest attuned checkpoint; room completion remains only when the checkpoint says so. |
| Safe hub | No combat; inventory, repairs, contracts, and party formation are available. |
| Instance death | A defeated character loses no equipped item; unbanked floor finds are forfeited, and the party returns to checkpoint. |
| Boss lockout | One clear per character per weekly boss; re-entry is allowed for practice without clear credit. |
| Floor clear | Requires the ledger contract, all required seals, and the clear boss result. Narrative cannot declare a clear. |

Prose is forbidden to invent damage numbers, loot drops, catch or bond success, floor clears, contract completion, match scores, or item quantities. LLM narration begins only after state commit.

### Diegetic chrome templates

```text
[WAYMARK] Floor {floorNo} · {placeName} · Threat: {threatState} · Attuned: {checkpointName}
[CONTRACT] {contractTitle} · Objective {current}/{required} · Reward: {rewardGold} gold / {rewardXp} insight
[HP] {actorName}: {hpCurrent}/{hpMax} · Guard {guardValue} · Status: {statusList}
[SEAL LOG] {sealName}: {sealState} · Route condition: {conditionText}
[RETURN WINDOW] Party defeat recorded. Return to {checkpointName}? Lost unbanked finds: {lostCount}.
[DEEP MAP] Floor {floorNo} outline revealed: {revealedCount}/{totalCount} places visited.
```

## 2) Identity kits

The four kits are original traveler adaptations, not licensed classes or races. Any human appearance is a player-facing origin choice rather than a species taxonomy.

| Kit ID | Look and values | Taboo / speech tell | Starter clothes / weapon | Start and first quest | Ability flag | Originality note |
|---|---|---|---|---|---|---|
| `waymark_scribe` | Ink-stained gloves, high insight, modest HP; records routes. | Never falsifies a map; says “mark that twice.” | Slate vest, brass stylus, short staff. | `underbridge_waymark`; `ask_the_floor_a_question`. | `route_annotation` | An explorer-scholar kit built around cartography, not a spellbook archetype. |
| `threshold_guard` | Padded coat, high HP and guard, low insight. | Will not abandon a sealed door; says “line holds.” | Riveted coat, buckler, hook-spear. | `underbridge_waymark`; `hold_the_first_line`. | `brace_gate` | A defensive contract-worker kit, not a famous black-clad swordsman. |
| `echo_listener` | Copper ear-cuff, balanced HP, detects rule changes. | Cannot interrupt a warning; repeats the last key word. | Layered scarf, tuning fork, crescent knife. | `underbridge_waymark`; `hear_the_wrong_note`. | `audit_echo` | A sensory investigator with no borrowed power fantasy. |
| `salvage_courier` | Bright pack straps, high stamina, low armor. | Must return borrowed goods; says “receipt first.” | Weatherproof smock, sling, prybar. | `underbridge_waymark`; `retrieve_the_red_tag`. | `quick_cache` | A logistics survivor, not a chosen-one replica. |

## 3) Map and places

The realm is a vertical chain of eight named floors. Each floor has a safe hub and instanced combat doors. The primary full start is Floor 1, `underbridge_basin`; the other three starts are alternate arrival points unlocked after the first contract and are also safe hubs for replay.

### Full travel graph

`underbridge_basin` → `bellwether_steps` → `moss_archive` → `brass_causeway` → `hushmarket` → `skyroot_terrace` → `nightglass_reach` → `crownless_apex`; every transition requires the preceding floor clear contract. `gatehouse_four` is a lateral arrival hub connected to `underbridge_basin`; `threadbare_infirmary` is connected to `bellwether_steps`; `switchyard_of_rain` is connected to `brass_causeway`. No teleportation exists. Travel is by signed lifts, stairwells, and contract-approved bridges.

| Start or hub | Zone ID | POIs (each is a place or instance door) |
|---|---|---|
| Underbridge Basin | `underbridge_basin` | `arrival_arch`, `dripline_lane`, `quiet_lift`, `chalk_reservoir`, `three_nail_market`, `sump_garden`, `first_seal_door`, `basin_checkpoint` |
| Gatehouse Four | `gatehouse_four` | `fourth_arch`, `rope_gallery`, `lost_property_window`, `west_buttress`, `gatehouse_checkpoint`, `sealed_roster_room` |
| Threadbare Infirmary | `threadbare_infirmary` | `cot_row`, `herb_drying_walk`, `suture_bell`, `infirmary_checkpoint`, `quiet_stair`, `recovery_door` |
| Switchyard of Rain | `switchyard_of_rain` | `rain_switch`, `cable_bridge`, `drainage_steps`, `signal_cage`, `switchyard_checkpoint`, `lower_relay_door` |
| Floor 1 merge hub | `bellwether_steps` | `seven_bells`, `contract_hall`, `brass_lift`, `traveler_court`, `steps_checkpoint`, `floor_two_door` |
| Floor 2 | `moss_archive` | `index_walk`, `green stacks`, `inkwell cistern`, `archive checkpoint`, `rooted door` |
| Floor 3 | `brass_causeway` | `causeway span`, `hinge village`, `rain switch`, `causeway checkpoint`, `third seal door` |
| Floor 4 | `hushmarket` | `silent stalls`, `receipt court`, `lantern vault`, `market checkpoint`, `fifth lift` |
| Floor 5 | `skyroot_terrace` | `root balconies`, `wind orchard`, `terrace checkpoint`, `cloudwell`, `sixth seal door` |
| Floor 6 | `nightglass_reach` | `black windows`, `mirror quay`, `reach checkpoint`, `starless stairs`, `seventh seal door` |
| Floor 7 | `crownless_apex` | `crownless forum`, `last lift`, `apex checkpoint`, `empty throne`, `eighth seal door` |
| Floor 8 | `open_return` | `return vestibule`, `witness bridge`, `homeward gate`, `ledger dais`, `departure checkpoint` |

### Floor and layer index

| Floor | Display name | Layer flag | Local problem | Clear boss |
|---|---|---|---|---|
| 1 | Underbridge Basin | `flooded_threshold` | Missing arrival tags and predatory rule-moths disrupt new travelers. | `the_bellwether_ox` |
| 2 | Moss Archive | `remembering_moss` | Living shelves rewrite route memories. | `the_index_widow` |
| 3 | Brass Causeway | `hinge_weather` | Bridges change direction when promises are broken. | `the_turning_span` |
| 4 | Hushmarket | `silent_bargain` | Spoken names become tradable obligations. | `the_debt_collector` |
| 5 | Skyroot Terrace | `updraft_bloom` | Gardens grow routes that lead to unwanted places. | `the_pruner_king` |
| 6 | Nightglass Reach | `reflected_sky` | Reflections act before their owners. | `the_second_self` |
| 7 | Crownless Apex | `vacant_authority` | Every visitor is offered a false crown and a different exit. | `the_uncrowned_voice` |
| 8 | Open Return | `unwritten_departure` | The return gate requires a truthful account of the climb. | `the_gate_witness` |

Map presentation uses visited pins and an outline silhouette for unvisited places. Street places use pins; indoor places use a floor plan. A shop never displays kilometer-scale chrome. Instance doors are place IDs and cannot be entered without a valid party state.

## 4) Durable NPCs

### Floor 1 durable NPC roster

| ID | Name | Place | Role |
|---|---|---|---|
| `npc_vesra_quill` | Vesra Quill | `arrival_arch` | quest, local |
| `npc_orn_barrow` | Orn Barrow | `three_nail_market` | merchant, hub |
| `npc_lio_thread` | Lio Thread | `sump_garden` | profession, quest |
| `npc_mara_vell` | Mara Vell | `basin_checkpoint` | hub, quest |
| `npc_cairn_jo` | Cairn Jo | `chalk_reservoir` | quest, local |
| `npc_pell_orbit` | Pell Orbit | `quiet_lift` | quest, local |

For each NPC, the following compact talk tree is canonical and copy-pasteable.

| NPC | `greet` | `quest_offer` | `quest_progress` | `quest_turnin` | `gossip` (three lines) | `refusal/player-rude` |
|---|---|---|---|---|---|---|
| Vesra Quill | “You arrived without a tag. Breathe, then look at the chalk.” | “Bring me three red arrival tags from the dripline.” | “The tags are warm? Then the floor noticed you.” | “Filed. Your name now has a place to stand.” | “The bells count promises.” / “Do not sleep beside a lift.” / “The basin remembers footsteps.” | “Insults do not become evidence. Return when you can speak plainly.” |
| Orn Barrow | “Market rule: inspect before purchase.” | “Collect two brass washers from the sump pumps.” | “I need both washers, not a story about them.” | “Fair count. Take your receipt and keep it dry.” | “I sell repairs, not miracles.” / “Gold opens stalls, not sealed floors.” / “Cosmetic tokens cannot buy a stronger blade.” | “Rudeness ends the sale for today.” |
| Lio Thread | “The moss is growing against the water.” | “Gather four blue reed fibers from the sump garden.” | “The fibers should hum when pinched.” | “Good weave. This strap will not slip at the first bell.” | “Every floor has a craft.” / “A clean knot is a small promise.” / “Do not harvest the silver reeds.” | “I will not teach hands that break living beds.” |
| Mara Vell | “Checkpoint attunement is a choice, not a sentence.” | “Visit the three-nail market and return with its public price slate.” | “The slate tells us whether the market is honest.” | “You read the room before the room read you.” | “Practice doors do not consume a weekly clear.” / “A party is a promise to share alarms.” / “The lift dislikes panic.” | “Calm down or leave the checkpoint.” |
| Cairn Jo | “The chalk reservoir is missing a circle.” | “Visit the reservoir and collect one intact chalk spool.” | “The spool must be unbroken.” | “That circle will hold until the next rain.” | “Rule-moths hate clean edges.” / “The old marks are not decoration.” / “I sleep with one eye on the floor.” | “I answer useful questions, not taunts.” |
| Pell Orbit | “The lift has four moods and none are patient.” | “Talk to the lift bell, then deliver its copper note to Vesra.” | “Did it ring once or twice?” | “A double ring means the upper stair is listening.” | “Never ride alone after dusk.” / “The third step is loose.” / “I prefer stairs with witnesses.” | “No passage while you are shouting.” |

### Hub emotes, ten lines

1. “Chalk is available by the blue basin.” 2. “Party forming for the first seal door.” 3. “Repairs at the three-nail market.” 4. “Please keep the checkpoint clear.” 5. “A bell rang on the upper stair.” 6. “Practice entry is open; clear credit is not.” 7. “Found tag posted at the arrival arch.” 8. “The lift is waiting for a signed route.” 9. “Quiet route to the infirmary.” 10. “Visitors: read the floor notice before leaving.”

## 5) Premade choices and first hour

Each kit begins with five authored beats: `arrival_shock` (choose whether to hide, call out, or inspect; stake: losing the only visible route marker), `first_witness` (select Vesra, Mara, or the lift bell as first witness; stake: who records the first divergence), `tag_decision` (return, barter, or conceal the tag; stake: market access), `rule_moth_encounter` (brace, distract, or retreat; stake: one item may be damaged), and `checkpoint_vow` (attune, delay, or ask for a witness; stake: where defeat returns the party). These write `identity_confirmed`, `first_choice`, and `observed_consequence`.

| POI | Grounded choice buttons |
|---|---|
| `arrival_arch` | Inspect chalk; talk to Vesra; collect red tag; visit market; mark route; leave by basin path. |
| `dripline_lane` | Search tag hook; walk quietly; call for help; follow warm trace; return to arch; record footprint. |
| `three_nail_market` | Compare price slate; buy bandage; repair weapon; ask Orn; deliver washer; decline sale. |
| `chalk_reservoir` | Collect spool; redraw circle; talk to Cairn; inspect water; leave intact mark; report damage. |
| `sump_garden` | Collect blue fiber; ask Lio; water bed; avoid silver reeds; bind strap; return to checkpoint. |
| `quiet_lift` | Talk to Pell; ring once; ring twice; inspect cable; wait for witness; return downstairs. |

The forced tutorial path is `arrival_arch` → `dripline_lane` → `three_nail_market` → `chalk_reservoir` → `sump_garden` → `basin_checkpoint` → `first_seal_door`; it is skippable on alternate characters after one completion. Retry fingerprints are: retrieve-tag/quiet-search/warm-hook/moth ambush/damaged tag; repair-circle/careful inspection/missing chalk/false boundary/route delay; earn-market-trust/price comparison/hidden washer/receipt dispute/limited purchase; hear-lift-note/patient listening/double ring/upper stair response/new route; protect-fiber/garden tending/silver reed temptation/plant alarm/clean strap; attune-checkpoint/ask witness/uncertain return/party disagreement/vow recorded; escort-newcomer/slow route/false bell/lost companion/arrival logged; open-seal-door/read contract/missing three tags/conditional lock/contract accepted.

## 6) Quests: code-completeable DAG

### Primary start: Floor 1, 18 authored beats

| ID | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---:|---|---|---:|---:|
| `ask_the_floor_a_question` | Ask the Floor a Question | identity | false | `mark_your_arrival` | `visit_place:arrival_arch`; `talk_to_npc:npc_vesra_quill` | 8 | 40 |
| `mark_your_arrival` | Mark Your Arrival | identity | false | `hold_the_first_line` | `collect_item:red_arrival_tag:3`; `visit_place:dripline_lane` | 15 | 65 |
| `hold_the_first_line` | Hold the First Line | identity | false | `hear_the_wrong_note` | `ledger_kill:rule_moth:2`; `visit_place:chalk_reservoir` | 18 | 80 |
| `hear_the_wrong_note` | Hear the Wrong Note | identity | false | `retrieve_the_red_tag` | `talk_to_npc:npc_pell_orbit`; `visit_place:quiet_lift` | 12 | 55 |
| `retrieve_the_red_tag` | Retrieve the Red Tag | identity | false | `attune_the_basin` | `collect_item:singed_arrival_tag:1`; `deliver_item:singed_arrival_tag:1` | 20 | 95 |
| `attune_the_basin` | Attune the Basin | identity | false | `read_the_floor_contract` | `talk_to_npc:npc_mara_vell`; `visit_place:basin_checkpoint` | 10 | 45 |
| `learn_the_clean_knot` | Learn the Clean Knot | profession | false | `weave_a_route_strap` | `talk_to_npc:npc_lio_thread`; `collect_item:blue_reed_fiber:4` | 14 | 60 |
| `weave_a_route_strap` | Weave a Route Strap | profession | false | `price_the_road` | `deliver_item:route_strap:1`; `talk_to_npc:npc_lio_thread` | 22 | 90 |
| `price_the_road` | Price the Road | profession | false | `repair_before_risk` | `visit_place:three_nail_market`; `talk_to_npc:npc_orn_barrow` | 12 | 50 |
| `repair_before_risk` | Repair Before Risk | profession | false | `read_the_floor_contract` | `collect_item:brass_washer:2`; `deliver_item:brass_washer:2` | 24 | 100 |
| `read_the_floor_contract` | Read the Floor Contract | zone_story | false | `seal_the_dripline` | `visit_place:first_seal_door`; `talk_to_npc:npc_mara_vell` | 18 | 75 |
| `seal_the_dripline` | Seal the Dripline | zone_story | false | `quiet_the_reservoir` | `ledger_kill:rule_moth:5`; `collect_item:chalk_spool:1` | 35 | 140 |
| `quiet_the_reservoir` | Quiet the Reservoir | zone_story | false | `escort_the_unlisted` | `visit_place:chalk_reservoir`; `deliver_item:intact_chalk_spool:1` | 28 | 110 |
| `escort_the_unlisted` | Escort the Unlisted | side | false | `take_the_bellwether_contract` | `talk_to_npc:npc_vesra_quill`; `visit_place:arrival_arch`; `talk_to_npc:npc_mara_vell` | 30 | 125 |
| `take_the_bellwether_contract` | Take the Bellwether Contract | dungeon | false | `enter_first_seal` | `visit_place:first_seal_door`; `talk_to_npc:npc_mara_vell` | 20 | 80 |
| `enter_first_seal` | Enter the First Seal | zone_story | false | `face_the_bellwether` | `visit_place:first_seal_door`; `collect_item:basin_seal_shard:3` | 45 | 180 |
| `face_the_bellwether` | Face the Bellwether | zone_story | false | `open_the_upper_stair` | `ledger_kill:bellwether_ox:1`; `visit_place:basin_checkpoint` | 90 | 350 |
| `open_the_upper_stair` | Open the Upper Stair | campaign | false | `step_into_bellwether` | `deliver_item:bellwether_key:1`; `visit_place:bellwether_steps` | 70 | 260 |

The six quests `ask_the_floor_a_question`, `hold_the_first_line`, `hear_the_wrong_note`, `learn_the_clean_knot`, `read_the_floor_contract`, and `open_the_upper_stair` are kit-specific first-hour variants when selected. A capped daily, `count_three_safe_returns`, requires `visit_place:basin_checkpoint:3`, pays 12 gold and 30 XP, maximum once per character per day.

### Alternate-start quest sets

Each alternate start has eighteen distinct beats with code objectives, using the same reward schema: `gatehouse_roster` (identity), `rope_gallery_repair` (profession), `west_buttress_watch` (zone), `lost_property_return` (side), `seal_roster_door` (dungeon), `gatehouse_to_basin` (campaign), plus twelve authored follow-ons: `count_the_arches`, `dry_the_rope`, `question_the_clerk`, `find_the_fourth_stamp`, `protect_the_roster`, `measure_the_buttress`, `recover_a_gate_token`, `escort_a_late_arrival`, `attune_gatehouse`, `open_the_lateral_lift`, `report_to_mara`, `walk_to_bellwether`, `gatehouse_daily_watch`, `gatehouse_hidden_trust`, `gatehouse_contract_review`, `gatehouse_practice_door`, `gatehouse_clearance`, `gatehouse_merge`. Their objectives respectively use `visit_place:fourth_arch`, `collect_item:dry_rope:3`, `talk_to_npc:npc_gatehouse_clerk`, `collect_item:fourth_stamp:1`, `ledger_kill:roster_wisp:4`, `visit_place:west_buttress`, `collect_item:gate_token:1`, `talk_to_npc:npc_late_arrival`, `visit_place:gatehouse_checkpoint`, `deliver_item:gate_token:1`, `talk_to_npc:npc_mara_vell`, `visit_place:bellwether_steps`, and corresponding place, talk, collect, deliver, and ledger objectives; rewards range from 10–85 gold and 40–320 XP.

Threadbare Infirmary uses eighteen beats centered on `cot_row`, recovery tags, herb fibers, and the local threat of `fever_motes`; Switchyard of Rain uses eighteen beats centered on `rain_switch`, cable seals, copper notes, and `hinge_sparks`. Each set contains 4 identity, 5 profession, 5 local-story, 3 side/dungeon, and 1 merge beat, with every objective limited to `visit_place`, `ledger_kill`, `deliver_item`, `talk_to_npc`, or `collect_item`; rewards are 10–90 gold and 35–340 XP.

### Campaign spine after Floor 1

`step_into_bellwether` → `read_moss_index` → `recover_memory_folio` → `defeat_index_widow` → `cross_the_brass_causeway` → `repair_hinge_contract` → `defeat_turning_span` → `pay_no_name` → `break_the_debt_mark` → `defeat_debt_collector` → `plant_the_skyroot_route` → `defeat_pruner_king` → `name_the_reflection` → `defeat_second_self` → `refuse_the_false_crown` → `defeat_uncrowned_voice` → `speak_the_true_departure` → `open_homeward_gate`. Rewards are 80–220 gold and 300–900 XP, with floor flags committed at each clear boss.

Walk-away choices write, rather than erase, divergence records: `divergence_hidden_tag` (concealment changes market prices), `divergence_unwitnessed_vow` (checkpoint requires a later witness), and `divergence_shared_route` (an escorted newcomer unlocks a safer side door). Each record has `recordId`, `sourceQuestId`, `choice`, and `consequenceFlag`.

## 7) Species, opponents, and collectibles

All creatures are original combat skins. Base values are ledger data, not prose claims.

| Species ID | Name | Rarity | Habitat | HP | Atk | AC |
|---|---|---|---|---:|---:|---:|
| `rule_moth` | Rule-moth | common | dripline | 24 | 6 | 10 |
| `chalk_skitter` | Chalk skitter | common | reservoir | 30 | 7 | 11 |
| `sump_hopper` | Sump hopper | common | garden | 36 | 8 | 12 |
| `brass_nibbler` | Brass nibbler | common | market | 42 | 9 | 13 |
| `tag_leech` | Tag leech | uncommon | arrival arch | 48 | 11 | 13 |
| `bellwing` | Bellwing | uncommon | quiet lift | 54 | 12 | 14 |
| `mossback crawler` | Mossback crawler | uncommon | lower stair | 68 | 14 | 15 |
| `inkjaw` | Inkjaw | rare | sealed door | 82 | 17 | 16 |
| `hinge crab` | Hinge crab | rare | brass route | 94 | 19 | 17 |
| `fever mote` | Fever mote | uncommon | infirmary | 40 | 10 | 12 |
| `roster wisp` | Roster wisp | rare | gatehouse | 76 | 18 | 16 |
| `rain spark` | Rain spark | uncommon | switchyard | 52 | 13 | 14 |
| `bellwether ox` | Bellwether Ox | epic | first seal | 420 | 28 | 19 |
| `index widow` | Index Widow | epic | moss archive | 510 | 32 | 20 |
| `turning span` | Turning Span | epic | brass causeway | 580 | 35 | 21 |
| `debt_collector` | Debt Collector | epic | hushmarket | 640 | 38 | 21 |
| `pruner_king` | Pruner King | epic | skyroot | 720 | 42 | 22 |
| `second_self` | Second Self | epic | nightglass | 800 | 45 | 23 |
| `uncrowned_voice` | Uncrowned Voice | epic | apex | 900 | 50 | 24 |
| `gate_witness` | Gate Witness | epic | return vestibule | 1000 | 54 | 25 |

Collectibles include `red_arrival_tag`, `singed_arrival_tag`, `blue_reed_fiber`, `route_strap`, `brass_washer`, `chalk_spool`, `basin_seal_shard`, `bellwether_key`, `memory_folio`, `hinge_pin`, `name_receipt`, and `true_departure_leaf`. None is a franchise analogue or a creature-capture tool.

## 8) Loot and economy

| Template | Examples | Source |
|---|---|---|
| Starter weapon | `hook_spear`, `slate_staff`, `crescent_knife`, `route_prybar` | kit chest |
| Starter armor | `riveted_coat`, `slate_vest`, `echo_scarf`, `weatherproof_smock` | kit chest |
| Map item | `basin_route_sheet`, `gatehouse_roster_map` | Vesra / clerk |
| Profession output | `route_strap`, `chalk_seal`, `copper_note` | Lio, Cairn, Pell lines |
| Dungeon drop | `ox_bell_iron`, `moss_index_shard`, `hinge_pin`, `market_receipt` | personal room loot |
| Cosmetic | `lacquered_tag`, `bell-thread cape`, `rainline dye` | cosmetic token shop |

Personal loot tables: common enemies have a 45% chance for one crafting fiber or 2–6 gold; uncommon enemies have a 35% chance for a zone material and 6–12 gold; elites have a guaranteed zone material and a 20% chance for a cosmetic; bosses guarantee one contract material, one catalog item, and 25–50 gold, subject to weekly clear lockout. Practice clears award no boss-clear item.

Vendors sell repair kits for 8 gold, bandages for 5 gold, route paper for 3 gold, and cosmetic dyes for 20 cosmetic tokens. `repairCostPerPoint` is 1 gold. Gold faucets are quest rewards, enemy purses, and floor contracts; sinks are repairs, consumables, travel stamps, and recipe fees. Daily soft cap: 300 gold from repeatable activities. Cosmetic tokens come only from account milestones, curated achievements, and purchase; they never mix with gold and never buy power.

Collection log entries track each creature, boss, place, contract seal, recipe, and cosmetic variant with `collection_entry_id`, `first_seen`, and `cleared` fields.

## 9) Instances

### Soloable five-person equivalent: The First Seal Descent

This instance scales for 1–5 and has five rooms. Each room is described before its creature encounter.

| Room ID | Room description before creature | Encounter | Checkpoint / exit |
|---|---|---|---|
| `fsd_room_01_drip_gallery` | A low gallery crosses black water; red tags hang from dry hooks and one hook is moving. | `rule_moth` ×4 | Exit to `fsd_room_02_chalk_lung`; no checkpoint. |
| `fsd_room_02_chalk_lung` | Chalk ribs arch over a white basin, with three incomplete circles on the floor. | `chalk_skitter` ×3, `tag_leech` ×1 elite | Checkpoint `fsd_checkpoint_chalk`; exit to `fsd_room_03_washer_vault`. |
| `fsd_room_03_washer_vault` | Brass washers float in a still shaft while a cable hums behind a locked grate. | `brass_nibbler` ×5, `bellwing` ×1 | Exit to `fsd_room_04_bell_stair`. |
| `fsd_room_04_bell_stair` | A stair spirals around a silent bell; each landing bears a different route mark. | `sump_hopper` ×3, `inkjaw` ×1 elite | Exit to `fsd_room_05_bellwether_chamber`. |
| `fsd_room_05_bellwether_chamber` | The chamber is a round dry dock with a sealed door, a hanging bell, and fresh hoofprints around the seal. | `bellwether_ox` ×1 boss | Clear flag `floor_1_cleared`; exit `bellwether_steps`. |

### Big instance: The Eightfold Witness Rite

A ten-person MMO-combat skin, also playable as a private five-person challenge with adjusted health. Phase 1, `witness_stalls`, has rooms `rite_arrival`, `four_seal_gallery`, and `unclaimed_roster`, featuring rule-moth swarms, roster wisps, and the `gate_witness` herald. Phase 2, `borrowed_routes`, has `hinge_bridge`, `moss_memory`, and `false_departure`, featuring index widows and turning spans. Phase 3, `truth_dais`, has `crownless_forum`, `ledger_dais`, and `homeward_gate`, ending with the `gate_witness` boss. The instance grants a cosmetic title and a lore seal; it does not bypass floor progression.

## 10) Progression

No node is pay-to-unlock. Costs are gold or earned insight only.

| Node ID | Cost | Requires | Effect flags |
|---|---:|---|---|
| `route_handwriting` | 20 insight | — | `map_pin_precision_1` |
| `steady_breath` | 25 insight | — | `stamina_recovery_1` |
| `brace_gate` | 30 insight | `steady_breath` | `guard_window_1` |
| `quick_cache` | 30 insight | `route_handwriting` | `inventory_slot_1` |
| `audit_echo` | 35 insight | `route_handwriting` | `layer_warning_1` |
| `clean_contract` | 40 insight | `audit_echo` | `contract_read_speed_1` |
| `seal_mending` | 45 insight | `clean_contract` | `checkpoint_repair_1` |
| `market_receipt` | 50 insight | `quick_cache` | `vendor_discount_cosmetic_1` |
| `witness_call` | 55 insight | `brace_gate` | `revive_window_1` |
| `moss_resistance` | 65 insight | `layer_warning_1` | `floor_2_resist_1` |
| `hinge_step` | 75 insight | `witness_call` | `bridge_choice_1` |
| `truthful_departure` | 100 insight | `seal_mending`, `hinge_step` | `return_contract_eligible` |

Five capped contracts are `three_safe_returns` (daily, 12 gold), `tag_audit` (daily, 18 gold), `seal_practice` (daily, 20 XP), `floor_memory_review` (weekly, 60 gold), and `witness_rite` (weekly, cosmetic token bundle). None grants an uncapped power advantage.

## 11) Theme Kit and copy

`threshold_lacquer` uses deep ink, rain-brass, chalk white, basin blue, and warning vermilion. Materials are lacquered wood, worn brass, slate, damp rope, and translucent vellum. Dice are weighty slate with brass pips. The voice is intimate, alert, and practical: wonder appears in measured details, never in shouted exposition. Ambient loop: distant lift cables, one irregular bell, water under stone, and a soft paper scrape. Default fashion is layered travelwear with clip-on tags, reinforced hems, and personal route marks.

### Player-facing labels

| UI context | Label |
|---|---|
| Inventory | `Pack & Provenance` |
| Journal | `Open Contracts` |
| Map | `Waymarks` |
| Party | `Travel Companions` |
| Character | `Traveler Ledger` |
| Skills | `Practiced Lines` |
| Checkpoint | `Attune Waymark` |
| Instance entry | `Cross the Door` |
| Boss result | `Seal Record` |
| Loot | `Personal Finds` |
| Vendor | `Three-Nail Counter` |
| Repair | `Mend Equipment` |
| Floor status | `Layer Reading` |
| Quest complete | `Contract Witnessed` |
| Defeat | `Return to Waymark` |
| Settings | `Chrome & Access` |
| Cosmetics | `Route Finery` |
| Friends | `Known Travelers` |
| Exit floor | `Request Passage` |
| Clear history | `Witness Ledger` |

### New Game card hooks

1. “You wake beneath a bridge that was never built.”
2. “Your first map is written by a bell.”
3. “A red tag says you belong here; the floor disagrees.”
4. “The safest door is the one that admits it is locked.”
5. “Four lifts rise, but only one remembers your name.”
6. “A market receipt may be more valuable than a weapon.”
7. “The path home begins with a promise to a stranger.”
8. “Every floor keeps one mistake for you.”
9. “The bellwether is not guarding the exit; it is testing the question.”
10. “Climb carefully: the realm changes when you do.”

## 12) Failures and John’s calls

| Risk call | Clone risk and avoidance |
|---|---|
| `clone_risk_trapped_game` | Avoided by using a contract-and-witness cosmology, not a game-master murder premise or headset premise. |
| `clone_risk_numbered_tower` | Floors are distinct civic ecologies with lateral hubs and local obligations, not interchangeable tower levels. |
| `clone_risk_chosen_swordsman` | Four practical traveler kits share authorship of the route; no singular prodigy is canon. |
| `clone_risk_guild_bank` | Use a public contract hall and personal ledgers; there is no guild bank or guild power economy. |
| `clone_risk_death_currency` | Defeat returns the party to a checkpoint and forfeits only unbanked finds; no permanent character death or paid retry. |

Open decisions: **none blocking**. Speculative defaults are the alternate starts and the optional five-person challenge mode for the ten-person rite; both are isolated behind flags and do not alter the primary Floor 1 campaign.

## Integrity checklist

1. `worldId` is stable snake_case.  
2. Display name is Isekai Gate.  
3. Rules module is explicitly code-owned.  
4. HP and floor flags are ledger fields.  
5. Wipe and checkpoint behavior is explicit.  
6. Safe-hub behavior is explicit.  
7. Instance-death behavior is explicit.  
8. Weekly boss lockout is explicit.  
9. Prose cannot invent damage or loot.  
10. Four playable kits are original.  
11. Four starts or equivalent hubs exist.  
12. Floors 1–8 are named.  
13. Floor 1 has full map depth.  
14. A mid-world merge exists.  
15. Six durable Floor 1 NPCs have IDs.  
16. Each durable NPC has canned talk.  
17. Hub emotes are canned.  
18. Opening choices include stakes.  
19. HookArc flags are defined.  
20. Primary start has 18 code-completeable beats.  
21. Quest objectives use only allowed objective verbs.  
22. Rewards are numeric.  
23. Campaign spine has 18 beats.  
24. Divergence records are explicit.  
25. Species have numeric HP, attack, and AC.  
26. Collectibles have stable IDs.  
27. Economy separates gold and cosmetic tokens.  
28. Personal loot is stated.  
29. Repair cost is numeric.  
30. Daily and weekly caps are stated.  
31. Five-room soloable five-person equivalent exists.  
32. Every room is described before its encounter.  
33. Big instance has three phases.  
34. Progression has 12 nodes.  
35. No node is pay-to-unlock.  
36. Five capped contracts exist.  
37. Twenty skinned UI labels exist.  
38. Ten opening hooks exist.  
39. Ban-list exceeds 40 entries.  
40. Forbidden franchise names are confined to the explicit ban-list and fence language, never used as canon content.  
41. No dump-error title is used as canon.  
42. No live-service or source references are included.  
43. No placeholder or TBD language appears.  
44. No production app code is included.  
45. All cultures, places, creatures, and artifacts are original.  
