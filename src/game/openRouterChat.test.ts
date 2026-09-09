import { describe, expect, it } from 'vitest';
import {
  extractChatCompletionText,
  FIREWORKS_INFERENCE_BASE,
  fireworksChatBody,
  fireworksChatHeaders,
  FREE_WRITER_FIREWORKS_MODEL,
  hostedWriterProvider,
  isFireworksWriterModel,
  normalizeFireworksWriterModel,
} from './openRouterChat';

describe('extractChatCompletionText', () => {
  it('reads normal message.content', () => {
    expect(
      extractChatCompletionText({
        choices: [{ message: { content: 'The door groans.' } }],
      })
    ).toBe('The door groans.');
  });

  it('reads DeepSeek reasoning when content is empty', () => {
    expect(
      extractChatCompletionText({
        choices: [{ message: { content: '', reasoning_content: 'The door groans.' } }],
      })
    ).toBe('The door groans.');
  });

  it('joins array content parts', () => {
    expect(
      extractChatCompletionText({
        choices: [{ message: { content: [{ text: 'You ' }, { text: 'wait.' }] } }],
      })
    ).toBe('You wait.');
  });

  it('returns empty for missing choices', () => {
    expect(extractChatCompletionText({})).toBe('');
  });

  it('treats Han story content as empty', () => {
    expect(
      extractChatCompletionText({
        choices: [{ message: { content: '你好世界' } }],
      })
    ).toBe('');
  });
});

describe('Fireworks Free writer routing (no network)', () => {
  it('default Free id is Fireworks V4 Flash, not OpenRouter DeepSeek or retired v3p1', () => {
    expect(FREE_WRITER_FIREWORKS_MODEL).toBe('accounts/fireworks/models/deepseek-v4-flash-0731');
    expect(FREE_WRITER_FIREWORKS_MODEL).not.toMatch(/deepseek-v3p1/);
    expect(FREE_WRITER_FIREWORKS_MODEL).not.toBe('deepseek/deepseek-v4-flash-0731');
    expect(FIREWORKS_INFERENCE_BASE).toBe('https://api.fireworks.ai/inference/v1');
  });

  it('routes Fireworks slugs to Fireworks and OpenRouter ids to OpenRouter', () => {
    expect(isFireworksWriterModel(FREE_WRITER_FIREWORKS_MODEL)).toBe(true);
    expect(hostedWriterProvider(FREE_WRITER_FIREWORKS_MODEL)).toBe('fireworks');
    expect(hostedWriterProvider('anthropic/claude-haiku-4.5')).toBe('openrouter');
    expect(hostedWriterProvider('anthropic/claude-sonnet-4.6')).toBe('openrouter');
    expect(hostedWriterProvider('meta-llama/llama-3.1-8b-instruct')).toBe('openrouter');
    expect(hostedWriterProvider('deepseek/deepseek-v4-flash-0731')).toBe('openrouter');
  });

  it('remaps retired Fireworks v3p1 slug', () => {
    expect(normalizeFireworksWriterModel('accounts/fireworks/models/deepseek-v3p1')).toBe(
      FREE_WRITER_FIREWORKS_MODEL
    );
  });

  it('Fireworks body is OpenAI-compat without OpenRouter extras', () => {
    const body = fireworksChatBody(FREE_WRITER_FIREWORKS_MODEL, 'sys', 'go', 128);
    expect(body.model).toBe(FREE_WRITER_FIREWORKS_MODEL);
    expect(body.messages).toHaveLength(2);
    expect(body).not.toHaveProperty('provider');
    expect(fireworksChatHeaders('fw_test').Authorization).toBe('Bearer fw_test');
  });
});
