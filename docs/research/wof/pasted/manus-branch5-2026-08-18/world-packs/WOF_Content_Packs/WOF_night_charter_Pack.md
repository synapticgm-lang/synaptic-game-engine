# WOF Night Charter Pack

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `night_charter` |
| Display name | Night Charter |
| Pitch | Secret bloodline courts negotiate the safety of an ordinary city while every public kindness can become evidence. |
| Maturity | Teen+ |
| `rulesModuleId` | `hp_check_social_heat` |
| Theme Kit | Inkmoon Registry |
| Genre pattern and fence | Hidden-society court intrigue with supernatural lineages; this is **not** a wizard-school, vampire-clan, horror-cult, or licensed urban-fantasy world. |

All cultures, bloodlines, places, creatures, rituals, slogans, and artifacts below are original to this pack. Folklore analogues are used only as broad patterns.

### Genre-specific ban-list

The following are prohibited as names, factions, places, creatures, artifacts, slogans, or beat-for-beat references: Hogwarts, Dumbledore, Voldemort, Slytherin, Gryffindor, Hufflepuff, Ravenclaw, Harry Potter, Dementor, Horcrux, Azkaban, Diagon Alley, Mordor, Gondor, Middle-earth, Hobbit, Ringwraith, One Ring, Stormwind, Orgrimmar, Azeroth, Horde, Alliance, Warcraft, World of Warcraft, Vampire: The Masquerade, Camarilla, Sabbat, Tremere, Brujah, Ventrue, Malkavian, Nosferatu, Lasombra, Toreador, Gangrel, The Masquerade, Dracula, Transylvania, Twilight, Cullen, Volturi, Buffy, Sunnydale, Angel, Constantine, Sandman, Arkham, Cthulhu, Nyarlathotep, Innsmouth, Silent Hill, Resident Evil, Umbrella Corporation, The Matrix, Neo, John Wick, Gotham, Batman, Metropolis, Superman, X-Men, Marvel, DC, Watchmen, The Magicians, The Originals, True Blood, Interview with the Vampire, Castlevania, Underworld, Supernatural, and any renamed imitation of their signature plot or iconography.

## 1) Rules module: `hp_check_social_heat`

The ledger owns `hp`, `max_hp`, `armor_class`, `social_heat`, `max_social_heat`, `evidence`, `favor`, `bond`, `level`, `quest_state`, `inventory`, `gold`, `cosmetic_tokens`, `instance_checkpoint`, `weekly_boss_lockout`, and `divergence_records`. Combat is private, lockstep, and deterministic after dice resolution. Social scenes use contested checks against declared difficulty; prose cannot silently add evidence or remove heat.

A wipe returns the party to the latest checkpoint and preserves committed objectives. A failed negotiation raises declared `social_heat` or consumes a listed favor. Bosses have a weekly per-character lockout; personal loot is rolled after state commit. Party size is 2–5, and the big instance supports 10.

Prose is forbidden to invent damage, healing, loot, evidence, catch or bond success, quest completion, court standing, or a cleared district. Narration may describe sensory detail only after the ledger commits state. The overworld is Tier 3: shared hubs with instanced combat, no contested open-world PvP, and nearby presence only.

### Diegetic chrome templates

```text
[CHARTER // CASE {case_id}]
Objective: {objective_text}
Evidence: {evidence}/{evidence_max} | Heat: {social_heat}/{max_social_heat}
```

```text
[VEIN SENSE]
Lineage resonance: {lineage_name}
Read: {read_result}
Cost: {favor_cost} favor
```

```text
[COURT FLOOR]
Speaker: {npc_name} | Claim: {claim_id}
Your standing: {court_standing} | Objection window: {seconds}s
```

```text
[CONFRONTATION]
{species_name} | HP {hp}/{max_hp} | AC {ac}
Committed move: {move_name} | Result: {result}
```

```text
[PUBLIC FACE]
Visible heat: {social_heat} | Rumor pressure: {rumor_pressure}
Available cover: {cover_id}
```

## 2) Identity kits

| Kit ID | Look and values | Taboo, speech tell, clothes, weapon | Start and first quest | Ability flag | Originality note |
|---|---|---|---|---|---|
| `velour_lineage` | Warm-brown or umber skin with reflective irises; values reciprocity and written promises. | Never break a witnessed promise; ends claims with “under seal.” Charcoal waistcoat, red thread, brass oath-knife. | `candlewick_ward`; `nc_velour_first_seal` | `read_promise_trace` | An original contract-bloodline, not a renamed licensed clan. |
| `morrow_lineage` | Pale, copper, or deep skin with faint dusk freckles; values privacy and patient observation. | Never reveal a true name in public; pauses before every answer. Indigo coat, soft boots, folding mirror-baton. | `glassmarket_lane`; `nc_morrow_false_name` | `mask_emotion_echo` | An original concealment lineage, not an undead stereotype. |
| `bracken_lineage` | Olive, russet, or gray skin with leaflike birthmarks; values stewardship and repair. | Never discard a useful thing; speaks in practical proverbs. Waxed green mantle, tool sash, hooked walking staff. | `underbridge_gardens`; `nc_bracken_root_debt` | `trace_living_residue` | An original urban ecology lineage. |
| `sable_lineage` | Dark skin with silver nail crescents; values courage and direct witness. | Never threaten a bystander; uses names instead of titles. Night-blue jacket, padded gloves, weighted lantern-chain. | `old_toll_square`; `nc_sable_witness` | `anchor_fear` | An original protective lineage, not a renamed comic-book hero. |

