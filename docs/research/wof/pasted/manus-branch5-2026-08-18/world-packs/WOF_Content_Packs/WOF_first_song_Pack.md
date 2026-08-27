# WOF World Pack: First-Song

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `first_song` |
| Display name | First-Song |
| One-line pitch | Four original peoples cross a living archipelago to stop a court-bred relic from turning remembered promises into commands. |
| Maturity | Teen |
| `rulesModuleId` | `hp_check` |
| Theme Kit | `first_song_vellum_and_resonance` |

**Genre pattern and fence.** This is an original fellowship-and-courts fantasy about memory, music, and negotiated promises; **this is not any named high-fantasy franchise, quest, artifact, map, race, or plot.** All peoples, places, relics, courts, creatures, slogans, and events below are original creations. Folklore is used only as broad atmosphere.

**Genre-specific ban-list.** The content team must reject references or generated variants resembling: Shire, Mordor, Gondor, Rivendell, Minas Tirith, Moria, Isengard, Orthanc, Middle-earth, Hobbit, Istari, Balrog, Nazgûl, Sauron, Frodo, Aragorn, Legolas, Gimli, Gandalf, or any renamed ring-corruption plot; Stormwind, Orgrimmar, Azeroth, Horde, Alliance, Warcraft, WoW, Lich King, Arthas, Illidan, Azerothian; Hogwarts, Gryffindor, Slytherin, Hufflepuff, Ravenclaw, wand school; Hyrule, Triforce, Zelda, Link, Midgar, Gaia, Eorzea, Final Fantasy, Dragon Quest, Tamriel, Skyrim, Morrowind, Baldur’s Gate, Faerûn, Dungeons & Dragons, Neverwinter, Dragonlance, Warhammer, Narnia, Westeros, Game of Thrones, Eragon, Wheel of Time, Dark Souls, Elden Ring, The Witcher, Runeterra, Piltover, Zaun, Arcane, Avatar: The Last Airbender, or any licensed creature, character, artifact, or slogan.

## 1) Rules module: `hp_check`

The ledger owns current and maximum HP, armor class, action points, stamina, conditions, quest ticks, item quantities, gold, cosmetic tokens, instance seed, checkpoint, weekly boss lockout, faction standing, corruption, and divergence records. Prose may describe sensation and consequence only after a committed state change.

| State | Resolution |
|---|---|
| Combat | A coded action compares ability flags, weapon tags, target AC, and a seeded roll; HP and conditions commit before narration. |
| Wipe | The party returns to the latest checkpoint with committed quest progress intact; consumables used since checkpoint are restored only if the instance rule says so. |
| Checkpoint | Room `glassway_checkpoint` records party position and opens a return door. |
| Lockout | The named-evil 10-person instance has one clear reward roll per character per weekly cycle; the fellowship instance has no weekly lockout. |
| Economy | Gold buys functional goods and repairs; cosmetic tokens buy appearance, emotes, and housing trim only. |
| Party | Solo play is supported; private co-op supports 2–5. The large instance supports 10. |

Narration is forbidden to invent damage numbers, loot, reward quantities, successful checks, relic corruption, boss clears, or quest completion. It is also forbidden to promise an uncommitted consequence.

### Diegetic chrome templates

```text
[RESONANCE LEDGER] HP {current}/{max} | Guard {guard} | Condition: {condition}
[OATH THREAD] {quest_title} | {objective_label}: {current}/{required}
[CHORAL MAP] {place_name} | Exits revealed: {revealed_count}/{exit_count} | Outline fog: {outline_state}
[RELIC PRESSURE] {relic_name} | Corruption {corruption}/100 | Next threshold: {threshold}
[COURT NOTICE] {court_name} | Standing {standing} | Promise owed: {promise}
[INSTANCE SEAL] {instance_name} | Checkpoint {checkpoint_id} | Reward eligible: {eligible}
```

## 2) Identity kits

First-Song has four original peoples. They are not renamed versions of another setting’s races: each is defined by a distinct relationship to sound, memory, craft, and land.

