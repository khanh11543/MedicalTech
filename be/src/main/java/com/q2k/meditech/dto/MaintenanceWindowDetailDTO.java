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

    /** Scheduled time */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;

    /** Actual time */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime actualStartTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime actualEndTime;

    /** Maintenance duration (minutes) */
    private Long durationMinutes;

    /** Display message */
    private String message;

    /** Advance notification (minutes) */
    private Integer notifyBeforeMinutes;

    /** Allow admin access */
    private Boolean allowAdminAccess;

    /** IP whitelist */
    private List<String> whitelistedIps;

    /** Impact */
    private String impact;
    private String affectedServices;

    /** Created by */
    private Long createdById;
    private String createdByName;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
