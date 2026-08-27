# WOF World Pack: Veil Watch

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `veil_watch` |
| Display name | Veil Watch |
| One-line pitch | A steadfast night watch investigates impossible weather, missing memories, and listening architecture before a coastal town forgets itself. |
| Maturity | `teen_plus` |
| `rulesModuleId` | `steadfast` |
| Theme Kit | `watchglass_midnight` |
| Genre pattern and fence | Cosmic-horror investigation built around evidence, courage, and community; **this is not a licensed occult franchise, a monster-catalog game, or a gore spectacle.** |

**Ban-list.** This pack bans the following lookalike identities and terms: Cthulhu, Yog-Sothoth, Nyarlathotep, Shoggoth, Deep One, Innsmouth, Arkham, Miskatonic, Necronomicon, Elder Sign, Great Old One, Azathoth, Carcosa, Hastur, Yellow King, Dunwich, Lovecraft, Call of Cthulhu, Mythos, Mi-Go, Hound of Tindalos, Colour Out of Space, Dagon, R'lyeh, Herbert West, Re-Animator, Silent Hill, Resident Evil, Umbrella Corporation, Dead Space, Necromorph, The Thing, Xenomorph, Weyland-Yutani, Alien, Predator, SCP, Backrooms, Control, The Magnus Archives, Welcome to Night Vale, Stranger Things, Twin Peaks, The X-Files, Supernatural, Beetlejuice, Ghostbusters, The Ring, The Grudge, Final Destination, Dracula, Frankenstein, Mothman, Wendigo, Slender Man, Slenderman, Pennywise, Freddy Krueger, Jason Voorhees, Michael Myers, Hellraiser, Cenobite, Saw, Jigsaw, Silent Hill, and any renamed imitation of their signature creature, place, relic, slogan, or plot. All names and cultures below are original.

## 1) Rules module: steadfast

The ledger owns `hp`, `steadfast`, `stress`, `evidence`, `dread`, `condition`, `inventory`, `placeId`, `questState`, `instanceCheckpoint`, `weeklyBossLockout`, and `divergenceRecords`. Combat is instanced and lockstep for parties of 1–5; the overworld is a shared, non-contested hub layer. A failed room returns the party to its last checkpoint. A boss has a weekly per-character lockout; personal loot is rolled after committed defeat. Veil Watch has no 10-person raid: its equivalent is a five-player **Night Council** investigation instance with synchronized evidence rather than a raid clear.

Prose may narrate sensory detail and consequences only after state commits. It must not invent damage, item drops, evidence counts, steadfast changes, boss defeat, clues, or escape outcomes. It may never declare a player cured, insane, dead, or cleared without a ledger result. A hidden clue remains hidden until its evidence flag is written.

### Diegetic chrome templates

```text
[WATCHGLASS // CASE {caseId}] PLACE: {placeName} | EVIDENCE {evidence}/{required} | STEADFAST {steadfast}
[FIELD NOTE] {speaker}: “{cannedLine}” | OBSERVATION FLAG: {flagId}
[THRESHOLD] DREAD {dread}/5 | SAFE EXIT: {placeId} | CHECKPOINT: {checkpointId}
[WITNESS LEDGER] {npcName} remembers {memoryTag}; corroboration: {corroborationState}
[COUNCIL ROOM] PHASE {phase}/3 | CASE CLOCK {ticks} | NEXT VALID ACTION: {actionLabel}
[VERDICT] CASE {caseId}: {result}; DIVERSION WRITTEN: {divergenceId}
```

## 2) Identity kits

All kits are original civic callings, not licensed classes or species.

| Kit ID | Look, values, taboo, speech tell | Starter clothes / weapon | Start and first quest | Ability flag | Originality note |
|---|---|---|---|---|---|
| `shore_lantern` | Weathered oilskin, values mutual aid, taboo: extinguishing a ward-light, often says “Keep the next step visible.” | Blue oilskin, brass hand-lamp, `hook_knife` | `brinewatch`; `vw_brine_first_light` | `steady_lamp` | A practical watch volunteer, not a renamed occult detective. |
| `bellwright` | Layered wool and ear-caps, values truthful testimony, taboo: ringing a bell for amusement, repeats the last noun for emphasis. | Gray coat, signal bell, `iron_baton` | `bell_mere`; `vw_bell_first_toll` | `tone_memory` | A sound archivist with civic duties, not a wizard or exorcist. |
| `map_suture` | Ink-stained gloves, values repair and continuity, taboo: erasing an old route, says “There is a seam here.” | Patchwork vest, survey compass, `chalk_pick` | `seammarket`; `vw_seam_first_line` | `route_stitch` | A map conservator whose skill is evidence handling, not a franchise gadget. |
| `oath_warden` | Tall boots and rain cloak, values keeping promises under fear, taboo: abandoning a named witness, speaks in short vows. | Waxed cloak, ward-staff, `oak_staff` | `candlecourt`; `vw_oath_first_watch` | `hold_fast` | A civic protector grounded in steadfastness, not a licensed knight order. |

## 3) Map / places: full graph

