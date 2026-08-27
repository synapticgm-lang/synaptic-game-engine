# WOF Thorn Law: Full Start-Depth Pack

> **Release truth.** Thorn Law is designed for **solo** and **private co-op** sessions. It must not be marketed as an MMO before that capability is proven. The shared engine commits dice, HP and ledger changes, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before any language model narration.

## 0. Header

| Field | Specification |
| --- | --- |
| worldId | `thorn_law` |
| Display name | **Thorn Law** |
| One-line pitch | A human border country where every promise is entered into a weather-stained ledger and rare strangeness is treated as evidence, not spectacle. |
| Maturity | **teen** |
| rulesModuleId | `grit_wound` |
| Theme Kit | **Thorn Law Theme Kit**, included with world entitlement |
| Genre pattern and fence | Scarce-magic border-law drama. It is not a dynastic fantasy imitation, a grimdark throne contest, or a medieval history claim. |

Thorn Law is a WOF text world about a human border country where every promise is entered into a weather-stained ledger and rare strangeness is treated as evidence, not spectacle. Players begin with an immediate local problem, choose a visible stake, and work alone or in private co-op with up to five invited friends. The engine commits every ledger change before the narrator describes it, so a useful repair, a careful refusal, or a hard-won route has a traceable result. The world includes its Theme Kit with purchase, keeps gold separate from cosmetic tokens, and refuses gacha, paid power, lockout skips, or outcome sales. Its voice is specific to its places and people; it does not pretend to be a live public MMO.

### Genre-specific ban-list (50)

| # | Prohibited lookalike or imitation |
| --- | --- |
| 1 | Game of Thrones named place |
| 2 | The Witcher hero silhouette |
| 3 | Elden Ring logo geometry |
| 4 | Warhammer catchphrase |
| 5 | A Song of Ice and Fire signature costume |
| 6 | Conan proprietary creature |
| 7 | Kingdom Come Deliverance map layout |
| 8 | Dark Souls faction title |
| 9 | Berserk weapon profile |
| 10 | The Last Kingdom UI chrome |
| 11 | Game of Thrones quest premise |
| 12 | The Witcher title typography |
| 13 | Elden Ring color-coded insignia |
| 14 | Warhammer music motif |
| 15 | A Song of Ice and Fire vehicle or mount profile |
| 16 | Conan companion anatomy |
| 17 | Kingdom Come Deliverance named artifact |
| 18 | Dark Souls school or agency badge |
| 19 | Berserk real sacred practice as minigame |
| 20 | The Last Kingdom stereotyped cultural shorthand |
| 21 | Game of Thrones real-person likeness |
| 22 | The Witcher copied dialogue cadence |
| 23 | Elden Ring fan-server slogan |
| 24 | Warhammer paid power framing |
| 25 | A Song of Ice and Fire loot-box presentation |
| 26 | Conan named place |
| 27 | Kingdom Come Deliverance hero silhouette |
| 28 | Dark Souls logo geometry |
| 29 | Berserk catchphrase |
| 30 | The Last Kingdom signature costume |
| 31 | Game of Thrones proprietary creature |
| 32 | The Witcher map layout |
| 33 | Elden Ring faction title |
| 34 | Warhammer weapon profile |
| 35 | A Song of Ice and Fire UI chrome |
| 36 | Conan quest premise |
| 37 | Kingdom Come Deliverance title typography |
| 38 | Dark Souls color-coded insignia |
| 39 | Berserk music motif |
| 40 | The Last Kingdom vehicle or mount profile |
| 41 | Game of Thrones companion anatomy |
| 42 | The Witcher named artifact |
| 43 | Elden Ring school or agency badge |
| 44 | Warhammer real sacred practice as minigame |
| 45 | A Song of Ice and Fire stereotyped cultural shorthand |
| 46 | Conan real-person likeness |
| 47 | Kingdom Come Deliverance copied dialogue cadence |
| 48 | Dark Souls fan-server slogan |
| 49 | Berserk paid power framing |
| 50 | The Last Kingdom loot-box presentation |


## 1. Rules in this skin

