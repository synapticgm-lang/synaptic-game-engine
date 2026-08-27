# Circuit Arc — World Pack

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `circuit_arc` |
| Display name | Circuit Arc |
| Pitch | A bright, bruising tournament world where young fighters win passage, protection, and public voice through tactical arena circuits. |
| Maturity | Teen |
| `rulesModuleId` | `realm_gate_score_set` |
| Theme Kit | `circuit_arc_neon_ink` |
| Genre fence | Original shonen-tournament pattern: this is **not** a licensed anime, superhero academy, martial-arts franchise, or science-fiction setting. |

**Ban-list.** This pack rejects the following genre-adjacent names, terms, and lookalike anchors: Dragon Ball, Z, Saiyan, Super Saiyan, Kamehameha, Capsule Corp, Naruto, Konoha, Hokage, Sharingan, Akatsuki, One Piece, Grand Line, Devil Fruit, Straw Hat, Bleach, Soul Reaper, Bankai, My Hero Academia, U.A., Quirk, All Might, Hero License, Jujutsu Kaisen, cursed energy, domain expansion, Demon Slayer, breathing styles, Hashira, Hunter x Hunter, Nen, Pokémon, Poké Ball, gym badge, Digimon, Beyblade, Yu Yu Hakusho, Street Fighter, Hadouken, Mortal Kombat, Tekken, Avatar: The Last Airbender, bending, Avatar State, Yu-Gi-Oh!, Millennium Puzzle, Sailor Moon, Gundam, mecha school, Power Rangers, Voltron, League of Legends, Arcane, World of Warcraft, Azeroth, Final Fantasy, Kingdom Hearts, Hogwarts, Jedi, Sith, and any direct imitation of their named characters, creatures, slogans, plots, or signature attacks.

All peoples, locations, techniques, slogans, and story beats below are original. “Arc” means a public contest route, not a reference to any franchise.

## 1) Rules module

The ledger owns `hp`, `guard`, `score`, `momentum`, `realm_rank`, `round_number`, `match_id`, `arena_id`, `injury_flag`, `reputation`, `ticket_count`, `inventory`, `gold`, `cosmetic_tokens`, and `divergence_records`. It resolves initiative, legal targets, damage, guard breaks, ring-outs, timed objectives, match victory, score-set totals, rewards, checkpoint state, and weekly opponent lockouts. Prose may describe style and emotion, but may not invent damage, loot, match scores, qualification, or a cleared arena.

A defeated team returns to the last checkpoint with `hp` restored to 40% and `momentum` set to zero; consumables remain spent. A private party of 1–5 may retry. Each champion encounter has a weekly per-character lockout; personal loot is rolled after the ledger commits victory. There is no contested open-world PvP. Nearby presence shows only `nearbyPlayerCount` and selected race/kits.

### Diegetic chrome templates

```text
[ARC BOARD] MATCH {match_id} / ROUND {round_number} / OBJECTIVE: {objective_text}
[GUARD READOUT] {actor_name}: {guard_current}/{guard_max} | BREAK RISK: {risk_band}
[SCORE SET] TEAM {team_score} — RIVAL {rival_score} | SET {set_number}/3
[REALM GATE] {gate_name} accepts rank {required_rank}; current rank {realm_rank}
[DECISION STAMP] {choice_id} recorded | consequence: {consequence_label}
[CHECKPOINT] {room_id} secured; retry begins here after defeat
```

## 2) Identity kits

| Kit ID | Look and values | Taboo / speech tell | Starter clothes and weapon | Start / first quest | Ability flag | Fence note |
|---|---|---|---|---|---|---|
| `ember_stride` | Compact runner with copper-brown skin, heat-thread braids, and explosive footwork; values courage and visible effort. | Never mock a defeated opponent; says “feet first.” | Split-sash jacket, ankle wraps, weighted baton. | `ringway_quay`; `q_ringway_name_your_stance` | `ability_burst_step` | Original athletic kit, not a renamed licensed martial artist. |
| `glass_vow` | Pale or deep umber skin with translucent mineral freckles; patient counter-fighter; values promises. | Never break a declared bout; speaks in measured paired clauses. | Blue-grey sleeveless coat, forearm buckler. | `mirror_market`; `q_mirror_market_declare_terms` | `ability_prism_guard` | Original defensive culture and technique language. |
| `drum_blood` | Broad-shouldered, ink-marked fighter whose pulse sets rhythm; values community and honest challenge. | Never hide a team injury; punctuates speech with “hear that?” | Red canvas vest, knuckle rings, hand drum charm. | `drumstep_yard`; `q_drumstep_find_the_beat` | `ability_pulse_counter` | Original rhythm-combat identity, not a franchise power. |
| `thread_sight` | Lean, silver-eyed tactician with ribbonlike focus cords; values observation and clever restraint. | Never claim another’s tactic; asks “what changed?” | High-collar travel tunic, three throwing rings. | `threaded_roof`; `q_threaded_roof_read_the_line` | `ability_angle_mark` | Original tactical kit with no borrowed school or bloodline. |

