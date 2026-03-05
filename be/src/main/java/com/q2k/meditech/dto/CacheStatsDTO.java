package com.q2k.meditech.dto;

import lombok.*;

import java.util.List;

/**
 * DTO for Cache statistics (FR-BACK-006)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CacheStatsDTO {

    /** Tổng số cache */
    private Integer totalCaches;

    /** Tổng số entries */
    private Long totalEntries;

    /** Tổng kích thước ước tính (bytes) */
    private Long estimatedSize;
    private String estimatedSizeFormatted;

    /** Chi tiết từng cache */
    private List<CacheDetailDTO> caches;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CacheDetailDTO {
        private String cacheName;
        private Long entryCount;
        private Long estimatedSize;
        private String estimatedSizeFormatted;
        private Double hitRate;
        private Long hitCount;
        private Long missCount;
    }
}
