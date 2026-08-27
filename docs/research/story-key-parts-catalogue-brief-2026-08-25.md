# Story KEY PARTS catalogue — founder brief

**Date:** 25 Aug 2026  
**Status:** Research only. Do not inject licensed titles into live prompts.  
**Wiring:** Later Cursor job. This file is the index + a copy-paste Manus prompt.  
**Not WOF.** Live premades only (`src/data/campaigns/`).

**Product law (repeat):** Live game prompts, picker copy, and GM-ready bank columns must use **original names + public-domain folklore + generic tropes**. Never “write like *Wandering Inn* / Solo Leveling / Shield Hero / My Vampire System / D&D.” A founder-only “shape cousins” column may say *this beat is the same SHAPE as common isekai registration* — **banned from GM injection**.

---

## 0. How to use this

1. Read the premade inventory and axes.  
2. Paste **§6 Manus prompt** into Manus.  
3. Ingest the CSV under `docs/research/` (new ingest note).  
4. Later Cursor job: seed-pick 1 variant per axis at New Game → POINTER CARDS in opening contract + SNAPSHOT — same pattern as stamp **20a** (Summoned Pact pointers). GM writes prose. Not Mad Libs.

---

## 1. Live premades (New Game picker)

Picker: `NewGameModal` → path **Premade** or **Custom** (Simple / Expert) → engine card → premade list from `getCampaignBiblesByEngineMode`. Custom always seeds **Blank Canvas** for that mode, never a silent dump of another bible.

| Engine card | `engineMode` | What the player is buying |
|---|---|---|
| LitRPG | `litrpg` | Panels, growth, hidden checks |
| Tabletop Fantasy | `dnd` | d20, AC, slots — original rules language, no WotC brands |
| Story RPG | `rpg` | Fiction-first; no HUD, no dice math |
| Pick Your Own Adventure | `pyoa` | Spine + forks + several endings |

Catalog source: `ALL_CAMPAIGN_BIBLES` in `src/data/campaigns/index.ts`.

### 1.1 LitRPG family

| id | Title | Archetype | Opening | Unique kit / power | Factions / hubs | Power fantasy |
|---|---|---|---|---|---|---|
| `system-integration` | System Integration | `system_apocalypse` | **weave**; registrar SYSTEM; Earth street → panel | Morning clothes + System knife later; assigned class | Survivor hubs, Waves, Foundation Cores | Global Integration; permadeath; dungeon-seeded cities |
| `summoned-pact` | The Summoned Pact | `isekai` | **weave**; THE CIRCLE; **bible `openingHooks`** (~20 pointer cards incl. alone-ruin ladder) | Earth pockets/bag only until NPC **offer** accepted; unidentified **Circle Blessing** | Pellane / Ash Court / Scale; Weighing Cup inn; Contract Hall; Undercroft dungeon | Hero/villain stamp `[Pactborn]` vs `[Calamity Mark]`; refuse the pact |
| `hero-awakening` | Hero Awakening | `ai_random` | **weave**; WAKE LEDGER; **bible `openingHooks`** (8 strings) | What you already wore in **this** world; folk/place player-canon | MCA, Riftwards, Vesper Cartel, Quiet Hands; Thresholds | Late private growth vs public Grades that plateau |
| `gatebreak-ward` | Gatebreak Ward | `system_apocalypse` | Catalog deck (Ward 9 cameras) | Ward 9 armband; unlicensed scrap | Militia vs hunter guilds | Poor-district gate raids; E–S gates |
| `ascending-spire` | The Ascending Spire | `tower_ascent` | Catalog deck | Climber’s Tag + ration brick | Ranking Board, rival climbers, Floor Wardens | Ranked floors + **Floor Laws** |
| `inkbound-academy` | Inkbound Academy | `magic_academy` | Catalog deck | Blank Class Codex + student ink | Four houses, Dean, Restricted Stack | Write-your-class; exams that can kill |
| `hollow-core` | Hollow Core | `dungeon_core` | Catalog deck | Core Shard; you **are** the dungeon | Whisper-Mite, Core hunters, rival Cores | Expand / spawn / bargain |
| `void-audience` | The Void Audience | `void_audience` | Catalog deck | Point budget, Flaws/Boons | Auditor, Audience factions, other Reborn | Rebirth trial; Cosmic Favor |
| `dungeon-transport` | Dungeon Transport | `dungeon_transport` | Catalog deck | Earth pockets; hunger/thirst/light meters | Wandering Merchant, Descent Log ghosts | Accidental rift; **only down**; safe rooms every 3 floors |
| `fabled-legacy` | Fabled Legacy | `ai_random` | Catalog deck | Village tools (stick, bread, knife) — **premise says no blue panels** | Mossford vs Aelmark; Old Faith | Soft start; consequence LitRPG-without-HUD |
| `blank-canvas` | Blank Canvas (Custom World) | `custom_world` | 3 generic cards | Empty kit | Player Codex only | Player defines rules |

