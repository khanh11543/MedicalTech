package com.q2k.meditech.dto.timeslot;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for blocking a single slot (with reason)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockSlotRequestDTO {

    /** VACATION, MEETING, EMERGENCY, TRAINING, PERSONAL, OTHER */
    @NotBlank(message = "Block reason is required")
    private String reason;

    /** Free-text note */
    private String note;

    /** Optional: when the block expires */
    private LocalDateTime blockUntil;

    /** Whether to notify the doctor */
    @Builder.Default
    private Boolean notifyDoctor = false;
}