## 3) Map / places

The city of **Vesper Quay** is a public river metropolis layered over charter halls, sealed tram tunnels, and four hidden courts. Streets show pins only after discovery; indoor locations use compact floor plans rather than city-scale overlays. Fog distinguishes visited rooms from outline silhouettes. Instance doors are explicit place records.

| Start zone | Hub | POIs (`placeId`, public name, scale, danger, outdoor, exits) |
|---|---|---|
| `candlewick_ward` | `candlewick_exchange` | `candlewick_gate` Candlewick Gate (street, safe, true, `candlewick_exchange`,`bell_archive`); `bell_archive` Bell Archive (dungeon, low, false, `candlewick_gate`,`charter_steps`, `bell_archive_instance`); `raincourt_steps` Raincourt Steps (street, safe, true, `candlewick_exchange`,`old_toll_square`); `paper_bridge` Paper Bridge (street, low, true, `bell_archive`,`underbridge_gardens`); `candlewick_exchange` Candlewick Exchange (street, safe, true, `candlewick_gate`,`raincourt_steps`,`charter_steps`); `charter_steps` Charter Steps (street, low, true, `candlewick_exchange`,`inkhall_capital`). |
| `glassmarket_lane` | `glassmarket_arcade` | `glassmarket_gate` Glassmarket Gate (street, safe, true, `glassmarket_arcade`,`mirror_vault`); `mirror_vault` Mirror Vault (dungeon, medium, false, `glassmarket_gate`,`canal_turn`, `mirror_vault_instance`); `canal_turn` Canal Turn (street, low, true, `glassmarket_arcade`,`old_toll_square`); `shuttered_theatre` Shuttered Theatre (street, low, false, `glassmarket_arcade`,`mirror_vault`); `glassmarket_arcade` Glassmarket Arcade (street, safe, true, `glassmarket_gate`,`canal_turn`,`charter_steps`); `silver_stall` Silver Stall Row (street, safe, true, `glassmarket_arcade`,`inkhall_capital`). |
| `underbridge_gardens` | `rootlight_commons` | `garden_gate` Garden Gate (street, safe, true, `rootlight_commons`,`rootcellar`); `rootcellar` Rootcellar (dungeon, low, false, `garden_gate`,`flooded_rail`, `rootcellar_instance`); `flooded_rail` Flooded Rail (street, medium, true, `rootcellar`,`old_toll_square`); `mender_yard` Mender Yard (street, safe, true, `rootlight_commons`,`garden_gate`); `rootlight_commons` Rootlight Commons (street, safe, true, `garden_gate`,`flooded_rail`,`charter_steps`); `reedless_canal` Reedless Canal (street, low, true, `rootlight_commons`,`inkhall_capital`). |
| `old_toll_square` | `tollhouse_common` | `tollhouse_gate` Tollhouse Gate (street, safe, true, `tollhouse_common`,`underhall`); `underhall` Underhall (dungeon, medium, false, `tollhouse_gate`,`river_lock`, `underhall_instance`); `river_lock` River Lock (street, low, true, `underhall`,`candlewick_gate`); `clockless_post` Clockless Post (street, safe, true, `tollhouse_common`,`tollhouse_gate`); `tollhouse_common` Tollhouse Common (street, safe, true, `tollhouse_gate`,`river_lock`,`charter_steps`); `night_ferry` Night Ferry (street, low, true, `tollhouse_common`,`inkhall_capital`). |

`inkhall_capital` is the capital with the Public Registry, Fourfold Court, repair hall, vendor arcade, and charter elevator. `velvet_tribunal` is the second capital and court endgame hub. `charter_steps` is the mid-world join. Travel graph: each start hub connects to `charter_steps`; `charter_steps` connects to `inkhall_capital`; faction reputation unlocks a non-teleport ferry from `inkhall_capital` to `velvet_tribunal`.

## 4) Durable NPCs

Each start has six durable NPCs. The following compact talk-tree table is the authoritative canned dialogue for every quest-giver and merchant; hub/local NPCs also use their listed lines.

