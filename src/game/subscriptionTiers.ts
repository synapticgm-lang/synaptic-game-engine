/**
 * Subscription tiers — capacity + model routing (Pack 12 lock, 2026-08-19u catalog).
 * Payments not live yet; caps/models are enforced locally / ready for server auth.
 * Illustrated graphic-novel mode: caps reserved; launch is text + memorable Flux art.
 *
 * Hosted OpenRouter ladder vs AID Griffin / F&F “standard” / NovelAI in-house:
 * Free = DeepSeek V4 Flash (best cheap narrative); Mid = Claude Haiku 4.5;
 * High = Claude Sonnet 4.6. Memorable plates: Klein 4B Free/Mid, Pro on High.
 * Inventory icons + paper-doll are bundled stock glyphs (no image API).
 */

import { HOSTED_HERO_MODEL, HOSTED_SCHNELL_MODEL } from './hostedImageModel';

export type SubscriptionTierId = 'free' | 'mid' | 'high' | 'admin';

export type TurnPackId =
  | 'text_15'
  | 'text_35'
  | 'text_80'
  | 'illustrated_10'
  | 'illustrated_20'
  | 'illustrated_30'
  | 'memorable_10'
  | 'memorable_20'
  | 'memorable_50';

export type CapacityPackKind = 'text' | 'illustrated' | 'memorable';

/** Shop card artwork keys — CSS/SVG faces in MainMenu. */
export type TurnPackArtId =
  | 'spark'
  | 'chapter'
  | 'saga'
  | 'panels'
  | 'arc'
  | 'volume'
  | 'snap'
  | 'album'
  | 'gallery';

export interface TurnPackDefinition {
  id: TurnPackId;
  /** Shop display name */
  name: string;
  label: string;
  blurb: string;
  kind: CapacityPackKind;
  priceGbp: number;
  priceUsd: number;
  textTurns: number;
  /** Illustrated turns (each burns maxPanels for that tier when mode is live). */
  illustratedTurns: number;
  /** Memorable splash plates (schnell). Never expire. */
  memorablePlates: number;
  /** false = purchase disabled until Illustrated ships (still shown in shop). */
  shopLive: boolean;
  /** Larger packs = better £ per unit (shown in UI as “best value”) */
  bestValue?: boolean;
  /** Shop card face */
  art: TurnPackArtId;
  accent: string;
  accentSoft: string;
}

/**
 * Consumable packs — text, memorable plates, and later Illustrated.
 * Memorable extras are schnell only (never the opener’s nicer model).
 * Pack turns always use the player’s current subscription tier writer (no model upgrade).
 */
export const TURN_PACKS: Record<TurnPackId, TurnPackDefinition> = {
  text_15: {
    id: 'text_15',
    name: 'Spark',
    label: '+15 text turns',
    blurb: 'A short top-up when you hit today’s cap. Same GM as your tier. Packs never expire.',
    kind: 'text',
    priceGbp: 1.99,
    priceUsd: 1.99,
    textTurns: 15,
    illustratedTurns: 0,
    memorablePlates: 0,
    shopLive: true,
    art: 'spark',
    accent: '#f59e0b',
    accentSoft: '#78350f',
  },
  text_35: {
    id: 'text_35',
    name: 'Chapter',
    label: '+35 text turns',
    blurb: 'A few solid sessions. Same GM as your tier. Packs never expire.',
    kind: 'text',
    priceGbp: 3.99,
    priceUsd: 3.99,
    textTurns: 35,
    illustratedTurns: 0,
    memorablePlates: 0,
    shopLive: true,
    art: 'chapter',
    accent: '#38bdf8',
    accentSoft: '#0c4a6e',
  },
  text_80: {
    id: 'text_80',
    name: 'Saga',
    label: '+80 text turns',
    blurb: 'Best £ per turn — a long evening of play. Same GM as your tier. Packs never expire.',
    kind: 'text',
    priceGbp: 7.99,
    priceUsd: 7.99,
    textTurns: 80,
    illustratedTurns: 0,
    memorablePlates: 0,
    shopLive: true,
    bestValue: true,
    art: 'saga',
    accent: '#a78bfa',
    accentSoft: '#4c1d95',
  },
  illustrated_10: {
    id: 'illustrated_10',
    name: 'Panels',
    label: '+10 illustrated turns',
    blurb: 'Ten multi-panel graphic-novel turns. Packs never expire.',
    kind: 'illustrated',
    priceGbp: 4.99,
    priceUsd: 4.99,
    textTurns: 0,
    illustratedTurns: 10,
    memorablePlates: 0,
    shopLive: false,
    art: 'panels',
    accent: '#fb7185',
    accentSoft: '#881337',
  },
  illustrated_20: {
    id: 'illustrated_20',
    name: 'Arc',
    label: '+20 illustrated turns',
    blurb: 'Twenty illustrated turns — a solid graphic chapter. Packs never expire.',
    kind: 'illustrated',
    priceGbp: 7.99,
    priceUsd: 7.99,
    textTurns: 0,
    illustratedTurns: 20,
    memorablePlates: 0,
    shopLive: false,
    art: 'arc',
    accent: '#34d399',
    accentSoft: '#064e3b',
  },
  illustrated_30: {
    id: 'illustrated_30',
    name: 'Volume',
    label: '+30 illustrated turns',
    blurb: 'Best £ per turn — a long graphic-novel session. Packs never expire.',
    kind: 'illustrated',
    priceGbp: 12.99,
    priceUsd: 12.99,
    textTurns: 0,
    illustratedTurns: 30,
    memorablePlates: 0,
    shopLive: false,
    bestValue: true,
    art: 'volume',
    accent: '#f472b6',
    accentSoft: '#831843',
  },
  memorable_10: {
    id: 'memorable_10',
    name: 'Snap',
    label: '+10 memorable pictures',
    blurb: 'Ten story plates when the weekly cap is empty. Fast model. Packs never expire.',
    kind: 'memorable',
    priceGbp: 0.99,
    priceUsd: 0.99,
    textTurns: 0,
    illustratedTurns: 0,
    memorablePlates: 10,
    shopLive: true,
    art: 'snap',
    accent: '#fbbf24',
    accentSoft: '#78350f',
  },
  memorable_20: {
    id: 'memorable_20',
    name: 'Album',
    label: '+20 memorable pictures',
    blurb: 'Twenty story plates — a Mid week of extras. Fast model. Packs never expire.',
    kind: 'memorable',
    priceGbp: 1.99,
    priceUsd: 1.99,
    textTurns: 0,
    illustratedTurns: 0,
    memorablePlates: 20,
    shopLive: true,
    art: 'album',
    accent: '#fb923c',
    accentSoft: '#7c2d12',
  },
  memorable_50: {
    id: 'memorable_50',
    name: 'Gallery',
    label: '+50 memorable pictures',
    blurb: 'Best £ per picture — fifty story plates. Fast model. Packs never expire.',
    kind: 'memorable',
    priceGbp: 3.99,
    priceUsd: 3.99,
    textTurns: 0,
    illustratedTurns: 0,
    memorablePlates: 50,
    shopLive: true,
    bestValue: true,
    art: 'gallery',
    accent: '#f59e0b',
    accentSoft: '#451a03',
  },
};

