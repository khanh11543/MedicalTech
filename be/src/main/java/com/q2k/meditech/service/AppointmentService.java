package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.enums.BookedBy;
import org.springframework.data.domain.Page;

import java.util.List;

public interface AppointmentService {
    
    // === BOOKING ===
    /**
     * Book an appointment (Patient or Receptionist)
     */
    AppointmentDTO bookAppointment(BookAppointmentDTO dto, Long bookedByUserId, BookedBy bookedBy);
    
    // === PATIENT APIs ===
    /**
     * Get patient's appointments with filters
     */
    Page<AppointmentDTO> getPatientAppointments(Long patientId, AppointmentFilterDTO filter);
    
    // === DOCTOR APIs ===
    /**
     * Get doctor's appointments with filters
     */
    Page<AppointmentDTO> getDoctorAppointments(Long doctorId, AppointmentFilterDTO filter);
    
    /**
     * Doctor confirms an appointment
     */
    AppointmentDTO confirmAppointment(Long appointmentId, Long doctorUserId);
    
    // === RECEPTIONIST APIs ===
    /**
     * Check-in a patient and assign queue number
     */
    AppointmentDTO checkInPatient(Long appointmentId, Long receptionistUserId);
    
    // === COMMON APIs ===
    /**
     * Reschedule an appointment
     */
    AppointmentDTO rescheduleAppointment(Long appointmentId, RescheduleDTO dto, Long userId, String userRole);
    
    /**
     * Cancel an appointment
     */
    AppointmentDTO cancelAppointment(Long appointmentId, CancelDTO dto, Long userId, String userRole);
    
    /**
     * Get appointment by ID
     */
    AppointmentDTO getAppointmentById(Long appointmentId);
    
    /**
     * Get appointment history
     */
    List<AppointmentHistoryDTO> getAppointmentHistory(Long appointmentId);
    
    // === ADMIN APIs ===
    /**
     * Get all appointments with filters (Admin)
     */
    Page<AppointmentDTO> getAllAppointments(AppointmentFilterDTO filter);
}