# WOF Pack 17 — Remaining Bolt research (best start)

**Project:** WOF later release. Do not implement into live SynapticGM.  
**Point:** Combat, housing, AH, memory, catalogs, and go-live checklists are already dumped. What is still missing is *how other games make a first hour, a social shard, and a playable slice actually work*.

**Status:** Combined playable-start dump ingested 15 Aug 2026. Wave A–B prompts superseded. Wave C still optional.

**Dump:** [pasted/WOF_PlayableStart_Dump.md](./pasted/WOF_PlayableStart_Dump.md) · working locks: [pack-18](./pack-18-playable-start-2026-08-15.md)

Do **not** re-run the playable-start, gap-fill, or go-live prompts.

---

## Steal method from live SGM research (no Bolt needed)

These already exist under `docs/research/`. Copy **method**, not live tickets, not live code.

| Live pack | Steal for WOF |
|-----------|----------------|
| Pack 2 — rules vs narration | Code math, LLM prose, outcome token |
| Pack 3 — LitRPG first hour | Turn quality; never System-only; protest as dialogue |
| Pack 4 — street vs dungeon map | Outdoor pins vs indoor nodes |
| Pack 5 — quest journal | Place authority; code quest state |
| Pack 6 — long memory | Pins + summaries; WOF go-live already extended this |
| Pack 7 — ratings / mediation | Kid Mode, hate vs swears |
| Competitor pack | FableAI, F&F, Hidden Door, AI Dungeon, Summon Worlds — **patterns** |
| Pack 9 monetization | Cosmetics only; never sell outcomes (already in WOF Pack 14) |

---

## Already dumped (do not ask Bolt again)

Combat lockstep, plan-auto, Millstone Hollow, raid 10, weekly lockout, friends-first finder, Tier 3 hubs, personal loot, AH buyout+escrow, housing deeds, personal merchant deals, server tick, four memory stores, shared catalogs + seed bands, quest/talent code ownership, world-pack validator, skin matrix.

**Name freeze until you pick otherwise:** Pack 15 wins. Circuit Arc = shonen tournament. Starwake = space opera. Stage Light = idol/school. The go-live dump swapped Circuit Arc / Starwake — ignore that swap in new dumps.

---

## Run on Bolt — this order

Paste the matching `RESEARCH-PROMPT-*-bolt.md`. Download the named file. Drop it in this chat or `docs/research/wof/pasted/`.

### Wave A — needed before a playable start

| # | Prompt | Output file | Why |
|---|--------|-------------|-----|
| 1 | [first-hour](./RESEARCH-PROMPT-first-hour-bolt.md) | `WOF_FirstHour_Dump.md` | Character create, tutorial, first 30–60 min, first group |
| 2 | [text-MMO patterns](./RESEARCH-PROMPT-text-mmo-patterns-bolt.md) | `WOF_TextMMO_Patterns_Dump.md` | How MUDs / Fallen London / KoL / F&F / Hidden Door actually feel |
| 3 | [vertical slice](./RESEARCH-PROMPT-vertical-slice-bolt.md) | `WOF_VerticalSlice_Dump.md` | Minimum content to ship Ash Compact alpha |
| 4 | [social + safety](./RESEARCH-PROMPT-social-safety-bolt.md) | `WOF_SocialSafety_Dump.md` | Friends, chat, guilds, grief, reports, Kid Mode in a shard |

### Wave B — makes it a live game, not a combat demo

| # | Prompt | Output file | Why |
|---|--------|-------------|-----|
| 5 | [economy + live ops](./RESEARCH-PROMPT-economy-liveops-bolt.md) | `WOF_EconomyLiveOps_Dump.md` | Gold sinks, inflation, weekly reset, events |
| 6 | [combat feel + sessions](./RESEARCH-PROMPT-combat-feel-bolt.md) | `WOF_CombatFeel_Dump.md` | Round UX, rest, short sessions, raid-night length |
| 7 | [Ash Compact bible](./RESEARCH-PROMPT-ash-compact-bible-bolt.md) | `WOF_AshCompact_Bible_Dump.md` | First zone POIs, NPCs, quest DAG, ban-list — playable content |

### Wave C — later, cheap to research now if tokens are leftover

| # | Prompt | Output file | Why |
|---|--------|-------------|-----|
| 8 | [tech shard](./RESEARCH-PROMPT-tech-shard-bolt.md) | `WOF_TechShard_Dump.md` | Presence, realtime, Evennia/Nakama/Phoenix **patterns** — no code |
| 9 | [alts + identity](./RESEARCH-PROMPT-alts-identity-bolt.md) | `WOF_AltsIdentity_Dump.md` | Character slots, names, transfers, one-main vs alts |

---

## What Bolt must not do

- Invent licensed races, places, slogans, or lookalike mascots.
- Re-design raid size, lockstep, AH escrow, or host-pays.
- Write production TypeScript or live SynapticGM patches.
- Dump a 25-man raid or a full 10k-species bestiary.

---

## After dumps land

Ingest like Packs 9 and 16: copy to `pasted/`, lock v1 picks, list remaining John calls. Then a **build wave** can start (still WOF-only, still not live).
