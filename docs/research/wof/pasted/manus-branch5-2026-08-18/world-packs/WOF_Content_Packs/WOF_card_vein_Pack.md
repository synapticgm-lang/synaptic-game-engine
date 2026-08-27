# WOF World Pack: Card Vein

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `card_vein` |
| Display name | Card Vein |
| One-line pitch | A bright, all-ages tabletop duel journey where players read living cards, build fair decks, and solve neighborhood problems through lane tactics. |
| Maturity | `all_ages` |
| `rulesModuleId` | `card_lane` |
| Theme Kit | `inkglass_garden` |
| Start hubs | `morrow_quay`, `willow_market`, `sunken_archive`, `copper_fair` |
| Five-man equivalent | `the_split_deck_vault` |
| Big instance | `the_fourfold_festival` (five-player tournament night; no raid) |

Card Vein uses the **collectible card-battle** pattern: readable decks, alternating turns, lane control, and collection discovery. It is **not** a licensed monster-collecting, trading-card, gambling, or franchise tournament world; cards are earned through play and crafting, never sold as sealed power.

### Genre-specific ban-list

The following names, identities, creatures, products, slogans, and recognizable package concepts are prohibited from this world: Pokémon, Pikachu, Charizard, Bulbasaur, Squirtle, Poké Ball, Pokédex, Gym Leader, “Gotta Catch ’Em All,” Yu-Gi-Oh!, Duel Monsters, Yugi, Kaiba, Dark Magician, Blue-Eyes, Duel Disk, “It’s time to duel,” Magic: The Gathering, Planeswalker, Black Lotus, Dungeons & Dragons, Baldur’s Gate, Faerûn, Beholder, Mind Flayer, Hearthstone, Warcraft, Stormwind, Orgrimmar, Azeroth, Horde, Alliance, Legends of Runeterra, League of Legends, Runeterra, Slay the Spire, Inscryption, Gwent, The Witcher, Final Fantasy, Elder Scrolls, Skyrim, Magic Academy, Harry Potter, Hogwarts, Voldemort, Star Wars, Jedi, Sith, Naruto, One Piece, Yu Yu Hakusho, Beyblade, Bakugan, Cardfight!! Vanguard, Digimon, Palworld, Genshin, Teyvat, My Hero Academia, and any direct imitation of their mascots, card frames, slogans, named locations, or signature plots.

All cultures, cards, places, and characters below are original. Folklore is used only as broad texture, never as a renamed licensed kit.

## 1) Rules module: `card_lane`

The ledger owns `card_lane_score`, `lane_control`, `energy`, `hand_size`, `deck_id`, `card_instance_id`, `status_flags`, `collection_owned`, `match_round`, `match_seed`, `checkpoint_id`, `gold`, `cosmetic_tokens`, `daily_contract_count`, and `divergence_records`. It resolves deck legality, draw order, energy gain, card costs, lane targeting, attack values, shield values, status durations, match victory, rewards, collection entries, and instance doors. Prose may describe a card’s personality but cannot create a card, change a card’s cost, award a victory, invent a reward, or decide a draw.

A match has three lanes: **meadow**, **bridge**, and **rooftop**. Each player starts with 20 score and 1 energy, draws 4 cards, and gains 1 energy at round start up to 8. A legal deck has 24 cards, no more than 2 copies of a card, and exactly one banner card. Each card has a printed `cost`, `power`, `guard`, and effect flags. The code commits the result before narration.

**Wipe and checkpoint.** A solo or group instance defeat returns the party to the last checkpoint, preserves collection discoveries, and charges no gold. A completed match has no combat lockout; the festival finale has a per-character weekly reward lockout. Personal loot is rolled independently.

**Diegetic chrome templates:**

```text
[VEIN WINDOW] Round {round}; Energy {current}/{maximum}; Meadow {meadow_score}; Bridge {bridge_score}; Rooftop {rooftop_score}.
[DRAW NOTE] {card_name} entered your hand. Hand {hand_count}/9.
[LANE CALL] {card_name} targets {lane_name}; printed power {power}; printed guard {guard}.
[COLLECTION] New index mark: {card_name}. Origin: {origin_set}. Copies {copies}/2.
[DECK CHECK] {deck_name}: {card_count}/24 cards; legality {legal_or_missing_requirements}.
[FAIR PLAY] This reward is earned in play. No purchased pack contains combat power.
[CHECKPOINT] {checkpoint_id} recorded. A defeat returns you here.
[CONTRACT] {contract_title}: {current}/{required}; reward {reward_gold} gold and {reward_tokens} cosmetic tokens.
```

## 2) Identity kits

| Kit ID | Look and values | Taboo and speech tell | Starter clothes / weapon | Start and first quest | Ability flag | Originality note |
|---|---|---|---|---|---|---|
| `inkward_apprentice` | Ink-stained fingers, quick pattern memory, values patience | Never smears another person’s card; says “Let the line breathe.” | Blue smock, reed stylus, `starter_inkblade` | `morrow_quay`; `cv_mq_identity_01` | `steady_hand` | An original craft apprentice, not a renamed school archetype. |
| `bellroad_runner` | Bright scarf, fast feet, values promises kept | Never rings a bell for a false alarm; says “Hear the turn.” | Yellow jacket, brass score-bell, `starter_bellstaff` | `willow_market`; `cv_wm_identity_01` | `tempo_step` | An original courier kit with no licensed mascot or class. |
| `mosaic_reader` | Colored lenses, quiet observation, values evidence | Never hides a marked card; says “Pattern before pride.” | Green vest, slate lens, `starter_mosaic_rod` | `sunken_archive`; `cv_sa_identity_01` | `index_sight` | An original archivist kit rather than a wizard or detective copy. |
| `copper_tactician` | Copper cuff, measured gestures, values fair challenge | Never mocks a beginner’s deck; says “A clean match teaches.” | Red workcoat, folding lane-board, `starter_copper_fan` | `copper_fair`; `cv_cf_identity_01` | `counter_read` | An original fairground strategist, not a licensed duelist. |

Each kit begins with a 12-card starter deck: 8 common cards, 3 kit cards, and 1 banner. Starter cards are fixed, not randomized.

## 3) Map and places