**Archetypes in picker with no dedicated premade:** `vrmmo`, `regression`, `monster_reincarnation` (Hollow Core is core-as-you, not “reborn as a weak creature”), `cyberpunk` (street-heroes lives on Story RPG `cape-district-vigil`). Custom + `ai_random` can still blend them.

### 1.2 PYOA family (scene drop + `styleRail` forks)

Default **openingMode `scene`** where set; name/look covers exist but first page is **already in crisis**. Each has a MacGuffin, a walking-together companion, two factions, several endings.

| id | Title | Genre tag | Opening crisis | Kit / object | Factions | Companion |
|---|---|---|---|---|---|---|
| `thornferry-road` | Thornferry Road | Small-town road | Mill landing / charter | Travel pack; **Millstone Charter** | Highmark (Pell) vs road | Wren Holt |
| `vesper-glass-cipher` | The Vesper-Glass Cipher | Occult mystery | Flooded archives | Vesper-Glass cylinder | Rust-Barons vs Chorus of Seers | Silas |
| `erebus-9-swarm-directive` | Erebus-9: The Swarm Directive | Alone in space | Air-lock Bay 4 | Fatigue kit; **nav-drive** | Drill Bosses vs Apex Executives | Vance |
| `rose-gold-ultimatum` | The Rose-Gold Ultimatum | Romance | VIP powder room | Clutch; **bridal dossier** | Platinum Swans vs PR Cabal | Chloe |
| `giltwood-estate-conundrum` | The Giltwood Estate Conundrum | Murder mystery | Body on the rug | Smoking jacket; **backward watch**; **code-picked culprit** | Kitchen staff vs aristocrats | Beatrice |
| `null-parameter-protocol` | The Null-Parameter Protocol | Isekai | Failed summon dais | Earth suit; **Genesis Matrix** crystal | Glitch-Walkers vs Royal Vanguard | Kaelen |
| `resin-sonata` | The Resin Sonata | Underwater horror | Glass Atrium | **Sovereign Syringe** | Muck-Walkers vs Gilded Chorus | Aris |
| `umbra-protocol` | The Umbra Protocol | Rooftop assassin | Bell-tower | **Architect’s Ledger** | Silk-Weavers vs Iron Syndicate | Sable |
| `crimson-nocturne` | The Crimson Nocturne | Gothic vampire | Weeping Mausoleum | **Antediluvian Ampoule** | Silk Court vs Ashen Dawn | Julian |
| `onyx-blood-covenant` | The Onyx Blood Covenant | Dark romance **NSFW** | Club mezzanine | **Sanguine Ledger**; bike offer | Iron Claws vs Velvet Coven | Kaelen |

### 1.3 Story RPG family (`rpg`, fiction-first)

Most use `makeBible` + catalog opening decks. Archetype often `custom_world` so LitRPG HUD rules do not leak.

