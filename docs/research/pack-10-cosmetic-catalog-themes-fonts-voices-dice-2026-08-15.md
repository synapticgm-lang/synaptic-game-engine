# Pack 10 — Cosmetic catalog: themes, fonts, voices, dice (SynapticGM)

**Date:** 15 Aug 2026  
**Status:** Sellable catalog for review. Do not implement until John opens a cosmetics wave.  
**Product:** Live SynapticGM only (not WOF world skins).  
**Prices:** USD from Pack 9 + GBP shelf from Pack 9 §J.  
**Rule:** Cosmetic only. Never changes dice math, loot, quests, or story outcomes. Product page line mandatory: *“Cosmetic only. Does not affect dice rolls, loot, stats, or story outcomes.”*

Related: [pack-09-monetization…](./pack-09-monetization-cosmetics-audio-iap-2026-08.md) · WOF world skins are separate ([wof/pack-10-themed-skins…](./wof/pack-10-themed-skins-2026-08-15.md)).

---

## 1) Copyright fence (read first)

**Allowed**
- Genre *aesthetics* people shop for: System/LitRPG chrome, grimdark, parchment fantasy, cyber-neon, CRT terminal, ink manga, pulp noir, watercolor storybook, crystal “premium”, bone-and-iron, seasonal glitch/holiday.
- Public-domain folklore motifs (generic runes-as-shapes, laurel, skull-as-symbol — not a specific franchise crest).
- Original SynapticGM names for every pack.

**Forbidden in pack names, art, copy, or voice marketing**
- Other games’ / books’ / films’ / shows’ **unique titles, slogans, character names, faction names, creature names, UI logos, distinctive type locks**.
- “Official [Franchise] dice”, lookalike mascots, or beat-for-beat UI clones.
- Celebrity / actor voice likeness without a licence.
- Calling dice “lucky”, “loaded”, or implying better odds.

**“Feels like” in this doc = genre pattern for designers, never customer-facing copy.** Store copy uses only the **Pack name** + short original blurb.

This is not legal advice. Before shipping art/audio, run a name + asset ban-list pass.

---

## 2) What ships free vs paid

| Free (always) | Paid unlock |
|---------------|-------------|
| Default UI (current slate/cyan System look) | Full theme packs (CSS vars + chrome) |
| Default dice (plain visual or text mode) | Dice material / animation packs |
| Default system font stack | Font *pair* packs (UI + story) |
| Basic TTS on/off if you already offer it | Named premium narrator / System voices |
| Existing art-style presets already in settings* | Extra / “season” art styles, HD flags |
| Default turn frame | Ornate / glitch / seasonal frames |

\*Some current presets use working labels that are too close to media titles for a **shop** (e.g. avoid selling anything branded “Sin City”). Free settings can keep internal ids; **shop labels must be original** (see §5).

---

## 3) Theme lines people look for (original names)

Each **Theme Pack** = UI colours + System window skin + optional matching turn-frame + map tint. Does not change fog, paths, or rules.

| ID | Pack name (sell this) | Genre pattern (internal only) | Vibe (store blurb seed) | USD | GBP |
|----|----------------------|-------------------------------|-------------------------|-----|-----|
| TH-01 | **Integration Blue** | Default System / LitRPG HUD | Cold registrar panels, cyan on slate | Free | Free |
| TH-02 | **Neon Protocol** | Cyber System-apocalypse | Night-city neon, glitch edges | $3.99 | £3.99 |
| TH-03 | **Parchment Ledger** | Classic fantasy journal | Warm paper, ink rules, soft gold | $3.99 | £3.99 |
| TH-04 | **Bone Reliquary** | Grimdark / dark fantasy | Ash, bone white, dried-blood accents | $3.99 | £3.99 |
| TH-05 | **Phosphor Terminal** | Retro CRT / hacker terminal | Green phosphor on black, scanlines | $2.99 | £2.99 |
| TH-06 | **Glass Spire** | Clean “premium” crystal UI | Frosted glass, soft lilac/silver | $3.99 | £3.99 |
| TH-07 | **Ember Depths** | Volcanic dungeon | Charcoal + ember orange | $3.99 | £3.99 |
| TH-08 | **Tideglass** | Coastal / fog fantasy | Teal mist, weathered wood chrome | $3.99 | £3.99 |
| TH-09 | **Noir Crimson** | Pulp noir high-contrast | B&W panels, single crimson accent | $3.99 | £3.99 |
| TH-10 | **Ink Wave** | Manga / webtoon chrome | Bold ink frames, screentone panels | $3.99 | £3.99 |
| TH-11 | **Registrar Gold** | Ornate System bureaucracy | Brass fittings, stamped forms | $3.99 | £3.99 |
| TH-12 | **Static Holiday** (seasonal) | Glitch holiday / Halloween | Seasonal free → keep purchase | Free / $2.99 | Free / £2.99 |

