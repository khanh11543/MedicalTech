package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for revenue distribution by payment method
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentMethodRevenueDTO {
    
    private BigDecimal totalRevenue;
    private Long totalTransactions;
    
    // Breakdown by method
    private List<MethodBreakdown> methods;
    
    // Period info
    private String fromDate;
    private String toDate;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MethodBreakdown {
        private String method; // CASH, MOMO, VNPAY, ZALOPAY, BANK_TRANSFER, CARD, INSURANCE
        private String displayName;
        private BigDecimal revenue;
        private Long transactionCount;
        private Double percentage; // % of total revenue
        private BigDecimal averageAmount;
        
        // Success/failure metrics
        private Long successfulTransactions;
        private Long failedTransactions;
        private Double successRate;
    }
}
