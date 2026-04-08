package com.q2k.meditech.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.dto.*;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.PatientRepository;
import com.q2k.meditech.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock ReviewRepository reviewRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock PatientRepository patientRepository;
    @Mock DoctorRepository doctorRepository;
    @Mock ObjectMapper objectMapper;

    ReviewService service;

    @BeforeEach
    void setUp() {
        service = new ReviewService();
        ReflectionTestUtils.setField(service, "reviewRepository", reviewRepository);
        ReflectionTestUtils.setField(service, "appointmentRepository", appointmentRepository);
        ReflectionTestUtils.setField(service, "patientRepository", patientRepository);
        ReflectionTestUtils.setField(service, "doctorRepository", doctorRepository);
        ReflectionTestUtils.setField(service, "objectMapper", objectMapper);
    }

    @Test
    void createReview_requiresAppointmentId() {
        ReviewCreateDTO dto = new ReviewCreateDTO();
        dto.setPatientId(1L);
        dto.setRating(5);
        assertThatThrownBy(() -> service.createReview(dto)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createReviewForPatient_withoutAppointment_invalidRating() {
        ReviewCreateDTO dto = new ReviewCreateDTO();
        dto.setAppointmentId(null);
        dto.setRating(10);
        assertThatThrownBy(() -> service.createReviewForPatient(dto, 1L)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createReviewWithoutAppointment_requiresComment() {
        ReviewCreateDTO dto = new ReviewCreateDTO();
        dto.setRating(5);
        dto.setComment("   ");
        assertThatThrownBy(() -> service.createReviewWithoutAppointment(dto, 1L)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createReviewForPatientWithAppointment_notFound() {
        ReviewCreateDTO dto = new ReviewCreateDTO();
        dto.setAppointmentId(9L);
        dto.setPatientId(1L);
        dto.setRating(5);
        when(appointmentRepository.findById(9L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.createReviewForPatientWithAppointment(dto, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getDoctorReviews_requiresDoctorId() {
        assertThatThrownBy(() -> service.getDoctorReviews(null, 0, 10)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void getDoctorReviews_page() {
        when(reviewRepository.findByDoctorIdOrderByCreatedAtDesc(eq(1L), any()))
                .thenReturn(new PageImpl<>(List.of()));
        assertThat(service.getDoctorReviews(1L, 0, 10).getReviews()).isEmpty();
    }

    @Test
    void replyToReview_requiresFields() {
        assertThatThrownBy(() -> service.replyToReview(null, 1L, new ReplyReviewDTO()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void moderateReview_requiresReviewId() {
        assertThatThrownBy(() -> service.moderateReview(null, new ModerateReviewDTO()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void getAllReviews_defaultList() {
        when(reviewRepository.findAllByOrderByCreatedAtDesc(any())).thenReturn(new PageImpl<>(List.of()));
        assertThat(service.getAllReviews(null, null, null, 0, 20).getContent()).isEmpty();
    }

    @Test
    void getReviewById_notFound() {
        when(reviewRepository.findById(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.getReviewById(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getMyReviewByAppointment_requiresIds() {
        assertThatThrownBy(() -> service.getMyReviewByAppointment(null, 1L)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deleteReview_notFound() {
        when(reviewRepository.findById(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.deleteReview(1L)).isInstanceOf(ResourceNotFoundException.class);
    }
}
