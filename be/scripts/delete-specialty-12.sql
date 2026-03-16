-- Xóa specialty id 12 (Khoa Khám tổng quát) và các bản ghi liên quan
-- Chạy trên database: medical_appointment_system

-- Bước 1: Xóa liên kết bác sĩ - khoa (nếu có)
DELETE FROM doctor_specialties WHERE specialty_id = 12;

-- Bước 2: Xóa specialty
DELETE FROM specialties WHERE id = 12;
