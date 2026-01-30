# Hướng dẫn Test Doctor Schedule API trên Postman

## 🚀 Server đang chạy tại
- **Base URL**: `http://localhost:8080/api`
- **Swagger UI**: `http://localhost:8080/api/swagger-ui/index.html`

---

## 📋 Chuẩn bị Test Data

### Bước 1: Tạo User và Doctor (nếu chưa có)

Vì hiện tại security đang tắt (permitAll), bạn cần tạo doctor trước khi test.

#### 1.1. Kiểm tra database đã có doctor chưa
Dùng MySQL client hoặc Workbench:
```sql
SELECT * FROM users WHERE id = 1;
SELECT * FROM doctors WHERE id = 1;
```

#### 1.2. Nếu chưa có, insert test data
```sql
-- Tạo user cho doctor
INSERT INTO users (id, email, password_hash, phone, is_active, is_verified, created_at, updated_at)
VALUES (1, 'doctor1@test.com', '$2a$10$dummyhash', '0901234567', 1, 1, NOW(), NOW());

-- Tạo role doctor (nếu chưa có)
INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES (1, 2, NOW()); -- role_id = 2 là DOCTOR

-- Tạo doctor profile
INSERT INTO doctors (id, user_id, full_name, license_number, bio, experience_years, 
                     consultation_fee, is_available, verification_status, created_at, updated_at)
VALUES (1, 1, 'Dr. Nguyen Van A', 'LIC-12345', 'Chuyên gia tim mạch', 10, 
        500000, 1, 'APPROVED', NOW(), NOW());
```

---

## 🧪 Test API theo thứ tự

### Test 1: Tạo Weekly Schedule (POST /api/doctor/schedules)

**Request:**
```http
POST http://localhost:8080/api/doctor/schedules
Content-Type: application/json

{
  "dayOfWeek": 1,
  "startTime": "08:00:00",
  "endTime": "12:00:00",
  "slotDuration": 30,
  "maxPatients": 20,
  "isActive": true
}
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "doctorId": 1,
  "dayOfWeek": 1,
  "startTime": "08:00:00",
  "endTime": "12:00:00",
  "slotDuration": 30,
  "maxPatients": 20,
  "isActive": true
}
```

**Giải thích:**
- `dayOfWeek`: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
- Tạo lịch thứ 2 từ 8h-12h, mỗi slot 30 phút

---

### Test 2: Tạo thêm schedule cho chiều (POST /api/doctor/schedules)

**Request:**
```http
POST http://localhost:8080/api/doctor/schedules
Content-Type: application/json

{
  "dayOfWeek": 1,
  "startTime": "14:00:00",
  "endTime": "17:00:00",
  "slotDuration": 30,
  "maxPatients": 15
}
```

---

### Test 3: Xem tất cả schedules (GET /api/doctor/schedules)

**Request:**
```http
GET http://localhost:8080/api/doctor/schedules
```

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "doctorId": 1,
    "dayOfWeek": 1,
    "startTime": "08:00:00",
    "endTime": "12:00:00",
    "slotDuration": 30,
    "maxPatients": 20,
    "isActive": true
  },
  {
    "id": 2,
    "doctorId": 1,
    "dayOfWeek": 1,
    "startTime": "14:00:00",
    "endTime": "17:00:00",
    "slotDuration": 30,
    "maxPatients": 15,
    "isActive": true
  }
]
```

---

### Test 4: Filter schedule theo ngày (GET /api/doctor/schedules?dayOfWeek=1)

**Request:**
```http
GET http://localhost:8080/api/doctor/schedules?dayOfWeek=1
```

---

### Test 5: Update Schedule (PUT /api/doctor/schedules/{id})

**Request:**
```http
PUT http://localhost:8080/api/doctor/schedules/1
Content-Type: application/json

{
  "startTime": "08:30:00",
  "endTime": "12:30:00",
  "maxPatients": 25
}
```

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "doctorId": 1,
  "dayOfWeek": 1,
  "startTime": "08:30:00",
  "endTime": "12:30:00",
  "slotDuration": 30,
  "maxPatients": 25,
  "isActive": true
}
```

---

### Test 6: Tạo Schedule Exception - Day OFF (POST /api/doctor/schedule-exceptions)

**Request:**
```http
POST http://localhost:8080/api/doctor/schedule-exceptions
Content-Type: application/json

{
  "exceptionDate": "2026-02-15",
  "exceptionType": "OFF",
  "reason": "Nghỉ phép"
}
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "doctorId": 1,
  "exceptionDate": "2026-02-15",
  "exceptionType": "OFF",
  "startTime": null,
  "endTime": null,
  "reason": "Nghỉ phép"
}
```

---

