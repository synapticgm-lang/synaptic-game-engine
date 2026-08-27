# WOF Kindred Hide: Full Start-Depth Pack

> **Release truth.** Kindred Hide is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `kindred_hide` |
| Display name | **Kindred Hide** |
| One-line pitch | An original folk social world of studios, quiet dens, and consentful visits where people define their own presentation, boundaries, and club life through canned, safe social play. |
| Maturity | **all-ages** |
| rulesModuleId | `hide_voice` |
| Theme Kit | **Kindred Hide Theme Kit**, included with world entitlement |
| Genre pattern and fence | Anthro identity and hangout world. It is not a pony town, cat-clan copy, furry trademark venue, or open-chat platform. |

Kindred Hide is a WOF text world about an original folk social world of studios, quiet dens, and consentful visits where people define their own presentation, boundaries, and club life through canned, safe social play. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | My Little Pony named place |
| 2 | Pony Town hero silhouette |
| 3 | Warrior Cats logo geometry |
| 4 | Furcadia catchphrase |
| 5 | Zootopia signature costume |
| 6 | Redwall proprietary creature |
| 7 | Sonic map layout |
| 8 | Disney fox faction title |
| 9 | Neopets weapon profile |
| 10 | Furry Fandom trademark UI chrome |
| 11 | My Little Pony quest premise |
| 12 | Pony Town title typography |
| 13 | Warrior Cats color-coded insignia |
| 14 | Furcadia music motif |
| 15 | Zootopia vehicle or mount profile |
| 16 | Redwall companion anatomy |
| 17 | Sonic named artifact |
| 18 | Disney fox school or agency badge |
| 19 | Neopets real sacred practice as minigame |
| 20 | Furry Fandom trademark stereotyped cultural shorthand |
| 21 | My Little Pony real-person likeness |
| 22 | Pony Town copied dialogue cadence |
| 23 | Warrior Cats fan-server slogan |
| 24 | Furcadia paid power framing |
| 25 | Zootopia loot-box presentation |
| 26 | Redwall named place |
| 27 | Sonic hero silhouette |
| 28 | Disney fox logo geometry |
| 29 | Neopets catchphrase |
| 30 | Furry Fandom trademark signature costume |
| 31 | My Little Pony proprietary creature |
| 32 | Pony Town map layout |
| 33 | Warrior Cats faction title |
| 34 | Furcadia weapon profile |
| 35 | Zootopia UI chrome |
| 36 | Redwall quest premise |
| 37 | Sonic title typography |
| 38 | Disney fox color-coded insignia |
| 39 | Neopets music motif |
| 40 | Furry Fandom trademark vehicle or mount profile |
| 41 | My Little Pony companion anatomy |
| 42 | Pony Town named artifact |
| 43 | Warrior Cats school or agency badge |
| 44 | Furcadia real sacred practice as minigame |
| 45 | Zootopia stereotyped cultural shorthand |
| 46 | Redwall real-person likeness |
| 47 | Sonic copied dialogue cadence |
| 48 | Disney fox fan-server slogan |
| 49 | Neopets paid power framing |
| 50 | Furry Fandom trademark loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | energy, voice, style, boundaries, clubRep, invites, craft, comfort |
| Wipe and checkpoint | Wipe returns the party to `kindred_hide_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Kindred Hide • {{turn}} • committed |
| 2 | [Route] Kindred Hide • {{placeId}} • committed |
| 3 | [Work] Kindred Hide • {{lastAction}} • committed |
| 4 | [Talk] Kindred Hide • {{npcId}} • committed |
| 5 | [Kit] Kindred Hide • {{kitId}} • committed |
| 6 | [Pack] Kindred Hide • {{partySize}} • committed |
| 7 | [Rest] Kindred Hide • {{checkpoint}} • committed |
| 8 | [Safety] Kindred Hide • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| kindred_hide_kit_01 | Velvet Morrow | moss velvet collar coat | curate a soft-voice club | Never name another person’s folk type for them. | Offer a choice, name a boundary, then leave room for an answer. | velvet_morrow mantle; velvet_morrow tool; kindred_hide_map_01 | kindred_hide_place_01; kindred_hide_q_01 | kindred_hide_ability_01 |
| kindred_hide_kit_02 | Cairn Reed | river-reed vest | repair shared performance curtains | Never enter the Quiet Den without a green invitation. | Offer a choice, name a boundary, then leave room for an answer. | cairn_reed vest; cairn_reed tool; kindred_hide_map_02 | kindred_hide_place_02; kindred_hide_q_02 | kindred_hide_ability_02 |
| kindred_hide_kit_03 | Pipetide Fern | pollen yellow shawl | label a comfort-first craft shelf | Never copy a maker’s crest without consent. | Offer a choice, name a boundary, then leave room for an answer. | pipetide_fern jacket; pipetide_fern tool; kindred_hide_map_03 | kindred_hide_place_01; kindred_hide_q_03 | kindred_hide_ability_03 |
| kindred_hide_kit_04 | Brasswhistle Sable | brass-button overskirt | host an opt-in tea circle | Never turn a boundary card into a joke. | Offer a choice, name a boundary, then leave room for an answer. | brasswhistle_sable sash; brasswhistle_sable tool; kindred_hide_map_04 | kindred_hide_place_02; kindred_hide_q_04 | kindred_hide_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `kindred_hide_place_01` is a shared hub rather than a capital analogue; `kindred_hide_place_04` is the mid-join; `kindred_hide_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| kindred_hide_place_01 | Welcome Burrow | shared hub | street | safe | yes | kindred_hide_place_02, kindred_hide_place_04 | A public notice at Welcome Burrow has been posted with one crucial line washed away. |
| kindred_hide_place_02 | Mosslight Arcade | start hub | street | safe | yes | kindred_hide_place_01, kindred_hide_place_03 | A work roster at Mosslight Arcade leaves two neighbours believing they were promised the same task. |
| kindred_hide_place_03 | Tailor Steps | street route | street | safe | yes | kindred_hide_place_02, kindred_hide_place_04 | A route marker at Tailor Steps points visitors toward a closed gate and needs a safe correction. |
| kindred_hide_place_04 | Sunroom Square | mid join | street | low | yes | kindred_hide_place_03, kindred_hide_place_05, kindred_hide_place_01 | A newcomer at Sunroom Square needs a local introduction before a small obligation becomes embarrassing. |
| kindred_hide_place_05 | Quiet Den | work district | interior | low | no | kindred_hide_place_04, kindred_hide_place_06 | A shared tool at Quiet Den has been returned without its care tag. |
| kindred_hide_place_06 | Bridge Bloom | instance door | dungeon | medium | no | kindred_hide_place_05, kindred_hide_place_07 | The entry record at Bridge Bloom names an unfinished errand, not a monster or apocalypse. |
| kindred_hide_place_07 | Candlepaw Studio | wild edge | street | medium | yes | kindred_hide_place_06, kindred_hide_place_08 | A weather change at Candlepaw Studio threatens a community plan unless someone reads the signs. |
| kindred_hide_place_08 | Dovetail Baths | housing approach | interior | low | no | kindred_hide_place_07 | A resident at Dovetail Baths has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| kindred_hide_npc_01 | Cato Morrow | kindred_hide_place_01 | quest | Cato Morrow says, ‘Kindred Hide keeps its promises in small places. Tell me which one you noticed.’ | Cato Morrow offers a specific task at Welcome Burrow: settle the practical mismatch before it costs someone a shift. | Cato Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| kindred_hide_npc_02 | Dessa Rowan | kindred_hide_place_02 | profession | Dessa Rowan says, ‘Kindred Hide keeps its promises in small places. Tell me which one you noticed.’ | Dessa Rowan offers a specific task at Mosslight Arcade: settle the practical mismatch before it costs someone a shift. | Dessa Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| kindred_hide_npc_03 | Eris Nook | kindred_hide_place_03 | hub | Eris Nook says, ‘Kindred Hide keeps its promises in small places. Tell me which one you noticed.’ | Eris Nook offers a specific task at Tailor Steps: settle the practical mismatch before it costs someone a shift. | Eris Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| kindred_hide_npc_04 | Fenn Cress | kindred_hide_place_04 | merchant | Fenn Cress says, ‘Kindred Hide keeps its promises in small places. Tell me which one you noticed.’ | Fenn Cress offers a specific task at Sunroom Square: settle the practical mismatch before it costs someone a shift. | Fenn Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| kindred_hide_npc_05 | Gala Silt | kindred_hide_place_01 | local | Gala Silt says, ‘Kindred Hide keeps its promises in small places. Tell me which one you noticed.’ | Gala Silt offers a specific task at Welcome Burrow: settle the practical mismatch before it costs someone a shift. | Gala Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| kindred_hide_npc_06 | Holl Pryce | kindred_hide_place_02 | host | Holl Pryce says, ‘Kindred Hide keeps its promises in small places. Tell me which one you noticed.’ | Holl Pryce offers a specific task at Mosslight Arcade: settle the practical mismatch before it costs someone a shift. | Holl Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| kindred_hide_npc_07 | Ivo Vane | kindred_hide_place_03 | quest | Ivo Vane says, ‘Kindred Hide keeps its promises in small places. Tell me which one you noticed.’ | Ivo Vane offers a specific task at Tailor Steps: settle the practical mismatch before it costs someone a shift. | Ivo Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| kindred_hide_npc_08 | Jori Quill | kindred_hide_place_04 | profession | Jori Quill says, ‘Kindred Hide keeps its promises in small places. Tell me which one you noticed.’ | Jori Quill offers a specific task at Sunroom Square: settle the practical mismatch before it costs someone a shift. | Jori Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| kindred_hide_npc_09 | Alden Vale | kindred_hide_place_01 | local | Alden Vale says, ‘Kindred Hide keeps its promises in small places. Tell me which one you noticed.’ | Alden Vale offers a specific task at Welcome Burrow: settle the practical mismatch before it costs someone a shift. | Alden Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| kindred_hide_npc_10 | Bryn Wren | kindred_hide_place_02 | merchant | Bryn Wren says, ‘Kindred Hide keeps its promises in small places. Tell me which one you noticed.’ | Bryn Wren offers a specific task at Mosslight Arcade: settle the practical mismatch before it costs someone a shift. | Bryn Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Sunroom Square, if that is useful. |
| 2 | Kindred Hide feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at Bridge Bloom. |
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
| Velvet Morrow | At Welcome Burrow, you arrive in velvet_morrow mantle carrying kindred_hide_map_01. A small obligation is already late. | Give up one turn to help now. | Kindred Hide: Name a Working Promise |
| Cairn Reed | At Mosslight Arcade, you arrive in cairn_reed vest carrying kindred_hide_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Kindred Hide: Set the First Tool Aside |
| Pipetide Fern | At Welcome Burrow, you arrive in pipetide_fern jacket carrying kindred_hide_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Kindred Hide: Carry the Right Record |
| Brasswhistle Sable | At Mosslight Arcade, you arrive in brasswhistle_sable sash carrying kindred_hide_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Kindred Hide: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_kindred_hide_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Welcome Burrow’s small mismatch | ask | missing tag | A local need at Sunroom Square is connected but not catastrophic. | alternate talk |
| 2 | Resolve Mosslight Arcade’s small mismatch | repair | closed path | A local need at Quiet Den is connected but not catastrophic. | new route |
| 3 | Resolve Tailor Steps’s small mismatch | carry | unclear note | A local need at Bridge Bloom is connected but not catastrophic. | recorded favor |
| 4 | Resolve Sunroom Square’s small mismatch | listen | late guest | A local need at Candlepaw Studio is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Quiet Den’s small mismatch | map | wet weather | A local need at Dovetail Baths is connected but not catastrophic. | slower reward |
| 6 | Resolve Bridge Bloom’s small mismatch | prepare | busy shift | A local need at Welcome Burrow is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Candlepaw Studio’s small mismatch | wait | quiet boundary | A local need at Mosslight Arcade is connected but not catastrophic. | solo option |
| 8 | Resolve Dovetail Baths’s small mismatch | return | wrong room | A local need at Tailor Steps is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Closed-Curtain Rehearsal` and `Bridge Bloom Showcase`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| kindred_hide_q_01 | Kindred Hide: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| kindred_hide_q_02 | Kindred Hide: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| kindred_hide_q_03 | Kindred Hide: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| kindred_hide_q_04 | Kindred Hide: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| kindred_hide_q_05 | Kindred Hide: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| kindred_hide_q_06 | Kindred Hide: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| kindred_hide_q_07 | Kindred Hide: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| kindred_hide_q_08 | Kindred Hide: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| kindred_hide_q_09 | Kindred Hide: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| kindred_hide_q_10 | Kindred Hide: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| kindred_hide_q_11 | Kindred Hide: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| kindred_hide_q_12 | Kindred Hide: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| kindred_hide_q_13 | Kindred Hide: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| kindred_hide_q_14 | Kindred Hide: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| kindred_hide_q_15 | Kindred Hide: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| kindred_hide_q_16 | Kindred Hide: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| kindred_hide_q_17 | Kindred Hide: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| kindred_hide_q_18 | Kindred Hide: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| kindred_hide_q_19 | Kindred Hide: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| kindred_hide_q_20 | Kindred Hide: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| kindred_hide_q_21 | Kindred Hide: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| kindred_hide_q_22 | Kindred Hide: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| kindred_hide_q_23 | Kindred Hide: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| kindred_hide_q_24 | Kindred Hide: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| kindred_hide_q_25 | Kindred Hide: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Welcome Burrow`: write `kindred_hide_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Sunroom Square`: write `kindred_hide_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `kindred_hide_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| kindred_hide_species_01 | Velvet Morrow | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_02 | Cairn Reed | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_03 | Pipetide Fern | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_04 | Brasswhistle Sable | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_05 | Dapple Rook | activity | 0 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_06 | Mosslynx | activity | 0 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_07 | Tidehorn | activity | 0 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_08 | Quill Otter | activity | 0 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_09 | Bloom Badger | activity | 0 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_10 | Rill Fox | activity | 0 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_11 | Candle Mouse | activity | 0 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_12 | Thrum Deer | activity | 0 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_13 | Sable Moth | activity | 0 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_14 | Shale Dove | activity | 0 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_15 | Wicker Mink | activity | 0 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| kindred_hide_species_16 | Rain Stoat | activity | 0 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Hide Buttons**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Moss Charms**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Welcome Burrow token, Mosslight Arcade tool, Tailor Steps thread, Sunroom Square seal, Quiet Den bundle, Bridge Bloom token. |
| Instance and cosmetic templates | Candlepaw Studio tool, Dovetail Baths thread, Welcome Burrow seal, Mosslight Arcade bundle, Tailor Steps token, Sunroom Square tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `kindred_hide_vendor_01` at `kindred_hide_place_01`; listed prices are numeric. Repair cost per point: 0. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| kindred_hide_dungeon_room_01 | The Closed-Curtain Rehearsal: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: kindred_hide_species_01, kindred_hide_species_02; elite: none |   |
| kindred_hide_dungeon_room_02 | The Closed-Curtain Rehearsal: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: kindred_hide_species_03, kindred_hide_species_04; elite: none |   |
| kindred_hide_dungeon_room_03 | The Closed-Curtain Rehearsal: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: kindred_hide_species_05, kindred_hide_species_06; elite: kindred_hide_species_09 |   |
| kindred_hide_dungeon_room_04 | The Closed-Curtain Rehearsal: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: kindred_hide_species_07, kindred_hide_species_08; elite: none | checkpoint  |
| kindred_hide_dungeon_room_05 | The Closed-Curtain Rehearsal: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: kindred_hide_species_09, kindred_hide_species_10; elite: none |  boss: kindred_hide_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`kindred_hide_trap_01`), jammed latch (`kindred_hide_trap_02`), wet threshold (`kindred_hide_trap_03`), false shelf (`kindred_hide_trap_04`), quiet bell (`kindred_hide_trap_05`), sealed drawer (`kindred_hide_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Bridge Bloom Showcase** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| kindred_hide_talent_01 | Kindred Hide Local Ear | 1 | none | kindred_hide_effect_01 |
| kindred_hide_talent_02 | Kindred Hide Careful Hand | 2 | none | kindred_hide_effect_02 |
| kindred_hide_talent_03 | Kindred Hide Route Sense | 3 | none | kindred_hide_effect_03 |
| kindred_hide_talent_04 | Kindred Hide Shared Measure | 4 | none | kindred_hide_effect_04 |
| kindred_hide_talent_05 | Kindred Hide Quiet Craft | 1 | kindred_hide_talent_04 | kindred_hide_effect_05 |
| kindred_hide_talent_06 | Kindred Hide Open Invitation | 2 | none | kindred_hide_effect_06 |
| kindred_hide_talent_07 | Kindred Hide Safe Return | 3 | none | kindred_hide_effect_07 |
| kindred_hide_talent_08 | Kindred Hide Field Note | 4 | none | kindred_hide_effect_08 |
| kindred_hide_talent_09 | Kindred Hide Steady Pace | 1 | kindred_hide_talent_08 | kindred_hide_effect_09 |
| kindred_hide_talent_10 | Kindred Hide Clear Signal | 2 | none | kindred_hide_effect_10 |
| kindred_hide_talent_11 | Kindred Hide Warm Welcome | 3 | none | kindred_hide_effect_11 |
| kindred_hide_talent_12 | Kindred Hide Small Courage | 4 | none | kindred_hide_effect_12 |
| kindred_hide_talent_13 | Kindred Hide Repair Habit | 1 | kindred_hide_talent_12 | kindred_hide_effect_13 |
| kindred_hide_talent_14 | Kindred Hide Trust Mark | 2 | none | kindred_hide_effect_14 |
| kindred_hide_talent_15 | Kindred Hide Second Look | 3 | none | kindred_hide_effect_15 |
| kindred_hide_talent_16 | Kindred Hide Closing Grace | 4 | none | kindred_hide_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| kindred_hide_contract_01 | Kindred Hide Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| kindred_hide_contract_02 | Kindred Hide Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| kindred_hide_contract_03 | Kindred Hide Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| kindred_hide_contract_04 | Kindred Hide Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| kindred_hide_contract_05 | Kindred Hide Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| kindred_hide_contract_06 | Kindred Hide Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| kindred_hide_contract_07 | Kindred Hide Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| kindred_hide_contract_08 | Kindred Hide Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| kindred_hide_interact_01 | Welcome Burrow bench | rest | kindred_hide_place_01 |
| kindred_hide_interact_02 | Mosslight Arcade cabinet | repair | kindred_hide_place_02 |
| kindred_hide_interact_03 | Tailor Steps rack | tend | kindred_hide_place_03 |
| kindred_hide_interact_04 | Sunroom Square kettle | craft | kindred_hide_place_04 |
| kindred_hide_interact_05 | Quiet Den ledger | cook | kindred_hide_place_05 |
| kindred_hide_interact_06 | Bridge Bloom rail | bind_inn | kindred_hide_place_06 |
| kindred_hide_interact_07 | Candlepaw Studio bell | inspect | kindred_hide_place_07 |
| kindred_hide_interact_08 | Dovetail Baths board | open | kindred_hide_place_08 |
| kindred_hide_interact_09 | Welcome Burrow table | carry | kindred_hide_place_01 |
| kindred_hide_interact_10 | Mosslight Arcade lamp | clean | kindred_hide_place_02 |
| kindred_hide_interact_11 | Tailor Steps gate | signal | kindred_hide_place_03 |
| kindred_hide_interact_12 | Sunroom Square shelf | record | kindred_hide_place_04 |


**Default interior graph.** `kindred_hide_interior_01` enters from `kindred_hide_place_08` and contains 7 connected rooms: Kindred Hide Entry, Kindred Hide Main Room, Kindred Hide Work Nook, Kindred Hide Window Room, Kindred Hide Quiet Room, Kindred Hide Storage, Kindred Hide Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | welcome, mosslight, tailor, sunroom materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Kindred Hide` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Offer a choice, name a boundary, then leave room for an answer. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Kindred Hide: distant work, a room tone, a gentle rhythm that belongs to Welcome Burrow, and a second layer that makes the route toward Bridge Bloom feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Kindred Hide Ledger |
| 2 | Kindred Hide Route |
| 3 | Kindred Hide Work |
| 4 | Kindred Hide Talk |
| 5 | Kindred Hide Kit |
| 6 | Kindred Hide Pack |
| 7 | Kindred Hide Rest |
| 8 | Kindred Hide Safety |
| 9 | Kindred Hide Map |
| 10 | Kindred Hide Notice |
| 11 | Kindred Hide Favour |
| 12 | Kindred Hide Gold |
| 13 | Kindred Hide Token |
| 14 | Kindred Hide Record |
| 15 | Kindred Hide Instance |
| 16 | Kindred Hide Checkpoint |
| 17 | Kindred Hide Choice |
| 18 | Kindred Hide Help |
| 19 | Kindred Hide Calendar |
| 20 | Kindred Hide Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Welcome Burrow, a small promise has your name on it. |
| 2 | At Mosslight Arcade, a small promise has your name on it. |
| 3 | At Tailor Steps, a small promise has your name on it. |
| 4 | At Sunroom Square, a small promise has your name on it. |
| 5 | At Quiet Den, a small promise has your name on it. |
| 6 | At Bridge Bloom, a small promise has your name on it. |
| 7 | At Candlepaw Studio, a small promise has your name on it. |
| 8 | At Dovetail Baths, a small promise has your name on it. |
| 9 | At Welcome Burrow, a small promise has your name on it. |
| 10 | At Mosslight Arcade, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is anthro identity and hangout world. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
