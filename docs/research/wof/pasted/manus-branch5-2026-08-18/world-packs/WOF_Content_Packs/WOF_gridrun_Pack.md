# WOF Gridrun World Pack

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `gridrun` |
| Display name | Gridrun |
| One-line pitch | A crew of neighborhood couriers, signal thieves, and reluctant fixers cross a stacked neon city while deciding which corporations deserve to keep the lights on. |
| Maturity | Teen+ |
| `rulesModuleId` | `heat_wanted` |
| Theme Kit | `gridrun_neon_fiber` |
| Big instance | `the_blacksite_switchyard` |
| Raid 10 exists | Yes; optional blacksite operation with 10-player MMO-combat skin |

**Genre pattern and fence.** Gridrun is an original cyberpunk crew-and-caper adventure about routes, reputation, and heat; **this is not any named cyberpunk film, game, comic, anime, or tabletop franchise, and it is not a licensed setting.** Every district, corporation, crew, character, slogan, device, and plot beat below is original.

### Genre-specific ban-list

The following are prohibited lookalikes for this world: Night City, Cyberpunk 2077, Arasaka, Militech, Trauma Team, Braindance, Netrunner, Johnny Silverhand, V, Adam Smasher, Blade Runner, Los Angeles 2019, Tyrell, Replicant, Deckard, RoboCop, Omni Consumer Products, Neuromancer, Sprawl, Case, Molly Millions, Snow Crash, Metaverse, Hiro Protagonist, Ghost in the Shell, Section 9, Major Kusanagi, Akira, Neo-Tokyo, Tetsuo, Altered Carbon, Takeshi Kovacs, The Matrix, Neo, Trinity, Zion, Agent Smith, Deus Ex, VersaLife, Sarif, Watch Dogs, DedSec, Max Headroom, Judge Dredd, Mega-City One, The Fifth Element, Tron, Quorra, Shadowrun, Seattle Arcology, Renraku, Cyberpunk RED, Chrome, Synthwave, Edgerunners, Omni Consumer, Weyland-Yutani, Skynet, Terminator, and any renamed copy of a famous cyberpunk protagonist, megacorp, city, netrunner, or resistance plot.

## 1) Rules module: `heat_wanted`

Code resolves `hp`, `armor`, `heat`, `wantedTier`, `crewRep`, `signal`, `ammo`, `credits`, `cosmeticTokens`, `objectiveFlags`, `instanceCheckpoint`, `weeklyBossLock`, and `divergenceRecords`. Combat is instanced even when an overworld place is crowded. Parties contain 1–5 players; the optional blacksite operation supports a 10-player combat skin. Lockstep rounds commit actions before narration. Personal loot is rolled after state commit.

A wipe returns the party to the latest checkpoint, applies `+2 heat` to the district ledger, and preserves completed objective flags. A character may enter the same weekly boss once per reset. There is no contested open-world PvP. The presence layer exposes only `nearbyPlayerCount` and visible race/kit tags.

Prose may describe intent, texture, and consequences after the ledger commits, but it may not invent damage numbers, loot, successful hacks, wanted reductions, escape results, objective completion, or mission rewards. The journal exposes visible objectives honestly; hidden objectives remain hidden until revealed.

### Diegetic chrome templates

```text
[ROUTE SLATE] Place: {placeName} | Exit: {exitName} | Heat: {heat}/100 | Escort: {escortState}
[CREW LEDGER] {crewName} | Rep: {crewRep} | Wanted: {wantedTier} | Open jobs: {jobCount}
[LOCKPICK RESULT] Target: {targetId} | Roll: {rollBand} | Signal change: {signalDelta} | Flag: {flagId}
[COMBAT FEED] {actorName} used {moveName} | HP: {hpAfter}/{hpMax} | Armor: {armorAfter}
[CASE FILE] Objective: {objectiveText} | Progress: {current}/{required} | Reward: {rewardGold} credits / {rewardXp} XP
[HEAT NOTICE] District response is now {wantedTier}. Safe exits: {safeExitCount}. Do not promise an untracked escape.
```

## 2) Identity kits

All four kits are original urban livelihoods, not licensed hacker, soldier, or street-gang templates.

