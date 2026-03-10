package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for template usage statistics by doctor
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorTemplateStatsDTO {

    private Long doctorId;
    private String doctorName;
    private String specialization;

    private Long totalPrescriptions;
    private Long uniquePatients;
    private Long totalMedications;
    private Double averageMedicationsPerPrescription;

    private Long activePrescriptions;
    private Long expiredPrescriptions;

    private String topMedicationPrescribed;
    private Long topMedicationCount;
}
