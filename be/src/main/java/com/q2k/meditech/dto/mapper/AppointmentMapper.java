package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.dto.AppointmentDTO;
import com.q2k.meditech.dto.AppointmentHistoryDTO;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.AppointmentHistory;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AppointmentMapper {
    
    private final UserRepository userRepository;
    
    public AppointmentDTO toDTO(Appointment appointment) {
        if (appointment == null) return null;
        
        AppointmentDTO.AppointmentDTOBuilder builder = AppointmentDTO.builder()
                .id(appointment.getId())
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
            if (appointment.getPatient().getUser() != null) {
                builder.patientName(appointment.getPatient().getUser().getFullName());
                builder.patientEmail(appointment.getPatient().getUser().getEmail());
                builder.patientPhone(appointment.getPatient().getUser().getPhone());
            }
        }
        
        // Doctor info
        if (appointment.getDoctor() != null) {
            builder.doctorId(appointment.getDoctor().getId());
            builder.doctorSpecialization(appointment.getDoctor().getSpecialization());
            if (appointment.getDoctor().getUser() != null) {
                builder.doctorName(appointment.getDoctor().getUser().getFullName());
                builder.doctorEmail(appointment.getDoctor().getUser().getEmail());
            }
        }
        
        // Booked by user info
        if (appointment.getBookedByUser() != null) {
            builder.bookedByUserName(appointment.getBookedByUser().getFullName());
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