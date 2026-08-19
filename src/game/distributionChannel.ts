/**
 * Which product surface this build is for.
 * - store = Google Play / Apple App Store
 * - web   = website
 *
 * Player-facing filter profiles (kid / adult_store / adult_web / adult_byok_web)
 * live in contentFilterProfile.ts and combine this channel with Kid Mode + BYOK.
 *
 * Set at build time: VITE_DISTRIBUTION_CHANNEL=store|web
 * Default is store (safer if a mobile build forgets the flag).
 */

export type DistributionChannel = 'store' | 'web';

export function getDistributionChannel(): DistributionChannel {
  const raw = String(import.meta.env.VITE_DISTRIBUTION_CHANNEL ?? 'store')
    .trim()
    .toLowerCase();
  return raw === 'web' ? 'web' : 'store';
}

export function isStoreDistribution(): boolean {
  return getDistributionChannel() === 'store';
}

export function isWebDistribution(): boolean {
  return getDistributionChannel() === 'web';
}

/** Player-facing channel name in Settings (not a secret / not a model id). */
export function distributionLabel(
  channel: DistributionChannel = getDistributionChannel(),
): string {
  return channel === 'web' ? 'Website' : 'App Store / Google Play';
}

/** NSFW premades exist only on website builds (Kid Mode still hides them). */
export function allowsNsfwCatalog(): boolean {
  return isWebDistribution();
}

/**
 * Platform may allow explicit intimate prose (website).
 * Actual turn still needs NSFW bible / sexualContent / BYOK profile — see contentFilterProfile.
 */
export function allowsExplicitIntimateProse(): boolean {
  return isWebDistribution();
}

/** BYOK / player-supplied keys are website-only. */
export function allowsByokMode(): boolean {
  return isWebDistribution();
}

/**
 * Only Admin (BYOK) website accounts may enter text/image API keys in the client.
 * Store builds and Free/Mid/High never show key fields — SynapticGM hosts the AI.
 */
export function canConfigurePlayerAiKeys(settings: {
  subscriptionTier?: string;
  contentMode?: string;
}): boolean {
  return (
    allowsByokMode()
    && settings.subscriptionTier === 'admin'
    && settings.contentMode !== 'kid'
  );
}

/** Admin BYOK never includes SynapticGM-hosted keys (Kid Mode still uses hosted family AI). */
export function isByokTierWithoutHostedKeys(settings: {
  subscriptionTier?: string;
  contentMode?: string;
  byokModeEnabled?: boolean;
}): boolean {
  return (
    settings.subscriptionTier === 'admin'
    && settings.contentMode !== 'kid'
    && settings.byokModeEnabled === true
  );
}

/** Hosted Free/Mid/High (and Admin with BYOK off) pay via edge secrets — no browser OpenRouter/Flux key. */
export function shouldUseHostedImageProxy(settings: {
  subscriptionTier?: string;
  contentMode?: string;
  byokModeEnabled?: boolean;
  imageProvider?: string;
  imageBaseUrl?: string;
}): boolean {
  if (settings.imageProvider === 'custom' && settings.imageBaseUrl?.trim()) return false;
  if (isByokTierWithoutHostedKeys(settings)) return false;
  return true;
}

export const BYOK_TEXT_KEY_REQUIRED =
  'Admin BYOK needs an OpenRouter text key in Settings. Hosted AI is not included on this tier.';

export const BYOK_IMAGE_KEY_REQUIRED =
  'Admin BYOK needs your OpenRouter text key (or a Flux image key) for pictures. Hosted art is not included on this tier.';

/** Admin text key (OpenRouter). Legacy geminiApiKey slot is accepted as a fallback. */
export function resolveClientTextApiKey(settings: {
  openrouterApiKey?: string;
  geminiApiKey?: string;
}): string {
  return (settings.openrouterApiKey ?? '').trim() || (settings.geminiApiKey ?? '').trim();
}

/** Admin image key (Flux / BFL). Legacy imageApiKey slot is accepted as a fallback. */
export function resolveClientImageApiKey(settings: {
  fluxApiKey?: string;
  imageApiKey?: string;
}): string {
  return (settings.fluxApiKey ?? '').trim() || (settings.imageApiKey ?? '').trim();
}

/** Pictures on BYOK: Flux key, else their OpenRouter text key (they pay). Never hosted. */
export function resolveByokImageSpendKey(settings: {
  fluxApiKey?: string;
  imageApiKey?: string;
  openrouterApiKey?: string;
  geminiApiKey?: string;
}): string {
  return resolveClientImageApiKey(settings) || resolveClientTextApiKey(settings);
}
