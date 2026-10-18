/**
 * Player-model licence for AI-tester runs.
 * One table + one exported function — never scatter provider checks.
 *
 * Restricted providers (cannot enter training): anthropic/, openai/, google/, x-ai/.
 * deepseek / qwen and other open models → 'open'.
 */

/** Provider prefixes whose runs are tester-only and never admitted to training. */
export const RESTRICTED_PROVIDER_PREFIXES = Object.freeze([
  'anthropic/',
  'openai/',
  'google/',
  'x-ai/',
]);

/**
 * @param {string} model OpenRouter model id (`provider/slug`)
 * @returns {'open' | 'restricted'}
 */
export function licenceFor(model) {
  const id = String(model || '').trim().toLowerCase();
  for (const prefix of RESTRICTED_PROVIDER_PREFIXES) {
    if (id.startsWith(prefix)) return 'restricted';
  }
  return 'open';
}

/** @deprecated use licenceFor */
export function playerLicenceForModel(model) {
  return licenceFor(model);
}
