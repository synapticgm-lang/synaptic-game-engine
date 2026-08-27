# WOF World Pack: Halo Term

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `halo_term` |
| Display name | Halo Term |
| Pitch | A powers school where young practitioners learn to control visible “halos” while protecting four neighborhoods from consequences of uncontrolled abilities. |
| Maturity | Teen |
| `rulesModuleId` | `hp_check_exams` |
| Theme Kit | `halo_term_prismglass` |
| Genre pattern and fence | Original powers-school adventure about discipline, friendship, and public responsibility; this is **not** a wizard-school, superhero-franchise, or licensed academy setting. |

**Genre-specific ban-list:** Hogwarts, Harry Potter, Gryffindor, Slytherin, Ravenclaw, Hufflepuff, Dumbledore, Voldemort, wand sports, Quidditch, wizard robes, The System, Aincrad, NerveGear, Kirito, Pokémon, Poké Ball, Pokédex, Pikachu, Palworld, My Hero Academia, U.A. High, All Might, One For All, Genshin, Teyvat, Vision, Warhammer, Elder Scrolls, Tamriel, Skyrim, Baldur’s Gate, Faerûn, Beholder, Final Fantasy, chocobo, Midgar, Star Wars, Jedi, Sith, Hogwarts houses, Avengers, X-Men, Marvel, DC, Gotham, Krypton, licensed capes, licensed idol groups, licensed sports leagues, licensed mecha series, anime death-game slogans, “gotta catch them all,” “with great power,” Mordor, Gondor, Middle-earth, Voldemort’s wand, and any renamed copy of these.

All peoples, places, powers, slogans, items, and plots below are original. Halo Term is quarantined content only; it contains no live-service, save, prompt, or backend dependency.

## 1) Rules module: `hp_check_exams`

The ledger owns `hp_current`, `hp_max`, `guard`, `stress`, `exam_score`, `discipline_rank`, `ability_flag`, `quest_state`, `inventory`, `gold`, `cosmetic_tokens`, `instance_checkpoint`, `weekly_lockout`, and `nearby_player_count`. Combat is instanced, lockstep, and party-sized 1–5. Wipe returns the party to the latest checkpoint; a weekly character-per-boss lockout applies to the capstone. Personal loot is deterministic from the room seed.

Prose may describe sensation, color, and stakes, but may not invent damage numbers, loot, exam scores, successful ability checks, defeated enemies, or cleared rooms. Code commits state first; narration follows.

### Diegetic chrome templates

```text
[HALO REGISTER] Ability flag: {abilityFlag}. Control band: {disciplineRank}. Stress: {stress}/{stressMax}.
[FIELD CHECK] Target: {targetId}. Action: {actionLabel}. Result: {success|fail}. HP: {hpCurrent}/{hpMax}.
[EXAM BOARD] Practical {examId}: {score}/{maxScore}. Requirement: {requirement}. Status: {pass|retry}.
[SAFE BELL] Checkpoint saved at {placeName}. Return route: {exitLabel}.
[DISCIPLINE NOTE] {npcName}: “{cannedLine}” Reputation mark: {reputationDelta}.
[INSTANCE LEDGER] {roomId}: {encounterState}. Personal drops resolved: {dropIds}.
```

## 2) Identity kits

| Kit ID | Look, values, taboo, speech tell | Starter clothes / weapon | Start and first-hour quest | Ability flag | Originality note |
|---|---|---|---|---|---|
| `aureline` | Warm-brown skin with sun-thread freckles; values stewardship; taboo: never flare near a child; says “let me set the boundary” | Copper-trim jacket / focus baton | `south_gate_measurements` at `sunward_quay`; “I set limits before I show force.” | `vector_sight` | A new civic discipline kit, not a renamed franchise house. |
| `vesperkin` | Deep umber skin and reflective pupils; values privacy; taboo: do not read a person’s shadow; speaks in short conditional phrases | Slate hoodcoat / prism knife | `quiet_signal` at `glassway`; “If the angle holds, we can pass.” | `shade_fold` | An original optical stealth culture, not an existing magical people. |
| `morrowtide` | Freckled olive skin, salt-white hair tips; values mutual aid; taboo: never borrow a pulse without consent; uses questions to soften claims | Blue utility vest / resonance gauntlet | `borrowed_breath` at `canal_steps`; “Could we try that together?” | `echo_lend` | An original resonance practice grounded in consent. |
| `ironbloom` | Dark skin, mineral-colored nails, bright iris rings; values repair; taboo: never break a tool to make a point; speaks through practical metaphors | Canvas overshirt / anchor maul | `seam_under_stone` at `kiln_yard`; “Every crack points somewhere.” | `fault_mark` | An original structural-sense kit, not a renamed dwarf or hero. |

## 3) Map / places

The four starts are `sunward_quay`, `glassway`, `canal_steps`, and `kiln_yard`; each has a non-capital hub. `concord_courtyard` is the mid-world merge, with capitals `north_crown` and `east_annex`. Travel is physical: every start exits to `concord_courtyard`, then to either capital. Visited places show pins; unvisited places show an outline only. Streets use pins, interiors use floor plans, and an instance door is itself a place.

