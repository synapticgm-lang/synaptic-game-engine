# Route Lantern — World Pack

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `route_lantern` |
| Display name | Route Lantern |
| Pitch | A gentle journey of chosen family where honest invitations, repaired promises, and shared destinations turn travel into belonging. |
| Maturity | all-ages; Kid Mode enabled: crushes are allowed, with no sexual content, substances, gambling, or graphic violence. |
| `rulesModuleId` | `bond_heart` |
| Theme Kit | `wayfarer_glow` |
| Genre fence | Original romance/found-family road narrative with light social puzzles; **this is not a licensed dating simulator, visual novel, or copy of any named franchise.** |

**Ban-list (genre-specific, 44 entries):** `dream_date`, `heart_garden`, `love_interest`, `dating_sim`, `dating_route`, `romance_points`, `affection_meter`, `school_romance`, `beach_episode`, `festival_confession`, `childhood_friend`, `tsundere`, `harem`, `reverse_harem`, `otome`, `isekai`, `guild`, `chosen_one`, `soulmate_mark`, `fated_pair`, `love_triangle`, `secret_royal`, `amnesia_prince`, `vampire_beloved`, `werewolf_mate`, `fae_court`, `moon_princess`, `destiny_ring`, `promise_ring`, `red_string`, `love_letter`, `rose_ballroom`, `masquerade_date`, `starlit_rooftop`, `summer_camp`, `wedding_ending`, `adult_content`, `sexual_content`, `explicit_scene`, `licensed_idol`, `licensed_school`, `licensed_city`, `licensed_character`, `licensed_slogan`, `franchise_crossover`.

All peoples, places, items, slogans, plots, and characters below are original. **Speculative defaults** are marked where a future production decision could change presentation, not state rules.

## 1) Rules module: `bond_heart`

The ledger owns `heart`, `trust`, `comfort`, `promise`, `route_flags`, `conversation_tags`, `inventory`, `gold`, `cosmetic_tokens`, `visited_places`, `quest_state`, `instance_checkpoint`, and `divergence_records`. Heart is a shared party resource from 0–100; trust is per durable NPC from 0–5; comfort is a temporary 0–3 buffer used by travel scenes; promise is a boolean or dated commitment. Prose never creates a reward, changes trust, resolves a disagreement, or declares an ending without a committed ledger event.

| Rule | Deterministic behavior |
|---|---|
| Failure | A social puzzle failure reduces comfort by 1 or marks a retry fingerprint; it never deletes a character. |
| Checkpoint | Every instance room and every completed objective writes a checkpoint. Retry resumes at the latest checkpoint. |
| Lockout | The weekly `big_night_waylight` has one completion per character per week; ordinary dates and errands have no lockout. |
| Party | 1–5 players; private co-op is the default. Nearby presence displays only `nearbyPlayerCount` and selected race/kit labels. |
| Rewards | Personal loot and numeric gold/XP; cosmetics are never power. Two wallets never mix. |

**Forbidden for prose to invent:** affection totals, damage, item ownership, quest completion, secret route access, a promise, a breakup, or a final pairing. The journal reports visible state honestly; hidden quests may exist, but hidden state is not shown as a false visible objective.

### Diegetic chrome templates

```text
[WAYLIGHT] Route confirmed: {placeName} → {destinationName}. Distance bands: {bands}.
[HEART HUD] {characterName} | Trust {trust}/5 | Heart {heart}/100 | Promise: {promiseState}.
[INVITATION] {fromName} asks: “{question}” Choices: {choiceA} / {choiceB} / {choiceC}.
[TRAVEL NOTE] Weather: {weather}. Comfort {comfort}/3. Next safe stop: {placeName}.
[MEMORY CARD] {flagName} recorded at {placeName}: “{shortRecord}”.
[CHECKPOINT] {roomId} secured. Retry begins here; committed rewards remain committed.
```

## 2) Identity kits

| `kitId` | Look and values | Taboo and speech tell | Clothes / starter item | Start / first quest / flag | Why original |
|---|---|---|---|---|---|
| `road_mender` | Patchwork coat, practical, values repair and patience. | Never discards a usable thing; says “Let’s give it one more honest try.” | Mended teal coat; `brass_wayfinder`. | `mossbridge`; `rl_mender_first_stitch`; `ability_patchwork_care`. | A repair-minded traveler, not a licensed hero archetype. |
| `bell_listener` | Layered scarf, attentive, values consent and clear signals. | Never interrupts a bell or person; repeats key words before answering. | Ochre scarf; `soft_tone_bell`. | `bellmarket`; `rl_listener_first_ring`; `ability_echo_reading`. | A sound-sensitive courier culture is wholly original. |
| `table_keeper` | Apron over travel clothes, hospitable, values fair portions. | Never lets a guest eat alone; uses careful food metaphors. | Green apron; `folding_travel_table`. | `copperrest`; `rl_keeper_first_place`; `ability_shared_meal`. | Hospitality is the kit’s mechanic, not a borrowed faction. |
| `map_singer` | Inked cuffs and bright boots, curious, values stories with sources. | Never claims a road they have not walked; sings place names in thirds. | Lilac boots; `route_chime`. | `reedturn`; `rl_singer_first_verse`; `ability_memory_chorus`. | A cartographic oral tradition, not a known bard class. |