The four starts converge on `gloamcross` and then `candlecourt`; the end-of-start capitals are `northglass` and `underquay`. No teleportation is available. Visited places show pins and full exits; outline places show silhouettes and only their parent route. Streets use pins, while interiors use floor-plan nodes. Instance doors are explicit places.

| id | Public name | zoneId | Scale / danger / outdoor | Exits | NPCs | Dungeon |
|---|---|---|---|---|---|---|
| `brinewatch` | Brinewatch | `brinewatch_zone` | street / safe / true | `brine_lantern`, `tidemark_steps`, `gloamcross` | `mara_vell`, `cairn_owe` | — |
| `brine_lantern` | Lantern Quay | `brinewatch_zone` | street / low / true | `brinewatch`, `saltless_pier` | `cairn_owe`, `sella_north` | — |
| `tidemark_steps` | Tidemark Steps | `brinewatch_zone` | street / low / true | `brinewatch`, `hush_arch` | `mara_vell`, `oren_sway` | — |
| `saltless_pier` | Saltless Pier | `brinewatch_zone` | street / low / true | `brine_lantern`, `hush_arch` | `sella_north` | — |
| `hush_arch` | Hush Arch | `brinewatch_zone` | dungeon / medium / false | `tidemark_steps`, `brinewatch_door` | `oren_sway` | `hush_arch_instance` |
| `brinewatch_door` | Underquay Door | `brinewatch_zone` | dungeon / medium / false | `hush_arch`, `gloamcross` | `mara_vell` | `hush_arch_instance` |
| `bell_mere` | Bellmere | `bellmere_zone` | street / safe / true | `bell_tower`, `reed_clock`, `gloamcross` | `toma_reed`, `vessa_quill` | — |
| `bell_tower` | Low Bell Tower | `bellmere_zone` | dungeon / low / false | `bell_mere`, `echo_yard` | `vessa_quill` | — |
| `reed_clock` | Reed Clock | `bellmere_zone` | street / low / true | `bell_mere`, `echo_yard` | `toma_reed`, `jory_fenn` | — |
| `echo_yard` | Echo Yard | `bellmere_zone` | street / low / true | `reed_clock`, `hush_arch` | `jory_fenn` | — |
| `candlecourt` | Candle Court | `bellmere_zone` | street / safe / true | `bell_mere`, `gloamcross`, `northglass`, `underquay` | `vessa_quill`, `mara_vell` | — |
| `seammarket` | Seammarket | `seammarket_zone` | street / safe / true | `ink_gate`, `threadwalk`, `gloamcross` | `pella_ink`, `rusk_line` | — |
| `ink_gate` | Ink Gate | `seammarket_zone` | street / low / true | `seammarket`, `folded_lane` | `pella_ink` | — |
| `threadwalk` | Threadwalk | `seammarket_zone` | street / low / true | `seammarket`, `folded_lane` | `rusk_line`, `nemi_bale` | — |
| `folded_lane` | Folded Lane | `seammarket_zone` | dungeon / medium / false | `threadwalk`, `gloamcross` | `nemi_bale` | `folded_lane_instance` |
| `paper_well` | Paper Well | `seammarket_zone` | street / low / true | `ink_gate`, `seammarket` | `pella_ink` | — |
| `gloamcross` | Gloamcross | `merge_zone` | street / safe / true | all four starts, `northglass`, `underquay`, `candlecourt` | `warden_ilo`, `rusk_line` | — |
| `northglass` | Northglass | `capital_north` | street / safe / true | `gloamcross`, `observatory_door`, `candlecourt` | `ilo_vesk`, `sella_north` | — |
| `underquay` | Underquay | `capital_south` | street / safe / true | `gloamcross`, `archive_door`, `candlecourt` | `mara_vell`, `cairn_owe` | — |
| `observatory_door` | Black Lens Observatory | `capital_north` | dungeon / medium / false | `northglass` | `ilo_vesk` | `black_lens_instance` |
| `archive_door` | Saltless Archive | `capital_south` | dungeon / medium / false | `underquay` | `cairn_owe` | `saltless_archive_instance` |
| `night_council_door` | Night Council Threshold | `capital_north` | dungeon / high / false | `northglass`, `underquay` | `ilo_vesk`, `mara_vell` | `night_council_instance` |

## 4) Durable NPCs and premade talk

The following six durable NPCs each serve multiple starting zones and retain state across travel.

| id | Name | Place | Role |
|---|---|---|---|
| `mara_vell` | Mara Vell | `brinewatch` | quest / hub |
| `cairn_owe` | Cairn Owe | `underquay` | merchant / quest |
| `toma_reed` | Toma Reed | `bell_mere` | profession / quest |
| `vessa_quill` | Vessa Quill | `candlecourt` | quest / merchant |
| `pella_ink` | Pella Ink | `seammarket` | profession / merchant |
| `ilo_vesk` | Ilo Vesk | `northglass` | quest / hub |

