# WOF World Pack: Hollow Term

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `hollow_term` |
| Display name | Hollow Term |
| One-line pitch | A private-co-op magic academy where apprentices solve local arcane failures before their unfinished spells become permanent scars in the school. |
| Maturity | `teen` |
| `rulesModuleId` | `hp_check_bond_heart` |
| Theme Kit | `inkglass_apprentice` |
| Genre pattern and fence | Original magic-school mystery with practical spellcraft, rival study circles, and consequence-led campus exploration; **this is not a wizard-franchise school, a chosen-one retelling, or a licensed spellbook setting.** |

### Genre-specific ban-list

The following are forbidden lookalikes for this pack: Hogwarts, Gryffindor, Slytherin, Ravenclaw, Hufflepuff, Harry Potter, Hermione Granger, Ron Weasley, Albus Dumbledore, Severus Snape, Voldemort, Death Eater, Muggle, Quidditch, Diagon Alley, Platform Nine and Three-Quarters, Azkaban, Horcrux, Hogwarts Express, Fantastic Beasts, Newt Scamander, Marauder’s Map, Patronus, Parseltongue, Chamber of Secrets, Philosopher’s Stone, Elder Wand, Ministry of Magic, Triwizard Tournament, Durmstrang, Beauxbatons, Earthsea, Ged, Roke, Narnia, Discworld, Black Clover, Jujutsu Kaisen, Mahoutokoro, Brakebills, The Magicians, The Worst Witch, Charmed, Sabrina, The Owl House, Little Witch Academia, Magica De Spell, and any direct imitation of their houses, mascots, signature artifacts, school architecture, or plot beats.

All names, cultures, maps, creatures, artifacts, slogans, and plot beats below are original. The world is quarantined content and contains no live-service assumptions.

## 1) Rules module: `hp_check_bond_heart`

Code resolves the authoritative state. Prose can describe sensation, color, weather, and emotional framing only after state is committed.

| Ledger field | Meaning | Code-owned operation |
|---|---|---|
| `hp` / `max_hp` | Apprentice vitality | Damage, healing, defeat, checkpoint restore |
| `bond_heart` | Trust between apprentice and focus companion | Bond gains, bond checks, companion assist flags |
| `attunement` | Current school of magic | Unlocks legal spell tags; never grants unearned damage |
| `spell_slots` | Prepared spell capacity | Spend and refresh at rest points |
| `ward_charge` | Temporary protective reserve | Absorbs one coded ward event |
| `heat` | Faculty suspicion from rule-breaking | Contract access and patrol pressure |
| `reputation` | Standing with campus circles | Dialogue and shop permissions |
| `quest_flags` | Visible and hidden progression | Unlocks and divergence records |

A wipe restores the party to the latest ward checkpoint, removes temporary room buffs, preserves earned items and journal truth, and applies a 10-minute instance fatigue timer. A checkpoint is written only after the ledger confirms room completion. Boss instances have a weekly per-character lockout; solo practice rooms have no lockout. Personal loot is rolled independently. Party size is 1–5.

Prose is forbidden to invent damage numbers, loot ownership, spell success, companion bonding, boss defeat, room completion, or exam results. Dialogue must not claim an objective is complete until the ledger says so.

### Diegetic chrome templates

```text
[INKGLASS // FIELD NOTE]
Place: {place_name} | Ward: {ward_charge}/{ward_max} | Heat: {heat}
Known paths: {visited_exits} | Uncharted edges remain outlined.
```

```text
[BOND-HEART // ATTUNEMENT]
Focus: {companion_name} | Trust: {bond_heart}/{bond_cap}
Assist available: {ability_flag} | Next honest step: {objective_text}
```

```text
[LECTORIUM // SPELL LEDGER]
Prepared: {spell_count}/{spell_slots} | School tags: {attunement_tags}
The ledger records outcomes; narration follows the record.
```

```text
[WARD BELL // INSTANCE]
Room: {room_id} | Checkpoint: {checkpoint_state} | Exit seal: {exit_state}
Defeat returns the party to the last confirmed ward.
```

```text
[QUIET NOTICE // HEAT]
Faculty notice: {heat} | Cause: {heat_reason}
Available response: {grounded_choice_label}
```

## 2) Identity kits