## 3) Map / places: full graph

The four starting zones converge through `waycross_meadow` to `lantern_harbor` and `quiet_capital`; the second equivalent capital is `hearth_archive`. Travel is a route choice, not teleportation. Street places show pins; indoor places show a floor plan only. Unvisited places are outlines; visited places reveal names, exits, and safe-stop status. Instance doors are places.

| `placeId` | Public name | Zone | Scale / danger | Outdoor | Exits | NPCs | Dungeon/instance |
|---|---|---|---|---|---|---|---|
| `mossbridge` | Mossbridge | `mossbridge_zone` | street / safe | true | `mossbridge_lane`,`waycross_meadow` | `nella_reed`,`orin_patch` | — |
| `mossbridge_lane` | Stitchlane | `mossbridge_zone` | street / low | true | `mossbridge`,`old_weir` | `orin_patch`,`pip_wren` | — |
| `old_weir` | Old Weir | `mossbridge_zone` | street / low | true | `mossbridge_lane`,`mossbridge_house` | `tamsin_veil` | — |
| `mossbridge_house` | Bridge House | `mossbridge_zone` | dungeon / low | false | `old_weir`,`mossbridge` | `nella_reed` | `weir_of_return` |
| `mossbridge_green` | Green Underbridge | `mossbridge_zone` | street / safe | true | `mossbridge`,`mossbridge_lane` | `nella_reed`,`pip_wren` | — |
| `mossbridge_ferry` | Reed Ferry | `mossbridge_zone` | street / low | true | `mossbridge`,`waycross_meadow` | `tamsin_veil` | — |
| `bellmarket` | Bellmarket | `bellmarket_zone` | street / safe | true | `bellmarket_steps`,`waycross_meadow` | `mara_quill`,`siv_toll` | — |
| `bellmarket_steps` | Tuning Steps | `bellmarket_zone` | street / low | true | `bellmarket`,`bellmarket_roof` | `siv_toll`,`jo_rill` | — |
| `bellmarket_roof` | Copper Roofwalk | `bellmarket_zone` | street / low | true | `bellmarket_steps`,`bellmarket` | `jo_rill` | — |
| `bellmarket_booth` | Quiet Booths | `bellmarket_zone` | dungeon / low | false | `bellmarket`,`bellmarket_steps` | `mara_quill` | `weir_of_return` |
| `bellmarket_garden` | Hush Garden | `bellmarket_zone` | street / safe | true | `bellmarket`,`bellmarket_steps` | `siv_toll` | — |
| `bellmarket_gate` | North Chime Gate | `bellmarket_zone` | street / low | true | `bellmarket`,`waycross_meadow` | `mara_quill` | — |
| `copperrest` | Copperrest | `copperrest_zone` | street / safe | true | `copperrest_yard`,`waycross_meadow` | `bren_dallow`,`uma_fen` | — |
| `copperrest_yard` | Shared Yard | `copperrest_zone` | street / low | true | `copperrest`,`kiln_walk` | `uma_fen`,`revi_salt` | — |
| `kiln_walk` | Kiln Walk | `copperrest_zone` | street / low | true | `copperrest_yard`,`copperrest_cellar` | `revi_salt` | — |
| `copperrest_cellar` | Cellar of Echoes | `copperrest_zone` | dungeon / medium | false | `kiln_walk`,`copperrest` | `bren_dallow` | `weir_of_return` |
| `copperrest_oven` | Seven-Oven Court | `copperrest_zone` | street / safe | true | `copperrest`,`copperrest_yard` | `bren_dallow` | — |
| `copperrest_lane` | Copper Lane | `copperrest_zone` | street / low | true | `copperrest`,`waycross_meadow` | `uma_fen` | — |
| `reedturn` | Reedturn | `reedturn_zone` | street / safe | true | `reedturn_dock`,`waycross_meadow` | `elias_voss`,`pava_nim` | — |
| `reedturn_dock` | Turning Dock | `reedturn_zone` | street / low | true | `reedturn`,`reedturn_bend` | `pava_nim`,`len_orr` | — |
| `reedturn_bend` | Map-Bend | `reedturn_zone` | street / low | true | `reedturn_dock`,`reedturn_archive` | `len_orr` | — |
| `reedturn_archive` | Route Archive | `reedturn_zone` | dungeon / medium | false | `reedturn_bend`,`reedturn` | `elias_voss` | `weir_of_return` |
| `reedturn_ropewalk` | Ropewalk | `reedturn_zone` | street / safe | true | `reedturn`,`reedturn_dock` | `pava_nim` | — |
| `reedturn_lantern` | Low Lantern Hill | `reedturn_zone` | street / low | true | `reedturn`,`waycross_meadow` | `elias_voss` | — |
| `waycross_meadow` | Waycross Meadow | `mid_world` | street / safe | true | all four starts, `lantern_harbor`,`hearth_archive` | `sable_warden` | — |
| `lantern_harbor` | Lantern Harbor | `capital_east` | street / safe | true | `waycross_meadow`,`quiet_capital`,`waylight_stage` | `sable_warden`,`rue_candel` | — |
| `quiet_capital` | Quiet Capital | `capital_east` | street / safe | true | `lantern_harbor`,`hearth_archive` | `rue_candel`,`sable_warden` | — |
| `hearth_archive` | Hearth Archive | `capital_west` | street / safe | true | `waycross_meadow`,`quiet_capital`,`waylight_stage` | `sable_warden`,`rue_candel` | — |
| `waylight_stage` | Waylight Stage | `capital_east` | dungeon / medium | false | `lantern_harbor`,`hearth_archive` | `rue_candel` | `big_night_waylight` |