| NPC | Greet | Quest offer | Progress | Turn-in | Gossip (3 lines) | Refusal / rude |
|---|---|---|---|---|---|---|
| Mara Vell | “Lamp up, shoulders level. You made it.” | “Three quay bells rang without hands. Check the ropes, not the rumors.” | “You found a mark? Set it on the dry slate.” | “Good. The watch records what fear would blur.” | “Tide comes in crooked here.” / “Never trust a dry window.” / “I keep spare matches.” | “Not while you are shouting. Lower your voice or leave.” |
| Cairn Owe | “Underquay keeps receipts for the living.” | “Carry this sealed folio to Vessa; do not read a witness’s private line.” | “Seal unbroken?” | “Then your word has weight.” | “Ink fades before stone.” / “Some doors dislike names.” / “I sell thread, not miracles.” | “Rudeness is not evidence. Return when you can speak plainly.” |
| Toma Reed | “Hear that? The town is off-beat.” | “Mark four bell echoes and bring me their intervals.” | “The third echo came late?” | “A clean interval can save a frightened crowd.” | “Reed grows around old foundations.” / “Bells remember hands.” / “Silence is also a sound.” | “I will not tune a bell for someone who mocks the dead.” |
| Vessa Quill | “State your name and your reason.” | “Compare these two testimonies without choosing the easier story.” | “Your comparison has a contradiction.” | “Truth survives a careful margin.” | “Candles make honest shadows.” / “The Court hears pauses.” / “Never burn a note.” | “I decline to brief a bully. Try again without the performance.” |
| Pella Ink | “A map is a promise with edges.” | “Patch the Folded Lane route and return the unused chalk.” | “The seam holds?” | “Then the road can be trusted for one more night.” | “Paper remembers pressure.” / “A straight line can lie.” / “I dislike unearned certainty.” | “No sale while you threaten me. The door is behind you.” |
| Ilo Vesk | “Northglass sees farther, not better.” | “Bring five corroborated observations for the Council.” | “Five sources, one pattern?” | “Accepted. The watch can act without inventing.” | “The lens is not a prophecy.” / “Stars are bad witnesses.” / “Sleep when the lamps are blue.” | “I will not sign a claim made from insult.” |

### Canned hub lines: ten per zone

`brinewatch`: “Mind the wet stones.” / “Quay lamps are counted at dusk.” / “A quiet tide is not an empty tide.” / “Keep your boots tied.” / “The fishers share dry gloves.” / “No one walks the Arch alone.” / “Report a missing bell-rope.” / “The watch pays in stamped chits.” / “Look toward the harbor, then away.” / “Brinewatch holds if we hold together.”

`bellmere`: “The tower is closed after third bell.” / “Do not answer an echo.” / “Reed tea is on the common table.” / “The clock is slow by one breath.” / “Keep testimony in order.” / “A cracked bell can still warn.” / “Visitors sign the slate.” / “The yard is safe in daylight.” / “Listen before you point.” / “Bellmere remembers its children.”

`seammarket`: “Mind the wet ink.” / “Maps are not decorations.” / “Thread is sold by the arm.” / “Folded Lane is not a shortcut.” / “No tracing over another person’s mark.” / “Keep chalk capped.” / “The market closes at blue dusk.” / “Ask twice before crossing a seam.” / “Pella buys honest corrections.” / “Every route ends somewhere.”

`candlecourt`: “Candles are for seeing, not signaling.” / “The Court hears all petitions.” / “Keep the center aisle clear.” / “Witnesses receive warm tea.” / “Do not touch the brass scales.” / “Northglass sends reports at noon.” / “Underquay sends them at dusk.” / “The watch is not a priesthood.” / “Fear is allowed; cruelty is not.” / “Leave a light for the next case.”

## 5) Premade choices / first hour

Each kit opens with five authored beats: arrival, a sensory observation, a named witness, a stake, and a consequence. The player chooses whether to **protect a witness**, **preserve a clue**, or **keep a public promise**; the unchosen concern becomes a written divergence rather than disappearing. The HookArc flags are `identity_confirmed`, `first_choice`, and `observed_consequence`.

| POI | Choice buttons (requires; intent) |
|---|---|
| `brine_lantern` | “Trim the blue wick” (item `wick_cord`; repair), “Question Sella” (place visited; talk), “Copy the tide mark” (item `chalk_stub`; collect), “Escort a child home” (quest `vw_brine_first_light`; protect), “Secure the bell rope” (item `rope_hook`; interact), “Leave a watch token” (gold 2; promise). |
| `echo_yard` | “Count the late echoes” (quest `vw_bell_first_toll`; investigate), “Ask Toma for intervals” (npc; talk), “Close the yard gate” (place; safety), “Sketch the cracked post” (chalk; evidence), “Wait through one silence” (steadfast 2; observe), “Return before dusk” (place; retreat). |
| `folded_lane` | “Anchor the seam” (item `line_spool`; repair), “Follow the safe pin” (quest; navigate), “Read the old margin” (evidence 1; inspect), “Call Pella” (npc; talk), “Mark a false turn” (chalk; warn), “Withdraw to Threadwalk” (place; retreat). |
| `candlecourt` | “Present the witness” (npc; testify), “Present the object” (item; testify), “Ask for a recess” (steadfast 3; regulate), “Accept a public doubt” (quest; consequence), “Seal the record” (ink seal; commit), “Leave the Court” (place; walk-away). |

