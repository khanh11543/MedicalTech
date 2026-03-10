package com.q2k.meditech.dto.security;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.q2k.meditech.entity.enums.AuditActionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for AuditLog entity — list view (10.3 Audit Trail).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogDTO {
    private Long id;
    private UserSummaryDTO user;
    private String action;
    private AuditActionType actionType;
    private String entityType;
    private Long entityId;
    private String ipAddress;
    private String requestUrl;
    private String requestMethod;
    private String geoCountry;
    private String geoCity;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