## 4) Durable NPCs and premade talk

The six primary durable NPCs are `nella_reed`, `mara_quill`, `bren_dallow`, `elias_voss`, `sable_warden`, and `rue_candel`; each has a fixed talk tree. Supporting named locals appear in the map and have authored one-line hub barks.

| `npcId` | Name | Place | Role |
|---|---|---|---|
| `nella_reed` | Nella Reed | `mossbridge` | quest/hub |
| `mara_quill` | Mara Quill | `bellmarket` | quest/merchant |
| `bren_dallow` | Bren Dallow | `copperrest` | quest/profession |
| `elias_voss` | Elias Voss | `reedturn` | quest/hub |
| `sable_warden` | Sable Warden | `waycross_meadow` | quest/local |
| `rue_candel` | Rue Candel | `quiet_capital` | quest/merchant |

### Canned talk trees

| NPC | Greet | Quest offer | Progress | Turn-in | Gossip (3 lines) | Refusal / rude |
|---|---|---|---|---|---|---|
| Nella Reed | “Boots by the mat, worries by the chair.” | “A bridge plank can be mended. A promise needs two hands. Will you carry this note?” | “You brought the hinge, but not the courage?” | “The bridge stands. Your word does too.” | “Moss remembers footsteps.” / “A ferry is a conversation with water.” / “I count cups, not ranks.” | “No. Ask without making someone small.” |
| Mara Quill | “The bells are quiet because someone is listening.” | “Three market chimes are out of tune. Learn who needs silence, then choose a fair route.” | “Your notes have weight. Keep names out of gossip.” | “The market can hear itself again; take this paid fare.” | “Tin rings bright in rain.” / “A pause is not an answer.” / “I sell ribbons, not promises.” | “I will not reward a cruel question.” |
| Bren Dallow | “Warm hands, full table; choose one.” | “Set three places for guests who arrive at different times. Hospitality is timing.” | “The bowls are placed. Did you leave room for change?” | “Everyone ate, and no one was hurried. Well done.” | “Copper holds heat.” / “Recipes are maps with smells.” / “A guest may say no.” | “You may leave, but do not call refusal unkind.” |
| Elias Voss | “If you cannot name the road, name the last honest landmark.” | “Mark four safe turns and return with the route intact.” | “Your map has blank space where fear used to be.” | “A usable road is a gift to the next traveler.” | “Ink dries slower near reeds.” / “A map is an invitation, not a command.” / “The bend changes after rain.” | “I will not sign a map built on a lie.” |
| Sable Warden | “Welcome to the middle. No one is late here.” | “Carry two invitations to Waycross and let each recipient answer freely.” | “The meadow has heard both answers.” | “You protected choice without abandoning company.” | “A crossroads is a place, not a verdict.” / “Leave a lamp for the next person.” / “Goodbyes can be kind.” | “Stop. A boundary is part of the route.” |
| Rue Candel | “The archive keeps receipts for kindness.” | “Restore three route records and decide which memory may be private.” | “You returned the pages without stealing their secrets.” | “The record is repaired; its owner remains its owner.” | “Gold buys bread.” / “Cosmetic ribbons buy no advantage.” / “A full shelf is not a full heart.” | “I decline that bargain. Privacy is not a discount.” |

**Hub barks by zone (ten each):** Mossbridge: “Mind the green stones.” “Ferry leaves when ready.” “Patch before pride.” “A dry sleeve is luxury.” “The bridge likes steady feet.” “Leave a note for Nella.” “No pushing at the rail.” “Moss is not a carpet.” “Share the shade.” “Welcome back.” Bellmarket: “One bell, one breath.” “Ask before tuning.” “The roofwalk is open.” “Quiet booths are quiet.” “Ribbons are cosmetic.” “Hear the small sound.” “No crowding the steps.” “Market closes kindly.” “Return borrowed chimes.” “Welcome back.” Copperrest: “Seven ovens, one table.” “Mind the warm stones.” “Aprons on hooks.” “Share the ladle.” “No racing the carriers.” “Bren saved a seat.” “A clean bowl matters.” “Yard gate swings inward.” “Taste, then decide.” “Welcome back.” Reedturn: “Mark the bend.” “Ropewalk is slick.” “Ask the dockmaster.” “Ink needs a lid.” “No invented landmarks.” “The archive welcomes care.” “Lantern hill sees far.” “Tie a bright knot.” “Maps travel.” “Welcome back.”

## 5) Premade choices / first hour

