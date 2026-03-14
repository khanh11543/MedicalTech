package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for Creating/Updating Consultation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationCreateUpdateDTO {

    private Long appointmentId;
    private String chiefComplaint;
    private String hpi;

    // Vitals
    private BigDecimal temperature;
    private Integer systolic;
    private Integer diastolic;
    private Integer heartRate;
    private Integer respiratoryRate;
    private Integer height;
    private Integer weight;

    private String physicalExam;
    private String diagnosis;
    private String diagnosticCode;
    private String plan;
    private String followUpInstructions;
}
