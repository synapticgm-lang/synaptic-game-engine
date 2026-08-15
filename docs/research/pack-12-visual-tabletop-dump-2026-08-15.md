# SynapticGM — Visual & Tabletop Mode Dump

**Date:** August 15, 2026
**Status:** Design research for the LIVE single-player AI GM (SynapticGM). NOT WOF. NOT a later MMO. No production code. No licensed settings.
**Purpose:** Fill the remaining gaps for visual modes (comic, classic, memorable splash) across all three engine modes (litrpg, dnd, rpg), harden the D&D/tabletop experience, define the story RPG mode, and close live-game gaps (consistency, empty-turn, rate limits, accessibility). EXTENDS prior dumps; does not redefine locked schemas.

---

## IP Check

All names, mechanics, places, and entities below are original to SynapticGM or use public-domain / SRD-safe generic terms (attack roll, armor class, hit points, ability check, saving throw, spell slot, short rest, long rest, conditions such as prone, grappled, etc.). No licensed adventure text, monster stat blocks, setting names, or WotC product names are used. Genre patterns referenced from public/citable sources are cited as methodology. Art-style presets (manga, manhwa, noir, pulp, watercolor, ligne claire, sumi, classic-book) are generic art-history terms, not branded products.

---

## Already Exists (Do Not Redesign — Improve and Fill Gaps)

1. **visualMode:** `comic | classic`. **comicLayout:** `paged | webtoon`. **artStylePreset:** manga, manhwa, noir, pulp, watercolor, ligne claire, sumi, classic-book, etc.
2. **Image kinds:** comic-panel, classic-illustration, milestone-illustration, item-icon, character-portrait.
3. **Visual consistency block** (character appearance, equipment, location tokens) + player-action-on-first-panel rule.
4. **D&D engine:** tabletop formatting, boxed read-aloud, inline dice notation, visual dice tray, no LitRPG System popups.
5. **RPG engine:** story RPG without System apocalypse chrome.
6. **LitRPG engine:** System chrome after story, Integration/Wave/First Blood flow.
7. **Locked:** images are PURE ART — no text, speech bubbles, UI, or HUD baked into the generated picture. App composites bubbles/captions over the rendered image.
8. **Locked:** art style preset controls line/ink/palette ONLY. World canon overrides preset.

---

## 1) Visual Modes That Work on ANY Engine

### Goal

Define how comic, classic illustration, and memorable splash attach to all three engine modes (litrpg, dnd, rpg) without leaking the wrong chrome into the art or into the prose.

### v1 Rules

- **Engine mode** (litrpg, dnd, rpg) determines the WORLD the picture depicts — modern Integration Earth, medieval-fantasy tabletop, or story-RPG (any setting).
- **Visual mode** (comic, classic) determines HOW the picture is rendered — multi-panel comic grid, single splash illustration, or no image (classic text-only between milestones).
- They are INDEPENDENT. Any engine × any visual mode must work. The matrix below defines what generates and what chrome shows for each combination.
- The image NEVER contains System chrome, dice notation, HP bars, XP boxes, or UI elements. Those are composited by the app AFTER the image is rendered.
- The art style preset (manga, noir, watercolor, etc.) controls line weight, ink style, and palette. It does NOT control the world canon. A noir preset on a D&D engine still draws a tavern, not a rain-slicked alley with neon signs (unless the D&D scene IS a rain-slicked alley).

### Per-Mode "What the Picture Must Show" Contracts

```typescript
interface PictureContract {
  engineMode: "litrpg" | "dnd" | "rpg";
  visualMode: "comic" | "classic";
  worldCanon: WorldCanon;
  // The picture must show:
  mustShow: string[];
  // The picture must NOT show:
  mustNotShow: string[];
}

interface WorldCanon {
  era: "modern_earth" | "medieval_fantasy" | "any_setting";
  setting: string;                          // "Integration street" | "tavern" | player-defined
  techLevel: "modern" | "medieval" | "mixed" | "scifi" | "custom";
  // Rules:
  // 1. litrpg → modern_earth (Integration). Characters wear modern clothes.
  //    Weapons are System-issued (knife, improvised), not medieval.
  //    Environment is real-world streets, stores, alleys.
  //    Exception: if the scene is INSIDE a dungeon (seeded store), it may look damaged/corrupted.
  // 2. dnd → medieval_fantasy. Characters wear fantasy gear (robes, armor, cloaks).
  //    Weapons are swords, staves, bows. Environment is taverns, roads, dungeons, forests.
  //    No modern items (no phones, cars, streetlights) unless the D&D setting explicitly includes them.
  // 3. rpg → any_setting. Player defines the setting. Art matches that setting.
  //    If no setting defined, default to "generic fantasy."
}
```

| Engine | Visual | What the Picture Shows | What Chrome the App Shows (NOT in the image) |
|--------|--------|----------------------|---------------------------------------------|
| **litrpg + comic** | Multi-panel comic grid (1–4 panels). Modern Earth. Player in street clothes / System gear. Knife, not sword. Store shelves, not dungeon walls (unless in a seeded store instance). | System recap table AFTER panels. LitRPG chrome (XP, loot, HP bar) composited as app overlay. |
| **litrpg + classic** | Text only between milestones. Milestone splash when classicMemorableImages is on (level-up, first kill, boss, death). Modern Earth setting. | System recap table AFTER prose. Same LitRPG chrome, no routine images. |
| **dnd + comic** | Multi-panel comic grid. Medieval fantasy. Tavern, road, dungeon. Fantasy gear. No System chrome in art. | Boxed read-aloud text. Dice tray (visual or text). Character sheet. NO System XP boxes, Salvage, or Wave. |
| **dnd + classic** | Text only between milestones. Milestone splash (boss entrance, natural 20, character death, quest complete). Medieval fantasy. | Same D&D chrome as above. Classic-book preset never uses multi-panel grid. |
| **rpg + comic** | Multi-panel comic grid. Player-defined setting (or generic fantasy). No System chrome. No dice notation in art. | Story-RPG chrome (minimal — journal, choices). No System popups, no dice tray unless player opted in. |
| **rpg + classic** | Text only between milestones. Milestone splash (key story beat, character reveal, climax). Player-defined setting. | Story-RPG chrome (minimal). |

### When to Generate

```typescript
interface ImageGenerationPolicy {
  engineMode: "litrpg" | "dnd" | "rpg";
  visualMode: "comic" | "classic";
  generateWhen: ImageTrigger[];
}

type ImageTrigger =
  | "every_turn"                            // comic mode: generate panels every turn
  | "combat_round"                          // comic mode: generate per combat round
  | "milestone_only"                        // classic mode: generate only on milestones
  | "never";                                // classic mode with classicMemorableImages OFF

// Policy matrix:
// comic mode:
//   - Exploration turns: 1 panel per turn (establishing or action shot)
//   - Combat rounds: 1 panel per resolved round (see Section 2 for v1 pick)
//   - Dialogue turns: 1 panel (reaction/close-up) — speech chips composited by app
//   - Opening: 1 establishing panel (see Section 2 for pre-face rules)
//
// classic mode:
//   - classicMemorableImages ON: milestone splash only (see Section 3 for milestone list)
//   - classicMemorableImages OFF: no images generated. Pure text.
//   - Between milestones: prose carries the experience. No routine images.
```

### Panel Budget by Mode

| Mode | Panels per Turn | Max per Session (speculative) | Notes |
|------|----------------|------------------------------|-------|
| **comic (paged)** | 1–4 (typically 2) | 30–50 panels / session | Paged layout: 2–4 panels per page, LTR reading order. |
| **comic (webtoon)** | 1–3 (typically 1 tall) | 30–50 panels / session | Vertical strip: 1 tall panel or 2–3 stacked, top-to-bottom reading order. |
| **classic (memorable)** | 0–1 (milestone only) | 5–10 splashes / session | Only on milestones. Most turns have 0 images. |
| **classic (off)** | 0 | 0 | No images. Pure text. |

