# WOF First-Song: Press-Release Bill

> **Artifact status:** HAVE: setting bible already exists; this bill deliberately lists only release gaps and does not repeat its maps, peoples, quest DAGs, or ban-lists. **Release language is deliberately honest:** this is a text-world for solo and private co-op; it must not be described as an MMO until true multiplayer operation is proven.

## 0. Store identity

| Field | Release copy |
| --- | --- |
| Display name | **First-Song** |
| One-line pitch | Fellowship and courtly fantasy, built for a private solo or 2–5 player text-world session. |
| Store paragraph | **First-Song** invites players into fellowship and courtly fantasy. Begin with a local problem, choose what you are willing to risk, and turn a shared engine ledger into a personal story after each action is resolved. Travel in a themed text world alone or with invited friends, collect a complete Theme Kit with the world, and earn cosmetic keepsakes through clear play rather than paid outcomes. |
| Five bullets | Local first-hour problem; 2–5 private co-op; committed ledger before narration; cosmetic-only store; included Theme Kit. |
| Search keywords | first-song, text adventure, private co-op, solo, story world, Theme Kit, friends, choices, cosmetic, phone-first |
| Maturity / descriptors | **teen** — Mild peril and fantasy action. |
| What we will not claim | No MMO claim before proof; no live public network claim; no outcome-selling store; no persistent contested-PvP claim. |
| Included / DLC / Theme Kit | Included: authored solo/private-co-op pack and Theme Kit. DLC: future cosmetic story plates only. Theme Kit: included with the world purchase. |
| Two-wallet chrome | Gold: **First-Song Marks**. Cosmetic tokens: **First-Song Gleams**. Neither buys outcomes, catches, clears, power, or lockout skips. |

| Rating lane | Eligibility | Kid Mode extras |
| --- | --- | --- |
| All-ages | Family-safe text and art rewrite applied. | 10 turns/day; no public DMs, trade, or voice. |
| Teen | Age-gated mild peril and social stakes. | Same controls; soften or skip unsuitable scene plates. |
| Teen+ | Explicit gate for tense themes; no graphic gore. | Kid Mode not offered where the safety rewrite cannot retain meaning. |

## 1. Why this world

**Demand service.** `first_song` serves the demand row(s) mapped in `WOF_Demand_Vs_Have.md`; it is for players who want fellowship and courtly fantasy within a readable, friends-first text session. It is not for players seeking competitive open-world PvP, unrestricted public chat, a power store, or an already-proven public MMO.

| Competitor pattern | WOF fence |
| --- | --- |
| Familiar genre setting with recognizable visual language | Use original places, entities, language, and art direction only. |
| Legacy progression / private-server nostalgia | Keep the desire for clear loops, not any map, class, monster, slogan, or data. |
| Social or sandbox platform | Use canned hub talk and private sessions; no unmoderated public identity market. |

## 2. Rules and code remaining

| Item | Status | Release artifact |
| --- | --- | --- |
| rulesModuleId | HAVE / CODE integration | `hp_check`; ledger fields: hp, guard, turn, gold, loot_seed, checkpoint, lockout, party. |
| Feature flags | CODE | `first_song_enabled`, `first_song_theme_kit`, `first_song_age_gate`, `first_song_festival`, `first_song_kill_switch`; add housing flavor or event flag only where the pack declares it. |
| Data files | CODE | `first_song_places, first_song_npcs, first_song_quests, first_song_talk, first_song_drops, first_song_vendors, first_song_interiors, first_song_talents, first_song_theme_kit`. |
| Eval probes | CODE | hp_check_probe_01, hp_check_probe_02, hp_check_probe_03, hp_check_probe_04, hp_check_probe_05, hp_check_probe_06, hp_check_probe_07, hp_check_probe_08, hp_check_probe_09, hp_check_probe_10. |
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
| App icon | `wof_first_song_icon.png`: readable emblem in local material, no licensed mark, clear at phone size. |
| Key art | `wof_first_song_keyart_hero.png`: one protagonist at a named hub, text-forward UI framing; `wof_first_song_keyart_kid.png`: safety rewrite or omit mature signal. |
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
| Ambient loop | `wof_first_song_ambient_loop`: 45–75 second gentle environmental loop; no recognizable melody or direct stylistic imitation. |
| SFX cues (8) | wof_first_song_hit, wof_first_song_wipe, wof_first_song_mail, wof_first_song_level, wof_first_song_vendor, wof_first_song_instance_enter, wof_first_song_festival, wof_first_song_death. |
| Voice flavor | Short, warm, non-performative prompts; no imitation of a recognizable performer. |
| Hear-button line | “The route is ready when you are.” |