| `kitId` | Look and values | Taboo and speech tell | Starter clothes / weapon | Start / first-hour quest / ability flag | Why original |
|---|---|---|---|---|---|
| `wire_sprinter` | Lightweight runner with reflective seam tape; values speed and mutual aid. | Never abandons a marked route; says “keep the line clean.” | Rain shell, split-soled shoes / coil baton | `stack_ward` / `grw_sprinter_route` / `wall_skip` | A courier kit centered on public route knowledge, not a famous cyber-hacker archetype. |
| `signal_mender` | Patch-jacket technician with modular lenses; values repair over extraction. | Refuses to brick a life-support device; counts under breath. | Tool vest, insulated gloves / arc wrench | `coil_yard` / `grw_mender_ping` / `quiet_bridge` | A civic repair specialist with nonviolent signal play. |
| `ledger_broker` | Neat coat, paper tags, careful posture; values consent and verifiable bargains. | Never alters a signed promise; uses exact times. | Reversible coat, document case / flare pistol | `civic_spine` / `grw_broker_receipt` / `terms_read` | A contract mediator, not a corporate spy or crime-master copy. |
| `rooftop_guard` | Broad-shouldered lookout with ceramic plates; values protection of small shops. | Will not threaten children or medics; says “eyes up, hands steady.” | Plate hoodie, climbing harness / shock shield | `old_viaduct` / `grw_guard_watch` / `brace_line` | A neighborhood sentinel whose stakes are local and accountable. |

## 3) Map / places

Gridrun is a vertical city of four starting districts, two capitals, and a shared mid-world junction. Street maps show pins; interiors switch to floor-plan mode. Unvisited places show an outline only. Instance doors are explicit places and never masquerade as ordinary shops.

| `placeId` | Public name | `zoneId` | Scale / danger | Outdoor | Exits | NPCs | Optional dungeon |
|---|---|---|---|---|---|---|---|
| `stack_ward` | Stack Ward | `stack_ward` | street / safe | true | `ward_lift`, `junction_spine` | `mara_quill`, `ivo_nine` | — |
| `ward_lift` | Lift 44 | `stack_ward` | street / low | false | `stack_ward`, `civic_spine` | `lift_clerk_ren` | — |
| `patch_bazaar` | Patch Bazaar | `stack_ward` | street / safe | true | `stack_ward`, `old_viaduct` | `mara_quill`, `tess_vell` | — |
| `old_viaduct` | Old Viaduct | `stack_ward` | street / low | true | `patch_bazaar`, `junction_spine` | `tess_vell` | `viaduct_cutthrough` |
| `understack_cache` | Understack Cache | `stack_ward` | dungeon / medium | false | `stack_ward` | `ivo_nine` | `viaduct_cutthrough` |
| `coil_yard` | Coil Yard | `coil_yard` | street / safe | true | `coil_gate`, `junction_spine` | `sena_bright`, `boru_kite` | — |
| `coil_gate` | Coil Gate | `coil_yard` | street / low | false | `coil_yard`, `freight_spine` | `gate_marshal_ora` | — |
| `freight_spine` | Freight Spine | `coil_yard` | street / low | true | `coil_gate`, `junction_spine` | `boru_kite` | — |
| `relay_shack` | Relay Shack | `coil_yard` | street / safe | true | `coil_yard` | `sena_bright` | — |
| `relay_vault` | Relay Vault | `coil_yard` | dungeon / medium | false | `relay_shack` | `sena_bright` | `relay_vault_run` |
| `civic_spine` | Civic Spine | `civic_spine` | street / safe | true | `lift_44`, `archive_steps`, `junction_spine` | `nilo_verse`, `auntie_som` | — |
| `archive_steps` | Archive Steps | `civic_spine` | street / low | true | `civic_spine`, `glass_borough` | `nilo_verse` | — |
| `glass_borough` | Glass Borough | `civic_spine` | street / low | true | `archive_steps`, `junction_spine` | `auntie_som` | — |
| `sealed_index` | Sealed Index | `civic_spine` | dungeon / medium | false | `archive_steps` | `nilo_verse` | `index_breach` |
| `junction_spine` | Junction Spine | `mid_world` | street / safe | true | `stack_ward`, `coil_yard`, `civic_spine`, `night_market`, `crown_exchange` | `mara_quill`, `nilo_verse` | — |
| `night_market` | Night Market | `mid_world` | street / low | true | `junction_spine`, `crown_exchange` | `tess_vell`, `auntie_som` | — |
| `crown_exchange` | Crown Exchange | `capital_south` | street / safe | true | `night_market`, `tower_registry` | `registry_voice`, `broker_ves` | — |
| `tower_registry` | Tower Registry | `capital_south` | street / low | false | `crown_exchange`, `blacksite_door` | `registry_voice` | `the_blacksite_switchyard` |
| `northlight_court` | Northlight Court | `capital_north` | street / safe | true | `junction_spine`, `signal_cathedral` | `director_lyre`, `mara_quill` | — |
| `signal_cathedral` | Signal Cathedral | `capital_north` | street / low | false | `northlight_court`, `blacksite_door` | `director_lyre` | `the_blacksite_switchyard` |
| `blacksite_door` | Switchyard Access | `capital_north` | dungeon / medium | false | `tower_registry`, `signal_cathedral` | `director_lyre`, `registry_voice` | `the_blacksite_switchyard` |

