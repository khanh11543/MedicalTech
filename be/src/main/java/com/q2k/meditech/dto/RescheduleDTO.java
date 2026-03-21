package com.q2k.meditech.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RescheduleDTO {

    @NotNull(message = "New appointment date is required")
    @FutureOrPresent(message = "New appointment date must be today or in the future")
    private LocalDate newDate;

    @NotNull(message = "New start time is required")
    private LocalTime newStartTime;

    @NotNull(message = "New end time is required")
    private LocalTime newEndTime;

    private String reason;
}