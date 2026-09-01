/**
 * PYOA spine v1 — Thornferry Road only.
 * Structure is fixed (nodes + legal exits); AI still writes unique prose per visit.
 * Other PYOA bibles keep old branch-lock / crisis behavior.
 */

import type { GameState } from './types';

export type PyoaSpineNodeId = string;

export interface PyoaSpineExit {
  id: string;
  label: string;
  to: PyoaSpineNodeId;
  /** Soft tags stamped onto spine.flags when taken. */
  setFlags?: Record<string, string | boolean>;
}

export interface PyoaSpineNode {
  id: PyoaSpineNodeId;
  /** Compact stake for SNAPSHOT / TURN JOB. */
  stake: string;
  exits: PyoaSpineExit[];
  majorFork?: boolean;
  /** When set, arriving here commits an ending (honest gate). */
  endingId?: string;
}

export interface PyoaSpineState {
  bibleId: 'thornferry-road';
  currentNodeId: PyoaSpineNodeId;
  visited: PyoaSpineNodeId[];
  flags: Record<string, string | boolean>;
  /** Delay pads exhausted once → force a legal edge. */
  delayCount: number;
  endingId?: string | null;
}

const START = 'tf-landing';

/** Curated Thornferry spine: 12 nodes, 3 major forks, 6 ending leaves. */
export const THORNFERRY_SPINE: PyoaSpineNode[] = [
  {
    id: 'tf-landing',
    stake: 'Mill landing — Wren offers the road; charter is sealed.',
    exits: [
      { id: 'accept-wren', label: 'Walk the road with Wren', to: 'tf-streets', setFlags: { wren: 'with' } },
      { id: 'refuse-wren', label: 'Go alone', to: 'tf-streets', setFlags: { wren: 'solo' } },
      { id: 'hear-pell', label: 'Hear Pell’s coin offer', to: 'tf-streets', setFlags: { heardPell: true } },
    ],
  },
  {
    id: 'tf-streets',
    stake: 'Thornferry streets — mill, inn, clerk. One pressure.',
    majorFork: true,
    exits: [
      {
        id: 'keep-local',
        label: 'Keep the charter with the mill',
        to: 'tf-road',
        setFlags: { charterIntent: 'mill' },
      },
      {
        id: 'take-pell',
        label: 'Take Pell’s coin in secret',
        to: 'tf-road',
        setFlags: { charterIntent: 'pell' },
      },
      {
        id: 'stall-charter',
        label: 'Stall and keep the charter close',
        to: 'tf-road',
        setFlags: { charterIntent: 'hold' },
      },
    ],
  },
  {
    id: 'tf-road',
    stake: 'Road east toward Highmark — choose the next stop.',
    exits: [
      { id: 'to-hamlet', label: 'Stop at the mill hamlet', to: 'tf-hamlet' },
      { id: 'to-ford', label: 'Press on to the ford', to: 'tf-ford' },
      { id: 'to-chapel', label: 'Visit the quiet chapel', to: 'tf-chapel' },
    ],
  },
  {
    id: 'tf-hamlet',
    stake: 'Mill hamlet — local grain politics and a name on the seal.',
    exits: [
      { id: 'hamlet-onward', label: 'Take the road onward', to: 'tf-proof' },
      { id: 'hamlet-ford', label: 'Cut down to the ford', to: 'tf-ford' },
    ],
  },
  {
    id: 'tf-ford',
    stake: 'Rain at the ford — help, rob, or pass a traveler.',
    exits: [
      { id: 'ford-help', label: 'Help the traveler', to: 'tf-proof', setFlags: { ford: 'help' } },
      { id: 'ford-rob', label: 'Rob the traveler', to: 'tf-proof', setFlags: { ford: 'rob' } },
      { id: 'ford-pass', label: 'Pass without stopping', to: 'tf-proof', setFlags: { ford: 'pass' } },
    ],
  },
  {
    id: 'tf-chapel',
    stake: 'Quiet Bell — bless, refuse, or leave the charter unblessed.',
    exits: [
      { id: 'chapel-bless', label: 'Let the chapel bless the charter', to: 'tf-proof', setFlags: { chapel: 'bless' } },
      { id: 'chapel-refuse', label: 'Refuse the blessing', to: 'tf-proof', setFlags: { chapel: 'refuse' } },
    ],
  },
  {
    id: 'tf-proof',
    stake: 'Proof the charter is more than paper — a name, a seal, a lie.',
    majorFork: true,
    exits: [
      { id: 'proof-true', label: 'Face the honest seal', to: 'tf-gate', setFlags: { proof: 'honest' } },
      { id: 'proof-lie', label: 'Lean on the forged line', to: 'tf-gate', setFlags: { proof: 'forge' } },
    ],
  },
  {
    id: 'tf-gate',
    stake: 'Highmark gate — deliver, sell, burn, or rewrite the charter.',
    majorFork: true,
    exits: [
      {
        id: 'gate-mill',
        label: 'Deliver the charter back toward the mill',
        to: 'tf-end-mill-wren',
        setFlags: { resolution: 'mill' },
      },
      {
        id: 'gate-pell',
        label: 'Sell the charter to Pell',
        to: 'tf-end-pell-wren',
        setFlags: { resolution: 'pell' },
      },
      {
        id: 'gate-burn',
        label: 'Burn or forge the charter',
        to: 'tf-end-burn',
        setFlags: { resolution: 'burn' },
      },
      {
        id: 'gate-honest',
        label: 'Deliver honestly to Highmark with Wren',
        to: 'tf-end-honest',
        setFlags: { resolution: 'honest' },
      },
    ],
  },
  {
    id: 'tf-end-mill-wren',
    stake: 'Ending — mill kept; Wren stayed or not.',
    endingId: 'thornferry:mill-kept',
    exits: [],
  },
  {
    id: 'tf-end-pell-wren',
    stake: 'Ending — sold to Pell; companion cost.',
    endingId: 'thornferry:sold-pell',
    exits: [],
  },
  {
    id: 'tf-end-burn',
    stake: 'Ending — charter burned or forged; both sides hunt.',
    endingId: 'thornferry:burned',
    exits: [],
  },
  {
    id: 'tf-end-honest',
    stake: 'Ending — honest Highmark delivery with Wren.',
    endingId: 'thornferry:honest-delivery',
    exits: [],
  },
];

