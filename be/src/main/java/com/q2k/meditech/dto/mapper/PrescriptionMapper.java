package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.dto.PrescriptionDTO;
import com.q2k.meditech.dto.PrescriptionItemDTO;
import com.q2k.meditech.dto.TemplateDTO;
import com.q2k.meditech.dto.TemplateItemDTO;
import com.q2k.meditech.dto.mapper.PrescriptionMapper;
import com.q2k.meditech.entity.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PrescriptionMapper {
    
    // ==================== PRESCRIPTION ====================
    
    public PrescriptionDTO toDTO(Prescription prescription) {
        if (prescription == null) return null;
        
        PrescriptionDTO.PrescriptionDTOBuilder builder = PrescriptionDTO.builder()
                .id(prescription.getId())
                .prescriptionCode(prescription.getPrescriptionCode() != null
                        ? prescription.getPrescriptionCode()
                        : "PRE-" + String.format("%06d", prescription.getId()))
                .prescriptionDate(prescription.getPrescriptionDate())
                .expiryDate(prescription.getExpiryDate())
                .status(prescription.getStatus() != null
                        ? prescription.getStatus().name()
                        : (Boolean.TRUE.equals(prescription.getIsActive()) ? "ACTIVE" : "EXPIRED"))
                .diagnosis(prescription.getDiagnosis())
                .notes(prescription.getNotes())
                .followUpDate(prescription.getFollowUpDate())
                .isActive(prescription.getIsActive())
                .totalCost(prescription.getTotalCost())
                .prescriptionPaymentStatus(prescription.getPrescriptionPaymentStatus())
                .createdAt(prescription.getCreatedAt())
                .updatedAt(prescription.getUpdatedAt());
        
        // Patient info
        if (prescription.getPatient() != null) {
            Patient patient = prescription.getPatient();
            builder.patientId(patient.getId());
            builder.patientDateOfBirth(patient.getDateOfBirth());
            builder.patientGender(patient.getGender());
            if (patient.getUser() != null) {
                builder.patientName(patient.getUser().getFullName());
                builder.patientPhone(patient.getUser().getPhone());
            }
        }
        
        // Doctor info
        if (prescription.getDoctor() != null) {
            Doctor doctor = prescription.getDoctor();
            builder.doctorId(doctor.getId());
            builder.doctorSpecialization(doctor.getSpecialization());
            if (doctor.getUser() != null) {
                builder.doctorName(doctor.getUser().getFullName());
            }
        }
        
        // Appointment info
        if (prescription.getAppointment() != null) {
            builder.appointmentId(prescription.getAppointment().getId());
            builder.appointmentDate(prescription.getAppointment().getAppointmentDate());
        }
        
        // Items
        if (prescription.getItems() != null) {
            builder.items(prescription.getItems().stream()
                    .map(this::toItemDTO)
                    .collect(Collectors.toList()));
        }
        
        return builder.build();
    }
    
    public List<PrescriptionDTO> toDTOList(List<Prescription> prescriptions) {
        return prescriptions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public PrescriptionItemDTO toItemDTO(PrescriptionItem item) {
        if (item == null) return null;
        
        return PrescriptionItemDTO.builder()
                .id(item.getId())
                .medicationId(item.getMedicationId())
                .medicineName(item.getMedicineName())
                .dosage(item.getDosage())
                .frequency(item.getFrequency())
                .duration(item.getDuration())
                .quantity(item.getQuantity())
                .unit(item.getUnit())
                .instructions(item.getInstructions())
                .notes(item.getNotes())
                .morningDose(item.getMorningDose())
                .noonDose(item.getNoonDose())
                .afternoonDose(item.getAfternoonDose())
                .eveningDose(item.getEveningDose())
                .itemOrder(item.getItemOrder())
                .price(item.getPrice())
                .build();
    }

    public PrescriptionItem toItemEntity(PrescriptionItemDTO dto) {
        if (dto == null) return null;
        return PrescriptionItem.builder()
                .medicationId(dto.getMedicationId())
                .medicineName(dto.getMedicineName())
                .dosage(dto.getDosage())
                .frequency(dto.getFrequency())
                .duration(dto.getDuration())
                .quantity(dto.getQuantity())
                .unit(dto.getUnit())
                .instructions(dto.getInstructions())
                .notes(dto.getNotes())
                .morningDose(dto.getMorningDose())
                .noonDose(dto.getNoonDose())
                .afternoonDose(dto.getAfternoonDose())
                .eveningDose(dto.getEveningDose())
                .itemOrder(dto.getItemOrder())
                .price(dto.getPrice())
                .build();
    }

    // ==================== TEMPLATE ====================

    public TemplateDTO toTemplateDTO(PrescriptionTemplate template) {
        if (template == null) return null;

        TemplateDTO.TemplateDTOBuilder builder = TemplateDTO.builder()
                .id(template.getId())
                .templateName(template.getTemplateName())
                .description(template.getDescription())
                .diagnosisTemplate(template.getDiagnosisTemplate())
                .notesTemplate(template.getNotesTemplate())
                .defaultFollowUpDays(template.getDefaultFollowUpDays())
                .isActive(template.getIsActive())
                .usageCount(template.getUsageCount())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt());

        if (template.getDoctor() != null) {
            builder.doctorId(template.getDoctor().getId());
            if (template.getDoctor().getUser() != null) {
                builder.doctorName(template.getDoctor().getUser().getFullName());
            }
        }

        if (template.getItems() != null) {
            builder.items(template.getItems().stream()
                    .map(this::toTemplateItemDTO)
                    .collect(Collectors.toList()));
        }

        return builder.build();
    }

    public List<TemplateDTO> toTemplateDTOList(List<PrescriptionTemplate> templates) {
        return templates.stream()
                .map(this::toTemplateDTO)
                .collect(Collectors.toList());
    }

    public TemplateItemDTO toTemplateItemDTO(PrescriptionTemplateItem item) {
        if (item == null) return null;
        return TemplateItemDTO.builder()
                .id(item.getId())
                .medicineName(item.getMedicineName())
                .defaultDosage(item.getDefaultDosage())
                .defaultFrequency(item.getDefaultFrequency())
                .defaultDuration(item.getDefaultDuration())
                .defaultQuantity(item.getDefaultQuantity())
                .unit(item.getUnit())
                .defaultInstructions(item.getDefaultInstructions())
                .notes(item.getNotes())
                .itemOrder(item.getItemOrder())
                .build();
    }

    public PrescriptionTemplateItem toTemplateItemEntity(TemplateItemDTO dto) {
        if (dto == null) return null;
        return PrescriptionTemplateItem.builder()
                .medicineName(dto.getMedicineName())
                .defaultDosage(dto.getDefaultDosage())
                .defaultFrequency(dto.getDefaultFrequency())
                .defaultDuration(dto.getDefaultDuration())
                .defaultQuantity(dto.getDefaultQuantity())
                .unit(dto.getUnit())
                .defaultInstructions(dto.getDefaultInstructions())
                .notes(dto.getNotes())
                .itemOrder(dto.getItemOrder())
                .build();
    }

    public PrescriptionItem templateItemToPrescriptionItem(PrescriptionTemplateItem templateItem) {
        if (templateItem == null) return null;
        return PrescriptionItem.builder()
                .medicineName(templateItem.getMedicineName())
                .dosage(templateItem.getDefaultDosage())
                .frequency(templateItem.getDefaultFrequency())
                .duration(templateItem.getDefaultDuration())
                .quantity(templateItem.getDefaultQuantity())
                .unit(templateItem.getUnit())
                .instructions(templateItem.getDefaultInstructions())
                .notes(templateItem.getNotes())
                .itemOrder(templateItem.getItemOrder())
                .build();
    }
}