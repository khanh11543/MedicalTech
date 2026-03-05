package com.q2k.meditech.dto.timeslot;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for bulk blocking time slots
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkBlockSlotsDTO {

    @NotEmpty(message = "At least one time slot ID is required")
    private List<Long> timeSlotIds;

    /** VACATION, MEETING, EMERGENCY, TRAINING, PERSONAL, OTHER */
    @NotBlank(message = "Block reason is required")
    private String reason;

    /** Free-text note */
    private String note;

    private LocalDateTime blockUntil;

    /** Notify doctors about block? */
    @Builder.Default
    private Boolean notifyDoctor = false;
}