Tutorial forced path: choose kit; visit starting hub; talk to durable guide; collect first evidence; face a low-tier opponent; spend steadfast at a safe lantern; report to guide; choose one of three stakes; receive `watchglass_badge`; unlock the local quest DAG. It is skippable on alternate characters. Retry deck fingerprints: `missing_rope` (goal restore bell; tactic search; obstacle rain; revelation rope was moved; consequence public warning), `late_echo` (goal verify sound; tactic count; obstacle false interval; revelation echo follows footsteps; consequence route closes), `ink_bleed` (goal preserve note; tactic dry paper; obstacle damp air; revelation second handwriting; consequence evidence delayed), `witness_fear` (goal obtain testimony; tactic quiet room; obstacle shame; revelation witness remembers a color; consequence trust flag), `blue_window` (goal inspect window; tactic lantern angle; obstacle reflection; revelation outside is inside; consequence dread +1), `broken_pin` (goal map route; tactic rethread; obstacle missing landmark; revelation path loops; consequence route stitch), `empty_chair` (goal identify absentee; tactic ask neighbors; obstacle conflicting times; revelation chair is warm; consequence council summons), `three_knocks` (goal confirm visitor; tactic hold silence; obstacle mimicry; revelation knock is a signal; consequence checkpoint opens).

## 6) Quests: code-completeable DAGs

### Primary start: Brinewatch, 18 beats

| id | title | family | hidden | unlocks | objectives | rewardGold | rewardXp |
|---|---|---|---:|---|---|---:|---:|
| `vw_brine_first_light` | First Light on the Quay | identity | false | `vw_brine_witness` | `visit_place:brine_lantern`; `talk_to_npc:mara_vell` | 8 | 40 |
| `vw_brine_witness` | The Witness Under Canvas | identity | false | `vw_brine_rope` | `talk_to_npc:cairn_owe`; `collect_item:wet_testimony:1` | 10 | 45 |
| `vw_brine_rope` | Rope Without a Knot | identity | false | `vw_brine_blueglass` | `collect_item:bell_rope:1`; `visit_place:tidemark_steps` | 12 | 55 |
| `vw_brine_blueglass` | Blue Glass, Clear Name | identity | false | `vw_brine_return` | `collect_item:blue_shard:1`; `talk_to_npc:mara_vell` | 14 | 60 |
| `vw_brine_return` | Keep the Quay Promise | identity | false | `vw_brine_mara_trust` | `deliver_item:watch_token:mara_vell:1` | 16 | 70 |
| `vw_brine_mara_trust` | Mara’s Dry Ledger | hidden | true | `vw_brine_saltless` | `collect_item:dry_ledger:1`; `talk_to_npc:mara_vell` | 22 | 90 |
| `vw_brine_wick` | Wickwork in Rain | profession | false | `vw_brine_lantern_route` | `collect_item:wick_cord:3`; `deliver_item:wick_cord:mara_vell:3` | 12 | 50 |
| `vw_brine_lantern_route` | A Lamp for Every Door | profession | false | `vw_brine_oil_seal` | `visit_place:brine_lantern`; `collect_item:oil_seal:2` | 15 | 65 |
| `vw_brine_oil_seal` | Seal the Blue Flame | profession | false | `vw_brine_profession_end` | `deliver_item:oil_seal:cairn_owe:2`; `talk_to_npc:cairn_owe` | 18 | 75 |
| `vw_brine_profession_end` | The Watch Pays Its Wick | profession | false | `vw_brine_hush_arch` | `collect_item:brine_wick:1`; `deliver_item:brine_wick:mara_vell:1` | 25 | 100 |
| `vw_brine_tide_murmur` | Tidemark Murmur | zone_story | false | `vw_brine_window` | `visit_place:tidemark_steps`; `ledger_kill:shore_murmur:3` | 14 | 65 |
| `vw_brine_window` | The Window That Faces Inward | zone_story | false | `vw_brine_arch` | `collect_item:inward_glass:1`; `talk_to_npc:cairn_owe` | 18 | 80 |
| `vw_brine_arch` | Hush Arch Breadcrumb | zone_story | false | `vw_brine_hush_enter` | `visit_place:hush_arch`; `collect_item:arch_chalk:1` | 20 | 90 |
| `vw_brine_hush_enter` | Mark the Safe Door | dungeon_breadcrumb | false | `vw_brine_hush_boss` | `deliver_item:arch_chalk:mara_vell:1`; `visit_place:brinewatch_door` | 22 | 95 |
| `vw_brine_hush_boss` | Quiet Under the Quay | zone_story | false | `vw_brine_capital` | `ledger_kill:hinge_watcher:1`; `collect_item:quiet_key:1` | 35 | 150 |
| `vw_brine_capital` | Report to Gloamcross | campaign | false | `vw_campaign_lens` | `visit_place:gloamcross`; `talk_to_npc:warden_ilo` | 28 | 120 |
| `vw_brine_daily` | Count the Lamps | repeatable_daily | false | — | `collect_item:lamp_report:3`; `visit_place:brine_lantern` | 6 | 25 |
| `vw_brine_divergence` | What We Leave Unsaid | hidden | true | — | `talk_to_npc:mara_vell`; `deliver_item:sealed_absence:mara_vell:1` | 30 | 130 |

