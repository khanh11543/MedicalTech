package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "email_enabled", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean emailEnabled;

    @Column(name = "sms_enabled", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean smsEnabled;

    @Column(name = "push_enabled", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean pushEnabled;

    @Column(name = "appointment_reminders", columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean appointmentReminders;

    @Column(name = "promotional_emails", columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean promotionalEmails;

    @Column(name = "reminder_hours_before", columnDefinition = "INT DEFAULT 24")
    private Integer reminderHoursBefore;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (emailEnabled == null) {
            emailEnabled = true;
        }
        if (smsEnabled == null) {
            smsEnabled = true;
        }
        if (pushEnabled == null) {
            pushEnabled = true;
        }
        if (appointmentReminders == null) {
            appointmentReminders = true;
        }
        if (promotionalEmails == null) {
            promotionalEmails = false;
        }
        if (reminderHoursBefore == null) {
            reminderHoursBefore = 24;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
