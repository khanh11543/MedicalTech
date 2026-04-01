# Admin Functions (MedicalTech) — “Có để làm gì?”

Tài liệu này mô tả **toàn bộ chức năng Admin** theo các API backend hiện có (nhóm `Admin*Controller`).

- **Đối tượng**: ADMIN (một vài module cho phép thêm RECEPTIONIST).
- **Base path thực tế**: đa số endpoint trong code là `/admin/...` và hệ thống thường chạy với context `/api` ⇒ ví dụ: `GET /api/admin/users`.

---

## Dashboard (Tổng quan hệ thống)

### Dùng để làm gì?
- **Nhìn nhanh sức khoẻ hệ thống**: số lượng user theo role, trạng thái active/inactive.
- **Theo dõi tình trạng duyệt hồ sơ bác sĩ**: lượng giấy tờ đang chờ duyệt / đã duyệt / bị từ chối.
- **Theo dõi vận hành lịch hẹn**: tổng lịch hẹn, lịch hẹn hôm nay, số pending/completed/cancelled.
- **Theo dõi tuyển/đăng ký nhân sự nội bộ (whitelist)**: invite pending và số đã đăng ký.
- **Xem hoạt động gần đây**: 5 user mới nhất và 5 lịch hẹn gần nhất.

### API
- `GET /api/admin/dashboard/statistics`

---

## Quản lý người dùng & phân quyền (User Management)

### Dùng để làm gì?
- **Quản trị tài khoản**: tạo user mới (nội bộ hoặc hỗ trợ vận hành), cập nhật thông tin, bật/tắt tài khoản.
- **Phân quyền**: gán role (ADMIN/DOCTOR/PATIENT/RECEPTIONIST), thay thế toàn bộ roles hiện có.
- **Hỗ trợ đăng nhập**: reset mật khẩu (gửi mật khẩu mới qua email) hoặc admin đặt mật khẩu mới trực tiếp.
- **Tra cứu**: tìm user theo email/phone, lọc theo role, theo trạng thái active, phân trang/sắp xếp.

### API chính
- `GET /api/admin/users/roles`
- `GET /api/admin/users`
- `GET /api/admin/users/{userId}`
- `POST /api/admin/users`
- `PUT /api/admin/users/{userId}`
- `PATCH /api/admin/users/{userId}/status`
- `PUT /api/admin/users/{userId}/roles`
- `POST /api/admin/users/{userId}/reset-password`
- `PUT /api/admin/users/{userId}/change-password`

---

## Quản lý bệnh nhân (Patient Management)

### Dùng để làm gì?
- **Tra cứu & quản trị hồ sơ bệnh nhân**: xem danh sách, xem chi tiết, cập nhật thông tin liên hệ/hồ sơ y tế cơ bản.
- **Vận hành**: bật/tắt tài khoản bệnh nhân khi có vi phạm/nhầm lẫn.
- **Đồng bộ dữ liệu**: tạo `Patient profile` còn thiếu (tránh lỗi do user có role PATIENT nhưng chưa có bản ghi Patient).

### API
- `GET /api/admin/patients`
- `GET /api/admin/patients/{id}`
- `PUT /api/admin/patients/{id}`
- `PATCH /api/admin/patients/{id}/status`
- `POST /api/admin/patients/sync`

---

## Quản lý bác sĩ (Doctor Management)

### Dùng để làm gì?
- **Danh sách bác sĩ** cho dropdown/filter khi quản trị lịch hẹn, time-slot, phòng khám…
- **Gán chuyên khoa cho bác sĩ** để phục vụ tìm kiếm/đặt lịch đúng chuyên khoa và hiển thị hồ sơ.

### API
- `GET /api/admin/doctors/list`
- `PUT /api/admin/doctors/{doctorId}/specialties`

---

## Duyệt xác minh bác sĩ (Doctor Verification)

### Dùng để làm gì?
- **Kiểm duyệt hồ sơ bác sĩ** trước khi cho phép hoạt động (tránh bác sĩ giả mạo).
- **Xem chi tiết hồ sơ + giấy tờ** (license/ID/degree/experience…) để ra quyết định.
- **Ra quyết định vận hành**:
  - Duyệt (APPROVE) → bác sĩ VERIFIED/available.
  - Từ chối (REJECT) → ghi lý do.
  - Yêu cầu bổ sung (REQUEST_MORE_DOCUMENTS) → chuyển trạng thái AWAITING_DOCUMENTS.
  - Tạm dừng/Khôi phục (SUSPEND/UNSUSPEND) hoặc Thu hồi (REVOKE).

