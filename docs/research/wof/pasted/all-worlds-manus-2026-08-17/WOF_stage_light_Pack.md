# Stage Light — World Pack

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `stage_light` |
| Display name | Stage Light |
| One-line pitch | A warm, all-ages performance journey where four young acts turn neighborhood showcases into a shared concert night without sacrificing friendship, rest, or creative ownership. |
| Maturity | all-ages |
| `rulesModuleId` | `score_set` |
| Theme Kit | `stage_light_glass_and_velvet` |
| Genre pattern and fence | Original idol/band management adventure built around rehearsal craft, ensemble trust, and local venues; **this is not a licensed idol group, rhythm-game franchise, talent show, or school anime.** |

Stage Light treats performance as a cooperative craft. The first-hour problem is local: four venues are losing audiences because a storm-damaged civic sound grid has desynchronized their shows. Players repair the circuit of venues, learn each act’s strengths, and choose whether the final night shares one spotlight or rotates four distinct stages.

**Genre-specific ban-list:** idolmaster, Love Live, Hatsune Miku, Vocaloid, AKB48, K-pop, J-pop, Eurovision, American Idol, The Voice, X Factor, Glee, High School Musical, Hannah Montana, Josie and the Pussycats, Jem, Spice Girls, One Direction, BTS, Blackpink, Girls’ Generation, Morning Musume, Babymetal, Perfume, Utada Hikaru, Taylor Swift, Beyoncé, Lady Gaga, Britney Spears, Justin Bieber, OneRepublic, Queen, The Beatles, ABBA, Eurovision Song Contest, Coachella, Glastonbury, Broadway, West End, Madison Square Garden, Grammy Awards, MTV, Billboard, Disney Channel, Nickelodeon, karaoke, Vocaloid concert, virtual singer, magical microphone, debut survival show, elimination vote, trainee house, producer-as-savior, and any direct lookalike mascot or licensed slogan.

## 1) Rules module: `score_set`

The ledger owns the committed performance state. It resolves `score`, `harmony`, `energy`, `stage_presence`, `audience_mood`, `setlist_slots`, `rehearsal_mastery`, `crew_trust`, `venue_reputation`, `fatigue`, `season_week`, and `show_checkpoint`. A score set is a sequence of authored segments; each segment has a target tag, a difficulty value, and one or more legal player actions. Narrative can describe applause only after the ledger commits the result.

A failed segment lowers the current set score and may raise fatigue; it does not erase inventory, friendship, or authored choices. A show uses a checkpoint after soundcheck and another after the penultimate segment. Weekly character-per-show lockouts apply only to the same featured venue challenge; ordinary rehearsals and private co-op showcases remain available. Wipe means abandoning the set, returning the act to the latest checkpoint with fatigue recorded. Solo play controls the full four-person act through role cards; private co-op supports two to five players.

Prose is forbidden to invent score totals, mastery increases, audience rewards, cosmetic drops, set completion, or a successful performance. It may describe a drum tremor, a held breath, or a crowd leaning forward, but the committed values must come from the ledger.

### Diegetic chrome templates

```text
[SET CARD] {venueName} / Segment {index}/{total} / Target: {targetTag} / Needed: {requiredScore}
[ENSEMBLE HUD] Lead {leadName} | Support {supportName} | Harmony {harmonyValue} | Fatigue {fatigueValue}
[SOUNDCHECK] {channelName}: {status}; permitted action: {actionLabel}; rehearsal mastery: {masteryValue}
[AUDIENCE METER] {venueName} mood {audienceMood}/100 | trust response {trustDelta}
[SHOW RESULT] Set {setId} committed at {scoreValue}; rewards posted: {rewardIds}; checkpoint: {checkpointId}
[REST NOTICE] Fatigue {fatigueValue}; next full rehearsal available after {restRequirement}
```

## 2) Identity kits

All four kits are original performance identities, not licensed character templates. A player may assign any kit to any act member and change stage roles between rehearsals.

| Kit ID | Look and values | Taboo / speech tell | Starter clothes and prop | Starter map / place | First-hour quest / ability flag | Why original |
|---|---|---|---|---|---|---|
| `kit_vellum_voice` | Soft-collared shirts, ink-dark hair ribbons; excels at lyric clarity and audience reading. | Never mocks a sincere beginner; says “let the room answer.” | Cream overshirt, slate trousers, foldable lyric folio. | `bellglass_ward` / `bellglass_square` | `slw_voice_find_the_first_line` / `ability_clear_cue` | A lyric-focused stage role with no borrowed persona or group identity. |
| `kit_copper_rhythm` | Bright workwear, cropped jacket, practical boots; excels at timing and percussive arrangements. | Never starts a count without checking everyone; taps three times before speaking. | Copper sash, patched jacket, hand drum named `rainbox_drum`. | `rainmarket_steps` / `rainmarket_roof` | `slw_rhythm_repair_the_count` / `ability_split_count` | A rhythm craft identity grounded in repair-shop culture rather than a known music franchise. |
| `kit_morrow_motion` | Long layered coat, reflective thread, deliberate movement vocabulary; excels at blocking and stage presence. | Will not imitate a stranger’s signature move; uses precise spatial language. | Indigo coat, silver shoe tabs, chalk spool. | `lantern_quay` / `lantern_quay_dock` | `slw_motion_mark_the_safe_path` / `ability_anchor_blocking` | A movement director kit based on consent and blocking, not a licensed dance archetype. |
| `kit_pine_harmony` | Knit vests, moss-green accents, expressive hands; excels at harmony and group recovery. | Never abandons a missed note; ends difficult sentences with “together.” | Moss vest, amber scarf, tuning fork `amber_tine`. | `paperhill_common` / `paperhill_bandstand` | `slw_harmony_tune_the_corner` / `ability_recover_chorus` | An ensemble-recovery identity with original symbols, attire, and values. |

