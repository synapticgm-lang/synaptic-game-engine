/**
 * Semantic memory embeddings using transformers.js
 * Enables semantic search over campaign memories (Pack 12).
 * 
 * Model: Xenova/all-MiniLM-L6-v2 (384 dimensions, 22M params, ~10MB)
 * Cost: $0 (runs locally in browser)
 * Speed: ~50ms per embedding
 */

import type { TurnSummary, MemoryPin } from './types';

let embeddingPipeline: any = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;
let initializationFailed = false;

/**
 * Initialize the embedding model (lazy-loaded).
 * First call downloads ~10MB model, subsequent calls are instant.
 * Fails gracefully with 30s timeout.
 */
export async function initEmbeddings(): Promise<void> {
  if (embeddingPipeline) return;
  if (initializationFailed) {
    console.warn('[Embeddings] Previous initialization failed, skipping retry');
    return;
  }
  if (initPromise) return initPromise;
  
  isInitializing = true;
  initPromise = (async () => {
    try {
      // Dynamic import to avoid bundling in builds that don't use it
      const { pipeline } = await import('@xenova/transformers');
      
      // 30-second timeout to prevent hanging on HuggingFace errors
      embeddingPipeline = await Promise.race([
        pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2',
          {
            // Use quantized model for smaller download
            quantized: true,
            // Progress callback
            progress_callback: (progress: any) => {
              if (progress.status === 'progress') {
                console.log(`[Embeddings] Loading: ${progress.file} ${Math.round((progress.loaded / progress.total) * 100)}%`);
              }
            },
          }
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Model load timeout after 30s')), 30000)
        )
      ]);
      
      console.log('[Embeddings] Model loaded successfully');
    } catch (error: any) {
      console.warn('[Embeddings] Failed to load model (will use keyword fallback):', error?.message || error);
      initializationFailed = true;
      throw error;
    } finally {
      isInitializing = false;
    }
  })();
  
  return initPromise;
}

/**
 * Generate embedding for text (384-dimensional vector).
 * Returns empty array on failure (graceful degradation).
 */
export async function embedText(text: string): Promise<number[]> {
  try {
    await initEmbeddings();
    
    if (!embeddingPipeline) {
      return [];
    }
    
    // Mean pooling + normalization
    const output = await embeddingPipeline(text, {
      pooling: 'mean',
      normalize: true,
    });
    
    return Array.from(output.data as Float32Array);
  } catch (error) {
    // Silent failure - embeddings are optional
    return [];
  }
}

/**
 * Cosine similarity between two embeddings (0-1, higher = more similar).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embedding dimensions must match');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Embed turn summary (if not already embedded).
 * Fire-and-forget: never throws, never blocks gameplay.
 */
export async function embedTurnSummary(summary: TurnSummary): Promise<TurnSummary> {
  if (summary.embedding && summary.embedding.length === 384) {
    return summary;
  }
  
  if (initializationFailed) {
    return summary;
  }
  
  try {
    const embedding = await embedText(summary.text);
    if (embedding.length > 0) {
      return { ...summary, embedding };
    }
  } catch (error) {
    // Silent failure - embeddings are optional
  }
  
  return summary;
}

/**
 * Embed all turn summaries in batch (returns new array with embeddings).
 */
export async function embedAllTurnSummaries(
  summaries: TurnSummary[]
): Promise<TurnSummary[]> {
  const results: TurnSummary[] = [];
  
  for (const summary of summaries) {
    results.push(await embedTurnSummary(summary));
  }
  
  return results;
}

/**
 * Semantic search over turn summaries.
 * Returns summaries sorted by semantic similarity to query.
 */
export async function semanticSearchMemories(
  query: string,
  memories: TurnSummary[],
  limit = 4
): Promise<TurnSummary[]> {
  // Ensure all memories have embeddings
  const embedded = await Promise.all(
    memories.map(m => embedTurnSummary(m))
  );
  
  // Get query embedding
  const queryEmb = await embedText(query);
  
  // Score by cosine similarity
  const scored = embedded
    .filter(m => m.embedding && m.embedding.length === 384)
    .map(m => ({
      memory: m,
      score: cosineSimilarity(queryEmb, m.embedding!),
    }));
  
  // Sort by score and take top K
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.memory);
}

/**
 * Hybrid search: combine semantic + keyword + importance.
 * Best of all worlds for memory retrieval.
 */
export async function hybridSearchMemories(
  query: string,
  memories: TurnSummary[],
  limit = 4
): Promise<TurnSummary[]> {
  // Semantic scores
  const semantic = await semanticSearchMemories(query, memories, limit * 2);
  const semanticMap = new Map(semantic.map((m, idx) => [m.id, 1 - (idx / semantic.length)]));
  
  // Keyword scores
  const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const keywordScores = memories.map(m => {
    const text = m.text.toLowerCase();
    const score = queryWords.reduce((s, w) => s + (text.includes(w) ? 1 : 0), 0);
    return { memory: m, score: score / Math.max(1, queryWords.length) };
  });
  const keywordMap = new Map(keywordScores.map(k => [k.memory.id, k.score]));
  
  // Combined score: 50% semantic + 30% keyword + 20% importance
  const combined = memories.map(m => ({
    memory: m,
    score: (
      (semanticMap.get(m.id) ?? 0) * 0.5 +
      (keywordMap.get(m.id) ?? 0) * 0.3 +
      (m.importance ?? 0.5) * 0.2
    ),
  }));
  
  return combined
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(c => c.memory);
}

/**
 * Check if embeddings are available (model loaded).
 */
export function areEmbeddingsAvailable(): boolean {
  return embeddingPipeline !== null;
}

/**
 * Check if embeddings are currently initializing.
 */
export function areEmbeddingsInitializing(): boolean {
  return isInitializing;
}
