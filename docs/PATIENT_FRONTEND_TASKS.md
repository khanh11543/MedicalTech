# Bệnh Nhân - Danh Sách Việc Cần Làm (Patient Frontend Tasks)

> Tài liệu phân tích trang Home (user) và các trang bệnh nhân, so sánh giữa FE hiện tại và BE API.

---

## 📋 Tổng Quan Phân Loại Sections

| Trang | Section | Tĩnh (Hardcode) | Động (API) | Trạng thái FE | BE API |
|-------|---------|:---:|:---:|---|---|
| Home | Hero | ✅ | | ✅ Xong | Không cần |
| Home | About | ✅ | | ✅ Xong | Không cần |
| Home | Emergency | ✅ | | ✅ Xong | Không cần |
| Home | Featured Departments | | ✅ | ⚠️ Hardcode | ❌ Thiếu API |
| Home | Doctors | | ✅ | ⚠️ Hardcode | ✅ `GET /public/doctors` |
| Home | Services | ✅ | | ✅ Xong | Không cần |
| Home | CTA | ✅ | | ✅ Xong | Không cần |
| Departments | List | | ✅ | ⚠️ Cần kiểm tra | ❌ Thiếu API |
| Services | Services | ✅ | | ✅ Xong | Không cần |
| Doctors | List | | ✅ | ⚠️ Cần kết nối API | ✅ `GET /public/doctors` |
| Testimonials | Reviews | | ✅ | ⚠️ Cần kết nối API | ❌ Thiếu public API |
| FAQ | Questions | | ✅ | ⚠️ Cần kết nối API | ❌ Thiếu public API |
| Gallery | Images | | ✅ | ⚠️ Cần tạo | ❌ Thiếu entity + API |
| Contact | Info | ✅ | | ✅ Xong | Không cần |
| Contact | Form | | ✅ | ⚠️ Cần kết nối API | ❌ Thiếu public API |
| Appointment | Form | | ✅ | ⚠️ Cần kết nối API | ✅ `POST /patient/appointments` |
| Patient | Appointments | | ✅ | ⚠️ Mock data | ✅ `GET /patient/appointments` |
| Patient | Payments | | ✅ | ⚠️ Mock data | ✅ `GET /patient/payments` |
| Patient | Profile | | ✅ | ⚠️ Mock data | ✅ `GET /me/profile` |

---

## 🏠 TRANG HOME - Phân Tích Chi Tiết

### ✅ Sections Tĩnh (Không cần API) — ĐÃ XONG

| Section | Mô tả | File |
|---------|-------|------|
| **Hero** | Banner chính, slogan, nút CTA, thông tin liên hệ khẩn cấp | `HomePage.tsx → HeroSection()` |
| **About** | Giới thiệu bệnh viện, hình ảnh, chứng chỉ | `HomePage.tsx → AboutSection()` |
| **Services** | 4 dịch vụ nổi bật (Cardiology, Neurology, Orthopedic, Emergency) | `HomePage.tsx → ServicesSection()` |
| **CTA** | Kêu gọi đặt lịch + feature cards + cấp cứu | `HomePage.tsx → CTASection()` |
| **Emergency** | Thông tin cấp cứu, số hotline, hướng dẫn | `HomePage.tsx → EmergencySection()` |

### ⚠️ Sections Động (Cần API) — CẦN LÀM

#### 1. Featured Departments (Hiện đang hardcode)
- **FE hiện tại**: 6 departments hardcode trong `DepartmentsSection()` (Cardiology, Neurology, Orthopedics, Pediatrics, Oncology, Emergency Care)
- **BE hiện có**: `GET /public/specialties` (danh sách chuyên khoa)
- **Cần làm**:
  - [ ] **BE**: Xác nhận `/public/specialties` trả về đủ thông tin (icon, image, description) hoặc tạo endpoint mới `GET /public/departments` nếu departments ≠ specialties
  - [ ] **FE**: Gọi API thay hardcode, thêm loading skeleton, fallback khi lỗi

#### 2. Doctors (Hiện đang hardcode)
- **FE hiện tại**: 6 bác sĩ hardcode trong `DoctorSection()` (tên, specialty, rating, trạng thái)
- **BE hiện có**: `GET /public/doctors` ✅
- **Cần làm**:
  - [ ] **FE**: Tạo `publicService.ts` hoặc `landingService.ts` gọi `GET /public/doctors`
  - [ ] **FE**: Thay data hardcode bằng API response
  - [ ] **FE**: Thêm search/filter chức năng (hiện UI search có nhưng không hoạt động)
  - [ ] **FE**: Loading states + error handling

---

## 📄 CÁC TRANG KHÁC - Cần Kết Nối API

### 3. Departments Page (`DepartmentsPage.tsx`)
- **Cần làm BE**:
  - [ ] Tạo endpoint `GET /public/departments` (nếu khác specialties) hoặc mở rộng `/public/specialties` thêm field `image`, `description`
- **Cần làm FE**:
  - [ ] Gọi API thay dữ liệu tĩnh
  - [ ] Pagination nếu nhiều departments

