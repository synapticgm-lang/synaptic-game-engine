# Pack 25 — Multi-world MMO family: what we have vs what to generate

**Project:** WOF later titles only. **Not live SynapticGM.** Do not import into `src/`, `supabase/`, live prompts, settings, or saves.  
**Status:** Catalog + generation bill. Not a live-game ticket.  
**Rule:** Genre *patterns* only. No licensed names, maps, creatures, slogans, or beat-for-beat plots.

One engine (hubs, instanced combat, lockstep, personal loot). Each title is a **world pack + rules module + Theme Kit**, not a second codebase. Worlds are buy-and-own DLC; Ash Compact is the included spine. Theme Kit ships with the world.

Honest copy until MP is live: “solo,” “private co-op,” or “limited online region” — not “MMO” in store text.

---

## Direct answers

| You asked | Original WOF title | Pattern (not a clone) | Have we got everything? |
|-----------|--------------------|------------------------|-------------------------|
| Warcraft-like two-faction MMO | **Ash Compact** | Starter zones, hubs, 5-mans, 10-man raid, two factions | **No.** Starts exist in `wof/`. Capitals, campaign spine, raid, talents, vendors, premade talk, Theme Kit, mid/endgame still missing. |
| Tolkien-shaped world, no copyright | **First-Song** | Mythic fellowship, mixed peoples, long war, corrupting-relic *archetype* | **No.** Name + fence only. Zero places, races, quests, maps. |
| Sword Art Online-like | **Isekai Gate** | Trapped-in-a-clearable-world, floor/layer climb, guilds, high-stakes death/lockout | **No.** Catalog only. Must stay WOF — do **not** ship into live SynapticGM (live already occupies LitRPG/System). |
| Pokémon-style collect | **Bonded Menagerie** | Wild bond, small active party, type matchups, ranch | **No.** Needs `bond_type` ledger + original fauna. Ignore Gloamwild / Pactbeasts dumps. |

We do **not** have enough to release any of these as online worlds. We have: shared MMO bones (research), Ash Compact **friends-alpha-sized** starts in `wof/`, and working titles for ~26 skins.

---

## IP fence (all titles)

**Allowed:** public-domain folklore types as inspiration (human, elf, dwarf, giant, dragon-as-archetype) with original cultures; catch-and-bond; floor-climb; fellowship quest; sect ranking.

**Forbidden as content:** Warcraft/Blizzard names; Middle-earth names, unique species, Ring-plot; SAO/Aincrad/floors-as-that-castle; Pokémon monsters, balls, regions, gym slogans; any other franchise’s unique places, items, or casts.

Each world ships a **GM ban-list** of lookalike proper nouns.

Do **not** use dump names Ember Crown, Pactbeasts, Gloamwild, Deepgate, Sunloom as the live WOF bible.

---

## Recommended title family

Ship order if expanding: **Ash Compact → Bonded Menagerie → Isekai Gate or Circuit Arc → First-Song → Starwake → Hearth Season**. Rest are later worlds.

### A. Ask-set (first four)

**Ash Compact** — `hp_check` · teen · two factions (Ash Compact / Tide Covenant) · races Hearthborn, Lanternfolk, Saltkin, Stonevein · starts Reedfen, Lampwood, Brinewatch, Granite Stair · capitals Ash Seat, Tidehold. Warcraft *structure* only.

**First-Song** — `hp_check` · teen · new peoples and places (do not reuse Compact races as “the elves”). Fellowship + court reputation + named-evil raids. Tolkien *pattern* only.

**Isekai Gate** — `hp_check` + floor/layer flags · teen · original clearable world, original System chrome, original floors/layers. SAO *pattern* only. Death = instance wipe + lockout/gear wear, not a licensed “die in the game” slogan. **WOF app only.**

**Bonded Menagerie** — `bond_type` · all-ages default · original fauna, biomes, bond tools, type chart. Pokémon *pattern* only. Premium never buys catch rate or a missing creature.

### B. Other worlds worth doing (already named)

