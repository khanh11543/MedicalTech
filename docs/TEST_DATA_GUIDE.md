# 📊 Hướng Dẫn Sử Dụng Dữ Liệu Test - MedicalTech System

## 📝 Tổng Quan

File `comprehensive_test_data.sql` chứa dữ liệu test đầy đủ cho **TẤT CẢ** các bảng trong hệ thống MediTech, bao gồm:

✅ **12 Users** (1 Admin, 4 Doctors, 2 Receptionists, 5 Patients)  
✅ **4 Doctor profiles** với thông tin chi tiết  
✅ **5 Patient profiles** với dữ liệu y tế đầy đủ  
✅ **2 Receptionist profiles**  
✅ **30+ Doctor schedules** (lịch làm việc)  
✅ **20+ Time slots** (khung giờ có sẵn)  
✅ **7 Appointments** (bao gồm cả lịch quá khứ và tương lai)  
✅ **8 Medications** (thuốc trong database)  
✅ **4 Payments** (với nhiều phương thức thanh toán khác nhau)  
✅ **2 Medical Records** (hồ sơ bệnh án)  
✅ **1 Prescription** với 2 prescription items  
✅ **2 Invoices** với invoice items  
✅ **5 Notifications**  
✅ **2 Reviews** (đánh giá bác sĩ)  
✅ **10 Appointment History** records  
✅ **4 Favorite Doctors** relationships  

---

## 🚀 Cách Chạy Script

### **Bước 1: Backup Database (Quan trọng!)**
```bash
# Backup toàn bộ database trước khi chạy
mysqldump -u root -p medical_appointment_system > backup_$(date +%Y%m%d_%H%M%S).sql
```

### **Bước 2: Chạy Script**

**Option 1: Từ MySQL Workbench**
1. Mở MySQL Workbench
2. Connect đến database `medical_appointment_system`
3. File > Open SQL Script > Chọn `comprehensive_test_data.sql`
4. Nhấn Execute (Lightning icon) ⚡

**Option 2: Từ Command Line**
```bash
# Windows
mysql -u root -p medical_appointment_system < docs\comprehensive_test_data.sql

# Linux/Mac
mysql -u root -p medical_appointment_system < docs/comprehensive_test_data.sql
```

**Option 3: Từ PowerShell (Windows)**
```powershell
cd D:\git\MedicalTech
Get-Content .\docs\comprehensive_test_data.sql | mysql -u root -p medical_appointment_system
```

### **Bước 3: Verify Dữ Liệu**
Script tự động hiển thị thống kê sau khi chạy:
- Tổng số users theo role
- Tổng số doctors, patients
- Tổng số appointments theo status
- Tổng số payments theo status
- Và nhiều thông tin khác

---

## 🔐 Thông Tin Đăng Nhập

### **Tất cả tài khoản đều dùng password: `Test@123456`**

| Email | Role | Mô tả |
|-------|------|-------|
| `admin@meditech.com` | ADMIN | Quản trị viên hệ thống |
| `dr.nguyen@meditech.com` | DOCTOR | BS. Nguyễn Văn An - Tim mạch |
| `dr.tran@meditech.com` | DOCTOR | BS. Trần Thị Bình - Nhi khoa |
| `dr.le@meditech.com` | DOCTOR | BS. Lê Hoàng Cường - Da liễu |
| `dr.pham@meditech.com` | DOCTOR | BS. Phạm Minh Dương - Nội khoa |
| `receptionist1@meditech.com` | RECEPTIONIST | Nguyễn Thị Hoa - Ca sáng |
| `receptionist2@meditech.com` | RECEPTIONIST | Trần Văn Bình - Ca chiều |
| `patient1@gmail.com` | PATIENT | Nguyễn Thị Mai |
| `patient2@gmail.com` | PATIENT | Trần Văn Hùng |
| `patient3@gmail.com` | PATIENT | Lê Hoàng Lan (trẻ em) |
| `patient4@gmail.com` | PATIENT | Phạm Minh Tuấn |
| `patient5@gmail.com` | PATIENT | Võ Thị Ngọc |

---

## 📅 Dữ Liệu Appointments

### **Lịch Hẹn Sắp Tới (Future)**
- **APT-2026-001001**: Patient Nguyễn Thị Mai + BS. Nguyễn Văn An (Tim mạch) - CONFIRMED
- **APT-2026-001002**: Patient Trần Văn Hùng + BS. Nguyễn Văn An (Tim mạch) - CONFIRMED
- **APT-2026-001003**: Patient Lê Hoàng Lan + BS. Trần Thị Bình (Nhi khoa) - CONFIRMED
- **APT-2026-001004**: Patient Phạm Minh Tuấn + BS. Phạm Minh Dương (Nội khoa) - PENDING
- **APT-2026-001005**: Patient Võ Thị Ngọc + BS. Lê Hoàng Cường (Da liễu) - CONFIRMED

