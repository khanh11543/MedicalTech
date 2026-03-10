SELECT u.id, u.full_name, u.email FROM users u WHERE u.id=19;
SELECT ur.user_id, r.name FROM user_roles ur INNER JOIN roles r ON ur.role_id=r.id WHERE ur.user_id=19;
SELECT id, user_id, full_name FROM doctors WHERE user_id=19;
