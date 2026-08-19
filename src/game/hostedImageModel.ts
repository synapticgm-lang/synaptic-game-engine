/**
 * OpenRouter image model ids for hosted generate-image.
 * `flux-schnell` is rejected live ("not a valid model ID") — map it to FLUX.2 Flex.
 */
export const HOSTED_SCHNELL_MODEL = 'black-forest-labs/flux.2-flex';
export const HOSTED_HERO_MODEL = 'black-forest-labs/flux.2-pro';
export const HOSTED_IMAGE_FALLBACKS = [
  HOSTED_SCHNELL_MODEL,
  'google/gemini-2.5-flash-image',
] as const;

const ALIASES: Record<string, string> = {
  'black-forest-labs/flux-schnell': HOSTED_SCHNELL_MODEL,
  'black-forest-labs/flux-dev': HOSTED_HERO_MODEL,
};

export function resolveHostedImageModel(raw?: string | null): string {
  const id = (raw ?? '').trim() || HOSTED_SCHNELL_MODEL;
  return ALIASES[id] ?? id;
}
