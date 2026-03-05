package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Detailed Prescription DTO with all information including patient, doctor, appointment
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionDetailDTO {

    // Prescription info
    private Long id;
    private String prescriptionCode;
    private LocalDate prescribedDate;
    private LocalDate expiryDate;
    private String status; // ACTIVE, EXPIRED
    private String diagnosis;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Patient info
    private Long patientId;
    private String patientName;
    private Integer patientAge;
    private String patientGender;
    private String patientPhone;
    private String patientEmail;
    private String patientAddress;
    private String medicalRecordNumber;

    // Doctor info
    private Long doctorId;
    private String doctorName;
    private String doctorEmail;
    private String doctorSpecialization;
    private String doctorLicenseNumber;
    private String doctorSignature;

    // Appointment info (if linked)
    private Long appointmentId;
    private String appointmentCode;
    private LocalDateTime appointmentDate;

    // Medications list
    private List<PrescriptionItemDTO> medications;

    // Additional info
    private String generalNotes;
}
