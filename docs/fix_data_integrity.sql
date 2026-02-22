-- Fix Data Integrity Issues
-- This script identifies and optionally fixes appointments with missing user references

USE medical_appointment_system;

-- Step 1: Check for orphaned appointments (patients or doctors with missing users)
SELECT 
    'Orphaned Appointments' AS issue_type,
    a.id AS appointment_id,
    a.appointment_code,
    a.appointment_date,
    a.status,
    p.id AS patient_id,
    p.user_id AS patient_user_id,
    d.id AS doctor_id,
    d.user_id AS doctor_user_id
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
WHERE p.user_id NOT IN (SELECT id FROM users)
   OR d.user_id NOT IN (SELECT id FROM users);

-- Step 2: Check specific User#120 issue
SELECT 
    'User Reference Check' AS check_type,
    'User #120 exists?' AS description,
    COUNT(*) AS count
FROM users
WHERE id = 120;

-- Step 3: Find all appointments referencing User#120 (through patient or doctor)
SELECT 
    'Appointments referencing User 120' AS issue_type,
    a.id AS appointment_id,
    a.appointment_code,
    p.id AS patient_id,
    p.user_id AS patient_user_id,
    d.id AS doctor_id,
    d.user_id AS doctor_user_id
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
WHERE p.user_id = 120 OR d.user_id = 120;

-- Step 4 (OPTIONAL): Cancel these orphaned appointments
-- Uncomment below to actually fix the data:
/*
UPDATE appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
SET a.status = 'CANCELLED',
    a.cancellation_reason = 'Data integrity issue: Missing user reference',
    a.updated_at = NOW()
WHERE (p.user_id NOT IN (SELECT id FROM users)
   OR d.user_id NOT IN (SELECT id FROM users))
  AND a.status NOT IN ('CANCELLED', 'NO_SHOW');
*/

-- Step 5: Alternative - Delete orphaned appointments (use with caution!)
-- Uncomment below to delete instead of cancel:
/*
DELETE a FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
WHERE p.user_id NOT IN (SELECT id FROM users)
   OR d.user_id NOT IN (SELECT id FROM users);
*/

-- Step 6: Check for orphaned payments (referencing missing users)
SELECT 
    'Orphaned Payments' AS issue_type,
    pm.id AS payment_id,
    pm.payment_code,
    p.id AS patient_id,
    p.user_id AS patient_user_id
FROM payments pm
LEFT JOIN patients p ON pm.patient_id = p.id
WHERE p.user_id NOT IN (SELECT id FROM users);

-- Step 7: Summary report
SELECT 
    'Orphaned Appointments Count' AS metric,
    COUNT(*) AS value
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
WHERE p.user_id NOT IN (SELECT id FROM users)
   OR d.user_id NOT IN (SELECT id FROM users);
