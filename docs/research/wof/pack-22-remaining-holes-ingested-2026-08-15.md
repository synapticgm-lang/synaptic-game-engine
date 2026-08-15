# WOF Pack 22 — Remaining holes (ingested)

**Project:** WOF later release. Do not implement into live SynapticGM.  
**Status:** Remaining-holes dump ingested 15 Aug 2026. This page is v1 picks + dump errors + remaining John calls.  
**Full dump:** [pasted/WOF_RemainingHoles_Dump.md](./pasted/WOF_RemainingHoles_Dump.md)

Do not re-run `RESEARCH-PROMPT-remaining-holes-bolt.md`.

---

## Dump v1 picks (speculative until John locks)

| Topic | Dump pick |
|-------|-----------|
| Turn spend | Hub beat = 1 (that player). Tell/chat/AH/mail/idle = **0**. Round **resolves** = spend, not when you tap a chip |
| Lockstep Mode A | **1 turn per player per round** (personalized prose). Not host-pays |
| Raid Mode C | **0.5 turn/player/round** (shared prose, cost split) — speculative |
| Plan-auto | Same turn cost as manual |
| Free vs 5-man | Solo Lampwood Gate **tight yes** (12–18). Party 5-man **maybe 2 sessions** |
| Raid | **Mid+ only.** Free cannot finish Mode A or C in one day |
| WOF vs live SGM | **Two clients, one account.** Shared friends. **Separate** subs, gold, chrome shops. No save import. No Isekai Gate / Ash Compact inside live |
| Raid on phone | **Keep.** Compact 10 rows, no portraits, Stop stays put, no mid-combat fill |
| Death | Downed in fight; wipe → checkpoint. **No permadeath v1.** No corpse run |
| Durability | Wipe −10% all equipped; combat −1%/round weapon+armor; broken = 0 stats, repairable |
| Inn rest | Free HP/STA in hub (1 turn); does not repair |
| Kid Mode turns | **10/day** capped free (same model quality). Parent may **share** from their pool |
| Week 2 solo | Daily loop + solo 5-man + collection + invite link. **No** NPC parties / duty bots v1 |
| Public LFG | v2 listing board, **no** global chat |
| Push default | **Essential only** (party invite, system). Quiet hours. Never notify others’ combat |
| Theme Kit audio | 1 ambient loop + combat/UI SFX in kit; extra music is shop |
| Language | **English v1** |
| Eval | Hybrid: CI ban-list/place probes + human on major model swaps |
| Mid-combat fill | **No** v1. DC follows last plan / Hold. Fill only at checkpoint |

---

## Dump errors / clashes (do not lock)

| Dump said | Keep |
|-----------|------|
| Hollow Term in Kid Mode mature lock | Pack 10: **magic school**. Mature = Veil Watch, Night Charter, Gridrun (teen+), Blackwake. Halo Term = powers school (Pack 15), not horror |
| 0.5 turns | Fine as a cost model; implement as **even-round billing** or milliturns so `spent` stays integer |
| Mode A “up to 5 LLM calls per round” vs earlier “split shared Mode A” | This dump: dungeons = **per-player prose** (not split). Only Mode C raid is split. Align Pack 9 “split shared Mode A” to **raid Mode C**, not 5-man |

---

## Still for John

1. Turn cost: 1 / 0.5 / other  
2. Free party 5-man: 2 sessions OK vs raise free to 20  
3. Raid Mid+ only: yes / no  
4. Two clients vs world picker in one app  
5. Mid-combat fill: no / yes  
6. Kid turns: 10 + optional share / other  
7. Push default: essential / all off  
8. Music in Theme Kit: yes / shop only  
9. English-only v1  
10. Eval: CI / human / hybrid  

---

## What the dump is good for

TurnLedger + spend reasons. Phone raid frames. FamilyPlan. Death/durability/repair. Week-2 solo loop. Ops incident table + Stormwind eval checklist. MailDigest → push types. Tech: combat still resolves if the writer is slow.

Research for the *idea* is complete enough to stop dumping unless John opens a build wave or wants one of the leftover calls locked.
