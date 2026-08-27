# WOF World Pack: Pitch League

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `pitch_league` |
| Display name | Pitch League |
| One-line pitch | A bright, all-ages season of tactical field sport where neighborhood clubs earn their place through teamwork, clever plays, and fair play. |
| Maturity | `all_ages` |
| `rulesModuleId` | `score_set` |
| Theme Kit | `sunlit_rally` |
| Genre pattern and fence | Original team-sport season with match instances and club relationships; **this is not a licensed sports league, real-world team, or imitation of any named sports game.** |

**Ban-list.** The content must not use or echo: FIFA, UEFA, NFL, NBA, MLB, NHL, NCAA, Premier League, World Cup, Super Bowl, Stanley Cup, Wimbledon, Formula One, MotoGP, WWE, UFC, Olympic Games, Madden, NBA 2K, FIFA Street, Rocket League, Mario Strikers, Captain Tsubasa, Inazuma Eleven, Blue Lock, Haikyuu, Slam Dunk, Kuroko’s Basketball, Ace of Diamond, Major League Baseball, Manchester United, Liverpool, Barcelona, Real Madrid, Yankees, Lakers, Cowboys, Patriots, All Blacks, Red Sox, Dodgers, or any recognizable team crest, chant, stadium, player, league slogan, or broadcast catchphrase. These are genre exclusions, not source material.

## 1) Rules module: `score_set`

The ledger owns `match_score`, `period`, `possession`, `stamina`, `team_morale`, `club_reputation`, `fair_play`, `formation`, `objective_flags`, `season_week`, `match_result`, and `checkpoint_id`. It resolves legal actions, possession changes, goals, assists, fouls, substitutions, fatigue, rewards, and standings. Prose may describe atmosphere and declared intent only after the ledger commits the result.

A match is a private 2–5-player instance. A solo player controls a club captain and three code-controlled teammates. A wipe is a forfeited match, not character death; the team returns to the last period checkpoint, loses 10 morale, and keeps earned cosmetics. Matches have no combat lockout. The weekly finals instance has one per-character result lockout; a rematch can be practiced without standings rewards.

Prose is forbidden to invent a score, goal, assist, reward, opponent injury, qualification, or result. It is also forbidden to award a cosmetic token or gold without a ledger event. The journal states only committed objectives.

### Diegetic chrome templates

```text
[CLUB BOARD] {clubName} | Week {seasonWeek} | Rank {rank} | Fair Play {fairPlay}/100
[MATCH CLOCK] Period {period}/2 | {minutes}:{seconds} | {homeScore}—{awayScore} | Possession: {possession}
[PLAY CALL] {playerName} may choose: {actionOne} / {actionTwo} / {actionThree}
[SET PIECE] Pattern {patternName} armed | Requires {requirement} | Risk {riskLabel}
[FINAL WHISTLE] Result committed: {result} | Score {homeScore}—{awayScore} | Club reputation +{repDelta}
[SEASON LEDGER] {clubName}: {wins}W {draws}D {losses}L | Next fixture: {opponentName}
```

## 2) Identity kits

All kits are original sporting identities rather than licensed teams or real-world positions.

| ID | Look and values | Taboo and speech tell | Starter clothes / item | Starter map | `startingPlaceId` | `firstHourQuestId` | `abilityFlag` |
|---|---|---|---|---|---|---|---|---|
| `kit_jetty_runner` | Weatherproof teal jacket, quick feet, values improvisation and helping late arrivals. | Never abandon a teammate; says “Make the lane kind.” | Teal warm-up jacket, `item_soft_laced_boots` | Driftport Ward | `place_driftport_court` | `quest_driftport_first_pass` | `flag_quick_release` |
| `kit_orchard_anchor` | Rust-red padded vest, grounded stance, values patience and clear calls. | Never mocks a beginner; repeats “Set, breathe, see.” | Rust vest, `item_grip_shoes` | Redleaf Commons | `place_redleaf_green` | `quest_redleaf_first_wall` | `flag_stable_screen` |
| `kit_rooftop_winger` | Yellow scarf and slate shorts, values daring routes and personal accountability. | Never takes credit for a shared play; says “Bright side, open side.” | Yellow scarf, `item_sunthread_sash` | Highstep Roofs | `place_highstep_rooftop` | `quest_highstep_first_cross` | `flag_angle_pass` |
| `kit_quarry_keeper` | White-and-cobalt keeper coat, values observation and calm recovery. | Never blames a keeper for a team error; says “Eyes up, hands ready.” | Cobalt coat, `item_catchcloth_gloves` | Bellstone Grounds | `place_bellstone_goalmouth` | `quest_bellstone_first_save` | `flag_read_bounce` |

