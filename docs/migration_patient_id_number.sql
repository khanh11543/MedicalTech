-- Migration: Add id_number (CCCD/CMND) to patients table
-- Date: 2026-03-10

ALTER TABLE patients ADD COLUMN id_number VARCHAR(20) NULL AFTER address;
