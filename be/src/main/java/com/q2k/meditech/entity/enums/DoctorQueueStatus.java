package com.q2k.meditech.entity.enums;

/**
 * Doctor status in queue management context.
 * Replaces the simple boolean isAvailable for richer queue workflows.
 */
public enum DoctorQueueStatus {
    AVAILABLE,   // Sẵn sàng nhận bệnh nhân
    BUSY,        // Đang khám (tự động khi có IN_PROGRESS)
    ON_BREAK,    // Nghỉ giải lao
    OFFLINE      // Không hoạt động hôm nay
}
