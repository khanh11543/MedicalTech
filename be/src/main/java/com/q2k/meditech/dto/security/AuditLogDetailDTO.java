package com.q2k.meditech.dto.security;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.q2k.meditech.entity.enums.AuditActionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Detailed response DTO for AuditLog — detail view with old/new values
 * comparison and navigation (10.3 Audit Trail).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogDetailDTO {
    private Long id;
    private UserSummaryDTO user;
    private String action;
    private AuditActionType actionType;
    private String entityType;
    private Long entityId;

    // Change details
    private Object oldValues;
    private Object newValues;
    private List<FieldChangeDTO> changes;   // computed diff

    // Request info
    private String ipAddress;
    private String userAgent;
    private String requestUrl;
    private String requestMethod;
    private String geoCountry;
    private String geoCity;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    // Navigation
    private Long previousId;
    private Long nextId;

    // Related logs on same entity
    private List<AuditLogDTO> relatedLogs;

    /**
     * Represents a single field change between old and new values.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FieldChangeDTO {
        private String fieldName;
        private Object oldValue;
        private Object newValue;
    }
}
