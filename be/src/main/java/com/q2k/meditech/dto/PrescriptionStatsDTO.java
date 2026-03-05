package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for prescription statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionStatsDTO {

    // Overall stats
    private Long totalPrescriptions;
    private Long activePrescriptions;
    private Long expiredPrescriptions;
    private Long cancelledPrescriptions;

    // Most prescribed medications
    private List<MedicationStatsDTO> mostPrescribedMedications;

    /**
     * Nested DTO for medication statistics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MedicationStatsDTO {
        private String medicationName;
        private String genericName;
        private Long prescriptionCount;
        private Long totalQuantity;
    }
}
