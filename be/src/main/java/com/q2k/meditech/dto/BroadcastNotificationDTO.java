package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BroadcastNotificationDTO {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;

    @NotBlank(message = "Type is required")
    private String type; // SYSTEM, ANNOUNCEMENT, etc.

    private Boolean sendEmail = false;
    
    private Boolean sendSms = false;
    
    private Boolean sendPush = true;

    private LocalDateTime scheduledAt; // Optional: schedule for future delivery
}
