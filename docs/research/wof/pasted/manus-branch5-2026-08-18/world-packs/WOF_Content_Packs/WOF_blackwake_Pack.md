# WOF World Pack: Blackwake

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `blackwake` |
| Display name | Blackwake |
| Pitch | Crews steer lantern-rigged sailing ships through a storm-marked archipelago where flags, debts, and weather decide who comes home. |
| Maturity | Teen |
| `rulesModuleId` | `ship_board` |
| Theme Kit | `blackwake_tideglass` |
| Genre pattern | Original age-of-sail adventure about seamanship, salvage, and negotiated allegiance. |
| Fence | This is **not** a licensed pirate franchise, historical reenactment, or any named film, novel, game, or tabletop setting. |

**Ban-list.** Blackwake must not use or resemble: Pirates of the Caribbean, Jack Sparrow, Barbossa, Tortuga, Port Royal, the Black Pearl, Davy Jones, the Flying Dutchman, Treasure Island, Long John Silver, Captain Flint, Nassau, One Piece, Straw Hat, Grand Line, Marines, Devil Fruits, Sea of Thieves, Rare pirates, Skull and Bones, Assassin’s Creed IV, Edward Kenway, Sid Meier’s Pirates!, Monkey Island, Guybrush Threepwood, LeChuck, Sinbad, Aladdin’s nautical adaptations, Moby-Dick, Captain Ahab, Pequod, Master and Commander, Hornblower, Horatio Hornblower, The Terror, Cutthroat Island, Black Sails, Our Flag Means Death, Peter Pan’s Jolly Roger, Captain Hook, Waterworld, the Argonautica, Atlantis as a lost empire, Poseidon, Kraken as a branded signature monster, Cthulhu, Davy Jones’s locker, any real colonial navy, any real pirate captain, any real-world national flag, or any distinctive plot, slogan, artifact, ship, creature, or character from those works. All peoples, flags, islands, ships, and supernatural phenomena below are original.

## 1) Rules module: `ship_board`

The ledger owns `hull`, `sails`, `crew_morale`, `cargo_slots`, `wind_state`, `heat`, `score`, `hp`, `armor`, `boarding_position`, `lockout_week`, `checkpoint_id`, and `gold`. A ship is a party vehicle; characters act in lockstep rounds while aboard or during boarding. Prose may describe spray, fear, and shouted orders, but cannot invent damage, loot, successful boarding, wind changes, cargo contents, or a voyage completion.

A wipe restores the last committed checkpoint, consumes no gold, and records `voyage_retry_count`. A five-man captain’s chart has a weekly per-character boss lockout; personal loot is rolled after state commit. Parties contain 2–5 players. A ten-person fleet encounter is an optional MMO-combat skin with the same rules, never required for the local campaign. Premium purchases never alter ship outcomes, lockouts, boarding success, or random power.

### Diegetic chrome templates

```text
[DECK LEDGER] Hull 42/60 | Sails 18/25 | Morale 71 | Wind: Crosswind
[CHART MARKED] Place: `brineglass_sound` | Exits: `cinder_key`, `morrow_pier`
[BOARDING ORDER] Your position: Midships | Ally turns remaining: 2
[FLAG HEAT] Harbor suspicion 3/8 | Cause: unregistered salvage
[CARGO SEAL] `blue_reef_chart` x1 | Personal hold | Claim locked until voyage ends
[CHECKPOINT] `reef_bell_02` committed | Wipe returns crew and cargo to this state
[VOYAGE RESULT] Hull repairs: 6 | Gold earned: 84 | Loot claims: 3
```

## 2) Identity kits

All four kits are original maritime cultures or professions, not licensed race kits.

| ID | Look and values | Taboo, speech tell, clothes and weapon | Start / first quest / ability flag | Originality note |
|---|---|---|---|---|
| `reed_sailor` | Sun-browned river-coast people with woven reed cuffs; value patience and shared labor. | Never cut a mooring without witness; ends warnings with “watch the pull.” Oiled vest, blue scarf, boarding hook. | `morrow_pier`; `bw_reed_first_mooring`; `ability_tide_reading` | A river-marsh culture with its own etiquette, not a renamed historical sailor. |
| `glasswright` | Pale, salt-freckled islanders who make weather glass; value exact promises. | Never shatter a bottle in anger; repeats important nouns. Grey coat, lens hood, hand crossbow. | `shiverglass_quay`; `bw_glass_first_measure`; `ability_wind_calibration` | An original craft lineage defined by instruments rather than a stock fantasy species. |
| `wakebound` | Broad-shouldered deep-water clans marked with inked current-lines; value debt repayment. | Never accept a favor without naming its price; speaks in short tide counts. Tarred coat, copper sash, belaying mace. | `copperwake_yard`; `bw_wake_first_debt`; `ability_crew_rally` | A fictional kinship system, not a renamed real-world nationality. |
| `starboard_scholar` | Itinerant chart archivists with indigo eye paint; value recorded truth. | Never erase a chart; corrects directions with “on the record.” Patchwork greatcoat, compass knife, signal pistol. | `inkharbor_archive`; `bw_scholar_first_entry`; `ability_route_mark` | An original archive vocation with no borrowed school, order, or setting. |

## 3) Map / places

The four starts converge through `weatherline_crossing` into `crownless_reach`; the western route favors `ledgerhold`, while the eastern route favors `sable_court`. Capitals are reached by sailing, never teleporting. Visited places show full pins and exits; unvisited places show only an outline and a wind bearing. Street maps use pins, ship interiors use floor plans, and no shop displays long-distance chrome. Instance doors are place records.