### Race / archetype themes (live catalog)

Folklore & sci-fi tropes only — no franchise creature or faction marks in art/copy.

| Pack name | Trope | GBP |
|-----------|-------|-----|
| Wood Elf Grove | forest elf | £3.99 |
| Dark Elf Umbrance | under-realm elf | £3.99 |
| High Elf Spire | courtly elf | £3.99 |
| Dwarf Forgehall | mountain dwarf | £3.99 |
| Orc Warcamp | warband | £3.99 |
| Dragon Hoard | dragon / wyrm | £3.99 |
| Phoenix Ashrise | phoenix | £3.99 |
| Cyborg Chassis | augmented | £3.99 |
| Angelic Radiance | celestial | £3.99 |
| Infernal Pact | fiend-pact | £3.99 |
| Undead Ossuary | crypt undead | £3.99 |
| Fae Glamour | fairy court | £3.99 |
| Goblin Scrapheap | goblin workshop | £2.99 |
| Merfolk Abyss | sea folk | £3.99 |
| Vampire Nocturne | vampire night | £3.99 |

Bundle: **Ancestry Sampler** (wood/dark elf + dwarf + dragon) £9.99.

**Phase 1 ship first:** TH-02, TH-03, TH-05, TH-09 (+ free TH-01).

---

## 4) Font packs (pairs — UI + story)

Sell **pairs**, not single files. Prefer **libre / commercial-ok** families (verify licence before ship). Pack name is original; font file licence is separate.

| ID | Pack name | UI / chrome font (candidate) | Story / journal font (candidate) | Feel | USD | GBP |
|----|-----------|------------------------------|----------------------------------|------|-----|-----|
| FT-00 | **System Default** | Current UI stack | Current body | Neutral | Free | Free |
| FT-01 | **Cold Registrar** | IBM Plex Sans / Source Sans | IBM Plex Serif / Source Serif | Clinical System + readable prose | $1.99 | £1.99 |
| FT-02 | **Ledger Quill** | Source Sans | Literata or Source Serif 4 | Bookish LitRPG journal | $1.99 | £1.99 |
| FT-03 | **Terminal Grid** | JetBrains Mono / IBM Plex Mono | IBM Plex Sans | CRT / log-file fantasy | $1.99 | £1.99 |
| FT-04 | **Ink Panel** | Noto Sans JP or similar + Latin fallback | Noto Serif | Manga-adjacent chrome (no franchise type) | $2.99 | £2.99 |
| FT-05 | **Pulp Block** | Oswald / Bebas-style *libre* display | Merriweather | Noir titles + pulp body | $1.99 | £1.99 |
| FT-06 | **Reliquary Black** | Cinzel (or similar libre display) | EB Garamond | Grimdark headings | $2.99 | £2.99 |

**Never:** pirate commercial fonts; mimic a franchise’s custom logotype; sell “the Harry Potter font” etc.

---

## 5) Art-style unlocks (image gen)

Map to existing engine presets where possible; **shop label ≠ internal id**.

