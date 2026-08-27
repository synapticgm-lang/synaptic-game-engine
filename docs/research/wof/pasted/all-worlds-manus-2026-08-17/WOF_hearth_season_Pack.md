# WOF Hearth Season World Pack

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `hearth_season` |
| Display name | Hearth Season |
| Pitch | A gentle town-and-garden adventure where neighbors restore a neglected valley through planting, making, trading, and shared festivals. |
| Maturity | `all_ages` |
| `rulesModuleId` | `cozy_tick` |
| Theme Kit | `warm_thimble` |
| Genre pattern | Cozy life-sim adventure with light errands, seasonal projects, and optional nonviolent pest handling. |
| IP fence | This is **not** a licensed farming, village-builder, creature-collection, or fantasy-life franchise; all names, customs, places, and events are original. |

**Ban-list for this genre.** Do not use or evoke Animal Crossing, Stardew Valley, Harvest Moon, Story of Seasons, Rune Factory, Fae Farm, Coral Island, My Time at Portia, My Time at Sandrock, Disney Dreamlight Valley, The Sims, The Legend of Zelda, Pokémon, Palworld, Minecraft, Terraria, Slime Rancher, Spiritfarer, Cozy Grove, Littlewood, Dinkum, Palia, Ooblets, Garden Story, Yonder, Hokko Life, World of Warcraft, Tolkien, Harry Potter, Narnia, The Hobbit, Lord of the Rings, Final Fantasy, Dragon Quest, Genshin, Skyrim, Dungeons & Dragons, Warhammer, The Witcher, or any distinctive character, region, mascot, slogan, item, quest, or plot associated with them. The pack uses no franchise names, creatures, artifacts, or beat-for-beat stories.

## 1) Rules module: `cozy_tick`

The code-owned ledger resolves `day`, `season`, `time_block`, `stamina`, `mood`, `friendship`, `crop_stage`, `soil_quality`, `shop_stock`, `festival_score`, `pest_pressure`, `recipe_known`, `quest_state`, `visit_place`, `collect_item`, and `deliver_item`. Combat is not a progression requirement. Pests are handled through `ledger_clear_pest`, a scarecrow placement, or a gentle relocation action; no kill counter is needed for the default route.

A day advances only when the player chooses **Rest at Home**, **Close Shop**, or **Join Festival Finale**. Failed timed errands checkpoint at the morning bell and retain delivered items, while per-day chores reset. There is no raid lockout and no weekly boss lockout. A cooperative town project uses a shared instance seed but awards personal contribution credit.

Prose may not invent crop yields, friendship points, shop prices, festival scores, recipe unlocks, item ownership, pest resolution, or quest completion. Prose may describe sensory detail only after the ledger commits the result.

### Diegetic chrome templates

```text
[Morning Bell] Day {day}, {season}. Stamina {current}/{max}. Weather: {weather}.
[Garden Ledger] {plotName}: {cropName} — stage {stage}; water {waterState}; soil {soilState}.
[Neighbor Note] {npcName}: friendship {rank}; next kindness: {visibleGoal}.
[Market Slate] {shopName}: {openState}. Today’s posted price: {price} gold.
[Festival Board] {festivalName}: {contribution}/{target}. Next reward: {rewardName}.
[Journal] {questTitle}: {objectiveText} — {progress}/{required}.
```

## 2) Identity kits

All four kits are original town cultures rather than renamed licensed peoples. They differ by upbringing and practical talent, not power tier.

| `kitId` | Look and values | Taboo, speech tell, clothing, tool | Start / first quest / flag |
|---|---|---|---|
| `sunroom_kin` | Broad-smiled hillside residents with copper, umber, or tawny skin; value hospitality and visible work. | Never let a guest leave hungry. Says “set another place.” Quilted vest, canvas trousers, hand trowel. | `marigold_slope`; `hs_sunroom_arrival`; `ability_seed_sense` |
| `brookward_kin` | River-settled people with braided hair, reed jewelry, and water-resistant boots; value patience and repair. | Do not waste clean water. Says “let the current show us.” Blue oilskin, basket, pruning knife. | `willow_run`; `hs_brookward_arrival`; `ability_water_memory` |
| `kilnward_kin` | Clay-working families with ash-brown, russet, or deep brown skin; value useful beauty and honest prices. | Never disguise a repair as a replacement. Says “measure twice, mend once.” Apron, wrap skirt or work pants, clay scraper. | `red_clay_lane`; `hs_kilnward_arrival`; `ability_heat_craft` |
| `mossveil_kin` | Quiet woodland neighbors with freckled faces and lichen-green accents; value privacy, biodiversity, and listening. | Do not uproot a living plant for decoration. Says “the small thing is still telling us.” Hooded overshirt, soft boots, seed pouch. | `mossbell_wood`; `hs_mossveil_arrival`; `ability_hush_step` |

