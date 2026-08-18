import type { EngineMode, GameState } from './types';

export type WorldEra = 'modern_earth' | 'medieval_fantasy' | 'story_defined';

export function worldEraForEngine(engineMode: EngineMode | undefined): WorldEra {
  if (engineMode === 'dnd') return 'medieval_fantasy';
  if (engineMode === 'rpg' || engineMode === 'pyoa') return 'story_defined';
  return 'modern_earth';
}

/** Code-owned picture contract. Art style may change ink — not era, kit, or chrome. */
export function formatWorldCanonForPrompt(state: Pick<GameState, 'engineMode' | 'currentLocation' | 'campaignPremise'>): string {
  const era = worldEraForEngine(state.engineMode);
  const place = (state.currentLocation ?? '').trim() || 'unspecified place';
  if (era === 'medieval_fantasy') {
    return [
      'WORLD CANON (TABLETOP FANTASY — BINDING):',
      `- Place: ${place}. Tavern, road, keep, wood, or dungeon — not a modern city unless the scene already named one.`,
      '- People wear period clothes, cloaks, or armor from the sheet. No phones, cars, streetlights, jeans, or System panels in the picture.',
      '- Weapons match the equipped item name only. Do not swap a dagger for a greatsword.',
      '- No Integration glow, Salvage UI, Wave banners, or blue System boxes in the art.',
      '- Anatomy: one person unless the scene lists more. Two arms, two legs, five fingers per hand.',
    ].join('\n');
  }
  if (era === 'story_defined') {
    return [
      'WORLD CANON (STORY RPG — BINDING):',
      `- Place: ${place}. Match the campaign premise and this scene only.`,
      '- Do not add Integration System chrome, Wave events, or tabletop dice notation to the picture.',
      '- Weapons and clothes match the equipped / described kit only.',
      '- Anatomy: one person unless the scene lists more. Two arms, two legs, five fingers per hand.',
    ].join('\n');
  }
  return [
    'WORLD CANON (INTEGRATION EARTH — BINDING):',
    `- Place: ${place}. Modern street, store, or alley. Real-world clothes and lighting.`,
    '- No medieval plate, castle battlements, or fantasy longswords unless the ledger lists that exact item.',
    '- If they hold a knife or System-Issue Survival Knife, draw a short utility knife — never a sword.',
    '- No phones-as-HUD, no neon cyber city, no text or System panels in the pixels.',
    '- Anatomy: one person unless the scene lists more. Two arms, two legs, five fingers per hand.',
  ].join('\n');
}

export {
  kidSafeArtDirective,
  stripKidUnsafeImageLexicon,
  isUnsalvageableKidImagePrompt,
  prepareKidSafeImagePrompt,
} from './kidModeSafety';

export type ImageFailureReason = 'rate_limited' | 'no_key' | 'moderation' | 'failed';

export function classifyImageGenFailure(error: unknown): ImageFailureReason {
  const name = error instanceof Error ? error.name : '';
  const msg = error instanceof Error ? error.message : String(error);
  if (name === 'ImageModerationError' || /moderation|safety.filter|content_filter/i.test(msg)) {
    return 'moderation';
  }
  if (/429|rate limit/i.test(msg)) return 'rate_limited';
  // Hosted proxy missing a server key / undeployed function is not a player Settings problem.
  if (
    /hosted image|not configured for image|image proxy error (404|502|503)|generate-image|failed to fetch/i.test(
      msg
    )
  ) {
    return 'failed';
  }
  if (/no .*api key|no openrouter api key/i.test(msg)) return 'no_key';
  return 'failed';
}

/** Toast + plate copy. Hosted players never get "check Settings" or the word Milestone. */
export function playerFacingImageFailLine(error: unknown): string {
  const reason = classifyImageGenFailure(error);
  const msg = error instanceof Error ? error.message : String(error);
  if (reason === 'rate_limited') return "Your mind's eye blurs for a moment. The scene will return.";
  if (reason === 'no_key') {
    return 'Pictures on Admin BYOK use your own key in Settings. The story continues.';
  }
  if (reason === 'moderation') return 'The scene was too vivid to render. Continue with the prose.';
  if (
    /hosted image service is unavailable/i.test(msg)
    || /image proxy error (404|502|503)/i.test(msg)
    || /failed to fetch/i.test(msg)
    || /generate-image/i.test(msg)
  ) {
    return 'Hosted image service is unavailable.';
  }
  return 'Picture skipped — the story continues.';
}

export function diegeticImageFailureMessage(reason: ImageFailureReason): string {
  if (reason === 'rate_limited') return "Your mind's eye blurs for a moment. The scene will return.";
  if (reason === 'no_key') {
    return 'Pictures on Admin BYOK use your own key in Settings. The story continues.';
  }
  if (reason === 'moderation') return 'The scene was too vivid to render. Continue with the prose.';
  return 'Picture skipped — the story continues.';
}