### API
- `GET /api/admin/verifications` (lọc theo status + phân trang)
- `GET /api/admin/verifications/pending` (danh sách nhanh PENDING)
- `GET /api/admin/verifications/{doctorId}` (chi tiết + documents)
- `POST /api/admin/verifications/{doctorId}/decision`

---

## Quản lý lịch hẹn (Admin Appointment Operations)

### Dùng để làm gì?
- **Xem toàn bộ lịch hẹn** toàn hệ thống (lọc theo doctor/patient/status/date/search/payment…).
- **Xử lý sự cố vận hành**:
  - Dời lịch (reschedule) khi bệnh nhân/bác sĩ yêu cầu hoặc có sự cố.
  - Huỷ lịch (cancel) theo chính sách.
  - Đánh dấu no-show.
  - Bắt đầu/hoàn tất buổi khám khi cần “admin override”.
- **Giao tiếp**:
  - Gửi nhắc lịch hàng loạt.
  - Xem communication logs và gửi tin nhắn tuỳ chỉnh cho bệnh nhân.
- **Báo cáo/Export**:
  - Xuất danh sách lịch hẹn (CSV/Excel/PDF tuỳ format).
  - Xuất lịch sử 1 lịch hẹn ra PDF.
  - Xem thống kê/analytics (summary, over-time, by-status, by-doctor, heatmap giờ cao điểm, no-show, cancellation, wait-time…).

### API
- `GET /api/admin/appointments`
- `GET /api/admin/appointments/{id}`
- `GET /api/admin/appointments/{id}/detail`
- `GET /api/admin/appointments/{id}/history`
- `GET /api/admin/appointments/{id}/history/export`
- `PUT /api/admin/appointments/{id}/reschedule`
- `PUT /api/admin/appointments/{id}/cancel`
- `PATCH /api/admin/appointments/{id}/mark-no-show`
- `PATCH /api/admin/appointments/{id}/start`
- `PATCH /api/admin/appointments/{id}/complete`
- `POST /api/admin/appointments/bulk/reminders`
- `POST /api/admin/appointments/bulk/cancel`
- `GET /api/admin/appointments/export`
- `GET /api/admin/appointments/stats`
- `GET /api/admin/appointments/statistics/*` (nhóm analytics)
- `GET /api/admin/appointments/{id}/communications`
- `POST /api/admin/appointments/{id}/send-message`
- `GET /api/admin/appointments/{id}/related`

---

## Quản lý Time Slot (Slot/Calendar/Template/Holiday/Working Hours)

### Dùng để làm gì?
- **Quản trị nguồn cung lịch khám** (slot) để đảm bảo bệnh nhân đặt lịch được đúng quy tắc.
- **CRUD slot**: tạo/cập nhật/xoá slot, xem chi tiết.
- **Block/Unblock**: chặn slot khi có sự cố (bác sĩ bận, phòng đóng…) và mở lại khi ổn định.
- **Tạo slot hàng loạt**:
  - Preview để thấy xung đột/skip ngày nghỉ.
  - Bulk create để tạo nhanh theo dải ngày.
  - Rollback theo batchId nếu tạo nhầm.
- **Template slot**: tạo template và áp dụng cho nhiều bác sĩ, có preview trước khi apply.
- **Calendar view & KPI**: xem tổng slot theo ngày/trạng thái, thống kê KPI theo ngày/bác sĩ.
- **Ngày nghỉ & giờ làm việc phòng khám**: CRUD holiday, CRUD working hours theo thứ.

### API
- `GET /api/admin/time-slots` ; `GET /api/admin/time-slots/{id}`
- `POST /api/admin/time-slots` ; `PUT /api/admin/time-slots/{id}` ; `DELETE /api/admin/time-slots/{id}`
- `POST /api/admin/time-slots/{id}/block` ; `POST /api/admin/time-slots/{id}/unblock`
- `POST /api/admin/time-slots/bulk-block` ; `POST /api/admin/time-slots/bulk-unblock`
- `POST /api/admin/time-slots/bulk-create/preview` ; `POST /api/admin/time-slots/bulk-create`
- `DELETE /api/admin/time-slots/bulk-create/rollback/{batchId}`
- `GET /api/admin/time-slots/templates` ; `GET /api/admin/time-slots/templates/{id}`
- `POST /api/admin/time-slots/templates` ; `PUT /api/admin/time-slots/templates/{id}` ; `DELETE /api/admin/time-slots/templates/{id}`
- `POST /api/admin/time-slots/templates/{id}/apply/preview` ; `POST /api/admin/time-slots/templates/{id}/apply`
- `GET /api/admin/time-slots/calendar`
- `GET /api/admin/time-slots/statistics`
- `GET /api/admin/time-slots/holidays` ; `POST /api/admin/time-slots/holidays` ; `PUT /api/admin/time-slots/holidays/{id}` ; `DELETE /api/admin/time-slots/holidays/{id}`
- `GET /api/admin/time-slots/working-hours` ; `POST /api/admin/time-slots/working-hours` ; `DELETE /api/admin/time-slots/working-hours/{id}`

