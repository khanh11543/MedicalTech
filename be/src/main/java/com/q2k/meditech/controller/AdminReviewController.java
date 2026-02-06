package com.q2k.meditech.controller;

import com.q2k.meditech.dto.ModerateReviewDTO;
import com.q2k.meditech.dto.ReviewDTO;
import com.q2k.meditech.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reviews")
public class AdminReviewController {

    @Autowired
    private ReviewService reviewService;

    @PatchMapping("/{id}/moderate")
    public ResponseEntity<ReviewDTO> moderateReview(
            @PathVariable Long id,
            @RequestBody ModerateReviewDTO dto) {

        ReviewDTO review = reviewService.moderateReview(id, dto);
        return ResponseEntity.ok(review);
    }
}