| Kit ID | Look and values | Taboo and speech tell | Starter clothes / weapon | Start and first hour | Ability flag |
|---|---|---|---|---|---|
| `aurelian_weavers` | Copper-brown skin, filament-like hair cords, reflective irises; values careful testimony and communal repair. | Never repeat a promise you did not witness; they end claims with “as heard.” | Indigo wrapcoat, thread bracers, tuning knife. | `weft_meadow`; `weft_meadow_first_knot`. | `resonance_weave` — mark one ally action as witnessed, granting a small coded guard bonus once per encounter. |
| `mireglass_speakers` | Translucent freckles, broad pupils, reed ornaments; values patient listening and place-memory. | Do not interrupt a silence chosen by another; they use pauses as punctuation. | Waxed reed mantle, ankle bells, crescent sling. | `mireglass_basin`; `mireglass_first_echo`. | `echo_reading` — reveal one hidden interactable in a visited place. |
| `brassroot_clans` | Dense golden-brown skin, braided metalwood beads, square palms; values dependable labor and consent before binding. | Never fasten another person’s tool or garment without asking; their speech is clipped and practical. | Bark-leather vest, riveted sash, hand-axe. | `brassroot_steps`; `brassroot_weight`. | `grounded_stance` — ignore the first forced-movement effect each fight. |
| `moonfen_gliders` | Pale or deep umber skin, sail-like forearm membranes, luminous birthmarks; values free travel and reciprocal hospitality. | A host’s route may not be mocked; they often say “under your roof” before a request. | Light rain-cape, glide harness, hooked staff. | `moonfen_roost`; `moonfen_open_sky`. | `draft_skip` — cross one hazard tile without spending an action once per room. |

## 3) Map / places: full graph

The four starting homelands converge on `concord_harbor`, then divide into the two courts. The travel graph has no teleport: `weft_meadow` → `concord_harbor` → `ivory_court`; `mireglass_basin` → `concord_harbor` → `reed_court`; `brassroot_steps` → `concord_harbor` → `ivory_court`; `moonfen_roost` → `concord_harbor` → `reed_court`. Both courts connect to `hushed_confluence`, then to `crownless_choir` and `crownless_choir_depths`.

| ID | Public name | Zone | Scale / danger | Outdoor | Exits | NPCs | Instance |
|---|---|---|---|---|---|---|---|
| `weft_meadow` | Weft Meadow | `weft_meadow` | street / safe | yes | `threadbridge`, `concord_harbor` | `senn_ora`, `loomwarden_ves` | — |
| `threadbridge` | Threadbridge | `weft_meadow` | street / low | yes | `weft_meadow`, `bellroot_gully` | `loomwarden_ves` | `bellroot_gully_instance` |
| `bellroot_gully` | Bellroot Gully | `weft_meadow` | street / medium | yes | `threadbridge` | `senn_ora` | `bellroot_gully_instance` |
| `mireglass_basin` | Mireglass Basin | `mireglass_basin` | street / safe | yes | `reedwalk`, `concord_harbor` | `tala_morn`, `vicar_esh` | — |
| `reedwalk` | Reedwalk | `mireglass_basin` | street / low | yes | `mireglass_basin`, `silt_archive` | `tala_morn` | `silt_archive_instance` |
| `silt_archive` | Silt Archive | `mireglass_basin` | dungeon / medium | no | `reedwalk` | `vicar_esh` | `silt_archive_instance` |
| `brassroot_steps` | Brassroot Steps | `brassroot_steps` | street / safe | yes | `loadgate`, `concord_harbor` | `kett_rusk`, `forge_aunt_nema` | — |
| `loadgate` | Loadgate | `brassroot_steps` | street / low | yes | `brassroot_steps`, `understep_quarry` | `kett_rusk` | `understep_quarry_instance` |
| `understep_quarry` | Understep Quarry | `brassroot_steps` | dungeon / medium | no | `loadgate` | `forge_aunt_nema` | `understep_quarry_instance` |
| `moonfen_roost` | Moonfen Roost | `moonfen_roost` | street / safe | yes | `rainrail`, `concord_harbor` | `pava_rell`, `host_lyre` | — |
| `rainrail` | Rainrail | `moonfen_roost` | street / low | yes | `moonfen_roost`, `cloudroot_hollow` | `pava_rell` | `cloudroot_hollow_instance` |
| `cloudroot_hollow` | Cloudroot Hollow | `moonfen_roost` | dungeon / medium | no | `rainrail` | `host_lyre` | `cloudroot_hollow_instance` |
| `concord_harbor` | Concord Harbor | `concord_harbor` | street / safe | yes | all starts, `ivory_court`, `reed_court` | `harbormaster_ilan`, `scribe_noll` | — |
| `ivory_court` | Court of White Accord | `ivory_court` | street / safe | yes | `concord_harbor`, `hushed_confluence` | `regent_cassia`, `herald_ven` | — |
| `reed_court` | Court of Green Recall | `reed_court` | street / safe | yes | `concord_harbor`, `hushed_confluence` | `regent_owen`, `herald_mira` | — |
| `hushed_confluence` | Hushed Confluence | `mid_world` | street / low | yes | both courts, `crownless_choir` | `senn_ora`, `tala_morn`, `kett_rusk`, `pava_rell` | — |
| `crownless_choir` | Crownless Choir | `end_world` | dungeon / high | no | `hushed_confluence`, `crownless_choir_depths` | `the_unvoiced` | `crownless_choir_instance` |
| `crownless_choir_depths` | Depths of the Crownless Choir | `end_world` | dungeon / high | no | `crownless_choir` | `the_unvoiced` | `crownless_choir_raid` |