### 4. Doctors Page (`DoctorsPage.tsx`)
- **BE đã có**: `GET /public/doctors`, `GET /public/doctors/{id}`, `GET /public/doctors/{id}/slots`
- **Cần làm FE**:
  - [ ] Kết nối API `GET /public/doctors` với filter (specialty, name)
  - [ ] Trang chi tiết bác sĩ kết nối `GET /public/doctors/{id}`

### 5. Testimonials Page (`TestimonialsPage.tsx`)
- **Cần làm BE**:
  - [ ] Tạo endpoint `GET /public/reviews` (chỉ trả reviews đã approved/published)
  - [ ] Có thể thêm `GET /public/doctors/{id}/reviews`
- **Cần làm FE**:
  - [ ] Gọi API hiển thị reviews thật từ bệnh nhân
  - [ ] Pagination

### 6. FAQ Page (`FAQPage.tsx`)
- **BE hiện có**: Entity `Content` hỗ trợ `ContentType.FAQ` nhưng chỉ admin mới truy cập được (`/admin/contents`)
- **Cần làm BE**:
  - [ ] Tạo endpoint `GET /public/contents?type=FAQ` hoặc `GET /public/faqs` (chỉ published)
- **Cần làm FE**:
  - [ ] Gọi API thay FAQ hardcode
  - [ ] Accordion/expand UI

### 7. Gallery Page (`GalleryPage.tsx`)
- **BE hiện có**: ❌ Không có entity Gallery
- **Cần làm BE**:
  - [ ] Thêm ContentType `GALLERY` vào entity Content hoặc tạo entity `Gallery` mới
  - [ ] Tạo endpoint `GET /public/gallery`
  - [ ] API upload gallery images (admin)
- **Cần làm FE**:
  - [ ] Gọi API hiển thị ảnh
  - [ ] Lightbox/modal xem ảnh lớn

### 8. Contact Page (`ContactPage.tsx`)
- **Info section**: ✅ Tĩnh (địa chỉ, SĐT, email) — không cần API
- **Form section**:
  - **BE hiện có**: `POST /users/support-tickets` nhưng yêu cầu đăng nhập
  - **Cần làm BE**:
    - [ ] Tạo endpoint `POST /public/contact` (không cần auth) — gửi email/lưu DB
  - **Cần làm FE**:
    - [ ] Kết nối form submit với API
    - [ ] Validation, success/error messages

---

## 🧑‍⚕️ TRANG BỆNH NHÂN (Patient Portal) — Ưu Tiên Cao

> Tất cả trang patient hiện đang dùng **mock data**. Cần chuyển sang gọi API thật.

### 9. Patient Appointments (`PatientAppointments.tsx`)
- **FE hiện tại**: 5 mock appointments hardcode (`mockAppointments`)
- **BE đã có**:
  - `GET /patient/appointments` — Lấy danh sách lịch hẹn
  - `POST /patient/appointments` — Đặt lịch mới
  - `PATCH /appointments/{id}/cancel` — Hủy lịch
  - `PATCH /appointments/{id}/reschedule` — Đổi lịch
- **Cần làm FE**:
  - [ ] Tạo `usePatientAppointments` hook gọi `GET /patient/appointments`
  - [ ] Thay `mockAppointments` bằng API data
  - [ ] Nút "Book Now" → navigate đến form đặt lịch hoặc modal
  - [ ] Nút Cancel → gọi `PATCH /appointments/{id}/cancel`
  - [ ] Loading states, empty states, error handling
  - [ ] Pagination (API hỗ trợ paging)

### 10. Patient Payments (`PatientPayments.tsx`)
- **FE hiện tại**: 4 mock payments hardcode (`mockPayments`)
- **BE đã có**:
  - `GET /patient/payments` — Danh sách thanh toán
  - `GET /patient/payments/{id}` — Chi tiết thanh toán
  - `GET /patient/payments/{id}/qr` — QR code thanh toán
  - `GET /patient/invoices/by-payment/{id}` — Hóa đơn
  - `GET /patient/invoices/{id}/pdf` — Tải PDF hóa đơn
- **Cần làm FE**:
  - [ ] Tạo `usePatientPayments` hook gọi `GET /patient/payments`
  - [ ] Thay `mockPayments` bằng API data
  - [ ] Nút "Pay Now" → hiển thị QR code từ `GET /patient/payments/{id}/qr`
  - [ ] Nút "Download Receipt" → gọi `GET /patient/invoices/{id}/pdf`
  - [ ] Loading states, empty states
  - [ ] Filter theo status, date range

### 11. Patient Profile (`PatientProfile.tsx`)
- **FE hiện tại**: 1 mock profile hardcode (`mockProfiles`)
- **BE đã có**:
  - `GET /me/profile` — Lấy thông tin cá nhân
  - `PUT /me/profile` — Cập nhật thông tin
  - `POST /me/profile/avatar` — Upload avatar
- **Cần làm FE**:
  - [ ] Gọi `GET /me/profile` khi load trang
  - [ ] Thay `mockProfiles` bằng API data
  - [ ] Form edit → gọi `PUT /me/profile`
  - [ ] Upload avatar → gọi `POST /me/profile/avatar`
  - [ ] Validation, success/error toast

