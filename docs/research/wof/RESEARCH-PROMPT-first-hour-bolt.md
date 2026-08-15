# WOF — bolt.new first-hour / onboarding prompt

Paste into bolt.new. Download **`WOF_FirstHour_Dump.md`**. Drop it in this chat or `docs/research/wof/pasted/`.

---

```
You are doing design research for WOF (World of Fantasy), a later-release text MMO platform. NOT live SynapticGM. No production code. No licensed settings (no Warcraft, Pokémon, Palworld, Middle-earth, MHA, Genshin, Harry Potter, etc.). Genre PATTERNS only.

FILE OUTPUT (mandatory)
1. Create ONE new file at project root: WOF_FirstHour_Dump.md
2. Entire dump in that file, not only chat.
3. Tell the user: "Download WOF_FirstHour_Dump.md from the bolt.new file tree."
4. Do not split files.

LOCKED (do not contradict)
- Code owns dice, HP, catalogs, quest ticks, loot, gold. LLM narrates only.
- First ship: Tier 3 shared hubs + instanced combat. Strangers never merge fights.
- Character create picks a race kit (Hearthborn / Lanternfolk / Saltkin / Stonevein) and a starting zone (Reedfen / Lampwood / Brinewatch / Granite Stair).
- Overworld is a street-style local map; dungeons are node graphs with fog.
- Do not ask “what do you do?” until a real story beat exists. Story first, then System window.
- Never System-only turns. Never “XP Gained: 0” as the whole beat.
- Kid Mode exists (fun swear swap, PIN; slurs masked). No IAP/ads in Kid Mode.
- Friends-first group finder. Raid 10 is later in the first hour — not minute 5.
- Working names: Ash Compact, Tide Covenant, Millcross, Ash Seat, Millstone Hollow.

ALREADY DONE (10 lines max, then DO NOT redo)
Combat ledgers, lockstep, plan-auto, housing/AH schemas, memory stores, catalogs, talent/quest code ownership.

FILL THESE GAPS

## 1) First 5 minutes (create → first beat)
Step list for Ash Compact:
- Account vs character vs world-skin select
- Race + look (clothes stored; insults can become clothes — pattern from live, do not implement live)
- Name rules (original; licensed-name reject)
- Spawn Place + first authored beat (who talks, what is at stake)
What MUST be code (spawn Place, starter kit, first quest id).
What LLM may write (the opening prose).

Copy/avoid patterns: WoW/FFXIV starting zone (systems not IP), Fallen London first storylet, KoL tutorial island, MUD newbie school, Hidden Door / F&F session start. Cite public design talks / wikis. Do not copy their plots.

## 2) First 30–60 minutes (the “I get it” loop)
A good first hour in a TEXT MMO must teach, in order:
1. I am a person in a Place
2. Talking is dialogue, not a move stub
3. The System window is after story
4. Combat is lockstep (one round = everyone acts)
5. Quests tick in a journal the code owns
6. Other players exist in the hub but do not hijack my fight
7. Logout is safe; world clock still exists

Write a beat-by-beat Reedfen (Hearthborn) hour: ~8–12 authored beats. Original NPCs only. Include one tiny instanced fight (2–3 trash, no raid). Include one hub glimpse of other players (presence, not merge).

## 3) First group (when, not how combat works)
When should the game offer a 2–5 dungeon? After which quest flag?
Friends-first: what if the player has zero friends? Solo-able first dungeon vs “wait for a friend” (pick one v1 + why).
Duty-finder / LFG patterns from FFXIV/WoW — copy the JOB (queue, role check), not the UI chrome or names.

## 4) Character identity in TEXT (no 3D)
How KoL, Fallen London, MUDs, and visual-novel-adjacent games make “this is my character” without a 3D doll.
Paper-doll / inventory portrait / title / clothes — patterns only.
What to persist in player memory (1 pin + summary) after hour 1.

## 5) Failure modes of tutorials
Info-dump, unskippable lore, combat before Place, System before story, forced multiplayer, 40-minute unskippable cutscene-equivalent, LLM inventing a different spawn town.

## 6) Kid Mode / ratings in hour 1
What the first hour must not show if maturity = all-ages vs teen vs mature.
No IAP prompts in Kid Mode.

## 7) John's calls (max 6)
Skip tutorial vs mandatory 15 min; solo-able first dungeon yes/no; character slots at create (1 vs 3); show other players in first hub yes/no.

RULES
- TypeScript-like interfaces for TutorialBeat, StarterKit, FirstHourFlags.
- Mark speculation.
- Original names only in examples.
- Do not design the 10-man raid into the first hour.
- Do not change live SynapticGM.
```