---

## Quản lý phòng khám / phòng khám bệnh (Room Management)

### Dùng để làm gì?
- **Quản lý phòng** (số phòng/tên/tầng/active).
- **Gán bác sĩ vào phòng** (hoặc bỏ gán) để phục vụ điều phối vận hành và hiển thị “current room”.

### API
- `GET /api/admin/rooms`
- `POST /api/admin/rooms`
- `PUT /api/admin/rooms/{roomId}`
- `PUT /api/admin/rooms/{roomId}/assign?doctorId=...` (bỏ gán nếu không truyền `doctorId`)
- `DELETE /api/admin/rooms/{roomId}`

---

## Quản lý thanh toán + hoá đơn (Payments & Invoices)

### Dùng để làm gì?
- **Theo dõi và xử lý giao dịch**: xem tất cả thanh toán, lọc theo trạng thái/phương thức/số tiền/khoảng ngày/bác sĩ/bệnh nhân.
- **Vận hành tại quầy (cash/bank transfer)**:
  - Đánh dấu đã thanh toán (mark-paid) theo từng giao dịch hoặc hàng loạt.
  - Retry thanh toán: gửi lại link thanh toán cho bệnh nhân.
  - Gửi biên nhận qua email, hoặc tải biên nhận PDF.
- **Refund & huỷ**:
  - Hoàn tiền theo giao dịch (refund).
  - Huỷ thanh toán (admin override).
- **Đối soát & job**:
  - Expire các thanh toán pending cũ.
  - Reconcile trạng thái MoMo.
- **Báo cáo**:
  - Thống kê thanh toán cho dashboard.
  - Export giao dịch ra file.
- **Hoá đơn**:
  - Lấy invoice theo payment.
  - Cập nhật thông tin invoice.

### Quyền
- Module này cho phép: **ADMIN hoặc RECEPTIONIST**.

### API
- `GET /api/admin/payments`
- `GET /api/admin/payments/{id}`
- `GET /api/admin/payments/statistics`
- `POST /api/admin/payments/bulk/mark-paid`
- `GET /api/admin/payments/export`
- `POST /api/admin/payments/{id}/mark-paid`
- `POST /api/admin/payments/{id}/retry`
- `POST /api/admin/payments/{id}/send-receipt`
- `GET /api/admin/payments/{id}/receipt`
- `GET /api/admin/payments/{id}/history`
- `POST /api/admin/payments/{id}/refund`
- `PATCH /api/admin/payments/{id}/cancel`
- `POST /api/admin/payments/expire`
- `POST /api/admin/payments/{id}/reconcile/momo`
- `GET /api/admin/payments/invoices/by-payment/{paymentId}`
- `PATCH /api/admin/payments/invoices/{invoiceId}`

---

## Quản lý hoàn tiền (Refund Management — workflow)

### Dùng để làm gì?
- Quản lý **quy trình hoàn tiền có kiểm soát**:
  - Tạo yêu cầu hoàn tiền (admin initiated).
  - Duyệt yêu cầu (segregation of duties: người duyệt không phải người tạo).
  - Xử lý hoàn tiền (manual cash hoặc gateway).
  - Từ chối / Retry giao dịch hoàn tiền thất bại.
- Theo dõi **thống kê** và **chi tiết** hoàn tiền (timeline).

### API
- `GET /api/admin/refunds`
- `GET /api/admin/refunds/statistics`
- `GET /api/admin/refunds/{id}`
- `POST /api/admin/refunds?paymentId=...`
- `PATCH /api/admin/refunds/{id}/approve`
- `PATCH /api/admin/refunds/{id}/process`
- `PATCH /api/admin/refunds/{id}/reject`
- `PATCH /api/admin/refunds/{id}/retry`