| ID | Public name | Zone | Scale | Danger | Outdoor | Exits | NPCs | Dungeon |
|---|---|---|---|---|---|---|---|---|
| `sunward_quay` | Sunward Quay | sunward_quay | street | safe | true | `quay_gate`,`concord_courtyard` | `mentor_ive`,`dock_clerk_ren`,`watcher_pax` | — |
| `quay_gate` | Brass Gate | sunward_quay | street | low | true | `sunward_quay`,`awning_walk` | `gatewarden_jor` | — |
| `awning_walk` | Awning Walk | sunward_quay | street | low | true | `quay_gate`,`tide_classroom` | `vendor_lio` | — |
| `tide_classroom` | Tide Classroom | sunward_quay | dungeon | safe | false | `awning_walk`,`undertow_door` | `mentor_ive` | `undertow_archive` |
| `lamp_pier` | Lamp Pier | sunward_quay | street | low | true | `sunward_quay`,`old_crane` | `dock_clerk_ren` | — |
| `old_crane` | Old Crane | sunward_quay | street | medium | true | `lamp_pier`,`quay_gate` | `watcher_pax` | — |
| `undertow_door` | Undertow Door | sunward_quay | dungeon | medium | false | `tide_classroom`,`undertow_archive` | `mentor_ive` | `undertow_archive` |
| `glassway` | Glassway | glassway | street | safe | true | `mirror_lane`,`concord_courtyard` | `mentor_senn`,`scribe_ora` | — |
| `mirror_lane` | Mirror Lane | glassway | street | low | true | `glassway`,`shutter_square` | `scribe_ora` | — |
| `shutter_square` | Shutter Square | glassway | street | low | true | `mirror_lane`,`quiet_stacks` | `shopkeeper_vell` | — |
| `quiet_stacks` | Quiet Stacks | glassway | dungeon | safe | false | `shutter_square`,`refraction_door` | `mentor_senn` | `refraction_archive` |
| `blue_roof` | Blue Roof | glassway | street | low | true | `glassway`,`mirror_lane` | `runner_kai` | — |
| `refraction_door` | Refraction Door | glassway | dungeon | medium | false | `quiet_stacks`,`refraction_archive` | `mentor_senn` | `refraction_archive` |
| `canal_steps` | Canal Steps | canal_steps | street | safe | true | `sluice_gate`,`concord_courtyard` | `mentor_mai`,`ferrier_tov` | — |
| `sluice_gate` | Sluice Gate | canal_steps | street | low | true | `canal_steps`,`reed_market` | `ferrier_tov` | — |
| `reed_market` | Reed Market | canal_steps | street | low | true | `sluice_gate`,`echo_basin` | `vendor_nemi` | — |
| `echo_basin` | Echo Basin | canal_steps | street | medium | true | `reed_market`,`canal_steps` | `mentor_mai` | — |
| `canal_classroom` | Canal Classroom | canal_steps | dungeon | safe | false | `canal_steps`,`pulse_vault_door` | `mentor_mai` | `pulse_vault` |
| `pulse_vault_door` | Pulse Vault Door | canal_steps | dungeon | medium | false | `canal_classroom`,`pulse_vault` | `mentor_mai` | `pulse_vault` |
| `kiln_yard` | Kiln Yard | kiln_yard | street | safe | true | `foundry_gate`,`concord_courtyard` | `mentor_ren`,`maker_bris` | — |
| `foundry_gate` | Foundry Gate | kiln_yard | street | low | true | `kiln_yard`,`slag_garden` | `maker_bris` | — |
| `slag_garden` | Slag Garden | kiln_yard | street | low | true | `foundry_gate`,`anchor_room` | `maker_bris` | — |
| `anchor_room` | Anchor Room | kiln_yard | dungeon | safe | false | `slag_garden`,`seamworks_door` | `mentor_ren` | `seamworks` |
| `bell_foundry` | Bell Foundry | kiln_yard | street | medium | true | `kiln_yard`,`foundry_gate` | `bellmaker_yul` | — |
| `seamworks_door` | Seamworks Door | kiln_yard | dungeon | medium | false | `anchor_room`,`seamworks` | `mentor_ren` | `seamworks` |
| `concord_courtyard` | Concord Courtyard | mid | street | safe | true | `sunward_quay`,`glassway`,`canal_steps`,`kiln_yard`,`north_crown`,`east_annex` | `dean_ves`,`registrar_noll` | — |
| `north_crown` | North Crown | capital | street | safe | true | `concord_courtyard`,`exam_spire` | `dean_ves`,`quartermaster_eli` | — |
| `east_annex` | East Annex | capital | street | safe | true | `concord_courtyard`,`exam_spire` | `registrar_noll`,`counselor_ren` | — |
| `exam_spire` | Exam Spire | capital | dungeon | medium | false | `north_crown`,`east_annex`,`crown_trial_door` | `proctor_sai` | `crown_trial` |
| `crown_trial_door` | Crown Trial Door | capital | dungeon | medium | false | `exam_spire`,`crown_trial` | `proctor_sai` | `crown_trial` |

## 4) Durable NPCs