## 3) Map / places: full graph

The four starts are equivalent performance districts, not races or classes. Each district has a non-capital hub. Travel is physical through `crossfade_causeway`; there is no teleport. Visited places reveal pins and exits; unvisited places show only a safe outline. Streets use pins, while indoor venues use a floor-plan with room nodes. Instance doors are places and never display a kilometer-scale map inside a room.

| Place ID | Public name | Zone | Scale | Danger | Outdoor | Exits | NPC IDs | Optional dungeon |
|---|---|---|---|---|---|---|---|---|
| `bellglass_ward` | Bellglass Ward | `bellglass_start` | street | safe | true | `bellglass_square`,`crossfade_causeway` | `npcs_arden`,`npcs_lio` | — |
| `bellglass_square` | Bellglass Square | `bellglass_start` | street | safe | true | `bellglass_ward`,`old_signal_booth` | `npcs_arden`,`npcs_sable` | — |
| `old_signal_booth` | Old Signal Booth | `bellglass_start` | street | low | false | `bellglass_square`,`whisper_stage_door` | `npcs_mina` | `signal_stair_showcase` |
| `whisper_stage_door` | Whisper Stage Door | `bellglass_start` | street | low | true | `old_signal_booth`,`whisper_backstage` | `npcs_sable`,`npcs_arden` | `signal_stair_showcase` |
| `whisper_backstage` | Whisper Stage Backstage | `bellglass_start` | dungeon | low | false | `whisper_stage_door`,`whisper_stage` | `npcs_mina`,`npcs_sable` | `signal_stair_showcase` |
| `whisper_stage` | Whisper Stage | `bellglass_start` | dungeon | medium | false | `whisper_backstage`,`whisper_stage_exit` | `npcs_arden` | `signal_stair_showcase` |
| `bellglass_hub` | Glasshouse Commons | `bellglass_start` | street | safe | true | `bellglass_ward`,`crossfade_causeway`,`wardrobe_lane` | `npcs_arden`,`npcs_mina`,`npcs_sable` | — |
| `wardrobe_lane` | Wardrobe Lane | `bellglass_start` | street | safe | true | `bellglass_hub` | `npcs_rue` | — |
| `rainmarket_steps` | Rainmarket Steps | `rainmarket_start` | street | safe | true | `rainmarket_roof`,`crossfade_causeway` | `npcs_bram`,`npcs_vesa` | — |
| `rainmarket_roof` | Rainmarket Roof | `rainmarket_start` | street | low | true | `rainmarket_steps`,`tin_echo_room` | `npcs_bram`,`npcs_juno` | `tin_echo_showcase` |
| `tin_echo_room` | Tin Echo Room | `rainmarket_start` | dungeon | low | false | `rainmarket_roof`,`tin_echo_floor` | `npcs_juno`,`npcs_vesa` | `tin_echo_showcase` |
| `tin_echo_floor` | Tin Echo Floor | `rainmarket_start` | dungeon | medium | false | `tin_echo_room`,`rainmarket_steps` | `npcs_bram` | `tin_echo_showcase` |
| `rainmarket_hub` | Awning Chorus | `rainmarket_start` | street | safe | true | `rainmarket_steps`,`crossfade_causeway`,`bolt_bazaar` | `npcs_bram`,`npcs_vesa`,`npcs_juno` | — |
| `bolt_bazaar` | Bolt Bazaar | `rainmarket_start` | street | safe | true | `rainmarket_hub` | `npcs_vesa` | — |
| `lantern_quay` | Lantern Quay | `lantern_start` | street | safe | true | `lantern_quay_dock`,`crossfade_causeway` | `npcs_cal`,`npcs_ona` | — |
| `lantern_quay_dock` | Quay Dock | `lantern_start` | street | low | true | `lantern_quay`,`blue_rope_hall` | `npcs_cal`,`npcs_pax` | `blue_rope_showcase` |
| `blue_rope_hall` | Blue Rope Hall | `lantern_start` | dungeon | low | false | `lantern_quay_dock`,`blue_rope_stage` | `npcs_ona`,`npcs_pax` | `blue_rope_showcase` |
| `blue_rope_stage` | Blue Rope Stage | `lantern_start` | dungeon | medium | false | `blue_rope_hall`,`lantern_quay` | `npcs_cal` | `blue_rope_showcase` |
| `lantern_hub` | Mooring Room | `lantern_start` | street | safe | true | `lantern_quay`,`crossfade_causeway`,`tidewalk` | `npcs_cal`,`npcs_ona`,`npcs_pax` | — |
| `tidewalk` | Tidewalk Tailors | `lantern_start` | street | safe | true | `lantern_hub` | `npcs_ona` | — |
| `paperhill_common` | Paperhill Common | `paperhill_start` | street | safe | true | `paperhill_bandstand`,`crossfade_causeway` | `npcs_dara`,`npcs_elm` | — |
| `paperhill_bandstand` | Paperhill Bandstand | `paperhill_start` | street | low | true | `paperhill_common`,`folded_room` | `npcs_dara`,`npcs_kito` | `folded_song_showcase` |
| `folded_room` | Folded Room | `paperhill_start` | dungeon | low | false | `paperhill_bandstand`,`folded_apron` | `npcs_elm`,`npcs_kito` | `folded_song_showcase` |
| `folded_apron` | Folded Apron Stage | `paperhill_start` | dungeon | medium | false | `folded_room`,`paperhill_common` | `npcs_dara` | `folded_song_showcase` |
| `paperhill_hub` | Margin House | `paperhill_start` | street | safe | true | `paperhill_common`,`crossfade_causeway`,`inkyard` | `npcs_dara`,`npcs_elm`,`npcs_kito` | — |
| `inkyard` | Inkyard Costume Co-op | `paperhill_start` | street | safe | true | `paperhill_hub` | `npcs_elm` | — |
| `crossfade_causeway` | Crossfade Causeway | `mid_world` | street | low | true | `bellglass_hub`,`rainmarket_hub`,`lantern_hub`,`paperhill_hub`,`grand_lumen` | `npcs_sol` | — |
| `grand_lumen` | Grand Lumen Capital | `capital_night` | street | safe | true | `crossfade_causeway`,`lumen_stage`,`producer_arcade` | `npcs_sol`,`npcs_vail`,`npcs_riya` | — |
| `producer_arcade` | Producer Arcade | `capital_night` | street | safe | true | `grand_lumen`,`lumen_stage` | `npcs_vail`,`npcs_riya` | — |
| `lumen_stage` | Lumen Stage | `capital_night` | dungeon | medium | false | `grand_lumen`,`lumen_backstage` | `npcs_sol`,`npcs_vail` | `lumen_big_night` |
| `lumen_backstage` | Lumen Stage Backstage | `capital_night` | dungeon | low | false | `lumen_stage`,`grand_lumen` | `npcs_riya` | `lumen_big_night` |

