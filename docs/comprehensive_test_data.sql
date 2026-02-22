-- =========================================================
-- COMPREHENSIVE TEST DATA FOR MEDICALTECH SYSTEM
-- This script creates complete test data for all tables
-- =========================================================

USE medical_appointment_system;

-- =========================================================
-- 1. CREATE TEST USERS (ADMIN, DOCTORS, RECEPTIONIST, PATIENTS)
-- Password for all test accounts: Test@123456
-- BCrypt hash: $2a$10$N9qo8uLOickgf2ZspXB.HendITzpOQXlXjBsWl9vPTN0BxrSjB.2a
-- =========================================================

-- Admin User
INSERT INTO users (id, email, password_hash, phone, is_active, is_verified, created_at, updated_at)
VALUES 
(101, 'admin@meditech.com', '$2a$10$N9qo8uLOickgf2ZspXB.HendITzpOQXlXjBsWl9vPTN0BxrSjB.2a', '0901234501', 1, 1, NOW(), NOW()),
-- Doctor Users
(102, 'dr.nguyen@meditech.com', '$2a$10$N9qo8uLOickgf2ZspXB.HendITzpOQXlXjBsWl9vPTN0BxrSjB.2a', '0901234502', 1, 1, NOW(), NOW()),
(103, 'dr.tran@meditech.com', '$2a$10$N9qo8uLOickgf2ZspXB.HendITzpOQXlXjBsWl9vPTN0BxrSjB.2a', '0901234503', 1, 1, NOW(), NOW()),
(104, 'dr.le@meditech.com', '$2a$10$N9qo8uLOickgf2ZspXB.HendITzpOQXlXjBsWl9vPTN0BxrSjB.2a', '0901234504', 1, 1, NOW(), NOW()),
(105, 'dr.pham@meditech.com', '$2a$10$N9qo8uLOickgf2ZspXB.HendITzpOQXlXjBsWl9vPTN0BxrSjB.2a', '0901234505', 1, 1, NOW(), NOW()),
-- Receptionist Users
(106, 'receptionist1@meditech.com', '$2a$10$N9qo8uLOickgf2ZspXB.HendITzpOQXlXjBsWl9vPTN0BxrSjB.2a', '0901234506', 1, 1, NOW(), NOW()),
(107, 'receptionist2@meditech.com', '$2a$10$N9qo8uLOickgf2ZspXB.HendITzpOQXlXjBsWl9vPTN0BxrSjB.2a', '0901234507', 1, 1, NOW(), NOW()),
-- Patient Users
(108, 'patient1@gmail.com', '$2a$10$N9qo8uLOickgf2ZspXB.HendITzpOQXlXjBsWl9vPTN0BxrSjB.2a', '0901234508', 1, 1, NOW(), NOW()),
(109, 'patient2@gmail.com', '$2a$10$N9qo8uLOickgf2ZspXB.HendITzpOQXlXjBsWl9vPTN0BxrSjB.2a', '0901234509', 1, 1, NOW(), NOW()),
(110, 'patient3@gmail.com', '$2a$10$N9qo8uLOickgf2ZspXB.HendITzpOQXlXjBsWl9vPTN0BxrSjB.2a', '0901234510', 1, 1, NOW(), NOW()),
(111, 'patient4@gmail.com', '$2a$10$N9qo8uLOickgf2ZspXB.HendITzpOQXlXjBsWl9vPTN0BxrSjB.2a', '0901234511', 1, 1, NOW(), NOW()),
(112, 'patient5@gmail.com', '$2a$10$N9qo8uLOickgf2ZspXB.HendITzpOQXlXjBsWl9vPTN0BxrSjB.2a', '0901234512', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- =========================================================
-- 2. ASSIGN ROLES TO USERS
-- =========================================================

INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES 
(101, 1, NOW()), -- Admin
(102, 2, NOW()), -- Doctor
(103, 2, NOW()), -- Doctor
(104, 2, NOW()), -- Doctor
(105, 2, NOW()), -- Doctor
(106, 3, NOW()), -- Receptionist
(107, 3, NOW()), -- Receptionist
(108, 4, NOW()), -- Patient
(109, 4, NOW()), -- Patient
(110, 4, NOW()), -- Patient
(111, 4, NOW()), -- Patient
(112, 4, NOW())  -- Patient
ON DUPLICATE KEY UPDATE assigned_at = NOW();

-- =========================================================
-- 3. CREATE DOCTOR PROFILES
-- =========================================================

INSERT INTO doctors (id, user_id, full_name, license_number, bio, education, experience_years, consultation_fee, follow_up_fee, rating_avg, rating_count, is_available, hospital_affiliation, office_address, created_at, updated_at)
VALUES
(102, 102, 'BS. Nguyễn Văn An', 'LIC-TIM-001', 
 'Bác sĩ chuyên khoa Tim mạch với hơn 15 năm kinh nghiệm. Chuyên điều trị các bệnh lý tim mạch phức tạp.',
 'Đại học Y Hà Nội, Bệnh viện Bạch Mai, Chứng chỉ Tim mạch Quốc tế',
 15, 800000, 500000, 4.8, 120, 1, 
 'Bệnh viện Chợ Rẫy', 
 '201B Nguyễn Chí Thanh, P.12, Q.5, TP.HCM',
 NOW(), NOW()),

(103, 103, 'BS. Trần Thị Bình', 'LIC-NHI-002',
 'Bác sĩ chuyên khoa Nhi với tâm huyết chăm sóc trẻ em. Giỏi giao tiếp với trẻ nhỏ.',
 'Đại học Y Dược TP.HCM, Bệnh viện Nhi Đồng 1',
 12, 600000, 400000, 4.9, 200, 1,
 'Bệnh viện Nhi Đồng 1',
 '341 Sư Vạn Hạnh, P.12, Q.10, TP.HCM',
 NOW(), NOW()),

(104, 104, 'BS. Lê Hoàng Cường', 'LIC-DA-003',
 'Bác sĩ Da liễu chuyên điều trị mụn, nám và các bệnh lý da phức tạp. Ứng dụng công nghệ laser hiện đại.',
 'Đại học Y Hà Nội, Chứng chỉ Da liễu Châu Âu',
 10, 700000, 450000, 4.7, 85, 1,
 'Bệnh viện Da Liễu TP.HCM',
 '2 Nguyễn Thông, P.6, Q.3, TP.HCM',
 NOW(), NOW()),

(105, 105, 'BS. Phạm Minh Dương', 'LIC-NOI-004',
 'Bác sĩ Nội khoa tổng quát với kinh nghiệm phong phú trong chẩn đoán và điều trị đa dạng.',
 'Đại học Y Hải Phòng, Bệnh viện Bình Dân',
 8, 500000, 300000, 4.6, 95, 1,
 'Bệnh viện Bình Dân',
 '371 Điện Biên Phủ, P.17, Q. Bình Thạnh, TP.HCM',
 NOW(), NOW())
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- =========================================================
-- 4. ASSIGN SPECIALTIES TO DOCTORS
-- =========================================================

INSERT INTO doctor_specialties (doctor_id, specialty_id, is_primary)
VALUES
(102, 6, 1),  -- BS. An - Tim mạch (primary)
(102, 1, 0),  -- BS. An - Nội khoa (secondary)
(103, 3, 1),  -- BS. Bình - Nhi khoa (primary)
(104, 5, 1),  -- BS. Cường - Da liễu (primary)
(105, 1, 1)   -- BS. Dương - Nội khoa (primary)
ON DUPLICATE KEY UPDATE is_primary = VALUES(is_primary);

-- =========================================================
-- 5. CREATE DOCTOR SCHEDULES
-- =========================================================

-- BS. Nguyễn Văn An (Tim mạch) - Thứ 2, 4, 6
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, max_patients, is_active)
VALUES
(102, 1, '08:00:00', '12:00:00', 30, 16, 1), -- Monday morning
(102, 1, '14:00:00', '17:00:00', 30, 12, 1), -- Monday afternoon
(102, 3, '08:00:00', '12:00:00', 30, 16, 1), -- Wednesday morning
(102, 3, '14:00:00', '17:00:00', 30, 12, 1), -- Wednesday afternoon
(102, 5, '08:00:00', '12:00:00', 30, 16, 1), -- Friday morning
(102, 5, '14:00:00', '17:00:00', 30, 12, 1), -- Friday afternoon

