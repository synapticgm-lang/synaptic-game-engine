# WOF World Pack: Bonded Menagerie

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `bonded_menagerie` |
| Display name | Bonded Menagerie |
| Pitch | A gentle-but-demanding frontier of habitats where caretakers earn trust from remarkable fauna and restore a living migration web. |
| Maturity | all-ages |
| `rulesModuleId` | `bond_type` |
| Theme Kit | `fieldglass_copper` |
| Genre pattern and fence | Creature-bonding ranch adventure with typed encounters; **this is not a monster-catching franchise, a creature-trading game, or a licensed series.** |

**Ban-list.** The following genre-associated names, terms, mascots, slogans, and lookalikes are prohibited in this pack: Pokémon, Pikachu, Poké Ball, Pokédex, PokéStop, PokéGym, Team Rocket, Ash Ketchum, Misty, Brock, Charmander, Bulbasaur, Squirtle, Eevee, Mewtwo, Jigglypuff, Snorlax, Magikarp, Gyarados, Lucario, Greninja, Charizard, Raichu, Meowth, Psyduck, Togepi, PokéCenter, gotta catch ’em all, Palworld, Pal, Pal Sphere, Lamball, Cattiva, Depresso, Foxparks, Chillet, Daedream, Grizzbolt, Lovander, Jetragon, Digimon, Digivice, Agumon, Gabumon, Tamagotchi, Monster Rancher, Shin Megami Tensei, Persona, Yo-kai Watch, Yokai, Temtem, Nexomon, Coromon, Dragon Quest Monsters, cassette monsters, creature capsules, battle gym, elemental badge, licensed mascot, franchise ball, or any renamed imitation of these.

All peoples, fauna, places, items, slogans, and plot beats below are original. The setting uses a **handmade field-lore** aesthetic: animals are partners with agency, not inventory prizes.

## 1) Rules module: `bond_type`

The code ledger owns `hp`, `base_atk`, `ac`, `bond`, `bond_rank`, `type`, `habitat_tags`, `injury_ticks`, `capture_state`, `ranch_slot`, `quest_state`, `gold`, `cosmetic_tokens`, `instance_checkpoint`, and `weekly_boss_lockout`. A player carries one active companion and may stable three more; companions cannot be traded between players at soft launch. Personal loot is assigned after state commit.

Combat resolves in lockstep rounds. Bond attempts require a weakened-but-safe target, a valid habitat tool, and a completed consent action; failure never removes a creature from the world. Wipe returns the party to the last checkpoint with all committed progress intact. A five-person-equivalent instance supports 1–5 players and has one weekly boss lockout per character; trial instances have no loss of permanent creatures. The big instance uses a weekly migration permit.

Prose may not invent damage, HP, bond success, loot, catch success, quest completion, type advantage, ranch capacity, or score. Prose describes sensory detail and choices only after the ledger commits results. No NPC promises a reward without a numeric quest record.

### Copy-pasteable diegetic chrome templates

```text
[FIELDGLASS] Bond attempt: {creatureName} | consent: {ready/not_ready} | habitat tool: {toolName} | outcome: {ledgerOutcome}
[FIELDGLASS] Type read: {attackerType} into {defenderType} | multiplier: {multiplier} | round: {roundNumber}
[FIELDGLASS] Ranch note: {creatureName} moved to {paddockName} | bond rank: {bondRank} | care tick: {careState}
[FIELDGLASS] Trail permit: {instanceName} | checkpoint: {checkpointId} | companions safe: {safeCount}
[FIELDGLASS] Migration board: {routeName} | phase: {phase} | contribution: {contributionState}
[FIELDGLASS] Journal update: {objectiveText} | status: {objectiveStatus}
```

## 2) Identity kits

| Kit ID | Look and values | Taboo and speech tell | Starter clothes / weapon | Start / first quest / ability flag | Originality note |
|---|---|---|---|---|---|
| `reed_listener` | Weather-soft cloak, patient observer, values consent and pattern-reading | Never whistles at a frightened animal; says “let the ground answer” | Moss poncho, reed staff | `reedfen` / `bm_reed_identity_01` / `ability_read_tracks` | An original field naturalist kit, not a renamed licensed trainer. |
| `saltwind_keeper` | Sun-browned coat, practical and communal, values reliable routes | Never counts a creature as property; says “shared shelter first” | Canvas wrap, tide hook | `saltmarsh` / `bm_salt_identity_01` / `ability_tide_sense` | An original wetland caretaker, not a sailor or franchise archetype. |
| `cinder_grazer` | Soot-red scarf, bold and playful, values repair and bravery | Never enters a burrow uninvited; says “warm hands, quiet feet” | Quilted vest, ember crook | `redsteppe` / `bm_red_identity_01` / `ability_heat_read` | An original steppe herder kit with no licensed creature parallels. |
| `canopy_cartographer` | Leaf-dyed coat, precise and curious, values maps and reciprocity | Never cuts a living perch; says “mark the safe branch” | Climbing sash, prism sling | `cloudgrove` / `bm_cloud_identity_01` / `ability_canopy_route` | An original route-mapper kit, not a renamed woodland race. |

## 3) Map / places: full graph

The four field starts connect through `wayfarer_crossing` to the non-capital hub `hollowmere_ranch`; the end-of-start merge is `confluence_yard` and the two late hubs are `northglass_reserve` and `old_root_observatory`. Visited places show pins and names; outline places show only silhouettes and route edges. Streets use pins, while indoor structures use floor-plan nodes. Instance doors are explicit places, and shop interiors never display a distant-world scale.