Street maps show pins only for visited POIs; unvisited routes remain outline fog. Indoor spaces use floor plans and room pins, never continent-scale overlays. Instance doors are the places ending in `_instance`, `_raid`, or a named room door.

## 4) Durable NPCs and premade talk

The six durable cross-zone NPCs below anchor the primary start while local caretakers appear in each homeland. All dialogue is canned and in-world.

| ID | Name | Place | Role |
|---|---|---|---|
| `senn_ora` | Senn Ora | `weft_meadow` | quest |
| `tala_morn` | Tala Morn | `mireglass_basin` | quest |
| `kett_rusk` | Kett Rusk | `brassroot_steps` | merchant |
| `pava_rell` | Pava Rell | `moonfen_roost` | quest |
| `harbormaster_ilan` | Harbormaster Ilan | `concord_harbor` | hub |
| `scribe_noll` | Scribe Noll | `concord_harbor` | merchant |

### Full talk trees

| NPC | Greet | Quest offer | Progress | Turn-in | Gossip (three lines) | Refusal / rude |
|---|---|---|---|---|---|---|
| Senn Ora | “The threads hum today. You heard it too.” | “A bellroot has swallowed our witness cord. Bring it back uncut.” | “The cord is warm; the gully is listening.” | “You returned a promise without tightening it. Good.” | “Weft folk dye truth blue.” / “The harbor counts footsteps.” / “Courts prefer tidy stories.” | “No knot, no claim. Come back when you can name what you saw.” |
| Tala Morn | “Let the basin finish speaking.” | “Three echo-reeds are repeating a stranger’s voice. Collect them.” | “Your basket rings with the right silence.” | “The basin may remember you kindly.” | “Mud keeps better records than stone.” / “A pause can be an answer.” / “Do not bargain with a reflection.” | “I will not reward a cut-off account. Listen again.” |
| Kett Rusk | “Weight first. Price second.” | “Escort my axle pins to Loadgate; count each one.” | “Nothing missing? Then we can deal.” | “A counted delivery is a trusted delivery.” | “Brassroot doors are built to be opened.” / “Loose tools become local legends.” / “The court taxes haste.” | “If you cannot carry the terms, do not carry the crate.” |
| Pava Rell | “Wind under you, traveler.” | “A rainrail sail is snagged above the hollow. Retrieve its marked panel.” | “The panel is marked; do not fold the mark.” | “A route returned is a guest welcomed.” | “Roosts are homes, not perches.” / “Clouds hide roads, not destinations.” / “Harbor bells travel far.” | “Mock the route again and you walk alone.” |
| Harbormaster Ilan | “Concord Harbor receives all who arrive honestly.” | “Carry the four homeland seals to the public ledger.” | “Four seals, four accounts. The courts will have to listen.” | “Your name is now legible at the harbor.” | “The courts share water, not conclusions.” / “Ships dislike unsaid debts.” / “The confluence is never quiet.” | “No forged seal enters my ledger.” |
| Scribe Noll | “Ink, cord, and a clean margin.” | “Deliver a blank vellum roll to each court clerk.” | “The margins remain blank. That is useful.” | “A blank page can survive a loud ruler.” | “I sell maps, not destiny.” / “Gold mends paper poorly.” / “Never let a relic edit your hand.” | “Rudeness earns silence and no ledger service.” |

**Local caretakers.** `loomwarden_ves`, `vicar_esh`, `forge_aunt_nema`, `host_lyre`, `regent_cassia`, `herald_ven`, `regent_owen`, `herald_mira`, and `the_unvoiced` are durable named NPCs with role-specific lines stored in the same fixed six-key schema; each has a greet, offer, progress, turn-in, three gossip lines, and refusal. Their authored signature lines are respectively: “The loom remembers pressure,” “Silt keeps a second voice,” “Every beam has a load,” “A roof is a promise,” “Accord is not obedience,” “White ink exposes edits,” “Recall is not ownership,” “Green ink grows around wounds,” and “You may keep your voice, if you can carry it.”

**Hub chatter (ten lines).** “A clean bell means safe passage.” “Keep left at the blue mooring.” “The courts sent another sealed cart.” “No one owns the harbor wind.” “Ask before touching a witness cord.” “The confluence lights at dusk.” “A traveler may refuse a promise.” “The old songs have missing verses.” “Mind the wet planks.” “Your footsteps are your own.”

