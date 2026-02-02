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
        name = "refresh_tokens",
        uniqueConstraints = @UniqueConstraint(name="uq_refresh_token_hash", columnNames = "token_hash")
)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="user_id", nullable = false)
    private User user;

    @Column(name="token_hash", nullable = false, length = 255)
    private String tokenHash;

    @Column(name="issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name="expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name="revoked_at")
    private LocalDateTime revokedAt;

    @Builder.Default
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="replaced_by_token_id")
    private RefreshToken replacedByToken = null;

    @Column(name="ip_address", length = 45)
    private String ipAddress;

    @Lob
    @Column(name="user_agent")
    private String userAgent;

    @Column(name="created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (revokedAt == null) revokedAt = null;
    }
}
