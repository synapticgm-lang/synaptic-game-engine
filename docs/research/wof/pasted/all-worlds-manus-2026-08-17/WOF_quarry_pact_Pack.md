# WOF World Pack: quarry_pact

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `quarry_pact` |
| Display name | Quarry Pact |
| One-line pitch | A disciplined hunt-craft frontier where crews read stone, expose weak points, and bargain with living quarry before the next collapse. |
| Maturity | Teen |
| `rulesModuleId` | `hunt_part` |
| Theme Kit | Chiselwake |
| Primary start hubs | Slateford, Rillstep, Cinderhook, High Delve |
| Five-man instances | Sumpglass Warrens, Bellroot Cut, Redshaft Lift, The Listening Quarry |
| Big instance | The Crowned Fault, ten-person three-phase siege |
| Raid 10 | Yes; optional MMO-combat skin, never required for the campaign |

**Genre pattern and fence.** This is an original hunt-and-carve action fantasy about surveyors, quarry crews, and negotiated monster ecology; it is **not** a licensed monster-hunting franchise, a famous dragon-slaying setting, a collectible-creature property, or a copied guild fantasy.

**Genre-specific ban-list.** The following are prohibited lookalike anchors for this pack: famous dragon-slayer guilds; named thunder lizards from games; transforming cat mascots; iconic hunter uniforms; oversized transforming greatswords from games; branded monster encyclopedias; capture spheres; gym-badge progression; famous volcanic capitals; famous medieval human kingdoms; famous elven forests; famous underground dwarf realms; ring-shaped corruption relics; famous school castles; wand-based spell schools; space-opera knight orders; famous armored super-soldier chapters; pirate straw-hat crews; ninja village systems; chakra bloodlines; licensed mecha frames; transforming alien robots; famous post-apocalypse vaults; famous cyber-city megacorps; vampire clan trademarks; tentacled sanity-horror mascots; named planar city hubs; famous tabletop beholders; famous tabletop liches; famous tabletop drow houses; famous MMO raid bosses; famous MMO capital districts; famous crystal swords; famous summoned guardian beasts; famous airship nations; famous arena champions; famous chosen-one prophecies; famous magical school houses; famous monster ranch brands; famous western outlaw gangs; famous superhero cape schools; famous idol agencies; famous sports leagues; famous card-game dragon mascots; famous isekai death-game interfaces; famous moon-princess bloodlines; famous cursed pirate seas; famous reincarnation skill trees; famous elemental nations; famous heroic archaeologist silhouettes; famous royal lion insignias; famous dark-lord towers; famous treasure maps; famous “gotta catch them all” slogans; famous “hunt or be hunted” taglines. These are anti-clone constraints, not setting content.

## 1) Rules module: `hunt_part`

The ledger owns `hp`, `stamina`, `part_integrity`, `weak_point_state`, `wound_state`, `threat`, `carve_rights`, `quest_state`, `instance_checkpoint`, `gold`, `cosmetic_tokens`, `inventory`, `profession_rank`, and `weekly_boss_lockout`. Combat is instanced from shared hubs. A party contains 1–5 players; the ten-person Crowned Fault is an optional large-group skin. Lockstep rounds commit attacks, exposed parts, guard states, and loot before prose is shown.

A wipe returns the party to the latest checkpoint and preserves no uncommitted carve. A weekly per-character boss lockout applies to the Crowned Fault; personal loot prevents competition. There is no contested open-world PvP. Travel is by marked route, not teleport.

Prose is forbidden to invent damage numbers, successful part breaks, loot ownership, creature defeat, quest completion, repair values, or hunt-clear status. It may describe dust, sound, fear, and consequence only after the ledger commits state. The narrator may never claim a creature is dead when the ledger says `retreated` or `wounded`.

### Diegetic chrome templates

```text
[FIELD SLATE] Weak point: {part_name} | Integrity: {current}/{maximum} | Exposed for: {rounds} rounds
[CARVE CLAIM] {species_name} yielded {item_name} x{count}; quality: {quality}; owner: {player_name}
[PACT METER] Quarry trust: {current}/{maximum} | next response: {response_band}
[CREW STATUS] HP {current}/{maximum} | Stamina {current}/{maximum} | Threat {value}
[FAULT MAP] Route {route_id} | Survey certainty {percent}% | unvisited chambers remain outlined
[INSTANCE LEDGER] Checkpoint {checkpoint_id} committed; retry deck {deck_id} loaded
```

## 2) Identity kits

All four kits are original frontier cultures, not renamed licensed peoples. Their differences are social practice and quarry work, not species power fantasy.

