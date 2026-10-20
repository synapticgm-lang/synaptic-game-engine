/**
 * q76b-STRESS — typed-line generators for the no-AI stress player.
 * Builds free speech, described actions from engine nouns, nonsense, and
 * uses of items NOT in inventory. No model calls. Seeded via Rng.
 */
import type { GameState } from '../../src/game/types';
import type { Rng } from '../../src/game/fatePick';
import { peopleHere } from '../../src/game/chipLegality';

export type TypedKind = 'speech' | 'described' | 'nonsense' | 'fake-item';

function pick<T>(xs: T[], rng: Rng, fallback: T): T {
  if (!xs.length) return fallback;
  return xs[Math.min(xs.length - 1, Math.floor(rng() * xs.length))]!;
}

function inventoryNames(state: GameState): Set<string> {
  const out = new Set<string>();
  const inv = state.character?.inventory ?? [];
  for (let i = 0; i < inv.length; i++) {
    const n = (inv[i]?.name ?? '').trim().toLowerCase();
    if (n) out.add(n);
  }
  return out;
}

function engineNouns(state: GameState): { people: string[]; props: string[]; here: string } {
  const people = peopleHere(state);
  const props = (state.sceneFacts?.props ?? []).map((p) => String(p).trim()).filter(Boolean);
  const here = (state.currentLocation ?? 'the room').trim() || 'the room';
  return { people, props, here };
}

/** Syllable glue for nonsense — not a deny-list; harness-only. */
function syllable(rng: Rng): string {
  const parts = ['blor', 'zix', 'thrum', 'plok', 'vex', 'mir', 'dor', 'quel'];
  return pick(parts, rng, 'blor') + pick(parts, rng, 'zix');
}

export function generateTypedLine(state: GameState, rng: Rng, kind?: TypedKind): { text: string; kind: TypedKind } {
  const k: TypedKind = kind ?? pick(['speech', 'described', 'nonsense', 'fake-item'], rng, 'speech');
  const { people, props, here } = engineNouns(state);
  const who = pick(people, rng, '');
  const prop = pick(props, rng, 'cart');
  const pronoun = who ? 'his' : 'the';
  if (k === 'speech') {
    const target = who || 'whoever is listening';
    return { kind: k, text: `I say to ${target}: what do you actually want from me here at ${here}?` };
  }
  if (k === 'described') {
    const cover = prop || 'the cart';
    const eyes = who ? `${who}'s eyes` : `${pronoun} eyes`;
    return { kind: k, text: `kick sand in ${eyes} then dive behind ${cover}` };
  }
  if (k === 'nonsense') {
    return { kind: k, text: `blorple the ${syllable(rng)} while humming at ${here}` };
  }
  const owned = inventoryNames(state);
  let fake = `${syllable(rng)} amulet`;
  for (let i = 0; i < 8; i++) {
    const cand = `${syllable(rng)} ${pick(['amulet', 'vial', 'key', 'token'], rng, 'amulet')}`;
    if (!owned.has(cand.toLowerCase())) {
      fake = cand;
      break;
    }
  }
  return { kind: k, text: `Use the ${fake}` };
}
