# WOF — copy-paste research prompt (multiplayer / dungeons / raids)

Paste the block below into a research model (web search on). Save the reply as `docs/research/wof/pack-09-dump-YYYY-MM-DD.md`. Do not implement. Do not touch live SynapticGM.

---

```
You are doing design research for WOF (World of Fantasy), a later-release text RPG. This is NOT the live game. Do not write production code. Do not import licensed settings.

GOAL
Recommend how a massive *text* game can support:
1) general multiplayer (presence in a shared world)
2) group dungeons (party 2–5)
3) raids (8–12 first; NOT 25–40)

WOF already decided:
- Code owns dice, HP, loot rarity, dungeon seed, quest state, lockouts.
- LLM narrates only; it must not invent kills, heals, loot, or quest titles.
- Outdoor map = street pins/paths. Indoor/dungeon = node graph.
- World content is ORIGINAL. Folklore (human/elf/dwarf) may inspire a kit. Do not use another game’s unique races, factions, cities, bosses, raid names, or creatures as WOF content.
- Working names only if you need examples: Ash Compact, Tide Covenant, Hearthborn, Millcross, Reedfen, Millstone Hollow (toy raid).

PRODUCT CONSTRAINTS
- Turns + LLM latency: reject real-time “twitch” MUD combat unless you prove it works with ~2–8s model delay.
- One EncounterLedger (code) is truth: HP, round, phase, seed, loot, lockout.
- Each player gets a VIEW: System recap (numbers from ledger) + optional short prose that must not invert the ledger.
- Two parties may run the same dungeon TEMPLATE with different seeds at once.
- Strangers must NOT merge into one combat because they share a hub Place.
- Scheduled raid sessions are allowed. WOF does not have to be a 24/7 MUD on day one.
- If a 5-player dungeon round is unaffordable (tokens × N × rounds), say so and mark raids OUT for v1.

SOURCES (method only — copy patterns, not worlds)
- Evennia turnbattle / turn-based combat handler (initiative, timeout, simultaneous resolve, join/flee)
- Text MMOs: instanced group PvE, group scaling (pattern only)
- Friends & Fables: party size honesty; do NOT copy LLM-owned inventory/HP
- StoryNexus: Place (where you stand) vs Setting (which rules apply)
- Public MMO design talks: hub-and-spoke, empty quest log = empty world — method only

OUTPUT FORMAT (mandatory)
Write a single dump with these sections. Use copy/avoid tables. Propose schemas in typed pseudocode.

## 0) IP check
Confirm no licensed races/places/bosses used as WOF content.

## 1) General multiplayer (overworld)
Compare presence tiers:
0 solo · 1 async traces (“someone was here”) · 2 party 2–5 one scene · 3 shared hubs + instanced dungeons · 4 contested PvP/market
Recommend a FIRST-SHIP cap and why. Cover: narration (one GM per player vs one GM per room), chat vs shared prose, NPC authority if two players talk to the same hub NPC, griefing, LLM cost in a busy hub.

## 2) Time model (9a)
Recommend ONE time model for party dungeons, and whether raids use the same handler.
Cover: ready-check + simultaneous round vs sequential initiative vs real-time; AFK/disconnect mid-fight; play-by-post for overworld vs raids.

## 3) Party dungeon instance (9b)
Schema for PartyInstance + shared seed.
Answer: leader; who can pull; join mid-run (enter / first combat / locked); loot (personal / need-greed / leader assign — code rolls); wipe (checkpoint / reset / entrance); map (entrance pin → node graph inside); parallel parties.

## 4) Combat handler + narration fan-out (9c) — STOP GATE
Schema for EncounterLedger.
Round recap MUST be a code table in every client (who hit whom, HP).
Pick LLM mode per kind:
A one shared paragraph · B N personal 2-sentence beats · C no LLM mid-combat (System only) · D A+B
Estimate tokens × N × rounds for: 15-round 5-man; 25-round 10-man. Prose length cap to avoid MUD spam.
If 5-man is unaffordable, say RAIDS = OUT and skip section 5 beyond a stub.

## 5) Raid encounter scripts (9d) — only if 9c passes
Raid is a phase graph, not more HP.
Recommend size: 8 vs 10 vs 12.
Schema: phases[] { id, hpPctTrigger, addSpawns, soakCheck, interruptWindow, enrageRound }
Roles as original CODE FLAGS (soak / cleanse / interrupt) — do not clone licensed role names.
Wipe, checkpoint, lockout (per-character vs clock). Ready check, marks, leader.
How much LLM in a 20-round boss? Default: 0 mid-combat unless 9c proves cheap. LLM may announce phase changes from tokens.
Include ONE toy original 3-phase script named Millstone Hollow (no licensed mechanics-as-identity).

## 6) Sessions, matchmaking, grief, host (9e)
Friends-only vs public finder. Kick, loot-ninja, pull without ready.
Who hosts EncounterLedger (authoritative server vs host-player)? Scheduled raid vs persistent instance.
Cross-faction: instanced-only until overworld cap allows it.

## 7) Failure modes
At least: LLM inverted kill; N novels per round; hub combat merge; 25-man because “big games do that”; real-time curing combat; sharing one seed across parties; licensed encounter clones.

## 8) WOF bar + open decisions
Table: Party dungeon bar · Raid v1 bar · Overworld cap · What is explicitly later.
List decisions only John can make (max 8).

RULES
- Prefer public, citable sources. Mark speculation.
- Do not dump another game’s lore, maps, or raid walkthroughs.
- Do not recommend replacing code authority with the LLM.
- Do not design 25/40-player raids.
```
