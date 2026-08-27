# Complete Warden System Checklist
## What the Warden Watches, Checks, and Repairs

**Date**: 2026-08-24  
**Build**: 2026-08-24j  
**Status**: Production System Reference

---

## Overview

The Warden is a 6-layer validation system that ensures AI-generated narrative stays consistent with established game state. It runs on **every GM turn** before the player sees the response.

### The 6 Layers

1. **Pre-GM Authority** (situationPacket → AI) - What the AI MUST follow
2. **Prose Warden** (post-GM regex) - English fixes + pattern scrubbing  
3. **Event Warden** (structured tags) - Block impossible events
4. **Fact Locks** (hard constraints) - Binding rules that can trigger retry
5. **Scene Manifest** (authority roster) - Who/what can be named
6. **Claim Grounding** (proper nouns) - Invented entities → role slots

---

## Layer 1: Pre-GM Authority
### Files: `situationPacket.ts`, `masterPrompt.ts`, `fluidProseRails.ts`

These are **preventive** - sent to the AI before generation to guide behavior.

### SCENE STATE Block (Binding Rails)

**What it includes**:
- Location name
- Crowd Size: `none` / `Small (~5 people)` / `Modest (~12 people)` / `Large (20+)`
- Time of Day: `dawn` / `morning` / `midday` / `afternoon` / `dusk` / `evening` / `night`
- Weather: `clear` / `rain` / `storm` / `snow` / `fog` / `cloudy`
- Location Type: `indoors` / `outdoors`
- Tension: `calm` / `tense` / `danger` / `combat`
- Crowd Presence: `present` / `none`
- Noise: `quiet` / `voices` / `shouting`

**Binding Rules Sent**:
```
BINDING: Do not invent large crowds (50+, 100+) when Crowd Size is Small.
BINDING: Do not write "hours later" unless time of day actually advanced.
BINDING: Do not write "you step outside" if Location Type is indoors.
BINDING: Do not write "danger passes" if Tension is still danger/combat.
BINDING: If Crowd is present, people are still here — do not write empty/silent street.
```

### SCENE MANIFEST (Authority List)

**What it includes**:
- Roster: All named characters who may be present
- Visible Kit: Equipped items player is wearing
- Exits: Doors/paths available from here
- Threats: Active enemies with HP
- Props: Interactable objects
- Active Talk: Unresolved dialogue/questions

**Authority Rule**:
```
Do not introduce a new named person, place, faction, or major item unless:
- The player named it this turn
- The campaign bible allows it
- An Introduction Permit applies (player typed the name)
- Atmosphere and unnamed roles ("a clerk", "someone in the crowd") are fine
```

### ALONE ARRIVAL Authority

**When**: `openingEstablishment.aloneArrival === true`

**Binding Rule**:
```
ALONE ARRIVAL (BINDING): Player arrived alone into an empty ruin.
Crowd is none. Do NOT invent:
- People who saw them arrive
- Handlers, bystanders, voices outside
- A gathered handful watching through damage
Physical presence stays empty until the ledger establishes someone.
```

### EXPLORE AUTHORITY (Interior Maps)

**When**: Inside a dungeon with mapped floor plan

**Binding Rules**:
```
EXPLORE AUTHORITY: This is a multi-room interior floor plan.
- THIS room is [Room Name]
- Exits: [door→Adjacent Room, stairs→Upper Floor]
- BINDING: Do not write "one open room" or "no doors" when exits exist
- BINDING: Do not invent exits not on the graph
- Look-around must describe THIS room only, not "each room" summary
```

---

## Layer 2: Prose Warden (Post-GM Regex Fixes)
### File: `proseWarden.ts`

These run **after** the AI generates text, before showing to player. All are regex-based pattern matching.

### 1. Name Placeholder Scrubbing

**Purpose**: Fix placeholder names that leaked from internal processing

#### `scrubFigurePlaceholder(text, alone)`
- **Catches**: `"the a figure"`, `"glowing a figure"`, `"You carry the a figure"`
- **Fixes**: → `"the official"` (not alone) or `"the panel"` (alone)
- **Why**: "a figure" was default invented-name replacement, leaked as proper noun

#### `scrubSomeoneNearbyPlaceholder(text, alone)`
- **Catches**: `"someone nearby does"`, `"someone nearby's"`
- **Fixes**: → `"the official does"` / `"the official's"` (or panel if alone)
- **Why**: Soft name-slot must not act as dialogue subject

