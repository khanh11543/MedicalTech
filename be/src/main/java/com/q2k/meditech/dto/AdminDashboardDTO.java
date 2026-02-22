package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Admin Dashboard Statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardDTO {
    
    // User Statistics
    private Long totalUsers;
    private Long totalDoctors;
    private Long totalPatients;
    private Long totalReceptionists;
    private Long activeUsers;
    private Long inactiveUsers;
    
    // Doctor Verification Statistics
    private Long pendingDocuments;
    private Long approvedDocuments;
    private Long rejectedDocuments;
    
    // Appointment Statistics
    private Long totalAppointments;
    private Long todayAppointments;
    private Long pendingAppointments;
    private Long completedAppointments;
    private Long cancelledAppointments;
    
    // Staff Registry Statistics
    private Long pendingStaffInvites;
    private Long registeredStaff;
    
    // Recent Activity
    private List<RecentUserDTO> recentUsers;
    private List<RecentAppointmentDTO> recentAppointments;
    
    // Timestamp
    private LocalDateTime generatedAt;
    
    /**
     * Recent User DTO for dashboard
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentUserDTO {
        private Long id;
        private String email;
        private String fullName;
        private String role;
        private LocalDateTime createdAt;
    }
    
    /**
     * Recent Appointment DTO for dashboard
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentAppointmentDTO {
        private Long id;
        private String patientName;
        private String doctorName;
        private String status;
        private LocalDateTime appointmentDate;
    }
}