## 3) Map / places

The four starts converge through the neutral mid-world `crosswind_concourse`, then branch to the two capitals `crownstep_city` and `quietus_pavilion`. Travel is physical: every start connects to the Concourse, and the Concourse connects to both capitals through `east_gatewalk` and `west_gatewalk`; no teleport is granted.

| Place ID | Public name | Zone | Scale / danger | Outdoor | Exits | NPCs | Dungeon |
|---|---|---|---|---|---|---|---|
| `ringway_quay` | Ringway Quay | `quay_start` | street / safe | true | `quay_lane`,`crosswind_concourse` | `npc_joren`,`npc_vesa` | — |
| `quay_lane` | Chalkline Lane | `quay_start` | street / low | true | `ringway_quay`,`tidechalk_steps`,`crosswind_concourse` | `npc_joren`,`npc_mira` | — |
| `tidechalk_steps` | Tidechalk Steps | `quay_start` | street / low | true | `quay_lane`,`brass_shed` | `npc_vesa`,`npc_oma` | — |
| `brass_shed` | Brass Shed | `quay_start` | street / safe | false | `tidechalk_steps`,`quay_gate_instance` | `npc_mira` | `quay_gate_instance` |
| `quay_gate_instance` | Quay Gatehouse | `quay_start` | dungeon / medium | false | `brass_shed`,`crosswind_concourse` | `npc_joren` | `inst_quay_gatehouse` |
| `mirror_market` | Mirror Market | `market_start` | street / safe | true | `rival_row`,`crosswind_concourse` | `npc_selin`,`npc_kael` | — |
| `rival_row` | Rival Row | `market_start` | street / low | true | `mirror_market`,`echo_court` | `npc_selin`,`npc_tam` | — |
| `echo_court` | Echo Court | `market_start` | street / medium | true | `rival_row`,`market_vault` | `npc_kael`,`npc_ren` | — |
| `market_vault` | Market Vault | `market_start` | dungeon / medium | false | `echo_court`,`crosswind_concourse` | `npc_ren` | `inst_market_vault` |
| `drumstep_yard` | Drumstep Yard | `yard_start` | street / safe | true | `bell_track`,`crosswind_concourse` | `npc_baro`,`npc_ila` | — |
| `bell_track` | Bell Track | `yard_start` | street / low | true | `drumstep_yard`,`rain_courtyard` | `npc_baro`,`npc_sia` | — |
| `rain_courtyard` | Rain Courtyard | `yard_start` | street / low | true | `bell_track`,`yard_stage` | `npc_ila`,`npc_sia` | — |
| `yard_stage` | Yard Stage | `yard_start` | dungeon / medium | false | `rain_courtyard`,`crosswind_concourse` | `npc_baro` | `inst_yard_stage` |
| `threaded_roof` | Threaded Roofs | `roof_start` | street / safe | true | `stringwalk`,`crosswind_concourse` | `npc_nilo`,`npc_fer` | — |
| `stringwalk` | Stringwalk | `roof_start` | street / low | true | `threaded_roof`,`wind_trestle` | `npc_nilo`,`npc_uma` | — |
| `wind_trestle` | Wind Trestle | `roof_start` | street / medium | true | `stringwalk`,`roof_archive` | `npc_fer`,`npc_uma` | — |
| `roof_archive` | Roof Archive | `roof_start` | dungeon / medium | false | `wind_trestle`,`crosswind_concourse` | `npc_fer` | `inst_roof_archive` |
| `crosswind_concourse` | Crosswind Concourse | `mid_world` | street / safe | true | all starts, `east_gatewalk`,`west_gatewalk` | `npc_orro`,`npc_dema` | — |
| `crownstep_city` | Crownstep City | `capital_east` | street / safe | true | `east_gatewalk`,`champion_forum`,`ranked_arena` | `npc_orro`,`npc_cela` | `inst_crown_finale` |
| `quietus_pavilion` | Quietus Pavilion | `capital_west` | street / safe | true | `west_gatewalk`,`oath_hall`,`ranked_arena` | `npc_dema`,`npc_yun` | `inst_pavilion_finale` |
| `ranked_arena` | Ranked Arena | `capital_east` | dungeon / medium | false | `crownstep_city`,`quietus_pavilion` | `npc_cela` | `inst_ranked_arc` |

The map is fogged by `visited_place_ids`; unvisited places show outline and exits only. Street maps use pins and route lines, while indoor spaces use floor plans with no oversized distance chrome. Instance doors are explicit place pins.

## 4) Durable NPCs and canned talk

