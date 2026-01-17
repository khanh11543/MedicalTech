# Database Design - Online Medical Appointment System

## Tổng Quan

Hệ thống sử dụng **MySQL** làm cơ sở dữ liệu chính với thiết kế chuẩn hóa (3NF).

**Tổng số bảng: 29 bảng**

---

## Entity Relationship Diagram (ERD)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      USERS      │       │      ROLES      │       │   USER_ROLES    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ id (PK)         │   ┌───│ user_id (FK)    │
│ email           │   │   │ name            │   │   │ role_id (FK)    │
│ password_hash   │   │   │ description     │───┼───│ assigned_at     │
│ phone           │   └───┼─────────────────┘   │   └─────────────────┘
│ is_active       │       │                     │
│ is_verified     │       │                     │
│ created_at      │       │                     │
└────────┬────────┘       │                     │
         │                │                     │
         ▼                │                     │
┌─────────────────┐       │       ┌─────────────────┐
│    PATIENTS     │       │       │     DOCTORS     │
├─────────────────┤       │       ├─────────────────┤
│ id (PK)         │       │       │ id (PK)         │
│ user_id (FK)    │───────┘       │ user_id (FK)    │
│ full_name       │               │ full_name       │
│ date_of_birth   │               │ license_number  │
│ gender          │               │ bio             │
│ address         │               │ experience_years│
│ blood_type      │               │ consultation_fee│
│ allergies       │               │ rating_avg      │
│ medical_history │               │ is_available    │
└────────┬────────┘               └────────┬────────┘
         │                                 │
         │         ┌─────────────────┐     │
         │         │DOCTOR_SPECIALTIES│     │
         │         ├─────────────────┤     │
         │         │ doctor_id (FK)  │─────┘
         │         │ specialty_id(FK)│───► SPECIALTIES
         │         │ is_primary      │
         │         └─────────────────┘
         │                                 │
         ▼                                 ▼