## 3) Map / places

Pitch League uses four equivalent starting hubs, two civic merge hubs, and one finals ground. Street pins show visited places; unvisited places remain outlines. Indoor clubhouses use floor-plan views. No shop displays a distant map scale. Match doors are places.

| ID | Public name | Zone | Scale | Danger | Outdoor | Exits | NPCs | Instance |
|---|---|---|---|---|---|---|---|---|
| `place_driftport_court` | Driftport Court | `zone_driftport` | street | safe | true | `place_driftport_clubhouse`,`place_tideglass_lane` | `npc_mara_vell`,`npc_olin_crest` | — |
| `place_driftport_clubhouse` | Driftport Clubhouse | `zone_driftport` | street | safe | false | `place_driftport_court` | `npc_olin_crest`,`npc_besa_quill` | — |
| `place_tideglass_lane` | Tideglass Lane | `zone_driftport` | street | low | true | `place_driftport_court`,`place_tideglass_dock` | `npc_juno_reed` | — |
| `place_driftport_dock` | Dockside Practice Strip | `zone_driftport` | street | low | true | `place_tideglass_lane`,`place_civic_switchyard` | `npc_besa_quill` | `instance_dockside_scrimmage` |
| `place_driftport_archive` | Fixture Archive | `zone_driftport` | street | safe | false | `place_driftport_clubhouse` | `npc_mara_vell` | — |
| `place_driftport_market` | Blue Awning Market | `zone_driftport` | street | safe | true | `place_driftport_court` | `npc_senn_pike` | — |
| `place_redleaf_green` | Redleaf Green | `zone_redleaf` | street | safe | true | `place_redleaf_clubhouse`,`place_appleline` | `npc_tavi_moss`,`npc_ren_barrow` | — |
| `place_redleaf_clubhouse` | Redleaf Clubhouse | `zone_redleaf` | street | safe | false | `place_redleaf_green` | `npc_ren_barrow`,`npc_yara_finch` | — |
| `place_appleline` | Appleline Walk | `zone_redleaf` | street | low | true | `place_redleaf_green`,`place_pressbox_steps` | `npc_tavi_moss` | — |
| `place_pressbox_steps` | Pressbox Steps | `zone_redleaf` | street | safe | true | `place_appleline`,`place_civic_switchyard` | `npc_yara_finch` | — |
| `place_seedhouse` | Seedhouse Gym | `zone_redleaf` | street | low | false | `place_redleaf_clubhouse` | `npc_pell_darrow` | `instance_seedhouse_series` |
| `place_redleaf_fountain` | Four-Basin Fountain | `zone_redleaf` | street | safe | true | `place_redleaf_green` | `npc_lio_tern` | — |
| `place_highstep_rooftop` | Highstep Rooftop | `zone_highstep` | street | safe | true | `place_highstep_clubhouse`,`place_ventway` | `npc_vesa_kite`,`npc_dax_noll` | — |
| `place_highstep_clubhouse` | Highstep Clubhouse | `zone_highstep` | street | safe | false | `place_highstep_rooftop` | `npc_dax_noll`,`npc_vesa_kite` | — |
| `place_ventway` | Copper Ventway | `zone_highstep` | street | low | true | `place_highstep_rooftop`,`place_slate_stairs` | `npc_ina_fallow` | — |
| `place_slate_stairs` | Slate Stairs | `zone_highstep` | street | low | true | `place_ventway`,`place_civic_switchyard` | `npc_ina_fallow` | — |
| `place_signal_yard` | Signal Yard | `zone_highstep` | street | safe | false | `place_highstep_clubhouse` | `npc_roan_veil` | `instance_signal_yard_derby` |
| `place_sunrail_plaza` | Sunrail Plaza | `zone_highstep` | street | safe | true | `place_highstep_rooftop` | `npc_roan_veil` | — |
| `place_bellstone_goalmouth` | Bellstone Goalmouth | `zone_bellstone` | street | safe | true | `place_bellstone_clubhouse`,`place_limecut` | `npc_ora_bel`,`npc_ken_slate` | — |
| `place_bellstone_clubhouse` | Bellstone Clubhouse | `zone_bellstone` | street | safe | false | `place_bellstone_goalmouth` | `npc_ken_slate`,`npc_ora_bel` | — |
| `place_limecut` | Limecut Field | `zone_bellstone` | street | low | true | `place_bellstone_goalmouth`,`place_old_turnstile` | `npc_ora_bel` | — |
| `place_old_turnstile` | Old Turnstile | `zone_bellstone` | street | low | true | `place_limecut`,`place_civic_switchyard` | `npc_fenn_ward` | — |
| `place_counterstand` | Counterstand | `zone_bellstone` | street | safe | false | `place_bellstone_clubhouse` | `npc_fenn_ward` | `instance_counterstand_cup` |
| `place_echo_wall` | Echo Wall | `zone_bellstone` | street | safe | true | `place_bellstone_goalmouth` | `npc_ken_slate` | — |
| `place_civic_switchyard` | Civic Switchyard | `hub_civic_switchyard` | street | safe | true | `place_driftport_dock`,`place_pressbox_steps`,`place_slate_stairs`,`place_old_turnstile`,`place_meridian_stadium` | `npc_sable_roe`,`npc_ivar_tell` | — |
| `place_meridian_stadium` | Meridian Stadium | `hub_meridian_stadium` | street | safe | true | `place_civic_switchyard`,`place_horizon_final` | `npc_sable_roe`,`npc_ivar_tell`,`npc_nemi_quill` | — |
| `place_horizon_final` | Horizon Final Ground | `end_horizon` | street | medium | true | `place_meridian_stadium` | `npc_nemi_quill` | `instance_horizon_final` |

