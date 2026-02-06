package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.entity.Review;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.PatientRepository;
import com.q2k.meditech.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Transactional
    public ReviewDTO createReview(ReviewCreateDTO dto) {
        // Validate required fields
        if (dto.getAppointmentId() == null) {
            throw new IllegalArgumentException("appointmentId is required");
        }
        if (dto.getPatientId() == null) {
            throw new IllegalArgumentException("patientId is required");
        }
        if (dto.getRating() == null || dto.getRating() < 1 || dto.getRating() > 5) {
            throw new IllegalArgumentException("rating must be between 1 and 5");
        }

        // Check if review already exists for this appointment
        if (reviewRepository.existsByAppointmentId(dto.getAppointmentId())) {
            throw new IllegalArgumentException("Review already exists for this appointment");
        }

        // Fetch appointment
        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", dto.getAppointmentId()));

        // Fetch patient
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", dto.getPatientId()));

        // Validate patient matches appointment
        if (!appointment.getPatient().getId().equals(dto.getPatientId())) {
            throw new IllegalArgumentException("Patient does not match appointment");
        }

        // Create review
        Review review = new Review();
        review.setAppointment(appointment);
        review.setPatient(patient);
        review.setDoctor(appointment.getDoctor());
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        review.setIsAnonymous(dto.getIsAnonymous() != null ? dto.getIsAnonymous() : false);
        review.setIsVisible(true);

        Review saved = reviewRepository.save(review);

        // Update doctor rating
        updateDoctorRating(appointment.getDoctor().getId());

        return convertToDTO(saved);
    }

    public ReviewListResponse getDoctorReviews(Long doctorId, Integer pageNumber, Integer pageSize) {
        if (doctorId == null) {
            throw new IllegalArgumentException("doctorId is required");
        }

        Pageable pageable = PageRequest.of(
                pageNumber != null && pageNumber >= 0 ? pageNumber : 0,
                pageSize != null && pageSize > 0 ? pageSize : 20
        );

        Page<Review> page = reviewRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId, pageable);

        List<ReviewDTO> reviews = page.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        ReviewListResponse response = new ReviewListResponse();
        response.setReviews(reviews);
        response.setTotalPages(page.getTotalPages());
        response.setTotalElements(page.getTotalElements());
        response.setCurrentPage(page.getNumber());
        response.setPageSize(page.getSize());

        return response;
    }

    @Transactional
    public ReviewDTO replyToReview(Long reviewId, Long doctorId, ReplyReviewDTO dto) {
        if (reviewId == null) {
            throw new IllegalArgumentException("reviewId is required");
        }
        if (doctorId == null) {
            throw new IllegalArgumentException("doctorId is required");
        }
        if (dto.getAdminResponse() == null || dto.getAdminResponse().trim().isEmpty()) {
            throw new IllegalArgumentException("adminResponse is required");
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        // Verify the review belongs to this doctor
        if (!review.getDoctor().getId().equals(doctorId)) {
            throw new IllegalArgumentException("Review does not belong to this doctor");
        }

        review.setAdminResponse(dto.getAdminResponse());
        review.setRespondedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);
        return convertToDTO(saved);
    }

    @Transactional
    public ReviewDTO moderateReview(Long reviewId, ModerateReviewDTO dto) {
        if (reviewId == null) {
            throw new IllegalArgumentException("reviewId is required");
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (dto.getIsVisible() != null) {
            review.setIsVisible(dto.getIsVisible());
        }

        if (dto.getAdminResponse() != null && !dto.getAdminResponse().trim().isEmpty()) {
            review.setAdminResponse(dto.getAdminResponse());
            review.setRespondedAt(LocalDateTime.now());
        }

        Review saved = reviewRepository.save(review);
        return convertToDTO(saved);
    }

    private void updateDoctorRating(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        List<Review> reviews = reviewRepository.findByDoctorIdOrderByCreatedAtDesc(
                doctorId, 
                PageRequest.of(0, Integer.MAX_VALUE)
        ).getContent();

        if (!reviews.isEmpty()) {
            double avgRating = reviews.stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);

            doctor.setRatingAvg(java.math.BigDecimal.valueOf(avgRating).setScale(2, java.math.RoundingMode.HALF_UP));
            doctor.setRatingCount(reviews.size());
            doctorRepository.save(doctor);
        }
    }

    private ReviewDTO convertToDTO(Review review) {
        ReviewDTO dto = new ReviewDTO();
        dto.setId(review.getId());
        dto.setAppointmentId(review.getAppointment() != null ? review.getAppointment().getId() : null);
        dto.setPatientId(review.getPatient() != null ? review.getPatient().getId() : null);
        dto.setPatientName(review.getIsAnonymous() ? "Anonymous" : 
                (review.getPatient() != null ? review.getPatient().getFullName() : null));
        dto.setDoctorId(review.getDoctor() != null ? review.getDoctor().getId() : null);
        dto.setDoctorName(review.getDoctor() != null ? review.getDoctor().getFullName() : null);
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setIsAnonymous(review.getIsAnonymous());
        dto.setIsVisible(review.getIsVisible());
        dto.setAdminResponse(review.getAdminResponse());
        dto.setRespondedAt(review.getRespondedAt());
        dto.setCreatedAt(review.getCreatedAt());
        dto.setUpdatedAt(review.getUpdatedAt());
        return dto;
    }
}
