# WOF (World of Fantasy) — research only

**Not the live game.** Do not implement anything here into SynapticGM (`src/`, `supabase/`, prompts, saves). Isolated prep code: [`wof/`](../../wof/) (run `npm run wof:check`).

WOF is a later-release authored faction world: original races/places, quest lines, optional multiplayer (dungeons + raids).

| File | Topic |
|------|--------|
| [pack-08-authored-world-intel-2026-08-14.md](./pack-08-authored-world-intel-2026-08-14.md) | Zone graph, original race kits, quest DAGs, presence ladder |
| [pack-09-text-multiplayer-dungeons-raids-2026-08-14.md](./pack-09-text-multiplayer-dungeons-raids-2026-08-14.md) | Party/raid instances, combat handler, narration fan-out, LLM cost |
| [pack-09-dump-2026-08-15.md](./pack-09-dump-2026-08-15.md) | Working reference — MP research complete; John’s calls locked |
| [pasted/WOF_Gap_Fill_Dump.md](./pasted/WOF_Gap_Fill_Dump.md) | Full gap-fill dump (schemas, Millstone Hollow, housing, AH, billing) |
| [pack-10-themed-skins-2026-08-15.md](./pack-10-themed-skins-2026-08-15.md) | Genre skins on the same MMO bones (original names; pattern not clone) |
| [pack-11-housing-business-auction-sim-2026-08-15.md](./pack-11-housing-business-auction-sim-2026-08-15.md) | Housing, deals, AH, server clock (later) |
| [pack-12-realtime-group-sync-2026-08-15.md](./pack-12-realtime-group-sync-2026-08-15.md) | Wall-clock world vs lockstep group combat |
| [pack-13-battle-plan-autorun-2026-08-15.md](./pack-13-battle-plan-autorun-2026-08-15.md) | Plan of attack; auto-run vs manual lockstep rounds |
| [pack-14-monetization-notes-from-sgm-pack09-2026-08-15.md](./pack-14-monetization-notes-from-sgm-pack09-2026-08-15.md) | WOF-only excerpt: chat cosmetics + F&F multiplayer billing notes from SGM Pack 9 |
| [pack-15-mp-memory-from-pack11-2026-08-15.md](./pack-15-mp-memory-from-pack11-2026-08-15.md) | **Deploy-ready** MP memory: scopes, leak rules, Mode A/C cost, SP→MP port map; stubs in `wof/src/engine/memory.ts` |
| [pack-15-audience-skins-systems-2026-08-15.md](./pack-15-audience-skins-systems-2026-08-15.md) | Non-tabletop audiences; per-skin maths; anime/sci-fi/cozy |
| [pack-16-golive-systems-map-2026-08-15.md](./pack-16-golive-systems-map-2026-08-15.md) | Memory, catalogs, quests, trees, builder, go-live checklist |
| [pasted/WOF_GoLive_Systems_Dump.md](./pasted/WOF_GoLive_Systems_Dump.md) | Go-live dump: memory, catalogs, quests, trees, builder, skin matrix |
| [pack-17-remaining-bolt-research-2026-08-15.md](./pack-17-remaining-bolt-research-2026-08-15.md) | Next Bolt map (Wave A–B done via combined dump) |
| [RESEARCH-PROMPT-playable-start-bolt.md](./RESEARCH-PROMPT-playable-start-bolt.md) | Bolt → WOF_PlayableStart_Dump.md (**ingested**) |
| [pasted/WOF_PlayableStart_Dump.md](./pasted/WOF_PlayableStart_Dump.md) | Playable start: first hour, slice, social, bible |
| [pack-18-playable-start-2026-08-15.md](./pack-18-playable-start-2026-08-15.md) | Working reference — playable-start v1 picks + dump errors |
| [pack-19-themed-mmo-commerce-2026-08-15.md](./pack-19-themed-mmo-commerce-2026-08-15.md) | Worlds vs sub vs chrome; Theme Kits |
| [RESEARCH-PROMPT-themed-mmo-commerce-bolt.md](./RESEARCH-PROMPT-themed-mmo-commerce-bolt.md) | Bolt → WOF_ThemedMMO_Commerce_Dump.md (**ingested**) |
| [pasted/WOF_ThemedMMO_Commerce_Dump.md](./pasted/WOF_ThemedMMO_Commerce_Dump.md) | Commerce dump: plans, Theme Kits, HUD, module maths |
| [pack-20-themed-mmo-commerce-ingested-2026-08-15.md](./pack-20-themed-mmo-commerce-ingested-2026-08-15.md) | Working reference — commerce v1 picks + dump errors |
| [pack-21-remaining-holes-2026-08-15.md](./pack-21-remaining-holes-2026-08-15.md) | What’s still open (turns vs raid, phone raid, live vs WOF) |
| [RESEARCH-PROMPT-remaining-holes-bolt.md](./RESEARCH-PROMPT-remaining-holes-bolt.md) | Bolt → WOF_RemainingHoles_Dump.md (**ingested**) |
| [pasted/WOF_RemainingHoles_Dump.md](./pasted/WOF_RemainingHoles_Dump.md) | Turns, two apps, raid phone, death, family, ops, push |
| [pack-22-remaining-holes-ingested-2026-08-15.md](./pack-22-remaining-holes-ingested-2026-08-15.md) | Working reference — remaining-holes v1 picks |
| [pack-23-starting-zones-quest-lines-2026-08-15.md](./pack-23-starting-zones-quest-lines-2026-08-15.md) | Four race starts + 36 quests + 4 solo 5-mans (prep catalog) |
| [RESEARCH-PROMPT-gap-fill-bolt.md](./RESEARCH-PROMPT-gap-fill-bolt.md) | Bolt prompt → WOF_Gap_Fill_Dump.md (already ingested) |
| [RESEARCH-PROMPT-golive-systems-bolt.md](./RESEARCH-PROMPT-golive-systems-bolt.md) | Bolt prompt → WOF_GoLive_Systems_Dump.md (already ingested) |
| [RESEARCH-PROMPT-first-hour-bolt.md](./RESEARCH-PROMPT-first-hour-bolt.md) | Bolt → WOF_FirstHour_Dump.md |
| [RESEARCH-PROMPT-text-mmo-patterns-bolt.md](./RESEARCH-PROMPT-text-mmo-patterns-bolt.md) | Bolt → WOF_TextMMO_Patterns_Dump.md |
| [RESEARCH-PROMPT-vertical-slice-bolt.md](./RESEARCH-PROMPT-vertical-slice-bolt.md) | Bolt → WOF_VerticalSlice_Dump.md |
| [RESEARCH-PROMPT-social-safety-bolt.md](./RESEARCH-PROMPT-social-safety-bolt.md) | Bolt → WOF_SocialSafety_Dump.md |
| [RESEARCH-PROMPT-economy-liveops-bolt.md](./RESEARCH-PROMPT-economy-liveops-bolt.md) | Bolt → WOF_EconomyLiveOps_Dump.md |
| [RESEARCH-PROMPT-combat-feel-bolt.md](./RESEARCH-PROMPT-combat-feel-bolt.md) | Bolt → WOF_CombatFeel_Dump.md |
| [RESEARCH-PROMPT-ash-compact-bible-bolt.md](./RESEARCH-PROMPT-ash-compact-bible-bolt.md) | Bolt → WOF_AshCompact_Bible_Dump.md |
| [RESEARCH-PROMPT-tech-shard-bolt.md](./RESEARCH-PROMPT-tech-shard-bolt.md) | Bolt → WOF_TechShard_Dump.md |
| [RESEARCH-PROMPT-alts-identity-bolt.md](./RESEARCH-PROMPT-alts-identity-bolt.md) | Bolt → WOF_AltsIdentity_Dump.md |

Rule: `.cursor/rules/wof-sandbox.mdc`

Live SynapticGM packs stay in `docs/research/` (packs 1–7, 9 monetization + master plan).