| Zone | ID, name, place, role | Greet | Quest offer | Progress | Turn-in | Gossip (3) | Refusal / rude |
|---|---|---|---|---|---|---|---|
| Candlewick | `nc_mara_vell`, Mara Vell, `candlewick_exchange`, quest | “Keep your voice low; the walls remember.” | “A seal vanished from the archive. Find its paper trail.” | “You have the archive mark. What else did it notice?” | “The seal returns to its drawer, and the ward breathes.” | “Raincourt was older than the river.” / “Never sign in wet ink.” / “The bell rings for lies, not hours.” | “No threats at my counter. Leave.” |
| Candlewick | `nc_orrin_quire`, Orrin Quire, `bell_archive`, profession | “Ink, cord, and patience; choose two.” | “Bring three dry reed sheets and I can bind a field ledger.” | “The fibers are sound. I can finish tonight.” | “A clean ledger for a clean beginning.” | “Blue ink hides panic.” / “A torn margin is a confession.” / “I charge for craft, not secrets.” | “If you insult the work, you lose the appointment.” |
| Candlewick | `nc_lio_slate`, Lio Slate, `candlewick_gate`, merchant | “Travel light; suspicion weighs more.” | “Take a ward chalk and mark the safe lamps.” | “The chalk is wearing thin. Good work.” | “Your route kit is ready.” | “The eastern tram skips one stop.” / “Brass charms are louder than they look.” / “Ask before crossing a shuttered door.” | “I sell tools, not arguments.” |
| Candlewick | `nc_bram_night`, Bram Night, `paper_bridge`, local | “The bridge holds if nobody hurries.” | “Three bridge lamps went dark; relight them.” | “That makes two. The third is under the arch.” | “Now the water has a face again.” | “Someone counts footsteps here.” / “The river dislikes iron.” / “Mara pays on time.” | “Walk away before you make this worse.” |
| Candlewick | `nc_vesra_pin`, Vesra Pin, `raincourt_steps`, hub | “Your shadow arrived before you.” | “Listen at the Steps and report which court is moving.” | “You heard the silver shoes? Then you heard enough.” | “Useful ears deserve quiet coin.” | “A court is a habit with furniture.” / “Theatre curtains conceal exits.” / “Do not chase every rumor.” | “I will not reward bullying.” |
| Candlewick | `nc_tovin_reed`, Tovin Reed, `charter_steps`, hub | “The Steps are open. Your conscience is your passport.” | “Carry this sealed notice without opening it.” | “The wax is intact. Excellent.” | “The notice reaches its intended hand.” | “The capital keeps daylight hours by decree.” / “The Velvet Tribunal hates surprises.” / “Charter law favors precise verbs.” | “You may go when you can speak civilly.” |
| Glassmarket | `nc_selin_vein`, Selin Vein, `glassmarket_arcade`, quest | “Reflections are witnesses with poor manners.” | “A false name is circulating. Trace its first use.” | “The first signature is in the theatre.” | “The name is contained, not erased.” | “Mirrors remember posture.” / “Canal water carries gossip.” / “The arcade closes at the third bell.” | “Your rudeness is now evidence.” |
| Glassmarket | `nc_iva_mirror`, Iva Mirror, `mirror_vault`, profession | “Polish reveals more than it hides.” | “Bring two silverleaf cloths for a proper scry-pane.” | “The cloth has no court scent.” | “Take the pane; do not aim it at friends.” | “A mirror is a door only in bad poetry.” / “The theatre has a basement.” / “Never buy a promise untested.” | “Come back after you learn manners.” |
| Glassmarket | `nc_pellix_glass`, Pellix Glass, `glassmarket_gate`, merchant | “A sturdy lens beats a dramatic cloak.” | “Test this lens at three marked windows.” | “The lens found the hidden ink.” | “The purchase is yours; the test fee is mine.” | “My best glass came from a bell.” / “Theatre dust stains everything.” / “A closed stall can still listen.” | “Shop elsewhere if you want to shout.” |
| Glassmarket | `nc_dara_quill`, Dara Quill, `shuttered_theatre`, local | “No performance tonight, only consequences.” | “Recover the theatre’s missing usher ledger.” | “The names are legible again.” | “The house can close without haunting anyone.” | “The balcony has a loose rail.” / “The canal door sticks at dawn.” / “Selin hates unfinished sentences.” | “Do not turn grief into spectacle.” |
| Glassmarket | `nc_roen_sash`, Roen Sash, `canal_turn`, hub | “Keep your reflection on a short leash.” | “Watch the canal turn for a courier with a copper pin.” | “Copper pin, gray gloves, no escort. Correct.” | “Your observation buys a safe crossing.” | “The ferry bell lies by one note.” / “The old square has new guards.” / “The vault is colder than winter.” | “I do not negotiate with insults.” |
| Glassmarket | `nc_miri_fold`, Miri Fold, `silver_stall`, merchant | “A good coat has three pockets and one secret.” | “Choose a formal mask for the court visit.” | “That mask will pass inspection.” | “Wear it only when you mean to be seen.” | “Indigo reads as neutral.” / “Red thread invites questions.” / “The Tribunal notices shoes.” | “No fitting while you sneer.” |
| Gardens | `nc_essa_root`, Essa Root, `rootlight_commons`, quest | “The roots are restless beneath the paving.” | “Find who is poisoning the public planters.” | “The residue points below the rail.” | “The beds will recover; the culprit must answer.” | “Mender Yard shares seed.” / “Flooded rails are not abandoned.” / “The canal used to be wider.” | “I will not help someone cruel to living things.” |
| Gardens | `nc_ren_mender`, Ren Mender, `mender_yard`, profession | “Broken is a stage, not a verdict.” | “Bring four copper staples for a street brace.” | “The brace fits. Hold it steady.” | “A repaired thing remembers the hand.” | “Tools need names.” / “Rootlight lamps use fungus oil.” / “The old rail still hums.” | “Respect the yard or leave it.” |
| Gardens | `nc_juno_spade`, Juno Spade, `garden_gate`, merchant | “Seeds, salves, and sensible prices.” | “Deliver a starter salve to the lock keeper.” | “The salve arrived unspilled.” | “Take the spare; kindness is practical.” | “Do not plant in court soil.” / “Mender Yard buys bent metal.” / “A garden can hide a staircase.” | “Rudeness gets no credit.” |
| Gardens | `nc_kett_flood`, Kett Flood, `flooded_rail`, local | “Water remembers every boot.” | “Clear three drift bundles from the rail.” | “The third bundle is tied with black cord.” | “The rail can breathe again.” | “Someone walks here without splashing.” / “The lock keeper whistles.” / “Essa hears roots.” | “Threats sink quickly here.” |
| Gardens | `nc_ula_wick`, Ula Wick, `reedless_canal`, hub | “The canal is quiet for a reason.” | “Count the unlit lamps between the commons and canal.” | “Seven lamps, one deliberate gap.” | “Your count will shape tonight’s patrol.” | “The capital buys silence wholesale.” / “The ferry has a hidden berth.” / “Never trust a dry fountain.” | “You are not entitled to my attention.” |
| Gardens | `nc_bes_tally`, Bes Tally, `rootcellar`, quest | “Inventory first, panic second.” | “Recover the cellar’s stamped seed cases.” | “The cases are sealed and numbered.” | “The commons can plant on schedule.” | “A tally is a promise to the future.” / “The rail’s bricks are older than records.” / “Juno overpacks.” | “I will not continue while you insult my people.” |
| Toll Square | `nc_sora_toll`, Sora Toll, `tollhouse_common`, quest | “Every passage has a price, not always in coin.” | “A witness disappeared between two honest tolls.” | “The witness is safe under the clockless post.” | “The square owes you a measured favor.” | “The lock is older than the city.” / “Night Ferry takes no questions.” / “The Underhall echoes names.” | “Leave before I call the wardens.” |
| Toll Square | `nc_vek_under`, Vek Under, `underhall`, profession | “Stone, chalk, and a steady pulse.” | “Bring two blue chalk cakes to map the lower arches.” | “The marks show a route, not a trap.” | “Your map earns a sealed copy.” | “The underpass floods upward.” / “Old tolls were paid in stories.” / “The river lock has teeth.” | “No shouting below ground.” |
| Toll Square | `nc_nell_gate`, Nell Gate, `tollhouse_gate`, merchant | “A lantern is a boundary you carry.” | “Test this shutter-lantern at the lock.” | “Its flame held against the draft.” | “The lantern is yours after the inspection.” | “Good hinges prevent bad drama.” / “A ferry token is not a court seal.” / “The post keeps spare blankets.” | “Buy or go; do not harass the stall.” |
| Toll Square | `nc_aro_lock`, Aro Lock, `river_lock`, local | “The river is high and the law is low.” | “Secure three chain pins before the next rise.” | “The pins are seated. The lock will hold.” | “You kept homes dry tonight.” | “The night ferry knows every shortcut.” / “The Underhall has a second door.” / “Sora counts twice.” | “I have no patience for bullies.” |
| Toll Square | `nc_pava_post`, Pava Post, `clockless_post`, hub | “Messages arrive when they are ready.” | “Carry a witness statement to the capital.” | “The seal is unbroken.” | “The record enters the public book.” | “Copper pins mean courier, not noble.” / “The square sees too much.” / “Never sleep beside a bell.” | “Try that tone with someone else.” |
| Toll Square | `nc_jori_ferry`, Jori Ferry, `night_ferry`, merchant | “One crossing, one fare, no theatrics.” | “Bring a dry route map and I will mark a hidden berth.” | “The map survived the rain.” | “The berth is yours to use once.” | “The river is safest when watched.” / “The capital dislikes boats.” / “A lock can be a door.” | “No abuse aboard my ferry.” |