| Rule | World application |
| --- | --- |
| Active ledger fields | hp, guard, wound, scar, supplies, favor, oath, caseHeat |
| Wipe and checkpoint | Wipe returns the party to `thorn_law_dungeon_room_04` after it is activated. Personal loot and completed quests remain; encounter-only state resets. No permadeath. |
| Lockout | Weekly, per-character, per-boss only; no store item bypasses it. |
| Prose forbidden to invent | Damage, gold, catch/trust changes, score, deed, reputation, part-break, café rating, or ownership values; all must be committed in YAML-backed ledger state first. |
| Party and presence | Friends-first 2–5; no mid-combat fill. Presence supplies only nearbyPlayerCount and kit/race tags, never stranger names. |

### Diegetic chrome templates

| # | Copy-paste template |
| --- | --- |
| 1 | [Ledger] Thorn Law • {{turn}} • committed |
| 2 | [Route] Thorn Law • {{placeId}} • committed |
| 3 | [Work] Thorn Law • {{lastAction}} • committed |
| 4 | [Talk] Thorn Law • {{npcId}} • committed |
| 5 | [Kit] Thorn Law • {{kitId}} • committed |
| 6 | [Pack] Thorn Law • {{partySize}} • committed |
| 7 | [Rest] Thorn Law • {{checkpoint}} • committed |
| 8 | [Safety] Thorn Law • {{ageGate}} • committed |


## 2. Identity kits

| id | Public name | Look | Values | Taboo | Speech tell | Starter clothes / tool / map | Start and first-hour quest | abilityFlag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| thorn_law_kit_01 | Assize Clerk | charcoal tabard and wax tablets | copy contested testimony | Never alter a deposition after dusk. | Use plain words, measured pauses, and questions that name the cost. | assize_clerk mantle; assize_clerk tool; thorn_law_map_01 | thorn_law_place_01; thorn_law_q_01 | thorn_law_ability_01 |
| thorn_law_kit_02 | Hedge Leech | sage-green coat with bandage roll | close wounds without miracle cures | Never sell pain relief to a desperate debtor. | Use plain words, measured pauses, and questions that name the cost. | hedge_leech vest; hedge_leech tool; thorn_law_map_02 | thorn_law_place_02; thorn_law_q_02 | thorn_law_ability_02 |
| thorn_law_kit_03 | Toll-Walker | mud-brown toll cape | walk disputed boundary ropes | Never move a boundary peg unseen. | Use plain words, measured pauses, and questions that name the cost. | toll_walker jacket; toll_walker tool; thorn_law_map_03 | thorn_law_place_01; thorn_law_q_03 | thorn_law_ability_03 |
| thorn_law_kit_04 | Oath Witness | undyed witness sash | bind spoken terms into a public record | Never swear for a person who is present. | Use plain words, measured pauses, and questions that name the cost. | oath_witness sash; oath_witness tool; thorn_law_map_04 | thorn_law_place_02; thorn_law_q_04 | thorn_law_ability_04 |


## 3. Map and places — full graph

**Fog policy.** Visited places reveal full text; unvisited places show outline only. Street maps use pins; interior graphs use room-scale floor plans. No huge-distance chrome is shown inside a shop, room, berth, studio, or home. `thorn_law_place_01` is a shared hub rather than a capital analogue; `thorn_law_place_04` is the mid-join; `thorn_law_place_06` is the instance door. 

