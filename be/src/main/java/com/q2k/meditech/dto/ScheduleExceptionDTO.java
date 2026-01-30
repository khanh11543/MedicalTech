package com.q2k.meditech.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO for Schedule Exception (OFF/MODIFIED/EXTRA days)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleExceptionDTO {
    
    private Long id;
    
    private Long doctorId;
    
    @NotNull(message = "Exception date is required")
    @FutureOrPresent(message = "Exception date must be today or in the future")
    private LocalDate exceptionDate;
    
    @NotBlank(message = "Exception type is required")
    @Pattern(regexp = "OFF|MODIFIED|EXTRA", message = "Exception type must be OFF, MODIFIED, or EXTRA")
    private String exceptionType;
    
    // Required for MODIFIED and EXTRA types
    private LocalTime startTime;
    
    // Required for MODIFIED and EXTRA types
    private LocalTime endTime;
    
    @Size(max = 255, message = "Reason must not exceed 255 characters")
    private String reason;
}