## 4) Durable NPCs

The following six NPCs anchor the primary start, Bellglass Ward. Every NPC has fixed dialogue; strangers cannot send free text into the narrator.

| ID | Name | Place | Role |
|---|---|---|---|
| `npcs_arden` | Arden Pell | `bellglass_square` | quest, hub |
| `npcs_lio` | Lio Venn | `bellglass_ward` | profession, quest |
| `npcs_mina` | Mina Quill | `old_signal_booth` | quest, local |
| `npcs_sable` | Sable Orr | `whisper_stage_door` | merchant, quest |
| `npcs_rue` | Rue Calder | `wardrobe_lane` | merchant, profession |
| `npcs_sol` | Sol Aster | `crossfade_causeway` | hub, quest |

### Premade talk trees

| NPC | Greet | Quest offer | Progress | Turn-in | Gossip (three lines) | Refusal / rude |
|---|---|---|---|---|---|---|
| Arden Pell | “You found the square. Good; the square remembers every footstep.” | “Three neighborhood acts need one shared count. Will you carry the first rehearsal?” | “The cue flags are in order; now show me a clean entrance.” | “You made room for everyone. That is a headliner’s first skill.” | “The fountain hums in B-flat.” / “A quiet audience is still an audience.” / “Never tune while someone is speaking.” | “I will not trade a neighbor’s dignity for a louder show.” |
| Lio Venn | “My metronome is shy today. It hides behind the loose boards.” | “Bring me a brass spring and I can make the rehearsal clock honest.” | “The spring fits. Give the lever one careful turn.” | “Hear that? The beat is steady because you were steady.” | “Repair is composition with dirt under it.” / “Count rests as work.” / “A borrowed tool returns cleaner.” | “No. If you want shortcuts, ask someone selling noise.” |
| Mina Quill | “The booth is dark, but its memory is not.” | “Visit the booth, collect its three signal slips, and let the stage know the storm did not erase us.” | “One slip from each drawer; the old network is waking.” | “The lamps answered your hand. I can mark the safe route now.” | “Signals are promises with wires.” / “A pause can carry farther than a shout.” / “The roof leaks only on dramatic days.” | “Rudeness is not a volume control.” |
| Sable Orr | “Backstage is a promise: no one sees the seams unless we choose.” | “Deliver my hemline kit to the wardrobe lane, then return before the doors open.” | “The kit arrived without a missing pin. Excellent.” | “The costumes move with the performers now. That is the whole point.” | “A clasp can save a chorus.” / “Blue reads as calm under amber.” / “Never call a costume disposable.” | “If you insult the crew, the door stays closed.” |
| Rue Calder | “Welcome to Wardrobe Lane; every color has a listening side.” | “Collect two moon-thread spools from the market and label them for the four acts.” | “The spools are soft enough. Good hands notice small things.” | “Four labels, four acts, no one mistaken for another.” | “A silhouette is not a personality.” / “Pockets are a public service.” / “Repair marks are part of the story.” | “I sell clothes, not permission to bully people.” |
| Sol Aster | “The Causeway opens when the districts agree on a tempo.” | “Visit Glasshouse Commons, Awning Chorus, Mooring Room, and Margin House; bring their venue seals.” | “Four seals, one route. The capital can hear you now.” | “Grand Lumen is not a prize; it is a larger room to care for.” | “The best finale leaves a door open.” / “Rest is part of the setlist.” / “A crowd is many people, not one opinion.” | “No route is worth stepping on a friend.” |