| Kit ID | Look and values | Taboo and speech tell | Starter clothes / weapon | Start and first-hour quest | Ability flag | Originality note |
|---|---|---|---|---|---|---|
| `vellum_hearth` | Ink-stained human apprentices who prize careful records and mutual aid | Never erase another student’s name; says “write it twice” | Slate-blue coat, chalk knife | `vellum_first_margin` at `copperbell_yard` | `scribe_seal` | A record-keeping culture, not a renamed franchise house |
| `morrowkin` | Pale-eyed marsh people who read mood through reflected light and value reciprocity | Never accept a gift without naming its cost; uses “what returns?” | Reed-fiber mantle, prism rod | `morrow_reflection` at `mirrorfen_walk` | `glint_reading` | An original people defined by reflective wetlands |
| `cairnfolk` | Broad-shouldered stone-country youths who prize promises and useful labor | Never step over a threshold without greeting it; speaks in short proverbs | Felt vest, ironwood cudgel | `cairn_threshold` at `stair_of_chalk` | `threshold_knock` | An original threshold tradition, not a dwarven analogue |
| `sablewing` | Night-feathered cliff dwellers who value curiosity and nonviolent daring | Never burn a message; ends questions with “and then?” | Black sailcloth tunic, hooked staff | `sable_first_flight` at `lantern_roost` | `echo_glide` | An original gliding culture, not an imitation of a known magical race |

## 3) Map / places

The school is **Orison Collegium**, built around a dry circular well called the Hollow. Four starts converge on the mid-world study hub, `common_quadrangle`, then open to two end-of-start capitals: `rectors_ring` and `archive_court`. The travel graph is physical: each start connects to `common_quadrangle`; `common_quadrangle` connects to both capitals. There is no teleport.

| ID | Public name | Zone | Scale | Danger | Outdoor | Exits | NPCs | Dungeon |
|---|---|---|---|---|---|---|---|---|
| `copperbell_yard` | Copperbell Yard | `vellum_quarter` | street | safe | true | `vellum_stacks`, `common_quadrangle` | `maelin_quill`, `pella_wick` | — |
| `vellum_stacks` | Vellum Stacks | `vellum_quarter` | street | low | false | `copperbell_yard`, `sealed_scriptorium` | `maelin_quill`, `orris_dane` | `scriptorium_breach` |
| `chalk_lane` | Chalk Lane | `vellum_quarter` | street | low | true | `copperbell_yard`, `common_quadrangle` | `pella_wick`, `juniper_ash` | — |
| `mirrorfen_walk` | Mirrorfen Walk | `refraction_marsh` | street | safe | true | `fen_landing`, `common_quadrangle` | `sava_mere`, `tovin_lark` | — |
| `fen_landing` | Fen Landing | `refraction_marsh` | street | low | true | `mirrorfen_walk`, `glimmer_drain` | `sava_mere`, `tovin_lark` | — |
| `glimmer_drain` | Glimmer Drain | `refraction_marsh` | dungeon | medium | false | `fen_landing`, `common_quadrangle` | `sava_mere` | `drain_of_second_moons` |
| `stair_of_chalk` | Stair of Chalk | `cairn_terrace` | street | safe | true | `kiln_step`, `common_quadrangle` | `brock_vell`, `runa_stead` | — |
| `kiln_step` | Kiln Step | `cairn_terrace` | street | low | true | `stair_of_chalk`, `underchalk_gallery` | `runa_stead` | `underchalk_gallery` |
| `underchalk_gallery` | Underchalk Gallery | `cairn_terrace` | dungeon | medium | false | `kiln_step`, `common_quadrangle` | `brock_vell` | `underchalk_gallery` |
| `lantern_roost` | Lantern Roost | `nocturne_cliffs` | street | safe | true | `featherbridge`, `common_quadrangle` | `vesper_noll`, `kett_sun` | — |
| `featherbridge` | Featherbridge | `nocturne_cliffs` | street | low | true | `lantern_roost`, `echo_belfry` | `kett_sun` | — |
| `echo_belfry` | Echo Belfry | `nocturne_cliffs` | dungeon | medium | false | `featherbridge`, `common_quadrangle` | `vesper_noll` | `echo_belfry` |
| `common_quadrangle` | Common Quadrangle | `mid_world` | street | safe | true | all four starts, `rectors_ring`, `archive_court` | `dean_avor`, `mira_coil` | — |
| `rectors_ring` | Rector’s Ring | `capital_east` | street | safe | true | `common_quadrangle`, `licensed_atrium`, `grand_vault` | `rector_helian`, `master_ost` | — |
| `archive_court` | Archive Court | `capital_west` | street | safe | true | `common_quadrangle`, `quiet_archive`, `hollow_well` | `curator_neme`, `warden_lyss` | — |
| `licensed_atrium` | Licensed Atrium | `capital_east` | street | low | false | `rectors_ring`, `practical_exam_hall` | `master_ost` | `atrium_practical` |
| `grand_vault` | Grand Vault | `capital_east` | dungeon | medium | false | `rectors_ring`, `hollow_well` | `rector_helian` | `grand_vault` |
| `quiet_archive` | Quiet Archive | `capital_west` | street | low | false | `archive_court`, `hollow_well` | `curator_neme` | — |
| `hollow_well` | The Hollow Well | `capital_west` | dungeon | medium | false | `archive_court`, `rectors_ring` | `warden_lyss` | `hollow_well` |