Each kit begins with a worn **hand cart**, a **plain satchel**, a **weather map**, and a **starter tool** listed above. The opening choice has a stake: accept the town’s spare room and owe two hours of work, or camp outside and begin with one fewer stamina point for the first day.

## 3) Map / places

The world has four equivalent starts, four non-capital hubs, two end-of-start civic venues, and one shared mid-world. Street pins show visited places; unvisited places remain outlines. Indoor shops use a local floor plan, never a giant regional map.

| `placeId` | Public name | Zone | Scale / danger / outdoor | Exits | NPCs | Instance |
|---|---|---|---|---|---|---|
| `marigold_slope` | Marigold Slope | `sunroom_start` | street / safe / true | `sunroom_square`, `orchard_steps` | `mara_vell`, `orin_pale` | — |
| `sunroom_square` | Sunroom Square | `sunroom_start` | street / safe / true | `marigold_slope`, `sunroom_hub` | `mara_vell`, `tessa_quill` | — |
| `orchard_steps` | Orchard Steps | `sunroom_start` | street / low / true | `marigold_slope`, `old_press` | `juno_bramble` | — |
| `old_press` | Old Press | `sunroom_start` | street / low / false | `orchard_steps`, `press_cellar` | `orin_pale` | `press_cellar` |
| `beehouse_path` | Beehouse Path | `sunroom_start` | street / low / true | `sunroom_hub`, `marigold_slope` | `juno_bramble` | — |
| `sunroom_hub` | Apricot Rest | `sunroom_start` | street / safe / true | `sunroom_square`, `hearth_merge` | `tessa_quill`, `orin_pale` | — |
| `willow_run` | Willow Run | `brookward_start` | street / safe / true | `brookward_green`, `waterwheel_bend` | `pella_nook`, `senn_rill` | — |
| `brookward_green` | Brookward Green | `brookward_start` | street / safe / true | `willow_run`, `brookward_hub` | `pella_nook`, `vesa_loom` | — |
| `waterwheel_bend` | Waterwheel Bend | `brookward_start` | street / low / true | `willow_run`, `rill_house` | `senn_rill` | — |
| `rill_house` | Rill House | `brookward_start` | street / low / false | `waterwheel_bend`, `sluice_rooms` | `vesa_loom` | `sluice_rooms` |
| `reed_market` | Reed Market | `brookward_start` | street / safe / true | `brookward_hub`, `brookward_green` | `vesa_loom` | — |
| `brookward_hub` | Blue Kettle | `brookward_start` | street / safe / true | `brookward_green`, `hearth_merge` | `pella_nook`, `senn_rill` | — |
| `red_clay_lane` | Red Clay Lane | `kilnward_start` | street / safe / true | `kilnward_yard`, `kiln_quarry` | `daro_fenn`, `miva_ash` | — |
| `kilnward_yard` | Kilnward Yard | `kilnward_start` | street / safe / true | `red_clay_lane`, `kilnward_hub` | `miva_ash`, `rusk_dell` | — |
| `kiln_quarry` | Softstone Quarry | `kilnward_start` | street / low / true | `red_clay_lane`, `clay_store` | `daro_fenn` | — |
| `clay_store` | Clay Store | `kilnward_start` | street / low / false | `kiln_quarry`, `kiln_chamber` | `rusk_dell` | `kiln_chamber` |
| `brickwalk` | Brickwalk | `kilnward_start` | street / safe / true | `kilnward_hub`, `kilnward_yard` | `miva_ash` | — |
| `kilnward_hub` | Red Cup Yard | `kilnward_start` | street / safe / true | `kilnward_yard`, `hearth_merge` | `daro_fenn`, `miva_ash` | — |
| `mossbell_wood` | Mossbell Wood | `mossveil_start` | street / safe / true | `mossveil_ring`, `fern_bridge` | `elra_moss`, `niko_wren` | — |
| `mossveil_ring` | Mossveil Ring | `mossveil_start` | street / safe / true | `mossbell_wood`, `mossveil_hub` | `elra_moss`, `bryn_sedge` | — |
| `fern_bridge` | Fern Bridge | `mossveil_start` | street / low / true | `mossbell_wood`, `hollow_stump` | `niko_wren` | — |
| `hollow_stump` | Hollow Stump | `mossveil_start` | street / low / false | `fern_bridge`, `root_rooms` | `bryn_sedge` | `root_rooms` |
| `bellflower_turn` | Bellflower Turn | `mossveil_start` | street / safe / true | `mossveil_hub`, `mossveil_ring` | `bryn_sedge` | — |
| `mossveil_hub` | Lichen Lantern | `mossveil_start` | street / safe / true | `mossveil_ring`, `hearth_merge` | `elra_moss`, `bryn_sedge` | — |
| `hearth_merge` | Four-Way Hearth | `mid_world` | street / safe / true | all four hubs, `candle_capital`, `raincap_capital`, `seasonal_green` | `mara_vell`, `pella_nook`, `daro_fenn`, `elra_moss` | — |
| `candle_capital` | Candlewick Commons | `capital_north` | street / safe / true | `hearth_merge`, `civic_hall`, `festival_green` | `mayor_ilo`, `keeper_sava` | — |
| `raincap_capital` | Raincap Terrace | `capital_south` | street / safe / true | `hearth_merge`, `seed_exchange`, `festival_green` | `mayor_ilo`, `keeper_sava` | — |
| `civic_hall` | Civic Hall | `capital_north` | street / safe / false | `candle_capital` | `mayor_ilo` | — |
| `seed_exchange` | Seed Exchange | `capital_south` | street / safe / false | `raincap_capital` | `keeper_sava` | — |
| `festival_green` | Festival Green | `capitals` | street / safe / true | both capitals | `mayor_ilo`, `keeper_sava` | `big_night_moonmeal` |
| `seasonal_green` | Seasonal Green | `mid_world` | street / safe / true | `hearth_merge`, `festival_green` | `brin_cobb` | — |

