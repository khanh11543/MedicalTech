# ❓ QR Code Payment Flow - Giải Thích Chi Tiết

**Câu hỏi**: Khi quét mã QR thanh toán, nó có tự động lấy đúng số tiền từ hóa đơn hay phải quét rồi nhập bằng tay?

---

## 📊 Hiện Tại: Mock QR (Chỉ chứa Order ID)

### Cách Hoạt Động Hiện Tại

```
1. Tạo Payment
   ├─ amount: 500.000 VND
   ├─ paymentCode: PAY-20260203-12345
   └─ totalAmount: 500.000 VND

2. Khởi tạo MoMo
   ├─ Tạo orderId (dùng paymentCode)
   └─ QR được tạo chỉ chứa: orderId

3. QR Code hiện tại:
   data: "PAY-20260203-12345"
   👆 Chỉ chứa ORDER ID, KHÔNG chứa số tiền
```

### Mã Hiện Tại (PaymentServiceImpl.java, line 386)

```java
private String generateMockQrCode(String orderId) {
    // Mock QR code URL
    // ❌ Chỉ chứa orderId, KHÔNG có amount
    return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + orderId;
}
```

### Kết Quả

```
❌ QR Hiện Tại:
   - Khi quét QR: Người dùng chỉ thấy "PAY-20260203-12345"
   - Phải nhập bằng tay: số tiền 500.000 VND
   - Rủi ro: Nhập sai số tiền, quét sai QR...

✅ QR Lý Tưởng:
   - Khi quét QR: MoMo app tự hiển thị số tiền
   - Không cần nhập: Người dùng chỉ bấm "Xác nhận"
   - An toàn: Không thể nhập sai số tiền
```

---

## 🔧 Cách Sửa: QR Code Tiêu Chuẩn MoMo

### Tiêu Chuẩn QR Code MoMo

MoMo hỗ trợ hai loại QR:

#### **1. Loại 1: EMV QR (Tốt nhất - tự động)** ✅
```
Format: "00020101021226370010A000000727..."
Chứa:
  - Merchant ID
  - Amount (Số tiền)
  - Transaction Info
  - Checksum

Khi quét: MoMo app tự hiển thị số tiền → Người dùng chỉ bấm OK
```

#### **2. Loại 2: Deep Link (Hiện tại) ❌
```
Format: "https://...?amount=500000"
Vấn đề:
  - Phải bảo hành link hoạt động
  - Có thể bị block bởi network
  - Phải mở app rồi nhập lại
```

---

## 💡 Giải Pháp Khuyến Nghị

### Option 1: Dùng EMV QR Standard (⭐ Recommended)

```java
private String generateEMVQrCode(String merchantId, Long amount, String transactionInfo) {
    // Format QR theo tiêu chuẩn EMV QRCS
    StringBuilder qrData = new StringBuilder();
    
    // Payload Format Indicator (00)
    qrData.append("00020101");
    
    // Point of Initiation Method (01)
    qrData.append("01111301");
    
    // Merchant Account Information (26)
    String merchantInfo = buildMerchantInfo(merchantId, transactionInfo);
    qrData.append("26").append(String.format("%02d", merchantInfo.length()))
          .append(merchantInfo);
    
    // Transaction Amount (54)
    String amountStr = amount.toString();
    qrData.append("5406").append(String.format("%013d", amount));
    
    // Country Code (58)
    qrData.append("5802VN");
    
    // CRC-16 (63)
    String crc = calculateCRC16(qrData.toString());
    qrData.append("63").append(crc);
    
    return qrData.toString();
}

// Khi quét: MoMo app sẽ tự hiển thị số tiền 💰
```

### Option 2: Deep Link + Số Tiền (Hiện Tại - Cải Tiến)

```java
private String generateMomoDeepLink(String paymentCode, Long amount) {
    // Thêm amount vào link
    return "momo://payment?amount=" + amount 
         + "&orderId=" + paymentCode 
         + "&description=Payment for appointment";
    
    // Khi quét: MoMo app mở ra với số tiền đã điền ✅
}
```

### Option 3: Combo: Cùng lúc EMV + Deep Link

```java
private QRCodeResponse generateSmartQrCode(Payment payment) {
    String emvQr = generateEMVQrCode(...);      // Chứa toàn bộ thông tin
    String deepLink = generateMomoDeepLink(...); // Backup cho app
    
    return QRCodeResponse.builder()
        .emvQrCode(emvQr)
        .deepLink(deepLink)
        .amount(payment.getTotalAmount())
        .orderId(payment.getPaymentCode())
        .build();
}
```