## 5) Premade choices / first hour

Each kit opens with four authored beats: arrival image, personal origin, a choice with a visible stake, and a consequence that sets `identity_confirmed`, `first_choice`, and `observed_consequence`. The stake is explicit: protect a witness object and lose a valued route, or save the route and let a court clerk alter the record.

| Kit | Opening choice buttons and consequence |
|---|---|
| `aurelian_weavers` | `hold_the_cord` (requires `weft_meadow`; intent `protect`) keeps the witness cord and closes `threadbridge` for one beat; `cut_the_cord` (intent `sacrifice`) opens the bridge but records `cord_sacrificed`; `call_for_witness` (requires `talk_to_npc:senn_ora`; intent `appeal`) delays both and grants `witness_token`. |
| `mireglass_speakers` | `wait_for_basin_reply` (intent `listen`), `mark_the_reed` (requires `reedwalk`; intent `record`), `lead_the_child_home` (intent `protect`). The chosen button records `first_choice` and changes which echo appears in `mireglass_first_echo`. |
| `brassroot_clans` | `carry_the_axle` (intent `labor`), `secure_the_gate` (requires `loadgate`; intent `defend`), `ask_the_load` (intent `negotiate`). The unchosen task becomes a later side beat. |
| `moonfen_gliders` | `take_the_high_route` (requires `moonfen_roost`; intent `scout`), `guide_the_guest` (intent `host`), `fold_the_sail` (intent `repair`). Each records a route preference and alters one NPC greeting. |

**Per-POI choice deck examples.** At `threadbridge`: `inspect_witness_cord` (`collect_item:witness_cord`, investigate), `ask_senn_ora` (`talk_to_npc:senn_ora`, talk), `cross_slowly` (fight move unavailable; travel), `set_a_marker` (requires `marker_chalk`, map), `return_to_meadow` (travel), `enter_bellroot_door` (requires `bellroot_key`, instance). At `reedwalk`: `listen_to_reed`, `collect_echo_reed`, `ask_tala_morn`, `follow_safe_planks`, `leave_for_harbor`, `seal_silt_door`. Equivalent grounded decks exist at `loadgate`, `rainrail`, `concord_harbor`, `ivory_court`, and `reed_court`; buttons reference only places, items, NPCs, or committed quests.

**Tutorial forced path.** `arrival_image` → `origin_statement` → `stake_prompt` → `first_choice` → `observe_consequence` → `basic_guard` → `basic_attack` → `loot_commit` → `journal_review` → `travel_to_hub`. It is skippable on alternate characters after `identity_confirmed=true`.

**Retry beat deck.** `preserve_the_record` / `ask_a_witness` / obstacle: missing cord / revelation: the cord was moved by fear / consequence: harbor route delayed; `save_the_route` / `take_the_long_way` / flooded bridge / route is still open / extra gold cost; `hear_the_echo` / `wait` / false voice / silence has a pattern / echo marker; `count_the_load` / `repack` / axle mismatch / court seal is counterfeit / merchant standing; `guide_the_guest` / `share_roof` / storm / guest carries court rumor / gossip unlock; `refuse_the_relic` / `name_a_boundary` / pressure pulse / refusal weakens it / corruption -2; `carry_the_relic` / `set_a_watch` / whisper / it imitates a loved one / corruption +3; `call_both_courts` / `open_ledger` / clerks disagree / neither owns the original / dual-court flag; `leave_the_harbor` / `follow_footprints` / erased sign / erasure itself is evidence / divergence record.

## 6) Quests: code-completeable DAGs

### Primary start: Weft Meadow, 20 authored beats

