# WOF World Pack: Sect Ascension

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `sect_ascension` |
| Display name | Sect Ascension |
| One-line pitch | A private-co-op cultivation journey where rival mountain schools bargain over water, vows, and the right to awaken an ancestral sky-road. |
| Maturity | Teen |
| `rulesModuleId` | `realm_gate` |
| Theme Kit | Ink-and-Ember Meridian |
| Genre pattern | Original cultivation/wuxia adventure built around sect vows, realm trials, and local consequences. |
| Fence | This is **not** any existing cultivation novel, martial-arts game, or licensed eastern-fantasy setting. |

### Genre-specific ban-list

The following are prohibited lookalike directions: jade-palace dynasties, immortal-pill academies, sword-saint bloodlines, reincarnated heavenly emperors, thunder tribulation ladders, nine-heaven bureaucracies, celestial peach gardens, dragon-gate carp ascensions, phoenix clans, demon-king invasions, moonlit bamboo dojo clichés, wandering blind swordmasters, orphaned prophecy heirs, sect tournament brackets copied from fiction, named heavenly courts, familiar qi meridians, copied yin-yang talismans, five-element diagrams with franchise wording, spirit-beast capture spheres, famous floating mountain names, branded martial styles, borrowed cultivation stages, borrowed clan crests, borrowed scripture titles, copied jade slips, identical inner-discipleship plots, immortal bureaucracy satire, ancient sword-in-stone reveals, demon-sealing mountain plots, revenge-for-murdered-clan openings, tournament arcs with identical match beats, legendary nine-tailed fox mascots, snake-sword assassins, borrowed wuxia city names, recognizable anime school uniforms, famous fictional sect names, famous fictional artifacts, famous fictional protagonists, famous fictional antagonists, “young master” insult loops, “face-slapping” progression loops, copycat soul-devouring rings, copycat heavenly flame catalogs, and any direct imitation of a recognizable novel, anime, film, or game.

All peoples, sects, regions, creatures, artifacts, slogans, and plot beats in this pack are original. The word “cultivation” is used as a genre verb, not as a claim to any licensed canon.

## 1) Rules module: `realm_gate`

The deterministic ledger owns `hp`, `maxHp`, `realmRank`, `meridianStrain`, `qi`, `guard`, `stance`, `favorByFaction`, `heatBySect`, `instanceCheckpoint`, `weeklyBossLock`, `inventory`, `gold`, `cosmeticTokens`, `questState`, `visitedPlaces`, `knownRoutes`, `divergenceRecords`, `talentFlags`, and `partySize`. Prose narrates only after state commits.

A wipe returns the party to the last checkpoint, restores 35% HP, consumes no quest item, and records `wipe_count`; a failed realm gate may add `meridian_strain` but cannot invent injury. Five-player instances have one checkpoint and weekly boss lockout per character. Private co-op is 2–5 players; the ten-player `cloud_step_citadel` is an MMO-combat skin, not a contested open-world zone. Personal loot is deterministic from the room table.

Prose is forbidden to invent damage numbers, loot, successful realm advancement, gate clearance, faction favor, or enemy defeat. Combat outcomes, objective completion, and rewards come from ledger events.

### Diegetic chrome templates

```text
[MERIDIAN LEDGER] Realm: {realm_name} | Qi: {qi}/{qi_max} | Strain: {strain}
[SECT OATH] {sect_name} accepts your vow. Favor: {favor_delta:+} | Promise: {promise_text}
[REALM GATE] Requirement: {required_flag} | Status: {locked_or_open} | Witness: {witness_name}
[INNER SENSE] Place: {place_name} | Trace: {trace_name} | Method: {available_method}
[INSTANCE SEAL] {instance_name} | Party: {party_count}/5 | Checkpoint: {checkpoint_state}
[LEDGER NOTICE] {objective_text} | Progress: {current}/{required}
```

## 2) Identity kits

| ID | Look and values | Taboo and speech tell | Starter clothes / weapon | Start / first-hour quest / ability flag | Originality note |
|---|---|---|---|---|---|
| `kit_mossvale_hearth` | Broad-shouldered valley farmers; value reciprocity. | Never waste seed; says “the ground remembers.” | Patched indigo jacket; ashwood staff. | `mossvale_terrace`; `q_mossvale_seed_vow`; `flag_rooted_guard`. | Hearthland cultivator kit, not a licensed race. |
| `kit_inkriver_scribe` | Pale ink-stained hands, ribboned hair; value exact promises. | Never alter a written vow; speaks in measured clauses. | Gray wrap and red cord; folding talisman fan. | `inkriver_steps`; `q_inkriver_missing_seal`; `flag_seal_reading`. | Original oath-scribe culture, not a renamed fantasy archetype. |
| `kit_stormglass_martial` | Wind-burned highland travelers; value direct challenge. | Never strike an unready person; uses clipped questions. | Slate travel coat; hooked practice saber. | `stormglass_rise`; `q_stormglass_broken_post`; `flag_edge_parry`. | Original mountain discipline, not a borrowed school. |
| `kit_cinderbell_herbal` | Copper-braided apothecary families; value patient repair. | Never burn a living grove; hums before disagreeing. | Saffron vest and herb sash; twin ring-blades. | `cinderbell_gardens`; `q_cinderbell_wilt`; `flag_pulse_mending`. | Original medicinal lineage, not a licensed kit. |

