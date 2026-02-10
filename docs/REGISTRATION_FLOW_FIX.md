# 🔒 Cải Tiến Quy Trình Đăng Ký & Xác Thực Email

## ⚠️ Vấn Đề Trước Đây
- Khi người dùng đăng ký, tài khoản được lưu vào database **NGAY LẬP TỨC**
- User có `isActive = true` ngay từ đầu
- Chưa verify OTP nhưng đã tồn tại trong hệ thống

## ✅ Giải Pháp Mới

### 1. **Quy Trình Đăng Ký**

```
Bước 1: Người dùng điền form đăng ký
         ↓
Bước 2: Backend tạo User với:
         - isActive = FALSE (chưa kích hoạt)
         - isVerified = FALSE (chưa xác thực)
         - User được LƯU VÀO DATABASE
         ↓
Bước 3: Hệ thống gửi OTP qua email
         ↓
Bước 4: Người dùng nhập OTP
         ↓
Bước 5: NẾU OTP ĐÚNG:
         - isVerified = TRUE
         - isActive = TRUE (Tài khoản được KÍCH HOẠT)
         - Gửi email chào mừng
```

### 2. **Kiểm Tra Khi Đăng Nhập**

```java
// 1. Kiểm tra isActive
if (!user.isActive()) {
    → "Please verify your email to activate your account"
}

// 2. Kiểm tra isVerified  
if (!user.isVerified()) {
    → "Please verify your email first"
}

// 3. Kiểm tra mật khẩu
if (!passwordMatches()) {
    → "Invalid email or password"
}
```

### 3. **Lợi Ích**

✅ **Bảo mật tốt hơn**: User chưa verify không thể đăng nhập
✅ **Database sạch hơn**: Chỉ user đã verify email mới active
✅ **Trải nghiệm tốt**: Thông báo rõ ràng cần verify email
✅ **Chống spam**: Tài khoản fake không thể hoạt động

## 📝 Code Changes

### File: `AuthService.java`

**Thay đổi 1 - Register (dòng 86-95)**
```java
// TRƯỚC:
.isActive(true)  // ❌ SAI

// SAU:
.isActive(false) // ✅ ĐÚNG - User chưa được kích hoạt
```

**Thay đổi 2 - Verify Email (dòng 151-157)**
```java
// TRƯỚC:
user.setIsVerified(true);

// SAU:
user.setIsVerified(true);
user.setIsActive(true); // ✅ Kích hoạt tài khoản sau khi verify OTP
```

**Thay đổi 3 - Login Check (dòng 193-197)**
```java
// Thông báo rõ ràng hơn
if (!user.getIsActive()) {
    throw new UnverifiedAccountException(
        "Please verify your email to activate your account"
    );
}
```

## 🧪 Testing Flow

### Test Case 1: Đăng ký mới
1. Đăng ký với email mới
2. Kiểm tra database: `isActive = 0, isVerified = 0`
3. Thử đăng nhập → Lỗi: "Please verify your email"
4. Nhập OTP đúng
5. Kiểm tra database: `isActive = 1, isVerified = 1`
6. Đăng nhập thành công ✅

### Test Case 2: OTP sai
1. Đăng ký với email mới
2. Nhập OTP SAI → Lỗi: "Invalid OTP code"
3. Database vẫn: `isActive = 0, isVerified = 0`
4. Thử đăng nhập → Lỗi: "Please verify your email"

### Test Case 3: Không verify email
1. Đăng ký nhưng không nhập OTP
2. Database: `isActive = 0, isVerified = 0`
3. Đăng nhập → Lỗi: "Please verify your email"
4. User tồn tại trong DB nhưng KHÔNG THỂ sử dụng

## 🔍 Kiểm Tra Database

```sql
-- Xem user vừa đăng ký (chưa verify)
SELECT id, email, is_active, is_verified 
FROM users 
WHERE email = 'test@example.com';

-- Kết quả mong đợi TRƯỚC KHI verify:
-- is_active = 0
-- is_verified = 0

-- Kết quả mong đợi SAU KHI verify OTP:
-- is_active = 1
-- is_verified = 1
```

## 📧 Email Flow

1. **Email đăng ký** (OTP)
   - Gửi ngay sau khi đăng ký
   - Chứa mã OTP 6 số
   - Hết hạn sau 15 phút

2. **Email chào mừng**
   - Chỉ gửi SAU KHI verify OTP thành công
   - Xác nhận tài khoản đã được kích hoạt

## ⚡ Reset Database (Để Test)

```powershell
# Xóa toàn bộ database và tạo lại
.\clear-database.ps1

# Hoặc dùng MySQL trực tiếp:
mysql -u admin -pAdmin@2004 -P 3307 -e "
  DROP DATABASE medical_appointment_system;
  CREATE DATABASE medical_appointment_system 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"
```

---

**Ngày cập nhật**: 08/02/2026  
**Version**: 2.0  
**Status**: ✅ Implemented & Tested