#### `scrubSpeakerPlaceholder(text, alone)`
- **Catches**: `"the speaker"`, `"gapes open the speaker"`, `"Name: the speaker"`
- **Fixes**: → `"the panel"` (alone) or strips/replaces appropriately
- **Why**: System chrome leaked into narrative

### 2. UI Leak Scrubbing

#### `scrubUiQuestVerbs(text, alone)`
- **Catches**: `"unlock someone"`, `"unlock the quest"`, `"quest unlocked"`
- **Fixes**: → `"look to the official"`, `"take the next step"`, `"a task comes into focus"`
- **Why**: UI/journal verbs must not be spoken in-world

### 3. Consistency Validation (Pack 12 Extended)

#### `scrubInventedCrowdSize(text, crowdSize, crowdPresent)`
- **Catches**:
  - Large numbers when tracked size is small: `"hundred people"`, `"fifty onlookers"`, `"dozens of figures"`
  - Empty claims when crowd is present: `"The square is empty"`, `"no one"`, `"no crowd"`, `"no voices"`
- **Fixes**:
  - Large → `"a few people"` (≤3) or `"several people"` (4-8)
  - Empty → `"a few people still"`, `"quiet voices"`, `"a handful of people in the [area]"`
- **Why**: AI invents crowd size contradicting tracked presence
- **NEW in 24j**: Now catches contradictory empty/no-crowd claims

#### `scrubInventedTimeSkip(text, currentTime, prevTime)`
- **Catches**: `"hours later"`, `"next morning"`, `"that evening"`, `"by nightfall"`
- **Fixes**: → `"moments later"` (unless time of day actually changed)
- **Why**: AI invents time passing without clock advancement
- **Check**: Only scrubs if `currentTime === prevTime`

#### `scrubInventedLocationChange(text, isIndoor, wasIndoor)`
- **Catches**:
  - `"you step outside"` when still indoors
  - `"you enter the building"` when still outdoors
- **Fixes**: → `"you move forward"` / `"you continue"`
- **Why**: AI invents location transitions without map movement
- **Check**: Only scrubs if indoor/outdoor status unchanged

#### `scrubInventedTensionChange(text, currentTension, prevTension)`
- **Catches**:
  - `"danger passes"`, `"calm settles"` when tension is still high
  - `"danger emerges"`, `"threat looms"` when tension is still calm
- **Fixes**: → `"the moment holds"` / `"something shifts"`
- **Why**: AI invents tension changes without actual events
- **Check**: Only scrubs if tension level unchanged

### 4. Location Issues

#### `scrubLocationTautology(text, currentLocation)`
- **Catches**: `"nearby building"` / `"nearby place"` used as the current room
- **Fixes**: Strips "nearby" when already at a named interior (cathedral, circle, court)
- **Why**: "Nearby" is for things that are NOT here

#### `scrubAnthropomorphizedLocation(text)`
- **Catches**: `"The hall answers your question"`, `"The room responds"`
- **Fixes**: → `"The hall reveals"`, `"The room is clear"`
- **Why**: Locations are places, not speakers
- **NEW in 24e**: Added to catch semantic location-as-agent errors

#### `scrubInteriorOneRoomLie(text, hasMappedDoorExits, adjacentRoomNames)`
- **Catches**: `"only one open room"`, `"no doors intact"`, `"only a gap in the wall"`
- **Fixes**: Adds bridge text: `"Doorways still link this floor to [Adjacent Rooms]"`
- **Why**: AI ignores mapped floor plan, claims one-room when graph has exits
- **Check**: Only runs when `hasMappedDoorExits === true`

### 5. Alone Arrival Crowd Invents

#### `scrubInventedAlonePresence(text, alone)`
- **Catches**: `"you're not alone"`, `"people have gathered"`, `"ones who saw you arrive"`, `"watching through"`, `"bystanders"`, `"handlers"`, `"voices outside"`
- **Fixes**: Drops sentences containing crowd invents; fallback: `"Nothing moves. Only your own footprints disturb the dust."`
- **Why**: Alone arrival = empty ruin, no watchers
- **Check**: Only runs when `alone === true`

### 6. Filler / Premature Content

