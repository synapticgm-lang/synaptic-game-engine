# SynapticGM — Live Gameplay Dump

**Date:** August 15, 2026
**Status:** Design research for the LIVE single-player AI GM (SynapticGM). NOT WOF. NOT a later MMO. No production code. No licensed settings. Original/public-domain inspiration only.
**Architecture constraint:** Code owns dice, HP, XP, loot, kit, room graph, mob counts, quest reveal, and choices. The LLM writes only this turn's camera (2–6 new sentences). It must not invert the ledger.

---

## IP Check

All names, mechanics, places, and entities below are original to SynapticGM or use real-world public locations as backdrop (e.g., a Tesco-like store, a named street). No licensed settings, races, bosses, faction names, or creature designs are used. "First Blood," "Foundation Core," "System-Issue Survival Knife," "Corrupted Stockboy," and "System Salvage" are original working names. Genre patterns referenced from public/citable sources are cited as methodology, not copied content.

---

## 1) After First Blood (Hour 1–3)

### Goal

Define the beat sheet from the moment the player leaves the First Blood store through Level 5. Establish what the Foundation Core is FOR, when Wave is allowed to appear, and ensure Riverside / Wave 6 hooks stay hidden until the story actually unlocks them. No dumping late-game content on the opening street.

### v1 Rules

- The player exits First Blood with: System-Issue Survival Knife, Foundation Core (item), ~Level 2, one completed quest.
- The street is safe (mapScale, not dungeon danger). No combat spawns on the street in hour 1.
- Wave does NOT appear until the player reaches Level 3 AND has absorbed the Foundation Core (see below). Before that, the street is quiet — the world is still "waking up."
- Riverside and Wave 6 hooks are HIDDEN from the GM prompt and from the quest log until their unlock conditions are met.
- The player should hit Level 5 by approximately turn 30–40 (speculative — needs playtesting).

### Foundation Core — What It Is FOR

The Foundation Core is not a weapon or a key. It is the player's first **Integration catalyst**. Its purpose:

1. **Story purpose:** The Foundation Core is the reason the player survived First Blood. It marks them as "Integrated" — the System recognized them as a viable host. Without it, the player would have died in the store like everyone else.
2. **Mechanical purpose:** Absorbing the Foundation Core (a code-owned action, not an LLM narration) unlocks the player's first talent point and grants the first passive: `system_link_level_1` (allows the player to see System prompts, quest text, and the Salvage interface). Before absorption, the player sees only story prose — no System chrome.
3. **Pacing purpose:** The Foundation Core absorption is the moment the game "opens up." Before it: one quest, one store, one knife. After it: talent tree, Salvage interface, second site unlock, Wave eligibility.

### Beat Sheet (Turn Ranges)

| Phase | Turn Range | Beat | What Happens | Code Action | LLM Narration |
|-------|-----------|------|--------------|------------|---------------|
| **Exit First Blood** | T8–T10 | Leave the store | Player exits onto the street. Street is quiet. No spawns. | Set `currentPlaceId` to street. Set `firstBloodComplete = true`. Reveal Foundation Core in inventory. | 2–4 sentences: the street after the store. Quiet. The world is different but not yet hostile. |
| **Street Walk** | T10–T14 | Walk the street | Player explores the street. Sees real-world place names. Finds a second store (closed/locked — not yet accessible). | Reveal street map pins. Second store pin visible but locked. | 2–3 sentences per move. No combat. Environmental detail only. |
| **Absorb Core** | T14–T16 | Absorb the Foundation Core | Player absorbs the Core (choice button: "Absorb the Foundation Core"). This is a code action. | Set `integrated = true`. Grant `system_link_level_1`. Grant 1 talent point. Reveal System chrome (Salvage, journal, character tabs). Reveal talent tree. | 3–5 sentences: the absorption moment. The System speaks for the first time (registrar line — shared, not unique). |
| **First System Prompt** | T16–T17 | System speaks | The System delivers the first registrar line: "Integration confirmed. Salvage protocol available. Proceed." | Reveal Salvage interface. Reveal quest log (now shows the next quest). | 1–2 sentences of System voice (registrar line — shared across all players). |
| **Salvage First Junk** | T17–T20 | First salvage | Player finds junk on the street (debris, broken glass, scrap metal). Salvage interface converts junk to salvage credits. | Spawn 2–3 junk items on street pins. Enable `salvageLoop = true`. | 2–3 sentences: the player notices salvageable material. System Salvage interface appears (code-rendered, not narrated). |
| **Second Site Unlock** | T20–T24 | Second site | A second site becomes accessible (a different store, warehouse, or building). Player must reach Level 3 to enter. | Reveal second site pin. Set `secondSiteLocked = true` until Level 3. | 2–3 sentences: the player spots a second location. The System marks it on the map. |
| **Level 3 → Wave Eligibility** | T24–T28 | Wave appears | Player reaches Level 3 (via salvage XP + street exploration XP). Wave becomes eligible to appear on the street. | Set `waveEligible = true` at Level 3. Wave spawn logic activates (low probability per street turn). | 3–5 sentences: the first Wave encounter. The world shifts — the quiet is over. |
| **Second Site Run** | T28–T34 | Enter second site | Player enters the second site (instanced dungeon — seeded room graph, fog, mobs). Similar to First Blood but different seed, different mob types. | Create `PartyInstance` (solo). Generate seed. Build room graph. Populate mobs. | Dungeon narration (Mode A — one paragraph per room/encounter). |
| **Level 5** | T34–T40 | Level 5 | Player reaches Level 5. Second talent point. Third site may unlock. | Grant talent point. Reveal third site pin (if applicable). | 2–3 sentences: the System acknowledges the milestone. |

### What Stays Hidden

| Hook | Unlock Condition | When It Appears |
|------|-----------------|----------------|
| **Riverside** | Player reaches Level 5 AND has completed the second site. | Riverside pin appears on the street map. Quest log reveals "The River's Edge" quest. |
| **Wave 6** | Player reaches Level 8 AND has absorbed a second Foundation Core (from the second or third site). | Wave 6 event triggers. This is a major story beat, not an opening event. |
| **Guide Book** | Player reaches Level 3 AND has talked to the one named local (see Section 7). | Guide Book item appears in inventory. Unlocks the tutorial/help system in-fiction. |
| **Talent Tree (full)** | Player absorbs Foundation Core. | First talent point available. Tree shows only Tier 1 nodes. Higher tiers reveal as points are spent. |

---

## 2) Text Combat Feel

### Goal

Make combat feel like a fight, not a math worksheet. The player reads 2–6 sentences of story, then sees a System recap table, then picks a fight move. The story never invents the hit. The code owns the dice.

### v1 Rules

