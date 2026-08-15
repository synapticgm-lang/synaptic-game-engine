# WOF Pack 12 — Real time vs group sync

**Project:** WOF later release. Do not implement into live SynapticGM.  
**Point:** Text can be real-time. LLM combat cannot be twitch. Split the clocks.

MUDs have run real-time text worlds for decades. That is not the blocker. The blocker is putting a 2–8s model call on every swing for 10 people.

---

## Four clocks (not one “real time” switch)

| Layer | Clock | WOF later |
|-------|--------|-----------|
| **World** | Wall clock (server week/day) | **Real time** — deals, AH, upkeep, hostiles (Pack 11) |
| **Social** | Wall clock | **Real time** — chat, who is in Millcross, traces |
| **Group instance** | Synced rounds | **Lockstep** — dungeon/raid EncounterLedger |
| **Narration** | Behind truth | Ledger first; Mode A/C prose may arrive a beat later |

Live SynapticGM is only the last two, and only solo, and only when you send a turn. WOF later adds the first two.

---

## What “real time” means here

**Yes:** the world keeps moving while you cook dinner. Listings sell. Rent comes due. Friends appear in a hub. Chat is live.

**No (v1 combat):** type `attack` and the model writes a novel before the next person can act. That is twitch + LLM and it will desync groups.

**Yes (combat, if Mode C):** code resolves hits on a short server tick or on a round timer **without** waiting for prose. Recap table is truth. Optional paragraph follows.

Pack 9 dump rejected “real-time MUD combat” in the sense of **LLM-in-the-loop twitch**. That still stands. Wall-clock world + synced group fights is the intended hybrid.

---

## Group sync (required)

One EncounterLedger. Everyone in the instance is on the **same round index**. No per-player combat time.

| Mode | How it syncs | Use |
|------|----------------|-----|
| **Ready-check** | Round resolves when all have submitted, or on timeout | Default dungeon/raid (already locked) |
| **Timeout hold** | Missing player = Hold action; round still fires | AFK so 9 others are not stuck |
| **Leader pace** | Leader may force resolve after timeout | Optional raid flag |
| **Realtime GCD** | Server tick every N seconds, no LLM | Only if Mode C and John later wants twitch numbers |

v1 = ready-check + timeout hold. Same handler for 5-man and 10-man.

Disconnect: character stays in instance, auto-Hold, can rejoin same round index. Kick after N missed rounds (John later).

Chat in instance is real-time and does **not** advance the round.

---

## Sync payload (code)

Each client subscribes to `instanceId`:

- `round`, `phaseId`, `ready[]`, `timeoutEndsAt` (wall clock)
- `hp{}` from ledger
- last recap table
- optional `narrationId` when Mode A/C text is ready

Late narration must not rewrite HP. If prose arrives after the next round started, it still describes the **old** round id.

---

## Failure modes

1. Waiting on 10 LLM calls before the round can end  
2. One player’s slow model blocking the party (solve: ledger first, prose async)  
3. Two clocks for combat (player A in round 4, player B in round 5)  
4. Treating hub chat as a combat turn  
5. Live-game turn loop copied into WOF group instances
