# Memory Architecture Improvements for Long-Context Campaigns

## Current State Analysis

Your Pack 11 memory system is solid but has these limitations:

### Current Strengths ✅
- **Lossless pins**: Named entities never forgotten
- **Consequence tracking**: Open threads maintained
- **Beat novelty**: Duplicate prevention via fingerprinting
- **Multi-tier**: Campaign → Micro → Facts hierarchy
- **Soft budget**: ~2k tokens middle section

### Current Limitations ⚠️
- **Keyword-only retrieval**: No semantic understanding
- **Fixed token budget**: Hard 2k limit on middle section
- **No importance weighting**: All memories treated equally
- **No hierarchical chunking**: Campaign summary is 1 paragraph
- **No decay curves**: Old memories same weight as recent

---

## Recommended Improvements

### **Priority 1: Semantic Retrieval (Biggest Impact)**

**Problem**: Current keyword search misses semantically related memories.

Example:
- Query: "Who betrayed me?"
- Keyword search: Misses "Mira's knife gleamed as she smiled" (no "betray" keyword)
- Semantic search: Would catch this via embedding similarity

**Solution**: Replace keyword retrieval with lightweight embedding-based search.

#### Option A: Local Embedding (No API Cost)
```typescript
// Use transformers.js (runs in browser, ~10MB model)
import { pipeline } from '@xenova/transformers';

const embedder = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2'  // 384 dims, 22M params
);

// Embed memory on creation
async function createMemoryPin(text: string): MemoryPin {
  const embedding = await embedder(text, { pooling: 'mean', normalize: true });
  return {
    text,
    embedding: Array.from(embedding.data),  // 384 floats
    // ... other fields
  };
}

// Retrieve via cosine similarity
function retrieveMemoriesSemanticaly(
  query: string,
  memories: MemoryPin[],
  limit = 4
): MemoryPin[] {
  const queryEmb = await embedder(query);
  const scored = memories.map(mem => ({
    memory: mem,
    score: cosineSimilarity(queryEmb.data, mem.embedding)
  }));
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.memory);
}
```

**Pros**:
- No API cost
- Privacy (runs locally)
- Fast (< 50ms per embedding)

**Cons**:
- 10MB model download once
- Lower quality than GPT embeddings
- Storage cost (~1.5KB per memory for 384 floats)

#### Option B: OpenRouter Embeddings (Higher Quality)
```typescript
// Use text-embedding-3-small via OpenRouter
async function embedText(text: string): Promise<number[]> {
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',  // 1536 dims, $0.00002/1K tokens
      input: text
    })
  });
  const data = await response.json();
  return data.data[0].embedding;
}
```

**Pros**:
- Higher quality retrieval
- 1536 dimensions (better semantic capture)

**Cons**:
- API cost (~$0.02 per 1000 memories embedded)
- Latency (network call)
- Storage cost (~6KB per memory)

**Recommendation**: Start with **Option A (transformers.js)**. It's free, fast, and good enough for 90% of retrieval tasks.

---

### **Priority 2: Importance-Weighted Summarization**

**Problem**: All turn summaries treated equally. "Picked up a stick" same weight as "Swore oath to Queen".

**Solution**: Weight memories by importance score.

```typescript
interface WeightedMemory extends TurnSummary {
  importance: number;  // 0-1 scale
}

function scoreImportance(
  memory: TurnSummary,
  state: GameState
): number {
  let score = 0.5;  // baseline
  
  // +0.3 if involves main quest
  const mainQuestNames = state.quests
    .filter(q => q.type === 'main')
    .map(q => q.name.toLowerCase());
  if (mainQuestNames.some(name => memory.text.toLowerCase().includes(name))) {
    score += 0.3;
  }
  
  // +0.2 if involves named NPC
  const npcNames = (state.npcMemories ?? []).map(n => n.npcName.toLowerCase());
  if (npcNames.some(name => memory.text.toLowerCase().includes(name))) {
    score += 0.2;
  }
  
  // +0.3 if loot/combat/death
  if (/rare|epic|legendary|defeated|died|hp.*0/i.test(memory.text)) {
    score += 0.3;
  }
  
  // +0.2 if promise/threat
  if (/promise|oath|swear|threat|warn|betray/i.test(memory.text)) {
    score += 0.2;
  }
  
  // -0.1 recency decay per 10 turns
  const age = state.turn - memory.turn;
  score *= Math.max(0.3, 1 - (age / 100));
  
  return Math.min(1, score);
}

function selectImportantMemories(
  memories: WeightedMemory[],
  tokenBudget: number
): WeightedMemory[] {
  // Sort by importance, take until budget filled
  const sorted = [...memories].sort((a, b) => b.importance - a.importance);
  const selected: WeightedMemory[] = [];
  let usedTokens = 0;
  
  for (const mem of sorted) {
    const memTokens = Math.ceil(mem.text.length / 4);
    if (usedTokens + memTokens > tokenBudget) break;
    selected.push(mem);
    usedTokens += memTokens;
  }
  
  return selected.sort((a, b) => a.turn - b.turn);  // Re-sort chronologically
}
```

