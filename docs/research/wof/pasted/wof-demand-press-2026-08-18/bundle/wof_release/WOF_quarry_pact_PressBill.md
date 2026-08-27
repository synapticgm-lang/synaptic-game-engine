# WOF Quarry Pact: Press-Release Bill

> **Artifact status:** HAVE: setting bible already exists; this bill deliberately lists only release gaps and does not repeat its maps, peoples, quest DAGs, or ban-lists. **Release language is deliberately honest:** this is a text-world for solo and private co-op; it must not be described as an MMO until true multiplayer operation is proven.

## 0. Store identity

| Field | Release copy |
| --- | --- |
| Display name | **Quarry Pact** |
| One-line pitch | Cooperative hunting, built for a private solo or 2–5 player text-world session. |
| Store paragraph | **Quarry Pact** invites players into cooperative hunting. Begin with a local problem, choose what you are willing to risk, and turn a shared engine ledger into a personal story after each action is resolved. Travel in a themed text world alone or with invited friends, collect a complete Theme Kit with the world, and earn cosmetic keepsakes through clear play rather than paid outcomes. |
| Five bullets | Local first-hour problem; 2–5 private co-op; committed ledger before narration; cosmetic-only store; included Theme Kit. |
| Search keywords | quarry pact, text adventure, private co-op, solo, story world, Theme Kit, friends, choices, cosmetic, phone-first |
| Maturity / descriptors | **teen** — Mild peril and fantasy action. |
| What we will not claim | No MMO claim before proof; no live public network claim; no outcome-selling store; no persistent contested-PvP claim. |
| Included / DLC / Theme Kit | Included: authored solo/private-co-op pack and Theme Kit. DLC: future cosmetic story plates only. Theme Kit: included with the world purchase. |
| Two-wallet chrome | Gold: **Quarry Pact Marks**. Cosmetic tokens: **Quarry Pact Gleams**. Neither buys outcomes, catches, clears, power, or lockout skips. |

| Rating lane | Eligibility | Kid Mode extras |
| --- | --- | --- |
| All-ages | Family-safe text and art rewrite applied. | 10 turns/day; no public DMs, trade, or voice. |
| Teen | Age-gated mild peril and social stakes. | Same controls; soften or skip unsuitable scene plates. |
| Teen+ | Explicit gate for tense themes; no graphic gore. | Kid Mode not offered where the safety rewrite cannot retain meaning. |

## 1. Why this world

**Demand service.** `quarry_pact` serves the demand row(s) mapped in `WOF_Demand_Vs_Have.md`; it is for players who want cooperative hunting within a readable, friends-first text session. It is not for players seeking competitive open-world PvP, unrestricted public chat, a power store, or an already-proven public MMO.

| Competitor pattern | WOF fence |
| --- | --- |
| Familiar genre setting with recognizable visual language | Use original places, entities, language, and art direction only. |
| Legacy progression / private-server nostalgia | Keep the desire for clear loops, not any map, class, monster, slogan, or data. |
| Social or sandbox platform | Use canned hub talk and private sessions; no unmoderated public identity market. |

## 2. Rules and code remaining

| Item | Status | Release artifact |
| --- | --- | --- |
| rulesModuleId | HAVE / CODE integration | `hunt_part`; ledger fields: hp, part_state, supplies, track, camp, checkpoint, lockout, party. |
| Feature flags | CODE | `quarry_pact_enabled`, `quarry_pact_theme_kit`, `quarry_pact_age_gate`, `quarry_pact_festival`, `quarry_pact_kill_switch`; add housing flavor or event flag only where the pack declares it. |
| Data files | CODE | `quarry_pact_places, quarry_pact_npcs, quarry_pact_quests, quarry_pact_talk, quarry_pact_drops, quarry_pact_vendors, quarry_pact_interiors, quarry_pact_talents, quarry_pact_theme_kit`. |
| Eval probes | CODE | hunt_part_probe_01, hunt_part_probe_02, hunt_part_probe_03, hunt_part_probe_04, hunt_part_probe_05, hunt_part_probe_06, hunt_part_probe_07, hunt_part_probe_08, hunt_part_probe_09, hunt_part_probe_10. |
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
| App icon | `wof_quarry_pact_icon.png`: readable emblem in local material, no licensed mark, clear at phone size. |
| Key art | `wof_quarry_pact_keyart_hero.png`: one protagonist at a named hub, text-forward UI framing; `wof_quarry_pact_keyart_kid.png`: safety rewrite or omit mature signal. |
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
| Ambient loop | `wof_quarry_pact_ambient_loop`: 45–75 second gentle environmental loop; no recognizable melody or direct stylistic imitation. |
| SFX cues (8) | wof_quarry_pact_hit, wof_quarry_pact_wipe, wof_quarry_pact_mail, wof_quarry_pact_level, wof_quarry_pact_vendor, wof_quarry_pact_instance_enter, wof_quarry_pact_festival, wof_quarry_pact_death. |
| Voice flavor | Short, warm, non-performative prompts; no imitation of a recognizable performer. |
| Hear-button line | “The route is ready when you are.” |