### Test 7: Tạo Schedule Exception - MODIFIED (POST /api/doctor/schedule-exceptions)

**Request:**
```http
POST http://localhost:8080/api/doctor/schedule-exceptions
Content-Type: application/json

{
  "exceptionDate": "2026-02-16",
  "exceptionType": "MODIFIED",
  "startTime": "09:00:00",
  "endTime": "11:00:00",
  "reason": "Làm việc ngắn ngày"
}
```

---

### Test 8: Tạo Schedule Exception - EXTRA (POST /api/doctor/schedule-exceptions)

**Request:**
```http
POST http://localhost:8080/api/doctor/schedule-exceptions
Content-Type: application/json

{
  "exceptionDate": "2026-02-17",
  "exceptionType": "EXTRA",
  "startTime": "18:00:00",
  "endTime": "20:00:00",
  "reason": "Thêm giờ tối"
}
```

---

### Test 9: Xem tất cả exceptions (GET /api/doctor/schedule-exceptions)

**Request:**
```http
GET http://localhost:8080/api/doctor/schedule-exceptions
```

---

### Test 10: Generate Time Slots (POST /api/doctor/time-slots/generate)

**Request:**
```http
POST http://localhost:8080/api/doctor/time-slots/generate
Content-Type: application/json

{
  "startDate": "2026-02-10",
  "endDate": "2026-02-17",
  "overwriteExisting": true
}
```

**Expected Response (200 OK):**
```json
{
  "message": "Generated 64 time slots from 2026-02-10 to 2026-02-17"
}
```

**Logic:**
- Tạo slots theo weekly schedule (thứ 2: 8:30-12:30, 14:00-17:00)
- Ngày 15/02: OFF → không tạo slots
- Ngày 16/02: MODIFIED → chỉ tạo 9:00-11:00
- Ngày 17/02: EXTRA → tạo slots bình thường + thêm 18:00-20:00

---

### Test 11: Xem Time Slots đã tạo (GET /api/doctor/time-slots)

**Request:**
```http
GET http://localhost:8080/api/doctor/time-slots?startDate=2026-02-10&endDate=2026-02-17
```

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "doctorId": 1,
    "slotDate": "2026-02-10",
    "startTime": "08:30:00",
    "endTime": "09:00:00",
    "status": "AVAILABLE"
  },
  {
    "id": 2,
    "doctorId": 1,
    "slotDate": "2026-02-10",
    "startTime": "09:00:00",
    "endTime": "09:30:00",
    "status": "AVAILABLE"
  }
  // ... more slots
]
```

---

### Test 12: Block một Time Slot (PATCH /api/doctor/time-slots/{slotId}/block)

**Request:**
```http
PATCH http://localhost:8080/api/doctor/time-slots/5/block
Content-Type: application/json

{
  "reason": "Bận họp"
}
```

**Expected Response (200 OK):**
```json
{
  "id": 5,
  "doctorId": 1,
  "slotDate": "2026-02-10",
  "startTime": "10:00:00",
  "endTime": "10:30:00",
  "status": "BLOCKED"
}
```

---

### Test 13: Unblock Time Slot (PATCH /api/doctor/time-slots/{slotId}/unblock)

**Request:**
```http
PATCH http://localhost:8080/api/doctor/time-slots/5/unblock
```

**Expected Response (200 OK):**
```json
{
  "id": 5,
  "doctorId": 1,
  "slotDate": "2026-02-10",
  "startTime": "10:00:00",
  "endTime": "10:30:00",
  "status": "AVAILABLE"
}
```

---

### Test 14: Delete Schedule Exception (DELETE /api/doctor/schedule-exceptions/{id})

**Request:**
```http
DELETE http://localhost:8080/api/doctor/schedule-exceptions/1
```

**Expected Response (204 No Content)**

---

### Test 15: Delete Schedule (DELETE /api/doctor/schedules/{id})

**Request:**
```http
DELETE http://localhost:8080/api/doctor/schedules/2
```

**Expected Response (204 No Content)**

---

## ❌ Test Cases - Error Scenarios

### Error 1: Tạo schedule conflict (400 Bad Request)

**Request:**
```http
POST http://localhost:8080/api/doctor/schedules
Content-Type: application/json

{
  "dayOfWeek": 1,
  "startTime": "08:00:00",
  "endTime": "10:00:00"
}
```

**Expected Response:**
```json
{
  "message": "Schedule conflicts with existing schedule on Monday",
  "timestamp": "2026-01-30T23:45:00"
}
```

---

### Error 2: Tạo exception với type MODIFIED nhưng thiếu time (400 Bad Request)

**Request:**
```http
POST http://localhost:8080/api/doctor/schedule-exceptions
Content-Type: application/json

