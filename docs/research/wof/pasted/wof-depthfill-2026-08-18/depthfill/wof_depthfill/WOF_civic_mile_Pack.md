# WOF Civic Mile: Full Start-Depth Pack

> **Release truth.** Civic Mile is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `civic_mile` |
| Display name | **Civic Mile** |
| One-line pitch | A walkable present-day neighborhood where residents trade favors, repair small civic frictions, host friends, work gentle shifts, and make apartment life feel inhabited. |
| Maturity | **all-ages** |
| rulesModuleId | `civic_rep` |
| Theme Kit | **Civic Mile Theme Kit**, included with world entitlement |
| Genre pattern and fence | Slice-of-life city friendship world. It is not a cyberpunk district, a real city map, or a copied television apartment set. |

Civic Mile is a WOF text world about a walkable present-day neighborhood where residents trade favors, repair small civic frictions, host friends, work gentle shifts, and make apartment life feel inhabited. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Animal Crossing named place |
| 2 | The Sims hero silhouette |
| 3 | Palia logo geometry |
| 4 | Stardew Valley catchphrase |
| 5 | Friends Central Perk signature costume |
| 6 | Seinfeld apartment proprietary creature |
| 7 | Habbo Hotel map layout |
| 8 | IMVU faction title |
| 9 | Second Life weapon profile |
| 10 | GTA city UI chrome |
| 11 | Animal Crossing quest premise |
| 12 | The Sims title typography |
| 13 | Palia color-coded insignia |
| 14 | Stardew Valley music motif |
| 15 | Friends Central Perk vehicle or mount profile |
| 16 | Seinfeld apartment companion anatomy |
| 17 | Habbo Hotel named artifact |
| 18 | IMVU school or agency badge |
| 19 | Second Life real sacred practice as minigame |
| 20 | GTA city stereotyped cultural shorthand |
| 21 | Animal Crossing real-person likeness |
| 22 | The Sims copied dialogue cadence |
| 23 | Palia fan-server slogan |
| 24 | Stardew Valley paid power framing |
| 25 | Friends Central Perk loot-box presentation |
| 26 | Seinfeld apartment named place |
| 27 | Habbo Hotel hero silhouette |
| 28 | IMVU logo geometry |
| 29 | Second Life catchphrase |
| 30 | GTA city signature costume |
| 31 | Animal Crossing proprietary creature |
| 32 | The Sims map layout |
| 33 | Palia faction title |
| 34 | Stardew Valley weapon profile |
| 35 | Friends Central Perk UI chrome |
| 36 | Seinfeld apartment quest premise |
| 37 | Habbo Hotel title typography |
| 38 | IMVU color-coded insignia |
| 39 | Second Life music motif |
| 40 | GTA city vehicle or mount profile |
| 41 | Animal Crossing companion anatomy |
| 42 | The Sims named artifact |
| 43 | Palia school or agency badge |
| 44 | Stardew Valley real sacred practice as minigame |
| 45 | Friends Central Perk stereotyped cultural shorthand |
| 46 | Seinfeld apartment real-person likeness |
| 47 | Habbo Hotel copied dialogue cadence |
| 48 | IMVU fan-server slogan |
| 49 | Second Life paid power framing |
| 50 | GTA city loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | energy, civicRep, leaseKey, shiftClock, clubMarks, neighborFavor, rentDue, mood |
| Wipe and checkpoint | Wipe returns the party to `civic_mile_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Civic Mile • {{turn}} • committed |
| 2 | [Route] Civic Mile • {{placeId}} • committed |
| 3 | [Work] Civic Mile • {{lastAction}} • committed |
| 4 | [Talk] Civic Mile • {{npcId}} • committed |
| 5 | [Kit] Civic Mile • {{kitId}} • committed |
| 6 | [Pack] Civic Mile • {{partySize}} • committed |
| 7 | [Rest] Civic Mile • {{checkpoint}} • committed |
| 8 | [Safety] Civic Mile • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| civic_mile_kit_01 | Block Host | soft cardigan with enamel pin | organize a welcome table | Never enter a home without an invitation. | Use neighborly observations and offer one practical next step. | block_host mantle; block_host tool; civic_mile_map_01 | civic_mile_place_01; civic_mile_q_01 | civic_mile_ability_01 |
| civic_mile_kit_02 | Window Gardener | canvas overshirt and soil gloves | tend shared balcony beds | Never harvest from a shared planter without leaving a note. | Use neighborly observations and offer one practical next step. | window_gardener vest; window_gardener tool; civic_mile_map_02 | civic_mile_place_02; civic_mile_q_02 | civic_mile_ability_02 |
| civic_mile_kit_03 | Market Runner | crossbody market tote | coordinate vendor pickups | Never promise a vendor slot you cannot keep. | Use neighborly observations and offer one practical next step. | market_runner jacket; market_runner tool; civic_mile_map_03 | civic_mile_place_01; civic_mile_q_03 | civic_mile_ability_03 |
| civic_mile_kit_04 | Hall Steward | navy vest with keyring | settle building notices | Never read a sealed building notice aloud. | Use neighborly observations and offer one practical next step. | hall_steward sash; hall_steward tool; civic_mile_map_04 | civic_mile_place_02; civic_mile_q_04 | civic_mile_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `civic_mile_place_01` is a shared hub rather than a capital analogue; `civic_mile_place_04` is the mid-join; `civic_mile_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| civic_mile_place_01 | Juniper Station | shared hub | street | safe | yes | civic_mile_place_02, civic_mile_place_04 | A public notice at Juniper Station has been posted with one crucial line washed away. |
| civic_mile_place_02 | Mile Market | start hub | street | safe | yes | civic_mile_place_01, civic_mile_place_03 | A work roster at Mile Market leaves two neighbours believing they were promised the same task. |
| civic_mile_place_03 | Maple Court | street route | street | safe | yes | civic_mile_place_02, civic_mile_place_04 | A route marker at Maple Court points visitors toward a closed gate and needs a safe correction. |
| civic_mile_place_04 | Rooftop Garden | mid join | street | low | yes | civic_mile_place_03, civic_mile_place_05, civic_mile_place_01 | A newcomer at Rooftop Garden needs a local introduction before a small obligation becomes embarrassing. |
| civic_mile_place_05 | Lantern Plaza | work district | interior | low | no | civic_mile_place_04, civic_mile_place_06 | A shared tool at Lantern Plaza has been returned without its care tag. |
| civic_mile_place_06 | Riverwalk Hall | instance door | dungeon | medium | no | civic_mile_place_05, civic_mile_place_07 | The entry record at Riverwalk Hall names an unfinished errand, not a monster or apocalypse. |
| civic_mile_place_07 | Cedar Laundrette | wild edge | street | medium | yes | civic_mile_place_06, civic_mile_place_08 | A weather change at Cedar Laundrette threatens a community plan unless someone reads the signs. |
| civic_mile_place_08 | Brickline Library | housing approach | interior | low | no | civic_mile_place_07 | A resident at Brickline Library has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| civic_mile_npc_01 | Alden Vane | civic_mile_place_01 | quest | Alden Vane says, ‘Civic Mile keeps its promises in small places. Tell me which one you noticed.’ | Alden Vane offers a specific task at Juniper Station: settle the practical mismatch before it costs someone a shift. | Alden Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| civic_mile_npc_02 | Bryn Quill | civic_mile_place_02 | profession | Bryn Quill says, ‘Civic Mile keeps its promises in small places. Tell me which one you noticed.’ | Bryn Quill offers a specific task at Mile Market: settle the practical mismatch before it costs someone a shift. | Bryn Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| civic_mile_npc_03 | Cato Vale | civic_mile_place_03 | hub | Cato Vale says, ‘Civic Mile keeps its promises in small places. Tell me which one you noticed.’ | Cato Vale offers a specific task at Maple Court: settle the practical mismatch before it costs someone a shift. | Cato Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| civic_mile_npc_04 | Dessa Wren | civic_mile_place_04 | merchant | Dessa Wren says, ‘Civic Mile keeps its promises in small places. Tell me which one you noticed.’ | Dessa Wren offers a specific task at Rooftop Garden: settle the practical mismatch before it costs someone a shift. | Dessa Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| civic_mile_npc_05 | Eris Morrow | civic_mile_place_01 | local | Eris Morrow says, ‘Civic Mile keeps its promises in small places. Tell me which one you noticed.’ | Eris Morrow offers a specific task at Juniper Station: settle the practical mismatch before it costs someone a shift. | Eris Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| civic_mile_npc_06 | Fenn Rowan | civic_mile_place_02 | host | Fenn Rowan says, ‘Civic Mile keeps its promises in small places. Tell me which one you noticed.’ | Fenn Rowan offers a specific task at Mile Market: settle the practical mismatch before it costs someone a shift. | Fenn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| civic_mile_npc_07 | Gala Nook | civic_mile_place_03 | quest | Gala Nook says, ‘Civic Mile keeps its promises in small places. Tell me which one you noticed.’ | Gala Nook offers a specific task at Maple Court: settle the practical mismatch before it costs someone a shift. | Gala Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| civic_mile_npc_08 | Holl Cress | civic_mile_place_04 | profession | Holl Cress says, ‘Civic Mile keeps its promises in small places. Tell me which one you noticed.’ | Holl Cress offers a specific task at Rooftop Garden: settle the practical mismatch before it costs someone a shift. | Holl Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| civic_mile_npc_09 | Ivo Silt | civic_mile_place_01 | local | Ivo Silt says, ‘Civic Mile keeps its promises in small places. Tell me which one you noticed.’ | Ivo Silt offers a specific task at Juniper Station: settle the practical mismatch before it costs someone a shift. | Ivo Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| civic_mile_npc_10 | Jori Pryce | civic_mile_place_02 | merchant | Jori Pryce says, ‘Civic Mile keeps its promises in small places. Tell me which one you noticed.’ | Jori Pryce offers a specific task at Mile Market: settle the practical mismatch before it costs someone a shift. | Jori Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Rooftop Garden, if that is useful. |
| 2 | Civic Mile feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Riverwalk Hall. |
| 5 | Let’s keep the route clear for whoever comes after. |
| 6 | A good note saves a long explanation. |
| 7 | I have room for one more careful pair of hands. |
| 8 | The local rule is simple; the reason is not. |
| 9 | I can wait while you check your ledger. |
| 10 | That is kind of you to ask first. |
| 11 | We can take the safer path without making a scene. |
| 12 | I will remember that help came from this direction. |