| Zone | POI ID | Public name | Scale / danger / outdoor | Exits | NPCs | Optional dungeon |
|---|---|---|---|---|---|---|
| Reedfen | `reedfen_gate` | Reedfen Gate | street / safe / yes | `reedfen_boardwalk`,`reedfen_mudglass` | `npcs_mara`,`npcs_olin` | — |
| Reedfen | `reedfen_boardwalk` | Longwater Boardwalk | street / low / yes | `reedfen_gate`,`reedfen_nestbank`,`reedfen_watchhut` | `npcs_olin`,`npcs_bram` | — |
| Reedfen | `reedfen_mudglass` | Mudglass Flats | street / low / yes | `reedfen_gate`,`reedfen_mirrorpond`,`reedfen_trialdoor` | `npcs_vessa`,`npcs_mara` | `trial_mudglass_turns` |
| Reedfen | `reedfen_nestbank` | Nestbank Levee | street / medium / yes | `reedfen_boardwalk`,`reedfen_mirrorpond` | `npcs_bram`,`npcs_sella` | — |
| Reedfen | `reedfen_mirrorpond` | Mirrorpond | street / low / yes | `reedfen_mudglass`,`reedfen_nestbank`,`wayfarer_crossing` | `npcs_sella`,`npcs_olin` | — |
| Reedfen | `reedfen_watchhut` | Watchhut | dungeon / low / no | `reedfen_boardwalk` | `npcs_mara` | — |
| Saltmarsh | `saltmarsh_pier` | Saltmarsh Pier | street / safe / yes | `saltmarsh_tideway`,`saltmarsh_brinegarden` | `npcs_jen`,`npcs_rusk` | — |
| Saltmarsh | `saltmarsh_tideway` | Tideway | street / low / yes | `saltmarsh_pier`,`saltmarsh_siltsteps`,`saltmarsh_trialdoor` | `npcs_jen`,`npcs_navo` | `trial_siltbell_run` |
| Saltmarsh | `saltmarsh_brinegarden` | Brinegarden | street / low / yes | `saltmarsh_pier`,`saltmarsh_lanternreed` | `npcs_rusk`,`npcs_pava` | — |
| Saltmarsh | `saltmarsh_siltsteps` | Siltsteps | street / medium / yes | `saltmarsh_tideway`,`saltmarsh_lanternreed` | `npcs_navo`,`npcs_jen` | — |
| Saltmarsh | `saltmarsh_lanternreed` | Lanternreed | street / low / yes | `saltmarsh_brinegarden`,`saltmarsh_siltsteps`,`wayfarer_crossing` | `npcs_pava`,`npcs_rusk` | — |
| Redsteppe | `redsteppe_gate` | Redsteppe Gate | street / safe / yes | `redsteppe_dustroad`,`redsteppe_emberbasin` | `npcs_tarr`,`npcs_mai` | — |
| Redsteppe | `redsteppe_dustroad` | Ribbon Dustroad | street / low / yes | `redsteppe_gate`,`redsteppe_hoofyard`,`redsteppe_trialdoor` | `npcs_mai`,`npcs_kesh` | `trial_emberhoop` |
| Redsteppe | `redsteppe_emberbasin` | Emberbasin | street / medium / yes | `redsteppe_gate`,`redsteppe_glassshade` | `npcs_tarr`,`npcs_ves` | — |
| Redsteppe | `redsteppe_hoofyard` | Hoofyard | street / low / yes | `redsteppe_dustroad`,`redsteppe_glassshade` | `npcs_kesh`,`npcs_tarr` | — |
| Redsteppe | `redsteppe_glassshade` | Glassshade | dungeon / low / no | `redsteppe_emberbasin`,`redsteppe_hoofyard`,`wayfarer_crossing` | `npcs_ves`,`npcs_mai` | — |
| Cloudgrove | `cloudgrove_rootlift` | Rootlift | street / safe / yes | `cloudgrove_highwalk`,`cloudgrove_mothcourt` | `npcs_aya`,`npcs_fenn` | — |
| Cloudgrove | `cloudgrove_highwalk` | Highwalk | street / low / yes | `cloudgrove_rootlift`,`cloudgrove_raincut`,`cloudgrove_trialdoor` | `npcs_fenn`,`npcs_iro` | `trial_raincut_roost` |
| Cloudgrove | `cloudgrove_mothcourt` | Mothcourt | street / low / yes | `cloudgrove_rootlift`,`cloudgrove_raincut` | `npcs_aya`,`npcs_lune` | — |
| Cloudgrove | `cloudgrove_raincut` | Raincut | street / medium / yes | `cloudgrove_highwalk`,`cloudgrove_mothcourt`,`cloudgrove_seedvault` | `npcs_iro`,`npcs_fenn` | — |
| Cloudgrove | `cloudgrove_seedvault` | Seedvault | dungeon / low / no | `cloudgrove_raincut`,`wayfarer_crossing` | `npcs_lune`,`npcs_aya` | — |
| Shared | `wayfarer_crossing` | Wayfarer Crossing | street / safe / yes | all four gates, `hollowmere_ranch` | `npcs_ves`,`npcs_rusk` | — |
| Shared | `hollowmere_ranch` | Hollowmere Ranch | street / safe / yes | `wayfarer_crossing`,`confluence_yard`,`northglass_reserve` | `npcs_arden`,`npcs_toma`,`npcs_yul` | — |
| Shared | `confluence_yard` | Confluence Yard | street / safe / yes | `hollowmere_ranch`,`old_root_observatory` | `npcs_arden`,`npcs_toma` | `big_migration_night` |
| Shared | `northglass_reserve` | Northglass Reserve | street / medium / yes | `hollowmere_ranch`,`old_root_observatory` | `npcs_yul`,`npcs_arden` | `big_migration_night` |
| Shared | `old_root_observatory` | Old Root Observatory | dungeon / medium / no | `confluence_yard`,`northglass_reserve` | `npcs_toma`,`npcs_yul` | `big_migration_night` |

There are **eight named trial instances**: `trial_mudglass_turns`, `trial_siltbell_run`, `trial_emberhoop`, `trial_raincut_roost`, `trial_mirrorpond_lullaby`, `trial_cinderburrow`, `trial_rootlift_spiral`, and `trial_northglass_crossing`.

## 4) Durable NPCs and canned talk

Each start has six durable NPCs; shared ranch staff provide the hub. The same fixed talk schema is used for every quest-giver and merchant.

| ID | Name | Place | Role |
|---|---|---|---|
| `npcs_mara` | Mara Quill | `reedfen_gate` | quest |
| `npcs_olin` | Olin Vetch | `reedfen_boardwalk` | profession |
| `npcs_bram` | Bram Sedge | `reedfen_nestbank` | local |
| `npcs_sella` | Sella Pruin | `reedfen_mirrorpond` | merchant |
| `npcs_vessa` | Vessa Noon | `reedfen_mudglass` | quest |
| `npcs_jen` | Jen Tidepin | `saltmarsh_pier` | quest |
| `npcs_rusk` | Rusk Bell | `saltmarsh_brinegarden` | profession |
| `npcs_navo` | Navo Pell | `saltmarsh_siltsteps` | local |
| `npcs_pava` | Pava Brine | `saltmarsh_lanternreed` | merchant |
| `npcs_tarr` | Tarr Redleaf | `redsteppe_gate` | quest |
| `npcs_mai` | Mai Soot | `redsteppe_dustroad` | profession |
| `npcs_kesh` | Kesh Dovetail | `redsteppe_hoofyard` | local |
| `npcs_ves` | Ves Arclay | `redsteppe_glassshade` | merchant |
| `npcs_aya` | Aya Cloudpin | `cloudgrove_rootlift` | quest |
| `npcs_fenn` | Fenn Rill | `cloudgrove_highwalk` | profession |
| `npcs_iro` | Iro Mossbell | `cloudgrove_raincut` | local |
| `npcs_lune` | Lune Vey | `cloudgrove_seedvault` | merchant |
| `npcs_arden` | Arden Vale | `hollowmere_ranch` | hub |
| `npcs_toma` | Toma Reed | `confluence_yard` | quest |
| `npcs_yul` | Yul Northglass | `northglass_reserve` | merchant |

