package com.q2k.meditech.entity.enums;

public enum SecurityEventType {
    FAILED_LOGIN,                // Đăng nhập thất bại
    ACCOUNT_LOCKOUT,             // Khóa tài khoản
    SUSPICIOUS_LOGIN_LOCATION,   // Đăng nhập từ vị trí đáng ngờ
    MULTIPLE_FAILED_2FA,         // Nhiều lần 2FA thất bại
    PASSWORD_BRUTE_FORCE,        // Phát hiện brute force mật khẩu
    SQL_INJECTION_ATTEMPT,       // Phát hiện SQL Injection
    XSS_ATTEMPT,                 // Phát hiện XSS
    UNUSUAL_DATA_ACCESS,         // Truy cập dữ liệu bất thường
    RAPID_API_CALLS,             // Gọi API quá nhanh
    FILE_UPLOAD_VIOLATION,       // Vi phạm upload file
    PASSWORD_CHANGED,            // Thay đổi mật khẩu
    TWO_FA_ENABLED,              // Bật 2FA
    TWO_FA_DISABLED,             // Tắt 2FA
    ROLE_CHANGED,                // Thay đổi role
    ACCOUNT_UNLOCKED             // Mở khóa tài khoản
}
