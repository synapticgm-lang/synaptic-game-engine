/**
 * Zod (MIT) at the edges: what comes back from gm-turn, a save file a player loads, and the skills
 * library JSON. Inside the game the types are trusted; only data crossing in from outside is checked.
 */

import { z } from 'zod';

/** gm-turn reply body. Unknown keys pass through; a field of the wrong type drops alone; a non-object reads as empty. */
export const GmTurnResponseSchema = z.looseObject({
  text: z.string().optional().catch(undefined),
  error: z.string().optional().catch(undefined),
  rawIssue: z.enum(['empty', 'reasoning-only', 'cut-off', 'fireworks-served']).optional().catch(undefined),
  usage: z.unknown().optional(),
  /** q50-MAP2 — structured places only; never mined from prose. */
  newPlaces: z
    .array(
      z.object({
        name: z.string().optional().catch(undefined),
        kind: z.string().optional().catch(undefined),
        exitsTo: z.array(z.string()).optional().catch(undefined),
      })
    )
    .optional()
    .catch(undefined),
});

export type GmTurnResponse = z.infer<typeof GmTurnResponseSchema>;

export function parseGmTurnResponse(raw: unknown): GmTurnResponse {
  const parsed = GmTurnResponseSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

/** The parts of a save every loader relies on. The rest of GameState is repaired by saveMigration. */
export const SaveFileSchema = z.looseObject(
  {
    character: z.record(z.string(), z.unknown(), { error: 'Invalid save file: missing character data' }),
    log: z.array(z.unknown(), { error: 'Invalid save file: missing narrative log' }),
  },
  { error: 'Invalid save file: not an object' },
);

/** The first problem with a loaded save, in the player-facing wording, or null when it is usable. */
export function saveFileProblem(raw: unknown): string | null {
  const parsed = SaveFileSchema.safeParse(raw);
  return parsed.success ? null : parsed.error.issues[0]?.message ?? 'Invalid save file: not an object';
}

const SKILL_KIND = z.enum([
  'skill', 'spell', 'technique', 'power', 'trait', 'perk_or_feat', 'title', 'class_feature',
  'system_function', 'flaw', 'condition', 'resource',
]);

/** One entry of docs/library/skills/data (library-entry-schema-v3): identity and bookkeeping are checked field by field. */
export const SkillEntrySchema = z.strictObject({
  identity: z.object({
    id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    name: z.string().min(1),
    other_names: z.array(z.string()),
    kind: SKILL_KIND,
    branch: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']),
    family: z.string().min(1),
    sub_family: z.string().min(1),
    description_easy: z.string().min(1),
    tags: z.record(z.string(), z.unknown()),
  }),
  balance: z.record(z.string(), z.unknown()),
  getting: z.record(z.string(), z.unknown()),
  using: z.record(z.string(), z.unknown()),
  checks: z.record(z.string(), z.unknown()),
  growth: z.record(z.string(), z.unknown()),
  showing: z.record(z.string(), z.unknown()),
  who_uses: z.record(z.string(), z.unknown()),
  paths_and_matching: z.record(z.string(), z.unknown()),
  bookkeeping: z.object({
    inspiration: z.unknown(),
    allowed_modes: z.array(z.enum(['tabletop', 'story_rpg', 'litrpg'])).min(1),
    litrpg_housings: z.looseObject({ works_in: z.unknown(), shown_in: z.unknown() }),
    part_switches: z.unknown(),
    open_decisions: z.unknown(),
    test_notes: z.unknown(),
  }),
});

export type SkillEntry = z.infer<typeof SkillEntrySchema>;

export function parseSkillEntries(raw: unknown): SkillEntry[] {
  return z.array(SkillEntrySchema).parse(raw);
}
