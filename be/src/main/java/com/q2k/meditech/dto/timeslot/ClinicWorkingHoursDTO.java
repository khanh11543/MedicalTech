package com.q2k.meditech.dto.timeslot;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalTime;

/**
 * DTO for clinic working hours per day-of-week
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicWorkingHoursDTO {

    private Long id;

    /** 1=Monday … 7=Sunday */
    @NotNull(message = "Day of week is required")
    private Integer dayOfWeek;

    private String dayName;

    @NotNull(message = "Open time is required")
    private LocalTime openTime;

    @NotNull(message = "Close time is required")
    private LocalTime closeTime;

    @Builder.Default
    private Boolean isOpen = true;
}