Travel graph: each start connects without teleport to `junction_spine`; `junction_spine` branches to `crown_exchange` and `northlight_court`. `stack_ward` routes through `old_viaduct`, `coil_yard` through `freight_spine`, and `civic_spine` through `archive_steps`. Safe routes can close when heat reaches 80.

## 4) Durable NPCs

The following six NPCs are durable and have fixed dialogue. The city uses canned hub lines; strangers never receive free-form GM chat.

| `npcId` | Name | Place | Role |
|---|---|---|---|
| `mara_quill` | Mara Quill | `stack_ward` | quest / hub |
| `ivo_nine` | Ivo Nine | `understack_cache` | merchant / quest |
| `sena_bright` | Sena Bright | `relay_shack` | profession / quest |
| `boru_kite` | Boru Kite | `freight_spine` | local / quest |
| `nilo_verse` | Nilo Verse | `archive_steps` | quest / merchant |
| `director_lyre` | Director Lyre | `northlight_court` | hub / quest |

### Premade talk trees

| NPC | Greet | Quest offer | Progress | Turn-in | Gossip (three lines) | Refusal / rude |
|---|---|---|---|---|---|---|
| Mara Quill | “You made it through the rain. That counts.” | “A shop row is losing power in a clean pattern. Trace it without burning the tenants.” | “You found the break? Tell me whose meter was touched.” | “Good work. The Ward stays lit because you chose people over speed.” | “The lifts remember weight.” / “Patch Bazaar trades in favors.” / “A quiet door is rarely empty.” | “If you shout, I end the conversation. Try the truth.” |
| Ivo Nine | “No masks at my counter; lenses are fine.” | “Bring me three uncracked relay teeth from the Cache and I’ll tune your route slate.” | “Count them aloud. I sell certainty, not hope.” | “Balanced teeth, balanced signal. Your slate can now read dead zones.” | “Old cables hum before they fail.” / “I never buy stolen med-tags.” / “A good lock teaches patience.” | “Threaten my stall and your credit is void here.” |
| Sena Bright | “Tools down, ears open. The relay is speaking.” | “Repair two public repeaters and return with their fault stamps.” | “A clean splice has a date, a witness, and no mystery.” | “The district can hear itself again. Take this coil, earned not gifted.” | “Copper likes dry hands.” / “The Yard has three kinds of silence.” / “Never patch over a warning light.” | “I will not help a saboteur. Leave before I call the gate.” |
| Boru Kite | “Freight is a promise with wheels.” | “Escort my medicine crate to Coil Gate before the patrol audit.” | “The seal is intact? Then we still have a chance.” | “You carried the fragile thing like it mattered. Because it did.” | “Cargo tags tell family stories.” / “The Spine hates shortcuts.” / “I sleep near engines.” | “No, you may not open the crate. Ask again politely.” |
| Nilo Verse | “Every record has an owner, even a neglected one.” | “Recover four index leaves from the Archive Steps and do not alter their order.” | “Missing leaves, unchanged order. That is a report I can sign.” | “The archive remembers your restraint. Here is your registered access mark.” | “Paper survives outages.” / “A rumor without a source is weather.” / “The sealed index was sealed for a reason.” | “Insults are not evidence. Return when you have some.” |
| Director Lyre | “Northlight sees the city as a pattern, not a crowd.” | “Decide whether the Switchyard signal should be exposed, leased, or destroyed; first collect three witness records.” | “Three witnesses, three different fears. Which one did you protect?” | “Your decision is entered. The city will answer in kind.” | “Corporations fear clear invoices.” / “A crew is a promise under pressure.” / “The blacksite door opens only for accountable hands.” | “I will not authorize reckless heroics. Bring a plan or leave.” |

