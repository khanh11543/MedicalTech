package com.q2k.meditech.dto.receptionist;

import lombok.*;

/**
 * Clinical summary for receptionist view — counts only, NO sensitive type info.
 * Receptionist cannot see diagnoses, prescriptions content, etc.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientClinicalSummaryDTO {

    private Long patientId;
    private Long totalMedicalRecords;
    private Long totalPrescriptions;
    private Long totalCompletedVisits;

    /**
     * Clinical records exist but receptionist cannot view them.
     * This flag indicates "clinical existence" is available.
     */
    private Boolean hasClinicalData;
}
