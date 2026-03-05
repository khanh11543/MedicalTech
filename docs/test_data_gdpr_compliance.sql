-- ============================================================
-- TEST DATA: GDPR & Compliance Module
-- ============================================================
-- Chạy script này sau khi đã có users trong hệ thống.
-- Script sẽ tự lấy user IDs từ bảng users dựa trên role.
-- ============================================================

USE medical_appointment_system;

-- ============================================================
-- STEP 0: Kiểm tra users hiện có
-- ============================================================
SELECT '=== CHECKING EXISTING USERS ===' AS step;
SELECT u.id, u.email, u.full_name, r.name AS role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.id
LIMIT 20;

-- ============================================================
-- STEP 1: DATA EXPORT REQUESTS (Tab "Data Export Requests")
-- ============================================================
-- Lưu ý: user_id phải là ID thật từ bảng users.
-- Thay @patient1, @patient2... bằng ID thật nếu biến không hoạt động.
-- ============================================================

SELECT '=== INSERTING DATA EXPORT REQUESTS ===' AS step;

-- Lấy user IDs (patients)
SET @patient1 = (SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'PATIENT' ORDER BY u.id LIMIT 1);
SET @patient2 = (SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'PATIENT' ORDER BY u.id LIMIT 1 OFFSET 1);
SET @patient3 = (SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'PATIENT' ORDER BY u.id LIMIT 1 OFFSET 2);
SET @patient4 = (SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'PATIENT' ORDER BY u.id LIMIT 1 OFFSET 3);
SET @doctor1 = (SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'DOCTOR' ORDER BY u.id LIMIT 1);
SET @admin1 = (SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'ADMIN' ORDER BY u.id LIMIT 1);

-- Fallback: nếu không đủ patients, dùng user đầu tiên
SET @patient1 = COALESCE(@patient1, (SELECT id FROM users ORDER BY id LIMIT 1));
SET @patient2 = COALESCE(@patient2, @patient1);
SET @patient3 = COALESCE(@patient3, @patient1);
SET @patient4 = COALESCE(@patient4, @patient1);
SET @doctor1  = COALESCE(@doctor1, @patient1);
SET @admin1   = COALESCE(@admin1, (SELECT id FROM users ORDER BY id LIMIT 1));

-- 1. Export request - PENDING (chờ xử lý)
INSERT INTO data_export_requests (
    user_id, status, requested_date, processed_date, processed_by,
    include_profile, include_appointments, include_prescriptions, include_payments, include_reviews, include_activity_logs,
    export_format, file_path, file_size, error_message, email_sent, email_sent_date, notes, created_at, updated_at
) VALUES (
    @patient1, 'PENDING', '2026-03-04', NULL, NULL,
    1, 1, 1, 1, 1, 1,
    'JSON', NULL, NULL, NULL, 0, NULL, 'Patient requested full data export via GDPR portal', NOW(), NOW()
);

-- 2. Export request - PROCESSING (đang xử lý)
INSERT INTO data_export_requests (
    user_id, status, requested_date, processed_date, processed_by,
    include_profile, include_appointments, include_prescriptions, include_payments, include_reviews, include_activity_logs,
    export_format, file_path, file_size, error_message, email_sent, email_sent_date, notes, created_at, updated_at
) VALUES (
    @patient2, 'PROCESSING', '2026-03-03', NULL, @admin1,
    1, 1, 1, 0, 0, 0,
    'CSV', NULL, NULL, NULL, 0, NULL, 'Only medical data requested', NOW() - INTERVAL 1 DAY, NOW()
);

-- 3. Export request - COMPLETED (đã hoàn thành)
INSERT INTO data_export_requests (
    user_id, status, requested_date, processed_date, processed_by,
    include_profile, include_appointments, include_prescriptions, include_payments, include_reviews, include_activity_logs,
    export_format, file_path, file_size, error_message, email_sent, email_sent_date, notes, created_at, updated_at
) VALUES (
    @patient3, 'COMPLETED', '2026-02-25', NOW() - INTERVAL 3 DAY, @admin1,
    1, 1, 1, 1, 1, 1,
    'JSON', 'exports/gdpr/export_3_20260225.json', 245760, NULL, 1, NOW() - INTERVAL 2 DAY, 'Full export completed and emailed', NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 3 DAY
);

