package com.q2k.meditech.dto;

import lombok.*;

import java.util.List;

/**
 * DTO for Disk Usage information (FR-BACK-006)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiskUsageDTO {

    /** Tổng dung lượng ổ đĩa (bytes) */
    private Long totalSpace;
    private String totalSpaceFormatted;

    /** Dung lượng đã sử dụng (bytes) */
    private Long usedSpace;
    private String usedSpaceFormatted;

    /** Dung lượng còn trống (bytes) */
    private Long freeSpace;
    private String freeSpaceFormatted;

    /** Phần trăm sử dụng */
    private Double usagePercent;

    /** Trạng thái: OK, WARNING (>80%), CRITICAL (>90%) */
    private String status;

    /** Chi tiết theo thư mục */
    private List<DirectoryUsageDTO> directories;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DirectoryUsageDTO {
        private String path;
        private String name;
        private Long size;
        private String sizeFormatted;
        private Long fileCount;
        private Double percentOfTotal;
    }
}
