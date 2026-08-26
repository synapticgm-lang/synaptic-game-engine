/**
 * Deterministic faction standings — seed from bible, mutate on stance / quest.
 * No Continuity-Warden LLM; writer narrates, code owns the matrix.
 */

import type { CampaignBible } from '@/data/campaigns/types';
import type { FactionStanding, FactionStandingLevel, WorldLedger } from './types';
import { normalizeWorldLedger } from './worldSim';

export function standingFromInfluence(influence: number): FactionStandingLevel {
  if (influence <= -40) return 'hostile';
  if (influence <= -15) return 'unfriendly';
  if (influence >= 40) return 'allied';
  if (influence >= 15) return 'friendly';
  return 'neutral';
}

function clampInfluence(n: number): number {
  return Math.max(-100, Math.min(100, Math.round(n)));
}

function withStanding(f: FactionStanding, delta: number, note?: string): FactionStanding {
  const influence = clampInfluence((f.influence ?? 0) + delta);
  return {
    ...f,
    influence,
    standing: standingFromInfluence(influence),
    notes: note?.trim() ? note.trim().slice(0, 120) : f.notes,
  };
}

/** Summoned Pact — original polity names only. */
export const SUMMONED_PACT_FACTIONS: FactionStanding[] = [
  {
    id: 'pellane-crown',
    name: 'Pellane Crown',
    standing: 'neutral',
    influence: 0,
    notes: 'They paid for a Pactborn. You have not sworn yet.',
  },
  {
    id: 'ash-court',
    name: 'Ash Court',
    standing: 'neutral',
    influence: 0,
    notes: 'Rival polity east of the Cinderflow. Watching the Mark.',
  },
  {
    id: 'valespire-street',
    name: 'Valespire Street',
    standing: 'neutral',
    influence: 0,
    notes: 'Lowmarket, kitchens, and ordinary people.',
  },
];

/** Hero Awakening — original agency / crew names only. */
export const HERO_AWAKENING_FACTIONS: FactionStanding[] = [
  {
    id: 'mca',
    name: 'Meridian Clearance Authority',
    standing: 'neutral',
    influence: 0,
    notes: 'Licenses crews and stamps Grades.',
  },
  {
    id: 'independent-riftwards',
    name: 'Independent Riftwards',
    standing: 'friendly',
    influence: 8,
    notes: 'Scrap clears and shared pay. Often first friendly face.',
  },
  {
    id: 'vesper-cartel',
    name: 'Vesper Cartel',
    standing: 'unfriendly',
    influence: -10,
    notes: 'Black-market Threshold loot and fake stamps.',
  },
  {
    id: 'quiet-hands',
    name: 'Quiet Hands',
    standing: 'neutral',
    influence: 0,
    notes: 'Research circle — curious about Wake Ledgers.',
  },
];


/** Named bible-grounded faction contacts — stance against these moves the matrix reliably. */
export type FactionContact = {
  name: string;
  aliases: string[];
  factionId: string;
  /** Multiplier on stance delta (default 1). */
  weight?: number;
  hubIds?: string[];
};