Each opening uses five authored beats: arrival, observation, invitation, stake, consequence. The stake is explicit: the player must choose whether to spend their only `shared_ration` to help a delayed traveler, keep it for their own crossing, or ask the local hub for a smaller split. The choice writes `first_choice` and `observed_consequence`; it never silently disappears.

| Kit | Opening deck and first-hour flags |
|---|---|
| `road_mender` | Look at the cracked ferry rail → introduce the repaired coat → receive Nella’s note → stake: ration versus stranger’s crossing → record `identity_confirmed`, `first_choice`, `observed_consequence`. |
| `bell_listener` | Hear three competing chimes → identify the safe tone → receive Mara’s tuning fork → stake: silence one bell and upset a vendor or wait and miss the ferry → record the same flags. |
| `table_keeper` | Find an empty place setting → show the folding table → Bren asks for help → stake: serve first-arriving guest or reserve food for a sick child → record the same flags. |
| `map_singer` | Name the last landmark → sing a safe turn → Elias offers blank route paper → stake: publish a shortcut or protect a fragile footpath → record the same flags. |

**Grounded choice buttons:** `ask_who_is_waiting` (requires no item; dialogue), `offer_shared_ration` (requires `shared_ration:1`; care), `keep_ration_for_crossing` (requires `shared_ration:1`; self_preservation), `request_half_portion` (requires `mossbridge`; negotiation), `inspect_hinge` (requires `mossbridge_lane`; investigate), `walk_to_safe_pin` (requires visited place; travel), `write_consent_note` (requires `route_paper:1`; promise), `fight_wayward_cart` (requires `old_weir`; fight move). No button claims an uncommitted outcome.

**Tutorial forced path (skippable on alts):** inspect start hub; talk to durable guide; accept one local quest; visit one POI; collect one item; make the ration stake; complete a talk objective; unlock a safe-stop pin; enter the instance door only after the journal shows its key; checkpoint; return to hub and read the consequence card.

**Retry beat deck:**

| Fingerprint | Goal | Tactic | Obstacle | Revelation | Consequence |
|---|---|---|---|---|---|
| `retry_ration` | Help the delayed traveler | offer food | ration is single-use | the traveler has a map | ration spent, shortcut revealed |
| `retry_bell` | Find safe tone | listen twice | market noise | a vendor needs quiet | bell schedule changes |
| `retry_table` | Seat three guests | ask arrival order | one guest refuses | refusal is useful information | seating plan branches |
| `retry_map` | Mark safe road | compare landmarks | ink runs | bridge is temporary | route gets a warning tag |
| `retry_note` | Deliver invitation | state boundary | recipient is absent | neighbor can carry it | delayed response recorded |
| `retry_bridge` | Cross old weir | inspect hinge | plank flexes | repair needs cloth | repair material added |
| `retry_archive` | Restore record | return page | privacy seal | owner chose redaction | public copy stays partial |
| `retry_meadow` | Keep two guests safe | separate arrivals | rain closes east path | west path remains open | comfort -1, choice preserved |

## 6) Quests: code-completeable DAGs

Quest objectives use only `visit_place`, `ledger_kill`, `ledger_bond`, `deliver_item`, `talk_to_npc`, and `collect_item`. The primary start is Mossbridge with 18 authored beats.

### Primary start: Mossbridge DAG

| `questId` | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `rl_mender_first_stitch` | First Stitch | identity | false | `rl_bridge_name` | `talk_to_npc:nella_reed:1; collect_item:frayed_hinge:1` | 8 | 30 |
| `rl_bridge_name` | Name the Crossing | identity | false | `rl_ration_stake` | `visit_place:old_weir:1; talk_to_npc:nella_reed:1` | 10 | 35 |
| `rl_ration_stake` | One Ration, Two Roads | identity | false | `rl_ferry_answer` | `deliver_item:shared_ration:1; talk_to_npc:tamsin_veil:1` | 12 | 45 |
| `rl_ferry_answer` | Ferry Answer | identity | false | `rl_moss_mark` | `visit_place:mossbridge_ferry:1; talk_to_npc:tamsin_veil:1` | 12 | 45 |
| `rl_moss_mark` | A Mark in Green | identity | false | `rl_patch_ledger` | `collect_item:moss_chalk:2; visit_place:mossbridge_green:1` | 14 | 50 |
| `rl_patch_ledger` | Patch the Ledger | profession | false | `rl_thread_count` | `deliver_item:moss_chalk:2; talk_to_npc:orin_patch:1` | 15 | 55 |
| `rl_thread_count` | Count the Thread | profession | false | `rl_hinge_song` | `collect_item:bridge_thread:3; talk_to_npc:orin_patch:1` | 16 | 60 |
| `rl_hinge_song` | Hinge Song | profession | false | `rl_safe_plank` | `visit_place:old_weir:1; deliver_item:bridge_thread:3` | 18 | 65 |
| `rl_safe_plank` | Safe Plank | profession | false | `rl_weir_whisper` | `collect_item:riverwood_plank:1; talk_to_npc:nella_reed:1` | 20 | 70 |
| `rl_weir_whisper` | Whisper Under the Weir | zone_story | false | `rl_bright_return` | `ledger_kill:weir_skitter:3; visit_place:mossbridge_house:1` | 22 | 80 |
| `rl_bright_return` | Bright Return | zone_story | false | `rl_invitation_seal` | `collect_item:glowreed:2; deliver_item:glowreed:2` | 24 | 85 |
| `rl_invitation_seal` | Seal the Invitation | zone_story | false | `rl_house_checkpoint` | `talk_to_npc:nella_reed:1; deliver_item:welcome_seal:1` | 26 | 90 |
| `rl_house_checkpoint` | Bridge House Checkpoint | dungeon_breadcrumb | false | `rl_underbridge_choice` | `visit_place:mossbridge_house:1; talk_to_npc:nella_reed:1` | 28 | 100 |
| `rl_underbridge_choice` | Underbridge Choice | side | false | `rl_traveler_trust` | `collect_item:blue_rope:1; talk_to_npc:pip_wren:1` | 18 | 75 |
| `rl_traveler_trust` | Trust the Traveler | hidden_trust | true | `rl_meadow_invitation` | `deliver_item:blue_rope:1; talk_to_npc:tamsin_veil:1` | 30 | 120 |
| `rl_meadow_invitation` | Invitation to Waycross | zone_story | false | `rl_first_route` | `deliver_item:waycross_invitation:2; visit_place:waycross_meadow:1` | 35 | 130 |
| `rl_first_route` | The First Route | zone_story | false | `rl_daily_moss` | `talk_to_npc:sable_warden:1; visit_place:lantern_harbor:1` | 45 | 160 |
| `rl_daily_moss` | Mossbridge Morning | repeatable_daily | false | — | `collect_item:dew_button:3; visit_place:mossbridge_green:1` | 10 | 25 |

