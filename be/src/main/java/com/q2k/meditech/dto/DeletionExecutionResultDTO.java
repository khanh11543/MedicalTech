package com.q2k.meditech.dto;

import lombok.*;

import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DeletionExecutionResultDTO {
    private Long deletionRequestId;
    private Long userId;
    private String userEmail;
    private Boolean success;
    private Integer totalDeletedRecords;
    private Map<String, Integer> deletedRecordsByType;
    private String executionNotes;
    private String errorMessage;
}
