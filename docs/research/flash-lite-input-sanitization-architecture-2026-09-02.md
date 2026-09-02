# Flash Lite Input Sanitization Architecture
## Gemini Pro Recommendations → Implementation Design

**Date:** 2026-09-02  
**Context:** Gemini Pro review of RPG T50 (seed 43) scored 1/10 for story quality  
**Root Cause:** Pre-generation context pollution (raw JSON/UI labels treated as lore)  
**Target:** Flash Lite 5-6/10 story quality through proper input sanitization  
**Current Build:** 2026-09-02a (Batch X + residual fixes)

---

## Executive Summary

Gemini Pro identified that Flash Lite's 1/10 score stems from **architectural pollution**, not post-generation errors. The LLM receives raw state labels (`Consul`, `Heat: High`, `Target: a nearby street`) which it weaves into narrative as if they were canonical lore.

**Key Insight:** Flash Lite can reach 5-6/10 if we implement proper pre-LLM state translation and entity isolation. The model is capable, but the input is toxic.

**Implementation Strategy:** Five architectural interventions, ordered by impact and effort, with phased rollout.

---

## Current Architecture Analysis

### State Flow (as of 2026-09-02a)

```
GameState (raw)
  ↓
buildSituationPacket() — formats JSON-like SNAPSHOT
  ↓
callGm() — passes SNAPSHOT + player action + AUTHORITY
  ↓
LLM (Flash Lite) — generates narration + sometimes leaks choices
  ↓
runWarden() — post-hoc string scrubbing
  ↓
compileChoices() — generates choice pads
  ↓
UI display
```

### Key Problems

1. **Raw state exposure** - `Current_Loc: Consul Caravan Camp. Heat: High.` appears verbatim
2. **UI label leakage** - `Target: a nearby street` becomes a narrative element
3. **Entity pollution** - `Consul` (faction token) treated as a person/place/direction
4. **Choice co-generation** - LLM sees choice labels while writing narration
5. **Identical state on loiter** - No signal to generate delta content
6. **POV inconsistency** - No explicit grammatical guardrails

### Current SNAPSHOT Example (Bad)

```yaml
### SNAPSHOT
- Location: Consul Caravan Camp
- Zone Threat: Tier 1 vs Player Level 1
- Crowd: small crowd (Consul, Heat, nearby figures)
- Presence: Consul, Heat, Vessa, Just
- Exits: road toward a nearby street, path toward Salt Road Waystation
- Props: wagons, crates, sturdy locked crate, fires
- Inventory: worn clothes, Bag (sealed)
- Encounter: none
- Active Quests (revealed): HEIST: Salt Road Ledger Retrieval
- Power Scaling: balanced
```

**Problems:**
- `Consul` is a faction token, not a person - but appears in Crowd/Presence
- `Heat` is a variable label, not a person - but appears as an entity
- `road toward a nearby street` is a UI label - becomes "the Consul" as a direction
- Raw enumeration makes Flash Lite treat these as canonical names

---

## Recommendation 1: Pre-LLM State Translation
### "Narrative Translator" Module

#### Current State

**Location:** `supabase/functions/_shared/gm/situationPacket.ts`  
**Function:** `formatSceneSnapshotForPrompt(state: GameState): string`

Current output is structured like a YAML dump:
```yaml
- Location: Consul Caravan Camp
- Crowd: small crowd (Consul, Heat)
- Presence: Consul, Heat, Vessa
- Exits: road toward Consul
```

**Problems:**
- Reads like a data structure, not natural language
- Token names (`Consul`, `Heat`) appear raw without context
- Flash Lite interprets these as character/place names
- No semantic distinction between labels and entities

#### Target State

**Natural Language Situation Block:**

```
CURRENT SCENE:
The player is standing in a dusty caravan camp run by the Consul faction. 
The guards are highly alert (heightened security). Two named individuals 
are present: Vessa (faction contact) and Just (her associate). Multiple 
guards patrol the perimeter. The camp has several obvious exits: a road 
leading toward the waystation, and a path back toward town.

The atmosphere is tense. The player's objective is to steal a ledger from 
a locked wagon without being caught. The player has basic street clothes 
and a sealed bag.
```

**Key Changes:**
- `Consul` → "Consul faction" or "faction guards"
- `Heat: High` → "guards are highly alert"
- `Presence: Consul, Heat, Vessa` → "Two named individuals: Vessa, Just. Multiple guards patrol."
- `Exits: road toward Consul` → "a road leading toward the waystation"
- Semantic context for every element

#### Implementation Approach

**Module:** `supabase/functions/_shared/gm/narrativeTranslator.ts`

**Core Function:**
```typescript
export function translateStateToNarrative(state: GameState): string {
  const scene = buildSituationPacket(state);
  
  // Location context
  const locationContext = translateLocation(
    scene.location, 
    state.locationSheet,
    state.places
  );
  
  // Entity translation
  const presenceNarrative = translatePresence(
    state.sceneFacts?.present,
    state.npcMemories,
    state.activeEncounter
  );
  
  // State variables
  const tensionNarrative = translateTension(
    state.sceneFacts?.tension,
    state.worldLedger?.heat
  );
  
  // Exits
  const exitsNarrative = translateExits(
    state.locationSheet?.exits,
    state.activeDungeon
  );
  
  // Compose natural prose
  return composeSceneNarrative({
    location: locationContext,
    presence: presenceNarrative,
    tension: tensionNarrative,
    exits: exitsNarrative,
    objectives: translateObjectives(state.quests),
    inventory: translateInventory(state.inventory)
  });
}
```

**Sub-Functions:**

```typescript
// Entity registry → natural language
function translatePresence(
  present: string[] | undefined,
  memories: NpcMemory[] | undefined,
  encounter: Encounter | undefined
): string {
  const named: string[] = [];
  const anonymous: string[] = [];
  
  for (const token of present ?? []) {
    if (isUiLabel(token)) {
      // "Consul" → skip or translate to "guards"
      anonymous.push(translateToken(token));
    } else if (isNamedNpc(token, memories)) {
      // "Vessa" → keep as named entity
      const memory = memories?.find(m => m.npcName === token);
      named.push(`${token} (${memory?.disposition ?? 'neutral'})`);
    } else {
      // Generic crowd
      anonymous.push(token);
    }
  }
  
  if (encounter) {
    named.push(`${encounter.name} (hostile, ${encounter.hp}/${encounter.maxHp} HP)`);
  }
  
  let result = '';
  if (named.length) {
    result += `Named individuals present: ${named.join(', ')}. `;
  }
  if (anonymous.length) {
    const count = anonymous.length;
    result += `Approximately ${count} other people in the area (${anonymous[0]}). `;
  }
  if (!named.length && !anonymous.length) {
    result += 'The area is empty. No other people are present. ';
  }
  
  return result;
}

// Location name → contextual description
function translateLocation(
  name: string,
  sheet: LocationSheet | undefined,
  places: Place[] | undefined
): string {
  const place = places?.find(p => p.name === name);
  
  if (place?.description) {
    return `${name} — ${place.description}`;
  }
  
  if (sheet?.biome) {
    return `${name}, a ${sheet.biome} area`;
  }
  
  return name;
}

// State variables → natural language
function translateTension(
  tension: string | undefined,
  heat: number | undefined
): string {
  if (tension === 'high' || (heat && heat > 60)) {
    return 'The atmosphere is tense. Guards are on high alert. ';
  }
  if (tension === 'medium' || (heat && heat > 30)) {
    return 'There is mild tension in the air. ';
  }
  return '';
}

// Exit labels → natural language
function translateExits(
  exits: Exit[] | undefined,
  dungeon: Dungeon | undefined
): string {
  if (dungeon) {
    return translateDungeonExits(dungeon);
  }
  
  const exitDescriptions = (exits ?? [])
    .filter(e => !isUiLabel(e.label))
    .map(e => {
      // "road toward Consul" → "a road leading toward the waystation"
      return naturalizeExitLabel(e.label, e.destination);
    });
  
  if (!exitDescriptions.length) return 'No obvious exits are visible. ';
  
  return `Obvious exits: ${exitDescriptions.join('; ')}. `;
}

// UI label detection
function isUiLabel(token: string): boolean {
  const uiLabels = [
    'Consul', 'Heat', 'Target', 'Objective',
    'a nearby street', 'the Consul', 'toward the Consul'
  ];
  return uiLabels.some(label => 
    token.toLowerCase().includes(label.toLowerCase())
  );
}

function naturalizeExitLabel(label: string, destination?: string): string {
  // "road toward Consul" → "a road leading to the waystation"
  if (/toward (?:the )?Consul/i.test(label)) {
    return destination 
      ? `a road leading to ${destination}`
      : 'a road leading away';
  }
  
  // "path to nearby street" → "a path toward town"
  if (/nearby street/i.test(label)) {
    return 'a path toward town';
  }
  
  return label;
}
```