**Other start quest sets (18 beats each, with full authored titles and code objectives):**

| Zone | Quest IDs and objective signatures |
|---|---|
| Bellmarket | `rl_listener_first_ring` talk `mara_quill`; `rl_tone_sample` collect `tin_tone:2`; `rl_three_bells` visit `bellmarket_steps`; `rl_market_pause` talk `siv_toll`; `rl_roofwalk_note` visit `bellmarket_roof`; `rl_chime_repair` deliver `bellwire:3`; `rl_quiet_booth` visit `bellmarket_booth`; `rl_vendor_choice` talk `jo_rill`; `rl_hush_garden` collect `hush_leaf:2`; `rl_gate_warning` visit `bellmarket_gate`; `rl_bell_skitter` ledger_kill `bell_skitter:3`; `rl_mara_seal` deliver `market_seal:1`; `rl_booth_checkpoint` visit `bellmarket_booth`; `rl_second_answer` talk `mara_quill`; `rl_hidden_listen` collect `private_chime:1`; `rl_waycross_bell` deliver `waycross_invitation:2`; `rl_bell_route` visit `waycross_meadow`; `rl_daily_tone` collect `tin_tone:3` (10g/25xp). Rewards for beats 1–17 are respectively 8/30, 10/35, 12/45, 12/45, 14/50, 16/60, 18/65, 18/70, 20/75, 22/80, 24/85, 26/90, 28/100, 30/110, 30/120, 35/130, 45/160 gold/xp; daily is 10/25. |
| Copperrest | `rl_keeper_first_place` talk `bren_dallow`; `rl_three_bowls` collect `copper_bowl:3`; `rl_yard_guest` visit `copperrest_yard`; `rl_kiln_timing` talk `revi_salt`; `rl_oven_route` visit `copperrest_oven`; `rl_tablecloth` deliver `tablecloth:1`; `rl_lane_supplies` collect `spice_sachet:2`; `rl_cellar_breadcrumb` visit `copperrest_cellar`; `rl_shared_yard` talk `uma_fen`; `rl_oven_moth` ledger_kill `oven_moth:3`; `rl_warm_seat` deliver `welcome_seal:1`; `rl_cellar_checkpoint` visit `copperrest_cellar`; `rl_guest_choice` talk `bren_dallow`; `rl_hidden_recipe` collect `quiet_recipe:1`; `rl_waycross_table` deliver `waycross_invitation:2`; `rl_copper_route` visit `waycross_meadow`; `rl_daily_oven` collect `warm_roll:3`; all objective signatures and numeric rewards mirror Bellmarket’s ascending 8–45 gold and 30–160 XP, except daily 10/25. |
| Reedturn | `rl_singer_first_verse` talk `elias_voss`; `rl_last_landmark` visit `reedturn_dock`; `rl_bend_measure` collect `reed_ink:2`; `rl_dock_story` talk `pava_nim`; `rl_archive_entry` visit `reedturn_archive`; `rl_rope_mark` deliver `bright_rope:1`; `rl_hill_sighting` visit `reedturn_lantern`; `rl_archive_moth` ledger_kill `paper_moth:3`; `rl_route_copy` collect `route_paper:2`; `rl_lantern_note` talk `len_orr`; `rl_archive_checkpoint` visit `reedturn_archive`; `rl_private_margin` collect `redaction_slip:1`; `rl_route_seal` deliver `welcome_seal:1`; `rl_two_invitations` deliver `waycross_invitation:2`; `rl_meadow_verse` visit `waycross_meadow`; `rl_capital_road` visit `lantern_harbor`; `rl_singer_trust` talk `sable_warden`; `rl_daily_reed` collect `reed_ink:3`; rewards are numeric 8–45 gold and 30–160 XP, daily 10/25. |