| ID | Name | Place | Role |
|---|---|---|---|
| `mentor_ive` | Iven Sora | tide_classroom | quest |
| `dock_clerk_ren` | Ren Pell | lamp_pier | merchant |
| `watcher_pax` | Pax Daro | old_crane | local |
| `mentor_senn` | Senn Vale | quiet_stacks | quest |
| `scribe_ora` | Ora Kest | mirror_lane | profession |
| `shopkeeper_vell` | Vell Arco | shutter_square | merchant |
| `mentor_mai` | Mai Teren | canal_classroom | quest |
| `ferrier_tov` | Tov Neris | sluice_gate | hub |
| `vendor_nemi` | Nemi Rusk | reed_market | merchant |
| `mentor_ren` | Renna Holt | anchor_room | quest |
| `maker_bris` | Bris Olan | slag_garden | profession |
| `bellmaker_yul` | Yul Fen | bell_foundry | local |
| `dean_ves` | Dean Veyra Sol | north_crown | quest |
| `registrar_noll` | Noll Arven | east_annex | hub |
| `proctor_sai` | Sai Merrow | exam_spire | quest |

### Premade talk trees

| NPC | Greet | Quest offer | Progress | Turn-in | Gossip (three lines) | Refusal / rude |
|---|---|---|---|---|---|---|
| Iven Sora | “Breathe before the halo answers.” | “Measure the quay’s flare marks, then choose who gets warned.” | “Your readings are steady; the people are not.” | “You made restraint visible. That is a passing lesson.” | “The tide remembers pressure.” / “A halo is a promise with edges.” / “Never grade a frightened witness.” | “I will not reward a threat. Step back and ask again.” |
| Ren Pell | “Cargo first, sparks second.” | “Carry three sealed lens-cases to the classroom.” | “Two cases arrived; the third is under the red awning.” | “The set is whole. Here is the agreed wage.” | “Pier bells mean fog.” / “I price by weight, not fame.” / “The west rope is new.” | “Rudeness does not move freight.” |
| Pax Daro | “You saw the crane shudder too?” | “Check the brace and tell me what actually failed.” | “A clean report beats a dramatic story.” | “Good. The crew can work from facts.” | “Old metal sings before it breaks.” / “I trust boots over rumors.” / “The quay owes nobody a spectacle.” | “Lower your voice or leave the gantry.” |
| Senn Vale | “Reflections can lie without speaking.” | “Recover the three misfiled aperture cards.” | “The cards are aligned; now compare the dates.” | “You found the pattern without inventing one.” | “Glass keeps sunlight and secrets.” / “Silence is not consent.” / “Every archive has a blind corner.” | “I answer courtesy with courtesy.” |
| Ora Kest | “Ink, angle, and patience.” | “Copy four safe-hand symbols into the field ledger.” | “Your lines hold even under pressure.” | “The ledger is usable; take its binding.” | “Blue ink fades fastest.” / “A margin can save a life.” / “Never sign a blank page.” | “No hands on my desk after that tone.” |
| Vell Arco | “Useful things, fair prices.” | “Bring two prism shards and I will cut a practice lens.” | “The shards are sound; choose a frame.” | “A tool should teach, not boast.” | “Copper forgives heat.” / “Slate hides scratches.” / “A bright coat is not armor.” | “Shop elsewhere until you can speak plainly.” |
| Mai Teren | “Can you hear the basin breathing?” | “Set four resonance flags around the echo basin.” | “The flags are singing in sequence.” | “You kept the rhythm and nobody was pulled off balance.” | “Water carries names.” / “Ask before borrowing breath.” / “A pause is part of a chord.” | “I will not continue while you endanger bystanders.” |
| Tov Neris | “The ferry leaves when the bell agrees.” | “Escort one supply skiff past the sluice.” | “The current eased after your warning.” | “You brought the skiff home; the fare is yours.” | “Canal fog comes early.” / “I mend oars twice.” / “Maps dislike proud captains.” | “No passage for insults.” |
| Nemi Rusk | “Fresh reeds, dry packs.” | “Collect three clean reed bundles from the market stalls.” | “The bundles are sorted by flexibility.” | “Good stock. Take the labeled satchel.” | “Market folk hear everything.” / “Never stack wet paper.” / “A bargain needs witnesses.” | “I do not haggle with a bully.” |
| Renna Holt | “The wall is not your enemy; the crack is.” | “Mark five safe anchor points in the seamworks.” | “Four points hold; the fifth is humming.” | “You found the fault before it became a fall.” | “Stone keeps a longer schedule.” / “Measure twice.” / “A bell can be a brace.” | “Come back when your hands are calm.” |
| Bris Olan | “Metal remembers the shape of force.” | “Temper two anchor plates and deliver them to Renna.” | “The first plate is true; the second needs one more pass.” | “Both plates will hold. Take the clean one.” | “Heat is a debt.” / “Tools deserve names.” / “Never quench a frightened blade.” | “Leave my bench if you cannot listen.” |
| Yul Fen | “The bell has a question for you.” | “Tune three warning bells to different safe tones.” | “The third tone is low enough for the nursery.” | “Now the district can hear danger without panic.” | “Bronze likes patience.” / “Small bells travel farther.” / “Silence can be tuned.” | “Do not strike what you refuse to repair.” |
| Dean Veyra Sol | “Welcome to the part where choices are recorded.” | “Bring four verified start reports to Concord.” | “The reports agree on one local cause.” | “Your cohort has earned a supervised trial.” | “Authority is a borrowed coat.” / “A grade is evidence, not identity.” / “The city watches outcomes.” | “No appeal begins with contempt.” |
| Noll Arven | “Your route is clear.” | “Stamp the four district permits.” | “Three permits are stamped; the quay seal is missing.” | “The route is legal and visible.” | “Paper prevents arguments.” / “I dislike surprises in ink.” / “The east stair closes at dusk.” | “Return after you can name the missing form.” |
| Sai Merrow | “The trial room obeys the ledger.” | “Complete the Crown Trial without abandoning a partner.” | “Your checkpoint is secure; one chamber remains.” | “You passed by solving the room, not by overpowering it.” | “A clean win leaves options.” / “Exams reveal habits.” / “The bell rings for everyone.” | “I will not debate a result you have not earned.” |

