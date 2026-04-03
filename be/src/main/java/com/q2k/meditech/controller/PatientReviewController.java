package com.q2k.meditech.controller;

import com.q2k.meditech.dto.ReviewCreateDTO;
import com.q2k.meditech.dto.ReviewDTO;
import com.q2k.meditech.service.FileStorageService;
import com.q2k.meditech.service.ReviewService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/patient/reviews")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Patient Reviews", description = "Patient review management (appointment-based or general)")
public class PatientReviewController {

    private final ReviewService reviewService;
    private final FileStorageService fileStorageService;

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload review image", description = "Upload an image for a review; returns URL to use in create payload")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        String url = fileStorageService.uploadFile("reviews", file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping
    @Operation(summary = "Create review", description = "Submit a review: with appointmentId for appointment-based, or without for general review (testimonial)")
    public ResponseEntity<ReviewDTO> createReview(@RequestBody ReviewCreateDTO dto) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        log.info("POST /patient/reviews - userId: {}, appointmentId: {}, doctorId: {}", currentUserId, dto.getAppointmentId(), dto.getDoctorId());
        ReviewDTO review = reviewService.createReviewForPatient(dto, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }

    @GetMapping("/by-appointment/{appointmentId}")
    @Operation(summary = "Get my review by appointment", description = "Returns the current user's review for a completed appointment (if exists)")
    public ResponseEntity<ReviewDTO> getMyReviewByAppointment(@PathVariable Long appointmentId) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        ReviewDTO review = reviewService.getMyReviewByAppointment(appointmentId, currentUserId);
        return ResponseEntity.ok(review);
    }
}