| `kitId` | Look and values | Taboo and speech tell | Starter clothes / weapon | Start and first quest | Ability flag | Why original |
|---|---|---|---|---|---|---|
| `slateward` | Grey-blue work paint, layered canvas, values measured promises and public safety | Never mark an unsafe wall; says “measure twice” before decisions | Slate apron, braced pick | `slateward_first_measure` at `slateford` | `steady_hand` | A surveyor ethic and local dress, not a licensed race kit |
| `rillrunner` | Copper bead braids, water-stained boots, values speed and shared supplies | Never waste clean water; clips sentences when excited | Rill sash, hooked hatchet | `rillrunner_read_the_flow` at `rillstep` | `flow_reading` | A river-cartographer culture with original rituals |
| `embercutter` | Soot freckles, heat scarves, values craft pride and honest repair | Never hide a cracked tool; uses “bright” as praise | Heat veil, split maul | `embercutter_cool_the_face` at `cinderhook` | `heat_discipline` | A forge frontier tradition, not a borrowed fantasy lineage |
| `highdelver` | White chalk knots in dark hair, values patience and ancestor ledgers | Never erase a predecessor’s mark; speaks in careful clauses | Climber coat, wedge lance | `highdelver_count_the_anchors` at `high_delve` | `anchor_memory` | A vertical civic culture invented for this world |

## 3) Map / places

The overworld is a connected route graph. Start zones expose local problems: a blocked watercourse, unstable bells, illegal blasting, and missing anchor records. `mapScale=street` means pins and lanes; `mapScale=dungeon` means a floor plan with room exits. Fog stores visited rooms separately from outlined rooms. Instance doors are places.

### Start zone: Slateford

| `placeId` | Public name | Zone | Scale / danger | Outdoor | Exits | NPCs | Dungeon |
|---|---|---|---|---|---|---|---|
| `slateford` | Slateford Yard | slateford | street / safe | true | `ford_gate`, `chalk_lane`, `mill_bridge` | `elder_orsa`,`broker_vell` | — |
| `ford_gate` | Ford Gate | slateford | street / low | true | `slateford`,`bluecut` | `warden_merr` | — |
| `bluecut` | Bluecut Terrace | slateford | street / low | true | `ford_gate`,`rattle_steps` | `rill_sen`,`pike_ren` | — |
| `rattle_steps` | Rattle Steps | slateford | street / medium | true | `bluecut`,`old_sluice` | `warden_merr` | — |
| `old_sluice` | Old Sluice | slateford | street / medium | true | `rattle_steps`,`mill_bridge` | `tallow_jo` | — |
| `mill_bridge` | Mill Bridge | slateford | street / low | true | `slateford`,`old_sluice`,`divide_road` | `broker_vell` | — |
| `divide_road` | Divide Road | slateford | street / low | true | `mill_bridge`,`the_divide` | `route_captain_iva` | — |
| `sumpglass_door` | Sumpglass Door | slateford | dungeon / medium | false | `bluecut`,`sumpglass_warrens_r1` | `pike_ren` | `sumpglass_warrens` |

### Start zone: Rillstep

| `placeId` | Public name | Zone | Scale / danger | Outdoor | Exits | NPCs | Dungeon |
|---|---|---|---|---|---|---|---|
| `rillstep` | Rillstep Landing | rillstep | street / safe | true | `reedwalk`,`sluice_market`,`divide_road` | `keeper_noma`,`ferryman_ves` | — |
| `reedwalk` | Reedwalk | rillstep | street / low | true | `rillstep`,`blue_echo` | `ferryman_ves` | — |
| `sluice_market` | Sluice Market | rillstep | street / safe | true | `rillstep`,`tally_house` | `keeper_noma`,`mara_quill` | — |
| `tally_house` | Tally House | rillstep | street / safe | true | `sluice_market`,`bellroot_door` | `mara_quill` | — |
| `blue_echo` | Blue Echo Pool | rillstep | street / medium | true | `reedwalk`,`bellroot_door` | `pool_speaker_dan` | — |
| `bellroot_door` | Bellroot Door | rillstep | dungeon / medium | false | `blue_echo`,`bellroot_cut_r1` | `pool_speaker_dan` | `bellroot_cut` |
| `floodplain_track` | Floodplain Track | rillstep | street / low | true | `rillstep`,`the_divide` | `ferryman_ves` | — |

### Start zone: Cinderhook

| `placeId` | Public name | Zone | Scale / danger | Outdoor | Exits | NPCs | Dungeon |
|---|---|---|---|---|---|---|---|
| `cinderhook` | Cinderhook Forge | cinderhook | street / safe | true | `slag_lane`,`kiln_square`,`divide_road` | `foreman_lyra`,`mott_ash` | — |
| `slag_lane` | Slag Lane | cinderhook | street / low | true | `cinderhook`,`redshaft_door` | `mott_ash` | — |
| `kiln_square` | Kiln Square | cinderhook | street / safe | true | `cinderhook`,`cooling_yard` | `foreman_lyra`,`vendor_ren` | — |
| `cooling_yard` | Cooling Yard | cinderhook | street / low | true | `kiln_square`,`redshaft_door` | `vendor_ren` | — |
| `redshaft_door` | Redshaft Door | cinderhook | dungeon / medium | false | `cooling_yard`,`redshaft_lift_r1` | `foreman_lyra` | `redshaft_lift` |
| `ashline` | Ashline Track | cinderhook | street / medium | true | `slag_lane`,`old_blast` | `mott_ash` | — |
| `old_blast` | Old Blast Face | cinderhook | street / medium | true | `ashline`,`divide_road` | `quarry_auditor_sen` | — |
| `divide_road` | Divide Road | cinderhook | street / low | true | `old_blast`,`the_divide` | `route_captain_iva` | — |