### Premade talk trees

The following complete tree applies to each NPC, with speaker-specific lines in the table. Every quest-giver and merchant has all six branches; local and hub staff use the same branches when addressed.

| NPC | greet | quest_offer | quest_progress | quest_turnin | gossip (three lines) | refusal / player-rude |
|---|---|---|---|---|---|---|
| Mara Quill | “Boots on the boardwalk, keeper.” | “The nestbank is quiet in the wrong way. Will you read it?” | “You found the broken reeds; good.” | “Your notes give the marsh a future.” | “Frogs hear storms first.” / “Mara means patience.” / “The old levee remembers feet.” | “Come back when your voice is kinder.” |
| Olin Vetch | “A clean reed makes a clean perch.” | “Bring three dry reeds and I’ll weave a rest sling.” | “Two reeds hold; one more makes it safe.” | “The sling is yours: mend before replacing.” | “Mudglass catches moonlight.” / “Never rush a hatchling.” / “Knots tell stories.” | “I do not craft for cruelty.” |
| Bram Sedge | “You hear that? Exactly.” | “A skitter trail crosses the levee; mark it, don’t chase it.” | “Your marks match my slate.” | “The route is safe for one more night.” | “Sedge birds sleep standing.” / “Levee stones warm slowly.” / “I name every nest.” | “Mock the animals and you lose my help.” |
| Sella Pruin | “Map ink, salve, and a fair measure.” | “Need a fieldglass? I stock the plain kind.” | “The lens survived the mist.” | “Keep it pointed at paths, not faces.” | “Trade is a promise.” / “Blue moss stains wool.” / “Ranchers gossip in weather.” | “No sale while you’re shouting.” |
| Vessa Noon | “The flats are breathing today.” | “A shy creature is trapped behind a fallen marker.” | “You moved the marker without breaking its den.” | “That is care, not conquest.” | “Flat water hides deep roots.” / “Quiet hands travel far.” / “Every trail has a return.” | “I will not send you where you refuse to listen.” |
| Jen Tidepin | “Mind the tide line, keeper.” | “Three shell bells went missing from the tideway.” | “The bells ring again.” | “The marsh can guide boats by sound.” | “Salt remembers rain.” / “Piers creak before storms.” / “A bell is a promise to return.” | “A rude keeper is a hazard.” |
| Rusk Bell | “Brine herbs, braided fresh.” | “Gather four brineleaf sprigs; I’ll make calm-feed.” | “The sprigs are clean.” | “Feed a companion, then wait.” | “Brinegarden is not a pantry.” / “Crabs dislike applause.” / “The tide writes sideways.” | “I serve patience, not tantrums.” |
| Navo Pell | “Silt holds every footprint.” | “Find which trail is flooding the nesting shelf.” | “You followed the water, not the rumor.” | “The shelf will dry by dusk.” | “Mud can be a map.” / “Eels dislike lantern glare.” / “I sleep with one ear open.” | “Leave if you will not hear me.” |
| Pava Brine | “Hooks, cord, and tideproof satchels.” | “A good keeper carries spare line.” | “The satchel held through the crossing.” | “May it carry care, not trophies.” | “Green glass means shallow water.” / “Dry socks are treasure.” / “Never tie a boat to a living root.” | “I won’t sell tools for harassment.” |
| Tarr Redleaf | “The red ground is warm underfoot.” | “A dust vent is startling the grazing herd.” | “You closed the vent with stone rings.” | “The herd can settle now.” | “Heat travels through hoofbeats.” / “Shade is shared.” / “Dust tastes different before rain.” | “Bravery without care is just noise.” |
| Mai Soot | “Ember cord, strong stitch.” | “Bring two cooled cinderpods for a heat-safe halter.” | “The cord is holding.” | “Use it loosely; trust needs room.” | “Soot marks honest work.” / “Basins sing at noon.” / “A halter is not a leash.” | “I mend gear, not bad manners.” |
| Kesh Dovetail | “Hooves on the west path.” | “Can you count the herd without crowding it?” | “Your count left room for uncertainty.” | “That is the right kind of accuracy.” | “Dust beetles roll at dusk.” / “Herds choose leaders.” / “Footprints cool in minutes.” | “I won’t help someone who corners animals.” |
| Ves Arclay | “Shadecloth, prism pins, small comforts.” | “A prism pin can warn a companion of hot ground.” | “The pin flashed at the right moment.” | “Keep it polished, keep it gentle.” | “Glassshade hums.” / “Red clay cracks beautifully.” / “Cool water first.” | “No trade with a bully.” |
| Aya Cloudpin | “Look up; the canopy is a road.” | “A seedpod courier is lost above the raincut.” | “You found the safe branch.” | “The courier returned without a torn wing.” | “Cloud roots drink mist.” / “Moths navigate by warmth.” / “The highest path is not always fastest.” | “Come down from that temper.” |
| Fenn Rill | “Cord, leafwax, and climbing sense.” | “Bring three leafwax knots for a rainproof perch.” | “The knots are snug, not tight.” | “A perch should flex.” | “Raincut makes its own weather.” / “Branches have moods.” / “Wax smells like green apples.” | “I won’t outfit a reckless climb.” |
| Iro Mossbell | “The grove is listening.” | “A bellroot patch was trampled; find the gentle route.” | “Your route leaves the roots whole.” | “The grove may ring again.” | “Moss drinks echoes.” / “Do not shout across nests.” / “Wind has a low voice.” | “Quiet is required here.” |
| Lune Vey | “Seed maps and soft gloves.” | “A canopy map is useful only if it marks danger.” | “The danger notes are clear.” | “Keep the map open to revision.” | “Mothcourt is older than the rails.” / “Seeds wait cleverly.” / “Ink beads on leafskin.” | “I sell maps to learners, not vandals.” |
| Arden Vale | “Hollowmere welcomes careful hands.” | “Four routes need caretakers before migration week.” | “Your field reports align.” | “The ranch has a place for your companion.” | “Ranch gates stay low.” / “Trust grows in chores.” / “A full trough is a kind of song.” | “No one is too important to clean a stall.” |
| Toma Reed | “The confluence is changing.” | “The migration markers disagree; will you reconcile them?” | “Three markers agree now.” | “The route can open safely.” | “Water joins without erasing.” / “Old maps can apologize.” / “Night work needs warm tea.” | “Return when you can discuss, not demand.” |
| Yul Northglass | “Reserve supplies, carefully priced.” | “A field kit keeps panic small.” | “The kit is complete.” | “Preparedness is kindness.” | “Northglass wind cuts clean.” / “Rare does not mean better.” / “Every shelf has a reason.” | “I close the counter to insults.” |

