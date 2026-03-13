package com.q2k.meditech.service;

import com.q2k.meditech.dto.DoctorDashboardDTO;
import com.q2k.meditech.dto.DoctorDashboardDTO.*;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.Notification;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.NotificationRepository;
import com.q2k.meditech.repository.ReviewRepository;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for Doctor Dashboard statistics.
 * Security: No symptoms/diagnosis exposed. Only counts, slots, and times.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DoctorDashboardService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Get full dashboard data for a doctor.
     * @param doctorId Doctor entity ID (not user ID)
     * @param userId   User ID (for notifications)
     * @return DoctorDashboardDTO with all cards and panels
     */
    public DoctorDashboardDTO getDashboard(Long doctorId, Long userId) {
        log.info("Building dashboard for doctor ID: {}", doctorId);

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // Get today's appointments (one query with JOIN FETCH, then process in-memory)
        List<Appointment> todayAppointments = appointmentRepository
                .findByDoctorIdAndDateForDashboard(doctorId, today);

        // Use name from users table (updated by profile edit) instead of doctors table
        String displayName = userRepository.findById(userId)
                .map(u -> u.getFullName())
                .orElse(doctor.getFullName());

        return DoctorDashboardDTO.builder()
                .doctorId(doctorId)
                .doctorName(displayName)
                .todayAppointments(buildTodayAppointmentsCard(todayAppointments))
                .patientsWaiting(buildPatientsWaitingCard(todayAppointments, now))
                .inProgress(buildInProgressCard(todayAppointments, now))
                .upcoming(buildUpcomingCard(todayAppointments, now))
                .noShowRate(buildNoShowRateCard(doctorId, today))
                .rating(buildRatingCard(doctor, doctorId))
                .nextPatient(buildNextPatientPanel(todayAppointments))
                .notifications(buildNotifications(userId))
                .unreadNotificationCount(notificationRepository.countByUserIdAndIsRead(userId, false))
                .quickActions(buildQuickActions(todayAppointments))
                .generatedAt(LocalDateTime.now())
                .build();
    }

    // ==========================================
    // Card 1: Today's Appointments
    // ==========================================
    private TodayAppointmentsCard buildTodayAppointmentsCard(List<Appointment> appointments) {
        return TodayAppointmentsCard.builder()
                .total((long) appointments.size())
                .pending(countByStatus(appointments, AppointmentStatus.PENDING))
                .confirmed(countByStatus(appointments, AppointmentStatus.CONFIRMED))
                .checkedIn(countByStatus(appointments, AppointmentStatus.CHECKED_IN))
                .inProgress(countByStatus(appointments, AppointmentStatus.IN_PROGRESS))
                .completed(countByStatus(appointments, AppointmentStatus.COMPLETED))
                .cancelled(countByStatus(appointments, AppointmentStatus.CANCELLED))
                .noShow(countByStatus(appointments, AppointmentStatus.NO_SHOW))
                .rescheduled(countByStatus(appointments, AppointmentStatus.RESCHEDULED))
                .build();
    }

    // ==========================================
    // Card 2: Patients Waiting
    // ==========================================
    private PatientsWaitingCard buildPatientsWaitingCard(List<Appointment> todayAppointments, LocalTime now) {
        // Patients waiting = CHECKED_IN status (checked in, waiting for consultation)
        List<Appointment> waitingAppointments = todayAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN)
                .collect(Collectors.toList());

        long waitingCount = waitingAppointments.size();
        double avgWaitTime = 0;
        long maxWaitTime = 0;
        long longWaitCount = 0;

        if (waitingCount > 0) {
            LocalDateTime nowDateTime = LocalDateTime.now();

            for (Appointment a : waitingAppointments) {
                long waitMinutes = 0;
                if (a.getCheckedInAt() != null) {
                    waitMinutes = ChronoUnit.MINUTES.between(a.getCheckedInAt(), nowDateTime);
                }
                avgWaitTime += waitMinutes;
                if (waitMinutes > maxWaitTime) {
                    maxWaitTime = waitMinutes;
                }
                if (waitMinutes > 30) {
                    longWaitCount++;
                }
            }
            avgWaitTime = avgWaitTime / waitingCount;
        }

        return PatientsWaitingCard.builder()
                .waitingCount(waitingCount)
                .avgWaitTimeMinutes(Math.round(avgWaitTime * 10.0) / 10.0)
                .maxWaitTimeMinutes(maxWaitTime)
                .hasLongWaitAlert(longWaitCount > 0)
                .longWaitCount(longWaitCount)
                .build();
    }

    // ==========================================
    // Card 3: In Progress
    // ==========================================
    private InProgressCard buildInProgressCard(List<Appointment> todayAppointments, LocalTime now) {
        // Find appointment with IN_PROGRESS status
        Appointment inProgressAppt = todayAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.IN_PROGRESS)
                .findFirst()
                .orElse(null);

        if (inProgressAppt == null) {
            return InProgressCard.builder()
                    .isExamining(false)
                    .currentAppointmentId(null)
                    .currentPatientName(null)
                    .startedAt(null)
                    .elapsedMinutes(0L)
                    .scheduledStartTime(null)
                    .scheduledEndTime(null)
                    .build();
        }

        // Estimate start time: use updatedAt (when status changed to IN_PROGRESS)
        // or fall back to scheduled start time
        LocalTime startedAt = inProgressAppt.getStartTime();
        long elapsedMinutes = 0;

        if (inProgressAppt.getUpdatedAt() != null) {
            LocalTime actualStart = inProgressAppt.getUpdatedAt().toLocalTime();
            startedAt = actualStart;
            elapsedMinutes = ChronoUnit.MINUTES.between(actualStart, now);
        } else {
            elapsedMinutes = ChronoUnit.MINUTES.between(inProgressAppt.getStartTime(), now);
        }

        // Get patient name securely (only name, no PHI)
        String patientName = null;
        try {
            patientName = inProgressAppt.getPatient().getUser().getFullName();
        } catch (Exception e) {
            log.warn("Could not load patient name for appointment {}", inProgressAppt.getId());
        }

        return InProgressCard.builder()
                .isExamining(true)
                .currentAppointmentId(inProgressAppt.getId())
                .currentPatientName(patientName)
                .startedAt(startedAt)
                .elapsedMinutes(Math.max(0, elapsedMinutes))
                .scheduledStartTime(inProgressAppt.getStartTime())
                .scheduledEndTime(inProgressAppt.getEndTime())
                .build();
    }

    // ==========================================
    // Card 4: Upcoming (Next 2 hours)
    // ==========================================
    private UpcomingCard buildUpcomingCard(List<Appointment> todayAppointments, LocalTime now) {
        LocalTime twoHoursLater = now.plusHours(2);

        // Filter: appointments that start after now and within 2 hours
        // Status should be CONFIRMED or CHECKED_IN (active appointments)
        List<Appointment> upcomingAppointments = todayAppointments.stream()
                .filter(a -> a.getStartTime().isAfter(now) && !a.getStartTime().isAfter(twoHoursLater))
                .filter(a -> a.getStatus() == AppointmentStatus.CONFIRMED
                        || a.getStatus() == AppointmentStatus.CHECKED_IN
                        || a.getStatus() == AppointmentStatus.PENDING)
                .sorted((a1, a2) -> a1.getStartTime().compareTo(a2.getStartTime()))
                .collect(Collectors.toList());

        NextAppointmentInfo nextInfo = null;
        if (!upcomingAppointments.isEmpty()) {
            Appointment next = upcomingAppointments.get(0);
            String patientName = null;
            try {
                patientName = next.getPatient().getUser().getFullName();
            } catch (Exception e) {
                log.warn("Could not load patient name for next appointment {}", next.getId());
            }

            nextInfo = NextAppointmentInfo.builder()
                    .appointmentId(next.getId())
                    .patientName(patientName)
                    .startTime(next.getStartTime())
                    .endTime(next.getEndTime())
                    .queueNumber(next.getQueueNumber())
                    .build();
        }

        return UpcomingCard.builder()
                .count((long) upcomingAppointments.size())
                .nextAppointment(nextInfo)
                .build();
    }

    // ==========================================
    // Card 5: No-show Rate (This week)
    // ==========================================
    private NoShowRateCard buildNoShowRateCard(Long doctorId, LocalDate today) {
        // This week: Monday to Sunday
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        Long totalWeek = appointmentRepository.countByDoctorIdAndDateRange(doctorId, weekStart, weekEnd);
        Long noShowCount = appointmentRepository.countByDoctorIdAndStatusAndDateRange(
                doctorId, AppointmentStatus.NO_SHOW, weekStart, weekEnd);

        double noShowRate = 0;
        if (totalWeek != null && totalWeek > 0) {
            noShowRate = (noShowCount.doubleValue() / totalWeek.doubleValue()) * 100;
            noShowRate = Math.round(noShowRate * 10.0) / 10.0;
        }

        return NoShowRateCard.builder()
                .noShowRatePercent(noShowRate)
                .noShowCount(noShowCount != null ? noShowCount : 0L)
                .totalWeekAppointments(totalWeek != null ? totalWeek : 0L)
                .build();
    }

    // ==========================================
    // Card 6: Rating
    // ==========================================
    private RatingCard buildRatingCard(Doctor doctor, Long doctorId) {
        // Use the pre-calculated rating from Doctor entity
        Long recentReviewsCount = reviewRepository.countByDoctorIdAndCreatedAtAfter(
                doctorId, LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0));

        return RatingCard.builder()
                .averageRating(doctor.getRatingAvg())
                .totalReviews(doctor.getRatingCount())
                .recentReviewsCount(recentReviewsCount != null ? recentReviewsCount : 0L)
                .build();
    }

    // ==========================================
    // Panel: Next Patient in queue
    // ==========================================
    private NextPatientPanel buildNextPatientPanel(List<Appointment> todayAppointments) {
        // Find the next CHECKED_IN patient sorted by queue number
        Appointment next = todayAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN)
                .sorted(Comparator.comparing(
                        a -> a.getQueueNumber() != null ? a.getQueueNumber() : Integer.MAX_VALUE))
                .findFirst()
                .orElse(null);

        if (next == null) {
            return null;
        }

        String patientName = null;
        Integer age = null;
        String gender = null;
        try {
            patientName = next.getPatient().getUser().getFullName();
            if (next.getPatient().getDateOfBirth() != null) {
                age = Period.between(next.getPatient().getDateOfBirth(), LocalDate.now()).getYears();
            }
            gender = next.getPatient().getGender();
        } catch (Exception e) {
            log.warn("Could not load patient details for appointment {}", next.getId());
        }

        return NextPatientPanel.builder()
                .appointmentId(next.getId())
                .patientName(patientName)
                .age(age)
                .gender(gender)
                .appointmentCode(next.getAppointmentCode())
                .queueNumber(next.getQueueNumber())
                .startTime(next.getStartTime())
                .endTime(next.getEndTime())
                .status(next.getStatus().name())
                .reasonForVisit(next.getReasonForVisit())
                .build();
    }

    // ==========================================
    // Panel: Recent Notifications (last 5)
    // ==========================================
    private List<NotificationItem> buildNotifications(Long userId) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(n -> NotificationItem.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .type(n.getType() != null ? n.getType().name() : null)
                        .referenceType(n.getReferenceType())
                        .referenceId(n.getReferenceId())
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ==========================================
    // Quick Actions
    // ==========================================
    private QuickActionsData buildQuickActions(List<Appointment> todayAppointments) {
        return QuickActionsData.builder()
                .pendingConfirmations(countByStatus(todayAppointments, AppointmentStatus.PENDING))
                .checkedInCount(countByStatus(todayAppointments, AppointmentStatus.CHECKED_IN))
                .todayTotal((long) todayAppointments.size())
                .build();
    }

    // ==========================================
    // Helper methods
    // ==========================================
    private Long countByStatus(List<Appointment> appointments, AppointmentStatus status) {
        return appointments.stream()
                .filter(a -> a.getStatus() == status)
                .count();
    }
}