-- BS. Trần Thị Bình (Nhi khoa) - Thứ 2, 3, 4, 5, 6
(103, 1, '08:00:00', '12:00:00', 20, 24, 1),
(103, 1, '14:00:00', '17:00:00', 20, 18, 1),
(103, 2, '08:00:00', '12:00:00', 20, 24, 1),
(103, 2, '14:00:00', '17:00:00', 20, 18, 1),
(103, 3, '08:00:00', '12:00:00', 20, 24, 1),
(103, 3, '14:00:00', '17:00:00', 20, 18, 1),
(103, 4, '08:00:00', '12:00:00', 20, 24, 1),
(103, 4, '14:00:00', '17:00:00', 20, 18, 1),
(103, 5, '08:00:00', '12:00:00', 20, 24, 1),
(103, 5, '14:00:00', '17:00:00', 20, 18, 1),

-- BS. Lê Hoàng Cường (Da liễu) - Thứ 3, 5, 7
(104, 2, '09:00:00', '12:00:00', 30, 12, 1),
(104, 2, '14:00:00', '18:00:00', 30, 16, 1),
(104, 4, '09:00:00', '12:00:00', 30, 12, 1),
(104, 4, '14:00:00', '18:00:00', 30, 16, 1),
(104, 6, '09:00:00', '12:00:00', 30, 12, 1),

