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

    /** Total number of caches */
    private Integer totalCaches;

    /** Total number of entries */
    private Long totalEntries;

    /** Total estimated size (bytes) */
    private Long estimatedSize;
    private String estimatedSizeFormatted;

    /** Detail for each cache */
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
