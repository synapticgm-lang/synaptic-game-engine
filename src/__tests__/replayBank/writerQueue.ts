/**
 * Writer text the mocked `callGm` hands back for the turn being replayed, and the packets the
 * engine handed the writer that turn. No imports on purpose (vi.mock factory loads this first).
 */
export const writerQueue: { text: string; payloads: string[]; recordedPacket?: string } = { text: '', payloads: [] };

function refRows(packet: string): Map<string, { id: string; display: string }> {
  const out = new Map<string, { id: string; display: string }>();
  for (const m of packet.matchAll(/^t(\d+)\s+(\S+)\s+\S+\s+"([^"]*)"/gm)) out.set(m[1]!, { id: m[2]!, display: m[3]! });
  return out;
}

/**
 * Recorded writer JSON names entities by the recorded packet's @tN rows; the replayed packet may number them
 * differently, so each recorded token is moved to the replayed row with the same id. Main may re-id a thing
 * (a card prop the player now owns is no longer `prop:`), so a missing id falls back to the one row with the
 * same display.
 */
function remapTokens(text: string, recordedPacket: string | undefined, payload: string): string {
  if (!recordedPacket || !text) return text;
  const recorded = refRows(recordedPacket);
  const rows = [...refRows(payload)];
  const now = new Map(rows.map(([n, r]) => [r.id, n]));
  if (!recorded.size || !now.size) return text;
  const byDisplay = (display: string) => {
    const hits = rows.filter(([, r]) => r.display.toLowerCase() === display.toLowerCase());
    return hits.length === 1 ? hits[0]![0] : undefined;
  };
  return text.replace(/(@t|"(?:speaker_)?tok"\s*:\s*"t)(\d+)\b/g, (whole, lead: string, n: string) => {
    const row = recorded.get(n);
    const moved = row ? (now.get(row.id) ?? byDisplay(row.display)) : undefined;
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
