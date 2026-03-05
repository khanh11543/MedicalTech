package com.q2k.meditech.dto.timeslot;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for bulk creating time slots
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkCreateSlotsDTO {

    @NotEmpty(message = "At least one doctor ID is required")
    private List<Long> doctorIds;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotEmpty(message = "At least one day of week is required")
    private List<String> daysOfWeek; // MON, TUE, WED, THU, FRI, SAT, SUN

    @NotEmpty(message = "At least one time slot configuration is required")
    @Valid
    private List<TimeSlotConfigDTO> timeSlots;

    private List<BreakTimeDTO> breakTimes;

    @Builder.Default
    private Integer slotDuration = 30; // minutes

    /**
     * SKIP_CONFLICTS (default): skip overlapping existing slots
     * REPLACE_AVAILABLE: delete existing AVAILABLE slots in range, then create (never touches BOOKED/BLOCKED)
     */
    @Builder.Default
    private String conflictMode = "SKIP_CONFLICTS";

    /** If true, only return preview (no actual creation) */
    @Builder.Default
    private Boolean previewOnly = false;
}
