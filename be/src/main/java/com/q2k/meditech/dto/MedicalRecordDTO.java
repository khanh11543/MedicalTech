package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for Medical Record response (patient-facing)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalRecordDTO {

    private Long id;
    private String recordCode;

    // Doctor info
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;

    // Appointment info
    private Long appointmentId;

    @JsonFormat(pattern = "yyyy-MM-dd")
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

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate followUpDate;
    private String followUpNotes;

    private Object attachments;
    private Boolean isConfidential;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
