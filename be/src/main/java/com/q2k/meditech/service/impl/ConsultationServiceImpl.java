package com.q2k.meditech.service.impl;

import com.q2k.meditech.dto.ConsultationDTO;
import com.q2k.meditech.dto.AmendmentDTO;
import com.q2k.meditech.dto.ConsultationAttachmentDTO;
import com.q2k.meditech.dto.ConsultationCreateUpdateDTO;
import com.q2k.meditech.dto.mapper.ConsultationMapper;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.ConsultationStatus;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.service.ConsultationService;
import com.q2k.meditech.service.FileStorageService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of ConsultationService
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConsultationServiceImpl implements ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final AmendmentRepository amendmentRepository;
    private final ConsultationAttachmentRepository attachmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final ConsultationMapper consultationMapper;
    private final FileStorageService fileStorageService;

    // File upload configuration
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    @Override
    @Transactional(readOnly = true)
    public ConsultationDTO getConsultationById(Long consultationId) {
        log.debug("Fetching consultation with ID: {}", consultationId);
        
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new EntityNotFoundException("Consultation not found with ID: " + consultationId));
        
        return consultationMapper.toDTO(consultation);
    }

    @Override
    @Transactional(readOnly = true)
    public ConsultationDTO getConsultationByAppointmentId(Long appointmentId) {
        log.debug("Fetching consultation for appointment ID: {}", appointmentId);
        
        Consultation consultation = consultationRepository.findByAppointmentIdWithDetails(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("No consultation found for appointment ID: " + appointmentId));
        
        return consultationMapper.toDTO(consultation);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConsultationDTO> getDoctorConsultations(Long doctorId, Pageable pageable) {
        log.debug("Fetching consultations for doctor ID: {}", doctorId);
        
        // Verify doctor exists
        if (!doctorRepository.existsById(doctorId)) {
            throw new EntityNotFoundException("Doctor not found with ID: " + doctorId);
        }
        
        return consultationRepository.findByDoctorId(doctorId, pageable)
                .map(consultationMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConsultationDTO> getPatientConsultations(Long patientId, Pageable pageable) {
        log.debug("Fetching consultations for patient ID: {}", patientId);
        
        // Verify patient exists
        if (!patientRepository.existsById(patientId)) {
            throw new EntityNotFoundException("Patient not found with ID: " + patientId);
        }
        
        return consultationRepository.findByPatientId(patientId, pageable)
                .map(consultationMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConsultationDTO> getDraftConsultationsByDoctor(Long doctorId) {
        log.debug("Fetching draft consultations for doctor ID: {}", doctorId);
        
        // Verify doctor exists
        if (!doctorRepository.existsById(doctorId)) {
            throw new EntityNotFoundException("Doctor not found with ID: " + doctorId);
        }
        
        return consultationRepository.findByDoctorIdAndStatus(doctorId, ConsultationStatus.DRAFT).stream()
                .map(consultationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ConsultationDTO createConsultation(Long appointmentId, ConsultationCreateUpdateDTO dto) {
        log.debug("Creating new consultation for appointment ID: {}", appointmentId);
        
        // Verify appointment exists and is in valid state
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found with ID: " + appointmentId));
        
        if (!AppointmentStatus.IN_PROGRESS.equals(appointment.getStatus())) {
            throw new IllegalStateException("Appointment must be IN_PROGRESS to create consultation. Current status: " + appointment.getStatus());
        }
        
        // Check if consultation already exists for this appointment
        if (consultationRepository.findByAppointmentId(appointmentId).isPresent()) {
            throw new IllegalStateException("Consultation already exists for this appointment");
        }
        
        Patient patient = appointment.getPatient();
        Doctor doctor = appointment.getDoctor();
        
        // Create new consultation entity
        Consultation consultation = consultationMapper.toEntity(dto, appointment, patient, doctor);
        consultation.setStatus(ConsultationStatus.DRAFT);
        
        Consultation savedConsultation = consultationRepository.save(consultation);
        log.info("Created consultation ID: {} for appointment ID: {}", savedConsultation.getId(), appointmentId);
        
        return consultationMapper.toDTO(savedConsultation);
    }

    @Override
    @Transactional
    public ConsultationDTO updateConsultationDraft(Long appointmentId, ConsultationCreateUpdateDTO dto) {
        log.debug("Updating/creating consultation draft for appointment ID: {}", appointmentId);
        
        // Try to find existing consultation, or create if it doesn't exist
        Consultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseGet(() -> {
                    log.info("Consultation not found for appointment ID: {}. Creating new draft...", appointmentId);
                    
                    // Get the appointment and its doctor
                    Appointment appointment = appointmentRepository.findById(appointmentId)
                            .orElseThrow(() -> new EntityNotFoundException("Appointment not found with ID: " + appointmentId));
                    
                    Patient patient = appointment.getPatient();
                    Doctor doctor = appointment.getDoctor();
                    
                    // Create new consultation draft
                    Consultation newConsultation = new Consultation();
                    newConsultation.setAppointment(appointment);
                    newConsultation.setPatient(patient);
                    newConsultation.setDoctor(doctor);
                    newConsultation.setStatus(ConsultationStatus.DRAFT);
                    
                    return newConsultation;
                });
        
        // Only allow updates to draft records
        if (ConsultationStatus.FINALIZED.equals(consultation.getStatus())) {
            throw new IllegalStateException("Cannot update finalized consultation. Use amendments instead.");
        }
        
        // Update consultation fields
        consultationMapper.updateEntity(dto, consultation);
        
        Consultation updatedConsultation = consultationRepository.save(consultation);
        log.info("Saved consultation draft for appointment ID: {}", appointmentId);
        
        return consultationMapper.toDTO(updatedConsultation);
    }

    @Override
    @Transactional
    public ConsultationDTO finalizeConsultation(Long consultationId) {
        log.debug("Finalizing consultation ID: {}", consultationId);
        
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new EntityNotFoundException("Consultation not found with ID: " + consultationId));
        
        if (!ConsultationStatus.DRAFT.equals(consultation.getStatus())) {
            throw new IllegalStateException("Only DRAFT consultations can be finalized. Current status: " + consultation.getStatus());
        }
        
        // Get current user
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No authenticated user found");
        }
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"));
        
        // Finalize consultation
        consultation.finalize(currentUser);
        
        // Update appointment status to COMPLETED
        Appointment appointment = consultation.getAppointment();
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);
        
        Consultation finalizedConsultation = consultationRepository.save(consultation);
        log.info("Finalized consultation ID: {} and updated appointment status to COMPLETED", consultationId);
        
        return consultationMapper.toDTO(finalizedConsultation);
    }

    @Override
    @Transactional
    public ConsultationDTO finalizeConsultationWithData(Long appointmentId, ConsultationCreateUpdateDTO dto) {
        log.debug("Finalizing consultation with data for appointment ID: {}", appointmentId);
        
        // Get or create consultation by appointment ID
        Consultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseGet(() -> {
                    log.info("Consultation not found for appointment ID: {}. Creating new one from provided data.", appointmentId);
                    
                    // Get the appointment
                    Appointment appointment = appointmentRepository.findById(appointmentId)
                            .orElseThrow(() -> new EntityNotFoundException("Appointment not found with ID: " + appointmentId));
                    
                    // Create new consultation from the provided data
                    Consultation newConsultation = new Consultation();
                    newConsultation.setAppointment(appointment);
                    newConsultation.setPatient(appointment.getPatient());
                    newConsultation.setDoctor(appointment.getDoctor());
                    newConsultation.setStatus(ConsultationStatus.DRAFT);
                    
                    // Map the DTO to the entity
                    consultationMapper.updateEntity(dto, newConsultation);
                    
                    // Save and return the new consultation
                    return consultationRepository.save(newConsultation);
                });
        
        if (!ConsultationStatus.DRAFT.equals(consultation.getStatus())) {
            throw new IllegalStateException("Only DRAFT consultations can be finalized. Current status: " + consultation.getStatus());
        }
        
        // Update consultation fields with provided data (in case it was an existing draft)
        consultationMapper.updateEntity(dto, consultation);
        
        // Get current user
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No authenticated user found");
        }
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"));
        
        // Finalize consultation
        consultation.finalize(currentUser);
        
        // Update appointment status to COMPLETED
        Appointment appointment = consultation.getAppointment();
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);
        
        Consultation finalizedConsultation = consultationRepository.save(consultation);
        log.info("Finalized consultation with data for appointment ID: {} and updated appointment status to COMPLETED", appointmentId);
        
        return consultationMapper.toDTO(finalizedConsultation);
    }

    @Override
    @Transactional
    public AmendmentDTO addAmendment(Long consultationId, String content) {
        log.debug("Adding amendment to consultation ID: {}", consultationId);
        
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new EntityNotFoundException("Consultation not found with ID: " + consultationId));
        
        if (!ConsultationStatus.FINALIZED.equals(consultation.getStatus())
                && !ConsultationStatus.AMENDED.equals(consultation.getStatus())) {
            throw new IllegalStateException("Amendments can only be added to FINALIZED or AMENDED consultations. Current status: " + consultation.getStatus());
        }
        
        // Get current user
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No authenticated user found");
        }
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"));
        
        // Create new amendment
        Amendment amendment = Amendment.builder()
                .consultation(consultation)
                .content(content)
                .createdByUser(currentUser)
                .build();
        
        Amendment savedAmendment = amendmentRepository.save(amendment);
        consultation.addAmendment(amendment);
        consultation.setStatus(ConsultationStatus.AMENDED);
        consultationRepository.save(consultation);
        
        log.info("Added amendment ID: {} to consultation ID: {}", savedAmendment.getId(), consultationId);
        
        return consultationMapper.toDTO(savedAmendment);
    }

    @Override
    @Transactional
    public AmendmentDTO addAmendmentByAppointmentId(Long appointmentId, String content) {
        log.debug("Adding amendment to appointment ID: {}", appointmentId);
        
        // Get consultation by appointment ID
        Consultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Consultation not found for appointment ID: " + appointmentId));
        
        return addAmendment(consultation.getId(), content);
    }

    @Override
    @Transactional
    public AmendmentDTO signAmendment(Long amendmentId) {
        log.debug("Signing amendment ID: {}", amendmentId);
        
        Amendment amendment = amendmentRepository.findById(amendmentId)
                .orElseThrow(() -> new EntityNotFoundException("Amendment not found with ID: " + amendmentId));
        
        if (amendment.getSignedAt() != null) {
            throw new IllegalStateException("Amendment has already been signed");
        }
        
        // Get current user
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No authenticated user found");
        }
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"));
        
        amendment.sign(currentUser);
        
        Amendment signedAmendment = amendmentRepository.save(amendment);
        log.info("Signed amendment ID: {} by user: {}", amendmentId, currentUser.getFullName());
        
        return consultationMapper.toDTO(signedAmendment);
    }

    @Override
    @Transactional
    public AmendmentDTO signAmendment(Long appointmentId, String amendmentId) {
        log.debug("Signing amendment ID: {} for appointment ID: {}", amendmentId, appointmentId);
        
        // Get consultation by appointment ID
        Consultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Consultation not found for appointment ID: " + appointmentId));
        
        // Find amendment by ID within the consultation
        Amendment amendment = amendmentRepository.findById(Long.parseLong(amendmentId))
                .orElseThrow(() -> new EntityNotFoundException("Amendment not found with ID: " + amendmentId));
        
        // Verify the amendment belongs to this consultation
        if (!amendment.getConsultation().getId().equals(consultation.getId())) {
            throw new IllegalStateException("Amendment does not belong to this consultation");
        }
        
        if (amendment.getSignedAt() != null) {
            throw new IllegalStateException("Amendment has already been signed");
        }
        
        // Get current user
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No authenticated user found");
        }
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"));
        
        amendment.sign(currentUser);
        
        Amendment signedAmendment = amendmentRepository.save(amendment);
        log.info("Signed amendment ID: {} by user: {}", amendmentId, currentUser.getFullName());
        
        return consultationMapper.toDTO(signedAmendment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AmendmentDTO> getAmendmentsByConsultationId(Long consultationId) {
        log.debug("Fetching amendments for consultation ID: {}", consultationId);
        
        // Verify consultation exists
        if (!consultationRepository.existsById(consultationId)) {
            throw new EntityNotFoundException("Consultation not found with ID: " + consultationId);
        }
        
        return amendmentRepository.findByConsultationId(consultationId).stream()
                .map(consultationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AmendmentDTO> getAmendmentsByAppointmentId(Long appointmentId) {
        log.debug("Fetching amendments by appointment ID: {}", appointmentId);
        
        // Get consultation by appointment ID
        Consultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Consultation not found for appointment ID: " + appointmentId));
        
        return getAmendmentsByConsultationId(consultation.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AmendmentDTO> getUnsignedAmendments(Long consultationId) {
        log.debug("Fetching unsigned amendments for consultation ID: {}", consultationId);
        
        // Verify consultation exists
        if (!consultationRepository.existsById(consultationId)) {
            throw new EntityNotFoundException("Consultation not found with ID: " + consultationId);
        }
        
        return amendmentRepository.findUnsignedByConsultationId(consultationId).stream()
                .map(consultationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ConsultationAttachmentDTO uploadAttachment(Long appointmentId, MultipartFile file) {
        log.debug("Uploading attachment for appointment ID: {}", appointmentId);
        
        // Get or create consultation by appointment ID
        Consultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseGet(() -> {
                    log.info("Consultation not found for appointment ID: {}. Creating new one for attachment upload.", appointmentId);
                    
                    Appointment appointment = appointmentRepository.findById(appointmentId)
                            .orElseThrow(() -> new EntityNotFoundException("Appointment not found with ID: " + appointmentId));
                    
                    Consultation newConsultation = new Consultation();
                    newConsultation.setAppointment(appointment);
                    newConsultation.setPatient(appointment.getPatient());
                    newConsultation.setDoctor(appointment.getDoctor());
                    newConsultation.setStatus(ConsultationStatus.DRAFT);
                    newConsultation.setChiefComplaint(""); // satisfy NOT NULL constraint for new draft
                    
                    return consultationRepository.save(newConsultation);
                });
        
        // Validate file
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size of 10MB");
        }
        
        // Get current user
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No authenticated user found");
        }
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"));
        
        try {
            // Upload to Cloudinary
            String fileUrl = fileStorageService.uploadFile(
                    "consultations/" + consultation.getId(), file);
            String originalFilename = file.getOriginalFilename();
            
            // Create attachment record
            ConsultationAttachment attachment = ConsultationAttachment.builder()
                    .consultation(consultation)
                    .filename(originalFilename)
                    .fileType(extractFileType(originalFilename))
                    .fileSize(file.getSize())
                    .filePath(fileUrl)
                    .mimeType(file.getContentType())
                    .uploadedByUser(currentUser)
                    .build();
            
            ConsultationAttachment savedAttachment = attachmentRepository.save(attachment);
            consultation.addAttachment(attachment);
            consultationRepository.save(consultation);
            
            log.info("Uploaded attachment ID: {} for consultation ID: {} (appointment ID: {})", savedAttachment.getId(), consultation.getId(), appointmentId);
            
            return consultationMapper.toDTO(savedAttachment);
        } catch (Exception e) {
            log.error("Error uploading file for appointment ID: {}", appointmentId, e);
            throw new RuntimeException("Error uploading file: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void deleteAttachment(Long attachmentId) {
        log.debug("Deleting attachment ID: {}", attachmentId);
        
        ConsultationAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment not found with ID: " + attachmentId));
        
        // Delete file from Cloudinary
        fileStorageService.deleteFile(attachment.getFilePath());
        
        // Remove from consultation
        Consultation consultation = attachment.getConsultation();
        consultation.getAttachments().remove(attachment);
        consultationRepository.save(consultation);
        
        // Delete attachment record
        attachmentRepository.deleteById(attachmentId);
        log.info("Deleted attachment ID: {}", attachmentId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConsultationAttachmentDTO> getAttachmentsByConsultationId(Long consultationId) {
        log.debug("Fetching attachments for consultation ID: {}", consultationId);
        
        // Verify consultation exists
        if (!consultationRepository.existsById(consultationId)) {
            throw new EntityNotFoundException("Consultation not found with ID: " + consultationId);
        }
        
        return attachmentRepository.findByConsultationId(consultationId).stream()
                .map(consultationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteConsultation(Long consultationId) {
        log.debug("Deleting consultation ID: {}", consultationId);
        
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new EntityNotFoundException("Consultation not found with ID: " + consultationId));
        
        // Only allow deletion of draft consultations
        if (!ConsultationStatus.DRAFT.equals(consultation.getStatus())) {
            throw new IllegalStateException("Only DRAFT consultations can be deleted. Current status: " + consultation.getStatus());
        }
        
        // Delete all attachments from Cloudinary
        for (ConsultationAttachment attachment : consultation.getAttachments()) {
            fileStorageService.deleteFile(attachment.getFilePath());
        }
        
        // Delete consultation (cascade will handle amendments and attachments)
        consultationRepository.deleteById(consultationId);
        log.info("Deleted consultation ID: {}", consultationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConsultationDTO> getConsultationsByStatus(ConsultationStatus status, Pageable pageable) {
        log.debug("Fetching consultations with status: {}", status);
        
        return consultationRepository.findByStatus(status, pageable)
                .map(consultationMapper::toDTO);
    }

    // --- Helper methods ---

    /**
     * Extract file type from filename (e.g., "pdf", "jpg", "png")
     */
    private String extractFileType(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "unknown";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }
}
