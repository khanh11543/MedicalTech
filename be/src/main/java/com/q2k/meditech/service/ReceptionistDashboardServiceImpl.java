package com.q2k.meditech.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.dto.AppointmentDTO;
import com.q2k.meditech.dto.AppointmentFilterDTO;
import com.q2k.meditech.dto.NoShowDTO;
import com.q2k.meditech.dto.ReceptionistAppointmentListDTO;
import com.q2k.meditech.dto.receptionist.*;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Payment;
import com.q2k.meditech.entity.SystemSetting;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.PaymentRepository;
import com.q2k.meditech.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of ReceptionistDashboardService.
 * Aggregates data from appointments, payments, and queue management.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReceptionistDashboardServiceImpl implements ReceptionistDashboardService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentService appointmentService;
    private final PaymentRepository paymentRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final ObjectMapper objectMapper;
    private final PrivacyMaskingService privacyMaskingService;

    private static final String PREF_KEY_PREFIX = "receptionist.dashboard.preferences.";
    private static final int NO_SHOW_THRESHOLD_MINUTES = 15;

    // ==================== A. DASHBOARD STATS ====================

    @Override
    @Transactional(readOnly = true)
    public ReceptionistDashboardStatsDTO getDashboardStats(LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        log.info("Getting dashboard stats for date: {}", targetDate);

        // Single aggregate query for all status counts (replaces 12 individual COUNT queries)
        List<Object[]> statusCounts = appointmentRepository.countAllStatusesOnDate(targetDate);
        Map<AppointmentStatus, Long> countMap = new EnumMap<>(AppointmentStatus.class);
        long todayTotal = 0;
        for (Object[] row : statusCounts) {
            AppointmentStatus status = (AppointmentStatus) row[0];
            Long count = (Long) row[1];
            countMap.put(status, count);
            todayTotal += count;
        }

        Long pending = countMap.getOrDefault(AppointmentStatus.PENDING, 0L);
        Long confirmed = countMap.getOrDefault(AppointmentStatus.CONFIRMED, 0L);
        Long checkedIn = countMap.getOrDefault(AppointmentStatus.CHECKED_IN, 0L);
        Long inProgress = countMap.getOrDefault(AppointmentStatus.IN_PROGRESS, 0L);
        Long completed = countMap.getOrDefault(AppointmentStatus.COMPLETED, 0L);
        Long cancelled = countMap.getOrDefault(AppointmentStatus.CANCELLED, 0L);
        Long noShow = countMap.getOrDefault(AppointmentStatus.NO_SHOW, 0L);

        // Awaiting check-in = CONFIRMED appointments (not yet checked in)
        Long awaitingCheckIn = confirmed;

        // Queue: CHECKED_IN patients waiting
        Long totalInQueue = checkedIn;

        // Active doctors today
        Long activeDoctors = appointmentRepository.countDistinctDoctors(targetDate, targetDate);

        // Overdue: CONFIRMED appointments past their start time
        Long overdueCount = countOverdueAppointments(targetDate);

        // Payment stats for today
        BigDecimal todayRevenue = BigDecimal.ZERO;
        Long pendingPayments = 0L;
        BigDecimal pendingPaymentAmount = BigDecimal.ZERO;
        Long completedPayments = 0L;

        LocalDateTime dayStart = targetDate.atStartOfDay();
        LocalDateTime dayEnd = targetDate.atTime(23, 59, 59);

        try {
            // Today's revenue (PAID payments where paidAt is today)
            todayRevenue = paymentRepository.sumAmountByStatusInDateRange("PAID", dayStart, dayEnd);
            if (todayRevenue == null) todayRevenue = BigDecimal.ZERO;

            // Completed payment count for today
            completedPayments = paymentRepository.countCompletedInDateRange(dayStart, dayEnd);
            if (completedPayments == null) completedPayments = 0L;

            // Pending payments (PENDING status with COMPLETED appointment - ready for collection)
            Object[] pendingPaymentStats = paymentRepository.countPendingPaymentsWithCompletedAppointment();
            if (pendingPaymentStats != null && pendingPaymentStats.length >= 2) {
                if (pendingPaymentStats[0] instanceof Number) {
                    pendingPayments = ((Number) pendingPaymentStats[0]).longValue();
                }
                if (pendingPaymentStats[1] instanceof Number) {
                    pendingPaymentAmount = new BigDecimal(pendingPaymentStats[1].toString());
                }
            }
        } catch (Exception e) {
            log.warn("Error getting payment stats: {}", e.getMessage());
        }

        // Average wait time
        Double avgWait = calculateAverageWaitTime(targetDate);

        return ReceptionistDashboardStatsDTO.builder()
                .todayTotalAppointments(todayTotal)
                .pendingAppointments(pending)
                .confirmedAppointments(confirmed)
                .completedAppointments(completed)
                .cancelledAppointments(cancelled)
                .checkedInCount(checkedIn)
                .awaitingCheckIn(awaitingCheckIn)
                .inProgressCount(inProgress)
                .totalInQueue(totalInQueue)
                .activeDoctors(activeDoctors != null ? activeDoctors.intValue() : 0)
                .avgWaitTimeMinutes(avgWait)
                .noShowCount(noShow)
                .overdueCount(overdueCount)
                .todayRevenue(todayRevenue)
                .pendingPayments(pendingPayments)
                .pendingPaymentAmount(pendingPaymentAmount)
                .completedPayments(completedPayments)
                .build();
    }

    // ==================== B. TODAY'S APPOINTMENTS ====================

    @Override
    @Transactional(readOnly = true)
    public Page<ReceptionistAppointmentListDTO> getTodayAppointments(
            String status, int pageNumber, int pageSize, String sortBy, String sortOrder) {

        LocalDate today = LocalDate.now();
        log.info("Getting today's appointments - status: {}, page: {}", status, pageNumber);

        boolean needsPaymentFilter = "NEEDS_PAYMENT".equalsIgnoreCase(status);

        AppointmentFilterDTO filter = AppointmentFilterDTO.builder()
                .from(today)
                .to(today)
                // For NEEDS_PAYMENT, fetch COMPLETED appointments; otherwise use provided status
                .status(needsPaymentFilter ? AppointmentStatus.COMPLETED
                        : (status != null ? AppointmentStatus.valueOf(status.toUpperCase()) : null))
                .sortBy(sortBy != null ? sortBy : "startTime")
                .sortDir(sortOrder != null ? sortOrder : "ASC")
                .pageNumber(needsPaymentFilter ? 0 : pageNumber)
                .pageSize(needsPaymentFilter ? 200 : pageSize) // fetch more for client-side payment filtering
                .build();

        Page<AppointmentDTO> fullPage = appointmentService.getAllAppointments(filter);

        // Batch-load payments for all appointments in this page
        List<Long> appointmentIds = fullPage.getContent().stream()
                .map(AppointmentDTO::getId)
                .collect(Collectors.toList());

        Map<Long, Payment> paymentMap = new HashMap<>();
        if (!appointmentIds.isEmpty()) {
            List<Payment> payments = paymentRepository.findByAppointmentIdIn(appointmentIds);
            for (Payment p : payments) {
                paymentMap.put(p.getAppointment().getId(), p);
            }
        }

        // Map DTOs with payment info
        List<ReceptionistAppointmentListDTO> enriched = fullPage.getContent().stream()
                .map(dto -> {
                    Payment payment = paymentMap.get(dto.getId());
                    String payStatus = payment != null ? payment.getPaymentStatus() : null;
                    BigDecimal fee = payment != null ? payment.getTotalAmount() : null;
                    Long paymentId = payment != null ? payment.getId() : null;
                    String phone = privacyMaskingService.maskPhone(dto.getPatientPhone());
                    return ReceptionistAppointmentListDTO.fromAppointmentDTO(dto, payStatus, fee, paymentId, phone);
                })
                .collect(Collectors.toList());

        // If NEEDS_PAYMENT, filter to only those with PENDING payment (or no payment yet)
        if (needsPaymentFilter) {
            enriched = enriched.stream()
                    .filter(dto -> dto.getPaymentStatus() == null
                            || "PENDING".equalsIgnoreCase(dto.getPaymentStatus()))
                    .collect(Collectors.toList());

            // Manual pagination
            int total = enriched.size();
            int start = Math.min(pageNumber * pageSize, total);
            int end = Math.min(start + pageSize, total);
            List<ReceptionistAppointmentListDTO> pagedList = enriched.subList(start, end);

            return new PageImpl<>(pagedList,
                    PageRequest.of(pageNumber, pageSize),
                    total);
        }

        return new PageImpl<>(enriched, fullPage.getPageable(), fullPage.getTotalElements());
    }

    // ==================== C. UPCOMING APPOINTMENTS ====================

    @Override
    @Transactional(readOnly = true)
    public List<UpcomingAppointmentDTO> getTodayUpcoming(int limit) {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        log.info("Getting upcoming appointments - limit: {}", limit);

        // Use targeted query: only CONFIRMED for today, with startTime after now
        List<Appointment> todayAppointments = appointmentRepository.findConfirmedAppointmentsByDate(today);

        return todayAppointments.stream()
                .filter(a -> a.getStartTime() != null && a.getStartTime().isAfter(now))
                .sorted(Comparator.comparing(Appointment::getStartTime))
                .limit(limit)
                .map(a -> UpcomingAppointmentDTO.builder()
                        .id(a.getId())
                        .appointmentCode(a.getAppointmentCode())
                        .patientName(a.getPatient() != null && a.getPatient().getUser() != null
                                ? a.getPatient().getUser().getFullName() : "N/A")
                        .maskedPhone(privacyMaskingService.maskPhone(a.getPatient() != null && a.getPatient().getUser() != null
                                ? a.getPatient().getUser().getPhone() : null))
                        .doctorName(a.getDoctor() != null ? a.getDoctor().getFullName() : "N/A")
                        .doctorSpecialization(a.getDoctor() != null ? a.getDoctor().getSpecialization() : null)
                        .appointmentDate(a.getAppointmentDate())
                        .startTime(a.getStartTime())
                        .endTime(a.getEndTime())
                        .status(a.getStatus())
                        .queueNumber(a.getQueueNumber())
                        .minutesUntilStart((int) ChronoUnit.MINUTES.between(now, a.getStartTime()))
                        .build())
                .toList();
    }

    // ==================== D. QUEUE STATUS ====================

    @Override
    @Transactional(readOnly = true)
    public List<DoctorQueueStatusDTO> getQueueStatus() {
        LocalDate today = LocalDate.now();
        log.info("Getting queue status for today");

        List<Appointment> todayAppointments = appointmentRepository.findByDateRange(today, today);

        // Group by doctor
        Map<Long, List<Appointment>> byDoctor = todayAppointments.stream()
                .filter(a -> a.getDoctor() != null)
                .collect(Collectors.groupingBy(a -> a.getDoctor().getId()));

        return byDoctor.entrySet().stream()
                .map(entry -> {
                    List<Appointment> doctorAppts = entry.getValue();
                    Appointment sample = doctorAppts.get(0);

                    int total = doctorAppts.size();
                    int checkedInWaiting = (int) doctorAppts.stream()
                            .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN).count();
                    int inProgressCount = (int) doctorAppts.stream()
                            .filter(a -> a.getStatus() == AppointmentStatus.IN_PROGRESS).count();
                    int completedCount = (int) doctorAppts.stream()
                            .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
                    int noShowCount = (int) doctorAppts.stream()
                            .filter(a -> a.getStatus() == AppointmentStatus.NO_SHOW).count();

                    // Current queue number = max queue number of IN_PROGRESS appointments
                    Integer currentQueue = doctorAppts.stream()
                            .filter(a -> a.getStatus() == AppointmentStatus.IN_PROGRESS && a.getQueueNumber() != null)
                            .map(Appointment::getQueueNumber)
                            .max(Integer::compareTo)
                            .orElse(null);

                    // Next queue = min queue number among CHECKED_IN
                    Integer nextQueue = doctorAppts.stream()
                            .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN && a.getQueueNumber() != null)
                            .map(Appointment::getQueueNumber)
                            .min(Integer::compareTo)
                            .orElse(null);

                    // Estimated wait: checkedInWaiting * avg slot minutes (roughly 30 min)
                    Double estimatedWait = checkedInWaiting > 0 ? checkedInWaiting * 30.0 : 0.0;

                    return DoctorQueueStatusDTO.builder()
                            .doctorId(sample.getDoctor().getId())
                            .doctorName(sample.getDoctor().getFullName())
                            .specialization(sample.getDoctor().getSpecialization())
                            .totalAppointmentsToday(total)
                            .checkedInWaiting(checkedInWaiting)
                            .inProgress(inProgressCount)
                            .completed(completedCount)
                            .noShow(noShowCount)
                            .currentQueueNumber(currentQueue)
                            .nextQueueNumber(nextQueue)
                            .estimatedWaitMinutes(estimatedWait)
                            .build();
                })
                .sorted(Comparator.comparing(DoctorQueueStatusDTO::getDoctorName))
                .toList();
    }

    // ==================== E. CALL NEXT PATIENT ====================

    @Override
    @Transactional
    public QueueCallResultDTO callNextPatient(Long doctorId, CallNextDTO dto, Long receptionistUserId) {
        LocalDate today = LocalDate.now();
        log.info("Calling next patient for doctorId: {}, by receptionist: {}", doctorId, receptionistUserId);

        List<Appointment> doctorAppts = appointmentRepository.findByDoctorIdAndDate(doctorId, today);

        // Find the next CHECKED_IN appointment (by queue number)
        Optional<Appointment> nextPatient;

        if (dto != null && dto.getQueueNumber() != null) {
            // Specific queue number requested
            nextPatient = doctorAppts.stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN
                            && a.getQueueNumber() != null
                            && a.getQueueNumber().equals(dto.getQueueNumber()))
                    .findFirst();
        } else {
            // Next in queue (lowest queue number among CHECKED_IN)
            nextPatient = doctorAppts.stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN && a.getQueueNumber() != null)
                    .min(Comparator.comparing(Appointment::getQueueNumber));
        }

        if (nextPatient.isEmpty()) {
            return QueueCallResultDTO.builder()
                    .success(false)
                    .message("No patients waiting in queue for this doctor")
                    .remainingInQueue(0)
                    .build();
        }

        // Transition the appointment from CHECKED_IN → IN_PROGRESS
        Appointment appointment = nextPatient.get();
        AppointmentDTO result = appointmentService.startConsultation(appointment.getId(), receptionistUserId, "RECEPTIONIST");

        // Count remaining CHECKED_IN
        int remaining = (int) doctorAppts.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN
                        && !a.getId().equals(appointment.getId()))
                .count();

        // Next in queue after this one
        Integer nextQueue = doctorAppts.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN
                        && !a.getId().equals(appointment.getId())
                        && a.getQueueNumber() != null)
                .map(Appointment::getQueueNumber)
                .min(Integer::compareTo)
                .orElse(null);

        return QueueCallResultDTO.builder()
                .success(true)
                .message("Patient called successfully")
                .appointmentId(appointment.getId())
                .appointmentCode(appointment.getAppointmentCode())
                .patientName(appointment.getPatient() != null && appointment.getPatient().getUser() != null
                        ? appointment.getPatient().getUser().getFullName() : "N/A")
                .maskedPhone(privacyMaskingService.maskPhone(appointment.getPatient() != null && appointment.getPatient().getUser() != null
                        ? appointment.getPatient().getUser().getPhone() : null))
                .queueNumber(appointment.getQueueNumber())
                .startTime(appointment.getStartTime())
                .newStatus(AppointmentStatus.IN_PROGRESS)
                .remainingInQueue(remaining)
                .nextQueueNumber(nextQueue)
                .build();
    }

    // ==================== F. PENDING ACTIONS ====================

    @Override
    @Transactional(readOnly = true)
    public PendingActionsDTO getPendingActions() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        log.info("Getting pending actions");

        Long needConfirmation = appointmentRepository.countByStatusInRange(today, today, null, AppointmentStatus.PENDING);
        Long awaitingCheckIn = appointmentRepository.countByStatusInRange(today, today, null, AppointmentStatus.CONFIRMED);
        Long inQueue = appointmentRepository.countByStatusInRange(today, today, null, AppointmentStatus.CHECKED_IN);

        // Overdue: CONFIRMED, past start time
        Long overdue = countOverdueAppointments(today);

        // Pending payments (PENDING status with COMPLETED appointment)
        Long pendingPayments = 0L;
        try {
            Object[] stats = paymentRepository.countPendingPaymentsWithCompletedAppointment();
            if (stats != null && stats.length >= 1 && stats[0] instanceof Number) {
                pendingPayments = ((Number) stats[0]).longValue();
            }
        } catch (Exception e) {
            log.warn("Error getting pending payment count: {}", e.getMessage());
        }

        // No-show candidates: CONFIRMED, past start time by > threshold
        Long noShowCandidates = countNoShowCandidates(today);

        return PendingActionsDTO.builder()
                .needConfirmation(needConfirmation)
                .awaitingCheckIn(awaitingCheckIn)
                .overdueAppointments(overdue)
                .pendingPayments(pendingPayments)
                .inQueueCount(inQueue)
                .noShowCandidates(noShowCandidates)
                .build();
    }

    // ==================== G. NEED CONFIRMATION ====================

    @Override
    @Transactional(readOnly = true)
    public Page<AppointmentConfirmDTO> getNeedConfirmation(int pageNumber, int pageSize) {
        LocalDate today = LocalDate.now();
        log.info("Getting appointments needing confirmation - page: {}", pageNumber);

        List<Appointment> pending = appointmentRepository.findPendingAppointmentsByDate(today);

        List<AppointmentConfirmDTO> dtos = pending.stream()
                .sorted(Comparator.comparing(Appointment::getStartTime))
                .map(a -> AppointmentConfirmDTO.builder()
                        .id(a.getId())
                        .appointmentCode(a.getAppointmentCode())
                        .patientName(a.getPatient() != null && a.getPatient().getUser() != null
                                ? a.getPatient().getUser().getFullName() : "N/A")
                        .maskedPhone(privacyMaskingService.maskPhone(a.getPatient() != null && a.getPatient().getUser() != null
                                ? a.getPatient().getUser().getPhone() : null))
                        .doctorName(a.getDoctor() != null ? a.getDoctor().getFullName() : "N/A")
                        .doctorSpecialization(a.getDoctor() != null ? a.getDoctor().getSpecialization() : null)
                        .appointmentDate(a.getAppointmentDate())
                        .startTime(a.getStartTime())
                        .endTime(a.getEndTime())
                        .status(a.getStatus())
                        .bookedByType(a.getBookedBy() != null ? a.getBookedBy().name() : null)
                        .build())
                .toList();

        return paginateList(dtos, pageNumber, pageSize);
    }

    // ==================== H. NO-SHOW LIST ====================

    @Override
    @Transactional(readOnly = true)
    public Page<NoShowAppointmentDTO> getNoShowCandidates(int pageNumber, int pageSize) {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        log.info("Getting no-show candidates - page: {}", pageNumber);

        // Get CONFIRMED appointments past their start time
        List<Appointment> confirmedToday = appointmentRepository.findConfirmedAppointmentsByDate(today);

        List<NoShowAppointmentDTO> dtos = confirmedToday.stream()
                .filter(a -> a.getStartTime() != null && a.getStartTime().isBefore(now))
                .sorted(Comparator.comparing(a -> a.getStartTime()))
                .map(a -> {
                    int minutesOverdue = (int) ChronoUnit.MINUTES.between(a.getStartTime(), now);
                    return NoShowAppointmentDTO.builder()
                            .id(a.getId())
                            .appointmentCode(a.getAppointmentCode())
                            .patientName(a.getPatient() != null && a.getPatient().getUser() != null
                                    ? a.getPatient().getUser().getFullName() : "N/A")
                            .maskedPhone(privacyMaskingService.maskPhone(a.getPatient() != null && a.getPatient().getUser() != null
                                    ? a.getPatient().getUser().getPhone() : null))
                            .doctorName(a.getDoctor() != null ? a.getDoctor().getFullName() : "N/A")
                            .doctorSpecialization(a.getDoctor() != null ? a.getDoctor().getSpecialization() : null)
                            .appointmentDate(a.getAppointmentDate())
                            .startTime(a.getStartTime())
                            .endTime(a.getEndTime())
                            .minutesOverdue(minutesOverdue)
                            .currentStatus(a.getStatus().name())
                            .build();
                })
                .toList();

        return paginateList(dtos, pageNumber, pageSize);
    }

    // ==================== J. PREFERENCES ====================

    @Override
    @Transactional(readOnly = true)
    public DashboardPreferencesDTO getPreferences(Long userId) {
        String key = PREF_KEY_PREFIX + userId;
        log.info("Getting dashboard preferences for userId: {}", userId);

        return systemSettingRepository.findBySettingKey(key)
                .map(setting -> {
                    try {
                        return objectMapper.readValue(setting.getSettingValue(), DashboardPreferencesDTO.class);
                    } catch (JsonProcessingException e) {
                        log.warn("Failed to parse dashboard preferences for userId: {}", userId);
                        return getDefaultPreferences();
                    }
                })
                .orElse(getDefaultPreferences());
    }

    @Override
    @Transactional
    public DashboardPreferencesDTO updatePreferences(Long userId, DashboardPreferencesDTO dto) {
        String key = PREF_KEY_PREFIX + userId;
        log.info("Updating dashboard preferences for userId: {}", userId);

        try {
            String jsonValue = objectMapper.writeValueAsString(dto);

            SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                    .orElseGet(() -> {
                        SystemSetting newSetting = new SystemSetting();
                        newSetting.setSettingKey(key);
                        newSetting.setSettingGroup("receptionist_dashboard");
                        newSetting.setDescription("Dashboard preferences for receptionist user " + userId);
                        return newSetting;
                    });

            setting.setSettingValue(jsonValue);
            systemSettingRepository.save(setting);

            return dto;
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize dashboard preferences", e);
            throw new RuntimeException("Failed to save preferences");
        }
    }

    // ==================== HELPER METHODS ====================

    private DashboardPreferencesDTO getDefaultPreferences() {
        return DashboardPreferencesDTO.builder().build();
    }

    // masking is now handled by PrivacyMaskingService

    private Long countOverdueAppointments(LocalDate date) {
        LocalTime now = LocalTime.now();
        List<Appointment> confirmed = appointmentRepository.findConfirmedAppointmentsByDate(date);
        return confirmed.stream()
                .filter(a -> a.getStartTime() != null && a.getStartTime().isBefore(now))
                .count();
    }

    private Long countNoShowCandidates(LocalDate date) {
        LocalTime now = LocalTime.now();
        LocalTime threshold = now.minusMinutes(NO_SHOW_THRESHOLD_MINUTES);
        List<Appointment> confirmed = appointmentRepository.findConfirmedAppointmentsByDate(date);
        return confirmed.stream()
                .filter(a -> a.getStartTime() != null && a.getStartTime().isBefore(threshold))
                .count();
    }

    private Double calculateAverageWaitTime(LocalDate date) {
        try {
            List<Appointment> completed = appointmentRepository.findCompletedWithTimestamps(date, date, null);
            if (completed.isEmpty()) return 0.0;

            double totalWait = completed.stream()
                    .filter(a -> a.getCheckedInAt() != null && a.getConsultationStartedAt() != null)
                    .mapToDouble(a -> ChronoUnit.MINUTES.between(a.getCheckedInAt(), a.getConsultationStartedAt()))
                    .sum();

            long count = completed.stream()
                    .filter(a -> a.getCheckedInAt() != null && a.getConsultationStartedAt() != null)
                    .count();

            return count > 0 ? Math.round(totalWait / count * 10.0) / 10.0 : 0.0;
        } catch (Exception e) {
            log.warn("Error calculating average wait time: {}", e.getMessage());
            return 0.0;
        }
    }

    /**
     * Paginate a list into a Spring Page.
     */
    private <T> Page<T> paginateList(List<T> list, int pageNumber, int pageSize) {
        int start = pageNumber * pageSize;
        int end = Math.min(start + pageSize, list.size());
        List<T> pageContent = start < list.size() ? list.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, PageRequest.of(pageNumber, pageSize), list.size());
    }
}