- 3–5 fight verbs per turn. These are the ONLY choices in combat (no "look around," no "talk to the enemy" — those are out-of-combat choices).
- Enemy tells: the story describes what the enemy is doing (winding up, advancing, faltering) but NOT the damage. Damage is in the System recap.
- Stamina: each fight move costs stamina. If stamina is 0, the only available move is "Brace" (defend, recover 1 stamina).
- Death/downed: at 0 HP, the player is Downed (not dead). A Downed player can "Crawl" (flee attempt) or "Bleed Out" (lose 1 HP per turn — at -5 HP, death). A teammate (in multiplayer — later) or a System mercy token (single-player v1) can revive.
- Corpse rules: dead enemies are corpses. Corpses can be looted (code-owned loot roll). The story may describe the corpse but NOT generate loot. Loot appears in the System recap.
- System recap comes AFTER the story. Always. Story first, then table.
- The LLM must not state damage numbers, HP values, or kill confirmations in prose. Those are in the recap table only.

### Fight Verbs (v1)

```typescript
interface FightVerb {
  id: string;
  label: string;                           // button text (2–3 words max)
  description: string;                     // what it does (code-owned)
  staminaCost: number;
  requiresFlag: string | null;              // e.g., "has_knife" — if null, always available
  codeAction: "attack" | "defend" | "ability" | "flee" | "use_item";
}

// v1 Fight Verbs (original names, no licensed move names):
const v1FightVerbs: FightVerb[] = [
  { id: "strike", label: "Strike", description: "Basic attack with equipped weapon", staminaCost: 2, requiresFlag: "has_weapon", codeAction: "attack" },
  { id: "heavy_strike", label: "Heavy Strike", description: "High-damage, high-stamina attack. -2 accuracy.", staminaCost: 4, requiresFlag: "has_weapon", codeAction: "ability" },
  { id: "brace", label: "Brace", description: "Defensive stance. +3 defense. Recover 1 stamina.", staminaCost: 0, requiresFlag: null, codeAction: "defend" },
  { id: "salvage_strike", label: "Salvage Strike", description: "Attack with salvage intent. Lower damage, higher junk drop chance.", staminaCost: 3, requiresFlag: "has_weapon", codeAction: "ability" },
  { id: "flee", label: "Break Away", description: "Attempt to disengage from combat. Success chance based on speed vs enemy.", staminaCost: 2, requiresFlag: null, codeAction: "flee" },
];
```

### Enemy Tells

```typescript
interface EnemyTell {
  type: "winding_up" | "advancing" | "faltering" | "enraged" | "flanking" | "casting";
  narrationHint: string;                   // fed to LLM as a token, NOT as prose
  // The LLM writes the tell in its own words, but the tell TYPE is code-determined.
  // Example: winding_up → LLM writes "The Corrupted Stockboy pulls back its arm, tendons creaking."
  // The LLM does NOT write "The Stockboy is about to hit you for 8 damage."
}

// Tell rules:
// 1. The code determines which tell to show based on the enemy's next action (from the encounter script).
// 2. The LLM narrates the tell but does not name the mechanic or state damage.
// 3. The player learns to read tells: "winding_up" = big hit incoming, "faltering" = enemy is low, etc.
// 4. Tells are flavor + telegraph. They do not change the math. The code resolves the next round regardless.
```

### Stamina, Death, Downed

```typescript
interface CombatState {
  playerHp: number;
  playerMaxHp: number;
  playerStamina: number;
  playerMaxStamina: number;
  isDowned: boolean;
  downedTurns: number;                      // increments each turn at Downed
  bleedOutHp: number;                       // starts at 0, goes to -5 = death
}

// Downed rules:
// 1. At 0 HP → isDowned = true. Player choices become: "Crawl" (flee attempt) or "Bleed Out" (pass).
// 2. Each turn Downed: bleedOutHp -= 1. At -5 → death.
// 3. In single-player v1: a System Mercy Token revives the player at 1 HP with 0 stamina.
//    Mercy Tokens: 1 per session (speculative). Additional tokens cost nothing (not sold — locked: never sell combat outcomes).
//    Instead, Mercy is a pacing tool: the System gives 1 free revive per session to prevent frustration.
// 4. In multiplayer (later): a teammate can revive a Downed player by standing adjacent and using "Stabilize."
// 5. Death (bleedOutHp <= -5): player respawns at last checkpoint (store entrance or street safe point).
//    Death penalty: lose 10% of current XP (not total XP — never lose levels). Lose all unlooted corpses in the instance.
//    The instance resets to checkpoint. Cleared rooms stay cleared.
```

### Corpse Rules

```typescript
interface Corpse {
  enemyId: string;
  enemyName: string;
  isLooted: boolean;
  lootRollId: string | null;                // code-owned loot roll result
  roomId: string;
}

// Corpse rules:
// 1. Dead enemies become corpses in the room.
// 2. Corpses can be looted. Looting is a code action: code rolls the loot table, determines drops.
// 3. The LLM may describe the corpse ("The Stockboy lies still, its corruption already fading.")
//    but must NOT describe loot. Loot appears in the System recap after looting.
// 4. Corpses persist until looted or until the instance resets. Unlooted corpses are lost on death.
// 5. "Salvage Strike" increases junk drop chance from corpses but reduces damage.
```

### System Recap (After Story)

```
─── SYSTEM RECAP · ROUND 3 ───────────────────
You        → Corrupted Stockboy  | Strike       | roll 14 | HIT    | 6 dmg | HP 18/24
Stockboy   → You                 | Wind-up      | roll 11 | HIT    | 8 dmg | HP 5/20  ⚠
You        → (Brace)             | Brace        | —       | BLOCK  | —     | HP 5/20  +1 STA
────────────────────────────────────────────
ENEMY: Corrupted Stockboy — HP 18/24 — WINDING UP (telegraph: heavy hit next round)
YOU: HP 5/20 | STA 3/8 | DOWNED: No
CORPSES: Hatchling A (looted), Hatchling B (unlooted)
```

### How AI RPGs Fail When the Story Invents the Hit

| Failure | How It Happens | How SynapticGM Prevents It |
|---------|---------------|---------------------------|
| **Story invents damage** | LLM writes "You slash the Stockboy for 12 damage." But the dice roll was 4 (miss). | The code sends the LLM an outcome token (`HIT 6` or `MISS`), not a damage number. The LLM writes the scene; the recap table states the number. Post-filter rejects prose containing digits. |
| **Story invents a kill** | LLM writes "The Stockboy crumples, dead." But HP is 6/24. | The code sends `ENEMY_HP_PCT: 75` token. The LLM may describe the enemy as "staggering" but not "dead." Post-filter rejects "dead," "dies," "kills," "slays" if enemy HP > 0. |
| **Story invents a miss** | LLM writes "Your knife glances off harmlessly." But the roll was 18 (crit). | The code sends `OUTCOME: CRIT` token. The LLM must narrate a critical hit. Post-filter checks for contradiction: if outcome is CRIT, prose must not contain "miss," "glances off," or "harmless." |
| **Story invents player death** | LLM writes "You fall, vision fading to black." But player HP is 5/20. | The code sends `PLAYER_HP_PCT: 25` token. The LLM may describe the player as "bloodied" or "staggering" but not "dying" or "falling." Post-filter rejects "die," "death," "fall," "black" if player HP > 0. |

