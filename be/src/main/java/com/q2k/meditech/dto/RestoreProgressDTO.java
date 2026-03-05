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

    /** Phần trăm tiến trình (0-100) */
    private Integer progressPercent;

    /** Bước hiện tại */
    private String currentStep;

    /** Thời gian còn lại (ước tính, milliseconds) */
    private Long timeRemaining;

    /** Thời gian đã chạy (milliseconds) */
    private Long elapsedTime;

    /** Có phải test restore không */
    private Boolean isTestRestore;

    /** ID backup được tạo trước khi restore */
    private Long preRestoreBackupId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startedAt;

    /** Thông báo lỗi (nếu failed) */
    private String errorMessage;
}