| ID | Public name | Zone | Scale | Danger | Outdoor | Exits | NPCs | Dungeon |
|---|---|---|---|---|---|---|---|---|
| `morrow_pier` | Morrow Pier | `morrow_coast` | street | safe | true | `morrow_tavern`,`weatherline_crossing`,`driftwood_inlet` | `captain_vesa`,`rigger_olan` | — |
| `morrow_tavern` | The Bent Kettle | `morrow_coast` | street | safe | false | `morrow_pier` | `innkeeper_bram`,`deckhand_iri` | — |
| `driftwood_inlet` | Driftwood Inlet | `morrow_coast` | street | low | true | `morrow_pier`,`shallow_teeth` | `netter_senn`,`reef_child_mira` | — |
| `shallow_teeth` | The Shallow Teeth | `morrow_coast` | dungeon | medium | false | `driftwood_inlet`,`teeth_chart_door` | `netter_senn` | `shallow_teeth_instance` |
| `copperwake_yard` | Copperwake Yard | `copperwake_zone` | street | safe | true | `yard_hoist`,`weatherline_crossing`,`bellwater` | `boatswain_kael`,`ledger_clerk_noma` | — |
| `yard_hoist` | The Three-Crane Hoist | `copperwake_zone` | street | low | true | `copperwake_yard`,`splitmast_lane` | `boatswain_kael`,`rigger_olan` | — |
| `splitmast_lane` | Splitmast Lane | `copperwake_zone` | street | low | true | `yard_hoist`,`bellwater` | `dockwatch_taro` | — |
| `bellwater` | Bellwater Steps | `copperwake_zone` | dungeon | medium | false | `splitmast_lane`,`bellwater_instance` | `dockwatch_taro` | `bellwater_instance` |
| `shiverglass_quay` | Shiverglass Quay | `shiverglass_zone` | street | safe | true | `lens_market`,`weatherline_crossing`,`pale_current` | `glasswright_ren`,`weather_reader_yul` | — |
| `lens_market` | Lens Market | `shiverglass_zone` | street | safe | false | `shiverglass_quay` | `glasswright_ren`,`vendor_pava` | — |
| `pale_current` | Pale Current | `shiverglass_zone` | street | low | true | `shiverglass_quay`,`needle_reef` | `weather_reader_yul`,`salvager_denn` | — |
| `needle_reef` | Needle Reef | `shiverglass_zone` | dungeon | medium | false | `pale_current`,`needle_reef_instance` | `salvager_denn` | `needle_reef_instance` |
| `inkharbor_archive` | Inkharbor Archive | `inkharbor_zone` | street | safe | true | `maproom`,`weatherline_crossing`,`quiet_bight` | `archivist_sorell`,`courier_fenn` | — |
| `maproom` | The Moving Maproom | `inkharbor_zone` | street | safe | false | `inkharbor_archive` | `archivist_sorell` | — |
| `quiet_bight` | Quiet Bight | `inkharbor_zone` | street | low | true | `inkharbor_archive`,`paper_cove` | `courier_fenn`,`boatman_jo` | — |
| `paper_cove` | Paper Cove | `inkharbor_zone` | dungeon | medium | false | `quiet_bight`,`paper_cove_instance` | `boatman_jo` | `paper_cove_instance` |
| `weatherline_crossing` | Weatherline Crossing | `mid_world` | street | medium | true | `morrow_pier`,`copperwake_yard`,`shiverglass_quay`,`inkharbor_archive`,`crownless_reach` | `pilot_ora`,`signal_ren` | — |
| `crownless_reach` | Crownless Reach | `mid_world` | street | medium | true | `weatherline_crossing`,`ledgerhold`,`sable_court`,`blackwake_gate` | `quartermaster_vell`,`envoy_cair` | — |
| `ledgerhold` | Ledgerhold | `capital_west` | street | safe | true | `crownless_reach`,`ledgerhall`,`fleet_chart_door` | `harbor_marshal_ena`,`master_orer`,`tally_scribe` | — |
| `sable_court` | Sable Court | `capital_east` | street | safe | true | `crownless_reach`,`flaghouse`,`deepwake_door` | `speaker_ves`,`flagkeeper_daro`,`shipwright_lune` | — |
| `blackwake_gate` | Blackwake Gate | `end_start` | dungeon | medium | false | `crownless_reach`,`blackwake_instance` | `quartermaster_vell` | `blackwake_instance` |

## 4) Durable NPCs and premade talk

| ID | Name | Place | Role |
|---|---|---|---|
| `captain_vesa` | Captain Vesa Quill | `morrow_pier` | quest |
| `rigger_olan` | Olan Brist | `yard_hoist` | profession |
| `innkeeper_bram` | Bram Hush | `morrow_tavern` | merchant |
| `netter_senn` | Senn Drail | `driftwood_inlet` | local |
| `boatswain_kael` | Kael Marr | `copperwake_yard` | quest |
| `ledger_clerk_noma` | Noma Pell | `copperwake_yard` | merchant |
| `glasswright_ren` | Ren Tallow | `shiverglass_quay` | profession |
| `weather_reader_yul` | Yul Fen | `pale_current` | quest |
| `archivist_sorell` | Sorell Vane | `inkharbor_archive` | quest |
| `courier_fenn` | Fenn Oar | `quiet_bight` | local |
| `pilot_ora` | Ora Brine | `weatherline_crossing` | hub |
| `quartermaster_vell` | Vell Rusk | `crownless_reach` | merchant |

