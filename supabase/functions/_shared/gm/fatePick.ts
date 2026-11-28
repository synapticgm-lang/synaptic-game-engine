/**
 * Fate's Pick — same semantics as ActionBar: uniform random among offered labels.
 * Seedable for headless autoplay reproducibility.
 */

export type Rng = () => number;

/** Mulberry32 — deterministic [0,1) from a 32-bit seed. */
export { mulberry32 } from './seededRng.ts';

/**
 * Labels Fate / autoplay may pick from. Pass {@link systemPromptPad} chips when a
 * System setup step is open — same source ActionBar uses — without merging them
 * into the scene pad. Empty / absent system chips → scene actions.
 * `pageOwnsAlone`: miss / retry page — sceneActions are already the sole owner chips.
 */
export function fatePickPool(
  sceneActions: string[],
  systemChips?: readonly string[] | null,
  pageOwnsAlone = false
): string[] {
  if (pageOwnsAlone) return [...sceneActions];
  if (systemChips?.length) return [...systemChips];
  return sceneActions;
}

/**
 * Whether a setup / page-owned step owns the ActionBar (no scene row beside it).
 * System chips from {@link systemPromptPad}, tabletop creation, or a miss page
 * (`pageOwnsAlone` — same idea as LitRPG System shown alone).
 */
export function setupOwnsActionBar(
  systemChips?: readonly string[] | null,
  creating = false,
  pageOwnsAlone = false
): boolean {
  return pageOwnsAlone || creating || !!(systemChips && systemChips.length > 0);
}

/**
 * Scene labels ActionBar may paint.
 * `pageOwnsAlone`: the resolved sceneActions ARE the owner chips (e.g. Try again) — return them.
 * System / creation ownership: empty scene row (those chips paint on their own row).
 * When the scene row is allowed, `excludeLowers` drops labels already on setup rows.
 */
export function actionBarSceneActions(
  sceneActions: readonly string[],
  systemChips?: readonly string[] | null,
  creating = false,
  excludeLowers?: ReadonlySet<string>,
  pageOwnsAlone = false
): string[] {
  if (pageOwnsAlone) return [...sceneActions];
  if (setupOwnsActionBar(systemChips, creating)) return [];
  if (!excludeLowers?.size) return [...sceneActions];
  const out: string[] = [];
  for (const c of sceneActions) {
    if (!excludeLowers.has(c.trim().toLowerCase())) out.push(c);
  }
  return out;
}

/** Pick one of `actions` (ActionBar Fate's Pick). Empty → fallback. */
export function pickFateChoice(
  actions: string[],
  rng: Rng = Math.random,
  fallback = 'Look around'
): string {
  if (!actions.length) return fallback;
  const i = Math.floor(rng() * actions.length);
  return actions[Math.min(i, actions.length - 1)] ?? fallback;
}

/** Weighted pick (autoplay): weight per label; non-positive / missing weights fall back to uniform. */
export function pickWeightedChoice(
  actions: string[],
  weights: number[],
  rng: Rng = Math.random,
  fallback = 'Look around'
): string {
  if (!actions.length) return fallback;
  const w = actions.map((_, i) => Math.max(0, weights[i] ?? 0));
  const total = w.reduce((a, b) => a + b, 0);
  if (!(total > 0)) return pickFateChoice(actions, rng, fallback);
  let r = rng() * total;
  for (let i = 0; i < actions.length; i++) {
    r -= w[i]!;
    if (r < 0) return actions[i]!;
  }
  return actions[actions.length - 1]!;
}
