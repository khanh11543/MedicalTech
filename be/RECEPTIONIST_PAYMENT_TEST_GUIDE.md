# 💰 Hướng Dẫn Test Chức Năng Thanh Toán - Role Receptionist

## 📌 Tóm Tắt
Test các API thanh toán dành cho **Receptionist/Cashier** - quản lý thanh toán của bệnh nhân qua phòng khám.

**Base URL:** `http://localhost:8080/api/receptionist/payments`

**Required Header:**
```
Authorization: Bearer <receptionist_token>
Content-Type: application/json
```

---

## 🔑 Authentication
Trước khi test, cần có token cho user có role **RECEPTIONIST** hoặc **ADMIN**.

Ví dụ login:
```bash
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "receptionist@meditech.com",
  "password": "password123"
}
```

---

## 📋 API List & Test Cases

### 1️⃣ **CREATE PAYMENT REQUEST**
#### Tạo yêu cầu thanh toán mới

```
POST /api/receptionist/payments
```

**Mô tả:** Tạo đơn yêu cầu thanh toán cho một cuộc hẹn khám

**Status Code:** `201 Created`

#### Request Body:
```json
{
  "appointmentId": 1,
  "paymentMethod": "CASH",
  "discountAmount": 0,
  "taxAmount": 10000,
  "notes": "Patient paid full fee"
}
```

**Giải thích fields:**
| Field | Type | Bắt buộc | Giá trị | Mô tả |
|-------|------|---------|--------|-------|
| appointmentId | Long | ✅ Yes | 1, 2, 3... | ID của lịch khám |
| paymentMethod | String | ✅ Yes | CASH, MOMO | Phương thức thanh toán |
| discountAmount | BigDecimal | ❌ No | 0 - totalAmount | Số tiền giảm giá |
| taxAmount | BigDecimal | ❌ No | 0+ | Thuế hoặc phí thêm |
| notes | String | ❌ No | Text | Ghi chú thêm |

#### Ví dụ Response:
```json
{
  "id": 1,
  "paymentCode": "PAY-20260203-00001",
  "appointmentId": 1,
  "appointmentCode": "APT-20260203-001",
  "patientId": 5,
  "patientName": "Nguyễn Văn A",
  "amount": 500000,
  "discountAmount": 0,
  "taxAmount": 10000,
  "totalAmount": 510000,
  "currency": "VND",
  "paymentMethod": "CASH",
  "paymentStatus": "PENDING",
  "processedBy": 2,
  "processedByName": "Lễ Tân 1",
  "notes": "Patient paid full fee",
  "createdAt": "2026-02-03 10:30:45",
  "updatedAt": "2026-02-03 10:30:45"
}
```

---

### 2️⃣ **INITIALIZE MOMO PAYMENT**
#### Khởi tạo thanh toán MoMo (tạo QR Code)

```
POST /api/receptionist/payments/{id}/momo/init
```

**Mô tả:** Khởi tạo thanh toán MoMo, lấy QR Code và Payment URL

**Status Code:** `200 OK`

**Path Parameter:**
- `id` (Long): ID của payment từ API #1

#### Request Body (Optional):
```json
{
  "orderInfo": "Thanh toán khám phòng khám MedicalTech",
  "redirectUrl": "https://meditech.local/payment/success",
  "ipnUrl": "https://meditech.local/api/webhook/momo"
}
```

**Hoặc gửi body rỗng:**
```json
{}
```

#### Ví dụ Response:
```json
{
  "paymentId": 1,
  "paymentCode": "PAY-20260203-00001",
  "payUrl": "https://payment.momo.vn/web/index.html?token=<token>",
  "qrCodeUrl": "https://qr.momo.vn/<qr_id>.jpg",
  "orderId": "MOMO-20260203-001",
  "message": "MoMo payment initialized successfully",
  "success": true
}
```

---

### 3️⃣ **GET PAYMENT QR CODE**
#### Lấy thông tin QR Code

```
GET /api/receptionist/payments/{id}/qr
```

**Mô tả:** Lấy thông tin QR Code để hiển thị cho khách hàng

**Status Code:** `200 OK`

**Path Parameter:**
- `id` (Long): ID của payment

#### Response:
```json
{
  "id": 1,
  "paymentId": 1,
  "provider": "MOMO",
  "qrPayload": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyAAAAMgCAIAAAB...",
  "expiresAt": "2026-02-03 11:00:45",
  "status": "ACTIVE",
  "createdAt": "2026-02-03 10:30:45"
}
```

---

### 4️⃣ **REFRESH QR CODE**
#### Làm mới QR Code khi hết hạn

```
POST /api/receptionist/payments/{id}/qr/refresh
```

**Mô tả:** Tạo lại QR Code mới nếu cái cũ đã hết hạn

**Status Code:** `200 OK`

**Path Parameter:**
- `id` (Long): ID của payment

