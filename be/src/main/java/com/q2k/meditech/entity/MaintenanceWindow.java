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
    private String message; // Message displayed to users during maintenance

    @Column(name = "notify_before_minutes")
    private Integer notifyBeforeMinutes; // Notify before how many minutes

    @Builder.Default
    @Column(name = "allow_admin_access", nullable = false)
    private Boolean allowAdminAccess = true; // Admin can access during maintenance

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "whitelisted_ips", columnDefinition = "json")
    private String whitelistedIps; // JSON array of allowed IPs

    @Lob
    @Column(name = "impact")
    private String impact; // Description of system impact

    @Column(name = "affected_services", length = 500)
    private String affectedServices; // CSV or JSON of affected services

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({"userRoles", "sessions", "refreshTokens", "emailVerifications", "twoFactorBackups", "loginAttempts", "hibernateLazyInitializer", "passwordHash"})
    private User createdBy;
}