**Integration Point:**

Replace in `callGm()`:
```typescript
// Old
const snapshot = formatSceneSnapshotForPrompt(state);

// New
const snapshot = translateStateToNarrative(state);
```

#### Effort Estimate

**Time:** 2-3 days

**Breakdown:**
- Day 1: Core `narrativeTranslator.ts` module + entity translation
- Day 2: Location/exit/tension translation + integration
- Day 3: Vitest coverage + edge case handling

**Complexity:** Medium
- Clear input/output contract
- Mostly deterministic string transformation
- Can reuse existing entity registry logic
- Main risk: missing UI labels in detection

#### Dependencies

- Existing `buildSituationPacket()` for raw state
- Entity registry from `present[]` / `npcMemories`
- Location sheet / places data

#### Risks

1. **Incomplete UI label catalog** - May miss novel labels
   - Mitigation: Allowlist known safe tokens, flag unknowns
   
2. **Over-naturalization** - Loses precision
   - Mitigation: Keep factual bindings in separate AUTHORITY block

3. **Flash Lite still invents** - Translation isn't a hard constraint
   - Mitigation: Combine with Recommendation 2 (CAST block)

#### Validation Strategy

**Before:**
```yaml
- Presence: Consul, Heat, Vessa
```
→ Flash Lite writes "Consul steps forward, Heat watches..."

**After:**
```
Named individuals present: Vessa (neutral). Approximately 3-4 guards patrol the area.
```
→ Flash Lite writes "Vessa shifts her weight, the guards watch..."

**Success Metrics:**
- Zero `Consul` as a character name in T50 runs
- Zero `Heat` as a person in T50 runs
- Zero `toward the Consul` as a direction in prose

---

## Recommendation 2: Strict Entity Isolation
### CAST Block with Hard Binding

#### Current State

**Location:** `supabase/functions/_shared/gm/situationPacket.ts`  
**Function:** `formatPresenceForSnapshot(present: string[])`

Current entity list is loose:
```yaml
- Presence: Consul, Heat, Vessa, Just, nearby figures
```

**Problems:**
- No explicit directive that ONLY these entities exist
- Flash Lite freely invents "a guard", "the merchant", "someone nearby"
- No distinction between named NPCs and anonymous tokens
- Weak binding - LLM treats as suggestions, not constraints

#### Target State

**Explicit CAST Block with Binding Directive:**

```xml
<CAST>
This is the complete list of entities physically present in this scene.
ONLY entities explicitly listed below may appear, speak, or act in your narration.
You MUST NOT invent additional people, creatures, or speakers beyond this list.

NAMED CHARACTERS (may speak, act, have agency):
- Vessa (faction contact, neutral disposition, present since T6)
- Just (Vessa's associate, intimidating presence, present since T8)

ANONYMOUS ENTITIES (background only, no individual agency):
- 3-4 Consul faction guards (patrol the camp, alert)
- 2 wagon drivers (sleeping, not present in this scene)

ACTIVE THREATS:
- None

CONSTRAINTS:
- Do NOT invent "a figure", "someone nearby", "a merchant", "another guard"
- If the player wants to interact with someone new, they must travel or search
- Guards are plural background - not individual named characters
</CAST>
```

**Key Features:**
- Explicit enumeration: "ONLY entities listed"
- Named vs Anonymous distinction
- Disposition hints (but not personality essays)
- Hard constraint: "DO NOT invent..."
- Action requirement: new entities require travel/search

#### Implementation Approach

**Module:** `supabase/functions/_shared/gm/entityCast.ts`

**Core Function:**
```typescript
export function buildEntityCast(state: GameState): string {
  const named = extractNamedCharacters(state);
  const anonymous = extractAnonymousEntities(state);
  const threats = extractActiveThreats(state);
  
  return formatCastBlock({
    named,
    anonymous,
    threats,
    constraints: generateConstraints(state)
  });
}

function extractNamedCharacters(state: GameState): CastMember[] {
  const present = state.sceneFacts?.present ?? [];
  const memories = state.npcMemories ?? [];
  const pinned = state.openingEstablishment?.pinnedNpcNames ?? [];
  
  const named: CastMember[] = [];
  
  for (const token of present) {
    // Skip UI labels
    if (isUiLabel(token)) continue;
    
    // Check if this is a known NPC
    const memory = memories.find(m => m.npcName === token);
    if (memory) {
      named.push({
        name: token,
        role: memory.role ?? 'character',
        disposition: memory.disposition,
        firstSeen: findFirstSeenTurn(token, state.timeline),
        pinned: pinned.includes(token)
      });
    } else if (/^[A-Z][a-z'-]{1,20}$/.test(token)) {
      // Looks like a proper name
      named.push({
        name: token,
        role: 'character',
        disposition: 'neutral',
        firstSeen: state.turn
      });
    }
  }
  
  return named;
}

function extractAnonymousEntities(state: GameState): AnonymousGroup[] {
  const present = state.sceneFacts?.present ?? [];
  const crowdSize = state.sceneFacts?.crowdCount ?? 0;
  const groups: AnonymousGroup[] = [];
  
  // Check for faction tokens
  if (present.some(p => /consul|guard/i.test(p))) {
    groups.push({
      type: 'guards',
      count: crowdSize > 0 ? crowdSize : '3-4',
      activity: 'patrol the camp',
      alertLevel: state.sceneFacts?.tension ?? 'medium'
    });
  }
  
  // Crowd calculation
  if (crowdSize > 5 && !groups.length) {
    groups.push({
      type: 'bystanders',
      count: crowdSize,
      activity: 'going about their business',
      alertLevel: 'low'
    });
  }
  
  return groups;
}

function extractActiveThreats(state: GameState): ThreatEntity[] {
  const threats: ThreatEntity[] = [];
  
  if (state.activeEncounter) {
    threats.push({
      name: state.activeEncounter.name,
      level: state.activeEncounter.level,
      hp: `${state.activeEncounter.hp}/${state.activeEncounter.maxHp}`,
      state: determineThreatState(state.activeEncounter)
    });
  }
  
  return threats;
}

function formatCastBlock(cast: Cast): string {
  const lines = [
    '<CAST>',
    'This is the complete list of entities physically present in this scene.',
    'ONLY entities explicitly listed below may appear, speak, or act in your narration.',
    'You MUST NOT invent additional people, creatures, or speakers beyond this list.',
    ''
  ];
  
  if (cast.named.length) {
    lines.push('NAMED CHARACTERS (may speak, act, have agency):');
    for (const char of cast.named) {
      const pin = char.pinned ? ' [OPENING PIN - consequential]' : '';
      lines.push(
        `- ${char.name} (${char.role}, ${char.disposition}, present since T${char.firstSeen})${pin}`
      );
    }
    lines.push('');
  }
  
  if (cast.anonymous.length) {
    lines.push('ANONYMOUS ENTITIES (background only, no individual agency):');
    for (const group of cast.anonymous) {
      lines.push(
        `- ${group.count} ${group.type} (${group.activity}, ${group.alertLevel} alert)`
      );
    }
    lines.push('');
  }
  
  if (cast.threats.length) {
    lines.push('ACTIVE THREATS:');
    for (const threat of cast.threats) {
      lines.push(
        `- ${threat.name} (Level ${threat.level}, ${threat.hp} HP, ${threat.state})`
      );
    }
    lines.push('');
  } else {
    lines.push('ACTIVE THREATS: None');
    lines.push('');
  }
  
  lines.push('CONSTRAINTS:');
  for (const constraint of cast.constraints) {
    lines.push(`- ${constraint}`);
  }
  
  lines.push('</CAST>');
  
  return lines.join('\n');
}

function generateConstraints(state: GameState): string[] {
  const constraints = [
    'Do NOT invent "a figure", "someone nearby", "a merchant", "another guard"',
    'If the player wants to interact with someone new, they must travel or search'
  ];
  
  // Alone arrival
  if (state.openingEstablishment?.aloneArrival) {
    constraints.push(
      'ALONE ARRIVAL: No handlers, watchers, or voices outside until ledger establishes presence'
    );
  }
  
  // High security
  if (state.sceneFacts?.tension === 'high') {
    constraints.push(
      'Guards are plural background - not individual named characters unless promoted by ledger'
    );
  }
  
  return constraints;
}
```

