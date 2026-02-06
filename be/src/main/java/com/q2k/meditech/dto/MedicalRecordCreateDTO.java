package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

/**
 * DTO for creating a new Medical Record (Doctor use)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalRecordCreateDTO {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long appointmentId;

    @NotNull(message = "Visit date is required")
    private LocalDate visitDate;

    private String chiefComplaint;
    private String presentIllness;
    private Object vitalSigns;
    private String physicalExam;
    private String diagnosis;
    private String diagnosisCode;
    private String treatmentPlan;
    private String prescription;
    private Object labResults;
    private LocalDate followUpDate;
    private String followUpNotes;
    private Object attachments;
    private Boolean isConfidential;
}
