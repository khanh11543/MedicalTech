# Admin Account Creation Instructions

## Account Details
- **Email**: admin123@gmail.com
- **Password**: Khanh1201@
- **Role**: ADMIN

## BCrypt Hash Generated
```
$2b$10$fmwc/Ib7S9QMWjV6gtYEtujmWD4nIE32eHeREltZdXFrlksoZvct2
```

## Option 1: Execute SQL Script (RECOMMENDED)

### Using MySQL Workbench:
1. Open MySQL Workbench
2. Connect to: `localhost:3307` with credentials:
   - Username: `admin`
   - Password: `Admin@2004`
3. Open the SQL file: `docs/create_admin_account.sql`
4. Click **Execute** button (⚡ icon) or press `Ctrl+Shift+Enter`
5. Check the result in the output panel

### Using Command Line (if MySQL is in PATH):
```bash
mysql -h localhost -P 3307 -u admin -pAdmin@2004 medical_appointment_system < docs/create_admin_account.sql
```

## Option 2: Manual SQL Execution

Copy and paste these SQL statements into your MySQL client:

```sql
USE medical_appointment_system;

-- Insert admin user
INSERT INTO users (
    email, 
    password, 
    phone, 
    avatar_url, 
    is_active, 
    is_verified, 
    two_factor_enabled, 
    failed_login_count, 
    locked_until, 
    last_login, 
    created_at, 
    updated_at
) VALUES (
    'admin123@gmail.com',
    '$2b$10$fmwc/Ib7S9QMWjV6gtYEtujmWD4nIE32eHeREltZdXFrlksoZvct2',
    NULL,
    NULL,
    TRUE,
    TRUE,
    FALSE,
    0,
    NULL,
    NULL,
    NOW(),
    NOW()
);

-- Assign ADMIN role
SET @admin_user_id = LAST_INSERT_ID();
INSERT INTO user_roles (user_id, role_id)
VALUES (@admin_user_id, 1);

-- Verify creation
SELECT 
    u.id,
    u.email,
    u.is_active,
    u.is_verified,
    r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin123@gmail.com';
```

## Option 3: Using Spring Boot API (Alternative)

If you prefer to use the registration API:

1. **Start the backend server** (if not already running)
2. **Register the account** using Postman or curl:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin123@gmail.com",
    "password": "Khanh1201@",
    "confirmPassword": "Khanh1201@"
  }'
```

3. **Manually assign ADMIN role** in database:

```sql
-- Verify account and assign ADMIN role
UPDATE users SET is_verified = TRUE WHERE email = 'admin123@gmail.com';

INSERT INTO user_roles (user_id, role_id) 
SELECT id, 1 FROM users WHERE email = 'admin123@gmail.com';
```

## Verification

After creating the admin account, verify it works:

1. Open frontend: http://localhost:5173/signin
2. Login with:
   - Email: `admin123@gmail.com`
   - Password: `Khanh1201@`
3. You should be redirected to the **Admin Panel** (/admin)

If you login with a regular PATIENT account, you should be redirected to **Patient Dashboard** (/patient).

## Troubleshooting

### If login fails with 401 Unauthorized:
- Check that the BCrypt hash was inserted correctly
- Verify the account is marked as `is_verified = TRUE`
- Check that the ADMIN role (role_id = 1) is assigned

### If you see "Access Denied" after login:
- Verify the user has ADMIN role in `user_roles` table:
  ```sql
  SELECT u.email, r.name as role
  FROM users u
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  WHERE u.email = 'admin123@gmail.com';
  ```

### If the wrong hash is used:
You can update the password:
```sql
UPDATE users 
SET password = '$2b$10$fmwc/Ib7S9QMWjV6gtYEtujmWD4nIE32eHeREltZdXFrlksoZvct2'
WHERE email = 'admin123@gmail.com';
```