**Integration Point:**

In `formatSituationForPrompt()`, replace:
```typescript
// Old
const presenceNarrative = translatePresence(state.sceneFacts?.present, ...);

// New  
const castBlock = buildEntityCast(state);
```

Place CAST block BEFORE main situation narrative, as a binding constraint.

#### Effort Estimate

**Time:** 2 days

**Breakdown:**
- Day 1: Core `entityCast.ts` module + named/anonymous extraction
- Day 2: CAST formatter + constraint generation + integration

**Complexity:** Medium
- Reuses existing entity registry logic
- Mostly deterministic categorization
- Main challenge: distinguishing named from anonymous correctly

#### Dependencies

- `sceneFacts.present[]` (entity registry)
- `npcMemories` (disposition tracking)
- `openingEstablishment.pinnedNpcNames` (opening authority)

#### Risks

1. **Flash Lite ignores XML** - Model may not respect `<CAST>` tags
   - Mitigation: Test with `<CAST>`, fallback to "=== CAST ===" if needed
   - Combine with stronger AUTHORITY rail: "Breaking CAST constraints is forbidden"

2. **Over-constraining** - Blocks legitimate scene evolution
   - Mitigation: Update CAST after travel/search/encounter spawn
   - Anonymous groups allow background population

3. **Named vs Anonymous ambiguity** - "the guard" singular?
   - Mitigation: Explicit "Guards are plural background" constraint

#### Validation Strategy

**Test Case:** Consul Caravan Camp scene

**Before (Current):**
```yaml
- Presence: Consul, Heat, Vessa, Just
```
→ Flash Lite writes "Consul steps forward, Heat watches, a merchant calls out..."

**After (CAST Block):**
```xml
<CAST>
NAMED CHARACTERS:
- Vessa (contact, neutral, T6)
- Just (associate, T8)

ANONYMOUS ENTITIES:
- 3-4 guards (patrol, high alert)

CONSTRAINTS:
- Do NOT invent "Consul" as a character
- Guards are plural background only
</CAST>
```
→ Flash Lite writes "Vessa shifts, Just grunts, the guards patrol..."

**Success Metrics:**
- Zero invented entity names (no "a figure", "someone nearby")
- Zero `Consul` / `Heat` as characters
- Named NPCs from CAST appear consistently
- Anonymous groups stay plural background

---

## Recommendation 3: Decoupled Choice Generation
### Late Binding (Phase 1: Narration, Phase 2: Choices)

#### Current State

**Location:** `src/game/useGame.ts` `sendAction()` → `supabase/functions/gm-turn`

Current pipeline:
1. Player submits action
2. `callGm()` passes action + SNAPSHOT + **choice pad labels**
3. LLM generates narration (can see choice labels in context)
4. `runWarden()` scrubs narration
5. `compileChoices()` generates choice pad
6. UI displays both

**Problem:** LLM sees choice labels while writing narration

**Evidence from RPG T50:**
```
Turn 11: "The low hum of the tavern..." [leaked from choice pad]
Turn 21: "You press for leverage, the thought..." [choice label fragment]
```

Choice labels like `Press for leverage` appear verbatim in narration because they're in the context window during generation.

#### Target State

**Phase 1: Narration Only**
```
Player action + SNAPSHOT (no choices) 
  ↓
LLM generates narration
  ↓
Narration committed
```

**Phase 2: Choices Calculated**
```
Committed narration + updated GameState
  ↓
ChoiceCompiler calculates legal pads
  ↓
UI appends choices to narration
```

**Key Change:** LLM never sees choice labels. Choices are deterministic post-narration calculation.

#### Implementation Approach

**Module:** Refactor `supabase/functions/gm-turn/index.ts` + `src/game/choiceCompiler.ts`

**Current `gm-turn` Structure:**
```typescript
// Current (bad)
export async function gmTurn(req: Request): Promise<Response> {
  const { state, playerAction, offeredChoices } = await req.json();
  
  const situation = formatSituationForPrompt(state);
  // offeredChoices included in prompt ← PROBLEM
  
  const narration = await callGm({ situation, playerAction, offeredChoices });
  const choices = compileChoices(state, narration);
  
  return { narration, choices };
}
```

**Target (good):**
```typescript
// Phase 1: Narration only
export async function gmTurn(req: Request): Promise<Response> {
  const { state, playerAction } = await req.json();
  
  const situation = formatSituationForPrompt(state);
  // NO offeredChoices in prompt
  
  const narration = await callGm({ 
    situation, 
    playerAction,
    // choices: OMITTED
  });
  
  // Phase 2: Choices calculated from result state
  const updatedState = applyNarrationToState(state, narration);
  const choices = compileChoices(updatedState, narration);
  
  return { narration, choices };
}
```

**Key Changes:**

1. **Remove `offeredChoices` from GM prompt:**
```typescript
// In callGm()
// Old
const prompt = `
${situationPacket}

Player action: ${playerAction}

Offered choices:
${offeredChoices.join('\n')}

Write the next beat.
`;

// New
const prompt = `
${situationPacket}

Player action: ${playerAction}

Write the next beat. (Choices will be calculated separately - focus only on narration.)
`;
```

2. **Calculate choices post-narration:**
```typescript
// In gm-turn/index.ts
async function generateNarration(state: GameState, playerAction: string): Promise<string> {
  const situation = formatSituationForPrompt(state);
  
  // NO CHOICES
  const narration = await callGm({
    situation,
    playerAction,
    // offeredChoices: REMOVED
  });
  
  return narration;
}

async function calculateChoices(
  state: GameState, 
  narration: string
): Promise<string[]> {
  // Update state with narration results
  const updatedState = {
    ...state,
    // Parse any ledger updates from narration
    // (HP changes, item gains, location changes, etc.)
  };
  
  // Compile choices deterministically
  return compileChoices(updatedState, narration);
}
```

3. **UI receives both separately:**
```typescript
// In useGame.ts sendAction()
const { narration, choices } = await gmTurnProxy({
  state: gameState,
  playerAction: input
  // NO offeredChoices sent
});

// Append choices to UI after narration displays
setGameState(prev => ({
  ...prev,
  log: [...prev.log, { role: 'assistant', content: narration }],
  offeredChoices: choices
}));
```

#### ActionBar Integration

