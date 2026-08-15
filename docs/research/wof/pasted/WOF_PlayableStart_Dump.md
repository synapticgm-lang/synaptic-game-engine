# WOF (World of Fantasy) — Playable Start Dump

**Date:** August 15, 2026
**Status:** Design research for WOF, a later-release text MMO platform. NOT live SynapticGM. No production code. No licensed settings.
**Purpose:** Fill the remaining gaps for a playable first hour, vertical slice budget, social/safety, economy/live-ops, combat feel, Ash Compact bible, failure modes, and John's remaining calls. EXTENDS prior dumps; does not redefine locked schemas.

---

## IP Check

All names, mechanics, factions, places, races, and species below are original to WOF. Genre patterns referenced from public/citable sources are cited as methodology (the JOB the source does), never copied content, names, lore, or art. No licensed setting content is used or implied. Working names are original placeholders.

---

## Already Done (Summary — Do Not Redo)

1. EncounterLedger, BattlePlan, Combatant, RoundAction, RoundResult — lockstep rounds, manual/plan-auto, one runMode per encounter.
2. Millstone Hollow 3-phase raid script (RaidEncounterScript, Phase, SoakCheck, InterruptWindow, RoleFlag). Size 10, weekly per-character per-boss lockout. Not resized here.
3. Sync payload, late narration, roundId binding, late prose rules.
4. ServerClock, tick model, deeds/AH/deals, catch-up cap, mail digest.
5. Four memory stores (~2k prompt, catalog lookup max 10, 1 pinned topic, never raw chat, never tier-gate pins).
6. Shared catalogs (SpeciesTemplate/ItemTemplate/CardTemplate/FrameTemplate) + seed bands (HP ±15%, atk/def/speed ±10%).
7. Quest families (race/profession/faction/zone_story/optional_personal), code-completable objectives, DAG examples, hidden quests omitted from GM.
8. Talent trees (node schema, cost, requires[], code flags, respec free + cooldown, no pay-to-unlock, per-module trees).
9. World-pack validator (12 checks), go-live 14-point checklist, moderation rules, UGC deferred to v3.
10. Official skin go-live matrix (Ash Compact, Bonded Menagerie, Circuit Arc, Hearth Season, Starwake).
11. Failure modes: memory bloat, catalog drift, talent P2W, collection power-selling, creator licensed names, full-bestiary prompt stuffing, quest auto-complete by LLM, cozy tick gold explosion, world-pack prompt injection, frame heat exploit.
12. Player sentiment table (Fallen London, KoL, MUDs, AI party RPGs) — likes/hates, split audiences.

---

## 1) How Other Games Make It Work (Copy the JOB, Never the IP)