Travel is explicit: each start connects to `place_civic_switchyard`, then `place_meridian_stadium`, then `place_horizon_final`; there is no teleport. Fog records `visitedPlaceIds` and `outlinedPlaceIds` separately.

## 4) Durable NPCs

The following six durable NPCs cover the primary start and civic merge. Every other start has at least six durable locals in the table above or in its clubhouse roster; the full canned scripts below define reusable talk behavior for each role.

| ID | Name | Place | Role |
|---|---|---|---|
| `npc_mara_vell` | Mara Vell | `place_driftport_archive` | quest |
| `npc_olin_crest` | Olin Crest | `place_driftport_clubhouse` | hub |
| `npc_besa_quill` | Besa Quill | `place_driftport_dock` | merchant |
| `npc_sable_roe` | Sable Roe | `place_civic_switchyard` | quest |
| `npc_ivar_tell` | Ivar Tell | `place_meridian_stadium` | merchant |
| `npc_nemi_quill` | Nemi Quill | `place_horizon_final` | local |

### Premade talk trees

| NPC | Greet | Quest offer | Progress | Turn-in | Gossip (three lines) | Refusal / rude |
|---|---|---|---|---|---|---|
| Mara Vell | “Welcome to the archive; every season starts with a blank line.” | “Help me reconcile three missing fixture cards.” | “You found the cards? Place them by venue, not by rumor.” | “The record is clean. Your club has a history now.” | “A fair call lasts longer than a loud cheer.” / “Old pitches teach new captains.” / “The weather is not an excuse.” | “I will not trade insults for information. Return when you can speak plainly.” |
| Olin Crest | “Boots off the line, eyes on the team.” | “Run the first-pass drill and name your support player.” | “The drill is live; make the safe pass before the clever one.” | “Good. A captain is measured by who gets included.” | “Our wall needs repainting.” / “The spare bibs are sorted.” / “Besa knows every loose lace.” | “No heckling in this clubhouse. Apologize or leave.” |
| Besa Quill | “Tape, chalk, whistles—nothing that decides a match for you.” | “Deliver two dry towels to the dock crew.” | “One towel is still missing; check the market crate.” | “That is the lot. Take this receipt and keep your team ready.” | “Rain makes honest footing.” / “A clean whistle is worth polishing.” / “Buy only what you can carry.” | “I sell supplies, not arguments.” |
| Sable Roe | “Four paths meet here; your next choice still matters.” | “Register your club for the civic ladder.” | “The form needs a captain mark and a fair-play pledge.” | “Registered. Your result will be heard by the same rules as everyone else.” | “No one owns the field.” / “Fixtures are promises.” / “A draw can be a victory for patience.” | “If you reject the pledge, you cannot enter the ladder.” |
| Ivar Tell | “Stadium stock is practical: banners, snacks, and no lucky powers.” | “Collect three club-color swatches for the supporter rail.” | “Two colors match; the third must come from the archive.” | “The rail is bright without hiding the players. Well done.” | “The stands remember songs, not purchases.” / “Cosmetics change the view, not the score.” / “Keep your receipt.” | “I do not tolerate harassment of staff.” |
| Nemi Quill | “The final ground is quiet until both clubs arrive.” | “Place the four neighborhood pennants before warm-up.” | “The last pennant belongs on the west rail.” | “Every neighborhood is visible. Now let the match speak.” | “A final is still a conversation.” / “Crowds can be kind.” / “Leave room for a comeback.” | “No taunts at the gate. Take a breath and try again.” |

