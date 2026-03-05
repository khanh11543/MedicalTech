package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.BlockScope;
import com.q2k.meditech.entity.enums.IpStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "ip_rules",
        indexes = {
                @Index(name = "idx_ip_rules_ip", columnList = "ip_address"),
                @Index(name = "idx_ip_rules_status", columnList = "status"),
                @Index(name = "idx_ip_rules_active", columnList = "is_active")
        }
)
public class IpRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(name = "rule_type", nullable = false, length = 10)
    private String ruleType; // BLOCK/ALLOW

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private IpStatus status;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "scope", length = 20)
    private BlockScope scope = BlockScope.ENTIRE_SYSTEM;

    @Column(length = 255)
    private String reason;

    @Column(name = "description", length = 500)
    private String description;

    @Builder.Default
    @Column(name = "is_active", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (scope == null) scope = BlockScope.ENTIRE_SYSTEM;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
