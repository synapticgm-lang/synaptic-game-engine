import type { GameState, LoreCard } from './types';
import { characterLikeness } from './inventoryArt';

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
   * the equipped-gear value so the image model doesn't keep drawing the old clothes or
   * weapons on a body that no longer has human anatomy.
   */
  formChange?: boolean;
}

export function buildVisualConsistencyBlock(
  state: GameState,
  activeLoreCards: LoreCard[] = [],
  options: VisualConsistencyOptions = {}
): string {
  const lines: string[] = [];

  const likeness = characterLikeness(state, {
    appearanceOverride: options.appearanceOverride,
    formChange: options.formChange,
  });
  const outfit = options.formChange
    ? 'New form only — do not keep the old clothes or weapons unless the description names them.'
    : (likeness.gear || likeness.look);

  lines.push(`Player Character (SAME PERSON in every image, including inventory portrait): ${likeness.look}`);
  lines.push(`Current outfit / held gear for THIS image: ${outfit}`);
  lines.push(
    'LIKENESS LOCK: Keep the same face, hair, skin, body type, and age they described. Do not redesign them. Only clothing, armor, and held items change when Current outfit changes. If they described street clothes, draw those clothes — never a generic adventurer kit, cloak, or sword unless listed in Current outfit. If they are a creature or non-human, do not draw a human.'
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
