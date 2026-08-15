# WOF (World of Fantasy) — Themed MMO Commerce Dump

**Date:** August 15, 2026
**Status:** Design research for WOF, a later-release text MMO platform with many themed worlds. NOT live SynapticGM. No production code. No licensed settings as WOF content.
**Purpose:** Define the product split (capacity subscription / world DLC / chrome cosmetics), plan matrix, Theme Kits, phone layouts, module maths, entitlements schema, cross-world rules, failure modes, and John's calls. EXTENDS prior dumps; does not redefine locked schemas.

---

## IP Check

All world names, kit names, dice pack names, voice names, species, and mechanics below are original to WOF. Real games are named as SOURCES only (Roblox, Fortnite, D&D Beyond, Hidden Door, Friends & Fables, NovelAI, AI Dungeon, FFXIV, WoW, Steam, Apple IAP, Stardew Valley). No licensed game content is used as WOF content.

---

## Product Split (Locked — Do Not Merge)

| Letter | Category | What It Is | How It's Sold |
|--------|---------|------------|--------------|
| **A** | Capacity | Subscription. Meters turns, TTS minutes, image gen, queue priority. NEVER meters story quality or dice odds. | Monthly subscription (tiers). |
| **B** | World | Buy-and-own DLC. Each world is a skin + rulesModuleId. Includes a Theme Kit. | One-time purchase per world. |
| **C** | Chrome | UI skins, dice skins, TTS voices, portrait frames, fashion overlays. Cosmetic ONLY — never touches dice math. | À la carte or bundles. |

---

## 1) Competitor JOB Table (12 Sources)

