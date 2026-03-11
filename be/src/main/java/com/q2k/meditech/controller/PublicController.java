package com.q2k.meditech.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.ContactMessage;
import com.q2k.meditech.entity.Content;
import com.q2k.meditech.entity.Review;
import com.q2k.meditech.repository.ContactMessageRepository;
import com.q2k.meditech.repository.ContentRepository;
import com.q2k.meditech.repository.ReviewRepository;
import com.q2k.meditech.service.PublicDoctorService;
import com.q2k.meditech.service.SpecialtyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

/**
 * Public API Controller for Specialties and Doctors Search
 * All endpoints are publicly accessible (no authentication required)
 */
@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Public API", description = "Public endpoints for specialties and doctor search")
public class PublicController {

    private final SpecialtyService specialtyService;
    private final PublicDoctorService publicDoctorService;
    private final ReviewRepository reviewRepository;
    private final ContentRepository contentRepository;
    private final ContactMessageRepository contactMessageRepository;
    private final ObjectMapper objectMapper;

    // ==================== SPECIALTIES ====================

    /**
     * GET /api/public/specialties
     * List all specialties with optional search and filter
     */
    @GetMapping("/specialties")
    @Operation(
            summary = "List Specialties",
            description = "Get list of medical specialties with optional search and active filter"
    )
    public ResponseEntity<List<SpecialtyDTO>> listSpecialties(
            @Parameter(description = "Search keyword for specialty name")
            @RequestParam(required = false) String q,
            
            @Parameter(description = "Filter by active status")
            @RequestParam(required = false) Boolean isActive
    ) {
        log.info("GET /public/specialties - q: {}, isActive: {}", q, isActive);
        
        List<SpecialtyDTO> specialties = specialtyService.searchSpecialties(q, isActive);
        return ResponseEntity.ok(specialties);
    }

    /**
     * GET /api/public/specialties/{slug}
     * Get a single specialty by slug
     */
    @GetMapping("/specialties/{slug}")
    @Operation(summary = "Get Specialty by Slug", description = "Get detailed information about a specific specialty")
    public ResponseEntity<SpecialtyDTO> getSpecialtyBySlug(
            @Parameter(description = "Specialty slug", required = true)
            @PathVariable String slug
    ) {
        log.info("GET /public/specialties/{}", slug);
        SpecialtyDTO specialty = specialtyService.getSpecialtyBySlug(slug);
        return ResponseEntity.ok(specialty);
    }

    // ==================== DOCTORS SEARCH ====================

    /**
     * GET /api/public/doctors
     * Search doctors with filters and pagination
     */
    @GetMapping("/doctors")
    @Operation(
            summary = "Search Doctors",
            description = "Search doctors with various filters, pagination and sorting"
    )
    public ResponseEntity<Page<DoctorCardDTO>> searchDoctors(
            @Parameter(description = "Search keyword (name, hospital)")
            @RequestParam(required = false) String q,
            
            @Parameter(description = "Filter by specialty ID")
            @RequestParam(required = false) Integer specialtyId,
            
            @Parameter(description = "Filter by city")
            @RequestParam(required = false) String city,
            
            @Parameter(description = "Minimum consultation fee")
            @RequestParam(required = false) BigDecimal minFee,
            
            @Parameter(description = "Maximum consultation fee")
            @RequestParam(required = false) BigDecimal maxFee,
            
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int pageNumber,
            
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int pageSize,
            
            @Parameter(description = "Sort field (rating, fee, experience, name)")
            @RequestParam(defaultValue = "ratingAvg") String sortBy,
            
            @Parameter(description = "Sort direction (asc, desc)")
            @RequestParam(defaultValue = "desc") String sortOrder
    ) {
        log.info("GET /public/doctors - q: {}, specialtyId: {}, city: {}", q, specialtyId, city);
        
        Page<DoctorCardDTO> doctors = publicDoctorService.searchDoctors(
                q, specialtyId, city, minFee, maxFee,
                pageNumber, pageSize, sortBy, sortOrder
        );
        
        return ResponseEntity.ok(doctors);
    }

    /**
     * GET /api/public/doctors/{doctorId}
     * Get doctor detail/profile
     */
    @GetMapping("/doctors/{doctorId}")
    @Operation(
            summary = "Doctor Detail",
            description = "Get detailed information about a specific doctor"
    )
    public ResponseEntity<DoctorDetailDTO> getDoctorDetail(
            @Parameter(description = "Doctor ID", required = true)
            @PathVariable Long doctorId
    ) {
        log.info("GET /public/doctors/{}", doctorId);
        
        DoctorDetailDTO doctor = publicDoctorService.getDoctorDetail(doctorId);
        return ResponseEntity.ok(doctor);
    }

    /**
     * GET /api/public/doctors/{doctorId}/slots
     * Get available time slots for a doctor
     */
    @GetMapping("/doctors/{doctorId}/slots")
    @Operation(
            summary = "Doctor Available Slots",
            description = "Get available time slots for booking with a doctor"
    )
    public ResponseEntity<List<TimeSlotDTO>> getDoctorAvailableSlots(
            @Parameter(description = "Doctor ID", required = true)
            @PathVariable Long doctorId,
            
            @Parameter(description = "Start date (yyyy-MM-dd)")
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            
            @Parameter(description = "End date (yyyy-MM-dd)")
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo
    ) {
        log.info("GET /public/doctors/{}/slots - dateFrom: {}, dateTo: {}", doctorId, dateFrom, dateTo);
        
        List<TimeSlotDTO> slots = publicDoctorService.getAvailableSlots(doctorId, dateFrom, dateTo);
        return ResponseEntity.ok(slots);
    }

