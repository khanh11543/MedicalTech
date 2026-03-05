package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {

    private Long id;
    private String title;
    private String message;

    /** High-level type: APPOINTMENT, PAYMENT, PATIENT, SYSTEM */
    private String type;

    /** Detailed sub-category: NEW_BOOKING, PAYMENT_FAILED, etc. */
    private String category;

    /** Priority: INFO, IMPORTANT, URGENT */
    private String priority;

    private String referenceType;
    private Long referenceId;
    private Boolean isRead;
    private LocalDateTime readAt;

    /** Whether an URGENT notification has been acknowledged */
    private Boolean acknowledged;
    private LocalDateTime acknowledgedAt;

    private Map<String, Object> sentVia;
    private Boolean emailSent;
    private Boolean smsSent;
    private Boolean pushSent;
    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
}
