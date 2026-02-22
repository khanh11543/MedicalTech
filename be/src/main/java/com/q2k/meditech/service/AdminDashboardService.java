package com.q2k.meditech.service;

import com.q2k.meditech.dto.AdminDashboardDTO;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.ReviewStatus;
import com.q2k.meditech.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for Admin Dashboard Statistics
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final DoctorDocumentRepository doctorDocumentRepository;
    private final AppointmentRepository appointmentRepository;
    private final StaffRegistryRepository staffRegistryRepository;

    /**
     * Get dashboard statistics for admin panel
     */
    public AdminDashboardDTO getDashboardStatistics() {
        log.info("Generating admin dashboard statistics");
        
        // User statistics
        long totalUsers = userRepository.count();
        long totalDoctors = doctorRepository.count();
        long totalPatients = patientRepository.count();
        long activeUsers = userRepository.count(); // TODO: Add countByIsActive(true) to UserRepository
        
        // Doctor verification statistics
        long pendingDocuments = doctorDocumentRepository.countByStatus(ReviewStatus.PENDING);
        long approvedDocuments = doctorDocumentRepository.countByStatus(ReviewStatus.APPROVED);
        long rejectedDocuments = doctorDocumentRepository.countByStatus(ReviewStatus.REJECTED);
        
        // Appointment statistics
        long totalAppointments = appointmentRepository.count();
        long todayAppointments = countTodayAppointments();
        long pendingAppointments = countAppointmentsByStatus(AppointmentStatus.PENDING);
        long completedAppointments = countAppointmentsByStatus(AppointmentStatus.COMPLETED);
        long cancelledAppointments = countAppointmentsByStatus(AppointmentStatus.CANCELLED);
        
        // Staff registry statistics
        long pendingStaffInvites = staffRegistryRepository.countByStatus("PENDING");
        long registeredStaff = staffRegistryRepository.countByStatus("REGISTERED");
        
        // Recent users (last 5)
        List<AdminDashboardDTO.RecentUserDTO> recentUsers = getRecentUsers(5);
        
        // Recent appointments (last 5)
        List<AdminDashboardDTO.RecentAppointmentDTO> recentAppointments = getRecentAppointments(5);
        
        return AdminDashboardDTO.builder()
                .totalUsers(totalUsers)
                .totalDoctors(totalDoctors)
                .totalPatients(totalPatients)
                .totalReceptionists(0L) // TODO: Count receptionists separately if needed
                .activeUsers(activeUsers)
                .inactiveUsers(totalUsers - activeUsers)
                .pendingDocuments(pendingDocuments)
                .approvedDocuments(approvedDocuments)
                .rejectedDocuments(rejectedDocuments)
                .totalAppointments(totalAppointments)
                .todayAppointments(todayAppointments)
                .pendingAppointments(pendingAppointments)
                .completedAppointments(completedAppointments)
                .cancelledAppointments(cancelledAppointments)
                .pendingStaffInvites(pendingStaffInvites)
                .registeredStaff(registeredStaff)
                .recentUsers(recentUsers)
                .recentAppointments(recentAppointments)
                .generatedAt(LocalDateTime.now())
                .build();
    }
    
    /**
     * Count today's appointments
     */
    private long countTodayAppointments() {
        try {
            LocalDate today = LocalDate.now();
            return appointmentRepository.findAll().stream()
                    .filter(a -> a.getAppointmentDate() != null && a.getAppointmentDate().equals(today))
                    .count();
        } catch (Exception e) {
            log.warn("Error counting today's appointments: {}", e.getMessage());
            return 0L;
        }
    }
    
    /**
     * Count appointments by status
     */
    private long countAppointmentsByStatus(AppointmentStatus status) {
        try {
            return appointmentRepository.findAll().stream()
                    .filter(a -> a.getStatus() == status)
                    .count();
        } catch (Exception e) {
            log.warn("Error counting appointments by status {}: {}", status, e.getMessage());
            return 0L;
        }
    }
    
    /**
     * Get recent users
     */
    private List<AdminDashboardDTO.RecentUserDTO> getRecentUsers(int limit) {
        try {
            return userRepository.findAll(PageRequest.of(0, limit, Sort.by("createdAt").descending()))
                    .getContent()
                    .stream()
                    .map(this::mapToRecentUserDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Error getting recent users: {}", e.getMessage());
            return List.of();
        }
    }
    
    /**
     * Map User to RecentUserDTO
     */
    private AdminDashboardDTO.RecentUserDTO mapToRecentUserDTO(User user) {
        String roles = user.getUserRoles() != null 
                ? user.getUserRoles().stream()
                    .map(ur -> ur.getRole().getName())
                    .collect(Collectors.joining(", "))
                : "";
        
        return AdminDashboardDTO.RecentUserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(roles)
                .createdAt(user.getCreatedAt())
                .build();
    }
    
    /**
     * Get recent appointments
     */
    private List<AdminDashboardDTO.RecentAppointmentDTO> getRecentAppointments(int limit) {
        try {
            return appointmentRepository.findAll(PageRequest.of(0, limit, Sort.by("createdAt").descending()))
                    .getContent()
                    .stream()
                    .map(this::mapToRecentAppointmentDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Error getting recent appointments: {}", e.getMessage());
            return List.of();
        }
    }
    
    /**
     * Map Appointment to RecentAppointmentDTO
     */
    private AdminDashboardDTO.RecentAppointmentDTO mapToRecentAppointmentDTO(Appointment appointment) {
        String patientName = "";
        String doctorName = "";
        
        try {
            if (appointment.getPatient() != null && appointment.getPatient().getUser() != null) {
                patientName = appointment.getPatient().getUser().getFullName();
            }
            if (appointment.getDoctor() != null) {
                doctorName = appointment.getDoctor().getFullName();
            }
        } catch (Exception e) {
            log.warn("Error mapping appointment names: {}", e.getMessage());
        }
        
        return AdminDashboardDTO.RecentAppointmentDTO.builder()
                .id(appointment.getId())
                .patientName(patientName)
                .doctorName(doctorName)
                .status(appointment.getStatus() != null ? appointment.getStatus().name() : "")
                .appointmentDate(appointment.getAppointmentDate() != null 
                        ? appointment.getAppointmentDate().atStartOfDay() 
                        : null)
                .build();
    }
}
