package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionDTO {
    
    private Long id;
    
    // Patient info
    private Long patientId;
    private String patientName;
    private String patientPhone;
    private LocalDate patientDateOfBirth;
    private String patientGender;
    
    // Doctor info
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    
    // Appointment info (if linked)
    private Long appointmentId;
    private LocalDate appointmentDate;
    
    // Prescription details
    private String prescriptionCode;
    private LocalDate prescriptionDate;
    private LocalDate expiryDate;
    private String status; // ACTIVE, EXPIRED, CANCELLED
    private String diagnosis;
    private String notes;
    private LocalDate followUpDate;
    private Boolean isActive;
    
    // Items
    private List<PrescriptionItemDTO> items;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}