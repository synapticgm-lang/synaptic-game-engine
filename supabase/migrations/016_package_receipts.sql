-- Migration: Package Receipts (WS-2, WS-4, WS-5 Coordination)
-- 
-- Unified receipt ledger for:
-- - WS-2: NPC lifecycle (turnover, memory events)
-- - WS-4: Encounter outcomes (combat, traps, challenges)
-- - WS-5: PYOA persistence (crises, consequences, endings)
-- 
-- All three packages write receipts with idempotency guarantees.

-- ============================================================================
-- PACKAGE RECEIPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS package_receipts (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  save_id UUID NOT NULL REFERENCES game_saves(id) ON DELETE CASCADE,
  
  -- Package metadata
  package TEXT NOT NULL CHECK (package IN ('ws2', 'ws4', 'ws5')),
  kind TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  
  -- Idempotency
  idempotency_key TEXT NOT NULL,
  
  -- Receipt data (JSONB for flexibility)
  data JSONB NOT NULL,
  
  -- Timing
  committed_at_turn INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Query by save + package + kind
CREATE INDEX idx_package_receipts_save_package_kind 
  ON package_receipts(save_id, package, kind);

-- Query by save + turn (for timeline)
CREATE INDEX idx_package_receipts_save_turn 
  ON package_receipts(save_id, committed_at_turn);

-- Idempotency enforcement (UNIQUE)
CREATE UNIQUE INDEX idx_package_receipts_idempotency 
  ON package_receipts(save_id, idempotency_key);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE package_receipts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own receipts
CREATE POLICY select_own_package_receipts ON package_receipts
  FOR SELECT
  USING (
    save_id IN (
      SELECT id FROM game_saves WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own receipts
CREATE POLICY insert_own_package_receipts ON package_receipts
  FOR INSERT
  WITH CHECK (
    save_id IN (
      SELECT id FROM game_saves WHERE user_id = auth.uid()
    )
  );

-- Policy: No updates or deletes (append-only ledger)
-- (No UPDATE or DELETE policies = no one can update/delete)

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get receipt count by package
CREATE OR REPLACE FUNCTION get_receipt_counts_by_package(p_save_id UUID)
RETURNS TABLE (
  package TEXT,
  receipt_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    package_receipts.package,
    COUNT(*)::BIGINT AS receipt_count
  FROM package_receipts
  WHERE save_id = p_save_id
  GROUP BY package_receipts.package
  ORDER BY package_receipts.package;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get receipt timeline
CREATE OR REPLACE FUNCTION get_receipt_timeline(
  p_save_id UUID,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  turn INTEGER,
  package TEXT,
  kind TEXT,
  receipt_id TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    package_receipts.committed_at_turn,
    package_receipts.package,
    package_receipts.kind,
    package_receipts.receipt_id,
    package_receipts.created_at
  FROM package_receipts
  WHERE save_id = p_save_id
  ORDER BY committed_at_turn ASC, created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE package_receipts IS 'Unified receipt ledger for WS-2 (NPC), WS-4 (Encounter), WS-5 (PYOA) packages';
COMMENT ON COLUMN package_receipts.package IS 'Package identifier: ws2, ws4, or ws5';
COMMENT ON COLUMN package_receipts.kind IS 'Receipt kind: npc_turnover, encounter, crisis, ending, etc.';
COMMENT ON COLUMN package_receipts.receipt_id IS 'Unique receipt identifier within package';
COMMENT ON COLUMN package_receipts.idempotency_key IS 'Prevents duplicate application: {package}:{kind}:{runId}:{entityId}';
COMMENT ON COLUMN package_receipts.data IS 'Receipt payload as JSONB (flexible schema per receipt type)';
COMMENT ON COLUMN package_receipts.committed_at_turn IS 'Turn at which this receipt was committed';
