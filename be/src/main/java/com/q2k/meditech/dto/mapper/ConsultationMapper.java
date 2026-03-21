package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.entity.*;
import com.q2k.meditech.dto.ConsultationDTO;
import com.q2k.meditech.dto.AmendmentDTO;
import com.q2k.meditech.dto.ConsultationAttachmentDTO;
import com.q2k.meditech.dto.ConsultationCreateUpdateDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Mapper for Consultation entity to DTOs
 */
@Component
@RequiredArgsConstructor
public class ConsultationMapper {

    /**
     * Convert Consultation entity to ConsultationDTO
     */
    public ConsultationDTO toDTO(Consultation consultation) {
        if (consultation == null) {
            return null;
        }

        return ConsultationDTO.builder()
                .id(consultation.getId())
                .appointmentId(consultation.getAppointment().getId())
                .patientId(consultation.getPatient().getId())
                .patientName(consultation.getPatient().getUser().getFullName())
                .doctorId(consultation.getDoctor().getId())
                .doctorName(consultation.getDoctor().getUser().getFullName())
                .status(consultation.getStatus())
                .chiefComplaint(consultation.getChiefComplaint())
                .hpi(consultation.getHpi())
                .vitals(mapVitalsToDTO(consultation.getVitals()))
                .physicalExam(consultation.getPhysicalExam())
                .diagnosis(consultation.getDiagnosis())
                .diagnosticCode(consultation.getDiagnosticCode())
                .plan(consultation.getPlan())
                .followUpInstructions(consultation.getFollowUpInstructions())
                .isLocked(consultation.getIsLocked())
                .finalizedAt(consultation.getFinalizedAt())
                .finalizedByUserName(Optional.ofNullable(consultation.getFinalizedByUser())
                        .map(User::getFullName).orElse(null))
                .createdAt(consultation.getCreatedAt())
                .updatedAt(consultation.getUpdatedAt())
                .amendments(mapAmendmentsToDTO(consultation.getAmendments()))
                .attachments(mapAttachmentsToDTO(consultation.getAttachments()))
                .build();
    }

    /**
     * Convert Amendment entity to AmendmentDTO
     */
    public AmendmentDTO toDTO(Amendment amendment) {
        if (amendment == null) {
            return null;
        }

        return AmendmentDTO.builder()
                .id(amendment.getId())
                .consultationId(amendment.getConsultation().getId())
                .content(amendment.getContent())
                .createdByUserName(amendment.getCreatedByUser().getFullName())
                .createdAt(amendment.getCreatedAt())
                .signedByUserName(Optional.ofNullable(amendment.getSignedByUser())
                        .map(User::getFullName).orElse(null))
                .signedAt(amendment.getSignedAt())
                .build();
    }

    /**
     * Convert ConsultationAttachment entity to ConsultationAttachmentDTO
     */
    public ConsultationAttachmentDTO toDTO(ConsultationAttachment attachment) {
        if (attachment == null) {
            return null;
        }

        return ConsultationAttachmentDTO.builder()
                .id(attachment.getId())
                .consultationId(attachment.getConsultation().getId())
                .filename(attachment.getFilename())
                .fileType(attachment.getFileType())
                .fileSize(attachment.getFileSize())
                .mimeType(attachment.getMimeType())
                .createdAt(attachment.getCreatedAt())
                .uploadedByUserName(attachment.getUploadedByUser().getFullName())
                .build();
    }

    /**
     * Create Consultation entity from create/update DTO
     */
    public Consultation toEntity(ConsultationCreateUpdateDTO dto, Appointment appointment, 
                                  Patient patient, Doctor doctor) {
        if (dto == null) {
            return null;
        }

        Consultation.VitalsData vitals = Consultation.VitalsData.builder()
                .temperature(dto.getTemperature())
                .systolic(dto.getSystolic())
                .diastolic(dto.getDiastolic())
                .heartRate(dto.getHeartRate())
                .respiratoryRate(dto.getRespiratoryRate())
                .height(dto.getHeight())
                .weight(dto.getWeight())
                .bmi(calculateBMI(dto.getHeight(), dto.getWeight()))
                .build();

        return Consultation.builder()
                .appointment(appointment)
                .patient(patient)
                .doctor(doctor)
                .chiefComplaint(dto.getChiefComplaint())
                .hpi(dto.getHpi())
                .vitals(vitals)
                .physicalExam(dto.getPhysicalExam())
                .diagnosis(dto.getDiagnosis())
                .diagnosticCode(dto.getDiagnosticCode())
                .plan(dto.getPlan())
                .followUpInstructions(dto.getFollowUpInstructions())
                .isLocked(false)
                .build();
    }

    /**
     * Update existing Consultation entity from DTO
     */
    public void updateEntity(ConsultationCreateUpdateDTO dto, Consultation consultation) {
        if (dto == null || consultation == null) {
            return;
        }

        // Don't update if record is locked
        if (consultation.getIsLocked()) {
            return;
        }

        consultation.setChiefComplaint(dto.getChiefComplaint() != null ? dto.getChiefComplaint() : "");
        consultation.setHpi(dto.getHpi());
        consultation.setPhysicalExam(dto.getPhysicalExam());
        consultation.setDiagnosis(dto.getDiagnosis());
        consultation.setDiagnosticCode(dto.getDiagnosticCode());
        consultation.setPlan(dto.getPlan());
        consultation.setFollowUpInstructions(dto.getFollowUpInstructions());

        // Update vitals
        Consultation.VitalsData vitals = Consultation.VitalsData.builder()
                .temperature(dto.getTemperature())
                .systolic(dto.getSystolic())
                .diastolic(dto.getDiastolic())
                .heartRate(dto.getHeartRate())
                .respiratoryRate(dto.getRespiratoryRate())
                .height(dto.getHeight())
                .weight(dto.getWeight())
                .bmi(calculateBMI(dto.getHeight(), dto.getWeight()))
                .build();
        consultation.setVitals(vitals);
    }

    // --- Helper methods ---

    private ConsultationDTO.VitalsDTO mapVitalsToDTO(Consultation.VitalsData vitals) {
        if (vitals == null) {
            return null;
        }

        return ConsultationDTO.VitalsDTO.builder()
                .temperature(vitals.getTemperature())
                .systolic(vitals.getSystolic())
                .diastolic(vitals.getDiastolic())
                .heartRate(vitals.getHeartRate())
                .respiratoryRate(vitals.getRespiratoryRate())
                .height(vitals.getHeight())
                .weight(vitals.getWeight())
                .bmi(vitals.getBmi())
                .build();
    }

    private List<AmendmentDTO> mapAmendmentsToDTO(List<Amendment> amendments) {
        if (amendments == null) {
            return List.of();
        }

        return amendments.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private List<ConsultationAttachmentDTO> mapAttachmentsToDTO(List<ConsultationAttachment> attachments) {
        if (attachments == null) {
            return List.of();
        }

        return attachments.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Calculate BMI from height (cm) and weight (kg)
     * Formula: BMI = weight(kg) / (height(m))^2
     */
    private BigDecimal calculateBMI(Integer heightCm, Integer weightKg) {
        if (heightCm == null || weightKg == null || heightCm == 0) {
            return null;
        }

        double heightInMeters = heightCm / 100.0;
        double bmi = weightKg / (heightInMeters * heightInMeters);
        return new BigDecimal(String.format("%.1f", bmi));
    }
}
