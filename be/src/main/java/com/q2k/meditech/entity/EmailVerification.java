package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * EmailVerification Entity - Tracks email verification OTP codes
 * Maps to 'email_verifications' table in database
 * Used for email verification during registration and email change
 */
@Entity
@Table(name = "email_verifications", indexes = {
        @Index(name = "idx_email_verifications_user_id", columnList = "user_id"),
        @Index(name = "idx_email_verifications_email", columnList = "email"),
        @Index(name = "idx_email_verifications_expires_at", columnList = "expires_at"),
        @Index(name = "idx_email_verifications_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVerification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)  // Allow null for registration flow
    private User user;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "otp_code", nullable = false, length = 6)
    private String otpCode;
    
    // Temporary fields for registration flow (before user creation)
    @Column(name = "password_hash", columnDefinition = "TEXT")
    private String passwordHash;
    
    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 0;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private VerificationStatus status = VerificationStatus.PENDING;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    // Helper methods
    public boolean isExpired() {
        return expiresAt.isBefore(LocalDateTime.now());
    }

    public boolean isVerified() {
        return status == VerificationStatus.VERIFIED && verifiedAt != null;
    }

    public boolean canRetry() {
        return attemptCount < 5 && !isExpired();
    }

    public void incrementAttempt() {
        this.attemptCount++;
    }

    public void markAsVerified() {
        this.verifiedAt = LocalDateTime.now();
        this.status = VerificationStatus.VERIFIED;
    }

    public void markAsExpired() {
        this.status = VerificationStatus.EXPIRED;
    }
}
