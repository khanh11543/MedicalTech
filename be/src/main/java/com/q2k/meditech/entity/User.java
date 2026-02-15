package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * User Entity - Represents users in the system
 * Maps to 'users' table in database
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_email", columnList = "email"),
        @Index(name = "idx_users_phone", columnList = "phone"),
        @Index(name = "idx_users_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Builder.Default
    @Column(name = "is_active", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "is_verified", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean isVerified = false;

    @Column(name = "verification_token", length = 255)
    private String verificationToken;

    @Column(name = "reset_token", length = 255)
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    @Column(name = "reset_token_used_at")
    private LocalDateTime resetTokenUsedAt;

    @Column(name = "otp_code", length = 6)
    private String otpCode;

    @Column(name = "otp_created_at")
    private LocalDateTime otpCreatedAt;

    @Column(name = "otp_expires_at")
    private LocalDateTime otpExpiresAt;

    @Builder.Default
    @Column(name = "otp_attempt_count", nullable = false)
    private Integer otpAttemptCount = 0;

    @Builder.Default
    @Column(name = "two_factor_enabled", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean twoFactorEnabled = false;

    @Column(name = "two_factor_secret", length = 255)
    private String twoFactorSecret;

    @Builder.Default
    @Column(name = "failed_login_count", columnDefinition = "INT DEFAULT 0")
    private Integer failedLoginCount = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    // Relationships
    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<UserRole> userRoles = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<UserSession> sessions = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<RefreshToken> refreshTokens = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<EmailVerification> emailVerifications = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<TwoFactorBackup> twoFactorBackups = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<LoginAttempt> loginAttempts = new HashSet<>();

    // Helper methods
    public void addRole(UserRole userRole) {
        if (this.userRoles == null) {
            this.userRoles = new HashSet<>();
        }
        userRoles.add(userRole);
        userRole.setUser(this);
    }

    public void removeRole(UserRole userRole) {
        userRoles.remove(userRole);
        userRole.setUser(null);
    }

    public boolean isAccountLocked() {
        return lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now());
    }
}