**Canned hub say/emote lines for Hollowmere Ranch:** “The troughs are full.” “A gate clicks softly.” “Someone brushes a patient flank.” “The west paddock smells of rain.” “A bell answers from the nursery.” “Arden checks the ledger twice.” “A companion chooses its own shade.” “The ranch dogs sleep under the cart.” “A route board gains a green pin.” “Hollowmere is busy being gentle.”

## 5) Premade choices / first hour

Each kit opens with five authored beats: `arrival`, `observation`, `stake`, `first_choice`, and `consequence`. The stake is explicit: a local habitat will close for the week if the player cannot identify the disturbance, stranding a seasonal migration. The four establishment decks are distinct: the reed listener hears an alarm pattern; the saltwind keeper chooses which tide gate to protect; the cinder grazer decides whether to cool a vent or escort a herd; the canopy cartographer chooses a safe branch route for a lost courier.

HookArc flags are `identity_confirmed`, `first_choice`, and `observed_consequence`. Example choice buttons include `read_wet_tracks` (requires `reedfen_mudglass`, intent `observe`), `offer_calm_feed` (requires `calm_feed`, intent `bond`), `brace_tide_bell` (requires `shell_bell`, intent `repair`), `circle_heat_vent` (requires `redsteppe_emberbasin`, intent `scout`), `mark_safe_branch` (requires `cloudgrove_highwalk`, intent `map`), `ask_mara_for_context` (requires `npcs_mara`, intent `talk`), `use_fieldglass` (requires `fieldglass`, intent `inspect`), and `retreat_to_gate` (requires the current place, intent `withdraw`). Combat buttons are `steady_strike`, `guard_companion`, `swap_companion`, and `end_encounter`; bond buttons are `lower_tool`, `place_feed`, `wait_for_signal`, and `record_consent`.

The forced tutorial path is `bm_tutorial_arrive` → `bm_tutorial_observe` → `bm_tutorial_stake` → `bm_tutorial_choice` → `bm_tutorial_safe_encounter` → `bm_tutorial_bond_or_leave` → `bm_tutorial_report` → `bm_tutorial_ranch_intro`; it is skippable on alternate characters after `identity_confirmed` is true.

Retry fingerprints are: `{goal: locate alarm, tactic: listen, obstacle: wind, revelation: rhythm repeats, consequence: route delayed}`; `{goal: save nestbank, tactic: carry reeds, obstacle: mud, revelation: dry footing is marked, consequence: one nest closes}`; `{goal: calm tideway, tactic: ring bell, obstacle: wrong pitch, revelation: shell order matters, consequence: water rises}`; `{goal: cool herd path, tactic: stack stones, obstacle: loose ash, revelation: vent has two mouths, consequence: herd circles}`; `{goal: guide courier, tactic: climb highwalk, obstacle: rain, revelation: branch flex is a signal, consequence: courier waits}`; `{goal: bond companion, tactic: offer feed, obstacle: fear, revelation: retreat builds trust, consequence: bond remains pending}`; `{goal: reconcile markers, tactic: compare maps, obstacle: old ink, revelation: tide shifted a pin, consequence: route requires survey}`; `{goal: protect migration, tactic: gather caretakers, obstacle: conflicting schedules, revelation: chores can be sequenced, consequence: reserve opens late}`.

## 6) Quests: code-completeable DAGs

All visible quests use objective verbs accepted by the ledger. The primary Reedfen start contains 20 beats; the other starts contain 18 each.

### Reedfen primary DAG

| ID | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `bm_reed_identity_01` | A Listener Arrives | identity | no | `bm_reed_identity_02` | `talk_to_npc:npcs_mara:1` | 10 | 40 |
| `bm_reed_identity_02` | Three Kinds of Quiet | identity | no | `bm_reed_identity_03` | `visit_place:reedfen_boardwalk:1`; `collect_item:reed_token:3` | 12 | 50 |
| `bm_reed_identity_03` | Mark the Living Trail | identity | no | `bm_reed_story_01` | `visit_place:reedfen_nestbank:1`; `collect_item:trail_chalk:2` | 15 | 65 |
| `bm_reed_prof_01` | Dry Reed, Strong Loop | profession | no | `bm_reed_prof_02` | `collect_item:dry_reed:3`; `talk_to_npc:npcs_olin:1` | 12 | 45 |
| `bm_reed_prof_02` | Mudglass Cord | profession | no | `bm_reed_prof_03` | `collect_item:mudglass_fiber:4` | 16 | 60 |
| `bm_reed_prof_03` | Rest Sling | profession | no | `bm_reed_prof_04` | `deliver_item:rest_sling:1:npcs_olin` | 22 | 80 |
| `bm_reed_prof_04` | Weatherproof Note | profession | no | `bm_reed_story_03` | `collect_item:reed_paper:5`; `visit_place:reedfen_watchhut:1` | 25 | 90 |
| `bm_reed_story_01` | The Flats Are Shifting | zone_story | no | `bm_reed_story_02` | `visit_place:reedfen_mudglass:1`; `collect_item:cracked_marker:2` | 18 | 75 |
| `bm_reed_story_02` | A Safe Way Through | zone_story | no | `bm_reed_trial_01` | `ledger_kill:mireclack:3`; `visit_place:reedfen_mirrorpond:1` | 26 | 105 |
| `bm_reed_story_03` | Alarm Under the Levee | zone_story | no | `bm_reed_trial_01` | `talk_to_npc:npcs_bram:1`; `collect_item:levee_pin:3` | 30 | 120 |
| `bm_reed_trial_01` | Mudglass Turns | dungeon | no | `bm_reed_campaign_01` | `visit_place:reedfen_trialdoor:1`; `ledger_bond:glimmernewt:1` | 45 | 180 |
| `bm_reed_side_01` | Sella’s Lens | side | no | `bm_reed_side_02` | `deliver_item:fieldglass:1:npcs_sella` | 20 | 70 |
| `bm_reed_side_02` | Pin the Fog | side | no | `bm_reed_daily_01` | `visit_place:reedfen_mirrorpond:1`; `collect_item:fog_pin:4` | 24 | 85 |
| `bm_reed_daily_01` | Boardwalk Round | daily | no | — | `visit_place:reedfen_boardwalk:1`; `collect_item:clean_reed:5` | 18 | 55 |
| `bm_reed_trust_01` | The Quiet Den | trust | yes | `bm_reed_trust_02` | `visit_place:reedfen_mudglass:1`; `ledger_bond:veilback:1` | 35 | 140 |
| `bm_reed_trust_02` | Leave the Door Open | trust | yes | `bm_reed_campaign_02` | `talk_to_npc:npcs_vessa:1`; `deliver_item:calm_feed:2:npcs_vessa` | 40 | 160 |
| `bm_reed_extra_01` | Nestbank Count | side | no | — | `collect_item:nest_mark:6` | 21 | 65 |
| `bm_reed_extra_02` | Lanterns at Dusk | side | no | — | `visit_place:reedfen_watchhut:1`; `collect_item:wick_moss:3` | 23 | 75 |
| `bm_reed_campaign_01` | Four Routes, One Promise | campaign | no | `bm_reed_campaign_02` | `visit_place:wayfarer_crossing:1`; `talk_to_npc:npcs_arden:1` | 50 | 200 |
| `bm_reed_campaign_02` | Hollowmere Calls | campaign | no | `bm_campaign_01` | `visit_place:hollowmere_ranch:1`; `deliver_item:migration_chart:1:npcs_arden` | 65 | 250 |

