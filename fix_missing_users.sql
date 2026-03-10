USE medical_appointment_system;

-- Insert missing doctor users (ids 110-114)
INSERT INTO users (id, email, password_hash, full_name, phone, is_active, is_verified, failed_login_count, otp_attempt_count, two_factor_enabled, created_at, updated_at) VALUES
(110, 'dr.nguyen@meditech.vn',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'BS. Nguyen Van Minh',  '0911000001', 1, 1, 0, 0, 0, NOW(), NOW()),
(111, 'dr.tran@meditech.vn',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'BS. Tran Thi Lan',     '0911000002', 1, 1, 0, 0, 0, NOW(), NOW()),
(112, 'dr.pham@meditech.vn',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'BS. Pham Duc Hung',    '0911000003', 1, 1, 0, 0, 0, NOW(), NOW()),
(113, 'dr.le@meditech.vn',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'BS. Le Minh Tuan',     '0911000004', 1, 1, 0, 0, 0, NOW(), NOW()),
(114, 'dr.hoang@meditech.vn',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'BS. Hoang Thi Mai',    '0911000005', 1, 1, 0, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Assign DOCTOR role to those users
INSERT INTO user_roles (assigned_at, role_id, user_id) VALUES
(NOW(), 2, 110), (NOW(), 2, 111), (NOW(), 2, 112), (NOW(), 2, 113), (NOW(), 2, 114)
ON DUPLICATE KEY UPDATE assigned_at = NOW();
