package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for User Consent
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserConsentDTO {
    
    private Long id;
    private Long userId;
    private String username;
    private String consentType;
    private Boolean consentGiven;
    private String consentText;
    private String ipAddress;
    private LocalDateTime grantedAt;
    private LocalDateTime revokedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