#### Request Body:
```
(không cần body)
```

#### Response:
```json
{
  "paymentId": 1,
  "paymentCode": "PAY-20260203-00001",
  "payUrl": "https://payment.momo.vn/web/index.html?token=<new_token>",
  "qrCodeUrl": "https://qr.momo.vn/<new_qr_id>.jpg",
  "orderId": "MOMO-20260203-001",
  "message": "QR code refreshed successfully",
  "success": true
}
```

---

### 5️⃣ **MARK PAYMENT AS PAID (CASH)**
#### Xác nhận thanh toán tiền mặt

```
PATCH /api/receptionist/payments/{id}/mark-cash
```

**Mô tả:** Xác nhận rằng bệnh nhân đã thanh toán bằng tiền mặt

**Status Code:** `200 OK`

**Path Parameter:**
- `id` (Long): ID của payment

#### Request Body:
```json
{
  "notes": "Customer paid 510000 VND in cash",
  "transactionId": "CASH-20260203-001"
}
```

**Hoặc body tối giản:**
```json
{
  "notes": "Thanh toán tiền mặt"
}
```

#### Response:
```json
{
  "id": 1,
  "paymentCode": "PAY-20260203-00001",
  "appointmentId": 1,
  "appointmentCode": "APT-20260203-001",
  "patientId": 5,
  "patientName": "Nguyễn Văn A",
  "amount": 500000,
  "discountAmount": 0,
  "taxAmount": 10000,
  "totalAmount": 510000,
  "currency": "VND",
  "paymentMethod": "CASH",
  "paymentStatus": "PAID",
  "transactionId": "CASH-20260203-001",
  "paidAt": "2026-02-03 10:35:20",
  "processedBy": 2,
  "processedByName": "Lễ Tân 1",
  "notes": "Customer paid 510000 VND in cash",
  "createdAt": "2026-02-03 10:30:45",
  "updatedAt": "2026-02-03 10:35:20"
}
```

---

### 6️⃣ **CANCEL PAYMENT REQUEST**
#### Hủy yêu cầu thanh toán

```
PATCH /api/receptionist/payments/{id}/cancel
```

**Mô tả:** Hủy một yêu cầu thanh toán (chỉ hủy khi trạng thái là PENDING, INITIATED, PROCESSING)

**Status Code:** `200 OK`

**Path Parameter:**
- `id` (Long): ID của payment

#### Request Body:
```json
{
  "reason": "Customer changed appointment date"
}
```

**Lưu ý:** `reason` là **bắt buộc**

#### Response:
```json
{
  "id": 1,
  "paymentCode": "PAY-20260203-00001",
  "appointmentId": 1,
  "appointmentCode": "APT-20260203-001",
  "patientId": 5,
  "patientName": "Nguyễn Văn A",
  "amount": 500000,
  "discountAmount": 0,
  "taxAmount": 10000,
  "totalAmount": 510000,
  "currency": "VND",
  "paymentMethod": "MOMO",
  "paymentStatus": "CANCELLED",
  "processedBy": 2,
  "processedByName": "Lễ Tân 1",
  "notes": "Customer changed appointment date",
  "createdAt": "2026-02-03 10:30:45",
  "updatedAt": "2026-02-03 10:40:00"
}
```

---

### 7️⃣ **GET PAYMENT DETAILS**
#### Lấy thông tin chi tiết thanh toán

```
GET /api/receptionist/payments/{id}
```

**Mô tả:** Lấy chi tiết thông tin của một khoản thanh toán

**Status Code:** `200 OK`

**Path Parameter:**
- `id` (Long): ID của payment

#### Response:
```json
{
  "id": 1,
  "paymentCode": "PAY-20260203-00001",
  "appointmentId": 1,
  "appointmentCode": "APT-20260203-001",
  "patientId": 5,
  "patientName": "Nguyễn Văn A",
  "amount": 500000,
  "discountAmount": 0,
  "taxAmount": 10000,
  "totalAmount": 510000,
  "currency": "VND",
  "paymentMethod": "CASH",
  "paymentStatus": "PAID",
  "transactionId": "CASH-20260203-001",
  "paidAt": "2026-02-03 10:35:20",
  "processedBy": 2,
  "processedByName": "Lễ Tân 1",
  "notes": "Customer paid full fee",
  "createdAt": "2026-02-03 10:30:45",
  "updatedAt": "2026-02-03 10:35:20"
}
```

---

## 🧪 Complete Test Workflow (Tiền Mặt)

### Scenario: Receptionist tạo và xác nhận thanh toán tiền mặt

**Step 1:** Create Payment Request
```bash
curl -X POST http://localhost:8080/api/receptionist/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 1,
    "paymentMethod": "CASH",
    "discountAmount": 0,
    "taxAmount": 10000,
    "notes": "Payment for appointment on 2026-02-03"
  }'
```

