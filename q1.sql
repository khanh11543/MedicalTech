SELECT u.id, u.full_name, d.id as doc_id
FROM users u
INNER JOIN user_roles ur ON u.id=ur.user_id
INNER JOIN roles r ON ur.role_id=r.id
LEFT JOIN doctors d ON d.user_id=u.id
WHERE r.name='ROLE_DOCTOR'
ORDER BY u.id;
