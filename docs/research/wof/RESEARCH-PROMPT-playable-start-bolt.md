# WOF — bolt.new playable-start prompt (this chat)

Paste the fenced block into bolt.new. Download **`WOF_PlayableStart_Dump.md`**. Drop that file in this chat.

Do not re-run gap-fill or go-live.

---

```
You are doing design research for WOF (World of Fantasy), a later-release text MMO platform. NOT live SynapticGM. No production code.

IP: genre PATTERNS only. No licensed settings as WOF content (no Warcraft, Pokémon, Palworld, Middle-earth, MHA, Genshin, Harry Potter, Warhammer unique names, Elder Scrolls unique names, D&D unique setting names). You MAY name real games as SOURCES.

FILE OUTPUT (mandatory)
1. Create ONE new file at project root: WOF_PlayableStart_Dump.md
2. Put the ENTIRE dump in that file, not only in chat.
3. Tell the user: "Download WOF_PlayableStart_Dump.md from the bolt.new file tree."
4. Do not split into multiple files.

LOCKED (do not contradict)
- Code owns dice, HP, catalogs, quest ticks, talent unlocks, loot, gold, deeds, listings, lockouts. LLM narrates only; never invert ledgers.
- First ship: Tier 3 shared hubs + instanced combat. Strangers never merge fights. Idle hub = 0 LLM unless that player acts.
- Combat: lockstep rounds, not twitch. manual OR plan-auto; one runMode per encounter. Pause auto on phase/adds/interrupt/ally-down/Stop.
- Raid size 10, weekly per-character per-boss lockout. Finder friends-first. Hub NPCs durable. Loot v1 personal.
- Join locks after first combat; wipe → checkpoint. Dungeon narration Mode A. Raid narration later.
- AH v1 buyout-only + escrow; region AH (Ash Seat / Tidehold). Housing v1 bought deeds; guests friends-only. Personal merchant deals (copies).
- Authoritative server. Per-player LLM budget. Never sell combat outcomes, lockout skips, or random POWER packs.
- Story first, then System window. Never System-only turns. Protest/talk = dialogue, not a physical lunge. Describe the room before any creature.
- Kid Mode: no IAP/ads; slurs masked; fun swear swap + PIN.
- Name freeze: Circuit Arc = shonen tournament; Starwake = space opera; Stage Light = idol/school. Do not swap those.
- Working names: Ash Compact, Tide Covenant, Hearthborn, Lanternfolk, Saltkin, Stonevein, Reedfen, Lampwood, Brinewatch, Granite Stair, Millcross, Wickhaven, Coil Pier, Anvil Gate, Ash Seat, Tidehold, The Divide, Millstone Hollow / The Millwarden.

ALREADY DONE — summarize in ≤12 lines, then DO NOT redo schemas
EncounterLedger, BattlePlan, Millstone Hollow 3-phase, sync/late prose roundId, ServerClock, deeds/AH/deals, four memory stores (~2k prompt, catalog lookup max 10), shared catalogs + seed bands, quest/talent code ownership, world-pack validator, skin matrix, go-live 14-point checklist.

FILL THESE GAPS (this is the dump)

## 1) How other games make it work (copy the JOB, never the IP)
Table of ≥12 sources. Columns: source | COPY (job) | AVOID (IP / feel-alike) | WOF v1 pick.
Must include: a MUD (Evennia/Aardwolf/Gemstone-class), Fallen London, Kingdom of Loathing, Hidden Door, Friends & Fable, Summon Worlds, AI Dungeon, WoW starting-zone SYSTEMS, FFXIV duty-finder JOB, EVE or Albion economy JOB, a cozy/farm session pattern, a collection-log UI pattern (not that franchise).
Cover: persistence/identity, short sessions, empty-hub problem, commands vs free text vs buttons.

## 2) First hour (Ash Compact / Reedfen / Hearthborn)
- Create: account vs character vs skin; race kit; name rules (licensed-name reject); starter kit (code).
- First 5 minutes: spawn Place + first authored beat. LLM writes prose; code owns Place + first quest id.
- First 30–60 min: 8–12 authored beats that teach Place, dialogue, System-after-story, lockstep combat, journal ticks, other players visible but not merged, safe logout.
- First group: when to offer 2–5 instance; solo-able first dungeon vs wait-for-friend (pick v1 + why).
- Tutorial failure modes: info-dump, System before story, forced MP, LLM inventing a different town.
Interfaces: TutorialBeat, StarterKit, FirstHourFlags.

## 3) Vertical slice / content budget
Reedfen-only friends alpha: counts for POIs, durable NPCs, quest beats, local catalog species (12–20 not 400), talent nodes, one 5-man (rooms/trash/boss).
Build order. Three gates: friends alpha | F&F | public v1 — what may be missing at each (other starts, raid, housing build, other skins).
Recommend: ONE world (Ash Compact) at public v1. Argue Hearth Season second slice yes/no.

## 4) Social + safety
v1: FriendEdge, block/ignore, party, tell + hub say. Guilds = v2 schema only; NO guild bank v1.
Global general chat: recommend yes/no and why text MMOs die from it.
Grief table: AH scam (escrow exists), name impersonation, spam, hate, sexual content toward minors, housing troll, lure, LLM-jailbreak via chat.
CRITICAL: player chat is NEVER raw-injected into the GM prompt. Schema for sanitized nearby speech.
Presence list without waking LLM. Kid Mode: friends-only chat option, no IAP.
Report snapshot (product level only — no exploit PoCs).

## 5) Economy + live ops (design loops, not new AH schemas)
Gold sources vs sinks. Two wallets (gold vs cosmetic tokens) yes/no.
Empty AH at launch: seed vs vendors-only vs open week 2.
Weekly lockout reset as a JOB. What a week contains for raiders vs cozy vs collectors.
Restate: no LLM-minted gold. Leftover John calls stay listed: tick 15/30/60; catch-up 7/14/30; AH unified vs split; tax 0/5/10; seize 2/3/4 weeks; free daily LLM tokens.

## 6) Combat feel + session length (not new ledgers)
Word budget per round. Prose MUST include action + visible result; MUST NOT invent HP.
Targets: 15 min / 45 min / 90 min / raid night.
Default runMode for first 5-man (manual vs plan-auto). Raid Mode C vs A stays a John call.
Rest/wipe/checkpoint UX copy. Plan-auto Stop copy a player understands.

## 7) Ash Compact bible (Reedfen playable, others outlined)
Culture kits: 4 races, half page each, folklore analog ONE line (inspiration only).
Reedfen: 6–10 POIs (id, name, dangerTier vs mapScale — street stays low danger). Durable NPC each. Exits. Street outdoor map.
Quest DAGs code-completeable: Hearthborn race chain; miller or lantern profession; one local zone story (not save-the-world). Objectives: visit/deliver/ledger/talk flags.
First 5-man: original name, 4–6 rooms, room-before-creature, fog.
Local catalog 12–20 templates + starter items.
Ban-list ≥30 licensed/lookalike traps.
Tide Covenant: half page so four starts are not copy-paste — not a second full bible.
Millstone Hollow: one lore page; do not resize the raid.

## 8) Failure modes (max 15)
Empty log, LLM town-swap, chat in GM prompt, gold dupe via prose, global chat toxicity, four skins at once, 400-species catalog, raid before 5-man works, auto through interrupt, late prose overwrites HP.

## 9) John's remaining calls (max 12, numbered)
Include: skip vs mandatory tutorial; solo-able first dungeon; character slots 1/3; show strangers in first hub; Reedfen-only alpha vs 4 starts; raid in F&F vs public; second skin at v1; global chat; friends-only presence; two wallets; default 5-man runMode; profession miller vs lantern.

RULES
- TypeScript-like interfaces where useful. Tables. Mark speculation.
- Original names only in WOF examples.
- Do not design 25-man raids. Do not rewrite locked schemas.
- Do not change live SynapticGM.
```
