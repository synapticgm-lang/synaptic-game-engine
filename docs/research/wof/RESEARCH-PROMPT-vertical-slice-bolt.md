# WOF — bolt.new vertical slice / launch-content prompt

Paste into bolt.new. Download **`WOF_VerticalSlice_Dump.md`**. Drop it in this chat or `docs/research/wof/pasted/`.

---

```
You are doing design research for WOF (World of Fantasy), a later-release text MMO. NOT live SynapticGM. No production code. Original names only. No licensed races/places.

FILE OUTPUT
1. One file: WOF_VerticalSlice_Dump.md
2. Tell the user to download it from the bolt.new file tree.

LOCKED
- First official world: Ash Compact (fantasy MMO skin). Tide Covenant is the sibling faction in the same world.
- 2 factions, 4 races, 4 starting zones, 2 capitals (Ash Seat, Tidehold). Toy raid: Millstone Hollow (10-man), later than alpha if needed.
- Code owns Place graph, quest DAG, catalogs, talent nodes, loot.
- Go-live checklist already exists (14 points). This dump is HOW MUCH CONTENT for alpha / friends-and-family / public v1 — not another checklist.

ALREADY DONE
Systems schemas. Do not redo AH/housing/combat.

FILL

## 1) What “vertical slice” means here
One player can: create, play 2–3 hours in ONE starting zone, enter ONE 5-man (or solo-scaled) instance, return to hub, see AH+deals UI even if empty, log out, log back into the SAME Place.
Friends can: meet in Millcross, run that 5-man, not raid.

## 2) Content budget (numbers + why)
For Reedfen-only alpha:
- Places / POIs
- Named durable NPCs
- Authored quest beats (race + profession + zone story)
- Species in the local catalog (not the whole world bestiary)
- Talent nodes available in the slice
- Vendor deals (personal copies)
- One instance: rooms, trash count, boss
Cite how small MUDs, Fallen London early-game, WoW alpha, and Hidden Door atlases scoped first content (patterns, not their maps).

## 3) Build order (what to author first)
Ordered list: Place graph → race kit → first-hour beats → local catalog → 5-man → journal → hub presence → AH empty-state → Millstone Hollow (later).
What can stay stubbed (Tidehold, Granite Stair, raid) without breaking the slice.

## 4) Three ship gates
| Gate | Who plays | Must work | May be missing |
Alpha friends | John + friends | Reedfen slice + 5-man | other 3 starts, raid, housing build |
F&F | larger | 4 starts + both capitals as hubs | raid lockout polish |
Public v1 | strangers | friends-first finder + 1 raid | world builder, other skins |

## 5) Skin freeze for v1
Recommend: ship ONE world (Ash Compact) at public v1. Other skins are later. Say why (ops, ban-lists, catalogs).
Optional: Hearth Season as a second slice ONLY if cozy is the test audience — argue yes or no.

## 6) Staffing / time (speculative, mark it)
Rough: hours to author Reedfen vs generate-and-regret. Why authored skeleton + LLM fill (already locked) beats LLM continents.

## 7) Failure modes
Too many zones, empty log, catalog of 400 unused species, raid before the 5-man works, four skins at once.

## 8) John's calls (max 6)
Alpha = Reedfen only vs all 4 starts; raid in F&F vs public only; second skin at v1 yes/no.

RULES
- Tables. Original names. No licensed zone layouts.
- Do not change live SynapticGM.
```