**Canned hub lines per zone.** Candlewick: “Mind the bells.” “Ink dries fast.” “Keep to the lamps.” “Mara is listening.” “The bridge is slick.” “No open oaths.” “Archive doors close early.” “Rain makes liars honest.” “Use the marked stairs.” “Quiet feet, clear mind.” Glassmarket: “Eyes forward.” “Masks stay tied.” “Glass cuts both ways.” “The arcade is closing.” “Canal wind tonight.” “Do not touch the mirrors.” “A copper pin passed here.” “The theatre is dark.” “Keep receipts.” “Reflections are not friends.” Gardens: “Water the west bed.” “Mind the roots.” “Tools back on hooks.” “The rail is unstable.” “No litter.” “Lamps at dusk.” “Essa is in the commons.” “The canal is low.” “Repair before replacing.” “Share the seed.” Toll Square: “State your crossing.” “The lock is rising.” “Keep the lane.” “No fires near rope.” “Witnesses wait inside.” “Ferry leaves at third bell.” “Count your belongings.” “The underpass is closed.” “Sora has the ledger.” “Pay attention.”

## 5) Premade choices / first hour

Each kit opens with five authored beats: a public introduction, a private lineage sign, a request that cannot be safely ignored, a choice with a stated stake, and a witnessed consequence. Choices set `identity_confirmed`, `first_choice`, and `observed_consequence`.

| Kit | Opening choice and stake |
|---|---|
| `velour_lineage` | Sign a courier’s pledge and gain 1 favor but owe a future delivery, or refuse and begin at 1 social heat because the refusal is witnessed. |
| `morrow_lineage` | Use a false name to protect a bystander and gain cover, or state your true name and gain trust from Mara while exposing your trail. |
| `bracken_lineage` | Save a public planter and lose the evidence trail, or preserve the evidence and let one bed wilt until a later repair quest. |
| `sable_lineage` | Stand between a frightened witness and a collector, gaining 1 heat, or escort the witness unseen, spending one cover. |

