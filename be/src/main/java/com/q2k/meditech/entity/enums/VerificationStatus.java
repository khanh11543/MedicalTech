package com.q2k.meditech.entity.enums;

public enum VerificationStatus {
    AWAITING_DOCUMENTS,  // mới tạo, chờ bổ sung hồ sơ
    PENDING,             // đã nộp hồ sơ, chờ admin duyệt
    VERIFIED,            // admin đã xác minh
    EXPIRED,
    APPROVED,            // đã duyệt (= VERIFIED, giữ backward compat)
    REJECTED,            // bị từ chối
    SUSPENDED,           // tạm đình chỉ
    REVOKED              // thu hồi vĩnh viễn
}
