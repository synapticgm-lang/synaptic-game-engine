# WOF Starwake: Press-Release Bill

> **Artifact status:** HAVE: setting bible already exists; this bill deliberately lists only release gaps and does not repeat its maps, peoples, quest DAGs, or ban-lists. **Release language is deliberately honest:** this is a text-world for solo and private co-op; it must not be described as an MMO until true multiplayer operation is proven.

## 0. Store identity

| Field | Release copy |
| --- | --- |
| Display name | **Starwake** |
| One-line pitch | Space opera, built for a private solo or 2–5 player text-world session. |
| Store paragraph | **Starwake** invites players into space opera. Begin with a local problem, choose what you are willing to risk, and turn a shared engine ledger into a personal story after each action is resolved. Travel in a themed text world alone or with invited friends, collect a complete Theme Kit with the world, and earn cosmetic keepsakes through clear play rather than paid outcomes. |
| Five bullets | Local first-hour problem; 2–5 private co-op; committed ledger before narration; cosmetic-only store; included Theme Kit. |
| Search keywords | starwake, text adventure, private co-op, solo, story world, Theme Kit, friends, choices, cosmetic, phone-first |
| Maturity / descriptors | **teen** — Mild peril and fantasy action. |
| What we will not claim | No MMO claim before proof; no live public network claim; no outcome-selling store; no persistent contested-PvP claim. |
| Included / DLC / Theme Kit | Included: authored solo/private-co-op pack and Theme Kit. DLC: future cosmetic story plates only. Theme Kit: included with the world purchase. |
| Two-wallet chrome | Gold: **Starwake Marks**. Cosmetic tokens: **Starwake Gleams**. Neither buys outcomes, catches, clears, power, or lockout skips. |

| Rating lane | Eligibility | Kid Mode extras |
| --- | --- | --- |
| All-ages | Family-safe text and art rewrite applied. | 10 turns/day; no public DMs, trade, or voice. |
| Teen | Age-gated mild peril and social stakes. | Same controls; soften or skip unsuitable scene plates. |
| Teen+ | Explicit gate for tense themes; no graphic gore. | Kid Mode not offered where the safety rewrite cannot retain meaning. |

## 1. Why this world

**Demand service.** `starwake` serves the demand row(s) mapped in `WOF_Demand_Vs_Have.md`; it is for players who want space opera within a readable, friends-first text session. It is not for players seeking competitive open-world PvP, unrestricted public chat, a power store, or an already-proven public MMO.

| Competitor pattern | WOF fence |
| --- | --- |
| Familiar genre setting with recognizable visual language | Use original places, entities, language, and art direction only. |
| Legacy progression / private-server nostalgia | Keep the desire for clear loops, not any map, class, monster, slogan, or data. |
| Social or sandbox platform | Use canned hub talk and private sessions; no unmoderated public identity market. |

## 2. Rules and code remaining

| Item | Status | Release artifact |
| --- | --- | --- |
| rulesModuleId | HAVE / CODE integration | `ship_board`; ledger fields: hull, crew, route, cargo, weather, berth, checkpoint, party. |
| Feature flags | CODE | `starwake_enabled`, `starwake_theme_kit`, `starwake_age_gate`, `starwake_festival`, `starwake_kill_switch`; add housing flavor or event flag only where the pack declares it. |
| Data files | CODE | `starwake_places, starwake_npcs, starwake_quests, starwake_talk, starwake_drops, starwake_vendors, starwake_interiors, starwake_talents, starwake_theme_kit`. |
| Eval probes | CODE | ship_board_probe_01, ship_board_probe_02, ship_board_probe_03, ship_board_probe_04, ship_board_probe_05, ship_board_probe_06, ship_board_probe_07, ship_board_probe_08, ship_board_probe_09, ship_board_probe_10. |
| World-only kill switches | CODE | Disable store listing, new starts, instance entry, festivals, themed talk, or Theme Kit apply independently; retain account entitlement receipt. |

No live-game import, production app code, network promise, or external save/database dependency is implied by this bill.

## 3. Content remaining versus friends-alpha

| Release path | Artifact / gap |
| --- | --- |
| First hour | Named opening room, local practical failure, four stake-bearing choices, first vendor, and a checkpoint. |
| 2–5 path | One private co-op instance with lockstep, personal loot, checkpoint wipe, and no mid-combat fill. |
| Big night | One cosmetic-only scheduled event; a 10-player raid requires a separate skin and capacity gate. |
| Capitals / mid | CODE: use established setting hubs; do not reprint bible geography. |
| Housing label | Private room / plot flavor only; no claim of public persistent housing. |
| Vendor / inn bind | One vendor and one safe checkpoint bind defined as data. |
| Daily / weekly examples | 1) visit a local notice; 2) complete a craft or talk; 3) take a scenic route; 4) finish a private instance; 5) attend a cosmetic festival. |

For this existing world, remaining gaps are typed data files, talk-runner coverage, interior entry/exit checks, a first-hour walk audit, world-only kill switch, store assets, and release QA—not a rewritten setting bible.

## 4. Art and images — briefs only

