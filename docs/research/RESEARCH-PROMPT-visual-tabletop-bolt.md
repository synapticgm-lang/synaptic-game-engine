# Bolt prompt — visual modes + D&D/tabletop (live SynapticGM)

Paste the block below into bolt.new. After it finishes, download `SGM_Visual_And_Tabletop_Dump.md` and drop it in chat. Archive as `docs/research/pack-12-visual-tabletop-dump-YYYY-MM-DD.md`.

This is LIVE SynapticGM only. Not WOF.

---

```
You are writing research for SynapticGM, the LIVE single-player AI GM. This is NOT WOF and NOT a later MMO. Do not write app/production code. Do not import licensed settings (no Warcraft, Pokémon, Palworld, Middle-earth, Blizzard, Wizards of the Coast product names, or official D&D monster/spell lists). Use original names or public-domain/SRD-safe generic terms (attack roll, armor class, hit points) without copying WotC adventure text or monster stat blocks.

FILE OUTPUT (mandatory — bolt.new)
1. Create a NEW file at the project root named exactly: SGM_Visual_And_Tabletop_Dump.md
2. Put the ENTIRE dump in that file (not only in chat).
3. When done, tell the user: "Download SGM_Visual_And_Tabletop_Dump.md from the bolt.new file tree."
4. Do not split across multiple files. One markdown file only.
5. No React/Vite/Supabase implementation. Schemas, beat sheets, prompt contracts, do/don't rules, and copy banks only.

LOCKED (do not reopen or contradict)
- Engine modes (rules): litrpg | dnd | rpg. Visual modes (look): comic | classic. They are INDEPENDENT. Comic/illustration must work on all three engine modes.
- Code owns dice, HP, XP, loot, kit, room graph, mob counts, quest reveal, and choices. The LLM writes this turn's camera only (2–6 new sentences, or a panel script). It must not invert the ledger.
- Turn shape: intent → hidden-state check → code math/ledger → outcome token → writer → code warden → story first, then System/table chrome → choices from the committed beat.
- Dual-AI max: 1 writer + optional cheap rewrite. Warden is CODE.
- Unique story every turn. No canned "just ahead of you" / look-around collage.
- Images are PURE ART: no text, speech bubbles, UI, or HUD in the generated picture. Bubbles/captions are composited later by the app.
- Art style preset controls line/ink/palette ONLY. World canon (modern Earth Integration vs medieval tabletop) overrides the preset. Do not put neon/cyber into a tavern, or plate armor onto a Tesco street, unless the scene says so.
- Classic text mode: no routine panels. Optional memorable splash only when classicMemorableImages is on.
- Comic mode: single-panel or paged/webtoon grid from a panel script. classic-book preset never uses a multi-panel grid.
- Opening journal stays empty until name + place. First Blood / Wave rules are LitRPG-campaign specific — D&D mode uses its own opening (tavern/road/manor), not Integration.
- Never sell combat outcomes. Cosmetics must not change dice math.
- Kid Mode: swear swap + PIN; slurs masked.

WHAT ALREADY EXISTS (do not redesign from zero — improve and fill gaps)
- visualMode comic | classic; comicLayout paged; artStylePreset list (manga, manhwa, noir, pulp, watercolor, ligne claire, sumi, classic-book, etc.)
- Image kinds: comic-panel, classic-illustration, milestone-illustration, item-icon, character-portrait
- Visual consistency block + player-action-on-first-panel
- D&D engine: tabletop formatting, boxed read-aloud, inline dice notation, visual dice tray, no LitRPG System popups
- RPG engine: story RPG without System apocalypse chrome
- LitRPG: System chrome after story

WHAT TO WRITE
Be specific enough to implement later. TypeScript-like interfaces where useful. Mark v1 vs later. Cite public methodology only.

## 1) Visual modes that work on ANY engine
How comic, classic illustration, and memorable splash attach to litrpg, dnd, AND rpg without leaking the wrong chrome.
- Per-mode "what the picture must show" contracts (Integration street vs tavern vs story-RPG)
- When to generate: every turn vs combat vs milestone vs never (classic)
- Panel budget by mode (1 panel vs 2–4 paged vs webtoon strip)
- Failure modes: wrong era, extra limbs, text-in-image, same face drifting, knife becoming a sword
- Consistency: same clothes, same knife, same street, same tavern light — from code facts, not the model's memory
- Offline / no-key / rate-limit: what the UI shows instead of a broken panel
- Kid Mode art: violence/body rules without changing the ledger

## 2) Comic / graphic-novel mode (make it actually run)
Panel script schema the writer must emit (or that CODE derives from the beat).
- Shot list: establishing, action, reaction, close-up — mapped to the outcome token
- Speech/caption chips: who speaks, where they sit, never baked into the pixels
- Reading order (LTR paged vs vertical webtoon)
- Combat: one panel per resolved swing vs one splash per round — pick v1
- Opening (name/place or tavern): what to draw before a face exists
- Do not invent extra characters or loot in the art

## 3) Classic illustration / "book" mode
When a single splash fires (level-up, first kill, rest, boss, death, quest unlock).
- Milestone list per engine mode
- classic-book vs comic grid (never mix)
- How memorable-only classic still feels alive between splashes (prose, not spam images)

## 4) D&D / tabletop mode — best it can be
Theatre of the mind that still feels like a table.
- What CODE must track: AC, attack/damage rolls, conditions, concentration, spell slots, rest (short/long), initiative order, death saves (if used — secretDeathSaves already a setting)
- What the LLM must never invent: "you hit" / "they die" / extra gold / a spell they don't have
- Boxed read-aloud vs player-facing questions vs OOC table talk
- Dice tray: when to show 3D/visual dice vs text [d20+mod]
- Map: optional tactical grid vs "ask, don't assume" theatre — when fog dungeon map is wrong for a tavern
- Character sheet: what a tabletop player expects vs LitRPG paper-doll
- Failures that stick (miss, fail a save) without "the inn wake-up"
- Party of one: how a solo tabletop loop stays fun (hireling? no — v1 is solo unless they ask)
- Opening for D&D: name, look, where they are — NOT Integration / First Blood
- Avoid: System XP boxes, Salvage credits, Wave, Foundation Core, "Integration complete"

## 5) Story RPG mode (short)
How it differs from LitRPG and D&D: no System, no d20 chrome unless they opt in. Same visual pipeline.

## 6) Other live-game gaps (not in pack-11)
Only if they improve how the game WORKS, not cosmetics/IAP:
- Visual consistency manager: portrait + inventory icons matching described look (already started — harden)
- Empty-turn / image-without-story (never show a panel if prose failed)
- Rate limits and retry copy (diegetic, not "429")
- Accessibility: alt text for panels, reduce-motion for dice, readable recap
- What NOT to research: WOF multiplayer, housing, raids, cash shop

OUTPUT SHAPE
- Title + date
- Per section: goal, v1 rules, interfaces/tables, prompt-contract examples, avoid list
- A matrix: engineMode × visualMode (what generates, what chrome shows)
- A one-page "do not break" checklist
- Speculation markers for any numbers
```
