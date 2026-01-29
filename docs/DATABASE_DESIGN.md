-- =========================================================
-- MediTech - Full Database Schema (MySQL 8.x)
-- Roles: ADMIN, DOCTOR, RECEPTIONIST, PATIENT
-- Includes: sessions, security_events, blocked_ips, doctor_documents, templates
-- =========================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =========================================================
-- 1) USERS / RBAC
-- =========================================================

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
    failed_login_count  INT DEFAULT 0,
    locked_until        DATETIME NULL,
    last_login          DATETIME,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_active ON users(is_active);

CREATE TABLE roles (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,
    description     VARCHAR(255),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Quản trị viên hệ thống'),
    ('DOCTOR', 'Bác sĩ'),
    ('RECEPTIONIST', 'Lễ tân'),
    ('PATIENT', 'Bệnh nhân')
ON DUPLICATE KEY UPDATE description = VALUES(description);

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

CREATE TABLE permissions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     VARCHAR(255),
    module          VARCHAR(50),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bạn có thể mở rộng dần. Đây là set tối thiểu hợp scope.
INSERT INTO permissions (name, description, module) VALUES
    ('VIEW_ALL_APPOINTMENTS', 'Xem tất cả lịch hẹn', 'appointment'),
    ('MANAGE_APPOINTMENTS', 'Quản lý lịch hẹn', 'appointment'),
    ('CHECKIN_PATIENT', 'Check-in bệnh nhân', 'appointment'),
    ('VIEW_PATIENTS', 'Xem danh sách bệnh nhân', 'patient'),
    ('MANAGE_PATIENTS', 'Quản lý bệnh nhân', 'patient'),
    ('VIEW_DOCTORS', 'Xem danh sách bác sĩ', 'doctor'),
    ('MANAGE_DOCTORS', 'Quản lý bác sĩ', 'doctor'),
    ('UPLOAD_DOCTOR_DOCUMENT', 'Upload giấy tờ bác sĩ', 'doctor_docs'),
    ('REVIEW_DOCTOR_DOCUMENT', 'Duyệt giấy tờ bác sĩ', 'doctor_docs'),
    ('VIEW_PAYMENTS', 'Xem thanh toán', 'payment'),
    ('MANAGE_PAYMENTS', 'Quản lý thanh toán', 'payment'),
    ('CREATE_PAYMENT', 'Tạo yêu cầu thanh toán', 'payment'),
    ('MARK_CASH_PAYMENT', 'Xác nhận thanh toán tiền mặt', 'payment'),
    ('REFUND_PAYMENT', 'Hoàn tiền', 'payment'),
    ('VIEW_REPORTS', 'Xem báo cáo', 'report'),
    ('MANAGE_SYSTEM', 'Quản lý hệ thống', 'system'),
    ('VIEW_SECURITY', 'Xem security events', 'security'),
    ('MANAGE_SECURITY', 'Block/unblock IP, kill session', 'security')
ON DUPLICATE KEY UPDATE description = VALUES(description), module = VALUES(module);

CREATE TABLE role_permissions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id         INT NOT NULL,
    permission_id   INT NOT NULL,
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);

-- =========================================================
-- 2) MASTER DATA
-- =========================================================

CREATE TABLE specialties (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    icon_url        VARCHAR(500),
    is_active       TINYINT(1) DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 3) PROFILES: doctors / patients / receptionists
