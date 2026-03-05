package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * DTO for revenue summary statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueSummaryDTO {
    
    // Total revenue in period
    private BigDecimal totalRevenue;
    private Long totalTransactions;
    private BigDecimal averageTransactionValue;
    
    // Net revenue (after refunds)
    private BigDecimal netRevenue;
    private BigDecimal totalRefunds;
    private Long refundCount;
    
    // Growth metrics (if compareWithPrevious=true)
    private BigDecimal previousPeriodRevenue;
    private Double revenueGrowthPercent;
    private Long previousPeriodTransactions;
    private Double transactionGrowthPercent;
    
    // Breakdown by status
    private BigDecimal completedRevenue;
    private BigDecimal pendingRevenue;
    private BigDecimal failedAmount;
    
    // Daily averages
    private BigDecimal dailyAverageRevenue;
    private Double dailyAverageTransactions;
    
    // Peak day info
    private String peakRevenueDay;
    private BigDecimal peakDayRevenue;
    
    // Period info
    private String fromDate;
    private String toDate;
    private Integer totalDays;
}