Saltmarsh uses `bm_salt_identity_01`, `bm_salt_prof_01`–`04`, `bm_salt_story_01`–`04`, `bm_salt_trial_01`, `bm_salt_side_01`–`03`, `bm_salt_daily_01`, `bm_salt_trust_01`–`02`, `bm_salt_extra_01`–`02`, and `bm_salt_campaign_01`–`02`; each objective is respectively a visit, collect, deliver, talk, ledger kill, or ledger bond against the IDs in its zone. Rewards are 10, 14, 18, 24, 30, 45, 16, 22, 28, 48, 18, 21, 17, 34, 39, 20, 23, 52, and 68 gold, with XP 40, 52, 70, 90, 120, 180, 60, 75, 95, 190, 65, 78, 52, 135, 155, 70, 82, 210, and 260. Redsteppe uses the equivalent distinct chain IDs `bm_red_*` and rewards 11, 15, 19, 25, 32, 47, 17, 23, 31, 50, 19, 24, 18, 36, 42, 22, 26, 56, and 72 gold, with XP 42, 55, 72, 94, 125, 185, 64, 80, 100, 200, 68, 84, 55, 142, 165, 74, 88, 220, and 275. Cloudgrove uses `bm_cloud_*` with rewards 12, 16, 20, 26, 34, 49, 18, 25, 33, 52, 20, 25, 19, 38, 44, 24, 28, 60, and 76 gold, with XP 44, 58, 75, 98, 130, 190, 68, 85, 106, 210, 72, 88, 58, 150, 175, 78, 94, 230, and 285. These are authored code records, not prose promises.

### Campaign spine after the starts

`bm_campaign_01` “The Shared Trough” (visit `hollowmere_ranch`, reward 70 gold/260 XP) → `bm_campaign_02` “Read Four Scentlines” (collect `scent_ribbon:4`, 75/280) → `bm_campaign_03` “The Quiet Gap” (ledger_kill `mireclack:4`, reward 82 gold/300 XP) → `bm_campaign_04` “Permit of Patience” (talk `npcs_arden`, 90/320) → `bm_campaign_05` “Northglass Survey” (visit `northglass_reserve`, 98/350) → `bm_campaign_06` “Broken Weather” (collect `stormseed:5`, 105/370) → `bm_campaign_07` “Root Observatory” (visit `old_root_observatory`, 112/390) → `bm_campaign_08` “The Listening Array” (deliver `array_spool:1` to `npcs_toma`, 120/420) → `bm_campaign_09` “Migration Night” (visit `confluence_yard`, 135/460) → `bm_campaign_10` “Keep the Corridor” (ledger_bond `crownmuzzle:1`, 150/500) → `bm_campaign_11` “A Better Boundary” (collect `living_marker:6`, 165/540) → `bm_campaign_12` “Hollowmere’s Open Gate” (talk `npcs_arden`, 185/600).

Divergence records are written, never silently forgotten: `walkaway_close_ranch` records refusal to expand ranch capacity; `walkaway_choose_fast_route` records a migration route bypassing one habitat; `walkaway_release_pending_bond` records leaving a creature unbonded. Each record changes journal text and later NPC reactions without changing the canonical safety rules.

## 7) Species, opponents, and collectibles

The eight type tags are `bloom`, `brine`, `cinder`, `gale`, `mire`, `stone`, `glimmer`, and `shade`. Type chart multipliers are: Bloom → Brine 1.25, Cinder 0.75; Brine → Cinder 1.25, Stone 0.75; Cinder → Bloom 1.25, Mire 0.75; Gale → Mire 1.25, Stone 0.75; Mire → Glimmer 1.25, Gale 0.75; Stone → Gale 1.25, Bloom 0.75; Glimmer → Shade 1.25, Brine 0.75; Shade → Glimmer 1.25, Cinder 0.75. Unlisted matchups are 1.00.

Bonding uses a `care_lure` tool, a habitat tag, a safe distance, and a consent signal. A successful bond records `bond_rank:1`; feeding, grooming, route work, and noncombat observation increase rank. There is no player-to-player creature trade at soft launch. The ranch has four starter paddocks, expandable to eight through gold-paid care licenses; cosmetic tokens never buy bond strength or catch outcomes.

### Original fauna catalog (64 creatures)