┌─────────────────┐               ┌─────────────────┐
│  APPOINTMENTS   │◄──────────────│ DOCTOR_SCHEDULES│
├─────────────────┤               ├─────────────────┤
│ id (PK)         │               │ id (PK)         │
│ patient_id (FK) │               │ doctor_id (FK)  │
│ doctor_id (FK)  │               │ day_of_week     │
│ schedule_id(FK) │               │ start_time      │
│ appointment_date│               │ end_time        │
│ status          │               │ slot_duration   │
│ reason          │               │ is_active       │
│ notes           │               └─────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐
│    PAYMENTS     │       │     REVIEWS     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ appointment_id  │       │ appointment_id  │
│ amount          │       │ patient_id (FK) │
│ payment_method  │       │ doctor_id (FK)  │
│ status          │       │ rating          │
│ transaction_id  │       │ comment         │
└─────────────────┘       └─────────────────┘
```

---

## Chi Tiết Các Bảng

### 1. USERS (Người dùng)

Bảng chứa thông tin đăng nhập chung cho tất cả người dùng.

```sql
CREATE TABLE users (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    phone               VARCHAR(20),
    avatar_url          VARCHAR(500),
    is_active           TINYINT(1) DEFAULT 1,
    is_verified         TINYINT(1) DEFAULT 0,
    verification_token  VARCHAR(255),
    reset_token         VARCHAR(255),
    reset_token_expiry  DATETIME,
    two_factor_enabled  TINYINT(1) DEFAULT 0,
    two_factor_secret   VARCHAR(255),
    last_login          DATETIME,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
```

---

### 2. ROLES (Vai trò)

Bảng định nghĩa các vai trò trong hệ thống.

```sql
CREATE TABLE roles (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,
    description     VARCHAR(255),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Quản trị viên hệ thống'),
    ('DOCTOR', 'Bác sĩ'),
    ('RECEPTIONIST', 'Lễ tân'),
    ('PATIENT', 'Bệnh nhân');
```

---

### 3. USER_ROLES (Phân quyền người dùng)

Bảng liên kết nhiều-nhiều giữa Users và Roles.

```sql
CREATE TABLE user_roles (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    role_id     INT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT,
    
    UNIQUE KEY unique_user_role (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
```

---

### 4. PERMISSIONS (Quyền hạn)

```sql
CREATE TABLE permissions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     VARCHAR(255),
    module          VARCHAR(50),  -- appointment, patient, doctor, payment, etc.
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample permissions
INSERT INTO permissions (name, description, module) VALUES
    ('VIEW_ALL_APPOINTMENTS', 'Xem tất cả lịch hẹn', 'appointment'),
    ('MANAGE_APPOINTMENTS', 'Quản lý lịch hẹn', 'appointment'),
    ('VIEW_PATIENTS', 'Xem danh sách bệnh nhân', 'patient'),
    ('MANAGE_PATIENTS', 'Quản lý bệnh nhân', 'patient'),
    ('VIEW_DOCTORS', 'Xem danh sách bác sĩ', 'doctor'),
    ('MANAGE_DOCTORS', 'Quản lý bác sĩ', 'doctor'),
    ('VIEW_PAYMENTS', 'Xem thanh toán', 'payment'),
    ('MANAGE_PAYMENTS', 'Quản lý thanh toán', 'payment'),
    ('VIEW_REPORTS', 'Xem báo cáo', 'report'),
    ('MANAGE_SYSTEM', 'Quản lý hệ thống', 'system');
```

---

### 5. ROLE_PERMISSIONS (Quyền theo vai trò)

```sql
CREATE TABLE role_permissions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id         INT NOT NULL,
    permission_id   INT NOT NULL,
    
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
```

---

### 6. SPECIALTIES (Chuyên khoa)

```sql
CREATE TABLE specialties (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    icon_url        VARCHAR(500),
    is_active       TINYINT(1) DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample specialties
INSERT INTO specialties (name, description) VALUES
    ('Nội khoa', 'Khám và điều trị các bệnh nội khoa'),
    ('Ngoại khoa', 'Phẫu thuật và điều trị ngoại khoa'),
    ('Nhi khoa', 'Khám và điều trị trẻ em'),
    ('Sản phụ khoa', 'Chăm sóc sức khỏe phụ nữ'),
    ('Da liễu', 'Điều trị các bệnh về da'),
    ('Tim mạch', 'Khám và điều trị tim mạch'),
    ('Thần kinh', 'Điều trị các bệnh thần kinh'),
    ('Mắt', 'Khám và điều trị mắt'),
    ('Tai Mũi Họng', 'Khám và điều trị tai mũi họng'),
    ('Răng Hàm Mặt', 'Nha khoa và hàm mặt');
```

---

### 7. DOCTORS (Bác sĩ)

```sql
CREATE TABLE doctors (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE,
    full_name           VARCHAR(255) NOT NULL,
    license_number      VARCHAR(50) UNIQUE,
    bio                 TEXT,
    education           TEXT,
    experience_years    INT DEFAULT 0,
    consultation_fee    DECIMAL(12, 2) DEFAULT 0,
    follow_up_fee       DECIMAL(12, 2) DEFAULT 0,
    rating_avg          DECIMAL(3, 2) DEFAULT 0,
    rating_count        INT DEFAULT 0,
    is_available        TINYINT(1) DEFAULT 1,
    hospital_affiliation VARCHAR(255),
    office_address      TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_doctors_user ON doctors(user_id);
CREATE INDEX idx_doctors_available ON doctors(is_available);
CREATE INDEX idx_doctors_rating ON doctors(rating_avg DESC);
```

---

### 8. DOCTOR_SPECIALTIES (Bác sĩ - Đa chuyên khoa)

Hỗ trợ bác sĩ có nhiều chuyên khoa.

```sql
CREATE TABLE doctor_specialties (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id       BIGINT NOT NULL,
    specialty_id    INT NOT NULL,
    is_primary      TINYINT(1) DEFAULT 0,
    
    UNIQUE KEY unique_doctor_specialty (doctor_id, specialty_id),
    CONSTRAINT fk_doctor_specialties_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    CONSTRAINT fk_doctor_specialties_specialty FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_doctor_specialties_doctor ON doctor_specialties(doctor_id);
```

---

### 9. PATIENTS (Bệnh nhân)

```sql
CREATE TABLE patients (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE,
    full_name           VARCHAR(255) NOT NULL,
    date_of_birth       DATE,
    gender              VARCHAR(10),
    identity_number     VARCHAR(20),
    address             TEXT,
    city                VARCHAR(100),
    district            VARCHAR(100),
    ward                VARCHAR(100),
    emergency_contact   VARCHAR(255),
    emergency_phone     VARCHAR(20),
    blood_type          VARCHAR(5),
    height_cm           DECIMAL(5, 2),
    weight_kg           DECIMAL(5, 2),
    allergies           TEXT,
    chronic_conditions  TEXT,
    current_medications TEXT,
    insurance_number    VARCHAR(50),
    insurance_provider  VARCHAR(100),
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_patients_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    CONSTRAINT chk_patients_blood_type CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_patients_user ON patients(user_id);
CREATE INDEX idx_patients_name ON patients(full_name);
```

---

### 10. RECEPTIONISTS (Lễ tân)

```sql
CREATE TABLE receptionists (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL UNIQUE,
    full_name       VARCHAR(255) NOT NULL,
    employee_id     VARCHAR(50) UNIQUE,
    department      VARCHAR(100),
    shift           VARCHAR(20),
    is_active       TINYINT(1) DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_receptionists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_receptionists_shift CHECK (shift IN ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_receptionists_user ON receptionists(user_id);
```

---

### 11. DOCTOR_SCHEDULES (Lịch làm việc bác sĩ)

```sql
CREATE TABLE doctor_schedules (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id       BIGINT NOT NULL,
    day_of_week     INT NOT NULL, -- 0=Sunday, 6=Saturday
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    slot_duration   INT DEFAULT 30, -- minutes per slot
    max_patients    INT DEFAULT 20,
    is_active       TINYINT(1) DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_doctor_schedules_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    CONSTRAINT chk_doctor_schedules_day CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT chk_doctor_schedules_time CHECK (end_time > start_time),
    UNIQUE KEY unique_doctor_schedule (doctor_id, day_of_week, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_doctor_schedules_doctor ON doctor_schedules(doctor_id);
CREATE INDEX idx_doctor_schedules_day ON doctor_schedules(day_of_week);
```

---

### 12. SCHEDULE_EXCEPTIONS (Ngoại lệ lịch làm việc)

Quản lý ngày nghỉ, ngày làm thêm của bác sĩ.

```sql
CREATE TABLE schedule_exceptions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id       BIGINT NOT NULL,
    exception_date  DATE NOT NULL,
    exception_type  VARCHAR(20) NOT NULL,
    start_time      TIME,
    end_time        TIME,
    reason          VARCHAR(255),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_schedule_exceptions_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    CONSTRAINT chk_schedule_exceptions_type CHECK (exception_type IN ('OFF', 'MODIFIED', 'EXTRA')),
    UNIQUE KEY unique_doctor_exception_date (doctor_id, exception_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_schedule_exceptions_doctor ON schedule_exceptions(doctor_id);
CREATE INDEX idx_schedule_exceptions_date ON schedule_exceptions(exception_date);
```

---

### 13. TIME_SLOTS (Khung giờ khám)

```sql
CREATE TABLE time_slots (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id       BIGINT NOT NULL,
    slot_date       DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    status          VARCHAR(20) DEFAULT 'AVAILABLE',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_time_slots_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    CONSTRAINT chk_time_slots_status CHECK (status IN ('AVAILABLE', 'BOOKED', 'BLOCKED', 'COMPLETED')),
    UNIQUE KEY unique_time_slot (doctor_id, slot_date, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_time_slots_doctor ON time_slots(doctor_id);
CREATE INDEX idx_time_slots_date ON time_slots(slot_date);
CREATE INDEX idx_time_slots_status ON time_slots(status);
CREATE INDEX idx_time_slots_doctor_date ON time_slots(doctor_id, slot_date);
```

---

### 14. APPOINTMENTS (Lịch hẹn khám)

```sql
CREATE TABLE appointments (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_code    VARCHAR(20) NOT NULL UNIQUE, -- APT-20260117-0001
    patient_id          BIGINT NOT NULL,
    doctor_id           BIGINT NOT NULL,
    time_slot_id        BIGINT,
    booked_by           BIGINT, -- receptionist or patient
    appointment_date    DATE NOT NULL,
    appointment_time    TIME NOT NULL,
    end_time            TIME,
    appointment_type    VARCHAR(30) DEFAULT 'CONSULTATION',
    status              VARCHAR(20) DEFAULT 'PENDING',
    reason              TEXT,
    symptoms            TEXT,
    notes               TEXT,
    doctor_notes        TEXT,
    diagnosis           TEXT,
    prescription        TEXT,
    cancellation_reason TEXT,
    cancelled_by        BIGINT,
    cancelled_at        DATETIME,
    confirmed_at        DATETIME,
    checked_in_at       DATETIME,
    completed_at        DATETIME,
    queue_number        INT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    CONSTRAINT fk_appointments_time_slot FOREIGN KEY (time_slot_id) REFERENCES time_slots(id),
    CONSTRAINT fk_appointments_booked_by FOREIGN KEY (booked_by) REFERENCES users(id),
    CONSTRAINT fk_appointments_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(id),
    CONSTRAINT chk_appointments_type CHECK (appointment_type IN ('CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'CHECKUP')),
    CONSTRAINT chk_appointments_status CHECK (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 
                                         'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_code ON appointments(appointment_code);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
```

---

### 15. APPOINTMENT_HISTORY (Lịch sử thay đổi lịch hẹn)

```sql
CREATE TABLE appointment_history (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id  BIGINT NOT NULL,
    changed_by      BIGINT,
    old_status      VARCHAR(20),
    new_status      VARCHAR(20),
    old_date        DATE,
    new_date        DATE,
    old_time        TIME,
    new_time        TIME,
    change_reason   TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointment_history_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    CONSTRAINT fk_appointment_history_changed_by FOREIGN KEY (changed_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_appointment_history_appointment ON appointment_history(appointment_id);
```

---

### 16. MEDICAL_RECORDS (Hồ sơ bệnh án)

```sql
CREATE TABLE medical_records (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_code         VARCHAR(20) NOT NULL UNIQUE,
    patient_id          BIGINT NOT NULL,
    appointment_id      BIGINT,
    doctor_id           BIGINT NOT NULL,
    visit_date          DATE NOT NULL,
    chief_complaint     TEXT,
    present_illness     TEXT,
    vital_signs         JSON, -- {"blood_pressure": "120/80", "temperature": 37, "pulse": 72}
    physical_exam       TEXT,
    diagnosis           TEXT,
    diagnosis_code      VARCHAR(20), -- ICD-10 code
    treatment_plan      TEXT,
    prescription        TEXT,
    lab_results         JSON,
    follow_up_date      DATE,
    follow_up_notes     TEXT,
    attachments         JSON, -- Array of file URLs
    is_confidential     TINYINT(1) DEFAULT 0,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_medical_records_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_medical_records_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_medical_records_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_doctor ON medical_records(doctor_id);
CREATE INDEX idx_medical_records_date ON medical_records(visit_date);
CREATE INDEX idx_medical_records_appointment ON medical_records(appointment_id);
```

---

### 17. PRESCRIPTIONS (Đơn thuốc)

```sql
CREATE TABLE prescriptions (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_code   VARCHAR(20) NOT NULL UNIQUE,
    medical_record_id   BIGINT,
    appointment_id      BIGINT,
    patient_id          BIGINT NOT NULL,
    doctor_id           BIGINT NOT NULL,
    issue_date          DATE NOT NULL,
    valid_until         DATE,
    notes               TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prescriptions_medical_record FOREIGN KEY (medical_record_id) REFERENCES medical_records(id),
    CONSTRAINT fk_prescriptions_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_prescriptions_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_prescriptions_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
```

---

### 18. MEDICATIONS (Danh mục thuốc)

```sql
CREATE TABLE medications (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    code                VARCHAR(50) NOT NULL UNIQUE,  -- Mã thuốc
    name                VARCHAR(255) NOT NULL,
    generic_name        VARCHAR(255),                 -- Tên hoạt chất
    brand_name          VARCHAR(255),                 -- Tên thương hiệu
    category            VARCHAR(100),                 -- Nhóm thuốc (kháng sinh, giảm đau...)
    dosage_form         VARCHAR(50),                  -- Dạng bào chế (viên, siro, tiêm...)
    strength            VARCHAR(100),                 -- Hàm lượng (500mg, 250mg/5ml...)
    unit                VARCHAR(50),                  -- Đơn vị (viên, chai, ống...)
    manufacturer        VARCHAR(255),                 -- Nhà sản xuất
    country_of_origin   VARCHAR(100),                 -- Xuất xứ
    description         TEXT,
    side_effects        TEXT,                         -- Tác dụng phụ
    contraindications   TEXT,                         -- Chống chỉ định
    storage_conditions  VARCHAR(255),                 -- Điều kiện bảo quản
    requires_prescription TINYINT(1) DEFAULT 1,       -- Cần kê đơn
    unit_price          DECIMAL(12, 2),               -- Giá tham khảo
    is_active           TINYINT(1) DEFAULT 1,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_medications_code ON medications(code);
CREATE INDEX idx_medications_name ON medications(name);
CREATE INDEX idx_medications_generic ON medications(generic_name);
CREATE INDEX idx_medications_category ON medications(category);
CREATE INDEX idx_medications_active ON medications(is_active);

-- Sample medications
INSERT INTO medications (code, name, generic_name, category, dosage_form, strength, unit) VALUES
    ('MED001', 'Panadol Extra', 'Paracetamol + Caffeine', 'Giảm đau - Hạ sốt', 'Viên nén', '500mg + 65mg', 'Viên'),
    ('MED002', 'Augmentin', 'Amoxicillin + Clavulanic acid', 'Kháng sinh', 'Viên nén', '625mg', 'Viên'),
    ('MED003', 'Omeprazole', 'Omeprazole', 'Tiêu hóa', 'Viên nang', '20mg', 'Viên'),
    ('MED004', 'Loratadine', 'Loratadine', 'Kháng histamin', 'Viên nén', '10mg', 'Viên'),
    ('MED005', 'Vitamin C', 'Ascorbic Acid', 'Vitamin', 'Viên sủi', '1000mg', 'Viên');
```

---

### 19. PRESCRIPTION_ITEMS (Chi tiết đơn thuốc)

```sql
CREATE TABLE prescription_items (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id     BIGINT NOT NULL,
    medication_id       BIGINT,  -- Liên kết với danh mục thuốc
    medication_name     VARCHAR(255) NOT NULL,              -- Tên thuốc (backup nếu không có trong danh mục)
    dosage              VARCHAR(100),                       -- Liều dùng
    frequency           VARCHAR(100),                       -- Tần suất (2 lần/ngày)
    duration            VARCHAR(100),                       -- Thời gian (7 ngày)
    quantity            INT,                            -- Số lượng
    unit                VARCHAR(50),                        -- Đơn vị
    morning_dose        VARCHAR(50),                        -- Liều sáng
    noon_dose           VARCHAR(50),                        -- Liều trưa
    evening_dose        VARCHAR(50),                        -- Liều chiều
    night_dose          VARCHAR(50),                        -- Liều tối
    take_with_food      TINYINT(1) DEFAULT 0,              -- Uống cùng/sau ăn
    instructions        TEXT,                               -- Hướng dẫn chi tiết
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prescription_items_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_prescription_items_medication FOREIGN KEY (medication_id) REFERENCES medications(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);
CREATE INDEX idx_prescription_items_medication ON prescription_items(medication_id);
```

---

### 20. REVIEWS (Đánh giá bác sĩ)

```sql
CREATE TABLE reviews (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id  BIGINT NOT NULL UNIQUE,
    patient_id      BIGINT NOT NULL,
    doctor_id       BIGINT NOT NULL,
    rating          INT NOT NULL,
    comment         TEXT,
    is_anonymous    TINYINT(1) DEFAULT 0,
    is_visible      TINYINT(1) DEFAULT 1,
    admin_response  TEXT,
    responded_at    DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_reviews_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_reviews_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_reviews_doctor ON reviews(doctor_id);
CREATE INDEX idx_reviews_patient ON reviews(patient_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

---

### 21. FAVORITE_DOCTORS (Bác sĩ yêu thích)

```sql
CREATE TABLE favorite_doctors (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id      BIGINT NOT NULL,
    doctor_id       BIGINT NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_patient_doctor (patient_id, doctor_id),
    CONSTRAINT fk_favorite_doctors_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorite_doctors_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_favorite_doctors_patient ON favorite_doctors(patient_id);
```

---

### 22. PAYMENTS (Thanh toán)

```sql
CREATE TABLE payments (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_code        VARCHAR(20) NOT NULL UNIQUE,
    appointment_id      BIGINT NOT NULL,
    patient_id          BIGINT NOT NULL,
    amount              DECIMAL(12, 2) NOT NULL,
    discount_amount     DECIMAL(12, 2) DEFAULT 0,
    tax_amount          DECIMAL(12, 2) DEFAULT 0,
    total_amount        DECIMAL(12, 2) NOT NULL,
    currency            VARCHAR(3) DEFAULT 'VND',
    payment_method      VARCHAR(30),
    payment_status      VARCHAR(20) DEFAULT 'PENDING',
    transaction_id      VARCHAR(100),
    gateway_response    JSON,
    paid_at             DATETIME,
    refunded_at         DATETIME,
    refund_amount       DECIMAL(12, 2),
    refund_reason       TEXT,
    processed_by        BIGINT,
    notes               TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_payments_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_payments_processed_by FOREIGN KEY (processed_by) REFERENCES users(id),
    CONSTRAINT chk_payments_method CHECK (payment_method IN ('CASH', 'CARD', 'BANK_TRANSFER', 'MOMO', 'VNPAY', 'ZALOPAY')),
    CONSTRAINT chk_payments_status CHECK (payment_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_payments_appointment ON payments(appointment_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_code ON payments(payment_code);
```

---

### 23. INVOICES (Hóa đơn)

```sql
CREATE TABLE invoices (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number      VARCHAR(30) NOT NULL UNIQUE,
    payment_id          BIGINT NOT NULL,
    patient_id          BIGINT NOT NULL,
    invoice_date        DATE NOT NULL,
    due_date            DATE,
    subtotal            DECIMAL(12, 2) NOT NULL,
    discount            DECIMAL(12, 2) DEFAULT 0,
    tax                 DECIMAL(12, 2) DEFAULT 0,
    total               DECIMAL(12, 2) NOT NULL,
    status              VARCHAR(20) DEFAULT 'ISSUED',
    notes               TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoices_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
    CONSTRAINT fk_invoices_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT chk_invoices_status CHECK (status IN ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED', 'REFUNDED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_invoices_payment ON invoices(payment_id);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
```

---

### 24. INVOICE_ITEMS (Chi tiết hóa đơn)

```sql
CREATE TABLE invoice_items (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id      BIGINT NOT NULL,
    description     VARCHAR(255) NOT NULL,
    quantity        INT DEFAULT 1,
    unit_price      DECIMAL(12, 2) NOT NULL,
    total_price     DECIMAL(12, 2) NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
```

---

### 25. NOTIFICATIONS (Thông báo)

```sql
CREATE TABLE notifications (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    type            VARCHAR(30) NOT NULL,
    reference_type  VARCHAR(50), -- appointment, payment, etc.
    reference_id    BIGINT,
    is_read         TINYINT(1) DEFAULT 0,
    read_at         DATETIME,
    sent_via        JSON, -- ["IN_APP", "EMAIL", "SMS", "PUSH"]
    email_sent      TINYINT(1) DEFAULT 0,
    sms_sent        TINYINT(1) DEFAULT 0,
    push_sent       TINYINT(1) DEFAULT 0,
    scheduled_at    DATETIME,
    sent_at         DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_notifications_type CHECK (type IN ('APPOINTMENT_REMINDER', 'APPOINTMENT_CONFIRMED', 
                                   'APPOINTMENT_CANCELLED', 'PAYMENT_SUCCESS', 
                                   'PAYMENT_FAILED', 'REVIEW_REQUEST', 'SYSTEM', 'PROMOTION'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
```

---

### 26. NOTIFICATION_PREFERENCES (Cài đặt thông báo)

```sql
CREATE TABLE notification_preferences (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id                 BIGINT NOT NULL UNIQUE,
    email_enabled           TINYINT(1) DEFAULT 1,
    sms_enabled             TINYINT(1) DEFAULT 1,
    push_enabled            TINYINT(1) DEFAULT 1,
    appointment_reminders   TINYINT(1) DEFAULT 1,
    promotional_emails      TINYINT(1) DEFAULT 0,
    reminder_hours_before   INT DEFAULT 24,
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
```

---

### 27. DEVICE_TOKENS (Token thiết bị cho Push Notification)

```sql
CREATE TABLE device_tokens (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    device_token    VARCHAR(500) NOT NULL,
    device_type     VARCHAR(20),
    device_name     VARCHAR(100),
    is_active       TINYINT(1) DEFAULT 1,
    last_used_at    DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_device_token (user_id, device_token),
    CONSTRAINT fk_device_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_device_tokens_type CHECK (device_type IN ('IOS', 'ANDROID', 'WEB'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);
```

---

### 28. AUDIT_LOGS (Nhật ký hệ thống)

```sql
CREATE TABLE audit_logs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT,
    action          VARCHAR(50) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       BIGINT,
    old_values      JSON,
    new_values      JSON,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

---

### 29. SYSTEM_SETTINGS (Cài đặt hệ thống)

```sql
CREATE TABLE system_settings (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    setting_key     VARCHAR(100) NOT NULL UNIQUE,
    setting_value   TEXT,
    data_type       VARCHAR(20) DEFAULT 'STRING',
    description     VARCHAR(255),
    is_public       TINYINT(1) DEFAULT 0,
    updated_by      BIGINT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_system_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
    ('CLINIC_NAME', 'MediTech Clinic', 'Tên phòng khám'),
    ('CLINIC_ADDRESS', '123 Nguyễn Văn Linh, Q7, TP.HCM', 'Địa chỉ phòng khám'),
    ('CLINIC_PHONE', '028-1234-5678', 'Số điện thoại'),
    ('WORKING_HOURS_START', '08:00', 'Giờ mở cửa'),
    ('WORKING_HOURS_END', '20:00', 'Giờ đóng cửa'),
    ('APPOINTMENT_SLOT_DURATION', '30', 'Thời lượng mỗi slot (phút)'),
    ('CANCELLATION_HOURS_BEFORE', '24', 'Số giờ trước khi hủy lịch'),
    ('MAX_APPOINTMENTS_PER_DAY', '50', 'Số lịch hẹn tối đa/ngày');
```

---

## Quan Hệ Giữa Các Bảng

| Bảng gốc | Quan hệ | Bảng liên kết |
|----------|---------|---------------|
| users | 1-N | user_roles |
| users | 1-1 | patients |
| users | 1-1 | doctors |
| users | 1-1 | receptionists |
| roles | 1-N | user_roles |
| roles | 1-N | role_permissions |
| doctors | 1-N | doctor_schedules |
| doctors | 1-N | time_slots |
| doctors | 1-N | appointments |
| doctors | 1-N | reviews |
| patients | 1-N | appointments |
| patients | 1-N | medical_records |
| patients | 1-N | reviews |
| appointments | 1-1 | payments |
| appointments | 1-1 | reviews |
| appointments | 1-N | appointment_history |
| payments | 1-1 | invoices |

---

## Role Permissions Matrix

| Permission | ADMIN | DOCTOR | RECEPTIONIST | PATIENT |
|------------|-------|--------|--------------|---------|
| VIEW_ALL_APPOINTMENTS | ✅ | ❌ | ✅ | ❌ |
| MANAGE_APPOINTMENTS | ✅ | ✅ (own) | ✅ | ✅ (own) |
| VIEW_PATIENTS | ✅ | ✅ (own) | ✅ | ❌ |
| MANAGE_PATIENTS | ✅ | ❌ | ✅ | ✅ (own) |
| VIEW_DOCTORS | ✅ | ✅ | ✅ | ✅ |
| MANAGE_DOCTORS | ✅ | ✅ (own) | ❌ | ❌ |
| VIEW_PAYMENTS | ✅ | ❌ | ✅ | ✅ (own) |
| MANAGE_PAYMENTS | ✅ | ❌ | ✅ | ❌ |
| VIEW_REPORTS | ✅ | ✅ (own) | ✅ | ❌ |
| MANAGE_SYSTEM | ✅ | ❌ | ❌ | ❌ |

---

## Indexes Tổng Hợp

Các index quan trọng cho performance:

```sql
-- Composite indexes for common queries
CREATE INDEX idx_appointments_doctor_date_status 
    ON appointments(doctor_id, appointment_date, status);

CREATE INDEX idx_time_slots_doctor_date_status 
    ON time_slots(doctor_id, slot_date, status);

CREATE INDEX idx_notifications_user_type_unread 
    ON notifications(user_id, type, is_read);

CREATE INDEX idx_doctor_specialties_specialty_available 
    ON doctor_specialties(specialty_id, doctor_id);

CREATE INDEX idx_payments_date_status 
    ON payments(created_at, payment_status);
```

---

## Database Triggers

### Auto-update rating khi có review mới

```sql
DELIMITER $$

CREATE TRIGGER trigger_update_doctor_rating_after_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE doctors 
    SET 
        rating_avg = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM reviews 
            WHERE doctor_id = NEW.doctor_id AND is_visible = 1
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE doctor_id = NEW.doctor_id AND is_visible = 1
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.doctor_id;
END$$

CREATE TRIGGER trigger_update_doctor_rating_after_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    UPDATE doctors 
    SET 
        rating_avg = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM reviews 
            WHERE doctor_id = NEW.doctor_id AND is_visible = 1
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE doctor_id = NEW.doctor_id AND is_visible = 1
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.doctor_id;
END$$

CREATE TRIGGER trigger_update_doctor_rating_after_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    UPDATE doctors 
    SET 
        rating_avg = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM reviews 
            WHERE doctor_id = OLD.doctor_id AND is_visible = 1
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE doctor_id = OLD.doctor_id AND is_visible = 1
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.doctor_id;
END$$

DELIMITER ;
```

### Auto-update time slot status

```sql
DELIMITER $$

CREATE TRIGGER trigger_update_timeslot_after_insert
AFTER INSERT ON appointments
FOR EACH ROW
BEGIN
    IF NEW.status IN ('CONFIRMED', 'PENDING') THEN
        UPDATE time_slots SET status = 'BOOKED' WHERE id = NEW.time_slot_id;
    ELSEIF NEW.status IN ('CANCELLED', 'NO_SHOW') THEN
        UPDATE time_slots SET status = 'AVAILABLE' WHERE id = NEW.time_slot_id;
    ELSEIF NEW.status = 'COMPLETED' THEN
        UPDATE time_slots SET status = 'COMPLETED' WHERE id = NEW.time_slot_id;
    END IF;
END$$

CREATE TRIGGER trigger_update_timeslot_after_update
AFTER UPDATE ON appointments
FOR EACH ROW
BEGIN
    IF NEW.status IN ('CONFIRMED', 'PENDING') THEN
        UPDATE time_slots SET status = 'BOOKED' WHERE id = NEW.time_slot_id;
    ELSEIF NEW.status IN ('CANCELLED', 'NO_SHOW') THEN
        UPDATE time_slots SET status = 'AVAILABLE' WHERE id = NEW.time_slot_id;
    ELSEIF NEW.status = 'COMPLETED' THEN
        UPDATE time_slots SET status = 'COMPLETED' WHERE id = NEW.time_slot_id;
    END IF;
END$$

DELIMITER ;
```

---

## Ghi Chú

1. **JSON columns**: Sử dụng JSON type cho dữ liệu linh hoạt như vital_signs, lab_results
2. **Soft delete**: Có thể thêm `deleted_at` column nếu cần
3. **Audit trail**: Bảng audit_logs lưu mọi thay đổi quan trọng
4. **Timezone**: Tất cả DATETIME nên lưu UTC, convert khi hiển thị
5. **Encryption**: password_hash sử dụng bcrypt, sensitive data có thể encrypt với AES_ENCRYPT/AES_DECRYPT
6. **Storage Engine**: Sử dụng InnoDB để hỗ trợ foreign keys và transactions
7. **Character Set**: utf8mb4 để hỗ trợ đầy đủ Unicode (bao gồm emoji)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-17 | Initial database design |
