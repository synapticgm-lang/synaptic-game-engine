# WOF Pack 9 — Text multiplayer: party dungeons and raids (2026-08-14)

**Project:** WOF (World of Fantasy) — **not live SynapticGM**. Do not implement.  
**Status:** Research request. This is the intel we still need for a massive text world with other players **inside dungeons and raids**.  
**Depends on:** Pack 8d (overworld presence cap). Do not start raid content until party-dungeon answers exist.  
**IP:** Original encounters only. Copy **methods** from public text-MMO/MUD design, not licensed bosses, raids, or creatures.

Companion canvas: `wof-multiplayer-research.canvas.tsx`.

---

## Do we need this research?

**Yes.** Pack 8d only asks “are other people in the street?” Party dungeons and raids are a different machine:

- Shared **instance** (one seed, N players)
- Shared **combat handler** (code, not LLM)
- **Narration fan-out** (N logs, one truth)
- **LLM cost cliff** as N grows
- Raid = authored **encounter script** + wipe/lockout, not “a bigger dungeon”

Live SynapticGM already has solo `dungeonSeed` + `CombatEncounter`. That must stay solo. WOF needs a **separate** instance model.

---

## Three instance kinds (keep distinct)

| Kind | Players | Seed | Combat | LLM job |
|------|---------|------|--------|---------|
| Solo dungeon | 1 | Per player (live game today) | Solo encounter | Narrate one turn |
| Party dungeon | 2–5 | **One seed for the party** | Shared combat handler | Short personal beat + code round recap |
| Raid | 8–12 first (not 25–40) | One raid instance + lockout | Encounter **state machine** in code | Pull / wipe / loot prose; **minimal or zero** LLM mid-fight |

If research cannot make 8–12 cheap, raid v1 is **out**. Do not design 25-player text raids.

---

## What already exists as *method* (do not port into live)