### **Lịch Hẹn Đã Hoàn Thành (Completed)**
- **APT-2026-001006**: Patient Nguyễn Thị Mai + BS. Trần Thị Bình - COMPLETED (7 ngày trước)
- **APT-2026-001007**: Patient Trần Văn Hùng + BS. Phạm Minh Dương - COMPLETED (5 ngày trước)

---

## 💊 Dữ Liệu Medications

| Mã | Tên Thuốc | Giá | Kê Đơn |
|----|-----------|-----|--------|
| MED-001 | Paracetamol 500mg | 2,000 VND | Không |
| MED-002 | Amoxicillin 500mg | 5,000 VND | Có |
| MED-003 | Vitamin C 1000mg | 3,500 VND | Không |
| MED-004 | Metformin 500mg | 8,000 VND | Có |
| MED-005 | Losartan 50mg | 12,000 VND | Có |
| MED-006 | Cetirizine 10mg | 3,000 VND | Không |
| MED-007 | Omeprazole 20mg | 6,500 VND | Có |
| MED-008 | Ibuprofen 400mg | 4,500 VND | Có |

---

## 💳 Dữ Liệu Payments

| Mã Payment | Bệnh Nhân | Số Tiền | Phương Thức | Trạng Thái |
|------------|-----------|---------|-------------|------------|
| PAY-2026-002001 | Nguyễn Thị Mai | 600,000 | CASH | COMPLETED |
| PAY-2026-002002 | Trần Văn Hùng | 500,000 | BANK_TRANSFER | COMPLETED |
| PAY-2026-002003 | Nguyễn Thị Mai | 800,000 | MOMO | PENDING |
| PAY-2026-002004 | Lê Hoàng Lan | 600,000 | VNPAY | PROCESSING |

---

## 🏥 Doctor Schedules

### **BS. Nguyễn Văn An (Tim mạch)**
- **Thứ 2, 4, 6**: 08:00-12:00, 14:00-17:00 (slot 30 phút)

### **BS. Trần Thị Bình (Nhi khoa)**
- **Thứ 2-6**: 08:00-12:00, 14:00-17:00 (slot 20 phút)

### **BS. Lê Hoàng Cường (Da liễu)**
- **Thứ 3, 5, 7**: 09:00-12:00, 14:00-18:00 (slot 30 phút)

### **BS. Phạm Minh Dương (Nội khoa)**
- **Thứ 2, 4, 6**: 08:00-11:30, 13:30-17:00 (slot 30 phút)

---

## 🧪 Test Scenarios

### **1. Test Authentication Flow**
```javascript
// Login với các tài khoản khác nhau
POST /api/auth/login
{
  "email": "admin@meditech.com",
  "password": "Test@123456"
}
```

### **2. Test Doctor Listing & Search**
```javascript
// Lấy danh sách bác sĩ theo chuyên khoa
GET /api/doctors?specialtyId=6  // Tim mạch
GET /api/doctors?specialtyId=3  // Nhi khoa
```

### **3. Test Appointment Booking**
```javascript
// Đặt lịch hẹn mới
POST /api/appointments
{
  "doctorId": 102,
  "patientId": 108,
  "appointmentDate": "2026-02-25",
  "appointmentTime": "09:00",
  "reason": "Khám sức khỏe tổng quát"
}
```

### **4. Test Payment Processing**
```javascript
// Tạo thanh toán mới
POST /api/payments
{
  "appointmentId": 1004,
  "amount": 500000,
  "paymentMethod": "MOMO"
}
```

### **5. Test Medical Records**
```javascript
// Xem hồ sơ bệnh án
GET /api/medical-records/patient/108
GET /api/medical-records/3001
```

### **6. Test Prescription Management**
```javascript
// Xem đơn thuốc
GET /api/prescriptions/4001
GET /api/prescriptions/patient/109
```

---

## 🔍 Useful Verification Queries