**Current:** ActionBar displays `state.offeredChoices` (sent to GM)

**New:** ActionBar displays `choices` (calculated post-GM, never sent to LLM)

```typescript
// In src/components/ActionBar.tsx
// No change needed - still displays state.offeredChoices
// But those choices are now calculated AFTER narration, not BEFORE
```

#### Effort Estimate

**Time:** 1-2 days

**Breakdown:**
- Day 1: Remove `offeredChoices` from `callGm()` prompt + edge function refactor
- Day 2: Vitest update + validation that choices still work

**Complexity:** Low-Medium
- Clear separation of concerns
- No new logic - just reordering
- Main risk: ensuring `compileChoices()` has all needed state post-narration

#### Dependencies

- `compileChoices()` must work with **post-narration** state
- May need to parse narration for state changes (HP, items, location)
- Or: commit state changes BEFORE calling `compileChoices()`

#### Risks

1. **Choice quality degrades** - Without seeing prior choices, LLM may write narration that makes choices nonsensical
   - Mitigation: This is actually a feature - forces narration to stand alone
   - Choices adapt to narration, not vice versa

2. **Timing issue** - Choices calculated too late for UI
   - Mitigation: Async load choices after narration displays (acceptable UX)

3. **State sync** - `compileChoices()` needs accurate post-narration state
   - Mitigation: Ensure all ledger updates committed before choice calculation
   - Test combat HP changes, item gains, location changes

#### Validation Strategy

**Test Case:** Combat turn

**Before:**
```
Prompt includes: "Offered choices: 1. Attack 2. Defend 3. Flee"
LLM writes: "You attack the Wraith, your blade finding purchase..."
```
→ LLM saw "Attack" in context, may parrot it

**After:**
```
Prompt: (no choices)
LLM writes: "The Wraith lunges. You have a moment to react."
Choices calculated: [Attack, Defend, Flee] ← deterministic from combat FSM
```
→ LLM narration independent, choices append cleanly

**Success Metrics:**
- Zero choice-label fragments in narration (T50 runs)
- Choices still contextually appropriate
- No timing issues in UI (choices load < 200ms after narration)

---

## Recommendation 4: State-Forced Delta Prompts
### Explicit Time-Jump Directives on Loiter

#### Current State

**Location:** `src/game/beatFingerprint.ts` + `situationPacket.ts`

Current loiter detection:
```typescript
// In beatFingerprint.ts
export function countPlayerIntentStreak(state: GameState): IntentStreak {
  // Detects "inspect" x3, "wait" x5, etc.
}

// In situationPacket.ts SNAPSHOT
if (streak.count >= 3) {
  lines.push(
    `- Stagnation: player repeated "${streak.key}" ×${streak.count} — FORCE a concrete interrupt`
  );
}
```

**Problem:** Even with stagnation rail, Flash Lite sees **identical SNAPSHOT** on Wait/Loiter

Example (Wait x3):
```yaml
Turn 10 SNAPSHOT:
- Location: Consul Caravan Camp
- Presence: Vessa, Just, 3-4 guards
- Props: wagons, crates

Turn 11 SNAPSHOT:
- Location: Consul Caravan Camp
- Presence: Vessa, Just, 3-4 guards
- Props: wagons, crates

Turn 12 SNAPSHOT:
- Location: Consul Caravan Camp  
- Presence: Vessa, Just, 3-4 guards
- Props: wagons, crates
```

→ No signal to generate novel content. Flash Lite recycles prior beat.

#### Target State

**Inject Explicit Time-Jump Directive:**

```yaml
Turn 12 SNAPSHOT (after Wait x3):
- Location: Consul Caravan Camp
- TIME JUMP: 10-15 minutes have passed since the player began waiting.
- MANDATORY DELTA: Something MUST have changed. Examples:
  * Guard patrols shifted (new positions, shift change, someone left)
  * NPCs finished their prior activity (Vessa's conversation ended, Just moved)
  * Environmental change (weather, lighting, sounds)
  * New arrival (someone entered the scene)
  * Opportunity window (door left unguarded, distraction occurred)
- Presence: Vessa, Just, 3-4 guards [BUT positions/states MUST differ]
- Props: wagons, crates [BUT describe new detail or angle]

BINDING: Do NOT reprint the prior beat's description. Generate concrete change.
```

**Key Features:**
- Explicit time passage: "10-15 minutes"
- Mandatory delta: "Something MUST have changed"
- Examples of acceptable changes (not prescriptive)
- Binding rail: "Do NOT reprint"

#### Implementation Approach

**Module:** `supabase/functions/_shared/gm/loiterDeltaDirective.ts`

**Core Function:**
```typescript
export function injectLoiterDelta(
  snapshot: string,
  streak: IntentStreak,
  state: GameState
): string {
  if (streak.count < 3) return snapshot;
  if (!isLoiterFamily(streak.key)) return snapshot;
  
  const timeJump = calculateTimeJump(streak.count);
  const deltaDirective = generateDeltaDirective(streak, state);
  
  // Inject after Location line
  const lines = snapshot.split('\n');
  const locationIndex = lines.findIndex(l => l.startsWith('- Location:'));
  
  if (locationIndex >= 0) {
    lines.splice(locationIndex + 1, 0, 
      `- TIME JUMP: ${timeJump} have passed since the player began ${streak.key}.`,
      `- MANDATORY DELTA: ${deltaDirective}`
    );
  }
  
  // Add binding at end
  lines.push('');
  lines.push('BINDING: Do NOT reprint the prior beat\'s description. Generate concrete change.');
  
  return lines.join('\n');
}

function isLoiterFamily(key: string): boolean {
  return [
    'wait', 'loiter', 'inspect', 'look around', 
    'scout', 'listen', 'observe'
  ].includes(key.toLowerCase());
}

function calculateTimeJump(streakCount: number): string {
  if (streakCount >= 5) return '20-30 minutes';
  if (streakCount >= 4) return '15-20 minutes';
  if (streakCount >= 3) return '10-15 minutes';
  return '5-10 minutes';
}

function generateDeltaDirective(
  streak: IntentStreak, 
  state: GameState
): string {
  const examples: string[] = [];
  
  // Presence changes
  if (state.sceneFacts?.present?.length) {
    examples.push(
      'NPCs finished their prior activity (conversation ended, someone moved or left)'
    );
  }
  
  // Guard patrols
  if (state.sceneFacts?.tension !== 'low') {
    examples.push(
      'Guard patrols shifted (new positions, shift change, someone left post)'
    );
  }
  
  // Environmental
  examples.push(
    'Environmental change (weather, lighting, sounds, temperature)'
  );
  
  // Opportunity
  if (state.activeEncounter || state.sceneFacts?.tension === 'high') {
    examples.push(
      'Opportunity window (door left unguarded, distraction occurred)'
    );
  } else {
    examples.push(
      'New arrival (someone entered the scene)'
    );
  }
  
  return `Something MUST have changed during this time. Examples:\n  * ${examples.join('\n  * ')}`;
}
```

**Integration Point:**

In `formatSceneSnapshotForPrompt()`:
```typescript
// Old
const snapshot = formatSceneSnapshotForPrompt(state);

// New
const baseSnapshot = formatSceneSnapshotForPrompt(state);
const streak = countPlayerIntentStreak(state);
const snapshot = injectLoiterDelta(baseSnapshot, streak, state);
```

#### ArcDirector Integration

**Current:** `arcDirector` force-spawns combat on hard stagnation (≥5 loiter)

**Keep:** This is a good backstop. Time-jump directive should prevent reaching ≥5.

**Synergy:**
- Turns 3-4: Time-jump directive forces environmental/NPC change
- Turn 5+: If LLM still loiters, ArcDirector spawns encounter

#### Effort Estimate

**Time:** 1 day

