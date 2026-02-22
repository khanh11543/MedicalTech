-- Delete appointments that reference non-existent users
-- This will fix the EntityNotFoundException for User#120

USE medical_appointment_system;

-- First, check which appointments are affected
SELECT 
    a.id, 
    a.patient_id, 
    a.doctor_id,
    p.user_id as patient_user_id,
    d.user_id as doctor_user_id
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
WHERE p.user_id NOT IN (SELECT id FROM users)
   OR d.user_id NOT IN (SELECT id FROM users);

-- Delete appointments where patient's user doesn't exist
DELETE FROM appointments 
WHERE patient_id IN (
    SELECT p.id FROM patients p 
    WHERE p.user_id NOT IN (SELECT id FROM users)
);

-- Delete appointments where doctor's user doesn't exist  
DELETE FROM appointments
WHERE doctor_id IN (
    SELECT d.id FROM doctors d
    WHERE d.user_id NOT IN (SELECT id FROM users)
);

SELECT 'Orphaned appointments deleted successfully!' as status;