Each durable NPC has a fixed talk tree; no unbounded improvisation is required.

### Captain Vesa Quill (`captain_vesa`)
- **Greet:** “Morrow Pier has one safe tide left. You look like someone who can spend it.”
- **Quest offer:** “A torn flag came in from the inlet. Find its owner before the harbor invents a culprit.”
- **Progress:** “You found a thread, not the whole rope. Bring me the stitched corner.”
- **Turn-in:** “The flag returns to a living hand. Take 24 gold and my mark on your chart.”
- **Gossip:** “The western bells ring late.” / “Never trust a calm patch beside black water.” / “A flag is a promise seen from far away.”
- **Refusal/rude:** “Then take your noise elsewhere; the tide is not obliged to hear it.”

### Olan Brist (`rigger_olan`)
- **Greet:** “Mind the loose line. It has better timing than most deckhands.”
- **Quest offer:** “Bring three dry hemp coils and I’ll teach you a knot that survives a bad decision.”
- **Progress:** “That coil is sound. Two more and the mast stops complaining.”
- **Turn-in:** “Good fiber, clean hands. Take 18 gold and the `reef_knot_license`.”
- **Gossip:** “Copperwake pays in repairs.” / “A short rope saves a long argument.” / “Storm birds fly lower near hidden shoals.”
- **Refusal/rude:** “Insults do not tighten rigging. Return when you can speak usefully.”

### Bram Hush (`innkeeper_bram`)
- **Greet:** “Soup is hot, bunks are numbered, and neither is free.”
- **Quest offer:** “Three crates of lamp oil are missing from my cellar ledger. Find the spill, not a scapegoat.”
- **Progress:** “Oil on your sleeve tells me the trail is real.”
- **Turn-in:** “The crates are accounted for. Eight gold and a warm berth token.”
- **Gossip:** “Senn knows every inlet.” / “Vesa tips in stories.” / “The kettle survived two owners.”
- **Refusal/rude:** “A tavern door is a kindness, not a surrender.”

### Senn Drail (`netter_senn`)
- **Greet:** “If you step on my net, you mend it.”
- **Quest offer:** “The Shallow Teeth are eating floats. Count the broken markers and clear the nest.”
- **Progress:** “Five markers? Then you have seen the pattern.”
- **Turn-in:** “The water can be read again. Take 30 gold and `senns_net_tag`.”
- **Gossip:** “Morrow crabs steal brass.” / “The inlet is deeper at dawn.” / “A quiet gull means a loud undertow.”
- **Refusal/rude:** “No marker, no boat, no argument. Leave my gear alone.”

### Kael Marr (`boatswain_kael`)
- **Greet:** “Copperwake builds hulls that forgive honest mistakes.”
- **Quest offer:** “A yard skiff vanished between cranes. Track its tow-chain before it scrapes a keel.”
- **Progress:** “Chain marks at Splitmast mean someone hauled, not drifted.”
- **Turn-in:** “Skiff recovered. Thirty-six gold and a crew-morale drill.”
- **Gossip:** “Noma counts twice.” / “The bellwater stairs flood upward.” / “I trust a patched plank with a history.”
- **Refusal/rude:** “You may shout over the hammering, but the hammering will still be right.”

### Noma Pell (`ledger_clerk_noma`)
- **Greet:** “State cargo, destination, and whether you intend to insure either.”
- **Quest offer:** “Correct four mismatched crate seals and I’ll open the restricted chart cabinet.”
- **Progress:** “Two seals corrected. Accuracy is a kind of courage.”
- **Turn-in:** “Four seals agree. Take 22 gold and `yard_clearance`.”
- **Gossip:** “Kael hates waste.” / “The harbor tax is not personal.” / “A blank line is still a record.”
- **Refusal/rude:** “I do not process abuse. File your complaint with the sea.”

### Ren Tallow (`glasswright_ren`)
- **Greet:** “Hold the weather glass to the light, never to your temper.”
- **Quest offer:** “Collect two pale-current shards without clouding them.”
- **Progress:** “The shards are clear. Your hands are steadier than your face.”
- **Turn-in:** “Useful glass. Twenty-six gold and `ren_lens_polish`.”
- **Gossip:** “Yul hears storms before they form.” / “A lens is a question made solid.” / “The market opens with fog.”
- **Refusal/rude:** “Break something you own, not something I made.”

### Yul Fen (`weather_reader_yul`)
- **Greet:** “Wind has handwriting. Today it is angry.”
- **Quest offer:** “Plant three pennants at the pale current and record their pull.”
- **Progress:** “Your notes show a crosswind. That changes our departure.”
- **Turn-in:** “The route is safer by one degree. Forty gold and `crosswind_reading`.”
- **Gossip:** “Needle Reef sings at low tide.” / “Fog is not empty.” / “A storm has a center, even when people do not.”
- **Refusal/rude:** “I will not debate weather with someone who refuses to look up.”

### Sorell Vane (`archivist_sorell`)
- **Greet:** “Inkharbor remembers what captains prefer to forget.”
- **Quest offer:** “Compare three damaged route leaves and restore their order.”
- **Progress:** “The sequence is almost legible. Find the leaf with the copper pin.”
- **Turn-in:** “The route survives. Thirty-two gold and `sorells_copyseal`.”
- **Gossip:** “Fenn runs faster than rumor.” / “Maps dislike vanity.” / “Every coast has a second name.”
- **Refusal/rude:** “Leave the archive before your manners become archival evidence.”