### Failure Modes

| # | Failure | How It Happens | Prevention |
|---|---------|---------------|-----------|
| 1 | **Wrong era** | Art model draws a medieval sword on a modern Integration street, or a smartphone in a D&D tavern. | Prompt contract includes `worldCanon.era` and `worldCanon.techLevel`. Post-filter: if era = modern_earth, reject images containing "medieval armor," "sword," "castle" (unless scene is inside a dungeon). If era = medieval_fantasy, reject "car," "phone," "streetlight." |
| 2 | **Extra limbs** | Art model generates a character with 3 arms or 6 fingers. | Specify hand/body count in the image prompt: "one human, two arms, two legs, five fingers per hand." This is a known model failure; v1 accepts occasional artifacts. v2: inpainting pass (speculative). |
| 3 | **Text in image** | Art model bakes "SYSTEM" or "HP: 20" into the rendered pixels. | Prompt contract: "Do not include any text, letters, numbers, speech bubbles, UI elements, or HUD overlays in the image. The image is pure art." Post-filter: OCR scan for text; if detected, re-generate once. If second attempt also has text, serve it with a "text detected" flag and let the app crop/overlay. |
| 4 | **Same face drifting** | Character's face changes between panels (hair color shifts, jawline changes). | Visual consistency block (already exists): character portrait token is included in every image prompt. Contains: hair color, eye color, skin tone, facial structure, distinguishing marks. Refreshed from the character sheet, not from the model's memory. |
| 5 | **Knife becoming a sword** | Player has a System-Issue Survival Knife, but the art model draws a longsword. | Equipment token in prompt: `EQUIPPED_WEAPON: "short utility knife, black handle, 6-inch blade"`. Post-filter: if weapon description doesn't match, flag but don't block (visual weapon drift is cosmetic, not game-breaking). |
| 6 | **Same street / same tavern drifting** | The street layout changes between panels (Tesco is suddenly a pub). | Location token in prompt: `LOCATION: "urban street, convenience-store shopfront (branded sign removed), night, streetlights, wet pavement"`. The location token is derived from the code-owned Place, not from the LLM's prose. |
| 7 | **Loot/character invention** | Art model draws an NPC or item that doesn't exist in the ledger. | Prompt contract: "Only depict characters and items listed in the scene token." Scene token is code-derived from the current room state (combatants, corpses, loot, NPCs present). |
| 8 | **Violence beyond Kid Mode** | Art model draws graphic gore or dismemberment in Kid Mode. | Kid Mode art prompt modifier: `VIOLENCE_LEVEL: "kid-safe — no blood, no gore, no dismemberment, no graphic wounds. Impacts shown as motion blur or sparks."` Post-filter: NSFW classifier rejects graphic images. |

### Visual Consistency Manager (Hardened)

```typescript
interface VisualConsistencyBlock {
  characterPortrait: CharacterPortraitToken;
  equippedItems: EquipmentToken[];
  locationToken: LocationToken;
  lightingToken: LightingToken;
  // This block is CODE-DERIVED from the game state.
  // It is appended to every image generation prompt.
  // It is NOT generated by the LLM.
  // It is NOT stored in the LLM's context window.
  // It is refreshed from the code state before each image generation call.
}

interface CharacterPortraitToken {
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  skinTone: string;
  facialStructure: string;                  // "angular jaw, narrow nose" etc.
  distinguishingMarks: string[];            // scars, tattoos, etc.
  bodyType: string;                         // "slim," "stocky," etc.
  clothingDescription: string;              // current outfit
  ageRange: string;                         // "mid-20s," "elderly," etc.
}

interface EquipmentToken {
  slot: "weapon" | "armor" | "accessory" | "tool";
  itemName: string;
  visualDescription: string;                // "short utility knife, black rubber handle, 6-inch steel blade"
  // The visual description is code-owned.
  // It is the SAME description for every image that includes this item.
  // The LLM cannot change it. The art model receives it verbatim.
}

interface LocationToken {
  placeName: string;                        // code-owned Place name
  environment: string;                      // "urban street" | "convenience store interior" | "forest clearing" | "tavern common room"
  timeOfDay: string;                        // "night" | "dawn" | "midday" | "dusk"
  weather: string;                          // "clear" | "rain" | "fog" | "snow"
  keyFeatures: string[];                    // ["wet pavement", "broken shopfront window", "flickering streetlight"]
}

interface LightingToken {
  primarySource: string;                    // "streetlight" | "candle" | "fireplace" | "moonlight" | "System glow"
  intensity: "dim" | "normal" | "bright";
  colorTemperature: "warm" | "cool" | "neutral";
}
```

### Offline / No-Key / Rate-Limit: What the UI Shows

```typescript
interface ImageFallback {
  reason: "offline" | "no_api_key" | "rate_limited" | "generation_failed" | "nsfw_rejected";
  uiDisplay: ImageFallbackDisplay;
}

interface ImageFallbackDisplay {
  showPlaceholder: boolean;                 // true: show a styled placeholder frame
  placeholderStyle: "frame_with_icon" | "blurred_silhouette" | "text_card";
  // frame_with_icon: an empty comic panel frame with a small camera/art icon in the center
  // blurred_silhouette: a blurred silhouette based on the character portrait token
  // text_card: a styled text card with the scene description (diegetic)
  diegeticMessage: string | null;
  // For rate-limit: "Your mind's eye blurs for a moment. The scene will return."
  // For offline: "The vision fades. Continue — the story remembers what you saw."
  // For no-key: "Art mode requires an image API key. You can add one in Settings."
  // For nsfw_rejected: "The scene was too vivid to render. Continue with the prose."
  // For generation_failed: "The image could not be rendered. The story continues."
  retryAvailable: boolean;
  retryDelay: number | null;                // milliseconds before retry is offered
}

// Rules:
// 1. If an image fails, the prose ALWAYS still displays. Never an empty turn.
// 2. The placeholder is styled to match the current artStylePreset (a manga-styled frame, a watercolor border, etc.).
// 3. Rate-limit copy is diegetic (in the fiction), not technical ("429 Too Many Requests").
// 4. The player is never blocked from advancing. Image failure does not block the next turn.
// 5. Retry is offered after a delay (30 seconds for rate limit, immediate for generation failure).
```

### Kid Mode Art Rules

```typescript
interface KidModeArtRules {
  violenceLevel: "kid_safe";
  // kid_safe:
  //   - No blood pools, sprays, or dripping.
  //   - No dismemberment, exposed bone, or open wounds.
  //   - No graphic death poses (no sprawled corpses with visible injuries).
  //   - Impacts shown as: motion blur, sparks, impact stars, dust clouds.
  //   - Downed enemies shown as: slumped/fading, not bloody.
  //   - Weapons shown as: present but not dripping or coated.
  // Kid Mode does NOT change the ledger:
  //   - Enemies still die (code HP = 0). The art just doesn't show gore.
  //   - Damage numbers still appear in the System recap (if LitRPG mode).
  //   - The prose may describe a hit but not graphic injury.
  bodyRules: string;
  // No nudity, no sexualized poses, no revealing clothing beyond setting norms.
  // Characters are fully clothed in setting-appropriate attire.
}
```

---

## 2) Comic / Graphic-Novel Mode (Make It Actually Run)

### Goal

Define the panel script schema, shot list, speech/caption chip placement, reading order, and combat panel rules. Make comic mode implementable.

### v1 Rules

- Comic mode generates panels every turn. The writer LLM emits a panel script OR the code derives one from the outcome token.
- v1 pick: **code derives the panel script from the outcome token.** The writer LLM writes prose only. Code maps the outcome token to a shot type, character positions, and scene composition. This prevents the LLM from inventing visual content not in the ledger.
- Speculative later: the writer LLM emits a panel script alongside prose (requires prompt engineering and validation).