**Grounded choice buttons.** At every POI the client may expose only inventory-aware buttons such as `read_the_posted_notice` (requires place visit; investigate), `ask_mara_about_the_seal` (requires `candlewick_exchange`; dialogue), `mark_the_safe_lamp` (requires `ward_chalk`; collect), `cross_the_paper_bridge` (requires `paper_bridge`; travel), `steady_the_frightened_witness` (requires `anchor_fear`; social), `commit_a_guarded_strike` (combat move), `present_the_courier_pledge` (requires `sealed_notice`; dialogue), and `retreat_to_checkpoint` (instance action).

**Forced tutorial path:** arrive at the start gate; inspect the public notice; choose the stake; follow a marked lamp; perform one declared social check; enter the first room only after its description; resolve one encounter; reach a checkpoint; return with a committed item; receive the first divergence-capable promise. Alts may skip after `identity_confirmed` is set.

**Retry beat deck.**

| Fingerprint | Goal | Tactic | Obstacle | Revelation | Consequence |
|---|---|---|---|---|---|
| `retry_01` | Find the missing seal | Archive search | False catalog | It was checked out under a dead clerk | Gain evidence, +1 heat |
| `retry_02` | Protect a witness | Quiet escort | Canal watcher | Witness knows the watcher | Gain favor, spend cover |
| `retry_03` | Open the vault | Lens alignment | Misleading reflection | A court symbol was inverted | Gain route, lose time |
| `retry_04` | Repair the lamp line | Copper splice | Flooded rail | Black cord caused the outage | Gain safe travel |
| `retry_05` | Win a hearing | Narrow testimony | Rival objection | Rival fears the same patron | Gain standing, +1 heat |
| `retry_06` | Clear the underpass | Chain reset | Rising water | Lock was sabotaged from inside | Gain access, lose one salve |
| `retry_07` | Identify a courier | Observe hand signs | Decoy pin | True courier carries no pin | Gain evidence |
| `retry_08` | Keep peace | Offer a witnessed bargain | Both parties lie | The third witness benefits | Gain favor, record divergence |

## 6) Quests: code-completeable DAGs

The primary start, Candlewick Ward, contains 18 authored beats. Every objective is ledger-resolvable.

| ID | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---:|---|---|---:|---:|
| `nc_velour_first_seal` | A Promise in Dry Ink | identity | false | `nc_lamp_markers` | `talk_to_npc:nc_mara_vell:1`; `collect_item:blank_pledge:1` | 8 | 30 |
| `nc_morrow_false_name` | Name Withheld | identity | false | `nc_raincourt_whisper` | `visit_place:candlewick_gate:1`; `talk_to_npc:nc_vesra_pin:1` | 8 | 30 |
| `nc_bracken_root_debt` | The Root’s Receipt | identity | false | `nc_bridge_lamps` | `collect_item:root_receipt:1`; `deliver_item:root_receipt:nc_essa_root:1` | 8 | 30 |
| `nc_sable_witness` | Stand Where Seen | identity | false | `nc_witness_route` | `talk_to_npc:nc_bram_night:1`; `visit_place:paper_bridge:1` | 8 | 30 |
| `nc_lamp_markers` | Keep the Lamps Accounted | profession | false | `nc_archive_breadcrumb` | `collect_item:ward_chalk:3`; `visit_place:raincourt_steps:1`; `collect_item:lamp_marker:3` | 12 | 45 |
| `nc_archive_breadcrumb` | The Bell Archive’s Margin | zone_story | false | `nc_seal_in_the_vault` | `visit_place:bell_archive:1`; `collect_item:dry_reed_sheet:3`; `talk_to_npc:nc_orrin_quire:1` | 15 | 55 |
| `nc_bridge_lamps` | Three Lights Under Water | profession | false | `nc_courier_without_pin` | `collect_item:lamp_oil:3`; `visit_place:paper_bridge:1`; `deliver_item:lamp_oil:nc_bram_night:1` | 14 | 50 |
| `nc_raincourt_whisper` | Shoes on the Steps | zone_story | false | `nc_courier_without_pin` | `visit_place:raincourt_steps:1`; `talk_to_npc:nc_vesra_pin:1`; `collect_item:silver_thread:2` | 15 | 55 |
| `nc_witness_route` | A Safe Route Is a Promise | zone_story | false | `nc_courier_without_pin` | `visit_place:paper_bridge:1`; `talk_to_npc:nc_bram_night:1`; `deliver_item:route_card:nc_tovin_reed:1` | 16 | 60 |
| `nc_courier_without_pin` | The Hand That Signs Nothing | zone_story | false | `nc_mirror_vault_key` | `ledger_kill:ink_moth:4`; `collect_item:unmarked_courier_note:1`; `talk_to_npc:nc_mara_vell:1` | 20 | 75 |
| `nc_mirror_vault_key` | A Door That Reflects Twice | zone_story | false | `nc_seal_in_the_vault` | `deliver_item:unmarked_courier_note:nc_iva_mirror:1`; `collect_item:prism_key:1`; `visit_place:bell_archive:1` | 20 | 80 |
| `nc_seal_in_the_vault` | The Borrowed Seal | zone_story | false | `nc_charter_steps_hearing` | `visit_place:bell_archive:1`; `ledger_kill:paper_wraith:1`; `collect_item:borrowed_seal:1`; `deliver_item:borrowed_seal:nc_mara_vell:1` | 28 | 110 |
| `nc_hidden_trust_mara` | Mara’s Unlisted Page | hidden | true | `nc_charter_steps_hearing` | `talk_to_npc:nc_mara_vell:1`; `collect_item:unlisted_page:1`; `deliver_item:unlisted_page:nc_mara_vell:1` | 24 | 95 |
| `nc_dry_reed_binding` | Bind the Field Ledger | profession | false | `nc_daily_lamp_audit` | `collect_item:dry_reed_sheet:4`; `deliver_item:field_ledger:nc_orrin_quire:1` | 18 | 65 |
| `nc_daily_lamp_audit` | Daily: Count the Safe Lamps | daily | false | none | `visit_place:candlewick_gate:1`; `collect_item:lamp_marker:5` | 10 | 25 |
| `nc_archive_escort` | Side Door, Quiet Feet | side | false | `nc_charter_steps_hearing` | `talk_to_npc:nc_tovin_reed:1`; `visit_place:charter_steps:1`; `deliver_item:sealed_notice:nc_tovin_reed:1` | 22 | 85 |
| `nc_charter_steps_hearing` | Four Courts, One Question | campaign | false | `nc_capital_registry` | `visit_place:charter_steps:1`; `talk_to_npc:nc_tovin_reed:1`; `collect_item:hearing_token:1` | 35 | 140 |
| `nc_capital_registry` | The First Charter Night | campaign | false | `nc_velvet_tribunal_summons` | `visit_place:inkhall_capital:1`; `talk_to_npc:nc_registry_clerk:1`; `collect_item:public_record:1` | 45 | 180 |

