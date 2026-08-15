# WOF Pack 11 — Housing, business, auction, background world

**Project:** WOF later release. Do not implement into live SynapticGM.  
**Status:** Gap list + research prompt. Whole chat = future.

Live already has a **turn-tied** world sim (method only — do not port as WOF into live): deals with a cut, holdings (shop/camp/guild/town), caravans, hostiles, actors, weekly resolve, hidden events. Clock comment in live: *advances on player turns — not while the app is closed.* That is the hole for “the world runs without you.”

---

## Have vs need

| Feature | Live method (exists) | WOF later still needs |
|---------|----------------------|------------------------|
| Merchant **deal** (player cut, risk, runs/week) | `WorldDeal` | Shared NPC capacity (100 players vs one miller); offline payout |
| **Business** / shop / camp | `WorldHolding` + orders | Player-founded vs NPC; staff; heat vs other players |
| Caravans | `TradeCaravan` | Same, on a **server** clock |
| NPCs / hostiles progressing | `WorldActor` / `WorldHostile` | Tick when **nobody** is logged in |
| Calendar | `WorldClock` day/week | **Server tick + catch-up** on login (no 14-week novel) |
| **Home / house / base** | Camp holding only | Deed + Place + interior instance + upkeep + guests |
| **Auction house** | No | Listings, escrow, tax, mail, stacks, expire |
| Plot / land scarcity | No | How many houses per Millcross in text |
| Player-to-player shop | No | Stall vs AH vs visit-my-house |

---

## Authority (same as combat)

Code owns gold, deeds, listings, weekly rolls, lockouts. LLM narrates a **short** weekly mail / System recap. Do not let the model invent rent, sales, or who owns a house.

---

## Questions to answer (this is the remaining intel)

### 11a — Server clock + catch-up (P0)

Live ticks only when the player takes a turn. MMO background world needs a clock that advances anyway.

1. Who ticks: authoritative server job (e.g. weekly cron) vs catch-up on login (`weeksMissed = floor((now - lastSeen) / weekLength)`)?
2. Cap catch-up weeks (e.g. max 4) so a 6-month AFK does not explode gold or events.
3. Mail vs scene: one System digest on login, not 28 GM paragraphs.
4. Hidden events: queue on the **world** ledger, reveal when the player is in that Place (already a live pattern).
5. Skin flag: same clock for Ash Compact, Bonded Menagerie ranch, Blackwake ship berth.

**Need:** one tick model. Recommend **server week + capped catch-up + mail digest**.

### 11b — Housing / base (P0)

1. Buy existing vs build (plot + materials + time on the clock).
2. Deed: `placeId`, owner, upkeep/week, guest list, interior instance id.
3. Interior = instanced Place (like a dungeon node graph), not a shared street tile.
4. Guests: friends-only first (matches Pack 9 finder). Grief: can they steal from chests? Default **no**.
5. One primary home + optional shop stall / ranch / ship berth as extra holdings.
6. Destroy/abandon: code, not LLM. Unpaid upkeep → lockout then NPC seize after N weeks.
7. Text map: street pin “your house” like other pins (Pack 4 method).

**Need:** `Deed` schema + upkeep + guest rule.

### 11c — Businesses and deals (P0)

Extend live `WorldDeal` / `WorldHolding`; do not invent a second economy.

1. Player shop: holding `kind: shop` + `placeId` + stock list (code items) + order (profit/jobs/expand/defend).
2. Cut deals: NPC or player partner; `playerShare`; resolve on **server week**.
3. Same NPC, many players: **personal deal copies** (each player has their own contract with “Miller Rowan”) vs one shared miller treasury. Recommend **personal copies** at v1 so 100 cuts do not drain one NPC.
4. Staff / workEthic already exist — keep.
5. Heat: PvE tax/theft events, not player ganking (hub NPCs durable — John’s call).
6. Bonded Menagerie: ranch is a holding that ticks creatures. Gridrun: corp stall. Blackwake: berth. Same schema, skin labels.

**Need:** confirm personal-copy deals; stock as item ids not LLM lists.

### 11d — Auction house (P1)

Not in live. Public pattern: listing + escrow + tax + expire + mail.

1. Scope v1: **region AH** (Ash Seat / Tidehold) not every village.
2. List: item id + qty + buyout (no bid wars at v1 unless cheap).
3. Escrow: item leaves bag into listing; gold escrow on buy; tax % to nowhere or faction.
4. Offline: buy/sell complete on server; seller gets mail + gold on catch-up.
5. Caps: listings per player; min duration; max duration (1 week).
6. No LLM in the trade path. System chrome only.
7. Friends-first: AH can still be **server-wide listings** while grouping stays friends-only (AH is not a party).

**Need:** `AuctionListing` schema; buyout-only v1 vs bids.

### 11e — What the player sees vs background

1. In front: current Place, bag, deed pin, open listings they search.
2. Background: deals, holdings, AH, hostiles, caravans — **numbers in mail/journal**, not a live sim movie.
3. Visit a holding: `reportsForVisit` pattern already exists in live — reuse as method.

---

## Do not re-research

- Whether cuts/deals/holdings are a good idea (live already proved the data model)
- MMO presence / dungeons / raids (Pack 9 done)
- Licensed AH UI names or that one famous auction-house IP

---

## Copy-paste research prompt (optional)

Use only if John wants a dump. Save reply to `docs/research/wof/pasted/`.

```
Research for WOF (later-release text MMO). Not the live game. No production code. No licensed settings.

We already have (method): WorldDeal (player cut, risk, runs/week), WorldHolding (shop/camp/guild/town + orders), caravans, hostiles, actors, weekly resolve, hidden events. Clock today advances only on player turns.

Need how to add, in CODE not LLM:
1) Server/world clock + capped catch-up + login mail digest
2) Housing deeds (buy/build, interior instance, upkeep, guests, seize)
3) Player businesses + merchant cut deals when many players exist (personal contract copies vs shared NPC treasury)
4) Auction house (listings, escrow, tax, expire, mail). Recommend buyout-only vs bids for v1.
5) What stays background (digest) vs on-screen.

Output: IP check; copy/avoid table (text MMOs, Fallen London/StoryNexus clocks, classic MMO AH/housing as PATTERN only); schemas Deed, AuctionListing, server TickJob; catch-up cap; failure modes (gold explosion, LLM invents a sale, one miller drained by 100 cuts, AH scams); WOF bar; max 6 decisions for John.

Do not clone licensed auction/housing products. Do not tick the live SynapticGM clock.
```
