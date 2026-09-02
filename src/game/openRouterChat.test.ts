import { describe, expect, it } from 'vitest';
import { extractChatCompletionText } from './openRouterChat';

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
});