| NPC ID | Name | Place | Role | Greet | Quest offer | Progress | Turn-in | Gossip (three lines) | Refusal / rude |
|---|---|---|---|---|---|---|---|---|---|
| `npc_joren` | Joren Vale | `ringway_quay` | quest | “Shoes tied? Good.” | “The quay needs a clean bout and a clean promise.” | “You kept your feet under you.” | “The ledger marks your first honest win.” | “Quay chalk is made from shell.” / “Crowds notice exits.” / “I lost once and learned twice.” | “Insults do not earn a bracket.” |
| `npc_vesa` | Vesa Lorn | `tidechalk_steps` | merchant | “Mind the wet paint.” | “Carry this banner without tearing it.” | “The colors held.” | “Take the spare wrap; it has no trick in it.” | “Blue chalk means yield.” / “Old rings creak.” / “The tide favors patience.” | “Then shop elsewhere, loudly.” |
| `npc_mira` | Mira Quill | `brass_shed` | profession | “Brass remembers pressure.” | “Bring three `item_quay_spring`.” | “That spring still sings.” | “Your first repair kit is ready.” | “I price work, not fame.” / “A bent pin tells a story.” / “Never oil a hot hinge.” | “Rudeness makes expensive repairs.” |
| `npc_oma` | Oma Rusk | `tidechalk_steps` | local | “You are new to the line.” | “Mark five safe corners.” | “The marks are legible.” | “Good; now others can follow.” | “A ring is a promise in public.” / “The loudest fighter is not always brave.” / “Quay cats hate drums.” | “Come back when you can listen.” |
| `npc_selin` | Selin Arco | `mirror_market` | quest | “Look twice, then step.” | “Name your terms before the mirror bout.” | “Your terms were heard.” | “The market records a fair challenger.” | “Mirrors show posture.” / “Vendors trade stories.” / “Never bet your supper.” | “A sneer is not a strategy.” |
| `npc_kael` | Kael Brine | `echo_court` | merchant | “Quiet hands, sharp eyes.” | “Deliver `item_echo_seal` to the court.” | “The seal is unbroken.” | “Here is your stamped pass.” | “Vault doors dislike haste.” / “Countering is conversation.” / “I polish no trophy.” | “No service for bullies.” |
| `npc_baro` | Baro Thrum | `drumstep_yard` | quest | “Hear that? The yard is waking.” | “Restore three rhythm posts.” | “The beat is steady.” | “The yard can train again.” | “Rhythm is timing, not noise.” / “Teams breathe together.” / “Rain makes honest floors.” | “Leave if you came only to boast.” |
| `npc_ila` | Ila Fen | `rain_courtyard` | profession | “Canvas, cord, and care.” | “Collect four `item_rain_cord`.” | “The cord did not fray.” | “Your team sash is finished.” | “A sash should tell the truth.” / “Wet cloth weighs more.” / “I sew before I speak.” | “I will not mend a cruel emblem.” |
| `npc_nilo` | Nilo Venn | `threaded_roof` | quest | “What changed in the wind?” | “Read three moving lines.” | “You saw the shift.” | “Your angle mark is earned.” | “Roofs teach balance.” / “A shortcut still has a cost.” / “Watch hands, not faces.” | “No answer follows contempt.” |
| `npc_fer` | Fer Olt | `roof_archive` | merchant | “Archive dust is harmless; bad records are not.” | “Return `item_lost_bracket`.” | “The bracket is legible.” | “Your license page is copied.” | “Every champion leaves a correction.” / “Paper beats rumor.” / “I archive defeats too.” | “I close the book on insults.” |
| `npc_orro` | Orro Pell | `crosswind_concourse` | hub | “Four roads, one breath.” | “Choose a capital route.” | “Your route is clear.” | “The Concourse remembers your choice.” | “No gate skips a journey.” / “Rivals can be neighbors.” / “The next round starts with preparation.” | “The Concourse has room for manners.” |
| `npc_dema` | Dema Sorn | `crosswind_concourse` | hub | “State your name and stake.” | “Carry a promise to the other capital.” | “The promise arrived intact.” | “Then your divergence is recorded.” | “A walk-away is still a choice.” / “Crowds love certainty.” / “I prefer honest uncertainty.” | “Return when your voice is yours.” |

**Canned hub emotes for each starting zone.** Quay: “Chalk dries,” “Ropes creak,” “A bell marks round one,” “Spectators shade their eyes,” “A broom clears the lane,” “A child mimics a guard stance,” “The gatekeeper checks seals,” “Vendors fold banners,” “Someone laughs at a clean dodge,” “The tide turns.” Market: “Mirrors flash,” “Coins stay in purses,” “A clerk calls the bracket,” “Silk snaps overhead,” “A rival bows,” “A vendor hums,” “The vault bell rings,” “Footsteps echo,” “A referee raises two fingers,” “The crowd settles.” Yard: “Drums answer drums,” “Rain beads on canvas,” “Sashes dry,” “A post is retied,” “The floor is swept,” “A team stretches,” “A bell counts in,” “Shoes thud,” “Laughter crosses the yard,” “The clouds break.” Roof: “Lines hum,” “Kites dip,” “A runner crouches,” “Wind turns,” “Archive pages lift,” “A chalk arrow points east,” “A bell is muffled,” “Someone measures a gap,” “A ribbon knots,” “The roofs glitter.”