| id | Public name | Role | Scale | Danger | Outdoor | Exits | Hour-one local problem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| thorn_law_place_01 | Briar Assize | shared hub | street | safe | yes | thorn_law_place_02, thorn_law_place_04 | A public notice at Briar Assize has been posted with one crucial line washed away. |
| thorn_law_place_02 | Harrow Market | start hub | street | safe | yes | thorn_law_place_01, thorn_law_place_03 | A work roster at Harrow Market leaves two neighbours believing they were promised the same task. |
| thorn_law_place_03 | Mire Toll | street route | street | safe | yes | thorn_law_place_02, thorn_law_place_04 | A route marker at Mire Toll points visitors toward a closed gate and needs a safe correction. |
| thorn_law_place_04 | Old Gallows Road | mid join | street | low | yes | thorn_law_place_03, thorn_law_place_05, thorn_law_place_01 | A newcomer at Old Gallows Road needs a local introduction before a small obligation becomes embarrassing. |
| thorn_law_place_05 | Cinderfield | work district | interior | low | no | thorn_law_place_04, thorn_law_place_06 | A shared tool at Cinderfield has been returned without its care tag. |
| thorn_law_place_06 | The Thorn Bench | instance door | dungeon | medium | no | thorn_law_place_05, thorn_law_place_07 | The entry record at The Thorn Bench names an unfinished errand, not a monster or apocalypse. |
| thorn_law_place_07 | Writwater Ford | wild edge | street | medium | yes | thorn_law_place_06, thorn_law_place_08 | A weather change at Writwater Ford threatens a community plan unless someone reads the signs. |
| thorn_law_place_08 | Hearth-Measure | housing approach | interior | low | no | thorn_law_place_07 | A resident at Hearth-Measure has a quiet request that is easier to help with than to ignore. |


## 4. Durable NPCs and premade talk trees

| id | Name | placeId | Role | Greet | Quest offer | Refusal |
| --- | --- | --- | --- | --- | --- | --- |
| thorn_law_npc_01 | Jori Wren | thorn_law_place_01 | quest | Jori Wren says, ‘Thorn Law keeps its promises in small places. Tell me which one you noticed.’ | Jori Wren offers a specific task at Briar Assize: settle the practical mismatch before it costs someone a shift. | Jori Wren says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| thorn_law_npc_02 | Alden Morrow | thorn_law_place_02 | profession | Alden Morrow says, ‘Thorn Law keeps its promises in small places. Tell me which one you noticed.’ | Alden Morrow offers a specific task at Harrow Market: settle the practical mismatch before it costs someone a shift. | Alden Morrow says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| thorn_law_npc_03 | Bryn Rowan | thorn_law_place_03 | hub | Bryn Rowan says, ‘Thorn Law keeps its promises in small places. Tell me which one you noticed.’ | Bryn Rowan offers a specific task at Mire Toll: settle the practical mismatch before it costs someone a shift. | Bryn Rowan says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| thorn_law_npc_04 | Cato Nook | thorn_law_place_04 | merchant | Cato Nook says, ‘Thorn Law keeps its promises in small places. Tell me which one you noticed.’ | Cato Nook offers a specific task at Old Gallows Road: settle the practical mismatch before it costs someone a shift. | Cato Nook says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| thorn_law_npc_05 | Dessa Cress | thorn_law_place_01 | local | Dessa Cress says, ‘Thorn Law keeps its promises in small places. Tell me which one you noticed.’ | Dessa Cress offers a specific task at Briar Assize: settle the practical mismatch before it costs someone a shift. | Dessa Cress says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| thorn_law_npc_06 | Eris Silt | thorn_law_place_02 | host | Eris Silt says, ‘Thorn Law keeps its promises in small places. Tell me which one you noticed.’ | Eris Silt offers a specific task at Harrow Market: settle the practical mismatch before it costs someone a shift. | Eris Silt says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| thorn_law_npc_07 | Fenn Pryce | thorn_law_place_03 | quest | Fenn Pryce says, ‘Thorn Law keeps its promises in small places. Tell me which one you noticed.’ | Fenn Pryce offers a specific task at Mire Toll: settle the practical mismatch before it costs someone a shift. | Fenn Pryce says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| thorn_law_npc_08 | Gala Vane | thorn_law_place_04 | profession | Gala Vane says, ‘Thorn Law keeps its promises in small places. Tell me which one you noticed.’ | Gala Vane offers a specific task at Old Gallows Road: settle the practical mismatch before it costs someone a shift. | Gala Vane says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| thorn_law_npc_09 | Holl Quill | thorn_law_place_01 | local | Holl Quill says, ‘Thorn Law keeps its promises in small places. Tell me which one you noticed.’ | Holl Quill offers a specific task at Briar Assize: settle the practical mismatch before it costs someone a shift. | Holl Quill says, ‘No. I can explain the rule, but I will not bend it for noise.’ |
| thorn_law_npc_10 | Ivo Vale | thorn_law_place_02 | merchant | Ivo Vale says, ‘Thorn Law keeps its promises in small places. Tell me which one you noticed.’ | Ivo Vale offers a specific task at Harrow Market: settle the practical mismatch before it costs someone a shift. | Ivo Vale says, ‘No. I can explain the rule, but I will not bend it for noise.’ |


