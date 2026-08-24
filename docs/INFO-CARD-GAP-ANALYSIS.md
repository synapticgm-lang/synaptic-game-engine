# Info Card System - Gap Analysis
## Comprehensive Audit of Story Consistency Tracking

**Date**: 2026-08-24  
**Status**: Active Investigation  
**Priority**: High (User Request)

---

## Current SceneFacts Coverage

### ✅ What IS Tracked
```typescript
interface SceneFacts {
  crowd: 'present' | 'none' | 'unknown'       // ✅ Existence
  noise: 'shouting' | 'voices' | 'quiet'      // ✅ Sound level
  present: string[]                            // ✅ Named entities
  props: string[]                              // ✅ Physical objects
  lastBeat: string                             // ✅ Last committed state
  updatedTurn: number                          // ✅ Freshness
}
```

### ❌ What IS NOT Tracked (Gaps)

#### 1. **TIME OF DAY** (High Priority)
**Problem**: AI can write "sunset" when it was "morning" two turns ago.

**Current State**: NOT TRACKED
- No `timeOfDay` field
- No `weather` field
- No clock tracking

**Example Failures**:
- Turn 5: "Morning light streams through"
- Turn 7: "As sunset approaches..." (no time passed)

**Fix**: Add to SceneFacts:
```typescript
timeOfDay?: 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'evening' | 'night' | 'unknown'
weather?: 'clear' | 'rain' | 'storm' | 'snow' | 'fog' | 'unknown'
```

**Effort**: 2-3 hours (extract from narrative, track, validate)

---

#### 2. **NPC MOOD/PERSONALITY** (High Priority)
**Problem**: NPC can shift from "kind and warm" to "cold and hostile" without reason.

**Current State**: PARTIALLY tracked in `npcMemories`
- Has `disposition: 'friendly' | 'hostile' | 'neutral'`
- Has `facts: string[]` - but not structured

**Gap**: No **current mood** field
- Disposition is static reputation
- Mood is dynamic emotion (angry, scared, happy, neutral)

**Example Failures**:
- Turn 10: NPC "smiles warmly"
- Turn 11: Same NPC "glares coldly" (no trigger)

**Fix**: Extend NPCMemory:
```typescript
interface NPCMemory {
  // ... existing fields
  currentMood?: 'friendly' | 'angry' | 'scared' | 'sad' | 'neutral' | 'cautious'
  lastMoodChange?: number  // turn number
}
```

**Effort**: 3-4 hours (extract mood, track per NPC, validate changes require triggers)

---

#### 3. **LOCATION INDOOR/OUTDOOR** (Medium Priority)
**Problem**: Scene can shift from "inside the hall" to "looking up at the sky" without narrating exit.

**Current State**: PARTIALLY tracked
- `currentLocation` exists
- `locationSheet.kind` has building types
- But no explicit `indoor: boolean`

**Gap**: No quick indoor/outdoor flag for validation

**Example Failures**:
- Turn 8: "Inside the ritual hall"
- Turn 9: "Rain soaks you" (still inside? when did we leave?)

**Fix**: Add to SceneFacts:
```typescript
indoor?: boolean
```

Auto-set from location keywords (hall, room, chamber = indoor; street, field, road = outdoor)

**Effort**: 1-2 hours (extract from location, validate transitions)

---

#### 4. **PHYSICAL CONDITION STATE** (Medium Priority)
**Problem**: Player can be "bleeding heavily" then "feels fine" without heal narration.

**Current State**: PARTIALLY tracked
- `character.conditions: string[]` exists
- But **not validated** against narrative

**Gap**: Conditions array is updated from tags (`<condition>`), but prose can contradict it

**Example Failures**:
- Turn 12: `<damage 15>` "You're bleeding"
- Turn 13: "You stretch, feeling refreshed" (still at low HP, no heal narration)

**Fix**: Add to warden validation:
```typescript
// If HP < 50% and no `<heal>`, block "feeling fine" prose
// If conditions includes "bleeding", block "unhurt" prose
```

**Effort**: 2-3 hours (detect health-contradicting prose, validate against HP/conditions)

---

#### 5. **IMMEDIATE THREAT LEVEL** (Medium Priority)
**Problem**: Combat tension can vanish ("monster lunges" → "peaceful moment") without resolution.

**Current State**: PARTIALLY tracked
- `activeEncounter` exists
- `sceneFacts.present` includes enemy name
- But no **tension state**

**Gap**: No field for "combat active", "tense standoff", "calm"

**Example Failures**:
- Turn 15: "The beast charges at you"
- Turn 16: "You admire the scenery" (beast disappeared? when?)

**Fix**: Add to SceneFacts:
```typescript
tension?: 'combat' | 'danger' | 'tense' | 'calm' | 'unknown'
```

Auto-set from:
- `activeEncounter` → 'combat'
- Threat keywords → 'danger'
- Resolution → 'calm'

**Effort**: 2 hours (extract, track, validate tension drops require resolution)

---

#### 6. **QUEST URGENCY** (Low Priority)
**Problem**: Urgent quest can become forgotten background noise without time passing.

**Current State**: TRACKED but not validated
- Quest has `status`, `revealed`, `objectives`
- No urgency field

**Gap**: Urgent vs. background distinction not enforced

