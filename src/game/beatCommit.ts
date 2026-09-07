/**
 * BeatCommit — validate GM atmosphere against a pre-GM systems commit (02ac Phase 1).
 * Violations are logged; they never block the turn (prose is secondary).
 */

export type BeatType =
  | 'combat'
  | 'quest_stage'
  | 'travel'
  | 'dialogue'
  | 'loot'
  | 'crisis'
  | 'branch';

export interface BeatCommit {
  type: BeatType;
  hpDeltas: Array<{
    target: 'player' | 'enemy';
    amount: number;
    reason: string;
  }>;
  xpAward?: {
    amount: number;
    reason: string;
  };
  questUpdate?: {
    questId: string;
    objectiveIndex?: number;
    newStatus?: 'active' | 'completed' | 'failed';
  };
  encounterSpawn?: {
    name: string;
    hp: number;
    maxHp: number;
    level: number;
    xpReward: number;
  };
  statusText: string;
  proseHints: string[];
  wordCountTarget: number;
}

export function validateProseAgainstBeat(
  beat: BeatCommit,
  prose: string
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const body = (prose ?? '').trim();
  const lower = body.toLowerCase();
  if (!body) {
    return { valid: false, violations: ['Empty prose'] };
  }

  for (const delta of beat.hpDeltas) {
    if (delta.target === 'player' && delta.amount < 0) {
      if (!/(hit|struck|cut|wounded|damage|hurt|pain)/i.test(body)) {
        violations.push('Player damage not narrated');
      }
    }
    if (delta.target === 'enemy' && delta.amount < 0) {
      if (!/(blade|strike|hit|lands|cuts|pierces|damage)/i.test(body)) {
        violations.push('Enemy damage not narrated');
      }
    }
  }

  if (beat.encounterSpawn) {
    const name = beat.encounterSpawn.name.toLowerCase();
    if (!lower.includes(name) && !/(enemy|threat|foe|figure|skirmish|hunter|bandit)/i.test(body)) {
      violations.push(`Encounter spawn not narrated: ${beat.encounterSpawn.name}`);
    }
  }

  if (beat.questUpdate) {
    if (!/(quest|objective|task|mission|price|reason|charter)/i.test(body)) {
      violations.push('Quest update not narrated');
    }
  }

  for (const hint of beat.proseHints) {
    const keywords = hint.toLowerCase().match(/\b\w{4,}\b/g) ?? [];
    if (keywords.length && !keywords.some((kw) => lower.includes(kw))) {
      violations.push(`Prose hint not honored: ${hint.slice(0, 40)}`);
    }
  }

  return { valid: violations.length === 0, violations };
}

export function beatCommitFromReceipts(opts: {
  type: BeatType;
  receipts: string[];
  xpAwards?: Array<{ amount: number; reason: string }>;
  proseHints?: string[];
  encounterName?: string;
}): BeatCommit {
  const xp = opts.xpAwards?.[0];
  const enc = opts.receipts.find((r) => /^Encounter:/i.test(r));
  const name =
    opts.encounterName ??
    enc?.replace(/^Encounter:\s*/i, '').replace(/\s+\(.*\)$/, '').trim();
  return {
    type: opts.type,
    hpDeltas: [],
    xpAward: xp ? { amount: xp.amount, reason: xp.reason } : undefined,
    encounterSpawn: name
      ? { name, hp: 16, maxHp: 16, level: 1, xpReward: xp?.amount ?? 25 }
      : undefined,
    statusText: opts.receipts.join(' · '),
    proseHints: opts.proseHints ?? [],
    wordCountTarget: 80,
  };
}
