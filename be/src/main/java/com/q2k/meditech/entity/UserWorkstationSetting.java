package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_workstation_settings", indexes = {
        @Index(name = "idx_user_workstation_settings_user", columnList = "user_id", unique = true)
})
public class UserWorkstationSetting extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // --- Front Desk Mode ---
    @Builder.Default
    @Column(name = "front_desk_mode", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean frontDeskMode = false;

    @Builder.Default
    @Column(name = "hide_phone_number", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean hidePhoneNumber = false;

    @Builder.Default
    @Column(name = "hide_email", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean hideEmail = false;

    @Builder.Default
    @Column(name = "hide_patient_name_when_idle", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean hidePatientNameWhenIdle = false;

    @Builder.Default
    @Column(name = "large_queue_display", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean largeQueueDisplay = false;

    // --- Auto Lock ---
    @Builder.Default
    @Column(name = "auto_lock_enabled", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean autoLockEnabled = false;

    @Builder.Default
    @Column(name = "auto_lock_minutes", columnDefinition = "INT DEFAULT 5")
    private Integer autoLockMinutes = 5;

    @Column(name = "pin_hash", length = 255)
    private String pinHash;

    // --- Public Screen Privacy ---
    @Builder.Default
    @Column(name = "public_screen_privacy", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean publicScreenPrivacy = false;

    @Builder.Default
    @Column(name = "show_only_queue_number", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean showOnlyQueueNumber = false;
}
