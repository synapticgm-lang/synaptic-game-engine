# SynapticGM — Master Improvement Plan

**Compiled:** 14 Aug 2026  
**Sources:** competitor intel + research packs 1–7 + current playtest notes  
**Status:** Planning doc. Implement when John opens the next update wave.

---

## Do we need more research?

**No — enough to build.** Packs 1–7 cover loot, rules/narration, LitRPG expectations, maps, quest authority, long memory, and content mediation.

**Optional later (not blocking):**
- Accessibility / WCAG pass (industry gap; differentiator)
- Merchant HUD vs in-world trader (playtest open decision)
- Affix rolls inside rarity (Pack 1 “later”)
- Semantic embedding vendor choice for Pack 6 retrieve (can start with keyword/location tags)

---

## Already shipped / in code (don’t rebuild)

- Code checks (`checkMath`), Warden, situation packet, dual location sheets  
- Dungeon hidden seed + loot rarity roller (`dungeonSeed`)  
- Story-first / empty-turn retry path  
- Quest reveal flags, scene focus, GM proxy  
- Kid Mode / contentMode filter start  
- Choices + free-text (soft ground)

---

## Priority backlog (recommended build order)

### P0 — Playtest pain (ship first)

| # | Work | Pack / note |
|---|------|-------------|
| 1 | Story → System every answered turn; never System-only / XP-only | Playtest + Pack 3 |
| 2 | Single authority: Place `name` + `dangerTier` + `mapScale` (fix T1/T2/T3 mismatch + “Every Mind”) | Pack 5 + playtest |
| 3 | Outdoor map = street pins/paths; kill bobbing MOVE orbs; dungeon stays node view | Pack 4 + playtest |
| 4 | Protest / “who’s in charge” = talk intent + in-fiction System reply, not physical stub | Pack 3 + playtest |

### P1 — Loot & rules (you already started)

| # | Work | Pack |
|---|------|------|
| 5 | Align `rollLootRarity` weights to Pack 1 tables; T1 Legendary = 0% | 1 |
| 6 | Pity counters + soft pity + System announce | 1 |
| 7 | Non-random: quest/key/story loot; boss first-clear Epic+; run floors | 1 |
| 8 | Outcome **token** object → GM every turn; LLM must not invert | 2 |
| 9 | Hidden-state **pre**-check (trap before open) | 2 |
| 10 | Extend Warden: conditions reflected, no invent, contradict-outcome retry | 2 |

### P2 — First-hour LitRPG feel

| # | Work | Pack |
|---|------|------|
| 11 | Opening beat sheet (Awakening → look → threat → sticky fail → loot → quest → rest → boss) | 3 |
| 12 | Progressive status reveal; first loot Uncommon bias in tutorial | 3 |
| 13 | Tutorial quest by ~turn 8–12; sticky fail by ~turn 8 | 3 |
| 14 | `refuse` intent + code consequence | 3 |

### P3 — Mediation & ratings

| # | Work | Pack |
|---|------|------|
| 15 | Maturity tier + toggles (violence/language/sex/substance/dark) | 7 |
| 16 | Pre-LLM hard blocks (injection, hate, CSAM, self-harm+988, threats) | 7 |
| 17 | Diegetic rewrite confirm (“System interprets…”) | 7 |
| 18 | Post-filter GM output to rating; keep Kid Mode swear-swap | 7 |

### P4 — Map & Place model (deeper)

| # | Work | Pack |
|---|------|------|
| 19 | Place records / upgrade sheets: aliases, loreName, dungeonRef | 4+5 |
| 20 | Micro-dungeon entrance icon → seeded dungeon view | 4 |
| 21 | Quest state machine + min turn gaps (no same-turn complete) | 5 |
| 22 | Context omits hidden quests (harden) | 5 |

### P5 — Long campaigns (after core feels good)

| # | Work | Pack |
|---|------|------|
| 23 | Location arc summaries on exit | 6 |
| 24 | Campaign summary every 50 turns; PC personality line | 6 |
| 25 | NPC relationship summaries; turn summaries every 15 | 6 |
| 26 | Pins (10 player + unlimited auto); consequence threads | 6 |
| 27 | Ordered ~2k context budget (primacy/recency) | 6 |

### Later / defer

- Multiplayer, creator marketplace, revenue share  
- Full Hidden Door card UX rebuild  
- Affix RNG inside rarity  
- Full a11y WCAG documentation pass  
- Merchant: pocket salvage vs hub-only trader  

---

## Cross-cutting product rules (always)

1. **Code owns** dice, HP, rarity, hidden dungeon truth, quest state, inventory.  
2. **LLM narrates** only; no invent tiers/stats/loot rarity/quest titles.  
3. **Story → System chrome → Choices** every turn.  
4. **dangerTier ≠ mapScale** — never one label for both.  
5. **Place is single authority** for name + tiers; quests/map/System *reference*.  
6. **Memory is structured + short prose**, never raw full chat history.  
7. **Rewrites diegetic; hard blocks brief & non-lecture.**  

---

## Suggested next update wave (concrete)

**Shipped in code 14 Aug 2026 (full P0–P5 wave):**

- Pack 1: loot tables + pity + boss first-clear Epic+ + run floors + quest/story/key loot sources
- Place `dangerTier` vs `mapScale`; Place registry + arc summaries
- Outcome tokens; refuse/protest; hard-block + diegetic rewrite confirm + post-filter
- Tutorial beat sheet + progressive status + first-chest Uncommon + tutorial quest
- Maturity tier/toggles in Settings
- Micro-dungeon entrance icons on street map
- Campaign memory: summaries, pins, consequences, ~2k ordered context
- Hidden quests omitted from GM context

**Ops:** Redeploy `gm-turn` after `node scripts/sync-gm-edge-shared.mjs`.

Defer: affix RNG, full a11y WCAG, merchant decision, embedding vendor for semantic retrieve.

---

## Research folder completeness

All of the following are under `docs/research/`:

- Competitor intel (Aug 14)  
- Packs 1–7  
- This master plan + README index  

Chat dumps are archived as markdown packs (not raw chat logs). Add new packs as `pack-NN-slug-YYYY-MM-DD.md` and link in `README.md`.
