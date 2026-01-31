-- =========================================================
-- Test Data for Doctor Schedule API Testing
-- Run this script before testing the APIs
-- =========================================================

USE medical_appointment_system;

-- =========================================================
-- 1. Tạo User và Doctor Test Account
-- =========================================================

-- Xóa dữ liệu cũ nếu có (optional - cẩn thận với foreign keys)
-- DELETE FROM time_slots WHERE doctor_id = 1;
-- DELETE FROM schedule_exceptions WHERE doctor_id = 1;
-- DELETE FROM doctor_schedules WHERE doctor_id = 1;
-- DELETE FROM doctors WHERE id = 1;
-- DELETE FROM user_roles WHERE user_id = 1;
-- DELETE FROM users WHERE id = 1;

-- Tạo test user
INSERT INTO users (id, email, password_hash, phone, is_active, is_verified, created_at, updated_at)
VALUES (1, 'doctor1@test.com', '$2a$10$dummyhashpassword123456', '0901234567', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE email = email;

-- Gán role DOCTOR (role_id = 2)
INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES (1, 2, NOW())
ON DUPLICATE KEY UPDATE assigned_at = NOW();

-- Tạo doctor profile
INSERT INTO doctors (id, user_id, full_name, license_number, bio, education, experience_years, 
                     consultation_fee, follow_up_fee, is_available, verification_status, 
                     created_at, updated_at)
VALUES (
    1, 
    1, 
    'Dr. Nguyễn Văn A', 
    'LIC-12345-2024', 
    'Bác sĩ chuyên khoa Tim mạch với hơn 10 năm kinh nghiệm', 
    'Đại học Y Hà Nội, Bệnh viện Bạch Mai',
    10, 
    500000, 
    300000, 
    1, 
    'APPROVED', 
    NOW(), 
    NOW()
)
ON DUPLICATE KEY UPDATE full_name = 'Dr. Nguyễn Văn A';

-- =========================================================
-- 2. Kiểm tra dữ liệu đã insert
-- =========================================================

SELECT 
    u.id as user_id,
    u.email,
    d.id as doctor_id,
    d.full_name,
    d.verification_status,
    r.name as role_name
FROM users u
LEFT JOIN doctors d ON d.user_id = u.id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.id = 1;

-- =========================================================
-- Expected Output:
-- user_id | email              | doctor_id | full_name         | verification_status | role_name
-- --------|--------------------|-----------|--------------------|---------------------|----------
-- 1       | doctor1@test.com   | 1         | Dr. Nguyễn Văn A  | APPROVED            | DOCTOR
-- =========================================================

-- =========================================================
-- 3. Tạo thêm test users và doctors nếu cần
-- =========================================================

-- Doctor 2
INSERT INTO users (id, email, password_hash, phone, is_active, is_verified, created_at, updated_at)
VALUES (2, 'doctor2@test.com', '$2a$10$dummyhashpassword123456', '0901234568', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE email = email;

INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES (2, 2, NOW())
ON DUPLICATE KEY UPDATE assigned_at = NOW();

INSERT INTO doctors (id, user_id, full_name, license_number, bio, experience_years, 
                     consultation_fee, is_available, verification_status, created_at, updated_at)
VALUES (
    2, 
    2, 
    'Dr. Trần Thị B', 
    'LIC-67890-2024', 
    'Bác sĩ chuyên khoa Nhi', 
    8, 
    400000, 
    1, 
    'APPROVED', 
    NOW(), 
    NOW()
)
ON DUPLICATE KEY UPDATE full_name = 'Dr. Trần Thị B';

-- =========================================================
-- 4. Tạo Specialty test data (nếu chưa có)
-- =========================================================

INSERT INTO specialties (id, name, description, is_active, created_at, updated_at)
VALUES 
    (1, 'Tim mạch', 'Chuyên khoa Tim mạch', 1, NOW(), NOW()),
    (2, 'Nhi khoa', 'Chuyên khoa Nhi', 1, NOW(), NOW()),
    (3, 'Da liễu', 'Chuyên khoa Da liễu', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Gán specialty cho doctor
INSERT INTO doctor_specialties (doctor_id, specialty_id, is_primary)
VALUES 
    (1, 1, 1),
    (2, 2, 1)
ON DUPLICATE KEY UPDATE is_primary = VALUES(is_primary);

-- =========================================================
-- 5. Verify final setup
-- =========================================================

-- Xem tất cả doctors
SELECT 
    d.id,
    d.full_name,
    d.license_number,
    d.verification_status,
    u.email,
    GROUP_CONCAT(s.name) as specialties
FROM doctors d
JOIN users u ON u.id = d.user_id
LEFT JOIN doctor_specialties ds ON ds.doctor_id = d.id
LEFT JOIN specialties s ON s.id = ds.specialty_id
GROUP BY d.id, d.full_name, d.license_number, d.verification_status, u.email;

-- =========================================================
-- Note: Sau khi chạy script này, bạn có thể test API với:
-- - Doctor ID: 1 (Dr. Nguyễn Văn A - Tim mạch)
-- - Doctor ID: 2 (Dr. Trần Thị B - Nhi khoa)
-- =========================================================
