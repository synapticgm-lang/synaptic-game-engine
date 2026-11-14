/** Seeded player-name picks from the fixed per-race banks; a name the player sets is never touched here. */
import { RACE_NAME_BANKS, type RaceNameKey } from '@/data/raceNameBanks';
import { hashUnit } from './seededRng';
import { isLockablePcName } from './pcNameAuthority';
import { resolveActiveCampaignBible } from './campaignSeed';
import type { GameState } from './types';

/** Players from Earth keep modern names whatever world they land in. */
const EARTH_ORIGIN_ARCHETYPES = new Set<string>(['system_apocalypse', 'isekai', 'vrmmo']);

function raceFromText(text: string | undefined): RaceNameKey | null {
  const t = (text ?? '').toLowerCase().replace(/_/g, '-');
  if (!t.trim()) return null;
  const words = new Set(t.split(/[^a-z-]+/).filter(Boolean).flatMap((w) => [w, ...w.split('-')]));
  for (const key of Object.keys(RACE_NAME_BANKS) as RaceNameKey[]) {
    if (key === 'human' || key === 'modern') continue;
    if (RACE_NAME_BANKS[key].match.some((m) => words.has(m))) return key;
  }
  return RACE_NAME_BANKS.human.match.some((m) => words.has(m)) ? 'human' : null;
}

/** Which bank this game's player names come from. */
export function pcNameRaceKey(state?: GameState): RaceNameKey {
  if (!state) return 'modern';
  const fromRace =
    raceFromText(state.character?.srd?.speciesId)
    ?? raceFromText(state.openingEstablishment?.answers?.species);
  if (fromRace) return fromRace;
  // The campaign's own archetype wins: a save's campaignArchetype can still be the picker default.
  let archetype: string | undefined;
  try {
    archetype = resolveActiveCampaignBible(state)?.archetype;
  } catch {
    archetype = undefined;
  }
  archetype = archetype ?? state.campaignArchetype;
  if (!archetype || EARTH_ORIGIN_ARCHETYPES.has(archetype)) return 'modern';
  return 'human';
}

/** Every word of a name the campaign already gives to someone else. */
function campaignNameWords(state?: GameState): Set<string> {
  const out = new Set<string>();
  if (!state) return out;
  const add = (n?: string) => {
    for (const w of (n ?? '').toLowerCase().split(/[^a-z'-]+/)) if (w.length > 1) out.add(w);
  };
  let bible;
  try {
    bible = resolveActiveCampaignBible(state);
  } catch {
    bible = undefined;
  }
  for (const npc of bible?.keyNPCs ?? []) add(npc.name);
  for (const m of state.npcMemories ?? []) add(m.npcName);
  for (const c of state.openingEstablishment?.instance?.cast ?? []) add(c.name);
  return out;
}

function start(state: GameState | undefined, salt: string, len: number): number {
  const seed = state?.seed ?? state?.saveId ?? '0';
  return Math.floor(hashUnit(['pc-name', seed, salt].join('|')) * len) % len;
}

/** One seeded given name for this game, never a campaign NPC's name or one already in `skip`. */
export function pickPcGivenName(state?: GameState, salt = 'button', skip?: Set<string>): string {
  const list = RACE_NAME_BANKS[pcNameRaceKey(state)].given;
  const taken = campaignNameWords(state);
  const s = start(state, salt, list.length);
  for (let i = 0; i < list.length; i++) {
    const n = list[(s + i) % list.length]!;
    const k = n.toLowerCase();
    if (taken.has(k) || skip?.has(k)) continue;
    return n;
  }
  return list[s]!;
}

/** "Random designation": a seeded given name plus a surname or clan name from the same bank. */
export function pickPcDesignation(state?: GameState): string {
  const bank = RACE_NAME_BANKS[pcNameRaceKey(state)];
  const given = pickPcGivenName(state, 'button');
  const taken = campaignNameWords(state);
  const s = start(state, 'designation|surname', bank.surnames.length);
  for (let i = 0; i < bank.surnames.length; i++) {
    const sur = bank.surnames[(s + i) % bank.surnames.length]!;
    if (sur.toLowerCase().split(/\s+/).some((w) => w.length > 3 && taken.has(w))) continue;
    const full = `${given} ${sur}`;
    if (isLockablePcName(full)) return full;
  }
  return given;
}