Travel is physical: each start hub connects to `hearth_merge`; from there the player chooses `candle_capital` or `raincap_capital`. No teleport is available. The fog ledger records `visited` and `outline` independently.

## 4) Durable NPCs and canned talk

The six primary durable NPCs have stable roles and complete canned trees. Additional named locals are listed in the map and use the same bounded hub chatter system.

| `npcId` | Name | Place | Role |
|---|---|---|---|
| `mara_vell` | Mara Vell | `sunroom_square` | quest / hub |
| `pella_nook` | Pella Nook | `brookward_green` | quest / merchant |
| `daro_fenn` | Daro Fenn | `kilnward_yard` | profession / merchant |
| `elra_moss` | Elra Moss | `mossveil_ring` | quest / local |
| `mayor_ilo` | Mayor Ilo | `civic_hall` | quest / hub |
| `keeper_sava` | Keeper Sava | `seed_exchange` | merchant / profession |

### `mara_vell`

- **Greet:** “The square has room for one more pair of hands. Welcome.”
- **Quest offer:** “Our notice board is blank because the rain ruined the ink. Walk the four corners and bring back what can still be read.”
- **Quest progress:** “You have found two corners. The town is beginning to remember itself.”
- **Quest turn-in:** “The board stands again. Take 18 gold and 24 XP; your first promise is now visible.”
- **Gossip:** “The west orchard hums before dawn.” / “Apricot Rest keeps a blanket for travelers.” / “Mayor Ilo counts chairs before people.”
- **Refusal/player-rude:** “I will listen when your words can make room for someone else.”

### `pella_nook`

- **Greet:** “Boots by the mat, baskets on the peg, worries on the bench.”
- **Quest offer:** “The creek has misplaced three stepping stones. Find them without muddying the spawning pool.”
- **Quest progress:** “That stone is clean. Please set it where the water narrows.”
- **Quest turn-in:** “The crossing is safe. Here are 16 gold and 22 XP, plus a reed-hook recipe.”
- **Gossip:** “A kettle tells the truth when it rattles.” / “The south bank likes shade.” / “Pella’s cat is not a cat; ask no questions.”
- **Refusal/player-rude:** “No stone will move for a voice that shouts at water.”

### `daro_fenn`

- **Greet:** “Clay remembers every thumbprint. Press gently.”
- **Quest offer:** “Bring me 3 softstone and I will teach you to mend a cracked planter.”
- **Quest progress:** “The stone is sound. The kiln wants one careful turn.”
- **Quest turn-in:** “A useful bowl is better than a pretty shard. Receive 20 gold and 28 XP.”
- **Gossip:** “Red clay holds heat after sunset.” / “Rusk sells handles too thin for honest work.” / “A repaired thing earns a second story.”
- **Refusal/player-rude:** “I do not sell a lesson to someone who mocks the learner.”

