package com.q2k.meditech.entity;

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
                @Index(name = "idx_user_sessions_last_seen", columnList = "last_seen_at")
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

    @Column(name = "device_id", length = 500)
    private String deviceId;

    @Column(name = "device_name", length = 255)
    private String deviceName;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Lob
    @Column(name = "user_agent")
    private String userAgent;

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
    }
}