| ID | Shop name | Internal / keywords direction | Status | USD | GBP |
|----|-----------|-------------------------------|--------|-----|-----|
| AR-00 | Classic Book | `classic-book` | Free | Free | Free |
| AR-01 | **Ink Manga Panel** | manga / screentone (existing) | Free or $4.99 if you gate | £/ $ see note | |
| AR-02 | **Noir Crimson** | high-contrast B&W + crimson (replace any “Sin City” shop wording) | Paid relabel | $4.99 | £4.99 |
| AR-03 | **Lush Wash** | watercolor lush (existing) | Paid | $4.99 | £4.99 |
| AR-04 | **Cel Neon** | cyberpunk cel (existing) | Paid | $4.99 | £4.99 |
| AR-05 | **Clear Line Atlas** | ligne claire (existing) | Paid | $4.99 | £4.99 |
| AR-06 | **Sumi Mist** | ink-wash sumi (existing) | Paid | $4.99 | £4.99 |
| AR-07 | **Pulp Western** | western pulp (existing) | Paid | $4.99 | £4.99 |
| AR-08 | **Webtoon Vertical** | manhwa-webtoon (existing) | Paid | $4.99 | £4.99 |
| AR-09 | **Mignola Shadow** → shop: **Deep Ink Shadow** | dark-fantasy heavy shadow | Paid; avoid creator surname in shop | $4.99 | £4.99 |

Keep 2–3 free; monetise the rest as unlocks or include in Hero/Legend sub.

---

## 6) Dice packs (visual only)

Each pack: d20 + common poly set skin for the visual roller. **Odds never change.**

| ID | Pack name | Look | USD | GBP |
|----|-----------|------|-----|-----|
| DC-00 | **Standard Polymer** | Plain matte | Free | Free |
| DC-01 | **System Holo** | Cyan holographic System etch | $2.99 | £2.99 |
| DC-02 | **Bone & Iron** | Weathered bone, iron numerals | $2.99 | £2.99 |
| DC-03 | **Frost Crystal** | Clear/frosted glass | $3.99 | £3.99 |
| DC-04 | **Ember Core** | Charcoal with glowing ember pips | $2.99 | £2.99 |
| DC-05 | **Jade Circuit** | Green jade + faint circuit inlay | $2.99 | £2.99 |
| DC-06 | **Brass Registrar** | Stamped brass bureaucratic | $2.99 | £2.99 |
| DC-07 | **Ink Wash** | Sumi-splatter faces | $2.99 | £2.99 |
| DC-08 | **Neon Edge** | Black die, neon edge light | $2.99 | £2.99 |
| DC-09 | **Relic Rune** | Stone with original geometric marks (not copied scripts from a franchise) | $3.99 | £3.99 |
| DC-10 | **Season Static** | Glitch holiday | Free event / $2.99 keep | £2.99 |
| DC-A1 | **Physics Flourish** | Animation pack (tumble) — any owned skin | $3.99 | £3.99 |

**Dice season pass (A35):** DC-01+02+03+08 over a season — **$9.99 / £7.99**.

---

## 7) Voices (TTS)

Original *roles*, not celebrity clones. Implementation = licensed TTS voice IDs behind the pack.

| ID | Pack name | Role | Tone notes | USD | GBP |
|----|-----------|------|------------|-----|-----|
| VO-00 | Device default | OS / basic TTS | Free toggle | Free | Free |
| VO-01 | **Cold Registrar** | System / Auditor | Flat, precise, slightly inhuman | $4.99 | £4.99 |
| VO-02 | **Street Chronicler** | Narrator | Second-person grit, urban Integration | $4.99 | £4.99 |
| VO-03 | **Grizzled Mentor** | Advisor NPC tone | Older, dry humour | $4.99 | £4.99 |
| VO-04 | **Quiet Archivist** | Soft lore voice | Low, library-calm | $4.99 | £4.99 |
| VO-05 | **Bright Scout** | Younger companion | Energetic, not cartoon-IP | $3.99 | £3.99 |
| VO-06 | **Iron Warden** | Combat-heavy narration | Curt, martial | $4.99 | £4.99 |
| VO-07 | **Tide Speaker** | Coastal / mist campaigns | Measured, rolling cadence | $4.99 | £4.99 |
| VO-08 | **Registrar Dual** | System + Narrator pair | Bundle of VO-01+02 | $7.99 | £7.99 |

Do not market “sounds like [actor]”. Kid Mode: restrict adult-timbre packs if needed.

---

## 8) Turn frames, System windows, portrait frames

