/**
 * Code-only sheet for generated townsfolk: job, motive, fear, way of speaking, secret.
 * Picked once on first meet and saved on the NpcMemory; the writer gets name, job, motive,
 * fear and speech only. Authored people (the Manus roster, bible keyNPCs) never get one.
 */
import archetypeData from '../../docs/research/manus-next-stage/npc-personalities.json';
import {
  MANUS_CK_NPCS,
  MANUS_SC_NPCS,
  MANUS_SP_NPCS,
  MANUS_SR_NPCS,
  MANUS_TF_NPCS,
} from '../data/campaigns/manusHonestRoster';
import type { GameState, NpcMemory, NpcSheet } from './types';
import type { NpcRole } from './npcRoleRegistry';
import { NPC_ROLE_REGISTRY } from './npcRoleRegistry';
import { createHashRng } from './seededRng';

type Archetype = {
  id: string;
  motivations: string[];
  fears: string[];
  secrets: string[];
  speechPatterns: { formality: string; tone: string };
};

export type SheetPlace = 'cell' | 'dungeon' | 'camp' | 'road' | 'inn' | 'town';

/** How an archetype's tone reads. A part inherits the moods of the archetype it came from. */
type Mood = 'cheer' | 'warm' | 'strain' | 'afraid' | 'threat' | 'bored';

const TONE_MOODS: Record<string, Mood[]> = {
  bright: ['cheer'], playful: ['cheer'], hopeful: ['cheer'], optimistic: ['cheer'], contagious: ['cheer'],
  animated: ['cheer'], enthusiastic: ['cheer'], excited: ['cheer'], funny: ['cheer'], bold: ['cheer'],
  hearty: ['cheer'], affable: ['cheer'], boastful: ['cheer'], charming: ['cheer'], teasing: ['cheer'],
  trusting: ['cheer'], cheerful: ['cheer'], theatrical: ['cheer'], impulsive: ['cheer'],
  warm: ['warm'], gentle: ['warm'], tender: ['warm'], compassionate: ['warm'], hospitable: ['warm'],
  kind: ['warm'], courteous: ['warm'], tactful: ['warm'], serene: ['warm'],
  bitter: ['strain'], tired: ['strain', 'bored'], guarded: ['strain'], haunted: ['strain'], wary: ['strain'],
  resentful: ['strain'], lonely: ['strain'], sad: ['strain'], hurt: ['strain'], burdened: ['strain'],
  grave: ['strain'], volatile: ['strain'], fierce: ['strain'], defensive: ['strain'], suspicious: ['strain'],
  brittle: ['strain'], exhausted: ['strain'], tense: ['strain', 'afraid'], worried: ['strain', 'afraid'],
  nervous: ['strain', 'afraid'], anxious: ['strain', 'afraid'], apologetic: ['afraid'], ashamed: ['strain', 'afraid'],
  cold: ['threat'], intimidating: ['threat'], detached: ['threat'], clinical: ['threat'], unsentimental: ['threat'],
  mocking: ['threat'], imperious: ['threat'], sharp: ['threat'], unsettling: ['threat'], calculating: ['threat'],
  dry: ['bored'], sardonic: ['bored'],
};

function toneMoods(tone: string): Set<Mood> {
  const out = new Set<Mood>();
  for (const raw of tone.split(',')) {
    const words = raw.trim().toLowerCase().split(/\s+/);
    // "unexpectedly kind" is a twist on the archetype, not how it reads first.
    if (words[0] === 'unexpectedly') continue;
    for (const m of TONE_MOODS[words[words.length - 1]] ?? []) out.add(m);
  }
  return out;
}

type Part = { text: string; from: string; moods: Set<Mood> };
type Kind = 'motive' | 'fear' | 'speech' | 'secret';

function formalityWord(f: string): string {
  if (f === 'high') return 'formal';
  if (f === 'low' || f === 'plain') return 'plain-spoken';
  return 'even';
}

const ARCHETYPES = archetypeData as Archetype[];

