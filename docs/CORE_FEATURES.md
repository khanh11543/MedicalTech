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

------------------------------------------------------------------------------
# Medical Tech - Role-based Features (PATIENT / DOCTOR / ADMIN)

## Version
- Version: 1.0
- Date: 2026-01-23
- Scope: Online Medical Appointment System (Medical Tech)

---

# 1. PATIENT (Bệnh nhân)

## 1.1 Quản lý tài khoản & hồ sơ cá nhân
- Đăng ký / Đăng nhập / Đăng xuất
- Xác thực email / số điện thoại
- Đổi mật khẩu, quên mật khẩu
- Cập nhật thông tin cá nhân:
  - Họ tên, ngày sinh, giới tính
  - Địa chỉ, liên hệ khẩn cấp
  - Bảo hiểm y tế (nếu có)
- Quản lý cài đặt thông báo (email/SMS/app)

## 1.2 Tìm kiếm & lựa chọn dịch vụ khám
- Xem danh sách chuyên khoa
- Tìm bác sĩ theo chuyên khoa
- Lọc bác sĩ theo:
  - Đánh giá
  - Phí khám
  - Kinh nghiệm
  - Cơ sở
- Xem hồ sơ bác sĩ:
  - Thông tin chuyên môn
  - Đánh giá & nhận xét
  - Lịch làm việc

## 1.3 Đặt lịch khám (CORE)
- Xem lịch trống theo ngày
- Chọn khung giờ (slot)
- Nhập lý do/triệu chứng
- Đặt lịch cho:
  - Bản thân
  - Người thân
- Giữ slot tạm thời (hold slot)
- Xác nhận đặt lịch
- Nhận thông báo xác nhận

## 1.4 Quản lý lịch hẹn
- Xem danh sách lịch hẹn:
  - Sắp tới
  - Đã hoàn thành
  - Đã hủy
- Hủy lịch theo chính sách
- Đổi lịch (reschedule)
- Theo dõi trạng thái:
  - PENDING / CONFIRMED
  - CHECKED_IN / COMPLETED
  - NO_SHOW / CANCELLED

## 1.5 Ngày khám & sau khám
- Check-in tại quầy (qua lễ tân)
- Theo dõi số thứ tự
- Xem kết quả khám:
  - Chẩn đoán
  - Ghi chú bác sĩ
- Xem & tải đơn thuốc
- Xem lịch sử khám bệnh

## 1.6 Thanh toán & đánh giá
- Thanh toán:
  - Tiền mặt / Online (mock hoặc thật)
- Xem hóa đơn & biên nhận
- Đánh giá bác sĩ:
  - Sao (1–5)
  - Nhận xét
- Lưu bác sĩ yêu thích

## 1.7 Tính năng AI (Patient-facing)
- AI gợi ý chuyên khoa/bác sĩ từ triệu chứng
- Chatbot hỗ trợ đặt lịch
- AI cảnh báo mức độ ưu tiên (triage nhẹ)

---

# 2. DOCTOR (Bác sĩ)

## 2.1 Quản lý hồ sơ bác sĩ
- Cập nhật:
  - Thông tin chuyên môn
  - Bằng cấp, kinh nghiệm
  - Phí khám
- Quản lý trạng thái làm việc:
  - Sẵn sàng / Tạm nghỉ

## 2.2 Quản lý lịch làm việc (CORE)
- Thiết lập lịch làm việc theo:
  - Ngày trong tuần
  - Giờ bắt đầu / kết thúc
  - Thời lượng mỗi slot
- Khai báo:
  - Ngày nghỉ
  - Lịch làm thêm
- Xem lịch khám theo ngày / tuần

## 2.3 Quản lý lịch hẹn
- Xem danh sách lịch hẹn:
  - Hôm nay
  - Theo ngày
- Xác nhận / từ chối lịch
- Đề xuất đổi lịch
- Xem thông tin bệnh nhân (theo quyền)

## 2.4 Check-in & hàng đợi
- Xem danh sách bệnh nhân đã check-in
- Gọi bệnh nhân theo số thứ tự
- Cập nhật trạng thái:
  - WAITING
  - IN_PROGRESS
  - COMPLETED
  - NO_SHOW

## 2.5 Khám bệnh & bệnh án (CORE)
- Ghi nhận:
  - Triệu chứng
  - Chẩn đoán sơ bộ
  - Kết quả khám
- Lưu hồ sơ bệnh án
- Kê đơn thuốc điện tử:
  - Thuốc
  - Liều dùng
  - Hướng dẫn
- Chỉ định tái khám

## 2.6 Báo cáo & thống kê (cá nhân)
- Số ca khám theo ngày/tháng
- Tỷ lệ no-show
- Đánh giá trung bình
- Doanh thu cá nhân (nếu áp dụng)

## 2.7 Tính năng AI hỗ trợ bác sĩ
- AI tóm tắt bệnh án
- Gợi ý chẩn đoán/đơn thuốc (tham khảo)
- AI dự đoán no-show để tối ưu lịch

---

# 3. ADMIN (Quản trị hệ thống)

## 3.1 Quản lý người dùng & phân quyền (CORE)
- Tạo / khóa / mở tài khoản
- Gán vai trò:
  - PATIENT
  - DOCTOR
  - ADMIN
- Reset mật khẩu
- Theo dõi hoạt động người dùng

## 3.2 Quản lý danh mục hệ thống
- Quản lý:
  - Chuyên khoa
  - Dịch vụ khám
  - Thuốc
- Cấu hình:
  - Thời lượng slot mặc định
  - Chính sách hủy/đổi lịch
  - Giờ làm việc hệ thống

## 3.3 Quản lý bác sĩ & lịch
- Phê duyệt hồ sơ bác sĩ
- Kích hoạt / tạm khóa bác sĩ
- Theo dõi lịch bác sĩ toàn hệ thống
- Can thiệp lịch khi cần (sự cố)

## 3.4 Quản lý lịch hẹn & vận hành
- Xem toàn bộ lịch hẹn
- Can thiệp:
  - Xác nhận
  - Hủy
  - Đổi lịch
- Quản lý hàng đợi & check-in
- Xử lý khiếu nại

## 3.5 Thanh toán & tài chính
- Theo dõi thanh toán
- Xử lý hoàn tiền
- Quản lý hóa đơn
- Xuất báo cáo doanh thu

## 3.6 Báo cáo & giám sát hệ thống (CORE)
- Thống kê:
  - Số lịch hẹn
  - Tỷ lệ hủy/no-show
  - Doanh thu
- Theo dõi:
  - Audit logs
  - Truy cập trái phép
- Giám sát hiệu năng & lỗi

## 3.7 Cấu hình & bảo mật
- Quản lý cài đặt hệ thống
- Quản lý notification template
- Xem audit logs
- Cấu hình bảo mật:
  - Policy mật khẩu
  - Giới hạn đăng nhập
  - Role permissions