### Bellglass hub canned lines

Arden says, “The fountain is early today.” Lio says, “Three taps, then breathe.” Mina says, “The booth light blinked twice.” Sable says, “Pins in the tray, please.” Rue says, “Choose a color that lets you move.” Sol says, “Causeway wind, carry the count.” A child at the square says, “Will the chorus come back?” The baker says, “Warm rolls after soundcheck.” A stagehand says, “Cable left, feet right.” The night watch says, “Doors close kindly, not suddenly.”

## 5) Premade choices / first hour

### Opening establishment deck

| Beat | Choice and stake |
|---|---|
| `opening_01` | Choose the kit and place the first personal mark on the act’s poster. Stake: the mark determines which first-hour role receives +1 rehearsal mastery. |
| `opening_02` | Choose origin: `bellglass_ward`, `rainmarket_steps`, `lantern_quay`, or `paperhill_common`. Stake: that district’s venue seal becomes the first campaign objective. |
| `opening_03` | Choose whether to perform an unfinished eight-count for a nervous child or hide the mistake. Stake: `observed_consequence` becomes `shared_courage` or `guarded_precision`. |
| `opening_04` | Choose the act’s promise: “make room,” “hold the beat,” “tell the truth,” or “leave a light.” Stake: one talent node begins unlocked, while another remains gated. |
| `opening_05` | Choose to spend the first gold on a repair kit or a stage ribbon. Stake: repair enables an extra retry; ribbon enables a cosmetic audience response. |

HookArc flags are `identity_confirmed`, `first_choice`, and `observed_consequence`. The forced tutorial path is: `visit_bellglass_square` → `talk_to_npcs_arden` → `collect_item cue_flag_bundle x1` → `visit_old_signal_booth` → `talk_to_npcs_mina` → `deliver_item signal_slip_bundle x1 to_npcs_arden` → `score_set rehearsal_bellglass_01` → `visit_bellglass_hub`.

At every Bellglass POI, the legal choice buttons include: “Read the posted cue card” (`visit_place`, no requirement); “Ask Arden for the local problem” (`talk_to_npc`, `npcs_arden`); “Check the prop shelf” (`collect_item`, `prop_shelf_tag x1`); “Practice the opening count” (`score_set`, `rehearsal_mastery >= 0`); “Offer a quiet reset” (`intent_kind rest`, `fatigue <= 60`); “Walk to the marked exit” (`visit_place`, exit unlocked); “Hand over the signal slips” (`deliver_item`, `signal_slip_bundle x1`); and “Leave a note for the next act” (`collect_item`, `neighbor_note x1`). Combat buttons are limited to authored rhythm moves such as “hold the count,” “cue the recovery,” and “cut the feedback”; there is no generic attack button.

Retries use eight fixed fingerprints: `missed_cue` (goal restore count, tactic listen, obstacle echo delay, revelation Mina’s slips are offset, consequence `cue_delay`); `lost_prop` (goal recover prop, tactic retrace, obstacle locked cabinet, revelation Lio has the key, consequence `repair_debt`); `quiet_room` (goal lift mood, tactic soften arrangement, obstacle audience fatigue, revelation rest improves score, consequence `fatigue_reduced`); `wardrobe_tangle` (goal clear costume path, tactic label colors, obstacle crossed tags, revelation Rue’s system, consequence `costume_mastery`); `storm_buzz` (goal stabilize booth, tactic isolate channel, obstacle damp wire, revelation signal booth shares ground, consequence `safe_route`); `split_count` (goal coordinate acts, tactic alternate lead, obstacle tempo drift, revelation each act hears differently, consequence `shared_count`); `late_arrival` (goal start fairly, tactic shorten intro, obstacle missing player, revelation the act can rotate roles, consequence `rotation_unlocked`); `open_door` (goal invite a shy act, tactic give them one line, obstacle fear of judgment, revelation consent builds trust, consequence `neighbor_guest`).

## 6) Quests: code-completeable DAGs

The primary start is Bellglass Ward. Rewards are ledger values, and every objective uses a code-owned verb.