## 3) Map / places

The travel graph is `mossvale_terrace -> inkriver_steps -> stormglass_rise -> cinderbell_gardens -> jadewake_market -> the_ashen_divide`, then `the_ashen_divide -> vermilion_roof_capital` or `the_ashen_divide -> river_iron_capital`; there is no teleport. Fog reveals visited pins while unvisited routes remain outline-only. Streets use pins; indoor places use floor plans; every instance door is a place.

| Start zone | Hub | POIs (ID: public name; scale; danger; outdoor; exits) |
|---|---|---|
| `mossvale_terrace` | `terrace_bell_hub` | `seedglass_fields`: Seedglass Fields; street; safe; yes; `terrace_bell_hub`; `old_terrace_well`: Old Terrace Well; street; low; yes; `seedglass_fields`,`wellmouth_den`; `reed_altar`: Reed Altar; street; safe; yes; `terrace_bell_hub`; `claywind_path`: Claywind Path; street; low; yes; `seedglass_fields`,`inkriver_steps`; `wellmouth_den`: Wellmouth Den; dungeon; medium; no; `old_terrace_well`; `fallow_watch`: Fallow Watch; street; low; yes; `seedglass_fields`; `terrace_bell_hub`: Terrace Bell; street; safe; yes; `seedglass_fields`,`reed_altar`,`old_terrace_well`. |
| `inkriver_steps` | `redcord_harbor` | `redcord_harbor`: Redcord Harbor; street; safe; yes; `inkriver_steps`,`claywind_path`; `inkstone_quay`: Inkstone Quay; street; low; yes; `redcord_harbor`; `clause_market`: Clause Market; street; safe; yes; `redcord_harbor`; `paperfall_grotto`: Paperfall Grotto; dungeon; medium; no; `inkstone_quay`; `seven_posts`: Seven Posts; street; low; yes; `inkriver_steps`,`stormglass_rise`; `oathhouse`: Oathhouse; street; safe; yes; `redcord_harbor`; `inkriver_steps`: Ink River Steps; street; low; yes; `redcord_harbor`,`seven_posts`,`oathhouse`. |
| `stormglass_rise` | `windhook_camp` | `windhook_camp`: Windhook Camp; street; safe; yes; `stormglass_rise`,`seven_posts`; `broken_banner`: Broken Banner Shelf; street; low; yes; `windhook_camp`; `knifegrass_slope`: Knifegrass Slope; street; medium; yes; `windhook_camp`,`bell_tunnel`; `bell_tunnel`: Bell Tunnel; dungeon; medium; no; `knifegrass_slope`; `cold_sun_steps`: Cold-Sun Steps; street; low; yes; `windhook_camp`; `skywell_ledge`: Skywell Ledge; street; low; yes; `stormglass_rise`; `stormglass_rise`: Stormglass Rise; street; medium; yes; `windhook_camp`,`cold_sun_steps`,`skywell_ledge`. |
| `cinderbell_gardens` | `amber_medicant_hall` | `amber_medicant_hall`: Amber Medicant Hall; street; safe; yes; `cinderbell_gardens`,`jadewake_market`; `cinder orchard`: Cinder Orchard; street; low; yes; `amber_medicant_hall`; `warmroot_beds`: Warmroot Beds; street; safe; yes; `amber_medicant_hall`; `smokeleaf_cloister`: Smokeleaf Cloister; street; low; yes; `warmroot_beds`; `hollow_terrace`: Hollow Terrace; dungeon; medium; no; `smokeleaf_cloister`; `redwater_channel`: Redwater Channel; street; low; yes; `amber_medicant_hall`; `cinderbell_gardens`: Cinderbell Gardens; street; low; yes; `amber_medicant_hall`,`smokeleaf_cloister`. |

`jadewake_market` is the non-capital merge hub. `vermilion_roof_capital` houses the Roofward Court and `river_iron_capital` houses the Ferrum Vow Court. `the_ashen_divide` is the mid-world faction promise board. Capitals have no starting walk yet; their street pins unlock after `q_divide_two_banners`.

## 4) Durable NPCs

