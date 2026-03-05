package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.BlockScope;
import com.q2k.meditech.entity.enums.BlockType;
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
                @Index(name = "idx_blocked_ips_active", columnList = "is_active"),
                @Index(name = "idx_blocked_ips_ip", columnList = "ip_address"),
                @Index(name = "idx_blocked_ips_expires", columnList = "expires_at")
        }
)
public class BlockedIp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(length = 255)
    private String reason;

    // who blocked it (admin)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocked_by")
    private User blockedBy;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "block_type", length = 20)
    private BlockType blockType = BlockType.PERMANENT;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "block_scope", length = 20)
    private BlockScope blockScope = BlockScope.ENTIRE_SYSTEM;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "geo_country", length = 100)
    private String geoCountry;

    @Column(name = "geo_city", length = 100)
    private String geoCity;

    @Builder.Default
    @Column(name = "event_count")
    private Integer eventCount = 0;

    @Builder.Default
    @Column(name = "is_auto_blocked", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean isAutoBlocked = false;

    @Column(name = "blocked_at")
    private LocalDateTime blockedAt;

    @Column(name = "unblocked_at")
    private LocalDateTime unblockedAt;

    @Builder.Default
    @Column(name = "is_active", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean isActive = true;

    @PrePersist
    void prePersist() {
        if (blockedAt == null) blockedAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
        if (blockType == null) blockType = BlockType.PERMANENT;
        if (blockScope == null) blockScope = BlockScope.ENTIRE_SYSTEM;
        if (isAutoBlocked == null) isAutoBlocked = false;
        if (eventCount == null) eventCount = 0;
    }
}