| ID | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `slw_voice_find_the_first_line` | Find the First Line | identity | false | `slw_square_name_the_act` | `talk_to_npc:npcs_arden x1`; `collect_item:blank_lyric_card x1` | 8 | 20 |
| `slw_square_name_the_act` | Name the Act | identity | false | `slw_rhythm_repair_the_count` | `visit_place:bellglass_square x1`; `deliver_item:act_poster_draft x1 to:npcs_arden` | 10 | 24 |
| `slw_motion_mark_the_safe_path` | Mark the Safe Path | identity | false | `slw_harmony_tune_the_corner` | `visit_place:whisper_stage_door x1`; `collect_item:chalk_arrow x3` | 10 | 24 |
| `slw_harmony_tune_the_corner` | Tune the Corner | identity | false | `slw_voice_share_the_mistake` | `talk_to_npc:npcs_lio x1`; `score_set:corner_tuning_set x1` | 12 | 28 |
| `slw_voice_share_the_mistake` | Share the Mistake | identity | false | `slw_rhythm_repair_the_count` | `talk_to_npc:npcs_arden x1`; `score_set:unfinished_eight_count x1` | 12 | 30 |
| `slw_rhythm_repair_the_count` | Repair the Count | profession | false | `slw_signal_collect_the_slips` | `collect_item:brass_spring x1`; `deliver_item:brass_spring x1 to:npcs_lio` | 18 | 36 |
| `slw_signal_collect_the_slips` | Collect the Slips | zone_story | false | `slw_stage_clear_the_feedback` | `visit_place:old_signal_booth x1`; `collect_item:signal_slip x3` | 18 | 40 |
| `slw_stage_clear_the_feedback` | Clear the Feedback | zone_story | false | `slw_wardrobe_send_the_kit` | `ledger_kill:feedback_mote x4`; `visit_place:whisper_backstage x1` | 22 | 48 |
| `slw_wardrobe_send_the_kit` | Send the Hemline Kit | profession | false | `slw_square_invite_the_neighbors` | `deliver_item:hemline_kit x1 to:npcs_sable`; `visit_place:wardrobe_lane x1` | 16 | 34 |
| `slw_square_invite_the_neighbors` | Invite the Neighbors | side | false | `slw_stage_soundcheck` | `talk_to_npc:npcs_arden x1`; `collect_item:neighbor_note x4` | 20 | 42 |
| `slw_stage_soundcheck` | Soundcheck at Whisper | zone_story | false | `slw_stage_open_the_door` | `score_set:whisper_soundcheck x1`; `talk_to_npc:npcs_sable x1` | 24 | 55 |
| `slw_stage_open_the_door` | Open the Door | hidden_trust | true | `slw_stage_signal_stair` | `talk_to_npc:npcs_sable x1`; `talk_to_npc:npcs_mina x1`; `collect_item:guest_wristband x1` | 26 | 60 |
| `slw_stage_signal_stair` | Signal Stair | dungeon_breadcrumb | false | `signal_stair_showcase` | `visit_place:whisper_stage_door x1`; `collect_item:blue_signal_key x1` | 28 | 62 |
| `slw_daily_three_counts` | Three Counts Before Noon | daily | false | — | `score_set:three_counts_drill x1`; `visit_place:bellglass_hub x1` | 12 | 25 |
| `slw_daily_untangle_two_cables` | Untangle Two Cables | daily | false | — | `collect_item:cable_loop x2`; `deliver_item:cable_loop x2 to:npcs_lio` | 12 | 25 |
| `slw_extra_rue_labels` | Rue’s Four Labels | side | false | — | `collect_item:moon_thread_spool x2`; `deliver_item:labeled_thread_bundle x1 to:npcs_rue` | 18 | 32 |
| `slw_extra_mina_roof_note` | Note Above the Booth | side | false | — | `visit_place:old_signal_booth x1`; `collect_item:roof_note x1`; `talk_to_npc:npcs_mina x1` | 14 | 30 |
| `slw_extra_arden_rest_card` | A Rest Card for Arden | side | false | — | `collect_item:rest_card x1`; `deliver_item:rest_card x1 to:npcs_arden` | 10 | 22 |

The campaign spine then moves through `slw_causeway_four_seals` (visit all four hubs, 35 gold, 90 XP), `slw_capital_first_arrival` (visit `grand_lumen`, 40, 100), `slw_arcade_build_the_set` (collect `venue_memory_token x4`, 45, 110), `slw_capital_role_rotation` (score set `rotation_trial`, 50, 120), `slw_capital_rehearse_the_bridge` (talk to Sol and collect `bridge_chart`, 55, 130), `slw_capital_public_soundcheck` (score set `lumen_soundcheck`, 60, 145), `slw_big_night_opening` (visit `lumen_backstage`, 65, 160), `slw_big_night_shared_spotlight` (score set `lumen_big_night`, 90, 220), and `slw_big_night_afterglow` (talk to Sol, 50, 120). Each is a DAG node with the prior ID as `unlocksQuestId`; the objectives remain visit, talk, collect, deliver, or score-set checks.