Additional starts have 18 authored beats each, using distinct local verbs and stakes.

**Bellmere:** `vw_bell_first_toll`, `vw_bell_echo_count`, `vw_bell_cord_truth`, `vw_bell_toma_oath`, `vw_bell_reed_rubbing`, `vw_bell_clock_repair`, `vw_bell_second_hand`, `vw_bell_tower_breadcrumb`, `vw_bell_low_tower`, `vw_bell_echo_yard`, `vw_bell_false_chime`, `vw_bell_missing_bell`, `vw_bell_witness_pair`, `vw_bell_court_report`, `vw_bell_capital`, `vw_bell_daily`, `vw_bell_trust`, `vw_bell_walkaway`; objective sets are respectively visit/talk, collect 4 echo marks, deliver cord, talk to Toma, collect 2 rubbings, deliver gear, visit clock, visit tower, ledger_kill `tone_moth` 2, visit yard, collect `false_chime`, talk to Vessa, talk to two NPCs, deliver `bell_record`, visit `candlecourt`, collect 3 reports, talk to Toma, deliver `unheard_name`. Rewards are 8/40, 10/45, 12/50, 15/65, 12/55, 18/75, 20/80, 22/90, 30/130, 16/70, 18/80, 20/85, 22/95, 25/105, 28/120, 6/25, 30/130, 24/100 gold/xp.

**Seammarket:** `vw_seam_first_line`, `vw_seam_chalk`, `vw_seam_pella`, `vw_seam_thread`, `vw_seam_map_margin`, `vw_seam_route_patch`, `vw_seam_ink_dry`, `vw_seam_paper_well`, `vw_seam_fold_enter`, `vw_seam_lane_breadcrumb`, `vw_seam_wrong_corner`, `vw_seam_stolen_route`, `vw_seam_nemi_testimony`, `vw_seam_gloam_report`, `vw_seam_capital`, `vw_seam_daily`, `vw_seam_hidden_stitch`, `vw_seam_walkaway`; objective sets are visit/talk, collect 3 chalk, talk, collect 2 thread, collect margin, deliver patch, collect blotter, visit well, visit Folded Lane, deliver route, ledger_kill `paper_hush` 2, collect `stolen_route`, talk to Nemi, deliver report, visit Gloamcross, collect 3 scraps, deliver `black_stitch`, talk to Pella. Rewards range from 8/40 to 32/135.

**Candlecourt:** `vw_oath_first_watch`, `vw_oath_name`, `vw_oath_witness`, `vw_oath_candle`, `vw_oath_margin`, `vw_oath_recess`, `vw_oath_scale`, `vw_oath_archive`, `vw_oath_door`, `vw_oath_record`, `vw_oath_false_verdict`, `vw_oath_blue_candle`, `vw_oath_two_courts`, `vw_oath_northglass`, `vw_oath_capital`, `vw_oath_daily`, `vw_oath_trust`, `vw_oath_walkaway`; objective sets are visit/talk, collect seal, talk to witness, collect 3 candles, deliver margin, visit Court, collect brass scale, visit archive, visit door, deliver record, ledger_kill `ink_lurker` 1, talk to Vessa, talk to two court NPCs, visit Northglass, talk to Ilo, collect 3 petitions, deliver `kept_oath`, deliver `unsigned_verdict`. Rewards range from 8/40 to 35/150.

### Campaign spine after starts

`vw_campaign_lens` (visit `northglass`), `vw_campaign_archive` (talk `cairn_owe`, collect `saltless_folio`), `vw_campaign_three_marks` (collect `mark_amber`, `mark_blue`, `mark_white`), `vw_campaign_witness_circle` (talk to Mara, Toma, Pella, Vessa), `vw_campaign_underquay` (visit `underquay`), `vw_campaign_observatory` (visit `observatory_door`), `vw_campaign_black_lens` (ledger_kill `lens_herald:1`), `vw_campaign_divide` (visit `gloamcross`), `vw_campaign_council` (talk to Ilo), `vw_campaign_night_entry` (visit `night_council_door`), `vw_campaign_phase_one` (collect 3 corroborated notes), `vw_campaign_phase_two` (ledger_kill `chorus_skein:2`), `vw_campaign_phase_three` (deliver `steadfast_seal`), `vw_campaign_verdict` (talk to Mara and Ilo), `vw_campaign_afterlight` (visit `candlecourt`). Rewards: 30/120, 32/130, 35/145, 40/160, 42/175, 48/200, 60/250, 55/230, 65/280, 70/300, 80/340, 100/420, 125/500, 150/600, 180/700.

Divergence records: `walkaway_witness` when the player leaves before hearing a witness; `walkaway_clue` when the player burns or abandons a clue; `walkaway_promise` when the player refuses the public stake. Each record stores `sourceQuestId`, `choiceId`, `timestampTick`, and `repairQuestId` and remains visible in the Journal.