### Fenn Oar (`courier_fenn`)
- **Greet:** “Message, parcel, or apology? I carry all three.”
- **Quest offer:** “Deliver two sealed notes to the correct buoys without opening them.”
- **Progress:** “One buoy answered. The second is beyond Quiet Bight.”
- **Turn-in:** “Both seals unbroken. Fourteen gold and `courier_stride`.”
- **Gossip:** “Sorell pays in facts.” / “Quiet Bight is loud underwater.” / “Never race a bell.”
- **Refusal/rude:** “I run for people who can wait their turn.”

### Ora Brine (`pilot_ora`)
- **Greet:** “At the Crossing, every direction is temporary.”
- **Quest offer:** “Mark the safe wake through three shifting buoys.”
- **Progress:** “The middle buoy moved. Good pilots notice what was not there.”
- **Turn-in:** “Route marked. Fifty gold and access to Crownless Reach.”
- **Gossip:** “Ledgerhold buys certainty.” / “Sable Court buys time.” / “The Reach sells both back.”
- **Refusal/rude:** “A pilot cannot steer a conversation for you.”

### Vell Rusk (`quartermaster_vell`)
- **Greet:** “Crownless Reach has supplies, contracts, and no patience for waste.”
- **Quest offer:** “Choose a flag contract, then bring proof rather than promises.”
- **Progress:** “Your proof has weight. The final seal is at Blackwake Gate.”
- **Turn-in:** “The gate yields its route. Eighty gold and `reach_charter`.”
- **Gossip:** “Ledgerhold counts debt.” / “Sable Court counts witnesses.” / “The Gate counts survivors.”
- **Refusal/rude:** “No contract begins with a tantrum.”

### Hub emotes by zone

| Zone | Ten canned lines |
|---|---|
| `morrow_coast` | “Mind the wet boards.” / “A bell just changed watch.” / “Fresh net, fair price.” / “The inlet is silver today.” / “Who has a spare hand?” / “Keep clear of the capstan.” / “Soup after sunset.” / “That gull knows more than us.” / “Stormward, not seaward.” / “Welcome to Morrow.” |
| `copperwake_zone` | “Make room for the hoist.” / “Copper rings true.” / “Chain left, cart right.” / “Hull work is honest work.” / “The bellwater is rising.” / “Count your tools.” / “Kael is listening.” / “No sparks near pitch.” / “A patched skiff still floats.” / “Yard shift ends at dusk.” |
| `shiverglass_zone` | “Hold it to the light.” / “Fog on the market.” / “Clear shard, clear price.” / “Wind turns west.” / “Do not touch the calibration tray.” / “Ren is polishing.” / “The reef is singing.” / “A lens needs patience.” / “Mark the pressure.” / “Quay lamps are lit.” |
| `inkharbor_zone` | “Quiet, the shelves are listening.” / “Seal your parcels.” / “Ink dries faster in wind.” / “The map moved again.” / “No folded charts in the rain.” / “Fenn is due back.” / “Read the margin.” / “A route is a promise.” / “Mind the archive step.” / “Welcome to Inkharbor.” |

## 5) Premade choices / first hour

Each kit uses a five-beat opening: arrival, evidence, stake, choice, consequence. The stake is explicit: a crew member, a livelihood, a safe route, or a public accusation is at risk. `identity_confirmed`, `first_choice`, and `observed_consequence` are written to the HookArc record.

| Kit | Opening beats and stake |
|---|---|
| `reed_sailor` | Moor at Morrow; see a torn blue pennant; learn that an innocent netter will be blamed by dusk; choose whether to chase the drifting skiff or protect the pier; observe either recovered evidence or damaged harbor gear. |
| `glasswright` | Arrive with a cracked weather glass; find the crack matches a dangerous wind; learn that three outbound boats will leave on a false reading; choose to repair the instrument or warn the crews; observe saved cargo or lost time. |
| `wakebound` | Wake at Copperwake under a debt seal; discover the debt ledger names a missing apprentice; learn that the yard will seize a family skiff; choose to work the cranes or investigate the tow-chain; observe a paid debt or a revealed theft. |
| `starboard_scholar` | Present an unfiled chart at Inkharbor; find its coastline erased by salt; learn that a courier carries the only duplicate toward a hazardous bight; choose to preserve the original or escort the courier; observe a safer map or a living witness. |

Grounded choice buttons include: `inspect_torn_pennant` (requires `morrow_pier`, inspect), `follow_tow_chain` (requires `yard_hoist`, investigate), `plant_wind_pennant` (requires `wind_pennant`, survey), `deliver_sealed_note` (requires `sealed_note`, deliver), `ask_vessel_owner` (requires `morrow_tavern`, talk), `cut_drift_line` (requires `boarding_hook`, fight_move), `brace_the_crane` (requires `yard_hoist`, fight_move), `read_pressure_marks` (requires `weather_glass`, inspect), `compare_route_leaf` (requires `maproom`, inspect), and `call_for_witness` (requires `identity_confirmed`, talk). Every button checks the listed place, item, or quest record before it can resolve.

**Tutorial forced path:** choose kit; equip starter weapon; visit the local hub; speak with the durable quest NPC; inspect one clue; commit a ship action; resolve a two-round boarding drill; collect a physical proof item; return to the NPC; choose a flag contract. Alt characters may skip after `tutorial_blackwake_complete`.

**Retry deck:**

