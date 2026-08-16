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
