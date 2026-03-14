package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Cleanup request (FR-BACK-006)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CleanupRequestDTO {

    /** Data types to delete: audit_logs, notifications, sessions, login_attempts */
    private List<String> dataTypes;

    /** Delete data before this date */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime beforeDate;

    /** Whether to create a backup before deletion */
    @Builder.Default
    private Boolean createBackupFirst = true;

    /** Notes */
    private String notes;
}
