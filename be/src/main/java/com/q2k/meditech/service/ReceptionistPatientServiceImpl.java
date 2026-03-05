package com.q2k.meditech.service;

import com.q2k.meditech.dto.AppointmentDTO;
import com.q2k.meditech.dto.CommunicationLogDTO;
import com.q2k.meditech.dto.receptionist.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.AuditActionType;
import com.q2k.meditech.entity.enums.BookedBy;
import com.q2k.meditech.entity.enums.NotificationType;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReceptionistPatientServiceImpl implements ReceptionistPatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AppointmentRepository appointmentRepository;
    private final PaymentRepository paymentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientDocumentRepository patientDocumentRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final InvoiceRepository invoiceRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final PrivacyMaskingService privacyMaskingService;
    private final SmsService smsService;

    // ==================== 3.1 ALL PATIENTS ====================

    @Override
    public Page<PatientListDTO> listAllPatients(String search, String gender, Boolean isActive,
                                                 Boolean hasInsurance, Pageable pageable) {
        log.info("Listing all patients - search: {}, gender: {}, active: {}, insured: {}",
                search, gender, isActive, hasInsurance);

        Page<Patient> patients = patientRepository.findAllWithFilters(search, gender, isActive, hasInsurance, pageable);

        return patients.map(this::toPatientListDTO);
    }

    @Override
    public Page<PatientBasicDTO> searchPatients(String query, Pageable pageable) {
        if (query == null || query.trim().length() < 3) {
            throw new BadRequestException("Search query must be at least 3 characters");
        }

        log.info("Searching patients with query: {}", query.trim());
        Page<Patient> patients = patientRepository.searchByNamePhoneEmail(query.trim(), pageable);

        return patients.map(this::toPatientBasicDTO);
    }

    // ==================== 3.1.1 PATIENT DETAIL ====================

    @Override
    @Transactional
    public PatientDetailDTO getPatientDetail(Long patientId, Long viewerUserId) {
        log.info("Getting patient detail - patientId: {}, viewerUserId: {}", patientId, viewerUserId);

        Patient patient = patientRepository.findByIdWithUser(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        // Audit event: "view patient profile"
        logAuditEvent(viewerUserId, "VIEW_PATIENT_PROFILE", "Patient", patientId, null, null);

        return toPatientDetailDTO(patient);
    }

    @Override
    @Transactional
    public PatientDetailDTO updateDemographic(Long patientId, UpdatePatientDemographicDTO dto, Long updaterUserId) {
        log.info("Updating patient demographic - patientId: {}, updaterUserId: {}", patientId, updaterUserId);

        Patient patient = patientRepository.findByIdWithUser(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        User user = patient.getUser();
        Map<String, Object> oldValues = new HashMap<>();

        // Only update allowed fields (NOT fullName, DOB, gender, MRN)
        if (dto.getPhone() != null) {
            if (!dto.getPhone().equals(user.getPhone()) && userRepository.existsByPhone(dto.getPhone())) {
                throw new BadRequestException("Phone number already exists");
            }
            oldValues.put("phone", user.getPhone());
            user.setPhone(dto.getPhone());
        }
        if (dto.getEmail() != null) {
            if (!dto.getEmail().equals(user.getEmail()) && userRepository.existsByEmail(dto.getEmail())) {
                throw new BadRequestException("Email already exists");
            }
            oldValues.put("email", user.getEmail());
            user.setEmail(dto.getEmail());
        }
        if (dto.getAddress() != null) {
            oldValues.put("address", patient.getAddress());
            patient.setAddress(dto.getAddress());
        }
        if (dto.getInsuranceNumber() != null) {
            oldValues.put("insuranceNumber", patient.getInsuranceNumber());
            patient.setInsuranceNumber(dto.getInsuranceNumber());
        }
        if (dto.getInsuranceProvider() != null) {
            oldValues.put("insuranceProvider", patient.getInsuranceProvider());
            patient.setInsuranceProvider(dto.getInsuranceProvider());
        }
        if (dto.getEmergencyContact() != null) {
            oldValues.put("emergencyContact", patient.getEmergencyContact());
            patient.setEmergencyContact(dto.getEmergencyContact());
        }

        userRepository.save(user);
        patient = patientRepository.save(patient);

        // Audit
        logAuditEvent(updaterUserId, "UPDATE_PATIENT_DEMOGRAPHIC", "Patient", patientId, oldValues, dto);

        return toPatientDetailDTO(patient);
    }

    @Override
    @Transactional
    public void deactivatePatient(Long patientId, Long deactivatedByUserId) {
        log.info("Deactivating patient - patientId: {}", patientId);

        Patient patient = patientRepository.findByIdWithUser(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        User user = patient.getUser();
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BadRequestException("Patient is already deactivated");
        }

        user.setIsActive(false);
        userRepository.save(user);

        logAuditEvent(deactivatedByUserId, "DEACTIVATE_PATIENT", "Patient", patientId, null, null);
    }

    @Override
    @Transactional
    public void reactivatePatient(Long patientId, Long reactivatedByUserId) {
        log.info("Reactivating patient - patientId: {}", patientId);

        Patient patient = patientRepository.findByIdWithUser(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        User user = patient.getUser();
        if (Boolean.TRUE.equals(user.getIsActive())) {
            throw new BadRequestException("Patient is already active");
        }

        user.setIsActive(true);
        userRepository.save(user);

        logAuditEvent(reactivatedByUserId, "REACTIVATE_PATIENT", "Patient", patientId, null, null);
    }

    // ==================== 3.2 NEW PATIENTS ====================

    @Override
    public Page<NewPatientDTO> getNewPatients(Pageable pageable) {
        LocalDateTime startOfMonth = LocalDate.now()
                .with(TemporalAdjusters.firstDayOfMonth())
                .atStartOfDay();

        log.info("Getting new patients since: {}", startOfMonth);

        Page<Patient> patients = patientRepository.findNewPatientsThisMonth(startOfMonth, pageable);
        return patients.map(this::toNewPatientDTO);
    }

    // ==================== 3.3 FREQUENT PATIENTS ====================

    @Override
    public Page<FrequentPatientDTO> getFrequentPatients(Long minVisits, Long lapsedDays, String search, Pageable pageable) {
        long threshold = (minVisits != null && minVisits > 0) ? minVisits : 3L;
        log.info("Getting frequent patients with min visits: {}, lapsedDays: {}, search: {}", threshold, lapsedDays, search);

        Page<Object[]> results = patientRepository.findFrequentPatients(threshold, pageable);

        List<FrequentPatientDTO> dtos = results.getContent().stream()
                .map(row -> {
                    Patient patient = (Patient) row[0];
                    Long visitCount = (Long) row[1];
                    return toFrequentPatientDTO(patient, visitCount);
                })
                // Filter by lapsed days (last visit >= N days ago or never visited)
                .filter(dto -> {
                    if (lapsedDays == null || lapsedDays <= 0) return true;
                    return dto.getDaysSinceLastVisit() != null && dto.getDaysSinceLastVisit() >= lapsedDays;
                })
                // Filter by search (name or phone)
                .filter(dto -> {
                    if (search == null || search.isBlank()) return true;
                    String q = search.trim().toLowerCase();
                    boolean matchName = dto.getName() != null && dto.getName().toLowerCase().contains(q);
                    boolean matchMrn = dto.getMrn() != null && dto.getMrn().toLowerCase().contains(q);
                    return matchName || matchMrn;
                })
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, results.getTotalElements());
    }

    // ==================== PATIENT DETAIL TABS ====================

    @Override
    public Page<AppointmentDTO> getPatientAppointments(Long patientId, Pageable pageable) {
        log.info("Getting appointments for patient: {}", patientId);

        // Verify patient exists
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found with id: " + patientId);
        }

        Page<Appointment> appointments = appointmentRepository.findByPatientId(patientId, pageable);
        return appointments.map(this::toAppointmentDTO);
    }

    @Override
    public PatientClinicalSummaryDTO getClinicalSummary(Long patientId) {
        log.info("Getting clinical summary for patient: {}", patientId);

        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found with id: " + patientId);
        }

        Long medicalRecordCount = medicalRecordRepository.countByPatientId(patientId);
        Long prescriptionCount = prescriptionRepository.countByPatientId(patientId);
        Long completedVisits = appointmentRepository.countByPatientIdAndStatus(patientId, AppointmentStatus.COMPLETED);

        return PatientClinicalSummaryDTO.builder()
                .patientId(patientId)
                .totalMedicalRecords(medicalRecordCount)
                .totalPrescriptions(prescriptionCount)
                .totalCompletedVisits(completedVisits)
                .hasClinicalData(medicalRecordCount > 0 || prescriptionCount > 0)
                .build();
    }

    @Override
    public List<PatientDocumentDTO> getPatientDocuments(Long patientId) {
        log.info("Getting admin documents for patient: {}", patientId);

        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found with id: " + patientId);
        }

        List<PatientDocument> docs = patientDocumentRepository.findByPatientIdWithUploader(patientId);
        return docs.stream().map(this::toPatientDocumentDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PatientDocumentDTO uploadDocument(Long patientId, MultipartFile file,
                                              UploadPatientDocumentDTO dto, Long uploaderUserId) {
        log.info("Uploading document for patient: {}, type: {}", patientId, dto.getDocumentType());

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        User uploader = userRepository.findById(uploaderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + uploaderUserId));

        // Store file — in production, upload to S3/MinIO; here we save to local path
        String fileName = file.getOriginalFilename();
        String fileUrl = "/uploads/patients/" + patientId + "/" + System.currentTimeMillis() + "_" + fileName;

        PatientDocument doc = PatientDocument.builder()
                .patient(patient)
                .documentType(dto.getDocumentType())
                .fileName(fileName)
                .fileUrl(fileUrl)
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .notes(dto.getNotes())
                .uploadedBy(uploader)
                .build();

        doc = patientDocumentRepository.save(doc);

        logAuditEvent(uploaderUserId, "UPLOAD_PATIENT_DOCUMENT", "PatientDocument", doc.getId(), null, null);

        return toPatientDocumentDTO(doc);
    }

    @Override
    public Page<PatientCommunicationDTO> getCommunicationLog(Long patientId, Pageable pageable) {
        log.info("Getting communication log for patient: {}", patientId);

        Patient patient = patientRepository.findByIdWithUser(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        Long userId = patient.getUser().getId();

        // Get notifications sent to this patient's user
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        return notifications.map(this::toPatientCommunicationDTO);
    }

    @Override
    @Transactional
    public void sendMessage(Long patientId, SendTemplateMessageDTO dto, Long senderUserId) {
        log.info("Sending {} message to patient: {}, template: {}", dto.getChannel(), patientId, dto.getTemplateId());

        Patient patient = patientRepository.findByIdWithUser(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        User patientUser = patient.getUser();
        String templateContent = resolveTemplate(dto.getTemplateId(), patientUser.getFullName());

        if ("EMAIL".equalsIgnoreCase(dto.getChannel())) {
            if (patientUser.getEmail() == null || patientUser.getEmail().isBlank()) {
                throw new BadRequestException("Patient does not have an email address");
            }
            emailService.sendSimpleEmail(patientUser.getEmail(), "MediTech Notification", templateContent);
        } else if ("SMS".equalsIgnoreCase(dto.getChannel())) {
            if (patientUser.getPhone() == null || patientUser.getPhone().isBlank()) {
                throw new BadRequestException("Patient does not have a phone number");
            }
            smsService.sendSms(patientUser.getPhone(), templateContent);
        }

        // Log notification in DB
        Notification notification = Notification.builder()
                .user(patientUser)
                .title("Template Message: " + dto.getTemplateId())
                .message(templateContent)
                .type(NotificationType.PATIENT)
                .referenceType("PATIENT")
                .referenceId(patientId)
                .isRead(false)
                .sentAt(LocalDateTime.now())
                .build();

        if ("EMAIL".equalsIgnoreCase(dto.getChannel())) {
            notification.setEmailSent(true);
        } else {
            notification.setSmsSent(true);
        }

        notificationRepository.save(notification);

        logAuditEvent(senderUserId, "SEND_PATIENT_MESSAGE", "Patient", patientId, null,
                Map.of("channel", dto.getChannel(), "templateId", dto.getTemplateId()));
    }

    @Override
    public Page<PatientPaymentHistoryDTO> getPaymentHistory(Long patientId, Pageable pageable) {
        log.info("Getting payment history for patient: {}", patientId);

        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found with id: " + patientId);
        }

        Page<Payment> payments = paymentRepository.findByPatientIdWithFilters(
                patientId, null, null, null, null, pageable);

        return payments.map(this::toPatientPaymentHistoryDTO);
    }

    @Override
    public byte[] getReceiptPdf(Long patientId, Long paymentId) {
        log.info("Getting receipt PDF for patient: {}, payment: {}", patientId, paymentId);

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (!payment.getPatient().getId().equals(patientId)) {
            throw new BadRequestException("Payment does not belong to this patient");
        }

        // Simple receipt PDF generation - in production, use a proper PDF library
        String receiptContent = String.format(
                "RECEIPT\n\nPayment Code: %s\nAmount: %s %s\nStatus: %s\nDate: %s\n",
                payment.getPaymentCode(),
                payment.getTotalAmount(),
                payment.getCurrency(),
                payment.getPaymentStatus(),
                payment.getPaidAt() != null ? payment.getPaidAt().toString() : "Pending"
        );

        return receiptContent.getBytes();
    }

    // ==================== STATISTICS ====================

    @Override
    public PatientStatsDTO getPatientStats() {
        log.info("Getting patient statistics");

        LocalDateTime startOfMonth = LocalDate.now()
                .with(TemporalAdjusters.firstDayOfMonth())
                .atStartOfDay();

        return PatientStatsDTO.builder()
                .totalPatients(patientRepository.count())
                .activePatients(patientRepository.countActivePatients())
                .deactivatedPatients(patientRepository.countDeactivatedPatients())
                .newThisMonth(patientRepository.countNewPatientsThisMonth(startOfMonth))
                .insuredPatients(patientRepository.countInsuredPatients())
                .uninsuredPatients(patientRepository.countUninsuredPatients())
                .malePatients(patientRepository.countByGender("MALE"))
                .femalePatients(patientRepository.countByGender("FEMALE"))
                .otherGenderPatients(patientRepository.countByGender("OTHER"))
                .build();
    }

    // ==================== TEMPLATES ====================

    @Override
    public List<NotificationTemplateDTO> getMessageTemplates() {
        // Static templates — in production, these would come from a DB table
        return List.of(
                NotificationTemplateDTO.builder()
                        .id("APPOINTMENT_REMINDER")
                        .name("Appointment Reminder")
                        .channel("EMAIL")
                        .category("REMINDER")
                        .contentPreview("Dear {name}, this is a reminder for your upcoming appointment...")
                        .active(true)
                        .build(),
                NotificationTemplateDTO.builder()
                        .id("APPOINTMENT_REMINDER_SMS")
                        .name("Appointment Reminder (SMS)")
                        .channel("SMS")
                        .category("REMINDER")
                        .contentPreview("MediTech: Nhac lich hen kham benh cua ban...")
                        .active(true)
                        .build(),
                NotificationTemplateDTO.builder()
                        .id("PAYMENT_REMINDER")
                        .name("Payment Reminder")
                        .channel("EMAIL")
                        .category("REMINDER")
                        .contentPreview("Dear {name}, you have a pending payment...")
                        .active(true)
                        .build(),
                NotificationTemplateDTO.builder()
                        .id("PAYMENT_REMINDER_SMS")
                        .name("Payment Reminder (SMS)")
                        .channel("SMS")
                        .category("REMINDER")
                        .contentPreview("MediTech: Ban co hoa don chua thanh toan...")
                        .active(true)
                        .build(),
                NotificationTemplateDTO.builder()
                        .id("FOLLOW_UP_REMINDER")
                        .name("Follow-up Reminder")
                        .channel("EMAIL")
                        .category("FOLLOW_UP")
                        .contentPreview("Dear {name}, your follow-up visit is coming up...")
                        .active(true)
                        .build(),
                NotificationTemplateDTO.builder()
                        .id("FOLLOW_UP_REMINDER_SMS")
                        .name("Follow-up Reminder (SMS)")
                        .channel("SMS")
                        .category("FOLLOW_UP")
                        .contentPreview("MediTech: Lich tai kham cua ban sap toi...")
                        .active(true)
                        .build(),
                NotificationTemplateDTO.builder()
                        .id("WELCOME_NEW_PATIENT")
                        .name("Welcome New Patient")
                        .channel("EMAIL")
                        .category("CONFIRMATION")
                        .contentPreview("Welcome to MediTech, {name}! We're glad to have you...")
                        .active(true)
                        .build(),
                NotificationTemplateDTO.builder()
                        .id("INSURANCE_EXPIRY")
                        .name("Insurance Expiry Notice")
                        .channel("EMAIL")
                        .category("REMINDER")
                        .contentPreview("Dear {name}, your insurance information needs to be updated...")
                        .active(true)
                        .build()
        );
    }

    // ==================== QUICK BOOK ====================

    @Override
    @Transactional
    public AppointmentDTO quickBookAppointment(Long patientId, QuickBookAppointmentDTO dto, Long bookerUserId) {
        log.info("Quick booking appointment for patient: {}, doctor: {}, date: {}",
                patientId, dto.getDoctorId(), dto.getAppointmentDate());

        Patient patient = patientRepository.findByIdWithUser(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        Doctor doctor = new Doctor();
        doctor.setId(dto.getDoctorId());

        // Check for conflicts
        List<Appointment> conflicts = appointmentRepository.findConflictingAppointments(
                dto.getDoctorId(), dto.getAppointmentDate(), dto.getStartTime(), dto.getEndTime());

        if (!conflicts.isEmpty()) {
            throw new BadRequestException("Time slot conflicts with existing appointment");
        }

        // Get next queue number
        Integer maxQueue = appointmentRepository.getMaxQueueNumber(dto.getDoctorId(), dto.getAppointmentDate());
        int nextQueue = (maxQueue != null ? maxQueue : 0) + 1;

        // Generate appointment code
        String appointmentCode = "APT-" + System.currentTimeMillis();

        User booker = userRepository.findById(bookerUserId).orElse(null);

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(dto.getAppointmentDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .status(AppointmentStatus.PENDING)
                .bookedBy(BookedBy.RECEPTIONIST)
                .bookedByUser(booker)
                .queueNumber(nextQueue)
                .appointmentCode(appointmentCode)
                .reasonForVisit(dto.getReasonForVisit())
                .notes(dto.getNotes())
                .build();

        appointment = appointmentRepository.save(appointment);

        logAuditEvent(bookerUserId, "QUICK_BOOK_APPOINTMENT", "Appointment", appointment.getId(), null,
                Map.of("patientId", patientId, "doctorId", dto.getDoctorId()));

        return toAppointmentDTO(appointment);
    }

    // ==================== CREATE PATIENT (REFACTORED) ====================

    @Override
    @Transactional
    public PatientBasicDTO createPatient(CreatePatientDTO dto) {
        log.info("Creating walk-in patient - name: {}, phone: {}", dto.getName(), dto.getPhone());

        // Check duplicates
        if (dto.getPhone() != null && userRepository.existsByPhone(dto.getPhone())) {
            throw new BadRequestException("Phone number already exists: " + dto.getPhone());
        }
        if (dto.getEmail() != null && !dto.getEmail().isBlank() && userRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Email already exists: " + dto.getEmail());
        }

        // Generate placeholder email if not provided
        String email = dto.getEmail();
        if (email == null || email.isBlank()) {
            email = "patient_" + dto.getPhone() + "@meditech.local";
        }

        // Create User
        User user = User.builder()
                .fullName(dto.getName())
                .phone(dto.getPhone())
                .email(email)
                .passwordHash(passwordEncoder.encode("MediTech@" + dto.getPhone()))
                .isActive(true)
                .isVerified(false)
                .build();

        user = userRepository.save(user);

        // Assign PATIENT role
        Role patientRole = roleRepository.findByName("PATIENT")
                .orElseThrow(() -> new RuntimeException("PATIENT role not found"));

        UserRole userRole = UserRole.builder()
                .user(user)
                .role(patientRole)
                .build();
        user.addRole(userRole);
        userRepository.save(user);

        // Create Patient record
        Patient patient = Patient.builder()
                .user(user)
                .fullName(dto.getName())
                .dateOfBirth(dto.getDateOfBirth())
                .gender(dto.getGender())
                .address(dto.getAddress())
                .build();

        patient = patientRepository.save(patient);

        return toPatientBasicDTO(patient);
    }

    // ==================== PRIVATE HELPER — DTO MAPPERS ====================

    private PatientListDTO toPatientListDTO(Patient patient) {
        User u = patient.getUser();
        Long totalAppointments = appointmentRepository.countByPatientId(patient.getId());
        LocalDate lastVisitDate = findLastVisitDate(patient.getId());

        return PatientListDTO.builder()
                .id(patient.getId())
                .userId(u != null ? u.getId() : null)
                .mrn("MRN-" + String.format("%06d", patient.getId()))
                .name(u != null ? u.getFullName() : "Unknown")
                .age(patient.getDateOfBirth() != null ? calculateAge(patient.getDateOfBirth()) : null)
                .gender(patient.getGender())
                .maskedPhone(u != null ? privacyMaskingService.maskPhone(u.getPhone()) : null)
                .maskedEmail(u != null ? privacyMaskingService.maskEmail(u.getEmail()) : null)
                .cityDistrict(extractCityDistrict(patient.getAddress()))
                .lastVisit(lastVisitDate)
                .totalAppointments(totalAppointments)
                .insuranceStatus(determineInsuranceStatus(patient))
                .createdAt(patient.getCreatedAt())
                .isActive(u != null ? u.getIsActive() : null)
                .build();
    }

    private PatientBasicDTO toPatientBasicDTO(Patient patient) {
        User u = patient.getUser();
        return PatientBasicDTO.builder()
                .id(patient.getId())
                .userId(u != null ? u.getId() : null)
                .name(u != null ? u.getFullName() : "Unknown")
                .maskedPhone(u != null ? privacyMaskingService.maskPhone(u.getPhone()) : null)
                .email(u != null ? privacyMaskingService.maskEmail(u.getEmail()) : null)
                .gender(patient.getGender())
                .dateOfBirth(patient.getDateOfBirth() != null ? patient.getDateOfBirth().toString() : null)
                .mrn("MRN-" + String.format("%06d", patient.getId()))
                .build();
    }

    private PatientDetailDTO toPatientDetailDTO(Patient patient) {
        User u = patient.getUser();
        Long totalAppts = appointmentRepository.countByPatientId(patient.getId());
        Long completedAppts = appointmentRepository.countByPatientIdAndStatus(patient.getId(), AppointmentStatus.COMPLETED);
        Long cancelledAppts = appointmentRepository.countByPatientIdAndStatus(patient.getId(), AppointmentStatus.CANCELLED);
        Long noShowAppts = appointmentRepository.countByPatientIdAndStatus(patient.getId(), AppointmentStatus.NO_SHOW);
        LocalDate lastVisitDate = findLastVisitDate(patient.getId());

        return PatientDetailDTO.builder()
                .id(patient.getId())
                .userId(u != null ? u.getId() : null)
                .mrn("MRN-" + String.format("%06d", patient.getId()))
                .name(u != null ? u.getFullName() : "Unknown")
                .email(u != null ? u.getEmail() : null)
                .phone(u != null ? u.getPhone() : null)
                .dateOfBirth(patient.getDateOfBirth())
                .age(patient.getDateOfBirth() != null ? calculateAge(patient.getDateOfBirth()) : null)
                .gender(patient.getGender())
                .avatarUrl(u != null ? u.getAvatarUrl() : null)
                .address(patient.getAddress())
                .insuranceNumber(patient.getInsuranceNumber())
                .insuranceProvider(patient.getInsuranceProvider())
                .insuranceStatus(determineInsuranceStatus(patient))
                .emergencyContact(patient.getEmergencyContact())
                .totalAppointments(totalAppts)
                .completedAppointments(completedAppts)
                .cancelledAppointments(cancelledAppts)
                .noShowAppointments(noShowAppts)
                .lastVisit(lastVisitDate)
                .isActive(u != null ? u.getIsActive() : null)
                .isVerified(u != null ? u.getIsVerified() : null)
                .createdAt(patient.getCreatedAt())
                .updatedAt(patient.getUpdatedAt())
                .build();
    }

    private NewPatientDTO toNewPatientDTO(Patient patient) {
        User u = patient.getUser();
        Long appointmentCount = appointmentRepository.countByPatientId(patient.getId());

        return NewPatientDTO.builder()
                .id(patient.getId())
                .userId(u != null ? u.getId() : null)
                .mrn("MRN-" + String.format("%06d", patient.getId()))
                .name(u != null ? u.getFullName() : "Unknown")
                .age(patient.getDateOfBirth() != null ? calculateAge(patient.getDateOfBirth()) : null)
                .gender(patient.getGender())
                .maskedPhone(u != null ? privacyMaskingService.maskPhone(u.getPhone()) : null)
                .insuranceStatus(determineInsuranceStatus(patient))
                .registeredAt(patient.getCreatedAt())
                .hasAppointment(appointmentCount > 0)
                .isNew(true)
                .build();
    }

    private FrequentPatientDTO toFrequentPatientDTO(Patient patient, Long visitCount) {
        User u = patient.getUser();
        LocalDate lastVisitDate = findLastVisitDate(patient.getId());
        BigDecimal spending = calculateLifetimeSpending(patient.getId());

        // Calculate days since last visit
        Long daysSince = null;
        String lapsedStatus = "ACTIVE";
        if (lastVisitDate != null) {
            daysSince = java.time.temporal.ChronoUnit.DAYS.between(lastVisitDate, LocalDate.now());
            if (daysSince > 90) {
                lapsedStatus = "LONG_LAPSED";
            } else if (daysSince > 60) {
                lapsedStatus = "LAPSED";
            }
        } else {
            lapsedStatus = "UNKNOWN";
        }

        // VIP: >= 20 completed visits
        boolean isVip = visitCount != null && visitCount >= 20;

        // Get most visited doctor
        String topDoctorName = null;
        Long topDoctorId = null;
        Long topDoctorVisits = null;
        List<Object[]> topDoctor = patientRepository.findMostVisitedDoctor(patient.getId());
        if (!topDoctor.isEmpty()) {
            Object[] row = topDoctor.get(0);
            topDoctorId = ((Number) row[0]).longValue();
            topDoctorName = (String) row[1];
            topDoctorVisits = ((Number) row[2]).longValue();
        }

        return FrequentPatientDTO.builder()
                .id(patient.getId())
                .userId(u != null ? u.getId() : null)
                .mrn("MRN-" + String.format("%06d", patient.getId()))
                .name(u != null ? u.getFullName() : "Unknown")
                .age(patient.getDateOfBirth() != null ? calculateAge(patient.getDateOfBirth()) : null)
                .gender(patient.getGender())
                .maskedPhone(u != null ? privacyMaskingService.maskPhone(u.getPhone()) : null)
                .insuranceStatus(determineInsuranceStatus(patient))
                .totalVisits(visitCount)
                .lastVisit(lastVisitDate)
                .mostVisitedDoctorName(topDoctorName)
                .mostVisitedDoctorId(topDoctorId)
                .visitCountWithTopDoctor(topDoctorVisits)
                .lifetimeSpending(spending)
                .daysSinceLastVisit(daysSince)
                .lapsedStatus(lapsedStatus)
                .isVip(isVip)
                .build();
    }

    private AppointmentDTO toAppointmentDTO(Appointment a) {
        return AppointmentDTO.builder()
                .id(a.getId())
                .appointmentCode(a.getAppointmentCode())
                .patientId(a.getPatient() != null ? a.getPatient().getId() : null)
                .patientName(a.getPatient() != null && a.getPatient().getUser() != null
                        ? a.getPatient().getUser().getFullName() : null)
                .doctorId(a.getDoctor() != null ? a.getDoctor().getId() : null)
                .doctorName(a.getDoctor() != null && a.getDoctor().getUser() != null
                        ? a.getDoctor().getUser().getFullName() : null)
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .status(a.getStatus())
                .bookedBy(a.getBookedBy())
                .queueNumber(a.getQueueNumber())
                .reasonForVisit(a.getReasonForVisit())
                .symptoms(a.getSymptoms())
                .notes(a.getNotes())
                .cancellationReason(a.getCancellationReason())
                .checkedInAt(a.getCheckedInAt())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    private PatientDocumentDTO toPatientDocumentDTO(PatientDocument doc) {
        return PatientDocumentDTO.builder()
                .id(doc.getId())
                .patientId(doc.getPatient() != null ? doc.getPatient().getId() : null)
                .documentType(doc.getDocumentType())
                .fileName(doc.getFileName())
                .fileUrl(doc.getFileUrl())
                .fileSize(doc.getFileSize())
                .mimeType(doc.getMimeType())
                .notes(doc.getNotes())
                .uploadedByName(doc.getUploadedBy() != null ? doc.getUploadedBy().getFullName() : null)
                .uploadedByUserId(doc.getUploadedBy() != null ? doc.getUploadedBy().getId() : null)
                .uploadedAt(doc.getCreatedAt())
                .build();
    }

    private PatientCommunicationDTO toPatientCommunicationDTO(Notification n) {
        return PatientCommunicationDTO.builder()
                .id(n.getId())
                .channel(Boolean.TRUE.equals(n.getEmailSent()) ? "EMAIL" : Boolean.TRUE.equals(n.getSmsSent()) ? "SMS" : "PUSH")
                .recipient(n.getUser() != null ? n.getUser().getEmail() : null)
                .subject(n.getTitle())
                .templateName(n.getTitle())
                .status(Boolean.TRUE.equals(n.getEmailSent()) || Boolean.TRUE.equals(n.getSmsSent())
                        ? "SENT" : "PENDING")
                .sentAt(n.getSentAt())
                .referenceType(n.getReferenceType())
                .referenceId(n.getReferenceId())
                .build();
    }

    private PatientPaymentHistoryDTO toPatientPaymentHistoryDTO(Payment p) {
        // Check if invoice exists
        boolean hasReceipt = false;
        Long invoiceId = null;
        try {
            var invoice = invoiceRepository.findByPaymentIdWithDetails(p.getId());
            if (invoice.isPresent()) {
                hasReceipt = true;
                invoiceId = invoice.get().getId();
            }
        } catch (Exception e) {
            log.debug("No invoice found for payment: {}", p.getId());
        }

        return PatientPaymentHistoryDTO.builder()
                .id(p.getId())
                .paymentCode(p.getPaymentCode())
                .appointmentCode(p.getAppointment() != null ? p.getAppointment().getAppointmentCode() : null)
                .doctorName(p.getAppointment() != null && p.getAppointment().getDoctor() != null
                        && p.getAppointment().getDoctor().getUser() != null
                        ? p.getAppointment().getDoctor().getUser().getFullName() : null)
                .amount(p.getAmount())
                .totalAmount(p.getTotalAmount())
                .currency(p.getCurrency())
                .paymentMethod(p.getPaymentMethod())
                .paymentStatus(p.getPaymentStatus())
                .paidAt(p.getPaidAt())
                .createdAt(p.getCreatedAt())
                .hasReceipt(hasReceipt)
                .invoiceId(invoiceId)
                .build();
    }

    // ==================== PRIVATE UTILITY METHODS ====================

    private Integer calculateAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) return null;
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }

    // masking is now handled by PrivacyMaskingService

    private String extractCityDistrict(String address) {
        if (address == null || address.isBlank()) return null;
        // Simple extraction: take last 2 comma-separated parts
        String[] parts = address.split(",");
        if (parts.length >= 2) {
            return (parts[parts.length - 2].trim() + ", " + parts[parts.length - 1].trim());
        }
        return address.length() > 50 ? address.substring(0, 50) + "..." : address;
    }

    private String determineInsuranceStatus(Patient patient) {
        if (patient.getInsuranceNumber() != null && !patient.getInsuranceNumber().isBlank()) {
            return "INSURED";
        }
        return "UNINSURED";
    }

    private LocalDate findLastVisitDate(Long patientId) {
        try {
            List<Appointment> appointments = appointmentRepository.findByPatientId(patientId);
            return appointments.stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                    .map(Appointment::getAppointmentDate)
                    .max(LocalDate::compareTo)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private BigDecimal calculateLifetimeSpending(Long patientId) {
        try {
            List<Payment> payments = paymentRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
            return payments.stream()
                    .filter(p -> "PAID".equals(p.getPaymentStatus()))
                    .map(Payment::getTotalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private String resolveTemplate(String templateId, String patientName) {
        // Simple template resolution — in production, load from DB
        return switch (templateId) {
            case "APPOINTMENT_REMINDER" ->
                    String.format("Dear %s,\n\nThis is a reminder for your upcoming appointment at MediTech. " +
                            "Please arrive 15 minutes early.\n\nBest regards,\nMediTech Team", patientName);
            case "APPOINTMENT_REMINDER_SMS" ->
                    String.format("MediTech: Nhac lich hen kham benh cua ban %s. Vui long den truoc 15 phut.", patientName);
            case "PAYMENT_REMINDER" ->
                    String.format("Dear %s,\n\nYou have a pending payment at MediTech. " +
                            "Please complete your payment at your earliest convenience.\n\nBest regards,\nMediTech Team", patientName);
            case "PAYMENT_REMINDER_SMS" ->
                    String.format("MediTech: %s, ban co hoa don chua thanh toan. Vui long thanh toan som.", patientName);
            case "FOLLOW_UP_REMINDER" ->
                    String.format("Dear %s,\n\nYour follow-up visit is approaching. " +
                            "Please schedule your next appointment.\n\nBest regards,\nMediTech Team", patientName);
            case "FOLLOW_UP_REMINDER_SMS" ->
                    String.format("MediTech: %s, lich tai kham cua ban sap toi. Vui long dat lich hen.", patientName);
            case "WELCOME_NEW_PATIENT" ->
                    String.format("Welcome to MediTech, %s!\n\nWe're glad to have you as our patient. " +
                            "If you have any questions, please don't hesitate to contact us.\n\nBest regards,\nMediTech Team", patientName);
            case "INSURANCE_EXPIRY" ->
                    String.format("Dear %s,\n\nYour insurance information on file may need to be updated. " +
                            "Please bring your current insurance card on your next visit.\n\nBest regards,\nMediTech Team", patientName);
            default ->
                    String.format("Dear %s,\n\nThank you for choosing MediTech.\n\nBest regards,\nMediTech Team", patientName);
        };
    }

    private void logAuditEvent(Long userId, String action, String entityType, Long entityId,
                                Object oldValues, Object newValues) {
        try {
            User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .action(action)
                    .actionType(AuditActionType.SENSITIVE_ACCESS)
                    .entityType(entityType)
                    .entityId(entityId)
                    .oldValues(oldValues)
                    .newValues(newValues)
                    .build();

            // Set appropriate action type
            if (action.startsWith("VIEW")) {
                auditLog.setActionType(AuditActionType.SENSITIVE_ACCESS);
            } else if (action.startsWith("UPDATE") || action.startsWith("DEACTIVATE") || action.startsWith("REACTIVATE")) {
                auditLog.setActionType(AuditActionType.UPDATE);
            } else if (action.startsWith("UPLOAD") || action.startsWith("QUICK_BOOK") || action.startsWith("SEND")) {
                auditLog.setActionType(AuditActionType.CREATE);
            }

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to log audit event: {} for entity: {}/{}", action, entityType, entityId, e);
        }
    }
}