### `elra_moss`

- **Greet:** “Stand still. The moss has already noticed you.”
- **Quest offer:** “Three bellflowers are leaning into the path. Stake them with fallen twigs, not cut branches.”
- **Quest progress:** “The flowers are upright. The smallest one is still deciding.”
- **Quest turn-in:** “The path remains living. Take 15 gold and 20 XP.”
- **Gossip:** “A quiet path is not an empty path.” / “Bryn hears roots better than bells.” / “Do not name every bird.”
- **Refusal/player-rude:** “The wood closes to careless footsteps. Return when you can walk softly.”

### `mayor_ilo`

- **Greet:** “Candlewick Commons is open. The chairs are not yet in agreement.”
- **Quest offer:** “Choose one town repair and finish its ledger line before dusk: shade awning, notice board, or rain barrel.”
- **Quest progress:** “A marked line is a promise, not a decoration.”
- **Quest turn-in:** “The commons is more usable because you were specific. Receive 30 gold and 40 XP.”
- **Gossip:** “A festival is measured in returned smiles.” / “The north gate sticks in damp weather.” / “Sava knows every seed by sound.”
- **Refusal/player-rude:** “Civic work needs a steady voice. Come back after you have one.”

### `keeper_sava`

- **Greet:** “Seeds are small ledgers. Each one records care.”
- **Quest offer:** “Deliver 2 marigold bulbs and 2 creek beans to the exchange shelf.”
- **Quest progress:** “The labels are legible. That saves us a season of guessing.”
- **Quest turn-in:** “Good stock deserves good records. Receive 12 gold and 18 XP.”
- **Gossip:** “Never store beans wet.” / “The moonmint prefers a chipped pot.” / “A seed is not a promise until planted.”
- **Refusal/player-rude:** “You may browse after you stop treating living things like clutter.”

**Canned hub lines for `hearth_merge`:** “A cart rolls toward Candlewick.” / “A bell marks the market hour.” / “Someone has hung blue ribbons on the rail.” / “The four road signs have fresh paint.” / “A neighbor offers a spare apple.” / “The shared hearth crackles.” / “A child counts seed packets.” / “The weather vane turns east.” / “The festival board gains a new pin.” / “The road home remains open.”

## 5) Premade choices / first hour

Each kit opens with five authored beats: choose a bed or campsite (stake: comfort versus stamina), name one useful skill, inspect the neglected plot, meet the local steward, and accept or decline the first communal repair. Declining writes `divergence_record: declined_first_repair`; accepting writes `accepted_first_repair`. The required HookArc flags are `identity_confirmed`, `first_choice`, and `observed_consequence`.

| POI | Choice buttons |
|---|---|
| `sunroom_square` | Read rain-warped board; ask Mara about lodging; sweep the east step; inspect orchard map; promise two work hours; leave for Apricot Rest |
| `brookward_green` | Count creek stones; ask Pella for a basket; test water clarity; patch a reed fence; accept a dry-foot route; rest by kettle |
| `kilnward_yard` | Touch cool kiln brick; ask Daro for a lesson; sort softstone; mark a cracked planter; offer fair price; carry clay to store |
| `mossveil_ring` | Listen at bellflower; ask Elra for a twig stake; sketch path; gather fallen wood; promise quiet steps; return to lantern |

Tutorial forced path, skippable on alternate characters: `arrive`, `choose_lodging`, `inspect_plot`, `talk_steward`, `collect_first_material`, `complete_repair`, `observe_consequence`, `sleep_or_continue`. Choices are inventory-aware and do not expose impossible actions.

### Retry beat deck

| Fingerprint | Goal | Tactic | Obstacle | Revelation | Consequence |
|---|---|---|---|---|---|
| `retry_notice` | restore notice board | dry paper under awning | ink bleeds | west corner has old route mark | board reveals `hearth_merge` |
| `retry_creek` | restore crossing | place stones by water sound | current shifts | spawning pool must stay clear | safe route opens |
| `retry_kiln` | mend planter | add clay in thin coils | heat cracks rim | flaw is in old mold | recipe unlocks |
| `retry_bells` | protect flowers | use fallen twigs | one stem bends | shade causes tilt | quiet path reward |
| `retry_shop` | stock first shelf | sort by season | labels missing | Sava has a ledger key | shop tier rises |
| `retry_awning` | shade commons | measure posts | cloth is short | old sail can be cut | heat penalty reduced |
| `retry_pests` | clear garden pests | scent lure and relocation crate | lure attracts too many | compost pile is open | pest pressure drops |
| `retry_festival` | prepare Moonmeal | divide three tasks | rain threatens | indoor tables exist | event remains viable |

