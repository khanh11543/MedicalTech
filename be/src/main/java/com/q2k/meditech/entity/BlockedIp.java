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
@Table(
        name = "blocked_ips",
        indexes = {
                @Index(name = "idx_blocked_ips_active", columnList = "is_active")
        }
)
public class BlockedIp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="ip_address", nullable = false, unique = true, length = 45)
    private String ipAddress;

    @Column(length = 255)
    private String reason;

    // who blocked it (admin)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="blocked_by")
    private User blockedBy;

    @Column(name="blocked_at")
    private LocalDateTime blockedAt;

    @Column(name="unblocked_at")
    private LocalDateTime unblockedAt;

    @Builder.Default
    @Column(name="is_active")
    private Boolean isActive = true;

    @PrePersist
    void prePersist() {
        if (blockedAt == null) blockedAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
    }
}