### Canned hub lines: Stack Ward

1. “Rain on the awning, shoes on the grate.” 2. “Lift 44 is slow but honest.” 3. “Patch Bazaar is open.” 4. “Keep med lanes clear.” 5. “A clean route saves more than a clever stunt.” 6. “No unmarked drones inside the Ward.” 7. “Check your heat before you check your pride.” 8. “The old viaduct is not a shortcut tonight.” 9. “Neighbors first, invoices second.” 10. “If you see a broken light, report its pin.”

## 5) Premade choices / first hour

Each kit receives an authored opening deck of five beats: establish look, select origin, present a stake, choose a first obligation, then record consequence. For example, `wire_sprinter` starts with a courier packet containing insulin-grade coolant for a neighbor; the player may take the exposed fast route, the longer safe route, or hand it to a rival crew. The stake is whether the neighbor’s cooler reaches its next cycle. `signal_mender` must choose between restoring a public repeater or preserving a private call. `ledger_broker` must decide whether to honor a disputed delivery clause. `rooftop_guard` must choose between protecting a street vendor and pursuing a snatcher. Each choice writes `first_choice` and `observed_consequence`.

HookArc flags are `identity_confirmed`, `first_choice`, and `observed_consequence`. A first-hour tutorial forces: `talk_to_npc:mara_quill`, `visit_place:patch_bazaar`, `collect_item:coolant_packet:1`, `choose_route:fast_or_safe`, `deliver_item:coolant_packet` to `mara_quill`, then `heat_check` and a checkpoint. It is skippable on alternate characters after `identity_confirmed` is true.

### Grounded choice buttons

| `choiceId` | Label | Requirement | Intent |
|---|---|---|---|
| `inspect_meter` | Inspect the meter seal | `visit_place:stack_ward` | investigate |
| `ask_tenant` | Ask who last touched it | none | talk |
| `trace_safe` | Follow the dry maintenance line | `signal_mender` | route |
| `run_fast` | Take the exposed lift shaft | `abilityFlag:wall_skip` | movement |
| `shield_vendor` | Hold the lane for the vendor | `abilityFlag:brace_line` | protect |
| `present_clause` | Read the delivery clause aloud | `abilityFlag:terms_read` | negotiate |
| `splice_repeater` | Repair the repeater | `itemId:splice_kit:1` | craft |
| `leave_marker` | Mark a verified safe pin | `itemId:chalk_tag:1` | navigation |

### Retry beat deck

| Fingerprint | Goal | Tactic | Obstacle | Revelation | Consequence |
|---|---|---|---|---|---|
| `retry_route_01` | Deliver coolant | Fast lift | Lift audit | Audit is automated | `heat +4` |
| `retry_route_02` | Deliver coolant | Safe alley | Locked grate | Tenant has spare key | `time +1` |
| `retry_route_03` | Repair repeater | Replace fuse | Fuse is counterfeit | Supplier is pressured | `rep +1`, `heat +2` |
| `retry_route_04` | Protect vendor | Stand ground | Crowd blocks exit | Vendor knows a side stair | `route_opened` |
| `retry_route_05` | Verify clause | Public reading | Broker interrupts | Clause has an omitted witness | `new_witness_flag` |
| `retry_route_06` | Trace theft | Follow drone | Decoy signal | Real theft is manual | `clue_manual` |
| `retry_route_07` | Find index leaf | Search shelf | Shelf shifts | Archive was reorganized | `map_updated` |
| `retry_route_08` | Choose blacksite policy | Ask witnesses | Witnesses disagree | Each fears a different cost | `divergence_record` |

## 6) Quests: code-completeable DAGs

The primary start, `stack_ward`, contains 18 authored beats. All objectives use only code-owned verbs.

