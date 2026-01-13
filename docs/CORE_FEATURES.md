# Online Medical Appointment System - Core Features

## Hệ Thống: 1 Backend + 2 Frontend (Doctor App + Patient App)

### 1. CORE FEATURES (Tính năng cốt lõi)

#### **MVP 1 - Appointment Management**
- [x] Đặt lịch hẹn (Patient)
- [x] Xem danh sách lịch hẹn (Doctor & Patient)
- [x] Hủy/Dịch lịch hẹn
- [x] Nhắc nhở lịch hẹn (Email/SMS)
- [x] Lịch sử khám bệnh

#### **MVP 2 - Doctor Management**
- [x] Quản lý thông tin bác sĩ
- [x] Quản lý lịch làm việc (calendar)
- [x] Cài đặt giá khám
- [x] Xem đánh giá từ bệnh nhân
- [x] Quản lý chuyên khoa

#### **MVP 3 - Patient Management**
- [x] Đăng ký/Đăng nhập
- [x] Hồ sơ bệnh nhân (Medical Profile)
- [x] Lịch sử khám bệnh
- [x] Lưu danh sách bác sĩ yêu thích
- [x] Đánh giá bác sĩ

#### **MVP 4 - Authentication & Authorization**
- [x] Login/Register
- [x] JWT Token authentication
- [x] Role-based access (Patient, Doctor, Admin)
- [x] Password reset
- [x] Two-factor authentication (optional)

#### **MVP 5 - Search & Discovery**
- [x] Tìm kiếm bác sĩ theo chuyên khoa
- [x] Filter theo giá, rating, khả dụng
- [x] Xem chi tiết bác sĩ
- [x] Slot time khả dụng

#### **MVP 6 - Payment Integration** (Phase 2)
- [x] Integrate payment gateway
- [x] Xử lý thanh toán
- [x] Hóa đơn/Receipt

#### **MVP 7 - Notification System**
- [x] Push notification
- [x] Email notification
- [x] In-app notification

---

## Priority Matrix (Theo Sprint)

| Priority | Feature | Sprint |
|----------|---------|--------|
| P0 - Critical | User Auth + Doctor Search + Appointment Booking | S1 |
| P0 - Critical | Doctor Schedule Management + Slot Management | S1 |
| P1 - High | Medical Profile + Appointment History | S2 |
| P1 - High | Notification System | S2 |
| P2 - Medium | Ratings & Reviews | S3 |
| P2 - Medium | Payment Integration | S3/S4 |
| P3 - Low | Advanced Analytics | S4+ |

