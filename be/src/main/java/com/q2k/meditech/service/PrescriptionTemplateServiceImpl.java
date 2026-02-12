package com.q2k.meditech.service;

import com.q2k.meditech.dto.ApplyTemplateDTO;
import com.q2k.meditech.dto.PrescriptionDTO;
import com.q2k.meditech.dto.TemplateCreateDTO;
import com.q2k.meditech.dto.TemplateDTO;
import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.exception.AppException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.dto.mapper.PrescriptionMapper;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.service.PrescriptionTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PrescriptionTemplateServiceImpl implements PrescriptionTemplateService {
    
    private final PrescriptionTemplateRepository templateRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionMapper prescriptionMapper;
    
    @Override
    public TemplateDTO createTemplate(TemplateCreateDTO dto, Long doctorUserId) {
        log.info("Creating template '{}' for doctor user {}", dto.getTemplateName(), doctorUserId);
        
        // Validate doctor
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", doctorUserId));
        
        // Check duplicate name
        if (templateRepository.findByDoctorIdAndTemplateName(doctor.getId(), dto.getTemplateName()).isPresent()) {
            throw new AppException("Template with this name already exists", HttpStatus.CONFLICT);
        }
        
        // Create template
        PrescriptionTemplate template = PrescriptionTemplate.builder()
                .doctor(doctor)
                .templateName(dto.getTemplateName())
                .description(dto.getDescription())
                .diagnosisTemplate(dto.getDiagnosisTemplate())
                .notesTemplate(dto.getNotesTemplate())
                .defaultFollowUpDays(dto.getDefaultFollowUpDays())
                .isActive(true)
                .usageCount(0)
                .build();
        
        // Add items
        AtomicInteger order = new AtomicInteger(1);
        dto.getItems().forEach(itemDto -> {
            PrescriptionTemplateItem item = prescriptionMapper.toTemplateItemEntity(itemDto);
            if (item.getItemOrder() == null) {
                item.setItemOrder(order.getAndIncrement());
            }
            template.addItem(item);
        });
        
        PrescriptionTemplate savedTemplate = templateRepository.save(template);
        log.info("Template created with ID: {}", savedTemplate.getId());
        
        return prescriptionMapper.toTemplateDTO(savedTemplate);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TemplateDTO> getDoctorTemplates(Long doctorUserId, boolean activeOnly) {
        log.info("Getting templates for doctor user {}, activeOnly: {}", doctorUserId, activeOnly);
        
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", doctorUserId));
        
        List<PrescriptionTemplate> templates;
        if (activeOnly) {
            templates = templateRepository.findByDoctorIdAndIsActiveTrue(doctor.getId());
        } else {
            templates = templateRepository.findByDoctorId(doctor.getId());
        }
        
        return prescriptionMapper.toTemplateDTOList(templates);
    }
    
    @Override
    @Transactional(readOnly = true)
    public TemplateDTO getTemplateById(Long id, Long doctorUserId) {
        PrescriptionTemplate template = getTemplateAndValidateOwner(id, doctorUserId);
        return prescriptionMapper.toTemplateDTO(template);
    }
    
    @Override
    public TemplateDTO updateTemplate(Long id, TemplateUpdateDTO dto, Long doctorUserId) {
        log.info("Updating template {} by doctor user {}", id, doctorUserId);
        
        PrescriptionTemplate template = getTemplateAndValidateOwner(id, doctorUserId);
        
        // Check duplicate name (exclude current template)
        templateRepository.findByDoctorIdAndTemplateName(template.getDoctor().getId(), dto.getTemplateName())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new AppException("Template with this name already exists", HttpStatus.CONFLICT);
                    }
                });
        
        // Update fields
        template.setTemplateName(dto.getTemplateName());
        template.setDescription(dto.getDescription());
        template.setDiagnosisTemplate(dto.getDiagnosisTemplate());
        template.setNotesTemplate(dto.getNotesTemplate());
        template.setDefaultFollowUpDays(dto.getDefaultFollowUpDays());
        
        if (dto.getIsActive() != null) {
            template.setIsActive(dto.getIsActive());
        }
        
        // Update items - clear old and add new
        template.getItems().clear();
        AtomicInteger order = new AtomicInteger(1);
        dto.getItems().forEach(itemDto -> {
            PrescriptionTemplateItem item = prescriptionMapper.toTemplateItemEntity(itemDto);
            if (item.getItemOrder() == null) {
                item.setItemOrder(order.getAndIncrement());
            }
            template.addItem(item);
        });
        
        PrescriptionTemplate savedTemplate = templateRepository.save(template);
        log.info("Template {} updated successfully", id);
        
        return prescriptionMapper.toTemplateDTO(savedTemplate);
    }
    
    @Override
    public void deleteTemplate(Long id, Long doctorUserId) {
        log.info("Deleting template {} by doctor user {}", id, doctorUserId);
        
        PrescriptionTemplate template = getTemplateAndValidateOwner(id, doctorUserId);
        
        // Soft delete
        template.setIsActive(false);
        templateRepository.save(template);
        
        log.info("Template {} soft deleted", id);
    }
    
    @Override
    public PrescriptionDTO applyTemplate(Long templateId, ApplyTemplateDTO dto, Long doctorUserId) {
        log.info("Applying template {} for patient {} by doctor user {}", templateId, dto.getPatientId(), doctorUserId);
        
        // Get template
        PrescriptionTemplate template = getTemplateAndValidateOwner(templateId, doctorUserId);
        
        if (!template.getIsActive()) {
            throw new AppException("Cannot apply inactive template", HttpStatus.BAD_REQUEST);
        }
        
        // Validate doctor
        Doctor doctor = template.getDoctor();
        
        // Validate patient
        Patient patient = patientRepository.findByIdWithUser(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", dto.getPatientId()));
        
        // Validate appointment nếu có
        Appointment appointment = null;
        if (dto.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(dto.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", dto.getAppointmentId()));
            
            if (!appointment.getDoctor().getId().equals(doctor.getId())) {
                throw new AppException("Appointment does not belong to this doctor", HttpStatus.FORBIDDEN);
            }
            if (!appointment.getPatient().getId().equals(patient.getId())) {
                throw new AppException("Appointment does not belong to this patient", HttpStatus.BAD_REQUEST);
            }
        }
        
        // Calculate follow-up date
        LocalDate followUpDate = dto.getFollowUpDate();
        if (followUpDate == null && template.getDefaultFollowUpDays() != null) {
            LocalDate prescriptionDate = dto.getPrescriptionDate() != null ? dto.getPrescriptionDate() : LocalDate.now();
            followUpDate = prescriptionDate.plusDays(template.getDefaultFollowUpDays());
        }
        
        // Create prescription from template
        Prescription prescription = Prescription.builder()
                .patient(patient)
                .doctor(doctor)
                .appointment(appointment)
                .prescriptionDate(dto.getPrescriptionDate() != null ? dto.getPrescriptionDate() : LocalDate.now())
                .diagnosis(dto.getDiagnosis() != null ? dto.getDiagnosis() : template.getDiagnosisTemplate())
                .notes(dto.getNotes() != null ? dto.getNotes() : template.getNotesTemplate())
                .followUpDate(followUpDate)
                .isActive(true)
                .build();
        
        // Copy items from template
        template.getItems().forEach(templateItem -> {
            PrescriptionItem item = prescriptionMapper.templateItemToPrescriptionItem(templateItem);
            prescription.addItem(item);
        });
        
        Prescription savedPrescription = prescriptionRepository.save(prescription);
        
        // Increment usage count
        template.incrementUsageCount();
        templateRepository.save(template);
        
        log.info("Prescription {} created from template {}", savedPrescription.getId(), templateId);
        
        return prescriptionMapper.toDTO(savedPrescription);
    }
    
    // ==================== HELPER METHODS ====================
    
    private PrescriptionTemplate getTemplateAndValidateOwner(Long templateId, Long doctorUserId) {
        PrescriptionTemplate template = templateRepository.findByIdWithDetails(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template", "id", templateId));
        
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", doctorUserId));
        
        if (!template.getDoctor().getId().equals(doctor.getId())) {
            throw new AppException("You don't have permission to access this template", HttpStatus.FORBIDDEN);
        }
        
        return template;
    }
}