Map presentation uses visited geometry plus outline-only undiscovered edges. Street maps display pins; indoor areas use floor plans, never kilometer-scale overlays inside a room. Instance doors are ordinary place records and cannot be entered until their quest or level gate is true.

## 4) Durable NPCs and premade talk

The following six are durable across starts; each has a fixed place, role, and canned tree. Local tutors `pella_wick`, `sava_mere`, `brock_vell`, and `vesper_noll` are additional zone anchors.

| ID | Name | Place | Role |
|---|---|---|---|
| `maelin_quill` | Maelin Quill | `copperbell_yard` | quest |
| `dean_avor` | Dean Avor Pell | `common_quadrangle` | hub |
| `mira_coil` | Mira Coil | `common_quadrangle` | merchant |
| `rector_helian` | Rector Helian Voss | `rectors_ring` | quest |
| `curator_neme` | Curator Neme Orr | `archive_court` | quest |
| `warden_lyss` | Warden Lyss | `hollow_well` | local |

For each NPC, the following compact tree is authoritative and is repeated by the dialogue service exactly as written.

### Maelin Quill

| Node | Text |
|---|---|
| greet | “Ink on your cuff, apprentice. Good. It means the page answered.” |
| quest_offer | “Three margins are moving in the Stacks. Bring me the names they erase.” |
| quest_progress | “You found a living annotation. Keep it flat and keep your hand steady.” |
| quest_turnin | “The names are restored. Take 18 gold and 90 experience; the ledger has witnessed your care.” |
| gossip | “The Hollow is older than the school.” / “Never trust a clean page.” / “A bell can remember a voice.” |
| refusal / rude | “I will not reward shouting. Return when your question is shaped.” |

### Dean Avor Pell

| Node | Text |
|---|---|
| greet | “Welcome to the Quadrangle. No duel begins here without two witnesses.” |
| quest_offer | “Choose one local fault. Repair it before you chase grand theories.” |
| quest_progress | “Your report has a consequence attached. Read it before signing.” |
| quest_turnin | “The campus is steadier. Take 24 gold and 120 experience.” |
| gossip | “The west archive dislikes moonlight.” / “Rector Voss counts promises.” / “The Hollow answers different students differently.” |
| refusal / rude | “I can listen to anger; I cannot file it as evidence.” |

### Mira Coil

| Node | Text |
|---|---|
| greet | “Coins on the left, keepsakes on the right. I sell neither courage nor certainty.” |
| quest_offer | “Deliver these brass tags to the four tutors and return with their stamped condition.” |
| quest_progress | “A missing stamp is not a missing truth. Ask who was absent.” |
| quest_turnin | “The catalog is balanced. Take 12 gold and one `brass_focus_ring`.” |
| gossip | “Copper remembers fingerprints.” / “The best wand is the one you maintain.” / “I close at second bell.” |
| refusal / rude | “No sale while you insult the shop. Try the door, then try manners.” |

### Rector Helian Voss

| Node | Text |
|---|---|
| greet | “You have reached the Ring. Here, every spell must name its cost.” |
| quest_offer | “Enter the Atrium Practical and stabilize one failing ward without breaking another.” |
| quest_progress | “A clean result is less valuable than an honest one.” |
| quest_turnin | “Your license is provisional. Take 40 gold and 210 experience.” |
| gossip | “The school’s founders disagreed about silence.” / “The vault is not a treasury.” / “I prefer apprentices who return.” |
| refusal / rude | “You are not ready for the Vault while you treat consequence as scenery.” |

### Curator Neme Orr

| Node | Text |
|---|---|
| greet | “The Archive has no forbidden questions, only careless hands.” |
| quest_offer | “Find the missing shelf-mark in the Quiet Archive and speak its title aloud.” |
| quest_progress | “The title changed when you touched it. Record both versions.” |
| quest_turnin | “The shelf has accepted its place. Take 35 gold and 180 experience.” |
| gossip | “Some books are doors with very patient hinges.” / “A relic is a promise wearing metal.” / “Do not read while hungry.” |
| refusal / rude | “No archive privilege for a visitor who cannot leave a room intact.” |

### Warden Lyss

