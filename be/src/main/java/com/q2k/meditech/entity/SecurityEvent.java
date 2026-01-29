package com.q2k.meditech.entity;

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
                @Index(name = "idx_security_events_created", columnList = "created_at")
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

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType; // FAILED_LOGIN, LOCKOUT, PASSWORD_CHANGED, 2FA_ENABLED...

    @Column(name = "severity", length = 10)
    private String severity = "INFO"; // INFO/WARN/HIGH

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Lob
    @Column(name = "user_agent")
    private String userAgent;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "json")
    private Object metadata;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