### Canned hub say and emote lines

| # | Canned line |
| --- | --- |
| 1 | I can point you toward Old Gallows Road, if that is useful. |
| 2 | Thorn Law feels different when the small work is done. |
| 3 | I am here for a quiet task, not a loud argument. |
| 4 | That marker belongs at The Thorn Bench. |
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
| Assize Clerk | At Briar Assize, you arrive in assize_clerk mantle carrying thorn_law_map_01. A small obligation is already late. | Give up one turn to help now. | Thorn Law: Name a Working Promise |
| Hedge Leech | At Harrow Market, you arrive in hedge_leech vest carrying thorn_law_map_02. A small obligation is already late. | Spend one starter supply to solve it cleanly. | Thorn Law: Set the First Tool Aside |
| Toll-Walker | At Briar Assize, you arrive in toll_walker jacket carrying thorn_law_map_03. A small obligation is already late. | Risk a polite refusal and ask for context. | Thorn Law: Carry the Right Record |
| Oath Witness | At Harrow Market, you arrive in oath_witness sash carrying thorn_law_map_04. A small obligation is already late. | Take a marked detour that changes the first reward. | Thorn Law: Find the Missing Measure |


Each hub has ten inventory-aware choice buttons in `WOF_thorn_law_data.yaml`; the full set contains 80 buttons. Their intents are talk, inspect, interact, travel, rest, and craft/activity as appropriate to this skin—never an incoherent combat action.

**Skippable tutorial on alts.** 1) choose a kit; 2) read the local notice; 3) accept or decline a stake; 4) commit one safe action; 5) meet the first durable NPC; 6) collect one useful item; 7) choose a route to mid-join; 8) bind the first checkpoint.

### Retry deck

| # | Goal | Tactic | Obstacle | Revelation | Consequence |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolve Briar Assize’s small mismatch | ask | missing tag | A local need at Old Gallows Road is connected but not catastrophic. | alternate talk |
| 2 | Resolve Harrow Market’s small mismatch | repair | closed path | A local need at Cinderfield is connected but not catastrophic. | new route |
| 3 | Resolve Mire Toll’s small mismatch | carry | unclear note | A local need at The Thorn Bench is connected but not catastrophic. | recorded favor |
| 4 | Resolve Old Gallows Road’s small mismatch | listen | late guest | A local need at Writwater Ford is connected but not catastrophic. | cosmetic keepsake |
| 5 | Resolve Cinderfield’s small mismatch | map | wet weather | A local need at Hearth-Measure is connected but not catastrophic. | slower reward |
| 6 | Resolve The Thorn Bench’s small mismatch | prepare | busy shift | A local need at Briar Assize is connected but not catastrophic. | safer shortcut |
| 7 | Resolve Writwater Ford’s small mismatch | wait | quiet boundary | A local need at Harrow Market is connected but not catastrophic. | solo option |
| 8 | Resolve Hearth-Measure’s small mismatch | return | wrong room | A local need at Mire Toll is connected but not catastrophic. | extra context |


## 6. Quests — code-completeable DAGs

**Campaign spine.** The 25 beats move from identity and profession tasks to a local zone threat, then to `The Uncounted Hearing` and `Cinderfield Reckoning`. The side branches do not recycle title structure, and every objective uses an engine enum with an ID and count in the YAML sidecar.

