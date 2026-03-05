package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserConsentDetailDTO {
    private Long userId;
    private String userName;
    private String userEmail;
    private String userRole;
    private LocalDateTime accountCreatedDate;
    private LocalDateTime lastLoginDate;

    // Consent overview
    private Integer totalConsents;
    private Integer activeConsents;
    private Integer revokedConsents;
    private Integer declinedConsents;

    // Consent history grouped by type
    private Map<String, List<UserConsentDTO>> consentsByType;

    // Latest consent per type
    private List<UserConsentDTO> latestConsents;
}