#### `scrubPrematureSecrets(text)`
- **Catches**: `"gives up its secrets slowly"`, `"reveals its secrets reluctantly"`
- **Fixes**: Strips the phrase
- **Why**: Empty first look should be sensory-only, not meta framing

### 7. English / Grammar Issues

#### `scrubArticleCollisions(text)`
- **Catches**: `"the a"`, `"the an"`, `"a the"`, `"the the"`, `"a an"`
- **Fixes**: Collapses to single correct article
- **Why**: Name scrubs sometimes stack articles

#### `scrubSpokenQuoteStart(text)`
- **Catches**: `"sentence." "next sentence starts lowercase"`
- **Fixes**: Capitalizes first word after closing quote
- **Why**: Grammar rule after sentence-ending punctuation + quote

### 8. Grammar Quality (Pack 13, High Tier Only)

#### `applyProseWardenAsync(text, ctx)` with `enableGrammarCheck: true`
- **Uses**: LanguageTool API (~2000+ error patterns)
- **Catches**: Spelling, grammar, punctuation, style issues
- **Speed**: ~50-100ms async check
- **When**: Only High tier (`capacityTier === 'high'`)
- **Fallback**: Silent failure → returns regex-fixed version
- **Why**: Automatic English quality without maintaining regex rules

---

## Layer 3: Event Warden (Structured Tags)
### File: `warden.ts` → `runWarden()`

These validate **structured events** (XML tags) before they mutate game state.

### Event Validation Rules

#### 1. Item Use (`<item-use>`)
- **Check**: Item name must be in `state.inventory`
- **Block**: If not found
- **Message**: `"Action failed: item not in inventory."`

#### 2. Item Gain (`<item-gain>`)
- **Check**: Item name must not be empty
- **Check**: Rarity must match seeded dungeon loot table
- **Check**: High-tier items (legendary/mythic) blocked at low level (< 8)
- **Check**: Epic items blocked at very low level (< 5)
- **Check**: Peaceful intents (observe/talk) cannot spontaneously invent weapons/loot
- **Block**: If any check fails
- **Defer**: Loot on peaceful intents → proposed (not auto-applied)

#### 3. Damage (`<damage>`)
- **Check**: Amount must be > 0
- **Check**: Combat context required (activeEncounter OR enemy-appear OR attack intent)
- **Check**: Peaceful intents need narrated harm to allow damage
- **Check**: Damage without narrated harm needs established foe
- **Block**: If any check fails

#### 4. Heal (`<heal>`)
- **Check**: Amount must be > 0
- **Block**: If not positive

#### 5. Enemy Appear (`<enemy-appear>`)
- **Check**: Must have `enemyName` (not empty)
- **Check**: Spontaneous appear on observe/talk requires threat cues in narrative
- **Block**: Sudden enemy on peaceful intent without `"creature|enemy|beast|monster|hostile|threat|ambush|attack"` in text

#### 6. Quest Update/Complete (`<quest-update>`, `<quest-complete>`)
- **Check**: Quest `id` must exist in `state.quests`
- **Block**: If quest not found

#### 7. Lore Card / Quest Add (`<lore-card>`, `<quest-add>`)
- **Defer**: These are always deferred into proposal (write-path)
- **Why**: New facts need player confirmation
- **Note**: They still apply on Accept

### Narrative Claim Validation

#### Unsupported Item Claims
- **Check**: Narrative mentions items not in inventory
- **Note**: Flags violation but doesn't block turn
- **Example**: `"you draw your sword"` when no sword exists

#### Ungrounded Named Claims
- **Check**: Prose names major entities not in sheets/timeline
- **Filter**: Dragons, liches, demons, artifacts, relics, portals, kingdoms, empires
- **Filter**: Multi-word proper nouns not on manifest roster
- **Note**: Flags for review, doesn't block
- **Example**: `"The Iron Legion approaches"` when no Iron Legion in bible

### Magic Attempt with 0 MP
- **Check**: Player input contains `"cast|channel|expend"` + `"spell|magic|mana"`
- **Check**: `character.mp <= 0`
- **Message**: `"Action failed: insufficient mana."`

---

## Layer 4: Fact Locks (Hard Constraints)
### File: `factLocks.ts`

These are **binding rules** that can trigger a continuity break and force retry.

