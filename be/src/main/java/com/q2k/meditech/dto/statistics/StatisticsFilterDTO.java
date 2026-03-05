package com.q2k.meditech.dto.statistics;

import lombok.*;

import java.time.LocalDate;

/**
 * Filter DTO for statistics queries
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatisticsFilterDTO {
    
    private LocalDate from;
    private LocalDate to;
    private Long doctorId;
    private String groupBy;     // DAY, WEEK, MONTH
    private Integer top;        // For top N queries
}