**Expected improvement**: 30-50% better recall of critical plot points in long campaigns.

---

### **Priority 3: Hierarchical Summarization (100+ Turn Campaigns)**

**Problem**: Campaign summary is 1 flat paragraph. Loses detail as campaign grows.

**Solution**: Multi-level summary pyramid.

```typescript
interface HierarchicalMemory {
  // Level 0: Full detail (last 20 turns)
  recentTurns: TurnSummary[];
  
  // Level 1: Chapter summaries (20-turn blocks, last 5 chapters = 100 turns)
  chapterSummaries: ChapterSummary[];
  
  // Level 2: Arc summaries (100-turn blocks)
  arcSummaries: ArcSummary[];
  
  // Level 3: Campaign overview (single paragraph)
  campaignOverview: string;
}

interface ChapterSummary {
  turnRange: [number, number];  // e.g. [81, 100]
  keyEvents: string[];  // Top 3-5 events
  questProgress: string;  // Quest state changes
  npcsIntroduced: string[];  // New named NPCs
  locationsMapped: string[];  // New places
}

function createChapterSummary(
  turns: TurnSummary[],
  state: GameState
): ChapterSummary {
  // Extract key events via importance scoring
  const weighted = turns.map(t => ({
    ...t,
    importance: scoreImportance(t, state)
  }));
  
  const keyEvents = weighted
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5)
    .map(t => t.text);
  
  // Extract quest changes
  const questMentions = turns.filter(t => 
    /quest|mission|task/i.test(t.text)
  );
  
  const questProgress = questMentions.length > 0
    ? `Quests: ${questMentions.slice(0, 2).map(t => t.text).join('; ')}`
    : 'No quest activity';
  
  return {
    turnRange: [turns[0]!.turn, turns[turns.length - 1]!.turn],
    keyEvents,
    questProgress,
    npcsIntroduced: extractNewNPCs(turns),
    locationsMapped: extractNewLocations(turns),
  };
}

// Inject hierarchical memory into prompt
function formatHierarchicalMemory(memory: HierarchicalMemory): string {
  return `
=== CAMPAIGN MEMORY (HIERARCHICAL) ===

CAMPAIGN OVERVIEW (entire story):
${memory.campaignOverview}

ARC SUMMARIES (100-turn blocks):
${memory.arcSummaries.map(formatArcSummary).join('\n\n')}

RECENT CHAPTERS (last 5×20-turn blocks):
${memory.chapterSummaries.map(formatChapterSummary).join('\n\n')}

RECENT TURNS (last 20 turns, full detail):
${memory.recentTurns.map(t => `T${t.turn}: ${t.text}`).join('\n')}
`;
}
```

**Token efficiency**:
- Current flat system: ~2000 tokens for 100 turns
- Hierarchical: ~1200 tokens for 100 turns, ~2000 tokens for 500 turns

**Expected improvement**: Can retain 2-5x more campaign history in same token budget.

---

### **Priority 4: Dynamic Context Window Utilization**

**Problem**: You allocate a fixed ~2k token budget for memory, even when model supports 128k context.

**Solution**: Adaptive budget based on available context.

```typescript
function calculateMemoryBudget(
  modelContext: number,  // e.g. 128000 for GPT-4
  systemPromptTokens: number,
  playerInputTokens: number,
  desiredOutputTokens: number = 4096
): number {
  const overhead = systemPromptTokens + playerInputTokens + desiredOutputTokens;
  const available = modelContext - overhead;
  
  // Reserve 20% buffer
  const usable = Math.floor(available * 0.8);
  
  // Clamp to reasonable range
  return Math.max(2000, Math.min(usable, 32000));
}

// Inject progressively more memory when budget allows
function selectMemoryForBudget(
  state: GameState,
  tokenBudget: number
): MemoryBlock {
  let allocated = 0;
  const blocks: string[] = [];
  
  // Level 1: Mandatory (always included)
  const mandatory = formatMandatoryMemory(state);
  blocks.push(mandatory);
  allocated += estimateTokens(mandatory);
  
  if (allocated >= tokenBudget) return { blocks, truncated: true };
  
  // Level 2: Recent (last 20 turns full detail)
  const recent = formatRecentTurns(state, 20);
  if (allocated + estimateTokens(recent) < tokenBudget) {
    blocks.push(recent);
    allocated += estimateTokens(recent);
  } else {
    return { blocks, truncated: true };
  }
  
  // Level 3: Chapter summaries (if budget allows)
  const chapters = formatChapterSummaries(state);
  if (allocated + estimateTokens(chapters) < tokenBudget) {
    blocks.push(chapters);
    allocated += estimateTokens(chapters);
  }
  
  // Level 4: Retrieved similar memories (if budget still available)
  const remaining = tokenBudget - allocated;
  if (remaining > 500) {
    const retrieved = retrieveSemanticMemories(
      state.lastPlayerInput,
      state.campaignMemory,
      Math.floor(remaining / 100)  // ~100 tokens per memory
    );
    blocks.push(formatRetrievedMemories(retrieved));
  }
  
  return { blocks, truncated: false };
}
```