/** Packs shown as purchasable today (text only until Illustrated ships). */
export function liveShopPacks(): TurnPackDefinition[] {
  return Object.values(TURN_PACKS).filter((p) => p.shopLive);
}

/** All capacity packs for shop shelf (illustrated may be coming-soon). */
export function allShopPacks(): TurnPackDefinition[] {
  return Object.values(TURN_PACKS);
}

export function textShopPacks(): TurnPackDefinition[] {
  return allShopPacks().filter((p) => p.kind === 'text');
}

export function illustratedShopPacks(): TurnPackDefinition[] {
  return allShopPacks().filter((p) => p.kind === 'illustrated');
}

export function memorableShopPacks(): TurnPackDefinition[] {
  return allShopPacks().filter((p) => p.kind === 'memorable');
}

/** BFL direct endpoint path segment under https://api.bfl.ai/v1/ */
export type FluxEndpointId =
  | 'flux-2-klein-4b'
  | 'flux-2-klein-9b'
  | 'flux-2-pro'
  | 'flux-2-pro-preview';

export interface TierDefinition {
  id: SubscriptionTierId;
  name: string;
  priceGbp: number;
  writerOpenRouterId: string;
  writerGeminiId: string;
  textTurnsPerDay: number;
  memorableImagesPerWeek: number;
  illustratedImagesPerDay: number;
  illustratedTrialImages: number;
  maxPanelsPerTurn: number;
  fluxEndpoint: FluxEndpointId;
  fluxHeroEndpoint?: FluxEndpointId;
  /** Opt-in rewarded ad: +N text turns only (never art). */
  adTextTurns: number;
  noAds: boolean;
  downloadGraphicNovel: boolean;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTierId, TierDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    priceGbp: 0,
    writerOpenRouterId: 'deepseek/deepseek-v4-flash-0731',
    writerGeminiId: 'gemini-2.5-flash-lite',
    textTurnsPerDay: 12,
    memorableImagesPerWeek: 5,
    illustratedImagesPerDay: 0,
    illustratedTrialImages: 10,
    maxPanelsPerTurn: 1,
    fluxEndpoint: 'flux-2-klein-4b',
    adTextTurns: 3,
    noAds: false,
    downloadGraphicNovel: false,
  },
  mid: {
    id: 'mid',
    name: 'Mid',
    priceGbp: 14.99,
    writerOpenRouterId: 'anthropic/claude-haiku-4.5',
    writerGeminiId: 'gemini-3.5-flash',
    textTurnsPerDay: 20,
    memorableImagesPerWeek: 20,
    illustratedImagesPerDay: 6,
    illustratedTrialImages: 0,
    maxPanelsPerTurn: 2,
    fluxEndpoint: 'flux-2-klein-9b',
    fluxHeroEndpoint: 'flux-2-pro',
    adTextTurns: 3,
    noAds: true,
    downloadGraphicNovel: true,
  },
  high: {
    id: 'high',
    name: 'High',
    priceGbp: 29.99,
    writerOpenRouterId: 'anthropic/claude-sonnet-4.6',
    writerGeminiId: 'gemini-3.5-flash',
    textTurnsPerDay: 24,
    memorableImagesPerWeek: 40,
    illustratedImagesPerDay: 10,
    illustratedTrialImages: 0,
    maxPanelsPerTurn: 3,
    fluxEndpoint: 'flux-2-pro',
    fluxHeroEndpoint: 'flux-2-pro-preview',
    adTextTurns: 0,
    noAds: true,
    downloadGraphicNovel: true,
  },
  /**
   * Website-only: Bring Your Own Key. Same capacity floor as High;
   * player supplies text + image API keys after disclaimer.
   * Not sold on Google Play / App Store builds.
   */
  admin: {
    id: 'admin',
    name: 'Admin (BYOK)',
    /** Platform access only — player pays their own API keys. Adult rail, not Stripe. */
    priceGbp: 12.99,
    writerOpenRouterId: 'anthropic/claude-sonnet-4.6',
    writerGeminiId: 'gemini-3.5-flash',
    textTurnsPerDay: 24,
    memorableImagesPerWeek: 40,
    illustratedImagesPerDay: 10,
    illustratedTrialImages: 0,
    maxPanelsPerTurn: 3,
    fluxEndpoint: 'flux-2-pro',
    fluxHeroEndpoint: 'flux-2-pro-preview',
    adTextTurns: 0,
    noAds: true,
    downloadGraphicNovel: true,
  },
};