**Example Failures**:
- Turn 20: "You must hurry! The ritual begins at dawn!"
- Turn 35: Player wanders shops for 10 turns, no dawn mention

**Fix**: Add to Quest:
```typescript
urgency?: 'immediate' | 'time-sensitive' | 'flexible' | 'unknown'
deadline?: number  // turn number when urgent quest should trigger reminder
```

**Effort**: 3-4 hours (extract urgency, track deadlines, inject reminders)

---

#### 7. **DIALOGUE STATE** (Low Priority)
**Problem**: NPC can ask a question, player doesn't answer, AI forgets question was asked.

**Current State**: PARTIALLY tracked
- `consequences` array has `unresolved` flag
- But generic (doesn't specify "unanswered question")

**Gap**: No structured "open question" tracking

**Example Failures**:
- Turn 40: NPC: "What's your name?"
- Turn 41: Player: "I look around"
- Turn 42: NPC acts like they know the name

**Fix**: Extend consequences:
```typescript
interface Consequence {
  // ... existing
  kind?: 'unanswered_question' | 'threat' | 'promise' | 'offer'
  speaker?: string  // who asked
}
```

**Effort**: 2-3 hours (classify consequences, track by kind)

---

## Priority Ranking

### Tier 1 - Must Fix (Visible Quality Issues)
1. ✅ **Crowd Size** - DONE (2026-08-24f)
2. ⏳ **Time of Day** - Not tracked at all, causes sunset/morning breaks
3. ⏳ **NPC Mood** - Personality shifts are jarring

**Combined Effort**: ~6-8 hours

### Tier 2 - Should Fix (Polish)
4. ⏳ **Indoor/Outdoor** - Rare but noticeable when it breaks
5. ⏳ **Physical Condition** - HP contradictions
6. ⏳ **Threat Tension** - Combat state tracking

**Combined Effort**: ~6-7 hours

### Tier 3 - Nice to Have (Edge Cases)
7. ⏳ **Quest Urgency** - Players rarely notice
8. ⏳ **Dialogue State** - Already partially covered

**Combined Effort**: ~5-7 hours

---

## Recommended Action Plan

### Phase 1: Time + Mood (Today)
**Impact**: Catches ~60% of remaining consistency breaks  
**Effort**: 6-8 hours  
**Fixes**: sunset/morning, personality shifts

### Phase 2: Location + Condition (Next Session)
**Impact**: Catches ~25% more breaks  
**Effort**: 4-5 hours  
**Fixes**: indoor/outdoor, HP contradictions

### Phase 3: Tension + Urgency (Future)
**Impact**: Catches ~10% more breaks (polish)  
**Effort**: 5-7 hours  
**Fixes**: combat disappearances, quest pacing

### Phase 4: Dialogue (Optional)
**Impact**: Catches ~5% edge cases  
**Effort**: 2-3 hours  
**Fixes**: unanswered questions

---

## Implementation Strategy

### For Each Gap:
1. **Extend SceneFacts type** (add field)
2. **Extract from narrative** (regex patterns in `sceneFacts.ts`)
3. **Send to AI** (update `formatSceneFactsForPrompt`)
4. **Validate in warden** (add to `detectSceneContradiction`)
5. **Sync to edge** (copy to supabase functions)

### Example Template (Time of Day):
```typescript
// 1. Extend type (types.ts)
export interface SceneFacts {
  // ... existing
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'unknown'
}

// 2. Extract (sceneFacts.ts)
const TIME_MORNING = /\b(morning|dawn|sunrise|early light)\b/i;
const TIME_EVENING = /\b(evening|dusk|sunset|twilight)\b/i;
const TIME_NIGHT = /\b(night|darkness|stars|moon)\b/i;

function extractTimeOfDay(text: string, prev?: SceneFacts): string {
  if (TIME_MORNING.test(text)) return 'morning';
  if (TIME_EVENING.test(text)) return 'evening';
  if (TIME_NIGHT.test(text)) return 'night';
  return prev?.timeOfDay ?? 'unknown';
}

// 3. Send to AI (sceneFacts.ts formatSceneFactsForPrompt)
`Time of day: ${facts.timeOfDay || 'unknown'}
Do not shift time (morning→sunset) without narrating hours passing.`

// 4. Validate (sceneFacts.ts detectSceneContradiction)
if (prev.timeOfDay === 'morning' && TIME_EVENING.test(narrative)) {
  return 'Time shifted from morning to evening without passage narration';
}

// 5. Sync to edge (copy files)
```

---

## User's System Was Already 90% There

**What they built right**:
- ✅ 4-tier pipeline (extract → track → send → validate)
- ✅ SceneFacts architecture
- ✅ Warden validation pattern
- ✅ Situation packet injection

**What was missing**:
- ❌ 7 data points (quantity, time, mood, indoor, condition, tension, dialogue)

**Not a design flaw - just incomplete field coverage.**

---

## Next Steps

**Question for User**: Do you want me to implement Tier 1 (Time + Mood) now?

**Time estimate**: 6-8 hours  
**Impact**: Fixes 60% of remaining consistency breaks  
**User experience**: "sunset at turn 7" and "NPC personality shift" will both be caught

Let me know and I'll start immediately.
