/**
 * OpenRouter image model ids for hosted generate-image.
 * `flux-schnell` is rejected live ("not a valid model ID").
 * Klein 4B is the Pack 12 cheap rung (~$0.014/first MP). Do not alias to Flex (~$0.05).
 */
export const HOSTED_SCHNELL_MODEL = 'black-forest-labs/flux.2-klein-4b';
export const HOSTED_HERO_MODEL = 'black-forest-labs/flux.2-pro';
export const HOSTED_IMAGE_FALLBACKS = [
  HOSTED_SCHNELL_MODEL,
  'google/gemini-2.5-flash-image',
] as const;

const ALIASES: Record<string, string> = {
  'black-forest-labs/flux-schnell': HOSTED_SCHNELL_MODEL,
  'black-forest-labs/flux.2-flex': HOSTED_SCHNELL_MODEL,
  'black-forest-labs/flux-dev': HOSTED_HERO_MODEL,
  // OpenRouter lists Klein 4B, not 9B — keep the cheap valid slug.
  'black-forest-labs/flux.2-klein-9b': HOSTED_SCHNELL_MODEL,
};

export function resolveHostedImageModel(raw?: string | null): string {
  const id = (raw ?? '').trim() || HOSTED_SCHNELL_MODEL;
  return ALIASES[id] ?? id;
}