-- 4. Export request - COMPLETED (PDF format)
INSERT INTO data_export_requests (
    user_id, status, requested_date, processed_date, processed_by,
    include_profile, include_appointments, include_prescriptions, include_payments, include_reviews, include_activity_logs,
    export_format, file_path, file_size, error_message, email_sent, email_sent_date, notes, created_at, updated_at
) VALUES (
    @doctor1, 'COMPLETED', '2026-02-20', NOW() - INTERVAL 10 DAY, @admin1,
    1, 0, 0, 0, 0, 1,
    'PDF', 'exports/gdpr/export_4_20260220.pdf', 52480, NULL, 1, NOW() - INTERVAL 9 DAY, 'Doctor requested profile + activity log only', NOW() - INTERVAL 13 DAY, NOW() - INTERVAL 10 DAY
);

-- 5. Export request - FAILED (thất bại)
INSERT INTO data_export_requests (
    user_id, status, requested_date, processed_date, processed_by,
    include_profile, include_appointments, include_prescriptions, include_payments, include_reviews, include_activity_logs,
    export_format, file_path, file_size, error_message, email_sent, email_sent_date, notes, created_at, updated_at
) VALUES (
    @patient4, 'FAILED', '2026-02-28', NOW() - INTERVAL 4 DAY, @admin1,
    1, 1, 1, 1, 1, 1,
    'JSON', NULL, NULL, 'Export generation failed: Timeout while fetching appointment data. Please retry.', 0, NULL, 'Auto-process attempt failed', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 4 DAY
);

-- 6. Export request - PENDING (mới nhất)
INSERT INTO data_export_requests (
    user_id, status, requested_date, processed_date, processed_by,
    include_profile, include_appointments, include_prescriptions, include_payments, include_reviews, include_activity_logs,
    export_format, file_path, file_size, error_message, email_sent, email_sent_date, notes, created_at, updated_at
) VALUES (
    @patient2, 'PENDING', '2026-03-05', NULL, NULL,
    1, 1, 0, 1, 0, 0,
    'CSV', NULL, NULL, NULL, 0, NULL, 'Second request - profile, appointments, payments only', NOW(), NOW()
);

SELECT '=== DATA EXPORT REQUESTS INSERTED ===' AS step;
SELECT id, user_id, status, requested_date, export_format FROM data_export_requests ORDER BY id;

-- ============================================================
-- STEP 2: DATA DELETION REQUESTS (Tab "Data Deletion Requests")
-- ============================================================

SELECT '=== INSERTING DATA DELETION REQUESTS ===' AS step;

-- 1. Deletion - PENDING (mới nộp, chờ review)
INSERT INTO data_deletion_requests (
    user_id, status, requested_date, reason,
    reviewed_by, reviewed_date, admin_notes,
    schedule_date, execute_immediately,
    rejection_reason, additional_comments, required_info, info_deadline,
    cancel_reason, cancelled_date, executed_date, executed_by,
    notification_sent, notification_sent_date, created_at, updated_at
) VALUES (
    @patient1, 'PENDING', '2026-03-04',
    'I no longer use this service and want all my personal data removed per GDPR Article 17.',
    NULL, NULL, NULL,
    NULL, 0,
    NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL,
    0, NULL, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY
);

-- 2. Deletion - UNDER_REVIEW (đang được admin xem xét)
INSERT INTO data_deletion_requests (
    user_id, status, requested_date, reason,
    reviewed_by, reviewed_date, admin_notes,
    schedule_date, execute_immediately,
    rejection_reason, additional_comments, required_info, info_deadline,
    cancel_reason, cancelled_date, executed_date, executed_by,
    notification_sent, notification_sent_date, created_at, updated_at
) VALUES (
    @patient2, 'UNDER_REVIEW', '2026-03-01',
    'Moving to another healthcare provider. Please delete my account and medical records.',
    @admin1, NOW() - INTERVAL 2 DAY, 'Checking for pending appointments and unpaid bills before approval.',
    NULL, 0,
    NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL,
    1, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 2 DAY
);

-- 3. Deletion - APPROVED (đã duyệt, chờ thực thi)
INSERT INTO data_deletion_requests (
    user_id, status, requested_date, reason,
    reviewed_by, reviewed_date, admin_notes,
    schedule_date, execute_immediately,
    rejection_reason, additional_comments, required_info, info_deadline,
    cancel_reason, cancelled_date, executed_date, executed_by,
    notification_sent, notification_sent_date, created_at, updated_at
) VALUES (
    @patient3, 'APPROVED', '2026-02-20',
    'Privacy concerns. I want my data erased from the system.',
    @admin1, NOW() - INTERVAL 10 DAY, 'No pending items. Approved for deletion. Scheduled for 30-day grace period.',
    NOW() + INTERVAL 20 DAY, 0,
    NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL,
    1, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 13 DAY, NOW() - INTERVAL 10 DAY
);

