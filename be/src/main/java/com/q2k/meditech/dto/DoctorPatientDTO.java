package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for doctor's patient information in "My Patients" tab
 * Contains key patient details, allergies, chronic conditions, and visit summary
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorPatientDTO {

    // Patient basic info
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;
    private String bloodGroup;

    // Medical info relevant to doctor
    private String allergies;
    private String medicalHistory; // Contains chronic conditions

    // Visit summary
    private Integer totalVisits;
    private LocalDateTime lastVisitDate;
    private String lastVisitReason;

    // Prescription summary
    private Integer activePrescriptionsCount;
    private Integer totalPrescriptionsCount;
    private LocalDate mostRecentPrescriptionDate;

    // Risk flags
    private List<String> allergyList; // Parsed from allergies field
    private List<String> chronicConditions; // Parsed from medicalHistory field
    private Boolean hasUpcomingAppointment;
    private LocalDate nextAppointmentDate; // Date of the nearest upcoming appointment

    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