| Title | Genre pattern | Module | Maturity | Notes |
|-------|---------------|--------|----------|-------|
| Circuit Arc | Shonen tournament | `realm_gate` / `score_set` | teen | Name freeze: shonen, not sci-fi |
| Halo Term | Powers school | `hp_check` + exams | teen | Not a licensed hero academy |
| Hollow Term | Magic school | `hp_check` + `bond_heart` | teen | Not a licensed boy-wizard world |
| Starwake | Space opera | `ship_board` | teen | Name freeze: space, not idol |
| Lanceyard | Mecha lance | `frame_heat` | teen | Not a licensed mech series |
| Quarry Pact | Coordinated hunt | `hunt_part` | teen | Carve loot; original fauna |
| Sect Ascension | Cultivation / wuxia | `realm_gate` | teen | Original sects and realms |
| Gridrun | Cyberpunk crew | `heat_wanted` | teen+ | Original city and corps |
| Blackwake | Age of sail | `ship_board` | teen | Original seas and flags |
| Night Charter | Hidden-society courts | `hp_check` + social heat | teen+ | Original bloodlines |
| Badge Circuit | Superhero patrol | `hp_check` | teen | Original city and capes |
| Dust Line | Frontier western | `hp_check` | teen | Original territories |
| Veil Watch | Cosmic-horror investigate | `steadfast` | teen+ | New horrors, not product-identity mythos brands |
| Crew Score | Heist | `heat_wanted` | teen | Job = instance |
| Hearth Season | Cozy farm/town | `cozy_tick` | all-ages | No raid lockout |
| Stage Light | Idol / performance | `score_set` | all-ages | Unit = party |
| Pitch League | Sports season | `score_set` | all-ages | Matches, not dungeons |
| Route Lantern | Romance / found-family | `bond_heart` | all-ages | Kid Mode: no sexual content |
| Card Vein | Card-battle | `card_lane` | all-ages | No power packs for sale |
| Void Reach | Keep as Starwake sibling or merge | `ship_board` | teen | Do not duplicate Starwake |
| Sky Frame | Merge into Lanceyard | `frame_heat` | teen | Do not duplicate |
| Isekai Gate | Listed in A | — | teen | Do not ship into live SynapticGM |
| Hearth Ruin | Post-collapse salvage | `hp_check` | teen | **Do not ship this skin into the live game** |

---

## What exists today

### Shared engine (research + `wof/` prep)

Hubs + instanced combat (Tier 3, not contested open world). Party 2–5, raid 10. Lockstep rounds. Personal loot. Weekly per-character lockout. Friends-first finder. Code owns dice/HP/quests/loot; LLM narrates. Expected-revision / speculative takes are live-game ideas — WOF should copy the *method* later, not the live files.

### Ash Compact content in `wof/`

Four starts, ~7 POIs each, 3 race + 3 profession + 3 zone quests each (36 total), four solo 5-mans, starter weapons/maps, species lists, isolated capitals (no walk). Ban-list started.

**Short of Pack 8:** 18–25 quest beats per zone (we have 9). No walk to Ash Seat / Tidehold / The Divide. No 10-man raid (Millstone Hollow still lore). No talent tree, vendor catalogs, AH, housing, main campaign contract, premade dialogue trees, choice decks, Theme Kit, or map art.

### Other titles

Working name + rules module + fence. **Zero** place graphs, loot tables, NPC talk, or instances in code.

Gloamwild JSON in `docs/research/wof/pasted/gloamwild-zip-2026-08-17/` is quarantined. Do not promote it to Bonded Menagerie canon.

---

## Master generation bill (every world)

Generate as **data packs** under `wof/` (or a future title root). Code owns IDs, graphs, rewards. LLM only fills atmosphere after the pack exists.

### 1. Identity and legal

- World id, display name, one-line pitch, maturity tag  
- Original name bible (peoples, places, factions, System/chrome name)  
- GM **ban-list** (licensed lookalikes + dump errors)  
- Theme Kit: UI tokens, 1 dice skin, 1 voice, 1 ambient loop, default fashion  
- Voice / narrator contract (Kid Mode rewrite rules)

### 2. Rules module

- What the ledger resolves (HP, bond, heat, score, steadfast, floors…)  
- Win / wipe / checkpoint / lockout  
- What prose is **forbidden** to invent (damage, loot, catch, floor clear)  
- Anti-P2W: premium never buys power, catch, clears, ranks

### 3. Map and places

- Continent/region list (authored, not LLM-rolled)  
- Travel graph: exits only, no teleport  
- Per start: 6–10 POIs, 1 hub ≠ capital, fog/knowledge flags  
- Indoor = floor-plan; outdoor = street pins  
- Capitals + mid-world merge (Ash Compact: Ash Seat, Tidehold, The Divide)  
- Instance entrances as places with `dungeonId`

### 4. Peoples and NPCs

- Playable kits (race or class or both) with start place, weapon, map, first-hour quest  
- Durable NPCs: id, place, role, portrait notes  
- **Premade talk trees** for quest givers (greet, quest offer, progress, turn-in, gossip) — not raw LLM as authority  
- Relationship / reputation tracks if the skin needs them  
- Introduction permit: who may be invented vs authored-only

### 5. Creatures and combat

- Species catalog: stats, habitat, rarity, carve/bond/loot flags  
- Trash / elite / boss roles  
- Per 5-man: 5 rooms, describe-before-creature, 1 checkpoint, 1 boss  
- Per raid (if any): 10-man, 3-phase script, weekly lockout copy  
- Encounter tables by place (code picks; LLM does not spawn)

### 6. Loot and economy

- Item templates: weapon, armor, tool, key, material, cosmetic  
- Drop tables by species/room (personal loot)  
- Repair costs, vendor buy/sell, faucet/sink caps  
- Two wallets if public: gold vs cosmetic tokens  
- Collection log entries (creatures, cards, costumes) — completeness, not paid luck

### 7. Quests

Pack 8 bar: **18–25 authored beats per starting zone**, plus a campaign spine.

Per zone minimum:

- Race/identity line (3)  
- Profession/craft line (3)  
- Zone story (3) — local problem, not save-the-world  
- Extra breadcrumb / side / repeatable dailies to reach 18–25  
- Hidden trust quest  
- Dungeon-clear closer  

