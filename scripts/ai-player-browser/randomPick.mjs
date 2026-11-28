/**
 * Random-pick mode helpers for the live-site ai-player driver.
 * Reuses mulberry32 / hashSeed from the game's one RNG home (seededRng).
 * No OpenRouter. Uniform pick among visible chip labels only.
 */
import { hashSeed, mulberry32 } from '../../src/game/seededRng.ts';

/** `brain` (default) or `random` from --pick= / AI_PLAYER_PICK. */
export function parsePickMode(args = [], env = process.env) {
  const fromArg = args.find((a) => a.startsWith('--pick='))?.slice('--pick='.length);
  const raw = String(fromArg || env.AI_PLAYER_PICK || 'brain').trim().toLowerCase();
  return raw === 'random' ? 'random' : 'brain';
}

/** --seed= / AI_PLAYER_SEED; default Date.now() (unsigned 32-bit). */
export function resolvePickSeed(args = [], env = process.env, now = Date.now()) {
  const fromArg = args.find((a) => a.startsWith('--seed='))?.slice('--seed='.length);
  const raw = fromArg != null ? fromArg : env.AI_PLAYER_SEED;
  if (raw == null || String(raw).trim() === '') return (Number(now) >>> 0);
  const s = String(raw).trim();
  if (/^\d+$/.test(s)) return Number(s) >>> 0;
  return hashSeed(s);
}

export function createPickRng(seed) {
  return mulberry32(seed >>> 0);
}

/**
 * Uniform pick among visible chip labels (same index rule as Fate pickFateChoice).
 * Empty list → '' (caller must not invent a typed line).
 */
export function pickRandomOption(options, rng) {
  const list = (options || []).map((c) => String(c || '').trim()).filter(Boolean);
  if (!list.length) return '';
  const roll = typeof rng === 'function' ? rng() : Math.random();
  const i = Math.floor(roll * list.length);
  return list[Math.min(i, list.length - 1)] || '';
}

/**
 * Story turns: uniform random among visible chips.
 * Setup/creation: one uniform random on the first setup screen, then the row's
 * forward chip by position (index 0 — creationChips puts the primary action first;
 * ChipRow paints in that order). No label / phrase matching.
 *
 * @returns {{ pick: string, mode: 'random' | 'forward' }}
 */
export function pickDriverOption({
  options,
  rng,
  setup = false,
  setupPickCount = 0,
} = {}) {
  const list = (options || []).map((c) => String(c || '').trim()).filter(Boolean);
  if (!list.length) return { pick: '', mode: 'random' };
  if (setup && Number(setupPickCount) > 0) {
    return { pick: list[0], mode: 'forward' };
  }
  return { pick: pickRandomOption(list, rng), mode: 'random' };
}
