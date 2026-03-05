package com.q2k.meditech.dto.timeslot;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO for creating a single time slot (manual creation)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSingleSlotDTO {

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @NotNull(message = "Slot date is required")
    private LocalDate slotDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    /** Optional note */
    private String note;
}