export const FACTION_CONTACTS: FactionContact[] = [
  // Summoned Pact
  { name: 'High Chanter Orel Vane', aliases: ['orel vane', 'orel', 'high chanter'], factionId: 'pellane-crown', weight: 1.75, hubIds: ['sp-hub-cathedral-close', 'sp-hub-contract-hall'] },
  { name: 'Captain Sera Quill', aliases: ['sera quill', 'sera', 'quill', 'captain sera'], factionId: 'pellane-crown', weight: 1.75, hubIds: ['sp-hub-contract-hall', 'sp-hub-war-camp', 'sp-hub-cathedral-close'] },
  { name: 'Brother Tam', aliases: ['brother tam', 'tam'], factionId: 'valespire-street', weight: 1.5, hubIds: ['sp-hub-weighing-cup', 'sp-hub-cathedral-close'] },
  { name: 'Envoy Cinder-Ash', aliases: ['cinder-ash', 'envoy cinder', 'ash envoy'], factionId: 'ash-court', weight: 1.75, hubIds: ['sp-hub-cinderflow'] },
  { name: 'Lowmarket Fence', aliases: ['the fence', 'lowmarket fence'], factionId: 'valespire-street', weight: 1.5, hubIds: ['sp-hub-lowmarket'] },
  { name: 'Wall Sergeant', aliases: ['wall sergeant', 'west wall sergeant'], factionId: 'pellane-crown', weight: 1.25, hubIds: ['sp-hub-west-wall'] },
  { name: 'Crown Clerk', aliases: ['crown clerk', 'palace clerk'], factionId: 'pellane-crown', weight: 1.25, hubIds: ['sp-hub-palace', 'sp-hub-contract-hall'] },
  { name: 'Quay Fence', aliases: ['quay fence', 'harbor fence'], factionId: 'valespire-street', weight: 1.25, hubIds: ['sp-hub-harbor'] },
  // Hero Awakening
  { name: 'Mara Keene', aliases: ['mara keene', 'mara'], factionId: 'independent-riftwards', weight: 1.75, hubIds: ['ha-hub-ashline', 'ha-hub-low-watt'] },
  { name: 'Lin Vos', aliases: ['lin vos', 'auditor lin', 'vos'], factionId: 'mca', weight: 1.75, hubIds: ['ha-hub-mca-desk'] },
  { name: 'Pax Orr', aliases: ['pax orr', 'pax', 'penny orr', 'penny'], factionId: 'vesper-cartel', weight: 1.75, hubIds: ['ha-hub-scrap'] },
  { name: 'Dr. Rhee', aliases: ['dr rhee', 'rhee'], factionId: 'quiet-hands', weight: 1.5, hubIds: ['ha-hub-ward-rest'] },
  { name: 'Joss Vale', aliases: ['joss vale', 'joss'], factionId: 'mca', weight: 1.5, hubIds: ['ha-hub-ashline'] },
  { name: 'Sable', aliases: ['sable'], factionId: 'quiet-hands', weight: 1.75, hubIds: ['ha-hub-archive'] },
  // System Integration
  { name: 'Elise Cho', aliases: ['elise cho', 'warden elise', 'elise'], factionId: 'riverside-stronghold', weight: 1.75, hubIds: ['si-hub-riverside'] },
  { name: 'Marcus Reyes', aliases: ['marcus reyes', 'tunnel', 'marcus'], factionId: 'tunnel-network', weight: 1.5, hubIds: ['si-hub-dead-border', 'si-hub-corridor'] },
  // Gatebreak Ward
  { name: 'Sergeant Rill', aliases: ['sergeant rill', 'rill'], factionId: 'ward-9-militia', weight: 1.75, hubIds: ['gw-hub-militia', 'gw-hub-shelter'] },
  { name: 'Vex Harlan', aliases: ['vex harlan', 'vex'], factionId: 'licensed-hunters', weight: 1.75, hubIds: ['gw-hub-guild'] },
  // Ascending Spire
  { name: 'Marshal Kade', aliases: ['marshal kade', 'kade'], factionId: 'spire-gate', weight: 1.5, hubIds: ['as-hub-gate', 'as-hub-broker'] },
  { name: 'Nyra Vell', aliases: ['nyra vell', 'nyra'], factionId: 'rival-climbers', weight: 1.75, hubIds: ['as-hub-rival', 'as-hub-camp'] },
  // Fabled Legacy
  { name: 'Old Brennan', aliases: ['old brennan', 'brennan'], factionId: 'mossford-village', weight: 1.5, hubIds: ['fl-hub-chapel', 'fl-hub-square'] },
  { name: 'Marta', aliases: ['marta'], factionId: 'mossford-village', weight: 1.5, hubIds: ['fl-hub-smithy'] },
  { name: 'Corvin', aliases: ['corvin', 'the stranger'], factionId: 'mossford-village', weight: 1.25, hubIds: ['fl-hub-inn'] },
  // Cursed Keep
  { name: 'Oskar', aliases: ['oskar', 'the woodcutter'], factionId: 'greyhollow-town', weight: 1.5, hubIds: ['ck-hub-inn'] },
  { name: 'Father Aldous', aliases: ['father aldous', 'aldous'], factionId: 'greyhollow-town', weight: 1.75, hubIds: ['ck-hub-church'] },
  { name: 'Mira', aliases: ['mira', 'mira the apothecary'], factionId: 'greyhollow-town', weight: 1.5, hubIds: ['ck-hub-apothecary'] },
  { name: 'Greta', aliases: ['greta', 'greta the hunter'], factionId: 'greyhollow-town', weight: 1.5, hubIds: ['ck-hub-treeline', 'ck-hub-gate'] },
  // Salt Road Heist
  { name: 'Vessa', aliases: ['vessa'], factionId: 'vessa-crew', weight: 1.75, hubIds: ['sr-hub-safehouse', 'sr-hub-waystation'] },
];

