package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for time-series revenue chart data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueChartDTO {
    
    // Summary for the period
    private BigDecimal totalRevenue;
    private Long totalTransactions;
    private BigDecimal averageRevenue;
    
    // Chart data points
    private List<DataPoint> dataPoints;
    
    // Grouping info
    private String groupBy; // DAY, WEEK, MONTH
    private String fromDate;
    private String toDate;
    
    // Filter info
    private Long doctorId;
    private String doctorName;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DataPoint {
        private String label; // Date/Week/Month label
        private String period; // yyyy-MM-dd or yyyy-Www or yyyy-MM
        private BigDecimal revenue;
        private Long transactionCount;
        private BigDecimal refundAmount;
        private BigDecimal netRevenue;
        
        // Comparison with previous period (optional)
        private BigDecimal previousRevenue;
        private Double growthPercent;
    }
}
