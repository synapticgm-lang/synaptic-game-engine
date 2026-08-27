# WOF World Pack: Ash Compact

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `ash_compact` |
| Display name | Ash Compact |
| One-line pitch | Four peoples keep a fragile fuel-and-water accord alive while local ash blights, smugglers, and broken roads test whether cooperation can survive scarcity. |
| Maturity | Teen |
| `rulesModuleId` | `hp_check` |
| Theme Kit | `cinder_accord` |
| Genre pattern | Frontier civic fantasy with instanced cooperative combat, craft work, and faction diplomacy. |
| Fence | This is **not** a licensed medieval franchise, a Tolkien-derived setting, a death-game anime, or a post-collapse salvage world. |

**Ban-list.** The following are prohibited lookalikes for this world: Azeroth, Stormwind, Orgrimmar, Horde, Alliance, Warcraft, Blizzard, Middle-earth, Mordor, Gondor, Hobbit, Istari, Aincrad, Sword Art Online, NerveGear, Kirito, Pokémon, Poké Ball, Pokédex, Palworld, Teyvat, Genshin, Hogwarts, Gryffindor, Slytherin, Ravenclaw, Hufflepuff, Harry Potter, Warhammer, Skyrim, Tamriel, Morrowind, Baldur’s Gate, Faerûn, Beholder, Final Fantasy, chocobo, Midgar, One Piece, Naruto, Jedi, Sith, Star Wars, Vampire: The Masquerade, Cthulhu, Necronomicon, MMO, “gotta catch them all,” “you died,” “the one ring,” “chosen one,” and any direct imitation of those worlds’ names, mascots, artifacts, slogans, or plots.

All cultures, maps, creatures, and artifacts below are original. The four playable peoples are **Hearthborn, Lanternfolk, Saltkin, and Stonevein**, and no fifth playable race is added.

## 1) Rules module: `hp_check`

The ledger owns `hp_current`, `hp_max`, `level`, `armor_class`, `status_flags`, `gold`, `cosmetic_tokens`, `inventory_item_ids`, `quest_state`, `objective_counts`, `checkpoint_id`, `weekly_lockout_key`, `nearby_player_count`, `race_id`, `profession_flags`, and `faction_standing`. Combat resolves initiative, attack rolls, damage, healing, defeat, and room completion before prose is generated. Personal loot is rolled per eligible player.

A defeated party returns to its last checkpoint with earned quest progress intact; an instance wipe consumes no gear and leaves the door available. The four 5-mans have a weekly per-character boss lockout; Millstone Hollow has a weekly per-character phase-clear lockout. Party size is 1–5 for ordinary instances and 10 for the named toy raid. The overworld is shared-hub, instanced-combat Tier 3; it has no contested open-world PvP.

Prose is forbidden to invent damage numbers, item ownership, reward amounts, kill counts, boss defeat, faction standing, or a cleared room. It may describe only committed state. Visible objectives use `visit_place`, `ledger_kill`, `deliver_item`, `talk_to_npc`, or `collect_item`.

### Diegetic chrome templates

```text
[COMPACT LEDGER] HP {hp_current}/{hp_max} | ARMOR {armor_class} | CHECKPOINT {checkpoint_id}
[PATH NOTE] {quest_title} — {objective_label}: {current_count}/{required_count}
[FACTION SEAL] {faction_name} standing {standing_value} | promise {promise_id}
[WORKBENCH] {recipe_name} | materials {owned}/{required} | result {item_id}
[INSTANCE DOOR] {instance_name} | party {party_count}/5 | checkpoint {checkpoint_id}
[LOCKER] Personal claim: {item_name} | source {room_id} | status {claim_status}
[RAID PHASE] Millstone Hollow — phase {phase_number}/3 | phase state {phase_state}
```

## 2) Identity kits

| Kit ID | Look and values | Taboo and speech tell | Starter clothes / weapon | Start / first-hour quest / ability flag | Originality note |
|---|---|---|---|---|---|
| `hearthborn_kit` | Broad-shouldered ash farmers and kiln keepers; value mutual meals and reliable work. | Never waste a shared loaf; says “measure twice, carry once.” | Patchwork wool, clay-bead sash, `hearthborn_hatchet`. | Reedfen / `hearthborn_request` / `hearth_grit` | Hearth-people with original customs, not a licensed dwarf kit. |
| `lanternfolk_kit` | Tall, dusk-adapted canal and wick tenders with reflective irises; value safe passage and memory. | Do not extinguish another person’s guiding light; says “mark the corner.” | Oilcloth mantle, blue wick scarf, `lanternfolk_hookblade`. | Lampwood / `keep_path_lit` / `wick_sight` | A lamp-working people, not an imitation of elves or any school franchise. |
| `saltkin_kit` | Tide-weathered coastal people with pale salt freckles; value promises witnessed by water. | Never swear falsely beside a tide marker; says “the water keeps count.” | Brine cloak, shell cord, `saltkin_netknife`. | Brinewatch / `flats_are_wrong` / `tide_listening` | A unique coastal culture, not a renamed stock sailor race. |
| `stonevein_kit` | Dense-boned quarry folk with mineral-thread hair; value craft lineage and structural honesty. | Never conceal a crack in a load-bearing object; says “show the seam.” | Riveted apron, dust goggles, `stonevein_maul`. | Granite Stair / `stair_crack` / `fault_reading` | An original quarry culture, not a licensed fantasy people. |

## 3) Map / places

### Travel graph

`reedfen_start` → `divide_wayhouse` → `ash_seat`; `lampwood_start` → `divide_wayhouse` → `ash_seat`; `brinewatch_start` → `divide_wayhouse` → `tidehold`; `granite_stair_start` → `divide_wayhouse` → `ash_seat`. No teleport is available. `ash_seat` ↔ `divide_wayhouse` ↔ `tidehold`; both capitals connect to `millstone_hollow_road` and the faction promise board.

### Places

