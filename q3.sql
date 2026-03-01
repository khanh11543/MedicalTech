SELECT id, name FROM roles ORDER BY id;
SELECT u.id, u.full_name, r.name as role_name, d.id as doctor_id
FROM users u
INNER JOIN user_roles ur ON u.id=ur.user_id
INNER JOIN roles r ON ur.role_id=r.id
LEFT JOIN doctors d ON d.user_id=u.id
WHERE r.name IN ('DOCTOR','ROLE_DOCTOR')
ORDER BY u.id;
