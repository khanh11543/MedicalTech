-- Migration: Use only reviews table (extend reviews for general feedback without appointment)
-- Run this on your MySQL DB to fix "Column 'appointment_id' cannot be null".
-- With ddl-auto=update, Hibernate often does NOT change NOT NULL to NULL; run these manually.

-- 1) Allow general reviews (no appointment)
ALTER TABLE reviews MODIFY COLUMN appointment_id BIGINT NULL;

-- 2) Allow optional doctor (general review may not target a doctor)
ALTER TABLE reviews MODIFY COLUMN doctor_id BIGINT NULL;

-- 3) Add image_urls if not already present (Hibernate may have added it)
-- If you get "Duplicate column name", skip this line.
ALTER TABLE reviews ADD COLUMN image_urls TEXT NULL;

-- Optional: drop testimonials table after data is migrated
-- DROP TABLE IF EXISTS testimonials;
