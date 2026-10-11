/**
 * Writer text the mocked `callGm` hands back for the turn being replayed, and the packets the
 * engine handed the writer that turn. No imports on purpose (vi.mock factory loads this first).
 */
export const writerQueue: { text: string; payloads: string[] } = { text: '', payloads: [] };

/**
 * Use in every replay case file:
 *   vi.mock('../../game/aiService', async (orig) =>
 *     (await import('./writerQueue')).mockAiService(await orig()));
 */
export function mockAiService(actual: unknown) {
  return {
    ...(actual as Record<string, unknown>),
    callGm: async (_state: unknown, payload: string) => {
      writerQueue.payloads.push(String(payload ?? ''));
      return { text: writerQueue.text, systemLog: [] };
    },
  };
}
