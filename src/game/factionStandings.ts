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

const NPC_TO_FACTION: Array<{ re: RegExp; factionId: string }> = [
  { re: /\b(orel|vane|sera|quill|brother tam|tam|pellane|crown handler|chanter)\b/i, factionId: 'pellane-crown' },
  { re: /\b(cinder-ash|\bash\b|ash court|envoy)\b/i, factionId: 'ash-court' },
  { re: /\b(lowmarket|fence|kitchen|weighing cup|street)\b/i, factionId: 'valespire-street' },
  { re: /\b(lin vos|vos|mca|auditor)\b/i, factionId: 'mca' },
  { re: /\b(mara|keene|riftward|independents?|ashline)\b/i, factionId: 'independent-riftwards' },
  { re: /\b(pax|penny|orr|vesper|cartel)\b/i, factionId: 'vesper-cartel' },
  { re: /\b(sable|quiet hands|rhee)\b/i, factionId: 'quiet-hands' },
  { re: /\b(joss|vale)\b/i, factionId: 'mca' },
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
  for (const row of NPC_TO_FACTION) {
    if (row.re.test(hay)) return row.factionId;
  }
  return null;
}

export function seedFactionStandingsForBible(
  bible: CampaignBible | undefined | null
): FactionStanding[] {
  if (!bible) return [];
  if (bible.id === 'summoned-pact') return SUMMONED_PACT_FACTIONS.map((f) => ({ ...f }));
  if (bible.id === 'hero-awakening') return HERO_AWAKENING_FACTIONS.map((f) => ({ ...f }));
  if (bible.engineMode !== 'litrpg') return [];
  return bible.loreSnippets
    .filter((s) => s.category === 'faction')
    .slice(0, 6)
    .map((s) => ({
      id: s.id.replace(/^ha-lore-|^sp-lore-/, 'faction-'),
      name: s.title,
      standing: 'neutral' as FactionStandingLevel,
      influence: 0,
      notes: s.body.slice(0, 100),
    }));
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
  const delta = STANCE_DELTA[treatment];
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