| id | Title | Family | Hidden | Objective kinds | Gold | XP |
| --- | --- | --- | --- | --- | --- | --- |
| thorn_law_q_01 | Thorn Law: Name a Working Promise | identity | no | visit_place; deliver_item | 12 | 20 |
| thorn_law_q_02 | Thorn Law: Set the First Tool Aside | identity | no | ledger_kill; talk_to_npc | 15 | 25 |
| thorn_law_q_03 | Thorn Law: Carry the Right Record | identity | no | ledger_bond; collect_item | 18 | 30 |
| thorn_law_q_04 | Thorn Law: Find the Missing Measure | identity | no | deliver_item; interact | 21 | 35 |
| thorn_law_q_05 | Thorn Law: Teach a Safer Shortcut | identity | no | talk_to_npc; score_beat | 24 | 40 |
| thorn_law_q_06 | Thorn Law: Read the Local Weather | profession | no | collect_item; build_tick | 27 | 45 |
| thorn_law_q_07 | Thorn Law: Repair a Shared Threshold | profession | no | interact; hospitality_tick | 30 | 50 |
| thorn_law_q_08 | Thorn Law: Return a Borrowed Sign | profession | no | score_beat; lap_finish | 33 | 55 |
| thorn_law_q_09 | Thorn Law: Host the Small Welcome | profession | no | build_tick; visit_place | 36 | 60 |
| thorn_law_q_10 | Thorn Law: Choose a Fair Order | profession | no | hospitality_tick; ledger_kill | 39 | 65 |
| thorn_law_q_11 | Thorn Law: Map the Quiet Detour | profession | no | lap_finish; ledger_bond | 42 | 70 |
| thorn_law_q_12 | Thorn Law: Bring a Useful Witness | profession | no | visit_place; deliver_item | 45 | 75 |
| thorn_law_q_13 | Thorn Law: Sort the Unclaimed Materials | zone_story | no | ledger_kill; talk_to_npc | 48 | 80 |
| thorn_law_q_14 | Thorn Law: Make Room for a Visitor | zone_story | no | ledger_bond; collect_item | 51 | 85 |
| thorn_law_q_15 | Thorn Law: Close the Day’s Ledger | zone_story | no | deliver_item; interact | 54 | 90 |
| thorn_law_q_16 | Thorn Law: Follow the Midway Signal | zone_story | no | talk_to_npc; score_beat | 57 | 95 |
| thorn_law_q_17 | Thorn Law: Uncover the Door Note | zone_story | yes | collect_item; build_tick | 60 | 100 |
| thorn_law_q_18 | Thorn Law: Prepare the Team Table | zone_story | no | interact; hospitality_tick | 63 | 105 |
| thorn_law_q_19 | Thorn Law: Test the Local Method | zone_story | no | score_beat; lap_finish | 66 | 110 |
| thorn_law_q_20 | Thorn Law: Hold a Careful Boundary | zone_story | no | build_tick; visit_place | 69 | 115 |
| thorn_law_q_21 | Thorn Law: Answer the Neighbour’s Call | extra | no | hospitality_tick; ledger_kill | 72 | 120 |
| thorn_law_q_22 | Thorn Law: Finish the Side Route | extra | no | lap_finish; ledger_bond | 75 | 125 |
| thorn_law_q_23 | Thorn Law: Earn a Trusted Introduction | extra | yes | visit_place; deliver_item | 78 | 130 |
| thorn_law_q_24 | Thorn Law: Open the Instance Path | extra | no | ledger_kill; talk_to_npc | 81 | 135 |
| thorn_law_q_25 | Thorn Law: Complete the First Big Night | extra | no | ledger_bond; collect_item | 84 | 140 |


### Three walk-aways that write divergence records

1. Decline the first obligation at `Briar Assize`: write `thorn_law_divergence_01`; a respectful solo route opens.
2. Leave the mid-join discussion at `Old Gallows Road`: write `thorn_law_divergence_02`; the next NPC has context but no punishment.
3. Step away from the instance breadcrumb: write `thorn_law_divergence_03`; the instance remains available after a local trust task.

## 7. Species, opponents, and collectibles