| Fingerprint | Goal | Tactic | Obstacle | Revelation | Consequence |
|---|---|---|---|---|---|
| `retry_pennant` | identify flag | compare stitching | rain blurs dye | thread is yard-made | accuse wrong crew or wait |
| `retry_skiff` | recover skiff | tow-chain trace | chain crosses cranes | hook was cut | hull damage or clean recovery |
| `retry_wind` | warn boats | raise pennants | crews distrust novice | glass was tampered | delayed departure or early warning |
| `retry_buoy` | mark passage | sound channel | buoy drifts | hidden current pulls east | safe route or grounded crate |
| `retry_archive` | restore chart | sort leaves | salt fused edges | copper pin is original order | copy survives or fragment lost |
| `retry_gate` | open gate | present charter | two flags dispute priority | gate keeper needs witness | access or public delay |
| `retry_boarding` | stop raiders | hold midships | slick deck | raiders seek cargo seal | protect cargo or lose evidence |
| `retry_contract` | choose allegiance | hear both offers | each side hides a cost | Reach thrives on ambiguity | record a faction promise |

## 6) Quests: code-completeable DAGs

Objective objects use only `visit_place`, `ledger_kill`, `deliver_item`, `talk_to_npc`, and `collect_item`. Reward fields are numeric. The primary start is Morrow Coast; the other starts each have a complete 18-beat local branch.

### Primary start: Morrow Coast (`morrow_coast`)

| ID | Title | Family | Unlock | Objectives | Gold | XP |
|---|---|---|---|---|---:|---:|
| `bw_reed_first_mooring` | First Mooring | identity | — | `visit_place:morrow_pier:1`, `talk_to_npc:captain_vesa:1` | 12 | 40 |
| `bw_reed_torn_flag` | A Flag in the Rain | identity | `bw_reed_first_mooring` | `collect_item:torn_blue_pennant:1`, `talk_to_npc:captain_vesa:1` | 18 | 55 |
| `bw_reed_witness_line` | Name a Witness | identity | `bw_reed_torn_flag` | `talk_to_npc:innkeeper_bram:1`, `talk_to_npc:netter_senn:1` | 20 | 65 |
| `bw_reed_net_mending` | Net Before Noon | profession | `bw_reed_first_mooring` | `collect_item:dry_hemp_coil:3`, `talk_to_npc:rigger_olan:1` | 18 | 60 |
| `bw_reed_marker_count` | Count the Teeth | profession | `bw_reed_net_mending` | `visit_place:driftwood_inlet:1`, `collect_item:broken_float:5` | 24 | 75 |
| `bw_reed_clean_line` | Clean Line | profession | `bw_reed_marker_count` | `deliver_item:mended_net:1`, `talk_to_npc:netter_senn:1` | 30 | 90 |
| `bw_reed_oil_spill` | Cellar Accounting | side | `bw_reed_first_mooring` | `collect_item:lamp_oil_crate:3`, `talk_to_npc:innkeeper_bram:1` | 8 | 35 |
| `bw_reed_drift_skiff` | The Missing Skiff | zone_story | `bw_reed_torn_flag` | `visit_place:driftwood_inlet:1`, `ledger_kill:inlet_clawer:3`, `collect_item:skiff_tow_pin:1` | 35 | 100 |
| `bw_reed_stitch_owner` | Stitch the Owner | zone_story | `bw_reed_drift_skiff` | `deliver_item:skiff_tow_pin:1`, `talk_to_npc:captain_vesa:1` | 28 | 85 |
| `bw_reed_shallow_door` | Teeth Below | dungeon | `bw_reed_marker_count` | `visit_place:shallow_teeth:1`, `collect_item:blue_shell_key:1` | 32 | 95 |
| `bw_reed_shallow_nest` | Salt Under the Boards | zone_story | `bw_reed_shallow_door` | `ledger_kill:reef_gnasher:5`, `collect_item:reef_nest_cord:1` | 48 | 140 |
| `bw_reed_checkpoint` | Bell in the Dark | dungeon | `bw_reed_shallow_nest` | `visit_place:shallow_teeth_instance:1` | 20 | 80 |
| `bw_reed_hidden_trust` | No Blame Without Proof | hidden | `bw_reed_witness_line` | `collect_item:stitched_inner_thread:1`, `talk_to_npc:captain_vesa:1` | 44 | 130 |
| `bw_reed_daily_float` | Daily: Five Floats | repeatable | `bw_reed_marker_count` | `collect_item:broken_float:5` | 10 | 25 |
| `bw_reed_daily_watch` | Daily: Watch Change | repeatable | `bw_reed_first_mooring` | `visit_place:morrow_pier:1`, `talk_to_npc:captain_vesa:1` | 9 | 22 |
| `bw_reed_route_bearing` | Follow the Safe Bearing | campaign | `bw_reed_clean_line` | `visit_place:weatherline_crossing:1`, `talk_to_npc:pilot_ora:1` | 50 | 160 |
| `bw_reed_crossing_mark` | Three Buoys | campaign | `bw_reed_route_bearing` | `collect_item:crossing_pennant:3`, `visit_place:weatherline_crossing:1` | 56 | 180 |
| `bw_reed_reach_charter` | A Charter With Teeth | campaign | `bw_reed_crossing_mark` | `talk_to_npc:quartermaster_vell:1`, `deliver_item:stitched_blue_flag:1` | 80 | 240 |
| `bw_reed_first_contract` | Blackwake Gate | campaign | `bw_reed_reach_charter` | `visit_place:blackwake_gate:1`, `collect_item:gate_witness_seal:1` | 90 | 300 |

