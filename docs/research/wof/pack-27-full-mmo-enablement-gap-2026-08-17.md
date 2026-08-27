# Pack 27 — What is still needed for a full text MMO (not more world novels)

**WOF later.** Not live SynapticGM. Do not import into `src/` / `supabase/`.

Manus branch (4) filled **authored world packs** (maps, NPCs, quests, talk, loot tables in markdown). That is **not** a running MMO. The gap now is **engine + typed data + objects**, not another 23 setting bibles.

Honest copy until the server exists: solo / private co-op / limited online region — not “MMO.”

---

## Direct answer

| Question | Answer |
|----------|--------|
| More Manus worlds? | **No** for the 23 titles. Fill Badge Circuit later if you want equal depth. |
| More lore/quests? | Only **id-merge** Ash Compact vs `wof/` code, plus housing interiors when housing ships. |
| Buildings / objects? | Yes as **data**, not 3D. A text MMO building is a Place + interactable props. We do not have a furniture/vendor-stock/housing-recipe catalog in code. |
| What actually enables the MMO? | Authoritative server, instances, inventory ledger, presence, mail, clock, then converting packs into `ZoneSlice` TypeScript. |

`wof/` today: local selftest, `hp_check` only, Ash Compact four starts, memory stubs. No network, no housing, no AH, no talk-tree runner, no other rules modules.

---

## A. Systems to code (blocks “full MMO”)

Research exists (packs 9–22). Code does not.

1. **Accounts / session / character lock** — signed session; one character write owner.  
2. **Instance placement** — party 2–5, raid 10, join tokens, reconnect, **no mid-combat fill**.  
3. **Lockstep combat net** — one spend per player per round; Mode C raid later.  
4. **Authoritative inventory** — idempotent grants, personal loot, durability/repair.  
5. **Presence** — nearby count + races only; no stranger LLM chat.  
6. **Tell / party chat** — canned hub say; report/mute/block. No global chat v1.  
7. **Mail digest** — login recap; weekly clock catch-up cap.  
8. **Server week clock** — world ticks while logged off; LLM does not mint gold.  
9. **Deeds / housing** — interior = instanced Place graph; friends guests; no chest steal v1.  
10. **AH buyout + escrow** — late gate after ledger.  
11. **Vendors** — buy/sell from item tables; NPC stock caps if shared hub.  
12. **Talk / choice runner** — premade trees + grounded buttons from pack data.  
13. **Rules modules** — `bond_type`, `ship_board`, `frame_heat`, `score_set`, `steadfast`, `card_lane`, `cozy_tick`, `realm_gate`, `heat_wanted` (only `hp_check` exists).  
14. **LLM budget + kill switches** — per-player cap; instances/chat/trade/rewards.  
15. **Moderation / Kid Mode** — age surface; no public DMs/trade/voice for kids.  
16. **Theme Kit apply** — UI labels, dice, voice, 1 loop from pack 26 table.  
17. **World unlock entitlements** — Ash Compact included; others buy-and-own.

Without 1–6 you do not have multiplayer. Without 8–11 you do not have a living hub. Without 12–13 the Manus packs cannot play.

---

## B. Object / building content still to author (data, not 3D)

A mill, house, or stall is: `placeId`, exits, `interactable[]`, vendor list, optional `interiorDungeonId`. No meshes.

Still missing as **reusable catalogs** (one shared, skins swap names):

| Catalog | Why |
|---------|-----|
| Interactable props | doors, chests (personal), mill wheel, wick line, dock post, workbench |
| Furniture / housing kits | bed, chest, table, window, ranch stall, ship berth — cosmetic + a few functional |
| Build recipes | plot + materials + clock ticks → deed interior rooms |
| Vendor stock lists | per hub merchant; repair kits; no power packs |
| Canned say/emote set | hub presence without LLM |
| Mail templates | weekly digest, lockout, upkeep warning |
| Talent node tables | pack 26 has prose trees — need `{id, cost, requires, effect}` in code |
| Drop tables | pack 26 has % in markdown — need typed loot rolls |
| Interior graphs | 4–8 rooms per house/shop/ranch; not a second overworld |

Do **not** generate a unique 3D asset per building. Do generate **ids + verbs** (open, repair, rest, tend, list-on-AH).

Optional later Manus fill: **one** file `WOF_Object_And_Housing_Catalog.md` (shared props + per-world rename table). Not 23 more novels.

---

## C. Convert existing packs (highest content leverage)

1. Diff Ash Compact markdown vs `wof/src/packs/zones/` — keep locked quest ids; add Divide walk, capitals, extra beats.  
2. Rename dump flags (Gloam Court, saltwind_keeper).  
3. Parse talk trees + choice buttons into JSON/TS.  
4. Stub `bond_type` + Bonded Menagerie fauna (64).  
5. Leave other 21 worlds as data-on-disk until Ash Compact co-op works.

---

## D. Explicitly not needed now

- Another full world-generation prompt  
- Contested open-world PvP (Tier 4 deferred)  
- Guild bank, auction, housing as launch blockers for **friends alpha** (Reedfen loop + solo 5-man)  
- Cross-title inventory  
- Live SynapticGM import  
- 3D buildings, navmeshes, collision  
- Voice as a launch dependency  

Friends-alpha bar (pack 18): one start loop, solo 5-man, presence list, no AH/housing/raid.

---

## Build order if coding

1. Typed pack loader (places, items, quests, talk, choices, interactables).  
2. Ash Compact merge + object catalog.  
3. Local SP playable (already closest).  
4. Invite 2–4 instance server.  
5. Clock + mail.  
6. Housing interiors + vendors.  
7. AH.  
8. Second world (`bond_type`).