## 5) Premade choices / first hour

Each kit opens with five authored beats: `look`, `kit`, `origin`, `stake`, and `consequence`. The player chooses a public stake: win a travel pass, protect a local training space, repay a mentor, or expose a rigged bracket. The HookArc writes `identity_confirmed`, then `first_choice`, then `observed_consequence`; a choice never silently disappears.

| POI | Choice buttons |
|---|---|
| `ringway_quay` | `inspect_chalk` (visit; observe), `ask_joren` (talk; learn), `accept_open_bout` (quest `q_ringway_name_your_stance`; commit), `practice_guard` (none; train), `leave_to_concourse` (visited; travel), `decline_bout` (none; record walk-away) |
| `mirror_market` | `read_terms` (collect `item_market_terms`; inspect), `ask_selin` (talk), `declare_terms` (quest; commit), `help_vendor` (collect 2 `item_split_mirror`; assist), `enter_vault` (quest `q_market_vault_breadcrumb`; explore), `walk_away` (none; record) |
| `drumstep_yard` | `listen_post` (visit; observe), `repair_post` (collect `item_yard_pin`; craft), `ask_baro` (talk), `join_rhythm` (quest; commit), `challenge_captain` (quest; duel), `leave_quietly` (none; record) |
| `threaded_roof` | `watch_ribbon` (visit; observe), `mark_angle` (collect `item_angle_chalk`; tactic), `ask_nilo` (talk), `take_roof_trial` (quest; commit), `return_bracket` (deliver `item_lost_bracket`; trust), `descend` (visited; travel) |

Tutorial forced path: choose kit; name a stake; visit the local hub; learn one defense move; complete one code-owned objective; witness a rival consequence; receive a checkpoint; choose `east_gatewalk` or `west_gatewalk` after the start story. Alts may skip the tutorial after `identity_confirmed`.

**Retry fingerprint deck:** (1) goal: protect a chalk line; tactic: guard; obstacle: feint; revelation: rival is afraid; consequence: gain respect. (2) goal: retrieve a sash; tactic: flank; obstacle: falling rig; revelation: rig was cut; consequence: record suspicion. (3) goal: win a timed set; tactic: conserve momentum; obstacle: crowd noise; revelation: silence restores timing; consequence: bonus score. (4) goal: escort a novice; tactic: intercept; obstacle: false call; revelation: witness saw it; consequence: referee review. (5) goal: open a vault; tactic: sequence seals; obstacle: mirrored order; revelation: terms are the key; consequence: shortcut unlocked. (6) goal: repair a post; tactic: team rhythm; obstacle: mismatched beat; revelation: pause is part of rhythm; consequence: yard trust. (7) goal: read an angle; tactic: bait; obstacle: moving floor; revelation: wind repeats; consequence: angle mark ability. (8) goal: decide a route; tactic: ask both hosts; obstacle: rival promise; revelation: both routes cost time; consequence: divergence record.

## 6) Quests (code-completeable DAGs)

The primary start `ringway_quay` contains 18 authored beats; other starts contain 6 authored local beats each before the shared campaign. Every objective uses only ledger-supported verbs.

