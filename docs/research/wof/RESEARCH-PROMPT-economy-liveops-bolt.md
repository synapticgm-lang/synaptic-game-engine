# WOF — bolt.new economy + live-ops prompt

Paste into bolt.new. Download **`WOF_EconomyLiveOps_Dump.md`**. Drop it in this chat or `docs/research/wof/pasted/`.

---

```
You are doing design research for WOF (World of Fantasy), a later-release text MMO. NOT live SynapticGM. No production code. Original names only in WOF examples. Name real games as SOURCES for systems.

FILE OUTPUT
1. One file: WOF_EconomyLiveOps_Dump.md
2. Tell the user to download it from the bolt.new file tree.

LOCKED
- AH v1 buyout-only + escrow. Region AH (Ash Seat / Tidehold). Personal merchant deals (copies, not one shared NPC purse).
- Housing bought deeds v1; upkeep/seize is a John call (2/3/4 weeks). Tax is a John call (0/5/10%).
- Weekly per-character per-boss lockout. Never sell lockout skips or power packs.
- Server clock ticks independently of player turns (MMO hole vs live solo). Catch-up cap is a John call.
- Code owns gold, listings, deeds. LLM never mints currency.

ALREADY DONE
Schemas for AuctionListing, Deed, PersonalMerchantDeal, ServerClock. Do not redo those shapes — DESIGN the loops.

FILL

## 1) Gold sources vs sinks
Table: source | sink | who exploits if unbalanced.
Patterns: WoW repair/AH cut, EVE taxes, Albion, KoL meat sinks, Fallen London Echo sinks, MUD shops. Copy jobs.
WOF v1 recommended sinks (repairs, AH cut, housing upkeep, travel, cosmetics token separate from gold).

## 2) Crafting → shop → AH
Profession gather in Place → recipe → PlayerShopStock → optional AH.
Personal deals so 100 players do not drain one miller.
Anti-AFK: catch-up production already capped in go-live dump — restated, then ADD: daily craft cap? energy? none?

## 3) Inflation & bots
What kills text-MMO economies (dupes, LLM-granted gold, unsinkable raid gold, real-money AH).
Mitigations at product level (no exploit steps): ledger mint points, no LLM gold, escrow, bind-on-pickup vs trade, daily caps.

## 4) Live ops calendar
Weekly lockout reset (Tuesday-style — job not IP).
What a “week” contains for raiders vs cozy vs collectors.
Seasonal events: festival in Hearth Season vs Millstone Hollow week. Authored, not LLM-invented holidays.

## 5) Patch / hotfix
How FFXIV/WoW/EVE/MUD admins ship numbers without rewriting the bible.
WOF: catalog version, talent node hotfix, quest disable flag. LLM prompt version vs world-pack version.

## 6) Empty AH at launch
How small games fake or seed an economy without NPC-undercutting players forever.
Starter vendor (personal deals) vs seed listings vs “AH opens week 2”.

## 7) Cosmetics vs power
Restate: cosmetics OK; random power not OK. How games blur this (avoid).
Token vs gold: two wallets?

## 8) John's calls (max 8)
Include leftover: tick 15/30/60; catch-up 7/14/30; unified vs split AH; tax; seize weeks; free daily LLM tokens.
New: two wallets yes/no; seed AH yes/no; daily craft cap yes/no.

RULES
- Mark speculation. No licensed item names. No live SynapticGM changes.
```
