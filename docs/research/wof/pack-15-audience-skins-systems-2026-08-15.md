# WOF Pack 15 — Other audiences + per-skin systems

**Project:** WOF later release. Do not implement into live SynapticGM.  
**Point:** Pack 9–13 are MMO/RPG bones. Skins are **not** the same maths. A lot of players John might want are **not** D&D/MMO people — manga/anime, sci-fi, cozy, sports, school stories, collection, fashion.

Genre **patterns** only. No licensed names, characters, slogans, or lookalike mascots.

---

## What we already have vs what this pack adds

| Already (Packs 9–14) | Missing until now |
|----------------------|-------------------|
| Hubs, instances, lockstep, plan-auto, housing, AH, server tick | Rules **modules** that are not HP+d20 |
| Ash Compact + 15 skins in Pack 10 | Extra skins for anime / sci-fi / YA / cozy |
| Comic/webtoon as **live SynapticGM method** (do not ship WOF into live) | WOF may **reuse the idea**: page/webtoon reading, not tabletop log only |
| Kid Mode / ratings in live | WOF skins must declare maturity (school vs horror vs romance) |

---

## Shared engine vs rules module

Do **not** fork a new MMO per fandom. One engine. Each skin sets `rulesModuleId` on the EncounterLedger and on holdings.

| Module | Ledger resolves | Who it is for | Pack 10 skin |
|--------|-----------------|---------------|--------------|
| `hp_check` | HP, soak, interrupt | Classic fantasy / dungeon anime | Ash Compact, First-Song |
| `bond_type` | Capture, loyalty, type matchup | Creature collect, ranch | Bonded Menagerie |
| `realm_gate` | Breakthrough rank, tournament bracket | Cultivation / shonen training | Sect Ascension |
| `hunt_part` | Weak-point parts, carve loot | Hunt fantasy | Quarry Pact |
| `heat_wanted` | Heat, alarm, escape | Cyberpunk, heist | Gridrun, Crew Score |
| `frame_heat` | Heat, ammo, structure | Mecha | Lanceyard |
| `steadfast` | Steadfast/sanity, clue tokens | Horror | Veil Watch |
| `score_set` | Set score, stamina, match clock | Sports / performance | **New** skins below |
| `bond_heart` | Affection, route flags (no NSFW default) | Romance / school | Hollow Term + new |
| `cozy_tick` | Garden/shop ticks, **no wipe raids** | Cozy / farm | **New** |
| `ship_board` | Hull, boarding | Sail / space | Blackwake, Void Reach |

If a skin has no raid fantasy (cozy, idol, romance), **raid 10 is optional**. Party 2–5 instances can be “matches,” “rehearsals,” or “dates/events” using the same lockstep handler.

---

## Extra skins (beyond Pack 10) — not tabletop-first

Working titles. Fence = original only.

### 17. Circuit Arc
**For:** Shonen / tournament-anime fans.  
**Pattern:** Training → bracket → finals.  
**Math:** `realm_gate` or `score_set`. “Raid” = final match, 1v1 or 3v3, not a 10-man soak fight.  
**Fence:** No licensed hero academies, breath styles, or pirate-crew names.

### 18. Halo Term (powers school)
**For:** Superpower-school anime.  
**Pattern:** Campus hub + license exams + team incidents.  
**Math:** `hp_check` + exam instances. Closer to Hollow Term + Badge Circuit.  
**Fence:** No licensed “hero academia” names, quirks-as-that-cast, or slogans.

### 19. Starwake
**For:** Sci-fi / space-opera (anime and Western).  
**Pattern:** Already Void Reach — keep; emphasise ship life, stations, boarding.  
**Math:** `ship_board`.  
**Fence:** No licensed orders, empires, or sword-religion.

### 20. Hearth Season
**For:** Cozy / farm / “I don’t want to raid.”  
**Pattern:** Town, garden, shop, festivals. Combat rare or off.  
**Math:** `cozy_tick` + housing/AH from Pack 11. No weekly raid lockout.  
**Fence:** No licensed valley-farm or raccoon-shop IP.

