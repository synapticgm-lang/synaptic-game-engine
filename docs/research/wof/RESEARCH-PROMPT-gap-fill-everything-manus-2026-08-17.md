# WOF — Manus prompt: fill every remaining gap (not more world novels)

Paste the block below into Manus (unlimited run). Download **all** files it writes. Drop them in this chat or `docs/research/wof/pasted/`.

This is **WOF later**, not live SynapticGM. Do not implement the dump into `src/` / `supabase/`.

**Do not send the all-worlds prompt again.** Worlds already exist. This run is catalogs, schemas, typed YAML, copy, and the thin Badge Circuit fill.

Expected downloads (Manus may split):

- `WOF_GapFill_INDEX.md`
- `WOF_Engine_Schemas.yaml` (+ optional `.json`)
- `WOF_Interactables_Buildings_Housing.yaml`
- `WOF_Rules_Modules.yaml`
- `WOF_AshCompact_LockedIds_Typed.yaml`
- `WOF_Social_Mail_Moderation.md`
- `WOF_Combat_Instance_Net.md`
- `WOF_Vendors_Crafting_Gathering.yaml`
- `WOF_Copy_Mail_UI_Errors.md`
- `WOF_Ops_Telemetry_Flags.md`
- `WOF_PerWorld_Skin_Deltas.md`
- `WOF_Badge_Circuit_Fill.md`
- `WOF_Rename_Table.md`
- plus any extra files listed in the prompt

---