| ID | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `q_ringway_name_your_stance` | Name Your Stance | identity | false | `q_ringway_chalk_oath` | `talk_to_npc:npc_joren:1`; `visit_place:ringway_quay:1` | 12 | 40 |
| `q_ringway_chalk_oath` | Chalk Oath | identity | false | `q_ringway_first_round` | `collect_item:item_quay_chalk:3`; `talk_to_npc:npc_oma:1` | 14 | 45 |
| `q_ringway_first_round` | First Round, Clean Floor | identity | false | `q_ringway_read_the_rival` | `ledger_kill:quay_sparrer:1` | 20 | 70 |
| `q_ringway_read_the_rival` | Read the Rival | identity | false | `q_ringway_public_stake` | `talk_to_npc:npc_joren:2`; `visit_place:quay_lane:1` | 18 | 60 |
| `q_ringway_public_stake` | Public Stake | identity | false | `q_ringway_consequence` | `deliver_item:item_stake_card:1`; `talk_to_npc:npc_vesa:1` | 22 | 75 |
| `q_ringway_consequence` | Consequence in View | zone_story | false | `q_ringway_gate_breadcrumb` | `ledger_kill:chalk_thief:2`; `visit_place:tidechalk_steps:1` | 28 | 90 |
| `q_ringway_gate_breadcrumb` | Gatehouse Thread | dungeon | false | `q_quay_gatehouse_open` | `collect_item:item_gate_token:1`; `talk_to_npc:npc_mira:1` | 25 | 85 |
| `q_quay_gatehouse_open` | Open the Quay Gate | dungeon | false | `q_ringway_checkpoint` | `visit_place:brass_shed:1`; `deliver_item:item_gate_token:1` | 30 | 100 |
| `q_ringway_checkpoint` | Hold the Line | zone_story | false | `q_ringway_team_call` | `ledger_kill:line_breaker:1`; `talk_to_npc:npc_joren:3` | 35 | 120 |
| `q_ringway_team_call` | Call the Team | identity | false | `q_ringway_springwork` | `talk_to_npc:npc_vesa:2`; `collect_item:item_team_ribbon:1` | 24 | 80 |
| `q_ringway_springwork` | Springwork | profession | false | `q_ringway_repair_bout` | `collect_item:item_quay_spring:3`; `deliver_item:item_quay_spring:3` | 32 | 110 |
| `q_ringway_repair_bout` | Repair Bout | profession | false | `q_ringway_daily_chalk` | `visit_place:quay_gate_instance:1`; `ledger_kill:brass_warden:1` | 45 | 160 |
| `q_ringway_daily_chalk` | Daily Chalk Sweep | daily | false | — | `collect_item:item_quay_chalk:5` | 10 | 25 |
| `q_ringway_hidden_trust` | The Empty Corner | trust | true | `q_ringway_trust_mark` | `visit_place:tidechalk_steps:2`; `talk_to_npc:npc_oma:2`; `collect_item:item_empty_corner_seal:1` | 50 | 180 |
| `q_ringway_trust_mark` | Mark Without Boasting | trust | true | `q_crosswind_invitation` | `deliver_item:item_empty_corner_seal:1`; `talk_to_npc:npc_joren:4` | 60 | 220 |
| `q_crosswind_invitation` | Invitation to Crosswind | campaign | false | `q_campaign_four_stakes` | `visit_place:crosswind_concourse:1`; `talk_to_npc:npc_orro:1` | 35 | 130 |
| `q_campaign_four_stakes` | Four Stakes, One Gate | campaign | false | `q_campaign_first_set` | `talk_to_npc:npc_joren:5`; `talk_to_npc:npc_selin:1`; `talk_to_npc:npc_baro:1`; `talk_to_npc:npc_nilo:1` | 50 | 180 |
| `q_campaign_first_set` | Set the First Set | campaign | false | `q_campaign_capital_choice` | `visit_place:ranked_arena:1`; `ledger_kill:gate_opponent:1` | 80 | 300 |

Market local beats are `q_mirror_market_declare_terms` (talk `npc_selin`, visit `mirror_market`, 18 gold, 60 XP), `q_market_mirror_repair` (collect 3 `item_split_mirror`, deliver them to `npc_kael`, 24 gold, 80 XP), `q_market_vault_breadcrumb` (collect `item_echo_seal`, visit `market_vault`, 35 gold, 120 XP), `q_market_fair_call` (talk `npc_ren`, `ledger_kill:echo_bully:1`, 28 gold, 95 XP), `q_market_hidden_clause` (hidden; talk `npc_selin` twice, deliver `item_market_terms`, 45 gold, 160 XP), and `q_market_daily_polish` (collect 5 `item_mirror_dust`, 10 gold, 25 XP).

Yard local beats are `q_drumstep_find_the_beat` (visit `drumstep_yard`, talk `npc_baro`, 18 gold, 60 XP), `q_yard_post_repair` (collect 3 `item_yard_pin`, 22 gold, 75 XP), `q_yard_rain_trial` (visit `rain_courtyard`, `ledger_kill:rain_scrapper:1`, 30 gold, 100 XP), `q_yard_sash_line` (talk `npc_ila`, collect 4 `item_rain_cord`, 28 gold, 90 XP), `q_yard_hidden_duet` (hidden; talk `npc_baro` twice and visit `yard_stage`, 48 gold, 170 XP), and `q_yard_daily_count` (collect 5 `item_bell_token`, 10 gold, 25 XP).

Roof local beats are `q_threaded_roof_read_the_line` (visit `threaded_roof`, talk `npc_nilo`, 18 gold, 60 XP), `q_roof_angle_chalk` (collect 3 `item_angle_chalk`, 22 gold, 75 XP), `q_roof_trestle_trial` (visit `wind_trestle`, `ledger_kill:trestle_duelist:1`, 30 gold, 100 XP), `q_roof_archive_return` (deliver `item_lost_bracket`, talk `npc_fer`, 28 gold, 90 XP), `q_roof_hidden_wind` (hidden; visit `stringwalk` twice, collect `item_wind_knot`, 48 gold, 170 XP), and `q_roof_daily_measure` (collect 5 `item_ribbon_shard`, 10 gold, 25 XP).

### Campaign spine after the starts

