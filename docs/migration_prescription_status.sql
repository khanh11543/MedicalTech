-- ============================================================
-- Migration: Add prescription_code, expiry_date, status to prescriptions table
-- Date: 2025
-- Description: Supports prescription lifecycle management (ACTIVE/EXPIRED/CANCELLED)
-- ============================================================

-- 1. Add new columns
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS prescription_code VARCHAR(50) UNIQUE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';

-- 2. Backfill prescription_code for existing rows
UPDATE prescriptions
SET prescription_code = CONCAT('PRE-', LPAD(CAST(id AS VARCHAR), 6, '0'))
WHERE prescription_code IS NULL;

-- 3. Backfill status from is_active boolean
UPDATE prescriptions SET status = 'ACTIVE' WHERE is_active = TRUE AND status IS NULL;
UPDATE prescriptions SET status = 'EXPIRED' WHERE is_active = FALSE AND status IS NULL;
UPDATE prescriptions SET status = 'ACTIVE' WHERE status IS NULL;

-- 4. Add index on status column for filtering
CREATE INDEX IF NOT EXISTS idx_prescription_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescription_code ON prescriptions(prescription_code);

-- ============================================================
-- Verify migration
-- ============================================================
-- SELECT status, COUNT(*) FROM prescriptions GROUP BY status;
-- SELECT id, prescription_code, status, is_active FROM prescriptions LIMIT 20;