const PARTS: Record<Kind, Part[]> = (() => {
  const out: Record<Kind, Part[]> = { motive: [], fear: [], speech: [], secret: [] };
  for (const a of ARCHETYPES) {
    const moods = toneMoods(a.speechPatterns.tone);
    for (const t of a.motivations) out.motive.push({ text: t, from: a.id, moods });
    for (const t of a.fears) out.fear.push({ text: t, from: a.id, moods });
    for (const t of a.secrets) out.secret.push({ text: t, from: a.id, moods });
    out.speech.push({ text: `${a.speechPatterns.tone}, ${formalityWord(a.speechPatterns.formality)}`, from: a.id, moods });
  }
  return out;
})();

/** Who a place can hold. A cell, dungeon, camp, road and inn are different lists. */
const PLACE_JOBS: Record<SheetPlace, NpcRole[]> = {
  cell: ['captive', 'witness', 'informant', 'conspirator', 'sacrifice', 'gatekeeper', 'keeper'],
  dungeon: ['captive', 'sacrifice', 'refugee', 'keeper', 'gatekeeper', 'antagonist', 'bounty-target'],
  camp: ['guide', 'quest-patron', 'merchant', 'mentor', 'herald', 'courier', 'faction-envoy', 'informant', 'refugee', 'rival', 'gatekeeper'],
  road: ['courier', 'merchant', 'refugee', 'bounty-target', 'herald', 'rival', 'informant', 'guide'],
  inn: ['keeper', 'merchant', 'informant', 'witness', 'quest-patron', 'courier', 'mentor', 'rival'],
  town: ['merchant', 'informant', 'witness', 'artisan', 'courier', 'herald', 'quest-patron', 'refugee', 'gatekeeper', 'keeper'],
};

const LOCKED_UP: ReadonlySet<SheetPlace> = new Set(['cell', 'dungeon']);

/** What the place and job forbid for a part, and what the way of speaking must show. */
function placeFit(place: SheetPlace, job: NpcRole): { drop: (p: Part) => boolean; speechNeeds?: Mood[] } {
  const trapped = job === 'captive' || job === 'sacrifice' || (LOCKED_UP.has(place) && job === 'refugee');
  if (trapped) {
    // Trapped: not cheerful, not welcoming, not untouched by it.
    return {
      drop: (p) => p.moods.has('cheer') || (p.moods.has('warm') && !p.moods.has('strain')),
      speechNeeds: ['strain', 'afraid'],
    };
  }
  if (LOCKED_UP.has(place) && (job === 'keeper' || job === 'gatekeeper')) {
    // The one holding the keys is not the victim.
    return { drop: (p) => p.moods.has('afraid') };
  }
  if (place === 'road' && (job === 'bounty-target' || job === 'antagonist')) {
    return { drop: () => false, speechNeeds: ['bored', 'threat'] };
  }
  return { drop: () => false };
}

export function sheetPlaceFor(location: string | null | undefined): SheetPlace {
  const hay = (location ?? '').toLowerCase();
  if (/\b(?:cell|cells|jail|gaol|cage|prison|stocks|lock-?up)\b/.test(hay)) return 'cell';
  if (/\b(?:dungeon|crypt|crypts|undercroft|catacomb|cave|cavern|vault|barrow|tomb|shaft)\b/.test(hay)) return 'dungeon';
  if (/\bcamp\b|\bbivouac\b|\bpalisade\b/.test(hay)) return 'camp';
  if (/\b(?:road|lane|track|trail|path|highway|pass|ford)\b/.test(hay)) return 'road';
  if (/\b(?:inn|tavern|alehouse|taproom|hostel)\b/.test(hay)) return 'inn';
  return 'town';
}

const AUTHORED_NAMES: ReadonlySet<string> = new Set(
  [...MANUS_SP_NPCS, ...MANUS_CK_NPCS, ...MANUS_TF_NPCS, ...MANUS_SR_NPCS, ...MANUS_SC_NPCS]
    .flatMap((n) => [n.name, ...(n.aliases ?? [])])
    .map((n) => n.trim().toLowerCase()),
);