export function matchFactionContact(haystack: string): FactionContact | null {
  const hay = haystack.toLowerCase();
  let best: FactionContact | null = null;
  let bestLen = 0;
  for (const c of FACTION_CONTACTS) {
    const keys = [c.name, ...c.aliases].map((k) => k.toLowerCase());
    for (const k of keys) {
      if (k.length >= 3 && hay.includes(k) && k.length > bestLen) {
        best = c;
        bestLen = k.length;
      }
    }
  }
  return best;
}

const NPC_TO_FACTION: Array<{ re: RegExp; factionId: string }> = [
  { re: /\b(orel|vane|sera|quill|pellane|crown handler|chanter|wall sergeant|crown clerk)\b/i, factionId: 'pellane-crown' },
  { re: /\b(cinder-ash|ash court|envoy cinder)\b/i, factionId: 'ash-court' },
  { re: /\b(brother tam|\btam\b|lowmarket|fence|kitchen|weighing cup|quay fence)\b/i, factionId: 'valespire-street' },
  { re: /\b(lin vos|\bvos\b|mca|auditor)\b/i, factionId: 'mca' },
  { re: /\b(mara|keene|riftward|independents?|ashline)\b/i, factionId: 'independent-riftwards' },
  { re: /\b(pax|penny|orr|vesper|cartel)\b/i, factionId: 'vesper-cartel' },
  { re: /\b(sable|quiet hands|rhee)\b/i, factionId: 'quiet-hands' },
  { re: /\b(joss|vale)\b/i, factionId: 'mca' },
  { re: /\b(elise|cho|riverside|warden)\b/i, factionId: 'riverside-stronghold' },
  { re: /\b(marcus|reyes|tunnel)\b/i, factionId: 'tunnel-network' },
  { re: /\b(rill|militia|ward\s*9)\b/i, factionId: 'ward-9-militia' },
  { re: /\b(vex|harlan|licensed\s+hunter)\b/i, factionId: 'licensed-hunters' },
  { re: /\b(kade|marshal|spire\s+gate)\b/i, factionId: 'spire-gate' },
  { re: /\b(nyra|vell|rival\s+climber)\b/i, factionId: 'rival-climbers' },
  { re: /\b(brennan|marta|corvin|fen|mossford)\b/i, factionId: 'mossford-village' },
  { re: /\b(aelmark|thornhaven|aldric)\b/i, factionId: 'aelmark-crown' },
  { re: /\b(oskar|aldous|mira|greta|greyhollow|helga)\b/i, factionId: 'greyhollow-town' },
  { re: /\b(vessa|crew\s+fixer)\b/i, factionId: 'vessa-crew' },
  { re: /\b(consul|caravan\s+guard|salt\s+tax)\b/i, factionId: 'consul-road' },
];