| ID | Public name | Zone | Scale | Danger | Outdoor | Exits | NPCs | Dungeon |
|---|---|---|---|---|---|---|---|---|
| `reedfen_start` | Reedfen | `reedfen_start` | street | safe | true | `reedfen_dike`,`fen_mill`,`divide_wayhouse` | `elder_mara`,`miller_tobin`,`pathwarden_sila` | — |
| `reedfen_dike` | Reedfen Dike | `reedfen_start` | street | low | true | `reedfen_start`,`lampwood_gate_door` | `pathwarden_sila`,`dike_child_ren` | `lampwood_gate` |
| `fen_mill` | Fen Mill | `reedfen_start` | street | safe | true | `reedfen_start`,`reedwheel_yard` | `miller_tobin`,`grain_clerk_ves` | — |
| `reedwheel_yard` | Reedwheel Yard | `reedfen_start` | street | low | true | `fen_mill`,`reedfen_thatch` | `miller_tobin`,`cartwright_oda` | — |
| `reedfen_thatch` | Thatch Commons | `reedfen_start` | street | safe | true | `reedfen_start`,`reedfen_dike` | `elder_mara`,`hearth_aunt_pel` | — |
| `lampwood_start` | Lampwood | `lampwood_start` | street | safe | true | `wickhaven`,`lampwood_coppice`,`divide_wayhouse` | `wick_tender_cal`,`lampwright_iona`,`mothkeeper_ru` | — |
| `lampwood_coppice` | Lampwood Coppice | `lampwood_start` | street | low | true | `lampwood_start`,`unlit_hollow_door` | `mothkeeper_ru`,`pathmarker_jen` | `unlit_hollow` |
| `wickhaven` | Wickhaven | `lampwood_start` | street | safe | true | `lampwood_start`,`wick_market` | `wick_tender_cal`,`lampwright_iona` | — |
| `wick_market` | Wick Market | `lampwood_start` | street | safe | true | `wickhaven`,`lampwood_coppice` | `oil_seller_fen`,`mothkeeper_ru` | — |
| `lampwood_fork` | Fork of Three Wicks | `lampwood_start` | street | low | true | `lampwood_start`,`unlit_hollow_door` | `pathmarker_jen` | — |
| `brinewatch_start` | Brinewatch | `brinewatch_start` | street | safe | true | `coil_pier`,`tideline_flats`,`divide_wayhouse` | `tide_reader_nesh`,`fisher_pell`,`watch_captain_aro` | — |
| `coil_pier` | Coil Pier | `brinewatch_start` | street | safe | true | `brinewatch_start`,`coil_warehouse_door` | `fisher_pell`,`ropewright_mera` | — |
| `tideline_flats` | Tideline Flats | `brinewatch_start` | street | low | true | `brinewatch_start`,`brine_causeway` | `tide_reader_nesh`,`flat_scavenger_jo` | — |
| `brine_causeway` | Brine Causeway | `brinewatch_start` | street | medium | true | `tideline_flats`,`coil_warehouse_door` | `watch_captain_aro` | `coil_warehouse` |
| `brinewatch_stalls` | Brinewatch Stalls | `brinewatch_start` | street | safe | true | `brinewatch_start`,`coil_pier` | `fisher_pell`,`net_mender_su` | — |
| `granite_stair_start` | Granite Stair | `granite_stair_start` | street | safe | true | `anvil_gate`,`stair_face`,`divide_wayhouse` | `stair_oath_kell`,`smith_vorr`,`survey_master_dain` | — |
| `anvil_gate` | Anvil Gate | `granite_stair_start` | street | safe | true | `granite_stair_start`,`anvil_deep_door` | `smith_vorr`,`gate_warden_bex` | — |
| `stair_face` | Stair Face | `granite_stair_start` | street | low | true | `granite_stair_start`,`fault_gallery` | `survey_master_dain`,`stone_apprentice_yu` | — |
| `fault_gallery` | Fault Gallery | `granite_stair_start` | dungeon | medium | false | `stair_face`,`anvil_deep_door` | `survey_master_dain` | `anvil_deep` |
| `granite_market` | Granite Market | `granite_stair_start` | street | safe | true | `anvil_gate`,`granite_stair_start` | `smith_vorr`,`ore_broker_tel` | — |
| `divide_wayhouse` | The Divide Wayhouse | `the_divide` | street | safe | true | `reedfen_start`,`lampwood_start`,`brinewatch_start`,`granite_stair_start`,`ash_seat`,`tidehold` | `faction_clerk_ves`,`roadkeeper_noll` | — |
| `ash_seat` | Ash Seat | `ash_seat` | street | safe | true | `divide_wayhouse`,`compact_hall`,`kiln_archive`,`millstone_hollow_road` | `compact_speaker_ren`,`archive_keeper_eli` | — |
| `tidehold` | Tidehold | `tidehold` | street | safe | true | `divide_wayhouse`,`tide_court`,`brine_archive`,`millstone_hollow_road` | `tide_envoy_sava`,`tide_clerk_oru` | — |
| `millstone_hollow_road` | Millstone Hollow Road | `mid_world` | street | medium | true | `ash_seat`,`tidehold`,`millstone_hollow_door` | `roadkeeper_noll` | `millstone_hollow` |
| `lampwood_gate_door` | Lampwood Gate Door | `reedfen_start` | dungeon | low | false | `reedfen_dike` | `pathwarden_sila` | `lampwood_gate` |
| `unlit_hollow_door` | Unlit Hollow Door | `lampwood_start` | dungeon | medium | false | `lampwood_coppice`,`lampwood_fork` | `wick_tender_cal` | `unlit_hollow` |
| `coil_warehouse_door` | Coil Warehouse Door | `brinewatch_start` | dungeon | medium | false | `brine_causeway`,`coil_pier` | `watch_captain_aro` | `coil_warehouse` |
| `anvil_deep_door` | Anvil Deep Door | `granite_stair_start` | dungeon | medium | false | `anvil_gate`,`fault_gallery` | `smith_vorr` | `anvil_deep` |

Fog reveals visited places fully; unvisited places remain outlines. Street maps show pins, while indoor maps show floor plans. Instance doors are ordinary place records and never masquerade as outdoor geography.

## 4) Durable NPCs and premade talk

The following twelve NPCs persist across the starting zones and hubs.

| ID | Name | Place | Role |
|---|---|---|---|
| `elder_mara` | Elder Mara | `reedfen_thatch` | quest/hub |
| `miller_tobin` | Miller Tobin | `fen_mill` | quest/profession/merchant |
| `pathwarden_sila` | Pathwarden Sila | `reedfen_dike` | quest/local |
| `wick_tender_cal` | Wick Tender Cal | `wickhaven` | quest/profession/merchant |
| `tide_reader_nesh` | Tide-reader Nesh | `tideline_flats` | quest/local |
| `fisher_pell` | Fisher Pell | `coil_pier` | quest/profession/merchant |
| `stair_oath_kell` | Stair-oath Kell | `granite_stair_start` | quest/hub |
| `smith_vorr` | Smith Vorr | `anvil_gate` | quest/profession/merchant |
| `compact_speaker_ren` | Compact Speaker Ren | `compact_hall` | quest/hub |
| `tide_envoy_sava` | Tide Envoy Sava | `tide_court` | quest/hub |
| `faction_clerk_ves` | Faction Clerk Ves | `divide_wayhouse` | quest/merchant |
| `roadkeeper_noll` | Roadkeeper Noll | `millstone_hollow_road` | quest/local |

### Full talk trees

