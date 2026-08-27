# Pack 25 — Manus branch (3) WOF / multi-title MMO ingest (2026-08-17)

**Source:** nested archive `04_WOF_future_titles/` + `05_supporting_research/multiplayer_live_service_research.*` from branch (3) zip.  
**Verbatim paste:** [`pasted/manus-branch3-mmo-2026-08-17/`](./pasted/manus-branch3-mmo-2026-08-17/)  
**Related:** [pack-24-part0-multi-title-ingest-2026-08-17.md](./pack-24-part0-multi-title-ingest-2026-08-17.md), [pasted/gloamwild-zip-2026-08-17/](./pasted/gloamwild-zip-2026-08-17/)  
**Status:** research only. **Not live SynapticGM.** Do not import into `src/`, live `supabase/`, prompts, settings, or saves.

## Files in this paste

| File | Role |
|---|---|
| `WOF_quarantined_multi_title_mmo_blueprint.md` | Prompt-2 style operating model: title family, shared `platform/`, 36-month roadmap, networking, content waves, anti-P2W, live ops |
| `multiplayer_live_service_research.json` | Raw web-research bundle (networking / live-service queries) |
| `multiplayer_live_service_research.csv` | Same as CSV |

## Keep (aligns with WOF locks)

- Quarantine from live SynapticGM.  
- SP first → private co-op → limited online; do not market “MMO” early.  
- Shared services = **protocol**, not shared balance / cross-title inventory.  
- Premium never buys power, catch rate, raid clears, quest completion.  
- Auction / housing / public trade late with go/no-go gates.  
- Kill switches for instances, chat, trade, auction, rewards.

## Dump errors — do not adopt (same class as pack-24)

1. **Ember Crown / Pactbeasts / Deepgate / Salt Ledger / Sunloom / Lantern Run** are dump title inventions. Frozen working names stay: factions **Ash Compact**, **Tide Covenant**; races **Hearthborn**, **Lanternfolk**, **Saltkin**, **Stonevein**; starts **Reedfen**, **Lampwood**, **Brinewatch**, **Granite Stair**.  
2. Do **not** use race/faction names as region names.  
3. **Gloamwild / Pactbeasts collector combat** is not the current isolated `wof/` engine model (HP-check instances, no creature-collect as core combat) — quarantine alternate fantasy only.  
4. `platform/` beside `wof/` must never become a live SynapticGM import path.  
5. Treat multiplayer research JSON as **evidence notes**, not a build mandate.

## What to do in the WOF project chat

Point that chat at:

1. This pack-25  
2. `pasted/manus-branch3-mmo-2026-08-17/WOF_quarantined_multi_title_mmo_blueprint.md`  
3. `pasted/gloamwild-zip-2026-08-17/` (content tables — quarantine)  
4. pack-24 corrections (name/faction/region fence)

Ask it to: merge roadmap with existing pack-09/15/18 locks; remap dump titles onto frozen WOF names; never touch live `src/`.
