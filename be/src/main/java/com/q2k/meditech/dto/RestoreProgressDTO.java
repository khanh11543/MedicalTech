package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for Restore progress tracking (FR-BACK-004)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestoreProgressDTO {

    private Long restoreId;
    private Long backupId;
    private String backupName;
    private String restoreType;
    private String status;

    /** Progress percentage (0-100) */
    private Integer progressPercent;

    /** Current step */
    private String currentStep;

    /** Estimated time remaining (milliseconds) */
    private Long timeRemaining;

    /** Elapsed time (milliseconds) */
    private Long elapsedTime;

    /** Whether this is a test restore */
    private Boolean isTestRestore;

    /** Backup ID created before restore */
    private Long preRestoreBackupId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startedAt;

    /** Error message (if failed) */
    private String errorMessage;
}