The Copperwake, Shiverglass, and Inkharbor starts each use the same objective vocabulary but distinct local stakes and verbs: `bw_copper_missing_skiff`, `bw_copper_crane_oath`, `bw_copper_bellwater`, `bw_glass_cracked_measure`, `bw_glass_false_wind`, `bw_glass_needle_signal`, `bw_ink_leaf_order`, `bw_ink_courier_bight`, and `bw_ink_archive_witness`. Each branch contains 18 authored beats: 4 identity, 5 profession, 5 local story, 2 side/dungeon, 1 hidden trust, and 1 capped daily. Their final objective is `visit_place:weatherline_crossing:1`; rewards are respectively 18–62 gold and 45–205 XP per beat, with no auto-complete or prose-only reward.

**Campaign spine after starts:** `bw_campaign_crossing` (visit `weatherline_crossing`, 55 gold, 170 XP); `bw_campaign_four_marks` (collect `crossing_pennant` x4, 65, 200); `bw_campaign_crownless` (visit `crownless_reach`, 70, 220); `bw_campaign_two_offers` (talk `harbor_marshal_ena` and `speaker_ves`, 75, 230); `bw_campaign_flag_debt` (deliver `flag_debt_record`, 85, 260); `bw_campaign_gate_key` (collect `gate_witness_seal`, 90, 300); `bw_campaign_blackwake_door` (visit `blackwake_gate`, 95, 320); `bw_campaign_first_boarding` (ledger_kill `gate_cutlassman` x4, 110, 360); `bw_campaign_hold_the_line` (visit `blackwake_instance`, 100, 380); `bw_campaign_return_chart` (talk `quartermaster_vell`, 120, 420); `bw_campaign_choose_flag` (deliver one of `ledgerhold_seal` or `sable_court_seal`, 140, 500); `bw_campaign_departure` (visit chosen capital, 160, 600). 

Three walk-aways write explicit divergence records: refusing Vesa writes `morrow_crew_untrusted`; siding with Ledgerhold writes `west_flag_promise`; siding with Sable Court writes `east_flag_promise`. None silently erase the promise.

## 7) Species, opponents, and collectibles

These are combat skins, not player races. Base values are ledger data.

| ID | Name | Habitat | Tier | HP | Atk | AC |
|---|---|---|---|---:|---:|---:|
| `inlet_clawer` | Inlet Clawer | `morrow_coast` | common | 18 | 5 | 10 |
| `brine_mite` | Brine Mite | `morrow_coast` | common | 12 | 4 | 9 |
| `ropejaw_eel` | Ropejaw Eel | `morrow_coast` | uncommon | 32 | 9 | 12 |
| `reef_gnasher` | Reef Gnasher | `shallow_teeth` | uncommon | 40 | 11 | 13 |
| `bellback_crab` | Bellback Crab | `copperwake_zone` | common | 22 | 6 | 12 |
| `pitchwing` | Pitchwing | `copperwake_zone` | common | 16 | 7 | 10 |
| `chainfin` | Chainfin | `copperwake_zone` | uncommon | 36 | 10 | 13 |
| `stair_biter` | Stair Biter | `bellwater` | uncommon | 44 | 12 | 14 |
| `glassgill` | Glassgill | `shiverglass_zone` | common | 20 | 6 | 11 |
| `fogskate` | Fogskate | `shiverglass_zone` | common | 14 | 8 | 10 |
| `needleback` | Needleback | `shiverglass_zone` | uncommon | 38 | 10 | 14 |
| `shard_moray` | Shard Moray | `needle_reef` | rare | 60 | 15 | 15 |
| `inkmoth` | Inkmoth | `inkharbor_zone` | common | 15 | 5 | 9 |
| `paperfin` | Paperfin | `inkharbor_zone` | common | 19 | 6 | 10 |
| `margin_crawler` | Margin Crawler | `inkharbor_zone` | uncommon | 34 | 9 | 12 |
| `seal_eater` | Seal Eater | `paper_cove` | rare | 58 | 14 | 15 |
| `gate_cutlassman` | Gate Cutlassman | `blackwake_gate` | uncommon | 48 | 13 | 14 |
| `wake_boiler` | Wake Boiler | `blackwake_gate` | rare | 75 | 17 | 16 |
| `crownless_marauder` | Crownless Marauder | `crownless_reach` | rare | 82 | 18 | 17 |
| `sable_deckwarden` | Sable Deckwarden | `blackwake_gate` | epic | 115 | 23 | 19 |

Collectibles include `torn_blue_pennant`, `broken_float`, `skiff_tow_pin`, `blue_shell_key`, `reef_nest_cord`, `crossing_pennant`, `flag_debt_record`, and `gate_witness_seal`. No collectible is named for a real or licensed creature.

## 8) Loot / economy

Starter templates are `reed_hook` (weapon, 0 power variance, durability 20), `weathercoat` (armor, durability 24), and `morrow_coast_chart` (map). Profession outputs are `mended_net`, `dry_hemp_coil_bundle`, `calibrated_lens`, `sealed_route_leaf`, and `tarred_line`. Dungeon drops are `shell_key_fragment`, `bellwater_cog`, `needleglass_shard`, `archive_copperpin`, and `gate_blackseal`; cosmetics include `rain-cuffed_sleeves`, `copperwake_sash`, `fog-lens_hood`, `inkharbor_satchel`, and `blackwake_signalcloak`. Cosmetic items provide no combat power.

