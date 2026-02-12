package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateDTO {
    
    private Long id;
    
    // Doctor info
    private Long doctorId;
    private String doctorName;
    
    // Template details
    private String templateName;
    private String description;
    private String diagnosisTemplate;
    private String notesTemplate;
    private Integer defaultFollowUpDays;
    private Boolean isActive;
    private Integer usageCount;
    
    // Items
    private List<TemplateItemDTO> items;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}