| ID | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `weft_meadow_first_knot` | First Knot | identity | no | `weft_meadow_witness_mark` | `visit_place:weft_meadow` | 5 | 20 |
| `weft_meadow_witness_mark` | Mark What Was Heard | identity | no | `weft_meadow_cord_retrieval` | `talk_to_npc:senn_ora`, `collect_item:witness_chalk:1` | 6 | 25 |
| `weft_meadow_cord_retrieval` | The Uncut Cord | identity | no | `weft_meadow_bellroot_breadcrumb` | `collect_item:witness_cord:1` | 8 | 35 |
| `weft_meadow_threadbridge_watch` | Bridge Watch | identity | no | — | `visit_place:threadbridge`, `talk_to_npc:loomwarden_ves` | 7 | 30 |
| `weft_meadow_repair_shuttle` | A Shuttle for Dawn | profession | no | `weft_meadow_dye_batch` | `collect_item:reed_shuttle:2`, `deliver_item:reed_shuttle:2` | 10 | 40 |
| `weft_meadow_dye_batch` | Blue Under Tension | profession | no | `weft_meadow_pattern_ledger` | `collect_item:blue_madder:3`, `deliver_item:blue_madder:3` | 12 | 45 |
| `weft_meadow_pattern_ledger` | Pattern Ledger | profession | no | `weft_meadow_loom_trial` | `talk_to_npc:loomwarden_ves`, `collect_item:pattern_ledger:1` | 14 | 55 |
| `weft_meadow_loom_trial` | The Patient Warp | profession | no | — | `visit_place:bellroot_gully`, `collect_item:warp_sample:1` | 18 | 70 |
| `weft_meadow_misthreaded_bells` | Bells Facing Inland | zone_story | no | `weft_meadow_gully_breadcrumb` | `collect_item:bell_clapper:3`, `talk_to_npc:senn_ora` | 15 | 60 |
| `weft_meadow_gully_breadcrumb` | Door in the Root | dungeon | no | `weft_meadow_gully_clear` | `visit_place:threadbridge`, `deliver_item:bellroot_key:1` | 10 | 45 |
| `weft_meadow_gully_clear` | Bellroot Gully | zone_story | no | `concord_harbor_first_tide` | `ledger_kill:bellroot_moth:4`, `collect_item:resonant_sap:1` | 35 | 120 |
| `weft_meadow_harbor_seal` | A Seal for Concord | zone_story | no | `concord_harbor_four_accounts` | `deliver_item:weft_seal:1`, `visit_place:concord_harbor` | 20 | 75 |
| `weft_meadow_stray_thread` | Stray Thread | side | no | — | `collect_item:stray_thread:5` | 9 | 30 |
| `weft_meadow_lost_loomchild` | Find the Loomchild | side | no | — | `talk_to_npc:loomwarden_ves`, `visit_place:threadbridge` | 16 | 55 |
| `weft_meadow_court_notice` | Notice in White Ink | zone_story | no | `concord_harbor_clerk_questioned` | `collect_item:white_notice:1`, `talk_to_npc:senn_ora` | 18 | 65 |
| `weft_meadow_clerk_questioned` | Ask Who Edited It | zone_story | no | `concord_harbor_first_tide` | `talk_to_npc:scribe_noll`, `visit_place:concord_harbor` | 22 | 80 |
| `weft_meadow_hidden_trust` | The Knot You Do Not Show | hidden | yes | — | `talk_to_npc:senn_ora`, `collect_item:private_thread:1` | 28 | 100 |
| `weft_meadow_daily_reweave` | Daily: Reweave a Span | daily | no | — | `collect_item:good_thread:3`, `deliver_item:good_thread:3` | 8 | 25 |
| `weft_meadow_departure` | Four Roads, One Harbor | zone_story | no | `capital_spine_01` | `visit_place:concord_harbor`, `talk_to_npc:harbormaster_ilan` | 25 | 90 |

Other starts use distinct local DAGs: Mireglass has 18 beats centered on echo ownership (`mireglass_first_echo`, `silt_archive_register`, `basin_stillness`); Brassroot has 18 centered on safe loads and a cracked lift (`brassroot_weight`, `loadgate_count`, `understep_stability`); Moonfen has 18 centered on hospitality and a torn rainrail (`moonfen_open_sky`, `rainrail_panel`, `guest_right`). Each contains 3 identity, 4 profession, 5 zone-story, 2 side, 1 dungeon breadcrumb, 1 hidden trust, 1 capped daily, and 1 departure beat. Their objectives use only `visit_place`, `ledger_kill`, `deliver_item`, `talk_to_npc`, and `collect_item`, with numeric rewards from 5–40 gold and 20–140 XP.

### Campaign spine after starts: 14 beats

`capital_spine_01` “Four Accounts” (`visit_place:concord_harbor`, `deliver_item:homeland_seal:4`, 30 gold, 110 XP) unlocks `capital_spine_02` “White Court Petition” (`visit_place:ivory_court`, `talk_to_npc:regent_cassia`, 35, 130), `capital_spine_03` “Green Court Memory” (`visit_place:reed_court`, `talk_to_npc:regent_owen`, 35, 130), `capital_spine_04` “The Unnamed Chord” (`collect_item:chord_shard:2`, 45, 160), `capital_spine_05` “Promise Without Owner” (`talk_to_npc:herald_ven`, `talk_to_npc:herald_mira`, 50, 180), `capital_spine_06` “Confluence Road” (`visit_place:hushed_confluence`, 55, 200), `capital_spine_07` “Room Before the Choir” (`visit_place:crownless_choir`, 60, 220), `capital_spine_08` “Five Voices” (`ledger_kill:choir_wisp:5`, 70, 250), `capital_spine_09` “Checkpoint of Glass” (`visit_place:glassway_checkpoint`, 40, 150), `capital_spine_10` “Relic Pressure” (`collect_item:relic_shard:1`, 80, 280), `capital_spine_11` “A Court Must Yield” (`deliver_item:concord_verdict:1`, 90, 300), `capital_spine_12` “Crownless Depths” (`visit_place:crownless_choir_depths`, 100, 340), `capital_spine_13` “Break the Command” (`ledger_kill:unvoiced_regent:1`, 150, 500), and `capital_spine_14` “Keep Your Own Verse” (`talk_to_npc:harbormaster_ilan`, 75, 260). The relic never grants automatic victory; corruption thresholds are ledger-owned.

