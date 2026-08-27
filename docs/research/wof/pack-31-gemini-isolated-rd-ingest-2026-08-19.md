# Pack 31 — Gemini Isolated R&D ingest (2026-08-19)

**Source:** `c:\Users\littl\Downloads\World of Fantasy_ Isolated R&D Directive Overview.zip`  
**Verbatim:** `docs/research/wof/pasted/gemini-isolated-rd-2026-08-19/`  
**Status:** Research ingest only. **Not live SynapticGM.** Do not merge into `wof/src/` or `src/`.

Gemini produced a **second WOF**: an event-sourced expedition sim set in **Veyr / Tidelock Chronicle**. Isolation rhetoric is fine. The world, kernel, and roadmap are **not** the locked later-release text MMO.

---

## What the zip actually is

| Artifact | What it is |
|----------|------------|
| Nested `wof-rnd-foundation.zip` | Small pnpm package: `models.ts`, chronicle `reducer.ts`, `first-tide` fixture, JSON Schema, isolation grep |
| Lore bible | New cosmology (five Resonances), five regions (Hushmere → Stillwater Crown), five new factions |
| Engine blueprint | Immutable snapshot + append-only `WorldEvent` union |
| Visual R&D | “Weathered Instrument” palette + art prompts |
| Roadmap | Three-phase R&D program that never ships into any product |
| Templates | Decision / playtest / discarded-concept forms |
| `SKILL.md` | ImageGen routing skill — **contamination**, ignore |
| Terminal log | Typecheck of that nested package **failed** (`verbatimModuleSyntax`, branded-id records) |

Owner lines say **Manus AI**. Treat as Gemini wrapping the same sandbox genre, not a review of our tree.

---

## Locked WOF this dump does not know

Keep these. Do not replace them with Tidelock names.

- Factions: **Ash Compact**, **Tide Covenant** (faction, not a race)
- Races: **Hearthborn**, **Lanternfolk**, **Saltkin**, **Stonevein**
- Starts: **Reedfen**, **Lampwood**, **Brinewatch**, **Granite Stair**
- Code already in `wof/`: places, quest ids (`quest_hearthborn_race_1` …), `hp_check`, turn ledger, MP memory stubs
- Product: code owns dice/HP/catalogs/quests/loot/gold; LLM narrates after commit; hubs + instanced combat; party 2–5; raid 10; friends-first; two wallets; no P2W outcomes

**False friend — reject:** **Ashwright Compact**. Too close to Ash Compact. Not a rename, not an alias.

Also reject: Veyr, Tidelock phases as the world clock, Hushmere / Cinder Spine / Verdant Holdfast / Wind Archive / Stillwater Crown, Keepers of the Last Lantern, Morrowbind Orchard, Unmoored Choir, Quiet Cartographers, Witness-binder / Kiln Runner archetypes, ember-brine-gale-root-veil as the cosmology.

---

## Use later (ideas only — do not code now)

These are process/UI thoughts. They do **not** unlock a WOF coding pass.

1. **Isolation grep.** `verify-isolation.mjs` is the only new *engineering* idea. Ours already lives as `.cursor/rules/wof-sandbox.mdc` + `npm run wof:check`. If we ever add a CI check, rewrite it for this repo (`src/`, `supabase/`, `@/` aliases). Do not paste the `/home/ubuntu/src` patterns.
2. **Decision / playtest / discarded templates.** Fine for John-calls when WOF coding starts. We already ingest with pack notes; no need to adopt the folder ritual now.
3. **Weathered Instrument palette** (Abyss Ink / Tideglass / Kiln Ember / salt-stained brass). Optional later chrome for Reedfen/Brinewatch *look*, without Hushmere names or new races.
4. **Visible oath with a due turn** as a *quest-pressure pattern* (not a new magic system). Live already has an unresolved-consequence ledger; WOF already has quest DAGs. Do not add Tidelock oaths on top.
5. **Named chronicle events** map to the existing lock: ledger/StateTx first, prose after. Do **not** replace `wof/src/engine/` with this reducer.

---

## Do not use

- Whole Tidelock / Veyr bible (parallel world)
- Nested `wof/` package as a replacement for our isolated tree
- “Phase 3: never transfer WOF code” — too strict for this repo. WOF is a **later product** in `wof/`, not eternal R&D that never ships
- Five-resonance magic loop instead of `hp_check` + authored modules
- Expedition-only loop instead of hubs / 5-man / 10-man raid
- ImageGen `SKILL.md`

---

## Does this fill remaining WOF holes?

**No.** Pack 21 holes still stand: group turn cost, two-app vs one, 10-man phone HUD, death/repair sinks, Kid Mode bill, stranger retention, live-ops human loop, push/mail. This zip does not mention them.

It also does not beat packs 26–30 on worlds. Stop commissioning more WOF world dumps.

---

## Do not do

- Do not merge this kernel into `wof/`.
- Do not add Hushmere (or any Tidelock region) to live or to `wof/src/packs`.
- Do not start a WOF coding pass from this zip. Live SynapticGM first.
