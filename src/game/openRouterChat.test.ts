import { describe, expect, it } from 'vitest';
import { OPENROUTER_DEEPSEEK_V41_FLASH } from './modelIds';
import {
  extractChatCompletionText,
  FREE_WRITER_OPENROUTER_MODEL,
  isFireworksServedProvider,
  openRouterChatBody,
  openRouterProviderRouting,
  readChatCompletion,
  rejectFireworksServed,
} from './openRouterChat';

describe('extractChatCompletionText', () => {
  it('reads normal message.content', () => {
    expect(
      extractChatCompletionText({
        choices: [{ message: { content: 'The door groans.' } }],
      })
    ).toBe('The door groans.');
  });

  it('28l: never paints reasoning as the story when content is empty', () => {
    expect(
      extractChatCompletionText({
        choices: [{ message: { content: '', reasoning_content: 'The door groans.' } }],
      })
    ).toBe('');
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

describe('OpenRouter Free writer routing (no network)', () => {
  it('default Free id is OpenRouter DeepSeek V4.1 Flash', () => {
    expect(FREE_WRITER_OPENROUTER_MODEL).toBe(OPENROUTER_DEEPSEEK_V41_FLASH);
    expect(FREE_WRITER_OPENROUTER_MODEL).toBe('deepseek/deepseek-v4.1-flash');
  });

  it('every OpenRouter writer body ignores Fireworks', () => {
    const plain = openRouterChatBody('deepseek/deepseek-v4.1-flash', 'sys', 'go', 128) as {
      provider: { ignore?: string[]; require_parameters?: boolean };
    };
    expect(plain.provider.ignore).toContain('Fireworks');
    expect(plain.provider.require_parameters).toBeUndefined();
    const schema = openRouterChatBody('m', 's', 'p', 100, { tokenProse: true }) as {
      provider: { ignore?: string[]; require_parameters?: boolean };
    };
    expect(schema.provider.ignore).toContain('Fireworks');
    expect(schema.provider.require_parameters).toBe(true);
    expect(openRouterProviderRouting().ignore).toEqual(['Fireworks']);
  });

  it('surfaces servedProvider/servedModel and hard-rejects Fireworks-served replies', () => {
    const ok = readChatCompletion({
      provider: 'DeepSeek',
      model: 'deepseek/deepseek-v4.1-flash',
      choices: [{ message: { content: 'Story.' } }],
    });
    expect(ok.servedProvider).toBe('DeepSeek');
    expect(ok.servedModel).toBe('deepseek/deepseek-v4.1-flash');
    expect(isFireworksServedProvider('Fireworks')).toBe(true);
    expect(isFireworksServedProvider('deepseek')).toBe(false);
    const blocked = rejectFireworksServed(
      readChatCompletion({
        provider: 'Fireworks',
        model: 'accounts/fireworks/models/deepseek-v4p1-flash',
        choices: [{ message: { content: 'Do not use.' } }],
      })
    );
    expect(blocked.text).toBe('');
    expect(blocked.issue).toBe('fireworks-served');
    expect(blocked.servedProvider).toBe('Fireworks');
  });
});
