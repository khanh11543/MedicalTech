package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ip_rules")
public class IpRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(name="rule_type", nullable = false, length = 10)
    private String ruleType; // BLOCK/ALLOW

    @Column(length = 255)
    private String reason;

    @Builder.Default
    @Column(name="is_active")
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="created_by")
    private User createdBy;

    @Column(name="created_at")
    private LocalDateTime createdAt;

    @Column(name="updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