Walk-aways write explicit divergence records: refusing the first shared rehearsal writes `divergence_bellglass_soloist`; choosing to repair the booth before inviting neighbors writes `divergence_signal_first`; declining the shared spotlight writes `divergence_rotating_finale`. The journal displays the record and its consequence instead of silently forgetting the promise. Daily quests are capped at three completions per character per day.

## 7) Performance opponents and collectibles

These are nonviolent stage hazards or personified sound faults; the all-ages skin resolves them through timing and reset actions rather than spectacle. Each start has 16 performance-skin species.

| Region | Species ID | Public name | Rarity | Habitat tags | Base HP | Base ATK | AC |
|---|---|---|---|---|---:|---:|---:|
| Bellglass | `feedback_mote` | Feedback Mote | common | booth, wire | 12 | 2 | 8 |
| Bellglass | `hush_knot` | Hush Knot | common | curtain, corner | 14 | 2 | 9 |
| Bellglass | `echo_puff` | Echo Puff | common | square, stone | 10 | 3 | 8 |
| Bellglass | `cue_spark` | Cue Spark | uncommon | lamp, cable | 18 | 4 | 10 |
| Bellglass | `tempo_wisp` | Tempo Wisp | uncommon | stair, metronome | 20 | 4 | 11 |
| Bellglass | `glass_rattle` | Glass Rattle | rare | window, backstage | 28 | 5 | 12 |
| Bellglass | `redline_chime` | Redline Chime | epic | stage, signal | 42 | 7 | 14 |
| Rainmarket | `awning_thrum` | Awning Thrum | common | canvas, rain | 13 | 2 | 8 |
| Rainmarket | `tin_tick` | Tin Tick | common | roof, gutter | 11 | 3 | 8 |
| Rainmarket | `market_murmur` | Market Murmur | common | crowd, stall | 15 | 2 | 9 |
| Rainmarket | `brass_blink` | Brass Blink | uncommon | lamp, bolt | 19 | 4 | 10 |
| Rainmarket | `sync_skein` | Sync Skein | uncommon | cable, roof | 21 | 4 | 11 |
| Rainmarket | `rain_crescent` | Rain Crescent | rare | puddle, sign | 30 | 5 | 12 |
| Rainmarket | `rooftop_ringer` | Rooftop Ringer | epic | bell, awning | 45 | 7 | 14 |
| Lantern Quay | `rope_ripple` | Rope Ripple | common | dock, knot | 14 | 2 | 8 |
| Lantern Quay | `tide_tap` | Tide Tap | common | water, crate | 12 | 3 | 8 |
| Lantern Quay | `hull_hum` | Hull Hum | common | pier, timber | 16 | 2 | 9 |
| Lantern Quay | `blue_buzz` | Blue Buzz | uncommon | rope, lamp | 20 | 4 | 10 |
| Lantern Quay | `chorus_crab` | Chorus Crab | uncommon | dock, shell | 22 | 4 | 11 |
| Lantern Quay | `mooring_muse` | Mooring Muse | rare | tide, hall | 32 | 5 | 12 |
| Lantern Quay | `bellwake` | Bellwake | epic | buoy, stage | 48 | 7 | 14 |
| Paperhill | `paper_scrape` | Paper Scrape | common | poster, wall | 12 | 2 | 8 |
| Paperhill | `margin_murmur` | Margin Murmur | common | book, bench | 14 | 2 | 9 |
| Paperhill | `ink_pop` | Ink Pop | common | print, sign | 11 | 3 | 8 |
| Paperhill | `folded_beat` | Folded Beat | uncommon | paper, stage | 20 | 4 | 10 |
| Paperhill | `rhyme_reed` | Rhyme Reed | uncommon | park, bandstand | 22 | 4 | 11 |
| Paperhill | `page_turner` | Page Turner | rare | script, curtain | 31 | 5 | 12 |
| Paperhill | `apron_anthem` | Apron Anthem | epic | kitchen, stage | 44 | 7 | 14 |

Collectibles include `blank_lyric_card`, `act_poster_draft`, `chalk_arrow`, `brass_spring`, `signal_slip`, `hemline_kit`, `neighbor_note`, `moon_thread_spool`, `bridge_chart`, and `venue_memory_token`. None are creatures, mascots, or licensed artifacts.

## 8) Loot / economy

Gold pays for repairs, rehearsal materials, and ordinary travel services. Cosmetic tokens pay only for dyes, lighting motifs, poster frames, and stage introductions; the wallets never mix. Personal loot is rolled after a committed instance result.

| Item ID | Template | Source | Function |
|---|---|---|---|
| `rainbox_drum` | starter instrument | kit choice | score-set timing, no direct combat power |
| `amber_tine` | starter tuning prop | kit choice | harmony rehearsal action |
| `cue_flag_bundle` | starter stage tool | Arden | unlocks cue-card choices |
| `wardrobe_patch_kit` | profession output | Rue | reduces costume fatigue by ledger rule |
| `signal_lens` | dungeon drop | `signal_stair_showcase` | cosmetic booth lens; no score bonus |
| `velvet_edge_jacket` | cosmetic | `lumen_big_night` | appearance only |
| `afterglow_poster_frame` | cosmetic | capital vendor | appearance only |

