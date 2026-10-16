import type { GameState } from './types';
import {
  buildProtectedEntityNames,
  withProtectedChromeBlocks,
} from './narrativeScrub';
import { isChromePersonToken, isPolityFactionOrPlaceToken, isChoicePadPersonToken, isDialogueVerbPersonToken, isFactionOrOrgToken, detectHubRoleMadlib } from './chromeAuthority';
export const FORBIDDEN_SCRUB_REPLACEMENTS = [
  'stranger', 'the stranger', 'building', 'nearby building', 'the nearby building',
  'mark', 'the mark', 'panel', 'the panel', 'someone', 'something',
] as const;
export interface EntityReference {
  text: string;
  expected?: string;
  position: number;
}
export interface InvalidReferenceReport {
  themCount: number;
  thisPlaceCount: number;
  strangerCount: number;
  brokenChoiceCount: number;
  hubRoleMadlibCount: number;
  references: EntityReference[];
  shouldRegenerate: boolean;
}
export interface TypedEntityContext {
  presentNpcs: string[];
  companions: string[];
  locationName?: string;
  lastSpeaker?: string;
  sceneObjects: string[];
  inventoryItems: string[];
  aloneArrival: boolean;
  encounterName?: string;
}
export function extractEntityContext(state: GameState): TypedEntityContext {
  const presentNpcs = [...(state.sceneFacts?.present ?? [])].filter(
    (n) =>
      n.trim().length > 1
      && !isChromePersonToken(n)
      && !isPolityFactionOrPlaceToken(n)
      && !isChoicePadPersonToken(n)
      && !isDialogueVerbPersonToken(n)
      && !isFactionOrOrgToken(n)
      && !/^(bystanders?|handlers?|onlookers?|watchers?|crowd|people|voices|cracked street)$/i.test(n)
  );
  const companions = (state.companions ?? []).map(c => c.name).filter(Boolean);
  const locationName = state.currentLocation;
  const log = state.log ?? [];
  let lastSpeaker: string | undefined;
  for (let i = log.length - 1; i >= Math.max(0, log.length - 3); i--) {
    const entry = log[i];
    if (entry?.role === 'gm' && entry.content) {
      const speakerMatch = entry.content.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:says?|asks?|replies?|tells?|speaks?)/);
      if (speakerMatch && !isChromePersonToken(speakerMatch[1] ?? '')) {
        lastSpeaker = speakerMatch[1];
        break;
      }
    }
  }
  const sceneObjects = [
    ...(state.sceneFacts?.props ?? []),
    ...(state.locationSheet?.interactables ?? []).map(i => i.name).filter(Boolean),
  ];
  const inventoryItems = (state.inventory ?? []).map(i => i.name).filter(Boolean);
  const aloneArrival = state.openingEstablishment?.aloneArrival === true;
  const encounterName = state.activeEncounter?.name;
  return {
    presentNpcs,
    companions,
    locationName,
    lastSpeaker,
    sceneObjects,
    inventoryItems,
    aloneArrival,
    encounterName,
  };
}
export function validateEntityReferences(
  prose: string,
  context: TypedEntityContext
): InvalidReferenceReport {
  const references: EntityReference[] = [];
  let themCount = 0;
  let thisPlaceCount = 0;
  let strangerCount = 0;
  const lines = prose.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const themMatches = line.match(/\b(them|they|their|theirs)\b/gi);
    if (themMatches) {
      const hasPlural = context.presentNpcs.length > 1 
        || /\b(people|crowd|group|handlers?|watchers?|officials?|merchants?)\b/i.test(line);
      if (!hasPlural) {
        themCount += themMatches.length;
        references.push({
          text: themMatches[0],
          expected: context.lastSpeaker || context.presentNpcs[0] || 'specific person',
          position: i,
        });
      }
    }
    if (context.locationName && context.locationName.length > 3) {
      const placeMatches = line.match(/\b(this place|the place|this location)\b/gi);
      if (placeMatches) {
        thisPlaceCount += placeMatches.length;
        references.push({
          text: placeMatches[0],
          expected: context.locationName,
          position: i,
        });
      }
    }
    const strangerMatches = line.match(/\b(the stranger|a stranger|the figure|a figure|the person|a person)\b/gi);
    if (strangerMatches) {
      const allowedStranger = context.aloneArrival 
        || (context.presentNpcs.length === 0 && !context.encounterName)
        || /\b(unknown|mysterious|cloaked|hooded)\b/i.test(line);
      if (!allowedStranger && context.presentNpcs.length > 0) {
        strangerCount += strangerMatches.length;
        references.push({
          text: strangerMatches[0],
          expected: context.presentNpcs[0] || 'named NPC',
          position: i,
        });
      }
    }
  }
  const hubRoleMadlibCount = detectHubRoleMadlib(prose) ? 1 : 0;
  const shouldRegenerate =
    themCount >= 3 || thisPlaceCount >= 2 || strangerCount >= 2 || hubRoleMadlibCount >= 1;
  return {
    themCount,
    thisPlaceCount,
    strangerCount,
    brokenChoiceCount: 0,
    hubRoleMadlibCount, // Will be filled by choice validator
    references,
    shouldRegenerate,
  };
}
export function validateChoiceReference(
  choice: string,
  context: TypedEntityContext
): { valid: boolean; reason?: string } {
  const lower = choice.toLowerCase();
  if (/\b(the stranger|a stranger|the figure|a figure)\b/i.test(choice)) {
    if (context.aloneArrival || context.presentNpcs.length === 0) {
      return {
        valid: false,
        reason: 'References stranger/figure when scene has no established NPCs',
      };
    }
  }
  if (/\b(them|their)\b/i.test(choice)) {
    const hasPlural = context.presentNpcs.length > 1;
    if (!hasPlural) {
      return {
        valid: false,
        reason: 'References "them" without plural antecedent',
      };
    }
  }
  if (/\b(this place|the place)\b/i.test(choice)) {
    if (context.locationName && context.locationName.length > 3) {
      return {
        valid: false,
        reason: `Should use location name: ${context.locationName}`,
      };
    }
  }
  return { valid: true };
}
function speakerPreferred(context: TypedEntityContext): string | undefined {
  const raw = context.encounterName || context.presentNpcs[0] || context.lastSpeaker || undefined;
  if (!raw) return undefined;
  if (isPolityFactionOrPlaceToken(raw) || isChromePersonToken(raw)) return undefined;
  if (isDialogueVerbPersonToken(raw) || isChoicePadPersonToken(raw)) return undefined;
  return raw;
}
function isKitLikeName(name: string | undefined, context: TypedEntityContext): boolean {
  if (!name) return true;
  const lower = name.toLowerCase();
  if (FORBIDDEN_SCRUB_REPLACEMENTS.includes(lower as never)) return true;
  if (isPolityFactionOrPlaceToken(name) || isChromePersonToken(name)) return true;
  if (context.inventoryItems.some((i) => i.toLowerCase() === lower)) return true;
  if (
    /\b(clothes|coat|cloak|scarf|token|shortsword|sword|dagger|knife|bag|pack|phone|keys|headphones|leatherman|charter|blessing)\b/i.test(
      lower
    )
  ) {
    return true;
  }
  return false;
}
export function rewriteInvalidReferences(
  prose: string,
  context: TypedEntityContext,
  report: InvalidReferenceReport
): string {
  return withProtectedChromeBlocks(prose, (body) => {
    let rewritten = body;
    const speaker = speakerPreferred(context);
    const place = context.locationName;
    if (report.thisPlaceCount > 0 && place && !isKitLikeName(place, context)) {
      rewritten = rewritten.replace(/\bthis place\b/gi, place);
      rewritten = rewritten.replace(/\bthe place\b/gi, place);
    }
    if (report.strangerCount > 0 && speaker && !isKitLikeName(speaker, context) && !isDialogueVerbPersonToken(speaker)) {
      rewritten = rewritten.replace(/\bthe stranger\b/gi, speaker);
      rewritten = rewritten.replace(/\ba stranger\b/gi, speaker);
      rewritten = rewritten.replace(/\bthe figure\b/gi, speaker);
      rewritten = rewritten.replace(/\ba figure\b/gi, speaker);
    }
    if (place && !isKitLikeName(place, context) && !isPolityFactionOrPlaceToken(place)) {
      rewritten = rewritten.replace(/\ba nearby building\b/gi, place);
      rewritten = rewritten.replace(/\bthe nearby building\b/gi, place);
    }
    return rewritten;
  });
}
