/**
 * Receipt Ledger
 * 
 * Unified receipt persistence layer for WS-2, WS-4, and WS-5.
 * Handles idempotency, storage, and retrieval of all receipt types.
 */

import type { Receipt, PackageId } from './types/crossPackageContracts';
import { buildIdempotencyKey, parseIdempotencyKey } from './types/crossPackageContracts';

// ============================================================================
// IN-MEMORY RECEIPT STORE
// ============================================================================

/**
 * In-memory receipt store (runtime cache)
 * 
 * In production, receipts would be persisted to Supabase `package_receipts` table.
 * This in-memory store is used for:
 * - Runtime cache during gameplay
 * - Testing without database
 * - Fast queries without round-trips
 */
const receiptStore = new Map<string, Receipt[]>(); // saveId → receipts
const idempotencyIndex = new Map<string, Receipt>(); // idempotencyKey → receipt

// ============================================================================
// WRITE API
// ============================================================================

/**
 * Append a receipt to the ledger
 * 
 * @param receipt - Receipt to append
 * @param saveId - Save identifier
 * @returns The committed receipt (may be existing if idempotent)
 * @throws Never (idempotency prevents errors on duplicate)
 */
export function appendReceipt(receipt: Receipt, saveId: string): Receipt {
  // Check idempotency
  const existing = idempotencyIndex.get(receipt.idempotencyKey);
  if (existing) {
    console.debug(
      `[ReceiptLedger] Idempotent receipt: ${receipt.idempotencyKey}`
    );
    return existing;
  }
  
  // Get or create save receipts
  const saveReceipts = receiptStore.get(saveId) ?? [];
  
  // Append receipt
  const updatedReceipts = [...saveReceipts, receipt];
  receiptStore.set(saveId, updatedReceipts);
  
  // Index by idempotency key
  idempotencyIndex.set(receipt.idempotencyKey, receipt);
  
  console.debug(
    `[ReceiptLedger] Appended ${receipt.kind} receipt: ${receipt.receiptId} ` +
    `(turn ${receipt.committedAtTurn}, idempotency: ${receipt.idempotencyKey})`
  );
  
  return receipt;
}

/**
 * Append multiple receipts atomically
 * 
 * @param receipts - Receipts to append
 * @param saveId - Save identifier
 * @returns Committed receipts (may include existing if idempotent)
 * @throws Never (idempotency prevents errors on duplicate)
 */
export function appendReceipts(
  receipts: readonly Receipt[],
  saveId: string
): Receipt[] {
  const committed: Receipt[] = [];
  
  for (const receipt of receipts) {
    committed.push(appendReceipt(receipt, saveId));
  }
  
  return committed;
}

// ============================================================================
// READ API
// ============================================================================

/**
 * Get all receipts for a save
 * 
 * @param saveId - Save identifier
 * @param filters - Optional filters
 * @returns Receipts (sorted by committedAtTurn ascending)
 */
export function getReceipts(
  saveId: string,
  filters?: {
    package?: PackageId;
    kind?: string;
    afterTurn?: number;
    beforeTurn?: number;
  }
): Receipt[] {
  const saveReceipts = receiptStore.get(saveId) ?? [];
  
  let filtered = saveReceipts;
  
  // Filter by package
  if (filters?.package) {
    filtered = filtered.filter(r => {
      const parsed = parseIdempotencyKey(r.idempotencyKey);
      return parsed?.packageId === filters.package;
    });
  }
  
  // Filter by kind
  if (filters?.kind) {
    filtered = filtered.filter(r => r.kind === filters.kind);
  }
  
  // Filter by turn range
  if (filters?.afterTurn !== undefined) {
    filtered = filtered.filter(r => r.committedAtTurn > filters.afterTurn!);
  }
  if (filters?.beforeTurn !== undefined) {
    filtered = filtered.filter(r => r.committedAtTurn < filters.beforeTurn!);
  }
  
  // Sort by committedAtTurn (stable)
  return filtered.sort((a, b) => a.committedAtTurn - b.committedAtTurn);
}

/**
 * Get a receipt by idempotency key
 * 
 * @param idempotencyKey - Idempotency key
 * @returns Receipt if found, null otherwise
 */
export function getReceiptByKey(idempotencyKey: string): Receipt | null {
  return idempotencyIndex.get(idempotencyKey) ?? null;
}

/**
 * Check if a receipt exists (idempotency check)
 * 
 * @param idempotencyKey - Idempotency key
 * @returns True if receipt exists
 */
