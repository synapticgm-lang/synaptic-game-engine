/**
 * WOF multiplayer memory — prep only.
 * Shared ledger = facts; scoped stores = prose. Never import from live SynapticGM.
 */

import type {
  MemoryScope,
  MemoryScopeType,
  MpPromptContext,
  ScopedMemoryEntry,
} from '../types';

/** Layer 0 claim-grounding adapted for MP (atmosphere free; named invent forbidden). */
export function formatMpClaimGroundingDirective(): string {
  return `CLAIM-GROUNDING (MP — keep scenes free, keep the ledger honest):
* YOU MAY invent: weather, smell, light, unnamed crowds, anonymous roles, sensory detail.
* YOU MUST NOT invent as fact: Proper-Named NPCs, unique landmarks, unique gear, quest titles, loot rarity, or danger tiers unless they appear in the shared ledger, situation packet, scoped memories retrieved for THIS player, or this turn's outcome token.
* Never narrate another player's private conversation content. You may note shared facts (e.g. an NPC is friendly to another survivor) without quoting private prose.
* Creativity is in how the grounded world feels — not in rewriting who exists or what anyone owns.`;
}

export function memoryVisibleTo(entry: ScopedMemoryEntry, ctx: MpPromptContext): boolean {
  const { scopeType, scopeId } = entry.scope;
  switch (scopeType) {
    case 'global':
      return true;
    case 'player':
      return entry.playerId === ctx.playerId && scopeId === ctx.playerId;
    case 'party':
      return !!ctx.partyId && scopeId === ctx.partyId;
    case 'instance':
      return !!ctx.instanceId && scopeId === ctx.instanceId;
    case 'hub':
      return !!ctx.hubPlaceId && scopeId === ctx.hubPlaceId;
    default:
      return false;
  }
}

/** Retrieve only memories this player is allowed to see. */
export function filterMemoriesForPlayer(
  entries: ScopedMemoryEntry[],
  ctx: MpPromptContext
): ScopedMemoryEntry[] {
  return entries.filter((e) => memoryVisibleTo(e, ctx));
}

export function makeScopedEntry(args: {
  id: string;
  scopeType: MemoryScopeType;
  scopeId: string;
  kind: ScopedMemoryEntry['kind'];
  text: string;
  createdTurn: number;
  playerId?: string | null;
  unresolved?: boolean;
}): ScopedMemoryEntry {
  const scope: MemoryScope = { scopeType: args.scopeType, scopeId: args.scopeId };
  return {
    id: args.id,
    scope,
    kind: args.kind,
    text: args.text.trim().slice(0, 400),
    createdTurn: args.createdTurn,
    unresolved: args.unresolved,
    playerId: args.scopeType === 'player' ? (args.playerId ?? args.scopeId) : null,
  };
}

/**
 * Truth-stack assembly stub (Pack 15 layers).
 * Mechanical ledger lines are passed in by the caller — never invented here.
 */
export function assembleMpTruthStack(args: {
  ctx: MpPromptContext;
  rulesBlock: string;
  mechanicalLedger: string;
  situationPacket: string;
  memories: ScopedMemoryEntry[];
  outcomeTokenLine: string;
}): string {
  const visible = filterMemoriesForPlayer(args.memories, args.ctx);
  const campaign = visible.filter((m) => m.kind === 'campaign').slice(-1);
  const consequences = visible.filter((m) => m.kind === 'consequence' && m.unresolved).slice(0, 5);
  const pins = visible.filter((m) => m.kind === 'pin').slice(-6);
  const retrieved = visible
    .filter((m) => m.kind === 'episodic' || m.kind === 'instance_beat' || m.kind === 'hub_atmosphere')
    .slice(-8);

  const line = (title: string, body: string) => `=== ${title} ===\n${body || '(none)'}\n`;

  return [
    formatMpClaimGroundingDirective(),
    line('LAYER 0 RULES', args.rulesBlock),
    line('LAYER 1 MECHANICAL (SHARED + SELF)', args.mechanicalLedger),
    line('LAYER 2 SITUATION', args.situationPacket),
    line(
      'LAYER 3 CAMPAIGN (PLAYER)',
      campaign.map((m) => m.text).join('\n')
    ),
    line(
      'LAYER 4 UNRESOLVED CONSEQUENCES',
      consequences.map((m) => `- ${m.text}`).join('\n')
    ),
    line(
      'LAYER 5 RETRIEVED (SCOPED)',
      retrieved.map((m) => `[${m.scope.scopeType}] ${m.text}`).join('\n')
    ),
    line(
      'LAYER 6 PINS (PLAYER)',
      pins.map((m) => `- ${m.text}`).join('\n')
    ),
    line('LAYER 7 OUTCOME TOKEN', args.outcomeTokenLine),
  ].join('\n');
}

/**
 * Leak guard: foreign private prose must not appear in this player's assembled prompt.
 */
export function assertNoPrivateLeak(
  assembledPrompt: string,
  foreignPrivateTexts: string[]
): { ok: boolean; leaked: string[] } {
  const hay = assembledPrompt.toLowerCase();
  const leaked = foreignPrivateTexts.filter((t) => {
    const needle = t.trim().toLowerCase();
    return needle.length >= 12 && hay.includes(needle);
  });
  return { ok: leaked.length === 0, leaked };
}
