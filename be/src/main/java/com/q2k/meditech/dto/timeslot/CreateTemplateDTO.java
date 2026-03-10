package com.q2k.meditech.dto.timeslot;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

/**
 * DTO for creating time slot template
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTemplateDTO {
    
    @NotBlank(message = "Template name is required")
    private String templateName;
    
    private String description;
    
    @NotEmpty(message = "At least one day of week is required")
    private List<String> daysOfWeek;
    
    @NotEmpty(message = "At least one time slot configuration is required")
    @Valid
    private List<TimeSlotConfigDTO> timeSlots;
    
    private List<BreakTimeDTO> breakTimes;
    
    @Builder.Default
    private Integer slotDuration = 30;
    
    @Builder.Default
    private Boolean isActive = true;
}
