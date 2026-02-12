package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