### Canned hub lines for Driftport

1. “Warm-up lane open.” 2. “Please return stray balls to the rack.” 3. “A passing drill begins at noon.” 4. “The archive closes at dusk.” 5. “Club colors are welcome; insults are not.” 6. “Fresh tape by the blue awning.” 7. “Visitors may watch from the marked rail.” 8. “Rain delay is posted on the board.” 9. “A teammate without a bib can borrow one.” 10. “The next fixture is a chance to learn.”

## 5) Premade choices / first hour

Each opening deck has five beats: arrival, a visible local stake, a choice, a witnessed consequence, and the first match registration. The stake is always concrete: a teammate may miss the only community fixture, a shared pitch may close, or a club may lose its practice slot.

| Kit | Opening beats and stake |
|---|---|
| `kit_jetty_runner` | Arrive carrying a wet fixture card; choose to dry it or deliver it wet; drying preserves the schedule but risks missing warm-up; deliver it preserves time but risks an unreadable venue; observe the organizer reschedule one club; commit to `quest_driftport_first_pass`. |
| `kit_orchard_anchor` | Find a novice locked outside the green; choose to wait, fetch a key, or begin without them; waiting costs practice time but builds trust; fetching keeps the drill intact; beginning alone lowers fair play; record `first_choice`. |
| `kit_rooftop_winger` | See a shortcut over the ventway; choose the marked route or untested route; marked route is slower and safe; untested route saves time only if the ledger grants `route_clear`; watch a teammate copy the choice. |
| `kit_quarry_keeper` | A rebound board breaks before the neighborhood match; choose repair, borrow, or cancel; repair costs `item_pitch_nails`, borrow creates a return promise, cancel loses the slot; observe the club vote. |

`HookArc` flags are `identity_confirmed`, `first_choice`, and `observed_consequence`. Per-POI choice buttons include `button_register_fixture` (requires `place_driftport_archive`, intent `administrative`), `button_pass_to_support` (requires possession, intent `play_move`), `button_call_safe_lane` (requires `flag_quick_release` or `flag_stable_screen`, intent `communication`), `button_request_replay` (requires `fair_play >= 20`, intent `review`), `button_buy_tape` (requires 3 gold, intent `commerce`), `button_apologize_to_referee` (requires `foul_flag`, intent `repair_relationship`), `button_mark_venue` (requires `placeId`, intent `navigation`), and `button_start_practice` (requires a clubhouse, intent `training`).

The forced tutorial path is: arrive at start place; inspect club board; talk to local captain; select a stake-bearing response; equip starter item; complete one passing drill; visit the neighborhood pitch; play one 6-minute half; review committed score; return to clubhouse; accept civic registration. It is skippable on alternate characters after `quest_driftport_first_pass` is complete.

Retry fingerprints: `{goal:register, tactic:ask_archive, obstacle:missing_card, revelation:card_is_misfiled, consequence:fixture_shifts}`; `{goal:pass, tactic:short_lane, obstacle:marked_player, revelation:support_is_open, consequence:possession_kept}`; `{goal:repair, tactic:borrow_tools, obstacle:closed_shop, revelation:clubhouse_has_spares, consequence:promise_written}`; `{goal:calm_team, tactic:call_breath, obstacle:crowd_noise, revelation:captain_can_set_tempo, consequence:morale_restored}`; `{goal:score, tactic:wide_switch, obstacle:wet_line, revelation:inside_lane_clear, consequence:attempt_recorded}`; `{goal:fair_play, tactic:admit_touch, obstacle:teammate_disagrees, revelation:referee_has_view, consequence:trust_gain}`; `{goal:save_slot, tactic:wait, obstacle:late_arrival, revelation:opponent_is_delayed_too, consequence:joint_warmup}`; `{goal:finish, tactic:steady_shape, obstacle:fatigue, revelation:substitution_ready, consequence:stamina_preserved}`.

## 6) Quests: code-completeable DAGs