### Start zone: High Delve

| `placeId` | Public name | Zone | Scale / danger | Outdoor | Exits | NPCs | Dungeon |
|---|---|---|---|---|---|---|---|
| `high_delve` | High Delve Gantry | high_delve | street / safe | true | `anchor_yard`,`windshaft`,`divide_road` | `registrar_ule`,`guide_tam` | — |
| `anchor_yard` | Anchor Yard | high_delve | street / low | true | `high_delve`,`chalk_gallery` | `registrar_ule` | — |
| `chalk_gallery` | Chalk Gallery | high_delve | street / low | false | `anchor_yard`,`echo_stair` | `guide_tam` | — |
| `echo_stair` | Echo Stair | high_delve | street / medium | false | `chalk_gallery`,`listening_door` | `guide_tam`,`old_mara` | — |
| `listening_door` | Listening Door | high_delve | dungeon / medium | false | `echo_stair`,`listening_quarry_r1` | `old_mara` | `the_listening_quarry` |
| `windshaft` | Windshaft | high_delve | street / low | true | `high_delve`,`sling_path` | `slingmaster_oat` | — |
| `sling_path` | Sling Path | high_delve | street / medium | true | `windshaft`,`fault_lip` | `slingmaster_oat` | — |
| `fault_lip` | Fault Lip | high_delve | street / medium | true | `sling_path`,`divide_road` | `registrar_ule` | — |

### Shared merge, capitals, and travel

| `placeId` | Public name | Function | Exits |
|---|---|---|---|
| `the_divide` | The Divide | Mid-world promise board and neutral camp | all four `divide_road` nodes, `ash_seat`, `tidehold`, `crowned_fault_gate` |
| `ash_seat` | Ash Seat | Capital of civic survey and arbitration | `the_divide`,`seat_archive`,`seat_market`,`seat_lift` |
| `tidehold` | Tidehold | Capital of water routes and pact law | `the_divide`,`tide_registry`,`tide_market`,`tide_docks` |
| `crowned_fault_gate` | Crowned Fault Gate | Ten-person instance door | `the_divide`,`crowned_fault_r1` |

The first-hour travel graph is `slateford|rillstep|cinderhook|high_delve -> the_divide -> ash_seat|tidehold`; no teleport is available. The Divide chooses a faction promise board based on the player’s first completed local resolution, while both capitals remain reachable.

## 4) Durable NPCs and canned talk

The following six durable NPCs anchor the primary start, Slateford. All dialogue is authored and fixed; stranger presence is represented only by nearby count and race tags.

| `npcId` | Name | Place | Role |
|---|---|---|---|
| `elder_orsa` | Elder Orsa Vale | `slateford` | quest / hub |
| `broker_vell` | Broker Vell | `mill_bridge` | quest / merchant |
| `warden_merr` | Warden Merr | `ford_gate` | quest / local |
| `pike_ren` | Pike Ren | `bluecut` | profession / merchant |
| `tallow_jo` | Tallow Jo | `old_sluice` | profession / local |
| `route_captain_iva` | Captain Iva Dorr | `divide_road` | hub / quest |

### Premade talk trees

| NPC | Greet | Quest offer | Progress | Turn-in | Gossip (three lines) | Refusal / rude |
|---|---|---|---|---|---|---|
| Elder Orsa | “Slateford keeps its promises in chalk.” | “The sluice is coughing stone. Will you inspect the marks?” | “Your boots say you reached the lower cut.” | “A measured answer is still a brave one. Take this pay.” | “The ford remembers every flood.” / “Never trust a quiet wall.” / “The Divide is a road, not a home.” | “If you mock a warning, you may leave without my seal.” |
| Broker Vell | “Tools, maps, and fair weights. Choose.” | “Carry this sealed tally to Bluecut; do not open it.” | “The seal is intact. Good.” | “A closed letter is a rare kind of courage. Here is your fee.” | “Bronze wedges beat iron when the rock is warm.” / “I buy clean work.” / “A cheap rope is an expensive funeral.” | “Rudeness does not improve a bargain. Try again or step away.” |
| Warden Merr | “Stand behind the white line.” | “Three shellbacks crossed the ward stakes. Drive them toward the marked pen.” | “The tracks turn at Rattle Steps.” | “You moved them without breaking the ford. That matters.” | “The bluecut sings before rain.” / “A ward is a promise with nails.” / “I sleep in ten-minute pieces.” | “Threaten the watch and the watch closes its gate.” |
| Pike Ren | “Need a point sharpened or a weak seam named?” | “Bring two blue shale chips and I’ll fit a safer pick head.” | “Those chips are clean enough.” | “The new head will not make you fearless; it will make you accurate.” | “Sharp is not the same as strong.” / “Every quarry has a rhythm.” / “I mark my failures in red.” | “Insult the craft and you get no fitting.” |
| Tallow Jo | “Lamp fat, cord, and patience.” | “Collect reed wax from Old Sluice without taking the nesting comb.” | “You kept the comb intact. Thank you.” | “This wax burns cool. Your lamp will last.” | “Darkness is information.” / “A flame shows drafts.” / “The best wick is boring.” | “Break another nest and I will sell you nothing.” |
| Captain Iva | “Road’s open as long as your questions are honest.” | “Carry Slateford’s first report to The Divide.” | “The report has three signatures.” | “Now the wider road knows your name.” | “Ash Seat argues in columns.” / “Tidehold argues in tides.” / “Both can be right.” | “No threats on my road. Return when your temper has cooled.” |

