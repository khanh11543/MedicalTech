package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "notification_preferences")
public class NotificationPreference extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    @Column(name = "email_enabled", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean emailEnabled = true;

    @Builder.Default
    @Column(name = "sms_enabled", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean smsEnabled = true;

    @Builder.Default
    @Column(name = "push_enabled", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean pushEnabled = true;

    @Builder.Default
    @Column(name = "appointment_reminders", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean appointmentReminders = true;

    @Builder.Default
    @Column(name = "promotional_emails", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean promotionalEmails = false;

    @Builder.Default
    @Column(name = "reminder_hours_before", columnDefinition = "INT DEFAULT 24")
    private Integer reminderHoursBefore = 24;

    @Builder.Default
    @Column(name = "desktop_enabled", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean desktopEnabled = true;

    @Builder.Default
    @Column(name = "sound_enabled", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean soundEnabled = true;

    @Builder.Default
    @Column(name = "dnd_enabled", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean dndEnabled = false;

    @Column(name = "dnd_start_time")
    private LocalTime dndStartTime;

    @Column(name = "dnd_end_time")
    private LocalTime dndEndTime;

    @Builder.Default
    @Column(name = "urgent_only", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean urgentOnly = false;
}
