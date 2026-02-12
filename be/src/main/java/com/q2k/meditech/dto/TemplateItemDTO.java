package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateItemDTO {
    
    private Long id;
    
    @NotBlank(message = "Medicine name is required")
    private String medicineName;
    
    @NotBlank(message = "Default dosage is required")
    private String defaultDosage;
    
    @NotBlank(message = "Default frequency is required")
    private String defaultFrequency;
    
    private String defaultDuration;
    
    private Integer defaultQuantity;
    
    private String unit;
    
    private String defaultInstructions;
    
    private String notes;
    
    private Integer itemOrder;
}