## 6) Quests: code-completeable DAGs

Objectives use only `visit_place`, `collect_item`, `deliver_item`, `talk_to_npc`, and `ledger_clear_pest`; all rewards are numeric. The primary start is `sunroom_start` and contains 20 authored beats.

| ID | Title | Family | Hidden | Unlock | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `hs_sunroom_arrival` | A Bed or a Patch of Sky | identity | false | — | `talk_to_npc:mara_vell:1` | 8 | 10 |
| `hs_name_the_skill` | What Your Hands Know | identity | false | `hs_sunroom_arrival` | `visit_place:marigold_slope:1` | 8 | 12 |
| `hs_first_seed` | A Seed With Your Name | identity | false | `hs_name_the_skill` | `collect_item:starter_seed:1; deliver_item:starter_seed:mara_vell:1` | 10 | 14 |
| `hs_notice_corners` | Corners of Memory | zone_story | false | `hs_first_seed` | `visit_place:sunroom_square:1; collect_item:notice_scrap:4` | 18 | 24 |
| `hs_board_rehang` | Put the Town Back in Ink | zone_story | false | `hs_notice_corners` | `deliver_item:notice_scrap:mara_vell:4` | 18 | 24 |
| `hs_orchard_stakes` | Orchard Steps | zone_story | false | `hs_board_rehang` | `collect_item:fallen_branch:3; deliver_item:fallen_branch:juno_bramble:3` | 14 | 20 |
| `hs_press_breadcrumb` | The Press Below | dungeon_breadcrumb | false | `hs_orchard_stakes` | `visit_place:old_press:1; talk_to_npc:orin_pale:1` | 12 | 18 |
| `hs_press_cellar` | Applewood in the Dark | zone_story | false | `hs_press_breadcrumb` | `visit_place:press_cellar:1; collect_item:press_gear:2` | 24 | 32 |
| `hs_miller_line_1` | Measure the Grain | profession | false | `hs_first_seed` | `collect_item:grain_scoop:1; deliver_item:grain_scoop:orin_pale:1` | 10 | 16 |
| `hs_miller_line_2` | Turn the Small Wheel | profession | false | `hs_miller_line_1` | `visit_place:old_press:1; collect_item:dry_grain:3` | 12 | 18 |
| `hs_miller_line_3` | A Better Sift | profession | false | `hs_miller_line_2` | `deliver_item:dry_grain:orin_pale:3` | 14 | 20 |
| `hs_miller_line_4` | Keep the Flour Cool | profession | false | `hs_miller_line_3` | `collect_item:cool_cloth:2; deliver_item:cool_cloth:orin_pale:2` | 16 | 22 |
| `hs_miller_line_5` | Share the First Loaf | profession | false | `hs_miller_line_4` | `collect_item:plain_loaf:2; deliver_item:plain_loaf:mara_vell:2` | 20 | 28 |
| `hs_miller_line_6` | The Mill’s New Song | profession | false | `hs_miller_line_5` | `talk_to_npc:orin_pale:1; visit_place:sunroom_hub:1` | 22 | 30 |
| `hs_pest_relocation` | Soft Feet, Busy Garden | side | false | `hs_first_seed` | `ledger_clear_pest:marigold_slope:2` | 12 | 18 |
| `hs_apricot_daily` | Morning Basket | daily | false | `hs_first_seed` | `collect_item:apricot:3; deliver_item:apricot:tessa_quill:3` | 6 | 8 |
| `hs_hidden_trust` | The Unmarked Key | hidden | true | `hs_press_cellar` | `collect_item:brass_key:1; deliver_item:brass_key:orin_pale:1` | 25 | 35 |
| `hs_hearth_merge` | Four Roads, One Table | campaign | false | `hs_press_cellar` | `visit_place:hearth_merge:1; talk_to_npc:mara_vell:1` | 30 | 42 |
| `hs_first_capital` | A Place on the Board | campaign | false | `hs_hearth_merge` | `visit_place:candle_capital:1; talk_to_npc:mayor_ilo:1` | 35 | 48 |
| `hs_moonmeal_invite` | Lanterns Before Supper | campaign | false | `hs_first_capital` | `collect_item:moonmeal_invite:4; deliver_item:moonmeal_invite:mayor_ilo:4` | 40 | 55 |

