package com.q2k.meditech.dto;

import lombok.*;

import java.util.List;

/**
 * DTO for activating maintenance mode immediately (FR-BACK-005)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivateMaintenanceDTO {

    /** Thông báo hiển thị cho người dùng */
    private String message;

    /** Thời gian bảo trì (phút) */
    private Integer durationMinutes;

    /** Danh sách IP được phép truy cập */
    private List<String> whitelistedIps;

    /** Cho phép admin truy cập */
    @Builder.Default
    private Boolean allowAdminAccess = true;
}
