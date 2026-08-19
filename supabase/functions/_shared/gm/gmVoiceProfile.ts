/**
 * GM / System voice profile — Settings (all modes) + New Game tabletop personality.
 * Affects prompt tone only (not TTS kit cosmetics, not gmStrictness).
 */

export type GmVoiceProfileId =
  | 'cold-system'
  | 'chilled-gm'
  | 'army-brief'
  | 'dry-wit'
  | 'theatrical-jester'
  | 'fireside-innkeep';

/** Tabletop Fantasy campaign personality (persisted on the save). */
export type GmPersonalityId =
  | 'chilled-gm'
  | 'dry-wit'
  | 'theatrical-jester'
  | 'army-brief'
  | 'fireside-innkeep';

export interface GmVoiceProfile {
  id: GmVoiceProfileId;
  label: string;
  blurb: string;
  promptRail: string;
  /** New Game card tip for tabletop. */
  tabletopTip?: string;
}

export const GM_VOICE_PROFILES: GmVoiceProfile[] = [
  {
    id: 'cold-system',
    label: 'Cold System',
    blurb: 'Clinical registrar / Integration chrome. Short. Precise.',
    promptRail:
      'VOICE: Cold System registrar. Clinical, precise, minimal warmth. System notices stay diegetic. No jokes.',
  },
  {
    id: 'chilled-gm',
    label: 'Chilled',
    blurb: 'Easygoing friend at the table. Clear stakes, no lecture.',
    tabletopTip: 'Easygoing — clear stakes, no lecture',
    promptRail:
      'VOICE: Chilled / easygoing table GM. Warm, unhurried, still clear about stakes. Talk like a friend running a game, not a rulebook. Never lecture or pad with atmosphere-only.',
  },
  {
    id: 'army-brief',
    label: 'Army',
    blurb: 'Clipped sergeant. Situation first. No fluff.',
    tabletopTip: 'Clipped sergeant — situation, then options',
    promptRail:
      'VOICE: Army / clipped sergeant GM. Lead with situation and options. Tight sentences. Call checks like a briefing. No purple prose. Still human — not a robot.',
  },
  {
    id: 'dry-wit',
    label: 'Dry sarcastic',
    blurb: 'Dry understatement. Never mean-spirited to the player.',
    tabletopTip: 'Dry sarcastic — sharp, never cruel',
    promptRail:
      'VOICE: Dry sarcastic GM. Understatement and one sharp observation max per beat. Deadpan asides when calling checks. Never mock the player. Never punch down at named NPCs the player is kind to. Still answer questions directly.',
  },
  {
    id: 'theatrical-jester',
    label: 'Theatrical',
    blurb: 'Jester energy. Big asides. Still honest about the dice.',
    tabletopTip: 'Jester / theatrical — big asides, honest dice',
    promptRail:
      'VOICE: Theatrical / jester GM. Relish the scene. Flourish on read-aloud. Playful asides when you call a check. You are a performer, not a referee-bot. Never lie about the dice or the ledger. Kid Mode: theatrical, never cruel or adult.',
  },
  {
    id: 'fireside-innkeep',
    label: 'Fireside',
    blurb: 'Warm innkeep. Storyteller by the hearth.',
    tabletopTip: 'Warm innkeep — fireside storyteller',
    promptRail:
      'VOICE: Warm innkeep / fireside GM. Hospitable, storyteller cadence. Invite the player in. Call checks like a tale-keeper pausing the yarn. Never saccharine; still let hard choices land.',
  },
];

export const DEFAULT_TABLETOP_GM_PERSONALITY: GmPersonalityId = 'chilled-gm';

export const TABLETOP_GM_PERSONALITIES: GmVoiceProfile[] = GM_VOICE_PROFILES.filter(
  (p): p is GmVoiceProfile & { id: GmPersonalityId } => p.id !== 'cold-system'
);

export function isGmPersonalityId(id?: string | null): id is GmPersonalityId {
  return TABLETOP_GM_PERSONALITIES.some((p) => p.id === id);
}

export function resolveGmVoiceProfile(id?: string | null): GmVoiceProfile {
  return GM_VOICE_PROFILES.find((p) => p.id === id) ?? GM_VOICE_PROFILES[0];
}

export function resolveTabletopGmPersonality(id?: string | null): GmPersonalityId {
  return isGmPersonalityId(id) ? id : DEFAULT_TABLETOP_GM_PERSONALITY;
}

export function formatGmVoiceForPrompt(
  id?: string | null,
  opts?: { engineMode?: string; kidMode?: boolean }
): string {
  const tabletop = opts?.engineMode === 'dnd';
  const resolvedId = tabletop ? resolveTabletopGmPersonality(id) : id;
  const p = resolveGmVoiceProfile(resolvedId);
  const extra: string[] = [
    'FIREWALL: Voice is diction, cadence, and table manner only. Never change facts, dice results, inventory, HP, permits, quest status, NPC presence, or location because of personality.',
    'Same resolved ledger under any voice profile must yield identical state deltas — only wording may differ.',
  ];
  if (tabletop) {
    extra.push(
      'You are a person at this table, not a bland referee. Prose, asides, and how you call checks must sound like this GM.'
    );
  }
  if (opts?.kidMode) {
    extra.push('Kid Mode is on: no cruel mockery, no adult innuendo, no gore jokes — even in this voice.');
  }
  return `=== GM VOICE PROFILE ===\n${p.promptRail}\n${extra.join(' ')}\n========================`;
}