| ID | Pack name | Slot | USD | GBP |
|----|-----------|------|-----|-----|
| FR-00 | Minimal Holo | Turn frame (current) | Free | Free |
| FR-01 | **Glitch Static** | Turn frame | $1.99 | £1.99 |
| FR-02 | **Ornate Brass** | Turn frame | $1.99 | £1.99 |
| FR-03 | **Ink Panel Border** | Turn frame | $1.99 | £1.99 |
| SW-01 | **Cold Registrar** | System window | $1.99 | £1.99 |
| SW-02 | **Carved Ledger** | System window | $1.99 | £1.99 |
| SW-03 | **Phosphor Box** | System window | $1.99 | £1.99 |
| PF-01 | **Geometric Halo** | Portrait frame | $1.99 | £1.99 |
| PF-02 | **Laurel Stamp** | Portrait frame | $1.99 | £1.99 |
| PF-03 | **Rusted Tag** | Portrait frame | $1.99 | £1.99 |

---

## 9) Map skins, SFX, music (short list)

| ID | Pack name | Type | USD | GBP |
|----|-----------|------|-----|-----|
| MP-01 | **Street Neon** | Local map chrome | $2.99 | £2.99 |
| MP-02 | **Survey Parchment** | Local map chrome | $2.99 | £2.99 |
| SX-01 | **Rarity Stingers** | Loot fanfares C→L | $1.99 | £1.99 |
| SX-02 | **Impact & Crit** | Combat hits | $1.99 | £1.99 |
| SX-03 | **System Pings** | UI / registrar beeps | $0.99 | £0.99 |
| MU-01 | **Site Ambient** | 3 dungeon loops | $3.99 | £3.99 |
| MU-02 | **Threshold Boss** | 2 tension tracks | $3.99 | £3.99 |
| MU-03 | **Street Rain** | Overworld ambient | $2.99 | £2.99 |

Commission original audio or licensed stock with clearance — no ripped OST.

---

## 10) Bundles (Phase 1 shop heroes)

| Bundle | Includes | USD | GBP |
|--------|----------|-----|-----|
| **Integration Starter** | TH-02 + DC-01 + SW-01 + FR-01 | $9.99 | £7.99 |
| **Ledger Scholar** | TH-03 + FT-02 + DC-06 + SW-02 | $9.99 | £7.99 |
| **Registrar Voice Kit** | VO-01 + VO-02 + SX-03 | $9.99 | £7.99 |
| **Noir Night** | TH-09 + DC-08 + AR-02 + FR-03 | $9.99 | £7.99 |
| **Full Aesthetic Pass** (season) | 1 theme + 1 dice + 1 font + 1 voice | $14.99 | £11.99 |

Supporter tip badge (Pack 9 A32): **$4.99 / £4.99** — not a theme, but Phase 0.

---

## 11) Naming ban-list (examples — expand before launch)

Do **not** use in shop titles or art:  
Tolkien-unique names · Pokémon / Digimon / Palworld creature or tool names · Warhammer faction marks · D&D product logos · “Sin City” · celebrity names · “Hogwarts” / house crests · anime title locks · Exact UI clones of named mobile gacha games.

Safe customer phrases: “System chrome”, “grimdark bone dice”, “neon street map”, “cold registrar voice”, “parchment journal theme”.

---

## 12) Phase 1 build order (cosmetics only)

1. Entitlement ids + “cosmetic only” disclosure  
2. **DC-01 System Holo** dice  
3. **TH-02 Neon Protocol** theme  
4. **VO-01 Cold Registrar** voice  
5. **SW-01 + FR-01** chrome  
6. **SX-01** rarity stingers  
7. **Integration Starter** bundle  
8. Font pack **FT-01** (licence-cleared)  
9. Relabel shop art styles (Noir Crimson, Deep Ink Shadow)  
10. Tip / supporter badge  

---

## 13) Data shape (when implementing)

Suggested entitlement key: `cosmetic.{slot}.{id}`  
Slots: `theme | font | dice | diceAnim | voice | frame | systemWindow | portraitFrame | mapSkin | sfx | music | artStyle | bundle | badge`

Renderer / TTS / CSS read entitlement; **checkMath / dungeonSeed / quests never import cosmetic ids**.

---

**Enough to sell from:** themes §3, fonts §4, dice §6, voices §7, frames §8, bundles §10.  
**Still later:** full seasonal calendar, paper-doll armor cosmetics, WOF chat bubbles (see wof/pack-14).