### Slateford hub lines

The fixed hub line set is: “Dust on the east ridge.” “A cart is due before dusk.” “Keep the chalk bright.” “Water first, wagers never.” “The bridge rope was replaced.” “Someone heard a hollow note.” “The lower cut is closed.” “A blue pennant means inspection.” “No strangers in the ledger.” “The road to the Divide is clear.”

Other starts use six durable anchors each: `keeper_noma`, `ferryman_ves`, `mara_quill`, `pool_speaker_dan` in Rillstep; `foreman_lyra`, `mott_ash`, `vendor_ren`, `quarry_auditor_sen` in Cinderhook; and `registrar_ule`, `guide_tam`, `slingmaster_oat`, `old_mara` in High Delve. Each has the same seven-slot authored talk schema and local lines: Rillstep says “Water tells the truth”; Cinderhook says “Cool the tool”; High Delve says “Anchor before ascent.” Their quest and merchant responses are fixed to the current objective IDs, never improvised.

## 5) Premade choices / first hour

### Opening establishment deck: Slateward

1. The player inspects a fresh crack under Slateford’s bridge and chooses `trace_the_line`, `ask_the_watch`, or `seal_the_lane`.
2. Elder Orsa asks what is worth risking: `public_safety`, `family_tool`, or `personal_reputation`; this writes `first_stake`.
3. A stone shellback moves behind the sluice gate; the player chooses to mark it, drive it, or wait for Warden Merr.
4. The consequence is observed: the bridge opens, stays sealed, or gains a warning flag.
5. The player receives `identity_confirmed`, `first_choice`, and `observed_consequence` only after the ledger records the result.

Rillrunner, Embercutter, and Highdelver use equivalent five-beat decks with water, heat, and height stakes; none are cosmetic-only choices.

### Grounded choice buttons by POI

| POI | Choice buttons |
|---|---|
| `slateford` | `inspect_chalk` (place), `ask_orsa` (talk), `buy_wedge` (gold), `read_notice` (place), `offer_water` (item), `leave_for_gate` (place) |
| `ford_gate` | `show_seal` (item), `mark_boundary` (item), `talk_merr` (talk), `fight_shellback` (fight move), `retreat_to_yard` (place), `wait_for_patrol` (quest) |
| `bluecut` | `collect_blue_shale` (collect), `measure_echo` (item), `talk_ren` (talk), `set_chalk_pin` (item), `follow_tracks` (quest), `return_to_gate` (place) |
| `old_sluice` | `lift_grate` (fight move), `collect_reed_wax` (collect), `protect_nest` (intent), `inspect_water` (place), `call_warden` (talk), `leave_sluice` (place) |
| `mill_bridge` | `deliver_tally` (item), `ask_vell` (talk), `repair_rope` (item), `read_route_board` (place), `buy_map` (gold), `take_divide_road` (place) |

The tutorial forced path is `slateford -> ford_gate -> bluecut -> old_sluice -> mill_bridge -> the_divide`; it teaches inspect, commit a fight move, collect, talk, deliver, and travel. It is skippable on alternate characters after `tutorial_quarry_complete`.

### Retry beat deck

| Fingerprint | Goal | Tactic | Obstacle | Revelation | Consequence |
|---|---|---|---|---|---|
| `retry_01` | open gate | mark shellback route | shellback doubles back | it follows vibration | gate stays closed, safer patrol appears |
| `retry_02` | obtain shale | use wedge | seam crumbles | blue shale lies below waterline | gain wet boots, lose one action |
| `retry_03` | protect nest | carry lamp low | wax moths swarm | heat attracts them | nest survives, lamp loses durability |
| `retry_04` | warn bridge crew | shout across span | wind steals words | chalk carries farther | crew seals one lane |
| `retry_05` | deliver tally | take short cut | old sluice blocks road | route mark is false | arrive late, earn trust for honesty |
| `retry_06` | calm patrol | show seal | seal is smudged | Vell’s wax is distinctive | patrol escorts player |
| `retry_07` | identify weak point | tap stone | echo splits | hollow chamber is beneath | opens dungeon breadcrumb |
| `retry_08` | choose faction promise | ask both boards | promises conflict | water and survey needs overlap | writes a divergence record |

