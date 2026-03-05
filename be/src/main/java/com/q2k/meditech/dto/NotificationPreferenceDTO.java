package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferenceDTO {

    private Long id;
    private Long userId;
    private Boolean emailEnabled;
    private Boolean smsEnabled;
    private Boolean pushEnabled;
    private Boolean appointmentReminders;
    private Boolean promotionalEmails;
    private Integer reminderHoursBefore;
    private Boolean desktopEnabled;
    private Boolean soundEnabled;
    private Boolean dndEnabled;
    private LocalTime dndStartTime;
    private LocalTime dndEndTime;
    private Boolean urgentOnly;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
