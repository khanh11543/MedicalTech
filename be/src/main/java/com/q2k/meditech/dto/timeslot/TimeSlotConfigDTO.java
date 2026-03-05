package com.q2k.meditech.dto.timeslot;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalTime;

/**
 * Configuration for a single time slot
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlotConfigDTO {
    
    @NotNull(message = "Start time is required")
    private LocalTime startTime;
    
    @NotNull(message = "End time is required")
    private LocalTime endTime;
}
