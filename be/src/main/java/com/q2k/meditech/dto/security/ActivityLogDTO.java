package com.q2k.meditech.dto.security;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.q2k.meditech.entity.enums.ActivityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for ActivityLog entity (10.4 Activity Logs).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogDTO {
    private Long id;
    private UserSummaryDTO user;
    private ActivityType activityType;
    private String description;
    private String resourceType;
    private Long resourceId;
    private String ipAddress;
    private String userAgent;
    private String geoCountry;
    private String geoCity;
    private Object metadata;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
