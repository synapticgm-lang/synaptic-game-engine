import { describe, expect, it } from 'vitest';
import { readChatCompletion, readChatUsage, sumWriterUsage } from './openRouterChat';
import { drainWriterUsage, noteWriterUsage } from './gmProxy';

describe('28w token usage per turn', () => {
  it('reads OpenAI-compatible, Google and Anthropic usage blocks', () => {
    expect(
      readChatUsage({ usage: { prompt_tokens: 1200, completion_tokens: 300, prompt_tokens_details: { cached_tokens: 800 } } })
    ).toEqual({ tokensIn: 1200, tokensOut: 300, tokensCached: 800 });
    expect(readChatUsage({ usage: { prompt_tokens: 50, completion_tokens: 9 } })).toEqual({
      tokensIn: 50,
      tokensOut: 9,
      tokensCached: null,
    });
    expect(
      readChatUsage({ usageMetadata: { promptTokenCount: 70, candidatesTokenCount: 20, thoughtsTokenCount: 5 } })
    ).toEqual({ tokensIn: 70, tokensOut: 25, tokensCached: null });
    expect(
      readChatUsage({ usage: { input_tokens: 10, output_tokens: 4, cache_read_input_tokens: 90 } })
    ).toEqual({ tokensIn: 100, tokensOut: 4, tokensCached: 90 });
  });

  it('no usage block is null, never an estimate', () => {
    expect(readChatUsage({ choices: [{ message: { content: 'The door opens.' } }] })).toBeNull();
    expect(readChatCompletion({ choices: [{ message: { content: 'The door opens.' } }] }).usage).toBeUndefined();
  });

  it('sums every call of a turn; an unreported field makes the sum null', () => {
    expect(
      sumWriterUsage([
        { tokensIn: 100, tokensOut: 10, tokensCached: 50, modelCalls: 1, modelId: 'm' },
        { tokensIn: 200, tokensOut: 20, tokensCached: 0, modelCalls: 2, modelId: 'm' },
      ])
    ).toEqual({ tokensIn: 300, tokensOut: 30, tokensCached: 50, modelCalls: 3, modelId: 'm' });
    expect(
      sumWriterUsage([
        { tokensIn: 100, tokensOut: 10, tokensCached: null, modelCalls: 1, modelId: 'm' },
        { tokensIn: 200, tokensOut: 20, tokensCached: 5, modelCalls: 1, modelId: 'm' },
      ])?.tokensCached
    ).toBeNull();
    expect(sumWriterUsage([])).toBeNull();
  });

  it('gm-turn replies drain as one turn; a reply without usage stays unknown', () => {
    drainWriterUsage();
    noteWriterUsage({ tokensIn: 1000, tokensOut: 200, tokensCached: 600, modelCalls: 2, modelId: 'x/deepseek-v4p1-flash' });
    noteWriterUsage({ tokensIn: 500, tokensOut: 100, tokensCached: 0, modelCalls: 1, modelId: 'x/deepseek-v4p1-flash' });
    expect(drainWriterUsage()).toEqual({
      tokensIn: 1500,
      tokensOut: 300,
      tokensCached: 600,
      modelCalls: 3,
      modelId: 'x/deepseek-v4p1-flash',
    });
    expect(drainWriterUsage()).toBeNull();
    noteWriterUsage(undefined);
    expect(drainWriterUsage()).toEqual({
      tokensIn: null,
      tokensOut: null,
      tokensCached: null,
      modelCalls: null,
      modelId: null,
    });
  });
});
