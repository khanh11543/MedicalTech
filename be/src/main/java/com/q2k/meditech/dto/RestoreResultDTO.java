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

    /** Items đã được restore */
    private List<String> restoredItems;

    /** ID backup tạo trước khi restore */
    private Long preRestoreBackupId;

    /** Thời gian thực hiện (milliseconds) */
    private Long duration;
    private String durationFormatted;

    /** Phần trăm hoàn thành */
    private Integer progressPercent;
    private String currentStep;

    /** Có phải test restore không */
    private Boolean isTestRestore;

    /** Logs chi tiết */
    private String logs;

    /** Thông báo lỗi */
    private String errorMessage;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completedAt;

    /** Người thực hiện */
    private Long createdById;
    private String createdByName;
}