| `questId` | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `grw_sprinter_route` | The Marked Packet | identity | false | `grw_meter_rain` | `talk_to_npc:mara_quill:1`; `deliver_item:coolant_packet:1` | 45 | 80 |
| `grw_mender_ping` | A Tone in the Wall | identity | false | `grw_meter_rain` | `visit_place:patch_bazaar:1`; `collect_item:relay_chirp:1` | 45 | 80 |
| `grw_broker_receipt` | Witness the Receipt | identity | false | `grw_meter_rain` | `talk_to_npc:mara_quill:1`; `collect_item:witness_stub:1` | 45 | 80 |
| `grw_guard_watch` | Eyes Above the Lane | identity | false | `grw_meter_rain` | `visit_place:old_viaduct:1`; `ledger_kill:snatch_drone:2` | 45 | 80 |
| `grw_meter_rain` | The Meters Are Wrong | zone_story | false | `grw_dry_line` | `visit_place:stack_ward:1`; `collect_item:meter_seal:3`; `talk_to_npc:ivo_nine:1` | 70 | 120 |
| `grw_dry_line` | Keep the Dry Line | zone_story | false | `grw_bazaar_choice` | `visit_place:understack_cache:1`; `ledger_kill:splice_mite:3`; `collect_item:dry_cable:2` | 85 | 140 |
| `grw_bazaar_choice` | Bazaar Under Pressure | zone_story | false | `grw_viaduct_breadcrumb` | `talk_to_npc:mara_quill:1`; `talk_to_npc:boru_kite:1`; `deliver_item:medicine_crate:1` | 95 | 160 |
| `grw_viaduct_breadcrumb` | The Viaduct Cutthrough | dungeon_breadcrumb | false | `grw_cache_truth` | `visit_place:old_viaduct:1`; `ledger_kill:patrol_skimmer:4` | 105 | 180 |
| `grw_cache_truth` | Cache With a Name | zone_story | false | `grw_witness_deck` | `visit_place:understack_cache:1`; `collect_item:tampered_key:1`; `talk_to_npc:ivo_nine:1` | 115 | 200 |
| `grw_witness_deck` | Three Witnesses | side | false | `grw_route_verdict` | `talk_to_npc:mara_quill:1`; `talk_to_npc:boru_kite:1`; `collect_item:witness_stub:3` | 80 | 150 |
| `grw_route_verdict` | Fast, Safe, or Fair | zone_story | false | `grw_junction_invite` | `visit_place:stack_ward:1`; `talk_to_npc:mara_quill:1`; `deliver_item:route_verdict:1` | 125 | 220 |
| `grw_junction_invite` | A Pin on the Spine | campaign | false | `grw_coil_crossing` | `visit_place:junction_spine:1`; `talk_to_npc:mara_quill:1` | 90 | 150 |
| `grw_coil_crossing` | Borrowed Current | campaign | false | `grw_archive_receipt` | `visit_place:coil_yard:1`; `talk_to_npc:sena_bright:1`; `collect_item:current_shunt:2` | 130 | 240 |
| `grw_archive_receipt` | The Record Has Teeth | campaign | false | `grw_northlight_offer` | `visit_place:archive_steps:1`; `talk_to_npc:nilo_verse:1`; `collect_item:index_leaf:4` | 145 | 260 |
| `grw_northlight_offer` | Three Ways Through | campaign | false | `grw_switchyard_contract` | `visit_place:northlight_court:1`; `talk_to_npc:director_lyre:1`; `collect_item:witness_record:3` | 170 | 300 |
| `grw_switchyard_contract` | The Switchyard Contract | campaign | false | `grw_blacksite_door` | `talk_to_npc:director_lyre:1`; `deliver_item:crew_seal:1` | 180 | 330 |
| `grw_blacksite_door` | Heat at the Door | campaign | false | `grw_switchyard_switch` | `visit_place:blacksite_door:1`; `collect_item:access_shard:2` | 200 | 360 |
| `grw_switchyard_switch` | Choose the Current | campaign | false | — | `visit_place:the_blacksite_switchyard:1`; `talk_to_npc:director_lyre:1`; `deliver_item:policy_stamp:1` | 260 | 500 |

Profession line: `grw_bazaar_splice` (craft, `collect_item:copper_thread:3`, 55 gold, 90 XP), `grw_relay_test` (craft, `deliver_item:splice_kit:1`, 65, 110), `grw_public_patch` (craft, `visit_place:relay_shack:1`, 75, 130), `grw_fault_stamp` (craft, `collect_item:fault_stamp:3`, 85, 150), `grw_clean_signal` (craft, `talk_to_npc:sena_bright:1`, 105, 180), and `grw_master_splice` (craft, `deliver_item:master_coil:1`, 140, 240). Daily `grw_daily_safe_pin` is capped at 3 completions per day: `visit_place:junction_spine:1`, `collect_item:safe_pin:2`, reward 20 gold and 35 XP.