## 6. Live-ops and calendar

| festivalId | Month | Festival | Reward policy |
| --- | --- | --- | --- |
| first_song_fest_01 | Jan | First-Song First Light | Cosmetic title, plate, or dye; no power |
| first_song_fest_02 | Feb | First-Song Kindness Week | Cosmetic title, plate, or dye; no power |
| first_song_fest_03 | Mar | First-Song Open Routes | Cosmetic title, plate, or dye; no power |
| first_song_fest_04 | Apr | First-Song Repair Day | Cosmetic title, plate, or dye; no power |
| first_song_fest_05 | May | First-Song Pocket Parade | Cosmetic title, plate, or dye; no power |
| first_song_fest_06 | Jun | First-Song Long Table | Cosmetic title, plate, or dye; no power |
| first_song_fest_07 | Jul | First-Song Lantern Tide | Cosmetic title, plate, or dye; no power |
| first_song_fest_08 | Aug | First-Song Maker Fair | Cosmetic title, plate, or dye; no power |
| first_song_fest_09 | Sep | First-Song Quiet Harvest | Cosmetic title, plate, or dye; no power |
| first_song_fest_10 | Oct | First-Song Story Steps | Cosmetic title, plate, or dye; no power |
| first_song_fest_11 | Nov | First-Song Warm Window | Cosmetic title, plate, or dye; no power |
| first_song_fest_12 | Dec | First-Song Year Knot | Cosmetic title, plate, or dye; no power |


## 7. Legal and trust

**IP fence.** First-Song is an original setting with no copied protected setting names, locations, character designs, creature catalogues, text, musical motifs, visual marks, or licensed-world claims. Folklore-adjacent content is transformed into invented cultures and is reviewed for stereotype, sacred-content, and appropriation risks.

**User interaction and accessibility.** Only canned hub say-lines are available; report, mute, and block are required. Telemetry is hashed and minimized. TTS reads both chrome and prose, font scale is available, and danger is never color-only.

| macroId | Support macro |
| --- | --- |
| first_song_support_01 | Store entitlement receipt |
| first_song_support_02 | Theme Kit did not apply |
| first_song_support_03 | Checkpoint / lost-session explanation |
| first_song_support_04 | Age-gate or Kid Mode question |
| first_song_support_05 | Report / mute / block path |
| first_song_support_06 | Refund policy handoff |
| first_song_support_07 | Accessibility reading controls |
| first_song_support_08 | World temporarily unavailable |


## 8. QA and go-to-press gate

