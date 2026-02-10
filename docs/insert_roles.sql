-- Insert default roles for MedicalTech system
-- Run this script after creating the database

USE medical_appointment_system;

-- Insert roles if not exists
INSERT IGNORE INTO roles (id, name, description, created_at) VALUES
(1, 'ADMIN', 'System Administrator', NOW()),
(2, 'DOCTOR', 'Doctor', NOW()),
(3, 'RECEPTIONIST', 'Receptionist', NOW()),
(4, 'PATIENT', 'Patient', NOW());

-- Verify roles
SELECT * FROM roles;
