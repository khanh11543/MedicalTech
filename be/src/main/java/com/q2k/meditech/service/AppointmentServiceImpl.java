package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.BookedBy;
import com.q2k.meditech.exception.AppointmentException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.dto.mapper.AppointmentMapper;
import com.q2k.meditech.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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
    
    // ==================== BOOKING ====================
    
    @Override
    public AppointmentDTO bookAppointment(BookAppointmentDTO dto, Long bookedByUserId, BookedBy bookedBy) {
        log.info("Booking appointment for patient {} with doctor {}", dto.getPatientId(), dto.getDoctorId());
        
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
                .build();
        
        appointment = appointmentRepository.save(appointment);
        
        // Create history entry
        createHistory(appointment, "CREATED", null, AppointmentStatus.PENDING, 
                bookedByUserId, bookedBy.name(), "Appointment booked");
        
        log.info("Appointment created with ID: {}", appointment.getId());
        
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
    
    @Override
    public AppointmentDTO confirmAppointment(Long appointmentId, Long doctorUserId) {
        log.info("Doctor {} confirming appointment {}", doctorUserId, appointmentId);
        
        Appointment appointment = getAppointmentEntity(appointmentId);
        
        // Verify the doctor owns this appointment
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found for user"));
        
        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new AppointmentException.UnauthorizedAccessException();
        }
        
        // Check valid status transition
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new AppointmentException.InvalidStatusTransitionException(
                    appointment.getStatus().name(), AppointmentStatus.CONFIRMED.name());
        }
        
        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment = appointmentRepository.save(appointment);
        
        // Create history
        createHistory(appointment, "CONFIRMED", oldStatus, AppointmentStatus.CONFIRMED,
                doctorUserId, "DOCTOR", "Appointment confirmed by doctor");
        
        return appointmentMapper.toDTO(appointment);
    }
    
    // ==================== RECEPTIONIST APIs ====================
    
    @Override
    public AppointmentDTO checkInPatient(Long appointmentId, Long receptionistUserId) {
        log.info("Receptionist {} checking in patient for appointment {}", receptionistUserId, appointmentId);
        
        Appointment appointment = getAppointmentEntity(appointmentId);
        
        // Check valid status
        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new AppointmentException("Only confirmed appointments can be checked in");
        }
        
        // Get next queue number
        Integer maxQueue = appointmentRepository.getMaxQueueNumber(
                appointment.getDoctor().getId(), 
                appointment.getAppointmentDate()
        );
        int newQueueNumber = maxQueue + 1;
        
        AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.CHECKED_IN);
        appointment.setQueueNumber(newQueueNumber);
        appointment.setCheckedInAt(LocalDateTime.now());
        appointment = appointmentRepository.save(appointment);
        
        // Create history
        createHistory(appointment, "CHECKED_IN", oldStatus, AppointmentStatus.CHECKED_IN,
                receptionistUserId, "RECEPTIONIST", "Patient checked in, queue number: " + newQueueNumber);
        
        return appointmentMapper.toDTO(appointment);
    }
    
    // ==================== COMMON APIs ====================
    
    @Override
    public AppointmentDTO rescheduleAppointment(Long appointmentId, RescheduleDTO dto, Long userId, String userRole) {
        log.info("User {} ({}) rescheduling appointment {}", userId, userRole, appointmentId);
        
        Appointment appointment = getAppointmentEntity(appointmentId);
        
        // Check if can be rescheduled
        if (!canBeRescheduled(appointment)) {
            throw new AppointmentException.AppointmentNotReschedulableException();
        }
        
        // Check for conflicts with new time
        List<Appointment> conflicts = appointmentRepository.findConflictingAppointmentsExcluding(
                appointment.getDoctor().getId(),
                dto.getNewDate(),
                dto.getNewStartTime(),
                dto.getNewEndTime(),
                appointmentId
        );
        
        if (!conflicts.isEmpty()) {
            throw new AppointmentException.TimeSlotConflictException();
        }
        
        // Store old values for history
        var oldDate = appointment.getAppointmentDate();
        var oldStartTime = appointment.getStartTime();
        var oldEndTime = appointment.getEndTime();
        AppointmentStatus oldStatus = appointment.getStatus();
        
        // Update appointment
        appointment.setAppointmentDate(dto.getNewDate());
        appointment.setStartTime(dto.getNewStartTime());
        appointment.setEndTime(dto.getNewEndTime());
        appointment.setStatus(AppointmentStatus.PENDING); // Reset to pending after reschedule
        appointment = appointmentRepository.save(appointment);
        
        // Create detailed history
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
    
    // ==================== HELPER METHODS ====================
    
    private Appointment getAppointmentEntity(Long appointmentId) {
        return appointmentRepository.findByIdWithDetails(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));
    }
    
    private Pageable createPageable(AppointmentFilterDTO filter) {
        return PageRequest.of(
                filter.getPageNumber() != null ? filter.getPageNumber() : 0,
                filter.getPageSize() != null ? filter.getPageSize() : 10,
                Sort.by(Sort.Direction.ASC, "appointmentDate", "startTime")
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
    
    private boolean canBeRescheduled(Appointment appointment) {
        return appointment.getStatus() == AppointmentStatus.PENDING ||
               appointment.getStatus() == AppointmentStatus.CONFIRMED;
    }
    
    private boolean canBeCancelled(Appointment appointment) {
        return appointment.getStatus() == AppointmentStatus.PENDING ||
               appointment.getStatus() == AppointmentStatus.CONFIRMED;
    }
}