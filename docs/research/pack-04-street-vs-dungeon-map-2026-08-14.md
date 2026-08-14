# Pack 4 — Local Street Map vs Dungeon Node Map (2026-08-14)

**Status:** Captured for end-of-packs summary. Do not implement until John asks.  
**Scope:** Outdoor geographic map vs indoor node/tactical map; micro-dungeon entrances; anti-patterns from playtest (MOVE orbs).

Architecture already decided: outdoor ≠ dungeon graph; map scale tier ≠ danger tier.

---

## 1) Good outdoor map examples (takeaways)

| Game | Take for SynapticGM |
|------|---------------------|
| Elden Ring | Fog-of-war reveal; landmarks as places, not nodes |
| Fallout Pip-Boy | Geographic backdrop + discovered pins; place not flowchart |
| Diablo IV | Dungeon = icon on outdoor map; separate indoor view |
| BotW / TotK | Terrain + POI layers; navigate by place |
| Disco Elysium | District abstraction — ideal for text games |

---

## 2) Street map vs dungeon map

### Street (outdoor) includes
Streets/paths · district labels · YOU ARE HERE · discovered pins · landmarks · micro-dungeon entrance icons · subtle quest marker · fog of war

### Street excludes
Room nodes · door-by-door links · enemy tokens · tactical grid · **“MOVE to X” labels**

### Dungeon (indoor) includes
Room nodes · connections (locked/secret) · YOU HERE · visited/? · seen enemies/loot · exits · detected traps

### Dungeon excludes
Streets · districts · geographic terrain · unconnected “city” regions

---

## 3) Labels / zoom / mobile

- Labels = **player-known place names**, not lore titles, not commands  
- Truncate gracefully (“St. Catherine’s…”) — never “MOVE to St. Cat.”  
- Discovered labels always visible; undiscovered = “?”  
- Cluster overlapping pins  
- **Two zooms only:** District (overview) / Street (detail)  
- Pinch zoom; 44×44px targets; no double-tap zoom; no pan if map fits  

---

## 4) Micro-dungeon on street map

Two-layer icons on one place:
1. Street pin = building/area (talk, enter street-level)  
2. Doorway/stairs icon = dungeon entrance (discovered only) → confirm → **switch to dungeon node view**

Separate data: `StreetMap.locations[].dungeon_entrances[]` → `dungeon_id` → `DungeonMap` rooms/connections/state.

---

## 5) Outdoor wireframe (text)

```
Header: district name
Body: faint districts + street lines + pins (Tavern, Warehouse[⌄], Gate)
      YOU pulse at Blacksmith · ? undiscovered · fog overlay
Footer tabs: Map | Journal | Status | Inventory
Tap pin → detail + actions · Tap [⌄] → enter dungeon confirm
```

---

## 6) Explicitly NOT do

1. Bobbing/orbiting orbs  
2. Truncated “MOVE to ___”  
3. Lore names player hasn’t earned  
4. Node graph for outdoor  
5. All locations visible from start  
6. Giant quest “!”  
7. Indoor rooms on street map  
8. Animated pins (except YOU pulse)  
9. Overlapping labels  
10. Same icon for street vs dungeon entrance  
11. Pins in void with no streets  
12. Zoom reveals new locations (discovery = going there)

---

## 7) Outdoor ruleset (15)

Geographic layout · streets as lines · districts · YOU pulse · discovered vs ? · player-known names · graceful truncate · fog · distinct dungeon entrance icons · two zooms · subtle quest · landmarks · tap→detail · no bobbing MOVE · pinch zoom

## 8) Dungeon ruleset (15)

Node graph OK indoors · room labels · connection types · YOU · visited/? · seen enemies/loot · exits · traps after detect · no streets/districts · Back to Street · own data structure · discrete visited · floor tabs if large · no “MOVE to Room”

---

## SynapticGM backlog from this pack (≤10)

1. Replace `local-area` MOVE-orb UI with geographic street pins + paths.  
2. Separate outdoor map view vs dungeon node view.  
3. Player-known labels via `locationName` / sheet (not lore titles).  
4. Micro-dungeon entrance icon → load seeded dungeon.  
5. Fog / discovered vs “?” for outdoor.  
6. Distinct YOU marker; kill bobbing MOVE.  
7. Map scale label ≠ danger tier (align Pack 3).  
8. Tap pin → detail actions; not auto “MOVE” node hop.  
9. Touch targets + two zoom levels.  
10. Cluster close landmarks on mobile.

---

## Sources

Elden Ring / Fallout / Diablo IV / BotW / Disco Elysium (design knowledge) · Apple HIG touch targets · prior SynapticGM competitor research · playtest: bouncing MOVE nodes, truncated labels, “Every Mind” retitle

---

## Delta vs current code

`mapEngine.buildLocalAreaMap` / `addLandmarkToLocalMap` + MOVE-style nodes = outdoor anti-pattern. Keep node graph for real interiors only; rebuild outdoor as street layout referencing dungeon IDs.