The four starts form a no-teleport travel graph: each start zone connects to its local hub, then to `crossline_green`, then to `veinward_hall` or `countercourt`. The two merge hubs are not capitals in the political sense: `veinward_hall` is the public rules archive and `countercourt` is the open tournament square. Travel is by marked road, tram, or canal; unlocked map pins shorten navigation but do not teleport characters.

| ID | Public name | Zone | Scale | Danger | Outdoor | Exits | NPCs | Door |
|---|---|---|---|---|---|---|---|---|
| `morrow_quay` | Morrow Quay | `quay_zone` | street | safe | true | `quay_cardwalk`, `crossline_green` | `npcs_quay` | — |
| `quay_cardwalk` | Cardwalk Steps | `quay_zone` | street | low | true | `morrow_quay`, `quay_tidepost` | `npcs_quay` | — |
| `quay_tidepost` | Tidepost Tables | `quay_zone` | street | low | true | `quay_cardwalk`, `quay_net_loft` | `npcs_quay` | — |
| `quay_net_loft` | Net Loft | `quay_zone` | dungeon | medium | false | `quay_tidepost`, `quay_inkcellar_door` | `npcs_quay` | `inkcellar_trial` |
| `quay_inkcellar_door` | Inkcellar Door | `quay_zone` | dungeon | medium | false | `quay_net_loft`, `crossline_green` | `npcs_quay` | `inkcellar_trial` |
| `quay_ferry_ring` | Ferry Ring | `quay_zone` | street | safe | true | `morrow_quay`, `crossline_green` | `npcs_quay` | — |
| `willow_market` | Willow Market | `market_zone` | street | safe | true | `market_arcade`, `crossline_green` | `npcs_market` | — |
| `market_arcade` | Willow Arcade | `market_zone` | street | low | true | `willow_market`, `market_roofline` | `npcs_market` | — |
| `market_roofline` | Roofline Walk | `market_zone` | street | low | false | `market_arcade`, `market_pantry` | `npcs_market` | — |
| `market_pantry` | Shared Pantry | `market_zone` | dungeon | medium | false | `market_roofline`, `market_press_door` | `npcs_market` | `press_trial` |
| `market_press_door` | Pressroom Door | `market_zone` | dungeon | medium | false | `market_pantry`, `crossline_green` | `npcs_market` | `press_trial` |
| `market_bell_yard` | Bell Yard | `market_zone` | street | safe | true | `willow_market`, `crossline_green` | `npcs_market` | — |
| `sunken_archive` | Sunken Archive | `archive_zone` | street | safe | false | `archive_rotunda`, `crossline_green` | `npcs_archive` | — |
| `archive_rotunda` | Rotunda of Traces | `archive_zone` | dungeon | low | false | `sunken_archive`, `archive_index` | `npcs_archive` | — |
| `archive_index` | Index Galleries | `archive_zone` | dungeon | low | false | `archive_rotunda`, `archive_wet_stacks` | `npcs_archive` | — |
| `archive_wet_stacks` | Wet Stacks | `archive_zone` | dungeon | medium | false | `archive_index`, `archive_mnemonic_door` | `npcs_archive` | `mnemonic_trial` |
| `archive_mnemonic_door` | Mnemonic Door | `archive_zone` | dungeon | medium | false | `archive_wet_stacks`, `crossline_green` | `npcs_archive` | `mnemonic_trial` |
| `archive_floodcourt` | Floodcourt | `archive_zone` | street | safe | false | `sunken_archive`, `crossline_green` | `npcs_archive` | — |
| `copper_fair` | Copper Fair | `fair_zone` | street | safe | true | `fair_midway`, `crossline_green` | `npcs_fair` | — |
| `fair_midway` | Midway of Seven | `fair_zone` | street | low | true | `copper_fair`, `fair_backlot` | `npcs_fair` | — |
| `fair_backlot` | Backlot Tables | `fair_zone` | street | low | true | `fair_midway`, `fair_gearhouse` | `npcs_fair` | — |
| `fair_gearhouse` | Gearhouse | `fair_zone` | dungeon | medium | false | `fair_backlot`, `fair_fold_door` | `npcs_fair` | `fold_trial` |
| `fair_fold_door` | Fold Door | `fair_zone` | dungeon | medium | false | `fair_gearhouse`, `crossline_green` | `npcs_fair` | `fold_trial` |
| `fair_lantern_row` | Lantern Row | `fair_zone` | street | safe | true | `copper_fair`, `crossline_green` | `npcs_fair` | — |
| `crossline_green` | Crossline Green | merge | street | safe | true | all four starts, `veinward_hall`, `countercourt` | `npc_crossline` | — |
| `veinward_hall` | Veinward Hall | capital-equivalent | street | safe | false | `crossline_green`, `hall_registry`, `split_vault_door` | `npc_hall` | `the_split_deck_vault` |
| `countercourt` | Countercourt | capital-equivalent | street | safe | true | `crossline_green`, `festival_gate` | `npc_court` | `the_fourfold_festival` |

Fog reveals only visited places; unvisited areas show an outline and exits without NPC or reward detail. Street maps use pins for tables, shops, and NPCs. Indoor areas use a floor-plan; a shop never displays a distant-scale map. Instance doors are physical places and cannot be opened until the corresponding quest flag is committed.

## 4) Durable NPCs and canned dialogue

The following eight NPCs persist across their start hubs. Their dialogue is authored and finite; nearby-player presence displays only `nearbyPlayerCount` and race/kit labels.

| ID | Name | Place | Role |
|---|---|---|---|
| `npc_mq_iona` | Iona Vell | `morrow_quay` | quest/hub |
| `npc_mq_ren` | Ren Sable | `quay_cardwalk` | merchant |
| `npc_wm_pel` | Pel Orin | `willow_market` | quest/hub |
| `npc_wm_tavi` | Tavi Quill | `market_bell_yard` | merchant |
| `npc_sa_essa` | Essa Noll | `sunken_archive` | quest/hub |
| `npc_sa_brinn` | Brinn Vale | `archive_index` | merchant |
| `npc_cf_maro` | Maro Kest | `copper_fair` | quest/hub |
| `npc_cf_suri` | Suri Dain | `fair_midway` | merchant |

### Full talk trees