| Pattern | Public source | Copy / avoid |
|---------|---------------|--------------|
| Combat **handler object** per fight (initiative, timeout, join) | [Evennia turnbattle](https://www.evennia.com/docs/latest/Contribs/Contrib-Turnbattle.html) | **Copy** handler in code. **Avoid** real-time typing races. |
| Simultaneous resolve after everyone picks | [Evennia turn-based combat](https://www.evennia.com/docs/latest/Howtos/Turn-based-Combat-System.html) | **Copy** ready-check → resolve. Fits our turn game. |
| One combat per location vs one per party | Evennia “handler on room” | **Avoid** room-merge of strangers. WOF dungeon = **party instance**. |
| Instanced group PvE (“forays”) | Iron Realms Achaea (pattern: instanced group bosses) | **Copy** instance + group. **Avoid** their classes, curing, world. |
| Group scaling when more players tag | GemStone group hunting (pattern: mobs scale with group size) | **Copy** code scaling. **Avoid** their named grounds. |
| Party co-op, one GM | Friends & Fables ≤6 | **Copy** party size honesty. **Avoid** LLM owning HP/loot. |
| Place vs Setting | StoryNexus | Dungeon/raid = Setting change + new instance id |

**Avoid:** real-time MUD balance/equilibrium combat (LLM cannot keep up); licensed raid encounters; F&F post-process inventory.

---

## Authority rule (proposed — research must confirm)

> One **EncounterLedger** (code) is truth: HP, turn index, phase, seed, loot rolls, lockout.  
> Each player gets a **view**: System recap (numbers from ledger) + optional short GM prose that **must not invert** the ledger.  
> Same Pack 2 rule as live: LLM narrates; code resolves.

```
PartyInstance
  id, kind: dungeon|raid
  partyId, placeId, settingId
  seed (shared)
  lockoutUntil?
  encounter?: EncounterLedger

EncounterLedger
  id, phaseId, round
  combatantIds[] (players + mobs)
  initiative[]
  ready: { playerId: actionId } 
  timeoutSec
  hp: { id: { hp, maxHp } }     // code only
  scriptId                    // authored raid/dungeon script
```

---

## Sub-packs to fill

### 9a — Time model (P0)

**Questions**
1. Ready-check + simultaneous round vs sequential initiative (Evennia 30s timer)?
2. What happens if a player AFKs mid-dungeon / mid-raid?
3. Async play-by-post for overworld OK; for raids? (Likely **no** — raids need a session.)
4. Real-time MUD combat: reject for WOF+LLM unless research proves otherwise.

**Need:** one recommended time model for party dungeon and whether raid uses the **same** handler.

### 9b — Party dungeon instance (P0)

**Questions**
1. Party of 2–5 shares one `dungeonSeed`. Who is leader? Who can pull?
2. Join mid-run: allowed / locked at first combat / locked at enter?
3. Loot: personal / need-greed / leader assign. Code owns rolls (Pack 1 method).
4. Wipe: checkpoint node vs full reset vs corpse-to-entrance.
5. How does the street map show an instance? (Pin = entrance; inside = node graph, Pack 4 method.)
6. Can two parties run the **same** dungeon template with **different** seeds at once? (Should be yes.)

**Need:** schema for `PartyInstance` + loot rule + wipe rule.

### 9c — Combat handler + narration fan-out (P0)

This is the make-or-break for text.

**Questions**
1. Round recap = **code table** (who hit whom, HP) in every client. Confirm.
2. LLM: (A) one shared round paragraph for all, (B) N personal 2-sentence beats, (C) **no LLM during combat** (System only), (D) A+B.
3. Cost: tokens × N × rounds. What is the budget for a 15-round 5-man? for a 25-round 10-man?
4. Spam: MUD room flood vs our log. Cap prose length.
5. Outcome token (live Pack 2) per player action, then one resolve step.

**Need:** pick A/B/C/D per kind (dungeon vs raid). Likely **dungeon = D or B**, **raid = C** (System-only mid-fight).

### 9d — Raid encounter scripts (P1, after 9a–9c)

Raid is not “more HP.” It is an authored **phase graph**.

**Questions**
1. First raid size: 8 vs 10 vs 12. Cap before LLM/UI breaks.
2. Script schema: `phases[] { id, hpPctTrigger, addSpawns, soakCheck, interruptWindow, enrageRound }`.
3. Roles as **code flags** (soak, cleanse, interrupt) — original jobs, not licensed role trinity clones with their names.
4. Wipe, checkpoint, lockout (daily/weekly clock vs per-character).
5. Ready check, marks, leader. Chat vs in-fiction.
6. How much of a 20-round boss is LLM? Recommend **0 mid-combat** unless 9c proves cheap.
7. Adds / wipes / enrage: all code. LLM may narrate phase **announcements** from tokens.

**Need:** one toy raid script (original name, e.g. **Millstone Hollow**) with 3 phases, no licensed mechanics-as-identity.

**Do not research:** 25/40-player raids, licensed raid fights, cinematic 3D telegraphs as a requirement.

### 9e — Matchmaking, sessions, grief (P1)

**Questions**
1. Friends-only party vs public finder?
2. Kick, loot ninja, pull without ready.
3. Cross-faction in The Divide vs instanced-only until Pack 8d says otherwise.
4. Server: who hosts the EncounterLedger (Supabase realtime vs authoritative edge function)?

**Need:** “session” model: WOF is not a 24/7 MUD on day one. **Scheduled raid instance** is allowed.

---

## Failure modes to hunt in dumps

1. LLM invents a kill / heal that the ledger did not apply.  
2. N full GM novels per round → cost and log spam.  
3. Strangers merge into one room combat (Evennia default) in a shared hub.  
4. Raid designed as 25 people because “that’s what big games do.”  
5. Real-time curing/balance combat (unplayable with LLM latency).  
6. Porting live `dungeonSeed` into a shared party without a new instance id.  
7. Licensed encounter clones.

---

## WOF bar (target)

| Slice | Bar |
|-------|-----|
| Party dungeon | 2–5, shared seed, code handler, short prose |
| Raid v1 | 8–12, authored 3-phase script, System-first combat, lockout in code |
| Overworld | Pack 8d — may be traces only while dungeons are instanced |
| Live game | Untouched |

---

## Sources (method only)

- [Evennia turnbattle](https://www.evennia.com/docs/latest/Contribs/Contrib-Turnbattle.html) — combat handler, timeout, turn order  
- [Evennia turn-based combat howto](https://www.evennia.com/docs/latest/Howtos/Turn-based-Combat-System.html) — simultaneous resolve, join, flee  
- Iron Realms group instanced PvE as **pattern** (not their world)  
- GemStone group scaling as **pattern** (not their zones)  
- [F&F How Franz works](https://fables.gg/blog/how-franz-works) — party size; do not copy LLM state updates  
- Live Packs 1–2, 4–5 — loot, code vs LLM, dungeon nodes, quest gates — **method**, do not patch live

---

## Gather order

1. 9a Time model  
2. 9b Party dungeon instance  
3. 9c Combat handler + narration/cost  
4. **Stop if 9c cannot afford 5 players.** Raids wait.  
5. 9d Raid scripts (8–12)  
6. 9e Sessions / grief / host
