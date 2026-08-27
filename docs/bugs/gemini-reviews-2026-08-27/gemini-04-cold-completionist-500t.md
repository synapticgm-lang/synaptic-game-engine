# Gemini critic — gemini-04 (500t cold completionist)

- **Source pack:** `scripts/fate-autoplay/runs/gemini-04-500t-cold-completionist.md`
- **Run folder:** `2026-08-26T20-48-01-457Z_summoned-pact_cold-system_s42`
- **Mode:** completionist · **Voice:** cold-system · **Turns:** 500 · **Seed:** 42
- **Ingested:** 2026-08-27 (John paste)
- **Code baseline of run:** pre-26u / pre-26t overnight (XP + them/clone gates not yet in that process)

## Mapping vs shipped gates

| Gemini must-fix | Status at ingest |
|---|---|
| `them` / `this place` variable mush | Partially closed by **26u** (scrub + choice reject) — re-verify on post-26u run |
| NPC `your eyes` / `your face` | Partially closed by **26u** perspective + reverse scrub |
| Infinite paragraph loops | Partially closed by **26u** near-clone (≥0.85) novelty retry |
| Option spam / broken labels | Partially closed by **26u** (broken-label filter + 2×/8-turn dedupe) |
| Zero XP @ 500 | Expected on this pack (pre-**26t**); re-score after new autoplay |
| Passive GM / no combat force | **Still open** — threat-decay / ambush deferred |
| Strict inventory JSON lock | **Still open** — post-hoc scrub only |
| Cold Registrar chrome every beat | **Still open** — voice rails weak in prose; STATUS may be stripped in old export |
| Quest injector | Partially closed by **26u** SNAPSHOT quest pressure (needs active quest) |
| Meta/adversarial input handling | **Still open** |
| Empty GM “moment hangs” | Softened in **26u** headless fallback — re-verify |

## Executive verdict (Gemini)

Unshipable on this transcript: template mush (`them`/`this place`), 14-turn verbatim loops, zero XP/combat, almost no System chrome, agent trapped in Earth-junk / corner-table / gate-queue pads. Competitive loss vs AI Dungeon / NovelAI / basic ChatGPT GM.

## Scorecard summary

Nearly all areas **1–2/10**. Competitive win/loss **1/10**.

## Must-fix (Gemini top 5) — hold for next update after live playtest

1. Variable injection (`them`, `this place`) — re-verify post-26u
2. NPC pronoun `your` → his/her — re-verify post-26u
3. Hard gate on 10+ turn text clones — re-verify post-26u near-clone
4. Proactive Warden / threat decay if player loiters — **open**
5. Inject Cold Registrar + LitRPG STATUS visibly — **open** (chrome + stronger voice)

## Full Gemini paste

(verbatim from John, 2026-08-27)

SynapticGM in its current state is unshipable, fundamentally broken at the template-rendering level, and fails completely as a LitRPG engine… [full critique as pasted in chat — scorecard 1–20, sections A–F, REVIEW_COMPLETE].

### Key evidence turns cited by Gemini

- Verbatim vendor loop: Turns **9–22**
- Broken options: 47, 91, 287, 468 (`Check your the merchant…`, `Examine them clues`, `merchant, dark berries`)
- Agent meta-scream ignored: 294, 309, 380, 437, 441, 492 (`not 'gate queue'`)
- Only System chrome: Turn **210** registration
- Empty GM hang: Turn **469**
- Inventory mush: 104, 153, 347, 443 (`two them`, duplicate birds/lockets)
- Place mush: 2, 34, 133, 233, 479

### Gemini priority board (E) — next update candidates after playtest

1. P0 them/this place (re-verify 26u)
2. P0 NPC your→his/her (re-verify 26u)
3. P0 clone gate (re-verify 26u)
4. P0 option dedupe/grammar (re-verify 26u)
5. P0 System chrome injector (open — stronger visible STATUS)
6. P1 strict inventory JSON (open)
7. P1 threat decay / anti-loiter combat (open)
8. P1 context-aware options vs visible entities (open/partial)
9. P1 empty-GM forward fallback (partial 26u)
10. P2 meta/adversarial input (open)
11. P2 quest injector (partial 26u SNAPSHOT)
12. P2 Cold Registrar voice enforcement (open)

## Next action

John continues live play + more Gemini packs. **Do not ship a new batch until he asks.** Prefer a **post-26u** autoplay re-score of Summoned Pact before treating them/clone/option issues as still P0.