**Iona Vell (`npc_mq_iona`).** Greet: “The quay is loud, but a good draw still has a quiet moment.” Quest offer: “Three tide tables are losing their lane marks. Will you test the edges before the evening boats?” Progress: “You found the smudges; did the second mark stay where it belonged?” Turn-in: “The lanes hold. Take 32 gold and the `quay_tide_stamp`.” Gossip: “The ferry bells count turns.” / “Ren sells sleeves that survive rain.” / “A fair match can calm a whole pier.” Refusal/rude: “Then step away from the tables; nobody is required to play.”

**Ren Sable (`npc_mq_ren`).** Greet: “Dry sleeves, clean counters, honest prices.” Quest offer: “Bring 3 `reed_fiber` and I will press you a weatherproof card sleeve.” Progress: “Two fibers are on the counter; one more makes the fold strong.” Turn-in: “Useful hands deserve useful gear: `weatherproof_sleeve` and 18 gold.” Gossip: “The ferry ring favors bridge cards.” / “Iona keeps a spare chalk box.” / “Never trade a card you cannot replace.” Refusal/rude: “I do not serve insults; return when your voice is ready.”

**Pel Orin (`npc_wm_pel`).** Greet: “Welcome to Willow Market, where every stall has a rule.” Quest offer: “The pantry tables are stuck on one old pattern. Bring four neighbors to try a different opening.” Progress: “The market is listening; one more player must make a legal first turn.” Turn-in: “You made room for new play. Take 40 gold and `market_banner_ribbon`.” Gossip: “Tavi can repair a bent counter.” / “The roofline catches every breeze.” / “A slow deck may still be kind.” Refusal/rude: “No challenge begins with belittling. Choose another button.”

**Tavi Quill (`npc_wm_tavi`).** Greet: “Counters, clips, and score slates—nothing hidden.” Quest offer: “Collect 2 `copper_clip` from the arcade and I will tune your lane board.” Progress: “The clips are bright but unfiled. Two makes a board steady.” Turn-in: “There: `tuned_lane_board`; 22 gold for the careful work.” Gossip: “The pantry door sticks in damp weather.” / “Pel knows every family recipe.” / “The roofline is a fine place to practice guard.” Refusal/rude: “A fair seller can still say no.”

**Essa Noll (`npc_sa_essa`).** Greet: “The Archive keeps records of play, not trophies of pride.” Quest offer: “Three index drawers are out of sequence. Visit the galleries and return with their drawer marks.” Progress: “Evidence first: show me the marks, not a guess.” Turn-in: “The shelves agree again. Accept 36 gold and `index_lens`.” Gossip: “Brinn sells blank study cards.” / “Floodcourt echoes on rainy days.” / “Some cards remember old roads.” Refusal/rude: “You may decline, but you may not falsify an archive.”

**Brinn Vale (`npc_sa_brinn`).** Greet: “Blank stock, safe ink, no mystery pricing.” Quest offer: “Deliver 3 `blue_pulp` to the press shelf; I will cut a set of `archive_sleeves`.” Progress: “The pulp is counted: {current}/3.” Turn-in: “The sleeves are square and plain. 20 gold and `archive_sleeves`.” Gossip: “Essa dislikes dramatic shortcuts.” / “Wet stacks need quiet feet.” / “A collection is a record, not a ranking.” Refusal/rude: “Please leave the stall line clear.”

**Maro Kest (`npc_cf_maro`).** Greet: “Copper Fair opens with a bell and closes with a handshake.” Quest offer: “A practice table is missing its neutral banner. Test four opening hands and report which one stays fair.” Progress: “You have tested {current}/4 openings; no result is hidden.” Turn-in: “The fair can use that lesson. Take 44 gold and `neutral_banner`.” Gossip: “Suri hears bent hinges from across the midway.” / “The backlot is for experiments.” / “Winning is less useful than learning why.” Refusal/rude: “The fair has room for mistakes, not cruelty.”

**Suri Dain (`npc_cf_suri`).** Greet: “If it folds, slides, clicks, or rings, I can mend it.” Quest offer: “Bring 2 `brass_pin` and I will reinforce your board hinge.” Progress: “One pin is set; one remains.” Turn-in: “Your `reinforced_board` will travel well. Here is 25 gold.” Gossip: “Maro keeps the festival brackets visible.” / “The gearhouse has five rooms.” / “A good counter is a promise to your next turn.” Refusal/rude: “No repair is worth being spoken to that way.”

### Hub say/emote lines

1. “The chalk lane is open.” 2. “A clean draw makes a clean start.” 3. “Please leave the score slate visible.” 4. “A lost match is still a page in the journal.” 5. “The bridge lane is slippery today.” 6. “Personal collections stay personal.” 7. “The next bell marks round start.” 8. “Ask before touching another player’s board.” 9. “Cosmetic ribbons are displayed by choice.” 10. “The tables are ready when you are.”

## 5) Premade choices and first hour

Every kit uses an authored opening deck. The establishment beats are: choose a look, choose the kit, state an origin, accept a stake, and observe the consequence. The stake is local: protect a table’s community score, preserve a market opening, restore a record, or keep a fair bracket neutral.

| Kit | Opening beats and stake |
|---|---|
| `inkward_apprentice` | Select ink color; place the first banner; hear Iona’s warning; choose to defend the tide table or document the smudge; consequence is `identity_confirmed=true`, `first_choice=defend_or_document`, `observed_consequence=table_repaired_or_evidence_logged`. |
| `bellroad_runner` | Tie scarf; ring once; deliver Pel’s slate; choose speed or careful verification; consequence records `market_opened_fast` or `market_opened_verified`. |
| `mosaic_reader` | Fit lens; inspect three marks; choose archive order or witness interview; consequence records `index_ordered` or `witness_trusted`. |
| `copper_tactician` | Fold board; greet opponent; choose visible bracket or private practice; consequence records `bracket_public` or `practice_private`. |

### Grounded choice buttons