function isAuthored(name: string, memory: NpcMemory | undefined): boolean {
  if (AUTHORED_NAMES.has(name.trim().toLowerCase())) return true;
  return !!memory?.facts.some((f) => f.startsWith('Bible roster:'));
}

/** What the role is called in this place: a keeper at an inn is the innkeeper, in a cell the jailer. */
function jobLabel(place: SheetPlace, role: NpcRole): string {
  const locked = LOCKED_UP.has(place);
  if (role === 'keeper') return place === 'inn' ? 'innkeeper' : locked ? 'jailer' : place === 'camp' ? 'quartermaster' : 'keeper';
  if (role === 'gatekeeper') return locked ? 'guard' : 'gatekeeper';
  if (role === 'captive') return 'prisoner';
  if (role === 'bounty-target') return place === 'road' ? 'bandit' : 'outlaw';
  return role.replace(/-/g, ' ');
}

function isRole(v: string | undefined): v is NpcRole {
  return !!v && v in NPC_ROLE_REGISTRY;
}

/** Pure pick: same name + place + campaign always gives the same sheet. */
export function pickNpcSheet(name: string, place: SheetPlace, opts?: { campaignId?: string | null; roleHint?: string }): NpcSheet {
  const rng = createHashRng('npc-sheet', opts?.campaignId ?? '', name.trim().toLowerCase(), place);
  const jobs = PLACE_JOBS[place];
  const job: NpcRole = isRole(opts?.roleHint) ? opts!.roleHint as NpcRole : jobs[Math.floor(rng() * jobs.length)];
  const fit = placeFit(place, job);
  const used = new Set<string>();
  const pick = (kind: Kind): string => {
    const pool = PARTS[kind].filter((p) =>
      !used.has(p.from)
      && !fit.drop(p)
      && (kind !== 'speech' || !fit.speechNeeds || fit.speechNeeds.some((m) => p.moods.has(m))));
    if (!pool.length) return '';
    const chosen = pool[Math.floor(rng() * pool.length)];
    used.add(chosen.from);
    return chosen.text;
  };
  return {
    job: jobLabel(place, job),
    speech: pick('speech'),
    motive: pick('motive'),
    fear: pick('fear'),
    secret: pick('secret'),
    place,
  };
}

/**
 * First meet: pick and save a sheet on this person's memory. Later turns keep the saved sheet.
 * Authored people are returned unchanged.
 */
export function ensureNpcSheet(state: GameState, name: string, location?: string | null): GameState {
  const key = name.trim().toLowerCase();
  if (!key) return state;
  const list = state.npcMemories ?? [];
  const memory = list.find(
    (m) => m.npcName.toLowerCase() === key || (m.aliases ?? []).some((a) => a.toLowerCase() === key),
  );
  if (isAuthored(name, memory)) return state;
  if (memory?.sheet) return state;
  const sheet = pickNpcSheet(name, sheetPlaceFor(location ?? state.currentLocation), {
    campaignId: state.campaignBibleId,
    roleHint: memory?.roleHint,
  });
  if (memory) {
    return { ...state, npcMemories: list.map((m) => (m === memory ? { ...m, sheet } : m)) };
  }
  const fresh: NpcMemory = {
    npcId: `town-${key.replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
    npcName: name.trim(),
    disposition: 'unknown',
    facts: [],
    lastSeenTurn: state.turn,
    met: true,
    sheet,
  };
  return { ...state, npcMemories: [...list, fresh] };
}

/** What the writer may see: name, job, one motive, one fear, one way of speaking. Blank parts are left out. */
export function npcSheetWriterLine(name: string, sheet: NpcSheet | undefined): string {
  if (!sheet) return '';
  const bits = [
    sheet.motive && `wants: ${sheet.motive.toLowerCase()}`,
    sheet.fear && `fears: ${sheet.fear.toLowerCase()}`,
    sheet.speech && `speaks: ${sheet.speech}`,
  ].filter(Boolean);
  return `${name} (${sheet.job})${bits.length ? ` — ${bits.join('; ')}` : ''}`;
}