| Node | Text |
|---|---|
| greet | “Stop at the white line. The Hollow is listening.” |
| quest_offer | “Carry a ward-lantern to the Well and return before its third flicker.” |
| quest_progress | “The lantern is dimmer, but you are still here. That matters.” |
| quest_turnin | “The Well has been measured. Take 28 gold and 150 experience.” |
| gossip | “The lowest stone is warm.” / “The school has a shadow that is not a person.” / “Do not answer a voice from below.” |
| refusal / rude | “Back behind the line. Defiance is not bravery without a plan.” |

### Zone say/emote lines

Each zone has these ten non-chat ambient lines: “The first bell trembles.” “A chalk mark fades and returns.” “Your focus warms.” “Someone closes a book.” “A ward hums underfoot.” “The campus wind changes direction.” “A distant tutor calls attendance.” “Loose paper turns toward the Hollow.” “A familiar path feels shorter.” “The next safe place is marked.” Strangers cannot inject freeform dialogue into the narrator; nearby presence shows only `nearbyPlayerCount` and kit silhouettes.

## 5) Premade choices / first hour

Every opening deck contains four to six authored beats: choose a focus material; state who vouched for the apprentice; demonstrate a harmless cantrip; discover a local fault; decide whether to report it or investigate privately; accept a stake. The stake is explicit: reporting raises trust but adds `faculty_notice`; private investigation avoids notice but sets `unfiled_risk` and can close one shop discount.

| Kit | Opening beats | First quest |
|---|---|---|
| `vellum_hearth` | Copy a torn name, refuse to erase it, test `scribe_seal`, hear the Stacks whisper, choose report/private | `vellum_first_margin` |
| `morrowkin` | Read a puddle’s reflected light, identify a false reflection, test `glint_reading`, choose return/keep a found charm | `morrow_reflection` |
| `cairnfolk` | Greet the threshold, test `threshold_knock`, find a cracked stair, choose brace it/report it | `cairn_threshold` |
| `sablewing` | Glide across the bell court, catch a falling note, test `echo_glide`, choose rescue/record the sound | `sable_first_flight` |

HookArc flags are `identity_confirmed`, `first_choice`, and `observed_consequence`. Grounded choice buttons include `read_the_margin` (requires `vellum_stacks`, inspect), `ask_maelin` (requires `copperbell_yard`, talk), `seal_the_crack` (requires `chalk_powder`, craft), `carry_the_lantern` (requires `ward_lantern`, deliver), `enter_the_breach` (requires `scriptorium_breach_unlocked`, instance), and `leave_a_clean_report` (requires `quest_flags:local_fault_seen`, record). Combat buttons are `steady_guard`, `focus_strike`, and `break_line`; dialogue buttons are `ask_cost`, `offer_evidence`, and `admit_uncertainty`.

Tutorial forced path, skippable on alternate characters: `arrive_at_start`, `confirm_identity`, `receive_focus`, `inspect_local_fault`, `choose_report_or_private`, `resolve_first_minor_encounter`, `write_consequence`, `unlock_common_quadrangle`.

Retry deck fingerprints:

| Fingerprint | Goal | Tactic | Obstacle | Revelation | Consequence |
|---|---|---|---|---|---|
| `margin_retry` | restore a name | flatten page | ink bites | page is afraid | hand stain |
| `lantern_retry` | keep ward lit | shield flame | wind reverses | bell is calling | heat +1 |
| `stair_retry` | brace crack | wedge chalkstone | floor shifts | crack follows sound | route closes briefly |
| `reflection_retry` | identify false image | turn prism | water lies | charm is bait | bond -1 |
| `bell_retry` | catch note | echo cup | note splits | one tone is missing | clue delayed |
| `vault_retry` | read seal | offer cost | seal asks memory | relic tracks intent | ward charge spent |
| `companion_retry` | calm focus | name fear | focus mirrors fear | trust needs honesty | bond check required |
| `report_retry` | preserve trust | file evidence | tutor disagrees | two truths coexist | divergence record |

## 6) Quests: code-completeable DAGs

### Primary start: Vellum Quarter, 18-beat DAG