| id | Name | Kind | HP / armor / threat | Code ownership |
| --- | --- | --- | --- | --- |
| thorn_law_species_01 | Mire Hound | opponent | 8 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_02 | Ink Rook | opponent | 9 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_03 | Barrow Ox | opponent | 10 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_04 | Ridge Ferret | opponent | 11 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_05 | Thorn Eel | opponent | 12 / 0 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_06 | Peat Owl | opponent | 13 / 1 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_07 | Cinder Goat | opponent | 14 / 2 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_08 | Marsh Crane | opponent | 15 / 3 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_09 | Briar Mite | opponent | 16 / 0 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_10 | Slate Toad | opponent | 17 / 1 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_11 | Fen Deer | opponent | 18 / 2 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_12 | Writ Moth | opponent | 19 / 3 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_13 | Coal Badger | opponent | 20 / 0 / 1 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_14 | Reed Carp | opponent | 21 / 1 / 2 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_15 | Hedge Crow | opponent | 22 / 2 / 3 | CODE owns HP, armor, state and personal loot resolution. |
| thorn_law_species_16 | Salt-Free Snail | opponent | 23 / 3 / 1 | CODE owns HP, armor, state and personal loot resolution. |


These records support different loops: some are opponents, some are activity partners, and some are habitat or customer equivalents. They do not collapse into a single observe-and-log loop.

## 8. Loot and economy

| Economy component | Implementation |
| --- | --- |
| Gold wallet | **Assize Pence**; earned from numeric quest rewards, capped repeats, vendors, and personal drops. |
| Cosmetic-token wallet | **Thorn Seals**; cosmetic presentation only; no conversion from or into power. |
| Starter and profession templates | Briar Assize token, Harrow Market tool, Mire Toll thread, Old Gallows Road seal, Cinderfield bundle, The Thorn Bench token. |
| Instance and cosmetic templates | Writwater Ford tool, Hearth-Measure thread, Briar Assize seal, Harrow Market bundle, Mire Toll token, Old Gallows Road tool. |
| Drop policy | Twelve named personal-loot tables in YAML, each with percentage, min, max, source ID, and no group roll. |
| Vendor | `thorn_law_vendor_01` at `thorn_law_place_01`; listed prices are numeric. Repair cost per point: 2. |
| Faucets and sinks | Faucet: quest, sale, capped contract, personal loot. Sink: vendors, repair where applicable, cosmetic display, and craft inputs. Repeat gold cap: 90 per day. |

## 9. Instances

### Five-room private-co-op instance

| Room id | Name | Room-first description rule | Encounter | Checkpoint / boss |
| --- | --- | --- | --- | --- |
| thorn_law_dungeon_room_01 | The Uncounted Hearing: Threshold Room | Describe the material, sound, exits, and practical obstacle of Threshold Room before any species is narrated. | trash: thorn_law_species_01, thorn_law_species_02; elite: none |   |
| thorn_law_dungeon_room_02 | The Uncounted Hearing: Workroom | Describe the material, sound, exits, and practical obstacle of Workroom before any species is narrated. | trash: thorn_law_species_03, thorn_law_species_04; elite: none |   |
| thorn_law_dungeon_room_03 | The Uncounted Hearing: Side Passage | Describe the material, sound, exits, and practical obstacle of Side Passage before any species is narrated. | trash: thorn_law_species_05, thorn_law_species_06; elite: thorn_law_species_09 |   |
| thorn_law_dungeon_room_04 | The Uncounted Hearing: Checkpoint Alcove | Describe the material, sound, exits, and practical obstacle of Checkpoint Alcove before any species is narrated. | trash: thorn_law_species_07, thorn_law_species_08; elite: none | checkpoint  |
| thorn_law_dungeon_room_05 | The Uncounted Hearing: Finale Chamber | Describe the material, sound, exits, and practical obstacle of Finale Chamber before any species is narrated. | trash: thorn_law_species_09, thorn_law_species_10; elite: none |  boss: thorn_law_species_14 |


**Six interactable traps, secrets, and locks.** misread sign (`thorn_law_trap_01`), jammed latch (`thorn_law_trap_02`), wet threshold (`thorn_law_trap_03`), false shelf (`thorn_law_trap_04`), quiet bell (`thorn_law_trap_05`), sealed drawer (`thorn_law_trap_06`). Each is an interactable, not unstructured narration.

### Big night

