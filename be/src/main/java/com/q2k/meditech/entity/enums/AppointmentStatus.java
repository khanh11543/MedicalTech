package com.q2k.meditech.entity.enums;

public enum AppointmentStatus {
    PENDING,      // Chờ xác nhận
    CONFIRMED,    // Đã xác nhận
    CHECKED_IN,   // Đã check-in
    IN_PROGRESS,  // Đang khám
    COMPLETED,    // Hoàn thành
    CANCELLED,    // Đã hủy
    NO_SHOW,      // Không đến
    RESCHEDULED
}
