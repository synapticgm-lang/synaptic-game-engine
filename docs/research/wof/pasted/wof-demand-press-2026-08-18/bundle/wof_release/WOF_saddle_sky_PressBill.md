# WOF Saddle Sky: Press-Release Bill

> **Artifact status:** SPEC: complete new pack generated in this run. **Release language is deliberately honest:** this is a text-world for solo and private co-op; it must not be described as an MMO until true multiplayer operation is proven.

## 0. Store identity

| Field | Release copy |
| --- | --- |
| Display name | **Saddle Sky** |
| One-line pitch | Original sky-mount partnership, aerial rescue, and wind routes, built for a private solo or 2–5 player text-world session. |
| Store paragraph | **Saddle Sky** invites players into original sky-mount partnership, aerial rescue, and wind routes. Begin with a local problem, choose what you are willing to risk, and turn a shared engine ledger into a personal story after each action is resolved. Travel in a themed text world alone or with invited friends, collect a complete Theme Kit with the world, and earn cosmetic keepsakes through clear play rather than paid outcomes. |
| Five bullets | Local first-hour problem; 2–5 private co-op; committed ledger before narration; cosmetic-only store; included Theme Kit. |
| Search keywords | saddle sky, text adventure, private co-op, solo, story world, Theme Kit, friends, choices, cosmetic, phone-first |
| Maturity / descriptors | **teen** — Mild peril and fantasy action. |
| What we will not claim | No MMO claim before proof; no live public network claim; no outcome-selling store; no persistent contested-PvP claim. |
| Included / DLC / Theme Kit | Included: authored solo/private-co-op pack and Theme Kit. DLC: future cosmetic story plates only. Theme Kit: included with the world purchase. |
| Two-wallet chrome | Gold: **Saddle Sky Marks**. Cosmetic tokens: **Saddle Sky Gleams**. Neither buys outcomes, catches, clears, power, or lockout skips. |

| Rating lane | Eligibility | Kid Mode extras |
| --- | --- | --- |
| All-ages | Family-safe text and art rewrite applied. | 10 turns/day; no public DMs, trade, or voice. |
| Teen | Age-gated mild peril and social stakes. | Same controls; soften or skip unsuitable scene plates. |
| Teen+ | Explicit gate for tense themes; no graphic gore. | Kid Mode not offered where the safety rewrite cannot retain meaning. |

## 1. Why this world

**Demand service.** `saddle_sky` serves the demand row(s) mapped in `WOF_Demand_Vs_Have.md`; it is for players who want original sky-mount partnership, aerial rescue, and wind routes within a readable, friends-first text session. It is not for players seeking competitive open-world PvP, unrestricted public chat, a power store, or an already-proven public MMO.

| Competitor pattern | WOF fence |
| --- | --- |
| Familiar genre setting with recognizable visual language | Use original places, entities, language, and art direction only. |
| Legacy progression / private-server nostalgia | Keep the desire for clear loops, not any map, class, monster, slogan, or data. |
| Social or sandbox platform | Use canned hub talk and private sessions; no unmoderated public identity market. |

## 2. Rules and code remaining

| Item | Status | Release artifact |
| --- | --- | --- |
| rulesModuleId | SPEC | `bond_mount`; ledger fields: hp, mount_trust, wind, altitude, route_marks, care, tack, rescue. |
| Feature flags | CODE | `saddle_sky_enabled`, `saddle_sky_theme_kit`, `saddle_sky_age_gate`, `saddle_sky_festival`, `saddle_sky_kill_switch`; add housing flavor or event flag only where the pack declares it. |
| Data files | SPEC | `saddle_sky_places, saddle_sky_npcs, saddle_sky_quests, saddle_sky_talk, saddle_sky_drops, saddle_sky_vendors, saddle_sky_interiors, saddle_sky_talents, saddle_sky_theme_kit`. |
| Eval probes | CODE | bond_mount_probe_01, bond_mount_probe_02, bond_mount_probe_03, bond_mount_probe_04, bond_mount_probe_05, bond_mount_probe_06, bond_mount_probe_07, bond_mount_probe_08, bond_mount_probe_09, bond_mount_probe_10. |
| World-only kill switches | CODE | Disable store listing, new starts, instance entry, festivals, themed talk, or Theme Kit apply independently; retain account entitlement receipt. |

No live-game import, production app code, network promise, or external save/database dependency is implied by this bill.

## 3. Content remaining versus friends-alpha

| Release path | Artifact / gap |
| --- | --- |
| First hour | Named opening room, local practical failure, four stake-bearing choices, first vendor, and a checkpoint. |
| 2–5 path | One private co-op instance with lockstep, personal loot, checkpoint wipe, and no mid-combat fill. |
| Big night | One cosmetic-only scheduled event; a 10-player raid requires a separate skin and capacity gate. |
| Capitals / mid | SPEC: named in the new pack. |
| Housing label | Private room / plot flavor only; no claim of public persistent housing. |
| Vendor / inn bind | One vendor and one safe checkpoint bind defined as data. |
| Daily / weekly examples | 1) visit a local notice; 2) complete a craft or talk; 3) take a scenic route; 4) finish a private instance; 5) attend a cosmetic festival. |

