package com.q2k.meditech.dto.receptionist;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for hourly revenue chart data (Tab 5.4)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HourlyRevenueDTO {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private java.time.LocalDate date;

    private BigDecimal totalRevenue;
    private Integer totalTransactions;

    private List<HourlyData> hourlyData;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HourlyData {
        private Integer hour; // 0-23
        private String label; // "08:00", "09:00", etc.
        private BigDecimal revenue;
        private Integer transactionCount;
        private BigDecimal cashAmount;
        private BigDecimal momoAmount;
    }
}
