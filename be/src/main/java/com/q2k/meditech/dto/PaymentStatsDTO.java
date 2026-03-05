package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * DTO for Payment Statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentStatsDTO {

    // ========== TODAY'S REVENUE ==========
    private BigDecimal todayRevenue;
    private Integer todayTransactionCount;
    private BigDecimal todayAverageTransaction;

    // ========== THIS MONTH'S REVENUE ==========
    private BigDecimal monthRevenue;
    private BigDecimal lastMonthRevenue;
    private Double monthGrowthPercentage;
    private Integer monthTransactionCount;

    // ========== PAYMENT METHODS DISTRIBUTION ==========
    private List<PaymentMethodStats> paymentMethodsDistribution;

    // ========== PENDING PAYMENTS ==========
    private Integer pendingCount;
    private BigDecimal pendingAmount;

    // ========== REFUND STATISTICS ==========
    private BigDecimal totalRefundedThisMonth;
    private Integer refundCountThisMonth;
    private Double refundRatePercentage;

    // ========== STATUS BREAKDOWN ==========
    private Map<String, Integer> statusCounts;

    // ========== DATE RANGE INFO ==========
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fromDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate toDate;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentMethodStats {
        private String method;
        private Integer count;
        private BigDecimal amount;
        private Double percentage;
    }
}