### 12. Appointment Form (`AppointmentPage.tsx`)
- **BE đã có**:
  - `GET /public/doctors` — Chọn bác sĩ
  - `GET /public/doctors/{id}/slots` — Lấy slot trống
  - `POST /patient/appointments` — Submit đặt lịch
- **Cần làm FE**:
  - [ ] Step 1: Chọn chuyên khoa → filter bác sĩ
  - [ ] Step 2: Chọn bác sĩ → load slots
  - [ ] Step 3: Chọn ngày/giờ → hiển thị slots trống
  - [ ] Step 4: Nhập thông tin + lý do khám
  - [ ] Submit → `POST /patient/appointments`
  - [ ] Redirect đến trang xác nhận/thanh toán

---

## 🔧 TASKS CHUNG CẦN LÀM

### Backend (BE)
| # | Task | Ưu tiên | File cần tạo/sửa |
|---|------|---------|-------------------|
| B1 | Tạo `GET /public/departments` hoặc mở rộng `/public/specialties` | Cao | `PublicController.java` |
| B2 | Tạo `GET /public/reviews` (approved reviews) | Cao | `PublicController.java` |
| B3 | Tạo `GET /public/contents?type=FAQ` | Trung bình | `PublicController.java` |
| B4 | Tạo `POST /public/contact` (public contact form) | Trung bình | `PublicController.java` / `ContactController.java` |
| B5 | Tạo Gallery entity + `GET /public/gallery` | Thấp | Entity + Controller mới |
| B6 | Tạo `GET /public/doctors/{id}/reviews` | Trung bình | `PublicController.java` |

### Frontend (FE)
| # | Task | Ưu tiên | File cần sửa |
|---|------|---------|--------------|
| F1 | Tạo `publicService.ts` / `landingService.ts` cho các API public | Cao | `services/` |
| F2 | Kết nối `PatientAppointments.tsx` với API thật | Cao | `pages/Landing/PatientAppointments.tsx` |
| F3 | Kết nối `PatientPayments.tsx` với API thật | Cao | `pages/Landing/PatientPayments.tsx` |
| F4 | Kết nối `PatientProfile.tsx` với API thật | Cao | `pages/Landing/PatientProfile.tsx` |
| F5 | Kết nối `HomePage.tsx → DoctorSection` với API thật | Cao | `pages/Landing/HomePage.tsx` |
| F6 | Kết nối `AppointmentPage.tsx` với booking flow | Cao | `pages/Landing/AppointmentPage.tsx` |
| F7 | Kết nối `DoctorsPage.tsx` với API thật | Trung bình | `pages/Landing/DoctorsPage.tsx` |
| F8 | Kết nối `TestimonialsPage.tsx` với API (sau khi B2) | Trung bình | `pages/Landing/TestimonialsPage.tsx` |
| F9 | Kết nối `FAQPage.tsx` với API (sau khi B3) | Trung bình | `pages/Landing/FAQPage.tsx` |
| F10 | Kết nối `ContactPage.tsx` form (sau khi B4) | Trung bình | `pages/Landing/ContactPage.tsx` |
| F11 | Kết nối `DepartmentsPage.tsx` (sau khi B1) | Trung bình | `pages/Landing/DepartmentsPage.tsx` |
| F12 | Tạo `GalleryPage.tsx` động (sau khi B5) | Thấp | `pages/Landing/GalleryPage.tsx` |

---

## 🎯 Thứ Tự Thực Hiện Đề Xuất

### Phase 1 — Patient Portal (API đã có sẵn, chỉ cần FE)
1. **F1**: Tạo `publicService.ts` gọi các API public
2. **F2**: `PatientAppointments.tsx` → API thật
3. **F3**: `PatientPayments.tsx` → API thật  
4. **F4**: `PatientProfile.tsx` → API thật
5. **F5**: `HomePage.tsx → DoctorSection` → API thật
6. **F6**: `AppointmentPage.tsx` → booking flow hoàn chỉnh

### Phase 2 — Public Pages (Cần BE + FE)
7. **B1** + **F11**: Departments API + Page
8. **B2** + **F8**: Reviews public API + Testimonials page
9. **F7**: Doctors page kết nối API
10. **B3** + **F9**: FAQ public API + Page

### Phase 3 — Bổ Sung
11. **B4** + **F10**: Contact form API + kết nối
12. **B5** + **F12**: Gallery entity + page
13. **B6**: Doctor reviews public API

---

## 📝 Ghi Chú Kỹ Thuật

- **Auth**: Tất cả trang `/patient/*` cần JWT token. FE đã có interceptor tự đính token (`api.ts`)
- **Refresh Token**: Đã implement trong `api.ts` — tự động refresh khi 401
- **Base URL**: `VITE_API_BASE_URL` hoặc mặc định `http://localhost:8080/api`
- **Security**: BE sử dụng Spring Security, `/public/**` → permitAll, `/patient/**` → hasRole("PATIENT")
- **Lưu ý**: Một số controller dùng path `/api/public/*` (DoctorController, SpecialtyController) — đây là duplicate của PublicController, có thể không thực sự public do security config chỉ permit `/public/**`