**Canned hub lines, ten per starting zone:**

| Zone | Lines |
|---|---|
| Sunward Quay | “Mind the wet brass.”; “Quay bells at noon.”; “Keep halos below the awnings.”; “The tide is higher.”; “Lens cases to the left.”; “Watch the crane.”; “No flares near the ferries.”; “Classroom doors close softly.”; “Report broken rails.”; “You are seen; stay steady.” |
| Glassway | “Reflections are not exits.”; “Keep hands off the shutters.”; “Blue roofs mean quiet study.”; “Cards go back in order.”; “Ask before copying.”; “Mind the bright lane.”; “No running on glass.”; “Vell has spare frames.”; “The stacks close at dusk.”; “Speak so the room can hear.” |
| Canal Steps | “Tie the skiff twice.”; “Flags mark safe water.”; “Reed bundles stay dry.”; “Hear before you answer.”; “The sluice is turning.”; “Mind the echo.”; “No halo over open water.”; “Market lane is crowded.”; “Return borrowed breath.”; “The basin is calm today.” |
| Kiln Yard | “Give the bell room.”; “Gloves by the gate.”; “Heat rises fast.”; “Anchor plates are cooling.”; “Walk around the seam.”; “Tools back on hooks.”; “No sparks in the garden.”; “The foundry starts early.”; “Listen for the low tone.”; “A sound crack is still a warning.” |

## 5) Premade choices / first hour

Each opening deck has five beats: arrival, self-description, a visible hazard, a stake, and a consequence. The player chooses one of `protect_bystander`, `secure_equipment`, or `tell_uncomfortable_truth`; the choice writes `first_choice` and changes the first NPC response. `HookArc` flags are `identity_confirmed`, `first_choice`, and `observed_consequence`.

| POI | Choice buttons (requirements and intent) |
|---|---|
| `quay_gate` | “Lower the gate” (none, fight_move); “Warn the ferries” (`talk_to_npc:watcher_pax`, dialogue); “Inspect hinge” (none, investigate); “Escort clerk” (`talk_to_npc:dock_clerk_ren`, protect); “Wait for bell” (none, observe); “Record flare” (none, collect_item) |
| `mirror_lane` | “Cover the shard” (none, protect); “Ask Ora” (`talk_to_npc:scribe_ora`, dialogue); “Align card” (`collect_item:aperture_card`, craft); “Mark safe reflection” (none, investigate); “Call classmates” (`talk_to_npc:mentor_senn`, assist); “Leave the lane” (none, retreat) |
| `echo_basin` | “Place flag” (`resonance_flag`, craft); “Call to Mai” (`talk_to_npc:mentor_mai`, dialogue); “Brace the rail” (none, protect); “Listen twice” (none, investigate); “Guide skiff” (`talk_to_npc:ferrier_tov`, escort); “Step away” (none, retreat) |
| `seamworks_door` | “Test anchor” (`anchor_plate`, investigate); “Ask Renna” (`talk_to_npc:mentor_ren`, dialogue); “Ring warning bell” (none, protect); “Clear loose slag” (none, collect); “Brace partner” (none, assist); “Withdraw to checkpoint” (none, retreat) |

**Tutorial forced path:** arrive; choose kit; confirm `identity_confirmed`; inspect a harmless halo mark; choose a stake; resolve one safe action; observe a local consequence; talk to mentor; receive starter item; visit hub; unlock `first_choice`; complete one code-owned objective; save `observed_consequence`; unlock first instance door. Alt characters may skip after `identity_confirmed`.

**Retry fingerprints:**

| ID | Goal | Tactic | Obstacle | Revelation | Consequence |
|---|---|---|---|---|---|
| `retry_quay` | protect ferry | brace rail | bent hinge | pressure is directional | ferry leaves late |
| `retry_glass` | recover cards | sort dates | false reflection | archive was misfiled | shutter stays closed |
| `retry_canal` | stabilize basin | sequence flags | echo feedback | consent changes resonance | skiff waits |
| `retry_kiln` | secure seam | anchor plate | hot fault | bell tone reveals stress | foundry pauses |
| `retry_truth` | report cause | show ledger | witness fears blame | honest wording protects crew | mentor trust rises |
| `retry_tools` | finish craft | slow temper | uneven heat | tool rhythm matters | output quality changes |
| `retry_escort` | guide a person | clear route | crowd surge | route signs were missing | hub gains a marker |
| `retry_trial` | pass chamber | preserve options | locked split door | two small actions beat one flare | checkpoint remains |

## 6) Quests: code-completeable DAGs

The four starts each contain 18 authored beats. Rewards are committed numeric values. `unlock` means the listed quest becomes available after completion.

### Sunward Quay quest DAG

