/**
 * Cosmetic entitlements — local for now.
 * TEST: all catalog items unlocked for every account so themes can be tried.
 */

import { SHOP_CATALOG } from './cosmeticCatalog';

const OWNED_KEY = 'synapticgm-cosmetic-owned';
const TEST_UNLOCK_ALL = true;

export function allCatalogIds(): string[] {
  return SHOP_CATALOG.map((i) => i.id);
}

export function loadOwnedCosmetics(): Set<string> {
  if (TEST_UNLOCK_ALL) {
    return new Set(allCatalogIds());
  }
  try {
    const raw = localStorage.getItem(OWNED_KEY);
    if (!raw) {
      const free = SHOP_CATALOG.filter((i) => i.free).map((i) => i.id);
      return new Set(free);
    }
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set(SHOP_CATALOG.filter((i) => i.free).map((i) => i.id));
  }
}

export function isOwned(id: string, owned = loadOwnedCosmetics()): boolean {
  if (TEST_UNLOCK_ALL) return true;
  return owned.has(id);
}

export function unlockCosmetic(id: string): Set<string> {
  const next = loadOwnedCosmetics();
  next.add(id);
  const item = SHOP_CATALOG.find((i) => i.id === id);
  if (item?.includes) {
    for (const part of item.includes) next.add(part);
  }
  if (!TEST_UNLOCK_ALL) {
    localStorage.setItem(OWNED_KEY, JSON.stringify([...next]));
  }
  return next;
}

/** Ensure free + test unlock are applied once per session boot. */
export function ensureTestCosmeticUnlock(): void {
  if (!TEST_UNLOCK_ALL) return;
  localStorage.setItem(OWNED_KEY, JSON.stringify(allCatalogIds()));
}
