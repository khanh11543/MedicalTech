package com.q2k.meditech.service;

import com.q2k.meditech.dto.ReviewListResponse;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.PrescriptionRepository;
import com.q2k.meditech.repository.ReviewRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorReviewsOverviewServiceTest {

    @Mock
    private ReviewService reviewService;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private DoctorReviewsOverviewService service;

    @Test
    void getOverview_nullDoctorId_throws() {
        assertThatThrownBy(() -> service.getOverview(null, 0, 10)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void getOverview_buildsResponse() {
        ReviewListResponse reviews = new ReviewListResponse();
        reviews.setReviews(List.of());
        reviews.setTotalPages(0);
        reviews.setTotalElements(0L);
        reviews.setCurrentPage(0);
        reviews.setPageSize(20);
        when(reviewService.getDoctorReviews(1L, 0, 20)).thenReturn(reviews);

        Doctor doc = Doctor.builder().build();
        doc.setId(1L);
        doc.setRatingAvg(new BigDecimal("4.5"));
        doc.setRatingCount(10);
        when(doctorRepository.findById(1L)).thenReturn(java.util.Optional.of(doc));
        when(reviewRepository.countByDoctorIdAndCreatedAtAfter(eq(1L), any(LocalDateTime.class))).thenReturn(2L);
        when(reviewRepository.countReviewsByRatingForDoctor(1L)).thenReturn(List.of());
        when(appointmentRepository.countByDoctorId(1L)).thenReturn(5L);
        when(appointmentRepository.countDistinctPatientsTreatedByDoctorId(1L)).thenReturn(3L);
        when(prescriptionRepository.countByDoctorId(1L)).thenReturn(7L);

        Appointment ap = Appointment.builder()
                .consultationStartedAt(LocalDateTime.of(LocalDate.now(), LocalTime.MIN))
                .consultationEndedAt(LocalDateTime.of(LocalDate.now(), LocalTime.MIN).plusMinutes(30))
                .build();
        when(appointmentRepository.findConsultationsWithDurationByDoctorIdAndStatus(1L, AppointmentStatus.COMPLETED))
                .thenReturn(List.of(ap));

        var res = service.getOverview(1L, 0, 20);
        assertThat(res.getStats().getTotalAppointments()).isEqualTo(5L);
        assertThat(res.getStats().getConsultationHours()).isGreaterThan(BigDecimal.ZERO);
    }
}