export type StanceTreatment = 'kind' | 'hard' | 'curious' | 'walkaway';

export function detectStanceTreatment(action: string): StanceTreatment | null {
  const a = action.toLowerCase();
  if (
    /\b(threaten|refuse|insult|steal|demand|lie|attack|intimidate|shove|rob)\b/i.test(a)
    && !/\b(help|heal|spare|thank|apologiz|give|share|comfort|protect|honest|kind|offer)\b/i.test(a)
  ) {
    return 'hard';
  }
  if (/\b(help|heal|spare|thank|apologiz|give|share|comfort|protect|honest|kind|offer)\b/i.test(a)) {
    return 'kind';
  }
  if (/\b(walk away|leave|go another|another direction|ignore)\b/i.test(a)) return 'walkaway';
  if (/\b(ask|talk|speak|bargain|negotiat|listen|chat|hang out)\b/i.test(a)) return 'curious';
  return null;
}

function resolveTargetFactionId(action: string, presentNames: string[]): string | null {
  const hay = `${action} ${presentNames.join(' ')}`;
  const contact = matchFactionContact(hay);
  if (contact) return contact.factionId;
  for (const row of NPC_TO_FACTION) {
    if (row.re.test(hay)) return row.factionId;
  }
  return null;
}

function contactWeight(action: string, presentNames: string[]): number {
  const contact = matchFactionContact(`${action} ${presentNames.join(' ')}`);
  return contact?.weight ?? 1;
}

/** Curated thin matrices for ported sandboxes (original names only). */
export const SYSTEM_INTEGRATION_FACTIONS: FactionStanding[] = [
  { id: 'riverside-stronghold', name: 'Riverside Stronghold', standing: 'neutral', influence: 0, notes: 'Sanctioned hub — Wave duty for housing.' },
  { id: 'tunnel-network', name: 'Tunnel Network', standing: 'neutral', influence: 0, notes: 'Guides who work dead zones for a price.' },
];

export const GATEBREAK_WARD_FACTIONS: FactionStanding[] = [
  { id: 'ward-9-militia', name: 'Ward 9 Militia', standing: 'friendly', influence: 6, notes: 'Protect civilians first; licenses later.' },
  { id: 'licensed-hunters', name: 'Licensed Hunters', standing: 'unfriendly', influence: -6, notes: 'Guild cut of gate loot — smiles like a contract.' },
];

export const ASCENDING_SPIRE_FACTIONS: FactionStanding[] = [
  { id: 'spire-gate', name: 'Spire Gate Authority', standing: 'neutral', influence: 0, notes: 'Permits, intel buyers, Ranking Board.' },
  { id: 'rival-climbers', name: 'Rival Climbers', standing: 'neutral', influence: 0, notes: 'May ally — or steal your clear credit.' },
];

export const FABLED_LEGACY_FACTIONS: FactionStanding[] = [
  { id: 'mossford-village', name: 'Mossford Village', standing: 'friendly', influence: 5, notes: 'Quiet valley people who prefer to stay forgotten.' },
  { id: 'aelmark-crown', name: 'Kingdom of Aelmark', standing: 'neutral', influence: 0, notes: 'Distant crown — suddenly interested in the hills.' },
];

export const CURSED_KEEP_FACTIONS: FactionStanding[] = [
  { id: 'greyhollow-town', name: 'Greyhollow Town', standing: 'neutral', influence: 0, notes: 'Denial is the local religion — until the dead walk.' },
];

export const SALT_ROAD_FACTIONS: FactionStanding[] = [
  { id: 'vessa-crew', name: "Vessa's Crew", standing: 'friendly', influence: 8, notes: 'One score. Heat decides who you still trust.' },
  { id: 'consul-road', name: "Consul's Road Guard", standing: 'unfriendly', influence: -8, notes: 'Protect the salt-tax ledger at all costs.' },
];