| ID | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `vellum_first_margin` | The First Margin | identity | false | `ink_on_fingers` | `visit_place: vellum_stacks`; `talk_to_npc: maelin_quill` | 8 | 40 |
| `ink_on_fingers` | Ink That Remembers | identity | false | `name_the_missing` | `collect_item: memory_ink x3` | 10 | 55 |
| `name_the_missing` | Name the Missing | identity | false | `report_or_hide` | `talk_to_npc: maelin_quill`; `deliver_item: margin_names` | 12 | 70 |
| `report_or_hide` | Two Kinds of Honesty | identity | false | `chalk_route` | `talk_to_npc: dean_avor` | 14 | 80 |
| `chalk_route` | The Chalk Route | profession | false | `mixing_slate` | `collect_item: chalkroot x4`; `deliver_item: chalk_bundle` | 9 | 45 |
| `mixing_slate` | A Measured Powder | profession | false | `bell_mender` | `collect_item: chalk_powder x2`; `talk_to_npc: pella_wick` | 13 | 65 |
| `bell_mender` | Mend the Small Bell | profession | false | `quiet_footing` | `deliver_item: copper_bell_wire`; `visit_place: copperbell_yard` | 16 | 85 |
| `quiet_footing` | Quiet Footing | profession | false | `stacks_breach` | `collect_item: hush_thread x3` | 18 | 95 |
| `stacks_breach` | The Scriptorium Breach | zone_story | false | `margin_guardian` | `visit_place: sealed_scriptorium`; `ledger_kill: paper_wight x4` | 22 | 120 |
| `margin_guardian` | The Margin Guardian | zone_story | false | `maelin_truth` | `ledger_kill: redaction_hound x1` | 26 | 140 |
| `maelin_truth` | What the Page Saw | zone_story | false | `quadrangle_pass` | `talk_to_npc: maelin_quill`; `collect_item: witness_scrap x2` | 20 | 110 |
| `quadrangle_pass` | A Pass to the Middle | zone_story | false | `four_faults` | `deliver_item: quadrangle_pass`; `visit_place: common_quadrangle` | 25 | 130 |
| `four_faults` | Four Faults, One Bell | extra | false | `ward_checkpoint` | `talk_to_npc: dean_avor`; `collect_item: tutor_stamp x4` | 30 | 160 |
| `ward_checkpoint` | Write the Ward | dungeon | false | `hollow_whisper` | `visit_place: scriptorium_breach`; `collect_item: ward_chalk x1` | 28 | 150 |
| `hollow_whisper` | The Whisper Beneath | hidden | true | `trust_the_quiet` | `visit_place: hollow_well`; `talk_to_npc: warden_lyss` | 32 | 175 |
| `trust_the_quiet` | A Companion’s Cost | hidden | true | `capital_license` | `bond_heart_check: 3` | 35 | 190 |
| `capital_license` | Provisional License | campaign | false | `grand_vault_contract` | `talk_to_npc: rector_helian`; `visit_place: rectors_ring` | 40 | 210 |
| `grand_vault_contract` | The First Deep Lesson | campaign | false | — | `visit_place: grand_vault`; `ledger_kill: vault_inkling x1` | 55 | 280 |

The other starts each contain 18 beats with distinct local verbs and stakes: `mirrorfen_opening`, `mirrorfen_refraction`, `mirrorfen_return`, `fen_pact`, `reed_lantern`, `tideglass_mix`, `drain_breach`, `false_moon`, `sava_test`, `reflection_debt`, `common_water`, `quadrangle_passage`, `four_tutor_marks`, `drain_checkpoint`, `morrow_hidden_oath`, `bonded_truth`, `fen_license`, `first_sluice_lesson`; `cairn_opening`, `cairn_threshold`, `cairn_brace`, `stone_oath`, `kiln_gathering`, `ironchalk_mix`, `gallery_breach`, `loose_keystone`, `brock_test`, `promise_weight`, `terrace_route`, `stair_passage`, `four_tutor_marks_cairn`, `gallery_checkpoint`, `cairn_hidden_oath`, `bonded_measure`, `terrace_license`, `first_gallery_lesson`; and `roost_opening`, `roost_echo`, `roost_catch`, `bell_oath`, `feather_route`, `nightthread_mix`, `belfry_breach`, `missing_note`, `vesper_test`, `echo_debt`, `cliff_route`, `roost_passage`, `four_tutor_marks_roost`, `belfry_checkpoint`, `roost_hidden_oath`, `bonded_listening`, `cliff_license`, `first_belfry_lesson`. Each is code-completeable using the objective verbs above, with rewards from 8–55 gold and 40–280 XP; no objective is prose-only.

Campaign spine after all starts: `quadrangle_convergence` (visit `common_quadrangle`), `four_faults_one_bell` (collect four stamps), `choose_capital_path` (talk to `dean_avor`), `ring_license` (visit `rectors_ring`), `archive_license` (visit `archive_court`), `vault_or_well` (visit one instance door), `cost_of_mastery` (bond check 5), `faculty_debate` (talk to `rector_helian`), `hollow_measure` (collect `well_measure`), `sealed_curriculum` (deliver `sealed_curriculum`), `first_deep_lesson` (ledger_kill `vault_inkling`), and `term_end_report` (deliver `term_report`). Rewards are respectively 30/150, 35/170, 20/90, 45/220, 45/220, 50/250, 55/280, 60/300, 65/320, 70/350, 75/380, and 90/450.

