package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for Security Audit Log
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityAuditLogDTO {
    
    private Long id;
    private Long userId;
    private String username;
    private String action;
    private String entityType;
    private Long entityId;
    private Object oldValues;
    private Object newValues;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;
}
