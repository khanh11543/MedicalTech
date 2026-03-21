package com.q2k.meditech.service;

import com.q2k.meditech.dto.AffectedAppointmentDTO;
import com.q2k.meditech.dto.TimeOffRequestDTO;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.TimeOffRequest;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.TimeOffStatus;
import com.q2k.meditech.entity.enums.TimeOffType;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.TimeOffRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimeOffRequestServiceImpl implements TimeOffRequestService {

    private static final Set<AppointmentStatus> HEAVY_STATUSES = EnumSet.of(
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.IN_PROGRESS
    );

    private final TimeOffRequestRepository timeOffRepo;
    private final AppointmentRepository appointmentRepo;
    private final DoctorRepository doctorRepo;

    // ----------------------------------------------------------------
    // PUBLIC API
    // ----------------------------------------------------------------

    @Override
    @Transactional
    public TimeOffRequestDTO create(Long doctorId, TimeOffRequestDTO dto) {
        validateRequest(dto);

        Doctor doctor = requireDoctor(doctorId);
        LocalDate date = LocalDate.parse(dto.getDate());
        LocalTime startTime = dto.getType() == TimeOffType.FULL_DAY ? null
                : LocalTime.parse(dto.getStartTime(), DateTimeFormatter.ofPattern("HH:mm"));
        LocalTime endTime = dto.getType() == TimeOffType.FULL_DAY ? null
                : LocalTime.parse(dto.getEndTime(), DateTimeFormatter.ofPattern("HH:mm"));

        List<Appointment> conflicts = findConflicts(doctorId, dto.getType(), date, startTime, endTime);
        boolean hasHeavy = conflicts.stream().anyMatch(a -> HEAVY_STATUSES.contains(a.getStatus()));

        TimeOffStatus status;
        if (hasHeavy) {
            // Heavy conflict (checked-in / in-progress): block, require admin
            status = TimeOffStatus.PENDING_REVIEW;
            log.warn("TimeOffRequest: heavy conflict for doctor {} on {} — {} active appointment(s) in CHECKED_IN/IN_PROGRESS",
                    doctorId, date, conflicts.size());
        } else if (!conflicts.isEmpty()) {
            // Soft conflict with CONFIRMED appointments
            status = TimeOffStatus.PENDING_REVIEW;
        } else {
            // No conflict → auto-approve
            status = TimeOffStatus.APPROVED;
        }

        TimeOffRequest entity = TimeOffRequest.builder()
                .doctor(doctor)
                .type(dto.getType())
                .date(date)
                .startTime(startTime)
                .endTime(endTime)
                .reason(dto.getReason())
                .notes(dto.getNotes())
                .status(status)
                .affectedAppointmentsCount(conflicts.size())
                .hasHeavyConflict(hasHeavy)
                .build();

        entity = timeOffRepo.save(entity);
        log.info("TimeOffRequest created id={} doctor={} date={} type={} status={}",
                entity.getId(), doctorId, date, dto.getType(), status);
        return toDTO(entity, buildAffectedList(conflicts));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeOffRequestDTO> list(Long doctorId) {
        return timeOffRepo.findByDoctorId(doctorId).stream()
                .map(e -> toDTO(e, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TimeOffRequestDTO getById(Long doctorId, Long requestId) {
        TimeOffRequest entity = requireOwned(doctorId, requestId);
        List<Appointment> conflicts = (entity.getStatus() == TimeOffStatus.PENDING_REVIEW)
                ? findConflicts(doctorId, entity.getType(), entity.getDate(),
                                entity.getStartTime(), entity.getEndTime())
                : List.of();
        return toDTO(entity, buildAffectedList(conflicts));
    }

    @Override
    @Transactional
    public TimeOffRequestDTO update(Long doctorId, Long requestId, TimeOffRequestDTO dto) {
        TimeOffRequest entity = requireOwned(doctorId, requestId);

        if (entity.getStatus() == TimeOffStatus.APPROVED) {
            // Allow editing only if not yet effective (date in future)
            if (!entity.getDate().isAfter(LocalDate.now())) {
                throw new BadRequestException(
                        "Cannot edit an approved request that is already effective. Create a new request instead.");
            }
        } else if (entity.getStatus() != TimeOffStatus.PENDING_REVIEW) {
            throw new BadRequestException("Only PENDING_REVIEW requests can be edited.");
        }

        validateRequest(dto);

        LocalDate date = LocalDate.parse(dto.getDate());
        LocalTime startTime = dto.getType() == TimeOffType.FULL_DAY ? null
                : LocalTime.parse(dto.getStartTime(), DateTimeFormatter.ofPattern("HH:mm"));
        LocalTime endTime = dto.getType() == TimeOffType.FULL_DAY ? null
                : LocalTime.parse(dto.getEndTime(), DateTimeFormatter.ofPattern("HH:mm"));

        List<Appointment> conflicts = findConflicts(doctorId, dto.getType(), date, startTime, endTime);
        boolean hasHeavy = conflicts.stream().anyMatch(a -> HEAVY_STATUSES.contains(a.getStatus()));

        entity.setType(dto.getType());
        entity.setDate(date);
        entity.setStartTime(startTime);
        entity.setEndTime(endTime);
        entity.setReason(dto.getReason());
        entity.setNotes(dto.getNotes());
        entity.setAffectedAppointmentsCount(conflicts.size());
        entity.setHasHeavyConflict(hasHeavy);
        entity.setStatus(conflicts.isEmpty() ? TimeOffStatus.APPROVED : TimeOffStatus.PENDING_REVIEW);

        entity = timeOffRepo.save(entity);
        return toDTO(entity, buildAffectedList(conflicts));
    }

    @Override
    @Transactional
    public TimeOffRequestDTO cancel(Long doctorId, Long requestId) {
        TimeOffRequest entity = requireOwned(doctorId, requestId);

        if (entity.getStatus() == TimeOffStatus.REJECTED ||
                entity.getStatus() == TimeOffStatus.CANCELLED) {
            throw new BadRequestException("Request is already " + entity.getStatus() + ".");
        }
        if (entity.getStatus() == TimeOffStatus.APPROVED &&
                !entity.getDate().isAfter(LocalDate.now())) {
            throw new BadRequestException(
                    "Cannot cancel an approved request that is already effective.");
        }

        entity.setStatus(TimeOffStatus.CANCELLED);
        entity = timeOffRepo.save(entity);
        log.info("TimeOffRequest id={} cancelled by doctor {}", requestId, doctorId);
        return toDTO(entity, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AffectedAppointmentDTO> getAffectedAppointments(Long doctorId, Long requestId) {
        TimeOffRequest entity = requireOwned(doctorId, requestId);
        List<Appointment> conflicts = findConflicts(doctorId, entity.getType(),
                entity.getDate(), entity.getStartTime(), entity.getEndTime());
        return buildAffectedList(conflicts);
    }

    // ----------------------------------------------------------------
    // PRIVATE HELPERS
    // ----------------------------------------------------------------

    private void validateRequest(TimeOffRequestDTO dto) {
        if (dto.getType() == null) throw new BadRequestException("Type is required");
        if (dto.getDate() == null || dto.getDate().isBlank()) throw new BadRequestException("Date is required");
        if (dto.getReason() == null || dto.getReason().isBlank()) throw new BadRequestException("Reason is required");

        if (dto.getType() != TimeOffType.FULL_DAY) {
            if (dto.getStartTime() == null || dto.getStartTime().isBlank())
                throw new BadRequestException("Start time is required for " + dto.getType());
            if (dto.getEndTime() == null || dto.getEndTime().isBlank())
                throw new BadRequestException("End time is required for " + dto.getType());

            LocalTime start = LocalTime.parse(dto.getStartTime(), DateTimeFormatter.ofPattern("HH:mm"));
            LocalTime end = LocalTime.parse(dto.getEndTime(), DateTimeFormatter.ofPattern("HH:mm"));
            if (!end.isAfter(start))
                throw new BadRequestException("End time must be after start time");
        }
    }

    private List<Appointment> findConflicts(Long doctorId, TimeOffType type,
                                             LocalDate date, LocalTime startTime, LocalTime endTime) {
        if (type == TimeOffType.FULL_DAY) {
            return appointmentRepo.findActiveAppointmentsByDoctorOnDate(doctorId, date);
        }
        return appointmentRepo.findActiveAppointmentsInTimeRange(doctorId, date, startTime, endTime);
    }

    private List<AffectedAppointmentDTO> buildAffectedList(List<Appointment> appointments) {
        if (appointments == null) return null;
        return appointments.stream().map(a -> {
            String patientName = "";
            try {
                patientName = a.getPatient().getUser().getFullName();
            } catch (Exception ignored) { }
            boolean heavy = HEAVY_STATUSES.contains(a.getStatus());
            return AffectedAppointmentDTO.builder()
                    .appointmentId(a.getId())
                    .patientName(patientName)
                    .appointmentDate(a.getAppointmentDate().toString())
                    .startTime(a.getStartTime() != null ? a.getStartTime().toString() : "")
                    .endTime(a.getEndTime() != null ? a.getEndTime().toString() : "")
                    .status(a.getStatus().name())
                    .heavyConflict(heavy)
                    .build();
        }).collect(Collectors.toList());
    }

    private TimeOffRequestDTO toDTO(TimeOffRequest e, List<AffectedAppointmentDTO> affected) {
        String docName = "";
        try { docName = e.getDoctor().getFullName(); } catch (Exception ignored) { }
        return TimeOffRequestDTO.builder()
                .id(e.getId())
                .doctorId(e.getDoctor().getId())
                .doctorName(docName)
                .type(e.getType())
                .date(e.getDate().toString())
                .startTime(e.getStartTime() != null ? e.getStartTime().toString() : null)
                .endTime(e.getEndTime() != null ? e.getEndTime().toString() : null)
                .reason(e.getReason())
                .notes(e.getNotes())
                .reviewNotes(e.getReviewNotes())
                .status(e.getStatus())
                .affectedAppointmentsCount(e.getAffectedAppointmentsCount())
                .hasHeavyConflict(e.isHasHeavyConflict())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .affectedAppointments(affected)
                .build();
    }

    private Doctor requireDoctor(Long doctorId) {
        return doctorRepo.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));
    }

    private TimeOffRequest requireOwned(Long doctorId, Long requestId) {
        return timeOffRepo.findByIdAndDoctorId(requestId, doctorId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Time-off request not found or does not belong to you: " + requestId));
    }

    // ----------------------------------------------------------------
    // ADMIN OPERATIONS
    // ----------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public List<TimeOffRequestDTO> adminList(TimeOffStatus status, Long doctorId,
                                              TimeOffType type, LocalDate dateFrom, LocalDate dateTo) {
        return timeOffRepo.findAllForAdmin(status, doctorId, type, dateFrom, dateTo)
                .stream()
                .map(e -> toDTO(e, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TimeOffRequestDTO adminGetById(Long requestId) {
        TimeOffRequest entity = requireAny(requestId);
        Long doctorId = entity.getDoctor().getId();
        List<Appointment> conflicts = (entity.getStatus() == TimeOffStatus.PENDING_REVIEW)
                ? findConflicts(doctorId, entity.getType(), entity.getDate(),
                                entity.getStartTime(), entity.getEndTime())
                : List.of();
        return toDTO(entity, buildAffectedList(conflicts));
    }

    @Override
    @Transactional
    public TimeOffRequestDTO adminApprove(Long requestId) {
        TimeOffRequest entity = requireAny(requestId);
        if (entity.getStatus() == TimeOffStatus.APPROVED) {
            throw new BadRequestException("Request is already approved.");
        }
        if (entity.getStatus() == TimeOffStatus.CANCELLED) {
            throw new BadRequestException("Cannot approve a cancelled request.");
        }
        entity.setStatus(TimeOffStatus.APPROVED);
        entity = timeOffRepo.save(entity);
        log.info("Admin approved TimeOffRequest id={}", requestId);
        return toDTO(entity, null);
    }

    @Override
    @Transactional
    public TimeOffRequestDTO adminReject(Long requestId, String reviewNotes) {
        if (reviewNotes == null || reviewNotes.isBlank()) {
            throw new BadRequestException("Rejection reason is required.");
        }
        TimeOffRequest entity = requireAny(requestId);
        if (entity.getStatus() == TimeOffStatus.REJECTED) {
            throw new BadRequestException("Request is already rejected.");
        }
        if (entity.getStatus() == TimeOffStatus.CANCELLED) {
            throw new BadRequestException("Cannot reject a cancelled request.");
        }
        entity.setStatus(TimeOffStatus.REJECTED);
        entity.setReviewNotes(reviewNotes);
        entity = timeOffRepo.save(entity);
        log.info("Admin rejected TimeOffRequest id={} reason={}", requestId, reviewNotes);
        return toDTO(entity, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AffectedAppointmentDTO> adminGetAffectedAppointments(Long requestId) {
        TimeOffRequest entity = requireAny(requestId);
        Long doctorId = entity.getDoctor().getId();
        List<Appointment> conflicts = findConflicts(doctorId, entity.getType(),
                entity.getDate(), entity.getStartTime(), entity.getEndTime());
        return buildAffectedList(conflicts);
    }

    private TimeOffRequest requireAny(Long requestId) {
        return timeOffRepo.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Time-off request not found: " + requestId));
    }
}