| testId | Human click test | Expected result |
| --- | --- | --- |
| first_song_click_01 | Open store page | Name, age label, and solo/private-co-op claim are legible. |
| first_song_click_02 | Select age gate | Maturity gate blocks unsuitable copy and presents Kid Mode. |
| first_song_click_03 | Start solo opening | Opening room appears before any threat. |
| first_song_click_04 | Choose first stake | A real time, reputation, or supply cost is visible. |
| first_song_click_05 | Read room prose | Text describes place, sound, and obstacle first. |
| first_song_click_06 | Open ledger | Committed fields display without narration changing values. |
| first_song_click_07 | Use a kit line | Kit flavor appears with no power sale. |
| first_song_click_08 | Travel to first hub | Route resolves without contested-PvP state. |
| first_song_click_09 | Inspect a local problem | A local issue is actionable in hour one. |
| first_song_click_10 | Accept a quest | Numeric reward and alternate outcome appear. |
| first_song_click_11 | Complete a noncombat action | Ledger commits then narration follows. |
| first_song_click_12 | Enter a 2–5 instance | Party cap and no mid-combat fill are stated. |
| first_song_click_13 | Trigger a wipe | Safe checkpoint policy appears. |
| first_song_click_14 | Return to checkpoint | Encounter-only state clears; no permadeath. |
| first_song_click_15 | Claim personal loot | Personal loot is distinct from party rolls. |
| first_song_click_16 | Visit vendor | Gold item has no outcome advantage. |
| first_song_click_17 | Inspect wallet separation | Gold and cosmetic tokens cannot be exchanged for power. |
| first_song_click_18 | Apply Theme Kit | Included kit changes chrome and labels. |
| first_song_click_19 | Enable TTS | Chrome and prose are read in order. |
| first_song_click_20 | Increase font scale | No content becomes color-only. |
| first_song_click_21 | Enable Kid Mode | 10-turn cap and disabled DM/trade/voice apply. |
| first_song_click_22 | Try blocked public DM | Control refuses and explains boundary. |
| first_song_click_23 | Report canned hub talk | Report, mute, block confirm locally. |
| first_song_click_24 | Open festival calendar | Reward is cosmetic-only. |
| first_song_click_25 | Use world kill switch | World content is unavailable without affecting other packs. |


| CI ban probe (15) | Requirement |
| --- | --- |
| `first_song_ban_01` | Reject 'borrowed franchise kingdom'. |
| `first_song_ban_02` | Reject 'named legacy faction'. |
| `first_song_ban_03` | Reject 'recognizable trademark crest'. |
| `first_song_ban_04` | Reject 'copyrighted character silhouette'. |
| `first_song_ban_05` | Reject 'direct map replica'. |
| `first_song_ban_06` | Reject 'copied quest text'. |
| `first_song_ban_07` | Reject 'lifted class name'. |
| `first_song_ban_08` | Reject 'licensed monster name'. |
| `first_song_ban_09` | Reject 'familiar mascot color code'. |
| `first_song_ban_10` | Reject 'signature spell wording'. |
| `first_song_ban_11` | Reject 'well-known catchphrase'. |
| `first_song_ban_12` | Reject 'named hero lineage'. |
| `first_song_ban_13` | Reject 'specific anime uniform'. |
| `first_song_ban_14` | Reject 'famous game-logo geometry'. |
| `first_song_ban_15` | Reject 'existing creature evolution chart'. |

| Budget class | SPEC per-subscription session |
| --- | --- |
| Narrative generation | SPEC: 900 visible prose tokens per committed turn; hard cap 1,400. |
| Latency | SPEC: 95th percentile under 3.0 seconds after a committed event. |
| Context | SPEC: 24,000 retained session tokens, then summarized from ledger-backed events only. |
| Safety review | SPEC: 100% of store copy and key-art prompts; 10% sampled canned talk per build. |

**Not ready until CODE closes:** entitlement verification, world data load, ledger integration, feature flags, kill switches, event scheduler, reporting pathway, accessibility test, performance test, and human approval of every release asset.

## 9. Press kit

**Press blurb (120 words).** First-Song is a new text-world from WOF, designed for a personal solo session or private co-op with up to five invited players. In a setting built around fellowship and courtly fantasy, every scene begins with a local problem and a meaningful stake. The engine resolves the action first; narration then tells the story of what the ledger has committed. Players earn cosmetic keepsakes, collect a complete Theme Kit with the world, and choose routes that respect friends, boundaries, and time. WOF does not market First-Song as an MMO before multiplayer is proven. At launch, the promise is focused: a phone-first story world with readable choices, private teamwork, clear safety controls, and no store item that sells power, clears, catches, or a better outcome.

> **PLACEHOLDER pull quote:** “A remarkably deliberate little world.”
>
> **PLACEHOLDER pull quote:** “The choices feel local before they feel epic.”
>
> **PLACEHOLDER pull quote:** “Private co-op has room to breathe here.”

| Fact | Value |
| --- | --- |
| Genre | Text-world / fellowship and courtly fantasy |
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