-- 4. Deletion - REJECTED (bị từ chối)
INSERT INTO data_deletion_requests (
    user_id, status, requested_date, reason,
    reviewed_by, reviewed_date, admin_notes,
    schedule_date, execute_immediately,
    rejection_reason, additional_comments, required_info, info_deadline,
    cancel_reason, cancelled_date, executed_date, executed_by,
    notification_sent, notification_sent_date, created_at, updated_at
) VALUES (
    @patient4, 'REJECTED', '2026-02-15',
    'I want to delete my account.',
    @admin1, NOW() - INTERVAL 15 DAY, 'Patient has outstanding payment of 500,000 VND. Cannot process deletion until resolved.',
    NULL, 0,
    'Outstanding payments exist', 'Please settle your pending payment before requesting account deletion. Contact reception for assistance.', NULL, NULL,
    NULL, NULL, NULL, NULL,
    1, NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 15 DAY
);

-- 5. Deletion - COMPLETED (đã thực thi xóa thành công)
INSERT INTO data_deletion_requests (
    user_id, status, requested_date, reason,
    reviewed_by, reviewed_date, admin_notes,
    schedule_date, execute_immediately,
    rejection_reason, additional_comments, required_info, info_deadline,
    cancel_reason, cancelled_date, executed_date, executed_by,
    notification_sent, notification_sent_date, created_at, updated_at
) VALUES (
    @doctor1, 'COMPLETED', '2026-01-15',
    'Leaving the clinic. Please remove all personal data associated with my account.',
    @admin1, '2026-01-18 10:00:00', 'Doctor confirmed resignation. All patient records reassigned. Approved for deletion.',
    NULL, 1,
    NULL, NULL, NULL, NULL,
    NULL, NULL, '2026-01-20 14:30:00', @admin1,
    1, '2026-01-20 14:35:00', '2026-01-15 09:00:00', '2026-01-20 14:30:00'
);

SELECT '=== DATA DELETION REQUESTS INSERTED ===' AS step;
SELECT id, user_id, status, requested_date, reason FROM data_deletion_requests ORDER BY id;

-- ============================================================
-- STEP 3: DELETION LOGS (Cho tab Deletion Log)
-- ============================================================

SELECT '=== INSERTING DELETION LOGS ===' AS step;

INSERT INTO deletion_logs (
    user_id, user_email, user_full_name, deletion_request_id,
    deleted_data_summary, deleted_records_count,
    executed_by, executed_by_name, executed_date,
    execution_notes, success, error_message, created_at, updated_at
) VALUES (
    @doctor1,
    (SELECT email FROM users WHERE id = @doctor1),
    (SELECT full_name FROM users WHERE id = @doctor1),
    (SELECT id FROM data_deletion_requests WHERE user_id = @doctor1 AND status = 'COMPLETED' LIMIT 1),
    'Profile: 1 record, Appointments: 45 records, Activity Logs: 128 records, Sessions: 12 records',
    186,
    @admin1,
    (SELECT full_name FROM users WHERE id = @admin1),
    '2026-01-20 14:30:00',
    'All personal data successfully removed. Medical records reassigned to clinic archive.',
    1, NULL, '2026-01-20 14:30:00', '2026-01-20 14:30:00'
);

SELECT '=== DELETION LOGS INSERTED ===' AS step;
SELECT * FROM deletion_logs;

-- ============================================================
-- STEP 4: USER CONSENTS (Tab "Consent Management")
-- ============================================================
-- Sử dụng ConsentType enum từ backend:
--   TERMS_OF_SERVICE, PRIVACY_POLICY, DATA_PROCESSING,
--   MARKETING_COMMUNICATIONS, COOKIE_POLICY, THIRD_PARTY_SHARING,
--   RESEARCH_DATA_USAGE
-- ============================================================

SELECT '=== INSERTING USER CONSENTS ===' AS step;

