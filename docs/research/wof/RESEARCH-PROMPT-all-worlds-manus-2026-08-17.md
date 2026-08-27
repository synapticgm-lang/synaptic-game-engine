# WOF — Manus prompt: generate every world pack

Paste the block below into Manus (unlimited run). Download **all** files it writes. Drop them in this chat or `docs/research/wof/pasted/`.

This is **WOF later titles**, not live SynapticGM. Do not implement the dump into `src/` / `supabase/`.

Expected downloads (Manus may split):

- `WOF_AllWorlds_INDEX.md`
- `WOF_<WorldId>_Pack.md` × each world below
- `WOF_Shared_Engine_And_ThemeKits.md`
- YAML/JSON sidecars if it uses them (`places.yaml`, `quests.yaml`, etc. **inside each world file or as named attachments**)

---

```
You are doing MAXIMUM CONTENT GENERATION for WOF (World of Fantasy): a later-release family of original text MMOs on ONE engine. This is NOT live SynapticGM. Do not write production app code. Do not import live-game files, prompts, saves, or databases.

You have an UNLIMITED run. Use it. Do not summarize, do not skip a world, do not write “TBD” or “similar to Ash Compact.” If a section is long, keep writing in the next file. Empty tables are a failure.

============================================================
ALREADY HAVE — DO NOT REGENERATE
============================================================
A multi-title ops/platform blueprint already exists (36-month co-op/MP, kill switches, anti-P2W, honesty copy). Do NOT rewrite networking, matchmaking, Agones, patent-style ops, or folder plans for ember-crown / pactbeasts / platform/.

This run is CONTENT PACKS only: maps, NPCs, premade talk/choices, quest DAGs, loot, instances, Theme Kits, ban-lists.

Ignore dump titles: Ember Crown, Pactbeasts of the Lanternwild, Gloamwild, Deepgate Accord, Salt Ledger, Sunloom Circuit, Lantern Run Company.

Frozen names only: Ash Compact, Tide Covenant, Hearthborn, Lanternfolk, Saltkin, Stonevein, Reedfen, Lampwood, Brinewatch, Granite Stair, Bonded Menagerie, Isekai Gate, First-Song, Circuit Arc (shonen), Starwake (space), Stage Light (idol), Lanceyard (mecha), Halo Term (powers school), Hollow Term (magic school), Route Lantern (romance), Veil Watch (horror).

Not live SynapticGM. No live source, prompts, saves, or Supabase.

============================================================
FILE OUTPUT (mandatory)
============================================================
Create these files in the project (downloadable). Entire dump in files, not only chat.

1. WOF_AllWorlds_INDEX.md
   - Table of every world: file name, rulesModuleId, maturity, start hubs, 5-man, big-instance, whether raid 10 exists
   - What each file contains
   - Ban on dump-error names (see below)

2. WOF_Shared_Engine_And_ThemeKits.md
   - Shared engine recap (short)
   - Theme Kit spec for EVERY world (UI tokens, dice material, voice, 1 ambient loop, default fashion, System/chrome name)
   - Two wallets (gold vs cosmetic tokens)
   - Anti-P2W rules
   - Kid/teen/mature matrix

3. ONE file per world: WOF_<WorldId>_Pack.md
   WorldId slug = lowercase_underscore of the working title (ash_compact, first_song, isekai_gate, bonded_menagerie, circuit_arc, halo_term, hollow_term, starwake, lanceyard, quarry_pact, sect_ascension, gridrun, blackwake, night_charter, badge_circuit, dust_line, veil_watch, crew_score, hearth_season, stage_light, pitch_league, route_lantern, card_vein)

4. Optional YAML/JSON companions named WOF_<WorldId>_data.yaml — only if they are COMPLETE and valid. Prefer tables + fenced YAML inside the markdown if easier, but they must be copy-pasteable into a world pack later.

Tell the user at the end: “Download every WOF_*.md (and yaml) from the file tree.”

============================================================
IP LOCK (hard — violate = regenerate that world)
============================================================
Genre PATTERNS only. Original names, maps, creatures, items, slogans, plots.

FORBIDDEN as WOF content (names, places, unique creatures, artifacts, slogans, beat-for-beat plots):
Warcraft/Blizzard (Stormwind, Orgrimmar, Azeroth, Horde/Alliance-as-those, etc.), Tolkien unique (Hobbit, Mordor, Gondor, Istari, that Ring plot, Middle-earth toponyms), Sword Art Online (Aincrad, SAO, NerveGear, that death-game slogan set, Kirito-plot), Pokémon (franchise monsters, balls, dex, gym slogans, lookalike mascots), Palworld, My Hero Academia, Genshin/Teyvat, Harry Potter/Hogwarts/houses, Warhammer, Elder Scrolls unique, D&D unique setting names (Baldur’s Gate, Faerûn, Beholder-as-that-monster), Final Fantasy unique, WoW raids, One Piece crews, Naruto villages, Star Wars orders, Vampire: the Masquerade clans, CoC product trademarks as product identity, licensed idol groups, licensed sports leagues, licensed mecha series.

Public-domain folklore MAY inspire (human, elf, dwarf, giant, dragon-as-archetype, Arthurian/Norse/Greek STORIES) but you must invent original cultures. Never “elves but we renamed them our elves” using Compact races inside First-Song.

If a name sounds licensed, throw it out and invent another.

============================================================
DUMP ERRORS — DO NOT USE THESE AS CANON
============================================================
- Ember Crown, Pactbeasts, Gloamwild, Deepgate Accord, Salt Ledger, Sunloom Circuit, Lantern Run Company — dump inventions. Ignore.
- Tide Covenant is a FACTION, not a race, not a region, not a creature.
- Saltkin is a RACE, not a creature.
- Hearthborn, Lanternfolk, Saltkin, Stonevein are RACES, not regions.
- Ash Compact, Tide Covenant are FACTIONS, not regions.
- Circuit Arc = SHONEN TOURNAMENT (not sci-fi).
- Starwake = SPACE OPERA / ship_board (not idol, not school).
- Stage Light = IDOL / performance.
- Lanceyard = MECHA / frame_heat (not jousting).
- Halo Term = powers school. Hollow Term = magic school. Route Lantern = romance / bond_heart. Veil Watch = horror / steadfast.
- Do not ship Hearth Ruin (post-collapse salvage) — live SynapticGM already occupies that lane. Skip that world entirely.
- Do not create Void Reach or Sky Frame as separate titles. Fold leftover space ideas into Starwake; leftover mecha into Lanceyard.
- Do not put WOF content into live SynapticGM. Isekai Gate is WOF-app only (live already has LitRPG/System).

============================================================
LOCKED ENGINE (do not redesign)
============================================================
- One engine, many world packs. Not a new codebase per genre.
- Code owns: dice, HP/bond/heat/score, catalogs, quest ticks, loot, gold, lockouts, instance seeds. LLM narrates only AFTER state is committed.
- Overworld = Tier 3: shared hubs, INSTANCED combat. Not contested open-world PvP (Tier 4 deferred).
- Party 2–5. Raid 10 for MMO-combat skins. Cozy/idol/sports/romance: raid 10 OPTIONAL; use match/concert/date instances of 2–5 (or 5 for a “show”).
- Lockstep rounds. Weekly per-character per-boss lockout. Friends-first finder. Personal loot. Wipe → checkpoint.
- Never sell: combat outcomes, lockout skips, catch rate, raid clears, random POWER packs.
- Premium = cosmetics / capacity / world unlock. Theme Kit INCLUDED with each bought world.
- Honest store copy until proven: “solo” / “private co-op” / “limited online region” — do not write marketing that calls an unshipped title an MMO.
- Presence: nearbyPlayerCount + races only. No raw stranger chat into the GM.
- Quests: objectives the CODE can complete (visit placeId, ledger_kill / ledger_bond, deliver itemId, talk_to_npc, collect_item). Journal must not lie. Hidden quests exist but journal stays honest for visible ones.
- Local problems in starting zones — not save-the-world in hour one.
- Describe room BEFORE any creature in instances.
- Opening choices must include a stake.
- Two wallets: gold vs cosmetic tokens. Never mix.

============================================================
WORKING NAMES (use exactly; do not rename)
============================================================
ASH COMPACT (included spine, hp_check, teen)
- Factions: Ash Compact, Tide Covenant
- Races: Hearthborn, Lanternfolk, Saltkin, Stonevein
- Starts: Reedfen, Lampwood, Brinewatch, Granite Stair
- Hubs: Millcross, Wickhaven, Coil Pier, Anvil Gate
- Capitals: Ash Seat, Tidehold
- Mid: The Divide
- First 5-mans already named: Lampwood Gate (Reedfen edge), Unlit Hollow (Lampwood), Coil Warehouse (Brinewatch), Anvil Deep (Granite Stair)
- Toy raid: Millstone Hollow / The Millwarden (10-man, 3-phase — do NOT resize)
- Expand what exists. Do not replace these names. Do not add a fifth playable race.

OTHER WORLDS (full original bibles; new peoples/places — do NOT reuse Compact race names as their elves/dwarves/sailors):
First-Song (hp_check, teen) — Tolkien-PATTERN fellowship/courts/relic-archetype. Invent 4 peoples + homelands + 2 courts.
Isekai Gate (hp_check + floor/layer flags, teen) — SAO-PATTERN trapped clearable world. Original floors/layers, original System chrome name (not “The System” copied from live if it collides — invent a diegetic OS name). Floor 1 is a full start. WOF only.
Bonded Menagerie (bond_type, all-ages) — Pokémon-PATTERN bond/type/ranch. Original fauna. Bond tool is NOT a franchise ball. 8–12 biomes, 60–80 creatures. No player-to-player creature trade at soft launch. Premium never buys catch or a missing creature.
Circuit Arc (realm_gate and/or score_set, teen) — shonen tournament.
Halo Term (hp_check + exams, teen) — powers school.
Hollow Term (hp_check + bond_heart, teen) — magic school.
Starwake (ship_board, teen) — space opera; stations, boarding, hull.
Lanceyard (frame_heat, teen) — mecha lances; heat/ammo/structure.
Quarry Pact (hunt_part, teen) — hunt + weak points + carve loot.
Sect Ascension (realm_gate, teen) — cultivation/wuxia; original sects/realms.
Gridrun (heat_wanted, teen+) — cyberpunk crew; original city/corps.
Blackwake (ship_board, teen) — age of sail; original seas/flags.
Night Charter (hp_check + social heat, teen+) — hidden-society courts; original bloodlines.
Badge Circuit (hp_check, teen) — superhero patrol; original city/capes.
Dust Line (hp_check, teen) — frontier western; original territories.
Veil Watch (steadfast, teen+) — cosmic-horror investigation; NEW horrors (do not brand famous PD monsters as the product identity).
Crew Score (heat_wanted, teen) — heist; job = instance.
Hearth Season (cozy_tick, all-ages) — town/garden/shop/festivals; NO raid lockout; combat rare or off.
Stage Light (score_set, all-ages) — idol/band; rehearsal + concert night.
Pitch League (score_set, all-ages) — sports season; matches not dungeons.
Route Lantern (bond_heart, all-ages) — romance/found-family; Kid Mode: crushes OK, no sexual content.
Card Vein (card_lane, all-ages) — card-battle; collection log; no sealed power packs.

============================================================
WHAT ALREADY EXISTS FOR ASH COMPACT (expand; do not contradict)
============================================================
Four starts already have ~7 POIs each, 3 race + 3 profession + 3 zone-story quests (9 per zone), and those four 5-mans. Capitals exist as places with NO walk yet.

YOU MUST:
- Expand EACH start from 9 quests to 18–25 authored beats (add sides, dailies, dungeon breadcrumbs, hidden trust quest, extras). Keep the existing quest titles/ids if you invent ids — prefix new ones; do not delete The Hearthborn's Request / Keep the Path Lit / The Flats Are Wrong / The Stair Has a Crack.
- Add travel graph: each start → The Divide → Ash Seat or Tidehold (faction-appropriate). No teleport.
- Full capital hubs, mid-game faction promise board, Millstone Hollow 3-phase lore + room script (still 10-man).
- Talent tree, vendor catalogs, repair, premade NPC talk for EVERY durable NPC, grounded choice decks, Theme Kit, first-hour HookArc per race.
- Profession lines already sketched: miller (Reedfen), wick (Lampwood), fisher (Brinewatch), smith (Granite Stair). Expand them to 6–8 beats; you may ADD a second profession per zone.

============================================================
PER-WORLD FILE — MANDATORY SECTIONS (every world, including Ash Compact)
============================================================
Write ALL of the following. Use YAML or markdown tables with STABLE ids (snake_case). Speculation must be marked. Working names above are locked.

0) Header
- worldId, display name, one-line pitch, maturity, rulesModuleId, Theme Kit name
- Genre pattern in 1 sentence + fence (“this is NOT X”)
- Ban-list: 40+ licensed lookalikes specific to THIS genre

1) Rules module (what CODE resolves)
- Fields the ledger owns (HP, bond, type, heat, hull, steadfast, score, floor, etc.)
- Wipe / checkpoint / lockout
- What prose is FORBIDDEN to invent (damage numbers, loot, catch success, floor clear, match score)
- Diegetic chrome templates (System window / bond HUD / heat / concert score) — 5+ copy-paste templates

2) Identity kits
- 3–4 playable kits (races and/or classes). Ash Compact: the 4 locked races only.
- Each: look, values, taboo, speech tell, starter clothes, starter weapon, starter map, startingPlaceId, firstHourQuestId, abilityFlag
- Why they are not a licensed kit (1 line)

3) Map / places (FULL graph)
- 4 starting zones (or 4 equivalent hubs for school/cozy/sport)
- Per start: 6–10 POIs. Each: id, public name, zoneId, mapScale (street|dungeon), dangerTier (safe|low|medium), outdoor bool, exits[], npcIds[], optional dungeonId
- 1 hub per start that is NOT the capital
- Capitals or equivalent end-of-start merge (2)
- Mid-world join
- Fog: visited vs outline
- Street = pins; indoor = floor-plan. No 100km chrome inside a shop.
- Instance doors are places.

4) Durable NPCs
- 6–12 per starting zone (Ash Compact may add to the existing named NPCs: Elder Mara, Miller Tobin, Pathwarden Sila, Wick Tender Cal, Tide-reader Nesh, Fisher Pell, Stair-oath Kell, Smith Vorr, etc. — KEEP those names)
- Each: id, name, placeId, role (quest|profession|hub|merchant|local)
- PREMADE TALK TREES (not “LLM will improvise”). For each quest-giver and merchant:
  - greet
  - quest_offer
  - quest_progress
  - quest_turnin
  - gossip (3 lines)
  - refusal / player-rude
- Canned hub say/emote lines (10) for that zone (strangers are NOT LLM-chatting)

5) Premade choices / first hour
- Opening establishment deck per kit: look, kit, origin, STAKE (4–6 authored beats)
- HookArc flags: identity_confirmed, first_choice, observed_consequence
- Per POI: 6–10 grounded choice buttons (label, requires item/place/quest, intent kind). Inventory-aware. No “lunge at corpse.” Combat buttons are fight moves. Talk buttons are dialogue.
- Tutorial forced path (skippable on alts) — beat list
- Retry beat deck: 8 fingerprints {goal, tactic, obstacle, revelation, consequence} so retries are not resamples

6) Quests (code-completeable DAGs)
Per starting zone, 18–25 beats total, families:
- race/identity (3–6)
- profession/craft (3–8)
- zone_story (3–8) LOCAL threat
- extras: sides, dungeon breadcrumb, hidden trust, repeatable daily (capped)
Each quest: id, title, family, hidden bool, unlocksQuestId, objectives[], rewardGold, rewardXp
Objectives: visit_place | ledger_kill | ledger_bond | deliver_item | talk_to_npc | collect_item with ids and counts
Campaign spine AFTER starts: 12–20 beats to capital / floor N / first trial / first concert / first match as fits the skin
Divergence: 3 example player walk-aways that WRITE a divergence record instead of silently forgetting the promise

7) Species / opponents / collectibles
- Combat skins: 16–24 species per start region (common/uncommon/rare/epic), habitatTags, baseHp, baseAtk, ac
- Bonded Menagerie: 60–80 ORIGINAL creatures, type chart (6–10 types), catch/bond rules, ranch
- Card Vein: 40–60 original cards (not licensed), lanes, collection index
- Lanceyard: 12+ original frames
- Starwake/Blackwake: hull classes + boarding foes
- Hearth Season: pests optional; mostly ticks not kills
NO Saltkin-named creatures. NO franchise lookalikes.

8) Loot / economy
- Item templates: starter weapon/armor/map, profession outputs, dungeon drops, cosmetics (no power)
- Drop tables by species/room (personal loot)
- Vendor lists + repairCostPerPoint
- Faucets/sinks + daily cap sketch
- Collection log entries

9) Instances
- One solo-able 5-man per start: 5 rooms, describeBeforeCreature, trash, 1 elite, 1 checkpoint, 1 boss, exits
- One 10-man 3-phase raid OR equivalent big instance (concert, finals, nest siege, blacksite, leviathan, city rite) if the skin’s fantasy needs it
- Hearth Season / Route Lantern / Stage Light / Pitch League: specify the non-raid “big night” instead
- Room ids, encounter {speciesId, count, elite?}

10) Progression
- Talent / license / bond-rank / realm / recipe tree: 12–20 nodes {id, cost, requires[], effect flags}. No pay-to-unlock.
- Daily/weekly contracts (capped, 5 examples)

11) Theme Kit + copy
- Colors/materials (words, not hex required), dice, voice, 1 loop, fashion
- 20 lines of player-facing UI labels (Inventory, Journal, etc. skinned)
- 10 opening-hook sentences for New Game cards

12) Failures + John’s calls (max 5 per world)
- What would make this world feel like a clone (and how you avoided it)
- Open decisions only if truly blocking; otherwise pick a default and mark speculative

============================================================
DEPTH TARGETS (unlimited — hit them)
============================================================
- Ash Compact pack: longest file. Full four zones + The Divide + both capitals + Millstone Hollow + talk trees for every NPC.
- Bonded Menagerie: full type chart + 60–80 creatures with 1-line ecology each + 4 field starts + ranch hub + 8 trial instances named.
- Isekai Gate: named Floor/Layer 1–8 at least (you may outline 9–12). Floor 1 is FULL start depth. Safe-hub vs instance-death rules. Clear-boss campaign contract. Guild-lite (NO guild bank).
- First-Song: 4 original peoples (names, looks, taboos), 4 homelands, 2 courts, relic as ARCHETYPE (corruption track) NOT that Ring plot, 1 fellowship 5-man, 1 named-evil 10-man.
- Every other world: do not shrink below 4 hubs, 18 quests on the primary start, 6 NPCs with full talk trees, 1 five-man or equivalent, ban-list 40+.

============================================================
QUALITY BARS
============================================================
- Tables/YAML must use unique ids across a world.
- Quest rewards are numbers in data, not “the elder gives you gold” in prose.
- Dialogue is in-world. No engine words (token, prompt, context window, LLM, raid lockout) in NPC mouths unless diegetic-system template.
- Kid-safe worlds must not include sex, gore-as-spectacle, drugs, gambling.
- Mark every invented culture as original. One-line folklore analog allowed (“hearth-people, not a licensed dwarf kit”).
- Do not copy-paste the same quest DAG across worlds with find-replace. Each world needs different verbs, stakes, and local problems.

START WITH the INDEX, then Ash Compact (complete), then Bonded Menagerie, Isekai Gate, First-Song, then every remaining world in the list until all files exist. If you approach a length limit, finish the current world file, then continue the next world in a new file. Never stop after “outline only” except where this prompt says outline for floors 9–12.

END by listing every file created and a 20-line integrity checklist (IP fence, dump errors avoided, ids unique, objectives code-owned).
```
