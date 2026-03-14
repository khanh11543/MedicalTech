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

    /** Total disk space (bytes) */
    private Long totalSpace;
    private String totalSpaceFormatted;

    /** Used space (bytes) */
    private Long usedSpace;
    private String usedSpaceFormatted;

    /** Free space (bytes) */
    private Long freeSpace;
    private String freeSpaceFormatted;

    /** Usage percentage */
    private Double usagePercent;

    /** Status: OK, WARNING (>80%), CRITICAL (>90%) */
    private String status;

    /** Details by directory */
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
