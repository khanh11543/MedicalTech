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
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="user_id")
    private User user;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name="entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name="entity_id")
    private Long entityId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name="old_values", columnDefinition = "json")
    private Object oldValues;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name="new_values", columnDefinition = "json")
    private Object newValues;

    @Column(name="ip_address", length = 45)
    private String ipAddress;

    @Lob
    @Column(name="user_agent")
    private String userAgent;

    @Column(name="created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
