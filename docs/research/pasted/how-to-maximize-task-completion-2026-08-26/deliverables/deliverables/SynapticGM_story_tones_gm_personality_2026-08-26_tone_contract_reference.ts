export type EngineMode = 'litrpg' | 'dnd' | 'rpg' | 'pyoa';
export type SystemPersonality = 'cold-system' | 'dry-wit' | 'army-brief' | 'chilled-gm' | 'cozy-brutal';
export type GmPersonality = 'chilled-gm' | 'dry-wit' | 'theatrical-jester' | 'army-brief' | 'fireside-innkeep';
export type EvidenceStatus = 'VERIFIED' | 'PROVIDED SUMMARY' | 'SPECULATIVE' | 'INPUT REQUIRED' | 'COUNSEL' | 'UNKNOWN';

export interface AuthorityProjection {
  location_id: string;
  present_entity_ids: string[];
  exit_ids: string[];
  inventory: Record<string, number>;
  hp: number;
  resource_deltas: Record<string, number>;
  quest_flags: Record<string, boolean | string>;
  permits: string[];
  rolls: Array<{ id: string; total: number; outcome: string }>;
  outcome_code: string;
  time_delta: number;
  evidence_ids: string[];
}

export interface ToneRenderRequest {
  authority: AuthorityProjection;
  sceneManifest: unknown;
  engineMode: EngineMode;
  toneId: string;
  systemPersonality?: SystemPersonality;
  gmPersonality?: GmPersonality;
  perspective: 'second' | 'third_limited' | 'third_external';
  kidMode: boolean;
}

export interface ToneRenderResult {
  prose: string;
  chrome: { status: string; why: string; repair: string }[];
  choiceLabels: Array<{ choiceId: string; label: string }>;
  authorityProjection: AuthorityProjection;
  diagnostics: string[];
}

export interface ArtEligibility {
  eligible: boolean;
  reason: 'memorable_beat' | 'thin_turn' | 'insufficient_anchors' | 'kid_skip' | 'cooldown' | 'tier' | 'budget' | 'capacity' | 'duplicate' | 'safety';
  modelAlias?: 'klein_4b' | 'flux_pro';
}

/** Reference order only: authority is resolved before this function is called. */
export function renderWithTone(req: ToneRenderRequest): ToneRenderResult {
  const before = canonicalHash(req.authority);
  const draft = applyExistingVoiceAndFluidRails(req);
  const scrubbed = deterministicProseWarden(draft, req.authority, req.kidMode);
  if (canonicalHash(scrubbed.authorityProjection) !== before) {
    throw new Error('TONE_RENDER_EQUIVALENCE_VIOLATION');
  }
  return scrubbed;
}

export function evaluateArtEligibility(input: {
  kidSkip: boolean; stableVisualAnchors: number; memorableBeat: boolean;
  duplicateBeat: boolean; cooldownOpen: boolean; tierAllows: boolean;
  budgetAllows: boolean; capacityAllows: boolean; safetyAllows: boolean;
}): ArtEligibility {
  if (input.kidSkip) return { eligible: false, reason: 'kid_skip' };
  if (!input.memorableBeat) return { eligible: false, reason: 'thin_turn' };
  if (input.stableVisualAnchors < 2) return { eligible: false, reason: 'insufficient_anchors' };
  if (input.duplicateBeat) return { eligible: false, reason: 'duplicate' };
  if (!input.cooldownOpen) return { eligible: false, reason: 'cooldown' };
  if (!input.tierAllows) return { eligible: false, reason: 'tier' };
  if (!input.budgetAllows) return { eligible: false, reason: 'budget' };
  if (!input.capacityAllows) return { eligible: false, reason: 'capacity' };
  if (!input.safetyAllows) return { eligible: false, reason: 'safety' };
  return { eligible: true, reason: 'memorable_beat' };
}

declare function canonicalHash(value: AuthorityProjection): string;
declare function applyExistingVoiceAndFluidRails(req: ToneRenderRequest): ToneRenderResult;
declare function deterministicProseWarden(draft: ToneRenderResult, authority: AuthorityProjection, kidMode: boolean): ToneRenderResult;
