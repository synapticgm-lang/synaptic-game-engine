# Gemini critic — gemini-02 (500t cold maxlevel)

- **Source pack:** `scripts/fate-autoplay/runs/gemini-02-500t-cold-maxlevel.md`
- **Run folder:** `2026-08-26T20-20-42-822Z_summoned-pact_cold-system_s42`
- **Mode:** maxlevel · **Voice:** cold-system · **Turns:** 500 · **Seed:** 42
- **Ingested:** 2026-08-27 (John paste)
- **Code baseline of run:** pre-26u / pre-26t overnight

## Mapping vs shipped gates

| Gemini must-fix | Status at ingest |
|---|---|
| `them` / `this place` / plaque `them - them` | Partial **26u** — re-verify |
| Infinite loops (berry juice 9–22; undercroft door 77–141; battlement 267–290) | Partial **26u** near-clone + stagnation rail — re-verify (maxlevel still stuck 50+ turns on door) |
| Option gibberish / recycle | Partial **26u** |
| Zero XP @ 500 | Expected pre-**26t** — ironic: **maxlevel** agent still 0 XP |
| Inventory `[Uncommon] them` / duplicates | **Open** |
| Threat decay / force combat | **Open** |
| Cold Registrar + STATUS chrome | **Open** |
| Meta “not gate queue / crate mark” ignored | **Open** |
| Quest injector after Elias (T63) | Partial **26u** — no spine after registration |
| NPC your-face (T263) | Partial **26u** |

## Executive verdict (Gemini)

Unshipable: template mush, long action loops (door/battlement), 0 XP/combat despite maxlevel agent, Cold Registrar absent. Competitive loss vs AI Dungeon / NovelAI.

## Scorecard

Nearly all **1–2/10**. Competitive **1/10**. Invented items **1/10** (worse than 03/04 — Turn 494 inventory mush).

## Must-fix (Gemini top 5) — hold for next update

1. `them` / `this place` — re-verify post-26u  
2. Hard clone / anti-loop gate (incl. **same-action** loops, not only prose clones) — **open/strengthen**  
3. Inventory string mapping `[Uncommon] them` — **open**  
4. Threat-decay / force events — **open**  
5. Cold Registrar + LitRPG STATUS — **open**

## Key evidence turns

- Berry-juice loop: **9–22**
- Undercroft door stuck: **77–141** (~60 turns)
- Battlement spam: **267–290**
- Kit mush: 91, 104, 153, 175, 287, 347, **494**
- Plaque `them - them`: **73**
- Meta ignore: 5, 8, 14, 18, 202, 282, 342, 371, 385, 397
- Only System: **210**
- Elias: **63** then no quest spine
- Growl ignored: **118**

## Agent note

**maxlevel** was supposed to chase XP/levels — Gemini still reports **0 XP**. Reinforces: (a) pre-26t headless lacked sandbox XP; (b) agent + GM both failed to create awardable beats; (c) post-26t/26u re-run of maxlevel is a high-value verification.

## Cross-ref

Same seed-42 Summoned Pact cluster as gemini-03 (storyfollower) and gemini-04 (completionist). Shared next-batch priorities: inventory lock, threat-decay, chrome, meta-input, stronger anti-loop beyond prose similarity.

## Next action

John continues playtest. **Do not ship until he asks.**