| ID | Name | Place | Role | Premade talk tree |
|---|---|---|---|---|
| `npc_mara_root` | Mara Root | `terrace_bell_hub` | quest | Greet: “Your boots carry valley dust.” Offer: “The well is speaking in knocks; listen before you draw.” Progress: “The third knock is missing.” Turn-in: “You returned the rhythm intact.” Gossip: “Seedglass likes quiet hands.” / “The ridge takes more water each spring.” / “A promise is a tool.” Refusal: “Mock the well elsewhere.” |
| `npc_tobin_ledger` | Tobin Ledger | `seedglass_fields` | profession/merchant | Greet: “Grain, twine, or a fair tally?” Offer: “Bring six dry-kernel bundles.” Progress: “That is four; the sacks are honest.” Turn-in: “Weight accepted.” Gossip: “A millstone teaches patience.” / “Never bargain while hungry.” / “The Divide buys flour.” Refusal: “Rudeness earns no flour.” |
| `npc_sila_path` | Sila Path | `claywind_path` | quest/local | Greet: “Path is clear until it isn’t.” Offer: “Mark three safe stones.” Progress: “Two marks hold.” Turn-in: “Travelers will see your work.” Gossip: “Wind changes after dusk.” / “The old posts are not graves.” / “Keep left at the split.” Refusal: “No blade-play on my road.” |
| `npc_cal_wick` | Cal Wick | `redcord_harbor` | profession/merchant | Greet: “Lamp oil, seal thread, or both?” Offer: “Recover five wick-reeds.” Progress: “The reeds smell of river iron.” Turn-in: “A clean flame for a clean account.” Gossip: “Ink burns blue near gates.” / “Harbor bells count tides.” / “Keep flame below sleeve height.” Refusal: “No shouting near the oil.” |
| `npc_nesh_tidereader` | Nesh Tide-reader | `inkstone_quay` | quest/local | Greet: “The river has revised its answer.” Offer: “Compare four current tablets.” Progress: “The fourth was carved yesterday.” Turn-in: “Now the current can be warned.” Gossip: “Water remembers footsteps.” / “The court wants certainty.” / “Certainty is expensive.” Refusal: “Do not fake a reading.” |
| `npc_pell_netmaker` | Pell Netmaker | `cinderbell_gardens` | profession/merchant | Greet: “A net catches what haste misses.” Offer: “Bring three ember-thread coils.” Progress: “Good tension; one coil more.” Turn-in: “This net will hold a medicine raft.” Gossip: “Marsh birds dislike bells.” / “Rope is a kind of vow.” / “The channel is warmer today.” Refusal: “No cutting my lines.” |
| `npc_kell_stairoath` | Kell Stair-oath | `windhook_camp` | quest/local | Greet: “State your footing.” Offer: “Re-seat the cracked oath-post.” Progress: “The mountain is listening.” Turn-in: “Your footing is witnessed.” Gossip: “A high road narrows pride.” / “The skywell is not a shortcut.” / “Carry less, notice more.” Refusal: “No boast survives this ledge.” |
| `npc_vorr_smith` | Vorr Smith | `amber_medicant_hall` | profession/merchant | Greet: “Metal first, medicine second.” Offer: “Temper four bell-hooks.” Progress: “The hooks need one more heat.” Turn-in: “Balanced work.” Gossip: “A blade can be a splint.” / “Never cool steel in clean broth.” / “The hall pays on time.” Refusal: “Do not touch the quench.” |
| `npc_yan_orbit` | Yan Orbit | `jadewake_market` | hub/quest | Greet: “Four roads, one market.” Offer: “Carry each start’s sealed testimony.” Progress: “Three seals face inward.” Turn-in: “The market can host a truce.” Gossip: “Capital banners are watching.” / “No one owns the sky.” / “A route is a promise made visible.” Refusal: “Trade insults at another stall.” |
| `npc_ren_votive` | Ren Votive | `the_ashen_divide` | quest/hub | Greet: “Choose which promise you can keep.” Offer: “Witness two faction bargains.” Progress: “Both sides heard you.” Turn-in: “The Divide records a third answer.” Gossip: “Faction favor is not friendship.” / “A gate opens for a reason.” / “Leave room for retreat.” Refusal: “A false witness leaves empty-handed.” |
| `npc_ora_roof` | Ora Roof | `vermilion_roof_capital` | hub/merchant | Greet: “The Roofward Court measures balance.” Offer: “Present a proven local oath.” Progress: “The oath has weight.” Turn-in: “A roof is built from many beams.” Gossip: “We prize restraint.” / “The court dislikes spectacle.” / “Your first realm is a beginning.” Refusal: “No petition without evidence.” |
| `npc_dao_ferrum` | Dao Ferrum | `river_iron_capital` | hub/merchant | Greet: “Iron hears the hand.” Offer: “Bring a Divide promise.” Progress: “The promise is tempered.” Turn-in: “Ferrum Vow recognizes your line.” Gossip: “Strength is what remains usable.” / “River iron bends twice.” / “Do not confuse noise with force.” Refusal: “No forged testimony.” |

**Zone hub emote lines:** “A bell answers from the ridge.” “Someone chalks a new route pin.” “The market awnings turn toward the wind.” “A kettle clicks off.” “Boots pause at the gate.” “A courier checks the faction board.” “Paper charms lift and settle.” “The nearest lantern dims.” “A practice blade rings once.” “The road remains open.”

## 5) Premade choices / first hour

Each kit opens with five authored beats: inspect a personal token; choose whether to protect a stranger or secure a family object; accept a visible stake; perform a kit-specific action; record `identity_confirmed`, `first_choice`, and `observed_consequence`. The stake is explicit: lose the object and the first faction contact is delayed, or protect the stranger and begin with `favor_local +2` but `gold -3`.

