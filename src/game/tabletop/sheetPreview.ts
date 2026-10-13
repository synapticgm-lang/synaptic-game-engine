/**
 * A saved or half-built sheet shown before play: the same engine path as the inn book (resolveSheet →
 * applyTabletopSheet → deriveTabletopSheet) on a blank tabletop save, so the builder page, the saved-sheet
 * library and the in-game sheet print the same numbers for the same picks.
 */
import type { GameState } from '../types';
import { createInitialState } from '../defaults';
import { PREGENS, applyTabletopSheet, deriveTabletopSheet, resolveSheet, scoresForMethod, type DerivedSheet } from './characterBuild';
import { validateSheet, type SavedSheet } from './sheetLibrary';

export interface SheetPreview {
  state: GameState;
  sheet: DerivedSheet;
  /** Rule changes the validator made (shown under the sheet). */
  corrections: string[];
}

export type PreviewResult = { ok: true; preview: SheetPreview } | { ok: false; problems: string[] };

/** Check a sheet (builder draft, library or paste) and derive every number from the SRD rules. */
export function previewSheet(raw: unknown): PreviewResult {
  const check = validateSheet(raw);
  if (!check.ok) return { ok: false, problems: check.problems };
  return { ok: true, preview: previewSavedSheet(check.sheet, check.corrections) };
}

export function previewSavedSheet(sheet: SavedSheet, corrections: string[] = []): SheetPreview {
  const blank = createInitialState(undefined, 'dnd');
  const base: GameState = { ...blank, character: { ...blank.character, name: sheet.name, level: 1, srd: undefined } };
  const applied = applyTabletopSheet(base, resolveSheet({ ...sheet.picks, source: 'build' }));
  const state: GameState = sheet.hpMethod && applied.character.srd
    ? { ...applied, character: { ...applied.character, srd: { ...applied.character.srd, hpMethod: sheet.hpMethod } } }
    : applied;
  return { state, sheet: deriveTabletopSheet(state)!, corrections };
}

/** The inn book's ready-made characters as sheets: standard array laid out for the class, first kit. */
export function pregenSheets(): SavedSheet[] {
  return PREGENS.map((p) => ({
    id: `pregen-${p.picks.classId}`,
    name: p.label,
    mode: 'dnd' as const,
    picks: {
      classId: p.picks.classId!,
      speciesId: p.picks.speciesId!,
      backgroundId: p.picks.backgroundId!,
      method: 'standard-array' as const,
      ...scoresForMethod('standard-array', p.picks.classId!, () => 0),
      kitId: 'A' as const,
    },
    savedAt: 0,
  }));
}