### Campaign spine after starts

`rl_spine_waycross` requires any start-route completion and `visit_place:waycross_meadow:1`; `rl_spine_two_answers` requires `talk_to_npc:sable_warden:2`; `rl_spine_harbor` requires `visit_place:lantern_harbor:1`; `rl_spine_archive` requires `visit_place:hearth_archive:1`; `rl_spine_route_board` requires `talk_to_npc:rue_candel:1`; `rl_spine_weir_party` requires `visit_place:weir_of_return:1`; `rl_spine_three_memories` requires `collect_item:memory_thread:3`; `rl_spine_promise` requires `deliver_item:shared_promise:1`; `rl_spine_broken_sign` requires `collect_item:route_shard:2`; `rl_spine_repair` requires `talk_to_npc:sable_warden:1`; `rl_spine_waylight_invite` requires `deliver_item:waylight_invitation:5`; `rl_spine_big_night` requires `visit_place:waylight_stage:1`; `rl_spine_afterglow` requires `talk_to_npc:rue_candel:1`; `rl_spine_open_route` requires `visit_place:quiet_capital:1`; `rl_spine_found_table` requires `talk_to_npc:sable_warden:1`. Rewards are 40, 45, 50, 55, 60, 65, 70, 80, 90, 100, 110, 125, 140, 160, and 180 gold respectively, with XP 140, 150, 165, 180, 200, 220, 240, 260, 280, 300, 330, 360, 400, 450, and 500.

**Divergence records:** `left_at_ferry` records ration retained and unlocks a later apology note; `protected_private_path` records shortcut withheld and grants a quiet travel pin; `invited_without_pressure` records a no-answer invitation and keeps the recipient available without forcing a romance route. Each is written as a visible journal memory.

## 7) Species / opponents / collectibles

Combat is optional and gentle: opponents retreat at 0 HP, with no gore-as-spectacle. Each starting region has 16 original encounter species.

| Region | Common (base HP/ATK/AC) | Uncommon | Rare | Epic |
|---|---|---|---|---|
| Mossbridge | `weir_skitter` 18/4/9, `reed_nibbler` 16/3/8, `mud_peeper` 22/4/10, `button_mole` 20/3/9, `silt_crow` 24/5/10, `plank_beetle` 15/3/8 | `hinge_hopper` 35/7/12, `mossback` 42/6/13, `ferry_fox` 38/8/12, `rill_owl` 40/7/13 | `glowreed_guardian` 75/12/16, `oldweir_ram` 82/11/17, `raincoat_crab` 70/13/15 | `bridgeheart_bramble` 150/20/20, `deepweir_murmur` 180/18/22 |
| Bellmarket | `bell_mite` 17/4/9, `tinfinch` 20/4/9, `ribbon_moth` 18/3/8, `step_sprout` 25/5/10, `roofmouse` 22/4/9, `chimebug` 16/3/8 | `copper_kite` 38/8/13, `hush hare` 35/7/12, `toll tortoise` 45/6/14, `market wisp` 40/8/13 | `three-tone heron` 78/12/16, `roof bell ram` 90/13/17, `quiet fox` 72/11/16 | `market chorus` 165/19/21, `silent striker` 190/21/22 |
| Copperrest | `oven_moth` 19/4/9, `crumb crab` 24/5/10, `copper lark` 18/3/9, `apron vole` 21/4/9, `kiln tick` 16/3/8, `steam puff` 23/5/10 | `bowl badger` 42/8/13, `warmstone ram` 48/7/14, `sugar antler` 39/8/12, `yard goose` 35/6/12 | `seven-oven salamander` 85/13/17, `table guardian` 95/12/18, `cinder potter` 80/14/17 | `feastfire colossus` 175/21/22, `empty-chair echo` 155/20/21 |
| Reedturn | `paper_moth` 18/3/8, `reed hare` 22/4/9, `inkleech` 20/4/9, `rope mite` 16/3/8, `dock gull` 24/5/10, `map mouse` 19/3/9 | `bend otter` 40/7/12, `ink heron` 43/8/13, `lantern carp` 37/7/12, `route magpie` 36/8/12 | `archive keeper` 88/12/17, `hillback stag` 92/13/18, `blue-route eel` 76/12/16 | `atlas reedwyrm` 180/20/22, `unwalked bend` 160/22/21 |

Habitat tags include `wetland`, `bridgework`, `market_roof`, `kiln_yard`, `archive`, `meadow`, and `harbor`. Collectibles include route charms, pressed leaves, bell ribbons, recipe slips, and memory threads; none are branded creatures or power packs.

## 8) Loot / economy

Starter templates are `brass_wayfinder` (weapon, 2 ATK), `soft_route_coat` (armor, 2 AC), `route_paper` (map, reveals one outline), and `shared_ration` (comfort item, +1 comfort). Profession outputs are `bridge_thread`, `tin_tone`, `tablecloth`, `reed_ink`, and `memory_thread`; instance drops are `weir_glass`, `market_chime`, `copper_seat`, and `archive clasp`. Cosmetics include `moss_trim`, `bell_sash`, `copper_apron`, `reed_bootlace`, and `waylight_pin`; cosmetic tokens only buy cosmetics.