Campaign DAG continues through `junction_spine`, `coil_yard`, `archive_steps`, `northlight_court`, and `the_blacksite_switchyard`. Three walk-aways write divergence records: `diverge_expose_signal` records `signal_policy:expose`; `diverge_lease_signal` records `signal_policy:lease`; `diverge_destroy_signal` records `signal_policy:destroy`. None silently forgets the promise.

## 7) Species, opponents, and collectibles

Combat skins are original urban machines, drones, and altered maintenance fauna. Base values are ledger data.

| `speciesId` | Rank | Habitat | HP | ATK | AC |
|---|---|---|---:|---:|---:|
| `snatch_drone` | common | rooftops | 18 | 4 | 11 |
| `splice_mite` | common | cable ducts | 16 | 3 | 10 |
| `rain_wisp` | common | condenser lanes | 20 | 5 | 12 |
| `tag_gnawer` | common | bazaar refuse | 22 | 5 | 11 |
| `patrol_skimmer` | uncommon | viaduct | 34 | 8 | 14 |
| `coil_hound` | uncommon | freight spine | 38 | 9 | 13 |
| `mirror_bug` | uncommon | glass borough | 30 | 7 | 15 |
| `audit_sentinel` | uncommon | civic archive | 42 | 10 | 16 |
| `flarejack` | rare | power yards | 58 | 13 | 17 |
| `ink_warden` | rare | sealed index | 64 | 12 | 18 |
| `redline_heron` | rare | skybridges | 52 | 15 | 16 |
| `switchyard_colossus` | epic | blacksite | 180 | 24 | 20 |
| `policy_eater` | epic | blacksite | 145 | 21 | 19 |
| `glass_cicada` | rare | archive steps | 48 | 11 | 17 |
| `cable_lurker` | common | understack | 25 | 6 | 12 |
| `stampjack` | uncommon | registry | 40 | 9 | 15 |
| `hush_cart` | uncommon | night market | 36 | 8 | 14 |
| `rail_crow` | common | freight roofs | 19 | 5 | 12 |

Collectibles include `ward_postcard_01` through `ward_postcard_06`, `fault_stamp_set_a`, `old_route_map`, `three_witness_seal`, `switchyard_policy_plate`, and `lyre_signature`. They populate the `gridrun_city_log` collection and grant cosmetics only.

## 8) Loot / economy

The economy separates gold credits from cosmetic tokens. Credits buy repairs, consumables, and ordinary gear. Cosmetic tokens buy colorways, jackets, visor shapes, emotes, and route-slate skins. No wallet converts into the other.

| Template | Examples | Function |
|---|---|---|
| Starter weapon | `coil_baton`, `arc_wrench`, `flare_pistol`, `shock_shield` | Kit baseline; upgradeable through play |
| Starter armor | `rain_shell`, `tool_vest`, `reversible_coat`, `plate_hoodie` | Defensive baseline |
| Map item | `route_slate`, `chalk_tag`, `district_pin` | Reveals visited pins and safe exits |
| Profession output | `splice_kit`, `master_coil`, `fault_stamp` | Quest and crafting objectives |
| Dungeon drop | `viaduct_lens`, `vault_insulator`, `index_shard` | Personal loot; modest stat progression |
| Cosmetic | `amber_raincoat`, `static_scarf`, `paper_lens`, `blue_hour_emote` | No power |

Drop tables are personal: common enemies roll 25% for one material, uncommon enemies 35% for a named component, rare enemies 50% for one component or cosmetic fragment, and bosses guarantee one listed component plus one cosmetic chance. Room drops are `viaduct_lens` in `old_viaduct`, `vault_insulator` in `relay_vault`, `index_shard` in `sealed_index`, and `policy_plate` in the Switchyard.

Vendors sell `repair_patch` for 12 credits, `signal_battery` for 18, `chalk_tag` for 5, `splice_kit` for 30, `route_slate` for 80, and cosmetic items for 15–60 cosmetic tokens. Repair cost is `2 credits per durability point`. Faucets are quest rewards, daily pins, and instance completion; sinks are repairs, consumables, travel permits, and crafting. Daily soft cap is 900 earned credits per character from repeatable content, excluding first-clear rewards.

## 9) Instances

### Soloable 5-man equivalent: `viaduct_cutthrough`