For this new world, the supplied pack is the authored source; remaining work is implementation, asset production, safety review, and test sign-off.

## 4. Art and images — briefs only

| Asset | Brief |
| --- | --- |
| App icon | `wof_saddle_sky_icon.png`: readable emblem in local material, no licensed mark, clear at phone size. |
| Key art | `wof_saddle_sky_keyart_hero.png`: one protagonist at a named hub, text-forward UI framing; `wof_saddle_sky_keyart_kid.png`: safety rewrite or omit mature signal. |
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
| Ambient loop | `wof_saddle_sky_ambient_loop`: 45–75 second gentle environmental loop; no recognizable melody or direct stylistic imitation. |
| SFX cues (8) | wof_saddle_sky_hit, wof_saddle_sky_wipe, wof_saddle_sky_mail, wof_saddle_sky_level, wof_saddle_sky_vendor, wof_saddle_sky_instance_enter, wof_saddle_sky_festival, wof_saddle_sky_death. |
| Voice flavor | Short, warm, non-performative prompts; no imitation of a recognizable performer. |
| Hear-button line | “The route is ready when you are.” |

## 6. Live-ops and calendar

| festivalId | Month | Festival | Reward policy |
| --- | --- | --- | --- |
| saddle_sky_fest_01 | Jan | Saddle Sky First Light | Cosmetic title, plate, or dye; no power |
| saddle_sky_fest_02 | Feb | Saddle Sky Kindness Week | Cosmetic title, plate, or dye; no power |
| saddle_sky_fest_03 | Mar | Saddle Sky Open Routes | Cosmetic title, plate, or dye; no power |
| saddle_sky_fest_04 | Apr | Saddle Sky Repair Day | Cosmetic title, plate, or dye; no power |
| saddle_sky_fest_05 | May | Saddle Sky Pocket Parade | Cosmetic title, plate, or dye; no power |
| saddle_sky_fest_06 | Jun | Saddle Sky Long Table | Cosmetic title, plate, or dye; no power |
| saddle_sky_fest_07 | Jul | Saddle Sky Lantern Tide | Cosmetic title, plate, or dye; no power |
| saddle_sky_fest_08 | Aug | Saddle Sky Maker Fair | Cosmetic title, plate, or dye; no power |
| saddle_sky_fest_09 | Sep | Saddle Sky Quiet Harvest | Cosmetic title, plate, or dye; no power |
| saddle_sky_fest_10 | Oct | Saddle Sky Story Steps | Cosmetic title, plate, or dye; no power |
| saddle_sky_fest_11 | Nov | Saddle Sky Warm Window | Cosmetic title, plate, or dye; no power |
| saddle_sky_fest_12 | Dec | Saddle Sky Year Knot | Cosmetic title, plate, or dye; no power |


## 7. Legal and trust

**IP fence.** Saddle Sky is an original setting with no copied protected setting names, locations, character designs, creature catalogues, text, musical motifs, visual marks, or licensed-world claims. Folklore-adjacent content is transformed into invented cultures and is reviewed for stereotype, sacred-content, and appropriation risks.

**User interaction and accessibility.** Only canned hub say-lines are available; report, mute, and block are required. Telemetry is hashed and minimized. TTS reads both chrome and prose, font scale is available, and danger is never color-only.

| macroId | Support macro |
| --- | --- |
| saddle_sky_support_01 | Store entitlement receipt |
| saddle_sky_support_02 | Theme Kit did not apply |
| saddle_sky_support_03 | Checkpoint / lost-session explanation |
| saddle_sky_support_04 | Age-gate or Kid Mode question |
| saddle_sky_support_05 | Report / mute / block path |
| saddle_sky_support_06 | Refund policy handoff |
| saddle_sky_support_07 | Accessibility reading controls |
| saddle_sky_support_08 | World temporarily unavailable |


## 8. QA and go-to-press gate

