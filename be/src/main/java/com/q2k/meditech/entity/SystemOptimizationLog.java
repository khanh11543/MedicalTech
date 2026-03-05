package com.q2k.meditech.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.q2k.meditech.entity.enums.OptimizationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "system_optimization_logs", indexes = {
        @Index(name = "idx_optim_type", columnList = "optimization_type"),
        @Index(name = "idx_optim_status", columnList = "status"),
        @Index(name = "idx_optim_started_at", columnList = "started_at")
})
public class SystemOptimizationLog extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "optimization_type", nullable = false, length = 30)
    private OptimizationType optimizationType;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // IN_PROGRESS, COMPLETED, FAILED

    @Column(name = "details", columnDefinition = "TEXT")
    private String details; // JSON kết quả chi tiết

    @Column(name = "size_before")
    private Long sizeBefore; // bytes

    @Column(name = "size_after")
    private Long sizeAfter; // bytes

    @Column(name = "records_affected")
    private Long recordsAffected; // số bản ghi bị ảnh hưởng

    @Column(name = "duration")
    private Long duration; // milliseconds

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({"userRoles", "sessions", "refreshTokens", "emailVerifications", "twoFactorBackups", "loginAttempts", "hibernateLazyInitializer", "passwordHash"})
    private User createdBy;
}