### 21. Stage Light
**For:** Idol / band / performance (anime + K-pop-adjacent **pattern**, not those brands).  
**Pattern:** Rehearsal instances, set scores, costume collection.  
**Math:** `score_set`. “Party” = unit. “Raid” = concert night (10 is optional; 5 is enough).  
**Fence:** No licensed idol-franchise names, songs, or lookalike groups.

### 22. Pitch League
**For:** Sports anime / YA sports.  
**Pattern:** Season, matches, stamina.  
**Math:** `score_set`. Auto-run = playbook (same as BattlePlan).  
**Fence:** No licensed leagues, team names, or player likenesses.

### 23. Route Lantern
**For:** Romance / found-family / otome-adjacent, all-ages default.  
**Pattern:** Hub social, route flags, festival instances.  
**Math:** `bond_heart`. Combat optional.  
**Fence:** No licensed dating-sim casts. Kid Mode: no sexual content; crushes OK if rating allows.

### 24. Card Vein
**For:** Card-battle anime **pattern**.  
**Pattern:** Deck as loadout; duel instance.  
**Math:** New `card_lane` (not d20). Collection log.  
**Fence:** No licensed card-game names, “it’s time to duel” clones, or franchise monsters. **Do not sell sealed power packs** (capacity/cosmetics only — Pack 14).

### 25. Sky Frame
**For:** Mecha anime (already Lanceyard). Keep; don’t duplicate.  
**Math:** `frame_heat`.

### 26. Isekai Gate
**For:** Isekai / System-status fans.  
**Pattern:** Transported + status windows.  
**Math:** `hp_check` + System chrome. **Closest to live SynapticGM** — WOF skin must stay original and **must not be shipped into the live game**.

---

## Cross-cutting features (appeal outside tabletop)

These sit on the shared engine. Any skin can turn them on.

| Feature | Why it matters | Notes |
|---------|----------------|-------|
| **Avatar / fashion first** | Roblox/Fortnite/Genshin-age identity | Cosmetic only. Paper-doll + portrait. Never stats-for-pay. |
| **Collection log** | Creatures, cards, costumes, ships | Completeness %, not loot luck for sale |
| **Short session + auto-run** | Mobile / after-school | Pack 13 plan-auto already does this |
| **Comic / webtoon read** | Manga/webtoon fans | Reuse live *idea* of visualMode; WOF later, not a live patch |
| **Stickers / reactions** | Chat that isn’t raid-call | Pack 14 chat cosmetics when chat exists |
| **Found-family party** | Anime party trope | Friends-only finder already locked |
| **Seasonal events** | Festivals, not attunement grind | Server clock (Pack 11) |
| **Cozy path** | Skip raids entirely | `cozy_tick` skins |
| **Romance flags** | YA, not adult default | Rating + Kid Mode |
| **Spectator / recap share** | “clip the match” | Recap table is shareable; prose optional |
| **UGC later** | Roblox-like creation | Defer; moderation hell. Not v1 |

**Do not add for kids/YA:** power gacha, loot-box odds as the loop, unrated romance, licensed lookalikes, 4-hour mandatory raids.

---

## Kid / YA

- Each skin has a **maturity tag**: all-ages / teen / mature.  
- Hearth Season, Stage Light, Pitch League, Bonded Menagerie → default all-ages.  
- Veil Watch, Night Charter, Gridrun → teen+.  
- Kid Mode (live method): no IAP/ads in that mode; same for WOF later.  
- Collection is OK; **selling random power** is not.

---

## Build order if expanding audience (later, not now)

1. Keep Ash Compact as the MMO spine.  
2. **Bonded Menagerie** (`bond_type`) — widest non-tabletop hook.  
3. **Circuit Arc** or **Halo Term** — shonen/school.  
4. **Starwake / Void Reach** — sci-fi.  
5. **Hearth Season** — players who hate raids.  
6. Card Vein / Stage Light / Route Lantern only after collection + social chat exist.

No extra MMO-presence research required. **New work when a skin is chosen:** one rules-module spec (what the ledger rolls) + original bible + ban-list.
