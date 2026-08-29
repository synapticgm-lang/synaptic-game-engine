# Playtest 2026-08-30 — two vs group (Class D)

## Symptom

Josie session contradicted itself on how many people were here:

- Opening beat: “a scattered **group of individuals**”
- Later beat: “the **two figures** who were present when you arrived”

Same save, no enter/leave.

## Why it slipped (not a missing phrase)

24f `scrubInventedCrowdSize` only rewrote **huge** invented crowds (dozens / hundred → several). Pair vs group vs few was free prose.

Count sources disagreed:

1. Opening seed put `blue panel` + `handlers` in `present[]`. `calculateCrowdSize` counted **every** token, so SNAPSHOT said intimate (~2) while the writer still said “group”.
2. Opening pin adds 1–2 named NPCs as a **floor**, not a locked headcount — but the snapshot treated token length as the number.
3. Harvest set `crowd=present` + a generic `bystanders` token. It never locked “two” vs “five”.
4. Fate-autoplay harvested names but did not run `applyCommittedNarrative`, so headcount never stuck on the headless path.

No Continuity-Warden LLM. Owner stays `crowdAuthority` → `runWarden` / `proseWarden` + `sceneFacts`.

## Site-wide rule

`src/game/crowdAuthority.ts` is the single count owner for **all modes**, opening + later turns, client `useGame`, fate-autoplay, and edge (synced `sceneFacts` / `situationPacket` / `bindingConstraints` / `narrativeHarvest` + edge `proseWarden` import).

- **Count** = locked `sceneFacts.crowdCount` when set, else person tokens in `present[]` (named + `figure N` occupancy) + companions + encounter. Props (`blue panel`) and aggregates (`handlers`, `bystanders`) do **not** number the room.
- **First lock wins.** Harvest writes occupancy into `present[]` and sets `crowdCount` from any people-count **class** (solo / pair / few / group / large, plus number words). Later beats cannot grow or shrink without enter/leave language.
- **Warden** rewrites any mismatched class to the locked bucket’s canonical phrase (`no one` / `the person here` / `the two people here` / `the few people here` / `the people here` / `the crowd here`). Not a swap of Josie’s two strings.
- **Unlocked** (people present, no number yet): do not force pair ↔ group. If this beat writes a size, that size locks the rest of the beat and then the ledger.
- SNAPSHOT Crowd + `CROWD COUNT (BINDING)` use the same resolver. Opening pin keeps names present; it does not set the headcount.

## Residual

Opening GM can still invent a size **before** harvest on page 1. After that beat commits, later turns cannot flip pair ↔ group without someone entering or leaving. Same-beat mixed classes rewrite to the first mention.

## Stamp

HUD `2026-08-30X` / BUILD `2026-08-30q`. Mid writer OFF. Vitest `playtest30xCrowdAuthority`.
