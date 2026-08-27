# WOF — Manus prompt: depth-fill all 28 new worlds (maximum)

Paste the block below into Manus (unlimited run). Download **all** files. Drop them in this chat or `docs/research/wof/pasted/`.

**WOF later only.** Not live SynapticGM. Not going live yet.

The last dump was a Python template (Courier/Maker/Scout/Warden, cycling quests). This run replaces those shells with real packs. Do **not** reprint the 23 older setting bibles.

---

```
You are doing MAXIMUM DEPTH-FILL GENERATION for WOF (World of Fantasy): a later-release family of original TEXT worlds on ONE engine. This is NOT live SynapticGM. Do not write production app code. Do not import live-game files, prompts, saves, or databases. Do not invent 3D meshes, navmeshes, or collision. Do not claim an unshipped title is an “MMO” in player-facing copy. Honest labels: “solo” / “private co-op” / “limited online region.”

You have an UNLIMITED run. Use every token. Do not summarize. Do not skip a world. Do not write “TBD”, “similar to Brasswake”, or “same as Thorn Law.” Empty tables are a failure. If a file hits a length limit, FINISH that world in WOF_<worldId>_Pack_PART2.md and continue. Prefer COMPLETE copy-pasteable YAML plus authored prose. Bigger is better: every world in this run is FULL start-depth, not short.

============================================================
THIS RUN vs LAST DUMP
============================================================
A prior generator (wof_generate.py) emitted 28 SHELL packs. KEEP only: working titles, worldIds, maturity, rulesModuleId slugs, and the listed hub place-NAMES below. THROW AWAY: Courier/Maker/Scout/Warden kits, the repeated NPC line “Before you answer, tell me what you are willing to risk”, cycling quest titles (Inspect/Carry/Listen/Repair… repeating), numbered eval probes with no inputs, generic art rows (“App icon”), generic PressBills that only swap the world name.

Do NOT regenerate or reprint these 23 existing setting bibles: Ash Compact, First-Song, Isekai Gate, Bonded Menagerie, Circuit Arc, Halo Term, Hollow Term, Starwake, Lanceyard, Quarry Pact, Sect Ascension, Gridrun, Blackwake, Night Charter, Badge Circuit, Dust Line, Veil Watch, Crew Score, Hearth Season, Stage Light, Pitch League, Route Lantern, Card Vein.

Do NOT rewrite demand-vs-have research, Agones/36-month ops, HVAC, live ads/comic/memory, auction, guild bank, contested open-world PvP, global chat.

============================================================
ANTI-TEMPLATE LAW (violate = regenerate that world)
============================================================
Across ANY two worlds in this run it is FORBIDDEN to share:
- The same four kit names or the words Courier, Maker, Scout, Warden as kit names
- The same NPC first line or the same three stake chips [time] [reputation] [supplies]
- Quest titles that are Verb + the + Noun cycling through a shared 8-noun list
- Species that are “observe, assist, and record X; cosmetic field-note plate” as the only loop
- Place role text “A local problem is visible before any creature… a broken public promise” copied
- Portrait briefs that say only “Identity-kit portrait; no protected silhouette”
- PressBill store paragraphs that only swap the display name into the same 80 words
- Eval probes named module_probe_01 … _10 with no input/expected ledger

Each world MUST have unique: verbs of play, local problems, kit jobs, NPC voices, quest objectives (typed), drop tables, instance rooms, art-direction paragraphs (≥80 words each brief), and a 50-item ban-list that is GENRE-SPECIFIC (not a copypaste Marvel/DC list on a cafe world).

A coder must be able to paste YAML into TypeScript without inventing missing ids.

============================================================
LOCKED ENGINE (do not redesign)
============================================================
One engine, many packs. CODE owns dice, HP/ledgers, catalogs, quest ticks, loot, gold, lockouts, instance seeds. LLM narrates AFTER state is committed.
Overworld = Tier 3 shared hubs + INSTANCED combat. Not contested open-world PvP (Tier 4 deferred).
Party 2–5. Raid 10 only if the skin’s fantasy needs it (combat skins yes; cozy/cafe/fashion/racing/idol-like no — use a 2–5 “big night”).
Lockstep rounds. Weekly per-character per-boss lockout. Friends-first finder. Personal loot. Wipe → checkpoint. No mid-combat fill. No permadeath v1. No guild bank v1. No global chat v1.
Presence = nearbyPlayerCount + kit/race tags only. Never stranger names into the GM.
Two wallets: gold vs cosmetic tokens. Never mix. Never sell outcomes, lockout skips, catch rate, raid clears, random POWER packs, gacha, loot boxes.
Theme Kit INCLUDED with each bought world.
Quests: objectives CODE can complete: visit_place | ledger_kill | ledger_bond | deliver_item | talk_to_npc | collect_item | interact (verb+placeId) | score_beat | build_tick | hospitality_tick | lap_finish. Numeric rewardGold and rewardXp in data.
Local problems in hour one — not save-the-world. Opening choices MUST include a stake. Describe room BEFORE any creature in instances.
Kid Mode: 10 text turns/day; no public DMs/trade/voice; no sex/gore-as-spectacle/drugs/gambling. Route Lantern already exists — for romance-adjacent NEW worlds: crushes OK, no sexual content.
English v1. packFormatVersion: 1.

============================================================
DUMP ERRORS / FROZEN NAMES (do not break)
============================================================
Ignore: Ember Crown, Pactbeasts, Gloamwild, Deepgate Accord, Salt Ledger, Sunloom Circuit, Lantern Run Company.
Skip Hearth Ruin (live SynapticGM post-collapse lane). No Void Reach, no Sky Frame, no Kite Isle as a separate pack (sky islands live INSIDE Brasswake).
Tide Covenant = FACTION. Saltkin = RACE, not a creature. Compact races are not regions.
First-Song instance public name if mentioned: Courtfall at Vespermere / first_song_courtfall. NOT Gloam Court, Cinder-Court, Lantern Court Breach.
Bonded Menagerie kit if mentioned: brineveil_curator / Brineveil Curator. NOT saltwind_keeper.
Isekai module slug if mentioned: hp_check_floor_flags.
Do not reuse Compact races (Hearthborn, Lanternfolk, Saltkin, Stonevein) as another world’s elves/dwarves/sailors.
Do not put Compact frozen places into these packs (no poi_reedfen_square etc.).
“Lantern …” POIs are allowed only namespaced by this worldId.
Green Chapel: Arthurian PATTERN only. Forbidden: Camelot, Excalibur, Lancelot, Merlin-as-that, Round Table as product identity. Invent original chapel-green culture.
Kindred Hide: original folk. Forbidden: licensed ponies, Warrior Cats clans, Furry fandom trademarks, species-as-that-franchise.
Scale Era: original megafauna. Forbidden: franchise dinosaur IP names, Jurassic slogans, Ark unique creatures.
Saddle Sky: dragon-rider ARCHETYPE. Forbidden: Pern, How-to-Train unique dragons, licensed wyvern brands.
Ribbon Guard: sentai/magical-girl PATTERN. Forbidden: Power Rangers, Precure, Sailor Moon unique, MHA.
Quiet Brief / Neon Docket: no GTA street names, no real crime-how-to, no licensed spy orgs.
Mesa Codex / Drumline Coast / Star Canoe / Winter Oven / First Clay: folklore inspiration + original cultures. Not reconstructions of living sacred practice as a theme-park. One-line analog allowed. Ban-list 50 including obvious colonial/copy names.

============================================================
WORLDS TO GENERATE (all FULL depth — 28)
============================================================
Keep these hub NAMES if they are good; you may ADD more POIs. You may RENAME a hub only if it collides with Compact or a dump title. worldId is locked.

1) brasswake — Brasswake — teen — hp_check — steampunk airships/clockwork/rail. Hubs to keep/expand: Cinder Dock, Aerial Brassway, Orchard Mast, Clockwind Exchange, Rivet Court, The Soot Meridian. Sky-island routes (ex-Kite Isle) are districts HERE, not a second world. Kits must be clockwork jobs (e.g. mail-rigger, boiler-hand) — NOT courier/maker/scout/warden.
2) thorn_law — Thorn Law — teen — grit_wound — low-fantasy grit, scarce magic, human-led border law. Hubs: Briar Assize, Harrow Market, Mire Toll, Old Gallows Road, Cinderfield, The Thorn Bench. Kits: oath-roles (assize clerk, hedge leech, toll-walker, oath-witness) unique.
3) civic_mile — Civic Mile — all-ages — civic_rep — present-day slice-of-life city, apartments, friends, cafe shifts. Hubs: Juniper Station, Mile Market, Maple Court, Rooftop Garden, Lantern Plaza (namespaced), Riverwalk Hall. No cyberpunk Gridrun chrome. Kits: neighbor roles, not adventurers.
4) homestead_ring — Homestead Ring — all-ages — build_tick — peaceful PLAYER-BUILT town on SERVER CLOCK. Hubs: Ring Green, Pebble Ward, Orchard Rise, Canal Gate, Common Kiln, Bell Assembly. NOT Hearth Season authored farm. NOT salvage apocalypse. No contested PvP. Deeds/plots/upkeep as DATA.
5) scale_era — Scale Era — teen — hunt_part — prehistoric valley, original megafauna, expeditions. Hubs: Basalt Shelter, Fern Basin, Amber Crossing, Thunderstep, Boneglass Ravine, Long Dawn Camp.
6) glass_reef — Glass Reef — all-ages — depth_gauge — underwater city, tidecraft, reef repair. Hubs: Lumen Quay, Pearlward, Current Garden, Hush Trench, Coral Archive, Glasswake Gate.
7) kindred_hide — Kindred Hide — all-ages — hide_voice — original anthro/social hangout, studios, consentful visits. Hubs: Welcome Burrow, Mosslight Arcade, Tailor Steps, Sunroom Square, Quiet Den, Bridge Bloom. Folk names original (not harefolk-as-franchise).
8) ink_banner — Ink Banner — teen — hp_check — feudal banner-houses, duel-and-duty, dispatches. NOT licensed ninja villages. Hubs: Banner Gate, Reed Court, Kite Barracks, Red Seal Road, Cedar Watch, The Quiet Standard.
9) leafrail — Leafrail — all-ages — cozy_tick — solarpunk rail gardens, repair co-ops. NOT dump title Sunloom. Hubs: Canopy Terminal, Glass Orchard, Sunspoke Yard, Fern Viaduct, Lattice Commons, Dawn Depot.
10) saddle_sky — Saddle Sky — teen — bond_mount — original sky-mount partnership, rescue routes. Hubs: Wingrest, Kestrel Steps, Cloud Orchard, Gale Bridge, Nestfall Hollow, High Aerie.
11) northrim — Northrim — teen — hp_check — north sea-kings, winter covenants. Hubs: Frostwharf, Whale Road, Pine Hall, Rime Barrow + ADD 4 POIs to reach 8+.
12) tide_colossus — Tide Colossus — teen — colossus_part — instanced shore-titan hunts. Hubs: Breakwater Camp, Titan Sound, Anchor Cliff, Foam Chapel + ADD 4.
13) ribbon_guard — Ribbon Guard — all-ages — show_pose — original color-team city defenders / staged rescue shows. Hubs: Bright Base, Mirror Street, Ribbon Pier, Stage Vault + ADD 4.
14) quiet_brief — Quiet Brief — teen — heat_cover — present-day spy jobs, cover stories, instanced extraction. Hubs: Civic Annex, Paper Hotel, Rain Platform, Signal Room + ADD 4.
15) neon_docket — Neon Docket — teen+ — heat_wanted — present-day crime CREW CASES, restitution, not vehicle chaos. Hubs: Docket Row, Night Clerk, Underbridge, Casefile Court + ADD 4.
16) redline_hour — Redline Hour — all-ages — lap_time — closed-course time trials. Hubs: Starter Bay, Copper Loop, Rain Circuit, Hourglass Garage + ADD 4.
17) atelier_row — Atelier Row — all-ages — atelier_score — fashion studio, runway briefs, cosmetic-only. Hubs: Thread Square, Drape Hall, Color Yard, Runway Roof + ADD 4.
18) third_cup — Third Cup — all-ages — hospitality_tick — cafe / hospitality life-sim. Hubs: Third Cup, Market Steps, Brew Lane, Window Garden + ADD 4.
19) briar_court — Briar Court — teen — veil_glamour — dark fairy-tale courts, bargains. Hubs: Briar Gate, Thimble Hall, Moon Orchard, Hollow Mirror + ADD 4.
20) threshold_rooms — Threshold Rooms — teen+ — liminal_steadfast — liminal interiors, consentful scare. Hubs: Welcome Desk, Carpet Hall, Blue Stair, Exit Light + ADD 4.
21) smoke_ledger — Smoke Ledger — teen — hp_check — 1920s-inspired noir cases, no historical impersonation of real people. Hubs: Cinder Station, Velvet Block, Ledger House, Fog Dock + ADD 4.
22) quiet_rite — Quiet Rite — teen — steadfast — household haunt care, original rites. Hubs: Rite House, Candle Street, Sigh Garden, Bell Cellar + ADD 4.
23) first_clay — First Clay — teen — hp_check — mythic antiquity, 3–4 ORIGINAL cultures (river/hill/star). Hubs: Clay Harbor, Sun Court, Reed Archive, Star Kiln + ADD 4. Silk-road caravan is a REGION here, not a 29th world.
24) mesa_codex — Mesa Codex — all-ages — hp_check — original highland calendar cities. Hubs: Stone Calendar, Cactus Gate, Painted Well, Dawn Mesa + ADD 4.
25) drumline_coast — Drumline Coast — all-ages — hp_check — original coastal praise-houses, drum-message routes. Hubs: Palm Quay, Echo Market, Red Clay Steps, Lantern Grove + ADD 4.
26) star_canoe — Star Canoe — all-ages — ship_board — original voyaging, star navigation, canoe care. Hubs: Wayfinder Bay, Star Mat, Reef Rest, Far Lantern + ADD 4.
27) winter_oven — Winter Oven — all-ages — cozy_tick — original winter kitchen folklore, neighborhood feasts. Hubs: Oven Square, Snow Lane, Birch Pantry, Ember Bridge + ADD 4.
28) green_chapel — Green Chapel — teen — hp_check — original chapel-green questing. Hubs: Green Nave, Apple Ford, Bell Meadow, Hearth Vale + ADD 4.

============================================================
FILE OUTPUT (mandatory, downloadable)
============================================================
Tell the user at the end: “Download every WOF_* file from the file tree.”

A) WOF_DepthFill_INDEX.md
- Table of 28 worlds: file names, module, maturity, 4+ start hubs, 5-man name, big-night or raid 10, YAML sidecar name, word-count / table-count targets hit.
- Anti-template self-check: confirm no shared kit names across worlds.
- Integrity checklist 30 lines.

B) WOF_Rules_Modules_NEW.yaml
COMPLETE numeric specs for every NEW module used: grit_wound, civic_rep, build_tick, depth_gauge, hide_voice, bond_mount, colossus_part, show_pose, heat_cover, lap_time, atelier_score, hospitality_tick, veil_glamour, liminal_steadfast.
Reuse hp_check / cozy_tick / hunt_part / steadfast / heat_wanted / ship_board only by REFERENCE (do not reprint those modules’ full novels).
For EACH new module: ledger fields + start values, what a round resolves in CODE, wipe/checkpoint, lockout, 12 status effects, 16 combat or activity verbs, 8 chrome UI templates (copy-paste), 15 eval probes as {id, given, action, expectedLedger, forbiddenProse}. Numbers not flavor.

C) For EACH of the 28 worlds, ALL of:
   WOF_<worldId>_Pack.md
   WOF_<worldId>_data.yaml  (valid YAML, unique ids, no empty keys)
   WOF_<worldId>_PressBill.md
   WOF_<worldId>_ArtBriefs.md

If a pack exceeds length, split PART2/PART3. Never drop sections.

============================================================
PER-WORLD PACK — MANDATORY SECTIONS (every world)
============================================================
Write ALL of these. Speculation marked SPEC:. Working names locked.

0) Header
- worldId, display name, one-line pitch, 80-word pitch, maturity, rulesModuleId, Theme Kit name
- Genre pattern in 1 sentence + fence (“this is NOT X”)
- Ban-list: 50+ licensed lookalikes SPECIFIC to this genre (cafe world bans Starbucks/Central Perk/etc., not Batman)

1) Rules in this skin
- Which ledger fields this world actually uses (subset + extras)
- Wipe / checkpoint / lockout
- What prose is FORBIDDEN to invent (damage, gold, catch, lap time, café rating, deed ownership, titan part breaks)
- 8 diegetic chrome templates (copy-paste)

2) Identity kits — 4 UNIQUE kits (jobs/looks/taboos/speech tells)
Each: id, public name, look, values, taboo, speech tell, starter clothes (named garments), starter tool/weapon, starter map item, startingPlaceId, firstHourQuestId, abilityFlag
NOT Courier/Maker/Scout/Warden. NOT Compact races.

3) Map / places — FULL graph
- ≥8 POIs (short worlds were 4 — you MUST add). Each: id, public name, zoneId, mapScale (street|dungeon|interior), dangerTier (safe|low|medium), outdoor bool, exits[], npcIds[], optional dungeonId, interactableIds[]
- 1 hub that is not a capital analog; 1 mid join; instance doors are places
- Fog: visited vs outline. Street = pins; indoor = floor-plan. No 100km chrome inside a shop.
- Homestead Ring: include plot scarcity NUMBERS (how many player plots at Ring Green / Pebble Ward) and deed placeIds.
- Brasswake: include ≥2 sky-isle POIs with airship exits (the merged Kite Isle).
- Civic Mile / Third Cup: apartments as interior graphs (4–6 rooms) for the player home.

4) Durable NPCs — 8–12 per starting hub cluster
Each: id, name, placeId, role (quest|profession|hub|merchant|local|host)
PREMADE TALK TREES (authored, unique voice): greet, quest_offer, quest_progress, quest_turnin, gossip×3, refusal, player-rude.
Canned hub say/emote: 12 lines unique to this world (strangers are NOT LLM-chatting).

5) Premade choices / first hour
- Opening establishment deck per kit: look, kit, origin-in-world, STAKE (6 authored beats)
- Per hub: 10 grounded choice buttons (label, requires, intentKind). Inventory-aware. No “lunge at corpse.” Combat buttons are fight moves. Talk buttons are dialogue. Cafe/fashion/racing have activity buttons that match the module.
- Tutorial path (skippable on alts) — beat list
- Retry deck: 8 fingerprints {goal, tactic, obstacle, revelation, consequence}

6) Quests — code-completeable DAGs
Per world, ≥25 authored beats that do NOT recycle titles:
Families: identity (4–6), profession/craft (6–8), zone_story LOCAL threat (6–8), extras (sides, instance breadcrumb, hidden trust, repeatable daily capped)
Each quest: id, title, family, hidden, unlocksQuestId, objectives[] with kinds+ids+counts, rewardGold, rewardXp
Campaign spine after starts: 12–20 beats to the mid-join / first big-night / first titan / first show / first cup
3 example walk-aways that WRITE a divergence record

7) Species / opponents / collectibles UNIQUE
Combat/activity skins: 16–24 species or equivalent (customers, mounts, cards, titan parts, haunt types) with stats the CODE owns.
Bond_mount: 12 original mounts, trust ranks, no franchise.
Kindred Hide: 4 playable folk kits (already in §2) plus 8 NPC folk types — original names.
Homestead Ring: pests optional; mostly ticks not kills.
No Saltkin-named fauna. No Compact race names as creatures.

8) Loot / economy
- Item templates: starters, profession outputs, instance drops, cosmetics (no power)
- Drop tables by species/room (personal loot, %)
- Vendor lists + prices + repairCostPerPoint if applicable
- Faucets/sinks + daily cap
- Two wallet chrome names unique to this world

9) Instances
- One solo-able 5-person (or 2–5 activity) instance: 5 rooms, describeBeforeCreature, trash, 1 elite, 1 checkpoint, 1 boss-or-finale, exits, room ids
- One big night OR raid 10 if the skin needs it (name, 3 phases, still 10 only for combat fantasies). Cozy/cafe/fashion/racing/idol-like: 2–5 show/match/service rush — specify.
- Traps/secrets/locked doors as interactables (6)

10) Progression
- Talent / license / rank / recipe tree: 16 nodes {id, cost, requires[], effect flags}. No pay-to-unlock.
- Daily/weekly contracts (8 examples, capped)

11) Housing / objects (text Place + props)
- 12 interactables unique public-names (same verb ids as shared catalog: rest, repair, tend, craft, cook, bind_inn, etc. — RENAME display only)
- Default interior graph 4–8 rooms for house/shop/ranch/berth/hangar/cafe/studio/apartment as fits
- Homestead Ring: build recipes (8) with materials + clock weeks

12) Theme Kit
- Materials/colors in words, dice material, voice, 1 ambient loop brief (120 words), default fashion
- 20 UI labels skinned
- 10 New Game hook sentences

13) Failures + defaults
- Clone-risk and how you avoided it
- Max 5 John’s calls; otherwise pick a default and mark SPEC:

============================================================
YAML SIDECAR — WOF_<worldId>_data.yaml
============================================================
Valid YAML. packFormatVersion: 1. worldId. Arrays: places, npcs, kits, quests, objectives nested, species, items, dropTables, vendors, dungeons.rooms, talkTrees, choiceButtons, interactables, interiors, talents, evalProbes.
Ids unique within the file. Quest objectives use the enum kinds above. No “the miller pays you” in YAML — rewardGold: 12.

============================================================
PRESS BILL — UNIQUE, not a name-swap
============================================================
WOF_<worldId>_PressBill.md must mention THIS world’s actual hubs, kits, instance name, wallet chrome, and first-hour quest title.
Sections: store identity (pitch that could not apply to another world), demand row, code remaining, content remaining vs friends-alpha, legal/trust, 25 click-tests that name real placeIds, 15 ban-list CI strings from THIS world’s list, SPEC LLM budget numbers, 120-word press blurb, 5 FAQ, “not ready / still CODE” list.
Honest store copy. Theme Kit included. Two wallets. No MMO claim.

============================================================
ART BRIEFS — REAL DIRECTION
============================================================
WOF_<worldId>_ArtBriefs.md — each brief ≥80 words: subject, materials, lighting, camera, what MUST appear, what MUST NOT appear (ban silhouettes), phone crop, Kid variant or skip.
Required:
- App icon
- Key art hero + Kid/safety variant
- 8 store screenshot shot lists (9:16 and 16:9): named UI chrome + named place + named kit (not “opening.png”)
- 4 kit portraits (the actual 4 kits)
- 4 place establishing shots (hub, wild, instance door, housing/interior)
- 4 memorable stills (opening, first clear, first down, ending)
- 1 ambient loop (mood, instruments, do-not-use licensed motifs)
- 8 SFX (hit, wipe, mail, level, vendor, instance-enter, festival, death) — one sentence each unique
No binary files. No meshes.

Also WOF_Art_Audio_MASTER_INDEX.md listing every brief filename + worldId + type.

============================================================
OPTIONAL IF ROOM (do them)
============================================================
WOF_Homestead_Ring_Deed_Tables.yaml — plots, upkeep, seize-after-weeks, guest rules (friends, no chest steal).
WOF_Shared_Interactable_Verbs.yaml — the shared verb ids these 28 worlds remap (do not invent a second engine).
WOF_Eval_Probe_Book.md — all 28×15 probes in one table.

============================================================
QUALITY BARS
============================================================
- Unique kit names across the entire 28-world set (zero collisions).
- Unique NPC names across a world; no Compact NPC names (Elder Mara, Miller Tobin, etc.) reused.
- Quest rewards are numbers. Dialogue in-world: no “token / LLM / lockout / prompt” in NPC mouths unless diegetic OS (none of these 28 should copy live System chrome).
- Kid-safe worlds: no sex, gore-as-spectacle, drugs, gambling.
- Mark SPEC: on invented capacity numbers.
- Do not output live src/ paths. Do not tick live SynapticGM clocks.
- Start with INDEX + Rules YAML, then Brasswake through Saddle Sky (the original ten) COMPLETE including YAML+Press+Art, then the remaining 18 the same way, then master art index.
- END with file list, table counts per world (places/npcs/quests/species/items), and a 30-line integrity checklist (anti-template, frozen Compact untouched, no dump titles, Kite Isle merged, Hearth Ruin skipped, honest store copy, YAML valid, art briefs ≥80 words).
```