Drop tables: Bellglass common hazards award `cable_loop` at 35%, `lamp_wick` at 25%, and `neighbor_note` at 10%; elite `glass_rattle` awards `signal_lens` at 18% and `venue_memory_token` at 12%; showcase bosses award one personal cosmetic from the venue table and 30–60 gold. Vendors sell cue flags for 6 gold, chalk arrows for 4, patch kits for 12, and cosmetic dyes for 20 cosmetic tokens. `repairCostPerPoint = 2` gold for damaged props; performance fatigue is repaired by rest, never by payment.

Faucets are quest rewards, completed set rewards, and fair vendor buybacks. Sinks are repairs, rehearsal materials, travel permits, and optional venue donations. Daily gold income is capped at 240 per character; cosmetic tokens come from first-clear milestones, community showcases, and seasonal catalog achievements. No premium purchase grants score, mastery, catch success, lockout bypass, or random power.

## 9) Instances

### Soloable five-person-equivalent: `signal_stair_showcase`

| Room | `describeBeforeCreature` room script | Trash / elite / checkpoint / boss | Exits |
|---|---|---|---|
| `signal_room_01` | “A narrow booth smells of rain and warm dust. Three dead lamps point toward a cable trench.” | 3 `feedback_mote`; no elite | `signal_room_02` |
| `signal_room_02` | “The stairwell turns around a hollow center where each footstep returns half a beat late.” | 2 `hush_knot`; elite `tempo_wisp` count 1 | `signal_checkpoint` |
| `signal_checkpoint` | “A landing holds four folding chairs and a chalked rest symbol. The chairs face one another.” | Checkpoint commits set and fatigue. No encounter. | `signal_room_03` |
| `signal_room_03` | “Cables cross the floor like black ribbons, each tied to a different colored lamp.” | 4 `cue_spark`; 1 `glass_rattle` elite | `signal_room_04` |
| `signal_room_04` | “The stage is small enough to see every seam, with a suspended sign trembling above the center mark.” | 3 `echo_puff`; 2 `feedback_mote` | `signal_boss_room` |
| `signal_boss_room` | “A circular stage sits under one honest white lamp. The room waits for a count rather than a blow.” | Boss `redline_chime` count 1; ledger phases: isolate, answer, shared finale. | `signal_exit` |

The boss is defeated by legal score-set actions: `hold_count`, `cut_feedback`, `cue_recovery`, and `invite_harmony`. It drops personal loot and posts the `signal_stair_cleared` flag. Wipe returns players to `signal_checkpoint` after the checkpoint has been reached.

### Big night equivalent: `lumen_big_night`

This is a five-act concert instance, not a raid. Rooms are `lumen_load_in`, `lumen_soundcheck`, `lumen_greenroom`, `lumen_stage_left`, `lumen_stage_right`, and `lumen_afterglow`. The audience mood is shared, but each act retains its own score set. The final act requires a committed choice between `shared_spotlight`, `rotating_spotlight`, or `quiet_encore`; all three are valid authored endings with different cosmetic titles and divergence records. There is no raid-10 requirement for this all-ages performance world.

## 10) Progression

No node is purchased with premium currency. Costs are gold or earned rehearsal marks.

| Node ID | Cost | Requires | Effect flags |
|---|---:|---|---|
| `talent_clear_cue` | 20 | — | unlock `ability_clear_cue` |
| `talent_split_count` | 25 | `talent_clear_cue` | unlock `ability_split_count` |
| `talent_recover_chorus` | 30 | `talent_split_count` | unlock `ability_recover_chorus` |
| `talent_anchor_blocking` | 20 | — | unlock `ability_anchor_blocking` |
| `talent_safe_rotation` | 30 | `talent_anchor_blocking` | reduce role-swap fatigue |
| `talent_stage_read` | 35 | `talent_safe_rotation` | reveal audience target tag |
| `talent_ensemble_breath` | 25 | — | improve rest card outcome |
| `talent_harmony_bridge` | 35 | `talent_ensemble_breath` | unlock bridge segment |
| `talent_unison_recovery` | 45 | `talent_harmony_bridge` | one recovery per set |
| `license_small_venue` | 20 | — | enter showcase doors |
| `license_district_night` | 40 | `license_small_venue` | accept district contracts |
| `license_capital_stage` | 70 | `license_district_night` | enter `lumen_stage` |
| `recipe_patch_hem` | 15 | — | craft `wardrobe_patch_kit` |
| `recipe_cue_flag` | 25 | `recipe_patch_hem` | craft `cue_flag_bundle` |
| `recipe_lamp_wick` | 30 | `recipe_cue_flag` | craft `lamp_wick` |
| `cosmetic_frame_gallery` | 30 | — | unlock poster frames |

Daily and weekly contracts are capped: complete one district rehearsal for 20 gold; repair three props for 18 gold and one cosmetic token; mentor a guest act for 25 gold; perform a no-retry set for 30 gold; complete one venue seal route weekly for 80 gold and 5 cosmetic tokens. Caps are visible in the journal.

