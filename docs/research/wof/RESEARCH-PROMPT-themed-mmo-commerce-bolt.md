# WOF — bolt.new themed-MMO commerce + HUD + module maths prompt

Paste into bolt.new. Download **`WOF_ThemedMMO_Commerce_Dump.md`**. Drop it in this chat.

Do not re-run playable-start, gap-fill, or go-live.

---

```
You are doing design research for WOF (World of Fantasy), a later-release text MMO PLATFORM with many themed worlds. NOT live SynapticGM. No production code.

IP: genre PATTERNS only. No licensed names as WOF content. You MAY name real games as SOURCES (Roblox, Fortnite, D&D Beyond, Hidden Door, F&F, NovelAI, AI Dungeon, FFXIV, WoW, Pokémon-pattern collection UI, Stardew, Steam DLC, Apple IAP).

FILE OUTPUT (mandatory)
1. Create ONE new file at project root: WOF_ThemedMMO_Commerce_Dump.md
2. Entire dump in that file, not only chat.
3. Tell the user: "Download WOF_ThemedMMO_Commerce_Dump.md from the bolt.new file tree."
4. Do not split files.

LOCKED
- Code owns math. LLM narrates. Never sell combat outcomes, lockout skips, loot luck, or random POWER packs.
- Kid Mode: no IAP/ads. Mature worlds stay locked in Kid Mode even if the account owns them.
- One engine; each world is a skin + rulesModuleId. Name freeze: Circuit Arc = shonen; Starwake = space; Stage Light = idol.
- Public v1 = Ash Compact only. Other worlds later.
- Two wallets recommended: gold (gameplay) vs cosmetic tokens (never mix).
- Subscription should meter CAPACITY (turns/TTS/queue), not story quality, not dice odds.
- Per-player LLM budget. Authoritative server.
- Working worlds: Ash Compact, Bonded Menagerie, Circuit Arc, Hearth Season, Stage Light, Starwake, Halo Term, Quarry Pact, Lanceyard, Veil Watch, Card Vein, Route Lantern, Hollow Term, Gridrun, Blackwake.

PRODUCT SPLIT (do not merge)
A) Capacity = subscription
B) World = buy-and-own DLC (themed MMO)
C) Chrome = UI/dice skins/voices/frames (cosmetic only)

RECOMMENDED UNTIL RESEARCH ARGUES OTHERWISE
- Ash Compact is the included platform world (still uses the turn budget).
- Other worlds are one-time unlocks, not buried inside “Legend tier.”
- Buying a world INCLUDES a Theme Kit: UI chrome + 1 dice skin + 1 voice + default clothes/bubble.
- Extra dice/voices/fashion stay à la carte.
- Live SynapticGM cosmetic catalog is a different shop.

FILL

## 1) Competitor JOB table (≥10)
Columns: source | COPY | AVOID | WOF pick.
Must cover: Steam DLC worlds, Roblox paid experiences vs cosmetics, D&D Beyond dice vs book marketplace, Hidden Door extra worlds, F&F host-pays, NovelAI capacity tiers, Fortnite battle pass (cosmetics not power), FFXIV expansions (buy the world, sub to play).

## 2) Plan matrix
Rows: Free / Mid sub / High sub / one-time World DLC / All-Worlds pass (optional SKU) / à la carte chrome.
Columns: Ash Compact access, extra world access, daily turns, Theme Kit, extra dice/voices, Kid Mode, what is NEVER sold.
Mark speculation. USD bands from public analog ($10–20 sub sweet spot; DLC $8–25; dice $2–6).

## 3) Theme Kit per world (table)
For each locked working world above: kit contents (UI name, dice pack name ORIGINAL, voice name ORIGINAL, HUD bars that swap). What is extra shop. Maturity tag.

## 4) Phone screen layouts (wireframe in ASCII or nested lists — not images)
For THREE worlds only (enough to prove the pattern):
- Ash Compact: hub, lockstep fight (HP), journal, paper-doll
- Bonded Menagerie: hub, catch round (bond/loyalty), collection log (seen/caught silhouette)
- Hearth Season: farm/town, cozy tick (no wipe raid chrome), house
Plus one extra: Stage Light concert OR Circuit Arc bracket — pick one.
Shared chrome: phone top tabs, System window AFTER story, presence list with 0 LLM.
What must NOT move (send lock, story-first).

## 5) Module maths one-pagers (formulas, not a second engine)
For: hp_check (already known — 10 lines), bond_type, score_set, cozy_tick, card_lane, frame_heat, realm_gate, bond_heart.
Each: what the ledger stores, what a round resolves, win/lose, what LLM must not invent, solo vs party.
No gacha. Card Vein: collection is seen/owned cards, not sealed power packs.

## 6) Entitlements schema
TypeScript-like: AccountEntitlement, WorldUnlock, ThemeKitGrant, ChromeSku, Wallet (gold vs cosmeticTokens).
Rule: billing services never write EncounterLedger HP/loot.

## 7) Cross-world rules
Can friends in different worlds party? (recommend no instance together).
Can Ash Compact dice overlay Bonded Menagerie? Recommend default + John call.
Character: one character per world vs transferable (recommend not transferable).

## 8) Failure modes (max 12)
World gated behind whale sub; Theme Kit that changes odds; Card Vein loot boxes; Kid Mode IAP; chrome shop mixed with world DLC so players buy the wrong thing; LLM-minted world unlock.

## 9) John's calls (max 10)
Ash Compact free-to-enter vs paid; DLC vs high-sub includes worlds; Theme Kit yes/no; chrome overlay vs world-locked; All-Worlds pass; DLC price band.

RULES
- Original names in WOF examples. Mark speculation. No live SynapticGM patches. No exploit PoCs.
```
