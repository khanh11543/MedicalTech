package com.q2k.meditech.service;

import com.q2k.meditech.dto.ReportsAnalyticsDTO;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Payment;
import com.q2k.meditech.entity.Specialty;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for Reports & Analytics
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReportsAnalyticsService {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final PaymentRepository paymentRepository;
    private final DoctorRepository doctorRepository;
    private final SpecialtyRepository specialtyRepository;

    /**
     * Get comprehensive reports and analytics
     */
    public ReportsAnalyticsDTO getReportsAnalytics() {
        log.info("Generating reports and analytics");

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(30);
        LocalDate oneYearAgo = today.minusMonths(12);

        // Overview Statistics
        long totalUsers = userRepository.count();
        long totalAppointments = appointmentRepository.count();
        long totalPayments = paymentRepository.count();
        double totalRevenue = calculateTotalRevenue();

        // Appointment Analytics
        Map<String, Long> appointmentsByStatus = getAppointmentsByStatus();
        Map<String, Long> appointmentsBySpecialty = getAppointmentsBySpecialty();
        List<ReportsAnalyticsDTO.DailyAppointmentDTO> appointmentTrend = 
                getDailyAppointmentTrend(thirtyDaysAgo, today);

        // Payment Analytics
        Map<String, Double> revenueByPaymentMethod = getRevenueByPaymentMethod();
        Map<String, Long> paymentsByStatus = getPaymentsByStatus();
        List<ReportsAnalyticsDTO.DailyRevenueDTO> revenueTrend = 
                getDailyRevenueTrend(thirtyDaysAgo, today);

        // User Analytics
        Map<String, Long> usersByRole = getUsersByRole();
        List<ReportsAnalyticsDTO.MonthlyUserGrowthDTO> userGrowthTrend = 
                getMonthlyUserGrowth(oneYearAgo);

        // Doctor Analytics
        List<ReportsAnalyticsDTO.TopDoctorDTO> topDoctorsByAppointments = 
                getTopDoctorsByAppointments(5);
        List<ReportsAnalyticsDTO.TopDoctorDTO> topDoctorsByRating = 
                getTopDoctorsByRating(5);

        // Specialty Analytics
        List<ReportsAnalyticsDTO.SpecialtyStatsDTO> specialtyStatistics = 
                getSpecialtyStatistics();

        return ReportsAnalyticsDTO.builder()
                .totalUsers(totalUsers)
                .totalAppointments(totalAppointments)
                .totalPayments(totalPayments)
                .totalRevenue(totalRevenue)
                .appointmentsByStatus(appointmentsByStatus)
                .appointmentsBySpecialty(appointmentsBySpecialty)
                .appointmentTrend(appointmentTrend)
                .revenueByPaymentMethod(revenueByPaymentMethod)
                .paymentsByStatus(paymentsByStatus)
                .revenueTrend(revenueTrend)
                .usersByRole(usersByRole)
                .userGrowthTrend(userGrowthTrend)
                .topDoctorsByAppointments(topDoctorsByAppointments)
                .topDoctorsByRating(topDoctorsByRating)
                .specialtyStatistics(specialtyStatistics)
                .generatedAt(now)
                .build();
    }

    // Helper methods

    private double calculateTotalRevenue() {
        return paymentRepository.findAll().stream()
                .filter(p -> "COMPLETED".equals(p.getPaymentStatus()))
                .mapToDouble(p -> p.getAmount() != null ? p.getAmount().doubleValue() : 0.0)
                .sum();
    }

    private Map<String, Long> getAppointmentsByStatus() {
        return appointmentRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        a -> a.getStatus() != null ? a.getStatus().name() : "UNKNOWN",
                        Collectors.counting()
                ));
    }

    private Map<String, Long> getAppointmentsBySpecialty() {
        return appointmentRepository.findAll().stream()
                .filter(a -> a.getDoctor() != null && !a.getDoctor().getSpecialties().isEmpty())
                .collect(Collectors.groupingBy(
                        a -> {
                            Specialty s = a.getDoctor().getSpecialties().get(0);
                            return s != null && s.getName() != null ? s.getName() : "Unknown";
                        },
                        Collectors.counting()
                ));
    }

    private List<ReportsAnalyticsDTO.DailyAppointmentDTO> getDailyAppointmentTrend(LocalDate from, LocalDate to) {
        List<Appointment> appointments = appointmentRepository.findAll();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        
        Map<String, Long> dailyCounts = appointments.stream()
                .filter(a -> {
                    if (a.getAppointmentDate() == null) return false;
                    return !a.getAppointmentDate().isBefore(from) && !a.getAppointmentDate().isAfter(to);
                })
                .collect(Collectors.groupingBy(
                        a -> a.getAppointmentDate().format(formatter),
                        Collectors.counting()
                ));

        return dailyCounts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> ReportsAnalyticsDTO.DailyAppointmentDTO.builder()
                        .date(e.getKey())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private Map<String, Double> getRevenueByPaymentMethod() {
        return paymentRepository.findAll().stream()
                .filter(p -> "COMPLETED".equals(p.getPaymentStatus()))
                .collect(Collectors.groupingBy(
                        p -> p.getPaymentMethod() != null ? p.getPaymentMethod() : "OTHER",
                        Collectors.summingDouble(p -> p.getAmount() != null ? p.getAmount().doubleValue() : 0.0)
                ));
    }

    private Map<String, Long> getPaymentsByStatus() {
        return paymentRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        p -> p.getPaymentStatus() != null ? p.getPaymentStatus() : "UNKNOWN",
                        Collectors.counting()
                ));
    }

    private List<ReportsAnalyticsDTO.DailyRevenueDTO> getDailyRevenueTrend(LocalDate from, LocalDate to) {
        List<Payment> payments = paymentRepository.findAll();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        
        Map<String, Double> dailyRevenue = payments.stream()
                .filter(p -> {
                    if (p.getCreatedAt() == null) return false;
                    LocalDate paymentDate = p.getCreatedAt().toLocalDate();
                    return "COMPLETED".equals(p.getPaymentStatus()) &&
                           !paymentDate.isBefore(from) && !paymentDate.isAfter(to);
                })
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().toLocalDate().format(formatter),
                        Collectors.summingDouble(p -> p.getAmount() != null ? p.getAmount().doubleValue() : 0.0)
                ));

        return dailyRevenue.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> ReportsAnalyticsDTO.DailyRevenueDTO.builder()
                        .date(e.getKey())
                        .revenue(e.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private Map<String, Long> getUsersByRole() {
        return userRepository.findAll().stream()
                .filter(user -> user.getUserRoles() != null)
                .flatMap(user -> user.getUserRoles().stream())
                .filter(userRole -> userRole.getRole() != null)
                .collect(Collectors.groupingBy(
                        userRole -> userRole.getRole().getName() != null ? userRole.getRole().getName() : "UNKNOWN",
                        Collectors.counting()
                ));
    }

    private List<ReportsAnalyticsDTO.MonthlyUserGrowthDTO> getMonthlyUserGrowth(LocalDate from) {
        List<User> users = userRepository.findAll();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");
        
        // Group users by month
        Map<String, Long> monthlyNewUsers = users.stream()
                .filter(u -> u.getCreatedAt() != null && 
                            !u.getCreatedAt().toLocalDate().isBefore(from))
                .collect(Collectors.groupingBy(
                        u -> u.getCreatedAt().format(formatter),
                        Collectors.counting()
                ));

        // Calculate cumulative users
        List<ReportsAnalyticsDTO.MonthlyUserGrowthDTO> growthData = new ArrayList<>();
        long cumulativeUsers = users.stream()
                .filter(u -> u.getCreatedAt() != null && 
                            u.getCreatedAt().toLocalDate().isBefore(from))
                .count();

        List<String> months = monthlyNewUsers.keySet().stream()
                .sorted()
                .collect(Collectors.toList());

        for (String month : months) {
            long newUsers = monthlyNewUsers.getOrDefault(month, 0L);
            cumulativeUsers += newUsers;
            growthData.add(ReportsAnalyticsDTO.MonthlyUserGrowthDTO.builder()
                    .month(month)
                    .newUsers(newUsers)
                    .totalUsers(cumulativeUsers)
                    .build());
        }

        return growthData;
    }

    private List<ReportsAnalyticsDTO.TopDoctorDTO> getTopDoctorsByAppointments(int limit) {
        return appointmentRepository.findAll().stream()
                .filter(a -> a.getDoctor() != null)
                .collect(Collectors.groupingBy(
                        Appointment::getDoctor,
                        Collectors.counting()
                ))
                .entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue()))
                .limit(limit)
                .map(entry -> {
                    var doctor = entry.getKey();
                    double avgRating = doctor.getRatingAvg() != null ? doctor.getRatingAvg().doubleValue() : 0.0;
                    String specialtyName = !doctor.getSpecialties().isEmpty() ?
                            doctor.getSpecialties().get(0).getName() : "N/A";
                    
                    return ReportsAnalyticsDTO.TopDoctorDTO.builder()
                            .doctorId(doctor.getId())
                            .name(doctor.getFullName())
                            .specialty(specialtyName)
                            .appointmentCount(entry.getValue())
                            .averageRating(avgRating)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<ReportsAnalyticsDTO.TopDoctorDTO> getTopDoctorsByRating(int limit) {
        return doctorRepository.findAll().stream()
                .map(doctor -> {
                    double avgRating = doctor.getRatingAvg() != null ? doctor.getRatingAvg().doubleValue() : 0.0;
                    
                    long appointmentCount = appointmentRepository.findAll().stream()
                            .filter(a -> a.getDoctor() != null && 
                                    a.getDoctor().getId().equals(doctor.getId()))
                            .count();
                    
                    String specialtyName = !doctor.getSpecialties().isEmpty() ?
                            doctor.getSpecialties().get(0).getName() : "N/A";
                    
                    return ReportsAnalyticsDTO.TopDoctorDTO.builder()
                            .doctorId(doctor.getId())
                            .name(doctor.getFullName())
                            .specialty(specialtyName)
                            .appointmentCount(appointmentCount)
                            .averageRating(avgRating)
                            .build();
                })
                .filter(dto -> dto.getAverageRating() > 0)
                .sorted((d1, d2) -> Double.compare(d2.getAverageRating(), d1.getAverageRating()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    private List<ReportsAnalyticsDTO.SpecialtyStatsDTO> getSpecialtyStatistics() {
        List<Payment> allPayments = paymentRepository.findAll();
        
        return specialtyRepository.findAll().stream()
                .map(specialty -> {
                    long doctorCount = doctorRepository.findAll().stream()
                            .filter(d -> d.getSpecialties().stream()
                                    .anyMatch(s -> s.getId().equals(specialty.getId())))
                            .count();
                    
                    long appointmentCount = appointmentRepository.findAll().stream()
                            .filter(a -> a.getDoctor() != null && 
                                    a.getDoctor().getSpecialties().stream()
                                            .anyMatch(s -> s.getId().equals(specialty.getId())))
                            .count();
                    
                    // Calculate revenue by finding payments linked to appointments with doctors of this specialty
                    double totalRevenue = allPayments.stream()
                            .filter(p -> "COMPLETED".equals(p.getPaymentStatus()) && 
                                    p.getAppointment() != null &&
                                    p.getAppointment().getDoctor() != null &&
                                    p.getAppointment().getDoctor().getSpecialties().stream()
                                            .anyMatch(s -> s.getId().equals(specialty.getId())))
                            .mapToDouble(p -> p.getAmount() != null ? p.getAmount().doubleValue() : 0.0)
                            .sum();
                    
                    return ReportsAnalyticsDTO.SpecialtyStatsDTO.builder()
                            .specialtyId(specialty.getId())
                            .specialtyName(specialty.getName())
                            .doctorCount(doctorCount)
                            .appointmentCount(appointmentCount)
                            .totalRevenue(totalRevenue)
                            .build();
                })
                .sorted((s1, s2) -> Long.compare(s2.getAppointmentCount(), s1.getAppointmentCount()))
                .collect(Collectors.toList());
    }
}