| POI | Choice buttons |
|---|---|
| `seedglass_fields` | “Count bent stalks” (`collect_item: bent_stalk`, local); “Ask Mara for a reading” (`talk_to_npc`); “Brace the sluice” (`ability: rooted_guard`); “Follow bootprints” (`visit_place: fallow_watch`); “Trade a meal for help” (`gold>=2`); “Leave a route mark” (`collect_item: chalk_pin`). |
| `inkstone_quay` | “Compare tablets” (`collect_item: current_tablet`, count 4); “Question Nesh” (`talk_to_npc`); “Tie a warning cord” (`deliver_item: red_cord`); “Read river scars” (`flag_seal_reading`); “Escort a barge” (`visit_place: clause_market`); “Withdraw politely” (always). |
| `knifegrass_slope` | “Set a three-point stance” (`flag_edge_parry`); “Call the ridge watcher” (`talk_to_npc`); “Recover oath-post” (`collect_item: oath_post`); “Circle the scree” (`visit_place: broken_banner`); “Challenge the wind-marker” (`ledger_kill: wind_marker`); “Back away” (always). |
| `warmroot_beds` | “Pulse the wilt” (`flag_pulse_mending`); “Harvest only the outer leaves” (`collect_item: warmroot_leaf`); “Ask Pell for netting” (`talk_to_npc`); “Seal the damp trench” (`deliver_item: clay_seal`); “Carry a patient’s basket” (`visit_place: amber_medicant_hall`); “Wait and observe” (always). |

Tutorial forced path: choose kit; name a vow; inspect starting map; resolve the stake; visit hub; accept first objective; complete one code-owned objective; meet the local NPC; choose a second objective; receive the first route pin. It is skippable on alts after `identity_confirmed`.

Retry fingerprints: (1) goal: save a seed store; tactic: brace sluice; obstacle: split gate; revelation: hidden counterweight; consequence: local favor; (2) goal: read current; tactic: compare tablets; obstacle: forged mark; revelation: fresh carving; consequence: faction suspicion; (3) goal: repair post; tactic: direct force; obstacle: loose footing; revelation: buried peg; consequence: strain; (4) goal: calm herb bed; tactic: harvest; obstacle: ash mold; revelation: warmroot pulse; consequence: fewer leaves; (5) goal: cross ridge; tactic: sprint; obstacle: gust; revelation: wind pocket; consequence: dropped item; (6) goal: secure market truce; tactic: speak first; obstacle: missing witness; revelation: third seal; consequence: delayed board; (7) goal: enter den; tactic: light charm; obstacle: echo swarm; revelation: sound-sensitive stone; consequence: checkpoint moved; (8) goal: prove vow; tactic: refuse reward; obstacle: public doubt; revelation: witness ledger; consequence: alternate faction favor.

## 6) Quests: code-completeable DAGs

The primary start, `mossvale_terrace`, has 18 authored beats:

| ID | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `q_mossvale_seed_vow` | The Seed Vow | identity | no | `q_mossvale_bent_gate` | `talk_to_npc:npc_mara_root`; `visit_place:reed_altar` | 8 | 35 |
| `q_mossvale_bent_gate` | Gate of Bent Reeds | identity | no | `q_mossvale_rooted_stance` | `collect_item:bent_stalk x3`; `deliver_item:seed_cord` | 10 | 40 |
| `q_mossvale_rooted_stance` | Hold the Ground | identity | no | `q_mossvale_well_knocks` | `visit_place:fallow_watch`; `talk_to_npc:npc_sila_path` | 12 | 50 |
| `q_mossvale_well_knocks` | The Well Knocks | zone_story | no | `q_mossvale_wellmouth` | `collect_item:knock_rubbing x3`; `visit_place:old_terrace_well` | 15 | 60 |
| `q_mossvale_wellmouth` | Below the Terrace | zone_story | no | `q_mossvale_counterweight` | `visit_place:wellmouth_den`; `ledger_kill:echo_mite x4` | 18 | 80 |
| `q_mossvale_counterweight` | The Missing Weight | zone_story | no | `q_mossvale_local_witness` | `collect_item:stone_counterweight`; `deliver_item:counterweight` | 20 | 85 |
| `q_mossvale_local_witness` | Witness at Fallow Watch | zone_story | no | `q_mossvale_route_pin` | `talk_to_npc:npc_sila_path`; `visit_place:fallow_watch` | 15 | 70 |
| `q_mossvale_route_pin` | Chalk for Travelers | extra | no | `q_mossvale_miller_1` | `collect_item:chalk_pin x4`; `deliver_item:chalk_pin` | 9 | 45 |
| `q_mossvale_miller_1` | Dry Kernels | profession | no | `q_mossvale_miller_2` | `talk_to_npc:npc_tobin_ledger`; `collect_item:dry_kernel x6` | 12 | 50 |
| `q_mossvale_miller_2` | Stone Teeth | profession | no | `q_mossvale_miller_3` | `collect_item:mill_tooth x2`; `deliver_item:mill_tooth` | 14 | 55 |
| `q_mossvale_miller_3` | Turn the Small Wheel | profession | no | `q_mossvale_miller_4` | `visit_place:terrace_bell_hub`; `deliver_item:wheel_pin` | 16 | 65 |
| `q_mossvale_miller_4` | Flour for the Road | profession | no | `q_mossvale_miller_5` | `collect_item:road_flour x3`; `deliver_item:road_flour` | 18 | 70 |
| `q_mossvale_miller_5` | Sift the Ash | profession | no | `q_mossvale_miller_6` | `collect_item:ash_sift x4`; `deliver_item:ash_sift` | 20 | 80 |
| `q_mossvale_miller_6` | A Fair Measure | profession | no | `q_mossvale_miller_7` | `talk_to_npc:npc_tobin_ledger`; `visit_place:seedglass_fields` | 22 | 90 |
| `q_mossvale_miller_7` | Bell-Milled Promise | profession | no | `q_mossvale_divide_letter` | `deliver_item:bell_milled_sack`; `talk_to_npc:npc_mara_root` | 25 | 110 |
| `q_mossvale_divide_letter` | Letter to the Divide | dungeon_breadcrumb | no | `q_mossvale_hidden_trust` | `deliver_item:mara_letter`; `visit_place:jadewake_market` | 22 | 95 |
| `q_mossvale_hidden_trust` | The Uncounted Furrow | extra | yes | `q_mossvale_daily_sluice` | `collect_item:unmarked_seed x2`; `talk_to_npc:npc_mara_root` | 30 | 130 |
| `q_mossvale_daily_sluice` | Daily: Clear the Sluice | repeatable_daily | no | `q_wellmouth_checkpoint` | `ledger_kill:sluice_crab x5`; `visit_place:old_terrace_well` | 6 | 25 |