-- =========================================================

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
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    verified_at         DATETIME NULL,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_doctors_verification CHECK (verification_status IN ('PENDING','APPROVED','REJECTED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_doctors_user ON doctors(user_id);
CREATE INDEX idx_doctors_available ON doctors(is_available);
CREATE INDEX idx_doctors_rating ON doctors(rating_avg DESC);
CREATE INDEX idx_doctors_verification ON doctors(verification_status);

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

-- =========================================================
-- 4) SCHEDULES / SLOTS / APPOINTMENTS
-- =========================================================

CREATE TABLE doctor_schedules (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id       BIGINT NOT NULL,
    day_of_week     INT NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    slot_duration   INT DEFAULT 30,
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

CREATE TABLE appointments (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_code    VARCHAR(20) NOT NULL UNIQUE,
    patient_id          BIGINT NOT NULL,
    doctor_id           BIGINT NOT NULL,
    time_slot_id        BIGINT,
    booked_by           BIGINT,
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
    CONSTRAINT chk_appointments_status CHECK (status IN ('PENDING','CONFIRMED','CHECKED_IN','IN_PROGRESS',
                                                         'COMPLETED','CANCELLED','NO_SHOW','RESCHEDULED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_code ON appointments(appointment_code);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);

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

-- =========================================================
-- 5) MEDICAL / PRESCRIPTION
-- =========================================================

CREATE TABLE medical_records (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_code         VARCHAR(20) NOT NULL UNIQUE,
    patient_id          BIGINT NOT NULL,
    appointment_id      BIGINT,
    doctor_id           BIGINT NOT NULL,
    visit_date          DATE NOT NULL,
    chief_complaint     TEXT,
    present_illness     TEXT,
    vital_signs         JSON,
    physical_exam       TEXT,
    diagnosis           TEXT,
    diagnosis_code      VARCHAR(20),
    treatment_plan      TEXT,
    prescription        TEXT,
    lab_results         JSON,
    follow_up_date      DATE,
    follow_up_notes     TEXT,
    attachments         JSON,
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

CREATE TABLE medications (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    code                VARCHAR(50) NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    generic_name        VARCHAR(255),
    brand_name          VARCHAR(255),
    category            VARCHAR(100),
    dosage_form         VARCHAR(50),
    strength            VARCHAR(100),
    unit                VARCHAR(50),
    manufacturer        VARCHAR(255),
    country_of_origin   VARCHAR(100),
    description         TEXT,
    side_effects        TEXT,
    contraindications   TEXT,
    storage_conditions  VARCHAR(255),
    requires_prescription TINYINT(1) DEFAULT 1,
    unit_price          DECIMAL(12, 2),
    is_active           TINYINT(1) DEFAULT 1,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_medications_code ON medications(code);
CREATE INDEX idx_medications_name ON medications(name);
CREATE INDEX idx_medications_generic ON medications(generic_name);
CREATE INDEX idx_medications_category ON medications(category);
CREATE INDEX idx_medications_active ON medications(is_active);

CREATE TABLE prescription_items (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id     BIGINT NOT NULL,
    medication_id       BIGINT,
    medication_name     VARCHAR(255) NOT NULL,
    dosage              VARCHAR(100),
    frequency           VARCHAR(100),
    duration            VARCHAR(100),
    quantity            INT,
    unit                VARCHAR(50),
    morning_dose        VARCHAR(50),
    noon_dose           VARCHAR(50),
    evening_dose        VARCHAR(50),
    night_dose          VARCHAR(50),
    take_with_food      TINYINT(1) DEFAULT 0,
    instructions        TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prescription_items_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_prescription_items_medication FOREIGN KEY (medication_id) REFERENCES medications(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);
CREATE INDEX idx_prescription_items_medication ON prescription_items(medication_id);

-- =========================================================
-- 6) REVIEWS / FAVORITES
-- =========================================================

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

-- =========================================================
-- 7) PAYMENTS / INVOICES
-- =========================================================

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
    CONSTRAINT chk_payments_method CHECK (payment_method IN ('CASH','CARD','BANK_TRANSFER','MOMO','VNPAY','ZALOPAY')),
    CONSTRAINT chk_payments_status CHECK (payment_status IN ('PENDING','PROCESSING','COMPLETED','FAILED','REFUNDED','CANCELLED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_payments_appointment ON payments(appointment_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_code ON payments(payment_code);

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
    CONSTRAINT chk_invoices_status CHECK (status IN ('DRAFT','ISSUED','PAID','CANCELLED','REFUNDED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_invoices_payment ON invoices(payment_id);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);

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

-- =========================================================
-- 8) NOTIFICATIONS
-- =========================================================

CREATE TABLE notifications (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    type            VARCHAR(30) NOT NULL,
    reference_type  VARCHAR(50),
    reference_id    BIGINT,
    is_read         TINYINT(1) DEFAULT 0,
    read_at         DATETIME,
    sent_via        JSON,
    email_sent      TINYINT(1) DEFAULT 0,
    sms_sent        TINYINT(1) DEFAULT 0,
    push_sent       TINYINT(1) DEFAULT 0,
    scheduled_at    DATETIME,
    sent_at         DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_notifications_type CHECK (type IN (
        'APPOINTMENT_REMINDER','APPOINTMENT_CONFIRMED','APPOINTMENT_CANCELLED',
        'PAYMENT_SUCCESS','PAYMENT_FAILED','REVIEW_REQUEST','SYSTEM','PROMOTION',
        'DOCTOR_DOC_APPROVED','DOCTOR_DOC_REJECTED'
    ))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

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
    CONSTRAINT chk_device_tokens_type CHECK (device_type IN ('IOS','ANDROID','WEB'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);

-- =========================================================
-- 9) AUDIT LOGS
-- =========================================================

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

-- =========================================================
-- 10) SYSTEM SETTINGS
-- =========================================================

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

-- =========================================================
-- 11) NEW - SECURITY: user_sessions / security_events / blocked_ips
-- =========================================================

CREATE TABLE user_sessions (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    session_key         CHAR(36) NOT NULL UNIQUE,          -- UUID
    refresh_token_hash  VARCHAR(255) NOT NULL,             -- store hash only
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at        DATETIME NULL,
    expires_at          DATETIME NOT NULL,
    revoked_at          DATETIME NULL,
    revoke_reason       VARCHAR(255),
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_revoked ON user_sessions(revoked_at);

CREATE TABLE security_events (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NULL,
    event_type      VARCHAR(50) NOT NULL,    -- FAILED_LOGIN, ACCOUNT_LOCKED, PASSWORD_CHANGED, 2FA_ENABLED...
    severity        VARCHAR(10) NOT NULL,    -- LOW/MEDIUM/HIGH/CRITICAL
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    metadata        JSON,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_security_events_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_security_events_sev CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_created ON security_events(created_at);

CREATE TABLE blocked_ips (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    ip_address      VARCHAR(45) NOT NULL,
    reason          VARCHAR(255),
    blocked_by      BIGINT,
    blocked_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at      DATETIME NULL,
    is_active       TINYINT(1) DEFAULT 1,
    CONSTRAINT fk_blocked_ips_blocked_by FOREIGN KEY (blocked_by) REFERENCES users(id),
    UNIQUE KEY unique_blocked_ip_active (ip_address, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_blocked_ips_ip ON blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_active ON blocked_ips(is_active);
CREATE INDEX idx_blocked_ips_expires ON blocked_ips(expires_at);

-- =========================================================
-- 12) NEW - DOCTOR DOCUMENTS (verification)
-- =========================================================

CREATE TABLE doctor_documents (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id       BIGINT NOT NULL,
    document_type   VARCHAR(30) NOT NULL,   -- LICENSE/ID/DEGREE/EXPERIENCE
    file_url        VARCHAR(500) NOT NULL,
    file_hash       VARCHAR(64) NULL,       -- SHA-256 optional
    status          VARCHAR(20) DEFAULT 'PENDING',
    uploaded_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_by     BIGINT NULL,
    reviewed_at     DATETIME NULL,
    review_note     TEXT,
    CONSTRAINT fk_doctor_documents_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    CONSTRAINT fk_doctor_documents_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id),
    CONSTRAINT chk_doctor_documents_type CHECK (document_type IN ('LICENSE','ID','DEGREE','EXPERIENCE')),
    CONSTRAINT chk_doctor_documents_status CHECK (status IN ('PENDING','APPROVED','REJECTED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_doctor_documents_doctor ON doctor_documents(doctor_id);
CREATE INDEX idx_doctor_documents_status ON doctor_documents(status);
CREATE INDEX idx_doctor_documents_type ON doctor_documents(document_type);

-- =========================================================
-- 13) NEW - PRESCRIPTION TEMPLATES
-- =========================================================

CREATE TABLE prescription_templates (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id       BIGINT NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    is_active       TINYINT(1) DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prescription_templates_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_prescription_templates_doctor ON prescription_templates(doctor_id);
CREATE INDEX idx_prescription_templates_active ON prescription_templates(is_active);

CREATE TABLE prescription_template_items (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_id         BIGINT NOT NULL,
    medication_id       BIGINT NULL,
    medication_name     VARCHAR(255) NOT NULL,
    dosage              VARCHAR(100),
    frequency           VARCHAR(100),
    duration            VARCHAR(100),
    quantity            INT,
    unit                VARCHAR(50),
    morning_dose        VARCHAR(50),
    noon_dose           VARCHAR(50),
    evening_dose        VARCHAR(50),
    night_dose          VARCHAR(50),
    take_with_food      TINYINT(1) DEFAULT 0,
    instructions        TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_template_items_template FOREIGN KEY (template_id) REFERENCES prescription_templates(id) ON DELETE CASCADE,
    CONSTRAINT fk_template_items_medication FOREIGN KEY (medication_id) REFERENCES medications(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_template_items_template ON prescription_template_items(template_id);
CREATE INDEX idx_template_items_medication ON prescription_template_items(medication_id);

-- =========================================================
-- 14) PERFORMANCE INDEXES (composite)
-- =========================================================

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

-- =========================================================
-- END
-- =========================================================
