/**
 * XP-D1 OPEN — LitRPG Opening Rite table (single owner).
 * Engine reads this; AI text never sets XP. Tabletop / RPG / PYOA unused.
 */
export interface OpeningRiteBibleFields {
  id: string;
  title?: string;
  engineMode?: string;
  keyNPCs?: Array<{ name?: string }>;
}

export interface OpeningRiteEntry {
  scenarioId: string;
  /** Existing opening NPC / System entity from the scenario data. */
  giver: string;
  title: string;
  /** Writer must end the opening beat on this offer sentence. */
  offerSentence: string;
  acceptChip: string;
  refuseChip?: string;
  /** Diegetic System line (≤2 lines); may include `<name>`. Ends with level-up. */
  completionLine: string;
}

/** Authored Opening Rite per LitRPG scenario id. */
export const OPENING_RITE_TABLE: ReadonlyArray<OpeningRiteEntry> = [
  {
    scenarioId: 'summoned-pact',
    giver: 'High Chanter Orel Vane',
    title: 'Opening Rite: The Pact',
    offerSentence: 'Will you sign the pact?',
    acceptChip: 'Sign the pact',
    refuseChip: 'Refuse the pact',
    completionLine: 'Pact sealed. The System recognises you. Level 2.',
  },
  {
    scenarioId: 'system-integration',
    giver: 'the System',
    title: 'Opening Rite: Registration',
    offerSentence: 'Your planet has joined the System. Please give your name to register.',
    acceptChip: 'Give your name and register',
    refuseChip: 'Refuse to register',
    completionLine: 'Registration complete. Congratulations, <name>. Level 2.',
  },
  {
    scenarioId: 'hero-awakening',
    giver: 'Mara Keene',
    title: 'Opening Rite: The Awakening',
    offerSentence: 'Will you accept the awakening?',
    acceptChip: 'Accept the awakening',
    refuseChip: 'Refuse the awakening',
    completionLine: 'Awakening accepted. The Wake Ledger stamps you. Level 2.',
  },
  {
    scenarioId: 'void-audience',
    giver: 'The Auditor',
    title: 'Opening Rite: Trial Acceptance',
    offerSentence: 'Will you accept the rebirth trial terms?',
    acceptChip: 'Accept the trial terms',
    refuseChip: 'Refuse the trial',
    completionLine: 'Trial terms accepted. The Void Audience takes note. Level 2.',
  },
  {
    scenarioId: 'dungeon-transport',
    giver: 'the System',
    title: 'Opening Rite: Descent Mark',
    offerSentence: 'Will you take the Descent Mark and enter Floor 1?',
    acceptChip: 'Take the Descent Mark',
    refuseChip: 'Refuse the Mark',
    completionLine: 'Descent Mark applied. Floor 1 is open. Level 2.',
  },
  {
    scenarioId: 'fabled-legacy',
    giver: 'Old Brennan',
    title: 'Opening Rite: Village Oath',
    offerSentence: 'Will you take the village oath and stay for the harvest?',
    acceptChip: 'Take the village oath',
    refuseChip: 'Refuse the oath',
    completionLine: 'Oath taken. Mossford counts you among its own. Level 2.',
  },
  {
    scenarioId: 'ascending-spire',
    giver: 'Marshal Kade',
    title: 'Opening Rite: Climber Tag',
    offerSentence: 'Will you claim your Climber\u2019s Tag and enter the Spire?',
    acceptChip: 'Claim the Climber\u2019s Tag',
    refuseChip: 'Refuse the Tag',
    completionLine: 'Climber\u2019s Tag claimed. The Ranking Board lists you. Level 2.',
  },
  {
    scenarioId: 'inkbound-academy',
    giver: 'Dean Solenne',
    title: 'Opening Rite: House Enrollment',
    offerSentence: 'Will you enroll and claim your class?',
    acceptChip: 'Enroll and claim your class',
    refuseChip: 'Refuse enrollment',
    completionLine: 'Enrollment sealed. Your Class Codex unlocks. Level 2.',
  },
  {
    scenarioId: 'hollow-core',
    giver: 'Whisper-Mite',
    title: 'Opening Rite: Claim the Hollow',
    offerSentence: 'Will you claim the Hollow as your core?',
    acceptChip: 'Claim the Hollow',
    refuseChip: 'Refuse the claim',
    completionLine: 'Hollow claimed. Core binding holds. Level 2.',
  },
  {
    scenarioId: 'gatebreak-ward',
    giver: 'Sergeant Rill',
    title: 'Opening Rite: Ward Oath',
    offerSentence: 'Will you take the Ward oath and hold Ward 9?',
    acceptChip: 'Take the Ward oath',
    refuseChip: 'Refuse the oath',
    completionLine: 'Ward oath taken. Armband issued. Level 2.',
  },
  {
    scenarioId: 'blank-canvas',
    giver: 'the System',
    title: 'Opening Rite: Author\u2019s Stamp',
    offerSentence: 'Will you accept the Author\u2019s Authority and begin?',
    acceptChip: 'Accept the Author\u2019s Authority',
    refuseChip: 'Refuse the stamp',
    completionLine: 'Authority accepted. Your story is stamped. Level 2.',
  },
];

const BY_ID = new Map(OPENING_RITE_TABLE.map((e) => [e.scenarioId, e]));

export function authoredOpeningRite(scenarioId: string | null | undefined): OpeningRiteEntry | undefined {
  if (!scenarioId) return undefined;
  return BY_ID.get(scenarioId);
}

/**
 * Generic fallback when a LitRPG bible has no authored row.
 * Derived from scenario fields only — never invents a novel scenario id.
 */
export function fallbackOpeningRite(bible: OpeningRiteBibleFields): OpeningRiteEntry | null {
  if (bible.engineMode !== 'litrpg') return null;
  const giver = bible.keyNPCs?.[0]?.name?.trim() || 'the System';
  const short = (bible.title ?? 'this world').replace(/\s*\(.*\)\s*$/, '').trim() || 'this world';
  return {
    scenarioId: bible.id,
    giver,
    title: `Opening Rite: Begin ${short}`,
    offerSentence: `Will you accept your place in ${short}?`,
    acceptChip: `Accept your place in ${short}`,
    refuseChip: 'Refuse',
    completionLine: `Accepted. The System welcomes you to ${short}. Level 2.`,
  };
}

/** Resolve authored row or a valid fallback for any LitRPG bible. */
export function resolveOpeningRiteEntry(bible: OpeningRiteBibleFields | null | undefined): OpeningRiteEntry | null {
  if (!bible || bible.engineMode !== 'litrpg') return null;
  return authoredOpeningRite(bible.id) ?? fallbackOpeningRite(bible);
}