const CURATED_FACTIONS: Record<string, FactionStanding[]> = {
  'summoned-pact': SUMMONED_PACT_FACTIONS,
  'hero-awakening': HERO_AWAKENING_FACTIONS,
  'system-integration': SYSTEM_INTEGRATION_FACTIONS,
  'gatebreak-ward': GATEBREAK_WARD_FACTIONS,
  'ascending-spire': ASCENDING_SPIRE_FACTIONS,
  'fabled-legacy': FABLED_LEGACY_FACTIONS,
  'cursed-keep': CURSED_KEEP_FACTIONS,
  'salt-road-heist': SALT_ROAD_FACTIONS,
};

const SANDBOX_ENGINE_MODES = new Set(['litrpg', 'dnd', 'rpg']);

function factionIdFromLore(id: string, title: string): string {
  const fromId = id.replace(/^(ha|sp|si|fl|ck|va|dt)-lore-\d+$/i, '').trim();
  if (fromId && fromId !== id) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'faction';
  }
  return (
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
    || id.replace(/[^a-z0-9]+/g, '-').slice(0, 40)
    || 'faction'
  );
}

/** Seed from bible loreSnippets (faction) — litrpg / dnd / rpg only. Never PYOA. */
function seedFactionsFromLore(bible: CampaignBible): FactionStanding[] {
  return bible.loreSnippets
    .filter((s) => s.category === 'faction')
    .slice(0, 6)
    .map((s) => ({
      id: factionIdFromLore(s.id, s.title),
      name: s.title,
      standing: 'neutral' as FactionStandingLevel,
      influence: 0,
      notes: s.body.slice(0, 100),
    }));
}

export function seedFactionStandingsForBible(
  bible: CampaignBible | undefined | null
): FactionStanding[] {
  if (!bible) return [];
  // PYOA Mode DNA forbids open-sandbox hubs/factions; blank shells stay empty.
  if (bible.engineMode === 'pyoa') return [];
  if (bible.id.startsWith('blank-canvas')) return [];
  const curated = CURATED_FACTIONS[bible.id];
  if (curated?.length) return curated.map((f) => ({ ...f }));
  if (!SANDBOX_ENGINE_MODES.has(bible.engineMode)) return [];
  const fromLore = seedFactionsFromLore(bible);
  if (fromLore.length) return fromLore;
  return [];
}

export function seedWorldLedgerFactions(
  ledger: WorldLedger | undefined | null,
  bible: CampaignBible | undefined | null
): WorldLedger {
  const next = normalizeWorldLedger(ledger);
  if ((next.factionStandings?.length ?? 0) > 0) return next;
  const seeded = seedFactionStandingsForBible(bible);
  if (!seeded.length) return next;
  return { ...next, factionStandings: seeded };
}

const STANCE_DELTA: Record<StanceTreatment, number> = {
  kind: 6,
  curious: 3,
  walkaway: -2,
  hard: -8,
};

/** Small deterministic standing shift from how the player treats a faction-linked person. */
export function mutateFactionOnStance(
  standings: FactionStanding[] | undefined,
  playerAction: string,
  presentNames: string[] = []
): FactionStanding[] {
  const list = [...(standings ?? [])];
  if (!list.length) return list;
  const treatment = detectStanceTreatment(playerAction);
  if (!treatment) return list;
  const factionId = resolveTargetFactionId(playerAction, presentNames);
  if (!factionId) return list;
  const weight = contactWeight(playerAction, presentNames);
  const delta = Math.round(STANCE_DELTA[treatment] * weight);
  return list.map((f) => {
    if (f.id !== factionId) {
      if (
        (factionId === 'pellane-crown' && f.id === 'ash-court' && treatment === 'kind')
        || (factionId === 'ash-court' && f.id === 'pellane-crown' && treatment === 'kind')
      ) {
        return withStanding(f, -2);
      }
      if (
        (factionId === 'mca' && f.id === 'vesper-cartel' && treatment === 'kind')
        || (factionId === 'vesper-cartel' && f.id === 'mca' && treatment === 'kind')
      ) {
        return withStanding(f, -2);
      }
      return f;
    }
    return withStanding(
      f,
      delta,
      treatment === 'kind'
        ? 'Remembered a kindness.'
        : treatment === 'hard'
          ? 'Remembered a hard refusal.'
          : treatment === 'walkaway'
            ? 'Noted you walked away.'
            : 'Talked with you.'
    );
  });
}