The other three starts each have 18-beat authored arcs with distinct local verbs and stakes. `glassmarket_lane` follows `gm_false_name`, `gm_shuttered_stage`, `gm_canal_debt`, `gm_mirror_vault`, and 14 linked beats involving tracing, masking, bargaining, and testimony. `underbridge_gardens` follows `ug_root_poison`, `ug_rail_breath`, `ug_seed_cases`, `ug_lockkeeper`, and 14 linked beats involving mending, draining, planting, and restoring. `old_toll_square` follows `ots_missing_witness`, `ots_chain_pins`, `ots_ferry_berth`, `ots_underhall`, and 14 linked beats involving escorting, counting, securing, and recording. Each arc contains 4 identity quests, 4 profession quests, 6 zone-story quests, 2 sides, 1 hidden trust quest, and 1 capped daily; all use the objective verbs specified above and numeric rewards between 8–48 gold and 25–190 XP.

### Campaign spine after the starts

`nc_velvet_tribunal_summons` (deliver summons to `velvet_tribunal`), `nc_four_seals` (collect four court seals), `nc_public_hearing` (talk to three named witnesses), `nc_heat_without_fire` (reduce social heat through two declared favors), `nc_charter_faultline` (visit `inkhall_capital` and `charter_steps`), `nc_underhall_root` (ledger-kill six charter gnats), `nc_court_split` (deliver two contradictory statements), `nc_midnight_ballot` (collect one ballot case), `nc_black_ink_parley` (talk to four court envoys), `nc_tribunal_checkpoint` (reach the tribunal checkpoint), `nc_name_the_patron` (collect the patron ledger), `nc_charter_breach` (ledger-kill the Charter Eater), `nc_afterimage_court` (visit the sealed gallery), `nc_rewrite_the_witness` (deliver the corrected record), `nc_night_charter` (talk to the four court heads), and `nc_quay_morning` (visit the public registry). Rewards range from 50–120 gold and 200–600 XP; none are prose-only.

### Divergence records

Walking away from Mara’s request writes `declined_archive_protection`; refusing to shelter the witness writes `witness_exposed_by_choice`; siding with the rival court during `nc_public_hearing` writes `court_standing_rebalanced`. Each record stores the promise, player choice, affected NPC, and available later repair quest; no promise is silently forgotten.

## 7) Species / opponents / collectibles

Combat skins are urban manifestations, not bloodlines. Each starting region uses the following 16-species catalog with habitat tags and stable combat values; species are reused only where the map table explicitly lists them.

| Species ID | Name | Rarity | Habitat | HP | ATK | AC |
|---|---|---|---|---:|---:|---:|
| `ink_moth` | Ink Moth | common | archive, lamp | 18 | 4 | 10 |
| `rainclasp` | Rainclasp | common | bridge, canal | 22 | 5 | 11 |
| `paper_wisp` | Paper Wisp | common | archive, street | 16 | 6 | 12 |
| `gutter_gleam` | Gutter Gleam | common | market, rail | 20 | 5 | 11 |
| `bell_tick` | Bell Tick | common | archive, square | 24 | 4 | 12 |
| `mirror_mite` | Mirror Mite | common | vault, arcade | 19 | 6 | 13 |
| `root_nicker` | Root Nicker | common | garden, cellar | 26 | 5 | 11 |
| `chainling` | Chainling | common | toll, underhall | 28 | 6 | 12 |
| `brass_owl` | Brass Owl | uncommon | lamp, capital | 34 | 8 | 13 |
| `canal_loper` | Canal Loper | uncommon | canal, bridge | 38 | 7 | 12 |
| `shutter_hound` | Shutter Hound | uncommon | theatre, lane | 42 | 9 | 14 |
| `moss_censor` | Moss Censor | uncommon | roots, cellar | 45 | 8 | 13 |
| `tally_crab` | Tally Crab | uncommon | lock, square | 48 | 7 | 15 |
| `glass_veiled` | Glass Veiled | rare | vault, theatre | 58 | 11 | 15 |
| `charter_eater` | Charter Eater | epic | tribunal, capital | 92 | 15 | 17 |
| `night_herald` | Night Herald | epic | court gallery | 110 | 18 | 18 |

