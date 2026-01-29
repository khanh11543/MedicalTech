package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "notification_preferences")
public class NotificationPreference extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name="user_id", nullable = false, unique = true)
    private User user;

    @Column(name="email_enabled")
    private Boolean emailEnabled = true;

    @Column(name="sms_enabled")
    private Boolean smsEnabled = true;

    @Column(name="push_enabled")
    private Boolean pushEnabled = true;

    @Column(name="appointment_reminders")
    private Boolean appointmentReminders = true;

    @Column(name="promotional_emails")
    private Boolean promotionalEmails = false;

    @Column(name="reminder_hours_before")
    private Integer reminderHoursBefore = 24;
}