### **Check All Test Data**
```sql
-- View all test users
SELECT u.id, u.email, r.name as role, u.is_verified, u.is_active
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.id >= 101
ORDER BY r.id, u.id;

-- View all doctors with specialties
SELECT d.id, d.full_name, d.license_number, d.is_available,
       GROUP_CONCAT(s.name) as specialties
FROM doctors d
LEFT JOIN doctor_specialties ds ON d.id = ds.doctor_id
LEFT JOIN specialties s ON ds.specialty_id = s.id
WHERE d.id >= 102
GROUP BY d.id, d.full_name, d.license_number, d.is_available;

-- View all appointments with details
SELECT 
    a.id, a.appointment_code, a.appointment_date, a.appointment_time,
    a.status, p.full_name as patient, d.full_name as doctor
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
WHERE a.id >= 1001
ORDER BY a.appointment_date DESC, a.appointment_time;

-- View all payments
SELECT 
    pay.id, pay.payment_code, pay.amount, pay.payment_method,
    pay.payment_status, pat.full_name as patient
FROM payments pay
JOIN patients pat ON pay.patient_id = pat.id
WHERE pay.id >= 2001
ORDER BY pay.created_at DESC;
```

---

## 🗑️ Clean Up Test Data

Nếu muốn xóa dữ liệu test và chạy lại:

```sql
-- CẢNH BÁO: Lệnh này sẽ xóa TẤT CẢ dữ liệu test!
DELETE FROM appointment_history WHERE appointment_id >= 1001;
DELETE FROM favorite_doctors WHERE patient_id >= 108;
DELETE FROM reviews WHERE appointment_id >= 1001;
DELETE FROM invoice_items WHERE invoice_id >= 5001;
DELETE FROM invoices WHERE id >= 5001;
DELETE FROM prescription_items WHERE prescription_id >= 4001;
DELETE FROM prescriptions WHERE id >= 4001;
DELETE FROM medical_records WHERE id >= 3001;
DELETE FROM payments WHERE id >= 2001;
DELETE FROM notifications WHERE user_id >= 101;
DELETE FROM appointments WHERE id >= 1001;
DELETE FROM time_slots WHERE doctor_id >= 102;
DELETE FROM doctor_schedules WHERE doctor_id >= 102;
DELETE FROM doctor_specialties WHERE doctor_id >= 102;
DELETE FROM doctors WHERE id >= 102;
DELETE FROM receptionists WHERE id >= 106;
DELETE FROM patients WHERE id >= 108;
DELETE FROM notification_preferences WHERE user_id >= 101;
DELETE FROM user_roles WHERE user_id >= 101;
DELETE FROM users WHERE id >= 101;
DELETE FROM medications WHERE id >= 201;

-- Reset AUTO_INCREMENT
ALTER TABLE users AUTO_INCREMENT = 101;
ALTER TABLE doctors AUTO_INCREMENT = 102;
ALTER TABLE patients AUTO_INCREMENT = 108;
ALTER TABLE appointments AUTO_INCREMENT = 1001;
ALTER TABLE payments AUTO_INCREMENT = 2001;
ALTER TABLE medical_records AUTO_INCREMENT = 3001;
ALTER TABLE prescriptions AUTO_INCREMENT = 4001;
ALTER TABLE invoices AUTO_INCREMENT = 5001;
ALTER TABLE medications AUTO_INCREMENT = 201;
```

---

## 📌 Notes

1. **ID Ranges**: Tất cả dữ liệu test sử dụng ID >= 100 để tránh conflict với dữ liệu production
2. **Dates**: Appointments sử dụng `CURDATE()` và `DATE_ADD()` nên sẽ tự động tính toán dựa trên ngày hiện tại
3. **Password Hash**: Tất cả password đều là `Test@123456` với BCrypt hash strength 10
4. **Phone Numbers**: Sử dụng format 0901234xxx (không trùng với số thật)
5. **Email**: Sử dụng @meditech.com cho nhân viên, @gmail.com cho bệnh nhân

---

## 🐛 Troubleshooting

### **Lỗi: Duplicate entry**
```sql
-- Script sử dụng ON DUPLICATE KEY UPDATE nên có thể chạy lại nhiều lần an toàn
-- Nếu vẫn gặp lỗi, chạy clean up script ở trên trước
```

### **Lỗi: Foreign key constraint**
```sql
-- Đảm bảo các bảng cha đã có dữ liệu:
SELECT * FROM roles;  -- Phải có 4 roles
SELECT * FROM specialties;  -- Phải có ít nhất 10 specialties
```

### **Không thấy appointments**
```sql
-- Check xem appointments có được tạo không
SELECT * FROM appointments WHERE id >= 1001;

-- Check doctor schedules
SELECT * FROM doctor_schedules WHERE doctor_id >= 102;
```

---

## 📞 Support

Nếu gặp vấn đề, check:
1. Database connection settings
2. Foreign key constraints enabled
3. Sufficient permissions (INSERT, UPDATE)
4. MySQL version compatibility (tested on 8.0+)

---

**Happy Testing! 🎉**