| ID | Title | Family | Hidden | Unlock | Objectives | Gold | XP |
|---|---|---|---:|---|---|---:|---:|
| `south_gate_measurements` | South Gate Measurements | identity | false | `quay_oath` | `visit_place:quay_gate`; `collect_item:flare_rubbing` x3 | 12 | 40 |
| `quay_oath` | A Promise With Edges | identity | false | `safe_hands` | `talk_to_npc:mentor_ive`; `deliver_item:flare_rubbing` x3 | 14 | 45 |
| `safe_hands` | Safe Hands | identity | false | `lantern_route` | `talk_to_npc:watcher_pax`; `visit_place:old_crane` | 16 | 50 |
| `quay_lens_cases` | Three Lens Cases | profession | false | `dock_inventory` | `collect_item:lens_case` x3; `deliver_item:lens_case` x3 | 18 | 55 |
| `dock_inventory` | Dock Inventory | profession | false | `brass_seal` | `talk_to_npc:dock_clerk_ren`; `collect_item:cargo_tag` x4 | 20 | 60 |
| `brass_seal` | Brass Seal | profession | false | `tide_route` | `deliver_item:cargo_tag` x4; `talk_to_npc:dock_clerk_ren` | 22 | 65 |
| `tide_route` | Tide Route | zone_story | false | `quay_notice` | `visit_place:lamp_pier`; `talk_to_npc:watcher_pax` | 24 | 75 |
| `quay_notice` | Notice Under the Awning | zone_story | false | `undertow_breadcrumb` | `deliver_item:safety_notice` x2; `talk_to_npc:mentor_ive` | 26 | 80 |
| `undertow_breadcrumb` | Door Below the Tide | zone_story | false | `undertow_archive_entry` | `visit_place:undertow_door`; `talk_to_npc:mentor_ive` | 28 | 90 |
| `undertow_archive_entry` | Archive Entry | dungeon | false | `quay_concord` | `visit_place:undertow_archive`; `ledger_kill:brine_static` x4 | 34 | 120 |
| `quay_concord` | Report to Concord | zone_story | false | `four_reports` | `deliver_item:quay_report`; `visit_place:concord_courtyard` | 30 | 100 |
| `first_ferry` | First Ferry | side | false | — | `talk_to_npc:ferrier_tov`; `collect_item:ferry_chit` | 10 | 35 |
| `missing_hook` | The Missing Hook | side | false | — | `collect_item:crane_hook`; `deliver_item:crane_hook` | 11 | 38 |
| `quiet_measure` | Quiet Measure | hidden | true | — | `talk_to_npc:watcher_pax`; `collect_item:quiet_mark` x2 | 25 | 90 |
| `aw_key` | Awning Key | extra | false | — | `collect_item:awning_key`; `deliver_item:awning_key` | 9 | 30 |
| `bell_practice` | Bell Practice | profession | false | — | `visit_place:tide_classroom`; `collect_item:bell_note` x3 | 13 | 42 |
| `daily_quay_sweep` | Daily Quay Sweep | daily | false | — | `visit_place:old_crane`; `ledger_kill:glimmer_mite` x5 | 8 | 25 |
| `quay_watch` | Watch the Watch | daily | false | — | `talk_to_npc:watcher_pax`; `collect_item:watch_token` | 8 | 25 |

### Glassway, Canal Steps, and Kiln Yard DAGs

Each list below is an authored 18-beat chain with local stakes; objectives use only code-owned verbs.

| Start | Quest IDs in order | Families and numeric rewards |
|---|---|---|
| Glassway | `quiet_signal`, `glass_oath`, `angle_check`, `aperture_cards`, `ink_under_shutter`, `safe_hand_symbols`, `mirror_lane`, `shutter_notice`, `refraction_breadcrumb`, `refraction_entry`, `glass_concord`, `blue_roof_errand`, `lost_margin`, `silent_index`, `frame_delivery`, `archive_daily`, `lane_daily`, `truth_in_reflection` | First 3 identity: 12/40, 14/45, 16/50; next 3 profession: 18/55, 20/60, 22/65; next 6 story/dungeon: 24/75, 26/80, 28/90, 34/120, 30/100, 10/35; extras: 11/38, 25/90, 9/30, 13/42, 8/25, 8/25. Objectives respectively: visit `mirror_lane`; talk `mentor_senn`; collect `aperture_card` x3; deliver `aperture_card` x3; collect `ink_vial` x4; deliver `ink_vial` x4; visit `shutter_square`; deliver `shutter_notice` x2; visit `refraction_door`; ledger_kill `angle_wisp` x4; visit `concord_courtyard` and deliver `glass_report`; then talk/collect one each for the six extras. |
| Canal Steps | `borrowed_breath`, `canal_oath`, `pulse_check`, `reed_bundles`, `market_sort`, `clean_stock`, `sluice_turn`, `basin_flags`, `pulse_breadcrumb`, `pulse_entry`, `canal_concord`, `skiff_ribbon`, `lost_oar`, `consent_mark`, `dry_pack`, `basin_daily`, `sluice_daily`, `shared_rhythm` | Same reward ladder as above; objectives: visit `sluice_gate`; talk `mentor_mai`; collect `pulse_rune` x3; collect `reed_bundle` x3; deliver `reed_bundle` x3; collect `market_tag` x4; visit `echo_basin`; collect `resonance_flag` x4; visit `pulse_vault_door`; ledger_kill `echo_mote` x4; visit `concord_courtyard` and deliver `canal_report`; extras use talk/collect/deliver with `ferry_ribbon`, `oar_pin`, `consent_mark`, `dry_pack`, and capped daily `ledger_kill:reed_skitter` x5 or `visit_place:sluice_gate`. |
| Kiln Yard | `seam_under_stone`, `kiln_oath`, `fault_mark`, `anchor_plates`, `temper_pass`, `clean_quench`, `foundry_gate`, `bell_warning`, `seam_breadcrumb`, `seam_entry`, `kiln_concord`, `slag_seed`, `bent_tongs`, `low_tone`, `plate_delivery`, `foundry_daily`, `bell_daily`, `crack_report` | Same reward ladder; objectives: visit `foundry_gate`; talk `mentor_ren`; collect `fault_rubbing` x3; collect `anchor_plate` x2; deliver `anchor_plate` x2; collect `temper_stamp` x4; visit `bell_foundry`; collect `warning_bell` x3; visit `seamworks_door`; ledger_kill `slag_flicker` x4; visit `concord_courtyard` and deliver `kiln_report`; extras use talk/collect/deliver with `slag_seed`, `bent_tongs`, `low_tone`, `plate_delivery`, and capped daily `ledger_kill:coal_spark` x5 or `visit_place:bell_foundry`. |

