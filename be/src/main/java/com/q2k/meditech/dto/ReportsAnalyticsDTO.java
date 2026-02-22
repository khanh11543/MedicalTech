package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO for Reports & Analytics Dashboard
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportsAnalyticsDTO {
    
    // Overview Statistics
    private Long totalUsers;
    private Long totalAppointments;
    private Long totalPayments;
    private Double totalRevenue;
    
    // Appointment Analytics
    private Map<String, Long> appointmentsByStatus;
    private Map<String, Long> appointmentsBySpecialty;
    private List<DailyAppointmentDTO> appointmentTrend; // last 30 days
    
    // Payment Analytics
    private Map<String, Double> revenueByPaymentMethod;
    private Map<String, Long> paymentsByStatus;
    private List<DailyRevenueDTO> revenueTrend; // last 30 days
    
    // User Analytics
    private Map<String, Long> usersByRole;
    private List<MonthlyUserGrowthDTO> userGrowthTrend; // last 12 months
    
    // Doctor Analytics
    private List<TopDoctorDTO> topDoctorsByAppointments;
    private List<TopDoctorDTO> topDoctorsByRating;
    
    // Specialty Analytics
    private List<SpecialtyStatsDTO> specialtyStatistics;
    
    private LocalDateTime generatedAt;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyAppointmentDTO {
        private String date;
        private Long count;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyRevenueDTO {
        private String date;
        private Double revenue;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyUserGrowthDTO {
        private String month;
        private Long newUsers;
        private Long totalUsers;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopDoctorDTO {
        private Long doctorId;
        private String name;
        private String specialty;
        private Long appointmentCount;
        private Double averageRating;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SpecialtyStatsDTO {
        private Long specialtyId;
        private String specialtyName;
        private Long doctorCount;
        private Long appointmentCount;
        private Double totalRevenue;
    }
}
