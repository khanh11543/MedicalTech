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
     * Get comprehensive reports and analytics filtered by date range.
     * Uses [rangeStart, rangeEndExclusive) pattern for safe datetime comparison.
     *
     * @param startDate inclusive start date
     * @param endDate   inclusive end date
     */
    public ReportsAnalyticsDTO getReportsAnalytics(LocalDate startDate, LocalDate endDate) {
        log.info("Generating reports and analytics for range [{}, {}]", startDate, endDate);

        LocalDateTime now = LocalDateTime.now();

        // Safe range boundaries: [startDate 00:00, endDate+1 00:00)
        LocalDateTime rangeStart = startDate.atStartOfDay();
        LocalDateTime rangeEndExclusive = endDate.plusDays(1).atStartOfDay();

        // ---- Fetch all data once ----
        List<Appointment> allAppointments = appointmentRepository.findAll();
        List<Payment> allPayments = paymentRepository.findAll();
        List<User> allUsers = userRepository.findAll();

        // ---- Filter appointments in range (by appointmentDate) ----
        List<Appointment> rangeAppointments = allAppointments.stream()
                .filter(a -> {
                    if (a.getAppointmentDate() == null) return false;
                    LocalDate d = a.getAppointmentDate();
                    return !d.isBefore(startDate) && !d.isAfter(endDate);
                })
                .collect(Collectors.toList());

        // ---- Filter payments in range (by createdAt) ----
        List<Payment> rangePayments = allPayments.stream()
                .filter(p -> {
                    if (p.getCreatedAt() == null) return false;
                    LocalDateTime dt = p.getCreatedAt();
                    return !dt.isBefore(rangeStart) && dt.isBefore(rangeEndExclusive);
                })
                .collect(Collectors.toList());

        // ===== Overview Statistics =====
        // Users are all-time
        long totalUsers = allUsers.size();
        // Appointments & payments scoped to range
        long totalAppointments = rangeAppointments.size();
        long totalPayments = rangePayments.size();
        double totalRevenue = rangePayments.stream()
                .filter(p -> "PAID".equals(p.getPaymentStatus()))
                .mapToDouble(p -> p.getTotalAmount() != null ? p.getTotalAmount().doubleValue() : 0.0)
                .sum();

        // ===== Appointment Analytics (scoped) =====
        Map<String, Long> appointmentsByStatus = rangeAppointments.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getStatus() != null ? a.getStatus().name() : "UNKNOWN",
                        Collectors.counting()
                ));

        Map<String, Long> appointmentsBySpecialty = rangeAppointments.stream()
                .filter(a -> a.getDoctor() != null && !a.getDoctor().getSpecialties().isEmpty())
                .collect(Collectors.groupingBy(
                        a -> {
                            Specialty s = a.getDoctor().getSpecialties().get(0);
                            return s != null && s.getName() != null ? s.getName() : "Unknown";
                        },
                        Collectors.counting()
                ));

        List<ReportsAnalyticsDTO.DailyAppointmentDTO> appointmentTrend =
                getDailyAppointmentTrend(rangeAppointments);

        // ===== Payment Analytics (scoped) =====
        List<Payment> rangePaidPayments = rangePayments.stream()
                .filter(p -> "PAID".equals(p.getPaymentStatus()))
                .collect(Collectors.toList());

        Map<String, Double> revenueByPaymentMethod = rangePaidPayments.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getPaymentMethod() != null ? p.getPaymentMethod() : "OTHER",
                        Collectors.summingDouble(p -> p.getTotalAmount() != null ? p.getTotalAmount().doubleValue() : 0.0)
                ));

        Map<String, Long> paymentsByStatus = rangePayments.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getPaymentStatus() != null ? p.getPaymentStatus() : "UNKNOWN",
                        Collectors.counting()
                ));

        List<ReportsAnalyticsDTO.DailyRevenueDTO> revenueTrend =
                getDailyRevenueTrend(rangePaidPayments);

        // ===== User Analytics (all-time) =====
        Map<String, Long> usersByRole = getUsersByRole(allUsers);
        LocalDate oneYearAgo = LocalDate.now().minusMonths(12);
        List<ReportsAnalyticsDTO.MonthlyUserGrowthDTO> userGrowthTrend =
                getMonthlyUserGrowth(allUsers, oneYearAgo);

        // ===== Doctor Analytics (scoped) =====
        List<ReportsAnalyticsDTO.TopDoctorDTO> topDoctorsByAppointments =
                getTopDoctorsByAppointments(rangeAppointments, 5);
        List<ReportsAnalyticsDTO.TopDoctorDTO> topDoctorsByRating =
                getTopDoctorsByRating(rangeAppointments, 5);

        // ===== Specialty Analytics (scoped) =====
        List<ReportsAnalyticsDTO.SpecialtyStatsDTO> specialtyStatistics =
                getSpecialtyStatistics(rangeAppointments, rangePaidPayments);

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

    // ======================== Helper Methods ========================

    private List<ReportsAnalyticsDTO.DailyAppointmentDTO> getDailyAppointmentTrend(
            List<Appointment> appointments) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        Map<String, Long> dailyCounts = appointments.stream()
                .filter(a -> a.getAppointmentDate() != null)
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

    private List<ReportsAnalyticsDTO.DailyRevenueDTO> getDailyRevenueTrend(
            List<Payment> paidPayments) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        Map<String, Double> dailyRevenue = paidPayments.stream()
                .filter(p -> p.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().toLocalDate().format(formatter),
                        Collectors.summingDouble(p -> p.getTotalAmount() != null ? p.getTotalAmount().doubleValue() : 0.0)
                ));

        return dailyRevenue.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> ReportsAnalyticsDTO.DailyRevenueDTO.builder()
                        .date(e.getKey())
                        .revenue(e.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private Map<String, Long> getUsersByRole(List<User> users) {
        return users.stream()
                .filter(user -> user.getUserRoles() != null)
                .flatMap(user -> user.getUserRoles().stream())
                .filter(userRole -> userRole.getRole() != null)
                .collect(Collectors.groupingBy(
                        userRole -> userRole.getRole().getName() != null ? userRole.getRole().getName() : "UNKNOWN",
                        Collectors.counting()
                ));
    }

    private List<ReportsAnalyticsDTO.MonthlyUserGrowthDTO> getMonthlyUserGrowth(List<User> users, LocalDate from) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        Map<String, Long> monthlyNewUsers = users.stream()
                .filter(u -> u.getCreatedAt() != null &&
                            !u.getCreatedAt().toLocalDate().isBefore(from))
                .collect(Collectors.groupingBy(
                        u -> u.getCreatedAt().format(formatter),
                        Collectors.counting()
                ));

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

    private List<ReportsAnalyticsDTO.TopDoctorDTO> getTopDoctorsByAppointments(
            List<Appointment> appointments, int limit) {
        return appointments.stream()
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

    private List<ReportsAnalyticsDTO.TopDoctorDTO> getTopDoctorsByRating(
            List<Appointment> rangeAppointments, int limit) {
        // Count appointments per doctor within range
        Map<Long, Long> doctorAppointmentCounts = rangeAppointments.stream()
                .filter(a -> a.getDoctor() != null)
                .collect(Collectors.groupingBy(
                        a -> a.getDoctor().getId(),
                        Collectors.counting()
                ));

        return doctorRepository.findAll().stream()
                .filter(doctor -> doctorAppointmentCounts.containsKey(doctor.getId()))
                .map(doctor -> {
                    double avgRating = doctor.getRatingAvg() != null ? doctor.getRatingAvg().doubleValue() : 0.0;
                    long appointmentCount = doctorAppointmentCounts.getOrDefault(doctor.getId(), 0L);
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

    private List<ReportsAnalyticsDTO.SpecialtyStatsDTO> getSpecialtyStatistics(
            List<Appointment> rangeAppointments, List<Payment> rangePaidPayments) {
        return specialtyRepository.findAll().stream()
                .map(specialty -> {
                    long doctorCount = doctorRepository.findAll().stream()
                            .filter(d -> d.getSpecialties().stream()
                                    .anyMatch(s -> s.getId().equals(specialty.getId())))
                            .count();

                    long appointmentCount = rangeAppointments.stream()
                            .filter(a -> a.getDoctor() != null &&
                                    a.getDoctor().getSpecialties().stream()
                                            .anyMatch(s -> s.getId().equals(specialty.getId())))
                            .count();

                    double totalRevenue = rangePaidPayments.stream()
                            .filter(p -> p.getAppointment() != null &&
                                    p.getAppointment().getDoctor() != null &&
                                    p.getAppointment().getDoctor().getSpecialties().stream()
                                            .anyMatch(s -> s.getId().equals(specialty.getId())))
                            .mapToDouble(p -> p.getTotalAmount() != null ? p.getTotalAmount().doubleValue() : 0.0)
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