const NODE_BY_ID = new Map(THORNFERRY_SPINE.map((n) => [n.id, n]));

export function spineBibleSupported(bibleId: string | undefined | null): boolean {
  return bibleId === 'thornferry-road';
}

export function getSpineNode(id: string | undefined | null): PyoaSpineNode | undefined {
  if (!id) return undefined;
  return NODE_BY_ID.get(id);
}

export function initThornferrySpine(): PyoaSpineState {
  return {
    bibleId: 'thornferry-road',
    currentNodeId: START,
    visited: [START],
    flags: {},
    delayCount: 0,
    endingId: null,
  };
}

export function ensurePyoaSpine(state: GameState): GameState {
  if (state.engineMode !== 'pyoa') return state;
  if (!spineBibleSupported(state.campaignBibleId)) return state;
  if (state.pyoaSpine?.currentNodeId) return state;
  return { ...state, pyoaSpine: initThornferrySpine() };
}

export function currentSpineNode(state: GameState): PyoaSpineNode | undefined {
  const sp = state.pyoaSpine;
  if (!sp) return undefined;
  return getSpineNode(sp.currentNodeId);
}

export function legalSpineExits(state: GameState): PyoaSpineExit[] {
  const node = currentSpineNode(state);
  if (!node) return [];
  if (node.endingId) return [];
  const flags = state.pyoaSpine?.flags ?? {};
  // Gate honest-with-Wren only if Wren is with the player
  return node.exits.filter((e) => {
    if (e.to === 'tf-end-honest' && flags.wren === 'solo') return false;
    if (e.id === 'gate-mill' && flags.charterIntent === 'pell' && flags.wren === 'solo') {
      // Still allow mill return — redirects ending leaf via resolveEndingLeaf
      return true;
    }
    return true;
  });
}