| ID | Name | Type | Rarity | Habitat tags | HP / Atk / AC | Ecology |
|---|---|---|---|---|---:|---|
| `reedwhisk` | Reedwhisk | mire | common | fen,boardwalk | 28/7/10 | Brushes reeds with whiskers to reveal safe water. |
| `mireclack` | Mireclack | stone | common | fen,levee | 34/8/11 | Clacks shell plates when mud pressure changes. |
| `glimmernewt` | Glimmernewt | glimmer | uncommon | pond,mist | 31/9/11 | Stores moonlight in translucent throat folds. |
| `veilback` | Veilback | shade | rare | flats,den | 45/11/12 | Folds its dark fins over sleeping nests. |
| `sedgekip` | Sedgekip | gale | common | fen,nestbank | 24/8/10 | Springs from sedge clumps to scatter insects. |
| `pondlilt` | Pondlilt | brine | common | pond,wetland | 30/7/10 | Sings ripples that guide hatchlings home. |
| `mudmantle` | Mudmantle | stone | uncommon | flats,levee | 52/10/13 | Carries cooling mud on a plated back. |
| `wispfin` | Wispfin | glimmer | rare | pond,night | 38/12/12 | Flashes a route when storms approach. |
| `fenburl` | Fenburl | bloom | common | fen,roots | 29/8/10 | Rolls seedballs into newly wet soil. |
| `tallreed` | Tallreed | gale | uncommon | boardwalk,marsh | 41/10/12 | Mimics wind to warn of strangers. |
| `shellmurmur` | Shellmurmur | brine | common | tideway,fen | 35/8/11 | Hears distant water through spiral shell. |
| `bankpouncer` | Bankpouncer | cinder | uncommon | levee,dust | 40/12/11 | Hunts nuisance beetles without trampling nests. |
| `tidewink` | Tidewink | glimmer | common | pier,brine | 26/7/10 | Winks bioluminescent spots at low tide. |
| `siltbell` | Siltbell | brine | uncommon | siltsteps,tideway | 44/10/12 | Rings its throat pouch when water is unsafe. |
| `brinehopper` | Brinehopper | gale | common | pier,marsh | 25/9/10 | Leaps between floating root mats. |
| `kelpquill` | Kelpquill | bloom | common | brinegarden | 33/8/11 | Grows edible fronds along its quills. |
| `saltmottle` | Saltmottle | shade | uncommon | lanternreed,silt | 39/10/12 | Camouflages itself as wet stone. |
| `foamjaw` | Foamjaw | stone | rare | tideway,pier | 57/13/13 | Breaks hard shellfish with gentle measured bites. |
| `marshcrown` | Marshcrown | glimmer | epic | brinegarden,night | 70/16/14 | Its crest maps safe channels during fog. |
| `reedskate` | Reedskate | gale | common | tideway,reed | 27/9/10 | Glides over shallow water on leaflike feet. |
| `saltcoil` | Saltcoil | brine | uncommon | siltsteps,pier | 43/11/12 | Braids itself around warm pilings. |
| `brinebloom` | Brinebloom | bloom | common | garden,wetland | 36/8/11 | Pollinates salt-tolerant flowers. |
| `tidecaper` | Tidecaper | cinder | rare | pier,storm | 49/14/12 | Sparks harmlessly before a tide surge. |
| `shellwing` | Shellwing | gale | common | coast,reed | 32/9/10 | Uses a shell sail to cross channels. |
| `siltmender` | Siltmender | mire | uncommon | siltsteps,garden | 46/9/13 | Filters cloudy water through belly vents. |
| `dustrill` | Dustrill | gale | common | steppe,road | 30/9/10 | Follows old hoof paths after rain. |
| `cinderpod` | Cinderpod | cinder | common | basin,ash | 27/10/10 | Stores safe warmth in seedlike plates. |
| `redhoof` | Redhoof | stone | uncommon | steppe,hoofyard | 50/12/12 | Stamps a warning rhythm for its herd. |
| `embermole` | Embermole | cinder | uncommon | basin,burrow | 42/12/11 | Digs cooling channels under hot ground. |
| `glasshare` | Glasshare | glimmer | rare | glassshade,dust | 37/13/11 | Reflects moonlight to confuse predators. |
| `ashpuff` | Ashpuff | shade | common | basin,shade | 29/8/10 | Exhales soot clouds to hide young. |
| `hoopwing` | Hoopwing | gale | common | road,open | 26/10/10 | Flies through stone rings for exercise. |
| `dustmarten` | Dustmarten | mire | common | steppe,shade | 35/9/11 | Finds water by scent beneath gravel. |
| `sunscarab` | Sunscarab | glimmer | uncommon | basin,glass | 39/11/12 | Polishes mineral flakes with its shell. |
| `cinderhorn` | Cinderhorn | cinder | rare | steppe,banner | 61/15/13 | Vent-steams its horns to cool a herd. |
| `redribbon` | Redribbon | bloom | common | road,hoofyard | 31/8/10 | Leaves seed ribbons where food is plentiful. |
| `basinmurmur` | Basinmurmur | brine | uncommon | emberbasin,shade | 48/10/12 | Holds moisture in cheek pouches. |
| `dunefleck` | Dunefleck | stone | common | dustroad,glass | 33/9/11 | Blends with shifting gravel. |
| `flarefinch` | Flarefinch | cinder | uncommon | basin,open | 34/12/10 | Uses brief heat flashes in courtship. |
| `glassmantle` | Glassmantle | stone | epic | glassshade,deep | 76/17/15 | Shields smaller fauna from falling shards. |
| `rootmoth` | Rootmoth | bloom | common | canopy,mothcourt | 25/7/10 | Pollinates flowers in spiral flight. |
| `leafglider` | Leafglider | gale | common | highwalk,canopy | 29/9/10 | Sails between branches on broad membranes. |
| `rainbell` | Rainbell | brine | uncommon | raincut,mist | 40/9/12 | Rings when clouds carry clean water. |
| `mossprong` | Mossprong | bloom | common | roots,grove | 37/8/12 | Grows moss antlers that shelter insects. |
| `cloudkip` | Cloudkip | gale | uncommon | highwalk,cloud | 35/11/10 | Bounces on springy aerial roots. |
| `seedmason` | Seedmason | stone | common | seedvault,roots | 45/9/13 | Builds seed chambers with pebble mortar. |
| `mothlumen` | Mothlumen | glimmer | rare | mothcourt,night | 43/13/12 | Illuminates pollen trails for dusk feeders. |
| `branchbadger` | Branchbadger | stone | uncommon | highwalk,roots | 54/12/13 | Reinforces weak branches with packed bark. |
| `mistantler` | Mistantler | shade | rare | raincut,cloud | 58/14/13 | Antlers condense fog into drinkable beads. |
| `rainpaddler` | Rainpaddler | brine | common | raincut,pond | 32/8/11 | Paddles through leaf gutters during storms. |
| `canopycurl` | Canopycurl | mire | common | canopy,roots | 28/8/11 | Coils around branches to sleep above rain. |
| `rootglint` | Rootglint | glimmer | uncommon | rootlift,seedvault | 41/10/12 | Finds buried mineral water by flashing eyes. |
| `windtatter` | Windtatter | gale | common | highwalk,open | 23/10/10 | Tears seed husks apart with wingbeats. |
| `bellroot` | Bellroot | bloom | uncommon | raincut,grove | 49/10/13 | Rings hollow roots when touched by rain. |
| `cloudram` | Cloudram | stone | rare | rootlift,highwalk | 63/15/14 | Headbutts storm knots from aerial vines. |
| `mistrunner` | Mistrunner | shade | common | raincut,cloud | 33/9/11 | Runs silently along wet bark. |
| `prismvole` | Prismvole | glimmer | common | seedvault,mothcourt | 27/8/10 | Sorts colored seeds into winter caches. |
| `leafjaw` | Leafjaw | bloom | uncommon | canopy,grove | 47/11/12 | Clips invasive creepers without harming trunks. |
| `rootcrown` | Rootcrown | mire | epic | rootlift,deep | 82/16/15 | Directs underground water around old trees. |
| `stormmantis` | Stormmantis | gale | rare | raincut,highwalk | 51/16/12 | Predicts lightning by tasting charged leaves. |
| `shadebloom` | Shadebloom | shade | uncommon | mothcourt,night | 45/11/13 | Opens dark petals only for nocturnal pollinators. |
| `northglass_warden` | Northglass Warden | stone | epic | reserve,all | 95/19/16 | Guards a migration crossing without claiming it. |
| `crownmuzzle` | Crownmuzzle | glimmer | epic | confluence,all | 88/18/15 | Remembers every safe route it has walked. |

