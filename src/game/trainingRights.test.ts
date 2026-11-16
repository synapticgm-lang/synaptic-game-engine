import { describe, expect, it } from 'vitest';
import { HOST_TRAINING_RIGHTS, isFallbackHost, trainingRightsFor } from './trainingRights';
import { PREFERRED_TRAINING_PROVIDER_ORDER, openRouterProviderRouting } from './openRouterChat';
import { buildCaptureRow, readClientCapture, type CaptureAttempt } from './trainingCaptureRow';

const M = 'deepseek/deepseek-v4.1-flash';

describe('training rights by served host', () => {
  it('rates the researched hosts from one table', () => {
    expect(trainingRightsFor('DeepSeek', M)).toBe('allowed');
    expect(trainingRightsFor('Wafer', M)).toBe('conditional');
    expect(trainingRightsFor('InferenceNet', M)).toBe('excluded');
    expect(trainingRightsFor('Z.AI', M)).toBe('excluded');
    expect(trainingRightsFor('Venice', M)).toBe('unknown');
    expect(trainingRightsFor('DeepInfra', M)).toBe('unknown');
    expect(Object.keys(HOST_TRAINING_RIGHTS).sort()).toEqual(['deepseek', 'inferencenet', 'venice', 'wafer', 'zai']);
  });

  it('missing metadata or an unrated model is never allowed', () => {
    expect(trainingRightsFor(undefined, M)).toBe('unknown');
    expect(trainingRightsFor('', M)).toBe('unknown');
    expect(trainingRightsFor('DeepSeek', undefined)).toBe('unknown');
    expect(trainingRightsFor('DeepSeek', 'deepseek/deepseek-v3.2')).toBe('unknown');
    expect(trainingRightsFor('DeepSeek', `${M}-20261101`)).toBe('allowed');
  });

  it('flags hosts outside the preferred order as fallback', () => {
    expect(isFallbackHost('Wafer', PREFERRED_TRAINING_PROVIDER_ORDER)).toBe(false);
    expect(isFallbackHost('DeepSeek', PREFERRED_TRAINING_PROVIDER_ORDER)).toBe(false);
    expect(isFallbackHost('InferenceNet', PREFERRED_TRAINING_PROVIDER_ORDER)).toBe(true);
    expect(isFallbackHost(undefined, PREFERRED_TRAINING_PROVIDER_ORDER)).toBe(true);
  });

  it('routing prefers DeepSeek then Wafer, falls back, keeps data_collection deny', () => {
    const r = openRouterProviderRouting();
    expect(r.order).toEqual(['deepseek', 'wafer']);
    expect(r.allow_fallbacks).toBe(true);
    expect(r.data_collection).toBe('deny');
    expect(r).not.toHaveProperty('only');
    expect(r).not.toHaveProperty('enforce_distillable_text');
  });

  it('route_fallback marks only answers served outside the preferred hosts; all-failed calls are not fallback', () => {
    const row = (attempts: CaptureAttempt[]) =>
      buildCaptureRow({
        basis: 'test',
        userId: '00000000-0000-4000-8000-000000000001',
        client: readClientCapture({}, 'turn'),
        state: {},
        attempts,
        finalText: '',
        completionStatus: 'ok',
        requestedModel: M,
        keySource: 'server',
        usage: null,
      })!;
    const served = (servedProvider?: string): CaptureAttempt =>
      ({ messages: [], settings: {}, text: 'x', issue: null, servedProvider, servedModel: M });
    const failed: CaptureAttempt = { messages: [], settings: {}, text: '', issue: null, failed: true };
    expect(row([served('Wafer')])).toMatchObject({ route_fallback: false, rights: 'conditional' });
    expect(row([served('DeepInfra')])).toMatchObject({ route_fallback: true, rights: 'unknown' });
    expect(row([failed, served('InferenceNet')])).toMatchObject({ route_fallback: true, rights: 'excluded' });
    expect(row([failed, failed])).toMatchObject({ route_fallback: false, rights: 'unknown' });
  });
});