## 7) Species / opponents / collectibles

Combat opponents are original manifestations of local anomalies, not famous public-domain monsters. Base values are ledger inputs.

| Region | Species (rarity; habitat; HP/ATK/AC) |
|---|---|
| Brinewatch | `shore_murmur` (common; quay; 24/5/11), `rope_nibbler` (common; pier; 20/4/10), `blue_sheen` (uncommon; wet glass; 32/7/12), `tide_crease` (uncommon; steps; 38/8/13), `hollow_gull` (rare; roofline; 45/10/14), `window_child` (rare; inward glass; 52/11/15), `hinge_watcher` (epic; Hush Arch; 110/16/17), `saltless_caller` (epic; Underquay; 130/18/18), `inkfin` (common; waterline; 22/5/10), `bell-eel` (uncommon; rope channel; 36/8/12), `drift-face` (rare; tide mark; 58/12/15), `rain_suture` (epic; storm seam; 145/20/19), `lamp leech` (common; lantern; 18/4/10), `quiet crab` (uncommon; pier; 30/6/12), `glasswake` (rare; harbor; 62/13/16), `underquay usher` (epic; door; 155/22/19). |
| Bellmere | `tone_moth` (common; tower; 20/5/10), `reed_clicker` (common; yard; 23/5/11), `late_echo` (uncommon; clock; 35/8/13), `bellseed` (uncommon; tower; 40/8/13), `throatless_singer` (rare; bell chamber; 60/12/15), `clockskin` (rare; clock; 70/13/16), `three-note judge` (epic; tower; 140/21/19), `echo bride` (epic; yard; 120/19/18), `brass hush` (common; court; 25/5/11), `reed shadow` (uncommon; reeds; 38/7/13), `minute wolf` (rare; clock; 65/14/16), `unheard bell` (epic; chamber; 160/23/20), `toll grub` (common; rope; 18/4/10), `chime crow` (uncommon; roof; 34/7/12), `interval knot` (rare; yard; 55/11/15), `tower listener` (epic; bell tower; 150/22/19). |
| Seammarket | `paper_hush` (common; lane; 21/5/10), `ink mite` (common; archive; 19/4/10), `folded runner` (uncommon; lane; 36/8/12), `map bruise` (uncommon; wall; 42/9/13), `margin pilgrim` (rare; well; 64/12/15), `route eater` (rare; Folded Lane; 72/14/16), `stitch basilisk` (epic; lane; 145/21/19), `blank cartographer` (epic; well; 135/20/18), `chalk wisp` (common; market; 20/4/10), `crease crab` (uncommon; paper; 34/7/12), `ink lurker` (rare; gate; 58/11/15), `black stitch` (epic; threshold; 155/23/20), `thread gnawer` (common; spool; 24/5/11), `wrong-corner` (uncommon; lane; 39/8/13), `vellum eye` (rare; well; 68/13/16), `seam monarch` (epic; Folded Lane; 170/24/20). |
| Candlecourt | `waxling` (common; court; 22/4/10), `petition wisp` (common; archive; 20/5/11), `brass scale` (uncommon; court; 40/8/13), `ink lurker` (uncommon; record room; 42/9/13), `candle mimic` (rare; court; 62/12/15), `verdict moth` (rare; archive; 70/13/16), `false juror` (epic; court; 150/22/19), `crownless judge` (epic; archive; 165/24/20), `blue taper` (common; chapel; 18/4/10), `ash petition` (uncommon; aisle; 36/7/12), `margin witness` (rare; court; 60/11/15), `sealed mouth` (epic; record room; 155/23/19), `brass ant` (common; scale; 25/5/11), `court draft` (uncommon; aisle; 38/8/13), `name thief` (rare; archive; 66/13/16), `candle sovereign` (epic; Court; 175/25/20). |

Collectibles include `blue_shard`, `wet_testimony`, `bell_rope`, `inward_glass`, `arch_chalk`, `dry_ledger`, `echo_mark`, `false_chime`, `route_margin`, `black_stitch`, `brass_scale`, and `steadfast_seal`; each has a unique collection-log entry with source place and evidence tag.

## 8) Loot / economy

Gold is earned from authored quests, capped daily reports, and personal loot. Cosmetic tokens are separate and never buy combat outcomes. Starter templates: `hook_knife` (weapon, 3 atk), `iron_baton` (4 atk), `chalk_pick` (3 atk), `oak_staff` (4 atk), `blue_oilskin` (armor, 2 ac), `bell_wool` (2 ac), `map_vest` (2 ac), `waxed_cloak` (3 ac), and `watchglass_badge` (cosmetic). Profession outputs are `brine_wick`, `echo_rubbing`, `route_patch`, and `court_seal`; dungeon drops are `quiet_key`, `hinge_plate`, `lens_shard`, and `night_council_seal`. Cosmetics include `rain-thread cloak`, `quay-lamp shoulder`, `bellmere hood`, `inkline gloves`, `candlecourt sash`, and `northglass pin`.

