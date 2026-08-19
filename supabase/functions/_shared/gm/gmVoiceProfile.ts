/**
 * GM / System voice profile — Settings (all modes) + New Game tabletop / LitRPG personality.
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

/** LitRPG System personality (persisted on the save). In-world chrome, not a table GM. */
export type SystemPersonalityId =
  | 'cold-system'
  | 'dry-wit'
  | 'army-brief'
  | 'theatrical-jester'
  | 'chilled-gm';

export interface GmVoiceProfile {
  id: GmVoiceProfileId;
  label: string;
  blurb: string;
  promptRail: string;
  /** New Game card tip for tabletop. */
  tabletopTip?: string;
  /** New Game card title for LitRPG (System, not GM). */
  litrpgLabel?: string;
  /** New Game card tip for LitRPG. */
  litrpgTip?: string;
  /** LitRPG prompt override — System panels, not a person at a table. */
  litrpgPromptRail?: string;
}

export const GM_VOICE_FIREWALL =
  'FIREWALL: Voice is diction, cadence, and table manner only. Never change facts, dice results, inventory, HP, permits, quest status, NPC presence, or location because of personality.';

export const GM_VOICE_PROFILES: GmVoiceProfile[] = [
  {
    id: 'cold-system',
    label: 'Cold System',
    blurb: 'Clinical registrar / Integration chrome. Short. Precise.',
    litrpgLabel: 'Cold registrar',
    litrpgTip: 'Clinical panels — short, precise, no jokes',
    promptRail:
      'VOICE: Cold System registrar. Clinical, precise, minimal warmth. System notices stay diegetic. No jokes.',
    litrpgPromptRail:
      'VOICE: Cold System registrar. You ARE the in-world System (panels, notices, registration). Clinical, precise, minimal warmth. No jokes. Notices stay diegetic.',
  },
  {
    id: 'chilled-gm',
    label: 'Chilled',
    blurb: 'Easygoing friend at the table. Clear stakes, no lecture.',
    tabletopTip: 'Easygoing — clear stakes, no lecture',
    litrpgLabel: 'Chilled System',
    litrpgTip: 'Readable and unhurried — still a panel, not a pal',
    promptRail:
      'VOICE: Chilled / easygoing table GM. Warm, unhurried, still clear about stakes. Talk like a friend running a game, not a rulebook. Never lecture or pad with atmosphere-only.',
    litrpgPromptRail:
      'VOICE: Chilled System. Warm enough to be readable, unhurried, still a registrar panel — not a friend at a table. Clear stakes. Never lecture or pad with atmosphere-only.',
  },
  {
    id: 'army-brief',
    label: 'Army',
    blurb: 'Clipped sergeant. Situation first. No fluff.',
    tabletopTip: 'Clipped sergeant — situation, then options',
    litrpgLabel: 'Army quartermaster',
    litrpgTip: 'Situation, then options — no fluff',
    promptRail:
      'VOICE: Army / clipped sergeant GM. Lead with situation and options. Tight sentences. Call checks like a briefing. No purple prose. Still human — not a robot.',
    litrpgPromptRail:
      'VOICE: Army quartermaster System. Lead with situation and options. Tight Status lines. No purple prose. You are diegetic chrome — not a human sergeant at a table.',
  },
  {
    id: 'dry-wit',
    label: 'Dry sarcastic',
    blurb: 'Dry understatement. Never mean-spirited to the player.',
    tabletopTip: 'Dry sarcastic — sharp, never cruel',
    litrpgLabel: 'Sarcastic Patch',
    litrpgTip: 'Dry diagnostics — one wry footnote, never cruel',
    promptRail:
      'VOICE: Dry sarcastic GM. Understatement and one sharp observation max per beat. Deadpan asides when calling checks. Never mock the player. Never punch down at named NPCs the player is kind to. Still answer questions directly.',
    litrpgPromptRail:
      'VOICE: Sarcastic System Patch. Dry diagnostics; one wry footnote max per beat. Panels stay precise. Never mock the player. Never punch down at named NPCs the player is kind to. Never change numbers to be funny. Still answer questions directly.',
  },
  {
    id: 'theatrical-jester',
    label: 'Theatrical',
    blurb: 'Jester energy. Big asides. Still honest about the dice.',
    tabletopTip: 'Jester / theatrical — big asides, honest dice',
    litrpgLabel: 'Theatrical System',
    litrpgTip: 'Flourish on notices — still honest about the ledger',
    promptRail:
      'VOICE: Theatrical / jester GM. Relish the scene. Flourish on read-aloud. Playful asides when you call a check. You are a performer, not a referee-bot. Never lie about the dice or the ledger. Kid Mode: theatrical, never cruel or adult.',
    litrpgPromptRail:
      'VOICE: Theatrical System. Flourish on notices. Playful asides in the panel chrome. You are still the System, not a stage GM. Never lie about the ledger. Kid Mode: theatrical, never cruel or adult.',
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
export const DEFAULT_LITRPG_SYSTEM_PERSONALITY: SystemPersonalityId = 'cold-system';

export const TABLETOP_GM_PERSONALITIES: GmVoiceProfile[] = GM_VOICE_PROFILES.filter(
  (p): p is GmVoiceProfile & { id: GmPersonalityId } => p.id !== 'cold-system'
);

const SYSTEM_PERSONALITY_IDS: SystemPersonalityId[] = [
  'cold-system',
  'dry-wit',
  'army-brief',
  'theatrical-jester',
  'chilled-gm',
];

export const LITRPG_SYSTEM_PERSONALITIES: GmVoiceProfile[] = SYSTEM_PERSONALITY_IDS.map(
  (id) => GM_VOICE_PROFILES.find((p) => p.id === id)!
);

export function isGmPersonalityId(id?: string | null): id is GmPersonalityId {
  return TABLETOP_GM_PERSONALITIES.some((p) => p.id === id);
}

export function isSystemPersonalityId(id?: string | null): id is SystemPersonalityId {
  return SYSTEM_PERSONALITY_IDS.some((p) => p === id);
}

export function isGmVoiceProfileId(id?: string | null): id is GmVoiceProfileId {
  return GM_VOICE_PROFILES.some((p) => p.id === id);
}

export function resolveGmVoiceProfile(id?: string | null): GmVoiceProfile {
  return GM_VOICE_PROFILES.find((p) => p.id === id) ?? GM_VOICE_PROFILES[0];
}

export function resolveTabletopGmPersonality(id?: string | null): GmPersonalityId {
  return isGmPersonalityId(id) ? id : DEFAULT_TABLETOP_GM_PERSONALITY;
}

export function resolveLitrpgSystemPersonality(id?: string | null): SystemPersonalityId {
  return isSystemPersonalityId(id) ? id : DEFAULT_LITRPG_SYSTEM_PERSONALITY;
}

/** Campaign save wins over Settings. Old LitRPG saves with no stamp fall back to Settings. */
export function resolveVoiceIdForState(
  state: {
    engineMode?: string;
    gmPersonality?: string | null;
    systemPersonality?: string | null;
  },
  settingsVoiceId?: string | null,
): string {
  if (state.engineMode === 'dnd') {
    return resolveTabletopGmPersonality(state.gmPersonality);
  }
  if (state.engineMode === 'litrpg') {
    if (isSystemPersonalityId(state.systemPersonality)) return state.systemPersonality;
    if (isGmVoiceProfileId(settingsVoiceId)) return settingsVoiceId;
    return DEFAULT_LITRPG_SYSTEM_PERSONALITY;
  }
  return isGmVoiceProfileId(settingsVoiceId) ? settingsVoiceId : 'cold-system';
}

export function formatGmVoiceForPrompt(
  id?: string | null,
  opts?: { engineMode?: string; kidMode?: boolean }
): string {
  const tabletop = opts?.engineMode === 'dnd';
  const litrpg = opts?.engineMode === 'litrpg';
  const resolvedId = tabletop
    ? resolveTabletopGmPersonality(id)
    : isGmVoiceProfileId(id)
      ? id
      : litrpg
        ? DEFAULT_LITRPG_SYSTEM_PERSONALITY
        : (id ?? 'cold-system');
  const p = resolveGmVoiceProfile(resolvedId);
  const rail = litrpg && p.litrpgPromptRail ? p.litrpgPromptRail : p.promptRail;
  const extra: string[] = [
    GM_VOICE_FIREWALL,
    'Same resolved ledger under any voice profile must yield identical state deltas — only wording may differ.',
  ];
  if (tabletop) {
    extra.push(
      'You are a person at this table, not a bland referee. Prose, asides, and how you call checks must sound like this GM.'
    );
  }
  if (litrpg) {
    extra.push(
      'You are the in-world System (panels, notices, registration), not a human GM at a table. Voice is how the System talks.'
    );
  }
  if (opts?.kidMode) {
    extra.push('Kid Mode is on: no cruel mockery, no adult innuendo, no gore jokes — even in this voice.');
  }
  return `=== GM VOICE PROFILE ===\n${rail}\n${extra.join(' ')}\n========================`;
}
