# WOF Pack 16 — Go-live systems map + remaining research

**Project:** WOF later release. Do not implement into live SynapticGM.  
**Point:** One checklist for *everything* a world needs to go live, including skins that are not D&D.  
**Dump ingested:** [pasted/WOF_GoLive_Systems_Dump.md](./pasted/WOF_GoLive_Systems_Dump.md) (15 Aug 2026). Do not re-run the go-live prompt unless John asks.

---

## Layers (do not mix)

| Layer | Who owns it | Example |
|-------|-------------|---------|
| **Engine** | Code | Place graph, EncounterLedger, clock, AH, memory stores |
| **Rules module** | Code flags per skin | `hp_check` vs `bond_type` vs `cozy_tick` (Pack 15) |
| **World pack** | Authored data | Races, places, quest DAGs, bestiary, talent trees, housing recipes |
| **Player** | Per-character | XP, collection progress, deeds, pins — not the shared catalog |
| **Creator** | World builder later | Same world-pack schema; cannot edit engine math |

LLM never owns catalogs, trees, or collection lists. It narrates.

---

## Already researched (do not re-dump)

Combat instances, lockstep, plan-auto, Millstone Hollow, sync, housing *deed* + AH + personal deals + tick/catch-up (gap-fill dump). Skins + audience modules (Packs 10, 15). Billing caution (Pack 14). Solo memory method (live Pack 6) — **extend**, don’t restart.

---

## Dump ingested — gaps A–G filled

Full schemas live in the dump. Do not duplicate here.

| Topic | Dump v1 pick |
|-------|----------------|
| Memory | 4 stores; ~2k prompt; 1 pin; catalog lookup max 10; never full bestiary |
| Catalogs | Shared templates; seed ± bands; collection = seen/caught only |
| Quests | Code completes (place/item/ledger/rep); LLM dialogue only |
| Talents | Code nodes; no pay-to-unlock; respec free + cooldown (John) |
| Housing build | v2 recipes; catch-up production capped |
| World builder | Same pack schema; validator; licensed-name fail; UGC Roblox-scale = v3 |
| Ash Compact | Full MMO: 5-man + 10-man raid |
| Bonded Menagerie | Collection; raids N/A |
| Hearth Season | No raids/dungeons; recipe book; AH optional |
| Circuit Arc / Starwake | **Name clash with Pack 15** — dump: Circuit Arc = sci-fi, Starwake = idol/school. Pack 15: Circuit Arc = shonen, Starwake = space. Reconcile before content bible. |

### Still for John (dump §9B)

1. Pins per prompt: 1 vs 2  
2. Quest minTurnGap: 2 / 3 / 5  
3. Talent respec cooldown: 12h / 24h / 7d  
4. Hearth Season AH at v1?  
5. Creator invite pool size (v2)  
6. Starwake big instance: 5 vs 3  
7. Collection trading: friends-only vs open  
8. Creator revenue share (v3)  

Plus leftover from gap-fill: tick length, catch-up days, AH unified vs split, tax, seize weeks, raid Mode A vs C, free token budget.

---

## Official world go-live checklist (every skin)

A world is **not** live-ready until:

1. Original bible + licensed-name ban-list + maturity tag  
2. `rulesModuleId` + ledger fields documented  
3. Place graph: 4 starts or equivalent hubs + 2 capitals (or cozy equivalent)  
4. Race kits (or class/role kits if no races)  
5. Quest DAGs: race + profession + 1 zone story  
6. Talent tree defs (or cozy recipe book)  
7. Shared catalog: species/items/cards + stat bands  
8. One 5-man instance + one “big” instance (raid, finals, concert, or festival) — or N/A for cozy  
9. Housing recipes or “no housing” flag  
10. Economy: deals + AH region or “cozy shop only”  
11. Memory: catalog IDs + player summary schema  
12. Chat/cosmetics optional; Kid Mode if all-ages  
13. Token/budget policy (per-player, Pack 14)  
14. QA: ledger vs prose; no licensed names in GM output  

Do not re-run `RESEARCH-PROMPT-golive-systems-bolt.md` unless John asks.
