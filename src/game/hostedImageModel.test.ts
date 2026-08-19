import { describe, expect, it } from 'vitest';
import { resolveHostedImageModel, HOSTED_SCHNELL_MODEL } from './hostedImageModel';

describe('hosted image model alias', () => {
  it('maps retired flux-schnell to flux.2-flex', () => {
    expect(resolveHostedImageModel('black-forest-labs/flux-schnell')).toBe(HOSTED_SCHNELL_MODEL);
  });
});