---

## Quản lý thông báo hệ thống (Admin Notifications)

### Dùng để làm gì?
- **Giám sát thông báo**: xem tất cả notification, lọc theo user/type/read, thống kê.
- **Gửi thông báo**:
  - Gửi cho user cụ thể.
  - Broadcast toàn hệ thống hoặc theo role.
- **Xoá thông báo** khi cần dọn dữ liệu/ẩn nội dung sai.

### API
- `GET /api/admin/notifications`
- `GET /api/admin/notifications/stats`
- `POST /api/admin/notifications`
- `POST /api/admin/notifications/broadcast?role=...`
- `DELETE /api/admin/notifications/{id}`

---

## Cấu hình hệ thống (System Settings)

### Dùng để làm gì?
- **General settings**: thông tin phòng khám, liên hệ, giờ làm việc, cấu hình vùng/miền.
- **Appointment settings**: quy tắc đặt lịch, huỷ/đổi lịch, nhắc lịch.
- **Payment settings**: phương thức thanh toán, gateway config, pricing, invoice settings; test kết nối gateway.
- **Notification settings**: cấu hình email/SMS/push; test kết nối email/SMS.
- **Security settings**: password policy, session, 2FA, lockout, rate limiting.

### API
- `GET/PUT /api/admin/settings/general`
- `GET/PUT /api/admin/settings/appointment`
- `GET/PUT /api/admin/settings/payment`
- `POST /api/admin/settings/payment/test-gateway?gatewayName=...`
- `GET/PUT /api/admin/settings/notification`
- `POST /api/admin/settings/notification/test-email`
- `POST /api/admin/settings/notification/test-sms`
- `GET/PUT /api/admin/settings/security`

---

## Bảo mật — Session Management & Login Attempts

### Dùng để làm gì?
- **Theo dõi phiên đăng nhập** (user/IP/device/browser, thời gian, trạng thái).
- **Force logout**: thu hồi phiên khi nghi ngờ bị lộ tài khoản hoặc vi phạm.
- **Thống kê phiên hoạt động** cho quản trị an ninh.
- **Theo dõi đăng nhập thất bại** để phát hiện brute-force/credential stuffing.

### API
- `GET /api/admin/security/sessions`
- `GET /api/admin/security/sessions/{id}`
- `POST /api/admin/security/sessions/force-logout`
- `GET /api/admin/security/sessions/stats`
- `GET /api/admin/security/sessions/login-attempts`
- `GET /api/admin/security/sessions/login-attempts/stats`

---

## Bảo mật — IP Management (Blocklist & Rules)

### Dùng để làm gì?
- **Block IP** thủ công khi thấy tấn công, spam, hoặc vi phạm.
- **Unblock** khi xác minh nhầm.
- **IP Rules**: tạo rule allow/block theo policy.
- **Check** nhanh một IP có đang bị chặn không + thống kê.

### API
- `GET /api/admin/security/ip/blocked`
- `GET /api/admin/security/ip/blocked/{id}`
- `POST /api/admin/security/ip/blocked`
- `PATCH /api/admin/security/ip/blocked/{id}/unblock`
- `GET /api/admin/security/ip/check?ipAddress=...`
- `GET /api/admin/security/ip/rules`
- `GET /api/admin/security/ip/rules/{id}`
- `POST /api/admin/security/ip/rules`
- `PUT /api/admin/security/ip/rules/{id}`
- `DELETE /api/admin/security/ip/rules/{id}`
- `GET /api/admin/security/ip/stats`

---

## Bảo mật — Security Audit (Events & Audit logs)

### Dùng để làm gì?
- **Dashboard an ninh**: tổng hợp security events + audit logs + hoạt động user.
- **Tra cứu sự kiện bảo mật**: failed logins, lockouts, password changes…
- **Tra cứu audit logs** theo user hoặc theo entity (Appointment/Payment…) để truy vết “ai làm gì khi nào”.

### API
- `GET /api/admin/security-audit/dashboard`
- `GET /api/admin/security-audit/events`
- `GET /api/admin/security-audit/events/user/{userId}`
- `GET /api/admin/security-audit/audit-logs`
- `GET /api/admin/security-audit/audit-logs/user/{userId}`
- `GET /api/admin/security-audit/audit-logs/entity?entityType=...&entityId=...`

---

## Hỗ trợ người dùng (Support Tickets)

