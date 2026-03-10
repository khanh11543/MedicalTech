package com.q2k.meditech.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.q2k.meditech.entity.enums.RestoreStatus;
import com.q2k.meditech.entity.enums.RestoreType;
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
@Table(name = "restore_records", indexes = {
        @Index(name = "idx_restore_status", columnList = "status"),
        @Index(name = "idx_restore_started_at", columnList = "started_at")
})
public class RestoreRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "backup_record_id", nullable = false)
    @JsonIgnoreProperties({"createdBy", "hibernateLazyInitializer"})
    private BackupRecord backupRecord;

    @Enumerated(EnumType.STRING)
    @Column(name = "restore_type", nullable = false, length = 20)
    private RestoreType restoreType;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private RestoreStatus status = RestoreStatus.IN_PROGRESS;

    @Column(name = "pre_restore_backup_id")
    private Long preRestoreBackupId; // ID backup tự động tạo trước khi restore

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "restored_items", columnDefinition = "json")
    private String restoredItems; // JSON: ["DATABASE","FILES","CONFIG"]

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "duration")
    private Long duration; // milliseconds

    @Column(name = "logs", columnDefinition = "TEXT")
    private String logs; // chi tiết từng bước thực hiện

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "progress_percent")
    private Integer progressPercent; // 0-100

    @Column(name = "current_step", length = 255)
    private String currentStep;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({"userRoles", "sessions", "refreshTokens", "emailVerifications", "twoFactorBackups", "loginAttempts", "hibernateLazyInitializer", "passwordHash"})
    private User createdBy;

    @Builder.Default
    @Column(name = "is_test_restore", nullable = false)
    private Boolean isTestRestore = false; // sandbox restore
}
