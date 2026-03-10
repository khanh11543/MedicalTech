-- =============================================================================
-- TEST DATA cho Appointment Management (Admin)
-- Chạy script này sau khi đã start backend (ddl-auto=update tạo bảng)
-- =============================================================================

USE medical_appointment_system;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. ROLES (nếu chưa có)
-- =============================================================================

INSERT IGNORE INTO roles (id, name, description, created_at, updated_at) VALUES
(1, 'ADMIN', 'System Administrator', NOW(), NOW()),
(2, 'DOCTOR', 'Doctor', NOW(), NOW()),
(3, 'RECEPTIONIST', 'Receptionist', NOW(), NOW()),
(4, 'PATIENT', 'Patient', NOW(), NOW());

-- =============================================================================
-- 2. SPECIALTIES (nếu chưa có)
-- =============================================================================

INSERT INTO specialties (id, name, description, icon_url, is_active, created_at, updated_at) VALUES
(1, 'Nội khoa', 'Khám và điều trị các bệnh nội khoa', NULL, 1, NOW(), NOW()),
(2, 'Ngoại khoa', 'Phẫu thuật và điều trị ngoại khoa', NULL, 1, NOW(), NOW()),
(3, 'Nhi khoa', 'Khám và điều trị trẻ em', NULL, 1, NOW(), NOW()),
(4, 'Sản phụ khoa', 'Chăm sóc sức khỏe phụ nữ', NULL, 1, NOW(), NOW()),
(5, 'Da liễu', 'Điều trị các bệnh về da', NULL, 1, NOW(), NOW()),
(6, 'Tim mạch', 'Chẩn đoán và điều trị bệnh tim mạch', NULL, 1, NOW(), NOW()),
(7, 'Tai mũi họng', 'Khám và điều trị tai mũi họng', NULL, 1, NOW(), NOW()),
(8, 'Mắt', 'Chuyên khoa mắt', NULL, 1, NOW(), NOW()),
(9, 'Thần kinh', 'Chuyên khoa thần kinh', NULL, 1, NOW(), NOW()),
(10, 'Răng hàm mặt', 'Nha khoa và phẫu thuật hàm mặt', NULL, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =============================================================================
-- 3. USERS - Admin, Doctors, Patients, Receptionist
-- Password: "Test@1234" -> BCrypt hash
-- =============================================================================

-- Admin user (id=100)
INSERT INTO users (id, email, password_hash, full_name, phone, is_active, is_verified, created_at, updated_at) VALUES
(100, 'admin@meditech.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin MediTech', '0900000001', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (100, 1, NOW())
ON DUPLICATE KEY UPDATE assigned_at = NOW();

-- Receptionist user (id=101)
INSERT INTO users (id, email, password_hash, full_name, phone, is_active, is_verified, created_at, updated_at) VALUES
(101, 'receptionist@meditech.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lê Thị Hoa', '0900000002', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (101, 3, NOW())
ON DUPLICATE KEY UPDATE assigned_at = NOW();

-- Doctor users (id=110~114)
INSERT INTO users (id, email, password_hash, full_name, phone, is_active, is_verified, created_at, updated_at) VALUES
(110, 'dr.nguyen@meditech.vn',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'BS. Nguyễn Văn Minh',  '0911000001', 1, 1, NOW(), NOW()),
(111, 'dr.tran@meditech.vn',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'BS. Trần Thị Lan',     '0911000002', 1, 1, NOW(), NOW()),
(112, 'dr.pham@meditech.vn',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'BS. Phạm Đức Hùng',    '0911000003', 1, 1, NOW(), NOW()),
(113, 'dr.le@meditech.vn',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'BS. Lê Minh Tuấn',     '0911000004', 1, 1, NOW(), NOW()),
(114, 'dr.hoang@meditech.vn',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'BS. Hoàng Thị Mai',    '0911000005', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES
(110, 2, NOW()), (111, 2, NOW()), (112, 2, NOW()), (113, 2, NOW()), (114, 2, NOW())
ON DUPLICATE KEY UPDATE assigned_at = NOW();

-- Patient users (id=120~131)
INSERT INTO users (id, email, password_hash, full_name, phone, is_active, is_verified, created_at, updated_at) VALUES
(120, 'patient.an@gmail.com',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nguyễn Văn An',      '0922000001', 1, 1, NOW(), NOW()),
(121, 'patient.binh@gmail.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Trần Thị Bình',      '0922000002', 1, 1, NOW(), NOW()),
(122, 'patient.cuong@gmail.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lê Văn Cường',       '0922000003', 1, 1, NOW(), NOW()),
(123, 'patient.dung@gmail.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Phạm Thị Dung',      '0922000004', 1, 1, NOW(), NOW()),
(124, 'patient.em@gmail.com',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Hoàng Văn Em',       '0922000005', 1, 1, NOW(), NOW()),
(125, 'patient.phong@gmail.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nguyễn Đức Phong',   '0922000006', 1, 1, NOW(), NOW()),
(126, 'patient.giang@gmail.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Trần Thị Giang',     '0922000007', 1, 1, NOW(), NOW()),
(127, 'patient.hanh@gmail.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Vũ Thị Hạnh',        '0922000008', 1, 1, NOW(), NOW()),
(128, 'patient.khoa@gmail.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Đặng Minh Khoa',     '0922000009', 1, 1, NOW(), NOW()),
(129, 'patient.linh@gmail.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Bùi Thị Linh',       '0922000010', 1, 1, NOW(), NOW()),
(130, 'patient.minh@gmail.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Cao Văn Minh',       '0922000011', 1, 1, NOW(), NOW()),
(131, 'patient.nga@gmail.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Đỗ Thị Nga',         '0922000012', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES
(120, 4, NOW()), (121, 4, NOW()), (122, 4, NOW()), (123, 4, NOW()),
(124, 4, NOW()), (125, 4, NOW()), (126, 4, NOW()), (127, 4, NOW()),
(128, 4, NOW()), (129, 4, NOW()), (130, 4, NOW()), (131, 4, NOW())
ON DUPLICATE KEY UPDATE assigned_at = NOW();

-- =============================================================================
-- 4. DOCTORS
-- =============================================================================

INSERT INTO doctors (id, user_id, full_name, license_number, bio, education, specialization,
                     experience_years, consultation_fee, follow_up_fee, rating_avg, rating_count,
                     is_available, verification_status, created_at, updated_at) VALUES
(10, 110, 'BS. Nguyễn Văn Minh', 'LIC-NVM-2020', 
     'Bác sĩ chuyên khoa Tim mạch với 15 năm kinh nghiệm tại Bệnh viện Bạch Mai',
     'Đại học Y Hà Nội - Chuyên khoa II Tim mạch', 'Tim mạch',
     15, 500000, 300000, 4.80, 125, 1, 'APPROVED', NOW(), NOW()),

(11, 111, 'BS. Trần Thị Lan', 'LIC-TTL-2018',
     'Bác sĩ chuyên khoa Nhi uy tín tại TP.HCM',
     'Đại học Y Dược TP.HCM - Chuyên khoa Nhi', 'Nhi khoa',
     12, 450000, 250000, 4.65, 98, 1, 'APPROVED', NOW(), NOW()),

(12, 112, 'BS. Phạm Đức Hùng', 'LIC-PDH-2015',
     'Chuyên gia Nội khoa tổng quát với nhiều năm kinh nghiệm lâm sàng',
     'Đại học Y Hà Nội - Chuyên khoa Nội', 'Nội khoa',
     18, 550000, 350000, 4.90, 210, 1, 'APPROVED', NOW(), NOW()),

(13, 113, 'BS. Lê Minh Tuấn', 'LIC-LMT-2019',
     'Bác sĩ Da liễu - Thẩm mỹ da',
     'Đại học Y Dược Huế - Chuyên khoa Da liễu', 'Da liễu',
     10, 400000, 200000, 4.50, 67, 1, 'APPROVED', NOW(), NOW()),

(14, 114, 'BS. Hoàng Thị Mai', 'LIC-HTM-2017',
     'Bác sĩ chuyên khoa Sản - Phụ khoa',
     'Đại học Y Hà Nội - Chuyên khoa Sản phụ', 'Sản phụ khoa',
     13, 480000, 280000, 4.75, 88, 1, 'APPROVED', NOW(), NOW())

ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Gán specialty cho doctors
INSERT INTO doctor_specialties (doctor_id, specialty_id, is_primary, created_at, updated_at) VALUES
(10, 6, 1, NOW(), NOW()),   -- BS Minh -> Tim mạch (primary)
(10, 1, 0, NOW(), NOW()),   -- BS Minh -> Nội khoa
(11, 3, 1, NOW(), NOW()),   -- BS Lan  -> Nhi khoa (primary)
(12, 1, 1, NOW(), NOW()),   -- BS Hùng -> Nội khoa (primary)
(12, 9, 0, NOW(), NOW()),   -- BS Hùng -> Thần kinh
(13, 5, 1, NOW(), NOW()),   -- BS Tuấn -> Da liễu (primary)
(14, 4, 1, NOW(), NOW())    -- BS Mai  -> Sản phụ khoa (primary)
ON DUPLICATE KEY UPDATE is_primary = VALUES(is_primary);

-- =============================================================================
-- 5. PATIENTS
-- =============================================================================

INSERT INTO patients (id, user_id, date_of_birth, gender, address, insurance_number,
                      insurance_provider, emergency_contact, blood_group, allergies,
                      medical_history, created_at, updated_at) VALUES
(20, 120, '1990-03-15', 'MALE',   '123 Trần Hưng Đạo, Q.1, TP.HCM',       'BH-001-2024', 'Bảo Việt',       '0933111222', 'O+',  'Dị ứng Penicillin',         'Viêm dạ dày mãn tính', NOW(), NOW()),
(21, 121, '1988-07-22', 'FEMALE', '45 Lê Lợi, Q.3, TP.HCM',                'BH-002-2024', 'Bảo Minh',       '0933222333', 'A+',  NULL,                         NULL, NOW(), NOW()),
(22, 122, '1975-11-08', 'MALE',   '78 Nguyễn Huệ, Q.1, TP.HCM',            'BH-003-2024', 'PVI',            '0933333444', 'B+',  'Dị ứng hải sản',            'Tiểu đường type 2', NOW(), NOW()),
(23, 123, '1995-01-30', 'FEMALE', '200 Pasteur, Q.3, TP.HCM',               'BH-004-2024', 'Bảo Việt',       '0933444555', 'AB+', NULL,                         NULL, NOW(), NOW()),
(24, 124, '1982-09-12', 'MALE',   '15 Hai Bà Trưng, Q.1, TP.HCM',          'BH-005-2024', 'Bảo Minh',       '0933555666', 'O-',  'Dị ứng thuốc giảm đau NSAIDs', 'Gout, tăng huyết áp', NOW(), NOW()),
(25, 125, '2000-05-18', 'MALE',   '90 Lý Tự Trọng, Q.1, TP.HCM',           NULL,          NULL,             '0933666777', 'A+',  NULL,                         NULL, NOW(), NOW()),
(26, 126, '1992-12-25', 'FEMALE', '33 Võ Văn Tần, Q.3, TP.HCM',            'BH-006-2024', 'Bảo Việt',       '0933777888', 'B-',  NULL,                         'Thiếu máu', NOW(), NOW()),
(27, 127, '1985-04-10', 'FEMALE', '67 Điện Biên Phủ, Q. Bình Thạnh, TP.HCM', 'BH-007-2024', 'PVI',         '0933888999', 'AB-', 'Dị ứng phấn hoa',           NULL, NOW(), NOW()),
(28, 128, '1998-08-05', 'MALE',   '12 Cách Mạng Tháng 8, Q.10, TP.HCM',    NULL,          NULL,             '0933999000', 'O+',  NULL,                         NULL, NOW(), NOW()),
(29, 129, '1993-06-14', 'FEMALE', '88 Nguyễn Thị Minh Khai, Q.3, TP.HCM',  'BH-008-2024', 'Bảo Minh',       '0934000111', 'A-',  NULL,                         'Hen suyễn', NOW(), NOW()),
(30, 130, '1978-02-28', 'MALE',   '55 Trần Quốc Thảo, Q.3, TP.HCM',        'BH-009-2024', 'Bảo Việt',       '0934111222', 'B+',  'Dị ứng Aspirin',            'Bệnh mạch vành', NOW(), NOW()),
(31, 131, '1987-10-20', 'FEMALE', '101 Nguyễn Đình Chiểu, Q.3, TP.HCM',    'BH-010-2024', 'PVI',            '0934222333', 'O+',  NULL,                         NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);

-- =============================================================================
-- 6. RECEPTIONISTS
-- =============================================================================

INSERT INTO receptionists (id, user_id, full_name, employee_id, department, shift, is_active, created_at, updated_at) VALUES
(1, 101, 'Lê Thị Hoa', 'REC-001', 'Phòng tiếp nhận', 'MORNING', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- =============================================================================
-- 7. DOCTOR SCHEDULES (lịch làm việc hàng tuần)
-- =============================================================================

-- BS. Nguyễn Văn Minh (id=10): Thứ 2-6, sáng 8h-12h, chiều 13h30-17h
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, max_patients, is_active, created_at, updated_at) VALUES
(10, 1, '08:00', '12:00', 30, 8,  1, NOW(), NOW()),  -- Monday AM
(10, 1, '13:30', '17:00', 30, 7,  1, NOW(), NOW()),  -- Monday PM
(10, 2, '08:00', '12:00', 30, 8,  1, NOW(), NOW()),  -- Tuesday AM
(10, 2, '13:30', '17:00', 30, 7,  1, NOW(), NOW()),  -- Tuesday PM
(10, 3, '08:00', '12:00', 30, 8,  1, NOW(), NOW()),  -- Wednesday AM
(10, 4, '08:00', '12:00', 30, 8,  1, NOW(), NOW()),  -- Thursday AM
(10, 4, '13:30', '17:00', 30, 7,  1, NOW(), NOW()),  -- Thursday PM
(10, 5, '08:00', '12:00', 30, 8,  1, NOW(), NOW())   -- Friday AM
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

-- BS. Trần Thị Lan (id=11): Thứ 2,3,5 sáng + Thứ 4,6 cả ngày
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, max_patients, is_active, created_at, updated_at) VALUES
(11, 1, '08:00', '12:00', 30, 8, 1, NOW(), NOW()),
(11, 2, '08:00', '12:00', 30, 8, 1, NOW(), NOW()),
(11, 3, '08:00', '12:00', 30, 8, 1, NOW(), NOW()),
(11, 3, '13:30', '17:00', 30, 7, 1, NOW(), NOW()),
(11, 4, '08:00', '12:00', 30, 8, 1, NOW(), NOW()),
(11, 5, '08:00', '12:00', 30, 8, 1, NOW(), NOW()),
(11, 5, '13:30', '17:00', 30, 7, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

-- BS. Phạm Đức Hùng (id=12): Cả tuần sáng
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, max_patients, is_active, created_at, updated_at) VALUES
(12, 1, '08:00', '12:00', 30, 10, 1, NOW(), NOW()),
(12, 2, '08:00', '12:00', 30, 10, 1, NOW(), NOW()),
(12, 3, '08:00', '12:00', 30, 10, 1, NOW(), NOW()),
(12, 4, '08:00', '12:00', 30, 10, 1, NOW(), NOW()),
(12, 5, '08:00', '12:00', 30, 10, 1, NOW(), NOW()),
(12, 6, '08:00', '11:30', 30, 7,  1, NOW(), NOW())
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

-- BS. Lê Minh Tuấn (id=13): Thứ 2,4,6
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, max_patients, is_active, created_at, updated_at) VALUES
(13, 1, '09:00', '12:00', 30, 6, 1, NOW(), NOW()),
(13, 1, '14:00', '17:00', 30, 6, 1, NOW(), NOW()),
(13, 3, '09:00', '12:00', 30, 6, 1, NOW(), NOW()),
(13, 3, '14:00', '17:00', 30, 6, 1, NOW(), NOW()),
(13, 5, '09:00', '12:00', 30, 6, 1, NOW(), NOW()),
(13, 5, '14:00', '17:00', 30, 6, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

-- BS. Hoàng Thị Mai (id=14): Thứ 2-5
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, max_patients, is_active, created_at, updated_at) VALUES
(14, 1, '08:00', '12:00', 30, 8, 1, NOW(), NOW()),
(14, 1, '13:30', '17:00', 30, 7, 1, NOW(), NOW()),
(14, 2, '08:00', '12:00', 30, 8, 1, NOW(), NOW()),
(14, 3, '08:00', '12:00', 30, 8, 1, NOW(), NOW()),
(14, 3, '13:30', '17:00', 30, 7, 1, NOW(), NOW()),
(14, 4, '08:00', '12:00', 30, 8, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

-- =============================================================================
-- 8. TIME SLOTS (cho các ngày cụ thể)
-- =============================================================================

-- Tạo time_slots cho hôm nay, ngày mai, và tuần này
-- BS Minh (id=10) - Hôm nay
INSERT INTO time_slots (id, doctor_id, slot_date, start_time, end_time, status, created_at, updated_at) VALUES
(1001, 10, CURDATE(), '08:00', '08:30', 'BOOKED',    NOW(), NOW()),
(1002, 10, CURDATE(), '08:30', '09:00', 'BOOKED',    NOW(), NOW()),
(1003, 10, CURDATE(), '09:00', '09:30', 'BOOKED',    NOW(), NOW()),
(1004, 10, CURDATE(), '09:30', '10:00', 'BOOKED',    NOW(), NOW()),
(1005, 10, CURDATE(), '10:00', '10:30', 'BOOKED',    NOW(), NOW()),
(1006, 10, CURDATE(), '10:30', '11:00', 'AVAILABLE', NOW(), NOW()),
(1007, 10, CURDATE(), '11:00', '11:30', 'AVAILABLE', NOW(), NOW()),
(1008, 10, CURDATE(), '11:30', '12:00', 'AVAILABLE', NOW(), NOW()),
(1009, 10, CURDATE(), '13:30', '14:00', 'BOOKED',    NOW(), NOW()),
(1010, 10, CURDATE(), '14:00', '14:30', 'BOOKED',    NOW(), NOW()),
(1011, 10, CURDATE(), '14:30', '15:00', 'AVAILABLE', NOW(), NOW()),
(1012, 10, CURDATE(), '15:00', '15:30', 'AVAILABLE', NOW(), NOW())
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- BS Lan (id=11) - Hôm nay
INSERT INTO time_slots (id, doctor_id, slot_date, start_time, end_time, status, created_at, updated_at) VALUES
(1101, 11, CURDATE(), '08:00', '08:30', 'BOOKED',    NOW(), NOW()),
(1102, 11, CURDATE(), '08:30', '09:00', 'BOOKED',    NOW(), NOW()),
(1103, 11, CURDATE(), '09:00', '09:30', 'BOOKED',    NOW(), NOW()),
(1104, 11, CURDATE(), '09:30', '10:00', 'AVAILABLE', NOW(), NOW()),
(1105, 11, CURDATE(), '10:00', '10:30', 'AVAILABLE', NOW(), NOW()),
(1106, 11, CURDATE(), '10:30', '11:00', 'AVAILABLE', NOW(), NOW())
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- BS Hùng (id=12) - Hôm nay
INSERT INTO time_slots (id, doctor_id, slot_date, start_time, end_time, status, created_at, updated_at) VALUES
(1201, 12, CURDATE(), '08:00', '08:30', 'BOOKED',    NOW(), NOW()),
(1202, 12, CURDATE(), '08:30', '09:00', 'BOOKED',    NOW(), NOW()),
(1203, 12, CURDATE(), '09:00', '09:30', 'BOOKED',    NOW(), NOW()),
(1204, 12, CURDATE(), '09:30', '10:00', 'BOOKED',    NOW(), NOW()),
(1205, 12, CURDATE(), '10:00', '10:30', 'AVAILABLE', NOW(), NOW()),
(1206, 12, CURDATE(), '10:30', '11:00', 'AVAILABLE', NOW(), NOW())
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- BS Minh (id=10) - Ngày mai
INSERT INTO time_slots (id, doctor_id, slot_date, start_time, end_time, status, created_at, updated_at) VALUES
(1013, 10, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00', '08:30', 'BOOKED',    NOW(), NOW()),
(1014, 10, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:30', '09:00', 'BOOKED',    NOW(), NOW()),
(1015, 10, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00', '09:30', 'AVAILABLE', NOW(), NOW()),
(1016, 10, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:30', '10:00', 'AVAILABLE', NOW(), NOW()),
(1017, 10, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00', '10:30', 'AVAILABLE', NOW(), NOW())
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- BS Lan (id=11) - Ngày mai
INSERT INTO time_slots (id, doctor_id, slot_date, start_time, end_time, status, created_at, updated_at) VALUES
(1107, 11, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00', '08:30', 'BOOKED',    NOW(), NOW()),
(1108, 11, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:30', '09:00', 'AVAILABLE', NOW(), NOW()),
(1109, 11, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00', '09:30', 'AVAILABLE', NOW(), NOW())
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- =============================================================================
-- 9. APPOINTMENTS (đa dạng trạng thái, nhiều ngày, nhiều bác sĩ)
-- =============================================================================

-- ----- HÔM NAY -----

-- APT-001: PENDING - Bệnh nhân An khám Tim mạch với BS Minh
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status, queue_number,
    reason_for_visit, symptoms, notes, created_at, updated_at) VALUES
(1001, 'APT-20260219-001', 20, 10, 1001, 'PATIENT', 120,
    CURDATE(), '08:00', '08:30', 'PENDING', NULL,
    'Khám tổng quát tim mạch định kỳ', 'Tức ngực, khó thở nhẹ khi gắng sức', 'Bệnh nhân có tiền sử tăng huyết áp',
    DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- APT-002: CONFIRMED - Bệnh nhân Bình khám Nhi khoa với BS Lan
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status, queue_number,
    reason_for_visit, symptoms, notes, created_at, updated_at) VALUES
(1002, 'APT-20260219-002', 21, 11, 1101, 'PATIENT', 121,
    CURDATE(), '08:00', '08:30', 'CONFIRMED', 1,
    'Khám sức khỏe cho bé', 'Sốt nhẹ, ho khan 3 ngày', 'Bé 5 tuổi',
    DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- APT-003: CHECKED_IN - Bệnh nhân Cường khám Nội khoa với BS Hùng
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status, queue_number,
    reason_for_visit, symptoms, notes, checked_in_at, created_at, updated_at) VALUES
(1003, 'APT-20260219-003', 22, 12, 1201, 'RECEPTIONIST', 101,
    CURDATE(), '08:00', '08:30', 'CHECKED_IN', 1,
    'Tái khám tiểu đường', 'Đường huyết không ổn định', 'Bệnh nhân tiểu đường type 2, đang dùng Metformin',
    DATE_SUB(NOW(), INTERVAL 30 MINUTE),
    DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 30 MINUTE))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- APT-004: IN_PROGRESS - Bệnh nhân Dung đang khám Da liễu
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status, queue_number,
    reason_for_visit, symptoms, notes, checked_in_at, consultation_started_at,
    created_at, updated_at) VALUES
(1004, 'APT-20260219-004', 23, 13, NULL, 'PATIENT', 123,
    CURDATE(), '09:00', '09:30', 'IN_PROGRESS', 2,
    'Khám da liễu', 'Nổi mẩn đỏ, ngứa ở tay và chân', NULL,
    DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 20 MINUTE),
    DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 20 MINUTE))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- APT-005: COMPLETED - Bệnh nhân Em đã khám xong buổi sáng với BS Minh
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status, queue_number,
    reason_for_visit, symptoms, notes, checked_in_at, consultation_started_at, consultation_ended_at,
    doctor_notes, diagnosis, prescription_text, follow_up_recommendations,
    created_at, updated_at) VALUES
(1005, 'APT-20260219-005', 24, 10, 1002, 'PATIENT', 124,
    CURDATE(), '08:30', '09:00', 'COMPLETED', 2,
    'Khám tăng huyết áp', 'Đau đầu, chóng mặt, huyết áp cao', 'Bệnh nhân có tiền sử gout',
    DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 90 MINUTE),
    'Huyết áp 150/95mmHg. Cần điều chỉnh thuốc.',
    'Tăng huyết áp độ 2 (I10)',
    'Amlodipine 5mg x 1 viên/ngày (sáng)\nLosartan 50mg x 1 viên/ngày (tối)',
    'Tái khám sau 2 tuần. Theo dõi huyết áp tại nhà.',
    DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 90 MINUTE))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- APT-006: CANCELLED - Bệnh nhân Phong hủy lịch
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status, queue_number,
    reason_for_visit, symptoms, notes, cancellation_reason, cancelled_by,
    created_at, updated_at) VALUES
(1006, 'APT-20260219-006', 25, 10, 1003, 'PATIENT', 125,
    CURDATE(), '09:00', '09:30', 'CANCELLED', NULL,
    'Khám tổng quát', 'Mệt mỏi, chán ăn', NULL,
    'Bận việc đột xuất, xin hẹn lại', 125,
    DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 4 HOUR))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- APT-007: NO_SHOW - Bệnh nhân Giang không đến
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status, queue_number,
    reason_for_visit, symptoms, notes,
    created_at, updated_at) VALUES
(1007, 'APT-20260219-007', 26, 11, 1102, 'PATIENT', 126,
    CURDATE(), '08:30', '09:00', 'NO_SHOW', NULL,
    'Khám nhi cho bé', 'Bé bị sổ mũi', NULL,
    DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 HOUR))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- APT-008: CONFIRMED - Bệnh nhân Hạnh khám chiều với BS Minh
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status, queue_number,
    reason_for_visit, symptoms, notes, created_at, updated_at) VALUES
(1008, 'APT-20260219-008', 27, 10, 1009, 'RECEPTIONIST', 101,
    CURDATE(), '13:30', '14:00', 'CONFIRMED', NULL,
    'Khám tim mạch', 'Đau ngực trái, khó thở', 'Đặt hộ bởi lễ tân',
    DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- APT-009: PENDING - Bệnh nhân Khoa chờ xác nhận
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status, queue_number,
    reason_for_visit, symptoms, notes, created_at, updated_at) VALUES
(1009, 'APT-20260219-009', 28, 12, 1202, 'PATIENT', 128,
    CURDATE(), '08:30', '09:00', 'PENDING', NULL,
    'Khám nội khoa tổng quát', 'Đau bụng âm ỉ vùng thượng vị', NULL,
    DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_SUB(NOW(), INTERVAL 5 HOUR))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- APT-010: CHECKED_IN - Bệnh nhân Linh đã check-in với BS Hùng
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status, queue_number,
    reason_for_visit, symptoms, notes, checked_in_at,
    created_at, updated_at) VALUES
