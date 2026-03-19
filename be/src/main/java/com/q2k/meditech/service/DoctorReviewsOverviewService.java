package com.q2k.meditech.service;

import com.q2k.meditech.dto.DoctorReviewsOverviewResponse;
import com.q2k.meditech.dto.DoctorReviewsStatsDTO;
import com.q2k.meditech.dto.DoctorReviewsStatsDTO.RatingDistributionItem;
import com.q2k.meditech.dto.ReviewListResponse;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.PrescriptionRepository;
import com.q2k.meditech.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DoctorReviewsOverviewService {

    private final ReviewService reviewService;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final ReviewRepository reviewRepository;
    private final DoctorRepository doctorRepository;

    public DoctorReviewsOverviewResponse getOverview(Long doctorId, Integer pageNumber, Integer pageSize) {
        if (doctorId == null) {
            throw new IllegalArgumentException("doctorId is required");
        }

        // 1) Reviews list (pagination)
        ReviewListResponse reviewPage = reviewService.getDoctorReviews(doctorId, pageNumber, pageSize);

        // 2) Doctor rating information stored on Doctor entity
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found with id=" + doctorId));

        BigDecimal averageRating = doctor.getRatingAvg() != null ? doctor.getRatingAvg() : BigDecimal.ZERO;
        int totalReviews = doctor.getRatingCount() != null ? doctor.getRatingCount() : 0;

        // 3) Recent reviews count (same definition as DoctorDashboardService)
        LocalDateTime since = LocalDateTime.now()
                .withDayOfMonth(1)
                .withHour(0)
                .withMinute(0)
                .withSecond(0);
        Long recent = reviewRepository.countByDoctorIdAndCreatedAtAfter(doctorId, since);
        long recentReviewsCount = recent != null ? recent : 0L;

        // 4) Rating breakdown (1..5)
        List<RatingDistributionItem> distribution = buildRatingDistribution(doctorId);

        // 5) Appointment / prescription / consultation-hour performance
        Long totalAppointments = appointmentRepository.countByDoctorId(doctorId);
        Long patientsTreated = appointmentRepository.countDistinctPatientsTreatedByDoctorId(doctorId);
        Long prescriptionsWritten = prescriptionRepository.countByDoctorId(doctorId);
        BigDecimal consultationHours = calculateConsultationHours(doctorId);

        DoctorReviewsStatsDTO stats = DoctorReviewsStatsDTO.builder()
                .totalAppointments(totalAppointments != null ? totalAppointments : 0L)
                .patientsTreated(patientsTreated != null ? patientsTreated : 0L)
                .prescriptionsWritten(prescriptionsWritten != null ? prescriptionsWritten : 0L)
                .consultationHours(consultationHours != null ? consultationHours : BigDecimal.ZERO)
                .averageRating(averageRating)
                .totalReviews(totalReviews)
                .recentReviewsCount(recentReviewsCount)
                .ratingDistribution(distribution)
                .build();

        return DoctorReviewsOverviewResponse.builder()
                .reviews(reviewPage.getReviews())
                .totalPages(reviewPage.getTotalPages())
                .totalElements(reviewPage.getTotalElements())
                .currentPage(reviewPage.getCurrentPage())
                .pageSize(reviewPage.getPageSize())
                .stats(stats)
                .build();
    }

    private List<RatingDistributionItem> buildRatingDistribution(Long doctorId) {
        List<Object[]> rows = reviewRepository.countReviewsByRatingForDoctor(doctorId);
        long[] counts = new long[6]; // index 1..5

        if (rows != null) {
            for (Object[] row : rows) {
                if (row == null || row.length < 2) continue;
                Integer rating = (Integer) row[0];
                Long count = (Long) row[1];
                if (rating != null && rating >= 1 && rating <= 5) {
                    counts[rating] = count != null ? count : 0L;
                }
            }
        }

        return IntStream.rangeClosed(1, 5)
                .mapToObj(star -> RatingDistributionItem.builder()
                        .rating(star)
                        .count(counts[star])
                        .build())
                .collect(Collectors.toList());
    }

    private BigDecimal calculateConsultationHours(Long doctorId) {
        List<Appointment> appts = appointmentRepository.findConsultationsWithDurationByDoctorIdAndStatus(
                doctorId, AppointmentStatus.COMPLETED);
        if (appts == null || appts.isEmpty()) {
            return BigDecimal.ZERO;
        }

        long totalMinutes = 0L;
        for (Appointment a : appts) {
            if (a == null || a.getConsultationStartedAt() == null || a.getConsultationEndedAt() == null) continue;
            long minutes = ChronoUnit.MINUTES.between(a.getConsultationStartedAt(), a.getConsultationEndedAt());
            if (minutes > 0) {
                totalMinutes += minutes;
            }
        }

        return BigDecimal.valueOf(totalMinutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }
}

