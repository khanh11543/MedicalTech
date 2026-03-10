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

    /** Điểm số sức khỏe tổng thể (0-100) */
    private Integer healthScore;

    /** Trạng thái: HEALTHY, WARNING, CRITICAL */
    private String status;

    /** Tổng kích thước database */
    private Long totalSize;
    private String totalSizeFormatted;

    /** Số bảng */
    private Integer tableCount;

    /** Thông tin chi tiết các bảng */
    private List<TableStatDTO> tableStats;

    /** Thông tin phân mảnh */
    private List<FragmentationInfoDTO> fragmentationInfo;

    /** Đề xuất tối ưu hóa */
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