(1010, 'APT-20260219-010', 29, 12, 1203, 'PATIENT', 129,
    CURDATE(), '09:00', '09:30', 'CHECKED_IN', 2,
    'Tái khám hen suyễn', 'Ho kéo dài, khó thở khi thay đổi thời tiết', 'Hen suyễn mãn tính',
    DATE_SUB(NOW(), INTERVAL 15 MINUTE),
    DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 15 MINUTE))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- ----- HÔM QUA -----

-- APT-011: COMPLETED - Ngày hôm qua
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status, queue_number,
    reason_for_visit, symptoms, doctor_notes, diagnosis, prescription_text, follow_up_recommendations,
    checked_in_at, consultation_started_at, consultation_ended_at,
    created_at, updated_at) VALUES
(1011, 'APT-20260218-001', 20, 12, NULL, 'PATIENT', 120,
    DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:00', '08:30', 'COMPLETED', 1,
    'Khám dạ dày', 'Đau bụng, ợ chua, buồn nôn',
    'Viêm dạ dày mãn tính tái phát. Cần nội soi kiểm tra.',
    'Viêm dạ dày mãn tính (K29.5)',
    'Omeprazole 20mg x 2 viên/ngày (trước ăn)\nSucralfate 1g x 3 gói/ngày',
    'Nội soi dạ dày sau 1 tuần. Tái khám sau 2 tuần.',
    DATE_SUB(NOW(), INTERVAL 25 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 23 HOUR),
    DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 23 HOUR))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- APT-012: COMPLETED - Ngày hôm qua
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status, queue_number,
    reason_for_visit, symptoms, doctor_notes, diagnosis,
    checked_in_at, consultation_started_at, consultation_ended_at,
    created_at, updated_at) VALUES