The three other starts each have an 18-beat authored route: `brookward_start` uses creek restoration, basket weaving, water-quality checks, and `sluice_rooms`; `kilnward_start` uses clay sorting, planter repair, kiln safety, and `kiln_chamber`; `mossveil_start` uses path stewardship, seed shelter, quiet ecology, and `root_rooms`. Their primary quest IDs are `hs_brookward_01` through `hs_brookward_18`, `hs_kilnward_01` through `hs_kilnward_18`, and `hs_mossveil_01` through `hs_mossveil_18`; each objective is one of the ledger verbs above, with rewards respectively ranging from 6–34 gold and 8–46 XP. Their local threats are a blocked creek, unstable clay shelves, and invasive burr growth—not world-ending danger.

### Campaign spine after starts

`hs_hearth_merge` → `hs_first_capital` → `hs_other_capital_visit` (visit `raincap_capital`) → `hs_choose_project` (talk `mayor_ilo`) → `hs_seed_exchange` (visit `seed_exchange`) → `hs_four_hubs_report` (visit all four hubs) → `hs_awning_repair` (deliver `suncloth:3`) → `hs_market_open` (visit `seasonal_green`) → `hs_moonmeal_invite` → `hs_moonmeal_setup` (deliver `tablecloth:4`) → `hs_moonmeal_prep` (collect `moonfruit:6`) → `hs_moonmeal_big_night` (enter `big_night_moonmeal`) → `hs_neighbor_to_neighbor` (talk to four start stewards) → `hs_first_snow_plan` (deliver `seed_catalog:1`) → `hs_season_complete` (visit `festival_green`). Rewards are 25–75 gold and 35–100 XP per beat.

**Divergence records:** declining lodging writes `declined_first_repair`; choosing campsite writes `camped_outside`; refusing the Moonmeal writes `declined_moonmeal`. Each record changes future greetings and the journal visibly reports the branch; no promise is silently forgotten.

## 7) Species / opponents / collectibles

Hearth Season is mostly tick-based. Optional pest skins are gentle, non-gory, and clearable rather than farmed for kills.

| `speciesId` | Common name | Region | Rarity | Habitat | Base HP | ATK | AC |
|---|---|---|---|---|---:|---:|---:|
| `dew_mite` | Dew mite | all gardens | common | damp_leaf | 3 | 0 | 1 |
| `paper_wasp` | Paper wasp | orchard | uncommon | eaves | 5 | 1 | 2 |
| `root_nibbler` | Root nibbler | clay lane | common | loose_soil | 4 | 1 | 1 |
| `reed_slug` | Reed slug | brookward | common | creek_bank | 4 | 0 | 1 |
| `burr_hare` | Burr hare | mossveil | uncommon | fern_edge | 6 | 1 | 2 |
| `thimble_beetle` | Thimble beetle | kilnward | rare | warm_stone | 8 | 1 | 3 |
| `lantern_moth` | Lantern moth | all hubs | rare | night_bloom | 7 | 0 | 3 |
| `raincap_snail` | Raincap snail | capitals | epic | rain_barrel | 10 | 1 | 4 |
| `mulch_cricket` | Mulch cricket | garden | common | compost | 3 | 0 | 1 |
| `vine_skein` | Vine skein | orchard | uncommon | trellis | 6 | 1 | 2 |
| `clay_crawler` | Clay crawler | quarry | common | softstone | 5 | 1 | 2 |
| `bellroot_grub` | Bellroot grub | mossveil | uncommon | root_mat | 6 | 1 | 2 |
| `silt_finch` | Silt finch | brookward | common | reedbed | 3 | 0 | 1 |
| `apron_moth` | Apron moth | shop | rare | cloth_rack | 7 | 0 | 3 |
| `seed_thief` | Seed thief | market | uncommon | shelf_gap | 5 | 1 | 2 |
| `candle_ant` | Candle ant | commons | common | paving_crack | 3 | 0 | 1 |

Collectibles include `pressed_leaf`, `old_recipe`, `blue_ribbon`, `tiny_bell`, `river_glass`, `kiln_stamp`, `moss_charm`, `festival_pin`, and `weather_postcard`. No collectible is a power upgrade.

## 8) Loot / economy

