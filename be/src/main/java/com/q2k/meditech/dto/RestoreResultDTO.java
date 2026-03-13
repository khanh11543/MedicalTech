package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Restore result/detail (FR-BACK-004)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestoreResultDTO {

    private Long id;
    private Long backupId;
    private String backupName;
    private String restoreType;
    private String status;

    /** Items that were restored */
    private List<String> restoredItems;

    /** Backup ID created before restore */
    private Long preRestoreBackupId;

    /** Execution time (milliseconds) */
    private Long duration;
    private String durationFormatted;

    /** Completion percentage */
    private Integer progressPercent;
    private String currentStep;

    /** Whether this is a test restore */
    private Boolean isTestRestore;

    /** Detailed logs */
    private String logs;

    /** Error message */
    private String errorMessage;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completedAt;

    /** Created by */
    private Long createdById;
    private String createdByName;
}
