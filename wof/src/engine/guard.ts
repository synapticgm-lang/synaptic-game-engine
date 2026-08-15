import type { GmPromptSlice, RaceId, RoundOutcomeToken, SanitizedNearbySpeech, WorldPack } from '../types';

const HP_LEAK = /\b(\d+\s*damage|hp\s*[:=]?\s*\d+|at\s+\d+\s*hp|crumples,?\s*dead)\b/i;

export function nameAllowed(raw: string, pack: WorldPack): boolean {
  const n = raw.trim().toLowerCase();
  if (n.length < 2 || n.length > 24) return false;
  if (pack.banList.some((b) => n.includes(b.toLowerCase()))) return false;
  const reserved = ['system', 'admin', 'gm', 'mod', 'elder mara', 'systemadmin'];
  if (reserved.some((r) => n.includes(r))) return false;
  return true;
}

export function proseAllowed(prose: string, pack: WorldPack, placeName: string): { ok: boolean; reason?: string } {
  if (HP_LEAK.test(prose)) return { ok: false, reason: 'hp_in_prose' };
  const lower = prose.toLowerCase();
  for (const banned of pack.banList) {
    if (lower.includes(banned.toLowerCase())) return { ok: false, reason: 'licensed_name' };
  }
  if (placeName && !lower.includes(placeName.toLowerCase()) && prose.length > 40) {
    return { ok: false, reason: 'missing_place' };
  }
  return { ok: true };
}

/** Player chat never enters the GM prompt. */
export function sanitizeNearby(count: number, races: RaceId[]): SanitizedNearbySpeech {
  return { nearbyPlayerCount: count, nearbyPlayerRaces: races.slice(0, 8) };
}

export function buildGmPromptSlice(args: {
  placeName: string;
  placeId: string;
  activeQuestTitles: string[];
  nearby: SanitizedNearbySpeech;
  playerAction: string;
  outcomeToken: RoundOutcomeToken | null;
  rawHubChat?: string;
}): GmPromptSlice {
  void args.rawHubChat;
  return {
    placeName: args.placeName,
    placeId: args.placeId,
    activeQuestTitles: args.activeQuestTitles,
    nearby: args.nearby,
    playerAction: args.playerAction,
    outcomeToken: args.outcomeToken,
  };
}

export function grantGoldFromProse(_prose: string): never {
  throw new Error('LLM must not mint gold');
}

export function applyHpFromProse(_prose: string, _token: RoundOutcomeToken): never {
  throw new Error('prose must not rewrite HP');
}

export function worldUnlocked(accountWorlds: string[], worldId: string, kidMode: boolean, mature: boolean): boolean {
  if (kidMode && mature) return false;
  return accountWorlds.includes(worldId);
}
