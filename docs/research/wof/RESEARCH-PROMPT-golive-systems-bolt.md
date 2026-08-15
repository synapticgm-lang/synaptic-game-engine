# WOF — bolt.new go-live systems prompt

Paste into bolt.new. Download **`WOF_GoLive_Systems_Dump.md`**. Drop it in this chat or `docs/research/wof/pasted/`.

---

```
You are doing design research for WOF (World of Fantasy), a later-release text MMO platform. NOT live SynapticGM. No production code. No licensed settings (no Warcraft, Pokémon, Palworld, Middle-earth, MHA, Genshin, Harry Potter, etc.). Genre patterns only.

FILE OUTPUT (mandatory)
1. Create ONE new file at project root: WOF_GoLive_Systems_Dump.md
2. Entire dump in that file, not only chat.
3. Tell the user: "Download WOF_GoLive_Systems_Dump.md from the bolt.new file tree."
4. Do not split files.

LOCKED (do not contradict)
- Code owns dice, HP, catalogs, quest ticks, talent unlocks, loot, gold, deeds, listings. LLM narrates only.
- Shared world catalog vs per-player progress. Everyone’s monster/collection LIST is the same templates; spawn stats vary by seed inside bands.
- Instances: lockstep rounds, plan-auto, raid size 10 for MMO skins; cozy/idol/sports may use smaller “big” instances.
- Personal merchant deals; AH buyout+escrow; housing guests friends-only v1; authoritative server; per-player LLM budget.
- Never sell combat outcomes, lockout skips, or random POWER packs.
- Working names: Ash Compact, Bonded Menagerie, Circuit Arc, Hearth Season, Starwake, Millstone Hollow.

ALREADY DONE (summarize in 10 lines max, then DO NOT redo)
Combat ledgers, Millstone Hollow, sync, deeds/AH/tick, skins list, audience modules. Solo memory Pack 6 method exists — EXTEND to MMO.

FILL THESE GAPS (schemas + copy/avoid + what players want)

## 1) Massive memory (MMO scale)
Four stores: World catalog (shared), World sim, Player memory, Instance memory.
How to retrieve into a ~2k prompt (current Place, active quests, 1 topic). Never raw chat. Never tier-gate pins.
Entity-graph vs keyword WI: copy/avoid (Summon Worlds / AI Dungeon / Pack 6).
How a shard of many players does not dump the whole bestiary into one prompt.

## 2) Shared catalogs + stat variance
SpeciesTemplate / ItemTemplate / CardTemplate / FrameTemplate fields.
What is identical for all players (id, name, collection index, type).
What seed may vary (HP, atk, nature, trait) and the ± band.
PlayerCollection: seen/caught/none + nickname. Must not edit the template.
Per rules module: bond_type, hp_check, card_lane, frame_heat, cozy_tick — what extra fields.

## 3) Quest families
Race, profession, faction, zone story, optional personal.
Objective types CODE can complete (visit placeId, deliver itemId, ledger kill/catch count, reputation).
Min turn gaps. Hidden quests omitted from GM. DAG examples using original names only (Reedfen Hearthborn chain; miller profession chain).
What LLM may fill (dialogue) vs must not (quest complete).

## 4) Talent trees (or cozy recipe book)
Node schema: id, cost, requires[], effect (code flags).
Points per level, respec. No pay-to-unlock.
Different trees per module (combat vs bond vs cultivation vs cozy).
Public talent-tree PATTERNS only — do not copy a licensed tree.

## 5) Housing BUILD + profession → shop
v2 build: plot, recipe (item ids + ticks), interior kit.
How craft output becomes shop stock / AH listing.
Upkeep formula sketch (speculative, mark it).

## 6) What people like in TEXT MMOs / MUDs / Fallen London / KoL / AI party RPGs
Sentiment table: persistence, identity, collection, housing, friends, short sessions, story.
Hates: empty quest log, LLM math, host-pays, P2W, mandatory long raids.
Split audiences: raiders / cozy / collectors / story / anime-school / sci-fi.
Cite public sources. No ripping their worlds.

## 7) World builder (player-made worlds later)
World-pack format (YAML/JSON) matching official skins: places, kits, catalogs, quests, trees, rulesModuleId, maturity, ban-list.
Validator rules (missing catalog id = fail).
Go-live checklist for a creator world (14 points).
Moderation: what creators must not ship (licensed names, CSAM, P2W).
Patterns: Evennia builder, Hidden Door Atlas, Summon Worlds — tools not content.
UGC-as-Roblox = v3, say why (moderation).

## 8) Official skin go-live matrix
Rows = Ash Compact, Bonded Menagerie, Circuit Arc, Hearth Season, Starwake (and note others inherit).
Columns = rules module, catalogs, quests, tree/recipes, 5-man, big instance type, housing, economy, memory, maturity.
Cell = required / optional / n/a.

## 9) Failure modes + John's calls (max 8)
Memory bloat, catalog drift, talent pay-to-win, collection selling power, creator licensed names, prompt stuffed with full bestiary.

RULES
- TypeScript-like interfaces.
- Mark speculation.
- Original names only in examples.
- Do not design 25-man raids.
- Do not change live SynapticGM.
```