**Breakdown:**
- Half day: Core `loiterDeltaDirective.ts` module
- Half day: Integration + vitest

**Complexity:** Low
- Mostly string injection
- Reuses existing streak detection
- Clear success criteria

#### Dependencies

- `beatFingerprint.ts` (streak detection) - already exists
- SNAPSHOT formatting - already exists

#### Risks

1. **Flash Lite ignores directive** - Still recycles despite TIME JUMP
   - Mitigation: Combine with prior beat hash check in warden
   - If narration ≥0.85 similar to prior, reject + retry once

2. **Forced change feels artificial** - "Suddenly, a bird flew by"
   - Mitigation: Examples guide toward meaningful changes
   - Accept: Some artificiality better than clone

3. **Doesn't address root cause** - Player stuck in loop
   - Mitigation: This is player agency - they chose Wait x3
   - ArcDirector backstop still spawns combat if needed

#### Validation Strategy

**Test Case:** Wait x3 in Consul Caravan Camp

**Before:**
```
T10: "Guards patrol. Vessa talks with Just."
T11: "Guards patrol. Vessa talks with Just." [clone]
T12: "Guards patrol. Vessa talks with Just." [clone]
```

**After:**
```
T10: "Guards patrol. Vessa talks with Just."
T11: TIME JUMP: 10-15 minutes. "The guard patrol shifts. Vessa finishes her conversation."
T12: TIME JUMP: 15-20 minutes. "One guard leaves for a shift change. Just moves to check a wagon."
```

**Success Metrics:**
- Prose similarity <0.70 after time-jump injection (vs baseline 0.85+)
- Zero exact clones on Wait/Loiter x3+
- Environmental/NPC state changes in 80%+ of time-jump beats

---

## Recommendation 5: POV Guardrails
### Explicit Grammatical Rules for Perspective

#### Current State

**Location:** `src/game/proseWarden.ts` `perspectiveWarden()`

Current POV handling:
- Post-hoc scrubbing of "his hands" → "your hands" when PC clause
- React to errors after they occur
- No pre-generation guidance

**Problem:** Flash Lite mixes perspectives freely

**Evidence from general Flash Lite behavior:**
- "Your eyes narrow as his heart pounds" (mixing 2nd/3rd person mid-sentence)
- "The guard watches him approach" (3rd person for PC)
- NPC body parts: "Vessa's eyes harden" (correct) vs "Your eyes widen on Vessa" (wrong - Vessa's eyes, not PC's)

#### Target State

**Explicit POV Block in System Prompt:**

```
=== POINT OF VIEW RULES (STRICT GRAMMAR) ===

1. PLAYER CHARACTER (PC) - SECOND PERSON ONLY:
   - Use "you", "your", "yours" for the player character
   - Example: "You step forward, your hand reaching for the latch."
   - NEVER: "He steps forward" / "She considers her options" / "They move"

2. NON-PLAYER CHARACTERS (NPCs) - THIRD PERSON ONLY:
   - Use "he/him", "she/her", "they/them" for NPCs
   - Example: "Vessa shifts her weight, her eyes tracking your movement."
   - NEVER: "Your companion says" when referring to NPC

3. POSSESSIVE BODY PARTS - MUST MATCH SUBJECT:
   - PC body parts: "your hand", "your eyes", "your breath"
   - NPC body parts: "his face", "her stance", "their weapons"
   - WRONG: "your eyes narrow on her face" when "her eyes" is the subject
   - CORRECT: "her eyes narrow as you approach"

4. MIXED SENTENCES:
   When PC and NPC both act in one sentence:
   - Keep subjects clear: "You step back as he lunges forward."
   - NOT: "Your step back makes him lunge forward" (confusing possession)

5. THIRD-PERSON CAMERA ANGLES - FORBIDDEN:
   Do NOT write: "The scene unfolds", "An observer would see", "He watches him"
   Only valid perspectives: YOU (PC) and named NPCs in third person

EXAMPLES OF CORRECT USAGE:
✓ "You raise your blade. Vessa watches, her hand drifting to her dagger."
✓ "The guard's eyes narrow as you pass, his grip tightening on his spear."
✓ "You steady your breath. Just grunts, his attention elsewhere."

EXAMPLES OF FORBIDDEN USAGE:
✗ "Your eyes narrow as his heart pounds" → Mixing PC/NPC possession
✗ "He steps forward, your guard raised" → Wrong subject for PC
✗ "Vessa's eyes widen on your face" → "Your face" should be "her face" (Vessa's eyes)
=================================================
```

**Key Features:**
- Explicit numbered rules (not prose)
- Concrete examples (✓ correct, ✗ wrong)
- Edge case handling (mixed sentences, body part possession)
- Hard ban on third-person camera angles

#### Implementation Approach

**Module:** `supabase/functions/_shared/gm/povRails.ts`

**Core Function:**
```typescript
export function buildPovRails(state: GameState): string {
  const perspective = state.settings?.perspective ?? 'second';
  
  if (perspective === 'second') {
    return POV_SECOND_PERSON_RAILS;
  } else {
    return POV_THIRD_PERSON_RAILS;
  }
}

const POV_SECOND_PERSON_RAILS = `
=== POINT OF VIEW RULES (STRICT GRAMMAR) ===

1. PLAYER CHARACTER (PC) - SECOND PERSON ONLY:
   - Use "you", "your", "yours" for the player character
   - Example: "You step forward, your hand reaching for the latch."
   - NEVER: "He steps forward" / "She considers her options"

2. NON-PLAYER CHARACTERS (NPCs) - THIRD PERSON ONLY:
   - Use "he/him", "she/her", "they/them" for NPCs
   - Example: "Vessa shifts her weight, her eyes tracking your movement."
   - NEVER: "Your companion" when naming the NPC

3. POSSESSIVE BODY PARTS - MUST MATCH SUBJECT:
   - PC body parts: "your hand", "your eyes", "your breath"
   - NPC body parts: "his face", "her stance", "their weapons"
   - CRITICAL: "your X" only when PC is the subject/actor
   - WRONG: "her eyes narrow, your pupils dilating" → Should be "her pupils"

4. MIXED SENTENCES:
   - "You step back as he lunges forward." ✓
   - "Your movement triggers his lunge." ✗ (confusing possession)

5. NO THIRD-PERSON CAMERA:
   - Do NOT: "The scene unfolds", "An observer would see"