-- Patient 1: Đồng ý tất cả (user mới đăng ký)
INSERT INTO user_consents (user_id, consent_type, status, consent_date, version, ip_address, user_agent, revoked_date, revoked_by, revocation_reason, notification_sent, notification_sent_date, created_at, updated_at) VALUES
(@patient1, 'TERMS_OF_SERVICE', 'ACCEPTED', NOW() - INTERVAL 60 DAY, '2.0', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 60 DAY, NOW() - INTERVAL 60 DAY),
(@patient1, 'PRIVACY_POLICY', 'ACCEPTED', NOW() - INTERVAL 60 DAY, '1.5', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 60 DAY, NOW() - INTERVAL 60 DAY),
(@patient1, 'DATA_PROCESSING', 'ACCEPTED', NOW() - INTERVAL 60 DAY, '1.0', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 60 DAY, NOW() - INTERVAL 60 DAY),
(@patient1, 'MARKETING_COMMUNICATIONS', 'ACCEPTED', NOW() - INTERVAL 60 DAY, '1.0', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 60 DAY, NOW() - INTERVAL 60 DAY),
(@patient1, 'COOKIE_POLICY', 'ACCEPTED', NOW() - INTERVAL 60 DAY, '1.2', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 60 DAY, NOW() - INTERVAL 60 DAY),
(@patient1, 'THIRD_PARTY_SHARING', 'DECLINED', NOW() - INTERVAL 60 DAY, '1.0', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 60 DAY, NOW() - INTERVAL 60 DAY),
(@patient1, 'RESEARCH_DATA_USAGE', 'DECLINED', NOW() - INTERVAL 60 DAY, '1.0', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 60 DAY, NOW() - INTERVAL 60 DAY);

-- Patient 2: Chấp nhận cơ bản, từ chối marketing
INSERT INTO user_consents (user_id, consent_type, status, consent_date, version, ip_address, user_agent, revoked_date, revoked_by, revocation_reason, notification_sent, notification_sent_date, created_at, updated_at) VALUES
(@patient2, 'TERMS_OF_SERVICE', 'ACCEPTED', NOW() - INTERVAL 90 DAY, '2.0', '10.0.0.55', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 90 DAY, NOW() - INTERVAL 90 DAY),
(@patient2, 'PRIVACY_POLICY', 'ACCEPTED', NOW() - INTERVAL 90 DAY, '1.5', '10.0.0.55', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 90 DAY, NOW() - INTERVAL 90 DAY),
(@patient2, 'DATA_PROCESSING', 'ACCEPTED', NOW() - INTERVAL 90 DAY, '1.0', '10.0.0.55', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 90 DAY, NOW() - INTERVAL 90 DAY),
(@patient2, 'MARKETING_COMMUNICATIONS', 'DECLINED', NOW() - INTERVAL 90 DAY, '1.0', '10.0.0.55', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 90 DAY, NOW() - INTERVAL 90 DAY),
(@patient2, 'COOKIE_POLICY', 'ACCEPTED', NOW() - INTERVAL 90 DAY, '1.2', '10.0.0.55', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 90 DAY, NOW() - INTERVAL 90 DAY),
(@patient2, 'THIRD_PARTY_SHARING', 'DECLINED', NOW() - INTERVAL 90 DAY, '1.0', '10.0.0.55', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 90 DAY, NOW() - INTERVAL 90 DAY);

