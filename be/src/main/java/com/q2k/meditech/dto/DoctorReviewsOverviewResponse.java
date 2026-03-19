package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorReviewsOverviewResponse {

    // Reviews list + pagination (same shape as ReviewListResponse fields)
    private List<ReviewDTO> reviews;
    private int totalPages;
    private long totalElements;
    private int currentPage;
    private int pageSize;

    // Aggregated stats for the doctor
    private DoctorReviewsStatsDTO stats;
}

