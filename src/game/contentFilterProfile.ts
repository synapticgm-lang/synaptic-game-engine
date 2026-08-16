/**
 * Four player-facing content filter profiles:
 * 1. kid           — Kid Mode (store or web)
 * 2. adult_store   — Adult on Google Play / App Store
 * 3. adult_web     — Adult on website (hosted keys / tiers)
 * 4. adult_byok_web — Adult website + Bring Your Own Key (explicit + own image/text AIs)
 */

import { getDistributionChannel, canConfigurePlayerAiKeys, resolveClientTextApiKey, resolveClientImageApiKey, type DistributionChannel } from './distributionChannel';
import type { Settings } from './types';
import {
  CORE_HARD_RAILS,
  STORE_HARD_RAILS,
  WEB_HARD_RAILS,
} from './universalHardRails';

export type ContentFilterProfileId =
  | 'kid'
  | 'adult_store'
  | 'adult_web'
  | 'adult_byok_web';

export type ImageSafetyMode = 'kid' | 'adult' | 'unrestricted';

export interface ContentFilterProfile {
  id: ContentFilterProfileId;
  label: string;
  /** Short Settings / UI blurb. */
  summary: string;
  channel: DistributionChannel | 'any';
  allowsNsfwCatalog: boolean;
  allowsExplicitIntimateProse: boolean;
  /** Soften / strip explicit tokens from image prompts before send. */
  softenImagePrompts: boolean;
  /** Passed into image / director pipelines. */
  imageSafetyMode: ImageSafetyMode;
  /** Player must have accepted BYOK disclaimer. */
  requiresByokDisclaimer: boolean;
  promptRails: string;
}

/** Shown before enabling BYOK; must be accepted to unlock adult_byok_web. */
export const BYOK_DISCLAIMER_TEXT = `
Bring Your Own Key (BYOK) — please read carefully

You are about to use your own AI text and/or image API keys with SynapticGM.

• The owners and makers of SynapticGM take no responsibility for content generated using your keys.
• Your chosen AI providers decide what they will create. If a provider allows explicit or other adult material, the game may request and display it when you ask.
• SynapticGM still enforces CORE hard rails in-app (no minors, no forced intimacy, no non-sentient animal sex, no corpse sex, no permanent self-kill ending the save). Everything beyond that is between you and your provider.
• You are solely responsible for complying with your provider’s terms of service, billing, age rules, and applicable law.
• Do not use BYOK to attempt to generate illegal content. Illegal requests remain blocked.

By enabling BYOK you confirm you are an adult and accept full responsibility for outputs produced with your keys.
`.trim();

const KID_PACK = `
KID MODE FILTER (STORE OR WEB — GOOGLE PLAY FAMILIES / DESIGNED FOR FAMILIES BAR):
Content accessible to children must be appropriate for children. Family-friendly only.
BLOCK: sexual/nude/suggestive; graphic violence/gore/torture; real-world crime how-to; alcohol/tobacco/drugs as playable glamor; hate slurs; real or simulated gambling; dating-service or sexual-advice beats; horror meant to frighten children.
ALLOW WITH REWRITE: cartoon defeat, foes asleep/knocked out, mild peril, fantasy monsters without blood, storybook potions already in bibles (never needles/drunk), opening scene, first-dungeon victory pose. Everyone fully clothed.
Image prompts must stay young-audience safe. Skip generation rather than generate-then-hide if the only honest picture is disallowed.
No swearing (fun swap already applied). Absolute minor-protection rails from CORE still apply.
Never surface Admin/BYOK key entry or NSFW campaigns while Kid Mode is on.
`.trim();

const ADULT_STORE_PACK = STORE_HARD_RAILS;

const ADULT_WEB_PACK = `
${WEB_HARD_RAILS}

ADULT WEBSITE (HOSTED):
Explicit prose only when an NSFW campaign and/or Sexual content setting allows it.
Hosted image generation stays tasteful: memorable / comic art without pornography.
Fade-to-black remains the default outside NSFW campaigns.
`.trim();