| Source | Drop table | Personal loot chance |
|---|---|---:|
| `shore_murmur` | `wet_testimony` 35%, `brine_scrap` 20%, cosmetic `blue_glint` 3% | 100% roll |
| `hinge_watcher` | `hinge_plate` 45%, `quiet_key` 20%, `underquay_sash` 8% | 100% roll |
| `tone_moth` | `echo_mark` 40%, `bell_dust` 25%, `tower_hood` 4% | 100% roll |
| `stitch_basilisk` | `route_patch` 45%, `black_stitch` 18%, `seamcloak` 8% | 100% roll |
| `false_juror` | `brass_scale` 40%, `court_seal` 22%, `candle_sash` 8% | 100% roll |
| Night Council rooms | `corroborated_note` 35%, `steadfast_seal` 18%, `nightglass coat` 6% | 100% roll |

Vendors sell supplies, not power packs. `cairn_owe` sells chalk 2g, wick cord 3g, dry paper 4g, rope hook 5g; `pella_ink` sells route thread 4g, ink 3g, map sleeve 8g; `vessa_quill` sells seal wax 3g, witness slate 6g, candle bundle 5g. Repair costs `1 gold per durability point`, capped at 30g per transaction. Faucets: quest rewards, daily reports capped at 5 per day, and instance completion. Sinks: supplies, repairs, travel permits, and cosmetic dyes. No player-to-player creature trade or power-pack economy exists in this world. Collection logs cover 16 species, 12 evidence items, 8 room seals, 6 cosmetics, and 4 profession outputs.

## 9) Instances

### Hush Arch: soloable 5-man/equivalent

| Room | Description before creature | Encounter | Checkpoint / exit |
|---|---|---|---|
| `hush_arch_r1` | A salt-wet arch frames a corridor where every footstep arrives one breath early. | `shore_murmur` x3 | exit `hush_arch_r2` |
| `hush_arch_r2` | A rope gallery hangs over black water; knots tighten when nobody touches them. | `rope_nibbler` x4 | checkpoint `hush_arch_cp`; exit `hush_arch_r3` |
| `hush_arch_r3` | A dry chamber contains a window facing the inside of the room. | `blue_sheen` x2, `window_child` x1 elite | exit `hush_arch_r4` |
| `hush_arch_r4` | The floor is tiled with names worn smooth by repeated crossing. | `tide_crease` x3 | exit `hush_arch_boss` |
| `hush_arch_boss` | The final room is a circular door with no wall, and the hinge is breathing in measured silence. | `hinge_watcher` x1 boss | exit `brinewatch_door`; drop `quiet_key` |

### Black Lens Observatory

Five players may enter; it is an equivalent big instance, not a raid. Phase 1 rooms gather three independent observations; Phase 2 rooms reconcile contradictions; Phase 3 is a council verdict against `lens_herald`. A wipe returns to `night_lens_checkpoint`. Rewards are evidence and cosmetics, never power-only purchases.

| Phase | Rooms and encounters |
|---|---|
| 1: Gather | `lens_stair` (before creature: wet stone stairs point upward and downward at once; `glasswake` x3), `starless_gallery` (portraits have no faces; `margin_witness` x2 elite), `blue_aperture` (a cold circle opens onto a familiar street; `aperture_hound` x1). |
| 2: Reconcile | `witness_table` (five chairs, four shadows; `false_juror` x2), `ink_sky` (ceiling drips written weather; `paper_hush` x6), `sealed_rotunda` (door remembers the wrong party; `name_thief` x2 elite). |
| 3: Verdict | `council_floor` (the floor displays every discarded route; `chorus_skein` x1 boss with `echo_thread` x4), `night_lens` (the lens asks for a committed civic choice; `lens_herald` x1 boss). |

## 10) Progression

No node is paid. Costs are gold or earned evidence, never premium currency.

| Node | Cost | Requires | Effect flag |
|---|---:|---|---|
| `steady_breath` | 20g | — | `steadfast_recovery_1` |
| `lamp_hand` | 25g | `steady_breath` | `safe_lantern_range_1` |
| `dry_note` | 30g | `lamp_hand` | `evidence_preserve_1` |
| `witness_care` | 35g | `dry_note` | `npc_trust_1` |
| `rope_reader` | 40g | `witness_care` | `hazard_warning_1` |
| `quiet_step` | 45g | `rope_reader` | `dread_gain_minus_1` |
| `shared_vigil` | 55g | `quiet_step` | `party_steadfast_link` |
| `margin_sense` | 60g | `dry_note` | `hidden_clue_outline` |
| `route_suture` | 70g | `margin_sense` | `map_repair_1` |
| `candle_argument` | 80g | `witness_care` | `dialogue_choice_1` |
| `council_voice` | 95g | `candle_argument` | `verdict_weight_1` |
| `blue_lens` | 110g | `route_suture`, `council_voice` | `night_instance_access` |
| `hold_fast` | 125g | `shared_vigil` | `steadfast_floor_2` |
| `last_light` | 150g | `blue_lens`, `hold_fast` | `case_resist_1` |