(1012, 'APT-20260218-002', 21, 11, NULL, 'PATIENT', 121,
    DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:00', '09:30', 'COMPLETED', 3,
    'Khám tai mũi họng cho bé', 'Bé bị viêm họng, sốt',
    'Viêm amidan cấp. Kê kháng sinh 5 ngày.',
    'Viêm amidan cấp (J03)',
    DATE_SUB(NOW(), INTERVAL 26 HOUR), DATE_SUB(NOW(), INTERVAL 25 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR),
    DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 24 HOUR))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- APT-013: CANCELLED - Ngày hôm qua, bệnh nhân hủy
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status,
    reason_for_visit, cancellation_reason, cancelled_by,
    created_at, updated_at) VALUES
(1013, 'APT-20260218-003', 22, 10, NULL, 'PATIENT', 122,
    DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:00', '10:30', 'CANCELLED',
    'Tái khám tim mạch', 'Đi công tác xa, không thể đến được', 122,
    DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 28 HOUR))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- ----- TUẦN TRƯỚC (nhiều hơn cho statistics) -----

INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status, queue_number,
    reason_for_visit, symptoms, doctor_notes, diagnosis,
    checked_in_at, consultation_started_at, consultation_ended_at,
    created_at, updated_at) VALUES
-- Thứ 2 tuần trước
(1020, 'APT-20260212-001', 23, 10, 'PATIENT', 123,
    DATE_SUB(CURDATE(), INTERVAL 7 DAY), '08:00', '08:30', 'COMPLETED', 1,
    'Khám tim mạch', 'Đau ngực', 'Kết quả ECG bình thường', 'Đau ngực không do tim (R07.9)',
    DATE_SUB(NOW(), INTERVAL 168 HOUR), DATE_SUB(NOW(), INTERVAL 167 HOUR), DATE_SUB(NOW(), INTERVAL 166 HOUR),
    DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 166 HOUR)),