**Divergence records.** Walking away from the cord records `cord_abandoned`; siding with White Court records `white_accord_first`; refusing both court seals records `unaffiliated_confluence`. Each record is visible in the Journal and changes later greetings or vendor access rather than silently erasing the promise.

## 7) Species, opponents, and collectibles

Combat skins are original fauna and hostile manifestations, not player peoples. Each start region has 16 entries; values are base HP / base attack / AC.

| Region | Species (rarity; habitat; HP/ATK/AC) |
|---|---|
| Weft Meadow | `bellroot_moth` common meadow 24/6/10; `thimble_vole` common burrow 18/5/9; `inkcap_crab` common wetbank 28/7/11; `ribbon_jackdaw` common hedgerow 20/6/10; `loomtick` common fiber 16/4/9; `blue_madder_hare` uncommon meadow 36/9/12; `cordsnare_vine` uncommon root 42/8/13; `glasswing_beetle` uncommon dusk 30/10/12; `hush_ram` uncommon hill 48/11/13; `bramble_marshal` rare hedge 75/15/15; `bellroot_matron` rare gully 92/18/16; `echo_moth_queen` rare hollow 110/20/17; `redthread_stag` epic meadow 150/25/18; `woven_colossus` epic root 190/28/19; `chorus_wisp` epic ruin 125/24/18; `unvoiced_hound` epic courtroad 170/27/19. |
| Mireglass Basin | `reedskipper`, `mudlark`, `siltpincer`, `rainfin`, `mirrornewt`, `echo_frog`, `peat_crawler`, `glassback_turtle`, `whisper_eel`, `basin_hart`, `silt_warden`, `mire_choirmother`, `drowned_bell`, `reflection_fox`, `archive_mite`, `hush_lamprey` (same rarity bands; HP 16–175, ATK 4–27, AC 9–19). |
| Brassroot Steps | `cogbadger`, `ore_mite`, `stair_kite`, `rivet_beetle`, `dust_marmot`, `axle_gnawer`, `slag_toe`, `haulback`, `ironleaf_ram`, `quarry_bear`, `lift_warden`, `brassroot_titan`, `crackjaw_mole`, `weightless_hag`, `gearhorn`, `understep_ogre` (common through epic; HP 18–200, ATK 5–30, AC 9–20). |
| Moonfen Roost | `rainwing_marten`, `cloud_piper`, `sailfin`, `drift_tern`, `fogmouse`, `roof_urchin`, `gustling`, `tether_vine`, `storm_kite`, `hollow_condor`, `rainrail_crone`, `cloudroot_stag`, `thunder_pupa`, `shelter_bear`, `whitegust_wraith`, `roostbreaker` (common through epic; HP 17–185, ATK 4–29, AC 9–20). |

Collectibles include `witness_cord`, `echo_reed`, `axle_pin`, `rainrail_panel`, `chord_shard`, `resonant_sap`, `court_seal`, `private_thread`, `white_notice`, and `concord_verdict`. None is a power-pack shortcut.

**Corruption relic archetype.** `the_hollow_canticle` is a broken tuning relic that amplifies a bearer’s certainty. It offers no mind control and no instant power. Its `corruption` field rises when a player uses it to overwrite another person’s stated boundary, and falls when the player returns authorship to the speaker. At 25, 50, and 75, the Journal displays committed symptoms and alternate dialogue; at 100, the relic becomes unusable until `relic_unbinding` is completed. This is a consent-and-memory mechanic, not a quest about carrying a magical ring to a volcano.

## 8) Loot / economy

Item templates include starter weapons `thread_tuning_knife`, `reed_crescent`, `brassroot_handaxe`, `moonfen_hookstaff`; starter armor `indigo_wrapcoat`, `waxed_reed_mantle`, `riveted_sash`, `light_raincape`; map items `harbor_route_sheet`, `court_margin_map`; profession outputs `blue_madder_bundle`, `echo_ink`, `balanced_axle`, `stitched_sail`; dungeon drops `bellroot_lens`, `silt_memory_jar`, `understep_gear`, `cloudroot_fiber`; and cosmetics `harbor_bell_pin`, `court_vellum_cape`, `confluence_mask`. Cosmetic items have no combat stats.

