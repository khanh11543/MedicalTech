package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * TwoFactorBackup Entity - Stores backup codes for 2FA recovery
 * Maps to 'two_factor_backups' table in database
 */
@Entity
@Table(name = "two_factor_backups", indexes = {
        @Index(name = "idx_two_factor_backups_user_id", columnList = "user_id"),
        @Index(name = "idx_two_factor_backups_used_at", columnList = "used_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TwoFactorBackup extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "backup_code_hash", nullable = false, length = 255, unique = true)
    private String backupCodeHash;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "used_ip_address", length = 45)
    private String usedIpAddress;

    // Helper methods
    public boolean isUsed() {
        return usedAt != null;
    }

    public void markAsUsed(String ipAddress) {
        this.usedAt = LocalDateTime.now();
        this.usedIpAddress = ipAddress;
    }
}