Divergence records are written for three walk-aways: `walkaway_private_investigation` records a private search instead of a faculty report; `walkaway_companion_release` records releasing a frightened focus companion, closing one assist flag but opening a reconciliation quest; `walkaway_capital_refusal` records declining the provisional license, preserving low heat and delaying the vault route. The journal names each record and its consequence.

## 7) Species, opponents, and collectibles

Combat skins are original campus manifestations, not player races. Each start region uses the same 16-entry regional catalog with habitat tags and distinct encounter weights; this keeps balance data stable while presenting local appearances.

| ID | Rarity | Habitat | Base HP | ATK | AC | Region expression |
|---|---|---|---:|---:|---:|---|
| `paper_wight` | common | stacks | 18 | 4 | 10 | folded attendance slips |
| `chalk_mite` | common | chalk_lane | 12 | 3 | 11 | powder-eating specks |
| `bell_moth` | common | bell_court | 16 | 4 | 10 | wingbeats ring softly |
| `ink_crawler` | common | wet_margin | 20 | 5 | 11 | leaves black footprints |
| `hushling` | common | quiet_rooms | 14 | 3 | 12 | steals one sound |
| `glint_eel` | uncommon | mirrorfen | 28 | 7 | 12 | swims through reflections |
| `stairling` | uncommon | underchalk | 30 | 6 | 13 | rearranges steps |
| `echo_tern` | uncommon | belfry | 24 | 8 | 11 | repeats the last spell |
| `redaction_hound` | uncommon | sealed_text | 42 | 9 | 13 | bites written plans |
| `ward_snail` | uncommon | old_seals | 36 | 5 | 15 | carries a slow shield |
| `margin_owl` | rare | archive | 55 | 12 | 14 | predicts a movement |
| `mirror_carp` | rare | fen_drain | 60 | 10 | 15 | reflects a decoy |
| `cairn_murmur` | rare | terrace | 68 | 11 | 16 | speaks from stone |
| `belfry_lark` | rare | high_roost | 52 | 14 | 14 | sonic dive |
| `vault_inkling` | epic | deep_vault | 120 | 18 | 17 | writes temporary walls |
| `hollow_administrator` | epic | hollow_well | 180 | 20 | 18 | an original faculty-shaped ward |

Collectibles include `memory_ink`, `chalkroot`, `hush_thread`, `copper_bell_wire`, `witness_scrap`, `glint_scale`, `keystone_shard`, `echo_feather`, `well_measure`, and `sealed_curriculum`. No creature is named after a playable people.

## 8) Loot and economy

Gold is earned through quests, contracts, and personal loot; cosmetic tokens are a separate wallet used only for appearance items. Premium purchases never buy spell power, bond success, exam outcomes, or random power packs.

| Template ID | Kind | Source | Effect |
|---|---|---|---|
| `slate_focus` | starter weapon | kit grant | coded starter focus, power tier 1 |
| `wardcloth_coat` | starter armor | kit grant | coded defense tier 1 |
| `campus_map_leaf` | starter map | kit grant | reveals start-zone pins |
| `brass_focus_ring` | utility | Mira Coil | cosmetic glow, no power |
| `memory_ink_vial` | profession output | ink bench | quest delivery material |
| `hush_thread_spool` | profession output | quiet loom | ward recipe material |
| `margin_guardian_seal` | dungeon drop | `scriptorium_breach` | cosmetic seal trail |
| `wellglass_mask` | boss cosmetic | `hollow_well` | face cosmetic |
| `rector_blue_trim` | cosmetic | capital vendor | coat trim |
| `bellcourt_emote` | cosmetic | token shop | scripted emote |

Personal drop examples: paper wights 20% `memory_ink_vial`; redaction hounds 15% `margin_guardian_seal`; vault inklings 25% `wellglass_fragment`; administrators 100% one of three cosmetic bundles. Vendor lists: Mira Coil sells `chalk_powder` for 3 gold, `ward_lantern` for 9, `focus_wrap` for 14, and cosmetics for 20–80 cosmetic tokens. Repair cost is `2 gold per damaged durability point`, capped at 40 gold per visit. Faucets are quest rewards, five daily contracts at 8–18 gold each, and instance drops; sinks are repairs, recipes at 4–25 gold, travel provisions at 2 gold, and optional cosmetic tailoring. Daily contract gold is capped at 90 per character; weekly cosmetic-token grants are capped at 120.