| Asset | Brief |
| --- | --- |
| App icon | `wof_starwake_icon.png`: readable emblem in local material, no licensed mark, clear at phone size. |
| Key art | `wof_starwake_keyart_hero.png`: one protagonist at a named hub, text-forward UI framing; `wof_starwake_keyart_kid.png`: safety rewrite or omit mature signal. |
| Screenshot shot list (8) | 1) opening at local hub; 2) first room description; 3) stake choice; 4) kit pane; 5) ledger commit; 6) vendor; 7) instance door; 8) festival. Each framed at **9:16 phone** and **16:9**, with a named place and named kit. |
| Portraits (4) | `courier`, `maker`, `scout`, `warden`: distinctive material, posed as text-play identity rather than copied archetype. |
| Establishing shots (4) | Hub, wild route, instance door, private-room/housing flavor; match the pack’s place names. |
| Theme Kit | System font stack; tactile dice material; labels Ledger / Route / Talk / Kit / Pack / Rest; one modest fashion default. |
| Text-plate stills (4) | Opening, first clear, first down, ending; generate later, use a Kid rewrite or skip rule where scene cannot be softened. |
| Color / material words | Local palette, paper grain, cloth, metal, stone, water, or wood as appropriate; no hex requirement and no 3D asset list. |
| Visual ban | Apply the 50-item pack ban-list to every prompt, filename, review, and art acceptance check. |

## 5. Audio

| Asset | Brief |
| --- | --- |
| Ambient loop | `wof_starwake_ambient_loop`: 45–75 second gentle environmental loop; no recognizable melody or direct stylistic imitation. |
| SFX cues (8) | wof_starwake_hit, wof_starwake_wipe, wof_starwake_mail, wof_starwake_level, wof_starwake_vendor, wof_starwake_instance_enter, wof_starwake_festival, wof_starwake_death. |
| Voice flavor | Short, warm, non-performative prompts; no imitation of a recognizable performer. |
| Hear-button line | “The route is ready when you are.” |

## 6. Live-ops and calendar

| festivalId | Month | Festival | Reward policy |
| --- | --- | --- | --- |
| starwake_fest_01 | Jan | Starwake First Light | Cosmetic title, plate, or dye; no power |
| starwake_fest_02 | Feb | Starwake Kindness Week | Cosmetic title, plate, or dye; no power |
| starwake_fest_03 | Mar | Starwake Open Routes | Cosmetic title, plate, or dye; no power |
| starwake_fest_04 | Apr | Starwake Repair Day | Cosmetic title, plate, or dye; no power |
| starwake_fest_05 | May | Starwake Pocket Parade | Cosmetic title, plate, or dye; no power |
| starwake_fest_06 | Jun | Starwake Long Table | Cosmetic title, plate, or dye; no power |
| starwake_fest_07 | Jul | Starwake Lantern Tide | Cosmetic title, plate, or dye; no power |
| starwake_fest_08 | Aug | Starwake Maker Fair | Cosmetic title, plate, or dye; no power |
| starwake_fest_09 | Sep | Starwake Quiet Harvest | Cosmetic title, plate, or dye; no power |
| starwake_fest_10 | Oct | Starwake Story Steps | Cosmetic title, plate, or dye; no power |
| starwake_fest_11 | Nov | Starwake Warm Window | Cosmetic title, plate, or dye; no power |
| starwake_fest_12 | Dec | Starwake Year Knot | Cosmetic title, plate, or dye; no power |


## 7. Legal and trust

**IP fence.** Starwake is an original setting with no copied protected setting names, locations, character designs, creature catalogues, text, musical motifs, visual marks, or licensed-world claims. Folklore-adjacent content is transformed into invented cultures and is reviewed for stereotype, sacred-content, and appropriation risks.

**User interaction and accessibility.** Only canned hub say-lines are available; report, mute, and block are required. Telemetry is hashed and minimized. TTS reads both chrome and prose, font scale is available, and danger is never color-only.

| macroId | Support macro |
| --- | --- |
| starwake_support_01 | Store entitlement receipt |
| starwake_support_02 | Theme Kit did not apply |
| starwake_support_03 | Checkpoint / lost-session explanation |
| starwake_support_04 | Age-gate or Kid Mode question |
| starwake_support_05 | Report / mute / block path |
| starwake_support_06 | Refund policy handoff |
| starwake_support_07 | Accessibility reading controls |
| starwake_support_08 | World temporarily unavailable |


## 8. QA and go-to-press gate