| POI | Choice buttons (requirements; intent) |
|---|---|
| `quay_cardwalk` | “Inspect chalk seam” (none; observe); “Ask Iona about tide” (talk Iona; dialogue); “Play a legal warm-up” (starter deck; match); “Replace sleeve” (`weatherproof_sleeve`; craft); “Mark safe exit” (visited place; navigation); “Record smudge” (`quay_marking_kit`; collect). |
| `market_arcade` | “Count stall bells” (none; collect); “Challenge pantry pattern” (quest flag; match); “Ask Pel for rule” (talk Pel; dialogue); “Buy clip” (18 gold; purchase); “Practice guard lane” (starter deck; match); “Post visible result” (completed match; social record). |
| `archive_index` | “Read drawer label” (none; observe); “Return drawer mark” (quest item; deliver); “Ask Essa for context” (talk Essa; dialogue); “Compare two cards” (2 cards owned; inspect); “Use index lens” (`index_lens`; reveal); “Leave a truthful note” (journal unlocked; record). |
| `fair_midway` | “View bracket” (none; inspect); “Test neutral banner” (`neutral_banner`; match); “Ask Maro for stake” (talk Maro; dialogue); “Tune hinge” (`reinforced_board`; craft); “Invite a friend-first match” (party 2–5; match); “Exit without rematch” (completed match; choice). |

### Tutorial forced path

1. Visit the local start hub. 2. Talk to the durable quest NPC. 3. Place a banner in the deck editor. 4. Draw the fixed starter hand. 5. Play one card into meadow. 6. Pass priority. 7. Play one guard card into bridge. 8. Resolve a code-owned round. 9. Read the lane result. 10. Complete the local stake match. 11. Turn in the quest. 12. Open the collection log. The path is skippable for alternate characters after `tutorial_card_lane_complete`.

### Retry beat deck

| Fingerprint | Goal | Tactic | Obstacle | Revelation | Consequence |
|---|---|---|---|---|---|
| `retry_quay_01` | Hold meadow | Guard early | Tide mark shifts | Bridge card stabilizes it | `meadow_saved` |
| `retry_quay_02` | Hold bridge | Spend low | Energy cap reached | Pass creates tempo | `energy_conserved` |
| `retry_market_01` | Open pantry | Read opponent | Pattern bait | Banner reveals safe lane | `bait_seen` |
| `retry_market_02` | Protect stalls | Split pressure | Rooftop scores fast | One lane can be yielded | `stall_saved` |
| `retry_archive_01` | Restore order | Compare marks | One drawer is false | Witness note confirms | `false_mark_found` |
| `retry_archive_02` | Preserve record | Use guard | Ink fades on attack | Index lens preserves copy | `record_preserved` |
| `retry_fair_01` | Keep bracket fair | Show deck list | Fear of copying | Visible list builds trust | `bracket_trust` |
| `retry_fair_02` | Finish cleanly | Pass final turn | Crowd asks rematch | Exit honors stake | `clean_finish` |

## 6) Quests: code-completeable DAGs

The primary start is Morrow Quay. Its 18 authored beats are a DAG; each objective uses only code-resolvable verbs.

### Morrow Quay primary DAG

| ID | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `cv_mq_identity_01` | The First Mark | identity | false | `cv_mq_identity_02` | `visit_place:morrow_quay`; `talk_to_npc:npc_mq_iona` | 10 | 20 |
| `cv_mq_identity_02` | A Banner in the Wind | identity | false | `cv_mq_identity_03` | `collect_item:starter_banner:1`; `visit_place:quay_cardwalk` | 12 | 24 |
| `cv_mq_identity_03` | Choose the Stake | identity | false | `cv_mq_story_01` | `talk_to_npc:npc_mq_iona`; `visit_place:quay_tidepost` | 14 | 28 |
| `cv_mq_prof_01` | Reed Fiber Count | profession | false | `cv_mq_prof_02` | `collect_item:reed_fiber:3` | 18 | 30 |
| `cv_mq_prof_02` | Weatherproof Fold | profession | false | `cv_mq_prof_03` | `deliver_item:reed_fiber:3:npc_mq_ren`; `talk_to_npc:npc_mq_ren` | 18 | 34 |
| `cv_mq_prof_03` | Sleeve the Tide | profession | false | `cv_mq_prof_04` | `collect_item:weatherproof_sleeve:1`; `visit_place:quay_tidepost` | 20 | 38 |
| `cv_mq_prof_04` | Rain-Tested Deck | profession | false | `cv_mq_story_02` | `ledger_kill:tide_scribble:2`; `collect_item:quay_marking_kit:1` | 24 | 44 |
| `cv_mq_story_01` | Smudge at Table Three | zone_story | false | `cv_mq_story_02` | `visit_place:quay_tidepost`; `collect_item:smudged_mark:2` | 22 | 42 |
| `cv_mq_story_02` | The Net Loft Pattern | zone_story | false | `cv_mq_dungeon_01` | `ledger_kill:inkmoth:3`; `visit_place:quay_net_loft` | 28 | 52 |
| `cv_mq_dungeon_01` | Door in the Loft | dungeon | false | `cv_mq_story_03` | `talk_to_npc:npc_mq_iona`; `visit_place:quay_inkcellar_door` | 30 | 56 |
| `cv_mq_story_03` | Keep the Lane Dry | zone_story | false | `cv_mq_extra_01` | `ledger_kill:spill_sprig:4`; `deliver_item:quay_marking_kit:1:npc_mq_iona` | 34 | 64 |
| `cv_mq_extra_01` | A Neighbor’s First Match | side | false | `cv_mq_extra_02` | `talk_to_npc:npc_mq_iona`; `ledger_kill:tide_scribble:1` | 20 | 35 |
| `cv_mq_extra_02` | Ferry Ring Courtesy | side | false | `cv_mq_daily_01` | `visit_place:quay_ferry_ring`; `talk_to_npc:npc_mq_iona` | 22 | 38 |
| `cv_mq_daily_01` | Three Honest Turns | daily | false | `cv_mq_hidden_01` | `ledger_kill:inkmoth:3` | 25 | 40 |
| `cv_mq_hidden_01` | Trust the Mark | hidden | true | `cv_mq_campaign_01` | `talk_to_npc:npc_mq_ren`; `collect_item:quiet_chalk:1` | 45 | 80 |
| `cv_mq_campaign_01` | Greenline Invitation | campaign | false | `cv_campaign_02` | `visit_place:crossline_green`; `deliver_item:quay_tide_stamp:1:npc_mq_iona` | 38 | 75 |
| `cv_campaign_02` | Hall of Legal Decks | campaign | false | `cv_campaign_03` | `visit_place:veinward_hall`; `talk_to_npc:npc_hall_registrar` | 50 | 90 |
| `cv_campaign_03` | The Split Deck Vault | campaign | false | — | `visit_place:split_vault_door`; `ledger_kill:hinge_wraith:1` | 80 | 150 |

