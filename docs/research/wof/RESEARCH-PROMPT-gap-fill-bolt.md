# WOF — bolt.new gap-fill prompt

Paste the block below into bolt.new (or any coding agent). It must write **one downloadable markdown file**. After it finishes, download `WOF_Gap_Fill_Dump.md` and drop it in this chat (or into `docs/research/wof/pasted/`).

Do not implement live SynapticGM from that dump.

---

```
You are filling GAPS for WOF (World of Fantasy), a later-release text MMO. This is NOT the live game SynapticGM. Do not write app/production code. Do not import licensed settings (no Warcraft, Pokémon, Palworld, Middle-earth, etc.).

FILE OUTPUT (mandatory — bolt.new)
1. Create a NEW file at the project root named exactly: WOF_Gap_Fill_Dump.md
2. Put the ENTIRE dump in that file (not only in chat).
3. When done, tell the user: "Download WOF_Gap_Fill_Dump.md from the bolt.new file tree."
4. Do not split across multiple files. One markdown file only.
5. If you previously wrote WOF_Multiplayer_Design_Dump.md, MERGE any missing schemas into THIS file so nothing is only in chat.

LOCKED (do not reopen or contradict)
- Code owns dice, HP, loot, seeds, lockouts, gold, deeds, listings. LLM narrates only; must not invert the ledger.
- Stop gate passed. Raids IN. Mode B (N personal combat beats) OUT. Mode D OUT.
- Dungeon narration: Mode A (one shared paragraph + code recap). Raid narration: recommend A or C but mark as John's later call.
- First ship: Tier 3 — shared hubs + instanced combat. Strangers never merge into one fight.
- Idle hub: 0 LLM unless that player acts.
- World + chat = wall clock. Combat = lockstep rounds (NOT twitch+LLM).
- Two fight run modes: (1) manual: everyone submits, server resolves that full round, repeat; (2) plan-auto: BattlePlan fills actions, same resolver, pause on phase/adds/interrupt/ally-down/Stop.
- Raid size 10. Weekly lockout. Friends-only finder first, public later. Hub NPCs durable (players cannot kill town NPCs for everyone).
- Never sell combat outcomes or lockout skips. Monetize capacity/cosmetics only.
- Working names only: Ash Compact, Tide Covenant, Hearthborn, Millcross, Reedfen, Ash Seat, Tidehold, Millstone Hollow.

WHAT TO FILL (the gaps)
Write complete TypeScript-like interfaces and copy/avoid notes. Be specific enough to implement later without another dump.

## 1) Instance + combat schemas (full fields, types, invariants)
- PartyInstance (dungeon|raid, shared seed, parallel parties = same template different seeds)
- EncounterLedger (round, phase, hp, ready, timeout, runMode manual|auto)
- BattlePlan (per player defaults, marks, phaseOverrides, pauseOn)
- RaidEncounterScript, Phase, RoleFlag (soak, cleanse, interrupt — original names only)
- Join/wipe/loot rules (join lock, checkpoint vs entrance, loot: personal vs need-greed vs leader — pick v1)
- Disconnect = Hold (manual) or last plan (auto)
- One runMode per instance at a time

## 2) Toy raid: Millstone Hollow
Full 3-phase script: hpPctTrigger, addSpawns, soakCheck, interruptWindow, enrageRound. Original mechanics only.

## 3) Sync payload
What each client subscribes to (round, ready[], timeoutEndsAt, hp, recap table, narrationId). Late prose MUST carry roundId and must not rewrite HP.

## 4) Housing / business / background world
Live already has WorldDeal (cut, risk, runs/week) and WorldHolding (shop/camp/guild/town). EXTEND, do not replace.
- Server clock + capped catch-up + login mail digest (no 14-week novel). Recommend tick model.
- Deed (buy vs build, placeId, interior instance, upkeep, guests friends-only, no chest-steal v1, seize after N unpaid weeks)
- Personal-copy merchant deals (100 players must not drain one NPC treasury)
- Player shop stock as item ids
- AuctionListing: region AH (Ash Seat / Tidehold), escrow, tax, expire, mail, buyout-only vs bids — pick v1
- What is background (digest) vs on-screen

## 5) Who hosts / who pays LLM
Options table: authoritative server vs host-player ledger; per-player turn budget vs host-pays. Recommend one. Do not copy Friends & Fables host-pays-all as default without stating the downside.

## 6) Failure modes + John's remaining calls
At least: LLM inverted kill; auto-run through interrupt window; gold explosion on AFK catch-up; one miller drained; AH without escrow; hub combat merge; licensed names.
List decisions still for John (max 8), excluding the locked list above.

RULES
- Public/citable patterns only (Evennia combat handler, StoryNexus Place vs Setting, classic AH/housing as pattern).
- Mark speculation.
- No 25/40-player raids.
- No live SynapticGM code changes.
```
