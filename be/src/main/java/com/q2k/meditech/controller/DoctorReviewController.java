package com.q2k.meditech.controller;

import com.q2k.meditech.dto.ReplyReviewDTO;
import com.q2k.meditech.dto.ReviewDTO;
import com.q2k.meditech.dto.ReviewListResponse;
import com.q2k.meditech.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctor/reviews")
public class DoctorReviewController {

    @Autowired
    private ReviewService reviewService;

    // TODO: Replace doctorId parameter with SecurityContext when authentication is implemented
    @GetMapping
    public ResponseEntity<ReviewListResponse> getDoctorReviews(
            @RequestParam Long doctorId,
            @RequestParam(required = false, defaultValue = "0") Integer pageNumber,
            @RequestParam(required = false, defaultValue = "20") Integer pageSize) {

        ReviewListResponse response = reviewService.getDoctorReviews(doctorId, pageNumber, pageSize);
        return ResponseEntity.ok(response);
    }

    // TODO: Replace doctorId parameter with SecurityContext when authentication is implemented
    @PatchMapping("/{id}/reply")
    public ResponseEntity<ReviewDTO> replyToReview(
            @PathVariable Long id,
            @RequestParam Long doctorId,
            @RequestBody ReplyReviewDTO dto) {

        ReviewDTO review = reviewService.replyToReview(id, doctorId, dto);
        return ResponseEntity.ok(review);
    }
}
