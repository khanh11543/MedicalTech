package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyTemplateDTO {
    
    @NotNull(message = "Patient ID is required")
    private Long patientId;
    
    private Long appointmentId; // Optional - linked to a visit
    
    private LocalDate prescriptionDate; // If null, uses current date
    
    // Can override default values from template
    private String diagnosis; // If null, uses diagnosisTemplate
    
    private String notes; // If null, uses notesTemplate
    
    private LocalDate followUpDate; // If null, calculated from defaultFollowUpDays
}