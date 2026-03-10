package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for refund impact analysis
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundAnalysisDTO {

    private BigDecimal totalRefunded;
    private Long refundCount;
    private BigDecimal averageRefundAmount;
    private Double refundRate; // % of completed transactions that were refunded

    private List<ReasonBreakdown> reasonDistribution;
    private List<TrendPoint> trendData;
    private List<RateTrendPoint> refundRateTrend;

    private String fromDate;
    private String toDate;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReasonBreakdown {
        private String reason;
        private Long count;
        private BigDecimal amount;
        private Double percentage; // % of total refund count
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrendPoint {
        private String date;
        private BigDecimal amount;
        private Long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RateTrendPoint {
        private String date;
        private Double rate;
        private Long completedCount;
        private Long refundCount;
    }
}