`q_campaign_four_stakes` unlocks `q_campaign_first_set`; then `q_campaign_capital_choice` (visit either capital and talk to its steward, 60 gold, 220 XP), `q_campaign_second_set` (win `ledger_kill:ranked_opponent:2`, 90 gold, 330 XP), `q_campaign_rival_promise` (talk `npc_cela` and `npc_yun`, 70 gold, 250 XP), `q_campaign_gate_of_names` (collect 3 `item_name_seal`, 110 gold, 400 XP), `q_campaign_team_trial` (complete `inst_ranked_arc`, 150 gold, 520 XP), `q_campaign_public_correction` (deliver `item_false_bracket`, 120 gold, 430 XP), `q_campaign_third_set` (score set total 3, 180 gold, 600 XP), `q_campaign_arc_pass` (visit `champion_forum`, 200 gold, 700 XP), `q_campaign_finalist_oath` (talk `npc_orro` and record `first_choice`, 150 gold, 500 XP), `q_campaign_crown_or_pavilion` (visit selected capital, 220 gold, 750 XP), and `q_campaign_arc_complete` (clear `inst_circuit_arc_finale`, 400 gold, 1,200 XP). A visible journal records each objective.

Walk-away examples write divergence records: refusing the first public bout records `declined_first_bout`; exposing a false bracket records `challenged_bracket_authority`; choosing Quietus Pavilion over Crownstep records `west_route_priority`. These records alter NPC greeting variants and later opponent pools; they do not erase rewards already committed.

## 7) Species / opponents / collectibles

Combatants are arena skins, not biological peoples. Each region uses the following 16 original opponents; rarity, habitat, HP, attack, and AC are ledger data.

| Species ID | Name | Rarity | Habitat tags | Base HP | Atk | AC |
|---|---|---|---|---:|---:|---:|
| `quay_sparrer` | Chalkfin Sparrer | common | quay, agile | 32 | 7 | 11 |
| `ropejaw_runner` | Ropejaw Runner | common | quay, grapple | 38 | 8 | 12 |
| `brass_mite` | Brass Mite | common | shed, swarm | 24 | 6 | 10 |
| `tideglass_hare` | Tideglass Hare | uncommon | quay, evasive | 46 | 10 | 13 |
| `banner_kite` | Banner Kite | uncommon | rooftop, flying | 40 | 11 | 12 |
| `mirrorback` | Mirrorback | uncommon | market, counter | 58 | 9 | 14 |
| `echo_bully` | Echo Bully | common | market, loud | 52 | 12 | 12 |
| `sealpicker` | Sealpicker | uncommon | vault, thief | 44 | 13 | 13 |
| `rain_scrapper` | Rain Scrapper | common | yard, wet | 60 | 12 | 13 |
| `bellmole` | Bellmole | common | yard, burrow | 48 | 9 | 12 |
| `drumhide` | Drumhide | uncommon | yard, armored | 72 | 13 | 15 |
| `redline_crow` | Redline Crow | rare | yard, aerial | 66 | 16 | 14 |
| `trestle_duelist` | Trestle Duelist | uncommon | roof, precise | 70 | 15 | 15 |
| `ribbon_wisp` | Ribbon Wisp | rare | roof, feint | 54 | 18 | 14 |
| `line_breaker` | Line Breaker | rare | quay, elite | 110 | 20 | 16 |
| `brass_warden` | Brass Warden | epic | shed, boss | 180 | 25 | 18 |
| `gate_opponent` | Gate Opponent | rare | arena, ranked | 135 | 22 | 17 |
| `arc_crowned` | Arc-Crowned Victor | epic | finale, champion | 260 | 31 | 20 |

Collectibles include `item_quay_chalk`, `item_stake_card`, `item_gate_token`, `item_team_ribbon`, `item_split_mirror`, `item_echo_seal`, `item_yard_pin`, `item_rain_cord`, `item_bell_token`, `item_angle_chalk`, `item_lost_bracket`, `item_wind_knot`, `item_name_seal`, and `item_false_bracket`. Each has a collection-log entry with source place and first-acquisition timestamp.

## 8) Loot / economy

Starter templates are `item_weighted_baton`, `item_prism_buckler`, `item_thread_rings`, `item_quay_map`, `item_market_map`, `item_yard_map`, and `item_roof_map`. Profession outputs are `item_quay_spring`, `item_mended_sash`, `item_mirror_polish`, and `item_wind_knot`; dungeon drops are `item_brass_cog`, `item_echo_lens`, `item_rhythm_core`, and `item_angle_clasp`. Cosmetics include `cosmetic_chalk_cape`, `cosmetic_mirror_visor`, `cosmetic_drumsash`, `cosmetic_ribbon_coat`, and `cosmetic_crownstep_badge`; they provide no combat power.