| Source | Personal loot table |
|---|---|
| Common regional species | 70% crafting fiber, 25% 1–3 gold, 5% regional common cosmetic dye |
| Uncommon species | 55% profession reagent, 35% 2–6 gold, 10% uncommon cosmetic trim |
| Rare species | 60% regional rare reagent, 30% 5–12 gold, 10% rare appearance pattern |
| Fellowship boss | One coded roll: `bellroot_lens` 35%, `court_margin_map` 35%, `confluence_mask` 30% |
| Named-evil boss | One weekly personal roll: `canticle_shard` 30%, `white_vellum_armor_look` 35%, `green_recall_armor_look` 35% |

Vendors: Kett Rusk sells repair kits, axes, straps, and Brassroot materials; Scribe Noll sells maps, blank ledgers, and court stationery; `loomwarden_ves` sells thread tools; `vicar_esh` sells echo ink; `forge_aunt_nema` sells balanced fittings; `host_lyre` sells rain gear. `repairCostPerPoint=1` gold, capped at 40 gold per item. Faucets are quest rewards, species salvage, and profession orders; sinks are repairs, map fees (2–8 gold), and travel ferries (3 gold). Daily quest rewards cap at 60 gold and 240 XP per character. The collection log records each species, item, POI, NPC conversation branch, and instance clear.

## 9) Instances

### Fellowship instance: Bellroot Gully (`bellroot_gully_instance`)

This is a soloable five-room equivalent balanced for one player or 2–5 private co-op.

| Room | Description before creature | Encounters | Checkpoint / exits |
|---|---|---|---|
| `gully_room_01_moss_gate` | A root arch bends over a shallow path; blue sap beads on the floor and every footstep answers twice. | `bellroot_moth` ×3 | Exit `gully_room_02_tuning_pool` |
| `gully_room_02_tuning_pool` | A circular pool reflects the ceiling, but the reflected roots point toward a sealed side door. | `inkcap_crab` ×2, `cordsnare_vine` ×1 elite | Exit `gully_room_03_glassway`; checkpoint `glassway_checkpoint` |
| `gully_room_03_glassway` | Transparent stone panels form a narrow bridge above dark water; a warm cord is visible beyond the far pane. | `glasswing_beetle` ×4 | Exit `gully_room_04_bell_nest` |
| `gully_room_04_bell_nest` | Hundreds of tiny bells hang from roots, each containing a different remembered sound. | `hush_ram` ×2, `chorus_wisp` ×1 elite | Exit `gully_room_05_matron_chamber` |
| `gully_room_05_matron_chamber` | The chamber is a living bowl of roots around a single bell whose clapper is made from braided witness cord. | `bellroot_matron` ×1 boss | Exit `threadbridge`; reward door `gully_reward_cache` |

### Named-evil 10-person instance: The Crownless Choir (`crownless_choir_raid`)

The three phases are `borrowed_voices` (outer nave, choir wisps and court echoes), `edited_oaths` (archive gallery, four oath-keepers with rotating boundary prompts), and `the_unvoiced_regent` (crown chamber, one boss). The room-before-creature rule applies to every phase. A wipe returns the group to `glassway_checkpoint`; weekly personal loot is committed only on boss defeat. Boss phases test interruption, protection, and authorship choices rather than a copied artifact-destruction journey.

## 10) Progression

No node is pay-to-unlock. Costs are gold or earned XP only.

| Node ID | Cost | Requires | Effect flags |
|---|---:|---|---|
| `steady_guard` | 40 XP | — | `guard_bonus_1` |
| `witness_step` | 50 XP | `steady_guard` | `resist_forced_move` |
| `thread_repair` | 60 XP | `witness_step` | `craft_thread_tools` |
| `echo_lens` | 50 XP | — | `reveal_hidden_interactable` |
| `patient_listening` | 70 XP | `echo_lens` | `dialogue_echo_branch` |
| `silt_memory` | 80 XP | `patient_listening` | `condition_resist_confusion` |
| `grounded_breath` | 50 XP | — | `stamina_restore_1` |
| `load_bearing` | 70 XP | `grounded_breath` | `carry_capacity_2` |
| `safe_fitting` | 90 XP | `load_bearing` | `repair_discount_5` |
| `draft_skip` | 50 XP | — | `hazard_cross_once` |
| `guest_right` | 70 XP | `draft_skip` | `hospitality_dialogue` |
| `open_sky_route` | 90 XP | `guest_right` | `travel_cost_minus_1` |
| `relic_boundary` | 100 XP | `steady_guard`, `patient_listening` | `corruption_gain_minus_1` |
| `shared_authorship` | 140 XP | `relic_boundary`, `guest_right` | `unbinding_action` |
| `confluence_vow` | 180 XP | `shared_authorship`, `safe_fitting` | `court_dual_access` |