**Cinderfield Reckoning** is a 2–5 player big night with three phases: (1) preparation and clear cues, (2) shared activity or finale, and (3) a cosmetic-only closing record. It is not a raid unless a later combat-skin capacity approval explicitly changes it.

## 10. Progression

| id | Node | Cost | Requires | Effect flags |
| --- | --- | --- | --- | --- |
| thorn_law_talent_01 | Thorn Law Local Ear | 1 | none | thorn_law_effect_01 |
| thorn_law_talent_02 | Thorn Law Careful Hand | 2 | none | thorn_law_effect_02 |
| thorn_law_talent_03 | Thorn Law Route Sense | 3 | none | thorn_law_effect_03 |
| thorn_law_talent_04 | Thorn Law Shared Measure | 4 | none | thorn_law_effect_04 |
| thorn_law_talent_05 | Thorn Law Quiet Craft | 1 | thorn_law_talent_04 | thorn_law_effect_05 |
| thorn_law_talent_06 | Thorn Law Open Invitation | 2 | none | thorn_law_effect_06 |
| thorn_law_talent_07 | Thorn Law Safe Return | 3 | none | thorn_law_effect_07 |
| thorn_law_talent_08 | Thorn Law Field Note | 4 | none | thorn_law_effect_08 |
| thorn_law_talent_09 | Thorn Law Steady Pace | 1 | thorn_law_talent_08 | thorn_law_effect_09 |
| thorn_law_talent_10 | Thorn Law Clear Signal | 2 | none | thorn_law_effect_10 |
| thorn_law_talent_11 | Thorn Law Warm Welcome | 3 | none | thorn_law_effect_11 |
| thorn_law_talent_12 | Thorn Law Small Courage | 4 | none | thorn_law_effect_12 |
| thorn_law_talent_13 | Thorn Law Repair Habit | 1 | thorn_law_talent_12 | thorn_law_effect_13 |
| thorn_law_talent_14 | Thorn Law Trust Mark | 2 | none | thorn_law_effect_14 |
| thorn_law_talent_15 | Thorn Law Second Look | 3 | none | thorn_law_effect_15 |
| thorn_law_talent_16 | Thorn Law Closing Grace | 4 | none | thorn_law_effect_16 |


| id | Contract | Cadence | Cap | Reward |
| --- | --- | --- | --- | --- |
| thorn_law_contract_01 | Thorn Law Local Care | daily | 1 | 10 gold; cosmetic-only bonus mark |
| thorn_law_contract_02 | Thorn Law Route Check | daily | 1 | 15 gold; cosmetic-only bonus mark |
| thorn_law_contract_03 | Thorn Law Craft Session | daily | 1 | 20 gold; cosmetic-only bonus mark |
| thorn_law_contract_04 | Thorn Law Helpful Visit | daily | 1 | 25 gold; cosmetic-only bonus mark |
| thorn_law_contract_05 | Thorn Law Instance Practice | daily | 1 | 30 gold; cosmetic-only bonus mark |
| thorn_law_contract_06 | Thorn Law Festival Preparation | weekly | 2 | 35 gold; cosmetic-only bonus mark |
| thorn_law_contract_07 | Thorn Law Record Review | weekly | 2 | 40 gold; cosmetic-only bonus mark |
| thorn_law_contract_08 | Thorn Law Return Shift | weekly | 2 | 45 gold; cosmetic-only bonus mark |


## 11. Housing and objects

| id | Display name | Shared verb id | Place |
| --- | --- | --- | --- |
| thorn_law_interact_01 | Briar Assize bench | rest | thorn_law_place_01 |
| thorn_law_interact_02 | Harrow Market cabinet | repair | thorn_law_place_02 |
| thorn_law_interact_03 | Mire Toll rack | tend | thorn_law_place_03 |
| thorn_law_interact_04 | Old Gallows Road kettle | craft | thorn_law_place_04 |
| thorn_law_interact_05 | Cinderfield ledger | cook | thorn_law_place_05 |
| thorn_law_interact_06 | The Thorn Bench rail | bind_inn | thorn_law_place_06 |
| thorn_law_interact_07 | Writwater Ford bell | inspect | thorn_law_place_07 |
| thorn_law_interact_08 | Hearth-Measure board | open | thorn_law_place_08 |
| thorn_law_interact_09 | Briar Assize table | carry | thorn_law_place_01 |
| thorn_law_interact_10 | Harrow Market lamp | clean | thorn_law_place_02 |
| thorn_law_interact_11 | Mire Toll gate | signal | thorn_law_place_03 |
| thorn_law_interact_12 | Old Gallows Road shelf | record | thorn_law_place_04 |