| # | Source | COPY (the job it does) | AVOID (trap) | WOF v1 Pick |
|---|--------|----------------------|-------------|-------------|
| 1 | **Steam DLC** (Paradox, Total War, etc.) | Buy-and-own expansion worlds. One price, permanent access. Clear store page per DLC. Refund window. | Avoid "DLC creep" (20+ tiny DLCs that feel mandatory). Avoid locking base-game features behind DLC. | World DLC as buy-and-own. Each world has a clear store page. Ash Compact is the included world, not a DLC. |
| 2 | **Roblox paid experiences vs cosmetics** | Experiences are separate games with separate entry fees. Cosmetics (avatar items) are cross-experience. Clear split: "pay to enter" vs "pay to look." | Avoid Robux opacity (hard to know real-dollar cost). Avoid child-targeted dark patterns (loot boxes, "limited time" pressure on minors). | World DLC = "pay to enter the world." Chrome = "pay to look." Two separate shop sections. Kid Mode: no IAP at all. |
| 3 | **D&D Beyond: dice vs book marketplace** | Dice skins are cosmetic ($1.99–$5.99). Books/adventures are content DLC ($9.99–$29.99). Two separate shops. Dice never affect rolls. | Avoid bundling dice with books (confuses what you're buying). Avoid subscription-gating dice you already bought. | Chrome shop (dice/voices) separate from World shop. Dice never affect rolls. Theme Kit comes WITH the world (1 dice + 1 voice included). |
| 4 | **Hidden Door: extra worlds** | Worlds are authored by partners (publishers). Access is subscription-tiered. Higher tier = more world access. | Avoid locking worlds behind the highest sub tier only (forces whale commitment for content). Avoid mixing world access with capacity limits. | Worlds are buy-and-own DLC, NOT subscription-gated. Sub meters capacity (turns/TTS), not world access. |
| 5 | **Friends & Fables: host-pays** | Host subscribes; friends play free. Host's tier limits party size, mentions, credits. | Avoid host-pays-all model (WOF already locked per-player LLM budget). Avoid tier-gating party size. | Per-player LLM budget (already locked). No host-pays. Party size limited by instance design, not by wallet. |
| 6 | **NovelAI: capacity tiers** | Tiers meter: context length, image gen, model access (smaller model free, larger model paid). No world DLC (single-mode app). | Avoid gating story QUALITY by tier (lower tier = dumber model = worse story). Avoid making free tier feel broken. | Sub tiers meter capacity (turns/day, TTS minutes, queue priority). Free tier uses the SAME model, just fewer turns. Story quality is identical across tiers. |
| 7 | **Fortnite: battle pass (cosmetics not power)** | Battle pass is cosmetic-only. No gameplay advantage. Seasonal rotation creates urgency without P2W. Paid pass unlocks premium track; free track exists. | Avoid FOMO pressure on minors (time-limited exclusive skins). Avoid making the free track feel empty. | Seasonal cosmetic events (speculative v2). No battle pass at v1 (too complex). Chrome shop is permanent, not time-limited. Kid Mode: no FOMO pressure. |
| 8 | **FFXIV: buy the world, sub to play** | Expansion = buy-and-own (world content). Subscription = required to play at all. Clear split: expansion is content, sub is access. | Avoid requiring BOTH expansion purchase AND sub for basic play (FFXIV's free trial is generous, but the double paywall is a known pain point). | World DLC = buy-and-own. Sub = capacity, not access. A player who buys a world but drops their sub can still play with free-tier turns. They don't lose world access. |
| 9 | **WoW: expansion + sub** | Similar to FFXIV. Expansion is content, sub is access. Current expansion is included in sub. Older expansions are free. | Avoid "you must buy the latest expansion to play with friends" (splits the player base). | Ash Compact is always included (the "current expansion" equivalent). Older DLC worlds never expire. |
| 10 | **Apple IAP guidelines** | Clear pricing. No hidden costs. Subscription auto-renewal disclosed. Parental controls. Age-gating for mature content. | Avoid violating App Store guidelines (auto-renewal disclosure, parental consent for minors, no loot boxes in some jurisdictions). | All pricing clear. Auto-renewal disclosed. Kid Mode: no IAP. Mature worlds (Halo Term, Blackwake) age-gated. No loot boxes ever. |
| 11 | **AI Dungeon: credit system** | Credits buy turns, image gen, premium models. Subscription gives monthly credit allotment. | Avoid credit opacity ("How many credits is one turn?"). Avoid making credits feel like a casino chip. | Turns/day is a clear unit (not "credits"). TTS minutes are a clear unit. No opaque credit system. |
| 12 | **Stardew Valley: one-time purchase, no IAP** | Buy once, play forever. No subscription. No IAP. All content updates free. | Avoid the "no ongoing revenue" problem (WOF has server costs). | WOF can't be buy-once (server + LLM costs are ongoing). But the SPIRIT is right: buy a world, own it forever. Sub covers server costs, not content access. |

---

## 2) Plan Matrix

| Row | Ash Compact Access | Extra World Access | Daily Turns | TTS Minutes/Day | Image Gen/Day | Queue Priority | Theme Kit | Extra Dice/Voices | Kid Mode | NEVER Sold |
|-----|-------------------|-------------------|------------|-----------------|--------------|---------------|-----------|------------------|----------|-----------|
| **Free** | Yes (included) | No (must buy world DLC) | 15 turns (speculative) | 0 (text only) | 3 images | Standard | Ash Compact default kit only | Can purchase | Available | Combat outcomes, lockout skips, loot luck, random power packs, story quality, dice odds |
| **Mid Sub ($9.99/mo)** | Yes | No (still must buy world DLC) | 50 turns | 15 min | 10 images | Standard | Ash Compact default kit only | Can purchase | Available | Same |
| **High Sub ($19.99/mo)** | Yes | No (still must buy world DLC) | Unlimited | 60 min | 30 images | Priority | Ash Compact default kit only | Can purchase | Available | Same |
| **World DLC ($12.99 each, speculative)** | N/A (Ash Compact already included) | Yes — the purchased world. Permanent. | Uses the player's sub turn budget | Uses the player's sub TTS budget | Uses the player's sub image budget | Uses the player's sub queue tier | YES — Theme Kit included with world purchase (1 UI skin + 1 dice pack + 1 voice + default fashion) | Can purchase extras for that world | Available (but mature worlds locked in Kid Mode) | Same |
| **All-Worlds Pass ($49.99/yr, speculative)** | Yes | Yes — ALL current and future worlds. Permanent while active. | Uses the player's sub turn budget | Uses the player's sub TTS budget | Uses the player's sub image budget | Uses the player's sub queue tier | ALL Theme Kits for all worlds | Can purchase extras | Available (mature worlds locked in Kid Mode) | Same |
| **À la carte Chrome** | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Yes — individual dice packs ($2.99), voices ($4.99), UI themes ($3.99), fashion items ($1.99–$4.99), portrait frames ($1.99) | N/A | Same |

### Key Rules

1. **Sub meters CAPACITY, not content.** A free player with a World DLC can play that world with 15 turns/day. A High Sub player without the DLC cannot enter that world.
2. **World DLC is buy-and-own.** Dropping a sub does NOT revoke world access. The player just goes back to free-tier capacity.
3. **Theme Kit comes with the World DLC.** Buying Bonded Menagerie gives you: the world + the Bonded Menagerie UI skin + 1 dice pack ("Feral Dice") + 1 voice ("Keeper's Voice") + default fashion (Keeper's Cloak).
4. **Extra chrome is à la carte.** Additional dice packs, voices, fashion items, etc., are sold separately.
5. **Kid Mode: no IAP.** Kid Mode accounts cannot purchase anything. Parents manage purchases from the parent account.
6. **Mature worlds locked in Kid Mode.** Even if the parent account owns Halo Term or Blackwake, Kid Mode cannot access them.
7. **All-Worlds Pass is optional.** It's a convenience SKU for players who want everything. Individual DLC is always available.
8. **NEVER sold:** Combat outcomes, lockout skips, loot luck, random power packs, story quality differences, dice odds, XP boosts, gold (real money → gameplay gold is never allowed).

### Price Bands (Speculation — Cited Analogs)

| SKU Type | WOF Speculative Price | Analog |
|----------|----------------------|--------|
| Mid Sub | $9.99/mo | NovelAI Tablet ($10), D&D Beyond Hero ($5.99 but less capacity), SynapticGM Adventurer ($9.99 from pack-09) |
| High Sub | $19.99/mo | NovelAI Scroll ($15), F&F Starter ($19.95), SynapticGM Hero ($19.99 from pack-09) |
| World DLC | $8.99–$14.99 each | Steam indie DLC ($7.99–$14.99), FFXIV expansion ($39.99 but much larger scope) |
| All-Worlds Pass | $39.99–$59.99/yr | Xbox Game Pass ($9.99–$14.99/mo but different model), Humble Choice ($11.99/mo) |
| Dice Pack | $2.99 | D&D Beyond dice ($1.99–$5.99) |
| Voice Pack | $4.99 | SynapticGM Cold Registrar voice ($4.99 from pack-09) |
| UI Theme | $3.99 | SynapticGM Neon System theme ($3.99 from pack-09) |
| Fashion Item | $1.99–$4.99 | Fortnite skins ($5–$20, but WOF is text — lower value perception) |
| Portrait Frame | $1.99 | D&D Beyond portrait frames ($1.99) |

---

## 3) Theme Kit Per World

Each world DLC includes a Theme Kit. The kit is the "default look" for that world. Extra chrome is sold separately.

| World | Maturity | UI Skin Name | Dice Pack Name | Voice Name | HUD Bars That Swap | Extra Shop Examples | Notes |
|-------|---------|-------------|---------------|-----------|-------------------|-------------------|-------|
| **Ash Compact** | PG-13 | Ember Interface | Hearthstone Dice | Warden's Voice | HP bar, STA bar, System recap | Extra dice: Forge Dice, Cinder Dice. Extra voice: Elder's Whisper. | Included with platform. Theme Kit is the default. |
| **Bonded Menagerie** | PG-13 | Keeper's Lodge | Feral Dice | Keeper's Voice | HP bar, Bond bar, Loyalty meter, Collection counter | Extra dice: Wildbloom Dice. Extra voice: Marsh Call. Extra fashion: Keeper's Cloak. | Bond bar replaces STA bar. Collection counter is always visible. |
| **Circuit Arc** | PG-13 | Arena Grid | Spark Dice | Announcer's Voice | HP bar, Circuit gauge, Bracket tracker, Round counter | Extra dice: Lightning Dice. Extra voice: Rival's Taunt. | Shonen tournament. Bracket tracker replaces quest log during arcs. |
| **Hearth Season** | PG-13 | Cottage Frame | Garden Dice | Hearth Narrator | Comfort bar, Season clock, Recipe book, Farm plot grid | Extra dice: Harvest Dice. Extra voice: Market Crier. Extra fashion: Apron Set. | No HP/STA/wipe bars. Comfort bar is the primary gauge. |
| **Stage Light** | PG-13 | Spotlight Skin | Star Dice | Director's Voice | Stamina bar, Rehearsal timer, Score meter, Fan gauge | Extra dice: Curtain Call Dice. Extra voice: Stage Whisper. | Idol/school. Score meter replaces combat recap. |
| **Starwake** | PG-13 | Helm Display | Drift Dice | Bridge Voice | Hull bar, Heat gauge, Nav chart, Scan overlay | Extra dice: Nebula Dice. Extra voice: Comms Officer. | Space opera. Heat gauge is frame_heat. Nav chart replaces street map. |
| **Halo Term** | Mature | Terminal Dark | Breach Dice | Watcher's Voice | HP bar, Integrity gauge, Alert level, Sector map | Extra dice: Static Dice. Extra voice: Dispatch Tone. | Mature: horror/thriller. Locked in Kid Mode. |
| **Quarry Pact** | PG-13 | Stonework UI | Quarry Dice | Foreman's Voice | HP bar, Vein tracker, Yield gauge, Depth meter | Extra dice: Ore Dice. Extra voice: Tunneler's Echo. | Mining/survival. Depth meter replaces floor count. |
| **Lanceyard** | PG-13 | Tilt Banner | Joust Dice | Herald's Voice | HP bar, Mount gauge, Tilt counter, Honor score | Extra dice: Crown Dice. Extra voice: Crowd Roar. | Jousting/tournament. Tilt counter is per-match. |
| **Veil Watch** | Mature | Shadowglass | Veil Dice | Sentinel's Voice | HP bar, Veil gauge, Ward counter, Sight meter | Extra dice: Dusk Dice. Extra voice: Whisper Beyond. | Mature: cosmic horror. Locked in Kid Mode. |
| **Card Vein** | PG-13 | Cardstock Frame | Dealer's Dice | Shuffler's Voice | Hand display, Lane grid, Draw counter, Discard pile | Extra dice: Foil Dice. Extra voice: Rival Dealer. | Card-battle. Hand display replaces HP bar. No sealed power packs — cards are seen/owned, never gacha. |
| **Route Lantern** | PG-13 | Trailmark Skin | Compass Dice | Pathfinder's Voice | STA bar, Lantern gauge, Trail log, Provisions counter | Extra dice: Ember Dice. Extra voice: Wind Whisper. | Exploration/wayfinding. Lantern gauge is light resource. |
| **Hollow Term** | Mature | Decay Grid | Rot Dice | Caretaker's Voice | HP bar, Decay gauge, Bloom counter, Root map | Extra dice: Spore Dice. Extra voice: Undergrowth Hum. | Mature: body horror/fungal. Locked in Kid Mode. |
| **Gridrun** | PG-13 | Neon Grid | Pulse Dice | Runner's Voice | HP bar, Clock gauge, Net map, ICE tracker | Extra dice: Byte Dice. Extra voice: Operator's Drone. | Cyberpunk runner. Clock gauge is mission timer. |
| **Blackwake** | Mature | Drowned Ledger | Tide Dice | Bosun's Voice | HP bar, Hull gauge, Crew roster, Cargo manifest | Extra dice: Barnacle Dice. Extra voice: Foghorn Call. | Mature: dark-age naval. Locked in Kid Mode. |

---

## 4) Phone Screen Layouts

### Shared Chrome (All Worlds)

```
┌─────────────────────────────────────┐
│ [World Icon] [Journal] [Map] [Char] │  ← top tab bar (always visible)
├─────────────────────────────────────┤
│                                     │
│           STORY AREA                │  ← 55–60% of screen (scrollable)
│           (prose first)             │
│                                     │
├─────────────────────────────────────┤
│  SYSTEM / MODULE WINDOW             │  ← 15% (after story, NEVER before)
│  (varies by world — see below)      │
├─────────────────────────────────────┤
│  [Choice 1] [Choice 2] [Choice 3]  │  ← 25% bottom (thumb-reach)
│  [Choice 4] [Free text...]         │  ← min 44pt touch targets
├─────────────────────────────────────┤
│  [Presence: 3 others in hub]        │  ← slim bar (0 LLM cost)
└─────────────────────────────────────┘

SEND LOCK: the Send/confirm button is ALWAYS bottom-right.
           It does NOT move between worlds.
STORY FIRST: the System/module window appears AFTER story prose,
             NEVER above it, NEVER replacing it.
PRESENCE: code-rendered, polling-based, 0 LLM cost.
          Shows count + race icons. No chat preview.
```

### 4A. Ash Compact

#### Hub Screen

```
┌─────────────────────────────────────┐
│ [Ash] [Journal] [Map] [Character]   │
├─────────────────────────────────────┤
│                                     │
│  "Reedfen Square is quiet this      │
│   morning. Elder Mara tends the     │
│   hearth near the hall, her hands   │
│   dark with soot."                  │
│                                     │
├─────────────────────────────────────┤
│  ─── No system window (hub) ──────  │
│  Quest: The Hearthborn's Request    │
│  → Visit Reedfen Marsh (2/3 done)   │
├─────────────────────────────────────┤
│  [Talk to Elder] [Go to Marsh]      │
│  [Open Salvage]  [Free text...]     │
├─────────────────────────────────────┤
│  [Presence: 5 in Reedfen Square]    │
└─────────────────────────────────────┘
```

#### Lockstep Fight Screen (HP)

```
┌─────────────────────────────────────┐
│ [Ash] [—] [—] [Character]          │  ← Journal/Map hidden in combat
├─────────────────────────────────────┤
│                                     │
│  "You drive the knife forward.      │
│   The hatchling twists, jaws        │
│   snapping shut on empty air."      │
│                                     │
├─────────────────────────────────────┤
│ ─── SYSTEM RECAP · ROUND 2 ─────── │
│ You → Hatchling A | Strike | HIT 6 │
│ Hatchling A → You | Bite   | MISS  │
│ ─────────────────────────────────── │
│ YOU:  HP 14/20 | STA 4/8            │
│ ENEMY: Hatchling A — HP 8/20       │
├─────────────────────────────────────┤
│  [Strike] [Heavy Strike] [Brace]   │
│  [Break Away] [Free text...]        │
├─────────────────────────────────────┤
│  [Presence: hidden in combat]       │
└─────────────────────────────────────┘
```

#### Journal Tab

```
┌─────────────────────────────────────┐
│ JOURNAL                       [×]   │
├─────────────────────────────────────┤
│ ► Active Quests                     │
│   ├ The Hearthborn's Request        │
│   │   → Visit Reedfen Marsh         │
│   │   → Kill 3 Hatchlings (2/3)     │
│   │   → Deliver Scale to Elder      │
│   └ Apprentice Miller               │
│       → Collect 10 Marsh Grain (4)  │
│                                     │
│ ► Completed Quests                  │
│   (none yet)                        │
│                                     │
│ ► Story Log                         │
│   Turn 12: Entered Reedfen Marsh    │
│   Turn 10: Met Elder Mara           │
│   Turn 8: Arrived at Reedfen Square │
├─────────────────────────────────────┤
│  [Back to Story]                    │
└─────────────────────────────────────┘
```

#### Character / Paper-Doll Tab

```
┌─────────────────────────────────────┐
│ CHARACTER                     [×]   │
├─────────────────────────────────────┤
│ Name: Kael                          │
│ Race: Hearthborn                    │
│ Level: 3  |  XP: 145/300            │
│                                     │
│ HP: 14/20  |  STA: 4/8              │
│ ATK: 8  |  DEF: 5  |  SPD: 6       │
│                                     │
│ ► Equipped                          │
│   Weapon: Hearthborn Cutting Knife  │
│   Armor:  Padded Vest               │
│                                     │
│ ► Inventory (6 items)               │
│   Reedfen Scale x2                  │
│   System-Issue Bandage x3           │
│   Marsh Grain x4                    │
│                                     │
│ ► Talent Tree (1/12 unlocked)       │
│   [View Tree]                       │
│                                     │
│ ► Gold: 230                         │
├─────────────────────────────────────┤
│  [Back to Story]                    │
└─────────────────────────────────────┘
```

### 4B. Bonded Menagerie

#### Hub Screen

```
┌─────────────────────────────────────┐
│ [Menag] [Journal] [Collection] [Char]│
├─────────────────────────────────────┤
│                                     │
│  "The hollow smells of damp moss    │
│   and something warm. A shape       │
│   moves in the bracken — low,       │
│   four-legged, watching you."       │
│                                     │
├─────────────────────────────────────┤
│  ─── No system window (hub) ──────  │
│  Bond: Reedfen Hatchling (Pip)      │
│    Loyalty: ████████░░ 82/100       │
│  Quest: Find the Marsh Wisp         │
├─────────────────────────────────────┤
│  [Approach creature] [Call Pip]      │
│  [Search area]  [Free text...]      │
├─────────────────────────────────────┤
│  [Presence: 2 keepers nearby]       │
└─────────────────────────────────────┘
```

#### Catch Round (Bond / Loyalty)

```
┌─────────────────────────────────────┐
│ [Menag] [—] [Collection] [Char]     │
├─────────────────────────────────────┤
│                                     │
│  "The Marsh Wisp hovers, its        │
│   light pulsing faintly. It         │
│   watches your hand but does        │
│   not flee."                        │
│                                     │
├─────────────────────────────────────┤
│ ─── BOND ROUND · ATTEMPT 2 ─────── │
│ Approach: Gentle    | Bond +12      │
│ Wisp mood: Cautious | Flee risk 20% │
│ ─────────────────────────────────── │
│ WISP: Trust 34/100 | Mood: Cautious │
│ YOU:  Bond items: Glow Berry x2     │
├─────────────────────────────────────┤
│  [Offer Glow Berry] [Sing to Wisp]  │
│  [Step Back] [Free text...]         │
├─────────────────────────────────────┤
│  [Presence: hidden in catch]        │
└─────────────────────────────────────┘
```

#### Collection Log (Seen / Caught / Silhouette)

```
┌─────────────────────────────────────┐
│ COLLECTION                    [×]   │
├─────────────────────────────────────┤
│ Seen: 8 / 16  |  Caught: 4 / 16    │
│                                     │
│ #001 Reedfen Hatchling    ✓ CAUGHT  │
│ #002 Mill Rat             ✓ CAUGHT  │
│ #003 Marsh Gnat           ○ SEEN    │
│ #004 Reed Frog            ✓ CAUGHT  │
│ #005 Marsh Lurker         ○ SEEN    │
│ #006 Lampwood Sprout      ○ SEEN    │
│ #007 Pier Crab            ✓ CAUGHT  │
│ #008 Crossroads Wolf      ○ SEEN    │
│ #009 ████████████████      ? ???    │
│ #010 ████████████████      ? ???    │
│ #011 ████████████████      ? ???    │
│ ...                                 │
│                                     │
│ [Tap entry for details]             │
├─────────────────────────────────────┤
│  [Back to Story]                    │
└─────────────────────────────────────┘
```

### 4C. Hearth Season

#### Farm / Town Screen

```
┌─────────────────────────────────────┐
│ [Hearth] [Journal] [Recipes] [House]│
├─────────────────────────────────────┤
│                                     │
│  "Morning light spills across the   │
│   garden. The rowanberries are      │
│   nearly ripe; you can smell        │
│   them from the porch."            │
│                                     │
├─────────────────────────────────────┤
│ ─── COZY TICK ─────────────────── │
│ Season: Late Summer | Day 14        │
│ Comfort: ████████░░ 78/100          │
│ Farm: Rowanberry (ripe tomorrow)    │
│       Marsh Herb (3 days)           │
│ Mood: Content                       │
├─────────────────────────────────────┤
│  [Harvest garden] [Cook breakfast]  │
│  [Visit market]   [Free text...]    │
├─────────────────────────────────────┤
│  [Presence: 4 in town square]       │
└─────────────────────────────────────┘
```

Note: **No HP bar, no STA bar, no wipe/raid chrome.** Comfort bar is the primary gauge. Season clock replaces dungeon progress. Recipe book replaces talent tree. Farm plot grid replaces the dungeon map.

#### House Tab

```
┌─────────────────────────────────────┐
│ HOUSE                         [×]   │
├─────────────────────────────────────┤
│ Rooms: Kitchen, Bedroom, Porch      │
│ Comfort: 78/100                     │
│                                     │
│ ► Kitchen                           │
│   Decor: Copper Kettle, Herb Rack   │
│   Comfort bonus: +12                │
│                                     │
│ ► Bedroom                           │
│   Decor: Quilted Bed, Lantern       │
│   Comfort bonus: +8                 │
│                                     │
│ ► Porch                             │
│   Decor: Rocking Chair, Wind Chime  │
│   Comfort bonus: +6                 │
│                                     │
│ [Rearrange] [Craft Decor]           │
├─────────────────────────────────────┤
│  [Back to Story]                    │
└─────────────────────────────────────┘
```

### 4D. Circuit Arc (Shonen Tournament)

#### Bracket Screen

```
┌─────────────────────────────────────┐
│ [Arc] [Journal] [Bracket] [Char]    │
├─────────────────────────────────────┤
│                                     │
│  "The arena roars. Across the       │
│   ring, your opponent rolls their   │
│   shoulders, sparks crawling        │
│   along their knuckles."            │
│                                     │
├─────────────────────────────────────┤
│ ─── CIRCUIT ROUND · MATCH 3 ────── │
│ You → Rival Kira | Surge | HIT 9   │
│ Kira → You       | Guard | BLOCK   │
│ ─────────────────────────────────── │
│ YOU:  HP 22/30 | Circuit ███░░ 60%  │
│ KIRA: HP 18/30 | Circuit ██░░░ 40% │
│ Round: 2 / 5   | Bracket: QF       │
├─────────────────────────────────────┤
│  [Surge] [Arc Blast] [Guard]        │
│  [Taunt]  [Free text...]            │
├─────────────────────────────────────┤
│  [Crowd: 12 spectators]             │
└─────────────────────────────────────┘
```

Note: Circuit gauge replaces STA. Bracket tracker replaces quest log during tournament arcs. Spectators replace the presence list (watching, not playing — 0 LLM).

---

## 5) Module Maths One-Pagers

Each module is a rulesModuleId that the engine loads. The ENGINE is one codebase; modules are configuration + formulas. Each module defines: what the ledger stores, what a round resolves, win/lose conditions, what LLM must not invent, and solo vs party behavior.

### 5A. hp_check (Ash Compact, Quarry Pact, Lanceyard, Halo Term, Gridrun, Blackwake, Veil Watch)

```
Ledger:  playerHp, playerMaxHp, playerSta, playerMaxSta, enemyHp[], enemyMaxHp[]
Round:   player picks action → code rolls d20 + atkMod vs enemyAC
         → HIT/MISS/CRIT → code rolls damage → subtract from enemyHp
         → enemy picks action (code-owned AI) → same resolution vs player
Win:     all enemy HP ≤ 0
Lose:    player HP ≤ 0 → Downed → bleed-out to -5 → death
LLM:     must not state damage, HP, kill, or miss. Narrates from outcome token only.
Solo:    yes. Party: up to 5 (dungeon) or 10 (raid).
Variant: Lanceyard adds mount gauge (mount HP separate from rider).
         Gridrun adds clock gauge (mission timer — lose if clock hits 0).
```

### 5B. bond_type (Bonded Menagerie)

```
Ledger:  creatureId, creatureTrust (0–100), creatureMood (calm/cautious/hostile/fleeing),
         playerBondItems[], approachType, fleeRisk (%)
Round:   player picks approach (gentle, firm, offer_item, sing, step_back)
         → code resolves: trustDelta = approachWeight × moodMultiplier + itemBonus
         → fleeCheck: d100 vs fleeRisk (if failed, creature flees — round ends)
         → if trust ≥ threshold → CAUGHT
         → if trust still < threshold → round continues (max 5 rounds per attempt)
Win:     trust ≥ threshold (threshold varies by species rarity:
           common 40, uncommon 60, rare 75, epic 90, legendary 100)
Lose:    creature flees (fleeRisk exceeded) OR 5 rounds pass without catch
         Creature is NOT killed. It retreats. Can be re-encountered later.
LLM:     must not state trust numbers, flee risk, or threshold. Narrates mood shifts.
         Must not invent new species or new bond items.
Solo:    yes. Party: up to 5 (field instance). Catch is personal (each player catches their own).
Formulas:
  trustDelta = {
    gentle: 8–12 (random),
    firm: 4–18 (high variance),
    offer_item: itemBondValue (5–20 depending on item),
    sing: 6–10 (flat),
    step_back: -2 (reduces trust slightly but drops fleeRisk by 10%)
  } × moodMultiplier {
    calm: 1.2,
    cautious: 1.0,
    hostile: 0.6,
    fleeing: 0.3
  }
  fleeRisk starts at species.baseFleeRisk (10–40%).
  Each round: fleeRisk += 5% (creature gets nervous).
  step_back: fleeRisk -= 10%.
```

### 5C. score_set (Stage Light, Lanceyard joust variant)

```
Ledger:  playerScore, rivalScore, roundsPlayed, roundsTotal,
         performanceMeter (0–100), fanGauge (0–100)
Round:   player picks performance action (sing, dance, pose, freestyle, rest)
         → code resolves: scoreDelta = actionBase × performanceMod × fanBonus
         → performanceMeter adjusts (rest recovers, actions deplete)
         → fanGauge adjusts (good performance increases, bad decreases)
         → rival performs (code-owned AI) → rival scoreDelta calculated
Win:     playerScore > rivalScore after roundsTotal rounds
Lose:    playerScore ≤ rivalScore after roundsTotal
LLM:     must not state scores, fan numbers, or performance percentages.
         Narrates the crowd's reaction and the visual spectacle.
Solo:    yes (vs AI rival). Party: up to 5 (concert/group event).
Formulas:
  scoreDelta = actionBase {
    sing: 10–15, dance: 8–18 (high variance), pose: 12 (flat),
    freestyle: 5–25 (very high variance), rest: 0
  } × performanceMod (performanceMeter / 100, min 0.5)
    × fanBonus (1.0 + fanGauge / 200, max 1.5)
  performanceMeter: -15 per action, +25 per rest. Clamped 0–100.
  fanGauge: +scoreDelta / 5 per round. Clamped 0–100.
```

### 5D. cozy_tick (Hearth Season)

```
Ledger:  comfortLevel (0–100), season, day, farmPlots[], recipesKnown[],
         inventory (ingredients/decor/crafted), mood (content/cheerful/cozy/bored)
Round:   (not lockstep combat — tick-based)
         Each tick (server clock): farmPlots grow, comfort adjusts, mood adjusts.
         Player actions between ticks: harvest, cook, craft, decorate, visit NPC, host guest.
         Each action: code resolves outcome (recipe success, comfort bonus, mood shift).
Win:     no win/lose. Progression is comfort level and recipe completion.
         Seasonal goals (e.g., "harvest 20 rowanberries by autumn") give XP/gold.
Lose:    comfort can drop to 0 if neglected (no upkeep, no cooking, no decor).
         At 0 comfort: mood = "bored," NPC interactions are flat, farm yield drops 50%.
         NOT a death state. Player can recover by cooking/decorating.
LLM:     must not state comfort numbers, mood states, or recipe outcomes.
         Narrates the atmosphere (cozy kitchen, wilting garden, cheerful neighbor).
Solo:    yes. Party: up to 4 (cozy instance — guests visit your house).
Formulas:
  comfortPerTick = sum(decorComfort) + mealBonus (last meal's comfort value, 5–15)
                   - neglectPenalty (2 per tick with no action) - weatherPenalty (0–5)
  farmGrowth: each plot has growthTicks (3–10). Tick decrements. At 0 → harvestable.
  recipeSuccess: automatic if player has ingredients. Quality = 1 + (comfortLevel / 100).
```

### 5E. card_lane (Card Vein)

```
Ledger:  playerHand[], playerDeck[], playerDiscard[], playerDrawCount,
         laneState (front/back/any), playerLaneCards[], rivalLaneCards[],
         playerHp, rivalHp
Round:   player draws (code-owned, from deck). Picks a card to play in a lane.
         → code resolves: cardPower × laneBonus (correct lane = 1.5x, any lane = 1.0x)
         → damage to rival = cardPower after rival's defense card (if any)
         → rival plays (code-owned AI) → same resolution vs player
Win:     rival HP ≤ 0
Lose:    player HP ≤ 0 OR deck empty with no playable hand
LLM:     must not state card power numbers, lane bonuses, or HP.
         Narrates the card's visual effect (flame burst, shield shimmer).
         Must not invent cards not in the player's deck.
Solo:    yes. Party: up to 2 (tag-team variant — speculative).
Note:    Cards are SEEN/OWNED in collection. NO sealed power packs. NO gacha.
         Cards are earned (quest rewards, dungeon drops, crafting) or bought from
         the in-game card merchant (gold, not real money). Card Vein's economy
         is gameplay-only. Cosmetic card backs are chrome (real money OK).
Formulas:
  damage = cardPower × laneMultiplier (front 1.0, back 1.2, correct lane 1.5)
           - defenseCardPower (if defender played a defense card)
  draw: 1 card per round from deck. Hand max 5. Excess discarded (player chooses).
```

### 5F. frame_heat (Starwake)

```
Ledger:  frameHeat (0–maxHeat), maxHeat, heatPerAction, overheatThreshold,
         playerHp, playerMaxHp, cooldownAction, overheatPenalty
Round:   player picks action → code resolves damage/defense (hp_check base)
         → frameHeat += heatPerAction
         → if frameHeat ≥ overheatThreshold → overheatPenalty applied
           (skip_turn OR stat_reduction OR forced_rest)
         → cooldownAction (vent, dump, coast) reduces heat
Win/Lose: same as hp_check (enemy HP ≤ 0 / player HP ≤ 0)
LLM:     must not state heat numbers or threshold. Narrates heat effects
         (cockpit warnings, frame shuddering, vents hissing).
Solo:    yes. Party: up to 5 (fleet sortie).
Formulas:
  heatPerAction = { attack: 15, defend: 5, ability: 20, vent: -25 }
  overheatThreshold = 80 (of maxHeat 100)
  overheatPenalty: skip_turn (if heat ≥ 100), stat_reduction (if heat 80–99)
  vent: sets heat -= 25, costs the turn (no attack/defend).
```

### 5G. realm_gate (Route Lantern, Hollow Term)

```
Ledger:  lanternFuel (0–100), trailProgress (0–trailLength), provisionsCount,
         hazardDeck[], currentHazard, discoveredLandmarks[], playerHp
Round:   player picks travel action (march, scout, rest, forage, light_lantern)
         → code resolves: trailProgress += marchDistance
         → hazardCheck: draw from hazardDeck (code-owned, not LLM)
           → hazard = encounter (hp_check combat) OR obstacle (ability check)
              OR nothing (safe passage)
         → lanternFuel -= fuelPerStep. If fuel = 0 → darkness penalty (hazard chance ×2).
         → provisions -= 1 per rest. If provisions = 0 → HP drain per step.
Win:     reach trailLength (destination). Discover landmarks along the way.
Lose:    HP ≤ 0 (same as hp_check death).
LLM:     must not state fuel, provisions, trail progress, or hazard deck contents.
         Narrates the trail, the landscape, the darkness, the discoveries.
Solo:    yes. Party: up to 5 (expedition).
Formulas:
  marchDistance = 10 + speedMod (per step). Trail lengths: 50–200 (speculative).
  fuelPerStep = 5. Lantern capacity = 100. Refuel at landmarks.
  scoutBonus: reveals next hazard (player sees "hazard ahead" vs "clear path").
  forageBonus: +1–3 provisions (random).
```

### 5H. bond_heart (Bonded Menagerie — partner combat extension)

```
Ledger:  bondedCreatureId, bondLevel (0–100), bondAbilityId,
         creatureHp, creatureMaxHp, creatureAtk, creatureDef,
         synergyBonus (active when bondLevel ≥ 50)
Round:   player and bonded creature act together in hp_check combat.
         Player picks own action + creature action (or creature auto-acts if plan-auto).
         → code resolves both actions in the same round.
         → if bondLevel ≥ 50: synergyBonus applies (+10% creature stats).
         → if bondLevel ≥ 80: bond ability unlocks (creature-specific special move).
         → bond actions (praise, scold, feed, recall) adjust bondLevel between fights.
Win/Lose: same as hp_check (but creature can also be downed — creature KO'd
          means player fights alone, creature recovers after fight).
LLM:     must not state bond level, synergy bonus, or creature stats.
         Narrates the creature's behavior (eager, hesitant, fierce, loyal).
Solo:    yes (player + creature). Party: up to 5 (each player has their bonded creature).
Formulas:
  bondLevelGain = { praise: +3, feed: +5, scold: -2, recall: 0, win_fight_together: +2 }
  synergyBonus (bondLevel ≥ 50): creature atk *= 1.1, creature def *= 1.1
  bondAbility (bondLevel ≥ 80): creature gains 1 special action per fight.
```

---

## 6) Entitlements Schema

```typescript
interface AccountEntitlement {
  accountId: string;
  subscriptionTier: "free" | "mid" | "high" | null;
  subscriptionExpiresAt: number | null;
  worldUnlocks: WorldUnlock[];
  chromeOwned: ChromeSku[];
  kidMode: boolean;
  wallets: {
    gold: number;                           // gameplay currency (per-character, not per-account)
    cosmeticTokens: number;                 // purchased or event-earned (per-account)
  };
  allWorldsPass: boolean;
  allWorldsPassExpiresAt: number | null;
  // Rules:
  // 1. subscriptionTier determines capacity (turns/day, TTS min, images, queue).
  // 2. worldUnlocks are PERMANENT. Dropping sub does not revoke them.
  // 3. allWorldsPass grants access to all worlds while active. If it lapses,
  //    the player keeps any worlds they had BEFORE the pass (not worlds added during).
  //    Speculative: or they keep all worlds unlocked during the pass period.
  //    John's call.
  // 4. kidMode: no IAP allowed. Mature worlds locked. Friends-only chat.
  // 5. Billing services NEVER write to EncounterLedger, HP, loot, gold, or XP.
  //    Entitlements are a separate data domain from gameplay state.
}

interface WorldUnlock {
  worldId: string;                          // "world_bonded_menagerie"
  unlockedAt: number;
  source: "purchase" | "all_worlds_pass" | "gift" | "promotion";
  themeKitGranted: boolean;                 // true if Theme Kit was included
  permanent: boolean;                       // true for purchase/gift, false for pass-sourced (speculative)
}

interface ThemeKitGrant {
  worldId: string;
  kitId: string;                            // "kit_bonded_menagerie_default"
  contents: {
    uiSkinId: string;                       // "ui_keepers_lodge"
    dicePackId: string;                     // "dice_feral"
    voiceId: string;                        // "voice_keepers"
    defaultFashionIds: string[];            // ["fashion_keepers_cloak"]
  };
  grantedAt: number;
  // The Theme Kit is granted automatically when the world is unlocked.
  // It is permanent. It is not revokable even if the world unlock source lapses.
  // (Once you have the kit, you keep the kit.)
}

interface ChromeSku {
  skuId: string;                            // "dice_wildbloom"
  skuType: "dice_pack" | "voice_pack" | "ui_theme" | "fashion_item" | "portrait_frame" | "sfx_pack";
  worldId: string | null;                   // null = cross-world chrome; "world_bonded_menagerie" = world-specific
  purchasedAt: number;
  priceAtPurchase: number;                  // in cents (USD)
  // Rules:
  // 1. Chrome is cosmetic ONLY. It never affects dice math, HP, loot, or combat outcomes.
  // 2. Chrome is permanent. Once purchased, it is never revoked.
  // 3. World-specific chrome (e.g., "Wildbloom Dice" for Bonded Menagerie) requires the
  //    world unlock to USE (it's visible in that world only). But the purchase is permanent.
  //    If the world unlock lapses (All-Worlds Pass expiry), the chrome is still owned
  //    and reactivates when the world is re-unlocked.
}

interface Wallet {
  gold: number;                             // per-character. Earned in-game. Spent on gameplay items.
  cosmeticTokens: number;                   // per-account. Purchased with real money or earned via events.
  // Rules (restated from prior dumps):
  // 1. Gold CANNOT buy cosmetic tokens.
  // 2. Cosmetic tokens CANNOT buy gold.
  // 3. The two wallets NEVER cross.
  // 4. Gold is per-character (each character in each world has their own gold).
  // 5. Cosmetic tokens are per-account (shared across all characters and worlds).
}

// CRITICAL RULE:
// Billing services (Stripe, Apple IAP, Google Play) write to:
//   - AccountEntitlement (subscription tier, world unlocks, chrome SKUs, cosmetic tokens)
// Billing services NEVER write to:
//   - EncounterLedger (HP, damage, rounds)
//   - PlayerCollection (species seen/caught)
//   - QuestState (objectives, completion)
//   - TalentTree (nodes unlocked)
//   - Inventory (items, equipment)
//   - Wallet.gold (gameplay currency)
// The gameplay domain and the billing domain are SEPARATE.
// There is no code path from "payment confirmed" to "HP increased" or "loot granted."
```

---

## 7) Cross-World Rules

### 7A. Can Friends in Different Worlds Party?

**Recommend: NO — friends in different worlds cannot instance together.**

```
Rationale:
1. Each world has a different rulesModuleId. Ash Compact uses hp_check.
   Bonded Menagerie uses bond_type. The combat/interaction systems are incompatible.
2. An Ash Compact fighter and a Bonded Menagerie keeper cannot share an instance
   because the instance runs ONE rulesModuleId. The fighter expects lockstep rounds
   with HP/STA. The keeper expects bond rounds with trust/mood. They can't coexist.
3. Social features (friend list, tells, presence) are CROSS-WORLD.
   You can see that your friend is online in Bonded Menagerie while you're in Ash Compact.
   You can send them a tell. You can invite them to YOUR world (if they own it).
4. To play together, both players must be in the SAME world.
   If your friend doesn't own your world, they can't join your instance.
5. Speculative later (v3+): "Crossroads" hub — a world-neutral social space
   where players from any world can meet, chat, and trade cosmetics.
   No combat, no instances, no rulesModuleId. Just social.
```

### 7B. Can Chrome Overlay Across Worlds?

**Recommend: Default chrome per world + John's call on cross-world overlay.**

```
Scenario: Player owns "Feral Dice" (Bonded Menagerie dice pack).
          They're playing Ash Compact. Can they use Feral Dice in Ash Compact?

Option A: World-locked chrome. Feral Dice only work in Bonded Menagerie.
  Pro: Each world has a distinct visual identity. No jarring mismatches.
  Con: Player feels punished for buying chrome ("I paid for these dice but can't use them here").

Option B: Cross-world chrome. Feral Dice work in any world.
  Pro: Player gets value from every purchase everywhere.
  Con: Visual identity breaks (bone-and-fur dice in a space opera don't make sense).

Recommendation: Default to world-locked (Theme Kit applies automatically in its world).
                John's call on whether purchased chrome can be toggled to other worlds.
                If yes: toggle is player-side only (other players see the world's default chrome, not your override).
                This is a low-stakes decision — it's cosmetic.
```

### 7C. Character: One Per World vs Transferable

**Recommend: One character per world. NOT transferable.**

```
Rationale:
1. Characters in different worlds have different stats, abilities, and progression systems.
   A Bonded Menagerie keeper has a bond level and a collection log.
   An Ash Compact fighter has HP, STA, and a talent tree.
   These are not interchangeable.
2. Transferring a character between worlds would require stat conversion
   (how many bond points = how many talent points?). This is a design nightmare.
3. Each world is a fresh start. The player creates a new character for each world.
4. Account-level features (friend list, cosmetic tokens, chrome ownership) are shared.
   Character-level features (gold, inventory, quests, stats) are per-world.
5. Character slots: speculative. 1 per world (free) or 3 per world (sub benefit).
   John's call.
```

---

## 8) Failure Modes (Max 12)

| # | Failure Mode | How It Happens | Prevention |
|---|-------------|---------------|-----------|
| 1 | **World gated behind whale sub** | All worlds are only accessible on the $19.99/mo "High" sub. Free and mid-sub players can only play Ash Compact. This makes worlds feel like a sub benefit, not a product. | Worlds are buy-and-own DLC. Sub meters capacity, not content. A free player who buys Bonded Menagerie can play it with 15 turns/day. |
| 2 | **Theme Kit that changes odds** | "Feral Dice" from the Bonded Menagerie Theme Kit gives +5% catch rate. Now it's pay-to-win. | Theme Kits are cosmetic ONLY. Dice packs change visuals, not rolls. Voices change narration tone, not outcomes. Fashion changes appearance, not stats. Locked: never sell combat outcomes. |
| 3 | **Card Vein loot boxes** | Card Vein sells "Sealed Card Packs" for real money. Players buy packs hoping for rare cards. This is gacha. | Card Vein cards are SEEN/OWNED, never gacha. Cards are earned (quests, drops, crafting) or bought from the in-game card merchant (gold). Cosmetic card backs are chrome (real money OK). No sealed power packs. |
| 4 | **Kid Mode IAP** | Kid Mode account purchases a world DLC or chrome item. Minor spends money without parental consent. | Kid Mode: no IAP. No purchase buttons visible. No ads. Parents manage purchases from the parent account. Kid Mode can only PLAY content the parent account owns. |
| 5 | **Chrome shop mixed with world DLC** | The store lists dice packs next to world DLCs. Player buys "Feral Dice" ($2.99) thinking they bought Bonded Menagerie ($12.99). | Two separate shop sections: "WORLDS" and "CUSTOMIZE." Different page, different layout, different checkout flow. World pages clearly show "Includes Theme Kit" and the world's description. Chrome pages clearly show "Cosmetic only — does not unlock world access." |
| 6 | **LLM-minted world unlock** | LLM narrates "The System grants you access to Bonded Menagerie." Player expects their account now has the world. | World unlocks are billing-domain only. The LLM has no access to AccountEntitlement. Code path from LLM to entitlements does not exist. The LLM cannot grant, revoke, or reference entitlements. |
| 7 | **All-Worlds Pass lapse confusion** | Player has All-Worlds Pass for a year. Pass lapses. Player loses access to worlds they played for months. Characters are "gone." | On lapse: characters are PRESERVED but inaccessible. If the player re-subscribes or buys the world individually, their character is restored. Clear messaging: "Your character in Bonded Menagerie is saved. Purchase the world or renew your pass to continue." |
| 8 | **Cross-world stat injection** | Player finds a way to import their Ash Compact character's stats into Bonded Menagerie, bypassing bond mechanics. | Characters are per-world. No stat transfer. No cross-world character import. The gameplay domain is isolated per world. |
| 9 | **Theme Kit revocation on pass lapse** | Player gets Theme Kit from All-Worlds Pass. Pass lapses. Theme Kit is revoked. Player loses cosmetics they thought they owned. | Theme Kits are permanent once granted. Even if the world unlock source lapses, the Theme Kit stays in the account. |
| 10 | **Gold-to-cosmetic-token exchange** | Players find a way to convert gameplay gold to cosmetic tokens (or vice versa), breaking the two-wallet firewall. | No code path between the two wallets. Gold is per-character, earned in-game. Cosmetic tokens are per-account, purchased or event-earned. No exchange, no conversion, no loophole. |
| 11 | **Mature world in Kid Mode** | Kid Mode account somehow accesses Halo Term (mature horror). Minor sees violent/disturbing content. | Mature worlds are locked in Kid Mode at the entitlement layer. Even if the parent account owns Halo Term, the Kid Mode flag prevents loading the world. The world doesn't appear in the world list. |
| 12 | **Capacity starvation on free tier** | Free player buys 3 world DLCs. Has 15 turns/day spread across 3 worlds. Feels like 5 turns per world. Frustrated. | Clear messaging: "Your turn budget is shared across all worlds. Upgrade your plan for more turns." The free tier is designed for 1 world (Ash Compact). Playing multiple worlds on free tier is possible but suboptimal — the sub is the right answer. |

---

## 9) John's Calls (Max 10)

| # | Call | Options | Recommendation | Rationale |
|---|------|---------|---------------|----------|
| 1 | **Ash Compact: free-to-enter or paid?** | Free (included with platform) / Paid (cheapest DLC) | **Free (included).** | Ash Compact is the showcase. Every player needs a world to play. Free Ash Compact = everyone can try the platform. This is the FFXIV free-trial model: the base world is free, expansions cost money. |
| 2 | **World access: DLC or high-sub includes worlds?** | DLC (buy-and-own) / High sub ($19.99) includes all worlds | **DLC (buy-and-own).** | Burying worlds in the high sub makes them feel like a sub benefit, not a product. DLC lets players buy ONLY the worlds they want. A player who loves Hearth Season but not Starwake shouldn't pay for both. |
| 3 | **Theme Kit: included with world DLC or separate purchase?** | Included / Separate ($4.99 add-on) | **Included.** | The Theme Kit IS the world's default look. Charging extra for it feels like selling the box the game comes in. Including it makes the DLC feel complete. Extra chrome is separate. |
| 4 | **Chrome: world-locked or cross-world overlay?** | World-locked (default) / Cross-world (player toggle) | **World-locked default, John decides on cross-world toggle.** | World-locked preserves visual identity. Cross-world toggle is player-side only (others see default). Low-stakes decision. |
| 5 | **All-Worlds Pass: offer it or not?** | Yes (annual SKU) / No (individual DLC only) | **Yes, but not at v1 launch.** | At v1 there's only Ash Compact (free). The pass becomes relevant when 3+ worlds exist. Offer it when the catalog justifies the price. |
| 6 | **DLC price band** | $8.99 / $12.99 / $14.99 per world | **$12.99.** | $8.99 feels cheap (perception of low value). $14.99 feels high for a text game world. $12.99 is the indie DLC sweet spot (Steam data). Complex worlds (Ash Compact-scale) could be $14.99. Simple worlds (Hearth Season) could be $9.99. Speculative: tiered pricing per world complexity. |
| 7 | **All-Worlds Pass lapse: keep worlds or lose them?** | Keep all worlds unlocked during pass period / Lose access on lapse | **Keep worlds.** | Losing access to worlds the player has invested in feels punitive. Keeping them makes the pass feel like "pay less for everything" rather than "rent everything." |
| 8 | **Free tier daily turns** | 10 / 15 / 20 | **15.** | 10 is too few (one dungeon run exhausts the budget). 20 is generous (less sub incentive). 15 is one session (hub + one encounter + some exploration). |
| 9 | **Character slots per world** | 1 (free) + 2 (sub) / 3 (all players) / unlimited | **1 free, 3 for subscribers.** | 1 free character per world lets players try the world. Subscribers get alts. This matches the MMO convention. |
| 10 | **Cosmetic token earn rate (non-purchase)** | Events only / daily login / achievement milestones | **Events + achievement milestones.** | Daily login rewards create obligation ("must log in every day"). Events and achievements reward PLAYING, not logging in. Speculative: 50 tokens per seasonal event, 10 tokens per major achievement. |

---

## Sources

| Source | URL | Date Accessed | What Was Used |
|--------|-----|--------------|---------------|
| Steam DLC pricing (Steam Page Analyzer) | https://www.steampageanalyzer.com/blog/steam-pricing-strategy | Aug 15, 2026 | Indie DLC price tiers ($7.99–$14.99), buy-and-own model |
| Roblox paid experiences (Roblox documentation) | https://create.roblox.com/docs | Aug 15, 2026 | Experience entry fees vs cosmetic avatar items, child safety |
| D&D Beyond dice marketplace | https://www.dndbeyond.com/tag/digital-dice | Aug 15, 2026 | Dice skin pricing ($1.99–$5.99), cosmetic-only dice, separate from book marketplace |
| Hidden Door world access | https://www.hiddendoor.com/ | Aug 15, 2026 | Subscription-tiered world access, publisher partnerships |
| Friends & Fables pricing | https://www.friendsandfables.com/ | Aug 15, 2026 | Host-pays model, tier-gated party size and mentions |
| NovelAI pricing (CheckThat.ai) | https://checkthat.ai/brands/novelai/pricing | Aug 15, 2026 | Capacity tiers (context length, image gen), Anlas credits |
| Fortnite battle pass (Epic Games) | https://www.fortnite.com/ | Aug 15, 2026 | Cosmetic-only battle pass, no gameplay advantage, seasonal rotation |
| FFXIV expansion model (Square Enix) | https://na.finalfantasyxiv.com/ | Aug 15, 2026 | Buy expansion + sub to play, free trial model, expansion = content |
| Apple IAP guidelines | https://developer.apple.com/app-store/review/guidelines/ | Aug 15, 2026 | Auto-renewal disclosure, parental controls, age-gating |
| AI Dungeon credit system (DungeonsDeep) | https://dungeonsdeep.ai/blog/ai-dungeon-review-2026 | Aug 15, 2026 | Credit opacity, plan-to-playtime mapping problem |
| Stardew Valley pricing model | https://www.stardewvalley.net/ | Aug 15, 2026 | Buy-once, no IAP, free updates |
| Existing project file: docs/research/pack-09-monetization-cosmetics-audio-iap-2026-08.md | (project file) | Aug 15, 2026 | SynapticGM pricing tiers, cosmetic SKUs, never-sell rules, Kid Mode |
| Existing project file: WOF_GoLive_Systems_Dump.md | (project file) | Aug 15, 2026 | Module extensions (bond_type, hp_check, card_lane, frame_heat, cozy_tick), shared catalogs, skin matrix |
| Existing project file: WOF_Gap_Fill_Dump.md | (project file) | Aug 15, 2026 | AH/escrow, deeds, tick model, LLM budget, two-wallet recommendation |
| Existing project file: WOF_PlayableStart_Dump.md | (project file) | Aug 15, 2026 | Reedfen bible, first hour, quest DAGs, combat feel, social/safety, economy |
| Existing project file: WOF_Multiplayer_Design_Dump.md | (project file) | Aug 15, 2026 | EncounterLedger, lockstep rounds, raid size 10, lockout, join locks |

---

## Speculation Markers

1. **Free tier 15 turns/day** — speculative. Could be 10 or 20.
2. **Mid sub $9.99/mo** — speculative. Could be $7.99 or $12.99.
3. **High sub $19.99/mo** — speculative. Could be $14.99 or $24.99.
4. **World DLC $12.99** — speculative. Could be tiered ($8.99–$14.99 by complexity).
5. **All-Worlds Pass $49.99/yr** — speculative. Could be $39.99 or $59.99.
6. **All-Worlds Pass: keep worlds on lapse** — speculative (John's call #7).
7. **Chrome prices ($1.99–$4.99)** — speculative. Based on D&D Beyond and pack-09 analogs.
8. **Cosmetic token earn rate (50 per event, 10 per milestone)** — speculative.
9. **1 free character + 2 sub characters per world** — speculative.
10. **bond_type trust thresholds (40/60/75/90/100)** — speculative. Need balance testing.
11. **score_set performance/fan formulas** — speculative. Need playtesting.
12. **frame_heat overheat thresholds (80/100)** — speculative. Carried from Go-Live dump.
13. **realm_gate trail lengths (50–200)** — speculative.
14. **card_lane lane multipliers (1.0/1.2/1.5)** — speculative.
15. **Crossroads social hub (v3+)** — speculative.
16. **All-Worlds Pass timing (not at v1 launch)** — speculative.

---

**End of Themed MMO Commerce Dump. Combined with prior dumps (Multiplayer Design, Gap Fill, Go-Live Systems, Playable Start), this provides the complete product split, plan matrix, Theme Kit definitions, phone layouts, module maths, entitlements schema, cross-world rules, failure modes, and remaining John's calls for WOF as a themed MMO platform.**