(1021, 'APT-20260212-002', 24, 10, 'PATIENT', 124,
    DATE_SUB(CURDATE(), INTERVAL 7 DAY), '08:30', '09:00', 'COMPLETED', 2,
    'Tái khám huyết áp', 'Đau đầu', 'Huyết áp ổn định 130/85', 'Tăng huyết áp kiểm soát tốt (I10)',
    DATE_SUB(NOW(), INTERVAL 168 HOUR), DATE_SUB(NOW(), INTERVAL 166 HOUR), DATE_SUB(NOW(), INTERVAL 165 HOUR),
    DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 165 HOUR)),
(1022, 'APT-20260212-003', 25, 11, 'PATIENT', 125,
    DATE_SUB(CURDATE(), INTERVAL 7 DAY), '09:00', '09:30', 'COMPLETED', 3,
    'Khám nhi tổng quát', 'Biếng ăn', 'Bé phát triển bình thường', 'Khám sức khỏe định kỳ (Z00.1)',
    DATE_SUB(NOW(), INTERVAL 167 HOUR), DATE_SUB(NOW(), INTERVAL 166 HOUR), DATE_SUB(NOW(), INTERVAL 165 HOUR),
    DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 165 HOUR)),
(1023, 'APT-20260212-004', 26, 12, 'RECEPTIONIST', 101,
    DATE_SUB(CURDATE(), INTERVAL 7 DAY), '09:30', '10:00', 'CANCELLED', NULL,
    'Khám nội tổng quát', 'Mệt mỏi',
    NULL, NULL, NULL, NULL, NULL,
    DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 170 HOUR)),