### 1. Clock Skips (`kind: 'clock'`)
- **Rule**: Do not write `"hours ago"`, `"hours later"`, `"next day"`, `"weeks later"`
- **Check**: `clockAllowsSkip(state)` - false if turn < 8 or day < 0.4 or week < 1
- **Why**: Opening morning is locked — no time jumps on early turns
- **Severity**: **BINDING** - triggers retry

### 2. Silence vs. Shouting (`kind: 'silence'`)
- **Rule**: Do not write `"eerie silence"`, `"unnervingly quiet"` when crowd is shouting
- **Check**: `sceneFacts.noise === 'shouting'` OR narrative has `"shouting|screaming|yelling"`
- **Why**: Can't be silent and loud simultaneously
- **Severity**: **BINDING** - triggers retry

### 3. Empty Street vs. Crowd (`kind: 'silence'`)
- **Rule**: Do not write `"empty street"`, `"no one here"` when crowd is present
- **Check**: `sceneFacts.crowd === 'present'` AND narrative lacks crowd words
- **Why**: People don't vanish without time passing
- **Severity**: **BINDING** - triggers retry

### 4. Kit Pat / Allotment Items (`kind: 'kit'`)
- **Rule**: Do not pat pockets or name `"Health Vial"` / `"Mana Crystal"` unless player asked
- **Check**: Narrative has `"patting pockets"` / `"confirming presence"` / `"Minor Health Vial"`
- **Check**: Player input doesn't have `"pocket|inventory|what do i carry"`
- **Why**: Inventory recap is meta unless requested
- **Severity**: **WARNING** - scrubs sentence, doesn't retry

### 5. Continuity Stubs (`kind: 'stub'`)
- **Rule**: Do not replace turn with `"the last beat holds"` / `"people still here"` stub
- **Check**: Narrative has stub markers AND length < 280 chars
- **Why**: Must answer player action, not emit continuity placeholder
- **Severity**: **BINDING** - triggers retry

### 6. Refusal as Clothing (`kind: 'kit'`)
- **Rule**: `"why should I tell you"` / `"none of your business"` is not a clothing name
- **Check**: Narrative has refusal + clothing context
- **Why**: Player protest must not be stored as appearance
- **Severity**: **WARNING** - converts to default `"everyday street clothes"`

### 7. Invented Sword (`kind: 'weapon'`)
- **Rule**: Do not write `"sword"` / `"longsword"` / `"broadsword"` if no sword in inventory
- **Check**: Narrative mentions sword, inventory lacks `"sword"`
- **Why**: Must narrate the real weapon name only
- **Severity**: **WARNING** - scrubs sentence

### 8. Dungeon Cleared (`kind: 'cleared'`)
- **Rule**: Do not write `"dungeon has been cleared"` / `"no threats remain"` if mobs alive
- **Check**: `remainingDungeonMobs(state).alive > 0`
- **Why**: Locked map still has enemies on graph
- **Severity**: **BINDING** - triggers retry

### Fact Lock Rewrite Logic

When a fact lock violation is detected:
1. **Detect**: `detectFactLockViolations()` finds all violations
2. **Classify**: Return `FactLockViolation[]` with `kind` + `reason`
3. **Apply**: `applyFactLocks()` scrubs offending sentences
4. **Retry Block**: If violations exist, `buildFactLockRetryBlock()` creates binding correction prompt
5. **Continuity Break**: Caller decides whether to retry with correction or apply scrubbed version

---

## Layer 5: Scene Manifest (Authority List)
### File: `sceneManifest.ts`

This is the **reserved roster** of who/what can be named in the current scene.

### What Gets Compiled

#### Roster (Who May Be Named)
- Player character name
- `sceneFacts.present` entities (bystanders, handlers, blue panel)
- Companions
- Recent NPCs (last seen within 8 turns)
- Active encounter enemy
- **Alone rule**: If `aloneArrival === true`, roster is player + blue panel only

#### Visible Kit
- Equipped items (up to 12)
- Fallback: First 8 inventory items if nothing equipped

#### Exits
- `locationSheet.exits` labels
- Interior map: `door→Adjacent Room`, `stairs→Upper Floor`

#### Threats
- Active encounter: `[Enemy Name] HP [current]/[max]`

#### Props / Interactables
- `sceneFacts.props` (blue panel, cracked street)
- `locationSheet.interactables` (not gone/taken)

