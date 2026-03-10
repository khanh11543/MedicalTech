package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Maintenance Window detail view (FR-BACK-005)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceWindowDetailDTO {

    private Long id;
    private String title;
    private String description;
    private String maintenanceType;
    private String status;

    /** Thời gian dự kiến */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;

    /** Thời gian thực tế */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime actualStartTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime actualEndTime;

    /** Thời gian bảo trì (phút) */
    private Long durationMinutes;

    /** Thông báo hiển thị */
    private String message;

    /** Thông báo trước (phút) */
    private Integer notifyBeforeMinutes;

    /** Cho phép admin truy cập */
    private Boolean allowAdminAccess;

    /** Danh sách IP whitelist */
    private List<String> whitelistedIps;

    /** Ảnh hưởng */
    private String impact;
    private String affectedServices;

    /** Người tạo */
    private Long createdById;
    private String createdByName;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