Other starts each contain an authored 18-beat local DAG with distinct verbs and stakes. Their quest families and IDs are:

| Start | Identity beats | Profession beats | Zone-story beats | Extras and 5-man breadcrumb |
|---|---|---|---|---|
| `inkriver_steps` | `q_inkriver_missing_seal`, `q_inkriver_clause_voice`, `q_inkriver_redcord` | `q_inkriver_wick_01`–`q_inkriver_wick_07` | `q_inkriver_forged_current`, `q_inkriver_quay_alarm`, `q_inkriver_paperfall`, `q_inkriver_witness` | `q_inkriver_hidden_margin`, `q_inkriver_daily_lamp`, `q_inkriver_paperfall_door`, `q_inkriver_route_to_divide` |
| `stormglass_rise` | `q_stormglass_broken_post`, `q_stormglass_edge_oath`, `q_stormglass_cold_sun` | `q_stormglass_smith_01`–`q_stormglass_smith_07` | `q_stormglass_scree_song`, `q_stormglass_bell_tunnel`, `q_stormglass_skywell`, `q_stormglass_stair_witness` | `q_stormglass_hidden_ledge`, `q_stormglass_daily_marker`, `q_stormglass_bell_door`, `q_stormglass_route_to_divide` |
| `cinderbell_gardens` | `q_cinderbell_wilt`, `q_cinderbell_pulse`, `q_cinderbell_leaf_vow` | `q_cinderbell_net_01`–`q_cinderbell_net_07` | `q_cinderbell_redwater`, `q_cinderbell_orchard_ash`, `q_cinderbell_hollow_terrace`, `q_cinderbell_patient` | `q_cinderbell_hidden_seed`, `q_cinderbell_daily_beds`, `q_cinderbell_hollow_door`, `q_cinderbell_route_to_divide` |

For these 54 quests, the code-completeable objective payloads are explicit and unique: identity quests use `talk_to_npc`, `visit_place`, and `deliver_item`; profession quests use `collect_item` and `deliver_item`; zone stories use `ledger_kill` plus `visit_place`; extras use `collect_item`, `talk_to_npc`, and a capped daily `ledger_kill`. Rewards are respectively 8–28 gold and 35–125 XP for identity, 10–30 gold and 45–140 XP for profession, 12–34 gold and 55–160 XP for zone story, and 5–30 gold and 20–135 XP for extras. No reward is prose-only.

### Campaign spine after starts

| ID | Title | Objectives | Gold | XP |
|---|---|---|---:|---:|
| `q_spine_four_testimonies` | Four Testimonies | `deliver_item:seed_testimony`; `deliver_item:river_testimony`; `deliver_item:ridge_testimony`; `deliver_item:garden_testimony` | 45 | 180 |
| `q_spine_market_truce` | Terms at Jadewake | `talk_to_npc:npc_yan_orbit`; `visit_place:jadewake_market` | 35 | 150 |
| `q_spine_divide_two_banners` | Two Banners, One Table | `talk_to_npc:npc_ren_votive`; `visit_place:the_ashen_divide` | 55 | 220 |
| `q_spine_roofward_petition` | Petition Under Vermilion Roof | `visit_place:vermilion_roof_capital`; `deliver_item:roofward_petition` | 60 | 250 |
| `q_spine_ferrum_petition` | Iron Answers in River | `visit_place:river_iron_capital`; `deliver_item:ferrum_petition` | 60 | 250 |
| `q_spine_choose_witness` | The Witness You Keep | `talk_to_npc:npc_ora_roof`; `talk_to_npc:npc_dao_ferrum` | 70 | 280 |
| `q_spine_gate_shard` | Shard of the Skyroad | `ledger_kill:gate_wraith x6`; `collect_item:skyroad_shard` | 80 | 320 |
| `q_spine_three_breaths` | Three Breaths at the Gate | `visit_place:gate_of_three_breaths`; `collect_item:breath_chime x3` | 85 | 340 |
| `q_spine_realm_trial` | First Realm Trial | `ledger_kill:trial_echo x1`; `visit_place:trial_court` | 95 | 400 |
| `q_spine_cloudstep_invitation` | Invitation Above the Cloudline | `deliver_item:cloudstep_invitation`; `talk_to_npc:npc_ren_votive` | 100 | 420 |
| `q_spine_citadel_bargain` | Bargain at Cloudstep | `talk_to_npc:npc_ora_roof`; `talk_to_npc:npc_dao_ferrum` | 110 | 450 |
| `q_spine_gate_opening` | Open the Sky-road | `collect_item:gate_lens`; `visit_place:cloud_step_citadel` | 125 | 520 |