### Panel Script Schema

```typescript
interface PanelScript {
  turnId: string;
  roundId: string | null;                   // if combat
  panels: PanelSpec[];
  readingOrder: "ltr_paged" | "vertical_webtoon";
  // v1: code generates PanelScript from the outcome token.
  // The LLM does NOT generate this. The LLM writes prose.
  // Code maps: outcome token → shot type → panel count → composition.
}

interface PanelSpec {
  panelIndex: number;                       // 0-based, reading-order sequence
  shotType: ShotType;
  composition: PanelComposition;
  characters: PanelCharacter[];
  environment: string;                      // from LocationToken
  action: string;                           // what is happening (from outcome token)
  mood: "tense" | "calm" | "triumphant" | "desperate" | "mysterious" | "comedic" | "neutral";
  speechChips: SpeechChip[];                // composited by app, NOT baked into image
  captionChips: CaptionChip[];              // composited by app, NOT baked into image
}

type ShotType =
  | "establishing"                          // wide shot of the location (new room, new area)
  | "action"                                // mid shot of a character performing an action
  | "reaction"                              // close-up of a character reacting (hit, miss, surprise)
  | "close_up"                              // extreme close-up (item, face, detail)
  | "over_shoulder"                         // POV from behind one character looking at another
  | "wide_action"                           // wide shot with action (multiple characters in motion)
  | "dramatic"                              // low-angle or high-angle dramatic composition
  | "transition";                           // establishing shot for scene change

interface PanelComposition {
  cameraAngle: "eye_level" | "low_angle" | "high_angle" | "birds_eye" | "worms_eye";
  focusSubject: string;                     // who or what is the focus
  backgroundDetail: "full" | "simplified" | "speed_lines" | "flat_color";
  // Speed lines: for action panels (attack, dodge, flee)
  // Flat color: for reaction close-ups (focus on the face, background is a color wash)
  // Full: for establishing shots and wide actions
  // Simplified: for standard mid-shots
}

interface PanelCharacter {
  characterId: string;                      // from ledger
  position: "left" | "center" | "right" | "background";
  pose: string;                             // "attacking," "blocking," "standing," "prone," "running"
  expression: string;                       // "determined," "pained," "surprised," "calm," "angry"
  equipment: EquipmentToken[];              // what they're holding/wearing (from code state)
}

interface SpeechChip {
  speakerId: string;
  text: string;                             // max 40 characters per chip (speculative)
  chipPosition: "top_left" | "top_right" | "bottom_left" | "bottom_right";
  chipStyle: "speech" | "thought" | "shout" | "whisper" | "narration";
  // Rules:
  // 1. The chip is a UI overlay. It is NOT baked into the image.
  // 2. The text is from the LLM's prose (extracted by code) or from the System voice.
  // 3. Max 2 speech chips per panel (to avoid clutter).
  // 4. The chip position is determined by the speaking character's position in the panel.
  // 5. Chip style determines visual treatment: speech = round bubble, thought = cloud, shout = jagged,
  //    whisper = dashed border, narration = rectangular caption box.
}

interface CaptionChip {
  text: string;                             // max 60 characters (speculative)
  position: "top" | "bottom";
  style: "narration" | "system_voice" | "time_skip" | "location";
  // narration: prose excerpt (from LLM)
  // system_voice: System registrar line (litrpg only)
  // time_skip: "Later that evening..." (from code)
  // location: "Reedfen Marsh — Dusk" (from LocationToken)
}
```

### Shot List: Outcome Token → Shot Type Mapping

