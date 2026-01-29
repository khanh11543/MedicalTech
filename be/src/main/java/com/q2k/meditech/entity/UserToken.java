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
@Table(name = "user_tokens")
public class UserToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="user_id", nullable = false)
    private User user;

    @Column(name="token_hash", nullable = false, length = 255)
    private String tokenHash;

    @Column(name="token_type", nullable = false, length = 30)
    private String tokenType; // VERIFY_EMAIL/RESET_PASSWORD/OTP

    @Column(name="expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name="used_at")
    private LocalDateTime usedAt;

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
    }
}
