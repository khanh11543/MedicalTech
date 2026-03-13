package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for Backup progress tracking (FR-BACK-003)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BackupProgressDTO {

    private Long backupId;
    private String backupName;
    private String status;

    /** Progress percentage (0-100) */
    private Integer progressPercent;

    /** Current step being executed */
    private String currentStep;

    /** Estimated time remaining (milliseconds) */
    private Long timeRemaining;

    /** Elapsed time (milliseconds) */
    private Long elapsedTime;

    /** Current size (bytes) */
    private Long currentSize;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startedAt;

    /** Error message (if failed) */
    private String errorMessage;
}