-- Patient 3: Đã revoke marketing consent (ban đầu accept, sau rút lại)
INSERT INTO user_consents (user_id, consent_type, status, consent_date, version, ip_address, user_agent, revoked_date, revoked_by, revocation_reason, notification_sent, notification_sent_date, created_at, updated_at) VALUES
(@patient3, 'TERMS_OF_SERVICE', 'ACCEPTED', NOW() - INTERVAL 120 DAY, '1.8', '172.16.0.10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Firefox/121.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 120 DAY, NOW() - INTERVAL 120 DAY),
(@patient3, 'PRIVACY_POLICY', 'ACCEPTED', NOW() - INTERVAL 120 DAY, '1.3', '172.16.0.10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Firefox/121.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 120 DAY, NOW() - INTERVAL 120 DAY),
(@patient3, 'DATA_PROCESSING', 'ACCEPTED', NOW() - INTERVAL 120 DAY, '1.0', '172.16.0.10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Firefox/121.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 120 DAY, NOW() - INTERVAL 120 DAY),
(@patient3, 'MARKETING_COMMUNICATIONS', 'REVOKED', NOW() - INTERVAL 120 DAY, '1.0', '172.16.0.10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Firefox/121.0', NOW() - INTERVAL 30 DAY, @admin1, 'Patient called and requested to stop all marketing emails.', 1, NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 120 DAY, NOW() - INTERVAL 30 DAY),
(@patient3, 'COOKIE_POLICY', 'ACCEPTED', NOW() - INTERVAL 120 DAY, '1.2', '172.16.0.10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Firefox/121.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 120 DAY, NOW() - INTERVAL 120 DAY),
(@patient3, 'RESEARCH_DATA_USAGE', 'REVOKED', NOW() - INTERVAL 120 DAY, '1.0', '172.16.0.10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Firefox/121.0', NOW() - INTERVAL 15 DAY, @admin1, 'Patient withdrew consent for research data usage via email request.', 1, NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 120 DAY, NOW() - INTERVAL 15 DAY);

-- Patient 4: Mới đăng ký, chỉ accept bắt buộc
INSERT INTO user_consents (user_id, consent_type, status, consent_date, version, ip_address, user_agent, revoked_date, revoked_by, revocation_reason, notification_sent, notification_sent_date, created_at, updated_at) VALUES
(@patient4, 'TERMS_OF_SERVICE', 'ACCEPTED', NOW() - INTERVAL 7 DAY, '2.0', '203.113.152.40', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),
(@patient4, 'PRIVACY_POLICY', 'ACCEPTED', NOW() - INTERVAL 7 DAY, '1.5', '203.113.152.40', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),
(@patient4, 'DATA_PROCESSING', 'ACCEPTED', NOW() - INTERVAL 7 DAY, '1.0', '203.113.152.40', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),
(@patient4, 'MARKETING_COMMUNICATIONS', 'DECLINED', NOW() - INTERVAL 7 DAY, '1.0', '203.113.152.40', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),
(@patient4, 'COOKIE_POLICY', 'DECLINED', NOW() - INTERVAL 7 DAY, '1.2', '203.113.152.40', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY);

-- Doctor 1: Full consent
INSERT INTO user_consents (user_id, consent_type, status, consent_date, version, ip_address, user_agent, revoked_date, revoked_by, revocation_reason, notification_sent, notification_sent_date, created_at, updated_at) VALUES
(@doctor1, 'TERMS_OF_SERVICE', 'ACCEPTED', NOW() - INTERVAL 180 DAY, '1.5', '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 180 DAY, NOW() - INTERVAL 180 DAY),
(@doctor1, 'PRIVACY_POLICY', 'ACCEPTED', NOW() - INTERVAL 180 DAY, '1.3', '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 180 DAY, NOW() - INTERVAL 180 DAY),
(@doctor1, 'DATA_PROCESSING', 'ACCEPTED', NOW() - INTERVAL 180 DAY, '1.0', '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 180 DAY, NOW() - INTERVAL 180 DAY),
(@doctor1, 'MARKETING_COMMUNICATIONS', 'ACCEPTED', NOW() - INTERVAL 180 DAY, '1.0', '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 180 DAY, NOW() - INTERVAL 180 DAY),
(@doctor1, 'THIRD_PARTY_SHARING', 'ACCEPTED', NOW() - INTERVAL 180 DAY, '1.0', '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 180 DAY, NOW() - INTERVAL 180 DAY),
(@doctor1, 'RESEARCH_DATA_USAGE', 'ACCEPTED', NOW() - INTERVAL 180 DAY, '1.0', '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0', NULL, NULL, NULL, 0, NULL, NOW() - INTERVAL 180 DAY, NOW() - INTERVAL 180 DAY);

SELECT '=== USER CONSENTS INSERTED ===' AS step;
SELECT id, user_id, consent_type, status, consent_date FROM user_consents ORDER BY user_id, consent_type;

-- ============================================================
-- STEP 5: VERIFICATION - Kiểm tra tổng quan
-- ============================================================

SELECT '=== SUMMARY ===' AS step;

SELECT 'Data Export Requests' AS table_name, COUNT(*) AS total_records,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) AS processing,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed
FROM data_export_requests;

SELECT 'Data Deletion Requests' AS table_name, COUNT(*) AS total_records,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'UNDER_REVIEW' THEN 1 ELSE 0 END) AS under_review,
    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
    SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed
FROM data_deletion_requests;

SELECT 'User Consents' AS table_name, COUNT(*) AS total_records,
    SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) AS accepted,
    SUM(CASE WHEN status = 'DECLINED' THEN 1 ELSE 0 END) AS declined,
    SUM(CASE WHEN status = 'REVOKED' THEN 1 ELSE 0 END) AS revoked
FROM user_consents;

SELECT 'Deletion Logs' AS table_name, COUNT(*) AS total_records FROM deletion_logs;

SELECT '=== DONE! Go to /gdpr-compliance to test ===' AS step;
