# WOF isolated prep (not live)

**This folder is World of Fantasy prep only.** It is not SynapticGM. Do not import it from `src/`, `supabase/`, live prompts, settings, or saves.

Run checks (does not start the live app):

```
npm run wof:check
```

Ash Compact pack: four race starts (not a live-game change).

| Race | Faction | Hub | First-hour quest | Solo 5-man |
|------|---------|-----|------------------|------------|
| Hearthborn | Ash Compact | Reedfen Square | The Hearthborn's Request | Lampwood Gate |
| Lanternfolk | Ash Compact | Wickhaven | Keep the Path Lit | Unlit Hollow |
| Saltkin | Tide Covenant | Brinewatch Dock | The Flats Are Wrong | Coil Warehouse |
| Stonevein | Tide Covenant | Anvil Gate | The Stair Has a Crack | Anvil Deep |

Each start has a 3-step race line, a 3-step local profession line, and a 3-step zone story. Local problems only. Tide Covenant is a faction, not a race. Saltkin is a race, not a creature.

Overworld is **Tier 3** (shared hub, instanced combat) — not a contested open world. Capitals (Ash Seat, Tidehold) exist as places with no walk from starts yet.

Research: `docs/research/wof/`.

MP memory prep (Pack 15): scoped stores + claim-grounding live in `wof/src/engine/memory.ts` — ready for later multiplayer deploy, not wired to live SynapticGM.
