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

    /** Phần trăm tiến trình (0-100) */
    private Integer progressPercent;

    /** Bước hiện tại đang thực hiện */
    private String currentStep;

    /** Thời gian còn lại (ước tính, milliseconds) */
    private Long timeRemaining;

    /** Thời gian đã chạy (milliseconds) */
    private Long elapsedTime;

    /** Kích thước hiện tại (bytes) */
    private Long currentSize;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startedAt;

    /** Thông báo lỗi (nếu failed) */
    private String errorMessage;
}
