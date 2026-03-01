-- Insert missing doctor records for DOCTOR-role users (19, 22, 24, 115)
INSERT INTO doctors (user_id, full_name, verification_status, is_available, created_at, updated_at, queue_status)
SELECT u.id,
       COALESCE(NULLIF(u.full_name, ''), CONCAT('Doctor #', u.id)),
       'APPROVED',
       1,
       NOW(),
       NOW(),
       'AVAILABLE'
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.id
LEFT JOIN doctors d ON d.user_id = u.id
WHERE r.name = 'DOCTOR'
  AND d.id IS NULL;

-- Verify
SELECT u.id AS user_id, u.full_name, d.id AS doctor_id, d.verification_status
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.id
LEFT JOIN doctors d ON d.user_id = u.id
WHERE r.name = 'DOCTOR'
ORDER BY u.id;
