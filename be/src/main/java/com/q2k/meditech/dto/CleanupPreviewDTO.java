package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Cleanup preview (FR-BACK-006)
 * Preview data to be deleted before execution
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CleanupPreviewDTO {

    /** Total number of records to be deleted */
    private Long totalRecords;

    /** Total space to be freed (bytes) */
    private Long estimatedSpaceSaved;
    private String estimatedSpaceSavedFormatted;

    /** Delete data before this date */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime beforeDate;

    /** Details for each data type */
    private List<CleanupItemDTO> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CleanupItemDTO {
        /** Data type: audit_logs, notifications, sessions, login_attempts */
        private String dataType;
        private String displayName;
        private Long recordCount;
        private Long estimatedSize;
        private String estimatedSizeFormatted;
        /** Oldest record */
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime oldestRecord;
        /** Newest record within deletion range */
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime newestRecord;
    }
}
