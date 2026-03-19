-- Fix appointment_histories status columns to support longer status values like RESCHEDULED and IN_PROGRESS
-- These enum values are 11 characters long, so we need VARCHAR(20) to be safe

ALTER TABLE appointment_histories MODIFY COLUMN old_status VARCHAR(20) NULL;
ALTER TABLE appointment_histories MODIFY COLUMN new_status VARCHAR(20) NULL;
