package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.ConsentStatus;
import com.q2k.meditech.entity.enums.ConsentType;
import lombok.*;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserConsentDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private ConsentType consentType;
    private ConsentStatus status;
    private LocalDateTime consentDate;
    private String version;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime revokedDate;
    private Long revokedBy;
    private String revokedByName;
    private String revocationReason;
    private Boolean notificationSent;
    private LocalDateTime notificationSentDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