| Source | Personal loot table |
|---|---|
| Common species | 60% material bundle, 25% 2–5 gold, 15% route collectible |
| Uncommon species | 55% material bundle, 30% 5–9 gold, 15% cosmetic dye |
| Rare species | 50% named collectible, 35% 10–16 gold, 15% cosmetic pattern |
| Epic species | 70% instance key material, 30% 18–25 gold |
| Room chest | One player-bound material, one 4–12 gold roll, never combat power above the world’s earned tier |

Vendors: `mossbridge_supply` sells ration 3g, route paper 6g, hinge cloth 4g; `bellmarket_ribbon` sells bellwire 4g, cosmetic ribbon 8g, hush leaf 2g; `copperrest_pantry` sells bowl 5g, spice sachet 3g, tablecloth 9g; `reedturn_archive` sells reed ink 4g, map sleeve 7g, redaction slip 5g; `quiet_capital_rue` sells repair kits 10g and cosmetics 12–30g. `repairCostPerPoint=1` gold, capped at 20g per item per visit.

Gold faucets are quests, safe errands, and instance completion; sinks are supplies, repairs, travel meals, and map copying. Daily character cap: 120 quest gold and 3 daily contracts. Cosmetic tokens come from milestones and are never exchanged for gold. Collection log entries track each species, place stamp, recipe, cosmetic, and memory card.

## 9) Instances

### `weir_of_return` — soloable 5-man equivalent

The instance is tuned for one player or a private party of up to five; “5-man” means five-room cooperative-equivalent pacing, not a requirement for five bodies. Every room is described before encounters.

| Room | Before-creature description | Encounters | Checkpoint / exits |
|---|---|---|---|
| `weir_room_01` | A damp plank chamber holds a tilted sign and three dry stepping stones. | `plank_beetle` ×3 | Exit `weir_room_02`; checkpoint after sign is read. |
| `weir_room_02` | Water threads through a brick gallery; a bell cord hangs just above reach. | `weir_skitter` ×4, `hinge_hopper` ×1 elite | Checkpoint; exits `weir_room_03` or return. |
| `weir_room_03` | A round sluice room shows old names carved into wood, all facing inward. | `mossback` ×2, `rill_owl` ×2 | Exit `weir_room_04`. |
| `weir_room_04` | A quiet bridge-heart chamber contains a repair bench and a lantern with no flame. | `glowreed_guardian` ×1 elite | Checkpoint; exit `weir_room_05`. |
| `weir_room_05` | The final room is an open underside of the bridge where rain makes a silver curtain. | `deepweir_murmur` ×1 boss, `weir_skitter` ×2 | Exit `mossbridge_house`; reward `weir_glass`. |

Boss behavior is three committed states: `listening` (deflects the first fight move), `testing` (summons two skitters after HP reaches 60), and `returning` (opens a safe retreat at HP 25). No prose may skip a state.

### `big_night_waylight` — non-raid “big night”

This is a five-person-equivalent community evening, not a raid. Five stations are resolved in order: `welcome_table`, `route_story`, `quiet_corner`, `shared_song`, `last_lantern`. Each station has a visible score from 0–3 based on completed talk, collect, and deliver objectives. The weekly completion requires total score 9; no score is sold or rerolled. The final room is described before the optional `waylight_moth` ×3 encounter; the encounter can be bypassed by completing `quiet_corner`.

## 10) Progression

| Node | Cost | Requires | Effect flags |
|---|---:|---|---|
| `node_open_palm` | 0 | — | `choice_offer_ration` |
| `node_safe_pin` | 1 | `node_open_palm` | `travel_safe_pin` |
| `node_patchwork` | 2 | `node_safe_pin` | `repair_item_bonus` |
| `node_clear_question` | 2 | `node_open_palm` | `talk_choice_clear_question` |
| `node_listening_room` | 3 | `node_clear_question` | `comfort_loss_resist_1` |
| `node_shared_table` | 3 | `node_open_palm` | `meal_comfort_plus_1` |
| `node_fair_portion` | 4 | `node_shared_table` | `vendor_ration_discount` |
| `node_memory_thread` | 4 | `node_listening_room` | `collect_memory_thread` |
| `node_invitation_seal` | 5 | `node_clear_question` | `deliver_invitation_safe` |
| `node_route_reading` | 5 | `node_safe_pin` | `outline_reveal_adjacent` |
| `node_boundary_kindness` | 6 | `node_invitation_seal` | `refusal_preserves_trust` |
| `node_two_way_promise` | 7 | `node_boundary_kindness`,`node_shared_table` | `promise_commit_available` |
| `node_waycross_care` | 7 | `node_memory_thread` | `party_comfort_aura` |
| `node_archive_privacy` | 8 | `node_memory_thread` | `redaction_choice` |
| `node_waylight_lead` | 9 | `node_two_way_promise`,`node_waycross_care` | `big_night_station_plus_1` |
| `node_open_route` | 10 | `node_route_reading`,`node_archive_privacy` | `capital_route_unlocked` |