Daily/weekly contracts are capped: `vw_contract_lamps` collect 3 lamp reports, `vw_contract_testimony` corroborate 2 witness notes, `vw_contract_route` repair 1 route patch, `vw_contract_quiet` clear Hush Arch once daily, and `vw_contract_council` complete Night Council once weekly. Each contract has a fixed gold/xp reward and cannot be repeated beyond its cap.

## 11) Theme Kit + copy

`watchglass_midnight` uses smoked blue, candle amber, wet slate, faded parchment, and restrained red only for committed danger. Materials are oiled paper, tarnished brass, river glass, and waxed thread. Dice look like translucent watchglass with trapped bubbles. Voice is intimate, patient, low-volume, and precise; fear comes from implication and civic responsibility rather than gore. Ambient loop: distant rain, one buoy bell, cloth movement, and a three-note tone that never resolves. Fashion is practical rainwear, patched cloaks, survey gloves, bell cords, and enamel watch pins. System/chrome name: **Watchglass**.

UI labels: `Inventory → Kit Bag`; `Journal → Casebook`; `Map → Route Slate`; `Quest Log → Open Cases`; `Party Finder → Watch Roster`; `Character → Watch Record`; `Skills → Steadfast Practices`; `Loot → Personal Findings`; `Crafting → Benchwork`; `Vendor → Quarter Desk`; `Repair → Mend Gear`; `Dailies → Lamp Rounds`; `Weekly → Council Brief`; `Instance Door → Threshold`; `Checkpoint → Safe Mark`; `Evidence → Corroboration`; `Dread → Unease`; `Settings → Watchglass`; `Exit → Return to Light`; `Collection → Cabinet of Findings`.

New Game hook cards: “A bell rings from a pier that was removed last winter.” “Your map contains a street nobody remembers building.” “A witness gives you your own name, then apologizes.” “The rain falls upward for seven seconds.” “A sealed archive has a receipt signed tomorrow.” “You promised to keep one lamp lit until dawn.” “A room in the Court has one chair too many.” “The harbor’s reflections are facing the wrong way.” “A child draws the same door in every town.” “The watch needs someone who can be afraid without becoming careless.”

## 12) Failures + John’s calls

| Clone-risk call | Avoidance decision |
|---|---|
| It could feel like a famous tentacle-cult investigation. | No tentacle cult, mythos terminology, famous relic, or inherited cosmic pantheon; threats are local anomalies with civic evidence rules. |
| It could become a monster encyclopedia. | Opponents are symptoms of places and testimony; the main loop is corroboration, repair, and steadfast choices. |
| It could use shock gore as atmosphere. | Teen-plus tension uses sound, weather, memory gaps, and impossible architecture; graphic spectacle is excluded. |
| It could make prose override outcomes. | Watchglass ledger owns every result; prose cannot invent damage, loot, evidence, or clearance. |
| It could become a save-the-world prophecy in the first hour. | Starts contain local bell, route, witness, and archive problems; the Night Council campaign emerges only after four converging reports. |

Open decisions are not blocking. **Speculative default:** the Night Council ending is a civic containment verdict with three recorded variants—seal, reroute, or witness—rather than a single canonical metaphysical explanation. The pack deliberately leaves the ultimate origin of the anomalies ambiguous while making every playable objective concrete.

## Integrity checklist

1. `worldId` is stable snake_case: `veil_watch`.
2. Display name uses the locked title Veil Watch.
3. The world is marked teen-plus.
4. Rules module is `steadfast`.
5. Theme Kit is named and complete.
6. Genre fence is explicit.
7. Ban-list exceeds 40 genre-specific lookalikes.
8. No dump-error title is used as canon.
9. No forbidden franchise name is used as a world element.
10. No Compact race, faction, or place is reused.
11. Four starting zones are present.
12. Each start has a non-capital hub.
13. Gloamcross is the mid-world join.
14. Northglass and Underquay are the two capitals.
15. Travel has no teleport shortcut.
16. Fog distinguishes visited pins from outlines.
17. Six durable NPCs have stable IDs.
18. Quest-giver and merchant talk trees include all required canned states.
19. Ten hub lines exist per zone.
20. Opening choices include a stake and consequence flags.
21. Primary start contains 18 authored beats.
22. Other starts contain 18 authored beats each.
23. Objectives are code-owned types with IDs and counts.
24. Rewards are numeric gold and XP.
25. Campaign spine has 15 beats.
26. Divergences write explicit records.
27. Species have rarity, habitat, HP, attack, and AC.
28. No Saltkin-named creature exists.
29. Loot is personal and tables are populated.
30. Gold and cosmetic tokens remain separate.
31. Vendor catalogs and repair costs are present.
32. Daily and weekly caps are stated.
33. Hush Arch has five rooms.
34. Hush Arch describes rooms before creatures.
35. Hush Arch has trash, elite, checkpoint, and boss.
36. Black Lens Observatory is the five-player equivalent big instance.
37. Progression has 14 non-premium nodes.
38. Contracts are capped.
39. UI labels and ten opening hooks are present.
40. Clone-risk calls and speculative default are explicit.
41. No production application code is included.
42. No live service, save, prompt, or database reference is included.

_No external factual sources are used; this is wholly original fictional content._
