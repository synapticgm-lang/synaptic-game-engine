/**
 * q76b-STRESS / q76e-SCENARIOS — deterministic stub writer (no model).
 * Default: voices only peopleHere (writer-facing present).
 * Naughty mode: sometimes voices a non-present known NPC so the absent-speaker
 * checker can be proven to fire. Lives under scripts/ (outside ruleCount TOTAL).
 */
import type { GameState } from '../../src/game/types';
import { peopleHere } from '../../src/game/chipLegality';

export type StressStubBeat = { prose: string; speakers: string[] };
export type StubWriterOpts = {
  /** When true, may voice a known NPC who is not engine-present (prove absent-speaker). */
  naughty?: boolean;
  /** 0..1 chance to inject a naughty speaker when naughty is on (default 1 in tests). */
  naughtyChance?: number;
  /** Deterministic roll in [0,1); omit → never roll (naughty only when chance>=1). */
  roll?: number;
};

function knownNpcNames(state: GameState): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const mem = state.npcMemories ?? [];
  for (let i = 0; i < mem.length; i++) {
    const n = (mem[i]?.npcName ?? '').trim();
    const low = n.toLowerCase();
    if (n && !seen.has(low)) {
      seen.add(low);
      out.push(n);
    }
  }
  return out;
}

/** Plain prose from location / props / engineResult / input. Speakers ⊆ present unless naughty. */
export function buildStressStubProse(
  state: GameState,
  playerInput: string,
  opts: StubWriterOpts = {},
): StressStubBeat {
  const here = (state.currentLocation ?? 'here').trim() || 'here';
  const present = peopleHere(state);
  const props = state.sceneFacts?.props ?? [];
  let propBit = 'the room';
  for (let i = 0; i < props.length; i++) {
    const p = String(props[i]).trim();
    if (p) { propBit = p; break; }
  }
  const factBits: string[] = [];
  const factParts = String(state.completedEvent?.engineResult ?? '').split(' ');
  for (let i = 0; i < factParts.length; i++) if (factParts[i]) factBits.push(factParts[i]!);
  const fact = factBits.join(' ').trim().slice(0, 220);
  const actBits: string[] = [];
  const actParts = String(playerInput ?? '').split(' ');
  for (let i = 0; i < actParts.length; i++) if (actParts[i]) actBits.push(actParts[i]!);
  let act = actBits.join(' ').trim() || 'Look around';
  if (act.length >= 4 && act.slice(0, 4).toLowerCase() === 'you ') act = act.slice(4);
  const speakers: string[] = [];
  const lines = [`At ${here}, you ${act}.`, fact || `The scene held at ${here}; ${propBit} stayed in place.`];
  if (present.length) {
    speakers.push(present[0]!);
    lines.push(`${present[0]!} answered from where they stood.`);
  }

  const chance = opts.naughtyChance ?? 1;
  const roll = opts.roll ?? 0;
  if (opts.naughty && roll < chance) {
    const presentLow = new Set<string>();
    for (let i = 0; i < present.length; i++) presentLow.add(present[i]!.toLowerCase());
    const known = knownNpcNames(state);
    let absent: string | null = null;
    for (let i = 0; i < known.length; i++) {
      const n = known[i]!;
      if (!presentLow.has(n.toLowerCase())) {
        absent = n;
        break;
      }
    }
    if (!absent) absent = 'Mira Voss';
    speakers.push(absent);
    lines.push(`${absent} said, "Hold."`);
  }

  return { prose: lines.join(' '), speakers };
}