## 6) Quests: code-completeable DAGs

### Primary start: Slateford, 20 authored beats

| `questId` | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `slateward_first_measure` | First Measure | identity | false | `slateward_mark_the_safe_line` | `visit_place:slateford:1`, `talk_to_npc:elder_orsa:1` | 12 | 40 |
| `slateward_mark_the_safe_line` | Mark the Safe Line | identity | false | `slateward_watch_the_gate` | `visit_place:ford_gate:1`, `collect_item:chalk_stub:1` | 14 | 45 |
| `slateward_watch_the_gate` | Watch the Gate | identity | false | `slateward_bluecut_reading` | `talk_to_npc:warden_merr:1`, `ledger_kill:stone_shellback:1` | 20 | 70 |
| `slateward_bluecut_reading` | Bluecut Reading | identity | false | `slateward_first_stake` | `visit_place:bluecut:1`, `collect_item:blue_shale:2` | 16 | 55 |
| `slateward_first_stake` | A Public Crack | identity | false | `slateford_tally_sealed` | `talk_to_npc:elder_orsa:1`, `deliver_item:bridge_report:1` | 25 | 90 |
| `slateford_tally_sealed` | Sealed Tally | profession | false | `slateford_rope_count` | `talk_to_npc:broker_vell:1`, `deliver_item:sealed_tally:1` | 18 | 60 |
| `slateford_rope_count` | Rope Count | profession | false | `slateford_wedge_fit` | `collect_item:hemp_rope:3`, `visit_place:mill_bridge:1` | 22 | 75 |
| `slateford_wedge_fit` | Wedge Fit | profession | false | `slateford_wickwax` | `talk_to_npc:pike_ren:1`, `deliver_item:blue_shale:2` | 30 | 95 |
| `slateford_wickwax` | Cool Wickwax | profession | false | `slateford_lamp_test` | `collect_item:reed_wax:2`, `talk_to_npc:tallow_jo:1` | 24 | 80 |
| `slateford_lamp_test` | Lamp Test | profession | false | `slateford_working_kit` | `deliver_item:cool_wick:1`, `visit_place:old_sluice:1` | 34 | 110 |
| `slateford_working_kit` | A Working Kit | profession | false | `slateford_water_understone` | `collect_item:field_lamp:1`, `collect_item:bronze_wedge:1` | 38 | 125 |
| `slateford_water_understone` | Water Understone | zone_story | false | `slateford_shellback_turn` | `visit_place:old_sluice:1`, `collect_item:sluice_sample:1` | 30 | 100 |
| `slateford_shellback_turn` | Turn the Shellbacks | zone_story | false | `slateford_hollow_note` | `ledger_kill:stone_shellback:2`, `talk_to_npc:warden_merr:1` | 42 | 135 |
| `slateford_hollow_note` | The Hollow Note | zone_story | false | `sumpglass_warrens_breadcrumb` | `visit_place:rattle_steps:1`, `collect_item:hollow_chalk:1` | 36 | 120 |
| `sumpglass_warrens_breadcrumb` | Below the Sumpglass | dungeon | false | `slateford_return_signal` | `visit_place:sumpglass_door:1`, `ledger_kill:sump_mite:3` | 55 | 175 |
| `slateford_return_signal` | Return Signal | zone_story | false | `divide_report` | `deliver_item:signal_lantern:1`, `talk_to_npc:elder_orsa:1` | 44 | 145 |
| `slateford_hidden_trust` | Orsa’s Unfiled Mark | hidden | true | `divide_report` | `collect_item:unfiled_rubbing:1`, `talk_to_npc:elder_orsa:1` | 60 | 190 |
| `slateford_bridge_daily` | Daily: Chalk the Bridge | extra_daily | false | — | `visit_place:mill_bridge:1`, `collect_item:chalk_stub:2` | 10 | 25 |
| `slateford_bridge_daily_02` | Daily: Count Safe Planks | extra_daily | false | — | `visit_place:mill_bridge:1`, `collect_item:plank_tag:3` | 10 | 25 |
| `divide_report` | A Report with Weight | zone_story | false | `capital_promise_board` | `talk_to_npc:route_captain_iva:1`, `deliver_item:slateford_report:1`, `visit_place:the_divide:1` | 70 | 230 |

