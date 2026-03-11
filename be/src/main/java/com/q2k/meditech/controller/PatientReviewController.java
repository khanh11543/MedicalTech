package com.q2k.meditech.controller;

import com.q2k.meditech.dto.ReviewCreateDTO;
import com.q2k.meditech.dto.ReviewDTO;
import com.q2k.meditech.service.ReviewService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/patient/reviews")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Patient Reviews", description = "Patient review management (appointment-based or general)")
public class PatientReviewController {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private final ReviewService reviewService;

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload review image", description = "Upload an image for a review; returns URL to use in create payload")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("message", "File size exceeds 5MB limit"));
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid file type. Allowed: JPEG, PNG, GIF, WebP"));
        }
        try {
            Path dir = Paths.get(uploadDir, "reviews");
            Files.createDirectories(dir);
            String ext = "";
            String originalName = file.getOriginalFilename();
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf("."));
            }
            String filename = "img_" + UUID.randomUUID().toString().substring(0, 8) + ext;
            Path filePath = dir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            String url = "/uploads/reviews/" + filename;
            return ResponseEntity.ok(Map.of("url", url));
        } catch (IOException e) {
            log.error("Failed to upload review image", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to save file"));
        }
    }

    @PostMapping
    @Operation(summary = "Create review", description = "Submit a review: with appointmentId for appointment-based, or without for general review (testimonial)")
    public ResponseEntity<ReviewDTO> createReview(@RequestBody ReviewCreateDTO dto) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        log.info("POST /patient/reviews - userId: {}, appointmentId: {}, doctorId: {}", currentUserId, dto.getAppointmentId(), dto.getDoctorId());
        ReviewDTO review = reviewService.createReviewForPatient(dto, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }
}