## 8) Loot / economy

Item templates are `reed_staff`, `tide_hook`, `ember_crook`, `prism_sling`, `fieldglass`, `care_lure`, `calm_feed`, `rest_sling`, `tideproof_satchel`, `heat_safe_halter`, `leafwax_perch`, and `migration_chart`. Profession outputs are `dry_reed`, `mudglass_fiber`, `brineleaf`, `cinderpod`, `leafwax_knot`, and `reed_paper`. Dungeon drops are `turnstone`, `siltbell_core`, `emberhoop_pin`, `raincut_feather`, `root_spiral`, and `northglass_shard`. Cosmetic-only items include `marsh_ribbon`, `saltblue_sash`, `cinder tassel`, `canopy bead`, and `ranch_gate pennant`.

| Source | Common | Uncommon | Rare / epic |
|---|---|---|---|
| Fen species | `reed_token` 60%, `dry_reed` 30%, `mudglass_fiber` 10% | `calm_feed` 18% | `pond_lilt_chime` 4% |
| Brine species | `shell_bell` 55%, `brineleaf` 35%, `silt_clay` 10% | `tideproof_thread` 16% | `marshcrown_scale` 3% |
| Steppe species | `dust_seed` 60%, `cinderpod` 30%, `heatstone` 10% | `heat_safe_halter` 14% | `glassshade_lens` 3% |
| Canopy species | `leafwax` 55%, `seed_map` 35%, `rootfiber` 10% | `calm_feed` 15% | `mothlumen_filament` 4% |
| Trial rooms | `gold_pouch` 70%, `care_feed` 25% | `trial_mark` 15% | boss-specific item 8% |

All drops are personal. Vendor lists: Sella sells `fieldglass` for 42 gold, `care_lure` for 28, and `marsh_ribbon` for 18; Pava sells `tideproof_satchel` for 55, `shell_bell` for 12, and `saltblue_sash` for 20; Ves sells `heat_safe_halter` for 58, `prism_pin` for 16, and `cinder_tassel` for 22; Lune sells `canopy_map` for 46, `leafwax_perch` for 34, and `canopy_bead` for 19; Yul sells `migration_chart` for 110 and `northglass_shard` for 75. Repair cost is `repairCostPerPoint: 2` gold; companion care restores one injury tick for 9 gold at a ranch.

Gold faucets are quest rewards, trial completion, safe escort bonuses, and selling gathered materials. Sinks are tools, repairs, care, paddock licenses, and map duplication. The daily gold cap from repeatable contracts is 180; cosmetic tokens come only from milestones and seasonal appearance challenges, with a daily cap of 40. Wallets never mix. Collection log entries record first sighting, habitat, bond date, bond rank, and route note; they do not grant combat power.

## 9) Instances

Each trial is soloable or supports 2–5 players. Every room is described before its creature encounter. Each has trash, one elite, one checkpoint, one boss, and exits.

| Instance | Room sequence and encounters |
|---|---|
| `trial_mudglass_turns` | `mudglass_antechamber` (wet tile, then 2 `reedwhisk`); `silt_gallery` (tilted shelves, 3 `mireclack`); `mirror_checkpoint` (still pond, elite `mudmantle` x1); `levee_turn` (cracked walkway, 2 `sedgekip`); `quiet_nest` (reed nest under moonlight, boss `veilback` x1). Exit `reedfen_mudglass`. |
| `trial_siltbell_run` | `bell_dock` (empty tide dock, 2 `tidewink`); `low_channel` (ankle-deep water, 3 `brinehopper`); `silt_checkpoint` (bell frame, elite `siltbell` x1); `brinegarden_back` (salt flowers, 2 `kelpquill`); `flooded_bellroom` (rising water, boss `foamjaw` x1). Exit `saltmarsh_tideway`. |
| `trial_emberhoop` | `warm_gate` (red dust and stone hoops, 2 `dustrill`); `basin_lane` (heat shimmer, 3 `cinderpod`); `shade_checkpoint` (cloth shade, elite `redhoof` x1); `vent_court` (cooling stones, 2 `embermole`); `hoop_crater` (ringed basin, boss `cinderhorn` x1). Exit `redsteppe_dustroad`. |
| `trial_raincut_roost` | `root_stair` (wet roots, 2 `rootmoth`); `leafbridge` (flexing bridge, 3 `leafglider`); `mist_checkpoint` (fog bell, elite `rainbell` x1); `seed_gallery` (seed jars, 2 `prismvole`); `roost_crown` (open canopy under rain, boss `stormmantis` x1). Exit `cloudgrove_raincut`. |
| `trial_mirrorpond_lullaby` | `moonbank` (silver water, 2 `pondlilt`); `reed_chorus` (wind through reeds, 3 `tallreed`); `stillwater_checkpoint` (quiet platform, elite `wispfin` x1); `fogwalk` (low visibility, 2 `veilback`); `lullaby_pool` (echoing pond, boss `marshcrown` x1). Exit `reedfen_mirrorpond`. |
| `trial_cinderburrow` | `ashmouth` (warm burrow entrance, 2 `ashpuff`); `cooling_run` (stone vents, 3 `embermole`); `basin_checkpoint` (stacked stones, elite `basinmurmur` x1); `redtunnel` (glowing clay, 2 `flarefinch`); `burrow_heart` (cool core chamber, boss `glassmantle` x1). Exit `redsteppe_emberbasin`. |
| `trial_rootlift_spiral` | `lift_foot` (giant roots, 2 `canopycurl`); `moss_turn` (mossy spiral, 3 `mossprong`); `high_checkpoint` (wind shelf, elite `cloudram` x1); `seed_turn` (floating seed vault, 2 `seedmason`); `spiral_crown` (root crown chamber, boss `rootcrown` x1). Exit `cloudgrove_rootlift`. |
| `trial_northglass_crossing` | `reserve_gate` (frosted grass, 2 `dunefleck`); `glasspass` (clear wind, 3 `glasshare`); `route_checkpoint` (marker circle, elite `mistantler` x1); `migration_shelf` (wide ledge, 2 `glimmernewt`); `northglass_span` (open crossing, boss `northglass_warden` x1). Exit `northglass_reserve`. |

