package com.q2k.meditech.dto;

import lombok.*;

import java.util.List;

/**
 * DTO for Database Health overview (FR-BACK-006)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatabaseHealthDTO {

    /** Overall health score (0-100) */
    private Integer healthScore;

    /** Status: HEALTHY, WARNING, CRITICAL */
    private String status;

    /** Total database size */
    private Long totalSize;
    private String totalSizeFormatted;

    /** Number of tables */
    private Integer tableCount;

    /** Detailed table information */
    private List<TableStatDTO> tableStats;

    /** Fragmentation information */
    private List<FragmentationInfoDTO> fragmentationInfo;

    /** Optimization recommendations */
    private List<String> recommendations;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TableStatDTO {
        private String tableName;
        private Long rows;
        private Long dataLength;
        private Long indexLength;
        private Long totalSize;
        private String totalSizeFormatted;
        private String engine;
        private String collation;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FragmentationInfoDTO {
        private String tableName;
        private Long dataLength;
        private Long dataFree;
        private Double fragmentationPercent;
        private String status; // OK, WARNING, CRITICAL
    }
}
