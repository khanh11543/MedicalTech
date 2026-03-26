package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionItemDTO {
    
    private Long id;

    private Long medicationId; // FK to Medication (optional, used for inventory deduction)

    @NotBlank(message = "Medicine name is required")
    private String medicineName;
    
    @NotBlank(message = "Dosage is required")
    private String dosage;
    
    @NotBlank(message = "Frequency is required")
    private String frequency;
    
    private String duration;
    
    private Integer quantity;
    
    private String unit;
    
    private String instructions;
    
    private String notes;

    // Dose schedule per session
    private Double morningDose;
    private Double noonDose;
    private Double afternoonDose;
    private Double eveningDose;
    
    private Integer itemOrder;

    private java.math.BigDecimal price; // Unit price snapshot
}