```
You are doing MAXIMUM GAP-FILL GENERATION for WOF (World of Fantasy): a later-release family of original TEXT MMOs on ONE engine. This is NOT live SynapticGM. Do not write production app code. Do not import live-game files, prompts, saves, or databases. Do not invent 3D meshes, navmeshes, or collision.

You have an UNLIMITED run. Use it. Do not summarize. Do not write “TBD”, “similar to Ash Compact”, or “implement later.” Empty tables are a failure. If a file gets long, finish it and continue in the next numbered file. Prefer COMPLETE YAML/JSON that a coder can paste into TypeScript over prose novels.

============================================================
THIS RUN IS NOT WORLD NOVELS
============================================================
23 world packs already exist (markdown). DO NOT regenerate maps, peoples, first-hour quest novels, Theme Kit novels, or ban-list novels for those worlds.

You MAY:
- Convert existing lore into TYPED tables/YAML (ids, verbs, numbers).
- Fill Badge Circuit to Ash Compact start depth (it is the only thin pack).
- Write a rename table for dump flags.
- Author SHARED catalogs (props, housing, vendors, mail, emotes, status effects) plus per-world RENAME rows (same id, different public name).

You MUST NOT:
- Rewrite the 23 setting bibles.
- Redesign networking, Agones, 36-month ops, patent-style platform folders, ember-crown / pactbeasts.
- Put any of this into live SynapticGM.
- Claim the unshipped product is an MMO in player-facing copy. Honest labels: “solo” / “private co-op” / “limited online region.”

============================================================
ALREADY HAVE — DO NOT REGENERATE
============================================================
CONTENT: 23 world packs + index + Theme Kits (Ash Compact, First-Song, Isekai Gate, Bonded Menagerie, Circuit Arc, Halo Term, Hollow Term, Starwake, Lanceyard, Quarry Pact, Sect Ascension, Gridrun, Blackwake, Night Charter, Badge Circuit, Dust Line, Veil Watch, Crew Score, Hearth Season, Stage Light, Pitch League, Route Lantern, Card Vein).

ENGINE LOCKS: one engine, many packs. Code owns dice/HP/catalogs/quest ticks/loot/gold/lockouts/instance seeds. LLM narrates AFTER state is committed. Overworld = Tier 3 shared hubs + INSTANCED combat. Not contested open-world PvP (Tier 4 deferred). Party 2–5. Raid 10 for combat skins. Lockstep rounds. Weekly per-character per-boss lockout. Friends-first finder. Personal loot. Wipe → checkpoint. Never sell outcomes / lockout skips / catch / raid clears / random POWER packs. Two wallets: gold vs cosmetic tokens. Presence = nearbyPlayerCount + races only. No global chat v1. No mid-combat fill. No permadeath v1. No guild bank v1. No corpse run.

FROZEN NAMES (use exactly): Ash Compact, Tide Covenant, Hearthborn, Lanternfolk, Saltkin, Stonevein, Reedfen, Lampwood, Brinewatch, Granite Stair, Millcross, Wickhaven, Coil Pier, Anvil Gate, Ash Seat, Tidehold, The Divide, Lampwood Gate, Unlit Hollow, Coil Warehouse, Anvil Deep, Millstone Hollow / The Millwarden (10-man, 3-phase — do NOT resize).

Ignore dump titles: Ember Crown, Pactbeasts of the Lanternwild, Gloamwild, Deepgate Accord, Salt Ledger, Sunloom Circuit, Lantern Run Company.

Skip Hearth Ruin entirely (live SynapticGM occupies that lane). Do not create Void Reach or Sky Frame. Isekai Gate is WOF-app only.

============================================================
DUMP ERRORS — FIX IN A RENAME TABLE, DO NOT RELITIGATE
============================================================
- Tide Covenant = FACTION, not a race/region/creature.
- Saltkin = RACE, not a creature. NO Saltkin-named fauna.
- Hearthborn, Lanternfolk, Saltkin, Stonevein = RACES, not regions.
- Ash Compact, Tide Covenant = FACTIONS, not regions.
- Circuit Arc = shonen tournament (not sci-fi). Starwake = space / ship_board. Stage Light = idol. Lanceyard = mecha / frame_heat. Halo Term = powers school. Hollow Term = magic school. Route Lantern = romance / bond_heart. Veil Watch = horror / steadfast.
- First-Song instance currently called “Gloam Court Siege” MUST be renamed (Gloamwild echo). Pick a new original name; keep the encounter structure.
- Bonded Menagerie kit `saltwind_keeper` MUST be renamed (too close to Saltkin). Pick a new id + public name.
- Isekai rules module id: lock ONE slug: `hp_check_floor_flags` (not `hp_check_floor`).
- Bonded Menagerie big instance: lock 5-person Fair as the start “big night”; Migration Night 10 is Mid+ optional. Do not leave both as “the” big instance.
- Cross-world “Lantern …” POIs are OK if namespaced by worldId. Never merge maps.
- Ash Compact first-hour titles in the novel dump drifted vs locked code. KEEP LOCKED IDS below. New beats get NEW ids. Do not rename quest_lanternfolk_race_1 to “The First Wick.” If the dump used that title, put it in rename-table as DISPLAY-ONLY alias = rejected.

============================================================
LOCKED IDS (Ash Compact code — never reuse for a different object)
============================================================
Places: poi_reedfen_square, poi_millcross, poi_reedfen_marsh, poi_reedfen_hall, poi_reedfen_pier, poi_reedfen_mill, poi_reedfen_crossroads, poi_reedfen_marsh_edge, poi_lampwood_gate, poi_wickhaven, poi_lampwood_path, poi_wickhaven_loft, poi_ember_cut, poi_watch_lantern, poi_unlit_bend, poi_hollow_mouth, poi_brinewatch_dock, poi_coil_pier, poi_tidal_flats, poi_covenant_hall, poi_drying_racks, poi_stilt_walk, poi_flood_store, poi_anvil_gate, poi_granite_stair, poi_oath_hall, poi_ore_siding, poi_cut_face, poi_slag_run, poi_hollow_stair, poi_ash_seat, poi_tidehold.

Quests (keep titles in code): quest_hearthborn_race_1 “The Hearthborn's Request”, quest_hearthborn_race_2/3, quest_miller_1/2/3, quest_reedfen_zone_1/2/3, quest_lanternfolk_race_1 “Keep the Path Lit”, quest_lanternfolk_race_2/3, quest_wick_1/2/3, quest_lampwood_zone_1/2/3, quest_saltkin_race_1 “The Flats Are Wrong”, quest_saltkin_race_2/3, quest_fisher_1/2/3, quest_brinewatch_zone_1/2/3, quest_stonevein_race_1 “The Stair Has a Crack”, quest_stonevein_race_2/3, quest_smith_1/2/3, quest_granite_zone_1/2/3.

Dungeons: dungeon_lampwood_gate, dungeon_unlit_hollow, dungeon_coil_warehouse, dungeon_anvil_deep.

Races start: hearthborn @ poi_reedfen_square, lanternfolk @ poi_wickhaven, saltkin @ poi_brinewatch_dock, stonevein @ poi_anvil_gate.

Items that exist (keep ids; you MAY propose Compact-native DISPLAY names for item_system_bandage / item_stamina_pill so they do not say live “System-Issue” — do not change ids).

Capitals poi_ash_seat and poi_tidehold currently have EMPTY exits. You MUST output a travel graph: each start hub → The Divide → faction capital. Invent poi_the_divide and road/ferry places with NEW ids. No teleport.

============================================================
LOCKED DEFAULTS (do not reopen; mark speculative only if you must contradict)
============================================================
- Hub story beat = 1 turn for that player. Tell / party chat / AH browse / mail / idle = 0. Round RESOLVE spends the turn.
- Dungeon Mode A = 1 turn per player per round (personalized prose). Raid Mode C = even-round billing so spent stays integer (treat dump “0.5” as every other round or 2 players share 1; pick one and specify).
- Mid-combat fill = NO. Disconnect follows last plan / Hold. Fill only at checkpoint.
- Death = downed in fight; wipe → checkpoint. No permadeath. Durability: wipe −10% equipped; combat −1%/round weapon+armor; broken = 0 stats, repairable. Inn rest: free HP/STA in hub (1 turn), does not repair.
- Two clients, one account. Shared friends. Separate gold, subs, chrome shops. No save import from live SynapticGM.
- Raid 10 = Mid+ only. Free can finish a SOLO 5-man in one sitting (12–18 turns). Party 5-man may take 2 sessions.
- Kid Mode: 10 text turns/day, same model quality; parent may share from their pool. No public DMs, public trade, or voice for kids. Route Lantern: crushes OK, no sexual content.
- Push: essential only (party invite, system). Quiet hours. Never notify others’ combat.
- Theme Kit includes 1 ambient loop + combat/UI SFX. Extra music is shop.
- English v1.
- Eval: hybrid CI ban-list/place probes + human on major model swaps.
- AH v1 = region (Ash Seat / Tidehold), BUYOUT ONLY, escrow, tax, expire, mail. No bid wars. No LLM in the trade path.
- Merchant deals = PERSONAL COPIES per player (100 players do not drain one miller treasury).
- Housing guests = friends-only. They CANNOT steal from chests v1.
- Server clock = weekly tick + catch-up on login capped at 4 weeks + one System mail digest. LLM never mints gold, rent, or sales.
- Character slots: 4 per world unlock v1. Delete cooldown 7 days.
- Direct player trade = friends-only, 2-minute accept window, items soulbound-on-trade-delay 1 hour for high-value (define gold threshold). No open-world trade shout.
- Bank/stash = personal only, 4 tabs, no guild bank.
- Bind: quest uniques soulbound; junk/materials tradeable; cosmetics account-bound.
- Encumbrance: stack 99 materials; 1 unique; overweight = cannot enter instances (can still walk hub).
- Fast travel: inn-bind at hub inn (1 turn first bind, 0 later from same region board). No combat teleport. Ferry/coach are Place exits with gold cost in data.
- Gacha, loot boxes, stat-power cash shop, lockout skips, catch-rate packs = FORBIDDEN.
- Gambling (betting, card-cash) = forbidden in Kid Mode and not in v1 even for teen worlds.

============================================================
IP LOCK (hard)
============================================================
Genre PATTERNS only. Original names. Forbidden: Warcraft/Blizzard unique, Tolkien unique, SAO unique, Pokémon franchise, Palworld, MHA, Genshin, Harry Potter, Warhammer, Elder Scrolls unique, D&D unique setting/monsters-as-product, FF unique, WoW raids, One Piece, Naruto, Star Wars orders, VtM clans, licensed idols/sports/mecha.

Public-domain folklore may inspire. Never reuse Compact races as another world’s elves/dwarves/sailors.

============================================================
FILE OUTPUT (mandatory — create downloadable files)
============================================================
Tell the user at the end: “Download every WOF_* file from the file tree.”

1) WOF_GapFill_INDEX.md
- Table of every file, row counts, what a coder should ingest first.
- Integrity checklist (locked ids preserved, dump titles unused, no 3D, no live import).

2) WOF_Rename_Table.md
- Old dump string → new locked string for: Gloam Court Siege, saltwind_keeper, Isekai module slug, Bonded big-instance lock, any other collisions you find.
- Rejected display titles vs locked quest ids.

3) WOF_Engine_Schemas.yaml
COMPLETE schemas with every field, type, allowed enums, defaults, uniqueness rules, packFormatVersion: 1.
Must include (all of these, not a subset):
Account, Session, Device, Character, CharacterLock, Entitlement, WalletGold, WalletCosmetic, FriendsEdge, BlockMute, Party, Raid, Instance, InstanceToken, ReconnectState, ExpectedRevision, PresenceHub, TellMessage, PartyChatMessage, CannedSay, MailItem, MailDigest, WorldClock, CatchUpJob, PlaceDef, InteractableDef, PropInstance, Deed, InteriorGraph, HousingGuest, Holding, DealPersonalCopy, AuctionListing, Escrow, VendorDef, VendorStock, RepairTicket, BankTab, TradeWindow, ItemTemplate, ItemInstance, Durability, StackRule, BindRule, DropTable, LootGrant (idempotent key), QuestDef, QuestObjective, QuestProgress, TalkTree, TalkNode, ChoiceButton, TalentNode, Recipe, GatheringNode, StatusEffect, CombatReceipt, RoundPlan, HoldOrder, Checkpoint, Lockout, SpeciesTemplate, BondRecord (Menagerie), ShipBoardState, FrameHeatState, ScoreSetState, SteadfastState, CardLaneState, CozyTickState, HeatWantedState, RealmGateState, FloorFlagState, ReportTicket, ModerationAction, FeatureFlag, KillSwitch, TelemetryEvent, PackManifest, IdNamespace, BanListEntry, NameFilter, AgeGate, FamilyPlan, PushPref, SupportMacro.
Each schema: description, fields, what CODE owns vs what LLM may narrate, failure modes (double-grant, LLM invents gold, desync).

4) WOF_Rules_Modules.yaml
One complete module spec each: hp_check, hp_check_floor_flags, bond_type, ship_board, frame_heat, score_set, steadfast, card_lane, cozy_tick, bond_heart, heat_wanted, realm_gate, hunt_part.
For each: ledger fields, start values, what a round resolves in CODE, wipe/checkpoint, lockout, forbidden prose inventions, 8 status effects, 12 combat verbs, 5 chrome UI templates, 10 eval probes (inputs → expected ledger). Numbers not flavor.

5) WOF_Interactables_Buildings_Housing.yaml
THIS IS THE BUILDING/OBJECT PACK. Text MMO buildings are Place + interactables, not meshes.
Include:
- 80+ shared interactable verbs: open, close, knock, rest, repair, tend, mill, light_wick, dock_tie, pump, forge, stall_open, list_ah, mail_read, bind_inn, gather, craft, cook, plant, harvest, feed, brush, berth, hangar, exam_desk, rehearsal, scoreboard, inspect, read_note, unlock, bar, unbar, pull_lever, ring_bell, queue, sit, emote, give_quest_item, turnin, buy, sell, bank, stash, upgrade_cosmetic, dye, display_trophy. Each: id, verb, requires[], grants[], turnCost, llmMayNarrate bool.
- 60+ prop templates (door, personal_chest, mill_wheel, wick_post, dock_cleat, anvil, workbench, inn_bed, stove, window, fence, stall_counter, auction_board, notice_board, well, pump, ferry_bell, coach_post, lamp, torch_sconce, bookshelf, lore_plaque, locked_gate, trap_plate, secret_hatch, ranch_stall, garden_bed, ship_wheel, frame_cradle, exam_hall_desk, stage_mark, pitch_line, card_table). Each: id, placeKinds[], mapScale, indoor/outdoor, durability?, vendorId?, interiorGraphId?.
- Building types: inn, house, shop, mill, hall, dock, smith, ranch, berth, hangar, school_dorm, club_room, concert_hall, pitch, court, chapel, bank, ah_hall, ferry, coach. Each: default interior graph 4–8 rooms (room id, name, exits, interactables[], outdoor false).
- Housing: Deed schema filled; plot scarcity NUMBERS per named Compact hub (Millcross, Wickhaven, Coil Pier, Anvil Gate, Ash Seat, Tidehold) — how many player houses, stalls, inns. Buy vs build recipes (materials + clock weeks). Upkeep gold/week. Unpaid → lockout 1 week then NPC seize week 3. Cosmetic furniture 80 items (no combat power) in 8 sets. Functional furniture: bed (rest), chest (personal stash), stove (cook), workbench (craft), ranch stall, ship berth, frame cradle.
- Grief matrix: guests cannot loot chests; owner can kick; instance is private.
- Per-world rename table: same prop id, Compact vs Bonded ranch vs Starwake berth vs Lanceyard hangar vs Hearth Season cottage vs Stage Light dressing room vs Pitch League locker vs Isekai safe-floor apartment. Do not invent a second housing engine.

6) WOF_Vendors_Crafting_Gathering.yaml
- VendorDef for every Compact start merchant + capital AH clerks + innkeepers + repair. Stock as itemId + qty + restockPerWeek + buyPrice + sellPrice. Repair kits. NO power packs.
- Gathering nodes: 24 Compact (reed, wick-sap, brine-salt, ore-chip, etc.) + 8 shared patterns other worlds rename. Node: placeId, itemId, dailyCap, toolRequired, turnCost.
- Crafting recipes: 40 Compact (food, repair, wick-oil, mill-bag, simple furniture) + 20 housing build. Each: inputs[], output, station interactable, fail chance 0 at v1 (no brick).
- Cooking / inn food buffs: 8, duration in rounds, CODE-owned, not LLM.
- Bank tabs labels. Stash size.

7) WOF_AshCompact_LockedIds_Typed.yaml
CONVERSION FILE — not a new bible.
- Every locked place with FULL fields including exits[]. ADD poi_the_divide and road/ferry nodes so starts connect to capitals. Keep existing POIs.
- Every locked quest as typed QuestDef (objectives already in code — copy them exactly, then ADD new side/daily/hidden quests with NEW ids to reach 18–25 beats PER start without renaming locked ones).
- Talk trees JSON/YAML for every durable Compact NPC already named: Elder Mara, Miller Tobin, Keeper Wynn, Watcher Dell, Keeper Renna, Merchant Fenn, Pathwarden Sila / Wick Tender Cal if present in packs, Tide-reader Nesh, Fisher Pell, Hall Voice Orin, Stair-oath Kell, Smith Vorr, Siding Rusk. Nodes: greet, quest_offer, quest_progress, quest_turnin, gossip×3, refusal. No engine words in NPC mouths.
- ChoiceButton decks per start hub (12 buttons): label, requires, intentKind. No lunge-at-corpse. Combat buttons = fight moves. Talk = dialogue.
- Vendor stock lists for Fenn + one merchant per other start + both capitals.
- Drop tables for each locked species (personal loot, % and itemId).
- Talent tree 16 nodes {id, cost, requires[], effect flags} Compact only.
- Interior graphs for: mill, wick loft, drying racks, oath hall, player house (generic), inn.
- Travel costs: gold + turns for ferry/coach rows.
- Capital hubs: 8 POIs each (NEW ids) + 6 NPCs each with talk trees + promise board interactable. Mid-game board quests NEW ids (12).
- Millstone Hollow: 3-phase room script with room ids, encounters, checkpoints — still 10-man. Lore short; data complete.

8) WOF_Badge_Circuit_Fill.md
The only world you MAY deepen to start-pack depth. Original city, original capes, 4 patrol hubs, 18 quests on primary start, 6 NPCs full talk, 1 five-man, ban-list 40+, Theme Kit row if missing. Do not clone a licensed hero city. Do not touch other world novels.

9) WOF_Social_Mail_Moderation.md
- Canned hub say/emote set: 40 lines, ids, animation-less text. Per-world 10 extra via rename table.
- Tell / party chat rules, rate limits, mute/block/report.
- Report categories (12) + auto vs human.
- Mail templates (25): weekly digest, upkeep warning, seize warning, AH sold, AH expired, lockout available, party invite, friend request, repair done, deal payout, catch-up cap hit, Kid share turns, entitlement granted, refund, ban, mute, raid lockout, inn bind, deed granted, vendor restock, festival start, reconnect checkpoint, empty inbox, error retry.
- Presence strings: “3 nearby (Hearthborn, Lanternfolk, Saltkin)” pattern. Never names of strangers.
- Friends-first finder copy. Invite link expiry.
- No global LFG chat v1; v2 listing board schema only (fields, no copy-paste social network).

10) WOF_Combat_Instance_Net.md
DATA/PROTOCOL not production code.
- Instance lifecycle: create, join token, ready, round, hold, checkpoint, wipe, leave, reconnect, abandon.
- ExpectedRevision / idempotent loot grant keys.
- Party 2–5, raid 10, kick/lead, loot = personal always.
- Disconnect matrix (10 cases) → Hold vs kick-at-checkpoint.
- Combat receipt fields (dice, hp delta, durability, loot ids).
- Plan-auto vs manual (same spend).
- Phone raid frame copy (compact 10 rows, Stop stays put).
- Targeting, threat (simple lockstep: declared target), rez at checkpoint only.
- Status effect catalog 24 shared (bleed, slow, light-ward, heat, hull-breach, steadfast-break, score-buff, bond-scare, wanted, exam-focus) with module tags.
- Traps, secret exits, locked doors as interactables inside instances (12 examples Compact 5-mans).
- Logout-in-combat: Hold. Logout-in-hub: persist placeId.

11) WOF_Copy_Mail_UI_Errors.md
Player-facing strings. English v1. No licensed names. Honest product labels.
- HUD labels skinned tokens (Inventory, Journal, Map, Mail, Nearby, Turns left) — Compact default + how Theme Kit overrides.
- Empty states (20): empty bag, empty mail, no party, AH none, house none, vendor too poor, overweight, lockout, Kid cap, offline party, reconnect, image N/A (WOF is text — no picture fail copy).
- Error codes WOF-E001…E080 with player sentence + what CODE should do.
- Character create: name rules, filter, origin ask Compact (in-world, not Earth unless Isekai Gate). Opening stake reminder.
- Death/downed/wipe/repair/inn copy.
- Store honesty blurb (solo / private co-op / limited online region). What NOT to claim.
- Age ratings / content descriptors per maturity (all-ages / teen / teen+).
- Accessibility: font scale, TTS reads System chrome + prose, no color-only danger.
- Push copy (10) matching essential-only.
- Support macros (15).

12) WOF_Ops_Telemetry_Flags.md
NOT a 36-month platform rewrite. Just what CODE needs:
- Kill switches (20): instances, tells, AH, mail, housing, vendors, rewards, writer, presence, entitlements, Kid, raids, dailies, clock tick, trade, finder, push, cosmetics shop, world unlock, eval-probe.
- Feature flags matching friends-alpha → clock → housing → AH → second world.
- Telemetry event names (40) with payload fields. No PII in events (hash account).
- Capacity: concurrent instances, LLM budget per player per day by sub tier (Free/Mid/High) — PICK numbers, mark speculative.
- GDPR delete field list (character, mail, reports retain window).
- Admin actions (12) as data: grant item, unstuck place, reset lockout (must NOT be a paid player SKU), shadow-ban chat, kick instance.
- Eval probe suite: 30 place/id/ban-list tests.
- PackManifest + migration notes packFormatVersion 1 → 2 empty hook.
- Id namespace: `{worldId}:{kind}:{slug}` uniqueness rules. “Lantern” POIs allowed if world-prefixed.

13) WOF_PerWorld_Skin_Deltas.md
SHORT tables only (not novels). For each of the 23 worlds:
- Housing/holding label (house / ranch / berth / hangar / dorm / dressing room / locker / apartment / wagon / chapel).
- Clock flavor (week / voyage / season / term / tournament cycle).
- 10 interactable public-name remaps.
- Whether raid 10 exists or “big night” 2–5.
- Wallet chrome names (gold analog vs cosmetic analog) — still two wallets, never mix.
- One row: Kid Mode extra bans.
Do not reprint maps or quest DAGs.

14) WOF_Progression_LiveOps.yaml
- XP curve 1–30 Compact (table). Soft cap note.
- Rested XP: none v1 (pick and stick).
- Daily/weekly contract templates (10) with caps. No pay-to-refresh.
- Reputation / faction standing 0–6 ranks Compact only (Ash Compact vs Tide Covenant) — local trust, not world-save.
- Achievement/title catalog 30 (code flags). Titles tab.
- Collection log schema (creatures, cards, cosmetics).
- Festival calendar 12 rows (one per month-analog) Compact + which skins reuse the clock.
- Weather / day-night / tide: cosmetic default; Lampwood light and Brinewatch tide MAY gate 2 interactables (list them). No weather damage v1.
- Login rewards: cosmetics only, never power. Optional; default OFF at friends-alpha.

15) WOF_Character_Alts_Safety.yaml
- Alt slots, appearance fields, voice, fashion (cosmetic).
- Tutorial skip on alt.
- Name reservation, rename (cosmetic token), reserved words.
- FamilyPlan schema (Kid 10 turns, share).
- Block list of sexual/gore/drugs/gambling prompts for Kid rewrite-or-skip (WOF).
- Direct trade scam patterns and CODE counters (15).
- Gold-seller / bot signals as REPORT categories only (no vigilante PvP).
- Character transfer: none v1. World hop: none v1. Cross-title inventory: FORBIDDEN.

16) OPTIONAL but if you have room, do them:
WOF_Lore_Readables.yaml — 40 readable notes/plaques Compact (itemId, placeId, text ≤ 80 words, no quest-spoil for hidden).
WOF_Travel_Taxi_Ferry.yaml — coach/ferry graphs with gold/turn costs.
WOF_Memorable_Text_Plates.md — text-only “book plates” (opening, first 5-man clear, first death, true-ending). No image pipeline (WOF is text).
WOF_Audio_Cue_List.md — cue ids for Theme Kit SFX (hit, wipe, mail, level, auction) — names only, not files.

============================================================
QUALITY BARS
============================================================
- Unique ids inside a file and across Compact locked set.
- Numbers in data. “The miller pays you” is illegal; rewardGold: 12 is legal.
- Dialogue in-world. No “token / LLM / lockout / prompt” in NPC mouths unless diegetic OS (Isekai Gateglass/Waymark only).
- Mark speculative with SPEC: if you invent a number that John might change.
- Do not clone licensed housing UIs or auction-house product names.
- Do not tick live SynapticGM clocks. Do not output live src/ paths.
- Friends-alpha bar reminder in INDEX: Reedfen loop + solo 5-man + presence. Housing/AH are later gates — still GENERATE their data in this run so coding is unblocked.

START WITH the INDEX + Rename table + Engine schemas, then Interactables/Housing, then Ash Compact typed YAML (locked ids), then Rules modules, then the rest until every mandatory file exists. Badge Circuit fill after Compact typed data. Per-world deltas last.

END by listing every file, row counts, and a 25-line integrity checklist (locked ids, dump titles unused, Gloam renamed, saltwind renamed, no 3D, no live import, two wallets, personal loot, no mid-combat fill, honest store copy).
```
