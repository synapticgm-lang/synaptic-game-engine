import { describe, expect, it } from 'vitest';
import {
  SUBSCRIPTION_TIERS,
  fluxEndpointToOpenRouterId,
} from './subscriptionTiers';
import { HOSTED_HERO_MODEL, HOSTED_SCHNELL_MODEL } from './hostedImageModel';

describe('hosted AI catalog', () => {
  it('gives Free DeepSeek V4 Flash, Mid Claude Haiku, High Claude Sonnet 4.6', () => {
    expect(SUBSCRIPTION_TIERS.free.writerOpenRouterId).toBe('deepseek/deepseek-v4-flash-0731');
    expect(SUBSCRIPTION_TIERS.mid.writerOpenRouterId).toBe('anthropic/claude-haiku-4.5');
    expect(SUBSCRIPTION_TIERS.high.writerOpenRouterId).toBe('anthropic/claude-sonnet-4.6');
    expect(SUBSCRIPTION_TIERS.admin.writerOpenRouterId).toBe('anthropic/claude-sonnet-4.6');
  });

  it('maps OpenRouter art to Klein 4B except High/Pro hero', () => {
    expect(fluxEndpointToOpenRouterId('flux-2-klein-4b')).toBe(HOSTED_SCHNELL_MODEL);
    expect(fluxEndpointToOpenRouterId('flux-2-klein-9b')).toBe(HOSTED_SCHNELL_MODEL);
    expect(fluxEndpointToOpenRouterId('flux-2-pro')).toBe(HOSTED_HERO_MODEL);
    expect(fluxEndpointToOpenRouterId('flux-2-pro-preview')).toBe(HOSTED_HERO_MODEL);
  });
});
