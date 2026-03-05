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

    /** Loại dữ liệu cần xóa: audit_logs, notifications, sessions, login_attempts */
    private List<String> dataTypes;

    /** Xóa dữ liệu trước ngày này */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime beforeDate;

    /** Có tạo backup trước khi xóa không */
    @Builder.Default
    private Boolean createBackupFirst = true;

    /** Ghi chú */
    private String notes;
}