| NPC | greet | quest_offer | quest_progress | quest_turnin | gossip (three lines) | refusal / player-rude |
|---|---|---|---|---|---|---|
| Elder Mara | “Warm ash to you, traveler.” | “Reedfen needs a witness who can carry truth between homes.” | “You returned with the dike ledger; good.” | “Your record is clear. Take this measured share.” | “The fen remembers every boot.” / “A compact is a promise with hinges.” / “Feed the mill before the rumor.” | “I will not bargain while you insult the hungry.” |
| Miller Tobin | “Mind the wheel; it bites.” | “Bring three dry reed sheaves and I will set the mill teeth.” | “The sheaves are sound; one more adjustment.” | “The wheel turns because you did.” | “Flour dust gets everywhere.” / “A straight axle is a quiet miracle.” / “Never trust a damp sack.” | “Come back when your hands are calmer.” |
| Pathwarden Sila | “Path clear? Say what you saw.” | “Mark two safe posts before the fog thickens.” | “The second post stands; finish the route.” | “The road has a memory now.” | “Crows know shortcuts.” / “A lantern is a promise to strangers.” / “Mud hides nails.” | “Rudeness is not a travel permit.” |
| Wick Tender Cal | “Keep your sleeve away from the flame.” | “Collect four blue-wick fibers for Wickhaven’s night line.” | “The fibers hold light; two more knots.” | “Now the lane can be read after dusk.” | “Smoke tells on poor oil.” / “Every flame needs a boundary.” / “Darkness is not an enemy by itself.” | “I teach those who listen.” |
| Tide-reader Nesh | “The flats changed their breathing.” | “Visit three tide stakes and bring their chalk marks.” | “The water’s count matches two stakes.” | “You heard the third mark correctly.” | “Tides do not forgive haste.” / “Brine writes in curves.” / “A dry boot can still respect water.” | “I will not read the tide over a shouted threat.” |
| Fisher Pell | “Lines ready, eyes on the coil.” | “Deliver five coilfish to the stall before noon.” | “Four fish are fresh; one more.” | “The stall is fed, and so is the pier.” | “Coilfish hide under warm metal.” / “Rope remembers a bad knot.” / “The pier sings in rain.” | “Take your temper back to shore.” |
| Stair-oath Kell | “Stone above, breath below.” | “Show me the crack and do not widen it.” | “You found the seam; now bring the survey slate.” | “The oath holds because the evidence does.” | “Stairs are promises stacked.” / “A hammer can be patient.” / “Dust is a map if you read it.” | “No oath is sworn in a tantrum.” |
| Smith Vorr | “Steel takes heat, not excuses.” | “Collect two slag blooms and one cool rivet.” | “The rivet is true; the blooms are usable.” | “Your tool has a spine now.” | “Good tongs save fingers.” / “A bright edge is not a brave one.” / “Repair before pride.” | “I sell work, not arguments.” |
| Compact Speaker Ren | “The Ash Compact hears measured voices.” | “Bring three signed local ledgers from different starts.” | “Two seals agree; one remains.” | “The promise board is open to you.” | “Ash Seat is built on accounting.” / “A faction is not a homeland.” / “The Divide tests every route.” | “Return when you can speak without contempt.” |
| Tide Envoy Sava | “Tidehold receives honest travelers.” | “Carry a sealed water charter to The Divide.” | “The charter reached the wayhouse.” | “Your route is entered in the tide book.” | “Water chooses the low road.” / “Salt is a witness, not a weapon.” / “Treaties need maintenance.” | “No charter passes an insult.” |
| Faction Clerk Ves | “Forms first, heroics later.” | “Complete one local contract from each side of The Divide.” | “Three contracts filed; one stamp remains.” | “Your record earns a practical key.” | “Ink survives rain if sealed.” / “The board favors finished work.” / “A promise without a date is fog.” | “I close the ledger when voices rise.” |
| Roadkeeper Noll | “Road dust is honest; it shows who came through.” | “Repair two marker posts on Millstone Hollow Road.” | “One post still leans.” | “The road can carry a full cart again.” | “The Hollow was a mill before it was a warning.” / “Keep left at the split stone.” / “Quiet roads are rarely empty.” | “Walk away and return with a steadier step.” |

**Hub say/emote lines for each zone.** Reedfen: “Morning grain!” / “Mind the dike.” / “Mara is counting sacks.” / “Wheel’s turning.” / “Dry boots today.” / “Share the shade.” / “That fog came early.” / “Pathwarden saw you.” / “Keep the hearth fed.” / “Welcome home.” Lampwood: “Trim the wick.” / “Blue light tonight.” / “Mark the corner.” / “No running near oil.” / “Cal heard the bell.” / “The coppice is quiet.” / “Moths are thick.” / “Take the lit path.” / “Wickhaven sleeps lightly.” / “Good evening.” Brinewatch: “Tide’s rising.” / “Mind the coil.” / “Fresh catch!” / “Nesh is reading stakes.” / “Tie twice.” / “The flats shifted.” / “Pell needs hands.” / “Keep the pier clear.” / “Water keeps count.” / “Safe return.” Granite Stair: “Show the seam.” / “Stone above.” / “Cool the tool.” / “Gate is open.” / “Dust in the air.” / “Kell wants a slate.” / “Vorr has work.” / “Do not lean there.” / “Stairs hold.” / “Good footing.”

## 5) Premade choices / first hour

### Opening establishment decks

| Kit | Authored beats, including stake |
|---|---|
| Hearthborn | Wake beside a ration ledger; choose whether to spend one family meal or a stored seed pouch; meet Elder Mara; carry a wet grain sack; discover the mill’s missing tooth; choose public accusation or quiet inspection; stake: helping the mill delays your family’s planting. |
| Lanternfolk | Trim a failing wick; choose your last reserve oil or let a lane go dark; meet Cal; follow a moth trail; hear a false bell; stake: saving the night line risks losing your personal travel light. |
| Saltkin | Find a tide stake out of sequence; choose to warn the pier or finish your own catch; meet Nesh; read three marks; confront a smuggler’s false charter; stake: exposing the lie may close your family’s stall. |
| Stonevein | Hear a settling stair; choose to brace a public arch or protect a family tool; meet Kell; expose a hairline fault; bring Vorr a rivet; stake: the safe repair consumes your first paid commission. |

HookArc flags are `identity_confirmed`, `first_choice`, and `observed_consequence`. Each opening writes all three after the player sees the committed consequence.

**Grounded choice buttons.** Reedfen uses `inspect_mill_tooth` (requires `fen_mill`, intent `investigate`), `deliver_dry_reeds` (requires `dry_reed_sheaf_x3`, `craft`), `ask_mara_for_witness` (requires `elder_mara`, `talk`), `brace_dike_post` (requires `reed_rope_x1`, `fight_move` only if pests are present), `follow_wet_tracks` (requires `reedfen_dike`, `investigate`), and `open_family_sack` (requires `seed_pouch_x1`, `stake`). Lampwood uses `trim_blue_wick`, `choose_reserve_oil`, `mark_coppice_post`, `question_cal`, `follow_moth_trail`, and `enter_unlit_hollow`. Brinewatch uses `read_tide_stake`, `warn_pier`, `deliver_coilfish`, `compare_charter_seals`, `tie_causeway_rope`, and `question_nesh`. Granite Stair uses `brace_arch`, `show_crack`, `collect_slag_bloom`, `cool_rivet`, `ask_kell`, and `enter_fault_gallery`.

**Tutorial forced path:** choose kit → confirm identity → perform one safe local task → inspect a local anomaly → make the stake choice → resolve one instanced combat tutorial → return to the durable NPC → receive the first travel marker. Alternate characters may skip after `identity_confirmed`.

**Retry beat deck.** `fen_sack`: goal restore grain, tactic dry storage, obstacle sudden drizzle, revelation cellar vent is open, consequence one sack saved; `wick_bell`: goal light lane, tactic replace cord, obstacle bell wire is cut, revelation moths follow heat, consequence lane stays dim but safe; `tide_mark`: goal verify stake, tactic compare chalk, obstacle tide erases lower line, revelation upper notch is fresh, consequence warning is credible; `stair_seam`: goal stabilize step, tactic wedge slate, obstacle load shifts, revelation crack is old but growing, consequence arch is closed; `road_post`: goal mark route, tactic hammer beacon, obstacle ash wind, revelation second post was moved, consequence travel takes longer; `mill_tooth`: goal restore wheel, tactic fit spare, obstacle warped axle, revelation grain is damp, consequence output is reduced; `charter_seal`: goal expose false seal, tactic water test, obstacle ink runs, revelation paper stock is local, consequence smuggler flees; `hollow_breath`: goal survive room, tactic listen before entry, obstacle ash pulses, revelation source is a blocked vent, consequence checkpoint is established.

