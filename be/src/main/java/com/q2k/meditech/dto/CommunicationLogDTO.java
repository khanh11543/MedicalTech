package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for communication log (email/SMS sent for an appointment)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunicationLogDTO {

    private Long id;

    /**
     * Type of communication: EMAIL, SMS, PUSH
     */
    private String type;

    /**
     * Recipient email or phone
     */
    private String recipient;

    /**
     * Subject (for emails)
     */
    private String subject;

    /**
     * Message content
     */
    private String message;

    /**
     * Status: SENT, FAILED, PENDING
     */
    private String status;

    /**
     * Error message if failed
     */
    private String errorMessage;

    /**
     * User who sent the message
     */
    private Long sentByUserId;
    private String sentByUserName;

    /**
     * When the message was sent
     */
    private LocalDateTime sentAt;

    /**
     * When the log was created
     */
    private LocalDateTime createdAt;

    /**
     * Category/purpose of communication
     */
    private String category; // REMINDER, CONFIRMATION, CANCELLATION, CUSTOM, etc.
}
