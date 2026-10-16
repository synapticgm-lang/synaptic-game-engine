import { afterEach, describe, expect, it } from 'vitest';
import {
  FLASH_LITE_OPENROUTER_MODEL,
  clearAutoplayWriterOverride,
  datasetWriterId,
  enableAutoplayWriter,
  getAutoplayWriterOverride,
  resolveFlashLiteAutoplayWriter,
} from './autoplayWriter';

describe('RC-M2 writer kind is the route; seat identity is the model id', () => {
  afterEach(() => clearAutoplayWriterOverride());

  it('OpenRouter resolve stamps kind openrouter for any model id', () => {
    process.env.OPENROUTER_API_KEY ??= 'sk-or-test-rcm2';
    const flash = resolveFlashLiteAutoplayWriter();
    expect(flash.kind).toBe('openrouter');
    expect(flash.model).toBe(FLASH_LITE_OPENROUTER_MODEL);

    const deepseek = resolveFlashLiteAutoplayWriter('deepseek/deepseek-v4.1-flash');
    expect(deepseek.kind).toBe('openrouter');
    expect(deepseek.model).toBe('deepseek/deepseek-v4.1-flash');
  });

  it('--writer flash-lite + --writer-model keeps kind=openrouter and the model id', () => {
    process.env.OPENROUTER_API_KEY ??= 'sk-or-test-rcm2';
    const w = enableAutoplayWriter('flash-lite', 'deepseek/deepseek-v4.1-flash');
    expect(w?.kind).toBe('openrouter');
    expect(w?.model).toBe('deepseek/deepseek-v4.1-flash');
    expect(getAutoplayWriterOverride()?.kind).toBe('openrouter');
    expect(getAutoplayWriterOverride()?.model).toBe('deepseek/deepseek-v4.1-flash');
  });

  it('datasetWriterId uses model (two seats differ); default falls back to kind', () => {
    expect(
      datasetWriterId({ writer: { kind: 'openrouter', model: 'deepseek/deepseek-v4.1-flash' } })
    ).toBe('deepseek/deepseek-v4.1-flash');
    expect(
      datasetWriterId({ writer: { kind: 'openrouter', model: 'openai/gpt-5-mini' } })
    ).toBe('openai/gpt-5-mini');
    expect(
      datasetWriterId({ writer: { kind: 'openrouter', model: 'deepseek/deepseek-v4.1-flash' } })
    ).not.toBe(datasetWriterId({ writer: { kind: 'openrouter', model: 'openai/gpt-5-mini' } }));
    expect(datasetWriterId({ writer: { kind: 'default', model: null } })).toBe('default');
    expect(datasetWriterId({ writer: { kind: 'default', model: 'ignored/hosted' } })).toBe('default');
  });
});