/** Map gate choice + flags onto the honest ending leaf (Wren/solo variants share leaf ids). */
function resolveEndingLeaf(to: string, flags: Record<string, string | boolean>): string {
  if (to === 'tf-end-mill-wren') {
    return flags.wren === 'solo' ? 'tf-end-mill-wren' : 'tf-end-mill-wren';
  }
  if (to === 'tf-end-pell-wren') {
    return 'tf-end-pell-wren';
  }
  return to;
}

export function isSpineDelayPad(choice: string): boolean {
  const lower = (choice ?? '').toLowerCase();
  return /\b(buy time|call for help|wait and watch|^wait$|stand around|do nothing|inspect the (?:crisis|scene|road)|study the|delay|stall)\b/i.test(
    lower
  );
}

/**
 * Advance spine from a player choice label (or exit id).
 * Delay pads: count once, then force first legal exit.
 */
export function advancePyoaSpine(state: GameState, playerInput: string): GameState {
  if (state.engineMode !== 'pyoa') return state;
  if (!spineBibleSupported(state.campaignBibleId)) return state;
  let working = ensurePyoaSpine(state);
  const spine = working.pyoaSpine!;
  if (spine.endingId) return working;

  const node = getSpineNode(spine.currentNodeId);
  if (!node) return working;

  if (node.endingId) {
    return {
      ...working,
      pyoaSpine: { ...spine, endingId: node.endingId },
    };
  }

  const lower = (playerInput ?? '').toLowerCase().trim();
  const exits = legalSpineExits(working);

  if (isSpineDelayPad(playerInput)) {
    const delayCount = (spine.delayCount ?? 0) + 1;
    if (delayCount < 2 || !exits.length) {
      return {
        ...working,
        pyoaSpine: { ...spine, delayCount },
      };
    }
    // Force first legal edge after one delay exhaust
    return applyExit(working, exits[0]!);
  }

  const match =
    exits.find((e) => e.label.toLowerCase() === lower)
    || exits.find((e) => lower.includes(e.label.toLowerCase().slice(0, 18)))
    || exits.find((e) => lower.includes(e.id.replace(/-/g, ' ')))
    || fuzzyExitMatch(exits, lower);

  if (!match) return working;
  return applyExit(working, match);
}

function fuzzyExitMatch(exits: PyoaSpineExit[], lower: string): PyoaSpineExit | undefined {
  if (/\b(walk|travel|accept).{0,20}\bwren\b|\bwith wren\b/.test(lower)) {
    return exits.find((e) => e.id === 'accept-wren');
  }
  if (/\bgo alone\b|\bsolo\b|\brefuse wren\b/.test(lower)) {
    return exits.find((e) => e.id === 'refuse-wren');
  }
  if (/\bpell.?s coin\b|\btake pell\b|\bsell .{0,12}pell\b/.test(lower)) {
    return exits.find((e) => e.id === 'take-pell' || e.id === 'gate-pell');
  }
  if (/\bkeep .{0,12}mill\b|\bmill kept\b|\bwith the mill\b/.test(lower)) {
    return exits.find((e) => e.id === 'keep-local' || e.id === 'gate-mill');
  }
  if (/\bburn\b|\bforge\b/.test(lower)) {
    return exits.find((e) => e.id === 'gate-burn' || e.id === 'proof-lie');
  }
  if (/\bdeliver honestly\b|\bhonest(ly)?\b.{0,20}\bhighmark\b/.test(lower)) {
    return exits.find((e) => e.id === 'gate-honest');
  }
  if (/\bface the crisis\b|\bturn the page\b|\bpress on\b/.test(lower)) {
    return exits[0];
  }
  return undefined;
}

