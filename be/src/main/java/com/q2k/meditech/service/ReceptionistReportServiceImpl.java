package com.q2k.meditech.service;

import com.q2k.meditech.dto.receptionist.*;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Payment;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.PaymentRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of ReceptionistReportService.
 * All queries are scoped to the clinic's data (single-branch assumption).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReceptionistReportServiceImpl implements ReceptionistReportService {

    private final AppointmentRepository appointmentRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PrivacyMaskingService privacyMaskingService;

    private static final String BRANCH_NAME = "MediTech Clinic"; // configurable later

    // ==================== 6.1 Daily Appointments Report ====================

    @Override
    @Transactional(readOnly = true)
    public DailyAppointmentReportDTO getDailyAppointmentReport(LocalDate date, Long doctorId) {
        LocalDate reportDate = date != null ? date : LocalDate.now();
        log.info("Generating daily appointment report for date: {}, doctorId: {}", reportDate, doctorId);

        // Fetch appointments with details
        List<Appointment> appointments = appointmentRepository
                .findByDateWithDetailsForReport(reportDate, doctorId);

        // Build summary from status counts
        List<Object[]> statusCounts = appointmentRepository.countByStatusOnDate(reportDate, doctorId);
        Map<String, Long> statusMap = new HashMap<>();
        for (Object[] row : statusCounts) {
            AppointmentStatus status = (AppointmentStatus) row[0];
            Long count = (Long) row[1];
            statusMap.put(status.name(), count);
        }

        int total = statusMap.values().stream().mapToInt(Long::intValue).sum();
        int confirmed = statusMap.getOrDefault("CONFIRMED", 0L).intValue();
        int checkedIn = statusMap.getOrDefault("CHECKED_IN", 0L).intValue();
        int inProgress = statusMap.getOrDefault("IN_PROGRESS", 0L).intValue();
        int completed = statusMap.getOrDefault("COMPLETED", 0L).intValue();
        int cancelled = statusMap.getOrDefault("CANCELLED", 0L).intValue();
        int noShow = statusMap.getOrDefault("NO_SHOW", 0L).intValue();
        int pending = statusMap.getOrDefault("PENDING", 0L).intValue();
        int rescheduled = statusMap.getOrDefault("RESCHEDULED", 0L).intValue();

        int denominator = total - cancelled - rescheduled;
        double completionRate = denominator > 0 ? (completed * 100.0 / denominator) : 0.0;

        DailyAppointmentReportDTO.SummarySection summary = DailyAppointmentReportDTO.SummarySection.builder()
                .totalAppointments(total)
                .confirmed(confirmed)
                .checkedIn(checkedIn)
                .inProgress(inProgress)
                .completed(completed)
                .cancelled(cancelled)
                .noShow(noShow)
                .pending(pending)
                .rescheduled(rescheduled)
                .completionRate(Math.round(completionRate * 100.0) / 100.0)
                .build();

        // Build appointment rows — fetch payment status per appointment
        List<DailyAppointmentReportDTO.AppointmentRow> rows = appointments.stream()
                .map(a -> {
                    // Get payment status for this appointment
                    String paymentStatus = "N/A";
                    try {
                        Optional<Payment> payment = paymentRepository
                                .findByAppointmentIdWithDetails(a.getId());
                        if (payment.isPresent()) {
                            paymentStatus = payment.get().getPaymentStatus();
                        }
                    } catch (Exception e) {
                        log.trace("No payment for appointment {}", a.getId());
                    }

                    return DailyAppointmentReportDTO.AppointmentRow.builder()
                            .appointmentCode(a.getAppointmentCode())
                            .startTime(a.getStartTime())
                            .endTime(a.getEndTime())
                            .patientName(a.getPatient().getUser().getFullName())
                            .maskedPhone(privacyMaskingService.maskPhone(a.getPatient().getUser().getPhone()))
                            .doctorName(a.getDoctor().getFullName())
                            .room(a.getDoctor().getCurrentRoom())
                            .status(a.getStatus().name())
                            .queueNumber(a.getQueueNumber())
                            .paymentStatus(paymentStatus)
                            .build();
                })
                .collect(Collectors.toList());

        return DailyAppointmentReportDTO.builder()
                .reportDate(reportDate)
                .generatedBy(getCurrentUserName())
                .branch(BRANCH_NAME)
                .generatedAt(LocalDateTime.now())
                .summary(summary)
                .appointments(rows)
                .build();
    }

    // ==================== 6.2 Daily Revenue Summary ====================

    @Override
    @Transactional(readOnly = true)
    public DailyRevenueReportDTO getDailyRevenueReport(LocalDate date) {
        LocalDate reportDate = date != null ? date : LocalDate.now();
        log.info("Generating daily revenue report for date: {}", reportDate);

        LocalDateTime dayStart = reportDate.atStartOfDay();
        LocalDateTime dayEnd = reportDate.atTime(23, 59, 59);

        // Paid transactions
        List<Payment> paidPayments = paymentRepository.findPaidPaymentsForDate(dayStart, dayEnd);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal cashTotal = BigDecimal.ZERO;
        BigDecimal momoTotal = BigDecimal.ZERO;
        int cashCount = 0;
        int momoCount = 0;

        List<DailyRevenueReportDTO.TransactionRow> transactions = new ArrayList<>();

        for (Payment p : paidPayments) {
            BigDecimal amount = p.getTotalAmount() != null ? p.getTotalAmount() : BigDecimal.ZERO;
            totalRevenue = totalRevenue.add(amount);

            if ("CASH".equalsIgnoreCase(p.getPaymentMethod())) {
                cashTotal = cashTotal.add(amount);
                cashCount++;
            } else if ("MOMO".equalsIgnoreCase(p.getPaymentMethod())) {
                momoTotal = momoTotal.add(amount);
                momoCount++;
            }

            String patientName = "";
            try {
                patientName = p.getPatient().getUser().getFullName();
            } catch (Exception e) {
                patientName = "Unknown";
            }

            String collectedBy = "";
            try {
                if (p.getProcessedBy() != null) {
                    collectedBy = p.getProcessedBy().getFullName();
                }
            } catch (Exception e) {
                collectedBy = "Unknown";
            }

            String appointmentCode = "";
            try {
                if (p.getAppointment() != null) {
                    appointmentCode = p.getAppointment().getAppointmentCode();
                }
            } catch (Exception e) {
                // ignore
            }

            transactions.add(DailyRevenueReportDTO.TransactionRow.builder()
                    .transactionCode(p.getPaymentCode())
                    .paidTime(p.getPaidAt() != null ? p.getPaidAt().toLocalTime() : null)
                    .appointmentCode(appointmentCode)
                    .patientName(patientName)
                    .amount(amount)
                    .paymentMethod(p.getPaymentMethod())
                    .collectedBy(collectedBy)
                    .build());
        }

        // Pending payments
        List<Payment> pendingList = paymentRepository.findAllPendingWithCompletedAppointments();
        BigDecimal pendingAmount = BigDecimal.ZERO;
        List<DailyRevenueReportDTO.PendingRow> pendingRows = new ArrayList<>();

        for (Payment p : pendingList) {
            BigDecimal amount = p.getTotalAmount() != null ? p.getTotalAmount() : BigDecimal.ZERO;
            pendingAmount = pendingAmount.add(amount);

            String patientName = "";
            String phone = "";
            try {
                patientName = p.getPatient().getUser().getFullName();
                phone = p.getPatient().getUser().getPhone();
            } catch (Exception e) {
                patientName = "Unknown";
            }

            String appointmentCode = "";
            try {
                if (p.getAppointment() != null) {
                    appointmentCode = p.getAppointment().getAppointmentCode();
                }
            } catch (Exception e) {
                // ignore
            }

            pendingRows.add(DailyRevenueReportDTO.PendingRow.builder()
                    .paymentCode(p.getPaymentCode())
                    .appointmentCode(appointmentCode)
                    .patientName(patientName)
                    .maskedPhone(privacyMaskingService.maskPhone(phone))
                    .amount(amount)
                    .createdAt(p.getCreatedAt())
                    .build());
        }

        return DailyRevenueReportDTO.builder()
                .reportDate(reportDate)
                .generatedBy(getCurrentUserName())
                .branch(BRANCH_NAME)
                .generatedAt(LocalDateTime.now())
                .totalRevenue(totalRevenue)
                .cashTotal(cashTotal)
                .cashTransactions(cashCount)
                .momoTotal(momoTotal)
                .momoTransactions(momoCount)
                .pendingPaymentsCount(pendingRows.size())
                .pendingPaymentsAmount(pendingAmount)
                .transactions(transactions)
                .pendingPayments(pendingRows)
                .cashDrawerExpectedBalance(cashTotal) // Cash drawer = total cash collected
                .build();
    }

    // ==================== 6.3 Queue Performance (Today Only) ====================

    @Override
    @Transactional(readOnly = true)
    public QueuePerformanceReportDTO getQueuePerformanceReport() {
        LocalDate today = LocalDate.now();
        log.info("Generating queue performance report for today: {}", today);

        // Fetch appointments with queue data
        List<Appointment> queueData = appointmentRepository.findQueuePerformanceData(today);

        // Overall metrics
        int totalCheckedIn = queueData.size(); // all that went through check-in
        List<Double> waitTimes = new ArrayList<>();

        for (Appointment a : queueData) {
            if (a.getCheckedInAt() != null && a.getConsultationStartedAt() != null) {
                double waitMinutes = ChronoUnit.MINUTES.between(a.getCheckedInAt(), a.getConsultationStartedAt());
                if (waitMinutes >= 0) {
                    waitTimes.add(waitMinutes);
                }
            }
        }

        double avgWait = waitTimes.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double longestWait = waitTimes.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);

        // No-show stats (all statuses for today)
        List<Object[]> allStatusCounts = appointmentRepository.countByStatusOnDate(today, null);
        int noShowCount = 0;
        int totalScheduled = 0;
        for (Object[] row : allStatusCounts) {
            AppointmentStatus status = (AppointmentStatus) row[0];
            int count = ((Long) row[1]).intValue();
            // Scheduled = those who should have attended
            if (status == AppointmentStatus.CONFIRMED || status == AppointmentStatus.CHECKED_IN
                    || status == AppointmentStatus.IN_PROGRESS || status == AppointmentStatus.COMPLETED
                    || status == AppointmentStatus.NO_SHOW) {
                totalScheduled += count;
            }
            if (status == AppointmentStatus.NO_SHOW) {
                noShowCount = count;
            }
        }
        double noShowRate = totalScheduled > 0 ? (noShowCount * 100.0 / totalScheduled) : 0.0;

        // Group by doctor
        Map<Long, List<Appointment>> byDoctor = queueData.stream()
                .collect(Collectors.groupingBy(a -> a.getDoctor().getId()));

        List<QueuePerformanceReportDTO.DoctorPerformance> doctorPerformances = new ArrayList<>();

        for (Map.Entry<Long, List<Appointment>> entry : byDoctor.entrySet()) {
            List<Appointment> doctorAppts = entry.getValue();
            Appointment sample = doctorAppts.get(0);

            int served = (int) doctorAppts.stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                    .count();
            int waiting = (int) doctorAppts.stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN)
                    .count();

            List<Double> doctorWaits = new ArrayList<>();
            Map<Integer, Integer> hourCounts = new HashMap<>();

            for (Appointment a : doctorAppts) {
                if (a.getCheckedInAt() != null && a.getConsultationStartedAt() != null) {
                    double wm = ChronoUnit.MINUTES.between(a.getCheckedInAt(), a.getConsultationStartedAt());
                    if (wm >= 0) doctorWaits.add(wm);
                }
                if (a.getCheckedInAt() != null) {
                    int hour = a.getCheckedInAt().getHour();
                    hourCounts.merge(hour, 1, Integer::sum);
                }
            }

            double dAvgWait = doctorWaits.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double dLongestWait = doctorWaits.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);

            // Peak hour
            String peakHour = "N/A";
            if (!hourCounts.isEmpty()) {
                int peakH = Collections.max(hourCounts.entrySet(), Map.Entry.comparingByValue()).getKey();
                peakHour = String.format("%02d:00 - %02d:00", peakH, peakH + 1);
            }

            doctorPerformances.add(QueuePerformanceReportDTO.DoctorPerformance.builder()
                    .doctorId(sample.getDoctor().getId())
                    .doctorName(sample.getDoctor().getFullName())
                    .room(sample.getDoctor().getCurrentRoom())
                    .patientsServed(served)
                    .patientsWaiting(waiting)
                    .avgWaitMinutes(Math.round(dAvgWait * 100.0) / 100.0)
                    .longestWaitMinutes(Math.round(dLongestWait * 100.0) / 100.0)
                    .peakHour(peakHour)
                    .build());
        }

        // Sort by patients served desc
        doctorPerformances.sort(Comparator.comparingInt(
                QueuePerformanceReportDTO.DoctorPerformance::getPatientsServed).reversed());

        return QueuePerformanceReportDTO.builder()
                .reportDate(today)
                .generatedBy(getCurrentUserName())
                .branch(BRANCH_NAME)
                .generatedAt(LocalDateTime.now())
                .totalCheckedIn(totalCheckedIn)
                .avgWaitMinutes(Math.round(avgWait * 100.0) / 100.0)
                .longestWaitMinutes(Math.round(longestWait * 100.0) / 100.0)
                .noShowRate(Math.round(noShowRate * 100.0) / 100.0)
                .noShowCount(noShowCount)
                .totalScheduled(totalScheduled)
                .byDoctor(doctorPerformances)
                .build();
    }

    // ==================== HELPER METHODS ====================

    /**
     * Get current authenticated user's full name for the "Generated by" watermark.
     */
    private String getCurrentUserName() {
        try {
            Long userId = SecurityUtil.getCurrentUserId();
            if (userId != null) {
                return userRepository.findById(userId)
                        .map(u -> u.getFullName())
                        .orElse("Receptionist");
            }
        } catch (Exception e) {
            log.trace("Could not get current user name", e);
        }
        return "Receptionist";
    }
}
