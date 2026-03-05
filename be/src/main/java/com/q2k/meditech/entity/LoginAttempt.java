package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * LoginAttempt Entity - Tracks login attempts for security auditing
 * Maps to 'login_attempts' table in database
 */
@Entity
@Table(name = "login_attempts", indexes = {
        @Index(name = "idx_login_attempts_user_id", columnList = "user_id"),
        @Index(name = "idx_login_attempts_email", columnList = "email"),
        @Index(name = "idx_login_attempts_ip", columnList = "ip_address"),
        @Index(name = "idx_login_attempts_attempted_at", columnList = "attempted_at"),
        @Index(name = "idx_login_attempts_success", columnList = "success")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAttempt extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "success", nullable = false)
    private Boolean success;

    @Column(name = "failure_reason", length = 255)
    private String failureReason;

    @Column(name = "attempted_at", nullable = false)
    private LocalDateTime attemptedAt;

    @Column(name = "geo_country", length = 100)
    private String geoCountry;

    @PrePersist
    void prePersist() {
        if (attemptedAt == null) {
            attemptedAt = LocalDateTime.now();
        }
    }
}