const ADULT_BYOK_PACK = `
${WEB_HARD_RAILS}

ADULT WEBSITE — BRING YOUR OWN KEY (BYOK):
The player supplies their own text and/or image API keys and accepted the BYOK disclaimer.
Explicit adult prose and explicit art requests are allowed when the player steers there and CORE rails are satisfied.
Do not invent minors, non-consent, non-sentient animal sex, or corpse sex.
Sentient fantasy peoples and willing undead may be intimate when consent holds.
Bone / object adult props are allowed.
The game does not soften BYOK image prompts for “tastefulness” — the provider’s own filters still apply.
SynapticGM’s owners/makers are not responsible for provider outputs under the player’s keys.
`.trim();

export function resolveContentFilterProfile(settings: Settings): ContentFilterProfile {
  const channel = getDistributionChannel();

  if (settings.contentMode === 'kid') {
    return {
      id: 'kid',
      label: 'Kid Mode',
      summary: 'Family-friendly on every build (store or web).',
      channel: 'any',
      allowsNsfwCatalog: false,
      allowsExplicitIntimateProse: false,
      softenImagePrompts: true,
      imageSafetyMode: 'kid',
      requiresByokDisclaimer: false,
      promptRails: `${CORE_HARD_RAILS}\n\n${KID_PACK}`,
    };
  }

  if (channel === 'store') {
    return {
      id: 'adult_store',
      label: 'Adult · Store',
      summary: 'Google Play / App Store adult rules — fade-to-black only, no NSFW catalog, no BYOK.',
      channel: 'store',
      allowsNsfwCatalog: false,
      allowsExplicitIntimateProse: false,
      softenImagePrompts: true,
      imageSafetyMode: 'adult',
      requiresByokDisclaimer: false,
      promptRails: `${CORE_HARD_RAILS}\n\n${ADULT_STORE_PACK}`,
    };
  }

  const byokLive =
    canConfigurePlayerAiKeys(settings)
    && !!settings.byokModeEnabled
    && !!settings.byokDisclaimerAccepted
    && hasByokKeysConfigured(settings);

  if (byokLive) {
    return {
      id: 'adult_byok_web',
      label: 'Adult · Website BYOK',
      summary: 'Your keys — explicit text/art allowed within CORE rails; makers not responsible for provider output.',
      channel: 'web',
      allowsNsfwCatalog: true,
      allowsExplicitIntimateProse: true,
      softenImagePrompts: false,
      imageSafetyMode: 'unrestricted',
      requiresByokDisclaimer: true,
      promptRails: `${CORE_HARD_RAILS}\n\n${ADULT_BYOK_PACK}`,
    };
  }

  return {
    id: 'adult_web',
    label: 'Adult · Website',
    summary: 'Website adult — NSFW catalog when flagged; hosted art stays tasteful; fade-to-black outside NSFW.',
    channel: 'web',
    allowsNsfwCatalog: true,
    allowsExplicitIntimateProse: true,
    softenImagePrompts: true,
    imageSafetyMode: 'adult',
    requiresByokDisclaimer: false,
    promptRails: `${CORE_HARD_RAILS}\n\n${ADULT_WEB_PACK}`,
  };
}

/** True when the player has supplied a key the game can treat as BYOK. */
export function hasByokKeysConfigured(settings: Settings): boolean {
  if (!canConfigurePlayerAiKeys(settings)) return false;
  const textKey = resolveClientTextApiKey(settings);
  const imageKey = resolveClientImageApiKey(settings);
  return !!(textKey && imageKey);
}

export function isByokProfile(settings: Settings): boolean {
  return resolveContentFilterProfile(settings).id === 'adult_byok_web';
}

export function profileAllowsNsfwCatalog(settings: Settings): boolean {
  return resolveContentFilterProfile(settings).allowsNsfwCatalog;
}

export function profileAllowsExplicitIntimateProse(settings: Settings): boolean {
  return resolveContentFilterProfile(settings).allowsExplicitIntimateProse;
}
