package com.q2k.meditech.dto.timeslot;

import lombok.*;

import java.time.LocalDate;

/**
 * Filter DTO for time slot queries
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlotFilterDTO {

    private Long doctorId;
    private LocalDate date;
    private LocalDate from;
    private LocalDate to;
    private String status;        // AVAILABLE, BOOKED, BLOCKED, COMPLETED, RESERVED
    private String source;        // MANUAL, BULK, TEMPLATE
    private String timeOfDay;     // MORNING, AFTERNOON (convenience filter)

    @Builder.Default
    private Integer pageNumber = 0;

    @Builder.Default
    private Integer pageSize = 50;
}
