package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for detailed patient information shown when doctor clicks on a patient
 * Contains complete medical history, visit records, and prescriptions for the patient
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorPatientDetailDTO {

    // Patient basic info
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private Integer age;
    private String gender;
    private String address;
    private String bloodGroup;

    // Medical info
    private String allergies;
    private String medicalHistory;
    private String insuranceNumber;
    private String emergencyContact;

    // Visit history summary
    private Integer totalVisitsWithThisDoctor;
    private LocalDateTime firstVisitDate;
    private LocalDateTime lastVisitDate;
    private String lastVisitReason;
    private String lastVisitNotes;

    // Medical records summary
    private Integer totalMedicalRecords;
    private List<MedicalRecordSummaryDTO> recentMedicalRecords; // Last 5

    // Prescriptions summary
    private Integer totalPrescriptions;
    private Integer activePrescriptions;
    private List<PrescriptionSummaryDTO> recentPrescriptions; // Last 5

    // Appointments
    private List<AppointmentSummaryDTO> upcomingAppointments; // Next 3

    // Clinical flags
    private List<String> allergyList;
    private List<String> chronicConditionsList;

    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Summary nested DTOs
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MedicalRecordSummaryDTO {
        private Long id;
        private LocalDate visitDate;
        private String chiefComplaint;
        private String diagnosis;
        private String treatmentPlan;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PrescriptionSummaryDTO {
        private Long id;
        private String prescriptionCode;
        private LocalDate prescriptionDate;
        private String diagnosis;
        private String status;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AppointmentSummaryDTO {
        private Long id;
        private String appointmentCode;
        private LocalDate appointmentDate;
        private String appointmentType;
        private String status;
        private String reasonForVisit;
    }
}