## 6) Quests: code-completeable DAGs

Rewards are numeric gold and XP. All objectives are ledger-resolvable.

### Reedfen authored beats

| ID | Title | Family | Hidden | Unlock | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `hearthborn_request` | The Hearthborn’s Request | race_identity | false | — | `talk_to_npc:elder_mara:1`; `deliver_item:seed_pouch:1` | 12 | 40 |
| `reedfen_shared_loaf` | A Loaf Measured Four Ways | race_identity | false | `hearthborn_request` | `collect_item:grain_sack:2`; `talk_to_npc:elder_mara:1` | 10 | 35 |
| `fen_name_stone` | Name on the Millstone | race_identity | false | `reedfen_shared_loaf` | `visit_place:fen_mill:1`; `collect_item:clay_name_tag:1` | 14 | 45 |
| `millers_first_tooth` | Miller’s First Tooth | profession | false | `hearthborn_request` | `collect_item:reed_sheaf_dry:3`; `deliver_item:mill_tooth_spare:1` | 18 | 60 |
| `wheel_under_rain` | Wheel Under Rain | profession | false | `millers_first_tooth` | `visit_place:reedwheel_yard:1`; `collect_item:axle_pin:2` | 22 | 70 |
| `measure_the_sacks` | Measure the Sacks | profession | false | `wheel_under_rain` | `talk_to_npc:miller_tobin:1`; `collect_item:grain_sack:5` | 25 | 80 |
| `miller_quiet_contract` | Tobin’s Quiet Contract | profession | false | `measure_the_sacks` | `deliver_item:sealed_flour_ledger:1`; `talk_to_npc:faction_clerk_ves:1` | 30 | 95 |
| `keep_the_path_lit` | Keep the Path Lit | zone_story | false | `hearthborn_request` | `visit_place:reedfen_dike:1`; `collect_item:reed_rope:2` | 16 | 55 |
| `dike_nail_count` | Nails in the Dike | zone_story | false | `keep_the_path_lit` | `collect_item:dike_nail:4`; `talk_to_npc:pathwarden_sila:1` | 20 | 65 |
| `fog_on_the_thatch` | Fog on the Thatch | zone_story | false | `dike_nail_count` | `visit_place:reedfen_thatch:1`; `ledger_kill:ash_mite:4` | 24 | 85 |
| `lampwood_gate_breadcrumb` | A Gate Beyond Reeds | dungeon_breadcrumb | false | `keep_the_path_lit` | `visit_place:lampwood_gate_door:1`; `collect_item:gate_wax_rubbing:1` | 28 | 90 |
| `hearth_aunt_pels_request` | Aunt Pel’s Drying Rack | side | false | `millers_first_tooth` | `collect_item:drying_slats:3`; `deliver_item:reed_rope:1` | 11 | 38 |
| `three_sacks_daily` | Three Sacks Before Sundown | daily | false | `measure_the_sacks` | `collect_item:grain_sack:3` | 8 | 25 |
| `mara_trust_under_ash` | Trust Under Ash | hidden | true | `fog_on_the_thatch` | `talk_to_npc:elder_mara:1`; `visit_place:reedfen_dike:1`; `deliver_item:unmarked_seal:1` | 40 | 120 |
| `reedfen_route_stamp` | Stamp the Fen Route | travel | false | `mara_trust_under_ash` | `visit_place:divide_wayhouse:1`; `deliver_item:reedfen_route_ledger:1` | 35 | 100 |
| `local_pest_census` | Census of Small Teeth | side | false | `fog_on_the_thatch` | `ledger_kill:ash_mite:6`; `collect_item:milled_chitin:2` | 15 | 50 |
| `cartwrights_wheel_song` | Cartwright’s Wheel Song | profession | false | `wheel_under_rain` | `talk_to_npc:cartwright_oda:1`; `collect_item:wheel_spoke:4` | 20 | 65 |
| `fen_to_divide` | Road to The Divide | travel | false | `reedfen_route_stamp` | `visit_place:divide_wayhouse:1`; `talk_to_npc:roadkeeper_noll:1` | 45 | 130 |

### Lampwood authored beats

| ID | Title | Family | Hidden | Unlock | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `lanternfolk_first_wick` | The First Wick | race_identity | false | — | `talk_to_npc:wick_tender_cal:1`; `collect_item:blue_wick_fiber:2` | 12 | 40 |
| `lampwood_reflection` | A Face in Blue Glass | race_identity | false | `lanternfolk_first_wick` | `visit_place:wickhaven:1`; `collect_item:blue_glass_shard:1` | 14 | 45 |
| `moth_oath` | The Moth Oath | race_identity | false | `lampwood_reflection` | `talk_to_npc:mothkeeper_ru:1`; `deliver_item:lamp_oath_tag:1` | 16 | 50 |
| `keep_the_path_lit` | Keep the Path Lit | zone_story | false | — | `visit_place:lampwood_coppice:1`; `collect_item:lamp_oil:2` | 16 | 55 |
| `blue_wick_line` | Blue Wick Line | profession | false | `lanternfolk_first_wick` | `collect_item:blue_wick_fiber:4`; `deliver_item:wick_bundle:1` | 20 | 65 |
| `oil_without_smoke` | Oil Without Smoke | profession | false | `blue_wick_line` | `collect_item:clear_oil:3`; `talk_to_npc:oil_seller_fen:1` | 24 | 75 |
| `cal_market_night` | Cal’s Market Night | profession | false | `oil_without_smoke` | `visit_place:wick_market:1`; `deliver_item:market_lantern:2` | 28 | 90 |
| `moths_at_the_fork` | Moths at the Fork | zone_story | false | `keep_the_path_lit` | `ledger_kill:ember_moth:5`; `collect_item:moth_wing_dust:2` | 22 | 70 |
| `bell_with_no_hand` | Bell with No Hand | zone_story | false | `moths_at_the_fork` | `visit_place:lampwood_fork:1`; `talk_to_npc:pathmarker_jen:1` | 26 | 82 |
| `unlit_hollow_breadcrumb` | Door Without a Flame | dungeon_breadcrumb | false | `bell_with_no_hand` | `visit_place:unlit_hollow_door:1`; `collect_item:black_wick_core:1` | 30 | 100 |
| `cal_trust_in_dark` | Cal’s Trust in Dark | hidden | true | `unlit_hollow_breadcrumb` | `talk_to_npc:wick_tender_cal:1`; `deliver_item:cal_old_lantern:1` | 42 | 125 |
| `lampwood_route_stamp` | Stamp the Lampwood Route | travel | false | `cal_trust_in_dark` | `visit_place:divide_wayhouse:1`; `deliver_item:lampwood_route_ledger:1` | 35 | 100 |
| `trim_the_line_daily` | Trim the Line | daily | false | `cal_market_night` | `collect_item:wick_clipping:5` | 8 | 25 |
| `mothkeeper_baskets` | Ru’s Quiet Baskets | side | false | `moths_at_the_fork` | `collect_item:moth_basket:3`; `deliver_item:moth_basket:3` | 15 | 50 |
| `lampwood_gate_signal` | Signal at the Gate | dungeon_breadcrumb | false | `lampwood_route_stamp` | `visit_place:lampwood_gate_door:1`; `talk_to_npc:gate_warden_bex:1` | 32 | 105 |
| `wickhaven_weather` | Weather in the Glass | side | false | `oil_without_smoke` | `collect_item:blue_glass_shard:3`; `talk_to_npc:lampwright_iona:1` | 18 | 60 |
| `night_line_daily` | Night Line Daily | daily | false | `blue_wick_line` | `collect_item:lamp_oil:3` | 8 | 25 |
| `lampwood_to_divide` | Road by Blue Flame | travel | false | `lampwood_route_stamp` | `visit_place:divide_wayhouse:1`; `talk_to_npc:roadkeeper_noll:1` | 45 | 130 |

