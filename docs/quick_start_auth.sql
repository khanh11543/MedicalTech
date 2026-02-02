-- Quick Start Script for MedicalTech Authentication Testing
-- Run this BEFORE testing Postman APIs

USE medical_appointment_system;

-- Step 1: Verify roles table exists and has data
SELECT 'Checking roles...' as status;
SELECT * FROM roles;

-- Step 2: If roles table is empty, insert default roles
INSERT IGNORE INTO roles (id, name, description, created_at, updated_at) VALUES
(1, 'ADMIN', 'Quản trị viên hệ thống', NOW(), NOW()),
(2, 'DOCTOR', 'Bác sĩ', NOW(), NOW()),
(3, 'RECEPTIONIST', 'Lễ tân', NOW(), NOW()),
(4, 'PATIENT', 'Bệnh nhân', NOW(), NOW());

-- Step 3: Verify insert
SELECT 'Roles after insert:' as status;
SELECT id, name, description FROM roles ORDER BY id;

-- Step 4: Clean up test data (optional - run if you want fresh start)
-- DELETE FROM email_verifications WHERE email LIKE 'test%';
-- DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test%');
-- DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test%');
-- DELETE FROM login_attempts WHERE email LIKE 'test%';
-- DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test%');
-- DELETE FROM users WHERE email LIKE 'test%';

-- Step 5: Show current test users
SELECT 'Current test users:' as status;
SELECT id, email, is_verified, is_active, created_at 
FROM users 
WHERE email LIKE 'test%'
ORDER BY created_at DESC;

SELECT 'Database is ready for testing!' as status;