#### Active Talk
- Unresolved consequences (open questions, promises)
- Archived pins with speech/ask/promise/open context

### Manifest Authority Rules

**Sent to AI**:
```
=== SCENE MANIFEST (AUTHORITY — reserved; do not invent outside this list) ===
Roster (who may be named as present): [Player, handlers, blue panel]
Visible kit (player): [everyday street clothes, phone, pocket knife]
Exits: [corridor→Great Hall, door→Side Chamber]
Threats: [none]
Props / interactables: [blue panel, cracked floor]
Active talk / open asks: [Where am I?, What is this blue panel?]
Crowd: present | Noise: voices
Last beat: People are present; handlers dealing with arrival.

RULES: Do not introduce a new named person, place, faction, or major item unless:
- The player named it this turn
- The campaign bible allows it
- An Introduction Permit applies
Atmosphere and unnamed roles ("a clerk", "someone in the crowd") are fine.
Do not empty a present crowd without narrating time passing.
```

### Manifest Invention Detection

**Function**: `findManifestInventions(narrative, state, playerText)`

**Logic**:
1. Parse all Title-Case multi-word names in narrative (e.g., `"Iron Legion"`, `"Vault of Echoes"`)
2. Check against manifest roster + place + props + kit
3. Check against campaign bible blob (character bio, NPCs)
4. Check Introduction Permit (player typed the name this turn)
5. Filter out common stopwords (`"The"`, `"A"`, `"System"`, etc.)
6. Require 2+ tokens to count as proper noun
7. Return list of inventions (not on manifest, not permitted)

**When Used**: Only when `continuityStrict()` is true

**Severity**:
- 0-1 inventions: **WARNING** (note only)
- 2+ inventions: **BINDING** - triggers continuity break + retry

---

## Layer 6: Claim Grounding (Proper Nouns)
### File: `narrativeScrub.ts` → `scrubInventedProperNouns()`

This is **name-grounding** - invented proper nouns are replaced with role slots.

### What Gets Grounded

**Proper Noun Pattern**:
- Title-Case multi-word names (e.g., `"Lady Ashwood"`, `"The Iron Pact"`)
- Not in manifest roster
- Not in campaign bible
- No Introduction Permit

**Replacement Logic**:
1. **Person**: → `"the official"` / `"someone in the scene"` / `"a figure"`
2. **Place**: → `"nearby"` / `"this place"` / keep if single-word descriptor
3. **Faction**: → `"a group"` / `"them"`
4. **Item**: → `"the [item]"` / descriptive noun

**Example**:
```
Before: "Lady Ashwood approaches with the Iron Pact banner."
After: "The official approaches with the banner."
```

**Why**: AI invents names not established in sheets; generic roles preserve meaning

### Claim Grounding Process

1. **Find Proper Nouns**: Regex match Title-Case 2+ word sequences
2. **Check Manifest**: Is it on roster / place / props?
3. **Check Bible**: Is it in character bio / NPCs / premise?
4. **Check Introduction Permit**: Did player type it this turn?
5. **Replace**: Invent → role slot
6. **Log**: `notes.push("Claim-ground scrub: [Name]")`

**Note**: This is **soft grounding** - meaning-preserving, not a hard block

---

## Warden Execution Order

When a GM turn completes, the warden runs in this exact order:

### 1. Event Validation (`runWarden()`)
- Block impossible events (items not in inventory, damage without combat, etc.)
- Defer lore/quest adds to proposal
- Flag unsupported item/entity claims

### 2. Claim Grounding (`scrubInventedProperNouns()`)
- Replace invented proper nouns with role slots
- Log stripped names

### 3. Prose Warden (`applyProseWarden()` or `applyProseWardenAsync()`)
- Apply all 12 regex scrub rules (name placeholders, location issues, consistency checks)
- Optionally apply LanguageTool grammar check (High tier only)

### 4. Manifest Invention Check (`findManifestInventions()`)
- If `continuityStrict()`: Find remaining proper nouns not on manifest
- If 2+ inventions: Mark as continuity break

### 5. Fact Lock Detection (`detectFactLockViolations()`)
- Check all binding rules (clock, silence, crowd, kit, sword, cleared)
- Return violations list

### 6. Fact Lock Application (`applyFactLocks()`)
- Scrub sentences that violate fact locks
- Sanitize system blocks (refusal → default clothing)