## 6. Live-ops and calendar

| festivalId | Month | Festival | Reward policy |
| --- | --- | --- | --- |
| quarry_pact_fest_01 | Jan | Quarry Pact First Light | Cosmetic title, plate, or dye; no power |
| quarry_pact_fest_02 | Feb | Quarry Pact Kindness Week | Cosmetic title, plate, or dye; no power |
| quarry_pact_fest_03 | Mar | Quarry Pact Open Routes | Cosmetic title, plate, or dye; no power |
| quarry_pact_fest_04 | Apr | Quarry Pact Repair Day | Cosmetic title, plate, or dye; no power |
| quarry_pact_fest_05 | May | Quarry Pact Pocket Parade | Cosmetic title, plate, or dye; no power |
| quarry_pact_fest_06 | Jun | Quarry Pact Long Table | Cosmetic title, plate, or dye; no power |
| quarry_pact_fest_07 | Jul | Quarry Pact Lantern Tide | Cosmetic title, plate, or dye; no power |
| quarry_pact_fest_08 | Aug | Quarry Pact Maker Fair | Cosmetic title, plate, or dye; no power |
| quarry_pact_fest_09 | Sep | Quarry Pact Quiet Harvest | Cosmetic title, plate, or dye; no power |
| quarry_pact_fest_10 | Oct | Quarry Pact Story Steps | Cosmetic title, plate, or dye; no power |
| quarry_pact_fest_11 | Nov | Quarry Pact Warm Window | Cosmetic title, plate, or dye; no power |
| quarry_pact_fest_12 | Dec | Quarry Pact Year Knot | Cosmetic title, plate, or dye; no power |


## 7. Legal and trust

**IP fence.** Quarry Pact is an original setting with no copied protected setting names, locations, character designs, creature catalogues, text, musical motifs, visual marks, or licensed-world claims. Folklore-adjacent content is transformed into invented cultures and is reviewed for stereotype, sacred-content, and appropriation risks.

**User interaction and accessibility.** Only canned hub say-lines are available; report, mute, and block are required. Telemetry is hashed and minimized. TTS reads both chrome and prose, font scale is available, and danger is never color-only.

| macroId | Support macro |
| --- | --- |
| quarry_pact_support_01 | Store entitlement receipt |
| quarry_pact_support_02 | Theme Kit did not apply |
| quarry_pact_support_03 | Checkpoint / lost-session explanation |
| quarry_pact_support_04 | Age-gate or Kid Mode question |
| quarry_pact_support_05 | Report / mute / block path |
| quarry_pact_support_06 | Refund policy handoff |
| quarry_pact_support_07 | Accessibility reading controls |
| quarry_pact_support_08 | World temporarily unavailable |


## 8. QA and go-to-press gate

