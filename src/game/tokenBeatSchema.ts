/**
 * The Token Prose wire contract (zod): one schema for what the writer may send.
 * - `readWireBeat` reads any reply (strict or not) into refs + lines.
 * - `tokenBeatJsonSchema` is the per-turn strict `json_schema` for OpenRouter structured outputs: a declared
 *   ref or speaker can only be a REF ENUM token (built by `compileRefEnum`, the rows of `compileNounAllowlist`).
 * Client only: the edge gets the generated JSON, never zod.
 */
import { z } from 'zod';
import { compileRefEnum, type CompletedEventPacket, type LedgerRef, type TokenUse, type TokenUseRef } from './completedEventPacket';
import type { GameState } from './types';

/** The turn's REF ENUM: the committed packet's rows, or compiled from the ledger when no packet holds them. */
export function refEnumOf(state: GameState, packet?: CompletedEventPacket): LedgerRef[] {
  if (packet?.refEnum?.length) return packet.refEnum;
  const hallTalk = packet?.verb === 'spoke' || packet?.outcome === 'spoke';
  return compileRefEnum(state, [], { hallTalk });
}

export const TOKEN_USES = ['speaker', 'actor', 'addressed', 'corpse', 'prop_used', 'worn', 'place'] as const satisfies readonly TokenUse[];
export const LINE_FNS = ['place', 'action', 'speech', 'react', 'hook'] as const;
export type WireLineFn = (typeof LINE_FNS)[number];

/** Writers with no schema shorten the enum ("prop", "location"); one unknown word must not throw away the whole beat. */
const USE_ALIAS: Record<string, TokenUse> = {
  prop: 'prop_used',
  item: 'prop_used',
  object: 'prop_used',
  thing: 'prop_used',
  kit: 'worn',
  gear: 'worn',
  equipped: 'worn',
  location: 'place',
  setting: 'place',
  person: 'actor',
  npc: 'actor',
  character: 'actor',
  subject: 'actor',
  target: 'addressed',
  listener: 'addressed',
  body: 'corpse',
};

const text = z.unknown().optional().transform((v) => (v == null ? '' : String(v)).trim());
const tok = text.transform((s) => s.replace(/^@/, '').trim());
const use = text.transform((s) => {
  const u = s.toLowerCase().replace(/[\s-]+/g, '_');
  return (TOKEN_USES as readonly string[]).includes(u) ? (u as TokenUse) : (USE_ALIAS[u] ?? 'actor');
});

const WireRef = z.object({ tok, id: text, use });
const WireLine = z.object({ fn: text.pipe(z.enum(LINE_FNS)), text: text.pipe(z.string().min(1)), speaker_tok: tok });
const WireBeat = z.object({
  candidates: z.unknown().optional().refine((v) => !Array.isArray(v)),
  refs: z.array(z.unknown()),
  lines: z.array(z.unknown()),
});

export type WireLine = z.infer<typeof WireLine>;

/**
 * Refs and lines of a parsed reply. A row that is not a ref or line is dropped; a ref with no token makes the
 * whole reply unreadable. The same ref declared twice (a strict writer repeats rows) is one ref.
 */
export function readWireBeat(json: unknown): { refs: TokenUseRef[]; lines: WireLine[] } | null {
  const beat = WireBeat.safeParse(json);
  if (!beat.success) return null;
  const refs: TokenUseRef[] = [];
  for (const row of beat.data.refs) {
    const ref = WireRef.safeParse(row);
    if (!ref.success) continue;
    if (!ref.data.tok) return null;
    if (ref.data.id.includes('<')) continue;
    if (!refs.some((r) => r.tok === ref.data.tok && r.id === ref.data.id && r.use === ref.data.use)) refs.push(ref.data);
  }
  const lines = beat.data.lines.flatMap((row) => {
    const line = WireLine.safeParse(row);
    return line.success ? [line.data] : [];
  });
  return { refs, lines };
}

/** A declared ref is one REF ENUM row: its token with that row's own id, so the two cannot name different things. */
function strictBeat(enumRefs: LedgerRef[]) {
  const toks = [...new Set(enumRefs.map((r) => r.tok))];
  const tokField = toks.length ? z.enum(toks as [string, ...string[]]) : z.string();
  const row = (tok: z.ZodType, id: z.ZodType): z.ZodType => z.object({ tok, id, use: z.enum(TOKEN_USES) }).strict();
  const rows = enumRefs.map((r) => row(z.literal(r.tok), z.literal(r.id)));
  const ref = rows.length > 1 ? z.union(rows) : (rows[0] ?? row(z.string(), z.string()));
  return z
    .object({
      refs: z.array(ref),
      lines: z.array(
        z.object({ fn: z.enum(LINE_FNS), text: z.string(), speaker_tok: tokField.nullable() }).strict()
      ),
    })
    .strict();
}

/** The strict `json_schema.schema` for this turn (every property required, no extras, as strict mode needs). */
export function tokenBeatJsonSchema(enumRefs: LedgerRef[]): Record<string, unknown> {
  const { $schema: _drop, ...schema } = z.toJSONSchema(strictBeat(enumRefs)) as Record<string, unknown>;
  return schema;
}

/** The strict schema for the turn `state` is about to write. */
export function tokenBeatSchemaFor(state: GameState): Record<string, unknown> {
  return tokenBeatJsonSchema(refEnumOf(state, state.completedEvent));
}
