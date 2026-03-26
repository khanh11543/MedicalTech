package com.q2k.meditech.service;

import com.q2k.meditech.dto.receptionist.*;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.AppointmentHistory;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.BookedBy;
import com.q2k.meditech.entity.enums.DoctorQueueStatus;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of QueueManagementService.
 * Handles all queue operations for the receptionist Queue Management tab.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QueueManagementServiceImpl implements QueueManagementService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentService appointmentService;
    private final PrivacyMaskingService privacyMaskingService;

    // Queue-related audit action constants
    private static final List<String> QUEUE_AUDIT_ACTIONS = List.of(
            "QUEUE_CALL", "QUEUE_REORDER", "QUEUE_MOVE", "QUEUE_NO_SHOW",
            "QUEUE_WALK_IN", "DOCTOR_STATUS_CHANGE", "STARTED_CONSULTATION",
            "CHECKED_IN", "MARKED_NO_SHOW"
    );

    private static final List<AppointmentStatus> QUEUE_STATUSES =
            List.of(AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_PROGRESS);

    // ==================== VIEW MODES ====================

    @Override
    @Transactional(readOnly = true)
    public List<DoctorQueueStatusDTO> getQueueByDoctor() {
        LocalDate today = LocalDate.now();
        log.info("Getting detailed queue by doctor for today");

        List<Doctor> doctors = doctorRepository.findDoctorsWithAppointmentsOnDate(today);
        return doctors.stream()
                .map(doctor -> buildDoctorQueueStatus(doctor, today, true))
                .sorted(Comparator.comparing(DoctorQueueStatusDTO::getDoctorName))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorQueueStatusDTO> getQueueByRoom() {
        LocalDate today = LocalDate.now();
        log.info("Getting queue by room for today");

        List<Doctor> doctors = doctorRepository.findDoctorsWithAppointmentsOnDate(today);
        return doctors.stream()
                .filter(d -> {
                    String roomNumber = d.getRoom() != null ? d.getRoom().getRoomNumber() : d.getCurrentRoom();
                    return roomNumber != null && !roomNumber.isBlank();
                })
                .map(doctor -> buildDoctorQueueStatus(doctor, today, true))
                .sorted(Comparator.comparing(dto -> dto.getRoomNumber() != null ? dto.getRoomNumber() : "ZZZ"))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QueuePatientDTO> getAllQueuedPatients(String sortBy, String sortDir) {
        LocalDate today = LocalDate.now();
        log.info("Getting all queued patients for today, sort: {} {}", sortBy, sortDir);

        List<Appointment> queued = appointmentRepository.findAllQueuedByDate(today, QUEUE_STATUSES);

        List<QueuePatientDTO> patients = queued.stream()
                .map(a -> mapToQueuePatient(a, true))
                .collect(Collectors.toList());

        // Sort
        Comparator<QueuePatientDTO> comparator = switch (sortBy != null ? sortBy : "queueNumber") {
            case "waitTime" -> Comparator.comparing(
                    QueuePatientDTO::getWaitTimeMinutes, Comparator.nullsLast(Comparator.naturalOrder()));
            case "doctorName" -> Comparator.comparing(
                    QueuePatientDTO::getDoctorName, Comparator.nullsLast(Comparator.naturalOrder()));
            case "appointmentTime" -> Comparator.comparing(
                    QueuePatientDTO::getAppointmentTime, Comparator.nullsLast(Comparator.naturalOrder()));
            default -> Comparator.comparing(
                    QueuePatientDTO::getQueueNumber, Comparator.nullsLast(Comparator.naturalOrder()));
        };

        if ("DESC".equalsIgnoreCase(sortDir)) {
            comparator = comparator.reversed();
        }

        patients.sort(comparator);
        return patients;
    }

    // ==================== DOCTOR STATUS ====================

    @Override
    @Transactional
    public DoctorQueueStatusDTO updateDoctorStatus(Long doctorId, UpdateDoctorStatusDTO dto, Long receptionistUserId) {
        log.info("Updating doctor {} status to {} by userId {}", doctorId, dto.getStatus(), receptionistUserId);

        Doctor doctor = doctorRepository.findByIdWithUser(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found: " + doctorId));

        DoctorQueueStatus oldStatus = doctor.getQueueStatus();
        doctor.setQueueStatus(dto.getStatus());

        // Update isAvailable for backward compatibility
        doctor.setIsAvailable(dto.getStatus() == DoctorQueueStatus.AVAILABLE
                || dto.getStatus() == DoctorQueueStatus.BUSY);

        if (dto.getRoomNumber() != null) {
            doctor.setCurrentRoom(dto.getRoomNumber());
        }

        doctorRepository.save(doctor);

        // Audit: log status change via a synthetic history entry on the first appointment
        logDoctorStatusChange(doctorId, oldStatus, dto.getStatus(), dto.getReason(), receptionistUserId);

        return buildDoctorQueueStatus(doctor, LocalDate.now(), false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorQueueStatusDTO> getDoctorsList() {
        LocalDate today = LocalDate.now();
        log.info("Getting doctors list with queue status for today");

        List<Doctor> doctors = doctorRepository.findDoctorsWithAppointmentsOnDate(today);
        return doctors.stream()
                .map(doctor -> buildDoctorQueueStatus(doctor, today, false))
                .sorted(Comparator.comparing(DoctorQueueStatusDTO::getDoctorName))
                .toList();
    }

    // ==================== QUEUE OPERATIONS ====================

    @Override
    @Transactional
    public DoctorQueueStatusDTO reorderQueue(Long doctorId, ReorderQueueDTO dto, Long receptionistUserId) {
        LocalDate today = LocalDate.now();
        log.info("Reordering queue for doctor {} - {} appointments, reason: {}",
                doctorId, dto.getOrderedAppointmentIds().size(), dto.getReason());

        Doctor doctor = doctorRepository.findByIdWithUser(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found: " + doctorId));

        // Fetch all CHECKED_IN appointments for this doctor
        List<Appointment> waiting = appointmentRepository.findQueuedByDoctorAndDate(
                doctorId, today, List.of(AppointmentStatus.CHECKED_IN));

        // Validate all IDs belong to this doctor's CHECKED_IN queue
        Set<Long> waitingIds = waiting.stream().map(Appointment::getId).collect(Collectors.toSet());
        for (Long id : dto.getOrderedAppointmentIds()) {
            if (!waitingIds.contains(id)) {
                throw new RuntimeException("Appointment " + id + " is not in this doctor's CHECKED_IN queue");
            }
        }

        // Build lookup map
        Map<Long, Appointment> appointmentMap = waiting.stream()
                .collect(Collectors.toMap(Appointment::getId, a -> a));

        // Reassign queue numbers based on new order
        // We use the existing queue number range to keep ordering clean
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

                // Add history
                AppointmentHistory history = AppointmentHistory.builder()
                        .appointment(appt)
                        .action("QUEUE_REORDER")
                        .oldStatus(appt.getStatus())
                        .newStatus(appt.getStatus())
                        .changedByUserId(receptionistUserId)
                        .changedByRole("RECEPTIONIST")
                        .reason(dto.getReason() + " | Old queue#: " + oldQueue + " → New queue#: " + newQueue)
                        .changedAt(LocalDateTime.now())
                        .build();
                appt.addHistory(history);
                appointmentRepository.save(appt);
            }
        }

        return buildDoctorQueueStatus(doctor, today, true);
    }

    @Override
    @Transactional
    public QueueCallResultDTO addWalkIn(Long doctorId, AddWalkInDTO dto, Long receptionistUserId) {
        LocalDate today = LocalDate.now();
        log.info("Adding walk-in patient {} to doctor {} queue", dto.getPatientId(), doctorId);

        Doctor doctor = doctorRepository.findByIdWithUser(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found: " + doctorId));

        // §6 Walk-in Policy + §10 Emergency Policy:
        // Urgent/emergency walk-ins go to FRONT of queue (position 1),
        // regular walk-ins go to the END of queue.
        int assignedQueueNumber;
        if (dto.isUrgent()) {
            // Shift all existing CHECKED_IN patients down by 1
            List<Appointment> existingWaiting = appointmentRepository.findQueuedByDoctorAndDate(
                    doctorId, today, List.of(AppointmentStatus.CHECKED_IN));
            for (Appointment existing : existingWaiting) {
                if (existing.getQueueNumber() != null) {
                    existing.setQueueNumber(existing.getQueueNumber() + 1);
                    appointmentRepository.save(existing);
                }
            }
            // Also shift IN_PROGRESS queue numbers to keep ordering consistent
            List<Appointment> inProgress = appointmentRepository.findQueuedByDoctorAndDate(
                    doctorId, today, List.of(AppointmentStatus.IN_PROGRESS));
            for (Appointment ip : inProgress) {
                if (ip.getQueueNumber() != null) {
                    ip.setQueueNumber(ip.getQueueNumber() + 1);
                    appointmentRepository.save(ip);
                }
            }
            assignedQueueNumber = 1;
        } else {
            Integer maxQueue = appointmentRepository.getMaxQueueNumber(doctorId, today);
            assignedQueueNumber = maxQueue + 1;
        }

        // Determine time slot
        LocalTime startTime = dto.getPreferredTime() != null ? dto.getPreferredTime() : LocalTime.now();
        LocalTime endTime = startTime.plusMinutes(30);

        // Create patient reference
        Patient patientRef = new Patient();
        patientRef.setId(dto.getPatientId());

        // Create appointment directly with CHECKED_IN status
        Appointment appointment = Appointment.builder()
                .patient(patientRef)
                .doctor(doctor)
                .appointmentDate(today)
                .startTime(startTime)
                .endTime(endTime)
                .status(AppointmentStatus.CHECKED_IN)
                .appointmentCode(generateAppointmentCode())
                .bookedBy(BookedBy.RECEPTIONIST)
                .queueNumber(assignedQueueNumber)
                .reasonForVisit(dto.getReasonForVisit())
                .notes(dto.getNote())
                .checkedInAt(LocalDateTime.now())
                .build();

        // Add history
        AppointmentHistory history = AppointmentHistory.builder()
                .appointment(appointment)
                .action("QUEUE_WALK_IN")
                .newStatus(AppointmentStatus.CHECKED_IN)
                .changedByUserId(receptionistUserId)
                .changedByRole("RECEPTIONIST")
                .reason("Walk-in patient added to queue"
                        + (dto.isUrgent() ? " [URGENT/EMERGENCY - Priority #1]" : ""))
                .changedAt(LocalDateTime.now())
                .build();
        appointment.addHistory(history);

        Appointment saved = appointmentRepository.save(appointment);

        // Reload with details
        saved = appointmentRepository.findByIdWithDetails(saved.getId()).orElse(saved);

        // Count remaining CHECKED_IN
        int remaining = (int) appointmentRepository.findQueuedByDoctorAndDate(
                doctorId, today, List.of(AppointmentStatus.CHECKED_IN)).stream().count();

        return QueueCallResultDTO.builder()
                .success(true)
                .message(dto.isUrgent()
                        ? "URGENT walk-in added to FRONT of queue #" + assignedQueueNumber
                        : "Walk-in patient added to queue #" + assignedQueueNumber)
                .appointmentId(saved.getId())
                .appointmentCode(saved.getAppointmentCode())
                .patientName(getPatientName(saved))
                .maskedPhone(privacyMaskingService.maskPhone(getPatientPhone(saved)))
                .queueNumber(assignedQueueNumber)
                .startTime(startTime)
                .newStatus(AppointmentStatus.CHECKED_IN)
                .remainingInQueue(remaining)
                .roomNumber(doctor.getRoom() != null ? doctor.getRoom().getRoomNumber() : doctor.getCurrentRoom())
                .build();
    }

    @Override
    @Transactional
    public QueueCallResultDTO moveDoctor(MoveDoctorDTO dto, Long receptionistUserId) {
        log.info("Moving appointment {} to doctor {}, reason: {}",
                dto.getAppointmentId(), dto.getToDoctorId(), dto.getReason());

        Appointment appointment = appointmentRepository.findByIdWithDetails(dto.getAppointmentId())
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + dto.getAppointmentId()));

        if (appointment.getStatus() != AppointmentStatus.CHECKED_IN) {
            throw new RuntimeException("Can only move CHECKED_IN appointments. Current status: " + appointment.getStatus());
        }

        Doctor fromDoctor = appointment.getDoctor();
        Doctor toDoctor = doctorRepository.findByIdWithUser(dto.getToDoctorId())
                .orElseThrow(() -> new RuntimeException("Target doctor not found: " + dto.getToDoctorId()));

        if (fromDoctor.getId().equals(toDoctor.getId())) {
            throw new RuntimeException("Source and target doctor are the same");
        }

        // Get new queue number in target doctor's queue
        LocalDate today = LocalDate.now();
        Integer maxQueue = appointmentRepository.getMaxQueueNumber(toDoctor.getId(), today);
        int newQueueNumber = maxQueue + 1;

        Integer oldQueueNumber = appointment.getQueueNumber();

        // Update appointment
        appointment.setDoctor(toDoctor);
        appointment.setQueueNumber(newQueueNumber);

        // Audit history
        AppointmentHistory history = AppointmentHistory.builder()
                .appointment(appointment)
                .action("QUEUE_MOVE")
                .oldStatus(appointment.getStatus())
                .newStatus(appointment.getStatus())
                .changedByUserId(receptionistUserId)
                .changedByRole("RECEPTIONIST")
                .reason(dto.getReason() + " | From Dr." + fromDoctor.getFullName()
                        + " (Q#" + oldQueueNumber + ") → Dr." + toDoctor.getFullName()
                        + " (Q#" + newQueueNumber + ")")
                .changedAt(LocalDateTime.now())
                .build();
        appointment.addHistory(history);
        appointmentRepository.save(appointment);

        // Count remaining in new doctor queue
        int remaining = (int) appointmentRepository.findQueuedByDoctorAndDate(
                toDoctor.getId(), today, List.of(AppointmentStatus.CHECKED_IN)).stream().count();

        return QueueCallResultDTO.builder()
                .success(true)
                .message("Patient moved to Dr. " + toDoctor.getFullName() + " queue #" + newQueueNumber)
                .appointmentId(appointment.getId())
                .appointmentCode(appointment.getAppointmentCode())
                .patientName(getPatientName(appointment))
                .maskedPhone(privacyMaskingService.maskPhone(getPatientPhone(appointment)))
                .queueNumber(newQueueNumber)
                .startTime(appointment.getStartTime())
                .newStatus(appointment.getStatus())
                .remainingInQueue(remaining)
                .roomNumber(toDoctor.getCurrentRoom())
                .build();
    }

    // ==================== CALL NEXT (ENHANCED) ====================

    @Override
    @Transactional
    public QueueCallResultDTO callNextPatient(Long doctorId, CallNextDTO dto, Long receptionistUserId) {
        LocalDate today = LocalDate.now();
        log.info("Enhanced call-next for doctor {} by receptionist {}", doctorId, receptionistUserId);

        Doctor doctor = doctorRepository.findByIdWithUser(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found: " + doctorId));

        // §2 Call-Next Policy: Doctor must be AVAILABLE or BUSY
        if (doctor.getQueueStatus() == DoctorQueueStatus.ON_BREAK) {
            throw new RuntimeException("Cannot call next patient: Doctor is currently ON BREAK. Please change doctor status to AVAILABLE first.");
        }
        if (doctor.getQueueStatus() == DoctorQueueStatus.OFFLINE) {
            throw new RuntimeException("Cannot call next patient: Doctor is OFFLINE. Please change doctor status to AVAILABLE first.");
        }

        List<Appointment> waiting = appointmentRepository.findQueuedByDoctorAndDate(
                doctorId, today, List.of(AppointmentStatus.CHECKED_IN));

        // Find the next patient
        Optional<Appointment> nextPatient;
        if (dto != null && dto.getQueueNumber() != null) {
            nextPatient = waiting.stream()
                    .filter(a -> a.getQueueNumber() != null && a.getQueueNumber().equals(dto.getQueueNumber()))
                    .findFirst();
        } else {
            nextPatient = waiting.stream()
                    .filter(a -> a.getQueueNumber() != null)
                    .min(Comparator.comparing(Appointment::getQueueNumber));
        }

        if (nextPatient.isEmpty()) {
            return QueueCallResultDTO.builder()
                    .success(false)
                    .message("No patients waiting in queue for this doctor")
                    .remainingInQueue(0)
                    .build();
        }

        Appointment appointment = nextPatient.get();

        // Transition CHECKED_IN → IN_PROGRESS
        appointmentService.startConsultation(appointment.getId(), receptionistUserId, "RECEPTIONIST");

        // Auto-set doctor status to BUSY
        if (doctor.getQueueStatus() == DoctorQueueStatus.AVAILABLE) {
            doctor.setQueueStatus(DoctorQueueStatus.BUSY);
            doctorRepository.save(doctor);
        }

        // Add queue-specific audit
        String effectiveRoom = (dto != null && dto.getRoomNumber() != null)
                ? dto.getRoomNumber()
                : (doctor.getRoom() != null ? doctor.getRoom().getRoomNumber() : doctor.getCurrentRoom());
        AppointmentHistory callHistory = AppointmentHistory.builder()
                .appointment(appointment)
                .action("QUEUE_CALL")
                .oldStatus(AppointmentStatus.CHECKED_IN)
                .newStatus(AppointmentStatus.IN_PROGRESS)
                .changedByUserId(receptionistUserId)
                .changedByRole("RECEPTIONIST")
                .reason("Called to " + effectiveRoom
                        + " | Notify: " + (dto != null && dto.getNotifyMethod() != null ? dto.getNotifyMethod() : "DISPLAY"))
                .changedAt(LocalDateTime.now())
                .build();
        appointment.addHistory(callHistory);
        appointmentRepository.save(appointment);

        // Count remaining and find next queue
        int remaining = (int) waiting.stream()
                .filter(a -> !a.getId().equals(appointment.getId()))
                .count();

        Integer nextQueue = waiting.stream()
                .filter(a -> !a.getId().equals(appointment.getId()) && a.getQueueNumber() != null)
                .map(Appointment::getQueueNumber)
                .min(Integer::compareTo)
                .orElse(null);

        String roomNumber = effectiveRoom;
        String notifyMethod = (dto != null && dto.getNotifyMethod() != null)
                ? dto.getNotifyMethod() : "DISPLAY";

        return QueueCallResultDTO.builder()
                .success(true)
                .message("Patient called successfully")
                .appointmentId(appointment.getId())
                .appointmentCode(appointment.getAppointmentCode())
                .patientName(getPatientName(appointment))
                .maskedPhone(privacyMaskingService.maskPhone(getPatientPhone(appointment)))
                .queueNumber(appointment.getQueueNumber())
                .startTime(appointment.getStartTime())
                .newStatus(AppointmentStatus.IN_PROGRESS)
                .remainingInQueue(remaining)
                .nextQueueNumber(nextQueue)
                .roomNumber(roomNumber)
                .notifyMethod(notifyMethod)
                .build();
    }

    // ==================== DISPLAY ====================

    @Override
    @Transactional(readOnly = true)
    public List<QueueDisplayDTO> getPublicDisplay() {
        LocalDate today = LocalDate.now();
        log.info("Getting public queue display");

        List<Appointment> queued = appointmentRepository.findAllQueuedByDate(today, QUEUE_STATUSES);

        return queued.stream()
                .map(a -> QueueDisplayDTO.builder()
                        .queueNumber(a.getQueueNumber())
                        .roomNumber(a.getDoctor() != null ? a.getDoctor().getCurrentRoom() : null)
                        .status(a.getStatus() == AppointmentStatus.IN_PROGRESS ? "SERVING" : "WAITING")
                        .doctorId(a.getDoctor() != null ? a.getDoctor().getId() : null)
                        .specialization(a.getDoctor() != null ? a.getDoctor().getSpecialization() : null)
                        // PUBLIC: no patient name, no doctor name, no appointment code
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QueueDisplayDTO> getInternalDisplay() {
        LocalDate today = LocalDate.now();
        log.info("Getting internal staff queue display");

        List<Appointment> queued = appointmentRepository.findAllQueuedByDate(today, QUEUE_STATUSES);

        return queued.stream()
                .map(a -> QueueDisplayDTO.builder()
                        .queueNumber(a.getQueueNumber())
                        .roomNumber(a.getDoctor() != null ? a.getDoctor().getCurrentRoom() : null)
                        .status(a.getStatus() == AppointmentStatus.IN_PROGRESS ? "SERVING" : "WAITING")
                        .doctorId(a.getDoctor() != null ? a.getDoctor().getId() : null)
                        .doctorName(a.getDoctor() != null ? a.getDoctor().getFullName() : null)
                        .specialization(a.getDoctor() != null ? a.getDoctor().getSpecialization() : null)
                        // INTERNAL: includes patient name + appointment code
                        .patientName(getPatientName(a))
                        .appointmentCode(a.getAppointmentCode())
                        .build())
                .toList();
    }

    // ==================== AUDIT ====================

    @Override
    @Transactional(readOnly = true)
    public Page<QueueAuditDTO> getQueueAuditLog(int pageNumber, int pageSize) {
        LocalDate today = LocalDate.now();
        log.info("Getting queue audit log for today, page: {}", pageNumber);

        List<AppointmentHistory> events =
                appointmentRepository.findQueueAuditEvents(today, QUEUE_AUDIT_ACTIONS);

        List<QueueAuditDTO> audits = events.stream()
                .map(this::mapToQueueAudit)
                .toList();

        // Manual pagination
        int start = Math.min(pageNumber * pageSize, audits.size());
        int end = Math.min(start + pageSize, audits.size());
        List<QueueAuditDTO> pageContent = audits.subList(start, end);

        return new PageImpl<>(pageContent, PageRequest.of(pageNumber, pageSize), audits.size());
    }

    @Override
    @Transactional(readOnly = true)
    public List<QueueAuditDTO> getDoctorQueueHistory(Long doctorId) {
        LocalDate today = LocalDate.now();
        log.info("Getting queue history for doctor {} today", doctorId);

        List<AppointmentHistory> events =
                appointmentRepository.findQueueAuditEventsByDoctor(doctorId, today, QUEUE_AUDIT_ACTIONS);

        return events.stream()
                .map(this::mapToQueueAudit)
                .toList();
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Build a detailed DoctorQueueStatusDTO for a given doctor.
     *
     * @param includePatientList whether to populate waitingPatients list
     */
    private DoctorQueueStatusDTO buildDoctorQueueStatus(Doctor doctor, LocalDate date, boolean includePatientList) {
        List<Appointment> allToday = appointmentRepository.findByDoctorIdAndDate(doctor.getId(), date);

        int total = allToday.size();
        int checkedIn = (int) allToday.stream().filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN).count();
        int inProgress = (int) allToday.stream().filter(a -> a.getStatus() == AppointmentStatus.IN_PROGRESS).count();
        int completed = (int) allToday.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
        int noShow = (int) allToday.stream().filter(a -> a.getStatus() == AppointmentStatus.NO_SHOW).count();

        // Current = IN_PROGRESS with highest queue#
        Integer currentQueue = allToday.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.IN_PROGRESS && a.getQueueNumber() != null)
                .map(Appointment::getQueueNumber)
                .max(Integer::compareTo)
                .orElse(null);

        // Next = CHECKED_IN with lowest queue#
        Integer nextQueue = allToday.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN && a.getQueueNumber() != null)
                .map(Appointment::getQueueNumber)
                .min(Integer::compareTo)
                .orElse(null);

        Double estimatedWait = checkedIn > 0 ? checkedIn * 30.0 : 0.0;

        // Auto-derive doctorStatus from queue state if not explicitly set
        DoctorQueueStatus derivedStatus = doctor.getQueueStatus();
        if (derivedStatus == null || derivedStatus == DoctorQueueStatus.OFFLINE) {
            // If doctor has appointments today but status is OFFLINE, might still show
            derivedStatus = doctor.getQueueStatus() != null ? doctor.getQueueStatus() : DoctorQueueStatus.OFFLINE;
        }

        DoctorQueueStatusDTO.DoctorQueueStatusDTOBuilder builder = DoctorQueueStatusDTO.builder()
                .doctorId(doctor.getId())
                .doctorName(doctor.getFullName())
                .specialization(doctor.getSpecialization())
                .doctorStatus(derivedStatus)
                .roomNumber(doctor.getRoom() != null ? doctor.getRoom().getRoomNumber() : doctor.getCurrentRoom())
                .totalAppointmentsToday(total)
                .checkedInWaiting(checkedIn)
                .inProgress(inProgress)
                .completed(completed)
                .noShow(noShow)
                .currentQueueNumber(currentQueue)
                .nextQueueNumber(nextQueue)
                .estimatedWaitMinutes(estimatedWait);

        if (includePatientList) {
            // Build waiting list
            List<QueuePatientDTO> waitingList = allToday.stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN)
                    .sorted(Comparator.comparing(Appointment::getQueueNumber, Comparator.nullsLast(Comparator.naturalOrder())))
                    .map(a -> mapToQueuePatient(a, true))
                    .toList();
            builder.waitingPatients(waitingList);

            // Current patient
            allToday.stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.IN_PROGRESS)
                    .max(Comparator.comparing(Appointment::getQueueNumber, Comparator.nullsLast(Comparator.naturalOrder())))
                    .ifPresent(a -> builder.currentPatient(mapToQueuePatient(a, true)));
        }

        return builder.build();
    }

    /**
     * Map an Appointment to QueuePatientDTO.
     */
    private QueuePatientDTO mapToQueuePatient(Appointment a, boolean includeNames) {
        LocalTime checkedInTime = a.getCheckedInAt() != null ? a.getCheckedInAt().toLocalTime() : null;
        Long waitMinutes = a.getCheckedInAt() != null
                ? ChronoUnit.MINUTES.between(a.getCheckedInAt(), LocalDateTime.now())
                : null;

        String patientName = includeNames ? getPatientName(a) : null;
        String maskedPhone = privacyMaskingService.maskPhone(getPatientPhone(a));

        Integer age = null;
        String gender = null;
        if (a.getPatient() != null && a.getPatient().getUser() != null) {
            if (a.getPatient().getDateOfBirth() != null) {
                age = (int) ChronoUnit.YEARS.between(
                        a.getPatient().getDateOfBirth(), LocalDate.now());
            }
            gender = a.getPatient().getGender();
        }

        // §7 Wait-time alert level: NORMAL (<20min), WARNING (20-30min), CRITICAL (>30min)
        String waitTimeAlertLevel = "NORMAL";
        if (waitMinutes != null) {
            if (waitMinutes > 30) {
                waitTimeAlertLevel = "CRITICAL";
            } else if (waitMinutes > 20) {
                waitTimeAlertLevel = "WARNING";
            }
        }

        return QueuePatientDTO.builder()
                .appointmentId(a.getId())
                .appointmentCode(a.getAppointmentCode())
                .queueNumber(a.getQueueNumber())
                .patientId(a.getPatient() != null ? a.getPatient().getId() : null)
                .patientName(patientName)
                .maskedPhone(maskedPhone)
                .age(age)
                .gender(gender)
                .appointmentTime(a.getStartTime())
                .checkedInAt(checkedInTime)
                .waitTimeMinutes(waitMinutes)
                .status(a.getStatus())
                .reasonForVisit(a.getReasonForVisit())
                .waitTimeAlertLevel(waitTimeAlertLevel)
                .doctorId(a.getDoctor() != null ? a.getDoctor().getId() : null)
                .doctorName(a.getDoctor() != null ? a.getDoctor().getFullName() : null)
                .roomNumber(a.getDoctor() != null ? a.getDoctor().getCurrentRoom() : null)
                .build();
    }

    /**
     * Map AppointmentHistory to QueueAuditDTO.
     */
    private QueueAuditDTO mapToQueueAudit(AppointmentHistory h) {
        Appointment a = h.getAppointment();
        return QueueAuditDTO.builder()
                .id(h.getId())
                .eventType(h.getAction())
                .appointmentId(a != null ? a.getId() : null)
                .appointmentCode(a != null ? a.getAppointmentCode() : null)
                .queueNumber(a != null ? a.getQueueNumber() : null)
                .patientName(a != null ? getPatientName(a) : null)
                .doctorId(a != null && a.getDoctor() != null ? a.getDoctor().getId() : null)
                .doctorName(a != null && a.getDoctor() != null ? a.getDoctor().getFullName() : null)
                .performedByUserId(h.getChangedByUserId())
                .performedByName(h.getChangedByRole())
                .reason(h.getReason())
                .timestamp(h.getChangedAt())
                .build();
    }

    /**
     * Log a doctor status change as an audit event.
     */
    private void logDoctorStatusChange(Long doctorId, DoctorQueueStatus oldStatus,
                                        DoctorQueueStatus newStatus, String reason, Long userId) {
        LocalDate today = LocalDate.now();
        // Find any appointment for this doctor today to attach the history to
        List<Appointment> appts = appointmentRepository.findByDoctorIdAndDate(doctorId, today);
        if (!appts.isEmpty()) {
            Appointment first = appts.get(0);
            AppointmentHistory history = AppointmentHistory.builder()
                    .appointment(first)
                    .action("DOCTOR_STATUS_CHANGE")
                    .oldStatus(first.getStatus())
                    .newStatus(first.getStatus())
                    .changedByUserId(userId)
                    .changedByRole("RECEPTIONIST")
                    .reason("Doctor status: " + oldStatus + " → " + newStatus
                            + (reason != null ? " | " + reason : ""))
                    .changedAt(LocalDateTime.now())
                    .build();
            first.addHistory(history);
            appointmentRepository.save(first);
        }
    }

    private String getPatientName(Appointment a) {
        if (a.getPatient() != null && a.getPatient().getUser() != null) {
            return a.getPatient().getUser().getFullName();
        }
        return "N/A";
    }

    private String getPatientPhone(Appointment a) {
        if (a.getPatient() != null && a.getPatient().getUser() != null) {
            return a.getPatient().getUser().getPhone();
        }
        return null;
    }

    // masking is now handled by PrivacyMaskingService

    private String generateAppointmentCode() {
        return "WI-" + System.currentTimeMillis() % 1000000;
    }
}