const TIER_STORAGE_KEY = 'synapticgm-subscription-tier';

/** Local override until billing is live. Default free. */
export function getActiveSubscriptionTier(): SubscriptionTierId {
  try {
    const raw = localStorage.getItem(TIER_STORAGE_KEY);
    if (raw === 'mid' || raw === 'high' || raw === 'free' || raw === 'admin') return raw;
  } catch {
    /* ignore */
  }
  return 'free';
}

export function isAdminSubscriptionTier(tier: SubscriptionTierId | string | null | undefined): boolean {
  return tier === 'admin';
}

export function setActiveSubscriptionTier(tier: SubscriptionTierId): void {
  localStorage.setItem(TIER_STORAGE_KEY, tier);
}

export function getTierDefinition(tier: SubscriptionTierId = getActiveSubscriptionTier()): TierDefinition {
  return SUBSCRIPTION_TIERS[tier];
}

/**
 * Resolve writer model for this session.
 * Hosted path uses tier catalog. Custom model only when Admin BYOK is live.
 */
export function resolveWriterModel(args: {
  aiProvider: string;
  customModelId?: string | null;
  tier?: SubscriptionTierId;
  allowCustomModel?: boolean;
}): string {
  const custom = args.customModelId?.trim();
  if (custom && (args.allowCustomModel || args.tier === 'admin')) return custom;
  const def = getTierDefinition(args.tier ?? getActiveSubscriptionTier());
  if (args.aiProvider === 'gemini') return def.writerGeminiId;
  return def.writerOpenRouterId;
}

export function resolveFluxEndpoint(args: {
  tier?: SubscriptionTierId;
  hero?: boolean;
}): FluxEndpointId {
  const def = getTierDefinition(args.tier ?? getActiveSubscriptionTier());
  if (args.hero && def.fluxHeroEndpoint) return def.fluxHeroEndpoint;
  return def.fluxEndpoint;
}

/** OpenRouter model ids — same logical tiers as BFL endpoints (swap provider later). */
export function fluxEndpointToOpenRouterId(endpoint: FluxEndpointId): string {
  switch (endpoint) {
    case 'flux-2-klein-4b':
      return HOSTED_SCHNELL_MODEL;
    case 'flux-2-klein-9b':
      return HOSTED_SCHNELL_MODEL;
    case 'flux-2-pro':
    case 'flux-2-pro-preview':
      return HOSTED_HERO_MODEL;
    default:
      return HOSTED_SCHNELL_MODEL;
  }
}

/**
 * Resolve which Flux model string to call.
 * Today: OpenRouter id. Later with imageProvider=flux-direct: same tier → BFL endpoint.
 */
export function resolveFluxImageModel(args: {
  tier?: SubscriptionTierId;
  hero?: boolean;
  via: 'openrouter' | 'direct';
}): { openRouterId: string; bflEndpoint: FluxEndpointId } {
  const bflEndpoint = resolveFluxEndpoint({ tier: args.tier, hero: args.hero });
  return {
    bflEndpoint,
    openRouterId: fluxEndpointToOpenRouterId(bflEndpoint),
  };
}
