-- Insert default roles for MedicalTech system
-- Run this script after creating the database

USE medical_appointment_system;

-- Insert roles if not exists
INSERT IGNORE INTO roles (id, name, description, created_at) VALUES
(1, 'ADMIN', 'Quản trị viên hệ thống', NOW()),
(2, 'DOCTOR', 'Bác sĩ', NOW()),
(3, 'RECEPTIONIST', 'Lễ tân', NOW()),
(4, 'PATIENT', 'Bệnh nhân', NOW());

-- Verify roles
SELECT * FROM roles;