{
  "exceptionDate": "2026-02-20",
  "exceptionType": "MODIFIED",
  "reason": "Missing times"
}
```

**Expected Response:**
```json
{
  "message": "Start time and end time are required for MODIFIED type"
}
```

---

### Error 3: Generate slots khi chưa có schedule (400 Bad Request)

Xóa hết schedules rồi thử generate:
```http
POST http://localhost:8080/api/doctor/time-slots/generate
Content-Type: application/json

{
  "startDate": "2026-03-01",
  "endDate": "2026-03-07"
}
```

**Expected Response:**
```json
{
  "message": "No active schedules found. Please create schedules first."
}
```

---

### Error 4: Block slot không phải AVAILABLE (400 Bad Request)

Thử block một slot đã BOOKED:
```http
PATCH http://localhost:8080/api/doctor/time-slots/100/block
```

**Expected Response:**
```json
{
  "message": "Can only block AVAILABLE slots. Current status: BOOKED"
}
```

---

## 📊 Test Complete Workflow

### Workflow: Tạo lịch làm việc tuần cho bác sĩ

1. **Tạo lịch thứ 2-6 sáng chiều**
```http
POST /api/doctor/schedules
{
  "dayOfWeek": 1, "startTime": "08:00:00", "endTime": "12:00:00", "slotDuration": 30
}

POST /api/doctor/schedules
{
  "dayOfWeek": 1, "startTime": "14:00:00", "endTime": "17:00:00", "slotDuration": 30
}

// Repeat cho dayOfWeek: 2, 3, 4, 5
```

2. **Tạo exceptions cho tháng sau**
```http
POST /api/doctor/schedule-exceptions
{
  "exceptionDate": "2026-03-08", "exceptionType": "OFF", "reason": "Ngày Quốc tế Phụ nữ"
}
```

3. **Generate slots cho cả tháng**
```http
POST /api/doctor/time-slots/generate
{
  "startDate": "2026-03-01",
  "endDate": "2026-03-31"
}
```

4. **Kiểm tra slots đã tạo**
```http
GET /api/doctor/time-slots?startDate=2026-03-01&endDate=2026-03-31
```

5. **Block một vài slots bận**
```http
PATCH /api/doctor/time-slots/{slotId}/block
{
  "reason": "Họp khoa"
}
```

---

## 🔍 Tips Test với Postman

### 1. Tạo Environment
- Tạo environment "MediTech Local"
- Thêm variable: `base_url` = `http://localhost:8080/api`
- Thêm variable: `doctor_id` = `1`

Trong requests dùng: `{{base_url}}/doctor/schedules`

### 2. Tạo Collection
- Tạo folder "Doctor Schedules"
- Tạo folder "Schedule Exceptions"  
- Tạo folder "Time Slots"
- Lưu tất cả requests theo nhóm

### 3. Dùng Tests để kiểm tra response
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has id", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
});
```

### 4. Lưu response vào variable
```javascript
var jsonData = pm.response.json();
pm.environment.set("schedule_id", jsonData.id);
```

---

## 🎯 Checklist Test

- [ ] Tạo weekly schedule thành công
- [ ] Xem danh sách schedules
- [ ] Filter schedules theo dayOfWeek
- [ ] Update schedule thành công
- [ ] Không cho phép tạo schedule conflict
- [ ] Tạo exception type OFF
- [ ] Tạo exception type MODIFIED với times
- [ ] Tạo exception type EXTRA với times
- [ ] Generate slots theo schedule + exceptions
- [ ] Verify slots generated đúng
- [ ] Ngày OFF không có slots
- [ ] Ngày MODIFIED có slots theo custom time
- [ ] Ngày EXTRA có slots bình thường + extra
- [ ] Block slot AVAILABLE thành công
- [ ] Unblock slot BLOCKED thành công
- [ ] Không cho phép block slot BOOKED
- [ ] Delete exception thành công
- [ ] Delete schedule thành công

---

## 📝 Notes

1. **DoctorId hiện tại hardcoded**: 
   - Controller dùng `getCurrentDoctorId()` để lấy doctor ID
   - Do security đang tắt, method này parse username as user ID
   - Trong production sẽ lấy từ JWT token

2. **Validation rules**:
   - `dayOfWeek`: 0-6 (0=Sunday)
   - `slotDuration`: 10-120 minutes
   - `endTime` phải sau `startTime`
   - Exception MODIFIED/EXTRA bắt buộc có startTime/endTime
   - Generate slots tối đa 30 ngày

3. **Status của TimeSlot**:
   - `AVAILABLE`: Slot trống, có thể đặt
   - `BOOKED`: Đã được đặt bởi patient
   - `BLOCKED`: Bác sĩ block lại
   - `COMPLETED`: Khám xong

---

Chúc bạn test thành công! 🎉
