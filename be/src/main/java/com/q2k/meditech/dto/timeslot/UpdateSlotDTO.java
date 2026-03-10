package com.q2k.meditech.dto.timeslot;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalTime;

/**
 * DTO for editing an existing time slot (only AVAILABLE / BLOCKED)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSlotDTO {

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    /** Optional note */
    private String note;

    /** If true, skip the "high risk change" confirmation on FE (caller asserts awareness) */
    @Builder.Default
    private Boolean confirmHighRisk = false;
}