Daily/weekly contracts: `repair_three_markers` (collect 3 good thread; 10 gold), `listen_at_two_waters` (visit 2 POIs; 12 gold), `deliver_a_counted_load` (deliver 1 balanced axle; 14 gold), `escort_a_guest` (talk to 2 NPCs; 16 gold), and `name_a_boundary` (complete one relic-boundary choice; 20 gold). Each is capped at one reward per day; the named-evil clear is capped weekly.

## 11) Theme Kit + copy

The visual language uses parchment cream, rain-blue, root green, tarnished brass, and ink-black. Dice are matte riverstone with fine copper numerals. Voice is intimate, measured, and lightly lyrical; silence is treated as an active choice. The ambient loop is **“Four Rooms of Rain”**: soft rain, distant handbells, loom creak, and a low three-note hum with no recognizable melody. Fashion is layered travel cloth, weatherproof wraps, cord jewelry, court sashes, and practical boots.

| UI label | First-Song copy |
|---|---|
| Inventory | Satchel of Kept Things |
| Journal | Book of Heard Roads |
| Map | The Living Margin |
| Party | Traveling Voices |
| Quests | Promises in Progress |
| Abilities | Trained Gestures |
| Equipment | Worn and Witnessed |
| Crafting | Making Room |
| Vendors | Honest Stalls |
| Travel | Take the Long Road |
| Checkpoint | Glass Rest |
| Instance entry | Cross the Threshold |
| Loot | What the Place Returned |
| Court standing | How They Hear You |
| Relic | Pressure in the Palm |
| Corruption | Borrowed Certainty |
| Collection | Names We Met |
| Settings | Margins and Measures |
| Leave party | Part Without Erasing |

**New Game card hooks.** “A bell rings with your own voice.” “Four roads meet where no road was drawn.” “The court’s seal is warm from someone else’s hand.” “Your oldest promise has acquired a stranger’s ending.” “A root has grown through a locked archive.” “The harbor records arrivals, not loyalties.” “The rainrail carries a guest who will not say from where.” “A relic offers certainty at the price of listening.” “The first song is missing its final note.” “Choose what you protect before you learn what it can become.”

## 12) Failures + John’s calls

1. **Clone risk: generic fellowship fantasy.** Avoided through four cultures built around testimony, listening, labor, and hospitality, plus a harbor-and-court geography rather than a wilderness kingdom road.
2. **Clone risk: corruption relic as a simple evil object.** Avoided by making `the_hollow_canticle` a consent-and-authorship track with reversible thresholds and no instant domination.
3. **Clone risk: courts as renamed good and evil kingdoms.** Avoided by giving both courts legitimate needs, contradictory records, and a required dual-account resolution.
4. **Clone risk: interchangeable quest chores.** Avoided through distinct verbs: witness, listen, count, host, and return authorship; each writes a visible state or divergence record.
5. **Open decision.** The exact number of late-game court cosmetics is not blocking; speculative default is 12, split evenly between White Accord and Green Recall, with no combat-stat difference.

## Integrity checklist

1. `worldId` is stable snake_case: `first_song`.
2. Display title remains the locked working name First-Song.
3. All content is original and genre-pattern-only.
4. No licensed franchise names are used as canon.
5. No dump-error names are used as canon.
6. No live service, live source, save, or backend reference appears.
7. Rules module is `hp_check`.
8. Code owns HP, AC, rolls, loot, rewards, and quest ticks.
9. Prose cannot invent damage, loot, clear, or score outcomes.
10. Two wallets remain separate.
11. Premium content cannot buy combat outcomes.
12. Four original peoples are defined.
13. Four homelands and two courts are mapped.
14. Travel uses connected routes and no teleport.
15. Fog distinguishes visited pins from outline routes.
16. Six durable NPCs have canned talk trees.
17. Hub chatter is fixed and non-improvised.
18. Opening choices include a real stake.
19. Primary start has 20 authored quest beats.
20. Quest objectives use code-completeable verbs and numeric rewards.
21. A fellowship five-room instance is soloable.
22. The named-evil instance has ten-person, three-phase structure.
23. The relic is an archetype with a corruption track.
24. Progression has 15 earned nodes and no pay-to-unlock path.
25. Daily and weekly caps are explicit.