function applyExit(state: GameState, exit: PyoaSpineExit): GameState {
  const spine = state.pyoaSpine ?? initThornferrySpine();
  const flags = { ...spine.flags, ...(exit.setFlags ?? {}) };
  const to = resolveEndingLeaf(exit.to, flags);
  const dest = getSpineNode(to);
  const visited = [...spine.visited, to].filter((v, i, a) => a.indexOf(v) === i).slice(-24);
  const endingId = dest?.endingId ?? null;
  return {
    ...state,
    pyoaSpine: {
      ...spine,
      currentNodeId: to,
      visited,
      flags,
      delayCount: 0,
      endingId,
    },
  };
}

/** Honest ending gate: ending leaf + required flags. */
export function evaluateSpineEndingGate(state: GameState): {
  ok: boolean;
  endingId: string | null;
  reason?: string;
} {
  const spine = state.pyoaSpine;
  if (!spine?.endingId) return { ok: false, endingId: null, reason: 'no-ending' };
  const flags = spine.flags;
  const id = spine.endingId;

  if (id === 'thornferry:honest-delivery') {
    if (flags.wren !== 'with') {
      return { ok: false, endingId: id, reason: 'honest-requires-wren' };
    }
    if (flags.resolution !== 'honest') {
      return { ok: false, endingId: id, reason: 'resolution-mismatch' };
    }
    return { ok: true, endingId: id };
  }
  if (id === 'thornferry:mill-kept') {
    if (flags.resolution !== 'mill' && flags.charterIntent !== 'mill') {
      return { ok: false, endingId: id, reason: 'mill-resolution-required' };
    }
    return { ok: true, endingId: id };
  }
  if (id === 'thornferry:sold-pell') {
    if (flags.resolution !== 'pell' && flags.charterIntent !== 'pell') {
      return { ok: false, endingId: id, reason: 'pell-resolution-required' };
    }
    return { ok: true, endingId: id };
  }
  if (id === 'thornferry:burned') {
    if (flags.resolution !== 'burn' && flags.proof !== 'forge') {
      return { ok: false, endingId: id, reason: 'burn-resolution-required' };
    }
    return { ok: true, endingId: id };
  }
  return { ok: true, endingId: id };
}

export function formatPyoaSpineSnapshotLines(state: GameState): string[] {
  if (state.engineMode !== 'pyoa' || !spineBibleSupported(state.campaignBibleId)) return [];
  const spine = state.pyoaSpine ?? initThornferrySpine();
  const node = getSpineNode(spine.currentNodeId);
  if (!node) return [];
  const exits = legalSpineExits({ ...state, pyoaSpine: spine });
  const exitLabels = exits.map((e) => e.label).slice(0, 4);
  const lines = [
    `PYOA SPINE: ${node.id} — ${node.stake}`,
  ];
  if (spine.endingId) {
    lines.push(`PYOA ENDING LOCKED: ${spine.endingId}`);
  } else if (exitLabels.length) {
    lines.push(`PYOA EXITS: ${exitLabels.join(' | ')}`);
  } else {
    lines.push('PYOA EXITS: (none — ending leaf)');
  }
  if ((spine.delayCount ?? 0) >= 1) {
    lines.push('PYOA DELAY EXHAUSTED: next beat must take a legal exit (turn the page).');
  }
  return lines;
}

export function formatPyoaSpineTurnJob(state: GameState): string | null {
  if (state.engineMode !== 'pyoa' || !spineBibleSupported(state.campaignBibleId)) return null;
  const node = currentSpineNode(ensurePyoaSpine(state));
  if (!node) return null;
  if (node.endingId) return `PYOA ending: close ${node.endingId} — unique prose, fixed outcome.`;
  if (node.majorFork) return `PYOA fork at ${node.id}: pick one legal exit — no delay stall.`;
  return `PYOA page ${node.id}: advance via a legal exit; unique prose, fixed stake.`;
}

export function spineChoiceLabels(state: GameState): string[] {
  return legalSpineExits(state).map((e) => e.label);
}

export function spineForceEdgeAfterDelay(state: GameState): boolean {
  return (state.pyoaSpine?.delayCount ?? 0) >= 1 && legalSpineExits(state).length > 0;
}