### Copy Examples (System Voice — Recap Header)

```
─── SYSTEM RECAP · ROUND 3 ───────────────────
```

```
─── SYSTEM RECAP · ENCOUNTER END ─────────────
RESULT: VICTORY
XP: +45 | SALVAGE: +3 junk | LOOT: System-Issue Bandage x1
CORPSES: 3 (2 looted, 1 unlooted)
────────────────────────────────────────────────
```

### Avoid List

- Do NOT let the LLM state damage numbers, HP values, or kill confirmations in prose.
- Do NOT offer non-combat choices during a fight (no "look around," "talk to enemy").
- Do NOT use licensed move names (no "Cleave," "Power Attack" if they reference a specific game's implementation — use original names).
- Do NOT let the story describe loot drops. Loot is in the recap.
- Do NOT let the LLM narrate the enemy's next action as a fait accompli ("The Stockboy hits you for 8"). Tells are telegraphs, not resolved actions.
- Do NOT use canned combat phrases ("You lunge at the enemy," "The enemy snarls"). Each turn's prose must be unique.

---

## 3) Street Map

### Goal

Show the player's current street on a phone UI with named real-world places (a Tesco-like store, an alley, a bus stop). Distinguish outdoor street (mapScale, pins, paths) from indoor fog nodes (dungeon rooms). No bouncing "MOVE" orbs. Clear scale label vs danger tier.

### v1 Rules

- The street map is a **pin-and-path** graph. Pins are named locations. Paths are walkable connections.
- Pins use real-world place names (or close analogues): "Tesco Express," "Back Alley," "Bus Stop," "Pedestrian Crossing."
- The street has a **scale label**: "STREET — Urban — Safe" or "STREET — Urban — Wave Active."
- Indoor locations (stores, warehouses) are **dungeon instances** with fog-of-war node graphs. The street map shows the entrance pin; entering generates the indoor instance.
- No bouncing orbs. No animated "MOVE" buttons. Pins are static icons. Tapping a pin shows its name and status (open, locked, cleared, danger).
- The map is **one-handed**: pins are large enough to tap with a thumb. Pan/zoom is supported but the default view shows the player's current location centered.

### Interfaces

```typescript
interface StreetMap {
  placeId: string;                          // current street/area ID
  scaleLabel: "STREET" | "DISTRICT" | "ZONE";
  dangerTier: "safe" | "wave_active" | "contested" | "restricted";
  pins: StreetPin[];
  paths: StreetPath[];                     // walkable connections between pins
  playerPinId: string;                     // which pin the player is at
  discoveredPins: string[];                // pins the player has seen
}

interface StreetPin {
  id: string;
  name: string;                            // "Tesco Express" or "Back Alley" or "Bus Stop"
  type: "store" | "alley" | "landmark" | "transit" | "residential" | "locked_site";
  status: "open" | "locked" | "cleared" | "danger" | "unexplored";
  isDungeonEntrance: boolean;              // true = entering generates an indoor instance
  dungeonTemplateId: string | null;        // if isDungeonEntrance, which template
  dangerLevel: number | null;              // 1–5 for dungeon entrances; null for street pins
  description: string | null;              // short text shown on tap (code-owned)
}

interface StreetPath {
  fromPinId: string;
  toPinId: string;
  isWalkable: boolean;
  travelTimeSeconds: number;               // in-fiction travel time (for pacing, not real-time)
}
```

### Indoor vs Outdoor

| Aspect | Street (Outdoor) | Indoor (Dungeon) |
|--------|------------------|-------------------|
| **Map type** | Pin-and-path graph | Node graph with fog-of-war |
| **Scale label** | "STREET — Urban — Safe/Wave Active" | "INDOOR — [Store Name] — Danger Level N" |
| **Danger** | No combat spawns (safe) or Wave spawns (wave_active) | Seeded mobs, room-locked encounters |
| **Fog** | All discovered pins visible | Undiscovered rooms are fogged (hidden) |
| **Movement** | Tap pin → walk (instant or short delay) | Tap adjacent room → move (triggers encounter if present) |
| **Persistence** | Street map is persistent (shared world state in MMO; static in single-player) | Indoor instance is per-session (destroyed on exit or death) |
| **Visual** | Top-down pin map (like a phone maps app) | Node graph (like a dungeon crawler minimap) |

### Scale Label vs Danger Tier

```
STREET — Urban — Safe
  → No combat. Player can walk freely. Pins are explorable.

STREET — Urban — Wave Active
  → Wave encounters may spawn. Player can be attacked while walking.
  → Wave spawns are low-probability per move (not every step).

INDOOR — Tesco Express (First Blood) — Danger Level 2
  → Seeded dungeon. Room graph with fog. Mobs in rooms.
  → Danger Level 1 = trivial, 5 = raid-tier (not in single-player v1).
```

### Copy Examples (Pin Tap Display)

```
📍 Tesco Express
   Status: CLEARED
   Type: Store (Dungeon Entrance)
   Danger: Level 2
   [Enter] [Walk Past]
```

```
📍 Back Alley
   Status: UNEXPLORED
   Type: Alley
   [Investigate] [Walk Past]
```

```
📍 Locked Warehouse
   Status: LOCKED
   Requires: Level 3
   [Walk Past]
```

### Avoid List

- Do NOT put "MOVE" orbs or bouncing icons on the map. Static pins only.
- Do NOT show dungeon fog on the street map. Fog is indoor only.
- Do NOT label the street with dungeon danger tiers ("Tier 2 Urban Ruin"). Street is street.
- Do NOT spawn "Every Mind" mobs on pavement. Street mobs (when Wave active) are Wave mobs, not dungeon mobs.
- Do NOT use licensed map UI chrome (no WoW minimap, no FFXIV duty finder visual style).
- Do NOT show the entire city. Show the current street/area only. Pan to see adjacent areas.

---

## 4) Death, Sticky Fail, Protest

### Goal

Handle player death, fleeing, and the "I didn't agree to this" protest moment. Establish sticky fail by ~turn 8. Use in-fiction System voice for consequences. No "you wake up in an inn." Code consequence first, then prose.

### v1 Rules

- Death is real but not permanent. The player respawns at the last checkpoint (store entrance or street safe point).
- Death has a code consequence: lose 10% of current XP (not levels), lose unlooted corpses in the instance, instance resets to checkpoint.
- The player can flee combat ("Break Away"). Fleeing ends the encounter but the enemy remains in the room (not cleared).
- "Sticky fail" means: if the player fails a key action (e.g., fails to absorb the Foundation Core, fails to escape a room), the failure sticks. The story does not auto-correct. The player must deal with the consequence.
- Sticky fail activates by ~turn 8. Before turn 8, the game is forgiving (tutorial leniency). After turn 8, failures have consequences.
- "Protest" is when the player says "I didn't agree to this" or "I don't want to be Integrated." This is a valid in-fiction response. The System acknowledges it but does not undo the Integration.

### Interfaces

```typescript
interface DeathState {
  isDead: boolean;
  deathTurn: number | null;
  checkpointPlaceId: string | null;        // where the player respawns
  xpLost: number;
  instancesReset: string[];                // instance IDs that were reset
}

interface StickyFailThreshold {
  turnThreshold: number;                   // 8 (speculative)
  beforeThreshold: "lenient";              // failures are soft, auto-retry available
  afterThreshold: "consequential";          // failures stick, player must work around them
}

interface ProtestResponse {
  trigger: string;                         // "I didn't agree" | "I don't want this" | "Let me out"
  systemResponse: string;                  // registrar line (shared, not unique)
  // Example: "Integration is not reversible. Compliance is not required. Consequences remain."
  // The System does NOT undo Integration. It does NOT punish the protest. It simply states the fact.
}
```

### Death Flow

```
1. Player HP reaches -5 (bleed out) or player chooses "Bleed Out" while Downed.
2. CODE sets isDead = true. Records deathTurn. Calculates xpLost (10% of current XP).
3. CODE resets the current instance to checkpoint. Clears unlooted corpses.
4. CODE sets player position to checkpointPlaceId.
5. CODE sends outcome token to LLM: { OUTCOME: DEATH, CHECKPOINT: "Tesco Express Entrance" }
6. LLM writes 2–4 sentences of death narration (unique per death — no canned "you wake up in an inn").
7. System recap appears: "RESULT: DEATH | XP LOST: -45 | INSTANCE RESET | CHECKPOINT: Tesco Express Entrance"
8. Player resumes at checkpoint with reduced HP (50% of max — speculative) and 0 stamina.
```

### Sticky Fail Examples

| Turn | Action | Fail Result (Before T8) | Fail Result (After T8) |
|------|--------|------------------------|------------------------|
| T5 | Try to absorb Foundation Core | "The Core resists. Try again." (auto-retry) | N/A (Core absorption is always before T8) |
| T10 | Try to pick a lock on a door | "The lock won't budge." (can retry next turn) | "The lock jams. The door is stuck." (permanent — must find another way) |
| T12 | Try to flee combat | "You can't break away this round." (can retry) | "You break away but the enemy follows you to the next room." (enemy persists) |
| T15 | Try to salvage a broken item | "It falls apart in your hands." (no salvage) | "It falls apart. You cut yourself on the shards. -2 HP." (consequence) |

### Protest Response (System Voice)

```
Player: "I didn't agree to this."

System: "Integration is not reversible. Compliance is not required. 
Consequences remain. You may proceed."
```

```
Player: "Let me out."

System: "Exit is not available. Integration is permanent. 
You may proceed."
```

### Avoid List

- Do NOT use "you wake up in an inn" or any variant. Death respawns at a checkpoint, not a bed.
- Do NOT let the LLM undo a code consequence. If the code says XP is lost, the LLM cannot narrate "you feel no weaker."
- Do NOT punish the protest. The System acknowledges it calmly. No "the System punishes you for defiance."
- Do NOT make death permanent in single-player v1. Permanent death is a later mode (Hardcore — speculative).
- Do NOT auto-retry after turn 8. Sticky fail means the player must find another way.
- Do NOT use canned death narration. Each death gets unique prose from the LLM.

---

## 5) Salvage / T1 Economy

### Goal

Define the clinical System Salvage loop. Junk vs kit. First-hour prices. No shopkeeper NPC. The pity/announce system already exists — write the LOOP, not a new rarity table.

### v1 Rules

- Salvage is a **System interface**, not an NPC interaction. No shopkeeper. No dialogue. The player opens the Salvage tab, selects junk, and converts it.
- **Junk** = low-value items found in the world (debris, scrap, broken glass, ruined electronics). Junk converts to **salvage credits** (a T1 currency, not gold).
- **Kit** = usable items (weapons, armor, bandages, tools). Kit is NOT salvable into credits. Kit is used or equipped.
- First-hour prices are fixed (code-owned). No negotiation. No barter.
- The pity/announce system (already exists in the codebase) handles rare drops. Salvage does NOT use the rarity table — junk is always common-tier.
- Salvage credits are spent on: System-Issue consumables (bandages, stamina pills, repair kits) and T1 weapon/armor upgrades.

### Interfaces

```typescript
interface SalvageTransaction {
  playerId: string;
  inputJunkItemIds: string[];              // junk items being converted
  totalSalvageCredits: number;             // sum of junk values
  outputPurchaseId: string | null;         // what the player bought (if purchasing)
  outputPurchaseCost: number;
  timestamp: number;
}

interface JunkItem {
  id: string;
  name: string;                            // "Scrap Metal" | "Broken Glass" | "Ruined Circuit Board"
  salvageValue: number;                    // credits (1–5 range for T1 junk)
  source: "street" | "dungeon" | "corpse";
}

interface SalvageShopItem {
  id: string;                              // "salvage_bandage"
  name: string;                            // "System-Issue Bandage"
  cost: number;                            // salvage credits
  type: "consumable" | "upgrade" | "tool";
  description: string;
  effects: SalvageEffect[];
}

interface SalvageEffect {
  stat: "hp" | "stamina" | "defense" | "attack";
  bonusFlat: number;
  bonusPct: number;
  durationTurns: number | null;            // null = permanent (upgrades)
}
```

### Salvage Loop

```
1. Player finds junk in the world (street pins, dungeon rooms, corpses).
2. Junk enters inventory as items (code-owned).
3. Player opens Salvage tab (System interface, not NPC).
4. Player selects junk to convert.
5. CODE calculates total salvage credits from junk values.
6. CODE removes junk from inventory. Adds salvage credits to player's balance.
7. System Salvage recap: "SALVAGE: Scrap Metal x3 + Broken Glass x2 = 11 credits."
8. Player can spend credits on Salvage Shop items (System-Issue Bandage, Stamina Pill, etc.).
9. Purchases are instant. No confirmation dialogue. No NPC.
```

### First-Hour Prices (T1)

| Item | Salvage Credit Cost | Effect |
|------|-------------------|--------|
| System-Issue Bandage | 5 credits | Restore 8 HP. Single use. |
| System-Issue Stamina Pill | 4 credits | Restore 3 stamina. Single use. |
| System-Issue Repair Kit | 10 credits | Restore 5 max HP permanently (up to cap). Single use. |
| Knife Edge Upgrade (T1) | 15 credits | +2 attack to equipped knife. Permanent. |
| Reinforced Sleeve (T1) | 12 credits | +1 defense. Permanent. |

### Junk Values (T1)

| Junk Item | Salvage Credits | Source |
|-----------|-----------------|--------|
| Scrap Metal | 2 | Street, dungeon, corpse |
| Broken Glass | 1 | Street, dungeon |
| Ruined Circuit Board | 3 | Dungeon, corpse |
| Bent Pipe | 2 | Street, dungeon |
| Corrupted Residue | 4 | Corpse (Corrupted enemies only) |

### Copy Examples (System Voice — Salvage)

```
─── SYSTEM SALVAGE ──────────────────────────
CONVERT: Scrap Metal x3, Broken Glass x2
CREDITS: +11
BALANCE: 23 credits
────────────────────────────────────────────
```

```
─── SYSTEM SALVAGE — PURCHASE ────────────────
ITEM: System-Issue Bandage
COST: 5 credits
BALANCE: 18 credits
────────────────────────────────────────────
```

### Avoid List

- Do NOT create a shopkeeper NPC. Salvage is a System interface.
- Do NOT add a new rarity table. Junk is always common. The pity/announce system handles rare drops separately.
- Do NOT allow barter or negotiation. Prices are fixed.
- Do NOT let the LLM narrate salvage transactions. The System recap handles it.
- Do NOT sell combat outcomes through salvage (no "buy +10 HP" — bandages restore HP, they don't grant bonus HP above max).
- Do NOT use gold in T1. T1 economy is salvage credits. Gold comes later (T2+ — speculative).

---

## 6) Choices from the Committed Beat

### Goal

Build 3–5 choice buttons from the ledger state. Choices must reflect what is actually possible (dead, already-looted, in-fight, heal question asked). Fallback sets per beat type. Free-text is still allowed. Never "lunge at a corpse."

### v1 Rules

- Choices are generated by CODE from the committed beat (the resolved ledger state for this turn).
- The LLM does NOT generate choices. The LLM writes prose. Code reads the ledger and builds buttons.
- 3–5 buttons per turn. Always includes a free-text option ("Something else...").
- Buttons are contextual: if the player is in combat, buttons are fight verbs. If the player is in a room with a corpse, "Loot the corpse" is a button. If the corpse is already looted, the button is NOT shown.
- Fallback sets exist per beat type (combat, exploration, dialogue, salvage, death, checkpoint).
- "Lunge at a corpse" is a banned phrase — corpses are looted, not attacked.

### Interfaces

```typescript
interface ChoiceSet {
  beatType: "combat" | "exploration" | "dialogue" | "salvage" | "death" | "checkpoint" | "transition";
  choices: Choice[];
  freeTextAllowed: boolean;
  freeTextPrompt: string;                  // "Something else..." or "What do you do?"
}

interface Choice {
  id: string;
  label: string;                           // button text (2–5 words)
  codeAction: string;                      // what code does when this choice is selected
  requiresFlag: string | null;              // flag that must be true to show this choice
  isDisabled: boolean;                     // shown but greyed out (e.g., "Enter — Requires Level 3")
  disabledReason: string | null;
}
```

### Choice Generation Logic

```typescript
function generateChoices(ledger: LedgerState, beatType: BeatType): ChoiceSet {
  // CODE reads the ledger and builds choices based on current state.
  // The LLM does NOT participate in choice generation.

  switch (beatType) {
    case "combat":
      return generateCombatChoices(ledger);
    case "exploration":
      return generateExplorationChoices(ledger);
    case "dialogue":
      return generateDialogueChoices(ledger);
    case "salvage":
      return generateSalvageChoices(ledger);
    case "death":
      return generateDeathChoices(ledger);
    case "checkpoint":
      return generateCheckpointChoices(ledger);
  }
}

function generateCombatChoices(ledger: LedgerState): ChoiceSet {
  const choices: Choice[] = [];
  // Always: Strike, Brace, Break Away
  choices.push({ id: "strike", label: "Strike", codeAction: "attack", requiresFlag: "has_weapon", isDisabled: false, disabledReason: null });
  choices.push({ id: "brace", label: "Brace", codeAction: "defend", requiresFlag: null, isDisabled: false, disabledReason: null });
  choices.push({ id: "flee", label: "Break Away", codeAction: "flee", requiresFlag: null, isDisabled: false, disabledReason: null });
  // Conditional: Heavy Strike (if stamina >= 4)
  if (ledger.playerStamina >= 4) {
    choices.push({ id: "heavy_strike", label: "Heavy Strike", codeAction: "ability", requiresFlag: "has_weapon", isDisabled: false, disabledReason: null });
  }
  // Conditional: Use Item (if player has consumables)
  if (ledger.playerHasConsumables) {
    choices.push({ id: "use_item", label: "Use Item", codeAction: "use_item", requiresFlag: null, isDisabled: false, disabledReason: null });
  }
  // Downed state: only Crawl and Bleed Out
  if (ledger.isDowned) {
    return {
      beatType: "combat",
      choices: [
        { id: "crawl", label: "Crawl", codeAction: "flee", requiresFlag: null, isDisabled: false, disabledReason: null },
        { id: "bleed_out", label: "Bleed Out", codeAction: "pass", requiresFlag: null, isDisabled: false, disabledReason: null },
      ],
      freeTextAllowed: false,  // no free text when downed — only survival choices
      freeTextPrompt: "",
    };
  }
  return { beatType: "combat", choices, freeTextAllowed: true, freeTextPrompt: "Something else..." };
}

function generateExplorationChoices(ledger: LedgerState): ChoiceSet {
  const choices: Choice[] = [];
  const currentRoom = ledger.currentRoom;

  // Move to adjacent rooms
  for (const exit of currentRoom.exits) {
    const roomName = ledger.rooms[exit.toRoomId]?.name ?? "Unknown";
    choices.push({
      id: `move_${exit.toRoomId}`,
      label: `Go to ${roomName}`,
      codeAction: "move",
      requiresFlag: null,
      isDisabled: exit.isLocked,
      disabledReason: exit.isLocked ? "Locked" : null,
    });
  }

  // Loot corpses (unlooted only)
  const unlootedCorpses = currentRoom.corpses.filter(c => !c.isLooted);
  for (const corpse of unlootedCorpses) {
    choices.push({
      id: `loot_${corpse.enemyId}`,
      label: `Loot ${corpse.enemyName}`,
      codeAction: "loot",
      requiresFlag: null,
      isDisabled: false,
      disabledReason: null,
    });
  }

  // Search the room (if not already searched)
  if (!currentRoom.isSearched) {
    choices.push({
      id: "search",
      label: "Search the area",
      codeAction: "search",
      requiresFlag: null,
      isDisabled: false,
      disabledReason: null,
    });
  }

  // Salvage (if junk in room)
  if (currentRoom.junkItems.length > 0) {
    choices.push({
      id: "salvage",
      label: "Salvage junk",
      codeAction: "salvage",
      requiresFlag: null,
      isDisabled: false,
      disabledReason: null,
    });
  }

  return { beatType: "exploration", choices, freeTextAllowed: true, freeTextPrompt: "Something else..." };
}
```

### Fallback Sets Per Beat Type

| Beat Type | Default Choices | When Used |
|-----------|----------------|------------|
| **combat** | Strike, Brace, Break Away (+ Heavy Strike if STA ≥ 4, + Use Item if consumables) | Active encounter |
| **combat (downed)** | Crawl, Bleed Out | Player at 0 HP |
| **exploration** | [Move to adjacent rooms], [Loot unlooted corpses], [Search if unsearched], [Salvage if junk] | In a dungeon room, no active encounter |
| **dialogue** | [Dialogue options from NPC tree], [Leave] | Talking to an NPC |
| **salvage** | [Convert junk], [Buy item], [Exit Salvage] | Salvage interface open |
| **death** | [Respawn at checkpoint] | Player is dead |
| **checkpoint** | [Continue], [Review quest log], [Check inventory] | At a checkpoint after death |
| **transition** | [Proceed] | Moving between areas (e.g., street to dungeon entrance) |

### Banned Choice Labels

| Banned Label | Why | Replacement |
|-------------|-----|--------------|
| "Lunge at the corpse" | Corpses are looted, not attacked. | "Loot [enemy name]" |
| "Look around" | Vague. The story already describes the room. | "Search the area" (if unsearched) |
| "Just ahead of you" | Canned phrase. Banned by locked rules. | (No replacement — this phrase is banned entirely) |
| "Attack the darkness" | Meme reference. Breaks immersion. | "Strike" (if in combat) |
| "Do something" | Vague. No code action. | (Generated choices are always specific) |

### Avoid List

- Do NOT let the LLM generate choices. Code builds them from the ledger.
- Do NOT show choices for impossible actions (looting an already-looted corpse, entering a locked door).
- Do NOT show non-combat choices during combat (no "talk to enemy" in a fight).
- Do NOT use canned phrases in choice labels.
- Do NOT remove the free-text option (except when Downed — survival choices only).
- Do NOT show more than 5 buttons (plus free-text). If more are available, prioritize by relevance.

---

## 7) Street People (Short Memory)

### Goal

Populate the street with a crowd, a registrar, and one named local. Define what to remember for ~20 turns. When a face can return. The System is a voice, not a companion. No Wave NPCs on the street in hour 1.

### v1 Rules

- The street has three types of people: **crowd** (unnamed, unmemorable, set dressing), **registrar** (the System voice, not a person), and **one named local** (a single NPC with a name, a face, and a short memory).
- The crowd is never named, never remembered, and never becomes a character. They are "a man in a hi-vis jacket," "a woman pushing a pram." They exist for atmosphere only.
- The registrar is the System. It speaks in registrar lines (shared, not unique). It is not a companion. It does not have a personality. It does not "chat." It announces.
- The one named local is the player's first NPC relationship. They have a name, a location (a specific pin), and a short memory (~20 turns). After 20 turns, if the player hasn't interacted with them, they fade (move away, become part of the crowd).
- A face can return: if the named local fades, they can reappear later (up to 2 times in the first session) if the player returns to their pin. After that, they're gone for the session.
- No Wave NPCs on the street in hour 1. Wave mobs are faceless, nameless, and do not become characters. They are combat encounters, not NPCs.

### Interfaces

```typescript
interface StreetPeople {
  crowd: CrowdMember[];                    // 3–5 unnamed people for atmosphere
  namedLocal: NamedLocal | null;           // the one named NPC
  registrarActive: boolean;               // is the System speaking this turn?
}

interface CrowdMember {
  id: string;                              // ephemeral, regenerated per scene
  description: string;                     // "a man in a hi-vis jacket" — code-generated, not LLM
  isMemorable: false;                      // crowd is NEVER memorable
}

interface NamedLocal {
  id: string;                              // "npc_dave_the_bus_driver"
  name: string;                            // "Dave"
  pinId: string;                           // which street pin they're at
  memoryTurns: number;                     // 20 (how many turns they're available)
  turnsSinceLastInteraction: number;      // increments each turn
  hasFaded: boolean;                       // true if memory expired
  returnCount: number;                     // how many times they've reappeared (max 2)
  dialogueTreeId: string;
  relationship: number;                    // 0–100
  description: string;                     // 1–2 sentences (code-owned)
}

// Named local rules:
// 1. Only ONE named local exists on the street at a time (v1).
// 2. memoryTurns = 20. Each turn without interaction, turnsSinceLastInteraction++.
// 3. If turnsSinceLastInteraction >= 20 → hasFaded = true. The local leaves the pin.
// 4. If the player visits the local's pin after they've faded, returnCount++.
//    If returnCount <= 2, the local reappears (hasFaded = false, turnsSinceLastInteraction = 0).
//    If returnCount > 2, the local is gone for the session.
// 5. Interacting with the local (talking, giving an item) resets turnsSinceLastInteraction = 0.
// 6. The local does NOT follow the player. They stay at their pin.
// 7. The local does NOT participate in combat. They are not a companion.
```

### What to Remember for ~20 Turns

| Memory Item | Remembered? | How Long |
|-------------|-------------|----------|
| Named local's name | Yes | 20 turns from last interaction |
| Named local's location (pin) | Yes | 20 turns from last interaction |
| Named local's relationship level | Yes | 20 turns from last interaction |
| Named local's last dialogue topic | Yes | 20 turns from last interaction |
| Crowd member descriptions | No | Never (ephemeral) |
| Wave mob types | No | Never (combat encounters, not characters) |
| Registrar lines | Yes (in journal) | Permanent (journal entries) |
| Player's actions on the street | Yes (in journal) | Permanent (auto-summarized Pack 6) |

### System Is a Voice, Not a Companion

```typescript
interface SystemVoice {
  isCompanion: false;                      // the System is NEVER a companion
  speaksIn: "registrar_lines";             // shared, clinical, not personalized
  personality: null;                        // the System has NO personality
  // The System:
  // - Announces facts (Integration confirmed, Salvage available, Wave detected)
  // - Does NOT chat, banter, or react emotionally
  // - Does NOT have a name, face, or avatar
  // - Does NOT accompany the player (it's omnipresent, not a follower)
  // - May be referred to in prose ("the System's voice cuts in") but is not a character
}
```

### Copy Examples (System Voice vs Named Local)

```
// System voice (registrar line — shared):
"Integration confirmed. Salvage protocol available. Proceed."

// Named local dialogue (unique to this NPC):
Dave: "You're the one from the Tesco, aren't you? I saw the lights.
      Thought it was a fire. Should've known better."

// Crowd description (code-generated, not LLM):
"A woman in a grey coat hurries past, not looking at you."
```

### Avoid List

- Do NOT make the System a companion or give it a personality. It is a registrar.
- Do NOT name crowd members. They are atmosphere.
- Do NOT spawn Wave NPCs as named characters. Wave mobs are combat encounters.
- Do NOT let the named local follow the player. They stay at their pin.
- Do NOT give the named local combat stats. They are not a fighter.
- Do NOT let the named local remember more than 20 turns of non-interaction. They fade.
- Do NOT use canned NPC phrases ("Hello there, traveler!" — this is not a fantasy inn).

---

## 8) Phone Chrome / One-Hand Play

### Goal

Design the phone UI for one-handed play. Choice chips at the bottom (thumb-reach). Journal, Salvage, map, character tabs accessible but not intrusive. Hide chrome during the opening (before Foundation Core absorption) and during combat (focus on fight). No licensed MMO chrome.

### v1 Rules

- The screen is divided into: **story area** (top 60%, scrollable), **System recap** (middle 15%, code-rendered table), **choice chips** (bottom 25%, thumb-reach zone).
- Choice chips are the primary interaction. 3–5 chips, each large enough to tap with a thumb (min 44pt height).
- Tabs (Journal, Salvage, Map, Character) are in a bottom bar or slide-out drawer. They do NOT overlap the story area.
- During the opening (before Foundation Core absorption): hide Journal, Salvage, Character tabs. Show only the story and choice chips. The player has nothing to journal yet, nothing to salvage, no character sheet.
- During combat: hide Map and Journal tabs (focus on the fight). Show story, recap, and fight chips only. Salvage tab is hidden (no salvaging mid-combat).
- After Foundation Core absorption: all tabs become available. A brief System announcement marks the unlock.
- No licensed MMO chrome: no WoW-style action bars, no FFXIV-style duty finder, no Genshin-style character switcher. The UI is a phone-first text RPG interface.

### Interfaces

```typescript
interface PhoneChromeState {
  storyAreaVisible: boolean;               // always true
  systemRecapVisible: boolean;             // true in combat, true after encounters, false in pure dialogue
  choiceChipsVisible: boolean;            // always true
  tabsVisible: TabVisibility;
  currentBeatType: BeatType;
  coreAbsorbed: boolean;                   // Foundation Core absorption state
}

interface TabVisibility {
  journal: boolean;
  salvage: boolean;
  map: boolean;
  character: boolean;
}

// Tab visibility rules:
function calculateTabVisibility(beatType: BeatType, coreAbsorbed: boolean): TabVisibility {
  if (!coreAbsorbed) {
    // Before Foundation Core: only story and choices. No tabs.
    return { journal: false, salvage: false, map: false, character: false };
  }
  switch (beatType) {
    case "combat":
      return { journal: false, salvage: false, map: false, character: true };
    case "exploration":
      return { journal: true, salvage: true, map: true, character: true };
    case "dialogue":
      return { journal: true, salvage: false, map: false, character: true };
    case "salvage":
      return { journal: false, salvage: true, map: false, character: true };
    case "death":
      return { journal: true, salvage: false, map: true, character: true };
    case "checkpoint":
      return { journal: true, salvage: true, map: true, character: true };
    default:
      return { journal: true, salvage: true, map: true, character: true };
  }
}
```

### Layout (Phone, Portrait, One-Handed)

```
┌─────────────────────────────┐
│                             │
│    STORY AREA (scroll)     │  ← 60% of screen
│    LLM narration appears    │
│    here. 2–6 sentences.     │
│                             │
├─────────────────────────────┤
│  SYSTEM RECAP (code table)  │  ← 15% of screen
│  Round, HP, STA, results    │  (hidden in dialogue)
├─────────────────────────────┤
│                             │
│  [Strike] [Brace] [Flee]   │  ← 25% of screen
│  [Heavy Strike] [Use Item] │  (choice chips, thumb-reach)
│  [Something else...]       │
│                             │
├─────────────────────────────┤
│ 📖 JOURNAL  🔧 SALVAGE     │  ← bottom tab bar
│ 🗺 MAP      ⚙ CHARACTER     │  (hidden before Core absorption)
└─────────────────────────────┘
```

### What to Hide During Opening vs Combat

| Element | Opening (Pre-Core) | Combat | Exploration | Dialogue |
|---------|-------------------|--------|-------------|----------|
| Story area | Visible | Visible | Visible | Visible |
| System recap | Hidden | Visible | Visible (after encounters) | Hidden |
| Choice chips | Visible (3–5) | Visible (fight verbs) | Visible (explore choices) | Visible (dialogue choices) |
| Journal tab | Hidden | Hidden | Visible | Visible |
| Salvage tab | Hidden | Hidden | Visible | Hidden |
| Map tab | Hidden | Hidden | Visible | Hidden |
| Character tab | Hidden | Visible | Visible | Visible |
| Free-text | Allowed | Allowed (but fight-focused) | Allowed | Allowed |

### Copy Examples (Tab Labels)

```
📖 Journal    — quest log, story log, memories
🔧 Salvage    — junk → credits, buy consumables
🗺 Map        — street pins, dungeon nodes
⚙ Character  — HP, STA, kit, talents, XP
```

### Avoid List

- Do NOT use licensed MMO chrome (no action bars, no minimap corners, no hotkey rows).
- Do NOT show all tabs during the opening. The player has nothing to look at yet.
- Do NOT show Map or Journal during combat. Focus on the fight.
- Do NOT make choice chips smaller than 44pt height (thumb-reach requirement).
- Do NOT put the choice chips at the top of the screen. They must be at the bottom for one-handed play.
- Do NOT use a tab bar that overlaps the story area. Tabs are in a separate bottom bar or slide-out.
- Do NOT show the Salvage interface mid-combat. Salvaging is a non-combat action.
- Do NOT use icons that reference licensed games (no WoW-style map pin, no Pokémon-style character tab).

---

## One-Page "Do Not Break" Checklist for the Live Engine

```
╔══════════════════════════════════════════════════════════════╗
║           SYNAPTICGM LIVE ENGINE — DO NOT BREAK              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. CODE OWNS THE LEDGER. The LLM writes prose only.        ║
║     Dice, HP, XP, loot, kit, room graph, mob counts,         ║
║     quest reveal, and choices are ALL code-owned.            ║
║                                                              ║
║  2. THE LLM WRITES 2–6 NEW SENTENCES PER TURN.               ║
║     No more. No canned phrases. No "just ahead of you."       ║
║     No look-around collage. Unique story every turn.          ║
║                                                              ║
║  3. STORY FIRST, THEN SYSTEM CHROME.                          ║
║     Prose renders first. Recap table renders after.           ║
║     Choices render last. Always in this order.                ║
║                                                              ║
║  4. THE WARDEN IS CODE, NOT AN LLM.                           ║
║     Post-filter checks prose against ledger.                 ║
║     Rejects: digits, "dead" if HP > 0, "alive" if HP = 0.    ║
║     Fallback: "The round resolves."                          ║
║                                                              ║
║  5. CHOICES COME FROM THE COMMITTED BEAT.                     ║
║     Code builds 3–5 buttons from ledger state.                ║
║     LLM does NOT generate choices.                            ║
║     Free-text is allowed (except when Downed).               ║
║     Never "lunge at a corpse."                                ║
║                                                              ║
║  6. STREET STAYS STREET.                                      ║
║     Street = mapScale pins, no dungeon danger.                ║
║     Indoor = seeded fog nodes, room-locked encounters.        ║
║     No "Tier 2 Urban Ruin" on pavement.                      ║
║     No "Every Mind" on a street.                              ║
║                                                              ║
║  7. OPENING IS LOCKED.                                        ║
║     Journal EMPTY until name + place confirmed.               ║
║     First Blood only. No Riverside, no Wave 6, no Guide Book  ║
║     until the story unlocks them.                             ║
║     First Blood: rooms, ~4 trash/hatchling, Corrupted         ║
║     Stockboy, Foundation Core, one quest, Survival Knife.    ║
║                                                              ║
║  8. SALVAGE IS CLINICAL.                                      ║
║     System interface, no shopkeeper NPC.                      ║
║     Junk → credits. Fixed prices. No barter.                 ║
║     No new rarity table (pity/announce already exists).       ║
║                                                              ║
║  9. DEATH IS CODE-FIRST.                                      ║
║     Code sets consequence (XP loss, instance reset).          ║
║     Then prose narrates the death.                            ║
║     No "you wake up in an inn."                               ║
║     Sticky fail by ~turn 8.                                   ║
║     Protest acknowledged, not punished.                      ║
║                                                              ║
║ 10. KID MODE: SWEAR SWAP + PIN + SLUR MASK.                   ║
║     Shop/IAP hideable later. Do not design a cash shop.       ║
║                                                              ║
║ 11. NEVER SELL COMBAT OUTCOMES.                               ║
║     Cosmetics/themes are display-only.                        ║
║     They must not touch dice math.                            ║
║                                                              ║
║ 12. ONE NAMED LOCAL. SYSTEM IS A VOICE.                      ║
║     One NPC with ~20-turn memory.                            ║
║     System is a registrar, not a companion.                   ║
║     No Wave NPCs on the street in hour 1.                     ║
║                                                              ║
║ 13. DUAL-AI MAX: 1 WRITER + OPTIONAL REWRITE.                ║
║     Warden is CODE. No second LLM for guardrails.             ║
║                                                              ║
║ 14. PHONE-FIRST, ONE-HANDED.                                  ║
║     Choice chips at bottom (thumb-reach).                     ║
║     Hide tabs before Core absorption and during combat.       ║
║     No licensed MMO chrome.                                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Sources

| Source | URL | Date Accessed | What Was Used |
|--------|-----|--------------|---------------|
| Evennia Turn-Based Combat System (2.x docs) | https://www.evennia.com/docs/2.x/Howtos/Turn-based-Combat-System.html | Aug 15, 2026 | CombatHandler pattern, simultaneous resolve, timeout → defend, corpse/loot mechanics |
| Friends & Fables Review 2026 (DungeonsDeep) | https://dungeonsdeep.ai/blog/friends-and-fables-review-2026 | Aug 15, 2026 | LLM math failures (wrong dice, dead/alive contradictions), why code must own math |
| AI Dungeon World Info research (community) | https://github.com/AIDungeon/AIDungeon | Aug 15, 2026 | Keyword WI limitations, context budget triage, why structured state is better |
| Hidden Door design review (Ian Bicking) | https://www.hiddendoor.com/ | Aug 15, 2026 | Ungrounded narrative state, why hidden properties must be code-owned |
| Fallen London storylet design (Failbetter) | https://www.failbettergames.com/ | Aug 15, 2026 | Short-session structure, storylet pattern, persistence without grind |
| Kingdom of Loathing (Asymmetric) | https://kol.coldfront.net/thekolwiki/ | Aug 15, 2026 | Daily turn limit, short-session loop, clinical economy |
| Existing project file: AI_RPG_Research_Intel_and_Summary.md | (project file) | Aug 15, 2026 | Code-owns-truth principle, LLM-as-rules-engine failure modes |
| Existing project file: AI_RPG_Technical_UX_Research_Report.md | (project file) | Aug 15, 2026 | SynapticGM architecture (code owns dice/HP/loot/seed), dual-AI pattern, warden concept |
| Existing project file: docs/research/pack-09-monetization-cosmetics-audio-iap-2026-08.md | (project file) | Aug 15, 2026 | Never sell combat outcomes, cosmetics display-only, Kid Mode requirements |

---

## Speculation Markers

1. **Turn ranges (T8–T10, T14–T16, etc.)** — speculative. Need playtesting to confirm pacing.
2. **Level 5 by turn 30–40** — speculative. Depends on XP curve and salvage XP values.
3. **Wave eligibility at Level 3** — speculative. Could be Level 2 or Level 4.
4. **Stamina costs (Strike = 2, Heavy Strike = 4)** — speculative. Need balance testing.
5. **Downed bleed-out at -5 HP** — speculative. Could be -3 or -10.
6. **System Mercy Token: 1 per session** — speculative. Could be 0 (no mercy) or 2.
7. **Death penalty: 10% of current XP** — speculative. Could be 5% or 15%.
8. **Sticky fail threshold: turn 8** — speculative. Could be turn 5 or turn 10.
9. **Named local memory: 20 turns** — speculative. Could be 15 or 30.
10. **Named local return count: max 2** — speculative. Could be 1 or 3.
11. **Salvage credit values and shop prices** — all speculative. Need economic simulation.
12. **Respawn HP: 50% of max** — speculative. Could be 25% or 100%.
13. **Tab visibility rules** — speculative. User testing may reveal different needs.

---

**End of Live Gameplay Dump. This file provides implementation-ready schemas, beat sheets, copy banks, and do/don't rules for the live SynapticGM single-player experience from First Blood exit through Level 5.**