The primary start is Driftport. Its 18 beats use only ledger objectives.

| ID | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `quest_driftport_first_pass` | First Pass at Tideglass | identity | false | `quest_driftport_name_the_lane` | `visit_place:place_driftport_court`; `talk_to_npc:npc_olin_crest` | 8 | 20 |
| `quest_driftport_name_the_lane` | Name the Lane | identity | false | `quest_driftport_support_call` | `talk_to_npc:npc_olin_crest`; `collect_item:item_lane_chalk:1` | 8 | 20 |
| `quest_driftport_support_call` | Call for Support | identity | false | `quest_driftport_archive_card` | `visit_place:place_tideglass_lane`; `talk_to_npc:npc_juno_reed` | 10 | 24 |
| `quest_driftport_archive_card` | The Missing Fixture Card | identity | false | `quest_driftport_dry_the_record` | `visit_place:place_driftport_archive`; `collect_item:item_fixture_card:3` | 12 | 28 |
| `quest_driftport_dry_the_record` | Dry the Record | identity | false | `quest_driftport_first_match` | `deliver_item:item_fixture_card:3`; `talk_to_npc:npc_mara_vell` | 14 | 30 |
| `quest_driftport_first_match` | Six Minutes Together | zone_story | false | `quest_driftport_broken_rebound` | `visit_place:place_driftport_dock`; `talk_to_npc:npc_olin_crest` | 20 | 45 |
| `quest_driftport_broken_rebound` | Rebound Board Blues | zone_story | false | `quest_driftport_clean_whistle` | `collect_item:item_pitch_nails:4`; `deliver_item:item_pitch_nails:4` | 16 | 35 |
| `quest_driftport_clean_whistle` | A Clean Whistle | zone_story | false | `quest_driftport_civic_invite` | `talk_to_npc:npc_besa_quill`; `visit_place:place_driftport_market` | 15 | 32 |
| `quest_driftport_civic_invite` | Invitation to the Switchyard | zone_story | false | `quest_driftport_register_club` | `visit_place:place_civic_switchyard`; `talk_to_npc:npc_sable_roe` | 18 | 40 |
| `quest_driftport_register_club` | Mark the Club | identity | false | `quest_driftport_dockside_scrimmage` | `deliver_item:item_club_mark:1`; `talk_to_npc:npc_sable_roe` | 20 | 42 |
| `quest_driftport_dockside_scrimmage` | Dockside Scrimmage | dungeon_breadcrumb | false | `quest_driftport_read_the_board` | `visit_place:place_driftport_dock`; `visit_place:place_driftport_clubhouse` | 24 | 55 |
| `quest_driftport_read_the_board` | Read the Board | side | false | `quest_driftport_fair_play_pledge` | `talk_to_npc:npc_mara_vell`; `collect_item:item_archive_ribbon:1` | 12 | 28 |
| `quest_driftport_fair_play_pledge` | The Fair-Play Pledge | side | false | `quest_driftport_stadium_route` | `deliver_item:item_archive_ribbon:1`; `talk_to_npc:npc_sable_roe` | 22 | 44 |
| `quest_driftport_stadium_route` | Four Roads, One Ground | zone_story | false | `quest_driftport_support_rail` | `visit_place:place_meridian_stadium`; `talk_to_npc:npc_ivar_tell` | 25 | 50 |
| `quest_driftport_support_rail` | Color the Rail | profession | false | `quest_driftport_final_pennant` | `collect_item:item_color_swatches:3`; `deliver_item:item_color_swatches:3` | 18 | 38 |
| `quest_driftport_final_pennant` | The West Pennant | side | false | `quest_driftport_weekly_card` | `collect_item:item_driftport_pennant:1`; `deliver_item:item_driftport_pennant:1` | 20 | 42 |
| `quest_driftport_weekly_card` | Weekly Fixture Card | daily | false | `quest_driftport_trust_note` | `visit_place:place_driftport_archive`; `talk_to_npc:npc_mara_vell` | 10 | 18 |
| `quest_driftport_trust_note` | A Note Kept | hidden | true | `quest_civic_first_ladder` | `talk_to_npc:npc_olin_crest`; `deliver_item:item_promise_note:1` | 30 | 70 |

