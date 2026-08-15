# WOF — bolt.new text-MMO / MUD / LLM-party patterns prompt

Paste into bolt.new. Download **`WOF_TextMMO_Patterns_Dump.md`**. Drop it in this chat or `docs/research/wof/pasted/`.

---

```
You are doing design research for WOF (World of Fantasy), a later-release text MMO platform. NOT live SynapticGM. No production code. No licensed settings as CONTENT. You MAY name real games as SOURCES (Evennia, Aardwolf, Discworld MUD, Gemstone IV, Fallen London, Kingdom of Loathing, Puzzle Pirates, EVE, WoW, FFXIV, Albion, Hidden Door, Friends & Fable, Summon Worlds, AI Dungeon, NovelAI, Latitude, Stardew-like cozy, collection-game PATTERNS). Never import their races, places, slogans, or unique creatures into WOF.

FILE OUTPUT (mandatory)
1. Create ONE new file at project root: WOF_TextMMO_Patterns_Dump.md
2. Entire dump in that file, not only chat.
3. Tell the user: "Download WOF_TextMMO_Patterns_Dump.md from the bolt.new file tree."
4. Do not split files.

LOCKED
- Code owns math. LLM narrates. Lockstep combat. Tier 3 hubs. Per-player LLM budget. Original names only in WOF examples (Ash Compact, Reedfen, Millcross, Millstone Hollow).
- Name freeze: Circuit Arc = shonen tournament; Starwake = space opera; Stage Light = idol. Do not swap those.

ALREADY DONE — do not redo schemas
EncounterLedger, AH escrow, housing deeds, memory stores, catalogs.

FILL: HOW OTHER GAMES MAKE IT WORK (copy the JOB, never the IP)

## 1) Persistence & identity
Table: game | how you feel “this is my character” | logout safety | what persists overnight.
Rows: a MUD, Fallen London, KoL, F&F-style party, Hidden Door, a graphical MMO (systems only).
WOF v1 pick: what we keep.

## 2) Commands vs free text vs buttons
Who uses parser commands, storylets, chat-RPG, or hybrid.
WOF is hybrid: buttons for combat/choices + free text for talk.
When free text must be classified as dialogue vs action vs protest (live lesson: protest is dialogue, not a lunge).
Failure: LLM treating “I refuse” as a physical move.

## 3) Empty-world problem
How MUDs and Fallen London avoid “the town is a paragraph and nothing happens.”
Hub NPCs that are DURABLE (already locked). How many named NPCs per starter hub (range + why).
Ambient other-players: presence list vs full emote spam. Grief via emotes.

## 4) Short sessions
KoL / Fallen London / mobile MMO daily loops vs WoW raid night.
What a 15-minute WOF session can complete (one story beat, one deal, one AH buy, NOT a 10-man).
What a 90-minute session can complete (5-man instance).

## 5) Collection without becoming that licensed franchise
Pokédex-shaped LOG as a UI pattern (seen/caught index) — already locked as Bonded Menagerie.
How KoL familiars, Fallen London qualities, MUD bestiaries, and ranch/collect games make collecting satisfying WITHOUT trading power gacha.
WOF: collection = seen/caught + nickname; no random POWER packs.

## 6) LLM party games — what players praise and hate
Hidden Door, F&F, Summon Worlds, AI Dungeon: sentiment only.
Praise: memory of names, GM that follows the room, friends in one scene.
Hate: math cheating, host-pays, empty log, model refusing the genre, repetition, “you follow through” collage.
Map each hate to a WOF lock we already have or a new failure mode.

## 7) Cozy / school / shonen players (not D&D)
What they expect in the first week that raiders do not.
Hearth Season, Hollow Term / Stage Light, Circuit Arc — session shape only.

## 8) Copy / avoid (strict)
For each source: COPY (job) | AVOID (IP / feel-alike).
At least 12 sources.

## 9) John's calls (max 6)
Parser commands as power-user overlay yes/no; presence list in hub yes/no; daily storylet cap yes/no.

RULES
- Cite public sources (wikis, GDC talks, blogs, Steam discussions) where possible.
- Mark speculation.
- No production code. No live SynapticGM changes.
```