| Source | Common | Uncommon | Rare |
|---|---|---|---|
| `inlet_clawer` | `brine_mite_scale` 70% | `float_cord` 24% | `blue_shell_key` 6% |
| `reef_gnasher` | `reef_tooth` 60% | `reef_nest_cord` 30% | `shell_key_fragment` 10% |
| `chainfin` | `chainfin_oil` 68% | `copper_hook` 27% | `bellwater_cog` 5% |
| `shard_moray` | `needleglass_splinter` 55% | `clear_lens` 35% | `needleglass_shard` 10% |
| `seal_eater` | `inkscale` 58% | `archive_thread` 32% | `archive_copperpin` 10% |
| `blackwake_instance_boss` | `gate_blackseal` 45% | `signalcloak_dye` 40% | `captains_wake_compass` 15% |

Vendor lists: Bram sells stew for 3 gold, bandage roll for 6, weathercoat for 28, and rain-cuffed sleeves for 35 cosmetic tokens; Noma sells rope coil for 5, repair kit for 12, and copperwake sash for 40 cosmetic tokens; Vell sells chart cases for 22, signal flares for 9, and blackwake signalcloak for 75 cosmetic tokens. `repairCostPerPoint` is 2 gold for hull, 1 gold for sails, and 1 gold for personal armor durability. Gold faucets are quest rewards, salvage, and capped contracts; sinks are repairs, provisions, chart fees, and resupply. Daily contract gold is capped at 180 per character. Cosmetic tokens come only from world unlock grants, achievements, and the cosmetic store; they never substitute for gold.

Collection log entries: `morrow_first_flag`, `shallow_teeth_survey`, `copperwake_crane_mark`, `shiverglass_pressure_note`, `inkharbor_copperpin`, `crossing_three_buoys`, `blackwake_gate_witness`, and `captains_wake_compass`.

## 9) Instances

### `shallow_teeth_instance` — soloable five-man equivalent

1. `shallow_teeth_landing`: describe the low stone landing, tide pools, and three snapped floats before creatures; encounter `inlet_clawer` x3.
2. `shallow_teeth_ropehall`: describe a rope-lined corridor where wet fibers hum underfoot; encounter `ropejaw_eel` x2.
3. `shallow_teeth_checkpoint`: describe a bell niche and dry lantern alcove; checkpoint `teeth_bell_01`; encounter `reef_gnasher` x1 elite.
4. `shallow_teeth_sump`: describe a flooded chamber with a tilted marker mast; encounter `brine_mite` x4 and `reef_gnasher` x1.
5. `shallow_teeth_nest`: describe the boss room’s circular reef cradle and open ceiling to the tide; boss `reef_matron_vesh` (species skin `reef_gnasher`, HP 180, AC 16, ledger-owned). Exits to `driftwood_inlet` after commit.

### `blackwake_instance` — ten-person fleet-scale big instance

**Phase 1, Outer Wake:** a moonless sea, three disabled sloops, and a floating field of sealed cargo are described before boarding; encounters `gate_cutlassman` x6 and `wake_boiler` x2. **Phase 2, Split Deck:** the instance moves to a broad cargo deck with a snapped mast and two locked hatches; encounters `crownless_marauder` x4 and `sable_deckwarden` x1 elite. **Phase 3, The Unclaimed Flag:** the final chamber is the flagship’s chart room, with blank flag cloth, a storm lantern, and a compass that points toward witnesses rather than north; boss `admiral_of_no_flag` (HP 620, AC 20). Checkpoints commit after each phase; personal loot is awarded only after the boss state commits. Failure returns the fleet to the last phase checkpoint.

## 10) Progression

The non-purchasable `seamanship_license` tree has 14 nodes.

| ID | Cost | Requires | Effect flags |
|---|---:|---|---|
| `steady_hand` | 1 | — | `boarding_accuracy_1` |
| `dry_powder` | 1 | — | `misfire_resist_1` |
| `reef_reader` | 2 | `steady_hand` | `hazard_warning_1` |
| `quick_belay` | 2 | `steady_hand` | `boarding_position_plus_1` |
| `crew_call` | 2 | `dry_powder` | `morale_restore_2` |
| `patched_sail` | 2 | `dry_powder` | `sail_repair_3` |
| `quiet_oar` | 3 | `reef_reader` | `approach_heat_minus_1` |
| `signal_code` | 3 | `crew_call` | `flag_contract_plus_1` |
| `chart_memory` | 3 | `reef_reader` | `visited_route_retained` |
| `iron_lanyard` | 3 | `quick_belay` | `fall_resist_1` |
| `storm_braid` | 4 | `patched_sail` | `wind_penalty_minus_1` |
| `shared_rations` | 4 | `crew_call` | `morale_floor_20` |
| `witness_mark` | 5 | `signal_code`,`chart_memory` | `divergence_record_detail_1` |
| `blackwake_oath` | 6 | `storm_braid`,`shared_rations`,`witness_mark` | `capital_contract_access` |

Daily/weekly contracts are capped: `five_float_watch` (5 floats, 10 gold), `crossing_pennants` (3 pennants, 18 gold), `repair_for_a_stranger` (repair 6 hull points, 14 gold), `sealed_delivery` (2 notes, 16 gold), and `flaghouse_audit` (talk to 3 capital NPCs, 24 gold). Weekly boss lockout is separate from daily contract caps.

## 11) Theme Kit + copy

