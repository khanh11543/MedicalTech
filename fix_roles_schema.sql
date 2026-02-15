-- Drop FK constraints referencing roles.id
ALTER TABLE user_roles DROP FOREIGN KEY fk_user_roles_role;
ALTER TABLE role_permissions DROP FOREIGN KEY fk_role_permissions_role;

-- Change roles.id from INT to BIGINT
ALTER TABLE roles MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;

-- Change role_id columns from INT to BIGINT
ALTER TABLE user_roles MODIFY COLUMN role_id BIGINT NOT NULL;
ALTER TABLE role_permissions MODIFY COLUMN role_id BIGINT NOT NULL;

-- Re-add FK constraints
ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
ALTER TABLE role_permissions ADD CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
