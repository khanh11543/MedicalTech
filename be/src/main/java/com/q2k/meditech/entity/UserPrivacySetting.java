package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_privacy_settings", indexes = {
        @Index(name = "idx_user_privacy_settings_user", columnList = "user_id", unique = true)
})
public class UserPrivacySetting extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    @Column(name = "session_timeout_minutes", columnDefinition = "INT DEFAULT 30")
    private Integer sessionTimeoutMinutes = 30;
}
