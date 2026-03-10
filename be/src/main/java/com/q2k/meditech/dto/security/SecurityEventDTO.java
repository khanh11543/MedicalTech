package com.q2k.meditech.dto.security;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.q2k.meditech.entity.enums.SecurityEventStatus;
import com.q2k.meditech.entity.enums.SecurityEventType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for SecurityEvent entity.
 * Used in list views and detail views (10.1 Security Events).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityEventDTO {
    private Long id;
    private UserSummaryDTO user;
    private SecurityEventType eventType;
    private SecuritySeverity severity;
    private SecurityEventStatus status;
    private String ipAddress;
    private String userAgent;
    private String description;
    private String requestUrl;
    private String requestMethod;
    private Object requestHeaders;
    private String geoCountry;
    private String geoCity;
    private String isp;
    private Object metadata;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime resolvedAt;

    private UserSummaryDTO resolvedBy;
}
