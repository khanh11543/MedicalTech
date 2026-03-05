package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.DeletionRequestStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DeletionReviewDetailDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private DeletionRequestStatus status;
    private LocalDate requestedDate;
    private String reason;

    // Admin review info
    private Long reviewedBy;
    private String reviewedByName;
    private LocalDateTime reviewedDate;
    private String adminNotes;

    // Schedule info
    private LocalDateTime scheduleDate;
    private Boolean executeImmediately;

    // Rejection info
    private String rejectionReason;
    private String additionalComments;

    // Data summary counts
    private Integer totalRecords;
    private Integer appointmentCount;
    private Integer prescriptionCount;
    private Integer paymentCount;
    private Integer reviewCount;

    // Account info
    private LocalDateTime accountCreatedDate;
    private LocalDateTime lastLoginDate;
    private String userRole;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