---

## 📋 Bảng So Sánh

| Tiêu Chí | EMV QR (Tiêu Chuẩn) | Deep Link | Hiện Tại (Mock) |
|---------|-------------------|-----------|-----------------|
| Hiển thị tự động số tiền | ✅ Có | ✅ Có | ❌ Không |
| Yêu cầu nhập tay | ❌ Không | ❌ Không | ⚠️ Có |
| Hỗ trợ bởi MoMo | ✅ Đầy đủ | ✅ Đầy đủ | ⚠️ Cơ bản |
| Bảo mật | ✅ Cao (Checksum) | ⚠️ Trung bình | ❌ Thấp |
| Độ phức tạp | ⚠️ Cao | ✅ Thấp | ✅ Thấp |
| Sản xuất | Chuẩn ngân hàng | Đơn giản | Prototype |

---

## 🎯 Kiến Nghị Cho MedicalTech

### Ngắn Hạn (1-2 tuần)
✅ **Cải tiến Deep Link hiện tại** - Thêm amount vào link

```java
// File: PaymentServiceImpl.java, line 386
private String generateMockQrCode(String orderId, BigDecimal amount) {
    // ✅ CẢI TIẾN: Thêm amount vào data
    return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" 
        + "momo://payment?orderId=" + orderId + "&amount=" + amount;
}
```

**Lợi ích**:
- Người dùng thấy số tiền khi quét
- Không cần nhập tay
- Dễ implement nhanh

---

### Dài Hạn (1-3 tháng)
🎯 **Chuyển sang EMV QR Standard** - Tiêu chuẩn ngân hàng

```java
// Implement EMV QRCS theo tiêu chuẩn VietQR
// - Hỗ trợ tất cả ngân hàng
// - Bảo mật cao nhất
// - Trải nghiệm người dùng tốt nhất
```

**Lợi ích**:
- Chuẩn quốc tế
- Hỗ trợ tất cả ứng dụng thanh toán
- Tăng độ tin cậy
- Sẵn sàng mở rộng sang ngân hàng khác

---

## 🔍 Tóm Tắt Kỹ Thuật

### Hiện Tại (Mock)
```
Payment: 500.000 VND
  ↓
QR Code chứa: "PAY-20260203-12345"
  ↓
Quét QR → MoMo app → Nhập tay 500.000 ❌
```

### Sau Cải Tiến (Deep Link)
```
Payment: 500.000 VND
  ↓
QR Code chứa: "momo://payment?orderId=PAY-...&amount=500000"
  ↓
Quét QR → MoMo app tự hiển thị 500.000 ✅ → Bấm OK
```

### Tương Lai (EMV Standard)
```
Payment: 500.000 VND
  ↓
QR Code EMV (binary): "00020101021226370010A000000727..."
  ↓
Quét QR → MoMo + Vietcombank + VCB... tự hiển thị ✅✅✅
```

---

## 📝 Code Ví Dụ - Cải Tiến Nhanh

### File: PaymentServiceImpl.java

```java
// OLD ❌
private String generateMockQrCode(String orderId) {
    return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + orderId;
}

// NEW ✅
private String generateMockQrCode(String orderId, BigDecimal amount) {
    // Tạo deep link với amount
    String deepLink = "momo://payment?orderId=" + orderId 
                    + "&amount=" + amount.longValue() 
                    + "&description=Payment%20for%20appointment";
    
    // Encode QR code từ deep link
    return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" 
        + java.net.URLEncoder.encode(deepLink, StandardCharsets.UTF_8);
}
```

### File: PaymentServiceImpl.java (initMomoPayment method)

```java
// OLD ❌
String qrCodeUrl = generateMockQrCode(orderId);

// NEW ✅
String qrCodeUrl = generateMockQrCode(orderId, payment.getTotalAmount());
```

---

## ✅ Kết Luận

**Câu trả lời**: 
- 🔴 **Hiện tại**: Phải nhập bằng tay (Mock QR chỉ chứa Order ID)
- 🟡 **Nên cải tiến**: Thêm số tiền vào QR Deep Link (1-2 ngày)
- 🟢 **Tương lai**: Dùng EMV QR Standard (Chuẩn ngân hàng)

**Khuyến nghị**: Cải tiến Deep Link ngay để tăng UX, lên lịch chuyển EMV Standard sau.

---

**Tài liệu tham khảo**:
- MoMo API Docs: https://developers.momo.vn
- VietQR Standard: https://www.vietqr.io
- EMV QRCS: Tiêu chuẩn ISO 20022