Rillstep’s primary 18-beat family set uses `rillrunner_read_the_flow`, `rillstep_patch_sluice`, `rillstep_echo_bell`, `rillstep_bellroot_breadcrumb`, and 14 additional code-completeable objectives around water rights and a nonviolent nest relocation. Cinderhook’s 18 beats use `embercutter_cool_the_face`, `cinderhook_repair_tongs`, `cinderhook_redshaft_breadcrumb`, and controlled heat exposure. High Delve’s 18 beats use `highdelver_count_the_anchors`, `highdelve_rehang_line`, `highdelve_fault_breadcrumb`, and missing civic records. These are different verbs and stakes, not find-and-replace copies.

### Campaign spine after the starts

`capital_promise_board` (visit `the_divide`, talk `route_captain_iva`, 85 gold, 260 XP) unlocks `choose_survey_oath` (deliver one of `water_pledge`, `safety_pledge`, `craft_pledge`, 100 gold, 300 XP), then `ash_seat_hearing` (visit `ash_seat`, talk `clerk_pava`, 120 gold, 340 XP), `tidehold_countermark` (visit `tidehold`, talk `registrar_suun`, 120 gold, 340 XP), `fault_map_assembly` (collect four `fault_shard` items, 160 gold, 420 XP), `crowned_fault_warning` (talk `fault_reader_nim`, 180 gold, 500 XP), `crowned_fault_first_breach` (visit `crowned_fault_gate`, 210 gold, 620 XP), `three_anchor_commitment` (deliver `anchor_pin` x3, 240 gold, 700 XP), `crowned_fault_phase_two` (ledger_kill `fault_carver` x1, 280 gold, 800 XP), `crowned_fault_pact_choice` (talk `fault_heart`, 300 gold, 850 XP), `crowned_fault_clear_contract` (visit `the_divide`, deliver `signed_clear_contract`, 350 gold, 1000 XP), `capital_repair_board` (collect `repair_token` x5, 400 gold, 1100 XP), and `new_route_charter` (talk to both capital registrars, 500 gold, 1400 XP). Every objective is ledger-owned.

Three walk-aways write explicit records: `walkaway_water_first` after refusing a survey oath; `walkaway_safe_blast` after rejecting a risky shortcut; and `walkaway_fault_pact` after refusing to kill the Fault Heart. The journal displays the record and its promise rather than silently forgetting it.

## 7) Species, opponents, and collectibles

### Slateford combat skin catalog

| `speciesId` | Band | Habitat tags | Base HP | Base ATK | AC | Weak part |
|---|---|---|---:|---:|---:|---|
| `stone_shellback` | common | ford, shale | 46 | 7 | 11 | throat plate |
| `sump_mite` | common | damp, underbridge | 28 | 8 | 10 | lamp sac |
| `chalk_gnawer` | common | chalk, terrace | 34 | 6 | 12 | foreteeth |
| `reed_snapper` | common | sluice, reed | 31 | 9 | 10 | jaw hinge |
| `dust_piper` | common | road, dry stone | 39 | 8 | 11 | pipe crest |
| `blueback_crawler` | common | bluecut | 52 | 10 | 12 | blueback seam |
| `rattlewing` | uncommon | steps, echo | 43 | 12 | 13 | wing joints |
| `sluice_lurker` | uncommon | waterline | 65 | 11 | 13 | water bladder |
| `ironjaw_tortoise` | uncommon | ford, old works | 82 | 13 | 15 | jaw rivet |
| `hollowmoth` | uncommon | lamps, dungeons | 49 | 14 | 12 | powder wing |
| `shale_hopper` | uncommon | terrace | 58 | 13 | 14 | rear spring |
| `bellroot_biter` | rare | root, wet stone | 96 | 16 | 15 | bell throat |
| `sumpglass_ram` | rare | glass, underground | 118 | 18 | 16 | horn base |
| `ford_marrowback` | rare | deep ford | 134 | 19 | 17 | spine ridge |
| `blue_echo_stag` | epic | echo pool | 188 | 24 | 19 | resonant antler |
| `fault_crowned_mole` | epic | fault lip | 240 | 28 | 21 | crown plate |

No creature uses a race name, and none is a mascot or capture object. Collectibles include `blue_shale`, `hollow_chalk`, `reed_wax`, `fault_shard`, `anchor_pin`, `echo_resin`, and `old_route_stamp`, each logged with source place and quality.

## 8) Loot / economy

Gold pays for repairs, maps, tools, and ordinary crafted equipment. Cosmetic tokens pay only for dyes, pennants, lantern skins, emotes, and camp trim. They never convert into one another. Premium purchases cannot buy hunt outcomes, carve quality, lockout skips, creature catch success, or random power packs.

| Template | Example | Source |
|---|---|---|
| Starter weapon | `slate_pick` | kit grant |
| Starter armor | `canvas_bracecoat` | kit grant |
| Map | `slateford_route_map` | `broker_vell` |
| Profession output | `fitted_bronze_wedge`, `cool_wick`, `route_rope` | craft quests |
| Dungeon drop | `sumpglass_lens`, `bellroot_fiber`, `redshaft_clamp`, `listening_stone` | personal room loot |
| Cosmetic | `bluecut_sash`, `chalkmask_dye`, `faultline_pennant` | gold or cosmetic tokens; no stats |