### 7. Scene Contradiction (`detectSceneContradiction()`)
- Check if crowd was present but prose emptied street
- Check if shouting but prose claimed silence

### 8. Final Decision
- If **continuity break** detected: Caller may retry with correction prompt
- If **no break**: Apply scrubbed narrative
- Return `WardenResult` with events, notes, systemLog, deferredEvents, continuityBreak, scrubbedNarrative

---

## What the Warden Cannot Catch (Yet)

### Semantic Issues Requiring NLP/LLM
- **Personality shifts**: NPC kind → cruel without reason (needs personality ledger)
- **Complex time logic**: `"by the time you arrive"` without checking actual timeline
- **Causal chains**: `"because of what happened yesterday"` when yesterday didn't happen
- **Emotional tone**: Suddenly grim prose after light banter (needs tone tracking)

### Why Not a Second LLM Critic?
- **Cost**: 2x API calls = 2x expense
- **Latency**: +500-1500ms = bad UX
- **Reliability**: Second LLM can disagree with first, causing loops
- **Better Approach**: More structured state + better pre-GM rails

### Future Improvements
1. **Personality Ledger**: Track NPC mood/stance per interaction (Priority 3)
2. **Time Ledger**: Track world clock + parse time references (Priority 3)
3. **Causal Chain Validator**: Check `"because"` / `"after"` claims against timeline (Phase 3)
4. **Retry with Preventive Rail**: If severe error, retry with added constraint (Priority 5)

---

## Summary: What Each Layer Does

| Layer | When | Purpose | Method | Block? |
|-------|------|---------|--------|--------|
| **Pre-GM Authority** | Before generation | Tell AI what MUST be followed | Prompt engineering | ✅ Preventive |
| **Prose Warden** | After generation | Fix English + known patterns | Regex scrubbing | ❌ Repairs only |
| **Event Warden** | After generation | Block impossible events | Structured validation | ✅ Blocks events |
| **Fact Locks** | After generation | Enforce binding rules | Pattern matching | ✅ Triggers retry |
| **Scene Manifest** | After generation | Catch invented entities | Title-Case matching | ✅ Continuity break |
| **Claim Grounding** | After generation | Replace invents with roles | Name-entity replacement | ❌ Soft ground |

---

## Quick Reference: When Does Warden Block vs. Fix?

### ✅ Hard Block (Event Rejected)
- Item use when not in inventory
- Damage without combat context
- Enemy appear on peaceful intent without threat cues
- Quest update for non-existent quest ID
- Non-positive heal/damage amounts

### 🔄 Continuity Break (Retry Offered)
- Fact lock violations (2+ violations)
- Scene manifest inventions (2+ new proper nouns)
- Clock skip on turn 1
- Silence claim when shouting
- Empty street when crowd present
- Dungeon cleared when mobs alive

### 🔧 Soft Fix (Scrub Applied)
- Name placeholder leaks (`"a figure"` → `"the official"`)
- UI verb leaks (`"unlock quest"` → `"take next step"`)
- Article collisions (`"the a"` → `"the"`)
- Location tautology (`"nearby building"` → stripped)
- Invented crowd size (`"hundred people"` → `"several people"`)
- Time skip (`"hours later"` → `"moments later"` if time unchanged)
- Anthropomorphized location (`"hall answers"` → `"hall reveals"`)

### ⚠️ Warning Only (Logged, Not Fixed)
- Narrative mentions missing item (doesn't block prose)
- Prose invents major entity (logged for review)
- Player claims missing item (noted in systemLog)

---

## How to Use This Document

**For Diagnosing Issues**:
1. Find the issue category (crowd, time, location, etc.)
2. Check which layer should catch it
3. Verify the pattern is in that layer's regex/logic

**For Adding New Rules**:
1. Decide: Pre-GM (preventive) or Post-GM (repair)?
2. Decide: Hard block or soft fix?
3. Add to appropriate layer
4. Sync edge function if server-side

**For Understanding Why Something Passed**:
- If warden didn't catch it: Pattern not in any layer's rules
- If warden caught but didn't fix well: Regex too broad/narrow
- If AI ignored pre-GM rail: Model quality issue (upgrade tier)

---

**Next Steps**: Review this checklist against your latest playtest issues to identify gaps.