    // ==================== REVIEWS ====================

    /**
     * GET /api/public/reviews
     * List visible reviews for public display
     */
    @GetMapping("/reviews")
    @Operation(summary = "Public Reviews", description = "Get visible patient reviews")
    public ResponseEntity<Page<PublicReviewDTO>> getPublicReviews(
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        log.info("GET /public/reviews - page: {}, size: {}", pageNumber, pageSize);

        Page<Review> reviews = reviewRepository.findByIsVisibleTrueOrderByCreatedAtDesc(
                PageRequest.of(pageNumber, pageSize));

        Page<PublicReviewDTO> result = reviews.map(this::mapToPublicReviewDTO);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/public/doctors/{doctorId}/reviews
     * List visible reviews for a specific doctor
     */
    @GetMapping("/doctors/{doctorId}/reviews")
    @Operation(summary = "Doctor Reviews", description = "Get visible reviews for a specific doctor")
    public ResponseEntity<Page<PublicReviewDTO>> getDoctorReviews(
            @PathVariable Long doctorId,
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        log.info("GET /public/doctors/{}/reviews - page: {}, size: {}", doctorId, pageNumber, pageSize);

        Page<Review> reviews = reviewRepository.findByDoctorIdAndIsVisibleTrueOrderByCreatedAtDesc(
                doctorId, PageRequest.of(pageNumber, pageSize));

        Page<PublicReviewDTO> result = reviews.map(this::mapToPublicReviewDTO);
        return ResponseEntity.ok(result);
    }

    // ==================== CONTENT / FAQ ====================

    /**
     * GET /api/public/contents?type=FAQ
     * Get published content by type (FAQ, ARTICLE, etc.)
     */
    @GetMapping("/contents")
    @Operation(summary = "Public Content", description = "Get published content by type")
    public ResponseEntity<Page<PublicContentDTO>> getPublicContents(
            @Parameter(description = "Content type: FAQ, ARTICLE, NEWS, GUIDE")
            @RequestParam(defaultValue = "FAQ") String type,
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "50") int pageSize
    ) {
        log.info("GET /public/contents - type: {}", type);

        Content.ContentType contentType = Content.ContentType.valueOf(type.toUpperCase());
        Page<Content> contents = contentRepository.findByTypeAndStatusOrderByIsPinnedDescCreatedAtDesc(
                contentType, Content.ContentStatus.PUBLISHED, PageRequest.of(pageNumber, pageSize));

        Page<PublicContentDTO> result = contents.map(c -> PublicContentDTO.builder()
                .id(c.getId())
                .title(c.getTitle())
                .body(c.getBody())
                .summary(c.getSummary())
                .type(c.getType().name())
                .author(c.getAuthor())
                .thumbnailUrl(c.getThumbnailUrl())
                .isPinned(c.getIsPinned())
                .createdAt(c.getCreatedAt() != null ? c.getCreatedAt().toString() : null)
                .build());

        return ResponseEntity.ok(result);
    }

    // ==================== CONTACT ====================

    /**
     * POST /api/public/contact
     * Submit a contact message (no auth required)
     */
    @PostMapping("/contact")
    @Operation(summary = "Submit Contact Message", description = "Submit a contact form message")
    public ResponseEntity<java.util.Map<String, String>> submitContactMessage(
            @RequestBody ContactMessageDTO dto
    ) {
        log.info("POST /public/contact - name: {}, email: {}", dto.getName(), dto.getEmail());

        ContactMessage message = ContactMessage.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .subject(dto.getSubject())
                .message(dto.getMessage())
                .build();

        contactMessageRepository.save(message);

        return ResponseEntity.ok(java.util.Map.of("message", "Your message has been sent successfully."));
    }

    // ==================== HELPERS ====================

    private PublicReviewDTO mapToPublicReviewDTO(Review review) {
        String patientName = "Anonymous";
        if (!Boolean.TRUE.equals(review.getIsAnonymous()) && review.getPatient() != null) {
            patientName = review.getPatient().getFullName();
        }

        String doctorName = review.getDoctor() != null ? review.getDoctor().getFullName() : "";
        String doctorSpecialty = "";
        if (review.getDoctor() != null && review.getDoctor().getSpecialties() != null
                && !review.getDoctor().getSpecialties().isEmpty()) {
            doctorSpecialty = review.getDoctor().getSpecialties().get(0).getName();
        }

        List<String> imageUrls = Collections.emptyList();
        if (review.getImageUrls() != null && !review.getImageUrls().isBlank()) {
            try {
                imageUrls = objectMapper.readValue(review.getImageUrls(), new TypeReference<>() {});
            } catch (Exception ignored) {
            }
        }

        return PublicReviewDTO.builder()
                .id(review.getId())
                .patientName(patientName)
                .doctorName(doctorName)
                .doctorSpecialty(doctorSpecialty)
                .rating(review.getRating())
                .comment(review.getComment())
                .imageUrls(imageUrls)
                .isAnonymous(review.getIsAnonymous())
                .createdAt(review.getCreatedAt() != null ? review.getCreatedAt().toString() : null)
                .build();
    }
}