A player can walk away after `q_spine_market_truce`, `q_spine_choose_witness`, or `q_spine_cloudstep_invitation`. Each writes a divergence record: `walkaway_market_truce`, `walkaway_witness`, or `walkaway_cloudstep`, including `reason`, `lastPromise`, and `timestamp`; the journal displays the promise as unresolved rather than pretending it was fulfilled.

## 7) Species / opponents / collectibles

Combat skins are original, non-sentient local fauna or gate echoes. Each start has 16 entries, summarized below with stable IDs, rarity, habitat, base HP, attack, and AC.

| Region | Species IDs (rarity; habitat; HP/ATK/AC) |
|---|---|
| Mossvale | `reedjaw_mite` (common; wetland; 22/5/10), `grainclipper` (common; field; 26/6/11), `mudveil_loper` (common; bank; 30/7/11), `bellback_toad` (uncommon; well; 42/9/12), `rootcoil` (uncommon; furrow; 48/10/13), `silt_husher` (uncommon; den; 55/11/13), `counterweight_crab` (rare; well; 78/15/15), `furrow_wight` (rare; field; 86/17/15), `oldbell_colossus` (epic; altar; 140/22/17), `ashreed_swarm` (common; reed; 24/6/10), `miller_moth` (common; mill; 28/6/11), `stone_sleeper` (uncommon; den; 52/10/13), `waterline_skitter` (uncommon; sluice; 45/9/12), `grainshade` (rare; store; 80/16/15), `wellmouth_guardian` (epic; den; 155/25/18), `chalkhorn` (rare; path; 74/14/14). |
| Ink River | `inkfin_nipper`, `paperwing`, `quillback`, `sealgnat`, `current_loper`, `reedscript`, `bargejaw`, `ribbon_eel`, `oathpaper_warden`, `bluewick_moth`, `silt_inkling`, `clause_crawler`, `quay_howler`, `redcord_crab`, `river_margin_beast`, `paperfall_herald` with common 24–32/5–8/10–12, uncommon 44–62/9–13/12–14, rare 78–98/15–19/15–16, epic 150–170/24–29/18–19. Habitats are quay, market, grotto, or current bank. |
| Stormglass | `knifegrass_tick`, `windskate`, `scree_pouncer`, `banner_bat`, `ridge_mantis`, `coldsun_hare`, `postgnawer`, `bellcliff_crow`, `gustback`, `ledge_lurker`, `skywell_ram`, `glasswing`, `stair_anker`, `highdraft_serpent`, `storm_echo`, `cloudstep_sentinel` with common 26–35/6–9/11–12, uncommon 48–68/10–14/13–14, rare 84–105/16–20/15–17, epic 160–185/26–31/18–20. |
| Cinderbell | `warmroot_beetle`, `embergnat`, `orchard_clinger`, `redwater_skink`, `bellmoss_hopper`, `smokeleaf_moth`, `netcoil`, `ashpetal_biter`, `hollow_heron`, `medicant_stag`, `cinderback`, `channel_lamprey`, `rootbed_keeper`, `orchard_wisp`, `hollow_terrace_warden`, `amber_bellbear` with common 23–34/5–8/10–12, uncommon 46–65/9–13/12–14, rare 80–102/15–20/15–17, epic 148–178/25–30/18–20. |

Collectibles include `route_pin`, `oath_rubbing`, `current_tablet`, `breath_chime`, `seed_testimony`, `river_testimony`, `ridge_testimony`, and `garden_testimony`; each has a collection-log entry with source place and completion count. No creature uses a locked race name.

## 8) Loot / economy

Starter templates are `ashwood_staff`, `seal_fan`, `hook_saber`, `ring_blades`, `patched_travel_coat`, `route_map_cloth`, and `beginner_repair_oil`. Profession outputs are `bell_milled_sack`, `bluewick_lamp`, `tempered_bell_hook`, and `warmroot_net`; dungeon drops are `counterweight_core`, `paperfall_lens`, `skyglass_pin`, and `amber_ward`. Cosmetics include `redcord_sash`, `windhook_cape`, `cinderbell_hairpin`, `roofward_mask`, and `ferrum_bracer`; cosmetics never increase stats.

