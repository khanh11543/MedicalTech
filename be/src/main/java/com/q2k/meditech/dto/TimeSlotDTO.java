package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO for Time slot information
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlotDTO {
    private Long id;
    private Long doctorId;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status; // AVAILABLE, BOOKED, BLOCKED, COMPLETED
    private Boolean isAvailable;
}