## 11) Theme Kit + copy

`stage_light_glass_and_velvet` uses warm ivory, dusk violet, lamp amber, sea-glass teal, and charcoal ink. Materials are frosted glass, brushed brass, stitched velvet, paper tickets, and soft cork. Dice look like translucent rehearsal cubes with brass edges. The voice is intimate, encouraging, and observant; excitement rises through detail rather than shouting. The ambient loop is “after-rain venue hum”: distant buskers, a soft cable thrum, rain on awnings, and a three-note chime that never resolves. Default fashion is practical layered streetwear with removable stage accents.

| UI label | Stage Light copy |
|---|---|
| Inventory | Prop Case |
| Journal | Setlist Book |
| Map | Venue Route |
| Quest accepted | Added to Setlist |
| Quest complete | Marked Performed |
| Party | Ensemble |
| Character | Act Card |
| Skills | Rehearsal Craft |
| Crafting | Backstage Bench |
| Shop | Wardrobe Counter |
| Gold | House Notes |
| Cosmetic tokens | Gleam Stamps |
| Checkpoint | Soundcheck Save |
| Instance | Venue Run |
| Daily quests | Today’s Call Sheet |
| Weekly quests | Festival Board |
| Settings | House Rules |
| Leave instance | Clear the Stage |
| Retry | Take It Again |
| Rest | Cooldown Corner |

### New Game hook cards

1. “The first lamp flickers, and four districts discover they are listening to different counts.”
2. “A blank poster waits for a name that belongs to everyone who will stand beneath it.”
3. “The square has an audience, but no act wants to be first after the storm.”
4. “A broken signal booth still remembers every chorus it carried.”
5. “Your costume has one loose thread, and the whole entrance depends on noticing it.”
6. “The market roof turns rain into percussion; someone must decide whether to follow or lead.”
7. “At the quay, a rope knocks against the dock in a rhythm no one claims.”
8. “Paperhill’s bandstand has four empty marks and one stubbornly bright lamp.”
9. “Grand Lumen offers a larger stage, not a simpler promise.”
10. “Tonight’s question is not who shines brightest, but how many people the light can hold.”

## 12) Failures + John’s calls

1. **Clone risk: a generic fame ladder.** Avoided by making venue repair, consent-based collaboration, rest, and local audience trust the primary progression rather than celebrity ranking.
2. **Clone risk: interchangeable pop stars.** Avoided through four mechanically distinct craft kits, authored act promises, and role rotation that changes the set’s legal actions.
3. **Clone risk: exploitative elimination drama.** Avoided by no elimination vote, no trainee-house premise, and three valid big-night endings.
4. **Clone risk: rhythm-game button mimicry.** Avoided by score sets resolving authored goals, audience mood, fatigue, inventory, and relationship consequences together; timing is one input, not the entire identity.
5. **Open decision:** the exact seasonal catalog cadence is not blocking the world pack; default is four six-week catalogs per year, marked **speculative**. The catalog remains cosmetic-only.

## Integrity checklist

1. `worldId` is stable snake_case: `stage_light`.
2. Display name preserves the locked working name Stage Light.
3. The genre is idol/performance and is explicitly fenced from licensed franchises.
4. The ban-list contains more than 40 genre-specific names and patterns.
5. The rules module is `score_set`.
6. Ledger-owned score and fatigue are not invented by prose.
7. Wipe and checkpoint behavior is defined.
8. Weekly lockout behavior is defined.
9. Premium cannot buy performance power.
10. Gold and cosmetic tokens remain separate.
11. Four playable kits are original.
12. Four starting zones are present.
13. Each start has a non-capital hub.
14. Capitals and the mid-world merge are present.
15. Travel uses the Causeway and has no teleport.
16. Indoor places use room-scale instance maps.
17. Six durable primary-start NPCs are present.
18. Every primary-start NPC has canned greeting, offer, progress, turn-in, gossip, and refusal lines.
19. Hub chatter is fixed and finite.
20. Opening choices include stakes.
21. HookArc flags are explicit.
22. Retry fingerprints are authored rather than resampled.
23. The primary start has 18 authored quest beats.
24. Quest objectives use code-completeable verbs.
25. Quest rewards are numeric.
26. Campaign spine reaches the first concert.
27. Walk-aways write divergence records.
28. Opponent species are original sound hazards.
29. No Saltkin-named creatures are used.
30. Loot tables are personal and numeric.
31. Vendor prices and repair cost are specified.
32. Daily and weekly economy caps are specified.
33. The soloable five-person equivalent has five rooms plus checkpoint and boss.
34. Every instance room describes the room before its encounter.
35. The big instance is a concert night, as required for this skin.
36. Progression has 16 nodes with prerequisites and effects.
37. Daily and weekly contracts are capped.
38. Theme Kit includes colors, materials, dice, voice, loop, and fashion.
39. Twenty skinned UI labels are included.
40. Ten opening hooks are included.
41. Clone risks and avoidance calls are explicit.
42. No live service, source, save, or database references are present.
43. No dump-error names are used as canon.
44. No production application code is included.
45. The pack is original content only.
