package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.SecurityEventStatus;
import com.q2k.meditech.entity.enums.SecurityEventType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
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
@Table(
        name = "security_events",
        indexes = {
                @Index(name = "idx_security_events_user", columnList = "user_id"),
                @Index(name = "idx_security_events_type", columnList = "event_type"),
                @Index(name = "idx_security_events_created", columnList = "created_at"),
                @Index(name = "idx_security_events_severity", columnList = "severity"),
                @Index(name = "idx_security_events_status", columnList = "status"),
                @Index(name = "idx_security_events_ip", columnList = "ip_address")
        }
)
public class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // nullable because events could be IP-based without a known user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private SecurityEventType eventType;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 10)
    private SecuritySeverity severity = SecuritySeverity.LOW;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private SecurityEventStatus status = SecurityEventStatus.NEW;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Lob
    @Column(name = "user_agent")
    private String userAgent;

    @Lob
    @Column(name = "description")
    private String description;

    @Column(name = "request_url", length = 500)
    private String requestUrl;

    @Column(name = "request_method", length = 10)
    private String requestMethod;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "request_headers", columnDefinition = "json")
    private Object requestHeaders;

    @Column(name = "geo_country", length = 100)
    private String geoCountry;

    @Column(name = "geo_city", length = 100)
    private String geoCity;

    @Column(name = "isp", length = 200)
    private String isp;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "json")
    private Object metadata;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = SecurityEventStatus.NEW;
        if (severity == null) severity = SecuritySeverity.LOW;
    }
}