-- Thứ 3 tuần trước
(1024, 'APT-20260213-001', 27, 14, 'PATIENT', 127,
    DATE_SUB(CURDATE(), INTERVAL 6 DAY), '08:00', '08:30', 'COMPLETED', 1,
    'Khám sản định kỳ', 'Thai 28 tuần', 'Thai nhi phát triển tốt. Siêu âm bình thường.',
    'Khám thai định kỳ (Z34)',
    DATE_SUB(NOW(), INTERVAL 144 HOUR), DATE_SUB(NOW(), INTERVAL 143 HOUR), DATE_SUB(NOW(), INTERVAL 142 HOUR),
    DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 142 HOUR)),
(1025, 'APT-20260213-002', 28, 12, 'PATIENT', 128,
    DATE_SUB(CURDATE(), INTERVAL 6 DAY), '08:30', '09:00', 'COMPLETED', 2,
    'Khám dạ dày', 'Đau bụng', 'Viêm dạ dày nhẹ', 'Viêm dạ dày (K29)',
    DATE_SUB(NOW(), INTERVAL 143 HOUR), DATE_SUB(NOW(), INTERVAL 142 HOUR), DATE_SUB(NOW(), INTERVAL 141 HOUR),
    DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 141 HOUR)),
(1026, 'APT-20260213-003', 29, 13, 'PATIENT', 129,
    DATE_SUB(CURDATE(), INTERVAL 6 DAY), '09:00', '09:30', 'NO_SHOW', NULL,
    'Khám da liễu', 'Mụn trứng cá',
    NULL, NULL, NULL, NULL, NULL,
    DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 145 HOUR)),

-- Thứ 4 tuần trước
(1027, 'APT-20260214-001', 30, 10, 'PATIENT', 130,
    DATE_SUB(CURDATE(), INTERVAL 5 DAY), '08:00', '08:30', 'COMPLETED', 1,
    'Khám mạch vành', 'Đau ngực khi gắng sức',
    'Cần chụp CT mạch vành. Kê thuốc chống đông.',
    'Bệnh mạch vành (I25)',
    DATE_SUB(NOW(), INTERVAL 120 HOUR), DATE_SUB(NOW(), INTERVAL 119 HOUR), DATE_SUB(NOW(), INTERVAL 118 HOUR),
    DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 118 HOUR)),
(1028, 'APT-20260214-002', 31, 14, 'PATIENT', 131,
    DATE_SUB(CURDATE(), INTERVAL 5 DAY), '08:30', '09:00', 'COMPLETED', 2,
    'Khám phụ khoa', 'Rối loạn kinh nguyệt',
    'Siêu âm bình thường. Kê thuốc điều hòa.',
    'Rối loạn kinh nguyệt (N92)',
    DATE_SUB(NOW(), INTERVAL 119 HOUR), DATE_SUB(NOW(), INTERVAL 118 HOUR), DATE_SUB(NOW(), INTERVAL 117 HOUR),
    DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 117 HOUR)),
(1029, 'APT-20260214-003', 20, 12, 'PATIENT', 120,
    DATE_SUB(CURDATE(), INTERVAL 5 DAY), '09:00', '09:30', 'COMPLETED', 3,
    'Tái khám dạ dày', 'Đỡ đau bụng',
    'Triệu chứng giảm. Tiếp tục thuốc thêm 2 tuần.',
    'Viêm dạ dày - Tái khám (K29.5)',
    DATE_SUB(NOW(), INTERVAL 118 HOUR), DATE_SUB(NOW(), INTERVAL 117 HOUR), DATE_SUB(NOW(), INTERVAL 116 HOUR),
    DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 116 HOUR)),

-- Thứ 5 tuần trước
(1030, 'APT-20260215-001', 21, 10, 'PATIENT', 121,
    DATE_SUB(CURDATE(), INTERVAL 4 DAY), '08:00', '08:30', 'COMPLETED', 1,
    'Khám tim', 'Hồi hộp, mất ngủ', 'Nhịp tim nhanh xoang. Kê thuốc trấn tĩnh.',
    'Nhịp nhanh xoang (R00.0)',
    DATE_SUB(NOW(), INTERVAL 96 HOUR), DATE_SUB(NOW(), INTERVAL 95 HOUR), DATE_SUB(NOW(), INTERVAL 94 HOUR),
    DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 94 HOUR)),
(1031, 'APT-20260215-002', 22, 12, 'PATIENT', 122,
    DATE_SUB(CURDATE(), INTERVAL 4 DAY), '08:30', '09:00', 'COMPLETED', 2,
    'Tái khám tiểu đường', 'HbA1c tăng', 'HbA1c: 7.8%. Cần tăng liều Metformin.',
    'Đái tháo đường type 2 (E11)',
    DATE_SUB(NOW(), INTERVAL 95 HOUR), DATE_SUB(NOW(), INTERVAL 94 HOUR), DATE_SUB(NOW(), INTERVAL 93 HOUR),
    DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 93 HOUR)),
(1032, 'APT-20260215-003', 23, 13, 'PATIENT', 123,
    DATE_SUB(CURDATE(), INTERVAL 4 DAY), '09:00', '09:30', 'CANCELLED', NULL,
    'Khám da', 'Nổi mẩn',
    NULL, NULL, NULL, NULL, NULL,
    DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 100 HOUR)),

-- Thứ 6 tuần trước
(1033, 'APT-20260216-001', 24, 10, 'RECEPTIONIST', 101,
    DATE_SUB(CURDATE(), INTERVAL 3 DAY), '08:00', '08:30', 'COMPLETED', 1,
    'Tái khám huyết áp', 'Đau đầu nhẹ', 'Huyết áp 135/88. Duy trì thuốc.',
    'Tăng huyết áp (I10)',
    DATE_SUB(NOW(), INTERVAL 72 HOUR), DATE_SUB(NOW(), INTERVAL 71 HOUR), DATE_SUB(NOW(), INTERVAL 70 HOUR),
    DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 70 HOUR)),
(1034, 'APT-20260216-002', 25, 11, 'PATIENT', 125,
    DATE_SUB(CURDATE(), INTERVAL 3 DAY), '08:30', '09:00', 'NO_SHOW', NULL,
    'Khám nhi', 'Bé ho',
    NULL, NULL, NULL, NULL, NULL,
    DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 73 HOUR)),
(1035, 'APT-20260216-003', 26, 14, 'PATIENT', 126,
    DATE_SUB(CURDATE(), INTERVAL 3 DAY), '09:00', '09:30', 'COMPLETED', 2,
    'Khám sản', 'Thai 20 tuần', 'Siêu âm hình thái bình thường.',
    'Khám thai (Z34)',
    DATE_SUB(NOW(), INTERVAL 71 HOUR), DATE_SUB(NOW(), INTERVAL 70 HOUR), DATE_SUB(NOW(), INTERVAL 69 HOUR),
    DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 69 HOUR))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- ----- NGÀY MAI (tương lai) -----

INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status, queue_number,
    reason_for_visit, symptoms, notes, created_at, updated_at) VALUES
(1040, 'APT-20260220-001', 30, 10, 1013, 'PATIENT', 130,
    DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00', '08:30', 'CONFIRMED', NULL,
    'Tái khám mạch vành', 'Đau ngực giảm', 'Mang theo kết quả CT',
    DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(1041, 'APT-20260220-002', 31, 10, 1014, 'PATIENT', 131,
    DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:30', '09:00', 'PENDING', NULL,
    'Khám tim mạch lần đầu', 'Đau ngực, mệt mỏi', NULL,
    DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1042, 'APT-20260220-003', 20, 11, 1107, 'RECEPTIONIST', 101,
    DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00', '08:30', 'CONFIRMED', NULL,
    'Khám nhi cho con', 'Bé bị nôn trớ', 'Bé 3 tuổi, đặt lịch bởi lễ tân',
    DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 6 HOUR)),
-- RESCHEDULED appointment
(1043, 'APT-20260220-004', 27, 12, NULL, 'PATIENT', 127,
    DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00', '09:30', 'RESCHEDULED', NULL,
    'Khám nội tổng quát', 'Mệt mỏi kéo dài', 'Đã dời từ hôm nay sang ngày mai',
    DATE_SUB(NOW(), INTERVAL 3 DAY), NOW())
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- ----- TUẦN SAU -----

INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, booked_by,
    booked_by_user_id, appointment_date, start_time, end_time, status,
    reason_for_visit, symptoms, created_at, updated_at) VALUES
