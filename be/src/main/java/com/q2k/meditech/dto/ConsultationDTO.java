package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.q2k.meditech.entity.enums.ConsultationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Consultation Record response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationDTO {

    private Long id;
    private Long appointmentId;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;

    private ConsultationStatus status;
    private String chiefComplaint;
    private String hpi;

    private VitalsDTO vitals;

    private String physicalExam;
    private String diagnosis;
    private String diagnosticCode;
    private String plan;
    private String followUpInstructions;

    private Boolean isLocked;
    private LocalDateTime finalizedAt;
    private String finalizedByUserName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<AmendmentDTO> amendments;
    private List<ConsultationAttachmentDTO> attachments;

    /**
     * Vitals DTO - nested structure
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VitalsDTO {
        private BigDecimal temperature;  // °C
        private Integer systolic;        // mmHg - SBP
        private Integer diastolic;       // mmHg - DBP
        private Integer heartRate;       // bpm
        private Integer respiratoryRate; // bpm
        private Integer height;          // cm
        private Integer weight;          // kg
        private BigDecimal bmi;          // calculated
    }
}