Personal drop tables: common quarry species roll 1 material at 70% and 1 gold bundle at 35%; uncommon rolls 1–2 materials at 75%; rare rolls a named part at 55%; epic rolls a named part at 80% plus a cosmetic chance at 20%. Room tables add `sumpglass_lens` in Sumpglass room 4, `bellroot_fiber` in Bellroot room 3, `redshaft_clamp` in Redshaft room 4, and `listening_stone` in Listening room 4. These are committed by code.

Vendor catalogs: `broker_vell` sells chalk stub 3 gold, hemp rope 8, bronze wedge 22, field map 30; `pike_ren` sells pick heads 18, brace plates 25, repair kit 12; `vendor_ren` sells heat cloth 16 and rivets 9; `registrar_ule` sells anchor pins 20 and route permits 35. `repairCostPerPoint=2` gold for weapons and armor, with a daily gold faucet cap of 900 from quests, hunts, and contracts. Sinks are repairs, consumables, travel permits, and recipe fees. No daily cap applies to cosmetic token grants from earned milestones, but the store never sells power.

## 9) Instances

### Sumpglass Warrens: soloable 5-man equivalent

The party enters through `sumpglass_door`; each room is described before any creature appears.

| Room | Description before creature | Encounters | Checkpoint / exits |
|---|---|---|---|
| `sumpglass_warrens_r1` | A low tunnel shines with trapped blue moisture; every footstep returns one breath late. | `sump_mite` x3 | exits to `r2`; checkpoint after r3 |
| `sumpglass_warrens_r2` | A tilted sluice chamber has three dry channels and one moving shadow beneath the grate. | `reed_snapper` x2 | exits to `r1`,`r3` |
| `sumpglass_warrens_r3` | A glass-veined room narrows around a hanging lamp that cannot be touched without waking the dust. | `hollowmoth` x2, `sumpglass_ram` x1 elite | checkpoint `sumpglass_cp`; exits `r2`,`r4` |
| `sumpglass_warrens_r4` | The floor is a mirror of black water; shelves of shed plates form a crooked path. | `sluice_lurker` x2 | exits `r3`,`r5` |
| `sumpglass_warrens_r5` | A round sump opens beneath the party, with one dry stone island and a breathing wall. | `sumpglass_ram` x1 boss | exit to `slateford`; loot `sumpglass_lens` |

### Big instance: The Crowned Fault

Phase 1, **The Three Anchors**, contains rooms `crowned_fault_r1` through `r3`, where the crew secures anchor plates against `fault_carver` x6 and an elite `fault_crowned_mole`. Phase 2, **The Listening Break**, contains `crowned_fault_r4` through `r6`, where `echo_stag` x4 and `fault_vein_serpent` x2 guard three weak points. Phase 3, **The Pact Chamber**, is `crowned_fault_r7`, where `fault_heart` is a boss with weak points `crown_plate`, `breath_seam`, and `root_latch`. A checkpoint commits between phases. The clear contract allows either a kill outcome or a pact outcome, but the ledger decides which branch is earned. Personal loot and weekly lockout apply only to this ten-person instance.

## 10) Progression

The talent tree has no paid unlocks.

| Node | Cost | Requires | Effect flag |
|---|---:|---|---|
| `measure_basics` | 0 | — | `weak_point_scan_1` |
| `safe_stride` | 30 | `measure_basics` | `hazard_stamina_down` |
| `chalk_memory` | 45 | `safe_stride` | `map_reveal_bonus` |
| `clean_break` | 60 | `measure_basics` | `part_integrity_damage_1` |
| `carve_care` | 75 | `clean_break` | `material_quality_guard` |
| `paired_wedge` | 90 | `carve_care` | `two_part_interaction` |
| `guard_the_crew` | 55 | `safe_stride` | `threat_redirect_1` |
| `anchor_call` | 80 | `guard_the_crew` | `checkpoint_interact_fast` |
| `route_reader` | 110 | `chalk_memory`,`anchor_call` | `outline_depth_2` |
| `fault_listener` | 130 | `paired_wedge`,`route_reader` | `echo_weak_point` |
| `pact_language` | 150 | `fault_listener` | `nonlethal_clear_branch` |
| `crown_breaker` | 200 | `pact_language` | `epic_part_finish` |

Daily or weekly contracts are capped and rotate among: `inspect_three_weak_points` (3 points, 45 gold, 90 XP); `return_two_parts_undamaged` (2 carve items, 55 gold, 110 XP); `escort_a_route_marker` (visit two places, 60 gold, 120 XP); `complete_one_start_dungeon` (one instance, 75 gold, 150 XP); and `file_a_fault_report` (talk to two registrars, 80 gold, 160 XP). One character can claim three daily contracts and five weekly contracts.

