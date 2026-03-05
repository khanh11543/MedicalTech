package com.q2k.meditech.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.q2k.meditech.entity.enums.BackupType;
import com.q2k.meditech.entity.enums.StorageLocation;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "backup_schedules", indexes = {
        @Index(name = "idx_schedule_enabled", columnList = "enabled"),
        @Index(name = "idx_schedule_next_run", columnList = "next_run_at")
})
public class BackupSchedule extends BaseEntity {

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "backup_type", nullable = false, length = 20)
    private BackupType backupType;

    @Column(name = "cron_expression", nullable = false, length = 50)
    private String cronExpression; // e.g. "0 0 2 * * ?" = 2h sáng hàng ngày

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "storage_location", nullable = false, length = 20)
    private StorageLocation storageLocation = StorageLocation.LOCAL;

    @Builder.Default
    @Column(name = "retention_days", nullable = false)
    private Integer retentionDays = 30;

    @Builder.Default
    @Column(name = "encrypted", nullable = false)
    private Boolean encrypted = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "includes", columnDefinition = "json")
    private String includes; // JSON array: ["DATABASE","FILES","CONFIG"]

    @Builder.Default
    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;

    @Column(name = "last_run_at")
    private LocalDateTime lastRunAt;

    @Column(name = "next_run_at")
    private LocalDateTime nextRunAt;

    @Column(name = "storage_path", length = 500)
    private String storagePath; // thư mục lưu trữ

    @Builder.Default
    @Column(name = "max_backups")
    private Integer maxBackups = 10; // số lượng backup tối đa giữ lại

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({"userRoles", "sessions", "refreshTokens", "emailVerifications", "twoFactorBackups", "loginAttempts", "hibernateLazyInitializer", "passwordHash"})
    private User createdBy;
}
