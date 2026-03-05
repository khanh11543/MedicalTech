package com.q2k.meditech.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.q2k.meditech.entity.enums.MaintenanceStatus;
import com.q2k.meditech.entity.enums.MaintenanceType;
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
@Table(name = "maintenance_windows", indexes = {
        @Index(name = "idx_maint_status", columnList = "status"),
        @Index(name = "idx_maint_start_time", columnList = "start_time"),
        @Index(name = "idx_maint_end_time", columnList = "end_time")
})
public class MaintenanceWindow extends BaseEntity {

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Lob
    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "maintenance_type", nullable = false, length = 20)
    private MaintenanceType maintenanceType;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private MaintenanceStatus status = MaintenanceStatus.SCHEDULED;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime;

    @Lob
    @Column(name = "message")
    private String message; // thông báo hiển thị cho user khi hệ thống bảo trì

    @Column(name = "notify_before_minutes")
    private Integer notifyBeforeMinutes; // thông báo trước bao nhiêu phút

    @Builder.Default
    @Column(name = "allow_admin_access", nullable = false)
    private Boolean allowAdminAccess = true; // admin có thể truy cập trong lúc bảo trì

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "whitelisted_ips", columnDefinition = "json")
    private String whitelistedIps; // JSON array IP được phép truy cập

    @Lob
    @Column(name = "impact")
    private String impact; // mô tả ảnh hưởng đến hệ thống

    @Column(name = "affected_services", length = 500)
    private String affectedServices; // CSV hoặc JSON các service bị ảnh hưởng

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({"userRoles", "sessions", "refreshTokens", "emailVerifications", "twoFactorBackups", "loginAttempts", "hibernateLazyInitializer", "passwordHash"})
    private User createdBy;
}
