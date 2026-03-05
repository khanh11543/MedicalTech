package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * DTO for refund statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundStatsDTO {
    
    // Total refunds
    private Long totalRefunds;
    private BigDecimal totalRefundAmount;
    
    // By status counts
    private Long requestedCount;
    private Long approvedCount;
    private Long pendingCount;
    private Long processingCount;
    private Long completedCount;
    private Long failedCount;
    private Long rejectedCount;
    
    // Pending value
    private BigDecimal pendingAmount;
    
    // Completed value
    private BigDecimal completedAmount;
    
    // Refund rate (completed refunds / total payments in period)
    private Double refundRate;
    
    // By payment method
    private Map<String, Long> refundsByPaymentMethod;
    private Map<String, BigDecimal> refundAmountByPaymentMethod;
    
    // Average processing time (in hours)
    private Double averageProcessingTime;
    
    // Period info
    private String fromDate;
    private String toDate;
}