-- BS. Phạm Minh Dương (Nội khoa) - Thứ 2, 4, 6
(105, 1, '08:00:00', '11:30:00', 30, 14, 1),
(105, 1, '13:30:00', '17:00:00', 30, 14, 1),
(105, 3, '08:00:00', '11:30:00', 30, 14, 1),
(105, 3, '13:30:00', '17:00:00', 30, 14, 1),
(105, 5, '08:00:00', '11:30:00', 30, 14, 1),
(105, 5, '13:30:00', '17:00:00', 30, 14, 1)
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

-- =========================================================
-- 6. CREATE RECEPTIONIST PROFILES
-- =========================================================

INSERT INTO receptionists (id, user_id, full_name, employee_id, department, shift, is_active)
VALUES
(106, 106, 'Nguyễn Thị Hoa', 'EMP-REC-001', 'Tiếp đón', 'MORNING', 1),
(107, 107, 'Trần Văn Bình', 'EMP-REC-002', 'Tiếp đón', 'AFTERNOON', 1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- =========================================================
-- 7. CREATE PATIENT PROFILES
-- =========================================================

INSERT INTO patients (id, user_id, full_name, date_of_birth, gender, identity_number, address, city, district, ward, emergency_contact, emergency_phone, blood_type, height_cm, weight_kg, allergies, chronic_conditions, insurance_number, insurance_provider)
VALUES
(108, 108, 'Nguyễn Thị Mai', '1990-05-15', 'FEMALE', '079090012345', 
 '123 Lê Lợi, P.Bến Thành', 'TP.HCM', 'Quận 1', 'Phường Bến Thành',
 'Nguyễn Văn A', '0912345678', 'A+', 160.00, 55.00, 
 'Không dị ứng', 'Không có bệnh mãn tính', 'INS-001-2024', 'Bảo Việt'),

(109, 109, 'Trần Văn Hùng', '1985-08-20', 'MALE', '079085067890',
 '456 Nguyễn Huệ, P.Bến Nghé', 'TP.HCM', 'Quận 1', 'Phường Bến Nghé',
 'Trần Thị B', '0923456789', 'B+', 175.00, 70.00,
 'Dị ứng Penicillin', 'Cao huyết áp', 'INS-002-2024', 'Prudential'),

(110, 110, 'Lê Hoàng Lan', '2015-03-10', 'FEMALE', '079115034567',
 '789 Võ Văn Tần, P.5', 'TP.HCM', 'Quận 3', 'Phường 5',
 'Lê Văn C', '0934567890', 'O+', 120.00, 30.00,
 'Dị ứng hải sản', 'Không có', 'INS-003-2024', 'Manulife'),

(111, 111, 'Phạm Minh Tuấn', '1995-12-05', 'MALE', '079095123456',
 '321 Điện Biên Phủ, P.17', 'TP.HCM', 'Quận Bình Thạnh', 'Phường 17',
 'Phạm Thị D', '0945678901', 'AB+', 170.00, 65.00,
 'Không dị ứng', 'Tiểu đường type 2', 'INS-004-2024', 'AIA'),

(112, 112, 'Võ Thị Ngọc', '2000-07-25', 'FEMALE', '079000078901',
 '654 Cách Mạng Tháng 8, P.6', 'TP.HCM', 'Quận 3', 'Phường 6',
 'Võ Văn E', '0956789012', 'A-', 165.00, 52.00,
 'Dị ứng bụi', 'Viêm xoang mãn tính', 'INS-005-2024', 'Sun Life')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- =========================================================
-- 8. CREATE NOTIFICATION PREFERENCES FOR USERS
-- =========================================================

INSERT INTO notification_preferences (user_id, email_enabled, sms_enabled, push_enabled, appointment_reminders, promotional_emails, reminder_hours_before)
VALUES
(108, 1, 1, 1, 1, 0, 24),
(109, 1, 1, 1, 1, 1, 48),
(110, 1, 1, 1, 1, 0, 24),
(111, 1, 0, 1, 1, 0, 24),
(112, 1, 1, 1, 1, 1, 24)
ON DUPLICATE KEY UPDATE email_enabled = VALUES(email_enabled);

-- =========================================================
-- 9. CREATE TIME SLOTS (Next 7 days)
-- =========================================================

-- Generate time slots for the next week
-- BS. Nguyễn Văn An (102) - Monday slots
INSERT INTO time_slots (doctor_id, slot_date, start_time, end_time, status)
SELECT 102, DATE_ADD(CURDATE(), INTERVAL d DAY), '08:00:00', '08:30:00', 'AVAILABLE'
FROM (SELECT 0 AS d UNION SELECT 7 UNION SELECT 14) AS days
WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL d DAY)) = 2
UNION ALL
SELECT 102, DATE_ADD(CURDATE(), INTERVAL d DAY), '08:30:00', '09:00:00', 'AVAILABLE'
FROM (SELECT 0 AS d UNION SELECT 7 UNION SELECT 14) AS days
WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL d DAY)) = 2
UNION ALL
SELECT 102, DATE_ADD(CURDATE(), INTERVAL d DAY), '09:00:00', '09:30:00', 'AVAILABLE'
FROM (SELECT 0 AS d UNION SELECT 7 UNION SELECT 14) AS days
WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL d DAY)) = 2
UNION ALL
SELECT 102, DATE_ADD(CURDATE(), INTERVAL d DAY), '09:30:00', '10:00:00', 'AVAILABLE'
FROM (SELECT 0 AS d UNION SELECT 7 UNION SELECT 14) AS days
WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL d DAY)) = 2
UNION ALL
SELECT 102, DATE_ADD(CURDATE(), INTERVAL d DAY), '10:00:00', '10:30:00', 'AVAILABLE'
FROM (SELECT 0 AS d UNION SELECT 7 UNION SELECT 14) AS days
WHERE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL d DAY)) = 2
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Simple time slots for testing (manual insert for specific dates)
-- Today + 1 day slots for Doctor 103 (Nhi khoa)
INSERT INTO time_slots (doctor_id, slot_date, start_time, end_time, status)
VALUES
(103, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00', '08:20:00', 'AVAILABLE'),
(103, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:20:00', '08:40:00', 'AVAILABLE'),
(103, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:40:00', '09:00:00', 'AVAILABLE'),
(103, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '09:20:00', 'AVAILABLE'),
(103, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:20:00', '09:40:00', 'AVAILABLE'),
(103, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '14:20:00', 'AVAILABLE'),
(103, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:20:00', '14:40:00', 'AVAILABLE'),
(103, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:40:00', '15:00:00', 'AVAILABLE')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- =========================================================
-- 10. CREATE SAMPLE APPOINTMENTS
-- =========================================================

INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, time_slot_id, booked_by, appointment_date, appointment_time, status, reason, created_at, updated_at)
VALUES
(1001, 'APT-2026-001001', 108, 102, NULL, 108, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:00:00', 'CONFIRMED', 
 'Đau ngực, khó thở, cần kiểm tra tim mạch', NOW(), NOW()),

(1002, 'APT-2026-001002', 109, 102, NULL, 106, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:30:00', 'CONFIRMED',
 'Tái khám sau phẫu thuật tim', NOW(), NOW()),

(1003, 'APT-2026-001003', 110, 103, NULL, 110, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00', 'CONFIRMED',
 'Trẻ bị sốt cao, ho nhiều', NOW(), NOW()),

(1004, 'APT-2026-001004', 111, 105, NULL, 111, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '14:00:00', 'PENDING',
 'Đau dạ dày, khó tiêu', NOW(), NOW()),

(1005, 'APT-2026-001005', 112, 104, NULL, 112, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '15:00:00', 'CONFIRMED',
 'Mụn trứng cá, da nhờn', NOW(), NOW()),

-- Past appointments (for history)
(1006, 'APT-2026-001006', 108, 103, NULL, 108, DATE_SUB(CURDATE(), INTERVAL 7 DAY), '10:00:00', 'COMPLETED',
 'Khám sức khỏe định kỳ', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),

(1007, 'APT-2026-001007', 109, 105, NULL, 109, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '11:00:00', 'COMPLETED',
 'Tái khám cao huyết áp', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE appointment_code = VALUES(appointment_code);

-- =========================================================
-- 11. CREATE MEDICATIONS DATABASE
-- =========================================================

INSERT INTO medications (id, code, name, generic_name, brand_name, category, dosage_form, strength, unit, manufacturer, country_of_origin, description, side_effects, contraindications, storage_conditions, requires_prescription, unit_price, is_active)
VALUES
(201, 'MED-001', 'Paracetamol 500mg', 'Paracetamol', 'Tylenol', 'Giảm đau - Hạ sốt', 'Viên nén', '500mg', 'Viên', 
 'Dược phẩm Hà Tây', 'Việt Nam', 
 'Thuốc giảm đau, hạ sốt phổ biến, an toàn cho cả trẻ em và người lớn.',
 'Hiếm gặp: Buồn nôn, nôn, phát ban da',
 'Người suy gan nặng, quá mẫn với Paracetamol',
 'Nơi khô mát, tránh ánh sáng', 0, 2000, 1),

(202, 'MED-002', 'Amoxicillin 500mg', 'Amoxicillin', 'Augmentin', 'Kháng sinh', 'Viên nang', '500mg', 'Viên',
 'DHG Pharma', 'Việt Nam',
 'Kháng sinh nhóm Penicillin, điều trị nhiễm khuẩn đường hô hấp, tai mũi họng.',
 'Buồn nôn, tiêu chảy, phát ban da, dị ứng',
 'Dị ứng Penicillin, suy gan nặng',
 'Nơi khô mát, nhiệt độ dưới 30°C', 1, 5000, 1),

(203, 'MED-003', 'Vitamin C 1000mg', 'Ascorbic Acid', 'Redoxon', 'Vitamin & Bổ sung', 'Viên sủi', '1000mg', 'Viên',
 'Bayer', 'Đức',
 'Bổ sung Vitamin C, tăng cường sức đề kháng, chống oxy hóa.',
 'Hiếm gặp: Đau bụng, tiêu chảy khi dùng liều cao',
 'Không dùng cho người sỏi thận Oxalat Canxi',
 'Nơi khô mát, tránh ẩm', 0, 3500, 1),

(204, 'MED-004', 'Metformin 500mg', 'Metformin HCl', 'Glucophage', 'Điều trị tiểu đường', 'Viên nén bao phim', '500mg', 'Viên',
 'Sanofi', 'Pháp',
 'Thuốc hạ đường huyết uống cho bệnh nhân đái tháo đường type 2.',
 'Buồn nôn, tiêu chảy, đau bụng, metallic taste',
 'Suy thận, suy gan, ngộ độc cồn cấp',
 'Nhiệt độ phòng (15-30°C)', 1, 8000, 1),

(205, 'MED-005', 'Losartan 50mg', 'Losartan Potassium', 'Cozaar', 'Tim mạch - Hạ huyết áp', 'Viên nén', '50mg', 'Viên',
 'MSD Pharma', 'Anh',
 'Thuốc hạ huyết áp nhóm chẹn thụ thể Angiotensin II.',
 'Chóng mặt, mệt mỏi, ho khan',
 'Thai kỳ, cho con bú, dị ứng Losartan',
 'Nơi khô mát, tránh ánh sáng', 1, 12000, 1),

(206, 'MED-006', 'Cetirizine 10mg', 'Cetirizine HCl', 'Zyrtec', 'Kháng dị ứng', 'Viên nén', '10mg', 'Viên',
 'UCB', 'Bỉ',
 'Thuốc kháng Histamin H1, điều trị viêm mũi dị ứng, mày đay.',
 'Buồn ngủ, khô miệng, mệt mỏi',
 'Trẻ em dưới 6 tháng tuổi, suy thận nặng',
 'Nơi khô mát, nhiệt độ dưới 25°C', 0, 3000, 1),

(207, 'MED-007', 'Omeprazole 20mg', 'Omeprazole', 'Losec', 'Tiêu hóa', 'Viên nang', '20mg', 'Viên',
 'AstraZeneca', 'Thụy Điển',
 'Thuốc ức chế bơm proton, điều trị loét dạ dày tá tràng, trợ lưu dạ dày thực quản.',
 'Đau đầu, tiêu chảy, táo bón, đau bụng',
 'Dị ứng với Omeprazole hoặc các thành phần khác',
 'Nhiệt độ phòng, tránh ánh sáng', 1, 6500, 1),

(208, 'MED-008', 'Ibuprofen 400mg', 'Ibuprofen', 'Brufen', 'Giảm đau - Chống viêm', 'Viên nén bao phim', '400mg', 'Viên',
 'Abbott', 'Mỹ',
 'Thuốc giảm đau, hạ sốt, chống viêm không steroid (NSAID).',
 'Buồn nôn, đau bụng, khó tiêu, chóng mặt',
 'Loét dạ dày, suy thận, thai kỳ 3 tháng cuối',
 'Nơi khô mát, tránh ánh sáng trực tiếp', 1, 4500, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =========================================================
-- 12. CREATE PAYMENTS FOR COMPLETED APPOINTMENTS
-- =========================================================

INSERT INTO payments (id, payment_code, appointment_id, patient_id, amount, payment_method, payment_status, created_at)
VALUES
(2001, 'PAY-2026-002001', 1006, 108, 600000, 'CASH', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(2002, 'PAY-2026-002002', 1007, 109, 500000, 'BANK_TRANSFER', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2003, 'PAY-2026-002003', 1001, 108, 800000, 'MOMO', 'PENDING', NOW()),
(2004, 'PAY-2026-002004', 1003, 110, 600000, 'VNPAY', 'PROCESSING', NOW())
ON DUPLICATE KEY UPDATE payment_code = VALUES(payment_code);

-- =========================================================
-- 13. CREATE MEDICAL RECORDS FOR COMPLETED APPOINTMENTS
-- =========================================================

INSERT INTO medical_records (id, record_code, patient_id, appointment_id, doctor_id, visit_date, vital_signs, diagnosis, treatment_plan, created_at)
VALUES
(3001, 'MR-2026-003001', 108, 1006, 103, DATE_SUB(CURDATE(), INTERVAL 7 DAY),
 '{"temperature": 36.5, "blood_pressure": "120/80", "heart_rate": 72, "weight": 55, "height": 160}',
 'Sức khỏe bình thường. Không phát hiện bất thường.',
 'Duy trì chế độ ăn uống lành mạnh, tập thể dục đều đặn. Tái khám sau 6 tháng.',
 DATE_SUB(NOW(), INTERVAL 7 DAY)),

(3002, 'MR-2026-003002', 109, 1007, 105, DATE_SUB(CURDATE(), INTERVAL 5 DAY),
 '{"temperature": 36.7, "blood_pressure": "140/90", "heart_rate": 78, "weight": 70, "height": 175}',
 'Cao huyết áp độ 1. Cần tiếp tục dùng thuốc và theo dõi huyết áp.',
 'Tiếp tục dùng Losartan 50mg x 1 viên/ngày. Giảm muối trong ăn uống. Tập thể dục nhẹ. Tái khám sau 1 tháng.',
 DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE record_code = VALUES(record_code);

-- =========================================================
-- 14. CREATE PRESCRIPTIONS
-- =========================================================

INSERT INTO prescriptions (id, prescription_code, medical_record_id, appointment_id, patient_id, doctor_id, issue_date, created_at)
VALUES
(4001, 'PRE-2026-004001', 3002, 1007, 109, 105, DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE prescription_code = VALUES(prescription_code);

-- =========================================================
-- 15. CREATE PRESCRIPTION ITEMS
-- =========================================================

INSERT INTO prescription_items (prescription_id, medication_id, medication_name, dosage, frequency, duration, quantity, unit, morning_dose, noon_dose, evening_dose, night_dose, take_with_food, instructions)
VALUES
(4001, 205, 'Losartan 50mg', '50mg', '1 lần/ngày', '30 ngày', 30, 'Viên', 
 '1 viên', '0', '0', '0', 0, 
 'Uống vào buổi sáng sau ăn. Không ngừng thuốc đột ngột. Theo dõi huyết áp hàng ngày.'),

(4001, 203, 'Vitamin C 1000mg', '1000mg', '1 lần/ngày', '30 ngày', 30, 'Viên',
 '0', '0', '1 viên', '0', 0,
 'Hòa tan viên sủi vào 200ml nước, uống sau bữa tối.')
ON DUPLICATE KEY UPDATE medication_name = VALUES(medication_name);

-- =========================================================
-- 16. CREATE INVOICES
-- =========================================================

INSERT INTO invoices (id, invoice_number, payment_id, patient_id, invoice_date, due_date, subtotal, discount, tax, total, status, notes, created_at)
VALUES
(5001, 'INV-2026-005001', 2001, 108, DATE_SUB(CURDATE(), INTERVAL 7 DAY), DATE_SUB(CURDATE(), INTERVAL 7 DAY),
 600000, 0, 0, 600000, 'PAID', 'Khám sức khỏe định kỳ', DATE_SUB(NOW(), INTERVAL 7 DAY)),

(5002, 'INV-2026-005002', 2002, 109, DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 5 DAY),
 500000, 50000, 0, 450000, 'PAID', 'Tái khám - Giảm giá 10%', DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE invoice_number = VALUES(invoice_number);

-- =========================================================
-- 17. CREATE INVOICE ITEMS
-- =========================================================

INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price, created_at)
VALUES
(5001, 'Phí khám bệnh', 1, 600000, 600000, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(5002, 'Phí tái khám', 1, 500000, 500000, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(5002, 'Giảm giá bệnh nhân thân thiết', 1, -50000, -50000, DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- =========================================================
-- 18. CREATE NOTIFICATIONS
-- =========================================================

INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
VALUES
(108, 'Lịch hẹn sắp tới', 'Bạn có lịch khám với BS. Nguyễn Văn An vào ngày ' || DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '%d/%m/%Y') || ' lúc 09:00. Vui lòng đến đúng giờ.', 'APPOINTMENT', 0, NOW()),
(109, 'Lịch hẹn sắp tới', 'Bạn có lịch khám với BS. Nguyễn Văn An vào ngày ' || DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '%d/%m/%Y') || ' lúc 09:30. Vui lòng đến đúng giờ.', 'APPOINTMENT', 0, NOW()),
(110, 'Lịch hẹn sắp tới', 'Bạn có lịch khám với BS. Trần Thị Bình vào ngày ' || DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '%d/%m/%Y') || ' lúc 08:00. Vui lòng đến đúng giờ.', 'APPOINTMENT', 0, NOW()),
(108, 'Thanh toán thành công', 'Thanh toán PAY-2026-002001 đã hoàn tất. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.', 'PAYMENT', 1, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(109, 'Kết quả khám bệnh', 'Kết quả khám bệnh của bạn đã có. Vui lòng đăng nhập để xem chi tiết.', 'MEDICAL_RECORD', 1, DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- =========================================================
-- 19. CREATE REVIEWS
-- =========================================================

INSERT INTO reviews (appointment_id, patient_id, doctor_id, rating, comment, created_at)
VALUES
(1006, 108, 103, 5, 'Bác sĩ nhiệt tình, tận tâm. Khám rất kỹ và giải thích rõ ràng. Phòng khám sạch sẽ, nhân viên thân thiện.', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(1007, 109, 105, 4, 'Bác sĩ chuyên môn tốt, tư vấn cụ thể. Tuy nhiên thời gian chờ hơi lâu.', DATE_SUB(NOW(), INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE rating = VALUES(rating);

-- =========================================================
-- 20. UPDATE DOCTOR RATINGS AFTER REVIEWS
-- =========================================================

UPDATE doctors SET 
    rating_avg = 4.9, 
    rating_count = 201,
    updated_at = NOW()
WHERE id = 103;

UPDATE doctors SET 
    rating_avg = 4.6,
    rating_count = 96,
    updated_at = NOW()
WHERE id = 105;

-- =========================================================
-- 21. CREATE APPOINTMENT HISTORY
-- =========================================================

INSERT INTO appointment_history (appointment_id, changed_by, old_status, new_status, change_reason, created_at)
VALUES
(1001, 108, 'PENDING', 'CONFIRMED', 'Bệnh nhân xác nhận lịch hẹn', NOW()),
(1002, 106, 'PENDING', 'CONFIRMED', 'Lễ tân xác nhận lịch hẹn', NOW()),
(1003, 110, 'PENDING', 'CONFIRMED', 'Bệnh nhân xác nhận lịch hẹn', NOW()),
(1005, 112, 'PENDING', 'CONFIRMED', 'Bệnh nhân xác nhận lịch hẹn', NOW()),
(1006, 106, 'CONFIRMED', 'CHECKED_IN', 'Bệnh nhân đã đến check-in', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1006, 103, 'CHECKED_IN', 'IN_PROGRESS', 'Bác sĩ bắt đầu khám', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1006, 103, 'IN_PROGRESS', 'COMPLETED', 'Hoàn thành khám bệnh', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1007, 106, 'CONFIRMED', 'CHECKED_IN', 'Bệnh nhân đã đến check-in', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1007, 105, 'CHECKED_IN', 'IN_PROGRESS', 'Bác sĩ bắt đầu khám', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1007, 105, 'IN_PROGRESS', 'COMPLETED', 'Hoàn thành khám bệnh', DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE change_reason = VALUES(change_reason);

-- =========================================================
-- 22. CREATE FAVORITE DOCTORS
-- =========================================================

INSERT INTO favorite_doctors (patient_id, doctor_id, created_at)
VALUES
(108, 103, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(108, 102, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(109, 105, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(111, 105, DATE_SUB(NOW(), INTERVAL 10 DAY))
ON DUPLICATE KEY UPDATE created_at = VALUES(created_at);

-- =========================================================
-- VERIFICATION QUERIES
-- =========================================================

-- Check created users
SELECT 'Total Users Created:' as info, COUNT(*) as count FROM users WHERE id >= 101;
SELECT 'Users by Role:' as info;
SELECT r.name, COUNT(*) as count 
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.id >= 101
GROUP BY r.name;

-- Check doctors
SELECT 'Total Doctors:' as info, COUNT(*) as count FROM doctors WHERE id >= 102;

-- Check patients
SELECT 'Total Patients:' as info, COUNT(*) as count FROM patients WHERE id >= 108;

-- Check appointments
SELECT 'Total Appointments:' as info, COUNT(*) as count FROM appointments WHERE id >= 1001;
SELECT 'Appointments by Status:' as info;
SELECT status, COUNT(*) as count FROM appointments WHERE id >= 1001 GROUP BY status;

-- Check medications
SELECT 'Total Medications:' as info, COUNT(*) as count FROM medications WHERE id >= 201;

-- Check payments
SELECT 'Total Payments:' as info, COUNT(*) as count FROM payments WHERE id >= 2001;
SELECT 'Payments by Status:' as info;
SELECT payment_status, COUNT(*) as count FROM payments WHERE id >= 2001 GROUP BY payment_status;

-- Check medical records
SELECT 'Total Medical Records:' as info, COUNT(*) as count FROM medical_records WHERE id >= 3001;

-- Check prescriptions
SELECT 'Total Prescriptions:' as info, COUNT(*) as count FROM prescriptions WHERE id >= 4001;

SELECT '=== TEST DATA INSERTION COMPLETED SUCCESSFULLY ===' as status;
SELECT 'You can now test all APIs with the created data!' as message;