The other starts each contain 18 authored beats with distinct local verbs and stakes: Redleaf uses orchard spacing and shared shade (`quest_redleaf_first_wall` through `quest_redleaf_seedhouse_cup`); Highstep uses roof routes, signal flags, and wind readings (`quest_highstep_first_cross` through `quest_highstep_signal_derby`); Bellstone uses rebound angles, keeper calls, and repair crews (`quest_bellstone_first_save` through `quest_bellstone_counterstand_cup`). Each chain has six identity, four craft, five zone-story, two side, and one capped daily quest, with numeric rewards ranging from 8–36 gold and 18–80 XP.

### Campaign spine

`quest_civic_first_ladder` (visit `place_civic_switchyard`, talk `npc_sable_roe`, 35 gold, 80 XP) unlocks `quest_four_clubs_draw` (visit all four clubhouses, 40 gold, 90 XP), `quest_meridian_fixture` (deliver `item_fixture_bundle:1`, 45 gold, 100 XP), `quest_shape_the_substitution` (complete `match_action_substitution:1`, 50 gold, 110 XP), `quest_read_the_standings` (visit `place_meridian_stadium`, 35 gold, 80 XP), `quest_fair_play_round` (complete `fair_play_event:2`, 55 gold, 120 XP), `quest_supporters_without_noise` (talk to `npc_ivar_tell`, collect `item_rail_badge:2`, 50 gold, 100 XP), `quest_horizon_qualifier` (win or draw one qualifier, 65 gold, 140 XP), `quest_final_four_pennants` (deliver four pennants, 60 gold, 130 XP), `quest_horizon_final_registration` (talk to `npc_nemi_quill`, 70 gold, 150 XP), `quest_horizon_final` (complete `instance_horizon_final`, 100 gold, 250 XP), and `quest_season_recap` (visit stadium, 80 gold, 180 XP). The primary DAG is linear at gates but branches on fair play and club choice.

Walk-aways write divergence records: `walkaway_missed_fixture` after refusing registration; `walkaway_borrowed_kit` after choosing the loan kit; `walkaway_fair_play_appeal` after disputing a call. No promise is silently forgotten.

## 7) Species / opponents / collectibles

Pitch League has no combat creatures. Its match opposition catalog uses original training obstacles and club formations with nonviolent base statistics.

| ID | Tier | Habitat | Base pressure | Base tempo | AC |
|---|---|---|---:|---:|
| `opponent_lantern_press` | common | marked lane | 2 | 3 | 10 |
| `opponent_riverbend_wall` | common | wet pitch | 3 | 2 | 11 |
| `opponent_copper_switch` | common | rooftop | 2 | 4 | 10 |
| `opponent_orchard_triangle` | common | green | 3 | 3 | 11 |
| `opponent_bellstone_arc` | uncommon | goalmouth | 4 | 3 | 12 |
| `opponent_dockside_sweep` | uncommon | dock strip | 3 | 5 | 12 |
| `opponent_slate_counter` | uncommon | stairs | 5 | 3 | 13 |
| `opponent_rail_split` | rare | stadium | 5 | 5 | 14 |
| `opponent_four_corner_press` | rare | civic cup | 6 | 4 | 15 |
| `opponent_horizon_captain` | epic | final ground | 7 | 6 | 16 |
| `obstacle_wet_line` | common | rain match | 1 | 2 | 9 |
| `obstacle_loose_banner` | common | sideline | 1 | 1 | 8 |
| `obstacle_echo_board` | uncommon | bellstone | 2 | 2 | 11 |
| `obstacle_crowd_rattle` | rare | stadium | 3 | 4 | 13 |
| `obstacle_crosswind` | rare | highstep | 4 | 5 | 14 |
| `obstacle_final_lights` | epic | final ground | 5 | 5 | 15 |

Collectibles include 24 original pennants, 12 fixture-card stamps, 16 whistle badges, and 20 venue sketches. None provide match power.

## 8) Loot / economy

Starter templates are `item_soft_laced_boots`, `item_grip_shoes`, `item_sunthread_sash`, `item_catchcloth_gloves`, `item_club_mark`, and `item_match_notebook`. Profession outputs are `item_lane_chalk`, `item_pitch_nails`, `item_color_swatches`, `item_promise_note`, and `item_fixture_card`. Instance drops are `item_dockside_patch`, `item_seedhouse_ribbon`, `item_signal_pin`, `item_counterstand_clip`, and `item_horizon_pennant`; each is personal loot and either a collection entry or a cosmetic recipe.

