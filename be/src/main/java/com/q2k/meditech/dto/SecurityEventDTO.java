package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for Security Event
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityEventDTO {
    
    private Long id;
    private Long userId;
    private String username;
    private String eventType;
    private String severity;
    private String ipAddress;
    private String userAgent;
    private Object metadata;
    private LocalDateTime createdAt;
}
