-- 1) Show all DOCTOR-role users and whether they have a doctors record
SELECT u.id AS user_id, u.full_name, u.email,
       CASE WHEN d.id IS NOT NULL THEN 'YES' ELSE 'MISSING' END AS has_doctor_record,
       d.id AS doctor_id
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.id
LEFT JOIN doctors d ON d.user_id = u.id
WHERE r.name = 'ROLE_DOCTOR'
ORDER BY u.id;

-- 2) Check available specializations
SELECT id, name FROM specializations LIMIT 10;

-- 3) Insert missing doctor records for all DOCTOR-role users that don't have one
INSERT INTO doctors (user_id, full_name, specialization_id, experience_years, consultation_fee, status, created_at, updated_at)
SELECT u.id,
       u.full_name,
       (SELECT id FROM specializations ORDER BY id LIMIT 1),
       1,
       200000,
       'ACTIVE',
       NOW(),
       NOW()
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.id
LEFT JOIN doctors d ON d.user_id = u.id
WHERE r.name = 'ROLE_DOCTOR'
  AND d.id IS NULL;

-- 4) Verify all doctor-role users now have records
SELECT u.id AS user_id, u.full_name, d.id AS doctor_id, d.status
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.id
LEFT JOIN doctors d ON d.user_id = u.id
WHERE r.name = 'ROLE_DOCTOR'
ORDER BY u.id;