| testId | Human click test | Expected result |
| --- | --- | --- |
| saddle_sky_click_01 | Open store page | Name, age label, and solo/private-co-op claim are legible. |
| saddle_sky_click_02 | Select age gate | Maturity gate blocks unsuitable copy and presents Kid Mode. |
| saddle_sky_click_03 | Start solo opening | Opening room appears before any threat. |
| saddle_sky_click_04 | Choose first stake | A real time, reputation, or supply cost is visible. |
| saddle_sky_click_05 | Read room prose | Text describes place, sound, and obstacle first. |
| saddle_sky_click_06 | Open ledger | Committed fields display without narration changing values. |
| saddle_sky_click_07 | Use a kit line | Kit flavor appears with no power sale. |
| saddle_sky_click_08 | Travel to first hub | Route resolves without contested-PvP state. |
| saddle_sky_click_09 | Inspect a local problem | A local issue is actionable in hour one. |
| saddle_sky_click_10 | Accept a quest | Numeric reward and alternate outcome appear. |
| saddle_sky_click_11 | Complete a noncombat action | Ledger commits then narration follows. |
| saddle_sky_click_12 | Enter a 2–5 instance | Party cap and no mid-combat fill are stated. |
| saddle_sky_click_13 | Trigger a wipe | Safe checkpoint policy appears. |
| saddle_sky_click_14 | Return to checkpoint | Encounter-only state clears; no permadeath. |
| saddle_sky_click_15 | Claim personal loot | Personal loot is distinct from party rolls. |
| saddle_sky_click_16 | Visit vendor | Gold item has no outcome advantage. |
| saddle_sky_click_17 | Inspect wallet separation | Gold and cosmetic tokens cannot be exchanged for power. |
| saddle_sky_click_18 | Apply Theme Kit | Included kit changes chrome and labels. |
| saddle_sky_click_19 | Enable TTS | Chrome and prose are read in order. |
| saddle_sky_click_20 | Increase font scale | No content becomes color-only. |
| saddle_sky_click_21 | Enable Kid Mode | 10-turn cap and disabled DM/trade/voice apply. |
| saddle_sky_click_22 | Try blocked public DM | Control refuses and explains boundary. |
| saddle_sky_click_23 | Report canned hub talk | Report, mute, block confirm locally. |
| saddle_sky_click_24 | Open festival calendar | Reward is cosmetic-only. |
| saddle_sky_click_25 | Use world kill switch | World content is unavailable without affecting other packs. |


| CI ban probe (15) | Requirement |
| --- | --- |
| `saddle_sky_ban_01` | Reject 'borrowed franchise kingdom'. |
| `saddle_sky_ban_02` | Reject 'named legacy faction'. |
| `saddle_sky_ban_03` | Reject 'recognizable trademark crest'. |
| `saddle_sky_ban_04` | Reject 'copyrighted character silhouette'. |
| `saddle_sky_ban_05` | Reject 'direct map replica'. |
| `saddle_sky_ban_06` | Reject 'copied quest text'. |
| `saddle_sky_ban_07` | Reject 'lifted class name'. |
| `saddle_sky_ban_08` | Reject 'licensed monster name'. |
| `saddle_sky_ban_09` | Reject 'familiar mascot color code'. |
| `saddle_sky_ban_10` | Reject 'signature spell wording'. |
| `saddle_sky_ban_11` | Reject 'well-known catchphrase'. |
| `saddle_sky_ban_12` | Reject 'named hero lineage'. |
| `saddle_sky_ban_13` | Reject 'specific anime uniform'. |
| `saddle_sky_ban_14` | Reject 'famous game-logo geometry'. |
| `saddle_sky_ban_15` | Reject 'existing creature evolution chart'. |

| Budget class | SPEC per-subscription session |
| --- | --- |
| Narrative generation | SPEC: 900 visible prose tokens per committed turn; hard cap 1,400. |
| Latency | SPEC: 95th percentile under 3.0 seconds after a committed event. |
| Context | SPEC: 24,000 retained session tokens, then summarized from ledger-backed events only. |
| Safety review | SPEC: 100% of store copy and key-art prompts; 10% sampled canned talk per build. |

**Not ready until CODE closes:** entitlement verification, world data load, ledger integration, feature flags, kill switches, event scheduler, reporting pathway, accessibility test, performance test, and human approval of every release asset.

## 9. Press kit

**Press blurb (120 words).** Saddle Sky is a new text-world from WOF, designed for a personal solo session or private co-op with up to five invited players. In a setting built around original sky-mount partnership, aerial rescue, and wind routes, every scene begins with a local problem and a meaningful stake. The engine resolves the action first; narration then tells the story of what the ledger has committed. Players earn cosmetic keepsakes, collect a complete Theme Kit with the world, and choose routes that respect friends, boundaries, and time. WOF does not market Saddle Sky as an MMO before multiplayer is proven. At launch, the promise is focused: a phone-first story world with readable choices, private teamwork, clear safety controls, and no store item that sells power, clears, catches, or a better outcome.

> **PLACEHOLDER pull quote:** “A remarkably deliberate little world.”
>
> **PLACEHOLDER pull quote:** “The choices feel local before they feel epic.”
>
> **PLACEHOLDER pull quote:** “Private co-op has room to breathe here.”

| Fact | Value |
| --- | --- |
| Genre | Text-world / original sky-mount partnership, aerial rescue, and wind routes |
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