The other three starts each contain 18 beats, with distinct verbs and local stakes.

**Willow Market:** `cv_wm_identity_01` “Bellroad Oath” (visit/talk, 10 gold, 20 XP), `cv_wm_identity_02` “Four Stall Names” (collect 4 stall_tags, 12, 24), `cv_wm_identity_03` “Choose the Opening” (talk Pel, 14, 28), `cv_wm_prof_01` “Copper Clip Sweep” (collect 2 copper_clip, 18, 30), `cv_wm_prof_02` “Tune the Slate” (deliver clips, 20, 36), `cv_wm_prof_03` “Roofline Test” (visit roofline, 22, 40), `cv_wm_prof_04` “Pantry Press” (ledger_kill pantry_pressling:4, 26, 48), `cv_wm_story_01` “A Pattern Too Old” (visit pantry, 24, 44), `cv_wm_story_02` “Bell Before Bread” (ledger_kill bellmite:3, 28, 52), `cv_wm_story_03` “The Shared Table” (talk Pel, deliver market_banner_ribbon, 34, 64), `cv_wm_side_01` “A Child’s Legal Hand” (talk Pel, ledger_kill bellmite:1, 20, 35), `cv_wm_side_02` “Roofline Neighbor” (visit roofline, 22, 38), `cv_wm_daily_01` “Five Stalls, One Rule” (visit 5 stall places, 25, 40), `cv_wm_hidden_01` “No Secret Bracket” (talk Tavi, collect open_bracket_slip, 45, 80), `cv_wm_campaign_01` “Market to Greenline” (visit crossline, 38, 75), `cv_wm_campaign_02` “Visible Deck Promise” (deliver bracket_slip, 50, 90), and `cv_wm_campaign_03` “Pantry Press Trial” (visit press door, ledger_kill:press_howler:1, 80, 150).

**Sunken Archive:** `cv_sa_identity_01` “Lens Fitted” (visit/talk, 10, 20), `cv_sa_identity_02` “Three True Marks” (collect archive_mark:3, 12, 24), `cv_sa_identity_03` “Witness or Order” (talk Essa, 14, 28), `cv_sa_prof_01` “Blue Pulp” (collect blue_pulp:3, 18, 30), `cv_sa_prof_02` “Cut the Sleeves” (deliver pulp, 20, 36), `cv_sa_prof_03` “Index the Rain” (visit wet stacks, 22, 40), `cv_sa_prof_04` “Preserve the Copy” (ledger_kill:inkleech:4, 26, 48), `cv_sa_story_01` “Drawer Seven” (visit index, 24, 44), `cv_sa_story_02` “False Sequence” (ledger_kill:sequence_skein:3, 28, 52), `cv_sa_story_03` “Floodcourt Testimony” (talk Essa, deliver index_lens, 34, 64), `cv_sa_side_01` “Borrowed Reading” (talk Brinn, collect borrowed_card:1, 20, 35), `cv_sa_side_02` “Quiet Feet” (visit wet stacks, 22, 38), `cv_sa_daily_01` “Five Shelf Truths” (collect shelf_mark:5, 25, 40), `cv_sa_hidden_01` “The Uncatalogued Note” (talk Brinn, collect quiet_note:1, 45, 80), `cv_sa_campaign_01` “Archive to Greenline” (visit crossline, 38, 75), `cv_sa_campaign_02` “Registry of Hands” (talk hall registrar, 50, 90), and `cv_sa_campaign_03` “Mnemonic Trial” (visit mnemonic door, ledger_kill:memory_crook:1, 80, 150).

**Copper Fair:** `cv_cf_identity_01` “Fold the Board” (visit/talk, 10, 20), `cv_cf_identity_02` “Visible Bracket” (collect bracket_slip:1, 12, 24), `cv_cf_identity_03` “Name the Stake” (talk Maro, 14, 28), `cv_cf_prof_01` “Brass Pin Hunt” (collect brass_pin:2, 18, 30), `cv_cf_prof_02` “Hinge Lesson” (deliver pins, 20, 36), `cv_cf_prof_03` “Backlot Balance” (visit backlot, 22, 40), `cv_cf_prof_04` “Gearhouse Rattle” (ledger_kill:gear_jackal:4, 26, 48), `cv_cf_story_01` “A Crooked Start” (visit gearhouse, 24, 44), `cv_cf_story_02` “Neutral Banner” (ledger_kill:foldling:3, 28, 52), `cv_cf_story_03` “Fairness in Public” (talk Maro, deliver neutral_banner, 34, 64), `cv_cf_side_01` “Beginner’s Bracket” (talk Suri, ledger_kill:foldling:1, 20, 35), `cv_cf_side_02` “Hinge Weather” (visit lantern row, 22, 38), `cv_cf_daily_01` “Four Clean Opens” (ledger_kill:practice_echo:4, 25, 40), `cv_cf_hidden_01` “The Unmarked Win” (talk Suri, collect plain_ribbon:1, 45, 80), `cv_cf_campaign_01` “Fair to Greenline” (visit crossline, 38, 75), `cv_cf_campaign_02` “A Bracket Anyone Can Read” (deliver visible_bracket:1, 50, 90), and `cv_cf_campaign_03` “Fold Trial” (visit fold door, ledger_kill:foldwarden:1, 80, 150).

**Divergence records:** walking away from Iona’s table writes `divergence_quay_unmarked`; refusing Pel’s open bracket writes `divergence_market_private`; leaving Essa’s witness unheard writes `divergence_archive_unverified`. Each record appears in the journal and changes the next hub greeting; no promise is silently forgotten.

## 7) Species, opponents, and collectibles

Combat opponents are card-lane skins, not creatures to capture. They are harmless animated paper phenomena and are defeated by match resolution; kid-safe presentation avoids gore and spectacle.

