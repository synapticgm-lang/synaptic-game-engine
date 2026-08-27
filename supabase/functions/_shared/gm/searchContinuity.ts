/** Edge stub — search/weapon authority primarily enforced client-side. */
export function emptySearchAuthorityLine(_sceneFacts: unknown): string | null {
  return null;
}

export function weaponAuthorityLine(_state: unknown): string {
  return 'Weapon authority: kit ledger only — do not invent PC weapons.';
}
