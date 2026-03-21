package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for patients with clinical flags in the "Flags" tab
 * Used to highlight patients with allergies or chronic conditions for clinical safety
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorPatientFlagsDTO {

    // Patient basic info
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String bloodGroup;

    // Clinical flags
    private List<String> allergies;
    private List<String> chronicConditions;

    // Risk level
    @Builder.Default
    private String riskLevel = "LOW"; // LOW, MEDIUM, HIGH based on severity of allergies/conditions

    // Last visit
    private LocalDateTime lastVisitDate;
    private String lastVisitNotes;

    // Prescriptions
    private Boolean hasActivePrescriptions;
    private Integer activePrescriptionsCount;

    // Medication risk flag (polypharmacy: >= 2 active prescriptions)
    private Boolean hasMedicationRisk;
    private String medicationRiskNote;

    // Metadata
    private LocalDateTime updatedAt;
}
