import type { CampaignBible, MysteryCulprit } from './campaignBibleTypes.ts';
import type { GameState } from './types.ts';

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickFromPool(pool: string[] | undefined, seed: string, salt: string): string | undefined {
  if (!pool?.length) return undefined;
  return pool[hashSeed(`${seed}|${salt}`) % pool.length];
}

export function pickMysteryCulprit(bible: CampaignBible, seed: string): MysteryCulprit | undefined {
  const pool = bible.mysteryCulprits;
  if (!pool?.length) return undefined;
  const idx = hashSeed(`${seed}|${bible.id}|culprit`) % pool.length;
  return pool[idx];
}

export function resolveMysteryCulprit(state: GameState, bible: CampaignBible): MysteryCulprit | undefined {
  const pool = bible.mysteryCulprits;
  if (!pool?.length) return undefined;
  const existingId = state.hiddenStamps?.culpritId;
  if (existingId) {
    const match = pool.find((c) => c.id === existingId);
    if (match) return match;
  }
  return pickMysteryCulprit(bible, state.seed || state.saveId || bible.id);
}

export function stampMysteryCulprit(state: GameState, bible: CampaignBible): GameState['hiddenStamps'] {
  const pick = resolveMysteryCulprit(state, bible);
  const seed = state.seed || state.saveId || bible.id;
  const next = { ...state.hiddenStamps };
  if (pick) {
    next.culpritId = pick.id;
    next.culpritName = pick.name;
    next.culpritRole = pick.role;
    next.culpritMotive = pick.motive;
  }
  const pools = bible.mysteryCluePools;
  if (pools) {
    if (!next.clueWeapon) {
      const w = pickFromPool(pools.weapons, seed, `${bible.id}|weapon`);
      if (w) next.clueWeapon = w;
    }
    if (!next.clueTell) {
      const t = pickFromPool(pools.tells, seed, `${bible.id}|tell`);
      if (t) next.clueTell = t;
    }
    if (!next.clueCover) {
      const c = pickFromPool(pools.covers, seed, `${bible.id}|cover`);
      if (c) next.clueCover = c;
    }
  }
  return Object.keys(next).length ? next : state.hiddenStamps;
}

const ACCUSE_RE = /\b(accus(?:e|ed|ing)|it was|it is|i think(?: it(?:'s| is))?|the killer is|did this|did it|guilty|framed by)\b/i;

export function applyAccusationFromInput(
  state: GameState,
  input: string,
  bible?: CampaignBible | null
): GameState {
  const pool = bible?.mysteryCulprits;
  if (!pool?.length || !input.trim()) return state;
  if (!ACCUSE_RE.test(input)) return state;
  const text = input.toLowerCase();
  const found = pool.find((c) => {
    const full = c.name.toLowerCase();
    const last = full.split(/\s+/).pop() ?? full;
    return text.includes(full) || (last.length > 3 && text.includes(last));
  });
  if (!found) return state;
  if (state.hiddenStamps?.accusedId === found.id) return state;
  return {
    ...state,
    hiddenStamps: {
      ...state.hiddenStamps,
      accusedId: found.id,
      accusedName: found.name,
    },
  };
}

export function formatHiddenCulpritRail(stamps?: Record<string, string> | null): string {
  if (!stamps?.culpritName?.trim() && !stamps?.accusedName?.trim() && !stamps?.clueWeapon) return '';
  const lines: string[] = [];
  const name = stamps.culpritName?.trim();
  if (name) {
    const role = stamps.culpritRole?.trim();
    const motive = stamps.culpritMotive?.trim();
    lines.push(
      `HIDDEN CULPRIT (ENGINE AUTHORITY — never name, hint, or contradict until the player earns the reveal or the ending): The hand that killed Lord Harrington is ${name}${role ? ` (${role})` : ''}.${motive ? ` Motive: ${motive}` : ''} Others may lie or cover it up. Do not invent a different true killer.`
    );
  }
  const clues = [stamps.clueWeapon, stamps.clueTell, stamps.clueCover].filter(Boolean);
  if (clues.length) {
    lines.push(
      `HIDDEN CLUES (ENGINE AUTHORITY — plant only when the player searches, asks, or handles evidence; never dump): weapon tell: ${stamps.clueWeapon ?? '—'}; scene tell: ${stamps.clueTell ?? '—'}; cover story: ${stamps.clueCover ?? '—'}. Do not invent a second murder weapon.`
    );
  }
  const accused = stamps.accusedName?.trim();
  if (accused) {
    const match = stamps.accusedId && stamps.culpritId && stamps.accusedId === stamps.culpritId;
    lines.push(
      `HIDDEN ACCUSED (ENGINE AUTHORITY — the player named ${accused}. Treat that as a locked public theory.${match ? ' They named the true killer — do not confirm until the vault or a confession.' : ' They named the wrong person. Graves and gossip may still believe them. The true killer is unchanged.'}`
    );
  }
  return lines.join('\n');
}