| Outcome Token | Shot Type (Panel 1) | Shot Type (Panel 2, if any) | Notes |
|--------------|--------------------|-----------------------------|-------|
| `ENTER_ROOM` | establishing | — | Wide shot of the new room. Describe the room before any creature. |
| `ENCOUNTER_START` | establishing | action (enemy reveal) | Room first, then enemies appear. Player action on first panel. |
| `ATTACK_HIT` | action (attacker swinging) | reaction (defender recoiling) | Attacker's motion in panel 1. Defender's reaction in panel 2. |
| `ATTACK_MISS` | action (attacker swinging) | reaction (attacker off-balance) | Same action, but panel 2 shows the miss (dodge/whiff). |
| `ATTACK_CRIT` | wide_action (dramatic swing) | close_up (impact detail) | Dramatic composition. Low angle on the attacker. |
| `DEFEND_BLOCK` | action (enemy attacking) | reaction (player blocking) | Enemy's motion, then player's block. |
| `ENEMY_DOWNED` | action (final blow) | reaction (enemy falling) | Do NOT show gore in Kid Mode. Show enemy slumping or fading. |
| `PLAYER_DOWNED` | dramatic (player falling) | — | Single dramatic panel. Low angle. |
| `PLAYER_DEATH` | dramatic (player prone) | — | Single panel. No gore. Somber mood. |
| `LOOT_FOUND` | close_up (item) | — | Close-up of the item. Equipment token for visual accuracy. |
| `REST` | establishing (calm scene) | — | Wide shot. Calm mood. Character resting. |
| `DIALOGUE` | over_shoulder | reaction (NPC face) | Player's back in panel 1. NPC's face in panel 2. |
| `QUEST_ACCEPT` | close_up (quest giver's hand/item) | — | Symbolic panel. Item or gesture. |
| `LEVEL_UP` | dramatic (character, light/energy) | — | Celebratory. Bright lighting. |
| `FLEE` | action (player running) | — | Motion blur. Speed lines. |

### Reading Order

```typescript
interface ReadingOrder {
  layout: "ltr_paged" | "vertical_webtoon";
  // ltr_paged:
  //   Panels arranged in a grid (2x2, 3x1, 2x1, etc.).
  //   Reading order: left-to-right, top-to-bottom.
  //   Panel 1 = top-left, Panel 2 = top-right, Panel 3 = bottom-left, Panel 4 = bottom-right.
  //   Standard Western comic reading order.
  //   Used by default for all presets EXCEPT manga.
  // vertical_webtoon:
  //   Panels stacked vertically, each full-width.
  //   Reading order: top-to-bottom.
  //   Panel 1 = top, Panel 2 = below, etc.
  //   Used by default for webtoon layout.
  //   Also used for manga preset if comicLayout = webtoon.
  // Note on manga preset with paged layout:
  //   Standard manga reads right-to-left. However, SynapticGM is an English-language app.
  //   v1: manga preset with paged layout uses LTR reading order (Western standard).
  //   Speculative later: RTL toggle for manga purists.
}
```

### Combat: One Panel per Resolved Round (v1 Pick)

**v1 pick: one panel per resolved round, NOT one panel per swing.**

Rationale:
- One panel per swing in a 4-round combat = 4–8 panels just for one encounter. That's 4–8 image generation calls. Too slow, too expensive.
- One panel per resolved round = 1 image per round. A 4-round combat = 4 panels. Manageable.
- The panel shows the OUTCOME of the round: the most dramatic moment (the hit, the miss, the block, the kill).
- The System recap table (code-rendered) shows all the math for the round. The panel shows the drama.
- Speculative later: 2-panel rounds for boss fights (action + reaction).

### Opening: What to Draw Before a Face Exists

```typescript
interface OpeningPanelRules {
  // Problem: the player hasn't defined their character's appearance yet.
  // The first panel fires at spawn, before the character portrait exists.
  // Solution:
  preCharacterCreation: {
    panelType: "establishing";
    showCharacter: false;
    // Draw the LOCATION only. No character in the frame.
    // litrpg: the street, the store front, the sky.
    // dnd: the tavern, the road, the crossroads.
    // rpg: the setting, the landscape, the opening scene.
  };
  postCharacterCreation: {
    panelType: "action" | "establishing";
    showCharacter: true;
    // Now the character portrait token exists.
    // Draw the character IN the location.
    // First character panel should be an establishing shot with the character.
  };
}
```

### Do Not Invent Extra Characters or Loot in the Art

```
Rule: the image prompt ONLY includes characters and items listed in the scene token.
The scene token is derived from the code ledger:
- combatants (from EncounterLedger)
- corpses (looted/unlooted)
- NPCs present (from room state)
- items visible (from room state + loot)
- the player character

If the code says 2 Hatchlings are in the room, the art shows 2 creatures.
Not 3. Not 1. Not a dragon. Not a treasure chest that isn't there.

If the LLM's prose mentions an NPC not in the room state,
the image prompt does NOT include that NPC.
Code-owned scene token overrides LLM prose for art generation.
```

---

## 3) Classic Illustration / "Book" Mode

### Goal

Define when a single splash fires, the milestone list per engine mode, how classic-book preset never uses multi-panel grids, and how the experience stays alive between splashes.

### v1 Rules

- Classic mode generates images ONLY on milestones (when classicMemorableImages is ON).
- Between milestones, the experience is pure prose. No routine images. No image spam.
- The prose carries the experience between splashes. Prose must be high quality because it IS the experience — there's no art to lean on.
- classic-book preset NEVER uses multi-panel grids. It generates a single full-width splash illustration. Always.
- Other presets in classic mode (manga, noir, etc.) also generate single splashes, not grids. Classic mode = no grids, regardless of preset.
- If classicMemorableImages is OFF, no images are generated at all. Pure text mode.

### Milestone List Per Engine Mode

```typescript
interface MilestoneEvent {
  event: string;
  engineModes: ("litrpg" | "dnd" | "rpg")[];
  imageType: "milestone_illustration";
  priority: "high" | "medium" | "low";
  // high: always generate if classicMemorableImages is on
  // medium: generate if budget allows (max N splashes per session)
  // low: generate only if explicitly requested or if budget is generous
}
```

| Milestone Event | LitRPG | D&D | RPG | Priority |
|----------------|--------|-----|-----|----------|
| **First kill** | Yes | Yes | Yes (if combat exists) | High |
| **Level up** | Yes | Yes | Yes (if levels exist) | High |
| **Boss encounter start** | Yes | Yes | Yes | High |
| **Boss defeated** | Yes | Yes | Yes | High |
| **Character death** | Yes | Yes | Yes | High |
| **Quest complete** | Yes | Yes | Yes | Medium |
| **New significant location** | Yes | Yes | Yes | Medium |
| **Rest scene** | Yes | Yes | Yes | Medium |
| **Key NPC meeting** | Yes | Yes | Yes | Medium |
| **Item discovery (rare+)** | Yes | Yes | If applicable | Low |
| **Natural 20 / critical success** | No | Yes | If dice used | Low |
| **Integration moment** | Yes | No | No | High (LitRPG only) |
| **Wave encounter** | Yes | No | No | High (LitRPG only) |
| **Story climax** | No | No | Yes | High (RPG only) |
| **Character reveal** | No | No | Yes | High (RPG only) |

### Session Splash Budget (Speculative)

| Session Length | Max Splashes (Classic Memorable) |
|--------------|-------------------------------|
| 15 min (quick) | 1–2 |
| 45 min (standard) | 3–5 |
| 90 min (long) | 5–8 |
| 120 min (extended) | 8–10 |

### How Classic Mode Stays Alive Between Splashes

```
Between milestone splashes, the player sees ONLY prose and System chrome.
The prose must carry the full weight of the experience.
This means:
1. Prose word budget is HIGHER in classic mode than in comic mode.
   Comic: 2–6 sentences (the art shows the action).
   Classic: 3–8 sentences (the prose IS the action).
   Speculative: classic mode adds +2 sentences to the word budget per turn.

2. Prose must be more descriptive in classic mode.
   Comic mode: "You strike. The hatchling recoils." (Art shows the motion.)
   Classic mode: "You drive the knife forward, angling under the hatchling's
   jaw. It snaps sideways, a thin hiss escaping between needle-teeth, and
   scrambles back across the wet tile." (No art — prose paints the picture.)

3. The System recap (if LitRPG or D&D) provides the mechanical grounding.
   Without art, the recap is even more important as the "visual" anchor.

4. Item icons and character portrait are still available as static images.
   These are not "panels" — they are reference images in the character sheet
   and inventory tabs. They do NOT generate per-turn.
```

### Classic-Book Preset: Never Mix with Comic Grid

```
If artStylePreset == "classic-book" AND visualMode == "classic":
  → Single full-width splash illustration on milestone events.
  → NO multi-panel grid. Ever.
  → Style: painterly, full-bleed, storybook illustration.
  → Aspect ratio: landscape (16:9) or portrait (9:16), never panel-grid.

If artStylePreset == "classic-book" AND visualMode == "comic":
  → This combination is allowed but the comic layout is "paged" with
    1 panel per page (effectively a splash per turn).
  → No 2x2 or 3x1 grids. Classic-book + comic = splash-per-turn.
  → Speculative: this is an expensive mode (1 full illustration per turn).
    May need a token/image budget warning.
```

---

## 4) D&D / Tabletop Mode — Best It Can Be

### Goal

Make the D&D engine feel like sitting at a table with a good GM, using theatre of the mind. Define what CODE must track, what the LLM must never invent, how boxed read-aloud and dice tray work, and how solo play stays fun.

### v1 Rules

- D&D engine uses generic SRD-safe mechanics (attack roll, armor class, ability checks, saving throws, spell slots, conditions, short/long rest, initiative). No WotC adventure text, no licensed monster stat blocks, no product names.
- Code owns ALL math: dice rolls, damage, HP, conditions, initiative order, spell slots, death saves, rest recovery.
- The LLM writes theatre-of-the-mind prose: room descriptions (boxed read-aloud), NPC dialogue, scene-setting. It NEVER resolves mechanics.
- Tabletop formatting: boxed read-aloud text, inline dice notation [d20+5], dice tray display, initiative tracker, condition icons.
- No LitRPG chrome: no System XP boxes, no Salvage credits, no Wave, no Foundation Core, no "Integration complete."

### What CODE Must Track

```typescript
interface DnDCharacterSheet {
  // Standard SRD-safe character sheet
  name: string;
  level: number;
  class: string;                            // original class names or SRD-safe generics
  race: string;                             // original or SRD-safe
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  abilityModifiers: Record<string, number>; // derived from scores
  proficiencyBonus: number;                 // derived from level
  armorClass: number;
  hitPoints: number;
  maxHitPoints: number;
  tempHitPoints: number;
  hitDice: { dieType: string; count: number; used: number };
  speed: number;
  initiative: number;                       // derived from dexterity modifier
  proficiencies: string[];                  // skills, tools, weapons, armor, saves
  equipment: DnDEquipmentItem[];
  spellSlots: SpellSlotTracker | null;      // null for non-casters
  features: string[];                       // class/race features (code flags)
  conditions: DnDCondition[];               // active conditions (prone, grappled, etc.)
  deathSaves: DeathSaveTracker | null;
}

interface SpellSlotTracker {
  slots: Record<number, { max: number; used: number }>;
  // level 1: { max: 2, used: 0 }, level 2: { max: 1, used: 1 }, etc.
  cantripsKnown: string[];
  spellsKnown: string[];                    // or spellsPrepared for prepared casters
  concentrationSpellId: string | null;       // currently concentrating on
}

type DnDCondition =
  | "blinded" | "charmed" | "deafened" | "frightened" | "grappled"
  | "incapacitated" | "invisible" | "paralyzed" | "petrified"
  | "poisoned" | "prone" | "restrained" | "stunned" | "unconscious"
  | "exhaustion_1" | "exhaustion_2" | "exhaustion_3"
  | "exhaustion_4" | "exhaustion_5" | "exhaustion_6";

interface DeathSaveTracker {
  successes: number;                        // 0–3
  failures: number;                         // 0–3
  isStabilized: boolean;
  // secretDeathSaves setting:
  //   if true, death save rolls are hidden from the player (GM rolls secretly).
  //   The player sees only: "You are unconscious. The world fades."
  //   if false, death save rolls are shown: "Death save: [d20] → 14 — Success (2/3)."
}

interface DnDCombatState {
  initiativeOrder: InitiativeEntry[];
  currentTurnIndex: number;
  roundNumber: number;
  isInCombat: boolean;
}

interface InitiativeEntry {
  characterId: string;
  name: string;
  initiative: number;                       // d20 + dexterity modifier
  isPlayer: boolean;
  isNpc: boolean;
  isEnemy: boolean;
}

interface RestState {
  restType: "short" | "long" | null;
  // Short rest: spend hit dice to recover HP. Recover some class features.
  // Long rest: recover all HP, recover all hit dice (up to half total), recover all spell slots.
  // Code handles all recovery math. LLM narrates the rest scene.
}
```

### What the LLM Must Never Invent

| The LLM Must NEVER... | Why | What Happens Instead |
|----------------------|-----|---------------------|
| State "you hit" or "you miss" | Code owns the attack roll | Code rolls d20+mod vs AC. Sends outcome token (HIT/MISS/CRIT). LLM narrates the outcome. |
| State damage numbers | Code owns damage rolls | Code rolls damage dice. Sends damage token. LLM describes the impact without numbers. |
| State "they die" or "they fall" | Code owns HP | Code checks HP. If HP ≤ 0, sends ENEMY_DOWNED token. LLM describes the fall. |
| Grant gold, items, or XP | Code owns the ledger | Code determines loot/rewards. LLM may narrate ("a pouch of coins on the table") but the actual grant is code. |
| Cast a spell the player doesn't have | Code owns spell slots | Code validates spell availability. If the player tries to cast a spell they don't know or don't have slots for, code rejects and sends SPELL_UNAVAILABLE token. |
| Break concentration without a code check | Code owns concentration | Code rolls the concentration check (CON save vs DC). If failed, sends CONCENTRATION_BROKEN token. LLM narrates. |
| Add an extra NPC or enemy | Code owns the scene | Scene token lists all characters present. LLM cannot add characters not in the token. |
| Skip initiative order | Code owns initiative | Code determines whose turn it is. LLM cannot narrate out-of-order actions. |
| Undo a failed save | Code owns saves | If a save fails, the consequence applies. LLM narrates the consequence. No retcons. |
| Use D&D-specific product names | Licensed content | Use SRD-safe generics. "A beholder-like creature" → "A many-eyed aberration" (or use original names). |

### Boxed Read-Aloud vs Player-Facing Questions vs OOC Table Talk

```typescript
interface DnDTextFormatting {
  boxedReadAloud: BoxedReadAloud;
  playerFacing: PlayerFacingText;
  oocTableTalk: OocTableTalk;
}

interface BoxedReadAloud {
  // The "GM describes the scene" text. Formatted in a visually distinct box.
  style: "indented_italic_bordered";
  // The box has a left border (colored bar), italic text, and slight indentation.
  // This matches the tabletop convention of read-aloud text in adventure books.
  source: "llm";                            // LLM writes this text
  // Example:
  // ┃ The tavern door swings open to a wave of warmth and noise.
  // ┃ A fire crackles in the stone hearth. Three figures sit at a corner
  // ┃ table, their conversation dropping to silence as you enter.
  maxLength: number;                        // 50–100 words (speculative)
  // Rules:
  // 1. Read-aloud appears at the START of the turn (story first, then chrome).
  // 2. Read-aloud describes the environment — what the player sees, hears, smells.
  // 3. Read-aloud does NOT describe the player's actions (that's the player's turn).
  // 4. Read-aloud does NOT include dice results or mechanical outcomes.
}

interface PlayerFacingText {
  // The "what do you do?" prompt. Follows the read-aloud.
  style: "normal_text";
  source: "llm_or_code";
  // If the LLM writes it: "The three figures watch you. What do you do?"
  // If code writes it: "Your turn. Choose an action." (fallback)
}

interface OocTableTalk {
  // Out-of-character notes, rules clarifications, or GM asides.
  style: "parenthetical_dim";
  // Dimmed text in parentheses: (You can use your bonus action to disengage.)
  source: "code";
  // OOC text is always code-generated (rules tips, action reminders).
  // The LLM does NOT write OOC text.
  // OOC appears BELOW the read-aloud and player-facing text.
}
```

### Dice Tray: When to Show Visual Dice vs Text Notation

```typescript
interface DiceTrayPolicy {
  visualDiceTray: boolean;                  // setting: show 3D/animated dice vs text
  // When visualDiceTray is ON:
  //   Attack rolls, saving throws, ability checks, and damage rolls
  //   display as animated dice in a tray (visual flair).
  //   The result is shown after the animation: [d20] → 18 + 5 = 23
  // When visualDiceTray is OFF:
  //   Dice results shown as inline text notation: [d20+5 → 23]
  //   No animation. Faster. Accessibility-friendly.
  showDiceFor: DiceDisplayEvent[];
}

type DiceDisplayEvent =
  | "attack_roll"
  | "damage_roll"
  | "saving_throw"
  | "ability_check"
  | "initiative"
  | "death_save"
  | "hit_dice_recovery";

// Rules:
// 1. Dice tray shows ONLY code-rolled dice. The LLM never rolls dice.
// 2. Dice display appears in the System/table chrome area, AFTER the read-aloud prose.
// 3. In comic mode, dice are composited as an overlay on the panel (small tray in corner).
// 4. In classic mode, dice are shown as text notation inline or as a small tray widget.
// 5. Reduce-motion setting: disable dice animation, show result immediately as text.
```

### Map: Theatre of the Mind vs Tactical Grid

```typescript
interface DnDMapPolicy {
  mapMode: "theatre_of_mind" | "fog_dungeon";
  // theatre_of_mind:
  //   No visual map. The GM describes the scene. The player asks questions.
  //   "How far am I from the door?" → GM answers in prose.
  //   Used for: taverns, roads, conversations, exploration, most encounters.
  // fog_dungeon:
  //   Node-graph fog map (same as LitRPG dungeon map).
  //   Rooms discovered as the player moves. Fog hides undiscovered rooms.
  //   Used for: dungeon crawls, interior explorations, structured maps.
  //   When fog dungeon map is WRONG: tavern scenes, outdoor travel, social encounters.
  //   The map is optional. The player can toggle it off.
  // Rule: NEVER show a fog dungeon map in a tavern or social scene.
  //   If the player is in a tavern, the map is hidden or shows "Theatre of the Mind."
  //   The fog dungeon map appears ONLY when the player enters a structured interior.
}
```

### Character Sheet: What a Tabletop Player Expects

```typescript
interface DnDCharacterSheetDisplay {
  // A tabletop player expects a character sheet that looks like... a character sheet.
  // Not a LitRPG paper-doll. Not a System XP box. A SHEET.
  sections: {
    header: {                               // Name, Class, Level, Race, Background
      fields: ["name", "class", "level", "race", "background"];
    };
    abilityScores: {                        // STR 16 (+3), DEX 14 (+2), etc.
      layout: "six_boxes";                  // standard 3x2 grid of ability scores
    };
    combat: {                               // AC, HP, Initiative, Speed, Hit Dice
      fields: ["armorClass", "hitPoints", "maxHitPoints", "tempHitPoints",
               "initiative", "speed", "hitDice"];
    };
    saves: {                                // Saving throw modifiers + proficiency marks
      fields: string[];                     // one per ability
    };
    skills: {                               // Skill modifiers + proficiency marks
      fields: string[];
    };
    equipment: {                            // Equipped items + inventory
      fields: ["equippedWeapon", "equippedArmor", "equippedShield", "inventory"];
    };
    spellcasting: {                         // Spell slots + known/prepared spells (if caster)
      visible: boolean;                     // hidden for non-casters
      fields: ["spellSlots", "spellsKnown", "spellcastingAbility", "spellSaveDC", "spellAttackBonus"];
    };
    features: {                             // Class + race features
      fields: string[];
    };
    conditions: {                           // Active conditions
      fields: string[];
    };
    deathSaves: {                           // Death save tracker (if unconscious)
      visible: boolean;                     // only when HP = 0
    };
  };
  // This is NOT a LitRPG System panel. It is a character sheet.
  // It does NOT show: Salvage credits, System XP, Integration level, Wave progress.
  // It DOES show: everything a tabletop player expects on a standard character sheet.
}
```

### Failures That Stick

```
D&D mode uses the same sticky-fail principle as LitRPG:
- A missed attack is a missed attack. No retcon.
- A failed save applies the condition. No undo.
- A failed ability check closes that approach. The player must try something else.
- Death is death (or unconscious with death saves, depending on setting).
- There is no "you wake up in an inn" unless the GM (code) decides
  the player is rescued (e.g., an NPC stabilizes them).
- The LLM may narrate the consequence but CANNOT undo the code outcome.
```

### Party of One: Solo Tabletop Loop

```typescript
interface SoloTabletopRules {
  partySize: 1;                             // v1: solo play only
  hireling: false;                          // v1: no hirelings, no NPCs fighting alongside
  // Solo loop:
  // 1. The player makes all decisions. No party members to consult.
  // 2. Combat is tuned for solo: enemy count reduced, boss HP reduced.
  // 3. The GM (LLM) plays all NPCs — but NPCs are non-combatant (quest givers,
  //    shopkeepers, informants), not party members.
  // 4. If the player asks for a companion/hireling, respond:
  //    "You're on your own for now. There may be allies later."
  //    Do NOT refuse outright; leave the door open for v2.
  // 5. v2 (speculative): hirelings (code-controlled NPCs that fight alongside).
  //    Not in v1 because hireling AI adds complexity (turn order, target selection, HP tracking).
}
```

### Opening for D&D: NOT Integration / First Blood

```typescript
interface DnDOpening {
  // D&D mode does NOT use Integration, First Blood, Wave, Foundation Core, or System-Issue Knife.
  // D&D opening is classic tabletop: the player describes their character, the GM sets the scene.
  openingFlow: DnDOpeningStep[];
}

type DnDOpeningStep =
  | { step: "name_and_look"; prompt: "What is your name, and what do you look like?"; codeAction: "set_character_name_and_portrait_tokens"; }
  | { step: "class_and_race"; prompt: "What is your calling, and where do you come from?"; codeAction: "set_class_and_race"; }
  | { step: "setting"; prompt: "Where does your story begin? A tavern? A road? A manor?"; codeAction: "set_starting_place"; }
  | { step: "first_scene"; prompt: null; codeAction: "generate_opening_read_aloud"; }
  // The opening is 3–4 steps. No info-dump. No System chrome.
  // After step 4, the game is live. The player is in their starting location.
  // The journal is empty until the first quest is discovered.

// Avoid these in D&D mode:
// - "Integration confirmed."
// - System XP boxes
// - Salvage credits
// - Wave encounters
// - Foundation Core
// - System-Issue Survival Knife
// - Any LitRPG chrome
```

---

## 5) Story RPG Mode (Short)

### Goal

Define how RPG mode differs from LitRPG and D&D. No System chrome, no d20 chrome unless opted in. Same visual pipeline.

### v1 Rules

```typescript
interface RpgModeRules {
  engineMode: "rpg";
  // How RPG mode differs:
  systemChrome: false;                      // no System popups, no Integration, no Wave
  diceChrome: false;                        // no dice tray, no [d20+5] notation BY DEFAULT
  diceOptIn: boolean;                       // player can enable dice in settings (light dice, fate-style, or d20)
  // If diceOptIn is true:
  //   Code rolls dice behind the scenes. Results shown as subtle inline text.
  //   No dice tray animation. No boxed-read-aloud formatting.
  //   Dice are a flavor add-on, not the primary mechanic.
  // If diceOptIn is false:
  //   No dice. Outcomes are determined by code (hidden probability engine).
  //   The player does not see rolls. The story just happens.
  //   This is "narrative RPG" — think interactive fiction with stat tracking.

  characterSheet: "minimal";
  // RPG mode character sheet is minimal:
  // Name, level (if levels exist), key stats (3–5, not 6 ability scores),
  // inventory, current quest.
  // NOT a full D&D sheet. NOT a LitRPG System panel.

  combatStyle: "narrative";
  // Combat in RPG mode is narrative by default:
  // Choices are story actions ("Strike with the axe", "Dodge behind the pillar",
  // "Call for help") rather than mechanical actions ("Attack: d20+5 vs AC 15").
  // Code still resolves outcomes. The player just doesn't see the math.
  // If diceOptIn is true, a subtle dice result may appear.

  visualPipeline: "same";
  // RPG mode uses the same visual pipeline as LitRPG and D&D.
  // Comic mode: panels every turn.
  // Classic mode: milestone splashes only.
  // Art style preset controls look. World canon matches the player's setting.

  opening: RpgOpeningFlow;
}

interface RpgOpeningFlow {
  steps: RpgOpeningStep[];
}

type RpgOpeningStep =
  | { step: "genre"; prompt: "What kind of story? Fantasy? Sci-fi? Modern? Horror? Something else?"; codeAction: "set_genre_and_world_canon"; }
  | { step: "name_and_look"; prompt: "Who are you? Name and a few words about your appearance."; codeAction: "set_character_name_and_portrait_tokens"; }
  | { step: "setting"; prompt: "Where does your story begin?"; codeAction: "set_starting_place"; }
  | { step: "first_scene"; prompt: null; codeAction: "generate_opening_prose"; }

// RPG mode is the "creative sandbox" mode.
// No genre restrictions. No locked chrome.
// The player can play fantasy, sci-fi, modern thriller, historical, horror, whatever.
// The engine adapts. The visual pipeline adapts.
// The code still owns outcomes, HP (if applicable), inventory, and choices.
```

### Key Differences Matrix

| Aspect | LitRPG | D&D | RPG |
|--------|--------|-----|-----|
| System chrome | Yes (after story) | No | No |
| Dice notation | No (code hidden) | Yes ([d20+5]) | No (default) / Optional |
| Character sheet | System panel (HP, XP, kit) | Full tabletop sheet (6 abilities, skills, spells) | Minimal (name, level, 3–5 stats, inventory) |
| Combat | Lockstep rounds, fight verbs, System recap | Initiative, attack rolls, conditions | Narrative choices, hidden probability |
| Read-aloud | No (prose is the story) | Yes (boxed, italic, bordered) | No (prose is the story) |
| Dice tray | No | Yes (visual or text) | No (default) / Subtle (opt-in) |
| World canon | Modern Earth (Integration) | Medieval fantasy (tavern/dungeon) | Player-defined (any setting) |
| Opening | Integration / First Blood | Name/look/class/race/setting | Genre/name/look/setting |
| Terminology | System-Issue Knife, Salvage, Wave | Armor Class, Spell Slots, Short Rest | Setting-appropriate (varies) |

---

## 6) Other Live-Game Gaps

### 6A. Visual Consistency Manager (Hardened)

Already started in the existing codebase. Hardening rules:

```typescript
interface VisualConsistencyRules {
  // 1. Portrait token is IMMUTABLE within a session.
  //    Once the player defines their appearance (character creation), the portrait token
  //    does not change unless the player explicitly changes their appearance (new haircut,
  //    new scar from a boss fight — code-owned events, not LLM drift).

  // 2. Equipment tokens update ONLY when inventory changes.
  //    If the player equips a new weapon, the equipment token updates.
  //    The LLM's prose cannot change what the player is wearing.
  //    "You pick up a gleaming sword" in prose does NOT update the equipment token
  //    unless code has confirmed the item is in inventory.

  // 3. Location token updates ONLY when the player moves to a new Place.
  //    The LLM cannot change the location. Code owns Place.

  // 4. Item icons must match the equipment token's visual description.
  //    If the player has a "short utility knife, black handle," the item icon shows
  //    a short knife with a black handle. Not a longsword. Not a dagger with a red hilt.
  //    Item icons are generated ONCE per item acquisition and cached.
  //    They do NOT regenerate per-turn.

  // 5. Character portrait is generated ONCE (at character creation) and cached.
  //    It is re-generated only on explicit appearance change.
  //    It is included as a reference image in every panel generation prompt
  //    (not as the panel itself — as a style/consistency reference).
  portraitCachePolicy: "generate_once_cache_until_change";
  itemIconCachePolicy: "generate_once_cache_per_item";
  locationTokenSource: "code_place_state";
  equipmentTokenSource: "code_inventory_state";
}
```

### 6B. Empty-Turn / Image-Without-Story

```typescript
interface EmptyTurnPolicy {
  // RULE: Never show a panel if prose failed.
  // If the LLM fails to generate prose (timeout, error, empty response):
  //   1. Do NOT generate or display an image for this turn.
  //   2. Display a fallback prose line: "The moment passes. What do you do?"
  //   3. Display the choices from the committed beat (code-generated, always available).
  //   4. The player can act. The next turn retries the LLM.
  //
  // RULE: Never show an image without preceding prose.
  //   The rendering order is: prose → image → System chrome → choices.
  //   If prose is missing, the image is skipped. Chrome and choices still render.
  //
  // RULE: If image generation fails but prose succeeded:
  //   Display the prose. Display the fallback image placeholder (see Section 1).
  //   Display chrome and choices normally. The turn is valid without an image.
  proseFailureFallback: "The moment passes. What do you do?";
  imageWithoutProse: "never";
  proseWithoutImage: "always_valid";
}
```

### 6C. Rate Limits and Retry Copy (Diegetic)

```typescript
interface RateLimitCopy {
  // Rate limit copy is diegetic (in-fiction), not technical.
  // The player never sees "429 Too Many Requests" or "Rate limit exceeded."
  imageLimitReached: {
    litrpg: "Your System flickers. Visual feed interrupted. Continue — it will return.";
    dnd: "The scene blurs in your mind's eye. The story continues.";
    rpg: "The vision fades for a moment. Continue.";
  };
  llmLimitReached: {
    litrpg: "The System's voice wavers. Processing. One moment.";
    dnd: "The tale pauses. The GM gathers their thoughts.";
    rpg: "A pause in the narrative. One moment.";
  };
  retryButton: "Try again";
  retryDelay: 30000;                        // 30 seconds before retry is offered
  // Rules:
  // 1. Diegetic copy matches the engine mode.
  // 2. The retry button is styled as a choice chip (same as game choices).
  // 3. The player is NEVER blocked from proceeding. They can always choose an action.
  //    The action will queue and resolve when the API is available.
  // 4. If retry fails 3 times, show: "The connection to [System/GM/narrative] is unstable.
  //    Your progress is saved. You can return later."
}
```

### 6D. Accessibility

```typescript
interface AccessibilityFeatures {
  altTextForPanels: AltTextPolicy;
  reduceMotion: ReduceMotionPolicy;
  readableRecap: ReadableRecapPolicy;
  screenReaderSupport: ScreenReaderPolicy;
}

interface AltTextPolicy {
  // Every generated image (panel, splash, icon, portrait) has alt text.
  // Alt text is code-generated from the PanelSpec (not from the image content).
  // This means alt text is available BEFORE the image generates,
  // and is accurate to the game state (not to what the model drew).
  source: "panel_spec";
  format: string;
  // Format: "[Shot type]: [Action description]. [Characters present]. [Location]."
  // Example: "Action shot: A figure in a grey jacket drives a knife toward a
  //   scaled creature in a dimly-lit convenience store."
  // Alt text does NOT include: damage numbers, HP, dice results, UI elements.
  // Alt text DOES include: who is present, what they're doing, where they are.
  maxLength: 200;                           // characters (speculative)
}

interface ReduceMotionPolicy {
  // If reduce-motion is ON:
  //   - Dice tray does not animate. Result shows immediately as text.
  //   - Panel transitions are instant (no slide or fade).
  //   - No parallax or floating effects on UI elements.
  //   - Speech chip appearance is instant (no typewriter effect).
  affectsGameplay: false;                   // reduce-motion is cosmetic only
  affectsDice: true;                        // dice show as text, not animation
  affectsTransitions: true;
  affectsTypewriter: true;
}

interface ReadableRecapPolicy {
  // System recap (LitRPG), dice results (D&D), and choice text must be
  // readable at the default font size without zooming.
  // Rules:
  // 1. Minimum font size for recap text: 14px (speculative).
  // 2. Recap table uses high-contrast colors (not low-opacity grey on white).
  // 3. Dice notation uses monospace font for clarity: [d20+5 → 23].
  // 4. Choice chips have minimum 44px touch target (already in SGM dump).
  minFontSize: 14;
  highContrast: true;
  monospaceDice: true;
}

interface ScreenReaderPolicy {
  // All interactive elements have ARIA labels.
  // Choice chips are announced as: "Choice 1 of 4: Strike. Button."
  // Dice results are announced as: "Attack roll: d20 plus 5 equals 23. Hit."
  // Panels are announced as: their alt text.
  // System recap tables are announced row-by-row.
  ariaLabels: true;
  choiceAnnouncement: true;
  diceAnnouncement: true;
  panelAnnouncement: true;
  recapAnnouncement: true;
}
```

### 6E. What NOT to Research

```
Do NOT include in this dump:
- WOF multiplayer (separate project, separate dumps)
- WOF housing (separate project)
- WOF raids (separate project)
- Cash shop / IAP design (covered in pack-09-monetization)
- Engine implementation code
- Supabase schema
- React/Vite/UI code
```

---

## Engine × Visual Mode Matrix

| | **comic** (panels every turn) | **classic** (milestone splash only) | **classic** (no images) |
|---|---|---|---|
| **litrpg** | Multi-panel grid (1–4). Modern Earth. System recap AFTER panels. Integration chrome composited as overlay. | Milestone splash on: first kill, level up, boss, death, Integration, Wave. Prose 3–8 sentences between splashes. System recap after prose. | Pure text. System recap after prose. No images. Prose carries full weight. |
| **dnd** | Multi-panel grid (1–4). Medieval fantasy. Boxed read-aloud before panels. Dice tray composited as overlay. No System chrome. | Milestone splash on: first kill, level up, boss, death, nat 20, quest complete. Prose 3–8 sentences. Boxed read-aloud + dice tray. | Pure text. Boxed read-aloud + dice tray. No images. |
| **rpg** | Multi-panel grid (1–4). Player-defined setting. No System chrome. No dice tray (unless opt-in). Minimal chrome. | Milestone splash on: key story beat, character reveal, climax, first kill, death. Prose 3–8 sentences. Minimal chrome. | Pure text. Minimal chrome. No images. |

### What Chrome Shows Per Engine Mode (Regardless of Visual Mode)

| Chrome Element | LitRPG | D&D | RPG |
|---------------|--------|-----|-----|
| System recap table | Yes (after story) | No | No |
| LitRPG XP box | Yes | No | No |
| Salvage / salvage credits | Yes | No | No |
| Wave indicator | Yes | No | No |
| Integration lines | Yes | No | No |
| Boxed read-aloud | No | Yes | No |
| Dice tray | No | Yes | No (default) / Yes (opt-in) |
| Initiative tracker | No | Yes | No |
| Condition icons | No | Yes | No |
| Death save tracker | No | Yes (if setting enabled) | No |
| Spell slot tracker | No | Yes (if caster) | No |
| Character sheet (full) | No (System panel) | Yes (tabletop sheet) | No (minimal) |
| Choice chips | Yes | Yes | Yes |
| Journal / quest log | Yes | Yes | Yes |
| Map (fog dungeon) | Yes (dungeon only) | Yes (dungeon only) | Optional |

---

## One-Page "Do Not Break" Checklist

```
╔══════════════════════════════════════════════════════════════════╗
║       SYNAPTICGM VISUAL & TABLETOP — DO NOT BREAK                ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  1. ENGINE AND VISUAL MODE ARE INDEPENDENT.                      ║
║     Any engine (litrpg, dnd, rpg) works with any visual          ║
║     mode (comic, classic). Never leak wrong chrome.              ║
║                                                                  ║
║  2. IMAGES ARE PURE ART.                                         ║
║     No text, speech bubbles, UI, HUD, dice, HP bars baked        ║
║     into pixels. App composites overlays after render.           ║
║                                                                  ║
║  3. ART STYLE PRESET CONTROLS LOOK, NOT WORLD.                  ║
║     A noir preset on D&D still draws a tavern, not neon.         ║
║     World canon (era, tech level) always overrides preset.       ║
║                                                                  ║
║  4. CODE OWNS THE SCENE TOKEN.                                   ║
║     Characters, items, and locations in the image prompt          ║
║     come from code state, not from LLM prose.                    ║
║     Do not invent NPCs, loot, or settings in art.                ║
║                                                                  ║
║  5. VISUAL CONSISTENCY BLOCK ON EVERY IMAGE.                     ║
║     Portrait token, equipment tokens, location token, lighting   ║
║     token — all code-derived, all appended to every prompt.      ║
║     Knife stays knife. Street stays street. Face stays face.     ║
║                                                                  ║
║  6. NEVER SHOW A PANEL IF PROSE FAILED.                          ║
║     Rendering order: prose → image → chrome → choices.           ║
║     Missing prose = skip image. Missing image = show prose.      ║
║                                                                  ║
║  7. CLASSIC-BOOK PRESET NEVER USES MULTI-PANEL GRID.            ║
║     Classic-book = single splash, always. Even in comic mode,    ║
║     classic-book generates 1 panel per page.                     ║
║                                                                  ║
║  8. D&D MODE: NO LITRPG CHROME. NO SYSTEM. NO WAVE.              ║
║     No Integration. No Salvage. No Foundation Core.              ║
║     Boxed read-aloud, dice tray, character sheet, conditions.    ║
║                                                                  ║
║  9. RPG MODE: NO CHROME BY DEFAULT.                              ║
║     No System. No dice (unless opted in). Minimal sheet.         ║
║     Narrative choices, hidden probability. Any setting.          ║
║                                                                  ║
║ 10. LLM WRITES PROSE ONLY. CODE BUILDS PANEL SCRIPTS.           ║
║     v1: code maps outcome tokens to shot types and compositions. ║
║     LLM never generates panel layout, shot type, or camera.     ║
║                                                                  ║
║ 11. COMBAT PANELS: ONE PER ROUND, NOT PER SWING.                ║
║     4-round combat = 4 panels (not 8–16). Budget + speed.        ║
║                                                                  ║
║ 12. RATE LIMITS ARE DIEGETIC.                                    ║
║     No "429." No "Rate limit exceeded."                          ║
║     "The vision fades." / "The GM gathers their thoughts."       ║
║     Player is never blocked from proceeding.                     ║
║                                                                  ║
║ 13. ALT TEXT ON EVERY IMAGE, FROM PANEL SPEC.                    ║
║     Code-generated, not image-derived. Available before render.  ║
║     Reduce-motion disables dice animation, shows text result.    ║
║                                                                  ║
║ 14. KID MODE ART: NO BLOOD, NO GORE, NO DISMEMBERMENT.          ║
║     Impacts as motion blur/sparks. Downed enemies slump/fade.   ║
║     Ledger unchanged — Kid Mode is visual only.                  ║
║                                                                  ║
║ 15. COSMETICS MUST NOT CHANGE DICE MATH.                        ║
║     Art style presets, dice skins, UI themes are display-only.   ║
║     Never sell combat outcomes.                                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Sources

| Source | URL | Date Accessed | What Was Used |
|--------|-----|--------------|---------------|
| Existing project file: SGM_Live_Gameplay_Dump.md | (project file) | Aug 15, 2026 | Turn shape, combat feel, fight verbs, System recap, choice generation, street map, phone chrome |
| Existing project file: AI_RPG_Technical_UX_Research_Report.md | (project file) | Aug 15, 2026 | Competitor architectures, code-owns-truth, free-text input trap, accessibility gap |
| Existing project file: AI_RPG_Research_Intel_and_Summary.md | (project file) | Aug 15, 2026 | Six pitfalls, LLM-as-rules-engine failures, ungrounded state |
| Existing project file: docs/research/pack-09-monetization-cosmetics-audio-iap-2026-08.md | (project file) | Aug 15, 2026 | Cosmetics display-only, dice skins, UI themes, Kid Mode rules |
| Scott McCloud — Understanding Comics (1993) | ISBN 0-06-097625-X | Aug 15, 2026 | Panel-to-panel transitions, closure, reading order theory, panel composition |
| Will Eisner — Comics and Sequential Art (1985) | ISBN 0-9614728-0-4 | Aug 15, 2026 | Page layout, timing in comics, splash page theory |
| Naver Webtoon format guidelines | https://www.webtoons.com/en/ | Aug 15, 2026 | Vertical scroll reading order, single-column panel layout, mobile-first comic design |
| WCAG 2.1 AA guidelines | https://www.w3.org/WAI/standards-guidelines/wcag/ | Aug 15, 2026 | Alt text requirements, reduce-motion, minimum touch targets, contrast ratios, ARIA labels |
| SRD 5.1 (Creative Commons) | https://dnd.wizards.com/resources/systems-reference-document | Aug 15, 2026 | SRD-safe generic terms (attack roll, armor class, hit points, ability check, saving throw, spell slot, conditions, rest types) |
| OpenAI DALL-E best practices | https://platform.openai.com/docs/guides/images | Aug 15, 2026 | Image prompt engineering, negative prompts, consistency techniques |
| Stable Diffusion prompt engineering (community) | https://stable-diffusion-art.com/prompt-guide/ | Aug 15, 2026 | Style control via prompt, negative prompts for text removal, character consistency |

---

## Speculation Markers

1. **Panel budget per session (30–50 comic, 5–10 classic)** — speculative. Depends on image generation speed and cost.
2. **40–80 word budget per combat round prose** — carried from SGM_Live_Gameplay_Dump, still speculative.
3. **Classic mode +2 sentences bonus** — speculative. Needs playtesting.
4. **Speech chip max 40 characters** — speculative. Depends on UI layout.
5. **Caption chip max 60 characters** — speculative. Depends on UI layout.
6. **Alt text max 200 characters** — speculative. WCAG recommends "succinct."
7. **Rate-limit retry delay 30 seconds** — speculative. Depends on API provider.
8. **Minimum font size 14px** — speculative. WCAG doesn't mandate a minimum, but 14px is a common accessibility target.
9. **One panel per resolved round (v1 combat)** — speculative. Could be 2 panels for boss fights.
10. **Splash budget per session length** — speculative. Depends on image cost per generation.
11. **RTL toggle for manga preset** — speculative later feature.
12. **Post-filter OCR for text-in-image** — speculative. Depends on OCR accuracy and speed.
13. **Inpainting pass for extra limbs (v2)** — speculative. Depends on model capabilities.

---

**End of Visual & Tabletop Mode Dump. This file provides implementation-ready schemas, prompt contracts, shot-type mappings, chrome matrices, accessibility specs, and do/don't rules for SynapticGM's visual pipeline across all three engine modes (litrpg, dnd, rpg) and both visual modes (comic, classic).**
