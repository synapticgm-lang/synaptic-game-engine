# WOF Pack 19 — Themed MMOs: commerce, chrome, remaining research

**Project:** WOF later release. Do not implement into live SynapticGM.  
**Point:** Worlds, UI chrome, and LLM capacity are **three different products**. Mixing them in one SKU is how this platform gets hated.

**Dump ingested:** [pasted/WOF_ThemedMMO_Commerce_Dump.md](./pasted/WOF_ThemedMMO_Commerce_Dump.md) (15 Aug 2026). Working locks: [pack-20](./pack-20-themed-mmo-commerce-ingested-2026-08-15.md).

Do not re-run playable-start / gap-fill / go-live / this commerce prompt.

---

## Three products (do not conflate)

| Product | What it is | Examples | Sell as |
|---------|------------|----------|---------|
| **Capacity** | How much you can play (LLM turns, TTS minutes, queue) | Free daily budget vs paid | **Subscription** (and optional turn packs) |
| **World** | A themed MMO: places, rules module, catalog, quests | Ash Compact, Bonded Menagerie, Hearth Season | **Buy and own** (DLC). Not a cosmetic. |
| **Chrome** | Look/sound only: UI, dice *skins*, voices, frames, chat bubbles | Neon System, marsh dice, GM voice | **À la carte** + a kit bundled with each world |

Live SynapticGM Pack 9/10 cosmetics are **chrome for the solo LitRPG**. They are not WOF worlds. Do not put Ash Compact in that shop.

---

## Recommendation (until John locks otherwise)

### 1) Subscription = capacity, not “which MMO you are allowed to love”

Tiers change **how much** you play, not story quality, not dice math, not which faction is real.

| Tier (working names) | Includes | Does not include |
|----------------------|----------|------------------|
| Free | Daily LLM budget, **Ash Compact** (the platform world), default chrome | Extra worlds, extra dice/voices |
| Mid (~$10–20/mo, speculative) | Higher/unlimited-capped turns, priority queue, default chrome | Do **not** dump every world here |
| High | More TTS/images/queue | Still not “all worlds forever” unless you later add an All-Worlds pass |

**Why worlds are not stuffed into every tier:** cozy players should not pay Legend prices to farm. Raiders should not be forced to buy Hearth Season. Kid Mode / mature tags differ per world. Playable-start already ships **one** world at public v1. F&F-style “pay more for memory/@mentions/worlds” is already a known hate pattern (Pack 14).

### 2) Themed MMOs = buy and own separately

Each official world after Ash Compact is a **one-time unlock** (Steam/app DLC pattern; Hidden Door “more worlds”; Foundry modules). Account owns it. Characters in that world still need a slot (playable-start dump: 3 slots — not locked).

Optional later: **All-Worlds pass** (sub add-on or yearly) for people who want everything. That is an extra SKU, not the default.

### 3) If they buy a world, they get a Theme Kit — yes

Buying Bonded Menagerie (etc.) should **feel like buying that game**, not a naked rules flag.

**Included with the world (one kit, cosmetic only):**

- UI / System window / map chrome for that world  
- **One** matching dice *skin* (disclosure: does not change odds)  
- **One** matching System or GM voice  
- Default paper-doll / clothes / chat bubble for that world  
- In-world **display** items that exist in the catalog (titles, frames) — never extra power  

**Not auto-included (still a shop, collectors pay extra):**

- Extra dice materials, extra voices, seasonal chrome, chat flair, fashion that is not the default kit  
- Live SynapticGM dice packs (different product)

**Never included, never sold:** better rolls, loot luck, lockout skips, random **power** packs (Card Vein especially).

### 4) Extra themed items after they own the world

Yes, sell more dice/voices/fashion **à la carte** ($1.99–$9.99 band from live Pack 9). Only if they already own the world *or* the chrome is marked **account-wide overlay** (John call). Default: world kit applies in that world; extra cosmetics are account-wide but still zero math.

### 5) Kid Mode

No IAP/ads in Kid Mode (locked). Parent buys worlds on the adult account. Mature-tagged worlds stay locked on Kid Mode characters even if the account owns them.

---

## What we already have (do not Bolt again)

Skin list + fences (Packs 10, 15). Rules module *names* (`hp_check`, `bond_type`, `cozy_tick`, …). Engine (lockstep, hubs, AH, housing). Ash Compact bible outline (playable-start). Live cosmetic *price bands* and “never sell outcomes.” Two wallets recommended (gold vs cosmetic tokens).

---

## Still worth researching (small → big)

| Size | Topic | Why |
|------|--------|-----|
| Small | Per-world **HUD chrome list** (what bars/labels swap) | Phone layout: HP vs bond vs score vs garden |
| Small | Theme Kit SKU table (what’s in the box vs shop extras) | Answers dice/voice/items for every listed world |
| Small | World picker vs cash shop IA | Don’t bury MMOs next to $2 dice |
| Small | Cross-world chrome: overlay vs locked-to-world | Fashion identity vs “I bought the wrong dice” |
| Medium | Per-module **math one-pager** (formulas, not a new engine) | `bond_type`, `score_set`, `cozy_tick`, `card_lane`, `frame_heat` |
| Medium | Phone screen layouts (hub / fight / collection / concert) | Same bones, different chrome |
| Medium | Family plan: one sub, several characters, Kid Mode worlds | Who pays LLM |
| Big | Store + entitlements schema (`WorldEntitlement`, `ThemeKit`, `ChromeSku`) | So billing never touches EncounterLedger |
| Big | Cross-world friends (can they party? no if different modules) | Presence vs instance |
| Skip for now | UGC world store, gacha, “battle pass that sells power” | Locked off |

---

## John's calls (commerce)

1. Ash Compact always free-to-enter (capacity still metered) vs also a paid world  
2. Extra worlds: one-time DLC vs “included in high sub” vs both (DLC + All-Worlds pass)  
3. Theme Kit included with world: yes (recommended) / chrome sold separate  
4. Extra dice/voices: account-wide overlay vs world-locked  
5. All-Worlds pass: never / yearly / high-sub perk  
6. Live SynapticGM cosmetic shop shared with WOF chrome: **no** (recommended) / yes  

---

## Bolt dump

Prompt: [RESEARCH-PROMPT-themed-mmo-commerce-bolt.md](./RESEARCH-PROMPT-themed-mmo-commerce-bolt.md)  
Download: **`WOF_ThemedMMO_Commerce_Dump.md`**
