package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.ConsentStatus;
import com.q2k.meditech.entity.enums.ConsentType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_consents", indexes = {
        @Index(name = "idx_user_consent_user", columnList = "user_id"),
        @Index(name = "idx_user_consent_type", columnList = "consent_type"),
        @Index(name = "idx_user_consent_status", columnList = "status"),
        @Index(name = "idx_user_consent_date", columnList = "consent_date")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserConsent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "consent_type", nullable = false, length = 50)
    private ConsentType consentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ConsentStatus status = ConsentStatus.ACCEPTED;

    @Column(name = "consent_date", nullable = false)
    private LocalDateTime consentDate;

    @Column(name = "version", length = 20)
    private String version;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    // Revocation fields
    @Column(name = "revoked_date")
    private LocalDateTime revokedDate;

    @Column(name = "revoked_by")
    private Long revokedBy;

    @Column(name = "revocation_reason", columnDefinition = "TEXT")
    private String revocationReason;

    // Notification tracking
    @Column(name = "notification_sent", columnDefinition = "TINYINT(1) DEFAULT 0")
    @Builder.Default
    private Boolean notificationSent = false;

    @Column(name = "notification_sent_date")
    private LocalDateTime notificationSentDate;
}