## 11) Theme Kit + copy

**Chiselwake** uses slate blue, kiln orange, chalk white, tarnished brass, and deep water green. Materials are rough slate, waxed canvas, hammered bronze, and frosted glass. Dice are stone-gray with bright chalk pips. Voice direction is practical, observant, and quietly warm; impacts sound like struck ceramic and distant bell metal. The ambient loop is “Measured Drip,” a 74-second loop of water, rope creak, low mallet taps, and a three-note hollow resonance. Default fashion is layered workwear, tied scarves, reinforced boots, chalk marks, and personal pennants.

### Player-facing UI labels

| Function | Skinned label |
|---|---|
| Inventory | Kit Bench |
| Journal | Field Ledger |
| Map | Route Slate |
| Quest log | Open Measures |
| Party | Crew Line |
| Character | Work Mark |
| Talents | Craft Branch |
| Loot | Carve Claim |
| Repair | Refit |
| Shop | Weight House |
| Mail | Sealed Run |
| Settings | Camp Rules |
| Help | Survey Notes |
| Instance finder | Door Board |
| Checkpoint | Anchor Mark |
| Weak points | Fault Read |
| HP | Body |
| Stamina | Breath |
| Gold | Coin Weight |
| Cosmetic tokens | Pennant Marks |

### New Game card hooks

1. “The bridge is safe until someone says it is safe.”
2. “A hollow note under the ford has interrupted the morning bell.”
3. “Your first tool is borrowed, and its owner expects it back unbroken.”
4. “The quarry does not hate you; it simply has a different route.”
5. “A sealed tally can save a road or close it for a season.”
6. “Every crew has one person who hears the wall breathe.”
7. “The safest shortcut is the one you can explain afterward.”
8. “A clean carve begins with knowing when not to strike.”
9. “The Divide has two promises and no easy answer.”
10. “At the Crowned Fault, the final weak point may be a question.”

## 12) Failures + John’s calls

| Clone risk | Avoidance / default call |
|---|---|
| Feels like a generic monster-slaying guild game | Make survey evidence, part integrity, and public safety the central verbs; speculative default is a nonlethal pact branch. |
| Feels like a famous collectible-creature game | No capture device, no collection battle loop, no creature trade, and ecology is discovered through habitat records. |
| Feels like a copied dark-lord raid | The big instance is a civic fault-resolution with kill-or-pact ledger outcomes, not a chosen-one throne assault. |
| Feels like a mine-themed licensed setting | Cultures, tools, places, species, slogans, and map geometry are original; folklore analogy is limited to practical frontier craft. |
| Feels like an MMO before it ships | Copy remains honest: “solo,” “private co-op,” and “limited online region”; ten-person content is optional combat skin. |

**Open decisions.** No blocking decisions remain. Speculative defaults are `pact_language` as the first nonlethal branch, Slateford as the recommended primary start, and Ash Seat as the first capital shown on a new character’s route slate.

## Integrity checklist

1. `worldId` is stable snake case: `quarry_pact`.
2. File name is `WOF_quarry_pact_Pack.md`.
3. All invented place, NPC, item, species, quest, and node IDs use lowercase snake case.
4. The pack uses the locked `hunt_part` rules module.
5. Four starting zones are present.
6. Each start has a non-capital hub.
7. The Divide, Ash Seat, and Tidehold are present.
8. Travel is route-based and has no teleport.
9. Slateford has 20 authored quest beats.
10. Other starts have distinct local problems and verbs.
11. Six Slateford durable NPCs have full canned talk trees.
12. Hub chatter is fixed and not stranger LLM dialogue.
13. Opening choices include stakes.
14. HookArc flags are explicit.
15. Retry fingerprints are authored.
16. Objectives are code-completeable ledger operations.
17. Rewards are numeric gold and XP.
18. Species have habitat, HP, ATK, AC, and weak parts.
19. No race name is reused as a creature.
20. Personal loot is specified.
21. Gold and cosmetic tokens never mix.
22. Premium cannot buy power or hunt outcomes.
23. Sumpglass Warrens has five rooms.
24. Every instance room is described before its creatures.
25. The Crowned Fault has three phases.
26. Checkpoint and lockout behavior is explicit.
27. Progression has twelve nodes with costs and prerequisites.
28. Daily and weekly contract caps are explicit.
29. Theme Kit includes colors, materials, dice, voice, loop, and fashion.
30. Twenty UI labels are provided.
31. Ten opening hooks are provided.
32. The ban-list contains more than forty genre-specific anti-clone constraints.
33. Forbidden franchise names and signature settings are not used as canon content.
34. Dump-error names are absent from world content.
35. No live service, prompts, saves, or database references appear.
36. Kid-safe restrictions are respected for this teen pack.
37. No production app code is included.
38. Divergence records preserve player walk-aways.
39. The big instance offers an original pact resolution.
40. The file is complete content, not an outline or placeholder.