No node is pay-to-unlock; costs are earned heart marks from quests and instances. Daily/weekly contracts are capped: `morning_moss` collect `dew_button:3` (10g/25xp), `market_listen` talk to `mara_quill:1` (10g/25xp), `shared_supper` deliver `warm_roll:2` (12g/30xp), `honest_landmark` visit `reedturn_lantern:1` (12g/30xp), `waylight_setup` collect `lantern_wick:3` (20g/45xp; weekly once).

## 11) Theme Kit + copy

`wayfarer_glow` uses moss green, warm brass, rain blue, paper cream, and evening plum. Materials are stitched canvas, river stone, brushed copper, and waxed route paper. Dice look like translucent paperweights with pressed leaves. Voice is calm, observant, lightly humorous, and never pushy. Ambient loop: soft footfalls, distant ferry bell, page turn, and a three-note lantern chime. Fashion defaults to layered travel coats, practical aprons, bright scarves, and cosmetic route pins.

**Player-facing UI labels:** `Inventory → Satchel`; `Journal → Route Book`; `Quest Log → Open Promises`; `Map → Waylight Map`; `Party → Traveling Company`; `Gold → Road Coin`; `Cosmetic Tokens → Ribbon Marks`; `Character → Self Portrait`; `Skills → Small Ways`; `Daily → Morning Errands`; `Weekly → Big Night`; `Checkpoint → Resting Pin`; `Travel → Choose a Road`; `NPC Talk → Ask Gently`; `Accept → I’ll Carry This`; `Decline → Not This Time`; `Retry → Try Another Way`; `Collection → Keepsake Shelf`; `Settings → Lantern Desk`; `Exit → Find a Safe Stop`.

**New Game hook cards:**

1. “You arrive with one ration and two directions.”
2. “A bridge remembers every careful repair.”
3. “Someone has written your name on a blank route.”
4. “The first bell is asking for silence, not applause.”
5. “At Copperrest, an empty chair is an invitation with a boundary.”
6. “Elias can map the road, but not the answer.”
7. “Waycross Meadow welcomes people who arrive at different times.”
8. “A private memory can still be a true memory.”
9. “Tonight’s lantern is brighter when nobody is pushed toward it.”
10. “Choose a road; let the road show what you chose.”

## 12) Failures + John’s calls

| Clone-risk call | Avoidance |
|---|---|
| It feels like a points-based dating route. | Trust and promises are explicit, reciprocal, and never reduced to a romance score; found-family outcomes are equally authored. |
| It resembles a school or harem structure. | No school, ranking, forced pairing, or roster of interchangeable admirers; four travel starts converge on community work. |
| It becomes a branching dialogue toy with no state. | Every visible objective is ledger-completeable, and every major choice writes a named divergence record. |
| It feels like a generic cozy fetch loop. | Each zone uses a distinct social verb: repair, listen, host, and map, with local stakes and different instance rooms. |
| Kids are exposed to adult romance. | Kid Mode keeps crushes, friendship, invitations, and affection nonsexual; all content and UI copy are age-appropriate. |

**Open decisions:** none blocking. Speculative default: `big_night_waylight` is tuned as a five-station community evening and may later receive accessibility variants without changing its ledger contract.

## Integrity checklist

1. World ID is stable snake case: `route_lantern`.
2. Display name uses the locked working name Route Lantern.
3. Rules module is `bond_heart`.
4. Genre is romance/found-family, not a copied franchise skin.
5. Kid Mode excludes sexual content, substances, gambling, and graphic spectacle.
6. The hard IP fence is honored with original names and plots.
7. Dump-error names are not used as canon.
8. No live-service, save, prompt, or backend references appear in-world.
9. Two wallets are separated.
10. Combat outcomes are ledger-owned.
11. Dialogue is premade for all six durable NPCs.
12. NPC barks are fixed, not stranger chat.
13. Four starting hubs exist.
14. Each start has six or more POIs.
15. Two equivalent capitals and a mid-world join exist.
16. Street and indoor map presentation is distinguished.
17. The primary start has 18 authored beats.
18. Objectives use code-completeable verbs and IDs.
19. Rewards are numeric gold and XP.
20. Divergence records preserve walk-away choices.
21. A soloable five-room 5-man equivalent exists.
22. The big-night instance is non-raid as required for Route Lantern.
23. Progression has 16 earnable nodes.
24. Daily and weekly caps are stated.
25. Collection log scope is stated.
26. No power is sold for cosmetic currency.
27. No sexual or adult content is present.
28. Opening choices include a concrete stake.
29. Retry fingerprints are authored rather than resampled.
30. Every major room is described before encounters.
31. Stable IDs are lowercase snake case.
32. NPC talk includes greet, offer, progress, turn-in, gossip, and refusal.
33. Local problems precede capital-scale promises.
34. No generic copied quest pattern is claimed.
35. All named creatures are original.
36. No forbidden franchise names are used as content.
37. The pack is content only.
38. The pack is quarantined from any live game service.
39. Speculative presentation choice is explicitly marked.
40. This file is complete for the Route Lantern world scope.
