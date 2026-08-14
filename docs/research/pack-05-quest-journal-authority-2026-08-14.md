# Pack 5 — Quest Journal + Location Tier Authority (2026-08-14)

**Status:** Captured for end-of-packs summary. Do not implement until John asks.  
**Scope:** Single authority for place name / dangerTier / mapScale; quest state machine; what System may invent.

Fixes playtest: quest T1 vs System T2 vs map T3 + wrong place name (“Every Mind”).

---

## 1) Comparison highlights

| Pattern | Source | Copy / avoid |
|---------|--------|--------------|
| Place by ID ref | Skyrim LocationRef | **Copy** — journal/map read `place.name` at render; never copy strings into quest |
| Danger on dungeon/place | Diablo IV | **Copy** — tier on Place; quest only refs Place |
| Map scale hierarchy | Elden Ring regions | **Copy** — mapScale on Place |
| Quest stages | Witcher 3 | **Copy** state machine; **avoid** inactive→completed skip |
| Marker via ref | Skyrim | Marker = `quest.locationRef → place.mapPosition` |
| Same-turn objective resolve | Hidden Door | **Avoid** — min turn gaps |
| LLM invents quests | F&F | **Avoid** — code owns quest transitions |
| Place name drift | AI Dungeon | **Avoid** — one Place; aliases in prose only |

---

## 2) One authority rule

> No system copies place name/tier. Everyone references Place by ID and reads at render time.

| System | Owns | References |
|--------|------|------------|
| Place | name, dangerTier, mapScale, kind, mapPosition, aliases | — |
| Quest | id, state, objectives, locationRef | Place ID only |
| Map / Journal / System chrome | display | Place + Quest at render |
| LLM | prose | Context sheet (no hidden quests) |

---

## 3) Schema (proposed)

### Place
```
id, name, aliases[], loreName?
dangerTier: 1|2|3|4
mapScale: district|street|interior|dungeon
kind: street|interior|dungeon
mapPosition?, parentPlaceId?, exits[], dungeonRef?
discovered, description
```

`dangerTier` NOT stored on Quest — read from Place.  
`mapScale` vs `kind` separate (render vs rules).

### Quest
```
id, title, description, locationRef (Place ID)
state: hidden|revealed|active|completed|failed|abandoned
objectives[] { id, text, locationRef, state, completedTurn? }
reward { xp, items[], unlocks[] }
revealedTurn?, activatedTurn?, completedTurn?
minTurnsBeforeActive (default 1)
minTurnsBeforeComplete (default 1)
```

### Context sheet (LLM)
`currentPlace` + `previousPlace` + `activeQuests` (resolved locationName).  
**Hidden quests omitted entirely.**

---

## 4) Quest state machine

```
hidden → (trigger) → revealed → (≥1 turn) → active → (≥1 turn) → completed
                                    ↘ failed | abandoned
```

| State | Journal | Map marker | System may mention |
|-------|---------|------------|--------------------|
| hidden | no | no | **no** |
| revealed | Discovered (gray) | subtle | new quest once |
| active | Active | prominent | updates / rare reminder (≤1/5 turns) |
| completed | Completed | none | once + rewards; no spam |
| failed | Failed | none | once |
| abandoned | Abandoned | none | no |

---

## 5) Invent vs read

| Data | LLM may | Code owns |
|------|---------|-----------|
| Place name | aliases only | canonical name |
| Danger tier | qualitative feel | number + chrome label |
| Map scale | spatial feel | map view |
| Quest title/objective | exact text | records |
| Quest state / rewards | narrate receipt | transitions + reward table |
| Location desc | expand, not contradict | base description |
| Hidden dungeon state | only if revealed in sheet | ledger |

---

## 6) Anti-patterns → prevention

Same-turn complete → min turn gaps · LLM invents quest → code only · name drift → Place + aliases · tier mismatch → Place-only tier · wrong map name → render from Place · marker wrong → locationRef · no fail state · AI auto-complete · hardcoded names in quest text → `{locationRef}` · leak hidden quests → exclude from context

---

## SynapticGM backlog from this pack (≤10)

1. Introduce Place records (or upgrade locationSheet) with `dangerTier` + `mapScale` + `kind`.  
2. Quests store `locationRef` only; UI resolves name/tier from Place.  
3. Split map header: mapScale label vs danger tier (fix playtest).  
4. Quest state machine: hidden→revealed→active→completed with min turn guards.  
5. Context sheet: omit unrevealed quests (already partly true — harden).  
6. Prompt: no invent place names / tier numbers / quest titles.  
7. System log tier line reads Place, never invents “Tier 2 Urban Ruin.”  
8. Map pin label = `place.name`, loreName in detail only.  
9. Quest marker from `locationRef → mapPosition`.  
10. Block same-turn reveal→complete in `questPlay` / warden.

---

## Sources (accessed Aug 14, 2026)

Skyrim quest markers / journal mods · RPG Maker journal threads · Hidden Door / F&F / AID from prior SynapticGM research · playtest tier mismatch

---

## Delta vs current code

`Quest` has status/revealed; location often a string; map uses street nodes + map tier as scale; System can invent tier labels. Need Place authority + mapScale ≠ dangerTier wiring.