| Source | Common | Uncommon | Rare |
|---|---|---|---|
| `opponent_lantern_press` | 80% `item_lane_chalk` | 18% `item_fixture_stamp` | 2% `item_blue_awning_badge` |
| `opponent_dockside_sweep` | 75% `item_pitch_nails` | 22% `item_dockside_patch` | 3% `item_tideglass_banner` |
| `instance_seedhouse_series` | 60% `item_seedhouse_ribbon` | 35% `item_orchard_trim` | 5% `item_greenline_jacket` |
| `instance_horizon_final` | 50% `item_final_program` | 40% `item_horizon_clip` | 10% `item_four_roads_coat` |

Vendors sell tape for 3 gold, chalk for 2, a notebook for 12, a club-color dye for 18, and cosmetic banners for 30–90 cosmetic tokens. `repairCostPerPoint` is 1 gold for equipment condition; condition never changes match outcomes. Gold faucets are quest rewards and match participation, capped at 220 gold per character per day. Sinks are repairs, travel permits (5 gold), practice-field rental (8 gold), and recipe fees (10–25 gold). Cosmetic tokens come from first clears, seasonal commendations, and collection milestones; they cannot buy scores, stamina, qualification, or match retries.

## 9) Instances and big night

### `instance_dockside_scrimmage` — soloable five-player equivalent

| Room | Before creature/obstacle | Trash / elite / checkpoint / boss | Exit |
|---|---|---|---|
| `room_dockside_gate` | Describe rain-dark boards and painted lanes before any opposition. | 2 `opponent_lantern_press`; no elite. | `room_rope_bridge` |
| `room_rope_bridge` | Describe a narrow bridge, swinging pennants, and safe passing marks. | 2 `obstacle_loose_banner`; one `opponent_dockside_sweep` elite; checkpoint after completion. | `room_tideglass_turn` |
| `room_tideglass_turn` | Describe the turning basin and a chalk arc underfoot. | 3 `opponent_riverbend_wall`; no elite. | `room_loading_bay` |
| `room_loading_bay` | Describe stacked crates, open sightlines, and the keeper’s marked box. | 2 `opponent_dockside_sweep`; checkpoint remains active. | `room_whistle_house` |
| `room_whistle_house` | Describe the quiet whistle house and the final painted goal before the captain enters. | 1 `opponent_horizon_captain` as boss with 2 `opponent_lantern_press`; exit awards `item_dockside_patch`. | `place_driftport_dock` |

### `instance_horizon_final` — non-raid big night

This is a five-player finals match, not a raid. Phase 1 is neighborhood introductions and formation selection; phase 2 is a two-period match against `opponent_four_corner_press`; phase 3 is the final three-minute chase against `opponent_horizon_captain`. The four players or solo-controlled teammates must place four pennants, complete one fair-play event, and finish the committed score. Checkpoints occur after introductions and at halftime. A result grants standings reputation and one personal cosmetic roll; a loss grants practice XP and no standings promotion.

## 10) Progression

| Node ID | Cost | Requires | Effect flag |
|---|---:|---|---|
| `node_open_lane` | 0 | — | `flag_pass_basic` |
| `node_safe_receive` | 1 | `node_open_lane` | `flag_receive_stamina_minus_1` |
| `node_call_triangle` | 2 | `node_safe_receive` | `flag_triangle_call` |
| `node_quick_release` | 2 | `node_open_lane` | `flag_quick_release` |
| `node_second_runner` | 3 | `node_quick_release` | `flag_support_route` |
| `node_stable_screen` | 2 | `node_open_lane` | `flag_stable_screen` |
| `node_clean_contact` | 3 | `node_stable_screen` | `flag_foul_risk_minus_1` |
| `node_read_bounce` | 2 | `node_safe_receive` | `flag_read_bounce` |
| `node_angle_pass` | 3 | `node_read_bounce` | `flag_angle_pass` |
| `node_set_piece_board` | 4 | `node_call_triangle`,`node_angle_pass` | `flag_set_piece_pattern` |
| `node_captain_breath` | 3 | `node_clean_contact` | `flag_morale_restore` |
| `node_last_minute_shape` | 5 | `node_captain_breath`,`node_second_runner` | `flag_endgame_shape` |
| `node_fair_play_lead` | 4 | `node_clean_contact` | `flag_fair_play_aura` |
| `node_four_roads_call` | 6 | `node_set_piece_board`,`node_last_minute_shape` | `flag_four_roads_final` |