| ID | Region | Rarity | Habitat | HP | ATK | AC |
|---|---|---|---|---:|---:|---:|
| `tide_scribble` | quay | common | wet_table | 8 | 2 | 9 |
| `inkmoth` | quay | common | cellar_lamp | 7 | 3 | 10 |
| `spill_sprig` | quay | uncommon | dock_drain | 14 | 4 | 11 |
| `quay_foldray` | quay | rare | ferry_wind | 22 | 6 | 13 |
| `inkbell_crab` | quay | epic | tidepost | 34 | 8 | 15 |
| `bellmite` | market | common | stall_bell | 7 | 2 | 9 |
| `pantry_pressling` | market | common | paper_stack | 10 | 3 | 10 |
| `roof_ribboner` | market | uncommon | roofline | 15 | 4 | 11 |
| `stall_skein` | market | rare | market_rope | 24 | 6 | 13 |
| `pantry_presswarden` | market | epic | shared_pantry | 36 | 8 | 15 |
| `inkleech` | archive | common | wet_stack | 8 | 2 | 9 |
| `sequence_skein` | archive | common | drawer_gap | 11 | 3 | 10 |
| `margin_murmur` | archive | uncommon | index_gallery | 16 | 4 | 12 |
| `archive_turner` | archive | rare | floodcourt | 25 | 6 | 13 |
| `memory_crook` | archive | epic | mnemonic_door | 38 | 9 | 15 |
| `gear_jackal` | fair | common | gearhouse | 9 | 3 | 10 |
| `foldling` | fair | common | backlot | 10 | 3 | 10 |
| `practice_echo` | fair | uncommon | practice_table | 16 | 5 | 12 |
| `hinge_hopper` | fair | rare | gearhouse | 25 | 7 | 13 |
| `foldwarden` | fair | epic | fold_door | 40 | 9 | 15 |

### Card collection index: 48 original cards

Each card has `card_id`, `lane_affinity`, `rarity`, `cost`, `power`, `guard`, and a non-random effect. The collection log records first discovery, copies owned, origin, and whether the card is craftable.

| Card IDs and names | Lane / rarity | Cost / power / guard | Effect |
|---|---|---|---|
| `card_reed_scout` Reed Scout | meadow/common | 1/2/1 | On play, reveal top card. |
| `card_chalk_sparrow` Chalk Sparrow | rooftop/common | 1/1/2 | Gains 1 guard if lane empty. |
| `card_tide_marker` Tide Marker | bridge/common | 1/1/3 | Marks lane for one round. |
| `card_quay_runner` Quay Runner | bridge/uncommon | 2/3/2 | Move 1 power from meadow to bridge. |
| `card_inkmoth_swarm` Inkmoth Swarm | rooftop/common | 2/4/0 | Draw if it loses lane. |
| `card_ferry_knocker` Ferry Knocker | bridge/uncommon | 2/2/4 | Prevent first push this round. |
| `card_wet_sleeve` Wet Sleeve | any/common | 1/0/4 | Shield a card from one effect. |
| `card_dock_lantern` Dock Lantern | meadow/uncommon | 2/2/3 | Light a hidden collection mark. |
| `card_bell_mite` Bell Mite | rooftop/common | 1/2/1 | Gains power after a pass. |
| `card_stall_keeper` Stall Keeper | meadow/uncommon | 3/3/4 | Give adjacent card 1 guard. |
| `card_pantry_press` Pantry Press | bridge/rare | 4/6/4 | Copy a printed guard value. |
| `card_roof_ribbon` Roof Ribbon | rooftop/uncommon | 2/3/3 | Move 1 guard to rooftop. |
| `card_market_bell` Market Bell | any/rare | 3/2/5 | Both players reveal one card. |
| `card_shared_basket` Shared Basket | meadow/common | 2/2/3 | Draw only if hand has 3 or fewer. |
| `card_copper_clip` Copper Clip | bridge/common | 1/2/2 | Repair a marked lane. |
| `card_willow_vendor` Willow Vendor | meadow/uncommon | 3/4/2 | Create a temporary guard token. |
| `card_roofline_reader` Roofline Reader | rooftop/rare | 3/5/2 | Peek at opposing lane total. |
| `card_pantry_gate` Pantry Gate | bridge/rare | 4/3/7 | Cannot move; anchors lane. |
| `card_archive_mark` Archive Mark | meadow/common | 1/1/3 | Record last played effect. |
| `card_drawer_key` Drawer Key | bridge/uncommon | 2/3/3 | Unlock one sealed effect. |
| `card_inkleech` Inkleech | rooftop/common | 1/3/0 | If defeated, return one mark. |
| `card_margin_murmur` Margin Murmur | any/uncommon | 2/2/3 | Reduce next effect by 1. |
| `card_sequence_skein` Sequence Skein | bridge/rare | 4/5/5 | Reorder two of your lane cards. |
| `card_floodcourt_witness` Floodcourt Witness | meadow/rare | 3/3/6 | Guard increases when a card is revealed. |
| `card_memory_crook` Memory Crook | rooftop/epic | 5/8/3 | Reuse your last committed effect once. |
| `card_plain_note` Plain Note | any/common | 0/0/1 | Draw only; no combat effect. |
| `card_fair_banner` Fair Banner | banner/rare | 0/0/6 | Start with one visible lane mark. |
| `card_copper_tactician` Copper Tactician | bridge/epic | 5/7/5 | Once per match, change a target lane. |
| `card_gear_jackal` Gear Jackal | meadow/common | 2/4/1 | Gains guard from a repaired lane. |
| `card_foldling` Foldling | rooftop/common | 2/3/2 | Move itself after opponent passes. |
| `card_practice_echo` Practice Echo | any/uncommon | 3/4/4 | Cannot score in tutorial matches. |
| `card_hinge_hopper` Hinge Hopper | bridge/rare | 4/6/3 | Bounce a temporary card. |
| `card_foldwarden` Foldwarden | bridge/epic | 6/9/6 | Protects the lowest-score lane. |
| `card_morrow_ink` Morrow Ink | meadow/common | 1/2/2 | Next card costs 1 less, minimum 1. |
| `card_quay_ferry` Quay Ferry | bridge/uncommon | 3/4/4 | Shift one friendly card. |
| `card_tideglass` Tideglass | rooftop/rare | 3/4/6 | Reveal both banner effects. |
| `card_wind_slip` Wind Slip | any/common | 1/0/2 | Return a friendly card to hand. |
| `card_willow_thread` Willow Thread | meadow/uncommon | 2/3/4 | Link adjacent cards for guard. |
| `card_bellroad_oath` Bellroad Oath | rooftop/rare | 4/6/5 | Gain 2 score if no card was moved. |
| `card_sunken_index` Sunken Index | bridge/epic | 5/8/6 | Search one owned card by lane. |
| `card_quiet_note` Quiet Note | any/common | 1/1/1 | If played after pass, draw 2. |
| `card_archive_lens` Archive Lens | meadow/rare | 3/2/7 | Prevent an unseen effect. |
| `card_copper_pin` Copper Pin | bridge/common | 1/2/3 | Repair a hinge status. |
| `card_fairground_call` Fairground Call | rooftop/uncommon | 2/4/2 | Opponent must reveal one legal target. |
| `card_neutral_banner` Neutral Banner | banner/epic | 0/0/7 | Both players start with one visible mark. |
| `card_split_key` Split Key | any/rare | 4/5/5 | Unlocks a second lane target. |
| `card_veinwarden` Veinwarden | meadow/epic | 6/10/7 | Cannot be copied; anchors collection finale. |
| `card_fourfold_seal` Fourfold Seal | banner/epic | 0/0/8 | Once per match, protect all lanes from movement. |