The weekly big instance is the 10-person-equivalent **Migration Night at Confluence Yard** (`big_migration_night`), with three phases: phase one repairs six living markers, phase two escorts three habitat groups across changing lanes, and phase three calms `crownmuzzle` while `northglass_warden` opens the reserve gate. It has personal loot, a weekly permit, and checkpoint after each phase. It is a cooperative migration event, not a creature slaughter or a PvP territory claim.

## 10) Progression

| Node ID | Cost | Requires | Effect flag |
|---|---:|---|---|
| `bond_rank_1` | 0 | — | `bond_basic` |
| `bond_rank_2` | 40 | `bond_rank_1` | `care_tick_plus_1` |
| `field_reading` | 55 | `bond_rank_1` | `show_habitat_hint` |
| `safe_retreat` | 60 | `field_reading` | `retreat_damage_minus_10pct` |
| `twin_signal` | 75 | `bond_rank_2` | `second_command_slot` |
| `ranch_paddock_3` | 90 | `bond_rank_2` | `ranch_slots_plus_1` |
| `type_notation` | 80 | `field_reading` | `type_chart_detail` |
| `calm_presence` | 110 | `safe_retreat` | `bond_attempt_window_plus_1` |
| `trail_memory` | 120 | `twin_signal` | `visit_route_recall` |
| `ranch_paddock_4` | 140 | `ranch_paddock_3` | `ranch_slots_plus_1` |
| `migration_guide` | 160 | `trail_memory` | `escort_contribution_plus_5` |
| `gentle_switch` | 180 | `calm_presence` | `swap_without_stress` |
| `reserve_license` | 220 | `migration_guide` | `northglass_access` |
| `keeper_mastery` | 300 | `gentle_switch`,`reserve_license` | `bond_rank_cap_plus_1` |

No node is purchasable with cosmetic tokens; all costs are earned or paid in gold through play.

Daily/weekly contracts are capped: `daily_boardwalk_round` (visit `reedfen_boardwalk`, 18 gold/55 XP), `daily_tide_bells` (collect `shell_bell:3`, 20/60), `daily_heat_stones` (collect `heatstone:3`, 22/65), `daily_canopy_notes` (collect `seed_map:2`, 24/70), and weekly `weekly_migration_contribution` (visit `confluence_yard`, 90/260 plus 12 cosmetic tokens).

## 11) Theme Kit + copy

The `fieldglass_copper` kit uses river teal, reed green, warm clay, dusk plum, and paper cream. Materials are cork, glazed ceramic, braided cord, pressed leaf, and softly scratched copper. Dice look like seed-pods with painted pips. Voice is calm, observant, lightly humorous, and never treats a living creature as a prize. The ambient loop is **“Rain on the Paddock Roof”**: finger bells, muted hand drum, reed breath, and distant hoof taps. Default fashion is practical layered fieldwear with habitat-colored scarves, soft gloves, and repairable boots.

### Player-facing UI labels

| System label | Skinned label |
|---|---|
| Inventory | Field Satchel |
| Journal | Trailbook |
| Map | Route Cloth |
| Party | Care Circle |
| Companion | Partner |
| Stable | Paddock |
| Bond | Trust |
| Type | Nature |
| HP | Stamina |
| Gold | Trail Coin |
| Cosmetic tokens | Keepsake Marks |
| Quest | Care Errand |
| Objective | Trail Note |
| Instance | Trial Door |
| Checkpoint | Rest Marker |
| Boss | Route Guardian |
| Loot | Finds |
| Collection | Sightings |
| Settings | Field Options |
| Exit | Return to Gate |

### New Game card hooks

1. “The marsh has gone quiet, and quiet can be a warning.”
2. “Choose a partner by the signal it gives, not the shape it wears.”
3. “A tide bell is missing; three habitats are waiting for its sound.”
4. “The red ground is warm, but the herd has nowhere cool to stand.”
5. “Above the raincut, a courier searches for one safe branch.”
6. “Your first field note may keep an entire nestbank open.”
7. “Hollowmere Ranch needs hands that know when to wait.”
8. “A rare sighting is still a living day, not a trophy.”
9. “The migration route is written in four kinds of weather.”
10. “Bring curiosity, spare cord, and room to turn back.”

## 12) Failures + John’s calls

1. **Clone risk: creature-as-ammunition.** Avoided by consent gates, care actions, injury protection, and a no-trade soft launch.
2. **Clone risk: a catalog that replaces ecology.** Avoided by habitat tags, route work, ranch chores, migration markers, and ecology lines for every fauna entry.
3. **Clone risk: elemental type chart as the whole identity.** Avoided by eight asymmetric nature tags, local problems, and bond progression that rewards observation rather than raw advantage.
4. **Clone risk: endless rarity escalation.** Avoided by rare and epic creatures serving route, care, or collection roles; premium never buys catch success or missing creatures.
5. **Open decision, default chosen:** whether the ranch eventually supports player-to-player adoption. Default is **no at soft launch**; any future change must preserve consent, provenance, and non-monetized access.

## Created file

`WOF_bonded_menagerie_Pack.md`

## 20-line integrity checklist

1. World ID is the stable snake_case value `bonded_menagerie`.
2. Display name uses the locked title Bonded Menagerie.
3. Content is original and fenced from licensed franchises.
4. Genre-specific ban-list contains more than 40 prohibited lookalikes.
5. No forbidden dump-error title is used as canon.
6. No Compact race names are used as creatures.
7. No prohibited franchise creature names appear in the fauna catalog.
8. `bond_type` is the only rules module declared.
9. Ledger-owned state is explicitly separated from prose.
10. Two wallets remain separate.
11. Four field starts are present.
12. Each start has a non-capital hub path and six or more POIs.
13. Six durable NPCs are present for each start.
14. Quest-giver and merchant dialogue is canned and complete.
15. Reedfen has a 20-beat primary-start DAG.
16. All quest rewards are numeric gold and XP values.
17. Objectives use code-completeable verbs and stable IDs.
18. The world includes 64 original creatures and an eight-type chart.
19. Eight soloable five-room trials and one three-phase big instance are specified.
20. Progression, economy, UI copy, hooks, clone-risk calls, and divergence records are included.

<!-- No external references: this is an original fictional content pack, not a factual research document. -->
