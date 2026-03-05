package com.q2k.meditech.dto.security;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.q2k.meditech.entity.enums.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for UserSession entity (10.5 Force Logout / Session Management).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSessionDTO {
    private Long id;
    private UserSummaryDTO user;
    private SessionStatus status;

    // Device info
    private String deviceId;
    private String deviceName;
    private String deviceType;
    private String browserName;
    private String browserVersion;
    private String osName;

    // Network info
    private String ipAddress;
    private String geoCountry;
    private String geoCity;

    // Activity
    private Long requestCount;
    private String lastActivityDescription;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastSeenAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expiresAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime revokedAt;

    private String revokeReason;
}
