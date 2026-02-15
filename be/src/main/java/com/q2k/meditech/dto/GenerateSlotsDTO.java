package com.q2k.meditech.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * DTO for generating time slots based on schedule and exceptions
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateSlotsDTO {
    
    @NotNull(message = "Start date is required")
    @FutureOrPresent(message = "Start date must be today or in the future")
    private LocalDate startDate;
    
    @NotNull(message = "End date is required")
    @Future(message = "End date must be in the future")
    private LocalDate endDate;
    
    // Optional: Override slot duration from schedule (in minutes)
    @Min(value = 10, message = "Slot duration must be at least 10 minutes")
    @Max(value = 120, message = "Slot duration must not exceed 120 minutes")
    private Integer slotDuration;
    
    // Whether to overwrite existing slots (default: false)
    @Builder.Default
    private Boolean overwriteExisting = false;
}