| Source | Personal loot table |
|---|---|
| `quay_sparrer` | 55% `item_quay_chalk`, 20% `item_quay_spring`, 5% `cosmetic_chalk_cape` |
| `mirrorback` | 50% `item_split_mirror`, 18% `item_mirror_polish`, 4% `cosmetic_mirror_visor` |
| `drumhide` | 50% `item_bell_token`, 20% `item_rhythm_core`, 4% `cosmetic_drumsash` |
| `ribbon_wisp` | 48% `item_angle_chalk`, 18% `item_angle_clasp`, 4% `cosmetic_ribbon_coat` |
| `brass_warden` | guaranteed `item_brass_cog`, 30% `item_gate_token`, 8% `cosmetic_crownstep_badge` |
| `arc_crowned` | guaranteed `item_name_seal`, 20% one cosmetic, 10% title `title_clean_arc` |

Vendors `npc_vesa`, `npc_kael`, `npc_fer`, and `npc_ila` sell maps, wraps, repair kits, and cosmetics. Repair cost is `2 gold` per durability point, capped at `40 gold` per visit. Faucets are quest rewards, match completion, and capped daily chalk/cord/polish contracts. Sinks are repairs, map fees (5 gold), practice entry (3 gold), and cosmetic tailoring (20–80 gold). Daily contract gold is capped at 120; cosmetic tokens are earned from milestones and never exchanged for gold. No pack sells power or random combat outcomes.

## 9) Instances

### Soloable 5-man equivalent: `inst_quay_gatehouse`

| Room | Before-creature description | Encounter | Feature / exit |
|---|---|---|---|
| `quay_gate_room_01` | A low brass hall holds four hanging gates; salt air enters through slotted shutters. | `brass_mite` x3 | Read three latch marks; exit to room 2. |
| `quay_gate_room_02` | The floor is a chalk grid over shallow water, with no creature visible until the bell rings. | `ropejaw_runner` x2 | Trash fight; checkpoint after win. |
| `quay_gate_room_03` | A narrow inspection bridge crosses a dark cistern; a single judge’s chair faces the bridge. | `mirrorback` x1, elite | Elite encounter; exit opens when guard is broken. |
| `quay_gate_room_04` | The gate machinery fills the chamber, pistons moving in three timed rhythms. | `brass_mite` x4 | Disable two pistons using `item_gate_token`; exit to boss. |
| `quay_gate_room_05` | The final ring is painted on a circular platform above the tide, and the brass warden waits beyond the far line. | `brass_warden` x1, elite | Boss; victory opens `crosswind_concourse`. |

Big instance `inst_circuit_arc_finale` is a 10-player-equivalent three-phase public final, still playable as a private 2–5 party with scaled score targets. Phase 1, **The Four Lines**, has four simultaneous ring lanes and `gate_opponent` x4; Phase 2, **The Moving Terms**, rotates legal objectives between guard, ring-out, and score; Phase 3, **The Crownless Decider**, pits the party against `arc_crowned` while rival NPCs create non-damaging distractions. A checkpoint is committed after each phase. Personal loot is rolled only after the final ledger victory.

## 10) Progression

| Node ID | Cost | Requires | Effect flags |
|---|---:|---|---|
| `talent_steady_guard` | 1 | — | `guard_plus_4` |
| `talent_quick_recovery` | 1 | `talent_steady_guard` | `checkpoint_recover_plus_5` |
| `talent_burst_step` | 2 | `talent_quick_recovery` | `ability_burst_step_rank_2` |
| `talent_angle_mark` | 2 | — | `ability_angle_mark_rank_2` |
| `talent_counter_window` | 2 | `talent_angle_mark` | `counter_bonus_8_percent` |
| `talent_team_call` | 3 | `talent_counter_window` | `ally_guard_share` |
| `license_quay` | 1 | — | `map_quay_full` |
| `license_market` | 2 | `license_quay` | `map_market_full` |
| `license_yard` | 2 | `license_quay` | `map_yard_full` |
| `license_roof` | 2 | `license_market` | `map_roof_full` |
| `talent_clean_ring` | 3 | `license_roof` | `score_gain_5_percent` |
| `talent_second_breath` | 4 | `talent_clean_ring` | `once_per_match_hp_restore_10` |
| `talent_public_oath` | 4 | `talent_team_call` | `reputation_gain_10_percent` |
| `talent_final_angle` | 5 | `talent_public_oath`,`talent_second_breath` | `finale_objective_bonus` |

No node is pay-to-unlock. Weekly contracts are: win two clean sets; escort one novice through `quay_gatehouse`; deliver three profession outputs; complete one capital route; and record one respectful walk-away. Each contract is capped at one reward per character per week and pays 80 gold plus 40 XP-equivalent reputation.

## 11) Theme Kit + copy

