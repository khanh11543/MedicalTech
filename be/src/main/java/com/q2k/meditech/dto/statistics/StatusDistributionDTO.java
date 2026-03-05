package com.q2k.meditech.dto.statistics;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for appointment status distribution (pie chart data)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusDistributionDTO {
    
    private LocalDate from;
    private LocalDate to;
    private Long doctorId;
    
    private Long total;
    private List<StatusCount> distribution;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StatusCount {
        private String status;
        private String statusDisplayName;
        private Long count;
        private BigDecimal percentage;
        private String color; // For chart display
    }
}
