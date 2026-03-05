package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.DeletionRequestStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DataDeletionRequestDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private DeletionRequestStatus status;
    private LocalDate requestedDate;
    private String reason;
    private Long reviewedBy;
    private String reviewedByName;
    private LocalDateTime reviewedDate;
    private String adminNotes;
    private LocalDateTime scheduleDate;
    private Boolean executeImmediately;
    private String rejectionReason;
    private String additionalComments;
    private String requiredInfo;
    private LocalDate infoDeadline;
    private String cancelReason;
    private LocalDateTime cancelledDate;
    private LocalDateTime executedDate;
    private Long executedBy;
    private String executedByName;
    private Boolean notificationSent;
    private LocalDateTime notificationSentDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