### Campaign spine

`four_reports` → `concord_review` (talk `dean_ves`) → `permit_round` (deliver four `district_permit`) → `capital_route` (visit `north_crown`) → `annex_route` (visit `east_annex`) → `cause_board` (talk `registrar_noll`) → `fault_map` (collect `cause_marker` x4) → `proctor_interview` (talk `proctor_sai`) → `trial_key` (deliver `verified_report`) → `crown_trial_entry` (visit `crown_trial_door`) → `first_chamber` (visit `crown_trial`) → `split_decision` (talk `proctor_sai`) → `second_chamber` (ledger_kill `exam_construct` x2) → `partner_promise` (talk any party member NPC) → `crown_trial_clear` (collect `trial seal`) → `cohort_record` (deliver `trial_seal`) → `next_term` (visit `exam_spire`). Rewards: 32/110, 34/120, 36/130, 38/140, 40/150, 42/160, 44/175, 46/190, 48/210, 52/230, 55/250, 58/270, 60/290, 64/315, 68/340, 72/365, 80/400.

Divergence records are explicit: `walkaway_public_truth` records `promise:public_truth` when the player refuses to soften a report; `walkaway_private_repair` records `promise:private_repair` when they leave to fix a damaged place first; `walkaway_partner_first` records `promise:partner_first` when they abandon the solo grade to protect a classmate.

## 7) Species / opponents / collectibles

Combat skins are original, non-sentient training hazards and local fauna. Each start has 16 species, four per rarity; all are soloable with telegraphed attacks.

| Region | Common | Uncommon | Rare | Epic |
|---|---|---|---|---|
| Quay | `glimmer_mite` 18/4/7, `brass_nib` 22/5/8, `foam_crawler` 26/6/9, `tide_pebble` 20/4/8 | `brine_static` 42/10/12, `hinge_snapper` 48/11/13, `lens_leech` 38/9/11, `crane_gust` 45/10/12 | `undertow_warden` 90/18/16, `bellray` 82/17/15, `silt_howler` 96/19/17, `dockshade` 88/18/16 | `quay_resonator` 180/28/21, `red_awning_core` 210/31/22, `tideglass titan` 240/34/24, `harbor equation` 260/36/25 |
| Glassway | `angle_wisp` 20/5/8, `paper_skitter` 18/4/7, `shardling` 24/6/9, `ink_fleck` 16/4/7 | `mirror_hound` 44/10/13, `card_swarm` 40/9/12, `glare moth` 36/8/11, `frame thief` 50/12/14 | `refraction_keeper` 92/19/17, `silver echo` 86/18/16, `shutter stag` 100/20/18, `index phantom` 88/19/17 | `glassway prism` 190/30/22, `archive fold` 220/33/23, `blue-roof giant` 245/36/25, `librarian engine` 270/38/26 |
| Canal | `echo_mote` 18/4/7, `reed_skitter` 23/5/8, `splash knot` 25/6/9, `canal tick` 17/4/7 | `pulse eel` 46/10/12, `sluice crab` 52/11/13, `ripple mask` 40/9/12, `reed runner` 43/10/13 | `basin caller` 94/19/17, `waterline bull` 110/21/18, `hush otter` 80/17/16, `current coil` 90/18/17 | `pulse_vault heart` 200/31/22, `canal choir` 230/34/24, `sluice monarch` 250/36/25, `deep rhythm` 280/39/27 |
| Kiln | `coal_spark` 20/5/8, `slag flea` 22/5/8, `bell mote` 18/4/7, `clay nib` 26/6/9 | `plate beetle` 48/11/13, `quench worm` 42/10/12, `iron pollen` 38/9/11, `seam crawler` 52/12/14 | `anchor brute` 100/20/18, `foundry bell` 90/18/17, `fault ram` 108/21/19, `kiln warden` 96/19/18 | `seamworks core` 210/32/23, `bell furnace` 235/35/24, `slag cathedral` 260/38/26, `crack sovereign` 290/41/28 |