### Dùng để làm gì?
- **Tiếp nhận & xử lý khiếu nại/sự cố** từ người dùng (patient/doctor).
- **Quản trị vòng đời ticket**: lọc theo status/category/priority, trả lời, đóng ticket.
- **Theo dõi KPI hỗ trợ** bằng thống kê.

### API
- `GET /api/admin/support-tickets`
- `GET /api/admin/support-tickets/stats`
- `GET /api/admin/support-tickets/{id}`
- `PATCH /api/admin/support-tickets/{id}/respond`
- `PATCH /api/admin/support-tickets/{id}/close`

---

## Quản lý thuốc & tồn kho (Medication & Inventory)

### Dùng để làm gì?
- **Danh mục thuốc**: tạo/sửa/xem chi tiết, tìm kiếm theo tên/mã/generic name, bật/tắt thuốc.
- **Quản lý tồn kho**:
  - IMPORT: cộng thêm số lượng.
  - ADJUST: đặt lại số lượng theo kiểm kê.
- **Theo dõi lịch sử** biến động tồn kho theo từng thuốc.
- **Tổng quan tồn kho** (summary stats) để biết thuốc sắp hết/biến động.

### API
- `GET /api/admin/medications`
- `GET /api/admin/medications/{id}`
- `POST /api/admin/medications`
- `PUT /api/admin/medications/{id}`
- `PATCH /api/admin/medications/{id}/inventory`
- `PATCH /api/admin/medications/{id}/status`
- `GET /api/admin/medications/{id}/inventory/logs`
- `GET /api/admin/medications/inventory/summary`

---

## Audit tồn kho (Inventory Audit Logs)

### Dùng để làm gì?
- **Truy vết “ai thay đổi tồn kho, thay đổi gì, lúc nào”** (audit trail).
- Lọc theo medicationId/action/referenceType/userId/date range/search.
- Xem thống kê audit logs (phục vụ kiểm soát nội bộ).

### API
- `GET /api/admin/inventory-audit-logs`
- `GET /api/admin/inventory-audit-logs/{id}`
- `GET /api/admin/inventory-audit-logs/stats`

---

## Staff Registry (Whitelist mời nhân sự nội bộ)

### Dùng để làm gì?
- **Mời/whitelist** nhân sự nội bộ (ví dụ DOCTOR/RECEPTIONIST) theo email/phone để họ đăng ký đúng role.
- Quản trị danh sách whitelist (lọc theo status), disable/enable lời mời.

### API
- `POST /api/admin/staff-registry`
- `GET /api/admin/staff-registry`
- `GET /api/admin/staff-registry/{id}`
- `PATCH /api/admin/staff-registry/{id}/disable`
- `PATCH /api/admin/staff-registry/{id}/enable`

---

## Reports & Analytics (Báo cáo kinh doanh)

### Dùng để làm gì?
- **Báo cáo tổng hợp** theo khoảng thời gian (mặc định tháng hiện tại) cho dashboard/ban vận hành.
- Là nguồn dữ liệu cho biểu đồ & KPI cấp quản trị (khác với dashboard “quick stats”).

### API
- `GET /api/admin/reports-analytics?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd`
- `GET /api/admin/reports-analytics/dashboard` (alias)

---

## Revenue Analytics (Doanh thu)

### Dùng để làm gì?
- Xem doanh thu tổng hợp theo khoảng thời gian, có thể so sánh kỳ trước.
- Phân rã doanh thu theo bác sĩ / phương thức thanh toán / loại lịch hẹn.
- Lấy dữ liệu time-series để vẽ chart.
- Export báo cáo doanh thu.
- Drill-down ra danh sách giao dịch theo bộ lọc.
- Phân tích tác động hoàn tiền (refund analysis).

### API
- `GET /api/admin/revenue/summary`
- `GET /api/admin/revenue/by-doctor`
- `GET /api/admin/revenue/by-method`
- `GET /api/admin/revenue/by-appointment-type`
- `GET /api/admin/revenue/chart`
- `GET /api/admin/revenue/export`
- `GET /api/admin/revenue/drill-down`
- `GET /api/admin/revenue/refund-analysis`
- `GET/POST/DELETE /api/admin/revenue/scheduled-reports*` (stub/coming soon)

---

## Ghi chú phạm vi

- Đây là **chức năng theo API backend hiện có**. Nếu bạn muốn mình “đầy đủ” theo cả UI Admin Panel ở frontend, mình có thể quét thêm `fe/` để map từng màn hình ↔ endpoint ↔ field hiển thị.