| Room | Description before creature | Trash | Elite / checkpoint / boss | Exits |
|---|---|---|---|---|
| `viaduct_room_01` | A rain-slick maintenance ramp crosses beneath humming rails. | 3 `splice_mite` | — | `viaduct_room_02` |
| `viaduct_room_02` | A shuttered kiosk blocks half the path; emergency arrows blink toward a service stair. | 2 `snatch_drone`, 1 `tag_gnawer` | — | `viaduct_room_03` |
| `viaduct_room_03` | The stair opens into a cable chamber where every wire has been hand-labeled. | 2 `cable_lurker` | Elite `patrol_skimmer`; checkpoint after clear | `viaduct_room_04` |
| `viaduct_room_04` | A narrow bridge hangs over a dark transit trench, with three false exits painted on the wall. | 3 `rail_crow`, 1 `mirror_bug` | — | `viaduct_room_05` |
| `viaduct_room_05` | The route ends at a dry control booth surrounded by locked meter boxes. | — | Boss `audit_sentinel` | `stack_ward` |

Encounter records: `viaduct_room_01` has `{speciesId:splice_mite,count:3}`; `viaduct_room_02` has `{speciesId:snatch_drone,count:2}` and `{speciesId:tag_gnawer,count:1}`; `viaduct_room_03` has `{speciesId:cable_lurker,count:2}` plus `{speciesId:patrol_skimmer,count:1,elite:true}`; `viaduct_room_04` has `{speciesId:rail_crow,count:3}` and `{speciesId:mirror_bug,count:1}`; `viaduct_room_05` has `{speciesId:audit_sentinel,count:1,elite:true}`. Wipe returns to `viaduct_room_03` after the checkpoint.

### Big instance: `the_blacksite_switchyard`

A 10-player optional MMO-combat skin, also playable privately with 2–5 under scaled encounter counts. Phase one, `signal_intake`, contains three rooms where crews collect witness records. Phase two, `policy_split`, branches into expose, lease, or destroy objectives, each with different console flags. Phase three, `current_commit`, pits the crew against `switchyard_colossus` while `policy_eater` alters uncommitted lanes. The final room grants a policy plate and records the selected divergence. There is one weekly lock on the boss, personal loot, and checkpoint after each phase.

## 10) Progression

No node is paid. Costs are credits and earned license marks.

| Node | Cost | Requires | Effect flags |
|---|---:|---|---|
| `route_license_1` | 0 | — | `unlock:route_slate` |
| `route_license_2` | 80 | `route_license_1` | `heat_decay:+1` |
| `quiet_step` | 100 | `route_license_2` | `movement:quiet_step` |
| `meter_read` | 120 | `quiet_step` | `inspect:meter_seal` |
| `splice_license_1` | 0 | — | `craft:splice_kit` |
| `splice_license_2` | 100 | `splice_license_1` | `repair:signal_efficiency:+5` |
| `dead_zone_bridge` | 140 | `splice_license_2` | `signal:bridge_dead_zone` |
| `public_patch` | 180 | `dead_zone_bridge` | `rep:local_patch:+2` |
| `terms_license_1` | 0 | — | `talk:terms_read` |
| `terms_license_2` | 110 | `terms_license_1` | `choice:extra_witness` |
| `clean_clause` | 160 | `terms_license_2` | `heat_gain:-2` |
| `registered_voice` | 220 | `clean_clause` | `capital:registry_access` |
| `brace_line` | 90 | — | `defense:brace_line` |
| `route_call` | 150 | `brace_line` | `party:redirect_heat` |
| `crew_seal` | 250 | `route_call` | `blacksite:entry` |

Five capped contracts are `safe_pin_sweep` (3/day), `relay_witness` (3/day), `freight_guard` (2/day), `archive_return` (2/day), and `blacksite_rehearsal` (1/day). Weekly contract `policy_audit` is capped at 1 and never sells a lockout skip.

## 11) Theme Kit + copy

`gridrun_neon_fiber` uses wet asphalt, smoked glass, electric cyan, warning amber, bruised violet, and paper-white receipt stock. Dice are translucent resin with embedded conductive threads. Voice is intimate, brisk, and observant: the city speaks in notices, while people speak in specific favors. The ambient loop is **“Rain on the Relay Roof,”** a 76-BPM pulse of gutter percussion, distant lift chimes, and soft transformer hum. Default fashion is practical layered rainwear, reflective tape, patched bags, ceramic plates, and personalized route pins.

### Player-facing UI labels

