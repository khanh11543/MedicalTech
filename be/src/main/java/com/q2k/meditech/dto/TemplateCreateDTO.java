package com.q2k.meditech.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateCreateDTO {
    
    @NotBlank(message = "Template name is required")
    private String templateName;
    
    private String description;
    
    private String diagnosisTemplate; // Diagnosis template
    
    private String notesTemplate; // Notes template
    
    private Integer defaultFollowUpDays; // Default follow-up days
    
    @NotEmpty(message = "Template must have at least one item")
    @Valid
    private List<TemplateItemDTO> items;
}