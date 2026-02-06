package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDate;

/**
 * DTO for updating a Medical Record (Doctor use)
 * All fields are optional - only non-null fields will be updated
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalRecordUpdateDTO {

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