export function hasReceipt(idempotencyKey: string): boolean {
  return idempotencyIndex.has(idempotencyKey);
}

// ============================================================================
// QUERY API
// ============================================================================

/**
 * Get the most recent receipt of a given kind
 * 
 * @param saveId - Save identifier
 * @param kind - Receipt kind
 * @returns Most recent receipt, or null if none
 */
export function getMostRecentReceipt(
  saveId: string,
  kind: string
): Receipt | null {
  const receipts = getReceipts(saveId, { kind });
  return receipts[receipts.length - 1] ?? null;
}

/**
 * Count receipts by package
 * 
 * @param saveId - Save identifier
 * @returns Count by package
 */
export function countReceiptsByPackage(saveId: string): Record<PackageId, number> {
  const receipts = getReceipts(saveId);
  const counts: Record<string, number> = { ws2: 0, ws4: 0, ws5: 0 };
  
  for (const receipt of receipts) {
    const parsed = parseIdempotencyKey(receipt.idempotencyKey);
    if (parsed) {
      counts[parsed.packageId] = (counts[parsed.packageId] ?? 0) + 1;
    }
  }
  
  return counts as Record<PackageId, number>;
}

/**
 * Get receipt timeline (for debugging/telemetry)
 * 
 * @param saveId - Save identifier
 * @returns Timeline of receipts with turn and kind
 */
export function getReceiptTimeline(saveId: string): Array<{
  turn: number;
  kind: string;
  receiptId: string;
  package: PackageId;
}> {
  const receipts = getReceipts(saveId);
  
  return receipts.map(r => {
    const parsed = parseIdempotencyKey(r.idempotencyKey);
    return {
      turn: r.committedAtTurn,
      kind: r.kind,
      receiptId: r.receiptId,
      package: parsed?.packageId ?? 'unknown' as PackageId,
    };
  });
}

// ============================================================================
// PERSISTENCE API (FUTURE: Supabase integration)
// ============================================================================

/**
 * Load receipts from Supabase (STUB)
 * 
 * In production, this would:
 * 1. Query `package_receipts` table by save_id
 * 2. Parse JSONB data into typed Receipt objects
 * 3. Populate in-memory store
 * 
 * @param saveId - Save identifier
 */
export async function loadReceipts(saveId: string): Promise<void> {
  // TODO: Implement Supabase query
  // const { data, error } = await supabase
  //   .from('package_receipts')
  //   .select('*')
  //   .eq('save_id', saveId)
  //   .order('committed_at_turn', { ascending: true });
  
  console.debug(`[ReceiptLedger] Load receipts for save ${saveId} (stub)`);
}

/**
 * Persist receipts to Supabase (STUB)
 * 
 * In production, this would:
 * 1. Batch insert new receipts to `package_receipts` table
 * 2. Handle idempotency via UNIQUE constraint on idempotency_key
 * 3. Return inserted/existing receipts
 * 
 * @param saveId - Save identifier
 */
export async function persistReceipts(saveId: string): Promise<void> {
  // TODO: Implement Supabase insert
  // Get receipts not yet persisted (track dirty flag)
  // const { data, error } = await supabase
  //   .from('package_receipts')
  //   .upsert(receiptsToInsert, { onConflict: 'idempotency_key' });
  
  console.debug(`[ReceiptLedger] Persist receipts for save ${saveId} (stub)`);
}

// ============================================================================
// TESTING/DEBUGGING API
// ============================================================================

/**
 * Clear all receipts (for testing)
 */
export function clearAllReceipts(): void {
  receiptStore.clear();
  idempotencyIndex.clear();
  console.debug('[ReceiptLedger] Cleared all receipts');
}

/**
 * Get store statistics (for debugging)
 */
export function getStoreStats(): {
  totalReceipts: number;
  totalSaves: number;
  byPackage: Record<PackageId, number>;
} {
  let totalReceipts = 0;
  const byPackage: Record<string, number> = { ws2: 0, ws4: 0, ws5: 0 };
  
  for (const receipts of receiptStore.values()) {
    totalReceipts += receipts.length;
    
    for (const receipt of receipts) {
      const parsed = parseIdempotencyKey(receipt.idempotencyKey);
      if (parsed) {
        byPackage[parsed.packageId] = (byPackage[parsed.packageId] ?? 0) + 1;
      }
    }
  }
  
  return {
    totalReceipts,
    totalSaves: receiptStore.size,
    byPackage: byPackage as Record<PackageId, number>,
  };
}