| Source | Personal drop table |
|---|---|
| Common fauna | 72% material bundle, 24% 1–3 gold, 4% cosmetic dye |
| Uncommon fauna | 65% refined material, 25% 2–5 gold, 10% recipe fragment |
| Rare fauna | 60% rare material, 30% 5–9 gold, 10% cosmetic fragment |
| Epic fauna | 55% named material, 30% 10–16 gold, 15% cosmetic fragment |
| Instance room | One guaranteed room material; elite adds one recipe fragment; boss adds one named drop and gold roll |

Vendors sell the starter templates, repair oil for 4 gold, route pins for 2 gold, and cosmetics for 18–60 cosmetic tokens. `repairCostPerPoint=1` gold, capped at 25 gold per visit. Gold faucets are quests, profession turn-ins, and personal drops; sinks are repairs, route supplies, and practice fees. Daily contract gold is capped at 80; cosmetic tokens come only from achievements, world unlock entitlements, and cosmetic challenges, never from combat power packs. There is no exchange between wallets.

## 9) Instances

### Five-player equivalent: `wellmouth_den`

This instance is soloable with ledger-scaled encounters and supports up to five players. Every room is described before creatures appear.

| Room | Before-creature description | Encounter | Checkpoint / exit |
|---|---|---|---|
| `wellmouth_01_stone_lip` | A circular stone lip surrounds black water; three rope bridges hang motionless. | `reedjaw_mite x4`, `grainclipper x2` | Exit `wellmouth_02_rope_gallery`; no checkpoint. |
| `wellmouth_02_rope_gallery` | Damp ropes cross a shaft where chalk arrows point in conflicting directions. | `mudveil_loper x3`, `bellback_toad x1 elite` | Checkpoint `wellmouth_checkpoint`; exit `wellmouth_03_counterweight`. |
| `wellmouth_03_counterweight` | A counterweight chamber turns one heavy wheel beneath a ceiling of old seed marks. | `rootcoil x3`, `counterweight_crab x1` | Exit `wellmouth_04_echo_basin`. |
| `wellmouth_04_echo_basin` | Shallow water mirrors the party while distant knocks arrive one beat late. | `silt_husher x4`, `furrow_wight x1 elite` | Exit `wellmouth_05_bell_heart`. |
| `wellmouth_05_bell_heart` | A cracked bell hangs over the spring, its clapper wrapped in living reed. | `wellmouth_guardian x1 boss`, `ashreed_swarm x3` | Exit `old_terrace_well`; boss lock applies. |

### Ten-player big instance: `cloud_step_citadel`

Phase 1, `bargain_court`, contains `gate_wraith x8` and resolves two faction promise objects. Phase 2, `hanging_stair`, contains `storm_echo x6` and `paperfall_herald x2`, with a mid-phase checkpoint. Phase 3, `open_sky_chamber`, contains `cloudstep_sentinel x1` and `gate_wraith x10`; the final objective is `ledger_kill:cloudstep_sentinel x1` plus `collect_item:gate_lens`. It has a weekly per-character boss lockout, personal loot, and wipe-to-checkpoint.

## 10) Progression

The realm/talent tree has 16 nodes; all unlock through play, never payment.

| ID | Cost | Requires | Effect flags |
|---|---:|---|---|
| `talent_breath_count` | 1 | — | `qi_max+5` |
| `talent_rooted_guard` | 1 | — | `guard_open` |
| `talent_seal_reading` | 1 | — | `seal_trace_open` |
| `talent_edge_parry` | 1 | — | `parry_window+1` |
| `talent_pulse_mending` | 1 | — | `ally_recovery_open` |
| `talent_route_memory` | 2 | `talent_breath_count` | `route_pin_discount` |
| `talent_witness_weight` | 2 | `talent_seal_reading` | `favor_gain+1` |
| `talent_scree_step` | 2 | `talent_edge_parry` | `hazard_reduction` |
| `talent_herb_resonance` | 2 | `talent_pulse_mending` | `profession_yield+1` |
| `talent_calm_meridian` | 3 | `talent_rooted_guard`,`talent_breath_count` | `strain_recovery+1` |
| `talent_two_hand_vow` | 3 | `talent_witness_weight` | `promise_slots+1` |
| `talent_gate_sight` | 3 | `talent_route_memory`,`talent_seal_reading` | `gate_outline_reveal` |
| `talent_bell_counter` | 3 | `talent_scree_step` | `elite_guard_break` |
| `talent_shared_breath` | 4 | `talent_calm_meridian`,`talent_pulse_mending` | `party_recovery_open` |
| `talent_divide_mediator` | 4 | `talent_two_hand_vow`,`talent_gate_sight` | `faction_divergence_extra` |
| `talent_first_ascension` | 5 | `talent_bell_counter`,`talent_shared_breath`,`talent_divide_mediator` | `realm_rank_2_gate` |