| id | Title | Genre tag | Spine | Kit note |
|---|---|---|---|---|
| `salt-road-heist` | Salt Road Heist | Heist | Crew, Heat, salt-tax ledger | Crew Token |
| `glass-harbor-letters` | Glass Harbor Letters | Letters | Dead addressee, debts | Coat pockets |
| `embercourt-oath` | Embercourt Oath | Court intrigue | Vow-day, broken oaths | Court clothes |
| `rainglass-case` | Rainglass Case | Noir | Inherited case file | Detective kit |
| `static-house` | Static House | Isolation horror | House that broadcasts | Household |
| `driftwake-crew` | Driftwake Crew | Space crew | Chart that is a lie | Ship kit |
| `ashline-convoy` | Ashline Convoy | Wasteland | Ash road, last town gate | Convoy hire |
| `twin-lanterns` | Twin Lanterns | Romance | Two stories, pick a side | Inn key |
| `redmesa-claim` | Redmesa Claim | Western | Water / claim-jump | Claim paper |
| `cape-district-vigil` | Cape District Vigil | Street heroes | Unlicensed powers, Heat | Mask scarf |
| `wayfarers-map` | Wayfarers' Map | Travelogue | Seven stops + blank | Torn map |
| `hearthwick-teas` | Hearthwick Teas | Tea shop | Blend with a rumor | Shop tin |
| `blank-canvas-rpg` | Blank Canvas (Custom) | Custom world | Codex is canon | Empty |

### 1.4 Tabletop Fantasy family (`dnd`)

Archetype = **opening type**, not a second engine.

| id | Title | Archetype | Genre tag | Kit / hook |
|---|---|---|---|---|
| `cursed-keep` | Cursed Keep | `cursed_manor` | Haunted keep | Inn book; Greyhollow; keep on the hill |
| `millstone-road` | Millstone Road | `caravan_escort` | Caravan | Escort job; ticking crates |
| `broken-crown-keep` | Broken Crown Keep | dungeon crawl | Dungeon crawl | Hostage + two warbands |
| `verdant-blight` | Verdant Blight | village mystery | Village mystery | Wrong-green wood |
| `stillroot-veil` | Stillroot Veil | village horror | Village horror | Peat, walking dead, lantern |
| `shattered-coast` | Shattered Coast | city intrigue | City intrigue | Five guilds; Saltmar; “dead” dragon text |
| `blank-canvas-dnd` | Blank Canvas (Tabletop Custom) | `ai_custom` | Custom world | Player names the table |

**Picker archetypes without a dedicated bible:** `prisoner_shipwrecked`, `patrons_quest`, `under_siege`, `wilderness_expedition` (Custom can still pick them).

### 1.5 Custom path (not a fifth engine)

- Simple Custom → Blank Canvas for mode + optional archetype + pitch.  
- Expert Custom → accordion (premise / lore / NPCs / quests / opening / kit / PC) with **Randomize** banks in `customExpertDraft.ts`.  
- Tabletop: GM personality (Chilled / Dry / Theatrical / Army / Fireside).  
- LitRPG: System personality (Cold registrar / Sarcastic Patch / Army / Friendly / Cozy Brutal). Theatrical System exists on old saves, not the shop list.

---

## 2. Catalogue axes (what a story engine must vary)

These are the **KEY PARTS**. Each New Game should seed-pick **one original variant per axis** (or inherit the bible’s locked default). Pointers, not scripts.

