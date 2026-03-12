package com.q2k.meditech.service;

import com.q2k.meditech.dto.DoctorTodayDTO;
import com.q2k.meditech.dto.DoctorTodayDTO.*;
import com.q2k.meditech.dto.receptionist.ReorderQueueDTO;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.AppointmentHistory;
import com.q2k.meditech.entity.AuditLog;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.MedicalRecord;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.DoctorQueueStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.AuditLogRepository;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.MedicalRecordRepository;
import com.q2k.meditech.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for the Doctor Today page (Queue / Timeline).
 * Handles queue operations with mandatory audit logging.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorTodayService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final ObjectMapper objectMapper;

    /** No-show policy: minimum wait minutes before doctor can mark no-show. */
    private static final int NO_SHOW_MIN_WAIT_MINUTES = 30;

    // =========================================================================
    // READ – build today's data
    // =========================================================================

    @Transactional(readOnly = true)
    public DoctorTodayDTO getTodayData(Long doctorId) {
        log.info("Building today data for doctor ID: {}", doctorId);

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        List<Appointment> appointments = appointmentRepository
                .findByDoctorIdAndDateForDashboard(doctorId, today);

        return DoctorTodayDTO.builder()
                .doctorId(doctorId)
                .doctorStatus(mapDoctorStatus(doctor.getQueueStatus()))
                .currentPatient(buildCurrentPatient(appointments))
                .waitingQueue(buildWaitingQueue(appointments))
                .timeline(buildTimeline(appointments, now))
                .summary(buildSummary(appointments))
                .generatedAt(LocalDateTime.now())
                .build();
    }

    // =========================================================================
    // ACTIONS – queue operations (all with audit)
    // =========================================================================

    /**
     * Call next patient in queue – changes status from CHECKED_IN to IN_PROGRESS.
     */
    @Transactional
    public void callNextPatient(Long doctorId, Long userId) {
        List<Appointment> appointments = appointmentRepository
                .findByDoctorIdAndDateForDashboard(doctorId, LocalDate.now());

        // Ensure no patient is currently in progress
        boolean hasInProgress = appointments.stream()
                .anyMatch(a -> a.getStatus() == AppointmentStatus.IN_PROGRESS);
        if (hasInProgress) {
            throw new BadRequestException("Complete the current consultation before calling the next patient");
        }

        // Find first checked-in patient by queue number
        Appointment next = appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN)
                .sorted(Comparator.comparing(a -> a.getQueueNumber() != null ? a.getQueueNumber() : Integer.MAX_VALUE))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("No patients waiting in queue"));

        AppointmentStatus oldStatus = next.getStatus();
        next.setStatus(AppointmentStatus.IN_PROGRESS);
        appointmentRepository.save(next);

        audit(userId, "CALL_PATIENT", "APPOINTMENT", next.getId(),
                Map.of("oldStatus", oldStatus.name()),
                Map.of("newStatus", AppointmentStatus.IN_PROGRESS.name(),
                        "queueNumber", next.getQueueNumber()));
        log.info("Doctor {} called patient queue #{} (appointment {})", doctorId, next.getQueueNumber(), next.getId());
    }

    /**
     * Call a specific patient by appointment ID.
     */
    @Transactional
    public void callPatient(Long doctorId, Long appointmentId, Long userId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        validateDoctorOwnership(appointment, doctorId);

        if (appointment.getStatus() != AppointmentStatus.CHECKED_IN) {
            throw new BadRequestException("Patient must be checked in to be called. Current status: " + appointment.getStatus());
        }

        // Auto-complete any in-progress appointment first
        List<Appointment> appointments = appointmentRepository
                .findByDoctorIdAndDateForDashboard(doctorId, LocalDate.now());
        boolean hasInProgress = appointments.stream()
                .anyMatch(a -> a.getStatus() == AppointmentStatus.IN_PROGRESS);
        if (hasInProgress) {
            throw new BadRequestException("Complete the current consultation before calling another patient");
        }

        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.IN_PROGRESS);
        appointmentRepository.save(appointment);

        audit(userId, "CALL_PATIENT", "APPOINTMENT", appointmentId,
                Map.of("oldStatus", oldStatus.name()),
                Map.of("newStatus", AppointmentStatus.IN_PROGRESS.name()));
        log.info("Doctor {} called specific patient (appointment {})", doctorId, appointmentId);
    }

    /**
     * Complete current consultation.
     */
    @Transactional
    public void completeConsultation(Long doctorId, Long appointmentId, Long userId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        validateDoctorOwnership(appointment, doctorId);

        if (appointment.getStatus() != AppointmentStatus.IN_PROGRESS) {
            throw new BadRequestException("Only in-progress appointments can be completed. Current status: " + appointment.getStatus());
        }

        if (appointment.getDiagnosis() == null || appointment.getDiagnosis().isBlank()) {
            throw new BadRequestException("Please add diagnosis and finalize in Consultation before completing.");
        }

        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);

        audit(userId, "COMPLETE_CONSULTATION", "APPOINTMENT", appointmentId,
                Map.of("oldStatus", oldStatus.name()),
                Map.of("newStatus", AppointmentStatus.COMPLETED.name()));
        log.info("Doctor {} completed consultation (appointment {})", doctorId, appointmentId);
    }

    /**
     * Skip a patient (require reason).
     */
    @Transactional
    public void skipPatient(Long doctorId, Long appointmentId, String reason, Long userId) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new BadRequestException("Reason is required to skip a patient");
        }

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        validateDoctorOwnership(appointment, doctorId);

        if (appointment.getStatus() != AppointmentStatus.CHECKED_IN) {
            throw new BadRequestException("Only checked-in patients can be skipped");
        }

        // Move to end of queue by assigning highest queue number + 1
        Integer maxQueue = appointmentRepository.getMaxQueueNumber(doctorId, LocalDate.now());
        appointment.setQueueNumber(maxQueue + 1);
        appointmentRepository.save(appointment);

        audit(userId, "SKIP_PATIENT", "APPOINTMENT", appointmentId,
                Map.of("reason", reason),
                Map.of("newQueueNumber", maxQueue + 1));
        log.info("Doctor {} skipped patient (appointment {}) reason: {}", doctorId, appointmentId, reason);
    }

    /**
     * Mark patient as no-show (reason required for audit).
     */
    @Transactional
    public void markNoShow(Long doctorId, Long appointmentId, String reason, Long userId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        validateDoctorOwnership(appointment, doctorId);

        if (appointment.getStatus() == AppointmentStatus.COMPLETED
                || appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Cannot mark completed or cancelled appointment as no-show");
        }

        if (appointment.getCheckedInAt() == null) {
            throw new BadRequestException("Patient has not checked in. No-show only applies to checked-in patients.");
        }
        long waitMinutes = ChronoUnit.MINUTES.between(appointment.getCheckedInAt(), LocalDateTime.now());
        if (waitMinutes < NO_SHOW_MIN_WAIT_MINUTES) {
            throw new BadRequestException("No-show only allowed after patient has waited at least "
                    + NO_SHOW_MIN_WAIT_MINUTES + " minutes (policy). Current wait: " + waitMinutes + " min.");
        }

        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.NO_SHOW);
        appointmentRepository.save(appointment);

        Map<String, Object> newValues = new HashMap<>();
        newValues.put("newStatus", AppointmentStatus.NO_SHOW.name());
        newValues.put("reason", reason);

        audit(userId, "MARK_NO_SHOW", "APPOINTMENT", appointmentId,
                Map.of("oldStatus", oldStatus.name()),
                newValues);
        log.info("Doctor {} marked no-show (appointment {}) reason: {}", doctorId, appointmentId, reason);
    }

    /**
     * Change doctor availability status.
     */
    @Transactional
    public void changeDoctorStatus(Long doctorId, String newStatus, Long userId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        DoctorQueueStatus oldQueueStatus = doctor.getQueueStatus();
        DoctorQueueStatus newQueueStatus;
        boolean newAvailable;
        switch (newStatus.toUpperCase()) {
            case "AVAILABLE":
                newQueueStatus = DoctorQueueStatus.AVAILABLE;
                newAvailable = true;
                break;
            case "ON_BREAK":
                newQueueStatus = DoctorQueueStatus.ON_BREAK;
                newAvailable = false;
                break;
            case "OFFLINE":
                newQueueStatus = DoctorQueueStatus.OFFLINE;
                newAvailable = false;
                break;
            default:
                throw new BadRequestException("Invalid status: " + newStatus + ". Use AVAILABLE, ON_BREAK, or OFFLINE");
        }

        doctor.setQueueStatus(newQueueStatus);
        doctor.setIsAvailable(newAvailable);
        doctorRepository.save(doctor);

        audit(userId, "CHANGE_STATUS", "DOCTOR", doctorId,
                Map.of("oldStatus", oldQueueStatus != null ? oldQueueStatus.name() : "null"),
                Map.of("newStatus", newQueueStatus.name(), "isAvailable", newAvailable));
        log.info("Doctor {} status changed to {}", doctorId, newStatus);
    }

    /**
     * Reorder queue (doctor-initiated). Reason required for audit.
     */
    @Transactional
    public void reorderQueue(Long doctorId, ReorderQueueDTO dto, Long userId) {
        if (dto.getReason() == null || dto.getReason().trim().isEmpty()) {
            throw new BadRequestException("Reason is required for queue reorder");
        }
        LocalDate today = LocalDate.now();
        List<Appointment> waiting = appointmentRepository.findQueuedByDoctorAndDate(
                doctorId, today, List.of(AppointmentStatus.CHECKED_IN));
        Set<Long> waitingIds = waiting.stream().map(Appointment::getId).collect(Collectors.toSet());
        for (Long id : dto.getOrderedAppointmentIds()) {
            if (!waitingIds.contains(id)) {
                throw new BadRequestException("Appointment " + id + " is not in your CHECKED_IN queue");
            }
        }
        Map<Long, Appointment> appointmentMap = waiting.stream().collect(Collectors.toMap(Appointment::getId, a -> a));
        List<Integer> existingQueueNumbers = waiting.stream()
                .map(Appointment::getQueueNumber)
                .filter(Objects::nonNull)
                .sorted()
                .toList();
        for (int i = 0; i < dto.getOrderedAppointmentIds().size(); i++) {
            Long apptId = dto.getOrderedAppointmentIds().get(i);
            Appointment appt = appointmentMap.get(apptId);
            if (appt != null) {
                Integer oldQueue = appt.getQueueNumber();
                Integer newQueue = i < existingQueueNumbers.size() ? existingQueueNumbers.get(i) : oldQueue;
                appt.setQueueNumber(newQueue);
                AppointmentHistory history = AppointmentHistory.builder()
                        .appointment(appt)
                        .action("QUEUE_REORDER")
                        .oldStatus(appt.getStatus())
                        .newStatus(appt.getStatus())
                        .changedByUserId(userId)
                        .changedByRole("DOCTOR")
                        .reason(dto.getReason().trim() + " | Old queue#: " + oldQueue + " → New queue#: " + newQueue)
                        .changedAt(LocalDateTime.now())
                        .build();
                appt.addHistory(history);
                appointmentRepository.save(appt);
            }
        }
        audit(userId, "REORDER_QUEUE", "APPOINTMENT", null,
                Map.of("doctorId", doctorId, "reason", dto.getReason().trim()),
                Map.of("orderedIds", dto.getOrderedAppointmentIds()));
        log.info("Doctor {} reordered queue, {} appointments", doctorId, dto.getOrderedAppointmentIds().size());
    }

    /**
     * Send current appointment to reception (e.g. request follow-up, paperwork).
     * Creates audit and optional notification for reception.
     */
    @Transactional
    public void sendToReception(Long doctorId, Long appointmentId, String message, Long userId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
        validateDoctorOwnership(appointment, doctorId);
        if (appointment.getStatus() != AppointmentStatus.IN_PROGRESS && appointment.getStatus() != AppointmentStatus.CHECKED_IN) {
            throw new BadRequestException("Only in-progress or checked-in appointments can be sent to reception");
        }
        audit(userId, "SEND_TO_RECEPTION", "APPOINTMENT", appointmentId,
                Map.of(),
                Map.of("message", message != null ? message : ""));
        log.info("Doctor {} sent appointment {} to reception: {}", doctorId, appointmentId, message);
    }

    // =========================================================================
    // PRIVATE BUILDERS
    // =========================================================================

    private static String mapDoctorStatus(DoctorQueueStatus status) {
        if (status == null) return "OFFLINE";
        switch (status) {
            case AVAILABLE:
            case BUSY:
                return "AVAILABLE";
            case ON_BREAK:
                return "ON_BREAK";
            case OFFLINE:
            default:
                return "OFFLINE";
        }
    }

    private CurrentPatient buildCurrentPatient(List<Appointment> appointments) {
        Appointment current = appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.IN_PROGRESS)
                .findFirst()
                .orElse(null);

        if (current == null) return null;

        String patientName = null;
        Integer age = null;
        String gender = null;
        String allergies = null;
        String medicalHistory = null;
        try {
            patientName = current.getPatient().getUser().getFullName();
            if (current.getPatient().getDateOfBirth() != null) {
                age = Period.between(current.getPatient().getDateOfBirth(), LocalDate.now()).getYears();
            }
            gender = current.getPatient().getGender();
            allergies = current.getPatient().getAllergies();
            medicalHistory = current.getPatient().getMedicalHistory();
        } catch (Exception e) {
            log.warn("Could not load patient details for appointment {}", current.getId());
        }

        // Calculate elapsed seconds from when status changed to IN_PROGRESS
        LocalTime startedAt = current.getStartTime();
        long elapsedSeconds = 0;
        if (current.getUpdatedAt() != null) {
            startedAt = current.getUpdatedAt().toLocalTime();
            elapsedSeconds = ChronoUnit.SECONDS.between(current.getUpdatedAt(), LocalDateTime.now());
        }

        boolean hasDiagnosis = current.getDiagnosis() != null && !current.getDiagnosis().isBlank();
        MedicalRecord mr = medicalRecordRepository.findByAppointmentId(current.getId()).orElse(null);
        boolean hasFinalizedRecord = mr != null;
        Long medicalRecordId = hasFinalizedRecord ? mr.getId() : null;

        return CurrentPatient.builder()
                .appointmentId(current.getId())
                .appointmentCode(current.getAppointmentCode())
                .queueNumber(current.getQueueNumber())
                .patientName(patientName)
                .age(age)
                .gender(gender)
                .allergies(allergies)
                .medicalHistory(medicalHistory)
                .reasonForVisit(current.getReasonForVisit())
                .startedAt(startedAt)
                .elapsedSeconds(Math.max(0, elapsedSeconds))
                .scheduledStart(current.getStartTime())
                .scheduledEnd(current.getEndTime())
                .canComplete(hasDiagnosis)
                .hasFinalizedRecord(hasFinalizedRecord)
                .medicalRecordId(medicalRecordId)
                .build();
    }

    private List<QueueItem> buildWaitingQueue(List<Appointment> appointments) {
        LocalDateTime now = LocalDateTime.now();

        return appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN)
                .sorted(Comparator.comparing(a -> a.getQueueNumber() != null ? a.getQueueNumber() : Integer.MAX_VALUE))
                .map(a -> {
                    long waitMinutes = 0;
                    if (a.getCheckedInAt() != null) {
                        waitMinutes = ChronoUnit.MINUTES.between(a.getCheckedInAt(), now);
                    }

                    String waitLevel = "NORMAL";
                    if (waitMinutes > 30) waitLevel = "CRITICAL";
                    else if (waitMinutes > 20) waitLevel = "WARNING";

                    String patientName = null;
                    Integer age = null;
                    try {
                        patientName = a.getPatient().getUser().getFullName();
                        if (a.getPatient().getDateOfBirth() != null) {
                            age = Period.between(a.getPatient().getDateOfBirth(), LocalDate.now()).getYears();
                        }
                    } catch (Exception e) {
                        log.warn("Could not load patient for appointment {}", a.getId());
                    }

                    return QueueItem.builder()
                            .appointmentId(a.getId())
                            .appointmentCode(a.getAppointmentCode())
                            .queueNumber(a.getQueueNumber())
                            .patientName(patientName)
                            .age(age)
                            .appointmentTime(a.getStartTime())
                            .checkedInAt(a.getCheckedInAt())
                            .waitMinutes(Math.max(0, waitMinutes))
                            .status(a.getStatus().name())
                            .isEmergency("EMERGENCY".equalsIgnoreCase(a.getAppointmentType()))
                            .waitLevel(waitLevel)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<TimelineItem> buildTimeline(List<Appointment> appointments, LocalTime now) {
        // Find the first upcoming appointment
        Long nextAppointmentId = appointments.stream()
                .filter(a -> a.getStartTime().isAfter(now))
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED
                        && a.getStatus() != AppointmentStatus.NO_SHOW)
                .sorted(Comparator.comparing(Appointment::getStartTime))
                .map(Appointment::getId)
                .findFirst()
                .orElse(null);

        return appointments.stream()
                .sorted(Comparator.comparing(Appointment::getStartTime)
                        .thenComparing(a -> a.getQueueNumber() != null ? a.getQueueNumber() : Integer.MAX_VALUE))
                .map(a -> {
                    boolean isCurrent = !now.isBefore(a.getStartTime()) && now.isBefore(a.getEndTime());

                    String patientName = null;
                    Integer age = null;
                    try {
                        patientName = a.getPatient().getUser().getFullName();
                        if (a.getPatient().getDateOfBirth() != null) {
                            age = Period.between(a.getPatient().getDateOfBirth(), LocalDate.now()).getYears();
                        }
                    } catch (Exception e) {
                        log.warn("Could not load patient for timeline appointment {}", a.getId());
                    }

                    return TimelineItem.builder()
                            .appointmentId(a.getId())
                            .appointmentCode(a.getAppointmentCode())
                            .queueNumber(a.getQueueNumber())
                            .patientName(patientName)
                            .age(age)
                            .startTime(a.getStartTime())
                            .endTime(a.getEndTime())
                            .status(a.getStatus().name())
                            .statusLabel(getStatusLabel(a.getStatus()))
                            .statusColor(getStatusColor(a.getStatus()))
                            .isCurrentSlot(isCurrent)
                            .isNextSlot(a.getId().equals(nextAppointmentId))
                            .reasonForVisit(a.getReasonForVisit())
                            .needsFollowUp(hasFollowUp(a))
                            .build();
                })
                .collect(Collectors.toList());
    }

    private QueueSummary buildSummary(List<Appointment> appointments) {
        return QueueSummary.builder()
                .totalToday((long) appointments.size())
                .waiting(countByStatus(appointments, AppointmentStatus.CHECKED_IN))
                .completed(countByStatus(appointments, AppointmentStatus.COMPLETED))
                .noShow(countByStatus(appointments, AppointmentStatus.NO_SHOW))
                .cancelled(countByStatus(appointments, AppointmentStatus.CANCELLED))
                .notCheckedIn(countByStatus(appointments, AppointmentStatus.CONFIRMED)
                        + countByStatus(appointments, AppointmentStatus.PENDING))
                .inProgress(countByStatus(appointments, AppointmentStatus.IN_PROGRESS))
                .build();
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private void validateDoctorOwnership(Appointment appointment, Long doctorId) {
        if (!appointment.getDoctor().getId().equals(doctorId)) {
            throw new BadRequestException("This appointment does not belong to you");
        }
    }

    private void audit(Long userId, String action, String entityType, Long entityId,
                       Map<String, Object> oldValues, Map<String, Object> newValues) {
        User user = userRepository.findById(userId).orElse(null);
        Map<String, Object> oldMap = oldValues == null ? new HashMap<>() : new HashMap<>(oldValues);
        Map<String, Object> newMap = newValues == null ? new HashMap<>() : new HashMap<>(newValues);
        String oldJson;
        String newJson;
        try {
            oldJson = objectMapper.writeValueAsString(oldMap);
            newJson = objectMapper.writeValueAsString(newMap);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize audit payload, skipping audit log", e);
            return;
        }
        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValues(oldJson)
                .newValues(newJson)
                .build();
        auditLogRepository.save(auditLog);
    }

    private boolean hasFollowUp(Appointment a) {
        if (a.getFollowUpRecommendations() != null && !a.getFollowUpRecommendations().isBlank()) {
            return true;
        }
        return medicalRecordRepository.findByAppointmentId(a.getId())
                .map(mr -> mr.getFollowUpDate() != null)
                .orElse(false);
    }

    private Long countByStatus(List<Appointment> appointments, AppointmentStatus status) {
        return appointments.stream()
                .filter(a -> a.getStatus() == status)
                .count();
    }

    private String getStatusLabel(AppointmentStatus status) {
        switch (status) {
            case PENDING: return "Pending";
            case SCHEDULED: return "Scheduled";
            case CONFIRMED: return "Confirmed";
            case CHECKED_IN: return "Checked In";
            case IN_PROGRESS: return "In Progress";
            case COMPLETED: return "Completed";
            case CANCELLED: return "Cancelled";
            case NO_SHOW: return "No Show";
            case RESCHEDULED: return "Rescheduled";
            default: return status.name();
        }
    }

    private String getStatusColor(AppointmentStatus status) {
        switch (status) {
            case COMPLETED: return "green";
            case IN_PROGRESS: return "blue";
            case CHECKED_IN: return "yellow";
            case CONFIRMED: return "indigo";
            case PENDING: return "gray";
            case NO_SHOW: return "red";
            case CANCELLED: return "red";
            case RESCHEDULED: return "orange";
            default: return "gray";
        }
    }
}