Starter templates are `plain_satchel`, `hand_cart`, `weather_map`, `hand_trowel`, `reed_hook`, `clay_scraper`, and `seed_pouch`. Profession outputs include `plain_loaf`, `reed_basket`, `mended_planter`, `shade_cloth`, and `pressed_fruit`. Dungeon rooms can award `press_gear`, `sluice_key`, `kiln_stamp`, `root_lantern`, or cosmetics `apron_blue`, `raincap_hat`, and `moss_ribbon`.

| Source | Personal drop | Chance |
|---|---|---:|
| `press_cellar` room 2 | `press_gear` | 0.60 |
| `sluice_rooms` room 3 | `sluice_key` | 0.55 |
| `kiln_chamber` room 1 | `kiln_stamp` | 0.65 |
| `root_rooms` room 4 | `root_lantern` | 0.50 |
| `big_night_moonmeal` | one festival cosmetic | 1.00 |

Vendor catalogs: `tessa_quill` sells seeds for 2–8 gold; `pella_nook` sells baskets and water tools for 4–18 gold; `daro_fenn` sells clay tools for 5–22 gold; `keeper_sava` sells seasonal seeds for 3–12 gold. Repair cost is `repairCostPerPoint: 1` gold, applied only to tool durability. Gold faucets are quests, shop orders, and festival contributions; sinks are seeds, recipes, repairs, and stall fees. Daily quest gold is capped at 60, with a weekly civic bonus cap of 240. Cosmetic tokens come only from festivals, collection milestones, and achievement cards; they never buy gold or power.

## 9) Instances

Each start has one soloable five-room equivalent. Rooms are described before any pest appears; a party of 1–5 may enter, and a checkpoint occurs after room 3.

| Instance | Rooms and encounters |
|---|---|
| `press_cellar` | `press_entry` stone stair and empty racks; `gear_gallery` with `mulch_cricket x3`; `apple_bin` checkpoint and `paper_wasp x2`; `wheel_room` elite `vine_skein x1`; `cool_press` boss `seed_thief x1`; exit to `old_press`. |
| `sluice_rooms` | `sluice_gate` wet brick and tide marks; `reed_channel` `reed_slug x3`; `filter_walk` checkpoint and `silt_finch x2`; `wheel_chamber` elite `root_nibbler x1`; `clear basin` boss `raincap_snail x1`; exit to `rill_house`. |
| `kiln_chamber` | `ash_threshold` cool kiln mouth; `clay_shelf` `clay_crawler x3`; `cooling_room` checkpoint and `candle_ant x4`; `mold_gallery` elite `thimble_beetle x1`; `true kiln` boss `apron_moth x1`; exit to `clay_store`. |
| `root_rooms` | `root_door` woven roots; `fern_turn` `bellroot_grub x3`; `quiet well` checkpoint and `burr_hare x2`; `old_stump` elite `vine_skein x1`; `bellroot cradle` boss `lantern_moth x1`; exit to `hollow_stump`. |

The equivalent big instance is the non-raid **Moonmeal Big Night** at `festival_green`: a five-stage cooperative preparation and hosting event for 2–5 players. Stages are `tables`, `lanterns`, `shared_dishes`, `neighbor_stories`, and `final_song`; each stage uses contribution ticks, not combat or lockouts. A failed stage checkpoints at the previous stage and never removes delivered items.

## 10) Progression

| Node ID | Cost | Requires | Effect flags |
|---|---:|---|---|
| `talent_steady_hands` | 0 | — | `tool_stamina_cost:-1` |
| `talent_seed_sense` | 20 | `talent_steady_hands` | `reveal_soil_state` |
| `talent_basket_balance` | 25 | `talent_steady_hands` | `carry_capacity:+2` |
| `talent_kind_greeting` | 30 | `talent_seed_sense` | `friendship_first_talk:+1` |
| `talent_quick_repair` | 35 | `talent_basket_balance` | `repair_time:-1` |
| `talent_compost_eye` | 40 | `talent_seed_sense` | `pest_pressure_scan` |
| `talent_market_math` | 45 | `talent_kind_greeting` | `shop_order_bonus:+1` |
| `talent_rain_reading` | 50 | `talent_compost_eye` | `weather_notice_early` |
| `talent_shared_load` | 55 | `talent_quick_repair` | `co_op_stamina_share:1` |
| `talent_garden_patience` | 60 | `talent_rain_reading` | `crop_tick_quality:+1` |
| `talent_festival_host` | 70 | `talent_market_math` | `festival_contribution:+2` |
| `talent_four_roads` | 85 | `talent_shared_load`, `talent_garden_patience` | `hub_travel_stamina:-1` |

