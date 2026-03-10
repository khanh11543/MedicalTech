package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for overall template usage statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateStatsDTO {

    private Long totalPrescriptions;
    private Long totalDoctors;
    private Long totalPatients;
    private Long totalMedicationsUsed;
    private Long averageMedicationsPerPrescription;

    private LocalDate periodStart;
    private LocalDate periodEnd;

    // Breakdown by status
    private Long activePrescriptions;
    private Long expiredPrescriptions;

    // Trends
    private Double prescriptionGrowthRate; // Percentage change from previous period
    private String mostActiveDoctorName;
    private Long mostActiveDoctorPrescriptionCount;
}
