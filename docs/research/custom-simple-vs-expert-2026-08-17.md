# Research: Simple vs Expert Custom Game (2026-08-17)

John asked how SynapticGM’s **custom game** build compares to peer products, and whether we need **Simple Custom** + **Expert Custom** — with Expert offering full authoring (characters, lore, etc.) and a **per-section Randomize** button players can mash until they like the result.

Inspiration / competitor features only. Do not copy UI chrome, copy, or IP. SynapticGM stays original.

---

## Verdict

Yes — the product gap is real. Today “Full Custom Setup” is a **thin wizard** (mode → archetype → presentation → name/class/look/bio). Peers treat custom as a **scenario / lorebook / character-creator builder**. Codex and GM Library exist **after** play starts, which is too late for people who want a built world before turn one.

Recommended product shape:

| Mode | Who it’s for | Promise |
|------|----------------|---------|
| **Simple Custom** | “I want to play in five minutes” | Mode + archetype (or Surprise) + name + one-line premise optional. World fills in via opening weave + AI. |
| **Expert Custom** | “I want *my* bible” | Accordion sections matching `CampaignBible` + player character. Every section has **Randomize** (reroll that section only). Begin only when Ready (minimums met). |

Do **not** implement until John asks to ship. This doc is the brief.

---

## What SynapticGM does today

### New Game paths (`NewGameModal.tsx`)

- **Premade:** pick bible → presentation → start (character hardcoded Adventurer/Hero).
- **Full Custom:** system (mode + archetype + GM strictness) → presentation → character (name, class string, appearance, bio). **No** `bibleId` — seed resolves archetype → first matching bible (default LitRPG `ai_random` can silently seed **System Integration**, not Blank Canvas).

### Author surface that already exists (mostly mid-run)

| Surface | When | What |
|---------|------|------|
| Blank Canvas bibles | Premade pick | Empty rails; “define in Codex” |
| Codex (Right drawer) | After start | Lore cards: npc / location / item / quest / faction / lore |
| GM Library | Mid-run | Apply a bible onto current save; browse info cards |
| Custom tabletop rules | New Game + Settings (dnd) | Freeform rules paste |
| Opening establishment | After start | Weave name / place / look / kit / species |
| Campaign settings | Mid-run | Three Pillars, house toggles |
| Random chips | Opening only | “Random designation”, “Random place” (small pools) |

### What players cannot set at New Game today

Premise / style rail / opening hooks · lore packs · factions · NPCs · starter quests · kit · starting location · world outline · mystery pools · opening mode · species (pre-start) · structured PYOA forks · story personality · **per-field randomize**.

---

## Peer comparison (feature families)

| Capability | SynapticGM now | AI Dungeon | NovelAI | SillyTavern | KoboldAI | DreamGen | D&D Beyond / chargen tools |
|------------|----------------|------------|---------|-------------|----------|----------|----------------------------|
| Premade scenarios | Strong bible catalog | Scenarios | Scenarios | Char cards | Prompt packs | Scenarios | Adventures (different genre) |
| Always-on memory / premise | `campaignPremise` sliced | Plot Essentials | Memory | Char defs + notes | Memory | World/plot defs | N/A / notes |
| Keyword lore inject | Lorebook + tags | Story Cards | Lorebook | World Info | World Info | Lore | N/A |
| Pre-play world builder | Thin | Scenario editor | Lore + generator | Cards + WI | WI editor | World craft | Campaign prep (VTT) |
| Character creator before play | Thin custom fields | Character Creator scenarios | Persona | Persona + card | Prompt | Character + world | Full sheet + **dice-per-option** |
| AI generate lore entry | No dedicated | Limited | **Lore Generator** | Via model | Via model | Yes | AI chargen tools |
| Per-field randomize | Opening chips only | CC regenerates start | Lore gen | Extensions | Random prompt | Partial | **Quick Builder dice per field** (Beyond); RandoTools dice-per-field |
| Mid-run edit lore | Codex | Story Cards mid-adventure | Lorebook | WI | WI | Yes | Notes |

### Patterns worth stealing as *shapes* (not copy)

1. **Always-on block** (Plot Essentials / Memory / premise) vs **triggered cards** (Story Cards / Lorebook / World Info) — SynapticGM already has both conceptually (`campaignPremise` + `lorebook`); Expert Custom should **author both before Begin**.
2. **Character Creator scenario** (AID): pick race / class / faction / location from creator-defined options → AI writes unique opening. SynapticGM Expert can offer structured fields + optional pick-lists; Simple skips lists.
3. **Lore Generator** (NovelAI): button to draft an entry, then edit. Expert Randomize can call a cheap model or a local deck — decks first (offline, fast, no burn turns).
4. **Dice-per-field** (D&D Beyond Quick Builder, RandoTools): randomize **this section only**, mash until happy — exactly John’s Expert ask.
5. **Blank + build later** (our Codex) is fine as a third path (“Start empty”), but peers who market “custom world” front-load authoring.

---

## Proposed Simple Custom

**Steps:** Path → Simple | Expert → System → Presentation → (optional one screen) → Begin.

**Simple screen fields**

