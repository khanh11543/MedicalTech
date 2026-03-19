package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for recently seen patients in the "Recent" tab
 * Optimized for quick access and follow-up support
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorPatientRecentDTO {

    // Patient basic info
    private Long id;
    private String fullName;
    private String email;
    private String phone;

    // Recent visit info
    private LocalDateTime lastVisitDate;
    private Integer daysSinceLastVisit;
    private String lastVisitReason;
    private String lastVisitNotes;

    // Quick clinical info
    private String allergies;
    private String medicalHistory;

    // Status
    private Boolean hasUpcomingAppointment;
    private LocalDate nextAppointmentDate;

    // Quick action support
    private Long lastAppointmentId;
    private Long lastMedicalRecordId;
}