EXAMPLES:
✓ "You raise your blade. Vessa watches, her hand drifting to her dagger."
✗ "Your eyes narrow as his heart pounds" (PC eyes can't see NPC heart internal state)
=================================================
`;

const POV_THIRD_PERSON_RAILS = `
=== POINT OF VIEW RULES (STRICT GRAMMAR) ===

Player character uses third person with their name:
- "Jax steps forward, his hand reaching for the latch."
- Pronouns: "he/him", "she/her", "they/them"

NPCs also use third person:
- "Vessa shifts her weight, her eyes tracking Jax's movement."

Maintain perspective consistency throughout each beat.
=================================================
`;
```

**Integration Point:**

In `formatFullMemoryBlock()` (master prompt assembly):
```typescript
// Add POV rails after Campaign Rails, before Situation
export function formatFullMemoryBlock(state: GameState): string {
  const rails = formatCampaignRails(state);
  const povRails = buildPovRails(state);
  const situation = formatSituationForPrompt(state);
  
  return `
${rails}

${povRails}

${situation}
...
`;
}
```

#### Perspective Warden Enhancement

**Keep:** Existing `perspectiveWarden()` as a safety net

**Enhance:** Add stricter body-part possession check
```typescript
// In proseWarden.ts
function scrubBodyPartPossession(text: string, pcName: string): string {
  // Pattern: "Your X on [NPC name]'s Y"
  // Example: "Your eyes narrow on Vessa's face"
  // Problem: "Your eyes" is correct, but "Vessa's face" implies Vessa's POV
  // Fix: Should be "You meet Vessa's gaze" or "Vessa's eyes narrow"
  
  const npcBodyOnPcPossessive = new RegExp(
    `\\b([A-Z][a-z'-]+)'s\\s+(eyes?|face|hands?|gaze|expression)\\b.*?\\byour\\b`,
    'gi'
  );
  
  return text.replace(npcBodyOnPcPossessive, (match, npcName, bodyPart) => {
    // "Vessa's eyes narrow, your pupils dilating" 
    // → "Vessa's eyes narrow, her gaze fixed on you"
    return match.replace(/your\s+\w+/gi, `their gaze`);
  });
}
```

#### Effort Estimate

**Time:** Half day

**Breakdown:**
- 2 hours: Write `povRails.ts` module + constant strings
- 1 hour: Integration into master prompt
- 1 hour: Vitest + validation

**Complexity:** Low
- Mostly static string insertion
- Clear input/output
- Warden enhancement is optional nice-to-have

#### Dependencies

- Master prompt assembly in `formatFullMemoryBlock()`
- `settings.perspective` (already exists)

#### Risks

1. **Flash Lite ignores rules** - Still mixes POV despite explicit rails
   - Mitigation: Warden catches post-hoc (existing)
   - Measure: Does frequency decrease?

2. **Over-constraining** - Makes prose feel stilted
   - Mitigation: Examples show natural flow is possible
   - Monitor: Gemini vibe scores

3. **Edge cases** - Complex sentences trip up rules
   - Mitigation: Warden handles edge cases
   - Accept: 90% reduction is success

#### Validation Strategy

**Test Case:** Combat scene with NPC ally

**Before (no POV rails):**
```
"Your blade swings wide. His eyes track the movement, your heart pounding."
```
→ Confusing: whose heart? Mixing "your" and "his"

**After (with POV rails):**
```
"You swing your blade wide. His eyes track the movement, his stance shifting."
```
→ Clear: PC actions in second person, NPC in third person

**Success Metrics:**
- POV mixing errors <5% of beats (vs baseline ~15%)
- Zero "your" + NPC body part in same clause
- Zero third-person camera angles ("the scene unfolds")

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Goal:** Core modules without integration

**Tasks:**
1. **Narrative Translator** (Rec 1)
   - Day 1-2: Core module + entity translation
   - Day 3: Location/exit/tension translation
   - Deliverable: `narrativeTranslator.ts` + vitest

2. **Entity CAST Block** (Rec 2)
   - Day 4-5: Core module + CAST formatter
   - Deliverable: `entityCast.ts` + vitest

**Validation:** Unit tests pass, no integration yet

### Phase 2: Integration (Week 2)
**Goal:** Wire Phase 1 modules into GM pipeline

**Tasks:**
3. **Decoupled Choices** (Rec 3)
   - Day 1: Remove choices from `callGm()` prompt
   - Day 2: Post-narration choice calculation
   - Deliverable: `gm-turn` refactor + vitest

4. **POV Guardrails** (Rec 5)
   - Day 3 (half): POV rails module + integration
   - Deliverable: `povRails.ts` + master prompt update

5. **Loiter Delta** (Rec 4)
   - Day 3 (half): Time-jump directive injection
   - Deliverable: `loiterDeltaDirective.ts` + integration

**Validation:** Dev environment GM turns work, no production deploy

### Phase 3: Validation (Week 3)
**Goal:** T50 validation runs + fixes

**Tasks:**
6. **Fate Autoplay T50**
   - Run 4 modes × T50 with new architecture
   - Measure P0s vs baseline (target: <5 total)
   
7. **Bug Fixes**
   - Address any new issues from T50 runs
   - Tune directive wording if needed

8. **Production Deploy**
   - Edge function redeploy (`gm-turn`)
   - Client build if needed

**Validation:** T50 P0 count <5, ready for Gemini scoring

### Phase 4: Gemini Scoring (Week 4)
**Goal:** External validation of story quality

**Tasks:**
9. **Generate Gemini Paste Packs**
   - RPG mode T50 with new architecture
   - Alternative: LitRPG if RPG too clean

10. **Gemini Pro Review**
    - Submit paste pack
    - Await Story / Vibe / Pace scores

11. **Iterate**
    - If Story <5: diagnose which recommendation failed
    - If Story ≥5: SUCCESS, document gains

**Success:** Story score 5-6/10 (vs baseline 1-2/10)

---

## Effort Summary

| Recommendation | Effort | Complexity | Impact | Priority |
|---|---|---|---|---|
| 1. Narrative Translator | 3 days | Medium | High | P0 |
| 2. Entity CAST Block | 2 days | Medium | High | P0 |
| 3. Decoupled Choices | 2 days | Low-Med | Medium | P1 |
| 5. POV Guardrails | 0.5 day | Low | Medium | P2 |
| 4. Loiter Delta | 1 day | Low | Medium | P2 |
| **Total** | **8.5 days** | — | — | — |

**Engineering weeks:** ~2 weeks (with Phase 3 validation)

---

## Risk Assessment

### High-Risk Items

1. **Flash Lite May Not Respond to Directives**
   - **Likelihood:** Medium
   - **Impact:** High (architecture fails to improve scores)
   - **Mitigation:** 
     - Test each recommendation independently
     - Measure incremental gains (don't wait for all 5)
     - Fallback: Keep warden as safety net
     - Consider: Mid tier (Haiku) may respond better

2. **Over-Constraining Prose Quality**
   - **Likelihood:** Low
   - **Impact:** Medium (Story score up but Vibe score down)
   - **Mitigation:**
     - POV rails include natural examples
     - CAST allows anonymous background
     - Narrative translation is enrichment, not reduction

3. **State Sync Issues (Decoupled Choices)**
   - **Likelihood:** Medium
   - **Impact:** Medium (choices nonsensical after narration)
   - **Mitigation:**
     - Comprehensive vitest of post-narration state updates
     - Test combat, item gain, location change, HP changes
     - Fallback: Keep choices in prompt for Mid/High tiers

### Medium-Risk Items

4. **Incomplete UI Label Catalog**
   - **Likelihood:** Medium
   - **Impact:** Low (some labels still leak)
   - **Mitigation:**
     - Allowlist known safe tokens
     - Log unknowns for manual review
     - Iterative expansion of label catalog

5. **Performance Regression**
   - **Likelihood:** Low
   - **Impact:** Low (latency increase)
   - **Mitigation:**
     - Translator is deterministic (no LLM)
     - CAST block is string formatting
     - No async overhead

### Low-Risk Items

6. **Player Confusion (Choices Appear Later)**
   - **Likelihood:** Low
   - **Impact:** Low (UX slightly different)
   - **Mitigation:**
     - Choices still appear < 200ms after narration
     - No perceptible delay
     - May actually improve: narration completes faster

---

## Validation Strategy

### Success Metrics (T50 Validation)

**Target Baseline Comparison:**

| Metric | Batch 02a Baseline | Target (Post-Arch) | Measurement |
|---|---|---|---|
| Story Score (Gemini) | 1-2/10 | 5-6/10 | Gemini Pro review |
| False-arrival P0s | 2-7 per T50 | <2 per T50 | Readability gate |
| Choice-leak P0s | 2-4 per T50 | 0 per T50 | Readability gate |
| Stitch-leak P0s | 0 per T50 | 0 per T50 | Readability gate (maintain) |
| Entity invent (Consul/Heat) | 20+ mentions | 0 mentions | String search |
| POV mixing | ~15% of beats | <5% of beats | Manual review |
| Loiter clones | ~85% similar | <70% similar | Similarity hash |

**Validation Process:**

1. **T50 Runs (4 modes)**
   - LitRPG: hero-awakening
   - D&D: cursed-keep
   - RPG: salt-road-heist
   - PYOA: vesper-glass-cipher

2. **Automated Checks**
   - Readability gate P0 count
   - String search for forbidden tokens (`Consul` as character, `Heat` as person)
   - Similarity hashing for clone detection

3. **Manual Review**
   - Sample 20 random beats per mode
   - Check POV consistency
   - Verify natural prose (not over-constrained)

4. **Gemini Scoring**
   - Submit best mode (likely RPG) to Gemini Pro
   - Await Story / Vibe / Pace scores
   - Compare to baseline

### Red Flags (Abort Criteria)

**Abort deployment if:**
- T50 P0s increase vs baseline (architecture making it worse)
- Choices break entirely (FSM logic corrupted)
- Latency increases >500ms (translator too expensive)
- Prose becomes robotic (over-constraining confirmed)

**Green Light:**
- T50 P0s decrease ≥20% (any improvement is progress)
- Entity invents eliminated (Consul/Heat as characters = 0)
- Gemini Story score ≥4 (even if not hitting 5-6, it's a gain)

---

## Alternative Approaches (Not Recommended)

### Alt 1: Post-Generation LLM Critic

**Concept:** After Flash Lite generates, call a second LLM to critique and repair

**Pros:**
- No pre-generation changes
- Catches errors Flash Lite made

**Cons:**
- 2× latency (two LLM calls)
- 2× cost
- Doesn't fix root cause (context pollution)
- Repair quality depends on second model

**Verdict:** Reject. Gemini Pro explicitly identified **pre-generation** pollution as the issue.

### Alt 2: Fine-Tuned Flash Lite

**Concept:** Fine-tune Flash Lite on SynapticGM-quality output

**Pros:**
- Could learn to ignore UI labels
- No prompt engineering

**Cons:**
- Requires large training corpus (thousands of examples)
- Months of work
- Vendor lock-in (Google-specific)
- Doesn't generalize to other models

**Verdict:** Reject. Too expensive, too slow.

### Alt 3: Prompt Compression Only

**Concept:** Just remove some SNAPSHOT lines to reduce pollution

**Pros:**
- Minimal code change
- Fast to test

**Cons:**
- Doesn't fix entity pollution (Consul still in prompt)
- Doesn't fix choice leaks
- Doesn't address loiter clones
- Gemini explicitly wants natural language translation, not just removal

**Verdict:** Partial. This is Rec 1 (translator), but removal alone is insufficient.

### Alt 4: Switch to Claude Haiku (Mid Tier)

**Concept:** Flash Lite is too weak, use Mid tier for Free

**Pros:**
- Haiku likely responds better to directives
- Cost still reasonable (~2× Flash Lite)

**Cons:**
- Doubles Free cost (may exceed pack budgets)
- Doesn't fix architecture (pollution still exists)
- Band-aid, not a solution

**Verdict:** Consider as fallback if architecture fails on Flash Lite. But test architecture first.

---

## Expected Outcomes

### Optimistic Case
**Story Score:** 6/10  
**P0s:** 1-2 per T50  
**Entity Pollution:** Eliminated  
**POV Mixing:** <3%

**Reasoning:**
- Narrative translation eliminates UI labels
- CAST block prevents entity invention
- Decoupled choices stop label leaks
- Loiter delta forces novelty
- POV rails guide grammar

**Confidence:** 40%

### Realistic Case
**Story Score:** 4-5/10  
**P0s:** 3-5 per T50  
**Entity Pollution:** 80% reduction  
**POV Mixing:** <8%

**Reasoning:**
- Some improvements, but Flash Lite still weak
- Occasional label slips despite CAST
- Loiter delta helps but not perfect
- POV rails guide but not guarantee

**Confidence:** 50%

### Pessimistic Case
**Story Score:** 2-3/10  
**P0s:** 8-10 per T50  
**Entity Pollution:** 50% reduction  
**POV Mixing:** <12%

**Reasoning:**
- Flash Lite ignores most directives
- CAST block too weak
- Translation not natural enough
- Need Mid tier or fine-tuning

**Confidence:** 10%

### If Realistic Case (4-5/10)

**Decision Tree:**

1. **Is 4-5/10 good enough?**
   - Yes → Ship it, move to other priorities
   - No → Proceed to Step 2

2. **What's the bottleneck?**
   - Entity pollution still high → Strengthen CAST binding
   - Choice leaks still present → Harden phase 2 calculation
   - Loiter clones persist → Add similarity-based rejection
   - POV mixing → Enhance warden

3. **Can we hit 5-6/10 with tuning?**
   - Yes → One more iteration (1 week)
   - No → Consider Mid tier for Free

**Recommendation:** Accept 4-5/10 as success. Baseline is 1-2/10, so 2-3× improvement validates architecture.

---

## Next Steps

### Immediate (This Week)

1. **John Approval**
   - Review this design doc
   - Approve recommendation priorities
   - Green-light Week 1 implementation

2. **Prep Work**
   - Set up feature branch: `feat/flash-lite-input-sanitization`
   - Create placeholder modules (empty files)
   - Update vitest config for new modules

### Week 1 (Foundation)

3. **Build Core Modules**
   - `narrativeTranslator.ts`
   - `entityCast.ts`
   - Unit tests for both

4. **Internal Demo**
   - Show translated SNAPSHOT vs current
   - Show CAST block format
   - Get feedback before integration

### Week 2 (Integration)

5. **Wire Into Pipeline**
   - Integrate translator + CAST into `situationPacket.ts`
   - Refactor `gm-turn` for decoupled choices
   - Add POV rails + loiter delta

6. **Dev Testing**
   - Manual play sessions on feature branch
   - Check for regressions

### Week 3 (Validation)

7. **Fate Autoplay T50**
   - 4 modes × T50 runs
   - Readability gate analysis
   - String searches for entity pollution

8. **Bug Fixes**
   - Address any T50 issues
   - Tune directive wording

9. **Deploy**
   - Merge to main
   - Production edge function deploy

### Week 4 (Scoring)

10. **Gemini Review**
    - Generate paste pack (RPG T50)
    - Submit to Gemini Pro
    - Await scores

11. **Decision Point**
    - If Story ≥5: SUCCESS
    - If Story 4: Accept or iterate?
    - If Story ≤3: Diagnose + Mid tier fallback

---

## Appendix A: Code Samples

### Sample: Narrative Translator Output

**Input (Current SNAPSHOT):**
```yaml
- Location: Consul Caravan Camp
- Crowd: small crowd (Consul, Heat)
- Presence: Consul, Heat, Vessa, Just
- Exits: road toward Consul, path to waystation
- Props: wagons, crates, locked crate
- Encounter: none
```

**Output (Translated):**
```
CURRENT SCENE:
The player is standing in a dusty caravan camp operated by the Consul faction. 
The security level is high - approximately 3-4 guards patrol the perimeter with 
heightened alertness. Two named individuals are present: Vessa (a faction contact, 
neutral disposition) and Just (her burly associate, intimidating presence). 

The camp is arranged in a rough circle with several sturdy wagons. A particularly 
well-reinforced wagon sits near the center, secured with an iron-banded lock - this 
is the target. The atmosphere is tense. Obvious exits include a worn road leading 
toward the Salt Road Waystation, and a path back toward town.

The player's objective is to steal a ledger from the locked wagon without being 
caught. The player has basic street clothes and a sealed bag (contents unknown).
```

### Sample: CAST Block Output

**Input (GameState):**
```typescript
{
  sceneFacts: {
    present: ['Consul', 'Heat', 'Vessa', 'Just'],
    crowdCount: 4,
    tension: 'high'
  },
  npcMemories: [
    { npcName: 'Vessa', disposition: 'neutral', role: 'contact' },
    { npcName: 'Just', disposition: 'neutral', role: 'associate' }
  ],
  openingEstablishment: {
    pinnedNpcNames: ['Vessa']
  }
}
```

**Output (CAST Block):**
```xml
<CAST>
This is the complete list of entities physically present in this scene.
ONLY entities explicitly listed below may appear, speak, or act in your narration.
You MUST NOT invent additional people, creatures, or speakers beyond this list.

NAMED CHARACTERS (may speak, act, have agency):
- Vessa (contact, neutral, present since T6) [OPENING PIN - consequential]
- Just (associate, neutral, present since T8)

ANONYMOUS ENTITIES (background only, no individual agency):
- 3-4 Consul faction guards (patrol the camp, high alert)

ACTIVE THREATS:
- None

CONSTRAINTS:
- Do NOT invent "Consul" as a character name - this is a faction label
- Do NOT invent "Heat" as a person - this is a security state variable
- Do NOT invent "a figure", "someone nearby", "a merchant", "another guard"
- Guards are plural background - not individual named characters unless promoted by ledger
- If the player wants to interact with someone new, they must travel or search
</CAST>
```

### Sample: Loiter Delta Injection

**Input (SNAPSHOT after Wait x3):**
```yaml
- Location: Consul Caravan Camp
- Presence: Vessa, Just, 3-4 guards
- Props: wagons, crates
```

**Output (With Delta Directive):**
```yaml
- Location: Consul Caravan Camp
- TIME JUMP: 10-15 minutes have passed since the player began waiting.
- MANDATORY DELTA: Something MUST have changed during this time. Examples:
  * NPCs finished their prior activity (Vessa's conversation ended, Just moved)
  * Guard patrols shifted (new positions, shift change, someone left post)
  * Environmental change (weather, lighting, sounds)
  * Opportunity window (door left unguarded, distraction occurred)
- Presence: Vessa, Just, 3-4 guards [BUT positions/states MUST differ from T10]
- Props: wagons, crates [BUT describe new detail or angle]

BINDING: Do NOT reprint the prior beat's description. Generate concrete change.
```

---

## Appendix B: Vitest Strategy

### Unit Tests

**Module:** `narrativeTranslator.ts`

```typescript
describe('narrativeTranslator', () => {
  test('translates raw entity tokens to natural language', () => {
    const state = mockGameState({
      sceneFacts: {
        present: ['Consul', 'Heat', 'Vessa']
      }
    });
    
    const translated = translatePresence(
      state.sceneFacts?.present,
      state.npcMemories,
      state.activeEncounter
    );
    
    expect(translated).toContain('Named individuals present: Vessa');
    expect(translated).not.toContain('Consul');
    expect(translated).not.toContain('Heat');
    expect(translated).toContain('guards');
  });
  
  test('naturalizes UI label exits', () => {
    const label = 'road toward Consul';
    const result = naturalizeExitLabel(label);
    
    expect(result).not.toContain('Consul');
    expect(result).toContain('road');
  });
});
```

**Module:** `entityCast.ts`

```typescript
describe('entityCast', () => {
  test('builds CAST block with named and anonymous entities', () => {
    const state = mockGameState({
      sceneFacts: { present: ['Vessa', 'Just'], crowdCount: 4 },
      npcMemories: [
        { npcName: 'Vessa', disposition: 'neutral' }
      ]
    });
    
    const cast = buildEntityCast(state);
    
    expect(cast).toContain('<CAST>');
    expect(cast).toContain('NAMED CHARACTERS');
    expect(cast).toContain('- Vessa');
    expect(cast).toContain('ANONYMOUS ENTITIES');
    expect(cast).toContain('guards');
    expect(cast).toContain('CONSTRAINTS');
    expect(cast).toContain('Do NOT invent');
  });
  
  test('marks opening pinned NPCs', () => {
    const state = mockGameState({
      sceneFacts: { present: ['Vessa'] },
      openingEstablishment: { pinnedNpcNames: ['Vessa'] }
    });
    
    const cast = buildEntityCast(state);
    
    expect(cast).toContain('[OPENING PIN - consequential]');
  });
});
```

**Module:** `loiterDeltaDirective.ts`

```typescript
describe('loiterDeltaDirective', () => {
  test('injects time jump on Wait x3', () => {
    const streak = { key: 'wait', count: 3 };
    const snapshot = '- Location: Tavern\n- Presence: Vessa';
    
    const result = injectLoiterDelta(snapshot, streak, mockGameState());
    
    expect(result).toContain('TIME JUMP: 10-15 minutes');
    expect(result).toContain('MANDATORY DELTA');
  });
  
  test('does not inject on streak <3', () => {
    const streak = { key: 'wait', count: 2 };
    const snapshot = '- Location: Tavern';
    
    const result = injectLoiterDelta(snapshot, streak, mockGameState());
    
    expect(result).not.toContain('TIME JUMP');
  });
});
```

### Integration Tests

**Test:** Decoupled Choices
```typescript
describe('gm-turn decoupled choices', () => {
  test('narration generated without seeing choices', async () => {
    const state = mockGameState({ turn: 5 });
    const action = 'Wait and observe';
    
    // Mock callGm to capture prompt
    const promptCapture: string[] = [];
    jest.spyOn(gmModule, 'callGm').mockImplementation(async (opts) => {
      promptCapture.push(opts.situation);
      return 'The guards shift position.';
    });
    
    const result = await gmTurn({ state, action });
    
    // Verify prompt did NOT contain choice labels
    expect(promptCapture[0]).not.toContain('1. Attack');
    expect(promptCapture[0]).not.toContain('2. Flee');
    
    // Verify choices still returned
    expect(result.choices.length).toBeGreaterThan(0);
  });
});
```

### E2E Validation (Fate Autoplay)

**Test:** T50 Run with New Architecture
```bash
# Run RPG T50 with new architecture
npm run fate-autoplay -- --bible salt-road-heist --turns 50 --seed 43

# Check readability gate
cat runs/latest/readabilityGate.json | jq '.pass'  # Should be true
cat runs/latest/readabilityGate.json | jq '.p0Count'  # Should be <5

# Check for forbidden entity pollution
grep -c "Consul steps\|Consul says\|Consul watches" runs/latest/transcript.md
# Should be 0

grep -c "Heat watches\|Heat replies\|Heat moves" runs/latest/transcript.md
# Should be 0
```

---

## Appendix C: Glossary

**Flash Lite:** `google/gemini-2.5-flash-lite` - Free tier LLM model

**Gemini Pro:** Google's evaluation model used to score story quality

**SNAPSHOT:** Current game state block passed to LLM (location, entities, props, etc.)

**CAST Block:** Explicit enumeration of entities physically present

**UI Label:** Internal state variable that leaked into prompt (e.g. `Consul`, `Heat`)

**Entity Pollution:** UI labels treated as character names by LLM

**Context Pollution:** Raw state/JSON treated as canonical lore

**Loiter:** Repeated Wait/Inspect actions with no state change

**Clone:** Beat that reprints prior beat (similarity ≥0.85)

**P0:** Critical readability violation (breaks story continuity)

**T50:** 50-turn validation run (Fate autoplay)

**Batch 02a:** Current production build (2026-09-02a)

**Baseline:** Current story quality before architecture changes (1-2/10)

**Target:** Post-architecture story quality goal (5-6/10)

---

## Document Control

**Version:** 1.0  
**Date:** 2026-09-02  
**Author:** AI Design Agent  
**Reviewer:** John (pending)  
**Status:** Draft - Awaiting Approval

**Change Log:**
- 2026-09-02: Initial draft based on Gemini Pro feedback
- (Future changes tracked here)

**Next Review:** After Week 1 implementation (internal demo)

---

## Sign-Off

**Engineering Approval:** _____________ (Date: ______)  
**Product Approval:** _____________ (Date: ______)  
**Deploy Authorization:** _____________ (Date: ______)

---

*End of Document*