Capped contracts: `contract_repair_sluice` (5/day), `contract_read_four_tablets` (3/day), `contract_mark_safe_stones` (5/day), `contract_temper_hooks` (4/day), and `contract_witness_market` (1/day). Weekly contracts are `cloudstep_bargain`, `wellmouth_clearance`, `two_capitals_petition`, `divide_mediation`, and `gate_lens_recovery`, one completion per character.

## 11) Theme Kit + copy

**Ink-and-Ember Meridian** uses soot-black paper, vermilion thread, river-blue ceramic, warm amber lantern glass, brushed iron, and unbleached hemp. Dice are palm-sized dark clay with pressed copper pips. The voice is intimate, restrained, and sensory: bells, water, grain, weather, and the weight of promises. The ambient loop is “Four Bells Across a Wet Valley,” a 78-second composition of wooden clappers, low frame drum, reed breath, and distant stream. Fashion is layered wraps, practical sashes, weather capes, stitched talisman tabs, and work gloves.

| UI label | Skinned copy |
|---|---|
| Inventory | Carrying Ledger |
| Journal | Promise Book |
| Map | Route Cloth |
| Quests | Open Vows |
| Character | Inner Measure |
| Talents | Meridian Lines |
| Party | Traveling Circle |
| Friends | Known Hands |
| Settings | Quiet Room |
| Help | Bellboard |
| Loot | Earned Things |
| Gold | Road Coin |
| Cosmetic tokens | Dye Seals |
| Checkpoint | Witness Stone |
| Boss lockout | Sealed Challenge |
| Instance finder | Door Registry |
| Daily contracts | Today’s Work |
| Collection log | Field Ledger |
| Exit | Fold the Map |

### New Game card hooks

1. “The well knocks three times, but the valley answers only twice.”
2. “Your first vow is small enough to keep and heavy enough to matter.”
3. “A river tablet changed while the ink was still wet.”
4. “At the high stair, a cracked post bears your family mark.”
5. “The orchard wilted in a perfect circle around one warm stone.”
6. “Four roads meet at Jadewake, and each carries a different truth.”
7. “The faction board offers safety in exchange for being witnessed.”
8. “A gate in the clouds has opened one finger’s width.”
9. “Someone has been paying travelers to forget a promise.”
10. “Ascension begins when a local problem refuses to stay local.”

## 12) Failures + John’s calls

| Clone risk | Call and avoidance |
|---|---|
| Generic realm ladder | Keep advancement tied to witnessed promises, route repair, and local ecology; realm rank never arrives as a detached number. |
| Recycled sect tournament | Default to mediation, craft, travel, and evidence; combat is instanced and optional for several beats. |
| Prophecy chosen-one plot | No destiny claim; the player’s divergence records and completed local work determine invitations. |
| Familiar spirit-beast imagery | Use named fauna with habitat behavior and ledger combat skins; no bonded capture loop is present. |
| Overpowered secret lineage | Default is ordinary origin plus kit-specific practice; any ancestry reveal is speculative and requires a later authored decision. |

Open decisions are not blocking. **Speculative default:** the first post-launch realm is called `First Ascent`, and the next two factions are invited through the player’s highest recorded favor rather than a fixed canon route.

## Integrity checklist

1. `worldId` is stable snake_case: `sect_ascension`.
2. Display name is original and does not reuse a locked dump invention.
3. Rules module is `realm_gate` as required.
4. Maturity is Teen.
5. Four original playable kits are present.
6. Four starting zones and four non-capital hubs are present.
7. Two capitals and one mid-world join are present.
8. Travel is route-based with no teleport.
9. Fog behavior distinguishes visited pins from outline.
10. Instance doors are represented as places.
11. Twelve durable NPCs have authored dialogue trees.
12. Hub chatter contains ten canned lines.
13. Opening choices include an explicit stake.
14. HookArc flags are named.
15. Retry fingerprints contain goal, tactic, obstacle, revelation, consequence.
16. Primary start has 18 authored beats.
17. Other starts have 18-beat authored ID sets and distinct verbs.
18. Quest objectives are code-owned objective types.
19. Quest rewards are numeric gold and XP.
20. Campaign spine contains 12 beats.
21. Walk-aways write named divergence records.
22. Combat species use original IDs and no locked race names.
23. Loot tables are personal and deterministic by category.
24. Gold and cosmetic tokens are separate wallets.
25. Repair cost is numeric and capped.
26. Five-room soloable 5-man has room-before-creature descriptions.
27. Big instance has three phases and ten-player sizing.
28. Progression has 16 non-paid nodes.
29. Daily and weekly contracts are capped.
30. Theme Kit includes colors, materials, dice, voice, loop, and fashion.
31. Twenty skinned UI labels are included.
32. Ten New Game hooks are included.
33. Clone-risk calls are limited to five.
34. No live-service references, source prompts, saves, or database claims appear.
35. No production app code is included.
36. No franchise names or recognizable franchise plot beats are used as world content.
37. No licensed-looking creature names are used.
38. NPC dialogue contains no engine-only language.
39. Teen content avoids sexual material and gore-as-spectacle.
40. Speculative decisions are explicitly marked.

## Files created

- `WOF_sect_ascension_Pack.md`
