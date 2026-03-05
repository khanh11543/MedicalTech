package com.q2k.meditech.dto.timeslot;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

/**
 * DTO for creating / updating a clinic holiday
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicHolidayDTO {

    private Long id;

    @NotNull(message = "Holiday date is required")
    private LocalDate holidayDate;

    @NotBlank(message = "Holiday name is required")
    private String name;

    private String description;

    @Builder.Default
    private Boolean autoBlockSlots = true;

    @Builder.Default
    private Boolean preventSlotCreation = true;

    @Builder.Default
    private Boolean isActive = true;
}