**Step 2:** Mark as Paid (Cash)
```bash
curl -X PATCH http://localhost:8080/api/receptionist/payments/1/mark-cash \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Customer paid 510000 VND",
    "transactionId": "CASH-20260203-001"
  }'
```

**Step 3:** Get Payment Details
```bash
curl -X GET http://localhost:8080/api/receptionist/payments/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 Complete Test Workflow (MoMo)

### Scenario: Receptionist tạo và khởi tạo thanh toán MoMo

**Step 1:** Create Payment Request
```bash
curl -X POST http://localhost:8080/api/receptionist/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 2,
    "paymentMethod": "MOMO",
    "discountAmount": 50000,
    "taxAmount": 15000,
    "notes": "MoMo payment"
  }'
```

**Step 2:** Initialize MoMo Payment
```bash
curl -X POST http://localhost:8080/api/receptionist/payments/2/momo/init \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderInfo": "Thanh toán khám phòng khám MedicalTech"
  }'
```

**Step 3:** Get QR Code
```bash
curl -X GET http://localhost:8080/api/receptionist/payments/2/qr \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Step 4:** Refresh QR Code (if expired)
```bash
curl -X POST http://localhost:8080/api/receptionist/payments/2/qr/refresh \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Step 5:** Cancel if needed
```bash
curl -X PATCH http://localhost:8080/api/receptionist/payments/2/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Customer requested to cancel"
  }'
```

---

## ⚙️ PostMan Setup

### 1. Create Environment Variable
```
{
  "baseUrl": "http://localhost:8080",
  "token": "YOUR_BEARER_TOKEN"
}
```

### 2. Create Collection Requests

**Request 1: Create Payment**
```
POST {{baseUrl}}/api/receptionist/payments
Authorization: Bearer {{token}}
```

**Request 2: Init MoMo**
```
POST {{baseUrl}}/api/receptionist/payments/{{paymentId}}/momo/init
Authorization: Bearer {{token}}
```

**Request 3: Get QR**
```
GET {{baseUrl}}/api/receptionist/payments/{{paymentId}}/qr
Authorization: Bearer {{token}}
```

**Request 4: Mark Cash**
```
PATCH {{baseUrl}}/api/receptionist/payments/{{paymentId}}/mark-cash
Authorization: Bearer {{token}}
```

**Request 5: Cancel Payment**
```
PATCH {{baseUrl}}/api/receptionist/payments/{{paymentId}}/cancel
Authorization: Bearer {{token}}
```

**Request 6: Get Details**
```
GET {{baseUrl}}/api/receptionist/payments/{{paymentId}}
Authorization: Bearer {{token}}
```

---

## 🔐 Payment Status Flow

```
PENDING 
  ├─ INITIATED (for MOMO payments)
  │   ├─ PROCESSING (payment in process)
  │   └─ PAID ✅
  ├─ PAID ✅ (for CASH)
  ├─ FAILED ❌
  ├─ CANCELLED ❌
  ├─ REFUNDED (returned)
  └─ EXPIRED (QR code expired)
```

---

## 📊 Data Examples

### Example 1: Cash Payment
```json
{
  "appointmentId": 1,
  "paymentMethod": "CASH",
  "discountAmount": 0,
  "taxAmount": 0,
  "notes": "Full payment in cash"
}
```

### Example 2: MoMo Payment with Discount
```json
{
  "appointmentId": 2,
  "paymentMethod": "MOMO",
  "discountAmount": 100000,
  "taxAmount": 20000,
  "notes": "MoMo payment with 20% discount"
}
```

### Example 3: MoMo Init with Custom URLs
```json
{
  "orderInfo": "Thanh toán khám phòng khám - Khách hàng VIP",
  "redirectUrl": "https://meditech.local/payment/success?ref=APT-123",
  "ipnUrl": "https://meditech.local/api/webhook/momo/ipn"
}
```

---

## ✅ Success Criteria

- ✅ Tạo được payment request
- ✅ Khởi tạo MoMo payment và nhận được QR Code
- ✅ Lấy được thông tin QR
- ✅ Làm mới QR Code
- ✅ Xác nhận thanh toán tiền mặt
- ✅ Hủy yêu cầu thanh toán
- ✅ Lấy được chi tiết thanh toán

---

## 🐛 Common Error Codes

| Code | Message | Giải pháp |
|------|---------|----------|
| 400 | Appointment ID is required | Kiểm tra appointmentId |
| 400 | Payment method must be CASH or MOMO | Chỉ dùng CASH hoặc MOMO |
| 409 | Payment already exists | Appointment đã có payment |
| 404 | Appointment not found | Appointment ID không tồn tại |
| 403 | Unauthorized | Token không hợp lệ |
| 400 | Cannot cancel PAID payment | Không hủy được khi đã thanh toán |

---

**Last Updated:** 2026-02-03
