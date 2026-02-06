package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for Medical Record response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalRecordDTO {

    private Long id;
    private String recordCode;

    // Patient info
    private Long patientId;
    private String patientName;

    // Doctor info
    private Long doctorId;
    private String doctorName;

    // Appointment info
    private Long appointmentId;

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

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