### Brinewatch authored beats

| ID | Title | Family | Hidden | Unlock | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `flats_are_wrong` | The Flats Are Wrong | race_identity | false | — | `visit_place:tideline_flats:1`; `collect_item:tide_chalk:3` | 12 | 40 |
| `water_keeps_count` | Water Keeps Count | race_identity | false | `flats_are_wrong` | `talk_to_npc:tide_reader_nesh:1`; `collect_item:tide_stake_rubbing:2` | 15 | 48 |
| `brine_oath_mark` | Mark the Brine Oath | race_identity | false | `water_keeps_count` | `deliver_item:brine_oath_cord:1`; `talk_to_npc:fisher_pell:1` | 16 | 50 |
| `coilfish_first_cast` | Coilfish First Cast | profession | false | — | `collect_item:coilfish:5`; `deliver_item:coilfish:5` | 18 | 60 |
| `rope_under_tension` | Rope Under Tension | profession | false | `coilfish_first_cast` | `collect_item:coil_rope:3`; `talk_to_npc:ropewright_mera:1` | 22 | 70 |
| `pell_stall_ledger` | Pell’s Stall Ledger | profession | false | `rope_under_tension` | `deliver_item:stall_ledger:1`; `collect_item:coilfish:3` | 28 | 90 |
| `flats_are_wrong_again` | The Flats Are Wrong Again | zone_story | false | `flats_are_wrong` | `ledger_kill:brine_skitter:5`; `collect_item:skitter_shell:2` | 22 | 70 |
| `false_charter` | The False Charter | zone_story | false | `flats_are_wrong_again` | `visit_place:brine_causeway:1`; `talk_to_npc:watch_captain_aro:1` | 26 | 82 |
| `warehouse_breadcrumb` | Coil Warehouse Seal | dungeon_breadcrumb | false | `false_charter` | `visit_place:coil_warehouse_door:1`; `collect_item:warehouse_seal:1` | 30 | 100 |
| `nesh_trust_in_tide` | Nesh Trusts the Tide | hidden | true | `warehouse_breadcrumb` | `talk_to_npc:tide_reader_nesh:1`; `deliver_item:uninked_charter:1` | 42 | 125 |
| `brinewatch_route_stamp` | Stamp the Brine Route | travel | false | `nesh_trust_in_tide` | `visit_place:divide_wayhouse:1`; `deliver_item:brinewatch_route_ledger:1` | 35 | 100 |
| `pier_bell_daily` | Pier Bell Daily | daily | false | `pell_stall_ledger` | `collect_item:bell_rope_fiber:4` | 8 | 25 |
| `net_menders_count` | Count the Nets | side | false | `coilfish_first_cast` | `collect_item:net_knot:6`; `deliver_item:net_knot:6` | 15 | 50 |
| `causeway_posts` | Posts for the Causeway | side | false | `false_charter` | `collect_item:causeway_post:3`; `deliver_item:causeway_post:3` | 18 | 60 |
| `brinewatch_gate_signal` | Signal Across Water | dungeon_breadcrumb | false | `brinewatch_route_stamp` | `visit_place:coil_warehouse_door:1`; `talk_to_npc:watch_captain_aro:1` | 32 | 105 |
| `tide_stakes_three` | Three Tide Stakes | zone_story | false | `water_keeps_count` | `visit_place:tideline_flats:1`; `collect_item:tide_stake_rubbing:3` | 20 | 65 |
| `smugglers_empty_crate` | The Empty Crate | side | false | `false_charter` | `collect_item:empty_charter_crate:2`; `talk_to_npc:flat_scavenger_jo:1` | 17 | 55 |
| `brinewatch_to_divide` | Road by Low Water | travel | false | `brinewatch_route_stamp` | `visit_place:divide_wayhouse:1`; `talk_to_npc:roadkeeper_noll:1` | 45 | 130 |

### Granite Stair authored beats

| ID | Title | Family | Hidden | Unlock | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `stair_crack` | The Stair Has a Crack | race_identity | false | — | `visit_place:stair_face:1`; `collect_item:survey_slate:1` | 12 | 40 |
| `stonevein_seam` | Show the Seam | race_identity | false | `stair_crack` | `talk_to_npc:stair_oath_kell:1`; `collect_item:seam_rubbing:2` | 15 | 48 |
| `weight_of_name` | Weight of a Name | race_identity | false | `stonevein_seam` | `deliver_item:stone_name_plate:1`; `talk_to_npc:smith_vorr:1` | 16 | 50 |
| `smiths_first_rivet` | Smith’s First Rivet | profession | false | — | `collect_item:cool_rivet:1`; `collect_item:slag_bloom:2` | 18 | 60 |
| `brace_the_gallery` | Brace the Gallery | profession | false | `smiths_first_rivet` | `deliver_item:brace_bolt:3`; `visit_place:fault_gallery:1` | 22 | 70 |
| `vorrs_order` | Vorr’s Order | profession | false | `brace_the_gallery` | `collect_item:iron_blank:4`; `deliver_item:stair_rivet:2` | 28 | 90 |
| `load_below` | Load Below | zone_story | false | `stair_crack` | `ledger_kill:ash_crawler:5`; `collect_item:crawler_plate:2` | 22 | 70 |
| `fault_signal` | Fault Signal | zone_story | false | `load_below` | `visit_place:fault_gallery:1`; `talk_to_npc:survey_master_dain:1` | 26 | 82 |
| `anvil_deep_breadcrumb` | The Deep Anvil | dungeon_breadcrumb | false | `fault_signal` | `visit_place:anvil_deep_door:1`; `collect_item:deep_anvil_rubbing:1` | 30 | 100 |
| `kell_trust_in_stone` | Kell Trusts the Evidence | hidden | true | `anvil_deep_breadcrumb` | `talk_to_npc:stair_oath_kell:1`; `deliver_item:sealed_fault_report:1` | 42 | 125 |
| `granite_route_stamp` | Stamp the Stair Route | travel | false | `kell_trust_in_stone` | `visit_place:divide_wayhouse:1`; `deliver_item:granite_route_ledger:1` | 35 | 100 |
| `cooling_trough_daily` | Cooling Trough Daily | daily | false | `vorrs_order` | `collect_item:cooling_water:4` | 8 | 25 |
| `apprentice_yu_slates` | Yu’s Slate Stack | side | false | `stonevein_seam` | `collect_item:slate_tile:5`; `deliver_item:slate_tile:5` | 15 | 50 |
| `gate_warden_shift` | Gate Warden Shift | side | false | `load_below` | `talk_to_npc:gate_warden_bex:1`; `visit_place:anvil_gate:1` | 18 | 60 |
| `deep_anvil_signal` | Signal in the Deep | dungeon_breadcrumb | false | `granite_route_stamp` | `visit_place:anvil_deep_door:1`; `talk_to_npc:smith_vorr:1` | 32 | 105 |
| `stone_load_census` | Census of Stone Load | zone_story | false | `fault_signal` | `collect_item:load_tag:4`; `deliver_item:load_tag:4` | 20 | 65 |
| `ore_broker_dispute` | The Broker’s Measure | side | false | `vorrs_order` | `talk_to_npc:ore_broker_tel:1`; `collect_item:ore_sample:3` | 17 | 55 |
| `granite_to_divide` | Road Through the Stair | travel | false | `granite_route_stamp` | `visit_place:divide_wayhouse:1`; `talk_to_npc:roadkeeper_noll:1` | 45 | 130 |