## 5. Premade choices and first hour

### Opening establishment deck

| Kit | Look and origin | Visible stake | First quest |
| --- | --- | --- | --- |
| Block Host | At Juniper Station, you arrive in block_host mantle carrying civic_mile_map_01. A small obligation is already late. | Give up one turn to help now. | Civic Mile: Name a Working Promise |
| Window Gardener | At Mile Market, you arrive in window_gardener vest carrying civic_mile_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Civic Mile: Set the First Tool Aside |
| Market Runner | At Juniper Station, you arrive in market_runner jacket carrying civic_mile_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Civic Mile: Carry the Right Record |
| Hall Steward | At Mile Market, you arrive in hall_steward sash carrying civic_mile_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Civic Mile: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_civic_mile_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Juniper Station’s small mismatch | ask | missing tag | A local need at Rooftop Garden is connected but not catastrophic. | alternate talk |
| 2 | Resolve Mile Market’s small mismatch | repair | closed path | A local need at Lantern Plaza is connected but not catastrophic. | new route |
| 3 | Resolve Maple Court’s small mismatch | carry | unclear note | A local need at Riverwalk Hall is connected but not catastrophic. | recorded favor |
| 4 | Resolve Rooftop Garden’s small mismatch | listen | late guest | A local need at Cedar Laundrette is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Lantern Plaza’s small mismatch | map | wet weather | A local need at Brickline Library is connected but not catastrophic. | slower reward |
| 6 | Resolve Riverwalk Hall’s small mismatch | prepare | busy shift | A local need at Juniper Station is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Cedar Laundrette’s small mismatch | wait | quiet boundary | A local need at Mile Market is connected but not catastrophic. | solo option |
| 8 | Resolve Brickline Library’s small mismatch | return | wrong room | A local need at Maple Court is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Rainy-Day Open House` and `Riverwalk Potluck`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| civic_mile_q_01 | Civic Mile: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| civic_mile_q_02 | Civic Mile: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| civic_mile_q_03 | Civic Mile: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| civic_mile_q_04 | Civic Mile: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| civic_mile_q_05 | Civic Mile: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| civic_mile_q_06 | Civic Mile: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| civic_mile_q_07 | Civic Mile: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| civic_mile_q_08 | Civic Mile: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| civic_mile_q_09 | Civic Mile: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| civic_mile_q_10 | Civic Mile: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| civic_mile_q_11 | Civic Mile: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| civic_mile_q_12 | Civic Mile: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| civic_mile_q_13 | Civic Mile: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| civic_mile_q_14 | Civic Mile: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| civic_mile_q_15 | Civic Mile: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| civic_mile_q_16 | Civic Mile: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| civic_mile_q_17 | Civic Mile: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| civic_mile_q_18 | Civic Mile: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| civic_mile_q_19 | Civic Mile: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| civic_mile_q_20 | Civic Mile: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| civic_mile_q_21 | Civic Mile: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| civic_mile_q_22 | Civic Mile: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| civic_mile_q_23 | Civic Mile: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| civic_mile_q_24 | Civic Mile: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| civic_mile_q_25 | Civic Mile: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Juniper Station`: write `civic_mile_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Rooftop Garden`: write `civic_mile_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `civic_mile_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| civic_mile_species_01 | Window Swift | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_02 | Pavement Snail | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_03 | Rooftop Bee | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_04 | Alley Sparrow | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_05 | Market Turtle | activity | 0 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_06 | Library Moth | activity | 0 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_07 | Planter Lizard | activity | 0 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_08 | Laundry Pigeon | activity | 0 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_09 | River Carp | activity | 0 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_10 | Maple Squirrel | activity | 0 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_11 | Tea Ant | activity | 0 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_12 | Courtyard Cat | activity | 0 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_13 | Brick Beetle | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_14 | Garden Robin | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_15 | Paper Fish | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| civic_mile_species_16 | Sunset Bat | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Mile Cash**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Porch Pins**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Juniper Station token, Mile Market tool, Maple Court thread, Rooftop Garden seal, Lantern Plaza bundle, Riverwalk Hall token. |
| Instance and cosmetic templates | Cedar Laundrette tool, Brickline Library thread, Juniper Station seal, Mile Market bundle, Maple Court token, Rooftop Garden tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `civic_mile_vendor_01` at `civic_mile_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| civic_mile_dungeon_room_01 | The Rainy-Day Open House: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: civic_mile_species_01, civic_mile_species_02; elite: none |   |
| civic_mile_dungeon_room_02 | The Rainy-Day Open House: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: civic_mile_species_03, civic_mile_species_04; elite: none |   |
| civic_mile_dungeon_room_03 | The Rainy-Day Open House: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: civic_mile_species_05, civic_mile_species_06; elite: civic_mile_species_09 |   |
| civic_mile_dungeon_room_04 | The Rainy-Day Open House: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: civic_mile_species_07, civic_mile_species_08; elite: none | checkpoint  |
| civic_mile_dungeon_room_05 | The Rainy-Day Open House: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: civic_mile_species_09, civic_mile_species_10; elite: none |  boss: civic_mile_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`civic_mile_trap_01`), jammed latch (`civic_mile_trap_02`), wet threshold (`civic_mile_trap_03`), false shelf (`civic_mile_trap_04`), quiet bell (`civic_mile_trap_05`), sealed drawer (`civic_mile_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Riverwalk Potluck** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| civic_mile_talent_01 | Civic Mile Local Ear | 1 | none | civic_mile_effect_01 |
| civic_mile_talent_02 | Civic Mile Careful Hand | 2 | none | civic_mile_effect_02 |
| civic_mile_talent_03 | Civic Mile Route Sense | 3 | none | civic_mile_effect_03 |
| civic_mile_talent_04 | Civic Mile Shared Measure | 4 | none | civic_mile_effect_04 |
| civic_mile_talent_05 | Civic Mile Quiet Craft | 1 | civic_mile_talent_04 | civic_mile_effect_05 |
| civic_mile_talent_06 | Civic Mile Open Invitation | 2 | none | civic_mile_effect_06 |
| civic_mile_talent_07 | Civic Mile Safe Return | 3 | none | civic_mile_effect_07 |
| civic_mile_talent_08 | Civic Mile Field Note | 4 | none | civic_mile_effect_08 |
| civic_mile_talent_09 | Civic Mile Steady Pace | 1 | civic_mile_talent_08 | civic_mile_effect_09 |
| civic_mile_talent_10 | Civic Mile Clear Signal | 2 | none | civic_mile_effect_10 |
| civic_mile_talent_11 | Civic Mile Warm Welcome | 3 | none | civic_mile_effect_11 |
| civic_mile_talent_12 | Civic Mile Small Courage | 4 | none | civic_mile_effect_12 |
| civic_mile_talent_13 | Civic Mile Repair Habit | 1 | civic_mile_talent_12 | civic_mile_effect_13 |
| civic_mile_talent_14 | Civic Mile Trust Mark | 2 | none | civic_mile_effect_14 |
| civic_mile_talent_15 | Civic Mile Second Look | 3 | none | civic_mile_effect_15 |
| civic_mile_talent_16 | Civic Mile Closing Grace | 4 | none | civic_mile_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| civic_mile_contract_01 | Civic Mile Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| civic_mile_contract_02 | Civic Mile Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| civic_mile_contract_03 | Civic Mile Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| civic_mile_contract_04 | Civic Mile Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| civic_mile_contract_05 | Civic Mile Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| civic_mile_contract_06 | Civic Mile Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| civic_mile_contract_07 | Civic Mile Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| civic_mile_contract_08 | Civic Mile Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| civic_mile_interact_01 | Juniper Station bench | rest | civic_mile_place_01 |
| civic_mile_interact_02 | Mile Market cabinet | repair | civic_mile_place_02 |
| civic_mile_interact_03 | Maple Court rack | tend | civic_mile_place_03 |
| civic_mile_interact_04 | Rooftop Garden kettle | craft | civic_mile_place_04 |
| civic_mile_interact_05 | Lantern Plaza ledger | cook | civic_mile_place_05 |
| civic_mile_interact_06 | Riverwalk Hall rail | bind_inn | civic_mile_place_06 |
| civic_mile_interact_07 | Cedar Laundrette bell | inspect | civic_mile_place_07 |
| civic_mile_interact_08 | Brickline Library board | open | civic_mile_place_08 |
| civic_mile_interact_09 | Juniper Station table | carry | civic_mile_place_01 |
| civic_mile_interact_10 | Mile Market lamp | clean | civic_mile_place_02 |
| civic_mile_interact_11 | Maple Court gate | signal | civic_mile_place_03 |
| civic_mile_interact_12 | Rooftop Garden shelf | record | civic_mile_place_04 |


