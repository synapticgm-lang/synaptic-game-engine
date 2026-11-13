/**
 * Aboard a vessel: which ship / boat template a place is, from the story's own established facts.
 * Order: the place record's sticky `vessel` → a ship word in the place name → the opening's locked
 * place kind / situation → the place record's kind / card description → this scene's prose.
 * Ship words are the vehicle templates' own reuse words (vesselTemplateFor); free text also needs an
 * aboard cue so a harbour view of ships does not turn a tavern into a deck plan.
 * Once found, stampPlaceVessel writes it on the place record so the map never flips between visits.
 */
import { resolvePlace } from './places';
import { vesselTemplateFor, vesselTemplateForName } from './placeTemplates';
import type { GameState } from './types';

const ABOARD = /\b(?:aboard|on board|on deck|below decks?|the decks?|the hull|hull timbers|gangway|the hold|the rigging|the mast)\b/i;

/** A vessel template id when this text puts the player on a ship / boat. */
export function vesselInSetting(text: string | null | undefined): string | undefined {
  const t = (text ?? '').replace(/\s+/g, ' ');
  if (!t || !ABOARD.test(t)) return undefined;
  return vesselTemplateFor(t)?.id;
}

function sameName(a: string | undefined, b: string): boolean {
  return !!a && a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function placeVessel(state: GameState, place: string, sceneText?: string): string | undefined {
  const here = (place ?? '').trim();
  if (!here) return undefined;
  const record = resolvePlace(state.places ?? [], here);
  if (record?.vessel) return record.vessel;
  const byName = vesselTemplateForName(here)?.id;
  if (byName) return byName;
  const inst = state.openingEstablishment?.instance;
  if (inst && sameName(inst.placeName, here)) {
    const kind = vesselTemplateFor(inst.placeKind ?? '')?.id;
    if (kind) return kind;
    const set = vesselInSetting([inst.situation, inst.pressing].filter(Boolean).join(' '));
    if (set) return set;
  }
  if (record) {
    const kind = vesselTemplateFor(record.settlementKind ?? '')?.id ?? vesselInSetting(record.description);
    if (kind) return kind;
  }
  return vesselInSetting(sceneText);
}

/** Make the vessel sticky on the place record (no record → nothing to stamp). */
export function stampPlaceVessel(state: GameState, place: string, vessel: string | undefined): GameState {
  if (!vessel) return state;
  const record = resolvePlace(state.places ?? [], place);
  if (!record || record.vessel === vessel) return state;
  return { ...state, places: (state.places ?? []).map((p) => (p.id === record.id ? { ...p, vessel } : p)) };
}
