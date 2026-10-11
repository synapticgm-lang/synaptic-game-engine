/**
 * Writer text the mocked `callGm` hands back for the turn being replayed, and the packets the
 * engine handed the writer that turn. No imports on purpose (vi.mock factory loads this first).
 */
export const writerQueue: { text: string; payloads: string[]; recordedPacket?: string } = { text: '', payloads: [] };

function refIds(packet: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of packet.matchAll(/^t(\d+)\s+(\S+)\s+\S+\s+"/gm)) out.set(m[1]!, m[2]!);
  return out;
}

/**
 * Recorded writer JSON names entities by the recorded packet's @tN rows; the replayed packet may number them
 * differently, so each recorded token is moved to the replayed row with the same id.
 */
function remapTokens(text: string, recordedPacket: string | undefined, payload: string): string {
  if (!recordedPacket || !text) return text;
  const recorded = refIds(recordedPacket);
  const now = new Map([...refIds(payload)].map(([n, id]) => [id, n]));
  if (!recorded.size || !now.size) return text;
  return text.replace(/(@t|"(?:speaker_)?tok"\s*:\s*"t)(\d+)\b/g, (whole, lead: string, n: string) => {
    const moved = now.get(recorded.get(n) ?? '');
    return moved ? `${lead}${moved}` : whole;
  });
}

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
      return { text: remapTokens(writerQueue.text, writerQueue.recordedPacket, String(payload ?? '')), systemLog: [] };
    },
  };
}
