package com.q2k.meditech.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionCreateDTO {
    
    @NotNull(message = "Patient ID is required")
    private Long patientId;
    
    private Long appointmentId; // Optional - linked to the appointment
    
    private LocalDate prescriptionDate; // If null, current date will be used

    @Size(max = 5000, message = "Diagnosis must not exceed 5000 characters")
    private String diagnosis; // Diagnosis

    @Size(max = 5000, message = "Notes must not exceed 5000 characters")
    private String notes; // Notes
    
    private LocalDate followUpDate; // Follow-up date
    
    @NotEmpty(message = "Prescription must have at least one item")
    @Valid
    private List<PrescriptionItemDTO> items; // List of medicines
}