**Default interior graph.** `civic_mile_interior_01` enters from `civic_mile_place_08` and contains 7 connected rooms: Civic Mile Entry, Civic Mile Main Room, Civic Mile Work Nook, Civic Mile Window Room, Civic Mile Quiet Room, Civic Mile Storage, Civic Mile Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | juniper, mile, maple, rooftop materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Civic Mile` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use neighborly observations and offer one practical next step. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Civic Mile: distant work, a room tone, a gentle rhythm that belongs to Juniper Station, and a second layer that makes the route toward Riverwalk Hall feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Civic Mile Ledger |
| 2 | Civic Mile Route |
| 3 | Civic Mile Work |
| 4 | Civic Mile Talk |
| 5 | Civic Mile Kit |
| 6 | Civic Mile Pack |
| 7 | Civic Mile Rest |
| 8 | Civic Mile Safety |
| 9 | Civic Mile Map |
| 10 | Civic Mile Notice |
| 11 | Civic Mile Favour |
| 12 | Civic Mile Gold |
| 13 | Civic Mile Token |
| 14 | Civic Mile Record |
| 15 | Civic Mile Instance |
| 16 | Civic Mile Checkpoint |
| 17 | Civic Mile Choice |
| 18 | Civic Mile Help |
| 19 | Civic Mile Calendar |
| 20 | Civic Mile Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Juniper Station, a small promise has your name on it. |
| 2 | At Mile Market, a small promise has your name on it. |
| 3 | At Maple Court, a small promise has your name on it. |
| 4 | At Rooftop Garden, a small promise has your name on it. |
| 5 | At Lantern Plaza, a small promise has your name on it. |
| 6 | At Riverwalk Hall, a small promise has your name on it. |
| 7 | At Cedar Laundrette, a small promise has your name on it. |
| 8 | At Brickline Library, a small promise has your name on it. |
| 9 | At Juniper Station, a small promise has your name on it. |
| 10 | At Mile Market, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is slice-of-life city friendship world. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