| Axis id | Question the writer must answer | Example variants (generic) |
|---|---|---|
| `arrival` | How does page one start? | Summon mid-rite; wake in own bed; already-in-crisis; school bell; dungeon drop; street Integration; void desk; village stranger; alone ruin |
| `name_ask` | Who asks the name? | NPC handler; System scan; inn book; never (PYOA crisis); panel-only if alone |
| `kit_reveal` | How does gear become real? | Sealed Earth bag; personal-effects scan; NPC offer-on-yes; later salvage; already-worn local kit; none (you are the Core) |
| `power_source` | Why can they do the genre thing? | Glitched unidentified blessing; assigned class at Registration; relic-core / MacGuffin; Wake Ledger; Floor Law; you-are-the-core; oath/vow; **none** (Fabled / Story RPG) |
| `growth` | How do they get stronger? | XP / Status windows; deed-offer-refuse; book/codex; training/exams; biomass/theme; Cosmic Favor; Heat/reputation; **none** |
| `system_voice` | What chrome talks? | Cold registrar; sarcastic patch; army quartermaster; friendly System; cozy-brutal story voice; Auditor snark; **none** (Story RPG / PYOA in-fiction only) |
| `hub` | Where do they rest and hear rumor? | Guild hall; inn/common room; street/survivor hub; academy dorm; spire camp; void desk; ship/rig; tea shop; **no hub yet** |
| `opposition` | What is the campaign pressure? | Calamity court; Waves/gates; floor laws; murder clock; romance/scandal; swarm/clock; blight; intrigue guilds; Heat |
| `first_proof` | First causal proof the world is real | Panel that only they see; injury that won’t close; lock that won’t open without a choice; NPC remembers a refusal; MacGuffin ticks; Floor Law punishes; Integration fries a phone |
| `crowd` | Is page one social? | Handlers; festival; mass summon; **alone** (ruin ladder) |
| `offer` | Bargain vs gift | Kit-for-oath; enlist; release-from-cell; **no offer** (alone) |
| `companion` | Walking-together | Optional named companion (PYOA); crew; rival climber; **none on page one** |
| `identity_lock` | What opening covers freeze | Earth origin; folk/species; world-shape; appearance; kit |
| `ending_logic` | What a true ending keys on (PYOA) | Who lives; whether System exists; bond vs force; which killer |

**Locked vs free:** A bible may **pin** some axes (Summoned Pact always Earth-origin + Circle Blessing). Banks vary the **free** axes so two Summoned Pact runs do not share the same arrival *and* hub *and* first proof.

---

## 3. What already exists vs missing

### 3.1 In code (choice decks / rails)

| Piece | Where | What it varies | Gap |
|---|---|---|---|
| `OpeningHookCard` / `OpeningBeatCard` | `types.ts` | location, faction, summonIntent, openingOffer, beats, fallback | Only **Summoned Pact** uses the rich object shape on the bible |
| Bible `openingHooks` | `summonedPact.ts`, `heroAwakening.ts` | First-page camera | Other bibles rely on catalog |
| `OPENING_HOOK_DECKS` | `openingHookDecks.ts` | ~6 location+text cameras per id | Mostly **arrival** only; no kit/power/growth/hub/proof |
| Seed pick + POINTER CARD mandate | `openingEstablishment.ts` (`buildOpeningSceneMandate`) | Injects picked hook as “expand, do not reprint” | Does **not** inject a multi-axis snapshot |
| Instant stitch banks | `openingStitch.ts` | Sensory, pressure crowd/alone, name/look/kit **ask wording** | Spice, not story-family variants |
| Archetype rules | `archetypes.ts` | LitRPG / tabletop / RPG-PYOA overrides | One blob per archetype, not 8–12 variants |
| LitRPG System personalities | `gmVoiceProfile.ts` | Player pick: 5 shopped voices | Voice axis only; firewall vs facts |
| Tabletop GM personalities | same | 5 table voices | Same |
| Folk voice | `folkVoiceExpectations.ts` | 18 peoples (human…woven) | Diction, not plot |
| PYOA `genreTag` + `styleRail` | each PYOA bible | Fork verbs + ending logic | Fixed per title, not a deck |
| Giltwood `mysteryCulprits` | `giltwoodEstate.ts` | Hidden killer stamp | One axis, one bible |
| E7 banks | research only (`E7_content_and_vibe_banks.md`) | Opening families, voice notices, never-lines | **Not wired** |
| 15q harvest | `docs/research/litrpg-isekai-trope-harvest.md` | Generic inn/guild/dungeon/healer-who-fights | Founder titles in that file; live bible uses **original names only** |
| Expert Randomize | `customExpertDraft.ts` | Premise/NPC/quest/opening snippets | Custom path, not premade New Game |
| SNAPSHOT (25b) | `situationPacket.ts` | Location, crowd, exits, props, inventory, time/weather/tension | **Scene facts**, not story-family pointer cards |
| Mode DNA | `choiceTierRules.ts` | Choice flavour per engine | Not KEY PARTS of the premade |