**Default interior graph.** `thorn_law_interior_01` enters from `thorn_law_place_08` and contains 7 connected rooms: Thorn Law Entry, Thorn Law Main Room, Thorn Law Work Nook, Thorn Law Window Room, Thorn Law Quiet Room, Thorn Law Storage, Thorn Law Back Step. This is text place/prop data, not a 3D asset request.

## 12. Theme Kit

| Component | Direction |
| --- | --- |
| Materials / colors | briar, harrow, mire, old materials with restrained local color, legible paper, cloth, metal, stone, water, or wood texture. |
| Dice material | A small tactile `Thorn Law` pressed-resin die with an engraved route mark; flat UI representation only. |
| Voice | Use plain words, measured pauses, and questions that name the cost. |
| Default fashion | The starter clothes of the selected kit, with no copied costume silhouette. |

**Ambient loop brief (120 words).** Build a one-minute loop from the everyday acoustics of Thorn Law: distant work, a room tone, a gentle rhythm that belongs to Briar Assize, and a second layer that makes the route toward The Thorn Bench feel possible without becoming ominous. Use original instruments or foley only, with a soft entry and an unforced end suitable for text reading. Keep the melody spare so TTS remains intelligible. The mix must not quote, imitate, or allude to a recognizable game, television, film, or popular song motif. Offer a lower-sensory variant with reduced transient sounds. No audio file is generated in this pack; this is an acceptance-ready brief for later production.

| # | Skinned UI label |
| --- | --- |
| 1 | Thorn Law Ledger |
| 2 | Thorn Law Route |
| 3 | Thorn Law Work |
| 4 | Thorn Law Talk |
| 5 | Thorn Law Kit |
| 6 | Thorn Law Pack |
| 7 | Thorn Law Rest |
| 8 | Thorn Law Safety |
| 9 | Thorn Law Map |
| 10 | Thorn Law Notice |
| 11 | Thorn Law Favour |
| 12 | Thorn Law Gold |
| 13 | Thorn Law Token |
| 14 | Thorn Law Record |
| 15 | Thorn Law Instance |
| 16 | Thorn Law Checkpoint |
| 17 | Thorn Law Choice |
| 18 | Thorn Law Help |
| 19 | Thorn Law Calendar |
| 20 | Thorn Law Exit |


| # | New Game hook |
| --- | --- |
| 1 | At Briar Assize, a small promise has your name on it. |
| 2 | At Harrow Market, a small promise has your name on it. |
| 3 | At Mire Toll, a small promise has your name on it. |
| 4 | At Old Gallows Road, a small promise has your name on it. |
| 5 | At Cinderfield, a small promise has your name on it. |
| 6 | At The Thorn Bench, a small promise has your name on it. |
| 7 | At Writwater Ford, a small promise has your name on it. |
| 8 | At Hearth-Measure, a small promise has your name on it. |
| 9 | At Briar Assize, a small promise has your name on it. |
| 10 | At Harrow Market, a small promise has your name on it. |


## 13. Failures and defaults

**Clone-risk and avoidance.** The closest risk is scarce-magic border-law drama. The pack avoids it through original hub names, original kit jobs, proprietary-free creature records, a separate local problem structure, and a ban-list that prevents borrowed marks, silhouettes, maps, slogans, creatures, and UI tropes.

**Defaults.** SPEC: the initial sidecar assumes one private session owns one deterministic instance seed and that big-night cosmetic grants are account-entitlement checked. These are product specifications, not a claim of operating capacity. No John’s call is required: unresolved choices use the safe default of a reversible, non-punitive alternate route.
