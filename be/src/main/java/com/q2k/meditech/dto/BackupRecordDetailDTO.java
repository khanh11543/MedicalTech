package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for Backup Record detail view (FR-BACK-002)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BackupRecordDetailDTO {

    private Long id;
    private String backupName;
    private String backupType;
    private String status;

    // ========== SIZE & DURATION ==========
    private Long size;
    private String sizeFormatted;
    private Long duration;
    private String durationFormatted;

    // ========== STORAGE ==========
    private String storagePath;
    private String storageLocation;

    // ========== CONTENT ==========
    private String includes;
    private Boolean encrypted;
    private String checksum;
    private String metadata;

    // ========== TIMING ==========
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    // ========== PROGRESS (if in progress) ==========
    private Integer progressPercent;
    private String currentStep;

    // ========== ERROR (if failed) ==========
    private String errorMessage;

    // ========== USER ==========
    private Long createdById;
    private String createdByName;

    // ========== SCHEDULE (if from scheduled) ==========
    private Long scheduleId;
}