## 9) Instances

### Solo-able five-person equivalent: `scriptorium_breach`

It is designed for one apprentice or a private party of up to five. Each room is described before creatures appear.

| Room | Before-creature description | Trash | Elite | Checkpoint | Boss | Exits |
|---|---|---|---|---|---|---|
| `breach_threshold` | A brass door hangs open over a floor of drifting punctuation; every step makes a soft click. | `chalk_mite` x4 | — | — | — | `margin_gallery` |
| `margin_gallery` | Shelves bend toward a blank center where loose names orbit like moths. | `paper_wight` x4 | `redaction_hound` x1 | `ward_checkpoint_a` | — | `inkwell_bridge` |
| `inkwell_bridge` | A narrow bridge crosses a pool that reflects pages rather than faces. | `ink_crawler` x3 | — | `ward_checkpoint_a` | — | `sealed_correction` |
| `sealed_correction` | The room is a square of white slate; a single sentence is written and erased by invisible hands. | `hushling` x3 | `margin_owl` x1 | `ward_checkpoint_b` | — | `authorless_desk` |
| `authorless_desk` | A desk waits beneath a hanging lamp, and the ink in its well rises into a faceless robe. | — | — | `ward_checkpoint_b` | `margin_guardian_boss` x1 | `breach_exit` |

The boss uses coded phases: `erase_route` removes one exit marker, `borrow_spell` copies the last committed spell tag, and `return_name` restores the route when the party completes `talk_to_npc`-style evidence action. The instance reward is 38 gold, 240 XP, and one personal cosmetic roll.

### Big instance: `hollow_well_rite`

A 10-person MMO-combat skin is not required; this world uses a five-person capstone rite with three phases. Phase one, `upper_ring`, asks the party to stabilize four speaking stones; phase two, `waterless_drop`, contains `hollow_administrator` and two `vault_inkling` adds; phase three, `first_question`, is a ledger-gated choice between sealing the Well or listening to it. The result is coded as `well_sealed` or `well_heard`, never narrated into existence. Weekly per-character lockout applies. Wipe returns to `rite_checkpoint_two`.

## 10) Progression

| Node ID | Cost | Requires | Effect flags |
|---|---:|---|---|
| `steady_hand` | 0 | — | `spell_miscast_reduction_1` |
| `margin_sense` | 20 | `steady_hand` | `reveal_hidden_choice` |
| `chalk_ward` | 30 | `steady_hand` | `ward_charge_max_1` |
| `quiet_step` | 35 | `margin_sense` | `patrol_notice_minus_1` |
| `glint_countermark` | 40 | `chalk_ward` | `reflection_resist_1` |
| `threshold_bind` | 45 | `chalk_ward` | `companion_assist_threshold` |
| `echo_lesson` | 55 | `quiet_step` | `repeat_safe_spell_once` |
| `ink_anchor` | 60 | `margin_sense` | `checkpoint_recovery_plus_1` |
| `shared_focus` | 70 | `threshold_bind` | `bond_heart_cap_plus_1` |
| `faculty_argument` | 75 | `echo_lesson` | `dialogue_evidence_slot_plus_1` |
| `deep_reading` | 90 | `ink_anchor` | `vault_clue_reveal` |
| `fourfold_seal` | 110 | `shared_focus`, `faculty_argument` | `hollow_rite_option_seal` |
| `hollow_listening` | 110 | `deep_reading`, `faculty_argument` | `hollow_rite_option_listen` |
| `term_authority` | 140 | `fourfold_seal`, `hollow_listening` | `license_mastery` |

No node is pay-to-unlock. Five capped contracts are `copy_missing_attendance` (visit `vellum_stacks`), `carry_fen_lantern` (deliver `ward_lantern`), `brace_terrace_step` (collect `keystone_shard`), `retune_belfry_note` (collect `echo_feather`), and `file_quadrangle_report` (talk to `dean_avor`). Each has one daily completion and a shared 90-gold daily cap. Weekly `measure_the_hollow` grants one cosmetic token bundle after `visit_place: hollow_well`.

## 11) Theme Kit + copy

The `inkglass_apprentice` kit uses midnight blue, old paper cream, copper, and restrained ember-orange; materials are smoked glass, slate, wax, and stitched vellum. Dice look like translucent ink cubes with suspended gold flecks. Voice is intimate, observant, and lightly bell-toned, with no theatrical grandstanding. The ambient loop is “Rain on the Closed Quadrangle”: soft rain, one distant bell, page turns, and a low glass resonance. Default fashion is practical layered academy wear: coats, wraps, reinforced hems, focus straps, and removable color piping.

