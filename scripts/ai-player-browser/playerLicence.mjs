/**
 * Player-model licence for AI-tester runs.
 * One table + one exported function — never scatter provider checks.
 *
 * Restricted providers (cannot enter training): anthropic, openai, google, x-ai.
 * deepseek / qwen and other open models → 'open'.
 */

/** Provider prefixes whose runs are tester-only and never admitted to training. */
export const RESTRICTED_PROVIDER_PREFIXES = Object.freeze([
  'anthropic',
  'openai',
  'google',
  'x-ai',
]);

/**
 * @param {string} model OpenRouter model id (`provider/slug`)
 * @returns {'open' | 'restricted'}
 */
export function playerLicenceForModel(model) {
  const id = String(model || '').trim().toLowerCase();
  const slash = id.indexOf('/');
  const prefix = slash >= 0 ? id.slice(0, slash) : id;
  if (RESTRICTED_PROVIDER_PREFIXES.includes(prefix)) return 'restricted';
  return 'open';
}
