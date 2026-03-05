package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.dto.AppointmentDTO;
import com.q2k.meditech.dto.AppointmentHistoryDTO;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.AppointmentHistory;
import com.q2k.meditech.entity.Payment;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.repository.PaymentRepository;
import com.q2k.meditech.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentMapper {
    
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    /**
     * Safely initialize a Hibernate proxy and return the real entity,
     * or null if the referenced row no longer exists.
     */
    private <T> T safeGet(T proxy) {
        if (proxy == null) return null;
        try {
            Hibernate.initialize(proxy);
            return proxy;
        } catch (EntityNotFoundException e) {
            log.warn("Referenced entity not found, treating as null: {}", e.getMessage());
            return null;
        }
    }
    
    public AppointmentDTO toDTO(Appointment appointment) {
        if (appointment == null) return null;
        
        AppointmentDTO.AppointmentDTOBuilder builder = AppointmentDTO.builder()
                .id(appointment.getId())
                .appointmentCode(appointment.getAppointmentCode())
                .appointmentDate(appointment.getAppointmentDate())
                .startTime(appointment.getStartTime())
                .endTime(appointment.getEndTime())
                .status(appointment.getStatus())
                .bookedBy(appointment.getBookedBy())
                .queueNumber(appointment.getQueueNumber())
                .reasonForVisit(appointment.getReasonForVisit())
                .symptoms(appointment.getSymptoms())
                .notes(appointment.getNotes())
                .cancellationReason(appointment.getCancellationReason())
                .checkedInAt(appointment.getCheckedInAt())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt());
        
        // Patient info
        if (appointment.getPatient() != null) {
            builder.patientId(appointment.getPatient().getId());
            User patientUser = safeGet(appointment.getPatient().getUser());
            if (patientUser != null) {
                builder.patientName(patientUser.getFullName());
                builder.patientEmail(patientUser.getEmail());
                builder.patientPhone(patientUser.getPhone());
            }
        }
        
        // Doctor info
        if (appointment.getDoctor() != null) {
            builder.doctorId(appointment.getDoctor().getId());
            builder.doctorSpecialization(appointment.getDoctor().getSpecialization());
            User doctorUser = safeGet(appointment.getDoctor().getUser());
            if (doctorUser != null) {
                builder.doctorName(doctorUser.getFullName());
                builder.doctorEmail(doctorUser.getEmail());
            }
        }
        
        // Booked by user info
        User bookedByUser = safeGet(appointment.getBookedByUser());
        if (bookedByUser != null) {
            builder.bookedByUserName(bookedByUser.getFullName());
        }
        
        // Appointment type
        builder.appointmentType(appointment.getAppointmentType());
        
        // Payment status (from payments table)
        try {
            Optional<Payment> payment = paymentRepository.findByAppointmentIdWithDetails(appointment.getId());
            builder.paymentStatus(payment.map(Payment::getPaymentStatus).orElse(null));
        } catch (Exception e) {
            log.debug("Could not fetch payment status for appointment {}: {}", appointment.getId(), e.getMessage());
        }
        
        return builder.build();
    }
    
    public AppointmentHistoryDTO toHistoryDTO(AppointmentHistory history) {
        if (history == null) return null;
        
        AppointmentHistoryDTO.AppointmentHistoryDTOBuilder builder = AppointmentHistoryDTO.builder()
                .id(history.getId())
                .appointmentId(history.getAppointment() != null ? history.getAppointment().getId() : null)
                .action(history.getAction())
                .oldStatus(history.getOldStatus())
                .newStatus(history.getNewStatus())
                .oldDate(history.getOldDate())
                .newDate(history.getNewDate())
                .oldStartTime(history.getOldStartTime())
                .newStartTime(history.getNewStartTime())
                .oldEndTime(history.getOldEndTime())
                .newEndTime(history.getNewEndTime())
                .changedByUserId(history.getChangedByUserId())
                .changedByRole(history.getChangedByRole())
                .reason(history.getReason())
                .changedAt(history.getChangedAt());
        
        // Get user name if available
        if (history.getChangedByUserId() != null) {
            userRepository.findById(history.getChangedByUserId())
                    .ifPresent(user -> builder.changedByUserName(user.getFullName()));
        }
        
        return builder.build();
    }
    
    public List<AppointmentHistoryDTO> toHistoryDTOList(List<AppointmentHistory> histories) {
        return histories.stream()
                .map(this::toHistoryDTO)
                .collect(Collectors.toList());
    }
}