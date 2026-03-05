package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Cleanup preview (FR-BACK-006)
 * Hiển thị dữ liệu sẽ bị xóa trước khi thực hiện
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CleanupPreviewDTO {

    /** Tổng số bản ghi sẽ bị xóa */
    private Long totalRecords;

    /** Tổng dung lượng sẽ được giải phóng (bytes) */
    private Long estimatedSpaceSaved;
    private String estimatedSpaceSavedFormatted;

    /** Xóa dữ liệu trước ngày này */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime beforeDate;

    /** Chi tiết từng loại dữ liệu */
    private List<CleanupItemDTO> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CleanupItemDTO {
        /** Loại dữ liệu: audit_logs, notifications, sessions, login_attempts */
        private String dataType;
        private String displayName;
        private Long recordCount;
        private Long estimatedSize;
        private String estimatedSizeFormatted;
        /** Bản ghi cũ nhất */
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime oldestRecord;
        /** Bản ghi mới nhất trong phạm vi xóa */
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime newestRecord;
    }
}
