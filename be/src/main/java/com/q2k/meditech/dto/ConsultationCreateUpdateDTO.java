package com.q2k.meditech.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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

    @Size(max = 5000, message = "Chief complaint must not exceed 5000 characters")
    private String chiefComplaint;

    @Size(max = 10000, message = "HPI must not exceed 10000 characters")
    private String hpi;

    // Vitals
    private BigDecimal temperature;
    private Integer systolic;
    private Integer diastolic;
    private Integer heartRate;
    private Integer respiratoryRate;
    private Integer height;
    private Integer weight;

    @Size(max = 10000, message = "Physical exam must not exceed 10000 characters")
    private String physicalExam;

    @Size(max = 5000, message = "Diagnosis must not exceed 5000 characters")
    private String diagnosis;

    @Size(max = 20, message = "Diagnostic code must not exceed 20 characters")
    @Pattern(regexp = "^[A-Za-z0-9.\\- ]*$", message = "Diagnostic code contains invalid characters")
    private String diagnosticCode;

    @Size(max = 10000, message = "Treatment plan must not exceed 10000 characters")
    private String plan;

    @Size(max = 5000, message = "Follow-up instructions must not exceed 5000 characters")
    private String followUpInstructions;
}