### Campaign spine after starts

| ID | Title | Objectives | Gold | XP |
|---|---|---|---:|---:|
| `divide_four_ledgers` | Four Ledgers, One Table | `visit_place:divide_wayhouse:1`; `deliver_item:reedfen_route_ledger:1`; `deliver_item:lampwood_route_ledger:1`; `deliver_item:brinewatch_route_ledger:1`; `deliver_item:granite_route_ledger:1` | 60 | 180 |
| `promise_board_open` | The Promise Board | `talk_to_npc:faction_clerk_ves:1`; `collect_item:promise_seal:1` | 55 | 160 |
| `ash_seat_audience` | Audience at Ash Seat | `visit_place:ash_seat:1`; `talk_to_npc:compact_speaker_ren:1` | 70 | 210 |
| `tidehold_audience` | Audience at Tidehold | `visit_place:tidehold:1`; `talk_to_npc:tide_envoy_sava:1` | 70 | 210 |
| `the_divide_split` | The Divide Splits | `visit_place:divide_wayhouse:1`; `collect_item:split_marker:2` | 80 | 240 |
| `roadkeeper_warning` | Noll’s Warning | `talk_to_npc:roadkeeper_noll:1`; `visit_place:millstone_hollow_road:1` | 75 | 220 |
| `hollow_preparation` | Prepare the Hollow | `collect_item:checkpoint_lantern:2`; `deliver_item:mill_key:1` | 90 | 260 |
| `millstone_first_phase` | The Wheel That Counts | `visit_place:millstone_hollow_door:1`; `ledger_kill:ash_mite:8` | 100 | 300 |
| `millstone_second_phase` | Soot in the Gears | `collect_item:soot_gear:3`; `deliver_item:soot_gear:3` | 110 | 330 |
| `millstone_final_phase` | The Millwarden’s Measure | `ledger_kill:millwarden_construct:1`; `collect_item:compact_core:1` | 140 | 420 |
| `compact_repair` | Repair the Compact Seal | `deliver_item:compact_core:1`; `talk_to_npc:compact_speaker_ren:1` | 100 | 300 |
| `tide_charter` | Charter of Practical Water | `deliver_item:tide_charter:1`; `talk_to_npc:tide_envoy_sava:1` | 100 | 300 |
| `two_capitals_one_route` | Two Capitals, One Route | `visit_place:ash_seat:1`; `visit_place:tidehold:1`; `visit_place:divide_wayhouse:1` | 120 | 360 |
| `promise_of_maintenance` | A Promise of Maintenance | `talk_to_npc:compact_speaker_ren:1`; `talk_to_npc:tide_envoy_sava:1`; `collect_item:joint_seal:1` | 150 | 450 |

**Divergence records.** Walking away from `hollow_preparation` writes `divergence_record:delayed_hollow`; refusing the faction promise board writes `divergence_record:unfiled_promise`; choosing to side with neither capital after `two_capitals_one_route` writes `divergence_record:independent_route`. Each record stores the quest id, choice id, timestamp, and promised consequence; it is never silently discarded.

## 7) Species, opponents, and collectibles

Combat skins are region-specific original fauna or constructs. Base values are ledger data.

| Start | Species ID | Name | Rarity | Habitat | HP | ATK | AC |
|---|---|---|---|---|---:|---:|---:|
| Reedfen | `ash_mite` | Ash Mite | common | damp grain, dike cracks | 8 | 2 | 10 |
| Reedfen | `reedback_beetle` | Reedback Beetle | common | reed beds | 12 | 3 | 11 |
| Reedfen | `mud_crook` | Mud Crook | common | drainage banks | 14 | 4 | 11 |
| Reedfen | `sack_gnawer` | Sack Gnawer | uncommon | mill stores | 18 | 5 | 12 |
| Reedfen | `fen_loper` | Fen Loper | uncommon | fog paths | 20 | 6 | 12 |
| Reedfen | `grain_wisp` | Grain Wisp | rare | old silos | 24 | 7 | 13 |
| Reedfen | `dike_snapper` | Dike Snapper | rare | water gates | 30 | 8 | 14 |
| Reedfen | `wheelbound_husk` | Wheelbound Husk | epic | abandoned carts | 42 | 10 | 15 |
| Lampwood | `ember_moth` | Ember Moth | common | blue-wick coppice | 9 | 3 | 11 |
| Lampwood | `oil_licker` | Oil Licker | common | market lamps | 13 | 4 | 11 |
| Lampwood | `bark_whistler` | Bark Whistler | common | lampwood trunks | 15 | 4 | 12 |
| Lampwood | `wick_thief` | Wick Thief | uncommon | wick stalls | 19 | 6 | 12 |
| Lampwood | `glowcap_runner` | Glowcap Runner | uncommon | moss lanes | 22 | 6 | 13 |
| Lampwood | `glasswing_skein` | Glasswing Skein | rare | blue-glass groves | 28 | 8 | 14 |
| Lampwood | `hushlantern` | Hushlantern | rare | dark forks | 32 | 8 | 14 |
| Lampwood | `cinder_bell` | Cinder Bell | epic | old signal posts | 45 | 11 | 16 |
| Brinewatch | `brine_skitter` | Brine Skitter | common | tideline flats | 10 | 3 | 11 |
| Brinewatch | `coilfish` | Coilfish | common | warm pilings | 12 | 4 | 11 |
| Brinewatch | `salt_reed_crab` | Salt Reed Crab | common | shallow pools | 15 | 4 | 12 |
| Brinewatch | `charter_leecher` | Charter Leecher | uncommon | wet cargo | 20 | 6 | 13 |
| Brinewatch | `tide_clicker` | Tide Clicker | uncommon | tide stakes | 22 | 6 | 13 |
| Brinewatch | `silt_veil` | Silt Veil | rare | causeway shadow | 29 | 8 | 14 |
| Brinewatch | `pier_biter` | Pier Biter | rare | broken docks | 34 | 9 | 15 |
| Brinewatch | `brine_cask_golem` | Brine Cask Golem | epic | warehouse stacks | 48 | 11 | 16 |
| Granite Stair | `ash_crawler` | Ash Crawler | common | stair seams | 11 | 3 | 12 |
| Granite Stair | `slag flea` | Slag Flea | common | cooling troughs | 13 | 4 | 11 |
| Granite Stair | `dust nibber` | Dust Nibber | common | quarry ledges | 16 | 4 | 12 |
| Granite Stair | `ore snatcher` | Ore Snatcher | uncommon | market bins | 21 | 6 | 13 |
| Granite Stair | `seam skulk` | Seam Skulk | uncommon | fault galleries | 24 | 7 | 13 |
| Granite Stair | `iron echo` | Iron Echo | rare | old lifts | 30 | 8 | 14 |
| Granite Stair | `fault ram` | Fault Ram | rare | unstable arches | 37 | 9 | 15 |
| Granite Stair | `anvil revenant` | Anvil Revenant | epic | deep forge | 52 | 12 | 17 |

