package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DeletionLogDTO {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private Long deletionRequestId;
    private String deletedDataSummary;
    private Integer deletedRecordsCount;
    private Long executedBy;
    private String executedByName;
    private LocalDateTime executedDate;
    private String executionNotes;
    private Boolean success;
    private String errorMessage;
    private LocalDateTime createdAt;
}