Habitat tags are `quay`, `glass`, `canal`, and `kiln`; rarity is encoded in the catalog, not inferred by prose. Collectibles include `flare_rubbing`, `lens_case`, `aperture_card`, `resonance_flag`, `anchor_plate`, `trial_seal`, and cosmetic `district_ribbon`.

## 8) Loot / economy

Starter templates are `focus_baton`, `prism_knife`, `resonance_gauntlet`, `anchor_maul`, `academy_jacket`, `slate_hoodcoat`, `blue_utility_vest`, `canvas_overshirt`, and `district_map`. Profession outputs are `cut_lens`, `bound_ledger`, `tuned_flag`, and `tempered_plate`. Dungeon drops are `undertow_shard`, `refraction_spindle`, `pulse_chime`, `seam_clasp`; cosmetics are `quay_copper_trim`, `glass_blue_sash`, `canal_reed_pin`, and `kiln_amber_badge`.

| Source | Personal drop table |
|---|---|
| Common species | 70% `scrap_fiber`, 25% `minor_shard`, 5% `cosmetic_dye` |
| Uncommon species | 55% `minor_shard`, 35% `craft_component`, 10% zone cosmetic |
| Rare species | 60% `major_shard`, 30% profession component, 10% rare cosmetic |
| Epic species | 75% named dungeon component, 25% epic cosmetic |
| Boss room | 1 guaranteed named component, 1 random cosmetic roll, gold 35–60 |

Gold faucets are quest rewards, room completion, and profession turn-ins. Sinks are vendor goods, repairs, travel permits, and respec fees. Cosmetic tokens come only from achievements, festivals, and premium cosmetic purchases; they never buy combat power. Vendor catalogs include `basic_bandage` 6g, `field_lens` 18g, `repair_kit` 24g, `district_map` 30g, and cosmetics 40–90 tokens. `repairCostPerPoint` is 2 gold. Daily quest gold is capped at 120 per character; weekly contract gold is capped at 450.

## 9) Instances

Every instance is soloable at recommended rank 2 with optional party scaling. Each room is described before encounters appear.

### Five-room 5-man equivalents

| Instance | Rooms and encounters |
|---|---|
| `undertow_archive` | `ua_entry` brass stair, no creature, checkpoint; `ua_silt_gallery` damp shelves, `brine_static` x3; `ua_lens_vault` rotating lenses, `lens_leech` x2 plus `undertow_warden` elite; `ua_tide_bridge` narrow bridge, `crane_gust` x3, checkpoint; `ua_core` circular flooded archive, `quay_resonator` x1 boss, exits `tide_classroom`. |
| `refraction_archive` | `ra_entry` mirrored vestibule, no creature, checkpoint; `ra_card_room` card cabinets, `angle_wisp` x4; `ra_shutter_hall` descending shutters, `mirror_hound` x2 plus `refraction_keeper` elite; `ra_index_floor` tiled index, `paper_skitter` x4, checkpoint; `ra_prism` white chamber, `glassway_prism` x1 boss, exits `quiet_stacks`. |
| `pulse_vault` | `pv_entry` echoing lock, no creature, checkpoint; `pv_reed_run` wet walkway, `echo_mote` x4; `pv_sluice_ring` turning ring, `sluice_crab` x2 plus `basin_caller` elite; `pv_heart_steps` resonant stairs, `pulse_eel` x3, checkpoint; `pv_heart` suspended basin, `pulse_vault_heart` x1 boss, exits `canal_classroom`. |
| `seamworks` | `sw_entry` warm stone corridor, no creature, checkpoint; `sw_slag_lane` slag gutters, `coal_spark` x4; `sw_anchor_bay` hanging plates, `plate_beetle` x2 plus `anchor_brute` elite; `sw_bell_cut` bell-lined tunnel, `bell_mote` x3, checkpoint; `sw_fault` split foundry floor, `seamworks_core` x1 boss, exits `anchor_room`. |

### Big instance: `crown_trial`

This ten-player-equivalent three-phase examination remains playable by 1–5 with scaling. Phase 1, **The Four Gates**, tests four route choices and spawns `exam_construct` x8; phase 2, **Witness Floor**, requires three players or NPC partners to stand on verified marks while `index_phantom` x4 and `refraction_keeper` x2 appear; phase 3, **The Unfinished Halo**, is a non-lethal boss encounter against `unfinished_halo` x1 whose victory condition is `collect_item:trial_seal` after reducing guard to 0. Each phase has a checkpoint and a clear room-before-creature script. Weekly lockout is attached only to `unfinished_halo`.

## 10) Progression

| Node | Cost | Requires | Effect flag |
|---|---:|---|---|
| `steady_breath` | 0 | — | `stress_recovery_1` |
| `edge_awareness` | 1 | `steady_breath` | `guard_plus_4` |
| `safe_flare` | 1 | `steady_breath` | `ability_flag_safe_flare` |
| `route_memory` | 1 | `edge_awareness` | `map_pin_extra` |
| `partner_signal` | 2 | `safe_flare` | `assist_range_plus_1` |
| `measured_force` | 2 | `edge_awareness` | `damage_telegraph_plus_1` |
| `quiet_focus` | 2 | `safe_flare` | `stress_cap_plus_5` |
| `field_license` | 3 | `route_memory`,`partner_signal` | `license_rank_1` |
| `exam_reading` | 3 | `measured_force` | `exam_hint_once` |
| `repair instinct` | 3 | `quiet_focus` | `repair_cost_minus_1` |
| `shared_guard` | 4 | `partner_signal`,`field_license` | `guard_share_1` |
| `truthful_record` | 4 | `exam_reading`,`repair instinct` | `divergence_visibility` |
| `crown_candidate` | 5 | `shared_guard`,`truthful_record` | `trial_access` |
| `halo_weave` | 6 | `crown_candidate` | `ability_flag_halo_weave` |