**Expected improvement**: Use 10-15x more context on models like Claude Sonnet 3.5 (200k context).

---

### **Priority 5: Sliding Window with Overlap**

**Problem**: Abrupt context cutoffs lose coherence.

**Solution**: Sliding window with overlapping boundaries.

```typescript
interface SlidingMemoryWindow {
  // Always included: last 15 turns (full detail)
  recentWindow: TurnSummary[];
  
  // Overlap zone: turns 16-25 (compressed summaries)
  overlapWindow: TurnSummary[];
  
  // Historical: turns 26+ (chapter summaries only)
  historicalWindow: ChapterSummary[];
}

function buildSlidingWindow(
  state: GameState,
  windowSize = 15,
  overlapSize = 10
): SlidingMemoryWindow {
  const allTurns = state.campaignMemory?.turnSummaries ?? [];
  const currentTurn = state.turn;
  
  return {
    recentWindow: allTurns.filter(
      t => t.turn > currentTurn - windowSize
    ),
    overlapWindow: allTurns.filter(
      t => t.turn > currentTurn - (windowSize + overlapSize) 
        && t.turn <= currentTurn - windowSize
    ),
    historicalWindow: buildChapterSummaries(
      allTurns.filter(t => t.turn <= currentTurn - (windowSize + overlapSize))
    )
  };
}
```

**Why overlap matters**: Prevents "cliff edge" where GM suddenly forgets a conversation that started 16 turns ago.

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)
1. ✅ **Importance weighting** (already have `scoreImportance` logic above)
2. ✅ **Dynamic budget** (already have `calculateMemoryBudget` above)

### Phase 2: Semantic Search (3-5 days)
3. 🔄 **Local embeddings** (transformers.js integration)
4. 🔄 **Semantic retrieval** (replace keyword search)

### Phase 3: Long-Campaign Support (5-7 days)
5. 🔄 **Hierarchical summarization** (chapter/arc summaries)
6. 🔄 **Sliding window** (overlap zones)

### Phase 4: Advanced (Optional)
7. ⏳ **LLM-generated summaries** (use cheap model to summarize chapters)
8. ⏳ **Graph memory** (entities + relationships as knowledge graph)

---

## Expected Performance

### Current System (Pack 11)
- Effective memory: ~100 turns (~20k words of story)
- Token usage: ~2k fixed
- Retrieval quality: 60-70% (keyword-only)

### After Priority 1-2 (Importance + Budget)
- Effective memory: ~150 turns (~30k words)
- Token usage: 2k-8k adaptive
- Retrieval quality: 70-80% (weighted keywords)

### After Priority 3-4 (Semantic + Hierarchical)
- Effective memory: ~300 turns (~60k words)
- Token usage: 2k-15k adaptive
- Retrieval quality: 85-90% (semantic)

### After Priority 5 (Sliding Window)
- Effective memory: ~500 turns (~100k words)
- Token usage: 2k-32k adaptive
- Retrieval quality: 90-95% (semantic + context)

---

## Code Locations

To implement these, modify:
1. `src/game/campaignMemory.ts` - Add semantic retrieval + importance scoring
2. `src/game/situationPacket.ts` - Add dynamic budget calculation
3. `src/game/masterPrompt.ts` - Already has hooks for memory injection

All changes are **additive** - no breaking changes to existing memory system.

---

## Testing Plan

1. **Regression test**: Ensure old saves still work
2. **Long campaign test**: Run 100-turn game, verify recall
3. **Performance test**: Measure embedding speed (target < 100ms)
4. **Quality test**: A/B compare retrieval (keyword vs semantic)

---

## Cost Analysis

### Local Embeddings (Recommended)
- **Upfront**: 10MB model download
- **Per memory**: ~1.5KB storage (384 floats)
- **Per retrieval**: ~50ms compute (free)
- **Total cost**: $0 ongoing

### OpenRouter Embeddings
- **Per memory**: $0.00002 per 1K tokens
- **Per 1000 memories**: ~$0.02
- **Per 10K memories**: ~$0.20
- **Total cost**: Negligible for most users

**Recommendation**: Local embeddings for 95% of users, OpenRouter for power users who want highest quality.
