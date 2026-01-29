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
        name = "device_tokens",
        uniqueConstraints = @UniqueConstraint(name="unique_user_device_token", columnNames = {"user_id","device_token"})
)
public class DeviceToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="user_id", nullable = false)
    private User user;

    @Column(name="device_token", nullable = false, length = 500)
    private String deviceToken;

    @Column(name="device_type", length = 20)
    private String deviceType; // IOS/ANDROID/WEB

    @Column(name="device_name", length = 100)
    private String deviceName;

    @Column(name="is_active")
    private Boolean isActive = true;

    @Column(name="last_used_at")
    private LocalDateTime lastUsedAt;

    @Column(name="created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
