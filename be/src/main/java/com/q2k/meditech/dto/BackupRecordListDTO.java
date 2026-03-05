package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for Backup Record list item (FR-BACK-002)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BackupRecordListDTO {

    private Long id;
    private String backupName;
    private String backupType;
    private String status;
    private Long size;
    private String sizeFormatted;
    private Long duration;
    private String durationFormatted;
    private String storageLocation;
    private String includes;
    private Boolean encrypted;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    private String createdByName;
}
