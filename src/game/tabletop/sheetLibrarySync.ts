/**
 * Device + account copies of the saved-sheet library. The device list is what creation reads; the account copy
 * follows a signed-in player to another device. Cloud sheets pass the same validation as a paste.
 */
import { deleteLibrarySheetFromCloud, fetchLibrarySheetsFromCloud, saveLibrarySheetToCloud } from '../cloudSync';
import { deleteSheet, mergeSheets, saveSheet, validateSheet, type SavedSheet } from './sheetLibrary';

export async function syncSheetLibrary(): Promise<SavedSheet[]> {
  const cloud = (await fetchLibrarySheetsFromCloud()).map(validateSheet).flatMap((c) => (c.ok ? [c.sheet] : []));
  return mergeSheets(cloud);
}

export function keepSheet(sheet: SavedSheet): SavedSheet[] {
  const list = saveSheet(sheet);
  void saveLibrarySheetToCloud(sheet);
  return list;
}

export function forgetSheet(id: string): SavedSheet[] {
  const list = deleteSheet(id);
  void deleteLibrarySheetFromCloud(id);
  return list;
}
