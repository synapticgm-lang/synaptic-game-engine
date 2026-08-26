# Playtest ingest — Debug open crash + empty STATUS (2026-08-26)

**Source log:** `synaptic-debug-1787733627107.log` (from Downloads)  
**HUD stamp on device:** `2026-08-26c`  
**Classes:** **E** (chrome / lazy modal) + **C** (STATUS noise; prior 20r / 19c / 26a)

## Crash

At `2026-08-26T08:40:25Z` ErrorBoundary caught:

```
TypeError: Failed to fetch dynamically imported module:
https://synaptic-game-engine.vercel.app/assets/DebugModal-kg_OhUya.js
```

**Root cause:** HUD **Debug** opens a Vite `lazy()` chunk. After a Vercel deploy, the old main bundle still references a purged `DebugModal-*.js` hash → dynamic import fails → app-wide ErrorBoundary (“realm has fractured”). The `.log` download is from that ErrorBoundary fallback (`logger.downloadLog`), not from DebugModal itself.

**Fix intent (26f):** `safeLazy` one-shot reload on chunk miss + local chunk boundary around Debug so play UI does not white-screen.

## Empty STATUS

Screenshot STATUS panel:

> STATUS Turn results  
> No XP or loot changes this turn.

GM-authored no-op `<system-log>` line; filter already stripped `XP Gained: 0` / `No XP gained` but not this phrasing. Align with 20r (drop no-op Location/Quest Focus) and 19c (no empty helper chrome): **omit STATUS entirely** when no meaningful turn results remain.