## 8) Loot and economy

Item templates include `starter_inkblade`, `starter_bellstaff`, `starter_mosaic_rod`, `starter_copper_fan`, `weatherproof_sleeve`, `tuned_lane_board`, `archive_sleeves`, `reinforced_board`, `quay_tide_stamp`, `market_banner_ribbon`, `index_lens`, `neutral_banner`, and cosmetic-only `quay_raincoat`, `willow_scarf`, `archive_lens_glow`, `copper_rosette`. No cosmetic changes card power.

| Source | Personal loot table |
|---|---|
| Common regional opponent | 65% 1–3 gold; 25% regional material; 10% common card discovery |
| Uncommon opponent | 60% 3–6 gold; 30% material; 10% uncommon card discovery |
| Rare opponent | 50% 6–10 gold; 35% rare material; 15% rare card discovery |
| Epic opponent | 40% 10–16 gold; 35% cosmetic dye; 25% epic card discovery |
| Instance room | guaranteed 4 gold plus room-specific material; boss adds one fixed card discovery roll |
| Festival finale | 40 gold, 2 cosmetic tokens, and a fixed rotating cosmetic; weekly lockout only on the cosmetic bundle |

Vendors sell sleeves for 18 gold, boards for 60 gold, repair chalk for 8 gold, and cosmetic dyes for 12 gold. `repairCostPerPoint=2` gold repairs a damaged physical board; card power is never repaired or purchased. Gold faucets are quest rewards, match completion, and personal loot. Gold sinks are sleeves, boards, repairs, and map notes. Daily gold from contracts is capped at 180; cosmetic tokens are capped at 20 from daily contracts and 10 from the weekly festival. Cosmetic tokens cannot be converted to gold.

Collection entries record `card_id`, `first_seen_place_id`, `first_seen_quest_id`, `copies_owned`, `rarity`, `lane_affinity`, and `craft_recipe_id`. There are no sealed packs, random power bundles, player-to-player power trades, or premium catch mechanics.

## 9) Instances

### Soloable five-room equivalent: `the_split_deck_vault`

This is a private 1–5 player card-lane instance. Every room is described before its encounter.

| Room ID | Room before creature | Trash encounter | Elite | Checkpoint | Boss / exits |
|---|---|---|---|---|---|
| `sdv_room_01` | “A round chamber has three chalk lanes and a brass door with no handle.” | `tide_scribble` x3 | — | — | Exit to `sdv_room_02` |
| `sdv_room_02` | “Shelves lean over a bridge painted across the floor; loose cards flutter without wind.” | `inkmoth` x3 | `quay_foldray` x1 | — | Exit to `sdv_room_03` |
| `sdv_room_03` | “A quiet gallery shows your own collection marks in glass, each one missing a corner.” | `sequence_skein` x2 | — | `sdv_checkpoint_01` | Exit to `sdv_room_04` |
| `sdv_room_04` | “The floor folds upward into a rooftop lane while a single lantern keeps the meadow dark.” | `margin_murmur` x3 | `memory_crook` x1 | — | Exit to `sdv_room_05` |
| `sdv_room_05` | “A circular vault contains four empty banner stands and a sealed central counter.” | `hinge_hopper` x2 | `hinge_wraith` x1 | — | Completion exits to `veinward_hall` |

`hinge_wraith` has 56 HP, 10 ATK, and AC 16; its lane effect is code-resolved and never narrated as an invented number. Defeat returns the party to `sdv_checkpoint_01` after room 3. Personal loot is one `split_key` material, 18–26 gold, and a fixed chance at `card_split_key`.

### Big instance: `the_fourfold_festival`

This is a five-player public bracket instance, not a raid. Phase 1 is **Open Tables**, where each player completes one legal warm-up against a fixed opponent. Phase 2 is **Cross-Lane Relay**, where the party shares a visible bracket and must collectively win three lane matches. Phase 3 is **Fourfold Final**, a single team-vs-pattern match against the `festival_crown_pattern`. The room descriptions are `festival_gate` (“lanterns frame four public boards”), `festival_arcade` (“four tables rotate under colored awnings”), and `festival_crown_stage` (“a broad stage shows every legal deck list”). Wipe returns to the phase checkpoint; the weekly reward is a cosmetic ribbon, never a power card.

## 10) Progression

There are no paid unlocks. Nodes cost earned XP, gold, or collection marks.

| Node ID | Cost | Requires | Effect flags |
|---|---:|---|---|
| `talent_clear_draw` | 20 XP | — | `draw_preview_1` |
| `talent_guard_lesson` | 30 XP | `talent_clear_draw` | `guard_timing_1` |
| `talent_lane_memory` | 45 XP | `talent_guard_lesson` | `remember_last_lane` |
| `talent_bridge_step` | 60 XP | `talent_lane_memory` | `move_once_match` |
| `talent_open_index` | 80 XP | `talent_clear_draw` | `collection_filter_lane` |
| `talent_archive_copy` | 100 XP | `talent_open_index` | `copy_noncombat_note` |
| `talent_fair_pass` | 120 XP | `talent_guard_lesson` | `pass_preview` |
| `talent_visible_bracket` | 150 XP | `talent_fair_pass` | `show_deck_list` |
| `license_weatherproof` | 40 gold | `talent_open_index` | `use_weatherproof_sleeve` |
| `license_market_board` | 65 gold | `license_weatherproof` | `board_capacity_1` |
| `license_split_entry` | 100 gold | `talent_bridge_step` | `enter_split_vault` |
| `license_fourfold` | 160 gold | `license_visible_bracket` | `enter_festival` |
| `collection_common_ink` | 3 marks | — | `craft_common_cards` |
| `collection_uncommon_press` | 6 marks | `collection_common_ink` | `craft_uncommon_cards` |
| `collection_rare_lens` | 10 marks | `collection_uncommon_press` | `craft_rare_cards` |
| `collection_epic_seal` | 18 marks | `collection_rare_lens` | `craft_epic_cards` |