The palette uses electric vermilion, deep ink, chalk white, brass yellow, and rain blue. Materials are painted canvas, scored brass, wet stone, and translucent lane glass. Dice are weighted-looking black resin with bright edge pips. Voice direction is quick, sincere, and rhythmic; impact sounds are handclaps, bell strikes, shoe scrapes, and wood cracks rather than explosions. The ambient loop is **“Four Bells Across the Concourse”**: distant bells, footfalls, cloth snaps, and a low hand-drum pulse. Fashion defaults to asymmetrical jackets, team sashes, wrapped ankles, repaired gloves, and earned badges. System/chrome name: **Arc Ledger**.

**Player-facing UI labels:** Inventory: “Kit Bag”; Journal: “Bracket Book”; Map: “Route Board”; Quest marker: “Open Stake”; Objective complete: “Line Settled”; Party: “Corner Team”; Match finder: “Call a Bout”; Checkpoint: “Saved Bell”; Rewards: “Earned Purse”; Gold: “Purse”; Cosmetic tokens: “Color Marks”; Talent tree: “Technique Ladder”; Reputation: “Name in the Arc”; Start match: “Step to Line”; Retreat: “Yield the Ring”; Victory: “Set Won”; Defeat: “Learn the Floor”; Weekly contract: “Seven-Day Terms”; Collection log: “Keepsake Index”; Settings: “Quiet the Crowd”.

**New Game card hooks:**

1. “Your first opponent is watching your feet, not your face.”
2. “The quay gate opens only for a promise spoken aloud.”
3. “A clean loss can buy more passage than a dirty win.”
4. “Four roads meet where no champion owns the chalk.”
5. “Someone has altered the bracket, and the ink is still wet.”
6. “The crowd wants a spectacle; your neighbor needs a safe floor.”
7. “A rival offers you a shortcut with a cost hidden in the terms.”
8. “Your team sash is unfinished until you choose what it must mean.”
9. “At the capital, every victory becomes someone else’s evidence.”
10. “The final gate asks not who hits hardest, but who can keep the line.”

## 12) Failures + John’s calls

| Clone risk | Call |
|---|---|
| A tournament ladder could feel like a copied anime bracket. | Use four distinct local economies, public stakes, ring geometry, and consequence records rather than a chosen-one ladder. |
| Named techniques could become franchise-like signature attacks. | Keep ability flags short and functional; let players combine timing, guard, and positioning. |
| Rival banter could imitate famous hotheaded/quiet pairs. | Rivals have materially different promises: safety, record accuracy, route access, and team trust. |
| A gate-to-final plot could become a world-saving escalation. | Default story remains local: protect training spaces, correct brackets, and earn passage; larger stakes are speculative post-campaign content. |
| Public crowd systems could imply uncontrolled social chat. | Default is canned hub emotes and nearby count only; no stranger text enters authored dialogue. |

**Open decisions.** None are blocking for content implementation. Speculative default: `crownstep_city` is the east capital for players who prioritize public proof, while `quietus_pavilion` is the west capital for players who prioritize oath records; both converge on the same final instance with different NPC barks and cosmetic reward tracks.

## Integrity checklist

1. `worldId` is the stable snake_case ID `circuit_arc`.
2. The display name is the locked working name Circuit Arc.
3. The genre is shonen tournament only, not science fiction.
4. No live service, save, prompt, or database references appear in-world.
5. Dump-error titles are not used as canon.
6. Licensed franchise names are confined to the ban-list fence.
7. Four distinct starts are present.
8. Each start has a non-capital hub.
9. The full travel graph includes the Crosswind Concourse.
10. Two end-of-start capitals are defined.
11. Indoor and outdoor map semantics are explicit.
12. Instance doors are places.
13. Durable NPCs have stable IDs.
14. Quest-givers and merchants have canned talk trees.
15. Hub emotes are canned, not improvised stranger chat.
16. Opening choices include a stake.
17. HookArc flags are explicit.
18. Retry fingerprints are authored.
19. The primary start has 18 authored beats.
20. Every objective uses code-owned verbs and IDs.
21. Rewards are numeric gold and XP values.
22. Divergence records capture walk-aways.
23. Opponents have rarity, habitat, HP, attack, and AC.
24. No Saltkin-named creatures exist.
25. Loot is personal and cosmetic power is zero.
26. Gold and cosmetic tokens are separate wallets.
27. Repair pricing and daily caps are explicit.
28. The soloable five-room instance describes each room before creatures.
29. The big instance has three phases and checkpoints.
30. Progression has 14 non-purchasable nodes.
31. Weekly contracts are capped.
32. Theme Kit includes colors, materials, dice, voice, loop, and fashion.
33. Twenty skinned UI labels are provided.
34. Ten opening hooks are provided.
35. Clone risks and avoidance calls are documented.
36. No placeholder or TBD language is used.
37. No production app code is included.
38. Names are original and stable.
39. The file is content-only and quarantined.
40. The pack is complete for `circuit_arc` sections 0–12.

## File created

`WOF_circuit_arc_Pack.md`
