package com.q2k.meditech.controller;

import com.q2k.meditech.dto.ModerateReviewDTO;
import com.q2k.meditech.dto.ReviewDTO;
import com.q2k.meditech.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/reviews")
public class AdminReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping
    public ResponseEntity<Page<ReviewDTO>> getAllReviews(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean isVisible,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "10") int pageSize) {
        Page<ReviewDTO> reviews = reviewService.getAllReviews(keyword, isVisible, rating, pageNumber, pageSize);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReviewDTO> getReviewDetail(@PathVariable Long id) {
        ReviewDTO review = reviewService.getReviewById(id);
        return ResponseEntity.ok(review);
    }

    @PatchMapping("/{id}/moderate")
    public ResponseEntity<ReviewDTO> moderateReview(
            @PathVariable Long id,
            @RequestBody ModerateReviewDTO dto) {
        ReviewDTO review = reviewService.moderateReview(id, dto);
        return ResponseEntity.ok(review);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}