Daily/weekly contracts, all capped: `district_sweep` (visit two starts, 25g/70xp), `safe_delivery` (deliver two components, 30g/80xp), `mentor_round` (talk to four mentors, 22g/60xp), `calm_the_hazard` (ledger_kill five local hazards, 28g/75xp), `verified_route` (visit Concord and one capital, 40g/100xp). No contract unlocks power for payment.

## 11) Theme Kit + copy

`halo_term_prismglass` uses smoked navy, warm copper, chalk white, and controlled spectrum accents. Materials are frosted glass, brushed brass, canvas, and slate. Dice are translucent resin with a copper core. Voice is observant, encouraging, and precise; the ambient loop is **“Hallway Rain and Low Chimes,”** a 74-second loop of rain on skylights, distant footfalls, and three soft bells. Fashion defaults to layered utility uniforms with district-colored piping, practical shoes, and removable insignia.

**UI labels:** `Inventory: Kit Locker`; `Journal: Field Record`; `Map: Route Board`; `Quest Log: Commitments`; `Party: Study Circle`; `Character: Halo Profile`; `Talents: Practice Tree`; `Crafting: Bench Work`; `Vendors: Supply Desks`; `Repair: Restore Gear`; `Instance Finder: Door List`; `Checkpoint: Safe Bell`; `Exam Results: Board Posting`; `Gold: Campus Scrip`; `Cosmetic Tokens: Prism Marks`; `Settings: Conduct Panel`; `Help: Handbook`; `Friends: Trusted Circle`; `Nearby: Passing Students`; `Exit: Leave District`.

**New Game card hooks:**

1. “Your halo appeared during a fire drill; today you learn who was watching.”
2. “A ferry bell rings the wrong warning, and your first grade begins before class.”
3. “The glass lane reflects a door that the city map does not contain.”
4. “Someone copied your ability mark into a public ledger.”
5. “A classmate asks for help before asking what your halo can do.”
6. “The canal carries a voice that answers only when invited.”
7. “A foundry crack spells your name in dust.”
8. “Your mentor offers a passing grade with one condition: tell the truth.”
9. “The school’s safest room has a lock on the inside.”
10. “You can prove you are powerful, or prove you are responsible.”

## 12) Failures + John’s calls

| Clone risk | Avoidance call |
|---|---|
| School factions becoming renamed licensed houses | Four district cultures are civic neighborhoods with practical duties, not status houses or inherited bloodlines. |
| Power ranking becoming a chosen-one ladder | Progression rewards control, evidence, and partnership; no prophecy, destiny, or exclusive savior. |
| Spectacle-first combat | Every encounter begins with a described room, a visible stake, and non-combat choices. |
| Mentor dialogue becoming improvisational filler | Durable NPCs have fixed talk trees and ten canned hub lines per start. |
| “Exam” becoming a copied death-game premise | Trials are non-lethal municipal assessments with checkpoints, retries, and local accountability. |

**Open decisions:** None are blocking. **Speculative default:** the four district starts converge on Concord after their local reports, while either capital can host the first supervised trial; this preserves meaningful route choice without requiring a second campaign spine.

## Integrity checklist

1. `worldId` is stable snake case: `halo_term`.
2. Display name and locked working name are preserved.
3. Genre is powers school.
4. IP fence is explicit.
5. Ban-list exceeds forty entries.
6. Dump-error titles are absent from canon content.
7. No live service references appear in-world.
8. Four distinct starting zones exist.
9. Four non-capital start hubs exist.
10. Two capitals and one mid-world merge exist.
11. Every map place has a stable ID.
12. Instance doors are modeled as places.
13. Fog distinguishes visited pins from outlines.
14. Sixteen durable NPCs have roles and fixed dialogue.
15. Quest objectives use only code-owned verbs.
16. Primary start contains eighteen authored beats.
17. Other starts contain eighteen authored IDs each.
18. Quest rewards are numeric gold and XP.
19. Divergence records preserve walk-away promises.
20. Four five-room soloable five-man equivalents exist.
21. A three-phase ten-player-equivalent big instance exists.
22. Room descriptions precede encounters.
23. Personal loot and repair economics are specified.
24. Gold and cosmetic tokens never mix.
25. No pay-to-win progression is present.
26. Progression contains fourteen nodes with requirements and effects.
27. Daily contracts are capped.
28. UI labels are skinned to the world.
29. Ten opening hooks are original.
30. Clone risks and avoidance calls are recorded.
31. No franchise creatures or artifacts are used.
32. No generic “LLM will improvise” dialogue appears.
33. No placeholder or TBD language appears.
34. Kid/teen safety is respected for the teen rating.
35. Four kit ability flags are unique.
36. Local problems lead the first hour.
37. Combat results remain ledger-owned.
38. Exam scores remain ledger-owned.
39. Checkpoints and weekly boss lockout are explicit.
40. The pack is content-only Markdown and contains no production app code.

**File created:** `WOF_halo_term_Pack.md`