## 8) Loot / economy

Gold pays for repairs, ordinary tools, travel fares, and crafting. Cosmetic tokens buy only dyes, emotes, coat trims, lantern skins, and court-mask appearances. Premium never buys combat outcomes, evidence, boss clears, lockout skips, random power packs, or social heat removal.

| Item ID | Template | Use |
|---|---|---|
| `oath_knife` | starter weapon | 1d6 declared strike; cosmetic variants do not change stats |
| `mirror_baton` | starter weapon | 1d6 guarded strike; grants no hidden check bonus |
| `root_hook_staff` | starter weapon | 1d6 control strike |
| `lantern_chain` | starter weapon | 1d6 anchor strike |
| `charcoal_travelcoat` | starter armor | AC 11 |
| `ward_chalk` | map tool | marks safe-lamp objectives |
| `sealed_notice` | quest item | delivery to `nc_tovin_reed` |
| `field_ledger` | profession output | records one public route |
| `prism_key` | dungeon drop | opens `mirror_vault_instance` |
| `borrowed_seal` | campaign item | proves archive tampering |
| `court_mask_inkmoon` | cosmetic | appearance only |

Personal room drop tables: archive rooms yield `dry_reed_sheet` 45%, `bell_shard` 25%, `ward_chalk` 20%, `archive_clasp` 10%; mirror rooms yield `silverleaf_cloth` 45%, `prism_key` 15%, `glass_thread` 30%, `court_mask_inkmoon` 10%; root rooms yield `root_receipt` 35%, `lamp_oil` 35%, `seed_case` 20%, `green_lacquer` 10%; toll rooms yield `chain_pin` 40%, `route_card` 30%, `ferry_token` 20%, `lock_crest` 10%.

Vendors sell starter weapons for 40 gold, armor for 35, ward chalk bundles for 6, salves for 8, route cards for 10, and cosmetic dyes for 18 gold or 3 cosmetic tokens. Repair cost is `2 gold * missing durability points`; durability is cosmetic-facing and cannot alter a committed encounter result. Faucets are quest rewards and capped daily work; sinks are repairs, fares, crafting, and vendor purchases. Daily contracts pay at most 60 gold per character.

Collection log entries include every species, 12 archive papers, 8 court seals, 6 lamp styles, 4 travel maps, 10 masks, and 5 public-record variants.

## 9) Instances

### Soloable 5-man equivalent: Bell Archive Descent

This private instance is soloable with companion assists or playable by 2–5 characters.

| Room | Description before creature | Encounters | Exit / checkpoint |
|---|---|---|---|
| `bad_room` | A dry reading room is lined with chained shelves; one bell has no clapper. | `ink_moth` x4 | Exit to `catalog_hall`; checkpoint after room |
| `catalog_hall` | A narrow hall of tilted drawers funnels rainwater toward a locked brass grate. | `paper_wisp` x3; `bell_tick` x1 elite | Exit to `silt_stair` |
| `silt_stair` | Stone stairs descend through silt stamped with four different court marks. | `rainclasp` x4 | Exit to `seal_vault`; checkpoint |
| `seal_vault` | A circular vault contains an empty pedestal, a cracked mirror, and a bell-shaped shadow. | `glass_veiled` x1 elite | Exit to `unheard_chamber` |
| `unheard_chamber` | The final chamber is acoustically dead; the boss can be seen only when the party stops speaking. | `charter_eater` x1 boss | Exit to `candlewick_exchange`; personal loot |

### Ten-person big instance: The Velvet Tribunal

Phase 1, **Arrival Without Applause**, begins in a rain-polished vestibule. Players resolve three witness disputes and defeat `paper_wisp` x8 plus `brass_owl` x2. Phase 2, **The Fourfold Objection**, takes place in a rotating hearing chamber; each court presents a claim while `glass_veiled` x4 and `night_herald` x1 elite interrupt. Phase 3, **The Charter Eats Its Name**, occurs in a candleless gallery; the party must commit four seals before fighting `charter_eater` x1 and `night_herald` x2. A checkpoint follows each phase. Wipe returns the group to the latest phase checkpoint; weekly per-character boss lockout applies.

## 10) Progression

| Node ID | Cost | Requires | Effect flag |
|---|---:|---|---|
| `talent_quiet_entry` | 1 | none | `cover_gain_1` |
| `talent_witness_posture` | 1 | `talent_quiet_entry` | `social_check_guard` |
| `talent_clean_ink` | 2 | `talent_witness_posture` | `evidence_preserve_1` |
| `talent_lamp_route` | 2 | `talent_quiet_entry` | `travel_heat_minus_1` |
| `talent_archive_memory` | 3 | `talent_clean_ink` | `archive_search_plus_1` |
| `talent_mirror_reading` | 3 | `talent_lamp_route` | `reflection_check_plus_1` |
| `talent_root_patience` | 2 | `talent_lamp_route` | `repair_action_plus_1` |
| `talent_chain_anchor` | 3 | `talent_root_patience` | `fear_resist_1` |
| `talent_public_record` | 4 | `talent_archive_memory` | `hearing_evidence_plus_1` |
| `talent_cover_identity` | 4 | `talent_mirror_reading` | `heat_cap_plus_2` |
| `talent_fourfold_voice` | 5 | `talent_public_record`,`talent_cover_identity` | `court_choice_plus_1` |
| `talent_sealbreaker` | 5 | `talent_chain_anchor`,`talent_fourfold_voice` | `charter_eater_damage_plus_2` |
| `talent_night_ferry` | 6 | `talent_cover_identity` | `ferry_route_unlocked` |
| `talent_unheard_step` | 6 | `talent_sealbreaker` | `boss_phase_reposition` |

