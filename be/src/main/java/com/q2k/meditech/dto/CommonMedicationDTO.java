package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for common medication statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommonMedicationDTO {

    private String medicationName;
    private String genericName;
    private String category;

    private Long prescriptionCount;
    private Long totalQuantity;
    private Long uniqueDoctors;
    private Long uniquePatients;

    private String mostCommonDosage;
    private String mostCommonFrequency;
    private String mostCommonDuration;

    private Double percentageOfTotal; // Percentage of all prescriptions
}