Daily/weekly contracts are capped: `three_clean_turns` (3 completed rounds, 25 gold), `visit_two_tables` (2 places, 20 gold), `index_one_new_card` (1 new entry, 2 cosmetic tokens), `repair_a_shared_board` (1 talk-to-NPC completion, 20 gold), and `festival_fairness` (one visible-deck match, 5 cosmetic tokens). A character may complete three daily gold contracts and one cosmetic contract per day; `festival_fairness` is weekly.

## 11) Theme Kit and copy

`inkglass_garden` uses ink blue, warm paper, sea-glass green, copper orange, and plum-black accents. Materials are pressed paper, translucent glass counters, waxed cord, and smooth wood. Dice are six-sided ivory dice with a single colored lane pip; they feel like tabletop tools, not casino objects. Voice is friendly, crisp, and encouraging, with short chimes for legal actions and a soft page-turn for collection discovery. The ambient loop is **“Rain on the Counter”**: brushed wood taps, distant ferry bells, and a four-note glass shimmer. Fashion includes rain capes, market scarves, archive vests, fairground rosettes, and dyeable card sleeves.

### Player-facing UI labels

1. Inventory: **Satchel**. 2. Deck editor: **Build a Lane**. 3. Collection: **Card Index**. 4. Quest journal: **Promises**. 5. Map: **Routes**. 6. Match queue: **Find a Table**. 7. Party finder: **Friends’ Tables**. 8. Settings: **Board Rules**. 9. Rewards: **Earned Goods**. 10. Cosmetic shop: **Ribbon Stall**. 11. Gold: **Coin**. 12. Cosmetic tokens: **Ribbons**. 13. HP equivalent: **Score**. 14. Energy: **Ink Charge**. 15. Lane status: **Table State**. 16. Checkpoint: **Saved Mark**. 17. Collection filter: **Sort the Index**. 18. Deck legality: **Board Check**. 19. Daily contracts: **Today’s Tables**. 20. Exit match: **Close the Board**.

### New Game hook cards

1. “A tide table has lost its boundary, and your first deck must decide whether to defend it or prove what happened.”
2. “Willow Market opens in one bell, but its shared pantry is trapped in yesterday’s pattern.”
3. “The Archive remembers every card except the one you were asked to witness.”
4. “Copper Fair promises a visible bracket; someone wants the first result hidden.”
5. “Your starter banner is plain, but the neighborhood stake behind it is not.”
6. “A card can be rare without being powerful; today you will learn why.”
7. “The bridge lane is empty, the ferry is late, and three tables are waiting.”
8. “A collection is a history of hands, not a ladder above other players.”
9. “The festival stage will show every deck list in public.”
10. “Your first victory is measured by the promise you keep after the match.”

## 12) Failures and John’s calls

| Clone risk | Call |
|---|---|
| It could feel like a licensed creature-catching game. | Avoided: opponents are animated card phenomena, no capture tool, no creature trade, and no mascot roster. |
| It could feel like a sealed-pack economy. | Avoided: every card is fixed, discoverable, craftable, or quest-earned; premium never grants combat power. |
| It could feel like a famous fantasy duel school. | Avoided: play is neighborhood tabletop stewardship with four distinct starts and local stakes. |
| It could feel like gambling. | Avoided: no wagers, no random paid rewards, no casino language, and all match results are skill/state resolved. |
| It could feel generic if every start used the same quest. | Avoided: quay repair, market access, archive truth, and fair bracket transparency use different verbs and consequences. |

Open decisions are not blocking. **Speculative default:** future card sets will add one new lane mechanic at a time and will never invalidate the 24-card starter legality rule. **Speculative default:** the festival rotation changes its cosmetic theme weekly while preserving fixed match rules.

## Integrity checklist

1. `worldId` is `card_vein`.  
2. Display name is original.  
3. `rulesModuleId` is `card_lane`.  
4. Maturity is all-ages.  
5. Four starts are present.  
6. Four non-capital hubs are present.  
7. Two merge hubs are present.  
8. Each start has six POIs.  
9. Instance doors are represented as places.  
10. Eight durable NPCs have stable IDs.  
11. Every durable NPC has canned talk.  
12. Ten hub lines are authored.  
13. Opening choices include stakes.  
14. HookArc flags are explicit.  
15. Choice buttons are inventory-aware.  
16. Tutorial path is code-readable.  
17. Retry fingerprints are distinct.  
18. Morrow Quay has 18 DAG beats.  
19. Other starts have 18 authored beats each.  
20. Quest objectives use code-owned verbs.  
21. Quest rewards are numeric.  
22. Divergences write records.  
23. There are 20 opponent species.  
24. There are 48 original cards.  
25. Cards have lanes and real values.  
26. No sealed power packs exist.  
27. Two wallets never mix.  
28. Vendor prices are numeric.  
29. Repair cost is numeric.  
30. Daily caps are explicit.  
31. Collection log fields are explicit.  
32. Five-room soloable instance exists.  
33. Every instance room is described first.  
34. Elite and boss encounters are named.  
35. Checkpoint behavior is defined.  
36. Festival equivalent replaces a raid.  
37. Progression has 16 nodes.  
38. No node is pay-to-unlock.  
39. Five capped contracts exist.  
40. Theme Kit includes colors and materials.  
41. Theme Kit includes dice, voice, loop, and fashion.  
42. Twenty UI labels exist.  
43. Ten opening hooks exist.  
44. Five clone-risk calls exist.  
45. Forbidden franchise names are confined to the genre ban-list.  
46. No dump-error world names are used as canon.  
47. No live-service or source references are included.  
48. No production app code is included.  
49. No sex, drugs, gore spectacle, or gambling appears in the all-ages content.  
50. All content is quarantined as a standalone Markdown pack.
