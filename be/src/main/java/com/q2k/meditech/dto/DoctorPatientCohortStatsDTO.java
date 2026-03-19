package com.q2k.meditech.dto;

import lombok.*;

/**
 * DTO for doctor's patient cohort statistics
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorPatientCohortStatsDTO {

    // Total counts
    private Long totalPatients;
    private Long patientsInLast30Days;
    private Long patientsInLast90Days;

    // Clinical flags
    private Long patientsWithAllergies;
    private Long patientsWithChronicConditions;
    private Long highRiskPatients;

    // Prescription stats
    private Long totalPrescriptions;
    private Long activePrescriptions;
    private Long patientsWithActivePrescriptions;

    // Appointment stats
    private Long totalAppointments;
    private Long completedAppointments;
    private Long pendingAppointments;
    private Long upcomingAppointments;

    // Additional metrics
    private Double averageVisitsPerPatient;
    private Long patientsWithFollowUp;
}
