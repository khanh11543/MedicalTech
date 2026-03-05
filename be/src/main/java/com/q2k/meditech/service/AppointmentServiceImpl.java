package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.receptionist.*;
import com.q2k.meditech.dto.statistics.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.BookedBy;
import com.q2k.meditech.entity.enums.NotificationType;
import com.q2k.meditech.entity.enums.TimeSlotStatus;
import com.q2k.meditech.exception.AppointmentException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.dto.mapper.AppointmentMapper;
import com.q2k.meditech.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AppointmentServiceImpl implements AppointmentService {
    
    private final AppointmentRepository appointmentRepository;
    private final AppointmentHistoryRepository historyRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final AppointmentMapper appointmentMapper;
    private final PrescriptionRepository prescriptionRepository;
    private final ReviewRepository reviewRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationEventService notificationEventService;
    private final TimeSlotRepository timeSlotRepository;
    private final EmailService emailService;
    private final PrivacyMaskingService privacyMaskingService;
    
    // ==================== BOOKING ====================
    
    @Override
    public AppointmentDTO bookAppointment(BookAppointmentDTO dto, Long bookedByUserId, BookedBy bookedBy) {
        log.info("Booking appointment for patient {} with doctor {}", dto.getPatientId(), dto.getDoctorId());
        
        // Resolve startTime/endTime from timeSlotId if provided
        TimeSlot bookedSlot = null;
        if (dto.getTimeSlotId() != null) {
            bookedSlot = timeSlotRepository.findById(dto.getTimeSlotId())
                    .orElseThrow(() -> new ResourceNotFoundException("Time slot not found with id: " + dto.getTimeSlotId()));
            if (bookedSlot.getStatus() != TimeSlotStatus.AVAILABLE) {
                throw new AppointmentException("Selected time slot is no longer available");
            }
            dto.setStartTime(bookedSlot.getStartTime());
            dto.setEndTime(bookedSlot.getEndTime());
            // Mark slot as booked
            bookedSlot.setStatus(TimeSlotStatus.BOOKED);
            timeSlotRepository.save(bookedSlot);
        }
        
        // Validate startTime and endTime are present
        if (dto.getStartTime() == null || dto.getEndTime() == null) {
            throw new AppointmentException("Start time and end time are required");
        }
        
        // Validate patient
        Patient patient = patientRepository.findByIdWithUser(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + dto.getPatientId()));
        
        // Validate doctor
        Doctor doctor = doctorRepository.findByIdWithUser(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + dto.getDoctorId()));
        
        // Check doctor availability (null is treated as available=true by default)
        if (Boolean.FALSE.equals(doctor.getIsAvailable())) {
            throw new AppointmentException("Doctor is not available for appointments");
        }
        
        // Check for time slot conflicts
        List<Appointment> conflicts = appointmentRepository.findConflictingAppointments(
                dto.getDoctorId(),
                dto.getAppointmentDate(),
                dto.getStartTime(),
                dto.getEndTime()
        );
        
        if (!conflicts.isEmpty()) {
            throw new AppointmentException.TimeSlotConflictException();
        }
        
        // Get the user who booked the appointment
        User bookedByUser = userRepository.findById(bookedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + bookedByUserId));
        
        // Create appointment
        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(dto.getAppointmentDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .status(AppointmentStatus.PENDING)
                .bookedBy(bookedBy)
                .bookedByUser(bookedByUser)
                .reasonForVisit(dto.getReasonForVisit())
                .symptoms(dto.getSymptoms())
                .notes(dto.getNotes())
                .timeSlot(bookedSlot)
                .build();
        
        appointment = appointmentRepository.save(appointment);
        
        // Create history entry
        createHistory(appointment, "CREATED", null, AppointmentStatus.PENDING, 
                bookedByUserId, bookedBy.name(), "Appointment booked");
        
        log.info("Appointment created with ID: {}", appointment.getId());

        // Send notification: new booking
        try {
            notificationEventService.onNewBooking(appointment);
        } catch (Exception e) {
            log.warn("Failed to send new booking notification: {}", e.getMessage());
        }
        
        return appointmentMapper.toDTO(appointment);
    }
    
    // ==================== PATIENT APIs ====================
    
    @Override
    @Transactional(readOnly = true)
    public Page<AppointmentDTO> getPatientAppointments(Long patientId, AppointmentFilterDTO filter) {
        log.info("Getting appointments for patient {}", patientId);
        
        filter.setPatientId(patientId);
        Pageable pageable = createPageable(filter);
        
        Page<Appointment> appointments = appointmentRepository.findAll(
                AppointmentSpecification.withFilter(filter), 
                pageable
        );
        
        return appointments.map(appointmentMapper::toDTO);
    }
    
    // ==================== DOCTOR APIs ====================
    
    @Override
    @Transactional(readOnly = true)
    public Page<AppointmentDTO> getDoctorAppointments(Long doctorId, AppointmentFilterDTO filter) {
        log.info("Getting appointments for doctor {}", doctorId);
        
        filter.setDoctorId(doctorId);
        Pageable pageable = createPageable(filter);
        
        Page<Appointment> appointments = appointmentRepository.findAll(
                AppointmentSpecification.withFilter(filter), 
                pageable
        );
        
        return appointments.map(appointmentMapper::toDTO);
    }
    
    /**
     * SHARED confirm appointment — role-aware.
     * DOCTOR: verifies ownership. RECEPTIONIST/ADMIN: can confirm any PENDING appointment.
     */
    @Override
    public AppointmentDTO confirmAppointment(Long appointmentId, String adminNote, Long userId, String callerRole) {
        log.info("{} {} confirming appointment {}", callerRole, userId, appointmentId);
        
        Appointment appointment = getAppointmentEntity(appointmentId);
        
        // DOCTOR role: verify ownership
        if ("DOCTOR".equalsIgnoreCase(callerRole)) {
            Doctor doctor = doctorRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found for user"));
            if (!appointment.getDoctor().getId().equals(doctor.getId())) {
                throw new AppointmentException.UnauthorizedAccessException();
            }
        }
        
        // Check valid status transition
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new AppointmentException.InvalidStatusTransitionException(
                    appointment.getStatus().name(), AppointmentStatus.CONFIRMED.name());
        }
        
        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment = appointmentRepository.save(appointment);
        
        // Build reason with optional note
        String reason = "Confirmed by " + callerRole.toLowerCase();
        if (adminNote != null && !adminNote.isBlank()) {
            reason += " — Note: " + adminNote;
        }
        createHistory(appointment, "CONFIRMED", oldStatus, AppointmentStatus.CONFIRMED,
                userId, callerRole.toUpperCase(), reason);
        
        return appointmentMapper.toDTO(appointment);
    }
    
    // ==================== RECEPTIONIST APIs ====================
    
    @Override
    public AppointmentDTO checkInPatient(Long appointmentId, Long receptionistUserId) {
        log.info("User {} checking in patient for appointment {}", receptionistUserId, appointmentId);
        
        Appointment appointment = getAppointmentEntity(appointmentId);
        
        // 1. Check valid status: CONFIRMED or PENDING
        if (appointment.getStatus() != AppointmentStatus.CONFIRMED 
                && appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new AppointmentException(
                "Only CONFIRMED or PENDING appointments can be checked in. Current status: " 
                + appointment.getStatus());
        }
        
        // 2. Check-in time window validation: 30 min before → 15 min after appointment start
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime appointmentStart = LocalDateTime.of(
                appointment.getAppointmentDate(), appointment.getStartTime());
        LocalDateTime windowStart = appointmentStart.minusMinutes(30);
        LocalDateTime windowEnd = appointmentStart.plusMinutes(15);
        
        if (now.isBefore(windowStart)) {
            long minutesEarly = java.time.Duration.between(now, windowStart).toMinutes();
            throw new AppointmentException(
                "Too early to check in. Check-in opens 30 minutes before appointment time. " 
                + "Please come back in " + minutesEarly + " minutes.");
        }
        
        if (now.isAfter(windowEnd)) {
            long minutesLate = java.time.Duration.between(windowEnd, now).toMinutes();
            throw new AppointmentException(
                "Check-in window has closed. The appointment was " + minutesLate 
                + " minutes ago. Please contact reception to reschedule.");
        }
        
        // 3. Get next queue number
        Integer maxQueue = appointmentRepository.getMaxQueueNumber(
                appointment.getDoctor().getId(), 
                appointment.getAppointmentDate()
        );
        int newQueueNumber = (maxQueue != null ? maxQueue : 0) + 1;
        
        // 4. Update appointment
        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.CHECKED_IN);
        appointment.setQueueNumber(newQueueNumber);
        appointment.setCheckedInAt(now);
        appointment.setCheckedInBy(receptionistUserId);
        appointment = appointmentRepository.save(appointment);
        
        // 5. Create history
        String role = "RECEPTIONIST";
        createHistory(appointment, "CHECKED_IN", oldStatus, AppointmentStatus.CHECKED_IN,
                receptionistUserId, role, "Patient checked in, queue number: " + newQueueNumber);

        // 6. Send notification: patient checked in
        try {
            notificationEventService.onPatientCheckedIn(appointment, newQueueNumber, null);
        } catch (Exception e) {
            log.warn("Failed to send check-in notification: {}", e.getMessage());
        }
        
        return appointmentMapper.toDTO(appointment);
    }

    // ==================== RECEPTIONIST APPOINTMENT TAB APIs ====================

    /**
     * #2 — Upcoming appointments (from today onwards), paginated
     */
    @Override
    @Transactional(readOnly = true)
    public Page<ReceptionistAppointmentListDTO> getUpcomingAppointments(
            LocalDate from, LocalDate to, int pageNumber, int pageSize) {

        LocalDate startDate = from != null ? from : LocalDate.now();
        LocalDate endDate = to != null ? to : startDate.plusDays(30);

        log.info("Getting upcoming appointments from {} to {}", startDate, endDate);

        AppointmentFilterDTO filter = AppointmentFilterDTO.builder()
                .from(startDate)
                .to(endDate)
                .statuses(List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED))
                .sortBy("appointmentDate")
                .sortDir("ASC")
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();

        Page<AppointmentDTO> page = getAllAppointments(filter);
        return page.map(dto -> ReceptionistAppointmentListDTO.fromAppointmentDTO(
                dto, privacyMaskingService.maskPhone(dto.getPatientPhone())));
    }

    /**
     * #4 — Bulk confirm PENDING appointments
     */
    @Override
    public BulkActionResultDTO bulkConfirmAppointments(BulkConfirmDTO dto, Long receptionistUserId) {
        log.info("Receptionist {} bulk confirming {} appointments", receptionistUserId, dto.getAppointmentIds().size());

        List<BulkActionResultDTO.ItemResult> results = new ArrayList<>();
        int successCount = 0;
        int failCount = 0;

        for (Long appointmentId : dto.getAppointmentIds()) {
            try {
                Appointment appointment = appointmentRepository.findByIdWithDetails(appointmentId)
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

                if (appointment.getStatus() != AppointmentStatus.PENDING) {
                    results.add(BulkActionResultDTO.failItem(
                            appointmentId,
                            appointment.getAppointmentCode(),
                            "Not in PENDING status (current: " + appointment.getStatus().name() + ")",
                            "INVALID_STATUS"
                    ));
                    failCount++;
                    continue;
                }

                AppointmentStatus oldStatus = appointment.getStatus();
                appointment.setStatus(AppointmentStatus.CONFIRMED);
                appointmentRepository.save(appointment);

                String reason = "Bulk confirmed by receptionist";
                if (dto.getAdminNote() != null && !dto.getAdminNote().isBlank()) {
                    reason += " — " + dto.getAdminNote();
                }
                createHistory(appointment, "CONFIRMED", oldStatus, AppointmentStatus.CONFIRMED,
                        receptionistUserId, "RECEPTIONIST", reason);

                results.add(BulkActionResultDTO.successItem(
                        appointmentId, appointment.getAppointmentCode(), "Confirmed successfully"));
                successCount++;

            } catch (ResourceNotFoundException e) {
                results.add(BulkActionResultDTO.failItem(appointmentId, null, e.getMessage(), "NOT_FOUND"));
                failCount++;
            } catch (Exception e) {
                results.add(BulkActionResultDTO.failItem(appointmentId, null, "Error: " + e.getMessage(), "ERROR"));
                failCount++;
            }
        }

        return BulkActionResultDTO.builder()
                .totalProcessed(dto.getAppointmentIds().size())
                .successCount(successCount)
                .failCount(failCount)
                .results(results)
                .message(String.format("Confirmed %d appointments, %d failed", successCount, failCount))
                .build();
    }

    /**
     * #7 — Send single appointment reminder (template-based)
     */
    @Override
    public CommunicationLogDTO sendAppointmentReminder(Long appointmentId, SendReminderDTO dto, Long receptionistUserId) {
        log.info("Receptionist {} sending {} reminder for appointment {}", receptionistUserId, dto.getChannel(), appointmentId);

        Appointment appointment = getAppointmentEntity(appointmentId);

        // Validate appointment status — can only remind PENDING or CONFIRMED
        if (appointment.getStatus() == AppointmentStatus.CANCELLED ||
            appointment.getStatus() == AppointmentStatus.COMPLETED ||
            appointment.getStatus() == AppointmentStatus.NO_SHOW) {
            throw new AppointmentException("Cannot send reminder for " + appointment.getStatus().name() + " appointment");
        }

        Patient patient = appointment.getPatient();
        String recipient = "EMAIL".equals(dto.getChannel())
                ? patient.getUser().getEmail()
                : patient.getUser().getPhone();

        // Build template content
        String subject = "Nhắc nhở lịch hẹn - " + appointment.getAppointmentCode();
        String message = String.format(
                "Kính gửi %s,\nBạn có lịch hẹn vào ngày %s lúc %s với BS. %s.\nMã lịch hẹn: %s.\nVui lòng đến đúng giờ.",
                patient.getUser().getFullName(),
                appointment.getAppointmentDate(),
                appointment.getStartTime(),
                appointment.getDoctor().getUser().getFullName(),
                appointment.getAppointmentCode()
        );

        // Resolve template content if templateId provided
        if (dto.getTemplateId() != null && !dto.getTemplateId().isBlank()) {
            message = resolveTemplateForReminder(dto.getTemplateId(), appointment);
        }

        // Create notification record
        Notification notification = Notification.builder()
                .user(patient.getUser())
                .title(subject)
                .message(message)
                .type(NotificationType.APPOINTMENT)
                .referenceType("APPOINTMENT")
                .referenceId(appointmentId)
                .isRead(false)
                .emailSent("EMAIL".equals(dto.getChannel()))
                .smsSent("SMS".equals(dto.getChannel()))
                .build();
        notification = notificationRepository.save(notification);

        // Actually send the email/SMS
        if ("EMAIL".equals(dto.getChannel()) && recipient != null) {
            try {
                String htmlContent = buildReminderEmailHtml(subject, message, appointment);
                emailService.sendHtmlEmail(recipient, subject, htmlContent);
                log.info("Reminder email sent to: {} for appointment {}", recipient, appointmentId);
            } catch (Exception e) {
                log.error("Failed to send reminder email to: {} for appointment {}", recipient, appointmentId, e);
            }
        } else if ("SMS".equals(dto.getChannel())) {
            log.warn("SMS sending not implemented yet for appointment {}", appointmentId);
        }

        // Create history
        createHistory(appointment, "REMINDER_SENT", appointment.getStatus(), appointment.getStatus(),
                receptionistUserId, "RECEPTIONIST", "Reminder sent via " + dto.getChannel());

        return CommunicationLogDTO.builder()
                .id(notification.getId())
                .type(dto.getChannel())
                .recipient(recipient)
                .subject(subject)
                .message(message)
                .status("SENT")
                .sentByUserId(receptionistUserId)
                .sentAt(notification.getCreatedAt())
                .category("REMINDER")
                .build();
    }

    /**
     * #10 — Send template-based message (no free text)
     */
    @Override
    public CommunicationLogDTO sendTemplateMessage(Long appointmentId, SendTemplateMessageDTO dto, Long receptionistUserId) {
        log.info("Receptionist {} sending template message {} for appointment {}", receptionistUserId, dto.getTemplateId(), appointmentId);

        Appointment appointment = getAppointmentEntity(appointmentId);
        Patient patient = appointment.getPatient();

        // Resolve template content (simplified — in production, load from DB/config)
        String templateContent = resolveTemplate(dto.getTemplateId(), appointment);
        String subject = "Thông báo lịch hẹn - " + appointment.getAppointmentCode();

        String recipient = "EMAIL".equals(dto.getChannel())
                ? patient.getUser().getEmail()
                : patient.getUser().getPhone();

        Notification notification = Notification.builder()
                .user(patient.getUser())
                .title(subject)
                .message(templateContent)
                .type(NotificationType.APPOINTMENT)
                .referenceType("APPOINTMENT")
                .referenceId(appointmentId)
                .isRead(false)
                .emailSent("EMAIL".equals(dto.getChannel()))
                .smsSent("SMS".equals(dto.getChannel()))
                .build();
        notification = notificationRepository.save(notification);

        // Actually send the email/SMS
        if ("EMAIL".equals(dto.getChannel()) && recipient != null) {
            try {
                String htmlContent = buildReminderEmailHtml(subject, templateContent, appointment);
                emailService.sendHtmlEmail(recipient, subject, htmlContent);
                log.info("Template email sent to: {} for appointment {}", recipient, appointmentId);
            } catch (Exception e) {
                log.error("Failed to send template email to: {} for appointment {}", recipient, appointmentId, e);
            }
        } else if ("SMS".equals(dto.getChannel())) {
            log.warn("SMS sending not implemented yet for appointment {}", appointmentId);
        }

        createHistory(appointment, "MESSAGE_SENT", appointment.getStatus(), appointment.getStatus(),
                receptionistUserId, "RECEPTIONIST", "Template message sent: " + dto.getTemplateId());

        return CommunicationLogDTO.builder()
                .id(notification.getId())
                .type(dto.getChannel())
                .recipient(recipient)
                .subject(subject)
                .status("SENT")
                .sentByUserId(receptionistUserId)
                .sentAt(notification.getCreatedAt())
                .category("CUSTOM")
                .build();
    }

    /**
     * #11 — Document summaries (receptionist-safe: clinical docs show "exists" only)
     */
    @Override
    @Transactional(readOnly = true)
    public List<DocumentSummaryDTO> getAppointmentDocuments(Long appointmentId) {
        log.info("Getting document summaries for appointment {}", appointmentId);
        getAppointmentEntity(appointmentId);

        List<DocumentSummaryDTO> docs = new ArrayList<>();

        // Check for invoice/receipt (accessible)
        boolean hasPayment = paymentRepository.findByAppointmentIdWithDetails(appointmentId).isPresent();
        docs.add(DocumentSummaryDTO.builder()
                .type("INVOICE").label("Hóa đơn").exists(hasPayment).accessible(hasPayment)
                .downloadUrl(hasPayment ? "/api/receptionist/payments/invoices/by-appointment/" + appointmentId : null)
                .build());
        docs.add(DocumentSummaryDTO.builder()
                .type("RECEIPT").label("Biên lai").exists(hasPayment).accessible(hasPayment)
                .downloadUrl(hasPayment ? "/api/receptionist/payments/invoices/by-appointment/" + appointmentId : null)
                .build());

        // Check for check-in slip (accessible)
        docs.add(DocumentSummaryDTO.builder()
                .type("SLIP").label("Phiếu khám").exists(true).accessible(true)
                .downloadUrl("/api/receptionist/appointments/" + appointmentId + "/print-slip")
                .build());

        // Prescription (exists but NOT accessible to receptionist)
        boolean hasPrescription = prescriptionRepository.findByAppointmentId(appointmentId).isPresent();
        docs.add(DocumentSummaryDTO.builder()
                .type("PRESCRIPTION").label("Đơn thuốc").exists(hasPrescription).accessible(false)
                .downloadUrl(null)
                .build());

        // Medical record (exists but NOT accessible to receptionist)
        docs.add(DocumentSummaryDTO.builder()
                .type("MEDICAL_RECORD").label("Hồ sơ bệnh án").exists(false).accessible(false)
                .downloadUrl(null)
                .build());

        return docs;
    }

    /**
     * #14 — Create follow-up appointment from a COMPLETED appointment
     */
    @Override
    public AppointmentDTO createFollowUp(Long appointmentId, CreateFollowUpDTO dto, Long receptionistUserId) {
        log.info("Receptionist {} creating follow-up for appointment {}", receptionistUserId, appointmentId);

        Appointment original = getAppointmentEntity(appointmentId);

        if (original.getStatus() != AppointmentStatus.COMPLETED) {
            throw new AppointmentException("Follow-up can only be created from COMPLETED appointments");
        }

        Long doctorId = dto.getDoctorId() != null ? dto.getDoctorId() : original.getDoctor().getId();

        // Check conflicts
        List<Appointment> conflicts = appointmentRepository.findConflictingAppointmentsExcluding(
                doctorId, dto.getAppointmentDate(), dto.getStartTime(), dto.getEndTime(), 0L);
        if (!conflicts.isEmpty()) {
            throw new AppointmentException.TimeSlotConflictException();
        }

        BookAppointmentDTO bookDTO = BookAppointmentDTO.builder()
                .patientId(original.getPatient().getId())
                .doctorId(doctorId)
                .appointmentDate(dto.getAppointmentDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .reasonForVisit("FOLLOW_UP")
                .notes(dto.getAdminNote())
                .build();

        AppointmentDTO result = bookAppointment(bookDTO, receptionistUserId, BookedBy.RECEPTIONIST);

        // Create history on original
        createHistory(original, "FOLLOW_UP_CREATED", original.getStatus(), original.getStatus(),
                receptionistUserId, "RECEPTIONIST", "Follow-up appointment created: " + result.getAppointmentCode());

        return result;
    }

    /**
     * #15 — Generate check-in slip PDF
     */
    @Override
    @Transactional(readOnly = true)
    public byte[] generateCheckInSlip(Long appointmentId) {
        log.info("Generating check-in slip for appointment {}", appointmentId);

        Appointment appointment = getAppointmentEntity(appointmentId);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {

            writer.println("═══════════════════════════════════");
            writer.println("        PHIẾU KHÁM BỆNH           ");
            writer.println("═══════════════════════════════════");
            writer.println();
            writer.printf("Mã hẹn:   %s%n", appointment.getAppointmentCode());
            writer.printf("Ngày:     %s%n", appointment.getAppointmentDate());
            writer.printf("Giờ:      %s - %s%n", appointment.getStartTime(), appointment.getEndTime());
            writer.println();
            writer.printf("Bệnh nhân: %s%n", appointment.getPatient().getUser().getFullName());
            writer.printf("SĐT:      %s%n", maskPhone(appointment.getPatient().getUser().getPhone()));
            writer.println();
            writer.printf("Bác sĩ:   %s%n", appointment.getDoctor().getUser().getFullName());
            writer.printf("Chuyên khoa: %s%n", appointment.getDoctor().getSpecialization());
            if (appointment.getQueueNumber() != null) {
                writer.printf("Số thứ tự: %d%n", appointment.getQueueNumber());
            }
            writer.println();
            writer.printf("Trạng thái: %s%n", appointment.getStatus().name());
            writer.println();
            writer.println("═══════════════════════════════════");
            writer.printf("In lúc: %s%n", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

            writer.flush();
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Error generating check-in slip", e);
            throw new RuntimeException("Failed to generate check-in slip", e);
        }
    }

    /**
     * #16 — Get available notification templates
     */
    @Override
    @Transactional(readOnly = true)
    public List<NotificationTemplateDTO> getNotificationTemplates() {
        log.info("Getting notification templates for receptionist");

        // Return predefined templates
        // In production, load from a notification_templates table
        return List.of(
                NotificationTemplateDTO.builder()
                        .id("REMINDER_EMAIL").name("Nhắc nhở lịch hẹn (Email)")
                        .channel("EMAIL").category("REMINDER")
                        .contentPreview("Kính gửi {patient_name}, bạn có lịch hẹn vào ngày {date}...")
                        .active(true).build(),
                NotificationTemplateDTO.builder()
                        .id("REMINDER_SMS").name("Nhắc nhở lịch hẹn (SMS)")
                        .channel("SMS").category("REMINDER")
                        .contentPreview("Xin chào {patient_name}, nhắc nhở lịch hẹn {code} ngày {date}")
                        .active(true).build(),
                NotificationTemplateDTO.builder()
                        .id("CONFIRM_EMAIL").name("Xác nhận lịch hẹn (Email)")
                        .channel("EMAIL").category("CONFIRMATION")
                        .contentPreview("Lịch hẹn {code} đã được xác nhận, ngày {date} lúc {time}...")
                        .active(true).build(),
                NotificationTemplateDTO.builder()
                        .id("CONFIRM_SMS").name("Xác nhận lịch hẹn (SMS)")
                        .channel("SMS").category("CONFIRMATION")
                        .contentPreview("Lịch hẹn {code} xác nhận: {date} {time} với BS. {doctor}")
                        .active(true).build(),
                NotificationTemplateDTO.builder()
                        .id("CANCEL_EMAIL").name("Hủy lịch hẹn (Email)")
                        .channel("EMAIL").category("CANCELLATION")
                        .contentPreview("Lịch hẹn {code} đã bị hủy. Lý do: {reason}...")
                        .active(true).build(),
                NotificationTemplateDTO.builder()
                        .id("CANCEL_SMS").name("Hủy lịch hẹn (SMS)")
                        .channel("SMS").category("CANCELLATION")
                        .contentPreview("Lịch hẹn {code} đã hủy. Vui lòng liên hệ để đặt lại.")
                        .active(true).build(),
                NotificationTemplateDTO.builder()
                        .id("FOLLOWUP_EMAIL").name("Tái khám (Email)")
                        .channel("EMAIL").category("FOLLOW_UP")
                        .contentPreview("Kính gửi {patient_name}, BS. {doctor} đề nghị tái khám...")
                        .active(true).build(),
                NotificationTemplateDTO.builder()
                        .id("FOLLOWUP_SMS").name("Tái khám (SMS)")
                        .channel("SMS").category("FOLLOW_UP")
                        .contentPreview("Nhắc tái khám: {date}. Liên hệ phòng khám để đặt lịch.")
                        .active(true).build()
        );
    }

    /**
     * #17 — Get appointment categories for dropdown
     */
    @Override
    @Transactional(readOnly = true)
    public List<AppointmentCategoryDTO> getAppointmentCategories() {
        log.info("Getting appointment categories");

        // Return predefined categories
        // In production, load from an appointment_categories table
        return List.of(
                AppointmentCategoryDTO.builder().id(1L).name("Khám tổng quát").description("General consultation / checkup").active(true).build(),
                AppointmentCategoryDTO.builder().id(2L).name("Tái khám").description("Follow-up visit").active(true).build(),
                AppointmentCategoryDTO.builder().id(3L).name("Khám cấp cứu").description("Urgent / Emergency visit").active(true).build(),
                AppointmentCategoryDTO.builder().id(4L).name("Khám chuyên khoa").description("Specialist consultation").active(true).build(),
                AppointmentCategoryDTO.builder().id(5L).name("Xét nghiệm").description("Lab test / Diagnostic").active(true).build(),
                AppointmentCategoryDTO.builder().id(6L).name("Tiêm chủng").description("Vaccination").active(true).build(),
                AppointmentCategoryDTO.builder().id(7L).name("Tư vấn sức khỏe").description("Health counseling").active(true).build(),
                AppointmentCategoryDTO.builder().id(8L).name("Khác").description("Other").active(true).build()
        );
    }

    // ==================== RECEPTIONIST HELPER METHODS ====================

    private List<String> getReceptionistAllowedActions(AppointmentStatus status) {
        return switch (status) {
            case PENDING -> List.of("VIEW", "CONFIRM", "RESCHEDULE", "CANCEL");
            case SCHEDULED -> List.of("VIEW", "CONFIRM", "RESCHEDULE", "CANCEL");
            case CONFIRMED -> List.of("CHECK_IN", "RESCHEDULE", "CANCEL", "SEND_REMINDER", "PRINT_SLIP");
            case CHECKED_IN -> List.of("VIEW_QUEUE", "MARK_NO_SHOW", "NOTIFY_DOCTOR");
            case IN_PROGRESS -> List.of("VIEW");
            case COMPLETED -> List.of("COLLECT_PAYMENT", "RECEIPT", "CREATE_FOLLOW_UP");
            case CANCELLED, NO_SHOW -> List.of("VIEW_REASON", "REBOOK");
            case RESCHEDULED -> List.of("VIEW");
        };
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "***";
        return "***" + phone.substring(phone.length() - 4);
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIdx = email.indexOf("@");
        if (atIdx <= 2) return "***" + email.substring(atIdx);
        return email.substring(0, 2) + "***" + email.substring(atIdx);
    }

    private String inferCategory(String title) {
        if (title == null) return "OTHER";
        String lower = title.toLowerCase();
        if (lower.contains("nhắc nhở") || lower.contains("reminder")) return "REMINDER";
        if (lower.contains("xác nhận") || lower.contains("confirm")) return "CONFIRMATION";
        if (lower.contains("hủy") || lower.contains("cancel")) return "CANCELLATION";
        return "OTHER";
    }

    private String resolveTemplateForReminder(String templateId, Appointment appointment) {
        String patientName = appointment.getPatient().getUser().getFullName();
        String doctorName = appointment.getDoctor().getUser().getFullName();
        String specialization = appointment.getDoctor().getSpecialization() != null
                ? appointment.getDoctor().getSpecialization() : "";
        String code = appointment.getAppointmentCode();
        String date = appointment.getAppointmentDate().toString();
        String time = appointment.getStartTime().toString().substring(0, 5);

        return switch (templateId) {
            case "reminder_24h" -> String.format(
                    "Dear %s, this is a reminder for your appointment tomorrow, %s at %s with Dr. %s (%s). Please arrive 15 minutes early. If you need to cancel or reschedule, please call us.",
                    patientName, date, time, doctorName, specialization);
            case "reminder_2h" -> String.format(
                    "Hi %s, your appointment with Dr. %s is in 2 hours (%s). See you soon!",
                    patientName, doctorName, time);
            case "confirmation_request" -> String.format(
                    "Dear %s, please confirm your appointment on %s at %s with Dr. %s. Reply YES to confirm or call us to reschedule.",
                    patientName, date, time, doctorName);
            default -> String.format(
                    "Reminder: You have an appointment on %s at %s with Dr. %s, %s. Code: %s.",
                    date, time, doctorName, specialization, code);
        };
    }

    private String buildReminderEmailHtml(String subject, String messageBody, Appointment appointment) {
        String patientName = appointment.getPatient().getUser().getFullName();
        String doctorName = appointment.getDoctor().getUser().getFullName();
        String date = appointment.getAppointmentDate().toString();
        String startTime = appointment.getStartTime().toString().substring(0, 5);
        String endTime = appointment.getEndTime() != null ? appointment.getEndTime().toString().substring(0, 5) : "";
        String code = appointment.getAppointmentCode();

        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset='UTF-8'>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n" +
                "        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }\n" +
                "        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }\n" +
                "        .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n" +
                "        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }\n" +
                "        .info-label { color: #666; font-weight: bold; }\n" +
                "        .info-value { color: #333; }\n" +
                "        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class='container'>\n" +
                "        <div class='header'>\n" +
                "            <h1>🏥 MedicalTech</h1>\n" +
                "            <p>Nhắc nhở lịch hẹn</p>\n" +
                "        </div>\n" +
                "        <div class='content'>\n" +
                "            <h2>" + subject + "</h2>\n" +
                "            <p>" + messageBody.replace("\n", "<br>") + "</p>\n" +
                "            <div class='info-box'>\n" +
                "                <p><strong>📋 Chi tiết lịch hẹn:</strong></p>\n" +
                "                <p>🔖 Mã lịch hẹn: <strong>" + code + "</strong></p>\n" +
                "                <p>👤 Bệnh nhân: <strong>" + patientName + "</strong></p>\n" +
                "                <p>👨‍⚕️ Bác sĩ: <strong>" + doctorName + "</strong></p>\n" +
                "                <p>📅 Ngày: <strong>" + date + "</strong></p>\n" +
                "                <p>🕐 Giờ: <strong>" + startTime + (endTime.isEmpty() ? "" : " - " + endTime) + "</strong></p>\n" +
                "            </div>\n" +
                "            <p>⚠️ <strong>Lưu ý:</strong> Vui lòng đến trước giờ hẹn 15 phút.</p>\n" +
                "        </div>\n" +
                "        <div class='footer'>\n" +
                "            <p>© 2026 MedicalTech. All rights reserved.</p>\n" +
                "            <p>Email này được gửi tự động, vui lòng không trả lời.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    private String resolveTemplate(String templateId, Appointment appointment) {
        // Simplified template resolution. In production, load from DB.
        String patientName = appointment.getPatient().getUser().getFullName();
        String doctorName = appointment.getDoctor().getUser().getFullName();
        String code = appointment.getAppointmentCode();
        String date = appointment.getAppointmentDate().toString();
        String time = appointment.getStartTime().toString();

        return switch (templateId) {
            case "REMINDER_EMAIL", "REMINDER_SMS" ->
                    String.format("Kính gửi %s, bạn có lịch hẹn %s vào ngày %s lúc %s với BS. %s.", patientName, code, date, time, doctorName);
            case "CONFIRM_EMAIL", "CONFIRM_SMS" ->
                    String.format("Lịch hẹn %s đã được xác nhận. Ngày %s lúc %s với BS. %s.", code, date, time, doctorName);
            case "CANCEL_EMAIL", "CANCEL_SMS" ->
                    String.format("Lịch hẹn %s đã bị hủy. Vui lòng liên hệ phòng khám để đặt lại.", code);
            case "FOLLOWUP_EMAIL", "FOLLOWUP_SMS" ->
                    String.format("Kính gửi %s, BS. %s đề nghị bạn tái khám. Vui lòng liên hệ đặt lịch.", patientName, doctorName);
            default -> String.format("Thông báo lịch hẹn %s - %s %s.", code, date, time);
        };
    }
    
    // ==================== COMMON APIs ====================

    /** Minimum hours before appointment that a PATIENT can reschedule */
    private static final int PATIENT_RESCHEDULE_MIN_HOURS = 2;
    
    @Override
    public AppointmentDTO rescheduleAppointment(Long appointmentId, RescheduleDTO dto, Long userId, String userRole) {
        log.info("User {} ({}) rescheduling appointment {}", userId, userRole, appointmentId);
        
        Appointment appointment = getAppointmentEntity(appointmentId);
        boolean isPrivileged = "ADMIN".equalsIgnoreCase(userRole) || "RECEPTIONIST".equalsIgnoreCase(userRole);

        // ── 1. Cannot reschedule if appointment time has already passed (regardless of status) ──
        LocalDateTime appointmentDateTime = LocalDateTime.of(
                appointment.getAppointmentDate(), appointment.getStartTime());
        LocalDateTime now = LocalDateTime.now();
        if (!appointmentDateTime.isAfter(now)) {
            throw new AppointmentException.AppointmentAlreadyPassedException();
        }

        // ── 2. Status check ──────────────────────────────────────────────
        // PENDING, CONFIRMED allowed for everyone.
        // CHECKED_IN allowed only for Admin/Receptionist.
        // IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED → always rejected.
        AppointmentStatus status = appointment.getStatus();
        if (status == AppointmentStatus.IN_PROGRESS ||
            status == AppointmentStatus.COMPLETED ||
            status == AppointmentStatus.CANCELLED ||
            status == AppointmentStatus.NO_SHOW ||
            status == AppointmentStatus.RESCHEDULED) {
            throw new AppointmentException.AppointmentNotReschedulableException(
                    "Cannot reschedule an appointment with status: " + status);
        }
        if (status == AppointmentStatus.CHECKED_IN && !isPrivileged) {
            throw new AppointmentException.AppointmentNotReschedulableException(
                    "Only Admin/Receptionist can reschedule a CHECKED_IN appointment.");
        }

        // ── 3. Patient must reschedule at least X hours before (Admin/Receptionist exempt) ──
        if (!isPrivileged) {
            LocalDateTime deadline = appointmentDateTime.minusHours(PATIENT_RESCHEDULE_MIN_HOURS);
            if (!now.isBefore(deadline)) {
                throw new AppointmentException.RescheduleTooLateException(PATIENT_RESCHEDULE_MIN_HOURS);
            }
        }

        // ── 4. Validate new time slot with TimeSlot table ────────────────
        Long doctorId = appointment.getDoctor().getId();
        Optional<TimeSlot> newSlotOpt = timeSlotRepository.findByDoctorIdAndSlotDateAndStartTime(
                doctorId, dto.getNewDate(), dto.getNewStartTime());
        TimeSlot newSlot = null;
        if (newSlotOpt.isPresent()) {
            newSlot = newSlotOpt.get();
            // Slot must be AVAILABLE (not BOOKED/BLOCKED/COMPLETED)
            if (newSlot.getStatus() != TimeSlotStatus.AVAILABLE) {
                throw new AppointmentException.TimeSlotNotAvailableException();
            }
        }
        // Even without TimeSlot record, still check appointment-level conflicts below

        // ── 5. Check doctor conflict (excluding this appointment) ────────
        List<Appointment> doctorConflicts = appointmentRepository.findConflictingAppointmentsExcluding(
                doctorId,
                dto.getNewDate(),
                dto.getNewStartTime(),
                dto.getNewEndTime(),
                appointmentId
        );
        if (!doctorConflicts.isEmpty()) {
            throw new AppointmentException.TimeSlotConflictException();
        }

        // ── 6. Check patient conflict (excluding this appointment) ───────
        List<Appointment> patientConflicts = appointmentRepository.findPatientConflictingAppointmentsExcluding(
                appointment.getPatient().getId(),
                dto.getNewDate(),
                dto.getNewStartTime(),
                dto.getNewEndTime(),
                appointmentId
        );
        if (!patientConflicts.isEmpty()) {
            throw new AppointmentException.PatientTimeConflictException();
        }

        // ── 7. Store old values for history ───────────────────────────────
        var oldDate = appointment.getAppointmentDate();
        var oldStartTime = appointment.getStartTime();
        var oldEndTime = appointment.getEndTime();
        AppointmentStatus oldStatus = appointment.getStatus();
        TimeSlot oldSlot = appointment.getTimeSlot();

        // ── 8. Release old time slot → AVAILABLE ─────────────────────────
        if (oldSlot != null && oldSlot.getStatus() == TimeSlotStatus.BOOKED) {
            oldSlot.setStatus(TimeSlotStatus.AVAILABLE);
            timeSlotRepository.save(oldSlot);
            log.info("Released old time slot {} back to AVAILABLE", oldSlot.getId());
        }

        // ── 9. Update appointment with new schedule ──────────────────────
        appointment.setAppointmentDate(dto.getNewDate());
        appointment.setAppointmentTime(dto.getNewStartTime());
        appointment.setStartTime(dto.getNewStartTime());
        appointment.setEndTime(dto.getNewEndTime());
        appointment.setStatus(AppointmentStatus.PENDING); // Reset to pending after reschedule

        // ── 10. Book new time slot ───────────────────────────────────────
        if (newSlot != null) {
            newSlot.setStatus(TimeSlotStatus.BOOKED);
            timeSlotRepository.save(newSlot);
            appointment.setTimeSlot(newSlot);
            log.info("Booked new time slot {} for appointment {}", newSlot.getId(), appointmentId);
        } else {
            appointment.setTimeSlot(null);
        }

        appointment = appointmentRepository.save(appointment);
        
        // ── 11. Create detailed history ──────────────────────────────────
        AppointmentHistory history = AppointmentHistory.builder()
                .appointment(appointment)
                .action("RESCHEDULED")
                .oldStatus(oldStatus)
                .newStatus(AppointmentStatus.PENDING)
                .oldDate(oldDate)
                .newDate(dto.getNewDate())
                .oldStartTime(oldStartTime)
                .newStartTime(dto.getNewStartTime())
                .oldEndTime(oldEndTime)
                .newEndTime(dto.getNewEndTime())
                .changedByUserId(userId)
                .changedByRole(userRole)
                .reason(dto.getReason())
                .changedAt(LocalDateTime.now())
                .build();
        historyRepository.save(history);

        // ── 12. Send notification ────────────────────────────────────────
        try {
            notificationEventService.onAppointmentRescheduled(appointment);
        } catch (Exception e) {
            log.warn("Failed to send reschedule notification: {}", e.getMessage());
        }
        
        log.info("Appointment {} rescheduled from {}/{} to {}/{} by {} ({})",
                appointmentId, oldDate, oldStartTime, dto.getNewDate(), dto.getNewStartTime(), userId, userRole);
        
        return appointmentMapper.toDTO(appointment);
    }
    
    @Override
    public AppointmentDTO cancelAppointment(Long appointmentId, CancelDTO dto, Long userId, String userRole) {
        log.info("User {} ({}) cancelling appointment {}", userId, userRole, appointmentId);
        
        Appointment appointment = getAppointmentEntity(appointmentId);
        
        // Check if can be cancelled
        if (!canBeCancelled(appointment)) {
            throw new AppointmentException.AppointmentNotCancellableException();
        }
        
        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(dto.getReason());
        appointment.setCancelledBy(userId);
        appointment = appointmentRepository.save(appointment);
        
        // Create history
        createHistory(appointment, "CANCELLED", oldStatus, AppointmentStatus.CANCELLED,
                userId, userRole, dto.getReason());

        // Send notification: appointment cancelled
        try {
            notificationEventService.onAppointmentCancelled(appointment);
        } catch (Exception e) {
            log.warn("Failed to send cancellation notification: {}", e.getMessage());
        }
        
        return appointmentMapper.toDTO(appointment);
    }
    
    @Override
    @Transactional(readOnly = true)
    public AppointmentDTO getAppointmentById(Long appointmentId) {
        return appointmentMapper.toDTO(getAppointmentEntity(appointmentId));
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AppointmentHistoryDTO> getAppointmentHistory(Long appointmentId) {
        // Verify appointment exists
        if (!appointmentRepository.existsById(appointmentId)) {
            throw new ResourceNotFoundException("Appointment not found with id: " + appointmentId);
        }
        
        List<AppointmentHistory> histories = historyRepository
                .findByAppointmentIdOrderByChangedAtDesc(appointmentId);
        
        return appointmentMapper.toHistoryDTOList(histories);
    }
    
    // ==================== ADMIN APIs ====================
    
    @Override
    @Transactional(readOnly = true)
    public Page<AppointmentDTO> getAllAppointments(AppointmentFilterDTO filter) {
        log.info("Admin getting all appointments with filter");
        
        Pageable pageable = createPageable(filter);
        
        // Convert status enum to string if present
        String statusStr = filter.getStatus() != null ? filter.getStatus().name() : null;
        
        // Use the new admin query with JOIN FETCH to avoid lazy loading issues
        Page<Appointment> appointments = appointmentRepository.findAllWithFiltersAdmin(
                filter.getDoctorId(),
                filter.getPatientId(),
                statusStr,
                filter.getFrom(),
                filter.getTo(),
                pageable
        );
        
        return appointments.map(appointmentMapper::toDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public AppointmentStatsDTO getAppointmentStats() {
        log.info("Getting appointment statistics");
        
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(6);
        LocalDate monthStart = today.minusDays(29);
        LocalDate lastWeekStart = weekStart.minusDays(7);
        LocalDate lastMonthStart = monthStart.minusDays(30);
        
        // Get all appointments for the month (for calculations)
        List<Appointment> monthAppointments = appointmentRepository.findByDateRange(monthStart, today);
        List<Appointment> todayAppointments = monthAppointments.stream()
                .filter(a -> a.getAppointmentDate().equals(today))
                .toList();
        List<Appointment> weekAppointments = monthAppointments.stream()
                .filter(a -> !a.getAppointmentDate().isBefore(weekStart))
                .toList();
        
        // Previous period for comparison
        List<Appointment> lastWeekAppointments = appointmentRepository.findByDateRange(lastWeekStart, weekStart.minusDays(1));
        List<Appointment> lastMonthAppointments = appointmentRepository.findByDateRange(lastMonthStart, monthStart.minusDays(1));
        
        // Today's breakdown
        Map<AppointmentStatus, Long> todayByStatus = todayAppointments.stream()
                .collect(Collectors.groupingBy(Appointment::getStatus, Collectors.counting()));
        
        // Calculate rates (based on completed appointments in month)
        long monthTotal = monthAppointments.size();
        long completed = monthAppointments.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
        long cancelled = monthAppointments.stream().filter(a -> a.getStatus() == AppointmentStatus.CANCELLED).count();
        long noShow = monthAppointments.stream().filter(a -> a.getStatus() == AppointmentStatus.NO_SHOW).count();
        
        double completionRate = monthTotal > 0 ? (double) completed / monthTotal * 100 : 0;
        double cancellationRate = monthTotal > 0 ? (double) cancelled / monthTotal * 100 : 0;
        double noShowRate = monthTotal > 0 ? (double) noShow / monthTotal * 100 : 0;
        
        // Daily trend (last 7 days)
        Map<String, Long> dailyTrend = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dateStr = date.format(DateTimeFormatter.ISO_DATE);
            long count = weekAppointments.stream()
                    .filter(a -> a.getAppointmentDate().equals(date))
                    .count();
            dailyTrend.put(dateStr, count);
        }
        
        // Status breakdown (all time this month)
        Map<String, Long> statusBreakdown = monthAppointments.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getStatus().name(),
                        Collectors.counting()
                ));
        
        // Doctor breakdown (top 10)
        Map<String, Long> doctorBreakdown = monthAppointments.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getDoctor().getUser().getFullName(),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
        
        // Hourly distribution
        Map<String, Long> hourlyDistribution = new LinkedHashMap<>();
        for (int hour = 7; hour <= 21; hour++) {
            String hourStr = String.format("%02d:00", hour);
            final int h = hour;
            long count = monthAppointments.stream()
                    .filter(a -> a.getStartTime().getHour() == h)
                    .count();
            hourlyDistribution.put(hourStr, count);
        }
        
        // Find peak hour
        String peakHour = hourlyDistribution.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
        Long peakHourCount = hourlyDistribution.getOrDefault(peakHour, 0L);
        
        // Week over week change
        double weekOverWeekChange = lastWeekAppointments.isEmpty() ? 0 :
                ((double) weekAppointments.size() - lastWeekAppointments.size()) / lastWeekAppointments.size() * 100;
        
        // Month over month change
        double monthOverMonthChange = lastMonthAppointments.isEmpty() ? 0 :
                ((double) monthAppointments.size() - lastMonthAppointments.size()) / lastMonthAppointments.size() * 100;
        
        return AppointmentStatsDTO.builder()
                .todayTotal((long) todayAppointments.size())
                .weekTotal((long) weekAppointments.size())
                .monthTotal(monthTotal)
                .todayPending(todayByStatus.getOrDefault(AppointmentStatus.PENDING, 0L))
                .todayConfirmed(todayByStatus.getOrDefault(AppointmentStatus.CONFIRMED, 0L))
                .todayCheckedIn(todayByStatus.getOrDefault(AppointmentStatus.CHECKED_IN, 0L))
                .todayCompleted(todayByStatus.getOrDefault(AppointmentStatus.COMPLETED, 0L))
                .todayCancelled(todayByStatus.getOrDefault(AppointmentStatus.CANCELLED, 0L))
                .todayNoShow(todayByStatus.getOrDefault(AppointmentStatus.NO_SHOW, 0L))
                .completionRate(Math.round(completionRate * 100.0) / 100.0)
                .cancellationRate(Math.round(cancellationRate * 100.0) / 100.0)
                .noShowRate(Math.round(noShowRate * 100.0) / 100.0)
                .dailyTrend(dailyTrend)
                .statusBreakdown(statusBreakdown)
                .doctorBreakdown(doctorBreakdown)
                .hourlyDistribution(hourlyDistribution)
                .peakHour(peakHour)
                .peakHourCount(peakHourCount)
                .weekOverWeekChange(Math.round(weekOverWeekChange * 100.0) / 100.0)
                .monthOverMonthChange(Math.round(monthOverMonthChange * 100.0) / 100.0)
                .build();
    }
    
    @Override
    public BulkActionResultDTO bulkSendReminders(BulkReminderDTO dto, Long userId, String callerRole) {
        log.info("{} {} sending bulk reminders for {} appointments", callerRole, userId, dto.getAppointmentIds().size());
        
        List<BulkActionResultDTO.ItemResult> results = new ArrayList<>();
        int successCount = 0;
        int failCount = 0;
        
        for (Long appointmentId : dto.getAppointmentIds()) {
            try {
                Appointment appointment = appointmentRepository.findByIdWithDetails(appointmentId)
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
                
                // Check if appointment is in a valid state for reminder
                if (appointment.getStatus() == AppointmentStatus.CANCELLED ||
                    appointment.getStatus() == AppointmentStatus.COMPLETED ||
                    appointment.getStatus() == AppointmentStatus.NO_SHOW) {
                    results.add(BulkActionResultDTO.failItem(
                            appointmentId,
                            appointment.getAppointmentCode(),
                            "Cannot send reminder for " + appointment.getStatus().name() + " appointment",
                            "INVALID_STATUS"
                    ));
                    failCount++;
                    continue;
                }
                
                // Actually send the reminder email
                String patientEmail = appointment.getPatient().getUser().getEmail();
                if (patientEmail != null && !patientEmail.isBlank()) {
                    try {
                        String reminderSubject = "Nhắc nhở lịch hẹn - " + appointment.getAppointmentCode();
                        String reminderMessage = String.format(
                                "Kính gửi %s,\nBạn có lịch hẹn vào ngày %s lúc %s với BS. %s.\nMã lịch hẹn: %s.\nVui lòng đến đúng giờ.",
                                appointment.getPatient().getUser().getFullName(),
                                appointment.getAppointmentDate(),
                                appointment.getStartTime(),
                                appointment.getDoctor().getUser().getFullName(),
                                appointment.getAppointmentCode()
                        );
                        String htmlContent = buildReminderEmailHtml(reminderSubject, reminderMessage, appointment);
                        emailService.sendHtmlEmail(patientEmail, reminderSubject, htmlContent);
                        log.info("Bulk reminder email sent to: {} for appointment {}", patientEmail, appointmentId);
                    } catch (Exception e) {
                        log.error("Failed to send bulk reminder email to: {} for appointment {}", patientEmail, appointmentId, e);
                    }
                }
                
                // Create history entry
                createHistory(appointment, "REMINDER_SENT", appointment.getStatus(), appointment.getStatus(),
                        userId, callerRole, "Reminder sent via " + dto.getMessageType());
                
                results.add(BulkActionResultDTO.successItem(
                        appointmentId,
                        appointment.getAppointmentCode(),
                        "Reminder sent successfully"
                ));
                successCount++;
                
            } catch (ResourceNotFoundException e) {
                results.add(BulkActionResultDTO.failItem(
                        appointmentId, null, e.getMessage(), "NOT_FOUND"));
                failCount++;
            } catch (Exception e) {
                results.add(BulkActionResultDTO.failItem(
                        appointmentId, null, "Error: " + e.getMessage(), "ERROR"));
                failCount++;
            }
        }
        
        return BulkActionResultDTO.builder()
                .totalProcessed(dto.getAppointmentIds().size())
                .successCount(successCount)
                .failCount(failCount)
                .results(results)
                .message(String.format("Sent %d reminders successfully, %d failed", successCount, failCount))
                .build();
    }
    
    @Override
    public BulkActionResultDTO bulkCancelAppointments(BulkCancelDTO dto, Long userId, String callerRole) {
        log.info("{} {} bulk cancelling {} appointments", callerRole, userId, dto.getAppointmentIds().size());
        
        List<BulkActionResultDTO.ItemResult> results = new ArrayList<>();
        int successCount = 0;
        int failCount = 0;
        
        for (Long appointmentId : dto.getAppointmentIds()) {
            try {
                Appointment appointment = appointmentRepository.findByIdWithDetails(appointmentId)
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
                
                // Check if appointment can be cancelled
                if (!canBeCancelled(appointment)) {
                    results.add(BulkActionResultDTO.failItem(
                            appointmentId,
                            appointment.getAppointmentCode(),
                            "Appointment cannot be cancelled (status: " + appointment.getStatus().name() + ")",
                            "NOT_CANCELLABLE"
                    ));
                    failCount++;
                    continue;
                }
                
                AppointmentStatus oldStatus = appointment.getStatus();
                appointment.setStatus(AppointmentStatus.CANCELLED);
                appointment.setCancellationReason(dto.getReason());
                appointment.setCancelledBy(userId);
                appointmentRepository.save(appointment);
                
                // Create history
                createHistory(appointment, "CANCELLED", oldStatus, AppointmentStatus.CANCELLED,
                        userId, callerRole, "Bulk cancel: " + dto.getReason());
                
                // TODO: Handle refund based on dto.getRefundPolicy()
                // TODO: Send notification if dto.getSendNotification() is true
                
                results.add(BulkActionResultDTO.successItem(
                        appointmentId,
                        appointment.getAppointmentCode(),
                        "Appointment cancelled"
                ));
                successCount++;
                
            } catch (ResourceNotFoundException e) {
                results.add(BulkActionResultDTO.failItem(
                        appointmentId, null, e.getMessage(), "NOT_FOUND"));
                failCount++;
            } catch (Exception e) {
                results.add(BulkActionResultDTO.failItem(
                        appointmentId, null, "Error: " + e.getMessage(), "ERROR"));
                failCount++;
            }
        }
        
        return BulkActionResultDTO.builder()
                .totalProcessed(dto.getAppointmentIds().size())
                .successCount(successCount)
                .failCount(failCount)
                .results(results)
                .message(String.format("Cancelled %d appointments, %d failed", successCount, failCount))
                .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public byte[] exportAppointments(ExportFilterDTO filter) {
        log.info("Exporting appointments with format: {}", filter.getFormat());
        
        // Build appointment filter from export filter
        AppointmentFilterDTO appointmentFilter = AppointmentFilterDTO.builder()
                .doctorId(filter.getDoctorId())
                .patientId(filter.getPatientId())
                .status(filter.getStatus())
                .statuses(filter.getStatuses())
                .from(filter.getFrom())
                .to(filter.getTo())
                .search(filter.getSearch())
                .appointmentType(filter.getAppointmentType())
                .pageNumber(0)
                .pageSize(10000) // Export up to 10000 records
                .build();
        
        // Get all appointments matching filter
        List<Appointment> appointments = appointmentRepository.findAll(
                AppointmentSpecification.withFilter(appointmentFilter),
                Sort.by(Sort.Direction.DESC, "appointmentDate", "startTime")
        );
        
        // Export based on format
        return switch (filter.getFormat().toUpperCase()) {
            case "CSV" -> exportToCsv(appointments, filter.getColumnsToExport());
            case "EXCEL" -> exportToExcel(appointments, filter.getColumnsToExport());
            case "PDF" -> exportToPdf(appointments, filter.getColumnsToExport());
            default -> exportToCsv(appointments, filter.getColumnsToExport());
        };
    }
    
    private byte[] exportToCsv(List<Appointment> appointments, List<String> columns) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
            
            // BOM for Excel UTF-8 compatibility
            baos.write(0xEF);
            baos.write(0xBB);
            baos.write(0xBF);
            
            // Header
            writer.println(String.join(",", columns));
            
            // Data rows
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            
            for (Appointment apt : appointments) {
                List<String> values = new ArrayList<>();
                for (String col : columns) {
                    String value;
                    try {
                        value = switch (col) {
                            case "appointmentCode" -> apt.getAppointmentCode() != null ? apt.getAppointmentCode() : "";
                            case "patientName" -> apt.getPatient() != null && apt.getPatient().getUser() != null
                                    ? apt.getPatient().getUser().getFullName() : "";
                            case "patientPhone" -> apt.getPatient() != null && apt.getPatient().getUser() != null
                                    && apt.getPatient().getUser().getPhone() != null
                                    ? apt.getPatient().getUser().getPhone() : "";
                            case "patientEmail" -> apt.getPatient() != null && apt.getPatient().getUser() != null
                                    && apt.getPatient().getUser().getEmail() != null
                                    ? apt.getPatient().getUser().getEmail() : "";
                            case "doctorName" -> apt.getDoctor() != null && apt.getDoctor().getUser() != null
                                    ? apt.getDoctor().getUser().getFullName() : "";
                            case "specialty" -> apt.getDoctor() != null && apt.getDoctor().getSpecialization() != null
                                    ? apt.getDoctor().getSpecialization() : "";
                            case "appointmentDate" -> apt.getAppointmentDate() != null
                                    ? apt.getAppointmentDate().format(dateFormatter) : "";
                            case "startTime" -> apt.getStartTime() != null
                                    ? apt.getStartTime().format(timeFormatter) : "";
                            case "endTime" -> apt.getEndTime() != null
                                    ? apt.getEndTime().format(timeFormatter) : "";
                            case "status" -> apt.getStatus() != null ? apt.getStatus().name() : "";
                            case "reasonForVisit" -> apt.getReasonForVisit() != null
                                    ? apt.getReasonForVisit().replace(",", ";") : "";
                            case "symptoms" -> apt.getSymptoms() != null
                                    ? apt.getSymptoms().replace(",", ";") : "";
                            case "notes" -> apt.getNotes() != null
                                    ? apt.getNotes().replace(",", ";") : "";
                            case "queueNumber" -> apt.getQueueNumber() != null
                                    ? apt.getQueueNumber().toString() : "";
                            case "bookedBy" -> apt.getBookedBy() != null ? apt.getBookedBy().name() : "";
                            case "createdAt" -> apt.getCreatedAt() != null
                                    ? apt.getCreatedAt().format(dateTimeFormatter) : "";
                            default -> "";
                        };
                    } catch (Exception e) {
                        log.warn("Error reading column '{}' for appointment {}: {}", col, apt.getId(), e.getMessage());
                        value = "";
                    }
                    if (value == null) {
                        value = "";
                    }
                    // Escape quotes and wrap in quotes if contains special chars
                    if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
                        value = "\"" + value.replace("\"", "\"\"") + "\"";
                    }
                    values.add(value);
                }
                writer.println(String.join(",", values));
            }
            
            writer.flush();
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Error exporting to CSV", e);
            throw new RuntimeException("Failed to export appointments to CSV", e);
        }
    }
    
    private byte[] exportToExcel(List<Appointment> appointments, List<String> columns) {
        // For simplicity, return CSV format with .xlsx content type
        // In production, use Apache POI for proper Excel export
        return exportToCsv(appointments, columns);
    }
    
    private byte[] exportToPdf(List<Appointment> appointments, List<String> columns) {
        // For simplicity, return CSV format
        // In production, use iText or Apache PDFBox for proper PDF export
        return exportToCsv(appointments, columns);
    }
    
    // ==================== HELPER METHODS ====================
    
    private Appointment getAppointmentEntity(Long appointmentId) {
        return appointmentRepository.findByIdWithDetails(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));
    }
    
    private Pageable createPageable(AppointmentFilterDTO filter) {
        String sortBy = filter.getSortBy() != null ? filter.getSortBy() : "appointmentDate";
        Sort.Direction direction = "ASC".equalsIgnoreCase(filter.getSortDir()) ? 
                Sort.Direction.ASC : Sort.Direction.DESC;
        
        return PageRequest.of(
                filter.getPageNumber() != null ? filter.getPageNumber() : 0,
                filter.getPageSize() != null ? filter.getPageSize() : 10,
                Sort.by(direction, sortBy, "startTime")
        );
    }
    
    private void createHistory(Appointment appointment, String action, 
                               AppointmentStatus oldStatus, AppointmentStatus newStatus,
                               Long userId, String role, String reason) {
        AppointmentHistory history = AppointmentHistory.builder()
                .appointment(appointment)
                .action(action)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .changedByUserId(userId)
                .changedByRole(role)
                .reason(reason)
                .changedAt(LocalDateTime.now())
                .build();
        historyRepository.save(history);
    }
    
    // canBeRescheduled logic is now inline in rescheduleAppointment() for role-based control
    
    private boolean canBeCancelled(Appointment appointment) {
        return appointment.getStatus() == AppointmentStatus.PENDING ||
               appointment.getStatus() == AppointmentStatus.CONFIRMED ||
               appointment.getStatus() == AppointmentStatus.CHECKED_IN ||
               appointment.getStatus() == AppointmentStatus.IN_PROGRESS;
    }
    
    // ==================== APPOINTMENT DETAIL & ACTIONS ====================
    
    @Override
    @Transactional(readOnly = true)
    public AppointmentDetailDTO getAppointmentDetail(Long appointmentId) {
        log.info("Getting full detail for appointment {}", appointmentId);
        
        Appointment appointment = getAppointmentEntity(appointmentId);
        Patient patient = appointment.getPatient();
        Doctor doctor = appointment.getDoctor();
        
        // Calculate patient stats
        Long totalAppointments = appointmentRepository.countByPatientId(patient.getId());
        Long completedAppointments = appointmentRepository.countByPatientIdAndStatus(patient.getId(), AppointmentStatus.COMPLETED);
        Long cancelledAppointments = appointmentRepository.countByPatientIdAndStatus(patient.getId(), AppointmentStatus.CANCELLED);
        Long noShowAppointments = appointmentRepository.countByPatientIdAndStatus(patient.getId(), AppointmentStatus.NO_SHOW);
        
        // Build patient info with stats
        AppointmentDetailDTO.PatientInfo patientInfo = AppointmentDetailDTO.PatientInfo.builder()
                .id(patient.getId())
                .userId(patient.getUser().getId())
                .fullName(patient.getUser().getFullName())
                .email(patient.getUser().getEmail())
                .phone(patient.getUser().getPhone())
                .dateOfBirth(patient.getDateOfBirth())
                .gender(patient.getGender())
                .bloodType(patient.getBloodGroup())
                .allergies(patient.getAllergies())
                .address(patient.getAddress())
                .emergencyContact(patient.getEmergencyContact())
                .avatarUrl(patient.getUser().getAvatarUrl())
                .totalAppointments(totalAppointments.intValue())
                .completedAppointments(completedAppointments.intValue())
                .cancelledAppointments(cancelledAppointments.intValue())
                .noShowCount(noShowAppointments.intValue())
                .build();
        
        // Build doctor info
        AppointmentDetailDTO.DoctorInfo doctorInfo = AppointmentDetailDTO.DoctorInfo.builder()
                .id(doctor.getId())
                .userId(doctor.getUser().getId())
                .fullName(doctor.getUser().getFullName())
                .email(doctor.getUser().getEmail())
                .phone(doctor.getUser().getPhone())
                .specialization(doctor.getSpecialization())
                .licenseNumber(doctor.getLicenseNumber())
                .bio(doctor.getBio())
                .experienceYears(doctor.getExperienceYears())
                .consultationFee(doctor.getConsultationFee())
                .ratingAvg(doctor.getRatingAvg())
                .totalReviews(doctor.getRatingCount())
                .avatarUrl(doctor.getUser().getAvatarUrl())
                .isAvailable(doctor.getIsAvailable())
                .build();
        
        // Calculate appointment stats (doctor queue, etc.)
        Long patientTotalWithDoctor = appointmentRepository.countByPatientIdAndDoctorId(patient.getId(), doctor.getId());
        Long doctorTodayTotal = appointmentRepository.countActiveAppointmentsByDoctorAndDate(doctor.getId(), LocalDate.now());
        
        AppointmentDetailDTO.AppointmentStats stats = AppointmentDetailDTO.AppointmentStats.builder()
                .patientTotalWithDoctor(patientTotalWithDoctor)
                .doctorTotalToday(doctorTodayTotal)
                .doctorQueuePosition(appointment.getQueueNumber())
                .build();
        
        // Get appointment history
        List<AppointmentHistory> histories = historyRepository.findByAppointmentIdOrderByChangedAtDesc(appointmentId);
        List<AppointmentHistoryDTO> historyDTOs = histories.stream()
                .map(h -> AppointmentHistoryDTO.builder()
                        .id(h.getId())
                        .appointmentId(appointmentId)
                        .action(h.getAction())
                        .oldStatus(h.getOldStatus())
                        .newStatus(h.getNewStatus())
                        .changedByUserId(h.getChangedByUserId())
                        .changedByRole(h.getChangedByRole())
                        .reason(h.getReason())
                        .changedAt(h.getChangedAt())
                        .build())
                .collect(Collectors.toList());

        // Query payment info
        var paymentOpt = paymentRepository.findByAppointmentIdWithDetails(appointmentId);

        // Calculate duration in minutes
        Integer duration = null;
        if (appointment.getStartTime() != null && appointment.getEndTime() != null) {
            duration = (int) java.time.Duration.between(appointment.getStartTime(), appointment.getEndTime()).toMinutes();
        }
        
        AppointmentDetailDTO.AppointmentDetailDTOBuilder builder = AppointmentDetailDTO.builder()
                .id(appointment.getId())
                .appointmentCode(appointment.getAppointmentCode())
                .appointmentDate(appointment.getAppointmentDate())
                .startTime(appointment.getStartTime())
                .endTime(appointment.getEndTime())
                .status(appointment.getStatus())
                .appointmentType(appointment.getAppointmentType())
                .queueNumber(appointment.getQueueNumber())
                .reasonForVisit(appointment.getReasonForVisit())
                .symptoms(appointment.getSymptoms())
                .notes(appointment.getNotes())
                .doctorNotes(appointment.getDoctorNotes())
                .diagnosis(appointment.getDiagnosis())
                .duration(duration)
                .cancellationReason(appointment.getCancellationReason())
                .bookedBy(appointment.getBookedBy())
                .checkedInAt(appointment.getCheckedInAt())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                // Flat patient fields
                .patientId(patient.getId())
                .patientName(patient.getUser().getFullName())
                .patientEmail(patient.getUser().getEmail())
                .patientPhone(patient.getUser().getPhone())
                .patientAvatar(patient.getUser().getAvatarUrl())
                .patientDob(patient.getDateOfBirth() != null ? patient.getDateOfBirth().toString() : null)
                .patientGender(patient.getGender())
                .patientAddress(patient.getAddress())
                // Flat doctor fields
                .doctorId(doctor.getId())
                .doctorName(doctor.getUser().getFullName())
                .doctorSpecialization(doctor.getSpecialization())
                .doctorEmail(doctor.getUser().getEmail())
                .doctorPhone(doctor.getUser().getPhone())
                .doctorAvatar(doctor.getUser().getAvatarUrl())
                .doctorConsultationFee(doctor.getConsultationFee())
                .doctorExperience(doctor.getExperienceYears())
                // Nested objects
                .patient(patientInfo)
                .doctor(doctorInfo)
                .stats(stats)
                .history(historyDTOs);

        // Add payment info if exists
        if (paymentOpt.isPresent()) {
            var payment = paymentOpt.get();
            builder.paymentId(payment.getId())
                   .paymentAmount(payment.getTotalAmount())
                   .paymentMethod(payment.getPaymentMethod())
                   .paymentDate(payment.getPaidAt())
                   .paymentStatus(payment.getPaymentStatus());
        } else {
            builder.paymentStatus("PENDING");
        }

        return builder.build();
    }
    
    private static final int NO_SHOW_GRACE_PERIOD_MINUTES = 15;

    @Override
    public AppointmentDTO markAsNoShow(Long appointmentId, NoShowDTO dto, Long userId, String userRole) {
        log.info("Marking appointment {} as no-show by user {} ({})", appointmentId, userId, userRole);
        
        Appointment appointment = getAppointmentEntity(appointmentId);
        
        // 1. Validate status: only CONFIRMED or CHECKED_IN can be marked as no-show
        if (appointment.getStatus() != AppointmentStatus.CONFIRMED && 
            appointment.getStatus() != AppointmentStatus.CHECKED_IN) {
            throw new AppointmentException("Only confirmed or checked-in appointments can be marked as no-show. Current status: " + appointment.getStatus());
        }

        // 2. Validate grace period: now must be past appointmentTime + gracePeriod
        LocalDate apptDate = appointment.getAppointmentDate();
        LocalTime apptTime = appointment.getStartTime() != null ? appointment.getStartTime() : appointment.getAppointmentTime();
        if (apptDate != null && apptTime != null) {
            LocalDateTime appointmentDateTime = LocalDateTime.of(apptDate, apptTime);
            LocalDateTime gracePeriodEnd = appointmentDateTime.plusMinutes(NO_SHOW_GRACE_PERIOD_MINUTES);
            LocalDateTime now = LocalDateTime.now();
            if (now.isBefore(gracePeriodEnd)) {
                long minutesRemaining = ChronoUnit.MINUTES.between(now, gracePeriodEnd);
                throw new AppointmentException(
                    String.format("Cannot mark as no-show yet. Grace period of %d minutes has not passed. Please wait %d more minute(s).",
                        NO_SHOW_GRACE_PERIOD_MINUTES, minutesRemaining + 1));
            }
        }

        // 3. Mandatory reason
        if (dto.getReason() == null || dto.getReason().trim().isEmpty()) {
            throw new AppointmentException("A reason is required when marking a patient as no-show");
        }
        
        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.NO_SHOW);
        appointment.setCancellationReason(dto.getReason());
        appointment = appointmentRepository.save(appointment);
        
        // 4. Release the time slot back to AVAILABLE
        TimeSlot timeSlot = appointment.getTimeSlot();
        if (timeSlot != null && timeSlot.getStatus() == TimeSlotStatus.BOOKED) {
            timeSlot.setStatus(TimeSlotStatus.AVAILABLE);
            timeSlotRepository.save(timeSlot);
            log.info("Released time slot {} back to AVAILABLE after no-show", timeSlot.getId());
        } else if (timeSlot == null) {
            // Try to find the time slot by doctor + date + startTime
            Optional<TimeSlot> slotOpt = timeSlotRepository.findByDoctorIdAndSlotDateAndStartTime(
                    appointment.getDoctor().getId(), appointment.getAppointmentDate(), appointment.getStartTime());
            if (slotOpt.isPresent() && slotOpt.get().getStatus() == TimeSlotStatus.BOOKED) {
                slotOpt.get().setStatus(TimeSlotStatus.AVAILABLE);
                timeSlotRepository.save(slotOpt.get());
                log.info("Released time slot {} back to AVAILABLE after no-show (found by lookup)", slotOpt.get().getId());
            }
        }
        
        // 5. Create history with markedBy info
        String reason = "Marked as no-show by " + userRole + " (userId: " + userId + "): " + dto.getReason();
        createHistory(appointment, "NO_SHOW", oldStatus, AppointmentStatus.NO_SHOW,
                userId, userRole, reason);
        
        // 6. Send notification: no-show marked
        try {
            notificationEventService.onNoShowMarked(appointment);
        } catch (Exception e) {
            log.warn("Failed to send no-show notification: {}", e.getMessage());
        }
        
        return appointmentMapper.toDTO(appointment);
    }

    @Override
    public void notifyDoctorPatientReady(Long appointmentId, NotifyDoctorDTO dto, Long receptionistUserId) {
        log.info("Notifying doctor for appointment {} by receptionist {}", appointmentId, receptionistUserId);

        Appointment appointment = getAppointmentEntity(appointmentId);

        // Only CHECKED_IN appointments can trigger doctor notification
        if (appointment.getStatus() != AppointmentStatus.CHECKED_IN) {
            throw new AppointmentException("Can only notify doctor for checked-in appointments");
        }

        // Build message (no PHI)
        String time = appointment.getStartTime() != null
                ? appointment.getStartTime().toString().substring(0, 5) : "N/A";
        Integer queueNum = appointment.getQueueNumber();
        String priorityTag = dto.getPriority() != null && !"NORMAL".equals(dto.getPriority())
                ? " [" + dto.getPriority() + "]" : "";

        String message = (dto.getMessage() != null && !dto.getMessage().isBlank())
                ? dto.getMessage()
                : String.format("Patient for %s has checked in. Queue #%d.%s",
                        time, queueNum != null ? queueNum : 0, priorityTag);

        // Send notification via WebSocket + persist
        try {
            notificationEventService.onDoctorNotified(appointment, message);
        } catch (Exception e) {
            log.error("Failed to send doctor notification: {}", e.getMessage());
            throw new AppointmentException("Failed to send notification to doctor");
        }

        // Audit trail
        createHistory(appointment, "DOCTOR_NOTIFIED", appointment.getStatus(), appointment.getStatus(),
                receptionistUserId, "RECEPTIONIST",
                "Doctor notified: " + message);
    }
    
    @Override
    public AppointmentDTO startConsultation(Long appointmentId, Long userId, String userRole) {
        log.info("Starting consultation for appointment {} by user {} ({})", appointmentId, userId, userRole);
        
        Appointment appointment = getAppointmentEntity(appointmentId);
        
        // Can only start if CHECKED_IN
        if (appointment.getStatus() != AppointmentStatus.CHECKED_IN) {
            throw new AppointmentException.InvalidStatusTransitionException(
                    appointment.getStatus().name(), AppointmentStatus.IN_PROGRESS.name());
        }
        
        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.IN_PROGRESS);
        appointment.setConsultationStartedAt(LocalDateTime.now());
        appointment = appointmentRepository.save(appointment);
        
        createHistory(appointment, "CONSULTATION_STARTED", oldStatus, AppointmentStatus.IN_PROGRESS,
                userId, userRole, "Consultation started");
        
        return appointmentMapper.toDTO(appointment);
    }
    
    @Override
    public AppointmentDTO completeConsultation(Long appointmentId, CompleteAppointmentDTO dto, Long userId, String userRole) {
        log.info("Completing consultation for appointment {} by user {} ({})", appointmentId, userId, userRole);
        
        Appointment appointment = getAppointmentEntity(appointmentId);
        
        // Can only complete if IN_PROGRESS
        if (appointment.getStatus() != AppointmentStatus.IN_PROGRESS) {
            throw new AppointmentException.InvalidStatusTransitionException(
                    appointment.getStatus().name(), AppointmentStatus.COMPLETED.name());
        }
        
        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setConsultationEndedAt(LocalDateTime.now());
        appointment.setDoctorNotes(dto.getDoctorNotes());
        appointment.setDiagnosis(dto.getDiagnosis());
        appointment.setPrescription(dto.getPrescription());
        appointment.setFollowUpRecommendations(dto.getFollowUpRecommendations());
        appointment = appointmentRepository.save(appointment);
        
        createHistory(appointment, "COMPLETED", oldStatus, AppointmentStatus.COMPLETED,
                userId, userRole, "Consultation completed");
        
        return appointmentMapper.toDTO(appointment);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CommunicationLogDTO> getCommunicationLogs(Long appointmentId) {
        log.info("Getting communication logs for appointment {}", appointmentId);
        
        // Verify appointment exists
        getAppointmentEntity(appointmentId);
        
        // Get notifications related to this appointment
        List<Notification> notifications = notificationRepository
                .findByReferenceTypeAndReferenceId("APPOINTMENT", appointmentId);
        
        return notifications.stream()
                .map(n -> CommunicationLogDTO.builder()
                        .id(n.getId())
                        .type(Boolean.TRUE.equals(n.getEmailSent()) ? "EMAIL" : Boolean.TRUE.equals(n.getSmsSent()) ? "SMS" : "PUSH")
                        .recipient(n.getUser().getEmail())
                        .subject(n.getTitle())
                        .message(n.getMessage())
                        .status(Boolean.TRUE.equals(n.getEmailSent()) || Boolean.TRUE.equals(n.getSmsSent()) ? "SENT" : "PENDING")
                        .sentAt(n.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
    
    @Override
    public MessageDTO sendCustomMessage(Long appointmentId, CustomMessageDTO dto, Long userId) {
        log.info("Sending custom {} message for appointment {} by user {}", dto.getMessageType(), appointmentId, userId);
        
        Appointment appointment = getAppointmentEntity(appointmentId);
        Patient patient = appointment.getPatient();
        User patientUser = patient.getUser();
        
        String subject = dto.getSubject() != null && !dto.getSubject().isBlank()
                ? dto.getSubject()
                : "Thông báo từ MedicalTech - Lịch hẹn #" + appointment.getAppointmentCode();
        
        boolean emailSent = false;
        boolean smsSent = false;
        
        if ("EMAIL".equals(dto.getMessageType())) {
            // Send email via EmailService
            String patientEmail = patientUser.getEmail();
            if (patientEmail == null || patientEmail.isBlank()) {
                return MessageDTO.builder()
                        .success(false)
                        .message("Bệnh nhân chưa có địa chỉ email")
                        .build();
            }
            
            String htmlContent = buildCustomMessageEmailTemplate(
                    patientUser.getFullName(),
                    appointment.getAppointmentCode(),
                    dto.getMessage()
            );
            
            try {
                emailService.sendHtmlEmail(patientEmail, subject, htmlContent);
                emailSent = true;
                log.info("Custom email sent successfully to: {}", patientEmail);
            } catch (Exception e) {
                log.error("Failed to send custom email to: {}", patientEmail, e);
                return MessageDTO.builder()
                        .success(false)
                        .message("Gửi email thất bại: " + e.getMessage())
                        .build();
            }
            
            // Send copy if requested
            if (Boolean.TRUE.equals(dto.getSendCopy()) && dto.getCopyRecipient() != null && !dto.getCopyRecipient().isBlank()) {
                try {
                    emailService.sendHtmlEmail(dto.getCopyRecipient(), "[Copy] " + subject, htmlContent);
                    log.info("Copy email sent to: {}", dto.getCopyRecipient());
                } catch (Exception e) {
                    log.warn("Failed to send copy email to: {}", dto.getCopyRecipient(), e);
                }
            }
            
        } else if ("SMS".equals(dto.getMessageType())) {
            // SMS: log the message (no SMS gateway configured)
            String phoneNumber = patientUser.getPhone();
            if (phoneNumber == null || phoneNumber.isBlank()) {
                return MessageDTO.builder()
                        .success(false)
                        .message("Bệnh nhân chưa có số điện thoại")
                        .build();
            }
            
            log.info("SMS message to {}: {}", phoneNumber, dto.getMessage());
            smsSent = true;
            // TODO: Integrate with actual SMS gateway (Twilio, Vonage, etc.) when available
        }
        
        // Create notification record
        Notification notification = Notification.builder()
                .user(patientUser)
                .title(subject)
                .message(dto.getMessage())
                .type(NotificationType.APPOINTMENT)
                .referenceType("APPOINTMENT")
                .referenceId(appointmentId)
                .isRead(false)
                .emailSent(emailSent)
                .smsSent(smsSent)
                .build();
        
        notificationRepository.save(notification);
        
        String successMsg = emailSent
                ? "Email đã được gửi thành công đến " + patientUser.getEmail()
                : "Tin nhắn SMS đã được gửi thành công đến " + patientUser.getPhone();
        
        return MessageDTO.builder()
                .success(true)
                .message(successMsg)
                .build();
    }
    
    /**
     * Build HTML template for custom message email
     */
    private String buildCustomMessageEmailTemplate(String patientName, String appointmentCode, String messageContent) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset='UTF-8'>\n" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n" +
                "        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }\n" +
                "        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }\n" +
                "        .message-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #667eea; }\n" +
                "        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class='container'>\n" +
                "        <div class='header'>\n" +
                "            <h1>🏥 MedicalTech</h1>\n" +
                "            <p>Hệ thống quản lý y tế</p>\n" +
                "        </div>\n" +
                "        <div class='content'>\n" +
                "            <h2>Xin chào " + (patientName != null ? patientName : "Quý khách") + ",</h2>\n" +
                "            <p>Bạn nhận được thông báo liên quan đến lịch hẹn <strong>#" + (appointmentCode != null ? appointmentCode : "") + "</strong>:</p>\n" +
                "            <div class='message-box'>\n" +
                "                <p>" + messageContent.replace("\n", "<br/>") + "</p>\n" +
                "            </div>\n" +
                "            <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>\n" +
                "        </div>\n" +
                "        <div class='footer'>\n" +
                "            <p>© 2026 MedicalTech. All rights reserved.</p>\n" +
                "            <p>Email này được gửi tự động, vui lòng không trả lời.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
    
    @Override
    @Transactional(readOnly = true)
    public RelatedRecordsDTO getRelatedRecords(Long appointmentId) {
        log.info("Getting related records for appointment {}", appointmentId);
        
        // Verify appointment exists
        getAppointmentEntity(appointmentId);
        
        // Get prescription if exists
        List<RelatedRecordsDTO.PrescriptionSummary> prescriptions = new ArrayList<>();
        prescriptionRepository.findByAppointmentId(appointmentId)
                .ifPresent(p -> {
                    prescriptions.add(RelatedRecordsDTO.PrescriptionSummary.builder()
                            .id(p.getId())
                            .prescriptionDate(p.getPrescriptionDate())
                            .diagnosis(p.getDiagnosis())
                            .notes(p.getNotes())
                            .followUpDate(p.getFollowUpDate())
                            .isActive(p.getIsActive())
                            .itemCount(p.getItems() != null ? p.getItems().size() : 0)
                            .createdAt(p.getCreatedAt())
                            .build());
                });
        
        // Get payment if exists
        List<RelatedRecordsDTO.PaymentSummary> payments = new ArrayList<>();
        paymentRepository.findByAppointmentIdWithDetails(appointmentId)
                .ifPresent(payment -> {
                    payments.add(RelatedRecordsDTO.PaymentSummary.builder()
                            .id(payment.getId())
                            .amount(payment.getTotalAmount())
                            .paidAmount(payment.getTotalAmount())
                            .status(payment.getPaymentStatus())
                            .paymentMethod(payment.getPaymentMethod())
                            .paidAt(payment.getPaidAt())
                            .createdAt(payment.getCreatedAt())
                            .build());
                });
        
        // Get review if exists
        List<RelatedRecordsDTO.ReviewSummary> reviews = new ArrayList<>();
        reviewRepository.findByAppointmentId(appointmentId)
                .ifPresent(review -> {
                    reviews.add(RelatedRecordsDTO.ReviewSummary.builder()
                            .id(review.getId())
                            .rating(review.getRating())
                            .comment(review.getComment())
                            .doctorReply(review.getAdminResponse())
                            .repliedAt(review.getRespondedAt())
                            .isVisible(review.getIsVisible())
                            .createdAt(review.getCreatedAt())
                            .build());
                });
        
        return RelatedRecordsDTO.builder()
                .appointmentId(appointmentId)
                .prescriptions(prescriptions)
                .payments(payments)
                .reviews(reviews)
                .medicalRecords(new ArrayList<>())
                .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public byte[] exportHistoryToPdf(Long appointmentId) {
        log.info("Exporting history to PDF for appointment {}", appointmentId);
        
        Appointment appointment = getAppointmentEntity(appointmentId);
        List<AppointmentHistory> histories = historyRepository.findByAppointmentIdOrderByChangedAtDesc(appointmentId);
        
        // For simplicity, return a text-based representation
        // In production, use iText or Apache PDFBox
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
            
            writer.println("APPOINTMENT HISTORY REPORT");
            writer.println("========================");
            writer.println();
            writer.printf("Appointment Code: %s%n", appointment.getAppointmentCode());
            writer.printf("Patient: %s%n", appointment.getPatient().getUser().getFullName());
            writer.printf("Doctor: %s%n", appointment.getDoctor().getUser().getFullName());
            writer.printf("Date: %s%n", appointment.getAppointmentDate());
            writer.printf("Time: %s - %s%n", appointment.getStartTime(), appointment.getEndTime());
            writer.printf("Current Status: %s%n", appointment.getStatus());
            writer.println();
            writer.println("HISTORY TIMELINE");
            writer.println("----------------");
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            for (AppointmentHistory h : histories) {
                writer.printf("[%s] %s%n", 
                        h.getChangedAt() != null ? h.getChangedAt().format(formatter) : "N/A",
                        h.getAction());
                if (h.getOldStatus() != null && h.getNewStatus() != null) {
                    writer.printf("   Status: %s -> %s%n", h.getOldStatus(), h.getNewStatus());
                }
                if (h.getReason() != null) {
                    writer.printf("   Reason: %s%n", h.getReason());
                }
                writer.printf("   By: %s (%s)%n", h.getChangedByRole(), h.getChangedByUserId());
                writer.println();
            }
            
            writer.flush();
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Error exporting history to PDF", e);
            throw new RuntimeException("Failed to export appointment history", e);
        }
    }
    
    // ==================== STATISTICS & ANALYTICS ====================
    
    @Override
    @Transactional(readOnly = true)
    public AppointmentSummaryStatsDTO getSummaryStatistics(LocalDate from, LocalDate to, Long doctorId) {
        log.info("Getting summary statistics from {} to {} for doctor {}", from, to, doctorId);
        
        // Count by status
        Long total = appointmentRepository.countInRange(from, to, doctorId);
        Long pending = appointmentRepository.countByStatusInRange(from, to, doctorId, AppointmentStatus.PENDING);
        Long confirmed = appointmentRepository.countByStatusInRange(from, to, doctorId, AppointmentStatus.CONFIRMED);
        Long checkedIn = appointmentRepository.countByStatusInRange(from, to, doctorId, AppointmentStatus.CHECKED_IN);
        Long inProgress = appointmentRepository.countByStatusInRange(from, to, doctorId, AppointmentStatus.IN_PROGRESS);
        Long completed = appointmentRepository.countByStatusInRange(from, to, doctorId, AppointmentStatus.COMPLETED);
        Long cancelled = appointmentRepository.countByStatusInRange(from, to, doctorId, AppointmentStatus.CANCELLED);
        Long noShow = appointmentRepository.countByStatusInRange(from, to, doctorId, AppointmentStatus.NO_SHOW);
        
        // Calculate rates
        BigDecimal completionRate = BigDecimal.ZERO;
        Long scheduled = confirmed + checkedIn + inProgress + completed + noShow;
        if (scheduled > 0) {
            completionRate = BigDecimal.valueOf(completed)
                    .divide(BigDecimal.valueOf(scheduled), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        
        BigDecimal cancellationRate = BigDecimal.ZERO;
        if (total > 0) {
            cancellationRate = BigDecimal.valueOf(cancelled)
                    .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        
        BigDecimal noShowRate = BigDecimal.ZERO;
        if (scheduled > 0) {
            noShowRate = BigDecimal.valueOf(noShow)
                    .divide(BigDecimal.valueOf(scheduled), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        
        // Previous period comparison
        long daysBetween = ChronoUnit.DAYS.between(from, to) + 1;
        LocalDate prevFrom = from.minusDays(daysBetween);
        LocalDate prevTo = from.minusDays(1);
        Long previousTotal = appointmentRepository.countInRange(prevFrom, prevTo, doctorId);
        
        BigDecimal changePercentage = BigDecimal.ZERO;
        if (previousTotal > 0) {
            changePercentage = BigDecimal.valueOf(total - previousTotal)
                    .divide(BigDecimal.valueOf(previousTotal), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        
        // Averages
        BigDecimal avgPerDay = BigDecimal.ZERO;
        if (daysBetween > 0) {
            avgPerDay = BigDecimal.valueOf(total)
                    .divide(BigDecimal.valueOf(daysBetween), 2, RoundingMode.HALF_UP);
        }
        
        Long doctorCount = appointmentRepository.countDistinctDoctors(from, to);
        BigDecimal avgPerDoctor = BigDecimal.ZERO;
        if (doctorCount > 0) {
            avgPerDoctor = BigDecimal.valueOf(total)
                    .divide(BigDecimal.valueOf(doctorCount), 2, RoundingMode.HALF_UP);
        }
        
        return AppointmentSummaryStatsDTO.builder()
                .from(from)
                .to(to)
                .totalAppointments(total)
                .pendingAppointments(pending)
                .confirmedAppointments(confirmed)
                .checkedInAppointments(checkedIn)
                .inProgressAppointments(inProgress)
                .completedAppointments(completed)
                .cancelledAppointments(cancelled)
                .noShowAppointments(noShow)
                .completionRate(completionRate)
                .cancellationRate(cancellationRate)
                .noShowRate(noShowRate)
                .previousPeriodTotal(previousTotal)
                .changePercentage(changePercentage)
                .averageAppointmentsPerDay(avgPerDay)
                .averageAppointmentsPerDoctor(avgPerDoctor)
                .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public TimeSeriesStatsDTO getAppointmentsOverTime(LocalDate from, LocalDate to, String groupBy, Long doctorId) {
        log.info("Getting appointments over time from {} to {} grouped by {} for doctor {}", from, to, groupBy, doctorId);
        
        List<Object[]> rawData = appointmentRepository.countByDateAndStatusInRange(from, to, doctorId);
        
        // Group by date
        Map<LocalDate, Map<AppointmentStatus, Long>> byDate = new LinkedHashMap<>();
        for (Object[] row : rawData) {
            LocalDate date = (LocalDate) row[0];
            AppointmentStatus status = (AppointmentStatus) row[1];
            Long count = (Long) row[2];
            
            byDate.computeIfAbsent(date, k -> new EnumMap<>(AppointmentStatus.class))
                    .put(status, count);
        }
        
        List<TimeSeriesStatsDTO.DataPoint> dataPoints = new ArrayList<>();
        
        if ("WEEK".equalsIgnoreCase(groupBy)) {
            // Group by week
            Map<Integer, Map<AppointmentStatus, Long>> byWeek = new LinkedHashMap<>();
            Map<Integer, LocalDate> weekStartDates = new HashMap<>();
            
            byDate.forEach((date, statusMap) -> {
                int weekNum = date.get(WeekFields.ISO.weekOfWeekBasedYear());
                byWeek.computeIfAbsent(weekNum, k -> new EnumMap<>(AppointmentStatus.class));
                weekStartDates.putIfAbsent(weekNum, date.with(WeekFields.ISO.dayOfWeek(), 1));
                
                statusMap.forEach((status, count) -> 
                        byWeek.get(weekNum).merge(status, count, Long::sum));
            });
            
            byWeek.forEach((weekNum, statusMap) -> {
                long total = statusMap.values().stream().mapToLong(Long::longValue).sum();
                dataPoints.add(TimeSeriesStatsDTO.DataPoint.builder()
                        .label("Week " + weekNum)
                        .date(weekStartDates.get(weekNum))
                        .total(total)
                        .completed(statusMap.getOrDefault(AppointmentStatus.COMPLETED, 0L))
                        .cancelled(statusMap.getOrDefault(AppointmentStatus.CANCELLED, 0L))
                        .noShow(statusMap.getOrDefault(AppointmentStatus.NO_SHOW, 0L))
                        .build());
            });
            
        } else if ("MONTH".equalsIgnoreCase(groupBy)) {
            // Group by month
            Map<YearMonth, Map<AppointmentStatus, Long>> byMonth = new LinkedHashMap<>();
            
            byDate.forEach((date, statusMap) -> {
                YearMonth ym = YearMonth.from(date);
                byMonth.computeIfAbsent(ym, k -> new EnumMap<>(AppointmentStatus.class));
                
                statusMap.forEach((status, count) -> 
                        byMonth.get(ym).merge(status, count, Long::sum));
            });
            
            DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
            byMonth.forEach((ym, statusMap) -> {
                long total = statusMap.values().stream().mapToLong(Long::longValue).sum();
                dataPoints.add(TimeSeriesStatsDTO.DataPoint.builder()
                        .label(ym.format(monthFormatter))
                        .date(ym.atDay(1))
                        .total(total)
                        .completed(statusMap.getOrDefault(AppointmentStatus.COMPLETED, 0L))
                        .cancelled(statusMap.getOrDefault(AppointmentStatus.CANCELLED, 0L))
                        .noShow(statusMap.getOrDefault(AppointmentStatus.NO_SHOW, 0L))
                        .build());
            });
            
        } else {
            // Default: group by DAY
            byDate.forEach((date, statusMap) -> {
                long total = statusMap.values().stream().mapToLong(Long::longValue).sum();
                dataPoints.add(TimeSeriesStatsDTO.DataPoint.builder()
                        .label(date.toString())
                        .date(date)
                        .total(total)
                        .completed(statusMap.getOrDefault(AppointmentStatus.COMPLETED, 0L))
                        .cancelled(statusMap.getOrDefault(AppointmentStatus.CANCELLED, 0L))
                        .noShow(statusMap.getOrDefault(AppointmentStatus.NO_SHOW, 0L))
                        .build());
            });
        }
        
        // Calculate summary
        long totalAll = dataPoints.stream().mapToLong(TimeSeriesStatsDTO.DataPoint::getTotal).sum();
        long max = dataPoints.stream().mapToLong(TimeSeriesStatsDTO.DataPoint::getTotal).max().orElse(0L);
        long min = dataPoints.stream().mapToLong(TimeSeriesStatsDTO.DataPoint::getTotal).min().orElse(0L);
        double avg = dataPoints.isEmpty() ? 0.0 : (double) totalAll / dataPoints.size();
        
        return TimeSeriesStatsDTO.builder()
                .from(from)
                .to(to)
                .groupBy(groupBy != null ? groupBy.toUpperCase() : "DAY")
                .doctorId(doctorId)
                .data(dataPoints)
                .totalAppointments(totalAll)
                .maxInPeriod(max)
                .minInPeriod(min)
                .averagePerPeriod(avg)
                .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public StatusDistributionDTO getStatusDistribution(LocalDate from, LocalDate to, Long doctorId) {
        log.info("Getting status distribution from {} to {} for doctor {}", from, to, doctorId);
        
        List<Object[]> rawData = appointmentRepository.getStatusDistribution(from, to, doctorId);
        
        long total = rawData.stream().mapToLong(row -> (Long) row[1]).sum();
        
        Map<AppointmentStatus, String> statusColors = Map.of(
                AppointmentStatus.PENDING, "#FFA500",
                AppointmentStatus.CONFIRMED, "#2196F3",
                AppointmentStatus.CHECKED_IN, "#9C27B0",
                AppointmentStatus.IN_PROGRESS, "#3F51B5",
                AppointmentStatus.COMPLETED, "#4CAF50",
                AppointmentStatus.CANCELLED, "#F44336",
                AppointmentStatus.NO_SHOW, "#9E9E9E",
                AppointmentStatus.RESCHEDULED, "#FF9800"
        );
        
        List<StatusDistributionDTO.StatusCount> distribution = rawData.stream()
                .map(row -> {
                    AppointmentStatus status = (AppointmentStatus) row[0];
                    Long count = (Long) row[1];
                    BigDecimal percentage = total > 0 
                            ? BigDecimal.valueOf(count).divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                            : BigDecimal.ZERO;
                    
                    return StatusDistributionDTO.StatusCount.builder()
                            .status(status.name())
                            .statusDisplayName(formatStatusName(status))
                            .count(count)
                            .percentage(percentage)
                            .color(statusColors.getOrDefault(status, "#607D8B"))
                            .build();
                })
                .collect(Collectors.toList());
        
        return StatusDistributionDTO.builder()
                .from(from)
                .to(to)
                .doctorId(doctorId)
                .total(total)
                .distribution(distribution)
                .build();
    }
    
    private String formatStatusName(AppointmentStatus status) {
        String name = status.name().replace("_", " ");
        return name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase();
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<DoctorStatsDTO> getStatsByDoctor(LocalDate from, LocalDate to, int page, int size, 
                                                  String sortBy, String sortDir) {
        log.info("Getting doctor stats from {} to {}", from, to);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Object[]> rawData = appointmentRepository.getDoctorStats(from, to, pageable);
        
        List<DoctorStatsDTO> stats = rawData.getContent().stream()
                .map(row -> {
                    Doctor doctor = (Doctor) row[0];
                    Long totalAppointments = (Long) row[1];
                    Long completed = (Long) row[2];
                    Long cancelled = (Long) row[3];
                    Long noShow = (Long) row[4];
                    
                    BigDecimal completionRate = totalAppointments > 0 
                            ? BigDecimal.valueOf(completed).divide(BigDecimal.valueOf(totalAppointments), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                            : BigDecimal.ZERO;
                    BigDecimal cancellationRate = totalAppointments > 0 
                            ? BigDecimal.valueOf(cancelled).divide(BigDecimal.valueOf(totalAppointments), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                            : BigDecimal.ZERO;
                    BigDecimal noShowRate = totalAppointments > 0 
                            ? BigDecimal.valueOf(noShow).divide(BigDecimal.valueOf(totalAppointments), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                            : BigDecimal.ZERO;
                    
                    return DoctorStatsDTO.builder()
                            .doctorId(doctor.getId())
                            .doctorName(doctor.getUser() != null ? doctor.getUser().getFullName() : "Unknown")
                            .specialization(doctor.getSpecialization())
                            .avatarUrl(doctor.getUser() != null ? doctor.getUser().getAvatarUrl() : null)
                            .totalAppointments(totalAppointments)
                            .completedAppointments(completed)
                            .cancelledAppointments(cancelled)
                            .noShowAppointments(noShow)
                            .completionRate(completionRate)
                            .cancellationRate(cancellationRate)
                            .noShowRate(noShowRate)
                            .consultationFee(doctor.getConsultationFee())
                            .build();
                })
                .collect(Collectors.toList());
        
        return new PageImpl<>(stats, pageable, rawData.getTotalElements());
    }
    
    @Override
    @Transactional(readOnly = true)
    public PeakHoursHeatmapDTO getPeakHoursHeatmap(LocalDate from, LocalDate to, Long doctorId) {
        log.info("Getting peak hours heatmap from {} to {} for doctor {}", from, to, doctorId);
        
        List<Object[]> rawData = appointmentRepository.getHeatmapData(from, to, doctorId);
        
        // Initialize 7x24 matrix
        String[] dayNames = {"SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"};
        String[] dayShorts = {"SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"};
        
        // dayOfWeek: 1=Sunday, 2=Monday, ... 7=Saturday (MySQL DAYOFWEEK)
        long[][] matrix = new long[7][24];
        long maxCount = 0;
        long totalAppointments = 0;
        
        for (Object[] row : rawData) {
            int dayOfWeek = ((Number) row[0]).intValue() - 1; // Convert to 0-indexed
            int hour = ((Number) row[1]).intValue();
            long count = ((Number) row[2]).longValue();
            
            if (dayOfWeek >= 0 && dayOfWeek < 7 && hour >= 0 && hour < 24) {
                matrix[dayOfWeek][hour] = count;
                maxCount = Math.max(maxCount, count);
                totalAppointments += count;
            }
        }
        
        // Build response
        List<PeakHoursHeatmapDTO.DayData> days = new ArrayList<>();
        int peakDay = 0, peakHour = 0;
        long peakDayCount = 0;
        
        for (int d = 0; d < 7; d++) {
            List<PeakHoursHeatmapDTO.HourCount> hours = new ArrayList<>();
            long dayTotal = 0;
            
            for (int h = 0; h < 24; h++) {
                long count = matrix[d][h];
                dayTotal += count;
                double intensity = maxCount > 0 ? (double) count / maxCount : 0.0;
                
                hours.add(PeakHoursHeatmapDTO.HourCount.builder()
                        .hour(h)
                        .hourLabel(String.format("%02d:00", h))
                        .count(count)
                        .intensity(intensity)
                        .build());
                
                if (count > matrix[peakDay][peakHour]) {
                    peakDay = d;
                    peakHour = h;
                }
            }
            
            if (dayTotal > peakDayCount) {
                peakDayCount = dayTotal;
            }
            
            days.add(PeakHoursHeatmapDTO.DayData.builder()
                    .dayName(dayNames[d])
                    .dayShort(dayShorts[d])
                    .dayIndex(d)
                    .hours(hours)
                    .dayTotal(dayTotal)
                    .build());
        }
        
        // Find actual peak day (by total)
        int actualPeakDay = 0;
        long actualPeakDayTotal = days.get(0).getDayTotal();
        for (int d = 1; d < 7; d++) {
            if (days.get(d).getDayTotal() > actualPeakDayTotal) {
                actualPeakDay = d;
                actualPeakDayTotal = days.get(d).getDayTotal();
            }
        }
        
        return PeakHoursHeatmapDTO.builder()
                .from(from)
                .to(to)
                .doctorId(doctorId)
                .days(days)
                .peakHour(PeakHoursHeatmapDTO.PeakInfo.builder()
                        .label(dayNames[peakDay] + " " + String.format("%02d:00", peakHour))
                        .count(matrix[peakDay][peakHour])
                        .percentage(totalAppointments > 0 ? (double) matrix[peakDay][peakHour] / totalAppointments * 100 : 0.0)
                        .build())
                .peakDay(PeakHoursHeatmapDTO.PeakInfo.builder()
                        .label(dayNames[actualPeakDay])
                        .count(actualPeakDayTotal)
                        .percentage(totalAppointments > 0 ? (double) actualPeakDayTotal / totalAppointments * 100 : 0.0)
                        .build())
                .maxCount(maxCount)
                .totalAppointments(totalAppointments)
                .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public CancellationAnalysisDTO getCancellationAnalysis(LocalDate from, LocalDate to, Long doctorId) {
        log.info("Getting cancellation analysis from {} to {} for doctor {}", from, to, doctorId);
        
        Long totalCancellations = appointmentRepository.countByStatusInRange(from, to, doctorId, AppointmentStatus.CANCELLED);
        Long totalAppointments = appointmentRepository.countInRange(from, to, doctorId);
        
        BigDecimal cancellationRate = totalAppointments > 0 
                ? BigDecimal.valueOf(totalCancellations).divide(BigDecimal.valueOf(totalAppointments), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;
        
        // Get cancellations by role
        List<Object[]> byRole = appointmentRepository.getCancellationsByRole(from, to, doctorId);
        long byPatient = 0, byDoctor = 0, byAdmin = 0, bySystem = 0;
        for (Object[] row : byRole) {
            String role = row[0] != null ? row[0].toString() : "SYSTEM";
            long count = ((Number) row[1]).longValue();
            switch (role.toUpperCase()) {
                case "PATIENT" -> byPatient = count;
                case "DOCTOR" -> byDoctor = count;
                case "ADMIN" -> byAdmin = count;
                default -> bySystem += count;
            }
        }
        
        // Get reasons
        List<Object[]> reasons = appointmentRepository.getCancellationReasons(from, to, doctorId);
        List<CancellationAnalysisDTO.ReasonCount> topReasons = reasons.stream()
                .limit(10)
                .map(row -> CancellationAnalysisDTO.ReasonCount.builder()
                        .reason(row[0] != null ? row[0].toString() : "No reason provided")
                        .count(((Number) row[1]).longValue())
                        .percentage(totalCancellations > 0 
                                ? BigDecimal.valueOf(((Number) row[1]).longValue())
                                        .divide(BigDecimal.valueOf(totalCancellations), 4, RoundingMode.HALF_UP)
                                        .multiply(BigDecimal.valueOf(100))
                                : BigDecimal.ZERO)
                        .build())
                .collect(Collectors.toList());
        
        // Get trend
        List<Object[]> dateData = appointmentRepository.countByDateAndStatusInRange(from, to, doctorId);
        Map<LocalDate, Long> cancellationsByDate = new HashMap<>();
        Map<LocalDate, Long> totalByDate = new HashMap<>();
        
        for (Object[] row : dateData) {
            LocalDate date = (LocalDate) row[0];
            AppointmentStatus status = (AppointmentStatus) row[1];
            Long count = (Long) row[2];
            
            totalByDate.merge(date, count, Long::sum);
            if (status == AppointmentStatus.CANCELLED) {
                cancellationsByDate.put(date, count);
            }
        }
        
        List<CancellationAnalysisDTO.TrendPoint> trend = totalByDate.keySet().stream()
                .sorted()
                .map(date -> {
                    long cancels = cancellationsByDate.getOrDefault(date, 0L);
                    long total = totalByDate.get(date);
                    return CancellationAnalysisDTO.TrendPoint.builder()
                            .label(date.toString())
                            .date(date)
                            .cancellations(cancels)
                            .totalBooked(total)
                            .rate(total > 0 
                                    ? BigDecimal.valueOf(cancels).divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                                    : BigDecimal.ZERO)
                            .build();
                })
                .collect(Collectors.toList());
        
        return CancellationAnalysisDTO.builder()
                .from(from)
                .to(to)
                .doctorId(doctorId)
                .totalCancellations(totalCancellations)
                .totalAppointments(totalAppointments)
                .cancellationRate(cancellationRate)
                .cancelledByPatient(byPatient)
                .cancelledByDoctor(byDoctor)
                .cancelledByAdmin(byAdmin)
                .cancelledBySystem(bySystem)
                .topReasons(topReasons)
                .trend(trend)
                .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public NoShowAnalysisDTO getNoShowAnalysis(LocalDate from, LocalDate to, Long doctorId) {
        log.info("Getting no-show analysis from {} to {} for doctor {}", from, to, doctorId);
        
        Long totalNoShows = appointmentRepository.countByStatusInRange(from, to, doctorId, AppointmentStatus.NO_SHOW);
        Long totalScheduled = appointmentRepository.countScheduledAppointments(from, to, doctorId);
        
        BigDecimal noShowRate = totalScheduled > 0 
                ? BigDecimal.valueOf(totalNoShows).divide(BigDecimal.valueOf(totalScheduled), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;
        
        // Previous period
        long daysBetween = ChronoUnit.DAYS.between(from, to) + 1;
        LocalDate prevFrom = from.minusDays(daysBetween);
        LocalDate prevTo = from.minusDays(1);
        Long prevNoShows = appointmentRepository.countByStatusInRange(prevFrom, prevTo, doctorId, AppointmentStatus.NO_SHOW);
        Long prevScheduled = appointmentRepository.countScheduledAppointments(prevFrom, prevTo, doctorId);
        BigDecimal prevRate = prevScheduled > 0 
                ? BigDecimal.valueOf(prevNoShows).divide(BigDecimal.valueOf(prevScheduled), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;
        
        // By day of week
        List<Object[]> dayData = appointmentRepository.getNoShowsByDayOfWeek(from, to, doctorId);
        String[] dayNames = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
        List<NoShowAnalysisDTO.DayBreakdown> byDay = new ArrayList<>();
        Map<Integer, Long> noShowsByDay = new HashMap<>();
        for (Object[] row : dayData) {
            int dayOfWeek = ((Number) row[0]).intValue() - 1;
            long count = ((Number) row[1]).longValue();
            noShowsByDay.put(dayOfWeek, count);
        }
        
        for (int d = 0; d < 7; d++) {
            long noShows = noShowsByDay.getOrDefault(d, 0L);
            byDay.add(NoShowAnalysisDTO.DayBreakdown.builder()
                    .dayName(dayNames[d])
                    .noShows(noShows)
                    .total(0L) // Would need additional query
                    .rate(BigDecimal.ZERO)
                    .build());
        }
        
        // Get repeat offenders
        List<Object[]> patientData = appointmentRepository.getNoShowPatients(from, to, doctorId);
        long uniquePatients = patientData.size();
        long repeatOffenders = patientData.stream()
                .filter(row -> ((Number) row[3]).longValue() >= 2)
                .count();
        
        List<NoShowAnalysisDTO.RepeatOffender> topOffenders = patientData.stream()
                .filter(row -> ((Number) row[3]).longValue() >= 2)
                .limit(10)
                .map(row -> NoShowAnalysisDTO.RepeatOffender.builder()
                        .patientId(((Number) row[0]).longValue())
                        .patientName((String) row[1])
                        .phone((String) row[2])
                        .noShowCount(((Number) row[3]).intValue())
                        .lastNoShowDate((LocalDate) row[4])
                        .build())
                .collect(Collectors.toList());
        
        // Get trend
        List<Object[]> dateData = appointmentRepository.countByDateAndStatusInRange(from, to, doctorId);
        Map<LocalDate, Long> noShowByDate = new HashMap<>();
        Map<LocalDate, Long> scheduledByDate = new HashMap<>();
        
        for (Object[] row : dateData) {
            LocalDate date = (LocalDate) row[0];
            AppointmentStatus status = (AppointmentStatus) row[1];
            Long count = (Long) row[2];
            
            if (status == AppointmentStatus.NO_SHOW) {
                noShowByDate.put(date, count);
            }
            if (status == AppointmentStatus.CONFIRMED || status == AppointmentStatus.CHECKED_IN 
                    || status == AppointmentStatus.IN_PROGRESS || status == AppointmentStatus.COMPLETED 
                    || status == AppointmentStatus.NO_SHOW) {
                scheduledByDate.merge(date, count, Long::sum);
            }
        }
        
        List<NoShowAnalysisDTO.TrendPoint> trend = noShowByDate.keySet().stream()
                .sorted()
                .map(date -> {
                    long noShows = noShowByDate.getOrDefault(date, 0L);
                    long scheduled = scheduledByDate.getOrDefault(date, 0L);
                    return NoShowAnalysisDTO.TrendPoint.builder()
                            .label(date.toString())
                            .date(date)
                            .noShows(noShows)
                            .scheduled(scheduled)
                            .rate(scheduled > 0 
                                    ? BigDecimal.valueOf(noShows).divide(BigDecimal.valueOf(scheduled), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                                    : BigDecimal.ZERO)
                            .build();
                })
                .collect(Collectors.toList());
        
        return NoShowAnalysisDTO.builder()
                .from(from)
                .to(to)
                .doctorId(doctorId)
                .totalNoShows(totalNoShows)
                .totalScheduled(totalScheduled)
                .noShowRate(noShowRate)
                .previousPeriodRate(prevRate)
                .rateChange(noShowRate.subtract(prevRate))
                .byDayOfWeek(byDay)
                .trend(trend)
                .uniqueNoShowPatients(uniquePatients)
                .repeatOffenders(repeatOffenders)
                .topRepeatOffenders(topOffenders)
                .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public WaitTimeStatsDTO getWaitTimeStats(LocalDate from, LocalDate to, Long doctorId) {
        log.info("Getting wait time stats from {} to {} for doctor {}", from, to, doctorId);
        
        List<Appointment> appointments = appointmentRepository.findCompletedWithTimestamps(from, to, doctorId);
        
        if (appointments.isEmpty()) {
            return WaitTimeStatsDTO.builder()
                    .from(from)
                    .to(to)
                    .doctorId(doctorId)
                    .averageWaitTime(BigDecimal.ZERO)
                    .medianWaitTime(BigDecimal.ZERO)
                    .minWaitTime(BigDecimal.ZERO)
                    .maxWaitTime(BigDecimal.ZERO)
                    .distribution(List.of())
                    .byDayOfWeek(List.of())
                    .byHour(List.of())
                    .trend(List.of())
                    .onTimeRate(BigDecimal.ZERO)
                    .under30MinRate(BigDecimal.ZERO)
                    .build();
        }
        
        // Calculate wait times in minutes
        List<Long> waitTimes = appointments.stream()
                .map(a -> Duration.between(a.getCheckedInAt(), a.getConsultationStartedAt()).toMinutes())
                .filter(m -> m >= 0)
                .sorted()
                .collect(Collectors.toList());
        
        if (waitTimes.isEmpty()) {
            return WaitTimeStatsDTO.builder()
                    .from(from).to(to).doctorId(doctorId)
                    .averageWaitTime(BigDecimal.ZERO)
                    .build();
        }
        
        // Stats
        long sum = waitTimes.stream().mapToLong(Long::longValue).sum();
        BigDecimal avg = BigDecimal.valueOf(sum).divide(BigDecimal.valueOf(waitTimes.size()), 2, RoundingMode.HALF_UP);
        BigDecimal median = BigDecimal.valueOf(waitTimes.get(waitTimes.size() / 2));
        BigDecimal min = BigDecimal.valueOf(waitTimes.get(0));
        BigDecimal max = BigDecimal.valueOf(waitTimes.get(waitTimes.size() - 1));
        
        int p90Index = (int) Math.ceil(0.9 * waitTimes.size()) - 1;
        BigDecimal p90 = BigDecimal.valueOf(waitTimes.get(Math.max(0, p90Index)));
        
        // Distribution buckets
        List<WaitTimeStatsDTO.WaitTimeBucket> distribution = List.of(
                createBucket("0-5 min", 0, 5, waitTimes),
                createBucket("5-15 min", 5, 15, waitTimes),
                createBucket("15-30 min", 15, 30, waitTimes),
                createBucket("30-60 min", 30, 60, waitTimes),
                createBucket("60+ min", 60, Integer.MAX_VALUE, waitTimes)
        );
        
        // On-time rate (within 15 min)
        long onTime = waitTimes.stream().filter(w -> w <= 15).count();
        BigDecimal onTimeRate = BigDecimal.valueOf(onTime)
                .divide(BigDecimal.valueOf(waitTimes.size()), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        
        long under30 = waitTimes.stream().filter(w -> w <= 30).count();
        BigDecimal under30Rate = BigDecimal.valueOf(under30)
                .divide(BigDecimal.valueOf(waitTimes.size()), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        
        // By day of week
        String[] dayNames = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
        Map<Integer, List<Long>> waitByDay = appointments.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getAppointmentDate().getDayOfWeek().getValue() % 7,
                        Collectors.mapping(
                                a -> Duration.between(a.getCheckedInAt(), a.getConsultationStartedAt()).toMinutes(),
                                Collectors.toList()
                        )
                ));
        
        List<WaitTimeStatsDTO.DayWaitTime> byDayOfWeek = new ArrayList<>();
        for (int d = 0; d < 7; d++) {
            List<Long> dayWaits = waitByDay.getOrDefault(d, List.of());
            BigDecimal dayAvg = dayWaits.isEmpty() ? BigDecimal.ZERO 
                    : BigDecimal.valueOf(dayWaits.stream().mapToLong(Long::longValue).sum())
                            .divide(BigDecimal.valueOf(dayWaits.size()), 2, RoundingMode.HALF_UP);
            byDayOfWeek.add(WaitTimeStatsDTO.DayWaitTime.builder()
                    .dayName(dayNames[d])
                    .averageWait(dayAvg)
                    .appointmentCount((long) dayWaits.size())
                    .build());
        }
        
        // By hour
        Map<Integer, List<Long>> waitByHour = appointments.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getStartTime().getHour(),
                        Collectors.mapping(
                                a -> Duration.between(a.getCheckedInAt(), a.getConsultationStartedAt()).toMinutes(),
                                Collectors.toList()
                        )
                ));
        
        List<WaitTimeStatsDTO.HourWaitTime> byHour = waitByHour.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    List<Long> hourWaits = e.getValue();
                    BigDecimal hourAvg = BigDecimal.valueOf(hourWaits.stream().mapToLong(Long::longValue).sum())
                            .divide(BigDecimal.valueOf(hourWaits.size()), 2, RoundingMode.HALF_UP);
                    return WaitTimeStatsDTO.HourWaitTime.builder()
                            .hour(e.getKey())
                            .hourLabel(String.format("%02d:00", e.getKey()))
                            .averageWait(hourAvg)
                            .appointmentCount((long) hourWaits.size())
                            .build();
                })
                .collect(Collectors.toList());
        
        return WaitTimeStatsDTO.builder()
                .from(from)
                .to(to)
                .doctorId(doctorId)
                .averageWaitTime(avg)
                .medianWaitTime(median)
                .minWaitTime(min)
                .maxWaitTime(max)
                .percentile90WaitTime(p90)
                .distribution(distribution)
                .byDayOfWeek(byDayOfWeek)
                .byHour(byHour)
                .onTimeRate(onTimeRate)
                .under30MinRate(under30Rate)
                .build();
    }
    
    private WaitTimeStatsDTO.WaitTimeBucket createBucket(String label, int minMin, int maxMin, List<Long> waitTimes) {
        long count = waitTimes.stream()
                .filter(w -> w >= minMin && w < maxMin)
                .count();
        BigDecimal percentage = waitTimes.isEmpty() ? BigDecimal.ZERO 
                : BigDecimal.valueOf(count).divide(BigDecimal.valueOf(waitTimes.size()), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        
        return WaitTimeStatsDTO.WaitTimeBucket.builder()
                .label(label)
                .minMinutes(minMin)
                .maxMinutes(maxMin == Integer.MAX_VALUE ? null : maxMin)
                .count(count)
                .percentage(percentage)
                .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public byte[] exportStatisticsPdf(LocalDate from, LocalDate to, Long doctorId) {
        log.info("Exporting statistics to PDF from {} to {} for doctor {}", from, to, doctorId);
        
        AppointmentSummaryStatsDTO summary = getSummaryStatistics(from, to, doctorId);
        StatusDistributionDTO statusDist = getStatusDistribution(from, to, doctorId);
        
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
            
            writer.println("APPOINTMENT STATISTICS REPORT");
            writer.println("=============================");
            writer.println();
            writer.printf("Period: %s to %s%n", from, to);
            if (doctorId != null) {
                writer.printf("Doctor ID: %d%n", doctorId);
            }
            writer.println();
            
            writer.println("SUMMARY");
            writer.println("-------");
            writer.printf("Total Appointments: %d%n", summary.getTotalAppointments());
            writer.printf("Completed: %d%n", summary.getCompletedAppointments());
            writer.printf("Cancelled: %d%n", summary.getCancelledAppointments());
            writer.printf("No-Show: %d%n", summary.getNoShowAppointments());
            writer.println();
            
            writer.println("RATES");
            writer.println("-----");
            writer.printf("Completion Rate: %.2f%%%n", summary.getCompletionRate());
            writer.printf("Cancellation Rate: %.2f%%%n", summary.getCancellationRate());
            writer.printf("No-Show Rate: %.2f%%%n", summary.getNoShowRate());
            writer.println();
            
            writer.println("COMPARISON WITH PREVIOUS PERIOD");
            writer.println("-------------------------------");
            writer.printf("Previous Period Total: %d%n", summary.getPreviousPeriodTotal());
            writer.printf("Change: %.2f%%%n", summary.getChangePercentage());
            writer.println();
            
            writer.println("AVERAGES");
            writer.println("--------");
            writer.printf("Per Day: %.2f%n", summary.getAverageAppointmentsPerDay());
            writer.printf("Per Doctor: %.2f%n", summary.getAverageAppointmentsPerDoctor());
            writer.println();
            
            writer.println("STATUS DISTRIBUTION");
            writer.println("-------------------");
            for (StatusDistributionDTO.StatusCount sc : statusDist.getDistribution()) {
                writer.printf("%s: %d (%.2f%%)%n", sc.getStatusDisplayName(), sc.getCount(), sc.getPercentage());
            }
            
            writer.println();
            writer.printf("Generated: %s%n", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            writer.flush();
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Error exporting statistics to PDF", e);
            throw new RuntimeException("Failed to export statistics", e);
        }
    }
}