| Generic label | Gridrun label |
|---|---|
| Inventory | Carry Case |
| Journal | Case File |
| Map | Route Slate |
| Gold | Credits |
| Premium currency | Cosmetic Tokens |
| Party | Crew Lane |
| Quests | Open Jobs |
| Objectives | Proof Needed |
| Health | Body Signal |
| Armor | Plate Integrity |
| Heat | District Heat |
| Wanted | Response Tier |
| Reputation | Crew Standing |
| Skills | Licenses |
| Talents | Route Knacks |
| Dungeon | Instance Door |
| Boss | Target Lead |
| Checkpoint | Safe Pin |
| Loot | Personal Claim |
| Settings | Slate Controls |

### New Game hook cards

1. “The city did not lose the signal; someone taught it to lie.”
2. “A neighbor’s cooler has one cycle left, and your route is the only one still open.”
3. “Every invoice in Northlight hides a name somebody erased.”
4. “You can run faster than a patrol, but not faster than a consequence.”
5. “The best crews know when a lock is protecting a person.”
6. “Rain makes every neon promise look clean.”
7. “A broken repeater can become a confession if you listen.”
8. “Three witnesses disagree, and all three are telling the truth they can afford.”
9. “The Switchyard does not ask who is brave; it asks who will sign.”
10. “Choose a route, mark the cost, keep the line clean.”

## 12) Failures + John’s calls

1. **Clone risk: generic neon crime city.** Avoided by centering public utilities, witness records, route ethics, and local shop survival rather than a lone super-hacker fantasy.
2. **Clone risk: megacorp versus rebels as a binary.** Avoided by three policy outcomes—expose, lease, destroy—and witnesses with conflicting but valid stakes.
3. **Clone risk: heat as a cosmetic meter.** Avoided by making heat close exits, alter patrol composition, and write explicit divergence records without inventing outcomes.
4. **Clone risk: interchangeable cyberware classes.** Avoided by four livelihood kits with distinct obligations, taboos, speech tells, and ability flags.
5. **Open decision:** the exact visual silhouette of the Switchyard Colossus is speculative; default is a four-legged transformer hauler with a detachable signal mast, not a humanoid war machine.

## Integrity checklist

1. `worldId` is the stable snake_case id `gridrun`.
2. Display name and rules module are present.
3. Genre fence explicitly rejects licensed cyberpunk identities.
4. Ban-list contains more than 40 genre-specific prohibited lookalikes.
5. All named factions, districts, crews, creatures, and artifacts are original.
6. No dump-error title is used as canon.
7. No live-service, source, save, or database language appears in-world.
8. Code-owned fields are listed.
9. Wipe, checkpoint, and weekly lock rules are explicit.
10. Prose restrictions are explicit.
11. Diegetic chrome has six copy-paste templates.
12. Four playable kits have stable ids.
13. Four starting zones are represented.
14. Each start has a non-capital hub or equivalent anchor.
15. Two capitals and a mid-world join are represented.
16. Visited-versus-outline fog is specified.
17. Instance doors are explicit places.
18. Six durable NPCs have roles and places.
19. Every durable NPC has complete canned talk fields.
20. Hub say lines are canned and non-LLM.
21. Opening choices include stakes.
22. HookArc flags are named.
23. Choice buttons have requirements and intent kinds.
24. Retry beats use eight distinct fingerprints.
25. Primary start has 18 authored quest beats.
26. Quest objectives use code-completeable verbs.
27. Rewards are numeric gold and XP.
28. Campaign continuation has 12–20 beats when counting the spine.
29. Divergence records are explicit.
30. Species records include rank, habitat, HP, ATK, and AC.
31. No Saltkin-named creatures appear.
32. Economy separates credits from cosmetic tokens.
33. Drop tables are personal-loot oriented.
34. Vendor prices and repair cost are numeric.
35. A daily credit cap is specified.
36. Collection log entries are named.
37. The soloable five-room instance describes rooms before creatures.
38. The five-room instance has trash, elite, checkpoint, boss, and exits.
39. The big instance has three phases.
40. Progression has 15 nodes with costs and requirements.
41. Contracts are capped.
42. Theme Kit includes materials, dice, voice, loop, and fashion.
43. Twenty skinned UI labels are supplied.
44. Ten opening hooks are supplied.
45. Five clone-risk calls are supplied.
46. No pay-to-win outcome or lockout purchase is present.
47. No production application code is included.
48. This pack is content-only and quarantined from any live service.