| testId | Human click test | Expected result |
| --- | --- | --- |
| starwake_click_01 | Open store page | Name, age label, and solo/private-co-op claim are legible. |
| starwake_click_02 | Select age gate | Maturity gate blocks unsuitable copy and presents Kid Mode. |
| starwake_click_03 | Start solo opening | Opening room appears before any threat. |
| starwake_click_04 | Choose first stake | A real time, reputation, or supply cost is visible. |
| starwake_click_05 | Read room prose | Text describes place, sound, and obstacle first. |
| starwake_click_06 | Open ledger | Committed fields display without narration changing values. |
| starwake_click_07 | Use a kit line | Kit flavor appears with no power sale. |
| starwake_click_08 | Travel to first hub | Route resolves without contested-PvP state. |
| starwake_click_09 | Inspect a local problem | A local issue is actionable in hour one. |
| starwake_click_10 | Accept a quest | Numeric reward and alternate outcome appear. |
| starwake_click_11 | Complete a noncombat action | Ledger commits then narration follows. |
| starwake_click_12 | Enter a 2–5 instance | Party cap and no mid-combat fill are stated. |
| starwake_click_13 | Trigger a wipe | Safe checkpoint policy appears. |
| starwake_click_14 | Return to checkpoint | Encounter-only state clears; no permadeath. |
| starwake_click_15 | Claim personal loot | Personal loot is distinct from party rolls. |
| starwake_click_16 | Visit vendor | Gold item has no outcome advantage. |
| starwake_click_17 | Inspect wallet separation | Gold and cosmetic tokens cannot be exchanged for power. |
| starwake_click_18 | Apply Theme Kit | Included kit changes chrome and labels. |
| starwake_click_19 | Enable TTS | Chrome and prose are read in order. |
| starwake_click_20 | Increase font scale | No content becomes color-only. |
| starwake_click_21 | Enable Kid Mode | 10-turn cap and disabled DM/trade/voice apply. |
| starwake_click_22 | Try blocked public DM | Control refuses and explains boundary. |
| starwake_click_23 | Report canned hub talk | Report, mute, block confirm locally. |
| starwake_click_24 | Open festival calendar | Reward is cosmetic-only. |
| starwake_click_25 | Use world kill switch | World content is unavailable without affecting other packs. |


| CI ban probe (15) | Requirement |
| --- | --- |
| `starwake_ban_01` | Reject 'borrowed franchise kingdom'. |
| `starwake_ban_02` | Reject 'named legacy faction'. |
| `starwake_ban_03` | Reject 'recognizable trademark crest'. |
| `starwake_ban_04` | Reject 'copyrighted character silhouette'. |
| `starwake_ban_05` | Reject 'direct map replica'. |
| `starwake_ban_06` | Reject 'copied quest text'. |
| `starwake_ban_07` | Reject 'lifted class name'. |
| `starwake_ban_08` | Reject 'licensed monster name'. |
| `starwake_ban_09` | Reject 'familiar mascot color code'. |
| `starwake_ban_10` | Reject 'signature spell wording'. |
| `starwake_ban_11` | Reject 'well-known catchphrase'. |
| `starwake_ban_12` | Reject 'named hero lineage'. |
| `starwake_ban_13` | Reject 'specific anime uniform'. |
| `starwake_ban_14` | Reject 'famous game-logo geometry'. |
| `starwake_ban_15` | Reject 'existing creature evolution chart'. |

| Budget class | SPEC per-subscription session |
| --- | --- |
| Narrative generation | SPEC: 900 visible prose tokens per committed turn; hard cap 1,400. |
| Latency | SPEC: 95th percentile under 3.0 seconds after a committed event. |
| Context | SPEC: 24,000 retained session tokens, then summarized from ledger-backed events only. |
| Safety review | SPEC: 100% of store copy and key-art prompts; 10% sampled canned talk per build. |

**Not ready until CODE closes:** entitlement verification, world data load, ledger integration, feature flags, kill switches, event scheduler, reporting pathway, accessibility test, performance test, and human approval of every release asset.

## 9. Press kit

**Press blurb (120 words).** Starwake is a new text-world from WOF, designed for a personal solo session or private co-op with up to five invited players. In a setting built around space opera, every scene begins with a local problem and a meaningful stake. The engine resolves the action first; narration then tells the story of what the ledger has committed. Players earn cosmetic keepsakes, collect a complete Theme Kit with the world, and choose routes that respect friends, boundaries, and time. WOF does not market Starwake as an MMO before multiplayer is proven. At launch, the promise is focused: a phone-first story world with readable choices, private teamwork, clear safety controls, and no store item that sells power, clears, catches, or a better outcome.

> **PLACEHOLDER pull quote:** “A remarkably deliberate little world.”
>
> **PLACEHOLDER pull quote:** “The choices feel local before they feel epic.”
>
> **PLACEHOLDER pull quote:** “Private co-op has room to breathe here.”

| Fact | Value |
| --- | --- |
| Genre | Text-world / space opera |
| Party size | Solo or 2–5 private co-op |
| Platform | Phone-first |
| Monetization | Buy-and-own world; included Theme Kit; cosmetic-only token wallet |
| Network language | Solo / private co-op until limited-online and true-MP gates are passed |

| FAQ | Answer |
| --- | --- |
| Is it an MMO? | No. It is described honestly as solo/private co-op until multiplayer is proven. |
| Is the Theme Kit extra? | No. The Theme Kit is included with each bought world. |
| Can I buy a stronger outcome? | No; power, clears, catches, lockout skips, and gacha are prohibited. |
| What happens on a wipe? | The party returns to a checkpoint and keeps personal loot; v1 has no permadeath. |
| Can children use it? | Age gates apply; appropriate worlds support Kid Mode with a 10-turn limit and no public DM, trade, or voice. |
