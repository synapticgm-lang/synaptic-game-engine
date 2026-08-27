/**
 * Deterministic seed utilities for WOF research fixtures.
 * The generator is deliberately small, serializable, and local to this project.
 */

export interface SeedStream {
  readonly seed: number;
  next(): number;
  integer(minInclusive: number, maxInclusive: number): number;
  pick<T>(items: readonly T[]): T;
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Creates a replayable xorshift32 stream from a local experiment identifier. */
export function createSeedStream(experimentId: string): SeedStream {
  let state = hashSeed(experimentId) || 0x6d2b79f5;
  const seed = state;

  const next = (): number => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };

  return {
    seed,
    next,
    integer(minInclusive: number, maxInclusive: number): number {
      if (!Number.isInteger(minInclusive) || !Number.isInteger(maxInclusive) || maxInclusive < minInclusive) {
        throw new Error("SeedStream.integer requires an ordered integer range.");
      }
      return Math.floor(next() * (maxInclusive - minInclusive + 1)) + minInclusive;
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error("SeedStream.pick requires at least one item.");
      return items[Math.floor(next() * items.length)] as T;
    },
  };
}