Daily/weekly contracts, all capped: `morning_basket` (deliver 3 produce, 6 gold), `tidy_corner` (collect 5 litter, 5 gold), `gentle_relocation` (clear 2 pest pressure, 8 gold), `neighbor_note` (talk to 3 NPCs, 7 gold), and `civic_table` (contribute 5 festival points, 10 gold). The five daily contracts cap at 60 gold; no premium path changes these limits.

## 11) Theme Kit + copy

`warm_thimble` uses toasted cream, apricot, river blue, moss green, and kiln red; materials are linen, glazed clay, soft wood, pressed paper, and brushed brass. Dice look like painted seed cubes with rounded corners. Voice is intimate, observant, and lightly humorous, with no threat inflation. The ambient loop is **“Kettle at Four-Way Hearth”**: low kettle hum, bicycle-bell chimes, paper rustle, and distant evening birds. Fashion defaults to layered workwear, patched aprons, practical boots, woven ribbons, and weather hats.

### Player-facing UI labels

| System label | Hearth Season copy |
|---|---|
| Inventory | Satchel |
| Journal | Neighbor Book |
| Map | Road Cloth |
| Quest complete | Promise kept |
| Quest active | On today’s list |
| Shop | Open shelves |
| Currency | Gold coins |
| Cosmetic currency | Festival pins |
| Stamina | Daylight |
| Rest | Ring the bell |
| Craft | Make something useful |
| Garden | Growing places |
| Friendship | Familiarity |
| Festival | Big day |
| Fast travel | — |
| Party | Work circle |
| Settings | House rules |
| Save | Tuck away |
| Retry | Try the other way |
| Exit instance | Step outside |

### New Game card hooks

1. “A small room, a blank plot, and one promise you can keep today.”
2. “The creek has forgotten its stepping stones; your boots have not.”
3. “A cracked planter is still waiting to become useful.”
4. “The wood is quiet because it is listening.”
5. “Four roads meet where nobody owns the table.”
6. “Your first harvest may be a conversation.”
7. “The town’s notice board needs a hand that can read rain.”
8. “Bring one seed; leave with a season of neighbors.”
9. “Moonmeal begins before the lanterns are lit.”
10. “Nothing here asks you to save the world—only to help it hold together.”

## 12) Failures + John’s calls

| Clone risk | Avoidance / call |
|---|---|
| Feels like a famous farming calendar | Default is civic repair and neighbor promises, not marriage, mining, or a prewritten farm inheritance. |
| Becomes a hidden combat game | Pests use clear/relocate ticks; optional encounters give cosmetics and never gate the season. |
| Cozy language hides grind | Every repeatable has visible caps, exact rewards, and a one-click journal objective. |
| Festival becomes a power ladder | Moonmeal awards cosmetics, recipes, and town visuals only. **Speculative:** contribution target 80 is tuned after playtest. |
| NPCs feel like infinite improvisation | Six durable NPCs have bounded talk trees and ten canned hub lines; new text requires authored catalog entries. |

**Default decisions:** no romance system is required for the core route; no player-to-player trading is enabled at soft launch; no raid exists in this world. These are intentional defaults, not blockers.

## Integrity checklist

1. The file is named `WOF_hearth_season_Pack.md`.
2. `worldId` is stable snake_case.
3. Sections 0–12 are present.
4. The world is marked all-ages.
5. No forbidden franchise names appear in canon content.
6. No dump-error world names are used as content.
7. No live-service or backend references are included.
8. The world uses `cozy_tick` rather than a new engine.
9. Four equivalent starting zones are defined.
10. Four non-capital hubs are defined.
11. Two capitals and a mid-world merge are defined.
12. Travel has no teleport shortcut.
13. Six durable NPCs have actual canned dialogue.
14. Hub chatter is bounded and authored.
15. Opening choices include a lodging/stamina stake.
16. HookArc flags are explicit.
17. The primary start has 20 authored quest beats.
18. Objectives use code-completable verbs.
19. Quest rewards are real numeric values.
20. Divergences write visible records.
21. Pests are optional and non-gory.
22. Four five-room soloable instances are specified.
23. The big night is a non-raid festival instance.
24. Progression has 12 non-pay-to-unlock nodes.
25. Daily contracts are capped.
26. Gold and cosmetic pins are separate wallets.
27. Premium cannot buy outcomes or power.
28. Item drops are personal and numeric.
29. UI labels are skinned to the world.
30. Clone risks and defaults are stated.