Collectibles include `reed_sheaf_dry`, `mill_tooth_spare`, `blue_wick_fiber`, `black_wick_core`, `tide_stake_rubbing`, `warehouse_seal`, `cool_rivet`, `slag_bloom`, `survey_slate`, `compact_core`, and `joint_seal`. None are named after a real-world franchise artifact.

## 8) Loot / economy

Gold is the only gameplay wallet. Cosmetic tokens are separate and never buy combat power, catch success, loot rolls, boss clears, lockout skips, or randomized power packs.

| Item ID | Category | Source | Function |
|---|---|---|---|
| `hearthborn_hatchet` | starter weapon | Reedfen | 4 base damage, ledger-owned |
| `lanternfolk_hookblade` | starter weapon | Lampwood | 4 base damage, ledger-owned |
| `saltkin_netknife` | starter weapon | Brinewatch | 4 base damage, ledger-owned |
| `stonevein_maul` | starter weapon | Granite Stair | 4 base damage, ledger-owned |
| `reedmantle_armor` | starter armor | Reedfen | AC +1 |
| `wickglass_coat` | starter armor | Lampwood | AC +1 |
| `brinecloak_armor` | starter armor | Brinewatch | AC +1 |
| `riveted_dustcoat` | starter armor | Granite Stair | AC +1 |
| `route_sketch_reedfen` | map | Reedfen | reveals local outline |
| `route_sketch_lampwood` | map | Lampwood | reveals local outline |
| `route_sketch_brinewatch` | map | Brinewatch | reveals local outline |
| `route_sketch_granite` | map | Granite Stair | reveals local outline |
| `milled_chitin` | profession output | Reedfen | sells for 3 gold |
| `wick_bundle` | profession output | Lampwood | sells for 4 gold |
| `coil_rope` | profession output | Brinewatch | sells for 4 gold |
| `stair_rivet` | profession output | Granite Stair | sells for 5 gold |
| `millwarden_badge` | dungeon drop | Millstone Hollow | cosmetic title unlock |
| `cinder_accord_sash` | cosmetic | vendor | appearance only |

Personal-loot tables: common regional foes have a 60% chance of one material and 20% chance of a 1–3 gold purse; uncommon foes have a 75% material chance and 25% chance of a recipe fragment; rare foes have a 100% material chance and 20% cosmetic chance; epic foes have a guaranteed named cosmetic or profession component. Room drops are `lampwood_gate_wax`, `unlit_hollow_blackwick`, `coil_warehouse_seal`, `anvil_deep_rivet`, and `millwarden_badge`.

Vendor catalogs include Tobin’s `fen_mill_supply_catalog` (reed sheaves 3g, grain sack 5g, repair oil 4g), Cal’s `wickhaven_light_catalog` (clear oil 4g, blue fiber 5g, lamp hood 12g), Pell’s `brinewatch_line_catalog` (coil line 4g, tide chalk 3g, net knife 16g), Vorr’s `anvil_gate_tool_catalog` (cool rivet 5g, brace bolt 7g, sharpening stone 10g), and Ves’s `divide_wayhouse_travel_catalog` (route map 12g, checkpoint lantern 15g, seal case 18g). `repairCostPerPoint` is 2 gold. Gold faucets are quest rewards, profession sales, and personal loot; sinks are repairs, recipe purchases, map purchases, and travel supplies. Daily quest gold is capped at 80 per character; weekly boss rewards are capped by lockout.

Collection log entries: `reedfen_fauna_log`, `lampwood_fauna_log`, `brinewatch_fauna_log`, `granite_stair_fauna_log`, `four_route_seals_log`, `millstone_phase_log`, `profession_output_log`, and `capital_promise_log`.

## 9) Instances

Every room is described before its encounter is revealed. Each 5-man is soloable with scaled encounter counts and checkpoint persistence.

### `lampwood_gate` — five-room 5-man

| Room | Description before creature | Encounter | Checkpoint / exits |
|---|---|---|---|
| `lampwood_gate_approach` | A damp gatehouse leans over a ditch; blue paint marks the safest stones. | `ember_moth` ×3 | start; exit `lampwood_gate_sluice` |
| `lampwood_gate_sluice` | Water ticks through a narrow sluice under iron grating. | `oil_licker` ×2 | exit `lampwood_gate_wickroom` |
| `lampwood_gate_wickroom` | Shelves of unlit wicks form a maze around a cold brazier. | `wick_thief` ×2, elite `cinder_bell` ×1 | checkpoint `lampwood_gate_cp`; exit `lampwood_gate_arch` |
| `lampwood_gate_arch` | A cracked arch opens onto a yard full of wind-bent signal poles. | `bark_whistler` ×3 | exit `lampwood_gate_keeper` |
| `lampwood_gate_keeper` | The gate’s central winch turns without a hand, pulling sparks from the stone. | elite `gate_wickwarden` ×1 | boss; exit `lampwood_coppice` |

### `unlit_hollow` — five-room 5-man

| Room | Description before creature | Encounter | Checkpoint / exits |
|---|---|---|---|
| `unlit_hollow_threshold` | A stair descends into a hollow where every wall absorbs flame. | `glowcap_runner` ×3 | start; exit `unlit_hollow_drain` |
| `unlit_hollow_drain` | A shallow drain carries warm ash beneath slate bridges. | `ash_mite` ×4 | exit `unlit_hollow_gallery` |
| `unlit_hollow_gallery` | Glassy roots cross a gallery of unlit lamps. | `glasswing_skein` ×2, elite `hushlantern` ×1 | checkpoint `unlit_hollow_cp`; exit `unlit_hollow_heart` |
| `unlit_hollow_heart` | A round chamber holds a wick core that pulses like a slow breath. | `oil_licker` ×3 | exit `unlit_hollow_warden` |
| `unlit_hollow_warden` | A stone lantern kneels over the core, its shutters opening by themselves. | elite `hollow_wickwarden` ×1 | boss; exit `lampwood_fork` |

### `coil_warehouse` — five-room 5-man

| Room | Description before creature | Encounter | Checkpoint / exits |
|---|---|---|---|
| `coil_warehouse_yard` | Cargo cranes stand in brine mist above a locked warehouse yard. | `brine_skitter` ×3 | start; exit `coil_warehouse_floor` |
| `coil_warehouse_floor` | Coiled rope towers leave only one dry aisle between them. | `charter_leecher` ×2 | exit `coil_warehouse_coldstore` |
| `coil_warehouse_coldstore` | Cold barrels sweat under a ceiling marked with false seals. | `tide_clicker` ×2, elite `pier_biter` ×1 | checkpoint `coil_warehouse_cp`; exit `coil_warehouse_manifest` |
| `coil_warehouse_manifest` | Wet ledgers float in a shallow basin around a broken desk. | `silt_veil` ×2 | exit `coil_warehouse_cistern` |
| `coil_warehouse_cistern` | A cistern gate strains against a mass of rope, shell, and timber. | elite `cask_gatekeeper` ×1 | boss; exit `brine_causeway` |

### `anvil_deep` — five-room 5-man

