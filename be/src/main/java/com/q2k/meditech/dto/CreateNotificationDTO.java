package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationDTO {

    @NotNull(message = "User IDs are required")
    private List<Long> userIds; // List of user IDs to send notification to

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;

    @NotBlank(message = "Type is required")
    private String type; // SYSTEM, APPOINTMENT, PAYMENT, etc.

    private String referenceType; // Optional: APPOINTMENT, PRESCRIPTION, etc.
    
    private Long referenceId; // Optional: ID of referenced entity

    private Boolean sendEmail = false;
    
    private Boolean sendSms = false;
    
    private Boolean sendPush = true;

    private LocalDateTime scheduledAt; // Optional: schedule for future delivery
}
