package com.q2k.meditech.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.q2k.meditech.entity.enums.BackupStatus;
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
@Table(name = "backup_records", indexes = {
        @Index(name = "idx_backup_status", columnList = "status"),
        @Index(name = "idx_backup_type", columnList = "backup_type"),
        @Index(name = "idx_backup_started_at", columnList = "started_at"),
        @Index(name = "idx_backup_completed_at", columnList = "completed_at")
})
public class BackupRecord extends BaseEntity {

    @Column(name = "backup_name", nullable = false, length = 255)
    private String backupName;

    @Enumerated(EnumType.STRING)
    @Column(name = "backup_type", nullable = false, length = 20)
    private BackupType backupType;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private BackupStatus status = BackupStatus.IN_PROGRESS;

    @Column(name = "size")
    private Long size; // bytes

    @Column(name = "duration")
    private Long duration; // milliseconds

    @Column(name = "storage_path", length = 500)
    private String storagePath;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "storage_location", nullable = false, length = 20)
    private StorageLocation storageLocation = StorageLocation.LOCAL;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "includes", columnDefinition = "json")
    private String includes; // JSON array: ["DATABASE","FILES","CONFIG"]

    @Builder.Default
    @Column(name = "encrypted", nullable = false)
    private Boolean encrypted = false;

    @Column(name = "checksum", length = 128)
    private String checksum; // SHA-256

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "json")
    private String metadata; // JSON: thông tin bổ sung

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({"userRoles", "sessions", "refreshTokens", "emailVerifications", "twoFactorBackups", "loginAttempts", "hibernateLazyInitializer", "passwordHash"})
    private User createdBy;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "progress_percent")
    private Integer progressPercent; // 0-100

    @Column(name = "current_step", length = 255)
    private String currentStep;

    @Column(name = "schedule_id")
    private Long scheduleId; // FK logic tới BackupSchedule (nếu từ scheduled)
}
