package com.q2k.meditech.controller;

import com.q2k.meditech.dto.ReplyReviewDTO;
import com.q2k.meditech.dto.ReviewDTO;
import com.q2k.meditech.dto.ReviewListResponse;
import com.q2k.meditech.service.DoctorProfileService;
import com.q2k.meditech.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/doctor/reviews")
@RequiredArgsConstructor
@Tag(name = "Doctor Reviews", description = "Doctor view and reply to reviews")
public class DoctorReviewController {

    private final ReviewService reviewService;
    private final DoctorProfileService doctorProfileService;

    @GetMapping
    @Operation(summary = "Get my reviews")
    public ResponseEntity<ReviewListResponse> getDoctorReviews(
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "20") int pageSize) {
        Long doctorId = doctorProfileService.requireDoctor().getId();
        ReviewListResponse response = reviewService.getDoctorReviews(doctorId, pageNumber, pageSize);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/reply")
    @Operation(summary = "Reply to a review")
    public ResponseEntity<ReviewDTO> replyToReview(
            @PathVariable Long id,
            @RequestBody ReplyReviewDTO dto) {
        Long doctorId = doctorProfileService.requireDoctor().getId();
        ReviewDTO review = reviewService.replyToReview(id, doctorId, dto);
        return ResponseEntity.ok(review);
    }
}
