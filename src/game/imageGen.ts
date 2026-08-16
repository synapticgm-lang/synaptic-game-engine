import type { Settings } from './types';
import { logger } from './logger';
import { fetchComicPanel, ImageModerationError, generateComicImage } from '@/services/openRouterService';
import { resolveContentFilterProfile } from './contentFilterProfile';
import { prepareKidSafeImagePrompt } from './visualCanon';
import { canConfigurePlayerAiKeys, resolveClientTextApiKey } from './distributionChannel';

// Re-exported for backward compatibility — the class now lives in openRouterService.ts,
// next to the detection logic that actually throws it (text-refusal detection in fetchComicPanel).
export { ImageModerationError };

function buildFinalPrompt(prompt: string, modifier: string): string {
  return `${prompt}\n\nSTYLE DIRECTIVE: ${modifier}\n\nIMPORTANT: Do NOT include any text, words, letters, or speech bubbles in the image. The image must be purely visual with zero text.`;
}

function modeFromSettings(settings: Settings): 'kid' | 'adult' | 'unrestricted' {
  return resolveContentFilterProfile(settings).imageSafetyMode;
}

export async function generateImage(
  prompt: string,
  settings: Settings,
  styleModifier: string
): Promise<string | null> {
  if (settings.visualMode === 'classic' && !settings.classicMemorableImages) {
    console.log('[ImageService] Skipping image generation for classic text mode.');
    return null;
  }

  const profile = resolveContentFilterProfile(settings);
  let scenePrompt = prompt;
  if (profile.imageSafetyMode === 'kid') {
    const prepared = prepareKidSafeImagePrompt(prompt, { skipIfUnsalvageable: true });
    if (prepared.skip) {
      logger.info('ai-image', 'Skipping kid-unsafe image before API call');
      return null;
    }
    scenePrompt = prepared.prompt;
  }
  let finalPrompt = buildFinalPrompt(scenePrompt, styleModifier);
  if (profile.softenImagePrompts) {
    finalPrompt = softenPrompt(finalPrompt);
  }

  logger.info('ai-image', `generateImage via generateComicImage pipeline`, {
    filterProfile: profile.id,
    imageSafetyMode: profile.imageSafetyMode,
  });

  try {
    return await generateComicImage(finalPrompt, modeFromSettings(settings), settings, {
      memorableMoment: settings.visualMode === 'classic' && settings.classicMemorableImages,
      useRawPrompt: true,
      hero: false,
    });
  } catch (err) {
    if (err instanceof ImageModerationError) throw err;
    const apiKey = canConfigurePlayerAiKeys(settings) ? resolveClientTextApiKey(settings) : '';
    if (!apiKey) throw err;
    logger.warn('ai-image', `generateComicImage failed; trying OpenRouter chat image`, {
      error: err instanceof Error ? err.message : String(err),
    });
    return fetchComicPanel(
      finalPrompt,
      modeFromSettings(settings),
      settings.artStylePreset ?? 'western',
      apiKey,
      settings.imageModel?.trim() || undefined
    );
  }
}

export function softenPrompt(prompt: string): string {
  return prompt
    .replace(/\b(blood|gore|dismember|decapitat|gory|visceral|graphic|brutal|mutilat|corpse|slaughter|carnage)\b/gi, 'dramatic')
    .replace(/\b(nude|naked|explicit|erotic|sexual|nsfw)\b/gi, 'tasteful')
    .replace(/\b(kill|murder|execute|slaughter)\b/gi, 'defeat')
    .replace(/STYLE DIRECTIVE:[\s\S]*$/i, 'STYLE DIRECTIVE: Tasteful, non-graphic, artistic composition. Avoid explicit violence or sensitive content.')
    .trim();
}