- Campaign name  
- Engine mode (already chosen)  
- Archetype or **Surprise me** (`ai_random` / `ai_custom`)  
- GM strictness  
- Character name (optional; opening can ask)  
- One-line pitch optional (“vampire academy heist”, “quiet fishing village”)  

**Behavior**

- Always seed **Blank Canvas** for that mode (never silently System Integration).  
- Opening weave + starter deck invent texture.  
- Codex remains available after start for light edits.  

**Randomize on Simple:** one optional **Surprise pitch** button (whole soft premise), not per-section complexity.

---

## Proposed Expert Custom

Accordion (or stepper) sections. Each section header: **Randomize** (reroll that section only; keep others). Optional **Randomize all** with confirm.

### Sections (map to existing bible / state)

| Section | Player fields | Seeds into |
|---------|---------------|------------|
| 1. Framing | Title, tagline, short pitch, difficulty, genre chip | bible meta / storyName |
| 2. Premise & rails | Premise textarea, style rail, originality note (auto-injected license reminder) | `campaignPremise`, `campaignStyleRail` |
| 3. World | Starting location, world-shape notes, outline pick (none / soft atlas / closed) | `startingLocation`, `worldOutlineId` |
| 4. Lore pack | Add cards: location / faction / history / mechanic / culture | `loreSnippets` → lorebook |
| 5. People | NPCs: name, role, disposition, description, hooks | `keyNPCs` |
| 6. Quests | Starter + optional side seeds | `starterQuests` (still Guide-Book gated until spoken) |
| 7. Kit | Starter items / container / replace-default toggle | `starterItems` |
| 8. Opening | Mode scene/weave, registrar voice, hook or hook deck, prompts | opening* fields |
| 9. You (PC) | Name, folk/species, class/role, look, bio, optional stats soft | character + opening answers |
| 10. Tone | GM strictness, story personality (when built), pillars defaults | settings / future personality |
| 11. Tabletop-only | Custom rules paste | `customTabletopRules` |

**Minimum to Begin (Expert):** title + premise (≥1 short paragraph) + PC name **or** “ask at opening” + at least **one** lore card **or** “AI fill gaps” toggle.

**Randomize implementation (Expert) — preferred order**

1. **Local decks** per section (trope banks already in research docs / starter-personality banks) — instant, free, mashable.  
2. Optional **AI draft** behind the same button (costs capacity; show “using a turn/credit?” only if AI path).  
3. After fill: fields stay editable; Randomize again replaces **that section’s** draft only.

**Kid Mode:** decks filtered; AI draft runs Families bar; NSFW cards hidden.

**Copyright rail:** Expert UI banner — original names only; do not paste closed novels / licensed settings. Same spirit as blank-canvas `licenseNote`.

---

## Mapping: peer vocabulary → SynapticGM

| Peer | SynapticGM |
|------|------------|
| Plot Essentials / Memory | `campaignPremise` + always-on style rail |
| Author’s Note | Short tone line / story personality |
| Story Cards / Lorebook / World Info | Codex lore cards + bible `loreSnippets` |
| Character Creator options | Expert section 9 + optional pick-lists |
| Scenario prompt | `openingHook` / `openingHooks` deck |
| AI Instructions | Archetype rails + `styleRail` + custom tabletop rules |

Advantage we already have: **ledger + quests + inventory + modes** — peers are often prose-only. Expert Custom should expose our bible strength, not become SillyTavern-with-dice.

---

## Risks / product notes

- **Wizard fatigue:** Expert must be skippable section-by-section (“I’ll add lore later”).  
- **Silent premade seed:** fix `ai_random` custom → Blank Canvas (bug/gap).  
- **Token bloat:** cap lore cards at New Game (e.g. 12) with “add more in Codex”.  
- **Quest dump:** keep Guide Book lock — authored quests exist but stay unspoken until play.  
- **Don’t ship story personality in this job** — separate waiting research; Expert can leave a Tone stub.

---

## Build order (when John says implement)

1. Fix custom `ai_random` → Blank Canvas for mode.  
2. Split New Game path: **Simple Custom** | **Expert Custom**.  
3. Expert accordion + local Randomize decks (PC, world, lore, NPC, opening).  
4. Persist Expert draft as ephemeral `CampaignBible` (or `playerBible` blob) into `seedStateFromCampaignBible`.  
5. Optional AI draft behind Randomize (capacity-aware).  
6. Story personality + New Game UI polish.  
7. Export/import Expert bible JSON (shareable custom scenarios later).

---

## Sources

- Codebase explore 2026-08-17: `NewGameModal`, `campaignSeed`, blank canvases, Codex, GM Library, `CampaignBible` types.  
- Public docs / help: AI Dungeon Scenarios, Plot Components, Story Cards, Character Creator; NovelAI Lorebook + Lore Generator; SillyTavern World Info / character cards; KoboldAI Memory + World Info; DreamGen world craft; D&D Beyond Quick Builder dice-per-field; RandoTools per-field reroll.

**Status:** shipped 2026-08-17 (Simple + Expert Custom New Game; local Randomize decks; Blank Canvas seed fix). Story personality + AI draft Randomize + export JSON still later.
