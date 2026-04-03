package com.q2k.meditech.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    /** URL prefix for review images — same as WebMvcConfig resource handler. */
    private static final String REVIEW_IMAGES_PREFIX = "/uploads/reviews/";

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public ReviewDTO createReview(ReviewCreateDTO dto) {
        if (dto.getAppointmentId() == null) {
            throw new IllegalArgumentException("appointmentId is required");
        }
        if (dto.getPatientId() == null) {
            throw new IllegalArgumentException("patientId is required");
        }
        if (dto.getRating() == null || dto.getRating() < 1 || dto.getRating() > 5) {
            throw new IllegalArgumentException("rating must be between 1 and 5");
        }
        if (reviewRepository.existsByAppointmentId(dto.getAppointmentId())) {
            throw new IllegalArgumentException("Review already exists for this appointment");
        }
        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", dto.getAppointmentId()));
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", dto.getPatientId()));
        if (!appointment.getPatient().getId().equals(dto.getPatientId())) {
            throw new IllegalArgumentException("Patient does not match appointment");
        }
        Review review = new Review();
        review.setAppointment(appointment);
        review.setPatient(patient);
        review.setDoctor(appointment.getDoctor());
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        review.setIsAnonymous(dto.getIsAnonymous() != null ? dto.getIsAnonymous() : false);
        review.setIsVisible(true);
        Review saved = reviewRepository.save(review);
        if (appointment.getDoctor() != null) {
            updateDoctorRating(appointment.getDoctor().getId());
        }
        return convertToDTO(saved);
    }

    @Transactional
    public ReviewDTO createReviewForPatient(ReviewCreateDTO dto, Long currentUserId) {
        if (dto.getAppointmentId() != null) {
            return createReviewForPatientWithAppointment(dto, currentUserId);
        }
        return createReviewWithoutAppointment(dto, currentUserId);
    }

    /** Create a general review (no appointment) - e.g. from public testimonial form. Patient from current user. */
    @Transactional
    public ReviewDTO createReviewWithoutAppointment(ReviewCreateDTO dto, Long currentUserId) {
        if (dto.getRating() == null || dto.getRating() < 1 || dto.getRating() > 5) {
            throw new IllegalArgumentException("rating must be between 1 and 5");
        }
        if (dto.getComment() == null || dto.getComment().trim().isEmpty()) {
            throw new IllegalArgumentException("comment is required");
        }
        Patient patient = patientRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found for current user"));
        Doctor doctor = null;
        if (dto.getDoctorId() != null) {
            doctor = doctorRepository.findById(dto.getDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", dto.getDoctorId()));
        }
        String imageUrlsJson = null;
        if (dto.getImageUrls() != null && !dto.getImageUrls().isEmpty()) {
            try {
                List<String> normalized = normalizeReviewImageUrls(dto.getImageUrls());
                imageUrlsJson = objectMapper.writeValueAsString(normalized);
            } catch (Exception ignored) {
            }
        }
        Review review = new Review();
        review.setAppointment(null);
        review.setPatient(patient);
        review.setDoctor(doctor);
        review.setRating(dto.getRating());
        review.setComment(dto.getComment().trim());
        review.setImageUrls(imageUrlsJson);
        review.setIsAnonymous(dto.getIsAnonymous() != null ? dto.getIsAnonymous() : false);
        review.setIsVisible(true);
        Review saved = reviewRepository.save(review);
        if (doctor != null) {
            updateDoctorRating(doctor.getId());
        }
        return convertToDTO(saved);
    }

    @Transactional
    public ReviewDTO createReviewForPatientWithAppointment(ReviewCreateDTO dto, Long currentUserId) {
        if (dto.getAppointmentId() == null) {
            throw new IllegalArgumentException("appointmentId is required for appointment-based review");
        }
        if (dto.getRating() == null || dto.getRating() < 1 || dto.getRating() > 5) {
            throw new IllegalArgumentException("rating must be between 1 and 5");
        }
        if (reviewRepository.existsByAppointmentId(dto.getAppointmentId())) {
            throw new IllegalArgumentException("Review already exists for this appointment");
        }
        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", dto.getAppointmentId()));
        if (appointment.getStatus() != com.q2k.meditech.entity.enums.AppointmentStatus.COMPLETED) {
            throw new IllegalArgumentException("Can only review completed appointments");
        }
        Patient patient = patientRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found for current user"));
        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new IllegalArgumentException("You can only review your own appointments");
        }
        Review review = new Review();
        review.setAppointment(appointment);
        review.setPatient(patient);
        review.setDoctor(appointment.getDoctor());
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        review.setIsAnonymous(dto.getIsAnonymous() != null ? dto.getIsAnonymous() : false);
        review.setIsVisible(true);
        Review saved = reviewRepository.save(review);
        if (appointment.getDoctor() != null) {
            updateDoctorRating(appointment.getDoctor().getId());
        }
        return convertToDTO(saved);
    }

    @Transactional(readOnly = true)
    public ReviewListResponse getDoctorReviews(Long doctorId, Integer pageNumber, Integer pageSize) {
        if (doctorId == null) {
            throw new IllegalArgumentException("doctorId is required");
        }
        Pageable pageable = PageRequest.of(
                pageNumber != null && pageNumber >= 0 ? pageNumber : 0,
                pageSize != null && pageSize > 0 ? pageSize : 20
        );
        Page<Review> page = reviewRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId, pageable);
        List<ReviewDTO> reviews = page.getContent().stream().map(this::convertToDTO).collect(Collectors.toList());
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
        if (reviewId == null || doctorId == null || dto.getAdminResponse() == null || dto.getAdminResponse().trim().isEmpty()) {
            throw new IllegalArgumentException("reviewId, doctorId and adminResponse are required");
        }
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));
        if (review.getDoctor() == null || !review.getDoctor().getId().equals(doctorId)) {
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

    @Transactional(readOnly = true)
    public Page<ReviewDTO> getAllReviews(String keyword, Boolean isVisible, Integer rating,
                                         int pageNumber, int pageSize) {
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<Review> page;
        if (keyword != null && !keyword.trim().isEmpty()) {
            page = reviewRepository.searchByKeyword(keyword.trim(), pageable);
        } else if (isVisible != null) {
            page = reviewRepository.findByIsVisibleOrderByCreatedAtDesc(isVisible, pageable);
        } else if (rating != null) {
            page = reviewRepository.findByRatingOrderByCreatedAtDesc(rating, pageable);
        } else {
            page = reviewRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return page.map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public ReviewDTO getReviewById(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));
        return convertToDTO(review);
    }

    @Transactional(readOnly = true)
    public ReviewDTO getMyReviewByAppointment(Long appointmentId, Long currentUserId) {
        if (appointmentId == null) {
            throw new IllegalArgumentException("appointmentId is required");
        }
        if (currentUserId == null) {
            throw new IllegalArgumentException("currentUserId is required");
        }

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        Patient patient = patientRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found for current user"));

        if (appointment.getPatient() == null || !appointment.getPatient().getId().equals(patient.getId())) {
            throw new IllegalArgumentException("You can only access reviews for your own appointments");
        }

        Review review = reviewRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found for appointmentId: " + appointmentId));

        return convertToDTO(review);
    }

    @Transactional
    public void deleteReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));
        Long doctorId = review.getDoctor() != null ? review.getDoctor().getId() : null;
        reviewRepository.delete(review);
        if (doctorId != null) {
            updateDoctorRating(doctorId);
        }
    }

    private void updateDoctorRating(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));
        List<Review> reviews = reviewRepository.findByDoctorIdOrderByCreatedAtDesc(
                doctorId, PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        if (!reviews.isEmpty()) {
            double avgRating = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
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
                (review.getPatient() != null && review.getPatient().getUser() != null ? review.getPatient().getUser().getFullName() : null));
        dto.setDoctorId(review.getDoctor() != null ? review.getDoctor().getId() : null);
        dto.setDoctorName(review.getDoctor() != null ? review.getDoctor().getFullName() : null);
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        List<String> imageUrls = Collections.emptyList();
        if (review.getImageUrls() != null && !review.getImageUrls().isBlank()) {
            try {
                List<String> raw = objectMapper.readValue(review.getImageUrls(), new TypeReference<>() {});
                imageUrls = normalizeReviewImageUrls(raw);
            } catch (Exception ignored) {
            }
        }
        dto.setImageUrls(imageUrls);
        dto.setIsAnonymous(review.getIsAnonymous());
        dto.setIsVisible(review.getIsVisible());
        dto.setAdminResponse(review.getAdminResponse());
        dto.setRespondedAt(review.getRespondedAt());
        dto.setCreatedAt(review.getCreatedAt());
        dto.setUpdatedAt(review.getUpdatedAt());
        return dto;
    }

    /**
     * Normalize review image URLs to full path so all clients (any user/session) can load them.
     * Handles legacy DB values that store only filename (e.g. "img_xxx.jpg").
     */
    private static List<String> normalizeReviewImageUrls(List<String> urls) {
        if (urls == null || urls.isEmpty()) return Collections.emptyList();
        List<String> out = new ArrayList<>(urls.size());
        for (String u : urls) {
            if (u == null || u.isBlank()) continue;
            String trimmed = u.trim();
            if (trimmed.startsWith("http") || trimmed.startsWith("/uploads/")) {
                out.add(trimmed);
            } else {
                out.add(REVIEW_IMAGES_PREFIX + (trimmed.startsWith("/") ? trimmed.substring(1) : trimmed));
            }
        }
        return out;
    }
}