(1050, 'APT-20260223-001', 22, 10, 'PATIENT', 122,
    DATE_ADD(CURDATE(), INTERVAL 4 DAY), '08:00', '08:30', 'PENDING',
    'Tái khám tim mạch', 'Đau ngực nhẹ',
    NOW(), NOW()),
(1051, 'APT-20260223-002', 29, 14, 'PATIENT', 129,
    DATE_ADD(CURDATE(), INTERVAL 4 DAY), '08:30', '09:00', 'CONFIRMED',
    'Khám phụ khoa', 'Đau bụng dưới',
    DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
(1052, 'APT-20260224-001', 28, 13, 'PATIENT', 128,
    DATE_ADD(CURDATE(), INTERVAL 5 DAY), '09:00', '09:30', 'PENDING',
    'Khám da liễu', 'Mụn lâu năm, muốn tư vấn',
    NOW(), NOW()),
(1053, 'APT-20260225-001', 30, 12, 'RECEPTIONIST', 101,
    DATE_ADD(CURDATE(), INTERVAL 6 DAY), '08:00', '08:30', 'CONFIRMED',
    'Khám nội tổng quát', 'Kiểm tra sức khỏe định kỳ',
    DATE_SUB(NOW(), INTERVAL 2 DAY), NOW())
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- =============================================================================
-- 10. APPOINTMENT HISTORIES (lịch sử thay đổi trạng thái)
-- =============================================================================

INSERT INTO appointment_histories (id, appointment_id, action, old_status, new_status,
    changed_by_user_id, changed_by_role, reason, changed_at) VALUES
-- APT-002: PENDING -> CONFIRMED
(1, 1002, 'STATUS_CHANGE', 'PENDING', 'CONFIRMED', 111, 'DOCTOR', 'Bác sĩ xác nhận lịch hẹn', DATE_SUB(NOW(), INTERVAL 1 HOUR)),

-- APT-003: PENDING -> CONFIRMED -> CHECKED_IN
(2, 1003, 'STATUS_CHANGE', 'PENDING', 'CONFIRMED', 112, 'DOCTOR', 'Xác nhận lịch tái khám', DATE_SUB(NOW(), INTERVAL 20 HOUR)),
(3, 1003, 'STATUS_CHANGE', 'CONFIRMED', 'CHECKED_IN', 101, 'RECEPTIONIST', 'Bệnh nhân đã đến, check-in', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),

-- APT-004: PENDING -> CONFIRMED -> CHECKED_IN -> IN_PROGRESS
(4, 1004, 'STATUS_CHANGE', 'PENDING', 'CONFIRMED', 113, 'DOCTOR', NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(5, 1004, 'STATUS_CHANGE', 'CONFIRMED', 'CHECKED_IN', 101, 'RECEPTIONIST', NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(6, 1004, 'STATUS_CHANGE', 'CHECKED_IN', 'IN_PROGRESS', 113, 'DOCTOR', 'Bắt đầu khám', DATE_SUB(NOW(), INTERVAL 20 MINUTE)),

-- APT-005: full lifecycle -> COMPLETED
(7, 1005, 'STATUS_CHANGE', 'PENDING', 'CONFIRMED', 110, 'DOCTOR', NULL, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(8, 1005, 'STATUS_CHANGE', 'CONFIRMED', 'CHECKED_IN', 101, 'RECEPTIONIST', NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(9, 1005, 'STATUS_CHANGE', 'CHECKED_IN', 'IN_PROGRESS', 110, 'DOCTOR', NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(10, 1005, 'STATUS_CHANGE', 'IN_PROGRESS', 'COMPLETED', 110, 'DOCTOR', 'Hoàn thành khám. Kê đơn thuốc.', DATE_SUB(NOW(), INTERVAL 90 MINUTE)),

-- APT-006: PENDING -> CONFIRMED -> CANCELLED
(11, 1006, 'STATUS_CHANGE', 'PENDING', 'CONFIRMED', 110, 'DOCTOR', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(12, 1006, 'STATUS_CHANGE', 'CONFIRMED', 'CANCELLED', 125, 'PATIENT', 'Bận việc đột xuất, xin hẹn lại', DATE_SUB(NOW(), INTERVAL 4 HOUR)),

-- APT-007: CONFIRMED -> NO_SHOW
(13, 1007, 'STATUS_CHANGE', 'PENDING', 'CONFIRMED', 111, 'DOCTOR', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(14, 1007, 'STATUS_CHANGE', 'CONFIRMED', 'NO_SHOW', 100, 'ADMIN', 'Bệnh nhân không đến sau 30 phút', DATE_SUB(NOW(), INTERVAL 1 HOUR)),

-- APT-043: CONFIRMED -> RESCHEDULED
(15, 1043, 'STATUS_CHANGE', 'PENDING', 'CONFIRMED', 112, 'DOCTOR', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(16, 1043, 'RESCHEDULE', 'CONFIRMED', 'RESCHEDULED', 127, 'PATIENT', 'Có việc bận, xin dời sang ngày mai', NOW())
ON DUPLICATE KEY UPDATE action = VALUES(action);

-- =============================================================================
-- 11. PAYMENTS (liên kết với appointments đã COMPLETED)
-- =============================================================================

INSERT INTO payments (id, payment_code, appointment_id, patient_id, amount, discount_amount,
    tax_amount, total_amount, currency, payment_method, payment_status,
    transaction_id, paid_at, processed_by, notes, created_at, updated_at) VALUES
-- APT-005: COMPLETED -> PAID
(1, 'PAY-20260219-001', 1005, 24, 500000, 0, 50000, 550000, 'VND', 'CASH', 'COMPLETED',
    NULL, DATE_SUB(NOW(), INTERVAL 85 MINUTE), 101, 'Thanh toán tiền mặt tại quầy',
    DATE_SUB(NOW(), INTERVAL 90 MINUTE), DATE_SUB(NOW(), INTERVAL 85 MINUTE)),

-- APT-011: COMPLETED -> PAID qua VNPay
(2, 'PAY-20260218-001', 1011, 20, 550000, 50000, 50000, 550000, 'VND', 'VNPAY', 'COMPLETED',
    'VNP-20260218-XYZ123', DATE_SUB(NOW(), INTERVAL 22 HOUR), NULL, 'Thanh toán online VNPay',
    DATE_SUB(NOW(), INTERVAL 23 HOUR), DATE_SUB(NOW(), INTERVAL 22 HOUR)),

-- APT-012: COMPLETED -> PAID qua MoMo
(3, 'PAY-20260218-002', 1012, 21, 450000, 0, 45000, 495000, 'VND', 'MOMO', 'COMPLETED',
    'MOMO-20260218-ABC456', DATE_SUB(NOW(), INTERVAL 23 HOUR), NULL, 'Thanh toán MoMo',
    DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 23 HOUR)),

-- APT-020: COMPLETED -> PAID
(4, 'PAY-20260212-001', 1020, 23, 500000, 0, 50000, 550000, 'VND', 'CASH', 'COMPLETED',
    NULL, DATE_SUB(NOW(), INTERVAL 166 HOUR), 101, NULL,
    DATE_SUB(NOW(), INTERVAL 167 HOUR), DATE_SUB(NOW(), INTERVAL 166 HOUR)),

-- APT-001: PENDING (chưa thanh toán)
(5, 'PAY-20260219-002', 1001, 20, 500000, 0, 50000, 550000, 'VND', NULL, 'PENDING',
    NULL, NULL, NULL, NULL,
    DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),

-- APT-006: CANCELLED -> REFUNDED
(6, 'PAY-20260219-003', 1006, 25, 500000, 0, 50000, 550000, 'VND', 'VNPAY', 'REFUNDED',
    'VNP-20260219-REF001', DATE_SUB(NOW(), INTERVAL 1 DAY), 101,
    'Hoàn tiền do bệnh nhân hủy lịch',
    DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 3 HOUR)),

-- Nhiều payments cho tuần trước
(7, 'PAY-20260212-002', 1021, 24, 500000, 0, 50000, 550000, 'VND', 'CASH', 'COMPLETED',
    NULL, DATE_SUB(NOW(), INTERVAL 165 HOUR), 101, NULL,
    DATE_SUB(NOW(), INTERVAL 166 HOUR), DATE_SUB(NOW(), INTERVAL 165 HOUR)),
(8, 'PAY-20260212-003', 1022, 25, 450000, 0, 45000, 495000, 'VND', 'MOMO', 'COMPLETED',
    'MOMO-20260212-DEF789', DATE_SUB(NOW(), INTERVAL 165 HOUR), NULL, NULL,
    DATE_SUB(NOW(), INTERVAL 166 HOUR), DATE_SUB(NOW(), INTERVAL 165 HOUR)),
(9, 'PAY-20260213-001', 1024, 27, 480000, 0, 48000, 528000, 'VND', 'CASH', 'COMPLETED',
    NULL, DATE_SUB(NOW(), INTERVAL 142 HOUR), 101, NULL,
    DATE_SUB(NOW(), INTERVAL 143 HOUR), DATE_SUB(NOW(), INTERVAL 142 HOUR)),
(10, 'PAY-20260214-001', 1027, 30, 500000, 0, 50000, 550000, 'VND', 'VNPAY', 'COMPLETED',
    'VNP-20260214-GHI012', DATE_SUB(NOW(), INTERVAL 118 HOUR), NULL, NULL,
    DATE_SUB(NOW(), INTERVAL 119 HOUR), DATE_SUB(NOW(), INTERVAL 118 HOUR)),
(11, 'PAY-20260215-001', 1030, 21, 500000, 0, 50000, 550000, 'VND', 'CASH', 'COMPLETED',
    NULL, DATE_SUB(NOW(), INTERVAL 94 HOUR), 101, NULL,
    DATE_SUB(NOW(), INTERVAL 95 HOUR), DATE_SUB(NOW(), INTERVAL 94 HOUR)),
(12, 'PAY-20260216-001', 1033, 24, 500000, 0, 50000, 550000, 'VND', 'CASH', 'COMPLETED',
    NULL, DATE_SUB(NOW(), INTERVAL 70 HOUR), 101, NULL,
    DATE_SUB(NOW(), INTERVAL 71 HOUR), DATE_SUB(NOW(), INTERVAL 70 HOUR))
ON DUPLICATE KEY UPDATE payment_code = VALUES(payment_code);

-- =============================================================================
-- 12. MEDICAL RECORDS (cho các appointment COMPLETED)
-- =============================================================================

INSERT INTO medical_records (id, record_code, patient_id, appointment_id, doctor_id, visit_date,
    chief_complaint, present_illness, vital_signs, physical_exam, diagnosis, diagnosis_code,
    treatment_plan, prescription, follow_up_date, follow_up_notes,
    is_confidential, created_at, updated_at) VALUES
(1, 'MR-20260219-001', 24, 1005, 10, CURDATE(),
    'Đau đầu, chóng mặt, huyết áp cao',
    'Bệnh nhân nam 43 tuổi, tiền sử tăng huyết áp 5 năm. Đau đầu tăng 1 tuần nay.',
    '{"blood_pressure": "150/95", "heart_rate": 82, "temperature": 36.5, "weight_kg": 75, "height_cm": 170}',
    'Tim đều, phổi trong, bụng mềm. Không phù chi.',
    'Tăng huyết áp độ 2', 'I10',
    'Điều chỉnh thuốc hạ áp. Theo dõi huyết áp tại nhà.',
    'Amlodipine 5mg x 1 viên/ngày\nLosartan 50mg x 1 viên/ngày',
    DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'Tái khám sau 2 tuần, mang theo sổ theo dõi huyết áp',
    0, NOW(), NOW()),

(2, 'MR-20260218-001', 20, 1011, 12, DATE_SUB(CURDATE(), INTERVAL 1 DAY),
    'Đau bụng, ợ chua, buồn nôn',
    'Bệnh nhân nam 35 tuổi, viêm dạ dày mãn tính. Tái phát sau 3 tháng.',
    '{"blood_pressure": "120/80", "heart_rate": 76, "temperature": 36.7, "weight_kg": 68, "height_cm": 172}',
    'Bụng ấn đau thượng vị, còn lại bình thường.',
    'Viêm dạ dày mãn tính tái phát', 'K29.5',
    'Nội soi dạ dày. Thuốc ức chế bơm proton + bảo vệ niêm mạc.',
    'Omeprazole 20mg x 2 viên/ngày\nSucralfate 1g x 3 gói/ngày',
    DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Nội soi dạ dày, mang kết quả tái khám',
    0, DATE_SUB(NOW(), INTERVAL 23 HOUR), DATE_SUB(NOW(), INTERVAL 23 HOUR)),

(3, 'MR-20260218-002', 21, 1012, 11, DATE_SUB(CURDATE(), INTERVAL 1 DAY),
    'Bé bị viêm họng, sốt',
    'Bé gái 5 tuổi, sốt 38.5°C, đau họng 2 ngày.',
    '{"temperature": 38.5, "heart_rate": 100, "weight_kg": 18}',
    'Họng đỏ, amidan sưng to. Hạch cổ sờ nhẹ.',
    'Viêm amidan cấp', 'J03',
    'Kháng sinh 5 ngày. Hạ sốt khi cần.',
    'Amoxicillin 250mg x 3 lần/ngày x 5 ngày\nParacetamol 150mg khi sốt trên 38.5°C',
    DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Tái khám nếu sốt không giảm sau 3 ngày',
    0, DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR))
ON DUPLICATE KEY UPDATE record_code = VALUES(record_code);

-- =============================================================================
-- 13. PRESCRIPTIONS (đơn thuốc cho appointments COMPLETED)
-- =============================================================================

INSERT INTO prescriptions (id, patient_id, doctor_id, appointment_id, prescription_date,
    diagnosis, notes, follow_up_date, is_active, created_at, updated_at) VALUES
(1, 24, 10, 1005, CURDATE(),
    'Tăng huyết áp độ 2 (I10)',
    'Uống thuốc đều đặn, theo dõi huyết áp mỗi ngày',
    DATE_ADD(CURDATE(), INTERVAL 14 DAY), 1, NOW(), NOW()),
(2, 20, 12, 1011, DATE_SUB(CURDATE(), INTERVAL 1 DAY),
    'Viêm dạ dày mãn tính (K29.5)',
    'Uống trước ăn 30 phút. Kiêng đồ cay, chua.',
    DATE_ADD(CURDATE(), INTERVAL 7 DAY), 1,
    DATE_SUB(NOW(), INTERVAL 23 HOUR), DATE_SUB(NOW(), INTERVAL 23 HOUR)),
(3, 21, 11, 1012, DATE_SUB(CURDATE(), INTERVAL 1 DAY),
    'Viêm amidan cấp (J03)',
    'Uống đủ liều kháng sinh. Tái khám nếu vẫn sốt.',
    DATE_ADD(CURDATE(), INTERVAL 5 DAY), 1,
    DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR))
ON DUPLICATE KEY UPDATE patient_id = VALUES(patient_id);

-- Prescription items
INSERT INTO prescription_items (id, prescription_id, medicine_name, dosage, frequency,
    duration, quantity, unit, instructions, notes, item_order) VALUES
-- Đơn thuốc 1: Huyết áp
(1, 1, 'Amlodipine', '5mg', '1 lần/ngày (sáng)', '30 ngày', 30, 'viên',
    'Uống sau ăn sáng', 'Thuốc chẹn kênh Canxi', 1),
(2, 1, 'Losartan', '50mg', '1 lần/ngày (tối)', '30 ngày', 30, 'viên',
    'Uống sau ăn tối', 'Thuốc ức chế thụ thể Angiotensin II', 2),

-- Đơn thuốc 2: Dạ dày
(3, 2, 'Omeprazole', '20mg', '2 lần/ngày', '14 ngày', 28, 'viên',
    'Uống trước ăn 30 phút', 'Thuốc ức chế bơm proton', 1),
(4, 2, 'Sucralfate', '1g', '3 lần/ngày', '14 ngày', 42, 'gói',
    'Uống trước ăn 1 giờ, pha với nước', 'Thuốc bảo vệ niêm mạc dạ dày', 2),

-- Đơn thuốc 3: Viêm amidan
(5, 3, 'Amoxicillin', '250mg', '3 lần/ngày', '5 ngày', 15, 'viên',
    'Uống sau ăn', 'Kháng sinh - uống đủ liều', 1),
(6, 3, 'Paracetamol', '150mg', 'Khi sốt trên 38.5°C, cách 4-6h', '5 ngày', 10, 'viên',
    'Không quá 4 lần/ngày', 'Thuốc hạ sốt', 2)
ON DUPLICATE KEY UPDATE medicine_name = VALUES(medicine_name);

-- =============================================================================
-- 14. REVIEWS (đánh giá sau khi khám xong)
-- =============================================================================

INSERT INTO reviews (id, appointment_id, patient_id, doctor_id, rating, comment,
    is_anonymous, is_visible, created_at, updated_at) VALUES
(1, 1005, 24, 10, 5,
    'Bác sĩ rất tận tâm, giải thích kỹ lưỡng về tình trạng bệnh. Rất hài lòng!',
    0, 1, DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(2, 1011, 20, 12, 4,
    'Bác sĩ khám kỹ, nhưng phải chờ khá lâu.',
    0, 1, DATE_SUB(NOW(), INTERVAL 20 HOUR), DATE_SUB(NOW(), INTERVAL 20 HOUR)),
(3, 1012, 21, 11, 5,
    'BS Lan rất dịu dàng với trẻ nhỏ, bé không sợ. Tuyệt vời!',
    0, 1, DATE_SUB(NOW(), INTERVAL 22 HOUR), DATE_SUB(NOW(), INTERVAL 22 HOUR)),
(4, 1020, 23, 10, 4,
    'Khám nhanh, chính xác. Phòng khám sạch sẽ.',
    1, 1, DATE_SUB(NOW(), INTERVAL 160 HOUR), DATE_SUB(NOW(), INTERVAL 160 HOUR)),
(5, 1027, 30, 10, 5,
    'BS Minh rất giỏi chuyên môn về tim mạch. Cảm ơn bác sĩ!',
    0, 1, DATE_SUB(NOW(), INTERVAL 115 HOUR), DATE_SUB(NOW(), INTERVAL 115 HOUR)),
(6, 1030, 21, 10, 3,
    'Bác sĩ khám tốt nhưng thời gian chờ quá lâu, hơn 45 phút.',
    0, 1, DATE_SUB(NOW(), INTERVAL 90 HOUR), DATE_SUB(NOW(), INTERVAL 90 HOUR)),
(7, 1024, 27, 14, 5,
    'BS Mai rất nhẹ nhàng, chu đáo. Rất tin tưởng.',
    0, 1, DATE_SUB(NOW(), INTERVAL 140 HOUR), DATE_SUB(NOW(), INTERVAL 140 HOUR))
ON DUPLICATE KEY UPDATE rating = VALUES(rating);

-- =============================================================================
-- 15. INVOICES (hóa đơn cho payments COMPLETED)
-- =============================================================================

INSERT INTO invoices (id, invoice_number, payment_id, patient_id, invoice_date,
    subtotal, discount, tax, total, status, notes, created_at) VALUES
(1, 'INV-20260219-001', 1, 24, CURDATE(),
    500000, 0, 50000, 550000, 'PAID', 'Hóa đơn khám tim mạch', NOW()),
(2, 'INV-20260218-001', 2, 20, DATE_SUB(CURDATE(), INTERVAL 1 DAY),
    550000, 50000, 50000, 550000, 'PAID', 'Hóa đơn khám dạ dày - Giảm giá BH', DATE_SUB(NOW(), INTERVAL 22 HOUR)),
(3, 'INV-20260218-002', 3, 21, DATE_SUB(CURDATE(), INTERVAL 1 DAY),
    450000, 0, 45000, 495000, 'PAID', 'Hóa đơn khám nhi', DATE_SUB(NOW(), INTERVAL 23 HOUR))
ON DUPLICATE KEY UPDATE invoice_number = VALUES(invoice_number);

-- Invoice items
INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total_price, created_at) VALUES
(1, 1, 'Phí khám Tim mạch - BS. Nguyễn Văn Minh', 1, 500000, 500000, NOW()),
(2, 1, 'Thuế GTGT 10%', 1, 50000, 50000, NOW()),
(3, 2, 'Phí khám Nội khoa - BS. Phạm Đức Hùng', 1, 550000, 550000, DATE_SUB(NOW(), INTERVAL 22 HOUR)),
(4, 2, 'Giảm giá bảo hiểm', 1, -50000, -50000, DATE_SUB(NOW(), INTERVAL 22 HOUR)),
(5, 2, 'Thuế GTGT 10%', 1, 50000, 50000, DATE_SUB(NOW(), INTERVAL 22 HOUR)),
(6, 3, 'Phí khám Nhi khoa - BS. Trần Thị Lan', 1, 450000, 450000, DATE_SUB(NOW(), INTERVAL 23 HOUR)),
(7, 3, 'Thuế GTGT 10%', 1, 45000, 45000, DATE_SUB(NOW(), INTERVAL 23 HOUR))
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- =============================================================================
-- 16. PERMISSIONS (cho admin)
-- =============================================================================

INSERT IGNORE INTO permissions (id, name, description, module) VALUES
(1, 'VIEW_ALL_APPOINTMENTS', 'Xem tất cả lịch hẹn', 'APPOINTMENT'),
(2, 'MANAGE_APPOINTMENTS', 'Quản lý lịch hẹn', 'APPOINTMENT'),
(3, 'VIEW_PATIENTS', 'Xem danh sách bệnh nhân', 'PATIENT'),
(4, 'MANAGE_PATIENTS', 'Quản lý bệnh nhân', 'PATIENT'),
(5, 'VIEW_DOCTORS', 'Xem danh sách bác sĩ', 'DOCTOR'),
(6, 'MANAGE_DOCTORS', 'Quản lý bác sĩ', 'DOCTOR'),
(7, 'VIEW_PAYMENTS', 'Xem thanh toán', 'PAYMENT'),
(8, 'MANAGE_PAYMENTS', 'Quản lý thanh toán', 'PAYMENT'),
(9, 'VIEW_REPORTS', 'Xem báo cáo', 'REPORT'),
(10, 'MANAGE_SYSTEM', 'Quản lý hệ thống', 'SYSTEM');

-- Admin gets all permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10);

-- Doctor permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(2, 1), (2, 3), (2, 7);

-- Receptionist permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(3, 1), (3, 2), (3, 3), (3, 7);

-- Patient permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(4, 1);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- VERIFY DATA
-- =============================================================================

SELECT '=== TỔNG KẾT DỮ LIỆU TEST ===' AS info;

SELECT 'Users' AS bang, COUNT(*) AS so_luong FROM users WHERE id >= 100
UNION ALL
SELECT 'Doctors', COUNT(*) FROM doctors WHERE id >= 10
UNION ALL
SELECT 'Patients', COUNT(*) FROM patients WHERE id >= 20
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments WHERE id >= 1000
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments WHERE id >= 1
UNION ALL
SELECT 'Medical Records', COUNT(*) FROM medical_records WHERE id >= 1
UNION ALL
SELECT 'Prescriptions', COUNT(*) FROM prescriptions WHERE id >= 1
UNION ALL
SELECT 'Reviews', COUNT(*) FROM reviews WHERE id >= 1;

SELECT '=== APPOINTMENTS THEO TRẠNG THÁI ===' AS info;

SELECT status, COUNT(*) AS so_luong
FROM appointments WHERE id >= 1000
GROUP BY status
ORDER BY FIELD(status, 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

SELECT '=== APPOINTMENTS HÔM NAY ===' AS info;

SELECT a.appointment_code, a.status, a.start_time, a.end_time,
       p_user.full_name AS patient_name,
       d.full_name AS doctor_name
FROM appointments a
JOIN patients pt ON pt.id = a.patient_id
JOIN users p_user ON p_user.id = pt.user_id
JOIN doctors d ON d.id = a.doctor_id
WHERE a.appointment_date = CURDATE() AND a.id >= 1000
ORDER BY a.start_time;

SELECT 'DONE! Dữ liệu test đã được insert thành công.' AS result;