export type QuestFactionEvent = 'accept' | 'complete' | 'fail';

const QUEST_FACTION_DELTAS: Record<
  string,
  Partial<Record<QuestFactionEvent, Array<{ id: string; delta: number }>>>
> = {
  'sp-quest-1': {
    accept: [{ id: 'pellane-crown', delta: 4 }],
    complete: [{ id: 'pellane-crown', delta: 8 }, { id: 'valespire-street', delta: 4 }],
    fail: [{ id: 'pellane-crown', delta: -6 }],
  },
  'sp-quest-side-junk': {
    accept: [{ id: 'valespire-street', delta: 3 }],
    complete: [{ id: 'valespire-street', delta: 6 }, { id: 'pellane-crown', delta: -2 }],
    fail: [{ id: 'valespire-street', delta: -3 }],
  },
  'sp-quest-side-child': {
    accept: [{ id: 'valespire-street', delta: 4 }],
    complete: [{ id: 'valespire-street', delta: 8 }, { id: 'pellane-crown', delta: 2 }],
    fail: [{ id: 'valespire-street', delta: -5 }],
  },
  'sp-quest-special-other': {
    complete: [{ id: 'ash-court', delta: 4 }, { id: 'pellane-crown', delta: -2 }],
  },
  'sp-quest-special-ledger': {
    complete: [{ id: 'pellane-crown', delta: -8 }, { id: 'ash-court', delta: 4 }],
    fail: [{ id: 'pellane-crown', delta: 2 }],
  },
  'ha-quest-1': {
    accept: [{ id: 'independent-riftwards', delta: 3 }],
    complete: [{ id: 'independent-riftwards', delta: 6 }],
    fail: [{ id: 'independent-riftwards', delta: -4 }],
  },
  'ha-quest-2': {
    accept: [{ id: 'independent-riftwards', delta: 5 }],
    complete: [{ id: 'independent-riftwards', delta: 10 }, { id: 'mca', delta: 2 }],
    fail: [{ id: 'independent-riftwards', delta: -6 }],
  },
  'ha-quest-side-fence': {
    accept: [{ id: 'vesper-cartel', delta: 4 }],
    complete: [{ id: 'vesper-cartel', delta: 8 }, { id: 'mca', delta: -4 }],
    fail: [{ id: 'vesper-cartel', delta: -3 }],
  },
  'ha-quest-side-rival': {
    complete: [{ id: 'mca', delta: 4 }, { id: 'independent-riftwards', delta: 2 }],
  },
  'ha-quest-special-name': {
    complete: [{ id: 'quiet-hands', delta: 8 }, { id: 'mca', delta: -2 }],
  },
  'ha-quest-special-second': {
    complete: [{ id: 'quiet-hands', delta: 6 }, { id: 'mca', delta: -4 }],
  },
};

export function mutateFactionOnQuestEvent(
  standings: FactionStanding[] | undefined,
  questId: string | undefined,
  event: QuestFactionEvent
): FactionStanding[] {
  const list = [...(standings ?? [])];
  if (!list.length || !questId) return list;
  const deltas = QUEST_FACTION_DELTAS[questId]?.[event];
  if (!deltas?.length) return list;
  return list.map((f) => {
    const hit = deltas.find((d) => d.id === f.id);
    if (!hit) return f;
    return withStanding(
      f,
      hit.delta,
      event === 'complete'
        ? 'Quest outcome shifted standing.'
        : event === 'fail'
          ? 'Failed hook cooled standing.'
          : 'Accepted a hook.'
    );
  });
}