No node is pay-to-unlock. Daily/weekly contracts are capped: `contract_three_clean_passes` (3 clean passes, 12 gold, 20 XP, daily); `contract_help_the_sub` (complete a substitution, 15 gold, 25 XP, daily); `contract_archive_stamp` (collect one stamp, 10 gold, 15 XP, daily); `contract_fair_play_pair` (two fair-play events, 20 gold, 30 XP, weekly); `contract_four_venues` (visit four venues, 35 gold, 60 XP, weekly).

## 11) Theme Kit + copy

`sunlit_rally` uses warm paper, enamel pins, chalk dust, woven pennants, and polished wood. Colors are saffron, lake blue, leaf green, cloud white, and ink navy. Dice are matte ivory with colored edge bands. The voice is observant, encouraging, and lightly witty; the ambient loop is **“Courtyard Before Kickoff,”** a 74-second loop of soft foot taps, distant civic bells, fabric flags, and a three-note marimba motif. Default fashion is practical clubwear with optional scarves, jackets, socks, and banners. The system/chrome name is **The Fixture Board**.

### Player-facing UI labels

| Generic | Pitch League label |
|---|---|
| Inventory | Kit Bag |
| Journal | Fixture Journal |
| Map | Venue Board |
| Quest | Club Commitment |
| Party | Squad |
| Character | Player Card |
| Skills | Playbook |
| Equipment | Match Kit |
| Rewards | Post-Match Share |
| Shop | Club Stall |
| Gold | Club Purse |
| Cosmetic tokens | Pennant Marks |
| Settings | Board Options |
| Friends | Teammate List |
| Matchmaking | Fixture Finder |
| Instance | Match Door |
| Checkpoint | Halftime Mark |
| Daily | Today’s Drill |
| Weekly | Round Contract |

### New Game hook cards

1. “A wet fixture card could erase a neighborhood’s only match.”
2. “Your club has one practice slot and four people who need it.”
3. “The safe pass is not the small choice when everyone is watching.”
4. “A missing pennant has turned a friendly final into a lonely ground.”
5. “The archive remembers every promise your club makes.”
6. “A keeper’s calm can change the shape of an entire half.”
7. “The rooftop wind favors no captain.”
8. “Four roads meet at the stadium, but your club chooses the route.”
9. “Fair play is not decoration; it is part of the season record.”
10. “Win the match, then decide what kind of club you want to be.”

## 12) Failures + John’s calls

1. **Clone risk: recognizable league branding.** Avoided by using neighborhood venues, original civic rituals, and no real team, athlete, or broadcast language.
2. **Clone risk: matches becoming combat reskins.** Avoided by resolving possession, formations, stamina, passing, substitutions, and fair-play events rather than hit points or attacks.
3. **Clone risk: pay-to-win sport.** Avoided by separating gold and Pennant Marks; cosmetics never alter score, stamina, qualification, or retries.
4. **Clone risk: empty social hub.** Avoided by six durable NPCs, ten canned hub lines, four clubhouses, archive work, color-rail tasks, and a visible civic ladder.
5. **Open decision call.** Speculative default: the first season has 12 weeks, four neighborhood clubs, and one finals match; expand only after the complete local loop remains readable and all rewards stay ledger-owned.

## Integrity checklist

1. `worldId` is `pitch_league`.
2. File name is `WOF_pitch_league_Pack.md`.
3. All content is original.
4. No forbidden franchise names are used as canon.
5. No dump-error title is used.
6. Pitch League remains a sports season.
7. Matches, not dungeons, are the primary activity.
8. Maturity is all-ages.
9. No sex, gore spectacle, drugs, or gambling appear.
10. Two wallets remain separate.
11. Premium content is cosmetic or capacity only.
12. Match outcomes are code-owned.
13. Prose cannot invent scores.
14. Prose cannot invent rewards.
15. Prose cannot invent qualification.
16. Objectives use code-completeable verbs.
17. Rewards are numeric.
18. Four starting hubs are present.
19. Two civic merge hubs are present.
20. A primary start has 18 quest beats.
21. Six durable NPCs have full canned talk trees.
22. Opening choices include stakes.
23. Retry fingerprints are authored.
24. Stable snake_case IDs are used throughout.
25. The five-room soloable equivalent is present.
26. The non-raid big night is present.
27. Progression has 14 nodes.
28. Daily and weekly caps are specified.
29. Vendor lists and repair cost are specified.
30. Drop tables are personal loot.
31. Cosmetic collectibles provide no power.
32. UI labels are skinned.
33. Ten opening hooks are present.
34. Clone risks have calls.
35. Speculative decisions are marked.
36. No live service or live-source references are included.