| testId | Human click test | Expected result |
| --- | --- | --- |
| quarry_pact_click_01 | Open store page | Name, age label, and solo/private-co-op claim are legible. |
| quarry_pact_click_02 | Select age gate | Maturity gate blocks unsuitable copy and presents Kid Mode. |
| quarry_pact_click_03 | Start solo opening | Opening room appears before any threat. |
| quarry_pact_click_04 | Choose first stake | A real time, reputation, or supply cost is visible. |
| quarry_pact_click_05 | Read room prose | Text describes place, sound, and obstacle first. |
| quarry_pact_click_06 | Open ledger | Committed fields display without narration changing values. |
| quarry_pact_click_07 | Use a kit line | Kit flavor appears with no power sale. |
| quarry_pact_click_08 | Travel to first hub | Route resolves without contested-PvP state. |
| quarry_pact_click_09 | Inspect a local problem | A local issue is actionable in hour one. |
| quarry_pact_click_10 | Accept a quest | Numeric reward and alternate outcome appear. |
| quarry_pact_click_11 | Complete a noncombat action | Ledger commits then narration follows. |
| quarry_pact_click_12 | Enter a 2–5 instance | Party cap and no mid-combat fill are stated. |
| quarry_pact_click_13 | Trigger a wipe | Safe checkpoint policy appears. |
| quarry_pact_click_14 | Return to checkpoint | Encounter-only state clears; no permadeath. |
| quarry_pact_click_15 | Claim personal loot | Personal loot is distinct from party rolls. |
| quarry_pact_click_16 | Visit vendor | Gold item has no outcome advantage. |
| quarry_pact_click_17 | Inspect wallet separation | Gold and cosmetic tokens cannot be exchanged for power. |
| quarry_pact_click_18 | Apply Theme Kit | Included kit changes chrome and labels. |
| quarry_pact_click_19 | Enable TTS | Chrome and prose are read in order. |
| quarry_pact_click_20 | Increase font scale | No content becomes color-only. |
| quarry_pact_click_21 | Enable Kid Mode | 10-turn cap and disabled DM/trade/voice apply. |
| quarry_pact_click_22 | Try blocked public DM | Control refuses and explains boundary. |
| quarry_pact_click_23 | Report canned hub talk | Report, mute, block confirm locally. |
| quarry_pact_click_24 | Open festival calendar | Reward is cosmetic-only. |
| quarry_pact_click_25 | Use world kill switch | World content is unavailable without affecting other packs. |


| CI ban probe (15) | Requirement |
| --- | --- |
| `quarry_pact_ban_01` | Reject 'borrowed franchise kingdom'. |
| `quarry_pact_ban_02` | Reject 'named legacy faction'. |
| `quarry_pact_ban_03` | Reject 'recognizable trademark crest'. |
| `quarry_pact_ban_04` | Reject 'copyrighted character silhouette'. |
| `quarry_pact_ban_05` | Reject 'direct map replica'. |
| `quarry_pact_ban_06` | Reject 'copied quest text'. |
| `quarry_pact_ban_07` | Reject 'lifted class name'. |
| `quarry_pact_ban_08` | Reject 'licensed monster name'. |
| `quarry_pact_ban_09` | Reject 'familiar mascot color code'. |
| `quarry_pact_ban_10` | Reject 'signature spell wording'. |
| `quarry_pact_ban_11` | Reject 'well-known catchphrase'. |
| `quarry_pact_ban_12` | Reject 'named hero lineage'. |
| `quarry_pact_ban_13` | Reject 'specific anime uniform'. |
| `quarry_pact_ban_14` | Reject 'famous game-logo geometry'. |
| `quarry_pact_ban_15` | Reject 'existing creature evolution chart'. |

| Budget class | SPEC per-subscription session |
| --- | --- |
| Narrative generation | SPEC: 900 visible prose tokens per committed turn; hard cap 1,400. |
| Latency | SPEC: 95th percentile under 3.0 seconds after a committed event. |
| Context | SPEC: 24,000 retained session tokens, then summarized from ledger-backed events only. |
| Safety review | SPEC: 100% of store copy and key-art prompts; 10% sampled canned talk per build. |

**Not ready until CODE closes:** entitlement verification, world data load, ledger integration, feature flags, kill switches, event scheduler, reporting pathway, accessibility test, performance test, and human approval of every release asset.

## 9. Press kit

**Press blurb (120 words).** Quarry Pact is a new text-world from WOF, designed for a personal solo session or private co-op with up to five invited players. In a setting built around cooperative hunting, every scene begins with a local problem and a meaningful stake. The engine resolves the action first; narration then tells the story of what the ledger has committed. Players earn cosmetic keepsakes, collect a complete Theme Kit with the world, and choose routes that respect friends, boundaries, and time. WOF does not market Quarry Pact as an MMO before multiplayer is proven. At launch, the promise is focused: a phone-first story world with readable choices, private teamwork, clear safety controls, and no store item that sells power, clears, catches, or a better outcome.

> **PLACEHOLDER pull quote:** “A remarkably deliberate little world.”
>
> **PLACEHOLDER pull quote:** “The choices feel local before they feel epic.”
>
> **PLACEHOLDER pull quote:** “Private co-op has room to breathe here.”

| Fact | Value |
| --- | --- |
| Genre | Text-world / cooperative hunting |
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
