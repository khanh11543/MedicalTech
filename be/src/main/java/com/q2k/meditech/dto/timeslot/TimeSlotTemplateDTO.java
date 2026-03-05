package com.q2k.meditech.dto.timeslot;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for time slot template
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlotTemplateDTO {
    
    private Long id;
    private String templateName;
    private String description;
    private List<String> daysOfWeek;
    private List<TimeSlotConfigDTO> timeSlots;
    private List<BreakTimeDTO> breakTimes;
    private Integer slotDuration;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