No node is paid-only. Costs are earned through level and completed contracts.

### Capped contracts

`contract_lamp_audit` requires five lamp markers and pays 10 gold; `contract_archive_sort` requires four paper bundles and pays 12; `contract_witness_walk` requires one route visit and pays 14; `contract_lock_pin` requires three chain pins and pays 15; `contract_court_notice` requires one sealed delivery and pays 18. Each may be completed once daily; weekly court contracts are capped at three per character.

## 11) Theme Kit + copy

Inkmoon Registry uses midnight blue, wet slate, tarnished brass, muted plum, and one signal color: witness red. Materials are vellum, smoked glass, river stone, and waxed thread. Dice look like weighted seal-stamps with recessed pips. Voice is close, restrained, observant, and never melodramatic. The ambient loop is **“Rain on the Registry Roof”**: soft rain, distant tram hum, one irregular bell, and no melody. Fashion is layered coats, practical gloves, narrow scarves, brass pins, and reversible court masks.

### Player-facing UI labels

| System label | Skinned label |
|---|---|
| Inventory | Satchel of Proofs |
| Journal | Charter Ledger |
| Map | Street-and-Seal Map |
| Quest | Active Promise |
| Quest complete | Promise Recorded |
| Party | Witness Circle |
| Friend finder | Trusted Route |
| HP | Composure |
| Armor | Guard |
| Social heat | Notice |
| Evidence | Proof |
| Favor | Goodwill |
| Gold | Civic Coin |
| Cosmetic tokens | Mask Marks |
| Loot | Personal Find |
| Checkpoint | Safe Mark |
| Boss | Charter Adversary |
| Daily | Nightly Duty |
| Settings | Desk Drawer |
| Leave instance | Close the Case |

### New Game hook cards

1. “A sealed promise waits beneath a bell that no longer rings.”
2. “Someone used your name where only the courts should know it.”
3. “The city is safe in daylight because night workers keep count.”
4. “A witness has one hour before four factions call them a liar.”
5. “Your first favor is free; your second will be remembered.”
6. “The river returned a document with tomorrow’s date.”
7. “A public lamp went dark, and every court noticed.”
8. “The safest mask is the one you can remove in front of a friend.”
9. “You were invited to a hearing that denies it exists.”
10. “In Vesper Quay, truth is not hidden; it is itemized.”

## 12) Failures + John’s calls

| Clone risk | Avoidance / decision |
|---|---|
| It feels like a renamed famous magic school. | There is no school, spell curriculum, wand culture, or boarding academy; the core loop is civic evidence and negotiated secrecy. |
| It feels like a familiar undead romance or blood-drinker clan game. | Bloodlines are social inheritances with taboos and talents; manifestations are separate combat skins, and no feeding mythology exists. |
| It becomes a generic conspiracy with no code-resolvable stakes. | Every promise uses explicit place, item, NPC, evidence, heat, and numeric reward fields. |
| Social heat becomes a punishment players cannot understand. | The UI exposes current heat, cause, cap, available cover, and repair quests; speculative balancing defaults to a 0–10 scale. |
| Courts collapse into one morality track. | Four starts and four court positions create divergent records; the player may repair a promise but cannot erase a committed choice. |

**Speculative defaults:** social heat uses a 0–10 scale; court standing starts at 0; the first capital hearing requires level 4; the big instance supports 10 and the five-room instance supports solo companion assistance. These are tuning decisions, not lore claims.

## Integrity checklist

1. `worldId` is stable snake_case: `night_charter`.
2. The file is content-only.
3. No live service, source, save, or backend references appear in-world.
4. No dump-error title is used as canon.
5. No forbidden franchise name is used as a world element.
6. The pack uses original cultures and bloodlines.
7. Four starts and four non-capital hubs are present.
8. Two capitals or equivalent end hubs are present.
9. The mid-world join and travel graph are explicit.
10. Indoor and outdoor map semantics are explicit.
11. Durable NPCs have stable IDs.
12. Six NPCs per start have full canned talk trees.
13. Hub chatter is canned rather than improvised.
14. Opening choices include a stake.
15. HookArc flags are named.
16. Retry fingerprints include goal, tactic, obstacle, revelation, and consequence.
17. The primary start has 18 authored quest beats.
18. Quest objectives use code-completeable verbs.
19. Rewards are real numeric values.
20. Divergence records preserve player walk-aways.
21. Combat species have numeric HP, attack, and AC.
22. No Saltkin-named creature exists.
23. Loot is personal and economy wallets are separated.
24. Repair cost is explicit.
25. The soloable five-room instance describes rooms before creatures.
26. The ten-person big instance has three phases.
27. Checkpoints and lockouts are explicit.
28. Progression has 14 non-paid nodes.
29. Daily contracts are capped.
30. UI labels and ten opening hooks are present.
31. Clone risks and avoidance calls are present.
32. Speculative tuning is marked.
