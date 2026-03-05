package com.q2k.meditech.dto.timeslot;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

/**
 * DTO for bulk unblocking time slots
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkUnblockSlotsDTO {
    
    @NotEmpty(message = "At least one time slot ID is required")
    private List<Long> timeSlotIds;
    
    private String reason;
}