| # | Source | COPY (the job it does) | AVOID (IP / feel-alike trap) | WOF v1 Pick |
|---|--------|----------------------|----------------------------|-------------|
| 1 | **Evennia** (open-source MUD framework) | Builder pattern: declarative rooms/exits/NPCs, batch scripts, persistent world state, server-authoritative. Commands as primary input. | Don't copy Evennia's Python API or command syntax. WOF uses buttons+free-text, not `@py` commands. | Server-authoritative world state; declarative place/NPC definitions; builder pattern for world packs (v2). |
| 2 | **Aardwolf** (MUD) | Tiered zones with level bands; "campaigns" (daily quest equivalents); player-run clans; persistent character identity across sessions. | Don't copy Aardwolf's specific zone names, class names, or MUD-protocol features. | Level-banded zones; daily/weekly quest ticks; persistent identity; guilds deferred to v2. |
| 3 | **Gemstone IV** (MUD) | Live GM-run events; deep NPC roleplay; text-first atmosphere; long-session social hub. | Don't copy Gemstone's setting (Elanthia), specific mechanics, or proprietary engine. | Authored zone-story beats (code-driven, not live-GM); durable NPCs with short memory; hub atmosphere. |
| 4 | **Fallen London** (Failbetter) | Storylet structure (bite-sized choices); short 10–20 min sessions; persistence without grind; collection of lore; no mandatory multiplayer; writing quality as core feature. | Don't copy Fallen London's setting (Neath, Sunless Sea lore), specific storylets, or Echoes energy system. | Storylet-style hub interactions; short-session loop; authored beats; journal auto-ticks. |
| 5 | **Kingdom of Loathing** (Asymmetric) | Daily turn limit creating short-session loop; collection (trophies, familiars); player-run economy (mall); community (clans); humor as identity. | Don't copy KoL's classes, items, jokes, or specific mechanics. | Daily turn/token budget; collection log; player shop + AH; humor is WOF's own, not KoL's. |
| 6 | **Hidden Door** (commercial) | Code-level narrative guardrails (dictionary filter + card system); creator retains IP; listed/unlisted publishing; revenue share; human-authored scaffolding. | Don't copy Hidden Door's card-based state model, trope system, or specific IP partnerships. | Code warden (not LLM); world-pack validation; creator IP retention (v2+); authored beat scaffolding. |
| 7 | **Friends & Fables** (Side Quest Labs) | Retrieval-based memory (auto-memories every 5 turns); @mentions; worldbuilding suite with FK relationships; friends-play-free model. | Don't copy F&F's Franz AI personality, D&D 5e SRD mechanics, battlemap tokens, or tier-gated memory. | Auto-summarized memory (Pack 6 extended); entity-graph retrieval; no tier-gating; no battlemap. |
| 8 | **Summon Worlds** (OpenForge) | Interconnected entity graph (FK relationships); Bound Chat context injection; collaborative worldbuilding; discovery feed. | Don't copy Summon Worlds' entity types, UI, or specific world model. | Entity-graph catalog (already done); retrieval from current Place (max 10 entries); world packs (v2). |
| 9 | **AI Dungeon** (Latitude) | Keyword-triggered World Info as a concept; context budget triage; free-text input as secondary option. | Don't copy AI Dungeon's WI syntax, specific models, or fully-freeform narrative (WOF is code-authoritative). | Keyword WI as fallback only (v3 UGC); curated buttons primary, free-text secondary; code owns truth. |
| 10 | **WoW starting-zone SYSTEMS** (Blizzard) | The JOB: phased onboarding (tutorials woven into early quests, not a separate mode); breadcrumb quests leading from hub to first dungeon; class-ability gating (unlock abilities one at a time). | Don't copy WoW's races, zones, lore, class names, ability names, or UI. Don't copy "Exile's Reach" structure verbatim. | Phased first-hour beats (8–12 authored); breadcrumb quest from hub to first 5-man; talent nodes unlock one at a time. |
| 11 | **FFXIV duty-finder JOB** (Square Enix) | The JOB: role-based matchmaking (tank/healer/DPS); dungeon finder with friends-first priority; daily roulette incentive; clear, readable role icons. | Don't copy FFXIV's classes, jobs, races, setting, or specific duty-finder UI. | Friends-first finder (already locked); role tags on party slots; daily dungeon token incentive (speculative). |
| 12 | **EVE Online economy JOB** (CCP) | The JOB: player-driven market with buy/sell orders; regional markets; scarcity drives conflict; industrial players supply combat players. | Don't copy EVE's ships, factions, nullsec, or specific market mechanics. | Region AH (Ash Seat / Tidehold); buyout-only v1 (simpler than EVE's order book); crafters supply raiders. |
| 13 | **Albion Online economy JOB** (Sandbox Interactive) | The JOB: full-loot risk/reward creates economic velocity; player-crafted gear is the primary gear source; local markets create regional trade routes. | Don't copy Albion's factions, biomes, or specific crafting tree. | Player-crafted gear as primary (housing build → shop stock); NO full-loot (WOF is not hardcore); region AH creates trade routes. |
| 14 | **Stardew Valley / Animal Crossing cozy session pattern** | The JOB: 15–20 min daily session loop (check crops, talk to NPCs, do one task); low-stakes progression; decorating as identity; seasonal events. | Don't copy Stardew's characters, Animal Crossing's villagers, or specific festival designs. | Hearth Season cozy tick (already done); 15-min daily loop; decor as identity; seasonal events (speculative). |
| 15 | **Collection-log UI pattern** (genre-wide: OSRS collection log, Pokémon Pokédex structure — the JOB not the IP) | The JOB: "seen X of Y" counter; silhouette for unseen entries; detail page for seen entries; completion percentage; no spoilers for un-discovered content. | Don't copy OSRS's specific items, Pokémon's species, or any franchise's exact UI. | PlayerCollection (already done): seen/caught/none + silhouette for unseen; "47 of 200" counter; no full bestiary in prompt. |

### Coverage Notes

| Concern | Best Source to Copy From | WOF Approach |
|--------|------------------------|-------------|
| **Persistence / identity** | MUDs (Evennia, Aardwolf, Gemstone) | Server-authoritative state; persistent character; durable NPCs; world sim ticks. |
| **Short sessions** | Fallen London, KoL, Stardew/AC | Storylet-style hub beats; daily turn/token budget; 15–45 min loops. |
| **Empty-hub problem** | MUDs (who's online), FFXIV (duty finder fills groups) | Friends-first finder; durable NPCs give life; idle hub = 0 LLM cost; visible presence list (no LLM wake). |
| **Commands vs free text vs buttons** | Hidden Door (mediated input), AI Dungeon (free text), MUDs (commands) | Buttons primary (code-generated from ledger); free-text secondary (mediated); no raw command syntax. |

---

## 2) First Hour (Ash Compact / Reedfen / Hearthborn)

### Goal

Define the onboarding flow from account creation through the first 30–60 minutes. Teach the player the core loop (Place → dialogue → System-after-story → lockstep combat → journal tick) without info-dumping. Other players are visible but not merged. Safe logout is always available.

### v1 Rules

- **Account vs character vs skin:** Account is the player's real-world identity (email, login). Character is the in-game avatar (name, race, appearance). Skin is the rules module / world (Ash Compact, Bonded Menagerie, etc.). One account → multiple characters → one skin per character (speculative: 1 or 3 character slots — John's call #3).
- **Race kit:** Each race has a starting kit (code-owned): a racial ability flag, a starting item, and a starting Place. Race is chosen at character creation. Race determines the starting hub (Reedfen for Hearthborn, etc.).
- **Name rules:** Licensed-name reject at character creation. Code checks against platform blocklist (licensed names + lookalikes). If rejected, the player must choose another name. No "Legolas," no "Gandalf," no "Pikachu," no "Geralt."
- **Starter kit:** Code-owned. Every character gets: starter weapon (race-appropriate), starter armor (T1), 5 healing items, 1 salvage/repair item, and the first quest ID. No LLM invention.
- **First 5 minutes:** Player spawns at a Place (code-owned). The first authored beat fires. LLM writes 2–6 sentences of prose describing the Place. Code owns the Place ID and the first quest ID. The journal is EMPTY until the first quest is accepted.
- **First 30–60 min:** 8–12 authored beats teach: Place navigation, dialogue with an NPC, System window after story, lockstep combat (first encounter), journal tick (quest accepted → quest updated), other players visible in hub (but not merged into the player's instance), safe logout.
- **First group:** The first 5-man dungeon is solo-able in v1 (see John's call #2). The player can enter alone or with friends. Strangers are not auto-merged. Friends-first finder is available but not required for the first dungeon.
- **Tutorial failure modes:** Info-dump (all mechanics at once), System before story (System window appears before any prose), forced multiplayer (player can't proceed without a group), LLM inventing a different town (LLM names a place that doesn't match the code-owned Place ID).

### Interfaces

```typescript
interface TutorialBeat {
  id: string;                               // "tutorial_beat_01_spawn"
  turnIndex: number;                         // which turn this beat fires (1, 2, 3...)
  beatType: "spawn" | "dialogue" | "combat_intro" | "journal_tick" | "system_intro" | "other_players" | "logout_safe" | "place_navigate" | "quest_accept";
  placeId: string;                           // where the player is during this beat
  questId: string | null;                    // quest introduced/advanced by this beat
  systemReveal: SystemReveal | null;         // what System chrome to reveal (if any)
  requiresPreviousBeat: string | null;       // previous beat that must be complete
  isOptional: boolean;                       // can the player skip this beat?
}

interface SystemReveal {
  feature: "journal" | "character_tab" | "salvage" | "map" | "combat_ui" | "talent_tree" | "quest_log";
  revealCopy: string;                        // System registrar line (shared)
  // Example for journal: "Journal initialized. Quest entries will appear here."
}

interface StarterKit {
  kitId: string;                             // "starter_ash_compact_hearthborn"
  raceId: string;
  skinId: string;
  items: StarterItem[];
  startingPlaceId: string;
  startingQuestId: string;
  racialAbilityFlag: string;                 // e.g., "hearthborn_warmth" (passive)
}

interface StarterItem {
  itemId: string;
  quantity: number;
  isEquipped: boolean;
}

interface FirstHourFlags {
  hasSpawned: boolean;
  hasSeenProse: boolean;
  hasAcceptedFirstQuest: boolean;
  hasCompletedFirstDialogue: boolean;
  hasCompletedFirstCombat: boolean;
  hasSeenJournalTick: boolean;
  hasSeenOtherPlayers: boolean;
  hasSeenSystemWindow: boolean;
  hasSafeLoggedOut: boolean;
  // All false at account creation. Set true as beats fire.
  // Used by code to gate which beats are available next.
}
```

### First Hour Beat Sheet (8–12 Beats)

| Beat | Turn | Type | What Happens | Code Action | LLM Prose | System Reveal |
|------|------|------|--------------|------------|-----------|----------------|
| 1 | T1 | spawn | Player spawns at Reedfen Square. | Set `currentPlaceId`. Grant StarterKit. Set `hasSpawned = true`. | 2–4 sentences: describe Reedfen Square. The air, the light, the stone. A Hearthborn elder is nearby. | None (journal empty) |
| 2 | T2–T3 | dialogue | Player talks to the Hearthborn elder (durable NPC). Elder gives first quest. | Set `hasSeenProse = true`. Reveal quest accept button. | 2–4 sentences: the elder speaks. Unique dialogue (not canned). | None |
| 3 | T4 | quest_accept | Player accepts first quest ("The Hearthborn's Request"). | Set `hasAcceptedFirstQuest = true`. Add quest to journal. Set `startingQuestId` active. | 2–3 sentences: the elder acknowledges. | Journal: "Journal initialized. Quest entries will appear here." |
| 4 | T5–T6 | place_navigate | Player navigates to Reedfen Marsh (adjacent pin). | Set `currentPlaceId` to marsh. Reveal marsh pins. | 2–4 sentences: the marsh. Different atmosphere from the square. | Map: "Map available. Pins mark locations of interest." |
| 5 | T7–T8 | combat_intro | First encounter: 2 Reedfen Hatchlings (trash mobs). Lockstep combat. | Create EncounterLedger. Set `runMode = manual` (first fight is manual to teach the system). Set `hasCompletedFirstCombat` on victory. | 3–5 sentences: the hatchlings appear. Describe the room before the creatures. | Combat UI: "Combat initiated. Select your action." |
| 6 | T9 | journal_tick | After combat, journal updates with kill count. | Update quest objective (ledger_kill count). Set `hasSeenJournalTick = true`. | 2–3 sentences: the aftermath. | Journal: "Quest updated: Reedfen Hatchlings 2/3." |
| 7 | T10–T11 | system_intro | System window appears after story for the first time. | Set `hasSeenSystemWindow = true`. Show System recap table. | (Already written in beat 5/6 prose — this beat is the System reveal itself.) | System recap: "ROUND RECAP — Victory. XP +20. Loot: Reedfen Scale x1." |
| 8 | T12–T13 | other_players | Player returns to Reedfen Square. Other players are visible (presence list). | Set `hasSeenOtherPlayers = true`. Show presence list (names + race, no LLM wake). | 2–3 sentences: the square is a bit busier. A few figures you don't recognize. | Presence: "3 other players in Reedfen Square." |
| 9 | T14–T15 | dialogue | Player returns to elder, delivers Reedfen Scale. | Complete first quest objective. Grant reward (gold, XP). | 2–4 sentences: the elder receives the scale. | Journal: "Quest objective complete: Reedfen Scale delivered." |
| 10 | T16–T18 | place_navigate | Player explores Reedfen — finds the first 5-man entrance (Lampwood Gate). | Reveal Lampwood Gate pin. Set as dungeon entrance. | 2–4 sentences: a gate at the edge of the marsh. Something stirs beyond it. | Map: "Dungeon entrance discovered: Lampwood Gate." |
| 11 | T19–T20 | logout_safe | Player is shown how to safely log out. | Set `hasSafeLoggedOut = true` (flag set when player opens menu or sees the prompt). | 2–3 sentences: the elder mentions rest. | System: "Safe logout available. Progress is saved." |
| 12 | T21+ | free_play | First hour complete. Player is free to enter Lampwood Gate (solo or with friends), explore, or log out. | Remove tutorial gating. Enable all tabs. | (Authored beats end; normal play begins.) | All tabs visible. |

### Tutorial Failure Modes

| Failure | How It Happens | Prevention |
|---------|---------------|-----------|
| **Info-dump** | All mechanics explained in one wall of text at spawn. | Beats are spread across 8–12 turns. Each beat teaches ONE thing. System reveals are one line each. |
| **System before story** | System window appears before any prose. | Beat 1 is pure prose (spawn). System reveals start at beat 3 (journal) at earliest. Story always first. |
| **Forced multiplayer** | Player can't enter the first dungeon without a group. | First 5-man is solo-able (John's call #2). Friends-first finder is optional, not required. |
| **LLM invents a different town** | LLM names the starting town "Hogwarts" or "Stormwind" instead of Reedfen. | Place ID is code-owned. LLM receives `PLACE_NAME: Reedfen` token. Post-filter rejects prose that doesn't contain the Place name. |
| **LLM skips the room description** | LLM jumps straight to combat without describing the room. | Beat 5 (combat_intro) requires room description before creature. Post-filter checks for room-describing tokens before combat tokens. |
| **Player stuck on first quest** | Quest objective is unclear or impossible to find. | First quest uses visit_place + ledger_kill (simplest objectives). Quest log shows current objective + target place. Map pin marks the target. |

### First Group: Solo vs Wait-for-Friend

**v1 pick: Solo-able first dungeon.**

Rationale:
- A text MMO's first session is usually solo (player just installed, no friends yet).
- Forcing a group for the first dungeon creates a dead end: the player can't proceed, has no friends, and quits.
- The first 5-man (Lampwood Gate) is tuned for solo: reduced mob count, boss has lower HP, no mechanics that require multiple roles.
- With friends: mob count and boss HP scale up (party of 2–5). The dungeon is more fun but not required.
- This matches the FFXIV duty-finder JOB: the first dungeon CAN be done solo (trust system), but grouping is encouraged for speed and social bonding.

---

## 3) Vertical Slice / Content Budget

### Goal

Define what goes into the Reedfen-only friends alpha. Count POIs, NPCs, quest beats, local catalog species, talent nodes, and the first 5-man. Build order. Three gates (friends alpha → F&F → public v1) with what may be missing at each. Recommend one world (Ash Compact) at public v1 and argue whether Hearth Season is the second slice.

### Reedfen-Only Friends Alpha: Content Counts

| Content Type | Count | Details |
|-------------|-------|---------|
| **POIs (Points of Interest)** | 8 | Reedfen Square (hub), Reedfen Marsh, Lampwood Gate (dungeon entrance), Reedfen Pier, Old Mill, Hearthborn Hall, Marsh Edge, Reedfen Crossroads |
| **Durable NPCs** | 6 | Hearthborn Elder (quest giver), Miller (profession), Lantern Keeper (profession), Pier Watcher (local), Hall Keeper (hub), Crossroads Merchant (deals) |
| **Quest Beats** | 12 | 3 race chain (Hearthborn), 3 profession chain (miller), 3 zone story (Reedfen marsh), 3 optional personal |
| **Local Catalog Species** | 16 | 12 species (4 common, 4 uncommon, 3 rare, 1 epic) + 4 trash/hatchling variants. NOT 400. |
| **Talent Nodes** | 12 | 4 tier 1, 4 tier 2, 3 tier 3, 1 ultimate (combat tree only for alpha) |
| **Starter Items** | 10 | 3 weapons, 2 armor, 3 consumables, 1 tool, 1 key item |
| **First 5-Man (Lampwood Gate)** | 5 rooms + 1 boss | Room 1: entrance (no encounter). Room 2: 3 trash mobs. Room 3: 2 trash + 1 elite. Room 4: puzzle/choice room (no combat). Room 5: boss (Lampwood Warden). |
| **Decor Items** | 0 | Housing build is NOT in friends alpha. |
| **AH** | 0 | AH is NOT in friends alpha. Vendors only. |
| **Housing** | 0 | Deeds are NOT in friends alpha. |
| **Raid** | 0 | Millstone Hollow is NOT in friends alpha. |

### Build Order

```
1. Core engine: ServerClock, EncounterLedger, BattlePlan, lockstep rounds, runMode
2. World state: Place graph, NPC templates, street map, fog nodes
3. Memory: 4-store system, Pack 6 auto-summarization, catalog retrieval
4. First hour: 12 tutorial beats, StarterKit, name validation
5. Quest system: DAG, code-completable objectives, journal ticks
6. Talent tree: 12 nodes, respec, talent point grants
7. Local catalog: 16 species templates, seed bands, PlayerCollection
8. First 5-man: Lampwood Gate, 5 rooms, fog, boss
9. Economy: vendors, gold, salvage (no AH)
10. Social: FriendEdge, party, presence list, tell + hub say
11. Safety: block/ignore, report, Kid Mode, chat sanitization
12. Skin system: Ash Compact rules module active; others stubbed
```

### Three Gates

| Gate | What's In | What's Missing | Audience |
|------|----------|---------------|----------|
| **Friends Alpha** | Reedfen only. 8 POIs, 6 NPCs, 12 quest beats, 16 species, 12 talent nodes, Lampwood Gate (solo-able), vendors, gold, FriendEdge, party, presence, tell, block, report, Kid Mode. | No AH, no housing, no raid, no other skins, no other zones, no guilds, no global chat, no world packs. | 10–30 invited friends. Testing core loop, combat feel, first hour. |
| **Friends & Family (F&F)** | Friends Alpha + AH (buyout-only, escrow), housing (deeds, interior kits, friends-only guests), 1 additional zone (Lampwood or Wickhaven), 1 additional 5-man, guilds (v2 schema — NO guild bank), region AH (Ash Seat). | No raid (Millstone Hollow), no other skins, no world packs, no global chat (speculative — John's call #8). | 50–200 friends + family. Testing economy, housing, social, scale. |
| **Public v1** | F&F + Millstone Hollow (10-player raid, weekly lockout), 1–2 more zones, full Ash Compact skin (all 4 races, all starting hubs), Circuit Arc or Hearth Season (if second skin — John's call #7), full talent trees (combat + one more). | No world packs (v2), no UGC (v3), no Bonded Menagerie / Starwake / Stage Light unless second skin is chosen. | Public launch. Testing scale, economy balance, raid, retention. |

### Recommend: ONE World (Ash Compact) at Public v1

**Yes.** Ash Compact is the flagship combat MMO skin. It requires the full feature set (raids, dungeons, housing, economy, talent trees). Shipping one complete world is better than shipping four half-built skins.

Rationale:
- A complete vertical slice (Reedfen → Lampwood Gate → Millstone Hollow → housing → AH) proves the platform works end-to-end.
- Four skins at once means four incomplete experiences. Players hit dead ends in each.
- Ash Compact's combat module is the most complex. If it works, the others (cozy, collection, idol) are simpler to add.
- One world means one set of catalogs, one set of quests, one set of talent trees to build and test.
- Other skins inherit the engine. Building Circuit Arc (shonen tournament) or Hearth Season (cozy) on top of a proven engine is faster than building them in parallel.

### Hearth Season as Second Slice: Yes or No?

**No for public v1. Yes for F&F or post-launch.**

Arguments against (second slice at v1):
- Hearth Season requires a different rules module (cozy_tick, no combat talent tree, recipe book instead of combat tree).
- It requires decor items, farm plots, and cozy-specific housing — all new content.
- It splits the team's attention. Two skins = two incomplete worlds.
- The cozy audience is different from the combat MMO audience. Marketing to both at once dilutes the message.

Arguments for (second slice eventually):
- Hearth Season proves the platform supports multiple rules modules (not just combat).
- It attracts a different audience (cozy players) who won't play Ash Compact.
- It's the simplest non-combat skin to build (no raids, no dungeons, no combat balance).
- It tests the recipe book and cozy tick systems.

**Recommendation:** Ship Ash Compact at public v1. Build Hearth Season as the first post-launch skin (or F&F test). This proves multi-module support without risking v1.

---

## 4) Social + Safety

### Goal

Define v1 social features (FriendEdge, block/ignore, party, tell + hub say). Guilds are v2 schema only — NO guild bank v1. Recommend on global general chat. Grief table. CRITICAL: player chat is NEVER raw-injected into the GM prompt. Schema for sanitized nearby speech. Presence list without waking LLM. Kid Mode chat restrictions. Report snapshot (product level only).

### v1 Social Features

```typescript
interface FriendEdge {
  playerId: string;
  friendId: string;
  status: "pending" | "accepted" | "blocked";
  friendedAt: number;
  // v1: friends list, online status, invite to party.
  // v2: guild membership, guild chat.
}

interface BlockIgnore {
  blockerId: string;
  blockedId: string;
  blockedAt: number;
  type: "block" | "ignore";
  // Block: the blocked player cannot send tells, party invites, or AH messages to the blocker.
  // Ignore: the blocked player's hub say is hidden from the blocker (but they can still be in the same hub).
}

interface Party {
  partyId: string;
  leaderId: string;
  memberIds: string[];
  maxMembers: number;                       // 5 for dungeons, 10 for raids
  instanceId: string | null;                // if in an instance
  isLocked: boolean;                        // join locks after first combat
}

interface TellMessage {
  fromId: string;
  toId: string;
  message: string;                          // mediated text (filtered)
  timestamp: number;
  // Tell = private message. 1:1 only. No group tells in v1.
}

interface HubSayMessage {
  speakerId: string;
  placeId: string;
  message: string;                          // mediated text (filtered)
  timestamp: number;
  // Hub say = local chat in a hub. Only visible to players in the same Place.
  // NOT injected into the GM prompt (see sanitization below).
}
```

### Guilds = v2 Schema Only

```typescript
// v2 only — NOT shipped in v1. NO guild bank in v1.
interface GuildV2 {
  guildId: string;
  name: string;
  leaderId: string;
  memberIds: string[];
  rank: string;                             // "member" | "officer" | "leader"
  // v2 features: guild chat, guild hall (housing), guild bank, guild quests.
  // v1: NOTHING. Guilds do not exist. FriendEdge and Party are the only social structures.
}
```

### Global General Chat: Recommend NO

**Recommendation: Do NOT ship global general chat in v1.**

Rationale:
- Text MMOs die from global chat toxicity. MUDs, MMOs, and AI RPGs all report the same pattern: global chat becomes a firehose of spam, toxicity, and grief. It drives away new players who see it as their first impression.
- Fallen London has no global chat and thrives on story quality.
- KoL has chat but it's heavily moderated and clan-based (not global).
- MUDs have channels but they're small communities (50–200 players). WOF at scale would have thousands.
- Hub say (local chat in a Place) is sufficient for v1 social interaction. Players who want to talk can go to a hub.
- Tell (private message) covers 1:1 communication.
- Party chat covers group communication.
- Global chat adds moderation burden (real-time monitoring, slur filtering, report triage) that a small team cannot handle at v1.
- If global chat is ever added, it should be opt-in, age-gated, and heavily moderated — a v2+ feature.

**v1 communication:**
1. Hub say (local, same Place only)
2. Tell (private, 1:1)
3. Party chat (group, party members only)
4. No global chat
5. No guild chat (guilds are v2)

### Grief Table

| # | Grief Type | How It Happens | v1 Mitigation |
|---|-----------|---------------|---------------|
| 1 | **AH scam** | Player lists a junk item at a high price, hopes someone misclicks. | Escrow exists (already locked). Buyout-only (no bidding wars). No "buy it now" confusion. Price is clearly displayed. No trade window (v1). |
| 2 | **Name impersonation** | Player names themselves "HearthbornElder" or "SystemAdmin" to trick others. | Name validation at creation: reject names containing NPC names, "System," "Admin," "GM," "Mod." Blocklist of reserved names. |
| 3 | **Spam** | Player sends the same tell or hub say repeatedly. | Rate limit: max 5 tells per 30 seconds, max 3 hub says per 30 seconds. Repeat detection (same message 3x → auto-mute 60 seconds). |
| 4 | **Hate speech** | Player uses slurs or targeted harassment in chat. | Automated slur filter (masked in chat). Report button on every message. Human review queue. Kid Mode: stricter filter. |
| 5 | **Sexual content toward minors** | Player sends sexual messages, especially to accounts flagged as minors. | Kid Mode accounts: friends-only chat (no tells from non-friends, no hub say). All chat logged. Automatic escalation to human moderation. Platform-wide ban on first offense. Law enforcement report if illegal content. |
| 6 | **Housing troll** | Player decorates their house with offensive decor or arranges items to spell slurs. | Decor items are code-owned (no free-text decor). No text-on-walls in v1. House visits are friends-only. Report button in housing. |
| 7 | **Lure** | Player tricks another into entering a dangerous instance or giving items. | Join locks after first combat (already locked). No item trading in v1 (no trade window). AH is buyout-only (no barter scam). |
| 8 | **LLM jailbreak via chat** | Player types a jailbreak prompt in hub say, hoping it gets injected into the GM prompt. | Player chat is NEVER raw-injected into the GM prompt (see below). Chat is sanitized before any LLM sees it. |

### CRITICAL: Player Chat Is NEVER Raw-Injected into the GM Prompt

```typescript
// Player chat (hub say, tell, party chat) is NEVER passed as raw text to the LLM.
// The LLM does not see what players say to each other.
// The LLM only sees: the current player's action, the current Place, the ledger state,
// and the 4-store memory slice.

// When a player says something in hub say, the following happens:
// 1. The message is stored in the chat log (code-owned).
// 2. The message is displayed to other players in the same Place (code-rendered).
// 3. The message is filtered for slurs/spam (code-owned).
// 4. The message is NOT added to the GM prompt.
// 5. The GM prompt contains only: PLACE_NAME, PLACE_DESCRIPTION, ACTIVE_QUESTS,
//    PINNED_TOPIC, JOURNAL_SUMMARY, INSTANCE_SNAPSHOT, PLAYER_ACTION.
// 6. PLAYER_ACTION is the current player's input (their action), not other players' chat.

// If the LLM needs to know that other players are present (for atmosphere),
// it receives a sanitized presence token, not chat text:
interface SanitizedNearbySpeech {
  // This is what the LLM MIGHT receive (not raw chat):
  nearbyPlayerCount: number;                // "3 other players are present"
  nearbyPlayerRaces: string[];              // ["Hearthborn", "Stonevein", "Lanternfolk"]
  // That's it. No names, no chat text, no messages.
  // The LLM may narrate "a group of adventurers rests by the fire" but cannot
  // reference specific players or their chat.
}
```

### Presence List Without Waking LLM

```typescript
interface PresenceList {
  placeId: string;
  presentPlayerIds: string[];
  presentPlayerNames: string[];
  presentPlayerRaces: string[];
  // The presence list is code-rendered in the UI (a small panel showing who's in the same Place).
  // It does NOT trigger an LLM call. Idle hub = 0 LLM cost.
  // The LLM is only called when a player takes an action (intent → code → LLM).
  // Other players being present is atmospheric, not a prompt trigger.
}

// Rule: presence is polling-based (client requests every 10 seconds — speculative).
// The server returns the list. No LLM is involved.
// The LLM may receive nearbyPlayerCount as a token in the prompt, but only when
// the player themselves takes an action (not when another player enters).
```

### Kid Mode: Chat Restrictions

```typescript
interface KidModeChat {
  enabled: boolean;
  chatMode: "friends_only";                // ONLY friends can send tells or hub say to this player
  // Non-friends: tells blocked, hub say from this player hidden from non-friends.
  // This player: can only see hub say from friends. Can only send tells to friends.
  noIAP: true;                              // no IAP/ads shown (already locked)
  slursMasked: true;                        // slurs replaced with [masked]
  funSwearSwap: boolean;                    // "damn" → "darn", "hell" → "heck" (configurable)
  pinRequired: boolean;                     // PIN required to exit Kid Mode
}
```

### Report Snapshot (Product Level — No Exploit PoCs)

```typescript
interface ReportSnapshot {
  reportId: string;
  reporterId: string;
  reportedId: string;
  reportType: "spam" | "hate_speech" | "harassment" | "sexual_content" | "impersonation" | "housing" | "other";
  reportedMessageId: string | null;        // chat message being reported (if applicable)
  reportedPlaceId: string | null;
  timestamp: number;
  // What's captured:
  // - The reported message (stored in chat log, retrievable by moderators)
  // - The reporter's note (free text, max 500 chars)
  // - The reported player's recent chat history (last 10 messages — for context)
  // - The reported player's account age and report count
  // What's NOT captured:
  // - No exploit PoCs (this is a product-level report, not a security report)
  // - No GM prompt snapshots (player cannot see what the LLM received)
  // - No internal system state (ledger, memory stores, etc.)
  // Moderation queue:
  // - Reports are triaged by severity (sexual content toward minors = highest priority)
  // - Auto-actions: slur filter auto-mutes for 60 seconds on first offense
  // - Human review: all reports reviewed within 24 hours (speculative SLA)
}
```

---

## 5) Economy + Live Ops (Design Loops, Not New AH Schemas)

### Goal

Define gold sources vs sinks. Decide on two wallets (gold vs cosmetic tokens). Handle empty AH at launch. Weekly lockout reset as a JOB. What a week contains for raiders, cozy, and collectors. Restate: no LLM-minted gold. Keep John's leftover calls listed.

### Gold Sources vs Sinks

```typescript
interface GoldEconomy {
  // SOURCES (code-owned, never LLM-minted)
  sources: GoldSource[];
  // SINKS (code-owned)
  sinks: GoldSink[];
}

interface GoldSource {
  type: "quest_reward" | "vendor_sale" | "loot_sale" | "dungeon_clear" | "raid_boss_first_kill" | "salvage_credit_conversion";
  amountPerEvent: string;                   // e.g., "50–200 gold per quest", "10–50 per vendor sale"
  dailyCap: number | null;                  // null = no cap (speculative)
  // Rules:
  // 1. Gold is ONLY minted by code. The LLM never grants gold.
  // 2. Quest rewards are fixed per quest (code-owned).
  // 3. Vendor sales: player sells items to vendors at fixed prices.
  // 4. Loot sales: player sells dropped items to vendors or on AH.
  // 5. Dungeon clear: bonus gold for completing a dungeon (once per dungeon per day — speculative).
  // 6. Raid boss first kill: bonus gold (once per boss per week — already locked).
  // 7. Salvage credit conversion: T1 salvage credits can convert to gold at a fixed rate (speculative).
}

interface GoldSink {
  type: "vendor_purchase" | "ah_listing_tax" | "ah_buyout" | "housing_deed" | "housing_upkeep" | "travel_cost" | "respec_cost" | "repair_cost";
  amountPerEvent: string;
  // Rules:
  // 1. Vendor purchases: consumables, materials, T1 gear.
  // 2. AH listing tax: speculative 0/5/10% (John's call).
  // 3. AH buyout: the price itself is a sink (gold leaves the buyer, goes to seller minus tax).
  // 4. Housing deed: one-time purchase (already locked).
  // 5. Housing upkeep: per-tick cost (speculative — see Go-Live dump).
  // 6. Travel cost: fast travel between hubs (speculative — may be free in v1).
  // 7. Respec cost: FREE (already locked — respec is free, cooldown only).
  // 8. Repair cost: gear degrades and must be repaired (speculative — may not be in v1).
}
```

### Two Wallets: Gold vs Cosmetic Tokens

**Recommendation: YES — two wallets.**

```typescript
interface Wallet {
  gold: number;                             // earned in-game, spent on gameplay items
  cosmeticTokens: number;                   // purchased with real money OR earned via events, spent on cosmetics ONLY
  // Rules:
  // 1. Gold is earned by playing. Cosmetic tokens are purchased or earned via events.
  // 2. Gold CANNOT buy cosmetic tokens (no pay-to-earn loop).
  // 3. Cosmetic tokens CANNOT buy gameplay items (no pay-to-win).
  // 4. The two wallets never cross. This is the firewall between gameplay and monetization.
  // 5. Cosmetic tokens buy: UI themes, dice skins, TTS voices, SFX packs, cosmetic gear (display-only).
  // 6. Gold buys: consumables, gear, materials, housing deeds, AH items, travel.
}
```

Rationale:
- Two wallets prevent the "gold → cosmetic token → pay-to-win" loop. If gold could buy cosmetic tokens, players would buy gameplay advantages with real money (indirectly).
- Two wallets prevent the "cosmetic token → gold → buy power" loop. If cosmetic tokens could buy gold, paying players would have more gold than free players.
- The firewall is the design principle: gameplay currency and monetization currency never mix.

### Empty AH at Launch

**Recommendation: Seed with vendor-price listings for first 2 weeks, then open to player listings.**

```typescript
interface AHLaunchPlan {
  week1: "seeded";                           // AH seeded with vendor-price listings (code-owned)
  week2: "seeded";                           // continued seeding
  week3: "open";                             // player listings enabled
  // Rationale:
  // Week 1–2: The AH is empty because no one has loot to sell yet. An empty AH feels dead.
  //   Seed it with vendor-price listings (items at the same price vendors sell them for).
  //   This gives players something to buy and a baseline for pricing.
  //   Seeded listings are code-owned (not player listings). They disappear when bought.
  // Week 3: Players have been playing for 2 weeks. They have loot. Open player listings.
  //   The seeded listings taper off (fewer seeds each day as player listings grow).
  // Alternative (rejected): Vendors-only for 2 weeks, then AH opens.
  //   Rejected because vendors-only means no player economy for 2 weeks, which feels like
  //   a single-player game, not an MMO.
}
```

### Weekly Lockout Reset as a JOB

```typescript
interface WeeklyLockout {
  resetDay: "tuesday";                       // speculative — common MMO reset day
  resetTime: "00:00 UTC";                    // speculative
  // The JOB: weekly lockout gives raiders a predictable rhythm.
  // Each week, per-character per-boss lockout resets.
  // The player can kill each boss once per week per character.
  // First kill grants bonus gold + loot. Subsequent kills (same week) grant reduced loot (speculative).
  // This prevents farming and gives raiders a reason to log in weekly.
}
```

### What a Week Contains

| Player Type | Monday | Tuesday (Reset) | Wed–Thu | Fri | Sat | Sun |
|------------|--------|-----------------|---------|-----|-----|-----|
| **Raider** | Prep: gear check, consumables stock. | Lockout reset. Raid night: Millstone Hollow (3 phases, ~90 min). | Recovery: salvage, repair, AH sales. | Social: help friends, alts. | Optional: second raid night (if lockout allows). | Rest: cozy activities, collection. |
| **Cozy** | Farm: check crops, harvest, cook. | Market day: sell crafted goods on AH. | Decorate: rearrange house, craft decor. | Social: host guests (friends-only). | Event: seasonal festival (if active). | Rest: short session, check farm. |
| **Collector** | Hunt: spawn-check species in Reedfen Marsh. | Trade day: buy/sell on AH. | Explore: try a new zone for new species. | Bond: spend time with bonded species. | Social: trade with friends. | Rest: update collection log, plan next hunt. |

### No LLM-Minted Gold (Restated)

```
The LLM NEVER grants gold. Gold is minted ONLY by code:
- Quest rewards (code-owned, fixed amount per quest)
- Vendor sales (code-owned, fixed vendor prices)
- Loot sales (code-owned, loot tables determine drops, vendor/AH determines price)
- Dungeon/raid clear bonuses (code-owned, fixed per dungeon/boss)

The LLM may narrate a reward scene ("the elder hands you a pouch of coins")
but the gold is already in the player's wallet because CODE granted it.
The LLM's narration is flavor, not the source.
```

### John's Leftover Calls (Carried Forward)

| # | Call | Options | Notes |
|---|------|---------|-------|
| 1 | Tick interval | 15 / 30 / 60 minutes | Affects upkeep, cozy ticks, catch-up. Speculative. |
| 2 | Catch-up cap | 7 / 14 / 30 days | How long offline progression accumulates. Speculative. |
| 3 | AH unified vs split | Unified (one AH) vs split (Ash Seat + Tidehold) | Region AH is locked. Whether regions share listings is a call. |
| 4 | AH tax | 0% / 5% / 10% | Gold sink. 0% = no sink, 10% = aggressive. Speculative. |
| 5 | Seize (abandoned listing) | 2 / 3 / 4 weeks | How long before unclaimed AH listings are seized. Speculative. |
| 6 | Free daily LLM tokens | Yes (X/day) vs no | Whether free players get a daily LLM budget. Speculative. |
| 7 | Skip vs mandatory tutorial | Skippable vs mandatory | See Section 9. |
| 8 | Solo-able first dungeon | Solo vs group-required | See Section 9. |
| 9 | Character slots | 1 / 3 / unlimited | See Section 9. |
| 10 | Show strangers in first hub | Yes vs friends-only | See Section 9. |
| 11 | Reedfen-only alpha vs 4 starts | One zone vs all four | See Section 9. |
| 12 | Raid in F&F vs public | F&F raid vs public-only | See Section 9. |
| 13 | Second skin at v1 | One skin vs two | See Section 9. |
| 14 | Global chat | Yes vs no | Recommended NO (Section 4). |
| 15 | Friends-only presence | Yes vs show all | See Section 9. |
| 16 | Two wallets | Yes vs one | Recommended YES (Section 5). |
| 17 | Default 5-man runMode | Manual vs plan-auto | See Section 9. |
| 18 | Profession | Miller vs lantern | See Section 9. |

---

## 6) Combat Feel + Session Length (Not New Ledgers)

### Goal

Define the word budget per round. Prose MUST include action + visible result; MUST NOT invent HP. Session length targets. Default runMode for first 5-man. Raid Mode C vs A stays a John call. Rest/wipe/checkpoint UX copy. Plan-auto Stop copy.

### Word Budget per Round

```typescript
interface CombatWordBudget {
  // Per round, the LLM writes the "camera" for this turn:
  minSentences: 2;
  maxSentences: 6;
  targetWords: number;                      // 40–80 words per round (speculative)
  // Budget breakdown:
  // - Action description: 15–30 words (what the player did)
  // - Visible result: 10–20 words (what happened — blood, stagger, miss, block)
  // - Enemy tell: 10–20 words (what the enemy is doing NEXT — telegraph)
  // - Atmosphere: 5–10 words (optional — room detail, weather, sound)
  // Total: 40–80 words.
  // Rules:
  // 1. Prose MUST include the player's action and a visible result.
  // 2. Prose MUST NOT state HP, damage numbers, or kill confirmations.
  // 3. Prose MUST include the enemy tell (if the enemy is winding up).
  // 4. Prose MUST NOT describe what the enemy DOES (only what it's ABOUT to do).
  // 5. The System recap table (after prose) owns all numbers.
}
```

### Prose MUST / MUST NOT

| MUST | MUST NOT |
|------|---------|
| Include the player's action ("You drive the knife toward the hatchling's flank") | State damage ("for 8 damage") |
| Include a visible result ("The blade bites scale; the creature hisses and recoils") | State HP ("the hatchling is at 12 HP") |
| Include enemy tell ("Behind you, the second hatchling coils, its throat sacs swelling") | Resolve the enemy's next action ("and sprays acid, hitting you for 6") |
| Describe the room before the creature (first encounter only) | Invent a kill ("the hatchling crumples, dead") if HP > 0 |
| Be unique every round | Use canned phrases ("you lunge," "the enemy snarls") |

### Session Length Targets

| Session Type | Target Duration | What Happens | Content |
|-------------|----------------|--------------|---------|
| **Quick check-in** | 15 min | Hub interactions, salvage, daily quest tick, check AH, chat with friends. | 3–5 turns. No combat. |
| **Standard session** | 45 min | One 5-man dungeon (solo or party) + hub time. | 15–25 turns. 1 dungeon run. |
| **Long session** | 90 min | Two 5-man dungeons OR one 5-man + extended hub/economy/housing. | 30–50 turns. 2 dungeon runs or 1 + social. |
| **Raid night** | 90–120 min | Millstone Hollow (10-player, 3 phases). Weekly. | 40–60 turns. 1 raid clear (if successful). |

### Default runMode for First 5-Man

**Recommendation: Manual for the first 5-man.**

```typescript
// First 5-man (Lampwood Gate): runMode = manual
// Rationale:
// 1. Manual mode teaches the player how lockstep combat works.
// 2. The player chooses each action each round. This is the tutorial for combat.
// 3. Plan-auto is for experienced players who want faster runs.
// 4. If the first dungeon is plan-auto, the player doesn't learn the round structure.
// 5. After the first 5-man, the player can choose manual or plan-auto for subsequent dungeons.
// 6. Raids use their own mode (Mode C vs A — John's call).
```

### Raid Mode C vs A — Stays a John Call

```
Raid narration mode is NOT decided in this dump.
Mode A = one paragraph per room/encounter (dungeon style).
Mode C = compressed raid narration (shorter prose, more System chrome).
This is John's call. Left open.
```

### Rest / Wipe / Checkpoint UX Copy

```
─── REST ──────────────────────────────────
You settle against the wall. Your breathing slows.
The marsh sounds return. You are safe here.
STA recovered: +4 | HP unchanged
[Continue] [Check Inventory] [Open Map]
────────────────────────────────────────────
```

```
─── WIPE ───────────────────────────────────
The party has fallen.
The instance resets to checkpoint.
Cleared rooms remain cleared.
HP restored to 50% | STA restored to 0
[Return to Checkpoint] [Exit Instance]
────────────────────────────────────────────
```

```
─── CHECKPOINT ─────────────────────────────
You return to the checkpoint.
Room 2 (Marsh Corridor) — cleared.
Room 3 (Flooded Chamber) — uncleared.
[Proceed] [Rest] [Exit Instance]
────────────────────────────────────────────
```

### Plan-Auto Stop Copy

```
─── PLAN-AUTO ──────────────────────────────
Plan-auto is active. Your plan will repeat each round.
[Stop Plan-Auto] — pause and choose your next action manually.
[Adjust Plan] — modify your current plan.
[Continue Auto] — keep running the current plan.
────────────────────────────────────────────
```

```
// When plan-auto is stopped (player taps Stop):
─── PLAN-AUTO STOPPED ──────────────────────
Plan-auto paused. The current round will resolve,
then you choose your next action.
[Wait for Round] [Override Now]
────────────────────────────────────────────
```

```
// Plan-auto auto-pauses on:
// - Phase change (boss enters new phase)
// - Adds spawned (new enemies appear)
// - Interrupt window opens
// - Ally downed
// - Player taps Stop

─── PLAN-AUTO PAUSED ───────────────────────
Reason: Phase change — the Lampwood Warden shifts stance.
Choose your next action manually.
[Resume Plan-Auto] [Choose Manually]
────────────────────────────────────────────
```

---

## 7) Ash Compact Bible (Reedfen Playable, Others Outlined)

### Goal

Provide the playable bible for Reedfen: 4 race culture kits, 6–10 POIs, durable NPCs, quest DAGs, first 5-man, local catalog 12–20 templates, ban-list ≥30. Outline Tide Covenant and Millstone Hollow without building a second full bible.

### Culture Kits: 4 Races (Half Page Each)

---

#### Hearthborn

**Origin:** Born from the warmth of communal hearths, Hearthborn are sturdy, warm-blooded people who settle in marsh and highland towns. They are the cultural center of Reedfen — the hearth-keepers, the millers, the elders.

**Appearance:** Stocky, ruddy-skinned, with hair ranging from copper to deep auburn. Eyes tend toward amber and warm brown. They dress in layered wool and leather, favoring earth tones.

**Racial Ability (v1):** `hearthborn_warmth` — passive: +10% HP regeneration rate during rest. Cold environments do not impose comfort penalties.

**Disposition:** Community-oriented, practical, suspicious of outsiders initially but loyal once trust is earned. They value shared meals, shared warmth, and shared stories.

**Folklore analog (inspiration only):** English village hearth-spirits / brownie traditions — the idea that the hearth is the center of the home and the community. NOT a specific named folklore creature.

**Starting Place:** Reedfen Square.

---

#### Tide Covenant

**Origin:** Coastal-dwelling people who emerged from the saltmarshes and tidal flats. They are fishers, traders, and navigators. Their culture centers on the covenant between people and tide — the understanding that the sea gives and takes.

**Appearance:** Tall, lean, with skin ranging from weather-tanned to pale sea-green. Hair tends toward dark, salt-streaked. They wear oiled cloth and scale-patterned wraps.

**Racial Ability (v1):** `tide_step` — passive: +5% dodge chance in coastal/wet environments. Can hold breath 2x longer than other races (flavor, no mechanical effect in v1).

**Disposition:** Pragmatic, superstitious, community-bound but with a strong independent streak. They value fair trade, honest tides, and remembering the dead.

**Folklore analog (inspiration only):** Celtic selkie / coastal fae traditions — the idea of a people tied to the sea by a pact. NOT selkies themselves.

**Starting Place:** Brinewatch (outlined, not playable in friends alpha).

---

#### Lanternfolk

**Origin:** People of the lamp-lit roads and marsh paths. They are guides, messengers, and watchers. Their culture centers on light in darkness — keeping the lantern lit, guiding travelers, watching for what stirs in the marsh.

**Appearance:** Slender, pale-skinned, with hair ranging from pale gold to silver-white. Eyes tend toward pale blue and grey. They wear hooded cloaks and carry lanterns as a cultural marker.

**Racial Ability (v1):** `lantern_sense` — passive: +10% detect chance for hidden enemies and hidden paths. Fog-of-war reveals one extra room ahead in dungeons.

**Disposition:** Quiet, observant, slow to speak but quick to act. They value the lit path, the warned traveler, and the kept watch.

**Folklore analog (inspiration only):** Will-o'-the-wisp / marsh-light traditions — the idea of lights that guide (or mislead) in the dark. NOT will-o'-the-wisps themselves.

**Starting Place:** Lampwood (outlined, not playable in friends alpha).

---

#### Stonevein

**Origin:** Mountain and highland people who live in the granite stair-towns. They are miners, smiths, and builders. Their culture centers on stone — the vein of ore, the carved stair, the enduring monument.

**Appearance:** Broad, heavy-set, with skin ranging from iron-grey to deep brown. Hair tends toward black and iron-grey. They wear heavy cloth and forged metal accents.

**Racial Ability (v1):** `stonevein_endurance` — passive: +5% max HP. +10% defense against blunt attacks.

**Disposition:** Stoic, patient, community-oriented through shared labor. They value the well-cut stone, the well-forged tool, and the well-kept oath.

**Folklore analog (inspiration only):** Norse dwarf / earth-spirit traditions — the idea of a people tied to stone and metal. NOT Norse dwarves themselves.

**Starting Place:** Granite Stair (outlined, not playable in friends alpha).

---

### Reedfen: 8 POIs

| # | POI ID | Name | Type | Danger Tier | MapScale | Durable NPC | Exits |
|---|--------|------|------|------------|----------|-------------|-------|
| 1 | `poi_reedfen_square` | Reedfen Square | Hub (outdoor) | Safe | Street | Hearthborn Elder | → Marsh, → Hall, → Crossroads, → Pier |
| 2 | `poi_reedfen_marsh` | Reedfen Marsh | Wilderness (outdoor) | Low (1) | Street | — | → Square, → Marsh Edge, → Lampwood Gate |
| 3 | `poi_reedfen_hall` | Hearthborn Hall | Building (indoor) | Safe | Dungeon (1 room) | Hall Keeper | → Square |
| 4 | `poi_reedfen_pier` | Reedfen Pier | Waterfront (outdoor) | Safe | Street | Pier Watcher | → Square, → Crossroads |
| 5 | `poi_reedfen_mill` | Old Mill | Building (indoor) | Safe | Dungeon (2 rooms) | Miller | → Square (via Marsh path) |
| 6 | `poi_reedfen_crossroads` | Reedfen Crossroads | Junction (outdoor) | Safe | Street | Crossroads Merchant | → Square, → Pier, → Wickhaven (locked) |
| 7 | `poi_reedfen_marsh_edge` | Marsh Edge | Wilderness edge (outdoor) | Low (1) | Street | — | → Marsh, → Lampwood Gate |
| 8 | `poi_lampwood_gate` | Lampwood Gate | Dungeon entrance (outdoor pin) | Medium (2) | Street (pin) → Dungeon (indoor) | — | → Marsh Edge, → [Enter Dungeon] |

**Street stays low danger.** Reedfen Square, Hall, Pier, Crossroads are all "Safe" — no combat spawns. Marsh and Marsh Edge are "Low (1)" — occasional trash mobs, no elites. Lampwood Gate is the dungeon entrance — indoor danger scales with the dungeon.

### Durable NPCs

| NPC ID | Name | Location | Role | Dialogue Tree | Essential |
|--------|------|----------|------|--------------|-----------|
| `npc_hearthborn_elder` | Elder Mara | Reedfen Square | Quest giver (race chain, zone story) | `dialogue_elder_mara` | Yes |
| `npc_miller` | Miller Tobin | Old Mill | Profession trainer (miller) | `dialogue_miller_tobin` | Yes |
| `npc_lantern_keeper` | Keeper Wynn | Reedfen Pier | Profession trainer (lantern) | `dialogue_keeper_wynn` | Yes |
| `npc_pier_watcher` | Watcher Dell | Reedfen Pier | Local NPC (optional personal quests) | `dialogue_watcher_dell` | Yes |
| `npc_hall_keeper` | Keeper Renna | Hearthborn Hall | Hub services (rest, journal) | `dialogue_keeper_renna` | Yes |
| `npc_crossroads_merchant` | Merchant Fenn | Reedfen Crossroads | Personal merchant deals | `dialogue_merchant_fenn` | Yes |

### Quest DAGs (Code-Completable)

#### Hearthborn Race Chain (3 beats)

```
Quest: "The Hearthborn's Request" (race, Reedfen)
  ├─ Obj 1: visit_place → Reedfen Marsh (poi_reedfen_marsh)
  │    └─ minTurnGap: 3
  ├─ Obj 2: ledger_kill → 3 Reedfen Hatchlings (species_reedfen_hatchling, count 3)
  │    └─ minTurnGap: 3
  └─ Obj 3: deliver_item → Reedfen Scale (turnInNpcId: npc_hearthborn_elder)
       └─ Reward: gold 100, xp 50, unlocksQuestId: quest_hearthborn_race_2

Quest: "Warmth in the Marsh" (race, Reedfen, prereq: race_1)
  ├─ Obj 1: visit_place → Marsh Edge (poi_reedfen_marsh_edge)
  ├─ Obj 2: ledger_kill → 1 Marsh Lurker (species_marsh_lurker, count 1)
  └─ Obj 3: talk_to_npc → Elder Mara (npc_hearthborn_elder)
       └─ Reward: gold 200, xp 100, reputationGain: { faction_hearthborn: 50 },
                  unlocksQuestId: quest_hearthborn_race_3

Quest: "The Elder's Trust" (race, Reedfen, prereq: race_2, HIDDEN)
  ├─ Obj 1: collect_item → 5 Heartstone Shards
  ├─ Obj 2: deliver_item → Heartstone (turnInNpcId: npc_hearthborn_elder)
  └─ Reward: gold 500, xp 300, talentPoint: 1, unlocksQuestId: null
  └─ isHidden: true (discovered by talking to Elder Mara after race_2 with reputation ≥ 100)
```

#### Miller Profession Chain (3 beats)

```
Quest: "Apprentice Miller" (profession, Reedfen)
  ├─ Obj 1: collect_item → 10 Marsh Grain
  ├─ Obj 2: deliver_item → Marsh Grain (turnInNpcId: npc_miller)
  └─ Reward: gold 50, unlocksQuestId: quest_miller_profession_2

Quest: "Journeyman Miller" (profession, Reedfen, prereq: profession_1)
  ├─ Obj 1: visit_place → Old Mill (poi_reedfen_mill)
  ├─ Obj 2: ledger_kill → 5 Mill Rats (species_mill_rat, count 5)
  ├─ Obj 3: collect_item → 1 Millstone Fragment
  └─ Reward: gold 150, talentPoint: 1, unlocksQuestId: quest_miller_profession_3

Quest: "Master Miller" (profession, Reedfen, prereq: profession_2)
  ├─ Obj 1: collect_item → 10 Polished Grain
  ├─ Obj 2: collect_item → 1 Millstone Core
  ├─ Obj 3: deliver_item → Millstone Core (turnInNpcId: npc_miller)
  └─ Reward: gold 500, talentPoint: 2, reputationGain: { faction_millcross_guild: 100 }
```

#### Zone Story: "The Reedfen Problem" (3 beats, not save-the-world)

```
Quest: "Trouble at the Pier" (zone_story, Reedfen)
  ├─ Obj 1: visit_place → Reedfen Pier (poi_reedfen_pier)
  ├─ Obj 2: talk_to_npc → Watcher Dell (npc_pier_watcher)
  └─ Reward: gold 75, xp 40, unlocksQuestId: quest_reedfen_zone_2

Quest: "The Lurker's Trail" (zone_story, Reedfen, prereq: zone_1)
  ├─ Obj 1: visit_place → Marsh Edge (poi_reedfen_marsh_edge)
  ├─ Obj 2: ledger_kill → 3 Marsh Lurkers (species_marsh_lurker, count 3)
  ├─ Obj 3: collect_item → 1 Lurker Eye
  └─ Reward: gold 150, xp 100, unlocksQuestId: quest_reedfen_zone_3

Quest: "Clearing the Reedfen" (zone_story, Reedfen, prereq: zone_2)
  ├─ Obj 1: visit_place → Lampwood Gate (poi_lampwood_gate)
  ├─ Obj 2: ledger_kill → 1 Lampwood Warden (species_lampwood_warden, count 1) [boss]
  └─ Obj 3: talk_to_npc → Elder Mara (npc_hearthborn_elder)
       └─ Reward: gold 300, xp 200, reputationGain: { faction_hearthborn: 75 }
  └─ Note: This is a LOCAL problem (lurkers in the marsh), not save-the-world.
           The player is helping Reedfen, not defeating a dark lord.
```

### First 5-Man: Lampwood Gate

```typescript
interface LampwoodGate {
  dungeonId: "dungeon_lampwood_gate";
  name: "Lampwood Gate";
  dangerLevel: 2;
  roomCount: 5;
  isSoloable: true;                          // v1: solo-able (reduced mobs/boss HP)
  partySize: 1–5;
  // Room-before-creature rule: each room is described before any creature appears.
  rooms: LampwoodRoom[];
}

// Room 1: Entrance (no encounter)
// "The gate stands half-open, rusted hinges silent. Water drips from the arch.
//  Beyond it, a narrow corridor slopes downward into dark."
// → No combat. Player chooses: [Proceed to Room 2] [Search the entrance] [Exit]

// Room 2: Marsh Corridor (3 Reedfen Hatchlings — trash)
// "The corridor opens into a low chamber, walls slick with moisture.
//  Something skitters in the far corner — then another, and another."
// → 3 Hatchlings. Lockstep combat. runMode = manual (first dungeon).

// Room 3: Flooded Chamber (2 Hatchlings + 1 Marsh Lurker — elite)
// "Water pools ankle-deep here. The ceiling is low.
//  A shape moves beneath the surface — too large to be a hatchling."
// → 2 Hatchlings + 1 Lurker. The Lurker is elite (higher HP, special attack).

// Room 4: The Lantern Room (no combat — choice/puzzle)
// "A dead lantern hangs from the ceiling, its glass cracked.
//  The floor is dry here. Scratches on the wall form a pattern — a route, maybe.
//  Two passages lead onward."
// → No combat. Player chooses: [Take the left passage] [Take the right passage]
//   One passage leads to the boss room. The other leads to a small loot room
//   (1 chest, minor loot) then back to the boss room.

// Room 5: Warden's Chamber (boss: Lampwood Warden)
// "The chamber is wide and low. Roots break through the ceiling.
//  In the center, something stands — tall, still, its body woven from
//  lampwood roots and old stone. It opens its eyes."
// → Boss: Lampwood Warden. 1 phase (v1 — no multi-phase for first 5-man).
//   Boss abilities: Root Slam (heavy hit), Lantern Burst (AoE, telegraphed).
//   On victory: loot (personal), gold, XP. Quest "Clearing the Reedfen" completes.
```

### Local Catalog: 16 Species Templates

| # | Species ID | Name | Genus | Rarity | Habitat Tags | Base HP | Base ATK |
|---|-----------|------|------|--------|-------------|---------|----------|
| 1 | `species_reedfen_hatchling` | Reedfen Hatchling | beast | common | reedfen, marsh | 20 | 5 |
| 2 | `species_mill_rat` | Mill Rat | beast | common | reedfen, mill | 12 | 3 |
| 3 | `species_marsh_gnat` | Marsh Gnat | insect | common | reedfen, marsh | 6 | 2 |
| 4 | `species_reed_frog` | Reed Frog | beast | common | reedfen, marsh, water | 10 | 3 |
| 5 | `species_marsh_lurker` | Marsh Lurker | beast | uncommon | reedfen, marsh, water | 45 | 12 |
| 6 | `species_lampwood_sprout` | Lampwood Sprout | plant | uncommon | reedfen, lampwood | 30 | 8 |
| 7 | `species_pier_crab` | Pier Crab | beast | uncommon | reedfen, pier, water | 35 | 7 |
| 8 | `species_crossroads_wolf` | Crossroads Wolf | beast | uncommon | reedfen, crossroads | 40 | 10 |
| 9 | `species_heartstone_golem` | Heartstone Golem | construct | rare | reedfen, underground | 80 | 15 |
| 10 | `species_marsh_wisp` | Marsh Wisp | spirit | rare | reedfen, marsh | 25 | 18 |
| 11 | `species_old_mill_spectre` | Old Mill Spectre | spirit | rare | reedfen, mill | 50 | 14 |
| 12 | `species_lampwood_warden` | Lampwood Warden | construct | epic | reedfen, lampwood | 200 | 25 |
| 13 | `species_reedfen_salamander` | Reedfen Salamander | elemental | uncommon | reedfen, marsh, fire | 35 | 11 |
| 14 | `species_mire_viper` | Mire Viper | beast | uncommon | reedfen, marsh | 28 | 14 |
| 15 | `species_lamp_moth` | Lamp Moth | insect | common | reedfen, lampwood | 8 | 4 |
| 16 | `species_tide_crawler` | Tide Crawler | beast | uncommon | reedfen, pier, water | 38 | 9 |

### Starter Items (10)

| # | Item ID | Name | Category | Value |
|---|--------|------|----------|-------|
| 1 | `item_hearthborn_knife` | Hearthborn Cutting Knife | equipment (weapon) | 5 gold |
| 2 | `item_iron_hatchet` | Iron Hatchet | equipment (weapon) | 8 gold |
| 3 | `item_oak_staff` | Oak Staff | equipment (weapon) | 6 gold |
| 4 | `item_padded_vest` | Padded Vest | equipment (armor) | 5 gold |
| 5 | `item_leather_jacket` | Leather Jacket | equipment (armor) | 7 gold |
| 6 | `item_system_bandage` | System-Issue Bandage | consumable | 1 gold |
| 7 | `item_stamina_pill` | System-Issue Stamina Pill | consumable | 1 gold |
| 8 | `item_salvage_kit` | Salvage Kit | tool | 3 gold |
| 9 | `item_reedfen_map` | Reedfen Map | key item | 0 (non-sellable) |
| 10 | `item_heartstone_shard` | Heartstone Shard | material | 2 gold |

### Ban-List: 30+ Licensed/Lookalike Traps

| # | Banned Name | Reason |
|---|------------|--------|
| 1 | Hogwarts | Harry Potter (Warner Bros.) |
| 2 | Stormwind | Warcraft (Blizzard) |
| 3 | Orgrimmar | Warcraft (Blizzard) |
| 4 | Pikachu | Pokémon (Nintendo/Game Freak) |
| 5 | Palworld | Palworld (Pocketpair) |
| 6 | Mordor | Middle-earth (Tolkien Estate) |
| 7 | Gondor | Middle-earth (Tolkien Estate) |
| 8 | U.A. High | My Hero Academia (Shueisha) |
| 9 | Teyvat | Genshin Impact (HoYoverse) |
| 10 | Liyue | Genshin Impact (HoYoverse) |
| 11 | Whiterun | Elder Scrolls (Bethesda) |
| 12 | Skyrim | Elder Scrolls (Bethesda) |
| 13 | Waterdeep | D&D (Wizards of the Coast) |
| 14 | Neverwinter | D&D (Wizards of the Coast) |
| 15 | Warhammer | Warhammer (Games Workshop) |
| 16 | Sigmar | Warhammer (Games Workshop) |
| 17 | Tyria | Guild Wars (ArenaNet) |
| 18 | Eorzea | FFXIV (Square Enix) |
| 19 | Azeroth | Warcraft (Blizzard) |
| 20 | Kalimdor | Warcraft (Blizzard) |
| 21 | Paldean | Pokémon (Nintendo/Game Freak) |
| 22 | Palapagos | Palworld (Pocketpair) |
| 23 | Hyrule | Legend of Zelda (Nintendo) |
| 24 | Geralt | The Witcher (CD Projekt Red / Sapkowski) |
| 25 | Rivia | The Witcher (CD Projekt Red / Sapkowski) |
| 26 | Arda | Middle-earth (Tolkien Estate) |
| 27 | Faerûn | D&D (Wizards of the Coast) |
| 28 | Krynn | Dragonlance (Wizards of the Coast) |
| 29 | Azerothian | Warcraft lookalike (Blizzard) |
| 30 | Pokeball | Pokémon (Nintendo/Game Freak) |
| 31 | Muggle | Harry Potter (Warner Bros.) |
| 32 | Jedi | Star Wars (Lucasfilm/Disney) |
| 33 | Sith | Star Wars (Lucasfilm/Disney) |
| 34 | Mandalorian | Star Wars (Lucasfilm/Disney) |
| 35 | Targaryen | Game of Thrones (HBO/George R.R. Martin) |
| 36 | Westeros | Game of Thrones (HBO/George R.R. Martin) |
| 37 | Vault Dweller | Fallout (Bethesda) |
| 38 | Vault-Tec | Fallout (Bethesda) |
| 39 | Trainer | Pokémon-adjacent (Nintendo) — use "Handler" or "Keeper" instead |
| 40 | Quirk | My Hero Academia (Shueisha) — use "Gift" or "Talent" instead |

### Tide Covenant: Half Page (So Four Starts Are Not Copy-Paste)

**Tide Covenant starting hub: Brinewatch.**

Brinewatch is a saltmarsh port built on stilts over tidal flats. The hub is Brinewatch Dock — a long pier with moored boats, fish-drying racks, and the Covenant Hall where the tide-keepers read the water each morning. The starting quest involves the tide-keepers noticing something wrong with the seasonal migration of Saltkin (a tidal creature). The first 5-man for Tide Covenant is Coil Pier — a flooded warehouse where Saltkin have been nesting. The profession chain is either Fisher or Navigator (speculative — John's call). The zone story is a local problem (disrupted tides, not save-the-world).

**Key difference from Reedfen:** Brinewatch is coastal, not marsh. The atmosphere is salt, wind, and tide. The Covenant is a cultural pact, not a hearth community. The first 5-man is water-based (flooded, not marshy). The local catalog is coastal species (Saltkin, pier crabs, tide crawlers), not marsh species.

**Not playable in friends alpha.** Outlined only.

### Millstone Hollow: One Lore Page (Do Not Resize the Raid)

**Millstone Hollow** is a collapsed mill-complex in the hills above Reedfen. Once a thriving grain-mill town, it fell when the Millwarden — an ancient construct built to power the mills — went dormant and the water stopped flowing. The town hollowed out. Now something has woken the Millwarden, and it has been grinding again — but not grain.

The Millwarden is not evil. It is a machine following corrupted instructions. The raid's story is about understanding what went wrong and stopping the Millwarden before it grinds the hillside into dust. The 3-phase script (already designed) stands as-is: Phase 1 (the Grinder — AoE damage), Phase 2 (the Flood — water mechanics), Phase 3 (the Core — interrupt the Millwarden's overload).

**Lore hooks:**
- The Miller profession chain in Reedfen connects to Millstone Hollow (the Millstone Core is a fragment of the Millwarden's grinding stone).
- The Hearthborn Elder remembers when the mills ran. She can tell the player about the Hollow if asked.
- The Millwarden was built by Stonevein engineers (connects to Granite Stair — outlined).

**Do not resize.** The raid is 10 players, 3 phases, weekly lockout. This dump does not change the raid script, boss HP, or mechanics. It adds lore context only.

---

## 8) Failure Modes (Max 15)

| # | Failure Mode | How It Happens | Prevention |
|---|-------------|---------------|------------|
| 1 | **Empty quest log** | Player finishes the first 3 quests and has nothing to do. No new quests unlock. | Quest DAGs always chain: completing one quest unlocks the next. Zone story chains into the first 5-man. Daily quest ticks provide repeatable content. |
| 2 | **LLM town-swap** | LLM names the starting town "Stormwind" or "Hogwarts" instead of Reedfen. | Place ID is code-owned. LLM receives `PLACE_NAME: Reedfen` token. Post-filter rejects prose that doesn't contain the Place name or contains banned names. |
| 3 | **Chat in GM prompt** | Player's hub say message is raw-injected into the GM prompt, allowing jailbreaks. | Player chat is NEVER raw-injected. Sanitized presence tokens only (nearbyPlayerCount, nearbyPlayerRaces). See Section 4. |
| 4 | **Gold dupe via prose** | LLM narrates "the elder gives you 100 gold" twice. Code grants gold twice. | Code grants gold ONCE per quest completion flag. The LLM's narration is flavor. Code checks: `if (!quest.isRewarded) { grantGold(); quest.isRewarded = true; }`. |
| 5 | **Global chat toxicity** | Global chat becomes a firehose of spam, slurs, and harassment. New players see it as their first impression and quit. | No global chat in v1 (recommended). Hub say + tell + party chat only. |
| 6 | **Four skins at once** | Team tries to ship Ash Compact, Bonded Menagerie, Circuit Arc, and Hearth Season simultaneously. All four are incomplete. | Ship ONE skin (Ash Compact) at public v1. Others are post-launch. |
| 7 | **400-species catalog** | Bonded Menagerie ships with 400 species. Prompt bloats. Balance is impossible. Content takes forever. | Friends alpha: 16 species. Public v1: 50–100 (speculative). Never 400 at launch. |
| 8 | **Raid before 5-man works** | Team builds Millstone Hollow before Lampwood Gate is tested. Raid mechanics are untested. 5-man bugs cascade into raid. | Build order: 5-man first, raid second. Raid is F&F or public v1, NOT friends alpha. |
| 9 | **Auto through interrupt** | Plan-auto continues through an interrupt window. Player can't stop the plan. Boss mechanic is missed. Wipe. | Plan-auto auto-pauses on: phase change, adds, interrupt window, ally-down, Stop. Already locked. |
| 10 | **Late prose overwrites HP** | Late narration arrives from the previous round. It describes the enemy as "badly wounded" but the current round's code has already killed the enemy. | Late prose is bound to roundId. If the round has advanced, late prose is discarded (not displayed). Already locked. |
| 11 | **Info-dump tutorial** | All mechanics explained in one wall of text at spawn. Player is overwhelmed. | 8–12 beats, each teaching ONE thing. System reveals are one line each. |
| 12 | **Forced multiplayer** | Player can't enter the first dungeon without a group. Player has no friends. Player quits. | First 5-man is solo-able. Friends-first finder is optional. |
| 13 | **Housing troll** | Player decorates house with offensive arrangements or spells slurs with decor items. | Decor items are code-owned (no free-text decor). No text-on-walls in v1. House visits are friends-only. |
| 14 | **Name impersonation** | Player names themselves "ElderMara" or "SystemAdmin" to trick others. | Name validation rejects NPC names, "System," "Admin," "GM," "Mod." Reserved name blocklist. |
| 15 | **Empty AH at launch** | AH is empty on day 1. Players see a dead market. Economy feels broken. | Seed AH with vendor-price listings for 2 weeks. Open player listings in week 3. |

---

## 9) John's Remaining Calls (Max 12, Numbered)

| # | Call | Options | Recommendation | Rationale |
|---|------|---------|---------------|----------|
| 1 | **Skip vs mandatory tutorial** | Skippable / mandatory | **Mandatory for first character, skippable for alts.** | First-time players need the 8–12 beats to learn the system. Alt characters can skip. Code tracks: `hasCompletedTutorial` per account. |
| 2 | **Solo-able first dungeon** | Solo / group-required | **Solo-able.** | First session is usually solo. Forcing a group creates a dead end. Lampwood Gate scales: solo = reduced mobs/boss HP, party = full scale. |
| 3 | **Character slots** | 1 / 3 / unlimited | **3.** | 1 is too restrictive (players want alts). Unlimited is unnecessary at v1. 3 matches the common MMO standard. |
| 4 | **Show strangers in first hub** | Yes / friends-only | **Yes (presence list only, no chat).** | Seeing other players makes it feel like an MMO. Presence list is code-rendered, no LLM cost. Players can't interact with strangers beyond seeing them. |
| 5 | **Reedfen-only alpha vs 4 starts** | One zone / all four | **Reedfen only.** | One complete zone proves the loop. Four incomplete zones prove nothing. |
| 6 | **Raid in F&F vs public** | F&F raid / public-only | **F&F.** | Raid needs 10 players. F&F has enough players to test. Public v1 raid should be tested first in F&F. |
| 7 | **Second skin at v1** | One skin / two | **One (Ash Compact).** | Two skins = two incomplete worlds. Ship one complete skin. Hearth Season is the first post-launch skin. |
| 8 | **Global chat** | Yes / no | **No.** | Text MMOs die from global chat toxicity. Hub say + tell + party chat is sufficient. Global chat is v2+ with heavy moderation. |
| 9 | **Friends-only presence** | Friends-only / show all | **Show all (in hub only).** | Seeing strangers makes it feel alive. Presence list is code-rendered. No LLM cost. No chat interaction with strangers (no tells from non-friends in Kid Mode). |
| 10 | **Two wallets** | Yes / one | **Yes (gold + cosmetic tokens).** | Firewall between gameplay and monetization. Gold can't buy cosmetics. Cosmetic tokens can't buy power. |
| 11 | **Default 5-man runMode** | Manual / plan-auto | **Manual.** | First 5-man teaches lockstep combat. Manual = player chooses each round. Plan-auto is for experienced players. |
| 12 | **Profession: miller vs lantern** | Miller / lantern / both | **Both (one is primary, one is secondary — speculative).** | Miller connects to Millstone Hollow lore. Lantern connects to Lampwood Gate lore. Both have quest chains. If only one, pick Miller (stronger raid connection). |

---

## Sources

| Source | URL | Date Accessed | What Was Used |
|--------|-----|--------------|---------------|
| Evennia (open-source MUD framework) | https://www.evennia.com/docs/latest/ | Aug 15, 2026 | Builder pattern, declarative world definition, server-authoritative state |
| Aardwolf (MUD) | https://www.aardwolf.com/ | Aug 15, 2026 | Tiered zones, daily campaigns, clan system, persistent identity |
| Gemstone IV (MUD) | https://www.play.net/gs4/ | Aug 15, 2026 | Live events, deep NPC roleplay, text-first atmosphere |
| Fallen London (Failbetter) | https://www.failbettergames.com/ | Aug 15, 2026 | Storylet structure, short sessions, persistence without grind |
| Kingdom of Loathing (Asymmetric) | https://kol.coldfront.net/thekolwiki/ | Aug 15, 2026 | Daily turn limit, collection, player-run economy, community |
| Hidden Door | https://www.hiddendoor.com/ | Aug 15, 2026 | Code-level guardrails, creator IP, authored scaffolding |
| Friends & Fables (Side Quest Labs) | https://www.friendsandfables.com/ | Aug 15, 2026 | Retrieval-based memory, friends-play-free, worldbuilding suite |
| Summon Worlds (OpenForge) | https://openforge.io/ | Aug 15, 2026 | Entity graph, Bound Chat, collaborative worldbuilding |
| AI Dungeon (Latitude) | https://github.com/AIDungeon/AIDungeon | Aug 15, 2026 | Keyword WI concept, context budget triage, free-text as secondary |
| WoW starting-zone systems (Blizzard) | https://worldofwarcraft.blizzard.com/ | Aug 15, 2026 | Phased onboarding, breadcrumb quests, ability gating (JOB only, no IP) |
| FFXIV duty-finder (Square Enix) | https://na.finalfantasyxiv.com/ | Aug 15, 2026 | Role-based matchmaking, friends-first, daily roulette (JOB only) |
| EVE Online economy (CCP) | https://www.eveonline.com/ | Aug 15, 2026 | Player-driven market, regional markets, scarcity drives conflict (JOB only) |
| Albion Online economy (Sandbox Interactive) | https://albiononline.com/ | Aug 15, 2026 | Player-crafted gear, local markets, economic velocity (JOB only) |
| Stardew Valley / Animal Crossing cozy pattern | https://www.stardewvalley.net/ | Aug 15, 2026 | 15–20 min daily loop, low-stakes progression, decorating (JOB only) |
| OSRS collection log UI pattern | https://oldschool.runescape.com/ | Aug 15, 2026 | "Seen X of Y" counter, silhouette for unseen, completion percentage (JOB only) |
| Existing project file: WOF_Multiplayer_Design_Dump.md | (project file) | Aug 15, 2026 | EncounterLedger, BattlePlan, Millstone Hollow, sync, join/loot/wipe |
| Existing project file: WOF_Gap_Fill_Dump.md | (project file) | Aug 15, 2026 | Deeds, AH, tick model, LLM cost model, failure modes |
| Existing project file: WOF_GoLive_Systems_Dump.md | (project file) | Aug 15, 2026 | 4-store memory, catalogs, quests, talents, housing build, world builder, skin matrix |
| Existing project file: SGM_Live_Gameplay_Dump.md | (project file) | Aug 15, 2026 | Combat feel, System-after-story, street map, choices from committed beat |
| Existing project file: AI_RPG_Research_Intel_and_Summary.md | (project file) | Aug 15, 2026 | Code-owns-truth principle, competitor architecture pitfalls |
| Existing project file: AI_RPG_Technical_UX_Research_Report.md | (project file) | Aug 15, 2026 | SynapticGM architecture, dual-AI pattern, warden concept |
| Existing project file: docs/research/pack-09-monetization-cosmetics-audio-iap-2026-08.md | (project file) | Aug 15, 2026 | Never sell combat outcomes, cosmetics display-only, Kid Mode |

---

## Speculation Markers

1. **8–12 tutorial beats with specific turn ranges** — speculative. Need playtesting.
2. **16 species for friends alpha** — speculative. Could be 12–20.
3. **50–100 species for public v1** — speculative. Depends on balance testing.
4. **AH seeding for 2 weeks** — speculative. Could be 1 week or 3.
5. **Weekly lockout reset on Tuesday** — speculative. Could be Wednesday or Monday.
6. **3 character slots** — speculative (John's call #3).
7. **Two wallets (gold + cosmetic tokens)** — recommended but speculative until monetization is finalized.
8. **Session length targets (15/45/90/120 min)** — speculative. Need player data.
9. **Combat word budget 40–80 words per round** — speculative. Need LLM testing.
10. **Lampwood Gate solo-able with reduced mobs/boss HP** — speculative scaling formula.
11. **Tide Covenant profession: Fisher or Navigator** — speculative.
12. **Both professions (miller + lantern) in Reedfen** — speculative (John's call #12).
13. **Presence list polling every 10 seconds** — speculative. Could be 5 or 30.
14. **Report SLA: 24 hours** — speculative. Could be 48 or 72.
15. **Hearth Season as first post-launch skin** — recommended but speculative.

---

**End of Playable Start Dump. Combined with prior dumps (Multiplayer Design, Gap Fill, Go-Live Systems, SGM Live Gameplay), this provides implementation-ready schemas, beat sheets, bibles, ban-lists, and decision tables for WOF's playable first hour through public v1.**