Campaign (after starts):

- Opening contract (invariants + first-arc promise)  
- Main spine to capital / floor N / first gym-analog / first concert  
- Divergence records if the player walks away from a promise  
- Side hubs: reputation, collection, romance flags, hunt ranks — as the module needs

Objectives are code: visit, kill/bond, deliver, talk, collect. Titles and rewards are data.

### 8. Premade chats, choices, first hour

- Opening establishment: look, kit, origin, stake (one authored deck per kit)  
- First-hour HookArc: identity → choice → observed consequence  
- Grounded choice buttons per place (fight / talk / travel / use item) — inventory-aware  
- Canned hub lines (say/emote) so strangers are not LLM-chatting  
- Tutorial forced path (skippable on alts)  
- Diegetic System / bond / heat window **templates**  
- Retry beat deck (tactic / obstacle / revelation / consequence) so retries are not resamples  
- Ban recycled NPC greetings (anti-recycle fingerprints)

### 9. Progression and live ops

- Talent / license / bond-rank / realm tree (code nodes)  
- Daily/weekly contracts (capped)  
- Season seeds (optional cosmetics + one clock)  
- Kill switches: instances, chat, trade, auction, reward grant  
- Support: item grant only via ledger events

### 10. Social / MP (after SP slice)

- Presence: nearby count + races only  
- Party 2–5, raid 10 (or match/concert size for non-raid skins)  
- Tell + party chat; no global chat at v1  
- Housing / AH / guilds: late gates (Pack 11 / 18)

---

## Per-title generate-next (the four you named)

### Ash Compact (Warcraft-pattern)

**Have:** 4 starts, 36 quests, 4 five-mans, species, starter kits.  
**Generate next:**

1. Expand each zone from 9 → 18–25 beats (sides, dailies, dungeon breadcrumbs)  
2. Walk graph: starts → The Divide → Ash Seat / Tidehold  
3. Capital hubs + mid-game quest spine (faction promise board)  
4. Millstone Hollow 10-man 3-phase + lockout copy  
5. Vendor catalogs, talent tree, repair, two wallets  
6. Premade NPC talk + choice decks for every durable NPC  
7. Theme Kit + map fog labels + ban-list pass  
8. First-hour HookArc flags per race

### First-Song (Tolkien-pattern)

**Have:** name and fence.  
**Generate all of the master bill**, especially:

- 4 original peoples (not Compact races relabelled)  
- 4 homelands + 2 courts + 1 war-front  
- Relic as *archetype* (corruption track), not that Ring plot  
- Fellowship reputation + 1 named-evil 5-man + 1 10-man  
- Ban-list: Hobbit, Mordor, Gondor, Istari, that Ring, etc. (already on Ash Compact list; extend)

### Isekai Gate (SAO-pattern)

**Have:** name and fence.  
**Generate:**

- Original world name, floor/layer list (N layers, not 100 unless authored)  
- Safe-hub rules vs instance-death rules  
- Clear condition (last layer boss) as campaign contract  
- Guild-lite (no guild bank v1)  
- Floor 1 = full Pack 8 start (POIs, 18–25 beats, 5-man)  
- System window templates (original chrome)  
- PK/heat only if teen and gated; Kid Mode off  
- Ban-list: Aincrad, SAO, NerveGear, that death-game slogan set  
- **Do not** add this world to live SynapticGM

### Bonded Menagerie (Pokémon-pattern)

**Have:** name, `bond_type` flag, quarantined JSON (ignore as canon).  
**Generate:**

- `bond_type` ledger: capture attempt, loyalty, type chart, active party size  
- 8–12 biomes, 60–80 original creatures (not Gloamwild as-is)  
- Bond tool item (not a franchise ball)  
- Ranch/workshop hub + 4 field starts  
- Gym-analog: authored trial instances, original names  
- Collection log + non-paid catch-up  
- Ban-list: franchise monsters, balls, dex, gym slogans, lookalike mascots  
- No player-to-player creature trade at soft launch

---

## Release gates (honesty)

| Gate | Must exist | Must not claim |
|------|------------|----------------|
| SP vertical | One start loop + solo instance + local save | MMO, always-online |
| Private co-op | Dedicated instance authority, reconnect, 2–4 players | Seamless world, auction |
| Limited online | One hub shard, caps, moderation, kill switches | Global economy, housing, 24/7 events |
| Public MMO word | Capacity + support drills proven | — |

---

## Open for John

1. First extra world after Ash Compact: Bonded Menagerie / Isekai Gate / First-Song / Circuit Arc  
2. Isekai Gate: WOF-only app vs never (live already has LitRPG)  
3. Ash Compact public: all 4 starts vs Reedfen-first (Pack 18 dump said Reedfen alpha; you already asked for all 4 starts in prep)  
4. Whether First-Song is a **separate bought world** or a mythic campaign *inside* Ash Compact (recommend **separate** — different peoples)

When you pick a world, the next coding step is that world’s pack under `wof/` (places, quests, species, instances, talk trees) — not live `src/`.
