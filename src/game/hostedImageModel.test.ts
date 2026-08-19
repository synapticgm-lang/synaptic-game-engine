import { describe, expect, it } from 'vitest';
import {
  resolveHostedImageModel,
  HOSTED_SCHNELL_MODEL,
  HOSTED_HERO_MODEL,
} from './hostedImageModel';

describe('hosted image model alias', () => {
  it('maps retired flux-schnell and Flex to Klein 4B', () => {
    expect(HOSTED_SCHNELL_MODEL).toBe('black-forest-labs/flux.2-klein-4b');
    expect(resolveHostedImageModel('black-forest-labs/flux-schnell')).toBe(HOSTED_SCHNELL_MODEL);
    expect(resolveHostedImageModel('black-forest-labs/flux.2-flex')).toBe(HOSTED_SCHNELL_MODEL);
  });

  it('maps flux-dev to Pro', () => {
    expect(resolveHostedImageModel('black-forest-labs/flux-dev')).toBe(HOSTED_HERO_MODEL);
  });
});
