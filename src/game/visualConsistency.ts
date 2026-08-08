import type { GameState, LoreCard } from './types';

/**
 * Visual Consistency Manager.
 *
 * Deliberately NOT a new parallel state tree. Character appearance, equipped gear,
 * and NPC/location visual anchors already live in `character.appearance`,
 * `inventory[].equipped`, and `lorebook[].visualAnchor` respectively. Duplicating
 * that into a second `GameState.visualState` store would create two sources of
 * truth that can drift out of sync — exactly the kind of unreliable state that
 * causes hallucinated/inconsistent art.
 *
 * Instead this module is a pure *reader*: it deterministically assembles a compact
 * consistency block from the existing canonical data and is injected directly into
 * every image prompt in `comicImagePrompt.ts`, in code, on every single request —
 * never left to the GM model's discretion to "remember" to restate it.
 */
export interface VisualConsistencyOptions {
  /**
   * Overrides `state.character.appearance` for this call. Needed because a `<visual-update>`
   * parsed this turn hasn't been committed to state yet when this turn's own image prompts
   * are built — without the override, the panel images would render the player's *previous*
   * appearance for the very turn that changed it.
   */
  appearanceOverride?: string;
  /**
   * True when this turn's `<visual-update>` represents a radical base-form/species change
   * (GM-flagged or heuristically detected — see `isRadicalFormChange` in parser.ts). Replaces
   * the equipped-gear value with an explicit bare/no-gear state, so the image model doesn't
   * keep drawing human clothes/weapons on a body that no longer has human anatomy.
   */
  formChange?: boolean;
}

export function buildVisualConsistencyBlock(
  state: GameState,
  activeLoreCards: LoreCard[] = [],
  options: VisualConsistencyOptions = {}
): string {
  const lines: string[] = [];

  const character = state.character;
  const appearance =
    options.appearanceOverride?.trim()
    || character?.appearance?.trim()
    || character?.bio?.trim()
    || character?.name?.trim()
    || 'Unspecified player character';

  const equipped = (state.inventory ?? []).filter((item) => item?.equipped);
  const gearString = options.formChange || equipped.length === 0
    ? 'No clothing, armor, or weapons equipped. Completely bare.'
    : equipped
        .map((item) => `${item.name}${item.slot ? ` (${item.slot})` : ''}`)
        .join(', ');

  lines.push(`Player Character: ${appearance}`);
  lines.push(`Equipped Gear: ${gearString}`);
  lines.push(
    'CRITICAL: Strictly adhere to the Player Character description. If the character is described as a creature, monster, or non-human, DO NOT draw a human. Do NOT add generic adventurer clothing, cloaks, or swords unless explicitly listed in the Equipped Gear.'
  );

  if (options.formChange) {
    lines.push(
      'FORM CHANGE IN EFFECT: the base body/species has just radically transformed. Depict ONLY what the Player Character description states the new form has.'
    );
  }

  const anchors = activeLoreCards.filter((c) => c.visualAnchor?.trim());
  for (const card of anchors) {
    lines.push(`${card.name} (${card.type}): ${card.visualAnchor}`);
  }

  if (lines.length === 0) return '';

  return [
    'VISUAL CONTINUITY (must match exactly — do not alter these established appearances):',
    ...lines.map((l) => `- ${l}`),
  ].join('\n');
}
