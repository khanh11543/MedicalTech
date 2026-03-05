package com.q2k.meditech.controller;

import com.q2k.meditech.dto.ReviewCreateDTO;
import com.q2k.meditech.dto.ReviewDTO;
import com.q2k.meditech.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/patient/reviews")
public class PatientReviewController {

    @Autowired
    private ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewDTO> createReview(@RequestBody ReviewCreateDTO dto) {
        ReviewDTO review = reviewService.createReview(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }
}
