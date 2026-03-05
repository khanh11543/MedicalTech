package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "user_sessions",
        indexes = {
                @Index(name = "idx_user_sessions_user", columnList = "user_id"),
                @Index(name = "idx_user_sessions_expires", columnList = "expires_at"),
                @Index(name = "idx_user_sessions_revoked", columnList = "revoked_at"),
                @Index(name = "idx_user_sessions_last_seen", columnList = "last_seen_at"),
                @Index(name = "idx_user_sessions_status", columnList = "status"),
                @Index(name = "idx_user_sessions_ip", columnList = "ip_address")
        }
)
public class UserSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK users(id)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // hash refresh token, never store plaintext
    @Column(name = "refresh_token_hash", nullable = false, length = 255)
    private String refreshTokenHash;

    // public session identifier for revoke/kill session
    @Column(name = "session_key", nullable = false, unique = true, length = 100)
    private String sessionKey;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private SessionStatus status = SessionStatus.ACTIVE;

    @Column(name = "device_id", length = 500)
    private String deviceId;

    @Column(name = "device_name", length = 255)
    private String deviceName;

    @Column(name = "device_type", length = 50)
    private String deviceType; // Desktop, Mobile, Tablet

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Lob
    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "browser_name", length = 100)
    private String browserName;

    @Column(name = "browser_version", length = 50)
    private String browserVersion;

    @Column(name = "os_name", length = 100)
    private String osName;

    @Column(name = "geo_country", length = 100)
    private String geoCountry;

    @Column(name = "geo_city", length = 100)
    private String geoCity;

    @Builder.Default
    @Column(name = "request_count")
    private Long requestCount = 0L;

    @Column(name = "last_activity_description", length = 500)
    private String lastActivityDescription;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "revoke_reason", length = 255)
    private String revokeReason;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = SessionStatus.ACTIVE;
        if (requestCount == null) requestCount = 0L;
    }
}