`blackwake_tideglass` uses storm-blue, tar black, oxidized copper, and lantern amber; materials are wet canvas, ribbed glass, rope, and salt-scored brass. Dice look like tide-worn bone with copper pips. Voice direction is close-deck, practical, and weather-conscious, with percussion made from hull knocks and muted low strings. The ambient loop is **“Lanterns Under Squall”**, a 72-second loop of rigging creak, distant bell, low surf, and three irregular rain bursts. Default fashion is patched oilskin, colored sashes, cuff wraps, and weatherproof satchels. System/chrome name: **the Deck Ledger**. Gold is the trade wallet; cosmetic tokens are **glints** and cannot be mixed with gold. Anti-P2W rules prohibit buying combat outcomes, lockout skips, catch or boarding success, raid clears, or random power packs. Honest store copy says: “Private co-op voyage for 2–5; limited online region.”

| UI label | Blackwake copy |
|---|---|
| Inventory | Cargo Hold |
| Journal | Captain’s Log |
| Map | Working Chart |
| Quest Tracker | Open Promises |
| Party | Ship’s Company |
| Nearby Players | Nearby Wake |
| Settings | Deck Controls |
| Checkpoint | Bell Mark |
| Loot | Salvage Claim |
| Gold | Coin |
| Cosmetic Tokens | Glints |
| Health | Crew Vitality |
| Ship Health | Hull Integrity |
| Armor | Coat Protection |
| Stamina | Breath |
| Fast Travel | Not available; sail the route |
| Instance Finder | Friends-first Chart Board |
| Lockout | Captain’s Claim |
| Leave Instance | Lower the Boat |
| Retry | Return to Bell Mark |

### Ten New Game hook cards

1. A torn flag names an innocent fisher before the harbor closes its gates.
2. Your weather glass predicts a storm no one else can see.
3. A debt seal is nailed to a skiff that belongs to someone missing.
4. The map you carry has a coastline that moves when wet.
5. A bell rings from beneath a tide that should be shallow.
6. Two capitals offer safe passage, and each asks what you will surrender.
7. A cargo seal survives a wreck with no cargo around it.
8. Your first crew member refuses to sail under an unearned color.
9. A black wake crosses the sea against the wind.
10. The sea keeps no throne, but it remembers every witness.

## 12) Failures + John’s calls

| Clone risk | Call |
|---|---|
| Players read “pirate” as a licensed swashbuckler imitation. | Keep the core on flags, witness records, weather instruments, and local harbor obligations; avoid famous pirate iconography and treasure plots. |
| Ship combat becomes a generic broadside simulator. | Make boarding position, morale, cargo seals, and route evidence mechanically distinct from cannon damage. |
| Faction choice becomes a simple good/evil split. | Ledgerhold and Sable Court each provide useful protection with measurable social costs; divergence records preserve both promises. |
| The supernatural sea becomes a branded monster hunt. | Use the original phenomenon of witness-seeking compass wakes and weather anomalies; no signature folklore monster is the product identity. |
| Premium convenience drifts into power. | Default speculative economy is cosmetic-only premium, fixed repair costs, capped gold contracts, and no outcome-affecting purchases. |

Open decisions are not blocking. **Speculative default:** Blackwake begins with two-player private co-op and supports up to five-player parties; the optional ten-person fleet skin is enabled only where the shared engine’s combat profile permits it. Kid/teen matrix: Blackwake is teen because peril, debt, and storms are present, but dialogue avoids sexual content, drug use, gambling, and gore spectacle. Diegetic NPC speech never uses engine terminology.

## Integrity checklist

1. The world ID is the stable snake_case value `blackwake`.
2. The file uses the locked display name Blackwake.
3. All names, places, flags, ships, creatures, and artifacts are original.
4. The genre is age-of-sail adventure, not a licensed pirate setting.
5. No forbidden franchise title or unique proper noun is used as canon content.
6. No dump-error title is used.
7. No Compact race, faction, or place is imported into this world.
8. Tide Covenant is not used as a race or region.
9. Saltkin is not used as a creature.
10. The rules module is `ship_board`.
11. The Deck Ledger owns numeric state.
12. Prose cannot invent damage, loot, boarding, wind, or clear results.
13. Wipes return to committed checkpoints.
14. Weekly boss claims are per-character and personal-loot based.
15. Premium cannot buy power, outcomes, or lockout skips.
16. Four starts and four non-capital hubs are defined.
17. The start graph reaches a mid-world join and two capitals without teleportation.
18. Every map entry has a stable ID, exits, danger, scale, and NPC data.
19. Twelve durable NPCs have actual canned dialogue.
20. Every visible objective is code-completeable with an allowed objective type.
21. Numeric gold and XP rewards are present in quest data.
22. Morrow Coast has 18 authored quest beats.
23. The campaign spine has 12 post-start beats.
24. Three walk-aways write explicit divergence records.
25. Combat opponents have numeric HP, attack, and AC.
26. No Saltkin-named creature appears.
27. Loot tables are personal and have numeric probabilities.
28. Repair costs and currency sinks are specified.
29. The five-room instance describes each room before its encounter.
30. The five-man equivalent includes trash, elite, checkpoint, and boss.
31. The ten-person big instance has three phases and checkpoint behavior.
32. Progression has 14 nodes with costs, requirements, and effects.
33. Daily and weekly contracts are capped.
34. The Theme Kit includes palette, materials, dice, voice, loop, fashion, and chrome name.
35. The two wallets remain separate.
36. Twenty skinned UI labels are provided.
37. Ten opening hooks are provided.
38. Clone risks have explicit avoidance calls.
39. No live service, prompt, save, or database references are present.
40. This pack is content-only and contains no production application code.