### 3.2 Missing (the catalogue job)

- **Per-axis trope banks** with 8–12 original pointer cards (arrival is the only axis with real decks).  
- **Family-scoped banks** so Gatebreak does not draw academy midterms, and Thornferry does not draw Floor Laws.  
- **Injection path:** `pickedStoryParts` (or similar) on the save → compact POINTER CARDS in opening contract **and** a SNAPSHOT subsection `STORY PARTS` (facts the writer must honor, not canned sentences).  
- **First causal proof** decks (E7 sketched this; not in `src/`).  
- **Hub / growth / power_source** independent of the bible’s one true hub.  
- **Name-ask** as a deck (code has crowd vs alone ask *wording*, not NPC vs System vs never).  
- Dedicated premades or bank families for VRMMO / regression / creature-reincarnation / cyber-neural (picker has labels; worlds do not).  
- **Cartoon / manga / anime beat shapes** as **generic** visual/pacing tropes (reaction beat, training montage *as a scene type*, transformation as a costume change) — **original wording only**; never series titles in GM columns. Optional later for Memorable art, not Comic Mode.

---

## 4. Recommended architecture (later Cursor job)

Same pattern as **20a** Summoned Pact pointers and **20f** local stitch.

```
New Game seed
  → for each FREE axis: pick 1 card from that family's TROPE BANK
  → PINNED axes come from the bible (do not reroll Circle Blessing on Summoned Pact)
  → persist ids + short pointer strings on the save
  → OPENING mandate: "POINTER CARDS (expand; do not reprint)"
  → SNAPSHOT: compact STORY PARTS list (hub, power, proof, opposition) as authority facts
  → GM writes prose; warden still owns ledger
```

**Do not:** concatenate bank sentences into a Mad Libs first page. Banks are **ingredients** (`location`, `faction`, `offer`, `proof`, `never`).  
**Do:** keep `openingStitch` sensory/pressure as a **second** seed so the same cards still read different.  
**Do not:** put founder shape-cousins anywhere the model can see.

---

## 5. Warn

This is **research → banks**. Wiring `src/` is a **later Cursor job**. Do not ship Manus CSV into `systemPrompt` until columns are scrubbed of licensed titles.

---

## 6. FULL MANUS PROMPT (copy everything below the line)