| Room | Description before creature | Encounter | Checkpoint / exits |
|---|---|---|---|
| `anvil_deep_lift` | A lift cage descends past old quarry marks into red dust. | `slag_flea` ×4 | start; exit `anvil_deep_shelf` |
| `anvil_deep_shelf` | A narrow shelf overlooks a dark cut in the mountain. | `ash_crawler` ×3 | exit `anvil_deep_gallery` |
| `anvil_deep_gallery` | Survey slates hang from chains beside a seam that glows faintly. | `seam_skulk` ×2, elite `iron_echo` ×1 | checkpoint `anvil_deep_cp`; exit `anvil_deep_forge` |
| `anvil_deep_forge` | A cold forge occupies the center of a chamber scarred by careful repairs. | `ore_snatcher` ×3 | exit `anvil_deep_heart` |
| `anvil_deep_heart` | A buried anvil has fused with the floor and pulls loose tools toward it. | elite `deep_anvil_keeper` ×1 | boss; exit `fault_gallery` |

### `millstone_hollow` — 10-man, three phases

**Phase 1, `millstone_outer_yard`:** The party enters a flooded mill yard before any foe is visible; eight `ash_mite` and two `sack_gnawer` emerge from grain chutes. The objective is to secure three wheel braces. **Phase 2, `millstone_gearhall`:** A gear hall is described as a tilted room of interlocking stone teeth; six `wheelbound_husk`, two `grain_wisp`, and elite `soot_cantor` appear. The party collects three `soot_gear` while keeping two water valves open. **Phase 3, `millstone_hollow_core`:** The core room is a circular mill chamber with a sealed roof and a motionless central axle; the elite boss `millwarden_construct` activates with two `ash_mite` reinforcements. The three-phase clear awards `compact_core`, `millwarden_badge`, and a personal cosmetic roll. Wipe returns to the phase checkpoint, and the instance remains a 10-person activity.

## 10) Progression

The `compact_stewardship_tree` contains no paid unlocks.

| Node ID | Cost | Requires | Effect flags |
|---|---:|---|---|
| `steady_grip` | 1 | — | `hp_max_plus_2` |
| `shared_ration` | 1 | `steady_grip` | `healing_item_plus_1` |
| `marked_corner` | 1 | — | `map_outline_radius_plus_1` |
| `blue_wick_memory` | 2 | `marked_corner` | `status_resist_blind` |
| `tide_ear` | 2 | — | `hazard_warning_tide` |
| `witnessed_oath` | 2 | `tide_ear` | `faction_gain_plus_1` |
| `show_the_seam` | 1 | — | `repair_cost_minus_1` |
| `patient_hammer` | 2 | `show_the_seam` | `armor_class_plus_1` |
| `fen_measure` | 2 | `shared_ration` | `profession_yield_plus_1` |
| `wick_measure` | 2 | `blue_wick_memory` | `profession_yield_plus_1` |
| `low_water_step` | 2 | `witnessed_oath` | `brine_hazard_resist` |
| `load_below` | 2 | `patient_hammer` | `stagger_resist` |
| `four_route_seal` | 3 | `fen_measure`,`wick_measure`,`low_water_step`,`load_below` | `travel_checkpoint_plus_1` |
| `compact_mediator` | 3 | `four_route_seal` | `choice_deck_mediator` |
| `hollow_reader` | 3 | `compact_mediator` | `instance_reveal_before_encounter` |
| `millwright_oath` | 4 | `hollow_reader` | `millstone_phase_bonus_cosmetic` |

Daily/weekly contracts are capped: `dike_post_round` (repair two posts, 12g), `wick_trim_route` (collect five clippings, 12g), `pier_catch_share` (deliver five coilfish, 12g), `stair_cooling_round` (collect four cooling water, 12g), and weekly `promise_board_rotation` (complete one contract for each faction, 60g and 180 XP). These contracts cannot award power items or bypass lockouts.

## 11) Theme Kit + copy

`cinder_accord` uses charcoal, kiln red, reed green, tide blue, and chalk white; materials are soot-glazed ceramic, waxed cloth, river glass, rope fiber, and riveted iron. Dice look like thumb-worn ceramic cubes with one colored seam. Voice direction is intimate, practical, and observant: every line values maintenance over spectacle. Ambient loop: distant mill wheel, reed hiss, one three-note watch bell, and low water under wood. Fashion defaults to layered workwear, bright route sashes, weatherproof mantles, and tool charms; cosmetic variants never change combat values.

**Player-facing UI labels:** `Inventory` → “Satchel”; `Journal` → “Route Ledger”; `Map` → “Marked Roads”; `Quest Log` → “Open Promises”; `Party` → “Traveling Hands”; `Character` → “Hearth Record”; `Talents` → “Stewardship”; `Gold` → “Coin”; `Cosmetic Tokens` → “Glints”; `Instance Finder` → “Door Board”; `Checkpoint` → “Safe Mark”; `Loot` → “Personal Claim”; `Crafting` → “Workbench”; `Vendors` → “Stalls”; `Repair` → “Mend”; `Faction` → “Seal Standing”; `Daily Tasks` → “Today’s Rounds”; `Weekly Tasks` → “Long Rounds”; `Settings` → “Lamp Controls”; `Exit` → “Leave the Route”.

**New Game card hooks:**

1. “A mill tooth is missing, and the wet grain will not wait.”
2. “One blue flame is enough to make a road feel possible.”
3. “The tide has moved a marker that never moved before.”
4. “A stair crack is small only until someone trusts it.”
5. “Four ledgers can disagree without any of them being false.”
6. “The Divide is not a border; it is a test of maintenance.”
7. “Ash in the gears is still a local problem—until the wheel stops.”
8. “A sealed charter can protect a pier or conceal a theft.”
9. “The capitals want promises; the villages need repairs.”
10. “Bring proof, not a heroic story, and the Compact may open its door.”

## 12) Failures + John’s calls

| Clone risk / blocking call | Decision |
|---|---|
| Could feel like generic medieval faction fantasy. | Avoided through four materially distinct work cultures, ledger-driven local problems, and maintenance-centered stakes. |
| Could resemble a famous ash or ring apocalypse. | No world-ending relic, no chosen heir, no iconic artifact, and no borrowed names or plot beats. |
| Could turn Saltkin into a creature category. | Locked as a playable race only; no creature or enemy uses that name. |
| Could make Ash Compact or Tide Covenant into regions. | Both remain factions; regions are Reedfen, Lampwood, Brinewatch, Granite Stair, The Divide, Ash Seat, and Tidehold. |
| Capital walking content is not specified beyond hub function. | Default chosen: both capitals are fully traversable safe hubs with vendors, promise boards, archives, faction dialogue, and no combat during the start campaign; expanded capital quest arcs are speculative future content. |

### Integrity checklist

1. `worldId` is stable snake case.
2. Display name preserves the locked name Ash Compact.
3. The four locked playable races are used exactly.
4. No fifth playable race is introduced.
5. Ash Compact is a faction, not a region.
6. Tide Covenant is a faction, not a region.
7. Saltkin is never used as a creature name.
8. The four locked starts are present.
9. The four locked hubs are represented.
10. The Divide is the mid-world join.
11. Ash Seat and Tidehold are both present.
12. All four named 5-mans are preserved.
13. Millstone Hollow remains a 10-man.
14. Millstone Hollow has three phases.
15. Every 5-man has five rooms.
16. Every instance describes its room before its creature.
17. Every quest objective is code-completeable.
18. Quest rewards are numeric.
19. Durable NPCs have canned dialogue.
20. Premium cannot buy combat outcomes, catch success, or lockout skips.

**File status:** Complete content-only pack; no live service, save, prompt, database, or production application code is included.