### Player-facing UI labels

| System label | Hollow Term label |
|---|---|
| Inventory | Satchel of Implements |
| Journal | Term Ledger |
| Map | Campus Folio |
| Quest log | Open Assignments |
| Party | Study Circle |
| Character | Apprentice Record |
| Skills | Prepared Lessons |
| Equipment | Focus and Wear |
| Crafting | Practical Bench |
| Vendors | Quarter Stalls |
| Mail | Sealed Notes |
| Checkpoint | Ward Mark |
| Dungeon | Breach Door |
| Boss | Faculty-Grade Hazard |
| Daily | Bell-Round |
| Weekly | Term Review |
| Reputation | Campus Standing |
| Bond | Heartline |
| Settings | Desk Drawer |
| Leave instance | Close the Book |

### New Game hook cards

1. “Your first spell does not fail; it answers a question you did not ask.”
2. “A name is missing from the Stacks, and the empty margin knows yours.”
3. “The campus bell rings once for every promise left unfinished.”
4. “You came to learn magic; the school asks whether magic may learn you.”
5. “Four paths enter the Quadrangle, but only honest footsteps leave a mark.”
6. “A harmless charm has made the stairs forget where they lead.”
7. “Your assigned focus warms whenever someone nearby tells a half-truth.”
8. “The Hollow is dry, patient, and listening beneath the first lesson.”
9. “A tutor offers you a shortcut and refuses to name its cost.”
10. “At second bell, every apprentice must choose what not to become.”

## 12) Failures + John’s calls

| Clone risk | Avoidance call |
|---|---|
| School-house sorting that maps to a famous academy | Kits are origins and practices, not ranked houses; all four share campus access. |
| A chosen child destined to defeat one dark master | The first arc is local ward failures, with multiple valid rite outcomes and no singular prophecy. |
| Spell lists that imitate recognizable franchise charms | Spell tags are functional ledger categories such as `seal`, `echo`, `measure`, and `reflect`; names are original. |
| A signature school sport or mascot copied from a known property | Campus conflict is evidence-led practical work; no broom game, mascot, or licensed tournament. |
| Improvised NPC roleplay replacing authored state | Every durable NPC has canned dialogue and objective-backed choices; open decisions are not blocking. |

**Default decisions, marked speculative:** the first capstone should remain five-person rather than add a 10-person raid because the school’s fantasy is intimate study under pressure; `well_sealed` and `well_heard` remain cosmetic-and-dialogue divergences until later content defines their exact long-term branch; no additional playable peoples are added before a content review.

## Integrity checklist

1. `worldId` is stable snake case: `hollow_term`.
2. Display name is the locked working title Hollow Term.
3. The pack is Markdown and saved as the requested filename.
4. Sections 0–12 are present.
5. Rules module fields are explicit and code-owned.
6. Wipe, checkpoint, and lockout behavior is explicit.
7. Prose cannot invent authoritative outcomes.
8. Four original identity kits are defined.
9. Four starts and a full connected map graph are included.
10. Two capital-equivalent hubs and one mid-world hub are included.
11. Indoor and outdoor map semantics are explicit.
12. Six durable NPCs have full canned talk trees.
13. Ten canned ambient hub lines are included.
14. Opening stakes and HookArc flags are explicit.
15. Choice buttons are inventory-aware and typed.
16. Primary start has 18 authored quest beats.
17. Quest objectives use code-completable verbs or explicitly coded bond checks.
18. Rewards are numeric gold and XP.
19. Campaign spine and divergence records are included.
20. Opponents and collectibles use original names and stable IDs.
21. No playable race is reused from another world pack.
22. No forbidden franchise names appear as canon content.
23. Loot is personal and premium content is cosmetic-only.
24. Vendor pricing and repair cost are numeric.
25. Daily and weekly caps are stated.
26. Five-room soloable five-person equivalent is fully described.
27. Big instance has three phases and a checkpoint.
28. Progression has 14 coded nodes with requirements and costs.
29. UI labels and ten opening hooks are present.
30. Clone risks and avoidance calls are limited to five.
31. Open decisions are defaults, not blockers.
32. No live service, source, prompt, save, or database references are included.
33. No production application code is included.
34. No placeholders or TBD language is used.
35. Teen content avoids sexual material, drugs, and gambling.
36. The world remains local-problem-first during the opening hour.
37. The Hollow is an original school mystery device, not a copied artifact plot.
38. Dialogue is diegetic and avoids engine terminology.
39. Nearby strangers cannot inject freeform narrator text.
40. The completed file is ready for download from the file tree.
