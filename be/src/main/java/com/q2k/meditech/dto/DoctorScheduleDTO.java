package com.q2k.meditech.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalTime;

/**
 * DTO for Doctor Schedule (Weekly recurring schedule)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorScheduleDTO {
    
    private Long id;
    
    private Long doctorId;
    
    @NotNull(message = "Day of week is required")
    @Min(value = 0, message = "Day of week must be between 0 (Sunday) and 6 (Saturday)")
    @Max(value = 6, message = "Day of week must be between 0 (Sunday) and 6 (Saturday)")
    private Integer dayOfWeek; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    @NotNull(message = "Start time is required")
    private LocalTime startTime;
    
    @NotNull(message = "End time is required")
    private LocalTime endTime;
    
    @Min(value = 10, message = "Slot duration must be at least 10 minutes")
    @Max(value = 120, message = "Slot duration must not exceed 120 minutes")
    private Integer slotDuration = 30; // in minutes
    
    @Min(value = 1, message = "Max patients must be at least 1")
    @Max(value = 100, message = "Max patients must not exceed 100")
    private Integer maxPatients = 20;
    
    private Boolean isActive = true;
    
    // Helper method to get day name
    public String getDayName() {
        if (dayOfWeek == null) return null;
        String[] days = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
        return (dayOfWeek >= 0 && dayOfWeek <= 6) ? days[dayOfWeek] : null;
    }
}