```
# SynapticGM — KEY PARTS trope catalogue (original / folklore only)

You are producing a massive, prompt-ready TROPE CATALOGUE for SynapticGM, a hosted AI tabletop/LitRPG/story game. The live GM must be able to seed-pick ONE variant per AXIS at New Game and inject it as POINTER CARDS (ingredients), not scripts. The writer then writes original prose.

## HARD PRODUCT LAW

1. LIVE / GM-READY COLUMNS must NEVER name or clone licensed series, novels, anime, manga, manhwa, cartoons, films, or tabletop brands.
   Forbidden examples in those columns: Solo Leveling, Shield Hero, The Wandering Inn, Azarinth Healer, My Vampire System, Sword Art Online, Dungeon Crawler Carl, Omniscient Reader, Tower of God, D&D, WotC, SRD product names, Marvel/DC teams, named Studio Ghibli/Disney properties, Aliens, Twilight, Underworld, Black Dagger Brotherhood, Fable, Albion, any specific anime title as “write like X”.
2. You MAY use GENERIC TROPES and PUBLIC-DOMAIN FOLKLORE (summoning circles, inns as social hubs, guild job boards, dungeon floors, hunter licenses, academy houses, reincarnation bargains, murder-in-the-manor, road companions, salt-road caravans). Invent ORIGINAL SynapticGM wording for every player-facing and GM-ready string.
3. Optional column `founder_shape_cousin` is SPECULATIVE FOUNDER RESEARCH ONLY.
   - It may say: “same SHAPE as common isekai registration” or “same SHAPE as a locked-room midnight murder”.
   - It must NEVER name a work in a way that could be pasted into a systemPrompt.
   - Prefixed always with: `FOUNDER-ONLY / DO NOT INJECT:`
   - If you are not sure, leave the cell empty.
4. WOF (World of Fantasy) is a SEPARATE later project. Do not invent WOF races, places, or factions (no Ash Compact, Tide Covenant, Hearthborn, Lanternfolk, Saltkin, Stonevein, Reedfen, Lampwood, Brinewatch, Granite Stair). Do not mix them into live premade families.
5. Kid Mode: every variant needs a `kid_ok` flag (true/false) and a `kid_transform` if false would still work when softened (no sex, no gore-as-porn, no gambling dens as the joke).
6. Pointers, not Mad Libs. Each variant is INGREDIENTS the GM expands. Never a paragraph the model should reprint verbatim as the whole first page.

## WHAT SYNAPTICGM ALREADY DOES (do not waste rows cloning this as if new)

- Seed-picked first-page cameras (`openingHooks` / `OPENING_HOOK_DECKS`): location + a short beat. Summoned Pact also has faction, summonIntent, openingOffer, alone-ruin ladder.
- LitRPG System voices (player pick): Cold registrar, Sarcastic Patch, Army quartermaster, Friendly System, Cozy Brutal. Voice is diction only; never changes facts.
- Tabletop GM voices: Chilled, Dry sarcastic, Theatrical, Army, Fireside.
- Folk diction banks (18 peoples) — speech only.
- PYOA: each title has a FIXED styleRail (fork verbs) and two factions + companion + MacGuffin.
- Archetype blobs (system apocalypse, isekai, tower, academy, dungeon core, void, etc.) — one rule-block, not 8–12 variants.
- E7 research sketched “first proof of causality” for Hero Awakening / System Integration shapes — expand that idea across ALL families.

Your job is the MISSING axes: 8–12 ORIGINAL variants per axis per family, GM-ready.

## PREMADE FAMILIES (catalogue against these; do not invent new live titles)

Use `family_id` exactly:

LITRPG
- `fam-isekai-summon` — The Summoned Pact. Earth clothes. Circle / ruin / camp / cell / arena / festival / ship / infirmary / ALONE ruin. Pactborn vs Calamity Mark. Kit is OFFERED not issued. Glitched unidentified blessing. Hubs: original inn, contract hall, undercroft dungeon.
- `fam-null-pyoa-isekai` — Null-Parameter Protocol (PYOA cousin): failed summon, ERROR as story object (engine prints no XP), Glitch-Walkers vs Vanguard. Still original names only.
- `fam-sys-apocalypse` — System Integration. Earth. Global Registration. Waves. Foundation Cores. Permadeath. Assigned class.
- `fam-gate-city` — Gatebreak Ward. District gates, hunter licenses, poor ward vs rich guilds. Not a named hunter manhwa.
- `fam-late-awaken` — Hero Awakening. NOT a summon. Already lives here. Private growth ledger vs public grades. Player locks folk + world-shape.
- `fam-tower-climb` — Ascending Spire. Permits, ranking board, Floor Laws, Floor Wardens.
- `fam-dungeon-drop` — Dungeon Transport. Accidental rift, only down, hunger/thirst/light, safe rooms, Descent Log.
- `fam-academy` — Inkbound Academy. Living ink, houses, exams, Class Codex.
- `fam-dungeon-core` — Hollow Core. Player IS the core. Expand/spawn/bargain.
- `fam-void-bargain` — Void Audience. Auditor desk, Flaws/Boons, Cosmic Favor, rebirth into Resonance.
- `fam-village-soft` — Fabled Legacy. Soft village; premise has NO blue panels; consequence-first.
- `fam-litrpg-custom` — Blank Canvas LitRPG. Player Codex is canon; banks must be optional proposals, not invented kingdoms.

PYOA (crisis already in motion; several endings; companion optional)
- `fam-pyoa-road` — Thornferry Road (charter, Wren, Highmark).
- `fam-pyoa-occult` — Vesper-Glass Cipher (flooded archives, cylinder).
- `fam-pyoa-space` — Erebus-9 (swarm, airlock, nav-drive). Generic mining-rig survival tropes only.
- `fam-pyoa-romance-gala` — Rose-Gold Ultimatum (dossier, gala).
- `fam-pyoa-mystery` — Giltwood Estate (locked room, backward watch, hidden culprit — vary CAMERA and first proof, not the killer identity).
- `fam-pyoa-underwater` — Resin Sonata (syringe, flooded city).
- `fam-pyoa-assassin` — Umbra Protocol (ledger, rooftops).
- `fam-pyoa-vampire` — Crimson Nocturne (ampoule, hunters vs night court). Folklore vampires, not a series.
- `fam-pyoa-dark-romance` — Onyx Blood Covenant NSFW (club, fated-mate ledger, pack vs coven). Mark `nsfw:true`. Provide a kid_ok=false row and a fade-to-black cousin.

STORY RPG
- `fam-rpg-heist` Salt Road Heist
- `fam-rpg-letters` Glass Harbor Letters
- `fam-rpg-court` Embercourt Oath
- `fam-rpg-noir` Rainglass Case
- `fam-rpg-isolation` Static House
- `fam-rpg-crew` Driftwake Crew
- `fam-rpg-wasteland` Ashline Convoy
- `fam-rpg-inn-romance` Twin Lanterns
- `fam-rpg-western` Redmesa Claim
- `fam-rpg-street-heroes` Cape District Vigil (original powered people; no publisher heroes)
- `fam-rpg-travelogue` Wayfarers' Map
- `fam-rpg-teashop` Hearthwick Teas
- `fam-rpg-custom` Blank Canvas Story RPG

TABLETOP FANTASY (generic d20 language; no company setting names)
- `fam-tt-haunted` Cursed Keep / Greyhollow
- `fam-tt-caravan` Millstone Road
- `fam-tt-keep-war` Broken Crown Keep
- `fam-tt-blight` Verdant Blight
- `fam-tt-veil` Stillroot Veil
- `fam-tt-city-guilds` Shattered Coast / Saltmar five guilds
- `fam-tt-custom` Blank Canvas Tabletop

OPTIONAL EXTRA FAMILIES (picker archetypes with no dedicated bible — banks only, for Custom / future)
- `fam-vrmmo-trap` — logged-in-for-real; logout only in safe zones; never name a licensed MMO
- `fam-regression` — wake earlier with foreknowledge; butterfly effects
- `fam-creature-rebirth` — weak creature body, evolution tree (distinct from dungeon-core)
- `fam-cyber-neural` — heat/overheat, hardware/software stats, corp street

## AXES (emit 8–12 variants each, per family)

axis_id must be one of:
- `arrival` — first page camera
- `name_ask` — who asks the name (NPC / System / inn book / never)
- `kit_reveal` — how kit becomes real
- `power_source` — why genre power exists
- `growth` — how strength changes
- `system_voice` — chrome diction HINTS as ingredients (do not copy SynapticGM’s existing five labels as the only rows; invent additional ORIGINAL registrar flavours that are still not licensed characters). Include a `none` row where the family should have no System.
- `hub` — rest/rumor place
- `opposition` — campaign pressure
- `first_proof` — first causal proof the world is real / the System is not a dream
- `crowd` — social vs alone on page one
- `offer` — bargain structure
- `companion` — walking-together pattern (especially PYOA)
- `identity_lock` — what the opening must freeze
- `ending_logic` — PYOA/Story true-ending keys (skip for tabletop one-shots if not applicable; still give 8 rows of “what a satisfying close keys on”)

PIN RULES (respect these; variants on pinned axes should be “texture only” not a different genre):
- Summoned Pact: pin Earth origin, unidentified blessing, offer-not-gift kit, no logout.
- Hero Awakening: pin not-a-summon, private ledger vs public grades.
- System Integration: pin Earth, global panel, permadeath.
- Hollow Core: pin you-are-the-core.
- PYOA titles: pin MacGuffin class (watch, cylinder, drive, dossier, syringe, ledger, ampoule) but VARY camera, first proof, companion posture, and who speaks first.
- Blank Canvas families: variants are PROPOSALS the player may accept; never assert a kingdom.

## OUTPUT (deliver all)

A) `catalogue_index.md`
- One table of families × which axes are PINNED vs FREE
- Never-lines per family (10+), original wording

B) `tropes.csv` — UTF-8, one row per variant. Columns EXACTLY:

family_id
axis_id
variant_id          (stable kebab: fam-isekai-summon-arrival-07)
title_short         (3–6 words, original)
pointer_location    (optional camera)
pointer_faction     (who is in the room / who wants something)
pointer_intent      (why this beat exists)
pointer_offer       (bargain or “none”)
pointer_beats       (2–4 semicolon-separated ingredients, not a script)
pointer_fallback    (one grammatical paragraph, 2–4 sentences, used ONLY if the writer call fails — still original)
never_lines         (what the GM must not invent this run)
first_proof         (what changes in the world if the player acts; 1 sentence)
kid_ok              (true/false)
kid_transform       (how to soften)
nsfw                (true only for dark-romance adult rows)
inject_ok           (true if this row is legal to put in a live prompt)
founder_shape_cousin (optional; MUST start with FOUNDER-ONLY / DO NOT INJECT: and must not contain a work’s title)

C) `axes_crosswalk.md`
- Which axes should be co-picked (e.g. crowd=alone forbids name_ask=NPC handler)
- Illegal combos (academy midterms on a dungeon-drop floor-1; Floor Laws in Mossford; XP windows in Thornferry)

D) `folklore_appendix.md`
- Public-domain motifs used (circle, threshold, bargain, psychopomp, inn-as-hearth, guild-as-work, manor-murder, sea-bargain, etc.) with folklore names (not modern series).
- 1 line each: how we ORIGINALIZED them for SynapticGM.

## QUALITY BAR

- 8–12 variants per axis per family. If a family truly cannot support an axis, output 3 rows explaining PINNED/N/A and still give texture variants.
- No duplicate cameras with only a synonym swapped.
- Mix: crowded / alone / in-motion / aftermath / wrong-room / rival-got-there-first.
- Anime/manga/cartoon SHAPES allowed only as generic craft: “reaction beat”, “training-as-scene”, “transformation-as-costume-change”, “meal-after-fight”, “exam-as-trial”. Describe the SHAPE in original English. Never cite a show.
- English: full grammatical sentences in pointer_fallback. No telegram fragments.
- Do not output WOF names.
- Do not output SynapticGM internal jargon in player-facing strings (no StateTx, SceneManifest, IntentContract).

## BEGIN

Produce the four deliverables. Prefer completeness over brevity. After the CSV, list any family/axis pairs you could not honestly fill and why.
```

---

## 7. After Manus returns

Ingest under `docs/research/` (new `*-ingest-*.md`). Scrub `inject_ok=true` rows for accidental titles. Then a Cursor job can add `src/data/storyPartBanks/` (or similar) and persist picks next to `pickedHook`. Until then, live GM still only varies **first-page camera** plus voice/folk/archetype blobs.
